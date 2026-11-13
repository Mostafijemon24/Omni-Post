import { configured } from "@/lib/server/env";
import { esc, page } from "@/lib/server/html";
import { checkPassword, createSession, safeNext, sessionCookieHeader } from "@/lib/server/session";

export const dynamic = "force-dynamic";

const form = (next: string, error = "") => page("Sign in", `<h1>OmniPost AI</h1><p>Sign in to your dashboard.</p>
<form method="post"><input type="hidden" name="next" value="${esc(next)}">
<label for="pw">Password</label><input id="pw" type="password" name="password" autocomplete="current-password" required autofocus>
${error ? `<div class="err">${esc(error)}</div>` : ""}
<div class="row"><button class="primary" type="submit">Sign in</button></div></form>`, error ? 401 : 200);

export function GET(req: Request) {
  if (!configured.auth()) return page("Not configured", "<h1>Login is not configured</h1><p>Set OMNIPOST_ADMIN_PASSWORD and OMNIPOST_SECRET on the server.</p>", 503);
  return form(safeNext(new URL(req.url).searchParams.get("next")));
}

export async function POST(req: Request) {
  if (!configured.auth()) return page("Not configured", "<h1>Login is not configured</h1>", 503);
  const data = await req.formData();
  const next = safeNext(String(data.get("next") ?? ""));
  if (!(await checkPassword(String(data.get("password") ?? "")))) {
    await new Promise((r) => setTimeout(r, 600));
    return form(next, "Wrong password.");
  }
  const secure = new URL(req.url).protocol === "https:" || req.headers.get("x-forwarded-proto") === "https";
  return new Response(null, { status: 303, headers: { Location: next, "Set-Cookie": sessionCookieHeader(await createSession(), secure) } });
}
