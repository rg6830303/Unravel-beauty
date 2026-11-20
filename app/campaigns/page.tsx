"use client";
import { useEffect, useState } from "react";
import { useApi } from "@/lib/client";

export default function Campaigns() {
  const { data: campData, reload: load } = useApi("/api/campaigns", 10000);
  const list: any[] = campData?.data || [];
  const { data: tplData } = useApi("/api/templates");
  const tpls: any[] = (tplData?.data || []).filter((t: any) => t.category === "MARKETING" && t.status === "APPROVED");
  const [f, setF] = useState<any>({ name: "", tpl: "", variables: "", header_media_url: "", tags: "", scheduled_at: "", rate_per_minute: 600, smart: true });
  const [msg, setMsg] = useState("");
  const [preview, setPreview] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);

  useEffect(() => {
    // contacts hand-picked on the Contacts page
    try { setPicked(JSON.parse(sessionStorage.getItem("picked_contacts") || "[]")); } catch {}
  }, []);

  const sel = tpls.find((t) => `${t.name}|${t.language}` === f.tpl);
  const bodyText = sel?.components?.find((c: any) => c.type === "BODY")?.text;

  const payload = (dry_run: boolean) => {
    const [template_name, template_language] = f.tpl.split("|");
    return JSON.stringify({
      name: f.name, template_name, template_language, dry_run,
      variables: f.variables ? f.variables.split("|").map((s: string) => s.trim()) : [],
      header_media_url: f.header_media_url || null,
      audience_tags: f.tags ? f.tags.split(",").map((s: string) => s.trim()) : [],
      contact_ids: picked,
      scheduled_at: f.scheduled_at ? new Date(f.scheduled_at).toISOString() : null,
      rate_per_minute: Number(f.rate_per_minute), smart_send_time: f.smart,
    });
  };
  async function run(dry: boolean) {
    setBusy(true); setMsg("");
    const j = await (await fetch("/api/campaigns", { method: "POST", body: payload(dry) })).json();
    setBusy(false);
    if (j.error) return setMsg(j.error);
    if (dry) return setPreview(j);
    setPreview(null);
    setMsg(`Queued ${j.queued} (${j.deferred} of them wait for the frequency cap). Not sent: ${j.invalid} no WhatsApp, ${j.opted_out} opted out, ${j.sunset} unengaged.`);
    clearPicked();
    load();
  }
  const clearPicked = () => { sessionStorage.removeItem("picked_contacts"); setPicked([]); };
  async function retryFailed(id: string) {
    const j = await (await fetch("/api/campaigns", { method: "PATCH", body: JSON.stringify({ id, action: "retry_failed" }) })).json();
    setMsg(j.error || `Re-queued ${j.requeued} failed message(s).`);
    load();
  }
  const setStatus = (id: string, status: string) =>
    fetch("/api/campaigns", { method: "PATCH", body: JSON.stringify({ id, status }) }).then(load);

  return (
    <>
      <h1>Campaigns</h1>
      <div className="card">
        <h3>New broadcast (MARKETING templates only)</h3>
        <div className="row"><input placeholder="Campaign name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
          <select value={f.tpl} onChange={(e) => setF({ ...f, tpl: e.target.value })}>
            <option value="">Select approved marketing template</option>
            {tpls.map((t) => <option key={t.id} value={`${t.name}|${t.language}`}>{t.name} ({t.language}){t.quality_score ? ` · ${t.quality_score}` : ""}</option>)}
          </select></div>
        {bodyText && <p className="muted">Template: {bodyText}</p>}
        <div className="row">
          <input style={{ flex: 1 }} placeholder="Variables in order, separated by |   e.g. {{first_name|there}} | {{city|your city}} | {{link:https://shop.com/offer}}" value={f.variables} onChange={(e) => setF({ ...f, variables: e.target.value })} />
          <input style={{ flex: 1 }} placeholder="Header media URL (if template has image/video/doc header)" value={f.header_media_url} onChange={(e) => setF({ ...f, header_media_url: e.target.value })} />
        </div>
        <div className="row">
          {picked.length
            ? <span className="pill">{picked.length} selected contacts <a href="#" onClick={(e) => { e.preventDefault(); clearPicked(); }}>clear</a></span>
            : <input placeholder="Audience tags (comma) — blank = all" value={f.tags} onChange={(e) => setF({ ...f, tags: e.target.value })} />}
          <input type="datetime-local" value={f.scheduled_at} onChange={(e) => setF({ ...f, scheduled_at: e.target.value })} />
          <label>Msgs/min <input type="number" style={{ width: 80 }} value={f.rate_per_minute} onChange={(e) => setF({ ...f, rate_per_minute: e.target.value })} /></label>
          <label><input type="checkbox" checked={f.smart} onChange={(e) => setF({ ...f, smart: e.target.checked })} /> Smart send time</label>
        </div>
        <p className="muted">Smart send time delivers to each person at the hour they usually read (up to 24h spread); everyone else goes out as soon as quiet hours allow.</p>
        <div className="row">
          <button className="ghost" disabled={busy || !f.tpl} onClick={() => run(true)}>Preview audience</button>
          <button disabled={busy || !f.name || !f.tpl} onClick={() => run(false)}>{f.scheduled_at ? "Schedule" : "Send"}</button>
        </div>
        {preview && <div className="card"><b>{preview.queued} will receive this.</b>
          <div className="muted">{preview.deferred} of them were messaged recently and are sent once the frequency cap has passed. Excluded: {preview.invalid} no WhatsApp · {preview.opted_out} opted out · {preview.sunset} unengaged</div>
          {preview.samples.map((s: string[], i: number) => <div key={i} className="muted">Sample {i + 1}: {s.join(" | ")}</div>)}</div>}
        {msg && <p>{msg}</p>}
      </div>
      <p className="muted">Delivery % = delivered ÷ everyone the campaign tried to reach. "Waiting" includes messages held for send time, frequency cap or a scheduled retry; the campaign stays running until none are left.</p>
      <div className="card">
        <table><thead><tr><th>Name</th><th>Status</th><th>Total</th><th>Waiting</th><th>Sent</th><th>Delivered</th><th>Read</th><th>Clicks</th><th>Failed</th><th>Skipped</th><th>Delivery %</th><th></th></tr></thead>
          <tbody>{list.map((c) => (
            <tr key={c.id}><td>{c.name}</td>
              <td>{c.status}{c.pause_reason && <div className="muted">{c.pause_reason}</div>}</td>
              <td>{c.total}</td><td>{c.pending}{c.retrying > 0 && <div className="muted">{c.retrying} retrying</div>}</td><td>{c.sent}</td><td>{c.delivered}</td><td>{c.read}</td><td>{c.clicks}</td><td>{c.failed}</td><td>{c.skipped}</td>
              <td>{c.total - c.skipped ? ((c.delivered / (c.total - c.skipped)) * 100).toFixed(1) + "%" : "–"}</td>
              <td>{c.status === "running" && <button className="ghost" onClick={() => setStatus(c.id, "paused")}>Pause</button>}
                {c.status === "paused" && <button className="ghost" onClick={() => setStatus(c.id, "running")}>Resume</button>}
                {c.failed > 0 && <button className="ghost" onClick={() => retryFailed(c.id)}>Retry failed</button>}</td></tr>))}
          </tbody></table>
      </div>
    </>
  );
}
