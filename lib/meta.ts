// WhatsApp Business Platform management client. Mirrors the tool set of Meta's
// WhatsApp Business Tools MCP server (discovery, phone onboarding, templates,
// account setup) so the dashboard can do what an agent does through the MCP,
// using the system user token in WA_ACCESS_TOKEN.
const V = process.env.WA_API_VERSION || "v21.0";
const BASE = `https://graph.facebook.com/${V}`;

export class MetaError extends Error {
  constructor(message: string, public code: number, public status: number) { super(message); }
}

export async function graph<T = any>(path: string, init: { method?: string; body?: object; query?: Record<string, string | number | undefined> } = {}): Promise<T> {
  const url = new URL(`${BASE}/${path}`);
  for (const [k, v] of Object.entries(init.query ?? {})) if (v !== undefined && v !== "") url.searchParams.set(k, String(v));
  const r = await fetch(url, {
    method: init.method ?? "GET",
    headers: { Authorization: `Bearer ${process.env.WA_ACCESS_TOKEN}`, "Content-Type": "application/json" },
    body: init.body ? JSON.stringify(init.body) : undefined,
    signal: AbortSignal.timeout(15_000),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new MetaError(j.error?.error_user_msg || j.error?.message || `Meta request failed (${r.status})`, j.error?.code ?? r.status, r.status);
  return j as T;
}

const waba = (id?: string) => id || process.env.WA_BUSINESS_ACCOUNT_ID!;

// ---- Discovery -------------------------------------------------------------

export async function businesses() {
  return (await graph("me/businesses", { query: { fields: "id,name,verification_status", limit: 100 } })).data ?? [];
}

// Owned and client WhatsApp accounts under a business.
export async function accounts(businessId: string) {
  const fields = "id,name,currency,timezone_id,account_review_status,business_verification_status";
  const [owned, client] = await Promise.all([
    graph(`${businessId}/owned_whatsapp_business_accounts`, { query: { fields } }),
    graph(`${businessId}/client_whatsapp_business_accounts`, { query: { fields } }).catch(() => ({ data: [] })),
  ]);
  return [...(owned.data ?? []).map((a: any) => ({ ...a, relation: "owned" })), ...(client.data ?? []).map((a: any) => ({ ...a, relation: "client" }))];
}

export async function phoneNumbers(wabaId?: string) {
  return (await graph(`${waba(wabaId)}/phone_numbers`, {
    query: { fields: "id,display_phone_number,verified_name,code_verification_status,quality_rating,messaging_limit_tier,status,name_status,platform_type,throughput" },
  })).data ?? [];
}

// ---- Phone number onboarding ----------------------------------------------

export function addPhoneNumber(p: { cc: string; phone_number: string; verified_name: string; wabaId?: string }) {
  return graph<{ id: string }>(`${waba(p.wabaId)}/phone_numbers`, {
    method: "POST", body: { cc: p.cc, phone_number: p.phone_number, verified_name: p.verified_name },
  });
}

export function sendVerificationCode(id: string, method: "SMS" | "VOICE" = "SMS", language = "en_US") {
  return graph(`${id}/request_code`, { method: "POST", body: { code_method: method, language } });
}

export function verifyPhoneNumber(id: string, code: string) {
  return graph(`${id}/verify_code`, { method: "POST", body: { code } });
}

// pin = the number's two-step verification PIN (set here on first registration).
export function registerPhoneNumber(id: string, pin: string) {
  if (!/^\d{6}$/.test(pin)) throw new MetaError("PIN must be 6 digits", 100, 400);
  return graph(`${id}/register`, { method: "POST", body: { messaging_product: "whatsapp", pin } });
}

export function deregisterPhoneNumber(id: string) {
  return graph(`${id}/deregister`, { method: "POST" });
}

// ---- Message templates -----------------------------------------------------

export type TemplateInput = {
  name: string; language: string; category: "MARKETING" | "UTILITY" | "AUTHENTICATION";
  components: any[]; parameter_format?: "POSITIONAL" | "NAMED";
};

export async function listTemplates(wabaId?: string, q: { status?: string; name?: string } = {}) {
  const out: any[] = [];
  let after: string | undefined;
  do {
    const j = await graph(`${waba(wabaId)}/message_templates`, {
      query: { limit: 200, after, status: q.status, name: q.name, fields: "id,name,language,category,status,quality_score,components,rejected_reason" },
    });
    out.push(...(j.data ?? []));
    after = j.paging?.next ? j.paging?.cursors?.after : undefined;
  } while (after);
  return out;
}

export function getTemplate(id: string) {
  return graph(id, { query: { fields: "id,name,language,category,status,quality_score,components,rejected_reason" } });
}

export function validateTemplate(t: TemplateInput): string | null {
  if (!/^[a-z0-9_]{1,512}$/.test(t.name)) return "Name: lowercase letters, digits and underscores only";
  if (!t.language) return "Language required (e.g. en_US)";
  const body = t.components?.find((c) => c.type === "BODY");
  if (!body?.text) return "A BODY component with text is required";
  if (body.text.length > 1024) return "Body is limited to 1024 characters";
  const vars = [...body.text.matchAll(/\{\{(\d+)\}\}/g)].map((m) => +m[1]);
  if (vars.length && !body.example?.body_text) return "Body uses variables: add example values";
  if (vars.some((n, i) => n !== i + 1)) return "Variables must be numbered {{1}}, {{2}}, … in order";
  return null;
}

export function createTemplate(t: TemplateInput, wabaId?: string) {
  const err = validateTemplate(t);
  if (err) throw new MetaError(err, 100, 400);
  return graph<{ id: string; status: string; category: string }>(`${waba(wabaId)}/message_templates`, { method: "POST", body: t });
}

// Meta only lets you edit category/components; approved templates are limited to 10 edits per 30 days.
export function updateTemplate(id: string, patch: { category?: string; components?: any[] }) {
  return graph(id, { method: "POST", body: patch });
}

// Deleting by name removes every language; pass hsm_id to delete one.
export function deleteTemplate(name: string, id?: string, wabaId?: string) {
  return graph(`${waba(wabaId)}/message_templates`, { method: "DELETE", query: { name, hsm_id: id } });
}

// ---- Account setup ---------------------------------------------------------

export async function businessVerification(businessId: string) {
  const b = await graph(businessId, { query: { fields: "id,name,verification_status" } });
  return { ...b, startUrl: `https://business.facebook.com/settings/security/?business_id=${businessId}` };
}

export const links = {
  payments: (wabaId?: string) => `https://business.facebook.com/wa/manage/settings/payment-settings/?waba_id=${waba(wabaId)}`,
  systemUserToken: (businessId: string) => `https://business.facebook.com/settings/system-users?business_id=${businessId}`,
  phoneNumbers: (wabaId?: string) => `https://business.facebook.com/wa/manage/phone-numbers/?waba_id=${waba(wabaId)}`,
};

// Token introspection: which scopes the configured token carries and when it expires.
export async function tokenInfo() {
  const app = `${process.env.WA_APP_ID}|${process.env.WA_APP_SECRET}`;
  const r = await fetch(`${BASE}/debug_token?input_token=${process.env.WA_ACCESS_TOKEN}&access_token=${encodeURIComponent(app)}`, { signal: AbortSignal.timeout(10_000) });
  const j = await r.json();
  if (!r.ok) throw new MetaError(j.error?.message || "debug_token failed", j.error?.code ?? r.status, r.status);
  return j.data as { is_valid: boolean; scopes: string[]; expires_at: number; type: string };
}

export const REQUIRED_SCOPES = ["business_management", "whatsapp_business_management", "whatsapp_business_messaging"];

