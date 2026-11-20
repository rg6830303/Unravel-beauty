"use client";
import { useEffect, useRef, useState } from "react";
import { api, useApi } from "@/lib/client";

export default function Inbox() {
  const [active, setActive] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [err, setErr] = useState("");
  const [sending, setSending] = useState(false);
  const { data: list } = useApi("/api/inbox", 10000);
  const { data: thread, reload } = useApi(active ? "/api/inbox?contact=" + active : null, 4000);
  const convos: any[] = list?.data || [];
  const msgs: any[] = thread?.data || [];
  const box = useRef<HTMLDivElement>(null);

  // follow the conversation: jump to the newest message when one arrives or a chat is opened
  useEffect(() => { if (box.current) box.current.scrollTop = box.current.scrollHeight; }, [msgs.length, active]);

  async function send() {
    if (!text.trim() || sending) return;
    setSending(true);
    const r = await api("/api/inbox", { method: "POST", body: JSON.stringify({ contact_id: active, text }) });
    setSending(false);
    setErr(r.error || (r.ok === false ? r.title : ""));
    if (!r.error) setText("");
    reload();
  }
  async function toggleAi() {
    await api("/api/contacts", { method: "PATCH", body: JSON.stringify({ id: active, ai_enabled: !thread.contact.ai_enabled }) });
    reload();
  }

  return (
    <>
      <h1>Inbox</h1>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        <div className="card" style={{ width: 260 }}>
          {!convos.length && <span className="muted">No conversations yet. Replies from customers appear here.</span>}
          {convos.map((c) => (
            <div key={c.id} onClick={() => { setActive(c.id); setErr(""); }} style={{ padding: 8, cursor: "pointer", background: active === c.id ? "var(--line)" : "" }}>
              <b>{c.name || "+" + c.phone}</b><div className="muted">{new Date(c.last_inbound_at).toLocaleString()}</div>
            </div>))}
        </div>
        {active && thread?.contact && (
          <div className="card" style={{ flex: 1, minWidth: 280 }}>
            <div className="row"><b>{thread.contact.name} +{thread.contact.phone}</b>
              <button className="ghost" onClick={toggleAi}>AI auto-reply: {thread.contact.ai_enabled ? "ON" : "OFF"}</button></div>
            <div className="thread" ref={box}>{msgs.map((m: any) => (
              <div key={m.id} className={"bubble " + m.direction}>{m.body}
                <div className="muted">{m.is_ai ? "AI · " : ""}{m.status}{m.error_title ? " · " + m.error_title : ""}</div></div>))}
            </div>
            <div className="row" style={{ marginTop: 12 }}>
              <input style={{ flex: 1 }} value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder="Reply (24h window)" />
              <button disabled={sending || !text.trim()} onClick={send}>Send</button></div>
            {err && <p style={{ color: "var(--bad)" }}>{err}</p>}
          </div>)}
      </div>
    </>
  );
}
