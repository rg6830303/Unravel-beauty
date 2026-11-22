import { NextRequest, NextResponse } from "next/server";
import { readSession, SESSION_COOKIE } from "@/lib/session";

// Session gate for dashboard + internal APIs. Webhook, cron (own bearer secret) and tracked links are public.
// Fails CLOSED: with no AUTH_SECRET configured nothing is accessible.
export async function middleware(req: NextRequest) {
  const p = req.nextUrl.pathname;
  if (p.startsWith("/api/webhook") || p.startsWith("/api/cron") || p.startsWith("/r/") || p.startsWith("/media/") || ["/privacy", "/terms", "/data-deletion"].includes(p) || p === "/login" || p === "/api/login")
    return NextResponse.next();

  if (await readSession(req.cookies.get(SESSION_COOKIE)?.value)) return NextResponse.next();
  if (p.startsWith("/api")) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  return NextResponse.redirect(new URL("/login", req.url));
}

export const config = { matcher: ["/((?!_next|favicon.ico).*)"] };
