"use client";

/**
 * Snapchat — Chat screen (iOS), 2025-2026 layout. Shared renderer for the
 * Android variant (SnapchatAndroid.tsx) via `SnapchatScreen`.
 *
 * Spec notes (key values; cross-checked where public sources exist):
 * - Chat is NOT bubble based. Consecutive messages from one sender are grouped
 *   under an uppercase bold sender label ("ME" for yourself, always — never
 *   your display name; the friend's display name for them). Label colors:
 *   ME = Snapchat red #F23C57, friend = chat blue #0EADFF. Each message line
 *   carries a 2px rounded colored bar on the leading edge; text itself is plain
 *   (#000 light / #fff dark), ~16px, no bubble.
 * - Color semantics (sender sees arrows, receiver sees squares):
 *   blue = Chat, red = Snap without audio, purple = Snap with audio.
 *   Filled arrow = delivered/unopened, hollow arrow = opened.
 *   Sources: https://www.itgeared.com/what-does-opened-mean-on-snapchat ,
 *   https://www.itgeared.com/what-does-the-blue-delivery-mean-on-snapchat ,
 *   https://www.businessinsider.in/what-those-confusing-icons-in-snapchat-actually-mean/articleshow/49714876.cms
 * - Day divider: small grey uppercase "TODAY", centered.
 * - Header: back chevron, round avatar (Bitmoji), bold name (+ optional
 *   subtitle), call + video buttons in light-grey circles.
 * - Input bar: grey camera circle, rounded "Send a chat" field with mic,
 *   then sticker, memories and games (rocket) icons.
 * - Friend presence: their Bitmoji peeks in at the bottom-start of the chat when
 *   they are in the conversation; while typing it shows a typing bubble.
 * - Dark mode ("App Appearance → Always Dark"): dark grey, not pure black.
 *   https://www.androidheadlines.com/?p=1076121 ,
 *   https://bgr.com/guides/how-to-enable-snapchat-dark-mode/
 * - iOS UI type: Avenir Next (system font on Apple devices) — falls back to the
 *   device font elsewhere. Exact hexes for dark surfaces are eyeballed
 *   (#121212 bg / #262626 fields), not officially published.
 */

import type { ReactNode } from "react";

import type { DeliveryStatus, Message } from "../../types";
import { Avatar, dirOf, SystemBottomBar, useChatScroll } from "../shared";
import { StatusBar } from "../devices/StatusBar";
import { SamsungStatusBar } from "../devices/SamsungStatusBar";
import { CHROME, type Lang } from "./chrome";
import { groupInfo, type PlatformProps } from "./types";

export const SNAP_RED = "#f23c57";
export const SNAP_BLUE = "#0eadff";

/** Snapchat-specific strings not present in the shared CHROME map. */
const SNAP_STR: Record<Lang, { me: string; sendAChat: string; sending: string; typing: string }> = {
  en: { me: "ME", sendAChat: "Send a chat", sending: "Sending…", typing: "Typing…" },
  ar: { me: "أنا", sendAChat: "أرسل دردشة", sending: "جارٍ الإرسال…", typing: "يكتب…" },
};

const IOS_FONT =
  '"Avenir Next", -apple-system, BlinkMacSystemFont, "SF Pro Text", var(--font-inter), system-ui, var(--font-tajawal), sans-serif';

type Os = "ios" | "android";

interface Palette {
  bg: string;
  fg: string;
  sub: string;
  field: string;
  fieldText: string;
  icon: string;
  voiceBg: string;
}

function palette(dark: boolean): Palette {
  return dark
    ? {
        bg: "#121212",
        fg: "#ffffff",
        sub: "#8a8d91",
        field: "#262626",
        fieldText: "#8a8d91",
        icon: "#ffffff",
        voiceBg: "#262626",
      }
    : {
        bg: "#ffffff",
        fg: "#000000",
        sub: "#8e9196",
        field: "#f0f0f0",
        fieldText: "#8e9196",
        icon: "#000000",
        voiceBg: "#f0f0f0",
      };
}

/* ------------------------------- glyphs ------------------------------- */

/** Snapchat chat arrow: filled = delivered, hollow = opened. Mirrors in RTL. */
export function SnapArrow({ opened, color, size = 12 }: { opened: boolean; color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className="shrink-0 rtl:-scale-x-100">
      <path
        d="M2.2 2.3 14 8 2.2 13.7 4.6 8z"
        fill={opened ? "none" : color}
        stroke={color}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BackChevron({ color, os }: { color: string; os: Os }) {
  return os === "ios" ? (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="shrink-0 rtl:-scale-x-100">
      <path d="M15 4.5 7.5 12l7.5 7.5" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ) : (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="shrink-0 rtl:-scale-x-100">
      <path d="M14.5 5 7.5 12l7 7" stroke={color} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CircleButton({ bg, size = 36, children }: { bg: string; size?: number; children: ReactNode }) {
  return (
    <span className="flex shrink-0 items-center justify-center rounded-full" style={{ width: size, height: size, background: bg }}>
      {children}
    </span>
  );
}

function PhoneIcon({ color }: { color: string }) {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
      <path
        d="M7.2 3.5h-2A1.7 1.7 0 0 0 3.5 5.3C3.8 13.5 10.5 20.2 18.7 20.5a1.7 1.7 0 0 0 1.8-1.7v-2a1.5 1.5 0 0 0-1.2-1.5l-2.8-.6a1.5 1.5 0 0 0-1.4.4l-1.2 1.2a12 12 0 0 1-5-5l1.2-1.2a1.5 1.5 0 0 0 .4-1.4l-.6-2.8A1.5 1.5 0 0 0 7.2 3.5z"
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function VideoIcon({ color }: { color: string }) {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none">
      <rect x="2.5" y="6" width="13" height="12" rx="3.2" stroke={color} strokeWidth="2" />
      <path d="m15.5 10.2 4.4-2.6c.6-.3 1.1 0 1.1.7v7.4c0 .7-.5 1-1.1.7l-4.4-2.6" stroke={color} strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

function CameraIcon({ color }: { color: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path
        d="M4.5 7.5h2.6l1.5-2.2c.3-.4.7-.6 1.2-.6h4.4c.5 0 .9.2 1.2.6l1.5 2.2h2.6A2 2 0 0 1 21.5 9.5v8.5a2 2 0 0 1-2 2h-15a2 2 0 0 1-2-2V9.5a2 2 0 0 1 2-2z"
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="13.6" r="3.4" stroke={color} strokeWidth="2" />
    </svg>
  );
}

function MicIcon({ color }: { color: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <rect x="9" y="3" width="6" height="11" rx="3" stroke={color} strokeWidth="2" />
      <path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/** Sticker: smiley on a square with a peeled corner. */
function StickerIcon({ color }: { color: string }) {
  return (
    <svg width="23" height="23" viewBox="0 0 24 24" fill="none">
      <path
        d="M14.5 21H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v7.5L14.5 21z"
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M14.5 21v-3.5a3 3 0 0 1 3-3H21" stroke={color} strokeWidth="2" strokeLinejoin="round" />
      <circle cx="9" cy="9.5" r="1.2" fill={color} />
      <circle cx="15" cy="9.5" r="1.2" fill={color} />
      <path d="M8.3 13.5c.9 1.2 2.2 1.8 3.7 1.8" stroke={color} strokeWidth="1.9" strokeLinecap="round" />
    </svg>
  );
}

/** Memories: two stacked photo cards. */
function MemoriesIcon({ color }: { color: string }) {
  return (
    <svg width="23" height="23" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="6.5" width="14" height="14" rx="3" stroke={color} strokeWidth="2" />
      <path d="M7 3.5h10a4 4 0 0 1 4 4v10" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/** Games & Minis rocket. */
function RocketIcon({ color }: { color: string }) {
  return (
    <svg width="23" height="23" viewBox="0 0 24 24" fill="none" className="rtl:-scale-x-100">
      <path
        d="M9.2 14.8 6.4 12c1.6-4.6 5.4-8.3 13.1-8.5-.2 7.7-3.9 11.5-8.5 13.1l-1.8-1.8z"
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle cx="14.6" cy="9.4" r="1.7" stroke={color} strokeWidth="1.8" />
      <path d="M6.4 12H3.6l2.6-3.2h3.4M12 17.6v2.8l3.2-2.6v-3.4M4.5 19.5c.3-1.6.9-2.5 2-3" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ----------------------------- message parts ----------------------------- */

function VoiceNote({ accent, p, duration }: { accent: string; p: Palette; duration?: string }) {
  const bars = [6, 10, 7, 14, 9, 17, 12, 7, 15, 10, 8, 13, 6, 11, 8, 14, 9, 6, 10, 7];
  return (
    <div
      className="inline-flex items-center gap-2.5 rounded-full py-1.5 pe-3.5 ps-1.5"
      style={{ background: p.voiceBg, minWidth: 200 }}
    >
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full" style={{ background: accent }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="#fff">
          <path d="M7 4.5v15c0 .8.9 1.3 1.6.8l11-7.5a1 1 0 0 0 0-1.6l-11-7.5C7.9 3.2 7 3.7 7 4.5z" />
        </svg>
      </span>
      <span className="flex h-6 flex-1 items-center gap-[2px]">
        {bars.map((b, i) => (
          <span key={i} className="shrink-0" style={{ width: 2.5, height: b, borderRadius: 2, background: accent, opacity: i < 5 ? 1 : 0.55 }} />
        ))}
      </span>
      <span className="text-[12px] font-semibold tabular-nums" style={{ color: p.sub }}>
        {duration ?? "0:08"}
      </span>
    </div>
  );
}

function receiptLabel(status: DeliveryStatus, lang: Lang): string {
  const c = CHROME[lang];
  if (status === "read") return c.snapOpened;
  if (status === "delivered") return c.snapDelivered;
  return SNAP_STR[lang].sending;
}

/* -------------------------------- screen -------------------------------- */

export function SnapchatScreen({ scenario, playback, lang, rtl, os }: PlatformProps & { os: Os }) {
  const dark = scenario.theme === "dark";
  const p = palette(dark);
  const s = SNAP_STR[lang];
  const c = CHROME[lang];
  const { messages, typing } = playback;
  const live = playback.isLive;
  const scrollRef = useChatScroll<HTMLDivElement>(`${messages.length}-${typing}`);
  const android = os === "android";

  const showTyping = typing || (!live && scenario.presence === "typing");
  const showPeek = !showTyping && scenario.presence === "online";
  const subtitle = showTyping ? s.typing : scenario.presence === "lastseen" ? scenario.lastSeenText : "";

  const meLabel = s.me;
  const themLabel = (scenario.them.name || "").toUpperCase();

  // Receipt sits under my latest message, only while it is the newest line.
  const last = messages[messages.length - 1];
  const receiptId = last && last.sender === "me" ? last.id : null;

  const textSize = android ? 15.5 : 16;
  const textLine = 21;

  return (
    <div
      className="flex h-full w-full flex-col"
      style={{ background: p.bg, ...(android ? {} : { fontFamily: IOS_FONT }) }}
    >
      {android ? (
        <SamsungStatusBar tint={dark ? "light" : "dark"} background={p.bg} lang={lang} />
      ) : (
        <StatusBar device={scenario.device} tint={dark ? "light" : "dark"} background={p.bg} />
      )}

      {/* Header */}
      <div
        className={`flex items-center ${android ? "gap-2.5 px-2.5 pb-2 pt-1.5" : "gap-2 px-2.5 pb-2 pt-0.5"}`}
        style={{ background: p.bg }}
      >
        <BackChevron color={p.icon} os={os} />
        <Avatar person={scenario.them} size={android ? 36 : 38} />
        <div className="min-w-0 flex-1 leading-tight" style={{ paddingInlineStart: 2 }}>
          <div className="truncate font-bold" style={{ color: p.fg, fontSize: android ? 17 : 17.5, letterSpacing: -0.1 }}>
            {scenario.them.name}
          </div>
          {subtitle && (
            <div className="truncate text-[12.5px] font-medium" style={{ color: p.sub, marginTop: 1 }}>
              {subtitle}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <CircleButton bg={p.field} size={android ? 36 : 38}>
            <PhoneIcon color={p.icon} />
          </CircleButton>
          <CircleButton bg={p.field} size={android ? 36 : 38}>
            <VideoIcon color={p.icon} />
          </CircleButton>
        </div>
      </div>

      {/* Body */}
      <div
        ref={scrollRef}
        className="rcss-scroll min-h-0 flex-1 overflow-y-auto pb-2 pt-3"
        style={{ background: p.bg, paddingInline: android ? 12 : 14 }}
      >
        <div className="mb-3 text-center text-[11.5px] font-bold uppercase tracking-[0.06em]" style={{ color: p.sub }}>
          {c.today}
        </div>

        <div className="flex flex-col">
          {messages.map((m: Message, i) => {
            const mine = m.sender === "me";
            const accent = mine ? SNAP_RED : SNAP_BLUE;
            const { firstOfGroup } = groupInfo(messages, i);
            const status = playback.statusOf(m);
            const caption = m.type === "image" ? m.text.trim() : "";
            return (
              <div
                key={m.id}
                data-mid={m.id}
                className={live ? "rcss-anim-rise" : ""}
                style={{ marginTop: i === 0 ? 0 : firstOfGroup ? 14 : 3 }}
              >
                {firstOfGroup && (
                  <div
                    className="mb-[3px] truncate font-bold uppercase"
                    style={{ color: accent, fontSize: android ? 11.5 : 12, letterSpacing: "0.02em", lineHeight: "15px" }}
                  >
                    {mine ? meLabel : themLabel}
                  </div>
                )}
                <div className="flex items-stretch" style={{ gap: 9 }}>
                  <span className="shrink-0 rounded-full" style={{ width: 2, background: accent }} />
                  <div className="min-w-0 flex-1 py-px">
                    {m.type === "voice" ? (
                      <VoiceNote accent={accent} p={p} duration={m.voiceDuration} />
                    ) : m.type === "image" && m.imageSrc ? (
                      <div className="flex flex-col gap-1">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={m.imageSrc}
                          alt=""
                          draggable={false}
                          className="block object-cover"
                          style={{ maxWidth: "68%", maxHeight: 280, borderRadius: 12 }}
                        />
                        {caption && (
                          <div
                            dir={dirOf(caption)}
                            className="whitespace-pre-wrap break-words"
                            style={{ color: p.fg, fontSize: textSize, lineHeight: `${textLine}px`, textAlign: rtl ? "right" : "left" }}
                          >
                            {caption}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div
                        dir={dirOf(m.text)}
                        className="whitespace-pre-wrap break-words"
                        style={{ color: p.fg, fontSize: textSize, lineHeight: `${textLine}px`, textAlign: rtl ? "right" : "left" }}
                      >
                        {m.text}
                      </div>
                    )}
                  </div>
                </div>
                {mine && m.id === receiptId && (
                  <div
                    className={`mt-1.5 flex items-center gap-1.5 font-semibold ${live ? "rcss-anim-fade" : ""}`}
                    key={status}
                    style={{ color: p.sub, fontSize: 11.5, paddingInlineStart: 11 }}
                  >
                    {status !== "sent" && <SnapArrow opened={status === "read"} color={SNAP_BLUE} size={11} />}
                    {receiptLabel(status, lang)}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Friend presence: their Bitmoji peeks in; while typing it shows a bubble. */}
        {(showTyping || showPeek) && (
          <div className={`mt-4 flex items-end gap-1.5 ${live ? "rcss-anim-rise" : ""}`}>
            <Avatar person={scenario.them} size={30} />
            {showTyping && (
              <div
                className="mb-1 flex items-center gap-[5px] rounded-full px-3 py-2"
                style={{ background: p.field }}
              >
                {[0, 1, 2].map((d) => (
                  <span
                    key={d}
                    className="rcss-typing-dot inline-block rounded-full"
                    style={{ width: 6, height: 6, background: SNAP_BLUE, animationDelay: `${d * 0.18}s` }}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Input bar */}
      <div
        className={`flex items-center ${android ? "gap-2 px-2 pb-2 pt-1.5" : "gap-2 px-2.5 pb-1.5 pt-1.5"}`}
        style={{ background: p.bg }}
      >
        <CircleButton bg={p.field} size={40}>
          <CameraIcon color={p.icon} />
        </CircleButton>
        <div
          className="flex min-w-0 flex-1 items-center rounded-full ps-3.5 pe-2.5"
          style={{ background: p.field, height: 40 }}
        >
          <span className="flex-1 truncate" style={{ color: p.fieldText, fontSize: android ? 15.5 : 16 }}>
            {s.sendAChat}
          </span>
          <MicIcon color={p.icon} />
        </div>
        <div className="flex items-center gap-2.5 px-0.5">
          <StickerIcon color={p.icon} />
          <MemoriesIcon color={p.icon} />
          <RocketIcon color={p.icon} />
        </div>
      </div>
      <SystemBottomBar device={android ? "android" : scenario.device} bg={p.bg} fg={dark ? "#ffffff" : "#000000"} />
    </div>
  );
}

export function Snapchat(props: PlatformProps) {
  return <SnapchatScreen {...props} os="ios" />;
}
