import { NextRequest, NextResponse } from "next/server";

// Simple password gate for dashboard + internal APIs. Webhook and cron are excluded.
export function middleware(req: NextRequest) {
  const p = req.nextUrl.pathname;
  if (p.startsWith("/api/webhook") || p.startsWith("/api/cron") || p === "/login" || p === "/api/login")
    return NextResponse.next();
  if (req.cookies.get("auth")?.value === process.env.DASHBOARD_PASSWORD) return NextResponse.next();
  if (p.startsWith("/api")) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  return NextResponse.redirect(new URL("/login", req.url));
}

export const config = { matcher: ["/((?!_next|favicon.ico).*)"] };
