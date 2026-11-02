import { NextRequest, NextResponse } from "next/server";

// Password gate for dashboard + internal APIs. Webhook, cron (own bearer secret) and tracked links are public.
// Fails CLOSED: with no DASHBOARD_PASSWORD configured nothing is accessible.
export async function middleware(req: NextRequest) {
  const p = req.nextUrl.pathname;
  if (p.startsWith("/api/webhook") || p.startsWith("/api/cron") || p.startsWith("/r/") || p === "/login" || p === "/api/login")
    return NextResponse.next();

  const pw = process.env.DASHBOARD_PASSWORD;
  if (pw) {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`wa-outreach:${pw}`));
    const token = Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
    if (req.cookies.get("auth")?.value === token) return NextResponse.next();
  }
  if (p.startsWith("/api")) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  return NextResponse.redirect(new URL("/login", req.url));
}

export const config = { matcher: ["/((?!_next|favicon.ico).*)"] };
