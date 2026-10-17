"use client";

import { create } from "zustand";

export type PanelTab = "setup" | "messages";

/**
 * Transient editor UI state (never persisted): which message is selected,
 * which panel tab is open on small screens, dialogs, and a request to focus
 * the composer from a keyboard shortcut.
 */
type StudioUiState = {
  selectedId: string | null;
  panelTab: PanelTab;
  shortcutsOpen: boolean;
  composerFocusTick: number;
  select: (id: string | null) => void;
  setPanelTab: (tab: PanelTab) => void;
  setShortcutsOpen: (open: boolean) => void;
  focusComposer: () => void;
};

export const useStudioUi = create<StudioUiState>()((set) => ({
  selectedId: null,
  panelTab: "messages",
  shortcutsOpen: false,
  composerFocusTick: 0,
  select: (selectedId) => set({ selectedId }),
  setPanelTab: (panelTab) => set({ panelTab }),
  setShortcutsOpen: (shortcutsOpen) => set({ shortcutsOpen }),
  focusComposer: () => set((s) => ({ composerFocusTick: s.composerFocusTick + 1, panelTab: "messages" })),
}));
