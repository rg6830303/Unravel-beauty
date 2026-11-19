import crypto from "crypto";

const V = process.env.WA_API_VERSION || "v21.0";
const BASE = `https://graph.facebook.com/${V}`;
const headers = () => ({
  Authorization: `Bearer ${process.env.WA_ACCESS_TOKEN}`,
  "Content-Type": "application/json",
});

export type WaResult = { ok: true; id: string } | { ok: false; code: number; title: string };

// fromId: send from another registered number on the account instead of WA_PHONE_NUMBER_ID
async function post(body: object, path = "messages", fromId?: string): Promise<WaResult> {
  try {
    const r = await fetch(`${BASE}/${fromId || process.env.WA_PHONE_NUMBER_ID}/${path}`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ messaging_product: "whatsapp", ...body }),
      signal: AbortSignal.timeout(15_000),
    });
    const j = await r.json();
    if (r.ok && j.messages?.[0]?.id) return { ok: true, id: j.messages[0].id };
    return { ok: false, code: j.error?.code ?? r.status, title: j.error?.error_data?.details ?? j.error?.message ?? "unknown" };
  } catch (e: any) {
    // network/timeout: code 1 is treated as retryable by the dispatcher
    return { ok: false, code: 1, title: e?.message ?? "network error" };
  }
}

export function sendText(to: string, text: string, fromId?: string) {
  return post({ to, type: "text", text: { body: text, preview_url: true } }, "messages", fromId);
}

// WA_USE_MM_LITE=1 routes marketing templates through Meta's Marketing Messages Lite API
// (delivery optimisation for marketing). Requires onboarding in WhatsApp Manager first.
export function sendTemplate(
  to: string,
  name: string,
  language: string,
  bodyVars: string[] = [],
  headerMediaUrl?: string | null,
  headerFormat?: string | null,
  fromId?: string
) {
  const components: any[] = [];
  if (headerMediaUrl) {
    // the template decides the header type; the file extension is only a fallback for older queued messages
    const kind = headerFormat ? headerFormat.toLowerCase()
      : /\.(mp4|3gp)(\?|$)/i.test(headerMediaUrl) ? "video" : /\.pdf(\?|$)/i.test(headerMediaUrl) ? "document" : "image";
    components.push({ type: "header", parameters: [{ type: kind, [kind]: { link: headerMediaUrl } }] });
  }
  if (bodyVars.length)
    components.push({ type: "body", parameters: bodyVars.map((t) => ({ type: "text", text: t })) });
  return post(
    { to, type: "template", template: { name, language: { code: language }, components } },
    process.env.WA_USE_MM_LITE === "1" ? "marketing_messages" : "messages",
    fromId
  );
}

// Session (24h window) message builders, modelled on Meta's Jasper's Market sample.
const ctx = (replyTo?: string) => (replyTo ? { context: { message_id: replyTo } } : {});

export function sendButtons(to: string, body: string, buttons: { id: string; title: string }[], replyTo?: string) {
  if (!buttons.length || buttons.length > 3) throw new Error("1–3 reply buttons allowed");
  return post({
    to, type: "interactive", ...ctx(replyTo),
    interactive: { type: "button", body: { text: body },
      action: { buttons: buttons.map((b) => ({ type: "reply", reply: { id: b.id, title: b.title.slice(0, 20) } })) } },
  });
}

export function sendList(to: string, body: string, button: string,
  sections: { title: string; rows: { id: string; title: string; description?: string }[] }[], replyTo?: string) {
  return post({
    to, type: "interactive", ...ctx(replyTo),
    interactive: { type: "list", body: { text: body }, action: { button: button.slice(0, 20), sections } },
  });
}

export function sendCtaUrl(to: string, body: string, label: string, url: string) {
  return post({
    to, type: "interactive",
    interactive: { type: "cta_url", body: { text: body }, action: { name: "cta_url", parameters: { display_text: label, url } } },
  });
}

export function sendMedia(to: string, kind: "image" | "video" | "document" | "audio", link: string, caption?: string) {
  return post({ to, type: kind, [kind]: { link, ...(caption && kind !== "audio" ? { caption } : {}) } });
}

// Shows "typing…" to the customer and marks their message read (Cloud API typing indicator).
export function typing(messageId: string) {
  return post({ status: "read", message_id: messageId, typing_indicator: { type: "text" } });
}

export function markRead(messageId: string) {
  return post({ status: "read", message_id: messageId });
}

// Quality rating (GREEN/YELLOW/RED) and daily messaging tier of the sending number.
export async function fetchPhoneHealth() {
  const r = await fetch(
    `${BASE}/${process.env.WA_PHONE_NUMBER_ID}?fields=quality_rating,messaging_limit_tier,status,display_phone_number`,
    { headers: headers(), signal: AbortSignal.timeout(10_000) }
  );
  const j = await r.json();
  if (!r.ok) throw new Error(j.error?.message || "phone health fetch failed");
  return j as { quality_rating?: string; messaging_limit_tier?: string; status?: string; display_phone_number?: string };
}

export function verifySignature(raw: string, sig: string | null) {
  if (!process.env.WA_APP_SECRET) return false; // fail closed: unsigned events could forge delivery statuses
  if (!sig) return false;
  const exp = "sha256=" + crypto.createHmac("sha256", process.env.WA_APP_SECRET).update(raw).digest("hex");
  return sig.length === exp.length && crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(exp));
}

// Run async jobs with a concurrency limit.
export async function pool<T>(items: T[], size: number, fn: (x: T) => Promise<void>) {
  let i = 0;
  await Promise.all(
    Array.from({ length: Math.min(size, items.length) }, async () => {
      while (i < items.length) await fn(items[i++]);
    })
  );
}

async function graph(path: string, init: RequestInit = {}, token = process.env.WA_ACCESS_TOKEN) {
  const r = await fetch(`${BASE}/${path}`, {
    ...init, headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, signal: AbortSignal.timeout(15_000),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error?.message || `Meta request failed (${r.status})`);
  return j;
}

export const WEBHOOK_FIELDS = ["messages", "phone_number_quality_update", "message_template_status_update",
  "message_template_quality_update", "template_category_update", "account_update", "account_alerts"];

// Apps that receive this WhatsApp account's webhooks.
export async function subscribedApps(): Promise<any[]> {
  return (await graph(`${process.env.WA_BUSINESS_ACCOUNT_ID}/subscribed_apps`)).data ?? [];
}

export function subscribeWaba() {
  return graph(`${process.env.WA_BUSINESS_ACCOUNT_ID}/subscribed_apps`, { method: "POST" });
}

const appToken = () => `${process.env.WA_APP_ID}|${process.env.WA_APP_SECRET}`;

// Points the Meta app's WhatsApp webhook at this deployment. Meta calls the URL back with the verify token before accepting.
export function setAppWebhook(callbackUrl: string) {
  return graph(`${process.env.WA_APP_ID}/subscriptions`, {
    method: "POST",
    body: JSON.stringify({
      object: "whatsapp_business_account", callback_url: callbackUrl,
      verify_token: process.env.WA_VERIFY_TOKEN, fields: WEBHOOK_FIELDS.join(","),
    }),
  }, appToken());
}

export async function appWebhook(): Promise<{ callback_url?: string; fields: string[]; active?: boolean } | null> {
  const j = await graph(`${process.env.WA_APP_ID}/subscriptions`, {}, appToken());
  const sub = (j.data ?? []).find((x: any) => x.object === "whatsapp_business_account");
  return sub ? { callback_url: sub.callback_url, active: sub.active, fields: (sub.fields ?? []).map((f: any) => f.name) } : null;
}
