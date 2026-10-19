import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const { data } = await db.from("campaign_stats").select("*").order("created_at", { ascending: false });
  return NextResponse.json({ data });
}

// Create campaign + queue one message per eligible contact.
// body: { name, template_name, template_language, variables[], header_media_url, audience_tags[], scheduled_at, rate_per_minute }
export async function POST(req: NextRequest) {
  const b = await req.json();

  const { data: tpl } = await db.from("templates").select("*")
    .eq("name", b.template_name).eq("language", b.template_language || "en").single();
  if (!tpl || tpl.status !== "APPROVED")
    return NextResponse.json({ error: "Template not found or not APPROVED. Sync templates first." }, { status: 400 });
  if (tpl.category !== "MARKETING")
    return NextResponse.json({ error: `Template category is ${tpl.category}; campaigns accept MARKETING only.` }, { status: 400 });

  const { data: camp, error } = await db.from("campaigns").insert({
    name: b.name, template_name: b.template_name, template_language: b.template_language || "en",
    variables: b.variables || [], header_media_url: b.header_media_url || null,
    audience_tags: b.audience_tags || [], rate_per_minute: b.rate_per_minute || 60,
    scheduled_at: b.scheduled_at || null, status: b.scheduled_at ? "scheduled" : "running",
  }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // eligible audience: opted in, not flagged invalid
  let skip = 0, queued = 0, excluded = 0;
  while (true) {
    let q = db.from("contacts").select("*").eq("opted_in", true).range(skip, skip + 999);
    if (camp.audience_tags.length) q = q.overlaps("tags", camp.audience_tags);
    const { data: cs } = await q;
    if (!cs?.length) break;
    skip += cs.length;
    const rows = cs.filter((c) => {
      if (c.wa_status === "invalid") { excluded++; return false; }
      return true;
    }).map((c) => ({
      contact_id: c.id, campaign_id: camp.id, direction: "out", type: "template",
      body: `[template] ${camp.template_name}`,
      payload: {
        template: camp.template_name, language: camp.template_language, header: camp.header_media_url,
        vars: (camp.variables as string[]).map((v) =>
          v.replace(/\{\{(\w+)\}\}/g, (_, k) => (k === "name" ? c.name || "there" : c.attributes?.[k] ?? c[k] ?? ""))),
      },
      status: "queued",
      next_attempt_at: camp.scheduled_at || new Date().toISOString(),
    }));
    if (rows.length) await db.from("messages").insert(rows);
    queued += rows.length;
  }
  return NextResponse.json({ campaign: camp, queued, excluded_invalid: excluded });
}

// pause / resume
export async function PATCH(req: NextRequest) {
  const { id, status } = await req.json();
  if (!["paused", "running"].includes(status)) return NextResponse.json({ error: "bad status" }, { status: 400 });
  await db.from("campaigns").update({ status }).eq("id", id);
  return NextResponse.json({ ok: true });
}
