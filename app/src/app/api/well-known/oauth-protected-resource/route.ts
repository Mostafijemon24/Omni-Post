import { protectedResourceMetadata } from "@/lib/server/oauth";
export const dynamic = "force-dynamic";
export const GET = () => Response.json(protectedResourceMetadata(), { headers: { "Access-Control-Allow-Origin": "*" } });
