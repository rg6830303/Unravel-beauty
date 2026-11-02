import crypto from "crypto";

type Contact = { name?: string | null; phone: string; attributes?: Record<string, any> | null; [k: string]: any };

const clean = (v: unknown) => String(v ?? "").replace(/[\n\t]+/g, " ").replace(/ {2,}/g, " ").trim();
const title = (s: string) => s.replace(/\b\w/g, (c) => c.toUpperCase());

// Resolve one merge field. Supports {{field}}, {{field|fallback}}, first_name, last_name, phone, and any CSV column.
export function resolveField(key: string, fallback: string, c: Contact): string {
  const k = key.trim().toLowerCase();
  const attrs = Object.fromEntries(Object.entries(c.attributes ?? {}).map(([a, b]) => [a.toLowerCase(), b]));
  const full = clean(c.name);
  let v: string;
  if (k === "name") v = full;
  else if (k === "first_name") v = full.split(" ")[0] ?? "";
  else if (k === "last_name") v = full.split(" ").slice(1).join(" ");
  else if (k === "phone") v = c.phone;
  else v = clean(attrs[k] ?? c[k]);
  if (!v) return fallback;
  return k.endsWith("name") ? title(v) : v;
}

// WhatsApp rejects empty template parameters (131008/132012) — never return "".
export function renderVariable(template: string, c: Contact, linkFor: (url: string) => string): string {
  const withLinks = template.replace(/\{\{\s*link:([^}]+?)\s*\}\}/g, (_, url) => linkFor(url.trim()));
  const out = withLinks.replace(/\{\{\s*([\w.]+)\s*(?:\|([^}]*))?\}\}/g, (_, k, fb) =>
    resolveField(k, fb !== undefined ? fb.trim() : k === "name" || k === "first_name" ? "there" : "-", c));
  return clean(out) || "-";
}

export const newToken = () => crypto.randomBytes(6).toString("base64url");
