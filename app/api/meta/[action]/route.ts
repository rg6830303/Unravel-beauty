import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import * as meta from "@/lib/meta";
import { normalizePhone } from "@/lib/phone";
import { sendTemplate, sendText } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

// One endpoint per WhatsApp Business Tools MCP tool (whatsapp_biz_<action>), backed by the Cloud API.
// GET = read-only tools, POST = tools that change something.
const reads: Record<string, (q: URLSearchParams) => Promise<unknown>> = {
  businesses: () => meta.businesses(),
  accounts: (q) => meta.accounts(need(q.get("business_id"), "business_id")),
  phone_numbers: (q) => meta.phoneNumbers(q.get("waba_id") ?? undefined),
  list_templates: (q) => meta.listTemplates(q.get("waba_id") ?? undefined, { status: q.get("status") ?? undefined, name: q.get("name") ?? undefined }),
  get_template: (q) => meta.getTemplate(need(q.get("id"), "id")),
  verify_business: (q) => meta.businessVerification(need(q.get("business_id"), "business_id")),
  configure_payments: (q) => Promise.resolve({ url: meta.links.payments(q.get("waba_id") ?? undefined) }),
  system_user_token: (q) => Promise.resolve({ url: meta.links.systemUserToken(need(q.get("business_id"), "business_id")) }),
  token: async () => {
    const t = await meta.tokenInfo();
    return { ...t, missing_scopes: meta.REQUIRED_SCOPES.filter((s) => !t.scopes?.includes(s)) };
  },
};

const writes: Record<string, (b: any) => Promise<unknown>> = {
  add_phone_number: (b) => meta.addPhoneNumber({ cc: need(b.cc, "cc"), phone_number: need(b.phone_number, "phone_number"), verified_name: need(b.verified_name, "verified_name"), wabaId: b.waba_id }),
  send_verification_code: (b) => meta.sendVerificationCode(need(b.id, "id"), b.method === "VOICE" ? "VOICE" : "SMS", b.language),
  verify_phone_number: (b) => meta.verifyPhoneNumber(need(b.id, "id"), need(b.code, "code")),
  register_phone_number: (b) => meta.registerPhoneNumber(need(b.id, "id"), need(b.pin, "pin")),
  create_template: (b) => meta.createTemplate(b, b.waba_id),
  update_template: (b) => meta.updateTemplate(need(b.id, "id"), { category: b.category, components: b.components }),
  delete_template: async (b) => {
    const r = await meta.deleteTemplate(need(b.name, "name"), b.id, b.waba_id);
    await db.from("templates").delete().eq("name", b.name);
    return r;
  },
  // Free-form text only lands inside the 24h customer-service window; templates work any time.
  send_message: async (b) => {
    const to = normalizePhone(need(b.to, "to"));
    if (!to) throw new meta.MetaError("Invalid phone number", 100, 400);
    if (!b.confirm) throw new meta.MetaError(`Confirm sending to +${to} by resending with confirm: true`, 100, 409);
    const r = b.template
      ? await sendTemplate(to, b.template, b.language || "en_US", b.variables ?? [])
      : await sendText(to, need(b.text, "text"));
    // record it like any other outbound message so it shows in the inbox and webhook statuses attach to it
    try {
      const { data: c } = await db.from("contacts").upsert({ phone: to }, { onConflict: "phone" }).select("id").single();
      if (c) await db.from("messages").insert({
        contact_id: c.id, direction: "out", type: b.template ? "template" : "text",
        body: b.template ? `[template] ${b.template}` : b.text, status: r.ok ? "sent" : "failed",
        wa_message_id: r.ok ? r.id : null, error_code: r.ok ? null : r.code, error_title: r.ok ? null : r.title,
      });
    } catch (e) { console.error("send_message: logging failed", e); } // the send already happened; don't report it as failed
    if (!r.ok) throw new meta.MetaError(r.title, r.code, 502);
    return r;
  },
};

function need(v: any, name: string): string {
  if (v === undefined || v === null || v === "") throw new meta.MetaError(`${name} is required`, 100, 400);
  return String(v);
}

const fail = (e: any) =>
  NextResponse.json({ error: e?.message ?? "failed", code: e?.code }, { status: e instanceof meta.MetaError ? (e.status >= 500 ? 502 : e.status) : 500 });

export async function GET(req: NextRequest, { params }: { params: { action: string } }) {
  const fn = reads[params.action];
  if (!fn) return NextResponse.json({ error: `Unknown read tool ${params.action}` }, { status: 404 });
  try { return NextResponse.json({ data: await fn(req.nextUrl.searchParams) }); } catch (e) { return fail(e); }
}

export async function POST(req: NextRequest, { params }: { params: { action: string } }) {
  const fn = writes[params.action];
  if (!fn) return NextResponse.json({ error: `Unknown write tool ${params.action}` }, { status: 404 });
  try { return NextResponse.json({ data: await fn(await req.json().catch(() => ({}))) }); } catch (e) { return fail(e); }
}
