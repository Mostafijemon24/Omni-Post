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
/** `openrouter` is the model slug sent to OpenRouter when the backend is configured. */
export const STUDIO_MODELS: { provider: string; model: string; openrouter: string; label: string }[] = [
  { provider: "anthropic", model: "claude-sonnet-4-5", openrouter: "anthropic/claude-sonnet-4.5", label: "Claude · Sonnet 4.5" },
  { provider: "anthropic", model: "claude-opus-4-1", openrouter: "anthropic/claude-opus-4.1", label: "Claude · Opus 4.1" },
  { provider: "anthropic", model: "claude-haiku-4-5", openrouter: "anthropic/claude-haiku-4.5", label: "Claude · Haiku 4.5" },
  { provider: "openai", model: "gpt-4.1", openrouter: "openai/gpt-4.1", label: "OpenAI · GPT-4.1" },
  { provider: "openai", model: "gpt-4o", openrouter: "openai/gpt-4o", label: "OpenAI · GPT-4o" },
  { provider: "gemini", model: "gemini-2.5-pro", openrouter: "google/gemini-2.5-pro", label: "Gemini · 2.5 Pro" },
  { provider: "gemini", model: "gemini-2.5-flash", openrouter: "google/gemini-2.5-flash", label: "Gemini · 2.5 Flash" },
];

/** Offset (minutes) of `timeZone` from UTC at the given instant. */
function tzOffsetMinutes(instant: number, timeZone: string): number {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", { timeZone, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" })
      .formatToParts(new Date(instant)).map((p) => [p.type, p.value]),
  );
  const asUtc = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute, +parts.second);
  return Math.round((asUtc - instant) / 60000);
}

/** Wall-clock date + time in an IANA zone → ISO 8601 with offset, e.g. `2027-01-15T10:00:00+06:00`. */
export function zonedToIso(date: string, time: string, timeZone: string): string {
  const [y, mo, d] = date.split("-").map(Number);
  const [h, mi] = (time || "00:00").split(":").map(Number);
  const wall = Date.UTC(y, mo - 1, d, h, mi);
  let off = tzOffsetMinutes(wall, timeZone);
  off = tzOffsetMinutes(wall - off * 60000, timeZone); // second pass settles DST edges
  const sign = off >= 0 ? "+" : "-";
  const abs = Math.abs(off);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date}T${pad(h)}:${pad(mi)}:00${sign}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`;
}

/** ISO instant → `{ date: "2027-01-15", time: "10:00" }` as seen in `timeZone`. */
export function isoToZoned(iso: string, timeZone: string): { date: string; time: string } {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", { timeZone, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })
      .formatToParts(new Date(iso)).map((x) => [x.type, x.value]),
  );
  return { date: `${p.year}-${p.month}-${p.day}`, time: `${p.hour}:${p.minute}` };
}
