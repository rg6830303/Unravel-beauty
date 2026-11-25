import { NextRequest, NextResponse } from "next/server";
import { authorised, OtpError, verifyOtp } from "@/lib/otp";

export const dynamic = "force-dynamic";

// Body: { "phone": "+91 98765 43210", "code": "123456", "country": "IN" } -> { ok: true, verified: true, phone: "9198..." }
export async function POST(req: NextRequest) {
  if (!authorised(req.headers.get("authorization"))) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { phone, code, country } = await req.json().catch(() => ({}));
  try {
    return NextResponse.json({ ok: true, ...(await verifyOtp(String(phone ?? ""), String(code ?? ""), country || "IN")) });
  } catch (e: any) {
    if (!(e instanceof OtpError)) { console.error("otp verify failed", e); return NextResponse.json({ error: "server error", code: "server" }, { status: 500 }); }
    return NextResponse.json({ ok: false, verified: false, error: e.message, code: e.code }, { status: e.status });
  }
}
