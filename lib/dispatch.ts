import { db } from "./db";
import { sendTemplate, pool } from "./whatsapp";
import { ERR } from "./retry";
import { handleFailure, logAttempt } from "./delivery";
import { getSettings, inQuietHours, nextAllowedSend, setSetting, TIER_LIMITS } from "./settings";
import { pauseCampaign, refreshPhoneHealth } from "./guard";

const CONCURRENCY = 20;
const CHUNK = 200;
// failures that say nothing about the health of the campaign itself
const BENIGN_FAILS = [...ERR.NOT_ON_WHATSAPP, ...ERR.USER_MARKETING_CAP, ...ERR.OPTED_OUT_MARKETING, ...ERR.RATE_LIMIT, ...ERR.PAIR_RATE_LIMIT];

// One pass of the outreach loop. Called every minute by the scheduler; each pass keeps claiming queued
// messages (first sends and due retries alike) until the minute's budget or time is used up.
export async function runDispatch(budgetMs = 50_000): Promise<Record<string, any>> {
  const started = Date.now();
  const result = await pass(started + budgetMs);
  const run = { at: new Date().toISOString(), ms: Date.now() - started, ...result };
  await setSetting("dispatcher_last_run", run);
  return run;
}

async function pass(deadline: number): Promise<Record<string, unknown>> {
  const s = await getSettings();
  await db.rpc("release_stuck_messages");

  // promote scheduled campaigns
  await db.from("campaigns").update({ status: "running" }).eq("status", "scheduled").lte("scheduled_at", new Date().toISOString());

  const { data: running } = await db.from("campaigns").select("*").eq("status", "running");
  if (!running?.length) return { idle: true };
  const byId = new Map(running.map((c) => [c.id, c]));

  // number health + Meta daily messaging tier (unique recipients per 24h)
  const health = await refreshPhoneHealth();
  if (health?.quality_rating === "RED") return { paused: "quality RED" };
  const limit = s.daily_cap_override ?? TIER_LIMITS[health?.messaging_limit_tier ?? ""] ?? 250;
  const { data: used } = await db.rpc("unique_recipients_24h");
  const remaining = Math.floor(limit * 0.95) - (used ?? 0);
  if (remaining <= 0) return { capped: true, limit, used };

  // approved + marketing template check, once per run
  const tplNames = [...new Set(running.map((c) => c.template_name))];
  const { data: tpls } = await db.from("templates").select("name,language,status,category").in("name", tplNames);
  const tplOk = (name: string, lang: string) => {
    const t = tpls?.find((x) => x.name === name && x.language === lang);
    return !!t && t.status === "APPROVED" && t.category === "MARKETING";
  };

  let claimed = 0, sent = 0, skipped = 0, failed = 0, retried = 0, deferred = 0;
  let halt = false;
  const defer = async (job: any, at: Date) => {
    deferred++;
    await db.from("messages").update({ status: "queued", next_attempt_at: at.toISOString() }).eq("id", job.id);
  };
  const skip = async (job: any, why: string) => {
    skipped++;
    await db.from("messages").update({ status: "skipped", error_title: why }).eq("id", job.id);
  };

  const send = async (job: any, contacts: Map<string, any>) => {
    if (halt || Date.now() > deadline) return defer(job, new Date());
    const camp = job.campaign_id ? byId.get(job.campaign_id) : null;
    if (job.campaign_id && !camp) return defer(job, new Date(Date.now() + 60_000)); // paused mid-run: leave queued

    if (camp && !tplOk(camp.template_name, camp.template_language)) {
      await pauseCampaign(camp.id, `Template ${camp.template_name} is not APPROVED/MARKETING`);
      byId.delete(camp.id);
      return defer(job, new Date(Date.now() + 3600e3));
    }

    const c = contacts.get(job.contact_id);
    const retry = (job.retry_count ?? 0) > 0;
    // final guards — never message flagged / opted-out / burnt-out contacts
    if (!c || c.wa_status === "invalid" || !c.opted_in) return skip(job, "invalid or opted-out contact");
    if (job.expires_at && new Date(job.expires_at).getTime() < Date.now()) {
      failed++;
      await db.from("messages").update({ status: "failed", error_title: `${job.error_title ?? "not sent"} (retry window ended)` }).eq("id", job.id);
      return;
    }
    if (!retry && c.unread_streak >= s.sunset_after) return skip(job, `sunset: ${c.unread_streak} unread marketing messages`);
    // Frequency cap delays a first send instead of dropping it. Retries re-send a message that never arrived,
    // so the earlier failed attempt must not count against the cap.
    if (!retry && c.last_marketing_at) {
      const free = new Date(c.last_marketing_at).getTime() + s.frequency_cap_days * 864e5 - 3600e3;
      if (free > Date.now()) return defer(job, nextAllowedSend(s, new Date(free)));
    }
    if (inQuietHours(s)) return defer(job, nextAllowedSend(s, new Date()));

    const p = job.payload;
    const r = await sendTemplate(c.phone, p.template, p.language, p.vars, p.header, p.header_format);
    const t = new Date().toISOString();
    if (r.ok) {
      sent++;
      await db.from("messages").update({
        status: "sent", wa_message_id: r.id, sent_at: t, updated_at: t, attempts: (job.attempts ?? 0) + 1, error_code: null, error_title: null,
      }).eq("id", job.id);
      await db.from("contacts").update({ last_marketing_at: t }).eq("id", c.id);
      await logAttempt(job, "api", true, "sent");
      return;
    }

    await db.from("messages").update({ attempts: (job.attempts ?? 0) + 1 }).eq("id", job.id);
    const d = await handleFailure(job, r.code, r.title, "api", s.max_retries);
    if (d.action === "retry") { retried++; if (d.halt) halt = true; }
    else if (d.action === "pause_all") { halt = true; byId.clear(); }
    else if (d.action === "pause_campaign") byId.delete(job.campaign_id);
    else failed++;
  };

  let budget = Math.min(Math.max(...running.map((c) => c.rate_per_minute ?? 600)), remaining);
  while (budget > 0 && !halt && Date.now() < deadline) {
    const { data: jobs } = await db.rpc("claim_messages", { batch: Math.min(budget, CHUNK) });
    if (!jobs?.length) break;
    claimed += jobs.length;
    budget -= jobs.length;

    const ids = [...new Set(jobs.map((j: any) => j.contact_id))];
    const { data: cs } = await db.from("contacts").select("*").in("id", ids);
    const contacts = new Map<string, any>((cs ?? []).map((c: any) => [c.id, c]));
    await pool(jobs, CONCURRENCY, (job: any) => send(job, contacts));
  }

  // circuit breaker: pause a campaign whose recent sends are failing for systemic reasons
  for (const c of byId.values()) {
    const { data: recent } = await db.from("send_attempts").select("ok,error_code").eq("campaign_id", c.id)
      .order("created_at", { ascending: false }).limit(40);
    if ((recent?.length ?? 0) >= 20) {
      const bad = recent!.filter((a) => !a.ok && !BENIGN_FAILS.includes(a.error_code)).length;
      if ((bad / recent!.length) * 100 > s.auto_pause_fail_pct) {
        await pauseCampaign(c.id, `Auto-paused: ${bad}/${recent!.length} recent sends failed`);
        byId.delete(c.id);
      }
    }
  }

  // a campaign is complete only when nothing is waiting — including retries scheduled for later
  for (const c of byId.values()) {
    const { count } = await db.from("messages").select("id", { count: "exact", head: true })
      .eq("campaign_id", c.id).in("status", ["queued", "sending"]);
    if (!count) await db.from("campaigns").update({ status: "completed" }).eq("id", c.id).eq("status", "running");
  }
  return { claimed, sent, retried, deferred, skipped, failed };
}
