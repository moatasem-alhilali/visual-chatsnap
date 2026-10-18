"use client";

/**
 * Apple Messages (iMessage) conversation screen, iOS 26 / iOS 27 "Liquid Glass".
 * iOS 27 (Sept 2026) kept the iOS 26 conversation chrome; its Messages changes
 * were functional.
 *   https://9to5mac.com/2025/09/17/heres-everything-new-in-the-messages-app-with-ios-26/
 *
 * Every metric below was measured with a pixel scanner on Apple's own iOS 26
 * images (pt = px / scale):
 *  [A] support.apple.com/en-us/105087 → cdsassets…/ios-26-iphone-17-pro-text-messages.png
 *      (real iPhone 17 Pro screenshot, 402pt wide = 586px, 1.458 px/pt)
 *  [B] iPhone User Guide "Send and reply to messages" + "Send and receive audio
 *      messages" (support.apple.com/guide/iphone/iph82fb73ba3 / iph2e42d3117),
 *      ipcdn-web.apple.com assets 5b3d9796…, 24a996a5…, da7014b7…, d0aa2652…
 *      (445px screen, 1.13 px/pt)
 *  [C] Apple Newsroom iOS 26 (2025/06) images: Live Translation, Polls, Apple Cash.
 *  [D] Apple HIG Color (developer.apple.com/design/human-interface-guidelines/color,
 *      JSON alt text): systemBlue light rgb(0,136,255), dark rgb(0,145,255);
 *      systemGray5 #E5E5EA / #2C2C2E, systemGray6 #F2F2F7 / #1C1C1E.
 *  [E] Apple localization glossary, iOS 26 ChatKit.framework (applelocalization.com
 *      API): MESSAGE_STATUS_DELIVERED "Delivered" / "تم التسليم",
 *      MESSAGE_STATUS_READ_TIME "Read %@" / "تمت القراءة %@", KEEP "Keep" / "احتفاظ",
 *      MADRID "iMessage" (same in Arabic), TODAY "Today" / "اليوم".
 *
 * Key values
 *  - Header [A][B]: no bar. Glass circles 44pt (back chevron 11×18.5pt, FaceTime
 *    "video"), 16pt from the edge, top 58pt. Contact photo 60pt, top 58pt; name in a
 *    glass capsule 31.5pt tall whose top is 55pt below the photo's top (overlaps it
 *    ~5pt), 17pt semibold + grey chevron, insets 12/9pt. Light glass = white +
 *    very soft shadow.
 *  - Service stamp [A]: "iMessage" / "Today 9:41", 11pt, 13.5pt lines, secondary
 *    label, uniform weight (the bold day only appears on mid-thread stamps [B]).
 *    First line 22pt below the capsule, first bubble 10.6pt below the last baseline.
 *  - Bubbles [A][B]: 17pt text on a 20.3pt line (UIFont natural line height, not
 *    22), insets ~9.8pt × 14pt → a single line is a 40pt pill; radius ≈ h/2 for one
 *    line. Max width ≈ 275pt. 15pt from the screen edge. 4pt between bubbles of one
 *    sender, 9.5pt between senders. Incoming #E9E9EB (light).
 *  - Outgoing blue [B][C][D]: NOT flat. It is a screen-fixed vertical gradient,
 *    rgb(97,201,251) at the top of the display → systemBlue rgb(0,136,255) near the
 *    bottom (sampled at 8 heights, linear fit). Implemented with a view() scroll
 *    timeline so each bubble shows the colour of where it sits on screen.
 *  - Tail [A][B]: the iOS 26 tail no longer flares sideways. It hangs under the
 *    bottom trailing corner: tip ~9pt in from the edge and ~7pt below the bubble,
 *    left flank sloping ~31°, right flank nearly vertical with a concave notch into
 *    the corner. Only the last bubble of a run, and an image followed by a
 *    non-image, get it. Images are clipped to the same outline (tail included).
 *  - Receipt [B][E]: "Delivered" / "Read 10:44", 11pt semibold secondary,
 *    baseline 16.6pt below the bubble, trailing edge ~21pt inside the bubble edge.
 *    Audio adds a blue "Keep".
 *  - Audio [B]: blue bubble, white 28.5pt play disc with a blue triangle, dotted
 *    silent edges + bars at 4pt pitch, "00:04" 15pt at 70% white.
 *  - Composer [B][C]: resting bar inset 27.5pt from both edges and 27pt above the
 *    screen bottom. 40pt glass "+" circle, 12pt gap, 40pt glass capsule with the
 *    "iMessage" placeholder (17pt) and a waveform glyph (audio message).
 *  - Tapbacks [F]: 32pt disc (+1.5pt background ring) centred 3pt inside the
 *    bubble's inner top corner and 11pt above it; "thought" circles 8pt / 4pt at
 *    (+10.4, +14.4) / (+18.4, +23.2) trailing down and outward. Mine = blue,
 *    theirs = incoming grey; the emoji itself sits in the disc.
 *  - Inline reply [F]: the parent re-drawn at 0.7 scale as an outlined bubble
 *    (secondary text, tail kept), "N Replies" 13pt semibold systemBlue under it
 *    and under the original message, a 2pt systemGray4 thread line from the
 *    quote's tail to the reply. REPLY_COUNT ar: "رد واحد", "ردان", "%@ ردود" [E].
 *  - Compose [B][F]: field grows in 22pt lines (max 6), 2pt systemBlue caret,
 *    the waveform turns into a 32pt tinted-glass blue disc with arrow.up.
 *  [F] support.apple.com/guide/iphone/iph018d3c336 ("React with Tapbacks", iOS 26),
 *      asset ipcdn-web.apple.com/assets/v2/web/c472aee5-d184-482a-866a-b7a5d7200d13
 *  - Scroll edges: soft fades under the floating header and composer (Liquid Glass
 *    scroll-edge effect, drawn as gradients so the snapdom exporter matches).
 *  - Motion: outgoing bubbles rise from the input field (≈58pt) on a lightly damped
 *    spring while scaling 0.92→1; incoming bubbles and the typing indicator grow out
 *    of their tail corner. Keyframes are generated from the same spring function
 *    that `imessageIosMotion.enterStyle` uses, so live preview == export.
 */

import { createContext, useContext, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

import type { Message, Person } from "../../types";
import { Avatar, dirOf, SystemBottomBar, useChatScroll } from "../shared";
import { StatusBar } from "../devices/StatusBar";
import type { Lang } from "./chrome";
import { groupInfo, type PlatformMotion, type PlatformProps } from "./types";

/* ------------------------------- tokens ------------------------------- */

const IOS_FONT =
  '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "SF Pro", var(--font-inter), system-ui, var(--font-tajawal), sans-serif';

interface Palette {
  bg: string;
  /** background colour at a given alpha (for the scroll-edge fades) */
  bgA: (a: number) => string;
  label: string;
  secondary: string;
  placeholder: string;
  glyph: string;
  nameChevron: string;
  blue: string;
  inBubble: string;
  inText: string;
  typingDot: string;
  photoFill: string;
  /** inline-reply quote outline + thread connector */
  quoteStroke: string;
  thread: string;
  caret: string;
}

const LIGHT: Palette = {
  bg: "#ffffff",
  bgA: (a) => `rgba(255,255,255,${a})`,
  label: "#000000",
  secondary: "rgba(60,60,67,0.6)",
  placeholder: "rgba(60,60,67,0.44)",
  glyph: "#a5a9b1",
  nameChevron: "rgba(60,60,67,0.38)",
  blue: "#0088ff",
  inBubble: "#e9e9eb",
  inText: "#000000",
  typingDot: "#8e8e93",
  photoFill: "#f2f2f7",
  quoteStroke: "#d1d1d6",
  thread: "#d1d1d6",
  caret: "#0088ff",
};

const DARK: Palette = {
  bg: "#000000",
  bgA: (a) => `rgba(0,0,0,${a})`,
  label: "#ffffff",
  secondary: "rgba(235,235,245,0.6)",
  placeholder: "rgba(235,235,245,0.4)",
  glyph: "#8a8d94",
  nameChevron: "rgba(235,235,245,0.38)",
  blue: "#0091ff",
  inBubble: "#262628",
  inText: "#ffffff",
  typingDot: "#8d8d93",
  photoFill: "#1c1c1e",
  quoteStroke: "#3a3a3c",
  thread: "#3a3a3c",
  caret: "#0091ff",
};

/** Screen-fixed outgoing gradient (top of display → bottom), fitted to [B]. */
const OUT_GRADIENT = "linear-gradient(180deg, rgb(97,201,251) 0%, rgb(0,136,255) 94%, rgb(0,131,255) 100%)";
/** Used where scroll timelines are unavailable: the colour at ~60% height. */
const OUT_FALLBACK = "rgb(35,159,253)";

/** Liquid Glass control, drawn without backdrop-filter. */
function glass(dark: boolean): CSSProperties {
  return dark
    ? {
        background: "rgba(38,38,40,0.96)",
        boxShadow:
          "inset 0 0.5px 0 rgba(255,255,255,0.2), inset 0 0 0 0.5px rgba(255,255,255,0.09), 0 4px 16px rgba(0,0,0,0.5)",
      }
    : {
        background: "#ffffff",
        boxShadow: "0 0 0 0.5px rgba(0,0,0,0.035), 0 2px 5px rgba(0,0,0,0.035), 0 6px 18px rgba(0,0,0,0.07)",
      };
}

/** Strings the shared chrome map doesn't carry, verified against iOS 26/27 ChatKit [E]. */
interface LocalStrings {
  service: string;
  placeholder: string;
  today: string;
  delivered: string;
  read: string;
  keep: string;
  /** REPLY_COUNT plural (ChatKit.loctable) */
  replies: (n: number) => string;
  audio: string;
  photo: string;
}
const LOCAL: Record<Lang, LocalStrings> = {
  en: {
    service: "iMessage",
    placeholder: "iMessage",
    today: "Today",
    delivered: "Delivered",
    read: "Read",
    keep: "Keep",
    replies: (n) => (n === 1 ? "1 Reply" : `${n} Replies`),
    audio: "Audio Message",
    photo: "Photo",
  },
  ar: {
    service: "iMessage",
    placeholder: "iMessage",
    today: "اليوم",
    delivered: "تم التسليم",
    read: "تمت القراءة",
    keep: "احتفاظ",
    replies: (n) => (n === 1 ? "رد واحد" : n === 2 ? "ردان" : n <= 10 ? `${n} ردود` : `${n} رد`),
    audio: "رسالة صوتية",
    photo: "صورة",
  },
};

/* metrics (pt) */
const SIDE = 15;
const RADIUS = 19;
const MAX_W = 275;
const PAD_Y = 9.85;
const PAD_X = 14;
const LINE = 20.3;
const GAP_GROUP = 4;
const GAP_SENDER = 9.5;
const GAP_AFTER_RECEIPT = 7;
const TAIL_DROP = 7.6;
const IMG_W = 244;
const STAMP_TOP = 166; // first stamp line box top
const COMPOSER_BOTTOM = 27;
const COMPOSER_H = 40;
const COMPOSER_SIDE = 27.5;
/** last bubble sits 18pt above the composer */
const BODY_BOTTOM = COMPOSER_BOTTOM + COMPOSER_H + 18;

/* ------------------------------ motion ------------------------------ */

/** Damped spring step response at time t (s); 0 → 1 with a small overshoot. */
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

const OUT_MS = 520;
const IN_MS = 440;
const TYPING_IN_MS = 380;

function outFrame(p: number) {
  const s = springP(p, OUT_MS / 1000, 0.78, 15);
  const o = Math.min(1, p / 0.14);
  return { opacity: 1 - (1 - o) * (1 - o), transform: `translateY(${((1 - s) * 58).toFixed(2)}px) scale(${(0.92 + 0.08 * s).toFixed(4)})` };
}

function inFrame(p: number, from = 0.55) {
  const s = springP(p, IN_MS / 1000, 0.66, 17);
  const o = Math.min(1, p / 0.2);
  return {
    opacity: 1 - (1 - o) * (1 - o),
    transform: `translateY(${((1 - s) * 5).toFixed(2)}px) scale(${(from + (1 - from) * s).toFixed(4)})`,
  };
}

function originFor(mine: boolean, rtl: boolean): string {
  const right = mine ? !rtl : rtl;
  return right ? "100% 100%" : "0% 100%";
}

export const imessageIosMotion: PlatformMotion = {
  enterMs: OUT_MS,
  enterStyle: (p, mine, rtl) => {
    // The exporter uses one duration; incoming rows finish their (shorter) spring
    // inside it and then hold.
    const f = mine ? outFrame(p) : inFrame(Math.min(1, (p * OUT_MS) / IN_MS));
    return { ...f, transformOrigin: originFor(mine, rtl) };
  },
};

/** Caret blink (UIKit: ~0.5s visible, ~0.5s hidden, soft edges). */
const CARET_PERIOD = 1000;
const CARET_ON = 0.5;
const CARET_FADE = 0.08;
function caretOpacity(ms: number): number {
  const x = (((ms % CARET_PERIOD) + CARET_PERIOD) % CARET_PERIOD) / CARET_PERIOD;
  if (x <= CARET_ON) return 1;
  if (x <= CARET_ON + CARET_FADE) return 1 - (x - CARET_ON) / CARET_FADE;
  if (x <= 1 - CARET_FADE) return 0;
  return (x - (1 - CARET_FADE)) / CARET_FADE;
}

function keyframes(name: string, frame: (p: number) => { opacity: number; transform: string }, steps = 24): string {
  let out = `@keyframes ${name}{`;
  for (let i = 0; i <= steps; i++) {
    const p = i / steps;
    const f = frame(p);
    out += `${((p * 100).toFixed(2))}%{opacity:${f.opacity.toFixed(4)};transform:${f.transform}}`;
  }
  return out + "}";
}

const STYLE = [
  keyframes("imsg-ios-out", outFrame),
  keyframes("imsg-ios-in", (p) => inFrame(p)),
  keyframes("imsg-ios-typing-in", (p) => inFrame(p, 0.3)),
  "@keyframes imsg-ios-fade{from{opacity:0}to{opacity:1}}",
  `.imsg-ios-anim-out{animation:imsg-ios-out ${OUT_MS}ms linear both}`,
  `.imsg-ios-anim-in{animation:imsg-ios-in ${IN_MS}ms linear both}`,
  `.imsg-ios-anim-typing{animation:imsg-ios-typing-in ${TYPING_IN_MS}ms linear both}`,
  ".imsg-ios-anim-fade{animation:imsg-ios-fade 260ms ease-out both}",
  // typing dots: sequential darkening, like the real indicator
  "@keyframes imsg-ios-dot{0%,100%{opacity:.35}22%{opacity:1}44%{opacity:.35}}",
  // UITextView caret: on 0.5s, off 0.5s with short fades
  `@keyframes imsg-ios-caret{0%,${CARET_ON * 100}%{opacity:1}${(CARET_ON + CARET_FADE) * 100}%,${(1 - CARET_FADE) * 100}%{opacity:0}100%{opacity:1}}`,
  `.imsg-ios-caret{animation:imsg-ios-caret ${CARET_PERIOD}ms linear infinite}`,
  // send button / tapback spring in
  keyframes("imsg-ios-pop", (p) => {
    const s = springP(p, 0.34, 0.62, 22);
    return { opacity: Math.min(1, p / 0.25), transform: `scale(${(0.4 + 0.6 * s).toFixed(4)})` };
  }, 16),
  ".imsg-ios-anim-pop{animation:imsg-ios-pop 340ms linear both}",
  // screen-fixed outgoing gradient
  `.imsg-ios-out-fill{background:${OUT_FALLBACK}}`,
  // export frames: same gradient, positioned from JS (see useLayoutEffect in IMessage)
  `.imsg-ios-out-js{background-color:${OUT_FALLBACK};background-image:${OUT_GRADIENT};background-size:100% var(--imsg-h,852px);background-repeat:no-repeat}`,
  `@supports (animation-timeline: view()){.imsg-ios-out-fill{background-image:${OUT_GRADIENT};background-size:100% var(--imsg-h,852px);background-repeat:no-repeat;animation:imsg-ios-grad 1s linear both;animation-timeline:view();animation-range:cover 0% cover 100%}}`,
  "@keyframes imsg-ios-grad{from{background-position:0 calc(-1 * var(--imsg-h,852px))}to{background-position:0 calc(100% + var(--imsg-h,852px))}}",
].join("\n");

/** Dot opacity at a phase in [0,1) — mirrors the imsg-ios-dot keyframes. */
function dotOpacity(phase: number): number {
  const x = ((phase % 1) + 1) % 1;
  if (x < 0.22) return 0.35 + 0.65 * (x / 0.22);
  if (x < 0.44) return 1 - 0.65 * ((x - 0.22) / 0.22);
  return 0.35;
}
const DOT_PERIOD = 1300;
const DOT_STAGGER = 180;

/* ------------------------------ SF glyphs ------------------------------ */

/** chevron.backward — mirrors in RTL (points right on the trailing side). */
function ChevronBack({ color }: { color: string }) {
  return (
    <svg width="12" height="20" viewBox="0 0 12 20" fill="none" className="rtl:-scale-x-100">
      <path d="M10.2 1.3 1.6 10l8.6 8.7" stroke={color} strokeWidth="2.55" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronSmall({ color }: { color: string }) {
  return (
    <svg width="6" height="10" viewBox="0 0 6 10" fill="none" className="rtl:-scale-x-100">
      <path d="M1.3 1.2 4.6 5 1.3 8.8" stroke={color} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** SF Symbol "video" (FaceTime). */
function VideoGlyph({ color }: { color: string }) {
  return (
    <svg width="27" height="18" viewBox="0 0 27 18" fill="none">
      <rect x="1" y="1.6" width="16.6" height="14.8" rx="4.2" stroke={color} strokeWidth="1.75" />
      <path
        d="M18.4 7.1 23.6 3.9c.75-.46 1.7.08 1.7.95v8.3c0 .87-.95 1.41-1.7.95l-5.2-3.2z"
        stroke={color}
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** SF Symbol "plus". */
function PlusGlyph({ color }: { color: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M9 1.2v15.6M1.2 9h15.6" stroke={color} strokeWidth="1.85" strokeLinecap="round" />
    </svg>
  );
}

/** SF Symbol "waveform" (audio message button in the text field). */
function WaveformGlyph({ color }: { color: string }) {
  const bars = [4.4, 8.2, 16, 8.2, 4.4];
  return (
    <svg width="19" height="17" viewBox="0 0 19 17" fill="none">
      {bars.map((h, i) => (
        <line
          key={i}
          x1={1.5 + i * 4}
          x2={1.5 + i * 4}
          y1={8.5 - h / 2 + 0.7}
          y2={8.5 + h / 2 - 0.7}
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      ))}
    </svg>
  );
}

/** SF Symbol "arrow.up" (bold), the send glyph. Never mirrors. */
function ArrowUpGlyph() {
  return (
    <svg width="16" height="18" viewBox="0 0 16 18" fill="none">
      <path d="M8 16.4V2.4M1.9 8.3 8 2.2l6.1 6.1" stroke="#ffffff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** SF Symbol "play.fill" (rounded triangle). */
function PlayGlyph({ color }: { color: string }) {
  return (
    <svg width="11" height="13" viewBox="0 0 11 13" fill="none">
      <path d="M1 1.8C1 .9 1.9.4 2.7.8l7.4 4.4c.7.4.7 1.5 0 1.9L2.7 11.6c-.8.5-1.7-.1-1.7-1z" fill={color} />
    </svg>
  );
}

function PhotoGlyph({ color }: { color: string }) {
  return (
    <svg width="34" height="28" viewBox="0 0 34 28" fill="none">
      <rect x="1.5" y="1.5" width="31" height="25" rx="5" stroke={color} strokeWidth="2" />
      <circle cx="11" cy="10" r="3" fill={color} />
      <path d="M3 23l9-8 6 5 5-4 9 7" stroke={color} strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

/* ------------------------------- avatar ------------------------------- */

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  if (parts.length === 1) return Array.from(parts[0])[0].toUpperCase();
  return (Array.from(parts[0])[0] + Array.from(parts[parts.length - 1])[0]).toUpperCase();
}

/** Contacts-style avatar: the photo, or the grey gradient monogram. */
function ContactAvatar({ person, size, dark }: { person: Person; size: number; dark: boolean }) {
  if (person.avatar) return <Avatar person={person} size={size} />;
  const text = initials(person.name);
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full text-white"
      style={{
        width: size,
        height: size,
        background: dark
          ? "linear-gradient(180deg, #8d909a 0%, #6a6d76 100%)"
          : "linear-gradient(180deg, #a6abb7 0%, #858a95 100%)",
        fontSize: size * 0.42,
        fontWeight: 600,
        letterSpacing: "-0.01em",
        lineHeight: 1,
      }}
    >
      {text || (
        <svg width={size * 0.56} height={size * 0.56} viewBox="0 0 24 24" fill="#ffffff">
          <circle cx="12" cy="8" r="4.6" />
          <path d="M3.5 21c.6-4.4 4.1-7 8.5-7s7.9 2.6 8.5 7z" />
        </svg>
      )}
    </div>
  );
}

/* ------------------------------- tails ------------------------------- */

/**
 * Corner + tail outline, origin at the bubble body's bottom trailing corner
 * (x grows outward, y grows down). Measured on [A] and cross-checked on [B].
 * Each entry is an SVG path command with absolute points.
 */
type Cmd = ["M" | "L", number, number] | ["A", number, number, number] | ["C", number, number, number, number, number, number];
const CORNER: Cmd[] = [
  ["L", 0, -18.5],
  ["A", 16.3, -7.4, -4.9],
  ["C", -8.9, -3.2, -10.4, -1.6, -10.4, 0.4],
  ["C", -10.4, 2.6, -9.2, 4.6, -8.4, 6.2],
  ["C", -8.0, 7.0, -8.6, 7.5, -9.6, 7.3],
  ["C", -11.6, 6.6, -15.8, 3.6, -19.0, 1.2],
  ["C", -20.0, 0.5, -21.2, 0, -22.6, 0],
];

function cmdsToPath(cmds: Cmd[], map: (x: number, y: number) => [number, number], mirrored: boolean): string {
  const f = (n: number) => Number(n.toFixed(2));
  return cmds
    .map((c) => {
      if (c[0] === "M" || c[0] === "L") {
        const [x, y] = map(c[1], c[2]);
        return `${c[0]}${f(x)} ${f(y)}`;
      }
      if (c[0] === "A") {
        const [x, y] = map(c[2], c[3]);
        return `A${c[1]} ${c[1]} 0 0 ${mirrored ? 0 : 1} ${f(x)} ${f(y)}`;
      }
      const [, a1, b1, a2, b2, a3, b3] = c as ["C", number, number, number, number, number, number];
      const [x1, y1] = map(a1, b1);
      const [x2, y2] = map(a2, b2);
      const [x3, y3] = map(a3, b3);
      return `C${f(x1)} ${f(y1)} ${f(x2)} ${f(y2)} ${f(x3)} ${f(y3)}`;
    })
    .join(" ");
}

/** The tail piece (25 × 28.6), drawn on the right; mirrored with scaleX for the left. */
const TAIL_W = 25;
const TAIL_H = 21 + TAIL_DROP;
const TAIL_PATH = `M0 0 L25 0 ${cmdsToPath(CORNER, (x, y) => [x + 25, y + 21], false)} L0 21 Z`;

/** Clip that removes the body's tail-side bottom corner (the tail piece redraws it, 1pt overlap). */
function bodyClip(tailRight: boolean | null): string | undefined {
  if (tailRight === null) return undefined;
  return tailRight
    ? "polygon(0 0, 100% 0, 100% calc(100% - 20px), calc(100% - 24px) calc(100% - 20px), calc(100% - 24px) 100%, 0 100%)"
    : "polygon(0 0, 100% 0, 100% 100%, 24px 100%, 24px calc(100% - 20px), 0 calc(100% - 20px))";
}

/** Full outline of a W×H rounded body with an optional tail (for image clipping). */
function outlinePath(w: number, h: number, r: number, tail: "right" | "left" | null): string {
  const mirrored = tail === "left";
  const mx = (x: number) => (mirrored ? w - x : x);
  // right-tail outline, clockwise from the top-left
  const parts: string[] = [];
  const f = (n: number) => Number(n.toFixed(2));
  const sweep = mirrored ? 0 : 1;
  const P = (x: number, y: number) => `${f(mx(x))} ${f(y)}`;
  parts.push(`M${P(r, 0)}`);
  parts.push(`L${P(w - r, 0)}`);
  parts.push(`A${r} ${r} 0 0 ${sweep} ${P(w, r)}`);
  if (tail) {
    parts.push(cmdsToPath(CORNER, (x, y) => [mx(w + x), h + y], mirrored));
  } else {
    parts.push(`L${P(w, h - r)}`);
    parts.push(`A${r} ${r} 0 0 ${sweep} ${P(w - r, h)}`);
  }
  parts.push(`L${P(r, h)}`);
  parts.push(`A${r} ${r} 0 0 ${sweep} ${P(0, h - r)}`);
  parts.push(`L${P(0, r)}`);
  parts.push(`A${r} ${r} 0 0 ${sweep} ${P(r, 0)}`);
  return parts.join(" ") + " Z";
}

/* ------------------------------- bubbles ------------------------------- */

interface FillProps {
  mine: boolean;
  color: string;
}

/** Bubble background (+ optional tail) behind the content, so the content is never clipped. */
/** true while the video exporter drives frames: scroll timelines are unreliable inside a snapdom clone. */
const StaticFill = createContext(false);

function BubbleFill({ mine, color, tail }: FillProps & { tail: "right" | "left" | null }) {
  const staticFill = useContext(StaticFill);
  const fillClass = mine ? (staticFill ? "imsg-ios-out-js" : "imsg-ios-out-fill") : undefined;
  const fillStyle: CSSProperties = mine ? {} : { background: color };
  return (
    <>
      <div
        aria-hidden
        className={`absolute inset-0 ${fillClass ?? ""}`}
        style={{ ...fillStyle, borderRadius: RADIUS, clipPath: bodyClip(tail === null ? null : tail === "right") }}
      />
      {tail && (
        <div
          aria-hidden
          className={`absolute ${fillClass ?? ""}`}
          style={{
            ...fillStyle,
            width: TAIL_W,
            height: TAIL_H,
            bottom: -TAIL_DROP,
            ...(tail === "right" ? { right: 0 } : { left: 0, transform: "scaleX(-1)" }),
            clipPath: `path("${TAIL_PATH}")`,
          }}
        />
      )}
    </>
  );
}

/** Up to three emoji with no other text render "jumbo", without a bubble. */
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
const JUMBO_SIZE = [0, 52, 46, 40];

/** Deterministic, speech-like waveform: silent dotted edges, voiced middle. */
function waveform(seed: string, n = 36): number[] {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0;
    const r = (h % 1000) / 1000;
    if (i < 5 || i >= n - 4) {
      out.push(1.8);
      continue;
    }
    const k = (i - 5) / (n - 10);
    const envelope = 0.35 + 0.65 * Math.sin(Math.PI * k);
    out.push(Math.max(3.5, Math.round((4 + r * 21 * envelope) * 2) / 2));
  }
  return out;
}

/** iOS 26 shows audio length as mm:ss ("00:04"). */
function audioDuration(raw: string | undefined): string {
  const v = (raw || "0:09").trim();
  return /^\d:\d\d$/.test(v) ? `0${v}` : v;
}

function VoiceBubble({ m, mine, p, tail }: { m: Message; mine: boolean; p: Palette; tail: "right" | "left" | null }) {
  const disc = mine ? "#ffffff" : p.inText;
  const tri = mine ? "#0a8cfd" : p.inBubble;
  const bar = mine ? "#ffffff" : p.inText;
  const dur = mine ? "rgba(255,255,255,0.7)" : p.secondary;
  const bars = waveform(m.id);
  return (
    <div className="relative" style={{ color: mine ? "#fff" : p.inText }}>
      <BubbleFill mine={mine} color={p.inBubble} tail={tail} />
      <div
        className="relative flex items-center"
        dir="ltr"
        style={{ padding: "11.75px 14px 11.75px 15.5px", gap: 12 }}
      >
        <span className="flex shrink-0 items-center justify-center rounded-full" style={{ width: 28.5, height: 28.5, background: disc }}>
          <span style={{ marginLeft: 2, display: "flex" }}>
            <PlayGlyph color={tri} />
          </span>
        </span>
        <span className="flex items-center" style={{ gap: 2.2, height: 26 }}>
          {bars.map((b, i) => (
            <span key={i} className="block rounded-full" style={{ width: 1.8, height: b, background: bar }} />
          ))}
        </span>
        <span style={{ color: dur, fontSize: 15, lineHeight: "20px", fontVariantNumeric: "tabular-nums", letterSpacing: "-0.2px" }}>
          {audioDuration(m.voiceDuration)}
        </span>
      </div>
    </div>
  );
}

/** Image, clipped to the bubble outline (tail included when it ends a run). */
function ImageBubble({ src, p, tail }: { src?: string | null; p: Palette; tail: "right" | "left" | null }) {
  const [ratio, setRatio] = useState<number | null>(null);
  const bodyH = src ? Math.round(Math.min(330, Math.max(110, IMG_W / (ratio ?? 4 / 3)))) : 183;
  const boxH = bodyH + (tail ? TAIL_DROP : 0);
  const clip = `path("${outlinePath(IMG_W, bodyH, RADIUS, tail)}")`;
  return (
    <div style={{ width: IMG_W, height: boxH, clipPath: clip }}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt=""
          draggable={false}
          className="block"
          onLoad={(e) => {
            const im = e.currentTarget;
            if (im.naturalWidth && im.naturalHeight) setRatio(im.naturalWidth / im.naturalHeight);
          }}
          style={{ width: IMG_W, height: boxH, objectFit: "cover" }}
        />
      ) : (
        <div className="flex items-center justify-center" style={{ width: IMG_W, height: boxH, background: p.photoFill }}>
          <PhotoGlyph color="rgba(142,142,147,0.9)" />
        </div>
      )}
    </div>
  );
}

function TypingBubble({
  p,
  live,
  clockMs,
  boxRef,
}: {
  p: Palette;
  live: boolean;
  clockMs?: number;
  boxRef: React.RefObject<HTMLDivElement | null>;
}) {
  return (
    <div className="flex" style={{ paddingInlineStart: SIDE }}>
      <div
        ref={boxRef}
        className={live ? "imsg-ios-anim-typing" : ""}
        style={{ transformOrigin: "var(--imsg-start) 100%" }}
      >
        <div
          className="relative flex items-center justify-center"
          style={{ width: 62, height: 40, borderRadius: 20, background: p.inBubble, gap: 4.5 }}
        >
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="block rounded-full"
              style={{
                width: 9,
                height: 9,
                background: p.typingDot,
                ...(clockMs !== undefined
                  ? { opacity: dotOpacity((clockMs - i * DOT_STAGGER) / DOT_PERIOD) }
                  : {
                      opacity: 0.35,
                      animation: `imsg-ios-dot ${DOT_PERIOD}ms ease-in-out infinite`,
                      animationDelay: `${i * DOT_STAGGER}ms`,
                    }),
              }}
            />
          ))}
          {/* trailing "thought" circles */}
          <span
            className="absolute block rounded-full"
            style={{ width: 14, height: 14, background: p.inBubble, insetInlineStart: -1.5, bottom: -1.5 }}
          />
          <span
            className="absolute block rounded-full"
            style={{ width: 6.5, height: 6.5, background: p.inBubble, insetInlineStart: -6.5, bottom: -7 }}
          />
        </div>
      </div>
    </div>
  );
}

/* ------------------------------ composer ------------------------------ */

const FIELD_LINE = 22;
const FIELD_MAX_LINES = 6;
const SEND_D = 32;
const SEND_INSET = 4;

/** UITextView insertion point: 2pt systemBlue bar. */
function Caret({ p, clockMs }: { p: Palette; clockMs?: number }) {
  return (
    <span
      aria-hidden
      className={clockMs === undefined ? "imsg-ios-caret" : undefined}
      style={{
        display: "inline-block",
        width: 2,
        height: 20.5,
        borderRadius: 1,
        background: p.caret,
        verticalAlign: -4.5,
        marginInline: 0.5,
        opacity: clockMs === undefined ? undefined : caretOpacity(clockMs),
      }}
    />
  );
}

/** iOS 26 send button: tinted (blue) Liquid Glass disc with a bold arrow.up. */
function SendButton({ dark, pop }: { dark: boolean; pop: boolean }) {
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full ${pop ? "imsg-ios-anim-pop" : ""}`}
      style={{
        width: SEND_D,
        height: SEND_D,
        marginBlock: (COMPOSER_H - SEND_D) / 2,
        marginInlineStart: 8,
        background: dark
          ? "linear-gradient(180deg, #2ea4ff 0%, #0091ff 55%, #0089f5 100%)"
          : "linear-gradient(180deg, #33a3ff 0%, #0088ff 55%, #0080f2 100%)",
        boxShadow:
          "inset 0 0.75px 0.5px rgba(255,255,255,0.45), inset 0 -0.5px 1px rgba(0,40,120,0.18), 0 1px 3px rgba(0,110,255,0.22)",
      }}
    >
      <ArrowUpGlyph />
    </span>
  );
}

/* ------------------------------ tapbacks ------------------------------ */

/**
 * iOS 18+/26 emoji Tapback, measured on Apple's iOS 26 guide image
 * (support.apple.com/guide/iphone/iph018d3c336, asset c472aee5…, 1.105 px/pt):
 * a 32pt disc (+1.5pt background ring) centred 3pt inside the bubble's inner
 * edge and 11pt above its top, with two "thought" circles (8pt, 4pt) trailing
 * down and outward. My Tapback is blue, theirs uses the incoming grey.
 */
const TAP_D = 32;
const TAP_RING = 1.5;
const TAP_BOX = 64;
/** extra space a Tapback claims above its bubble */
const TAP_SPACE = 24;

function Tapback({ emoji, byMe, side, p }: { emoji: string; byMe: boolean; side: "left" | "right"; p: Palette }) {
  const fill = byMe ? p.blue : p.inBubble;
  const c = TAP_BOX / 2;
  const sx = side === "right" ? 1 : -1;
  const discs = [
    { x: c, y: c, r: TAP_D / 2 },
    { x: c + 10.4 * sx, y: c + 14.4, r: 4.1 },
    { x: c + 18.4 * sx, y: c + 23.2, r: 2.05 },
  ];
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute z-10"
      style={{ width: TAP_BOX, height: TAP_BOX, top: -11 - c, [side]: 3 - c } as CSSProperties}
    >
      <svg width={TAP_BOX} height={TAP_BOX} viewBox={`0 0 ${TAP_BOX} ${TAP_BOX}`} className="absolute inset-0 overflow-visible">
        {discs.map((d, i) => (
          <circle key={`r${i}`} cx={d.x} cy={d.y} r={d.r + TAP_RING} fill={p.bg} />
        ))}
        {discs.map((d, i) => (
          <circle key={`f${i}`} cx={d.x} cy={d.y} r={d.r} fill={fill} />
        ))}
      </svg>
      <span
        className="absolute flex items-center justify-center"
        style={{ left: c - TAP_D / 2, top: c - TAP_D / 2, width: TAP_D, height: TAP_D, fontSize: 19, lineHeight: 1 }}
      >
        {emoji}
      </span>
    </div>
  );
}

/* ---------------------------- inline replies ---------------------------- */

/**
 * The parent of an inline reply, drawn as the parent bubble at 0.7 scale with
 * a hairline outline and secondary text (iOS 26 guide image c472aee5…: the
 * quote capsule is 0.67–0.70 of the full bubble, tail included), followed by
 * the blue "N Replies" count, then the reply itself. A thread line runs from
 * the quote's tail to the reply.
 */
const Q = 0.7;

function ReplyQuote({ parent, p, l, tail }: { parent: Message; p: Palette; l: LocalStrings; tail: "left" | "right" }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  useLayoutEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const measure = () => {
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      setSize((prev) => (prev && prev.w === w && prev.h === h ? prev : { w, h }));
    };
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const isImage = parent.type === "image" && !!parent.imageSrc;
  const text =
    parent.type === "voice" ? l.audio : parent.type === "image" ? parent.text.trim() || l.photo : parent.text.trim();
  const r = RADIUS * Q;

  return (
    <div className="relative" style={{ paddingBottom: TAIL_DROP * Q }}>
      {size && (
        <svg
          aria-hidden
          className="absolute overflow-visible"
          style={{ left: 0, top: 0 }}
          width={size.w}
          height={size.h + TAIL_DROP * Q}
          viewBox={`0 0 ${size.w / Q} ${(size.h + TAIL_DROP * Q) / Q}`}
        >
          <path
            d={outlinePath(size.w / Q, size.h / Q, RADIUS, tail)}
            fill="none"
            stroke={p.quoteStroke}
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      )}
      <div ref={boxRef} className="relative flex items-center" style={{ maxWidth: Math.round(MAX_W * Q), borderRadius: r }}>
        {isImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={parent.imageSrc ?? undefined}
            alt=""
            draggable={false}
            className="block"
            style={{ width: Math.round(IMG_W * Q * 0.5), height: Math.round(IMG_W * Q * 0.5 * 0.75), objectFit: "cover", borderRadius: r, opacity: 0.85 }}
          />
        ) : (
          <div style={{ padding: `${(PAD_Y * Q).toFixed(2)}px ${(PAD_X * Q).toFixed(2)}px` }}>
            <p
              dir={dirOf(text)}
              className="overflow-hidden break-words"
              style={{
                color: p.secondary,
                fontSize: 17 * Q,
                lineHeight: `${(LINE * Q).toFixed(2)}px`,
                letterSpacing: "-0.08px",
                margin: 0,
                display: "-webkit-box",
                WebkitBoxOrient: "vertical",
                WebkitLineClamp: 2,
              }}
            >
              {text}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function RepliesLabel({ n, p, l, inset, marginTop }: { n: number; p: Palette; l: LocalStrings; inset: number; marginTop: number }) {
  return (
    <div
      style={{
        color: p.blue,
        fontSize: 13,
        lineHeight: "16px",
        fontWeight: 600,
        letterSpacing: "-0.08px",
        marginTop,
        paddingInline: inset,
        whiteSpace: "nowrap",
      }}
    >
      {l.replies(n)}
    </div>
  );
}

/** Quote + count + reply, with the measured thread connector behind them. */
function ReplyThread({
  parent,
  replies,
  mine,
  p,
  l,
  rtl,
  extraTop,
  children,
}: {
  parent: Message;
  replies: number;
  mine: boolean;
  p: Palette;
  l: LocalStrings;
  rtl: boolean;
  extraTop: number;
  children: ReactNode;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const quoteRef = useRef<HTMLDivElement>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const [path, setPath] = useState<string | null>(null);
  const parentMine = parent.sender === "me";
  const quoteRight = parentMine ? !rtl : rtl;

  useLayoutEffect(() => {
    const root = rootRef.current;
    const q = quoteRef.current;
    const b = bubbleRef.current;
    if (!root || !q || !b) return;
    const measure = () => {
      const rb = root.getBoundingClientRect();
      const k = rb.width / (root.offsetWidth || 1) || 1;
      const qb = q.getBoundingClientRect();
      const bb = b.getBoundingClientRect();
      const L = (x: number) => (x - rb.left) / k;
      const T = (y: number) => (y - rb.top) / k;
      // the quote's tail tip: 6.3pt in from its edge, at the bottom of its box
      const x0 = quoteRight ? L(qb.right) - 6.3 : L(qb.left) + 6.3;
      const y0 = T(qb.bottom) - 0.5;
      const bl = L(bb.left);
      const br = L(bb.right);
      const bt = T(bb.top);
      const yMid = bt + Math.min((bb.height / k) / 2, 20);
      const f = (n: number) => n.toFixed(1);
      let d: string;
      if (x0 >= bl - 1 && x0 <= br + 1) {
        d = `M${f(x0)} ${f(y0)} V${f(bt)}`;
      } else {
        const dir = bl > x0 ? 1 : -1;
        const xEnd = dir > 0 ? bl : br;
        const rr = 11;
        d = `M${f(x0)} ${f(y0)} V${f(yMid - rr)} Q${f(x0)} ${f(yMid)} ${f(x0 + dir * rr)} ${f(yMid)} H${f(xEnd)}`;
      }
      setPath((prev) => (prev === d ? prev : d));
    };
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(measure);
    ro.observe(root);
    return () => ro.disconnect();
  }, [quoteRight]);

  return (
    <div ref={rootRef} className="relative flex w-full flex-col">
      {path && (
        <svg aria-hidden className="pointer-events-none absolute inset-0 overflow-visible" width="100%" height="100%">
          <path d={path} fill="none" stroke={p.thread} strokeWidth={2} strokeLinecap="round" />
        </svg>
      )}
      <div ref={quoteRef} className="relative" style={{ alignSelf: parentMine ? "flex-end" : "flex-start" }}>
        <ReplyQuote parent={parent} p={p} l={l} tail={quoteRight ? "right" : "left"} />
      </div>
      <div style={{ alignSelf: parentMine ? "flex-end" : "flex-start" }}>
        <RepliesLabel n={replies} p={p} l={l} inset={16} marginTop={2} />
      </div>
      <div
        ref={bubbleRef}
        className="relative flex flex-col"
        style={{ alignSelf: mine ? "flex-end" : "flex-start", alignItems: mine ? "flex-end" : "flex-start", marginTop: 6 + extraTop }}
      >
        {children}
      </div>
    </div>
  );
}

/* ------------------------------ helpers ------------------------------ */

/** Minutes since midnight from a typed clock ("10:41", "9:05 PM"), or null. */
function minutesOf(t: string): number | null {
  const mt = /^\s*(\d{1,2})[:.](\d{2})\s*([AaPp])?/.exec(t);
  if (!mt) return null;
  let h = Number(mt[1]) % 24;
  const mins = Number(mt[2]);
  const ap = mt[3]?.toLowerCase();
  if (ap === "p" && h < 12) h += 12;
  if (ap === "a" && h === 12) h = 0;
  return h * 60 + mins;
}

/** iOS sets the AM/PM marker off with a narrow no-break space. */
function clock(t: string): string {
  return t.trim().replace(/\s+(AM|PM|am|pm|ص|م)$/u, "\u202f$1");
}

/**
 * Export frames: give each outgoing fill its slice of the screen-fixed gradient
 * from its current on-screen position (scroll timelines don't survive the
 * snapdom clone).
 */
function pinGradient(root: HTMLElement) {
  const box = root.getBoundingClientRect();
  const k = box.height / root.clientHeight || 1; // the studio may scale the phone
  root.querySelectorAll<HTMLElement>(".imsg-ios-out-js").forEach((f) => {
    const y = (f.getBoundingClientRect().top - box.top) / k;
    f.style.backgroundPosition = `0 ${(-y).toFixed(1)}px`;
  });
}

/* ------------------------------ component ------------------------------ */

export function IMessage({ scenario, playback, lang, rtl }: PlatformProps) {
  const dark = scenario.theme === "dark";
  const p = dark ? DARK : LIGHT;
  const l = LOCAL[lang];
  const { messages, typing, clockMs } = playback;
  const live = playback.isLive;
  const draft = playback.draft;
  const draftText = draft?.text ?? "";
  const draftHasText = draftText.length > 0;

  // The field grows with the draft; the transcript's bottom inset follows it.
  const composerRef = useRef<HTMLDivElement>(null);
  const [composerH, setComposerH] = useState(COMPOSER_H);
  useLayoutEffect(() => {
    const el = composerRef.current;
    if (!el) return;
    const measure = () => {
      const h = el.offsetHeight;
      if (h) setComposerH((prev) => (prev === h ? prev : h));
    };
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [draftText]);
  const grow = Math.max(0, composerH - COMPOSER_H);

  const scrollRef = useChatScroll<HTMLDivElement>(`${messages.length}-${typing}-${grow}`);
  const rootRef = useRef<HTMLDivElement>(null);
  const typingRef = useRef<HTMLDivElement>(null);
  const typingSince = useRef<number | undefined>(undefined);

  // The outgoing gradient is fixed to the screen: give it the real screen height,
  // and in export frames pin each bubble's slice of it from its on-screen position.
  const exporting = clockMs !== undefined;
  useLayoutEffect(() => {
    const el = rootRef.current;
    if (!el || !el.clientHeight) return;
    el.style.setProperty("--imsg-h", `${el.clientHeight}px`);
    if (exporting) pinGradient(el);
  });
  // The exporter (and the harness) move the scroller after rendering; re-pin then.
  useLayoutEffect(() => {
    const root = rootRef.current;
    const sc = scrollRef.current;
    if (!exporting || !root || !sc) return;
    const onScroll = () => pinGradient(root);
    sc.addEventListener("scroll", onScroll, { passive: true });
    return () => sc.removeEventListener("scroll", onScroll);
  }, [exporting, scrollRef]);

  // Typing indicator entrance in the exported video (no CSS animations there).
  useLayoutEffect(() => {
    const el = typingRef.current;
    if (clockMs === undefined || !typing) {
      typingSince.current = undefined;
      return;
    }
    if (typingSince.current === undefined) typingSince.current = clockMs;
    if (!el) return;
    const t = (clockMs - typingSince.current) / TYPING_IN_MS;
    if (t >= 1) {
      el.style.opacity = "";
      el.style.transform = "";
      return;
    }
    const f = inFrame(Math.max(0, t), 0.3);
    el.style.opacity = String(f.opacity);
    el.style.transform = f.transform;
  }, [typing, clockMs]);

  // The receipt sits under the user's most recent outgoing message, even if
  // replies came in after it — exactly like Messages.
  let lastMineId: string | undefined;
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].sender === "me") {
      lastMineId = messages[i].id;
      break;
    }
  }

  const stampTime = clock(scenario.messages[0]?.time || "9:41");

  // inline replies on screen, per parent id
  const replyCount = new Map<string, number>();
  for (const m of messages) {
    if (m.replyToId && m.replyToId !== m.id && messages.some((x) => x.id === m.replyToId)) {
      replyCount.set(m.replyToId, (replyCount.get(m.replyToId) ?? 0) + 1);
    }
  }

  const rows: ReactNode[] = [];
  let prevHadReceipt = false;
  messages.forEach((m, i) => {
    const mine = m.sender === "me";
    const next = messages[i + 1];
    const prev = messages[i - 1];
    const { firstOfGroup, lastOfGroup } = groupInfo(messages, i);
    const onRight = mine ? !rtl : rtl;
    const side: "right" | "left" = onRight ? "right" : "left";
    const status = mine && m.id === lastMineId ? playback.statusOf(m) : undefined;
    const showReceipt = status === "delivered" || status === "read";
    const hasText = m.text.trim().length > 0;
    const emojis = m.type === "text" ? emojiCount(m.text) : 0;
    const align = mine ? "flex-end" : "flex-start";

    // Mid-thread time stamp after an hour of silence.
    let stamp: ReactNode = null;
    if (prev) {
      const a = minutesOf(prev.time);
      const b = minutesOf(m.time);
      if (a !== null && b !== null && b - a >= 60) {
        stamp = (
          <div
            key={`stamp-${m.id}`}
            className="text-center"
            style={{ color: p.secondary, fontSize: 11, lineHeight: "13.5px", marginTop: 14, marginBottom: -1.5 }}
          >
            <span style={{ fontWeight: 600 }}>{l.today}</span> {clock(m.time)}
          </div>
        );
        rows.push(stamp);
      }
    }

    // Tail: the last bubble of a run; an image also ends its run when a non-image follows.
    const imageEndsRun = m.type === "image" && !!next && next.sender === m.sender && next.type !== "image";
    const tailOn = lastOfGroup || imageEndsRun;

    // Tapback on the bubble's inner top corner (the one facing the screen centre).
    const tap = m.reaction ? <Tapback emoji={m.reaction} byMe={!mine} side={onRight ? "left" : "right"} p={p} /> : null;
    const parent = m.replyToId ? messages.find((x) => x.id === m.replyToId && x.id !== m.id) : undefined;

    const textBubble = (tail: boolean, withTap: boolean) => (
      <div className="relative" style={{ maxWidth: MAX_W, minWidth: 40, color: mine ? "#ffffff" : p.inText }}>
        {withTap && tap}
        <BubbleFill mine={mine} color={p.inBubble} tail={tail ? side : null} />
        <p
          dir={dirOf(m.text)}
          className="relative whitespace-pre-wrap break-words"
          style={{
            fontSize: 17,
            lineHeight: `${LINE}px`,
            letterSpacing: "-0.43px",
            margin: 0,
            padding: `${PAD_Y}px ${PAD_X}px`,
          }}
        >
          {m.text}
        </p>
      </div>
    );

    let content: ReactNode;
    if (m.type === "voice") {
      content = (
        <div className="relative">
          {tap}
          <VoiceBubble m={m} mine={mine} p={p} tail={lastOfGroup ? side : null} />
        </div>
      );
    } else if (m.type === "image") {
      content = (
        <>
          <div className="relative">
            {tap}
            <ImageBubble src={m.imageSrc} p={p} tail={hasText || tailOn ? side : null} />
          </div>
          {hasText && <div style={{ marginTop: GAP_GROUP }}>{textBubble(lastOfGroup, false)}</div>}
        </>
      );
    } else if (emojis) {
      const fs = JUMBO_SIZE[emojis];
      content = (
        <div className="relative" dir="ltr" style={{ fontSize: fs, lineHeight: `${Math.round(fs * 1.17)}px`, padding: "0 1px" }}>
          {tap}
          {m.text.trim()}
        </div>
      );
    } else {
      content = textBubble(lastOfGroup, true);
    }

    const replies = replyCount.get(m.id) ?? 0;
    // the original message carries the blue "N Replies" count under it
    const bubbleTail = m.type === "image" ? hasText ? lastOfGroup : tailOn : lastOfGroup;
    if (replies > 0) {
      content = (
        <>
          {content}
          <RepliesLabel n={replies} p={p} l={l} inset={20} marginTop={(bubbleTail ? TAIL_DROP : 0) + 3} />
        </>
      );
    }
    if (parent) {
      content = (
        <ReplyThread
          parent={parent}
          replies={replyCount.get(parent.id) ?? 1}
          mine={mine}
          p={p}
          l={l}
          rtl={rtl}
          extraTop={tap ? TAP_SPACE : 0}
        >
          {content}
        </ReplyThread>
      );
    }

    let marginTop = 0;
    if (stamp) marginTop = 9.5;
    else if (i > 0) marginTop = prevHadReceipt ? GAP_AFTER_RECEIPT : firstOfGroup ? GAP_SENDER : GAP_GROUP;
    if (tap && !parent) marginTop += TAP_SPACE;
    if (parent) marginTop = Math.max(marginTop, GAP_SENDER);

    rows.push(
      <div
        key={m.id}
        data-mid={m.id}
        data-sender={m.sender}
        className={`flex flex-col ${live ? (mine ? "imsg-ios-anim-out" : "imsg-ios-anim-in") : ""}`}
        style={{
          alignItems: align,
          paddingInline: SIDE,
          marginTop,
          transformOrigin: originFor(mine, rtl),
        }}
      >
        {content}

        {showReceipt && (
          <div
            key={status}
            className={live ? "imsg-ios-anim-fade" : ""}
            style={{
              color: p.secondary,
              fontSize: 11,
              lineHeight: "13px",
              fontWeight: 600,
              marginTop: 6,
              paddingInlineEnd: 21,
              whiteSpace: "nowrap",
            }}
          >
            {status === "read" ? `${l.read} ${clock(m.time)}` : l.delivered}
            {m.type === "voice" && <span style={{ color: p.blue, marginInlineStart: 6 }}>{l.keep}</span>}
          </div>
        )}
      </div>,
    );
    prevHadReceipt = showReceipt;
  });

  const last = messages[messages.length - 1];
  const typingGap = !last ? 0 : prevHadReceipt ? GAP_AFTER_RECEIPT : last.sender === "them" ? GAP_GROUP : GAP_SENDER;

  return (
    <StaticFill.Provider value={clockMs !== undefined}>
    <div
      ref={rootRef}
      className="relative h-full w-full overflow-hidden"
      style={
        {
          background: p.bg,
          fontFamily: IOS_FONT,
          WebkitFontSmoothing: "antialiased",
          "--imsg-start": rtl ? "100%" : "0%",
        } as CSSProperties
      }
    >
      <style>{STYLE}</style>

      {/* ------------------------------ body ------------------------------ */}
      <div ref={scrollRef} className="rcss-scroll absolute inset-0 overflow-y-auto">
        <div style={{ paddingTop: STAMP_TOP, paddingBottom: BODY_BOTTOM + grow }}>
          {/* Service + time stamp */}
          <div
            className="text-center"
            style={{ color: p.secondary, fontSize: 11, lineHeight: "13.5px", fontWeight: 500, marginBottom: 7.8 }}
          >
            <div>{l.service}</div>
            <div>
              {l.today} {stampTime}
            </div>
          </div>

          <div className="flex flex-col">
            {rows}

            {typing && (
              <div style={{ marginTop: typingGap }}>
                <TypingBubble p={p} live={live} clockMs={clockMs} boxRef={typingRef} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* --------------------- header scroll-edge fade --------------------- */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-10"
        style={{
          height: 168,
          background: `linear-gradient(to bottom, ${p.bg} 0px, ${p.bgA(0.97)} 54px, ${p.bgA(0.72)} 98px, ${p.bgA(0.32)} 138px, ${p.bgA(0)} 168px)`,
        }}
      />

      {/* ----------------------------- header ----------------------------- */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20">
        <StatusBar device={scenario.device} tint={dark ? "light" : "dark"} background="transparent" />
        {/* back */}
        <div
          className="absolute flex items-center justify-center rounded-full"
          style={{ ...glass(dark), insetInlineStart: 16, top: 58, width: 44, height: 44 }}
        >
          <span style={{ marginInlineEnd: 2.5, display: "flex" }}>
            <ChevronBack color={p.label} />
          </span>
        </div>

        {/* contact */}
        <div className="absolute left-1/2 flex -translate-x-1/2 flex-col items-center" style={{ top: 58 }}>
          <ContactAvatar person={scenario.them} size={60} dark={dark} />
          <div
            className="flex items-center rounded-full"
            style={{
              ...glass(dark),
              marginTop: -5,
              height: 31.5,
              paddingInlineStart: 12,
              paddingInlineEnd: 9,
              gap: 6.5,
              maxWidth: 230,
            }}
          >
            <span
              className="truncate"
              dir={dirOf(scenario.them.name)}
              style={{ color: p.label, fontSize: 17, lineHeight: "20px", fontWeight: 600, letterSpacing: "-0.43px" }}
            >
              {scenario.them.name}
            </span>
            <ChevronSmall color={p.nameChevron} />
          </div>
        </div>

        {/* FaceTime */}
        <div
          className="absolute flex items-center justify-center rounded-full"
          style={{ ...glass(dark), insetInlineEnd: 16, top: 58, width: 44, height: 44 }}
        >
          <VideoGlyph color={p.label} />
        </div>
      </div>

      {/* --------------------- composer scroll-edge fade --------------------- */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-10"
        style={{
          height: BODY_BOTTOM - 4 + grow,
          background: `linear-gradient(to top, ${p.bg} 0px, ${p.bgA(0.92)} ${COMPOSER_BOTTOM + 12}px, ${p.bgA(0.75)} ${COMPOSER_BOTTOM + COMPOSER_H + grow}px, ${p.bgA(0)} ${BODY_BOTTOM - 4 + grow}px)`,
        }}
      />

      {/* ---------------------------- composer ---------------------------- */}
      <div
        ref={composerRef}
        className="pointer-events-none absolute z-20 flex items-end"
        style={{ insetInline: COMPOSER_SIDE, bottom: COMPOSER_BOTTOM, minHeight: COMPOSER_H, gap: 12 }}
      >
        <div
          className="flex shrink-0 items-center justify-center rounded-full"
          style={{ ...glass(dark), width: COMPOSER_H, height: COMPOSER_H }}
        >
          <PlusGlyph color={p.label} />
        </div>
        <div
          className="flex min-w-0 flex-1 items-end"
          style={{
            ...glass(dark),
            borderRadius: COMPOSER_H / 2,
            minHeight: COMPOSER_H,
            paddingInlineStart: 15,
            paddingInlineEnd: draftHasText ? SEND_INSET : 12,
          }}
        >
          <div
            className="flex min-w-0 flex-1 flex-col justify-end overflow-hidden"
            style={{ maxHeight: FIELD_LINE * FIELD_MAX_LINES + 18, paddingBlock: 9 }}
          >
            {draft ? (
              <p
                dir={draftHasText ? dirOf(draftText) : rtl ? "rtl" : "ltr"}
                className="whitespace-pre-wrap break-words"
                style={{ color: p.label, fontSize: 17, lineHeight: `${FIELD_LINE}px`, letterSpacing: "-0.43px", margin: 0 }}
              >
                {draftText}
                <Caret p={p} clockMs={clockMs} />
                {!draftHasText && (
                  <span dir="ltr" style={{ color: p.placeholder, marginInlineStart: 1 }}>
                    {l.placeholder}
                  </span>
                )}
              </p>
            ) : (
              <span
                dir="ltr"
                style={{
                  color: p.placeholder,
                  fontSize: 17,
                  lineHeight: `${FIELD_LINE}px`,
                  letterSpacing: "-0.43px",
                  textAlign: rtl ? "right" : "left",
                }}
              >
                {l.placeholder}
              </span>
            )}
          </div>
          {draftHasText ? (
            <SendButton dark={dark} pop={live && !exporting} />
          ) : (
            <span className="flex shrink-0 items-center" style={{ height: COMPOSER_H, marginInlineStart: 8 }}>
              <WaveformGlyph color={p.glyph} />
            </span>
          )}
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20">
        <SystemBottomBar device={scenario.device} bg="transparent" fg={p.label} />
      </div>
    </div>
    </StaticFill.Provider>
  );
}
