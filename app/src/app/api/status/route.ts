import { configured, env } from "@/lib/server/env";
export const dynamic = "force-dynamic";
export const GET = () => Response.json({ db: configured.db(), ai: configured.ai(), auth: configured.auth(), model: configured.ai() ? env.openrouterModel : null, mcpUrl: `${env.baseUrl}/mcp` });
