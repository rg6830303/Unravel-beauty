import { NextRequest, NextResponse } from "next/server";
import { waitUntil } from "@vercel/functions";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// Click-tracking redirect. A click is the strongest engagement signal: it resets the sunset counter.
export async function GET(_: NextRequest, { params }: { params: { token: string } }) {
  const { data: l } = await db.from("links").select("*").eq("token", params.token).maybeSingle();
  if (!l) return new NextResponse("Link not found", { status: 404 });
  waitUntil((async () => {
    await db.from("links").update({ clicks: l.clicks + 1, first_click_at: l.first_click_at ?? new Date().toISOString() }).eq("token", l.token);
    if (l.contact_id) {
      const { data: c } = await db.from("contacts").select("engagement_score").eq("id", l.contact_id).single();
      await db.from("contacts").update({ unread_streak: 0, engagement_score: (c?.engagement_score ?? 0) + 4 }).eq("id", l.contact_id);
    }
  })());
  return NextResponse.redirect(l.url, 302);
}
