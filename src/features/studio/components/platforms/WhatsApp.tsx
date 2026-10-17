"use client";

/**
 * WhatsApp for iOS: chat screen, matching the post-2024 "fresh new look" app
 * (iOS 17/18-era chrome; neutral bars, green used sparingly, outlined icons).
 *
 * Values used, and where they come from:
 *  - Bubbles: outgoing #D9FDD3, incoming #FFFFFF (light). In dark mode the 2024
 *    refresh uses a deeper green #144D37 for outgoing and a neutral dark grey
 *    for incoming. Body text uses iOS Body (17/22). Meta is 11pt.
 *    Web palette cross-check (#D9FDD3 / #005C4B / #202C33 / #0B141A / #667781 /
 *    #8696A0, 7px radius): https://www.oppadu.com/tools/design-systems-site/brand/whatsapp.html
 *  - Neutral chrome, rounded outlined icons, darker dark mode, refreshed doodle:
 *    https://www.meta.com/design-at-meta/blog/whatsapp-user-interface-update/
 *  - Dark surfaces deepened (#0b141a to #0a1014), darker incoming bubbles:
 *    https://wabetainfo.com/whatsapp-beta-for-android-2-24-22-4-whats-new/
 *  - Read ticks #53BDEB; tick and lock glyph paths are WhatsApp Web's own
 *    "msg-check" / "msg-dblcheck" icons.
 *  - iOS specifics: the bubble tail sits at the BOTTOM corner of the last bubble
 *    in a group. The composer is "+" | rounded field (sticker icon inside, no
 *    placeholder) | camera | mic. The chat wallpaper stays fixed and does not
 *    scroll.
 *
 * Shared WhatsApp helpers (doodle wallpaper, ticks, waveform, E2E notice
 * strings) are exported from here and reused by WhatsAppAndroid.tsx.
 */

import type { CSSProperties, ReactNode } from "react";

import type { DeliveryStatus, Message, Person } from "../../types";
import { Avatar, dirOf, SystemBottomBar, useChatScroll } from "../shared";
import { StatusBar } from "../devices/StatusBar";
import { CHROME, type Lang } from "./chrome";
import { groupInfo, type PlatformProps } from "./types";

/* ======================================================================
   Shared WhatsApp helpers (also used by WhatsAppAndroid.tsx)
   ====================================================================== */

/** Line-art glyphs for the doodle wallpaper, each drawn in a 24×24 box. */
const DOODLE_GLYPHS: string[] = [
  // heart
  "M12 20s-7-4.4-7-9.6A4 4 0 0 1 12 8a4 4 0 0 1 7 2.4C19 15.6 12 20 12 20z",
  // star
  "M12 3.5l2.5 5.3 5.8.7-4.3 4 1.1 5.8L12 16.4l-5.1 2.9 1.1-5.8-4.3-4 5.8-.7z",
  // cloud
  "M7 18h10a4 4 0 0 0 .4-8 6 6 0 0 0-11.2 1.7A3.2 3.2 0 0 0 7 18z",
  // phone handset
  "M7 3.5l2 3.6-1.6 1.8a10 10 0 0 0 7.7 7.7l1.8-1.6 3.6 2-.9 3.1c-.2.6-.8 1-1.4.9C10.1 20.3 3.7 13.9 3.1 5.8c0-.6.3-1.2.9-1.4z",
  // camera
  "M4 8.5h3.2L9 6h6l1.8 2.5H20V19H4zM12 10.5a3.4 3.4 0 1 0 0 6.8 3.4 3.4 0 0 0 0-6.8z",
  // music note
  "M9 17.5V6.5l10-2.2v11M9 17.5a2.4 2.4 0 1 1-4.8 0 2.4 2.4 0 0 1 4.8 0zM19 15.3a2.4 2.4 0 1 1-4.8 0 2.4 2.4 0 0 1 4.8 0z",
  // smiley
  "M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16zM9.3 10h.01M14.7 10h.01M8.6 13.8c1.9 2.1 4.9 2.1 6.8 0",
  // coffee cup
  "M5 10h11v4.5A4.5 4.5 0 0 1 11.5 19h-2A4.5 4.5 0 0 1 5 14.5zM16 11h1.4a2.3 2.3 0 0 1 0 4.6H16M8.5 3.5c-.9 1.3.9 2.2 0 3.6M12 3.5c-.9 1.3.9 2.2 0 3.6",
  // umbrella
  "M3.5 12a8.5 8.5 0 0 1 17 0zM12 12v6.2a1.8 1.8 0 0 1-3.6 0",
  // light bulb
  "M9.5 18h5M10.3 20.6h3.4M12 3.5a5.8 5.8 0 0 0-3.4 10.5v1.9h6.8V14A5.8 5.8 0 0 0 12 3.5z",
  // chat bubble
  "M4.5 5.5h15v10h-9.2l-4.3 3.6V15.5H4.5z",
  // gift
  "M4.5 10.5h15V20h-15zM3.5 7.5h17v3h-17zM12 7.5V20M12 7.5c-1.6-3.6-5.6-2.8-3.8 0M12 7.5c1.6-3.6 5.6-2.8 3.8 0",
  // moon
  "M19.5 14.6A7.6 7.6 0 0 1 9.4 4.5a7.6 7.6 0 1 0 10.1 10.1z",
  // paper plane
  "M3.5 11.2 20.5 4l-6.6 16.6-2.8-6.6zM11.1 14 20.5 4",
  // clock
  "M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16zM12 7.6V12l2.9 1.9",
  // leaf
  "M5 19C5 10.5 10 5.5 19 5c-.4 8.6-5.4 14-14 14zM5 19l8.5-8.5",
  // sun
  "M12 8.6a3.4 3.4 0 1 0 0 6.8 3.4 3.4 0 0 0 0-6.8zM12 3v2.2M12 18.8V21M3 12h2.2M18.8 12H21M5.6 5.6l1.6 1.6M16.8 16.8l1.6 1.6M5.6 18.4l1.6-1.6M16.8 7.2l1.6-1.6",
  // envelope
  "M3.5 6.5h17v11h-17zM3.5 6.5l8.5 6.6 8.5-6.6",
  // balloon
  "M12 3.5a5 5 0 0 1 5 5c0 3.6-2.8 6-5 6s-5-2.4-5-6a5 5 0 0 1 5-5zM12 14.5l-.9 1.6h1.8zM12 16.1c0 1.8-1.8 2.7-.9 4.4",
  // pizza slice
  "M12 20.5 4.5 6.4a15 15 0 0 1 15 0zM9.6 10.3h.01M14 12.4h.01M11.6 15.4h.01",
];

/**
 * Build the WhatsApp "doodle" wallpaper as an inline SVG data URI: a 240px tile
 * of small line-art glyphs in a staggered grid with varied rotations, like the
 * real default background. Everything is inline, so the exporter can snapshot it.
 */
export function waDoodle(stroke: string, opacity: number): string {
  const cell = 48;
  const parts: string[] = [];
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      const k = r * 5 + c;
      const x = c * cell + (r % 2 ? 22 : 3);
      const y = r * cell + ((c * 7) % 5);
      const rot = ((k * 37) % 50) - 25;
      const glyph = DOODLE_GLYPHS[(k * 7 + r) % DOODLE_GLYPHS.length];
      parts.push(
        `<g transform='translate(${x} ${y}) rotate(${rot} 12 12) scale(0.9)'><path d='${glyph}'/></g>`,
      );
    }
  }
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240' viewBox='0 0 240 240'>` +
    `<g fill='none' stroke='${stroke}' stroke-opacity='${opacity}' stroke-width='1.35' stroke-linecap='round' stroke-linejoin='round'>` +
    parts.join("") +
    `</g></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

/** WhatsApp's own single / double check glyphs (WhatsApp Web "msg-check" / "msg-dblcheck"). */
const CHECK_SINGLE =
  "M10.91 3.316l-.478-.372a.365.365 0 0 0-.51.063L4.566 9.879a.32.32 0 0 1-.484.033L1.891 7.769a.366.366 0 0 0-.515.006l-.423.433a.364.364 0 0 0 .006.514l3.258 3.185c.143.14.361.125.484-.033l6.272-8.048a.365.365 0 0 0-.063-.51z";
const CHECK_DOUBLE =
  "M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.879a.32.32 0 0 1-.484.033l-.358-.325a.319.319 0 0 0-.484.032l-.378.483a.418.418 0 0 0 .036.541l1.32 1.266c.143.14.361.125.484-.033l6.272-8.048a.366.366 0 0 0-.064-.512zm-4.1 0l-.478-.372a.365.365 0 0 0-.51.063L4.566 9.879a.32.32 0 0 1-.484.033L1.891 7.769a.366.366 0 0 0-.515.006l-.423.433a.364.364 0 0 0 .006.514l3.258 3.185c.143.14.361.125.484-.033l6.272-8.048a.365.365 0 0 0-.063-.51z";

export function WaTicks({
  status,
  color,
  readColor = "#53bdeb",
  width = 16,
}: {
  status: DeliveryStatus;
  color: string;
  readColor?: string;
  width?: number;
}) {
  const fill = status === "read" ? readColor : color;
  const h = (width * 10.6) / 16;
  return (
    <svg width={width} height={h} viewBox="0 2.4 16 10.6" style={{ display: "block", flexShrink: 0 }}>
      <path d={status === "sent" ? CHECK_SINGLE : CHECK_DOUBLE} fill={fill} />
    </svg>
  );
}

/** Small padlock used by the end-to-end encryption notice. */
export function WaLock({ color, size = 10 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size * 1.2} viewBox="0 0 12 14.4" style={{ display: "inline-block", flexShrink: 0 }}>
      <path
        d="M6 1.2a3.3 3.3 0 0 0-3.3 3.3v1.8h-.6A1.5 1.5 0 0 0 .6 7.8v4.8a1.5 1.5 0 0 0 1.5 1.5h7.8a1.5 1.5 0 0 0 1.5-1.5V7.8a1.5 1.5 0 0 0-1.5-1.5h-.6V4.5A3.3 3.3 0 0 0 6 1.2zm-2 3.3a2 2 0 0 1 4 0v1.8H4z"
        fill={color}
      />
    </svg>
  );
}

/** Localized chat-start encryption notice (the yellow system chip). */
export const WA_E2E: Record<Lang, { body: string; more: string }> = {
  en: {
    body: "Messages and calls are end-to-end encrypted. Only people in this chat can read, listen to, or share them.",
    more: "Learn more",
  },
  ar: {
    body: "الرسائل والمكالمات مشفرة تمامًا بين الطرفين. لا يمكن لأحد خارج هذه الدردشة قراءتها أو الاستماع إليها أو مشاركتها.",
    more: "معرفة المزيد",
  },
};

/** Deterministic voice-note waveform (bar heights in px) seeded by the message id. */
export function waWaveform(seed: string, count: number, min: number, max: number): number[] {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  const out: number[] = [];
  for (let i = 0; i < count; i++) {
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    h ^= h >>> 16;
    const r = ((h >>> 0) % 1000) / 1000;
    const envelope = 0.45 + 0.55 * Math.sin(((i + 0.5) / count) * Math.PI);
    out.push(Math.max(min, Math.round(min + (max - min) * r * envelope)));
  }
  return out;
}

/** Rough pixel width of the time + ticks block, used to reserve space at the end
 *  of the last text line (the same trick WhatsApp uses so the meta can share
 *  the last line when there is room, and drop below it when there is not). */
export function waMetaWidth(time: string, mine: boolean, charPx: number, tickPx: number): number {
  return Math.ceil(time.length * charPx + (mine ? tickPx + 3 : 0) + 6);
}

/** Pick the header subtitle for the current presence. */
export function waPresence(
  typing: boolean,
  presence: "online" | "typing" | "lastseen",
  lastSeenText: string,
  online: string,
  typingText: string,
): string {
  if (typing || presence === "typing") return typingText;
  if (presence === "online") return online;
  return lastSeenText;
}

/* ======================================================================
   iOS palette
   ====================================================================== */

interface IosPalette {
  bar: string;
  barLine: string;
  ink: string;
  sub: string;
  wall: string;
  doodle: string;
  inBubble: string;
  outBubble: string;
  text: string;
  meta: string;
  metaOut: string;
  read: string;
  shadow: string;
  field: string;
  fieldLine: string;
  chip: string;
  chipText: string;
  e2e: string;
  e2eText: string;
  dot: string;
  voiceIn: string;
  voiceOut: string;
  waveIn: string;
  waveOut: string;
  unplayed: string;
  home: string;
}

const LIGHT: IosPalette = {
  bar: "#f6f6f6",
  barLine: "rgba(0,0,0,0.14)",
  ink: "#000000",
  sub: "#8e8e93",
  wall: "#efeae2",
  doodle: waDoodle("#5c4a2e", 0.11),
  inBubble: "#ffffff",
  outBubble: "#d9fdd3",
  text: "#000000",
  meta: "rgba(0,0,0,0.45)",
  metaOut: "rgba(0,0,0,0.45)",
  read: "#53bdeb",
  shadow: "0 1px 0.5px rgba(11,20,26,0.13)",
  field: "#ffffff",
  fieldLine: "rgba(0,0,0,0.12)",
  chip: "#ffffff",
  chipText: "#54656f",
  e2e: "#ffeecd",
  e2eText: "#54656f",
  dot: "#8e8e93",
  voiceIn: "#8696a0",
  voiceOut: "#6d8a69",
  waveIn: "#c3c8cc",
  waveOut: "#a9c8a3",
  unplayed: "#1daa61",
  home: "#000000",
};

const DARK: IosPalette = {
  bar: "#161616",
  barLine: "rgba(255,255,255,0.1)",
  ink: "#ffffff",
  sub: "#8d8d93",
  wall: "#0b0f10",
  doodle: waDoodle("#ffffff", 0.07),
  inBubble: "#262628",
  outBubble: "#144d37",
  text: "#ffffff",
  meta: "rgba(235,235,245,0.55)",
  metaOut: "rgba(235,245,240,0.6)",
  read: "#53bdeb",
  shadow: "0 1px 0.5px rgba(0,0,0,0.3)",
  field: "#262628",
  fieldLine: "rgba(255,255,255,0.08)",
  chip: "#1f1f21",
  chipText: "#a1a1a6",
  e2e: "#1f1f21",
  e2eText: "#ffd279",
  dot: "#8d8d93",
  voiceIn: "#a1a1a6",
  voiceOut: "#b5d9c3",
  waveIn: "#56565c",
  waveOut: "#4f8a70",
  unplayed: "#21c063",
  home: "#ffffff",
};

/* ======================================================================
   iOS glyphs (SF Symbols look)
   ====================================================================== */

function IosChevron({ color }: { color: string }) {
  return (
    <svg width="13" height="22" viewBox="0 0 13 22" fill="none" className="shrink-0 rtl:-scale-x-100">
      <path d="M11 2 2 11l9 9" stroke={color} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IosVideo({ color }: { color: string }) {
  return (
    <svg width="27" height="20" viewBox="0 0 27 20" fill="none" className="rtl:-scale-x-100">
      <rect x="1.2" y="2.6" width="16.6" height="14.8" rx="3.8" stroke={color} strokeWidth="1.8" />
      <path
        d="M17.8 8.1l5.6-3.4c.7-.4 1.5.1 1.5.9v8.8c0 .8-.8 1.3-1.5.9l-5.6-3.4"
        stroke={color}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IosPhone({ color }: { color: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="rtl:-scale-x-100">
      <path
        d="M6.9 2.6c.5 0 .9.3 1.1.7l1.6 3.6c.2.5.1 1-.3 1.4L7.6 9.9c1.2 2.6 3.4 4.8 6 6l1.6-1.7c.4-.4.9-.5 1.4-.3l3.6 1.6c.4.2.7.6.7 1.1v2.8c0 1.1-.9 2-2 2C10.3 21.4 2.6 13.7 2.6 4.6c0-1.1.9-2 2-2z"
        stroke={color}
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IosPlus({ color }: { color: string }) {
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
      <path d="M13 4.5v17M4.5 13h17" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IosSticker({ color }: { color: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="rtl:-scale-x-100">
      <path
        d="M20.5 13.2V8A4.5 4.5 0 0 0 16 3.5H8A4.5 4.5 0 0 0 3.5 8v8A4.5 4.5 0 0 0 8 20.5h5.2z"
        stroke={color}
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path d="M13.2 20.5v-2.8a4.5 4.5 0 0 1 4.5-4.5h2.8" stroke={color} strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M8.3 13.4c.9 1.2 2.3 1.8 3.8 1.6" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="9.2" cy="9.4" r="1.05" fill={color} />
      <circle cx="14.8" cy="9.4" r="1.05" fill={color} />
    </svg>
  );
}

function IosCamera({ color }: { color: string }) {
  return (
    <svg width="26" height="22" viewBox="0 0 26 22" fill="none">
      <path
        d="M4.6 5.8h3.1l1.6-2.2c.3-.4.8-.7 1.3-.7h4.8c.5 0 1 .3 1.3.7l1.6 2.2h3.1A2.6 2.6 0 0 1 24 8.4v9a2.6 2.6 0 0 1-2.6 2.6H4.6A2.6 2.6 0 0 1 2 17.4v-9a2.6 2.6 0 0 1 2.6-2.6z"
        stroke={color}
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <circle cx="13" cy="12.6" r="3.9" stroke={color} strokeWidth="1.75" />
    </svg>
  );
}

function IosMic({ color, size = 24 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="8.4" y="2.6" width="7.2" height="12" rx="3.6" stroke={color} strokeWidth="1.75" />
      <path d="M5.2 11.2a6.8 6.8 0 0 0 13.6 0M12 18v3.4" stroke={color} strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

/** Filled mic glyph used as the voice-note badge on the avatar. */
function MicBadge({ color, ring }: { color: string; ring: string }) {
  return (
    <svg width="16" height="18" viewBox="0 0 16 18" style={{ display: "block" }}>
      <path
        d="M8 1.2a3 3 0 0 0-3 3v4.6a3 3 0 0 0 6 0V4.2a3 3 0 0 0-3-3zM3 8.3a5 5 0 0 0 10 0M8 13.4v3"
        fill="none"
        stroke={ring}
        strokeWidth="3.4"
        strokeLinecap="round"
      />
      <path d="M8 1.2a3 3 0 0 0-3 3v4.6a3 3 0 0 0 6 0V4.2a3 3 0 0 0-3-3z" fill={color} />
      <path d="M3 8.3a5 5 0 0 0 10 0M8 13.4v3" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

/** Curled iOS bubble tail, attached to the bottom corner on `side`. */
function IosTail({ side, color }: { side: "left" | "right"; color: string }) {
  const style: CSSProperties = {
    position: "absolute",
    bottom: 0,
    width: 11,
    height: 16,
    display: "block",
    pointerEvents: "none",
  };
  if (side === "right") style.right = -6;
  else {
    style.left = -6;
    style.transform = "scaleX(-1)";
  }
  return (
    <svg viewBox="0 0 11 16" style={style}>
      <path
        d="M0 0h5c0 6.1 1.5 11.2 5.3 14.5.4.35.2.95-.3 1.05C7.6 16 5.6 15.4 4 14.3 2.8 15.4 1.4 16 0 16z"
        fill={color}
      />
    </svg>
  );
}

/* ======================================================================
   Component
   ====================================================================== */

const BUBBLE_RADIUS = 12;

export function WhatsApp({ scenario, playback, lang, rtl }: PlatformProps) {
  const dark = scenario.theme === "dark";
  const p = dark ? DARK : LIGHT;
  const c = CHROME[lang];
  const e2e = WA_E2E[lang];
  const uiDir = rtl ? "rtl" : "ltr";
  const { messages, typing } = playback;
  const live = playback.isLive;
  const scrollRef = useChatScroll<HTMLDivElement>(`${messages.length}-${typing}`);

  const subtitle = waPresence(typing, scenario.presence, scenario.lastSeenText, c.online, c.typing);
  const lastSender = messages.length ? messages[messages.length - 1].sender : null;

  return (
    <div className="flex h-full w-full flex-col" style={{ background: p.bar, color: p.text }}>
      <StatusBar device={scenario.device} tint={dark ? "light" : "dark"} background={p.bar} />

      {/* Navigation bar */}
      <div
        className="relative z-10 flex shrink-0 items-center"
        style={{
          height: 50,
          paddingInlineStart: 8,
          paddingInlineEnd: 16,
          background: p.bar,
          borderBottom: `0.5px solid ${p.barLine}`,
        }}
      >
        <div className="flex items-center" style={{ paddingInlineEnd: 8 }}>
          <IosChevron color={p.ink} />
        </div>
        <Avatar person={scenario.them} size={36} />
        <div className="min-w-0 flex-1" style={{ paddingInlineStart: 10, lineHeight: 1.15 }}>
          <div className="truncate" style={{ fontSize: 16.5, fontWeight: 600, color: p.ink, letterSpacing: -0.2 }}>
            {scenario.them.name}
          </div>
          <div className="truncate" style={{ fontSize: 12.5, color: p.sub, marginTop: 1 }}>
            {subtitle}
          </div>
        </div>
        <div className="flex items-center" style={{ gap: 24, paddingInlineStart: 8 }}>
          <IosVideo color={p.ink} />
          <IosPhone color={p.ink} />
        </div>
      </div>

      {/* Chat area: fixed wallpaper behind a scrolling list */}
      <div
        className="relative min-h-0 flex-1"
        style={{ backgroundColor: p.wall, backgroundImage: p.doodle, backgroundSize: "240px 240px" }}
      >
        <div ref={scrollRef} className="rcss-scroll h-full overflow-y-auto" style={{ padding: "8px 0 10px" }}>
          {/* Date chip */}
          <div className="flex justify-center" style={{ padding: "4px 0 8px" }}>
            <span
              style={{
                background: p.chip,
                color: p.chipText,
                fontSize: 12.5,
                fontWeight: 500,
                lineHeight: "16px",
                padding: "4px 10px",
                borderRadius: 8,
                boxShadow: dark ? "none" : "0 1px 0.5px rgba(11,20,26,0.1)",
              }}
            >
              {c.today}
            </span>
          </div>

          {/* End-to-end encryption notice */}
          <div className="flex justify-center" style={{ padding: "0 40px 10px" }}>
            <div
              className="text-center"
              style={{
                background: p.e2e,
                color: p.e2eText,
                fontSize: 12.5,
                lineHeight: "17px",
                padding: "6px 12px 7px",
                borderRadius: 8,
                boxShadow: dark ? "none" : "0 1px 0.5px rgba(11,20,26,0.1)",
              }}
            >
              <span style={{ display: "inline-block", marginInlineEnd: 4, verticalAlign: "-1px" }}>
                <WaLock color={p.e2eText} size={9} />
              </span>
              {e2e.body} <span style={{ fontWeight: 600 }}>{e2e.more}</span>
            </div>
          </div>

          <div className="flex flex-col">
            {messages.map((m, i) => {
              const { firstOfGroup, lastOfGroup } = groupInfo(messages, i);
              // the typing bubble continues the incoming group
              const tail = lastOfGroup && !(typing && m.sender === "them" && i === messages.length - 1);
              return (
                <IosRow
                  key={m.id}
                  m={m}
                  p={p}
                  rtl={rtl}
                  uiDir={uiDir}
                  firstOfGroup={firstOfGroup}
                  tail={tail}
                  status={playback.statusOf(m)}
                  person={m.sender === "me" ? scenario.me : scenario.them}
                  live={live}
                />
              );
            })}

            {typing && (
              <div
                className={`flex justify-start ${live ? "rcss-anim-fade" : ""}`}
                style={{ padding: "0 14px", marginTop: lastSender === "them" ? 2 : 8 }}
              >
                <div
                  className="relative flex items-center"
                  style={{
                    background: p.inBubble,
                    borderRadius: BUBBLE_RADIUS,
                    borderBottomLeftRadius: rtl ? BUBBLE_RADIUS : 0,
                    borderBottomRightRadius: rtl ? 0 : BUBBLE_RADIUS,
                    boxShadow: p.shadow,
                    height: 36,
                    padding: "0 14px",
                    gap: 4,
                  }}
                >
                  <IosTail side={rtl ? "right" : "left"} color={p.inBubble} />
                  {[0, 1, 2].map((d) => (
                    <span
                      key={d}
                      className="rcss-typing-dot block rounded-full"
                      style={{ width: 7, height: 7, background: p.dot, animationDelay: `${d * 0.18}s` }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Composer */}
      <div
        className="flex shrink-0 items-center"
        style={{
          background: p.bar,
          borderTop: `0.5px solid ${p.barLine}`,
          padding: "7px 12px 4px",
          gap: 12,
        }}
      >
        <IosPlus color={p.ink} />
        <div
          className="flex flex-1 items-center justify-end"
          style={{
            height: 34,
            borderRadius: 17,
            background: p.field,
            border: `0.5px solid ${p.fieldLine}`,
            paddingInline: 7,
          }}
        >
          <IosSticker color={p.ink} />
        </div>
        <div className="flex items-center" style={{ gap: 16 }}>
          <IosCamera color={p.ink} />
          <IosMic color={p.ink} />
        </div>
      </div>
      <div style={{ background: p.bar, paddingTop: 8 }}>
        <SystemBottomBar device={scenario.device} bg={p.bar} fg={p.home} />
      </div>
    </div>
  );
}

/* ======================================================================
   Message row
   ====================================================================== */

function IosRow({
  m,
  p,
  rtl,
  uiDir,
  firstOfGroup,
  tail,
  status,
  person,
  live,
}: {
  m: Message;
  p: IosPalette;
  rtl: boolean;
  uiDir: "rtl" | "ltr";
  firstOfGroup: boolean;
  tail: boolean;
  status: DeliveryStatus;
  person: Person;
  live: boolean;
}) {
  const mine = m.sender === "me";
  const onRight = mine ? !rtl : rtl;
  const bg = mine ? p.outBubble : p.inBubble;
  const metaColor = mine ? p.metaOut : p.meta;
  const isImage = m.type === "image";
  const isVoice = m.type === "voice";
  const caption = isImage ? m.text.trim() : "";
  const textDir = dirOf(m.text);

  const radius: CSSProperties = { borderRadius: BUBBLE_RADIUS };
  if (tail) {
    if (onRight) radius.borderBottomRightRadius = 0;
    else radius.borderBottomLeftRadius = 0;
  }

  const meta = (overlay: boolean) => (
    <span
      className="inline-flex items-center whitespace-nowrap"
      style={{
        fontSize: 11,
        lineHeight: "14px",
        gap: 3,
        color: overlay ? "#ffffff" : metaColor,
        fontVariantNumeric: "tabular-nums",
      }}
    >
      {m.time}
      {mine && <WaTicks status={status} color={overlay ? "#ffffff" : metaColor} readColor={p.read} width={16} />}
    </span>
  );
  const reserve = waMetaWidth(m.time, mine, 6.4, 16);

  let body: ReactNode;
  let padding = "6px 10px 7px";
  let dir: "rtl" | "ltr" = textDir;

  if (isVoice) {
    dir = uiDir;
    padding = "8px 10px 6px 10px";
    body = <IosVoice m={m} p={p} mine={mine} status={status} person={person} meta={meta(false)} />;
  } else if (isImage) {
    padding = "3px";
    dir = caption ? textDir : uiDir;
    body = (
      <div style={{ width: 236 }}>
        <div className="relative overflow-hidden" style={{ borderRadius: BUBBLE_RADIUS - 3 }}>
          {m.imageSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={m.imageSrc}
              alt=""
              draggable={false}
              style={{ display: "block", width: "100%", height: "auto", maxHeight: 320, objectFit: "cover" }}
            />
          ) : (
            <ImagePlaceholder dark={p === DARK} />
          )}
          {!caption && (
            <>
              <span
                className="pointer-events-none absolute inset-x-0 bottom-0"
                style={{ height: 32, background: "linear-gradient(to top, rgba(0,0,0,0.38), rgba(0,0,0,0))" }}
              />
              <span className="absolute" style={{ bottom: 5, insetInlineEnd: 8 }}>
                {meta(true)}
              </span>
            </>
          )}
        </div>
        {caption && (
          <div className="relative" style={{ padding: "5px 7px 4px" }}>
            <span className="whitespace-pre-wrap break-words" style={{ fontSize: 17, lineHeight: "22px" }}>
              {caption}
            </span>
            <span style={{ display: "inline-block", width: reserve, height: 1 }} />
            <span className="absolute" style={{ bottom: 3, insetInlineEnd: 7 }}>
              {meta(false)}
            </span>
          </div>
        )}
      </div>
    );
  } else {
    body = (
      <>
        <span className="whitespace-pre-wrap break-words" style={{ fontSize: 17, lineHeight: "22px" }}>
          {m.text}
        </span>
        <span style={{ display: "inline-block", width: reserve, height: 1 }} />
        <span className="absolute" style={{ bottom: 5, insetInlineEnd: 9 }}>
          {meta(false)}
        </span>
      </>
    );
  }

  return (
    <div
      data-mid={m.id}
      className={`flex ${mine ? "justify-end" : "justify-start"}`}
      style={{ padding: "0 14px", marginTop: firstOfGroup ? 8 : 2 }}
    >
      <div
        className={`relative ${live ? (mine ? "rcss-anim-rise" : "rcss-anim-pop") : ""}`}
        dir={dir}
        style={{
          maxWidth: "78%",
          background: bg,
          color: p.text,
          boxShadow: p.shadow,
          padding,
          ...radius,
        }}
      >
        {tail && <IosTail side={onRight ? "right" : "left"} color={bg} />}
        {body}
      </div>
    </div>
  );
}

function ImagePlaceholder({ dark }: { dark: boolean }) {
  return (
    <div
      className="flex items-center justify-center"
      style={{ width: "100%", height: 180, background: dark ? "#2c2c2e" : "#e4e6e8" }}
    >
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="4.5" width="18" height="15" rx="2.5" stroke={dark ? "#636366" : "#aeb6bc"} strokeWidth="1.6" />
        <circle cx="9" cy="9.5" r="1.7" fill={dark ? "#636366" : "#aeb6bc"} />
        <path d="M4 17.5l5-5 4 4 3-3 4.5 4.5" stroke={dark ? "#636366" : "#aeb6bc"} strokeWidth="1.6" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

/** iOS voice note: play | waveform (duration + meta below) | avatar with mic badge. */
function IosVoice({
  m,
  p,
  mine,
  status,
  person,
  meta,
}: {
  m: Message;
  p: IosPalette;
  mine: boolean;
  status: DeliveryStatus;
  person: Person;
  meta: ReactNode;
}) {
  const bars = waWaveform(m.id, 30, 3, 22);
  // outgoing mic turns blue once played (≈ read); incoming is green until played
  const badge = mine ? (status === "read" ? p.read : p.voiceIn) : p.unplayed;
  const wave = mine ? p.waveOut : p.waveIn;
  const play = mine ? p.voiceOut : p.voiceIn;
  return (
    <div className="flex items-center" style={{ width: 246, gap: 10 }}>
      <svg width="20" height="22" viewBox="0 0 20 22" className="shrink-0">
        <path
          d="M3 2.6c0-1 1.1-1.6 2-1.1l13.3 8.4c.8.5.8 1.7 0 2.2L5 20.5c-.9.5-2-.1-2-1.1z"
          fill={play}
        />
      </svg>
      <div className="min-w-0 flex-1">
        <div className="relative flex items-center" style={{ height: 26, gap: 2 }}>
          {bars.map((h, i) => (
            <span key={i} style={{ width: 2.5, height: h, borderRadius: 2, background: wave, flexShrink: 0 }} />
          ))}
          <span
            className="absolute rounded-full"
            style={{ width: 11, height: 11, top: 7.5, insetInlineStart: -3, background: badge }}
          />
        </div>
        <div className="flex items-center justify-between" style={{ marginTop: 3 }}>
          <span style={{ fontSize: 11, lineHeight: "14px", color: mine ? p.metaOut : p.meta }}>
            {m.voiceDuration || "0:07"}
          </span>
          {meta}
        </div>
      </div>
      <div className="relative shrink-0">
        <Avatar person={person} size={46} />
        <span className="absolute" style={{ bottom: -3, insetInlineStart: -5 }}>
          <MicBadge color={badge} ring={mine ? p.outBubble : p.inBubble} />
        </span>
      </div>
    </div>
  );
}
