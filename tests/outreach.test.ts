import crypto from "crypto";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { createDb, fakeMeta, inboundEvent, post, statusEvent } from "./harness";
import { decide } from "@/lib/retry";
import { runDispatch } from "@/lib/dispatch";
import { lookup, processWebhook } from "@/lib/webhook";
import { POST as createCampaign, PATCH as patchCampaign } from "@/app/api/campaigns/route";
import { GET as cron } from "@/app/api/cron/dispatch/route";
import { GET as verifyHook, POST as receiveHook } from "@/app/api/webhook/route";

const H = 3600e3;
let db: Awaited<ReturnType<typeof createDb>>;
let meta: ReturnType<typeof fakeMeta>;
let seen = 0; // meta.sends already given an asynchronous outcome by settle()

beforeAll(async () => {
  Object.assign(process.env, {
    WA_PHONE_NUMBER_ID: "111", WA_BUSINESS_ACCOUNT_ID: "222", WA_ACCESS_TOKEN: "t", WA_APP_SECRET: "app-secret",
    WA_VERIFY_TOKEN: "verify-me", CRON_SECRET: "cron-secret", NEXT_PUBLIC_SUPABASE_URL: "https://x.supabase.co", SUPABASE_SERVICE_ROLE_KEY: "k",
  });
  delete process.env.ANTHROPIC_API_KEY;
  lookup.waits = [0];
  db = await createDb();
});
beforeEach(async () => {
  await db.reset();
  meta = fakeMeta();
  seen = 0;
});

const phone = (i: number) => `9198${String(10000000 + i)}`;
async function addContacts(n: number, extra: Record<string, any> = {}) {
  for (let i = 0; i < n; i++)
    await db.pg.query("insert into contacts (phone, name, tags) values ($1, $2, $3)", [phone(i), `user ${i}`, extra.tags ?? ["vip"]]);
  return db.sql("select * from contacts order by phone");
}
async function start(body: Record<string, any> = {}) {
  const r = await createCampaign(post("/api/campaigns", {
    name: "Diwali sale", template_name: "promo", template_language: "en", smart_send_time: false,
    variables: ["{{first_name|there}}", "{{link:https://shop.test/offer}}"], ...body,
  }));
  return r.json();
}
const hook = (wamid: string, status: string, code?: number) => processWebhook(statusEvent(wamid, status, code));
const due = () => db.pg.exec("update messages set next_attempt_at = now() where status = 'queued'");
const msgs = (where = "true") => db.sql(`select m.*, c.phone from messages m join contacts c on c.id = m.contact_id where direction = 'out' and ${where} order by c.phone`);
const stats = async () => (await db.sql("select * from campaign_stats"))[0];

// Give every send Meta accepted since the last call its asynchronous result: delivered unless scripted otherwise.
async function settle(asyncScript: Record<string, (number | "delivered")[]> = {}) {
  for (; seen < meta.sends.length; seen++) {
    const s = meta.sends[seen];
    const out = asyncScript[s.to]?.shift() ?? "delivered";
    if (out === "delivered") await hook(s.wamid, "delivered");
    else await hook(s.wamid, "failed", out);
  }
}
// Run the loop to quiescence, jumping over every wait (retry backoff, frequency cap, send time).
async function drain(asyncScript: Record<string, (number | "delivered")[]> = {}, maxPasses = 60) {
  for (let i = 0; i < maxPasses; i++) {
    await due();
    await runDispatch();
    await settle(asyncScript);
    const [{ n }] = await db.sql("select count(*)::int n from messages where status in ('queued','sending')");
    if (!n) return i + 1;
  }
  throw new Error("loop did not finish");
}

describe("retry policy", () => {
  it("backs off transient errors and gives up at the limit", () => {
    expect(decide(131000, 0, 5)).toEqual({ action: "retry", delayMs: 60e3, counts: true });
    expect(decide(131000, 3, 5)).toEqual({ action: "retry", delayMs: H, counts: true });
    expect(decide(131000, 5, 5)).toEqual({ action: "fail" });
    expect(decide(1, 0, 5).action).toBe("retry");       // network error
    expect(decide(503, 0, 5).action).toBe("retry");     // HTTP 5xx
    expect(decide(999999, 0, 5).action).toBe("retry");  // unknown code
  });
  it("waits a day or more before re-sending a capped marketing message", () => {
    expect(decide(131049, 0, 5)).toEqual({ action: "retry", delayMs: 24 * H, counts: true });
    expect(decide(131049, 1, 5)).toEqual({ action: "retry", delayMs: 48 * H, counts: true });
    expect(decide(131049, 4, 5)).toEqual({ action: "retry", delayMs: 96 * H, counts: true });
  });
  it("flags a number only after repeated undeliverable results", () => {
    expect(decide(131026, 0, 5).action).toBe("retry");
    expect(decide(131026, 1, 5).action).toBe("retry");
    expect(decide(131026, 2, 5)).toEqual({ action: "fail", contact: "invalid" });
  });
  it("never retries opt-outs or malformed requests, and escalates account problems", () => {
    expect(decide(131050, 0, 5)).toEqual({ action: "fail", contact: "opted_out" });
    expect(decide(131008, 0, 5)).toEqual({ action: "fail" });
    expect(decide(131042, 0, 5)).toEqual({ action: "pause_all" });
    expect(decide(190, 0, 5)).toEqual({ action: "pause_all" });
    expect(decide(132001, 0, 5)).toEqual({ action: "pause_campaign" });
  });
  it("does not spend a retry on rate limits", () => {
    expect(decide(130429, 5, 5)).toEqual({ action: "retry", delayMs: 120e3, counts: false, halt: true });
    expect(decide(131056, 5, 5)).toEqual({ action: "retry", delayMs: 600e3, counts: false });
  });
});

describe("campaign creation", () => {
  it("queues one personalised message per eligible contact and excludes the rest", async () => {
    await addContacts(6);
    await db.pg.exec(`update contacts set wa_status = 'invalid' where phone = '${phone(0)}';
      update contacts set opted_in = false where phone = '${phone(1)}';
      update contacts set unread_streak = 6 where phone = '${phone(2)}';
      update contacts set name = null where phone = '${phone(3)}'`);
    const preview = await start({ dry_run: true });
    expect(preview).toMatchObject({ queued: 3, invalid: 1, opted_out: 1, sunset: 1, dry_run: true });
    expect(await msgs()).toHaveLength(0);

    const r = await start();
    expect(r).toMatchObject({ queued: 3, invalid: 1, opted_out: 1, sunset: 1 });
    const queued = await msgs();
    expect(queued.map((m: any) => m.phone)).toEqual([phone(3), phone(4), phone(5)]);
    expect(queued[0].payload.vars[0]).toBe("there");           // missing name falls back, never empty
    expect(queued[1].payload.vars[0]).toBe("User");
    expect(queued[1].payload.vars[1]).toMatch(/^https:\/\/app\.test\/r\/[\w-]+$/);
    expect(await db.sql("select * from links")).toHaveLength(3); // one tracked link each
    expect(new Date(queued[0].expires_at).getTime()).toBeGreaterThan(Date.now() + 6.9 * 24 * H);
  });

  it("targets only hand-picked contacts when contact_ids is given", async () => {
    const cs = await addContacts(10);
    const r = await start({ contact_ids: [cs[2].id, cs[7].id] });
    expect(r.queued).toBe(2);
    expect((await msgs()).map((m: any) => m.phone)).toEqual([phone(2), phone(7)]);
  });

  it("targets by tag", async () => {
    await addContacts(4);
    await db.pg.exec(`update contacts set tags = '{other}' where phone in ('${phone(0)}','${phone(1)}')`);
    expect((await start({ audience_tags: ["vip"] })).queued).toBe(2);
  });

  it("rejects a wrong variable count and non-approved templates before queuing anything", async () => {
    await addContacts(1);
    expect((await start({ variables: ["only one"] })).error).toMatch(/needs 2 variable/);
    await db.pg.exec("update templates set status = 'PAUSED'");
    expect((await start()).error).toMatch(/not APPROVED/);
    expect(await db.sql("select * from campaigns")).toHaveLength(0);
  });

  it("delays, rather than drops, contacts messaged within the frequency cap", async () => {
    await addContacts(2);
    await db.pg.exec(`update contacts set last_marketing_at = now() - interval '1 hour' where phone = '${phone(0)}'`);
    const r = await start();
    expect(r).toMatchObject({ queued: 2, deferred: 1 });
    const [capped, free] = await msgs();
    expect(new Date(capped.next_attempt_at).getTime()).toBeGreaterThan(Date.now() + 40 * H);
    expect(new Date(free.next_attempt_at).getTime()).toBeLessThan(Date.now() + 1000);

    await runDispatch();
    expect(meta.sends.map((s) => s.to)).toEqual([phone(1)]);
    expect((await stats()).status).toBe("running"); // still owes one message
    await db.pg.exec("update contacts set last_marketing_at = now() - interval '3 days'"); // the cap passes
    await drain();
    expect(meta.sends.map((s) => s.to).sort()).toEqual([phone(0), phone(1)]);
    expect((await stats()).status).toBe("completed");
  });
});

describe("outreach loop", () => {
  it("sends to every contact, records delivery and read, and completes the campaign", async () => {
    await addContacts(120);
    await start();
    const run = await runDispatch();
    expect(run).toMatchObject({ claimed: 120, sent: 120, failed: 0 });
    expect(new Set(meta.sends.map((s) => s.to)).size).toBe(120);
    expect(meta.sends[0].body.template).toMatchObject({ name: "promo", language: { code: "en" } });
    expect(meta.sends[0].body.template.components[0].parameters).toHaveLength(2);

    await settle();
    await hook(meta.sends[0].wamid, "read");
    expect(await stats()).toMatchObject({ total: 120, sent: 120, delivered: 120, read: 1, failed: 0, pending: 0, status: "completed" });
    const [c] = await db.sql(`select * from contacts where phone = '${meta.sends[0].to}'`);
    expect(c).toMatchObject({ wa_status: "valid", unread_streak: 0 });
    expect((await db.sql("select value from settings where key = 'dispatcher_last_run'"))[0].value.sent).toBe(120);
  });

  it("does nothing and stays cheap when no campaign is running", async () => {
    expect(await runDispatch()).toMatchObject({ idle: true });
  });

  it("retries temporary API errors with backoff until the message goes out", async () => {
    await addContacts(3);
    meta.script[phone(1)] = [131000, 131016, 1];
    await start();
    expect(await runDispatch()).toMatchObject({ sent: 2, retried: 1 });
    let [m] = await msgs(`c.phone = '${phone(1)}'`);
    expect(m).toMatchObject({ status: "queued", retry_count: 1, error_code: 131000, attempts: 1 });
    expect(new Date(m.next_attempt_at).getTime()).toBeGreaterThan(Date.now() + 50e3);
    expect((await stats())).toMatchObject({ status: "running", retrying: 1 });

    await runDispatch(); // backoff not elapsed: nothing is re-sent early
    expect(meta.attempts[phone(1)]).toBe(1);

    await drain();
    [m] = await msgs(`c.phone = '${phone(1)}'`);
    expect(m).toMatchObject({ status: "delivered", retry_count: 3, attempts: 4, error_code: null });
    expect(await stats()).toMatchObject({ delivered: 3, failed: 0, status: "completed" });
    const log = await db.sql("select action, error_code from send_attempts where message_id = $1 order by id", [m.id]);
    expect(log.map((a: any) => a.action)).toEqual(["retry", "retry", "retry", "sent"]);
  });

  it("re-queues a message Meta failed after accepting it (per-user marketing cap) a day later", async () => {
    await addContacts(2);
    await start();
    await runDispatch();
    await hook(meta.sends[1].wamid, "delivered");
    await runDispatch();
    expect((await stats()).status).toBe("completed"); // nothing left to send

    await hook(meta.sends[0].wamid, "failed", 131049);
    const [m] = await msgs(`c.phone = '${meta.sends[0].to}'`);
    expect(m).toMatchObject({ status: "queued", retry_count: 1, error_code: 131049, wa_message_id: null });
    const wait = new Date(m.next_attempt_at).getTime() - Date.now();
    expect(wait).toBeGreaterThan(23.9 * H);
    expect(wait).toBeLessThan(24.1 * H);
    expect((await stats()).status).toBe("running"); // reopened so the loop picks the retry up

    // the failed first attempt set last_marketing_at; the retry must not be blocked by the frequency cap
    await drain();
    expect(meta.attempts[meta.sends[0].to]).toBe(2);
    expect(await stats()).toMatchObject({ delivered: 2, failed: 0, status: "completed" });
  });

  it("gives up after max_retries and records why", async () => {
    await addContacts(1);
    meta.script[phone(0)] = Array(20).fill(131000);
    await db.pg.exec("update settings set value = '3' where key = 'max_retries'");
    await start();
    await drain();
    const [m] = await msgs();
    expect(m).toMatchObject({ status: "failed", retry_count: 3, attempts: 4, error_code: 131000 });
    expect(m.error_title).toMatch(/gave up after 3 retries/);
    expect(meta.attempts[phone(0)]).toBe(4);
    expect((await stats()).status).toBe("completed");
  });

  it("stops retrying once the retry window has ended", async () => {
    await addContacts(1);
    await start();
    await runDispatch();
    await db.pg.exec("update messages set expires_at = now() + interval '2 hours'");
    await hook(meta.sends[0].wamid, "failed", 131049); // next try would be 24h away, past the window
    const [m] = await msgs();
    expect(m.status).toBe("failed");
    expect(m.error_title).toMatch(/retry window ended/);
  });

  it("flags a number as not on WhatsApp only after three undeliverable results", async () => {
    await addContacts(1);
    await start();
    await drain({ [phone(0)]: [131026, 131026, 131026] });
    const [m] = await msgs();
    expect(m).toMatchObject({ status: "failed", error_code: 131026, retry_count: 2 });
    expect(meta.attempts[phone(0)]).toBe(3);
    expect((await db.sql("select wa_status from contacts"))[0].wa_status).toBe("invalid");
  });

  it("recovers a number that was only temporarily undeliverable", async () => {
    await addContacts(1);
    await start();
    await drain({ [phone(0)]: [131026] });
    expect((await msgs())[0].status).toBe("delivered");
    expect((await db.sql("select wa_status from contacts"))[0].wa_status).toBe("valid");
  });

  it("respects a marketing opt-out reported by Meta and never retries it", async () => {
    await addContacts(1);
    await start();
    await drain({ [phone(0)]: [131050] });
    expect(meta.attempts[phone(0)]).toBe(1);
    expect((await db.sql("select opted_in from contacts"))[0].opted_in).toBe(false);
    expect((await msgs())[0].status).toBe("failed");
  });

  it("stops the pass on a rate limit without losing or burning any message", async () => {
    await addContacts(40);
    for (let i = 0; i < 40; i++) meta.script[phone(i)] = [130429];
    await start();
    const run = await runDispatch();
    expect(run.sent).toBe(0);
    expect(Object.keys(meta.attempts).length).toBeLessThanOrEqual(20); // halted after the first parallel wave
    const all = await msgs();
    expect(all.every((m: any) => m.status === "queued" && m.retry_count === 0)).toBe(true);
    expect((await stats()).status).toBe("running");
    await drain();
    expect(await stats()).toMatchObject({ delivered: 40, failed: 0 });
  });

  it("pauses everything on a payment problem and resumes without loss", async () => {
    await addContacts(5);
    meta.script[phone(0)] = [131042];
    await start({ rate_per_minute: 1 }); // one message per pass, so the failing contact is hit first
    await db.pg.exec(`update messages set next_attempt_at = now() - interval '1 minute' where contact_id = (select id from contacts where phone = '${phone(0)}')`);
    await runDispatch();
    const c = await stats();
    expect(c.status).toBe("paused");
    expect(c.pause_reason).toMatch(/131042/);
    await due();
    expect(await runDispatch()).toMatchObject({ idle: true }); // paused campaigns send nothing
    expect(meta.sends).toHaveLength(0);

    await patchCampaign(post("/api/campaigns", { id: c.id, status: "running" }, "PATCH"));
    await db.pg.exec("update campaigns set rate_per_minute = 600");
    await drain();
    expect(await stats()).toMatchObject({ delivered: 5, failed: 0, status: "completed" });
  });

  it("pauses only the affected campaign on a template error", async () => {
    const cs = await addContacts(4);
    await db.pg.exec(`insert into templates (name, language, category, status, components) values
      ('broken', 'en', 'MARKETING', 'APPROVED', '[{"type":"BODY","text":"Hi {{1}}, {{2}}"}]')`);
    meta.script[phone(0)] = [132001];
    const bad = await start({ name: "bad", template_name: "broken", contact_ids: [cs[0].id, cs[1].id], rate_per_minute: 1 });
    await runDispatch();
    const good = await start({ name: "good", contact_ids: [cs[2].id, cs[3].id] });
    await runDispatch();
    await settle();
    const all = await db.sql("select name, status, delivered from campaign_stats order by name");
    expect(all).toMatchObject([{ name: "bad", status: "paused" }, { name: "good", delivered: 2 }]);
    expect(bad.campaign.id).not.toBe(good.campaign.id);
    expect((await msgs(`m.campaign_id = '${bad.campaign.id}'`)).every((m: any) => m.status === "queued")).toBe(true);
  });

  it("pauses a campaign whose template lost approval before sending", async () => {
    await addContacts(2);
    await start();
    await processWebhook({ entry: [{ changes: [{ field: "message_template_status_update",
      value: { event: "PAUSED", message_template_name: "promo", message_template_language: "en" } }] }] });
    expect((await stats()).status).toBe("paused");
    await runDispatch();
    expect(meta.sends).toHaveLength(0);
  });

  it("stops sending when the number's quality turns RED", async () => {
    await addContacts(2);
    await start();
    meta.health.quality_rating = "RED";
    expect(await runDispatch()).toMatchObject({ paused: "quality RED" });
    expect(meta.sends).toHaveLength(0);
    expect((await stats()).status).toBe("paused");
  });

  it("trips the circuit breaker when most sends fail for systemic reasons", async () => {
    await addContacts(30);
    for (let i = 0; i < 30; i++) meta.script[phone(i)] = Array(10).fill(131000);
    await start();
    await runDispatch();
    const c = await stats();
    expect(c.status).toBe("paused");
    expect(c.pause_reason).toMatch(/Auto-paused: 30\/30/);
  });

  it("holds messages during quiet hours instead of sending or dropping them", async () => {
    await addContacts(3);
    await start();
    const h = Number(new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", hour: "2-digit", hour12: false }).format(new Date())) % 24;
    await db.pg.exec(`update settings set value = '${h}' where key = 'quiet_start'; update settings set value = '${(h + 1) % 24}' where key = 'quiet_end'`);
    expect(await runDispatch()).toMatchObject({ sent: 0, deferred: 3 });
    const all = await msgs();
    expect(all.every((m: any) => m.status === "queued" && new Date(m.next_attempt_at).getTime() > Date.now())).toBe(true);
    await db.pg.exec("update settings set value = '0' where key in ('quiet_start','quiet_end')");
    await drain();
    expect((await stats()).delivered).toBe(3);
  });

  it("stays under the daily recipient limit and continues the next day", async () => {
    await addContacts(60);
    await db.pg.exec("update settings set value = '50' where key = 'daily_cap_override'");
    await start();
    expect((await runDispatch()).sent).toBe(47); // 95% of 50
    expect(await runDispatch()).toMatchObject({ capped: true });
    expect(meta.sends).toHaveLength(47);
    await db.pg.exec("update messages set sent_at = sent_at - interval '25 hours' where sent_at is not null");
    expect((await runDispatch()).sent).toBe(13);
    await settle();
    expect(await stats()).toMatchObject({ delivered: 60, pending: 0 });
  });

  it("honours the per-minute rate of the campaign", async () => {
    await addContacts(25);
    await start({ rate_per_minute: 10 });
    expect((await runDispatch()).sent).toBe(10);
    expect((await runDispatch()).sent).toBe(10);
    expect((await runDispatch()).sent).toBe(5);
  });

  it("skips a contact who opted out after the campaign was queued", async () => {
    await addContacts(2);
    await start();
    await processWebhook(inboundEvent(phone(0), "STOP"));
    await runDispatch();
    expect(meta.sends.filter((s) => s.body.type === "template").map((s) => s.to)).toEqual([phone(1)]);
    expect((await msgs(`c.phone = '${phone(0)}' and type = 'template'`))[0]).toMatchObject({ status: "skipped" });
  });

  it("starts a scheduled campaign only when its time comes", async () => {
    await addContacts(2);
    await start({ scheduled_at: new Date(Date.now() + 2 * H).toISOString() });
    expect(await runDispatch()).toMatchObject({ idle: true });
    await db.pg.exec("update campaigns set scheduled_at = now() - interval '1 minute'");
    await drain();
    expect(await stats()).toMatchObject({ delivered: 2, status: "completed" });
  });

  it("recovers messages left in 'sending' by a crashed run, without double-sending the rest", async () => {
    await addContacts(5);
    await start();
    await db.pg.exec(`update messages set status = 'sending', updated_at = now() - interval '10 minutes'
      where contact_id in (select id from contacts where phone in ('${phone(0)}','${phone(1)}'))`);
    await runDispatch();
    expect(meta.sends).toHaveLength(5);
    expect(new Set(meta.sends.map((s) => s.to)).size).toBe(5);
  });

  it("lets two overlapping passes run without sending anything twice", async () => {
    await addContacts(150);
    await start();
    await Promise.all([runDispatch(), runDispatch(), runDispatch()]);
    expect(meta.sends).toHaveLength(150);
    expect(new Set(meta.sends.map((s) => s.to)).size).toBe(150);
  });

  it("re-queues failed messages on demand with a fresh retry allowance", async () => {
    await addContacts(2);
    meta.script[phone(0)] = Array(4).fill(131000);
    await db.pg.exec("update settings set value = '1' where key = 'max_retries'");
    await start();
    await drain();
    const c = await stats();
    expect(c).toMatchObject({ failed: 1, delivered: 1, status: "completed" });

    const r = await (await patchCampaign(post("/api/campaigns", { id: c.id, action: "retry_failed" }, "PATCH"))).json();
    expect(r.requeued).toBe(1);
    expect((await stats()).status).toBe("running");
    await drain(); // attempts 3 and 4 fail, so it fails again; a third round finally lands
    await patchCampaign(post("/api/campaigns", { id: c.id, action: "retry_failed" }, "PATCH"));
    await drain();
    expect(await stats()).toMatchObject({ failed: 0, delivered: 2, status: "completed" });
  });
});

describe("webhooks", () => {
  it("ignores duplicate and out-of-order status events", async () => {
    await addContacts(1);
    await start();
    await runDispatch();
    const id = meta.sends[0].wamid;
    await hook(id, "read");
    await hook(id, "delivered"); // late: must not downgrade
    await hook(id, "delivered");
    await hook(id, "sent");
    const [m] = await msgs();
    expect(m.status).toBe("read");
    expect(m.delivered_at).toBeTruthy();
    expect((await db.sql("select unread_streak from contacts"))[0].unread_streak).toBe(0);
  });

  it("counts a duplicated failure event once", async () => {
    await addContacts(1);
    await start();
    await runDispatch();
    await hook(meta.sends[0].wamid, "failed", 131049);
    await hook(meta.sends[0].wamid, "failed", 131049);
    expect((await msgs())[0].retry_count).toBe(1);
  });

  it("handles STOP and START", async () => {
    await processWebhook(inboundEvent(phone(9), "stop"));
    expect((await db.sql("select opted_in from contacts"))[0].opted_in).toBe(false);
    await processWebhook(inboundEvent(phone(9), "START"));
    expect((await db.sql("select opted_in from contacts"))[0].opted_in).toBe(true);
    expect(meta.sends.filter((s) => s.body.type === "text")).toHaveLength(2); // confirmations
  });

  it("verifies Meta's handshake and rejects unsigned or forged deliveries", async () => {
    const ok = await verifyHook(new NextRequest("https://app.test/api/webhook?hub.mode=subscribe&hub.verify_token=verify-me&hub.challenge=42"));
    expect(await ok.text()).toBe("42");
    const bad = await verifyHook(new NextRequest("https://app.test/api/webhook?hub.mode=subscribe&hub.verify_token=nope&hub.challenge=42"));
    expect(bad.status).toBe(403);

    const raw = JSON.stringify(statusEvent("wamid.none", "delivered"));
    const sig = "sha256=" + crypto.createHmac("sha256", "app-secret").update(raw).digest("hex");
    const send = (headers: Record<string, string>) =>
      receiveHook(new NextRequest("https://app.test/api/webhook", { method: "POST", body: raw, headers }));
    expect((await send({ "x-hub-signature-256": sig })).status).toBe(200);
    expect((await send({ "x-hub-signature-256": sig.replace(/.$/, "0") })).status).toBe(401);
    expect((await send({})).status).toBe(401);
  });
});

describe("scheduler endpoint", () => {
  const call = (auth?: string) =>
    cron(new NextRequest("https://app.test/api/cron/dispatch", { headers: auth ? { authorization: auth } : {} }));

  it("accepts only the cron secret", async () => {
    expect((await call()).status).toBe(401);
    expect((await call("Bearer wrong")).status).toBe(401);
    expect(await (await call("Bearer cron-secret")).json()).toMatchObject({ idle: true });
  });

  it("is closed when no secret is configured", async () => {
    const saved = process.env.CRON_SECRET;
    delete process.env.CRON_SECRET;
    expect((await call("Bearer undefined")).status).toBe(401);
    process.env.CRON_SECRET = saved;
  });

  it("reports a missing database instead of crashing", async () => {
    const saved = process.env.SUPABASE_SERVICE_ROLE_KEY;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    expect(await (await call("Bearer cron-secret")).json()).toMatchObject({ configured: false });
    process.env.SUPABASE_SERVICE_ROLE_KEY = saved;
  });
});

describe("whole-campaign simulation", () => {
  it("delivers to every reachable contact exactly once under mixed failures", async () => {
    const N = 400;
    await addContacts(N);
    // deterministic pseudo-random mix of behaviours
    let seed = 7;
    const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const pick = <T,>(xs: T[]) => xs[Math.floor(rnd() * xs.length)];
    const asyncScript: Record<string, (number | "delivered")[]> = {};
    const expected: Record<string, "delivered" | "failed"> = {};
    for (let i = 0; i < N; i++) {
      const p = phone(i), r = rnd();
      expected[p] = "delivered";
      if (r < 0.55) continue;                                                           // clean delivery
      else if (r < 0.70) meta.script[p] = Array(1 + Math.floor(rnd() * 3)).fill(pick([131000, 131016, 1, 503])); // flaky API
      else if (r < 0.80) asyncScript[p] = Array(1 + Math.floor(rnd() * 3)).fill(131049); // Meta per-user cap, then lands
      else if (r < 0.86) asyncScript[p] = [131026];                                      // temporarily unreachable
      else if (r < 0.90) { meta.script[p] = [131056]; asyncScript[p] = [131000]; }       // pair rate limit, then async error
      else if (r < 0.94) { asyncScript[p] = [131026, 131026, 131026]; expected[p] = "failed"; } // really no WhatsApp
      else if (r < 0.97) { asyncScript[p] = [131050]; expected[p] = "failed"; }          // opted out of marketing
      else { meta.script[p] = Array(50).fill(131008); expected[p] = "failed"; }          // permanently rejected
    }
    await db.pg.exec("update settings set value = '100' where key = 'auto_pause_fail_pct'");
    await start();
    const passes = await drain(asyncScript, 200);

    const all = await msgs();
    expect(all).toHaveLength(N);
    const wrong = all.filter((m: any) => m.status !== expected[m.phone]);
    expect(wrong.map((m: any) => `${m.phone}: ${m.status} (${m.error_code})`)).toEqual([]);

    // nobody received the message twice: at most one accepted send ended in delivery per contact
    const delivered = all.filter((m: any) => m.status === "delivered");
    const acceptedPerPhone = new Map<string, number>();
    for (const s of meta.sends) acceptedPerPhone.set(s.to, (acceptedPerPhone.get(s.to) ?? 0) + 1);
    for (const m of delivered) {
      const failedAsync = (await db.sql("select count(*)::int n from send_attempts where message_id = $1 and source = 'webhook'", [m.id]))[0].n;
      expect(acceptedPerPhone.get(m.phone)).toBe(failedAsync + 1);
    }

    const c = await stats();
    const want = Object.values(expected).filter((x) => x === "delivered").length;
    expect(c).toMatchObject({ total: N, delivered: want, failed: N - want, pending: 0, status: "completed" });
    console.log(`simulation: ${N} contacts, ${want} reachable, ${c.delivered} delivered (${((c.delivered / want) * 100).toFixed(1)}% of reachable), ` +
      `${meta.sends.length} accepted sends, ${passes} loop passes`);
  });
});
