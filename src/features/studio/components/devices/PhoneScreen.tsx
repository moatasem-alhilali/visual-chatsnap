"use client";

import { useMemo, type ReactNode } from "react";

import { KEYBOARD_SLIDE_MS } from "../../playback/compose";
import type { PlaybackView } from "../../playback/usePlayback";
import type { Scenario } from "../../types";
import { Keyboard, KEYBOARD_HEIGHT } from "./Keyboard";
import { KeyboardInsetContext, type KeyboardInset } from "./keyboard-context";

/** ease-out cubic, matching export/schedule.ts's eased keyboard slide */
const SLIDE_EASE = "cubic-bezier(0.33, 1, 0.68, 1)";

/**
 * The phone's screen contents: the app template plus the OS keyboard on top
 * of it during compose typing. Used by the studio stage, the video exporter
 * and the /preview harness so all three show the same thing.
 *
 * Live playback: `playback.keyboard.open` flips 0↔1 and the slide is a CSS
 * transition. Export: `open` is the exact eased fraction for the frame and no
 * transition runs.
 */
export function PhoneScreen({
  scenario,
  playback,
  children,
}: {
  scenario: Scenario;
  playback: PlaybackView;
  children: ReactNode;
}) {
  const exporting = playback.clockMs !== undefined;
  const kb = playback.keyboard;
  const height = KEYBOARD_HEIGHT[scenario.device];
  const open = kb ? Math.min(1, Math.max(0, kb.open)) : 0;

  const value = useMemo<KeyboardInset>(
    () => ({
      inset: Math.round(height * open * 100) / 100,
      height,
      open,
      transition: exporting ? "none" : `${KEYBOARD_SLIDE_MS}ms ${SLIDE_EASE}`,
    }),
    [height, open, exporting],
  );

  return (
    <div className="relative h-full w-full">
      <KeyboardInsetContext.Provider value={value}>{children}</KeyboardInsetContext.Provider>
      {kb && (
        <div
          aria-hidden
          data-keyboard
          className="pointer-events-none absolute inset-x-0 bottom-0 z-20"
          style={{
            height,
            transform: `translateY(${(1 - open) * 100}%)`,
            transition: exporting ? "none" : `transform ${KEYBOARD_SLIDE_MS}ms ${SLIDE_EASE}`,
          }}
        >
          <Keyboard
            device={scenario.device}
            theme={scenario.theme}
            lang={kb.lang}
            typed={playback.draft?.text ?? null}
            clockMs={playback.clockMs}
          />
        </div>
      )}
    </div>
  );
}
