import { NextRequest, NextResponse } from "next/server";
import { waitUntil } from "@vercel/functions";
import { db } from "@/lib/db";
import { verifySignature, sendText, markRead, ERR } from "@/lib/whatsapp";
import { generateReply } from "@/lib/ai";
import { getSettings, hourIn, setSetting } from "@/lib/settings";
import { pauseAllCampaigns, refreshPhoneHealth } from "@/lib/guard";

export const maxDuration = 300;

// Meta verification handshake
export async function GET(req: NextRequest) {
  const s = req.nextUrl.searchParams;
  if (s.get("hub.mode") === "subscribe" && s.get("hub.verify_token") === process.env.WA_VERIFY_TOKEN)
    return new NextResponse(s.get("hub.challenge"), { status: 200 });
  return new NextResponse("forbidden", { status: 403 });
}

const STOP_WORDS = ["stop", "unsubscribe", "opt out", "optout", "stop promotions", "stop all"];
const START_WORDS = ["start", "subscribe"];
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Acknowledge Meta immediately (it retries and eventually disables slow webhooks), process in the background.
export async function POST(req: NextRequest) {
  const raw = await req.text();
  if (!verifySignature(raw, req.headers.get("x-hub-signature-256")))
    return new NextResponse("bad signature", { status: 401 });

  let body: any;
  try { body = JSON.parse(raw); } catch { return new NextResponse("bad json", { status: 400 }); }
  waitUntil(processBody(body).catch((e) => console.error("webhook processing failed", e)));
  return NextResponse.json({ ok: true });
}

async function processBody(body: any) {
  for (const entry of body.entry ?? [])
    for (const change of entry.changes ?? []) {
      const v = change.value ?? {};
      switch (change.field) {
        case "messages":
          for (const st of v.statuses ?? []) await handleStatus(st);
          for (const msg of v.messages ?? []) {
            const name = v.contacts?.find((c: any) => c.wa_id === msg.from)?.profile?.name;
            await handleInbound(msg, name);
          }
          break;
        case "phone_number_quality_update":
          await handleQuality(v);
          break;
        case "message_template_status_update":
        case "message_template_quality_update":
        case "template_category_update":
          await handleTemplate(change.field, v);
          break;
        case "account_update":
        case "account_alerts":
          await handleAccount(v);
          break;
      }
    }
}

async function once(id: string, kind: string) {
  const { error } = await db.from("wa_events").insert({ id, kind });
  return !error; // unique violation => already processed
}

async function handleQuality(v: any) {
  const cur = await getSettings();
  await setSetting("phone_health", { ...cur.phone_health, messaging_limit_tier: v.current_limit ?? cur.phone_health.messaging_limit_tier, checked_at: null });
  const h = await refreshPhoneHealth(true);
  if (v.event === "FLAGGED" || h?.quality_rating === "RED")
    await pauseAllCampaigns(`Number ${v.event ?? "quality"} alert from Meta — paused automatically`);
}

async function handleTemplate(field: string, v: any) {
  const name = v.message_template_name, lang = v.message_template_language;
  if (!name) return;
  const upd: any = { synced_at: new Date().toISOString() };
  if (field === "message_template_status_update") upd.status = v.event;           // APPROVED | REJECTED | PAUSED | DISABLED ...
  if (field === "message_template_quality_update") upd.quality_score = v.new_quality_score;
  if (field === "template_category_update") upd.category = v.new_category;
  let q = db.from("templates").update(upd).eq("name", name);
  if (lang) q = q.eq("language", lang);
  await q;
  // a paused/disabled/re-categorised template must never keep sending as marketing
  const bad = (field === "message_template_status_update" && ["PAUSED", "DISABLED", "REJECTED"].includes(v.event)) ||
    (field === "template_category_update" && v.new_category !== "MARKETING") ||
    (field === "message_template_quality_update" && v.new_quality_score === "RED");
  if (bad)
    await db.from("campaigns").update({ status: "paused", pause_reason: `Template ${name}: ${v.event ?? v.new_category ?? v.new_quality_score}` })
      .eq("template_name", name).in("status", ["running", "scheduled"]);
}

async function handleAccount(v: any) {
  const ev = String(v.event ?? v.alert_type ?? "");
  if (/DISABLED|RESTRICT|VIOLATION|BAN|LOCKED/i.test(ev)) await pauseAllCampaigns(`Account alert: ${ev}`);
}

async function findMessage(wamid: string) {
  // Meta's "sent/delivered" webhook can beat our own DB write of the wamid — retry briefly.
  for (const wait of [0, 1500, 4000, 9000]) {
    if (wait) await sleep(wait);
    const { data } = await db.from("messages").select("id,status,contact_id,campaign_id,type,attempts").eq("wa_message_id", wamid).maybeSingle();
    if (data) return data;
  }
  return null;
}

async function handleStatus(st: any) {
  const err = st.errors?.[0];
  const rank: Record<string, number> = { sent: 1, delivered: 2, read: 3, failed: 4 };
  const m = await findMessage(st.id);
  if (!m) return;
  if (!(await once(`${st.id}:${st.status}`, "status"))) return;
  // never downgrade (webhooks can arrive out of order)
  if ((rank[m.status] ?? 0) >= (rank[st.status] ?? 0) && st.status !== "failed") return;

  const ts = st.timestamp ? new Date(Number(st.timestamp) * 1000).toISOString() : new Date().toISOString();
  const upd: any = { status: st.status, error_code: err?.code ?? null, error_title: err?.error_data?.details ?? err?.title ?? null, updated_at: ts };
  if (st.status === "sent") upd.sent_at = ts;
  if (st.status === "delivered") upd.delivered_at = ts;
  if (st.status === "read") { upd.read_at = ts; upd.delivered_at = upd.delivered_at ?? ts; }
  await db.from("messages").update(upd).eq("id", m.id);

  const isMarketing = m.type === "template" && !!m.campaign_id;
  const settings = await getSettings();

  if (st.status === "delivered" || st.status === "read") {
    const { data: c } = await db.from("contacts").select("unread_streak,engagement_score").eq("id", m.contact_id).single();
    const cu: any = { wa_status: "valid", wa_checked_at: ts, marketing_fail_count: 0 };
    if (st.status === "delivered" && isMarketing) cu.unread_streak = (c?.unread_streak ?? 0) + 1;
    if (st.status === "read") {
      cu.unread_streak = 0; cu.last_read_at = ts; cu.best_hour = hourIn(settings.timezone, new Date(ts));
      cu.engagement_score = (c?.engagement_score ?? 0) + 2;
    }
    await db.from("contacts").update(cu).eq("id", m.contact_id);
  }

  if (st.status === "failed" && err) {
    if (ERR.NOT_ON_WHATSAPP.includes(err.code))
      await db.from("contacts").update({ wa_status: "invalid", wa_checked_at: ts }).eq("id", m.contact_id);
    else if (ERR.USER_MARKETING_CAP.includes(err.code)) {
      // Meta capped this user. Re-queue (max 2 more tries) 26h later — Meta advises not retrying immediately.
      const { data: c } = await db.from("contacts").select("marketing_fail_count").eq("id", m.contact_id).single();
      await db.from("contacts").update({ marketing_fail_count: (c?.marketing_fail_count ?? 0) + 1 }).eq("id", m.contact_id);
      if ((m.attempts ?? 9) < 3)
        await db.from("messages").update({
          status: "queued", wa_message_id: null, next_attempt_at: new Date(Date.now() + 26 * 3600e3).toISOString(),
        }).eq("id", m.id);
    } else if (ERR.OPTED_OUT_MARKETING.includes(err.code))
      await db.from("contacts").update({ opted_in: false, opted_out_at: ts }).eq("id", m.contact_id);
    else if (ERR.PAYMENT.includes(err.code) || ERR.ACCOUNT.includes(err.code))
      await pauseAllCampaigns(`Meta error ${err.code}: ${err.title ?? ""}`);
  }
}

async function handleInbound(msg: any, profileName?: string) {
  const now = new Date().toISOString();
  const settings = await getSettings();
  const { data: contact } = await db.from("contacts").upsert(
    { phone: msg.from, wa_status: "valid", wa_checked_at: now, last_inbound_at: now, unread_streak: 0,
      best_hour: hourIn(settings.timezone), ...(profileName ? { name: profileName } : {}) },
    { onConflict: "phone" }
  ).select().single();
  if (!contact) return;
  await db.from("contacts").update({ engagement_score: (contact.engagement_score ?? 0) + 3 }).eq("id", contact.id);

  const text: string =
    msg.text?.body ?? msg.button?.text ?? msg.interactive?.button_reply?.title ??
    msg.interactive?.list_reply?.title ?? (msg.type ? `[${msg.type}]` : "");

  const { error } = await db.from("messages").insert({
    contact_id: contact.id, direction: "in", type: msg.type, body: text, payload: msg, wa_message_id: msg.id, status: "received",
  });
  if (error?.code === "23505") return; // duplicate webhook delivery
  markRead(msg.id).catch(() => {});

  const lower = text.trim().toLowerCase();
  if (STOP_WORDS.includes(lower)) {
    await db.from("contacts").update({ opted_in: false, opted_out_at: now }).eq("id", contact.id);
    return reply(contact.id, msg.from, "You've been unsubscribed. Reply START to subscribe again.");
  }
  if (START_WORDS.includes(lower)) {
    await db.from("contacts").update({ opted_in: true, opted_out_at: null, unread_streak: 0 }).eq("id", contact.id);
    return reply(contact.id, msg.from, "You're subscribed again. Thanks!");
  }

  // 1) keyword automations
  const { data: rules } = await db.from("automations").select("*").eq("active", true);
  const hit = rules?.find((r) =>
    r.match_type === "exact" ? lower === r.keyword.toLowerCase() : lower.includes(r.keyword.toLowerCase()));
  if (hit) return reply(contact.id, msg.from, hit.reply);

  // 2) AI agent
  if (contact.ai_enabled && process.env.ANTHROPIC_API_KEY) {
    try {
      const ai = await generateReply(contact.id);
      if (ai) return reply(contact.id, msg.from, ai, true);
    } catch (e) {
      console.error("AI reply failed", e);
    }
  }
}

async function reply(contactId: string, to: string, text: string, isAi = false) {
  const r = await sendText(to, text);
  await db.from("messages").insert({
    contact_id: contactId, direction: "out", body: text, is_ai: isAi,
    status: r.ok ? "sent" : "failed", wa_message_id: r.ok ? r.id : null, sent_at: new Date().toISOString(),
    error_code: r.ok ? null : r.code, error_title: r.ok ? null : r.title,
  });
}
