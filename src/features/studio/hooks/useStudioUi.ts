"use client";

import { create } from "zustand";

export type PanelTab = "setup" | "messages";

/** Studio dialogs that can be opened from anywhere (menus, empty states, shortcuts). */
export type StudioDialog = "templates" | "transcript" | "projects" | "share" | "ai" | null;

/**
 * Transient editor UI state (never persisted): which message is selected,
 * which panel tab is open on small screens, dialogs, and a request to focus
 * the composer from a keyboard shortcut.
 */
type StudioUiState = {
  selectedId: string | null;
  panelTab: PanelTab;
  shortcutsOpen: boolean;
  dialog: StudioDialog;
  composerFocusTick: number;
  select: (id: string | null) => void;
  setPanelTab: (tab: PanelTab) => void;
  setShortcutsOpen: (open: boolean) => void;
  openDialog: (dialog: StudioDialog) => void;
  focusComposer: () => void;
};

export const useStudioUi = create<StudioUiState>()((set) => ({
  selectedId: null,
  panelTab: "messages",
  shortcutsOpen: false,
  dialog: null,
  composerFocusTick: 0,
  select: (selectedId) => set({ selectedId }),
  setPanelTab: (panelTab) => set({ panelTab }),
  setShortcutsOpen: (shortcutsOpen) => set({ shortcutsOpen }),
  openDialog: (dialog) => set({ dialog }),
  focusComposer: () => set((s) => ({ composerFocusTick: s.composerFocusTick + 1, panelTab: "messages" })),
}));
