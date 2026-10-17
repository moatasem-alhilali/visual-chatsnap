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

/** Message list operations shared by the editor rows and keyboard shortcuts. */
export function useMessageActions(t: StudioLabels) {
  const deleteMessage = useStudioStore((s) => s.deleteMessage);
  const duplicateMessage = useStudioStore((s) => s.duplicateMessage);
  const moveMessage = useStudioStore((s) => s.moveMessage);
  const loadScenario = useStudioStore((s) => s.loadScenario);
  const select = useStudioUi((s) => s.select);

  const remove = useCallback(
    (id: string) => {
      const snapshot = useStudioStore.getState().scenario;
      const list = snapshot.messages;
      const idx = list.findIndex((m) => m.id === id);
      deleteMessage(id);
      const neighbour = list[idx + 1] ?? list[idx - 1];
      select(neighbour ? neighbour.id : null);
      toast({
        title: t.messageDeleted,
        action: { label: t.undo, onClick: () => loadScenario(snapshot) },
      });
    },
    [deleteMessage, loadScenario, select, t.messageDeleted, t.undo],
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
  const moveTo = useCallback(
    (id: string, insertAt: number) => {
      const list = useStudioStore.getState().scenario.messages;
      const from = list.findIndex((m) => m.id === id);
      if (from < 0) return;
      let to = insertAt > from ? insertAt - 1 : insertAt;
      to = Math.min(Math.max(to, 0), list.length - 1);
      const dir: -1 | 1 = to > from ? 1 : -1;
      for (let i = 0; i < Math.abs(to - from); i++) moveMessage(id, dir);
    },
    [moveMessage],
  );

  return { remove, duplicate, move, moveTo };
}
