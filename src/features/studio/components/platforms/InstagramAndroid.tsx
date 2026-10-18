"use client";

/**
 * Instagram Direct — thread screen, Instagram for Android on a Samsung device
 * (360dp logical width). Self-contained: shares nothing with the iOS file.
 *
 * Colour tokens — Instagram's 2024-25 "prism" design-system refresh, read from
 * the CSS custom properties instagram.com ships (same IGDS tokens the apps use):
 *   https://www.instagram.com/accounts/login/  (inline :root / .__ig-dark-mode)
 *   --ig-primary-background     light 255,255,255  dark 12,16,20  (#0C1014)
 *   --ig-primary-text / -icon   light 12,16,20     dark 248,249,249
 *   --ig-secondary-text         light 106,113,122  dark 162,170,180
 *   --ig-incoming-message-bubble light 243,245,247 dark 37,41,46   (#25292E)
 *   --ig-secondary-background   light 243,245,247  dark 37,41,46   (composer pill)
 *   --ig-outgoing-message-bubble 74,93,249 (#4A5DF9 — the blue end of the default
 *                                theme; also --ig-primary-button)
 *   --green-4 120,222,69 (#78DE45, presence dot)   --ig-tertiary-text dark 115,115,115
 *   --chat-bubble-border-radius 18px, --direct-message-max-width 236px (web)
 *
 * Default chat theme (mobile): purple → blue gradient anchored to the SCREEN,
 * not to each bubble — bubbles high on screen read violet, the newest (bottom)
 * read blue, and the colour shifts while scrolling.
 *   https://www.howtogeek.com/698074/how-to-change-the-theme-and-accent-color-of-instagram-dms/
 *   https://www.bustle.com/life/how-to-change-chat-color-instagram-dms
 *   (stops are not published; sampled from app captures, bottom stop = #4A5DF9)
 *
 * Android-specific (vs. iOS):
 *  - Edge-to-edge: One UI status bar painted with the canvas colour, Samsung
 *    3-button navigation bar at the bottom (no home indicator).
 *  - Toolbar 56dp (Material app bar). Back = IG's stemmed ARROW (not the iOS
 *    chevron), 24dp glyph in a 48dp touch target at 4dp inset → glyph at 16dp.
 *  - Device font (Roboto / One UI font via scenario.androidFont). IG Android
 *    renders "semibold" usernames as bold (700). Message text 15sp / 20sp line.
 *  - Bubble 12dp × 9dp padding → 38dp single line (fully round pill), 4dp on the
 *    joined side of a group, 2dp gap inside a group, 10dp between senders.
 *  - 28dp avatar beside the LAST incoming bubble of a run; 8dp gutter.
 *  - Composer: 44dp filled pill (secondary background), 34dp camera disc in the
 *    theme blue, "Message..." placeholder, mic / gallery / sticker / "+" 24dp.
 *  - Entrance: Material "emphasized decelerate" curve (0.05, 0.7, 0.1, 1),
 *    bubble rises 14dp and scales 94 % → 100 % from its outer-bottom corner.
 *    https://m3.material.io/styles/motion/easing-and-duration/tokens-specs
 *
 * Reactions / replies / compose typing (same IG design on both OSes, dp metrics):
 *  - Reaction: emoji 15sp in a 26dp incoming-grey pill with a 2dp canvas ring,
 *    overlapping the bubble's bottom by 7dp, 10dp in from its outer side.
 *  - Reply: 12sp label ("You replied to Khalid" / "Replied to you"; ar
 *    "قمت بالرد على خالد" / "قام بالرد عليك"), muted 14/18 quoted bubble (2
 *    lines max; photo thumbnail / "Voice message") beside a 3dp rail on the
 *    screen-edge side, then the reply bubble.
 *  - Draft: text in the pill with a 2dp accent caret (500ms on / 500ms off),
 *    pill grows up to 5 lines, camera disc stays, the trailing icons give way
 *    to the bold accent "Send" text (ar "إرسال").
 *
 * Round 5 — same IG design as iOS in dp: stacked default group picture, group
 * name + member list subtitle, grey sender name above each member's run and
 * the avatar beside its last bubble, "Seen by everyone"; sticker (no bubble),
 * location map card (pin / live avatar), file bubble ("2 pages · 245 KB ·
 * PDF"), call bubble ("Video chat ended · 4:12" / "Missed audio call · Call
 * back"), centred "You unsent a message" line, "Edited" above the bubble,
 * underlined URLs + joined link card, and the keyboard inset (padding-bottom
 * = inset with the keyboard's transition; the 3-button bar hides itself).
 *
 * Behaviour: no per-message times — a centred 12sp secondary-text timestamp
 * ("Today 10:41") at the top and after ≥1h of silence. Under your newest message
 * only: "Sent" until read, then "Seen" (Instagram has no "Delivered" stage).
 * Typing = grey bubble with three pulsing dots + avatar in the thread (the
 * header keeps "Active now"). Emoji-only messages (1-3) render large with no
 * bubble; photos render without a bubble, a caption follows as its own bubble.
 * Phone / video / sticker / play glyphs do not mirror in Arabic; the back arrow
 * does.
 */

import { Fragment, useCallback, useEffect, useLayoutEffect, useRef, type CSSProperties, type ReactNode } from "react";

import type { CallEntry, FileShare, GroupChat, LinkPreview, LocationShare, Message, Person } from "../../types";
import { Avatar, dirOf, SystemBottomBar, useChatScroll } from "../shared";
import { useKeyboardInset } from "../devices/keyboard-context";
import { SamsungStatusBar } from "../devices/SamsungStatusBar";
import type { Lang } from "./chrome";
import type { PlatformMotion, PlatformProps } from "./types";

/* ------------------------------ tokens ------------------------------ */

/** Default-theme gradient, top of the visible thread → bottom. */
const OUT_GRADIENT = "linear-gradient(180deg, #a033ea 0%, #7a3cf4 46%, #4a5df9 100%)";
/** Solid fallback before the first paint (bottom of the screen colour). */
const OUT_SOLID = "#4a5df9";
const ACCENT = "#4a5df9";
const ACTIVE_GREEN = "#78de45";
/** Composer camera disc (dp). */
const CAMERA = 34;

interface Pal {
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

function palette(dark: boolean): Pal {
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

/** Instagram's own wording (en / ar builds of the app). */
const STR: Record<Lang, {
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
  /* group threads */
  nameRepliedToYou: (name: string) => string;
  nameRepliedTo: (name: string, to: string) => string;
  nameRepliedSelf: (name: string) => string;
  seenByAll: string;
  members: (n: number) => string;
  joinNames: string;
  /* round 5 message kinds */
  edited: string;
  youUnsent: string;
  nameUnsent: (name: string) => string;
  videoEnded: string;
  audioEnded: string;
  missedVideo: string;
  missedAudio: string;
  callBack: string;
  callAgain: string;
  liveLocation: string;
  liveSub: string;
}> = {
  en: {
    activeNow: "Active now",
    message: "Message...",
    seen: "Seen",
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
    nameRepliedToYou: (name) => `${name} replied to you`,
    nameRepliedTo: (name, to) => `${name} replied to ${to}`,
    nameRepliedSelf: (name) => `${name} replied to themselves`,
    seenByAll: "Seen by everyone",
    members: (n) => `${n} members`,
    joinNames: ", ",
    edited: "Edited",
    youUnsent: "You unsent a message",
    nameUnsent: (name) => `${name} unsent a message`,
    videoEnded: "Video chat ended",
    audioEnded: "Audio call ended",
    missedVideo: "Missed video chat",
    missedAudio: "Missed audio call",
    callBack: "Call back",
    callAgain: "Call again",
    liveLocation: "Live location",
    liveSub: "Sharing for 1 hour",
  },
  ar: {
    activeNow: "نشط الآن",
    message: "مراسلة...",
    seen: "تمت المشاهدة",
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
    nameRepliedToYou: (name) => `قام ${name} بالرد عليك`,
    nameRepliedTo: (name, to) => `قام ${name} بالرد على ${to}`,
    nameRepliedSelf: (name) => `قام ${name} بالرد على نفسه`,
    seenByAll: "شاهدها الجميع",
    members: (n) => `${n} أعضاء`,
    joinNames: "، ",
    edited: "تم التعديل",
    youUnsent: "ألغيت إرسال رسالة",
    nameUnsent: (name) => `تم إلغاء إرسال رسالة من ${name}`,
    videoEnded: "انتهت محادثة الفيديو",
    audioEnded: "انتهت المكالمة الصوتية",
    missedVideo: "محادثة فيديو فائتة",
    missedAudio: "مكالمة صوتية فائتة",
    callBack: "معاودة الاتصال",
    callAgain: "الاتصال مرة أخرى",
    liveLocation: "الموقع المباشر",
    liveSub: "تتم المشاركة لمدة ساعة",
  },
};

/* Metrics (dp at 360dp width). */
const M = {
  text: 15,
  line: 20,
  padX: 12,
  padY: 9,
  radius: 19,
  joined: 4,
  imgRadius: 18,
  imgWidth: 224,
  maxW: "min(72%, 250px)",
  inAvatar: 28,
  bodyX: 12,
  groupGap: 2,
  senderGap: 10,
  headerH: 56,
  headerAvatar: 32,
  composerH: 44,
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

const ENTER_MS = 300;
const ENTER_EASE_CSS = "cubic-bezier(0.05, 0.7, 0.1, 1)";
const enterEase = bezier(0.05, 0.7, 0.1, 1);
const RISE = 14;
const FROM_SCALE = 0.94;

function originOf(mine: boolean, rtl: boolean): string {
  const right = mine ? !rtl : rtl;
  return right ? "right bottom" : "left bottom";
}

export const instagramAndroidMotion: PlatformMotion = {
  enterMs: ENTER_MS,
  enterStyle: (p, mine, rtl) => {
    const e = enterEase(p);
    return {
      opacity: e,
      transform: `translateY(${(1 - e) * RISE}px) scale(${FROM_SCALE + (1 - FROM_SCALE) * e})`,
      transformOrigin: originOf(mine, rtl),
    };
  },
};

/** Android TextView cursor blink: 500ms on, 500ms off (solid while keys land). */
const CARET_MS = 1000;
/** The composer grows up to this many lines, then scrolls inside. */
const DRAFT_LINES = 5;

const TYPING_CYCLE = 1200;
const TYPING_STAGGER = 0.15; // fraction of the cycle between dots

/** Same piecewise-linear curve as the `ig-and-dot` keyframes below. */
function dotAt(phase: number): { opacity: number; y: number } {
  const f = ((phase % 1) + 1) % 1;
  // 0 → .3 rise, .3 → .6 fall, .6 → 1 rest
  let k = 0;
  if (f < 0.3) k = f / 0.3;
  else if (f < 0.6) k = 1 - (f - 0.3) / 0.3;
  return { opacity: 0.4 + 0.6 * k, y: -2.5 * k };
}

const KEYFRAMES = `
@keyframes ig-and-enter {
  from { opacity: 0; transform: translateY(${RISE}px) scale(${FROM_SCALE}); }
  to { opacity: 1; transform: none; }
}
@keyframes ig-and-typing-in {
  from { opacity: 0; transform: scale(0.6); }
  to { opacity: 1; transform: none; }
}
@keyframes ig-and-fade {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes ig-and-dot {
  0% { opacity: 0.4; transform: translateY(0); }
  30% { opacity: 1; transform: translateY(-2.5px); }
  60% { opacity: 0.4; transform: translateY(0); }
  100% { opacity: 0.4; transform: translateY(0); }
}
.ig-and-enter { animation: ig-and-enter ${ENTER_MS}ms ${ENTER_EASE_CSS} both; }
.ig-and-typing-in { animation: ig-and-typing-in 220ms ${ENTER_EASE_CSS} both; transform-origin: left bottom; }
[dir="rtl"] .ig-and-typing-in { transform-origin: right bottom; }
.ig-and-fade { animation: ig-and-fade 200ms ease-out both; }
.ig-and-dot { animation: ig-and-dot ${TYPING_CYCLE}ms linear infinite; }
@keyframes ig-and-caret {
  0%, 50% { opacity: 1; }
  50.01%, 100% { opacity: 0; }
}
.ig-and-caret { animation: ig-and-caret ${CARET_MS}ms step-end infinite; animation-delay: ${CARET_MS / 2}ms; }
`;

/* ------------------------------- icons ------------------------------ */

/** Instagram's Android back arrow (stemmed), mirrors in RTL. */
function BackArrow({ color }: { color: string }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="shrink-0 rtl:-scale-x-100">
      <path d="M21 12H3.6M10.8 4.6 3.4 12l7.4 7.4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path
        d="M18.6 21.6c-4.1 0-8.5-2.5-11.7-5.6C3.8 12.9 1.6 8.7 2.4 5.2c.2-.9.8-1.6 1.6-2.1l1.3-.8c.9-.5 2-.3 2.6.5l2.1 3c.6.8.5 1.9-.2 2.6l-1 1c.6 1.4 1.4 2.6 2.4 3.6 1 1 2.2 1.8 3.6 2.4l1-1c.7-.7 1.8-.8 2.6-.2l3 2.1c.8.6 1 1.7.5 2.6l-.8 1.3c-.5.8-1.2 1.4-2.1 1.6-.4.1-.9.1-1.3.1Z"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function VideoIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
      <rect x="1.8" y="5.2" width="14.4" height="13.6" rx="3.6" stroke="currentColor" strokeWidth="1.8" />
      <path d="M16.2 10.1 21 7.3c.5-.3 1.2.1 1.2.7v8c0 .6-.7 1-1.2.7l-4.8-2.8" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}

function CameraGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path
        fillRule="evenodd"
        fill="#ffffff"
        d="M9.3 3.8h5.4c.6 0 1.1.3 1.4.8l1 1.6H19a3 3 0 0 1 3 3v8.6a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3V9.2a3 3 0 0 1 3-3h1.9l1-1.6c.3-.5.8-.8 1.4-.8ZM12 9a4.2 4.2 0 1 0 0 8.4A4.2 4.2 0 0 0 12 9Zm0 2a2.2 2.2 0 1 1 0 4.4 2.2 2.2 0 0 1 0-4.4Z"
      />
    </svg>
  );
}

function MicIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <rect x="8.6" y="2.2" width="6.8" height="12" rx="3.4" />
      <path d="M5.2 10.8a6.8 6.8 0 0 0 13.6 0M12 17.6v4" />
    </svg>
  );
}

function GalleryIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round">
      <rect x="2.4" y="2.4" width="19.2" height="19.2" rx="5" />
      <circle cx="8.4" cy="8.4" r="1.6" fill="currentColor" stroke="none" />
      <path d="M2.8 17.2 7.4 12.6a1.6 1.6 0 0 1 2.2 0l7 7M14.2 15.6l1.6-1.6a1.6 1.6 0 0 1 2.2 0l3.4 3.4" />
    </svg>
  );
}

function StickerIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round">
      <path d="M15.4 21.6H7.4a5 5 0 0 1-5-5V7.4a5 5 0 0 1 5-5h9.2a5 5 0 0 1 5 5v8l-6.2 6.2Z" />
      <path d="M15.4 21.6v-2.8a3.4 3.4 0 0 1 3.4-3.4h2.8" />
      <circle cx="8.9" cy="9.4" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="15.1" cy="9.4" r="1.1" fill="currentColor" stroke="none" />
      <path d="M8.4 13.6c.9 1.1 2.1 1.7 3.6 1.7" />
    </svg>
  );
}

function PlusCircleIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <circle cx="12" cy="12" r="9.8" />
      <path d="M12 7.6v8.8M7.6 12h8.8" />
    </svg>
  );
}

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

/** Instagram drops a centred timestamp at the top and after ≥1h of silence. */
function needsSeparator(messages: Message[], i: number): boolean {
  if (i === 0) return true;
  const a = minutesOf(messages[i - 1].time);
  const b = minutesOf(messages[i].time);
  if (a == null || b == null) return false;
  return b - a >= 60 || b < a;
}

function handleOf(p: Person): string {
  return p.name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9._]/g, "");
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
  if (m.type === "text") return !m.link && bigEmoji(m.text) ? "emoji" : "text";
  return m.type;
}

type Corners = Pick<CSSProperties, "borderTopLeftRadius" | "borderTopRightRadius" | "borderBottomLeftRadius" | "borderBottomRightRadius">;

/** Joined-side corners shrink inside a group (Messenger/Instagram style). */
function cornersFor(onRight: boolean, joinedAbove: boolean, joinedBelow: boolean, r: number): Corners {
  const top = joinedAbove ? M.joined : r;
  const bottom = joinedBelow ? M.joined : r;
  return onRight
    ? { borderTopLeftRadius: r, borderBottomLeftRadius: r, borderTopRightRadius: top, borderBottomRightRadius: bottom }
    : { borderTopRightRadius: r, borderBottomRightRadius: r, borderTopLeftRadius: top, borderBottomLeftRadius: bottom };
}

/** Untransformed offset of `el` from the top of `root`'s content. */
function offsetWithin(el: HTMLElement, root: HTMLElement): number {
  let y = 0;
  let n: HTMLElement | null = el;
  while (n && n !== root) {
    y += n.offsetTop;
    const parent = n.offsetParent as HTMLElement | null;
    if (parent && parent !== root && !root.contains(parent)) {
      // root is not in the chain (should not happen: root is position:relative)
      return y - root.offsetTop;
    }
    n = parent;
  }
  return y;
}

/* ---------------------------- sub-views ----------------------------- */

const WAVE = [5, 9, 14, 8, 18, 12, 7, 15, 20, 11, 6, 13, 17, 9, 5, 12, 16, 8, 14, 10, 6, 11, 15, 7, 4, 9, 6];

function VoiceContent({ mine, pal, duration }: { mine: boolean; pal: Pal; duration?: string }) {
  const ink = mine ? "#ffffff" : pal.fg;
  return (
    <div dir="ltr" className="flex items-center" style={{ width: 188, height: M.line, gap: 10 }}>
      <svg width="16" height="16" viewBox="0 0 24 24" className="shrink-0">
        <path d="M6.5 4.4v15.2c0 1 1.1 1.6 1.9 1.1l12-7.6c.8-.5.8-1.7 0-2.2l-12-7.6c-.8-.5-1.9.1-1.9 1.1Z" fill={ink} />
      </svg>
      <div className="flex flex-1 items-center justify-between" style={{ height: 20 }}>
        {WAVE.map((b, i) => (
          <span key={i} style={{ width: 2.4, height: b, borderRadius: 2, background: ink }} />
        ))}
      </div>
      <span className="shrink-0 tabular-nums" style={{ fontSize: 13, lineHeight: "16px", color: ink }}>
        {duration ?? "0:08"}
      </span>
    </div>
  );
}

function TypingRow({ person, pal, animate, clockMs }: { person: Person; pal: Pal; animate: boolean; clockMs?: number }) {
  return (
    <div className="flex items-end" style={{ marginTop: M.senderGap, gap: 8 }}>
      <div className="shrink-0" style={{ width: M.inAvatar }}>
        <Avatar person={person} size={M.inAvatar} />
      </div>
      <div
        className={`flex items-center ${animate ? "ig-and-typing-in" : ""}`}
        style={{ background: pal.inBubble, borderRadius: M.radius, height: M.line + M.padY * 2, padding: "0 15px", gap: 4 }}
      >
        {[0, 1, 2].map((i) => {
          const st = clockMs !== undefined ? dotAt(clockMs / TYPING_CYCLE - i * TYPING_STAGGER) : null;
          return (
            <span
              key={i}
              className={`inline-block rounded-full ${st ? "" : "ig-and-dot"}`}
              style={{
                width: 7,
                height: 7,
                background: pal.dots,
                ...(st
                  ? { opacity: st.opacity, transform: `translateY(${st.y}px)` }
                  : { animationDelay: `${i * TYPING_STAGGER * TYPING_CYCLE}ms` }),
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

/* ----------------------- reactions + replies ------------------------ */

/** Reaction pill: hangs 18dp below the bubble, overlapping its bottom edge by 6dp. */
const REACT = { h: 26, overlap: 7, inset: 10, border: 2 } as const;

/**
 * Instagram reaction: the emoji in a small incoming-grey pill with a 2dp
 * canvas-coloured ring, tucked under the bubble's outer (screen-edge) bottom
 * corner. One reactor in a 1:1 thread → no count.
 */
function ReactionPill({ emoji, pal, mine }: { emoji: string; pal: Pal; mine: boolean }) {
  return (
    <div
      className="relative z-[1] flex"
      style={{ marginTop: -REACT.overlap, [mine ? "marginInlineEnd" : "marginInlineStart"]: REACT.inset }}
    >
      <span
        dir="ltr"
        className="flex items-center justify-center"
        style={{
          height: REACT.h,
          minWidth: REACT.h,
          padding: "0 4px",
          boxSizing: "border-box",
          borderRadius: REACT.h / 2,
          border: `${REACT.border}px solid ${pal.bg}`,
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

function MicSmall() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" className="shrink-0">
      <rect x="8.5" y="2" width="7" height="12" rx="3.5" />
      <path d="M5 10.8a7 7 0 0 0 14 0M12 18v3.6" />
    </svg>
  );
}

/**
 * Quoted reply, Instagram style: a 12sp secondary label ("You replied to
 * Khalid" / "Replied to you"), then the original as a smaller, muted bubble
 * (14/18, two lines max) beside a 3dp rounded rail on the screen-edge side,
 * then the reply bubble 4dp below.
 */
function ReplyQuote({
  target,
  mine,
  pal,
  s,
  themName,
  targetName,
  group,
}: {
  target: Message;
  mine: boolean;
  pal: Pal;
  s: (typeof STR)[Lang];
  /** author of the reply (a "them" reply) */
  themName: string;
  /** author of the quoted message when it is a "them" message */
  targetName: string;
  group: boolean;
}) {
  const label = mine
    ? target.sender === "me"
      ? s.youRepliedSelf
      : s.youRepliedTo(targetName)
    : target.sender === "me"
      ? group
        ? s.nameRepliedToYou(themName)
        : s.repliedToYou
      : group
        ? targetName === themName
          ? s.nameRepliedSelf(themName)
          : s.nameRepliedTo(themName, targetName)
        : s.repliedSelf;
  const targetMine = target.sender === "me";

  let quote: ReactNode;
  if (target.type === "image") {
    quote = (
      <div className="shrink-0 overflow-hidden" style={{ width: 92, height: 122, borderRadius: 14, background: pal.imgPlaceholder, opacity: 0.7 }}>
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
    const text = isVoice ? s.voiceMessage : quoteText(target, s);
    quote = (
      <div
        className="min-w-0"
        style={{
          borderRadius: 18,
          padding: "7px 12px",
          background: targetMine ? OUT_SOLID : pal.inBubble,
          opacity: targetMine ? 0.5 : 1,
          color: targetMine ? "#ffffff" : pal.sub,
        }}
      >
        <div
          dir={isVoice ? undefined : dirOf(text)}
          className={isVoice ? "flex items-center gap-1" : "line-clamp-2 whitespace-pre-wrap break-words"}
          style={{ fontSize: 14, lineHeight: "18px", textAlign: "start" }}
        >
          {isVoice && <MicSmall />}
          {text}
        </div>
      </div>
    );
  }

  const rail = <span className="shrink-0 self-stretch" style={{ width: 3, borderRadius: 2, background: pal.rail }} />;

  return (
    <div className={`flex min-w-0 flex-col ${mine ? "items-end" : "items-start"}`} style={{ marginBottom: 4, maxWidth: "100%" }}>
      <div className="max-w-full truncate" style={{ fontSize: 12, lineHeight: "16px", color: pal.sub, marginBottom: 4, paddingInline: 4, textAlign: "start" }}>
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

/* ------------------- groups + round 5 message kinds ------------------ */

/** IGDS destructive red (missed-call glyph, location pin). */
const RED = "#ff3040";

type Str = (typeof STR)[Lang];

function callTitle(c: CallEntry | null | undefined, s: Str): string {
  if (c?.missed) return c.video ? s.missedVideo : s.missedAudio;
  return c?.video ? s.videoEnded : s.audioEnded;
}

/** One-line description of a message for a reply quote. */
function quoteText(m: Message, s: Str): string {
  if (m.type === "location") return m.location?.live ? s.liveLocation : (m.location?.title ?? "");
  if (m.type === "file") return m.file?.name ?? "";
  if (m.type === "call") return callTitle(m.call, s);
  return m.text;
}

const URL_RE = /((?:https?:\/\/|www\.)[^\s]+)/i;

/** Message text with URLs underlined in the bubble's own ink (as Instagram draws links). */
function RichText({ text }: { text: string }) {
  const parts = text.split(URL_RE);
  return (
    <>
      {parts.map((p, i) =>
        i % 2 ? (
          <span key={i} dir="ltr" style={{ textDecoration: "underline", textUnderlineOffset: 2, overflowWrap: "anywhere" }}>
            {p}
          </span>
        ) : (
          <Fragment key={i}>{p}</Fragment>
        ),
      )}
    </>
  );
}

/**
 * Instagram's default group picture: two member photos stacked diagonally —
 * the second member top-trailing, the first bottom-leading over it with a
 * canvas-coloured ring. An uploaded group photo replaces it.
 */
function GroupAvatar({ group, size, ring }: { group: GroupChat; size: number; ring: string }) {
  if (group.avatar) return <Avatar person={{ name: group.name, avatar: group.avatar }} size={size} />;
  const a = group.members[0] ?? { name: group.name, avatar: null };
  const b = group.members[1] ?? a;
  const d = Math.round(size * 0.74);
  const rw = Math.max(1.5, Math.round(size / 20));
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <div className="absolute" style={{ top: 0, insetInlineEnd: 0 }}>
        <Avatar person={b} size={d} />
      </div>
      <div className="absolute rounded-full" style={{ bottom: -rw, insetInlineStart: -rw, padding: rw, background: ring }}>
        <Avatar person={a} size={d} />
      </div>
    </div>
  );
}

/** Plausible street map tile (Google-Maps-like light / dark palette) with a pin or a live avatar. */
function MapTile({ dark, live, person, height }: { dark: boolean; live: boolean; person: Person; height: number }) {
  const c = dark
    ? { land: "#212529", block: "#292e34", road: "#3a4047", main: "#5a5136", park: "#1d3527", water: "#17263a", label: "#7c848e" }
    : { land: "#f1f3f4", block: "#e8eaed", road: "#ffffff", main: "#fcd581", park: "#ceead6", water: "#aadaff", label: "#9aa0a6" };
  return (
    <div className="relative" style={{ height }}>
      <svg width="100%" height={height} viewBox="0 0 236 140" preserveAspectRatio="xMidYMid slice" className="block">
        <rect width="236" height="140" fill={c.land} />
        <path d="M0 108c30-6 52 4 80 2s40 12 46 32H0Z" fill={c.water} />
        <rect x="150" y="6" width="56" height="34" rx="3" fill={c.park} />
        <rect x="12" y="10" width="44" height="30" rx="2" fill={c.block} />
        <rect x="70" y="10" width="64" height="30" rx="2" fill={c.block} />
        <rect x="12" y="54" width="44" height="34" rx="2" fill={c.block} />
        <rect x="160" y="58" width="62" height="36" rx="2" fill={c.block} />
        <g stroke={c.road} strokeLinecap="round" fill="none">
          <path d="M-4 47h244M-4 98h244M63 -4v148M142 -4v148M214 -4v148" strokeWidth="5" />
          <path d="M-4 22h70M142 76h100M100 47v60" strokeWidth="3" />
        </g>
        <path d="M-6 132 242 18" stroke={c.main} strokeWidth="8" strokeLinecap="round" />
        <path d="M176 116h22M182 121h14" stroke={c.label} strokeWidth="1.6" strokeLinecap="round" opacity="0.55" />
      </svg>
      {live ? (
        <div className="absolute" style={{ left: "50%", top: "50%", transform: "translate(-50%, -50%)" }}>
          <span className="absolute rounded-full" style={{ inset: -12, background: "rgba(74,93,249,0.22)" }} />
          <span className="relative block rounded-full" style={{ padding: 2, background: "#ffffff" }}>
            <Avatar person={person} size={30} />
          </span>
        </div>
      ) : (
        <svg width="30" height="38" viewBox="0 0 30 38" className="absolute" style={{ left: "50%", top: "50%", transform: "translate(-50%, -88%)" }}>
          <ellipse cx="15" cy="35.5" rx="5" ry="1.8" fill="rgba(0,0,0,0.25)" />
          <path d="M15 1C7.3 1 2 6.6 2 13.6 2 23.2 15 35 15 35s13-11.8 13-21.4C28 6.6 22.7 1 15 1Z" fill={RED} stroke="#ffffff" strokeWidth="1.6" />
          <circle cx="15" cy="13.6" r="4.6" fill="#ffffff" />
        </svg>
      )}
    </div>
  );
}

function LocationCard({
  loc,
  pal,
  dark,
  person,
  corners,
  s,
}: {
  loc: LocationShare;
  pal: Pal;
  dark: boolean;
  person: Person;
  corners: Corners;
  s: Str;
}) {
  const title = loc.live ? s.liveLocation : loc.title;
  const sub = loc.live ? (loc.subtitle ?? s.liveSub) : loc.subtitle;
  return (
    <div className="overflow-hidden" style={{ ...corners, width: M.imgWidth, background: pal.inBubble }}>
      <MapTile dark={dark} live={!!loc.live} person={person} height={134} />
      <div style={{ padding: "8px 12px 10px" }}>
        <div className="truncate" dir="auto" style={{ fontSize: 15, lineHeight: "20px", fontWeight: 700, color: pal.fg, textAlign: "start" }}>
          {title}
        </div>
        {sub && (
          <div className="truncate" dir="auto" style={{ fontSize: 13, lineHeight: "17px", color: pal.sub, textAlign: "start" }}>
            {sub}
          </div>
        )}
      </div>
    </div>
  );
}

const EXT_COLOR: Record<string, string> = {
  PDF: "#e5252a",
  DOC: "#2b579a",
  DOCX: "#2b579a",
  XLS: "#217346",
  XLSX: "#217346",
  CSV: "#217346",
  PPT: "#d24726",
  PPTX: "#d24726",
  ZIP: "#8e959e",
};

/** Document glyph: white page, folded corner, coloured type band. */
function DocIcon({ ext }: { ext: string }) {
  const color = EXT_COLOR[ext] ?? "#6a717a";
  return (
    <svg width="32" height="38" viewBox="0 0 34 40" className="shrink-0">
      <path d="M4 1h18l11 11v25a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2Z" fill="#ffffff" stroke="rgba(0,0,0,0.12)" />
      <path d="M22 1v9a2 2 0 0 0 2 2h9" fill="#e9ecef" stroke="rgba(0,0,0,0.12)" />
      <rect x="0" y="20" width="27" height="12" rx="2" fill={color} />
      <text x="13.5" y="29.2" textAnchor="middle" fontSize="7.6" fontWeight="700" fill="#ffffff" fontFamily="Roboto, system-ui, sans-serif">
        {(ext || "FILE").slice(0, 4)}
      </text>
    </svg>
  );
}

function FileBody({ file, mine, pal }: { file: FileShare; mine: boolean; pal: Pal }) {
  const ext = file.name.includes(".") ? (file.name.split(".").pop() ?? "").toUpperCase() : "";
  // each part isolated so "صفحتان · 245 KB · PDF" keeps its order in the Arabic UI
  const parts = [file.pages, file.size, ext].filter((v): v is string => !!v);
  return (
    <div className="flex items-center" style={{ gap: 10, width: 204 }}>
      <DocIcon ext={ext} />
      <div className="min-w-0 flex-1">
        <div className="truncate" dir="ltr" style={{ fontSize: 15, lineHeight: "20px", fontWeight: 700, textAlign: "start" }}>
          {file.name}
        </div>
        {parts.length > 0 && (
          <div className="truncate" style={{ fontSize: 13, lineHeight: "17px", color: mine ? "rgba(255,255,255,0.78)" : pal.sub, textAlign: "start" }}>
            {parts.map((p, i) => (
              <Fragment key={i}>
                {i > 0 && " · "}
                <bdi>{p}</bdi>
              </Fragment>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CallBody({ call, mine, pal, s }: { call: CallEntry; mine: boolean; pal: Pal; s: Str }) {
  const ink = call.missed ? RED : pal.fg;
  const sub = call.missed ? (mine ? s.callAgain : s.callBack) : (call.duration ?? "");
  return (
    <div className="flex items-center" style={{ gap: 10, minWidth: 170 }}>
      <span className="flex shrink-0 items-center justify-center rounded-full" style={{ width: 36, height: 36, background: pal.rail, color: ink }}>
        {call.video ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <rect x="1.8" y="5.2" width="14.4" height="13.6" rx="3.6" stroke="currentColor" strokeWidth="2" />
            <path d="M16.2 10.1 21 7.3c.5-.3 1.2.1 1.2.7v8c0 .6-.7 1-1.2.7l-4.8-2.8" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path
              d="M18.6 21.6c-4.1 0-8.5-2.5-11.7-5.6C3.8 12.9 1.6 8.7 2.4 5.2c.2-.9.8-1.6 1.6-2.1l1.3-.8c.9-.5 2-.3 2.6.5l2.1 3c.6.8.5 1.9-.2 2.6l-1 1c.6 1.4 1.4 2.6 2.4 3.6 1 1 2.2 1.8 3.6 2.4l1-1c.7-.7 1.8-.8 2.6-.2l3 2.1c.8.6 1 1.7.5 2.6l-.8 1.3c-.5.8-1.2 1.4-2.1 1.6-.4.1-.9.1-1.3.1Z"
              stroke="currentColor"
              strokeWidth="2.1"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </span>
      <div className="min-w-0">
        <div style={{ fontSize: 15, lineHeight: "20px", fontWeight: 700, textAlign: "start" }}>{callTitle(call, s)}</div>
        {sub && (
          <div style={{ fontSize: 13, lineHeight: "17px", color: pal.sub, textAlign: "start" }}>
            <bdi>{sub}</bdi>
          </div>
        )}
      </div>
    </div>
  );
}

function LinkCard({ link, pal, corners }: { link: LinkPreview; pal: Pal; corners: Corners }) {
  let site = link.siteName?.trim();
  if (!site) {
    try {
      site = new URL(link.url).hostname.replace(/^www\./, "");
    } catch {
      site = link.url;
    }
  }
  return (
    <div className="overflow-hidden" style={{ ...corners, width: M.imgWidth, background: pal.inBubble, color: pal.fg }}>
      {link.image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={link.image} alt="" draggable={false} className="block w-full object-cover" style={{ height: 118 }} />
      )}
      <div style={{ padding: "8px 12px 10px" }}>
        <div className="line-clamp-2" dir="auto" style={{ fontSize: 15, lineHeight: "20px", fontWeight: 700, textAlign: "start" }}>
          {link.title}
        </div>
        {link.description && (
          <div className="line-clamp-2" dir="auto" style={{ marginTop: 1, fontSize: 13, lineHeight: "17px", color: pal.sub, textAlign: "start" }}>
            {link.description}
          </div>
        )}
        <div className="truncate" dir="ltr" style={{ marginTop: 2, fontSize: 13, lineHeight: "17px", color: pal.sub, textAlign: "start" }}>
          {site}
        </div>
      </div>
    </div>
  );
}

/** Sticker: no bubble — an uploaded sticker image, or 1–3 emoji drawn sticker-sized. */
function StickerView({ m }: { m: Message }) {
  if (m.imageSrc) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={m.imageSrc} alt="" draggable={false} className="block object-contain" style={{ width: 124, height: 124 }} />
    );
  }
  const t = m.text.trim() || "🙂";
  let n = 1;
  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    n = Array.from(new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(t.replace(/\s+/g, ""))).length;
  }
  const size = n <= 1 ? 90 : n === 2 ? 64 : 50;
  return (
    <div dir="ltr" style={{ fontSize: size, lineHeight: `${Math.round(size * 1.22)}px`, padding: "0 2px" }}>
      {t}
    </div>
  );
}

/* ------------------------------ thread ------------------------------ */

export function InstagramAndroid({ scenario, playback, lang, rtl }: PlatformProps) {
  const dark = scenario.theme === "dark";
  const pal = palette(dark);
  const s = STR[lang];
  const { messages, typing, clockMs } = playback;
  const live = playback.isLive && clockMs === undefined;
  const showTyping = typing || (!playback.isLive && clockMs === undefined && scenario.presence === "typing");
  const scrollRef = useChatScroll<HTMLDivElement>(`${messages.length}-${showTyping}`);

  /* Screen-anchored gradient: each outgoing bubble shows the slice of the
     gradient that sits behind it in the viewport, re-sliced on every scroll.
     Uses untransformed layout offsets so entrance transforms don't skew it. */
  const paint = useCallback(() => {
    const root = scrollRef.current;
    if (!root) return;
    const h = root.clientHeight;
    if (!h) return;
    root.querySelectorAll<HTMLElement>("[data-ig-out]").forEach((el) => {
      const bh = el.offsetHeight;
      const top = offsetWithin(el, root) - root.scrollTop;
      const off = Math.min(Math.max(top, 0), Math.max(h - bh, 0));
      el.style.backgroundImage = OUT_GRADIENT;
      el.style.backgroundRepeat = "no-repeat";
      el.style.backgroundSize = `100% ${h}px`;
      el.style.backgroundPosition = `0 ${-off}px`;
    });
  }, [scrollRef]);

  useLayoutEffect(() => {
    paint();
  });
  /* Keep the newest message pinned above the composer while it grows with a
     multi-line draft (adjustResize keeps the list anchored to its bottom). */
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
    if (root.firstElementChild) ro.observe(root.firstElementChild);
    return () => ro.disconnect();
  }, [paint, scrollRef]);

  const byId = new Map(messages.map((m) => [m.id, m] as const));
  /** the earlier message this one quotes (nothing when it is missing / not yet shown) */
  const targetOf = (m: Message | undefined): Message | undefined =>
    m?.replyToId ? byId.get(m.replyToId) : undefined;

  const draft = playback.draft;
  const exporting = clockMs !== undefined;
  const caretOn = exporting ? clockMs % CARET_MS < CARET_MS / 2 : true;

  /* OS keyboard (adjustResize): the composer sits directly on it and the thread shrinks. */
  const { inset: kbInset, transition: kbTransition } = useKeyboardInset();

  /* Group threads: "them" messages belong to a member (authorIndex). */
  const group = scenario.group ?? null;
  const authorOf = (m: Message | undefined): Person =>
    group ? (group.members[m?.authorIndex ?? 0] ?? group.members[0] ?? scenario.them) : scenario.them;
  const keyOf = (m: Message) => (m.sender === "me" ? "me" : group ? `t${m.authorIndex ?? 0}` : "t");
  /** a run = consecutive messages of one author, cut by a time separator or a system line */
  const newRun = (i: number) =>
    i === 0 ||
    needsSeparator(messages, i) ||
    keyOf(messages[i - 1]) !== keyOf(messages[i]) ||
    messages[i - 1].type === "deleted" ||
    messages[i].type === "deleted";
  /** a block also breaks at a quoted reply or an "Edited" label (they sit between bubbles) */
  const newBlock = (i: number) => newRun(i) || !!targetOf(messages[i]) || !!messages[i].edited;

  const last = messages[messages.length - 1];
  const receipt =
    last && last.sender === "me" ? (playback.statusOf(last) === "read" ? (group ? s.seenByAll : s.seen) : s.sent) : null;

  /* who is typing: the author of the upcoming "them" message, else the last one who spoke */
  const upcoming = scenario.messages[messages.length];
  const typer = authorOf(
    upcoming?.sender === "them" ? upcoming : [...messages].reverse().find((m) => m.sender === "them"),
  );

  const active = !group && scenario.presence !== "lastseen";
  const handle = handleOf(scenario.them);
  const subtitle = group
    ? group.members.map((p) => p.name).join(s.joinNames)
    : active
      ? s.activeNow
      : scenario.lastSeenText || handle;

  const kinds = messages.map(kindOf);
  /** bubble-like kinds join their neighbours' corners; big emoji / stickers / system lines break the run */
  const joins = (a: Kind | undefined, b: Kind | undefined) =>
    !!a && !!b && ![a, b].some((k) => k === "emoji" || k === "sticker" || k === "deleted");

  return (
    <div
      className="flex h-full w-full flex-col"
      style={{ background: pal.bg, color: pal.fg, paddingBottom: kbInset, transition: `padding-bottom ${kbTransition}` }}
    >
      <style>{KEYFRAMES}</style>
      <SamsungStatusBar tint={dark ? "light" : "dark"} background={pal.bg} lang={lang} />

      {/* Toolbar — 56dp */}
      <div className="flex shrink-0 items-center" style={{ height: M.headerH, paddingInlineStart: 4, paddingInlineEnd: 16, background: pal.bg }}>
        <span className="flex shrink-0 items-center justify-center" style={{ width: 48, height: 48 }}>
          <BackArrow color={pal.fg} />
        </span>
        <div className="relative shrink-0" style={{ marginInlineStart: 2 }}>
          {group ? <GroupAvatar group={group} size={M.headerAvatar} ring={pal.bg} /> : <Avatar person={scenario.them} size={M.headerAvatar} />}
          {active && (
            <span
              className="absolute rounded-full"
              style={{ width: 9, height: 9, bottom: -1, insetInlineEnd: -1, background: ACTIVE_GREEN, border: `2px solid ${pal.bg}`, boxSizing: "content-box" }}
            />
          )}
        </div>
        <div className="min-w-0 flex-1" style={{ marginInlineStart: 12 }}>
          <div className="truncate" dir="auto" style={{ fontSize: 16, lineHeight: "20px", fontWeight: 700, textAlign: "start" }}>
            {group ? group.name : scenario.them.name}
          </div>
          <div className="truncate" style={{ fontSize: 12, lineHeight: "16px", color: pal.sub, textAlign: "start" }}>
            {subtitle}
          </div>
        </div>
        <div className="flex shrink-0 items-center" style={{ gap: 22 }}>
          <PhoneIcon />
          <VideoIcon />
        </div>
      </div>

      {/* Thread */}
      <div
        ref={scrollRef}
        onScroll={onScroll}
        onAnimationEnd={paint}
        className="rcss-scroll relative min-h-0 flex-1 overflow-y-auto"
        style={{ background: pal.bg, paddingInline: M.bodyX, paddingTop: 8, paddingBottom: 10 }}
      >
        <div className="flex flex-col">
          {/* Profile intro that opens every Instagram thread */}
          <div className="flex flex-col items-center text-center" style={{ marginTop: 20, marginBottom: 28 }}>
            {group ? <GroupAvatar group={group} size={96} ring={pal.bg} /> : <Avatar person={scenario.them} size={96} />}
            <div className="max-w-full truncate" dir="auto" style={{ marginTop: 12, fontSize: 18, lineHeight: "22px", fontWeight: 700 }}>
              {group ? group.name : scenario.them.name}
            </div>
            <div style={{ marginTop: 2, fontSize: 14, lineHeight: "18px", color: pal.sub }}>
              {group ? (
                s.members(group.members.length + 1)
              ) : handle ? (
                <>
                  <span dir="ltr">{handle}</span> · {s.instagram}
                </>
              ) : (
                s.instagram
              )}
            </div>
            {!group && (
              <div
                style={{ marginTop: 14, background: pal.button, fontSize: 14, lineHeight: "18px", fontWeight: 700, padding: "7px 16px", borderRadius: 8 }}
              >
                {s.viewProfile}
              </div>
            )}
          </div>

          {messages.map((m, i) => {
            const mine = m.sender === "me";
            const onRight = mine ? !rtl : rtl;
            const kind = kinds[i];
            const sep = needsSeparator(messages, i);
            const target = targetOf(m);
            const isLast = i === messages.length - 1;
            const runStart = newRun(i);
            const runEnd = isLast || newRun(i + 1);
            // a quoted reply / "Edited" label opens a new visual block: corners are not joined across it
            const firstOfGroup = newBlock(i);
            const lastOfGroup = isLast || newBlock(i + 1);
            const reaction = m.reaction?.trim();
            const joinAbove = !firstOfGroup && joins(kinds[i - 1], kind);
            const joinBelow = !lastOfGroup && joins(kind, kinds[i + 1]);
            const author = authorOf(m);

            const caption = kind === "image" ? m.text.trim() : "";
            const marginTop = sep ? 0 : runStart || target ? M.senderGap : firstOfGroup ? 4 : M.groupGap;

            const sepEl = sep && (
              <div className="flex justify-center" style={{ margin: i === 0 ? "0 0 14px" : "18px 0 14px" }}>
                <span style={{ fontSize: 12, lineHeight: "16px", fontWeight: 500, color: pal.sub }}>
                  {s.today} <span dir="ltr">{m.time}</span>
                </span>
              </div>
            );

            /* Unsend leaves a centred secondary line in the thread ("You unsent a message"). */
            if (kind === "deleted") {
              return (
                <div key={m.id} className="contents">
                  {sepEl}
                  <div
                    data-mid={m.id}
                    data-sender={m.sender}
                    className={`flex justify-center ${live ? "ig-and-enter" : ""}`}
                    style={{ marginTop: sep ? 0 : M.senderGap, marginBottom: 2, paddingInline: 24 }}
                  >
                    <span className="text-center" style={{ fontSize: 12, lineHeight: "16px", color: pal.sub }}>
                      {mine ? s.youUnsent : s.nameUnsent(author.name)}
                    </span>
                  </div>
                </div>
              );
            }

            const bubble = (content: ReactNode, opts: { filled: boolean; corners: Corners; padding: string; extra?: CSSProperties }) => (
              <div
                {...(opts.filled ? { "data-ig-out": "" } : {})}
                style={{
                  ...opts.corners,
                  ...opts.extra,
                  backgroundColor: opts.filled ? OUT_SOLID : pal.inBubble,
                  color: opts.filled ? "#ffffff" : pal.fg,
                  padding: opts.padding,
                }}
              >
                {content}
              </div>
            );
            const textEl = (text: string) => (
              <div dir={dirOf(text)} className="whitespace-pre-wrap break-words" style={{ fontSize: M.text, lineHeight: `${M.line}px`, textAlign: "start" }}>
                <RichText text={text} />
              </div>
            );
            const textPad = `${M.padY}px ${M.padX}px`;

            let body: ReactNode;
            if (kind === "emoji") {
              body = (
                <div dir="auto" style={{ fontSize: M.emoji, lineHeight: `${M.emoji + 8}px`, paddingInline: 2 }}>
                  {m.text.trim()}
                </div>
              );
            } else if (kind === "sticker") {
              body = <StickerView m={m} />;
            } else if (kind === "image") {
              const imgCorners = cornersFor(onRight, joinAbove, !!caption || joinBelow, M.imgRadius);
              body = (
                <>
                  <div className="overflow-hidden" style={{ ...imgCorners, width: M.imgWidth, background: pal.imgPlaceholder }}>
                    {m.imageSrc ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={m.imageSrc} alt="" draggable={false} onLoad={paint} className="block w-full object-cover" style={{ maxHeight: 300 }} />
                    ) : (
                      <div className="flex items-center justify-center" style={{ height: 280 }}>
                        <ImageGlyph color={pal.sub} />
                      </div>
                    )}
                  </div>
                  {caption &&
                    bubble(textEl(caption), {
                      filled: mine,
                      corners: cornersFor(onRight, true, joinBelow, M.radius),
                      padding: textPad,
                      extra: { marginTop: M.groupGap },
                    })}
                </>
              );
            } else if (kind === "location" && m.location) {
              body = (
                <LocationCard
                  loc={m.location}
                  pal={pal}
                  dark={dark}
                  person={mine ? scenario.me : author}
                  corners={cornersFor(onRight, joinAbove, joinBelow, M.imgRadius)}
                  s={s}
                />
              );
            } else if (kind === "file") {
              body = bubble(<FileBody file={m.file ?? { name: m.text || "File" }} mine={mine} pal={pal} />, {
                filled: mine,
                corners: cornersFor(onRight, joinAbove, joinBelow, M.radius),
                padding: "10px 16px 10px 10px",
              });
            } else if (kind === "call") {
              // call entries are drawn on the neutral grey surface on both sides
              body = bubble(<CallBody call={m.call ?? { video: false, missed: false }} mine={mine} pal={pal} s={s} />, {
                filled: false,
                corners: cornersFor(onRight, joinAbove, joinBelow, M.radius),
                padding: "10px 16px 10px 10px",
              });
            } else if (kind === "voice") {
              body = bubble(<VoiceContent mine={mine} pal={pal} duration={m.voiceDuration} />, {
                filled: mine,
                corners: cornersFor(onRight, joinAbove, joinBelow, M.radius),
                padding: `${M.padY}px 14px`,
              });
            } else if (m.link) {
              // text bubble with the underlined URL, then the link card joined below it
              body = (
                <>
                  {bubble(textEl(m.text), { filled: mine, corners: cornersFor(onRight, joinAbove, true, M.radius), padding: textPad })}
                  <div style={{ marginTop: M.groupGap }}>
                    <LinkCard link={m.link} pal={pal} corners={cornersFor(onRight, true, joinBelow, M.imgRadius)} />
                  </div>
                </>
              );
            } else {
              body = bubble(textEl(m.text), {
                filled: mine,
                corners: cornersFor(onRight, joinAbove, joinBelow, M.radius),
                padding: textPad,
              });
            }

            const showName = !!group && !mine && runStart;

            return (
              <div key={m.id} className="contents">
                {sepEl}
                <div
                  data-mid={m.id}
                  data-sender={m.sender}
                  className={`flex items-end ${mine ? "justify-end" : "justify-start"} ${live ? "ig-and-enter" : ""}`}
                  style={{ marginTop, gap: 8, ...(live ? { transformOrigin: originOf(mine, rtl) } : {}) }}
                >
                  {!mine && (
                    <div className="shrink-0" style={{ width: M.inAvatar, marginBottom: reaction ? REACT.h - REACT.overlap : 0 }}>
                      {runEnd && <Avatar person={author} size={M.inAvatar} />}
                    </div>
                  )}
                  <div className={`flex min-w-0 flex-col ${mine ? "items-end" : "items-start"}`} style={{ maxWidth: M.maxW }}>
                    {showName && (
                      <div
                        className="max-w-full truncate"
                        dir="auto"
                        style={{ fontSize: 12, lineHeight: "16px", color: pal.sub, paddingInline: M.padX, marginBottom: 3, textAlign: "start" }}
                      >
                        {author.name}
                      </div>
                    )}
                    {target && (
                      <ReplyQuote
                        target={target}
                        mine={mine}
                        pal={pal}
                        s={s}
                        themName={author.name}
                        targetName={authorOf(target).name}
                        group={!!group}
                      />
                    )}
                    {m.edited && (
                      <div style={{ fontSize: 12, lineHeight: "16px", color: pal.sub, paddingInline: M.padX, marginBottom: 3 }}>{s.edited}</div>
                    )}
                    {body}
                    {reaction && <ReactionPill emoji={reaction} pal={pal} mine={mine} />}
                  </div>
                </div>
              </div>
            );
          })}

          {receipt && (
            <div
              key={`${last.id}-${receipt}`}
              className={`flex justify-end ${live ? "ig-and-fade" : ""}`}
              style={{ marginTop: 4, paddingInlineEnd: 4 }}
            >
              <span style={{ fontSize: 12, lineHeight: "16px", color: pal.sub }}>{receipt}</span>
            </div>
          )}

          {showTyping && <TypingRow person={typer} pal={pal} animate={live} clockMs={clockMs} />}
        </div>
      </div>

      {/* Composer — 44dp pill */}
      <div className="shrink-0" style={{ background: pal.bg, padding: "6px 12px 8px" }}>
        {/* The pill grows line by line with a draft (radius stays 22dp, camera
            disc and "Send" stay on the bottom row); mic/gallery/sticker/+ give
            way to the theme-coloured "Send" text button while there is text. */}
        <div
          className="flex items-end"
          style={{
            background: pal.field,
            minHeight: M.composerH,
            borderRadius: M.composerH / 2,
            padding: (M.composerH - CAMERA) / 2,
            paddingInlineEnd: draft ? 16 : 14,
          }}
        >
          <div className="flex shrink-0 items-center justify-center rounded-full" style={{ width: CAMERA, height: CAMERA, background: ACCENT }}>
            <CameraGlyph />
          </div>
          {draft ? (
            <>
              <div
                className="flex min-w-0 flex-1 flex-col justify-end overflow-hidden"
                style={{
                  marginInlineStart: 10,
                  paddingBlock: (CAMERA - M.line) / 2,
                  maxHeight: M.line * DRAFT_LINES + (CAMERA - M.line),
                }}
              >
                <div
                  dir={dirOf(draft.text)}
                  className="whitespace-pre-wrap break-words"
                  style={{ fontSize: M.text, lineHeight: `${M.line}px`, color: pal.fg, textAlign: "start" }}
                >
                  {draft.text}
                  <span
                    key={draft.text.length}
                    aria-hidden
                    className={exporting ? "" : "ig-and-caret"}
                    style={{
                      display: "inline-block",
                      width: 2,
                      height: 19,
                      marginInlineStart: 1,
                      marginInlineEnd: -3,
                      verticalAlign: -4,
                      background: ACCENT,
                      opacity: caretOn ? 1 : 0,
                    }}
                  />
                </div>
              </div>
              <span
                className="flex shrink-0 items-center"
                style={{ height: CAMERA, marginInlineStart: 12, fontSize: 15, fontWeight: 700, color: ACCENT }}
              >
                {s.send}
              </span>
            </>
          ) : (
            <>
              <span
                className="flex min-w-0 flex-1 items-center truncate"
                style={{ height: CAMERA, marginInlineStart: 10, fontSize: 15, color: pal.sub }}
              >
                {s.message}
              </span>
              <div className="flex shrink-0 items-center" style={{ height: CAMERA, gap: 14, color: pal.fg }}>
                <MicIcon />
                <GalleryIcon />
                <StickerIcon />
                <PlusCircleIcon />
              </div>
            </>
          )}
        </div>
      </div>

      <SystemBottomBar device="android" bg={pal.bg} fg={dark ? "#f8f9f9" : "#0c1014"} />
    </div>
  );
}
