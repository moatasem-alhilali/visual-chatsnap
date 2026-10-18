"use client";

import { createContext, useContext } from "react";

/**
 * How much of the bottom of the phone screen the OS keyboard currently
 * covers. Provided by `PhoneScreen` (which draws the keyboard on top of the
 * template); templates read it with `useKeyboardInset()` and lift their
 * composer + thread by `inset` px, dropping their own bottom safe area / home
 * indicator / nav bar while `inset > 0` (the keyboard draws those itself).
 */
export interface KeyboardInset {
  /** px of screen covered from the bottom right now (0 when hidden) */
  inset: number;
  /** full keyboard height in px for this device (incl. its bottom system area) */
  height: number;
  /** 0..1 openness */
  open: number;
  /**
   * CSS transition to apply to the template's lift so it moves together with
   * the keyboard during live playback; "none" in video export (frames are
   * computed exactly from the clock).
   */
  transition: string;
}

const NONE: KeyboardInset = { inset: 0, height: 0, open: 0, transition: "none" };

export const KeyboardInsetContext = createContext<KeyboardInset>(NONE);

export function useKeyboardInset(): KeyboardInset {
  return useContext(KeyboardInsetContext);
}
