import crypto from "crypto";
import { db } from "./db";
import { normalizePhone } from "./phone";
import { sendAuthCode } from "./whatsapp";

export const OTP_TTL_MIN = 5;      // keep in step with code_expiration_minutes on the template
const MAX_ATTEMPTS = 5;            // wrong guesses before a code is dead
const SEND_LIMIT = 3;              // codes per phone per window
const SEND_WINDOW_MIN = 10;
const MIN_GAP_S = 30;              // minimum seconds between two codes to the same phone

export class OtpError extends Error {
  constructor(message: string, public status: number, public code: string, public retryAfter?: number) { super(message); }
}

const secret = () => process.env.AUTH_SECRET || "";
const hash = (phone: string, code: string) => crypto.createHmac("sha256", secret()).update(`${phone}:${code}`).digest("hex");
const template = () => process.env.OTP_TEMPLATE || "flexon_otp_v1";

// Generates a 6-digit code, delivers it on WhatsApp and stores its hash. Throttled per phone.
export async function sendOtp(rawPhone: string, country = "IN") {
  if (!secret()) throw new OtpError("Server is not configured", 500, "not_configured");
  const phone = normalizePhone(rawPhone, country as any);
  if (!phone) throw new OtpError("Invalid mobile number", 400, "invalid_phone");

  const since = new Date(Date.now() - SEND_WINDOW_MIN * 60e3).toISOString();
  const { data: recent, error } = await db.from("otp_codes").select("created_at").eq("phone", phone).gte("created_at", since).order("created_at", { ascending: false });
  if (error) throw new OtpError("OTP storage is not set up (run supabase/otp.sql)", 500, "storage");
  const last = recent?.[0] && new Date(recent[0].created_at).getTime();
  if (last && Date.now() - last < MIN_GAP_S * 1000)
    throw new OtpError("Please wait before requesting another code", 429, "too_soon", Math.ceil(MIN_GAP_S - (Date.now() - last) / 1000));
  if ((recent?.length ?? 0) >= SEND_LIMIT)
    throw new OtpError("Too many codes requested. Try again later", 429, "rate_limited", SEND_WINDOW_MIN * 60);

  const code = String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");
  const r = await sendAuthCode(phone, template(), "en", code);
  if (!r.ok) throw new OtpError(r.code === 131030 || r.code === 131026 ? "This number cannot receive WhatsApp messages" : "Could not send the code", 502, "send_failed");

  await db.from("otp_codes").insert({
    phone, code_hash: hash(phone, code), wa_message_id: r.id,
    expires_at: new Date(Date.now() + OTP_TTL_MIN * 60e3).toISOString(),
  });
  return { phone, expires_in: OTP_TTL_MIN * 60 };
}

// Checks a code against the newest unused one for that phone. A code works once.
export async function verifyOtp(rawPhone: string, code: string, country = "IN") {
  const phone = normalizePhone(rawPhone, country as any);
  if (!phone || !/^\d{6}$/.test(code ?? "")) throw new OtpError("Invalid number or code", 400, "invalid");
  const { data: row } = await db.from("otp_codes").select("*").eq("phone", phone).eq("consumed", false)
    .order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (!row || new Date(row.expires_at).getTime() < Date.now()) throw new OtpError("Code expired or not found", 400, "expired");
  if (row.attempts >= MAX_ATTEMPTS) throw new OtpError("Too many wrong attempts. Request a new code", 429, "locked");

  const a = Buffer.from(hash(phone, code)), b = Buffer.from(row.code_hash);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    await db.from("otp_codes").update({ attempts: row.attempts + 1 }).eq("id", row.id);
    throw new OtpError("Incorrect code", 400, "incorrect");
  }
  await db.from("otp_codes").update({ consumed: true }).eq("id", row.id);
  return { phone, verified: true };
}

// Bearer-key check for the sports platform's server. Constant-time; fails closed if no key is configured.
export function authorised(header: string | null) {
  const key = process.env.OTP_API_KEY;
  if (!key || !header?.startsWith("Bearer ")) return false;
  const got = Buffer.from(header.slice(7)), want = Buffer.from(key);
  return got.length === want.length && crypto.timingSafeEqual(got, want);
}
