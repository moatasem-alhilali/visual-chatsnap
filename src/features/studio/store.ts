"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import type {
  ChatTheme,
  Device,
  Message,
  Person,
  Platform,
  PresenceStatus,
  Scenario,
  Sender,
  StatusBarConfig,
} from "./types";
import { DEFAULT_STATUS_BAR } from "./types";
import {
  SCENARIO_VERSION,
  createBlankMessage,
  createDefaultScenario,
  createId,
} from "./data/defaults";
import {
  clearScenarioStorage,
  loadScenarioSlot,
  saveScenarioSlot,
} from "./services/scenario-storage";

type StudioState = {
  scenario: Scenario;
  recording: boolean;

  setPlatform: (platform: Platform) => void;
  setDevice: (device: Device) => void;
  setTheme: (theme: ChatTheme) => void;
  setPresence: (presence: PresenceStatus) => void;
  setLastSeenText: (text: string) => void;
  setAndroidFont: (font: string) => void;
  updateStatusBar: (patch: Partial<StatusBarConfig>) => void;

  updatePerson: (who: Sender, patch: Partial<Person>) => void;
  swapRoles: () => void;

  addMessage: (sender?: Sender) => void;
  updateMessage: (id: string, patch: Partial<Message>) => void;
  deleteMessage: (id: string) => void;
  moveMessage: (id: string, direction: -1 | 1) => void;
  duplicateMessage: (id: string) => void;

  loadScenario: (scenario: Scenario) => void;
  resetScenario: () => void;

  setRecording: (recording: boolean) => void;

  // explicit local persistence (separate from the auto-saved draft)
  saveSlot: () => void;
  loadSlot: () => boolean;
  clearAll: () => void;
};

export const useStudioStore = create<StudioState>()(
  persist(
    (set, get) => ({
      scenario: createDefaultScenario(),
      recording: false,

      setPlatform: (platform) =>
        set((s) => ({ scenario: { ...s.scenario, platform } })),
      setDevice: (device) =>
        set((s) => ({ scenario: { ...s.scenario, device } })),
      setTheme: (theme) => set((s) => ({ scenario: { ...s.scenario, theme } })),
      setPresence: (presence) =>
        set((s) => ({ scenario: { ...s.scenario, presence } })),
      setLastSeenText: (lastSeenText) =>
        set((s) => ({ scenario: { ...s.scenario, lastSeenText } })),
      setAndroidFont: (androidFont) =>
        set((s) => ({ scenario: { ...s.scenario, androidFont } })),
      updateStatusBar: (patch) =>
        set((s) => ({
          scenario: {
            ...s.scenario,
            statusBar: { ...DEFAULT_STATUS_BAR, ...s.scenario.statusBar, ...patch },
          },
        })),

      updatePerson: (who, patch) =>
        set((s) => ({
          scenario: {
            ...s.scenario,
            [who]: { ...s.scenario[who], ...patch },
          },
        })),

      swapRoles: () =>
        set((s) => ({
          scenario: {
            ...s.scenario,
            me: s.scenario.them,
            them: s.scenario.me,
            messages: s.scenario.messages.map((m) => ({
              ...m,
              sender: m.sender === "me" ? "them" : "me",
              typingMs: m.sender === "me" ? m.typingMs : m.typingMs,
            })),
          },
        })),

      addMessage: (sender = "me") =>
        set((s) => ({
          scenario: {
            ...s.scenario,
            messages: [...s.scenario.messages, createBlankMessage(sender)],
          },
        })),

      updateMessage: (id, patch) =>
        set((s) => ({
          scenario: {
            ...s.scenario,
            messages: s.scenario.messages.map((m) =>
              m.id === id ? { ...m, ...patch } : m,
            ),
          },
        })),

      deleteMessage: (id) =>
        set((s) => ({
          scenario: {
            ...s.scenario,
            messages: s.scenario.messages.filter((m) => m.id !== id),
          },
        })),

      moveMessage: (id, direction) =>
        set((s) => {
          const list = [...s.scenario.messages];
          const idx = list.findIndex((m) => m.id === id);
          if (idx < 0) return s;
          const target = idx + direction;
          if (target < 0 || target >= list.length) return s;
          [list[idx], list[target]] = [list[target], list[idx]];
          return { scenario: { ...s.scenario, messages: list } };
        }),

      duplicateMessage: (id) =>
        set((s) => {
          const list = [...s.scenario.messages];
          const idx = list.findIndex((m) => m.id === id);
          if (idx < 0) return s;
          const copy: Message = {
            ...list[idx],
            id: createId(),
          };
          list.splice(idx + 1, 0, copy);
          return { scenario: { ...s.scenario, messages: list } };
        }),

      loadScenario: (scenario) =>
        set(() => ({
          scenario: { ...scenario, version: SCENARIO_VERSION },
        })),

      resetScenario: () => set(() => ({ scenario: createDefaultScenario() })),

      setRecording: (recording) => set(() => ({ recording })),

      saveSlot: () => {
        saveScenarioSlot(get().scenario);
      },

      loadSlot: () => {
        const scenario = loadScenarioSlot();
        if (!scenario) return false;
        set(() => ({ scenario }));
        return true;
      },

      clearAll: () => {
        clearScenarioStorage();
        set(() => ({ scenario: createDefaultScenario() }));
      },
    }),
    {
      name: "rcss.draft",
      // only persist the scenario draft, never the transient recording flag
      partialize: (state) => ({ scenario: state.scenario }),
    },
  ),
);
