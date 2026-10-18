"use client";

/**
 * Samsung Messages (com.samsung.android.messaging) conversation screen, the
 * default SMS/RCS app on Galaxy phones. Shown when the "iMessage" platform is
 * picked with the Samsung device (iMessage does not exist on Android).
 *
 * Design era: One UI 8.5 (Galaxy S26, Feb 2026), carried unchanged into One UI 9
 * (rollout from 16 Sep 2026; its Messages change was "Now Nudge", not visual).
 *   - One UI 8.5 redesign: back / menu turn into filled circles that FLOAT above
 *     the content, avatar + name sit in their own floating capsule, gradient
 *     "overflow" fade at the top.
 *     https://sammyguru.com/samsung-messages-one-ui-8-5-update-makeover/
 *     (device screenshot Screenshot_20251113_203706_Messages.jpg, measured at
 *     1080 px = 360 dp): back circle 48 dp, 12 dp from the edge; capsule 48 dp
 *     high, avatar ~32 dp, bold name (~23 sp) + chevron-down; menu circle 48 dp.
 *     Composer: plain bar, ">" expander, grey pill (#F3F3F3, ~38 dp) with the
 *     placeholder (~16 sp, #6F6F6F) and a sticker glyph, voice-waveform button
 *     outside the pill. Bubble text ~15 sp / 20 dp line, 13 dp side padding,
 *     time 12 sp beside the bubble (outside, bottom aligned).
 *   - One UI 7 bubble change: "more rectangular with rounded corners" (single
 *     line still reads as a pill), one radius for every bubble, no tail.
 *     https://www.sammyfans.com/2024/12/06/samsung-messages-app-gets-a-fresh-look-with-one-ui-7/
 *   - Samsung support screenshots (S22/S24): date divider is plain centred grey
 *     text "Monday, August 22" (no chip); time sits next to the bubble on the
 *     inner side ("12:45 PM"); SMS bubble teal #089A8F with white text.
 *     https://www.samsung.com/us/support/answer/ANS10001926/
 *   - RCS ("chat features") bubbles are blue, SMS turquoise; read/delivered and
 *     typing only exist over RCS. RCS is the default here.
 *     https://us.community.samsung.com/t5/Galaxy-S24/Why-do-some-messages-show-delivered-and-some-don-t/td-p/3141394
 *     Blue sampled from Samsung's own Bubble Emoji screenshot (bubble + send
 *     button #167EFA): https://www.sammobile.com/news/samsung-messages-new-feature-makes-texting-more-fun/
 *   - RCS placeholder "Enter chat message" (SMS: "Enter message"):
 *     https://en.wikipedia.org/wiki/Rich_Communication_Services
 *   - One UI 7 shows emoji-only messages as large standalone emoji:
 *     https://eu.community.samsung.com/t5/galaxy-z-fold-z-flip/one-ui-7-messed-up-emoji-rcs/m-p/12505394
 *   - One UI surfaces: light app bg #F1F1F1 / cards #FDFDFD (S26 Messages
 *     contacts screenshot); dark bg #000000 / cards #171717, accent #0381FE.
 *   - RCS reactions (One UI 7+/8): the emoji in a small raised chip hanging off
 *     the bubble's bottom corner nearest the screen centre (24 dp, surface fill,
 *     soft shadow). Replies: quoted block at the top of the bubble (tinted
 *     12 dp box, 3 dp bar, bold sender + one-line snippet, thumbnail for photos).
 *     Typing: the field grows to 5 lines, accent caret, the voice button turns
 *     into the blue (#167EFA) send circle.
 *   - Header presence: Samsung Messages has none (no online / last seen); the
 *     "typing" state is only the dots bubble inside the thread.
 */

import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

import type { DeliveryStatus, Message, Person } from "../../types";
import { dirOf, SystemBottomBar, useChatScroll } from "../shared";
import { SamsungStatusBar } from "../devices/SamsungStatusBar";
import { CHROME, type Lang } from "./chrome";
import { groupInfo, type PlatformMotion, type PlatformProps } from "./types";

/* ------------------------------- tokens ------------------------------- */

interface Palette {
  bg: string;
  bgA: (a: number) => string;
  ink: string;
  sub: string;
  meta: string;
  date: string;
  float: string;
  floatShadow: string;
  icon: string;
  inBubble: string;
  inText: string;
  outBubble: string;
  outText: string;
  field: string;
  placeholder: string;
  fieldIcon: string;
  dot: string;
  imgEmpty: string;
  imgEmptyIcon: string;
  navFg: string;
  /** reaction badge */
  chip: string;
  chipShadow: string;
  /** quoted-reply block inside incoming / outgoing bubbles */
  quoteIn: string;
  quoteOut: string;
  quoteBarIn: string;
  caret: string;
}

const LIGHT: Palette = {
  bg: "#fcfcfc",
  bgA: (a) => `rgba(252,252,252,${a})`,
  ink: "#000000",
  sub: "#6f6f6f",
  meta: "#757575",
  date: "#7a7a7a",
  float: "#ffffff",
  floatShadow: "0 1px 2px rgba(0,0,0,0.06), 0 3px 12px rgba(0,0,0,0.08)",
  icon: "#1f1f1f",
  inBubble: "#efefef",
  inText: "#000000",
  outBubble: "#167efa",
  outText: "#ffffff",
  field: "#f1f1f1",
  placeholder: "#6f6f6f",
  fieldIcon: "#3d3d3d",
  dot: "#8c8c8c",
  imgEmpty: "#e4e4e4",
  imgEmptyIcon: "#a8a8a8",
  navFg: "#3d3d3d",
  chip: "#ffffff",
  chipShadow: "0 0 0 0.5px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.16)",
  quoteIn: "rgba(0,0,0,0.06)",
  quoteOut: "rgba(255,255,255,0.2)",
  quoteBarIn: "#167efa",
  caret: "#167efa",
};

const DARK: Palette = {
  bg: "#000000",
  bgA: (a) => `rgba(0,0,0,${a})`,
  ink: "#fafafa",
  sub: "#9b9b9b",
  meta: "#8f8f8f",
  date: "#8f8f8f",
  float: "#252525",
  floatShadow: "0 2px 10px rgba(0,0,0,0.5)",
  icon: "#f2f2f2",
  inBubble: "#2a2a2a",
  inText: "#fafafa",
  outBubble: "#0381fe",
  outText: "#ffffff",
  field: "#1c1c1c",
  placeholder: "#8f8f8f",
  fieldIcon: "#d6d6d6",
  dot: "#9a9a9a",
  imgEmpty: "#262626",
  imgEmptyIcon: "#5e5e5e",
  navFg: "#e6e6e6",
  chip: "#2e2e2e",
  chipShadow: "0 0 0 0.5px rgba(255,255,255,0.06), 0 1px 4px rgba(0,0,0,0.6)",
  quoteIn: "rgba(255,255,255,0.08)",
  quoteOut: "rgba(255,255,255,0.2)",
  quoteBarIn: "#3e95ff",
  caret: "#3e95ff",
};

/** Strings Samsung Messages uses that CHROME lacks or words differently. */
const SM: Record<
  Lang,
  { placeholder: string; delivered: string; read: string; locale: string; you: string; voice: string; photo: string }
> = {
  en: {
    placeholder: "Enter chat message",
    delivered: "Delivered",
    read: "Read",
    locale: "en-US",
    you: "You",
    voice: "🎤 Voice message",
    photo: "📷 Photo",
  },
  ar: {
    placeholder: "أدخل رسالة دردشة",
    delivered: CHROME.ar.delivered,
    read: CHROME.ar.read,
    locale: "ar-u-nu-arab",
    you: "أنت",
    voice: "🎤 رسالة صوتية",
    photo: "📷 صورة",
  },
};

const RADIUS = 20;
const SIDE = 16;
const AVATAR = 36;
const AVATAR_GAP = 8;
const FONT = 15;
const LINE = 20;

/** One UI with an Arabic locale renders digits as Arabic-Indic, like the status bar does. */
function localDigits(s: string, lang: Lang): string {
  if (lang !== "ar") return s;
  const map = "٠١٢٣٤٥٦٧٨٩";
  return s.replace(/[0-9]/g, (d) => map[Number(d)]);
}

function dateLabel(d: Date, lang: Lang): string {
  try {
    return new Intl.DateTimeFormat(SM[lang].locale, { weekday: "long", month: "long", day: "numeric" }).format(d);
  } catch {
    return d.toDateString();
  }
}

/* ------------------------------- motion ------------------------------- */

const ENTER_MS = 320;
const easeOutCubic = (p: number) => 1 - Math.pow(1 - p, 3);

/**
 * New rows rise 14dp and scale up from 0.94 while fading in, anchored to the
 * bubble's own side. Live CSS: `sm-msg-in` with cubic-bezier(0.33,1,0.68,1),
 * which is the ease-out-cubic curve used here.
 */
export const samsungMessagesMotion: PlatformMotion = {
  enterMs: ENTER_MS,
  enterStyle: (p, mine, rtl) => {
    const e = easeOutCubic(Math.min(1, Math.max(0, p)));
    const onRight = mine ? !rtl : rtl;
    return {
      opacity: e,
      transform: `translateY(${(1 - e) * 14}px) scale(${0.94 + 0.06 * e})`,
      transformOrigin: `${onRight ? "right" : "left"} bottom`,
    };
  },
};

/** Typing dots: 1.2s cycle, each dot pulses (opacity .35 -> 1, scale .8 -> 1) at 30%, staggered 0.16s. */
const DOT_CYCLE = 1200;
const DOT_STAGGER = 160;

function dotState(t: number): { opacity: number; transform: string } {
  const ph = ((t % 1) + 1) % 1;
  let k = 0;
  if (ph < 0.3) k = ph / 0.3;
  else if (ph < 0.6) k = 1 - (ph - 0.3) / 0.3;
  const s = k * k * (3 - 2 * k);
  return { opacity: 0.35 + 0.65 * s, transform: `scale(${0.8 + 0.2 * s})` };
}

/** Android TextView cursor: 500 ms on / 500 ms off, hard edges. */
const CARET_BLINK = 500;
const caretOn = (ms: number) => Math.floor(ms / CARET_BLINK) % 2 === 0;

const KEYFRAMES = `
@keyframes sm-msg-in{from{opacity:0;transform:translateY(14px) scale(.94)}to{opacity:1;transform:none}}
@keyframes sm-dot{0%,60%,100%{opacity:.35;transform:scale(.8)}30%{opacity:1;transform:scale(1)}}
@keyframes sm-caret{0%,49.9%{opacity:1}50%,100%{opacity:0}}
@keyframes sm-send-in{from{opacity:0;transform:scale(.6)}to{opacity:1;transform:none}}
.sm-anim-in{animation:sm-msg-in ${ENTER_MS}ms cubic-bezier(0.33,1,0.68,1) both}
.sm-dot{animation:sm-dot ${DOT_CYCLE}ms ease-in-out infinite}
.sm-caret{animation:sm-caret ${CARET_BLINK * 2}ms linear infinite}
.sm-send-in{animation:sm-send-in 200ms cubic-bezier(0.33,1,0.68,1) both}
`;

/* ------------------------------- glyphs ------------------------------- */

function Chevron({ color, dir, size = 24, stroke = 1.7 }: { color: string; dir: "left" | "right" | "down"; size?: number; stroke?: number }) {
  const d = dir === "left" ? "M15 4.5 7.5 12l7.5 7.5" : dir === "right" ? "M9 4.5l7.5 7.5L9 19.5" : "M5.5 9l6.5 6.5L18.5 9";
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ display: "block", flexShrink: 0 }}>
      <path d={d} stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MoreDots({ color }: { color: string }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" style={{ display: "block" }}>
      <circle cx="12" cy="5.2" r="1.65" fill={color} />
      <circle cx="12" cy="12" r="1.65" fill={color} />
      <circle cx="12" cy="18.8" r="1.65" fill={color} />
    </svg>
  );
}

/** One UI sticker glyph: rounded square face with a peeled corner. */
function StickerIcon({ color }: { color: string }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ display: "block", flexShrink: 0 }}>
      <path
        d="M20.2 12.6V8.2A4.2 4.2 0 0 0 16 4H8a4.2 4.2 0 0 0-4.2 4.2V16A4.2 4.2 0 0 0 8 20.2h4.6"
        stroke={color}
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path d="M12.6 20.2c0-4.2 3.4-7.6 7.6-7.6l-7.6 7.6Z" stroke={color} strokeWidth="1.6" strokeLinejoin="round" />
      <circle cx="9.2" cy="10" r="1.1" fill={color} />
      <circle cx="14.8" cy="10" r="1.1" fill={color} />
      <path d="M8.6 13.6c.8 1 1.9 1.5 3.2 1.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

/** Voice recording button: a short symmetric waveform. Never mirrored. */
function VoiceWave({ color }: { color: string }) {
  const bars = [
    [4, 10.5, 13.5],
    [7.4, 8, 16],
    [10.8, 4, 20],
    [14.2, 7, 17],
    [17.6, 9.5, 14.5],
    [21, 11, 13],
  ];
  return (
    <svg width="26" height="24" viewBox="0 0 25 24" style={{ display: "block" }}>
      {bars.map(([x, y1, y2]) => (
        <line key={x} x1={x} x2={x} y1={y1} y2={y2} stroke={color} strokeWidth="1.7" strokeLinecap="round" />
      ))}
    </svg>
  );
}

/** One UI send glyph (paper plane pointing to the reading direction; auto-mirrored in RTL). */
function SendGlyph({ rtl }: { rtl: boolean }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      style={{ display: "block", transform: rtl ? "scaleX(-1)" : undefined }}
    >
      <path
        d="M4.4 4.2c-.5-.24-1.05.25-.86.77L6.1 12l-2.56 7.03c-.19.52.36 1.01.86.77l15.6-7.2c.5-.23.5-.97 0-1.2z"
        fill="#ffffff"
      />
      <path d="M6.1 12h6.4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function PlayGlyph({ color, size = 14 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: "block" }}>
      <path d="M7 4.6v14.8c0 .8.9 1.3 1.6.9l11.6-7.4a1 1 0 0 0 0-1.8L8.6 3.7C7.9 3.3 7 3.8 7 4.6z" fill={color} />
    </svg>
  );
}

/* ------------------------------- avatar ------------------------------- */

/** Samsung Contacts letter tiles: soft solid colours, one white initial. */
const TILE_COLORS = ["#9b7ff0", "#a9c548", "#4fb4c9", "#f0897c", "#efae4c", "#6e9cf0", "#e57fb6", "#62bf8a"];

function SamsungAvatar({ person, size }: { person: Person; size: number }) {
  if (person.avatar) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={person.avatar}
        alt=""
        draggable={false}
        className="shrink-0 rounded-full object-cover"
        style={{ width: size, height: size, display: "block" }}
      />
    );
  }
  const name = person.name.trim();
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + h * 31;
  const bg = TILE_COLORS[Math.abs(h) % TILE_COLORS.length];
  const letter = name ? Array.from(name)[0].toUpperCase() : "";
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full"
      style={{ width: size, height: size, background: bg, color: "#ffffff", fontSize: size * 0.46, lineHeight: 1 }}
    >
      {letter || (
        <svg width={size * 0.5} height={size * 0.5} viewBox="0 0 24 24">
          <circle cx="12" cy="8" r="4.2" fill="#ffffff" />
          <path d="M3.8 21c.6-4.4 4-7 8.2-7s7.6 2.6 8.2 7z" fill="#ffffff" />
        </svg>
      )}
    </div>
  );
}

/* ------------------------------- helpers ------------------------------- */

const EMOJI_ONLY = new RegExp("^(?:\\p{Extended_Pictographic}|\\p{Emoji_Modifier}|\\p{Regional_Indicator}|\\u200d|\\ufe0f|\\s)+$", "u");
const EMOJI_UNIT = new RegExp("\\p{Extended_Pictographic}(?:\\p{Emoji_Modifier}|\\ufe0f)*(?:\\u200d\\p{Extended_Pictographic}(?:\\p{Emoji_Modifier}|\\ufe0f)*)*|\\p{Regional_Indicator}{2}", "gu");

/** 1-3 emoji with no other text render large without a bubble. Returns the count (0 = not emoji-only). */
function emojiCount(text: string): number {
  const t = text.trim();
  if (!t || !EMOJI_ONLY.test(t)) return 0;
  const n = (t.match(EMOJI_UNIT) || []).length;
  return n >= 1 && n <= 3 ? n : 0;
}

function waveform(seed: string, n: number): number[] {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    const r = ((h >>> 0) % 1000) / 1000;
    const env = 0.55 + 0.45 * Math.sin((i / n) * Math.PI);
    out.push(Math.max(3, Math.round((4 + r * 14) * env)));
  }
  return out;
}

/* ------------------------------- screen ------------------------------- */

export function SamsungMessages({ scenario, playback, lang, rtl }: PlatformProps) {
  const dark = scenario.theme === "dark";
  const p = dark ? DARK : LIGHT;
  const s = SM[lang];
  const { messages, typing, clockMs } = playback;
  const exporting = clockMs !== undefined;
  const live = playback.isLive && !exporting;
  const showTyping = typing || (!playback.isLive && !exporting && scenario.presence === "typing");
  const draft = playback.draft;
  const draftText = draft?.text ?? "";
  const draftHasText = draftText.length > 0;

  // The input grows with the draft and pushes the thread up; keep it pinned to the bottom.
  const composerRef = useRef<HTMLDivElement>(null);
  const [composerH, setComposerH] = useState(0);
  useLayoutEffect(() => {
    const el = composerRef.current;
    if (!el) return;
    const measure = () => {
      const h = el.offsetHeight;
      setComposerH((prev) => (prev === h ? prev : h));
    };
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [draftText]);

  const scrollRef = useChatScroll<HTMLDivElement>(`${messages.length}-${showTyping}`);
  // keep the thread anchored above the composer while the field grows/shrinks
  const prevComposerH = useRef(composerH);
  useLayoutEffect(() => {
    const sc = scrollRef.current;
    const d = composerH - prevComposerH.current;
    const had = prevComposerH.current > 0;
    prevComposerH.current = composerH;
    if (sc && d && had) sc.scrollTop += d;
  }, [composerH, scrollRef]);
  const [today] = useState(() => new Date());

  const last = messages[messages.length - 1];
  const typingStartsGroup = !last || last.sender !== "them";

  return (
    <div className="flex h-full w-full flex-col" style={{ background: p.bg, color: p.ink }}>
      <style>{KEYFRAMES}</style>
      <SamsungStatusBar tint={dark ? "light" : "dark"} background={p.bg} lang={lang} />

      <div className="relative flex min-h-0 flex-1 flex-col">
        {/* Thread */}
        <div
          ref={scrollRef}
          className="rcss-scroll min-h-0 flex-1 overflow-y-auto"
          style={{ paddingTop: 72, paddingBottom: 10 }}
        >
          <div className="text-center" style={{ fontSize: 13, lineHeight: "18px", color: p.date, padding: "12px 0 14px" }}>
            {dateLabel(today, lang)}
          </div>

          {messages.map((m, i) => {
            const { firstOfGroup } = groupInfo(messages, i);
            const next = messages[i + 1];
            // One timestamp per same-minute run, but a run splits where the receipt changes.
            const showMeta =
              !next ||
              next.sender !== m.sender ||
              next.time !== m.time ||
              (m.sender === "me" && playback.statusOf(next) !== playback.statusOf(m));
            return (
              <Row
                key={m.id}
                m={m}
                p={p}
                lang={lang}
                rtl={rtl}
                firstOfGroup={firstOfGroup}
                showMeta={showMeta}
                status={playback.statusOf(m)}
                them={scenario.them}
                live={live}
                isFirst={i === 0}
                parent={m.replyToId ? messages.find((x) => x.id === m.replyToId && x.id !== m.id) : undefined}
              />
            );
          })}

          {showTyping && (
            <TypingRow p={p} them={scenario.them} startsGroup={typingStartsGroup} live={live} clockMs={clockMs} rtl={rtl} />
          )}
        </div>

        {/* Floating One UI 8.5 header over a top fade */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0"
          style={{
            height: 84,
            background: `linear-gradient(to bottom, ${p.bgA(1)} 0%, ${p.bgA(0.92)} 45%, ${p.bgA(0)} 100%)`,
          }}
        />
        <div className="absolute inset-x-0 top-0 flex items-center" style={{ padding: "12px 12px 0", gap: 6 }}>
          <div
            className="flex shrink-0 items-center justify-center rounded-full"
            style={{ width: 48, height: 48, background: p.float, boxShadow: p.floatShadow }}
          >
            <span style={{ display: "block", transform: rtl ? "scaleX(-1)" : undefined }}>
              <Chevron dir="left" color={p.icon} />
            </span>
          </div>
          <div
            className="flex min-w-0 flex-1 items-center rounded-full"
            style={{ height: 48, background: p.float, boxShadow: p.floatShadow, paddingInlineStart: 8, paddingInlineEnd: 14 }}
          >
            <SamsungAvatar person={scenario.them} size={32} />
            <span
              className="min-w-0 truncate"
              dir={dirOf(scenario.them.name)}
              style={{ fontSize: 21, fontWeight: 700, lineHeight: "26px", color: p.ink, paddingInlineStart: 11, letterSpacing: -0.2 }}
            >
              {scenario.them.name}
            </span>
            <span style={{ paddingInlineStart: 8 }}>
              <Chevron dir="down" color={p.icon} size={18} stroke={1.8} />
            </span>
          </div>
          <div
            className="flex shrink-0 items-center justify-center rounded-full"
            style={{ width: 48, height: 48, background: p.float, boxShadow: p.floatShadow }}
          >
            <MoreDots color={p.icon} />
          </div>
        </div>
      </div>

      {/* Composer: grows up to 5 lines; the voice button becomes the blue send button once text is entered */}
      <div
        ref={composerRef}
        className="flex shrink-0 items-end"
        style={{ minHeight: 58, padding: "9px 8px 9px 6px", background: p.bg }}
      >
        <div className="flex shrink-0 items-center justify-center" style={{ width: 40, height: 40 }}>
          <span style={{ display: "block", transform: rtl ? "scaleX(-1)" : undefined }}>
            <Chevron dir="right" color={p.fieldIcon} />
          </span>
        </div>
        <div
          className="flex min-w-0 flex-1 items-end"
          style={{
            minHeight: 38,
            marginBlock: 1,
            borderRadius: 19,
            background: p.field,
            paddingInlineStart: 16,
            paddingInlineEnd: 10,
            marginInlineStart: 2,
          }}
        >
          <div
            className="flex min-w-0 flex-1 flex-col justify-end overflow-hidden"
            style={{ maxHeight: FIELD_LINE * 5 + 17, paddingBlock: 8.5 }}
          >
            {draft ? (
              <div
                dir={draftHasText ? dirOf(draftText) : rtl ? "rtl" : "ltr"}
                className="whitespace-pre-wrap break-words"
                style={{ fontSize: 16, lineHeight: `${FIELD_LINE}px`, color: p.ink }}
              >
                {draftText}
                <SamsungCaret p={p} clockMs={clockMs} />
                {!draftHasText && <span style={{ color: p.placeholder }}>{s.placeholder}</span>}
              </div>
            ) : (
              <span className="min-w-0 truncate" style={{ fontSize: 16, lineHeight: `${FIELD_LINE}px`, color: p.placeholder }}>
                {s.placeholder}
              </span>
            )}
          </div>
          <span className="flex shrink-0 items-center" style={{ height: 38 }}>
            <StickerIcon color={p.fieldIcon} />
          </span>
        </div>
        {draftHasText ? (
          <div className="flex shrink-0 items-center justify-center" style={{ width: 44, height: 40, marginInlineStart: 4 }}>
            <span
              className={`flex items-center justify-center rounded-full ${live ? "sm-send-in" : ""}`}
              style={{ width: 40, height: 40, background: p.outBubble, color: p.outBubble }}
            >
              <SendGlyph rtl={rtl} />
            </span>
          </div>
        ) : (
          <div className="flex shrink-0 items-center justify-center" style={{ width: 44, height: 40, marginInlineStart: 4 }}>
            <VoiceWave color={p.fieldIcon} />
          </div>
        )}
      </div>

      <SystemBottomBar device="android" bg={p.bg} fg={p.navFg} />
    </div>
  );
}

/* ------------------------------- composer ------------------------------- */

const FIELD_LINE = 21;

/** Android EditText cursor: 2dp accent bar. */
function SamsungCaret({ p, clockMs }: { p: Palette; clockMs?: number }) {
  return (
    <span
      aria-hidden
      className={clockMs === undefined ? "sm-caret" : undefined}
      style={{
        display: "inline-block",
        width: 2,
        height: 19,
        background: p.caret,
        verticalAlign: -4,
        marginInline: 0.5,
        opacity: clockMs === undefined ? undefined : caretOn(clockMs) ? 1 : 0,
      }}
    />
  );
}

/* ------------------------------- rows ------------------------------- */

/** RCS reaction badge: a small raised chip hanging off the bubble's bottom inner corner. */
function ReactionChip({ emoji, p, side }: { emoji: string; p: Palette; side: "left" | "right" }) {
  return (
    <span
      aria-hidden
      className="absolute z-10 flex items-center justify-center rounded-full"
      style={{
        bottom: -REACT_HANG,
        [side]: 10,
        height: 24,
        minWidth: 24,
        padding: "0 5px",
        background: p.chip,
        boxShadow: `0 0 0 1.5px ${p.bg}, ${p.chipShadow}`,
        fontSize: 14,
        lineHeight: 1,
      }}
    >
      {emoji}
    </span>
  );
}
const REACT_HANG = 15;

/** Quoted message block at the top of a reply bubble. */
function ReplyQuote({ parent, mine, p, lang, them }: { parent: Message; mine: boolean; p: Palette; lang: Lang; them: Person }) {
  const s = SM[lang];
  const name = parent.sender === "me" ? s.you : them.name;
  const snippet =
    parent.type === "voice" ? s.voice : parent.type === "image" ? parent.text.trim() || s.photo : parent.text.trim();
  const thumb = parent.type === "image" && parent.imageSrc ? parent.imageSrc : null;
  return (
    <div
      className="flex items-stretch"
      style={{
        background: mine ? p.quoteOut : p.quoteIn,
        borderRadius: 12,
        margin: "-3px -7px 6px",
        padding: "6px 10px 6px 8px",
        gap: 8,
      }}
    >
      <span className="shrink-0" style={{ width: 3, borderRadius: 2, background: mine ? "#ffffff" : p.quoteBarIn }} />
      <div className="min-w-0 flex-1">
        <div
          className="truncate"
          dir={dirOf(name)}
          style={{ fontSize: 13, lineHeight: "17px", fontWeight: 700, color: mine ? "#ffffff" : p.quoteBarIn }}
        >
          {name}
        </div>
        <div
          className="truncate"
          dir={dirOf(snippet)}
          style={{ fontSize: 13, lineHeight: "17px", opacity: mine ? 0.85 : 0.7 }}
        >
          {snippet}
        </div>
      </div>
      {thumb && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={thumb} alt="" draggable={false} className="shrink-0 object-cover" style={{ width: 34, height: 34, borderRadius: 8 }} />
      )}
    </div>
  );
}

function Meta({
  m,
  p,
  lang,
  mine,
  status,
}: {
  m: Message;
  p: Palette;
  lang: Lang;
  mine: boolean;
  status: DeliveryStatus;
}) {
  const s = SM[lang];
  const label = mine ? (status === "read" ? s.read : status === "delivered" ? s.delivered : "") : "";
  return (
    <div
      className="flex shrink-0 flex-col whitespace-nowrap"
      style={{
        alignSelf: "flex-end",
        alignItems: mine ? "flex-end" : "flex-start",
        fontSize: 12,
        lineHeight: "15px",
        color: p.meta,
        paddingBottom: 1,
        [mine ? "marginInlineEnd" : "marginInlineStart"]: 6,
      }}
    >
      {label && <span>{label}</span>}
      <span>{localDigits(m.time, lang)}</span>
    </div>
  );
}

function Row({
  m,
  p,
  lang,
  rtl,
  firstOfGroup,
  showMeta,
  status,
  them,
  live,
  isFirst,
  parent,
}: {
  m: Message;
  p: Palette;
  lang: Lang;
  rtl: boolean;
  firstOfGroup: boolean;
  showMeta: boolean;
  status: DeliveryStatus;
  them: Person;
  live: boolean;
  isFirst: boolean;
  parent?: Message;
}) {
  const mine = m.sender === "me";
  const onRight = mine ? !rtl : rtl;
  const bg = mine ? p.outBubble : p.inBubble;
  const fg = mine ? p.outText : p.inText;
  const caption = m.type === "image" ? m.text.trim() : "";
  const emoji = m.type === "text" ? emojiCount(m.text) : 0;
  const maxW = mine ? 252 : 228;
  // the reaction hangs off the bottom corner that faces the screen centre
  const chip = m.reaction ? <ReactionChip emoji={m.reaction} p={p} side={onRight ? "left" : "right"} /> : null;
  const quote = parent ? <ReplyQuote parent={parent} mine={mine} p={p} lang={lang} them={them} /> : null;

  const bubble: CSSProperties = {
    background: bg,
    color: fg,
    borderRadius: RADIUS,
    fontSize: FONT,
    lineHeight: `${LINE}px`,
    padding: "8px 13px",
    maxWidth: maxW,
    minWidth: 36,
  };

  let body: ReactNode;
  if (m.type === "voice") {
    body = (
      <div className="relative" style={{ maxWidth: maxW }}>
        {quote && <div style={{ background: bg, color: fg, borderRadius: RADIUS, padding: "8px 13px 2px", marginBottom: 2 }}>{quote}</div>}
        <Voice m={m} p={p} mine={mine} lang={lang} rtl={rtl} />
        {chip}
      </div>
    );
  } else if (m.type === "image") {
    body = (
      <div className="flex flex-col" style={{ alignItems: onRight ? "flex-end" : "flex-start", gap: 4 }}>
        {quote && (
          <div style={{ ...bubble, maxWidth: 220 }}>
            {quote}
          </div>
        )}
        <div className="relative" style={{ width: 220 }}>
        {!caption && chip}
        <div className="overflow-hidden" style={{ width: 220, borderRadius: 18 }}>
          {m.imageSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={m.imageSrc}
              alt=""
              draggable={false}
              style={{ display: "block", width: "100%", height: "auto", maxHeight: 300, objectFit: "cover" }}
            />
          ) : (
            <div className="flex items-center justify-center" style={{ height: 165, background: p.imgEmpty }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                <rect x="3.5" y="4.5" width="17" height="15" rx="3" stroke={p.imgEmptyIcon} strokeWidth="1.5" />
                <circle cx="9" cy="9.6" r="1.6" fill={p.imgEmptyIcon} />
                <path d="m4 17.5 4.6-4.6 3.4 3.3 2.6-2.5 5.4 5" stroke={p.imgEmptyIcon} strokeWidth="1.5" strokeLinejoin="round" />
              </svg>
            </div>
          )}
        </div>
        </div>
        {caption && (
          <div className="relative whitespace-pre-wrap break-words" dir={dirOf(caption)} style={bubble}>
            {caption}
            {chip}
          </div>
        )}
      </div>
    );
  } else if (emoji) {
    const size = emoji === 1 ? 46 : emoji === 2 ? 40 : 36;
    body = (
      <div className="relative" style={{ fontSize: size, lineHeight: `${Math.round(size * 1.18)}px`, padding: "0 2px" }}>
        {m.text.trim()}
        {chip}
      </div>
    );
  } else {
    body = (
      <div className="relative" style={bubble}>
        {quote}
        <div className="whitespace-pre-wrap break-words" dir={dirOf(m.text)}>
          {m.text}
        </div>
        {chip}
      </div>
    );
  }

  const meta = showMeta ? <Meta m={m} p={p} lang={lang} mine={mine} status={status} /> : null;

  return (
    <div
      data-mid={m.id}
      data-sender={m.sender}
      className={`flex items-start ${mine ? "justify-end" : "justify-start"} ${live ? "sm-anim-in" : ""}`}
      style={{
        padding: `0 ${SIDE}px`,
        marginTop: isFirst ? 0 : firstOfGroup ? 16 : 4,
        paddingBottom: chip ? REACT_HANG - 4 : 0,
        transformOrigin: `${onRight ? "right" : "left"} bottom`,
      }}
    >
      {mine ? (
        <>
          {meta}
          {body}
        </>
      ) : (
        <>
          <div className="shrink-0" style={{ width: AVATAR, marginInlineEnd: AVATAR_GAP }}>
            {firstOfGroup && <SamsungAvatar person={them} size={AVATAR} />}
          </div>
          <div className="flex min-w-0 items-start">
            {body}
            {meta}
          </div>
        </>
      )}
    </div>
  );
}

/** Audio attachment: play disc | waveform | duration, inside a regular bubble. */
function Voice({ m, p, mine, lang, rtl }: { m: Message; p: Palette; mine: boolean; lang: Lang; rtl: boolean }) {
  const bars = waveform(m.id, 24);
  const fg = mine ? p.outText : p.inText;
  const disc = mine ? "#ffffff" : p.outBubble;
  const glyph = mine ? p.outBubble : "#ffffff";
  const wave = mine ? "rgba(255,255,255,0.72)" : p === DARK ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.38)";
  return (
    <div
      className="flex items-center"
      dir={rtl ? "rtl" : "ltr"}
      style={{
        background: mine ? p.outBubble : p.inBubble,
        color: fg,
        borderRadius: RADIUS + 2,
        paddingBlock: 6,
        paddingInlineStart: 6,
        paddingInlineEnd: 14,
        gap: 10,
      }}
    >
      <span className="flex shrink-0 items-center justify-center rounded-full" style={{ width: 32, height: 32, background: disc }}>
        <span style={{ marginInlineStart: rtl ? 0 : 2, marginInlineEnd: rtl ? -2 : 0 }}>
          <PlayGlyph color={glyph} />
        </span>
      </span>
      <span className="flex items-center" dir="ltr" style={{ gap: 2, height: 22 }}>
        {bars.map((h, i) => (
          <span key={i} style={{ width: 2.5, height: h, borderRadius: 2, background: wave, flexShrink: 0 }} />
        ))}
      </span>
      <span style={{ fontSize: 13, lineHeight: "16px", fontVariantNumeric: "tabular-nums" }}>
        {localDigits(m.voiceDuration || "0:07", lang)}
      </span>
    </div>
  );
}

function TypingRow({
  p,
  them,
  startsGroup,
  live,
  clockMs,
  rtl,
}: {
  p: Palette;
  them: Person;
  startsGroup: boolean;
  live: boolean;
  clockMs?: number;
  rtl: boolean;
}) {
  return (
    <div
      className={`flex items-start justify-start ${live ? "sm-anim-in" : ""}`}
      style={{ padding: `0 ${SIDE}px`, marginTop: startsGroup ? 16 : 4, transformOrigin: `${rtl ? "right" : "left"} bottom` }}
    >
      <div className="shrink-0" style={{ width: AVATAR, marginInlineEnd: AVATAR_GAP }}>
        {startsGroup && <SamsungAvatar person={them} size={AVATAR} />}
      </div>
      <div
        className="flex items-center justify-center"
        style={{ background: p.inBubble, borderRadius: RADIUS, height: 36, width: 62, gap: 5 }}
      >
        {[0, 1, 2].map((i) => {
          const st = clockMs !== undefined ? dotState((clockMs - i * DOT_STAGGER) / DOT_CYCLE) : null;
          return (
            <span
              key={i}
              className={st ? "block rounded-full" : "sm-dot block rounded-full"}
              style={{
                width: 7,
                height: 7,
                background: p.dot,
                animationDelay: st ? undefined : `${i * DOT_STAGGER}ms`,
                ...(st ?? {}),
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
