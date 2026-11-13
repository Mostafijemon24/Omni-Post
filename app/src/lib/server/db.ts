/**
 * Tiny data layer over Supabase's REST API (PostgREST), called only from the server with the
 * service-role key. An in-memory implementation backs the unit tests.
 */
import { env } from "./env";

export type Row = Record<string, unknown>;
export type Filter = Record<string, string | number | boolean | null>;

export interface Db {
  insert(table: string, row: Row): Promise<Row>;
  select(table: string, filter?: Filter, opts?: { order?: string; limit?: number }): Promise<Row[]>;
  update(table: string, filter: Filter, patch: Row): Promise<Row[]>;
  remove(table: string, filter: Filter): Promise<void>;
}

export class DbError extends Error {}

const qs = (filter: Filter = {}) =>
  Object.entries(filter).map(([k, v]) => `${encodeURIComponent(k)}=${v === null ? "is.null" : "eq." + encodeURIComponent(String(v))}`);

export class SupabaseDb implements Db {
  constructor(private url = env.supabaseUrl, private key = env.supabaseKey) {}

  private async call(method: string, path: string, body?: unknown): Promise<Row[]> {
    const res = await fetch(`${this.url}/rest/v1/${path}`, {
      method,
      headers: { apikey: this.key, Authorization: `Bearer ${this.key}`, "Content-Type": "application/json", Prefer: "return=representation" },
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: "no-store",
    });
    if (!res.ok) throw new DbError(`Supabase ${method} ${path.split("?")[0]} failed: ${res.status} ${(await res.text()).slice(0, 300)}`);
    const text = await res.text();
    return text ? (JSON.parse(text) as Row[]) : [];
  }

  async insert(table: string, row: Row) {
    const [out] = await this.call("POST", table, row);
    return out;
  }
  select(table: string, filter?: Filter, opts: { order?: string; limit?: number } = {}) {
    const parts = ["select=*", ...qs(filter)];
    if (opts.order) parts.push(`order=${opts.order}`);
    if (opts.limit) parts.push(`limit=${opts.limit}`);
    return this.call("GET", `${table}?${parts.join("&")}`);
  }
  update(table: string, filter: Filter, patch: Row) {
    return this.call("PATCH", `${table}?${qs(filter).join("&")}`, patch);
  }
  async remove(table: string, filter: Filter) {
    await this.call("DELETE", `${table}?${qs(filter).join("&")}`);
  }
}

export class MemoryDb implements Db {
  tables = new Map<string, Row[]>();
  private t(name: string) {
    if (!this.tables.has(name)) this.tables.set(name, []);
    return this.tables.get(name)!;
  }
  private match = (filter: Filter = {}) => (r: Row) => Object.entries(filter).every(([k, v]) => (r[k] ?? null) === v);
  async insert(table: string, row: Row) {
    const out = { id: crypto.randomUUID(), created_at: new Date().toISOString(), ...row };
    this.t(table).push(out);
    return out;
  }
  async select(table: string, filter?: Filter, opts: { order?: string; limit?: number } = {}) {
    let rows = this.t(table).filter(this.match(filter));
    if (opts.order?.endsWith(".desc")) rows = [...rows].reverse();
    return opts.limit ? rows.slice(0, opts.limit) : rows;
  }
  async update(table: string, filter: Filter, patch: Row) {
    const rows = this.t(table).filter(this.match(filter));
    rows.forEach((r) => Object.assign(r, patch));
    return rows;
  }
  async remove(table: string, filter: Filter) {
    const keep = this.t(table).filter((r) => !this.match(filter)(r));
    this.tables.set(table, keep);
  }
}

let shared: Db | null = null;
export const getDb = (): Db => (shared ??= new SupabaseDb());
/** Test hook. */
export const setDb = (db: Db | null) => { shared = db; };
