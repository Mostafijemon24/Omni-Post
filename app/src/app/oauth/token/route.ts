import { dbHint } from "@/lib/server/db";
import { exchangeToken, OAuthError } from "@/lib/server/oauth";
export const dynamic = "force-dynamic";
const CORS = { "Access-Control-Allow-Origin": "*", "Cache-Control": "no-store" };

export async function POST(req: Request) {
  try {
    const type = req.headers.get("content-type") ?? "";
    const form = type.includes("json") ? new URLSearchParams((await req.json()) as Record<string, string>) : new URLSearchParams(await req.text());
    return Response.json(await exchangeToken(form), { headers: CORS });
  } catch (e) {
    if (e instanceof OAuthError) return e.json();
    console.error("oauth/token", e);
    return new OAuthError("server_error", `Token exchange failed. ${dbHint(e)}`, 500).json();
  }
}
export const OPTIONS = () => new Response(null, { status: 204, headers: { ...CORS, "Access-Control-Allow-Headers": "Content-Type", "Access-Control-Allow-Methods": "POST, OPTIONS" } });
