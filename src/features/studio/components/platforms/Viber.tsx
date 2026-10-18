"use client";

/**
 * Rakuten Viber for iOS: 1-on-1 chat screen, as shipped in late 2026 (v29).
 *
 * Sources (pixel-scanned at full resolution, scale from the 393 pt screen width):
 *  - App Store iPhone set (6.5" 1284×2778, current listing; the iOS chrome reference):
 *    https://apps.apple.com/us/app/rakuten-viber-messenger/id382617920
 *    "Discover new channels" (front-on, 2.264 px/pt) gave the nav bar; "Disappearing
 *    messages" / "React with GIFs" / "Secure chats" the 1-on-1 layout (avatar beside the
 *    first incoming bubble, square sender-side corner, heart discs, outgoing #C8E2FE).
 *  - App Store iPad "Create group chats" (date text, inline time, heart discs, big emoji).
 *  - Google Play set (com.viber.voip, current): the 2025–26 composer (⊕ | grey pill
 *    "Message…" with smiley + gallery | purple gradient mic disc), voice note, square
 *    first-bubble corner (pixel-verified), group gaps.
 *  - Viber blog: plain white default background (2018 chat redesign
 *    https://www.viber.com/en/blog/2018-08-27/…new-lightning-quick-chat-experience/),
 *    status icons ✓ sent / ✓✓ delivered / purple ✓✓ seen; "Hide is typing" art
 *    (2025-12-02 What's New) for the typing pill (dots #9689F5) and the composer.
 *  - Help center (help.viber.com Chat knowledge base): "Tap Plus, then Gallery",
 *    "Tap the heart next to a message", Expressions = smiley in the field.
 *
 * Measured (393 pt):
 *  - Nav bar: opaque, 58 pt under the 54 pt status bar, 0.5 pt hairline. Purple back
 *    chevron 12×19 at x 9; title 17 semibold centred with a small ⌄, subtitle 12 grey
 *    (cap top 72.9 / baseline 85.2 / subtitle baseline 101.6 from the screen top);
 *    filled phone 19×19 at x 314, filled gradient video 27×19 at x 352 (right inset 14).
 *  - Bubbles: radius 12, the first bubble of a run has a square top corner on the
 *    sender side; text 17 / 21.5, padding 9 / 13; ~4 pt inside a run, ~12 between
 *    senders. Incoming #EFEFEF with a 34 pt avatar (white ring, soft shadow) 9 pt from
 *    the edge, 7 pt gap; outgoing #C8E2FE, 9 pt from the edge. A white 26 pt heart disc
 *    sits 6 pt beside every bubble, vertically centred.
 *  - Time 12 at rgba(0,0,0,.27), inline after a short single line, else on its own line,
 *    end-aligned. Ticks: grey ✓ sent, grey ✓✓ delivered, #7360F2 ✓✓ seen.
 *  - Date: bare grey 14 text ("Today"), no chip.
 *  - Composer: hairline, ⊕ 22 outline, #F6F6F6 pill 38 tall "Message…", smiley +
 *    gallery inside, mic disc 38 with #7360F2→#9161F2 gradient.
 *  - Dark ("Dark Blue" theme): surface #1E2835, incoming #2C3846, outgoing #36507A.
 *  - Motion: sent bubble rises ~18 pt from the composer and settles (280 ms decel);
 *    received bubble fades and grows from its avatar-side top corner.
 *  - Reactions (1-on-1): no badge on the bubble; the like disc beside the message
 *    carries the reaction. A like turns the outline heart into a solid red heart,
 *    any other reaction (😂 😮 😢 😡 👍 …) replaces the heart with that emoji
 *    (help center "Tap the heart next to a message", long-tap for more reactions;
 *    viber.com/en/blog/2025-02-17/whats-new-on-rakuten-viber/).
 *  - Replies: quote at the top of the replying bubble: 2 pt purple bar, quoted sender
 *    (purple semibold 14, "You" for mine), one-line grey snippet, 36 pt thumbnail for
 *    a photo ("Photo"), mic + "Voice message" for a voice note.
 *  - Compose typing: text + purple caret replace "Message…", the field grows to 5 lines
 *    (bottom-anchored), the gallery shortcut hides (smiley stays) and the gradient mic
 *    disc becomes the send disc (white paper plane, mirrored in Arabic).
 */

import type { CSSProperties, ReactNode } from "react";

import type { DeliveryStatus, FileShare, LinkPreview, Message, Person, Scenario } from "../../types";
import { useKeyboardInset } from "../devices/keyboard-context";
import { StatusBar } from "../devices/StatusBar";
import { dirOf, SystemBottomBar, useChatScroll } from "../shared";
import { CHROME, type Lang } from "./chrome";
import { type PlatformMotion, type PlatformProps } from "./types";

/* ======================================================================
   Strings (Viber's own wording)
   ====================================================================== */

interface VbStrings {
  online: string;
  typing: string;
  isTyping: (name: string) => string;
  placeholder: string;
  you: string;
  photo: string;
  voice: string;
  edited: string;
  deleted: string;
  sticker: string;
  location: string;
  missedCall: string;
  missedVideo: string;
  inCall: string;
  inVideo: string;
  outCall: string;
  outVideo: string;
  noAnswer: string;
}

const VB: Record<Lang, VbStrings> = {
  en: {
    online: "Online",
    typing: "typing…",
    isTyping: (n) => `${n} is typing…`,
    placeholder: "Message…",
    you: "You",
    photo: "Photo",
    voice: "Voice message",
    edited: "Edited",
    deleted: "Message deleted",
    sticker: "Sticker",
    location: "Location",
    missedCall: "Missed call",
    missedVideo: "Missed video call",
    inCall: "Incoming call",
    inVideo: "Incoming video call",
    outCall: "Outgoing call",
    outVideo: "Outgoing video call",
    noAnswer: "No answer",
  },
  ar: {
    online: "متصل",
    typing: "يكتب…",
    isTyping: (n) => `${n} يكتب…`,
    placeholder: "رسالة…",
    you: "أنت",
    photo: "صورة",
    voice: "رسالة صوتية",
    edited: "تم التعديل",
    deleted: "تم حذف الرسالة",
    sticker: "ملصق",
    location: "الموقع",
    missedCall: "مكالمة فائتة",
    missedVideo: "مكالمة فيديو فائتة",
    inCall: "مكالمة واردة",
    inVideo: "مكالمة فيديو واردة",
    outCall: "مكالمة صادرة",
    outVideo: "مكالمة فيديو صادرة",
    noAnswer: "لا يوجد رد",
  },
};

/* ======================================================================
   Group chats
   ====================================================================== */

/** Per-member sender-name colours (picked by member index), light / dark. */
const MEMBER_LIGHT = ["#d6457a", "#2b9a62", "#e0782c", "#3b7dd8", "#8e55e6", "#cc463c", "#1e9bb0", "#a8850f"];
const MEMBER_DARK = ["#ff7eaa", "#62d197", "#ffa466", "#7aacff", "#b896ff", "#ff8278", "#62d1e4", "#e6c250"];

/** The person who wrote a message (group member, the 1-on-1 contact, or me). */
function authorIndexOf(m: Message, scenario: Scenario): number {
  const n = scenario.group?.members.length ?? 0;
  const i = m.authorIndex ?? 0;
  return n ? Math.min(Math.max(0, i), n - 1) : 0;
}

function authorOf(m: Message, scenario: Scenario): Person {
  if (m.sender === "me") return scenario.me;
  const g = scenario.group;
  return g && g.members.length ? g.members[authorIndexOf(m, scenario)] : scenario.them;
}

/** Viber's group subtitle: the participants by name, me last ("Khalid, Sara, Omar, You"). */
function memberList(scenario: Scenario, s: VbStrings, lang: Lang): string {
  const names = (scenario.group?.members ?? []).map((x) => x.name.trim()).filter(Boolean);
  return [...names, s.you].join(lang === "ar" ? "، " : ", ");
}

/** A run continues while the same person keeps writing (in groups: same member). */
function startsRun(messages: Message[], i: number, group: boolean): boolean {
  const m = messages[i];
  const prev = messages[i - 1];
  if (!prev || prev.sender !== m.sender) return true;
  return group && m.sender === "them" && (prev.authorIndex ?? 0) !== (m.authorIndex ?? 0);
}

const URL_RE = /((?:https?:\/\/|www\.)[^\s]+)/;

/** URLs in a message are tinted and underlined, like Viber's auto-linked text. */
function Linkified({ text, color }: { text: string; color: string }) {
  const parts = text.split(URL_RE);
  return (
    <>
      {parts.map((part, i) =>
        i % 2 ? (
          <span key={i} style={{ color, textDecoration: "underline", textUnderlineOffset: 2 }}>
            {part}
          </span>
        ) : (
          part
        ),
      )}
    </>
  );
}

function hostOf(url: string): string {
  try {
    return new URL(url.startsWith("http") ? url : `https://${url}`).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function extOf(name: string): string {
  const m = /\.([a-z0-9]{1,5})$/i.exec(name.trim());
  return m ? m[1].toLowerCase() : "";
}

function fileColor(ext: string): string {
  if (ext === "pdf") return "#e5493a";
  if (["doc", "docx", "rtf", "txt"].includes(ext)) return "#2f6fd8";
  if (["xls", "xlsx", "csv"].includes(ext)) return "#1f9d57";
  if (["ppt", "pptx", "key"].includes(ext)) return "#e2692b";
  if (["zip", "rar", "7z"].includes(ext)) return "#8e8e93";
  return "#7d8796";
}

/* ======================================================================
   Metrics + palette
   ====================================================================== */

const R = 12; // bubble radius
const EDGE = 9; // bubble / avatar inset from the screen edge
const AV = 34; // avatar
const AV_GAP = 7; // avatar → bubble
const DISC = 26; // heart disc
const DISC_GAP = 6;
const RESERVE = DISC + DISC_GAP + 38; // inner side kept free (disc + breathing room)
const HEADER_H = 58;
const IMG_W = 236;
const NAME_H = 19; // group sender name line (16) + gap to the bubble (3)
const STICKER = 150; // Viber sticker box
const STICKER_EMOJI = [0, 112, 76, 56]; // emoji drawn as a sticker, by count

interface Pal {
  bg: string;
  bar: string;
  hair: string;
  title: string;
  sub: string;
  purple: string;
  inBubble: string;
  outBubble: string;
  text: string;
  time: string;
  timeOut: string;
  date: string;
  disc: string;
  discShadow: string;
  heart: string;
  field: string;
  placeholder: string;
  icon: string;
  dots: string;
  waveIn: string;
  waveOut: string;
  avatarBg: string;
  avatarFg: string;
  avatarRing: string;
  home: string;
  link: string;
  quoteText: string;
  likeRed: string;
}

const LIGHT: Pal = {
  bg: "#ffffff",
  bar: "#ffffff",
  hair: "#e2e2e2",
  title: "#000000",
  sub: "#a6a6a6",
  purple: "#7360f2",
  inBubble: "#efefef",
  outBubble: "#c8e2fe",
  text: "#000000",
  time: "rgba(0,0,0,0.27)",
  timeOut: "rgba(0,0,0,0.27)",
  date: "#a6a6a6",
  disc: "#ffffff",
  discShadow: "0 1px 4px rgba(0,0,0,0.13), 0 0 0 0.5px rgba(0,0,0,0.04)",
  heart: "#b3b3b3",
  field: "#f6f6f6",
  placeholder: "#b2b2b2",
  icon: "#8a8a8a",
  dots: "#9689f5",
  waveIn: "#b0b0b0",
  waveOut: "#94acc7",
  avatarBg: "#dcdcdc",
  avatarFg: "#ffffff",
  avatarRing: "#ffffff",
  home: "#000000",
  link: "#3f73e8",
  quoteText: "rgba(0,0,0,0.55)",
  likeRed: "#f2425a",
};

const DARK: Pal = {
  bg: "#1e2835",
  bar: "#1e2835",
  hair: "#2e3a49",
  title: "#ffffff",
  sub: "#8592a3",
  purple: "#8b7cf6",
  inBubble: "#2c3846",
  outBubble: "#36507a",
  text: "#ffffff",
  time: "rgba(255,255,255,0.45)",
  timeOut: "rgba(255,255,255,0.5)",
  date: "#8592a3",
  disc: "#2c3846",
  discShadow: "0 1px 4px rgba(0,0,0,0.35)",
  heart: "#8592a3",
  field: "#2c3846",
  placeholder: "#7d8a9b",
  icon: "#97a3b3",
  dots: "#9689f5",
  waveIn: "#6f7d8f",
  waveOut: "#7e98bd",
  avatarBg: "#3a4757",
  avatarFg: "#8592a3",
  avatarRing: "#1e2835",
  home: "#ffffff",
  link: "#7ba7ff",
  quoteText: "rgba(255,255,255,0.6)",
  likeRed: "#f2425a",
};

/* ======================================================================
   Motion (shared by the live CSS and the exporter)
   ====================================================================== */

/** CSS cubic-bezier(x1,y1,x2,y2) evaluated in JS (Newton + bisection fallback). */
function cubicBezier(x1: number, y1: number, x2: number, y2: number) {
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

const ENTER_MS = 280;
const IN_MS = 240;
const decel = cubicBezier(0.22, 0.9, 0.3, 1);

/**
 * Viber iOS entrance. A sent bubble rises ~18 pt out of the composer while it
 * fades in quickly and settles from 96 % scale (origin: its bottom outer corner).
 * A received bubble fades in and grows from 90 % out of its top corner next to
 * the avatar. Outgoing runs over ENTER_MS; incoming completes at IN_MS.
 */
export const viberIosMotion: PlatformMotion = {
  enterMs: ENTER_MS,
  enterStyle: (p, mine, rtl) => {
    const onRight = mine ? !rtl : rtl;
    if (mine) {
      const e = decel(p);
      return {
        opacity: Math.min(1, p / 0.3),
        transform: `translateY(${((1 - e) * 18).toFixed(2)}px) scale(${(0.96 + 0.04 * e).toFixed(4)})`,
        transformOrigin: `${onRight ? "right" : "left"} bottom`,
      };
    }
    const q = Math.min(1, p * (ENTER_MS / IN_MS));
    const e = decel(q);
    return {
      opacity: Math.min(1, q / 0.5),
      transform: `translateY(${((1 - e) * 6).toFixed(2)}px) scale(${(0.9 + 0.1 * e).toFixed(4)})`,
      transformOrigin: `${onRight ? "right" : "left"} top`,
    };
  },
};

/** Typing dots: 1.2 s cycle, each dot 0.18 s behind, a soft pulse (opacity + lift). */
const DOT_MS = 1200;
const CARET_MS = 1000;
function dotAt(phase: number): { opacity: number; y: number } {
  const t = ((phase % 1) + 1) % 1;
  const k = t < 0.5 ? Math.sin((t / 0.5) * Math.PI) : 0;
  return { opacity: 0.45 + 0.55 * k, y: -2 * k };
}

const MOTION_CSS = (() => {
  const steps = 20;
  let css = "";
  for (const mine of [true, false]) {
    for (const rtl of [false, true]) {
      const name = `vb-ios-in-${mine ? "me" : "them"}-${rtl ? "rtl" : "ltr"}`;
      let frames = "";
      for (let i = 0; i <= steps; i++) {
        const p = i / steps;
        const st = viberIosMotion.enterStyle(p, mine, rtl);
        frames += `${(p * 100).toFixed(2)}%{opacity:${st.opacity};transform:${st.transform};transform-origin:${st.transformOrigin}}`;
      }
      css += `@keyframes ${name}{${frames}}.${name}{animation:${name} ${ENTER_MS}ms linear both}`;
    }
  }
  let dot = "";
  for (let i = 0; i <= 20; i++) {
    const d = dotAt(i / 20);
    dot += `${i * 5}%{opacity:${d.opacity.toFixed(3)};transform:translateY(${d.y.toFixed(2)}px)}`;
  }
  css += `@keyframes vb-ios-dot{${dot}}.vb-ios-dot{animation:vb-ios-dot ${DOT_MS}ms linear infinite}`;
  // UIKit caret: solid for ~half a second, then a quick fade out / fade in (1 s period)
  css += `@keyframes vb-ios-caret{0%,45%{opacity:1}55%,90%{opacity:0}100%{opacity:1}}.vb-ios-caret{animation:vb-ios-caret ${CARET_MS}ms linear infinite}`;
  return css;
})();

/** Caret opacity at clock t (same curve as the CSS keyframes). */
function caretAt(t: number): number {
  const x = (((t % CARET_MS) + CARET_MS) % CARET_MS) / CARET_MS;
  if (x <= 0.45) return 1;
  if (x < 0.55) return 1 - (x - 0.45) / 0.1;
  if (x <= 0.9) return 0;
  return (x - 0.9) / 0.1;
}

function enterClass(live: boolean, mine: boolean, rtl: boolean): string {
  return live ? `vb-ios-in-${mine ? "me" : "them"}-${rtl ? "rtl" : "ltr"}` : "";
}

/* ======================================================================
   Glyphs (Viber's 2023+ icon set, drawn inline)
   ====================================================================== */

function BackChevron({ color }: { color: string }) {
  return (
    <svg width="13" height="21" viewBox="0 0 13 21" fill="none" className="shrink-0 rtl:-scale-x-100" style={{ display: "block" }}>
      <path d="M11 1.6 2.2 10.5 11 19.4" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronDown({ color }: { color: string }) {
  return (
    <svg width="10" height="6" viewBox="0 0 10 6" fill="none" style={{ display: "block", flexShrink: 0 }}>
      <path d="M1.2 1.2 5 4.8l3.8-3.6" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Filled handset (does not mirror in RTL). */
function PhoneGlyph({ color }: { color: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" style={{ display: "block" }}>
      <path
        d="M6.3 2.2c.6-.3 1.3-.1 1.7.4l2.5 3.5c.4.6.4 1.4-.1 1.9L8.9 9.6c-.3.3-.3.7-.2 1 .9 1.7 2.9 3.8 4.7 4.8.4.2.8.1 1.1-.2l1.6-1.5c.5-.5 1.3-.5 1.9-.1l3.5 2.5c.6.4.8 1.1.5 1.7l-.8 1.9c-.5 1.2-1.7 2-3 1.9-7.2-.6-13.1-6.5-13.6-13.7-.1-1.3.7-2.5 1.9-3z"
        fill={color}
      />
    </svg>
  );
}

/** Filled video camera with Viber's purple gradient (does not mirror). */
function VideoGlyph({ id }: { id: string }) {
  return (
    <svg width="28" height="20" viewBox="0 0 28 20" style={{ display: "block" }}>
      <defs>
        <linearGradient id={id} x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#7360f2" />
          <stop offset="1" stopColor="#9a5ef2" />
        </linearGradient>
      </defs>
      <rect x="0.5" y="1" width="19.5" height="18" rx="5" fill={`url(#${id})`} />
      <path d="M21.4 7.6 26 4.4c.6-.4 1.5 0 1.5.8v9.6c0 .8-.9 1.2-1.5.8l-4.6-3.2z" fill={`url(#${id})`} />
    </svg>
  );
}

function PlusCircle({ color }: { color: string }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ display: "block" }}>
      <circle cx="12" cy="12" r="10.4" stroke={color} strokeWidth="1.4" />
      <path d="M12 7.2v9.6M7.2 12h9.6" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

/** "Expressions" — smiley with ^ ^ eyes. */
function SmileyGlyph({ color }: { color: string }) {
  return (
    <svg width="25" height="25" viewBox="0 0 24 24" fill="none" style={{ display: "block" }}>
      <circle cx="12" cy="12" r="9.6" stroke={color} strokeWidth="1.4" />
      <path d="M7.6 10.4c.5-1 1.9-1 2.4 0M14 10.4c.5-1 1.9-1 2.4 0" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
      <path d="M8.3 13.8c1.9 2.6 5.5 2.6 7.4 0" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

/** Gallery — squircle frame, sun dot, rolling hills. */
function GalleryGlyph({ color }: { color: string }) {
  return (
    <svg width="25" height="25" viewBox="0 0 24 24" fill="none" style={{ display: "block" }}>
      <path
        d="M12 3c5.6 0 9 .9 9 9s-3.4 9-9 9-9-.9-9-9 3.4-9 9-9z"
        stroke={color}
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <circle cx="9" cy="9.2" r="1.7" stroke={color} strokeWidth="1.3" />
      <path d="M3.4 15.6c2.6-2.3 4.6-2.3 6.4-.6 1.7 1.6 2.6.2 4.2-1.6 1.8-2 4.2-1.8 6.6.8" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function MicGlyph({ color }: { color: string }) {
  return (
    <svg width="20" height="22" viewBox="0 0 20 22" fill="none" style={{ display: "block" }}>
      <rect x="6.6" y="1.4" width="6.8" height="11.6" rx="3.4" stroke={color} strokeWidth="1.5" />
      <path d="M3.4 9.8a6.6 6.6 0 0 0 13.2 0M10 16.4v3.6M7.2 20.3h5.6" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function HeartOutline({ color }: { color: string }) {
  return (
    <svg width="15" height="14" viewBox="0 0 24 22" fill="none" style={{ display: "block" }}>
      <path
        d="M12 20.3S2.2 14.4 2.2 7.6A5.1 5.1 0 0 1 12 5.3a5.1 5.1 0 0 1 9.8 2.3c0 6.8-9.8 12.7-9.8 12.7z"
        stroke={color}
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Viber "Send": white paper plane pointing along the reading direction (mirrors in Arabic). */
function SendGlyph({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className="rtl:-scale-x-100" style={{ display: "block", marginInlineStart: 2 }}>
      <path
        d="M3.4 3.2c-.6-.3-1.3.3-1.1.9l2.6 7.1c.1.3.4.5.7.5l8.1.3-8.1.3c-.3 0-.6.2-.7.5l-2.6 7.1c-.2.6.5 1.2 1.1.9l18-8.1c.6-.3.6-1.2 0-1.5z"
        fill="#ffffff"
      />
    </svg>
  );
}

/**
 * The reaction shown in the heart disc. Viber's "like" is its own solid red
 * heart (the outline fills in); any other reaction replaces the heart with the
 * emoji itself.
 */
function ReactionGlyph({ emoji, red }: { emoji: string; red: string }) {
  const e = emoji.trim();
  if (/^[❤♥]️?$/u.test(e)) {
    return (
      <svg width="16" height="15" viewBox="0 0 24 22" style={{ display: "block" }}>
        <path d="M12 20.6S1.6 14.5 1.6 7.5A5.4 5.4 0 0 1 12 5.1a5.4 5.4 0 0 1 10.4 2.4c0 7-10.4 13.1-10.4 13.1z" fill={red} />
      </svg>
    );
  }
  return <span style={{ fontSize: 15, lineHeight: "18px", display: "block" }}>{e}</span>;
}

function ForwardGlyph({ color }: { color: string }) {
  return (
    <svg width="15" height="13" viewBox="0 0 24 20" fill="none" className="rtl:-scale-x-100" style={{ display: "block" }}>
      <path
        d="M14 2.5 22 9.6 14 16.7v-4.2c-5.4 0-9 1.5-11.6 5 .9-6.1 4.6-10 11.6-10.7z"
        stroke={color}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Viber's check marks: ✓ sent, ✓✓ delivered (grey), ✓✓ seen (purple). */
function Ticks({ status, grey, seen }: { status: DeliveryStatus; grey: string; seen: string }) {
  const color = status === "read" ? seen : grey;
  if (status === "sent") {
    return (
      <svg width="11" height="9" viewBox="0 0 11 9" fill="none" style={{ display: "block", flexShrink: 0 }}>
        <path d="M1 4.9 3.9 7.8 10 1.2" stroke={color} strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg width="16" height="9" viewBox="0 0 16 9" fill="none" style={{ display: "block", flexShrink: 0 }}>
      <path d="M1 4.9 3.9 7.8 10 1.2M7.4 6.9l.9.9L14.6 1.2" stroke={color} strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ======================================================================
   Small helpers
   ====================================================================== */

/** Profile photo with Viber's white ring + soft shadow; grey silhouette when unset. */
function VbAvatar({ person, size, pal }: { person: Person; size: number; pal: Pal }) {
  const ring: CSSProperties = {
    width: size,
    height: size,
    borderRadius: size / 2,
    boxShadow: `0 0 0 1.5px ${pal.avatarRing}, 0 1px 3px rgba(0,0,0,0.18)`,
    flexShrink: 0,
    overflow: "hidden",
  };
  if (person.avatar) {
    return (
      <div style={ring}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={person.avatar}
          alt={person.name}
          width={size}
          height={size}
          draggable={false}
          className="object-cover"
          style={{ width: size, height: size, display: "block" }}
        />
      </div>
    );
  }
  return (
    <div style={ring}>
      <svg width={size} height={size} viewBox="0 0 40 40" style={{ display: "block" }}>
        <rect width="40" height="40" fill={pal.avatarBg} />
        <circle cx="20" cy="15.5" r="6.8" fill={pal.avatarFg} />
        <path d="M7.4 34.5c1.6-6.2 6.6-9.6 12.6-9.6s11 3.4 12.6 9.6A19.8 19.8 0 0 1 20 40a19.8 19.8 0 0 1-12.6-5.5z" fill={pal.avatarFg} />
      </svg>
    </div>
  );
}

/** White quick-action disc (heart / forward) shown beside messages. */
function Disc({ pal, children }: { pal: Pal; children: ReactNode }) {
  return (
    <span
      className="flex shrink-0 items-center justify-center"
      style={{ width: DISC, height: DISC, borderRadius: DISC / 2, background: pal.disc, boxShadow: pal.discShadow }}
    >
      {children}
    </span>
  );
}

/** What a reply quotes: resolved from `replyToId`, or null when the target is missing. */
interface QuoteInfo {
  name: string;
  snippet: string;
  /** photo target: show the square thumbnail */
  image: boolean;
  imageSrc: string | null;
  voice: boolean;
}

function quoteOf(m: Message, scenario: Scenario, s: VbStrings): QuoteInfo | null {
  if (!m.replyToId) return null;
  const t = scenario.messages.find((x) => x.id === m.replyToId);
  if (!t) return null;
  const name = t.sender === "me" ? s.you : authorOf(t, scenario).name;
  if (t.type === "voice") return { name, snippet: s.voice, image: false, imageSrc: null, voice: true };
  if (t.type === "image") {
    return { name, snippet: t.text.trim() || s.photo, image: true, imageSrc: t.imageSrc ?? null, voice: false };
  }
  const plain = (snippet: string) => ({ name, snippet, image: false, imageSrc: null, voice: false });
  if (t.type === "sticker") return plain(s.sticker);
  if (t.type === "location") return plain(t.location?.title || s.location);
  if (t.type === "file") return plain(t.file?.name || "");
  if (t.type === "deleted") return plain(s.deleted);
  if (t.type === "call") return plain(callTitle(t, s));
  return plain(t.text.replace(/\s+/g, " ").trim());
}

/** Viber's call-log wording for a call entry. */
function callTitle(m: Message, s: VbStrings): string {
  const video = !!m.call?.video;
  if (m.sender === "me") return video ? s.outVideo : s.outCall;
  if (m.call?.missed) return video ? s.missedVideo : s.missedCall;
  return video ? s.inVideo : s.inCall;
}

/**
 * Viber's quoted reply, at the top of the replying bubble: a 2 pt purple bar on
 * the leading side, the quoted sender's name (purple, semibold) and a one-line
 * grey snippet; a photo target adds a small rounded thumbnail and "Photo", a
 * voice note shows a mic and "Voice message".
 */
function Quote({ q, p, uiDir, dark }: { q: QuoteInfo; p: Pal; uiDir: "rtl" | "ltr"; dark: boolean }) {
  const sDir = dirOf(q.snippet);
  return (
    <div dir={uiDir} className="flex min-w-0 items-stretch" style={{ gap: 7, marginBottom: 5 }}>
      <span style={{ width: 2, borderRadius: 1, background: p.purple, flexShrink: 0 }} />
      {q.image && (
        <span className="shrink-0 overflow-hidden" style={{ width: 36, height: 36, borderRadius: 4, alignSelf: "center" }}>
          {q.imageSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={q.imageSrc} alt="" draggable={false} style={{ display: "block", width: 36, height: 36, objectFit: "cover" }} />
          ) : (
            <span style={{ display: "block", width: 36, height: 36, background: dark ? "#253140" : "#d9d9d9" }} />
          )}
        </span>
      )}
      <div className="min-w-0 flex-1" style={{ paddingBlock: 1 }}>
        <div
          className="truncate"
          dir={dirOf(q.name)}
          style={{ fontSize: 14, lineHeight: "17px", fontWeight: 600, color: p.purple, letterSpacing: -0.15, textAlign: uiDir === "rtl" ? "right" : "left" }}
        >
          {q.name}
        </div>
        <div className="flex min-w-0 items-center" style={{ gap: 3 }}>
          {q.voice && (
            <svg width="11" height="14" viewBox="0 0 20 22" fill="none" style={{ display: "block", flexShrink: 0 }}>
              <rect x="6.6" y="1.4" width="6.8" height="11.6" rx="3.4" fill={p.quoteText} />
              <path d="M3.4 9.8a6.6 6.6 0 0 0 13.2 0M10 16.4v3.6" stroke={p.quoteText} strokeWidth="2" strokeLinecap="round" />
            </svg>
          )}
          <span
            className="min-w-0 flex-1 truncate"
            dir={sDir}
            style={{ fontSize: 14, lineHeight: "18px", color: p.quoteText, letterSpacing: -0.15, textAlign: uiDir === "rtl" ? "right" : "left" }}
          >
            {q.snippet}
          </span>
        </div>
      </div>
    </div>
  );
}

/** Count of emoji if the text is 1–3 emoji only (Viber shows those big, bubble-less). */
function jumboCount(text: string): number {
  const t = text.trim();
  if (!t || t.length > 32) return 0;
  if (!/^[\p{Extended_Pictographic}\p{Emoji_Component}‍️⃣\s]+$/u.test(t)) return 0;
  if (!/\p{Extended_Pictographic}/u.test(t)) return 0;
  const Seg = (Intl as unknown as {
    Segmenter?: new (l?: string, o?: { granularity: string }) => { segment: (s: string) => Iterable<{ segment: string }> };
  }).Segmenter;
  let n = 0;
  if (Seg) {
    for (const s of new Seg(undefined, { granularity: "grapheme" }).segment(t)) if (s.segment.trim()) n++;
  } else {
    n = (t.match(/\p{Extended_Pictographic}/gu) ?? []).length;
  }
  return n >= 1 && n <= 3 ? n : 0;
}

const JUMBO_SIZE = [0, 56, 46, 38];

/** Viber prints 24-hour times with a leading zero ("09:48"); keep 12-hour input as typed. */
function vbTime(t: string): string {
  const s = t.trim();
  return /^\d:\d\d$/.test(s) ? `0${s}` : s;
}

/** Deterministic voice-note waveform (bar heights in pt) seeded by the message id. */
function waveform(seed: string, count: number, min: number, max: number): number[] {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  const out: number[] = [];
  for (let i = 0; i < count; i++) {
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    h ^= h >>> 16;
    const r = ((h >>> 0) % 1000) / 1000;
    const env = 0.5 + 0.5 * Math.sin(((i + 0.5) / count) * Math.PI);
    out.push(Math.max(min, Math.round((min + (max - min) * r * env) * 2) / 2));
  }
  return out;
}

/* ======================================================================
   Component
   ====================================================================== */

export function Viber({ scenario, playback, lang, rtl }: PlatformProps) {
  const dark = scenario.theme === "dark";
  const p = dark ? DARK : LIGHT;
  const c = CHROME[lang];
  const s = VB[lang];
  const uiDir = rtl ? "rtl" : "ltr";
  const { messages, typing } = playback;
  const live = playback.isLive;
  const clockMs = playback.clockMs;
  const draft = playback.draft;
  const kb = useKeyboardInset();
  const group = scenario.group && scenario.group.members.length ? scenario.group : null;
  // keep the newest bubble in view while a growing draft / the keyboard shrinks the thread
  const scrollRef = useChatScroll<HTMLDivElement>(
    `${messages.length}-${typing}-${draft ? Math.floor(draft.text.length / 16) : -1}-${Math.round(kb.inset / 24)}`,
  );

  // in a group, the member who is typing is the author of the next incoming message
  const shown = new Set(messages.map((x) => x.id));
  const nextIn = scenario.messages.find((x) => !shown.has(x.id) && x.sender === "them");
  const typist: Person = nextIn ? authorOf(nextIn, scenario) : group ? group.members[0] : scenario.them;
  const typistIndex = nextIn && group ? authorIndexOf(nextIn, scenario) : 0;

  const subtitle = group
    ? typing
      ? s.isTyping(typist.name)
      : memberList(scenario, s, lang)
    : typing || scenario.presence === "typing"
      ? s.typing
      : scenario.presence === "online"
        ? s.online
        : scenario.lastSeenText;
  const last = messages.length ? messages[messages.length - 1] : null;
  // the typing pill continues a run only when the same person wrote the last message
  const typingContinues =
    !!last && last.sender === "them" && (!group || authorIndexOf(last, scenario) === typistIndex);
  const gradId = `vb-ios-video-${dark ? "d" : "l"}`;
  const palette = dark ? MEMBER_DARK : MEMBER_LIGHT;

  return (
    <div
      className="flex h-full w-full flex-col overflow-hidden"
      dir={uiDir}
      style={{ background: p.bg, color: p.text, paddingBottom: kb.inset, transition: `padding-bottom ${kb.transition}` }}
    >
      <style>{MOTION_CSS}</style>

      {/* ---------- Status bar + navigation bar ---------- */}
      <div className="relative shrink-0" style={{ background: p.bar, zIndex: 2 }}>
        <StatusBar device={scenario.device} tint={dark ? "light" : "dark"} background={p.bar} />
        <div className="relative" style={{ height: HEADER_H }}>
          {/* back */}
          <div className="absolute flex items-center" style={{ insetInlineStart: 8, top: 24.5 }}>
            <BackChevron color={p.purple} />
          </div>
          {/* title block, centred on the screen */}
          <div
            className="absolute flex flex-col items-center"
            style={{ left: 78, right: 78, top: 14.6 }}
          >
            <div className="flex max-w-full items-center" style={{ gap: 5 }}>
              <span
                className="truncate"
                style={{ fontSize: 17, lineHeight: "21px", fontWeight: 600, color: p.title, letterSpacing: -0.41 }}
              >
                {group ? group.name : scenario.them.name}
              </span>
              <ChevronDown color={p.title} />
            </div>
            {subtitle && (
              <div
                className="max-w-full truncate"
                style={{ fontSize: 12, lineHeight: "15px", color: p.sub, letterSpacing: -0.05 }}
              >
                {subtitle}
              </div>
            )}
          </div>
          {/* calls: phone then video (order mirrors with the UI, glyphs do not) */}
          <div className="absolute flex items-center" style={{ insetInlineEnd: 13.5, top: 24.5, gap: 19.5 }}>
            <PhoneGlyph color={p.purple} />
            <VideoGlyph id={gradId} />
          </div>
        </div>
        <div style={{ height: 0.5, background: p.hair }} />
      </div>

      {/* ---------- Thread ---------- */}
      <div ref={scrollRef} className="rcss-scroll min-h-0 flex-1 overflow-y-auto" style={{ paddingBottom: 12 }}>
        <div
          className="text-center"
          style={{ fontSize: 14, lineHeight: "17px", color: p.date, padding: "14px 0 10px", letterSpacing: -0.15 }}
        >
          {c.today}
        </div>

        <div className="flex flex-col">
          {messages.map((m, i) => (
            <Row
              key={m.id}
              m={m}
              p={p}
              s={s}
              rtl={rtl}
              uiDir={uiDir}
              first={startsRun(messages, i, !!group)}
              index={i}
              status={playback.statusOf(m)}
              author={authorOf(m, scenario)}
              authorColor={palette[authorIndexOf(m, scenario) % palette.length]}
              group={!!group}
              live={live}
              quote={quoteOf(m, scenario, s)}
            />
          ))}

          {typing && (
            <div
              className={`flex items-start ${enterClass(live, false, rtl)}`}
              style={{ marginTop: !last ? 0 : typingContinues ? 4 : 12, paddingInlineStart: EDGE, gap: AV_GAP }}
            >
              {/* the pill continues an incoming run, so it only carries the avatar when it starts one */}
              <div style={{ width: AV, flexShrink: 0 }}>
                {!typingContinues && <VbAvatar person={typist} size={AV} pal={p} />}
              </div>
              <div
                className="flex items-center justify-center"
                style={{ background: p.inBubble, height: 36, width: 58, borderRadius: 18, gap: 3.5 }}
              >
                {[0, 1, 2].map((d) => {
                  const st = clockMs !== undefined ? dotAt((clockMs - d * 180) / DOT_MS) : null;
                  return (
                    <span
                      key={d}
                      className={`block rounded-full ${st ? "" : "vb-ios-dot"}`}
                      style={{
                        width: 7,
                        height: 7,
                        background: p.dots,
                        animationDelay: st ? undefined : `${d * 0.18}s`,
                        opacity: st ? st.opacity : undefined,
                        transform: st ? `translateY(${st.y.toFixed(2)}px)` : undefined,
                      }}
                    />
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ---------- Composer ----------
          Typing: the text replaces "Message…" with a purple caret, the field grows
          up to 5 lines (bottom-anchored, controls stay on the last line), the
          gallery shortcut hides (the smiley stays) and the purple mic disc turns
          into the purple send disc. */}
      <div className="shrink-0" style={{ background: p.bar }}>
        <div style={{ height: 0.5, background: p.hair }} />
        <div className="flex items-end" style={{ paddingTop: 7, paddingInline: "12px 10px", minHeight: 45 }}>
          <span className="flex shrink-0 items-center" style={{ height: 38 }}>
            <PlusCircle color={p.icon} />
          </span>
          <div
            className="flex min-w-0 flex-1 items-end"
            style={{ minHeight: 38, borderRadius: 19, background: p.field, marginInline: "10px 8px", paddingInline: "14px 10px" }}
          >
            {draft ? (
              <div
                className="flex min-w-0 flex-1 flex-col justify-end overflow-hidden"
                style={{ paddingBlock: 8, maxHeight: 8 * 2 + 22 * 5 }}
              >
                <div
                  dir={dirOf(draft.text)}
                  className="whitespace-pre-wrap break-words"
                  style={{ fontSize: 17, lineHeight: "22px", color: p.text, letterSpacing: -0.41, textAlign: "start" }}
                >
                  {draft.text}
                  <span
                    className={clockMs === undefined ? "vb-ios-caret" : undefined}
                    style={{
                      display: "inline-block",
                      width: 2,
                      height: 21,
                      borderRadius: 1,
                      background: p.purple,
                      verticalAlign: -4.5,
                      marginInlineStart: 1,
                      marginInlineEnd: -3,
                      opacity: clockMs === undefined ? undefined : caretAt(clockMs),
                    }}
                  />
                </div>
              </div>
            ) : (
              <span
                className="min-w-0 flex-1 truncate"
                style={{ fontSize: 17, lineHeight: "38px", color: p.placeholder, letterSpacing: -0.41 }}
              >
                {s.placeholder}
              </span>
            )}
            <span className="flex shrink-0 items-center" style={{ height: 38, marginInline: draft ? "8px 0" : "8px 14px" }}>
              <SmileyGlyph color={p.icon} />
            </span>
            {!draft && (
              <span className="flex shrink-0 items-center" style={{ height: 38 }}>
                <GalleryGlyph color={p.icon} />
              </span>
            )}
          </div>
          <div
            className="flex shrink-0 items-center justify-center"
            style={{
              width: 38,
              height: 38,
              borderRadius: 19,
              background: "linear-gradient(45deg, #7360f2 0%, #9161f2 100%)",
            }}
          >
            {draft ? <SendGlyph /> : <MicGlyph color="#ffffff" />}
          </div>
        </div>
        {/* with the keyboard up the bar sits right on it (no home-indicator band) */}
        <div style={{ height: kb.inset > 0 ? 7 : 15 }} />
        <SystemBottomBar device={scenario.device} bg={p.bar} fg={p.home} />
      </div>
    </div>
  );
}

/* ======================================================================
   Message row
   ====================================================================== */

function Row({
  m,
  p,
  s,
  rtl,
  uiDir,
  first,
  index,
  status,
  author,
  authorColor,
  group,
  live,
  quote,
}: {
  m: Message;
  p: Pal;
  s: VbStrings;
  rtl: boolean;
  uiDir: "rtl" | "ltr";
  first: boolean;
  index: number;
  status: DeliveryStatus;
  author: Person;
  authorColor: string;
  group: boolean;
  live: boolean;
  quote: QuoteInfo | null;
}) {
  const mine = m.sender === "me";
  const isImage = m.type === "image";
  const isVoice = m.type === "voice";
  const isText = m.type === "text";
  const caption = isImage ? m.text.trim() : "";
  const link = isText ? (m.link ?? null) : null;
  // a reply always lives in a bubble, so a replying emoji-only message is not jumbo
  const jumbo = isText && !quote && !link ? jumboCount(m.text) : 0;
  const dark = p === DARK;
  const quoteEl = quote ? <Quote q={quote} p={p} uiDir={uiDir} dark={dark} /> : null;
  const reaction = m.reaction?.trim() || null;
  const bg = mine ? p.outBubble : p.inBubble;
  const timeColor = mine ? p.timeOut : p.time;
  const time = vbTime(m.time);

  // square top corner on the sender side for the first bubble of a run
  const sq = first;
  const startTop = !mine && sq ? 0 : R; // logical: incoming = inline-start
  const endTop = mine && sq ? 0 : R;
  const radius: CSSProperties = {
    borderStartStartRadius: startTop,
    borderStartEndRadius: endTop,
    borderEndStartRadius: R,
    borderEndEndRadius: R,
  };

  const meta = (overlay = false, ticks = true) => (
    <span
      className="inline-flex shrink-0 items-center whitespace-nowrap"
      style={{
        fontSize: 12,
        lineHeight: "15px",
        gap: 4,
        color: overlay ? "#ffffff" : timeColor,
        fontVariantNumeric: "tabular-nums",
        direction: "ltr",
      }}
    >
      {/* "Edited" sits in front of the time */}
      {m.edited && <span dir={uiDir}>{s.edited}</span>}
      {time}
      {mine && ticks && <Ticks status={status} grey={overlay ? "#ffffff" : timeColor} seen={overlay ? "#ffffff" : p.purple} />}
    </span>
  );

  const rowStyle: CSSProperties = {
    marginTop: index === 0 ? 0 : first ? 12 : 4,
    paddingInline: mine ? `${RESERVE - DISC - DISC_GAP}px ${EDGE}px` : `${EDGE}px ${RESERVE - DISC - DISC_GAP}px`,
    display: "flex",
    flexDirection: mine ? "row-reverse" : "row",
    alignItems: "flex-start",
  };
  const rowClass = enterClass(live, mine, rtl);

  // groups: the member's name in their colour above the first bubble of a run
  const showName = group && !mine && first;
  const avatarSlot = !mine ? (
    <div style={{ width: AV, marginInlineEnd: AV_GAP, flexShrink: 0, paddingTop: showName ? NAME_H : 0 }}>
      {first && <VbAvatar person={author} size={AV} pal={p} />}
    </div>
  ) : null;

  const discs = (
    <div
      className="flex shrink-0 items-center self-center"
      style={{ gap: 6, marginInlineStart: mine ? 0 : DISC_GAP, marginInlineEnd: mine ? DISC_GAP : 0, flexDirection: mine ? "row-reverse" : "row" }}
    >
      {/* the like disc: outline heart, or the reaction left on this message */}
      <Disc pal={p}>{reaction ? <ReactionGlyph emoji={reaction} red={p.likeRed} /> : <HeartOutline color={p.heart} />}</Disc>
      {(isImage || m.type === "file" || m.type === "location") && !mine && (
        <Disc pal={p}>
          <ForwardGlyph color={p.heart} />
        </Disc>
      )}
    </div>
  );

  const wrap = (inner: ReactNode, withDiscs = true) => (
    <div data-mid={m.id} data-sender={m.sender} className={rowClass} style={rowStyle}>
      {avatarSlot}
      <div className="flex min-w-0 flex-col" style={{ alignItems: "flex-start" }}>
        {showName && (
          <div
            className="max-w-full truncate"
            dir={dirOf(author.name)}
            style={{ fontSize: 13, lineHeight: "16px", height: 16, marginBottom: NAME_H - 16, fontWeight: 600, color: authorColor, letterSpacing: -0.08, paddingInlineStart: 2 }}
          >
            {author.name}
          </div>
        )}
        <div className="flex min-w-0 max-w-full items-start" style={{ flexDirection: mine ? "row-reverse" : "row" }}>
          {inner}
          {withDiscs && discs}
        </div>
      </div>
    </div>
  );

  /* --- emoji-only / sticker: big, bubble-less, time beside it on the inner side --- */
  if (jumbo || m.type === "sticker") {
    const sticker = m.type === "sticker";
    const n = sticker ? jumboCount(m.text) || 1 : jumbo;
    const art = sticker ? (
      m.imageSrc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={m.imageSrc} alt="" draggable={false} style={{ display: "block", width: STICKER, height: STICKER, objectFit: "contain" }} />
      ) : (
        <span
          className="flex items-center justify-center"
          style={{ width: STICKER, height: STICKER, fontSize: STICKER_EMOJI[n], lineHeight: 1, letterSpacing: 0, whiteSpace: "nowrap" }}
        >
          {m.text.trim() || "🙂"}
        </span>
      )
    ) : (
      <span style={{ fontSize: JUMBO_SIZE[jumbo], lineHeight: 1.12, letterSpacing: 1 }}>{m.text.trim()}</span>
    );
    return wrap(
      <div className="flex items-end" style={{ flexDirection: mine ? "row-reverse" : "row", gap: 6 }}>
        {art}
        <span style={{ paddingBottom: 6 }}>{meta()}</span>
      </div>,
    );
  }

  const timePill = (
    <span
      className="absolute"
      style={{
        bottom: 7,
        insetInlineEnd: 7,
        background: "rgba(0,0,0,0.38)",
        borderRadius: 9,
        padding: "1px 6px",
      }}
    >
      {meta(true)}
    </span>
  );

  /* --- frameless photo (no caption, no reply): rounded, time on a dark pill --- */
  if (isImage && !caption && !quote) {
    return wrap(
      <div className="relative overflow-hidden" style={{ width: IMG_W, background: bg, ...radius }}>
        <Photo m={m} dark={dark} />
        {timePill}
      </div>,
    );
  }

  /* --- deleted: the bubble stays, with Viber's grey italic notice --- */
  if (m.type === "deleted") {
    return wrap(
      <div
        className="flex min-w-0 flex-wrap items-baseline justify-end"
        style={{ background: bg, padding: "9px 13px", columnGap: 10, rowGap: 2, ...radius }}
      >
        <span
          className="inline-flex items-center"
          dir={uiDir}
          style={{ fontSize: 16, lineHeight: "21.5px", fontStyle: "italic", color: p.quoteText, letterSpacing: -0.3, gap: 5, flex: "1 1 auto" }}
        >
          <BanGlyph color={p.quoteText} />
          {s.deleted}
        </span>
        {meta(false, false)}
      </div>,
      false,
    );
  }

  /* --- call log entry --- */
  if (m.type === "call") {
    return wrap(<CallBubble m={m} p={p} s={s} bg={bg} radius={radius} meta={meta()} uiDir={uiDir} />, false);
  }

  let body: ReactNode;
  let padding: string | number = "9px 13px";
  let width: number | undefined;

  if (isVoice) {
    padding = "8px 13px 7px 8px";
    body = (
      <>
        {quote && <div style={{ paddingInlineStart: 5, paddingTop: 1, maxWidth: 236 }}>{quoteEl}</div>}
        <Voice m={m} p={p} mine={mine} meta={meta()} uiDir={uiDir} />
      </>
    );
  } else if (isImage) {
    padding = 0;
    width = IMG_W;
    body = (
      <>
        {quote ? (
          // replying photo: the quote sits above the picture inside the bubble
          <div style={{ padding: "9px 13px 3px" }}>{quoteEl}</div>
        ) : null}
        <div
          className="relative overflow-hidden"
          style={quote ? { marginInline: 4, borderRadius: 8, marginBottom: caption ? 0 : 4 } : { borderStartStartRadius: startTop, borderStartEndRadius: endTop }}
        >
          <Photo m={m} dark={dark} />
          {!caption && timePill}
        </div>
        {caption && <TextAndTime text={caption} p={p} meta={meta()} pad="8px 13px 8px" />}
      </>
    );
  } else if (m.type === "location") {
    padding = 0;
    width = IMG_W;
    const loc = m.location;
    body = (
      <>
        {quote && <div style={{ padding: "9px 13px 3px" }}>{quoteEl}</div>}
        <div className="relative overflow-hidden" style={quote ? { marginInline: 4, borderRadius: 8 } : { borderStartStartRadius: startTop, borderStartEndRadius: endTop }}>
          <MapArt dark={dark} h={140} />
        </div>
        <div style={{ padding: "7px 13px 8px" }}>
          {loc?.title && (
            <div className="truncate" dir={dirOf(loc.title)} style={{ fontSize: 16, lineHeight: "20px", fontWeight: 600, letterSpacing: -0.32, textAlign: "start" }}>
              {loc.title}
            </div>
          )}
          {loc?.subtitle && (
            <div className="truncate" dir={dirOf(loc.subtitle)} style={{ fontSize: 14, lineHeight: "18px", color: p.quoteText, letterSpacing: -0.15, textAlign: "start" }}>
              {loc.subtitle}
            </div>
          )}
          <div className="flex justify-end" style={{ marginTop: 2 }}>
            {meta()}
          </div>
        </div>
      </>
    );
  } else if (m.type === "file") {
    padding = "10px 13px 8px 10px";
    width = 252;
    body = (
      <>
        {quoteEl}
        <FileRow file={m.file ?? { name: "file" }} p={p} />
        <div className="flex justify-end" style={{ marginTop: 2 }}>
          {meta()}
        </div>
      </>
    );
  } else if (link) {
    padding = "9px 13px 8px";
    width = 262;
    body = (
      <>
        {quoteEl}
        <div
          dir={dirOf(m.text)}
          className="whitespace-pre-wrap break-words"
          style={{ fontSize: 17, lineHeight: "21.5px", letterSpacing: -0.41, color: p.text, textAlign: "start" }}
        >
          <Linkified text={m.text} color={p.link} />
        </div>
        <LinkCard link={link} p={p} uiDir={uiDir} />
        <div className="flex justify-end" style={{ marginTop: 4 }}>
          {meta()}
        </div>
      </>
    );
  } else {
    padding = 0;
    body = <TextAndTime text={m.text} p={p} meta={meta()} pad="9px 13px" quote={quoteEl} />;
  }

  return wrap(
    <div
      className="relative min-w-0"
      style={{ background: bg, color: p.text, padding, width, maxWidth: "100%", overflow: "hidden", ...radius }}
    >
      {body}
    </div>,
  );
}

/** Viber's call-log bubble: round call glyph | "Missed call" + duration / time | purple call-back button. */
function CallBubble({
  m,
  p,
  s,
  bg,
  radius,
  meta,
  uiDir,
}: {
  m: Message;
  p: Pal;
  s: VbStrings;
  bg: string;
  radius: CSSProperties;
  meta: ReactNode;
  uiDir: "rtl" | "ltr";
}) {
  const video = !!m.call?.video;
  const missed = !!m.call?.missed;
  const red = missed && m.sender === "them";
  const tone = red ? p.likeRed : p.purple;
  const sub = m.call?.duration ? m.call.duration : missed && m.sender === "me" ? s.noAnswer : "";
  return (
    <div className="flex min-w-0 items-center" dir={uiDir} style={{ background: bg, padding: "9px 9px 9px 10px", width: 244, gap: 10, ...radius }}>
      <span
        className="flex shrink-0 items-center justify-center"
        style={{ width: 36, height: 36, borderRadius: 18, background: red ? "rgba(242,66,90,0.14)" : dark(p) ? "rgba(139,124,246,0.2)" : "rgba(115,96,242,0.12)" }}
      >
        <CallGlyph video={video} color={tone} size={18} arrow={red ? "in" : m.sender === "me" ? "out" : "in"} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate" style={{ fontSize: 16, lineHeight: "20px", fontWeight: 600, letterSpacing: -0.32, color: red ? p.likeRed : p.text, textAlign: "start" }}>
          {callTitle(m, s)}
        </div>
        <div className="flex items-center" style={{ gap: 6, marginTop: 1 }}>
          {sub && (
            <span style={{ fontSize: 13, lineHeight: "15px", color: p.quoteText, fontVariantNumeric: "tabular-nums" }}>
              {sub}
            </span>
          )}
          <span style={{ marginInlineStart: sub ? 0 : undefined }}>{meta}</span>
        </div>
      </div>
      {/* call back */}
      <span
        className="flex shrink-0 items-center justify-center"
        style={{ width: 34, height: 34, borderRadius: 17, background: "linear-gradient(45deg, #7360f2 0%, #9161f2 100%)" }}
      >
        <CallGlyph video={video} color="#ffffff" size={17} />
      </span>
    </div>
  );
}

function dark(p: Pal): boolean {
  return p === DARK;
}

/** Handset or camcorder; `arrow` adds the call-log direction arrow. Never mirrored. */
function CallGlyph({ video, color, size, arrow }: { video: boolean; color: string; size: number; arrow?: "in" | "out" }) {
  if (video) {
    return (
      <svg width={size + 3} height={size} viewBox="0 0 28 20" style={{ display: "block" }}>
        <rect x="0.5" y="2" width="19" height="16" rx="4.5" fill={color} />
        <path d="M21.4 8 26 4.9c.6-.4 1.5 0 1.5.8v8.6c0 .8-.9 1.2-1.5.8l-4.6-3.1z" fill={color} />
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: "block" }}>
      <path
        d="M6.3 2.2c.6-.3 1.3-.1 1.7.4l2.5 3.5c.4.6.4 1.4-.1 1.9L8.9 9.6c-.3.3-.3.7-.2 1 .9 1.7 2.9 3.8 4.7 4.8.4.2.8.1 1.1-.2l1.6-1.5c.5-.5 1.3-.5 1.9-.1l3.5 2.5c.6.4.8 1.1.5 1.7l-.8 1.9c-.5 1.2-1.7 2-3 1.9-7.2-.6-13.1-6.5-13.6-13.7-.1-1.3.7-2.5 1.9-3z"
        fill={color}
      />
      {arrow === "in" && <path d="M21.5 2.5 15.6 8.4M15.4 4.4v4.2h4.2" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />}
      {arrow === "out" && <path d="M15.6 8.4l5.9-5.9M17.3 2.4h4.3v4.3" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />}
    </svg>
  );
}

function BanGlyph({ color }: { color: string }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" style={{ display: "block", flexShrink: 0 }}>
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.8" />
      <path d="M5.8 18.2 18.2 5.8" stroke={color} strokeWidth="1.8" />
    </svg>
  );
}

/** Document row: coloured file-type page | name (2 lines) | size · type. */
function FileRow({ file, p }: { file: FileShare; p: Pal }) {
  const ext = extOf(file.name);
  const color = fileColor(ext);
  const metaLine = [file.size, ext ? ext.toUpperCase() : ""].filter(Boolean).join(" · ");
  return (
    <div className="flex items-center" style={{ gap: 10 }}>
      <svg width="38" height="46" viewBox="0 0 38 46" style={{ display: "block", flexShrink: 0 }}>
        <path d="M5 0h20l13 13v28a5 5 0 0 1-5 5H5a5 5 0 0 1-5-5V5a5 5 0 0 1 5-5z" fill={color} />
        <path d="M25 0v8a5 5 0 0 0 5 5h8z" fill="#ffffff" fillOpacity="0.4" />
        <text x="19" y="36" textAnchor="middle" fontSize="10" fontWeight="700" fill="#ffffff" fontFamily="-apple-system, system-ui, sans-serif">
          {(ext || "file").slice(0, 4).toUpperCase()}
        </text>
      </svg>
      <div className="min-w-0 flex-1">
        <div
          dir="ltr"
          className="line-clamp-2 break-all"
          style={{ fontSize: 16, lineHeight: "20px", fontWeight: 500, letterSpacing: -0.32, color: p.text, textAlign: "start" }}
        >
          {file.name}
        </div>
        {metaLine && (
          <div dir="ltr" style={{ fontSize: 13, lineHeight: "17px", color: p.quoteText, marginTop: 1, textAlign: "start" }}>
            {metaLine}
          </div>
        )}
      </div>
    </div>
  );
}

/** URL preview under the text, inside the bubble: picture, bold title, description, site. */
function LinkCard({ link, p, uiDir }: { link: LinkPreview; p: Pal; uiDir: "rtl" | "ltr" }) {
  const site = link.siteName?.trim() || hostOf(link.url);
  return (
    <div style={{ marginTop: 8 }}>
      {link.image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={link.image} alt="" draggable={false} style={{ display: "block", width: "100%", height: 132, objectFit: "cover", borderRadius: 8 }} />
      )}
      <div style={{ marginTop: link.image ? 7 : 0 }}>
        <div
          dir={dirOf(link.title)}
          className="line-clamp-2"
          style={{ fontSize: 15, lineHeight: "19px", fontWeight: 600, letterSpacing: -0.24, color: p.text, textAlign: "start" }}
        >
          {link.title}
        </div>
        {link.description && (
          <div
            dir={dirOf(link.description)}
            className="line-clamp-2"
            style={{ fontSize: 14, lineHeight: "18px", letterSpacing: -0.15, color: p.quoteText, marginTop: 1, textAlign: "start" }}
          >
            {link.description}
          </div>
        )}
        <div dir={uiDir} className="truncate" style={{ fontSize: 13, lineHeight: "17px", color: p.sub, marginTop: 2, textAlign: "start" }}>
          <span dir="ltr">{site}</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Static map snapshot (the location message's thumbnail): city blocks, a park,
 * white streets, a main road and the red drop pin in the middle. Geography
 * never mirrors.
 */
function MapArt({ dark: isDark, h }: { dark: boolean; h: number }) {
  const c = isDark
    ? { base: "#212b37", block: "#29343f", park: "#22423a", water: "#1b3550", road: "#3a4757", main: "#6a5a32", edge: "#18202a" }
    : { base: "#f0ede6", block: "#e5e1d8", park: "#cfe7c3", water: "#b7d9f2", road: "#ffffff", main: "#fbd98c", edge: "#d9d4ca" };
  return (
    <svg width="100%" height={h} viewBox="0 0 240 140" preserveAspectRatio="xMidYMid slice" style={{ display: "block" }}>
      <rect width="240" height="140" fill={c.base} />
      <path d="M0 108c30-6 52 2 76 16 14 8 18 16 18 16H0z" fill={c.water} />
      <rect x="150" y="12" width="62" height="38" rx="4" fill={c.park} />
      {[
        [8, 8, 54, 30],
        [72, 8, 62, 30],
        [8, 50, 54, 34],
        [72, 50, 62, 34],
        [150, 62, 34, 26],
        [196, 62, 40, 26],
        [112, 98, 56, 36],
        [180, 98, 56, 36],
      ].map(([x, y, w, hh], i) => (
        <rect key={i} x={x} y={y} width={w} height={hh} rx="2.5" fill={c.block} />
      ))}
      <g stroke={c.edge} strokeWidth="7.5" fill="none">
        <path d="M0 44h240M0 92h240M66 0v140M142 0v140M188 56v84" />
      </g>
      <g stroke={c.road} strokeWidth="5.5" fill="none">
        <path d="M0 44h240M0 92h240M66 0v140M142 0v140M188 56v84" />
      </g>
      <path d="M-4 128 248 18" stroke={c.edge} strokeWidth="11" />
      <path d="M-4 128 248 18" stroke={c.main} strokeWidth="8.5" />
      {/* pin */}
      <ellipse cx="120" cy="73" rx="6" ry="2.2" fill="rgba(0,0,0,0.22)" />
      <path d="M120 73c-1.2-5.2-11-12.4-11-21.4a11 11 0 0 1 22 0c0 9-9.8 16.2-11 21.4z" fill="#ea4335" stroke="#b3261e" strokeWidth="0.8" />
      <circle cx="120" cy="51.6" r="4" fill="#ffffff" />
    </svg>
  );
}

/**
 * Text + time. A flex row that wraps: when text and time fit on one line they
 * share it (time baseline-aligned at the end); otherwise the text takes the
 * full width and the time drops to its own line, end-aligned, as Viber does.
 */
function TextAndTime({ text, p, meta, pad, quote }: { text: string; p: Pal; meta: ReactNode; pad: string; quote?: ReactNode }) {
  const dir = dirOf(text);
  const row = (
    <div className="flex flex-wrap items-baseline justify-end" style={{ padding: quote ? 0 : pad, columnGap: 10, rowGap: 2 }}>
      <span
        dir={dir}
        className="min-w-0 whitespace-pre-wrap break-words"
        style={{
          flex: "1 1 auto",
          fontSize: 17,
          lineHeight: "21.5px",
          letterSpacing: -0.41,
          color: p.text,
          textAlign: "start",
        }}
      >
        <Linkified text={text} color={p.link} />
      </span>
      {meta}
    </div>
  );
  if (!quote) return row;
  return (
    <div style={{ padding: pad }}>
      {quote}
      {row}
    </div>
  );
}

function Photo({ m, dark }: { m: Message; dark: boolean }) {
  if (m.imageSrc) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={m.imageSrc}
        alt=""
        draggable={false}
        style={{ display: "block", width: "100%", height: 300, objectFit: "cover" }}
      />
    );
  }
  const fg = dark ? "#5d6b7c" : "#b4b4b4";
  return (
    <div className="flex items-center justify-center" style={{ width: "100%", height: 220, background: dark ? "#253140" : "#e6e6e6" }}>
      <svg width="44" height="44" viewBox="0 0 24 24" fill="none">
        <path d="M12 3c5.6 0 9 .9 9 9s-3.4 9-9 9-9-.9-9-9 3.4-9 9-9z" stroke={fg} strokeWidth="1.3" />
        <circle cx="9" cy="9.2" r="1.7" stroke={fg} strokeWidth="1.2" />
        <path d="M3.4 15.6c2.6-2.3 4.6-2.3 6.4-.6 1.7 1.6 2.6.2 4.2-1.6 1.8-2 4.2-1.8 6.6.8" stroke={fg} strokeWidth="1.3" strokeLinecap="round" />
      </svg>
    </div>
  );
}

/** Voice note: purple play disc | grey bars with a purple playhead | transcribe "T"; duration + time below. */
function Voice({ m, p, mine, meta, uiDir }: { m: Message; p: Pal; mine: boolean; meta: ReactNode; uiDir: "rtl" | "ltr" }) {
  const bars = waveform(m.id, 40, 3, 18);
  const wave = mine ? p.waveOut : p.waveIn;
  return (
    <div dir={uiDir} style={{ width: 236 }}>
      <div className="flex items-center" style={{ gap: 9 }}>
        {/* play disc — the triangle keeps pointing right in Arabic */}
        <span
          className="flex shrink-0 items-center justify-center"
          style={{ width: 40, height: 40, borderRadius: 20, background: p.purple }}
        >
          <svg width="14" height="16" viewBox="0 0 14 16" style={{ display: "block", marginLeft: 3 }}>
            <path d="M1.5 1.9c0-1 1.1-1.6 1.9-1l9.4 6.1c.8.5.8 1.6 0 2.1L3.4 15.2c-.8.6-1.9 0-1.9-1z" fill="#ffffff" />
          </svg>
        </span>
        <div className="relative flex min-w-0 flex-1 items-center justify-between" style={{ height: 26 }}>
          <span style={{ width: 2, height: 24, borderRadius: 1, background: p.purple, flexShrink: 0 }} />
          {bars.map((h, i) => (
            <span key={i} style={{ width: 1.6, height: h, borderRadius: 1, background: wave, flexShrink: 0 }} />
          ))}
        </div>
        {/* transcribe */}
        <span
          className="flex shrink-0 items-center justify-center"
          style={{
            width: 26,
            height: 26,
            borderRadius: 13,
            background: "linear-gradient(135deg, #2fc4e6 0%, #4f86ef 55%, #7360f2 100%)",
            color: "#ffffff",
            fontSize: 14,
            fontWeight: 700,
            fontFamily: "Georgia, 'Times New Roman', serif",
            lineHeight: "26px",
          }}
        >
          T
        </span>
      </div>
      <div className="flex items-center justify-between" style={{ marginTop: 2, paddingInlineStart: 49 }}>
        <span style={{ fontSize: 12, lineHeight: "15px", color: mine ? p.timeOut : p.time, fontVariantNumeric: "tabular-nums" }}>
          {m.voiceDuration || "0:07"}
        </span>
        {meta}
      </div>
    </div>
  );
}
