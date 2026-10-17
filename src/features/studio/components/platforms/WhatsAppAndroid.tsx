"use client";

/**
 * WhatsApp for Android: chat screen, as it ships in late 2026 (Material 3
 * neutral chrome + the 2026 "modern chat bubbles" refresh).
 *
 * Every value below was measured on real Android screenshots (pixel scans of
 * WABetaInfo captures scaled to dp; body text calibrated as 16sp) or taken
 * from WhatsApp's own design tokens (WDS CSS variables shipped by WhatsApp Web).
 *
 * Sources
 *  [A] WABetaInfo, Android 2.26.41.11 chat screen (Oct 2026):
 *      https://wabetainfo.com/whatsapp-is-testing-a-redesigned-chat-bar-for-android/
 *  [B] WABetaInfo, up to 4 pinned messages (Sep 2026; grouped text bubbles):
 *      https://wabetainfo.com/whatsapp-is-rolling-out-support-for-up-to-4-pinned-messages/
 *  [C] WABetaInfo, refreshed rounder bubbles + borderless media (Mar 2026, 2.26.10.2):
 *      https://wabetainfo.com/whatsapp-is-rolling-out-a-modern-interface-for-chat-bubbles-on-android/
 *  [D] WABetaInfo, deeper dark theme #0b141a -> #0a1014 (2.24.22.4):
 *      https://wabetainfo.com/whatsapp-beta-for-android-2-24-22-4-whats-new/
 *  [E] WABetaInfo raw 1080p chat capture (animated big emoji, 2.24.15.15):
 *      https://wabetainfo.com/whatsapp-beta-for-android-2-24-15-15-whats-new/
 *  [F] WABetaInfo voice-note bubble (2.24.15.5):
 *      https://wabetainfo.com/whatsapp-beta-for-android-2-24-15-5-whats-new/
 *  [G] In-thread typing bubble (2.24.21.18) + user captures on 9to5Google:
 *      https://wabetainfo.com/whatsapp-beta-for-android-2-24-21-18-whats-new/
 *      https://9to5google.com/2024/11/22/whatsapp-new-typing-indicator-more-users/
 *  [W] WhatsApp Design System tokens (web.whatsapp.com main CSS, "WDS-*" vars).
 *
 * Key values (dp == CSS px on the 360dp Samsung screen)
 *  - Top app bar 56 tall. Back arrow centred 24 from the start edge, avatar 38
 *    at x=52, title at x=102. Title 17.5/400, subtitle 12/400, same ink as the
 *    title [A][E]. Icon centres 117 / 67 / 22.5 from the end edge: videocam
 *    (21x16 glyph), call, more_vert [A][E]. Light bar #FFFFFF, ink #0A1014 [W];
 *    dark bar #0A1014, ink #F7F8FA [D][W].
 *  - Bubbles [B][C]: radius 18, flag tail (7x11.5) on the TOP outer corner of
 *    the first bubble of a group, 17 from the screen edge (tail sits inside
 *    that margin), max width = screen - 17 - 62. Text 16/21 with padding
 *    9 / 12 / 10, so a one-line bubble is 40 tall. 4 between bubbles of a group,
 *    10 between senders.
 *    Fill: out #D9FDD3 / in #FFFFFF; dark out #144D37 / in #20272B [W][D].
 *  - Meta 11.5sp, baseline 9 above the bubble bottom, 8 from the end edge.
 *    Colour rgba(0,0,0,.6) / rgba(255,255,255,.6) [W]. Read ticks #007BFC light,
 *    #53BDEB dark (WDS content-read; matches the blue measured in [A]/[G]).
 *  - Date chip: 26 tall, radius 8, 12.5sp/500, 9 side padding, near-white
 *    (#FFFFFF at .95) on light, #1C272D on dark, sentence case ("Today") [A].
 *  - E2E notice: #FFF0D4 / #1C272D, text rgba(0,0,0,.6) / #FFD279, 12.5/16,
 *    "Learn more" in medium weight; current wording [A][W].
 *  - Wallpaper: #F5F2EC with #E3D9C9 doodles (light); #081010 with 11% white
 *    doodles (dark) [A][D][W chat-background/foreground-wallpaper].
 *  - Composer [E][B]: field 48 tall, fully round, white / #20272B, 5 from the
 *    screen edge; sticker-smiley centred 22 in, placeholder at 48 (18sp),
 *    upright paper clip and camera centred 72.5 / 24.5 from the field end;
 *    mic FAB 48: #1DAA61 + white icon (light), #21C063 + #0A1014 icon (dark).
 *    Nav bar strip #F7F8FA (light) / #000000 (dark) [A][D].
 *  - Voice note [F]: full max width; sender avatar 48 at the start with a mic
 *    glyph on its bottom-end corner (green until played, blue once played),
 *    play triangle (never mirrored), 12dp scrubber dot, bar waveform, duration
 *    under the dot and time + ticks at the end.
 *  - Big emoji [E]: 1–3 emoji alone render without a bubble; the time sits in
 *    a small bubble-coloured pill under it.
 *  - Media [C]: borderless; the image IS the bubble (radius 18), time overlaid
 *    in white; a caption continues below in the bubble colour.
 *  - Typing [G]: incoming bubble with the top tail and three grey dots; the
 *    header subtitle also reads "typing…".
 *  - Entrance: new rows rise ~14dp and fade in over 240ms with a decelerate
 *    curve while the list scrolls (RecyclerView-style add). The CSS keyframes
 *    are generated from `whatsappAndroidMotion.enterStyle`, so preview == export.
 */

import { useEffect, useState, type CSSProperties, type ReactNode } from "react";

import type { DeliveryStatus, Message, Person } from "../../types";
import { Avatar, dirOf, SystemBottomBar, useChatScroll } from "../shared";
import { SamsungStatusBar } from "../devices/SamsungStatusBar";
import { CHROME, type Lang } from "./chrome";
import { groupInfo, type PlatformMotion, type PlatformProps } from "./types";

/* ======================================================================
   Palette
   ====================================================================== */

interface AndroidPalette {
  dark: boolean;
  bar: string;
  ink: string;
  sub: string;
  icon: string;
  wall: string;
  doodle: string;
  inBubble: string;
  outBubble: string;
  text: string;
  meta: string;
  read: string;
  shadow: string;
  field: string;
  fieldShadow: string;
  composerIcon: string;
  placeholder: string;
  fab: string;
  fabIcon: string;
  chip: string;
  chipText: string;
  chipShadow: string;
  e2e: string;
  e2eText: string;
  dot: string;
  waveIn: string;
  waveOut: string;
  play: string;
  thumbOut: string;
  unplayed: string;
  played: string;
  imgEmpty: string;
  imgEmptyIcon: string;
  scrollBtn: string;
  scrollIcon: string;
  nav: string;
  navFg: string;
}

/* ======================================================================
   Metrics (dp)
   ====================================================================== */

const RADIUS = 18;
const EDGE = 17; // screen edge -> bubble body (own side)
const FAR = 62; // gap kept on the opposite side
const TAIL_W = 7;
const GAP_IN_GROUP = 4;
const GAP_BETWEEN = 10;
const META_FS = 11.5;

/* ======================================================================
   Localised strings the shared CHROME map does not carry
   ====================================================================== */

const STR: Record<Lang, { e2e: string; more: string; placeholder: string }> = {
  en: {
    e2e: "Messages and calls are end-to-end encrypted. Only people in this chat can read, listen to, or share them.",
    more: "Learn more",
    placeholder: "Message",
  },
  ar: {
    e2e: "الرسائل والمكالمات مشفرة تمامًا بين الطرفين. يمكن فقط للأشخاص في هذه الدردشة قراءتها أو الاستماع إليها أو مشاركتها.",
    more: "معرفة المزيد",
    placeholder: "مراسلة",
  },
};

/* ======================================================================
   Entrance motion (shared by the live CSS and the video exporter)
   ====================================================================== */

const ENTER_MS = 240;
const ENTER_RISE = 14;

function enterStyleAt(p: number) {
  const t = Math.min(1, Math.max(0, p));
  // Material "decelerate" feel: fast start, gentle landing.
  const e = 1 - Math.pow(1 - t, 3);
  const a = Math.min(1, t / 0.55);
  const opacity = 1 - Math.pow(1 - a, 2);
  return {
    opacity: Math.round(opacity * 1000) / 1000,
    transform: `translateY(${Math.round((1 - e) * ENTER_RISE * 100) / 100}px)`,
    transformOrigin: "center bottom",
  };
}

export const whatsappAndroidMotion: PlatformMotion = {
  enterMs: ENTER_MS,
  enterStyle: (p) => enterStyleAt(p),
};

/** Keyframes sampled from the exact same function, played with linear timing. */
const ENTER_KEYFRAMES = (() => {
  const steps: string[] = [];
  for (let i = 0; i <= 20; i++) {
    const s = enterStyleAt(i / 20);
    steps.push(`${i * 5}%{opacity:${s.opacity};transform:${s.transform}}`);
  }
  return `@keyframes wa-android-enter{${steps.join("")}}`;
})();

const TYPING_PERIOD = 1200;
const TYPING_STAGGER = 160;

/** Typing dot state at time t (ms): a soft fade/lift that travels across the three dots. */
function typingDot(t: number, i: number): { opacity: number; transform: string } {
  const phase = (((t - i * TYPING_STAGGER) % TYPING_PERIOD) + TYPING_PERIOD) % TYPING_PERIOD;
  const x = phase / TYPING_PERIOD;
  // peak at 25% of the cycle, rest from 50%
  const k = x < 0.25 ? x / 0.25 : x < 0.5 ? 1 - (x - 0.25) / 0.25 : 0;
  const s = 0.5 - 0.5 * Math.cos(k * Math.PI);
  return { opacity: 0.4 + 0.6 * s, transform: `translateY(${(-2 * s).toFixed(2)}px)` };
}

const STYLE = `
${ENTER_KEYFRAMES}
.wa-android-enter{animation:wa-android-enter ${ENTER_MS}ms linear both}
@keyframes wa-android-typing{0%{opacity:.4;transform:translateY(0)}12.5%{opacity:.7;transform:translateY(-1px)}25%{opacity:1;transform:translateY(-2px)}37.5%{opacity:.7;transform:translateY(-1px)}50%,100%{opacity:.4;transform:translateY(0)}}
.wa-android-typing-dot{animation:wa-android-typing ${TYPING_PERIOD}ms ease-in-out infinite}
`;

/* ======================================================================
   Helpers (self-contained; no imports from sibling platform files)
   ====================================================================== */

/** Line-art glyphs for the doodle wallpaper, each drawn in a 24×24 box. */
const DOODLE_GLYPHS: string[] = [
  "M12 20s-7-4.4-7-9.6A4 4 0 0 1 12 8a4 4 0 0 1 7 2.4C19 15.6 12 20 12 20z",
  "M12 3.5l2.5 5.3 5.8.7-4.3 4 1.1 5.8L12 16.4l-5.1 2.9 1.1-5.8-4.3-4 5.8-.7z",
  "M7 18h10a4 4 0 0 0 .4-8 6 6 0 0 0-11.2 1.7A3.2 3.2 0 0 0 7 18z",
  "M7 3.5l2 3.6-1.6 1.8a10 10 0 0 0 7.7 7.7l1.8-1.6 3.6 2-.9 3.1c-.2.6-.8 1-1.4.9C10.1 20.3 3.7 13.9 3.1 5.8c0-.6.3-1.2.9-1.4z",
  "M4 8.5h3.2L9 6h6l1.8 2.5H20V19H4zM12 10.5a3.4 3.4 0 1 0 0 6.8 3.4 3.4 0 0 0 0-6.8z",
  "M9 17.5V6.5l10-2.2v11M9 17.5a2.4 2.4 0 1 1-4.8 0 2.4 2.4 0 0 1 4.8 0zM19 15.3a2.4 2.4 0 1 1-4.8 0 2.4 2.4 0 0 1 4.8 0z",
  "M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16zM9.3 10h.01M14.7 10h.01M8.6 13.8c1.9 2.1 4.9 2.1 6.8 0",
  "M5 10h11v4.5A4.5 4.5 0 0 1 11.5 19h-2A4.5 4.5 0 0 1 5 14.5zM16 11h1.4a2.3 2.3 0 0 1 0 4.6H16M8.5 3.5c-.9 1.3.9 2.2 0 3.6M12 3.5c-.9 1.3.9 2.2 0 3.6",
  "M3.5 12a8.5 8.5 0 0 1 17 0zM12 12v6.2a1.8 1.8 0 0 1-3.6 0",
  "M9.5 18h5M10.3 20.6h3.4M12 3.5a5.8 5.8 0 0 0-3.4 10.5v1.9h6.8V14A5.8 5.8 0 0 0 12 3.5z",
  "M4.5 5.5h15v10h-9.2l-4.3 3.6V15.5H4.5z",
  "M4.5 10.5h15V20h-15zM3.5 7.5h17v3h-17zM12 7.5V20M12 7.5c-1.6-3.6-5.6-2.8-3.8 0M12 7.5c1.6-3.6 5.6-2.8 3.8 0",
  "M19.5 14.6A7.6 7.6 0 0 1 9.4 4.5a7.6 7.6 0 1 0 10.1 10.1z",
  "M3.5 11.2 20.5 4l-6.6 16.6-2.8-6.6zM11.1 14 20.5 4",
  "M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16zM12 7.6V12l2.9 1.9",
  "M5 19C5 10.5 10 5.5 19 5c-.4 8.6-5.4 14-14 14zM5 19l8.5-8.5",
  "M12 8.6a3.4 3.4 0 1 0 0 6.8 3.4 3.4 0 0 0 0-6.8zM12 3v2.2M12 18.8V21M3 12h2.2M18.8 12H21M5.6 5.6l1.6 1.6M16.8 16.8l1.6 1.6M5.6 18.4l1.6-1.6M16.8 7.2l1.6-1.6",
  "M3.5 6.5h17v11h-17zM3.5 6.5l8.5 6.6 8.5-6.6",
  "M12 3.5a5 5 0 0 1 5 5c0 3.6-2.8 6-5 6s-5-2.4-5-6a5 5 0 0 1 5-5zM12 14.5l-.9 1.6h1.8zM12 16.1c0 1.8-1.8 2.7-.9 4.4",
  "M12 20.5 4.5 6.4a15 15 0 0 1 15 0zM9.6 10.3h.01M14 12.4h.01M11.6 15.4h.01",
  // small fillers: circle, plus, sparkle, ring
  "M12 9.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z",
  "M12 8v8M8 12h8",
  "M12 5c.6 3.8 3.2 6.4 7 7-3.8.6-6.4 3.2-7 7-.6-3.8-3.2-6.4-7-7 3.8-.6 6.4-3.2 7-7z",
  "M6 9h12v6H6zM9 9V7.5h6V9",
];

/** Dense line-art wallpaper tile (inline SVG data URI) in the spirit of the
 *  default WhatsApp doodle: small glyphs every ~30dp at varied rotations. */
function androidDoodle(stroke: string, opacity: number): string {
  const cell = 30;
  const n = 8; // 240px tile
  const parts: string[] = [];
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const k = r * n + c;
      const x = c * cell + (r % 2 ? 13 : 2) + ((k * 5) % 4);
      const y = r * cell + ((c * 7 + r * 3) % 6);
      const rot = ((k * 47) % 70) - 35;
      const glyph = DOODLE_GLYPHS[(k * 11 + r * 3) % DOODLE_GLYPHS.length];
      const sc = k % 3 === 0 ? 0.62 : 0.78;
      parts.push(`<g transform='translate(${x} ${y}) rotate(${rot} 12 12) scale(${sc})'><path d='${glyph}'/></g>`);
    }
  }
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240' viewBox='0 0 240 240'>` +
    `<g fill='none' stroke='${stroke}' stroke-opacity='${opacity}' stroke-width='1.35' stroke-linecap='round' stroke-linejoin='round'>` +
    parts.join("") +
    `</g></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

const LIGHT: AndroidPalette = {
  dark: false,
  bar: "#ffffff",
  ink: "#0a1014",
  sub: "#0a1014",
  icon: "#0a1014",
  wall: "#f5f2ec",
  doodle: androidDoodle("#e3d9c9", 1),
  inBubble: "#ffffff",
  outBubble: "#d9fdd3",
  text: "#0a1014",
  meta: "rgba(0,0,0,0.6)",
  read: "#007bfc",
  shadow: "0 1px 0.5px rgba(11,20,26,0.13)",
  field: "#ffffff",
  fieldShadow: "0 1px 1px rgba(11,20,26,0.1)",
  composerIcon: "#5b6368",
  placeholder: "#5b6368",
  fab: "#1daa61",
  fabIcon: "#ffffff",
  chip: "rgba(255,255,255,0.95)",
  chipText: "#5b6368",
  chipShadow: "0 1px 0.5px rgba(11,20,26,0.13)",
  e2e: "#fff0d4",
  e2eText: "rgba(0,0,0,0.6)",
  dot: "#8d9599",
  waveIn: "rgba(10,16,20,0.24)",
  waveOut: "rgba(10,16,20,0.24)",
  play: "#5b6368",
  thumbOut: "#5b6368",
  unplayed: "#1daa61",
  played: "#007bfc",
  imgEmpty: "#e4e1db",
  imgEmptyIcon: "#a9a49b",
  scrollBtn: "#ffffff",
  scrollIcon: "#5b6368",
  nav: "#f7f8fa",
  navFg: "#3b4045",
};

const DARK: AndroidPalette = {
  dark: true,
  bar: "#0a1014",
  ink: "#f7f8fa",
  sub: "#f7f8fa",
  icon: "#f7f8fa",
  wall: "#081010",
  doodle: androidDoodle("#ffffff", 0.11),
  inBubble: "#20272b",
  outBubble: "#144d37",
  text: "#f7f8fa",
  meta: "rgba(255,255,255,0.6)",
  read: "#53bdeb",
  shadow: "none",
  field: "#20272b",
  fieldShadow: "none",
  composerIcon: "#adb5b9",
  placeholder: "#adb5b9",
  fab: "#21c063",
  fabIcon: "#0a1014",
  chip: "#1c272d",
  chipText: "#aeb6ba",
  chipShadow: "none",
  e2e: "#1c272d",
  e2eText: "#ffd279",
  dot: "#8d9599",
  waveIn: "rgba(255,255,255,0.3)",
  waveOut: "rgba(255,255,255,0.3)",
  play: "#c7cccf",
  thumbOut: "#c7cccf",
  unplayed: "#21c063",
  played: "#53bdeb",
  imgEmpty: "#1c272d",
  imgEmptyIcon: "#5b6368",
  scrollBtn: "#20272b",
  scrollIcon: "#adb5b9",
  nav: "#000000",
  navFg: "#e9edef",
};

/** WhatsApp's single / double check glyphs (16×10.6 box). */
const CHECK_SINGLE =
  "M10.91 3.316l-.478-.372a.365.365 0 0 0-.51.063L4.566 9.879a.32.32 0 0 1-.484.033L1.891 7.769a.366.366 0 0 0-.515.006l-.423.433a.364.364 0 0 0 .006.514l3.258 3.185c.143.14.361.125.484-.033l6.272-8.048a.365.365 0 0 0-.063-.51z";
const CHECK_DOUBLE =
  "M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.879a.32.32 0 0 1-.484.033l-.358-.325a.319.319 0 0 0-.484.032l-.378.483a.418.418 0 0 0 .036.541l1.32 1.266c.143.14.361.125.484-.033l6.272-8.048a.366.366 0 0 0-.064-.512zm-4.1 0l-.478-.372a.365.365 0 0 0-.51.063L4.566 9.879a.32.32 0 0 1-.484.033L1.891 7.769a.366.366 0 0 0-.515.006l-.423.433a.364.364 0 0 0 .006.514l3.258 3.185c.143.14.361.125.484-.033l6.272-8.048a.365.365 0 0 0-.063-.51z";

function Ticks({ status, color, readColor, width = 16 }: { status: DeliveryStatus; color: string; readColor: string; width?: number }) {
  const h = (width * 10.6) / 16;
  return (
    <svg width={width} height={h} viewBox="0 2.4 16 10.6" style={{ display: "block", flexShrink: 0 }}>
      <path d={status === "sent" ? CHECK_SINGLE : CHECK_DOUBLE} fill={status === "read" ? readColor : color} />
    </svg>
  );
}

function Lock({ color }: { color: string }) {
  return (
    <svg width="9" height="11" viewBox="0 0 12 14.4" style={{ display: "inline-block", verticalAlign: "-1px" }}>
      <path
        d="M6 1.2a3.3 3.3 0 0 0-3.3 3.3v1.8h-.6A1.5 1.5 0 0 0 .6 7.8v4.8a1.5 1.5 0 0 0 1.5 1.5h7.8a1.5 1.5 0 0 0 1.5-1.5V7.8a1.5 1.5 0 0 0-1.5-1.5h-.6V4.5A3.3 3.3 0 0 0 6 1.2zm-2 3.3a2 2 0 0 1 4 0v1.8H4z"
        fill={color}
      />
    </svg>
  );
}

/** Deterministic voice-note waveform (bar heights in px) seeded by the message id. */
function waveform(seed: string, count: number, min: number, max: number): number[] {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  const out: number[] = [];
  for (let i = 0; i < count; i++) {
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    h ^= h >>> 16;
    const r = ((h >>> 0) % 1000) / 1000;
    const envelope = 0.35 + 0.65 * Math.sin(((i + 0.5) / count) * Math.PI);
    // a short quiet lead-in, like a real recording
    const lead = i < 3 ? 0.15 : 1;
    out.push(Math.max(min, Math.round(min + (max - min) * r * envelope * lead)));
  }
  return out;
}

/** Width reserved at the end of the last text line for time (+ ticks). */
function metaReserve(time: string, mine: boolean): number {
  return Math.ceil(time.length * 6.5 + (mine ? 16 + 3 : 0) + 8);
}

function presenceText(typing: boolean, presence: "online" | "typing" | "lastseen", lastSeen: string, online: string, typingText: string) {
  if (typing || presence === "typing") return typingText;
  if (presence === "online") return online;
  return lastSeen;
}

/** 1–3 emoji and nothing else -> rendered large without a bubble. Returns the count, or 0. */
function bigEmojiCount(text: string): number {
  const t = text.trim();
  if (!t || t.length > 40) return 0;
  const Seg = (Intl as unknown as { Segmenter?: new (l?: string, o?: { granularity: string }) => { segment: (s: string) => Iterable<{ segment: string }> } }).Segmenter;
  const parts = Seg ? Array.from(new Seg(undefined, { granularity: "grapheme" }).segment(t), (s) => s.segment) : Array.from(t);
  const glyphs = parts.filter((g) => g.trim() !== "");
  if (glyphs.length < 1 || glyphs.length > 3) return 0;
  return glyphs.every((g) => /\p{Extended_Pictographic}/u.test(g) || /\p{Regional_Indicator}/u.test(g)) ? glyphs.length : 0;
}

/* ======================================================================
   Icons (24dp grid)
   ====================================================================== */

function Svg({ children, size = 24, style }: { children: ReactNode; size?: number; style?: CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ display: "block", flexShrink: 0, ...style }}>
      {children}
    </svg>
  );
}

const P = {
  back: "M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z",
  call: "M6.54 5c.06.89.21 1.76.45 2.59l-1.2 1.2c-.41-1.2-.67-2.47-.76-3.79h1.51m9.86 12.02c.85.24 1.72.39 2.6.45v1.49c-1.32-.09-2.59-.35-3.8-.75l1.2-1.19M7.5 3H4c-.55 0-1 .45-1 1 0 9.39 7.61 17 17 17 .55 0 1-.45 1-1v-3.49c0-.55-.45-1-1-1-1.24 0-2.45-.2-3.57-.57-.1-.04-.21-.05-.31-.05-.26 0-.51.1-.71.29l-2.2 2.2c-2.83-1.45-5.15-3.76-6.59-6.59l2.2-2.2c.28-.28.36-.67.25-1.02C8.7 6.45 8.5 5.25 8.5 4c0-.55-.45-1-1-1z",
  more: "M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z",
  attach:
    "M16.5 6v11.5c0 2.21-1.79 4-4 4s-4-1.79-4-4V5c0-1.38 1.12-2.5 2.5-2.5s2.5 1.12 2.5 2.5v10.5c0 .55-.45 1-1 1s-1-.45-1-1V6H10v9.5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5V5c0-2.21-1.79-4-4-4S7 2.79 7 5v12.5c0 3.04 2.46 5.5 5.5 5.5s5.5-2.46 5.5-5.5V6h-1.5z",
  camera:
    "M14.12 4l1.83 2H20v12H4V6h4.05l1.83-2h4.24M15 2H9L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2zm-3 7c1.65 0 3 1.35 3 3s-1.35 3-3 3-3-1.35-3-3 1.35-3 3-3m0-2c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5z",
  mic: "M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z",
  play: "M7.2 4.6v14.8c0 .9.98 1.45 1.75.98l11.6-7.4a1.15 1.15 0 0 0 0-1.96L8.95 3.62A1.15 1.15 0 0 0 7.2 4.6z",
  doubleDown: "M18 6.41 16.59 5 12 9.58 7.41 5 6 6.41l6 6zm0 6L16.59 11 12 15.58 7.41 11 6 12.41l6 6z",
  image:
    "M19 5v14H5V5h14m0-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-4.86 8.86-3 3.87L9 13.14 6 17h12l-3.86-5.14z",
};

/** WhatsApp's videocam: outlined rounded body with a solid lens (21×16 glyph). */
function Videocam({ color }: { color: string }) {
  return (
    <Svg>
      <rect x="2.5" y="5" width="13" height="14" rx="2.4" stroke={color} strokeWidth="2" />
      <path d="M16.6 10.3 21.4 7.2c.27-.17.6.02.6.33v8.9c0 .31-.33.5-.6.33l-4.8-3.1z" fill={color} />
    </Svg>
  );
}

/** Composer sticker-smiley (emoji / sticker / GIF tray toggle). */
function StickerSmiley({ color }: { color: string }) {
  return (
    <Svg>
      <path
        d="M21 13.2V8.2A5.2 5.2 0 0 0 15.8 3H8.2A5.2 5.2 0 0 0 3 8.2v7.6A5.2 5.2 0 0 0 8.2 21h5z"
        stroke={color}
        strokeWidth="1.9"
        strokeLinejoin="round"
      />
      <path d="M13.2 21v-2.6a5.2 5.2 0 0 1 5.2-5.2H21" stroke={color} strokeWidth="1.9" strokeLinejoin="round" />
      <circle cx="9" cy="9.6" r="1.25" fill={color} />
      <circle cx="15" cy="9.6" r="1.25" fill={color} />
      <path d="M7.9 13.4c1 1.3 2.5 1.9 4.2 1.7" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

/** Flag tail at the top outer corner of the first bubble of a group. */
function Tail({ side, color }: { side: "left" | "right"; color: string }) {
  const right = side === "right";
  // drawn for the right side; mirrored for the left
  const d = "M0 0H5.4C6.9 0 7.5 1.1 6.7 2.2L0.9 10.7C0.6 11.1 0 11.5 0 11.5Z";
  return (
    <svg
      width={TAIL_W}
      height="11.5"
      viewBox="0 0 7 11.5"
      style={{
        position: "absolute",
        top: 0,
        [right ? "right" : "left"]: -TAIL_W + 0.5,
        display: "block",
        transform: right ? undefined : "scaleX(-1)",
      }}
    >
      <path d={d} fill={color} />
    </svg>
  );
}

/* ======================================================================
   Screen
   ====================================================================== */

export function WhatsAppAndroid({ scenario, playback, lang, rtl }: PlatformProps) {
  const dark = scenario.theme === "dark";
  const p = dark ? DARK : LIGHT;
  const c = CHROME[lang];
  const s = STR[lang];
  const uiDir = rtl ? "rtl" : "ltr";
  const { messages, typing } = playback;
  const live = playback.isLive;
  const clock = playback.clockMs;
  const scrollRef = useChatScroll<HTMLDivElement>(`${messages.length}-${typing}`);
  const [scrolledUp, setScrolledUp] = useState(false);

  // The scroll-to-bottom button only appears once the user has scrolled up.
  // Re-evaluate on scroll AND when the content grows (images decoding, new rows).
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const check = () => { el.dataset.dist = String(el.scrollHeight - el.scrollTop - el.clientHeight); setScrolledUp(el.scrollHeight - el.scrollTop - el.clientHeight > 160); };
    check();
    el.addEventListener("scroll", check, { passive: true });
    const ro = new ResizeObserver(check);
    ro.observe(el);
    if (el.firstElementChild) ro.observe(el.firstElementChild);
    return () => {
      el.removeEventListener("scroll", check);
      ro.disconnect();
    };
  }, [scrollRef]);

  const scrollToBottom = () => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  };

  const subtitle = presenceText(typing, scenario.presence, scenario.lastSeenText, c.online, c.typing);
  const lastSender = messages.length ? messages[messages.length - 1].sender : null;
  const typingStartsGroup = lastSender !== "them";

  return (
    <div className="flex h-full w-full flex-col" style={{ background: p.bar, color: p.text }}>
      <style>{STYLE}</style>
      <SamsungStatusBar tint={dark ? "light" : "dark"} background={p.bar} lang={lang} />

      {/* Top app bar */}
      <div className="relative z-10 flex shrink-0 items-center" style={{ height: 56, background: p.bar }}>
        <div className="flex shrink-0 items-center justify-center" style={{ width: 48, height: 48 }}>
          <Svg style={{ transform: rtl ? "scaleX(-1)" : undefined }}>
            <path d={P.back} fill={p.icon} />
          </Svg>
        </div>
        <div style={{ marginInlineStart: 4 }}>
          <Avatar person={scenario.them} size={38} />
        </div>
        <div className="flex min-w-0 flex-1 flex-col justify-center" style={{ paddingInlineStart: 12, paddingInlineEnd: 4 }}>
          <div className="truncate" style={{ fontSize: 17.5, lineHeight: "22px", fontWeight: 400, color: p.ink }}>
            {scenario.them.name}
          </div>
          <div className="truncate" style={{ fontSize: 12, lineHeight: "16px", marginTop: 1.3, color: p.sub }}>
            {subtitle}
          </div>
        </div>
        {/* videocam / call do not mirror in RTL; only their order does */}
        <div className="flex shrink-0 items-center">
          <div className="flex items-center justify-center" style={{ width: 56, height: 48 }}>
            <Videocam color={p.icon} />
          </div>
          <div className="flex items-center justify-center" style={{ width: 44, height: 48 }}>
            <Svg>
              <path d={P.call} fill={p.icon} />
            </Svg>
          </div>
          <div className="flex items-center justify-center" style={{ width: 45, height: 48 }}>
            <Svg>
              <path d={P.more} fill={p.icon} />
            </Svg>
          </div>
        </div>
      </div>

      {/* Wallpaper (fixed) holding the scrolling list + floating composer */}
      <div
        className="relative flex min-h-0 flex-1 flex-col"
        style={{ backgroundColor: p.wall, backgroundImage: p.doodle, backgroundSize: "240px 240px" }}
      >
        <div ref={scrollRef} className="rcss-scroll min-h-0 flex-1 overflow-y-auto" style={{ padding: "11px 0 8px" }}>
          <div className="flex flex-col">
            {/* Date chip */}
            <div className="flex justify-center">
              <span
                style={{
                  background: p.chip,
                  color: p.chipText,
                  fontSize: 12.5,
                  fontWeight: 500,
                  lineHeight: "26px",
                  height: 26,
                  padding: "0 9px",
                  borderRadius: 8,
                  boxShadow: p.chipShadow,
                }}
              >
                {c.today}
              </span>
            </div>

            {/* End-to-end encryption notice */}
            <div className="flex justify-center" style={{ padding: "12px 34px 0" }}>
              <div
                className="text-center"
                style={{
                  background: p.e2e,
                  color: p.e2eText,
                  fontSize: 12.5,
                  lineHeight: "16px",
                  padding: "6px 10px 7px",
                  borderRadius: 8,
                  boxShadow: p.chipShadow,
                }}
              >
                <span style={{ marginInlineEnd: 3 }}>
                  <Lock color={p.e2eText} />
                </span>
                {s.e2e} <span style={{ fontWeight: 600 }}>{s.more}</span>
              </div>
            </div>

            <div style={{ height: 12 - GAP_BETWEEN }} />

            {messages.map((m, i) => {
              const { firstOfGroup } = groupInfo(messages, i);
              return (
                <AndroidRow
                  key={m.id}
                  m={m}
                  p={p}
                  rtl={rtl}
                  uiDir={uiDir}
                  firstOfGroup={firstOfGroup}
                  status={playback.statusOf(m)}
                  person={m.sender === "me" ? scenario.me : scenario.them}
                  live={live}
                />
              );
            })}

            {typing && (
              <div
                className={`flex ${live && clock === undefined ? "wa-android-enter" : ""}`}
                style={{
                  justifyContent: "flex-start",
                  paddingInlineStart: EDGE,
                  paddingInlineEnd: FAR,
                  marginTop: typingStartsGroup ? GAP_BETWEEN : GAP_IN_GROUP,
                }}
              >
                <div
                  className="relative flex items-center justify-center"
                  style={{
                    background: p.inBubble,
                    borderRadius: RADIUS,
                    ...(typingStartsGroup ? (rtl ? { borderTopRightRadius: 0 } : { borderTopLeftRadius: 0 }) : {}),
                    boxShadow: p.shadow,
                    height: 36,
                    width: 52,
                    gap: 4.5,
                  }}
                >
                  {typingStartsGroup && <Tail side={rtl ? "right" : "left"} color={p.inBubble} />}
                  {[0, 1, 2].map((d) => {
                    const st = clock !== undefined ? typingDot(clock, d) : undefined;
                    return (
                      <span
                        key={d}
                        className={clock === undefined ? "wa-android-typing-dot block rounded-full" : "block rounded-full"}
                        style={{
                          width: 6,
                          height: 6,
                          background: p.dot,
                          animationDelay: clock === undefined ? `${d * TYPING_STAGGER}ms` : undefined,
                          ...(st ?? {}),
                        }}
                      />
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Scroll-to-bottom: bottom-end corner, only after scrolling up */}
        {!live && scrolledUp && (
          <button
            onClick={scrollToBottom}
            aria-label="scroll to bottom"
            className="absolute flex items-center justify-center rounded-full"
            style={{
              bottom: 48 + 5.5 + 14,
              insetInlineEnd: 13,
              width: 40,
              height: 40,
              background: p.scrollBtn,
              boxShadow: dark ? "0 1px 3px rgba(0,0,0,0.5)" : "0 1px 3px rgba(11,20,26,0.22)",
            }}
          >
            <Svg size={22}>
              <path d={P.doubleDown} fill={p.scrollIcon} />
            </Svg>
          </button>
        )}

        {/* Composer: floats over the wallpaper */}
        <div className="flex shrink-0 items-end" style={{ paddingInlineStart: 5, paddingInlineEnd: 4.5, paddingBottom: 5.5, paddingTop: 2, gap: 4.5 }}>
          <div
            className="relative flex flex-1 items-center"
            style={{ height: 48, borderRadius: 24, background: p.field, boxShadow: p.fieldShadow }}
          >
            <div className="flex shrink-0 items-center justify-center" style={{ width: 24, marginInlineStart: 10 }}>
              <StickerSmiley color={p.composerIcon} />
            </div>
            <span
              className="min-w-0 flex-1 truncate"
              style={{ fontSize: 18, lineHeight: "24px", color: p.placeholder, paddingInlineStart: 14 }}
            >
              {s.placeholder}
            </span>
            {/* attach centred 72.5 and camera 24.5 from the field's end */}
            <div className="flex shrink-0 items-center" style={{ gap: 24, marginInlineEnd: 12.5 }}>
              <Svg>
                <path d={P.attach} fill={p.composerIcon} />
              </Svg>
              <Svg>
                <path d={P.camera} fill={p.composerIcon} />
              </Svg>
            </div>
          </div>
          <div
            className="flex shrink-0 items-center justify-center rounded-full"
            style={{ width: 48, height: 48, background: p.fab, boxShadow: dark ? "none" : "0 1px 2px rgba(11,20,26,0.18)" }}
          >
            <Svg>
              <path d={P.mic} fill={p.fabIcon} />
            </Svg>
          </div>
        </div>
      </div>

      <SystemBottomBar device="android" bg={p.nav} fg={p.navFg} />
    </div>
  );
}

/* ======================================================================
   Message row
   ====================================================================== */

function AndroidRow({
  m,
  p,
  rtl,
  uiDir,
  firstOfGroup,
  status,
  person,
  live,
}: {
  m: Message;
  p: AndroidPalette;
  rtl: boolean;
  uiDir: "rtl" | "ltr";
  firstOfGroup: boolean;
  status: DeliveryStatus;
  person: Person;
  live: boolean;
}) {
  const mine = m.sender === "me";
  const onRight = mine ? !rtl : rtl;
  const bg = mine ? p.outBubble : p.inBubble;
  const caption = m.type === "image" ? m.text.trim() : "";
  const textDir = dirOf(m.text);
  const emojiCount = m.type === "text" ? bigEmojiCount(m.text) : 0;

  const meta = (overlay: boolean) => (
    <span
      className="inline-flex items-center whitespace-nowrap"
      style={{
        fontSize: META_FS,
        lineHeight: "15px",
        gap: 3,
        color: overlay ? "#ffffff" : p.meta,
        textShadow: overlay ? "0 1px 1px rgba(0,0,0,0.35)" : undefined,
      }}
    >
      {m.time}
      {mine && <Ticks status={status} color={overlay ? "#ffffff" : p.meta} readColor={overlay ? "#ffffff" : p.read} />}
    </span>
  );

  // Physical corner radii: square only under the tail.
  const tail = firstOfGroup && m.type !== "image" && emojiCount === 0;
  const radius: CSSProperties = { borderRadius: RADIUS };
  if (tail) {
    if (onRight) radius.borderTopRightRadius = 0;
    else radius.borderTopLeftRadius = 0;
  }

  let content: ReactNode;

  if (emojiCount > 0) {
    // Big emoji: no bubble; the time sits in a small bubble-coloured pill.
    const size = emojiCount === 1 ? 56 : emojiCount === 2 ? 44 : 38;
    content = (
      <div className="flex flex-col" style={{ alignItems: "flex-end" }} dir={uiDir}>
        <span style={{ fontSize: size, lineHeight: 1.18, whiteSpace: "nowrap" }}>{m.text.trim()}</span>
        <span
          style={{
            alignSelf: "flex-end",
            marginTop: 2,
            background: bg,
            borderRadius: 9,
            padding: "1.5px 6px",
            boxShadow: p.shadow,
          }}
        >
          {meta(false)}
        </span>
      </div>
    );
  } else if (m.type === "voice") {
    content = (
      <div className="relative" dir={uiDir} style={{ background: bg, boxShadow: p.shadow, ...radius, width: "100%" }}>
        {tail && <Tail side={onRight ? "right" : "left"} color={bg} />}
        <AndroidVoice m={m} p={p} mine={mine} status={status} person={person} meta={meta(false)} />
      </div>
    );
  } else if (m.type === "image") {
    const W = 262;
    const imgRadius: CSSProperties = caption
      ? { borderTopLeftRadius: RADIUS, borderTopRightRadius: RADIUS }
      : { borderRadius: RADIUS };
    content = (
      <div
        className="relative overflow-hidden"
        dir={caption ? textDir : uiDir}
        style={{ width: W, maxWidth: "100%", background: bg, boxShadow: p.shadow, borderRadius: RADIUS }}
      >
        <div className="relative overflow-hidden" style={imgRadius}>
          {m.imageSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={m.imageSrc}
              alt=""
              draggable={false}
              style={{ display: "block", width: "100%", height: "auto", maxHeight: 340, objectFit: "cover" }}
            />
          ) : (
            <div className="flex items-center justify-center" style={{ width: "100%", height: 196, background: p.imgEmpty }}>
              <Svg size={44}>
                <path d={P.image} fill={p.imgEmptyIcon} />
              </Svg>
            </div>
          )}
          {!caption && (
            <>
              <span
                className="pointer-events-none absolute inset-x-0 bottom-0"
                style={{ height: 34, background: "linear-gradient(to top, rgba(0,0,0,0.42), rgba(0,0,0,0))" }}
              />
              <span className="absolute" style={{ bottom: 5, insetInlineEnd: 10 }}>
                {meta(true)}
              </span>
            </>
          )}
        </div>
        {caption && (
          <div className="relative" style={{ padding: "7px 12px 10px", color: p.text }}>
            <span className="whitespace-pre-wrap break-words" style={{ fontSize: 16, lineHeight: "21px" }}>
              {caption}
            </span>
            <span style={{ display: "inline-block", width: metaReserve(m.time, mine), height: 1 }} />
            <span className="absolute" style={{ bottom: 5.4, insetInlineEnd: 8 }}>
              {meta(false)}
            </span>
          </div>
        )}
      </div>
    );
  } else {
    content = (
      <div
        className="relative"
        dir={textDir}
        style={{ background: bg, color: p.text, boxShadow: p.shadow, padding: "9px 12px 10px", ...radius }}
      >
        {tail && <Tail side={onRight ? "right" : "left"} color={bg} />}
        <span className="whitespace-pre-wrap break-words" style={{ fontSize: 16, lineHeight: "21px" }}>
          {m.text}
        </span>
        <span style={{ display: "inline-block", width: metaReserve(m.time, mine), height: 1 }} />
        <span className="absolute" style={{ bottom: 5.4, insetInlineEnd: 8 }}>
          {meta(false)}
        </span>
      </div>
    );
  }

  return (
    <div
      data-mid={m.id}
      data-sender={m.sender}
      className={`flex ${live ? "wa-android-enter" : ""}`}
      style={{
        justifyContent: mine ? "flex-end" : "flex-start",
        paddingInlineStart: mine ? FAR : EDGE,
        paddingInlineEnd: mine ? EDGE : FAR,
        marginTop: firstOfGroup ? GAP_BETWEEN : GAP_IN_GROUP,
      }}
    >
      <div style={{ maxWidth: "100%", width: m.type === "voice" ? "100%" : undefined, display: "flex", justifyContent: mine ? "flex-end" : "flex-start" }}>
        {content}
      </div>
    </div>
  );
}

/** Voice note: avatar (mic badge) | play | scrubber + waveform, duration under the dot, time at the end. */
function AndroidVoice({
  m,
  p,
  mine,
  status,
  person,
  meta,
}: {
  m: Message;
  p: AndroidPalette;
  mine: boolean;
  status: DeliveryStatus;
  person: Person;
  meta: ReactNode;
}) {
  // Incoming: unplayed (green). Outgoing: green until the recipient has played it (read -> blue).
  const playedOut = mine && status === "read";
  const badge = mine ? (playedOut ? p.played : p.unplayed) : p.unplayed;
  const thumb = mine ? p.thumbOut : p.unplayed;
  const bars = waveform(m.id, 44, 3, 21);
  return (
    <div className="flex" style={{ padding: "6px 12px 6px 6px", alignItems: "flex-start" }}>
      <div className="relative shrink-0" style={{ width: 48, height: 48 }}>
        <Avatar person={person} size={48} />
        <span className="absolute" style={{ bottom: -3, insetInlineEnd: -5 }}>
          <Svg size={19}>
            <path d={P.mic} fill={badge} />
          </Svg>
        </span>
      </div>
      {/* play triangle never mirrors, even in RTL */}
      <div className="flex shrink-0 items-center justify-center" style={{ width: 32, height: 34, marginInlineStart: 12, marginTop: 7 }}>
        <Svg size={30}>
          <path d={P.play} fill={p.play} />
        </Svg>
      </div>
      <div className="min-w-0 flex-1" style={{ marginInlineStart: 6 }}>
        <div className="relative flex items-center overflow-hidden" style={{ height: 24, marginTop: 12, gap: 1.6, paddingInlineStart: 2 }}>
          {bars.map((h, i) => (
            <span key={i} style={{ width: 2, height: h, borderRadius: 1, background: mine ? p.waveOut : p.waveIn, flexShrink: 0 }} />
          ))}
          <span
            className="absolute rounded-full"
            style={{ width: 12, height: 12, top: 6, insetInlineStart: 0, background: thumb }}
          />
        </div>
        <div className="flex items-center justify-between" style={{ marginTop: 6, height: 15 }}>
          <span style={{ fontSize: META_FS, lineHeight: "15px", color: p.meta }}>{m.voiceDuration || "0:07"}</span>
          {meta}
        </div>
      </div>
    </div>
  );
}
