"use client";

/**
 * TikTok direct messages — chat screen (iPhone).
 *
 * PRIMARY SOURCE — TikTok's own Aug 2025 DM product render (three iPhones at
 * 375pt, @2.08x): https://techcrunch.com/wp-content/uploads/2025/08/unnamed_2e9845.jpg
 * Pixel-scanned with sharp (values in pt; insets carry over to 393pt):
 *  - Canvas + header #F5F5F5; header 55pt under the status bar with a 0.5pt
 *    #D8D8D8 hairline. Chevron glyph 9.6×17.3 centred 22pt from the edge;
 *    38pt avatar at x=50; name 17 semibold at x≈97; report flag + "…" (3.8pt
 *    dots, 7.2pt pitch) centred 65.4 / 26.9pt from the trailing edge.
 *  - Profile intro on top of the thread: 92pt avatar 20pt under the header,
 *    name ~21 bold, then 15pt lines on a 21pt pitch (@handle #545454).
 *  - Bubbles: 15–16pt text on a 21pt line (2-line 59.6 vs 1-line 38.5pt),
 *    padding 9×12, radius 20 (single line = pill), joined corners 4, 4pt gap
 *    inside a run, 10pt between senders, max width ≈260pt. The LAST bubble of
 *    a run squares its sender-side bottom corner and flicks a ~4pt tail
 *    outward. Incoming #FFFFFF / black text, outgoing solid #00A2C9 / white.
 *  - Incoming 28pt avatar only beside the last bubble of a run, bottom-aligned,
 *    12pt from the edge, 8pt to the bubble. No avatar on my own messages;
 *    my bubbles sit 12pt from the trailing edge.
 *  - Voice: 45pt bubble, 23pt white play disc, 2pt bars on a 4.35pt pitch
 *    (5–18pt tall, bar count ∝ length: 0:08 → 5, 0:51 → 31), duration 14pt.
 *  - "Sent"/"Seen": 12pt #808080 under the newest outgoing bubble, flush with
 *    its trailing edge.
 *  - Quick-reply chips 30pt tall, #E9E9E9, 8pt apart, 12pt inset: ❤️ 😂 👍
 *    (50pt each), "👆 Nudge", "Share post" (cyan play tile), clipped at the edge.
 *  - Composer 8pt below the chips: 42pt #FFFFFF pill, 12pt insets, 34pt
 *    #00A2C9 camera disc 4pt inside, "Message..." #A8A8A8 16pt 12pt after it,
 *    sticker / photo / mic 24pt glyphs on a 38.5pt pitch, mic centred 24pt
 *    from the pill end; pill bottom 28pt above the home indicator.
 *  - Dark (lead-supplied, from TikTok dark shots): canvas #121212, cards/chips
 *    #262626, white text, same cyan.
 * Secondary source — TikTok's TUX tokens + strings from tiktok.com web bundles
 * (async/71799.*.js, async/99682.*.js, /explore?lang=ar): online dot #1DD765,
 * time separators after >5 min of silence (3e5 ms) showing the clock only.
 * Arabic chrome strings follow the TikTok Android template for consistency.
 * Font: TikTok Sans (`--font-tiktok-sans`) before the device stack.
 */

import { Fragment, type CSSProperties, type ReactNode } from "react";

import { deviceFontFamily } from "../../data/fonts";
import type { Message, Person } from "../../types";
import { Avatar, dirOf, SystemBottomBar, useChatScroll } from "../shared";
import { StatusBar } from "../devices/StatusBar";
import type { Lang } from "./chrome";
import { groupInfo, type PlatformMotion, type PlatformProps } from "./types";

/* ------------------------------ tokens ------------------------------ */

const TT = {
  headerH: 55,
  headerAvatar: 38,
  onlineDot: 10,
  nameSize: 17,
  subSize: 12,
  navIcon: 24,
  rowInset: 12,
  avatar: 28,
  avatarGap: 8,
  text: 16,
  lh: 21,
  padX: 12,
  padY: 9,
  maxW: 260,
  radius: 20,
  joined: 4,
  groupGap: 4,
  senderGap: 10,
  imgW: 200,
  imgRadius: 16,
  chipH: 30,
  pillH: 42,
  camera: 34,
} as const;

const TT_CYAN = "#00a2c9";
const TT_ONLINE = "#1dd765";

interface TtPalette {
  bg: string;
  fg: string;
  sub: string;
  handle: string;
  placeholder: string;
  inBubble: string;
  pill: string;
  chip: string;
  line: string;
  imgPlaceholder: string;
}

function ttPalette(dark: boolean): TtPalette {
  return dark
    ? {
        bg: "#121212",
        fg: "#ffffff",
        sub: "#8a8a8a",
        handle: "#a8a8a8",
        placeholder: "#7a7a7a",
        inBubble: "#262626",
        pill: "#262626",
        chip: "#262626",
        line: "#2a2a2a",
        imgPlaceholder: "#262626",
      }
    : {
        bg: "#f5f5f5",
        fg: "#000000",
        sub: "#808080",
        handle: "#545454",
        placeholder: "#a8a8a8",
        inBubble: "#ffffff",
        pill: "#ffffff",
        chip: "#e9e9e9",
        line: "#d8d8d8",
        imgPlaceholder: "#e9e9e9",
      };
}

const TT_STR: Record<Lang, { activeNow: string; message: string; seen: string; sent: string; nudge: string; sharePost: string }> = {
  en: { activeNow: "Active now", message: "Message...", seen: "Seen", sent: "Sent", nudge: "Nudge", sharePost: "Share post" },
  ar: { activeNow: "نشط الآن", message: "رسالة...", seen: "تمت المشاهدة", sent: "تم الإرسال", nudge: "نكزة", sharePost: "مشاركة منشور" },
};

/* ------------------------------- icons ------------------------------ */
/* TikTok TUX glyphs: 24pt boxes, ~2pt round strokes. */

function TtChevron({ color }: { color: string }) {
  // the only header glyph that mirrors in the Arabic build
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="shrink-0 rtl:-scale-x-100">
      <path d="M16.6 3.4 8 12l8.6 8.6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TtFlag() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4.4 22V2.6" />
      <path d="M4.4 3.6h15.4l-3.6 5.1 3.6 5.1H4.4" />
    </svg>
  );
}

function TtMore() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="4.8" cy="12" r="1.9" />
      <circle cx="12" cy="12" r="1.9" />
      <circle cx="19.2" cy="12" r="1.9" />
    </svg>
  );
}

function TtCamera() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden>
      <path
        fillRule="evenodd"
        fill="#ffffff"
        d="M9.3 3.3h5.4c.7 0 1.3.4 1.6 1l.9 1.8H19a3 3 0 0 1 3 3v8.6a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3V9.1a3 3 0 0 1 3-3h1.8l.9-1.8c.3-.6.9-1 1.6-1ZM12 8.6a4.4 4.4 0 1 0 0 8.8 4.4 4.4 0 0 0 0-8.8Zm0 2.2a2.2 2.2 0 1 1 0 4.4 2.2 2.2 0 0 1 0-4.4Z"
      />
    </svg>
  );
}

function TtSticker() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21.5 12.6A9.5 9.5 0 1 0 12.6 21.5" />
      <path d="M21.5 12.6c-4.6 0-8.9 3.4-8.9 8.9" />
      <circle cx="8.6" cy="9.4" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="15.2" cy="9.4" r="1.3" fill="currentColor" stroke="none" />
      <path d="M7.9 14.2c.9 1.2 2 1.9 3.4 2" />
    </svg>
  );
}

function TtPhoto() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2.6" y="2.6" width="18.8" height="18.8" rx="3.2" />
      <path d="M2.9 18.6 9 12.4l4.2 4.2" />
      <path d="M12 15.4l2.7-2.7 6.4 6.4" />
      <path d="M16.6 5.6v3.6M14.8 7.4h3.6" />
    </svg>
  );
}

function TtMic() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="8.2" y="1.6" width="7.6" height="13" rx="3.8" />
      <path d="M4.8 11.2a7.2 7.2 0 0 0 14.4 0M12 18.4v3.8" />
    </svg>
  );
}

function TtShareTile() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" aria-hidden>
      <rect width="15" height="15" rx="2.5" fill="#03a2d9" />
      <path d="M5.4 4.2v6.6c0 .4.4.6.7.4l5-3.3c.3-.2.3-.6 0-.8l-5-3.3c-.3-.2-.7 0-.7.4Z" fill="#ffffff" />
    </svg>
  );
}

function ImageGlyph({ color }: { color: string }) {
  return (
    <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round">
      <rect x="2.6" y="2.6" width="18.8" height="18.8" rx="3.2" />
      <path d="M2.9 18.6 9 12.4l4.2 4.2" />
      <path d="M12 15.4l2.7-2.7 6.4 6.4" />
    </svg>
  );
}

/** The small outward flick on the sender-side bottom corner of a run's last bubble. */
function TtTail({ color, onRight }: { color: string; onRight: boolean }) {
  return (
    <svg
      width="6"
      height="7"
      viewBox="0 0 6 7"
      aria-hidden
      className="pointer-events-none absolute"
      style={{ bottom: 0, ...(onRight ? { right: -4.6 } : { left: -4.6, transform: "scaleX(-1)" }) }}
    >
      <path d="M0 0C.5 3.4 2.2 5.6 5.2 6.4c.5.1.5.6 0 .6H0Z" fill={color} />
    </svg>
  );
}

/* ------------------------------ motion ------------------------------ */

const TT_ENTER_MS = 260;

function ttEase(p: number): number {
  const t = Math.min(1, Math.max(0, p));
  return 1 - Math.pow(1 - t, 3);
}

/**
 * TikTok iOS DM entrance (260ms ease-out cubic): the row fades in while rising
 * into place with a slight grow from its bottom sender-side corner — 10pt for
 * mine (coming up from the composer), 6pt for theirs.
 */
export const tiktokIosMotion: PlatformMotion = {
  enterMs: TT_ENTER_MS,
  enterStyle: (p, mine, rtl) => {
    const e = ttEase(p);
    const onRight = mine ? !rtl : rtl;
    return {
      opacity: Math.min(1, Math.max(0, p) / 0.55),
      transform: `translateY(${((1 - e) * (mine ? 10 : 6)).toFixed(2)}px) scale(${(0.96 + 0.04 * e).toFixed(4)})`,
      transformOrigin: `${onRight ? "right" : "left"} bottom`,
    };
  },
};

const TT_DOT_MS = 1200;
function ttDot(phase: number): number {
  const t = ((phase % 1) + 1) % 1;
  const k = t < 0.5 ? Math.sin((t / 0.5) * Math.PI) : 0;
  return 0.35 + 0.65 * k;
}

function buildCss(): string {
  const steps = 12;
  let css = "";
  for (const mine of [true, false]) {
    for (const rtl of [false, true]) {
      const name = `tt-ios-in-${mine ? "me" : "them"}-${rtl ? "rtl" : "ltr"}`;
      let frames = "";
      for (let i = 0; i <= steps; i++) {
        const p = i / steps;
        const st = tiktokIosMotion.enterStyle(p, mine, rtl);
        frames += `${(p * 100).toFixed(2)}%{opacity:${st.opacity};transform:${st.transform};transform-origin:${st.transformOrigin}}`;
      }
      css += `@keyframes ${name}{${frames}}.${name}{animation:${name} ${TT_ENTER_MS}ms linear both}`;
    }
  }
  let dot = "";
  for (let i = 0; i <= 20; i++) dot += `${i * 5}%{opacity:${ttDot(i / 20).toFixed(3)}}`;
  css += `@keyframes tt-ios-dot{${dot}}.tt-ios-dot{animation:tt-ios-dot ${TT_DOT_MS}ms linear infinite}`;
  css += `@keyframes tt-ios-fade{from{opacity:0}to{opacity:1}}.tt-ios-fade{animation:tt-ios-fade 200ms ease-out both}`;
  return css;
}
const TT_CSS = buildCss();

/* ------------------------------ helpers ----------------------------- */

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

/** TikTok drops a time separator above the first message and after >5 min of silence. */
function needsSeparator(messages: Message[], i: number): boolean {
  if (i === 0) return true;
  const a = minutesOf(messages[i - 1].time);
  const b = minutesOf(messages[i].time);
  if (a == null || b == null) return false;
  return b - a > 5 || b < a;
}

const EMOJI_ONLY = /^(?:\p{Extended_Pictographic}|\p{Emoji_Modifier}|\p{Regional_Indicator}|‍|️|⃣|[#*0-9](?=️?⃣)|\s)+$/u;

function jumboEmojiCount(text: string): number {
  const t = text.trim();
  if (!t || !EMOJI_ONLY.test(t) || !/\p{Extended_Pictographic}|\p{Regional_Indicator}/u.test(t)) return 0;
  const compact = t.replace(/\s+/g, "");
  let n: number;
  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    n = [...new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(compact)].length;
  } else {
    n = Array.from(compact.replace(/[‍️]|\p{Emoji_Modifier}/gu, "")).length;
  }
  return n >= 1 && n <= 3 ? n : 0;
}

type Corners = Pick<CSSProperties, "borderTopLeftRadius" | "borderTopRightRadius" | "borderBottomLeftRadius" | "borderBottomRightRadius">;

/** Sender-side corners shrink inside a run; the run's last bubble squares its bottom one (the tail sits there). */
function cornersFor(onRight: boolean, joinedAbove: boolean, joinedBelow: boolean, tail: boolean, r: number): Corners {
  const top = joinedAbove ? TT.joined : r;
  const bottom = tail ? 0 : joinedBelow ? TT.joined : r;
  return onRight
    ? { borderTopLeftRadius: r, borderBottomLeftRadius: r, borderTopRightRadius: top, borderBottomRightRadius: bottom }
    : { borderTopRightRadius: r, borderBottomRightRadius: r, borderTopLeftRadius: top, borderBottomLeftRadius: bottom };
}

const AR_LATIN: Record<string, string> = {
  ا: "a", أ: "a", إ: "e", آ: "a", ب: "b", ت: "t", ث: "th", ج: "j", ح: "h", خ: "kh", د: "d", ذ: "th", ر: "r", ز: "z",
  س: "s", ش: "sh", ص: "s", ض: "d", ط: "t", ظ: "z", ع: "a", غ: "gh", ف: "f", ق: "q", ك: "k", ل: "l", م: "m", ن: "n",
  ه: "h", ة: "a", و: "w", ي: "y", ى: "a", ئ: "e", ؤ: "o", ء: "",
};

/** TikTok usernames are Latin: derive a plausible @handle from the display name. */
function ttHandle(p: Person): string {
  const latin = p.name
    .trim()
    .toLowerCase()
    .replace(/[ء-ي]/g, (c) => AR_LATIN[c] ?? "")
    .replace(/\s+/g, "")
    .replace(/[^a-z0-9._]/g, "");
  return latin || "user";
}

/** "0:51" → 51 */
function secondsOf(d?: string): number {
  const mt = /(\d+):(\d{2})/.exec(d ?? "");
  return mt ? Number(mt[1]) * 60 + Number(mt[2]) : 8;
}

/* ---------------------------- sub-views ----------------------------- */

const TT_WAVE = [11, 11, 14, 14, 11, 11, 9, 9, 7, 7, 5, 11, 14, 11, 9, 5, 7, 7, 5, 5, 11, 11, 14, 14, 11, 11, 9, 9, 5, 5, 13];
const TT_WAVE_SHORT = [5, 13, 18, 13, 9];

function TtVoice({ mine, fg, inBubble, duration }: { mine: boolean; fg: string; inBubble: string; duration?: string }) {
  const ink = mine ? "#ffffff" : fg;
  const n = Math.max(5, Math.min(31, Math.round(secondsOf(duration) * 0.6)));
  const bars = n <= 5 ? TT_WAVE_SHORT : TT_WAVE.slice(0, n);
  return (
    <div dir="ltr" className="flex items-center" style={{ height: 23 }}>
      <span className="flex shrink-0 items-center justify-center rounded-full" style={{ width: 23, height: 23, background: ink }}>
        <svg width="10" height="11" viewBox="0 0 10 11" aria-hidden style={{ marginLeft: 2 }}>
          <path d="M0 1v9c0 .8.8 1.2 1.5.8l7.6-4.5c.6-.4.6-1.2 0-1.6L1.5.2C.8-.2 0 .2 0 1Z" fill={mine ? TT_CYAN : inBubble} />
        </svg>
      </span>
      <span className="flex items-center" style={{ marginInlineStart: 8, gap: 2.35, height: 18 }}>
        {bars.map((h, i) => (
          <span key={i} style={{ width: 2, height: h, borderRadius: 1, background: ink }} />
        ))}
      </span>
      <span className="shrink-0 tabular-nums" style={{ marginInlineStart: 9, fontSize: 14, lineHeight: "18px", color: ink }}>
        {duration ?? "0:08"}
      </span>
    </div>
  );
}

function TtTyping({ person, pal, clockMs }: { person: Person; pal: TtPalette; clockMs?: number }) {
  const exporting = clockMs !== undefined;
  return (
    <div className={`flex items-end ${exporting ? "" : "tt-ios-fade"}`} style={{ marginTop: TT.senderGap, gap: TT.avatarGap }}>
      <Avatar person={person} size={TT.avatar} />
      <div
        className="relative flex items-center justify-center"
        style={{
          background: pal.inBubble,
          ...cornersFor(false, false, false, true, TT.radius),
          height: TT.lh + TT.padY * 2,
          width: 60,
          gap: 5,
        }}
      >
        {[0, 1, 2].map((i) => {
          const o = exporting ? ttDot(clockMs / TT_DOT_MS - i * 0.2) : null;
          return (
            <span
              key={i}
              className={`block rounded-full ${exporting ? "" : "tt-ios-dot"}`}
              style={{
                width: 7,
                height: 7,
                background: pal.sub,
                ...(o !== null ? { opacity: o } : { animationDelay: `${i * 0.2 * TT_DOT_MS}ms` }),
              }}
            />
          );
        })}
        <TtTail color={pal.inBubble} onRight={false} />
      </div>
    </div>
  );
}

function TtChip({ bg, children, width }: { bg: string; children: ReactNode; width?: number }) {
  return (
    <span
      className="flex shrink-0 items-center justify-center whitespace-nowrap"
      style={{ height: TT.chipH, borderRadius: TT.chipH / 2, background: bg, width, paddingInline: width ? 0 : 12, gap: 4, fontSize: 14 }}
    >
      {children}
    </span>
  );
}

/* ------------------------------ screen ------------------------------ */

export function TikTok({ scenario, playback, lang, rtl }: PlatformProps) {
  const dark = scenario.theme === "dark";
  const pal = ttPalette(dark);
  const s = TT_STR[lang];
  const { messages, typing, clockMs } = playback;
  const live = playback.isLive;
  const exporting = clockMs !== undefined;
  const showTyping = typing || (!live && !exporting && scenario.presence === "typing");
  const scrollRef = useChatScroll<HTMLDivElement>(`${messages.length}-${showTyping}`);

  const last = messages[messages.length - 1];
  const receipt = last && last.sender === "me" ? (playback.statusOf(last) === "read" ? s.seen : s.sent) : null;

  const active = scenario.presence !== "lastseen";
  const subtitle = active ? s.activeNow : scenario.lastSeenText;
  const dirKey = rtl ? "rtl" : "ltr";
  const fontFamily = `var(--font-tiktok-sans), ${deviceFontFamily(scenario.device, scenario.androidFont)}`;

  return (
    <div className="flex h-full w-full flex-col" style={{ background: pal.bg, color: pal.fg, fontFamily }}>
      <style>{TT_CSS}</style>
      <StatusBar device={scenario.device} tint={dark ? "light" : "dark"} background={pal.bg} />

      {/* Header */}
      <div
        className="flex shrink-0 items-center"
        style={{ height: TT.headerH, paddingInlineStart: 10, paddingInlineEnd: 15, borderBottom: `0.5px solid ${pal.line}` }}
      >
        <span className="flex shrink-0 items-center justify-center" style={{ width: 24, height: 44 }}>
          <TtChevron color={pal.fg} />
        </span>
        <div className="relative shrink-0" style={{ width: TT.headerAvatar, height: TT.headerAvatar, marginInlineStart: 16 }}>
          <Avatar person={scenario.them} size={TT.headerAvatar} />
          {active && (
            <span
              className="absolute rounded-full"
              style={{
                width: TT.onlineDot,
                height: TT.onlineDot,
                bottom: -1,
                insetInlineEnd: -1,
                background: TT_ONLINE,
                border: `2px solid ${pal.bg}`,
                boxSizing: "content-box",
              }}
            />
          )}
        </div>
        <div className="min-w-0 flex-1" style={{ marginInlineStart: 9 }}>
          <div className="truncate" dir="auto" style={{ fontSize: TT.nameSize, lineHeight: "21px", fontWeight: 600, textAlign: "start" }}>
            {scenario.them.name}
          </div>
          {subtitle && (
            <div className="truncate" style={{ fontSize: TT.subSize, lineHeight: "15px", color: pal.sub, textAlign: "start" }}>
              {subtitle}
            </div>
          )}
        </div>
        {/* report flag + more are not mirrored in the Arabic build */}
        <div className="flex shrink-0 items-center" style={{ gap: 14.5, color: pal.fg }}>
          <TtFlag />
          <TtMore />
        </div>
      </div>

      {/* Thread */}
      <div
        ref={scrollRef}
        className="rcss-scroll relative min-h-0 flex-1 overflow-y-auto"
        style={{ paddingInline: TT.rowInset, paddingBottom: 12 }}
      >
        {/* Profile intro that opens every TikTok chat */}
        <div className="flex flex-col items-center text-center" style={{ paddingTop: 20, paddingBottom: 16 }}>
          <Avatar person={scenario.them} size={92} />
          <div className="max-w-full truncate" dir="auto" style={{ marginTop: 14, fontSize: 21, lineHeight: "26px", fontWeight: 700 }}>
            {scenario.them.name}
          </div>
          <div dir="ltr" style={{ marginTop: 2, fontSize: 15, lineHeight: "21px", color: pal.handle }}>
            @{ttHandle(scenario.them)}
          </div>
        </div>

        <div className="flex flex-col">
          {messages.map((m, i) => {
            const mine = m.sender === "me";
            const onRight = mine ? !rtl : rtl;
            const sep = needsSeparator(messages, i);
            const g = groupInfo(messages, i);
            const firstOfGroup = g.firstOfGroup || sep;
            const nextSep = i + 1 < messages.length && needsSeparator(messages, i + 1);
            const lastOfGroup = g.lastOfGroup || nextSep;

            const hasImage = m.type === "image";
            const caption = hasImage ? m.text.trim() : "";
            const jumbo = m.type === "text" ? jumboEmojiCount(m.text) : 0;
            const segs: ("image" | "text" | "voice" | "emoji")[] = hasImage
              ? caption
                ? ["image", "text"]
                : ["image"]
              : m.type === "voice"
                ? ["voice"]
                : jumbo
                  ? ["emoji"]
                  : ["text"];

            const enter = live ? `tt-ios-in-${mine ? "me" : "them"}-${dirKey}` : "";

            return (
              <Fragment key={m.id}>
                {sep && (
                  <div
                    className={`text-center ${live ? "tt-ios-fade" : ""}`}
                    style={{ paddingTop: i === 0 ? 4 : 16, paddingBottom: 2, fontSize: 12, lineHeight: "15px", color: pal.sub }}
                  >
                    <span dir="ltr">{m.time}</span>
                  </div>
                )}
                <div
                  data-mid={m.id}
                  data-sender={m.sender}
                  className={`flex items-end ${mine ? "justify-end" : "justify-start"} ${enter}`}
                  style={{ marginTop: firstOfGroup ? TT.senderGap : TT.groupGap, gap: TT.avatarGap }}
                >
                  {!mine && (
                    <div className="shrink-0" style={{ width: TT.avatar }}>
                      {lastOfGroup && <Avatar person={scenario.them} size={TT.avatar} />}
                    </div>
                  )}
                  <div className={`flex min-w-0 flex-col ${mine ? "items-end" : "items-start"}`} style={{ maxWidth: TT.maxW, gap: TT.groupGap }}>
                    {segs.map((seg, k) => {
                      const joinedAbove = k > 0 || !firstOfGroup;
                      const joinedBelow = k < segs.length - 1 || !lastOfGroup;
                      const tail = !joinedBelow;
                      if (seg === "emoji") {
                        return (
                          <div key={seg} dir="ltr" style={{ fontSize: jumbo === 1 ? 44 : 36, lineHeight: jumbo === 1 ? "50px" : "42px" }}>
                            {m.text.trim()}
                          </div>
                        );
                      }
                      if (seg === "image") {
                        return (
                          <div
                            key={seg}
                            className="overflow-hidden"
                            style={{ ...cornersFor(onRight, joinedAbove, joinedBelow, false, TT.imgRadius), width: TT.imgW, background: pal.imgPlaceholder }}
                          >
                            {m.imageSrc ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={m.imageSrc} alt="" draggable={false} className="block w-full object-cover" style={{ maxHeight: 320 }} />
                            ) : (
                              <div className="flex items-center justify-center" style={{ height: 260 }}>
                                <ImageGlyph color={pal.sub} />
                              </div>
                            )}
                          </div>
                        );
                      }
                      const fill = mine ? TT_CYAN : pal.inBubble;
                      const text = hasImage ? caption : m.text;
                      const voice = seg === "voice";
                      return (
                        <div
                          key={seg}
                          className="relative"
                          style={{
                            ...cornersFor(onRight, joinedAbove, joinedBelow, tail, voice ? 22.5 : TT.radius),
                            backgroundColor: fill,
                            color: mine ? "#ffffff" : pal.fg,
                            padding: voice ? "11px 12px 11px 10px" : `${TT.padY}px ${TT.padX}px`,
                          }}
                        >
                          {voice ? (
                            <TtVoice mine={mine} fg={pal.fg} inBubble={pal.inBubble} duration={m.voiceDuration} />
                          ) : (
                            <div
                              dir={dirOf(text)}
                              className="whitespace-pre-wrap break-words"
                              style={{ fontSize: TT.text, lineHeight: `${TT.lh}px`, textAlign: "start" }}
                            >
                              {text}
                            </div>
                          )}
                          {tail && <TtTail color={fill} onRight={onRight} />}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </Fragment>
            );
          })}

          {receipt && (
            <div className={`flex justify-end ${live ? "tt-ios-fade" : ""}`} style={{ marginTop: 3 }}>
              <span style={{ fontSize: 12, lineHeight: "15px", color: pal.sub }}>{receipt}</span>
            </div>
          )}

          {showTyping && <TtTyping person={scenario.them} pal={pal} clockMs={clockMs} />}
        </div>
      </div>

      {/* Quick replies */}
      <div className="flex shrink-0 overflow-hidden" style={{ gap: 8, paddingInlineStart: TT.rowInset, paddingTop: 2 }}>
        <TtChip bg={pal.chip} width={50}>
          <span style={{ fontSize: 16 }}>❤️</span>
        </TtChip>
        <TtChip bg={pal.chip} width={50}>
          <span style={{ fontSize: 16 }}>😂</span>
        </TtChip>
        <TtChip bg={pal.chip} width={50}>
          <span style={{ fontSize: 16 }}>👍</span>
        </TtChip>
        <TtChip bg={pal.chip}>
          <span style={{ fontSize: 16 }}>👆</span>
          {s.nudge}
        </TtChip>
        <TtChip bg={pal.chip}>
          <TtShareTile />
          {s.sharePost}
        </TtChip>
      </div>

      {/* Composer */}
      <div className="shrink-0" style={{ padding: `8px ${TT.rowInset}px 22px` }}>
        <div
          className="flex items-center"
          style={{ background: pal.pill, height: TT.pillH, borderRadius: TT.pillH / 2, paddingInlineStart: 4, paddingInlineEnd: 12 }}
        >
          <span className="flex shrink-0 items-center justify-center rounded-full" style={{ width: TT.camera, height: TT.camera, background: TT_CYAN }}>
            <TtCamera />
          </span>
          <span className="min-w-0 flex-1 truncate" style={{ marginInlineStart: 12, fontSize: 16, color: pal.placeholder, textAlign: "start" }}>
            {s.message}
          </span>
          <div className="flex shrink-0 items-center" style={{ gap: 14.5, color: pal.fg }}>
            <TtSticker />
            <TtPhoto />
            <TtMic />
          </div>
        </div>
      </div>

      <SystemBottomBar device={scenario.device} bg={pal.bg} fg={dark ? "#ffffff" : "#000000"} />
    </div>
  );
}
