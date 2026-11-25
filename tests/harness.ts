// Test harness: the real schema.sql running in an in-process Postgres (PGlite), exposed through a small
// stand-in for the supabase-js query builder, plus a scriptable fake of Meta's Graph API.
import { readFileSync } from "fs";
import { PGlite } from "@electric-sql/pglite";
import { vi } from "vitest";
import { NextRequest } from "next/server";

type Res = { data: any; error: any; count?: number | null };
const PK: Record<string, string> = { settings: "key", links: "token" };

const plain = (v: any): any =>
  v instanceof Date ? v.toISOString() : typeof v === "bigint" ? Number(v)
    : Array.isArray(v) ? v.map(plain) : v;
const row = (r: any) => Object.fromEntries(Object.entries(r).map(([k, v]) => [k, plain(v)]));

class Query implements PromiseLike<Res> {
  private op = "select";
  private cols = "*";
  private returning = false;
  private where: string[] = [];
  private params: any[] = [];
  private tail = "";
  private body: any;
  private conflict?: string;
  private want?: "single" | "maybe";
  private head = false;
  private counted = false;
  constructor(private pg: PGlite, private types: Record<string, string>, private table: string) {}

  private val(col: string, v: any) {
    const t = this.types[`${this.table}.${col}`];
    if (!t) throw new Error(`unknown column ${this.table}.${col}`);
    if (v === null || v === undefined) return "null";
    const enc = t === "jsonb" ? JSON.stringify(v)
      : t.endsWith("[]") ? `{${(v as any[]).map((x) => `"${String(x).replace(/(["\\])/g, "\\$1")}"`).join(",")}}`
      : v instanceof Date ? v.toISOString() : String(v);
    this.params.push(enc);
    return `($${this.params.length}::text)::${t}`;
  }
  private cmp(col: string, op: string, v: any) { this.where.push(`"${col}" ${op} ${this.val(col, v)}`); return this; }

  select(cols = "*", opts: { count?: string; head?: boolean } = {}) {
    if (this.op === "select") { this.cols = cols; this.head = !!opts.head; this.counted = !!opts.count; }
    else this.returning = true;
    return this;
  }
  insert(body: any) { this.op = "insert"; this.body = body; return this; }
  upsert(body: any, opts: { onConflict?: string } = {}) { this.op = "upsert"; this.body = body; this.conflict = opts.onConflict; return this; }
  update(body: any) { this.op = "update"; this.body = body; return this; }
  delete() { this.op = "delete"; return this; }
  eq(c: string, v: any) { return this.cmp(c, "=", v); }
  lte(c: string, v: any) { return this.cmp(c, "<=", v); }
  gte(c: string, v: any) { return this.cmp(c, ">=", v); }
  lt(c: string, v: any) { return this.cmp(c, "<", v); }
  gt(c: string, v: any) { return this.cmp(c, ">", v); }
  overlaps(c: string, v: any[]) { return this.cmp(c, "&&", v); }
  contains(c: string, v: any[]) { return this.cmp(c, "@>", v); }
  in(c: string, vs: any[]) {
    this.where.push(vs.length ? `"${c}" in (${vs.map((v) => this.val(c, v)).join(",")})` : "false");
    return this;
  }
  order(c: string, o: { ascending?: boolean } = {}) {
    this.tail += `${this.tail.includes("order by") ? "," : " order by"} "${c}" ${o.ascending === false ? "desc" : "asc"}`;
    return this;
  }
  limit(n: number) { this.tail += ` limit ${n}`; return this; }
  range(a: number, b: number) { this.tail += ` limit ${b - a + 1} offset ${a}`; return this; }
  single() { this.want = "single"; return this; }
  maybeSingle() { this.want = "maybe"; return this; }

  private sql() {
    const w = this.where.length ? ` where ${this.where.join(" and ")}` : "";
    const t = `"${this.table}"`;
    if (this.op === "select")
      return this.head ? `select count(*)::int n from ${t}${w}` : `select ${this.cols} from ${t}${w}${this.tail}`;
    if (this.op === "delete") return `delete from ${t}${w} returning *`;
    const rows: any[] = Array.isArray(this.body) ? this.body : [this.body];
    const keys = [...new Set(rows.flatMap((r) => Object.keys(r)))];
    let q = `insert into ${t} (${keys.map((k) => `"${k}"`).join(",")}) values ` +
      rows.map((r) => `(${keys.map((k) => (k in r ? this.val(k, r[k]) : "default")).join(",")})`).join(",");
    if (this.op === "upsert") {
      const target = (this.conflict ?? PK[this.table] ?? "id").split(",");
      const set = keys.filter((k) => !target.includes(k)).map((k) => `"${k}" = excluded."${k}"`);
      q += ` on conflict (${target.map((k) => `"${k}"`).join(",")}) ${set.length ? `do update set ${set.join(", ")}` : "do nothing"}`;
    }
    return `${q} returning *`;
  }

  private async run(): Promise<Res> {
    try {
      // update-set values are numbered before where values, so build the statement once, in SQL order
      if (this.op === "update") {
        const where = this.where, params = this.params;
        this.where = []; this.params = [];
        const set = Object.entries(this.body).map(([k, v]) => `"${k}" = ${this.val(k, v)}`).join(", ");
        const shift = this.params.length;
        const w = where.map((x) => x.replace(/\$(\d+)/g, (_, n) => `$${Number(n) + shift}`));
        const sql = `update "${this.table}" set ${set}${w.length ? ` where ${w.join(" and ")}` : ""} returning *`;
        return this.shape((await this.pg.query(sql, [...this.params, ...params])).rows);
      }
      return this.shape((await this.pg.query(this.sql(), this.params)).rows);
    } catch (e: any) {
      return { data: null, error: { message: e.message, code: e.code }, count: null };
    }
  }
  private shape(rows: any[]): Res {
    if (this.op === "select" && this.head) return { data: null, error: null, count: rows[0].n };
    const data = rows.map(row);
    if (this.op !== "select" && !this.returning) return { data: null, error: null };
    if (this.want === "single")
      return data.length === 1 ? { data: data[0], error: null } : { data: null, error: { message: "not exactly one row", code: "PGRST116" } };
    if (this.want === "maybe") return { data: data[0] ?? null, error: null };
    return { data, error: null, count: this.counted ? data.length : null };
  }
  then<A = Res, B = never>(ok?: ((v: Res) => A | PromiseLike<A>) | null, bad?: ((e: any) => B | PromiseLike<B>) | null) {
    return this.run().then(ok, bad);
  }
}

export async function createDb() {
  const pg = new PGlite();
  await pg.exec(readFileSync("supabase/schema.sql", "utf8"));
  const { rows } = await pg.query<any>(
    "select table_name t, column_name c, udt_name u from information_schema.columns where table_schema = 'public'");
  const types: Record<string, string> = {};
  for (const r of rows) types[`${r.t}.${r.c}`] = r.u.startsWith("_") ? `${r.u.slice(1)}[]` : r.u;
  const setOf = new Set((await pg.query<any>("select proname from pg_proc where proretset")).rows.map((r) => r.proname));
  const { rows: defaults } = await pg.query<any>("select key, value from settings");

  const client = {
    from: (table: string) => new Query(pg, types, table),
    rpc: async (fn: string, args: Record<string, any> = {}): Promise<Res> => {
      try {
        const keys = Object.keys(args);
        const r = await pg.query<any>(`select * from ${fn}(${keys.map((k, i) => `${k} => $${i + 1}`).join(",")})`, keys.map((k) => args[k]));
        return { data: setOf.has(fn) ? r.rows.map(row) : plain(Object.values(r.rows[0])[0]), error: null };
      } catch (e: any) {
        return { data: null, error: { message: e.message, code: e.code } };
      }
    },
  };
  (globalThis as any).__waTestDb = client;

  return {
    pg,
    sql: async <T = any>(q: string, params: any[] = []) => (await pg.query<T>(q, params)).rows.map(row) as T[],
    // empty every table and restore the seeded settings, with quiet hours off unless a test turns them on
    reset: async () => {
      await pg.exec("truncate contacts, campaigns, messages, links, wa_events, send_attempts, templates, automations, knowledge, settings, otp_codes cascade");
      for (const d of defaults) await pg.query("insert into settings (key, value) values ($1, $2)", [d.key, JSON.stringify(d.value)]);
      await pg.exec(`update settings set value = '0' where key in ('quiet_start', 'quiet_end');
        insert into templates (name, language, category, status, components) values
          ('promo', 'en', 'MARKETING', 'APPROVED', '[{"type":"BODY","text":"Hi {{1}}, your offer: {{2}}"}]')`);
    },
  };
}

export type Outcome = "ok" | number; // number = Meta error code returned by the API for that attempt

// Fake Graph API. `script[phone]` lists the API outcome of each successive send to that phone (default: accepted).
export function fakeMeta() {
  const state = {
    script: {} as Record<string, Outcome[]>,
    sends: [] as { to: string; wamid: string; body: any; path: string }[],
    attempts: {} as Record<string, number>,
    health: { quality_rating: "GREEN", messaging_limit_tier: "TIER_100K" } as Record<string, string>,
    n: 0,
  };
  const json = (body: any, status = 200) => new Response(JSON.stringify(body), { status });
  vi.stubGlobal("fetch", async (url: any, init: any = {}) => {
    const u = String(url);
    if (init.method !== "POST") return json(u.includes("?fields=quality_rating") ? state.health : { data: [] });
    const body = JSON.parse(init.body ?? "{}");
    if (body.status === "read") return json({ success: true });
    const i = state.attempts[body.to] = (state.attempts[body.to] ?? 0) + 1;
    const out = state.script[body.to]?.[i - 1] ?? "ok";
    if (out !== "ok") return json({ error: { code: out, message: `meta error ${out}` } }, 400);
    const wamid = `wamid.${++state.n}`;
    state.sends.push({ to: body.to, wamid, body, path: u.split("/").pop()! });
    return json({ messages: [{ id: wamid }] });
  });
  return state;
}

export const statusEvent = (wamid: string, status: string, code?: number) => ({
  entry: [{ changes: [{ field: "messages", value: { statuses: [{
    id: wamid, status, timestamp: String(Math.floor(Date.now() / 1000)),
    ...(code ? { errors: [{ code, title: `meta error ${code}` }] } : {}),
  }] } }] }],
});

export const inboundEvent = (from: string, text: string) => ({
  entry: [{ changes: [{ field: "messages", value: {
    contacts: [{ wa_id: from, profile: { name: "Tester" } }],
    messages: [{ id: `in.${from}.${Date.now()}.${Math.random()}`, from, type: "text", text: { body: text } }],
  } }] }],
});

export const post = (path: string, body: any, method = "POST") =>
  new NextRequest(`https://app.test${path}`, { method, body: JSON.stringify(body) });
