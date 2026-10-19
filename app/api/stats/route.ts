import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const c = (q: any) => q.then((r: any) => r.count ?? 0);
  const head = { count: "exact" as const, head: true };
  const since = new Date(Date.now() - 7 * 864e5).toISOString();
  const [contacts, valid, invalid, unknown, optedOut, sent, delivered, read, failed, inbound, aiReplies] = await Promise.all([
    c(db.from("contacts").select("id", head)),
    c(db.from("contacts").select("id", head).eq("wa_status", "valid")),
    c(db.from("contacts").select("id", head).eq("wa_status", "invalid")),
    c(db.from("contacts").select("id", head).eq("wa_status", "unknown")),
    c(db.from("contacts").select("id", head).eq("opted_in", false)),
    c(db.from("messages").select("id", head).eq("direction", "out").in("status", ["sent", "delivered", "read"]).gte("created_at", since)),
    c(db.from("messages").select("id", head).eq("direction", "out").in("status", ["delivered", "read"]).gte("created_at", since)),
    c(db.from("messages").select("id", head).eq("direction", "out").eq("status", "read").gte("created_at", since)),
    c(db.from("messages").select("id", head).eq("direction", "out").eq("status", "failed").gte("created_at", since)),
    c(db.from("messages").select("id", head).eq("direction", "in").gte("created_at", since)),
    c(db.from("messages").select("id", head).eq("is_ai", true).gte("created_at", since)),
  ]);
  const { data: errors } = await db.from("messages").select("error_code,error_title")
    .eq("status", "failed").gte("created_at", since).limit(1000);
  const byCode: Record<string, { title: string; n: number }> = {};
  for (const e of errors ?? []) {
    const k = String(e.error_code);
    byCode[k] = byCode[k] || { title: e.error_title, n: 0 };
    byCode[k].n++;
  }
  return NextResponse.json({ contacts, valid, invalid, unknown, optedOut, sent, delivered, read, failed, inbound, aiReplies, errors: byCode });
}
