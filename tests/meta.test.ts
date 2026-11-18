import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { validateTemplate } from "@/lib/meta";
import { GET, POST } from "@/app/api/meta/[action]/route";

let calls: { url: string; method: string; body: any }[] = [];
beforeAll(() => Object.assign(process.env, { WA_ACCESS_TOKEN: "t", WA_BUSINESS_ACCOUNT_ID: "222", WA_PHONE_NUMBER_ID: "111" }));
beforeEach(() => {
  calls = [];
  vi.stubGlobal("fetch", async (url: any, init: any = {}) => {
    const u = String(url);
    calls.push({ url: u, method: init.method ?? "GET", body: init.body ? JSON.parse(init.body) : null });
    if (u.includes("/request_code")) return new Response(JSON.stringify({ error: { code: 136024, message: "Too many attempts" } }), { status: 400 });
    if (u.includes("/messages")) return new Response(JSON.stringify({ messages: [{ id: "wamid.1" }] }));
    if (u.includes("/phone_numbers") && init.method === "POST") return new Response(JSON.stringify({ id: "999" }));
    return new Response(JSON.stringify({ data: [{ id: "1", name: "x" }] }));
  });
});

const call = (fn: any, action: string, body?: any, q = "") =>
  fn(new NextRequest(`https://app.test/api/meta/${action}${q}`, body ? { method: "POST", body: JSON.stringify(body) } : {}), { params: { action } });

describe("WhatsApp Business tools", () => {
  it("lists phone numbers of the configured WhatsApp account", async () => {
    const r = await call(GET, "phone_numbers");
    expect(r.status).toBe(200);
    expect(calls[0].url).toContain("/222/phone_numbers");
  });
  it("adds a number and passes Meta errors through", async () => {
    const r = await call(POST, "add_phone_number", { cc: "91", phone_number: "9876543210", verified_name: "Shop" });
    expect((await r.json()).data.id).toBe("999");
    const e = await call(POST, "send_verification_code", { id: "999" });
    expect(e.status).toBe(400);
    expect((await e.json()).error).toBe("Too many attempts");
  });
  it("rejects missing params and bad PINs before calling Meta", async () => {
    expect((await call(POST, "verify_phone_number", { id: "1" })).status).toBe(400);
    expect((await call(POST, "register_phone_number", { id: "1", pin: "12" })).status).toBe(400);
    expect(calls).toHaveLength(0);
  });
  it("validates templates locally", () => {
    const t = (text: string, example?: any) => ({ name: "promo", language: "en_US", category: "MARKETING" as const,
      components: [{ type: "BODY", text, ...(example ? { example } : {}) }] });
    expect(validateTemplate({ ...t("hi"), name: "Bad Name" })).toMatch(/lowercase/);
    expect(validateTemplate(t("hi {{1}}"))).toMatch(/example/);
    expect(validateTemplate(t("hi {{2}}", { body_text: [["a"]] }))).toMatch(/order/);
    expect(validateTemplate(t("hi {{1}}", { body_text: [["a"]] }))).toBeNull();
  });
  it("send_message needs explicit confirmation", async () => {
    const first = await call(POST, "send_message", { to: "+91 98765 43210", text: "hello" });
    expect(first.status).toBe(409);
    const ok = await call(POST, "send_message", { to: "+91 98765 43210", template: "promo", confirm: true });
    expect((await ok.json()).data.id).toBe("wamid.1");
    expect(calls.at(-1)!.body).toMatchObject({ to: "919876543210", type: "template" });
  });
  it("unknown tools 404", async () => {
    expect((await call(GET, "nope")).status).toBe(404);
  });
});
