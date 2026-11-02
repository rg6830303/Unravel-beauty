import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { password } = await req.json().catch(() => ({}));
  const pw = process.env.DASHBOARD_PASSWORD;
  if (!pw || typeof password !== "string" || password.length !== pw.length ||
      !crypto.timingSafeEqual(Buffer.from(password), Buffer.from(pw)))
    return NextResponse.json({ error: "wrong password" }, { status: 401 });
  const token = crypto.createHash("sha256").update(`wa-outreach:${pw}`).digest("hex"); // cookie never holds the password itself
  const res = NextResponse.json({ ok: true });
  res.cookies.set("auth", token, { httpOnly: true, secure: true, sameSite: "lax", maxAge: 60 * 60 * 24 * 30 });
  return res;
}
