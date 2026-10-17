"use client";

import { create } from "zustand";

import { ZOOM_LEVELS, type ZoomIntensity } from "./camera";

/**
 * Auto-zoom settings shared by the live stage (CameraRig) and the export
 * dialog, so the preview shows exactly the camera the video will get. Stored
 * inside the export dialog's prefs blob (`scenora.export.prefs`) — the dialog
 * reads them on open and calls `syncLiveZoom` whenever it saves.
 */
const PREFS_KEY = "scenora.export.prefs";

export interface LiveZoom {
  enabled: boolean;
  intensity: ZoomIntensity;
  followSides: boolean;
}

const DEFAULTS: LiveZoom = { enabled: true, intensity: "medium", followSides: true };

function read(): LiveZoom {
  try {
    const raw = window.localStorage.getItem(PREFS_KEY);
    if (!raw) return DEFAULTS;
    const p = JSON.parse(raw) as { zoom?: unknown; zoomLevel?: unknown; followSides?: unknown };
    return {
      enabled: p.zoom === undefined ? DEFAULTS.enabled : !!p.zoom,
      intensity: typeof p.zoomLevel === "string" && p.zoomLevel in ZOOM_LEVELS ? (p.zoomLevel as ZoomIntensity) : DEFAULTS.intensity,
      followSides: p.followSides === undefined ? DEFAULTS.followSides : !!p.followSides,
    };
  } catch {
    return DEFAULTS;
  }
}

function write(z: LiveZoom) {
  try {
    const raw = window.localStorage.getItem(PREFS_KEY);
    const p = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
    window.localStorage.setItem(
      PREFS_KEY,
      JSON.stringify({ ...p, zoom: z.enabled, zoomLevel: z.intensity, followSides: z.followSides }),
    );
  } catch {
    /* private mode / quota */
  }
}

interface LiveZoomStore extends LiveZoom {
  hydrated: boolean;
  hydrate: () => void;
  setEnabled: (on: boolean) => void;
}

export const useLiveZoom = create<LiveZoomStore>((set, get) => ({
  ...DEFAULTS,
  hydrated: false,
  hydrate: () => {
    if (!get().hydrated) set({ ...read(), hydrated: true });
  },
  setEnabled: (enabled) => {
    const next = { enabled, intensity: get().intensity, followSides: get().followSides };
    set(next);
    write(next);
  },
}));

/** Called by the export dialog after it persists its prefs. */
export function syncLiveZoom(p: { zoom: boolean; zoomLevel: ZoomIntensity; followSides: boolean }) {
  useLiveZoom.setState({ enabled: p.zoom, intensity: p.zoomLevel, followSides: p.followSides, hydrated: true });
}
