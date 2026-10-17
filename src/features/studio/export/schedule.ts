import type { DeliveryStatus, Scenario, Sender } from "../types";

/** Resolved state of the conversation at a given moment, used to render a frame. */
export interface FrameState {
  visibleIds: Set<string>;
  typing: boolean;
  statuses: Map<string, DeliveryStatus>;
}

export interface RevealEvent {
  id: string;
  sender: Sender;
  at: number;
}
interface TypingWindow {
  start: number;
  end: number;
}
interface StatusEvent {
  id: string;
  at: number;
  status: DeliveryStatus;
}

export interface Timeline {
  /** time (ms) at which the last event (reveal or status tick) happens */
  contentMs: number;
  stateAt: (t: number) => FrameState;
  /** time (ms) each message becomes visible — used for entrance animation */
  revealAt: Map<string, number>;
  /** reveals in order, with sender (used for sound effects) */
  reveals: RevealEvent[];
}

// Mirrors usePlayback's timing constants exactly so the export matches playback:
//  - play() starts the first step after a 30 ms tick,
//  - each step waits delayMs, then (for "them") typingMs with the indicator on,
//  - reveal, then 70 ms before the next step starts,
//  - outgoing ticks: sent at reveal, delivered +520 ms, read +1250 ms.
const START_TICK = 30;
const GAP_AFTER = 70;
const DELIVERED_AFTER = 520;
const READ_AFTER = 1250;

/** Build the deterministic timeline from a scenario (same model as live playback). */
export function buildTimeline(scenario: Scenario): Timeline {
  const reveals: RevealEvent[] = [];
  const typings: TypingWindow[] = [];
  const statusEvents: StatusEvent[] = [];

  let t = START_TICK;
  for (const m of scenario.messages) {
    t += Math.max(0, m.delayMs);
    if (m.sender === "them" && m.typingMs > 0) {
      typings.push({ start: t, end: t + m.typingMs });
      t += m.typingMs;
    }
    const revealAt = t;
    reveals.push({ id: m.id, sender: m.sender, at: revealAt });

    if (m.sender === "me") {
      statusEvents.push({ id: m.id, at: revealAt, status: "sent" });
      if (m.status === "delivered" || m.status === "read") {
        statusEvents.push({ id: m.id, at: revealAt + DELIVERED_AFTER, status: "delivered" });
      }
      if (m.status === "read") {
        statusEvents.push({ id: m.id, at: revealAt + READ_AFTER, status: "read" });
      }
    } else {
      statusEvents.push({ id: m.id, at: revealAt, status: m.status });
    }

    t += GAP_AFTER;
  }

  const lastStatusAt = statusEvents.reduce((mx, e) => Math.max(mx, e.at), 0);
  const lastRevealAt = reveals.length ? reveals[reveals.length - 1].at : 0;
  const contentMs = Math.max(lastRevealAt, lastStatusAt);

  const revealAt = new Map<string, number>();
  for (const r of reveals) revealAt.set(r.id, r.at);

  const stateAt = (time: number): FrameState => {
    const visibleIds = new Set<string>();
    for (const r of reveals) if (r.at <= time) visibleIds.add(r.id);

    let typing = false;
    for (const w of typings) {
      if (time >= w.start && time < w.end) {
        typing = true;
        break;
      }
    }

    const statuses = new Map<string, DeliveryStatus>();
    for (const e of statusEvents) {
      if (e.at <= time) statuses.set(e.id, e.status);
    }

    return { visibleIds, typing, statuses };
  };

  return { contentMs, stateAt, revealAt, reveals };
}
