import { z } from "zod";
import { configured } from "@/lib/server/env";
import { createPost, listPosts, PostError } from "@/lib/server/posts";
export const dynamic = "force-dynamic";

const notConfigured = () => Response.json({ error: "Database is not configured (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)." }, { status: 503 });

export async function GET(req: Request) {
  if (!configured.db()) return notConfigured();
  const status = new URL(req.url).searchParams.get("status") ?? undefined;
  try { return Response.json({ posts: await listPosts({ status, limit: 200 }) }); }
  catch (e) { console.error("GET /api/posts", e); return Response.json({ error: "Could not load posts." }, { status: 502 }); }
}

export async function POST(req: Request) {
  if (!configured.db()) return notConfigured();
  try {
    return Response.json({ post: await createPost(await req.json()) }, { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError) return Response.json({ error: e.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ") }, { status: 400 });
    if (e instanceof PostError) return Response.json({ error: e.message }, { status: 400 });
    console.error("POST /api/posts", e);
    return Response.json({ error: "Could not save the post." }, { status: 502 });
  }
}
