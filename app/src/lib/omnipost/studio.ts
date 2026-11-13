/**
 * Pure helpers behind the AI Content Studio editor. Kept separate from the untyped view model
 * so they can be unit-tested.
 */

export const STUDIO_TONES = ["Authoritative", "Friendly", "Casual", "Professional", "Witty", "Inspirational", "Educational"] as const;
export const STUDIO_LANGUAGES = ["English", "Bangla", "Hindi", "Spanish", "French", "German", "Arabic"] as const;

/**
 * Shortens a caption so it fits `limit` characters. Prefers dropping whole paragraphs, then whole
 * sentences, and only cuts mid-word (with an ellipsis) as a last resort. Text that already fits
 * is returned unchanged.
 */
export function shortenToLimit(text: string, limit: number): string {
  const clean = text.trim();
  if (clean.length <= limit) return clean;

  const paragraphs = clean.split(/\n{2,}/);
  while (paragraphs.length > 1 && paragraphs.join("\n\n").length > limit) paragraphs.pop();
  let out = paragraphs.join("\n\n");
  if (out.length <= limit) return out;

  const sentences = out.match(/[^.!?]+[.!?]+(\s+|$)|[^.!?]+$/g) ?? [out];
  while (sentences.length > 1 && sentences.join("").trim().length > limit) sentences.pop();
  out = sentences.join("").trim();
  if (out.length <= limit) return out;

  const cut = out.slice(0, Math.max(0, limit - 1));
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > limit * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd() + "…";
}

/** Turns free text ("ai, #WordPress  webdev") into a de-duplicated list of `#tags`. */
export function parseHashtags(input: string): string[] {
  const seen = new Set<string>();
  const tags: string[] = [];
  for (const raw of input.split(/[\s,]+/)) {
    const word = raw.replace(/^#+/, "").replace(/[^\p{L}\p{N}_]/gu, "");
    if (!word) continue;
    const key = word.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    tags.push("#" + word);
  }
  return tags;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** `2027-01-15`, `10:00`, `Asia/Dhaka` → `Jan 15, 2027 · 10:00 · Asia/Dhaka`. */
export function formatSchedule(date: string, time: string, timezone: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!m) return "Not scheduled";
  const label = `${MONTHS[Number(m[2]) - 1]} ${Number(m[3])}, ${m[1]}`;
  return [label, time || "—", timezone].join(" · ");
}

/** Provider/model choices offered in the brief. Mirrors the AI adapters registered in `adapters/mock.ts`. */
export const STUDIO_MODELS: { provider: string; model: string; label: string }[] = [
  { provider: "anthropic", model: "claude-sonnet-4-5", label: "Claude · Sonnet 4.5" },
  { provider: "anthropic", model: "claude-opus-4-1", label: "Claude · Opus 4.1" },
  { provider: "anthropic", model: "claude-haiku-4-5", label: "Claude · Haiku 4.5" },
  { provider: "openai", model: "gpt-4.1", label: "OpenAI · GPT-4.1" },
  { provider: "openai", model: "gpt-4o", label: "OpenAI · GPT-4o" },
  { provider: "gemini", model: "gemini-2.5-pro", label: "Gemini · 2.5 Pro" },
  { provider: "gemini", model: "gemini-2.5-flash", label: "Gemini · 2.5 Flash" },
  { provider: "openrouter", model: "anthropic/claude-sonnet-4.5", label: "OpenRouter · Claude Sonnet 4.5" },
];
