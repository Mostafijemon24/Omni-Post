import { z } from "zod";

/**
 * Validated contract for the universal content ingestion API (`POST /api/v1/content`).
 * Every source — MCP, REST, webhooks, n8n, file imports, the internal studio — submits this
 * shape, so all content enters the same draft → approval → schedule → publish pipeline.
 */
export const PLATFORMS = ["facebook", "instagram", "linkedin", "x", "youtube", "tiktok", "pinterest", "threads", "reddit", "telegram"] as const;

export const contentPayloadSchema = z.object({
  source: z.string().min(1).max(64),
  content: z.object({
    topic: z.string().min(1).max(300),
    base_caption: z.string().min(1).max(63206),
    language: z.string().max(40).default("English"),
    focus_keyword: z.string().max(120).optional(),
    related_keywords: z.array(z.string().max(80)).max(30).default([]),
    image_url: z.string().url().refine((u) => u.startsWith("https://"), "image_url must be https").optional(),
  }),
  platforms: z.array(z.enum(PLATFORMS)).min(1).refine((p) => new Set(p).size === p.length, "platforms must be unique"),
  schedule: z
    .discriminatedUnion("mode", [
      z.object({ mode: z.literal("draft") }),
      z.object({ mode: z.literal("immediate") }),
      z.object({
        mode: z.literal("scheduled"),
        datetime: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/, "datetime must be ISO local time, e.g. 2027-01-15T10:00:00"),
        timezone: z.string().min(1),
      }),
    ])
    .default({ mode: "draft" }),
});

export type ContentPayload = z.infer<typeof contentPayloadSchema>;
