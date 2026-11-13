import { checkDb } from "@/lib/server/db";
import { configured, env } from "@/lib/server/env";
export const dynamic = "force-dynamic";

/** Dashboard-only (behind the login): which backend features are on, and why the database is unusable when it is. */
export async function GET() {
  const dbHealth = configured.db() ? await checkDb() : null;
  return Response.json({
    db: configured.db(), ai: configured.ai(), auth: configured.auth(), model: configured.ai() ? env.openrouterModel : null, mcpUrl: `${env.baseUrl}/mcp`,
    dbIssue: dbHealth && !dbHealth.ok ? dbHealth.hint : "",
  });
}
