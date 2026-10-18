"use client";

/**
 * TikTok direct messages — chat screen, TikTok for Android on a Samsung device
 * (360dp logical width). Self-contained: shares nothing with the iOS file.
 *
 * Primary reference: TikTok's own product shots for the Aug-2025 DM update
 * (voice notes + photos), published by TechCrunch:
 *   https://techcrunch.com/2025/08/29/tiktok-now-lets-users-send-voice-notes-and-images-in-dms/
 *   https://techcrunch.com/wp-content/uploads/2025/08/unnamed_2e9845.jpg (3140×2088,
 *   screens drawn at 375pt → 2.085 px/pt; values below were pixel-sampled from it)
 *
 * Light palette (sampled):
 *   canvas / header / status bar  #F5F5F5     header hairline   #D8D8D8
 *   incoming bubble / composer    #FFFFFF     quick-reply chips #E9E9E9
 *   outgoing bubble + camera disc #00A2C9 (TikTok cyan), white text
 *   title / message text / icons  #000000     @handle + profile meta #545454
 *   "Sent"/"Seen", time labels    #808080     placeholder        #A8A8A8
 * Dark palette: not in the reference shots — TikTok's dark surfaces are a
 *   neutral #121212 canvas with lifted #262626 cards (no blue cast); the cyan
 *   outgoing bubble is unchanged.
 *
 * Metrics (pt in the shots = dp here):
 *  - Header 52dp under a hairline: "<" chevron (TikTok's TUX icon set is the
 *    same on Android — no Material arrow), 38dp avatar at 49dp, bold 17sp name
 *    at 96dp; report-flag + "•••" at the end (18dp apart, 12dp end inset).
 *    Subtitle "Active now" + green dot only while active.
 *  - Thread opens with the profile card: 92dp avatar, 20sp bold name, @handle.
 *  - Text 16sp / 22sp line, bubble padding 12 × 9 → 40dp single line (pill),
 *    radius 20 on free corners, 4 on corners joined inside a group; the LAST
 *    bubble of a run gets a square tail corner with a small outward flick
 *    (~4.5dp wide × 9dp tall). Max bubble width 243dp.
 *  - Incoming: 28dp avatar, bottom-aligned with the last bubble of a run,
 *    12dp from the edge, 8dp gutter (bubble at 48dp). Outgoing inset 14dp.
 *  - 4dp between bubbles of a run, 11dp between senders.
 *  - Voice: 24dp play disc, bars 2dp / 1.5dp gap whose count grows with the
 *    duration, duration label at the end; bubble 44dp tall.
 *  - "Sent" → "Seen" under your newest message only (13sp, end-aligned).
 *  - Quick-reply chips above the composer (30dp, #E9E9E9): ❤️ 😂 👍,
 *    "👆 Nudge", "Share post" — they scroll off the edge.
 *  - Composer: 42dp white pill, 12dp side margins, 34dp cyan camera disc at the
 *    start, "Message..." 16sp, sticker / photo / mic glyphs 24dp, 15dp apart.
 *  - Android-only: Samsung status bar tinted with the canvas, Samsung 3-button
 *    nav bar below the composer, device font (Roboto / One UI) via DeviceFrame.
 *
 * Motion: TikTok's IM list (RecyclerView) slides the list up while the new row
 * fades in — modelled as a 260ms rise of 16dp + fade on Material's
 * standard-decelerate curve (0, 0, 0.2, 1).
 *   https://m3.material.io/styles/motion/easing-and-duration/tokens-specs
 *
 * Replies / reactions — TikTok's own DM client (tiktok.com async chunks 64027/99682, emotion
 * labels DivChatItemSenderNameContainer, DivRefTextContent, DivRefMediaContent,
 * DivReactionContainer + keys guided_reply_youReplied "You replied:", chat_optimize_repliedToYou
 * "Replied to you:"): 12sp tertiary head text, grey quoted card (UIShapeNeutral4 / UIText3,
 * 8×12, 2-line clamp; photo → 8dp thumbnail) above the reply bubble; the reaction emoji sits
 * in a round badge hooked onto the sender-side bottom corner of the reacted message.
 * Compose typing: chips row hides, sticker/photo/mic → 34dp cyan send disc with a white up
 * arrow, 2dp cyan cursor (500ms Editor blink), field grows to 5 lines.
 *
 * RTL (Arabic build): everything mirrors incl. the back chevron and the tail;
 * flag, "•••", play glyph, camera and the waveform do not.
 *
 * Round 5 — from TikTok's web DM client (tiktok.com chunks 64027 / 99682 + en/ar string tables):
 *  - Group header: name + "{n} members" (PGroupSize, group_chat_number_of_members incl. Arabic
 *    plurals); default group picture = two member photos on the diagonal.
 *  - Sender nickname above a member's run (DivChatItemSenderNameContainer: 12, TextTertiary).
 *  - Recalled message → centred tip "You deleted a message" / "{name} deleted a message"
 *    (PChatTipContainer, keys dm_deleteMsg_chatpage_inline_youDel /
 *    creatorChatRoom_creators_inline_deletedMessage).
 *  - Sticker: no bubble, 112dp box (140 wide), radius 8. Links in text: semiBold (AMessageLink).
 *  - Link preview, location, file, call and "Edited" have no web counterpart: drawn in TikTok's
 *    share-card / bubble language (neutral 16dp cards, TUX red #FE2C55 for pin / missed).
 *  - IME: composer lifts onto the keyboard (paddingBottom = inset); nav bar and quick-reply
 *    chips go away while the field is focused.
 */

import { Fragment, useEffect, type CSSProperties, type ReactNode, type RefObject } from "react";

import type { Message, Person } from "../../types";
import { deviceFontFamily } from "../../data/fonts";
import { Avatar, dirOf, SystemBottomBar, useChatScroll } from "../shared";
import { useKeyboardInset } from "../devices/keyboard-context";
import { SamsungStatusBar } from "../devices/SamsungStatusBar";
import type { Lang } from "./chrome";
import type { PlatformMotion, PlatformProps } from "./types";

/* ------------------------------ tokens ------------------------------ */

const CYAN = "#00a2c9";
const ACTIVE_GREEN = "#1fd17a";

interface Pal {
  bg: string;
  line: string;
  fg: string;
  sub: string;
  meta: string;
  placeholder: string;
  inBubble: string;
  field: string;
  chip: string;
  dots: string;
  imgPlaceholder: string;
  /** quoted-reply card (TUX UIShapeNeutral4 over the canvas) and its text (UIText3) */
  quote: string;
  quoteText: string;
  /** reaction badge fill */
  react: string;
  /** shared-card surface (link / location cards) — neutral on both sides */
  card: string;
  map: MapPal;
}

interface MapPal {
  land: string;
  block: string;
  park: string;
  water: string;
  road: string;
  major: string;
  edge: string;
}

function palette(dark: boolean): Pal {
  return dark
    ? {
        bg: "#121212",
        line: "#2a2a2a",
        fg: "#ffffff",
        sub: "#a8a8a8",
        meta: "#8a8a8a",
        placeholder: "#7a7a7a",
        inBubble: "#262626",
        field: "#262626",
        chip: "#262626",
        dots: "#8a8a8a",
        imgPlaceholder: "#262626",
        quote: "#282828",
        quoteText: "#8a8a8a",
        react: "#333333",
        card: "#262626",
        map: { land: "#2b2d30", block: "#34373b", park: "#2a3b30", water: "#1e3346", road: "#45484d", major: "#5a5d63", edge: "#2b2d30" },
      }
    : {
        bg: "#f5f5f5",
        line: "#d8d8d8",
        fg: "#000000",
        sub: "#545454",
        meta: "#808080",
        placeholder: "#a8a8a8",
        inBubble: "#ffffff",
        field: "#ffffff",
        chip: "#e9e9e9",
        dots: "#a8a8a8",
        imgPlaceholder: "#e6e6e6",
        quote: "#e8e8e9",
        quoteText: "#86878b",
        react: "#ffffff",
        card: "#ffffff",
        map: { land: "#eef0ec", block: "#e3e6e0", park: "#cfe8c8", water: "#b9dcf2", road: "#ffffff", major: "#fde9a8", edge: "#d6d9d2" },
      };
}

/** TikTok brand red (TUX Primary) — map pin, missed-call glyph */
const RED = "#fe2c55";

interface Str {
  activeNow: string;
  message: string;
  sent: string;
  seen: string;
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

/** TikTok's own wording (en / ar builds of the app). */
const STR: Record<Lang, Str> = {
  en: {
    activeNow: "Active now",
    message: "Message...",
    sent: "Sent",
    seen: "Seen",
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
    sent: "تم الإرسال",
    seen: "تمت المشاهدة",
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

/* Metrics (dp at 360dp width). */
const M = {
  text: 16,
  line: 22,
  padX: 12,
  padY: 9,
  radius: 20,
  joined: 4,
  maxW: 243,
  inAvatar: 28,
  inEdge: 12,
  gutter: 8,
  outEdge: 14,
  groupGap: 4,
  senderGap: 11,
  headerH: 52,
  headerAvatar: 38,
  imgW: 200,
  imgRadius: 16,
  emoji: 40,
};

/* ------------------------------ motion ------------------------------ */

/** CSS cubic-bezier evaluated in JS so the exporter frame == live keyframe. */
function bezier(x1: number, y1: number, x2: number, y2: number) {
  const cx = (u: number) => 3 * x1 * u * (1 - u) * (1 - u) + 3 * x2 * u * u * (1 - u) + u * u * u;
  const cy = (u: number) => 3 * y1 * u * (1 - u) * (1 - u) + 3 * y2 * u * u * (1 - u) + u * u * u;
  return (t: number) => {
    if (t <= 0) return 0;
    if (t >= 1) return 1;
    let lo = 0;
    let hi = 1;
    for (let i = 0; i < 24; i++) {
      const mid = (lo + hi) / 2;
      if (cx(mid) < t) lo = mid;
      else hi = mid;
    }
    return cy((lo + hi) / 2);
  };
}

const ENTER_MS = 260;
const ENTER_EASE_CSS = "cubic-bezier(0, 0, 0.2, 1)";
const enterEase = bezier(0, 0, 0.2, 1);
const RISE = 16;

export const tiktokAndroidMotion: PlatformMotion = {
  enterMs: ENTER_MS,
  enterStyle: (p) => {
    const e = enterEase(p);
    return { opacity: e, transform: `translateY(${(1 - e) * RISE}px)` };
  },
};

const TYPING_CYCLE = 1200;
/** Android EditText cursor blink: 500ms on / 500ms off (Editor.BLINK) */
const CARET_MS = 500;
const TYPING_STAGGER = 0.2; // fraction of the cycle between dots

/** Same piecewise-linear curve as the `tt-and-dot` keyframes below. */
function dotOpacityAt(phase: number): number {
  const f = ((phase % 1) + 1) % 1;
  if (f < 0.3) return 0.35 + 0.65 * (f / 0.3);
  if (f < 0.6) return 1 - 0.65 * ((f - 0.3) / 0.3);
  return 0.35;
}

const KEYFRAMES = `
@keyframes tt-and-enter {
  from { opacity: 0; transform: translateY(${RISE}px); }
  to { opacity: 1; transform: none; }
}
@keyframes tt-and-fade {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes tt-and-dot {
  0% { opacity: 0.35; }
  30% { opacity: 1; }
  60% { opacity: 0.35; }
  100% { opacity: 0.35; }
}
.tt-and-enter { animation: tt-and-enter ${ENTER_MS}ms ${ENTER_EASE_CSS} both; }
.tt-and-fade { animation: tt-and-fade 200ms ease-out both; }
.tt-and-dot { animation: tt-and-dot ${TYPING_CYCLE}ms linear infinite; }
@keyframes tt-and-caret {
  0%, 49.99% { opacity: 1; }
  50%, 100% { opacity: 0; }
}
.tt-and-caret { animation: tt-and-caret ${CARET_MS * 2}ms linear infinite; }
`;

/* ------------------------------- icons ------------------------------ */

/** TikTok "<" back chevron — mirrors in RTL. */
function BackChevron({ color }: { color: string }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="shrink-0 rtl:-scale-x-100">
      <path d="M16.2 2.6 6.8 12l9.4 9.4" stroke={color} strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Report flag (outline). Does not mirror. */
function FlagIcon({ color }: { color: string }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path
        d="M4.6 21.4V3.6M4.6 4.4c2.6-1.4 5-1.3 7.4 0s4.8 1.4 7.4 0v9.4c-2.6 1.4-5 1.3-7.4 0s-4.8-1.4-7.4 0"
        stroke={color}
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MoreIcon({ color }: { color: string }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24">
      <circle cx="4.4" cy="12" r="2" fill={color} />
      <circle cx="12" cy="12" r="2" fill={color} />
      <circle cx="19.6" cy="12" r="2" fill={color} />
    </svg>
  );
}

function CameraGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path
        fillRule="evenodd"
        fill="#ffffff"
        d="M9.2 3.6h5.6c.7 0 1.3.4 1.6 1l.9 1.8H20a2.6 2.6 0 0 1 2.6 2.6v9.4a2.6 2.6 0 0 1-2.6 2.6H4a2.6 2.6 0 0 1-2.6-2.6V9a2.6 2.6 0 0 1 2.6-2.6h2.7l.9-1.8c.3-.6.9-1 1.6-1ZM12 9.2a4.3 4.3 0 1 0 0 8.6 4.3 4.3 0 0 0 0-8.6Zm0 2.2a2.1 2.1 0 1 1 0 4.2 2.1 2.1 0 0 1 0-4.2Z"
      />
    </svg>
  );
}

/** Sticker: round face with two dot eyes (no mouth) and a peeled bottom-end corner (2025 render). */
function StickerIcon({ color }: { color: string }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.95" strokeLinejoin="round" strokeLinecap="round">
      <path d="M20.9 13.2A9.4 9.4 0 1 0 13.2 20.9" />
      <path d="M13.2 20.9c3.9-.8 6.9-3.8 7.7-7.7" />
      <path d="M13.2 20.9c-.9-4.4 3.3-8.6 7.7-7.7" />
      <circle cx="8.7" cy="9.6" r="1.35" fill={color} stroke="none" />
      <circle cx="14.5" cy="9.6" r="1.35" fill={color} stroke="none" />
    </svg>
  );
}

/** Photo: rounded square, solid sun dot, one ridge running into the bottom-end corner. */
function PhotoIcon({ color }: { color: string }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.95" strokeLinejoin="round" strokeLinecap="round">
      <rect x="3" y="3" width="18" height="18" rx="3.4" />
      <circle cx="15.8" cy="8.2" r="2.1" fill={color} stroke="none" />
      <path d="M3.4 17.4 7.3 13.5c.6-.6 1.5-.6 2.1 0l7.4 7.3" />
    </svg>
  );
}

/** Send (replaces sticker / photo / mic once text is entered): cyan disc, white up arrow. */
function SendButton({ size }: { size: number }) {
  return (
    <span className="flex shrink-0 items-center justify-center rounded-full" style={{ width: size, height: size, background: CYAN }}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M12 19.5V5M5.6 11.2 12 4.8l6.4 6.4" />
      </svg>
    </span>
  );
}

function MicIcon({ color }: { color: string }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.9" strokeLinecap="round">
      <rect x="8.4" y="2.4" width="7.2" height="12.2" rx="3.6" />
      <path d="M4.8 11.2a7.2 7.2 0 0 0 14.4 0M12 18.4v3.2" />
    </svg>
  );
}

function ShareTile() {
  return (
    <svg width="16" height="18" viewBox="0 0 16 18" className="shrink-0">
      <rect x="0" y="0" width="16" height="18" rx="2.2" fill={CYAN} />
      <path d="M6 5.6v6.8c0 .4.4.6.7.4l5-3.4c.3-.2.3-.6 0-.8l-5-3.4c-.3-.2-.7 0-.7.4Z" fill="#ffffff" />
    </svg>
  );
}

function ImageGlyph({ color }: { color: string }) {
  return (
    <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round">
      <rect x="2.8" y="2.8" width="18.4" height="18.4" rx="3.6" />
      <circle cx="15.6" cy="8.4" r="1.7" />
      <path d="M3.2 15.8 8.6 10.4l10.6 10.6" />
    </svg>
  );
}

/** Bubble tail: square corner with a small outward flick (drawn for the right side). */
function Tail({ color, onRight }: { color: string; onRight: boolean }) {
  return (
    <svg
      width="6"
      height="10"
      viewBox="0 0 6 10"
      aria-hidden
      className="absolute"
      style={{ bottom: 0, ...(onRight ? { right: -4.6 } : { left: -4.6, transform: "scaleX(-1)" }) }}
    >
      <path d="M0 0C.2 4.6 1.6 7.6 4.8 8.8c.8.3.6 1.2-.2 1.2H0Z" fill={color} />
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

/** TikTok drops a centred time label at the top and after ≥1h of silence. */
function needsSeparator(messages: Message[], i: number): boolean {
  if (i === 0) return true;
  const a = minutesOf(messages[i - 1].time);
  const b = minutesOf(messages[i].time);
  if (a == null || b == null) return false;
  return b - a >= 60 || b < a;
}

/** TikTok handle: ASCII-only; non-Latin names get a default "user…" id like new accounts do. */
function handleOf(p: Person): string {
  const h = p.name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9._]/g, "");
  if (h) return h;
  let hash = 7;
  for (let i = 0; i < p.name.length; i++) hash = (hash * 31 + p.name.charCodeAt(i)) % 1e9;
  return `user${String(hash).padStart(9, "0")}4271`;
}

const PICTO = /\p{Extended_Pictographic}|\p{Regional_Indicator}|⃣/u;

/** 1–3 emoji and nothing else → rendered large without a bubble. */
function bigEmoji(text: string): boolean {
  const t = text.trim();
  if (!t) return false;
  let graphemes: string[];
  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    const seg = new Intl.Segmenter(undefined, { granularity: "grapheme" });
    graphemes = Array.from(seg.segment(t), (s) => s.segment).filter((g) => g.trim() !== "");
  } else {
    graphemes = Array.from(t).filter((g) => g.trim() !== "");
  }
  return graphemes.length > 0 && graphemes.length <= 3 && graphemes.every((g) => PICTO.test(g));
}

type Kind = "text" | "voice" | "image" | "emoji" | "sticker" | "location" | "file" | "call" | "deleted";

function kindOf(m: Message): Kind {
  switch (m.type) {
    case "voice":
    case "image":
    case "sticker":
    case "location":
    case "file":
    case "call":
    case "deleted":
      return m.type;
    default:
      return !m.link && bigEmoji(m.text) ? "emoji" : "text";
  }
}

/** kinds drawn as a filled bubble (they pinch corners inside a run and carry the tail) */
const BUBBLE_KINDS = new Set<Kind>(["text", "voice", "file", "call"]);

type Corners = Pick<CSSProperties, "borderTopLeftRadius" | "borderTopRightRadius" | "borderBottomLeftRadius" | "borderBottomRightRadius">;

/** Free corners 20, joined corners 4, the tail corner square. Only the sender side changes. */
function cornersFor(onRight: boolean, joinedAbove: boolean, joinedBelow: boolean, tail: boolean, r: number): Corners {
  const top = joinedAbove ? M.joined : r;
  const bottom = tail ? 0 : joinedBelow ? M.joined : r;
  return onRight
    ? { borderTopLeftRadius: r, borderBottomLeftRadius: r, borderTopRightRadius: top, borderBottomRightRadius: bottom }
    : { borderTopRightRadius: r, borderBottomRightRadius: r, borderTopLeftRadius: top, borderBottomLeftRadius: bottom };
}

function secondsOf(d?: string): number {
  const mt = /(\d+):(\d{2})/.exec(d ?? "");
  return mt ? Number(mt[1]) * 60 + Number(mt[2]) : 8;
}

/* ---------------------------- sub-views ----------------------------- */

const WAVE = [
  8, 14, 20, 11, 17, 9, 13, 20, 7, 12, 18, 10, 15, 6, 19, 12, 9, 16, 20, 8, 13, 17, 7, 11, 19, 14, 9, 6, 15, 20, 10, 12, 18, 8, 14, 7, 11, 16, 9, 13,
];

function VoiceContent({ mine, pal, duration, bubble }: { mine: boolean; pal: Pal; duration?: string; bubble: string }) {
  const ink = mine ? "#ffffff" : pal.fg;
  // waveform length grows with the clip (5 bars at 0:08 → ~38 at 0:51 in the reference)
  const bars = Math.max(5, Math.min(WAVE.length, Math.round(secondsOf(duration) * 0.72)));
  return (
    <div dir="ltr" className="flex items-center" style={{ height: 24 }}>
      <span className="flex shrink-0 items-center justify-center rounded-full" style={{ width: 24, height: 24, background: ink }}>
        <svg width="10" height="11" viewBox="0 0 10 11">
          <path d="M1.4 1.2v8.6c0 .6.6.9 1.1.6l6.8-4.3c.5-.3.5-.9 0-1.2L2.5.6c-.5-.3-1.1 0-1.1.6Z" fill={bubble} />
        </svg>
      </span>
      <span className="flex items-center" style={{ marginInlineStart: 8, gap: 1.6, height: 20 }}>
        {WAVE.slice(0, bars).map((h, i) => (
          <span key={i} style={{ width: 2, height: bars <= 6 ? [10, 16, 20, 16, 12, 8][i] : h, borderRadius: 1, background: ink }} />
        ))}
      </span>
      <span className="shrink-0 tabular-nums" style={{ marginInlineStart: 9, fontSize: 15, lineHeight: "20px", fontWeight: 500, color: ink }}>
        {duration ?? "0:08"}
      </span>
    </div>
  );
}

function TypingRow({ person, pal, animate, clockMs }: { person: Person; pal: Pal; animate: boolean; clockMs?: number }) {
  return (
    <div className={`flex items-end ${animate ? "tt-and-enter" : ""}`} style={{ marginTop: M.senderGap, gap: M.gutter }}>
      <Avatar person={person} size={M.inAvatar} />
      <div
        className="relative flex items-center"
        style={{
          ...cornersFor(false, false, false, true, M.radius),
          background: pal.inBubble,
          height: M.line + M.padY * 2,
          padding: "0 15px",
          gap: 5,
        }}
      >
        {[0, 1, 2].map((i) => {
          const op = clockMs !== undefined ? dotOpacityAt(clockMs / TYPING_CYCLE - i * TYPING_STAGGER) : null;
          return (
            <span
              key={i}
              className={`inline-block rounded-full ${op === null ? "tt-and-dot" : ""}`}
              style={{
                width: 7,
                height: 7,
                background: pal.dots,
                ...(op === null ? { animationDelay: `${i * TYPING_STAGGER * TYPING_CYCLE}ms` } : { opacity: op }),
              }}
            />
          );
        })}
        <Tail color={pal.inBubble} onRight={false} />
      </div>
    </div>
  );
}

/**
 * Quoted reply — TikTok's own DM client (tiktok.com bundle, DivChatItemSenderNameContainer /
 * DivRefTextContent / DivRefMediaContent): a 12sp tertiary head text ("You replied:" /
 * "Replied to you:") on the sender side, then the quoted message as a grey card
 * (UIShapeNeutral4, UIText3, 8×12 padding, 2-line clamp) — or a small thumbnail for a photo —
 * stacked ABOVE the reply bubble, 4dp apart.
 */
function Quote({ target, pal, s, mine }: { target: Message; pal: Pal; s: Str; mine: boolean }) {
  const head = mine ? s.youReplied : target.sender === "me" ? s.repliedToYou : s.repliedToThemselves;
  const snippet = snippetOf(target, s);
  return (
    <div className={`flex flex-col ${mine ? "items-end" : "items-start"}`} style={{ gap: 4, marginBottom: 4, maxWidth: "100%" }}>
      <div className="truncate" style={{ maxWidth: "100%", fontSize: 12, lineHeight: "16px", color: pal.meta, paddingInline: 2 }}>
        {head}
      </div>
      {target.type === "image" && target.imageSrc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={target.imageSrc} alt="" draggable={false} className="block object-cover" style={{ width: 60, height: 80, borderRadius: 8 }} />
      ) : (
        <div style={{ maxWidth: 228, borderRadius: 12, padding: "8px 12px", background: pal.quote, color: pal.quoteText }}>
          <div
            dir={dirOf(snippet)}
            className="overflow-hidden break-words"
            style={{ fontSize: 14, lineHeight: "19px", textAlign: "start", display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: 2 }}
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
function snippetOf(m: Message, s: Str): string {
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
function linkify(text: string): ReactNode {
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

const CARD_W = 232;

/**
 * Shared-link card — drawn like TikTok's own share cards in DMs (neutral surface on both sides,
 * media on top, 16dp radius), stacked above the text bubble.
 */
function LinkCard({ link, pal }: { link: NonNullable<Message["link"]>; pal: Pal }) {
  const site = siteOf(link.url, link.siteName);
  return (
    <div className="overflow-hidden" style={{ width: CARD_W, borderRadius: M.imgRadius, background: pal.card }}>
      {link.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={link.image} alt="" draggable={false} className="block w-full object-cover" style={{ height: 122 }} />
      ) : null}
      <div style={{ padding: "9px 12px 10px" }}>
        <div
          dir={dirOf(link.title)}
          className="overflow-hidden break-words"
          style={{ fontSize: 15, lineHeight: "20px", fontWeight: 700, color: pal.fg, textAlign: "start", display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: 2 }}
        >
          {link.title}
        </div>
        {link.description ? (
          <div
            dir={dirOf(link.description)}
            className="overflow-hidden break-words"
            style={{ marginTop: 2, fontSize: 13, lineHeight: "18px", color: pal.meta, textAlign: "start", display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: 2 }}
          >
            {link.description}
          </div>
        ) : null}
        <div className="flex items-center" style={{ marginTop: 6, gap: 4, color: pal.meta }}>
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
function MapArt({ map, w, h }: { map: MapPal; w: number; h: number }) {
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

/** Location card: map with the pin (live → avatar in a cyan halo), then title / address. */
function LocationCard({ loc, pal, s, person }: { loc: NonNullable<Message["location"]>; pal: Pal; s: Str; person: Person }) {
  const mapH = 120;
  return (
    <div className="overflow-hidden" style={{ width: CARD_W, borderRadius: M.imgRadius, background: pal.card }}>
      <div className="relative" style={{ height: mapH }}>
        <MapArt map={pal.map} w={CARD_W} h={mapH} />
        {loc.live ? (
          <span
            className="absolute flex items-center justify-center rounded-full"
            style={{ left: CARD_W / 2 - 26, top: mapH / 2 - 26, width: 52, height: 52, background: "rgba(0,162,201,0.22)" }}
          >
            <span className="flex rounded-full" style={{ padding: 2.5, background: "#ffffff", boxShadow: "0 1px 4px rgba(0,0,0,0.25)" }}>
              <Avatar person={person} size={30} />
            </span>
          </span>
        ) : (
          <svg width="30" height="38" viewBox="0 0 30 38" aria-hidden className="absolute" style={{ left: CARD_W / 2 - 15, top: mapH / 2 - 36 }}>
            <ellipse cx="15" cy="35.5" rx="5" ry="1.8" fill="rgba(0,0,0,0.22)" />
            <path d="M15 1C7.3 1 1.5 6.9 1.5 14.4 1.5 24 15 35 15 35s13.5-11 13.5-20.6C28.5 6.9 22.7 1 15 1Z" fill={RED} stroke="#ffffff" strokeWidth="1.6" />
            <circle cx="15" cy="14.2" r="5" fill="#ffffff" />
          </svg>
        )}
      </div>
      <div style={{ padding: "9px 12px 10px" }}>
        {loc.live && (
          <div className="flex items-center" style={{ gap: 5, marginBottom: 1, fontSize: 12, lineHeight: "16px", fontWeight: 700, color: CYAN }}>
            <span className="rounded-full" style={{ width: 6, height: 6, background: CYAN }} />
            {s.liveLocation}
          </div>
        )}
        <div dir={dirOf(loc.title)} className="truncate" style={{ fontSize: 15, lineHeight: "20px", fontWeight: 700, color: pal.fg, textAlign: "start" }}>
          {loc.title}
        </div>
        {loc.subtitle ? (
          <div dir={dirOf(loc.subtitle)} className="truncate" style={{ marginTop: 1, fontSize: 13, lineHeight: "18px", color: pal.meta, textAlign: "start" }}>
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
function FileIcon({ ext }: { ext: string }) {
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

function FileBody({ file, mine, pal }: { file: NonNullable<Message["file"]>; mine: boolean; pal: Pal }) {
  const ext = extOf(file.name);
  const parts = [file.pages, file.size, ext ? ext.toUpperCase() : null].filter((p): p is string => !!p);
  return (
    <div className="flex items-center" style={{ gap: 10, width: 208 }}>
      <FileIcon ext={ext} />
      <div className="min-w-0 flex-1">
        <div
          dir="ltr"
          className="overflow-hidden break-all"
          style={{ fontSize: 15, lineHeight: "20px", fontWeight: 700, textAlign: "start", display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: 2 }}
        >
          {file.name}
        </div>
        {parts.length > 0 && (
          <div className="truncate" style={{ marginTop: 2, fontSize: 12, lineHeight: "16px", color: mine ? "rgba(255,255,255,0.8)" : pal.meta, textAlign: "start" }}>
            {/* each part isolated so "245 KB" / "PDF" keep their order inside an Arabic line */}
            {parts.map((p, i) => (
              <Fragment key={i}>
                {i > 0 && " · "}
                <span dir="auto" style={{ unicodeBidi: "isolate" }}>
                  {p}
                </span>
              </Fragment>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CallGlyph({ video, color }: { video: boolean; color: string }) {
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

/** Call entry: 36dp disc with the call glyph (missed → TikTok red), title + duration / call-back line. */
function CallBody({ call, mine, pal, s }: { call: NonNullable<Message["call"]>; mine: boolean; pal: Pal; s: Str }) {
  const title = call.missed && !mine ? (call.video ? s.missedVideo : s.missedVoice) : call.video ? s.videoCall : s.voiceCall;
  const sub = call.missed ? (mine ? s.noAnswer : s.callBack) : call.duration ?? "";
  return (
    <div className="flex items-center" style={{ gap: 10, minWidth: 164 }}>
      <span className="flex shrink-0 items-center justify-center rounded-full" style={{ width: 36, height: 36, background: mine ? "rgba(255,255,255,0.22)" : pal.chip }}>
        <CallGlyph video={call.video} color={mine ? "#ffffff" : call.missed ? RED : pal.fg} />
      </span>
      <div className="min-w-0">
        <div className="whitespace-nowrap" style={{ fontSize: 15, lineHeight: "20px", fontWeight: 700 }}>
          {title}
        </div>
        {sub && (
          <div className="whitespace-nowrap" style={{ fontSize: 13, lineHeight: "18px", color: mine ? "rgba(255,255,255,0.8)" : pal.meta }}>
            <span dir={/^[\d:]+$/.test(sub) ? "ltr" : undefined}>{sub}</span>
          </div>
        )}
      </div>
    </div>
  );
}

/** Sticker (no bubble): TikTok draws stickers in a 112dp box (web: 112 / 140, radius 8). */
function StickerBody({ m }: { m: Message }) {
  if (m.imageSrc) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={m.imageSrc} alt="" draggable={false} className="block object-contain" style={{ width: 140, height: 140, borderRadius: 8 }} />;
  }
  const t = m.text.trim() || "🙂";
  let count = 1;
  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    count = Array.from(new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(t.replace(/\s+/g, ""))).length;
  }
  const size = count <= 1 ? 90 : count === 2 ? 50 : 36;
  return (
    <div dir="ltr" className="flex items-center justify-center whitespace-nowrap" style={{ minWidth: 112, height: 112, fontSize: size, lineHeight: "112px" }}>
      {t}
    </div>
  );
}

/** TikTok's default group picture: two member photos overlapping on the diagonal. */
function GroupAvatar({ members, avatar, name, size, ring }: { members: Person[]; avatar: string | null; name: string; size: number; ring: string }) {
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
 * Bottom anchoring while the thread shrinks (keyboard rising): RecyclerView keeps the newest row
 * above the IME. Off in video export, where the exporter owns the scroll.
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
 * reacted message, overlapping it by 8dp and ringed in the canvas colour (2dp); the row then
 * gets 14dp of extra room underneath.
 */
const REACT_H = 22;
const REACT_DROP = 14;
function ReactionBadge({ emoji, pal, onRight }: { emoji: string; pal: Pal; onRight: boolean }) {
  return (
    <span
      className="pointer-events-none absolute z-[1] flex items-center justify-center"
      style={{
        bottom: -REACT_DROP,
        ...(onRight ? { right: 8 } : { left: 8 }),
        height: REACT_H,
        minWidth: 28,
        paddingInline: 5,
        borderRadius: REACT_H / 2,
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
 * three glyphs give way to the cyan send disc, the text fills the field in the normal text
 * colour with a 2dp cyan cursor, and the pill grows line by line (EditText maxLines 5, then it
 * scrolls) while both discs stay pinned to the bottom.
 */
function Composer({ pal, s, draft, clockMs }: { pal: Pal; s: Str; draft: string | null; clockMs?: number }) {
  const caretOn = clockMs === undefined ? null : Math.floor(clockMs / CARET_MS) % 2 === 0;
  const typing = draft !== null;
  return (
    <div className="flex items-end" style={{ background: pal.field, minHeight: 42, borderRadius: 21, padding: 4, paddingInlineEnd: typing ? 4 : 13 }}>
      <div className="flex shrink-0 items-center justify-center rounded-full" style={{ width: 34, height: 34, background: CYAN }}>
        <CameraGlyph />
      </div>
      {typing ? (
        <div
          className="flex min-w-0 flex-1 flex-col justify-end overflow-hidden"
          style={{ marginInlineStart: 10, marginInlineEnd: 10, paddingBlock: 6, maxHeight: 5 * 22 + 12 }}
        >
          <div dir={dirOf(draft)} className="whitespace-pre-wrap break-words" style={{ fontSize: 16, lineHeight: "22px", color: pal.fg, textAlign: "start" }}>
            {draft}
            <span
              aria-hidden
              className={caretOn === null ? "tt-and-caret" : undefined}
              style={{
                display: "inline-block",
                width: 2,
                height: 19,
                marginBottom: -4,
                marginInlineStart: 1,
                background: CYAN,
                ...(caretOn === null ? {} : { opacity: caretOn ? 1 : 0 }),
              }}
            />
          </div>
        </div>
      ) : (
        <span
          className="min-w-0 flex-1 self-center truncate"
          style={{ marginInlineStart: 10, fontSize: 16, lineHeight: "22px", color: pal.placeholder, textAlign: "start" }}
        >
          {s.message}
        </span>
      )}
      {typing ? (
        <SendButton size={34} />
      ) : (
        <div className="flex shrink-0 items-center self-center" style={{ gap: 15 }}>
          <StickerIcon color={pal.fg} />
          <PhotoIcon color={pal.fg} />
          <MicIcon color={pal.fg} />
        </div>
      )}
    </div>
  );
}

/* ------------------------------ thread ------------------------------ */

export function TikTokAndroid({ scenario, playback, lang, rtl }: PlatformProps) {
  const dark = scenario.theme === "dark";
  const pal = palette(dark);
  const s = STR[lang];
  const { messages, typing, clockMs } = playback;
  const exporting = clockMs !== undefined;
  const live = playback.isLive && !exporting;
  const showTyping = typing || (!playback.isLive && !exporting && scenario.presence === "typing");
  const draft = playback.draft ? playback.draft.text : null;

  /* IME: the composer rides on top of the keyboard (adjustResize) and the list shrinks above it. */
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
  /** a run = one author's consecutive messages, cut by a time label or a system tip */
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
  const handle = handleOf(scenario.them);

  const kinds = messages.map(kindOf);
  /** bubble kinds join their neighbours' corners; cards, stickers, big emoji and photos break it */
  const joins = (a: Kind | undefined, b: Kind | undefined) => !!a && !!b && BUBBLE_KINDS.has(a) && BUBBLE_KINDS.has(b);

  return (
    <div
      className="flex h-full w-full flex-col"
      // TikTok Sans for Latin text; Arabic falls through to the Samsung device stack
      style={{
        background: pal.bg,
        color: pal.fg,
        fontFamily: `var(--font-tiktok-sans), ${deviceFontFamily(scenario.device, scenario.androidFont)}`,
        paddingBottom: kbInset,
        transition: kbTransition === "none" ? "none" : `padding-bottom ${kbTransition}`,
      }}
    >
      <style>{KEYFRAMES}</style>
      <SamsungStatusBar tint={dark ? "light" : "dark"} background={pal.bg} lang={lang} />

      {/* Header — 52dp + hairline */}
      <div
        className="flex shrink-0 items-center"
        style={{ height: M.headerH, paddingInlineStart: 6, paddingInlineEnd: 12, background: pal.bg, borderBottom: `0.5px solid ${pal.line}` }}
      >
        <span className="flex shrink-0 items-center justify-center" style={{ width: 32, height: 44 }}>
          <BackChevron color={pal.fg} />
        </span>
        <div className="relative shrink-0" style={{ marginInlineStart: 11 }}>
          {group ? (
            <GroupAvatar members={group.members} avatar={group.avatar} name={group.name} size={M.headerAvatar} ring={pal.bg} />
          ) : (
            <Avatar person={scenario.them} size={M.headerAvatar} />
          )}
          {active && (
            <span
              className="absolute rounded-full"
              style={{
                width: 9,
                height: 9,
                bottom: 0,
                insetInlineEnd: 0,
                background: ACTIVE_GREEN,
                border: `1.5px solid ${pal.bg}`,
                boxSizing: "content-box",
              }}
            />
          )}
        </div>
        <div className="min-w-0 flex-1" style={{ marginInlineStart: 9 }}>
          <div className="truncate" dir="auto" style={{ fontSize: 17, lineHeight: "22px", fontWeight: 700, textAlign: "start" }}>
            {title}
          </div>
          {subtitle && (
            <div className="truncate" style={{ fontSize: 12, lineHeight: "15px", color: pal.sub, textAlign: "start" }}>
              {subtitle}
            </div>
          )}
        </div>
        <div className="flex shrink-0 items-center" style={{ gap: 18, marginInlineStart: 12 }}>
          <FlagIcon color={pal.fg} />
          <MoreIcon color={pal.fg} />
        </div>
      </div>

      {/* Thread */}
      <div ref={scrollRef} className="rcss-scroll relative min-h-0 flex-1 overflow-y-auto" style={{ background: pal.bg, paddingTop: 20, paddingBottom: 12 }}>
        <div className="flex flex-col">
          {/* Profile (or group) card that opens every TikTok chat */}
          <div className="flex flex-col items-center text-center" style={{ paddingInline: 24, marginBottom: 18 }}>
            {group ? (
              <GroupAvatar members={group.members} avatar={group.avatar} name={group.name} size={92} ring={pal.bg} />
            ) : (
              <Avatar person={scenario.them} size={92} />
            )}
            <div className="max-w-full truncate" dir="auto" style={{ marginTop: 16, fontSize: 20, lineHeight: "24px", fontWeight: 700 }}>
              {title}
            </div>
            <div dir={group ? undefined : "ltr"} style={{ marginTop: 2, fontSize: 15, lineHeight: "21px", color: pal.sub }}>
              {group ? s.members(group.members.length + 1) : `@${handle}`}
            </div>
          </div>

          {messages.map((m, i) => {
            const mine = m.sender === "me";
            const onRight = mine ? !rtl : rtl;
            const kind = kinds[i];
            const sep = needsSeparator(messages, i);
            const separator = sep && (
              <div className="flex justify-center" style={{ margin: i === 0 ? "0 0 12px" : "18px 0 12px" }}>
                <span dir="ltr" style={{ fontSize: 12, lineHeight: "16px", color: pal.meta }}>
                  {m.time}
                </span>
              </div>
            );

            /* Recalled message → centred tertiary tip (PChatTipContainer: P3, 8px 0, 0 50px) */
            if (kind === "deleted") {
              return (
                <div key={m.id} className="contents">
                  {separator}
                  <div
                    data-mid={m.id}
                    data-sender={m.sender}
                    className={`text-center ${live ? "tt-and-fade" : ""}`}
                    style={{ marginTop: sep ? 0 : 12, marginBottom: 2, paddingInline: 40, fontSize: 13, lineHeight: "18px", color: pal.meta }}
                  >
                    {mine ? s.youDeleted : s.theyDeleted(authorOf(m).name)}
                  </div>
                </div>
              );
            }

            const quote = quoteOf(i);
            const firstOfGroup = startsBlock(i);
            const lastOfGroup = i === messages.length - 1 || startsBlock(i + 1);
            const runStart = startsRun(i);
            const reaction = m.reaction?.trim() || null;
            const author = mine ? scenario.me : authorOf(m);
            const showName = !!group && !mine && runStart;
            const prev = messages[i - 1];
            const next = messages[i + 1];
            const joinAbove = !firstOfGroup && joins(kinds[i - 1], kind) && !m.link && !prev?.edited;
            const joinBelow = !lastOfGroup && joins(kind, kinds[i + 1]) && !next?.link && !m.edited;
            const bubbleColor = mine ? CYAN : pal.inBubble;
            const ink = mine ? "#ffffff" : pal.fg;
            const caption = kind === "image" ? m.text.trim() : "";
            const marginTop = sep ? 0 : firstOfGroup ? M.senderGap : M.groupGap;

            let body: ReactNode;
            if (kind === "emoji") {
              body = (
                <div dir="auto" style={{ fontSize: M.emoji, lineHeight: `${M.emoji + 8}px`, paddingInline: 2 }}>
                  {m.text.trim()}
                </div>
              );
            } else if (kind === "sticker") {
              body = <StickerBody m={m} />;
            } else if (kind === "location" && m.location) {
              body = <LocationCard loc={m.location} pal={pal} s={s} person={author} />;
            } else if (kind === "image") {
              body = (
                <>
                  <div className="overflow-hidden" style={{ width: M.imgW, borderRadius: M.imgRadius, background: pal.imgPlaceholder }}>
                    {m.imageSrc ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={m.imageSrc} alt="" draggable={false} className="block w-full object-cover" style={{ maxHeight: 280 }} />
                    ) : (
                      <div className="flex items-center justify-center" style={{ height: 266 }}>
                        <ImageGlyph color={pal.meta} />
                      </div>
                    )}
                  </div>
                  {caption && (
                    <div
                      className="relative"
                      style={{
                        ...cornersFor(onRight, false, joinBelow, lastOfGroup, M.radius),
                        marginTop: M.groupGap,
                        background: bubbleColor,
                        color: ink,
                        padding: `${M.padY}px ${M.padX}px`,
                      }}
                    >
                      <div dir={dirOf(caption)} className="whitespace-pre-wrap break-words" style={{ fontSize: M.text, lineHeight: `${M.line}px`, textAlign: "start" }}>
                        {linkify(caption)}
                      </div>
                      {lastOfGroup && <Tail color={bubbleColor} onRight={onRight} />}
                    </div>
                  )}
                </>
              );
            } else {
              const padding =
                kind === "voice" ? "10px 12px" : kind === "file" ? "10px 12px" : kind === "call" ? "10px 16px 10px 10px" : `${M.padY}px ${M.padX}px`;
              body = (
                <>
                  {m.link && (
                    <div style={{ marginBottom: M.groupGap }}>
                      <LinkCard link={m.link} pal={pal} />
                    </div>
                  )}
                  <div
                    className="relative"
                    style={{
                      ...cornersFor(onRight, joinAbove, joinBelow, lastOfGroup, M.radius),
                      background: bubbleColor,
                      color: ink,
                      padding,
                    }}
                  >
                    {kind === "voice" ? (
                      <VoiceContent mine={mine} pal={pal} duration={m.voiceDuration} bubble={bubbleColor} />
                    ) : kind === "file" && m.file ? (
                      <FileBody file={m.file} mine={mine} pal={pal} />
                    ) : kind === "call" && m.call ? (
                      <CallBody call={m.call} mine={mine} pal={pal} s={s} />
                    ) : (
                      <div dir={dirOf(m.text)} className="whitespace-pre-wrap break-words" style={{ fontSize: M.text, lineHeight: `${M.line}px`, textAlign: "start" }}>
                        {linkify(m.text)}
                      </div>
                    )}
                    {lastOfGroup && <Tail color={bubbleColor} onRight={onRight} />}
                  </div>
                </>
              );
            }

            return (
              <div key={m.id} className="contents">
                {separator}
                <div
                  data-mid={m.id}
                  data-sender={m.sender}
                  className={`flex items-end ${mine ? "justify-end" : "justify-start"} ${live ? "tt-and-enter" : ""}`}
                  style={{
                    marginTop,
                    marginBottom: reaction ? REACT_DROP : 0,
                    gap: M.gutter,
                    paddingInlineStart: mine ? M.outEdge : M.inEdge,
                    paddingInlineEnd: mine ? M.outEdge : M.inEdge,
                  }}
                >
                  {!mine && (
                    <div className="shrink-0" style={{ width: M.inAvatar }}>
                      {lastOfGroup && <Avatar person={author} size={M.inAvatar} />}
                    </div>
                  )}
                  <div className={`flex min-w-0 flex-col ${mine ? "items-end" : "items-start"}`} style={{ maxWidth: M.maxW }}>
                    {showName && (
                      // group chats: the member's nickname above their run (DivChatItemSenderNameContainer: 12, TextTertiary)
                      <div className="max-w-full truncate" dir="auto" style={{ fontSize: 12, lineHeight: "16px", color: pal.meta, paddingInline: 2, marginBottom: 4 }}>
                        {author.name}
                      </div>
                    )}
                    {quote && <Quote target={quote} pal={pal} s={s} mine={mine} />}
                    <div className={`relative flex max-w-full flex-col ${mine ? "items-end" : "items-start"}`}>
                      {body}
                      {reaction && <ReactionBadge emoji={reaction} pal={pal} onRight={onRight} />}
                    </div>
                    {m.edited && (
                      <div style={{ marginTop: reaction ? REACT_DROP + 2 : 3, fontSize: 12, lineHeight: "16px", color: pal.meta, paddingInline: 2 }}>{s.edited}</div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {receipt && (
            <div
              key={`${last.id}-${receipt}`}
              className={`flex justify-end ${live ? "tt-and-fade" : ""}`}
              style={{ marginTop: 4, paddingInlineEnd: M.outEdge }}
            >
              <span style={{ fontSize: 13, lineHeight: "17px", color: pal.meta }}>{receipt}</span>
            </div>
          )}

          {showTyping && (
            <div style={{ paddingInline: M.inEdge }}>
              <TypingRow person={typer} pal={pal} animate={live} clockMs={clockMs} />
            </div>
          )}
        </div>
      </div>

      {/* Quick replies — 30dp chips, overflow off the end edge; gone once the field is focused (IME up) or holds text */}
      {draft === null && !kbUp && (
        <div className="flex shrink-0 overflow-hidden" style={{ background: pal.bg, gap: 8, paddingInline: 12, paddingTop: 6 }}>
          {["❤️", "😂", "👍"].map((e) => (
            <span
              key={e}
              className="flex shrink-0 items-center justify-center rounded-full"
              style={{ height: 30, width: 50, background: pal.chip, fontSize: 17 }}
            >
              {e}
            </span>
          ))}
          <span
            className="flex shrink-0 items-center rounded-full whitespace-nowrap"
            style={{ height: 30, paddingInline: 13, gap: 5, background: pal.chip, fontSize: 15 }}
          >
            <span style={{ fontSize: 16 }}>👆</span>
            {s.nudge}
          </span>
          <span
            className="flex shrink-0 items-center rounded-full whitespace-nowrap"
            style={{ height: 30, paddingInline: 13, gap: 8, background: pal.chip, fontSize: 15 }}
          >
            <ShareTile />
            {s.sharePost}
          </span>
        </div>
      )}

      {/* Composer — 42dp pill, 8dp above the nav bar / keyboard */}
      <div className="shrink-0" style={{ background: pal.bg, padding: "8px 12px 8px" }}>
        <Composer pal={pal} s={s} draft={draft} clockMs={clockMs} />
      </div>

      <SystemBottomBar device="android" bg={pal.bg} fg={dark ? "#ffffff" : "#000000"} />
    </div>
  );
}
