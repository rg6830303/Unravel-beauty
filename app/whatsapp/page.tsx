"use client";
import { useEffect, useState } from "react";

const api = async (action: string, body?: object, query = "") => {
  const r = await fetch(`/api/meta/${action}${query}`, body ? { method: "POST", body: JSON.stringify(body) } : {});
  const j = await r.json();
  if (!r.ok) throw new Error(j.error);
  return j.data;
};

// WhatsApp Business account management: the same steps the WhatsApp Business Tools MCP walks through.
export default function WhatsApp() {
  const [token, setToken] = useState<any>(null);
  const [biz, setBiz] = useState<any[]>([]);
  const [bizId, setBizId] = useState("");
  const [accounts, setAccounts] = useState<any[]>([]);
  const [numbers, setNumbers] = useState<any[]>([]);
  const [verif, setVerif] = useState<any>(null);
  const [msg, setMsg] = useState("");
  const [f, setF] = useState({ cc: "91", phone_number: "", verified_name: "", id: "", code: "", pin: "" });
  const set = (k: keyof typeof f) => (e: any) => setF({ ...f, [k]: e.target.value });

  const run = async (fn: () => Promise<any>, ok?: (d: any) => string) => {
    setMsg("");
    try { const d = await fn(); if (ok) setMsg(ok(d)); return d; } catch (e: any) { setMsg(e.message); }
  };
  const loadNumbers = () => run(() => api("phone_numbers")).then((d) => d && setNumbers(d));

  useEffect(() => {
    api("token").then(setToken).catch((e) => setToken({ error: e.message }));
    api("businesses").then((d) => { setBiz(d); if (d[0]) setBizId(d[0].id); }).catch((e) => setMsg(e.message));
    loadNumbers();
  }, []);
  useEffect(() => {
    if (!bizId) return;
    api("accounts", undefined, `?business_id=${bizId}`).then(setAccounts).catch(() => setAccounts([]));
    api("verify_business", undefined, `?business_id=${bizId}`).then(setVerif).catch(() => setVerif(null));
  }, [bizId]);

  const open = (action: string, q: string) => run(() => api(action, undefined, q)).then((d) => d && window.open(d.url, "_blank"));

  return (
    <>
      <h1>WhatsApp Business</h1>
      {msg && <p><b>{msg}</b></p>}

      <div className="card">
        <h3>Access token</h3>
        {!token ? <p>Checking…</p> : token.error ? <p className="muted">{token.error}</p> : (
          <p>
            <span className={"pill " + (token.is_valid && !token.missing_scopes.length ? "valid" : "invalid")}>{token.is_valid ? "Valid" : "Invalid"}</span>{" "}
            {token.type} · expires {token.expires_at ? new Date(token.expires_at * 1000).toLocaleDateString() : "never"}
            {token.missing_scopes.length > 0 && <> · missing scopes: {token.missing_scopes.join(", ")}</>}
          </p>)}
        <div className="row">
          <button className="ghost" disabled={!bizId} onClick={() => open("system_user_token", `?business_id=${bizId}`)}>Generate system user token</button>
          <button className="ghost" onClick={() => open("configure_payments", "")}>Payment settings</button>
        </div>
      </div>

      <div className="card">
        <h3>Business</h3>
        <div className="row">
          <select value={bizId} onChange={(e) => setBizId(e.target.value)}>
            {biz.map((b) => <option key={b.id} value={b.id}>{b.name} ({b.id})</option>)}
          </select>
          {verif && <span>Verification: <b>{verif.verification_status}</b>{verif.verification_status !== "verified" && <> · <a href={verif.startUrl} target="_blank">start verification</a></>}</span>}
        </div>
        <table><thead><tr><th>WhatsApp account</th><th>ID</th><th>Relation</th><th>Review</th></tr></thead>
          <tbody>{accounts.map((a) => <tr key={a.id}><td>{a.name}</td><td>{a.id}</td><td>{a.relation}</td><td>{a.account_review_status}</td></tr>)}</tbody></table>
      </div>

      <div className="card">
        <h3>Phone numbers</h3>
        <table><thead><tr><th>Number</th><th>ID</th><th>Name</th><th>Verified</th><th>Status</th><th>Quality</th><th>Tier</th></tr></thead>
          <tbody>{numbers.map((n) => (
            <tr key={n.id} onClick={() => setF({ ...f, id: n.id })} style={{ cursor: "pointer" }}>
              <td>{n.display_phone_number}</td><td>{n.id}</td><td>{n.verified_name} <span className="muted">{n.name_status}</span></td>
              <td>{n.code_verification_status}</td><td>{n.status}</td><td>{n.quality_rating}</td><td>{n.messaging_limit_tier}</td></tr>))}
          </tbody></table>
      </div>

      <div className="card">
        <h3>Onboard a number</h3>
        <p className="muted">1 Add → 2 Send code → 3 Verify → 4 Register. The number must not be active in the WhatsApp or WhatsApp Business app.</p>
        <div className="row">
          <input style={{ width: 60 }} value={f.cc} onChange={set("cc")} placeholder="cc" />
          <input value={f.phone_number} onChange={set("phone_number")} placeholder="phone number" />
          <input value={f.verified_name} onChange={set("verified_name")} placeholder="display name" />
          <button onClick={() => run(() => api("add_phone_number", f), (d) => { setF({ ...f, id: d.id }); loadNumbers(); return `Added, phone number ID ${d.id}`; })}>1 Add</button>
        </div>
        <div className="row">
          <input value={f.id} onChange={set("id")} placeholder="phone number ID" />
          <button onClick={() => run(() => api("send_verification_code", { id: f.id, method: "SMS" }), () => "Code sent by SMS")}>2 Send code (SMS)</button>
          <button className="ghost" onClick={() => run(() => api("send_verification_code", { id: f.id, method: "VOICE" }), () => "Calling with code")}>by voice</button>
        </div>
        <div className="row">
          <input value={f.code} onChange={set("code")} placeholder="6-digit code" />
          <button onClick={() => run(() => api("verify_phone_number", { id: f.id, code: f.code }), () => { loadNumbers(); return "Verified"; })}>3 Verify</button>
        </div>
        <div className="row">
          <input value={f.pin} onChange={set("pin")} placeholder="6-digit two-step PIN" />
          <button onClick={() => run(() => api("register_phone_number", { id: f.id, pin: f.pin }), () => { loadNumbers(); return "Registered — set WA_PHONE_NUMBER_ID to this ID to send from it"; })}>4 Register</button>
        </div>
      </div>
    </>
  );
}
