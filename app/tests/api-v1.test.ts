import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createApiToken, listApiTokens, revokeApiToken, verifyApiToken } from "@/lib/server/apiTokens";
import { MemoryDb, setDb } from "@/lib/server/db";
import { createPost, duePosts, updatePost } from "@/lib/server/posts";

let db: MemoryDb;
beforeEach(() => { db = new MemoryDb(); setDb(db); });
afterEach(() => setDb(null));

describe("API tokens", () => {
  it("creates, verifies, lists without secrets, and revokes", async () => {
    const t = await createApiToken("n8n");
    expect(t.token).toMatch(/^opk_/);
    expect(await verifyApiToken(t.token)).toBe("n8n");
    expect(await verifyApiToken("opk_wrong")).toBeNull();
    expect(JSON.stringify(await listApiTokens())).not.toContain(t.token);
    await revokeApiToken(t.id);
    expect(await verifyApiToken(t.token)).toBeNull();
  });
});

describe("publishing loop for automations", () => {
  it("returns only scheduled posts that are due, oldest first", async () => {
    const now = Date.parse("2027-01-15T10:00:00Z");
    await createPost({ platform: "x", caption: "later", status: "scheduled", scheduled_at: "2027-01-15T11:00:00Z" });
    await createPost({ platform: "x", caption: "second", status: "scheduled", scheduled_at: "2027-01-15T09:30:00Z" });
    await createPost({ platform: "x", caption: "first", status: "scheduled", scheduled_at: "2027-01-15T09:00:00Z" });
    await createPost({ platform: "x", caption: "draft" });
    expect((await duePosts(now)).map((p) => p.caption)).toEqual(["first", "second"]);
  });

  it("marks published with URL and timestamp, clears errors", async () => {
    const p = await createPost({ platform: "linkedin", caption: "hi", status: "scheduled", scheduled_at: "2027-01-15T09:00:00Z" });
    await updatePost(p.id, { status: "failed", last_error: "token expired" });
    const done = await updatePost(p.id, { status: "published", published_url: "https://linkedin.com/feed/update/1" });
    expect(done).toMatchObject({ status: "published", published_url: "https://linkedin.com/feed/update/1", last_error: null });
    expect(done.published_at).toBeTruthy();
  });

  it("rejects unknown fields and unknown ids", async () => {
    const p = await createPost({ platform: "x", caption: "hi" });
    await expect(updatePost(p.id, { id: "x" } as never)).rejects.toThrow();
    await expect(updatePost("00000000-0000-4000-8000-000000000000", { status: "published" })).rejects.toThrow(/No post/);
  });

  it("will not schedule without a time", async () => {
    const p = await createPost({ platform: "x", caption: "hi" });
    await expect(updatePost(p.id, { status: "scheduled" })).rejects.toThrow(/scheduled_at/);
  });
});
