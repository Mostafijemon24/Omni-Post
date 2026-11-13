import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { b64url, sha256 } from "@/lib/server/crypto";
import { checkDb, classifyDbError, DbError, isPublicKey, MemoryDb, setDb, SupabaseDb } from "@/lib/server/db";
import { handleRpc } from "@/lib/server/mcp";
import { exchangeToken, issueCode, registerClient, validateAuthRequest, verifyAccessToken } from "@/lib/server/oauth";
import { buildPrompt, parseVariations } from "@/lib/server/openrouter";
import { createSession, safeNext, verifySession } from "@/lib/server/session";

let db: MemoryDb;
beforeEach(() => {
  db = new MemoryDb();
  setDb(db);
  process.env.OMNIPOST_SECRET = "x".repeat(40);
  process.env.OMNIPOST_ADMIN_PASSWORD = "correct horse";
});
afterEach(() => { setDb(null); vi.unstubAllGlobals(); });

async function pkce() {
  const verifier = b64url(crypto.getRandomValues(new Uint8Array(32)));
  return { verifier, challenge: await sha256(verifier) };
}

async function connect() {
  const client = await registerClient({ client_name: "Claude", redirect_uris: ["https://claude.ai/api/mcp/auth_callback"] });
  const { verifier, challenge } = await pkce();
  const { req } = await validateAuthRequest(new URLSearchParams({
    client_id: client.client_id, redirect_uri: client.redirect_uris[0], response_type: "code", code_challenge: challenge, code_challenge_method: "S256", state: "s1",
  }));
  const code = await issueCode(req);
  return { client, verifier, code };
}

describe("OAuth for MCP clients", () => {
  it("runs register → authorize → token → verify", async () => {
    const { client, verifier, code } = await connect();
    const tok = await exchangeToken(new URLSearchParams({ grant_type: "authorization_code", code, code_verifier: verifier, client_id: client.client_id, redirect_uri: client.redirect_uris[0] }));
    expect(tok.token_type).toBe("Bearer");
    expect(await verifyAccessToken(tok.access_token)).toEqual({ clientId: client.client_id, clientName: "Claude" });
    // tokens are stored hashed, never in plain text
    expect(JSON.stringify([...db.tables.values()])).not.toContain(tok.access_token);
  });

  it("rejects a wrong PKCE verifier and burns the code", async () => {
    const { client, code, verifier } = await connect();
    await expect(exchangeToken(new URLSearchParams({ grant_type: "authorization_code", code, code_verifier: "wrong".repeat(10), client_id: client.client_id }))).rejects.toThrow(/PKCE/);
    await expect(exchangeToken(new URLSearchParams({ grant_type: "authorization_code", code, code_verifier: verifier, client_id: client.client_id }))).rejects.toThrow(/invalid or expired/);
  });

  it("rotates refresh tokens", async () => {
    const { client, verifier, code } = await connect();
    const first = await exchangeToken(new URLSearchParams({ grant_type: "authorization_code", code, code_verifier: verifier }));
    const second = await exchangeToken(new URLSearchParams({ grant_type: "refresh_token", refresh_token: first.refresh_token, client_id: client.client_id }));
    expect(second.access_token).not.toBe(first.access_token);
    await expect(exchangeToken(new URLSearchParams({ grant_type: "refresh_token", refresh_token: first.refresh_token }))).rejects.toThrow();
  });

  it("refuses unregistered redirect URIs and non-https URIs", async () => {
    await expect(registerClient({ redirect_uris: ["http://evil.example/cb"] })).rejects.toThrow(/https/);
    const client = await registerClient({ redirect_uris: ["https://chatgpt.com/connector_platform_oauth_redirect"] });
    await expect(validateAuthRequest(new URLSearchParams({ client_id: client.client_id, redirect_uri: "https://evil.example/cb", code_challenge: "a".repeat(43), code_challenge_method: "S256" }))).rejects.toThrow(/redirect_uri/);
  });

  it("returns null for unknown tokens", async () => {
    expect(await verifyAccessToken("nope")).toBeNull();
  });
});

describe("MCP handler", () => {
  const ctx = { clientName: "Claude" };
  it("negotiates the protocol version", async () => {
    const r = await handleRpc({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-03-26" } }, ctx);
    expect((r!.result as { protocolVersion: string }).protocolVersion).toBe("2025-03-26");
  });
  it("ignores notifications", async () => {
    expect(await handleRpc({ jsonrpc: "2.0", method: "notifications/initialized" }, ctx)).toBeNull();
  });
  it("lists tools without leaking implementations", async () => {
    const r = await handleRpc({ jsonrpc: "2.0", id: 2, method: "tools/list" }, ctx);
    const tools = (r!.result as { tools: { name: string; run?: unknown }[] }).tools;
    expect(tools.map((t) => t.name)).toContain("create_post_draft");
    expect(tools.every((t) => t.run === undefined)).toBe(true);
  });
  it("creates a draft attributed to the client", async () => {
    const r = await handleRpc({ jsonrpc: "2.0", id: 3, method: "tools/call", params: { name: "create_post_draft", arguments: { platform: "linkedin", caption: "Hello from Claude" } } }, ctx);
    expect((r!.result as { isError: boolean }).isError).toBe(false);
    const rows = db.tables.get("posts")!;
    expect(rows[0]).toMatchObject({ platform: "linkedin", status: "draft", source: "MCP · Claude" });
  });
  it("reports caption-limit violations as tool errors", async () => {
    const r = await handleRpc({ jsonrpc: "2.0", id: 4, method: "tools/call", params: { name: "create_post_draft", arguments: { platform: "x", caption: "a".repeat(300) } } }, ctx);
    expect(r!.result).toMatchObject({ isError: true });
  });
  it("returns method-not-found", async () => {
    const r = await handleRpc({ jsonrpc: "2.0", id: 5, method: "resources/list" }, ctx);
    expect(r!.error!.code).toBe(-32601);
  });
});

describe("OpenRouter reply parsing", () => {
  it("keeps requested platforms, clips to limits, prefixes hashtags", () => {
    const out = parseVariations("```json\n" + JSON.stringify({ variations: [
      { platform: "x", headline: "H", caption: "c".repeat(400), hashtags: ["ai"], cta: "", image_alt: "" },
      { platform: "reddit", caption: "not requested" },
    ] }) + "\n```", ["x"]);
    expect(out).toHaveLength(1);
    expect(out[0].caption.length).toBe(280);
    expect(out[0].hashtags).toEqual(["#ai"]);
  });
  it("puts limits and keyword in the prompt", () => {
    const p = buildPrompt({ topic: "AI in WordPress", platforms: ["threads"], keyword: "AI web development" });
    expect(p).toContain("threads: max 500");
    expect(p).toContain("AI web development");
  });
});

describe("owner session", () => {
  it("signs and verifies, rejects tampering and expiry", async () => {
    const s = await createSession();
    expect(await verifySession(s)).toBe(true);
    expect(await verifySession(s.replace(/.$/, (c) => (c === "A" ? "B" : "A")))).toBe(false);
    expect(await verifySession(s, Date.now() + 15 * 24 * 3600 * 1000)).toBe(false);
  });
  it("only allows relative redirects", () => {
    expect(safeNext("/studio")).toBe("/studio");
    expect(safeNext("//evil.com")).toBe("/dashboard");
    expect(safeNext("https://evil.com")).toBe("/dashboard");
  });
});

describe("SupabaseDb", () => {
  it("builds PostgREST requests with the service key", async () => {
    const fetchMock = vi.fn(async () => new Response("[]", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    await new SupabaseDb("https://x.supabase.co", "svc").select("posts", { status: "draft" }, { order: "created_at.desc", limit: 5 });
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://x.supabase.co/rest/v1/posts?select=*&status=eq.draft&order=created_at.desc&limit=5");
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer svc");
  });

  it("explains why Supabase refused a call", async () => {
    expect(classifyDbError(403, '{"code":"42501","message":"permission denied for table oauth_clients"}')).toBe("permission_denied");
    expect(classifyDbError(404, '{"code":"PGRST205","message":"Could not find the table"}')).toBe("tables_missing");
    expect(classifyDbError(401, '{"message":"Invalid API key"}')).toBe("key_rejected");
    expect(classifyDbError(500, "oops")).toBe("error");
    vi.stubGlobal("fetch", vi.fn(async () => new Response('{"code":"42501","message":"permission denied for table posts"}', { status: 403 })));
    await expect(new SupabaseDb("https://x.supabase.co", "svc").select("posts")).rejects.toMatchObject({ problem: "permission_denied" });
    vi.stubGlobal("fetch", vi.fn(async () => { throw new TypeError("fetch failed"); }));
    await expect(new SupabaseDb("https://x.supabase.co", "svc").select("posts")).rejects.toMatchObject({ problem: "unreachable" });
  });

  it("recognises the public key", () => {
    const jwt = (role: string) => `h.${btoa(JSON.stringify({ role })).replace(/=+$/, "")}.s`;
    expect(isPublicKey(jwt("anon"))).toBe(true);
    expect(isPublicKey("sb_publishable_abc")).toBe(true);
    expect(isPublicKey(jwt("service_role"))).toBe(false);
    expect(isPublicKey("sb_secret_abc")).toBe(false);
  });
});

describe("checkDb", () => {
  const withEnv = () => { process.env.SUPABASE_URL = "https://x.supabase.co"; process.env.SUPABASE_SERVICE_ROLE_KEY = "sb_secret_abc"; };
  afterEach(() => { delete process.env.SUPABASE_URL; delete process.env.SUPABASE_SERVICE_ROLE_KEY; });

  it("is healthy when every table answers", async () => {
    withEnv();
    expect(await checkDb()).toMatchObject({ ok: true, problem: null });
  });
  it("names the tables the server may not read and how to fix it", async () => {
    withEnv();
    vi.spyOn(console, "error").mockImplementation(() => {});
    db.select = async (table) => { if (table.startsWith("oauth_")) throw new DbError("denied", "permission_denied"); return []; };
    const health = await checkDb();
    expect(health).toMatchObject({ ok: false, problem: "permission_denied", tables: ["oauth_clients", "oauth_codes", "oauth_tokens"] });
    expect(health.hint).toMatch(/001_init\.sql/);
  });
  it("reports missing configuration and a public key without calling Supabase", async () => {
    expect((await checkDb()).problem).toBe("not_configured");
    withEnv();
    process.env.SUPABASE_SERVICE_ROLE_KEY = "sb_publishable_abc";
    expect((await checkDb()).problem).toBe("key_rejected");
  });
});
