/** Owner login: a signed, expiring cookie. Edge-safe (used by middleware). */
import { hmac, safeEqual, sha256 } from "./crypto";
import { env } from "./env";

export const SESSION_COOKIE = "op_session";
export const SESSION_TTL_S = 60 * 60 * 24 * 14;

export async function createSession(now = Date.now()): Promise<string> {
  const exp = Math.floor(now / 1000) + SESSION_TTL_S;
  return `${exp}.${await hmac(env.secret, "session." + exp)}`;
}

export async function verifySession(value: string | undefined, now = Date.now()): Promise<boolean> {
  if (!value || !env.secret) return false;
  const [exp, sig] = value.split(".");
  if (!exp || !sig || Number(exp) * 1000 < now) return false;
  return safeEqual(sig, await hmac(env.secret, "session." + exp));
}

/** Compares hashes so the comparison is constant-time regardless of the typed length. */
export async function checkPassword(input: string): Promise<boolean> {
  if (!env.adminPassword) return false;
  return safeEqual(await sha256(input), await sha256(env.adminPassword));
}

export function readCookie(header: string | null, name: string): string | undefined {
  return header?.split(/;\s*/).find((c) => c.startsWith(name + "="))?.slice(name.length + 1);
}

export const sessionCookieHeader = (value: string, secure: boolean) =>
  `${SESSION_COOKIE}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_TTL_S}${secure ? "; Secure" : ""}`;

/** Only same-site relative paths are allowed as post-login destinations. */
export const safeNext = (next: string | null | undefined) => (next && /^\/(?!\/)[\w\-/?=&.%]*$/.test(next) ? next : "/dashboard");
