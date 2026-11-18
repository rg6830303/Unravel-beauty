"use client";
import { useEffect, useState } from "react";

const blank = { name: "", language: "en_US", category: "MARKETING", header: "", body: "", examples: "", footer: "", stop: true };

export default function Templates() {
  const [list, setList] = useState<any[]>([]);
  const [msg, setMsg] = useState("");
  const [f, setF] = useState(blank);
  const set = (k: keyof typeof blank) => (e: any) => setF({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value });
  const load = () => fetch("/api/templates").then((r) => r.json()).then((j) => setList(j.data || []));
  useEffect(() => { load(); }, []);
  async function sync() {
    const j = await (await fetch("/api/templates", { method: "POST" })).json();
    setMsg(j.error || `Synced ${j.synced} templates`); load();
  }
  async function call(action: string, body: object) {
    const j = await (await fetch(`/api/meta/${action}`, { method: "POST", body: JSON.stringify(body) })).json();
    return j;
  }
  async function create() {
    const components: any[] = [];
    if (f.header) components.push({ type: "HEADER", format: "TEXT", text: f.header });
    const examples = f.examples.split("|").map((s) => s.trim()).filter(Boolean);
    components.push({ type: "BODY", text: f.body, ...(examples.length ? { example: { body_text: [examples] } } : {}) });
    if (f.footer) components.push({ type: "FOOTER", text: f.footer });
    if (f.stop && f.category === "MARKETING") components.push({ type: "BUTTONS", buttons: [{ type: "QUICK_REPLY", text: "Stop promotions" }] });
    const j = await call("create_template", { name: f.name, language: f.language, category: f.category, components });
    if (j.error) return setMsg(j.error);
    setMsg(`Submitted ${f.name}: ${j.data.status} (${j.data.category}). Sync once Meta approves it.`);
    setF(blank); sync();
  }
  async function remove(t: any) {
    if (!confirm(`Delete template ${t.name} (all languages) from Meta? This cannot be undone.`)) return;
    const j = await call("delete_template", { name: t.name });
    setMsg(j.error || `Deleted ${t.name}`); load();
  }
  return (
    <>
      <h1>Templates</h1>
      <div className="row"><button onClick={sync}>Sync from Meta</button><span>{msg}</span></div>
      <div className="card">
        <h3>New template</h3>
        <div className="row">
          <input value={f.name} onChange={set("name")} placeholder="name (lowercase_with_underscores)" />
          <input style={{ width: 90 }} value={f.language} onChange={set("language")} />
          <select value={f.category} onChange={set("category")}><option>MARKETING</option><option>UTILITY</option></select>
        </div>
        <div className="row"><input style={{ flex: 1 }} value={f.header} onChange={set("header")} placeholder="header (optional)" /></div>
        <div className="row"><textarea style={{ flex: 1 }} rows={4} value={f.body} onChange={set("body")} placeholder="Body. Use {{1}}, {{2}} for variables." /></div>
        <div className="row"><input style={{ flex: 1 }} value={f.examples} onChange={set("examples")} placeholder="example values for variables, separated by |" /></div>
        <div className="row">
          <input style={{ flex: 1 }} value={f.footer} onChange={set("footer")} placeholder="footer (optional)" />
          <label><input type="checkbox" checked={f.stop} onChange={set("stop")} /> "Stop promotions" button</label>
          <button disabled={!f.name || !f.body} onClick={create}>Submit to Meta</button>
        </div>
      </div>
      <p className="muted">Only APPROVED + MARKETING templates can be used in campaigns.</p>
      <div className="card"><table><thead><tr><th>Name</th><th>Lang</th><th>Category</th><th>Status</th><th>Body</th><th></th></tr></thead>
        <tbody>{list.map((t) => (
          <tr key={t.id}><td>{t.name}</td><td>{t.language}</td><td>{t.category}</td><td>{t.status}</td>
            <td className="muted">{t.components?.find((c: any) => c.type === "BODY")?.text}</td>
            <td><button className="ghost" onClick={() => remove(t)}>Delete</button></td></tr>))}
        </tbody></table></div>
    </>
  );
}
