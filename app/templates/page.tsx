"use client";
import { useEffect, useState } from "react";

export default function Templates() {
  const [list, setList] = useState<any[]>([]);
  const [msg, setMsg] = useState("");
  const load = () => fetch("/api/templates").then((r) => r.json()).then((j) => setList(j.data || []));
  useEffect(() => { load(); }, []);
  async function sync() {
    const j = await (await fetch("/api/templates", { method: "POST" })).json();
    setMsg(j.error || `Synced ${j.synced} templates`); load();
  }
  return (
    <>
      <h1>Templates</h1>
      <div className="row"><button onClick={sync}>Sync from Meta</button><span>{msg}</span></div>
      <p className="muted">Create/edit templates in WhatsApp Manager, then sync. Only APPROVED + MARKETING templates can be used in campaigns.</p>
      <div className="card"><table><thead><tr><th>Name</th><th>Lang</th><th>Category</th><th>Status</th><th>Body</th></tr></thead>
        <tbody>{list.map((t) => (
          <tr key={t.id}><td>{t.name}</td><td>{t.language}</td><td>{t.category}</td><td>{t.status}</td>
            <td className="muted">{t.components?.find((c: any) => c.type === "BODY")?.text}</td></tr>))}
        </tbody></table></div>
    </>
  );
}
