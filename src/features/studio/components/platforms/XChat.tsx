"use client";

/**
 * X (formerly Twitter) — "Chat" conversation screen inside the X app for iPhone,
 * as it ships in October 2026.
 *
 * What "current" means here
 *  - DMs were relaunched as Chat (encrypted, Juicebox PIN) in 2025; the Chat tab of
 *    the X app is the product. The standalone XChat app (Apr 2026, Liquid Glass
 *    header) was pulled from the App Store in Sept 2026, and X has said it will NOT
 *    rush Liquid Glass into the main iOS app, so the X-app Chat screen (flat header,
 *    no glass) is the one replicated.
 *      https://www.macrumors.com/2026/09/14/xchat-app-disappears-from-app-store/
 *      https://roboin.io/article/en/2026/06/13/x-for-ios-adopts-liquid-glass/
 *  - Dim was removed in Feb/Mar 2026; dark mode is the black ("Lights out") theme
 *    and follows the system appearance.  https://socialbee.com/blog/x-updates-news/
 *
 * Sources and measurements (pt = px / scale)
 *  [A] X App Store listing, screenshot 8 "Chat freely" (iTunes lookup id 333903271,
 *      v12.35, Oct 2026), 1284×2778, phone at 2.50 px/pt on a 393pt screen (scale
 *      fixed from the 9:41 / signal / Wi-Fi glyph sizes). Pixel-scanned.
 *  [B] X web design tokens, abs.twimg.com/x-web/x-web/assets/styles-DmNcozGx.css:
 *      light bg-secondary = neutral-000 #F2F2F2, dark bg-secondary = neutral-1000
 *      #141414, fg-secondary black-60 / white-60, bg-inputs black-04 / white-08,
 *      btn-tertiary black-04 / white-10, brand blue-500 #1D9BF0,
 *      font "TwitterChirp, -apple-system, …".
 *  [C] X web icon modules (same CDN): icon-arrow-left, icon-plus, icon-phone,
 *      icon-video-cam, icon-player-play — the SVG paths below are X's own.
 *  [D] XChat launch film (video.twimg.com/amplify_video/2047746842713313280, the
 *      same Chat UI kit): grouping, "Seen", "<name> is typing..." shimmer row,
 *      image radius, entrance motion. Frames measured at ≈2.5 px/pt.
 *
 * Key values
 *  - Header [A]: no bar, same colour as the thread. Back arrow (X arrow-left) ink
 *    16×15pt at x 16; 32pt avatar at x 48; name 17pt bold, 12pt after the avatar;
 *    row centred 84pt from the top of the screen (status bar 54 + 60pt row).
 *  - Date [A]: "Today", 13pt regular, fg-secondary, centred, no chip; centre 13.6pt
 *    below the header, first message 13.5pt below it.
 *  - Bubbles [A][D]: 17pt text on a 22pt line, insets 10.4 × 16 → a 42.8pt pill;
 *    radius 21.4 everywhere (no tail, no flattened group corners). 16pt from the
 *    screen edge. Outgoing #1D9BF0 / white text (sampled #1D9BF0 in [A]); incoming
 *    #F2F2F2 (light) / #141414 (dark, sampled #141414 in [A]). 2pt between bubbles
 *    of a run, ~16pt between senders. No avatars in 1:1 chats [D].
 *  - Receipt [A][D]: "Seen" / "Sent" under the user's latest message, 12pt,
 *    fg-secondary (#999 sampled), right edge aligned with the bubble text (16pt in).
 *  - Images [D]: own rounded rect, radius 22, up to 300pt wide, caption as a separate
 *    pill 2pt below.
 *  - Typing [D]: no bubble — a 13pt row "<name> is typing..." with a 13pt avatar,
 *    a white highlight sweeping across grey text.
 *  - Composer [A]: 44pt "+" circle (btn-tertiary) at x 16, 8pt gap, 44pt capsule
 *    (bg-inputs) to 15pt from the right, "Message" placeholder 17pt at 16pt inset,
 *    waveform (voice) glyph 14pt from the end; bottom 35pt above the screen edge.
 *  - Motion [D]: outgoing pills rise ~28pt from the composer and settle on a quick,
 *    lightly damped spring while scaling 0.94→1; incoming pills fade up 10pt. The
 *    keyframes are generated from the same functions as `xIosMotion.enterStyle`.
 *
 *  - Reactions [C] (X Chat client, pin-page-rweb chunk: Mq/wq/dq): a rounded-full chip
 *    under the bubble, -mt-2.5 (tucked under its bottom edge), mx-3 from the bubble
 *    edge on the sender's side, h-5 content, px-2, min-w-10, 1px border in the page
 *    colour (--x-bg-alpha-100), emoji 18px × 0.84; selected (= my reaction) fills
 *    chat-accent #1D9BF0, otherwise gray-50 (the incoming-bubble fill); the count only
 *    shows from 2. Web px are scaled by 17/15 (iOS body / web body) for iOS.
 *  - Replies [C] (u2/d2/f2/p2): a column above the bubble on the same side, gap-1:
 *    icon-reply-alt + the quoted sender's display name (subtext2 13/16, gray-700),
 *    then the quoted text in a px-3 py-1.5 pill, 2 lines max — gray-50 fill + gray-700
 *    text when it quotes them, 1px chat-accent/50 outline + accent text when it quotes
 *    me; voice → icon-voice + "Voice message"; photo → 25% thumbnail, rounded-sm,
 *    gray-200 hairline.
 *  - Compose typing [D] (launch film 0:21, "We are leaving on the 18t|"): text in the
 *    capsule in the normal text colour with a white/black 2pt caret, the capsule grows
 *    keeping 22pt corners, and the trailing voice glyph is replaced by a 36pt
 *    #1D9BF0 disc with a white icon-arrow-up (18pt), 4pt from the capsule's end and
 *    bottom. The client swaps voice ↔ send with an 80 ms opacity/scale 0.9 fade [C].
 *
 * Uncertain (no primary capture found): the 1:1 header's trailing call buttons
 * (phone + video drawn, from X's icon set), light-mode composer fills (taken from
 * the tokens), the Arabic receipt/typing strings, and the voice-bubble layout.
 */

import type { CSSProperties, ReactNode } from "react";
import { useLayoutEffect, useRef, useState } from "react";

import type { Message, Person } from "../../types";
import { Avatar, dirOf, SystemBottomBar, useChatScroll } from "../shared";
import { StatusBar } from "../devices/StatusBar";
import type { Lang } from "./chrome";
import { groupInfo, type PlatformMotion, type PlatformProps } from "./types";

/* ------------------------------- tokens ------------------------------- */

/** X ships its own face (Chirp); fall back to the iPhone stack used elsewhere. */
const X_FONT =
  '"TwitterChirp", "Chirp", -apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro", var(--font-inter), system-ui, var(--font-tajawal), sans-serif';

interface Palette {
  bg: string;
  fg: string;
  secondary: string;
  inBubble: string;
  inText: string;
  input: string;
  plusFill: string;
  photoFill: string;
  avatarBg: string;
  avatarFg: string;
  /** gray-200 hairline around reply thumbnails */
  hairline: string;
}

const BLUE = "#1d9bf0";

const LIGHT: Palette = {
  bg: "#ffffff",
  fg: "#000000",
  secondary: "#666666", // black-60 on white
  inBubble: "#f2f2f2", // neutral-000
  inText: "#000000",
  input: "#f5f5f5", // black-04 on white
  plusFill: "#f5f5f5",
  photoFill: "#ebebeb",
  avatarBg: "#ccd6dd",
  avatarFg: "#ffffff",
  hairline: "#e5e5e5",
};

const DARK: Palette = {
  bg: "#000000",
  fg: "#ffffff",
  secondary: "#999999", // white-60 on black
  inBubble: "#141414", // neutral-1000
  inText: "#ffffff",
  input: "#141414", // white-08 on black
  plusFill: "#1a1a1a", // white-10 on black
  photoFill: "#1f1f1f",
  avatarBg: "#3b3b3b",
  avatarFg: "#8a8a8a",
  hairline: "#2e2e2e",
};

interface Strings {
  today: string;
  placeholder: string;
  seen: string;
  sent: string;
  typing: (n: string) => string;
  voice: string;
  photo: string;
}

/* X Chat bundle strings; "Voice message" / "Photo" are the reply-preview labels. */
const LOCAL: Record<Lang, Strings> = {
  en: { today: "Today", placeholder: "Message", seen: "Seen", sent: "Sent", typing: (n) => `${n} is typing …`, voice: "Voice message", photo: "Photo" },
  ar: { today: "اليوم", placeholder: "رسالة", seen: "تمت المشاهدة", sent: "تم الإرسال", typing: (n) => `${n} يكتب …`, voice: "رسالة صوتية", photo: "الصورة" },
};

/* metrics (pt) */
const SIDE = 16;
const RADIUS = 21.4;
const PAD_Y = 10.4;
const PAD_X = 16;
const LINE = 22;
const MAX_W = 300;
const IMG_MAX_W = 300;
const IMG_MAX_H = 360;
const IMG_RADIUS = 22;
const GAP_GROUP = 2;
const GAP_SENDER = 16;
const GAP_AFTER_RECEIPT = 14;
const HEADER_H = 60;
const COMPOSER_H = 44;

/* Reply preview + reaction chip: X Chat client metrics (web px) × 17/15 (iOS body / web body). */
const QUOTE_TEXT = 15; // subtext2 13px
const QUOTE_LINE = 18; // 16px
const QUOTE_PAD_Y = 7; // py-1.5
const QUOTE_PAD_X = 14; // px-3
const QUOTE_GAP = 4.5; // gap-1
const THUMB_SCALE = 0.25; // reply thumbnails are 25% of the media size
const THUMB_RADIUS = 9; // rounded-sm 8px
const CHIP_H = 23; // h-5 row
const CHIP_PAD_X = 9; // px-2
const CHIP_MIN_W = 45; // min-w-10
const CHIP_RING = 1.5; // 1px border in the page colour
const CHIP_EMOJI = 17; // 18px × 0.84
const CHIP_OVERLAP = 11; // -mt-2.5
const CHIP_INSET = 14; // mx-3
const CHIP_AFTER = 4; // pb-1

/* Compose typing [D]: capsule grows with fixed 22pt corners, send disc bottom-aligned. */
const SEND_D = 36;
const SEND_INSET = (COMPOSER_H - SEND_D) / 2;
const DRAFT_MAX_LINES = 5;
const CARET_PERIOD = 1000;

/* ------------------------------ motion ------------------------------ */

function spring(t: number, zeta: number, omega: number): number {
  if (t <= 0) return 0;
  const wd = omega * Math.sqrt(1 - zeta * zeta);
  return 1 - Math.exp(-zeta * omega * t) * (Math.cos(wd * t) + ((zeta * omega) / wd) * Math.sin(wd * t));
}

/** Spring normalised to land exactly on 1 at p = 1. */
function springP(p: number, durS: number, zeta: number, omega: number): number {
  const c = Math.min(1, Math.max(0, p));
  const end = spring(durS, zeta, omega);
  return spring(c * durS, zeta, omega) + (1 - end) * c;
}

const OUT_MS = 420;
const IN_MS = 300;
const TYPING_IN_MS = 220;

function outFrame(p: number) {
  const s = springP(p, OUT_MS / 1000, 0.82, 19);
  const o = Math.min(1, p / 0.16);
  return {
    opacity: 1 - (1 - o) * (1 - o),
    transform: `translateY(${((1 - s) * 28).toFixed(2)}px) scale(${(0.94 + 0.06 * s).toFixed(4)})`,
  };
}

function inFrame(p: number) {
  const c = Math.min(1, Math.max(0, p));
  const e = 1 - Math.pow(1 - c, 3); // ease-out cubic
  const o = Math.min(1, c / 0.6);
  return {
    opacity: o,
    transform: `translateY(${((1 - e) * 10).toFixed(2)}px) scale(${(0.97 + 0.03 * e).toFixed(4)})`,
  };
}

function originFor(mine: boolean, rtl: boolean): string {
  const right = mine ? !rtl : rtl;
  return right ? "100% 100%" : "0% 100%";
}

export const xIosMotion: PlatformMotion = {
  enterMs: OUT_MS,
  enterStyle: (p, mine, rtl) => {
    // One exporter duration: incoming rows finish their shorter fade inside it.
    const f = mine ? outFrame(p) : inFrame(Math.min(1, (p * OUT_MS) / IN_MS));
    return { ...f, transformOrigin: originFor(mine, rtl) };
  },
};

function keyframes(name: string, frame: (p: number) => { opacity: number; transform: string }, steps = 24): string {
  let out = `@keyframes ${name}{`;
  for (let i = 0; i <= steps; i++) {
    const p = i / steps;
    const f = frame(p);
    out += `${(p * 100).toFixed(2)}%{opacity:${f.opacity.toFixed(4)};transform:${f.transform}}`;
  }
  return out + "}";
}

/* typing shimmer: a highlight that sweeps across the label, char by char */
const SHIM_PERIOD = 1800;
const SHIM_STEP = 45;
/** highlight amount (0..1) at a phase in [0,1) — mirrors the x-ios-shim keyframes */
function shimAt(phase: number): number {
  const x = ((phase % 1) + 1) % 1;
  if (x < 0.15) return x / 0.15;
  if (x < 0.6) return 1;
  if (x < 0.75) return 1 - (x - 0.6) / 0.15;
  return 0;
}

const STYLE = [
  keyframes("x-ios-out", outFrame),
  keyframes("x-ios-in", inFrame),
  "@keyframes x-ios-fade{from{opacity:0}to{opacity:1}}",
  `.x-ios-anim-out{animation:x-ios-out ${OUT_MS}ms linear both}`,
  `.x-ios-anim-in{animation:x-ios-in ${IN_MS}ms linear both}`,
  `.x-ios-anim-typing{animation:x-ios-fade ${TYPING_IN_MS}ms ease-out both}`,
  ".x-ios-anim-receipt{animation:x-ios-fade 200ms ease-out both}",
  "@keyframes x-ios-caret{0%,50%{opacity:1}50.01%,100%{opacity:0}}",
  `.x-ios-caret{animation:x-ios-caret ${CARET_PERIOD}ms linear infinite}`,
  "@keyframes x-ios-send{from{opacity:0;transform:scale(.9)}to{opacity:1;transform:scale(1)}}",
  ".x-ios-send{animation:x-ios-send 80ms ease-out both}",
  "@keyframes x-ios-shim{0%{color:var(--x-sec)}15%{color:var(--x-pri)}60%{color:var(--x-pri)}75%{color:var(--x-sec)}100%{color:var(--x-sec)}}",
].join("\n");

/* ------------------------------ X glyphs ------------------------------ */
/* Paths are X's own icon set [C] (24×24, fill currentColor). */

function ArrowBack({ color }: { color: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={color} className="rtl:-scale-x-100" style={{ display: "block" }}>
      <path d="M7.414 13l5.043 5.04-1.414 1.42L3.586 12l7.457-7.46 1.414 1.42L7.414 11H21v2H7.414z" />
    </svg>
  );
}

function PhoneGlyph({ color }: { color: string }) {
  return (
    <svg width="23" height="23" viewBox="0 0 24 24" fill={color} style={{ display: "block" }}>
      <path d="M3 6.42A3.4 3.4 0 0 1 6.42 3h3.2l2.6 5.2-1.53 1.52a7 7 0 0 0 3.58 3.59l1.53-1.53 5.2 2.6v3.2A3.4 3.4 0 0 1 17.58 21 14.6 14.6 0 0 1 3 6.42m2 0C5 13.37 10.63 19 17.58 19c.78 0 1.42-.64 1.42-1.42v-1.96l-2.8-1.4-1 .99-.46.46-.61-.24a9.3 9.3 0 0 1-5.56-5.56l-.24-.61.46-.47 1-.99L8.38 5H6.41C5.64 5 5 5.64 5 6.42" />
    </svg>
  );
}

function VideoGlyph({ color }: { color: string }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill={color} style={{ display: "block" }}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M13.73 4a4.5 4.5 0 0 1 4.16 3.51l4.61-2.05v13.08l-4.61-2.05A4.5 4.5 0 0 1 13.5 20H6a4.5 4.5 0 0 1-4.5-4.5v-7A4.5 4.5 0 0 1 6 4zM6 6a2.5 2.5 0 0 0-2.5 2.5v7A2.5 2.5 0 0 0 6 18h7.5a2.5 2.5 0 0 0 2.5-2.5v-7a2.5 2.5 0 0 0-2.24-2.49L13.5 6zm12 3.65v4.7l2.5 1.11V8.54z"
      />
    </svg>
  );
}

function PlusGlyph({ color }: { color: string }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill={color} style={{ display: "block" }}>
      <path d="M11 11V4h2v7h7v2h-7v7h-2v-7H4v-2h7z" />
    </svg>
  );
}

/** Voice-message glyph at the end of the input capsule (five rounded bars). */
function WaveformGlyph({ color }: { color: string }) {
  const bars = [7, 15, 10.5, 17, 7.5];
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ display: "block" }}>
      {bars.map((h, i) => (
        <line
          key={i}
          x1={1 + i * 4}
          x2={1 + i * 4}
          y1={9 - h / 2 + 1}
          y2={9 + h / 2 - 1}
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
        />
      ))}
    </svg>
  );
}

/** X icon-reply-alt (12×12 grid), drawn at 1em of the reply-name label [C]. */
function ReplyAltGlyph({ color, size }: { color: string; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" fill={color} style={{ display: "block", flexShrink: 0 }}>
      <path d="M3.393 5.565L4.826 7L3.942 7.88L1 4.94L3.942 2L4.826 2.88L3.393 4.315H6.634C8.498 4.315 10.009 5.825 10.009 7.69V9.44H8.759V7.69C8.759 6.515 7.8075 5.565 6.634 5.565H3.393Z" />
    </svg>
  );
}

/** X icon-voice — shown in the reply preview of a voice note [C]. */
function VoiceIcon({ color, size }: { color: string; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} style={{ display: "block", flexShrink: 0 }}>
      <path d="M7 21V3h2v18H7zm8-2V5h2v14h-2zm-4-2V7h2v10h-2zm-8-2V9h2v6H3zm16 0V9h2v6h-2z" />
    </svg>
  );
}

/** X icon-arrow-up — the composer send glyph [C]. */
function ArrowUpGlyph({ color, size }: { color: string; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} style={{ display: "block" }}>
      <path d="M12 3.59l7.457 7.45-1.414 1.42L13 7.41V21h-2V7.41l-5.043 5.05-1.414-1.42L12 3.59z" />
    </svg>
  );
}

function PlayGlyph({ color, size }: { color: string; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} style={{ display: "block" }}>
      <path d="M6 17.93V6.07a2 2 0 0 1 3.05-1.7l9.67 5.92a2 2 0 0 1 0 3.42l-9.67 5.92A2 2 0 0 1 6 17.93" />
    </svg>
  );
}

function PhotoGlyph({ color }: { color: string }) {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill={color} style={{ display: "block" }}>
      <path d="M14.1 2.5q1.65-.02 2.7.06c.74.06 1.38.18 1.97.48a5 5 0 0 1 2.19 2.19c.3.6.42 1.23.48 1.96q.08 1.06.06 2.71v4.2q.02 1.65-.06 2.7a5 5 0 0 1-.48 1.97 5 5 0 0 1-2.19 2.19c-.6.3-1.23.42-1.96.48q-1.06.08-2.71.06H9.9q-1.65.02-2.7-.06a5 5 0 0 1-1.97-.48 5 5 0 0 1-2.19-2.19c-.3-.6-.42-1.23-.48-1.96q-.07-1.06-.06-2.71V9.9q-.02-1.65.06-2.7c.06-.74.18-1.38.48-1.97a5 5 0 0 1 2.19-2.19c.6-.3 1.23-.42 1.96-.48q1.06-.07 2.71-.06zm-4.2 2c-1.14 0-1.93 0-2.55.05-.6.05-.95.14-1.21.28a3 3 0 0 0-1.31 1.3 3 3 0 0 0-.28 1.22c-.05.62-.05 1.41-.05 2.55v2.87l3.54-3.14 6.17 6.16-1.42 1.42-4.83-4.84-3.45 3.07q0 .7.04 1.2c.05.61.14.96.28 1.22a3 3 0 0 0 1.3 1.31c.27.14.62.23 1.22.28.62.05 1.41.05 2.55.05h4.2c1.14 0 1.93 0 2.55-.05.6-.05.95-.14 1.21-.28a3 3 0 0 0 1.31-1.3c.14-.27.23-.62.28-1.22.05-.62.05-1.41.05-2.55V9.9c0-1.14 0-1.93-.05-2.55a3 3 0 0 0-.28-1.21 3 3 0 0 0-1.3-1.31 3 3 0 0 0-1.22-.28c-.62-.05-1.41-.05-2.55-.05z" />
      <path d="M15 7a2 2 0 1 1 0 4 2 2 0 0 1 0-4" />
    </svg>
  );
}

/* ------------------------------- avatar ------------------------------- */

/** The user's photo, or X's default profile picture (grey disc + silhouette). */
function XAvatar({ person, size, p }: { person: Person; size: number; p: Palette }) {
  if (person.avatar) return <Avatar person={person} size={size} />;
  return (
    <div
      className="shrink-0 overflow-hidden rounded-full"
      style={{ width: size, height: size, background: p.avatarBg }}
      aria-hidden
    >
      <svg width={size} height={size} viewBox="0 0 40 40" fill={p.avatarFg} style={{ display: "block" }}>
        <circle cx="20" cy="15.5" r="7" />
        <path d="M6.5 37c1.2-7.6 6.6-12 13.5-12s12.3 4.4 13.5 12z" />
      </svg>
    </div>
  );
}

/* ------------------------------ helpers ------------------------------ */

const EMOJI_ONLY = new RegExp("^(?:\\p{Extended_Pictographic}|\\p{Emoji_Component}|\\u200d|\\ufe0f|\\s)+$", "u");
function emojiCount(text: string): number {
  const t = text.trim();
  if (!t || !EMOJI_ONLY.test(t) || /^[\d#*\s]+$/.test(t)) return 0;
  const s = t.replace(/\s/g, "");
  const n =
    typeof Intl !== "undefined" && "Segmenter" in Intl
      ? [...new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(s)].length
      : Array.from(s).length;
  return n <= 3 ? n : 0;
}
const JUMBO_SIZE = [0, 48, 42, 36];

/** Deterministic speech-like waveform for voice bubbles. */
function waveform(seed: string, n = 26): number[] {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0;
    const r = (h % 1000) / 1000;
    const k = i / (n - 1);
    const envelope = 0.4 + 0.6 * Math.sin(Math.PI * k);
    out.push(Math.max(3, Math.round((3 + r * 17 * envelope) * 2) / 2));
  }
  return out;
}

/* ------------------------------- bubbles ------------------------------- */

function TextBubble({ m, mine, p }: { m: Message; mine: boolean; p: Palette }) {
  return (
    <div
      style={{
        maxWidth: MAX_W,
        minWidth: 2 * RADIUS,
        background: mine ? BLUE : p.inBubble,
        color: mine ? "#ffffff" : p.inText,
        borderRadius: RADIUS,
      }}
    >
      <p
        dir={dirOf(m.text)}
        className="whitespace-pre-wrap break-words"
        style={{ margin: 0, padding: `${PAD_Y}px ${PAD_X}px`, fontSize: 17, lineHeight: `${LINE}px`, textAlign: "start" }}
      >
        {m.text}
      </p>
    </div>
  );
}

function VoiceBubble({ m, mine, p }: { m: Message; mine: boolean; p: Palette }) {
  const fg = mine ? "#ffffff" : p.inText;
  const dim = mine ? "rgba(255,255,255,0.55)" : p.secondary;
  const bars = waveform(m.id);
  return (
    <div
      dir="ltr"
      className="flex items-center"
      style={{
        height: 2 * RADIUS,
        background: mine ? BLUE : p.inBubble,
        borderRadius: RADIUS,
        paddingLeft: 12,
        paddingRight: 16,
        gap: 10,
      }}
    >
      <PlayGlyph color={fg} size={22} />
      <span className="flex items-center" style={{ gap: 2, height: 22 }}>
        {bars.map((b, i) => (
          <span key={i} className="block rounded-full" style={{ width: 2.5, height: b, background: dim }} />
        ))}
      </span>
      <span style={{ color: fg, fontSize: 15, lineHeight: "20px", fontVariantNumeric: "tabular-nums" }}>
        {(m.voiceDuration || "0:09").trim()}
      </span>
    </div>
  );
}

/** Bubble size of a photo (pt), shared by the image bubble and its reply thumbnail. */
function fitImage(src: string | null | undefined, ratio: number | null): { w: number; h: number } {
  let w = IMG_MAX_W;
  let h = 225;
  if (src) {
    const r = ratio ?? 3 / 4;
    h = w / r;
    if (h > IMG_MAX_H) {
      h = IMG_MAX_H;
      w = Math.max(160, h * r);
    }
    h = Math.max(150, h);
  }
  return { w, h };
}

function ImageBubble({ src, p }: { src?: string | null; p: Palette }) {
  const [ratio, setRatio] = useState<number | null>(null);
  const { w, h } = fitImage(src, ratio);
  return (
    <div className="overflow-hidden" style={{ width: Math.round(w), height: Math.round(h), borderRadius: IMG_RADIUS, background: p.photoFill }}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt=""
          draggable={false}
          className="block h-full w-full object-cover"
          onLoad={(e) => {
            const im = e.currentTarget;
            if (im.naturalWidth && im.naturalHeight) setRatio(im.naturalWidth / im.naturalHeight);
          }}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <PhotoGlyph color={p.secondary} />
        </div>
      )}
    </div>
  );
}

/** 25%-scale photo thumbnail of the reply preview (rounded-sm, gray-200 hairline) [C]. */
function ReplyThumb({ src, p }: { src?: string | null; p: Palette }) {
  const [ratio, setRatio] = useState<number | null>(null);
  const { w, h } = fitImage(src, ratio);
  return (
    <div
      className="overflow-hidden"
      style={{
        width: Math.round(w * THUMB_SCALE),
        height: Math.round(h * THUMB_SCALE),
        borderRadius: THUMB_RADIUS,
        border: `1px solid ${p.hairline}`,
        background: p.photoFill,
      }}
    >
      {src && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt=""
          draggable={false}
          className="block h-full w-full object-cover"
          onLoad={(e) => {
            const im = e.currentTarget;
            if (im.naturalWidth && im.naturalHeight) setRatio(im.naturalWidth / im.naturalHeight);
          }}
        />
      )}
    </div>
  );
}

/**
 * X Chat's reply preview, stacked above the replying bubble on the same side [C]:
 *  - a name row: icon-reply-alt + the quoted sender's display name (subtext2, gray-700);
 *  - the quoted text in a small pill, two lines max — filled gray-50 / gray-700 when
 *    it quotes the other person, outlined chat-accent/50 with accent text when it
 *    quotes me; a voice note becomes "🎙 Voice message", a photo a 25% thumbnail.
 */
function ReplyPreview({ target, name, mine, p, l }: { target: Message; name: string; mine: boolean; p: Palette; l: Strings }) {
  const quotesMe = target.sender === "me";
  const pill: CSSProperties = quotesMe
    ? { border: `1px solid rgba(29,155,240,0.5)`, color: BLUE, padding: `${QUOTE_PAD_Y - 1}px ${QUOTE_PAD_X - 1}px` }
    : { background: p.inBubble, color: p.secondary, padding: `${QUOTE_PAD_Y}px ${QUOTE_PAD_X}px` };
  const text = target.text.trim();
  return (
    <div className="flex flex-col" style={{ alignItems: mine ? "flex-end" : "flex-start", gap: QUOTE_GAP, marginTop: 2, marginBottom: QUOTE_GAP, maxWidth: MAX_W }}>
      <div className="flex min-w-0 items-center" style={{ gap: QUOTE_GAP, paddingInline: 9, color: p.secondary, maxWidth: "100%" }}>
        <ReplyAltGlyph color={p.secondary} size={QUOTE_TEXT} />
        <span dir={dirOf(name)} className="truncate" style={{ fontSize: QUOTE_TEXT, lineHeight: `${QUOTE_LINE}px` }}>
          {name}
        </span>
      </div>
      {target.type === "image" && <ReplyThumb src={target.imageSrc} p={p} />}
      {target.type === "voice" ? (
        <div className="flex items-center" style={{ ...pill, gap: 7, borderRadius: RADIUS }}>
          <VoiceIcon color="currentColor" size={18} />
          <span style={{ fontSize: QUOTE_TEXT, lineHeight: `${QUOTE_LINE}px`, whiteSpace: "nowrap" }}>{l.voice}</span>
        </div>
      ) : text ? (
        <div style={{ ...pill, borderRadius: RADIUS, maxWidth: "100%" }}>
          <p
            dir={dirOf(text)}
            className="break-words"
            style={{
              margin: 0,
              fontSize: QUOTE_TEXT,
              lineHeight: `${QUOTE_LINE}px`,
              textAlign: "start",
              display: "-webkit-box",
              WebkitBoxOrient: "vertical",
              WebkitLineClamp: 2,
              overflow: "hidden",
            }}
          >
            {text}
          </p>
        </div>
      ) : null}
    </div>
  );
}

/**
 * X Chat reaction chip [C]: a rounded-full pill (h-5 content, px-2, min-w-10) ringed in
 * the page colour, tucked 10px up under the bubble and inset 12px from its edge. My own
 * reaction is the selected state (chat-accent fill); theirs uses the gray-50 fill.
 * The count only appears from 2 reactors, so a single emoji shows alone.
 */
function ReactionChip({ emoji, mine, p }: { emoji: string; mine: boolean; p: Palette }) {
  const selected = !mine; // reaction on their message = mine
  return (
    <div
      className="relative flex"
      style={{ justifyContent: mine ? "flex-end" : "flex-start", paddingInline: CHIP_INSET, marginTop: -CHIP_OVERLAP, marginBottom: CHIP_AFTER, zIndex: 1 }}
    >
      <div
        className="flex items-center justify-center rounded-full"
        style={{
          height: CHIP_H + 2 * CHIP_RING,
          minWidth: CHIP_MIN_W,
          paddingInline: CHIP_PAD_X,
          background: selected ? BLUE : p.inBubble,
          border: `${CHIP_RING}px solid ${p.bg}`,
          boxSizing: "border-box",
        }}
      >
        <span style={{ fontSize: CHIP_EMOJI, lineHeight: `${CHIP_H}px`, display: "block" }}>{emoji}</span>
      </div>
    </div>
  );
}

/** The text caret: a 2pt bar in the text colour, blinking (clockMs-driven in exports). */
function Caret({ color, clockMs, height }: { color: string; clockMs?: number; height: number }) {
  const on = clockMs === undefined ? undefined : clockMs % CARET_PERIOD < CARET_PERIOD / 2;
  return (
    <span
      aria-hidden
      className={clockMs === undefined ? "x-ios-caret" : undefined}
      style={{
        display: "inline-block",
        width: 2,
        height,
        marginInlineStart: 1,
        verticalAlign: -4,
        borderRadius: 1,
        background: color,
        opacity: on === false ? 0 : undefined,
      }}
    />
  );
}

/** "<name> is typing..." with the sweeping highlight. Export frames compute it from clockMs. */
function TypingRow({
  person,
  p,
  label,
  live,
  clockMs,
  boxRef,
}: {
  person: Person;
  p: Palette;
  label: string;
  live: boolean;
  clockMs?: number;
  boxRef: React.RefObject<HTMLDivElement | null>;
}) {
  const chars = Array.from(label);
  return (
    <div
      ref={boxRef}
      className={`flex items-center ${live ? "x-ios-anim-typing" : ""}`}
      style={{ paddingInline: SIDE, gap: 3.5, height: 18 }}
    >
      <XAvatar person={person} size={13} p={p} />
      <span
        dir={dirOf(label)}
        className="truncate"
        style={{ fontSize: 13, lineHeight: "18px", whiteSpace: "pre" }}
      >
        {chars.map((c, i) => {
          if (clockMs !== undefined) {
            const k = shimAt((clockMs - i * SHIM_STEP) / SHIM_PERIOD);
            return (
              <span key={i} style={{ color: p.secondary, position: "relative" }}>
                {c}
                {k > 0 && (
                  <span aria-hidden className="absolute inset-0" style={{ color: p.fg, opacity: k }}>
                    {c}
                  </span>
                )}
              </span>
            );
          }
          return (
            <span
              key={i}
              style={{
                color: p.secondary,
                animation: `x-ios-shim ${SHIM_PERIOD}ms linear infinite`,
                animationDelay: `${i * SHIM_STEP - SHIM_PERIOD}ms`,
              }}
            >
              {c}
            </span>
          );
        })}
      </span>
    </div>
  );
}

/* ------------------------------ component ------------------------------ */

export function XChat({ scenario, playback, lang, rtl }: PlatformProps) {
  const dark = scenario.theme === "dark";
  const p = dark ? DARK : LIGHT;
  const l = LOCAL[lang];
  const { messages, clockMs } = playback;
  const live = playback.isLive;
  const typing = playback.typing || scenario.presence === "typing";
  const scrollRef = useChatScroll<HTMLDivElement>(`${messages.length}-${typing}`);
  const typingRef = useRef<HTMLDivElement>(null);
  const typingSince = useRef<number | undefined>(undefined);
  const draft = playback.draft;
  const composerRef = useRef<HTMLDivElement>(null);
  const composerH = useRef<number | undefined>(undefined);

  // As the composer grows with the draft, keep the thread pinned to its bottom (the
  // real list scrolls with the input instead of hiding its last rows).
  useLayoutEffect(() => {
    const box = composerRef.current;
    const list = scrollRef.current;
    if (!box || !list) return;
    const h = box.offsetHeight;
    const prev = composerH.current;
    composerH.current = h;
    if (prev !== undefined && h !== prev) list.scrollTop += h - prev;
  }, [draft?.text, scrollRef]);

  // Typing row entrance in exported frames (CSS animations don't run there).
  useLayoutEffect(() => {
    const el = typingRef.current;
    if (clockMs === undefined || !typing) {
      typingSince.current = undefined;
      return;
    }
    if (typingSince.current === undefined) typingSince.current = clockMs;
    if (!el) return;
    const t = (clockMs - typingSince.current) / TYPING_IN_MS;
    el.style.opacity = t >= 1 ? "" : String(Math.max(0, t));
  }, [typing, clockMs]);

  // The receipt sits under the user's most recent message, even after replies.
  let lastMineId: string | undefined;
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].sender === "me") {
      lastMineId = messages[i].id;
      break;
    }
  }

  const byId = new Map(messages.map((m) => [m.id, m]));
  const rows: ReactNode[] = [];
  let prevHadReceipt = false;
  messages.forEach((m, i) => {
    const mine = m.sender === "me";
    const { firstOfGroup } = groupInfo(messages, i);
    const status = mine && m.id === lastMineId ? playback.statusOf(m) : undefined;
    const hasText = m.text.trim().length > 0;
    const emojis = m.type === "text" ? emojiCount(m.text) : 0;

    let content: ReactNode;
    if (m.type === "voice") {
      content = <VoiceBubble m={m} mine={mine} p={p} />;
    } else if (m.type === "image") {
      content = (
        <>
          <ImageBubble src={m.imageSrc} p={p} />
          {hasText && (
            <div style={{ marginTop: GAP_GROUP }}>
              <TextBubble m={m} mine={mine} p={p} />
            </div>
          )}
        </>
      );
    } else if (emojis) {
      const fs = JUMBO_SIZE[emojis];
      content = (
        <div dir="ltr" style={{ fontSize: fs, lineHeight: `${Math.round(fs * 1.2)}px` }}>
          {m.text.trim()}
        </div>
      );
    } else {
      content = <TextBubble m={m} mine={mine} p={p} />;
    }

    const target = m.replyToId ? byId.get(m.replyToId) : undefined;
    const reaction = m.reaction?.trim();
    if (target || reaction) {
      content = (
        <div className="flex max-w-full flex-col" style={{ alignItems: mine ? "flex-end" : "flex-start" }}>
          {target && (
            <ReplyPreview
              target={target}
              name={target.sender === "me" ? scenario.me.name : scenario.them.name}
              mine={mine}
              p={p}
              l={l}
            />
          )}
          {content}
          {reaction && <ReactionChip emoji={reaction} mine={mine} p={p} />}
        </div>
      );
    }

    let marginTop = 0;
    if (i > 0) marginTop = prevHadReceipt ? GAP_AFTER_RECEIPT : firstOfGroup ? GAP_SENDER : GAP_GROUP;

    rows.push(
      <div
        key={m.id}
        data-mid={m.id}
        data-sender={m.sender}
        className={`flex flex-col ${live ? (mine ? "x-ios-anim-out" : "x-ios-anim-in") : ""}`}
        style={{
          alignItems: mine ? "flex-end" : "flex-start",
          paddingInline: SIDE,
          marginTop,
          transformOrigin: originFor(mine, rtl),
        }}
      >
        {content}
        {status && (
          <div
            key={status}
            className={live ? "x-ios-anim-receipt" : ""}
            style={{
              color: p.secondary,
              fontSize: 12,
              lineHeight: "16px",
              marginTop: 7,
              paddingInlineEnd: PAD_X,
              whiteSpace: "nowrap",
            }}
          >
            {status === "read" ? l.seen : l.sent}
          </div>
        )}
      </div>,
    );
    prevHadReceipt = !!status;
  });

  const last = messages[messages.length - 1];
  const typingGap = !last ? 0 : prevHadReceipt ? GAP_AFTER_RECEIPT : last.sender === "them" ? GAP_GROUP + 4 : GAP_SENDER;

  return (
    <div
      className="flex h-full w-full flex-col overflow-hidden"
      style={
        {
          background: p.bg,
          color: p.fg,
          fontFamily: X_FONT,
          WebkitFontSmoothing: "antialiased",
          "--x-sec": p.secondary,
          "--x-pri": p.fg,
        } as CSSProperties
      }
    >
      <style>{STYLE}</style>

      <StatusBar device={scenario.device} tint={dark ? "light" : "dark"} background={p.bg} />

      {/* ------------------------------ header ------------------------------ */}
      <div className="relative shrink-0" style={{ height: HEADER_H }}>
        <div className="absolute" style={{ insetInlineStart: 13, top: HEADER_H / 2 - 11 }}>
          <ArrowBack color={p.fg} />
        </div>
        <div className="absolute" style={{ insetInlineStart: 48, top: HEADER_H / 2 - 16 }}>
          <XAvatar person={scenario.them} size={32} p={p} />
        </div>
        <div
          className="absolute flex items-center"
          style={{ insetInlineStart: 92, insetInlineEnd: 104, top: 0, height: HEADER_H }}
        >
          <span
            dir={dirOf(scenario.them.name)}
            className="truncate"
            style={{ fontSize: 17, lineHeight: "22px", fontWeight: 700, color: p.fg }}
          >
            {scenario.them.name}
          </span>
        </div>
        <div
          className="absolute flex items-center"
          style={{ insetInlineEnd: 15, top: HEADER_H / 2 - 12, height: 24, gap: 22 }}
        >
          <PhoneGlyph color={p.fg} />
          <VideoGlyph color={p.fg} />
        </div>
      </div>

      {/* ------------------------------- thread ------------------------------- */}
      <div ref={scrollRef} className="rcss-scroll min-h-0 flex-1 overflow-y-auto">
        <div style={{ paddingTop: 5.6, paddingBottom: 16 }}>
          <div className="text-center" style={{ color: p.secondary, fontSize: 13, lineHeight: "16px", marginBottom: 13.5 }}>
            {l.today}
          </div>
          <div className="flex flex-col">
            {rows}
            {typing && (
              <div style={{ marginTop: typingGap }}>
                <TypingRow
                  person={scenario.them}
                  p={p}
                  label={l.typing(scenario.them.name)}
                  live={live}
                  clockMs={clockMs}
                  boxRef={typingRef}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ------------------------------ composer ------------------------------ */}
      <div
        ref={composerRef}
        className="flex shrink-0 items-end"
        style={{ minHeight: COMPOSER_H, paddingInlineStart: SIDE, paddingInlineEnd: 15, gap: 8, marginBottom: 16 }}
      >
        <div
          className="flex shrink-0 items-center justify-center rounded-full"
          style={{ width: COMPOSER_H, height: COMPOSER_H, background: p.plusFill }}
        >
          <PlusGlyph color={p.fg} />
        </div>
        {draft ? (
          <div className="relative min-w-0 flex-1" style={{ background: p.input, borderRadius: COMPOSER_H / 2, minHeight: COMPOSER_H }}>
            <div
              className="flex flex-col justify-end overflow-hidden"
              style={{
                maxHeight: DRAFT_MAX_LINES * LINE + 2 * ((COMPOSER_H - LINE) / 2),
                paddingBlock: (COMPOSER_H - LINE) / 2,
                paddingInlineStart: 16,
                paddingInlineEnd: SEND_INSET + SEND_D + 8,
              }}
            >
              <p
                dir={dirOf(draft.text)}
                className="whitespace-pre-wrap"
                style={{ margin: 0, color: p.fg, fontSize: 17, lineHeight: `${LINE}px`, textAlign: "start", overflowWrap: "anywhere" }}
              >
                {draft.text}
                <Caret color={p.fg} clockMs={clockMs} height={20} />
              </p>
            </div>
            <div
              className={`absolute flex items-center justify-center rounded-full ${live ? "x-ios-send" : ""}`}
              style={{ insetInlineEnd: SEND_INSET, bottom: SEND_INSET, width: SEND_D, height: SEND_D, background: BLUE }}
            >
              <ArrowUpGlyph color="#ffffff" size={18} />
            </div>
          </div>
        ) : (
          <div
            className="flex min-w-0 flex-1 items-center rounded-full"
            style={{ height: COMPOSER_H, background: p.input, paddingInlineStart: 16, paddingInlineEnd: 14 }}
          >
            <span className="flex-1 truncate" style={{ color: p.secondary, fontSize: 17, lineHeight: "22px" }}>
              {l.placeholder}
            </span>
            <WaveformGlyph color={p.fg} />
          </div>
        )}
      </div>

      <SystemBottomBar device={scenario.device} bg={p.bg} fg={p.fg} />
    </div>
  );
}
