import { requireApiToken } from "@/lib/server/apiTokens";
import { configured } from "@/lib/server/env";
import { updatePost } from "@/lib/server/posts";
import { errorResponse, notConfigured } from "@/lib/server/respond";
export const dynamic = "force-dynamic";

/** PATCH /api/v1/posts/{id} — e.g. {"status":"published","published_url":"https://…"} or {"status":"failed","last_error":"…"} */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!configured.db()) return notConfigured();
  const who = await requireApiToken(req);
  if (who instanceof Response) return who;
  try { return Response.json(await updatePost((await params).id, await req.json())); }
  catch (e) { return errorResponse(e, "PATCH /api/v1/posts/[id]"); }
}
