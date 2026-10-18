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
 * Round 4 (reactions, replies, compose typing) — all from the live client CSS
 * (discord.com/assets/*.css, Oct 2026; theme tokens resolved for .theme-darker
 * = "Dark" and .theme-light):
 *   Reaction pill (.reaction / .reactionInner / .reactionCount): radius 8,
 *     1 px border, padding 2/6, 20 px emoji with 2 px block margin, count 14
 *     semibold 6 px after the emoji, 4 px between pills.
 *     default  bg --reaction-background-default  #97979f@.122 (both themes)
 *              border --reaction-border-default   #97979f@.122 · @.278 (light)
 *              count --text-subtle                #abacb2 · #595a63
 *     mine     bg --reaction-background-reacted-default #5865f2@.239
 *              border --reaction-border-reacted-default #5865f2
 *              count --reaction-text-reacted-default  #b9c8ff · #273478
 *   Reply bar (.repliedMessage / .replyAvatar / .messageSpine:before): one
 *     14 px line on an 18 px line-height (--custom-message-reply-message-
 *     preview-line-height 1.125rem), 4 px (--reply-spacing) above the header,
 *     16 px round avatar + 4 px (--custom-message-meta-space), "@name" at
 *     .64 opacity, one-line snippet in --text-default. Spine: 2 px border
 *     (top + start) with a 6 px start-start radius in --spine-default
 *     #474851 · #c5c6ca, from the avatar's centre line to 4 px before the
 *     reply, top at the line's middle, ending 2 px above the avatar. A reply
 *     always starts a new message group (avatar + name are shown again).
 *     Attachment-only targets read "Tap to see attachment" (italic) + image icon.
 *   Floating chat bar while typing (.mobile-visual-refresh-floating): send
 *     button 36×36 (--mobile-chat-input-send-button-*), a blurple
 *     (--control-primary-background-default #5865f2) circle with the white
 *     SendMessageIcon; it replaces the mic, the Gift button collapses and the
 *     Emoji button stays. Input text-md/normal (16/20) in --text-default; the
 *     bar grows line by line (buttons stay pinned to the bottom) up to 6 lines.
 *     Replying adds the floating accessory bar above it (1 px border, 8 px
 *     below, 16 px side margins, context-bar padding 12/8):
 *     "Replying to Name" · "@ ON" · close.
 *   Voice message duration in the floating refresh: text-sm/semibold (14/600).
 *
 * Round 5 (groups, new kinds, keyboard), again from the live client
 * (discord.com/assets/*.css + web.*.js, Oct 2026; .theme-darker / .theme-light):
 *   Group DMs: no roles exist in a group DM, so every author name stays
 *     --text-strong (Discord only colours names by server role); each member
 *     keeps their own (default) avatar colour. Header = facepile of two members
 *     (or the group icon) + group name + "N Members"; intro "Welcome to the
 *     beginning of the <name> group."; placeholder "Message <group name>"
 *     (no "@" for groups). A new author always starts a new message group.
 *   Link embed (.embed/.embedFull/.grid): radius 4, bg --background-surface-high
 *     #242429 · #ffffff, 1 px --border-subtle, 4 px start border in the site's
 *     theme colour (default --border-normal #97979f@.2 · @.4); grid padding
 *     2/16/16/12, provider text-xs muted, title 16 semibold --text-link
 *     (#4d96ee · #006dd4), description 14/18 --text-default, 8 px between rows,
 *     large image 16 px below (radius 4), thumbnail 80 px at the end.
 *     URLs in the text are --text-link, no underline.
 *   Location: Discord has no location sharing; people paste a Google Maps link,
 *     which unfurls as an embed (place title, Maps description, map thumbnail).
 *     Live location has no Discord equivalent and renders the same way.
 *   File (.file/.icon/.filenameLinkWrapper/.metadata): bg surface-high, 1 px
 *     border-subtle, radius 8, padding 16, width 432 max 100 %; 30×40 file-type
 *     icon (Discord's own /assets/*.svg — PDF = "acrobat", blurple on lavender),
 *     name 16 --text-link, size 12 --text-muted, DownloadIcon at the end.
 *   Sticker: 160×160 (MESSAGE_STICKER_SIZE), no bubble, under the header.
 *   Calls: system message in the avatar column — PhoneCall glyph in
 *     --status-positive (#23a55a · #24934e), or --status-danger (#f23f43 ·
 *     #da373c) when missed — "<b>Name</b> started a call that lasted 4 minutes."
 *     / "You missed a call from <b>Name</b> that lasted a few seconds." in
 *     --text-muted + the timestamp; durations are moment-style humanised.
 *     Video calls produce the same system message.
 *   Deleted: Discord removes a deleted message for everyone (no placeholder),
 *     so the row collapses to nothing; a reply to it reads "Original message
 *     was deleted".
 *   "(edited)" (.edited): 10 px, --text-muted, 4 px after the last word.
 *   Keyboard: the floating chat bar sits 8 pt above the keyboard; the list
 *     shrinks with it (useKeyboardInset; the lift follows its transition).
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

import type { GroupChat, Message, Person } from "../../types";
import { dirOf, SystemBottomBar, useChatScroll } from "../shared";
import { StatusBar } from "../devices/StatusBar";
import { useKeyboardInset } from "../devices/keyboard-context";
import type { Lang } from "./chrome";
import type { PlatformMotion, PlatformProps } from "./types";

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
  spine: string;
  reactBg: string;
  reactBorder: string;
  reactText: string;
  reactedBg: string;
  reactedBorder: string;
  reactedText: string;
  brand: string;
  link: string;
  surface: string;
  embedStripe: string;
  positive: string;
  danger: string;
}

function palette(dark: boolean): Pal {
  return dark
    ? {
        link: "#4d96ee",
        surface: "#242429",
        embedStripe: "rgba(151,151,159,0.2)",
        positive: "#23a55a",
        danger: "#f23f43",
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
        spine: "#474851",
        reactBg: "rgba(151,151,159,0.122)",
        reactBorder: "rgba(151,151,159,0.122)",
        reactText: "#abacb2",
        reactedBg: "rgba(88,101,242,0.239)",
        reactedBorder: "#5865f2",
        reactedText: "#b9c8ff",
        brand: "#5865f2",
      }
    : {
        link: "#006dd4",
        surface: "#ffffff",
        embedStripe: "rgba(151,151,159,0.4)",
        positive: "#24934e",
        danger: "#da373c",
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
        spine: "#c5c6ca",
        reactBg: "rgba(151,151,159,0.122)",
        reactBorder: "rgba(151,151,159,0.278)",
        reactText: "#595a63",
        reactedBg: "rgba(88,101,242,0.239)",
        reactedBorder: "#5865f2",
        reactedText: "#273478",
        brand: "#5865f2",
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
  attachment: "Tap to see attachment",
  replyingTo: "Replying to ",
  mentionOn: "ON",
  messageGroup: (name: string) => `Message ${name}`,
  members: (n: number) => `${n} Members`,
  groupWelcome: ["Welcome to the beginning of the ", " group."] as const,
  edited: "(edited)",
  replyDeleted: "Original message was deleted",
  callStarted: (dur: string) => (dur ? ` started a call that lasted ${dur}.` : " started a call."),
  callMissed: ["You missed a call from ", " that lasted "] as const,
  mapsDescription: "Find local businesses, view maps and get driving directions in Google Maps.",
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

/**
 * Call durations as Discord prints them (moment.humanize thresholds):
 * < 45 s "a few seconds", < 90 s "a minute", < 45 min "N minutes", < 90 min
 * "an hour", then "N hours". A typed "4:12" → "4 minutes".
 */
function humanizeCall(raw?: string): string {
  const t = raw?.trim() ?? "";
  if (!t) return "a few seconds";
  const parts = t.split(":").map((x) => Number(x));
  if (parts.some((x) => Number.isNaN(x))) return t;
  const secs = parts.reduce((a, b) => a * 60 + b, 0);
  if (secs < 45) return "a few seconds";
  if (secs < 90) return "a minute";
  const mins = Math.round(secs / 60);
  if (mins < 45) return `${mins} minutes`;
  if (mins < 90) return "an hour";
  return `${Math.round(mins / 60)} hours`;
}

const URL_RE = /(https?:\/\/[^\s]+)/g;

/** URLs inside message text render in --text-link (no underline). */
function Linkified({ text, color }: { text: string; color: string }) {
  const parts = text.split(URL_RE);
  return (
    <>
      {parts.map((p, i) =>
        i % 2 === 1 ? (
          <span key={i} dir="ltr" style={{ color, unicodeBidi: "isolate" }}>
            {p}
          </span>
        ) : (
          p
        ),
      )}
    </>
  );
}

/** Deterministic short id (maps.app.goo.gl style) from a message id. */
function shortId(seed: string, n: number): string {
  const abc = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  let out = "";
  for (let i = 0; i < n; i++) {
    h = Math.imul(h ^ (h >>> 15), 2246822519);
    out += abc[(h >>> 0) % abc.length];
  }
  return out;
}

/** Sites set their embed colour with <meta name="theme-color">; a stable pick per domain. */
const EMBED_COLORS = ["#feee00", "#5865f2", "#1d9bf0", "#e60023", "#00b06b", "#ff6a00"];

function embedColor(site: string): string {
  let h = 0;
  for (let i = 0; i < site.length; i++) h = (h * 31 + site.charCodeAt(i)) | 0;
  return EMBED_COLORS[Math.abs(h) % EMBED_COLORS.length];
}

function siteOf(url: string): string {
  const m = /^https?:\/\/([^/?#]+)/i.exec(url.trim());
  return (m ? m[1] : url).replace(/^www\./i, "");
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
const DRAFT_MAX_LINES = 6; // the input grows to ~6 lines, then scrolls inside
const BAR_BOTTOM = 23; // bar bottom sits 42 pt above the screen edge = 23 + 19 (home-indicator band)
const HOME_BAND = 19; // SystemBottomBar height on iPhone
const KB_GAP = 8; // chat bar → keyboard gap while the keyboard is up
const SCREEN_W = 393;
const CONTENT_W = SCREEN_W - CONTENT_X - EDGE; // 309
const STICKER = 160; // MESSAGE_STICKER_SIZE
const EMBED_THUMB = 80;
/** Large embed image width: content − 1 px border − 4 px stripe − 12/16 grid padding. */
const EMBED_IMG_W = CONTENT_W - 1 - 4 - 12 - 16;

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

/** UIKit text caret: ~0.5 s on / 0.5 s off. */
const CARET_CYCLE = 1000;
const CARET_ON_PCT = 50;

function caretOn(ms: number): boolean {
  return ((ms % CARET_CYCLE) + CARET_CYCLE) % CARET_CYCLE < (CARET_CYCLE * CARET_ON_PCT) / 100;
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
    `.dcios-pending{transition:opacity 150ms ease-out}` +
    `@keyframes dcios-caret{0%,${CARET_ON_PCT}%{opacity:1}${CARET_ON_PCT + 0.01}%,100%{opacity:0}}` +
    `.dcios-caret{animation:dcios-caret ${CARET_CYCLE}ms linear infinite}`
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

function PhoneCallGlyph({ color, size = 24 }: { color: string; size?: number }) {
  return (
    <Icon size={size}>
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

/** SendMessageIcon (paper plane) — the send button's glyph; never mirrored. */
function SendGlyph() {
  return (
    <Icon size={20}>
      <path
        fill="#ffffff"
        d="M6.6 10.02 14 11.4a.6.6 0 0 1 0 1.18L6.6 14l-2.94 5.87a1.48 1.48 0 0 0 1.99 1.98l17.03-8.52a1.48 1.48 0 0 0 0-2.64L5.65 2.16a1.48 1.48 0 0 0-1.99 1.98l2.94 5.88Z"
      />
    </Icon>
  );
}

/** Filled circle with an X — the reply accessory's close button. */
function CircleXGlyph({ color, cut }: { color: string; cut: string }) {
  return (
    <Icon size={20}>
      <circle cx="12" cy="12" r="10" fill={color} />
      <path d="m8.5 8.5 7 7m0-7-7 7" stroke={cut} strokeWidth="2" strokeLinecap="round" />
    </Icon>
  );
}

function ImageGlyph({ color, size = 40 }: { color: string; size?: number }) {
  return (
    <Icon size={size}>
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
function DiscordAvatar({ person, size, tint }: { person: Person; size: number; tint?: string }) {
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
      style={{ width: size, height: size, background: tint ?? defaultAvatarColor(person.name) }}
    >
      <svg width={logo} height={logo} viewBox="0 0 24 24" style={{ display: "block", marginTop: size * 0.02 }}>
        <path fill="#ffffff" d={DISCORD_LOGO} />
      </svg>
    </span>
  );
}

/** Group members get stable default-avatar colours by member index (green, yellow, red, pink, …). */
function memberTint(i: number): string {
  return DEFAULT_AVATAR_COLORS[(i + 2) % DEFAULT_AVATAR_COLORS.length];
}

/** Group DM picture: the uploaded icon, else a two-member facepile (back top-left, front bottom-right, cut-out ring). */
function GroupFace({ group, size, ringColor }: { group: GroupChat; size: number; ringColor: string }) {
  if (group.avatar) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={group.avatar}
        alt=""
        width={size}
        height={size}
        draggable={false}
        className="block shrink-0 rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  const a = group.members[0] ?? { name: group.name, avatar: null };
  const b = group.members[1] ?? a;
  const s = Math.round(size * 0.68);
  const ring = Math.max(1.5, size * 0.06);
  return (
    <span className="relative block shrink-0" style={{ width: size, height: size }}>
      <span className="absolute block" style={{ left: 0, top: 0 }}>
        <DiscordAvatar person={a} size={s} tint={memberTint(0)} />
      </span>
      <span
        className="absolute block rounded-full"
        style={{ right: -ring, bottom: -ring, padding: ring, background: ringColor }}
      >
        <DiscordAvatar person={b} size={s} tint={memberTint(1)} />
      </span>
    </span>
  );
}

/* ------------------------------ new message kinds ------------------------------ */

/** DownloadIcon (production path). */
function DownloadGlyph({ color }: { color: string }) {
  return (
    <Icon size={24}>
      <path
        fill={color}
        d="M12 2a1 1 0 0 1 1 1v10.59l3.3-3.3a1 1 0 1 1 1.4 1.42l-5 5a1 1 0 0 1-1.4 0l-5-5a1 1 0 1 1 1.4-1.42l3.3 3.3V3a1 1 0 0 1 1-1ZM3 20a1 1 0 1 0 0 2h18a1 1 0 1 0 0-2H3Z"
      />
    </Icon>
  );
}

const FILE_SHEET =
  "m72 29.3v60.3c0 2.24 0 3.36-.44 4.22-.38.74-1 1.36-1.74 1.74-.86.44-1.98.44-4.22.44h-59.2c-2.24 0-3.36 0-4.22-.44-.74-.38-1.36-1-1.74-1.74-.44-.86-.44-1.98-.44-4.22v-83.2c0-2.24 0-3.36.44-4.22.38-.74 1-1.36 1.74-1.74.86-.44 1.98-.44 4.22-.44h36.3c1.96 0 2.94 0 3.86.22.5.12.98.28 1.44.5v16.88c0 2.24 0 3.36.44 4.22.38.74 1 1.36 1.74 1.74.86.44 1.98.44 4.22.44h16.88c.22.46.38.94.5 1.44.22.92.22 1.9.22 3.86z";
const FILE_FOLD =
  "m68.26 20.26c1.38 1.38 2.06 2.06 2.56 2.88.18.28.32.56.46.86h-16.88c-2.24 0-3.36 0-4.22-.44-.74-.38-1.36-1-1.74-1.74-.44-.86-.44-1.98-.44-4.22v-16.880029c.3.14.58.28.86.459999.82.5 1.5 1.18 2.88 2.56z";
const FILE_ACROBAT =
  "m56.1014 65.0909c-3.1394-3.2-11.7-1.8909-13.7625-1.6545-2.2633-2.2182-4.1981-4.7273-5.7861-7.4546 1.1317-3.1636 1.7705-6.4727 1.9348-9.8182 0-2.9636-1.2047-6.1636-4.5815-6.1636-1.1864.0364-2.2815.6545-2.9021 1.6545-1.442 2.491-.8397 7.4546 1.4419 12.5455-1.5697 4.6545-3.5592 9.1636-5.9138 13.4909-3.5046 1.4182-10.8604 4.7273-11.4627 8.2909-.2373 1.0909.146 2.2.9674 2.9637.8578.6909 1.9165 1.0545 3.0299 1.0545 4.4719 0 8.8161-6.0364 11.8278-11.1273 3.4315-1.1454 6.936-2.0545 10.4952-2.7272 4.7092 4.0181 8.8161 4.6181 10.9882 4.6181 2.9021 0 3.9791-1.1818 4.3441-2.2545.5293-1.1455.2921-2.5091-.6206-3.4182zm-3.0117 2.0182c-.1277.8364-1.2047 1.6545-3.1394 1.1818-2.2451-.5818-4.3442-1.6364-6.1512-3.0727 1.5697-.2364 5.0743-.6 7.5931-.1273.9674.2364 1.9348.8182 1.6975 2.0182zm-20.1509-24.3818c.2007-.3455.5658-.5637.9673-.6 1.077 0 1.3325 1.3091 1.3325 2.3636-.1278 2.5091-.6023 4.9636-1.442 7.3455-1.8252-4.7273-1.4602-8.0546-.8578-9.1091zm-.2373 22.9454c1.0404-2.1636 1.9713-4.3636 2.7744-6.6182 1.1134 1.7455 2.4093 3.3637 3.8695 4.8546-.0182.1091-3.76.8182-6.6439 1.7636zm-7.1186 4.7455c-2.7744 4.4909-5.6766 7.3454-7.2463 7.3454-.2555-.0181-.5111-.1091-.7301-.2363-.3651-.2364-.5111-.6728-.3651-1.0728.3651-1.6545 3.5046-3.909 8.3415-6.0363z";
const FILE_DOCUMENT = "m56 40h-16v4h16zm0 12h-16v4h16zm-40 12h40v4h-40zm40 12h-40v4h40zm-30-20h-4v-12h-6v-4h16v4h-6z";

/** Discord's file-type icons (/assets/*.svg, 72×96 drawn at 30×40): acrobat for PDF, document, else unknown. */
function FileTypeIcon({ name }: { name: string }) {
  const n = name.toLowerCase();
  const glyph = /\.pdf$/.test(n)
    ? FILE_ACROBAT
    : /\.(?:txt|rtf|doc|docx|md|pages|ppt|pptx|pptm|key|log)$/.test(n)
      ? FILE_DOCUMENT
      : null;
  return (
    <svg width="30" height="40" viewBox="0 0 72 96" fill="none" className="shrink-0" style={{ display: "block" }}>
      <path d={FILE_SHEET} fill="#d3d6fd" />
      <path d={FILE_FOLD} fill="#939bf9" />
      {glyph && <path d={glyph} fill="#5865f2" fillRule="evenodd" clipRule="evenodd" />}
    </svg>
  );
}

function FileCard({ name, size, pal }: { name: string; size?: string; pal: Pal }) {
  return (
    <div
      dir="ltr"
      className="flex items-center"
      style={{
        width: 432,
        maxWidth: "100%",
        boxSizing: "border-box",
        padding: 16,
        borderRadius: 8,
        background: pal.surface,
        border: `1px solid ${pal.border}`,
      }}
    >
      <span style={{ marginRight: 8 }}>
        <FileTypeIcon name={name} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate" style={{ color: pal.link, fontSize: 16, lineHeight: "20px", fontWeight: 400 }}>
          {name || "file"}
        </div>
        {size && <div style={{ color: pal.muted, fontSize: 12, lineHeight: "16px", fontWeight: 400 }}>{size}</div>}
      </div>
      <span style={{ marginLeft: 8 }}>
        <DownloadGlyph color={pal.icon} />
      </span>
    </div>
  );
}

/** A static Google Maps thumbnail (light map style in both themes, red pin). */
function MapThumb({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" className="block shrink-0" style={{ borderRadius: 4 }}>
      <rect width="80" height="80" fill="#f2efe9" />
      <path fill="#e7e3dc" d="M-2 -2h26v20H-2zM32 -2h22v14H32zM62 -2h20v24H62zM-2 26h20v22H-2zM30 22h20v18H30zM58 30h24v18H58zM-2 56h26v26H-2zM34 50h18v32H34zM60 56h22v26H60z" />
      <path fill="#c8e7c0" d="M30 22h20v18H30z" />
      <path fill="#aadaff" d="M60 56c6 3 14 2 22 0v26H58c-1-9 0-19 2-26Z" />
      <path stroke="#ffffff" strokeWidth="3" d="M-2 22h84M-2 52h84M27 -2v84M56 -2v84" />
      <path stroke="#fde293" strokeWidth="5" d="M-4 74 84 6" />
      <path stroke="#f9cf62" strokeWidth="0.8" fill="none" d="M-4 71.6 84 3.6M-4 76.4 84 8.4" />
      <path fill="#ea4335" d="M40 21c-6.4 0-11.5 5-11.5 11.2 0 8.3 11.5 19.8 11.5 19.8s11.5-11.5 11.5-19.8C51.5 26 46.4 21 40 21Z" />
      <circle cx="40" cy="32.3" r="4.2" fill="#a50e0e" />
    </svg>
  );
}

/** Discord rich embed: 4 px theme-colour start border, provider · title · description, image or thumbnail. */
function Embed({
  pal,
  stripe,
  provider,
  title,
  description,
  image,
  thumb,
}: {
  pal: Pal;
  stripe: string;
  provider?: string;
  title: string;
  description?: string;
  image?: string | null;
  thumb?: ReactNode;
}) {
  return (
    <div style={{ paddingTop: 4, paddingBottom: 2 }}>
      <div
        className="grid"
        style={{
          width: image ? "100%" : "fit-content",
          maxWidth: "100%",
          boxSizing: "border-box",
          borderRadius: 4,
          background: pal.surface,
          border: `1px solid ${pal.border}`,
          borderLeft: `4px solid ${stripe}`,
          padding: "2px 16px 16px 12px",
          gridTemplateColumns: thumb ? "minmax(0,1fr) min-content" : "minmax(0,1fr)",
        }}
      >
        {provider && (
          <div dir="auto" className="truncate" style={{ marginTop: 8, color: pal.muted, fontSize: 12, lineHeight: "16px", fontWeight: 400 }}>
            {provider}
          </div>
        )}
        <div
          dir="auto"
          style={{ marginTop: 8, color: pal.link, fontSize: 16, lineHeight: "20px", fontWeight: 600, textAlign: "start", unicodeBidi: "plaintext" }}
        >
          {title}
        </div>
        {description && (
          <div
            dir="auto"
            style={{ marginTop: 8, color: pal.text, fontSize: 14, lineHeight: "18px", fontWeight: 400, textAlign: "start", unicodeBidi: "plaintext" }}
          >
            {description}
          </div>
        )}
        {thumb && (
          <div style={{ gridColumn: 2, gridRow: "1 / 8", marginLeft: 16, marginTop: 8, justifySelf: "end" }}>{thumb}</div>
        )}
        {image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt=""
            draggable={false}
            className="block object-cover"
            style={{ marginTop: 16, width: EMBED_IMG_W, maxWidth: "100%", height: Math.round(EMBED_IMG_W / 1.905), borderRadius: 4 }}
          />
        )}
      </div>
    </div>
  );
}

/** Sticker: 160×160, no bubble — the image, or the emoji drawn as a big sticker. */
function Sticker({ src, text }: { src?: string | null; text: string }) {
  return (
    <div style={{ paddingTop: 4, paddingBottom: 2 }}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" draggable={false} className="block object-contain" style={{ width: STICKER, height: STICKER }} />
      ) : (
        <div
          className="flex items-center justify-center"
          style={{ width: STICKER, height: STICKER, fontSize: 124, lineHeight: `${STICKER}px`, overflow: "hidden" }}
        >
          {text.trim() || "🙂"}
        </div>
      )}
    </div>
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
        style={{ color: pal.muted, fontSize: 14, lineHeight: "18px", fontWeight: 600, marginLeft: -2 }}
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

/* ------------------------- reactions / replies / caret ------------------------- */

/** One reaction pill with count 1; `me` = my own reaction (blurple reacted state). */
function ReactionPill({ emoji, me, pal }: { emoji: string; me: boolean; pal: Pal }) {
  return (
    <div className="flex" style={{ paddingTop: 4 }}>
      <span
        className="flex items-center"
        style={{
          boxSizing: "border-box",
          borderRadius: 8,
          border: `1px solid ${me ? pal.reactedBorder : pal.reactBorder}`,
          background: me ? pal.reactedBg : pal.reactBg,
          padding: "2px 6px",
        }}
      >
        <span
          className="flex items-center justify-center"
          style={{ width: 20, height: 20, margin: "2px 0", fontSize: 17, lineHeight: "20px" }}
        >
          {emoji}
        </span>
        <span
          className="tabular-nums"
          style={{
            color: me ? pal.reactedText : pal.reactText,
            fontSize: 14,
            lineHeight: "18px",
            fontWeight: 600,
            marginLeft: 6,
            minWidth: 9,
            textAlign: "center",
          }}
        >
          1
        </span>
      </span>
    </div>
  );
}

/** One-line preview of the replied-to message (newlines collapsed). */
function replySnippet(m: Message): string {
  return m.text.replace(/\s+/g, " ").trim();
}

/**
 * Reply bar above a message header: spine from the avatar's centre line,
 * 16 px avatar, "@name", one-line snippet. Rendered inside the content column
 * (x = 68), so the spine reaches back by avatar/2 + gutter.
 */
function ReplyBar({ target, person, tint, fallbackName, pal, s }: {
  target: Message;
  person: Person;
  tint?: string;
  fallbackName: string;
  pal: Pal;
  s: typeof EN;
}) {
  const name = person.name.trim() || fallbackName;
  const snippet = replySnippet(target);
  const attachmentOnly = target.type !== "text" && !snippet;
  const spine = (
    <span
      aria-hidden
      className="absolute block"
      style={{
        left: -(AVATAR / 2 + GUTTER) - 1,
        width: AVATAR / 2 + GUTTER + 1 - 4,
        top: 8,
        height: 12,
        boxSizing: "border-box",
        borderTop: `2px solid ${pal.spine}`,
        borderLeft: `2px solid ${pal.spine}`,
        borderTopLeftRadius: 6,
      }}
    />
  );
  const rowStyle: CSSProperties = { height: 18, marginLeft: AVATAR + GUTTER, marginBottom: 4, fontSize: 14, lineHeight: "18px", whiteSpace: "pre" };
  if (target.type === "deleted") {
    // The replied-to message is gone: reply icon in a 16 px circle + italic notice.
    return (
      <div className="relative flex min-w-0 items-center" style={rowStyle}>
        {spine}
        <span
          className="flex shrink-0 items-center justify-center rounded-full"
          style={{ width: 16, height: 16, marginRight: 4, background: pal.mod }}
        >
          <svg width="10" height="10" viewBox="0 0 24 24" style={{ display: "block" }}>
            <path fill={pal.icon} d="M2.3 7.3a1 1 0 0 0 0 1.4l5 5a1 1 0 0 0 1.4-1.4L5.42 9H11a7 7 0 0 1 7 7v4a1 1 0 1 0 2 0v-4a9 9 0 0 0-9-9H5.41l3.3-3.3a1 1 0 0 0-1.42-1.4l-5 5Z" />
          </svg>
        </span>
        <span className="min-w-0 truncate" style={{ color: pal.muted, fontStyle: "italic", paddingRight: 2 }}>
          {s.replyDeleted}
        </span>
      </div>
    );
  }
  return (
    <div className="relative flex min-w-0 items-center" style={rowStyle}>
      {spine}
      <span className="shrink-0" style={{ marginRight: 4 }}>
        <DiscordAvatar person={person} size={16} tint={tint} />
      </span>
      <span
        dir="auto"
        className="shrink-0"
        style={{ color: pal.strong, fontWeight: 500, opacity: 0.64, marginRight: 4, maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis" }}
      >
        @{name}
      </span>
      {attachmentOnly ? (
        <span className="flex min-w-0 items-center" style={{ color: pal.text }}>
          <span className="truncate" style={{ fontStyle: "italic", paddingRight: 2 }}>
            {s.attachment}
          </span>
          {target.type === "image" && (
            <span className="shrink-0" style={{ marginLeft: 4 }}>
              <ImageGlyph color={pal.icon} size={16} />
            </span>
          )}
        </span>
      ) : (
        <span dir="auto" className="min-w-0 truncate" style={{ color: pal.text }}>
          {snippet}
        </span>
      )}
    </div>
  );
}

/** UIKit caret in Discord's tint: 2 pt wide, a bit taller than the text line. */
function Caret({ pal, clockMs }: { pal: Pal; clockMs?: number }) {
  const exporting = clockMs !== undefined;
  return (
    <span
      aria-hidden
      className={exporting ? undefined : "dcios-caret"}
      style={{
        display: "inline-block",
        width: 2,
        height: 22,
        borderRadius: 1,
        background: pal.brand,
        verticalAlign: "-5px",
        marginLeft: 1,
        marginRight: 1,
        opacity: exporting ? (caretOn(clockMs) ? 1 : 0) : undefined,
      }}
    />
  );
}

/* --------------------------------- screen --------------------------------- */

interface Author {
  person: Person;
  /** default-avatar colour for group members (by member index) */
  tint?: string;
  /** grouping key: "me", "them" or "m<index>" */
  key: string;
}

export function Discord({ scenario, playback, lang }: PlatformProps) {
  const dark = scenario.theme === "dark";
  const pal = palette(dark);
  const s = STR[lang];
  const { messages, typing, clockMs } = playback;
  const exporting = clockMs !== undefined;
  const live = playback.isLive && !exporting;
  const kb = useKeyboardInset();
  const kbUp = kb.inset > 0;
  // The composer grows while a draft wraps (and rises with the keyboard): keep the list pinned to its newest row.
  const draftKey = playback.draft ? `${Math.floor(playback.draft.text.length / 24)}` : "-";
  const scrollRef = useChatScroll<HTMLDivElement>(
    `${messages.length}-${typing}-${draftKey}-${Math.round(kb.inset / 24)}`,
  );

  const group = scenario.group && scenario.group.members.length > 0 ? scenario.group : null;
  const showTyping = typing || (!playback.isLive && scenario.presence === "typing");
  const online = scenario.presence !== "lastseen" || showTyping;
  const them = scenario.them;
  const themName = them.name.trim() || "Discord";
  const title = group ? group.name.trim() || "Group" : themName;
  const handle = usernameOf(them.name);
  const today = longDate(new Date());

  const authorOf = (m: Pick<Message, "sender" | "authorIndex">): Author => {
    if (m.sender === "me") return { person: scenario.me, key: "me" };
    if (group) {
      const idx = Math.min(Math.max(0, m.authorIndex ?? 0), group.members.length - 1);
      return { person: group.members[idx], tint: memberTint(idx), key: `m${idx}` };
    }
    return { person: them, key: "them" };
  };
  const nameOf = (a: Author) => a.person.name.trim() || (a.key === "me" ? "You" : a.key === "them" ? themName : "Member");

  // Who is typing: the author of the next "them" message still to come (group), else the other person.
  const shown = new Set(messages.map((m) => m.id));
  const nextThem = scenario.messages.find((m) => m.sender === "them" && !shown.has(m.id));
  const typer = authorOf(nextThem ?? { sender: "them", authorIndex: 0 });

  const draft = playback.draft;
  const draftText = draft?.text ?? "";
  const hasDraft = draftText.length > 0;
  const draftMsg = draft ? scenario.messages.find((x) => x.id === draft.messageId) : undefined;
  const draftReplyTo = draftMsg?.replyToId ? scenario.messages.find((x) => x.id === draftMsg.replyToId) : undefined;
  const draftReplyName = draftReplyTo ? nameOf(authorOf(draftReplyTo)) : "";

  // Message groups: same author, no system message in between; deleted messages are gone entirely.
  const rowKey = (m: Message) => (m.type === "call" ? `call:${m.id}` : authorOf(m).key);
  const firstFlags: boolean[] = [];
  let prevShown: Message | undefined;
  for (const m of messages) {
    if (m.type === "deleted") {
      firstFlags.push(false);
      continue;
    }
    firstFlags.push(!prevShown || rowKey(prevShown) !== rowKey(m));
    prevShown = m;
  }
  const firstShownId = messages.find((m) => m.type !== "deleted")?.id;

  // Chat bar: 23 pt + home band normally; 8 pt above the keyboard while it is up (continuous at the hand-over).
  const barBottom = kbUp ? Math.max(BAR_BOTTOM + HOME_BAND, kb.inset + KB_GAP) : BAR_BOTTOM;
  const kbTransition = kb.transition === "none" ? undefined : `padding-bottom ${kb.transition}`;

  const textStyle: CSSProperties = {
    color: pal.text,
    fontSize: TEXT_SIZE,
    lineHeight: `${TEXT_LINE}px`,
    fontWeight: 400,
    whiteSpace: "pre-wrap",
    overflowWrap: "anywhere",
    textAlign: "start",
  };
  const edited = (
    <span
      style={{
        color: pal.muted,
        fontSize: 10,
        lineHeight: 1,
        fontWeight: 400,
        marginLeft: 4,
        marginRight: 4,
        whiteSpace: "nowrap",
        display: "inline-block",
      }}
    >
      {s.edited}
    </span>
  );

  const renderBody = (m: Message): ReactNode => {
    if (m.type === "voice") {
      return (
        <div style={{ paddingTop: 4, paddingBottom: 2 }}>
          <VoiceMessage id={m.id} pal={pal} duration={m.voiceDuration} />
        </div>
      );
    }
    if (m.type === "image") {
      const caption = m.text.trim();
      return (
        <div className="flex flex-col items-start" style={{ gap: 4 }}>
          {caption && (
            <div dir={dirOf(caption)} className="w-full" style={textStyle}>
              <Linkified text={caption} color={pal.link} />
              {m.edited && edited}
            </div>
          )}
          <div style={{ paddingTop: caption ? 0 : 4, paddingBottom: 2 }}>
            <Attachment src={m.imageSrc} pal={pal} />
          </div>
        </div>
      );
    }
    if (m.type === "sticker") return <Sticker src={m.imageSrc} text={m.text} />;
    if (m.type === "file") {
      return (
        <div style={{ paddingTop: 4, paddingBottom: 2 }}>
          <FileCard name={m.file?.name ?? m.text.trim()} size={m.file?.size} pal={pal} />
        </div>
      );
    }
    if (m.type === "location") {
      // Discord has no location sharing: the shared Google Maps link and its unfurl.
      const loc = m.location ?? { title: m.text.trim() || "Dropped pin" };
      const url = `https://maps.app.goo.gl/${shortId(m.id, 17)}`;
      return (
        <>
          <div dir="ltr" style={textStyle}>
            <Linkified text={url} color={pal.link} />
          </div>
          <Embed
            pal={pal}
            stripe={pal.embedStripe}
            title={loc.subtitle ? `${loc.title} · ${loc.subtitle}` : loc.title}
            description={s.mapsDescription}
            thumb={<MapThumb size={EMBED_THUMB} />}
          />
        </>
      );
    }
    if (m.type === "text" && isEmojiOnly(m.text)) {
      return (
        <div style={{ fontSize: 48, lineHeight: "56px", textAlign: "left" }}>
          {m.text.trim()}
          {m.edited && edited}
        </div>
      );
    }
    const link = m.link;
    const site = link ? link.siteName?.trim() || siteOf(link.url) : "";
    return (
      <>
        <div dir={dirOf(m.text)} style={textStyle}>
          <Linkified text={m.text} color={pal.link} />
          {m.edited && edited}
        </div>
        {link && (
          <Embed
            pal={pal}
            stripe={embedColor(site)}
            provider={site}
            title={link.title}
            description={link.description}
            image={link.image}
          />
        )}
      </>
    );
  };

  return (
    <div className="flex h-full w-full flex-col" style={{ background: pal.bg, fontFamily: DISCORD_IOS_FONT }}>
      <style>{DISCORD_IOS_CSS}</style>
      <StatusBar device={scenario.device} tint={dark ? "light" : "dark"} background={pal.bg} />

      {/* Discord has no RTL layout, so the app area is pinned LTR in every locale. */}
      <div dir="ltr" className="flex min-h-0 flex-1 flex-col">
        {/* Header: ← · avatar+status (group: facepile) · name › (group: + member count) · call · video */}
        <div
          className="flex shrink-0 items-center"
          style={{ height: 52, paddingLeft: 16, paddingRight: 8, borderBottom: `1px solid ${pal.border}` }}
        >
          <BackArrow color={pal.icon} />
          <span style={{ marginLeft: group ? 12 : 14 }}>
            {group ? (
              <GroupFace group={group} size={28} ringColor={pal.bg} />
            ) : (
              <PresenceAvatar person={them} size={24} online={online} pal={pal} />
            )}
          </span>
          <div className="flex min-w-0 flex-1 flex-col justify-center" style={{ marginLeft: 10 }}>
            <div className="flex min-w-0 items-center" style={{ gap: 2 }}>
              <span
                dir="auto"
                className="truncate"
                style={{ color: pal.strong, fontSize: 20, lineHeight: "24px", fontWeight: 600 }}
              >
                {title}
              </span>
              <ChevronSmallRight color={pal.icon} />
            </div>
            {group && (
              <span style={{ color: pal.muted, fontSize: 12, lineHeight: "14px", fontWeight: 500 }}>
                {s.members(group.members.length + 1)}
              </span>
            )}
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
            {/* Intro (top of the history) */}
            <div style={{ padding: `20px ${EDGE}px 0` }}>
              {group ? <GroupFace group={group} size={80} ringColor={pal.bg} /> : <DiscordAvatar person={them} size={80} />}
              <div
                dir="auto"
                className="break-words"
                style={{ color: pal.strong, fontSize: 24, lineHeight: "30px", fontWeight: 700, marginTop: 12, textAlign: "left" }}
              >
                {title}
              </div>
              {!group && handle && (
                <div style={{ color: pal.text, fontSize: 16, lineHeight: "20px", fontWeight: 500, marginTop: 2 }}>{handle}</div>
              )}
              <div style={{ color: pal.muted, fontSize: 14, lineHeight: "18px", fontWeight: 400, marginTop: 10 }}>
                {group ? s.groupWelcome[0] : s.beginning}
                <span dir="auto" style={{ color: pal.text, fontWeight: 600 }}>
                  {title}
                </span>
                {group ? s.groupWelcome[1] : "."}
              </div>
            </div>

            {/* Day divider */}
            <div className="flex items-center" style={{ margin: `20px ${EDGE}px 0`, gap: 8 }}>
              <span className="flex-1" style={{ height: 1, background: pal.border }} />
              <span style={{ color: pal.muted, fontSize: 12, lineHeight: "16px", fontWeight: 600 }}>{today}</span>
              <span className="flex-1" style={{ height: 1, background: pal.border }} />
            </div>

            {messages.map((m: Message, i) => {
              // Deleted: Discord removes the message for everyone — nothing is left in the list.
              if (m.type === "deleted") {
                return <div key={m.id} data-mid={m.id} data-sender={m.sender} aria-hidden style={{ height: 0, overflow: "hidden" }} />;
              }
              const mine = m.sender === "me";
              const author = authorOf(m);
              const name = nameOf(author);
              const time = clock12(m.time);
              const topPad = m.id === firstShownId ? 12 : GROUP_GAP;
              const enterClass = live ? "dcios-enter" : undefined;

              // Call: system message with the phone glyph in the avatar column.
              if (m.type === "call") {
                const c = m.call ?? { video: false, missed: false };
                const missedForMe = c.missed && !mine;
                const dur = c.duration?.trim() ? humanizeCall(c.duration) : c.missed ? humanizeCall("") : "";
                const strongName = (
                  <span dir="auto" style={{ color: pal.strong, fontWeight: 500 }}>
                    {name}
                  </span>
                );
                return (
                  <div
                    key={m.id}
                    data-mid={m.id}
                    data-sender={m.sender}
                    className={enterClass}
                    style={{ paddingTop: topPad, paddingLeft: EDGE, paddingRight: EDGE }}
                  >
                    <div className="flex items-start">
                      <span className="flex shrink-0 justify-center" style={{ width: AVATAR, paddingTop: 0 }}>
                        <PhoneCallGlyph size={18} color={c.missed ? pal.danger : pal.positive} />
                      </span>
                      <div
                        className="min-w-0 flex-1"
                        style={{ marginLeft: GUTTER, color: pal.muted, fontSize: 14, lineHeight: "18px", fontWeight: 400 }}
                      >
                        {missedForMe ? (
                          <>
                            {s.callMissed[0]}
                            {strongName}
                            {s.callMissed[1]}
                            {dur}.
                          </>
                        ) : (
                          <>
                            {strongName}
                            {s.callStarted(dur)}
                          </>
                        )}
                        {time && (
                          <span style={{ fontSize: 12, fontWeight: 500, marginLeft: 6, whiteSpace: "nowrap" }}>
                            {s.todayAt(time)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              }

              const replyTarget = m.replyToId ? scenario.messages.find((x) => x.id === m.replyToId) : undefined;
              const replyAuthor = replyTarget ? authorOf(replyTarget) : undefined;
              // A reply always opens a new group: avatar + name come back.
              const firstOfGroup = firstFlags[i] || !!replyTarget;
              const reaction = m.reaction?.trim() || "";
              // "Sending": only while playback has not yet reached the final state.
              const pending = mine && playback.isLive && playback.statusOf(m) === "sent" && m.status !== "sent";
              const body = renderBody(m);

              return (
                <div
                  key={m.id}
                  data-mid={m.id}
                  data-sender={m.sender}
                  className={enterClass}
                  style={{
                    paddingTop: firstOfGroup ? topPad : IN_GROUP_GAP,
                    paddingRight: EDGE,
                    paddingLeft: firstOfGroup ? EDGE : CONTENT_X,
                  }}
                >
                  <div className="dcios-pending" style={{ opacity: pending ? 0.5 : 1 }}>
                    {replyTarget && replyAuthor && (
                      <ReplyBar
                        target={replyTarget}
                        person={replyAuthor.person}
                        tint={replyAuthor.tint}
                        fallbackName={nameOf(replyAuthor)}
                        pal={pal}
                        s={s}
                      />
                    )}
                    {firstOfGroup ? (
                      <div className="flex items-start">
                        <DiscordAvatar person={author.person} size={AVATAR} tint={author.tint} />
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
                          {reaction && <ReactionPill emoji={reaction} me={!mine} pal={pal} />}
                        </div>
                      </div>
                    ) : (
                      <>
                        {body}
                        {reaction && <ReactionPill emoji={reaction} me={!mine} pal={pal} />}
                      </>
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
                  {nameOf(typer)}
                </span>
                {s.isTyping}
              </span>
            </div>
          )}
        </div>

        {/* Chat bar: + · "Message @name" · Gift · Emoji · Mic (typing: + · text · Emoji · Send) */}
        <div
          className="shrink-0"
          style={{ background: pal.bg, padding: `0 ${EDGE}px ${barBottom}px`, transition: kbTransition }}
        >
          {draftReplyTo && (
            <div
              className="flex items-center"
              style={{
                marginBottom: 8,
                borderRadius: 16,
                background: pal.bar,
                border: `1px solid ${pal.border}`,
                boxSizing: "border-box",
                padding: "8px 12px",
                gap: 8,
              }}
            >
              <span className="min-w-0 flex-1 truncate" style={{ color: pal.muted, fontSize: 14, lineHeight: "18px", fontWeight: 500 }}>
                {s.replyingTo}
                <span dir="auto" style={{ color: pal.strong, fontWeight: 600 }}>
                  {draftReplyName}
                </span>
              </span>
              <span className="shrink-0" style={{ color: pal.brand, fontSize: 14, lineHeight: "18px", fontWeight: 700 }}>
                @ {s.mentionOn}
              </span>
              <CircleXGlyph color={pal.icon} cut={pal.bar} />
            </div>
          )}
          <div
            className="flex items-end"
            style={{
              minHeight: BAR_H,
              borderRadius: 16,
              background: pal.bar,
              border: `1px solid ${pal.border}`,
              boxSizing: "border-box",
              padding: "9px 11px",
            }}
          >
            <span className="flex shrink-0 items-center justify-center" style={{ width: 32, height: 36 }}>
              <PlusGlyph color={pal.icon} />
            </span>
            <div className="min-w-0 flex-1" style={{ padding: "8px 0", marginLeft: 9, marginRight: 8 }}>
              {hasDraft ? (
                <div
                  className="flex flex-col justify-end overflow-hidden"
                  style={{ maxHeight: DRAFT_MAX_LINES * 20 }}
                >
                  <div
                    dir={dirOf(draftText)}
                    style={{
                      color: pal.text,
                      fontSize: 16,
                      lineHeight: "20px",
                      fontWeight: 400,
                      whiteSpace: "pre-wrap",
                      overflowWrap: "anywhere",
                      textAlign: "start",
                    }}
                  >
                    {draftText}
                    <Caret pal={pal} clockMs={clockMs} />
                  </div>
                </div>
              ) : (
                <div className="flex min-w-0 items-center" style={{ height: 20 }}>
                  {draft && <Caret pal={pal} clockMs={clockMs} />}
                  <span
                    dir="auto"
                    className="min-w-0 truncate"
                    style={{ color: pal.muted, fontSize: 16, lineHeight: "20px", fontWeight: 400 }}
                  >
                    {group ? s.messageGroup(title) : s.messageAt(themName)}
                  </span>
                </div>
              )}
            </div>
            <span className="flex shrink-0 items-center" style={{ gap: 8, height: 36 }}>
              {!hasDraft && (
                <span className="flex items-center justify-center" style={{ width: 32, height: 32 }}>
                  <GiftGlyph color={pal.icon} />
                </span>
              )}
              <span className="flex items-center justify-center" style={{ width: 32, height: 32 }}>
                <EmojiGlyph color={pal.icon} />
              </span>
              {hasDraft ? (
                <span
                  className="flex items-center justify-center rounded-full"
                  style={{ width: 36, height: 36, marginRight: -2, background: pal.brand }}
                >
                  <SendGlyph />
                </span>
              ) : (
                <span className="flex items-center justify-center" style={{ width: 32, height: 32 }}>
                  <MicGlyph color={pal.icon} />
                </span>
              )}
            </span>
          </div>
        </div>
      </div>
      <SystemBottomBar device={scenario.device} bg={pal.bg} fg={pal.homeIndicator} />
    </div>
  );
}
