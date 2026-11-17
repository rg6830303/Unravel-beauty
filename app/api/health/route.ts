import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { appWebhook, fetchPhoneHealth, setAppWebhook, subscribeWaba, subscribedApps, WEBHOOK_FIELDS } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

const ENV = ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "WA_PHONE_NUMBER_ID", "WA_BUSINESS_ACCOUNT_ID",
  "WA_ACCESS_TOKEN", "WA_APP_ID", "WA_APP_SECRET", "WA_VERIFY_TOKEN", "DASHBOARD_PASSWORD", "CRON_SECRET"];

type Check = { name: string; ok: boolean; detail: string };
const attempt = async (name: string, fn: () => Promise<string>): Promise<Check> => {
  try { return { name, ok: true, detail: await fn() }; }
  catch (e: any) { return { name, ok: false, detail: e?.message ?? "failed" }; }
};

// Setup checklist: which pieces are configured and whether the loop and the Meta hooks are actually live.
export async function GET(req: NextRequest) {
  const missing = ENV.filter((k) => !process.env[k]);
  const checks: Check[] = [{
    name: "Environment variables", ok: !missing.length,
    detail: missing.length ? `Missing: ${missing.join(", ")}` : "All set",
  }];
  const has = (...keys: string[]) => keys.every((k) => process.env[k]);

  if (has("NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY")) {
    checks.push(await attempt("Database schema", async () => {
      const { error } = await db.from("send_attempts").select("id", { count: "exact", head: true });
      if (error) throw new Error(`${error.message} — run supabase/schema.sql`);
      return "Tables found";
    }));
    checks.push(await attempt("Outreach loop", async () => {
      const run = (await getSettings()).dispatcher_last_run;
      if (!run?.at) throw new Error("The dispatcher has not run yet");
      const age = Math.round((Date.now() - new Date(run.at).getTime()) / 1000);
      if (age > 180) throw new Error(`Last ran ${age}s ago — the every-minute schedule is not reaching /api/cron/dispatch`);
      return `Last ran ${age}s ago: ${JSON.stringify(run)}`;
    }));
  }
  if (has("WA_ACCESS_TOKEN", "WA_PHONE_NUMBER_ID"))
    checks.push(await attempt("WhatsApp number", async () => {
      const h = await fetchPhoneHealth();
      return `${h.display_phone_number ?? "number"} · quality ${h.quality_rating ?? "?"} · ${h.messaging_limit_tier ?? "tier ?"} · ${h.status ?? ""}`;
    }));
  if (has("WA_ACCESS_TOKEN", "WA_BUSINESS_ACCOUNT_ID"))
    checks.push(await attempt("App subscribed to WhatsApp account", async () => {
      const apps = await subscribedApps();
      if (!apps.length) throw new Error("No app receives this account's webhooks — press Connect Meta webhooks");
      return apps.map((a: any) => a.whatsapp_business_api_data?.name ?? a.name ?? "app").join(", ");
    }));
  if (has("WA_APP_ID", "WA_APP_SECRET"))
    checks.push(await attempt("Webhook callback", async () => {
      const w = await appWebhook();
      const want = `${req.nextUrl.origin}/api/webhook`;
      if (!w) throw new Error("No WhatsApp webhook on the Meta app — press Connect Meta webhooks");
      const lacking = WEBHOOK_FIELDS.filter((f) => !w.fields.includes(f));
      if (w.callback_url !== want) throw new Error(`Points at ${w.callback_url}, expected ${want}`);
      if (lacking.length) throw new Error(`Not subscribed to: ${lacking.join(", ")}`);
      return `${w.callback_url} · ${w.fields.length} fields`;
    }));
  return NextResponse.json({ ok: checks.every((c) => c.ok), checks });
}

// "Connect Meta webhooks": point the Meta app at this deployment and subscribe it to the WhatsApp account.
export async function POST(req: NextRequest) {
  const need = ["WA_APP_ID", "WA_APP_SECRET", "WA_VERIFY_TOKEN", "WA_ACCESS_TOKEN", "WA_BUSINESS_ACCOUNT_ID"].filter((k) => !process.env[k]);
  if (need.length) return NextResponse.json({ error: `Set these environment variables first: ${need.join(", ")}` }, { status: 400 });
  try {
    await setAppWebhook(`${req.nextUrl.origin}/api/webhook`);
    await subscribeWaba();
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 502 });
  }
}
