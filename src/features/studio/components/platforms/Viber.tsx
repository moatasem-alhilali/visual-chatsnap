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
 */

import type { CSSProperties, ReactNode } from "react";

import type { DeliveryStatus, Message, Person } from "../../types";
import { StatusBar } from "../devices/StatusBar";
import { dirOf, SystemBottomBar, useChatScroll } from "../shared";
import { CHROME, type Lang } from "./chrome";
import { groupInfo, type PlatformMotion, type PlatformProps } from "./types";

/* ======================================================================
   Strings (Viber's own wording)
   ====================================================================== */

const VB: Record<Lang, { online: string; typing: string; placeholder: string }> = {
  en: { online: "Online", typing: "typing…", placeholder: "Message…" },
  ar: { online: "متصل", typing: "يكتب…", placeholder: "رسالة…" },
};

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
  return css;
})();

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
  const scrollRef = useChatScroll<HTMLDivElement>(`${messages.length}-${typing}`);

  const subtitle =
    typing || scenario.presence === "typing"
      ? s.typing
      : scenario.presence === "online"
        ? s.online
        : scenario.lastSeenText;
  const lastSender = messages.length ? messages[messages.length - 1].sender : null;
  const gradId = `vb-ios-video-${dark ? "d" : "l"}`;

  return (
    <div className="flex h-full w-full flex-col overflow-hidden" dir={uiDir} style={{ background: p.bg, color: p.text }}>
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
                {scenario.them.name}
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
          {messages.map((m, i) => {
            const { firstOfGroup } = groupInfo(messages, i);
            return (
              <Row
                key={m.id}
                m={m}
                p={p}
                rtl={rtl}
                uiDir={uiDir}
                first={firstOfGroup}
                index={i}
                status={playback.statusOf(m)}
                them={scenario.them}
                live={live}
              />
            );
          })}

          {typing && (
            <div
              className={`flex items-start ${enterClass(live, false, rtl)}`}
              style={{ marginTop: lastSender === "them" ? 4 : 12, paddingInlineStart: EDGE, gap: AV_GAP }}
            >
              {/* the pill continues an incoming run, so it only carries the avatar when it starts one */}
              <div style={{ width: AV, flexShrink: 0 }}>
                {lastSender !== "them" && <VbAvatar person={scenario.them} size={AV} pal={p} />}
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

      {/* ---------- Composer ---------- */}
      <div className="shrink-0" style={{ background: p.bar }}>
        <div style={{ height: 0.5, background: p.hair }} />
        <div className="flex items-center" style={{ paddingTop: 7, paddingInline: "12px 10px", height: 45 }}>
          <PlusCircle color={p.icon} />
          <div
            className="flex min-w-0 flex-1 items-center"
            style={{ height: 38, borderRadius: 19, background: p.field, marginInline: "10px 8px", paddingInline: "14px 10px" }}
          >
            <span
              className="min-w-0 flex-1 truncate"
              style={{ fontSize: 17, lineHeight: "22px", color: p.placeholder, letterSpacing: -0.41 }}
            >
              {s.placeholder}
            </span>
            <span style={{ marginInline: "8px 14px" }}>
              <SmileyGlyph color={p.icon} />
            </span>
            <GalleryGlyph color={p.icon} />
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
            <MicGlyph color="#ffffff" />
          </div>
        </div>
        <div style={{ height: 15 }} />
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
  rtl,
  uiDir,
  first,
  index,
  status,
  them,
  live,
}: {
  m: Message;
  p: Pal;
  rtl: boolean;
  uiDir: "rtl" | "ltr";
  first: boolean;
  index: number;
  status: DeliveryStatus;
  them: Person;
  live: boolean;
}) {
  const mine = m.sender === "me";
  const isImage = m.type === "image";
  const isVoice = m.type === "voice";
  const caption = isImage ? m.text.trim() : "";
  const jumbo = !isImage && !isVoice ? jumboCount(m.text) : 0;
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

  const meta = (overlay = false) => (
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
      {time}
      {mine && <Ticks status={status} grey={overlay ? "#ffffff" : timeColor} seen={overlay ? "#ffffff" : p.purple} />}
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

  const avatarSlot = !mine ? (
    <div style={{ width: AV, marginInlineEnd: AV_GAP, flexShrink: 0 }}>
      {first && <VbAvatar person={them} size={AV} pal={p} />}
    </div>
  ) : null;

  const discs = (
    <div
      className="flex shrink-0 items-center self-center"
      style={{ gap: 6, marginInlineStart: mine ? 0 : DISC_GAP, marginInlineEnd: mine ? DISC_GAP : 0, flexDirection: mine ? "row-reverse" : "row" }}
    >
      <Disc pal={p}>
        <HeartOutline color={p.heart} />
      </Disc>
      {isImage && !mine && (
        <Disc pal={p}>
          <ForwardGlyph color={p.heart} />
        </Disc>
      )}
    </div>
  );

  /* --- emoji-only: big, bubble-less, time beside it on the inner side --- */
  if (jumbo) {
    return (
      <div data-mid={m.id} data-sender={m.sender} className={rowClass} style={rowStyle}>
        {avatarSlot}
        <div className="flex items-end" style={{ flexDirection: mine ? "row-reverse" : "row", gap: 6 }}>
          <span style={{ fontSize: JUMBO_SIZE[jumbo], lineHeight: 1.12, letterSpacing: 1 }}>{m.text.trim()}</span>
          <span style={{ paddingBottom: 6 }}>{meta()}</span>
        </div>
        {discs}
      </div>
    );
  }

  /* --- frameless photo (no caption): rounded, time on a dark pill --- */
  if (isImage && !caption) {
    return (
      <div data-mid={m.id} data-sender={m.sender} className={rowClass} style={rowStyle}>
        {avatarSlot}
        <div className="relative overflow-hidden" style={{ width: IMG_W, background: bg, ...radius }}>
          <Photo m={m} dark={p === DARK} />
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
        </div>
        {discs}
      </div>
    );
  }

  let body: ReactNode;
  let padding: string | number = "9px 13px";
  let width: number | undefined;

  if (isVoice) {
    padding = "8px 13px 7px 8px";
    body = <Voice m={m} p={p} mine={mine} meta={meta()} uiDir={uiDir} />;
  } else if (isImage) {
    padding = 0;
    width = IMG_W;
    body = (
      <>
        <div className="overflow-hidden" style={{ borderStartStartRadius: startTop, borderStartEndRadius: endTop }}>
          <Photo m={m} dark={p === DARK} />
        </div>
        <TextAndTime text={caption} p={p} meta={meta()} pad="8px 13px 8px" />
      </>
    );
  } else {
    padding = 0;
    body = <TextAndTime text={m.text} p={p} meta={meta()} pad="9px 13px" />;
  }

  return (
    <div data-mid={m.id} data-sender={m.sender} className={rowClass} style={rowStyle}>
      {avatarSlot}
      <div
        className="relative min-w-0"
        style={{ background: bg, color: p.text, padding, width, maxWidth: "100%", overflow: "hidden", ...radius }}
      >
        {body}
      </div>
      {discs}
    </div>
  );
}

/**
 * Text + time. A flex row that wraps: when text and time fit on one line they
 * share it (time baseline-aligned at the end); otherwise the text takes the
 * full width and the time drops to its own line, end-aligned, as Viber does.
 */
function TextAndTime({ text, p, meta, pad }: { text: string; p: Pal; meta: ReactNode; pad: string }) {
  const dir = dirOf(text);
  return (
    <div className="flex flex-wrap items-baseline justify-end" style={{ padding: pad, columnGap: 10, rowGap: 2 }}>
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
        {text}
      </span>
      {meta}
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
