import { describe, expect, it } from "vitest";
import { contentPayloadSchema } from "@/lib/ingest/schema";

const base = {
  source: "n8n",
  content: { topic: "AI and the future of web development", base_caption: "Original content..." },
  platforms: ["facebook", "x"],
};

describe("content ingestion schema", () => {
  it("accepts the documented payload and defaults to draft", () => {
    const out = contentPayloadSchema.parse(base);
    expect(out.schedule).toEqual({ mode: "draft" });
    expect(out.content.language).toBe("English");
  });
  it("requires a timezone for scheduled posts", () => {
    const res = contentPayloadSchema.safeParse({ ...base, schedule: { mode: "scheduled", datetime: "2027-01-15T10:00:00" } });
    expect(res.success).toBe(false);
  });
  it("rejects unknown or duplicate platforms and non-https media", () => {
    expect(contentPayloadSchema.safeParse({ ...base, platforms: ["myspace"] }).success).toBe(false);
    expect(contentPayloadSchema.safeParse({ ...base, platforms: ["x", "x"] }).success).toBe(false);
    expect(contentPayloadSchema.safeParse({ ...base, content: { ...base.content, image_url: "http://example.com/a.png" } }).success).toBe(false);
  });
});
