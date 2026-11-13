import { z } from "zod";
import { createApiToken, listApiTokens } from "@/lib/server/apiTokens";
import { configured } from "@/lib/server/env";
import { errorResponse, notConfigured } from "@/lib/server/respond";
export const dynamic = "force-dynamic";

// Dashboard-only (login cookie, enforced by middleware).
export async function GET() {
  if (!configured.db()) return notConfigured();
  try { return Response.json({ tokens: await listApiTokens() }); } catch (e) { return errorResponse(e, "GET /api/tokens"); }
}

export async function POST(req: Request) {
  if (!configured.db()) return notConfigured();
  if (!configured.auth()) return Response.json({ error: "Set OMNIPOST_ADMIN_PASSWORD and OMNIPOST_SECRET first, so API tokens can only be created by you." }, { status: 503 });
  try {
    const { name } = z.object({ name: z.string().max(80).default("API token") }).parse(await req.json().catch(() => ({})));
    return Response.json(await createApiToken(name), { status: 201 });
  } catch (e) { return errorResponse(e, "POST /api/tokens"); }
}
