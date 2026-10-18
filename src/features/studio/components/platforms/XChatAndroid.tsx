"use client";

/**
 * X (formerly Twitter) — "Chat" conversation screen inside the X app for Android,
 * on a Samsung device (360 dp logical width), as it ships in October 2026.
 * Self-contained: shares nothing with the iOS file (values aligned with it).
 *
 * Sources
 *  [A] X on Google Play (com.twitter.android), screenshot "Chat freely"
 *      (play-lh.googleusercontent.com/N1z5F-ydOQ_9oBX5…, 1080×1920; phone screen
 *      735 px wide = 1.87 px/pt). Pixel-scanned: outgoing #1D9BF0, incoming dark
 *      #141414, full-pill bubbles (no tail, no flattened group corners), "Seen"
 *      under the latest outgoing bubble, "Today" centred grey with no chip, plain
 *      back arrow (no disc), "+" disc + capsule composer. Same art as the iOS
 *      App Store screenshot 8 the iOS template was measured from.
 *  [B] X web design tokens, abs.twimg.com/x-web/x-web/assets/styles-DmNcozGx.css:
 *      neutral-000 #F2F2F2 / neutral-1000 #141414 (bg-secondary = incoming),
 *      fg-secondary black-60 / white-60, btn-tertiary black-04 / white-10,
 *      bg-inputs black-04 / white-08, blue-500 #1D9BF0.
 *  [C] X Chat client bundles (chat.x.com/embed-v1.json →
 *      abs.twimg.com/x-web/xchat/embed/<sha>/assets/*): X's icon paths
 *      (icon-arrow-left, icon-phone-stroke, icon-camera-video-stroke, icon-plus,
 *      icon-voice, icon-play), the en/ar string tables ("Message"/"رسالة",
 *      "Seen"/"تمت المشاهدة", "Sent"/"تم الإرسال", "Today"/"اليوم",
 *      "{name} is typing …"/"يكتب …"), ReadStatus = {Sent, Read} only (no
 *      "Delivered"), no presence (online / last seen) anywhere in Chat, the voice
 *      note (32 dp play disc, 40-bar 2 px waveform, mono duration) and the
 *      composer spring {stiffness 500, damping 35}.
 *  [D] iOS sibling (XChat.tsx, lead-verified) for the shared grouping, receipt,
 *      typing-row and motion behaviour.
 *
 * Android adaptation (vs. iOS 393 pt): One UI status bar + 3-button nav bar,
 * 56 dp Material toolbar (back glyph at 16, 32 dp avatar at 56, title at 100,
 * 24 dp action glyphs 24 dp apart, 16 dp end inset), 16 sp body on a 21 sp line
 * (Material body-large size; iOS uses 17/22), pill = 41 dp, radius 20.5,
 * max width 272 dp (≈ iOS 300/393), device font (X's Chirp is not bundled),
 * Arabic-Indic digits are not needed (no per-message times are shown).
 * RTL mirrors the layout; the back arrow mirrors, phone / video / play / voice
 * glyphs do not. Each bubble's text direction comes from its content.
 *
 * Reactions, replies and compose typing (round 4), from the X Chat client [C]
 * (pin-page-rweb chunk: Mq/wq/dq reactions, u2/d2/f2/p2 reply preview, ct composer)
 * and the XChat launch film (0:21, typed draft + send disc). Web px × 16/15:
 *  - reaction chip: rounded-full, 21 dp content row, px 8.5, min-w 43, 1 dp ring in
 *    the page colour, tucked 10.5 dp under the bubble and 13 dp in from its edge on
 *    the sender's side; my reaction = selected (#1D9BF0 fill), theirs = gray-50 fill.
 *  - reply preview above the bubble: icon-reply-alt + quoted sender name (14/17 sp,
 *    gray-700), then the quote pill (px 13, py 6.5, 2 lines): gray-50 fill when it
 *    quotes them, 1 dp #1D9BF0/50 outline + blue text when it quotes me; voice →
 *    icon-voice + "Voice message", photo → 25% thumbnail (8.5 dp corners, hairline).
 *  - draft: text-colour text with a 2 dp caret, capsule grows (fixed 22 dp corners,
 *    up to 5 lines), the voice glyph becomes a 34 dp #1D9BF0 disc with a white
 *    icon-arrow-up, 5 dp from the capsule's end and bottom; 80 ms scale-0.9 fade.
 *
 * Motion: outgoing pills rise from the composer and settle on a lightly damped
 * spring while scaling 0.94 → 1; incoming pills fade up 10 dp (same functions as
 * iOS). Keyframes are generated from the same frame functions used by
 * `xAndroidMotion.enterStyle`, so live preview and export match.
 */

import type { CSSProperties, ReactNode } from "react";
import { useLayoutEffect, useRef, useState } from "react";

import type { Message, Person } from "../../types";
import { Avatar, dirOf, SystemBottomBar, useChatScroll } from "../shared";
import { SamsungStatusBar } from "../devices/SamsungStatusBar";
import type { Lang } from "./chrome";
import { groupInfo, type PlatformMotion, type PlatformProps } from "./types";

/* ------------------------------- tokens ------------------------------- */

const BLUE = "#1d9bf0";

interface Pal {
  bg: string;
  fg: string;
  secondary: string;
  inBubble: string;
  input: string;
  plusFill: string;
  photoFill: string;
  avatarBg: string;
  avatarFg: string;
  playDisc: string;
  playGlyph: string;
  /** gray-200 hairline around reply thumbnails */
  hairline: string;
}

const LIGHT: Pal = {
  bg: "#ffffff",
  fg: "#000000",
  secondary: "#666666", // black-60 on white
  inBubble: "#f2f2f2", // neutral-000
  input: "#f5f5f5", // bg-inputs black-04 on white
  plusFill: "#f5f5f5", // btn-tertiary black-04 on white
  photoFill: "#ebebeb",
  avatarBg: "#ccd6dd",
  avatarFg: "#ffffff",
  playDisc: "#000000",
  playGlyph: "#ffffff",
  hairline: "#e5e5e5",
};

const DARK: Pal = {
  bg: "#000000",
  fg: "#ffffff",
  secondary: "#999999", // white-60 on black
  inBubble: "#141414", // neutral-1000 (sampled #141414 in [A])
  input: "#141414", // bg-inputs white-08 on black
  plusFill: "#1a1a1a", // btn-tertiary white-10 on black
  photoFill: "#1f1f1f",
  avatarBg: "#3b3b3b",
  avatarFg: "#8a8a8a",
  playDisc: "#ffffff",
  playGlyph: "#000000",
  hairline: "#2e2e2e",
};

interface Strings {
  today: string;
  message: string;
  seen: string;
  sent: string;
  typing: (n: string) => string;
  voice: string;
  photo: string;
}

/* X Chat bundle strings; "Voice message" / "Photo" are the reply-preview labels. */
const STR: Record<Lang, Strings> = {
  en: { today: "Today", message: "Message", seen: "Seen", sent: "Sent", typing: (n) => `${n} is typing …`, voice: "Voice message", photo: "Photo" },
  ar: { today: "اليوم", message: "رسالة", seen: "تمت المشاهدة", sent: "تم الإرسال", typing: (n) => `${n} يكتب …`, voice: "رسالة صوتية", photo: "الصورة" },
};

/* metrics (dp) */
const SIDE = 16;
const TEXT = 16;
const LINE = 21;
const PAD_Y = 10;
const PAD_X = 16;
const RADIUS = (LINE + 2 * PAD_Y) / 2; // full pill on one line
const MAX_W = 272;
const IMG_MAX_W = 272;
const IMG_MAX_H = 340;
const IMG_RADIUS = 22;
const GAP_GROUP = 2;
const GAP_SENDER = 16;
const GAP_AFTER_RECEIPT = 14;
const TOOLBAR_H = 56;
const COMPOSER_H = 44;

/* Reply preview + reaction chip: X Chat client metrics (web px) × 16/15 (Android body / web body). */
const QUOTE_TEXT = 14; // subtext2 13px
const QUOTE_LINE = 17; // 16px
const QUOTE_PAD_Y = 6.5; // py-1.5
const QUOTE_PAD_X = 13; // px-3
const QUOTE_GAP = 4; // gap-1
const THUMB_SCALE = 0.25; // reply thumbnails are 25% of the media size
const THUMB_RADIUS = 8.5; // rounded-sm 8px
const CHIP_H = 21; // h-5 row
const CHIP_PAD_X = 8.5; // px-2
const CHIP_MIN_W = 43; // min-w-10
const CHIP_RING = 1; // 1px border in the page colour
const CHIP_EMOJI = 16; // 18px × 0.84
const CHIP_OVERLAP = 10.5; // -mt-2.5
const CHIP_INSET = 13; // mx-3
const CHIP_AFTER = 4; // pb-1

/* Compose typing: capsule grows with fixed 22 dp corners, send disc bottom-aligned. */
const SEND_D = 34;
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
  const e = 1 - Math.pow(1 - c, 3);
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

export const xAndroidMotion: PlatformMotion = {
  enterMs: OUT_MS,
  enterStyle: (p, mine, rtl) => {
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

/* typing shimmer: a highlight sweeping across the label, character by character */
const SHIM_PERIOD = 1800;
const SHIM_STEP = 45;
function shimAt(phase: number): number {
  const x = ((phase % 1) + 1) % 1;
  if (x < 0.15) return x / 0.15;
  if (x < 0.6) return 1;
  if (x < 0.75) return 1 - (x - 0.6) / 0.15;
  return 0;
}

const STYLE = [
  keyframes("xc-and-out", outFrame),
  keyframes("xc-and-in", inFrame),
  "@keyframes xc-and-fade{from{opacity:0}to{opacity:1}}",
  `.xc-and-anim-out{animation:xc-and-out ${OUT_MS}ms linear both}`,
  `.xc-and-anim-in{animation:xc-and-in ${IN_MS}ms linear both}`,
  `.xc-and-anim-typing{animation:xc-and-fade ${TYPING_IN_MS}ms ease-out both}`,
  ".xc-and-anim-receipt{animation:xc-and-fade 200ms ease-out both}",
  "@keyframes xc-and-caret{0%,50%{opacity:1}50.01%,100%{opacity:0}}",
  `.xc-and-caret{animation:xc-and-caret ${CARET_PERIOD}ms linear infinite}`,
  "@keyframes xc-and-send{from{opacity:0;transform:scale(.9)}to{opacity:1;transform:scale(1)}}",
  ".xc-and-send{animation:xc-and-send 80ms ease-out both}",
  "@keyframes xc-and-shim{0%{color:var(--xc-sec)}15%{color:var(--xc-pri)}60%{color:var(--xc-pri)}75%{color:var(--xc-sec)}100%{color:var(--xc-sec)}}",
].join("\n");

/* ------------------------------ X glyphs ------------------------------ */
/* X's own icon paths [C] (24×24, fill currentColor). */

function Glyph({ d, size = 24, color, className, evenOdd }: { d: string; size?: number; color: string; className?: string; evenOdd?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} className={className} style={{ display: "block", flexShrink: 0 }}>
      <path d={d} fillRule={evenOdd ? "evenodd" : undefined} clipRule={evenOdd ? "evenodd" : undefined} />
    </svg>
  );
}

const D = {
  arrowLeft: "M7.414 13l5.043 5.04-1.414 1.42L3.586 12l7.457-7.46 1.414 1.42L7.414 11H21v2H7.414z",
  phone:
    "M3 6.42383C3.00022 4.533 4.533 3.00022 6.42383 3H9.61816L12.2168 8.19727L10.6885 9.72461C11.4852 11.4181 12.5812 12.5137 14.2744 13.3105L15.8027 11.7832L21 14.3818V17.5762C20.9998 19.467 19.467 20.9998 17.5762 21C9.5262 21 3 14.4738 3 6.42383ZM5 6.42383C5 13.3692 10.6308 19 17.5762 19C18.3624 18.9998 18.9998 18.3624 19 17.5762V15.6182L16.1973 14.2168L15.207 15.207L14.7412 15.6738L14.1289 15.4287C11.3748 14.3271 9.67293 12.6252 8.57129 9.87109L8.32617 9.25879L8.79297 8.79297L9.7832 7.80273L8.38184 5H6.42383C5.63757 5.00022 5.00022 5.63757 5 6.42383Z",
  video:
    "M13.7314 4.00586C15.773 4.10929 17.4537 5.57379 17.8887 7.50977L22.5 5.46094V18.5391L17.8887 16.4893C17.4377 18.4984 15.6452 20 13.5 20H6C3.51472 20 1.5 17.9853 1.5 15.5V8.5C1.5 6.01472 3.51472 4 6 4H13.5L13.7314 4.00586ZM6 6C4.61929 6 3.5 7.11929 3.5 8.5V15.5C3.5 16.8807 4.61929 18 6 18H13.5C14.8807 18 16 16.8807 16 15.5V8.5C16 7.20566 15.0164 6.14082 13.7559 6.0127L13.5 6H6ZM18 9.64941V14.3496L20.5 15.4609V8.53906L18 9.64941Z",
  plus: "M11 11V4h2v7h7v2h-7v7h-2v-7H4v-2h7z",
  voice: "M7 21V3h2v18H7zm8-2V5h2v14h-2zm-4-2V7h2v10h-2zm-8-2V9h2v6H3zm16 0V9h2v6h-2z",
  arrowUp: "M12 3.59l7.457 7.45-1.414 1.42L13 7.41V21h-2V7.41l-5.043 5.05-1.414-1.42L12 3.59z",
  play: "M6 17.93V6.07C6 4.51 7.71 3.55 9.05 4.37L18.72 10.29C19.99 11.08 19.99 12.92 18.72 13.71L9.05 19.63C7.71 20.45 6 19.49 6 17.93Z",
  photo:
    "M3 5.5C3 4.119 4.119 3 5.5 3h13C19.881 3 21 4.119 21 5.5v13c0 1.381-1.119 2.5-2.5 2.5h-13C4.119 21 3 19.881 3 18.5v-13zM5.5 5c-.276 0-.5.224-.5.5v9.086l3-3 3 3 5-5 3 3V5.5c0-.276-.224-.5-.5-.5h-13zM19 15.414l-3-3-5 5-3-3-3 3V18.5c0 .276.224.5.5.5h13c.276 0 .5-.224.5-.5v-3.086zM9.75 7C8.784 7 8 7.784 8 8.75s.784 1.75 1.75 1.75 1.75-.784 1.75-1.75S10.716 7 9.75 7z",
};

/* ------------------------------- avatar ------------------------------- */

/** The user's photo, or X's default profile picture (grey disc + silhouette). */
function XAvatar({ person, size, p }: { person: Person; size: number; p: Pal }) {
  if (person.avatar) return <Avatar person={person} size={size} />;
  return (
    <div className="shrink-0 overflow-hidden rounded-full" style={{ width: size, height: size, background: p.avatarBg }} aria-hidden>
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
const JUMBO_SIZE = [0, 46, 40, 34];

/** Deterministic 0..1 levels for the 40-bar voice waveform [C]. */
function levelsFor(seed: string, n = 40): number[] {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    const r = ((h >>> 0) % 1000) / 1000;
    const env = 0.5 + 0.5 * Math.sin((i / (n - 1)) * Math.PI);
    out.push(Math.max(0.1, Math.min(1, r * env * 1.2)));
  }
  return out;
}

/* ------------------------------- bubbles ------------------------------- */

function TextBubble({ text, mine, p }: { text: string; mine: boolean; p: Pal }) {
  return (
    <div style={{ maxWidth: MAX_W, minWidth: 2 * RADIUS, background: mine ? BLUE : p.inBubble, color: mine ? "#ffffff" : p.fg, borderRadius: RADIUS }}>
      <p
        dir={dirOf(text)}
        className="whitespace-pre-wrap break-words"
        style={{ margin: 0, padding: `${PAD_Y}px ${PAD_X}px`, fontSize: TEXT, lineHeight: `${LINE}px`, textAlign: "start" }}
      >
        {text}
      </p>
    </div>
  );
}

/** X Chat voice note [C]: play disc, 40 × 2 px bars (2 px gaps), mono duration. */
function VoiceBubble({ m, mine, p }: { m: Message; mine: boolean; p: Pal }) {
  const ink = mine ? "#ffffff" : p.fg;
  const levels = levelsFor(m.id, 30);
  return (
    <div
      dir="ltr"
      className="inline-flex items-center"
      style={{ background: mine ? BLUE : p.inBubble, borderRadius: 24, padding: "8px 16px 8px 8px", gap: 10 }}
    >
      <span
        className="flex shrink-0 items-center justify-center rounded-full"
        style={{ width: 32, height: 32, background: mine ? "#ffffff" : p.playDisc, color: mine ? BLUE : p.playGlyph }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ display: "block", marginInlineStart: 2 }}>
          <path d={D.play} />
        </svg>
      </span>
      <span aria-hidden className="flex items-center" style={{ gap: 2, height: 28, flexShrink: 0 }}>
        {levels.map((a, i) => (
          <span key={i} className="block rounded-full" style={{ width: 2, height: Math.max(3, Math.round(a * 26)), background: ink, opacity: 0.5 }} />
        ))}
      </span>
      <span
        className="shrink-0"
        style={{
          fontFamily: "'Roboto Mono', 'Droid Sans Mono', ui-monospace, monospace",
          fontSize: 14,
          lineHeight: "20px",
          fontVariantNumeric: "tabular-nums",
          color: mine ? "rgba(255,255,255,0.8)" : p.secondary,
        }}
      >
        {(m.voiceDuration || "0:09").trim()}
      </span>
    </div>
  );
}

/** Bubble size of a photo (dp), shared by the image bubble and its reply thumbnail. */
function fitImage(src: string | null | undefined, ratio: number | null): { w: number; h: number } {
  let w = IMG_MAX_W;
  let h = 204;
  if (src) {
    const r = ratio ?? 3 / 4;
    h = w / r;
    if (h > IMG_MAX_H) {
      h = IMG_MAX_H;
      w = Math.max(150, h * r);
    }
    h = Math.max(140, h);
  }
  return { w, h };
}

function ImageBubble({ src, p }: { src?: string | null; p: Pal }) {
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
          <Glyph d={D.photo} size={40} color={p.secondary} />
        </div>
      )}
    </div>
  );
}

/** 25%-scale photo thumbnail of the reply preview (rounded-sm, gray-200 hairline) [C]. */
function ReplyThumb({ src, p }: { src?: string | null; p: Pal }) {
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
 * icon-reply-alt + the quoted sender's name, then the quoted text in a small pill
 * (two lines max) — gray-50 fill / gray-700 text when it quotes them, a 1px
 * chat-accent/50 outline + accent text when it quotes me. Voice → icon-voice +
 * "Voice message"; photo → 25% thumbnail.
 */
function ReplyPreview({ target, name, mine, p, l }: { target: Message; name: string; mine: boolean; p: Pal; l: Strings }) {
  const quotesMe = target.sender === "me";
  const pill: CSSProperties = quotesMe
    ? { border: "1px solid rgba(29,155,240,0.5)", color: BLUE, padding: `${QUOTE_PAD_Y - 1}px ${QUOTE_PAD_X - 1}px` }
    : { background: p.inBubble, color: p.secondary, padding: `${QUOTE_PAD_Y}px ${QUOTE_PAD_X}px` };
  const text = target.text.trim();
  return (
    <div className="flex flex-col" style={{ alignItems: mine ? "flex-end" : "flex-start", gap: QUOTE_GAP, marginTop: 2, marginBottom: QUOTE_GAP, maxWidth: MAX_W }}>
      <div className="flex min-w-0 items-center" style={{ gap: QUOTE_GAP, paddingInline: 8.5, color: p.secondary, maxWidth: "100%" }}>
        <svg width={QUOTE_TEXT} height={QUOTE_TEXT} viewBox="0 0 12 12" fill={p.secondary} style={{ display: "block", flexShrink: 0 }}>
          <path d="M3.393 5.565L4.826 7L3.942 7.88L1 4.94L3.942 2L4.826 2.88L3.393 4.315H6.634C8.498 4.315 10.009 5.825 10.009 7.69V9.44H8.759V7.69C8.759 6.515 7.8075 5.565 6.634 5.565H3.393Z" />
        </svg>
        <span dir={dirOf(name)} className="truncate" style={{ fontSize: QUOTE_TEXT, lineHeight: `${QUOTE_LINE}px` }}>
          {name}
        </span>
      </div>
      {target.type === "image" && <ReplyThumb src={target.imageSrc} p={p} />}
      {target.type === "voice" ? (
        <div className="flex items-center" style={{ ...pill, gap: 6.5, borderRadius: RADIUS }}>
          <Glyph d={D.voice} size={17} color="currentColor" />
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
 * X Chat reaction chip [C]: rounded-full, ringed in the page colour, tucked under the
 * bubble's bottom edge and inset from its edge on the sender's side. My own reaction
 * is the selected state (chat-accent fill); theirs uses the gray-50 fill. No count for 1.
 */
function ReactionChip({ emoji, mine, p }: { emoji: string; mine: boolean; p: Pal }) {
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

/** The text caret: a 2 dp bar in the text colour, blinking (clockMs-driven in exports). */
function Caret({ color, clockMs, height }: { color: string; clockMs?: number; height: number }) {
  const on = clockMs === undefined ? undefined : clockMs % CARET_PERIOD < CARET_PERIOD / 2;
  return (
    <span
      aria-hidden
      className={clockMs === undefined ? "xc-and-caret" : undefined}
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

/** "<name> is typing …" with the sweeping highlight. Export frames compute it from clockMs. */
function TypingRow({
  person,
  p,
  label,
  live,
  clockMs,
  boxRef,
}: {
  person: Person;
  p: Pal;
  label: string;
  live: boolean;
  clockMs?: number;
  boxRef: React.RefObject<HTMLDivElement | null>;
}) {
  const chars = Array.from(label);
  return (
    <div ref={boxRef} className={`flex items-center ${live ? "xc-and-anim-typing" : ""}`} style={{ paddingInline: SIDE, gap: 4, height: 18 }}>
      <XAvatar person={person} size={14} p={p} />
      <span dir={dirOf(label)} className="truncate" style={{ fontSize: 13, lineHeight: "18px", whiteSpace: "pre" }}>
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
                animation: `xc-and-shim ${SHIM_PERIOD}ms linear infinite`,
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

export function XChatAndroid({ scenario, playback, lang, rtl }: PlatformProps) {
  const dark = scenario.theme === "dark";
  const p = dark ? DARK : LIGHT;
  const l = STR[lang];
  const { messages, clockMs } = playback;
  const live = playback.isLive && clockMs === undefined;
  const typing = playback.typing || (!playback.isLive && scenario.presence === "typing");
  const scrollRef = useChatScroll<HTMLDivElement>(`${messages.length}-${typing}`);
  const typingRef = useRef<HTMLDivElement>(null);
  const typingSince = useRef<number | undefined>(undefined);
  const draft = playback.draft;
  const composerRef = useRef<HTMLDivElement>(null);
  const composerH = useRef<number | undefined>(undefined);

  // As the composer grows with the draft, keep the thread pinned to its bottom.
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
    const caption = m.text.trim();
    const emojis = m.type === "text" ? emojiCount(m.text) : 0;

    let content: ReactNode;
    if (m.type === "voice") {
      content = <VoiceBubble m={m} mine={mine} p={p} />;
    } else if (m.type === "image") {
      content = (
        <>
          <ImageBubble src={m.imageSrc} p={p} />
          {caption && (
            <div style={{ marginTop: GAP_GROUP }}>
              <TextBubble text={caption} mine={mine} p={p} />
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
      content = <TextBubble text={m.text} mine={mine} p={p} />;
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
        className={`flex flex-col ${live ? (mine ? "xc-and-anim-out" : "xc-and-anim-in") : ""}`}
        style={{ alignItems: mine ? "flex-end" : "flex-start", paddingInline: SIDE, marginTop, transformOrigin: originFor(mine, rtl) }}
      >
        {content}
        {status && (
          <div
            key={status}
            className={live ? "xc-and-anim-receipt" : ""}
            style={{ color: p.secondary, fontSize: 12, lineHeight: "16px", marginTop: 6, paddingInlineEnd: PAD_X, whiteSpace: "nowrap" }}
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
      style={{ background: p.bg, color: p.fg, "--xc-sec": p.secondary, "--xc-pri": p.fg } as CSSProperties}
    >
      <style>{STYLE}</style>

      <SamsungStatusBar tint={dark ? "light" : "dark"} background={p.bg} lang={lang} />

      {/* ----------------------------- toolbar (56 dp) ----------------------------- */}
      <div className="relative flex shrink-0 items-center" style={{ height: TOOLBAR_H, background: p.bg }}>
        <span className="absolute" style={{ insetInlineStart: 16, top: (TOOLBAR_H - 24) / 2 }}>
          <Glyph d={D.arrowLeft} color={p.fg} className="rtl:-scale-x-100" />
        </span>
        <span className="absolute" style={{ insetInlineStart: 56, top: (TOOLBAR_H - 32) / 2 }}>
          <XAvatar person={scenario.them} size={32} p={p} />
        </span>
        <div className="absolute flex items-center" style={{ insetInlineStart: 100, insetInlineEnd: 104, top: 0, height: TOOLBAR_H }}>
          <span dir={dirOf(scenario.them.name)} className="truncate" style={{ fontSize: 17, lineHeight: "22px", fontWeight: 700 }}>
            {scenario.them.name}
          </span>
        </div>
        <div className="absolute flex items-center" style={{ insetInlineEnd: 16, top: (TOOLBAR_H - 24) / 2, gap: 24 }}>
          <Glyph d={D.phone} color={p.fg} />
          <Glyph d={D.video} color={p.fg} />
        </div>
      </div>

      {/* ------------------------------- thread ------------------------------- */}
      <div ref={scrollRef} className="rcss-scroll min-h-0 flex-1 overflow-y-auto" style={{ background: p.bg }}>
        <div style={{ paddingTop: 6, paddingBottom: 14 }}>
          <div className="text-center" style={{ color: p.secondary, fontSize: 13, lineHeight: "16px", marginBottom: 13 }}>
            {l.today}
          </div>
          <div className="flex flex-col">
            {rows}
            {typing && (
              <div style={{ marginTop: typingGap }}>
                <TypingRow person={scenario.them} p={p} label={l.typing(scenario.them.name)} live={live} clockMs={clockMs} boxRef={typingRef} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ------------------------------ composer ------------------------------ */}
      <div
        ref={composerRef}
        className="flex shrink-0 items-end"
        style={{ minHeight: COMPOSER_H, paddingInlineStart: SIDE, paddingInlineEnd: SIDE, gap: 8, marginTop: 4, marginBottom: 10 }}
      >
        <span className="flex shrink-0 items-center justify-center rounded-full" style={{ width: COMPOSER_H, height: COMPOSER_H, background: p.plusFill }}>
          <Glyph d={D.plus} color={p.fg} />
        </span>
        {draft ? (
          <div className="relative min-w-0 flex-1" style={{ background: p.input, borderRadius: COMPOSER_H / 2, minHeight: COMPOSER_H }}>
            <div
              className="flex flex-col justify-end overflow-hidden"
              style={{
                maxHeight: DRAFT_MAX_LINES * LINE + (COMPOSER_H - LINE),
                paddingBlock: (COMPOSER_H - LINE) / 2,
                paddingInlineStart: 16,
                paddingInlineEnd: SEND_INSET + SEND_D + 8,
              }}
            >
              <p
                dir={dirOf(draft.text)}
                className="whitespace-pre-wrap"
                style={{ margin: 0, color: p.fg, fontSize: TEXT, lineHeight: `${LINE}px`, textAlign: "start", overflowWrap: "anywhere" }}
              >
                {draft.text}
                <Caret color={p.fg} clockMs={clockMs} height={19} />
              </p>
            </div>
            <span
              className={`absolute flex items-center justify-center rounded-full ${live ? "xc-and-send" : ""}`}
              style={{ insetInlineEnd: SEND_INSET, bottom: SEND_INSET, width: SEND_D, height: SEND_D, background: BLUE }}
            >
              <Glyph d={D.arrowUp} size={17} color="#ffffff" />
            </span>
          </div>
        ) : (
          <div
            className="flex min-w-0 flex-1 items-center rounded-full"
            style={{ height: COMPOSER_H, background: p.input, paddingInlineStart: 16, paddingInlineEnd: 13 }}
          >
            <span className="min-w-0 flex-1 truncate" style={{ color: p.secondary, fontSize: TEXT, lineHeight: `${LINE}px` }}>
              {l.message}
            </span>
            <Glyph d={D.voice} size={20} color={p.fg} />
          </div>
        )}
      </div>

      <SystemBottomBar device="android" bg={p.bg} fg={p.fg} />
    </div>
  );
}
