import { NextRequest, NextResponse } from "next/server";
import { getSettings, setSetting } from "@/lib/settings";
import { refreshPhoneHealth } from "@/lib/guard";

export const dynamic = "force-dynamic";

const EDITABLE = ["frequency_cap_days", "sunset_after", "quiet_start", "quiet_end", "default_send_hour",
  "timezone", "auto_pause_fail_pct", "daily_cap_override", "max_retries", "retry_window_days"];

export async function GET(req: NextRequest) {
  if (req.nextUrl.searchParams.get("refresh")) await refreshPhoneHealth(true);
  return NextResponse.json(await getSettings());
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  for (const [k, v] of Object.entries(body)) if (EDITABLE.includes(k)) await setSetting(k, v);
  return NextResponse.json(await getSettings());
}
