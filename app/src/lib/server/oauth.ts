/**
 * OAuth 2.1 authorization server for MCP clients (Claude, ChatGPT, Gemini CLI, Cursor…):
 * dynamic client registration, authorization code + PKCE (S256), refresh-token rotation.
 * Single-user: approving a client requires the owner's OmniPost password (or an active login).
 */
import { z } from "zod";
import { randomToken, sha256, safeEqual } from "./crypto";
import { getDb } from "./db";
import { env } from "./env";

export const SCOPE = "omnipost";
const CODE_TTL_S = 300;
const ACCESS_TTL_S = 60 * 60;
const REFRESH_TTL_S = 60 * 60 * 24 * 60;

export class OAuthError extends Error {
  constructor(readonly code: string, message: string, readonly status = 400) { super(message); }
  json() { return Response.json({ error: this.code, error_description: this.message }, { status: this.status, headers: { "Cache-Control": "no-store" } }); }
}

export const issuer = () => env.baseUrl;
export const mcpResource = () => `${env.baseUrl}/mcp`;

export const authServerMetadata = () => ({
  issuer: issuer(),
  authorization_endpoint: `${issuer()}/oauth/authorize`,
  token_endpoint: `${issuer()}/oauth/token`,
  registration_endpoint: `${issuer()}/oauth/register`,
  response_types_supported: ["code"],
  grant_types_supported: ["authorization_code", "refresh_token"],
  code_challenge_methods_supported: ["S256"],
  token_endpoint_auth_methods_supported: ["none"],
  scopes_supported: [SCOPE],
});

export const protectedResourceMetadata = () => ({
  resource: mcpResource(),
  authorization_servers: [issuer()],
  scopes_supported: [SCOPE],
  bearer_methods_supported: ["header"],
  resource_name: "OmniPost AI",
});

const RedirectUri = z.string().url().refine((u) => {
  const url = new URL(u);
  return url.protocol === "https:" || (url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname));
}, "redirect_uri must be https (or http on localhost)");

export async function registerClient(body: unknown) {
  const parsed = z.object({ redirect_uris: z.array(RedirectUri).min(1).max(10), client_name: z.string().max(100).optional() }).safeParse(body);
  if (!parsed.success) throw new OAuthError("invalid_client_metadata", parsed.error.issues[0]?.message ?? "Invalid client metadata");
  const client_id = "op_" + randomToken(16);
  const client_name = (parsed.data.client_name || "MCP client").replace(/[<>]/g, "");
  await getDb().insert("oauth_clients", { client_id, client_name, redirect_uris: parsed.data.redirect_uris });
  return { client_id, client_name, redirect_uris: parsed.data.redirect_uris, token_endpoint_auth_method: "none", grant_types: ["authorization_code", "refresh_token"], response_types: ["code"], client_id_issued_at: Math.floor(Date.now() / 1000) };
}

export type AuthRequest = { client_id: string; redirect_uri: string; code_challenge: string; state: string; scope: string };

/** Validates an /authorize request. Errors before the redirect URI is trusted are shown to the user, not redirected. */
export async function validateAuthRequest(p: URLSearchParams | FormData): Promise<{ req: AuthRequest; clientName: string }> {
  const get = (k: string) => String(p.get(k) ?? "");
  const client_id = get("client_id");
  const rows = client_id ? await getDb().select("oauth_clients", { client_id }) : [];
  const client = rows[0] as { client_name: string; redirect_uris: string[] } | undefined;
  if (!client) throw new OAuthError("invalid_client", "Unknown client. Remove the connector and add it again.");
  const redirect_uri = get("redirect_uri") || (client.redirect_uris.length === 1 ? client.redirect_uris[0] : "");
  if (!client.redirect_uris.includes(redirect_uri)) throw new OAuthError("invalid_request", "redirect_uri is not registered for this client.");
  if (get("response_type") && get("response_type") !== "code") throw new OAuthError("unsupported_response_type", "Only response_type=code is supported.");
  if (get("code_challenge_method") !== "S256" || !/^[\w-]{43,128}$/.test(get("code_challenge"))) throw new OAuthError("invalid_request", "PKCE with S256 is required.");
  return { req: { client_id, redirect_uri, code_challenge: get("code_challenge"), state: get("state"), scope: get("scope") || SCOPE }, clientName: client.client_name };
}

export function redirectWith(redirectUri: string, params: Record<string, string>) {
  const url = new URL(redirectUri);
  for (const [k, v] of Object.entries(params)) if (v) url.searchParams.set(k, v);
  return url.toString();
}

export async function issueCode(req: AuthRequest): Promise<string> {
  const code = randomToken(32);
  await getDb().insert("oauth_codes", {
    code_hash: await sha256(code), client_id: req.client_id, redirect_uri: req.redirect_uri, code_challenge: req.code_challenge,
    scope: req.scope, expires_at: new Date(Date.now() + CODE_TTL_S * 1000).toISOString(),
  });
  return code;
}

async function issueTokens(client_id: string, scope: string) {
  const access = randomToken(32);
  const refresh = randomToken(32);
  const db = getDb();
  await db.insert("oauth_tokens", { token_hash: await sha256(access), kind: "access", client_id, scope, expires_at: new Date(Date.now() + ACCESS_TTL_S * 1000).toISOString() });
  await db.insert("oauth_tokens", { token_hash: await sha256(refresh), kind: "refresh", client_id, scope, expires_at: new Date(Date.now() + REFRESH_TTL_S * 1000).toISOString() });
  return { access_token: access, token_type: "Bearer", expires_in: ACCESS_TTL_S, refresh_token: refresh, scope };
}

export async function exchangeToken(form: URLSearchParams) {
  const db = getDb();
  const grant = form.get("grant_type");
  const client_id = form.get("client_id") ?? "";
  if (grant === "authorization_code") {
    const code = form.get("code") ?? "";
    const verifier = form.get("code_verifier") ?? "";
    const hash = await sha256(code);
    const row = (await db.select("oauth_codes", { code_hash: hash }))[0] as
      | { client_id: string; redirect_uri: string; code_challenge: string; scope: string; expires_at: string } | undefined;
    if (row) await db.remove("oauth_codes", { code_hash: hash }); // single use, even on failure
    if (!row || Date.parse(row.expires_at) < Date.now()) throw new OAuthError("invalid_grant", "Authorization code is invalid or expired.");
    if (client_id && client_id !== row.client_id) throw new OAuthError("invalid_grant", "Code was issued to another client.");
    if (form.get("redirect_uri") && form.get("redirect_uri") !== row.redirect_uri) throw new OAuthError("invalid_grant", "redirect_uri mismatch.");
    if (!verifier || !safeEqual(await sha256(verifier), row.code_challenge)) throw new OAuthError("invalid_grant", "PKCE verification failed.");
    return issueTokens(row.client_id, row.scope || SCOPE);
  }
  if (grant === "refresh_token") {
    const hash = await sha256(form.get("refresh_token") ?? "");
    const row = (await db.select("oauth_tokens", { token_hash: hash, kind: "refresh" }))[0] as { client_id: string; scope: string; expires_at: string } | undefined;
    if (row) await db.remove("oauth_tokens", { token_hash: hash }); // rotation
    if (!row || Date.parse(row.expires_at) < Date.now()) throw new OAuthError("invalid_grant", "Refresh token is invalid or expired.");
    if (client_id && client_id !== row.client_id) throw new OAuthError("invalid_grant", "Refresh token was issued to another client.");
    return issueTokens(row.client_id, row.scope || SCOPE);
  }
  throw new OAuthError("unsupported_grant_type", "Use authorization_code or refresh_token.");
}

/** Returns the client's display name for a valid access token, or null. */
export async function verifyAccessToken(token: string): Promise<{ clientId: string; clientName: string } | null> {
  if (!token) return null;
  const db = getDb();
  const row = (await db.select("oauth_tokens", { token_hash: await sha256(token), kind: "access" }))[0] as { client_id: string; expires_at: string } | undefined;
  if (!row || Date.parse(row.expires_at) < Date.now()) return null;
  const client = (await db.select("oauth_clients", { client_id: row.client_id }))[0] as { client_name?: string } | undefined;
  return { clientId: row.client_id, clientName: client?.client_name || "MCP client" };
}
