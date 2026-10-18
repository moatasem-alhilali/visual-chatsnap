import type { Message, MessageType } from "../types";
import { createId } from "../data/defaults";
import { applyNaturalTiming } from "./smart-timing";

/**
 * Turns pasted chat text into messages. Understands:
 *  - simple scripts:              "Me: Hi" / "Khalid: Hello"
 *  - bracketed times:             "[10:41] Khalid: Hello"
 *  - WhatsApp iOS exports:        "[18/10/2026, 10:41:22 AM] Khalid: Hello"
 *  - WhatsApp Android exports:    "10/18/26, 10:41 - Khalid: Hello"
 *  - Arabic exports (RTL marks, Arabic-Indic digits, ص/م).
 * Lines without a "Name:" prefix continue the previous message. Media
 * placeholders become image / voice messages. System lines are skipped.
 */

export interface TranscriptLine {
  name: string;
  text: string;
  /** "10:41" when the transcript had a time for this line */
  time: string | null;
  kind: MessageType;
}

export interface ParsedTranscript {
  lines: TranscriptLine[];
  /** distinct speaker names in order of first appearance */
  names: string[];
  /** lines ignored (system notices, empty headers…) */
  skipped: number;
}

const BIDI = /[‎‏‪-‮⁦-⁩﻿]/g;
const D = "[0-9٠-٩۰-۹]";
const DATE = `${D}{1,4}[./\\-]${D}{1,2}[./\\-]${D}{1,4}`;
const TIME = `${D}{1,2}[:.]${D}{2}(?:[:.]${D}{2})?`;
const AMPM = `(?:\\s?(?:[AaPp]\\.?\\s?[Mm]\\.?|ص|م))?`;
const NAME = `([^:\\n]{1,48}?)`;

const RE_BRACKET = new RegExp(`^\\[(?:${DATE},?\\s*)?(${TIME})${AMPM}\\]\\s*${NAME}:\\s?(.*)$`);
const RE_DASH = new RegExp(`^(?:${DATE},?\\s*)?(${TIME})${AMPM}\\s*[-–—]\\s*${NAME}:\\s?(.*)$`);
/** a timestamped line without "Name:" — a system notice in exports */
const RE_STAMP_ONLY = new RegExp(`^(?:\\[(?:${DATE},?\\s*)?${TIME}${AMPM}\\]|(?:${DATE},?\\s*)?${TIME}${AMPM}\\s*[-–—])`);
const RE_PLAIN = /^([^:[\]\n]{1,32}?)\s*:\s*(.+)$/;

const IMAGE_HINTS = [
  /<?media omitted>?/i,
  /image omitted/i,
  /photo omitted/i,
  /\.(jpe?g|png|webp|heic)\b/i,
  /<\s*attached:[^>]*photo[^>]*>/i,
  /الوسائط (?:محذوفة|مستبعدة)|تم استبعاد الوسائط|صورة (?:محذوفة|مستبعدة)|تم حذف الصورة/,
];
const VOICE_HINTS = [/audio omitted/i, /\.(opus|m4a|ogg|mp3)\b/i, /voice (?:message|note)/i, /مقطع صوتي|رسالة صوتية|صوت (?:محذوف|مستبعد)/];

function toAsciiDigits(s: string): string {
  return s
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0));
}

/** "10:41:22" / "١٠:٤١" → "10:41" */
function cleanTime(raw: string): string {
  const [h, m] = toAsciiDigits(raw).split(/[:.]/);
  return `${Number(h)}:${m}`;
}

function classify(text: string): { kind: MessageType; text: string } {
  const body = text.replace(/\s*<(?:This message was edited|تم تعديل هذه الرسالة)>\s*$/i, "").trim();
  if (VOICE_HINTS.some((r) => r.test(body)) && body.length < 120) return { kind: "voice", text: "" };
  if (IMAGE_HINTS.some((r) => r.test(body)) && body.length < 120) {
    // "IMG-….jpg (file attached)\ncaption" keeps the caption
    const caption = body
      .split("\n")
      .filter((l) => !IMAGE_HINTS.some((r) => r.test(l)))
      .join("\n")
      .trim();
    return { kind: "image", text: caption };
  }
  return { kind: "text", text: body };
}

export function parseTranscript(raw: string): ParsedTranscript {
  const rows = raw.replace(/\r\n?/g, "\n").split("\n").map((l) => l.replace(BIDI, "").trimEnd());
  const exportMode = rows.some((l) => RE_BRACKET.test(l.trim()) || RE_DASH.test(l.trim()));

  const lines: TranscriptLine[] = [];
  const names: string[] = [];
  let skipped = 0;
  let current = null as TranscriptLine | null;

  const push = (name: string, text: string, time: string | null) => {
    const clean = name.trim().replace(/^[-•*~]\s*/, "");
    if (!clean) return;
    if (!names.includes(clean)) names.push(clean);
    current = { name: clean, text, time, kind: "text" };
    lines.push(current);
  };

  for (const row of rows) {
    const line = row.trim();
    if (!line) {
      if (current) current.text += "\n";
      continue;
    }
    const m = RE_BRACKET.exec(line) ?? RE_DASH.exec(line);
    if (m) {
      push(m[2], m[3], cleanTime(m[1]));
      continue;
    }
    if (exportMode && RE_STAMP_ONLY.test(line)) {
      skipped++;
      current = null;
      continue;
    }
    if (!exportMode) {
      const p = RE_PLAIN.exec(line);
      // a speaker name is short and never the start of a URL ("see https://…")
      if (p && !p[2].startsWith("//") && p[1].trim().split(/\s+/).length <= 4) {
        push(p[1], p[2], null);
        continue;
      }
    }
    if (current) current.text += `\n${line}`;
    else skipped++;
  }

  const finished = lines
    .map((l) => {
      const c = classify(l.text.trim());
      return { ...l, ...c };
    })
    .filter((l) => l.kind !== "text" || l.text.length > 0);

  return { lines: finished, names: names.filter((n) => finished.some((l) => l.name === n)), skipped };
}

const ME_WORDS = /^(me|you|i|myself|أنا|انا|أنت|انت)$/i;

/** Best guess for which speaker is the phone owner ("me"). */
export function guessOwner(names: string[], meName: string): string | null {
  if (names.length === 0) return null;
  const byWord = names.find((n) => ME_WORDS.test(n.trim()));
  if (byWord) return byWord;
  const byName = names.find((n) => n.trim().toLowerCase() === meName.trim().toLowerCase());
  if (byName) return byName;
  // In most scripts the other person opens the conversation.
  return names[1] ?? names[0];
}

function minutesOf(time: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(time.trim());
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
}

function clockFrom(minutes: number, h12: boolean): string {
  const total = ((minutes % 1440) + 1440) % 1440;
  let h = Math.floor(total / 60);
  if (h12) h = ((h + 11) % 12) + 1;
  return `${h}:${String(total % 60).padStart(2, "0")}`;
}

/**
 * Build studio messages. Lines without a time get a natural clock starting
 * at `startTime` (one minute every couple of messages). Timing (delays and
 * typing) is set automatically from the message lengths.
 */
export function transcriptToMessages(parsed: ParsedTranscript, owner: string | null, startTime: string): Message[] {
  const base = minutesOf(startTime) ?? 10 * 60 + 41;
  const h12 = !/^(1[3-9]|2[0-3]):/.test(startTime);
  let lastKnown: number | null = null;

  const messages: Message[] = parsed.lines.map((l, i) => {
    const known = l.time ? minutesOf(l.time) : null;
    if (known !== null) lastKnown = known;
    const time = l.time ?? clockFrom((lastKnown ?? base) + (lastKnown === null ? Math.floor(i / 2) : 0), h12);
    const sender = owner !== null && l.name === owner ? "me" : "them";
    return {
      id: createId(),
      sender,
      type: l.kind,
      text: l.text,
      time,
      delayMs: 800,
      typingMs: 0,
      status: "read",
      ...(l.kind === "voice" ? { voiceDuration: "0:08" } : {}),
      ...(l.kind === "image" ? { imageSrc: null } : {}),
    } satisfies Message;
  });
  return applyNaturalTiming(messages);
}
