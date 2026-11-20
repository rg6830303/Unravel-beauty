"use client";
import { useCallback, useEffect, useRef, useState } from "react";

// Responses survive page navigation, so revisiting a page paints instantly and refreshes behind it.
const cache = new Map<string, any>();

// fetch + JSON that sends an expired session back to the login page instead of rendering an error body as data.
export async function api<T = any>(url: string, init?: RequestInit): Promise<T> {
  const r = await fetch(url, init);
  if (r.status === 401) {
    location.href = "/login";
    throw new Error("Session expired");
  }
  return (await r.json().catch(() => ({}))) as T;
}

// Cached GET with optional polling. Polling pauses while the tab is hidden, and identical
// responses are dropped so the UI doesn't re-render (and jump scroll) when nothing changed.
export function useApi<T = any>(url: string | null, every = 0) {
  const [data, setData] = useState<T | undefined>(url ? cache.get(url) : undefined);
  const [error, setError] = useState("");
  const alive = useRef(true);

  const load = useCallback(async () => {
    if (!url) return;
    try {
      const j = await api<T>(url);
      cache.set(url, j);
      if (!alive.current) return;
      setData((prev) => (JSON.stringify(prev) === JSON.stringify(j) ? prev : j));
      setError("");
    } catch (e: any) {
      if (alive.current) setError(e?.message ?? "Request failed");
    }
  }, [url]);

  useEffect(() => {
    alive.current = true;
    setData(url ? cache.get(url) : undefined);
    load();
    const tick = () => { if (!document.hidden) load(); };
    const t = every ? setInterval(tick, every) : undefined;
    if (every) document.addEventListener("visibilitychange", tick);
    return () => {
      alive.current = false;
      if (t) clearInterval(t);
      if (every) document.removeEventListener("visibilitychange", tick);
    };
  }, [url, every, load]);

  return { data, error, reload: load };
}
