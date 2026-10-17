"use client";

/**
 * Snapchat — Chat screen, iOS (iPhone 393pt), 2025–2026 build.
 *
 * Sources (primary first) and the key values taken from each:
 *
 * [W] Snapchat for Web production bundle (same "sig" design system as the
 *     apps): https://www.snapchat.com/web → cf-st.sc-cdn.net/dw/*.css / *.js
 *     - 1:1 sender colours, verbatim from the conversation colour helper:
 *       `ONEONONE ? (sender === me ? "#F23C57" : "#0EADFF")`.
 *     - --sigChat #0fadff, --sigSnapWithoutSound #f23c57, --sigSnapWithSound
 *       #a05dcd, --sigChatPending #767676 (unsent chat colour).
 *     - Light: --sigMain #fff, --sigButtonSecondary #eceff1 (round buttons),
 *       --sigTextField rgba(0,0,0,.05) (= #f2f2f2 field), --sigDivider #e1e1e1,
 *       --sigIconPrimary #2c3137, --sigIconSecondary #4e565f,
 *       --sigBackgroundMessageSaved #f2f2f2.
 *       Dark: --sigMain #121212, --sigButtonSecondary #2b2b2b, --sigTextField
 *       rgba(255,255,255,.1), --sigDivider rgba(255,255,255,.1),
 *       --sigIconPrimary #dedede, --sigIconSecondary #999,
 *       --sigBackgroundMessageSaved #333232.
 *     - Fonts: --sigFontFamilyPrimary "Avenir Next" (secondary Graphik).
 *     - Message group: `border-inline-start: 2px solid <sender colour>`,
 *       content `padding-inline: 6px`, 2px radius on the bar's first/last ends;
 *       sender header 12px / 600 / uppercase; day separator 9.5px / 500 /
 *       uppercase / letter-spacing 1px / --sigTextSecondary; in-chat status
 *       line 12px / 16px / -0.1px / --sigChatPending, margin-top 4px.
 *     - Strings + Arabic catalogue (translations-38bf5f901384f8c0e75c.js):
 *       "Me" → "أنا", "Sending..." → "جارٍ الإرسال...", "Delivered" → "تم
 *       التسليم", "Opened" → "تم الفتح", "Typing..." → "جارٍ الكتابة…".
 *     - Icon glyphs (camera, phone, video, mic, sticker smiley, back chevron)
 *       are the production SVG paths from the same bundle.
 * [A] Official App Store chat screenshots, measured pixel by pixel:
 *     - ar (iPhone, 375pt, 2.74px/pt): https://apps.apple.com/sa/app/snapchat/id447188370?l=ar
 *       "…Screenshot2_Chat_MENA_Apple_1284x2778_ar.jpg": placeholder
 *       "إرسال دردشة"; camera button Ø38pt, field 38pt tall, 10pt side
 *       margins, 8pt camera→field, ~9pt field→icons; mic glyph centred ~25pt
 *       from the field's end; whole layout mirrors in Arabic.
 *     - en (2024 iPad build, "J2182_iPadAppStore_Chat"): header = back chevron
 *       (#4e565f) · Bitmoji Ø32 · name (Avenir Next Bold, cap height ⇒ ~19.5pt)
 *       · two separate #ebeff2 circles Ø38 with filled phone / video glyphs;
 *       hairline under the header; "TODAY" ~9.5pt #939498; label caps ⇒ 12pt;
 *       body caps ⇒ ~16.5pt, Avenir Next Medium, near-black; 2px bar, text
 *       ~9.5pt after the bar's leading edge; single-line row 23pt; label→bar
 *       ~7.5pt; composer: camera · "Send a chat" field + mic · sticker smiley
 *       · memories · ⊕ (the old games rocket is gone); field #f2f2f2.
 * [H] Snapchat Support "What can I send in Chat": photos icon (Memories /
 *     Camera Roll), smiley face icon (stickers), "+" icon (sharing drawer);
 *     "How to Send a Voice Note": hold the microphone icon.
 *     https://help.snapchat.com/hc/en-gb/articles/7012378954388
 * [P] Presence: a friend's Bitmoji peeks from the bottom-left corner while they
 *     are viewing the chat and rises fully while they type
 *     (https://www.techlicious.com/tip/snapchat-symbol-meaning/); in the App
 *     Store shots it peeks over an outlined, coloured name pill.
 *
 * Design notes
 * - Snapchat has no bubbles, no per-message timestamps and no "last seen";
 *   only the day separator ("TODAY"). `scenario.lastSeenText` is shown as the
 *   small grey header subtitle (where Snapchat puts friend context).
 * - Receipts: the newest outgoing chat carries a 12px status line
 *   ("Sending..." → "Delivered" → "Opened"); an unsent chat's bar is the
 *   pending grey.
 * - RTL: everything mirrors (bar and labels on the right, chevron points right,
 *   composer order reversed). Glyphs that do NOT mirror: phone, video, camera,
 *   mic, smiley, memories, ⊕, and the voice-note play triangle.
 */

import type { CSSProperties, ReactNode } from "react";

import type { DeliveryStatus, Message } from "../../types";
import { Avatar, dirOf, SystemBottomBar, useChatScroll } from "../shared";
import { StatusBar } from "../devices/StatusBar";
import { SamsungStatusBar } from "../devices/SamsungStatusBar";
import { CHROME, type Lang } from "./chrome";
import { groupInfo, type PlatformMotion, type PlatformProps } from "./types";

/* ======================================================================
   iOS renderer
   ====================================================================== */

/** 1:1 conversation colours, verbatim from Snapchat's own colour helper [W]. */
const IOS_ME = "#F23C57";
const IOS_THEM = "#0EADFF";

const IOS_STR: Record<
  Lang,
  { me: string; today: string; sendAChat: string; sending: string; delivered: string; opened: string }
> = {
  en: {
    me: "Me",
    today: "Today",
    sendAChat: "Send a chat",
    sending: "Sending...",
    delivered: "Delivered",
    opened: "Opened",
  },
  ar: {
    me: "أنا",
    today: "اليوم",
    // iOS app wording (App Store screenshot [A]); Snapchat Web says "أرسل دردشة".
    sendAChat: "إرسال دردشة",
    sending: "جارٍ الإرسال...",
    delivered: "تم التسليم",
    opened: "تم الفتح",
  },
};

const SNAP_IOS_FONT =
  '"Avenir Next", "AvenirNext-Medium", -apple-system, BlinkMacSystemFont, "SF Pro Text", var(--font-inter), system-ui, var(--font-tajawal), sans-serif';

interface IosPalette {
  bg: string;
  text: string;
  title: string;
  sub: string;
  tertiary: string;
  pending: string;
  divider: string;
  circle: string;
  field: string;
  placeholder: string;
  icon: string;
  iconSecondary: string;
  wavePale: number;
  missing: string;
}

function iosPalette(dark: boolean): IosPalette {
  return dark
    ? {
        bg: "#121212",
        text: "#ffffff",
        title: "#ffffff",
        sub: "#999999",
        tertiary: "#8b8c90",
        pending: "#8f8f8f",
        divider: "rgba(255,255,255,0.1)",
        circle: "#2b2b2b",
        field: "#2a2a2a",
        placeholder: "#8b8c90",
        icon: "#dedede",
        iconSecondary: "#999999",
        wavePale: 0.4,
        missing: "#1e1e1e",
      }
    : {
        bg: "#ffffff",
        text: "#0b0c0e",
        title: "#000000",
        sub: "#656d78",
        tertiary: "#939498",
        pending: "#767676",
        divider: "#dcdde0",
        circle: "#eceff1",
        field: "#f2f2f2",
        placeholder: "#909196",
        icon: "#2c3137",
        iconSecondary: "#4e565f",
        wavePale: 0.35,
        missing: "#f2f2f2",
      };
}

/* ------------------------------ motion ------------------------------ */

/** CSS cubic-bezier(x1,y1,x2,y2) evaluated in JS (Newton + bisection fallback). */
function snapBezier(x1: number, y1: number, x2: number, y2: number) {
  const bx = (t: number) => 3 * x1 * t * (1 - t) ** 2 + 3 * x2 * t * t * (1 - t) + t ** 3;
  const by = (t: number) => 3 * y1 * t * (1 - t) ** 2 + 3 * y2 * t * t * (1 - t) + t ** 3;
  const dx = (t: number) => 3 * x1 * (1 - t) ** 2 + 6 * (x2 - x1) * t * (1 - t) + 3 * (1 - x2) * t * t;
  return (x: number) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let t = x;
    for (let i = 0; i < 6; i++) {
      const d = dx(t);
      if (Math.abs(d) < 1e-6) break;
      t -= (bx(t) - x) / d;
    }
    if (t < 0 || t > 1 || Math.abs(bx(t) - x) > 1e-4) {
      let lo = 0;
      let hi = 1;
      t = x;
      for (let i = 0; i < 30; i++) {
        if (bx(t) < x) lo = t;
        else hi = t;
        t = (lo + hi) / 2;
      }
    }
    return by(t);
  };
}

const SNAP_ENTER_MS = 300;
const SNAP_THEM_MS = 240;
const snapEaseOut = snapBezier(0.215, 0.61, 0.355, 1); // easeOutCubic

/**
 * Snapchat iOS entrance. Rows are flat (no bubble), so nothing scales: a sent
 * chat slides up out of the chat bar (~22pt) while it fades in fast; a
 * received chat fades in with a short 8pt lift as the list scrolls. Both pivot
 * on the leading edge where the coloured bar is.
 */
export const snapchatIosMotion: PlatformMotion = {
  enterMs: SNAP_ENTER_MS,
  enterStyle: (p, mine, rtl) => {
    const transformOrigin = `${rtl ? "right" : "left"} bottom`;
    if (mine) {
      const e = snapEaseOut(p);
      return {
        opacity: Math.min(1, p / 0.3),
        transform: `translateY(${((1 - e) * 22).toFixed(2)}px)`,
        transformOrigin,
      };
    }
    const q = Math.min(1, p * (SNAP_ENTER_MS / SNAP_THEM_MS));
    const e = snapEaseOut(q);
    return {
      opacity: Math.min(1, q / 0.6),
      transform: `translateY(${((1 - e) * 8).toFixed(2)}px)`,
      transformOrigin,
    };
  },
};

/** Typing dots: 1.2s loop, 0.18s stagger, opacity + small lift. */
const SNAP_DOT_MS = 1200;
function snapDotAt(phase: number): { opacity: number; y: number } {
  const t = ((phase % 1) + 1) % 1;
  const k = t < 0.5 ? Math.sin((t / 0.5) * Math.PI) : 0;
  return { opacity: 0.35 + 0.65 * k, y: -1.5 * k };
}

/** Keyframes generated from the exporter's own functions → preview == export. */
const SNAP_IOS_CSS = (() => {
  const steps = 20;
  let css = "";
  for (const mine of [true, false]) {
    for (const rtl of [false, true]) {
      const name = `snap-ios-in-${mine ? "me" : "them"}-${rtl ? "rtl" : "ltr"}`;
      let frames = "";
      for (let i = 0; i <= steps; i++) {
        const p = i / steps;
        const st = snapchatIosMotion.enterStyle(p, mine, rtl);
        frames += `${(p * 100).toFixed(2)}%{opacity:${st.opacity};transform:${st.transform}}`;
      }
      css += `@keyframes ${name}{${frames}}.${name}{animation:${name} ${SNAP_ENTER_MS}ms linear both;transform-origin:${rtl ? "right" : "left"} bottom}`;
    }
  }
  let dot = "";
  for (let i = 0; i <= 20; i++) {
    const d = snapDotAt(i / 20);
    dot += `${i * 5}%{opacity:${d.opacity.toFixed(3)};transform:translateY(${d.y.toFixed(2)}px)}`;
  }
  css += `@keyframes snap-ios-dot{${dot}}.snap-ios-dot{animation:snap-ios-dot ${SNAP_DOT_MS}ms linear infinite}`;
  css += `@keyframes snap-ios-fade{from{opacity:0}to{opacity:1}}.snap-ios-fade{animation:snap-ios-fade 200ms ease-out both}`;
  css += `.snap-ios-peek{transition:transform 260ms cubic-bezier(0.215,0.61,0.355,1)}`;
  return css;
})();

/* ------------------------------ glyphs ------------------------------ */
/* Paths are Snapchat's production glyphs from the Web bundle [W]. */

function IosChevron({ color }: { color: string }) {
  return (
    <svg width="11.5" height="16" viewBox="0 0 10 14" fill="none" className="shrink-0 rtl:-scale-x-100">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M8.686 13.31a1.5 1.5 0 0 0 0-2.12L4.496 7l4.19-4.19A1.5 1.5 0 1 0 6.564.69l-5.25 5.25a1.5 1.5 0 0 0 0 2.12l5.25 5.25a1.5 1.5 0 0 0 2.122 0Z"
        fill={color}
      />
    </svg>
  );
}

function IosPhone({ color }: { color: string }) {
  return (
    <svg width="17" height="17" viewBox="0 0 16 16" fill="none">
      <path
        d="M.166 2.238c.063-.33.36-.72.663-.868L2.174.712C2.628.49 3.28.604 3.625.976c0 0 1.827 1.807 2.088 2.99.262 1.183-1.27 1.085-1.358 2.493-.087 1.408 1.698 3.324 1.698 3.324s2.072 1.783 3.396 1.662c1.324-.122.68-.998 2.038-1.496 1.358-.499 3.449 1.987 3.449 1.987.346.371.431 1.029.189 1.474l-.63 1.156c-.16.295-.56.596-.892.653 0 0-4.723 1.377-9.758-3.442C-1.19 6.957.166 2.237.166 2.237Z"
        fill={color}
      />
    </svg>
  );
}

function IosVideo({ color }: { color: string }) {
  return (
    <svg width="25" height="21" viewBox="0 0 25 21" fill="none">
      <path
        d="M6.047 4.534a3.547 3.547 0 0 0-2.562 2.508 13.915 13.915 0 0 0 0 7.322 3.547 3.547 0 0 0 2.562 2.508l.295.074c2.54.635 5.199.635 7.74 0l.295-.074a3.547 3.547 0 0 0 2.561-2.508 13.913 13.913 0 0 0 0-7.322 3.547 3.547 0 0 0-2.561-2.508l-.296-.074a15.955 15.955 0 0 0-7.739 0l-.295.074ZM19.038 9.44a1.447 1.447 0 0 1 .722-1.313l1.413-.811 1.106-.635a.713.713 0 0 1 1.068.618v6.808a.713.713 0 0 1-1.068.618l-2.52-1.446a1.447 1.447 0 0 1-.72-1.313c.015-.407.03-.883.03-1.263 0-.38-.015-.856-.03-1.263Z"
        fill={color}
      />
    </svg>
  );
}

function IosCamera({ color }: { color: string }) {
  return (
    <svg width="21" height="18" viewBox="0 0 21 18" fill="none">
      <path
        d="M11.99.005c1.164.006 1.53.4 1.882.853.296.381.582.805.847 1.074.717.728 1.277.745 1.463.77.335.044.779.115 1.097.179 1.18.238 1.734.529 1.982.777.965.97 1.239 3.896 1.239 5.88 0 1.983-.274 5.035-1.24 6.005-.524.527-2.432 1.547-8.76 1.547-6.328 0-8.236-1.02-8.76-1.547C.773 14.573.5 11.522.5 9.538s.274-4.91 1.24-5.88c.247-.248.801-.54 1.98-.777.32-.064.683-.125 1.098-.18.186-.024.746-.041 1.463-.77.265-.268.55-.692.847-1.073C7.48.405 7.846.01 9.01.005c1.501-.007 1.479-.007 2.98 0ZM10.5 14.57a5.2 5.2 0 1 0 0-10.4 5.2 5.2 0 0 0 0 10.4Zm0-2a3.2 3.2 0 1 1 0-6.4 3.2 3.2 0 0 1 0 6.4Z"
        fill={color}
      />
    </svg>
  );
}

function IosMic({ color }: { color: string }) {
  return (
    <svg width="25" height="22" viewBox="0 0 23 20" fill="none" className="shrink-0">
      <path
        d="M7.732 4.816a3.516 3.516 0 1 1 7.03 0v4.921a3.516 3.516 0 1 1-7.03 0V4.816ZM5.62 8.946c.437 0 .791.355.791.791a4.834 4.834 0 0 0 4.824 4.834h.02a4.834 4.834 0 0 0 4.824-4.834.791.791 0 0 1 1.582 0 6.417 6.417 0 0 1-5.625 6.368v2.421a.791.791 0 0 1-1.582 0v-2.42A6.417 6.417 0 0 1 4.83 9.736c0-.436.354-.79.791-.79Z"
        fill={color}
      />
    </svg>
  );
}

/** Sticker picker: Snapchat's smiley (sleepy-arc eyes). */
function IosSmiley({ color }: { color: string }) {
  return (
    <svg width="25" height="25" viewBox="0 0 24 24" fill="none">
      <path
        d="M8.584 10.77c-.125.129-.223.23-.304.23-.22 0-.28-.26-.28-.75C8 9.17 8.5 8 9.5 8S11 9.17 11 10.25c0 .49-.06.75-.28.75-.08 0-.18-.101-.304-.23-.214-.22-.505-.52-.916-.52-.41 0-.702.3-.916.52ZM13.584 10.77c-.125.129-.223.23-.304.23-.22 0-.28-.26-.28-.75C13 9.17 13.5 8 14.5 8S16 9.17 16 10.25c0 .49-.06.75-.28.75-.08 0-.18-.101-.304-.23-.214-.22-.505-.52-.916-.52-.41 0-.702.3-.916.52ZM15.15 13.45C14.51 14.41 13.32 15 12 15c-1.32 0-2.53-.6-3.17-1.55a1.001 1.001 0 1 0-1.67 1.11c1.02 1.53 2.83 2.45 4.83 2.45s3.81-.91 4.83-2.45a1.001 1.001 0 1 0-1.67-1.11Z"
        fill={color}
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M1 12C1 5.93 5.93 1 12 1s11 4.93 11 11-4.93 11-11 11S1 18.07 1 12Zm2 0c0 4.96 4.04 9 9 9s9-4.04 9-9-4.04-9-9-9-9 4.04-9 9Z"
        fill={color}
      />
    </svg>
  );
}

/** Memories / Camera Roll: two fanned photo cards (as drawn in the chat bar). */
function IosMemories({ color }: { color: string }) {
  return (
    <svg width="25" height="25" viewBox="0 0 24 24" fill="none">
      <path
        d="M6.6 4.2 4.1 4.9a2.2 2.2 0 0 0-1.55 2.7l2.9 10.8a2.2 2.2 0 0 0 2.7 1.55l1.2-.32"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect x="9.6" y="2.4" width="11.4" height="17.2" rx="2.6" transform="rotate(8 15.3 11)" stroke={color} strokeWidth="2" />
      <path
        d="m11.4 16.4 2.5-3.1c.45-.56 1.3-.55 1.74.02l1.2 1.56 1.1-1.12c.45-.46 1.2-.4 1.57.13l.95 1.37"
        stroke={color}
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        transform="rotate(8 15.3 11)"
      />
      <circle cx="17.6" cy="7.2" r="1.25" fill={color} transform="rotate(8 15.3 11)" />
    </svg>
  );
}

/** ⊕ sharing drawer (links, stories, recent content). */
function IosPlus({ color }: { color: string }) {
  return (
    <svg width="25" height="25" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
      <path d="M12 7.6v8.8M7.6 12h8.8" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/** Voice-note play triangle (rounded). Never mirrored, even in Arabic. */
function IosPlay({ color }: { color: string }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" className="shrink-0">
      <path
        d="M5 4.99c0-.972 0-1.457.202-1.725a1 1 0 0 1 .738-.395c.335-.02.74.25 1.548.788l10.515 7.01c.668.446 1.002.668 1.118.949a1 1 0 0 1 0 .766c-.116.28-.45.503-1.118.948l-10.515 7.01c-.809.54-1.213.809-1.548.789a1 1 0 0 1-.738-.395C5 20.467 5 19.982 5 19.01V4.99Z"
        fill={color}
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IosPhotoGlyph({ color }: { color: string }) {
  return (
    <svg width="34" height="34" viewBox="0 0 24 24" fill="none">
      <path d="M10 8.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z" fill={color} />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M3 6c0-2.76 2.24-5 5-5h8c2.76 0 5 2.24 5 5v12c0 2.76-2.24 5-5 5H8c-2.76 0-5-2.24-5-5V6Zm16 0c0-1.65-1.35-3-3-3H8a3 3 0 0 0-3 2.99v6.37c.32.304.59.632.85.95C6.48 14.127 7.1 15 8.5 15c.8 0 1.41-.84 2.33-2.23l.001-.002C11.941 11.088 13.321 9 16 9c1.28 0 2.26.54 3 1.26V6ZM5 18c0 1.65 1.35 3 3 3h8c1.65 0 3-1.35 3-3v-3.86c-.16-.54-1.04-3.14-3-3.14-1.49 0-2.35 1.13-3.5 2.87-.97 1.47-2.07 3.13-4 3.13-1.7 0-2.77-.77-3.5-1.56V18Z"
        fill={color}
      />
    </svg>
  );
}

function RoundButton({ bg, children }: { bg: string; children: ReactNode }) {
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full"
      style={{ width: 38, height: 38, background: bg }}
    >
      {children}
    </span>
  );
}

/* --------------------------- message parts --------------------------- */

/** 1–3 emoji and nothing else → Snapchat renders them large. */
function isEmojiOnly(text: string): boolean {
  const t = text.trim();
  if (!t || t.length > 24) return false;
  if (!/^(?:\p{Extended_Pictographic}|\p{Emoji_Component}|‍|️|\s)+$/u.test(t)) return false;
  if (/^[\d#*\s]+$/.test(t)) return false;
  const seg = (Intl as unknown as { Segmenter?: new (l?: string, o?: { granularity: string }) => { segment: (s: string) => Iterable<unknown> } }).Segmenter;
  const count = seg ? Array.from(new seg(undefined, { granularity: "grapheme" }).segment(t.replace(/\s/g, ""))).length : 1;
  return count >= 1 && count <= 3;
}

/** Deterministic waveform from the message id (stable across renders/export). */
function waveform(id: string, n: number): number[] {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 16777619);
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    const r = ((h >>> 0) % 1000) / 1000;
    const env = 0.45 + 0.55 * Math.sin((Math.PI * (i + 0.5)) / n);
    out.push(Math.max(3, Math.round(3 + r * 15 * env)));
  }
  return out;
}

function IosVoice({ id, accent, pal, duration }: { id: string; accent: string; pal: IosPalette; duration?: string }) {
  const bars = waveform(id, 30);
  return (
    <div className="flex items-center" style={{ height: 30, gap: 9 }}>
      <IosPlay color={accent} />
      <span className="flex items-center" style={{ gap: 2, height: 20 }} dir="ltr">
        {bars.map((b, i) => (
          <span key={i} style={{ width: 2, height: b, borderRadius: 1, background: accent, opacity: pal.wavePale }} />
        ))}
      </span>
      <span style={{ fontSize: 13, fontWeight: 500, color: pal.sub, fontVariantNumeric: "tabular-nums" }}>
        {duration || "0:08"}
      </span>
    </div>
  );
}

/** Snapchat only knows Sending… → Delivered → Opened; a settled "sent" reads Delivered. */
function statusText(status: DeliveryStatus, live: boolean, lang: Lang): string {
  const s = IOS_STR[lang];
  if (status === "read") return s.opened;
  if (status === "sent" && live) return s.sending;
  return s.delivered;
}

/* ------------------------------ screen ------------------------------ */

export function Snapchat({ scenario, playback, lang, rtl }: PlatformProps) {
  const dark = scenario.theme === "dark";
  const pal = iosPalette(dark);
  const s = IOS_STR[lang];
  const { messages, typing } = playback;
  const live = playback.isLive;
  const clockMs = playback.clockMs;
  const scrollRef = useChatScroll<HTMLDivElement>(`${messages.length}-${typing}`);

  const showTyping = typing || (!live && scenario.presence === "typing");
  const present = showTyping || scenario.presence === "online";
  const subtitle = scenario.presence === "lastseen" ? scenario.lastSeenText : "";
  const themName = scenario.them.name || "";

  const last = messages[messages.length - 1];
  const receiptId = last && last.sender === "me" ? last.id : null;

  const textStyle: CSSProperties = {
    color: pal.text,
    fontSize: 16.5,
    lineHeight: "21px",
    fontWeight: 500,
    whiteSpace: "pre-wrap",
    overflowWrap: "anywhere",
  };

  const dotStyle = (d: number): CSSProperties => {
    if (clockMs === undefined) return { animationDelay: `${d * 180}ms` };
    const st = snapDotAt((clockMs - d * 180) / SNAP_DOT_MS);
    return { opacity: st.opacity, transform: `translateY(${st.y}px)` };
  };

  return (
    <div className="flex h-full w-full flex-col" style={{ background: pal.bg, fontFamily: SNAP_IOS_FONT }}>
      <style>{SNAP_IOS_CSS}</style>
      <StatusBar device={scenario.device} tint={dark ? "light" : "dark"} background={pal.bg} />

      {/* Header: chevron · Bitmoji · name · call · video, hairline below */}
      <div
        className="relative flex shrink-0 items-center"
        style={{ height: 50, background: pal.bg, borderBottom: `0.5px solid ${pal.divider}` }}
      >
        <span className="flex shrink-0 items-center" style={{ paddingInlineStart: 17 }}>
          <IosChevron color={pal.iconSecondary} />
        </span>
        <span className="shrink-0" style={{ marginInlineStart: 17 }}>
          <Avatar person={scenario.them} size={32} />
        </span>
        <div className="min-w-0 flex-1" style={{ marginInlineStart: 12, marginInlineEnd: 10 }}>
          <div
            className="truncate"
            dir="auto"
            style={{ color: pal.title, fontSize: 19.5, fontWeight: 700, lineHeight: "24px", textAlign: "start" }}
          >
            {themName}
          </div>
          {subtitle && (
            <div className="truncate" style={{ color: pal.sub, fontSize: 12, fontWeight: 500, lineHeight: "15px" }}>
              {subtitle}
            </div>
          )}
        </div>
        <div className="flex shrink-0 items-center" style={{ gap: 8, paddingInlineEnd: 10 }}>
          <RoundButton bg={pal.circle}>
            <IosPhone color={pal.title} />
          </RoundButton>
          <RoundButton bg={pal.circle}>
            <span style={{ display: "flex", transform: "translateX(1px)" }}>
              <IosVideo color={pal.title} />
            </span>
          </RoundButton>
        </div>
      </div>

      {/* Conversation */}
      <div
        ref={scrollRef}
        className="rcss-scroll min-h-0 flex-1 overflow-y-auto"
        style={{ background: pal.bg, paddingInlineStart: 12, paddingInlineEnd: 16, paddingTop: 9, paddingBottom: 10 }}
      >
        <div
          className="text-center uppercase"
          // Arabic script must never be letter-spaced (it breaks joining) and needs a larger size to stay legible.
          style={{
            color: pal.tertiary,
            fontSize: lang === "ar" ? 11 : 9.5,
            fontWeight: lang === "ar" ? 600 : 500,
            letterSpacing: lang === "ar" ? 0 : 1,
            lineHeight: "12px",
            marginBottom: 6,
          }}
        >
          {s.today}
        </div>

        {messages.map((m: Message, i) => {
          const mine = m.sender === "me";
          const status = playback.statusOf(m);
          const pending = mine && status === "sent" && live;
          const accent = mine ? IOS_ME : IOS_THEM;
          const bar = pending ? pal.pending : accent;
          const { firstOfGroup, lastOfGroup } = groupInfo(messages, i);
          const caption = m.type === "image" ? m.text.trim() : "";
          const big = m.type === "text" && isEmojiOnly(m.text);
          const label = mine ? s.me : themName;
          const anim = live ? `snap-ios-in-${mine ? "me" : "them"}-${rtl ? "rtl" : "ltr"}` : "";

          let body: ReactNode;
          if (m.type === "voice") {
            body = <IosVoice id={m.id} accent={accent} pal={pal} duration={m.voiceDuration} />;
          } else if (m.type === "image") {
            body = (
              <div className="flex flex-col" style={{ paddingBlock: 3, gap: 4 }}>
                {m.imageSrc ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={m.imageSrc}
                    alt=""
                    draggable={false}
                    className="block object-cover"
                    style={{ width: "min(64%, 228px)", aspectRatio: "3 / 4", borderRadius: 10 }}
                  />
                ) : (
                  <div
                    className="flex items-center justify-center"
                    style={{ width: "min(64%, 228px)", aspectRatio: "3 / 4", borderRadius: 10, background: pal.missing }}
                  >
                    <IosPhotoGlyph color={pal.iconSecondary} />
                  </div>
                )}
                {caption && (
                  <div dir={dirOf(caption)} style={{ ...textStyle, textAlign: rtl ? "right" : "left" }}>
                    {caption}
                  </div>
                )}
              </div>
            );
          } else {
            body = (
              <div
                dir={dirOf(m.text)}
                style={{
                  ...textStyle,
                  ...(big ? { fontSize: 34, lineHeight: "42px" } : null),
                  textAlign: rtl ? "right" : "left",
                }}
              >
                {m.text}
              </div>
            );
          }

          return (
            <div
              key={m.id}
              data-mid={m.id}
              data-sender={m.sender}
              className={anim}
              style={{ marginTop: firstOfGroup && i > 0 ? 7 : 0 }}
            >
              {firstOfGroup && (
                <div
                  className="truncate uppercase"
                  dir="auto"
                  style={{
                    color: accent,
                    fontSize: lang === "ar" ? 13.5 : 12,
                    fontWeight: lang === "ar" ? 700 : 600,
                    letterSpacing: lang === "ar" ? 0 : 0.5,
                    lineHeight: "16px",
                    marginBottom: 4,
                    textAlign: "start",
                  }}
                >
                  {label}
                </div>
              )}
              <div className="relative" style={{ paddingInlineStart: 9.5, paddingBlock: 1.5 }}>
                <span
                  aria-hidden
                  className="absolute"
                  style={{
                    insetInlineStart: 0,
                    top: 0,
                    bottom: 0,
                    width: 2,
                    background: bar,
                    borderStartStartRadius: firstOfGroup ? 1 : 0,
                    borderStartEndRadius: firstOfGroup ? 1 : 0,
                    borderEndStartRadius: lastOfGroup ? 1 : 0,
                    borderEndEndRadius: lastOfGroup ? 1 : 0,
                    transition: "background-color 200ms ease-out",
                  }}
                />
                {body}
              </div>
              {m.id === receiptId && (
                <div
                  key={status}
                  className={live ? "snap-ios-fade" : ""}
                  style={{
                    color: pal.pending,
                    fontSize: 12,
                    fontWeight: 500,
                    lineHeight: "16px",
                    letterSpacing: -0.1,
                    marginTop: 4,
                    paddingInlineStart: 9.5,
                  }}
                >
                  {statusText(status, live, lang)}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Presence: the friend's avatar peeks over their outlined name pill (in-flow, so
          the newest chat is never covered); it rises fully while they type. */}
      {present && (
        <div className="flex shrink-0 items-end" style={{ height: 56, paddingInline: 10, paddingBottom: 8, background: pal.bg }}>
          <div className="flex flex-col items-center">
            <div className="overflow-hidden" style={{ height: 30, width: 30, marginBottom: -1 }}>
              <span
                className="snap-ios-peek block"
                style={{ transform: `translateY(${showTyping ? 0 : 14}px)` }}
              >
                <Avatar person={scenario.them} size={30} />
              </span>
            </div>
            <span
              className="relative flex items-center uppercase"
              style={{
                height: 20,
                paddingInline: 9,
                borderRadius: 10,
                border: `1.5px solid ${IOS_THEM}`,
                background: pal.bg,
                color: IOS_THEM,
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: lang === "ar" ? 0 : 0.5,
                gap: 5,
                whiteSpace: "nowrap",
              }}
            >
              <span dir="auto" className="block max-w-[140px] truncate">
                {themName}
              </span>
              {showTyping && (
                <span className="flex items-center" style={{ gap: 2.5 }} dir="ltr">
                  {[0, 1, 2].map((d) => (
                    <span
                      key={d}
                      className={clockMs === undefined ? "snap-ios-dot" : ""}
                      style={{ width: 4, height: 4, borderRadius: 2, background: IOS_THEM, ...dotStyle(d) }}
                    />
                  ))}
                </span>
              )}
            </span>
          </div>
        </div>
      )}

      {/* Chat bar: camera · "Send a chat" + mic · sticker · memories · ⊕ */}
      <div
        className="flex shrink-0 items-center"
        style={{
          background: pal.bg,
          borderTop: `0.5px solid ${pal.divider}`,
          paddingTop: 7,
          paddingBottom: 15,
          paddingInline: 10,
        }}
      >
        <RoundButton bg={pal.circle}>
          <IosCamera color={pal.icon} />
        </RoundButton>
        <div
          className="flex min-w-0 flex-1 items-center"
          style={{ height: 38, borderRadius: 19, background: pal.field, marginInlineStart: 8, paddingInlineStart: 14, paddingInlineEnd: 12 }}
        >
          <span
            className="min-w-0 flex-1 truncate"
            style={{ color: pal.placeholder, fontSize: 16.5, fontWeight: 500, lineHeight: "22px" }}
          >
            {s.sendAChat}
          </span>
          <IosMic color={pal.iconSecondary} />
        </div>
        <div className="flex shrink-0 items-center" style={{ gap: 14, marginInlineStart: 10 }}>
          <IosSmiley color={pal.icon} />
          <IosMemories color={pal.icon} />
          <IosPlus color={pal.icon} />
        </div>
      </div>
      <SystemBottomBar device={scenario.device} bg={pal.bg} fg={dark ? "#ffffff" : "#000000"} />
    </div>
  );
}

/* ======================================================================
   Legacy shared renderer — kept only so existing imports keep compiling
   (SnapchatScreen / SNAP_RED / SNAP_BLUE / SnapArrow). The iOS screen above
   no longer uses it.
   ====================================================================== */

export const SNAP_RED = "#f23c57";
export const SNAP_BLUE = "#0eadff";

/** Snapchat-specific strings not present in the shared CHROME map. */
const SNAP_STR: Record<Lang, { me: string; sendAChat: string; sending: string; typing: string }> = {
  en: { me: "ME", sendAChat: "Send a chat", sending: "Sending…", typing: "Typing…" },
  ar: { me: "أنا", sendAChat: "أرسل دردشة", sending: "جارٍ الإرسال…", typing: "يكتب…" },
};

const IOS_FONT =
  '"Avenir Next", -apple-system, BlinkMacSystemFont, "SF Pro Text", var(--font-inter), system-ui, var(--font-tajawal), sans-serif';

type Os = "ios" | "android";

interface Palette {
  bg: string;
  fg: string;
  sub: string;
  field: string;
  fieldText: string;
  icon: string;
  voiceBg: string;
}

function palette(dark: boolean): Palette {
  return dark
    ? {
        bg: "#121212",
        fg: "#ffffff",
        sub: "#8a8d91",
        field: "#262626",
        fieldText: "#8a8d91",
        icon: "#ffffff",
        voiceBg: "#262626",
      }
    : {
        bg: "#ffffff",
        fg: "#000000",
        sub: "#8e9196",
        field: "#f0f0f0",
        fieldText: "#8e9196",
        icon: "#000000",
        voiceBg: "#f0f0f0",
      };
}

/* ------------------------------- glyphs ------------------------------- */

/** Snapchat chat arrow: filled = delivered, hollow = opened. Mirrors in RTL. */
export function SnapArrow({ opened, color, size = 12 }: { opened: boolean; color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className="shrink-0 rtl:-scale-x-100">
      <path
        d="M2.2 2.3 14 8 2.2 13.7 4.6 8z"
        fill={opened ? "none" : color}
        stroke={color}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BackChevron({ color, os }: { color: string; os: Os }) {
  return os === "ios" ? (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="shrink-0 rtl:-scale-x-100">
      <path d="M15 4.5 7.5 12l7.5 7.5" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ) : (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="shrink-0 rtl:-scale-x-100">
      <path d="M14.5 5 7.5 12l7 7" stroke={color} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CircleButton({ bg, size = 36, children }: { bg: string; size?: number; children: ReactNode }) {
  return (
    <span className="flex shrink-0 items-center justify-center rounded-full" style={{ width: size, height: size, background: bg }}>
      {children}
    </span>
  );
}

function PhoneIcon({ color }: { color: string }) {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
      <path
        d="M7.2 3.5h-2A1.7 1.7 0 0 0 3.5 5.3C3.8 13.5 10.5 20.2 18.7 20.5a1.7 1.7 0 0 0 1.8-1.7v-2a1.5 1.5 0 0 0-1.2-1.5l-2.8-.6a1.5 1.5 0 0 0-1.4.4l-1.2 1.2a12 12 0 0 1-5-5l1.2-1.2a1.5 1.5 0 0 0 .4-1.4l-.6-2.8A1.5 1.5 0 0 0 7.2 3.5z"
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function VideoIcon({ color }: { color: string }) {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none">
      <rect x="2.5" y="6" width="13" height="12" rx="3.2" stroke={color} strokeWidth="2" />
      <path d="m15.5 10.2 4.4-2.6c.6-.3 1.1 0 1.1.7v7.4c0 .7-.5 1-1.1.7l-4.4-2.6" stroke={color} strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

function CameraIcon({ color }: { color: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path
        d="M4.5 7.5h2.6l1.5-2.2c.3-.4.7-.6 1.2-.6h4.4c.5 0 .9.2 1.2.6l1.5 2.2h2.6A2 2 0 0 1 21.5 9.5v8.5a2 2 0 0 1-2 2h-15a2 2 0 0 1-2-2V9.5a2 2 0 0 1 2-2z"
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="13.6" r="3.4" stroke={color} strokeWidth="2" />
    </svg>
  );
}

function MicIcon({ color }: { color: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <rect x="9" y="3" width="6" height="11" rx="3" stroke={color} strokeWidth="2" />
      <path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/** Sticker: smiley on a square with a peeled corner. */
function StickerIcon({ color }: { color: string }) {
  return (
    <svg width="23" height="23" viewBox="0 0 24 24" fill="none">
      <path
        d="M14.5 21H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v7.5L14.5 21z"
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M14.5 21v-3.5a3 3 0 0 1 3-3H21" stroke={color} strokeWidth="2" strokeLinejoin="round" />
      <circle cx="9" cy="9.5" r="1.2" fill={color} />
      <circle cx="15" cy="9.5" r="1.2" fill={color} />
      <path d="M8.3 13.5c.9 1.2 2.2 1.8 3.7 1.8" stroke={color} strokeWidth="1.9" strokeLinecap="round" />
    </svg>
  );
}

/** Memories: two stacked photo cards. */
function MemoriesIcon({ color }: { color: string }) {
  return (
    <svg width="23" height="23" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="6.5" width="14" height="14" rx="3" stroke={color} strokeWidth="2" />
      <path d="M7 3.5h10a4 4 0 0 1 4 4v10" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/** Games & Minis rocket. */
function RocketIcon({ color }: { color: string }) {
  return (
    <svg width="23" height="23" viewBox="0 0 24 24" fill="none" className="rtl:-scale-x-100">
      <path
        d="M9.2 14.8 6.4 12c1.6-4.6 5.4-8.3 13.1-8.5-.2 7.7-3.9 11.5-8.5 13.1l-1.8-1.8z"
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle cx="14.6" cy="9.4" r="1.7" stroke={color} strokeWidth="1.8" />
      <path d="M6.4 12H3.6l2.6-3.2h3.4M12 17.6v2.8l3.2-2.6v-3.4M4.5 19.5c.3-1.6.9-2.5 2-3" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ----------------------------- message parts ----------------------------- */

function VoiceNote({ accent, p, duration }: { accent: string; p: Palette; duration?: string }) {
  const bars = [6, 10, 7, 14, 9, 17, 12, 7, 15, 10, 8, 13, 6, 11, 8, 14, 9, 6, 10, 7];
  return (
    <div
      className="inline-flex items-center gap-2.5 rounded-full py-1.5 pe-3.5 ps-1.5"
      style={{ background: p.voiceBg, minWidth: 200 }}
    >
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full" style={{ background: accent }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="#fff">
          <path d="M7 4.5v15c0 .8.9 1.3 1.6.8l11-7.5a1 1 0 0 0 0-1.6l-11-7.5C7.9 3.2 7 3.7 7 4.5z" />
        </svg>
      </span>
      <span className="flex h-6 flex-1 items-center gap-[2px]">
        {bars.map((b, i) => (
          <span key={i} className="shrink-0" style={{ width: 2.5, height: b, borderRadius: 2, background: accent, opacity: i < 5 ? 1 : 0.55 }} />
        ))}
      </span>
      <span className="text-[12px] font-semibold tabular-nums" style={{ color: p.sub }}>
        {duration ?? "0:08"}
      </span>
    </div>
  );
}

function receiptLabel(status: DeliveryStatus, lang: Lang): string {
  const c = CHROME[lang];
  if (status === "read") return c.snapOpened;
  if (status === "delivered") return c.snapDelivered;
  return SNAP_STR[lang].sending;
}

/* -------------------------------- screen -------------------------------- */

export function SnapchatScreen({ scenario, playback, lang, rtl, os }: PlatformProps & { os: Os }) {
  const dark = scenario.theme === "dark";
  const p = palette(dark);
  const s = SNAP_STR[lang];
  const c = CHROME[lang];
  const { messages, typing } = playback;
  const live = playback.isLive;
  const scrollRef = useChatScroll<HTMLDivElement>(`${messages.length}-${typing}`);
  const android = os === "android";

  const showTyping = typing || (!live && scenario.presence === "typing");
  const showPeek = !showTyping && scenario.presence === "online";
  const subtitle = showTyping ? s.typing : scenario.presence === "lastseen" ? scenario.lastSeenText : "";

  const meLabel = s.me;
  const themLabel = (scenario.them.name || "").toUpperCase();

  // Receipt sits under my latest message, only while it is the newest line.
  const last = messages[messages.length - 1];
  const receiptId = last && last.sender === "me" ? last.id : null;

  const textSize = android ? 15.5 : 16;
  const textLine = 21;

  return (
    <div
      className="flex h-full w-full flex-col"
      style={{ background: p.bg, ...(android ? {} : { fontFamily: IOS_FONT }) }}
    >
      {android ? (
        <SamsungStatusBar tint={dark ? "light" : "dark"} background={p.bg} lang={lang} />
      ) : (
        <StatusBar device={scenario.device} tint={dark ? "light" : "dark"} background={p.bg} />
      )}

      {/* Header */}
      <div
        className={`flex items-center ${android ? "gap-2.5 px-2.5 pb-2 pt-1.5" : "gap-2 px-2.5 pb-2 pt-0.5"}`}
        style={{ background: p.bg }}
      >
        <BackChevron color={p.icon} os={os} />
        <Avatar person={scenario.them} size={android ? 36 : 38} />
        <div className="min-w-0 flex-1 leading-tight" style={{ paddingInlineStart: 2 }}>
          <div className="truncate font-bold" style={{ color: p.fg, fontSize: android ? 17 : 17.5, letterSpacing: -0.1 }}>
            {scenario.them.name}
          </div>
          {subtitle && (
            <div className="truncate text-[12.5px] font-medium" style={{ color: p.sub, marginTop: 1 }}>
              {subtitle}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <CircleButton bg={p.field} size={android ? 36 : 38}>
            <PhoneIcon color={p.icon} />
          </CircleButton>
          <CircleButton bg={p.field} size={android ? 36 : 38}>
            <VideoIcon color={p.icon} />
          </CircleButton>
        </div>
      </div>

      {/* Body */}
      <div
        ref={scrollRef}
        className="rcss-scroll min-h-0 flex-1 overflow-y-auto pb-2 pt-3"
        style={{ background: p.bg, paddingInline: android ? 12 : 14 }}
      >
        <div className="mb-3 text-center text-[11.5px] font-bold uppercase tracking-[0.06em]" style={{ color: p.sub }}>
          {c.today}
        </div>

        <div className="flex flex-col">
          {messages.map((m: Message, i) => {
            const mine = m.sender === "me";
            const accent = mine ? SNAP_RED : SNAP_BLUE;
            const { firstOfGroup } = groupInfo(messages, i);
            const status = playback.statusOf(m);
            const caption = m.type === "image" ? m.text.trim() : "";
            return (
              <div
                key={m.id}
                data-mid={m.id}
                className={live ? "rcss-anim-rise" : ""}
                style={{ marginTop: i === 0 ? 0 : firstOfGroup ? 14 : 3 }}
              >
                {firstOfGroup && (
                  <div
                    className="mb-[3px] truncate font-bold uppercase"
                    style={{ color: accent, fontSize: android ? 11.5 : 12, letterSpacing: "0.02em", lineHeight: "15px" }}
                  >
                    {mine ? meLabel : themLabel}
                  </div>
                )}
                <div className="flex items-stretch" style={{ gap: 9 }}>
                  <span className="shrink-0 rounded-full" style={{ width: 2, background: accent }} />
                  <div className="min-w-0 flex-1 py-px">
                    {m.type === "voice" ? (
                      <VoiceNote accent={accent} p={p} duration={m.voiceDuration} />
                    ) : m.type === "image" && m.imageSrc ? (
                      <div className="flex flex-col gap-1">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={m.imageSrc}
                          alt=""
                          draggable={false}
                          className="block object-cover"
                          style={{ maxWidth: "68%", maxHeight: 280, borderRadius: 12 }}
                        />
                        {caption && (
                          <div
                            dir={dirOf(caption)}
                            className="whitespace-pre-wrap break-words"
                            style={{ color: p.fg, fontSize: textSize, lineHeight: `${textLine}px`, textAlign: rtl ? "right" : "left" }}
                          >
                            {caption}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div
                        dir={dirOf(m.text)}
                        className="whitespace-pre-wrap break-words"
                        style={{ color: p.fg, fontSize: textSize, lineHeight: `${textLine}px`, textAlign: rtl ? "right" : "left" }}
                      >
                        {m.text}
                      </div>
                    )}
                  </div>
                </div>
                {mine && m.id === receiptId && (
                  <div
                    className={`mt-1.5 flex items-center gap-1.5 font-semibold ${live ? "rcss-anim-fade" : ""}`}
                    key={status}
                    style={{ color: p.sub, fontSize: 11.5, paddingInlineStart: 11 }}
                  >
                    {status !== "sent" && <SnapArrow opened={status === "read"} color={SNAP_BLUE} size={11} />}
                    {receiptLabel(status, lang)}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Friend presence: their Bitmoji peeks in; while typing it shows a bubble. */}
        {(showTyping || showPeek) && (
          <div className={`mt-4 flex items-end gap-1.5 ${live ? "rcss-anim-rise" : ""}`}>
            <Avatar person={scenario.them} size={30} />
            {showTyping && (
              <div
                className="mb-1 flex items-center gap-[5px] rounded-full px-3 py-2"
                style={{ background: p.field }}
              >
                {[0, 1, 2].map((d) => (
                  <span
                    key={d}
                    className="rcss-typing-dot inline-block rounded-full"
                    style={{ width: 6, height: 6, background: SNAP_BLUE, animationDelay: `${d * 0.18}s` }}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Input bar */}
      <div
        className={`flex items-center ${android ? "gap-2 px-2 pb-2 pt-1.5" : "gap-2 px-2.5 pb-1.5 pt-1.5"}`}
        style={{ background: p.bg }}
      >
        <CircleButton bg={p.field} size={40}>
          <CameraIcon color={p.icon} />
        </CircleButton>
        <div
          className="flex min-w-0 flex-1 items-center rounded-full ps-3.5 pe-2.5"
          style={{ background: p.field, height: 40 }}
        >
          <span className="flex-1 truncate" style={{ color: p.fieldText, fontSize: android ? 15.5 : 16 }}>
            {s.sendAChat}
          </span>
          <MicIcon color={p.icon} />
        </div>
        <div className="flex items-center gap-2.5 px-0.5">
          <StickerIcon color={p.icon} />
          <MemoriesIcon color={p.icon} />
          <RocketIcon color={p.icon} />
        </div>
      </div>
      <SystemBottomBar device={android ? "android" : scenario.device} bg={p.bg} fg={dark ? "#ffffff" : "#000000"} />
    </div>
  );
}
