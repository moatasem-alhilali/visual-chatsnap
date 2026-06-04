import type { DeliveryStatus, Scenario } from "../types";

/** Resolved state of the conversation at a given moment, used to render a frame. */
export interface FrameState {
  visibleIds: Set<string>;
  typing: boolean;
  statuses: Map<string, DeliveryStatus>;
}

interface RevealEvent {
  id: string;
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
  durationMs: number;
  stateAt: (t: number) => FrameState;
}

// Mirrors usePlayback's timing constants exactly so the export matches playback.
const GAP_AFTER = 70;
const DELIVERED_AFTER = 520;
const READ_AFTER = 1250;
const END_PADDING = 1800;

/** Build the deterministic timeline from a scenario (same model as live playback). */
export function buildTimeline(scenario: Scenario): Timeline {
  const reveals: RevealEvent[] = [];
  const typings: TypingWindow[] = [];
  const statusEvents: StatusEvent[] = [];

  let t = 0;
  for (const m of scenario.messages) {
    t += Math.max(0, m.delayMs);
    if (m.sender === "them" && m.typingMs > 0) {
      typings.push({ start: t, end: t + m.typingMs });
      t += m.typingMs;
    }
    const revealAt = t;
    reveals.push({ id: m.id, at: revealAt });

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

  const lastStatusAt = statusEvents.reduce((mx, e) => Math.max(mx, e.at), t);
  const durationMs = Math.max(t, lastStatusAt) + END_PADDING;

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

  return { durationMs, stateAt };
}
