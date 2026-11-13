"use client";

import { ROUTES, type RouteId } from "@/lib/routes";
import { SCREENS } from "@/screens";
import { useOmni } from "./OmniProvider";

export function ScreenView({ route }: { route: RouteId }) {
  const v = useOmni();
  const Screen = SCREENS[ROUTES[route]];
  return <Screen v={v} />;
}
