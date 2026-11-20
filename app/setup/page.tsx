"use client";
import { useState } from "react";
import { api, useApi } from "@/lib/client";

export default function Setup() {
  const { data: h, error, reload: load } = useApi("/api/health");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function act(url: string, done: (j: any) => string) {
    setBusy(true); setMsg("");
    const j = await api(url, { method: "POST" });
    setBusy(false);
    setMsg(j.error || done(j));
    load();
  }
  if (!h) return <p>{error ? `Health check failed: ${error}` : "Checking… (a few seconds)"}</p>;
  return (
    <>
      <h1>Setup &amp; health</h1>
      <div className="card">
        <table><tbody>{h.checks.map((c: any) => (
          <tr key={c.name}><td><span className={"pill " + (c.ok ? "valid" : "invalid")}>{c.ok ? "OK" : "Action needed"}</span></td>
            <td><b>{c.name}</b></td><td className="muted">{c.detail}</td></tr>))}
        </tbody></table>
      </div>
      <div className="row">
        <button disabled={busy} onClick={() => act("/api/health", () => "Meta webhooks connected.")}>Connect Meta webhooks</button>
        <button className="ghost" disabled={busy} onClick={() => act("/api/dispatch", (j) => `Loop ran: ${JSON.stringify(j)}`)}>Run outreach loop now</button>
        <button className="ghost" disabled={busy} onClick={load}>Re-check</button>
      </div>
      {msg && <p>{msg}</p>}
      <p className="muted">Connect Meta webhooks points your Meta app at this site's /api/webhook and subscribes it to delivery, quality, template and account events. The outreach loop runs every minute on its own; the button is only for an immediate pass.</p>
    </>
  );
}
