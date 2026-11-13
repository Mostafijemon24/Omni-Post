import { describe, expect, it } from "vitest";
import { aiProviders, publishingProviders, socialConnectors, CAPTION_LIMITS } from "@/lib/adapters/mock";
import { Registry, routesFor } from "@/lib/adapters/registry";
import type { PlatformPost } from "@/lib/adapters/types";

const post = (over: Partial<PlatformPost> = {}): PlatformPost => ({
  id: "p1", accountId: "a1", platform: "x", caption: "hello", hashtags: [], mediaIds: [], idempotencyKey: "k1", ...over,
});

describe("registry", () => {
  it("rejects duplicate and unknown adapters", () => {
    const r = new Registry<string, { id: string }>((x) => x.id).register({ id: "a" });
    expect(() => r.register({ id: "a" })).toThrow(/already registered/);
    expect(() => r.get("b")).toThrow(/No adapter/);
  });
  it("builds the route matrix per platform", () => {
    expect(routesFor(publishingProviders, "tiktok").map((p) => p.id)).toEqual(["publishing-provider"]);
    expect(routesFor(publishingProviders, "facebook")).toHaveLength(2);
  });
});

describe("mock AI providers", () => {
  it("label every result as mock and respect capability detection", async () => {
    const claude = aiProviders.get("anthropic");
    expect(claude.capabilities.imageGeneration).toBe(false);
    const res = await claude.generateStructuredContent({ topic: "t", platforms: ["x", "linkedin"] });
    expect(res.mock).toBe(true);
    expect(res.ok && res.data.map((v) => v.platform)).toEqual(["x", "linkedin"]);
  });
});

describe("mock social connectors", () => {
  it("enforce platform restrictions before publishing", async () => {
    const x = socialConnectors.get("x");
    const long = await x.publishPost(post({ caption: "a".repeat(CAPTION_LIMITS.x + 1) }));
    expect(long.ok).toBe(false);
    const ig = await socialConnectors.get("instagram").publishPost(post({ platform: "instagram" }));
    expect(!ig.ok && ig.error.code).toBe("media_required");
  });
  it("publish idempotently and report status before a retry", async () => {
    const x = socialConnectors.get("x");
    expect((await x.getPostStatus("k-idem")).ok).toBe(true);
    const first = await x.publishPost(post({ idempotencyKey: "k-idem" }));
    const second = await x.publishPost(post({ id: "other", idempotencyKey: "k-idem" }));
    expect(first).toEqual(second);
    const status = await x.getPostStatus("k-idem");
    expect(status.ok && status.data.state).toBe("published");
    expect(first.mock).toBe(true);
  });
  it("refuse routes that do not support the platform", async () => {
    const res = await publishingProviders.get("direct").publish(post({ platform: "tiktok", mediaIds: ["m"] }));
    expect(!res.ok && res.error.code).toBe("route_unsupported");
  });
});
