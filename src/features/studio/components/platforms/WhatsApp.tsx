"use client";

/**
 * WhatsApp for iOS: chat screen as it ships in late 2026, i.e. the full
 * "Liquid Glass" chat interface (App Store build 26.35.72, Sept 10 2026) with
 * the rounder message bubbles (rolled out July 2026).
 *
 * Sources (all screenshots measured pixel by pixel, scale from the screen width):
 *  - Full Liquid Glass chat UI on the App Store (26.35.72): transparent nav bar
 *    with a fade, floating translucent chat bar, glass jump-to-bottom button:
 *    https://wabetainfo.com/whatsapp-is-widely-rolling-out-the-full-liquid-glass-experience/
 *    (image WA_FULL_LIQUID_GLASS_CHAT_INTERFACE_EXPERIENCE_IOS.webp)
 *    https://wabetainfo.com/whatsapp-is-rolling-out-liquid-glass-for-the-chat-interface-on-ios/
 *    https://wabetainfo.com/whatsapp-to-test-liquid-glass-design-for-the-chat-interface/
 *  - Rounder bubbles + frameless media:
 *    https://wabetainfo.com/whatsapp-launches-a-new-design-for-message-bubbles-on-ios/
 *    https://wabetainfo.com/whatsapp-beta-for-ios-26-18-10-71-whats-new/
 *  - 2024 refresh (neutral chrome, darker dark mode, redrawn doodle, greens
 *    #1DAA61 / #21C063): https://www.meta.com/design-at-meta/blog/whatsapp-user-interface-update/
 *
 * Measured values (393pt device, standard text size):
 *  - Header: no bar. Glass circle back button 38pt (chevron only, it shows an
 *    unread count when there is one), 38pt avatar, name 17 semibold + subtitle
 *    13 regular grey, glass capsule (video | phone) 84×38, 16pt side insets,
 *    centred ~21pt below the status bar. Soft fade of the wallpaper behind it.
 *  - Composer floats 39pt above the screen bottom: glass "+" circle 38 |
 *    glass capsule field 38 tall (sticker glyph at its end, no placeholder) |
 *    glass camera circle 38 | green mic circle 38 (white glyph). Insets 14, gaps
 *    10 / 8 / 6.
 *  - Bubbles: radius 18 (was ~7–12), single-line height ~37 (17/22 text, insets
 *    7/12/8), 16pt from the screen edge, ~3pt inside a run, 8pt between senders.
 *    Tail: iMessage-like flare on the bottom corner of the LAST bubble of a run
 *    (tip ~6.5pt out on the baseline, notch ~6pt in, 2.5pt up).
 *  - Meta: 11pt (cap height 7.9pt measured), baseline ~6.7pt above the bubble
 *    bottom, 4pt between time and ticks; single tick 10pt wide, left-aligned in
 *    the 16pt tick slot (WhatsApp Web msg-check / msg-dblcheck paths).
 *  - Media: frameless, radius 18, time overlaid in white bottom-right; ~280pt
 *    wide (≈72% of the screen).
 *  - Date chip: pill ~18pt tall, 12 semibold, wide (min ~96pt) glass fill.
 *  - Palette: light wallpaper #F4F1EB (sampled) with doodle ~#E9E5DD, bubbles
 *    #D9FDD3 / #FFFFFF; dark wallpaper #0A0A0A (sampled) with doodle ~#1F1F1F,
 *    bubbles #144D37 / #242626, read ticks #53BDEB.
 *  - Typing: header subtitle "typing…" plus the in-chat typing bubble (2025).
 *  - Motion: an outgoing bubble rises out of the composer (≈46pt, 340ms, decel);
 *    an incoming one fades + grows from its tail corner (260ms).
 *
 * Round 4 (reactions, replies, compose typing):
 *  - Typing state of the Liquid Glass chat bar (WABetaInfo, June 2026):
 *    https://wabetainfo.com/whatsapp-is-rolling-out-liquid-glass-for-the-chat-interface-on-ios/
 *    (WA_WHATSAPP_LIQUID_GLASS_INTERFACE_CHAT_SCREEN_FEATURE_IOS.webp): with text
 *    in the field the camera + mic circles leave, the field stretches to a green
 *    send circle (flat paper plane, light glyph in light mode, dark #0A1014-ish
 *    glyph in dark mode), the sticker glyph stays at the field end, text 17pt
 *    ~13pt from the field start. Caret = app tint (green).
 *  - Reaction pill (WABetaInfo iOS captures, 3x):
 *    https://wabetainfo.com/whatsapp-is-rolling-out-message-reactions-to-everyone/
 *    https://wabetainfo.com/whatsapp-beta-for-ios-22-22-0-73-whats-new/
 *    20pt tall incl. a 1.5pt ring in the background colour, ≥32pt wide, emoji
 *    ~15pt, overlaps the bubble bottom by 3pt, 10.5pt in from the bubble's own
 *    outer edge (end side for mine, start side for theirs); next row 3pt below.
 *  - Quoted reply (same 22.22 capture + Android 2.25.25.8 threads capture):
 *    block 4pt in from the bubble edges, 4pt bar, name semibold in the bar
 *    colour (You = green, contact = purple), one-line snippet, photo thumb on
 *    the trailing side; voice → mic + "Voice message (0:14)".
 *
 * Round 5 (groups, new kinds, keyboard):
 *  - Groups (WABetaInfo iOS group capture, 3x, WA_PROFILE_PHOTO_GROUP_CHAT_D4E2_IOS.jpg):
 *    https://wabetainfo.com/whatsapp-beta-for-ios-22-23-0-70-whats-new/
 *    header = group photo + name, subtitle = member names then "You" ("WBI, You");
 *    the coloured sender name (≈14 semibold) opens the first bubble of a run,
 *    10pt in; the member photo (~28pt) sits beside the LAST bubble of the run
 *    (next to the tail), ~10pt from the screen edge, bubble body at ~48pt.
 *    A member without a photo gets the default photo tinted with the name colour
 *    (https://wabetainfo.com/whatsapp-is-releasing-the-ability-to-view-profile-photos-within-group-chats/).
 *    Typing: "Khalid is typing…" / «خالد يكتب…».
 *  - Link preview (same capture): darker inner block 4pt in at the top of the
 *    bubble (image, semibold title, grey description, grey domain); the URL in
 *    the text is underlined in the link tint.
 *  - Calls: icon circle + "Missed voice call" / "Tap to call back"; deleted:
 *    ⃠ glyph + italic grey "This message was deleted." / "You deleted this
 *    message."; "Edited" sits before the time in the meta.
 *  - Keyboard: the floating chat bar rides 8pt above the keyboard (iOS 26
 *    keyboard-attached accessory spacing), the home indicator band goes away
 *    and the thread's viewport shrinks so the newest message stays in view.
 *
 * Shared WhatsApp helpers (doodle wallpaper, ticks, waveform, E2E notice
 * strings) are exported from here; WhatsAppAndroid.tsx may still import them.
 */

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";

import type { DeliveryStatus, LinkPreview, Message, Person } from "../../types";
import { dirOf, SystemBottomBar, useChatScroll } from "../shared";
import { useKeyboardInset } from "../devices/keyboard-context";
import { StatusBar } from "../devices/StatusBar";
import { CHROME, type Lang } from "./chrome";
import type { PlatformMotion, PlatformProps } from "./types";

/* ======================================================================
   Shared WhatsApp helpers (kept exported for WhatsAppAndroid.tsx)
   ====================================================================== */

/** Line-art glyphs for the doodle wallpaper, each drawn in a 24×24 box. */
const DOODLE_GLYPHS: string[] = [
  "M12 20s-7-4.4-7-9.6A4 4 0 0 1 12 8a4 4 0 0 1 7 2.4C19 15.6 12 20 12 20z",
  "M12 3.5l2.5 5.3 5.8.7-4.3 4 1.1 5.8L12 16.4l-5.1 2.9 1.1-5.8-4.3-4 5.8-.7z",
  "M7 18h10a4 4 0 0 0 .4-8 6 6 0 0 0-11.2 1.7A3.2 3.2 0 0 0 7 18z",
  "M7 3.5l2 3.6-1.6 1.8a10 10 0 0 0 7.7 7.7l1.8-1.6 3.6 2-.9 3.1c-.2.6-.8 1-1.4.9C10.1 20.3 3.7 13.9 3.1 5.8c0-.6.3-1.2.9-1.4z",
  "M4 8.5h3.2L9 6h6l1.8 2.5H20V19H4zM12 10.5a3.4 3.4 0 1 0 0 6.8 3.4 3.4 0 0 0 0-6.8z",
  "M9 17.5V6.5l10-2.2v11M9 17.5a2.4 2.4 0 1 1-4.8 0 2.4 2.4 0 0 1 4.8 0zM19 15.3a2.4 2.4 0 1 1-4.8 0 2.4 2.4 0 0 1 4.8 0z",
  "M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16zM9.3 10h.01M14.7 10h.01M8.6 13.8c1.9 2.1 4.9 2.1 6.8 0",
  "M5 10h11v4.5A4.5 4.5 0 0 1 11.5 19h-2A4.5 4.5 0 0 1 5 14.5zM16 11h1.4a2.3 2.3 0 0 1 0 4.6H16M8.5 3.5c-.9 1.3.9 2.2 0 3.6M12 3.5c-.9 1.3.9 2.2 0 3.6",
  "M3.5 12a8.5 8.5 0 0 1 17 0zM12 12v6.2a1.8 1.8 0 0 1-3.6 0",
  "M9.5 18h5M10.3 20.6h3.4M12 3.5a5.8 5.8 0 0 0-3.4 10.5v1.9h6.8V14A5.8 5.8 0 0 0 12 3.5z",
  "M4.5 5.5h15v10h-9.2l-4.3 3.6V15.5H4.5z",
  "M4.5 10.5h15V20h-15zM3.5 7.5h17v3h-17zM12 7.5V20M12 7.5c-1.6-3.6-5.6-2.8-3.8 0M12 7.5c1.6-3.6 5.6-2.8 3.8 0",
  "M19.5 14.6A7.6 7.6 0 0 1 9.4 4.5a7.6 7.6 0 1 0 10.1 10.1z",
  "M3.5 11.2 20.5 4l-6.6 16.6-2.8-6.6zM11.1 14 20.5 4",
  "M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16zM12 7.6V12l2.9 1.9",
  "M5 19C5 10.5 10 5.5 19 5c-.4 8.6-5.4 14-14 14zM5 19l8.5-8.5",
  "M12 8.6a3.4 3.4 0 1 0 0 6.8 3.4 3.4 0 0 0 0-6.8zM12 3v2.2M12 18.8V21M3 12h2.2M18.8 12H21M5.6 5.6l1.6 1.6M16.8 16.8l1.6 1.6M5.6 18.4l1.6-1.6M16.8 7.2l1.6-1.6",
  "M3.5 6.5h17v11h-17zM3.5 6.5l8.5 6.6 8.5-6.6",
  "M12 3.5a5 5 0 0 1 5 5c0 3.6-2.8 6-5 6s-5-2.4-5-6a5 5 0 0 1 5-5zM12 14.5l-.9 1.6h1.8zM12 16.1c0 1.8-1.8 2.7-.9 4.4",
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
    body: "الرسائل والمكالمات مشفرة تمامًا بين الطرفين. يمكن فقط للأشخاص في هذه الدردشة قراءتها أو الاستماع إليها أو مشاركتها.",
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
   Metrics + palette
   ====================================================================== */

const R = 18; // bubble corner radius
const SIDE = 16; // bubble inset from the screen edge
const CTL = 38; // glass control size (header + composer)
const STATUS_H = 54;
const HEADER_H = 42;
const COMPOSER_BOTTOM = 39; // composer bottom edge above the screen bottom
const TOP_PAD = STATUS_H + HEADER_H + 10;
const BOTTOM_PAD = COMPOSER_BOTTOM + CTL + 16;
const IMG_W = 280;
const KB_GAP = 8; // chat bar bottom above the keyboard top
/* groups: member photo 28pt, 10pt from the screen edge, bubble body at 48pt */
const AV = 28;
const AV_START = 10;
const AV_GAP = 10;
/* new kinds */
const CARD_W = 268; // location / document bubble width
const STICKER = 150;

interface Pal {
  ink: string;
  sub: string;
  wall: string;
  wallRgb: string;
  doodle: string;
  inBubble: string;
  outBubble: string;
  text: string;
  metaIn: string;
  metaOut: string;
  read: string;
  bubbleShadow: string;
  glass: CSSProperties;
  icon: string;
  green: string;
  chip: string;
  chipText: string;
  e2e: string;
  e2eText: string;
  dot: string;
  playIn: string;
  playOut: string;
  waveIn: string;
  waveOut: string;
  voiceUnplayed: string;
  voiceIdle: string;
  avatarBg: string;
  avatarFg: string;
  home: string;
  link: string;
  /** glyph colour on the green accent buttons (mic / send) */
  onGreen: string;
  /** text caret (the app tint) */
  caret: string;
  /** quoted-reply block fill inside an incoming / outgoing bubble */
  quoteIn: string;
  quoteOut: string;
  /** quoted-reply bar + name: my messages ("You") / the contact */
  quoteYou: string;
  quoteThem: string;
  quoteSnippetIn: string;
  quoteSnippetOut: string;
  quoteThumb: string;
  /** reaction pill under a bubble: fill, separating ring, shadow */
  pill: string;
  pillRing: string;
  pillShadow: string;
}

/** Denser doodle tile for iOS (the 2024 redrawn pattern is tighter than the old one). */
function iosDoodle(stroke: string, opacity: number): string {
  const cell = 40;
  const parts: string[] = [];
  for (let r = 0; r < 6; r++) {
    for (let c = 0; c < 6; c++) {
      const k = r * 6 + c;
      const x = c * cell + (r % 2 ? 20 : 2) + ((k * 5) % 7) - 3;
      const y = r * cell + ((c * 11) % 7) - 2;
      const rot = ((k * 41) % 70) - 35;
      const s = 0.72 + ((k * 13) % 5) * 0.04;
      const glyph = DOODLE_GLYPHS[(k * 7 + r * 3) % DOODLE_GLYPHS.length];
      parts.push(
        `<g transform='translate(${x} ${y}) rotate(${rot} 12 12) scale(${s.toFixed(2)})'><path d='${glyph}'/></g>`,
      );
    }
  }
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240' viewBox='0 0 240 240'>` +
    `<g fill='none' stroke='${stroke}' stroke-opacity='${opacity}' stroke-width='1.25' stroke-linecap='round' stroke-linejoin='round'>` +
    parts.join("") +
    `</g></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

const LIGHT: Pal = {
  ink: "#000000",
  sub: "rgba(60,60,67,0.6)",
  wall: "#f4f1eb",
  wallRgb: "244,241,235",
  doodle: iosDoodle("#7a6a52", 0.13),
  inBubble: "#ffffff",
  outBubble: "#d9fdd3",
  text: "#000000",
  metaIn: "rgba(0,0,0,0.45)",
  metaOut: "rgba(0,0,0,0.45)",
  read: "#53bdeb",
  bubbleShadow: "drop-shadow(0 0.5px 0.5px rgba(11,20,26,0.13))",
  glass: {
    background: "rgba(255,255,255,0.88)",
    boxShadow:
      "inset 0 0.5px 0 rgba(255,255,255,0.95), 0 0 0 0.5px rgba(0,0,0,0.05), 0 3px 12px rgba(0,0,0,0.07)",
  },
  icon: "#000000",
  green: "#1daa61",
  chip: "rgba(255,255,255,0.9)",
  chipText: "#000000",
  e2e: "#ffeecd",
  e2eText: "#54656f",
  dot: "#8e8e93",
  playIn: "#8696a0",
  playOut: "#6b8a67",
  waveIn: "#c5cbcf",
  waveOut: "#a6c8a0",
  voiceUnplayed: "#1daa61",
  voiceIdle: "#8696a0",
  avatarBg: "#d1d7db",
  avatarFg: "#ffffff",
  home: "#000000",
  link: "#027eb5",
  onGreen: "#ffffff",
  caret: "#1daa61",
  quoteIn: "rgba(11,20,26,0.05)",
  quoteOut: "rgba(11,20,26,0.06)",
  quoteYou: "#1daa61",
  quoteThem: "#7f66ff",
  quoteSnippetIn: "rgba(0,0,0,0.55)",
  quoteSnippetOut: "rgba(0,0,0,0.55)",
  quoteThumb: "#d7dadc",
  pill: "#ffffff",
  pillRing: "#f4f1eb",
  pillShadow: "0 1px 1.5px rgba(11,20,26,0.14)",
};

const DARK: Pal = {
  ink: "#ffffff",
  sub: "rgba(235,235,245,0.6)",
  wall: "#0a0a0a",
  wallRgb: "10,10,10",
  doodle: iosDoodle("#ffffff", 0.085),
  inBubble: "#242626",
  outBubble: "#144d37",
  text: "#ffffff",
  metaIn: "rgba(255,255,255,0.55)",
  metaOut: "rgba(255,255,255,0.6)",
  read: "#53bdeb",
  bubbleShadow: "none",
  glass: {
    background: "rgba(34,34,34,0.82)",
    boxShadow:
      "inset 0 0.5px 0 rgba(255,255,255,0.16), 0 0 0 0.5px rgba(255,255,255,0.05), 0 3px 12px rgba(0,0,0,0.4)",
  },
  icon: "#ffffff",
  green: "#21c063",
  chip: "rgba(28,28,28,0.92)",
  chipText: "rgba(255,255,255,0.78)",
  e2e: "#1c1c1c",
  e2eText: "#ffd279",
  dot: "#8d8d93",
  playIn: "#aeb4b8",
  playOut: "#c7e3d2",
  waveIn: "#55595b",
  waveOut: "#4f8a70",
  voiceUnplayed: "#21c063",
  voiceIdle: "#aeb4b8",
  avatarBg: "#3b3f42",
  avatarFg: "#9ba1a5",
  home: "#ffffff",
  link: "#53bdeb",
  onGreen: "#0a1014",
  caret: "#21c063",
  quoteIn: "rgba(0,0,0,0.22)",
  quoteOut: "rgba(0,0,0,0.22)",
  quoteYou: "#21c063",
  quoteThem: "#a791ff",
  quoteSnippetIn: "rgba(255,255,255,0.6)",
  quoteSnippetOut: "rgba(255,255,255,0.62)",
  quoteThumb: "#3a3d3f",
  pill: "#363838",
  pillRing: "#0a0a0a",
  pillShadow: "none",
};

/* ======================================================================
   Motion (shared by the live CSS and the exporter)
   ====================================================================== */

/** CSS cubic-bezier(x1,y1,x2,y2) evaluated in JS (Newton + bisection). */
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

const OUT_MS = 340;
const IN_MS = 260;
const easeOut = cubicBezier(0.2, 0.85, 0.25, 1);
const easeIn = cubicBezier(0.25, 0.8, 0.3, 1);

/**
 * WhatsApp iOS entrance: a sent bubble is born at the chat bar and rises
 * ~46pt into place while it fades in quickly (it looks like it leaves the input
 * field); a received bubble fades in and grows slightly from its tail corner.
 * The exporter drives the outgoing curve over OUT_MS; enterMs is that longer one,
 * the incoming curve completes at IN_MS/OUT_MS of the progress.
 */
export const whatsappIosMotion: PlatformMotion = {
  enterMs: OUT_MS,
  enterStyle: (p, mine, rtl) => {
    const onRight = mine ? !rtl : rtl;
    const transformOrigin = `${onRight ? "right" : "left"} bottom`;
    if (mine) {
      const e = easeOut(p);
      return {
        opacity: Math.min(1, p / 0.22),
        transform: `translateY(${((1 - e) * 46).toFixed(2)}px) scale(${(0.96 + 0.04 * e).toFixed(4)})`,
        transformOrigin,
      };
    }
    const q = Math.min(1, p * (OUT_MS / IN_MS));
    const e = easeIn(q);
    return {
      opacity: Math.min(1, q / 0.55),
      transform: `translateY(${((1 - e) * 8).toFixed(2)}px) scale(${(0.9 + 0.1 * e).toFixed(4)})`,
      transformOrigin,
    };
  },
};

/** Typing-bubble dots: 1.2s cycle, each dot 0.2s behind; pulses opacity + scale. */
const DOT_MS = 1200;
/** Text caret blink cycle (UIKit ≈ 1s). */
const CARET_MS = 1000;
function dotAt(phase: number): { opacity: number; scale: number } {
  const t = ((phase % 1) + 1) % 1;
  const k = t < 0.5 ? Math.sin((t / 0.5) * Math.PI) : 0;
  return { opacity: 0.35 + 0.65 * k, scale: 0.85 + 0.15 * k };
}

/** Keyframes generated from the very functions the exporter calls → preview == export. */
const MOTION_CSS = (() => {
  const steps = 20;
  let css = "";
  for (const mine of [true, false]) {
    for (const rtl of [false, true]) {
      const name = `wa-ios-in-${mine ? "me" : "them"}-${rtl ? "rtl" : "ltr"}`;
      let frames = "";
      for (let i = 0; i <= steps; i++) {
        const p = i / steps;
        const st = whatsappIosMotion.enterStyle(p, mine, rtl);
        frames += `${(p * 100).toFixed(2)}%{opacity:${st.opacity};transform:${st.transform};transform-origin:${st.transformOrigin}}`;
      }
      css += `@keyframes ${name}{${frames}}.${name}{animation:${name} ${OUT_MS}ms linear both}`;
    }
  }
  let dot = "";
  for (let i = 0; i <= 20; i++) {
    const d = dotAt(i / 20);
    dot += `${i * 5}%{opacity:${d.opacity.toFixed(3)};transform:scale(${d.scale.toFixed(3)})}`;
  }
  css += `@keyframes wa-ios-dot{${dot}}.wa-ios-dot{animation:wa-ios-dot ${DOT_MS}ms linear infinite}`;
  // UIKit text caret: solid right after a keystroke, then a soft ~1s blink
  css += `@keyframes wa-ios-caret{0%,50%{opacity:1}60%,90%{opacity:0}100%{opacity:1}}.wa-ios-caret{animation:wa-ios-caret ${CARET_MS}ms linear infinite}`;
  return css;
})();

/** iOS 26 scroll-edge effect, approximated with a smooth (smoothstep) alpha ramp. */
function edgeFade(rgb: string, to: string, max: number): string {
  const stops: string[] = [];
  for (let i = 0; i <= 10; i++) {
    const t = i / 10;
    const u = Math.min(1, Math.max(0, (t - 0.35) / 0.65));
    const a = max * (1 - u * u * (3 - 2 * u));
    stops.push(`rgba(${rgb},${a.toFixed(3)}) ${(t * 100).toFixed(0)}%`);
  }
  return `linear-gradient(${to}, ${stops.join(", ")})`;
}

function enterClass(live: boolean, mine: boolean, rtl: boolean): string {
  return live ? `wa-ios-in-${mine ? "me" : "them"}-${rtl ? "rtl" : "ltr"}` : "";
}

/* ======================================================================
   Glyphs (SF Symbols look; drawn inline)
   ====================================================================== */

function Chevron({ color }: { color: string }) {
  return (
    <svg width="12" height="20" viewBox="0 0 12 20" fill="none" className="shrink-0 rtl:-scale-x-100">
      <path d="M10 1.8 1.9 10l8.1 8.2" stroke={color} strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** SF "video" outline (does not mirror in RTL). */
function VideoGlyph({ color }: { color: string }) {
  return (
    <svg width="25" height="17" viewBox="0 0 25 17" fill="none">
      <rect x="0.9" y="1.4" width="15.6" height="14.2" rx="3.6" stroke={color} strokeWidth="1.7" />
      <path
        d="M16.5 6.4l5.4-3.3c.7-.4 1.6.1 1.6.9v9c0 .8-.9 1.3-1.6.9l-5.4-3.3"
        stroke={color}
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** SF "phone" outline (does not mirror in RTL). */
function PhoneGlyph({ color }: { color: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path
        d="M6.9 2.6c.5 0 .9.3 1.1.7l1.6 3.6c.2.5.1 1-.3 1.4L7.6 9.9c1.2 2.6 3.4 4.8 6 6l1.6-1.7c.4-.4.9-.5 1.4-.3l3.6 1.6c.4.2.7.6.7 1.1v2.8c0 1.1-.9 2-2 2C10.3 21.4 2.6 13.7 2.6 4.6c0-1.1.9-2 2-2z"
        stroke={color}
        strokeWidth="1.9"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PlusGlyph({ color }: { color: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M10 1.8v16.4M1.8 10h16.4" stroke={color} strokeWidth="1.9" strokeLinecap="round" />
    </svg>
  );
}

/** WhatsApp sticker glyph: rounded square with a peeled bottom corner. */
function StickerGlyph({ color }: { color: string }) {
  return (
    <svg width="21" height="21" viewBox="0 0 22 22" fill="none">
      <path
        d="M19.5 12.4V7A4.5 4.5 0 0 0 15 2.5H7A4.5 4.5 0 0 0 2.5 7v8A4.5 4.5 0 0 0 7 19.5h5.4z"
        stroke={color}
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path d="M12.4 19.5v-2.6a4.5 4.5 0 0 1 4.5-4.5h2.6" stroke={color} strokeWidth="1.7" strokeLinejoin="round" />
    </svg>
  );
}

function CameraGlyph({ color }: { color: string }) {
  return (
    <svg width="23" height="19" viewBox="0 0 24 20" fill="none">
      <path
        d="M3.6 4.6h2.9l1.5-2c.3-.4.8-.7 1.3-.7h5.4c.5 0 1 .3 1.3.7l1.5 2h2.9A2.3 2.3 0 0 1 22.7 6.9v8.9a2.3 2.3 0 0 1-2.3 2.3H3.6a2.3 2.3 0 0 1-2.3-2.3V6.9a2.3 2.3 0 0 1 2.3-2.3z"
        stroke={color}
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="11" r="3.7" stroke={color} strokeWidth="1.7" />
      <circle cx="18.6" cy="7.6" r="0.95" fill={color} />
    </svg>
  );
}

function MicGlyph({ color }: { color: string }) {
  return (
    <svg width="16" height="22" viewBox="0 0 16 22" fill="none">
      <rect x="4.4" y="1" width="7.2" height="12.4" rx="3.6" fill={color} />
      <path d="M1.6 9.6a6.4 6.4 0 0 0 12.8 0M8 16.2v4" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

/** Small filled mic used as the voice-note badge on the avatar. */
function MicBadge({ color, ring }: { color: string; ring: string }) {
  return (
    <svg width="15" height="18" viewBox="0 0 16 18" style={{ display: "block" }}>
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

/**
 * WhatsApp's send glyph: a flat paper plane pointing right with a notched
 * back; the lower wing is a touch darker (the fold), as on the real button.
 */
function SendGlyph({ color, flip }: { color: string; flip: boolean }) {
  return (
    <svg
      width="20"
      height="18"
      viewBox="0 0 22 20"
      style={{ display: "block", transform: flip ? "scaleX(-1)" : undefined, marginInlineStart: flip ? 0 : 2 }}
    >
      <path d="M1.6 1.9c-.4-.9.5-1.8 1.4-1.4L20.9 9c.9.4.9 1.6 0 2L3 19.5c-.9.4-1.8-.5-1.4-1.4L5.3 10z" fill={color} />
      <path d="M5.3 10h15.9c0 .4-.1.8-.3 1L3 19.5c-.9.4-1.8-.5-1.4-1.4z" fill="#000000" fillOpacity="0.14" />
    </svg>
  );
}

/** SF "camera.fill"-style mini glyph used inside a quoted-reply snippet. */
function MiniCamera({ color }: { color: string }) {
  return (
    <svg width="15" height="12" viewBox="0 0 24 19" style={{ display: "inline-block", verticalAlign: "-1px", flexShrink: 0 }}>
      <path
        d="M3.4 3.6h3.2l1.6-2.1c.3-.4.8-.7 1.3-.7h5c.5 0 1 .3 1.3.7l1.6 2.1h3.2A2.6 2.6 0 0 1 23.2 6.2v9.6a2.6 2.6 0 0 1-2.6 2.6H3.4A2.6 2.6 0 0 1 .8 15.8V6.2a2.6 2.6 0 0 1 2.6-2.6zM12 6.2a4.4 4.4 0 1 0 0 8.8 4.4 4.4 0 0 0 0-8.8z"
        fill={color}
        fillRule="evenodd"
      />
    </svg>
  );
}

/** SF "mic.fill"-style mini glyph used inside a quoted-reply snippet. */
function MiniMic({ color }: { color: string }) {
  return (
    <svg width="10" height="14" viewBox="0 0 16 22" style={{ display: "inline-block", verticalAlign: "-1.5px", flexShrink: 0 }}>
      <rect x="4.4" y="1" width="7.2" height="12.4" rx="3.6" fill={color} />
      <path d="M1.6 9.6a6.4 6.4 0 0 0 12.8 0M8 16.2v4" stroke={color} strokeWidth="2" strokeLinecap="round" fill="none" />
    </svg>
  );
}

/**
 * Bubble tail for the new (2026) rounder bubbles: the body edge runs straight
 * down, flares out ~6.5pt to a point on the baseline, and the underside curls
 * back up into a small notch before joining the bottom edge. It covers the
 * bubble's rounded bottom corner on that side.
 */
function Tail({ side, color }: { side: "left" | "right"; color: string }) {
  const style: CSSProperties = {
    position: "absolute",
    bottom: 0,
    width: 20,
    height: R,
    display: "block",
    pointerEvents: "none",
    overflow: "visible",
  };
  if (side === "right") style.right = -7;
  else {
    style.left = -7;
    style.transform = "scaleX(-1)";
  }
  return (
    <svg viewBox={`0 0 20 ${R}`} style={style}>
      <path
        d={`M13 0C13 8.5 14.6 14.6 19.7 17.75C19.95 17.9 19.9 18.15 19.6 18.15C16.2 18.3 11.2 17.6 7.6 15.5C5.6 17.1 3 17.9 0 18L0 0Z`}
        fill={color}
      />
    </svg>
  );
}

/* ======================================================================
   Small helpers
   ====================================================================== */

/** WhatsApp's default profile photo (grey silhouette) unless the user set one. */
function WaAvatar({ person, size, pal }: { person: Person; size: number; pal: Pal }) {
  if (person.avatar) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={person.avatar}
        alt={person.name}
        width={size}
        height={size}
        draggable={false}
        className="shrink-0 rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" className="shrink-0" style={{ display: "block" }}>
      <circle cx="20" cy="20" r="20" fill={pal.avatarBg} />
      <circle cx="20" cy="15.6" r="6.6" fill={pal.avatarFg} />
      <path d="M7.6 33.2c1.9-5.6 6.7-8.6 12.4-8.6s10.5 3 12.4 8.6A19.9 19.9 0 0 1 20 40a19.9 19.9 0 0 1-12.4-6.8z" fill={pal.avatarFg} />
    </svg>
  );
}

/** Count of emoji if the text is 1–3 emoji only (WhatsApp shows those big, bubble-less). */
function jumboCount(text: string): number {
  const t = text.trim();
  if (!t || t.length > 32) return 0;
  if (!/^[\p{Extended_Pictographic}\p{Emoji_Component}‍️⃣\s]+$/u.test(t)) return 0;
  if (!/\p{Extended_Pictographic}/u.test(t)) return 0;
  const Seg = (Intl as unknown as { Segmenter?: new (l?: string, o?: { granularity: string }) => { segment: (s: string) => Iterable<{ segment: string }> } }).Segmenter;
  let n = 0;
  if (Seg) {
    for (const s of new Seg(undefined, { granularity: "grapheme" }).segment(t)) if (s.segment.trim()) n++;
  } else {
    n = (t.match(/\p{Extended_Pictographic}/gu) ?? []).length;
  }
  return n >= 1 && n <= 3 ? n : 0;
}

const JUMBO_SIZE = [0, 52, 44, 38];

/** Strings the shared CHROME map does not carry (WhatsApp's own wording). */
interface WaStrings {
  you: string;
  photo: string;
  voice: string;
  edited: string;
  deleted: string;
  deletedMine: string;
  missedVoice: string;
  missedVideo: string;
  voiceCall: string;
  videoCall: string;
  tapToCallBack: string;
  noAnswer: string;
  isTyping: (name: string) => string;
  location: string;
  liveLocation: string;
  sticker: string;
  listSep: string;
}

const WA_STR: Record<Lang, WaStrings> = {
  en: {
    you: "You",
    photo: "Photo",
    voice: "Voice message",
    edited: "Edited",
    deleted: "This message was deleted.",
    deletedMine: "You deleted this message.",
    missedVoice: "Missed voice call",
    missedVideo: "Missed video call",
    voiceCall: "Voice call",
    videoCall: "Video call",
    tapToCallBack: "Tap to call back",
    noAnswer: "No answer",
    isTyping: (n) => `${n} is typing…`,
    location: "Location",
    liveLocation: "Live location",
    sticker: "Sticker",
    listSep: ", ",
  },
  ar: {
    you: "أنت",
    photo: "صورة",
    voice: "رسالة صوتية",
    edited: "تم التعديل",
    deleted: "تم حذف هذه الرسالة.",
    deletedMine: "لقد حذفت هذه الرسالة.",
    missedVoice: "مكالمة صوتية فائتة",
    missedVideo: "مكالمة فيديو فائتة",
    voiceCall: "مكالمة صوتية",
    videoCall: "مكالمة فيديو",
    tapToCallBack: "اضغط لمعاودة الاتصال",
    noAnswer: "لا يوجد رد",
    isTyping: (n) => `${n} يكتب…`,
    location: "الموقع",
    liveLocation: "الموقع المباشر",
    sticker: "ملصق",
    listSep: "، ",
  },
};

/**
 * Group sender-name colours (WhatsApp's participant palette: a darker shade on
 * the light theme, a lighter one on dark), picked by member index so a member
 * keeps the same colour for the whole chat. The same tint colours the
 * member's default photo.
 */
const MEMBER_COLORS: { light: string; dark: string }[] = [
  { light: "#d42a66", dark: "#ff72a1" },
  { light: "#7f66ff", dark: "#a791ff" },
  { light: "#c4532d", dark: "#fc9775" },
  { light: "#027eb5", dark: "#53bdeb" },
  { light: "#1d8b5d", dark: "#3ed38b" },
  { light: "#a63aa3", dark: "#e48ce0" },
  { light: "#00838f", dark: "#53bda5" },
  { light: "#8a6d00", dark: "#ffd279" },
];

function memberColor(i: number, dark: boolean): string {
  const c = MEMBER_COLORS[((i % MEMBER_COLORS.length) + MEMBER_COLORS.length) % MEMBER_COLORS.length];
  return dark ? c.dark : c.light;
}

/** A group member who wrote an incoming message. */
interface Author {
  index: number;
  person: Person;
  color: string;
}

/** URL matcher for in-text links (WhatsApp linkifies http(s) and www. links). */
const URL_RE = /(https?:\/\/[^\s]+|www\.[^\s]+)/g;

/** The message text with every URL tinted + underlined like WhatsApp's links. */
function linkify(text: string, color: string): ReactNode {
  const parts = text.split(URL_RE);
  if (parts.length === 1) return text;
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <span key={i} style={{ color, textDecoration: "underline", textUnderlineOffset: 2, textDecorationThickness: 1 }}>
        {part}
      </span>
    ) : (
      part
    ),
  );
}

function siteOf(link: LinkPreview): string {
  if (link.siteName) return link.siteName;
  return link.url.replace(/^https?:\/\//, "").replace(/^www\./, "").split(/[/?#]/)[0];
}

/* Reaction pill (measured on WABetaInfo iOS captures, 3x → pt): 20pt tall
   including a 1.5pt ring, ≥32pt wide, hangs 17pt below the bubble (3pt overlap),
   10.5pt in from the bubble's own outer edge. */
const PILL_H = 20;
const PILL_OVERLAP = 3;
const PILL_INSET = 10;

/** The one-line quoted-reply block at the top of a reply bubble. */
function Quote({
  target,
  p,
  inMine,
  lang,
  themName,
  themColor,
  uiDir,
}: {
  target: Message;
  p: Pal;
  inMine: boolean;
  lang: Lang;
  themName: string;
  /** group chats: the quoted member's name colour */
  themColor?: string;
  uiDir: "rtl" | "ltr";
}) {
  const s = WA_STR[lang];
  const fromMe = target.sender === "me";
  const color = fromMe ? p.quoteYou : (themColor ?? p.quoteThem);
  const snipColor = inMine ? p.quoteSnippetOut : p.quoteSnippetIn;
  const isImg = target.type === "image";
  const caption = target.text.replace(/\s+/g, " ").trim();
  let snippet: ReactNode;
  let snipDir: "rtl" | "ltr" = uiDir;
  if (target.type === "location") {
    snippet = `📍 ${target.location?.live ? s.liveLocation : target.location?.title || s.location}`;
  } else if (target.type === "file") {
    snipDir = "ltr";
    snippet = `📄 ${target.file?.name ?? ""}`;
  } else if (target.type === "sticker") {
    snippet = s.sticker;
  } else if (target.type === "call") {
    const k = target.call;
    snippet = k?.missed ? (k.video ? s.missedVideo : s.missedVoice) : k?.video ? s.videoCall : s.voiceCall;
  } else if (target.type === "deleted") {
    snippet = target.sender === "me" ? s.deletedMine : s.deleted;
  } else if (target.type === "voice") {
    snippet = (
      <>
        <MiniMic color={snipColor} /> {`${s.voice} (${target.voiceDuration || "0:07"})`}
      </>
    );
  } else if (isImg) {
    snipDir = caption ? dirOf(caption) : uiDir;
    snippet = (
      <>
        <MiniCamera color={snipColor} /> {caption || s.photo}
      </>
    );
  } else {
    snipDir = dirOf(caption);
    snippet = caption;
  }
  return (
    <div
      dir={uiDir}
      className="relative flex overflow-hidden"
      style={{ background: inMine ? p.quoteOut : p.quoteIn, borderRadius: R - 5, minWidth: 0 }}
    >
      <span style={{ width: 4, background: color, flexShrink: 0 }} />
      <div className="min-w-0 flex-1" style={{ padding: "6px 0 7px", paddingInline: "8px 10px" }}>
        <div
          className="truncate"
          dir="auto"
          style={{ fontSize: 14, lineHeight: "18px", fontWeight: 600, color, letterSpacing: -0.15, textAlign: "start" }}
        >
          {fromMe ? s.you : themName}
        </div>
        <div
          className="truncate"
          dir={snipDir}
          style={{ fontSize: 14, lineHeight: "18px", color: snipColor, letterSpacing: -0.15, textAlign: "start" }}
        >
          {snippet}
        </div>
      </div>
      {isImg && (
        <div className="relative shrink-0 overflow-hidden" style={{ width: 49, alignSelf: "stretch", background: p.quoteThumb }}>
          {target.imageSrc && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={target.imageSrc}
              alt=""
              draggable={false}
              className="absolute inset-0"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          )}
        </div>
      )}
    </div>
  );
}

/** The reaction pill that hangs off a bubble's bottom outer corner. */
function ReactionPill({ emoji, p, onRight }: { emoji: string; p: Pal; onRight: boolean }) {
  return (
    <span
      className="absolute flex items-center justify-center"
      style={{
        bottom: -(PILL_H - PILL_OVERLAP),
        [onRight ? "right" : "left"]: PILL_INSET,
        height: PILL_H,
        minWidth: 32,
        padding: "0 6px",
        boxSizing: "border-box",
        borderRadius: PILL_H / 2,
        border: `1.5px solid ${p.pillRing}`,
        background: p.pill,
        boxShadow: p.pillShadow,
        fontSize: 15,
        lineHeight: "17px",
        zIndex: 1,
      }}
    >
      {emoji}
    </span>
  );
}

/** UIKit caret: 2pt wide in the app tint, as tall as the text line. */
function Caret({ p, clockMs, k }: { p: Pal; clockMs?: number; k: number }) {
  return (
    <span
      // remount on every keystroke so the blink restarts solid, like UIKit
      key={k}
      className={clockMs === undefined ? "wa-ios-caret" : undefined}
      style={{
        display: "inline-block",
        width: 2,
        height: 21,
        marginInline: "1px -3px",
        verticalAlign: "-5px",
        borderRadius: 1,
        background: p.caret,
        // the exporter only renders drafts mid-typing or in the 220ms hold
        // before sending, when a real caret is solid (no blink yet)
        opacity: clockMs === undefined ? undefined : 1,
      }}
    />
  );
}

/* ======================================================================
   Round 5: groups + new message kinds
   ====================================================================== */

/** WhatsApp's default group photo: grey disc with two people (SF person.2.fill). */
function GroupAvatar({ src, size, pal }: { src: string | null; size: number; pal: Pal }) {
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt=""
        width={size}
        height={size}
        draggable={false}
        className="shrink-0 rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" className="shrink-0" style={{ display: "block" }}>
      <circle cx="20" cy="20" r="20" fill={pal.avatarBg} />
      <circle cx="24.6" cy="15.4" r="4.6" fill={pal.avatarFg} />
      <path d="M16.4 29.6c.6-4.9 3.9-7.6 8.2-7.6s7.6 2.7 8.2 7.6c.1.6-.3 1-.9 1H17.3c-.6 0-1-.4-.9-1z" fill={pal.avatarFg} />
      <circle cx="14.2" cy="17.2" r="3.7" fill={pal.avatarFg} />
      <path d="M7.1 29.4c.5-4 3.2-6.2 6.6-6.2 1.3 0 2.5.3 3.4.9-1.4 1.4-2.3 3.3-2.6 5.6l-.1.9H8c-.6 0-1-.5-.9-1.2z" fill={pal.avatarFg} />
    </svg>
  );
}

/** A group member's photo, or the default photo tinted with their name colour. */
function MemberAvatar({ author, size, dark }: { author: Author; size: number; dark: boolean }) {
  if (author.person.avatar) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={author.person.avatar}
        alt=""
        width={size}
        height={size}
        draggable={false}
        className="shrink-0 rounded-full object-cover"
        style={{ width: size, height: size, display: "block" }}
      />
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" className="shrink-0" style={{ display: "block" }}>
      <circle cx="20" cy="20" r="20" fill={author.color} fillOpacity={dark ? 0.3 : 0.2} />
      <circle cx="20" cy="15.6" r="6.6" fill={author.color} />
      <path d="M7.6 33.2c1.9-5.6 6.7-8.6 12.4-8.6s10.5 3 12.4 8.6A19.9 19.9 0 0 1 20 40a19.9 19.9 0 0 1-12.4-6.8z" fill={author.color} />
    </svg>
  );
}

/**
 * Static map snapshot in the Apple Maps look WhatsApp iOS uses for shared
 * locations: tilted street grid with white streets on beige land, a yellow
 * arterial, a park and a pond; red pin (or the sender's photo for live).
 */
function MapArt({ w, h, dark, live }: { w: number; h: number; dark: boolean; live?: boolean }) {
  const c = dark
    ? { land: "#2c2c2e", block: "#323235", park: "#26392b", water: "#1d3047", edge: "#232325", road: "#47474b", major: "#7a6a3e", majorEdge: "#58502f" }
    : { land: "#f4f1ea", block: "#ece8df", park: "#cde9c0", water: "#a6d1f4", edge: "#e2ddd2", road: "#ffffff", major: "#fbd77a", majorEdge: "#ecbd4e" };
  const cx = w / 2;
  const cy = h / 2;
  const hs: number[] = [];
  const vs: number[] = [];
  for (let k = -5; k <= 5; k++) {
    hs.push(cy + k * 33 + 9);
    vs.push(cx + k * 44 - 14);
  }
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: "block" }}>
      <rect width={w} height={h} fill={c.land} />
      <g transform={`rotate(-17 ${cx} ${cy})`}>
        {hs.slice(0, -1).map((y, i) =>
          vs.slice(0, -1).map((x, j) =>
            (i * 3 + j) % 4 === 1 ? null : (
              <rect key={`${i}-${j}`} x={x + 5} y={y + 5} width={34} height={23} rx={2} fill={c.block} />
            ),
          ),
        )}
        <rect x={vs[6] + 4} y={hs[3] + 4} width={80} height={58} rx={4} fill={c.park} />
        <ellipse cx={vs[6] + 52} cy={hs[3] + 40} rx={14} ry={9} fill={c.water} />
        <path d={`M${vs[0] - 60} ${hs[8] + 20} C ${vs[3]} ${hs[6]}, ${vs[5]} ${hs[6] + 10}, ${vs[10] + 60} ${hs[3]}`} fill="none" stroke={c.water} strokeWidth={14} />
        {hs.map((y) => (
          <line key={`h${y}`} x1={-w} x2={2 * w} y1={y} y2={y} stroke={c.edge} strokeWidth={6.5} />
        ))}
        {vs.map((x) => (
          <line key={`v${x}`} x1={x} x2={x} y1={-h} y2={2 * h} stroke={c.edge} strokeWidth={6.5} />
        ))}
        {hs.map((y) => (
          <line key={`hr${y}`} x1={-w} x2={2 * w} y1={y} y2={y} stroke={c.road} strokeWidth={4.5} />
        ))}
        {vs.map((x) => (
          <line key={`vr${x}`} x1={x} x2={x} y1={-h} y2={2 * h} stroke={c.road} strokeWidth={4.5} />
        ))}
        <line x1={-w} x2={2 * w} y1={hs[5] + 0} y2={hs[5]} stroke={c.majorEdge} strokeWidth={9} />
        <line x1={-w} x2={2 * w} y1={hs[5]} y2={hs[5]} stroke={c.major} strokeWidth={7} />
        <line x1={vs[4]} x2={vs[4]} y1={-h} y2={2 * h} stroke={c.majorEdge} strokeWidth={9} />
        <line x1={vs[4]} x2={vs[4]} y1={-h} y2={2 * h} stroke={c.major} strokeWidth={7} />
      </g>
      {live ? null : (
        <g transform={`translate(${cx} ${cy + 12})`}>
          <ellipse cx={0} cy={0} rx={4.5} ry={1.8} fill="#000" fillOpacity={0.28} />
          <path d="M0 0V-17" stroke="#8a8a8e" strokeWidth={1.8} strokeLinecap="round" />
          <circle cy={-23} r={8} fill="#ff3b30" stroke="#c9241b" strokeWidth={0.8} />
          <circle cx={-2.6} cy={-25.6} r={2.4} fill="#ffffff" fillOpacity={0.6} />
        </g>
      )}
    </svg>
  );
}

/** Document type badge (PDF red, Word blue, Excel green, …). */
function docKind(name: string): { ext: string; color: string } {
  const ext = (name.split(".").pop() || "").toLowerCase();
  const color =
    ext === "pdf"
      ? "#e5252a"
      : ext === "doc" || ext === "docx"
        ? "#2b579a"
        : ext === "xls" || ext === "xlsx" || ext === "csv"
          ? "#1d7044"
          : ext === "ppt" || ext === "pptx"
            ? "#d24625"
            : "#7c8b96";
  return { ext: ext.toUpperCase() || "FILE", color };
}

function DocIcon({ name }: { name: string }) {
  const { ext, color } = docKind(name);
  return (
    <svg width="26" height="32" viewBox="0 0 26 32" className="shrink-0" style={{ display: "block" }}>
      <path d="M3.5 0H17l9 9v19.5a3.5 3.5 0 0 1-3.5 3.5h-19A3.5 3.5 0 0 1 0 28.5v-25A3.5 3.5 0 0 1 3.5 0z" fill={color} />
      <path d="M17 0l9 9h-6a3 3 0 0 1-3-3z" fill="#ffffff" fillOpacity={0.45} />
      <text x="13" y="25" textAnchor="middle" fontSize={ext.length > 3 ? 6 : 7.2} fontWeight={700} fill="#ffffff" fontFamily="system-ui, sans-serif">
        {ext.slice(0, 4)}
      </text>
    </svg>
  );
}

/** First-page thumbnail of a PDF (a generic invoice-like page). */
function PdfPage({ w, h }: { w: number; h: number }) {
  const lines = [0.62, 0.88, 0.8, 0.92, 0.55, 0.85, 0.74, 0.9];
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: "block" }}>
      <rect width={w} height={h} fill="#ffffff" />
      <rect x={20} y={16} width={56} height={9} rx={1.5} fill="#e5252a" fillOpacity={0.75} />
      <rect x={w - 86} y={16} width={66} height={5} rx={1} fill="#c9ccd0" />
      <rect x={w - 70} y={24} width={50} height={4} rx={1} fill="#dfe1e4" />
      {lines.map((f, i) => (
        <rect key={i} x={20} y={38 + i * 9} width={(w - 40) * f} height={4} rx={1} fill={i === 3 ? "#b9bdc2" : "#dfe1e4"} />
      ))}
    </svg>
  );
}

/** Call-entry glyph: SF phone.fill / video.fill with the incoming/outgoing arrow. */
function CallIcon({ video, missed, mine, color }: { video: boolean; missed: boolean; mine: boolean; color: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" style={{ display: "block", direction: "ltr" }}>
      {video ? (
        <path d="M3.5 6.2h10.6a2.4 2.4 0 0 1 2.4 2.4v6.8a2.4 2.4 0 0 1-2.4 2.4H3.5a2.4 2.4 0 0 1-2.4-2.4V8.6a2.4 2.4 0 0 1 2.4-2.4zM17.6 10.3l4-2.7c.6-.4 1.3 0 1.3.7v7.4c0 .7-.7 1.1-1.3.7l-4-2.7z" fill={color} />
      ) : (
        <path d="M6.6 2.4c.5 0 .9.3 1.1.7l1.6 3.6c.2.5.1 1-.3 1.4L7.3 9.8c1.2 2.6 3.4 4.8 6 6l1.7-1.7c.4-.4.9-.5 1.4-.3l3.6 1.6c.4.2.7.6.7 1.1v2.9c0 1.1-.9 2-2 2C9.9 21.4 2.6 14.1 2.6 4.4c0-1.1.9-2 2-2z" fill={color} />
      )}
      {missed && !video && <path d="M14.6 3.2 20.4 9M20.4 4.6V9h-4.4" stroke={color} strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />}
      {!missed && !video && (
        <path d={mine ? "M15 9l5.6-5.6M16.4 3.4h4.2v4.2" : "M20.6 3.4 15 9M15 4.8V9h4.2"} stroke={color} strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      )}
    </svg>
  );
}

/** WhatsApp's deleted-message glyph (a circle with a slash). */
function BlockGlyph({ color }: { color: string }) {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" style={{ display: "inline-block", verticalAlign: "-2.5px", flexShrink: 0 }}>
      <circle cx="8" cy="8" r="6.4" fill="none" stroke={color} strokeWidth="1.5" />
      <path d="M3.6 12.4 12.4 3.6" stroke={color} strokeWidth="1.5" />
    </svg>
  );
}

/** Emoji drawn as a die-cut sticker (white outline + soft shadow). */
function StickerArt({ m, size }: { m: Message; size: number }) {
  if (m.imageSrc) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={m.imageSrc} alt="" width={size} height={size} draggable={false} style={{ width: size, height: size, objectFit: "contain", display: "block" }} />
    );
  }
  const glyphs = m.text.trim() || "🙂";
  const n = Math.max(1, Math.min(3, Array.from(glyphs).filter((g) => /\p{Extended_Pictographic}/u.test(g)).length));
  return (
    <div
      className="flex items-center justify-center"
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * (n === 1 ? 0.72 : n === 2 ? 0.44 : 0.31)),
        lineHeight: 1,
        whiteSpace: "nowrap",
        filter:
          "drop-shadow(2.5px 0 0 #fff) drop-shadow(-2.5px 0 0 #fff) drop-shadow(0 2.5px 0 #fff) drop-shadow(0 -2.5px 0 #fff) drop-shadow(0 1.5px 2px rgba(0,0,0,0.22))",
      }}
    >
      {glyphs}
    </div>
  );
}

/* ======================================================================
   Component
   ====================================================================== */

export function WhatsApp({ scenario, playback, lang, rtl }: PlatformProps) {
  const dark = scenario.theme === "dark";
  const p = dark ? DARK : LIGHT;
  const c = CHROME[lang];
  const e2e = WA_E2E[lang];
  const uiDir = rtl ? "rtl" : "ltr";
  const { messages, typing } = playback;
  const live = playback.isLive;
  const clockMs = playback.clockMs;
  const scrollRef = useChatScroll<HTMLDivElement>(`${messages.length}-${typing}`);
  const s = WA_STR[lang];

  // OS keyboard: the chat bar rides KB_GAP above it, the thread's viewport
  // shrinks with it (both continuous in the inset, so export frames match)
  const kb = useKeyboardInset();
  const barBottom = Math.max(COMPOSER_BOTTOM, kb.inset + KB_GAP);
  const listBottom = barBottom - COMPOSER_BOTTOM;
  const kbTrans = (prop: string) => (kb.transition === "none" ? undefined : `${prop} ${kb.transition}`);

  // group chat: members, authors, runs per author, who is typing
  const group = scenario.group && scenario.group.members.length ? scenario.group : null;
  const memberAt = (idx: number): Author | null => {
    if (!group) return null;
    const n = group.members.length;
    const i = ((idx % n) + n) % n;
    return { index: i, person: group.members[i], color: memberColor(i, dark) };
  };
  const authorOf = (m: Message): Author | null => (m.sender === "them" ? memberAt(m.authorIndex ?? 0) : null);
  const sameRun = (a?: Message, b?: Message) =>
    !!a && !!b && a.sender === b.sender && (!group || a.sender === "me" || (a.authorIndex ?? 0) === (b.authorIndex ?? 0));
  const shown = new Set(messages.map((m) => m.id));
  const nextThem = scenario.messages.find((m) => !shown.has(m.id) && m.sender === "them");
  const typer = group ? memberAt(nextThem?.authorIndex ?? 0) : null;

  const subtitle = group
    ? typing || scenario.presence === "typing"
      ? s.isTyping(typer?.person.name ?? "")
      : [...group.members.map((x) => x.name), s.you].join(s.listSep)
    : waPresence(typing, scenario.presence, scenario.lastSeenText, c.online, c.typing);
  const lastMsg = messages.length ? messages[messages.length - 1] : undefined;
  // the typing bubble continues the last run when the same person is typing
  const typingContinues =
    !!lastMsg && lastMsg.sender === "them" && (!group || authorOf(lastMsg)?.index === typer?.index);
  const byId = new Map(scenario.messages.map((m) => [m.id, m] as const));

  // compose typing: the draft replaces the (empty) field; with text in it the
  // camera + mic give way to the green send button
  const draft = playback.draft;
  const hasText = !!draft && draft.text.length > 0;
  const draftDir = draft && draft.text ? dirOf(draft.text) : uiDir;

  // The floating chat bar grows with a multi-line draft: grow the thread's
  // bottom inset with it (like the real content inset) and keep the latest
  // message in view.
  const barRef = useRef<HTMLDivElement>(null);
  const spacerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const bar = barRef.current;
    const spacer = spacerRef.current;
    const el = scrollRef.current;
    if (!bar || !spacer || !el) return;
    // pinned = the newest message is in view; kept across viewport resizes
    // (the keyboard shrinking the thread) so the latest message stays visible
    let pinned = true;
    const onScroll = () => {
      pinned = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
    };
    const ro = new ResizeObserver(() => {
      const extra = Math.max(0, Math.round(bar.offsetHeight - CTL));
      if (spacer.offsetHeight !== extra) spacer.style.height = `${extra}px`;
      if (pinned) el.scrollTop = el.scrollHeight;
    });
    el.addEventListener("scroll", onScroll, { passive: true });
    ro.observe(bar);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", onScroll);
      ro.disconnect();
    };
  }, [scrollRef]);

  const glassCircle: CSSProperties = {
    ...p.glass,
    width: CTL,
    height: CTL,
    borderRadius: CTL / 2,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  };

  return (
    <div
      className="relative h-full w-full overflow-hidden"
      style={{
        backgroundColor: p.wall,
        backgroundImage: p.doodle,
        backgroundSize: "240px 240px",
        color: p.text,
      }}
    >
      <style>{MOTION_CSS}</style>

      {/* Scrolling thread (runs under the transparent header and the floating chat bar) */}
      <div
        ref={scrollRef}
        className="rcss-scroll absolute inset-x-0 top-0 overflow-y-auto"
        style={{ bottom: listBottom, transition: kbTrans("bottom"), paddingTop: TOP_PAD, paddingBottom: BOTTOM_PAD }}
      >
        {/* Date chip */}
        <div className="flex justify-center" style={{ padding: "4px 0 8px" }}>
          <span
            style={{
              background: p.chip,
              color: p.chipText,
              fontSize: 12,
              fontWeight: 600,
              lineHeight: "18px",
              height: 18,
              minWidth: 96,
              textAlign: "center",
              padding: "0 14px",
              borderRadius: 9,
              letterSpacing: -0.1,
              boxShadow: dark ? "0 0 0 0.5px rgba(255,255,255,0.06)" : "0 0.5px 1px rgba(0,0,0,0.08)",
            }}
          >
            {c.today}
          </span>
        </div>

        {/* End-to-end encryption notice */}
        <div className="flex justify-center" style={{ padding: "0 36px 10px" }}>
          <div
            className="text-center"
            style={{
              background: p.e2e,
              color: p.e2eText,
              fontSize: 12.5,
              lineHeight: "16px",
              padding: "6px 12px 7px",
              borderRadius: 10,
              boxShadow: dark ? "none" : "0 0.5px 1px rgba(11,20,26,0.08)",
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
            const firstOfGroup = !sameRun(messages[i - 1], m);
            const lastOfGroup = !sameRun(m, messages[i + 1]);
            // the typing bubble continues the incoming run, so it takes the tail
            const tail = lastOfGroup && !(typing && typingContinues && i === messages.length - 1);
            const author = group ? authorOf(m) : null;
            const quote = m.replyToId ? (byId.get(m.replyToId) ?? null) : null;
            const quoteAuthor = quote && group ? authorOf(quote) : null;
            return (
              <Row
                key={m.id}
                m={m}
                p={p}
                rtl={rtl}
                uiDir={uiDir}
                firstOfGroup={firstOfGroup}
                tail={tail}
                status={playback.statusOf(m)}
                person={m.sender === "me" ? scenario.me : (author?.person ?? scenario.them)}
                live={live}
                quote={quote}
                lang={lang}
                themName={quoteAuthor?.person.name ?? scenario.them.name}
                themColor={quoteAuthor?.color}
                author={author}
                showName={!!author && firstOfGroup}
                showAvatar={!!author && tail}
                dark={dark}
              />
            );
          })}

          {typing && (
            <div
              className={`flex justify-start ${enterClass(live, false, rtl)}`}
              style={{
                paddingInline: `${typer ? AV_START : SIDE}px ${SIDE}px`,
                marginTop: typingContinues ? 3 : 8,
                transformOrigin: `${rtl ? "right" : "left"} bottom`,
              }}
            >
              {typer && (
                <div className="shrink-0 self-end" style={{ width: AV, marginInlineEnd: AV_GAP }}>
                  <MemberAvatar author={typer} size={AV} dark={dark} />
                </div>
              )}
              <div className="relative" style={{ filter: p.bubbleShadow }}>
                <Tail side={rtl ? "right" : "left"} color={p.inBubble} />
                <div
                  className="relative flex items-center"
                  style={{ background: p.inBubble, borderRadius: R, height: 37, padding: "0 14px", gap: 4 }}
                >
                  {[0, 1, 2].map((d) => {
                    const s =
                      clockMs !== undefined ? dotAt((clockMs - d * 200) / DOT_MS) : null;
                    return (
                      <span
                        key={d}
                        className={`block rounded-full ${s ? "" : "wa-ios-dot"}`}
                        style={{
                          width: 8,
                          height: 8,
                          background: p.dot,
                          animationDelay: s ? undefined : `${d * 0.2}s`,
                          opacity: s ? s.opacity : undefined,
                          transform: s ? `scale(${s.scale})` : undefined,
                        }}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
        <div ref={spacerRef} aria-hidden style={{ height: 0 }} />
      </div>

      {/* Top: scroll-edge fade + status bar + floating header */}
      <div className="pointer-events-none absolute inset-x-0 top-0" style={{ zIndex: 10 }}>
        <div
          className="absolute inset-x-0 top-0"
          style={{
            height: STATUS_H + HEADER_H + 30,
            background: edgeFade(p.wallRgb, "to bottom", 0.98),
          }}
        />
        <div className="relative">
          <StatusBar device={scenario.device} tint={dark ? "light" : "dark"} background="transparent" />
          <div className="flex items-center" style={{ height: HEADER_H, paddingInline: SIDE }}>
            <div style={glassCircle}>
              <Chevron color={p.icon} />
            </div>
            <div style={{ marginInlineStart: 10 }}>
              {group ? (
                <GroupAvatar src={group.avatar} size={CTL} pal={p} />
              ) : (
                <WaAvatar person={scenario.them} size={CTL} pal={p} />
              )}
            </div>
            <div className="min-w-0 flex-1" style={{ paddingInline: "9px 6px" }}>
              <div
                className="truncate"
                style={{ fontSize: 17, lineHeight: "21px", fontWeight: 600, color: p.ink, letterSpacing: -0.43 }}
              >
                {group ? group.name : scenario.them.name}
              </div>
              {subtitle && (
                <div
                  className="truncate"
                  style={{ fontSize: 13, lineHeight: "16px", color: p.sub, letterSpacing: -0.15 }}
                >
                  {subtitle}
                </div>
              )}
            </div>
            <div
              className="flex items-center justify-between"
              style={{ ...p.glass, height: CTL, width: 84, borderRadius: CTL / 2, paddingInline: 13, flexShrink: 0 }}
            >
              <VideoGlyph color={p.icon} />
              <PhoneGlyph color={p.icon} />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom: scroll-edge fade + floating chat bar + home indicator */}
      {/* home indicator (above the fade; gone while the keyboard is up) */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0" style={{ zIndex: 11 }}>
        <SystemBottomBar device={scenario.device} bg="transparent" fg={p.home} />
      </div>
      <div
        className="pointer-events-none absolute inset-x-0"
        style={{ zIndex: 10, bottom: barBottom, transition: kbTrans("bottom") }}
      >
        <div
          className="absolute inset-x-0"
          style={{
            // grows with a multi-line chat bar (30pt of fade above the bar) and
            // always reaches the screen bottom
            top: -30,
            bottom: -barBottom,
            transition: kbTrans("bottom"),
            background: edgeFade(p.wallRgb, "to top", 0.85),
          }}
        />
        <div ref={barRef} className="relative flex items-end" style={{ minHeight: CTL, paddingInline: 14 }}>
          <div style={glassCircle}>
            <PlusGlyph color={p.icon} />
          </div>
          {/* the field: a glass capsule that grows to 5 lines, then scrolls (latest line in view) */}
          <div
            className="flex min-w-0 flex-1 items-end"
            style={{ ...p.glass, minHeight: CTL, borderRadius: CTL / 2, marginInline: hasText ? "10px 10px" : "10px 8px" }}
          >
            <div
              className="flex min-w-0 flex-1 flex-col justify-end overflow-hidden"
              style={{ maxHeight: 5 * 22 + 16, padding: "8px 0", paddingInlineStart: 13 }}
            >
              {draft && (
                <div
                  dir={draftDir}
                  className="whitespace-pre-wrap break-words"
                  style={{ fontSize: 17, lineHeight: "22px", letterSpacing: -0.43, color: p.text, textAlign: "start" }}
                >
                  {draft.text}
                  <Caret p={p} clockMs={clockMs} k={draft.text.length} />
                </div>
              )}
            </div>
            <div className="flex shrink-0 items-center" style={{ height: CTL, paddingInline: "6px 10px" }}>
              <StickerGlyph color={p.icon} />
            </div>
          </div>
          {!hasText && (
            <div style={glassCircle}>
              <CameraGlyph color={p.icon} />
            </div>
          )}
          <div
            style={{
              ...glassCircle,
              ...{ background: p.green, boxShadow: "0 3px 10px rgba(0,0,0,0.12)" },
              marginInlineStart: hasText ? 0 : 6,
            }}
          >
            {hasText ? <SendGlyph color={p.onGreen} flip={rtl} /> : <MicGlyph color={p.onGreen} />}
          </div>
        </div>
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
  firstOfGroup,
  tail,
  status,
  person,
  live,
  quote,
  lang,
  themName,
  themColor,
  author,
  showName,
  showAvatar,
  dark,
}: {
  m: Message;
  p: Pal;
  rtl: boolean;
  uiDir: "rtl" | "ltr";
  firstOfGroup: boolean;
  tail: boolean;
  status: DeliveryStatus;
  person: Person;
  live: boolean;
  quote: Message | null;
  lang: Lang;
  themName: string;
  themColor?: string;
  /** group chats: the member who wrote this incoming message */
  author: Author | null;
  showName: boolean;
  showAvatar: boolean;
  dark: boolean;
}) {
  const s = WA_STR[lang];
  const mine = m.sender === "me";
  const onRight = mine ? !rtl : rtl;
  const bg = mine ? p.outBubble : p.inBubble;
  const metaColor = mine ? p.metaOut : p.metaIn;
  const isImage = m.type === "image";
  const isVoice = m.type === "voice";
  const isText = m.type === "text";
  const caption = isImage ? m.text.trim() : "";
  const textDir = dirOf(m.text);
  // a reply always gets a bubble (the quote lives inside it)
  const jumbo = isText && !quote && !m.link ? jumboCount(m.text) : 0;
  const reaction = m.reaction?.trim() || "";
  const deleted = m.type === "deleted";

  const meta = (overlay: boolean, color = metaColor) => (
    <span className="inline-flex items-center whitespace-nowrap" dir={uiDir} style={{ gap: 4 }}>
      {m.edited && !deleted && (
        <span style={{ fontSize: 11, lineHeight: "13px", color: overlay ? "#ffffff" : color }}>{s.edited}</span>
      )}
      <span
        className="inline-flex items-center whitespace-nowrap"
        style={{
          fontSize: 11,
          lineHeight: "13px",
          gap: 4,
          color: overlay ? "#ffffff" : color,
          fontVariantNumeric: "tabular-nums",
          textShadow: overlay ? "0 0 4px rgba(0,0,0,0.35)" : undefined,
          direction: "ltr",
        }}
      >
        {m.time}
        {mine && !deleted && <WaTicks status={status} color={overlay ? "#ffffff" : color} readColor={p.read} width={16} />}
      </span>
    </span>
  );
  // spacer reserved at the end of the last text line for the meta block
  const reserve =
    waMetaWidth(m.time, mine && !deleted, 6.6, 16) + (mine ? 0 : 2) + (m.edited && !deleted ? Math.ceil(s.edited.length * 6.1) + 4 : 0);
  const metaEnd = mine ? 9 : 12;

  const rowStyle: CSSProperties = {
    paddingInline: `${author ? AV_START : SIDE}px ${SIDE}px`,
    marginTop: firstOfGroup ? 8 : 3,
    // the reaction pill hangs below the bubble and pushes the next row down
    paddingBottom: reaction ? PILL_H - PILL_OVERLAP : 0,
    transformOrigin: `${onRight ? "right" : "left"} bottom`,
  };
  const rowClass = `flex ${mine ? "justify-end" : "justify-start"} ${enterClass(live, mine, rtl)}`;
  const pill = reaction ? <ReactionPill emoji={reaction} p={p} onRight={onRight} /> : null;
  const quoteEl = quote ? (
    <Quote target={quote} p={p} inMine={mine} lang={lang} themName={themName} themColor={themColor} uiDir={uiDir} />
  ) : null;
  // group chats: the member photo sits beside the last bubble of a run
  const row = (node: ReactNode) => (
    <div data-mid={m.id} data-sender={m.sender} className={rowClass} style={rowStyle}>
      {author && (
        <div className="shrink-0 self-end" style={{ width: AV, marginInlineEnd: AV_GAP }}>
          {showAvatar && <MemberAvatar author={author} size={AV} dark={dark} />}
        </div>
      )}
      {node}
    </div>
  );
  // the coloured sender name that opens the first bubble of a run
  const nameText = showName && author ? author.person.name : "";
  const nameLine = (pad: string) =>
    nameText ? (
      <div
        className="truncate"
        dir={uiDir}
        style={{
          fontSize: 14,
          lineHeight: "18px",
          fontWeight: 600,
          letterSpacing: -0.15,
          color: author?.color,
          textAlign: "start",
          padding: pad,
        }}
      >
        {nameText}
      </div>
    ) : null;
  // bubble-less kinds (jumbo emoji, stickers) carry the name in a small chip
  const nameChip = nameText ? (
    <span
      className="truncate"
      style={{
        alignSelf: "flex-start",
        maxWidth: 220,
        background: bg,
        borderRadius: 10,
        padding: "2px 8px",
        marginBottom: 3,
        fontSize: 13,
        lineHeight: "16px",
        fontWeight: 600,
        color: author?.color,
        filter: p.bubbleShadow,
      }}
    >
      {nameText}
    </span>
  ) : null;

  /* --- emoji-only and stickers: big, no bubble, time in a small pill under it --- */
  if (jumbo || m.type === "sticker") {
    return row(
      <div className="relative flex flex-col" style={{ alignItems: "flex-end" }}>
        {nameChip}
        {jumbo ? (
          <span style={{ fontSize: JUMBO_SIZE[jumbo], lineHeight: 1.18, letterSpacing: 2, paddingInline: 2 }}>
            {m.text.trim()}
          </span>
        ) : (
          <StickerArt m={m} size={STICKER} />
        )}
        <span
          style={{
            background: bg,
            borderRadius: 10,
            padding: "2px 7px",
            marginTop: 1,
            filter: p.bubbleShadow,
          }}
        >
          {meta(false)}
        </span>
        {pill}
      </div>,
    );
  }

  /* --- frameless photo (no caption, not a reply, no sender name) --- */
  if (isImage && !caption && !quote && !nameText) {
    return row(
        <div className="relative">
          <div className="relative overflow-hidden" dir={uiDir} style={{ width: IMG_W, borderRadius: R, background: bg }}>
            <Photo m={m} dark={p === DARK} />
            <span
              className="pointer-events-none absolute inset-x-0 bottom-0"
              style={{ height: 40, background: "linear-gradient(to top, rgba(0,0,0,0.32), rgba(0,0,0,0))" }}
            />
            <span className="absolute" style={{ bottom: 6, insetInlineEnd: mine ? 8 : 11 }}>
              {meta(true)}
            </span>
          </div>
          {pill}
        </div>,
    );
  }

  let body: ReactNode;
  let padding: string | number = "7px 12px 8px";
  let dir: "rtl" | "ltr" = textDir;
  let width: number | undefined;
  const subColor = mine ? p.quoteSnippetOut : p.quoteSnippetIn;
  const innerFill = mine ? p.quoteOut : p.quoteIn;

  if (m.type === "location" || m.type === "file") {
    // cards: 4pt inner padding, the media block concentric with the bubble
    dir = uiDir;
    padding = 4;
    width = CARD_W;
    const loc = m.location;
    const file = m.file;
    const kind = file ? docKind(file.name) : null;
    // each part isolated so "245 KB" / "PDF" keep their order inside the Arabic UI
    const metaLine = file
      ? [file.pages, file.size, kind?.ext]
          .filter(Boolean)
          .map((part, i) => (
            <span key={i}>
              {i > 0 && " • "}
              <bdi>{part}</bdi>
            </span>
          ))
      : null;
    body =
      m.type === "location" ? (
        <>
          {nameLine("2px 8px 4px")}
          {quoteEl && <div style={{ marginBottom: 4 }}>{quoteEl}</div>}
          <div className="relative overflow-hidden" style={{ borderRadius: R - 5, height: 150 }}>
            <MapArt
              w={CARD_W - 8}
              h={150}
              dark={dark}
              live={!!loc?.live}
            />
            {loc?.live && (
              <span
                className="absolute rounded-full"
                style={{ left: "50%", top: "50%", transform: "translate(-50%,-50%)", padding: 3, background: "#ffffff", boxShadow: "0 1px 4px rgba(0,0,0,0.3)" }}
              >
                <WaAvatar person={person} size={34} pal={p} />
              </span>
            )}
          </div>
          <div className="relative" style={{ padding: "6px 8px 4px" }}>
            {loc?.live && (
              <div style={{ fontSize: 15, lineHeight: "20px", fontWeight: 600, color: p.text, letterSpacing: -0.24 }}>
                {s.liveLocation}
              </div>
            )}
            <div dir="auto" style={{ fontSize: 15, lineHeight: "20px", fontWeight: loc?.live ? 400 : 500, color: loc?.live ? subColor : p.text, letterSpacing: -0.24, textAlign: "start" }}>
              {loc?.title || s.location}
            </div>
            <div dir="auto" style={{ fontSize: 13, lineHeight: "17px", color: subColor, letterSpacing: -0.08, textAlign: "start" }}>
              {loc?.subtitle}
              <span style={{ display: "inline-block", width: reserve, height: 1 }} />
            </div>
            <span className="absolute" style={{ bottom: 4, insetInlineEnd: metaEnd - 4 }}>
              {meta(false)}
            </span>
          </div>
        </>
      ) : (
        <>
          {nameLine("2px 8px 4px")}
          {quoteEl && <div style={{ marginBottom: 4 }}>{quoteEl}</div>}
          <div className="overflow-hidden" style={{ borderRadius: R - 5 }}>
            {kind?.ext === "PDF" && <PdfPage w={CARD_W - 8} h={96} />}
            <div className="flex items-center" style={{ background: innerFill, padding: "10px 12px 10px 10px", gap: 10 }}>
              <DocIcon name={file?.name ?? ""} />
              <div
                dir="auto"
                className="min-w-0 flex-1"
                style={{
                  fontSize: 15,
                  lineHeight: "19px",
                  color: p.text,
                  letterSpacing: -0.24,
                  overflow: "hidden",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  wordBreak: "break-all",
                  textAlign: "start",
                }}
              >
                {file?.name}
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between" style={{ padding: "5px 5px 2px 6px", gap: 8 }}>
            <span className="truncate" style={{ fontSize: 12, lineHeight: "15px", color: subColor }}>
              {metaLine}
            </span>
            {meta(false)}
          </div>
        </>
      );
  } else if (m.type === "call") {
    const k = m.call ?? { video: false, missed: false };
    const title = k.missed && !mine ? (k.video ? s.missedVideo : s.missedVoice) : k.video ? s.videoCall : s.voiceCall;
    const sub = k.missed ? (mine ? s.noAnswer : s.tapToCallBack) : k.duration || s.noAnswer;
    const red = dark ? "#ff6b6b" : "#ea0038";
    dir = uiDir;
    padding = "8px 12px 8px 8px";
    body = (
      <>
        {nameLine("0 4px 6px")}
        <div className="flex items-center" style={{ gap: 10, minWidth: 214 }}>
          <span
            className="flex shrink-0 items-center justify-center rounded-full"
            style={{ width: 38, height: 38, background: dark ? "rgba(255,255,255,0.1)" : "rgba(11,20,26,0.06)" }}
          >
            <CallIcon video={k.video} missed={k.missed} mine={mine} color={k.missed ? red : p.text} />
          </span>
          <div className="min-w-0">
            <div style={{ fontSize: 16, lineHeight: "21px", fontWeight: 600, letterSpacing: -0.3, color: p.text }}>{title}</div>
            <div style={{ fontSize: 14, lineHeight: "18px", color: subColor, letterSpacing: -0.15, direction: uiDir }}>
              {sub}
              <span style={{ display: "inline-block", width: reserve, height: 1 }} />
            </div>
          </div>
        </div>
        <span className="absolute" style={{ bottom: 7, insetInlineEnd: metaEnd }}>
          {meta(false)}
        </span>
      </>
    );
  } else if (deleted) {
    dir = uiDir;
    body = (
      <>
        {nameLine("0 0 1px")}
        <span style={{ fontSize: 17, lineHeight: "22px", letterSpacing: -0.43, fontStyle: uiDir === "rtl" ? "normal" : "italic", color: subColor }}>
          <BlockGlyph color={subColor} /> {mine ? s.deletedMine : s.deleted}
        </span>
        <span style={{ display: "inline-block", width: reserve, height: 1 }} />
        <span className="absolute" style={{ bottom: 4, insetInlineEnd: metaEnd }}>
          {meta(false)}
        </span>
      </>
    );
  } else if (isVoice) {
    dir = uiDir;
    padding = quote || nameText ? "4px 12px 6px 10px" : "9px 12px 6px 10px";
    body = (
      <>
        {nameLine("2px 0 2px 2px")}
        {quoteEl && <div style={{ margin: "0 -8px 7px -6px" }}>{quoteEl}</div>}
        <Voice m={m} p={p} mine={mine} status={status} person={person} meta={meta(false)} />
      </>
    );
  } else if (isImage) {
    padding = 0;
    dir = caption ? textDir : uiDir;
    // a reply with a photo: quote on top, the photo inset below it
    body = (
      <div style={{ width: IMG_W }}>
        {nameLine("6px 12px 0")}
        {quoteEl && <div style={{ padding: "4px 4px 0" }}>{quoteEl}</div>}
        <div
          className="relative overflow-hidden"
          style={
            quote || nameText
              ? { margin: "4px 4px 0", borderRadius: caption ? `${R - 5}px ${R - 5}px 0 0` : R - 5, marginBottom: caption ? 0 : 4 }
              : { borderRadius: `${R}px ${R}px 0 0` }
          }
        >
          <Photo m={m} dark={p === DARK} />
          {!caption && (
            <>
              <span
                className="pointer-events-none absolute inset-x-0 bottom-0"
                style={{ height: 40, background: "linear-gradient(to top, rgba(0,0,0,0.32), rgba(0,0,0,0))" }}
              />
              <span className="absolute" style={{ bottom: 6, insetInlineEnd: 8 }}>
                {meta(true)}
              </span>
            </>
          )}
        </div>
        {caption && (
          <div className="relative" style={{ padding: "6px 12px 8px" }}>
            <span className="whitespace-pre-wrap break-words" style={{ fontSize: 17, lineHeight: "22px", letterSpacing: -0.43 }}>
              {caption}
            </span>
            <span style={{ display: "inline-block", width: reserve, height: 1 }} />
            <span className="absolute" style={{ bottom: 4, insetInlineEnd: metaEnd }}>
              {meta(false)}
            </span>
          </div>
        )}
      </div>
    );
  } else {
    const link = m.link ?? null;
    // a link preview stretches the bubble to its max width
    const fullWidth = !!link;
    body = (
      <>
        {nameLine("0 0 2px")}
        {/* quoted reply: 4pt in from the bubble edges, 6pt above the text */}
        {quoteEl && <div style={{ margin: nameText ? "0 -8px 5px" : "-3px -8px 5px" }}>{quoteEl}</div>}
        {link && (
          <div style={{ margin: nameText || quoteEl ? "0 -8px 6px" : "-3px -8px 6px" }}>
            <LinkCard link={link} p={p} mine={mine} uiDir={uiDir} />
          </div>
        )}
        <span className="whitespace-pre-wrap break-words" style={{ fontSize: 17, lineHeight: "22px", letterSpacing: -0.43 }}>
          {linkify(m.text, p.link)}
        </span>
        <span style={{ display: "inline-block", width: reserve, height: 1 }} />
        <span className="absolute" style={{ bottom: 4, insetInlineEnd: metaEnd }}>
          {meta(false)}
        </span>
      </>
    );
    if (fullWidth) width = 307 - (author ? AV_START + AV + AV_GAP - SIDE : 0);
  }

  return row(
    <div className="relative" style={{ maxWidth: author ? "calc(100% - 92px)" : "calc(100% - 54px)" }}>
      <div className="relative" style={{ filter: p.bubbleShadow }}>
        {/* tail first so the bubble content (meta, ticks) paints over it */}
        {tail && <Tail side={onRight ? "right" : "left"} color={bg} />}
        <div
          className="relative"
          dir={dir}
          style={{ background: bg, color: p.text, borderRadius: R, padding, minWidth: 48, width, boxSizing: "border-box" }}
        >
          {body}
        </div>
      </div>
      {pill}
    </div>,
  );
}

/** Link preview block at the top of a text bubble: image, title, description, domain. */
function LinkCard({ link, p, mine, uiDir }: { link: LinkPreview; p: Pal; mine: boolean; uiDir: "rtl" | "ltr" }) {
  const sub = mine ? p.quoteSnippetOut : p.quoteSnippetIn;
  const clamp = (n: number): CSSProperties => ({
    overflow: "hidden",
    display: "-webkit-box",
    WebkitLineClamp: n,
    WebkitBoxOrient: "vertical",
  });
  return (
    <div className="overflow-hidden" dir={uiDir} style={{ background: mine ? p.quoteOut : p.quoteIn, borderRadius: R - 5 }}>
      {link.image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={link.image} alt="" draggable={false} style={{ display: "block", width: "100%", height: 150, objectFit: "cover" }} />
      )}
      <div style={{ padding: "8px 12px 9px" }}>
        <div dir="auto" style={{ ...clamp(2), fontSize: 15, lineHeight: "19px", fontWeight: 600, letterSpacing: -0.24, color: p.text, textAlign: "start" }}>
          {link.title}
        </div>
        {link.description && (
          <div dir="auto" style={{ ...clamp(2), marginTop: 2, fontSize: 14, lineHeight: "18px", letterSpacing: -0.15, color: sub, textAlign: "start" }}>
            {link.description}
          </div>
        )}
        <div dir="ltr" className="truncate" style={{ marginTop: 2, fontSize: 14, lineHeight: "18px", letterSpacing: -0.15, color: sub, textAlign: uiDir === "rtl" ? "right" : "left" }}>
          {siteOf(link)}
        </div>
      </div>
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
        style={{ display: "block", width: "100%", height: "auto", maxHeight: 360, objectFit: "cover" }}
      />
    );
  }
  const fg = dark ? "#5c6063" : "#aeb6bc";
  return (
    <div
      className="flex items-center justify-center"
      style={{ width: "100%", height: 210, background: dark ? "#1f2123" : "#e4e6e8" }}
    >
      <svg width="44" height="44" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="4.5" width="18" height="15" rx="3" stroke={fg} strokeWidth="1.5" />
        <circle cx="9" cy="9.5" r="1.7" fill={fg} />
        <path d="M4 17.5l5-5 4 4 3-3 4.5 4.5" stroke={fg} strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

/** iOS voice note: play | waveform (duration + meta below) | avatar with mic badge. */
function Voice({
  m,
  p,
  mine,
  status,
  person,
  meta,
}: {
  m: Message;
  p: Pal;
  mine: boolean;
  status: DeliveryStatus;
  person: Person;
  meta: ReactNode;
}) {
  const bars = waWaveform(m.id, 32, 3, 22);
  // the mic badge: outgoing turns blue once the recipient played it (≈ read);
  // incoming is green until you play it
  const badge = mine ? (status === "read" ? p.read : p.voiceIdle) : p.voiceUnplayed;
  const wave = mine ? p.waveOut : p.waveIn;
  const play = mine ? p.playOut : p.playIn;
  return (
    <div className="flex items-center" style={{ width: 252, gap: 10 }}>
      {/* the play glyph keeps pointing right in the Arabic UI */}
      <svg width="19" height="22" viewBox="0 0 19 22" className="shrink-0" style={{ direction: "ltr" }}>
        <path d="M2.5 2.4c0-1 1.1-1.6 2-1.1l12.7 8.5c.8.5.8 1.7 0 2.2L4.5 20.6c-.9.5-2-.1-2-1.1z" fill={play} />
      </svg>
      <div className="min-w-0 flex-1">
        <div className="relative flex items-center" style={{ height: 28, gap: 2 }}>
          {bars.map((h, i) => (
            <span key={i} style={{ width: 2.5, height: h, borderRadius: 2, background: wave, flexShrink: 0 }} />
          ))}
          <span
            className="absolute rounded-full"
            style={{ width: 12, height: 12, top: 8, insetInlineStart: -3, background: badge }}
          />
        </div>
        <div className="flex items-center justify-between" style={{ marginTop: 3 }}>
          <span style={{ fontSize: 11, lineHeight: "13px", color: mine ? p.metaOut : p.metaIn, fontVariantNumeric: "tabular-nums" }}>
            {m.voiceDuration || "0:07"}
          </span>
          {meta}
        </div>
      </div>
      <div className="relative shrink-0">
        <WaAvatar person={person} size={46} pal={p} />
        <span className="absolute" style={{ bottom: -2, insetInlineStart: -5 }}>
          <MicBadge color={badge} ring={mine ? p.outBubble : p.inBubble} />
        </span>
      </div>
    </div>
  );
}
