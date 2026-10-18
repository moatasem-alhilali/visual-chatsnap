import type { Message, Scenario } from "../types";

/**
 * "Compose typing": before one of MY text messages is sent, its text is typed
 * into the app's composer character by character (the composer's mic button
 * turns into the send button), then it is sent. Shared by live playback
 * (usePlayback) and the deterministic export timeline (buildTimeline) so both
 * produce the exact same timing.
 */

/** pause with the full text in the composer before it is sent */
export const COMPOSE_HOLD_MS = 220;
/** live playback updates the draft every STEP ms */
export const COMPOSE_STEP_MS = 45;

/** Is compose typing enabled for this scenario (default on)? */
export function composeEnabled(scenario: Pick<Scenario, "composeTyping">): boolean {
  return scenario.composeTyping !== false;
}

/** Does this message get typed into the composer before sending? */
export function composesMessage(scenario: Pick<Scenario, "composeTyping">, m: Message): boolean {
  return composeEnabled(scenario) && m.sender === "me" && m.type === "text" && m.text.trim().length > 0;
}

/** Split into user-perceived characters (emoji, Arabic ligatures stay whole). */
export function graphemes(text: string): string[] {
  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    const seg = new Intl.Segmenter(undefined, { granularity: "grapheme" });
    return Array.from(seg.segment(text), (s) => s.segment);
  }
  return Array.from(text);
}

/**
 * How long typing takes. A "me" message's `typingMs` overrides it when set;
 * otherwise a natural speed (~45 ms per character, clamped 0.7–3.2 s).
 */
export function composeMsFor(m: Message): number {
  if (m.typingMs > 0) return m.typingMs;
  const n = graphemes(m.text).length;
  return Math.min(3200, Math.max(700, 320 + n * 45));
}

/**
 * Wall-clock length of the typing phase as live playback schedules it (the
 * last step lands on a STEP boundary). The export timeline uses this too.
 */
export function composeWallMs(m: Message): number {
  return Math.ceil(composeMsFor(m) / COMPOSE_STEP_MS) * COMPOSE_STEP_MS;
}

/** The partially typed text at progress p ∈ [0,1]. */
export function draftAt(text: string, p: number): string {
  const g = graphemes(text);
  const k = Math.round(Math.min(1, Math.max(0, p)) * g.length);
  return g.slice(0, k).join("");
}

/** What the composer currently shows while composing. */
export interface ComposeDraft {
  /** id of the message being typed */
  messageId: string;
  /** text typed so far (grows to the full message text) */
  text: string;
}
