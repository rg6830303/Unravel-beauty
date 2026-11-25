import { NextRequest, NextResponse } from "next/server";
import { authorised, OtpError, sendOtp } from "@/lib/otp";

export const dynamic = "force-dynamic";

// Called by your platform's server (never from a browser): Authorization: Bearer <OTP_API_KEY>
// Body: { "phone": "+91 98765 43210", "country": "IN" }
export async function POST(req: NextRequest) {
  if (!authorised(req.headers.get("authorization"))) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { phone, country } = await req.json().catch(() => ({}));
  try {
    return NextResponse.json({ ok: true, ...(await sendOtp(String(phone ?? ""), country || "IN")) });
  } catch (e: any) {
    if (!(e instanceof OtpError)) { console.error("otp send failed", e); return NextResponse.json({ error: "server error", code: "server" }, { status: 500 }); }
    return NextResponse.json({ ok: false, error: e.message, code: e.code }, { status: e.status, headers: e.retryAfter ? { "Retry-After": String(e.retryAfter) } : {} });
  }
}
