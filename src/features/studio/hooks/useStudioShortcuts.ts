"use client";

import { useEffect, useRef } from "react";

import type { PlaybackView } from "../playback/usePlayback";
import { useStudioStore } from "../store";
import { useStudioUi } from "./useStudioUi";

type Handlers = {
  enabled: boolean;
  playback: PlaybackView;
  onSave: () => void;
  onRecord: () => void;
  onExport: () => void;
  onRemove: (id: string) => void;
  onDuplicate: (id: string) => void;
  onMove: (id: string, dir: -1 | 1) => void;
};

function isEditable(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  if (el.isContentEditable) return true;
  const tag = el.tagName;
  if (tag === "TEXTAREA" || tag === "SELECT") return true;
  if (tag === "INPUT") {
    const type = (el as HTMLInputElement).type;
    return !["checkbox", "radio", "range", "button", "submit", "file"].includes(type);
  }
  return false;
}

/** Whether a modal/menu currently owns the keyboard. */
function overlayOpen(): boolean {
  return !!document.querySelector('[role="dialog"], [role="menu"]');
}

/** Global editor keyboard shortcuts (see ShortcutsDialog for the list). */
export function useStudioShortcuts(handlers: Handlers) {
  const ref = useRef(handlers);
  useEffect(() => {
    ref.current = handlers;
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const h = ref.current;
      if (!h.enabled || e.defaultPrevented || overlayOpen()) return;
      const mod = e.ctrlKey || e.metaKey;
      const typing = isEditable(e.target);
      const ui = useStudioUi.getState();
      const selected = ui.selectedId;
      const exists = selected ? useStudioStore.getState().scenario.messages.some((m) => m.id === selected) : false;
      const key = e.key.toLowerCase();

      if (mod && key === "s") {
        e.preventDefault();
        h.onSave();
        return;
      }
      if (mod && key === "d" && exists && selected) {
        e.preventDefault();
        h.onDuplicate(selected);
        return;
      }
      if (e.altKey && (e.key === "ArrowUp" || e.key === "ArrowDown") && exists && selected) {
        e.preventDefault();
        h.onMove(selected, e.key === "ArrowUp" ? -1 : 1);
        return;
      }
      if (typing || mod || e.altKey) return;

      // Buttons and radios keep their own Space/Enter behaviour.
      const onControl = e.target instanceof HTMLElement && !!e.target.closest("button, a, [role='radio'], [role='tab'], [role='switch']");

      if ((e.key === " " && !onControl) || key === "k") {
        e.preventDefault();
        const p = h.playback;
        if (p.phase === "playing") p.pause();
        else if (p.phase === "paused") p.resume();
        else p.play();
      } else if (key === "r") {
        e.preventDefault();
        h.playback.restart();
      } else if (key === "n") {
        e.preventDefault();
        ui.focusComposer();
      } else if (key === "e") {
        e.preventDefault();
        h.onExport();
      } else if (key === "f") {
        e.preventDefault();
        h.onRecord();
      } else if (e.key === "?") {
        e.preventDefault();
        ui.setShortcutsOpen(true);
      } else if ((e.key === "Delete" || e.key === "Backspace") && exists && selected) {
        e.preventDefault();
        h.onRemove(selected);
      } else if (e.key === "Escape" && selected) {
        ui.select(null);
        (document.activeElement as HTMLElement | null)?.blur?.();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
}
