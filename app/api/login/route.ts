import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { password } = await req.json();
  if (!process.env.DASHBOARD_PASSWORD || password !== process.env.DASHBOARD_PASSWORD)
    return NextResponse.json({ error: "wrong password" }, { status: 401 });
  const res = NextResponse.json({ ok: true });
  res.cookies.set("auth", password, { httpOnly: true, secure: true, sameSite: "lax", maxAge: 60 * 60 * 24 * 30 });
  return res;
}
