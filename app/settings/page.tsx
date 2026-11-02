"use client";
import { useEffect, useState } from "react";

const FIELDS: [string, string, string][] = [
  ["frequency_cap_days", "Min days between marketing messages to one person", "Higher = fewer Meta 'user capped' (131049) failures. 2–3 recommended."],
  ["sunset_after", "Stop marketing after N delivered-but-unread messages", "Protects your quality rating by dropping people who never open."],
  ["quiet_start", "Quiet hours start (0–23)", "No marketing sends from this hour…"],
  ["quiet_end", "Quiet hours end (0–23)", "…until this hour."],
  ["default_send_hour", "Default send hour (0–23)", "Used for people with no read history."],
  ["auto_pause_fail_pct", "Auto-pause campaign if failures exceed %", "Checked over the last 40 sends; ignores 'no WhatsApp' and 'user capped'."],
];

export default function Settings() {
  const [s, setS] = useState<any>(null);
  const [saved, setSaved] = useState("");
  const load = (refresh = false) => fetch("/api/settings" + (refresh ? "?refresh=1" : "")).then((r) => r.json()).then(setS);
  useEffect(() => { load(true); }, []);
  if (!s) return <p>Loading…</p>;
  async function save() {
    const body: any = { timezone: s.timezone, daily_cap_override: s.daily_cap_override === "" ? null : s.daily_cap_override };
    for (const [k] of FIELDS) body[k] = Number(s[k]);
    if (body.daily_cap_override !== null) body.daily_cap_override = Number(body.daily_cap_override);
    setS(await (await fetch("/api/settings", { method: "POST", body: JSON.stringify(body) })).json());
    setSaved("Saved");
  }
  const h = s.phone_health || {};
  const color: any = { GREEN: "#0a6b4f", YELLOW: "#b7791f", RED: "#c0392b" };
  return (
    <>
      <h1>Delivery settings</h1>
      <div className="grid">
        <div className="card stat"><b style={{ color: color[h.quality_rating] }}>{h.quality_rating || "–"}</b><span>Number quality rating</span></div>
        <div className="card stat"><b>{h.messaging_limit_tier?.replace("TIER_", "") || "–"}</b><span>Daily unique-recipient tier</span></div>
      </div>
      <p className="muted">RED quality pauses every campaign automatically. The dispatcher never exceeds 95% of your daily tier.</p>
      <div className="card">
        {FIELDS.map(([k, label, help]) => (
          <div key={k} className="row"><label style={{ width: 340 }}>{label}<div className="muted">{help}</div></label>
            <input type="number" value={s[k]} onChange={(e) => setS({ ...s, [k]: e.target.value })} style={{ width: 90 }} /></div>))}
        <div className="row"><label style={{ width: 340 }}>Timezone<div className="muted">IANA name, e.g. Asia/Kolkata</div></label>
          <input value={s.timezone} onChange={(e) => setS({ ...s, timezone: e.target.value })} /></div>
        <div className="row"><label style={{ width: 340 }}>Manual daily cap (optional)<div className="muted">Override the Meta tier-based cap with a lower number.</div></label>
          <input type="number" value={s.daily_cap_override ?? ""} onChange={(e) => setS({ ...s, daily_cap_override: e.target.value })} style={{ width: 90 }} /></div>
        <button onClick={save}>Save</button> <span>{saved}</span>
      </div>
    </>
  );
}
