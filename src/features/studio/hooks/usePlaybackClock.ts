"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import type { PlaybackView } from "../playback/usePlayback";
import type { Message } from "../types";
import { stepBounds } from "../components/studio/timing";

/**
 * Smooth elapsed-time estimate for the transport bar. The playback engine
 * only exposes which messages are visible, so we run a local clock and keep
 * it clamped inside the current step's [start, end) window.
 */
export function usePlaybackClock(playback: PlaybackView, messages: Message[], composeTyping?: boolean) {
  const bounds = useMemo(() => stepBounds(messages, { composeTyping }), [messages, composeTyping]);
  const total = bounds[bounds.length - 1] ?? 0;
  const visible = playback.isLive ? playback.messages.length : 0;
  const { phase } = playback;

  const [elapsed, setElapsed] = useState(0);
  const originRef = useRef(0);
  const elapsedRef = useRef(0);
  const prevVisible = useRef(visible);
  const prevPhase = useRef(phase);

  useEffect(() => {
    const was = prevPhase.current;
    prevPhase.current = phase;
    const restarted = phase === "playing" && visible < prevVisible.current;
    prevVisible.current = visible;

    if (phase === "playing") {
      let base = elapsedRef.current;
      if (was !== "playing" && was !== "paused") base = 0; // fresh play
      if (was === "paused") base = bounds[Math.min(visible, bounds.length - 1)]; // step restarts on resume
      if (restarted) base = 0;
      originRef.current = performance.now() - base;

      let raf = 0;
      const tick = () => {
        const lo = bounds[Math.min(visible, bounds.length - 1)] ?? 0;
        const hi = (bounds[Math.min(visible + 1, bounds.length - 1)] ?? total) - 1;
        const raw = performance.now() - originRef.current;
        const next = Math.min(Math.max(raw, lo), Math.max(lo, hi));
        elapsedRef.current = next;
        setElapsed(next);
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
      return () => cancelAnimationFrame(raf);
    }

    const next = phase === "done" ? total : phase === "idle" ? 0 : elapsedRef.current;
    elapsedRef.current = next;
    const raf = requestAnimationFrame(() => setElapsed(next));
    return () => cancelAnimationFrame(raf);
  }, [phase, visible, bounds, total]);

  return { elapsed, total, bounds, visible };
}
