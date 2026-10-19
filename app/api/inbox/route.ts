import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendText } from "@/lib/whatsapp";

// GET ?contact=<id> -> thread; no param -> recent conversations
export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("contact");
  if (id) {
    const { data } = await db.from("messages").select("*").eq("contact_id", id).order("created_at").limit(300);
    const { data: contact } = await db.from("contacts").select("*").eq("id", id).single();
    return NextResponse.json({ contact, data });
  }
  const { data } = await db.from("contacts").select("id,name,phone,last_inbound_at,ai_enabled")
    .not("last_inbound_at", "is", null).order("last_inbound_at", { ascending: false }).limit(100);
  return NextResponse.json({ data });
}

// Agent manual reply (only inside 24h customer-service window)
export async function POST(req: NextRequest) {
  const { contact_id, text } = await req.json();
  const { data: c } = await db.from("contacts").select("*").eq("id", contact_id).single();
  if (!c) return NextResponse.json({ error: "no contact" }, { status: 404 });
  if (!c.last_inbound_at || Date.now() - new Date(c.last_inbound_at).getTime() > 24 * 3600e3)
    return NextResponse.json({ error: "24h window closed — send a template instead" }, { status: 400 });
  const r = await sendText(c.phone, text);
  await db.from("messages").insert({
    contact_id, direction: "out", body: text, status: r.ok ? "sent" : "failed",
    wa_message_id: r.ok ? r.id : null, error_code: r.ok ? null : r.code, error_title: r.ok ? null : r.title,
  });
  return NextResponse.json(r);
}
