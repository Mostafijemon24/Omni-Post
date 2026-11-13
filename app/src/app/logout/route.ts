import { SESSION_COOKIE } from "@/lib/server/session";
export const dynamic = "force-dynamic";
export const POST = () => new Response(null, { status: 303, headers: { Location: "/login", "Set-Cookie": `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0` } });
