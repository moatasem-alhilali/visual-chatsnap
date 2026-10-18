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
import { clearScenarioStorage } from "./services/scenario-storage";
import { clearProjects } from "./services/project-storage";
import { applyNaturalTiming, naturalTiming } from "./services/smart-timing";

/** One undo step: the scenario and the project it belonged to. */
type Snapshot = { scenario: Scenario; projectId: string | null };

const HISTORY_LIMIT = 120;
/** edits of the same field within this window merge into one undo step */
const COALESCE_MS = 1000;

type StudioState = {
  scenario: Scenario;
  recording: boolean;
  /** project (saved in this browser) the draft is linked to, if any */
  projectId: string | null;
  past: Snapshot[];
  future: Snapshot[];

  setPlatform: (platform: Platform) => void;
  setDevice: (device: Device) => void;
  setTheme: (theme: ChatTheme) => void;
  setPresence: (presence: PresenceStatus) => void;
  setLastSeenText: (text: string) => void;
  setAndroidFont: (font: string) => void;
  setComposeTyping: (on: boolean) => void;
  setDeviceColor: (finish: string | undefined) => void;
  updateStatusBar: (patch: Partial<StatusBarConfig>) => void;

  updatePerson: (who: Sender, patch: Partial<Person>) => void;
  swapRoles: () => void;

  addMessage: (sender?: Sender, patch?: Partial<Message>) => string;
  updateMessage: (id: string, patch: Partial<Message>) => void;
  deleteMessage: (id: string) => void;
  moveMessage: (id: string, direction: -1 | 1) => void;
  moveMessageTo: (id: string, insertAt: number) => void;
  duplicateMessage: (id: string) => void;
  /** natural delays / typing from message length (all, or only `ids`) */
  applySmartTiming: (ids?: string[]) => void;
  /** append (or replace with) a batch of messages in one undo step */
  insertMessages: (messages: Message[], mode: "append" | "replace", people?: Partial<Record<Sender, Person>>) => void;

  /** replace the whole scenario as one undoable step */
  loadScenario: (scenario: Scenario, projectId?: string | null) => void;
  resetScenario: () => void;
  newBlank: () => void;
  setProjectId: (id: string | null) => void;

  undo: () => void;
  redo: () => void;

  setRecording: (recording: boolean) => void;
  clearAll: () => void;
};

let lastKey: string | null = null;
let lastAt = 0;

export const useStudioStore = create<StudioState>()(
  persist(
    (set, get) => {
      /**
       * Apply a scenario change as an undoable step. Rapid edits sharing a
       * `key` (typing into one field) merge into a single step.
       */
      const commit = (recipe: (s: Scenario) => Scenario, key?: string, projectId?: string | null) => {
        const state = get();
        const prev = state.scenario;
        const next = recipe(prev);
        const nextProject = projectId === undefined ? state.projectId : projectId;
        if (next === prev && nextProject === state.projectId) return;
        const now = Date.now();
        const merge = !!key && key === lastKey && now - lastAt < COALESCE_MS && state.past.length > 0;
        lastKey = key ?? null;
        lastAt = now;
        set({
          scenario: next,
          projectId: nextProject,
          past: merge ? state.past : [...state.past, { scenario: prev, projectId: state.projectId }].slice(-HISTORY_LIMIT),
          future: [],
        });
      };

      const patch = (p: Partial<Scenario>, key?: string) => commit((s) => ({ ...s, ...p }), key);

      return {
        scenario: createDefaultScenario(),
        recording: false,
        projectId: null,
        past: [],
        future: [],

        setPlatform: (platform) => patch({ platform }),
        setDevice: (device) => patch({ device }),
        setTheme: (theme) => patch({ theme }),
        setPresence: (presence) => patch({ presence }),
        setLastSeenText: (lastSeenText) => patch({ lastSeenText }, "lastSeen"),
        setAndroidFont: (androidFont) => patch({ androidFont }),
        setComposeTyping: (composeTyping) => patch({ composeTyping }),
        setDeviceColor: (deviceColor) => patch({ deviceColor }),
        updateStatusBar: (p) =>
          commit(
            (s) => ({ ...s, statusBar: { ...DEFAULT_STATUS_BAR, ...s.statusBar, ...p } }),
            `sb:${Object.keys(p).sort().join(",")}`,
          ),

        updatePerson: (who, p) =>
          commit((s) => ({ ...s, [who]: { ...s[who], ...p } }), `person:${who}:${Object.keys(p).sort().join(",")}`),

        swapRoles: () =>
          commit((s) => ({
            ...s,
            me: s.them,
            them: s.me,
            messages: s.messages.map((m, i, all) => {
              const swapped: Message = { ...m, sender: m.sender === "me" ? "them" : "me" };
              // my messages usually have no typing time — give the new "them" a natural one
              if (swapped.sender === "them" && swapped.typingMs <= 0) {
                swapped.typingMs = naturalTiming(swapped, all[i - 1]).typingMs;
              }
              return swapped;
            }),
          })),

        addMessage: (sender = "me", p) => {
          const msg = { ...createBlankMessage(sender), ...p };
          commit((s) => ({ ...s, messages: [...s.messages, msg] }));
          return msg.id;
        },

        updateMessage: (id, p) =>
          commit(
            (s) => ({ ...s, messages: s.messages.map((m) => (m.id === id ? { ...m, ...p } : m)) }),
            `msg:${id}:${Object.keys(p).sort().join(",")}`,
          ),

        deleteMessage: (id) =>
          commit((s) => ({
            ...s,
            messages: s.messages
              .filter((m) => m.id !== id)
              .map((m) => (m.replyToId === id ? { ...m, replyToId: null } : m)),
          })),

        moveMessage: (id, direction) =>
          commit((s) => {
            const list = [...s.messages];
            const idx = list.findIndex((m) => m.id === id);
            const target = idx + direction;
            if (idx < 0 || target < 0 || target >= list.length) return s;
            [list[idx], list[target]] = [list[target], list[idx]];
            return { ...s, messages: list };
          }),

        moveMessageTo: (id, insertAt) =>
          commit((s) => {
            const list = [...s.messages];
            const from = list.findIndex((m) => m.id === id);
            if (from < 0) return s;
            const to = Math.min(Math.max(insertAt > from ? insertAt - 1 : insertAt, 0), list.length - 1);
            if (to === from) return s;
            const [item] = list.splice(from, 1);
            list.splice(to, 0, item);
            return { ...s, messages: list };
          }),

        duplicateMessage: (id) =>
          commit((s) => {
            const list = [...s.messages];
            const idx = list.findIndex((m) => m.id === id);
            if (idx < 0) return s;
            list.splice(idx + 1, 0, { ...list[idx], id: createId() });
            return { ...s, messages: list };
          }),

        applySmartTiming: (ids) =>
          commit((s) => {
            const messages = applyNaturalTiming(s.messages, ids ? new Set(ids) : undefined);
            return messages.every((m, i) => m === s.messages[i]) ? s : { ...s, messages };
          }),

        insertMessages: (messages, mode, people) =>
          commit((s) => ({
            ...s,
            me: people?.me ?? s.me,
            them: people?.them ?? s.them,
            messages: mode === "replace" ? messages : [...s.messages, ...messages],
          })),

        loadScenario: (scenario, projectId) =>
          commit(() => ({ ...scenario, version: SCENARIO_VERSION }), undefined, projectId),

        resetScenario: () => commit(() => createDefaultScenario(), undefined, null),

        newBlank: () => commit((s) => ({ ...s, messages: [] }), undefined, null),

        setProjectId: (projectId) => set({ projectId }),

        undo: () => {
          const { past, future, scenario, projectId } = get();
          const prev = past[past.length - 1];
          if (!prev) return;
          lastKey = null;
          set({
            scenario: prev.scenario,
            projectId: prev.projectId,
            past: past.slice(0, -1),
            future: [...future, { scenario, projectId }].slice(-HISTORY_LIMIT),
          });
        },

        redo: () => {
          const { past, future, scenario, projectId } = get();
          const next = future[future.length - 1];
          if (!next) return;
          lastKey = null;
          set({
            scenario: next.scenario,
            projectId: next.projectId,
            future: future.slice(0, -1),
            past: [...past, { scenario, projectId }].slice(-HISTORY_LIMIT),
          });
        },

        setRecording: (recording) => set({ recording }),

        clearAll: () => {
          clearScenarioStorage();
          clearProjects();
          lastKey = null;
          set({ scenario: createDefaultScenario(), projectId: null, past: [], future: [] });
        },
      };
    },
    {
      name: "rcss.draft",
      // persist the draft and its project link — never history or the recording flag
      partialize: (state) => ({ scenario: state.scenario, projectId: state.projectId }),
    },
  ),
);
