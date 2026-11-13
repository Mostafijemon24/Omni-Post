import { configured } from "@/lib/server/env";
import { esc, page } from "@/lib/server/html";
import { issueCode, OAuthError, redirectWith, validateAuthRequest, type AuthRequest } from "@/lib/server/oauth";
import { checkPassword, readCookie, SESSION_COOKIE, verifySession } from "@/lib/server/session";

export const dynamic = "force-dynamic";

function consent(req: AuthRequest, clientName: string, loggedIn: boolean, error = "") {
  const hidden = Object.entries({ ...req, code_challenge_method: "S256", response_type: "code" })
    .map(([k, v]) => `<input type="hidden" name="${esc(k)}" value="${esc(v)}">`).join("");
  return page("Connect", `<h1>Connect ${esc(clientName)}</h1>
<p><span class="who">${esc(clientName)}</span> wants to use your OmniPost account. It will be able to:</p>
<ul><li>create and list post drafts</li><li>schedule posts</li><li>generate captions with your AI model</li></ul>
<p style="margin-top:10px">It cannot publish anything on its own.</p>
<form method="post">${hidden}
${loggedIn ? "" : `<label for="pw">OmniPost password</label><input id="pw" type="password" name="password" autocomplete="current-password" required autofocus>`}
${error ? `<div class="err">${esc(error)}</div>` : ""}
<div class="row"><button type="submit" name="decision" value="deny">Cancel</button><button class="primary" type="submit" name="decision" value="allow">Allow</button></div></form>`, error ? 401 : 200);
}

const loggedIn = (r: Request) => verifySession(readCookie(r.headers.get("cookie"), SESSION_COOKIE));

export async function GET(request: Request) {
  if (!configured.db() || !configured.auth()) return page("Not configured", "<h1>Not configured</h1><p>The OmniPost backend environment variables are missing.</p>", 503);
  try {
    const { req, clientName } = await validateAuthRequest(new URL(request.url).searchParams);
    return consent(req, clientName, await loggedIn(request));
  } catch (e) {
    return page("Error", `<h1>Can’t connect</h1><p>${esc(e instanceof OAuthError ? e.message : "Unexpected error.")}</p>`, 400);
  }
}

export async function POST(request: Request) {
  if (!configured.db() || !configured.auth()) return page("Not configured", "<h1>Not configured</h1>", 503);
  const form = await request.formData();
  let parsed;
  try { parsed = await validateAuthRequest(form); } catch (e) {
    return page("Error", `<h1>Can’t connect</h1><p>${esc(e instanceof OAuthError ? e.message : "Unexpected error.")}</p>`, 400);
  }
  const { req, clientName } = parsed;
  if (form.get("decision") !== "allow") return Response.redirect(redirectWith(req.redirect_uri, { error: "access_denied", state: req.state }), 302);
  const session = await loggedIn(request);
  if (!session && !(await checkPassword(String(form.get("password") ?? "")))) {
    await new Promise((r) => setTimeout(r, 600)); // slow down guessing
    return consent(req, clientName, false, "Wrong password.");
  }
  const code = await issueCode(req);
  return Response.redirect(redirectWith(req.redirect_uri, { code, state: req.state }), 302);
}
