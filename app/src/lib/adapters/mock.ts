/**
 * Clearly-labelled mock adapters for the prototype phase.
 * Every result carries `mock: true`; nothing here contacts a real provider or publishes anything.
 */
import { createAIRegistry, createConnectorRegistry, createPublishingRegistry } from "./registry";
import type {
  AdapterResult, AICapabilities, AIProvider, ConnectorCapabilities, ContentBrief, PlatformId,
  PlatformPost, PlatformVariation, PublishingProvider, PublishReceipt, SocialAccount, SocialConnector,
} from "./types";

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
const ok = <T>(data: T): AdapterResult<T> => ({ ok: true, mock: true, data });
const fail = <T>(code: string, message: string, retryable = false): AdapterResult<T> => ({ ok: false, mock: true, error: { code, message, retryable } });

/** Published per-platform caption limits; kept as data so they can change without code changes. */
export const CAPTION_LIMITS: Record<PlatformId, number> = {
  facebook: 63206, instagram: 2200, linkedin: 3000, x: 280, threads: 500,
  youtube: 5000, tiktok: 2200, pinterest: 500, reddit: 40000, telegram: 4096,
};

export class MockAIProvider implements AIProvider {
  constructor(
    readonly id: string,
    readonly name: string,
    readonly capabilities: AICapabilities,
    private readonly models: string[],
    private readonly latencyMs = 900,
  ) {}

  async validateConnection() {
    await wait(this.latencyMs);
    return ok({ latencyMs: this.latencyMs });
  }

  async getAvailableModels() {
    return this.capabilities.modelDiscovery ? ok(this.models) : fail<string[]>("unsupported", `${this.name} does not expose model discovery`);
  }

  async generateText(prompt: string) {
    await wait(this.latencyMs);
    return ok(`[mock:${this.id}] ${prompt.slice(0, 120)}`);
  }

  async generateStructuredContent(brief: ContentBrief) {
    if (!this.capabilities.structuredOutput) return fail<PlatformVariation[]>("unsupported", `${this.name} does not support structured output`);
    await wait(this.latencyMs + 500);
    return ok(
      brief.platforms.map((platform): PlatformVariation => ({
        platform,
        headline: brief.topic,
        caption: `[mock:${this.id}] ${brief.topic}`.slice(0, CAPTION_LIMITS[platform]),
        callToAction: "",
        hashtags: (brief.relatedKeywords ?? []).map((k) => "#" + k.replace(/\s+/g, "")),
        imageAltText: brief.topic,
      })),
    );
  }

  async generateImagePrompt(brief: ContentBrief) {
    return ok(`Editorial illustration for: ${brief.topic}`);
  }
}

const NOT_VIA_API = "Not available through this platform's publishing API";

const CAPS: Record<PlatformId, ConnectorCapabilities> = {
  facebook: { text: true, image: true, video: true, carousel: true, nativeScheduling: true, immediatePublishing: true, mediaUpload: true, postStatus: true, analytics: true },
  instagram: { text: false, image: true, video: true, carousel: true, nativeScheduling: false, immediatePublishing: true, mediaUpload: true, postStatus: true, analytics: true, unavailableReasons: { text: "Instagram posts require media", nativeScheduling: NOT_VIA_API } },
  linkedin: { text: true, image: true, video: true, carousel: false, nativeScheduling: false, immediatePublishing: true, mediaUpload: true, postStatus: true, analytics: false, unavailableReasons: { carousel: NOT_VIA_API, nativeScheduling: NOT_VIA_API } },
  x: { text: true, image: true, video: true, carousel: false, nativeScheduling: false, immediatePublishing: true, mediaUpload: true, postStatus: true, analytics: false, unavailableReasons: { nativeScheduling: NOT_VIA_API } },
  threads: { text: true, image: true, video: true, carousel: true, nativeScheduling: false, immediatePublishing: true, mediaUpload: true, postStatus: true, analytics: false },
  youtube: { text: false, image: false, video: true, carousel: false, nativeScheduling: true, immediatePublishing: true, mediaUpload: true, postStatus: true, analytics: true, unavailableReasons: { text: "YouTube uploads require a video" } },
  tiktok: { text: false, image: true, video: true, carousel: false, nativeScheduling: false, immediatePublishing: true, mediaUpload: true, postStatus: true, analytics: false },
  pinterest: { text: false, image: true, video: true, carousel: false, nativeScheduling: false, immediatePublishing: true, mediaUpload: true, postStatus: true, analytics: false },
  reddit: { text: true, image: true, video: false, carousel: false, nativeScheduling: false, immediatePublishing: true, mediaUpload: true, postStatus: true, analytics: false },
  telegram: { text: true, image: true, video: true, carousel: true, nativeScheduling: false, immediatePublishing: true, mediaUpload: true, postStatus: true, analytics: false },
};

export class MockSocialConnector implements SocialConnector {
  private receipts = new Map<string, PublishReceipt>();

  constructor(readonly platform: PlatformId, private accounts: SocialAccount[] = []) {}

  getCapabilities(): ConnectorCapabilities {
    return CAPS[this.platform];
  }

  getAuthorizationUrl(state: string) {
    return `https://mock.omnipost.local/oauth/${this.platform}?state=${encodeURIComponent(state)}`;
  }

  async getConnectedAccounts() {
    return ok(this.accounts);
  }

  validateMedia(post: PlatformPost) {
    const caps = this.getCapabilities();
    if (post.caption.length > CAPTION_LIMITS[this.platform]) return fail<true>("caption_too_long", `Caption exceeds the ${CAPTION_LIMITS[this.platform]} character limit`);
    if (!caps.text && post.mediaIds.length === 0) return fail<true>("media_required", caps.unavailableReasons?.text ?? "This platform requires media");
    if (post.mediaIds.length > 1 && !caps.carousel) return fail<true>("carousel_unsupported", caps.unavailableReasons?.carousel ?? "Carousels are not supported");
    return ok(true as const);
  }

  /** Simulated publish. Idempotent: the same key always resolves to the same receipt. */
  async publishPost(post: PlatformPost) {
    const valid = this.validateMedia(post);
    if (!valid.ok) return valid;
    const existing = this.receipts.get(post.idempotencyKey);
    if (existing) return ok(existing);
    await wait(50);
    const receipt: PublishReceipt = { state: "published", externalPostId: `mock_${this.platform}_${post.id}` };
    this.receipts.set(post.idempotencyKey, receipt);
    return ok(receipt);
  }

  async getPostStatus(idempotencyKey: string) {
    return ok<PublishReceipt>(this.receipts.get(idempotencyKey) ?? { state: "unknown" });
  }

  async disconnectAccount(accountId: string) {
    this.accounts = this.accounts.filter((a) => a.id !== accountId);
    return ok(true as const);
  }
}

export class MockPublishingProvider implements PublishingProvider {
  constructor(
    readonly id: string,
    readonly name: string,
    readonly kind: "direct" | "third_party",
    private readonly platforms: PlatformId[],
    private readonly connectors: { get(p: PlatformId): SocialConnector },
  ) {}

  supports(platform: PlatformId) {
    return this.platforms.includes(platform);
  }

  async publish(post: PlatformPost) {
    if (!this.supports(post.platform)) return fail<PublishReceipt>("route_unsupported", `${this.name} cannot publish to ${post.platform}`);
    return this.connectors.get(post.platform).publishPost(post);
  }
}

const FULL: AICapabilities = { text: true, structuredOutput: true, imageGeneration: true, modelDiscovery: true };
const TEXT_ONLY: AICapabilities = { ...FULL, imageGeneration: false };

export const aiProviders = createAIRegistry()
  .register(new MockAIProvider("openai", "OpenAI", FULL, ["gpt-4.1", "gpt-4o", "o3", "o4-mini"]))
  .register(new MockAIProvider("anthropic", "Anthropic Claude", TEXT_ONLY, ["claude-sonnet-4-5", "claude-opus-4-1", "claude-haiku-4-5"]))
  .register(new MockAIProvider("gemini", "Google Gemini", FULL, ["gemini-2.5-pro", "gemini-2.5-flash"]))
  .register(new MockAIProvider("openrouter", "OpenRouter", TEXT_ONLY, ["anthropic/claude-sonnet-4.5", "openai/gpt-4.1", "meta-llama/llama-4-maverick"]));

export const socialConnectors = createConnectorRegistry();
(Object.keys(CAPS) as PlatformId[]).forEach((p) => socialConnectors.register(new MockSocialConnector(p)));

export const publishingProviders = createPublishingRegistry()
  .register(new MockPublishingProvider("direct", "Direct official APIs", "direct", ["facebook", "instagram", "linkedin", "x", "threads", "youtube", "pinterest", "reddit", "telegram"], socialConnectors))
  .register(new MockPublishingProvider("publishing-provider", "Publishing provider", "third_party", ["facebook", "instagram", "linkedin", "x", "tiktok", "pinterest"], socialConnectors));

export const DEFAULT_AI_PROVIDER = "anthropic";
