"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";

import { toast } from "@/shared/components/ui/toast";
import { listProjects, subscribeProjects, updateProject, type ProjectMeta } from "../services/project-storage";
import { useStudioStore } from "../store";
import type { StudioLabels } from "../components/labels";

const EMPTY: ProjectMeta[] = [];

/** Live list of projects saved in this browser (most recent first). */
export function useProjects(): ProjectMeta[] {
  return useSyncExternalStore(subscribeProjects, listProjects, () => EMPTY);
}

/**
 * Keeps the linked project in sync with the draft: every change is written
 * to it shortly after editing stops (the draft itself is persisted by the
 * store). Unlinks the draft if its project was deleted elsewhere.
 */
export function useProjectAutosave(t: StudioLabels, enabled: boolean) {
  const warned = useRef(false);

  useEffect(() => {
    if (!enabled) return;
    let timer: number | null = null;
    const flush = () => {
      timer = null;
      const { projectId, scenario, setProjectId } = useStudioStore.getState();
      if (!projectId) return;
      const result = updateProject(projectId, scenario);
      if (result.ok) {
        warned.current = false;
        return;
      }
      if (result.reason === "missing") setProjectId(null);
      else if (!warned.current) {
        warned.current = true;
        toast({ title: t.storageFull, description: t.storageFullHint, variant: "destructive", duration: 6000 });
      }
    };
    const unsub = useStudioStore.subscribe((s, prev) => {
      if (!s.projectId || (s.scenario === prev.scenario && s.projectId === prev.projectId)) return;
      if (timer) window.clearTimeout(timer);
      timer = window.setTimeout(flush, 700);
    });
    const onHide = () => {
      if (timer) {
        window.clearTimeout(timer);
        flush();
      }
    };
    window.addEventListener("pagehide", onHide);
    return () => {
      unsub();
      window.removeEventListener("pagehide", onHide);
      if (timer) {
        window.clearTimeout(timer);
        flush();
      }
    };
  }, [enabled, t.storageFull, t.storageFullHint]);
}
