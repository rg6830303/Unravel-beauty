import { NextRequest, NextResponse } from "next/server";
import { waitUntil } from "@vercel/functions";
import { verifySignature } from "@/lib/whatsapp";
import { processWebhook } from "@/lib/webhook";

export const maxDuration = 300;

// Meta verification handshake
export async function GET(req: NextRequest) {
  const s = req.nextUrl.searchParams;
  const token = process.env.WA_VERIFY_TOKEN;
  if (token && s.get("hub.mode") === "subscribe" && s.get("hub.verify_token") === token)
    return new NextResponse(s.get("hub.challenge"), { status: 200 });
  return new NextResponse("forbidden", { status: 403 });
}

// Acknowledge Meta immediately (it retries and eventually disables slow webhooks), process in the background.
export async function POST(req: NextRequest) {
  const raw = await req.text();
  if (!verifySignature(raw, req.headers.get("x-hub-signature-256")))
    return new NextResponse("bad signature", { status: 401 });

  let body: any;
  try { body = JSON.parse(raw); } catch { return new NextResponse("bad json", { status: 400 }); }
  waitUntil(processWebhook(body).catch((e) => console.error("webhook processing failed", e)));
  return NextResponse.json({ ok: true });
}
