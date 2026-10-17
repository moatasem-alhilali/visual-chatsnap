"use client";

/*
 * Telegram for iOS — chat screen replica (Telegram iOS 12.x, glass design, 2025-2026).
 *
 * Values pulled from the open-source client (TelegramMessenger/Telegram-iOS @ master):
 *  - submodules/TelegramPresentationData/Sources/DefaultDayPresentationTheme.swift
 *      default ("Day Classic") wallpaper: 4-colour gradient #dbddbb #6ba587 #d5d88d #88b884 + doodle pattern (intensity 50)
 *      incoming bubble #ffffff, text #000, date #77828c
 *      outgoing bubble #e1ffc7, date rgba(0,140,9,.8), outgoingCheckColor #19c700
 *      accent (defaultDayAccentColor) #0088ff, nav title #000, nav subtitle #787878
 *      input field: fill white .8, stroke black .1, placeholder black .4, controls #000
 *      voice: incoming accent / inactive #cacaca, outgoing #3fc33b / inactive #93d987
 *  - submodules/TelegramPresentationData/Sources/DefaultDarkPresentationTheme.swift ("Night", accent #3e88f7)
 *      wallpaper: pattern over #598bf6 #7a5eef #d67cff #f38b58 at intensity -34 (inverted, black veil)
 *      incoming bubble #1d1d1d @ .9, outgoing gradient #61bcf9 -> #0088ff, text #fff, dates/checks white(.5)
 *  - submodules/TelegramPresentationData/Sources/ChatMessageBubbleImages.swift
 *      bubble radii main 16 / merged 8 (PresentationChatBubbleSettings.default), tail geometry
 *      (33pt body, bottomEllipse 24,16 27x17 / cut-out ellipse 33,14 23x21) reproduced in BubbleTail below
 *  - ChatTitleView.swift: title 17 semibold, subtitle 13 regular, glass capsule 44pt high, 12pt side inset
 *  - ChatAvatarNavigationNode.swift: 44pt container, avatar inset 3pt
 *  - ChatTextInputPanelNode.swift: attach glass circle 40, field capsule min height 40, gaps 6, side inset 8
 *  - GlassBackgroundComponent.swift (legacy, non iOS 26 fallback): panel fill white .7 (light),
 *      #1c1c1c @ .85 (dark), shadows 0 0 20 black .04 + 0 0 5 black .04
 *  - ChatMessageDateAndStatusNode.swift: date font 11pt, check size 11, second check offset 6
 * The glass blur is intentionally NOT done with backdrop-filter (the exporter snapshots the DOM);
 * a slightly more opaque fill stands in for it.
 */

import type { CSSProperties } from "react";

import type { DeliveryStatus, Message } from "../../types";
import { Avatar, dirOf, SystemBottomBar, useChatScroll } from "../shared";
import { StatusBar } from "../devices/StatusBar";
import { CHROME, type Lang } from "./chrome";
import { groupInfo, type PlatformProps } from "./types";

/* ------------------------------------------------------------------ */
/* Shared Telegram helpers (also used by TelegramAndroid.tsx)          */
/* ------------------------------------------------------------------ */

/** Telegram's own wording for presence (en strings from Telegram, ar from Telegram's Arabic pack). */
export const TG_STRINGS: Record<Lang, { online: string; typing: string; lastSeenRecently: string }> = {
  en: { online: "online", typing: "typing", lastSeenRecently: "last seen recently" },
  ar: { online: "متصل", typing: "يكتب", lastSeenRecently: "آخر ظهور منذ قليل" },
};

/**
 * Line-art doodles approximating Telegram's default chat pattern ("d" slug), laid out on a
 * 240×240 tile. Stroke colour/opacity are injected by the callers.
 */
const DOODLES = [
  '<path transform="translate(18 20) rotate(-12)" d="M0 8 22 0 15 20 10 12ZM10 12 22 0"/>',
  '<path transform="translate(92 14)" d="M10 18C-4 8 2-2 10 5c8-7 14 3 0 13Z"/>',
  '<path transform="translate(160 26) rotate(10)" d="M10 0l2.9 6.9 7.1.7-5.4 4.7 1.6 7.2L10 15.7l-6.2 3.8 1.6-7.2L0 7.6l7.1-.7Z"/>',
  '<g transform="translate(206 70)"><path d="M2 9 3 0l6 5h6l6-5 1 9c1 9-21 9-20 0Z"/><circle cx="8" cy="10" r="1"/><circle cx="16" cy="10" r="1"/></g>',
  '<g transform="translate(40 78)"><path d="M6 16V3l12-3v13"/><circle cx="3.5" cy="16" r="2.6"/><circle cx="15.5" cy="13" r="2.6"/></g>',
  '<path transform="translate(120 70)" d="M14 2a9 9 0 1 0 8 13A7 7 0 0 1 14 2Z"/>',
  '<path transform="translate(150 84) rotate(-8)" d="M0 14 2 3l5 6 4-8 4 8 5-6 2 11Z"/>',
  '<path transform="translate(172 128)" d="M0 11a11 11 0 0 1 22 0ZM11 11v8a2 2 0 0 1-4 0"/>',
  '<g transform="translate(14 140)"><ellipse cx="9" cy="8" rx="7" ry="8.5"/><path d="M9 16.5q-3 4 1 8"/></g>',
  '<g transform="translate(86 132)"><circle cx="10" cy="10" r="2.6"/><circle cx="10" cy="3.5" r="3.4"/><circle cx="16.2" cy="8" r="3.4"/><circle cx="13.8" cy="15.3" r="3.4"/><circle cx="6.2" cy="15.3" r="3.4"/><circle cx="3.8" cy="8" r="3.4"/></g>',
  '<path transform="translate(130 190)" d="M10 0v20M1.3 5l17.4 10M1.3 15 18.7 5M10 0 7.5 2.5M10 0l2.5 2.5M10 20l-2.5-2.5M10 20l2.5-2.5"/>',
  '<path transform="translate(206 186)" d="M2 4h14v8a7 7 0 0 1-14 0ZM16 6h2.5a3 3 0 0 1 0 6H16M6 0v2M11 0v2"/>',
  '<g transform="translate(58 196)"><circle cx="10" cy="10" r="9"/><path d="M6 12.5a5 5 0 0 0 8 0"/><circle cx="7" cy="8" r=".8"/><circle cx="13" cy="8" r=".8"/></g>',
  '<path transform="translate(110 104)" d="M3 9h14L10 24ZM3 9a7 7 0 0 1 14 0"/>',
  '<path transform="translate(8 206)" d="M1 7h18v4H1ZM3 11h14v9H3ZM10 7v13M10 7C7 1 3 3 6 7M10 7c3-6 7-4 4 0"/>',
  '<path transform="translate(190 4)" d="M0 6h12M6 0v12"/>',
  '<path transform="translate(22 104) scale(.6)" d="M10 0l2.9 6.9 7.1.7-5.4 4.7 1.6 7.2L10 15.7l-6.2 3.8 1.6-7.2L0 7.6l7.1-.7Z"/>',
  '<path transform="translate(186 222) scale(.65)" d="M10 18C-4 8 2-2 10 5c8-7 14 3 0 13Z"/>',
  '<path transform="translate(144 146)" d="M0 14C0 4 8 0 16 0c0 8-4 16-14 16ZM0 16 9 7"/>',
  '<circle cx="72" cy="50" r="2"/><circle cx="200" cy="112" r="2.2"/><circle cx="112" cy="226" r="1.8"/><circle cx="60" cy="168" r="1.6"/>',
].join("");

const svgUri = (svg: string) => `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;

/** Doodle tile with darker/lighter strokes (positive intensity wallpapers). */
export function tgPatternUri(stroke: string, opacity: number): string {
  return svgUri(
    `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240" viewBox="0 0 240 240"><g fill="none" stroke="${stroke}" stroke-opacity="${opacity}" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${DOODLES}</g></svg>`,
  );
}

/**
 * Inverted (negative intensity) tile: a black veil with the doodles "cut out" so the gradient
 * underneath only glows through the pattern — how Telegram renders its dark default wallpaper.
 */
export function tgInvertedPatternUri(veilOpacity: number, holeLuminance: string): string {
  return svgUri(
    `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240" viewBox="0 0 240 240"><defs><mask id="m" maskUnits="userSpaceOnUse" x="0" y="0" width="240" height="240"><rect width="240" height="240" fill="#fff"/><g fill="none" stroke="${holeLuminance}" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${DOODLES}</g></mask></defs><rect width="240" height="240" fill="#000" fill-opacity="${veilOpacity}" mask="url(#m)"/></svg>`,
  );
}

/**
 * Telegram's 4-colour "freeform" gradient. Points are the phase-0 positions used by
 * GradientBackgroundNode (iOS) / MotionBackgroundDrawable (Android).
 */
export function tgGradient(c: [string, string, string, string]): string {
  return [
    `radial-gradient(ellipse 75% 55% at 80% 10%, ${c[0]} 0%, transparent 100%)`,
    `radial-gradient(ellipse 70% 50% at 35% 25%, ${c[1]} 0%, transparent 100%)`,
    `radial-gradient(ellipse 75% 50% at 20% 90%, ${c[2]} 0%, transparent 100%)`,
    `radial-gradient(ellipse 70% 50% at 65% 75%, ${c[3]} 0%, transparent 100%)`,
  ].join(", ");
}

/** Full wallpaper style: doodle tile (repeating) over the 4-point gradient (stretched). */
export function tgWallpaper(pattern: string, colors: [string, string, string, string], base: string): CSSProperties {
  return {
    backgroundColor: base,
    backgroundImage: `${pattern}, ${tgGradient(colors)}`,
    backgroundSize: "240px 240px, 100% 100%, 100% 100%, 100% 100%, 100% 100%",
    backgroundRepeat: "repeat, no-repeat, no-repeat, no-repeat, no-repeat",
  };
}

/** Deterministic pseudo-waveform (0..1) so each voice note looks different but stable. */
export function tgWaveform(seed: string, count: number): number[] {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  const out: number[] = [];
  for (let i = 0; i < count; i++) {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h ^= h >>> 13;
    const r = ((h >>> 0) % 1000) / 1000;
    const env = 0.3 + 0.7 * Math.abs(Math.sin((i / count) * Math.PI * 2.2 + 0.7));
    out.push(Math.max(0.08, r * env));
  }
  return out;
}

/** Rough width of the time/check block so text can reserve room on its last line. */
export function metaReserve(time: string, mine: boolean, charW: number, checksW: number): number {
  return Math.ceil(time.length * charW + (mine ? checksW : 0) + 8);
}

function mixHex(a: string, b: string, t: number): string {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ch = (s: number) => Math.round(((pa >> s) & 255) * (1 - t) + ((pb >> s) & 255) * t);
  return `rgb(${ch(16)}, ${ch(8)}, ${ch(0)})`;
}

/* ------------------------------------------------------------------ */
/* iOS theme                                                          */
/* ------------------------------------------------------------------ */

interface IosTheme {
  accent: string;
  text: string;
  inBubble: string;
  inMeta: string;
  outMeta: string;
  outCheck: string;
  navTitle: string;
  navSub: string;
  glassFill: string;
  glassShadow: string;
  glassIcon: string;
  fieldIcon: string;
  placeholder: string;
  datePill: string;
  topFade: string;
  bottomFade: string;
  wallpaper: CSSProperties;
  bubbleFilter: string;
  homeIndicator: string;
  voice: {
    in: { circle: string; glyph: string; active: string; inactive: string; duration: string };
    out: { circle: string; glyph: string; active: string; inactive: string; duration: string };
  };
}

const IOS_LIGHT: IosTheme = {
  accent: "#0088ff",
  text: "#000000",
  inBubble: "#ffffff",
  inMeta: "#77828c",
  outMeta: "rgba(0, 140, 9, 0.8)",
  outCheck: "#19c700",
  navTitle: "#000000",
  navSub: "#787878",
  glassFill: "rgba(255, 255, 255, 0.8)",
  glassShadow:
    "0 0 20px rgba(0,0,0,0.06), 0 0 5px rgba(0,0,0,0.05), inset 0 0 0 0.5px rgba(255,255,255,0.9), 0 0 0 0.5px rgba(0,0,0,0.05)",
  glassIcon: "#000000",
  fieldIcon: "rgba(0, 0, 0, 0.5)",
  placeholder: "rgba(0, 0, 0, 0.4)",
  datePill: "rgba(97, 126, 80, 0.45)",
  topFade: "linear-gradient(to bottom, rgba(245,247,240,0.7) 0%, rgba(245,247,240,0.35) 55%, rgba(245,247,240,0) 100%)",
  bottomFade: "linear-gradient(to top, rgba(245,247,240,0.55) 0%, rgba(245,247,240,0) 100%)",
  wallpaper: tgWallpaper(tgPatternUri("#1d3a17", 0.2), ["#dbddbb", "#6ba587", "#d5d88d", "#88b884"], "#a9c38f"),
  bubbleFilter: "drop-shadow(0 0.6px 0.4px rgba(40, 70, 30, 0.28))",
  homeIndicator: "#000000",
  voice: {
    in: { circle: "#0088ff", glyph: "#ffffff", active: "#0088ff", inactive: "#cacaca", duration: "rgba(82, 82, 82, 0.6)" },
    out: { circle: "#3fc33b", glyph: "#e1ffc7", active: "#3fc33b", inactive: "#93d987", duration: "rgba(0, 140, 9, 0.8)" },
  },
};

const IOS_DARK: IosTheme = {
  accent: "#3e88f7",
  text: "#ffffff",
  // #1d1d1d @ .9 in the theme; kept opaque here so the tail overlap doesn't double the alpha.
  inBubble: "#1c1c1c",
  inMeta: "rgba(255, 255, 255, 0.5)",
  outMeta: "rgba(255, 255, 255, 0.6)",
  outCheck: "#ffffff",
  navTitle: "#ffffff",
  navSub: "rgba(255, 255, 255, 0.5)",
  glassFill: "rgba(28, 28, 28, 0.86)",
  glassShadow: "inset 0 0 0 0.5px rgba(255,255,255,0.1), 0 0 16px rgba(0,0,0,0.25)",
  glassIcon: "#ffffff",
  fieldIcon: "rgba(255, 255, 255, 0.5)",
  placeholder: "rgba(255, 255, 255, 0.48)",
  datePill: "rgba(28, 28, 30, 0.72)",
  topFade: "linear-gradient(to bottom, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.35) 55%, rgba(0,0,0,0) 100%)",
  bottomFade: "linear-gradient(to top, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0) 100%)",
  wallpaper: tgWallpaper(tgInvertedPatternUri(0.9, "#9a9a9a"), ["#598bf6", "#7a5eef", "#d67cff", "#f38b58"], "#000000"),
  bubbleFilter: "none",
  homeIndicator: "#ffffff",
  voice: {
    in: { circle: "#ffffff", glyph: "#262628", active: "#ffffff", inactive: "rgba(255, 255, 255, 0.4)", duration: "rgba(255, 255, 255, 0.5)" },
    out: { circle: "#ffffff", glyph: "#1d8ffd", active: "#ffffff", inactive: "rgba(255, 255, 255, 0.5)", duration: "rgba(255, 255, 255, 0.6)" },
  },
};

/** Outgoing (dark) bubbles use a screen-space gradient #61bcf9 → #0088ff; approximate per bubble. */
function darkOutFill(index: number, count: number): { bg: string; tail: string } {
  const pos = count <= 1 ? 1 : index / (count - 1);
  const t = 0.35 + 0.65 * pos;
  const top = mixHex("#61bcf9", "#0088ff", Math.max(0, t - 0.12));
  const bottom = mixHex("#61bcf9", "#0088ff", t);
  return { bg: `linear-gradient(180deg, ${top}, ${bottom})`, tail: bottom };
}

/* ------------------------------------------------------------------ */
/* Pieces                                                             */
/* ------------------------------------------------------------------ */

const BUBBLE_MAX = 16;
const BUBBLE_MIN = 8;
/** Unread counter shown next to the back chevron (other chats' unread messages). */
const BACK_UNREAD = 5;

/**
 * The Telegram iOS bubble tail, traced from messageBubbleImage(): it sits over the
 * bottom sender-side corner of a 33pt template (here the corner of the real bubble).
 */
function BubbleTail({ side, color }: { side: "left" | "right"; color: string }) {
  return (
    <svg
      width="21.5"
      height="17"
      viewBox="16.5 16 21.5 17"
      aria-hidden
      style={{
        position: "absolute",
        bottom: 0,
        [side]: -5,
        display: "block",
        transform: side === "left" ? "scaleX(-1)" : undefined,
      }}
    >
      <path d="M16.5 16H33v8.5a11.5 10.5 0 0 0 4.74 8.5h-.24Q24 33 24 24.5V25h-7.5Z" fill={color} />
    </svg>
  );
}

function Checks({ status, color }: { status: DeliveryStatus; color: string }) {
  // Telegram has no visible "delivered": one check = sent, two checks = delivered/read.
  if (status === "sent") {
    return (
      <svg width="12" height="10" viewBox="0 0 12 10" fill="none" aria-hidden>
        <path d="M1.2 5.4 4.2 8.4 10.8 1.4" stroke={color} strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg width="17" height="10" viewBox="0 0 17 10" fill="none" aria-hidden>
      <path d="M1.2 5.4 4.2 8.4 10.8 1.4" stroke={color} strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8.6 7.7 9.3 8.4 15.9 1.4" stroke={color} strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Meta({
  time,
  mine,
  status,
  color,
  checkColor,
  overlay,
}: {
  time: string;
  mine: boolean;
  status: DeliveryStatus;
  color: string;
  checkColor: string;
  overlay?: boolean;
}) {
  return (
    // Positioned against the UI direction (inline-end); the time itself always reads LTR.
    <span
      className="pointer-events-none absolute flex whitespace-nowrap"
      style={{
        bottom: overlay ? 8 : 5,
        insetInlineEnd: overlay ? 8 : 10,
        fontSize: 11,
        lineHeight: "13px",
        color: overlay ? "#ffffff" : color,
        ...(overlay
          ? { background: "rgba(0,0,0,0.3)", borderRadius: 999, padding: "2px 6px" }
          : null),
      }}
    >
      <span dir="ltr" className="flex items-center gap-[3px]">
        {time}
        {mine && <Checks status={status} color={overlay ? "#ffffff" : checkColor} />}
      </span>
    </span>
  );
}

function VoiceBody({ m, mine, theme }: { m: Message; mine: boolean; theme: IosTheme }) {
  const v = mine ? theme.voice.out : theme.voice.in;
  const bars = tgWaveform(m.id, 36);
  const progress = 0;
  return (
    <div className="flex items-center gap-[10px]" style={{ width: 216 }}>
      <div
        className="flex shrink-0 items-center justify-center rounded-full"
        style={{ width: 44, height: 44, background: v.circle }}
      >
        <svg width="17" height="19" viewBox="0 0 17 19" aria-hidden style={{ marginInlineStart: 3 }}>
          <path d="M2 1.8v15.4c0 .9 1 1.4 1.7.9l12-7.7c.7-.4.7-1.4 0-1.8l-12-7.7C3 .4 2 .9 2 1.8Z" fill={v.glyph} />
        </svg>
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-[3px]" dir="ltr">
        <div className="flex h-[14px] items-end gap-px">
          {bars.map((b, i) => (
            <span
              key={i}
              style={{
                width: 2,
                height: Math.max(2, Math.round(b * 13)),
                borderRadius: 1,
                background: i < progress ? v.active : v.inactive,
              }}
            />
          ))}
        </div>
        <div className="flex items-center gap-1" style={{ fontSize: 11, color: v.duration }}>
          <span>{m.voiceDuration ?? "0:00"}</span>
          {!mine && <span className="rounded-full" style={{ width: 4, height: 4, background: v.active }} />}
        </div>
      </div>
    </div>
  );
}

function ImagePlaceholder({ dark }: { dark: boolean }) {
  return (
    <div
      className="flex items-center justify-center"
      style={{ width: "100%", height: 200, background: dark ? "#2c2c2e" : "#dfe5e9" }}
    >
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" aria-hidden>
        <rect x="3" y="4" width="18" height="16" rx="3" stroke={dark ? "#636366" : "#9aa7b1"} strokeWidth="1.6" />
        <circle cx="9" cy="10" r="1.8" fill={dark ? "#636366" : "#9aa7b1"} />
        <path d="m4 18 5-5 4 4 3-3 4 4" stroke={dark ? "#636366" : "#9aa7b1"} strokeWidth="1.6" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

function glass(theme: IosTheme, radius: number): CSSProperties {
  return { background: theme.glassFill, boxShadow: theme.glassShadow, borderRadius: radius };
}

/* ------------------------------------------------------------------ */
/* Screen                                                             */
/* ------------------------------------------------------------------ */

export function Telegram({ scenario, playback, lang, rtl }: PlatformProps) {
  const dark = scenario.theme === "dark";
  const t = dark ? IOS_DARK : IOS_LIGHT;
  const c = CHROME[lang];
  const s = TG_STRINGS[lang];
  const { messages, typing } = playback;
  const live = playback.isLive;
  const scrollRef = useChatScroll<HTMLDivElement>(`${messages.length}-${typing}`);

  const showTyping = typing || scenario.presence === "typing";
  const subtitle =
    scenario.presence === "online" ? s.online : scenario.lastSeenText.trim() || s.lastSeenRecently;
  const subtitleAccent = showTyping || scenario.presence === "online";

  const STATUS_H = 54;
  const HEADER_H = 44;

  return (
    <div className="relative h-full w-full overflow-hidden" style={{ ...t.wallpaper, color: t.text }}>
      {/* Messages — scroll underneath the floating glass header and input */}
      <div
        ref={scrollRef}
        className="rcss-scroll absolute inset-0 overflow-y-auto"
        style={{ paddingTop: STATUS_H + HEADER_H + 12, paddingBottom: 82, paddingInline: 8 }}
      >
        <div className="flex justify-center pb-2">
          <span
            className="rounded-full px-2 py-[3px] text-[13px] font-medium leading-[16px] text-white"
            style={{ background: t.datePill }}
          >
            {c.today}
          </span>
        </div>

        <div className="flex flex-col">
          {messages.map((m, i) => {
            const mine = m.sender === "me";
            const { firstOfGroup, lastOfGroup } = groupInfo(messages, i);
            const status = playback.statusOf(m);
            const onRight = mine ? !rtl : rtl;
            const tail = lastOfGroup;
            const textDir = dirOf(m.text);

            // Corner radii per Telegram's MessageBubbleImageNeighbors (sender side is merged).
            const senderTop = firstOfGroup ? BUBBLE_MAX : BUBBLE_MIN;
            const senderBottom = lastOfGroup ? BUBBLE_MAX : BUBBLE_MIN;
            const radius: CSSProperties = onRight
              ? {
                  borderTopLeftRadius: BUBBLE_MAX,
                  borderBottomLeftRadius: BUBBLE_MAX,
                  borderTopRightRadius: senderTop,
                  borderBottomRightRadius: senderBottom,
                }
              : {
                  borderTopRightRadius: BUBBLE_MAX,
                  borderBottomRightRadius: BUBBLE_MAX,
                  borderTopLeftRadius: senderTop,
                  borderBottomLeftRadius: senderBottom,
                };

            let fill = mine ? "#e1ffc7" : t.inBubble;
            let tailFill = fill;
            if (mine && dark) {
              const g = darkOutFill(i, messages.length);
              fill = g.bg;
              tailFill = g.tail;
            }
            const metaColor = mine ? t.outMeta : t.inMeta;
            const isImage = m.type === "image";
            const isVoice = m.type === "voice";
            const caption = isImage ? m.text.trim() : "";
            const bareImage = isImage && !caption;
            const reserve = metaReserve(m.time, mine, 6.3, status === "sent" ? 15 : 20);

            return (
              <div
                key={m.id}
                data-mid={m.id}
                className={`flex ${mine ? "justify-end" : "justify-start"}`}
                style={{ marginTop: i === 0 ? 0 : firstOfGroup ? 8 : 2, paddingInline: 6 }}
              >
                <div
                  className={`relative ${live ? "rcss-anim-pop" : ""}`}
                  style={{ maxWidth: "87%", filter: bareImage ? undefined : t.bubbleFilter }}
                >
                  {tail && !bareImage && <BubbleTail side={onRight ? "right" : "left"} color={tailFill} />}
                  <div
                    className="relative overflow-hidden"
                    style={{
                      background: bareImage ? "transparent" : fill,
                      ...radius,
                      ...(bareImage ? { borderRadius: BUBBLE_MAX } : null),
                    }}
                  >
                    {isImage && (
                      <div style={{ padding: bareImage ? 0 : 2, paddingBottom: 0 }}>
                        <div
                          className="overflow-hidden"
                          style={{
                            borderRadius: bareImage ? BUBBLE_MAX : BUBBLE_MAX - 2,
                            borderBottomLeftRadius: bareImage ? BUBBLE_MAX : 6,
                            borderBottomRightRadius: bareImage ? BUBBLE_MAX : 6,
                            width: 248,
                            maxWidth: "100%",
                          }}
                        >
                          {m.imageSrc ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={m.imageSrc}
                              alt=""
                              draggable={false}
                              className="block w-full object-cover"
                              style={{ maxHeight: 320, minHeight: 120 }}
                            />
                          ) : (
                            <ImagePlaceholder dark={dark} />
                          )}
                        </div>
                      </div>
                    )}

                    {isVoice && (
                      <div style={{ padding: "7px 10px 9px 7px", paddingInlineEnd: 12 }}>
                        <VoiceBody m={m} mine={mine} theme={t} />
                        <span style={{ display: "block", height: 4 }} />
                      </div>
                    )}

                    {(m.type === "text" || caption) && (
                      <p
                        className="whitespace-pre-wrap break-words"
                        style={{
                          margin: 0,
                          padding: "6px 11px 7px",
                          fontSize: 17,
                          lineHeight: "22px",
                          letterSpacing: "-0.2px",
                          textAlign: textDir === "rtl" ? "right" : "left",
                          width: isImage ? 248 : undefined,
                          maxWidth: "100%",
                        }}
                      >
                        <span dir={textDir}>{isImage ? caption : m.text}</span>
                        <span aria-hidden style={{ display: "inline-block", width: reserve, height: 1 }} />
                      </p>
                    )}

                    <Meta
                      time={m.time}
                      mine={mine}
                      status={status}
                      color={metaColor}
                      checkColor={mine ? t.outCheck : metaColor}
                      overlay={bareImage}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top edge fade + status bar + glass header */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0"
        style={{ height: STATUS_H + HEADER_H + 22, background: t.topFade }}
      />
      <div className="absolute inset-x-0 top-0">
        <StatusBar device={scenario.device} tint={dark ? "light" : "dark"} background="transparent" />
        <div className="relative flex items-center justify-between" style={{ height: HEADER_H, paddingInline: 16 }}>
          {/* back: chevron + unread counter in a glass capsule */}
          <div
            className="flex h-[44px] shrink-0 items-center gap-1"
            style={{ ...glass(t, 22), paddingInlineStart: 14, paddingInlineEnd: 14, minWidth: 44 }}
          >
            <svg width="12" height="20" viewBox="0 0 12 20" fill="none" aria-hidden className="rtl:-scale-x-100">
              <path d="M10 2 2 10l8 8" stroke={t.glassIcon} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-[17px] leading-none" style={{ color: t.glassIcon, letterSpacing: "-0.3px" }}>
              {BACK_UNREAD}
            </span>
          </div>

          {/* centered title capsule */}
          <div
            className="absolute left-1/2 top-0 flex h-[44px] -translate-x-1/2 flex-col items-center justify-center"
            style={{ ...glass(t, 22), paddingInline: 16, maxWidth: 393 - 2 * (16 + 64 + 6), minWidth: 96 }}
          >
            <div
              className="max-w-full truncate text-[17px] font-semibold leading-[20px]"
              style={{ color: t.navTitle, letterSpacing: "-0.3px" }}
            >
              {scenario.them.name}
            </div>
            <div
              className="flex max-w-full items-center truncate text-[13px] leading-[16px]"
              style={{ color: subtitleAccent ? t.accent : t.navSub }}
            >
              {showTyping ? (
                <>
                  <span>{s.typing}</span>
                  <span className="flex items-end gap-[2px] pb-[2px]" style={{ marginInlineStart: 2 }}>
                    {[0, 1, 2].map((d) => (
                      <span
                        key={d}
                        className="rcss-typing-dot inline-block rounded-full"
                        style={{ width: 3, height: 3, background: t.accent, animationDelay: `${d * 0.18}s` }}
                      />
                    ))}
                  </span>
                </>
              ) : (
                <span className="truncate">{subtitle}</span>
              )}
            </div>
          </div>

          {/* avatar in a glass circle */}
          <div className="flex h-[44px] w-[44px] shrink-0 items-center justify-center" style={glass(t, 22)}>
            <Avatar person={scenario.them} size={38} />
          </div>
        </div>
      </div>

      {/* Bottom fade + floating input + home indicator */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0"
        style={{ height: 90, background: t.bottomFade }}
      />
      <div className="absolute inset-x-0 bottom-0">
        <div className="flex items-end gap-[6px]" style={{ paddingInline: 10, paddingBottom: 4 }}>
          <div className="flex h-[40px] w-[40px] shrink-0 items-center justify-center" style={glass(t, 20)}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="m19.6 11.3-7.8 7.8a5 5 0 0 1-7.1-7.1l8.3-8.3a3.4 3.4 0 0 1 4.8 4.8l-8.1 8.1a1.7 1.7 0 0 1-2.4-2.4l7.4-7.4"
                stroke={t.glassIcon}
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div
            className="flex h-[40px] min-w-0 flex-1 items-center"
            style={{ ...glass(t, 20), paddingInlineStart: 14, paddingInlineEnd: 8 }}
          >
            <span className="flex-1 truncate text-[17px]" style={{ color: t.placeholder, letterSpacing: "-0.3px" }}>
              {c.message}
            </span>
            {/* sticker / emoji toggle */}
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M8.4 3.5h7.2a4.9 4.9 0 0 1 4.9 4.9v4.1l-8 8H8.4a4.9 4.9 0 0 1-4.9-4.9V8.4a4.9 4.9 0 0 1 4.9-4.9Z"
                stroke={t.fieldIcon}
                strokeWidth="1.6"
                strokeLinejoin="round"
              />
              <path d="M12.5 20.5v-3a5 5 0 0 1 5-5h3" stroke={t.fieldIcon} strokeWidth="1.6" strokeLinejoin="round" />
              <path d="M8.3 13.4c.8 1 2 1.6 3.3 1.6" stroke={t.fieldIcon} strokeWidth="1.6" strokeLinecap="round" />
              <circle cx="9.2" cy="9.6" r="1.1" fill={t.fieldIcon} />
              <circle cx="14.8" cy="9.6" r="1.1" fill={t.fieldIcon} />
            </svg>
          </div>
          <div className="flex h-[40px] w-[40px] shrink-0 items-center justify-center" style={glass(t, 20)}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
              <rect x="8.6" y="2.8" width="6.8" height="12.2" rx="3.4" stroke={t.glassIcon} strokeWidth="1.7" />
              <path d="M5.4 11.4a6.6 6.6 0 0 0 13.2 0M12 18v3.2" stroke={t.glassIcon} strokeWidth="1.7" strokeLinecap="round" />
            </svg>
          </div>
        </div>
        <SystemBottomBar device={scenario.device} bg="transparent" fg={t.homeIndicator} />
      </div>
    </div>
  );
}
