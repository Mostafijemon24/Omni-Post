/**
 * MCP server (Streamable HTTP, JSON responses, stateless). Implements the JSON-RPC methods
 * clients need: initialize, ping, tools/list, tools/call. Tools write into the same Supabase
 * tables the dashboard reads, so a draft sent from Claude or ChatGPT shows up under Drafts.
 */
import { z } from "zod";
import { CAPTION_LIMITS } from "@/lib/adapters/mock";
import { generateVariations, GenerateInput } from "./openrouter";
import { createPost, listPosts, schedulePost, PLATFORMS, STATUSES } from "./posts";

export const SUPPORTED_VERSIONS = ["2025-06-18", "2025-03-26", "2024-11-05"];
export const SERVER_INFO = { name: "omnipost", title: "OmniPost AI", version: "0.2.0" };

type Ctx = { clientName: string };
type Tool = { name: string; title: string; description: string; inputSchema: object; annotations?: object; run: (args: unknown, ctx: Ctx) => Promise<unknown> };

const platformEnum = { type: "string", enum: [...PLATFORMS] };

const DraftArgs = z.object({
  platform: z.enum(PLATFORMS), caption: z.string(), title: z.string().optional(), headline: z.string().optional(),
  hashtags: z.array(z.string()).optional(), cta: z.string().optional(), image_alt: z.string().optional(), account: z.string().optional(),
});

export const TOOLS: Tool[] = [
  {
    name: "create_post_draft",
    title: "Create post draft",
    description: "Save a social media post to OmniPost as a draft for review. One call per platform. Nothing is published.",
    inputSchema: {
      type: "object", required: ["platform", "caption"],
      properties: {
        platform: platformEnum, caption: { type: "string", description: "Post text, within the platform's character limit" },
        title: { type: "string", description: "Internal title shown in the dashboard" }, headline: { type: "string" },
        hashtags: { type: "array", items: { type: "string" } }, cta: { type: "string", description: "Call to action" },
        image_alt: { type: "string", description: "Alt text for the post image" }, account: { type: "string", description: "Target account or page name" },
      },
    },
    annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
    run: async (args, ctx) => {
      const a = DraftArgs.parse(args);
      const post = await createPost({ ...a, status: "draft" }, `MCP · ${ctx.clientName}`);
      return { id: post.id, status: post.status, platform: post.platform, message: "Draft saved in OmniPost → Drafts." };
    },
  },
  {
    name: "schedule_post",
    title: "Schedule a post",
    description: "Schedule an existing OmniPost post for a date and time (ISO 8601 with offset, e.g. 2027-01-15T10:00:00+06:00).",
    inputSchema: { type: "object", required: ["post_id", "scheduled_at"], properties: { post_id: { type: "string" }, scheduled_at: { type: "string" }, timezone: { type: "string", description: "IANA zone, e.g. Asia/Dhaka" } } },
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    run: async (args) => {
      const a = z.object({ post_id: z.string(), scheduled_at: z.string(), timezone: z.string().optional() }).parse(args);
      const p = await schedulePost(a.post_id, a.scheduled_at, a.timezone);
      return { id: p.id, status: p.status, scheduled_at: p.scheduled_at };
    },
  },
  {
    name: "list_posts",
    title: "List posts",
    description: "List recent OmniPost posts, optionally filtered by status.",
    inputSchema: { type: "object", properties: { status: { type: "string", enum: [...STATUSES] }, limit: { type: "integer", minimum: 1, maximum: 50 } } },
    annotations: { readOnlyHint: true, openWorldHint: false },
    run: async (args) => {
      const a = z.object({ status: z.enum(STATUSES).optional(), limit: z.number().int().min(1).max(50).optional() }).parse(args ?? {});
      const posts = await listPosts({ status: a.status, limit: a.limit ?? 20 });
      return posts.map((p) => ({ id: p.id, title: p.title, platform: p.platform, status: p.status, scheduled_at: p.scheduled_at, source: p.source, caption: p.caption.slice(0, 200) }));
    },
  },
  {
    name: "generate_platform_variations",
    title: "Generate platform variations",
    description: "Use OmniPost's configured AI model (via OpenRouter) to write one post per platform for a topic. Set save=true to store each as a draft.",
    inputSchema: {
      type: "object", required: ["topic", "platforms"],
      properties: {
        topic: { type: "string" }, platforms: { type: "array", items: platformEnum }, tone: { type: "string" }, language: { type: "string" },
        keyword: { type: "string", description: "SEO focus keyword" }, save: { type: "boolean", description: "Save each variation as a draft" },
      },
    },
    annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: true },
    run: async (args, ctx) => {
      const a = GenerateInput.extend({ save: z.boolean().optional() }).parse(args);
      const { model, variations } = await generateVariations(a);
      const saved = a.save
        ? await Promise.all(variations.map((v) => createPost({ platform: v.platform, title: v.headline || a.topic, headline: v.headline, caption: v.caption, hashtags: v.hashtags, cta: v.cta, image_alt: v.image_alt, status: "draft" }, `MCP · ${ctx.clientName}`)))
        : [];
      return { model, variations, saved_ids: saved.map((p) => p.id) };
    },
  },
  {
    name: "get_caption_limits",
    title: "Get caption limits",
    description: "Character limits OmniPost enforces per platform.",
    inputSchema: { type: "object", properties: {} },
    annotations: { readOnlyHint: true, openWorldHint: false },
    run: async () => CAPTION_LIMITS,
  },
];

type RpcRequest = { jsonrpc: "2.0"; id?: string | number | null; method: string; params?: Record<string, unknown> };
type RpcResponse = { jsonrpc: "2.0"; id: string | number | null; result?: unknown; error?: { code: number; message: string } };

const ok = (id: RpcRequest["id"], result: unknown): RpcResponse => ({ jsonrpc: "2.0", id: id ?? null, result });
const err = (id: RpcRequest["id"], code: number, message: string): RpcResponse => ({ jsonrpc: "2.0", id: id ?? null, error: { code, message } });

/** Handles one JSON-RPC message. Returns null for notifications (no response body). */
export async function handleRpc(msg: unknown, ctx: Ctx): Promise<RpcResponse | null> {
  const m = msg as RpcRequest;
  if (!m || m.jsonrpc !== "2.0" || typeof m.method !== "string") return err(null, -32600, "Invalid Request");
  const isNotification = m.id === undefined;
  if (isNotification) return null;

  switch (m.method) {
    case "initialize": {
      const requested = String(m.params?.protocolVersion ?? "");
      return ok(m.id, {
        protocolVersion: SUPPORTED_VERSIONS.includes(requested) ? requested : SUPPORTED_VERSIONS[0],
        capabilities: { tools: { listChanged: false } },
        serverInfo: SERVER_INFO,
        instructions: "OmniPost AI stores social media drafts and schedules. Use create_post_draft to hand a finished post to OmniPost; nothing is published without the owner's review.",
      });
    }
    case "ping":
      return ok(m.id, {});
    case "tools/list":
      return ok(m.id, { tools: TOOLS.map(({ run: _run, ...t }) => t) });
    case "tools/call": {
      const tool = TOOLS.find((t) => t.name === m.params?.name);
      if (!tool) return err(m.id, -32602, `Unknown tool: ${String(m.params?.name)}`);
      try {
        const out = await tool.run(m.params?.arguments ?? {}, ctx);
        return ok(m.id, { content: [{ type: "text", text: JSON.stringify(out, null, 2) }], structuredContent: Array.isArray(out) ? { items: out } : out, isError: false });
      } catch (e) {
        const message = e instanceof z.ZodError ? "Invalid arguments: " + e.issues.map((i) => `${i.path.join(".") || "input"}: ${i.message}`).join("; ") : e instanceof Error ? e.message : String(e);
        return ok(m.id, { content: [{ type: "text", text: message }], isError: true });
      }
    }
    default:
      return err(m.id, -32601, `Method not found: ${m.method}`);
  }
}
