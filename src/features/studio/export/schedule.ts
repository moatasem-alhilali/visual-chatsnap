import {
  COMPOSE_HOLD_MS,
  COMPOSE_STEP_MS,
  composeMsFor,
  composesMessage,
  composeWallMs,
  draftAt,
  type ComposeDraft,
} from "../playback/compose";
import type { DeliveryStatus, Scenario, Sender } from "../types";

/** Resolved state of the conversation at a given moment, used to render a frame. */
export interface FrameState {
  visibleIds: Set<string>;
  typing: boolean;
  statuses: Map<string, DeliveryStatus>;
  /** my message being typed into the composer at this moment (compose typing) */
  draft: ComposeDraft | null;
}

export interface RevealEvent {
  id: string;
  sender: Sender;
  at: number;
}
/** a window during which one of my messages is typed into the composer */
export interface ComposeWindow {
  id: string;
  text: string;
  start: number;
  /** typing duration (progress denominator) */
  typeMs: number;
  /** typing phase on the live step grid */
  wallMs: number;
  /** = reveal time (typing + hold) */
  end: number;
}
export interface TypingWindow {
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
  /** windows during which the other party is typing */
  typings: TypingWindow[];
  /** windows during which my next message is being typed into the composer */
  composes: ComposeWindow[];
}

// Mirrors usePlayback's timing constants exactly so the export matches playback:
//  - play() starts the first step after a 30 ms tick,
//  - each step waits delayMs, then (for "them") typingMs with the indicator on,
//    or (for my text messages, compose typing) the composer typing + hold,
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
  const composes: ComposeWindow[] = [];
  const statusEvents: StatusEvent[] = [];

  let t = START_TICK;
  for (const m of scenario.messages) {
    t += Math.max(0, m.delayMs);
    if (composesMessage(scenario, m)) {
      const wallMs = composeWallMs(m);
      composes.push({ id: m.id, text: m.text, start: t, typeMs: composeMsFor(m), wallMs, end: t + wallMs + COMPOSE_HOLD_MS });
      t += wallMs + COMPOSE_HOLD_MS;
    } else if (m.sender === "them" && m.typingMs > 0) {
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

    // compose typing: progress advances on the same 45 ms grid as live playback
    let draft: ComposeDraft | null = null;
    for (const c of composes) {
      if (time >= c.start && time < c.end) {
        const e = time - c.start;
        const elapsed = e >= c.wallMs ? c.typeMs : Math.min(c.typeMs, Math.floor(e / COMPOSE_STEP_MS) * COMPOSE_STEP_MS);
        draft = { messageId: c.id, text: draftAt(c.text, elapsed / c.typeMs) };
        break;
      }
    }

    return { visibleIds, typing, statuses, draft };
  };

  return { contentMs, stateAt, revealAt, reveals, typings, composes };
}
