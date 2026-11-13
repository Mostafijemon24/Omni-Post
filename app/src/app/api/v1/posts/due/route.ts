import { requireApiToken } from "@/lib/server/apiTokens";
import { configured } from "@/lib/server/env";
import { duePosts } from "@/lib/server/posts";
import { errorResponse, notConfigured } from "@/lib/server/respond";
export const dynamic = "force-dynamic";

/** GET /api/v1/posts/due — scheduled posts whose time has passed, as a plain array (one n8n item each). */
export async function GET(req: Request) {
  if (!configured.db()) return notConfigured();
  const who = await requireApiToken(req);
  if (who instanceof Response) return who;
  try { return Response.json(await duePosts()); }
  catch (e) { return errorResponse(e, "GET /api/v1/posts/due"); }
}
