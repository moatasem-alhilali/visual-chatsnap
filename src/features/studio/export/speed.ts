import type { Timeline } from "./schedule";

/** Playback speeds offered by the exporter (1 = real time). */
export const SPEEDS = [0.75, 1, 1.25, 1.5, 2] as const;
export type Speed = (typeof SPEEDS)[number];

/**
 * The same conversation played `speed`× faster (or slower), like a sped-up
 * screen recording. Every event time (reveals, typing windows, compose
 * typing, keyboard spans, the content length) is divided by `speed`, and
 * `stateAt(t)` samples the original timeline at `t × speed`, so drafts, the
 * keyboard slide and delivery ticks all advance at the new rate. The
 * renderer multiplies its template clock (typing dots, keyboard key pops),
 * entrance motion and auto-scroll by the same factor, and the camera, the
 * scenes and the sound cues are planned from these scaled times.
 */
export function scaleTimeline(tl: Timeline, speed: number): Timeline {
  if (!(speed > 0) || speed === 1) return tl;
  const k = 1 / speed;
  // events land on exact ms in the source timeline; a hair of slack keeps
  // `at <= t` comparisons true at the scaled event time despite rounding
  const src = (t: number) => t * speed + 1e-6;
  return {
    contentMs: tl.contentMs * k,
    stateAt: (t) => tl.stateAt(src(t)),
    revealAt: new Map([...tl.revealAt].map(([id, at]) => [id, at * k])),
    reveals: tl.reveals.map((r) => ({ ...r, at: r.at * k })),
    typings: tl.typings.map((w) => ({ start: w.start * k, end: w.end * k })),
    composes: tl.composes.map((c) => ({
      ...c,
      start: c.start * k,
      typeMs: c.typeMs * k,
      wallMs: c.wallMs * k,
      end: c.end * k,
    })),
    keyboards: tl.keyboards.map((w) => ({ ...w, openAt: w.openAt * k, closeAt: w.closeAt * k })),
  };
}
