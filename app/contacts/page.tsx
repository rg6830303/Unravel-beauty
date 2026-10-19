"use client";
import { useEffect, useState } from "react";

export default function Contacts() {
  const [rows, setRows] = useState<any[]>([]);
  const [count, setCount] = useState(0);
  const [filter, setFilter] = useState("");
  const [q, setQ] = useState("");
  const [result, setResult] = useState<any>(null);
  const [country, setCountry] = useState("IN");
  const [tag, setTag] = useState("");

  const load = () => {
    const p = new URLSearchParams();
    if (filter) p.set("wa_status", filter);
    if (q) p.set("q", q);
    fetch("/api/contacts?" + p).then((r) => r.json()).then((j) => { setRows(j.data || []); setCount(j.count || 0); });
  };
  useEffect(load, [filter]);

  async function upload(f: File) {
    const fd = new FormData();
    fd.append("file", f); fd.append("country", country); fd.append("tag", tag);
    setResult(await (await fetch("/api/contacts", { method: "POST", body: fd })).json());
    load();
  }
  async function patch(id: string, body: any) {
    await fetch("/api/contacts", { method: "PATCH", body: JSON.stringify({ id, ...body }) }); load();
  }

  return (
    <>
      <h1>Contacts ({count})</h1>
      <div className="card">
        <h3>Upload CSV</h3>
        <p className="muted">Columns: <code>phone</code> (required), <code>name</code>, <code>tags</code>; extra columns become variables usable as {"{{column}}"}.</p>
        <div className="row">
          <input value={country} onChange={(e) => setCountry(e.target.value.toUpperCase())} style={{ width: 70 }} title="Default country code" />
          <input placeholder="Tag all rows (optional)" value={tag} onChange={(e) => setTag(e.target.value)} />
          <input type="file" accept=".csv" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
        </div>
        {result && <p>Imported {result.imported}. Rejected {result.rejected?.length ?? 0}{result.error ? ` — ${result.error}` : ""}.</p>}
        {result?.rejected?.length > 0 && <details><summary>Rejected rows</summary>
          {result.rejected.map((r: any) => <div key={r.row} className="muted">Row {r.row}: {r.phone} — {r.reason}</div>)}</details>}
      </div>
      <div className="row">
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="">All</option><option value="valid">On WhatsApp</option>
          <option value="invalid">Flagged: no WhatsApp</option><option value="unknown">Unverified</option>
        </select>
        <input placeholder="Search name / phone" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && load()} />
      </div>
      <div className="card">
        <table><thead><tr><th>Phone</th><th>Name</th><th>Tags</th><th>WhatsApp</th><th>Opt-in</th><th>AI</th><th></th></tr></thead>
          <tbody>{rows.map((c) => (
            <tr key={c.id}>
              <td>+{c.phone}</td><td>{c.name}</td><td>{c.tags?.join(", ")}</td>
              <td><span className={"pill " + c.wa_status}>{c.wa_status === "invalid" ? "⚠ no WhatsApp" : c.wa_status}</span></td>
              <td><input type="checkbox" checked={c.opted_in} onChange={(e) => patch(c.id, { opted_in: e.target.checked })} /></td>
              <td><input type="checkbox" checked={c.ai_enabled} onChange={(e) => patch(c.id, { ai_enabled: e.target.checked })} /></td>
              <td><button className="ghost" onClick={() => fetch("/api/contacts?id=" + c.id, { method: "DELETE" }).then(load)}>Delete</button></td>
            </tr>))}
          </tbody></table>
      </div>
    </>
  );
}
