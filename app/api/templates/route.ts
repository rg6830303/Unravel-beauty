import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
import { fetchTemplates } from "@/lib/whatsapp";

export async function GET() {
  const { data } = await db.from("templates").select("*").order("name");
  return NextResponse.json({ data });
}

// Sync approved templates from Meta
export async function POST() {
  try {
    const list = await fetchTemplates();
    const rows = list.map((t) => ({
      name: t.name, language: t.language, category: t.category, status: t.status,
      components: t.components, synced_at: new Date().toISOString(),
    }));
    if (rows.length) await db.from("templates").upsert(rows, { onConflict: "name,language" });
    return NextResponse.json({ synced: rows.length });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
