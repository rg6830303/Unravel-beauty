"use client";
import { useState } from "react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  async function go() {
    setErr("");
    const r = await fetch("/api/login", { method: "POST", body: JSON.stringify({ email, password: pw }) });
    if (r.ok) location.href = "/"; else setErr((await r.json().catch(() => ({}))).error || "Sign-in failed");
  }
  return (
    <div className="card" style={{ maxWidth: 340 }}>
      <h3>Sign in</h3>
      <div className="row"><input style={{ flex: 1 }} type="email" placeholder="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
      <div className="row"><input style={{ flex: 1 }} type="password" placeholder="password" autoComplete="current-password" value={pw}
        onChange={(e) => setPw(e.target.value)} onKeyDown={(e) => e.key === "Enter" && go()} /></div>
      <button onClick={go}>Login</button> <span style={{ color: "var(--bad)" }}>{err}</span>
    </div>
  );
}
