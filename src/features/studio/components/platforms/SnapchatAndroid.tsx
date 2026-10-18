"use client";

/**
 * Snapchat for Android (Samsung One UI device): the 1:1 Chat screen.
 * Self-contained Android implementation (no imports from Snapchat.tsx).
 *
 * Snapchat does not use Material on Android. It ships its own cross-platform
 * design system ("SIG" tokens) and bundles Avenir Next, so the chat is the
 * same bubble-less design as on iOS. What differs on Android is the system
 * chrome (One UI status bar, 3-button nav bar), the 360dp metrics, and the font
 * fallback when Avenir Next isn't installed on the machine rendering the mockup.
 *
 * Key values and sources:
 *  - Palette, from the SIG tokens in Snapchat's own web client CSS
 *    (https://www.snapchat.com/web → cf-st.sc-cdn.net/dw/*.css, :root[theme=light|dark]):
 *      light bg #ffffff, text #16191c, secondary #656d78, tertiary #9a9fa7,
 *        icon #2c3137, secondary button #eceff1, text field rgba(0,0,0,.05)
 *      dark  bg #121212, text #dedede, secondary #999, icon #dedede,
 *        secondary button #2b2b2b, text field rgba(255,255,255,.1), divider rgba(255,255,255,.1)
 *      chat blue (sigChat) #0fadff, snap red #f23c57, snap-with-sound purple #a05dcd.
 *  - 1:1 sender colours, from the web client JS:
 *    `conversationType===ONEONONE ? (sender===me ? "#F23C57" : "#0EADFF")`.
 *  - Strings (en/ar), from the web client translation bundles: "Me"/"أنا",
 *    "Delivered"/"تم التسليم", "Opened"/"تم الفتح", "Sending..."/"جارٍ الإرسال...",
 *    "Send chat"/"أرسل دردشة". The mobile EN placeholder reads "Send a chat".
 *  - Android geometry, measured on the official Google Play chat screenshot
 *    (play.google.com/store/apps/details?id=com.snapchat.android, 1080px export,
 *    360dp phone ≈ 2.33px/dp). Bar 2dp at ~7dp from the edge, text ~9dp after the
 *    bar, label caps ~9dp (≈12.5sp Demi), one-line group pitch ≈ 52dp, avatar
 *    ~36dp, call/video segmented pill 31dp tall (two ~40dp halves, 2dp gap),
 *    camera circle 36dp, field 36dp pill ~186dp wide, three 24dp icons at a ~39dp pitch.
 *    The type is visibly Avenir Next on Android too (bundled), not Roboto.
 *  - Current header (newsroom.snap.com product carousel "Carousel2_Chat"): a back
 *    chevron at the start (it moved from the old end-side ">"), a hairline under
 *    the header, filled phone and camcorder glyphs in the grey pill, and label/text
 *    cap-height ratio ≈ 0.8.
 *  - Entrance: Snapchat's chat list is a stack-from-bottom RecyclerView. With the
 *    default item animator, existing rows shift up (250ms, FastOutSlowIn) while the
 *    new row fades in. Modelled as a 260ms rise of 10px plus fade on
 *    cubic-bezier(.4,0,.2,1), identical in CSS and in `snapchatAndroidMotion`.
 *
 *  - Reactions (newsroom "New features, May 2024", Emoji_Reactions.mp4): the
 *    reactor's Bitmoji composed with the emoji (emoji behind at the upper start,
 *    Bitmoji in front at the lower end), ~32dp, directly under the reacted chat at
 *    the bar's edge, outside the bar. Web bundle: reactions list follows the
 *    message, items aspect-ratio 15/16.
 *  - Replies (newsroom "New messaging tools" 2022 asset + web quote component
 *    `.MJ6mo`): a full-width card inside the replier's bar, above the reply text —
 *    margin 4px 0, padding 4px 8px, 0.5px #eaedef / rgba(255,255,255,.1) border,
 *    radius 10, #fff / #1e1e1e fill — with the quoted sender's uppercase label in
 *    their colour ("ME" for mine) and the quoted chat behind a 2dp bar.
 *  - Compose (web composer `.euyIb`): 22px lines, min-height 36–38, max ≈4 lines
 *    then it scrolls; caret colour = my chat colour (#f23c57); with text the send
 *    arrow (#0fadff, mirrored in RTL) replaces the mic at the field's end, the
 *    camera glyph becomes camera-with-"T", and the sticker/memories/rocket icons
 *    collapse so the field spans the row. Mobile placeholder casing: "Send a Chat"
 *    (Play Store chat screenshot).
 *
 * Round 5 (groups, new kinds, keyboard), from the same web client bundle:
 *  - Groups: label/bar colour is the member's server-assigned `participant.color`
 *    (not in the client) → stable stand-in palette by member index (GROUP_COLORS);
 *    header = group name + members' Bitmoji cluster, "{n} Members" /
 *    "{n} من الأعضاء"; presence row shows each present member's Bitmoji + pill.
 *  - Deleted chat → centred status message (`.ijyxU`: uppercase 9.5px/500,
 *    letter-spacing 1px, --sigTextSecondary): "{USER} DELETED A CHAT" /
 *    "YOU DELETED A CHAT" (ar "تم حذف رسالة دردشة من قِبل {user}" / "لقد حذفت رسالة دردشة").
 *  - Edited → "(Edited)" / "(تم التعديل)" in the message header (`.GUB_w`, gap 5px), grey.
 *  - Link: URL underlined in the text colour (`.CFuC2`); preview card after the
 *    text (`.Zxfed`: 1px --sigDisabled border, --sigSurface, radius 10; 50×50 tile
 *    radius 10 margin 10; title 15/600 2 lines; site 12/500 grey at .67). Files and
 *    calls reuse that card. Calls: "Missed Audio Call" / "Missed Video Chat".
 *  - Keyboard: the screen pads its bottom by the keyboard inset (composer sits on
 *    the keyboard, the thread shrinks and stays pinned to the newest chat).
 *
 * RTL: the whole screen mirrors (bar and label on the right, back chevron
 * points right, the send/receipt arrow flips). Phone, camcorder, camera, mic,
 * sticker, memories and rocket glyphs and the voice-note play triangle do NOT mirror.
 */

import { useEffect, type CSSProperties, type ReactNode, type RefObject } from "react";

import type { DeliveryStatus, Message, Person, Scenario } from "../../types";
import { Avatar, dirOf, SystemBottomBar, useChatScroll } from "../shared";
import { SamsungStatusBar } from "../devices/SamsungStatusBar";
import { useKeyboardInset } from "../devices/keyboard-context";
import { CHROME, type Lang } from "./chrome";
import type { PlatformMotion, PlatformProps } from "./types";

/* --------------------------------- tokens --------------------------------- */

const ME_RED = "#f23c57";
const THEM_BLUE = "#0eadff";
const CHAT_BLUE = "#0fadff";

interface Pal {
  bg: string;
  text: string;
  sub: string;
  placeholder: string;
  icon: string;
  button: string;
  field: string;
  divider: string;
  voice: string;
  nav: string;
  quoteBg: string;
  quoteBorder: string;
  /** --sigPlaceholder tile behind link / file / call cards */
  thumb: string;
  mapLand: string;
  mapBlock: string;
  mapRoad: string;
  mapPark: string;
  mapWater: string;
}

function palette(dark: boolean): Pal {
  return dark
    ? {
        bg: "#121212",
        text: "#dedede",
        sub: "#999999",
        placeholder: "#8c8c8c",
        icon: "#dedede",
        button: "#2b2b2b",
        field: "#2a2a2a",
        divider: "#2a2a2a",
        voice: "#2a2a2a",
        nav: "#ffffff",
        quoteBg: "#1e1e1e",
        quoteBorder: "rgba(255,255,255,0.1)",
        thumb: "#2b2b2b",
        mapLand: "#232a33",
        mapBlock: "#2b333d",
        mapRoad: "#3b4552",
        mapPark: "#1f3a2c",
        mapWater: "#16304a",
      }
    : {
        bg: "#ffffff",
        text: "#16191c",
        sub: "#656d78",
        placeholder: "#9a9fa7",
        icon: "#2c3137",
        button: "#eceff1",
        field: "#f2f2f2",
        divider: "#ebebeb",
        voice: "#f2f2f2",
        nav: "#000000",
        quoteBg: "#ffffff",
        quoteBorder: "#e3e6e9",
        thumb: "#f1f2f4",
        mapLand: "#eef0eb",
        mapBlock: "#e2e5dd",
        mapRoad: "#ffffff",
        mapPark: "#cdebc4",
        mapWater: "#a9dcf5",
      };
}

/** Group member colours (stand-in for Snapchat's server-assigned participant colours), by member index. */
const GROUP_COLORS = ["#A05DCD", "#11A866", "#F7861C", "#0EADFF", "#E5458F", "#00A3A6", "#6F6CF2", "#C99A00"];
const MISSED_RED = "#f23c57";

/** Same stacks the device-font setting maps to (data/fonts), copied to stay self-contained. */
const DEVICE_FONTS: Record<string, string> = {
  roboto: "var(--font-roboto), var(--font-tajawal), system-ui, sans-serif",
  cairo: "var(--font-cairo), system-ui, sans-serif",
  tajawal: "var(--font-tajawal), system-ui, sans-serif",
};

/** Snapchat bundles Avenir Next on Android; fall back to the device font (also for Arabic glyphs). */
function snapFont(androidFont: string): string {
  return `"Avenir Next", "AvenirNext", "Avenir Next LT Pro", ${DEVICE_FONTS[androidFont] ?? DEVICE_FONTS.roboto}`;
}

interface Strings {
  me: string;
  sendAChat: string;
  sending: string;
  delivered: string;
  opened: string;
  today: string;
  edited: string;
  youDeleted: string;
  deletedBy: (name: string) => string;
  missedAudio: string;
  missedVideo: string;
  audioCall: string;
  videoChat: string;
  tapToCallBack: string;
  noAnswer: string;
  liveLocation: string;
  members: (n: number) => string;
  deletedQuote: string;
}

const STR: Record<Lang, Strings> = {
  en: {
    me: "Me",
    sendAChat: "Send a Chat",
    sending: "Sending...",
    delivered: CHROME.en.snapDelivered,
    opened: CHROME.en.snapOpened,
    today: CHROME.en.today,
    edited: "(Edited)",
    youDeleted: "YOU DELETED A CHAT",
    deletedBy: (n) => `${n.toUpperCase()} DELETED A CHAT`,
    missedAudio: "Missed Audio Call",
    missedVideo: "Missed Video Chat",
    audioCall: "Audio Call",
    videoChat: "Video Chat",
    tapToCallBack: "Tap to call back",
    noAnswer: "No answer",
    liveLocation: "Live Location",
    members: (n) => `${n} Members`,
    deletedQuote: "This message was deleted",
  },
  ar: {
    me: "أنا",
    sendAChat: "أرسل دردشة",
    sending: "جارٍ الإرسال...",
    delivered: CHROME.ar.snapDelivered,
    opened: CHROME.ar.snapOpened,
    today: CHROME.ar.today,
    edited: "(تم التعديل)",
    youDeleted: "لقد حذفت رسالة دردشة",
    deletedBy: (n) => `تم حذف رسالة دردشة من قِبل ${n}`,
    missedAudio: "مكالمة صوتية فائتة",
    missedVideo: "دردشة فيديو فائتة",
    audioCall: "مكالمة صوتية",
    videoChat: "دردشة فيديو",
    tapToCallBack: "انقر لمعاودة الاتصال",
    noAnswer: "لم يتم الرد",
    liveLocation: "الموقع المباشر",
    members: (n) => `${n} من الأعضاء`,
    deletedQuote: "تم حذف هذه الرسالة",
  },
};

/* ------------------------------ group helpers ------------------------------ */

function authorOf(scenario: Scenario, m: Message): { person: Person; index: number } {
  const g = scenario.group;
  if (g && g.members.length > 0) {
    const idx = Math.min(Math.max(0, m.authorIndex ?? 0), g.members.length - 1);
    return { person: g.members[idx], index: idx };
  }
  return { person: scenario.them, index: -1 };
}

function themColor(index: number): string {
  return index < 0 ? THEM_BLUE : GROUP_COLORS[index % GROUP_COLORS.length];
}

/** Runs split per sender (per member in groups), at status rows and at edited chats (their header carries "(Edited)"). */
function runs(messages: Message[], i: number, group: boolean): { first: boolean; last: boolean } {
  const m = messages[i];
  const prev = messages[i - 1];
  const next = messages[i + 1];
  const key = (x: Message) => (x.sender === "me" ? "me" : group ? `t${x.authorIndex ?? 0}` : "t");
  return {
    first: !prev || prev.type === "deleted" || key(prev) !== key(m) || !!m.edited,
    last: !next || next.type === "deleted" || key(next) !== key(m) || !!next.edited,
  };
}

function typingAuthor(scenario: Scenario, shown: Message[]): number {
  const lastShown = shown[shown.length - 1];
  const from = lastShown ? scenario.messages.findIndex((x) => x.id === lastShown.id) + 1 : 0;
  return scenario.messages.slice(from).find((x) => x.sender === "them")?.authorIndex ?? 0;
}

/** URL ranges underlined in the text colour (Snapchat `.CFuC2`). */
function linkify(text: string): ReactNode {
  const re = /(https?:\/\/[^\s]+|www\.[^\s]+)/g;
  const out: ReactNode[] = [];
  let last = 0;
  let k = 0;
  for (let mt = re.exec(text); mt; mt = re.exec(text)) {
    if (mt.index > last) out.push(text.slice(last, mt.index));
    out.push(
      <span key={k++} style={{ textDecoration: "underline", textUnderlineOffset: 2 }}>
        {mt[0]}
      </span>,
    );
    last = mt.index + mt[0].length;
  }
  if (out.length === 0) return text;
  if (last < text.length) out.push(text.slice(last));
  return out;
}

/** Keep the newest chat in view while the thread shrinks (keyboard rising). */
function useBottomAnchor(ref: RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    let lastH = el.clientHeight;
    const ro = new ResizeObserver(() => {
      const h = el.clientHeight;
      if (h < lastH) el.scrollTop += lastH - h;
      lastH = h;
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
}

/* --------------------------------- metrics -------------------------------- */

const SIDE = 7; // bar / label inset from the screen edge
const BAR = 2;
const TEXT_GAP = 9; // bar -> text
const TEXT_SIZE = 16.5;
const TEXT_LINE = 22;
const LABEL_SIZE = 12.5;
const LABEL_LINE = 16;
const GROUP_GAP = 11;

/* --------------------------------- motion --------------------------------- */

/** CSS cubic-bezier(x1,y1,x2,y2) evaluated at progress x. */
function cubicBezier(x1: number, y1: number, x2: number, y2: number) {
  const bx = (t: number) => 3 * (1 - t) * (1 - t) * t * x1 + 3 * (1 - t) * t * t * x2 + t * t * t;
  const by = (t: number) => 3 * (1 - t) * (1 - t) * t * y1 + 3 * (1 - t) * t * t * y2 + t * t * t;
  return (x: number) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let lo = 0;
    let hi = 1;
    for (let i = 0; i < 24; i++) {
      const mid = (lo + hi) / 2;
      if (bx(mid) < x) lo = mid;
      else hi = mid;
    }
    return by((lo + hi) / 2);
  };
}

const ENTER_MS = 260;
const ENTER_RISE = 10;
const fastOutSlowIn = cubicBezier(0.4, 0, 0.2, 1);

export const snapchatAndroidMotion: PlatformMotion = {
  enterMs: ENTER_MS,
  enterStyle: (p) => {
    const e = fastOutSlowIn(Math.min(1, Math.max(0, p)));
    return { opacity: e, transform: `translateY(${((1 - e) * ENTER_RISE).toFixed(2)}px)` };
  },
};

const DOT_CYCLE = 1200;
const DOT_STAGGER = 150;

/** Typing-dot state at a given clock (mirrors the linear `snapand-dot` keyframes). */
function dotAt(ms: number, i: number): { opacity: number; y: number } {
  const ph = ((((ms - i * DOT_STAGGER) % DOT_CYCLE) + DOT_CYCLE) % DOT_CYCLE) / DOT_CYCLE;
  if (ph < 0.3) {
    const t = ph / 0.3;
    return { opacity: 0.35 + 0.65 * t, y: -2.5 * t };
  }
  if (ph < 0.6) {
    const t = (ph - 0.3) / 0.3;
    return { opacity: 1 - 0.65 * t, y: -2.5 * (1 - t) };
  }
  return { opacity: 0.35, y: 0 };
}

/** Android EditText cursor blink: 500ms on / 500ms off (Editor.BLINK = 500). */
const CARET_MS = 1000;

const KEYFRAMES = `
@keyframes snapand-enter{from{opacity:0;transform:translateY(${ENTER_RISE}px)}to{opacity:1;transform:translateY(0)}}
@keyframes snapand-fade{from{opacity:0}to{opacity:1}}
@keyframes snapand-peek{from{transform:translateY(100%)}to{transform:translateY(0)}}
@keyframes snapand-dot{0%{opacity:.35;transform:translateY(0)}30%{opacity:1;transform:translateY(-2.5px)}60%{opacity:.35;transform:translateY(0)}100%{opacity:.35;transform:translateY(0)}}
.snapand-enter{animation:snapand-enter ${ENTER_MS}ms cubic-bezier(.4,0,.2,1) both}
.snapand-fade{animation:snapand-fade 200ms linear both}
.snapand-peek{animation:snapand-peek 260ms cubic-bezier(.4,0,.2,1) both}
.snapand-dot{animation:snapand-dot ${DOT_CYCLE}ms linear infinite}
@keyframes snapand-caret{0%{opacity:1}50%{opacity:0}}
.snapand-caret{animation:snapand-caret ${CARET_MS}ms step-end infinite}
@keyframes snapand-send{from{opacity:0;transform:translateX(-70%)}to{opacity:1;transform:none}}
@keyframes snapand-send-rtl{from{opacity:0;transform:translateX(70%)}to{opacity:1;transform:none}}
.snapand-send{animation:snapand-send 180ms cubic-bezier(.4,0,.2,1) both}
.snapand-send-rtl{animation:snapand-send-rtl 180ms cubic-bezier(.4,0,.2,1) both}
`;

/* --------------------------------- glyphs --------------------------------- */

function BackChevron({ color }: { color: string }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="shrink-0 rtl:-scale-x-100">
      <path d="M15 4.8 7.8 12l7.2 7.2" stroke={color} strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PhoneGlyph({ color }: { color: string }) {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24">
      <path
        fill={color}
        d="M6.6 2.6c.6-.2 1.3 0 1.6.6l1.9 3.6c.3.6.2 1.3-.3 1.7L8.3 9.8c-.3.3-.4.7-.2 1.1.9 1.8 2.3 3.3 4.1 4.3.4.2.8.1 1.1-.2l1.3-1.5c.4-.5 1.1-.6 1.7-.3l3.6 1.8c.6.3.9 1 .7 1.6l-.6 2.2c-.3 1.1-1.3 1.9-2.5 1.8C9.9 20 4 14.2 3.5 6.6c-.1-1.2.7-2.2 1.8-2.6l1.3-1.4z"
      />
    </svg>
  );
}

function CamcorderGlyph({ color }: { color: string }) {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24">
      <rect x="1.8" y="5.6" width="14.4" height="12.8" rx="3.4" fill={color} />
      <path fill={color} d="M17.4 10.1 21 7.9c.7-.4 1.5.1 1.5.9v6.4c0 .8-.8 1.3-1.5.9l-3.6-2.2z" />
    </svg>
  );
}

function CameraGlyph({ color }: { color: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24">
      <path
        fill={color}
        fillRule="evenodd"
        d="M9.3 3.8h5.4c.6 0 1.2.3 1.5.8l1 1.6h2.1a2.7 2.7 0 0 1 2.7 2.7v8.6a2.7 2.7 0 0 1-2.7 2.7H4.7A2.7 2.7 0 0 1 2 17.5V8.9a2.7 2.7 0 0 1 2.7-2.7h2.1l1-1.6c.3-.5.9-.8 1.5-.8zM12 8.7a4.4 4.4 0 1 0 0 8.8 4.4 4.4 0 0 0 0-8.8z"
      />
      <circle cx="12" cy="13.1" r="2.6" fill={color} />
    </svg>
  );
}

function MicGlyph({ color }: { color: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <rect x="8.6" y="2.6" width="6.8" height="12" rx="3.4" fill={color} />
      <path d="M5.6 11.2a6.4 6.4 0 0 0 12.8 0M12 17.8v3.4" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/** Sticker / emoji button: outlined smiley. */
function SmileyGlyph({ color }: { color: string }) {
  return (
    <svg width="25" height="25" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9.6" stroke={color} strokeWidth="2.1" />
      <ellipse cx="8.9" cy="9.9" rx="1.25" ry="1.55" fill={color} />
      <ellipse cx="15.1" cy="9.9" rx="1.25" ry="1.55" fill={color} />
      <path d="M7.6 13.6c1 2.1 2.6 3.2 4.4 3.2s3.4-1.1 4.4-3.2" stroke={color} strokeWidth="2.1" strokeLinecap="round" />
    </svg>
  );
}

/** Memories: two tilted photo cards. */
function MemoriesGlyph({ color, bg }: { color: string; bg: string }) {
  return (
    <svg width="25" height="25" viewBox="0 0 24 24" fill="none">
      <rect x="2.4" y="4.6" width="10" height="15" rx="2.4" transform="rotate(-10 7.4 12.1)" stroke={color} strokeWidth="2" />
      <g transform="rotate(8 15.2 11.6)">
        <rect x="9.6" y="3.6" width="11" height="16" rx="2.4" fill={bg} stroke={color} strokeWidth="2" />
        <path d="m12.2 16.6 2.6-3.2 2.4 3.2" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="17.2" cy="8.4" r="1.3" fill={color} />
      </g>
    </svg>
  );
}

/** Games & Minis rocket. */
function RocketGlyph({ color }: { color: string }) {
  return (
    <svg width="25" height="25" viewBox="0 0 24 24" fill="none">
      <path
        d="M9.6 15.6 8.4 14.4c1.6-5.6 5.9-9.6 12.2-10.9-1.3 6.3-5.3 10.6-10.9 12.2z"
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle cx="15.1" cy="9" r="1.7" fill={color} />
      <path
        d="M8.6 9.5H5.3L3 12.6l4.4.7M14.5 15.4v3.3L11.4 21l-.7-4.4M6.3 16.2c-1.3.4-2.2 1.6-2.4 4.2 2.6-.2 3.8-1.1 4.2-2.4"
        stroke={color}
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Snapchat chat arrow (filled = delivered, hollow = opened). Flips with the UI direction. */
function ChatArrow({ opened, color, size = 11 }: { opened: boolean; color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className="shrink-0 rtl:-scale-x-100">
      <path
        d="M2.3 2.2 14.2 8 2.3 13.8 4.8 8z"
        fill={opened ? "none" : color}
        stroke={color}
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Camera button once text is typed: camera with a "T" knocked out (send the text as a Snap). Production path. */
function CameraTextGlyph({ color }: { color: string }) {
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

/** Send arrow (production glyph); mirrors in RTL. */
function SendArrowGlyph({ color }: { color: string }) {
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

/** Reaction: the reactor's Bitmoji (avatar) in front of the emoji; 15:16 box, ~32dp tall. */
function Reaction({ emoji, person, ring }: { emoji: string; person: Person; ring: string }) {
  return (
    <div className="relative shrink-0" style={{ width: 30, height: 32 }} aria-label={emoji}>
      <span
        className="absolute select-none"
        style={{ top: 0, insetInlineStart: -1, fontSize: 21, lineHeight: "23px", fontFamily: "'Noto Color Emoji', 'Segoe UI Emoji', 'Apple Color Emoji', sans-serif" }}
      >
        {emoji}
      </span>
      <span className="absolute flex rounded-full" style={{ bottom: 0, insetInlineEnd: 0, padding: 1.5, background: ring }}>
        <Avatar person={person} size={17} />
      </span>
    </div>
  );
}

function QuoteBody({ target, accent, pal, textAlign }: { target: Message; accent: string; pal: Pal; textAlign: CSSProperties["textAlign"] }) {
  const snippet: CSSProperties = {
    color: pal.text,
    fontSize: 15.5,
    lineHeight: "20px",
    fontWeight: 400,
    overflowWrap: "anywhere",
    display: "-webkit-box",
    WebkitBoxOrient: "vertical",
    WebkitLineClamp: 2,
    overflow: "hidden",
    textAlign,
  };
  if (target.type === "voice") {
    return (
      <div className="flex items-center" style={{ height: 24, gap: 8 }}>
        <span className="flex shrink-0 items-center justify-center rounded-full" style={{ width: 20, height: 20, background: accent }}>
          <svg width="9" height="9" viewBox="0 0 24 24" style={{ transform: "translateX(1px)" }}>
            <path fill="#ffffff" d="M7 4.6v14.8c0 .9 1 1.4 1.7.9l11-7.4a1.1 1.1 0 0 0 0-1.8l-11-7.4C8 3.2 7 3.7 7 4.6z" />
          </svg>
        </span>
        <span className="flex items-center" style={{ height: 16, gap: 2 }} dir="ltr">
          {WAVE.slice(0, 14).map((h, i) => (
            <span key={i} className="shrink-0" style={{ width: 2, height: Math.max(3, h * 0.7), borderRadius: 1, background: accent, opacity: 0.55 }} />
          ))}
        </span>
        <span className="tabular-nums" style={{ color: pal.sub, fontSize: 12, fontWeight: 600 }}>
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
          <span className="shrink-0" style={{ width: 36, height: 48, borderRadius: 5, background: pal.field }} />
        )}
        {cap && (
          <span className="min-w-0 flex-1" dir={dirOf(cap)} style={snippet}>
            {cap}
          </span>
        )}
      </div>
    );
  }
  const alt =
    target.type === "deleted"
      ? textAlign === "right"
        ? STR.ar.deletedQuote
        : STR.en.deletedQuote
      : target.type === "location"
        ? `📍 ${target.location?.title ?? ""}`
        : target.type === "file"
          ? `📄 ${target.file?.name ?? ""}`
          : target.type === "call"
            ? target.call?.video
              ? "📹"
              : "📞"
            : target.text;
  return (
    <div dir={dirOf(alt)} style={{ ...snippet, ...(target.type === "deleted" ? { color: pal.sub, fontStyle: "italic" } : null) }}>
      {alt}
    </div>
  );
}

/** Quoted-reply card inside the replier's bar, above the reply. */
function QuoteCard({ target, label, accent, pal, textAlign }: { target: Message; label: string; accent: string; pal: Pal; textAlign: CSSProperties["textAlign"] }) {
  return (
    <div style={{ marginTop: 3, marginBottom: 6, padding: "0 8px 7px", border: `0.5px solid ${pal.quoteBorder}`, borderRadius: 10, background: pal.quoteBg }}>
      <div
        className="truncate uppercase"
        style={{ color: accent, fontSize: LABEL_SIZE - 0.5, lineHeight: "16px", fontWeight: 600, letterSpacing: "0.02em", marginTop: 6, marginBottom: 3 }}
      >
        {label}
      </div>
      <div className="flex items-stretch">
        <span className="shrink-0" style={{ width: BAR, borderRadius: 1, background: accent }} />
        <div className="min-w-0 flex-1" style={{ paddingInlineStart: 8, paddingBlock: 1 }}>
          <QuoteBody target={target} accent={accent} pal={pal} textAlign={textAlign} />
        </div>
      </div>
    </div>
  );
}

/* ------------------------------ message parts ------------------------------ */

const EMOJI_ONLY = /^(?:\p{Extended_Pictographic}(?:️|\p{Emoji_Modifier}|‍\p{Extended_Pictographic}️?)*\s*){1,3}$/u;

function isEmojiOnly(text: string): boolean {
  const t = text.trim();
  return t.length > 0 && EMOJI_ONLY.test(t);
}

const WAVE = [5, 9, 13, 8, 15, 11, 18, 12, 7, 14, 17, 10, 6, 12, 16, 9, 13, 7, 11, 8, 5];

function VoiceNote({ accent, pal, duration }: { accent: string; pal: Pal; duration?: string }) {
  return (
    <div
      className="inline-flex items-center"
      style={{ background: pal.voice, borderRadius: 20, height: 40, paddingInlineStart: 6, paddingInlineEnd: 14, gap: 10, minWidth: 214 }}
    >
      {/* Play triangle never mirrors. */}
      <span className="flex shrink-0 items-center justify-center rounded-full" style={{ width: 28, height: 28, background: accent }}>
        <svg width="12" height="12" viewBox="0 0 24 24" style={{ marginInlineStart: 0, transform: "translateX(1px)" }}>
          <path fill="#ffffff" d="M7 4.6v14.8c0 .9 1 1.4 1.7.9l11-7.4a1.1 1.1 0 0 0 0-1.8l-11-7.4C8 3.2 7 3.7 7 4.6z" />
        </svg>
      </span>
      <span className="flex flex-1 items-center" style={{ height: 22, gap: 2.5 }}>
        {WAVE.map((h, i) => (
          <span key={i} className="shrink-0" style={{ width: 2.5, height: h, borderRadius: 2, background: accent, opacity: 0.55 }} />
        ))}
      </span>
      <span className="shrink-0 tabular-nums" style={{ color: pal.sub, fontSize: 12.5, fontWeight: 600 }}>
        {duration || "0:08"}
      </span>
    </div>
  );
}

function ChatImage({ src, pal }: { src?: string | null; pal: Pal }) {
  if (!src) {
    return (
      <div
        className="flex items-center justify-center"
        style={{ width: 200, height: 260, borderRadius: 10, background: pal.field }}
      >
        <svg width="34" height="34" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="4" width="18" height="16" rx="3" stroke={pal.placeholder} strokeWidth="1.8" />
          <circle cx="9" cy="9.5" r="1.7" fill={pal.placeholder} />
          <path d="m4.5 18 5-5.2 3.4 3.4 2.4-2.4 4.2 4.2" stroke={pal.placeholder} strokeWidth="1.8" strokeLinejoin="round" />
        </svg>
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      draggable={false}
      className="block object-cover"
      style={{ width: 200, maxWidth: "100%", height: 266, borderRadius: 10 }}
    />
  );
}

/* ------------------------------- cards (r5) ------------------------------- */

/** Snapchat attachment card (`.Zxfed`): 50×50 tile, 2-line title, grey subtitle. */
function Card({ pal, tile, title, subtitle, titleColor }: { pal: Pal; tile: ReactNode; title: ReactNode; subtitle?: ReactNode; titleColor?: string }) {
  return (
    <div className="flex items-center" style={{ border: `1px solid ${pal.quoteBorder}`, background: pal.quoteBg, borderRadius: 10, marginBlock: 5, maxWidth: 310 }}>
      <div
        className="relative flex shrink-0 items-center justify-center overflow-hidden"
        style={{ width: 50, height: 50, margin: 10, borderRadius: 10, background: pal.thumb }}
      >
        {tile}
      </div>
      <div className="min-w-0 flex-1" style={{ marginInlineEnd: 10, paddingBlock: 6 }}>
        <div
          style={{
            color: titleColor ?? pal.text,
            fontSize: 15,
            lineHeight: "20px",
            fontWeight: 600,
            display: "-webkit-box",
            WebkitBoxOrient: "vertical",
            WebkitLineClamp: 2,
            overflow: "hidden",
            overflowWrap: "anywhere",
            textAlign: "start",
          }}
        >
          {title}
        </div>
        {subtitle && (
          <div className="truncate" style={{ color: pal.sub, opacity: 0.67, fontSize: 12, lineHeight: "16px", fontWeight: 500, marginTop: 1, textAlign: "start" }}>
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );
}

function LinkCard({ link, pal }: { link: NonNullable<Message["link"]>; pal: Pal }) {
  const site = link.siteName || link.url.replace(/^https?:\/\//, "").replace(/^www\./, "").split(/[/?#]/)[0];
  return (
    <Card
      pal={pal}
      tile={
        link.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={link.image} alt="" draggable={false} className="block h-full w-full object-cover" style={{ borderRadius: 6, border: `0.5px solid ${pal.quoteBorder}` }} />
        ) : (
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
            <path
              d="M10.2 13.8a3.6 3.6 0 0 0 5.1 0l3.2-3.2a3.6 3.6 0 0 0-5.1-5.1l-1.1 1.1M13.8 10.2a3.6 3.6 0 0 0-5.1 0l-3.2 3.2a3.6 3.6 0 0 0 5.1 5.1l1.1-1.1"
              stroke={pal.sub}
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        )
      }
      title={<span dir={dirOf(link.title)}>{link.title}</span>}
      subtitle={<bdi>{site}</bdi>}
    />
  );
}

function fileExt(name: string): string {
  const i = name.lastIndexOf(".");
  return i > 0 ? name.slice(i + 1).toUpperCase() : "FILE";
}

/** Document glyph: folded page with the type label (PDF red, DOC blue, XLS green…). */
function DocGlyph({ ext }: { ext: string }) {
  const fill =
    ext === "PDF" ? "#E5252A" : /^DOCX?$/.test(ext) ? "#2B65D9" : /^(XLSX?|CSV)$/.test(ext) ? "#1E9E57" : /^PPTX?$/.test(ext) ? "#E5612A" : "#5B6470";
  return (
    <svg width="30" height="36" viewBox="0 0 30 36" fill="none">
      <path d="M4 0h15l11 11v21a4 4 0 0 1-4 4H4a4 4 0 0 1-4-4V4a4 4 0 0 1 4-4Z" fill={fill} />
      <path d="M19 0v7a4 4 0 0 0 4 4h7" fill="#ffffff" fillOpacity="0.35" />
      <text x="15" y="28" textAnchor="middle" fontSize={ext.length > 3 ? 7 : 8.5} fontWeight="800" fill="#ffffff" fontFamily="Roboto, system-ui, sans-serif">
        {ext.slice(0, 4)}
      </text>
    </svg>
  );
}

function FileCard({ file, pal }: { file: NonNullable<Message["file"]>; pal: Pal }) {
  const ext = fileExt(file.name);
  const parts = [file.pages, file.size, ext].filter((x): x is string => !!x);
  return (
    <Card
      pal={pal}
      tile={<DocGlyph ext={ext} />}
      title={<bdi>{file.name}</bdi>}
      subtitle={parts.map((p, k) => (
        <span key={k}>
          {k > 0 && " · "}
          <bdi>{p}</bdi>
        </span>
      ))}
    />
  );
}

function CallCard({ call, mine, pal, s }: { call: NonNullable<Message["call"]>; mine: boolean; pal: Pal; s: Strings }) {
  const missedIn = call.missed && !mine;
  const title = missedIn ? (call.video ? s.missedVideo : s.missedAudio) : call.video ? s.videoChat : s.audioCall;
  const detail = call.missed ? (mine ? s.noAnswer : s.tapToCallBack) : call.duration || "0:00";
  const glyph = missedIn ? MISSED_RED : pal.icon;
  return (
    <Card
      pal={pal}
      tile={call.video ? <CamcorderGlyph color={glyph} /> : <PhoneGlyph color={glyph} />}
      title={title}
      titleColor={missedIn ? MISSED_RED : undefined}
      subtitle={<span className="tabular-nums">{detail}</span>}
    />
  );
}

function MapTile({ pal, seed }: { pal: Pal; seed: string }) {
  let h = 7;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const dx = (h % 40) - 20;
  return (
    <svg width="100%" height="100%" viewBox="0 0 300 150" preserveAspectRatio="xMidYMid slice" className="block" aria-hidden>
      <rect width="300" height="150" fill={pal.mapLand} />
      <g transform={`translate(${dx} 0)`}>
        <path d="M-40 118c60-14 118-6 170 10s118 18 190-6v60H-40Z" fill={pal.mapWater} />
        <rect x="18" y="14" width="62" height="40" rx="5" fill={pal.mapBlock} />
        <rect x="96" y="12" width="48" height="44" rx="5" fill={pal.mapPark} />
        <rect x="162" y="16" width="70" height="36" rx="5" fill={pal.mapBlock} />
        <rect x="248" y="10" width="60" height="46" rx="5" fill={pal.mapBlock} />
        <rect x="10" y="70" width="80" height="34" rx="5" fill={pal.mapBlock} />
        <rect x="106" y="72" width="56" height="30" rx="5" fill={pal.mapBlock} />
        <rect x="178" y="70" width="44" height="34" rx="5" fill={pal.mapPark} />
        <rect x="238" y="72" width="70" height="30" rx="5" fill={pal.mapBlock} />
        <path d="M-40 62h400M-40 112c80-6 160-2 380 2M88 -10v170M154 -10l14 170M232 -10l-6 170" stroke={pal.mapRoad} strokeWidth="7" strokeLinecap="round" />
        <path d="M-40 62h400" stroke={pal.mapRoad} strokeWidth="11" />
        <path d="M40 -10 300 150" stroke={pal.mapRoad} strokeWidth="4" opacity="0.8" />
      </g>
    </svg>
  );
}

/** Snap Map location card: the sharer's Bitmoji on the map tile, then place + address (live: "Live Location"). */
function LocationCard({ loc, person, pal, s, seed }: { loc: NonNullable<Message["location"]>; person: Person; pal: Pal; s: Strings; seed: string }) {
  return (
    <div className="overflow-hidden" style={{ border: `1px solid ${pal.quoteBorder}`, background: pal.quoteBg, borderRadius: 10, marginBlock: 5, width: "min(100%, 250px)" }}>
      <div className="relative" style={{ height: 128 }}>
        <MapTile pal={pal} seed={seed} />
        <span className="absolute flex flex-col items-center" style={{ left: "50%", top: 27, transform: "translateX(-50%)" }}>
          <span className="flex rounded-full" style={{ padding: 2.5, background: "#ffffff", boxShadow: "0 2px 6px rgba(0,0,0,0.25)" }}>
            <Avatar person={person} size={38} />
          </span>
          <span style={{ width: 10, height: 4, borderRadius: "50%", background: "rgba(0,0,0,0.22)", marginTop: 4 }} />
        </span>
      </div>
      <div style={{ padding: "8px 12px 10px" }}>
        <div className="truncate" style={{ color: pal.text, fontSize: 15, lineHeight: "20px", fontWeight: 600, textAlign: "start" }}>
          <bdi>{loc.title}</bdi>
        </div>
        {(loc.live || loc.subtitle) && (
          <div className="flex items-center" style={{ gap: 5, marginTop: 1 }}>
            {loc.live && <span className="shrink-0 rounded-full" style={{ width: 7, height: 7, background: CHAT_BLUE }} />}
            <span className="truncate" style={{ color: loc.live ? CHAT_BLUE : pal.sub, fontSize: 12, lineHeight: "16px", fontWeight: loc.live ? 600 : 500 }}>
              {loc.live ? s.liveLocation : loc.subtitle}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function Sticker({ m }: { m: Message }) {
  if (m.imageSrc) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={m.imageSrc} alt="" draggable={false} className="block object-contain" style={{ width: 116, height: 116, marginBlock: 2 }} />
    );
  }
  return (
    <div
      className="select-none"
      style={{ fontSize: 76, lineHeight: "94px", height: 94, fontFamily: "'Noto Color Emoji', 'Segoe UI Emoji', 'Apple Color Emoji', sans-serif", textAlign: "start" }}
    >
      {m.text.trim() || "🙂"}
    </div>
  );
}

/** Group avatar: members' Bitmoji cluster (back one up-end, front one down-start). */
function GroupAvatar({ group, size, ring }: { group: NonNullable<Scenario["group"]>; size: number; ring: string }) {
  if (group.avatar) return <Avatar person={{ name: group.name, avatar: group.avatar }} size={size} />;
  const a = group.members[0] ?? { name: group.name, avatar: null };
  const b = group.members[1];
  if (!b) return <Avatar person={a} size={size} />;
  const sub = Math.round(size * 0.7);
  return (
    <span className="relative block shrink-0" style={{ width: size, height: size }}>
      <span className="absolute" style={{ top: 0, insetInlineEnd: 0 }}>
        <Avatar person={b} size={sub} />
      </span>
      <span className="absolute flex rounded-full" style={{ bottom: -1.5, insetInlineStart: -1.5, padding: 1.5, background: ring }}>
        <Avatar person={a} size={sub} />
      </span>
    </span>
  );
}

function receiptText(status: DeliveryStatus, lang: Lang): string {
  const s = STR[lang];
  if (status === "read") return s.opened;
  if (status === "delivered") return s.delivered;
  return s.sending;
}

/* --------------------------------- screen --------------------------------- */

export function SnapchatAndroid({ scenario, playback, lang, rtl }: PlatformProps) {
  const dark = scenario.theme === "dark";
  const pal = palette(dark);
  const s = STR[lang];
  const { messages, typing, clockMs } = playback;
  const exporting = clockMs !== undefined;
  const live = playback.isLive && !exporting;
  const scrollRef = useChatScroll<HTMLDivElement>(`${messages.length}-${typing}-${playback.draft?.text.length ?? -1}`);

  const kb = useKeyboardInset();
  useBottomAnchor(scrollRef);
  const group = scenario.group && scenario.group.members.length > 0 ? scenario.group : null;

  const showTyping = typing || (!playback.isLive && scenario.presence === "typing");
  const showPresence = showTyping || scenario.presence === "online";
  const subtitle = group
    ? s.members(group.members.length + 1)
    : scenario.presence === "lastseen" && !showTyping
      ? scenario.lastSeenText
      : "";
  const themLabel = scenario.them.name.trim() || "—";
  const typerIndex = group ? typingAuthor(scenario, messages) : -1;
  /** Label, colour and person for any message's sender. */
  const who = (x: Message): { label: string; color: string; person: Person } => {
    if (x.sender === "me") return { label: s.me, color: ME_RED, person: scenario.me };
    const a = authorOf(scenario, x);
    return { label: a.person.name.trim() || themLabel, color: themColor(a.index), person: a.person };
  };
  const presentPeople: { person: Person; color: string; typing: boolean }[] = group
    ? group.members.slice(0, 3).map((p, idx) => ({ person: p, color: themColor(idx), typing: showTyping && idx === typerIndex }))
    : [{ person: scenario.them, color: THEM_BLUE, typing: showTyping }];

  const last = messages[messages.length - 1];
  const receiptId = last && last.sender === "me" ? last.id : null;
  const draft = playback.draft;
  const byId = new Map(scenario.messages.map((x) => [x.id, x] as const));
  const caretStyle: CSSProperties = exporting ? { opacity: clockMs % CARET_MS < CARET_MS / 2 ? 1 : 0 } : {};

  const textAlign: CSSProperties["textAlign"] = rtl ? "right" : "left";
  const textStyle: CSSProperties = {
    color: pal.text,
    fontSize: TEXT_SIZE,
    lineHeight: `${TEXT_LINE}px`,
    fontWeight: 400,
    textAlign,
  };

  return (
    <div
      className="flex h-full w-full flex-col"
      style={{
        background: pal.bg,
        fontFamily: snapFont(scenario.androidFont),
        // keyboard: composer rides on top of it, the thread shrinks (adjustResize)
        paddingBottom: kb.inset,
        transition: kb.transition === "none" ? "none" : `padding-bottom ${kb.transition}`,
      }}
    >
      <style>{KEYFRAMES}</style>
      <SamsungStatusBar tint={dark ? "light" : "dark"} background={pal.bg} lang={lang} />

      {/* Header */}
      <div
        className="flex shrink-0 items-center"
        style={{ height: 56, paddingInlineStart: 6, paddingInlineEnd: 12, borderBottom: `1px solid ${pal.divider}` }}
      >
        <span className="flex shrink-0 items-center justify-center" style={{ width: 34, height: 40 }}>
          <BackChevron color={pal.icon} />
        </span>
        {group ? (
          <span className="ms-0.5 shrink-0">
            <GroupAvatar group={group} size={36} ring={pal.bg} />
          </span>
        ) : (
          <Avatar person={scenario.them} size={36} className="ms-0.5" />
        )}
        <div className="min-w-0 flex-1" style={{ marginInlineStart: 10 }}>
          <div className="truncate" style={{ color: pal.text, fontSize: 18, lineHeight: "23px", fontWeight: 700 }}>
            <bdi>{group ? group.name : scenario.them.name}</bdi>
          </div>
          {subtitle && (
            <div className="truncate" style={{ color: pal.sub, fontSize: 12.5, lineHeight: "16px", fontWeight: 500 }}>
              {subtitle}
            </div>
          )}
        </div>
        <div className="flex shrink-0 items-center" style={{ gap: 2, marginInlineStart: 8 }}>
          <span
            className="flex items-center justify-center"
            style={{ width: 41, height: 32, background: pal.button, borderStartStartRadius: 16, borderEndStartRadius: 16 }}
          >
            <PhoneGlyph color={pal.icon} />
          </span>
          <span
            className="flex items-center justify-center"
            style={{ width: 41, height: 32, background: pal.button, borderStartEndRadius: 16, borderEndEndRadius: 16 }}
          >
            <CamcorderGlyph color={pal.icon} />
          </span>
        </div>
      </div>

      {/* Chat body */}
      <div
        ref={scrollRef}
        className="rcss-scroll min-h-0 flex-1 overflow-y-auto"
        style={{ background: pal.bg, paddingTop: 4, paddingBottom: 10, paddingInlineStart: SIDE, paddingInlineEnd: 14 }}
      >
        <div
          className="text-center uppercase"
          style={{ color: pal.sub, fontSize: 12, lineHeight: "16px", fontWeight: 600, letterSpacing: "0.03em", padding: "12px 0 10px" }}
        >
          {s.today}
        </div>

        {messages.map((m: Message, i) => {
          const mine = m.sender === "me";
          const author = who(m);
          const accent = author.color;
          const { first: firstOfGroup, last: lastOfGroup } = runs(messages, i, !!group);
          const status = playback.statusOf(m);
          const caption = m.type === "image" ? m.text.trim() : "";
          const emoji = m.type === "text" && isEmojiOnly(m.text);
          const quoted = m.replyToId ? byId.get(m.replyToId) : undefined;
          const quotedWho = quoted ? who(quoted) : null;
          const reaction = m.reaction?.trim();

          // Deleted chat → centred status message (`.ijyxU`), no label or bar.
          if (m.type === "deleted") {
            return (
              <div
                key={m.id}
                data-mid={m.id}
                data-sender={m.sender}
                className={live ? "snapand-enter" : undefined}
                style={{ paddingTop: i > 0 ? 14 : 4, paddingBottom: 4, textAlign: "center" }}
              >
                <span
                  className="inline-block uppercase"
                  dir="auto"
                  style={{
                    color: pal.sub,
                    fontSize: lang === "ar" ? 11 : 9.5,
                    fontWeight: lang === "ar" ? 600 : 500,
                    letterSpacing: lang === "ar" ? 0 : 1,
                    lineHeight: 1.2,
                  }}
                >
                  {mine ? s.youDeleted : s.deletedBy(author.label)}
                </span>
              </div>
            );
          }

          let body: ReactNode;
          if (m.type === "sticker") body = <Sticker m={m} />;
          else if (m.type === "location" && m.location) body = <LocationCard loc={m.location} person={author.person} pal={pal} s={s} seed={m.id} />;
          else if (m.type === "file" && m.file) body = <FileCard file={m.file} pal={pal} />;
          else if (m.type === "call" && m.call) body = <CallCard call={m.call} mine={mine} pal={pal} s={s} />;
          else if (m.type === "voice") body = <VoiceNote accent={accent} pal={pal} duration={m.voiceDuration} />;
          else if (m.type === "image")
            body = (
              <div className="flex flex-col" style={{ gap: 6, alignItems: "flex-start" }}>
                <ChatImage src={m.imageSrc} pal={pal} />
                {caption && (
                  <div dir={dirOf(caption)} className="w-full whitespace-pre-wrap break-words" style={textStyle}>
                    {caption}
                  </div>
                )}
              </div>
            );
          else if (emoji) body = <div style={{ fontSize: 34, lineHeight: "42px", textAlign }}>{m.text.trim()}</div>;
          else
            body = (
              <>
                <div dir={dirOf(m.text)} className="whitespace-pre-wrap break-words" style={textStyle}>
                  {linkify(m.text)}
                </div>
                {m.link && <LinkCard link={m.link} pal={pal} />}
              </>
            );

          return (
            <div
              key={m.id}
              data-mid={m.id}
              data-sender={m.sender}
              className={live ? "snapand-enter" : undefined}
              style={{ paddingTop: firstOfGroup && i > 0 ? GROUP_GAP : 0 }}
            >
              {firstOfGroup && (
                <div className="flex items-baseline" style={{ gap: 5, marginBottom: 3 }}>
                  <span
                    className="min-w-0 truncate uppercase"
                    style={{
                      color: accent,
                      fontSize: LABEL_SIZE,
                      lineHeight: `${LABEL_LINE}px`,
                      fontWeight: 600,
                      letterSpacing: "0.02em",
                    }}
                  >
                    <bdi>{author.label}</bdi>
                  </span>
                  {m.edited && (
                    <span className="shrink-0" style={{ color: pal.sub, fontSize: 12, lineHeight: `${LABEL_LINE}px`, fontWeight: 500 }}>
                      {s.edited}
                    </span>
                  )}
                </div>
              )}
              <div className="flex items-stretch">
                <span
                  className="shrink-0"
                  style={{
                    width: BAR,
                    background: accent,
                    borderStartStartRadius: firstOfGroup ? 2 : 0,
                    borderStartEndRadius: firstOfGroup ? 2 : 0,
                    borderEndStartRadius: lastOfGroup ? 2 : 0,
                    borderEndEndRadius: lastOfGroup ? 2 : 0,
                  }}
                />
                <div className="min-w-0 flex-1" style={{ paddingInlineStart: TEXT_GAP, paddingBlock: m.type === "text" ? 1 : 3 }}>
                  {quoted && quotedWho && (
                    <QuoteCard target={quoted} label={quotedWho.label} accent={quotedWho.color} pal={pal} textAlign={textAlign} />
                  )}
                  {body}
                </div>
              </div>
              {reaction && (
                <div className="flex" style={{ marginTop: 3, marginBottom: 1 }}>
                  <Reaction emoji={reaction} person={mine ? (group ? group.members[0] : scenario.them) : scenario.me} ring={pal.bg} />
                </div>
              )}
              {mine && m.id === receiptId && (
                <div
                  key={status}
                  className={`flex items-center ${live ? "snapand-fade" : ""}`}
                  style={{ gap: 5, marginTop: 5, paddingInlineStart: BAR + TEXT_GAP, color: pal.sub, fontSize: 11.5, lineHeight: "14px", fontWeight: 600 }}
                >
                  {status !== "sent" && <ChatArrow opened={status === "read"} color={CHAT_BLUE} />}
                  <span>{receiptText(status, lang)}</span>
                </div>
              )}
            </div>
          );
        })}

        {/* Friend presence: their Bitmoji peeks up over a name chip; while typing a dots bubble shows. */}
        {showPresence && (
          <div className="flex items-end overflow-hidden" style={{ marginTop: 14, gap: 6, paddingInlineStart: 2 }}>
            {presentPeople.map(({ person, color }, pi) => (
              <div key={pi} className="flex flex-col items-center">
                <div className={live ? "snapand-peek" : undefined} style={{ marginBottom: -7 }}>
                  <Avatar person={person} size={30} />
                </div>
                <span
                  className="relative truncate uppercase"
                  style={{
                    maxWidth: 120,
                    height: 20,
                    lineHeight: "17px",
                    padding: "0 10px",
                    borderRadius: 10,
                    border: `1.5px solid ${color}`,
                    background: pal.bg,
                    color,
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: "0.02em",
                  }}
                >
                  {person.name.trim() || themLabel}
                </span>
              </div>
            ))}
            {showTyping && (
              <div
                className={`flex items-center ${live ? "snapand-fade" : ""}`}
                style={{ gap: 4, height: 26, padding: "0 10px", marginBottom: 14, borderRadius: 13, background: pal.field }}
              >
                {[0, 1, 2].map((d) => {
                  const st = exporting ? dotAt(clockMs, d) : null;
                  return (
                    <span
                      key={d}
                      className={st ? "inline-block rounded-full" : "snapand-dot inline-block rounded-full"}
                      style={{
                        width: 6,
                        height: 6,
                        background: group ? themColor(typerIndex) : THEM_BLUE,
                        ...(st
                          ? { opacity: st.opacity, transform: `translateY(${st.y.toFixed(2)}px)` }
                          : { animationDelay: `${d * DOT_STAGGER - DOT_CYCLE}ms` }),
                      }}
                    />
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Composer */}
      {/* With a draft: camera-with-T glyph, send arrow instead of the mic, trailing icons
          collapse, and the field grows to 4 lines (then scrolls). */}
      <div
        className="flex shrink-0 items-end"
        style={{ background: pal.bg, paddingInlineStart: SIDE, paddingInlineEnd: draft ? SIDE : 12, paddingTop: 6, paddingBottom: 8 }}
      >
        <span className="flex shrink-0 items-center justify-center rounded-full" style={{ width: 36, height: 36, background: pal.button }}>
          {draft ? <CameraTextGlyph color={pal.icon} /> : <CameraGlyph color={pal.icon} />}
        </span>
        <div
          className="flex min-w-0 flex-1 items-end"
          style={{ minHeight: 36, borderRadius: 18, background: pal.field, marginInlineStart: 8, paddingInlineStart: 14, paddingInlineEnd: draft ? 5 : 8 }}
        >
          {draft ? (
            <>
              <div className="flex min-w-0 flex-1 flex-col justify-end overflow-hidden" style={{ maxHeight: 4 * 22 + 14, paddingBlock: 7 }}>
                <div
                  dir={dirOf(draft.text)}
                  style={{ color: pal.text, fontSize: 16, fontWeight: 400, lineHeight: "22px", whiteSpace: "pre-wrap", overflowWrap: "anywhere", textAlign: "start" }}
                >
                  {draft.text}
                  <span
                    key={draft.text.length}
                    aria-hidden
                    className={exporting ? undefined : "snapand-caret"}
                    style={{
                      display: "inline-block",
                      width: 2,
                      height: 20,
                      background: ME_RED,
                      verticalAlign: "-4px",
                      marginInlineStart: 1,
                      marginInlineEnd: -3,
                      ...caretStyle,
                    }}
                  />
                </div>
              </div>
              <span
                className={`flex shrink-0 items-center justify-center ${exporting ? "" : rtl ? "snapand-send-rtl" : "snapand-send"}`}
                style={{ width: 30, height: 36, marginInlineStart: 4 }}
              >
                <SendArrowGlyph color={CHAT_BLUE} />
              </span>
            </>
          ) : (
            <>
              <span className="min-w-0 flex-1 truncate" style={{ color: pal.placeholder, fontSize: 16, fontWeight: 500, lineHeight: "36px" }}>
                {s.sendAChat}
              </span>
              <span className="flex shrink-0 items-center" style={{ height: 36 }}>
                <MicGlyph color={pal.icon} />
              </span>
            </>
          )}
        </div>
        <div className={draft ? "hidden" : "flex shrink-0 items-center"} style={{ gap: 14, marginInlineStart: 13, height: 36 }}>
          <IconSlot>
            <SmileyGlyph color={pal.icon} />
          </IconSlot>
          <IconSlot>
            <MemoriesGlyph color={pal.icon} bg={pal.bg} />
          </IconSlot>
          <IconSlot>
            <RocketGlyph color={pal.icon} />
          </IconSlot>
        </div>
      </div>
      <SystemBottomBar device="android" bg={pal.bg} fg={pal.nav} />
    </div>
  );
}

function IconSlot({ children }: { children: ReactNode }) {
  return (
    <span className="flex items-center justify-center" style={{ width: 25, height: 25 }}>
      {children}
    </span>
  );
}
