import { COMPOSE_HOLD_MS, composeWallMs, composesMessage } from "../../playback/compose";
import type { Message, Scenario } from "../../types";

/** Gap the playback engine leaves between two revealed messages. */
const STEP_GAP_MS = 70;

type ComposeOpt = Pick<Scenario, "composeTyping">;

/**
 * Playback duration of one message step: delay, then the typing indicator
 * ("them") or the composer typing + hold (my text messages when compose
 * typing is on), then the gap. Mirrors usePlayback / buildTimeline.
 */
export function stepDurationMs(m: Message, opts: ComposeOpt = {}): number {
  let typing = 0;
  if (composesMessage(opts, m)) typing = composeWallMs(m) + COMPOSE_HOLD_MS;
  else if (m.sender === "them" && m.typingMs > 0) typing = m.typingMs;
  return Math.max(0, m.delayMs) + typing + STEP_GAP_MS;
}

/** Cumulative boundaries: bounds[i] = start of step i, bounds[n] = total. */
export function stepBounds(messages: Message[], opts: ComposeOpt = {}): number[] {
  const bounds = [0];
  for (const m of messages) bounds.push(bounds[bounds.length - 1] + stepDurationMs(m, opts));
  return bounds;
}

/** "0:07" style clock for transport displays. */
export function formatClock(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000));
  const m = Math.floor(total / 60);
  const s = (total % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

/** "1.4" style seconds with one decimal. */
export function formatSeconds(ms: number): string {
  return (Math.max(0, ms) / 1000).toFixed(1);
}

/** Tiny `{name}` interpolation for dictionary strings. */
export function fmt(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? ""));
}
