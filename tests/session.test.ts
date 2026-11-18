import { describe, expect, it } from "vitest";
import { createSession, readSession } from "@/lib/session";

describe("session cookie", () => {
  it("round-trips and rejects tampering, other secrets and missing secret", async () => {
    const t = await createSession("a@b.com", "s1");
    expect(await readSession(t, "s1")).toBe("a@b.com");
    expect(await readSession(t, "s2")).toBeNull();
    expect(await readSession(t, undefined)).toBeNull();
    const [e, exp, sig] = t.split(".");
    expect(await readSession(`${e}.${Number(exp) + 1}.${sig}`, "s1")).toBeNull();
    expect(await readSession("junk", "s1")).toBeNull();
  });
});
