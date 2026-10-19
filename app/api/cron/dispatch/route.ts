import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendTemplate, ERR } from "@/lib/whatsapp";

export const maxDuration = 60;

// Runs every minute (vercel.json). Starts due campaigns, then sends a batch of queued messages.
export async function GET(req: NextRequest) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  // promote scheduled campaigns
  const { data: due } = await db.from("campaigns").select("id").eq("status", "scheduled").lte("scheduled_at", new Date().toISOString());
  for (const c of due ?? []) await db.from("campaigns").update({ status: "running" }).eq("id", c.id);

  const { data: running } = await db.from("campaigns").select("*").eq("status", "running");
  const byId = new Map((running ?? []).map((c) => [c.id, c]));
  const batch = Math.max(...(running ?? []).map((c) => c.rate_per_minute), 60);

  const { data: jobs } = await db.rpc("claim_messages", { batch });
  let sent = 0;
  const deadline = Date.now() + 50_000;

  for (const job of jobs ?? []) {
    if (Date.now() > deadline) {
      await db.from("messages").update({ status: "queued" }).eq("id", job.id);
      continue;
    }
    const camp = job.campaign_id ? byId.get(job.campaign_id) : null;
    if (job.campaign_id && !camp) {
      // campaign paused -> put back
      await db.from("messages").update({ status: "queued", attempts: job.attempts - 1 }).eq("id", job.id);
      continue;
    }
    const { data: contact } = await db.from("contacts").select("*").eq("id", job.contact_id).single();

    // final guard: never send to invalid / opted-out contacts
    if (!contact || contact.wa_status === "invalid" || !contact.opted_in) {
      await db.from("messages").update({ status: "skipped", error_title: "invalid or opted-out contact" }).eq("id", job.id);
      continue;
    }

    const p = job.payload;
    const r = await sendTemplate(contact.phone, p.template, p.language, p.vars, p.header);
    if (r.ok) {
      sent++;
      await db.from("messages").update({ status: "sent", wa_message_id: r.id, updated_at: new Date().toISOString() }).eq("id", job.id);
      continue;
    }
    const retry = (ERR.RATE_LIMIT.includes(r.code) || ERR.RETRYABLE.includes(r.code)) && job.attempts < 5;
    if (retry) {
      const delay = 2 ** job.attempts * 60_000; // exponential backoff
      await db.from("messages").update({ status: "queued", next_attempt_at: new Date(Date.now() + delay).toISOString(), error_code: r.code, error_title: r.title }).eq("id", job.id);
      if (ERR.RATE_LIMIT.includes(r.code)) break; // stop this run, throughput exceeded
    } else {
      await db.from("messages").update({ status: "failed", error_code: r.code, error_title: r.title }).eq("id", job.id);
      if (ERR.NOT_ON_WHATSAPP.includes(r.code))
        await db.from("contacts").update({ wa_status: "invalid", wa_checked_at: new Date().toISOString() }).eq("id", contact.id);
    }
  }

  // mark finished campaigns
  for (const c of running ?? []) {
    const { count } = await db.from("messages").select("id", { count: "exact", head: true })
      .eq("campaign_id", c.id).in("status", ["queued", "sending"]);
    if (!count) await db.from("campaigns").update({ status: "completed" }).eq("id", c.id);
  }
  return NextResponse.json({ claimed: jobs?.length ?? 0, sent });
}
