import { env } from "@/lib/server/env";
import { PLATFORMS, STATUSES } from "@/lib/server/posts";
export const dynamic = "force-dynamic";

const platform = { type: "string", enum: [...PLATFORMS] };
const post = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" }, title: { type: "string" }, platform, account: { type: "string" }, headline: { type: "string" },
    caption: { type: "string" }, hashtags: { type: "array", items: { type: "string" } }, cta: { type: "string" }, image_alt: { type: "string" },
    status: { type: "string", enum: [...STATUSES] }, scheduled_at: { type: "string", format: "date-time" }, timezone: { type: "string" },
    source: { type: "string" }, published_url: { type: "string" }, published_at: { type: "string", format: "date-time" }, last_error: { type: "string" },
  },
};
const json = (schema: object) => ({ content: { "application/json": { schema } } });

/** Public OpenAPI 3.1 description of /api/v1 (no secrets in it). */
export const GET = () => Response.json({
  openapi: "3.1.0",
  info: { title: "OmniPost AI API", version: "1.0.0", description: "Draft-first social media API. Authenticate with an API token from Integrations → REST API." },
  servers: [{ url: env.baseUrl }],
  components: { securitySchemes: { token: { type: "http", scheme: "bearer" } }, schemas: { Post: post } },
  security: [{ token: [] }],
  paths: {
    "/api/v1/posts": {
      get: { operationId: "listPosts", summary: "List posts", parameters: [{ name: "status", in: "query", schema: { type: "string", enum: [...STATUSES] } }, { name: "limit", in: "query", schema: { type: "integer", maximum: 500 } }], responses: { 200: json({ type: "array", items: { $ref: "#/components/schemas/Post" } }) } },
      post: { operationId: "createPost", summary: "Create a draft or scheduled post", requestBody: { required: true, ...json({ type: "object", required: ["platform", "caption"], properties: { platform, caption: { type: "string" }, title: { type: "string" }, headline: { type: "string" }, hashtags: { type: "array", items: { type: "string" } }, cta: { type: "string" }, image_alt: { type: "string" }, status: { type: "string", enum: ["draft", "scheduled", "approval"] }, scheduled_at: { type: "string", format: "date-time" }, timezone: { type: "string" } } }) }, responses: { 201: json({ $ref: "#/components/schemas/Post" }) } },
    },
    "/api/v1/posts/due": { get: { operationId: "duePosts", summary: "Scheduled posts whose time has come", responses: { 200: json({ type: "array", items: { $ref: "#/components/schemas/Post" } }) } } },
    "/api/v1/posts/{id}": { patch: { operationId: "updatePost", summary: "Mark published/failed, reschedule or edit", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], requestBody: { required: true, ...json({ type: "object", properties: { status: { type: "string", enum: [...STATUSES] }, published_url: { type: "string" }, last_error: { type: "string" }, scheduled_at: { type: "string", format: "date-time" }, caption: { type: "string" } } }) }, responses: { 200: json({ $ref: "#/components/schemas/Post" }) } } },
    "/api/v1/generate": { post: { operationId: "generate", summary: "Write per-platform posts with OpenRouter", requestBody: { required: true, ...json({ type: "object", required: ["topic", "platforms"], properties: { topic: { type: "string" }, platforms: { type: "array", items: platform }, tone: { type: "string" }, language: { type: "string" }, keyword: { type: "string" }, model: { type: "string", description: "OpenRouter model slug, e.g. one ending in :free" }, save: { type: "string", enum: ["draft", "scheduled"] }, scheduled_at: { type: "string", format: "date-time" }, timezone: { type: "string" } } }) }, responses: { 200: json({ type: "object" }) } } },
  },
}, { headers: { "Access-Control-Allow-Origin": "*" } });
