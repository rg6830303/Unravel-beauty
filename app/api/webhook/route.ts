import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifySignature, sendText, markRead, ERR } from "@/lib/whatsapp";
import { generateReply } from "@/lib/ai";

export const maxDuration = 60;

// Meta verification handshake
export async function GET(req: NextRequest) {
  const s = req.nextUrl.searchParams;
  if (s.get("hub.mode") === "subscribe" && s.get("hub.verify_token") === process.env.WA_VERIFY_TOKEN)
    return new NextResponse(s.get("hub.challenge"), { status: 200 });
  return new NextResponse("forbidden", { status: 403 });
}

const STOP_WORDS = ["stop", "unsubscribe", "opt out", "optout"];
const START_WORDS = ["start", "subscribe"];

export async function POST(req: NextRequest) {
  const raw = await req.text();
  if (!verifySignature(raw, req.headers.get("x-hub-signature-256")))
    return new NextResponse("bad signature", { status: 401 });

  const body = JSON.parse(raw);
  for (const entry of body.entry ?? [])
    for (const change of entry.changes ?? []) {
      const v = change.value;
      for (const st of v.statuses ?? []) await handleStatus(st);
      for (const msg of v.messages ?? []) {
        const name = v.contacts?.find((c: any) => c.wa_id === msg.from)?.profile?.name;
        await handleInbound(msg, name);
      }
    }
  return NextResponse.json({ ok: true });
}

async function handleStatus(st: any) {
  const err = st.errors?.[0];
  const rank: Record<string, number> = { sent: 1, delivered: 2, read: 3, failed: 4 };
  const { data: m } = await db.from("messages").select("id,status,contact_id").eq("wa_message_id", st.id).single();
  if (!m) return;
  // never downgrade (webhooks can arrive out of order)
  if ((rank[m.status] ?? 0) >= (rank[st.status] ?? 0) && st.status !== "failed") return;

  await db.from("messages").update({
    status: st.status, error_code: err?.code ?? null, error_title: err?.title ?? null, updated_at: new Date().toISOString(),
  }).eq("id", m.id);

  if (st.status === "delivered" || st.status === "read")
    await db.from("contacts").update({ wa_status: "valid", wa_checked_at: new Date().toISOString(), marketing_fail_count: 0 }).eq("id", m.contact_id);

  if (st.status === "failed" && err) {
    if (ERR.NOT_ON_WHATSAPP.includes(err.code))
      await db.from("contacts").update({ wa_status: "invalid", wa_checked_at: new Date().toISOString() }).eq("id", m.contact_id);
    else if (ERR.USER_MARKETING_CAP.includes(err.code)) {
      // Meta capped this user. Re-queue once, 26h later (Meta advises not retrying immediately).
      const { data: c } = await db.from("contacts").select("marketing_fail_count").eq("id", m.contact_id).single();
      const n = (c?.marketing_fail_count ?? 0) + 1;
      await db.from("contacts").update({ marketing_fail_count: n }).eq("id", m.contact_id);
      const { data: orig } = await db.from("messages").select("attempts").eq("id", m.id).single();
      if ((orig?.attempts ?? 9) < 3)
        await db.from("messages").update({
          status: "queued", wa_message_id: null, next_attempt_at: new Date(Date.now() + 26 * 3600e3).toISOString(),
        }).eq("id", m.id);
    } else if (ERR.OPTED_OUT_MARKETING.includes(err.code))
      await db.from("contacts").update({ opted_in: false, opted_out_at: new Date().toISOString() }).eq("id", m.contact_id);
  }
}

async function handleInbound(msg: any, profileName?: string) {
  const now = new Date().toISOString();
  const { data: contact } = await db.from("contacts").upsert(
    { phone: msg.from, wa_status: "valid", wa_checked_at: now, last_inbound_at: now, ...(profileName ? { name: profileName } : {}) },
    { onConflict: "phone" }
  ).select().single();
  if (!contact) return;

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
    await db.from("contacts").update({ opted_in: true, opted_out_at: null }).eq("id", contact.id);
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
    status: r.ok ? "sent" : "failed", wa_message_id: r.ok ? r.id : null,
    error_code: r.ok ? null : r.code, error_title: r.ok ? null : r.title,
  });
}
