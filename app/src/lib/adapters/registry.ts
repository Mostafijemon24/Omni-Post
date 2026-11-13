import type { AIProvider, PlatformId, PublishingProvider, SocialConnector } from "./types";

/** Generic adapter registry: adapters self-describe, callers look them up by id. */
export class Registry<K extends string, T> {
  private items = new Map<K, T>();

  constructor(private readonly keyOf: (item: T) => K) {}

  register(item: T): this {
    const key = this.keyOf(item);
    if (this.items.has(key)) throw new Error(`Adapter "${key}" is already registered`);
    this.items.set(key, item);
    return this;
  }

  get(key: K): T {
    const item = this.items.get(key);
    if (!item) throw new Error(`No adapter registered for "${key}"`);
    return item;
  }

  has(key: K): boolean {
    return this.items.has(key);
  }

  list(): T[] {
    return [...this.items.values()];
  }
}

export const createAIRegistry = () => new Registry<string, AIProvider>((p) => p.id);
export const createConnectorRegistry = () => new Registry<PlatformId, SocialConnector>((c) => c.platform);
export const createPublishingRegistry = () => new Registry<string, PublishingProvider>((p) => p.id);

/** Routes able to carry a post for the given platform — the provider capability matrix. */
export function routesFor(registry: Registry<string, PublishingProvider>, platform: PlatformId): PublishingProvider[] {
  return registry.list().filter((p) => p.supports(platform));
}
