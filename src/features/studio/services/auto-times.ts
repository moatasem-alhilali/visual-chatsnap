import type { Message, Scenario } from "../types";
import { stepBounds } from "../components/studio/timing";

/**
 * "Generate times": spread the clock labels of a conversation from a start
 * time using the scenario's own pacing (each step's delay + typing), scaled
 * up to real-world minutes. The output keeps the user's input style: 12 h or
 * 24 h, zero-padded hours, an AM/PM (or ص/م) suffix and Arabic-Indic digits.
 *
 * A message whose time is locked keeps its label and re-anchors the times
 * that follow it, so a manual "5:51" in the middle of a chat is respected.
 */

/**
 * Studio-only per-message flag (stored on the message, not in the shared
 * contract yet): the user typed this time and wants to keep it.
 */
export type TimeLock = { timeLocked?: boolean };

export function isTimeLocked(m: Message): boolean {
  return (m as Message & TimeLock).timeLocked === true;
}

export interface ClockStyle {
  h24: boolean;
  /** zero-pad the hour ("09:05") */
  pad: boolean;
  /** AM/PM words as typed, e.g. ["AM", "PM"], ["am", "pm"], ["ص", "م"] */
  suffix: [string, string] | null;
  /** write the digits as Arabic-Indic (١٠:٤١) */
  arabicDigits: boolean;
}

export interface ParsedClock {
  /** minutes since midnight, 0…1439 */
  minutes: number;
  style: ClockStyle;
}

const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";
const toLatin = (s: string) => s.replace(/[٠-٩]/g, (d) => String(AR_DIGITS.indexOf(d)));
const toArabic = (s: string) => s.replace(/\d/g, (d) => AR_DIGITS[Number(d)]);

const SUFFIXES: [RegExp, [string, string], boolean][] = [
  [/^AM$/, ["AM", "PM"], false],
  [/^PM$/, ["AM", "PM"], true],
  [/^am$/, ["am", "pm"], false],
  [/^pm$/, ["am", "pm"], true],
  [/^a\.m\.$/i, ["a.m.", "p.m."], false],
  [/^p\.m\.$/i, ["a.m.", "p.m."], true],
  [/^ص$/, ["ص", "م"], false],
  [/^م$/, ["ص", "م"], true],
];

/** Parse "10:41", "09:05", "22:10", "4:12 PM", "١٠:٤١ م"… (null when not a clock). */
export function parseClock(raw: string): ParsedClock | null {
  const text = raw.trim();
  const arabicDigits = /[٠-٩]/.test(text);
  const m = /^(\d{1,2})\s*[:.٫]\s*(\d{2})\s*(.*)$/.exec(toLatin(text));
  if (!m) return null;
  let h = Number(m[1]);
  const min = Number(m[2]);
  if (min > 59 || h > 23) return null;
  const rest = m[3].trim();
  let suffix: [string, string] | null = null;
  if (rest) {
    const hit = SUFFIXES.find(([re]) => re.test(rest));
    if (!hit || h < 1 || h > 12) return null;
    suffix = hit[1];
    const pm = hit[2];
    h = (h % 12) + (pm ? 12 : 0);
  }
  const h24 = !suffix && (h === 0 || h > 12 || /^0\d/.test(m[1]));
  return {
    minutes: h * 60 + min,
    style: { h24, pad: m[1].length === 2 && m[1].startsWith("0"), suffix, arabicDigits },
  };
}

/** Format minutes since midnight in a given style. */
export function formatClock(minutes: number, style: ClockStyle): string {
  const total = ((Math.round(minutes) % 1440) + 1440) % 1440;
  const h = Math.floor(total / 60);
  const mm = String(total % 60).padStart(2, "0");
  let out: string;
  if (style.h24) out = `${style.pad ? String(h).padStart(2, "0") : h}:${mm}`;
  else {
    const h12 = ((h + 11) % 12) + 1;
    out = `${style.pad ? String(h12).padStart(2, "0") : h12}:${mm}`;
    if (style.suffix) out += ` ${style.suffix[h >= 12 ? 1 : 0]}`;
  }
  return style.arabicDigits ? toArabic(out) : out;
}

/** Real-world seconds per second of playback. */
export const TIME_PACES = { quick: 6, natural: 14, slow: 36 } as const;
export type TimePace = keyof typeof TIME_PACES;

/**
 * New time labels for every message (locked ones unchanged). Times never go
 * backwards and are rounded down to whole minutes.
 */
export function generateTimes(
  scenario: Pick<Scenario, "messages" | "composeTyping">,
  start: ParsedClock,
  pace: TimePace = "natural",
): string[] {
  const { messages } = scenario;
  const bounds = stepBounds(messages, { composeTyping: scenario.composeTyping !== false });
  const scale = TIME_PACES[pace];
  // a message appears at the end of its step
  const shownAt = (i: number) => bounds[i + 1] ?? 0;

  let anchorMin = start.minutes;
  let anchorMs = messages.length ? shownAt(0) : 0;
  let prev = -Infinity;
  return messages.map((m, i) => {
    if (isTimeLocked(m)) {
      const own = parseClock(m.time);
      if (own) {
        // a locked 12 h label without AM/PM: pick the reading closest after the previous one
        let mins = own.minutes;
        if (!own.style.h24 && !own.style.suffix && Number.isFinite(prev)) {
          const base = ((prev % 1440) + 1440) % 1440;
          const cands = [mins % 720, (mins % 720) + 720];
          mins = cands.find((c) => c >= base) ?? cands[0];
        }
        anchorMin = mins;
        anchorMs = shownAt(i);
        prev = mins;
      }
      return m.time;
    }
    const mins = Math.max(prev === -Infinity ? anchorMin : prev, anchorMin + Math.floor(((shownAt(i) - anchorMs) * scale) / 60000));
    prev = mins;
    return formatClock(mins, start.style);
  });
}
