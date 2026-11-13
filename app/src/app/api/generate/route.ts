import { z } from "zod";
import { AIError, generateVariations } from "@/lib/server/openrouter";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST(req: Request) {
  try {
    return Response.json(await generateVariations(await req.json()));
  } catch (e) {
    if (e instanceof z.ZodError) return Response.json({ error: e.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ") }, { status: 400 });
    if (e instanceof AIError) return Response.json({ error: e.message }, { status: e.status });
    console.error("POST /api/generate", e);
    return Response.json({ error: "Generation failed." }, { status: 502 });
  }
}
