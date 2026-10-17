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
 * RTL: the whole screen mirrors (bar and label on the right, back chevron
 * points right, the send/receipt arrow flips). Phone, camcorder, camera, mic,
 * sticker, memories and rocket glyphs and the voice-note play triangle do NOT mirror.
 */

import type { CSSProperties, ReactNode } from "react";

import type { DeliveryStatus, Message } from "../../types";
import { Avatar, dirOf, SystemBottomBar, useChatScroll } from "../shared";
import { SamsungStatusBar } from "../devices/SamsungStatusBar";
import { CHROME, type Lang } from "./chrome";
import { groupInfo, type PlatformMotion, type PlatformProps } from "./types";

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
      };
}

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

const STR: Record<Lang, { me: string; sendAChat: string; sending: string; delivered: string; opened: string; today: string }> = {
  en: {
    me: "Me",
    sendAChat: "Send a chat",
    sending: "Sending...",
    delivered: CHROME.en.snapDelivered,
    opened: CHROME.en.snapOpened,
    today: CHROME.en.today,
  },
  ar: {
    me: "أنا",
    sendAChat: "أرسل دردشة",
    sending: "جارٍ الإرسال...",
    delivered: CHROME.ar.snapDelivered,
    opened: CHROME.ar.snapOpened,
    today: CHROME.ar.today,
  },
};

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

const KEYFRAMES = `
@keyframes snapand-enter{from{opacity:0;transform:translateY(${ENTER_RISE}px)}to{opacity:1;transform:translateY(0)}}
@keyframes snapand-fade{from{opacity:0}to{opacity:1}}
@keyframes snapand-peek{from{transform:translateY(100%)}to{transform:translateY(0)}}
@keyframes snapand-dot{0%{opacity:.35;transform:translateY(0)}30%{opacity:1;transform:translateY(-2.5px)}60%{opacity:.35;transform:translateY(0)}100%{opacity:.35;transform:translateY(0)}}
.snapand-enter{animation:snapand-enter ${ENTER_MS}ms cubic-bezier(.4,0,.2,1) both}
.snapand-fade{animation:snapand-fade 200ms linear both}
.snapand-peek{animation:snapand-peek 260ms cubic-bezier(.4,0,.2,1) both}
.snapand-dot{animation:snapand-dot ${DOT_CYCLE}ms linear infinite}
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
  const scrollRef = useChatScroll<HTMLDivElement>(`${messages.length}-${typing}`);

  const showTyping = typing || (!playback.isLive && scenario.presence === "typing");
  const showPresence = showTyping || scenario.presence === "online";
  const subtitle = scenario.presence === "lastseen" && !showTyping ? scenario.lastSeenText : "";
  const themLabel = scenario.them.name.trim() || "—";

  const last = messages[messages.length - 1];
  const receiptId = last && last.sender === "me" ? last.id : null;

  const textAlign: CSSProperties["textAlign"] = rtl ? "right" : "left";
  const textStyle: CSSProperties = {
    color: pal.text,
    fontSize: TEXT_SIZE,
    lineHeight: `${TEXT_LINE}px`,
    fontWeight: 400,
    textAlign,
  };

  return (
    <div className="flex h-full w-full flex-col" style={{ background: pal.bg, fontFamily: snapFont(scenario.androidFont) }}>
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
        <Avatar person={scenario.them} size={36} className="ms-0.5" />
        <div className="min-w-0 flex-1" style={{ marginInlineStart: 10 }}>
          <div className="truncate" style={{ color: pal.text, fontSize: 18, lineHeight: "23px", fontWeight: 700 }}>
            {scenario.them.name}
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
          const accent = mine ? ME_RED : THEM_BLUE;
          const { firstOfGroup, lastOfGroup } = groupInfo(messages, i);
          const status = playback.statusOf(m);
          const caption = m.type === "image" ? m.text.trim() : "";
          const emoji = m.type === "text" && isEmojiOnly(m.text);
          return (
            <div
              key={m.id}
              data-mid={m.id}
              data-sender={m.sender}
              className={live ? "snapand-enter" : undefined}
              style={{ paddingTop: firstOfGroup && i > 0 ? GROUP_GAP : 0 }}
            >
              {firstOfGroup && (
                <div
                  className="truncate uppercase"
                  style={{
                    color: accent,
                    fontSize: LABEL_SIZE,
                    lineHeight: `${LABEL_LINE}px`,
                    fontWeight: 600,
                    letterSpacing: "0.02em",
                    marginBottom: 3,
                  }}
                >
                  {mine ? s.me : themLabel}
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
                  {m.type === "voice" ? (
                    <VoiceNote accent={accent} pal={pal} duration={m.voiceDuration} />
                  ) : m.type === "image" ? (
                    <div className="flex flex-col" style={{ gap: 6, alignItems: "flex-start" }}>
                      <ChatImage src={m.imageSrc} pal={pal} />
                      {caption && (
                        <div dir={dirOf(caption)} className="w-full whitespace-pre-wrap break-words" style={textStyle}>
                          {caption}
                        </div>
                      )}
                    </div>
                  ) : emoji ? (
                    <div style={{ fontSize: 34, lineHeight: "42px", textAlign }}>{m.text.trim()}</div>
                  ) : (
                    <div dir={dirOf(m.text)} className="whitespace-pre-wrap break-words" style={textStyle}>
                      {m.text}
                    </div>
                  )}
                </div>
              </div>
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
            <div className="flex flex-col items-center">
              <div className={live ? "snapand-peek" : undefined} style={{ marginBottom: -7 }}>
                <Avatar person={scenario.them} size={30} />
              </div>
              <span
                className="relative truncate uppercase"
                style={{
                  maxWidth: 120,
                  height: 20,
                  lineHeight: "17px",
                  padding: "0 10px",
                  borderRadius: 10,
                  border: `1.5px solid ${THEM_BLUE}`,
                  background: pal.bg,
                  color: THEM_BLUE,
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.02em",
                }}
              >
                {themLabel}
              </span>
            </div>
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
                        background: THEM_BLUE,
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
      <div
        className="flex shrink-0 items-center"
        style={{ background: pal.bg, paddingInlineStart: SIDE, paddingInlineEnd: 12, paddingTop: 6, paddingBottom: 8 }}
      >
        <span className="flex shrink-0 items-center justify-center rounded-full" style={{ width: 36, height: 36, background: pal.button }}>
          <CameraGlyph color={pal.icon} />
        </span>
        <div
          className="flex min-w-0 flex-1 items-center"
          style={{ height: 36, borderRadius: 18, background: pal.field, marginInlineStart: 8, paddingInlineStart: 14, paddingInlineEnd: 8 }}
        >
          <span className="min-w-0 flex-1 truncate" style={{ color: pal.placeholder, fontSize: 16, fontWeight: 500 }}>
            {s.sendAChat}
          </span>
          <MicGlyph color={pal.icon} />
        </div>
        <div className="flex shrink-0 items-center" style={{ gap: 14, marginInlineStart: 13 }}>
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
