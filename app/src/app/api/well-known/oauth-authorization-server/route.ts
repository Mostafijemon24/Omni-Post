import { authServerMetadata } from "@/lib/server/oauth";
export const dynamic = "force-dynamic";
export const GET = () => Response.json(authServerMetadata(), { headers: { "Access-Control-Allow-Origin": "*" } });
