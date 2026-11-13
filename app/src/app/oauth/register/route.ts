import { dbHint } from "@/lib/server/db";
import { configured } from "@/lib/server/env";
import { OAuthError, registerClient } from "@/lib/server/oauth";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!configured.db() || !configured.auth()) return new OAuthError("temporarily_unavailable", "OmniPost backend is not configured.", 503).json();
  try {
    return Response.json(await registerClient(await req.json().catch(() => ({}))), { status: 201, headers: { "Access-Control-Allow-Origin": "*", "Cache-Control": "no-store" } });
  } catch (e) {
    if (e instanceof OAuthError) return e.json();
    console.error("oauth/register", e);
    return new OAuthError("server_error", `Registration failed. ${dbHint(e)}`, 500).json();
  }
}
export const OPTIONS = () => new Response(null, { status: 204, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "Content-Type", "Access-Control-Allow-Methods": "POST, OPTIONS" } });
