"use client";

import { create } from "zustand";

/**
 * Studio-only motion preference: when `animations` is off, the live stage
 * renders without any CSS animation or transition (message entrances, typing
 * dots, receipt fades…), so the user can inspect the result as a still.
 * Video export is unaffected — it has its own options.
 */
const KEY = "scenora.preview.motion";

interface PreviewMotionStore {
  animations: boolean;
  hydrated: boolean;
  hydrate: () => void;
  setAnimations: (on: boolean) => void;
}

export const usePreviewMotion = create<PreviewMotionStore>((set, get) => ({
  animations: true,
  hydrated: false,
  hydrate: () => {
    if (get().hydrated) return;
    let animations = true;
    try {
      const raw = window.localStorage.getItem(KEY);
      if (raw) animations = (JSON.parse(raw) as { animations?: unknown }).animations !== false;
    } catch {
      /* private mode */
    }
    set({ animations, hydrated: true });
  },
  setAnimations: (animations) => {
    set({ animations });
    try {
      window.localStorage.setItem(KEY, JSON.stringify({ animations }));
    } catch {
      /* private mode / quota */
    }
  },
}));
