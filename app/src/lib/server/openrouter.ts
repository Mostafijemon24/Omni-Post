/** Content generation through OpenRouter (one key, many models). */
import { z } from "zod";
import { CAPTION_LIMITS } from "@/lib/adapters/mock";
import { env } from "./env";
import { PLATFORMS } from "./posts";

export const GenerateInput = z.object({
  topic: z.string().trim().min(3).max(500),
  platforms: z.array(z.enum(PLATFORMS)).min(1).max(10),
  tone: z.string().max(40).optional(),
  language: z.string().max(40).optional(),
  keyword: z.string().max(100).optional(),
  model: z.string().max(100).optional(),
  instructions: z.string().max(2000).optional(),
});
export type GenerateInput = z.input<typeof GenerateInput>;

const Variation = z.object({
  platform: z.enum(PLATFORMS),
  headline: z.string().default(""),
  caption: z.string(),
  hashtags: z.array(z.string()).default([]),
  cta: z.string().default(""),
  image_alt: z.string().default(""),
});
export type Variation = z.infer<typeof Variation>;

export class AIError extends Error {
  constructor(message: string, readonly status = 502) { super(message); }
}

export function buildPrompt(i: z.infer<typeof GenerateInput>): string {
  const limits = i.platforms.map((p) => `${p}: max ${CAPTION_LIMITS[p]} characters`).join("; ");
  return [
    `Write social media posts about: ${i.topic}`,
    `Platforms: ${i.platforms.join(", ")} (caption limits — ${limits}).`,
    `Tone: ${i.tone || "Authoritative"}. Language: ${i.language || "English"}.`,
    i.keyword ? `Focus keyword: "${i.keyword}" — use it naturally once in each caption.` : "",
    i.instructions ? `Extra instructions: ${i.instructions}` : "",
    "Adapt length, structure and hashtag count to each platform's norms. Hashtags start with #.",
    'Reply with JSON only: {"variations":[{"platform","headline","caption","hashtags":[],"cta","image_alt"}]} with one entry per platform.',
  ].filter(Boolean).join("\n");
}

export function parseVariations(content: string, platforms: readonly string[]): Variation[] {
  const json = content.replace(/^```(?:json)?\s*|\s*```$/g, "");
  let data: unknown;
  try { data = JSON.parse(json); } catch { throw new AIError("The model did not return valid JSON. Try again or pick another model."); }
  const list = z.object({ variations: z.array(Variation) }).safeParse(data);
  if (!list.success) throw new AIError("The model's reply did not match the expected format.");
  return list.data.variations
    .filter((v) => platforms.includes(v.platform))
    .map((v) => ({ ...v, hashtags: v.hashtags.map((t) => (t.startsWith("#") ? t : "#" + t)), caption: v.caption.slice(0, CAPTION_LIMITS[v.platform]) }));
}

export async function generateVariations(input: GenerateInput): Promise<{ model: string; variations: Variation[] }> {
  if (!env.openrouterKey) throw new AIError("OpenRouter is not configured (OPENROUTER_API_KEY).", 503);
  const i = GenerateInput.parse(input);
  const model = i.model || env.openrouterModel;
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${env.openrouterKey}`, "Content-Type": "application/json", "HTTP-Referer": env.baseUrl, "X-Title": "OmniPost AI" },
    body: JSON.stringify({
      model,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: "You are a senior social media copywriter. You reply with JSON only." },
        { role: "user", content: buildPrompt(i) },
      ],
    }),
    signal: AbortSignal.timeout(90_000),
  });
  if (!res.ok) {
    const detail = (await res.text()).slice(0, 300);
    throw new AIError(res.status === 401 ? "OpenRouter rejected the API key." : res.status === 402 ? "OpenRouter account has no credits for this model." : `OpenRouter error ${res.status}: ${detail}`);
  }
  const body = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const content = body.choices?.[0]?.message?.content;
  if (!content) throw new AIError("OpenRouter returned an empty reply.");
  return { model, variations: parseVariations(content, i.platforms) };
}
