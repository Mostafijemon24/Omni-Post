"use client";

import { createContext, useContext, useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { OmniPostLogic, type ViewModel } from "@/lib/omnipost/logic";
import { routeFromPath } from "@/lib/routes";
import { Shell } from "./Shell";

const OmniContext = createContext<ViewModel | null>(null);

export function useOmni(): ViewModel {
  const vm = useContext(OmniContext);
  if (!vm) throw new Error("useOmni must be used inside <OmniProvider>");
  return vm;
}

const THEME_KEY = "omnipost.theme";

export function OmniProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [logic] = useState(() => new OmniPostLogic());

  // The URL is the source of truth for the active screen.
  logic.state.route = routeFromPath(pathname);
  logic.navigate = (route) => router.push(`/${route}`);

  useSyncExternalStore(logic.subscribe, logic.getVersion, logic.getVersion);

  // Theme preference is the only thing persisted client-side (never credentials).
  useEffect(() => {
    try {
      if (window.localStorage.getItem(THEME_KEY) === "dark") logic.setState({ theme: "dark" });
    } catch {}
    return logic.subscribe(() => {
      try {
        window.localStorage.setItem(THEME_KEY, logic.state.theme);
      } catch {}
    });
  }, [logic]);

  useEffect(() => () => logic.componentWillUnmount(), [logic]);

  const vm = logic.renderVals();
  return (
    <OmniContext.Provider value={vm}>
      <Shell v={vm} route={logic.state.route}>
        {children}
      </Shell>
    </OmniContext.Provider>
  );
}
