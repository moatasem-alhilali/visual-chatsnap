"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { DeliveryStatus, Message, Scenario } from "../types";
import {
  COMPOSE_HOLD_MS,
  COMPOSE_STEP_MS,
  composeMsFor,
  composesMessage,
  draftAt,
  KEYBOARD_CLOSE_AFTER_MS,
  KEYBOARD_KEEP_MS,
  keyboardEnabled,
  keyboardLangFor,
  type ComposeDraft,
  type KeyboardState,
} from "./compose";

export type PlaybackPhase = "idle" | "playing" | "paused" | "done";

export interface PlaybackView {
  phase: PlaybackPhase;
  isLive: boolean;
  /** messages currently on screen, in order */
  messages: Message[];
  /** typing indicator for the other party is showing */
  typing: boolean;
  /**
   * My message currently being typed into the composer (compose typing), or
   * null. Templates show `draft.text` in their input field (instead of the
   * placeholder) and swap the mic/like button for their send button.
   */
  draft: ComposeDraft | null;
  /**
   * The OS keyboard shown during compose typing (null = none). Rendered by the
   * shared PhoneScreen wrapper; templates only read the resulting inset via
   * `useKeyboardInset()` to lift their composer above it.
   */
  keyboard: KeyboardState | null;
  /**
   * Deterministic clock (ms since playback start) supplied by the video
   * exporter, where CSS animations do not run. When defined, looping animations
   * (typing dots, etc.) must be derived from it instead of CSS keyframes.
   */
  clockMs?: number;
  /** resolve the status to display for a given message */
  statusOf: (m: Message) => DeliveryStatus;
  play: () => void;
  pause: () => void;
  resume: () => void;
  restart: () => void;
  reset: () => void;
}

/**
 * Drives the cinematic reveal of a conversation. When idle/done the full
 * conversation is shown statically (so the editor preview is useful). During
 * playback messages appear one by one honouring per-message delay + typing,
 * with realistic sent → delivered → read progression for outgoing messages.
 */
export function usePlayback(scenario: Scenario): PlaybackView {
  const [phase, setPhase] = useState<PlaybackPhase>("idle");
  const [visibleIds, setVisibleIds] = useState<string[]>([]);
  const [statuses, setStatuses] = useState<Record<string, DeliveryStatus>>({});
  const [typing, setTyping] = useState(false);
  const [draft, setDraft] = useState<ComposeDraft | null>(null);
  const [keyboard, setKeyboard] = useState<KeyboardState | null>(null);

  const indexRef = useRef(0);
  const pauseRef = useRef(false);
  const timersRef = useRef<number[]>([]);
  const messagesRef = useRef<Message[]>(scenario.messages);
  const scenarioRef = useRef<Scenario>(scenario);
  useEffect(() => {
    messagesRef.current = scenario.messages;
    scenarioRef.current = scenario;
  }, [scenario]);

  const after = useCallback((ms: number, fn: () => void) => {
    const t = window.setTimeout(fn, ms);
    timersRef.current.push(t);
    return t;
  }, []);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((t) => window.clearTimeout(t));
    timersRef.current = [];
  }, []);

  const reveal = useCallback(
    (msg: Message) => {
      setVisibleIds((ids) => (ids.includes(msg.id) ? ids : [...ids, msg.id]));
      if (msg.sender === "me") {
        setStatuses((s) => ({ ...s, [msg.id]: "sent" }));
        if (msg.status === "delivered" || msg.status === "read") {
          after(520, () =>
            setStatuses((s) => ({ ...s, [msg.id]: "delivered" })),
          );
        }
        if (msg.status === "read") {
          after(1250, () => setStatuses((s) => ({ ...s, [msg.id]: "read" })));
        }
      } else {
        setStatuses((s) => ({ ...s, [msg.id]: msg.status }));
      }
    },
    [after],
  );

  // Holds the latest runStep so the recursive scheduling can call forward
  // without referencing the callback before it is declared.
  const runStepRef = useRef<(i: number) => void>(() => {});

  const runStep = useCallback(
    (i: number) => {
      const messages = messagesRef.current;
      if (i >= messages.length) {
        setPhase("done");
        return;
      }
      if (pauseRef.current) {
        indexRef.current = i;
        setPhase("paused");
        return;
      }
      indexRef.current = i;
      const msg = messages[i];
      after(Math.max(0, msg.delayMs), () => {
        if (composesMessage(scenarioRef.current, msg)) {
          // type my message into the composer, hold, then send it
          const dur = composeMsFor(msg);
          if (keyboardEnabled(scenarioRef.current)) setKeyboard({ open: 1, lang: keyboardLangFor(msg.text) });
          const tick = (elapsed: number) => {
            setDraft({ messageId: msg.id, text: draftAt(msg.text, elapsed / dur) });
            if (elapsed >= dur) {
              after(COMPOSE_HOLD_MS, () => {
                setDraft(null);
                reveal(msg);
                // keep the keyboard up if I type again right away (same rule as export/schedule.ts)
                const next = messagesRef.current[i + 1];
                const keep = next && composesMessage(scenarioRef.current, next) && 70 + Math.max(0, next.delayMs) <= KEYBOARD_KEEP_MS;
                if (!keep) after(KEYBOARD_CLOSE_AFTER_MS, () => setKeyboard((k) => (k ? { ...k, open: 0 } : k)));
                after(70, () => runStepRef.current(i + 1));
              });
            } else {
              after(COMPOSE_STEP_MS, () => tick(Math.min(dur, elapsed + COMPOSE_STEP_MS)));
            }
          };
          tick(0);
        } else if (msg.sender === "them" && msg.typingMs > 0) {
          setTyping(true);
          after(msg.typingMs, () => {
            setTyping(false);
            reveal(msg);
            after(70, () => runStepRef.current(i + 1));
          });
        } else {
          reveal(msg);
          after(70, () => runStepRef.current(i + 1));
        }
      });
    },
    [after, reveal],
  );

  useEffect(() => {
    runStepRef.current = runStep;
  }, [runStep]);

  const play = useCallback(() => {
    clearTimers();
    pauseRef.current = false;
    indexRef.current = 0;
    setVisibleIds([]);
    setStatuses({});
    setTyping(false);
    setDraft(null);
    setKeyboard(null);
    setPhase("playing");
    // start on the next tick so the cleared state is committed first
    window.setTimeout(() => runStep(0), 30);
  }, [clearTimers, runStep]);

  const pause = useCallback(() => {
    if (phase !== "playing") return;
    pauseRef.current = true;
  }, [phase]);

  const resume = useCallback(() => {
    if (phase !== "paused") return;
    pauseRef.current = false;
    setPhase("playing");
    runStep(indexRef.current);
  }, [phase, runStep]);

  const restart = useCallback(() => play(), [play]);

  const reset = useCallback(() => {
    clearTimers();
    pauseRef.current = false;
    indexRef.current = 0;
    setVisibleIds([]);
    setStatuses({});
    setTyping(false);
    setDraft(null);
    setKeyboard(null);
    setPhase("idle");
  }, [clearTimers]);

  useEffect(() => clearTimers, [clearTimers]);

  const isLive = phase === "playing" || phase === "paused";

  const messages = isLive
    ? scenario.messages.filter((m) => visibleIds.includes(m.id))
    : scenario.messages;

  const statusOf = useCallback(
    (m: Message): DeliveryStatus =>
      isLive ? (statuses[m.id] ?? "sent") : m.status,
    [isLive, statuses],
  );

  return {
    phase,
    isLive,
    messages,
    typing: isLive && typing,
    draft: isLive ? draft : null,
    keyboard: isLive ? keyboard : null,
    statusOf,
    play,
    pause,
    resume,
    restart,
    reset,
  };
}
