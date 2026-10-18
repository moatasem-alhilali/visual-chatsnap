"use client";

/**
 * Instagram Direct — thread screen (iPhone), self-contained renderer.
 *
 * Round 4 additions:
 *  - Reaction: the emoji (15pt) in a 26pt incoming-grey pill with a 2pt
 *    canvas-coloured ring, overlapping the bubble's bottom edge by 7pt, 10pt
 *    in from its outer (screen-edge) side; the row grows by the 19pt overhang
 *    and the avatar stays aligned to the bubble, not the pill. No count (1:1).
 *  - Reply: 12pt secondary label above ("You replied to Khalid" / "Replied to
 *    you"; ar "قمت بالرد على خالد" / "قام بالرد عليك"), then the quoted
 *    message as a muted 14/18 bubble (2 lines max; photos as a 96×128 faded
 *    thumbnail, voice as "Voice message") beside a 3pt rounded rail on the
 *    screen-edge side, then the reply bubble. A reply starts a new block
 *    (corners are not joined across it).
 *  - Compose typing: the draft replaces the placeholder in the input colour
 *    with a 2pt theme-blue caret (solid while keys land, then 1s blink); the
 *    pill grows line by line (radius stays 22pt, up to 5 lines) with the camera
 *    disc kept bottom-leading; mic / gallery / sticker / "+" are replaced by
 *    the theme-coloured "Send" text button (ar "إرسال").
 *
 * iOS renderer — key values (pt @ 393pt width):
 *  - Header 54pt under the status bar: 24pt chevron (only mirrored glyph),
 *    32pt avatar + 10pt green active dot with a 2pt canvas ring, name 16
 *    semibold, subtitle 12 regular secondary ("Active now" / lastSeenText),
 *    24pt call + 26pt video glyphs, 2pt round strokes, never mirrored.
 *  - Profile intro: 96pt avatar, name 20 semibold, "username · Instagram"
 *    14 secondary (Arabic names get a Latin username), "View profile" 32pt
 *    tall, 8pt radius, 14 semibold on #EFEFEF / #363636.
 *  - Timestamp separators: centered 12/500 secondary "Today 9:58" (time as
 *    typed), at the top and after ≥1h of silence.
 *  - Bubbles: 16/21 text, 9×13 padding, max 264pt, radius 22, joined corners
 *    4, 2pt in-group gap, 10pt between senders, 28pt avatar on the last
 *    incoming bubble only. Images: no bubble, 236pt wide, radius 18 with the
 *    same grouped corners; a caption is its own bubble under the photo.
 *    1–3 emoji alone render jumbo (48 / 40pt) with no bubble.
 *  - Outgoing fill: default theme gradient anchored to the thread VIEWPORT
 *    (#A32FF0 → #8A37F4 → #6B48F6 → #4A5DF7, top → bottom); Meta does not
 *    publish the stops, they are screenshot-sampled.
 *  - Receipt: one 12pt secondary line under your newest message — "Sent" →
 *    "Seen just now" (ar: "تم الإرسال" → "تمت المشاهدة الآن"); Instagram has
 *    no separate "Delivered" label. https://contentstudio.io/blog/what-does-seen-mean-on-instagram
 *  - Typing: their 28pt avatar + 62×39 grey pill with three 8pt dots (1.2s wave).
 *  - Composer: 44pt pill (#EFEFEF / #262626), 36pt camera circle in the theme
 *    blue, "Message..." / "مراسلة...", then mic · gallery · sticker · "+" (24pt).
 *  - Motion (instagramIosMotion, 340ms critically damped spring): outgoing
 *    rises 46pt out of the composer while growing 0.88→1 from its trailing
 *    bottom corner; incoming pops 0.9→1 from the avatar corner with a 12pt rise.
 *  - Dark: #000 canvas, #F5F5F5 text, #A8A8A8 secondary, #262626 incoming.
 *    https://instadmdarkmode.com/ (#000 canvas, #262626 received bubbles)
 *
 * Legacy shared-thread notes follow.
 *
 * Reference values (cross-checked 2025-2026 sources + app screenshots):
 *  - Canvas: light #FFFFFF / dark #000000 (true black). Secondary text light
 *    #737373, dark #A8A8A8; dark elevated surface / incoming bubble #262626;
 *    separators #363636 (dark) / #DBDBDB (light).
 *    https://themeandcolor.com/blog/instagram-dark-mode-colors
 *  - Incoming bubble: light #EFEFEF, dark #262626. Outgoing bubble (default
 *    theme): the Messenger-style purple → blue gradient that is anchored to the
 *    SCREEN, not the bubble — bubbles near the top read purple/magenta, the
 *    newest ones at the bottom read blue, and the colour shifts as you scroll.
 *    https://www.howtogeek.com/698074/how-to-change-the-theme-and-accent-color-of-instagram-dms
 *    https://www.bustle.com/life/how-to-change-chat-color-instagram-dms
 *    https://true-tech.net/exclusive-instagram-testing-messenger-like-typing-bubbles-gradient-backgrounds/
 *    https://www.wwebcustomizer.com/blog/how-to-make-whatsapp-web-look-like-instagram-dms-2026
 *    (Meta does not publish the stops; values below are sampled from screenshots.)
 *  - Typing: grey bubble with three animated dots + the sender's avatar (no
 *    "typing…" text in the header) — true-tech.net (above).
 *  - Bubbles: 16pt text, ~22pt radius (single line = pill), 4pt radius on the
 *    joined side of grouped bubbles, 2pt gap inside a group, ~10pt between
 *    groups; 28pt avatar beside the LAST incoming bubble of a group only.
 *  - "Seen" / "Sent" 12pt secondary text under your last message, only while it
 *    is the newest message in the thread.
 *  - Composer: filled pill, leading round camera button, "Message..."
 *    placeholder, mic / gallery / sticker and the 2025 "+" menu on the trailing
 *    side. https://www.socialmediatoday.com/news/instagram-adds-option-draw-on-dms-chats-stickers/803702/
 *  - Header: back chevron, avatar with green active dot (#78DE45), name +
 *    "Active now"/handle, audio-call and video-call outline icons.
 *    https://www.trymypost.com/instagram/chat
 */

import { Fragment, useCallback, useEffect, useLayoutEffect, useRef, type CSSProperties, type ReactNode } from "react";

import type { Message, Person } from "../../types";
import { Avatar, dirOf, SystemBottomBar, useChatScroll } from "../shared";
import { StatusBar } from "../devices/StatusBar";
import type { Lang } from "./chrome";
import { groupInfo, type PlatformMotion, type PlatformProps } from "./types";

/* ------------------------------ tokens ------------------------------ */

const IG_ACTIVE_GREEN = "#78de45";

/* ------------------------------- icons ------------------------------ */

function ImageGlyph({ color }: { color: string }) {
  return (
    <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round">
      <rect x="2.5" y="2.5" width="19" height="19" rx="5" />
      <circle cx="8.6" cy="8.6" r="1.6" fill={color} stroke="none" />
      <path d="M3 17 7.6 12.4a1.5 1.5 0 0 1 2.1 0l7 7" />
    </svg>
  );
}

/* ------------------------------ helpers ----------------------------- */

/** "10:42", "9:05 PM", "٩:٠٥ م" → minutes since midnight (null if unparseable). */
function minutesOf(time: string): number | null {
  const norm = time.replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
  const mt = /(\d{1,2})[:.](\d{2})\s*(am|pm|ص|م)?/i.exec(norm);
  if (!mt) return null;
  let h = Number(mt[1]);
  const min = Number(mt[2]);
  const ap = mt[3]?.toLowerCase();
  if (ap === "pm" || ap === "م") h = (h % 12) + 12;
  else if (ap === "am" || ap === "ص") h = h % 12;
  return h * 60 + min;
}

/** Instagram drops a centered timestamp at the top and after ~1h of silence. */
function needsSeparator(messages: Message[], i: number): boolean {
  if (i === 0) return true;
  const a = minutesOf(messages[i - 1].time);
  const b = minutesOf(messages[i].time);
  if (a == null || b == null) return false;
  return b - a >= 60 || b < a;
}

type Corners = Pick<CSSProperties, "borderTopLeftRadius" | "borderTopRightRadius" | "borderBottomLeftRadius" | "borderBottomRightRadius">;

/** Joined-side corners shrink inside a group (Messenger/Instagram style). */
function cornersFor(onRight: boolean, joinedAbove: boolean, joinedBelow: boolean, r: number, j: number): Corners {
  const top = joinedAbove ? j : r;
  const bottom = joinedBelow ? j : r;
  return onRight
    ? { borderTopLeftRadius: r, borderBottomLeftRadius: r, borderTopRightRadius: top, borderBottomRightRadius: bottom }
    : { borderTopRightRadius: r, borderBottomRightRadius: r, borderTopLeftRadius: top, borderBottomLeftRadius: bottom };
}


/* =====================================================================
 * Instagram for iOS — own renderer (everything below is iPhone-only).
 * The legacy `IgThread`/`IgSpec` above stay exported for the Android file
 * until it has copied them out; the iPhone template no longer uses them.
 * ===================================================================== */

/** iPhone metrics (pt at 393pt logical width). */
const IOS = {
  headerH: 54,
  headerAvatar: 32,
  activeDot: 10,
  nameSize: 16,
  subSize: 12,
  navIcon: 24,
  bodyPadX: 12,
  inAvatar: 28,
  avatarGap: 8,
  text: 16,
  lh: 21,
  padX: 13,
  padY: 9,
  maxW: 264,
  radius: 22,
  joined: 4,
  imgW: 236,
  imgRadius: 18,
  groupGap: 2,
  senderGap: 10,
  composerH: 44,
  camera: 36,
  composerIcon: 24,
} as const;

/** Instagram's default chat theme gradient, top → bottom of the THREAD viewport. */
const IGI_GRADIENT_STOPS = "#a32ff0 0%, #8a37f4 30%, #6b48f6 62%, #4a5df7 100%";
const IGI_GRADIENT = `linear-gradient(180deg, ${IGI_GRADIENT_STOPS})`;
/** Colour at the bottom of the viewport (where new messages land) — used as solid fallback + camera button. */
const IGI_BOTTOM = "#4a5df7";

interface IosPalette {
  bg: string;
  fg: string;
  sub: string;
  inBubble: string;
  field: string;
  button: string;
  dots: string;
  imgPlaceholder: string;
  /** reply rail beside a quoted message */
  rail: string;
}

/** Meta's current IG design tokens (same as InstagramAndroid; read from the
 *  CSS variables instagram.com ships): blue-black dark canvas, cool greys. */
function iosPalette(dark: boolean): IosPalette {
  return dark
    ? {
        bg: "#0c1014",
        fg: "#f8f9f9",
        sub: "#a2aab4",
        inBubble: "#25292e",
        field: "#25292e",
        button: "#25292e",
        dots: "#a2aab4",
        imgPlaceholder: "#25292e",
        rail: "#3d4249",
      }
    : {
        bg: "#ffffff",
        fg: "#0c1014",
        sub: "#6a717a",
        inBubble: "#f3f5f7",
        field: "#f3f5f7",
        button: "#efefef",
        dots: "#8e959e",
        imgPlaceholder: "#e9ecef",
        rail: "#dbdfe4",
      };
}

/** Exact Instagram iOS strings (English and Arabic builds). */
const IGI_STR: Record<Lang, {
  activeNow: string;
  message: string;
  seen: string;
  sent: string;
  today: string;
  viewProfile: string;
  instagram: string;
  send: string;
  youRepliedTo: (name: string) => string;
  youRepliedSelf: string;
  repliedToYou: string;
  repliedSelf: string;
  voiceMessage: string;
}> = {
  en: {
    activeNow: "Active now",
    message: "Message...",
    seen: "Seen just now",
    sent: "Sent",
    today: "Today",
    viewProfile: "View profile",
    instagram: "Instagram",
    send: "Send",
    youRepliedTo: (name) => `You replied to ${name}`,
    youRepliedSelf: "You replied to yourself",
    repliedToYou: "Replied to you",
    repliedSelf: "Replied to themselves",
    voiceMessage: "Voice message",
  },
  ar: {
    activeNow: "نشط الآن",
    message: "مراسلة...",
    seen: "تمت المشاهدة الآن",
    sent: "تم الإرسال",
    today: "اليوم",
    viewProfile: "عرض الملف الشخصي",
    instagram: "Instagram",
    send: "إرسال",
    youRepliedTo: (name) => `قمت بالرد على ${name}`,
    youRepliedSelf: "قمت بالرد على نفسك",
    repliedToYou: "قام بالرد عليك",
    repliedSelf: "قام بالرد على نفسه",
    voiceMessage: "رسالة صوتية",
  },
};

/* ---------------------------- iOS icons ----------------------------- */
/* Instagram's own glyph family: 24pt grid, 2pt round-capped outline strokes. */

function IgiChevron({ color }: { color: string }) {
  // the only header glyph that mirrors in the Arabic build
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="shrink-0 rtl:-scale-x-100">
      <path d="M16.2 3.6 7.8 12l8.4 8.4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IgiPhone({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M18.2 21.5c-3.6-.1-8.3-2.7-11.2-5.6C4.1 13 1.5 8.5 1.5 4.9c0-.6.2-1.1.6-1.5l1.4-1.2c.6-.5 1.5-.5 2.1.1l2.6 3c.5.6.5 1.5 0 2.1L7 8.9c.9 2.5 2.7 4.6 5.4 6.4.4.3.9.5 1.3.7l1.4-1.2c.6-.5 1.5-.5 2.1 0l2.9 2.6c.6.6.6 1.5.1 2.1l-1.2 1.4c-.3.5-.8.7-1.4.7l.6-.1Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IgiVideo({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
      <rect x="1.5" y="5" width="15" height="14" rx="4" />
      <path d="M16.5 10.2 21.2 7.4c.6-.4 1.3.1 1.3.8v7.6c0 .7-.7 1.2-1.3.8l-4.7-2.8" />
    </svg>
  );
}

function IgiCamera() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden>
      <path
        fillRule="evenodd"
        fill="#ffffff"
        d="M9.2 3.5h5.6c.7 0 1.3.4 1.6 1l.9 1.7H19a3 3 0 0 1 3 3v8.3a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3V9.2a3 3 0 0 1 3-3h1.7l.9-1.7c.3-.6.9-1 1.6-1ZM12 8.9a4.3 4.3 0 1 0 0 8.6 4.3 4.3 0 0 0 0-8.6Zm0 2.1a2.2 2.2 0 1 1 0 4.4 2.2 2.2 0 0 1 0-4.4Z"
      />
    </svg>
  );
}

function IgiMic({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="8.5" y="1.8" width="7" height="12.4" rx="3.5" />
      <path d="M4.8 10.8a7.2 7.2 0 0 0 14.4 0M12 18v4.2" />
    </svg>
  );
}

function IgiGallery({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="8.3" cy="8.3" r="1.6" fill="currentColor" stroke="none" />
      <path d="M2.4 17.4 7.3 12.5a1.6 1.6 0 0 1 2.2 0l7.4 7.4M14.3 15.8l1.7-1.7a1.6 1.6 0 0 1 2.2 0l3.4 3.4" />
    </svg>
  );
}

function IgiSticker({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15.6 22H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5h10a5 5 0 0 1 5 5v8.6L15.6 22Z" />
      <path d="M15.6 22v-2.6a3.8 3.8 0 0 1 3.8-3.8H22" />
      <circle cx="8.6" cy="9.3" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="15.4" cy="9.3" r="1.2" fill="currentColor" stroke="none" />
      <path d="M8.1 13.7c1 1.2 2.3 1.8 3.9 1.8" />
    </svg>
  );
}

function IgiPlus({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 7.3v9.4M7.3 12h9.4" />
    </svg>
  );
}

/* ------------------------------ motion ------------------------------ */

const IGI_ENTER_MS = 340;

/** Critically damped spring (UIKit-like, no overshoot), normalised so x(1) = 1. */
function igiSpring(p: number): number {
  const w = 9;
  const raw = (t: number) => 1 - (1 + w * t) * Math.exp(-w * t);
  return Math.min(1, raw(Math.max(0, p)) / raw(1));
}

/**
 * Instagram iOS DM entrance: your message rises out of the composer (the
 * bubble is born at the input field and springs up into place, growing from
 * its trailing-bottom corner); an incoming message pops in from the avatar
 * corner with a short rise + fade.
 */
export const instagramIosMotion: PlatformMotion = {
  enterMs: IGI_ENTER_MS,
  enterStyle: (p, mine, rtl) => {
    const e = igiSpring(p);
    const onRight = mine ? !rtl : rtl;
    const origin = `${onRight ? "right" : "left"} bottom`;
    if (mine) {
      return {
        opacity: Math.min(1, p / 0.18),
        transform: `translateY(${((1 - e) * 46).toFixed(2)}px) scale(${(0.88 + 0.12 * e).toFixed(4)})`,
        transformOrigin: origin,
      };
    }
    return {
      opacity: Math.min(1, p / 0.35),
      transform: `translateY(${((1 - e) * 12).toFixed(2)}px) scale(${(0.9 + 0.1 * e).toFixed(4)})`,
      transformOrigin: origin,
    };
  },
};

/** The composer grows up to this many lines, then scrolls inside. */
const IGI_DRAFT_LINES = 5;

/** iOS text caret blink period (on half / off half). */
const IGI_CARET_MS = 1000;

/** Typing dots: a 1.2s wave, each dot 0.15s behind the previous one. */
const IGI_DOT_MS = 1200;
function igiDot(phase: number): { opacity: number; y: number } {
  // rises + brightens during the first 40% of the cycle, rests the remainder
  const t = ((phase % 1) + 1) % 1;
  const k = t < 0.4 ? Math.sin((t / 0.4) * Math.PI) : 0;
  return { opacity: 0.4 + 0.6 * k, y: -2.5 * k };
}

/** Keyframes generated from the very functions the exporter calls → preview == export. */
function buildKeyframes(): string {
  const steps = 14;
  let css = "";
  for (const mine of [true, false]) {
    for (const rtl of [false, true]) {
      let frames = "";
      for (let i = 0; i <= steps; i++) {
        const p = i / steps;
        const st = instagramIosMotion.enterStyle(p, mine, rtl);
        frames += `${((p * 100).toFixed(2))}%{opacity:${st.opacity};transform:${st.transform};transform-origin:${st.transformOrigin}}`;
      }
      css += `@keyframes ig-ios-in-${mine ? "me" : "them"}-${rtl ? "rtl" : "ltr"}{${frames}}`;
      css += `.ig-ios-in-${mine ? "me" : "them"}-${rtl ? "rtl" : "ltr"}{animation:ig-ios-in-${mine ? "me" : "them"}-${rtl ? "rtl" : "ltr"} ${IGI_ENTER_MS}ms linear both}`;
    }
  }
  let dot = "";
  for (let i = 0; i <= 20; i++) {
    const d = igiDot(i / 20);
    dot += `${i * 5}%{opacity:${d.opacity.toFixed(3)};transform:translateY(${d.y.toFixed(2)}px)}`;
  }
  css += `@keyframes ig-ios-dot{${dot}}.ig-ios-dot{animation:ig-ios-dot ${IGI_DOT_MS}ms linear infinite}`;
  css += `@keyframes ig-ios-fade{from{opacity:0}to{opacity:1}}.ig-ios-fade{animation:ig-ios-fade 220ms ease-out both}`;
  css += `@keyframes ig-ios-typing-in{from{opacity:0;transform:scale(.6)}to{opacity:1;transform:scale(1)}}.ig-ios-typing-in{animation:ig-ios-typing-in 260ms cubic-bezier(.2,.9,.3,1) both}`;
  // UIKit caret: solid while keys land (the element is re-keyed per keystroke), then ~1s blink
  css += `@keyframes ig-ios-caret{0%,50%{opacity:1}50.01%,100%{opacity:0}}.ig-ios-caret{animation:ig-ios-caret ${IGI_CARET_MS}ms step-end infinite;animation-delay:${IGI_CARET_MS / 2}ms}`;
  return css;
}
const IGI_CSS = buildKeyframes();

/* ------------------------------ helpers ----------------------------- */

const EMOJI_ONLY = /^(?:\p{Extended_Pictographic}|\p{Emoji_Modifier}|\p{Regional_Indicator}|‍|️|⃣|[#*0-9](?=️?⃣)|\s)+$/u;

/** 1–3 emoji with no other text → Instagram renders them large with no bubble. */
function jumboEmojiCount(text: string): number {
  const t = text.trim();
  if (!t || !EMOJI_ONLY.test(t) || !/\p{Extended_Pictographic}|\p{Regional_Indicator}/u.test(t)) return 0;
  const compact = t.replace(/\s+/g, "");
  let n: number;
  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    n = [...new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(compact)].length;
  } else {
    n = Array.from(compact.replace(/[‍️]|\p{Emoji_Modifier}/gu, "")).length;
  }
  return n >= 1 && n <= 3 ? n : 0;
}

const AR_LATIN: Record<string, string> = {
  ا: "a", أ: "a", إ: "e", آ: "a", ب: "b", ت: "t", ث: "th", ج: "j", ح: "h", خ: "kh", د: "d", ذ: "th", ر: "r", ز: "z",
  س: "s", ش: "sh", ص: "s", ض: "d", ط: "t", ظ: "z", ع: "a", غ: "gh", ف: "f", ق: "q", ك: "k", ل: "l", م: "m", ن: "n",
  ه: "h", ة: "a", و: "w", ي: "y", ى: "a", ئ: "e", ؤ: "o", ء: "",
};

/** Instagram usernames are always Latin: derive a plausible one from the display name. */
function igiHandle(p: Person): string {
  const latin = p.name
    .trim()
    .toLowerCase()
    .replace(/[ء-ي]/g, (c) => AR_LATIN[c] ?? "")
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9._]/g, "");
  return latin || "instagram_user";
}

/** Offset of `el` from the top of the scroll content of `root` (ignores CSS transforms + device scaling). */
function offsetIn(el: HTMLElement, root: HTMLElement): number | null {
  let y = 0;
  let n: HTMLElement | null = el;
  while (n && n !== root) {
    y += n.offsetTop;
    n = n.offsetParent as HTMLElement | null;
  }
  return n === root ? y : null;
}

/* ---------------------------- sub-views ----------------------------- */

const IGI_WAVE = [4, 7, 12, 9, 16, 11, 6, 13, 19, 14, 8, 5, 10, 15, 18, 12, 7, 4, 9, 14, 11, 6, 8, 12, 7, 5, 4];

function IgiVoice({ mine, fg, duration }: { mine: boolean; fg: string; duration?: string }) {
  const ink = mine ? "#ffffff" : fg;
  return (
    <div dir="ltr" className="flex items-center" style={{ width: 188, height: IOS.lh, gap: 10 }}>
      <svg width="16" height="18" viewBox="0 0 16 18" className="shrink-0">
        <path d="M1.5 2.2v13.6c0 1 1.1 1.6 1.9 1.1l11.1-6.8c.8-.5.8-1.7 0-2.2L3.4 1.1c-.8-.5-1.9.1-1.9 1.1Z" fill={ink} />
      </svg>
      <div className="flex min-w-0 flex-1 items-center justify-between" style={{ height: 20 }}>
        {IGI_WAVE.map((b, i) => (
          <span key={i} style={{ width: 2.5, height: b, borderRadius: 2, background: ink }} />
        ))}
      </div>
      <span className="shrink-0 tabular-nums" style={{ fontSize: 14, color: ink }}>
        {duration ?? "0:08"}
      </span>
    </div>
  );
}

function IgiTyping({ person, pal, clockMs, rtl }: { person: Person; pal: IosPalette; clockMs?: number; rtl: boolean }) {
  const exporting = clockMs !== undefined;
  return (
    <div className={`flex items-end ${exporting ? "" : "ig-ios-fade"}`} style={{ marginTop: IOS.senderGap, gap: IOS.avatarGap }}>
      <Avatar person={person} size={IOS.inAvatar} />
      <div
        className={`flex items-center justify-center ${exporting ? "" : "ig-ios-typing-in"}`}
        style={{
          background: pal.inBubble,
          borderRadius: IOS.radius,
          height: IOS.lh + IOS.padY * 2,
          width: 62,
          gap: 4,
          transformOrigin: rtl ? "right bottom" : "left bottom",
        }}
      >
        {[0, 1, 2].map((i) => {
          const d = exporting ? igiDot(clockMs / IGI_DOT_MS - i * 0.15) : null;
          return (
            <span
              key={i}
              className={`block rounded-full ${exporting ? "" : "ig-ios-dot"}`}
              style={{
                width: 8,
                height: 8,
                background: pal.dots,
                ...(d
                  ? { opacity: d.opacity, transform: `translateY(${d.y}px)` }
                  : { animationDelay: `${i * 0.15 * IGI_DOT_MS}ms` }),
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

/* ----------------------- reactions + replies ------------------------ */

/** Reaction pill: hangs 18pt below the bubble, overlapping its bottom edge by 6pt. */
const IGI_REACT = { h: 26, overlap: 7, inset: 10, border: 2 } as const;

/**
 * Instagram reaction: the emoji in a small incoming-grey pill with a 2pt
 * canvas-coloured ring, tucked under the bubble's outer (screen-edge) bottom
 * corner. One reactor in a 1:1 thread → no count.
 */
function IgiReaction({ emoji, pal, mine }: { emoji: string; pal: IosPalette; mine: boolean }) {
  return (
    <div
      className="relative z-[1] flex"
      style={{
        marginTop: -(IGI_REACT.overlap + IOS.groupGap),
        [mine ? "marginInlineEnd" : "marginInlineStart"]: IGI_REACT.inset,
      }}
    >
      <span
        dir="ltr"
        className="flex items-center justify-center"
        style={{
          height: IGI_REACT.h,
          minWidth: IGI_REACT.h,
          padding: "0 4px",
          boxSizing: "border-box",
          borderRadius: IGI_REACT.h / 2,
          border: `${IGI_REACT.border}px solid ${pal.bg}`,
          background: pal.inBubble,
          fontSize: 15,
          lineHeight: "18px",
        }}
      >
        {emoji}
      </span>
    </div>
  );
}

function IgiMicSmall() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" className="shrink-0">
      <rect x="8.5" y="2" width="7" height="12" rx="3.5" />
      <path d="M5 10.8a7 7 0 0 0 14 0M12 18v3.6" />
    </svg>
  );
}

/**
 * Quoted reply, Instagram style: a 12pt secondary label ("You replied to
 * Khalid" / "Replied to you"), then the original as a smaller, muted bubble
 * (14/18, two lines max) next to a 3pt rounded rail on the screen-edge side,
 * then the reply bubble itself 4pt below.
 */
function IgiReplyQuote({
  target,
  mine,
  pal,
  s,
  themName,
}: {
  target: Message;
  mine: boolean;
  pal: IosPalette;
  s: (typeof IGI_STR)[Lang];
  themName: string;
}) {
  const label = mine
    ? target.sender === "me"
      ? s.youRepliedSelf
      : s.youRepliedTo(themName)
    : target.sender === "me"
      ? s.repliedToYou
      : s.repliedSelf;
  const targetMine = target.sender === "me";
  const radius = 18;

  let quote: ReactNode;
  if (target.type === "image") {
    quote = (
      <div className="shrink-0 overflow-hidden" style={{ width: 96, height: 128, borderRadius: 14, background: pal.imgPlaceholder, opacity: 0.7 }}>
        {target.imageSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={target.imageSrc} alt="" draggable={false} className="block h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center">
            <ImageGlyph color={pal.sub} />
          </div>
        )}
      </div>
    );
  } else {
    const isVoice = target.type === "voice";
    const text = isVoice ? s.voiceMessage : target.text;
    quote = (
      <div
        className="min-w-0"
        style={{
          borderRadius: radius,
          padding: "7px 12px",
          background: targetMine ? IGI_BOTTOM : pal.inBubble,
          opacity: targetMine ? 0.5 : 1,
          color: targetMine ? "#ffffff" : pal.sub,
        }}
      >
        <div
          dir={isVoice ? undefined : dirOf(text)}
          className={isVoice ? "flex items-center gap-1" : "line-clamp-2 whitespace-pre-wrap break-words"}
          style={{ fontSize: 14, lineHeight: "18px", textAlign: "start" }}
        >
          {isVoice && <IgiMicSmall />}
          {text}
        </div>
      </div>
    );
  }

  const rail = <span className="shrink-0 self-stretch" style={{ width: 3, borderRadius: 2, background: pal.rail }} />;

  return (
    <div className={`flex min-w-0 flex-col ${mine ? "items-end" : "items-start"}`} style={{ marginBottom: 2, maxWidth: "100%" }}>
      <div
        className="max-w-full truncate"
        style={{ fontSize: 12, lineHeight: "16px", color: pal.sub, marginBottom: 4, paddingInline: 4, textAlign: "start" }}
      >
        {label}
      </div>
      <div className="flex min-w-0 max-w-full" style={{ gap: 6 }}>
        {!mine && rail}
        {quote}
        {mine && rail}
      </div>
    </div>
  );
}

/* ------------------------------ thread ------------------------------ */

export function Instagram({ scenario, playback, lang, rtl }: PlatformProps) {
  const dark = scenario.theme === "dark";
  const pal = iosPalette(dark);
  const s = IGI_STR[lang];
  const { messages, typing, clockMs } = playback;
  const live = playback.isLive;
  const exporting = clockMs !== undefined;
  const showTyping = typing || (!live && !exporting && scenario.presence === "typing");
  const scrollRef = useChatScroll<HTMLDivElement>(`${messages.length}-${showTyping}`);

  /* Screen-anchored gradient: every outgoing bubble shows the slice of one
     viewport-sized gradient that sits behind it, re-sliced on scroll. Layout
     offsets are used (not client rects) so the entrance transform and the
     FitDevice scale never skew it; the exporter scrolls after rendering, so it
     paints against the bottom it is scrolling to. */
  const paint = useCallback(() => {
    const root = scrollRef.current;
    if (!root) return;
    const h = root.clientHeight;
    if (!h) return;
    const scrollTop = exporting ? Math.max(0, root.scrollHeight - h) : root.scrollTop;
    root.querySelectorAll<HTMLElement>("[data-igi-out]").forEach((el) => {
      const y = offsetIn(el, root);
      if (y == null) return;
      const bh = el.offsetHeight;
      const top = Math.min(Math.max(y - scrollTop, 0), Math.max(h - bh, 0));
      el.style.backgroundImage = IGI_GRADIENT;
      el.style.backgroundRepeat = "no-repeat";
      el.style.backgroundSize = `100% ${h}px`;
      el.style.backgroundPosition = `0 ${-top}px`;
    });
  }, [scrollRef, exporting]);

  useLayoutEffect(() => {
    paint();
  });
  /* Keep the newest message pinned above the composer while it grows with a
     multi-line draft (UIKit keeps the bottom inset anchored). */
  const pinned = useRef(true);
  const onScroll = useCallback(() => {
    const root = scrollRef.current;
    if (root) pinned.current = root.scrollHeight - root.scrollTop - root.clientHeight < 32;
    paint();
  }, [scrollRef, paint]);
  useEffect(() => {
    const root = scrollRef.current;
    if (!root || typeof ResizeObserver === "undefined") return;
    let lastH = root.clientHeight;
    const ro = new ResizeObserver(() => {
      if (root.clientHeight !== lastH) {
        lastH = root.clientHeight;
        if (pinned.current) root.scrollTop = root.scrollHeight;
      }
      paint();
    });
    ro.observe(root);
    return () => ro.disconnect();
  }, [paint, scrollRef]);

  const byId = new Map(messages.map((m) => [m.id, m] as const));
  /** the earlier message this one quotes (nothing when it is missing / not yet shown) */
  const targetOf = (m: Message | undefined): Message | undefined =>
    m?.replyToId ? byId.get(m.replyToId) : undefined;

  const draft = playback.draft;
  const caretOn = exporting ? clockMs % IGI_CARET_MS < IGI_CARET_MS / 2 : true;

  const last = messages[messages.length - 1];
  const receipt = last && last.sender === "me" ? (playback.statusOf(last) === "read" ? s.seen : s.sent) : null;

  const active = scenario.presence !== "lastseen";
  const subtitle = active ? s.activeNow : scenario.lastSeenText || igiHandle(scenario.them);
  const handle = igiHandle(scenario.them);
  const dirKey = rtl ? "rtl" : "ltr";

  return (
    <div className="flex h-full w-full flex-col" style={{ background: pal.bg, color: pal.fg }}>
      <style>{IGI_CSS}</style>
      <StatusBar device={scenario.device} tint={dark ? "light" : "dark"} background={pal.bg} />

      {/* Header */}
      <div className="flex shrink-0 items-center" style={{ height: IOS.headerH, paddingInlineStart: 8, paddingInlineEnd: 16 }}>
        <span className="flex shrink-0 items-center justify-center" style={{ width: 32, height: 44 }}>
          <IgiChevron color={pal.fg} />
        </span>
        <div className="relative ms-1.5 shrink-0" style={{ width: IOS.headerAvatar, height: IOS.headerAvatar }}>
          <Avatar person={scenario.them} size={IOS.headerAvatar} />
          {active && (
            <span
              className="absolute rounded-full"
              style={{
                width: IOS.activeDot,
                height: IOS.activeDot,
                bottom: -2,
                insetInlineEnd: -2,
                background: IG_ACTIVE_GREEN,
                border: `2px solid ${pal.bg}`,
                boxSizing: "content-box",
              }}
            />
          )}
        </div>
        <div className="min-w-0 flex-1" style={{ marginInlineStart: 10 }}>
          <div
            className="truncate"
            dir="auto"
            style={{ fontSize: IOS.nameSize, lineHeight: "20px", fontWeight: 600, letterSpacing: -0.2, textAlign: "start" }}
          >
            {scenario.them.name}
          </div>
          <div className="truncate" style={{ fontSize: IOS.subSize, lineHeight: "15px", color: pal.sub, textAlign: "start" }}>
            {subtitle}
          </div>
        </div>
        {/* call + video glyphs are not mirrored in the Arabic build */}
        <div className="flex shrink-0 items-center" style={{ gap: 22, color: pal.fg }}>
          <IgiPhone size={IOS.navIcon} />
          <IgiVideo size={IOS.navIcon + 2} />
        </div>
      </div>

      {/* Thread */}
      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="rcss-scroll relative min-h-0 flex-1 overflow-y-auto"
        style={{ paddingInline: IOS.bodyPadX, paddingBottom: 10 }}
      >
        {/* Profile intro that opens every Instagram thread */}
        <div className="flex flex-col items-center text-center" style={{ paddingTop: 30, paddingBottom: 30 }}>
          <Avatar person={scenario.them} size={96} />
          <div
            className="max-w-full truncate"
            dir="auto"
            style={{ marginTop: 12, fontSize: 20, lineHeight: "25px", fontWeight: 600, letterSpacing: -0.3 }}
          >
            {scenario.them.name}
          </div>
          <div style={{ marginTop: 2, fontSize: 14, lineHeight: "18px", color: pal.sub }}>
            {handle ? (
              <>
                <span dir="ltr">{handle}</span> · {s.instagram}
              </>
            ) : (
              s.instagram
            )}
          </div>
          <div
            className="flex items-center justify-center"
            style={{ marginTop: 14, height: 32, padding: "0 16px", borderRadius: 8, background: pal.button, fontSize: 14, fontWeight: 600 }}
          >
            {s.viewProfile}
          </div>
        </div>

        <div className="flex flex-col">
          {messages.map((m, i) => {
            const mine = m.sender === "me";
            const onRight = mine ? !rtl : rtl;
            const sep = needsSeparator(messages, i);
            const g = groupInfo(messages, i);
            const target = targetOf(m);
            // a quoted reply opens a new visual block: it breaks the corner join on both sides
            const firstOfGroup = g.firstOfGroup || sep || !!target;
            const nextSep = i + 1 < messages.length && needsSeparator(messages, i + 1);
            const lastOfGroup = g.lastOfGroup || nextSep || !!targetOf(messages[i + 1]);
            const reaction = m.reaction?.trim();

            const hasImage = m.type === "image";
            const caption = hasImage ? m.text.trim() : "";
            const jumbo = m.type === "text" ? jumboEmojiCount(m.text) : 0;
            const segs: ("image" | "text" | "voice" | "emoji")[] = hasImage
              ? caption
                ? ["image", "text"]
                : ["image"]
              : m.type === "voice"
                ? ["voice"]
                : jumbo
                  ? ["emoji"]
                  : ["text"];

            const enter = live ? `ig-ios-in-${mine ? "me" : "them"}-${dirKey}` : "";

            return (
              <Fragment key={m.id}>
                {sep && (
                  <div
                    className={`flex justify-center ${live ? "ig-ios-fade" : ""}`}
                    style={{ margin: i === 0 ? "0 0 14px" : "18px 0 14px" }}
                  >
                    <span style={{ fontSize: 12, lineHeight: "16px", fontWeight: 500, color: pal.sub }}>
                      {s.today} <span dir="ltr">{m.time}</span>
                    </span>
                  </div>
                )}
                <div
                  data-mid={m.id}
                  data-sender={m.sender}
                  className={`flex items-end ${mine ? "justify-end" : "justify-start"} ${enter}`}
                  style={{
                    marginTop: firstOfGroup ? (sep ? 0 : IOS.senderGap) : IOS.groupGap,
                    gap: IOS.avatarGap,
                  }}
                >
                  {!mine && (
                    <div className="shrink-0" style={{ width: IOS.inAvatar, marginBottom: reaction ? IGI_REACT.h - IGI_REACT.overlap : 0 }}>
                      {lastOfGroup && <Avatar person={scenario.them} size={IOS.inAvatar} />}
                    </div>
                  )}
                  <div
                    className={`flex min-w-0 flex-col ${mine ? "items-end" : "items-start"}`}
                    style={{ maxWidth: IOS.maxW, gap: IOS.groupGap }}
                  >
                    {target && <IgiReplyQuote target={target} mine={mine} pal={pal} s={s} themName={scenario.them.name} />}
                    {segs.map((seg, k) => {
                      const joinedAbove = k > 0 || !firstOfGroup;
                      const joinedBelow = k < segs.length - 1 || !lastOfGroup;
                      if (seg === "emoji") {
                        return (
                          <div
                            key={seg}
                            dir="ltr"
                            style={{ fontSize: jumbo === 1 ? 48 : 40, lineHeight: jumbo === 1 ? "56px" : "48px", padding: "0 2px" }}
                          >
                            {m.text.trim()}
                          </div>
                        );
                      }
                      if (seg === "image") {
                        const corners = cornersFor(onRight, joinedAbove, joinedBelow, IOS.imgRadius, IOS.joined);
                        return (
                          <div key={seg} className="overflow-hidden" style={{ ...corners, width: IOS.imgW, background: pal.imgPlaceholder }}>
                            {m.imageSrc ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={m.imageSrc}
                                alt=""
                                draggable={false}
                                onLoad={paint}
                                className="block w-full object-cover"
                                style={{ maxHeight: 316 }}
                              />
                            ) : (
                              <div className="flex items-center justify-center" style={{ height: 300 }}>
                                <ImageGlyph color={pal.sub} />
                              </div>
                            )}
                          </div>
                        );
                      }
                      const corners = cornersFor(onRight, joinedAbove, joinedBelow, IOS.radius, IOS.joined);
                      const text = hasImage ? caption : m.text;
                      return (
                        <div
                          key={seg}
                          {...(mine ? { "data-igi-out": "" } : {})}
                          style={{
                            ...corners,
                            backgroundColor: mine ? IGI_BOTTOM : pal.inBubble,
                            color: mine ? "#ffffff" : pal.fg,
                            padding: seg === "voice" ? `${IOS.padY}px 14px` : `${IOS.padY}px ${IOS.padX}px`,
                          }}
                        >
                          {seg === "voice" ? (
                            <IgiVoice mine={mine} fg={pal.fg} duration={m.voiceDuration} />
                          ) : (
                            <div
                              dir={dirOf(text)}
                              className="whitespace-pre-wrap break-words"
                              style={{ fontSize: IOS.text, lineHeight: `${IOS.lh}px`, letterSpacing: -0.1, textAlign: "start" }}
                            >
                              {text}
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {reaction && <IgiReaction emoji={reaction} pal={pal} mine={mine} />}
                  </div>
                </div>
              </Fragment>
            );
          })}

          {receipt && (
            <div className={`flex justify-end ${live ? "ig-ios-fade" : ""}`} style={{ marginTop: 4, paddingInlineEnd: 4 }}>
              <span style={{ fontSize: 12, lineHeight: "16px", color: pal.sub }}>{receipt}</span>
            </div>
          )}

          {showTyping && <IgiTyping person={scenario.them} pal={pal} clockMs={clockMs} rtl={rtl} />}
        </div>
      </div>

      {/* Composer */}
      <div className="shrink-0" style={{ padding: "6px 12px 14px" }}>
        {/* The pill grows line by line with a draft (radius stays 22pt, camera
            disc and "Send" stay on the bottom row); mic/gallery/sticker/+ give
            way to the theme-coloured "Send" text button while there is text. */}
        <div
          className="flex items-end"
          style={{
            background: pal.field,
            minHeight: IOS.composerH,
            borderRadius: IOS.composerH / 2,
            padding: (IOS.composerH - IOS.camera) / 2,
            paddingInlineEnd: draft ? 16 : 14,
          }}
        >
          <div
            className="flex shrink-0 items-center justify-center rounded-full"
            style={{ width: IOS.camera, height: IOS.camera, background: IGI_BOTTOM }}
          >
            <IgiCamera />
          </div>
          {draft ? (
            <>
              <div
                className="flex min-w-0 flex-1 flex-col justify-end overflow-hidden"
                style={{
                  marginInlineStart: 10,
                  paddingBlock: (IOS.camera - IOS.lh) / 2,
                  maxHeight: IOS.lh * IGI_DRAFT_LINES + (IOS.camera - IOS.lh),
                }}
              >
                <div
                  dir={dirOf(draft.text)}
                  className="whitespace-pre-wrap break-words"
                  style={{ fontSize: IOS.text, lineHeight: `${IOS.lh}px`, letterSpacing: -0.1, color: pal.fg, textAlign: "start" }}
                >
                  {draft.text}
                  <span
                    key={draft.text.length}
                    aria-hidden
                    className={exporting ? "" : "ig-ios-caret"}
                    style={{
                      display: "inline-block",
                      width: 2,
                      height: 20,
                      marginInlineStart: 1,
                      marginInlineEnd: -3,
                      verticalAlign: -4,
                      borderRadius: 1,
                      background: IGI_BOTTOM,
                      opacity: caretOn ? 1 : 0,
                    }}
                  />
                </div>
              </div>
              <span
                className="flex shrink-0 items-center"
                style={{ height: IOS.camera, marginInlineStart: 12, fontSize: 16, fontWeight: 600, color: IGI_BOTTOM }}
              >
                {s.send}
              </span>
            </>
          ) : (
            <>
              <span
                className="flex min-w-0 flex-1 items-center truncate"
                style={{ height: IOS.camera, marginInlineStart: 10, fontSize: 16, color: pal.sub, textAlign: "start" }}
              >
                {s.message}
              </span>
              <div className="flex shrink-0 items-center" style={{ height: IOS.camera, gap: 14, color: pal.fg }}>
                <IgiMic size={IOS.composerIcon} />
                <IgiGallery size={IOS.composerIcon} />
                <IgiSticker size={IOS.composerIcon} />
                <IgiPlus size={IOS.composerIcon} />
              </div>
            </>
          )}
        </div>
      </div>

      <SystemBottomBar device={scenario.device} bg={pal.bg} fg={dark ? "#ffffff" : "#000000"} />
    </div>
  );
}
