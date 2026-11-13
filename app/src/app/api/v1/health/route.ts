import { checkDb, type DbHealth } from "@/lib/server/db";
import { configured, env } from "@/lib/server/env";
export const dynamic = "force-dynamic";

// Public, so it is cached briefly (it costs one Supabase read per table) and carries no secrets.
const TTL_MS = 15_000;
let cached: { at: number; db: DbHealth } | null = null;

/** Is the backend usable? Explains what to fix when the dashboard, the REST API or an MCP connector fails. */
export async function GET() {
  if (!cached || Date.now() - cached.at > TTL_MS) cached = { at: Date.now(), db: await checkDb() };
  const { db } = cached;
  const auth = configured.auth();
  const ok = db.ok && auth;
  return Response.json(
    { ok, db, auth: { ok: auth, hint: auth ? "" : "Set OMNIPOST_ADMIN_PASSWORD and OMNIPOST_SECRET (32+ characters) on the server." }, mcpUrl: `${env.baseUrl}/mcp` },
    { status: ok ? 200 : 503, headers: { "Cache-Control": "no-store", "Access-Control-Allow-Origin": "*" } },
  );
}
