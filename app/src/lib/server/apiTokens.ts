/** Personal API tokens for automations (n8n, Make, scripts). Stored as SHA-256 hashes; shown once. */
import { randomToken, sha256 } from "./crypto";
import { getDb } from "./db";

export async function createApiToken(name: string) {
  const token = "opk_" + randomToken(24);
  const row = await getDb().insert("api_tokens", { name: name.trim().slice(0, 80) || "API token", token_hash: await sha256(token), prefix: token.slice(0, 10) });
  return { id: row.id as string, name: row.name as string, prefix: row.prefix as string, token };
}

export async function listApiTokens() {
  const rows = await getDb().select("api_tokens", undefined, { order: "created_at.desc", limit: 100 });
  return rows.map((r) => ({ id: r.id, name: r.name, prefix: r.prefix, created_at: r.created_at, last_used_at: r.last_used_at ?? null }));
}

export async function revokeApiToken(id: string) {
  await getDb().remove("api_tokens", { id });
}

/** Returns the token's name when valid. */
export async function verifyApiToken(token: string): Promise<string | null> {
  if (!token.startsWith("opk_")) return null;
  const db = getDb();
  const hash = await sha256(token);
  const row = (await db.select("api_tokens", { token_hash: hash }))[0];
  if (!row) return null;
  db.update("api_tokens", { token_hash: hash }, { last_used_at: new Date().toISOString() }).catch(() => {});
  return String(row.name);
}

export async function requireApiToken(req: Request): Promise<string | Response> {
  const token = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  const name = token ? await verifyApiToken(token).catch(() => null) : null;
  return name ?? Response.json({ error: "Missing or invalid API token. Send 'Authorization: Bearer opk_…'." }, { status: 401 });
}
