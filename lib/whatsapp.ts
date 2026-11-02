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
  headerMediaUrl?: string | null
) {
  const components: any[] = [];
  if (headerMediaUrl) {
    const kind = /\.(mp4|3gp)(\?|$)/i.test(headerMediaUrl) ? "video" : /\.pdf(\?|$)/i.test(headerMediaUrl) ? "document" : "image";
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
  if (!process.env.WA_APP_SECRET) return true;
  if (!sig) return false;
  const exp = "sha256=" + crypto.createHmac("sha256", process.env.WA_APP_SECRET).update(raw).digest("hex");
  return sig.length === exp.length && crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(exp));
}

// Meta error codes -> how we treat them
export const ERR = {
  NOT_ON_WHATSAPP: [131026],                 // receiver incapable / no WhatsApp account
  USER_MARKETING_CAP: [131049],              // Meta per-user marketing limit ("healthy ecosystem")
  RATE_LIMIT: [130429, 131048, 131056, 80007, 4, 80008],
  RETRYABLE: [131000, 131016, 1, 2, 130472, 133004, 133005],
  OPTED_OUT_MARKETING: [131050],             // user stopped marketing messages
  PAYMENT: [131042],                         // payment method problem -> pause everything
  BAD_TEMPLATE: [132000, 132001, 132005, 132007, 132012, 132015, 132016], // template/params problems: stop the campaign
  ACCOUNT: [131031, 131030, 190],            // account locked / bad token -> pause everything
};

// Run async jobs with a concurrency limit.
export async function pool<T>(items: T[], size: number, fn: (x: T) => Promise<void>) {
  let i = 0;
  await Promise.all(
    Array.from({ length: Math.min(size, items.length) }, async () => {
      while (i < items.length) await fn(items[i++]);
    })
  );
}
