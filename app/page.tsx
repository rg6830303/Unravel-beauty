"use client";
import { useEffect, useState } from "react";

export default function Dashboard() {
  const [s, setS] = useState<any>(null);
  useEffect(() => { fetch("/api/stats").then((r) => r.json()).then(setS); }, []);
  if (!s) return <p>Loading…</p>;
  const pct = (a: number, b: number) => (b ? ((a / b) * 100).toFixed(1) + "%" : "–");
  const attempted = s.sent + s.failed;
  const tiles = [
    ["Contacts", s.contacts], ["WhatsApp verified", s.valid], ["Flagged (no WhatsApp)", s.invalid],
    ["Unverified", s.unknown], ["Opted out", s.optedOut],
  ];
  const week = [
    ["Sent", s.sent], ["Delivered", `${s.delivered} (${pct(s.delivered, attempted)})`],
    ["Read", `${s.read} (${pct(s.read, s.delivered)})`], ["Failed", s.failed],
    ["Inbound messages", s.inbound], ["AI replies", s.aiReplies],
  ];
  return (
    <>
      <h1>Dashboard</h1>
      <h3>Audience</h3>
      <div className="grid">{tiles.map(([k, v]) => <div key={k} className="card stat"><b>{v}</b><span>{k}</span></div>)}</div>
      <h3>Last 7 days</h3>
      <div className="grid">{week.map(([k, v]) => <div key={k} className="card stat"><b>{v}</b><span>{k}</span></div>)}</div>
      <div className="card">
        <h3>Failure reasons (7d)</h3>
        <table><thead><tr><th>Code</th><th>Reason</th><th>Count</th></tr></thead><tbody>
          {Object.entries(s.errors).map(([code, e]: any) => <tr key={code}><td>{code}</td><td>{e.title}</td><td>{e.n}</td></tr>)}
        </tbody></table>
        <p className="muted">131026 = number has no WhatsApp (auto-flagged). 131049 = Meta per-user marketing cap (auto-retried after 26h). 131050 = user stopped marketing.</p>
      </div>
    </>
  );
}
