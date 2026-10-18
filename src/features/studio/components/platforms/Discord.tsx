"use client";

/**
 * Discord for iPhone — the 1:1 direct-message screen (iPhone 393 pt), as it
 * ships after the 2026 mobile visual refresh.
 *
 * Discord's mobile app is React Native and ships its own design system and its
 * own typeface (gg sans), so nothing here is UIKit chrome except the status bar
 * and the home indicator. The mockup cannot load gg sans, so the stack falls
 * back to the device font (the iPhone stack from DeviceFrame).
 *
 * Sources and key values
 * [T] Discord's live client bundle (discord.com/app → /assets/web.*.js design
 *     tokens + /assets/*.css). The same semantic tokens drive the mobile app.
 *     Default dark theme = "Dark" (refresh naming; Light / Ash / Dark / Onyx):
 *       chat bg  --background-base-lower  Dark NEUTRAL_86 #1a1a1e · Light NEUTRAL_2 #fbfbfb
 *       text     --text-default           #efeff1 · #2e2e34
 *       names    --text-strong            #fbfbfb · #28282d
 *       muted    --text-muted             #96979e · #6c6d76  (timestamps, placeholder)
 *       icons    --interactive-icon-default #abacb2 · #595a63
 *       chat bar --background-surface-high #242429 · #ffffff
 *       borders  --border-subtle #97979f @ .122 (dark) / .278 (light)
 *       mod      --background-mod-subtle #97979f @ .122 (voice-message pill)
 *       online   --status-online #23a55a · #24934e; offline ring #81828a · #70717a
 *       brand    #5865f2; play-button gradient 151.11deg brand-460 #6571f3 →
 *                brand-560 #4752c4 (dark) / brand-400 #7984f5 → #5865f2 (light)
 *     Mobile tokens (:root + .mobile-visual-refresh in 952007.*.css):
 *       --chat-avatar-size 40; --mobile-header-title-text-style heading-lg/semibold
 *       (20/24, 600); --mobile-chat-input-container-horizontal-padding 16;
 *       --mobile-chat-input-pill-border-width 1; action buttons 32 with a 20 px
 *       icon and an 8 px gap; input text-md/normal (16); voice-message duration
 *       text-xs/semibold.
 *     Icons are Discord's production glyph paths from the same bundle:
 *       ArrowLargeLeft, PhoneCall, Video, ChevronSmallRight, PlusLarge, Gift,
 *       EmojiHappyWinkingFace (the chat-bar emoji button), Microphone, Play, Image.
 * [B] discord.com/blog/improving-mobile-with-squircles-styles-and-spacing
 *     (Aug 2026): four themes Light/Ash/Dark/Onyx; people are circles; new chat
 *     bar with "+" at the start and Gift · Emoji · Voice Message on the right.
 *     Its "Chat Input" render (3840×1440, 3.825 px/pt — calibrated on the 40 pt
 *     avatar) measured: avatar 40 at x 16; content column at x 68; one-line
 *     groups repeat every 56 pt (40 pt avatar row + 16 gap); cap heights
 *     name 11.2 / body 9.9 / timestamp 8.4 / placeholder 11.0 pt and string
 *     widths (cross-checked on the App Store shot) ⇒ name 16 medium, body 14
 *     (text-sm, 18 line), timestamp 12 medium, placeholder 16; chat bar 16 pt
 *     from both edges, 56 tall, radius 16, 1 px border; "+" and mic centred
 *     28 pt from the bar's ends, Emoji/Gift 40 pt apart; placeholder at x 53
 *     inside the bar; bar bottom 42 pt above the screen bottom; sampled colours
 *     #1a1a1e bg, #efeff1 text, #96979e timestamp/placeholder, #acadb2 icons,
 *     #242429 bar.
 * [A] App Store screenshots (apps.apple.com id985746746, "1_GroupChat"):
 *     header = ← back arrow (#abacb2) centred 28 pt from the edge, white bold
 *     title + small chevron, 1 pt #29292d divider; "Name  Today at 2:12 PM".
 * [S] support.discord.com 13091096725527 (Voice Messages) and 360046618751
 *     (Getting Started on Mobile): DM header = back arrow · avatar · name ›,
 *     call buttons top-right; voice message = blurple play circle, waveform,
 *     duration; no read receipts anywhere in Discord.
 *
 * Arabic / RTL: Discord ships no Arabic localisation and no RTL layout (the
 * client's locale list has no "ar"; support.discord.com community posts
 * 360050257474 and 360030086752 are open requests). On an Arabic iPhone the
 * app runs in English and stays left-to-right; only the iOS status bar is
 * system chrome. Arabic paragraphs lay out right-to-left and right-aligned
 * inside the content column (TextKit natural alignment follows the paragraph's
 * first strong character).
 *
 * Status: Discord has no delivered/read receipts. The only state is "sending":
 * the pending message renders at 50 % opacity (.isSending{opacity:.5}) until
 * the server acknowledges it.
 *
 * Entrance: the native message list inserts the new row while the list scrolls
 * up; the row itself rises 10 pt and fades in. Modelled as 260 ms on
 * cubic-bezier(.2,.8,.2,1) with a 160 ms fade; the CSS keyframes are generated
 * from `discordIosMotion.enterStyle`, so live preview and export match.
 */

import type { CSSProperties, ReactNode } from "react";

import type { Message, Person } from "../../types";
import { dirOf, SystemBottomBar, useChatScroll } from "../shared";
import { StatusBar } from "../devices/StatusBar";
import type { Lang } from "./chrome";
import { groupInfo, type PlatformMotion, type PlatformProps } from "./types";

/* --------------------------------- tokens --------------------------------- */

interface Pal {
  bg: string;
  text: string;
  strong: string;
  muted: string;
  icon: string;
  bar: string;
  border: string;
  mod: string;
  online: string;
  offline: string;
  playFrom: string;
  playTo: string;
  wave: string;
  homeIndicator: string;
}

function palette(dark: boolean): Pal {
  return dark
    ? {
        bg: "#1a1a1e",
        text: "#efeff1",
        strong: "#fbfbfb",
        muted: "#96979e",
        icon: "#abacb2",
        bar: "#242429",
        border: "rgba(151,151,159,0.122)",
        mod: "rgba(151,151,159,0.122)",
        online: "#23a55a",
        offline: "#81828a",
        playFrom: "#6571f3",
        playTo: "#4752c4",
        wave: "#6c6d76",
        homeIndicator: "#ffffff",
      }
    : {
        bg: "#fbfbfb",
        text: "#2e2e34",
        strong: "#28282d",
        muted: "#6c6d76",
        icon: "#595a63",
        bar: "#ffffff",
        border: "rgba(151,151,159,0.278)",
        mod: "rgba(151,151,159,0.122)",
        online: "#24934e",
        offline: "#70717a",
        playFrom: "#7984f5",
        playTo: "#5865f2",
        wave: "#abacb2",
        homeIndicator: "#000000",
      };
}

/** gg sans first (Discord's bundled face), then the iPhone system stack DeviceFrame uses. */
const DISCORD_IOS_FONT =
  '"gg sans", "ggsans", -apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro", var(--font-inter), system-ui, var(--font-tajawal), sans-serif';

/**
 * Discord has no Arabic UI: an Arabic-locale iPhone shows the English client,
 * so both entries are the en-US strings on purpose.
 */
const EN = {
  messageAt: (name: string) => `Message @${name}`,
  todayAt: (time: string) => `Today at ${time}`,
  isTyping: " is typing...",
  beginning: "This is the beginning of your direct message history with ",
};
const STR: Record<Lang, typeof EN> = { en: EN, ar: EN };

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function longDate(d: Date): string {
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

/**
 * en-US Discord prints 12-hour clock times ("Today at 10:41 AM"). A typed
 * 24-hour value is converted; anything already carrying AM/PM (or not a clock
 * value) is shown exactly as typed.
 */
function clock12(raw: string): string {
  const t = raw.trim();
  const m = /^(\d{1,2})[:.](\d{2})$/.exec(t);
  if (!m) return t;
  const h = Number(m[1]);
  if (h > 23) return t;
  const suffix = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${m[2]} ${suffix}`;
}

/* --------------------------------- metrics -------------------------------- */

const EDGE = 16; // avatar / chat bar inset from the screen edge [B]
const AVATAR = 40; // --chat-avatar-size [T]
const CONTENT_X = 68; // content column [B]
const GUTTER = CONTENT_X - EDGE - AVATAR; // 12
const TEXT_SIZE = 14; // [B] measured: body cap 9.9 pt vs name cap 11.2 pt (16) → 14 (text-sm)
const TEXT_LINE = 18;
const NAME_LINE = 20;
const GROUP_GAP = 16; // [B] 56 pt pitch for one-line groups
const IN_GROUP_GAP = 4;
const BAR_H = 56;
const BAR_BOTTOM = 23; // bar bottom sits 42 pt above the screen edge = 23 + 19 (home-indicator band)

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
    for (let i = 0; i < 28; i++) {
      const mid = (lo + hi) / 2;
      if (bx(mid) < x) lo = mid;
      else hi = mid;
    }
    return by((lo + hi) / 2);
  };
}

const ENTER_MS = 260;
const FADE_MS = 160;
const ENTER_RISE = 10;
const riseEase = cubicBezier(0.2, 0.8, 0.2, 1);
const fadeEase = cubicBezier(0.25, 0.1, 0.25, 1);

export const discordIosMotion: PlatformMotion = {
  enterMs: ENTER_MS,
  enterStyle: (p) => {
    const t = Math.min(1, Math.max(0, p));
    const y = (1 - riseEase(t)) * ENTER_RISE;
    const o = fadeEase(Math.min(1, t / (FADE_MS / ENTER_MS)));
    return { opacity: Number(o.toFixed(4)), transform: `translateY(${y.toFixed(2)}px)` };
  },
};

/** Typing dots: 1.2 s loop, 0.15 s stagger, each dot pulses opacity + scale. */
const DOT_CYCLE = 1200;
const DOT_STAGGER = 150;

function dotAt(ms: number, i: number): { opacity: number; scale: number } {
  const ph = ((((ms - i * DOT_STAGGER) % DOT_CYCLE) + DOT_CYCLE) % DOT_CYCLE) / DOT_CYCLE;
  const k = ph < 0.5 ? Math.sin((ph / 0.5) * Math.PI) : 0;
  return { opacity: 0.3 + 0.7 * k, scale: 0.85 + 0.15 * k };
}

/** Keyframes generated from the exporter's own functions → preview == export. */
const DISCORD_IOS_CSS = (() => {
  const steps = 26;
  let frames = "";
  for (let i = 0; i <= steps; i++) {
    const p = i / steps;
    const st = discordIosMotion.enterStyle(p, false, false);
    frames += `${(p * 100).toFixed(2)}%{opacity:${st.opacity};transform:${st.transform}}`;
  }
  let dot = "";
  for (let i = 0; i <= 24; i++) {
    const d = dotAt((i / 24) * DOT_CYCLE, 0);
    dot += `${((i / 24) * 100).toFixed(2)}%{opacity:${d.opacity.toFixed(3)};transform:scale(${d.scale.toFixed(3)})}`;
  }
  return (
    `@keyframes dcios-enter{${frames}}.dcios-enter{animation:dcios-enter ${ENTER_MS}ms linear both}` +
    `@keyframes dcios-dot{${dot}}.dcios-dot{animation:dcios-dot ${DOT_CYCLE}ms linear infinite}` +
    `@keyframes dcios-fade{from{opacity:0}to{opacity:1}}.dcios-fade{animation:dcios-fade 180ms ease-out both}` +
    `.dcios-pending{transition:opacity 150ms ease-out}`
  );
})();

/* --------------------------------- glyphs --------------------------------- */
/* Production glyph paths from Discord's icon set [T] (24×24 viewBox). */

function Icon({ size, children }: { size: number; children: ReactNode }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="shrink-0" style={{ display: "block" }}>
      {children}
    </svg>
  );
}

/** ArrowLargeLeftIcon — Discord never mirrors (no RTL layout), so neither does this. */
function BackArrow({ color }: { color: string }) {
  return (
    <Icon size={24}>
      <path
        fill={color}
        d="M3.3 11.3a1 1 0 0 0 0 1.4l8 8a1 1 0 1 0 1.4-1.4L6.42 13H20a1 1 0 1 0 0-2H6.41l6.3-6.3a1 1 0 0 0-1.42-1.4l-8 8Z"
      />
    </Icon>
  );
}

function PhoneCallGlyph({ color }: { color: string }) {
  return (
    <Icon size={24}>
      <path
        fill={color}
        d="M2 7.4A5.4 5.4 0 0 1 7.4 2c.36 0 .7.22.83.55l1.93 4.64a1 1 0 0 1-.43 1.25L7 10a8.52 8.52 0 0 0 7 7l1.12-2.24a1 1 0 0 1 1.19-.51l5.06 1.56c.38.11.63.46.63.85C22 19.6 19.6 22 16.66 22h-.37C8.39 22 2 15.6 2 7.71V7.4ZM13 3a1 1 0 0 1 1-1 8 8 0 0 1 8 8 1 1 0 1 1-2 0 6 6 0 0 0-6-6 1 1 0 0 1-1-1Z"
      />
      <path fill={color} d="M13 7a1 1 0 0 1 1-1 4 4 0 0 1 4 4 1 1 0 1 1-2 0 2 2 0 0 0-2-2 1 1 0 0 1-1-1Z" />
    </Icon>
  );
}

function VideoGlyph({ color }: { color: string }) {
  return (
    <Icon size={24}>
      <path
        fill={color}
        d="M4 4a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h11a3 3 0 0 0 3-3v-2.12a1 1 0 0 0 .55.9l3 1.5a1 1 0 0 0 1.45-.9V7.62a1 1 0 0 0-1.45-.9l-3 1.5a1 1 0 0 0-.55.9V7a3 3 0 0 0-3-3H4Z"
      />
    </Icon>
  );
}

function ChevronSmallRight({ color }: { color: string }) {
  return (
    <Icon size={16}>
      <path
        fill={color}
        d="M9.3 5.3a1 1 0 0 0 0 1.4l5.29 5.3-5.3 5.3a1 1 0 1 0 1.42 1.4l6-6a1 1 0 0 0 0-1.4l-6-6a1 1 0 0 0-1.42 0Z"
      />
    </Icon>
  );
}

function PlusGlyph({ color }: { color: string }) {
  return (
    <Icon size={20}>
      <path fill={color} d="M13 3a1 1 0 1 0-2 0v8H3a1 1 0 1 0 0 2h8v8a1 1 0 0 0 2 0v-8h8a1 1 0 0 0 0-2h-8V3Z" />
    </Icon>
  );
}

function GiftGlyph({ color }: { color: string }) {
  return (
    <Icon size={20}>
      <path
        fill={color}
        fillRule="evenodd"
        clipRule="evenodd"
        d="M4 6a4 4 0 0 1 4-4h.09c1.8 0 3.39 1.18 3.91 2.9A4.09 4.09 0 0 1 15.91 2H16a4 4 0 0 1 3.46 6H20a2 2 0 0 1 2 2v1.5a.5.5 0 0 1-.5.5h-19a.5.5 0 0 1-.5-.5V10c0-1.1.9-2 2-2h.54A3.98 3.98 0 0 1 4 6Zm12 2a2 2 0 1 0 0-4h-.09c-.96 0-1.8.65-2.02 1.58L13.29 8H16Zm-5.89-2.42.6 2.42H8a2 2 0 1 1 0-4h.09c.96 0 1.8.65 2.02 1.58Z"
      />
      <path
        fill={color}
        d="M3 20c0 1.1.9 2 2 2h5.5a.5.5 0 0 0 .5-.5v-7a.5.5 0 0 0-.5-.5h-7a.5.5 0 0 0-.5.5V20ZM13.5 22a.5.5 0 0 1-.5-.5v-7c0-.28.22-.5.5-.5h7c.28 0 .5.22.5.5V20a2 2 0 0 1-2 2h-5.5Z"
      />
    </Icon>
  );
}

/** EmojiHappyWinkingFaceIcon — the chat bar's expression-picker button. */
function EmojiGlyph({ color }: { color: string }) {
  return (
    <Icon size={20}>
      <path
        fill={color}
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 23a11 11 0 1 0 0-22 11 11 0 0 0 0 22Zm5.5-10a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm-2.14 1.99c.15-.53-.3-.99-.86-.99h-5c-.55 0-1.01.46-.86.99a3.5 3.5 0 0 0 6.72 0ZM6.45 9.1a1 1 0 0 0-.9 1.78l1.21.61-1.2.6a1 1 0 1 0 .89 1.8l3-1.5a1 1 0 0 0 0-1.8l-3-1.5Z"
      />
    </Icon>
  );
}

function MicGlyph({ color }: { color: string }) {
  return (
    <Icon size={20}>
      <path fill={color} d="M12 2a4 4 0 0 0-4 4v4a4 4 0 0 0 8 0V6a4 4 0 0 0-4-4Z" />
      <path
        fill={color}
        d="M6 10a1 1 0 0 0-2 0 8 8 0 0 0 7 7.94V20H9a1 1 0 1 0 0 2h6a1 1 0 1 0 0-2h-2v-2.06A8 8 0 0 0 20 10a1 1 0 1 0-2 0 6 6 0 0 1-12 0Z"
      />
    </Icon>
  );
}

/** PlayIcon — never mirrored. */
function PlayGlyph() {
  return (
    <Icon size={16}>
      <path
        fill="#ffffff"
        d="M9.25 3.35C7.87 2.45 6 3.38 6 4.96v14.08c0 1.58 1.87 2.5 3.25 1.61l10.85-7.04a1.9 1.9 0 0 0 0-3.22L9.25 3.35Z"
      />
    </Icon>
  );
}

function ImageGlyph({ color }: { color: string }) {
  return (
    <Icon size={40}>
      <path
        fill={color}
        fillRule="evenodd"
        clipRule="evenodd"
        d="M2 5a3 3 0 0 1 3-3h14a3 3 0 0 1 3 3v14a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3V5Zm13.35 8.13 3.5 4.67c.37.5.02 1.2-.6 1.2H5.81a.75.75 0 0 1-.59-1.22l1.86-2.32a1.5 1.5 0 0 1 2.34 0l.5.64 2.23-2.97a2 2 0 0 1 3.2 0ZM10.2 5.98c.23-.91-.88-1.55-1.55-.9a.93.93 0 0 1-1.3 0c-.67-.65-1.78-.01-1.55.9a.93.93 0 0 1-.65 1.12c-.9.26-.9 1.54 0 1.8.48.14.77.63.65 1.12-.23.91.88 1.55 1.55.9a.93.93 0 0 1 1.3 0c.67.65 1.78.01 1.55-.9a.93.93 0 0 1 .65-1.12c.9-.26.9-1.54 0-1.8a.93.93 0 0 1-.65-1.12Z"
      />
    </Icon>
  );
}

/* --------------------------------- avatars -------------------------------- */

/** Discord's default avatar colours (blurple, grey, green, yellow, red, pink). */
const DEFAULT_AVATAR_COLORS = ["#5865f2", "#757e8a", "#3ba55c", "#faa61a", "#ed4245", "#eb459f"];

function defaultAvatarColor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0;
  return DEFAULT_AVATAR_COLORS[Math.abs(h) % DEFAULT_AVATAR_COLORS.length];
}

const DISCORD_LOGO =
  "M20.317 4.37a19.79 19.79 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.865-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.74 19.74 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.1 13.1 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.291a.074.074 0 0 1 .078-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.099.246.198.373.292a.077.077 0 0 1-.007.127 12.3 12.3 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.363 1.225 1.993a.076.076 0 0 0 .084.029 19.84 19.84 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03ZM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418Zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418Z";

/** People are circles [B]; no upload → the white Discord logo on a default colour. */
function DiscordAvatar({ person, size }: { person: Person; size: number }) {
  if (person.avatar) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={person.avatar}
        alt=""
        width={size}
        height={size}
        draggable={false}
        className="block shrink-0 rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  const logo = size * 0.6;
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full"
      style={{ width: size, height: size, background: defaultAvatarColor(person.name) }}
    >
      <svg width={logo} height={logo} viewBox="0 0 24 24" style={{ display: "block", marginTop: size * 0.02 }}>
        <path fill="#ffffff" d={DISCORD_LOGO} />
      </svg>
    </span>
  );
}

/** Avatar with the presence dot cut into its bottom-right corner. */
function PresenceAvatar({ person, size, online, pal }: { person: Person; size: number; online: boolean; pal: Pal }) {
  const dot = Math.round(size * 0.375); // 9 on a 24 avatar
  const ring = 2.5;
  return (
    <span className="relative block shrink-0" style={{ width: size, height: size }}>
      <DiscordAvatar person={person} size={size} />
      <span
        className="absolute flex items-center justify-center rounded-full"
        style={{ width: dot + ring * 2, height: dot + ring * 2, right: -ring - 1, bottom: -ring - 1, background: pal.bg }}
      >
        {online ? (
          <span className="block rounded-full" style={{ width: dot, height: dot, background: pal.online }} />
        ) : (
          <span
            className="block rounded-full"
            style={{ width: dot, height: dot, boxSizing: "border-box", border: `2.5px solid ${pal.offline}` }}
          />
        )}
      </span>
    </span>
  );
}

/* ------------------------------ message parts ------------------------------ */

const EMOJI_ONLY =
  /^(?:(?:\p{Extended_Pictographic}|\p{Regional_Indicator})(?:️|\p{Emoji_Modifier}|‍(?:\p{Extended_Pictographic})️?)*\s*){1,27}$/u;

/** Discord renders emoji-only messages (up to 27 emoji) as 48 px "jumbo" emoji. */
function isEmojiOnly(text: string): boolean {
  const t = text.trim();
  return t.length > 0 && EMOJI_ONLY.test(t);
}

/** Deterministic waveform from the message id (stable across renders and export). */
function waveform(id: string, n: number): number[] {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 16777619);
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    const r = ((h >>> 0) % 1000) / 1000;
    const env = 0.35 + 0.65 * Math.sin((Math.PI * (i + 0.5)) / n);
    out.push(Math.max(3, Math.round(3 + r * 17 * env)));
  }
  return out;
}

function VoiceMessage({ id, pal, duration }: { id: string; pal: Pal; duration?: string }) {
  const bars = waveform(id, 34);
  return (
    <div
      className="relative flex items-center"
      style={{
        background: pal.mod,
        border: `1px solid ${pal.border}`,
        borderRadius: 24,
        padding: 11,
        gap: 12,
        width: 260,
        maxWidth: "100%",
        boxSizing: "border-box",
      }}
    >
      <span
        className="flex shrink-0 items-center justify-center rounded-full"
        style={{
          width: 32,
          height: 32,
          margin: "-4px 0 -4px -4px",
          background: `linear-gradient(151.11deg, ${pal.playFrom} 16.55%, ${pal.playTo} 104.36%)`,
        }}
      >
        <span style={{ display: "block", marginLeft: 1 }}>
          <PlayGlyph />
        </span>
      </span>
      <span dir="ltr" className="flex min-w-0 flex-1 items-center justify-between overflow-hidden" style={{ height: 24 }}>
        {bars.map((b, i) => (
          <span key={i} className="block shrink-0" style={{ width: 3, height: b, borderRadius: 1.5, background: pal.wave }} />
        ))}
      </span>
      <span
        className="shrink-0 tabular-nums"
        style={{ color: pal.muted, fontSize: 12, lineHeight: "16px", fontWeight: 600, marginLeft: -2 }}
      >
        {duration || "0:08"}
      </span>
    </div>
  );
}

function Attachment({ src, pal }: { src?: string | null; pal: Pal }) {
  const box: CSSProperties = { width: 225, height: 300, maxWidth: "100%", borderRadius: 8 };
  if (!src) {
    return (
      <div className="flex items-center justify-center" style={{ ...box, background: pal.mod }}>
        <ImageGlyph color={pal.muted} />
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" draggable={false} className="block object-cover" style={box} />
  );
}

function usernameOf(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9_.]+/g, "")
    .slice(0, 32);
}

/* --------------------------------- screen --------------------------------- */

export function Discord({ scenario, playback, lang }: PlatformProps) {
  const dark = scenario.theme === "dark";
  const pal = palette(dark);
  const s = STR[lang];
  const { messages, typing, clockMs } = playback;
  const exporting = clockMs !== undefined;
  const live = playback.isLive && !exporting;
  const scrollRef = useChatScroll<HTMLDivElement>(`${messages.length}-${typing}`);

  const showTyping = typing || (!playback.isLive && scenario.presence === "typing");
  const online = scenario.presence !== "lastseen" || showTyping;
  const them = scenario.them;
  const themName = them.name.trim() || "Discord";
  const handle = usernameOf(them.name);
  const today = longDate(new Date());

  const textStyle: CSSProperties = {
    color: pal.text,
    fontSize: TEXT_SIZE,
    lineHeight: `${TEXT_LINE}px`,
    fontWeight: 400,
    whiteSpace: "pre-wrap",
    overflowWrap: "anywhere",
    textAlign: "start",
  };

  return (
    <div className="flex h-full w-full flex-col" style={{ background: pal.bg, fontFamily: DISCORD_IOS_FONT }}>
      <style>{DISCORD_IOS_CSS}</style>
      <StatusBar device={scenario.device} tint={dark ? "light" : "dark"} background={pal.bg} />

      {/* Discord has no RTL layout, so the app area is pinned LTR in every locale. */}
      <div dir="ltr" className="flex min-h-0 flex-1 flex-col">
        {/* Header: ← · avatar+status · name › · call · video */}
        <div
          className="flex shrink-0 items-center"
          style={{ height: 52, paddingLeft: 16, paddingRight: 8, borderBottom: `1px solid ${pal.border}` }}
        >
          <BackArrow color={pal.icon} />
          <span style={{ marginLeft: 14 }}>
            <PresenceAvatar person={them} size={24} online={online} pal={pal} />
          </span>
          <div className="flex min-w-0 flex-1 items-center" style={{ marginLeft: 10, gap: 2 }}>
            <span
              dir="auto"
              className="truncate"
              style={{ color: pal.strong, fontSize: 20, lineHeight: "24px", fontWeight: 600 }}
            >
              {themName}
            </span>
            <ChevronSmallRight color={pal.icon} />
          </div>
          <div className="flex shrink-0 items-center" style={{ gap: 4 }}>
            {[PhoneCallGlyph, VideoGlyph].map((G, i) => (
              <span key={i} className="flex items-center justify-center" style={{ width: 40, height: 40 }}>
                <G color={pal.icon} />
              </span>
            ))}
          </div>
        </div>

        {/* Chat body */}
        <div className="relative flex min-h-0 flex-1 flex-col">
          <div
            ref={scrollRef}
            className="rcss-scroll min-h-0 flex-1 overflow-y-auto"
            style={{ background: pal.bg, paddingBottom: showTyping ? 34 : 22 }}
          >
            {/* DM intro (top of the history) */}
            <div style={{ padding: `20px ${EDGE}px 0` }}>
              <DiscordAvatar person={them} size={80} />
              <div
                dir="auto"
                className="break-words"
                style={{ color: pal.strong, fontSize: 24, lineHeight: "30px", fontWeight: 700, marginTop: 12, textAlign: "left" }}
              >
                {themName}
              </div>
              {handle && (
                <div style={{ color: pal.text, fontSize: 16, lineHeight: "20px", fontWeight: 500, marginTop: 2 }}>{handle}</div>
              )}
              <div style={{ color: pal.muted, fontSize: 14, lineHeight: "18px", fontWeight: 400, marginTop: 10 }}>
                {s.beginning}
                <span dir="auto" style={{ color: pal.text, fontWeight: 600 }}>
                  {themName}
                </span>
                .
              </div>
            </div>

            {/* Day divider */}
            <div className="flex items-center" style={{ margin: `20px ${EDGE}px 0`, gap: 8 }}>
              <span className="flex-1" style={{ height: 1, background: pal.border }} />
              <span style={{ color: pal.muted, fontSize: 12, lineHeight: "16px", fontWeight: 600 }}>{today}</span>
              <span className="flex-1" style={{ height: 1, background: pal.border }} />
            </div>

            {messages.map((m: Message, i) => {
              const mine = m.sender === "me";
              const person = mine ? scenario.me : them;
              const name = person.name.trim() || (mine ? "You" : themName);
              const { firstOfGroup } = groupInfo(messages, i);
              const caption = m.type === "image" ? m.text.trim() : "";
              const emoji = m.type === "text" && isEmojiOnly(m.text);
              const time = clock12(m.time);
              // "Sending": only while playback has not yet reached the final state.
              const pending = mine && playback.isLive && playback.statusOf(m) === "sent" && m.status !== "sent";

              const body =
                m.type === "voice" ? (
                  <div style={{ paddingTop: 4, paddingBottom: 2 }}>
                    <VoiceMessage id={m.id} pal={pal} duration={m.voiceDuration} />
                  </div>
                ) : m.type === "image" ? (
                  <div className="flex flex-col items-start" style={{ gap: 4 }}>
                    {caption && (
                      <div dir={dirOf(caption)} className="w-full" style={textStyle}>
                        {caption}
                      </div>
                    )}
                    <div style={{ paddingTop: caption ? 0 : 4, paddingBottom: 2 }}>
                      <Attachment src={m.imageSrc} pal={pal} />
                    </div>
                  </div>
                ) : emoji ? (
                  <div style={{ fontSize: 48, lineHeight: "56px", textAlign: "left" }}>{m.text.trim()}</div>
                ) : (
                  <div dir={dirOf(m.text)} style={textStyle}>
                    {m.text}
                  </div>
                );

              return (
                <div
                  key={m.id}
                  data-mid={m.id}
                  data-sender={m.sender}
                  className={live ? "dcios-enter" : undefined}
                  style={{
                    paddingTop: firstOfGroup ? (i === 0 ? 12 : GROUP_GAP) : IN_GROUP_GAP,
                    paddingRight: EDGE,
                    paddingLeft: firstOfGroup ? EDGE : CONTENT_X,
                  }}
                >
                  <div className="dcios-pending" style={{ opacity: pending ? 0.5 : 1 }}>
                    {firstOfGroup ? (
                      <div className="flex items-start">
                        <DiscordAvatar person={person} size={AVATAR} />
                        <div className="min-w-0 flex-1" style={{ marginLeft: GUTTER }}>
                          <div className="flex min-w-0 items-baseline" style={{ height: NAME_LINE }}>
                            <span
                              dir="auto"
                              className="truncate"
                              style={{ color: pal.strong, fontSize: 16, lineHeight: `${NAME_LINE}px`, fontWeight: 500 }}
                            >
                              {name}
                            </span>
                            {time && (
                              <span
                                className="shrink-0 whitespace-nowrap"
                                style={{
                                  color: pal.muted,
                                  fontSize: 12,
                                  lineHeight: `${NAME_LINE}px`,
                                  fontWeight: 500,
                                  marginLeft: 5,
                                }}
                              >
                                {s.todayAt(time)}
                              </span>
                            )}
                          </div>
                          {body}
                        </div>
                      </div>
                    ) : (
                      body
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Scrim: the list fades out under the floating chat bar. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0"
            style={{ height: 20, background: `linear-gradient(to bottom, transparent, ${pal.bg})` }}
          />

          {/* "<Name> is typing..." just above the chat bar */}
          {showTyping && (
            <div
              className={`absolute inset-x-0 bottom-0 flex items-center ${live ? "dcios-fade" : ""}`}
              style={{ height: 22, paddingLeft: EDGE + 2, paddingRight: EDGE, gap: 6, background: pal.bg }}
            >
              <span className="flex items-center" style={{ gap: 3 }}>
                {[0, 1, 2].map((d) => {
                  const st = exporting ? dotAt(clockMs, d) : null;
                  return (
                    <span
                      key={d}
                      className={exporting ? "block rounded-full" : "dcios-dot block rounded-full"}
                      style={{
                        width: 5,
                        height: 5,
                        background: pal.text,
                        ...(st
                          ? { opacity: st.opacity, transform: `scale(${st.scale})` }
                          : { animationDelay: `${d * DOT_STAGGER - DOT_CYCLE}ms` }),
                      }}
                    />
                  );
                })}
              </span>
              <span className="min-w-0 truncate" style={{ color: pal.text, fontSize: 12, lineHeight: "16px", fontWeight: 500 }}>
                <span dir="auto" style={{ fontWeight: 700 }}>
                  {themName}
                </span>
                {s.isTyping}
              </span>
            </div>
          )}
        </div>

        {/* Chat bar: + · "Message @name" · Gift · Emoji · Mic */}
        <div className="shrink-0" style={{ background: pal.bg, padding: `0 ${EDGE}px ${BAR_BOTTOM}px` }}>
          <div
            className="flex items-center"
            style={{
              height: BAR_H,
              borderRadius: 16,
              background: pal.bar,
              border: `1px solid ${pal.border}`,
              boxSizing: "border-box",
              paddingLeft: 11,
              paddingRight: 11,
            }}
          >
            <span className="flex shrink-0 items-center justify-center" style={{ width: 32, height: 32 }}>
              <PlusGlyph color={pal.icon} />
            </span>
            <span
              className="min-w-0 flex-1 truncate"
              style={{ color: pal.muted, fontSize: 16, lineHeight: "20px", fontWeight: 400, marginLeft: 9, marginRight: 8 }}
            >
              {s.messageAt(themName)}
            </span>
            <span className="flex shrink-0 items-center" style={{ gap: 8 }}>
              {[GiftGlyph, EmojiGlyph, MicGlyph].map((G, i) => (
                <span key={i} className="flex items-center justify-center" style={{ width: 32, height: 32 }}>
                  <G color={pal.icon} />
                </span>
              ))}
            </span>
          </div>
        </div>
      </div>
      <SystemBottomBar device={scenario.device} bg={pal.bg} fg={pal.homeIndicator} />
    </div>
  );
}
