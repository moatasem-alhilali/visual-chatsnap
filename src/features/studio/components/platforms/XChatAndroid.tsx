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
 * Round 5 — groups, new kinds, keyboard (X Chat client, pin-page-rweb chunk; web px × 16/15):
 *  - Groups: sender display name above the first bubble of a burst (subtext3, gray-700,
 *    aligned with the bubble text), 32 dp avatar beside the LAST bubble of the burst
 *    (Shown / AsPadding), gap 8. Toolbar = group avatar or the inline facepile (two
 *    overlapping heads, the front one ringed in the page colour) + group title; X
 *    shows no member subtitle.
 *  - Calls are centred informational rows (zU/RU/LU): 20 px phone / camera glyph +
 *    "<Audio|Video|Group> call missed|ended · <time>" (subtext2 medium), red-500
 *    #F4212E when missed, gray-700 when ended, never a duration; missed incoming calls
 *    add the "Call Back" pill (h-8, px-4, fg-alpha-10).
 *  - "Edited" (V1): subtext3 secondary under the bubble, mx-1 mt-1, sender's side.
 *  - Link preview (uE/lE): its own card ABOVE the text bubble (gap-1): rounded-chat,
 *    gray-50 fill, 1 dp gray-100 border, 16:9 banner (max-h-40), p-4 title (body medium)
 *    + hostname (subtext2). URLs in text: accent on theirs, white underlined on mine.
 *  - File (RC): gray-100 card, px-6 py-3, icon-document gray-500, name (extension kept)
 *    + "Tap to download · 245 KB".
 *  - No stickers / locations / deleted tombstones exist in X Chat. Closest real
 *    behaviour: supersize emoji or a borderless image; the link card of a Google Maps
 *    link (map banner + place + host); a message deleted for everyone disappears.
 *  - Keyboard: composer rides 8 dp above the keyboard; the thread shrinks, pinned to
 *    its newest row.
 *
 * Motion: outgoing pills rise from the composer and settle on a lightly damped
 * spring while scaling 0.94 → 1; incoming pills fade up 10 dp (same functions as
 * iOS). Keyframes are generated from the same frame functions used by
 * `xAndroidMotion.enterStyle`, so live preview and export match.
 */

import type { CSSProperties, ReactNode } from "react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

import type { CallEntry, FileShare, LinkPreview, LocationShare, Message, Person } from "../../types";
import { Avatar, dirOf, SystemBottomBar, useChatScroll } from "../shared";
import { SamsungStatusBar } from "../devices/SamsungStatusBar";
import { useKeyboardInset } from "../devices/keyboard-context";
import type { Lang } from "./chrome";
import type { PlatformMotion, PlatformProps } from "./types";

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
  /** gray-200 hairline around reply thumbnails; also the gray-100 card border */
  hairline: string;
  /** gray-100: file card fill, favicon tile */
  tile: string;
  /** gray-500: document glyph */
  docIcon: string;
  /** fg-alpha-10: "Call Back" pill */
  pill: string;
}

const RED = "#f4212e"; // red-500

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
  tile: "#ebebeb",
  docIcon: "#8c8c8c",
  pill: "rgba(0,0,0,0.1)",
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
  tile: "#1f1f1f",
  docIcon: "#5e5e5e",
  pill: "rgba(255,255,255,0.1)",
};

interface Strings {
  today: string;
  message: string;
  seen: string;
  sent: string;
  typing: (n: string) => string;
  voice: string;
  photo: string;
  edited: string;
  callBack: string;
  call: (c: CallEntry, group: boolean) => string;
  download: string;
  /** "245 KB" → the localised unit ("{filesize} KB" table) */
  size: (s: string) => string;
}

/* X Chat bundle strings (en / ar tables); "Voice message" / "Photo" are the reply-preview labels. */
const STR: Record<Lang, Strings> = {
  en: {
    today: "Today",
    message: "Message",
    seen: "Seen",
    sent: "Sent",
    typing: (n) => `${n} is typing …`,
    voice: "Voice message",
    photo: "Photo",
    edited: "Edited",
    callBack: "Call Back",
    call: (c, g) =>
      g ? (c.missed ? "Group call missed" : "Group call ended") : `${c.video ? "Video" : "Audio"} call ${c.missed ? "missed" : "ended"}`,
    download: "Tap to download",
    size: (s) => s,
  },
  ar: {
    today: "اليوم",
    message: "رسالة",
    seen: "تمت المشاهدة",
    sent: "تم الإرسال",
    typing: (n) => `${n} يكتب …`,
    voice: "رسالة صوتية",
    photo: "الصورة",
    edited: "تم التحرير",
    callBack: "معاودة الاتصال",
    call: (c, g) =>
      g
        ? c.missed
          ? "مكالمة جماعية فائتة"
          : "انتهت المكالمة الجماعية"
        : c.missed
          ? c.video
            ? "مكالمة فيديو فائتة"
            : "مكالمة صوتية فائتة"
          : c.video
            ? "انتهت مكالمة الفيديو"
            : "انتهت المكالمة الصوتية",
    download: "اضغط للتنزيل",
    size: (s) =>
      s.replace(/^\s*([\d.,٠-٩]+)\s*(GB|MB|KB|B)\s*$/i, (_, n: string, u: string) => {
        const unit: Record<string, string> = { GB: "جيجابايت", MB: "ميجابايت", KB: "كيلوبايت", B: "بايت" };
        return `${n} ${unit[u.toUpperCase()]}`;
      }),
  },
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
const REPLY_TOP = 6; // mt-0.5 + the row's burst padding (4px)
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

/* Round 5: group rows, cards, calls — X Chat client metrics (web px) × 16/15. */
const GROUP_AVATAR = 32; // size-8
const GROUP_GAP = 8; // gap-x-2
const NAME_TEXT = 12; // subtext3 11px
const NAME_LINE = 14; // 12px + leading
const NAME_AFTER = 4; // burst pt-1
const CARD_RADIUS = 17; // rounded-chat 16px
const CARD_PAD = 17; // p-4
const CARD_BANNER_MAX = 170; // max-h-40
const META_TEXT = 14; // subtext2 13px
const META_LINE = 17; // 16px
const CALL_ICON = 21; // h-5 w-5
const CALL_PILL_H = 34; // h-8
const CALL_PILL_PAD = 17; // px-4
const EDITED_GAP = 4; // mt-1 / mx-1
const STICKER_EMOJI = 68; // supersize 64px
const STICKER_IMG = 150;
const KB_GAP = 8; // composer → keyboard
const NAV_BAND = 48; // SystemBottomBar's Samsung nav bar
const COMPOSER_BOTTOM = 10;

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
        {linkify(text, mine)}
      </p>
    </div>
  );
}

const URL_RE = /((?:https?:\/\/|www\.)[^\s]+[^\s!),.:;?\]}*_~])/gi;

/** URL entities [uH]: accent blue on theirs, white + underline on mine. */
function linkify(text: string, mine: boolean): ReactNode {
  if (!URL_RE.test(text)) return text;
  URL_RE.lastIndex = 0;
  return text.split(URL_RE).map((part, i) =>
    i % 2 === 1 ? (
      <span key={i} dir="ltr" style={mine ? { textDecoration: "underline", textUnderlineOffset: 2 } : { color: BLUE }}>
        {part}
      </span>
    ) : (
      part
    ),
  );
}

function hostOf(link: LinkPreview): string {
  if (link.siteName?.trim()) return link.siteName.trim();
  try {
    return new URL(/^https?:/i.test(link.url) ? link.url : `https://${link.url}`).hostname.replace(/^www\./, "");
  } catch {
    return link.url;
  }
}

/* X icon-document / icon-link (24×24) [C]. */
const DOC_D = [
  "M8 11h8v2H8zm0-4h5v2H8z",
  "M17.5 2h-11C5.12 2 4 3.12 4 4.5v15C4 20.88 5.12 22 6.5 22h6c4.14 0 7.5-3.36 7.5-7.5v-10C20 3.12 18.88 2 17.5 2zm-2.52 17.41c.01-.1.02-.21.02-.32v-1.27c0-.48.32-.82.84-.82h1.28c.09 0 .19 0 .29-.01-.53 1.04-1.39 1.89-2.43 2.42zM18 14c0 .58-.46 1-.88 1h-1.28C14.26 15 13 16.19 13 17.82v1.27c0 .46-.43.91-.97.91H6.5c-.28 0-.5-.22-.5-.5v-15c0-.28.22-.5.5-.5h11c.27 0 .5.22.5.5V14z",
];
const LINK_D =
  "M18.36 5.64c-1.95-1.96-5.11-1.96-7.07 0L9.88 7.05 8.46 5.64l1.42-1.42c2.73-2.73 7.16-2.73 9.9 0 2.73 2.74 2.73 7.17 0 9.9l-1.42 1.42-1.41-1.42 1.41-1.41c1.96-1.96 1.96-5.12 0-7.07zm-2.12 3.53l-7.07 7.07-1.41-1.41 7.07-7.07 1.41 1.41zm-12.02.71l1.42-1.42 1.41 1.42-1.41 1.41c-1.96 1.96-1.96 5.12 0 7.07 1.95 1.96 5.11 1.96 7.07 0l1.41-1.41 1.42 1.41-1.42 1.42c-2.73 2.73-7.16 2.73-9.9 0-2.73-2.74-2.73-7.17 0-9.9z";

function PathGlyph({ d, size, color }: { d: string | string[]; size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} style={{ display: "block", flexShrink: 0 }}>
      {(Array.isArray(d) ? d : [d]).map((x, i) => (
        <path key={i} d={x} />
      ))}
    </svg>
  );
}

/** Card shell shared by link / location previews: rounded-chat, gray-50, 1px gray-100 [uE]. */
function CardShell({ p, children, width }: { p: Pal; children: ReactNode; width?: number }) {
  return (
    <div
      className="flex flex-col overflow-hidden"
      style={{ width, maxWidth: MAX_W, background: p.inBubble, border: `1px solid ${p.hairline}`, borderRadius: CARD_RADIUS }}
    >
      {children}
    </div>
  );
}

function CardText({ title, host, p }: { title: string; host: string; p: Pal }) {
  return (
    <div className="flex flex-col" style={{ padding: CARD_PAD, gap: 1 }}>
      {title && (
        <span dir={dirOf(title)} className="break-words" style={{ fontSize: TEXT, lineHeight: `${LINE}px`, fontWeight: 500, color: p.fg, textAlign: "start" }}>
          {title}
        </span>
      )}
      <span dir="ltr" className="truncate" style={{ fontSize: META_TEXT, lineHeight: `${META_LINE}px`, color: p.secondary, textAlign: "start" }}>
        {host}
      </span>
    </div>
  );
}

/** Link preview [uE / lE]: banner card when the page has an image, favicon row otherwise. */
function LinkCard({ link, p }: { link: LinkPreview; p: Pal }) {
  const host = hostOf(link);
  if (link.image) {
    return (
      <CardShell p={p} width={MAX_W}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={link.image} alt="" draggable={false} className="block w-full object-cover" style={{ aspectRatio: "16 / 9", maxHeight: CARD_BANNER_MAX }} />
        <CardText title={link.title} host={host} p={p} />
      </CardShell>
    );
  }
  return (
    <div className="flex items-center" style={{ maxWidth: MAX_W, background: p.inBubble, borderRadius: CARD_RADIUS, border: `1px solid ${p.hairline}`, padding: "13px 21px 13px 13px", gap: 13 }}>
      <span className="flex shrink-0 items-center justify-center" style={{ width: 43, height: 43, borderRadius: 8.5, background: p.tile }}>
        <PathGlyph d={LINK_D} size={21} color={p.secondary} />
      </span>
      <span className="flex min-w-0 flex-col" style={{ gap: 1 }}>
        <span dir={dirOf(link.title || host)} className="truncate" style={{ fontSize: TEXT, lineHeight: `${LINE}px`, fontWeight: 500, color: p.fg }}>
          {link.title || host}
        </span>
        {link.title && (
          <span dir="ltr" className="truncate" style={{ fontSize: 15, lineHeight: "17px", color: p.secondary }}>
            {host}
          </span>
        )}
      </span>
    </div>
  );
}

/**
 * Google Maps static snapshot used as the banner of a Google Maps link card: grey land,
 * blocks, a park, water, white streets with yellow arterials and the red Maps pin.
 */
function GoogleMapArt({ dark, live }: { dark: boolean; live?: boolean }) {
  const c = dark
    ? { land: "#242f3e", block: "#2c3848", park: "#263c3f", water: "#17263c", road: "#38414e", major: "#746855" }
    : { land: "#f1f3f4", block: "#e8eaed", park: "#c8e6c9", water: "#aadaff", road: "#ffffff", major: "#fde293" };
  return (
    <svg viewBox="0 0 320 180" preserveAspectRatio="xMidYMid slice" className="block h-full w-full" aria-hidden>
      <rect width="320" height="180" fill={c.land} />
      <path d="M-10 146 C70 130 120 166 190 150 S300 124 340 138 V200 H-10Z" fill={c.water} />
      <rect x="216" y="16" width="66" height="44" rx="4" fill={c.park} />
      {[
        [12, 12, 56, 40],
        [86, 12, 54, 40],
        [154, 12, 48, 40],
        [12, 72, 56, 34],
        [86, 72, 54, 34],
        [216, 74, 66, 32],
        [292, 16, 40, 90],
      ].map(([x, y, w, h], i) => (
        <rect key={i} x={x} y={y} width={w} height={h} rx="2" fill={c.block} />
      ))}
      <g stroke={c.road} strokeLinecap="round" fill="none">
        <path d="M-10 64 H340" strokeWidth="8" />
        <path d="M77 -10 V200" strokeWidth="6" />
        <path d="M147 -10 V140" strokeWidth="5" />
        <path d="M209 -10 V140" strokeWidth="5" />
        <path d="M-10 116 C80 110 200 120 340 112" strokeWidth="6" />
        <path d="M287 -10 V120" strokeWidth="4" />
      </g>
      <path d="M-10 64 H340" stroke={c.major} strokeWidth="5" strokeLinecap="round" />
      <path d="M77 -10 V200" stroke={c.major} strokeWidth="3.5" strokeLinecap="round" />
      {live && <circle cx="160" cy="92" r="30" fill="#4285f4" opacity="0.18" />}
      <g transform="translate(160 92)">
        <ellipse cx="0" cy="1" rx="5" ry="2" fill="#000" opacity="0.2" />
        {live ? (
          <>
            <circle r="10.5" fill="#fff" />
            <circle r="7.5" fill="#4285f4" />
          </>
        ) : (
          <>
            <path d="M0 0 C-2 -8 -11 -13 -11 -22 A11 11 0 0 1 11 -22 C11 -13 2 -8 0 0Z" fill="#ea4335" stroke="#b31412" strokeWidth="1" />
            <circle cy="-22" r="4" fill="#b31412" />
          </>
        )}
      </g>
    </svg>
  );
}

/** A shared place = the link card of a Google Maps link (X Chat has no location messages). */
function LocationCard({ loc, p, dark }: { loc: LocationShare; p: Pal; dark: boolean }) {
  return (
    <CardShell p={p} width={MAX_W}>
      <div style={{ width: "100%", height: Math.min(CARD_BANNER_MAX, (MAX_W * 9) / 16) }}>
        <GoogleMapArt dark={dark} live={loc.live} />
      </div>
      <CardText title={loc.title} host="maps.google.com" p={p} />
    </CardShell>
  );
}

/** Document card [RC]: gray-100, px-6 py-3, icon-document, name (ext kept) + meta line. */
function FileCard({ file, p, l, rtl }: { file: FileShare; p: Pal; l: Strings; rtl: boolean }) {
  const dot = file.name.lastIndexOf(".");
  const base = dot > 0 ? file.name.slice(0, dot) : file.name;
  const ext = dot > 0 ? file.name.slice(dot) : "";
  const meta = [l.download, file.size?.trim() ? l.size(file.size.trim()) : ""].filter(Boolean).join(" · ");
  return (
    <div
      className="flex items-center"
      style={{ maxWidth: MAX_W, background: p.tile, border: `1px solid ${p.tile}`, borderRadius: CARD_RADIUS, padding: "13px 25.5px", gap: 13 }}
    >
      <PathGlyph d={DOC_D} size={21} color={p.docIcon} />
      <div className="flex min-w-0 flex-col">
        <div dir="ltr" className="flex min-w-0" style={{ fontSize: TEXT, lineHeight: `${LINE}px`, fontWeight: 500, color: p.fg, justifyContent: rtl ? "flex-end" : "flex-start" }}>
          <span className="truncate">{base}</span>
          <span className="shrink-0">{ext}</span>
        </div>
        <span className="truncate" style={{ fontSize: META_TEXT, lineHeight: `${META_LINE}px`, color: p.secondary, textAlign: "start" }}>
          {meta}
        </span>
      </div>
    </div>
  );
}

/** Call entry [RU/LU]: centred icon + "<kind> call missed · time", Call Back pill when missed. */
function CallRow({ call, time, incoming, group, p, l }: { call: CallEntry; time: string; incoming: boolean; group: boolean; p: Pal; l: Strings }) {
  const tint = call.missed ? RED : p.secondary;
  return (
    <div className="flex flex-col items-center" style={{ gap: 8.5, paddingBlock: 2 }}>
      <div className="flex items-center justify-center" style={{ gap: 6, color: tint }}>
        <Glyph d={call.video ? D.video : D.phone} size={CALL_ICON} color={tint} />
        <span style={{ fontSize: META_TEXT, lineHeight: `${META_LINE}px`, fontWeight: 500, whiteSpace: "nowrap" }}>
          {l.call(call, group)}
          {" · "}
          <span dir="ltr">{time}</span>
        </span>
      </div>
      {call.missed && incoming && (
        <span
          className="inline-flex items-center justify-center rounded-full"
          style={{ height: CALL_PILL_H, paddingInline: CALL_PILL_PAD, background: p.pill, color: p.fg, fontSize: META_TEXT, fontWeight: 500 }}
        >
          {l.callBack}
        </span>
      )}
    </div>
  );
}

/** Sticker: X has none — the supersize emoji (no bubble) or a borderless image. */
function Sticker({ m }: { m: Message }) {
  if (m.imageSrc) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={m.imageSrc} alt="" draggable={false} className="block object-contain" style={{ width: STICKER_IMG, height: STICKER_IMG }} />
    );
  }
  return (
    <div dir="ltr" style={{ fontSize: STICKER_EMOJI, lineHeight: `${Math.round(STICKER_EMOJI * 1.15)}px`, letterSpacing: "0.1em", paddingInline: 4 }}>
      {m.text.trim() || "🙂"}
    </div>
  );
}

/** Group facepile [St/_t]: two heads, the front one (member 0) ringed in the page colour. */
function Facepile({ members, p, size }: { members: Person[]; p: Pal; size: number }) {
  const head = Math.round(size * 0.75);
  const ring = 1;
  const a = members[0] ?? { name: "", avatar: null };
  const b = members[1] ?? a;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <div className="absolute" style={{ top: 0, insetInlineStart: 0 }}>
        <XAvatar person={b} size={head} p={p} />
      </div>
      <div className="absolute rounded-full" style={{ bottom: 0, insetInlineEnd: 0, padding: ring, background: p.bg }}>
        <XAvatar person={a} size={head} p={p} />
      </div>
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
    <div className="flex flex-col" style={{ alignItems: mine ? "flex-end" : "flex-start", gap: QUOTE_GAP, marginTop: REPLY_TOP, marginBottom: QUOTE_GAP, maxWidth: MAX_W }}>
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

/** Calls are informational rows; a message deleted for everyone is gone from the thread. */
const isInfo = (m: Message) => m.type === "call" || m.type === "deleted";

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
  const kb = useKeyboardInset();
  const kbUp = kb.inset > 0;
  const prevInset = useRef<number | undefined>(undefined);

  const group = scenario.group ?? null;
  const members = group?.members ?? [];
  const memberAt = (i: number | undefined): Person =>
    members.length ? members[Math.min(members.length - 1, Math.max(0, i ?? 0))] : scenario.them;
  const personOf = (m: Message): Person => (m.sender === "me" ? scenario.me : group ? memberAt(m.authorIndex) : scenario.them);
  const keyOf = (m: Message) => (m.sender === "me" ? "me" : group ? `t${Math.max(0, m.authorIndex ?? 0)}` : "t");

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

  // Keyboard (adjustResize): the thread shrinks above the lifted composer and stays on
  // its newest row (exact per export frame; the observer follows the live transition).
  useLayoutEffect(() => {
    const list = scrollRef.current;
    const prev = prevInset.current;
    prevInset.current = kb.inset;
    if (list && prev !== undefined && prev !== kb.inset) list.scrollTop = list.scrollHeight;
  }, [kb.inset, scrollRef]);
  useEffect(() => {
    const list = scrollRef.current;
    if (!list || typeof ResizeObserver === "undefined") return;
    let h = list.clientHeight;
    const ro = new ResizeObserver(() => {
      const nh = list.clientHeight;
      if (nh < h) list.scrollTop = list.scrollHeight;
      h = nh;
    });
    ro.observe(list);
    return () => ro.disconnect();
  }, [scrollRef]);

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
    if (messages[i].sender === "me" && !isInfo(messages[i])) {
      lastMineId = messages[i].id;
      break;
    }
  }

  const vis = messages.filter((m) => m.type !== "deleted");
  const visIndex = new Map(vis.map((m, i) => [m.id, i]));
  const byId = new Map(messages.map((m) => [m.id, m]));
  const rows: ReactNode[] = [];
  let prevHadReceipt = false;
  messages.forEach((m) => {
    const mine = m.sender === "me";
    if (m.type === "deleted") {
      rows.push(<div key={m.id} data-mid={m.id} data-sender={m.sender} aria-hidden style={{ height: 0, overflow: "hidden" }} />);
      return;
    }
    const vi = visIndex.get(m.id) ?? 0;
    const prevV = vis[vi - 1];
    const nextV = vis[vi + 1];
    const firstOfBurst = !prevV || isInfo(prevV) || keyOf(prevV) !== keyOf(m);
    const lastOfBurst = !nextV || isInfo(nextV) || keyOf(nextV) !== keyOf(m);
    const anim = live ? (mine ? "xc-and-anim-out" : "xc-and-anim-in") : "";

    let marginTop = 0;
    if (prevV) marginTop = prevHadReceipt ? GAP_AFTER_RECEIPT : m.type === "call" || firstOfBurst ? GAP_SENDER : GAP_GROUP;

    if (m.type === "call") {
      rows.push(
        <div key={m.id} data-mid={m.id} data-sender={m.sender} className={anim} style={{ marginTop, paddingInline: SIDE, transformOrigin: originFor(mine, rtl) }}>
          <CallRow call={m.call ?? { video: false, missed: true }} time={m.time} incoming={!mine} group={!!group} p={p} l={l} />
        </div>,
      );
      prevHadReceipt = false;
      return;
    }

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
    } else if (m.type === "sticker") {
      content = <Sticker m={m} />;
    } else if (m.type === "location") {
      content = <LocationCard loc={m.location ?? { title: m.text || "Location" }} p={p} dark={dark} />;
    } else if (m.type === "file") {
      content = <FileCard file={m.file ?? { name: m.text || "Document.pdf" }} p={p} l={l} rtl={rtl} />;
    } else if (emojis) {
      const fs = JUMBO_SIZE[emojis];
      content = (
        <div dir="ltr" style={{ fontSize: fs, lineHeight: `${Math.round(fs * 1.2)}px` }}>
          {m.text.trim()}
        </div>
      );
    } else if (m.link) {
      content = (
        <div className="flex max-w-full flex-col" style={{ alignItems: mine ? "flex-end" : "flex-start", gap: 4 }}>
          <LinkCard link={m.link} p={p} />
          {caption && <TextBubble text={m.text} mine={mine} p={p} />}
        </div>
      );
    } else {
      content = <TextBubble text={m.text} mine={mine} p={p} />;
    }

    const target = m.replyToId ? byId.get(m.replyToId) : undefined;
    const reaction = m.reaction?.trim();
    const align = mine ? "flex-end" : "flex-start";
    const main = (
      <div className="flex min-w-0 max-w-full flex-col" style={{ alignItems: align }}>
        {target && <ReplyPreview target={target} name={personOf(target).name} mine={mine} p={p} l={l} />}
        {content}
      </div>
    );
    const info =
      reaction || m.edited ? (
        <div className="flex max-w-full flex-col" style={{ alignItems: align }}>
          {reaction && <ReactionChip emoji={reaction} mine={mine} p={p} />}
          {m.edited && (
            <div style={{ marginTop: reaction ? 0 : EDITED_GAP, paddingInline: EDITED_GAP, color: p.secondary, fontSize: 12, lineHeight: "16px", whiteSpace: "nowrap" }}>
              {l.edited}
            </div>
          )}
        </div>
      ) : null;

    const inGroup = !!group && !mine;
    const sender = personOf(m);
    rows.push(
      <div
        key={m.id}
        data-mid={m.id}
        data-sender={m.sender}
        className={`flex flex-col ${anim}`}
        style={{ alignItems: align, paddingInline: SIDE, marginTop, transformOrigin: originFor(mine, rtl) }}
      >
        {inGroup ? (
          <>
            {firstOfBurst && (
              <div
                dir={dirOf(sender.name)}
                className="max-w-full truncate"
                style={{
                  paddingInlineStart: GROUP_AVATAR + GROUP_GAP + PAD_X,
                  marginBottom: NAME_AFTER,
                  color: p.secondary,
                  fontSize: NAME_TEXT,
                  lineHeight: `${NAME_LINE}px`,
                  alignSelf: "stretch",
                  textAlign: "start",
                }}
              >
                {sender.name}
              </div>
            )}
            <div className="flex max-w-full items-end" style={{ gap: GROUP_GAP }}>
              <div className="shrink-0" style={{ width: GROUP_AVATAR, marginBottom: 2 }}>
                {lastOfBurst && <XAvatar person={sender} size={GROUP_AVATAR} p={p} />}
              </div>
              {main}
            </div>
            {info && <div style={{ paddingInlineStart: GROUP_AVATAR + GROUP_GAP }}>{info}</div>}
          </>
        ) : (
          <>
            {main}
            {info}
          </>
        )}
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

  const last = vis[vis.length - 1];
  const shown = new Set(messages.map((m) => m.id));
  const nextThem = scenario.messages.find((m) => !shown.has(m.id) && m.sender === "them");
  const typistIndex = Math.max(0, (nextThem ?? (last?.sender === "them" ? last : undefined))?.authorIndex ?? 0);
  const typist = group ? memberAt(typistIndex) : scenario.them;
  const typingGap = !last
    ? 0
    : prevHadReceipt
      ? GAP_AFTER_RECEIPT
      : last.sender === "them" && !isInfo(last) && (!group || Math.max(0, last.authorIndex ?? 0) === typistIndex)
        ? GAP_GROUP + 4
        : GAP_SENDER;

  const title = group ? group.name : scenario.them.name;

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
          {group ? (
            group.avatar ? (
              <Avatar person={{ name: group.name, avatar: group.avatar }} size={32} />
            ) : (
              <Facepile members={members} p={p} size={32} />
            )
          ) : (
            <XAvatar person={scenario.them} size={32} p={p} />
          )}
        </span>
        <div className="absolute flex items-center" style={{ insetInlineStart: 100, insetInlineEnd: 104, top: 0, height: TOOLBAR_H }}>
          <span dir={dirOf(title)} className="truncate" style={{ fontSize: 17, lineHeight: "22px", fontWeight: 700 }}>
            {title}
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
                <TypingRow person={typist} p={p} label={l.typing(typist.name)} live={live} clockMs={clockMs} boxRef={typingRef} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ------------------------------ composer ------------------------------ */}
      <div
        ref={composerRef}
        className="flex shrink-0 items-end"
        style={{ minHeight: COMPOSER_H, paddingInlineStart: SIDE, paddingInlineEnd: SIDE, gap: 8, marginTop: 4, marginBottom: COMPOSER_BOTTOM }}
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

      {/* Nav-bar band; while the keyboard is up it grows so the composer rides KB_GAP
          above the keyboard (continuous in the inset, so export frames match). */}
      <div
        className="relative shrink-0"
        style={{
          height: kbUp ? Math.max(NAV_BAND, kb.inset + KB_GAP - COMPOSER_BOTTOM) : NAV_BAND,
          transition: kb.transition === "none" ? undefined : `height ${kb.transition}`,
        }}
      >
        <div className="absolute inset-x-0 bottom-0">
          <SystemBottomBar device="android" bg={p.bg} fg={p.fg} />
        </div>
      </div>
    </div>
  );
}
