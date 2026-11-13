import type { ScreenKey } from "@/screens";

/** Every navigable route and the screen that renders it. */
export const ROUTES = {
  dashboard: "dashboard",
  studio: "studio",
  image: "image",
  planner: "planner",
  calendar: "calendar",
  posts: "posts",
  scheduled: "posts",
  published: "posts",
  drafts: "posts",
  media: "media",
  accounts: "accounts",
  providers: "providers",
  integrations: "integrations",
  automation: "automation",
  logs: "logs",
  analytics: "analytics",
  settings: "settings",
  architecture: "architecture",
} as const satisfies Record<string, ScreenKey>;

export type RouteId = keyof typeof ROUTES;

export const isRoute = (value: string): value is RouteId => Object.hasOwn(ROUTES, value);

export function routeFromPath(pathname: string | null): RouteId {
  const seg = (pathname ?? "").split("/").filter(Boolean)[0] ?? "";
  return isRoute(seg) ? seg : "dashboard";
}
