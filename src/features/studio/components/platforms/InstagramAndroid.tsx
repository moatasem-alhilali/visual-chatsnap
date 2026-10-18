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
 * Behaviour: no per-message times — a centred 12sp secondary-text timestamp
 * ("Today 10:41") at the top and after ≥1h of silence. Under your newest message
 * only: "Sent" until read, then "Seen" (Instagram has no "Delivered" stage).
 * Typing = grey bubble with three pulsing dots + avatar in the thread (the
 * header keeps "Active now"). Emoji-only messages (1-3) render large with no
 * bubble; photos render without a bubble, a caption follows as its own bubble.
 * Phone / video / sticker / play glyphs do not mirror in Arabic; the back arrow
 * does.
 */

import { useCallback, useEffect, useLayoutEffect, useRef, type CSSProperties, type ReactNode } from "react";

import type { Message, Person } from "../../types";
import { Avatar, dirOf, SystemBottomBar, useChatScroll } from "../shared";
import { SamsungStatusBar } from "../devices/SamsungStatusBar";
import type { Lang } from "./chrome";
import { groupInfo, type PlatformMotion, type PlatformProps } from "./types";

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

type Kind = "text" | "voice" | "image" | "emoji";

function kindOf(m: Message): Kind {
  if (m.type === "voice") return "voice";
  if (m.type === "image") return "image";
  return bigEmoji(m.text) ? "emoji" : "text";
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
}: {
  target: Message;
  mine: boolean;
  pal: Pal;
  s: (typeof STR)[Lang];
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
    const text = isVoice ? s.voiceMessage : target.text;
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

  const last = messages[messages.length - 1];
  const receipt = last && last.sender === "me" ? (playback.statusOf(last) === "read" ? s.seen : s.sent) : null;

  const active = scenario.presence !== "lastseen";
  const handle = handleOf(scenario.them);
  const subtitle = active ? s.activeNow : scenario.lastSeenText || handle;

  const kinds = messages.map(kindOf);
  /** bubble-like kinds join their neighbours' corners; big emoji break the run */
  const joins = (a: Kind | undefined, b: Kind | undefined) => !!a && !!b && a !== "emoji" && b !== "emoji";

  return (
    <div className="flex h-full w-full flex-col" style={{ background: pal.bg, color: pal.fg }}>
      <style>{KEYFRAMES}</style>
      <SamsungStatusBar tint={dark ? "light" : "dark"} background={pal.bg} lang={lang} />

      {/* Toolbar — 56dp */}
      <div className="flex shrink-0 items-center" style={{ height: M.headerH, paddingInlineStart: 4, paddingInlineEnd: 16, background: pal.bg }}>
        <span className="flex shrink-0 items-center justify-center" style={{ width: 48, height: 48 }}>
          <BackArrow color={pal.fg} />
        </span>
        <div className="relative shrink-0" style={{ marginInlineStart: 2 }}>
          <Avatar person={scenario.them} size={M.headerAvatar} />
          {active && (
            <span
              className="absolute rounded-full"
              style={{ width: 9, height: 9, bottom: -1, insetInlineEnd: -1, background: ACTIVE_GREEN, border: `2px solid ${pal.bg}`, boxSizing: "content-box" }}
            />
          )}
        </div>
        <div className="min-w-0 flex-1" style={{ marginInlineStart: 12 }}>
          <div className="truncate" dir="auto" style={{ fontSize: 16, lineHeight: "20px", fontWeight: 700, textAlign: "start" }}>
            {scenario.them.name}
          </div>
          <div className="truncate" style={{ fontSize: 12, lineHeight: "16px", color: pal.sub }}>
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
            <Avatar person={scenario.them} size={96} />
            <div className="max-w-full truncate" dir="auto" style={{ marginTop: 12, fontSize: 18, lineHeight: "22px", fontWeight: 700 }}>
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
              style={{ marginTop: 14, background: pal.button, fontSize: 14, lineHeight: "18px", fontWeight: 700, padding: "7px 16px", borderRadius: 8 }}
            >
              {s.viewProfile}
            </div>
          </div>

          {messages.map((m, i) => {
            const mine = m.sender === "me";
            const onRight = mine ? !rtl : rtl;
            const kind = kinds[i];
            const sep = needsSeparator(messages, i);
            const g = groupInfo(messages, i);
            const target = targetOf(m);
            // a quoted reply opens a new visual block: it breaks the corner join on both sides
            const firstOfGroup = g.firstOfGroup || sep || !!target;
            const nextSep = i + 1 < messages.length && needsSeparator(messages, i + 1);
            const lastOfGroup = g.lastOfGroup || nextSep || !!targetOf(messages[i + 1]);
            const reaction = m.reaction?.trim();
            const joinAbove = !firstOfGroup && joins(kinds[i - 1], kind);
            const joinBelow = !lastOfGroup && joins(kind, kinds[i + 1]);

            const caption = kind === "image" ? m.text.trim() : "";
            const marginTop = sep ? 0 : firstOfGroup ? M.senderGap : M.groupGap;

            let body: ReactNode;
            if (kind === "emoji") {
              body = (
                <div dir="auto" style={{ fontSize: M.emoji, lineHeight: `${M.emoji + 8}px`, paddingInline: 2 }}>
                  {m.text.trim()}
                </div>
              );
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
                  {caption && (
                    <div
                      {...(mine ? { "data-ig-out": "" } : {})}
                      style={{
                        ...cornersFor(onRight, true, joinBelow, M.radius),
                        marginTop: M.groupGap,
                        backgroundColor: mine ? OUT_SOLID : pal.inBubble,
                        color: mine ? "#ffffff" : pal.fg,
                        padding: `${M.padY}px ${M.padX}px`,
                      }}
                    >
                      <div dir={dirOf(caption)} className="whitespace-pre-wrap break-words" style={{ fontSize: M.text, lineHeight: `${M.line}px`, textAlign: "start" }}>
                        {caption}
                      </div>
                    </div>
                  )}
                </>
              );
            } else {
              body = (
                <div
                  {...(mine ? { "data-ig-out": "" } : {})}
                  style={{
                    ...cornersFor(onRight, joinAbove, joinBelow, M.radius),
                    backgroundColor: mine ? OUT_SOLID : pal.inBubble,
                    color: mine ? "#ffffff" : pal.fg,
                    padding: `${M.padY}px ${kind === "voice" ? 14 : M.padX}px`,
                  }}
                >
                  {kind === "voice" ? (
                    <VoiceContent mine={mine} pal={pal} duration={m.voiceDuration} />
                  ) : (
                    <div dir={dirOf(m.text)} className="whitespace-pre-wrap break-words" style={{ fontSize: M.text, lineHeight: `${M.line}px`, textAlign: "start" }}>
                      {m.text}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <div key={m.id} className="contents">
                {sep && (
                  <div className="flex justify-center" style={{ margin: i === 0 ? "0 0 14px" : "18px 0 14px" }}>
                    <span style={{ fontSize: 12, lineHeight: "16px", fontWeight: 500, color: pal.sub }}>
                      {s.today} <span dir="ltr">{m.time}</span>
                    </span>
                  </div>
                )}
                <div
                  data-mid={m.id}
                  data-sender={m.sender}
                  className={`flex items-end ${mine ? "justify-end" : "justify-start"} ${live ? "ig-and-enter" : ""}`}
                  style={{ marginTop, gap: 8, ...(live ? { transformOrigin: originOf(mine, rtl) } : {}) }}
                >
                  {!mine && (
                    <div className="shrink-0" style={{ width: M.inAvatar, marginBottom: reaction ? REACT.h - REACT.overlap : 0 }}>
                      {lastOfGroup && <Avatar person={scenario.them} size={M.inAvatar} />}
                    </div>
                  )}
                  <div className={`flex min-w-0 flex-col ${mine ? "items-end" : "items-start"}`} style={{ maxWidth: M.maxW }}>
                    {target && <ReplyQuote target={target} mine={mine} pal={pal} s={s} themName={scenario.them.name} />}
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

          {showTyping && <TypingRow person={scenario.them} pal={pal} animate={live} clockMs={clockMs} />}
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
