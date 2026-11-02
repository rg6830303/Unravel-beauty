import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendTemplate, ERR, pool } from "@/lib/whatsapp";
import { getSettings, inQuietHours, nextAllowedSend, TIER_LIMITS } from "@/lib/settings";
import { pauseAllCampaigns, pauseCampaign, refreshPhoneHealth } from "@/lib/guard";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

const CONCURRENCY = 20;
const BENIGN_FAILS = [...ERR.NOT_ON_WHATSAPP, ...ERR.USER_MARKETING_CAP, ...ERR.OPTED_OUT_MARKETING];

// Called every minute (Vercel Cron on Pro, or Supabase pg_cron on any plan).
export async function GET(req: NextRequest) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const started = Date.now();
  const deadline = started + (maxDuration - 30) * 1000;
  const s = await getSettings();

  await db.rpc("release_stuck_messages");

  // promote scheduled campaigns
  const nowIso = new Date().toISOString();
  await db.from("campaigns").update({ status: "running" }).eq("status", "scheduled").lte("scheduled_at", nowIso);

  const { data: running } = await db.from("campaigns").select("*").eq("status", "running");
  if (!running?.length) return NextResponse.json({ idle: true });
  const byId = new Map(running.map((c) => [c.id, c]));

  // number health + Meta daily messaging tier (unique recipients per 24h)
  const health = await refreshPhoneHealth();
  if (health?.quality_rating === "RED") return NextResponse.json({ paused: "quality RED" });
  const limit = s.daily_cap_override ?? TIER_LIMITS[health?.messaging_limit_tier ?? ""] ?? 250;
  const { data: used } = await db.rpc("unique_recipients_24h");
  const remaining = Math.floor(limit * 0.95) - (used ?? 0);
  if (remaining <= 0) return NextResponse.json({ capped: true, limit, used });

  // approved + marketing template check, once per run
  const tplNames = [...new Set(running.map((c) => c.template_name))];
  const { data: tpls } = await db.from("templates").select("name,language,status,category").in("name", tplNames);
  const tplOk = (name: string, lang: string) => {
    const t = tpls?.find((x) => x.name === name && x.language === lang);
    return !!t && t.status === "APPROVED" && t.category === "MARKETING";
  };

  const perMinute = Math.max(...running.map((c) => c.rate_per_minute ?? 600));
  const { data: jobs } = await db.rpc("claim_messages", { batch: Math.min(perMinute, remaining, 3000) });

  let sent = 0, skipped = 0, failed = 0, requeued = 0;
  let halt = false;
  const requeue = async (job: any, at: Date, extra: object = {}) => {
    requeued++;
    await db.from("messages").update({ status: "queued", next_attempt_at: at.toISOString(), attempts: Math.max(job.attempts - 1, 0), ...extra }).eq("id", job.id);
  };
  const skip = async (job: any, why: string) => {
    skipped++;
    await db.from("messages").update({ status: "skipped", error_title: why }).eq("id", job.id);
  };

  const contactIds = [...new Set((jobs ?? []).map((j: any) => j.contact_id))];
  const contacts = new Map<string, any>();
  for (let i = 0; i < contactIds.length; i += 500) {
    const { data } = await db.from("contacts").select("*").in("id", contactIds.slice(i, i + 500));
    for (const c of data ?? []) contacts.set(c.id, c);
  }

  await pool(jobs ?? [], CONCURRENCY, async (job: any) => {
    if (halt || Date.now() > deadline) return requeue(job, new Date());
    const camp = job.campaign_id ? byId.get(job.campaign_id) : null;
    if (job.campaign_id && !camp) return requeue(job, new Date(Date.now() + 60_000)); // paused: leave queued

    if (camp && !tplOk(camp.template_name, camp.template_language)) {
      await pauseCampaign(camp.id, `Template ${camp.template_name} is not APPROVED/MARKETING`);
      byId.delete(camp.id);
      return requeue(job, new Date(Date.now() + 3600e3));
    }

    const c = contacts.get(job.contact_id);
    // final guards — never message flagged / opted-out / burnt-out contacts
    if (!c || c.wa_status === "invalid" || !c.opted_in) return skip(job, "invalid or opted-out contact");
    if (c.unread_streak >= s.sunset_after) return skip(job, `sunset: ${c.unread_streak} unread marketing messages`);
    if (c.last_marketing_at && Date.now() - new Date(c.last_marketing_at).getTime() < s.frequency_cap_days * 864e5 - 3600e3)
      return skip(job, `frequency cap (${s.frequency_cap_days}d)`);
    if (inQuietHours(s)) return requeue(job, nextAllowedSend(s, new Date()));

    const p = job.payload;
    const r = await sendTemplate(c.phone, p.template, p.language, p.vars, p.header);
    if (r.ok) {
      sent++;
      const t = new Date().toISOString();
      await db.from("messages").update({ status: "sent", wa_message_id: r.id, sent_at: t, updated_at: t }).eq("id", job.id);
      await db.from("contacts").update({ last_marketing_at: t }).eq("id", c.id);
      return;
    }

    if (ERR.RATE_LIMIT.includes(r.code)) {
      halt = true;
      return requeue(job, new Date(Date.now() + 2 ** Math.min(job.attempts, 5) * 30_000), { error_code: r.code, error_title: r.title });
    }
    if (ERR.PAYMENT.includes(r.code) || ERR.ACCOUNT.includes(r.code)) {
      halt = true;
      await pauseAllCampaigns(`Meta error ${r.code}: ${r.title}`);
      return requeue(job, new Date(Date.now() + 3600e3), { error_code: r.code, error_title: r.title });
    }
    if (ERR.BAD_TEMPLATE.includes(r.code) && camp) {
      await pauseCampaign(camp.id, `Meta error ${r.code}: ${r.title}`);
      byId.delete(camp.id);
      return requeue(job, new Date(Date.now() + 3600e3), { error_code: r.code, error_title: r.title });
    }
    if (ERR.RETRYABLE.includes(r.code) && job.attempts < 5)
      return requeue(job, new Date(Date.now() + 2 ** job.attempts * 60_000), { error_code: r.code, error_title: r.title });

    failed++;
    await db.from("messages").update({ status: "failed", error_code: r.code, error_title: r.title }).eq("id", job.id);
    if (ERR.NOT_ON_WHATSAPP.includes(r.code))
      await db.from("contacts").update({ wa_status: "invalid", wa_checked_at: new Date().toISOString() }).eq("id", c.id);
  });

  // circuit breaker: pause a campaign whose recent sends are failing for systemic reasons
  for (const c of byId.values()) {
    const { data: recent } = await db.from("messages").select("status,error_code").eq("campaign_id", c.id)
      .in("status", ["sent", "delivered", "read", "failed"]).order("updated_at", { ascending: false }).limit(40);
    if ((recent?.length ?? 0) >= 20) {
      const bad = recent!.filter((m) => m.status === "failed" && !BENIGN_FAILS.includes(m.error_code)).length;
      if ((bad / recent!.length) * 100 > s.auto_pause_fail_pct)
        await pauseCampaign(c.id, `Auto-paused: ${bad}/${recent!.length} recent sends failed`);
    }
  }

  // mark finished campaigns
  for (const c of byId.values()) {
    const { count } = await db.from("messages").select("id", { count: "exact", head: true })
      .eq("campaign_id", c.id).in("status", ["queued", "sending"]);
    if (!count) await db.from("campaigns").update({ status: "completed" }).eq("id", c.id).eq("status", "running");
  }
  return NextResponse.json({ claimed: jobs?.length ?? 0, sent, skipped, failed, requeued, ms: Date.now() - started });
}
