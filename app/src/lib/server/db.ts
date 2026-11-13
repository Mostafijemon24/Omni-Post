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

/** Why a database call failed, in terms the owner can act on. Never contains secrets. */
export type DbProblem = "unreachable" | "key_rejected" | "permission_denied" | "tables_missing" | "error";

export class DbError extends Error {
  constructor(message: string, readonly problem: DbProblem = "error") { super(message); }
}

const MIGRATIONS = "supabase/migrations/001_init.sql and 002_api_tokens_and_publishing.sql in Supabase → SQL Editor (safe to run again)";
export const DB_HINTS: Record<DbProblem | "not_configured", string> = {
  not_configured: "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are not set on the server.",
  unreachable: "The server cannot reach Supabase. Check SUPABASE_URL and the server's outbound network.",
  key_rejected: "Supabase rejected the key. SUPABASE_SERVICE_ROLE_KEY must be the service_role (secret) key of this project, not the anon/publishable key.",
  permission_denied: `Supabase denies the server access to the OmniPost tables. Run ${MIGRATIONS}: they grant access to service_role.`,
  tables_missing: `The OmniPost tables do not exist yet. Run ${MIGRATIONS}.`,
  error: "Supabase returned an unexpected error. See the server log.",
};

/** Maps a PostgREST error response to a DbProblem. */
export function classifyDbError(status: number, body: string): DbProblem {
  let code = "";
  try { code = String((JSON.parse(body) as { code?: unknown }).code ?? ""); } catch { /* not JSON */ }
  if (code === "42501") return "permission_denied";
  if (code === "PGRST205" || code === "42P01") return "tables_missing";
  if (status === 401 || status === 403) return "key_rejected";
  return "error";
}

/** True when the configured key is plainly the public one (publishable key, or a JWT whose role is anon). */
export function isPublicKey(key: string): boolean {
  if (key.startsWith("sb_publishable_")) return true;
  try { return (JSON.parse(atob(key.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))) as { role?: string }).role === "anon"; } catch { return false; }
}

const qs = (filter: Filter = {}) =>
  Object.entries(filter).map(([k, v]) => `${encodeURIComponent(k)}=${v === null ? "is.null" : "eq." + encodeURIComponent(String(v))}`);

export class SupabaseDb implements Db {
  constructor(private url = env.supabaseUrl, private key = env.supabaseKey) {}

  private async call(method: string, path: string, body?: unknown): Promise<Row[]> {
    const table = path.split("?")[0];
    let res: Response;
    try {
      res = await fetch(`${this.url}/rest/v1/${path}`, {
        method,
        headers: { apikey: this.key, Authorization: `Bearer ${this.key}`, "Content-Type": "application/json", Prefer: "return=representation" },
        body: body === undefined ? undefined : JSON.stringify(body),
        cache: "no-store",
      });
    } catch (e) {
      throw new DbError(`Supabase ${method} ${table} failed: ${e instanceof Error ? e.message : String(e)}`, "unreachable");
    }
    if (!res.ok) {
      const detail = await res.text();
      throw new DbError(`Supabase ${method} ${table} failed: ${res.status} ${detail.slice(0, 300)}`, classifyDbError(res.status, detail));
    }
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

/** What to tell the owner when a database call throws. */
export const dbHint = (e: unknown) => DB_HINTS[e instanceof DbError ? e.problem : "error"];

export const TABLES = ["posts", "oauth_clients", "oauth_codes", "oauth_tokens", "api_tokens"] as const;
export type DbHealth = { ok: boolean; problem: DbProblem | "not_configured" | null; tables: string[]; hint: string };

const SEVERITY: DbProblem[] = ["unreachable", "key_rejected", "permission_denied", "tables_missing", "error"];

/** Reads one row from every table the app needs and reports the most fundamental failure. */
export async function checkDb(): Promise<DbHealth> {
  if (!env.supabaseUrl || !env.supabaseKey) return { ok: false, problem: "not_configured", tables: [], hint: DB_HINTS.not_configured };
  if (isPublicKey(env.supabaseKey)) return { ok: false, problem: "key_rejected", tables: [], hint: DB_HINTS.key_rejected };
  const db = getDb();
  const failed: { table: string; problem: DbProblem }[] = [];
  await Promise.all(TABLES.map(async (table) => {
    try { await db.select(table, undefined, { limit: 1 }); } catch (e) {
      console.error("db check", e);
      failed.push({ table, problem: e instanceof DbError ? e.problem : "error" });
    }
  }));
  if (!failed.length) return { ok: true, problem: null, tables: [], hint: "" };
  const problem = SEVERITY.find((p) => failed.some((f) => f.problem === p))!;
  return { ok: false, problem, tables: failed.filter((f) => f.problem === problem).map((f) => f.table).sort(), hint: DB_HINTS[problem] };
}
