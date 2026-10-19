import crypto from "crypto";

const V = process.env.WA_API_VERSION || "v21.0";
const BASE = `https://graph.facebook.com/${V}`;
const headers = () => ({
  Authorization: `Bearer ${process.env.WA_ACCESS_TOKEN}`,
  "Content-Type": "application/json",
});

export type WaResult = { ok: true; id: string } | { ok: false; code: number; title: string };

async function post(body: object): Promise<WaResult> {
  const r = await fetch(`${BASE}/${process.env.WA_PHONE_NUMBER_ID}/messages`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ messaging_product: "whatsapp", ...body }),
  });
  const j = await r.json();
  if (r.ok && j.messages?.[0]?.id) return { ok: true, id: j.messages[0].id };
  return { ok: false, code: j.error?.code ?? r.status, title: j.error?.message ?? "unknown" };
}

export function sendText(to: string, text: string) {
  return post({ to, type: "text", text: { body: text, preview_url: true } });
}

export function sendTemplate(
  to: string,
  name: string,
  language: string,
  bodyVars: string[] = [],
  headerMediaUrl?: string | null
) {
  const components: any[] = [];
  if (headerMediaUrl) {
    const kind = /\.(mp4|3gp)$/i.test(headerMediaUrl) ? "video" : /\.pdf$/i.test(headerMediaUrl) ? "document" : "image";
    components.push({ type: "header", parameters: [{ type: kind, [kind]: { link: headerMediaUrl } }] });
  }
  if (bodyVars.length)
    components.push({ type: "body", parameters: bodyVars.map((t) => ({ type: "text", text: t })) });
  return post({ to, type: "template", template: { name, language: { code: language }, components } });
}

export function markRead(messageId: string) {
  return post({ status: "read", message_id: messageId });
}

export async function fetchTemplates() {
  const r = await fetch(
    `${BASE}/${process.env.WA_BUSINESS_ACCOUNT_ID}/message_templates?limit=200&fields=name,language,category,status,components`,
    { headers: headers() }
  );
  const j = await r.json();
  if (!r.ok) throw new Error(j.error?.message || "template fetch failed");
  return j.data as any[];
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
  RETRYABLE: [131000, 131016, 1, 2, 130472],
  OPTED_OUT_MARKETING: [131050],             // user stopped marketing messages
};
