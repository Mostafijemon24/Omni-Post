import { z } from "zod";
import { CAPTION_LIMITS } from "@/lib/adapters/mock";
import { getDb } from "./db";

export const PLATFORMS = ["facebook", "instagram", "linkedin", "x", "threads", "youtube", "tiktok", "pinterest", "reddit", "telegram"] as const;
export const STATUSES = ["draft", "scheduled", "approval", "published", "failed"] as const;

export const PostInput = z.object({
  title: z.string().trim().min(1).max(300).optional(),
  platform: z.enum(PLATFORMS),
  account: z.string().max(120).optional(),
  headline: z.string().max(300).optional(),
  caption: z.string().max(63206),
  hashtags: z.array(z.string().max(100)).max(30).optional(),
  cta: z.string().max(300).optional(),
  image_alt: z.string().max(1000).optional(),
  status: z.enum(["draft", "scheduled", "approval"]).default("draft"),
  scheduled_at: z.string().datetime({ offset: true }).optional(),
  timezone: z.string().max(64).optional(),
  source: z.string().max(80).optional(),
});
export type PostInput = z.input<typeof PostInput>;

export type Post = {
  id: string; title: string; platform: string; account: string | null; headline: string | null; caption: string;
  hashtags: string[]; cta: string | null; image_alt: string | null; status: string; scheduled_at: string | null;
  timezone: string | null; source: string; created_at: string;
};

export class PostError extends Error {}

export async function createPost(input: PostInput, source = "Content Studio"): Promise<Post> {
  const p = PostInput.parse(input);
  const limit = CAPTION_LIMITS[p.platform];
  if (p.caption.length > limit) throw new PostError(`Caption is ${p.caption.length} characters; the ${p.platform} limit is ${limit}.`);
  if (p.status === "scheduled" && !p.scheduled_at) throw new PostError("scheduled_at is required to schedule a post.");
  const row = await getDb().insert("posts", {
    title: p.title || p.headline || p.caption.slice(0, 80) || "Untitled post",
    platform: p.platform, account: p.account ?? null, headline: p.headline ?? null, caption: p.caption,
    hashtags: p.hashtags ?? [], cta: p.cta ?? null, image_alt: p.image_alt ?? null, status: p.status,
    scheduled_at: p.scheduled_at ?? null, timezone: p.timezone ?? null, source: p.source || source,
  });
  return row as unknown as Post;
}

export async function listPosts(opts: { status?: string; limit?: number } = {}): Promise<Post[]> {
  const filter = opts.status ? { status: opts.status } : undefined;
  return (await getDb().select("posts", filter, { order: "created_at.desc", limit: Math.min(opts.limit ?? 100, 500) })) as unknown as Post[];
}

export async function schedulePost(id: string, scheduledAt: string, timezone?: string): Promise<Post> {
  z.string().uuid().parse(id);
  z.string().datetime({ offset: true }).parse(scheduledAt);
  const rows = await getDb().update("posts", { id }, { status: "scheduled", scheduled_at: scheduledAt, timezone: timezone ?? null, updated_at: new Date().toISOString() });
  if (!rows.length) throw new PostError(`No post with id ${id}.`);
  return rows[0] as unknown as Post;
}
