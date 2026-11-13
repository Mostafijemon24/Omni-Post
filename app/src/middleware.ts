import { NextResponse, type NextRequest } from "next/server";
import { configured } from "@/lib/server/env";
import { SESSION_COOKIE, verifySession } from "@/lib/server/session";

/**
 * Owner-only dashboard. Once OMNIPOST_ADMIN_PASSWORD and OMNIPOST_SECRET are set, every page and
 * /api route needs the login cookie. /mcp, /oauth/* and /api/v1 authenticate on their own (OAuth token, consent page, API token).
 * Without those variables the app stays in open prototype mode, as before.
 */
export async function middleware(req: NextRequest) {
  if (!configured.auth()) return NextResponse.next();
  if (await verifySession(req.cookies.get(SESSION_COOKIE)?.value)) return NextResponse.next();
  if (req.nextUrl.pathname.startsWith("/api/")) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const url = new URL("/login", req.url);
  url.searchParams.set("next", req.nextUrl.pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!login|logout|mcp|oauth|\\.well-known|api/well-known|api/v1|_next|fonts|favicon).*)"],
};
