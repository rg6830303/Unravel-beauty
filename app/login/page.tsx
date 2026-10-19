"use client";
import { useState } from "react";

export default function Login() {
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  async function go() {
    const r = await fetch("/api/login", { method: "POST", body: JSON.stringify({ password: pw }) });
    if (r.ok) location.href = "/"; else setErr("Wrong password");
  }
  return (
    <div className="card" style={{ maxWidth: 320 }}>
      <h3>Sign in</h3>
      <div className="row"><input type="password" value={pw} onChange={(e) => setPw(e.target.value)} onKeyDown={(e) => e.key === "Enter" && go()} /></div>
      <button onClick={go}>Login</button> <span style={{ color: "var(--bad)" }}>{err}</span>
    </div>
  );
}
