"use client";
import { useEffect, useState } from "react";

export default function Campaigns() {
  const [list, setList] = useState<any[]>([]);
  const [tpls, setTpls] = useState<any[]>([]);
  const [f, setF] = useState<any>({ name: "", tpl: "", variables: "", header_media_url: "", tags: "", scheduled_at: "", rate_per_minute: 60 });
  const [msg, setMsg] = useState("");

  const load = () => fetch("/api/campaigns").then((r) => r.json()).then((j) => setList(j.data || []));
  useEffect(() => {
    load();
    fetch("/api/templates").then((r) => r.json()).then((j) =>
      setTpls((j.data || []).filter((t: any) => t.category === "MARKETING" && t.status === "APPROVED")));
    const t = setInterval(load, 10000);
    return () => clearInterval(t);
  }, []);

  const sel = tpls.find((t) => `${t.name}|${t.language}` === f.tpl);
  const bodyText = sel?.components?.find((c: any) => c.type === "BODY")?.text;

  async function create() {
    const [template_name, template_language] = f.tpl.split("|");
    const r = await fetch("/api/campaigns", {
      method: "POST",
      body: JSON.stringify({
        name: f.name, template_name, template_language,
        variables: f.variables ? f.variables.split("|").map((s: string) => s.trim()) : [],
        header_media_url: f.header_media_url || null,
        audience_tags: f.tags ? f.tags.split(",").map((s: string) => s.trim()) : [],
        scheduled_at: f.scheduled_at ? new Date(f.scheduled_at).toISOString() : null,
        rate_per_minute: Number(f.rate_per_minute),
      }),
    });
    const j = await r.json();
    setMsg(j.error || `Queued ${j.queued} messages. Skipped ${j.excluded_invalid} flagged (no WhatsApp) contacts.`);
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
            {tpls.map((t) => <option key={t.id} value={`${t.name}|${t.language}`}>{t.name} ({t.language})</option>)}
          </select></div>
        {bodyText && <p className="muted">Template: {bodyText}</p>}
        <div className="row">
          <input style={{ flex: 1 }} placeholder="Body variables, separated by | e.g. {{name}} | SALE20" value={f.variables} onChange={(e) => setF({ ...f, variables: e.target.value })} />
          <input style={{ flex: 1 }} placeholder="Header media URL (if template has image/video/doc header)" value={f.header_media_url} onChange={(e) => setF({ ...f, header_media_url: e.target.value })} />
        </div>
        <div className="row">
          <input placeholder="Audience tags (comma) — blank = all" value={f.tags} onChange={(e) => setF({ ...f, tags: e.target.value })} />
          <input type="datetime-local" value={f.scheduled_at} onChange={(e) => setF({ ...f, scheduled_at: e.target.value })} />
          <label>Msgs/min <input type="number" style={{ width: 80 }} value={f.rate_per_minute} onChange={(e) => setF({ ...f, rate_per_minute: e.target.value })} /></label>
          <button disabled={!f.name || !f.tpl} onClick={create}>{f.scheduled_at ? "Schedule" : "Send now"}</button>
        </div>
        {msg && <p>{msg}</p>}
      </div>
      <div className="card">
        <table><thead><tr><th>Name</th><th>Status</th><th>Total</th><th>Sent</th><th>Delivered</th><th>Read</th><th>Failed</th><th>Skipped</th><th>Delivery %</th><th></th></tr></thead>
          <tbody>{list.map((c) => (
            <tr key={c.id}><td>{c.name}</td><td>{c.status}</td><td>{c.total}</td><td>{c.sent}</td><td>{c.delivered}</td><td>{c.read}</td><td>{c.failed}</td><td>{c.skipped}</td>
              <td>{c.sent + c.failed ? ((c.delivered / (c.sent + c.failed)) * 100).toFixed(1) + "%" : "–"}</td>
              <td>{c.status === "running" && <button className="ghost" onClick={() => setStatus(c.id, "paused")}>Pause</button>}
                {c.status === "paused" && <button className="ghost" onClick={() => setStatus(c.id, "running")}>Resume</button>}</td></tr>))}
          </tbody></table>
      </div>
    </>
  );
}
