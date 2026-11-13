import { z } from "zod";
import { requireApiToken } from "@/lib/server/apiTokens";
import { configured } from "@/lib/server/env";
import { generateVariations, GenerateInput } from "@/lib/server/openrouter";
import { createPost } from "@/lib/server/posts";
import { errorResponse } from "@/lib/server/respond";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

/**
 * POST /api/v1/generate — write one post per platform with OpenRouter.
 * Body: {topic, platforms[], tone?, language?, keyword?, model?, save?: "draft"|"scheduled", scheduled_at?, timezone?}
 */
export async function POST(req: Request) {
  if (!configured.db()) return Response.json({ error: "Database is not configured on the server." }, { status: 503 });
  const who = await requireApiToken(req);
  if (who instanceof Response) return who;
  try {
    const body = GenerateInput.extend({
      save: z.enum(["draft", "scheduled"]).optional(),
      scheduled_at: z.string().datetime({ offset: true }).optional(),
      timezone: z.string().max(64).optional(),
    }).parse(await req.json());
    const { model, variations } = await generateVariations(body);
    const saved = body.save
      ? await Promise.all(variations.map((v) => createPost({
          platform: v.platform, title: v.headline || body.topic, headline: v.headline, caption: v.caption, hashtags: v.hashtags,
          cta: v.cta, image_alt: v.image_alt, status: body.save, scheduled_at: body.scheduled_at, timezone: body.timezone,
        }, who)))
      : [];
    return Response.json({ model, variations, saved });
  } catch (e) { return errorResponse(e, "POST /api/v1/generate"); }
}
