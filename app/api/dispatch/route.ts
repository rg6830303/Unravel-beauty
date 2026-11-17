import { NextResponse } from "next/server";
import { runDispatch } from "@/lib/dispatch";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

// Manual "run the loop now" from the dashboard (behind the dashboard password; the scheduler uses /api/cron/dispatch).
export async function POST() {
  return NextResponse.json(await runDispatch());
}
