"use client";

import { useSyncExternalStore } from "react";

/** Subscribe to a CSS media query (client-only; returns `fallback` on the server). */
export function useMediaQuery(query: string, fallback = false): boolean {
  return useSyncExternalStore(
    (cb) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", cb);
      return () => mql.removeEventListener("change", cb);
    },
    () => window.matchMedia(query).matches,
    () => fallback,
  );
}

export type StudioLayout = "desktop" | "tablet" | "mobile";

/** desktop ≥ 1280px (three zones), tablet ≥ 768px (stage + tabbed panel), else mobile. */
export function useStudioLayout(): StudioLayout {
  const desktop = useMediaQuery("(min-width: 1280px)", true);
  const tablet = useMediaQuery("(min-width: 768px)", true);
  return desktop ? "desktop" : tablet ? "tablet" : "mobile";
}
