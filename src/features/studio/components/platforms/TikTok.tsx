"use client";

/**
 * TikTok direct messages — chat screen (iPhone).
 *
 * PRIMARY SOURCE — TikTok's own Aug 2025 DM product render (three iPhones at
 * 375pt, @2.08x): https://techcrunch.com/wp-content/uploads/2025/08/unnamed_2e9845.jpg
 * Pixel-scanned with sharp (values in pt; insets carry over to 393pt):
 *  - Canvas + header #F5F5F5; header 55pt under the status bar with a 0.5pt
 *    #D8D8D8 hairline. Chevron glyph 9.6×17.3 centred 22pt from the edge;
 *    38pt avatar at x=50; name 17 semibold at x≈97; report flag + "…" (3.8pt
 *    dots, 7.2pt pitch) centred 65.4 / 26.9pt from the trailing edge.
 *  - Profile intro on top of the thread: 92pt avatar 20pt under the header,
 *    name ~21 bold, then 15pt lines on a 21pt pitch (@handle #545454).
 *  - Bubbles: 15–16pt text on a 21pt line (2-line 59.6 vs 1-line 38.5pt),
 *    padding 9×12, radius 20 (single line = pill), joined corners 4, 4pt gap
 *    inside a run, 10pt between senders, max width ≈260pt. The LAST bubble of
 *    a run squares its sender-side bottom corner and flicks a ~4pt tail
 *    outward. Incoming #FFFFFF / black text, outgoing solid #00A2C9 / white.
 *  - Incoming 28pt avatar only beside the last bubble of a run, bottom-aligned,
 *    12pt from the edge, 8pt to the bubble. No avatar on my own messages;
 *    my bubbles sit 12pt from the trailing edge.
 *  - Voice: 45pt bubble, 23pt white play disc, 2pt bars on a 4.35pt pitch
 *    (5–18pt tall, bar count ∝ length: 0:08 → 5, 0:51 → 31), duration 14pt.
 *  - "Sent"/"Seen": 12pt #808080 under the newest outgoing bubble, flush with
 *    its trailing edge.
 *  - Quick-reply chips 30pt tall, #E9E9E9, 8pt apart, 12pt inset: ❤️ 😂 👍
 *    (50pt each), "👆 Nudge", "Share post" (cyan play tile), clipped at the edge.
 *  - Composer 8pt below the chips: 42pt #FFFFFF pill, 12pt insets, 34pt
 *    #00A2C9 camera disc 4pt inside, "Message..." #A8A8A8 16pt 12pt after it,
 *    sticker / photo / mic 24pt glyphs on a 38.5pt pitch, mic centred 24pt
 *    from the pill end; pill bottom 28pt above the home indicator.
 *  - Dark (lead-supplied, from TikTok dark shots): canvas #121212, cards/chips
 *    #262626, white text, same cyan.
 * Secondary source — TikTok's TUX tokens + strings from tiktok.com web bundles
 * (async/71799.*.js, async/99682.*.js, /explore?lang=ar): online dot #1DD765,
 * time separators after >5 min of silence (3e5 ms) showing the clock only.
 * Arabic chrome strings follow the TikTok Android template for consistency.
 * Replies / reactions — TikTok's own DM client (tiktok.com async chunks 64027/99682, emotion
 * labels DivChatItemSenderNameContainer, DivRefTextContent, DivRefMediaContent,
 * DivReactionContainer, SpanReactionEmoji + keys guided_reply_youReplied "You replied:",
 * chat_optimize_repliedToYou "Replied to you:"): head text 12 tertiary on the sender side,
 * quoted card UIShapeNeutral4 / UIText3, 8×12 padding, 2-line clamp, photo → 8pt-radius
 * thumbnail, stacked above the reply bubble; reaction emoji 16 in an 18pt box inside a
 * fully-rounded pill — drawn here as a badge hooked onto the bubble's sender-side corner.
 * Compose typing: chips row hides, sticker/photo/mic → 34pt cyan send disc with a white up
 * arrow, 2pt cyan caret (UIKit 530ms blink), pill grows to 5 lines.
 * Font: TikTok Sans (`--font-tiktok-sans`) before the device stack.
 */

import { Fragment, useEffect, type CSSProperties, type ReactNode, type RefObject } from "react";

import { deviceFontFamily } from "../../data/fonts";
import type { Message, Person } from "../../types";
import { Avatar, dirOf, SystemBottomBar, useChatScroll } from "../shared";
import { useKeyboardInset } from "../devices/keyboard-context";
import { StatusBar } from "../devices/StatusBar";
import type { Lang } from "./chrome";
import type { PlatformMotion, PlatformProps } from "./types";

/* ------------------------------ tokens ------------------------------ */

const TT = {
  headerH: 55,
  headerAvatar: 38,
  onlineDot: 10,
  nameSize: 17,
  subSize: 12,
  navIcon: 24,
  rowInset: 12,
  avatar: 28,
  avatarGap: 8,
  text: 16,
  lh: 21,
  padX: 12,
  padY: 9,
  maxW: 260,
  radius: 20,
  joined: 4,
  groupGap: 4,
  senderGap: 10,
  imgW: 200,
  imgRadius: 16,
  chipH: 30,
  pillH: 42,
  camera: 34,
} as const;

const TT_CYAN = "#00a2c9";
const TT_ONLINE = "#1dd765";

interface TtPalette {
  bg: string;
  fg: string;
  sub: string;
  handle: string;
  placeholder: string;
  inBubble: string;
  pill: string;
  chip: string;
  line: string;
  imgPlaceholder: string;
  /** quoted-reply card (TUX UIShapeNeutral4 over the canvas) and its text (UIText3) */
  quote: string;
  quoteText: string;
  /** reaction badge fill */
  react: string;
  /** shared-card surface (link / location cards) — neutral on both sides */
  card: string;
  map: TtMapPal;
}

interface TtMapPal {
  land: string;
  block: string;
  park: string;
  water: string;
  road: string;
  major: string;
  edge: string;
}

function ttPalette(dark: boolean): TtPalette {
  return dark
    ? {
        bg: "#121212",
        fg: "#ffffff",
        sub: "#8a8a8a",
        handle: "#a8a8a8",
        placeholder: "#7a7a7a",
        inBubble: "#262626",
        pill: "#262626",
        chip: "#262626",
        line: "#2a2a2a",
        imgPlaceholder: "#262626",
        quote: "#282828",
        quoteText: "#8a8a8a",
        react: "#333333",
        card: "#262626",
        map: { land: "#2b2d30", block: "#34373b", park: "#2a3b30", water: "#1e3346", road: "#45484d", major: "#5a5d63", edge: "#2b2d30" },
      }
    : {
        bg: "#f5f5f5",
        fg: "#000000",
        sub: "#808080",
        handle: "#545454",
        placeholder: "#a8a8a8",
        inBubble: "#ffffff",
        pill: "#ffffff",
        chip: "#e9e9e9",
        line: "#d8d8d8",
        imgPlaceholder: "#e9e9e9",
        quote: "#e8e8e9",
        quoteText: "#86878b",
        react: "#ffffff",
        card: "#ffffff",
        map: { land: "#eef0ec", block: "#e3e6e0", park: "#cfe8c8", water: "#b9dcf2", road: "#ffffff", major: "#fde9a8", edge: "#d6d9d2" },
      };
}

/** TikTok brand red (TUX Primary) — map pin, missed-call glyph */
const TT_RED = "#fe2c55";

interface TtStrings {
  activeNow: string;
  message: string;
  seen: string;
  sent: string;
  nudge: string;
  sharePost: string;
  /** quoted-reply head text (1:1 chat keys guided_reply_youReplied / chat_optimize_repliedToYou / …Themself) */
  youReplied: string;
  repliedToYou: string;
  repliedToThemselves: string;
  voice: string;
  photo: string;
  /** quoted sticker (im_quote_sticker) */
  sticker: string;
  /** group subtitle: "{n} members" (group_chat_number_of_members) */
  members: (n: number) => string;
  isTyping: (name: string) => string;
  /** recalled message tips (dm_deleteMsg_chatpage_inline_youDel / creatorChatRoom_creators_inline_deletedMessage) */
  youDeleted: string;
  theyDeleted: (name: string) => string;
  edited: string;
  voiceCall: string;
  videoCall: string;
  missedVoice: string;
  missedVideo: string;
  callBack: string;
  noAnswer: string;
  liveLocation: string;
}

/** TikTok's Arabic plural forms for group_chat_number_of_members (zero/one/two/few/many/other). */
function arMembers(n: number): string {
  const r = n % 100;
  const word = n === 0 ? "من الأعضاء" : n === 1 ? "عضو" : n === 2 ? "عضوان" : r >= 3 && r <= 10 ? "أعضاء" : "عضو";
  return `${n} ${word}`;
}

const TT_STR: Record<Lang, TtStrings> = {
  en: {
    activeNow: "Active now",
    message: "Message...",
    seen: "Seen",
    sent: "Sent",
    nudge: "Nudge",
    sharePost: "Share post",
    youReplied: "You replied:",
    repliedToYou: "Replied to you:",
    repliedToThemselves: "Replied to themselves",
    voice: "Voice message",
    photo: "Photo",
    sticker: "[sticker]",
    members: (n) => `${n} ${n === 1 ? "member" : "members"}`,
    isTyping: (name) => `${name} is typing...`,
    youDeleted: "You deleted a message",
    theyDeleted: (name) => `${name} deleted a message`,
    edited: "Edited",
    voiceCall: "Voice call",
    videoCall: "Video call",
    missedVoice: "Missed voice call",
    missedVideo: "Missed video call",
    callBack: "Tap to call back",
    noAnswer: "No answer",
    liveLocation: "Live location",
  },
  ar: {
    activeNow: "نشط الآن",
    message: "رسالة...",
    seen: "تمت المشاهدة",
    sent: "تم الإرسال",
    nudge: "نكزة",
    sharePost: "مشاركة منشور",
    youReplied: "لقد رددت:",
    repliedToYou: "ردّ عليك:",
    repliedToThemselves: "ردّ على نفسه",
    voice: "رسالة صوتية",
    photo: "صورة",
    sticker: "‏[الملصق]",
    members: arMembers,
    isTyping: (name) => `${name} يكتب...`,
    youDeleted: "لقد حذفت رسالة",
    theyDeleted: (name) => `‏${name} حذف رسالة`,
    edited: "تم التعديل",
    voiceCall: "مكالمة صوتية",
    videoCall: "مكالمة فيديو",
    missedVoice: "مكالمة صوتية فائتة",
    missedVideo: "مكالمة فيديو فائتة",
    callBack: "انقر لمعاودة الاتصال",
    noAnswer: "لا يوجد رد",
    liveLocation: "الموقع المباشر",
  },
};

/* ------------------------------- icons ------------------------------ */
/* TikTok TUX glyphs: 24pt boxes, ~2pt round strokes. */

function TtChevron({ color }: { color: string }) {
  // the only header glyph that mirrors in the Arabic build
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="shrink-0 rtl:-scale-x-100">
      <path d="M16.6 3.4 8 12l8.6 8.6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TtFlag() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4.4 22V2.6" />
      <path d="M4.4 3.6h15.4l-3.6 5.1 3.6 5.1H4.4" />
    </svg>
  );
}

function TtMore() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="4.8" cy="12" r="1.9" />
      <circle cx="12" cy="12" r="1.9" />
      <circle cx="19.2" cy="12" r="1.9" />
    </svg>
  );
}

function TtCamera() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden>
      <path
        fillRule="evenodd"
        fill="#ffffff"
        d="M9.3 3.3h5.4c.7 0 1.3.4 1.6 1l.9 1.8H19a3 3 0 0 1 3 3v8.6a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3V9.1a3 3 0 0 1 3-3h1.8l.9-1.8c.3-.6.9-1 1.6-1ZM12 8.6a4.4 4.4 0 1 0 0 8.8 4.4 4.4 0 0 0 0-8.8Zm0 2.2a2.2 2.2 0 1 1 0 4.4 2.2 2.2 0 0 1 0-4.4Z"
      />
    </svg>
  );
}

/** Sticker: round face with two dot eyes (no mouth) and a peeled bottom-end corner (2025 render). */
function TtSticker() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.9 13.2A9.4 9.4 0 1 0 13.2 20.9" />
      <path d="M13.2 20.9c3.9-.8 6.9-3.8 7.7-7.7" />
      <path d="M13.2 20.9c-.9-4.4 3.3-8.6 7.7-7.7" />
      <circle cx="8.7" cy="9.6" r="1.35" fill="currentColor" stroke="none" />
      <circle cx="14.5" cy="9.6" r="1.35" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** Photo: rounded square, solid sun dot, one ridge running into the bottom-end corner. */
function TtPhoto() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="3.4" />
      <circle cx="15.8" cy="8.2" r="2.1" fill="currentColor" stroke="none" />
      <path d="M3.4 17.4 7.3 13.5c.6-.6 1.5-.6 2.1 0l7.4 7.3" />
    </svg>
  );
}

/** Send (replaces sticker / photo / mic once text is entered): cyan disc, white up arrow. */
function TtSend({ size }: { size: number }) {
  return (
    <span className="flex shrink-0 items-center justify-center rounded-full" style={{ width: size, height: size, background: TT_CYAN }}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M12 19.5V5M5.6 11.2 12 4.8l6.4 6.4" />
      </svg>
    </span>
  );
}

function TtMic() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="8.2" y="1.6" width="7.6" height="13" rx="3.8" />
      <path d="M4.8 11.2a7.2 7.2 0 0 0 14.4 0M12 18.4v3.8" />
    </svg>
  );
}

function TtShareTile() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" aria-hidden>
      <rect width="15" height="15" rx="2.5" fill="#03a2d9" />
      <path d="M5.4 4.2v6.6c0 .4.4.6.7.4l5-3.3c.3-.2.3-.6 0-.8l-5-3.3c-.3-.2-.7 0-.7.4Z" fill="#ffffff" />
    </svg>
  );
}

function ImageGlyph({ color }: { color: string }) {
  return (
    <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round">
      <rect x="2.6" y="2.6" width="18.8" height="18.8" rx="3.2" />
      <path d="M2.9 18.6 9 12.4l4.2 4.2" />
      <path d="M12 15.4l2.7-2.7 6.4 6.4" />
    </svg>
  );
}

/** The small outward flick on the sender-side bottom corner of a run's last bubble. */
function TtTail({ color, onRight }: { color: string; onRight: boolean }) {
  return (
    <svg
      width="6"
      height="7"
      viewBox="0 0 6 7"
      aria-hidden
      className="pointer-events-none absolute"
      style={{
        bottom: 0,
        ...(onRight ? { right: -4.6 } : { left: -4.6, transform: "scaleX(-1)" }),
      }}
    >
      <path d="M0 0C.5 3.4 2.2 5.6 5.2 6.4c.5.1.5.6 0 .6H0Z" fill={color} />
    </svg>
  );
}

/* ------------------------------ motion ------------------------------ */

const TT_ENTER_MS = 260;

function ttEase(p: number): number {
  const t = Math.min(1, Math.max(0, p));
  return 1 - Math.pow(1 - t, 3);
}

/**
 * TikTok iOS DM entrance (260ms ease-out cubic): the row fades in while rising
 * into place with a slight grow from its bottom sender-side corner — 10pt for
 * mine (coming up from the composer), 6pt for theirs.
 */
export const tiktokIosMotion: PlatformMotion = {
  enterMs: TT_ENTER_MS,
  enterStyle: (p, mine, rtl) => {
    const e = ttEase(p);
    const onRight = mine ? !rtl : rtl;
    return {
      opacity: Math.min(1, Math.max(0, p) / 0.55),
      transform: `translateY(${((1 - e) * (mine ? 10 : 6)).toFixed(2)}px) scale(${(0.96 + 0.04 * e).toFixed(4)})`,
      transformOrigin: `${onRight ? "right" : "left"} bottom`,
    };
  },
};

const TT_DOT_MS = 1200;
const TT_CARET_MS = 530;
function ttDot(phase: number): number {
  const t = ((phase % 1) + 1) % 1;
  const k = t < 0.5 ? Math.sin((t / 0.5) * Math.PI) : 0;
  return 0.35 + 0.65 * k;
}

function buildCss(): string {
  const steps = 12;
  let css = "";
  for (const mine of [true, false]) {
    for (const rtl of [false, true]) {
      const name = `tt-ios-in-${mine ? "me" : "them"}-${rtl ? "rtl" : "ltr"}`;
      let frames = "";
      for (let i = 0; i <= steps; i++) {
        const p = i / steps;
        const st = tiktokIosMotion.enterStyle(p, mine, rtl);
        frames += `${(p * 100).toFixed(2)}%{opacity:${st.opacity};transform:${st.transform};transform-origin:${st.transformOrigin}}`;
      }
      css += `@keyframes ${name}{${frames}}.${name}{animation:${name} ${TT_ENTER_MS}ms linear both}`;
    }
  }
  let dot = "";
  for (let i = 0; i <= 20; i++) dot += `${i * 5}%{opacity:${ttDot(i / 20).toFixed(3)}}`;
  css += `@keyframes tt-ios-dot{${dot}}.tt-ios-dot{animation:tt-ios-dot ${TT_DOT_MS}ms linear infinite}`;
  css += `@keyframes tt-ios-fade{from{opacity:0}to{opacity:1}}.tt-ios-fade{animation:tt-ios-fade 200ms ease-out both}`;
  // UIKit caret: 0.53s on / 0.53s off, hard steps
  css += `@keyframes tt-ios-caret{0%,49.99%{opacity:1}50%,100%{opacity:0}}.tt-ios-caret{animation:tt-ios-caret ${TT_CARET_MS * 2}ms linear infinite}`;
  return css;
}
const TT_CSS = buildCss();

/* ------------------------------ helpers ----------------------------- */

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

/** TikTok drops a time separator above the first message and after >5 min of silence. */
function needsSeparator(messages: Message[], i: number): boolean {
  if (i === 0) return true;
  const a = minutesOf(messages[i - 1].time);
  const b = minutesOf(messages[i].time);
  if (a == null || b == null) return false;
  return b - a > 5 || b < a;
}

const EMOJI_ONLY = /^(?:\p{Extended_Pictographic}|\p{Emoji_Modifier}|\p{Regional_Indicator}|‍|️|⃣|[#*0-9](?=️?⃣)|\s)+$/u;

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

type Corners = Pick<CSSProperties, "borderTopLeftRadius" | "borderTopRightRadius" | "borderBottomLeftRadius" | "borderBottomRightRadius">;

/** Sender-side corners shrink inside a run; the run's last bubble squares its bottom one (the tail sits there). */
function cornersFor(onRight: boolean, joinedAbove: boolean, joinedBelow: boolean, tail: boolean, r: number): Corners {
  const top = joinedAbove ? TT.joined : r;
  const bottom = tail ? 0 : joinedBelow ? TT.joined : r;
  return onRight
    ? {
        borderTopLeftRadius: r,
        borderBottomLeftRadius: r,
        borderTopRightRadius: top,
        borderBottomRightRadius: bottom,
      }
    : {
        borderTopRightRadius: r,
        borderBottomRightRadius: r,
        borderTopLeftRadius: top,
        borderBottomLeftRadius: bottom,
      };
}

const AR_LATIN: Record<string, string> = {
  ا: "a", أ: "a", إ: "e", آ: "a", ب: "b", ت: "t", ث: "th", ج: "j", ح: "h", خ: "kh", د: "d", ذ: "th", ر: "r", ز: "z",
  س: "s", ش: "sh", ص: "s", ض: "d", ط: "t", ظ: "z", ع: "a", غ: "gh", ف: "f", ق: "q", ك: "k", ل: "l", م: "m", ن: "n",
  ه: "h", ة: "a", و: "w", ي: "y", ى: "a", ئ: "e", ؤ: "o", ء: "",
};

/** TikTok usernames are Latin: derive a plausible @handle from the display name. */
function ttHandle(p: Person): string {
  const latin = p.name
    .trim()
    .toLowerCase()
    .replace(/[ء-ي]/g, (c) => AR_LATIN[c] ?? "")
    .replace(/\s+/g, "")
    .replace(/[^a-z0-9._]/g, "");
  return latin || "user";
}

/** "0:51" → 51 */
function secondsOf(d?: string): number {
  const mt = /(\d+):(\d{2})/.exec(d ?? "");
  return mt ? Number(mt[1]) * 60 + Number(mt[2]) : 8;
}

/* ---------------------------- sub-views ----------------------------- */

const TT_WAVE = [11, 11, 14, 14, 11, 11, 9, 9, 7, 7, 5, 11, 14, 11, 9, 5, 7, 7, 5, 5, 11, 11, 14, 14, 11, 11, 9, 9, 5, 5, 13];
const TT_WAVE_SHORT = [5, 13, 18, 13, 9];

function TtVoice({ mine, fg, inBubble, duration }: { mine: boolean; fg: string; inBubble: string; duration?: string }) {
  const ink = mine ? "#ffffff" : fg;
  const n = Math.max(5, Math.min(31, Math.round(secondsOf(duration) * 0.6)));
  const bars = n <= 5 ? TT_WAVE_SHORT : TT_WAVE.slice(0, n);
  return (
    <div dir="ltr" className="flex items-center" style={{ height: 23 }}>
      <span className="flex shrink-0 items-center justify-center rounded-full" style={{ width: 23, height: 23, background: ink }}>
        <svg width="10" height="11" viewBox="0 0 10 11" aria-hidden style={{ marginLeft: 2 }}>
          <path d="M0 1v9c0 .8.8 1.2 1.5.8l7.6-4.5c.6-.4.6-1.2 0-1.6L1.5.2C.8-.2 0 .2 0 1Z" fill={mine ? TT_CYAN : inBubble} />
        </svg>
      </span>
      <span className="flex items-center" style={{ marginInlineStart: 8, gap: 2.35, height: 18 }}>
        {bars.map((h, i) => (
          <span key={i} style={{ width: 2, height: h, borderRadius: 1, background: ink }} />
        ))}
      </span>
      <span
        className="shrink-0 tabular-nums"
        style={{
          marginInlineStart: 9,
          fontSize: 14,
          lineHeight: "18px",
          color: ink,
        }}
      >
        {duration ?? "0:08"}
      </span>
    </div>
  );
}

function TtTyping({ person, pal, clockMs }: { person: Person; pal: TtPalette; clockMs?: number }) {
  const exporting = clockMs !== undefined;
  return (
    <div className={`flex items-end ${exporting ? "" : "tt-ios-fade"}`} style={{ marginTop: TT.senderGap, gap: TT.avatarGap }}>
      <Avatar person={person} size={TT.avatar} />
      <div
        className="relative flex items-center justify-center"
        style={{
          background: pal.inBubble,
          ...cornersFor(false, false, false, true, TT.radius),
          height: TT.lh + TT.padY * 2,
          width: 60,
          gap: 5,
        }}
      >
        {[0, 1, 2].map((i) => {
          const o = exporting ? ttDot(clockMs / TT_DOT_MS - i * 0.2) : null;
          return (
            <span
              key={i}
              className={`block rounded-full ${exporting ? "" : "tt-ios-dot"}`}
              style={{
                width: 7,
                height: 7,
                background: pal.sub,
                ...(o !== null ? { opacity: o } : { animationDelay: `${i * 0.2 * TT_DOT_MS}ms` }),
              }}
            />
          );
        })}
        <TtTail color={pal.inBubble} onRight={false} />
      </div>
    </div>
  );
}

function TtChip({ bg, children, width }: { bg: string; children: ReactNode; width?: number }) {
  return (
    <span
      className="flex shrink-0 items-center justify-center whitespace-nowrap"
      style={{
        height: TT.chipH,
        borderRadius: TT.chipH / 2,
        background: bg,
        width,
        paddingInline: width ? 0 : 12,
        gap: 4,
        fontSize: 14,
      }}
    >
      {children}
    </span>
  );
}

/**
 * Quoted reply — TikTok's own DM client (tiktok.com bundle, DivChatItemSenderNameContainer /
 * DivRefTextContent / DivRefMediaContent): a 12pt tertiary head text ("You replied:" /
 * "Replied to you:") aligned to the sender side, then the quoted message as a grey card
 * (UIShapeNeutral4, UIText3, 8×12 padding, 2-line clamp) — or a small thumbnail for a photo —
 * stacked ABOVE the reply bubble, 4pt apart.
 */
function TtQuote({ target, pal, s, mine }: { target: Message; pal: TtPalette; s: TtStrings; mine: boolean }) {
  const head = mine ? s.youReplied : target.sender === "me" ? s.repliedToYou : s.repliedToThemselves;
  const snippet = ttSnippet(target, s);
  return (
    <div className={`flex flex-col ${mine ? "items-end" : "items-start"}`} style={{ gap: 4, marginBottom: 4, maxWidth: "100%" }}>
      <div
        className="truncate"
        style={{
          maxWidth: "100%",
          fontSize: 12,
          lineHeight: "15px",
          color: pal.sub,
          paddingInline: 2,
        }}
      >
        {head}
      </div>
      {target.type === "image" && target.imageSrc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={target.imageSrc} alt="" draggable={false} className="block object-cover" style={{ width: 60, height: 80, borderRadius: 8 }} />
      ) : (
        <div
          style={{
            maxWidth: 238,
            borderRadius: 12,
            padding: "8px 12px",
            background: pal.quote,
            color: pal.quoteText,
          }}
        >
          <div
            dir={dirOf(snippet)}
            className="overflow-hidden break-words"
            style={{
              fontSize: 14,
              lineHeight: "18px",
              textAlign: "start",
              display: "-webkit-box",
              WebkitBoxOrient: "vertical",
              WebkitLineClamp: 2,
            }}
          >
            {target.type === "voice" && <span aria-hidden>🎤 </span>}
            {target.type === "image" && <span aria-hidden>📷 </span>}
            {snippet}
          </div>
        </div>
      )}
    </div>
  );
}

/** One-line text standing for a message in a quote card. */
function ttSnippet(m: Message, s: TtStrings): string {
  switch (m.type) {
    case "voice":
      return s.voice;
    case "image":
      return m.text.trim() || s.photo;
    case "sticker":
      return s.sticker;
    case "location":
      return m.location?.title ?? "";
    case "file":
      return m.file?.name ?? "";
    case "call":
      return m.call?.video ? s.videoCall : s.voiceCall;
    default:
      return m.text;
  }
}

/* --------------------------- new message kinds --------------------------- */

const URL_RE = /(https?:\/\/[^\s]+|www\.[^\s]+)/g;

/** Message text with URLs set in TikTok's link style (AMessageLink: same colour, semiBold). */
function ttLinkify(text: string): ReactNode {
  const parts = text.split(URL_RE);
  if (parts.length === 1) return text;
  return parts.map((p, i) =>
    i % 2 === 1 ? (
      <span key={i} dir="ltr" style={{ fontWeight: 600, unicodeBidi: "isolate" }}>
        {p}
      </span>
    ) : (
      <Fragment key={i}>{p}</Fragment>
    ),
  );
}

function siteOf(url: string, siteName?: string): string {
  if (siteName?.trim()) return siteName.trim();
  return url.replace(/^https?:\/\//, "").replace(/^www\./, "").split(/[/?#]/)[0];
}

const TT_CARD_W = 240;

/**
 * Shared-link card — drawn like TikTok's own share cards in DMs (DivCommonContainer cards:
 * neutral surface on both sides, media on top, 16pt radius), stacked above the text bubble.
 */
function TtLinkCard({ link, pal }: { link: NonNullable<Message["link"]>; pal: TtPalette }) {
  const site = siteOf(link.url, link.siteName);
  return (
    <div className="overflow-hidden" style={{ width: TT_CARD_W, borderRadius: TT.imgRadius, background: pal.card }}>
      {link.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={link.image} alt="" draggable={false} className="block w-full object-cover" style={{ height: 126 }} />
      ) : null}
      <div style={{ padding: "9px 12px 10px" }}>
        <div
          dir={dirOf(link.title)}
          className="overflow-hidden break-words"
          style={{ fontSize: 15, lineHeight: "20px", fontWeight: 600, color: pal.fg, textAlign: "start", display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: 2 }}
        >
          {link.title}
        </div>
        {link.description ? (
          <div
            dir={dirOf(link.description)}
            className="overflow-hidden break-words"
            style={{ marginTop: 2, fontSize: 13, lineHeight: "17px", color: pal.sub, textAlign: "start", display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: 2 }}
          >
            {link.description}
          </div>
        ) : null}
        <div className="flex items-center" style={{ marginTop: 6, gap: 4, color: pal.sub }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden className="shrink-0">
            <path d="M10 14a4.5 4.5 0 0 0 6.4 0l3.2-3.2a4.5 4.5 0 0 0-6.4-6.4L12 5.6" />
            <path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3.2 3.2a4.5 4.5 0 0 0 6.4 6.4l1.2-1.2" />
          </svg>
          <span dir="ltr" className="truncate" style={{ fontSize: 12, lineHeight: "16px" }}>
            {site}
          </span>
        </div>
      </div>
    </div>
  );
}

/** Plausible street map (blocks, a park, water, a main road) drawn in TikTok's flat card style. */
function TtMap({ map, w, h }: { map: TtMapPal; w: number; h: number }) {
  return (
    <svg width={w} height={h} viewBox="0 0 240 124" preserveAspectRatio="xMidYMid slice" aria-hidden className="block">
      <rect width="240" height="124" fill={map.land} />
      <path d="M0 96c26-6 44 4 66 0s36-16 52-12v40H0Z" fill={map.water} />
      <rect x="150" y="8" width="56" height="34" rx="4" fill={map.park} />
      {[
        [8, 6, 46, 30],
        [62, 6, 40, 30],
        [110, 6, 32, 30],
        [214, 6, 26, 34],
        [8, 50, 46, 30],
        [62, 50, 40, 22],
        [150, 52, 30, 26],
        [188, 52, 52, 26],
        [134, 88, 38, 36],
        [180, 88, 60, 36],
      ].map(([x, y, bw, bh], i) => (
        <rect key={i} x={x} y={y} width={bw} height={bh} rx="2.5" fill={map.block} />
      ))}
      <g stroke={map.road} strokeWidth="5" strokeLinecap="round" fill="none">
        <path d="M58 0v124M106 0v84M146 0v124M184 44v80M0 44h240M0 84h240" />
      </g>
      <path d="M-4 118 240 30" stroke={map.edge} strokeWidth="11" strokeLinecap="round" />
      <path d="M-4 118 240 30" stroke={map.major} strokeWidth="8" strokeLinecap="round" />
    </svg>
  );
}

/** Location card: map with the pin (live → avatar in a pulsing cyan halo), then title / address. */
function TtLocationCard({ loc, pal, s, person }: { loc: NonNullable<Message["location"]>; pal: TtPalette; s: TtStrings; person: Person }) {
  return (
    <div className="overflow-hidden" style={{ width: TT_CARD_W, borderRadius: TT.imgRadius, background: pal.card }}>
      <div className="relative" style={{ height: 124 }}>
        <TtMap map={pal.map} w={TT_CARD_W} h={124} />
        {loc.live ? (
          <span className="absolute flex items-center justify-center rounded-full" style={{ left: 120 - 26, top: 62 - 26, width: 52, height: 52, background: "rgba(0,162,201,0.22)" }}>
            <span className="flex rounded-full" style={{ padding: 2.5, background: "#ffffff", boxShadow: "0 1px 4px rgba(0,0,0,0.25)" }}>
              <Avatar person={person} size={30} />
            </span>
          </span>
        ) : (
          <svg width="30" height="38" viewBox="0 0 30 38" aria-hidden className="absolute" style={{ left: 105, top: 62 - 36 }}>
            <ellipse cx="15" cy="35.5" rx="5" ry="1.8" fill="rgba(0,0,0,0.22)" />
            <path d="M15 1C7.3 1 1.5 6.9 1.5 14.4 1.5 24 15 35 15 35s13.5-11 13.5-20.6C28.5 6.9 22.7 1 15 1Z" fill={TT_RED} stroke="#ffffff" strokeWidth="1.6" />
            <circle cx="15" cy="14.2" r="5" fill="#ffffff" />
          </svg>
        )}
      </div>
      <div style={{ padding: "9px 12px 10px" }}>
        {loc.live && (
          <div className="flex items-center" style={{ gap: 5, marginBottom: 1, fontSize: 12, lineHeight: "16px", fontWeight: 600, color: TT_CYAN }}>
            <span className="rounded-full" style={{ width: 6, height: 6, background: TT_CYAN }} />
            {s.liveLocation}
          </div>
        )}
        <div dir={dirOf(loc.title)} className="truncate" style={{ fontSize: 15, lineHeight: "20px", fontWeight: 600, color: pal.fg, textAlign: "start" }}>
          {loc.title}
        </div>
        {loc.subtitle ? (
          <div dir={dirOf(loc.subtitle)} className="truncate" style={{ marginTop: 1, fontSize: 13, lineHeight: "17px", color: pal.sub, textAlign: "start" }}>
            {loc.subtitle}
          </div>
        ) : null}
      </div>
    </div>
  );
}

const FILE_TINT: Record<string, string> = {
  pdf: "#f04438",
  doc: "#2f6fed",
  docx: "#2f6fed",
  xls: "#1e9e5a",
  xlsx: "#1e9e5a",
  csv: "#1e9e5a",
  ppt: "#ee6a2c",
  pptx: "#ee6a2c",
  zip: "#8a8f98",
  rar: "#8a8f98",
};

function extOf(name: string): string {
  const mt = /\.([a-z0-9]{1,5})$/i.exec(name.trim());
  return mt ? mt[1].toLowerCase() : "";
}

/** Document glyph: folded-corner page in the type colour with the extension on it. */
function TtFileIcon({ ext }: { ext: string }) {
  const tint = FILE_TINT[ext] ?? "#8a8f98";
  return (
    <svg width="34" height="42" viewBox="0 0 34 42" aria-hidden className="shrink-0">
      <path d="M4 0h18l12 12v26a4 4 0 0 1-4 4H4a4 4 0 0 1-4-4V4a4 4 0 0 1 4-4Z" fill={tint} />
      <path d="M22 0v8a4 4 0 0 0 4 4h8Z" fill="#ffffff" fillOpacity="0.45" />
      <text x="17" y="33" textAnchor="middle" fontSize="9" fontWeight="700" fill="#ffffff" fontFamily="inherit">
        {(ext || "file").toUpperCase().slice(0, 4)}
      </text>
    </svg>
  );
}

function TtFile({ file, mine, pal }: { file: NonNullable<Message["file"]>; mine: boolean; pal: TtPalette }) {
  const ext = extOf(file.name);
  const parts = [file.pages, file.size, ext ? ext.toUpperCase() : null].filter((p): p is string => !!p);
  // each part isolated so "245 KB" / "PDF" keep their order inside an Arabic line
  const meta = parts.length
    ? parts.map((p, i) => (
        <Fragment key={i}>
          {i > 0 && " · "}
          <span style={{ unicodeBidi: "isolate" }}>{p}</span>
        </Fragment>
      ))
    : null;
  return (
    <div className="flex items-center" style={{ gap: 10, width: 216 }}>
      <TtFileIcon ext={ext} />
      <div className="min-w-0 flex-1">
        <div
          dir="ltr"
          className="overflow-hidden break-all"
          style={{ fontSize: 15, lineHeight: "20px", fontWeight: 600, textAlign: "start", display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: 2 }}
        >
          {file.name}
        </div>
        {meta && (
          <div className="truncate" style={{ marginTop: 2, fontSize: 12, lineHeight: "16px", color: mine ? "rgba(255,255,255,0.8)" : pal.sub, textAlign: "start" }}>
            {meta}
          </div>
        )}
      </div>
    </div>
  );
}

function TtCallGlyph({ video, color }: { video: boolean; color: string }) {
  return video ? (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden>
      <rect x="2" y="5.5" width="13.5" height="13" rx="3.2" fill={color} />
      <path d="m17 10.2 4-2.6c.6-.4 1 0 1 .6v7.6c0 .6-.4 1-1 .6l-4-2.6Z" fill={color} />
    </svg>
  ) : (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden>
      <path
        d="M6.6 2.8c.6-.2 1.3 0 1.6.6l1.7 3.3c.3.6.2 1.3-.3 1.7l-1.6 1.4a12 12 0 0 0 6.2 6.2l1.4-1.6c.4-.5 1.1-.6 1.7-.3l3.3 1.7c.6.3.8 1 .6 1.6l-.8 2.3c-.3.9-1.2 1.5-2.2 1.4C9.6 20.3 3.7 14.4 2.9 5.8c-.1-1 .5-1.9 1.4-2.2Z"
        fill={color}
      />
    </svg>
  );
}

/** Call entry: 36pt disc with the call glyph (missed → TikTok red), title + duration / call-back line. */
function TtCall({ call, mine, pal, s }: { call: NonNullable<Message["call"]>; mine: boolean; pal: TtPalette; s: TtStrings }) {
  const title = call.missed && !mine ? (call.video ? s.missedVideo : s.missedVoice) : call.video ? s.videoCall : s.voiceCall;
  const sub = call.missed ? (mine ? s.noAnswer : s.callBack) : call.duration ?? "";
  return (
    <div className="flex items-center" style={{ gap: 10, minWidth: 168 }}>
      <span
        className="flex shrink-0 items-center justify-center rounded-full"
        style={{ width: 36, height: 36, background: mine ? "rgba(255,255,255,0.22)" : pal.chip }}
      >
        <TtCallGlyph video={call.video} color={mine ? "#ffffff" : call.missed ? TT_RED : pal.fg} />
      </span>
      <div className="min-w-0">
        <div className="whitespace-nowrap" style={{ fontSize: 15, lineHeight: "20px", fontWeight: 600 }}>
          {title}
        </div>
        {sub && (
          <div className="whitespace-nowrap" style={{ fontSize: 13, lineHeight: "17px", color: mine ? "rgba(255,255,255,0.8)" : pal.sub }}>
            <span dir={/^[\d:]+$/.test(sub) ? "ltr" : undefined}>{sub}</span>
          </div>
        )}
      </div>
    </div>
  );
}

/** Emoji sticker (no bubble): TikTok draws stickers in a 112pt box (web: 112 / 140, radius 8). */
function TtSticker2({ m, count }: { m: Message; count: number }) {
  if (m.imageSrc) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={m.imageSrc} alt="" draggable={false} className="block object-contain" style={{ width: 140, height: 140, borderRadius: 8 }} />;
  }
  const size = count <= 1 ? 92 : count === 2 ? 52 : 38;
  return (
    <div dir="ltr" className="flex items-center justify-center whitespace-nowrap" style={{ minWidth: 112, height: 112, fontSize: size, lineHeight: "112px" }}>
      {m.text.trim() || "🙂"}
    </div>
  );
}

/** TikTok's default group picture: two member photos overlapping on the diagonal. */
function TtGroupAvatar({ members, avatar, name, size, ring }: { members: Person[]; avatar: string | null; name: string; size: number; ring: string }) {
  if (avatar) return <Avatar person={{ name, avatar }} size={size} />;
  const a = members[0] ?? { name, avatar: null };
  const b = members[1] ?? a;
  const d = Math.round(size * 0.68);
  const ringW = Math.max(1.5, size * 0.04);
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <div className="absolute" style={{ top: 0, insetInlineEnd: 0 }}>
        <Avatar person={b} size={d} />
      </div>
      <div className="absolute rounded-full" style={{ bottom: 0, insetInlineStart: 0, padding: ringW, margin: -ringW, background: ring }}>
        <Avatar person={a} size={d} />
      </div>
    </div>
  );
}

/**
 * Bottom anchoring while the thread shrinks (keyboard rising): the scroll position follows the
 * bottom edge like the native list does. Off in video export, where the exporter owns the scroll.
 */
function useBottomAnchor(ref: RefObject<HTMLDivElement | null>, enabled: boolean) {
  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled || typeof ResizeObserver === "undefined") return;
    let prevH = el.clientHeight;
    const ro = new ResizeObserver(() => {
      const h = el.clientHeight;
      if (h < prevH) el.scrollTop += prevH - h;
      prevH = h;
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref, enabled]);
}

/**
 * Reaction: the emoji in a small round badge hooked onto the sender-side bottom corner of the
 * reacted bubble, overlapping it by 8pt and ringed in the canvas colour (2pt) so it reads as
 * cut out of the bubble; the row then gets 14pt of extra room underneath.
 */
const TT_REACT_H = 22;
const TT_REACT_DROP = 14;
function TtReaction({ emoji, pal, onRight }: { emoji: string; pal: TtPalette; onRight: boolean }) {
  return (
    <span
      className="pointer-events-none absolute z-[1] flex items-center justify-center"
      style={{
        bottom: -TT_REACT_DROP,
        ...(onRight ? { right: 8 } : { left: 8 }),
        height: TT_REACT_H,
        minWidth: 28,
        paddingInline: 5,
        borderRadius: TT_REACT_H / 2,
        background: pal.react,
        boxShadow: `0 0 0 2px ${pal.bg}, 0 1px 3px 2px rgba(0,0,0,0.06)`,
        fontSize: 13,
        lineHeight: "16px",
      }}
    >
      {emoji}
    </span>
  );
}

/**
 * Composer pill. Empty: camera disc + "Message..." + sticker / photo / mic. With a draft the
 * three glyphs give way to the cyan send disc, the text takes the field in the normal text
 * colour with a cyan caret, and the pill grows line by line (up to 5 lines, then the oldest
 * lines scroll away under the top edge) while the discs stay pinned to the bottom.
 */
function TtComposer({ pal, s, draft, clockMs }: { pal: TtPalette; s: TtStrings; draft: string | null; clockMs?: number }) {
  const caretOn = clockMs === undefined ? null : Math.floor(clockMs / TT_CARET_MS) % 2 === 0;
  const lines = 5;
  return (
    <div
      className="flex items-end"
      style={{
        background: pal.pill,
        minHeight: TT.pillH,
        borderRadius: TT.pillH / 2,
        padding: 4,
        paddingInlineEnd: draft !== null ? 4 : 12,
      }}
    >
      <span className="flex shrink-0 items-center justify-center rounded-full" style={{ width: TT.camera, height: TT.camera, background: TT_CYAN }}>
        <TtCamera />
      </span>
      {draft !== null ? (
        <div
          className="flex min-w-0 flex-1 flex-col justify-end overflow-hidden"
          style={{
            marginInlineStart: 12,
            marginInlineEnd: 10,
            paddingBlock: 6.5,
            maxHeight: lines * 21 + 13,
          }}
        >
          <div
            dir={dirOf(draft)}
            className="whitespace-pre-wrap break-words"
            style={{
              fontSize: 16,
              lineHeight: "21px",
              color: pal.fg,
              textAlign: "start",
            }}
          >
            {draft}
            <span
              aria-hidden
              className={caretOn === null ? "tt-ios-caret" : undefined}
              style={{
                display: "inline-block",
                width: 2,
                height: 20,
                marginBottom: -4,
                marginInlineStart: 1,
                borderRadius: 1,
                background: TT_CYAN,
                ...(caretOn === null ? {} : { opacity: caretOn ? 1 : 0 }),
              }}
            />
          </div>
        </div>
      ) : (
        <span
          className="min-w-0 flex-1 truncate self-center"
          style={{
            marginInlineStart: 12,
            fontSize: 16,
            lineHeight: "21px",
            color: pal.placeholder,
            textAlign: "start",
          }}
        >
          {s.message}
        </span>
      )}
      {draft !== null ? (
        <TtSend size={TT.camera} />
      ) : (
        <div className="flex shrink-0 items-center self-center" style={{ gap: 14.5, color: pal.fg }}>
          <TtSticker />
          <TtPhoto />
          <TtMic />
        </div>
      )}
    </div>
  );
}

/* ------------------------------ screen ------------------------------ */

type Seg = "image" | "text" | "voice" | "emoji" | "sticker" | "location" | "file" | "call" | "link";

/** The stacked pieces a message is drawn as (deleted messages are a centred tip instead). */
function segsOf(m: Message): Seg[] {
  switch (m.type) {
    case "image":
      return m.text.trim() ? ["image", "text"] : ["image"];
    case "voice":
      return ["voice"];
    case "sticker":
      return ["sticker"];
    case "location":
      return ["location"];
    case "file":
      return ["file"];
    case "call":
      return ["call"];
    case "deleted":
      return [];
    default:
      if (m.link) return ["link", "text"];
      return jumboEmojiCount(m.text) ? ["emoji"] : ["text"];
  }
}

/** pieces whose corners pinch together inside a run */
const JOINABLE = new Set<Seg>(["text", "voice", "file", "call", "image"]);
/** pieces drawn as a filled bubble (tail-bearing) */
const BUBBLE = new Set<Seg>(["text", "voice", "file", "call"]);

export function TikTok({ scenario, playback, lang, rtl }: PlatformProps) {
  const dark = scenario.theme === "dark";
  const pal = ttPalette(dark);
  const s = TT_STR[lang];
  const { messages, typing, clockMs } = playback;
  const live = playback.isLive;
  const exporting = clockMs !== undefined;
  const showTyping = typing || (!live && !exporting && scenario.presence === "typing");
  const draft = playback.draft ? playback.draft.text : null;

  /* OS keyboard: the composer rides on top of it and the thread shrinks above. */
  const { inset: kbInset, transition: kbTransition } = useKeyboardInset();
  const kbUp = kbInset > 0;

  const scrollRef = useChatScroll<HTMLDivElement>(`${messages.length}-${showTyping}-${draft === null ? "-" : Math.floor(draft.length / 24)}-${kbUp}`);
  useBottomAnchor(scrollRef, !exporting);

  /* Group chats: "them" messages belong to a member (authorIndex). */
  const group = scenario.group ?? null;
  const authorOf = (m: Message | undefined): Person =>
    group ? (group.members[m?.authorIndex ?? 0] ?? group.members[0] ?? scenario.them) : scenario.them;
  const keyOf = (m: Message) => (m.sender === "me" ? "me" : group ? `t${m.authorIndex ?? 0}` : "t");
  const isSys = (m: Message) => m.type === "deleted";

  /** the earlier on-screen message a row quotes (nothing when it is missing) */
  const quoteOf = (i: number): Message | undefined => {
    const id = messages[i]?.replyToId;
    if (!id) return undefined;
    const j = messages.findIndex((x) => x.id === id);
    return j >= 0 && j < i ? messages[j] : undefined;
  };
  /** a run = one author's consecutive messages, cut by a time separator or a system tip */
  const startsRun = (i: number) =>
    i === 0 || needsSeparator(messages, i) || keyOf(messages[i - 1]) !== keyOf(messages[i]) || isSys(messages[i - 1]) || isSys(messages[i]);
  /** a quote block also starts fresh (the bubble above closes its run) */
  const startsBlock = (i: number) => startsRun(i) || !!quoteOf(i);

  const last = messages[messages.length - 1];
  const receipt = last && last.sender === "me" && !isSys(last) ? (playback.statusOf(last) === "read" ? s.seen : s.sent) : null;

  /* who is typing: the author of the upcoming "them" message, else the last one who spoke */
  const upcoming = scenario.messages[messages.length];
  const typer = authorOf(upcoming?.sender === "them" ? upcoming : [...messages].reverse().find((m) => m.sender === "them"));

  const active = !group && scenario.presence !== "lastseen";
  const subtitle = group
    ? showTyping
      ? s.isTyping(typer.name)
      : s.members(group.members.length + 1)
    : active
      ? s.activeNow
      : scenario.lastSeenText;
  const title = group ? group.name : scenario.them.name;
  const dirKey = rtl ? "rtl" : "ltr";
  const fontFamily = `var(--font-tiktok-sans), ${deviceFontFamily(scenario.device, scenario.androidFont)}`;

  return (
    <div
      className="flex h-full w-full flex-col"
      style={{
        background: pal.bg,
        color: pal.fg,
        fontFamily,
        paddingBottom: kbInset,
        transition: kbTransition === "none" ? "none" : `padding-bottom ${kbTransition}`,
      }}
    >
      <style>{TT_CSS}</style>
      <StatusBar device={scenario.device} tint={dark ? "light" : "dark"} background={pal.bg} />

      {/* Header */}
      <div
        className="flex shrink-0 items-center"
        style={{
          height: TT.headerH,
          paddingInlineStart: 10,
          paddingInlineEnd: 15,
          borderBottom: `0.5px solid ${pal.line}`,
        }}
      >
        <span className="flex shrink-0 items-center justify-center" style={{ width: 24, height: 44 }}>
          <TtChevron color={pal.fg} />
        </span>
        <div
          className="relative shrink-0"
          style={{
            width: TT.headerAvatar,
            height: TT.headerAvatar,
            marginInlineStart: 16,
          }}
        >
          {group ? (
            <TtGroupAvatar members={group.members} avatar={group.avatar} name={group.name} size={TT.headerAvatar} ring={pal.bg} />
          ) : (
            <Avatar person={scenario.them} size={TT.headerAvatar} />
          )}
          {active && (
            <span
              className="absolute rounded-full"
              style={{
                width: TT.onlineDot,
                height: TT.onlineDot,
                bottom: -1,
                insetInlineEnd: -1,
                background: TT_ONLINE,
                border: `2px solid ${pal.bg}`,
                boxSizing: "content-box",
              }}
            />
          )}
        </div>
        <div className="min-w-0 flex-1" style={{ marginInlineStart: 9 }}>
          <div
            className="truncate"
            dir="auto"
            style={{
              fontSize: TT.nameSize,
              lineHeight: "21px",
              fontWeight: 600,
              textAlign: "start",
            }}
          >
            {title}
          </div>
          {subtitle && (
            <div
              className="truncate"
              style={{
                fontSize: TT.subSize,
                lineHeight: "15px",
                color: pal.sub,
                textAlign: "start",
              }}
            >
              {subtitle}
            </div>
          )}
        </div>
        {/* report flag + more are not mirrored in the Arabic build */}
        <div className="flex shrink-0 items-center" style={{ gap: 14.5, color: pal.fg }}>
          <TtFlag />
          <TtMore />
        </div>
      </div>

      {/* Thread */}
      <div ref={scrollRef} className="rcss-scroll relative min-h-0 flex-1 overflow-y-auto" style={{ paddingInline: TT.rowInset, paddingBottom: 12 }}>
        {/* Profile (or group) intro that opens every TikTok chat */}
        <div className="flex flex-col items-center text-center" style={{ paddingTop: 20, paddingBottom: 16 }}>
          {group ? (
            <TtGroupAvatar members={group.members} avatar={group.avatar} name={group.name} size={92} ring={pal.bg} />
          ) : (
            <Avatar person={scenario.them} size={92} />
          )}
          <div
            className="max-w-full truncate"
            dir="auto"
            style={{
              marginTop: 14,
              fontSize: 21,
              lineHeight: "26px",
              fontWeight: 700,
            }}
          >
            {title}
          </div>
          <div
            dir={group ? undefined : "ltr"}
            style={{
              marginTop: 2,
              fontSize: 15,
              lineHeight: "21px",
              color: pal.handle,
            }}
          >
            {group ? s.members(group.members.length + 1) : `@${ttHandle(scenario.them)}`}
          </div>
        </div>

        <div className="flex flex-col">
          {messages.map((m, i) => {
            const mine = m.sender === "me";
            const onRight = mine ? !rtl : rtl;
            const sep = needsSeparator(messages, i);
            const enter = live ? `tt-ios-in-${mine ? "me" : "them"}-${dirKey}` : "";
            const separator = sep && (
              <div
                className={`text-center ${live ? "tt-ios-fade" : ""}`}
                style={{
                  paddingTop: i === 0 ? 4 : 16,
                  paddingBottom: 2,
                  fontSize: 12,
                  lineHeight: "15px",
                  color: pal.sub,
                }}
              >
                <span dir="ltr">{m.time}</span>
              </div>
            );

            /* Recalled message → centred tertiary tip (PChatTipContainer: P3, 8px 0, 0 50px) */
            if (isSys(m)) {
              return (
                <Fragment key={m.id}>
                  {separator}
                  <div
                    data-mid={m.id}
                    data-sender={m.sender}
                    className={`text-center ${live ? "tt-ios-fade" : ""}`}
                    style={{ marginTop: 12, marginBottom: 2, paddingInline: 38, fontSize: 13, lineHeight: "17px", color: pal.sub }}
                  >
                    {mine ? s.youDeleted : s.theyDeleted(authorOf(m).name)}
                  </div>
                </Fragment>
              );
            }

            const quote = quoteOf(i);
            const firstOfGroup = startsBlock(i);
            const lastOfGroup = i === messages.length - 1 || startsBlock(i + 1);
            const runStart = startsRun(i);
            const runEnd = i === messages.length - 1 || startsRun(i + 1) || !!quoteOf(i + 1);
            const reaction = m.reaction?.trim() || null;
            const author = mine ? scenario.me : authorOf(m);
            const showName = !!group && !mine && runStart;

            const segs = segsOf(m);
            const prev = messages[i - 1];
            const next = messages[i + 1];
            const prevSegs = prev ? segsOf(prev) : [];
            const prevLast = prevSegs[prevSegs.length - 1];
            const nextFirst = next ? segsOf(next)[0] : undefined;
            const caption = m.type === "image" ? m.text.trim() : "";
            const jumbo = m.type === "text" && !m.link ? jumboEmojiCount(m.text) : 0;

            return (
              <Fragment key={m.id}>
                {separator}
                <div
                  data-mid={m.id}
                  data-sender={m.sender}
                  className={`flex items-end ${mine ? "justify-end" : "justify-start"} ${enter}`}
                  style={{
                    marginTop: firstOfGroup ? TT.senderGap : TT.groupGap,
                    marginBottom: reaction ? TT_REACT_DROP : 0,
                    gap: TT.avatarGap,
                  }}
                >
                  {!mine && (
                    <div className="shrink-0" style={{ width: TT.avatar }}>
                      {runEnd && <Avatar person={author} size={TT.avatar} />}
                    </div>
                  )}
                  <div className={`flex min-w-0 flex-col ${mine ? "items-end" : "items-start"}`} style={{ maxWidth: TT.maxW, gap: TT.groupGap }}>
                    {showName && (
                      // group chats: the member's nickname above their run (DivChatItemSenderNameContainer: 12, TextTertiary)
                      <div className="max-w-full truncate" dir="auto" style={{ fontSize: 12, lineHeight: "15px", color: pal.sub, paddingInline: 2 }}>
                        {author.name}
                      </div>
                    )}
                    {quote && <TtQuote target={quote} pal={pal} s={s} mine={mine} />}
                    {segs.map((seg, k) => {
                      const joinable = JOINABLE.has(seg);
                      const joinedAbove =
                        joinable &&
                        (k > 0 ? JOINABLE.has(segs[k - 1]) : !firstOfGroup && !!prevLast && JOINABLE.has(prevLast) && !prev?.edited);
                      const joinedBelow =
                        joinable &&
                        (k < segs.length - 1 ? JOINABLE.has(segs[k + 1]) : !lastOfGroup && !!nextFirst && JOINABLE.has(nextFirst) && !m.edited);
                      const tail = BUBBLE.has(seg) && k === segs.length - 1 && lastOfGroup;
                      const badge = reaction && k === segs.length - 1 ? <TtReaction emoji={reaction} pal={pal} onRight={onRight} /> : null;
                      if (seg === "emoji") {
                        return (
                          <div
                            key={seg}
                            dir="ltr"
                            className="relative"
                            style={{
                              fontSize: jumbo === 1 ? 44 : 36,
                              lineHeight: jumbo === 1 ? "50px" : "42px",
                            }}
                          >
                            {m.text.trim()}
                            {badge}
                          </div>
                        );
                      }
                      if (seg === "sticker") {
                        return (
                          <div key={seg} className="relative">
                            <TtSticker2 m={m} count={jumboEmojiCount(m.text) || 1} />
                            {badge}
                          </div>
                        );
                      }
                      if (seg === "link" && m.link) {
                        return (
                          <div key={seg} className="relative">
                            <TtLinkCard link={m.link} pal={pal} />
                          </div>
                        );
                      }
                      if (seg === "location" && m.location) {
                        return (
                          <div key={seg} className="relative">
                            <TtLocationCard loc={m.location} pal={pal} s={s} person={author} />
                            {badge}
                          </div>
                        );
                      }
                      if (seg === "image") {
                        return (
                          <div key={seg} className="relative">
                            <div
                              className="overflow-hidden"
                              style={{
                                ...cornersFor(onRight, joinedAbove, joinedBelow, false, TT.imgRadius),
                                width: TT.imgW,
                                background: pal.imgPlaceholder,
                              }}
                            >
                              {m.imageSrc ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={m.imageSrc} alt="" draggable={false} className="block w-full object-cover" style={{ maxHeight: 320 }} />
                              ) : (
                                <div className="flex items-center justify-center" style={{ height: 260 }}>
                                  <ImageGlyph color={pal.sub} />
                                </div>
                              )}
                            </div>
                            {badge}
                          </div>
                        );
                      }
                      const fill = mine ? TT_CYAN : pal.inBubble;
                      const text = m.type === "image" ? caption : m.text;
                      const padding =
                        seg === "voice" ? "11px 12px 11px 10px" : seg === "file" ? "10px 12px" : seg === "call" ? "10px 16px 10px 10px" : `${TT.padY}px ${TT.padX}px`;
                      return (
                        <div
                          key={seg}
                          className="relative"
                          style={{
                            ...cornersFor(onRight, joinedAbove, joinedBelow, tail, seg === "voice" ? 22.5 : TT.radius),
                            backgroundColor: fill,
                            color: mine ? "#ffffff" : pal.fg,
                            padding,
                          }}
                        >
                          {seg === "voice" ? (
                            <TtVoice mine={mine} fg={pal.fg} inBubble={pal.inBubble} duration={m.voiceDuration} />
                          ) : seg === "file" && m.file ? (
                            <TtFile file={m.file} mine={mine} pal={pal} />
                          ) : seg === "call" && m.call ? (
                            <TtCall call={m.call} mine={mine} pal={pal} s={s} />
                          ) : (
                            <div
                              dir={dirOf(text)}
                              className="whitespace-pre-wrap break-words"
                              style={{
                                fontSize: TT.text,
                                lineHeight: `${TT.lh}px`,
                                textAlign: "start",
                              }}
                            >
                              {ttLinkify(text)}
                            </div>
                          )}
                          {tail && <TtTail color={fill} onRight={onRight} />}
                          {badge}
                        </div>
                      );
                    })}
                    {m.edited && (
                      <div style={{ marginTop: reaction ? TT_REACT_DROP - 2 : -1, fontSize: 12, lineHeight: "15px", color: pal.sub, paddingInline: 2 }}>
                        {s.edited}
                      </div>
                    )}
                  </div>
                </div>
              </Fragment>
            );
          })}

          {receipt && (
            <div className={`flex justify-end ${live ? "tt-ios-fade" : ""}`} style={{ marginTop: 3 }}>
              <span style={{ fontSize: 12, lineHeight: "15px", color: pal.sub }}>{receipt}</span>
            </div>
          )}

          {showTyping && <TtTyping person={typer} pal={pal} clockMs={clockMs} />}
        </div>
      </div>

      {/* Quick replies — TikTok drops the row once the field is focused (keyboard up) or holds text */}
      {draft === null && !kbUp && (
        <div className="flex shrink-0 overflow-hidden" style={{ gap: 8, paddingInlineStart: TT.rowInset, paddingTop: 2 }}>
          <TtChip bg={pal.chip} width={50}>
            <span style={{ fontSize: 16 }}>❤️</span>
          </TtChip>
          <TtChip bg={pal.chip} width={50}>
            <span style={{ fontSize: 16 }}>😂</span>
          </TtChip>
          <TtChip bg={pal.chip} width={50}>
            <span style={{ fontSize: 16 }}>👍</span>
          </TtChip>
          <TtChip bg={pal.chip}>
            <span style={{ fontSize: 16 }}>👆</span>
            {s.nudge}
          </TtChip>
          <TtChip bg={pal.chip}>
            <TtShareTile />
            {s.sharePost}
          </TtChip>
        </div>
      )}

      {/* Composer — sits straight on the keyboard while it is up (no home-indicator band) */}
      <div className="shrink-0" style={{ padding: `8px ${TT.rowInset}px ${kbUp ? 8 : 22}px` }}>
        <TtComposer pal={pal} s={s} draft={draft} clockMs={clockMs} />
      </div>

      <SystemBottomBar device={scenario.device} bg={pal.bg} fg={dark ? "#ffffff" : "#000000"} />
    </div>
  );
}
