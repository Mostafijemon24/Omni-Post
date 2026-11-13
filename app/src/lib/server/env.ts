/**
 * Server configuration, read from environment variables set on the host (never committed).
 * Every backend feature degrades to "not configured" instead of crashing when its variables are missing.
 */
export const env = {
  get supabaseUrl() { return (process.env.SUPABASE_URL ?? "").replace(/\/+$/, ""); },
  get supabaseKey() { return process.env.SUPABASE_SERVICE_ROLE_KEY ?? ""; },
  get openrouterKey() { return process.env.OPENROUTER_API_KEY ?? ""; },
  get openrouterModel() { return process.env.OPENROUTER_MODEL || "anthropic/claude-sonnet-4.5"; },
  get adminPassword() { return process.env.OMNIPOST_ADMIN_PASSWORD ?? ""; },
  get secret() { return process.env.OMNIPOST_SECRET ?? ""; },
  get baseUrl() { return (process.env.PUBLIC_BASE_URL || "http://localhost:3000").replace(/\/+$/, ""); },
};

export const configured = {
  db: () => Boolean(env.supabaseUrl && env.supabaseKey),
  ai: () => Boolean(env.openrouterKey),
  /** Login (and therefore OAuth for MCP clients) needs both an admin password and a signing secret. */
  auth: () => Boolean(env.adminPassword && env.secret.length >= 32),
};
