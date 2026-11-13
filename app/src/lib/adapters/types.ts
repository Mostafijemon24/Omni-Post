/**
 * Provider-independent contracts for OmniPost's connector architecture.
 *
 * The UI and the publishing engine depend only on these interfaces. Each AI provider,
 * social platform and publishing route is an independent adapter registered in a
 * registry, so adding one never requires touching the screens or the engine.
 */

export type PlatformId =
  | "facebook" | "instagram" | "linkedin" | "x" | "youtube"
  | "tiktok" | "pinterest" | "threads" | "reddit" | "telegram";

export type ConnectionStatus = "connected" | "disconnected" | "error" | "auth_required";

/** Result envelope for every adapter call. `mock: true` must never be presented as a real success. */
export type AdapterResult<T> =
  | { ok: true; mock: boolean; data: T }
  | { ok: false; mock: boolean; error: { code: string; message: string; retryable: boolean } };

// ---------------------------------------------------------------- AI providers
export interface AICapabilities {
  text: boolean;
  structuredOutput: boolean;
  imageGeneration: boolean;
  modelDiscovery: boolean;
}

export interface ContentBrief {
  topic: string;
  focusKeyword?: string;
  relatedKeywords?: string[];
  tone?: string;
  language?: string;
  platforms: PlatformId[];
  instructions?: string;
}

export interface PlatformVariation {
  platform: PlatformId;
  headline: string;
  caption: string;
  callToAction: string;
  hashtags: string[];
  imageAltText: string;
}

export interface AIProvider {
  readonly id: string;
  readonly name: string;
  readonly capabilities: AICapabilities;
  validateConnection(): Promise<AdapterResult<{ latencyMs: number }>>;
  getAvailableModels(): Promise<AdapterResult<string[]>>;
  generateText(prompt: string, model?: string): Promise<AdapterResult<string>>;
  generateStructuredContent(brief: ContentBrief, model?: string): Promise<AdapterResult<PlatformVariation[]>>;
  generateImagePrompt(brief: ContentBrief): Promise<AdapterResult<string>>;
}

// ------------------------------------------------------------ Social connectors
export interface ConnectorCapabilities {
  text: boolean;
  image: boolean;
  video: boolean;
  carousel: boolean;
  nativeScheduling: boolean;
  immediatePublishing: boolean;
  mediaUpload: boolean;
  postStatus: boolean;
  analytics: boolean;
  /** Why a capability is unavailable, keyed by capability name — shown in the UI instead of a dead button. */
  unavailableReasons?: Partial<Record<Exclude<keyof ConnectorCapabilities, "unavailableReasons">, string>>;
}

export interface SocialAccount {
  id: string;
  platform: PlatformId;
  name: string;
  accountType: string;
  status: ConnectionStatus;
  routeId: string;
}

export interface PlatformPost {
  id: string;
  accountId: string;
  platform: PlatformId;
  caption: string;
  title?: string;
  hashtags: string[];
  mediaIds: string[];
  scheduledAt?: string;
  timezone?: string;
  /** Stable key so a retried publish can never create a duplicate post. */
  idempotencyKey: string;
}

export type PublishState = "queued" | "publishing" | "published" | "failed" | "unknown";

export interface PublishReceipt {
  state: PublishState;
  externalPostId?: string;
  publishedUrl?: string;
}

export interface SocialConnector {
  readonly platform: PlatformId;
  getCapabilities(accountType: string): ConnectorCapabilities;
  getAuthorizationUrl(state: string): string;
  getConnectedAccounts(): Promise<AdapterResult<SocialAccount[]>>;
  validateMedia(post: PlatformPost): AdapterResult<true>;
  publishPost(post: PlatformPost): Promise<AdapterResult<PublishReceipt>>;
  /** Checked before any retry of an uncertain publish. */
  getPostStatus(idempotencyKey: string): Promise<AdapterResult<PublishReceipt>>;
  disconnectAccount(accountId: string): Promise<AdapterResult<true>>;
}

// --------------------------------------------------------- Publishing providers
/** A route a platform post can travel: a direct official API or a third-party publishing provider. */
export interface PublishingProvider {
  readonly id: string;
  readonly name: string;
  readonly kind: "direct" | "third_party";
  supports(platform: PlatformId): boolean;
  publish(post: PlatformPost): Promise<AdapterResult<PublishReceipt>>;
}
