import { NextRequest, NextResponse } from "next/server";
import { runDispatch } from "@/lib/dispatch";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

// The outreach loop. Vercel Cron calls this every minute (vercel.json) and sends CRON_SECRET as a bearer token.
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  // deployed before the database is connected: report it instead of failing every minute
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY)
    return NextResponse.json({ configured: false, missing: "Supabase environment variables" });
  return NextResponse.json(await runDispatch());
}
