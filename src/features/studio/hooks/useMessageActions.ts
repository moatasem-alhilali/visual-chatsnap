"use client";

import { useCallback } from "react";

import { toast } from "@/shared/components/ui/toast";
import { useStudioStore } from "../store";
import type { StudioLabels } from "../components/labels";
import { useStudioUi } from "./useStudioUi";

/** Re-focus whatever had focus if a DOM reorder dropped it. */
function keepFocus() {
  const active = document.activeElement as HTMLElement | null;
  requestAnimationFrame(() => {
    if (active && active !== document.activeElement && active.isConnected) active.focus({ preventScroll: true });
  });
}

/**
 * Undo the last step if nothing changed since `after` was produced; otherwise
 * restore `before` as a new (itself undoable) step.
 */
export function undoTo(before: ReturnType<typeof useStudioStore.getState>["scenario"], after: unknown) {
  const s = useStudioStore.getState();
  if (s.scenario === after) s.undo();
  else s.loadScenario(before);
}

/** Message list operations shared by the editor rows and keyboard shortcuts. */
export function useMessageActions(t: StudioLabels) {
  const deleteMessage = useStudioStore((s) => s.deleteMessage);
  const duplicateMessage = useStudioStore((s) => s.duplicateMessage);
  const moveMessage = useStudioStore((s) => s.moveMessage);
  const moveMessageTo = useStudioStore((s) => s.moveMessageTo);
  const applySmartTiming = useStudioStore((s) => s.applySmartTiming);
  const select = useStudioUi((s) => s.select);

  const remove = useCallback(
    (id: string) => {
      const before = useStudioStore.getState().scenario;
      const list = before.messages;
      const idx = list.findIndex((m) => m.id === id);
      deleteMessage(id);
      const after = useStudioStore.getState().scenario;
      const neighbour = list[idx + 1] ?? list[idx - 1];
      select(neighbour ? neighbour.id : null);
      toast({
        title: t.messageDeleted,
        action: { label: t.undo, onClick: () => undoTo(before, after) },
      });
    },
    [deleteMessage, select, t.messageDeleted, t.undo],
  );

  const duplicate = useCallback(
    (id: string) => {
      duplicateMessage(id);
      const list = useStudioStore.getState().scenario.messages;
      const idx = list.findIndex((m) => m.id === id);
      const copy = list[idx + 1];
      if (copy) select(copy.id);
    },
    [duplicateMessage, select],
  );

  const move = useCallback(
    (id: string, direction: -1 | 1) => {
      keepFocus();
      moveMessage(id, direction);
    },
    [moveMessage],
  );

  /** Move a message to an insertion index (0…n) — used by drag & drop. */
  const moveTo = useCallback((id: string, insertAt: number) => moveMessageTo(id, insertAt), [moveMessageTo]);

  /** Natural timing for one message (or all when no id). */
  const autoTiming = useCallback(
    (id?: string) => {
      const before = useStudioStore.getState().scenario;
      applySmartTiming(id ? [id] : undefined);
      const after = useStudioStore.getState().scenario;
      if (after === before) {
        toast({ title: t.autoTimingSame });
        return;
      }
      toast({
        title: id ? t.autoTimingOneDone : t.autoTimingDone,
        variant: "success",
        action: { label: t.undo, onClick: () => undoTo(before, after) },
      });
    },
    [applySmartTiming, t.autoTimingDone, t.autoTimingOneDone, t.autoTimingSame, t.undo],
  );

  return { remove, duplicate, move, moveTo, autoTiming };
}
