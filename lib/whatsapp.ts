import crypto from "crypto";

const V = process.env.WA_API_VERSION || "v21.0";
const BASE = `https://graph.facebook.com/${V}`;
const headers = () => ({
  Authorization: `Bearer ${process.env.WA_ACCESS_TOKEN}`,
  "Content-Type": "application/json",
});

export type WaResult = { ok: true; id: string } | { ok: false; code: number; title: string };

async function post(body: object, path = "messages"): Promise<WaResult> {
  try {
    const r = await fetch(`${BASE}/${process.env.WA_PHONE_NUMBER_ID}/${path}`, {
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

export function sendText(to: string, text: string) {
  return post({ to, type: "text", text: { body: text, preview_url: true } });
}

// WA_USE_MM_LITE=1 routes marketing templates through Meta's Marketing Messages Lite API
// (delivery optimisation for marketing). Requires onboarding in WhatsApp Manager first.
export function sendTemplate(
  to: string,
  name: string,
  language: string,
  bodyVars: string[] = [],
  headerMediaUrl?: string | null,
  headerFormat?: string | null
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
    process.env.WA_USE_MM_LITE === "1" ? "marketing_messages" : "messages"
  );
}

export function markRead(messageId: string) {
  return post({ status: "read", message_id: messageId });
}

export async function fetchTemplates() {
  const r = await fetch(
    `${BASE}/${process.env.WA_BUSINESS_ACCOUNT_ID}/message_templates?limit=200&fields=name,language,category,status,quality_score,components`,
    { headers: headers() }
  );
  const j = await r.json();
  if (!r.ok) throw new Error(j.error?.message || "template fetch failed");
  return j.data as any[];
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
