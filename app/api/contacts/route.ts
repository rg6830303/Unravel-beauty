import { NextRequest, NextResponse } from "next/server";
import Papa from "papaparse";
import { db } from "@/lib/db";
import { normalizePhone } from "@/lib/phone";

export async function GET(req: NextRequest) {
  const s = req.nextUrl.searchParams;
  let q = db.from("contacts").select("*", { count: "exact" }).order("created_at", { ascending: false }).range(0, 499);
  if (s.get("wa_status")) q = q.eq("wa_status", s.get("wa_status")!);
  if (s.get("tag")) q = q.contains("tags", [s.get("tag")!]);
  if (s.get("q")) q = q.or(`phone.ilike.%${s.get("q")}%,name.ilike.%${s.get("q")}%`);
  const { data, count, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data, count });
}

// CSV upload: columns phone (required), name, tags (comma or ;), any others -> attributes
export async function POST(req: NextRequest) {
  const form = await req.formData();
  const file = form.get("file") as File | null;
  const country = (form.get("country") as string) || "IN";
  const extraTag = (form.get("tag") as string) || "";
  if (!file) return NextResponse.json({ error: "no file" }, { status: 400 });

  const { data: rows } = Papa.parse<Record<string, string>>(await file.text(), { header: true, skipEmptyLines: true });
  const seen = new Set<string>();
  const good: any[] = [];
  const rejected: { row: number; phone: string; reason: string }[] = [];

  rows.forEach((r, i) => {
    const key = Object.keys(r).find((k) => /phone|mobile|number|whatsapp/i.test(k));
    const rawPhone = key ? r[key] : "";
    const phone = normalizePhone(rawPhone, country as any);
    if (!phone) return rejected.push({ row: i + 2, phone: rawPhone, reason: "invalid / non-mobile number" });
    if (seen.has(phone)) return rejected.push({ row: i + 2, phone: rawPhone, reason: "duplicate in file" });
    seen.add(phone);
    const { name, tags, ...rest } = r;
    if (key) delete (rest as any)[key];
    const t = (tags || "").split(/[;,]/).map((x) => x.trim()).filter(Boolean);
    if (extraTag) t.push(extraTag);
    good.push({ phone, name: name || null, tags: t, attributes: rest });
  });

  for (let i = 0; i < good.length; i += 500) {
    const { error } = await db.from("contacts").upsert(good.slice(i, i + 500), { onConflict: "phone" });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ imported: good.length, rejected });
}

export async function PATCH(req: NextRequest) {
  const { id, ...fields } = await req.json();
  const allowed = ["name", "tags", "opted_in", "ai_enabled", "wa_status"];
  const upd = Object.fromEntries(Object.entries(fields).filter(([k]) => allowed.includes(k)));
  const { error } = await db.from("contacts").update(upd).eq("id", id);
  return NextResponse.json({ ok: !error, error: error?.message });
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  await db.from("contacts").delete().eq("id", id);
  return NextResponse.json({ ok: true });
}
