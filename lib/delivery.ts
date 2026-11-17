import { db } from "./db";
import { decide, Decision, ERR } from "./retry";
import { pauseAllCampaigns, pauseCampaign } from "./guard";

type FailedMessage = {
  id: string; contact_id: string; campaign_id: string | null; retry_count: number | null; expires_at: string | null;
};

export async function logAttempt(m: { id: string; campaign_id: string | null }, source: "api" | "webhook",
  ok: boolean, action: string, code?: number | null, title?: string | null) {
  await db.from("send_attempts").insert({
    message_id: m.id, campaign_id: m.campaign_id, source, ok, action, error_code: code ?? null, error_title: title ?? null,
  });
}

// Single place that turns a failed send into its next state. Used for synchronous Meta errors (dispatcher)
// and asynchronous "failed" statuses (webhook), so both follow the same retry loop.
export async function handleFailure(m: FailedMessage, code: number, title: string, source: "api" | "webhook",
  maxRetries: number): Promise<Decision> {
  const retryCount = m.retry_count ?? 0;
  let d = decide(code, retryCount, maxRetries);
  let reason = title;
  if (d.action === "retry" && m.expires_at && Date.now() + d.delayMs > new Date(m.expires_at).getTime()) {
    d = { action: "fail" };
    reason = `${title} (retry window ended)`;
  } else if (d.action === "fail" && retryCount > 0 && !d.contact) reason = `${title} (gave up after ${retryCount} retries)`;
  await logAttempt(m, source, false, d.action, code, reason);

  const now = new Date().toISOString();
  const queue = (delayMs: number, counts: boolean) =>
    db.from("messages").update({
      status: "queued", wa_message_id: null, next_attempt_at: new Date(Date.now() + delayMs).toISOString(),
      retry_count: retryCount + (counts ? 1 : 0), error_code: code, error_title: reason, updated_at: now,
    }).eq("id", m.id);

  if (d.action === "retry") {
    await queue(d.delayMs, d.counts);
    // an async failure can arrive after the campaign was marked completed: reopen it so the loop picks the retry up
    if (m.campaign_id) await db.from("campaigns").update({ status: "running" }).eq("id", m.campaign_id).eq("status", "completed");
    if (ERR.USER_MARKETING_CAP.includes(code)) await bumpFailCount(m.contact_id);
  } else if (d.action === "pause_all") {
    await pauseAllCampaigns(`Meta error ${code}: ${title}`);
    await queue(3600e3, false);
  } else if (d.action === "pause_campaign") {
    if (m.campaign_id) await pauseCampaign(m.campaign_id, `Meta error ${code}: ${title}`);
    await queue(3600e3, false);
  } else {
    await db.from("messages").update({ status: "failed", error_code: code, error_title: reason, updated_at: now }).eq("id", m.id);
    if (d.contact === "invalid")
      await db.from("contacts").update({ wa_status: "invalid", wa_checked_at: now }).eq("id", m.contact_id);
    if (d.contact === "opted_out")
      await db.from("contacts").update({ opted_in: false, opted_out_at: now }).eq("id", m.contact_id);
  }
  return d;
}

async function bumpFailCount(contactId: string) {
  const { data: c } = await db.from("contacts").select("marketing_fail_count").eq("id", contactId).single();
  await db.from("contacts").update({ marketing_fail_count: (c?.marketing_fail_count ?? 0) + 1 }).eq("id", contactId);
}
