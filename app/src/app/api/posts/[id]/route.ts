import { configured } from "@/lib/server/env";
import { deletePost, updatePost } from "@/lib/server/posts";
import { errorResponse, notConfigured } from "@/lib/server/respond";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/** Dashboard actions on one post (behind the login): reschedule, change status, edit. */
export async function PATCH(req: Request, { params }: Ctx) {
  if (!configured.db()) return notConfigured();
  try { return Response.json({ post: await updatePost((await params).id, await req.json()) }); } catch (e) { return errorResponse(e, "PATCH /api/posts"); }
}

export async function DELETE(_req: Request, { params }: Ctx) {
  if (!configured.db()) return notConfigured();
  try { await deletePost((await params).id); return new Response(null, { status: 204 }); } catch (e) { return errorResponse(e, "DELETE /api/posts"); }
}
