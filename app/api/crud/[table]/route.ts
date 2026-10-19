import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// Generic CRUD for small config tables (automations, knowledge)
const ALLOWED = ["automations", "knowledge"];

function guard(table: string) {
  return ALLOWED.includes(table) ? null : NextResponse.json({ error: "not allowed" }, { status: 403 });
}

export async function GET(_: NextRequest, { params }: { params: { table: string } }) {
  const g = guard(params.table); if (g) return g;
  const { data } = await db.from(params.table).select("*");
  return NextResponse.json({ data });
}

export async function POST(req: NextRequest, { params }: { params: { table: string } }) {
  const g = guard(params.table); if (g) return g;
  const { data, error } = await db.from(params.table).upsert(await req.json()).select();
  return NextResponse.json({ data, error: error?.message });
}

export async function DELETE(req: NextRequest, { params }: { params: { table: string } }) {
  const g = guard(params.table); if (g) return g;
  await db.from(params.table).delete().eq("id", req.nextUrl.searchParams.get("id"));
  return NextResponse.json({ ok: true });
}
