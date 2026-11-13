import { configured, env } from "@/lib/server/env";
import { handleRpc } from "@/lib/server/mcp";
import { verifyAccessToken } from "@/lib/server/oauth";

export const dynamic = "force-dynamic";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Authorization, Content-Type, Mcp-Protocol-Version, Mcp-Session-Id",
  "Access-Control-Expose-Headers": "WWW-Authenticate, Mcp-Session-Id",
  "Access-Control-Allow-Methods": "POST, GET, DELETE, OPTIONS",
};

const unauthorized = (description: string) =>
  Response.json({ error: "invalid_token", error_description: description }, {
    status: 401,
    headers: { ...CORS, "WWW-Authenticate": `Bearer resource_metadata="${env.baseUrl}/.well-known/oauth-protected-resource", error="invalid_token"` },
  });

export async function POST(req: Request) {
  if (!configured.db() || !configured.auth())
    return Response.json({ error: "server_not_configured", error_description: "OmniPost backend env vars are missing (see app/README.md)." }, { status: 503, headers: CORS });

  const token = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  const who = await verifyAccessToken(token).catch(() => null);
  if (!who) return unauthorized(token ? "Token is invalid or expired." : "Sign in to OmniPost to use this connector.");

  let body: unknown;
  try { body = await req.json(); } catch {
    return Response.json({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error" } }, { status: 400, headers: CORS });
  }
  const ctx = { clientName: who.clientName };
  if (Array.isArray(body)) {
    const out = (await Promise.all(body.map((m) => handleRpc(m, ctx)))).filter(Boolean);
    return out.length ? Response.json(out, { headers: CORS }) : new Response(null, { status: 202, headers: CORS });
  }
  const out = await handleRpc(body, ctx);
  return out ? Response.json(out, { headers: CORS }) : new Response(null, { status: 202, headers: CORS });
}

// Stateless server: no server-initiated SSE stream and no sessions to end.
export const GET = () => new Response("Method Not Allowed", { status: 405, headers: { ...CORS, Allow: "POST" } });
export const DELETE = GET;
export const OPTIONS = () => new Response(null, { status: 204, headers: CORS });
