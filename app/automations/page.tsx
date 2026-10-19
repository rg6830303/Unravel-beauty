"use client";
import { useEffect, useState } from "react";

export default function Automations() {
  const [rules, setRules] = useState<any[]>([]);
  const [kb, setKb] = useState<any[]>([]);
  const [r, setR] = useState({ keyword: "", match_type: "contains", reply: "" });
  const [k, setK] = useState({ title: "", content: "" });

  const load = () => {
    fetch("/api/crud/automations").then((x) => x.json()).then((j) => setRules(j.data || []));
    fetch("/api/crud/knowledge").then((x) => x.json()).then((j) => setKb(j.data || []));
  };
  useEffect(load, []);
  const save = (t: string, body: any) => fetch("/api/crud/" + t, { method: "POST", body: JSON.stringify(body) }).then(load);
  const del = (t: string, id: string) => fetch(`/api/crud/${t}?id=${id}`, { method: "DELETE" }).then(load);

  return (
    <>
      <h1>AI & Automations</h1>
      <p className="muted">Inbound flow: STOP/START handling → keyword rules → AI agent (uses knowledge base below). Toggle AI per contact in Inbox.</p>
      <div className="card">
        <h3>Keyword auto-replies</h3>
        <div className="row">
          <input placeholder="Keyword" value={r.keyword} onChange={(e) => setR({ ...r, keyword: e.target.value })} />
          <select value={r.match_type} onChange={(e) => setR({ ...r, match_type: e.target.value })}><option>contains</option><option>exact</option></select>
          <input style={{ flex: 1 }} placeholder="Reply" value={r.reply} onChange={(e) => setR({ ...r, reply: e.target.value })} />
          <button onClick={() => { save("automations", r); setR({ keyword: "", match_type: "contains", reply: "" }); }}>Add</button>
        </div>
        <table><tbody>{rules.map((x) => (
          <tr key={x.id}><td>{x.keyword}</td><td>{x.match_type}</td><td>{x.reply}</td>
            <td><input type="checkbox" checked={x.active} onChange={(e) => save("automations", { ...x, active: e.target.checked })} /></td>
            <td><button className="ghost" onClick={() => del("automations", x.id)}>Delete</button></td></tr>))}</tbody></table>
      </div>
      <div className="card">
        <h3>AI knowledge base</h3>
        <div className="row"><input placeholder="Title (e.g. Pricing)" value={k.title} onChange={(e) => setK({ ...k, title: e.target.value })} /></div>
        <textarea rows={5} style={{ width: "100%" }} placeholder="FAQ, prices, policies, hours…" value={k.content} onChange={(e) => setK({ ...k, content: e.target.value })} />
        <div className="row"><button onClick={() => { save("knowledge", k); setK({ title: "", content: "" }); }}>Add</button></div>
        {kb.map((x) => (
          <details key={x.id}><summary>{x.title} <button className="ghost" onClick={() => del("knowledge", x.id)}>Delete</button></summary>
            <pre style={{ whiteSpace: "pre-wrap" }}>{x.content}</pre></details>))}
      </div>
    </>
  );
}
