import { z } from "zod";
import { AIError } from "./openrouter";
import { PostError } from "./posts";

/** Maps known errors to JSON responses; anything else is logged and hidden. */
export function errorResponse(e: unknown, where: string): Response {
  if (e instanceof z.ZodError) return Response.json({ error: e.issues.map((i) => `${i.path.join(".") || "body"}: ${i.message}`).join("; ") }, { status: 400 });
  if (e instanceof PostError) return Response.json({ error: e.message }, { status: e.message.startsWith("No post") ? 404 : 400 });
  if (e instanceof AIError) return Response.json({ error: e.message }, { status: e.status });
  if (e instanceof SyntaxError) return Response.json({ error: "Body must be valid JSON." }, { status: 400 });
  console.error(where, e);
  return Response.json({ error: "Internal error." }, { status: 500 });
}

export const notConfigured = () => Response.json({ error: "Database is not configured on the server." }, { status: 503 });
