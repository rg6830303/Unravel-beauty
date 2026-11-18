// Signed dashboard session cookie: "<base64url email>.<expiry ms>.<hex HMAC-SHA256>".
// Uses Web Crypto so it runs in both the edge middleware and Node route handlers.
export const SESSION_COOKIE = "session";
export const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7;

const enc = new TextEncoder();
const hex = (b: ArrayBuffer) => Array.from(new Uint8Array(b)).map((x) => x.toString(16).padStart(2, "0")).join("");
const b64 = (s: string) => btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const unb64 = (s: string) => atob(s.replace(/-/g, "+").replace(/_/g, "/"));

async function sign(payload: string, secret: string) {
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return hex(await crypto.subtle.sign("HMAC", key, enc.encode(payload)));
}

export async function createSession(email: string, secret = process.env.AUTH_SECRET!) {
  const payload = `${b64(email)}.${Date.now() + SESSION_TTL_MS}`;
  return `${payload}.${await sign(payload, secret)}`;
}

// Returns the signed-in email, or null for a missing, tampered or expired cookie.
export async function readSession(token: string | undefined, secret = process.env.AUTH_SECRET): Promise<string | null> {
  if (!token || !secret) return null; // fail closed without a signing secret
  const [e, exp, sig] = token.split(".");
  if (!e || !exp || !sig) return null;
  const want = await sign(`${e}.${exp}`, secret);
  let diff = want.length ^ sig.length;
  for (let i = 0; i < Math.min(want.length, sig.length); i++) diff |= want.charCodeAt(i) ^ sig.charCodeAt(i);
  if (diff || Date.now() > Number(exp)) return null;
  try { return unb64(e); } catch { return null; }
}

// Only these Supabase Auth users may open the dashboard, even if sign-ups are enabled on the project.
export const allowedEmails = () =>
  (process.env.ADMIN_EMAILS ?? "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
