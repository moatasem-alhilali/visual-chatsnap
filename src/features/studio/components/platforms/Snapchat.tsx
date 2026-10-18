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
 * [R] Reactions: Snap newsroom "New features, May 2024" (Emoji_Reactions.mp4,
 *     https://newsroom.snap.com/new-features-may-2024): the reaction is the
 *     reactor's Bitmoji composed with the chosen emoji (emoji behind, upper
 *     start; Bitmoji in front, lower end), ~32pt tall, sitting directly UNDER
 *     the reacted chat at the bar's leading edge, outside the bar. Web bundle:
 *     the reactions <ul> follows the message (`flex-flow: row wrap`), items
 *     `aspect-ratio: 15/16`.
 * [Q] Replies: newsroom "New messaging tools" (Jan 2022, Messaging_Bundle_Assets
 *     .png) + Web bundle quote component (`.MJ6mo`): inside the replier's bar,
 *     ABOVE the reply text, a full-width card — margin 4px 0, padding 4px 8px,
 *     0.5px --sigDisabled border (#eaedef / rgba(255,255,255,.1)), radius 10,
 *     --sigSurface fill (#fff / #1e1e1e) — holding the quoted sender's label
 *     (12px uppercase, sender colour, "ME" for my own chats) and the quoted
 *     chat behind a 2px bar in that sender's colour (6px inline padding).
 * [C] Compose: Web composer (`.euyIb`): 16px/22px text, min-height 38,
 *     padding 7px 15px, max-height 100 (≈4 lines, then it scrolls), radius
 *     20; caret-color = MY chat colour (#F23C57 in 1:1); once text exists the
 *     send arrow (production path below, --sigBrandSecondary #0fadff, mirrored
 *     in RTL) slides in at the field's end and the camera button's glyph turns
 *     into the camera-with-"T" (send the text as a Snap). The mobile bar
 *     collapses the sticker / memories / ⊕ icons so the field spans the row.
 *     Placeholder casing on mobile is "Send a Chat" (May 2024 video, 2022
 *     assets); Snapchat Web lower-cases it.
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

import type { DeliveryStatus, Message, Person } from "../../types";
import { Avatar, dirOf, SystemBottomBar, useChatScroll } from "../shared";
import { StatusBar } from "../devices/StatusBar";
import type { Lang } from "./chrome";
import { groupInfo, type PlatformMotion, type PlatformProps } from "./types";

/* ======================================================================
   iOS renderer
   ====================================================================== */

/** 1:1 conversation colours, verbatim from Snapchat's own colour helper [W]. */
const IOS_ME = "#F23C57";
const IOS_THEM = "#0EADFF";
/** --sigBrandSecondary: the composer send arrow [C]. */
const SNAP_SEND_BLUE = "#0FADFF";

const IOS_STR: Record<
  Lang,
  { me: string; today: string; sendAChat: string; sending: string; delivered: string; opened: string }
> = {
  en: {
    me: "Me",
    today: "Today",
    sendAChat: "Send a Chat",
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
  /** quoted-reply card: --sigSurface fill and --sigDisabled hairline [Q] */
  quoteBg: string;
  quoteBorder: string;
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
        quoteBg: "#1e1e1e",
        quoteBorder: "rgba(255,255,255,0.1)",
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
        quoteBg: "#ffffff",
        quoteBorder: "#e3e6e9",
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

/** Text caret blink period (UIKit: ~0.5s on, ~0.5s off). */
const SNAP_CARET_MS = 1000;

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
  // Composer caret: on 500ms / off 500ms. The element is re-keyed on every typed
  // character, so it stays solid while typing and only blinks once idle (as UIKit does).
  css += `@keyframes snap-ios-caret{0%{opacity:1}50%{opacity:0}}.snap-ios-caret{animation:snap-ios-caret ${SNAP_CARET_MS}ms step-end infinite}`;
  css += `@keyframes snap-ios-send{from{opacity:0;transform:translateX(-70%)}to{opacity:1;transform:none}}.snap-ios-send{animation:snap-ios-send 180ms cubic-bezier(0.215,0.61,0.355,1) both}`;
  css += `@keyframes snap-ios-send-rtl{from{opacity:0;transform:translateX(70%)}to{opacity:1;transform:none}}.snap-ios-send-rtl{animation:snap-ios-send-rtl 180ms cubic-bezier(0.215,0.61,0.355,1) both}`;
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

/** Camera button glyph once text is typed: camera with a "T" knocked out (send the text as a Snap) [C]. */
function IosCameraText({ color }: { color: string }) {
  return (
    <svg width="23" height="23" viewBox="0 0 22 22" fill="none">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M13.803 3.894c-.316-.406-.644-.76-1.688-.764-.673-.003-1.004-.005-1.336-.005-.331 0-.663.002-1.336.005-1.043.005-1.372.358-1.687.764-.082.105-.163.214-.243.322-.18.241-.353.474-.517.64-.6.61-1.077.665-1.274.687a14.675 14.675 0 0 0-1.022.165c-1.057.214-1.554.474-1.776.697-.866.87-1.111 3.494-1.111 5.272 0 1.779.245 4.515 1.11 5.385.471.473 2.182 1.387 7.856 1.387 5.674 0 7.385-.915 7.855-1.387.866-.87 1.112-3.606 1.112-5.385 0-1.778-.246-4.402-1.112-5.272-.221-.223-.718-.483-1.776-.697a16.38 16.38 0 0 0-1.022-.165c-.196-.022-.674-.077-1.274-.686-.164-.167-.338-.4-.517-.641-.08-.108-.16-.217-.242-.322Zm.506 6.173a.3.3 0 0 0 .3-.3V7.691a.3.3 0 0 0-.3-.3H7.691a.3.3 0 0 0-.3.3v2.076a.3.3 0 0 0 .3.3h.503l.049-.183a3.02 3.02 0 0 1 .16-.431l.001-.002c.079-.18.169-.35.27-.508.101-.157.21-.295.325-.415.112-.116.19-.15.235-.155.145-.018.297-.029.457-.032h.005c.165-.008.302-.012.41-.012h.077v6.229a.458.458 0 0 1-.05.24l-.001.002c-.021.035-.062.075-.147.11l-.003.001c-.044.02-.159.045-.37.068-.207.023-.358.037-.456.045a.24.24 0 0 0-.222.239v.359a.3.3 0 0 0 .3.3h3.532a.3.3 0 0 0 .3-.3v-.36a.24.24 0 0 0-.232-.239 2.76 2.76 0 0 1-.45-.069 3.194 3.194 0 0 1-.367-.094c-.085-.039-.124-.082-.144-.12a.53.53 0 0 1-.05-.233V8.329h.077c.141 0 .296.004.464.011.165.008.299.018.402.032.05.009.129.046.235.156l.005.005c.116.114.224.25.324.408v.001c.099.155.188.322.266.5l.003.005c.083.176.135.32.163.432l.045.188h.502Z"
        fill={color}
      />
    </svg>
  );
}

/** Send arrow (production glyph [C]); points along the reading direction, so it mirrors in RTL. */
function IosSendArrow({ color }: { color: string }) {
  return (
    <svg width="21" height="21" viewBox="0 0 16 16" fill="none" className="shrink-0 rtl:-scale-x-100">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M13.536 7.248 3.218 2.09a.84.84 0 0 0-1.192.956l1.807 4.302c.174.416.174.885 0 1.302l-1.807 4.302a.84.84 0 0 0 1.192.956l10.318-5.157a.842.842 0 0 0 0-1.504Z"
        fill={color}
      />
    </svg>
  );
}

/**
 * Chat reaction [R]: the reactor's Bitmoji composed with the emoji — emoji
 * behind at the upper start, the Bitmoji (here the avatar, ringed in the
 * screen colour) in front at the lower end. 15:16 box, ~32pt tall.
 */
function SnapReaction({ emoji, person, ring }: { emoji: string; person: Person; ring: string }) {
  return (
    <div className="relative shrink-0" style={{ width: 30, height: 32 }} aria-label={emoji}>
      <span
        className="absolute select-none"
        style={{ top: 0, insetInlineStart: 0, fontSize: 20, lineHeight: "22px", fontFamily: "system-ui, 'Apple Color Emoji', 'Segoe UI Emoji', 'Noto Color Emoji', sans-serif" }}
      >
        {emoji}
      </span>
      <span className="absolute flex rounded-full" style={{ bottom: 0, insetInlineEnd: 0, padding: 1.5, background: ring }}>
        <Avatar person={person} size={19} />
      </span>
    </div>
  );
}

/** Body of a quoted chat inside the reply card (text → 2-line snippet, voice/photo → mini forms). */
function IosQuoteBody({ target, accent, pal, rtl }: { target: Message; accent: string; pal: IosPalette; rtl: boolean }) {
  const snippet: CSSProperties = {
    color: pal.text,
    fontSize: 15.5,
    lineHeight: "20px",
    fontWeight: 500,
    overflowWrap: "anywhere",
    display: "-webkit-box",
    WebkitBoxOrient: "vertical",
    WebkitLineClamp: 2,
    overflow: "hidden",
    textAlign: rtl ? "right" : "left",
  };
  if (target.type === "voice") {
    const bars = waveform(target.id, 18);
    return (
      <div className="flex items-center" style={{ height: 22, gap: 7 }}>
        <IosPlay color={accent} />
        <span className="flex items-center" style={{ gap: 2, height: 16 }} dir="ltr">
          {bars.map((b, i) => (
            <span key={i} style={{ width: 2, height: Math.max(3, b * 0.75), borderRadius: 1, background: accent, opacity: pal.wavePale }} />
          ))}
        </span>
        <span style={{ fontSize: 12, fontWeight: 500, color: pal.sub, fontVariantNumeric: "tabular-nums" }}>
          {target.voiceDuration || "0:08"}
        </span>
      </div>
    );
  }
  if (target.type === "image") {
    const cap = target.text.trim();
    return (
      <div className="flex items-center" style={{ gap: 8 }}>
        {target.imageSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={target.imageSrc} alt="" draggable={false} className="block shrink-0 object-cover" style={{ width: 36, height: 48, borderRadius: 5 }} />
        ) : (
          <span className="flex shrink-0 items-center justify-center" style={{ width: 36, height: 48, borderRadius: 5, background: pal.missing }}>
            <span style={{ display: "flex", transform: "scale(0.6)" }}>
              <IosPhotoGlyph color={pal.iconSecondary} />
            </span>
          </span>
        )}
        {cap && (
          <span className="min-w-0 flex-1" dir={dirOf(cap)} style={snippet}>
            {cap}
          </span>
        )}
      </div>
    );
  }
  return (
    <div dir={dirOf(target.text)} style={snippet}>
      {target.text}
    </div>
  );
}

/** Quoted-reply card shown inside the replier's bar, above the reply [Q]. */
function IosQuote({
  target,
  label,
  accent,
  pal,
  lang,
  rtl,
}: {
  target: Message;
  label: string;
  accent: string;
  pal: IosPalette;
  lang: Lang;
  rtl: boolean;
}) {
  return (
    <div
      style={{
        marginTop: 3,
        marginBottom: 6,
        padding: "0 8px 7px",
        border: `0.5px solid ${pal.quoteBorder}`,
        borderRadius: 10,
        background: pal.quoteBg,
      }}
    >
      <div
        className="truncate uppercase"
        dir="auto"
        style={{
          color: accent,
          fontSize: lang === "ar" ? 13 : 12,
          fontWeight: lang === "ar" ? 700 : 600,
          letterSpacing: lang === "ar" ? 0 : 0.5,
          lineHeight: "16px",
          marginTop: 6,
          marginBottom: 3,
          textAlign: "start",
        }}
      >
        {label}
      </div>
      <div className="relative" style={{ paddingInlineStart: 8, paddingBlock: 1 }}>
        <span aria-hidden className="absolute" style={{ insetInlineStart: 0, top: 0, bottom: 0, width: 2, borderRadius: 1, background: accent }} />
        <IosQuoteBody target={target} accent={accent} pal={pal} rtl={rtl} />
      </div>
    </div>
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
  const scrollRef = useChatScroll<HTMLDivElement>(`${messages.length}-${typing}-${playback.draft?.text.length ?? -1}`);

  const showTyping = typing || (!live && scenario.presence === "typing");
  const present = showTyping || scenario.presence === "online";
  const subtitle = scenario.presence === "lastseen" ? scenario.lastSeenText : "";
  const themName = scenario.them.name || "";

  const last = messages[messages.length - 1];
  const receiptId = last && last.sender === "me" ? last.id : null;
  const draft = playback.draft;
  const byId = new Map(scenario.messages.map((x) => [x.id, x] as const));

  const caretStyle: CSSProperties =
    clockMs === undefined ? {} : { opacity: clockMs % SNAP_CARET_MS < SNAP_CARET_MS / 2 ? 1 : 0 };

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
          const quoted = m.replyToId ? byId.get(m.replyToId) : undefined;
          const quotedMine = quoted?.sender === "me";
          const reaction = m.reaction?.trim();

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
                {quoted && (
                  <IosQuote
                    target={quoted}
                    label={quotedMine ? s.me : themName}
                    accent={quotedMine ? IOS_ME : IOS_THEM}
                    pal={pal}
                    lang={lang}
                    rtl={rtl}
                  />
                )}
                {body}
              </div>
              {reaction && (
                <div className="flex" style={{ marginTop: 3, marginBottom: 1 }}>
                  <SnapReaction emoji={reaction} person={mine ? scenario.them : scenario.me} ring={pal.bg} />
                </div>
              )}
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
      {/* While text is typed [C]: the camera glyph turns into camera-with-T, the mic
          gives way to the blue send arrow, the sticker/memories/⊕ icons collapse so
          the field spans the row, and the field grows to 4 lines (then scrolls). */}
      <div
        className="flex shrink-0 items-end"
        style={{
          background: pal.bg,
          borderTop: `0.5px solid ${pal.divider}`,
          paddingTop: 7,
          paddingBottom: 15,
          paddingInline: 10,
        }}
      >
        <RoundButton bg={pal.circle}>{draft ? <IosCameraText color={pal.icon} /> : <IosCamera color={pal.icon} />}</RoundButton>
        <div
          className="flex min-w-0 flex-1 items-end"
          style={{
            minHeight: 38,
            borderRadius: 19,
            background: pal.field,
            marginInlineStart: 8,
            paddingInlineStart: 14,
            paddingInlineEnd: draft ? 7 : 12,
          }}
        >
          {draft ? (
            <>
              <div
                className="flex min-w-0 flex-1 flex-col justify-end overflow-hidden"
                style={{ maxHeight: 4 * 22 + 16, paddingBlock: 8 }}
              >
                <div
                  dir={dirOf(draft.text)}
                  style={{
                    color: pal.text,
                    fontSize: 16.5,
                    fontWeight: 500,
                    lineHeight: "22px",
                    whiteSpace: "pre-wrap",
                    overflowWrap: "anywhere",
                    textAlign: "start",
                  }}
                >
                  {draft.text}
                  <span
                    key={draft.text.length}
                    aria-hidden
                    className={clockMs === undefined ? "snap-ios-caret" : ""}
                    style={{
                      display: "inline-block",
                      width: 2,
                      height: 21,
                      borderRadius: 1,
                      background: IOS_ME,
                      verticalAlign: "-5px",
                      marginInlineStart: 1,
                      marginInlineEnd: -3,
                      ...caretStyle,
                    }}
                  />
                </div>
              </div>
              <span
                className={`flex shrink-0 items-center justify-center ${clockMs === undefined ? (rtl ? "snap-ios-send-rtl" : "snap-ios-send") : ""}`}
                style={{ width: 30, height: 38, marginInlineStart: 4 }}
              >
                <IosSendArrow color={SNAP_SEND_BLUE} />
              </span>
            </>
          ) : (
            <>
              <span
                className="min-w-0 flex-1 truncate"
                style={{ color: pal.placeholder, fontSize: 16.5, fontWeight: 500, lineHeight: "38px" }}
              >
                {s.sendAChat}
              </span>
              <span className="flex shrink-0 items-center" style={{ height: 38 }}>
                <IosMic color={pal.iconSecondary} />
              </span>
            </>
          )}
        </div>
        {!draft && (
          <div className="flex shrink-0 items-center" style={{ gap: 14, marginInlineStart: 10, height: 38 }}>
            <IosSmiley color={pal.icon} />
            <IosMemories color={pal.icon} />
            <IosPlus color={pal.icon} />
          </div>
        )}
      </div>
      <SystemBottomBar device={scenario.device} bg={pal.bg} fg={dark ? "#ffffff" : "#000000"} />
    </div>
  );
}
