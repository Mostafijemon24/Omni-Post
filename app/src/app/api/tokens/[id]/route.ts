import { revokeApiToken } from "@/lib/server/apiTokens";
import { configured } from "@/lib/server/env";
import { errorResponse, notConfigured } from "@/lib/server/respond";
export const dynamic = "force-dynamic";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!configured.db()) return notConfigured();
  try { await revokeApiToken((await params).id); return new Response(null, { status: 204 }); } catch (e) { return errorResponse(e, "DELETE /api/tokens"); }
}
