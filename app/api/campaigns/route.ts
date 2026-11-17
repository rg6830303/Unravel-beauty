import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSettings, nextAllowedSend } from "@/lib/settings";
import { newToken, renderVariable } from "@/lib/personalize";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

export async function GET() {
  const { data } = await db.from("campaign_stats").select("*").order("created_at", { ascending: false });
  return NextResponse.json({ data });
}

// Create campaign + queue one personalised message per eligible contact.
// body: { name, template_name, template_language, variables[], header_media_url, audience_tags[],
//         contact_ids[], scheduled_at, rate_per_minute, smart_send_time, dry_run }
// Audience: contact_ids (hand-picked on the Contacts page) or audience_tags; neither = every contact.
// Variables: "{{first_name|there}}", "{{city|your city}}", "{{any_csv_column}}", "{{link:https://site/offer}}" (click-tracked)
export async function POST(req: NextRequest) {
  const b = await req.json();
  const lang = b.template_language || "en";

  const { data: tpl } = await db.from("templates").select("*").eq("name", b.template_name).eq("language", lang).single();
  if (!tpl || tpl.status !== "APPROVED")
    return NextResponse.json({ error: "Template not found or not APPROVED. Sync templates first." }, { status: 400 });
  if (tpl.category !== "MARKETING")
    return NextResponse.json({ error: `Template category is ${tpl.category}; campaigns accept MARKETING only.` }, { status: 400 });

  // Catch the commonest cause of failed sends before anything is queued: wrong parameter count / missing header media.
  const body = tpl.components?.find((c: any) => c.type === "BODY")?.text ?? "";
  const need = Math.max(0, ...[...body.matchAll(/\{\{(\d+)\}\}/g)].map((m) => Number(m[1])));
  const vars: string[] = b.variables || [];
  if (vars.length !== need)
    return NextResponse.json({ error: `Template body needs ${need} variable(s), you gave ${vars.length}.` }, { status: 400 });
  const hdr = tpl.components?.find((c: any) => c.type === "HEADER");
  if (hdr && ["IMAGE", "VIDEO", "DOCUMENT"].includes(hdr.format) && !b.header_media_url)
    return NextResponse.json({ error: `Template has a ${hdr.format} header — provide a media URL.` }, { status: 400 });

  const s = await getSettings();
  const base = b.scheduled_at ? new Date(b.scheduled_at) : new Date();
  const smart = b.smart_send_time !== false;
  const origin = req.nextUrl.origin;
  const tags: string[] = b.audience_tags || [];
  const ids: string[] | null = Array.isArray(b.contact_ids) && b.contact_ids.length ? b.contact_ids : null;
  // the retry loop keeps re-sending failures until this moment
  const expires = new Date(base.getTime() + s.retry_window_days * 864e5).toISOString();

  let camp: any = null;
  if (!b.dry_run) {
    const ins = await db.from("campaigns").insert({
      name: b.name, template_name: b.template_name, template_language: lang,
      variables: vars, header_media_url: b.header_media_url || null, audience_tags: tags,
      rate_per_minute: b.rate_per_minute || 600, smart_send_time: smart,
      scheduled_at: b.scheduled_at || null, status: b.scheduled_at ? "scheduled" : "running",
    }).select().single();
    if (ins.error) return NextResponse.json({ error: ins.error.message }, { status: 500 });
    camp = ins.data;
  }

  const stats = { queued: 0, deferred: 0, invalid: 0, opted_out: 0, sunset: 0 };
  const samples: string[][] = [];
  const capMs = s.frequency_cap_days * 864e5;
  let from = 0;
  while (true) {
    let q = db.from("contacts").select("*").order("created_at");
    if (ids) {
      if (from >= ids.length) break;
      q = q.in("id", ids.slice(from, from + 200));
    } else {
      q = q.range(from, from + 999);
      if (tags.length) q = q.overlaps("tags", tags);
    }
    const { data: cs } = await q;
    if (ids) from += 200;
    else if (!cs?.length) break;
    else from += cs.length;
    if (!cs?.length) continue;

    const msgs: any[] = [], links: any[] = [];
    for (const c of cs) {
      if (c.wa_status === "invalid") { stats.invalid++; continue; }
      if (!c.opted_in) { stats.opted_out++; continue; }
      if (c.unread_streak >= s.sunset_after) { stats.sunset++; continue; }
      // messaged too recently: still gets the campaign, just after the frequency cap has passed
      let start = base;
      if (c.last_marketing_at) {
        const free = new Date(c.last_marketing_at).getTime() + capMs - 3600e3;
        if (free > base.getTime()) { start = new Date(free); stats.deferred++; }
      }

      const id = crypto.randomUUID();
      const rendered = vars.map((v) =>
        renderVariable(v, c, (url) => {
          const token = newToken();
          links.push({ token, url, message_id: id, contact_id: c.id, campaign_id: camp?.id ?? null });
          return `${origin}/r/${token}`;
        }));
      if (samples.length < 3) samples.push(rendered);
      stats.queued++;
      if (b.dry_run) continue;

      msgs.push({
        id, contact_id: c.id, campaign_id: camp.id, direction: "out", type: "template",
        body: `[template] ${camp.template_name}`,
        payload: { template: camp.template_name, language: lang, header: camp.header_media_url, header_format: hdr?.format ?? null, vars: rendered },
        status: "queued", expires_at: expires,
        // smart send time: each person gets it at the hour they usually read, never in quiet hours
        next_attempt_at: (smart ? nextAllowedSend(s, start, c.best_hour) : nextAllowedSend(s, start)).toISOString(),
      });
    }
    if (!b.dry_run && msgs.length) {
      const m = await db.from("messages").insert(msgs);
      if (m.error) return NextResponse.json({ error: m.error.message, campaign: camp, ...stats }, { status: 500 });
      if (links.length) await db.from("links").insert(links);
    }
  }
  return NextResponse.json({ campaign: camp, dry_run: !!b.dry_run, samples, ...stats, excluded_invalid: stats.invalid });
}

// pause / resume / retry_failed
export async function PATCH(req: NextRequest) {
  const { id, status, action } = await req.json();
  if (action === "retry_failed") {
    // Put every failed message of the campaign back into the loop with a fresh retry allowance.
    // Opted-out and flagged contacts stay excluded: the dispatcher's final guards skip them.
    const s = await getSettings();
    const { data, error } = await db.from("messages").update({
      status: "queued", retry_count: 0, wa_message_id: null, next_attempt_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + s.retry_window_days * 864e5).toISOString(),
    }).eq("campaign_id", id).eq("status", "failed").select("id");
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (data?.length) await db.from("campaigns").update({ status: "running", pause_reason: null }).eq("id", id);
    return NextResponse.json({ ok: true, requeued: data?.length ?? 0 });
  }
  if (!["paused", "running"].includes(status)) return NextResponse.json({ error: "bad status" }, { status: 400 });
  await db.from("campaigns").update({ status, pause_reason: status === "paused" ? "Paused manually" : null }).eq("id", id);
  return NextResponse.json({ ok: true });
}
