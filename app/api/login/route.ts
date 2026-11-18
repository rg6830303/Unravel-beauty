import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { db } from "@/lib/db";
import { allowedEmails, createSession, SESSION_COOKIE, SESSION_TTL_MS } from "@/lib/session";

export const dynamic = "force-dynamic";

// A throwaway client per sign-in, so a user session never attaches to the shared service-role client.
const authClient = () =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false, autoRefreshToken: false } });

// Sign in with a Supabase Auth user. The first admin (ADMIN_EMAILS[0] + DASHBOARD_PASSWORD) is created on first login.
export async function POST(req: NextRequest) {
  const { email: rawEmail, password } = await req.json().catch(() => ({}));
  const email = String(rawEmail ?? "").trim().toLowerCase();
  if (!process.env.AUTH_SECRET) return NextResponse.json({ error: "AUTH_SECRET is not configured" }, { status: 500 });
  if (!email || typeof password !== "string" || !password)
    return NextResponse.json({ error: "Email and password required" }, { status: 400 });
  if (!allowedEmails().includes(email)) return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });

  let { error } = await authClient().auth.signInWithPassword({ email, password });
  const bootstrap = process.env.DASHBOARD_PASSWORD;
  if (error && email === allowedEmails()[0] && bootstrap && password === bootstrap) {
    const created = await db.auth.admin.createUser({ email, password, email_confirm: true });
    if (!created.error) ({ error } = await authClient().auth.signInWithPassword({ email, password }));
  }
  if (error) return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });

  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, await createSession(email), {
    httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: SESSION_TTL_MS / 1000,
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(SESSION_COOKIE);
  return res;
}
