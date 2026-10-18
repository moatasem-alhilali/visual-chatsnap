"use client";

/**
 * Discord for Android (Samsung One UI device): the 1:1 direct-message screen.
 * Self-contained Android implementation (no imports from Discord.tsx).
 *
 * Discord's mobile app is React Native with a native message list, and it ships
 * its own design system and its own typeface (gg sans) on both platforms, so the
 * chat itself is not Material. What is Android-specific: the One UI status bar
 * and 3-button navigation bar under the chat bar, the 360 dp metrics, and the
 * font fallback (gg sans is bundled in the APK, but the mockup cannot load it, so
 * the stack falls back to the device font; Arabic glyphs always come from the
 * system font on a real phone too).
 *
 * Key values and sources:
 *  - Palette: Discord's own client CSS (discord.com/app → /assets/*.css, theme
 *    tokens resolved to hex). Mobile's four base themes are Light, Ash, Dark and
 *    Onyx (support.discord.com "Mobile Visual Refresh: What's Changing";
 *    discord.com/blog/improving-mobile-with-squircles-styles-and-spacing).
 *    "Dark" (`.theme-darker`) is the default dark theme modelled here.
 *      Dark : chat bg (--background-base-lower) #1a1a1e, text-default #efeff1,
 *             text-strong #fbfbfb, text-muted #96979e, chat-text-muted #81828a,
 *             icon-subtle #abacb2, mod-subtle rgba(151,151,159,.122) → #29292e on bg,
 *             border-subtle same alpha.
 *      Light: chat bg #fbfbfb, text-default #2e2e34, text-strong #28282d,
 *             text-muted #6c6d76, chat-text-muted #70717a, icon-subtle #595a63,
 *             mod-subtle → #efeff0, border-subtle (.278) → #dfdfe1.
 *      Brand blurple #5865f2; status-online #23a55a (dark) / #24934e (light).
 *  - Message layout: avatar 40, content inset 72 on desktop (16 + 40 + 16); mobile
 *    uses a 12 dp gutter → 68 dp. Mobile visual refresh (`.mobile-visual-refresh`
 *    block in the client CSS + Discord's Aug 2026 blog above): name 16 medium
 *    (text-strong), body 14 on an 18 line, timestamp 12 medium, placeholder 16.
 *    Timestamp / muted colour #96979e dark (sampled from mobile screenshots) /
 *    #6c6d76 light. DMs have no role colours, so every name is text-strong.
 *  - Timestamps read "Today at 10:41 AM": a typed 24-hour time is shown in en-US
 *    12-hour form (the mobile "Today at x" wording: support.discord.com community
 *    post 360056280711).
 *  - Chat bar (mobile visual refresh): ONE floating bordered rounded rectangle,
 *    16 dp from both edges, 56 tall, radius 16, 1 px border #97979f @12.2% (dark) /
 *    @27.8% (light), fill #242429 / #ffffff, holding + · "Message @Name" · Gift ·
 *    Emoji · Mic as 32 dp buttons with 20 dp icons and 8 dp gaps.
 *  - Date divider: centred date (e.g. "October 18, 2026"), 12 px semibold
 *    text-muted with 1 px border-subtle rules either side.
 *  - Jumbo emoji: emoji-only messages render at --custom-emoji-size-jumbo-emoji (48 px).
 *  - Voice message (class `container_a8e786`): mod-subtle fill, radius 24,
 *    padding 12, gap 12, a 32 px play button with the brand gradient
 *    (dark 151deg #6374f4→#4654c0, light #7487f8→#5865f2), waveform, duration.
 *  - Attachments sit BELOW the message content (caption first, then the image),
 *    8 px radius.
 *  - People (users, DMs) are circles; default avatars are the white Discord logo
 *    on one of the six default colours (#5865f2 #757e8a #3ba55c #faa61a #ed4245 #eb459f).
 *  - No read receipts and no "last seen" exist in Discord: presence is the status
 *    dot (online = green, otherwise the grey offline ring); typing is shown only in
 *    the "<Name> is typing…" strip above the chat bar.
 *
 * Arabic / RTL: Discord ships no Arabic localisation and no RTL layout
 * (support.discord.com community posts 360050257474 "Adding Arabic language
 * support", 360030086752 "Add Right to Left (RTL) support"). On an Arabic phone
 * the app therefore runs in English and stays left-to-right; only the One UI
 * status bar and nav bar (system chrome) mirror. Arabic message paragraphs are
 * laid out right-to-left and right-aligned inside the content column (Android
 * text views resolve alignment from the first strong character).
 *
 * Entrance: the message list is a native RecyclerView; its default item animator
 * shifts existing rows (move, 250 ms) and fades the new row in (add, 120 ms).
 * Modelled as a 250 ms rise of 12 px on FastOutSlowIn with a 120 ms fade, the
 * same in CSS (`dcand-enter`) and in `discordAndroidMotion`.
 */

import type { CSSProperties, ReactNode } from "react";

import type { Message, Person } from "../../types";
import { dirOf, SystemBottomBar, useChatScroll } from "../shared";
import { SamsungStatusBar } from "../devices/SamsungStatusBar";
import type { Lang } from "./chrome";
import { groupInfo, type PlatformMotion, type PlatformProps } from "./types";

/* --------------------------------- tokens --------------------------------- */

interface Pal {
  bg: string;
  text: string;
  strong: string;
  muted: string;
  chatMuted: string;
  icon: string;
  mod: string;
  border: string;
  online: string;
  offline: string;
  playFrom: string;
  playTo: string;
  wave: string;
  nav: string;
  barFill: string;
  barBorder: string;
}

function palette(dark: boolean): Pal {
  return dark
    ? {
        bg: "#1a1a1e",
        text: "#efeff1",
        strong: "#fbfbfb",
        muted: "#96979e",
        chatMuted: "#96979e",
        icon: "#abacb2",
        mod: "#29292e",
        border: "#29292e",
        online: "#23a55a",
        offline: "#81828a",
        playFrom: "#6374f4",
        playTo: "#4654c0",
        wave: "#6c6d74",
        nav: "#ffffff",
        barFill: "#242429",
        barBorder: "rgba(151, 151, 159, 0.122)",
      }
    : {
        bg: "#fbfbfb",
        text: "#2e2e34",
        strong: "#28282d",
        muted: "#6c6d76",
        chatMuted: "#6c6d76",
        icon: "#595a63",
        mod: "#efeff0",
        border: "#dfdfe1",
        online: "#24934e",
        offline: "#70717a",
        playFrom: "#7487f8",
        playTo: "#5865f2",
        wave: "#a5a6ad",
        nav: "#000000",
        barFill: "#ffffff",
        barBorder: "rgba(151, 151, 159, 0.278)",
      };
}

/** Same stacks the device-font setting maps to (data/fonts), copied to stay self-contained. */
const DEVICE_FONTS: Record<string, string> = {
  roboto: "var(--font-roboto), var(--font-tajawal), system-ui, sans-serif",
  cairo: "var(--font-cairo), system-ui, sans-serif",
  tajawal: "var(--font-tajawal), system-ui, sans-serif",
};

/** Discord bundles gg sans; fall back to the device font (which also supplies Arabic glyphs). */
function discordFont(androidFont: string): string {
  return `"gg sans", "ggsans", ${DEVICE_FONTS[androidFont] ?? DEVICE_FONTS.roboto}`;
}

/**
 * Discord has no Arabic UI: an Arabic-locale phone shows the English client, so
 * both entries are the en-US strings on purpose.
 */
const EN = {
  messageAt: (name: string) => `Message @${name}`,
  todayAt: (time: string) => `Today at ${time}`,
  isTyping: "is typing...",
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

/** Typed "14:05" → "2:05 PM" (en-US 12-hour, as Discord shows it); keeps an existing AM/PM. */
function to12h(time: string): string {
  if (/[ap]\.?m\.?/i.test(time)) return time;
  const m = /^(\d{1,2}):(\d{2})$/.exec(time);
  if (!m) return time;
  const h = Number(m[1]);
  if (h > 23) return time;
  return `${h % 12 === 0 ? 12 : h % 12}:${m[2]} ${h < 12 ? "AM" : "PM"}`;
}

function longDate(d: Date): string {
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

/* --------------------------------- metrics -------------------------------- */

const EDGE = 16; // avatar inset from the screen edge
const AVATAR = 40;
const GUTTER = 12; // avatar -> content
const CONTENT_INSET = EDGE + AVATAR + GUTTER; // 68
const TEXT_SIZE = 14;
const TEXT_LINE = 18;
const GROUP_GAP = 16;

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

const ENTER_MS = 250;
const FADE_MS = 120;
const ENTER_RISE = 12;
const fastOutSlowIn = cubicBezier(0.4, 0, 0.2, 1);
const easeInOut = cubicBezier(0.42, 0, 0.58, 1);
const FADE_END = FADE_MS / ENTER_MS; // 0.48

export const discordAndroidMotion: PlatformMotion = {
  enterMs: ENTER_MS,
  enterStyle: (p) => {
    const t = Math.min(1, Math.max(0, p));
    const y = (1 - fastOutSlowIn(t)) * ENTER_RISE;
    const o = easeInOut(Math.min(1, t / FADE_END));
    return { opacity: o, transform: `translateY(${y.toFixed(2)}px)` };
  },
};

const DOT_CYCLE = 1200;
const DOT_STAGGER = 200;

/** Typing-dot opacity at a given clock (mirrors the linear `dcand-dot` keyframes). */
function dotAt(ms: number, i: number): number {
  const ph = ((((ms - i * DOT_STAGGER) % DOT_CYCLE) + DOT_CYCLE) % DOT_CYCLE) / DOT_CYCLE;
  if (ph < 0.3) return 0.3 + 0.7 * (ph / 0.3);
  if (ph < 0.6) return 1 - 0.7 * ((ph - 0.3) / 0.3);
  return 0.3;
}

/* Two keyframe stops so CSS reproduces "rise on FastOutSlowIn + 120 ms fade". */
const KEYFRAMES = `
@keyframes dcand-rise{from{transform:translateY(${ENTER_RISE}px)}to{transform:translateY(0)}}
@keyframes dcand-fadein{from{opacity:0}to{opacity:1}}
@keyframes dcand-dot{0%{opacity:.3}30%{opacity:1}60%{opacity:.3}100%{opacity:.3}}
.dcand-enter{animation:dcand-rise ${ENTER_MS}ms cubic-bezier(.4,0,.2,1) both,dcand-fadein ${FADE_MS}ms cubic-bezier(.42,0,.58,1) both}
.dcand-fade{animation:dcand-fadein 150ms linear both}
.dcand-dot{animation:dcand-dot ${DOT_CYCLE}ms linear infinite}
`;

/* --------------------------------- glyphs --------------------------------- */

function Glyph({ children, size = 24 }: { children: ReactNode; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="shrink-0" style={{ display: "block" }}>
      {children}
    </svg>
  );
}

/** Discord's ArrowLargeLeft back icon (the app is LTR in every locale, so it never flips). */
function BackArrow({ color }: { color: string }) {
  return (
    <Glyph>
      <path
        fill={color}
        d="M3.3 11.3a1 1 0 0 0 0 1.4l7 7a1 1 0 0 0 1.4-1.4L6.42 13H20a1 1 0 1 0 0-2H6.42l5.3-5.3a1 1 0 0 0-1.42-1.4l-7 7Z"
      />
    </Glyph>
  );
}

function PhoneGlyph({ color }: { color: string }) {
  return (
    <Glyph>
      <path
        fill={color}
        d="M2 7.4A5.4 5.4 0 0 1 7.4 2c.36 0 .7.22.83.55l1.93 4.64a1 1 0 0 1-.43 1.25L7.1 9.8a12.8 12.8 0 0 0 7.1 7.1l1.36-2.63a1 1 0 0 1 1.25-.43l4.64 1.93c.33.14.55.47.55.83A5.4 5.4 0 0 1 16.6 22 14.6 14.6 0 0 1 2 7.4Z"
      />
    </Glyph>
  );
}

function VideoGlyph({ color }: { color: string }) {
  return (
    <Glyph>
      <path fill={color} d="M4 4.5a3 3 0 0 0-3 3v9a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-9a3 3 0 0 0-3-3H4Z" />
      <path fill={color} d="M18.5 9.4 21.6 7.3c.6-.4 1.4 0 1.4.8v7.8c0 .8-.8 1.2-1.4.8l-3.1-2.1V9.4Z" />
    </Glyph>
  );
}

function SearchGlyph({ color }: { color: string }) {
  return (
    <Glyph>
      <circle cx="10.5" cy="10.5" r="7" stroke={color} strokeWidth="2.2" />
      <path d="m15.7 15.7 5.3 5.3" stroke={color} strokeWidth="2.4" strokeLinecap="round" />
    </Glyph>
  );
}

function ChevronRight({ color }: { color: string }) {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="shrink-0" style={{ display: "block" }}>
      <path d="m4.5 2.5 3.5 3.5-3.5 3.5" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** 32 dp chat-bar button slot holding a 20 dp icon. */
function BarButton({ children }: { children: ReactNode }) {
  return (
    <span className="flex shrink-0 items-center justify-center" style={{ width: 32, height: 32 }}>
      {children}
    </span>
  );
}

function PlusGlyph({ color }: { color: string }) {
  return (
    <Glyph size={20}>
      <path d="M12 4.5v15M4.5 12h15" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
    </Glyph>
  );
}

function EmojiGlyph({ color }: { color: string }) {
  return (
    <Glyph size={20}>
      <circle cx="12" cy="12" r="9.5" stroke={color} strokeWidth="2" />
      <circle cx="8.8" cy="9.8" r="1.4" fill={color} />
      <circle cx="15.2" cy="9.8" r="1.4" fill={color} />
      <path d="M7.6 13.8c.9 1.9 2.5 2.9 4.4 2.9s3.5-1 4.4-2.9" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Glyph>
  );
}

function GiftGlyph({ color }: { color: string }) {
  return (
    <Glyph size={20}>
      {/* bow */}
      <path
        d="M11.2 7.2C10 5.3 8.4 4.1 7.2 4.4c-1 .3-1.3 1.5-.6 2.3.7.7 2.4.8 4.6.5Zm1.6 0c1.2-1.9 2.8-3.1 4-2.8 1 .3 1.3 1.5.6 2.3-.7.7-2.4.8-4.6.5Z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      {/* lid halves */}
      <path fill={color} d="M3.5 8.2h7.6v3.6H3.5a1 1 0 0 1-1-1V9.2a1 1 0 0 1 1-1ZM12.9 8.2h7.6a1 1 0 0 1 1 1v1.6a1 1 0 0 1-1 1h-7.6V8.2Z" />
      {/* box halves */}
      <path fill={color} d="M4 13.2h7.1v7.6H6a2 2 0 0 1-2-2v-5.6ZM12.9 13.2H20v5.6a2 2 0 0 1-2 2h-5.1v-7.6Z" />
    </Glyph>
  );
}

function MicGlyph({ color }: { color: string }) {
  return (
    <Glyph size={20}>
      <rect x="8.4" y="2.2" width="7.2" height="12.4" rx="3.6" fill={color} />
      <path d="M5.4 11.2a6.6 6.6 0 0 0 13.2 0M12 17.9v3.6" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Glyph>
  );
}

/* --------------------------------- avatars -------------------------------- */

const DEFAULT_AVATAR_COLORS = ["#5865f2", "#757e8a", "#3ba55c", "#faa61a", "#ed4245", "#eb459f"];

function defaultAvatarColor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0;
  return DEFAULT_AVATAR_COLORS[Math.abs(h) % DEFAULT_AVATAR_COLORS.length];
}

const DISCORD_LOGO =
  "M20.317 4.37a19.79 19.79 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.865-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.74 19.74 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.1 13.1 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.291a.074.074 0 0 1 .078-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.099.246.198.373.292a.077.077 0 0 1-.007.127 12.3 12.3 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.363 1.225 1.993a.076.076 0 0 0 .084.029 19.84 19.84 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03ZM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418Zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418Z";

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

/** Avatar with the presence dot cut into its bottom-end corner. */
function PresenceAvatar({ person, size, online, pal }: { person: Person; size: number; online: boolean; pal: Pal }) {
  const dot = Math.round(size * 0.3);
  const ring = Math.max(2, Math.round(size * 0.09));
  return (
    <span className="relative shrink-0" style={{ width: size, height: size }}>
      <DiscordAvatar person={person} size={size} />
      <span
        className="absolute flex items-center justify-center rounded-full"
        style={{
          width: dot + ring * 2,
          height: dot + ring * 2,
          right: -ring,
          bottom: -ring,
          background: pal.bg,
        }}
      >
        {online ? (
          <span className="block rounded-full" style={{ width: dot, height: dot, background: pal.online }} />
        ) : (
          <span
            className="block rounded-full"
            style={{ width: dot, height: dot, boxSizing: "border-box", border: `${Math.max(2, dot * 0.25)}px solid ${pal.offline}` }}
          />
        )}
      </span>
    </span>
  );
}

/* ------------------------------ message parts ------------------------------ */

const EMOJI_ONLY =
  /^(?:(?:\p{Extended_Pictographic}|\p{Regional_Indicator})(?:️|\p{Emoji_Modifier}|‍(?:\p{Extended_Pictographic})️?)*\s*){1,27}$/u;

function isEmojiOnly(text: string): boolean {
  const t = text.trim();
  return t.length > 0 && EMOJI_ONLY.test(t);
}

const WAVE = [6, 10, 16, 9, 20, 13, 22, 15, 8, 17, 21, 12, 7, 14, 19, 10, 16, 8, 12, 6, 10, 14, 9, 6, 11, 7, 13, 18, 10, 6, 9, 15, 11, 7, 5, 8];

function VoiceMessage({ pal, duration }: { pal: Pal; duration?: string }) {
  return (
    <div
      className="flex items-center"
      style={{ background: pal.mod, borderRadius: 24, padding: 12, gap: 12, width: 256, maxWidth: "100%", boxSizing: "border-box" }}
    >
      {/* play button (the triangle never mirrors) */}
      <span
        className="flex shrink-0 items-center justify-center rounded-full"
        style={{
          width: 32,
          height: 32,
          margin: "-4px 0 -4px -4px",
          background: `linear-gradient(151.11deg, ${pal.playFrom} 16.55%, ${pal.playTo} 104.36%)`,
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" style={{ display: "block", transform: "translateX(1px)" }}>
          <path fill="#ffffff" d="M6.5 4.3v15.4c0 .9 1 1.4 1.7.9l11.4-7.7a1.1 1.1 0 0 0 0-1.8L8.2 3.4c-.7-.5-1.7 0-1.7.9Z" />
        </svg>
      </span>
      <span className="flex min-w-0 flex-1 items-center justify-between overflow-hidden" style={{ height: 24, gap: 1.5 }}>
        {WAVE.map((h, i) => (
          <span key={i} className="shrink-0" style={{ width: 3, height: h, borderRadius: 1.5, background: pal.wave }} />
        ))}
      </span>
      <span className="shrink-0 tabular-nums" style={{ color: pal.muted, fontSize: 14, lineHeight: "18px", fontWeight: 500 }}>
        {duration || "0:08"}
      </span>
    </div>
  );
}

function Attachment({ src, pal }: { src?: string | null; pal: Pal }) {
  if (!src) {
    return (
      <div className="flex items-center justify-center" style={{ width: 225, height: 300, borderRadius: 8, background: pal.mod }}>
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="4" width="18" height="16" rx="3" stroke={pal.muted} strokeWidth="1.8" />
          <circle cx="9" cy="9.5" r="1.7" fill={pal.muted} />
          <path d="m4.5 18 5-5.2 3.4 3.4 2.4-2.4 4.2 4.2" stroke={pal.muted} strokeWidth="1.8" strokeLinejoin="round" />
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
      style={{ width: 225, height: 300, maxWidth: "100%", borderRadius: 8 }}
    />
  );
}

function usernameOf(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9_.]+/g, "")
    .slice(0, 32);
}

/* --------------------------------- screen --------------------------------- */

export function DiscordAndroid({ scenario, playback, lang }: PlatformProps) {
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
    textAlign: "start",
  };

  return (
    <div className="flex h-full w-full flex-col" style={{ background: pal.bg, fontFamily: discordFont(scenario.androidFont) }}>
      <style>{KEYFRAMES}</style>
      <SamsungStatusBar tint={dark ? "light" : "dark"} background={pal.bg} lang={lang} />

      {/* Discord itself never mirrors (no RTL support), so the app area is pinned LTR. */}
      <div dir="ltr" className="flex min-h-0 flex-1 flex-col">
        {/* Header */}
        <div
          className="flex shrink-0 items-center"
          style={{ height: 56, paddingLeft: 4, paddingRight: 8, borderBottom: `1px solid ${pal.border}` }}
        >
          <span className="flex shrink-0 items-center justify-center" style={{ width: 48, height: 48 }}>
            <BackArrow color={pal.icon} />
          </span>
          <PresenceAvatar person={them} size={32} online={online} pal={pal} />
          <div className="flex min-w-0 flex-1 items-center" style={{ marginLeft: 10, gap: 2 }}>
            <span
              dir="auto"
              className="truncate"
              style={{ color: pal.strong, fontSize: 16, lineHeight: "20px", fontWeight: 700 }}
            >
              {themName}
            </span>
            <ChevronRight color={pal.muted} />
          </div>
          <div className="flex shrink-0 items-center">
            {[PhoneGlyph, VideoGlyph, SearchGlyph].map((G, i) => (
              <span key={i} className="flex items-center justify-center" style={{ width: 44, height: 44 }}>
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
            style={{ background: pal.bg, paddingBottom: showTyping ? 30 : 12 }}
          >
            {/* DM intro */}
            <div style={{ padding: `24px ${EDGE}px 0` }}>
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

            {/* Date divider */}
            <div className="flex items-center" style={{ margin: `24px ${EDGE}px 0`, gap: 8 }}>
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
              const time = m.time.trim();

              const body =
                m.type === "voice" ? (
                  <div style={{ paddingTop: 4, paddingBottom: 2 }}>
                    <VoiceMessage pal={pal} duration={m.voiceDuration} />
                  </div>
                ) : m.type === "image" ? (
                  <div className="flex flex-col items-start" style={{ gap: 4 }}>
                    {caption && (
                      <div dir={dirOf(caption)} className="w-full whitespace-pre-wrap break-words" style={textStyle}>
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
                  <div dir={dirOf(m.text)} className="whitespace-pre-wrap break-words" style={textStyle}>
                    {m.text}
                  </div>
                );

              return (
                <div
                  key={m.id}
                  data-mid={m.id}
                  data-sender={m.sender}
                  className={live ? "dcand-enter" : undefined}
                  style={{
                    paddingTop: firstOfGroup ? (i === 0 ? 12 : GROUP_GAP) : 2,
                    paddingBottom: 2,
                    paddingRight: EDGE,
                    paddingLeft: firstOfGroup ? EDGE : CONTENT_INSET,
                  }}
                >
                  {firstOfGroup ? (
                    <div className="flex items-start">
                      <span style={{ marginTop: 1 }}>
                        <DiscordAvatar person={person} size={AVATAR} />
                      </span>
                      <div className="min-w-0 flex-1" style={{ marginLeft: GUTTER }}>
                        <div className="flex min-w-0 items-baseline" style={{ height: 22 }}>
                          <span
                            dir="auto"
                            className="truncate"
                            style={{ color: pal.strong, fontSize: 16, lineHeight: "22px", fontWeight: 500 }}
                          >
                            {name}
                          </span>
                          {time && (
                            <span
                              className="shrink-0 whitespace-nowrap"
                              style={{ color: pal.chatMuted, fontSize: 12, lineHeight: "22px", fontWeight: 500, marginLeft: 6 }}
                            >
                              {s.todayAt(to12h(time))}
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
              );
            })}
          </div>

          {/* "<Name> is typing…" strip, floating just above the chat bar */}
          {showTyping && (
            <div
              className={`absolute inset-x-0 bottom-0 flex items-center ${live ? "dcand-fade" : ""}`}
              style={{ height: 24, paddingLeft: EDGE, gap: 6, background: pal.bg }}
            >
              <span className="flex items-center" style={{ gap: 3 }}>
                {[0, 1, 2].map((d) => (
                  <span
                    key={d}
                    className={exporting ? "inline-block rounded-full" : "dcand-dot inline-block rounded-full"}
                    style={{
                      width: 5,
                      height: 5,
                      background: pal.text,
                      ...(exporting ? { opacity: dotAt(clockMs, d) } : { animationDelay: `${d * DOT_STAGGER - DOT_CYCLE}ms` }),
                    }}
                  />
                ))}
              </span>
              <span className="min-w-0 truncate" style={{ color: pal.text, fontSize: 13, lineHeight: "16px", fontWeight: 500 }}>
                <span dir="auto" style={{ fontWeight: 700 }}>
                  {themName}
                </span>{" "}
                {s.isTyping}
              </span>
            </div>
          )}
        </div>

        {/* Chat bar */}
        {/* One floating bordered rounded rectangle (mobile visual refresh). */}
        <div className="shrink-0" style={{ background: pal.bg, padding: `6px ${EDGE}px 8px` }}>
          <div
            className="flex items-center"
            style={{
              height: 56,
              boxSizing: "border-box",
              borderRadius: 16,
              border: `1px solid ${pal.barBorder}`,
              background: pal.barFill,
              paddingLeft: 11,
              paddingRight: 11,
              gap: 8,
            }}
          >
            <BarButton>
              <PlusGlyph color={pal.icon} />
            </BarButton>
            <span
              className="min-w-0 flex-1 truncate"
              style={{ color: pal.muted, fontSize: 16, lineHeight: "20px", fontWeight: 400, paddingLeft: 2 }}
            >
              {s.messageAt(themName)}
            </span>
            <BarButton>
              <GiftGlyph color={pal.icon} />
            </BarButton>
            <BarButton>
              <EmojiGlyph color={pal.icon} />
            </BarButton>
            <BarButton>
              <MicGlyph color={pal.icon} />
            </BarButton>
          </div>
        </div>
      </div>
      <SystemBottomBar device="android" bg={pal.bg} fg={pal.nav} />
    </div>
  );
}
