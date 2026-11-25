import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { createDb, fakeMeta } from "./harness";
import { POST as send } from "@/app/api/otp/send/route";
import { POST as verify } from "@/app/api/otp/verify/route";

let db: Awaited<ReturnType<typeof createDb>>;
let meta: ReturnType<typeof fakeMeta>;
const call = (fn: any, body: any, key: string | null = "k-123") =>
  fn(new NextRequest("https://app.test/api/otp/x", { method: "POST", body: JSON.stringify(body), headers: key ? { authorization: `Bearer ${key}` } : {} }));
const PHONE = "+91 98765 43210";
const sentCode = () => meta.sends.at(-1)!.body.template.components[0].parameters[0].text as string;
const age = () => db.pg.exec("update otp_codes set created_at = now() - interval '1 minute'");

beforeAll(async () => {
  Object.assign(process.env, {
    WA_PHONE_NUMBER_ID: "111", WA_ACCESS_TOKEN: "t", AUTH_SECRET: "s".repeat(32), OTP_API_KEY: "k-123",
    NEXT_PUBLIC_SUPABASE_URL: "https://x.supabase.co", SUPABASE_SERVICE_ROLE_KEY: "k",
  });
  db = await createDb();
});
beforeEach(async () => {
  await db.reset();
  meta = fakeMeta();
});

describe("WhatsApp OTP", () => {
  it("rejects calls without the API key", async () => {
    expect((await call(send, { phone: PHONE }, null)).status).toBe(401);
    expect((await call(send, { phone: PHONE }, "wrong")).status).toBe(401);
    expect(meta.sends).toHaveLength(0);
  });

  it("sends the code in body and copy-code button, stores only a hash, and verifies once", async () => {
    expect((await call(send, { phone: PHONE })).status).toBe(200);
    const m = meta.sends[0].body;
    expect(m.to).toBe("919876543210");
    expect(m.template.name).toBe("flexon_otp_v1");
    expect(m.template.components[1]).toMatchObject({ type: "button", sub_type: "url", index: "0" });
    const code = sentCode();
    expect(code).toMatch(/^\d{6}$/);
    expect(JSON.stringify(await db.sql("select * from otp_codes"))).not.toContain(code);
    expect((await call(verify, { phone: PHONE, code })).status).toBe(200);
    expect((await call(verify, { phone: PHONE, code })).status).toBe(400); // a code works once
  });

  it("locks a code after 5 wrong guesses, even if the right one follows", async () => {
    await call(send, { phone: PHONE });
    const code = sentCode();
    const wrong = code === "000000" ? "111111" : "000000";
    for (let i = 0; i < 5; i++) expect((await call(verify, { phone: PHONE, code: wrong })).status).toBe(400);
    expect((await call(verify, { phone: PHONE, code })).status).toBe(429);
  });

  it("expires codes after 5 minutes", async () => {
    await call(send, { phone: PHONE });
    const code = sentCode();
    await db.pg.exec("update otp_codes set expires_at = now() - interval '1 second'");
    expect((await (await call(verify, { phone: PHONE, code })).json()).code).toBe("expired");
  });

  it("throttles repeat sends to one number", async () => {
    expect((await call(send, { phone: PHONE })).status).toBe(200);
    const again = await call(send, { phone: PHONE });
    expect(again.status).toBe(429);
    expect(again.headers.get("retry-after")).toBeTruthy();
    expect(meta.sends).toHaveLength(1);
    await age();
    expect((await call(send, { phone: PHONE })).status).toBe(200);
    await age();
    expect((await call(send, { phone: PHONE })).status).toBe(200);
    await age();
    expect((await call(send, { phone: PHONE })).status).toBe(429); // 4th within 10 minutes
  });

  it("rejects invalid numbers and never creates marketing contacts", async () => {
    expect((await call(send, { phone: "12345" })).status).toBe(400);
    await call(send, { phone: PHONE });
    expect(await db.sql("select id from contacts")).toHaveLength(0);
  });
});
