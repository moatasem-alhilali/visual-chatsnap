"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { DeliveryStatus, Message, Scenario } from "../types";

export type PlaybackPhase = "idle" | "playing" | "paused" | "done";

export interface PlaybackView {
  phase: PlaybackPhase;
  isLive: boolean;
  /** messages currently on screen, in order */
  messages: Message[];
  /** typing indicator for the other party is showing */
  typing: boolean;
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

  const indexRef = useRef(0);
  const pauseRef = useRef(false);
  const timersRef = useRef<number[]>([]);
  const messagesRef = useRef<Message[]>(scenario.messages);
  useEffect(() => {
    messagesRef.current = scenario.messages;
  }, [scenario.messages]);

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
        if (msg.sender === "them" && msg.typingMs > 0) {
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
    statusOf,
    play,
    pause,
    resume,
    restart,
    reset,
  };
}
