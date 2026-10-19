"use client";
import { useEffect, useState } from "react";

export default function Inbox() {
  const [convos, setConvos] = useState<any[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [thread, setThread] = useState<any>({ data: [] });
  const [text, setText] = useState("");
  const [err, setErr] = useState("");

  const loadConvos = () => fetch("/api/inbox").then((r) => r.json()).then((j) => setConvos(j.data || []));
  const loadThread = (id: string) => fetch("/api/inbox?contact=" + id).then((r) => r.json()).then(setThread);

  useEffect(() => { loadConvos(); const t = setInterval(loadConvos, 8000); return () => clearInterval(t); }, []);
  useEffect(() => {
    if (!active) return;
    loadThread(active);
    const t = setInterval(() => loadThread(active), 4000);
    return () => clearInterval(t);
  }, [active]);

  async function send() {
    const r = await (await fetch("/api/inbox", { method: "POST", body: JSON.stringify({ contact_id: active, text }) })).json();
    setErr(r.error || (r.ok === false ? r.title : "")); if (!r.error) setText("");
    loadThread(active!);
  }
  async function toggleAi() {
    await fetch("/api/contacts", { method: "PATCH", body: JSON.stringify({ id: active, ai_enabled: !thread.contact.ai_enabled }) });
    loadThread(active!);
  }

  return (
    <>
      <h1>Inbox</h1>
      <div style={{ display: "flex", gap: 16 }}>
        <div className="card" style={{ width: 260 }}>
          {convos.map((c) => (
            <div key={c.id} onClick={() => setActive(c.id)} style={{ padding: 8, cursor: "pointer", background: active === c.id ? "var(--line)" : "" }}>
              <b>{c.name || "+" + c.phone}</b><div className="muted">{new Date(c.last_inbound_at).toLocaleString()}</div>
            </div>))}
        </div>
        {active && thread.contact && (
          <div className="card" style={{ flex: 1 }}>
            <div className="row"><b>{thread.contact.name} +{thread.contact.phone}</b>
              <button className="ghost" onClick={toggleAi}>AI auto-reply: {thread.contact.ai_enabled ? "ON" : "OFF"}</button></div>
            <div className="thread">{thread.data.map((m: any) => (
              <div key={m.id} className={"bubble " + m.direction}>{m.body}
                <div className="muted">{m.is_ai ? "AI · " : ""}{m.status}{m.error_title ? " · " + m.error_title : ""}</div></div>))}
            </div>
            <div className="row" style={{ marginTop: 12 }}>
              <input style={{ flex: 1 }} value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder="Reply (24h window)" />
              <button onClick={send}>Send</button></div>
            {err && <p style={{ color: "var(--bad)" }}>{err}</p>}
          </div>)}
      </div>
    </>
  );
}
