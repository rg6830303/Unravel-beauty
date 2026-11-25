import { NextResponse } from "next/server";
import { Client } from "pg";
import { OTP_SQL } from "@/lib/otp-schema";

export const dynamic = "force-dynamic";

// Applies the OTP table migration (supabase/otp.sql) (idempotent: create ... if not exists). Dashboard session required.
// Uses the direct Postgres URL the Vercel–Supabase integration provides; Supabase's pooler certificate
// is not in Node's default trust store, so the connection is encrypted but the chain is not pinned.
export async function POST() {
  const url = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL;
  if (!url) return NextResponse.json({ error: "POSTGRES_URL_NON_POOLING is not set" }, { status: 500 });
  const client = new Client({ connectionString: url.replace(/[?&]sslmode=[^&]*/g, ""), ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 10_000 });
  try {
    await client.connect();
    await client.query(OTP_SQL);
    const { rows } = await client.query("select count(*)::int as n from otp_codes");
    return NextResponse.json({ ok: true, otp_codes_rows: rows[0].n });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  } finally {
    await client.end().catch(() => {});
  }
}
