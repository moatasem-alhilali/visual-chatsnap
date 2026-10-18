import type { Message } from "../types";

/**
 * "Smart timing": natural pacing derived from message length, so a
 * conversation plays back like two people really texting.
 *
 *  - delay: the pause before a step starts — the time to read the previous
 *    message (when the sender changes) or a short beat (same sender again).
 *  - typing: for "them", how long the typing indicator shows (≈ thumb-typing
 *    speed); for my text messages it is the composer typing duration, where 0
 *    means "automatic" (the playback engine derives it from the length).
 *
 * Deterministic: the same script always gets the same timing, with a small
 * per-message variation so the rhythm does not feel mechanical.
 */

/** Number of user-perceived characters (emoji count as one). */
function charCount(text: string): number {
  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    const seg = new Intl.Segmenter(undefined, { granularity: "grapheme" });
    return Array.from(seg.segment(text)).length;
  }
  return Array.from(text).length;
}

/** "0:14" → 14 seconds (NaN-safe). */
function voiceSeconds(label: string | undefined): number {
  const m = /^(\d{1,2}):(\d{2})$/.exec((label ?? "").trim());
  return m ? Number(m[1]) * 60 + Number(m[2]) : 8;
}

/** Stable ±8 % jitter from the message id (never random between runs). */
function jitter(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return 1 + ((Math.abs(h) % 17) - 8) / 100;
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const round = (ms: number) => Math.round(ms / 50) * 50;

/** Reading time for a message the other side has just received. */
function readMs(m: Message | undefined): number {
  if (!m) return 400;
  if (m.type === "voice") return clamp(400 + voiceSeconds(m.voiceDuration) * 70, 700, 1800);
  if (m.type === "image") return clamp(900 + charCount(m.text) * 12, 900, 1600);
  return clamp(300 + charCount(m.text) * 14, 450, 1500);
}

/** Natural delay + typing for one message given the one before it. */
export function naturalTiming(m: Message, prev: Message | undefined): Pick<Message, "delayMs" | "typingMs"> {
  const j = jitter(m.id);
  const sameSender = prev?.sender === m.sender;
  const delayMs = prev ? (sameSender ? clamp(250 + charCount(prev.text) * 3, 250, 600) : readMs(prev)) : 400;

  let typingMs = 0;
  if (m.sender === "them") {
    if (m.type === "voice") typingMs = clamp(700 + voiceSeconds(m.voiceDuration) * 50, 900, 2200);
    else if (m.type === "image") typingMs = clamp(800 + charCount(m.text) * 25, 800, 2200);
    else typingMs = clamp(400 + charCount(m.text) * 34, 700, 3000);
  }
  // my messages: 0 = the composer types at its own natural speed

  return { delayMs: round(delayMs * j), typingMs: round(typingMs * j) };
}

/** Apply natural timing to every message (or only the given ids). */
export function applyNaturalTiming(messages: Message[], only?: ReadonlySet<string>): Message[] {
  return messages.map((m, i) => {
    if (only && !only.has(m.id)) return m;
    const next = naturalTiming(m, messages[i - 1]);
    return next.delayMs === m.delayMs && next.typingMs === m.typingMs ? m : { ...m, ...next };
  });
}
