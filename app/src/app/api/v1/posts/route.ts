import { requireApiToken } from "@/lib/server/apiTokens";
import { configured } from "@/lib/server/env";
import { createPost, listPosts, STATUSES } from "@/lib/server/posts";
import { errorResponse, notConfigured } from "@/lib/server/respond";
export const dynamic = "force-dynamic";

/** GET /api/v1/posts?status=draft&limit=50 */
export async function GET(req: Request) {
  if (!configured.db()) return notConfigured();
  const who = await requireApiToken(req);
  if (who instanceof Response) return who;
  const q = new URL(req.url).searchParams;
  const status = q.get("status");
  if (status && !(STATUSES as readonly string[]).includes(status)) return Response.json({ error: `status must be one of ${STATUSES.join(", ")}` }, { status: 400 });
  try { return Response.json(await listPosts({ status: status ?? undefined, limit: Number(q.get("limit")) || 50 })); }
  catch (e) { return errorResponse(e, "GET /api/v1/posts"); }
}

/** POST /api/v1/posts — create a draft or scheduled post. `source` defaults to the token's name. */
export async function POST(req: Request) {
  if (!configured.db()) return notConfigured();
  const who = await requireApiToken(req);
  if (who instanceof Response) return who;
  try { return Response.json(await createPost(await req.json(), who), { status: 201 }); }
  catch (e) { return errorResponse(e, "POST /api/v1/posts"); }
}
