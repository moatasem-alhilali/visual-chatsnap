"use client";

/**
 * Apple Messages (iMessage) conversation screen — current shipping design.
 *
 * Design era: iOS 26 "Liquid Glass" (Sept 2025). iOS 27 (Sept 2026) kept the same
 * conversation chrome; its Messages changes were functional (Drawing app, RCS 2.7,
 * a "Show in Text Field" setting for the audio button), not visual.
 *   - https://9to5mac.com/2026/09/17/heres-everything-new-for-messages-in-ios-27/
 *   - https://9to5mac.com/2025/09/17/heres-everything-new-in-the-messages-app-with-ios-26/
 *
 * Key values:
 *  - Chrome: no opaque nav bar any more. Floating glass controls over the content
 *    with a soft "scroll edge" fade: glass circle back button (chevron.left in the
 *    label colour, not blue — iOS 26 glass bar items ignore tint,
 *    https://developer.apple.com/forums/thread/788176), centred contact photo with
 *    the name in a glass capsule beneath it, glass circle FaceTime (video) button.
 *    Glass is drawn as a semi-opaque solid + hairline + shadow (no backdrop-filter)
 *    so the snapdom exporter renders it identically.
 *  - Composer: glass "+" circle, glass capsule field with "iMessage" placeholder
 *    (UIKit placeholderText rgba(60,60,67,.3) / rgba(235,235,245,.3)) and a mic
 *    glyph (records audio in iOS 26; configurable in iOS 27).
 *  - Blue: iOS 26 systemBlue light rgb(0,136,255) #0088FF, dark rgb(0,145,255)
 *    #0091FF (Apple HIG color tables:
 *    https://developer.apple.com/design/human-interface-guidelines/color).
 *    Received bubble light #E9E9EB, dark #262629 (sampled from device; between
 *    systemGray5 and systemGray6).
 *  - Text: SF Pro 17pt body, 22pt line height, -0.43pt tracking. Bubble radius 18,
 *    insets 7/12, max width ~3/4 of the screen, 2pt between bubbles of one sender,
 *    10pt between senders.
 *  - Tail: the classic flared tail (body edge runs straight down, flares out ~6pt
 *    to a point on the baseline, underside curves back into the bottom edge),
 *    shape after the widely used Apple-matching bezier from
 *    https://stackoverflow.com/questions/57513290 (iMessage bubble shape) and
 *    https://samuelkraft.com/blog/ios-chat-bubbles-css. Only on the last bubble of
 *    a run.
 *  - Receipts: "Delivered" / "Read 9:41" (verb semibold) 11pt secondary grey,
 *    under the user's most recent outgoing message only, trailing-aligned.
 *  - Header stamp: "iMessage" over "Today 9:41" (day bold), 11pt grey, centred.
 *  - Typing: grey bubble with three pulsing dots + two trailing "thought" circles.
 *  - Monogram avatar: Contacts grey gradient with white initials.
 */

import type { CSSProperties } from "react";

import type { Message, Person } from "../../types";
import { Avatar, dirOf, SystemBottomBar, useChatScroll } from "../shared";
import { StatusBar } from "../devices/StatusBar";
import { CHROME, type Lang } from "./chrome";
import { groupInfo, type PlatformProps } from "./types";

/* ------------------------------- tokens ------------------------------- */

const IOS_FONT =
  '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "SF Pro", var(--font-inter), system-ui, var(--font-tajawal), sans-serif';

interface Palette {
  bg: string;
  /** background colour at a given alpha (for the scroll-edge fades) */
  bgA: (a: number) => string;
  label: string;
  secondary: string;
  placeholder: string;
  blue: string;
  inBubble: string;
  inText: string;
  hairline: string;
}

const LIGHT: Palette = {
  bg: "#ffffff",
  bgA: (a) => `rgba(255,255,255,${a})`,
  label: "#000000",
  secondary: "#8e8e93",
  placeholder: "rgba(60,60,67,0.3)",
  blue: "#0088ff",
  inBubble: "#e9e9eb",
  inText: "#000000",
  hairline: "rgba(0,0,0,0.08)",
};

const DARK: Palette = {
  bg: "#000000",
  bgA: (a) => `rgba(0,0,0,${a})`,
  label: "#ffffff",
  secondary: "#8e8e93",
  placeholder: "rgba(235,235,245,0.3)",
  blue: "#0091ff",
  inBubble: "#262629",
  inText: "#ffffff",
  hairline: "rgba(255,255,255,0.1)",
};

/** Liquid Glass control, drawn without backdrop-filter. */
function glass(dark: boolean): CSSProperties {
  return dark
    ? {
        background: "rgba(44,44,46,0.94)",
        boxShadow:
          "inset 0 0.5px 0 rgba(255,255,255,0.22), inset 0 0 0 0.5px rgba(255,255,255,0.1), 0 4px 16px rgba(0,0,0,0.45)",
      }
    : {
        background: "rgba(255,255,255,0.96)",
        boxShadow:
          "inset 0 0 0 0.5px rgba(0,0,0,0.05), 0 1px 3px rgba(0,0,0,0.05), 0 6px 20px rgba(0,0,0,0.08)",
      };
}

/** Strings the shared chrome map doesn't carry. "iMessage" is a brand name and
 *  stays untranslated on Arabic iOS too. */
const LOCAL: Record<Lang, { service: string; placeholder: string }> = {
  ar: { service: "iMessage", placeholder: "iMessage" },
  en: { service: "iMessage", placeholder: "iMessage" },
};

const BUBBLE_RADIUS = 18;
const SIDE_PAD = 15;
const HEADER_H = 54 + 82; // status bar + glass header row
const ROW_GAP_GROUP = 2;
const ROW_GAP_SENDER = 10;

/* ------------------------------ SF glyphs ------------------------------ */

function ChevronLeft({ color }: { color: string }) {
  return (
    <svg width="12" height="20" viewBox="0 0 12 20" fill="none" className="rtl:-scale-x-100">
      <path d="M10 2 2 10l8 8" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronRightSmall({ color }: { color: string }) {
  return (
    <svg width="6" height="10" viewBox="0 0 6 10" fill="none" className="rtl:-scale-x-100">
      <path d="M1.2 1.2 4.8 5 1.2 8.8" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** SF Symbol "video" (FaceTime). */
function VideoGlyph({ color }: { color: string }) {
  return (
    <svg width="26" height="18" viewBox="0 0 26 18" fill="none">
      <rect x="1" y="1.5" width="16" height="15" rx="4" stroke={color} strokeWidth="1.8" />
      <path
        d="M17.8 7.2 23 4.1c.7-.4 1.5.1 1.5.9v8c0 .8-.8 1.3-1.5.9l-5.2-3.1z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** SF Symbol "plus". */
function PlusGlyph({ color }: { color: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M9 1.5v15M1.5 9h15" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/** SF Symbol "mic". */
function MicGlyph({ color }: { color: string }) {
  return (
    <svg width="15" height="22" viewBox="0 0 15 22" fill="none">
      <rect x="4" y="1" width="7" height="12.5" rx="3.5" stroke={color} strokeWidth="1.7" />
      <path d="M1 10.2a6.5 6.5 0 0 0 13 0" stroke={color} strokeWidth="1.7" strokeLinecap="round" />
      <path d="M7.5 16.8V20.6" stroke={color} strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

/** SF Symbol "play.fill" (rounded triangle). */
function PlayGlyph({ color }: { color: string }) {
  return (
    <svg width="13" height="15" viewBox="0 0 13 15" fill="none">
      <path
        d="M1 2.1C1 1.1 2.1.5 3 1l8.9 5.3c.8.5.8 1.7 0 2.2L3 14c-.9.5-2-.1-2-1.1z"
        fill={color}
      />
    </svg>
  );
}

function PhotoGlyph({ color }: { color: string }) {
  return (
    <svg width="34" height="28" viewBox="0 0 34 28" fill="none">
      <rect x="1.5" y="1.5" width="31" height="25" rx="5" stroke={color} strokeWidth="2" />
      <circle cx="11" cy="10" r="3" fill={color} />
      <path d="M3 23l9-8 6 5 5-4 9 7" stroke={color} strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

/* ------------------------------- avatar ------------------------------- */

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Contacts-style avatar: the photo, or the grey gradient monogram. */
function ContactAvatar({ person, size, dark }: { person: Person; size: number; dark: boolean }) {
  if (person.avatar) return <Avatar person={person} size={size} />;
  const text = initials(person.name);
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full text-white"
      style={{
        width: size,
        height: size,
        background: dark
          ? "linear-gradient(180deg, #8d909a 0%, #6a6d76 100%)"
          : "linear-gradient(180deg, #a6abb7 0%, #858a95 100%)",
        fontSize: size * 0.42,
        fontWeight: 500,
        letterSpacing: "-0.02em",
      }}
    >
      {text || (
        // person.fill silhouette when there is no name
        <svg width={size * 0.56} height={size * 0.56} viewBox="0 0 24 24" fill="#ffffff">
          <circle cx="12" cy="8" r="4.6" />
          <path d="M3.5 21c.6-4.4 4.1-7 8.5-7s7.9 2.6 8.5 7z" />
        </svg>
      )}
    </div>
  );
}

/* ------------------------------- bubbles ------------------------------- */

/**
 * The flared iMessage tail, drawn in a box whose origin (0,0) sits on the
 * bubble's bottom trailing corner: the body edge is x=0, the baseline y=0.
 * It overlaps the rounded corner (same colour) and flares ~6pt outward.
 */
function Tail({ color, onRight }: { color: string; onRight: boolean }) {
  const style: CSSProperties = {
    position: "absolute",
    bottom: -1,
    width: 14,
    height: 19,
    ...(onRight ? { right: -6 } : { left: -6, transform: "scaleX(-1)" }),
  };
  return (
    <svg viewBox="-8 -18 14 19" style={style} aria-hidden>
      <path d="M0 -18V-12C0 -1 5 0 5 0H6C1 1 -3 -1 -7 -4L-8 -18Z" fill={color} />
    </svg>
  );
}

/** Up to three emoji with no other text render "jumbo", without a bubble. */
const EMOJI_ONLY = new RegExp("^(?:\\p{Extended_Pictographic}|\\p{Emoji_Component}|\\u200d|\\ufe0f|\\s)+$", "u");
function jumboEmoji(text: string): boolean {
  const t = text.trim();
  if (!t || !EMOJI_ONLY.test(t) || /^[\d#*\s]+$/.test(t)) return false;
  const count =
    typeof Intl !== "undefined" && "Segmenter" in Intl
      ? [...new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(t.replace(/\s/g, ""))].length
      : Array.from(t.replace(/\s/g, "")).length;
  return count <= 3;
}

/** Deterministic, speech-like waveform for a voice message. */
function waveform(seed: string, n = 30): number[] {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0;
    const r = (h % 1000) / 1000;
    const envelope = 0.35 + 0.65 * Math.sin((Math.PI * (i + 0.5)) / n);
    out.push(Math.max(3, Math.round(3 + r * 19 * envelope)));
  }
  return out;
}

function VoiceContent({ m, mine, dark }: { m: Message; mine: boolean; dark: boolean }) {
  const fg = mine ? "#ffffff" : dark ? "#ffffff" : "#000000";
  const bar = mine ? "rgba(255,255,255,0.6)" : dark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.32)";
  const bars = waveform(m.id);
  return (
    <div className="flex items-center" style={{ gap: 9, height: 26 }} dir="ltr">
      <PlayGlyph color={fg} />
      <div className="flex items-center" style={{ gap: 2, height: 24 }}>
        {bars.map((b, i) => (
          <span key={i} className="block rounded-full" style={{ width: 2, height: b, background: bar }} />
        ))}
      </div>
      <span
        style={{ color: fg, fontSize: 15, lineHeight: "20px", fontVariantNumeric: "tabular-nums", letterSpacing: "-0.2px" }}
      >
        {m.voiceDuration || "0:09"}
      </span>
    </div>
  );
}

function TypingBubble({ p, dark, live }: { p: Palette; dark: boolean; live: boolean }) {
  const dot = dark ? "#7c7c80" : "#8e8e93";
  return (
    <div className="flex" style={{ paddingInlineStart: SIDE_PAD + 2 }}>
      <div
        className={`relative flex items-center justify-center ${live ? "rcss-anim-pop" : ""}`}
        style={{ width: 58, height: 37, borderRadius: 19, background: p.inBubble, gap: 4.5 }}
      >
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="block rounded-full"
            style={{
              width: 8.5,
              height: 8.5,
              background: dot,
              animation: "imsgTypingDot 1.3s ease-in-out infinite",
              animationDelay: `${i * 0.2}s`,
            }}
          />
        ))}
        {/* trailing "thought" circles */}
        <span
          className="absolute block rounded-full"
          style={{ width: 13, height: 13, background: p.inBubble, insetInlineStart: -2, bottom: -2 }}
        />
        <span
          className="absolute block rounded-full"
          style={{ width: 6, height: 6, background: p.inBubble, insetInlineStart: -7, bottom: -7 }}
        />
      </div>
    </div>
  );
}

/* ------------------------------ component ------------------------------ */

export function IMessage({ scenario, playback, lang, rtl }: PlatformProps) {
  const dark = scenario.theme === "dark";
  const p = dark ? DARK : LIGHT;
  const c = CHROME[lang];
  const l = LOCAL[lang];
  const { messages, typing } = playback;
  const live = playback.isLive;
  const scrollRef = useChatScroll<HTMLDivElement>(`${messages.length}-${typing}`);
  const iphone = scenario.device === "iphone";
  const footerPad = iphone ? 84 : 100;

  // The receipt sits under the user's most recent outgoing message, even if
  // replies came in after it — exactly like Messages.
  let lastMineId: string | undefined;
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].sender === "me") {
      lastMineId = messages[i].id;
      break;
    }
  }

  const stampTime = scenario.messages[0]?.time || "9:41";

  return (
    <div
      className="relative h-full w-full overflow-hidden"
      style={{ background: p.bg, fontFamily: IOS_FONT, WebkitFontSmoothing: "antialiased" }}
    >
      {/* Typing dots pulse (opacity), like the real indicator — no bounce. */}
      <style>{`@keyframes imsgTypingDot{0%,60%,100%{opacity:.4;transform:scale(.92)}30%{opacity:1;transform:scale(1)}}`}</style>

      {/* ------------------------------ body ------------------------------ */}
      <div ref={scrollRef} className="rcss-scroll absolute inset-0 overflow-y-auto">
        <div style={{ paddingTop: HEADER_H, paddingBottom: footerPad + 6 }}>
          {/* Service + time stamp */}
          <div className="text-center" style={{ color: p.secondary, fontSize: 11, lineHeight: "13px", fontWeight: 500, marginTop: 6, marginBottom: 10 }}>
            <div>{l.service}</div>
            <div>
              <span style={{ fontWeight: 600 }}>{c.today}</span> {stampTime}
            </div>
          </div>

          <div className="flex flex-col">
            {messages.map((m, i) => {
              const mine = m.sender === "me";
              const { firstOfGroup, lastOfGroup } = groupInfo(messages, i);
              const onRight = mine ? !rtl : rtl;
              const bubbleBg = mine ? p.blue : p.inBubble;
              const textColor = mine ? "#ffffff" : p.inText;
              const status = mine && m.id === lastMineId ? playback.statusOf(m) : undefined;
              const anim = live ? (mine ? "rcss-anim-spring" : "rcss-anim-pop") : "";
              const origin = onRight ? "100% 100%" : "0% 100%";
              const hasText = m.text.trim().length > 0;
              const jumbo = m.type === "text" && jumboEmoji(m.text);

              const textBubble = (tail: boolean) => (
                <div
                  className="relative"
                  style={{
                    maxWidth: "74%",
                    background: bubbleBg,
                    color: textColor,
                    borderRadius: BUBBLE_RADIUS,
                    padding: "7px 12px",
                  }}
                >
                  <p
                    dir={dirOf(m.text)}
                    className="whitespace-pre-wrap break-words"
                    style={{ fontSize: 17, lineHeight: "22px", letterSpacing: "-0.43px", margin: 0 }}
                  >
                    {m.text}
                  </p>
                  {tail && <Tail color={bubbleBg} onRight={onRight} />}
                </div>
              );

              let content: React.ReactNode;
              if (m.type === "voice") {
                content = (
                  <div
                    className="relative"
                    style={{ background: bubbleBg, borderRadius: BUBBLE_RADIUS, padding: "6px 14px 6px 13px" }}
                  >
                    <VoiceContent m={m} mine={mine} dark={dark} />
                    {lastOfGroup && <Tail color={bubbleBg} onRight={onRight} />}
                  </div>
                );
              } else if (m.type === "image") {
                content = (
                  <>
                    <div
                      className="overflow-hidden"
                      style={{ width: 236, borderRadius: BUBBLE_RADIUS, boxShadow: `inset 0 0 0 0.5px ${p.hairline}` }}
                    >
                      {m.imageSrc ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={m.imageSrc}
                          alt=""
                          draggable={false}
                          className="block"
                          style={{ width: 236, height: "auto", maxHeight: 320, objectFit: "cover" }}
                        />
                      ) : (
                        <div
                          className="flex items-center justify-center"
                          style={{ width: 236, height: 176, background: dark ? "#1c1c1e" : "#f2f2f7" }}
                        >
                          <PhotoGlyph color={p.secondary} />
                        </div>
                      )}
                    </div>
                    {hasText && (
                      <div className="flex w-full flex-col" style={{ marginTop: ROW_GAP_GROUP, alignItems: mine ? "flex-end" : "flex-start" }}>
                        {textBubble(lastOfGroup)}
                      </div>
                    )}
                  </>
                );
              } else if (jumbo) {
                content = (
                  <div dir="ltr" style={{ fontSize: 48, lineHeight: "56px", padding: "0 2px" }}>
                    {m.text.trim()}
                  </div>
                );
              } else {
                content = textBubble(lastOfGroup);
              }

              return (
                <div
                  key={m.id}
                  data-mid={m.id}
                  className="flex flex-col"
                  style={{
                    alignItems: mine ? "flex-end" : "flex-start",
                    paddingInline: SIDE_PAD,
                    marginTop: i === 0 ? 0 : firstOfGroup ? ROW_GAP_SENDER : ROW_GAP_GROUP,
                  }}
                >
                  <div
                    className={`flex w-full flex-col ${anim}`}
                    style={{ alignItems: mine ? "flex-end" : "flex-start", transformOrigin: origin }}
                  >
                    {content}
                  </div>

                  {(status === "delivered" || status === "read") && (
                    <div
                      key={status}
                      className={live ? "rcss-anim-fade" : ""}
                      style={{
                        color: p.secondary,
                        fontSize: 11,
                        lineHeight: "13px",
                        fontWeight: 400,
                        marginTop: 4,
                        paddingInlineEnd: 2,
                      }}
                    >
                      {status === "read" ? (
                        <>
                          <span style={{ fontWeight: 600 }}>{c.read}</span> {m.time}
                        </>
                      ) : (
                        <span style={{ fontWeight: 600 }}>{c.delivered}</span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {typing && (
              <div style={{ marginTop: ROW_GAP_SENDER }}>
                <TypingBubble p={p} dark={dark} live={live} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ----------------------------- header ----------------------------- */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-10"
        style={{
          height: HEADER_H + 22,
          background: `linear-gradient(to bottom, ${p.bg} 0%, ${p.bgA(0.94)} 62%, ${p.bgA(0)} 100%)`,
        }}
      >
        <StatusBar device={scenario.device} tint={dark ? "light" : "dark"} background="transparent" />
        <div className="relative" style={{ height: 82 }}>
          {/* back */}
          <div
            className="absolute flex items-center justify-center rounded-full"
            style={{ ...glass(dark), insetInlineStart: 16, top: 6, width: 44, height: 44 }}
          >
            <span style={{ marginInlineEnd: 2 }}>
              <ChevronLeft color={p.label} />
            </span>
          </div>

          {/* contact */}
          <div className="absolute left-1/2 top-0 flex -translate-x-1/2 flex-col items-center">
            <ContactAvatar person={scenario.them} size={52} dark={dark} />
            <div
              className="flex items-center rounded-full"
              style={{ ...glass(dark), marginTop: -5, height: 25, paddingInline: "10px 8px", gap: 4, maxWidth: 200 }}
            >
              <span
                className="truncate"
                dir={dirOf(scenario.them.name)}
                style={{ color: p.label, fontSize: 12.5, fontWeight: 600, letterSpacing: "-0.1px" }}
              >
                {scenario.them.name}
              </span>
              <ChevronRightSmall color={p.secondary} />
            </div>
          </div>

          {/* FaceTime */}
          <div
            className="absolute flex items-center justify-center rounded-full"
            style={{ ...glass(dark), insetInlineEnd: 16, top: 6, width: 44, height: 44 }}
          >
            <VideoGlyph color={p.label} />
          </div>
        </div>
      </div>

      {/* ---------------------------- composer ---------------------------- */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-10"
        style={{
          paddingTop: 18,
          background: `linear-gradient(to top, ${p.bg} 0%, ${p.bgA(0.94)} 60%, ${p.bgA(0)} 100%)`,
        }}
      >
        <div className="flex items-center" style={{ gap: 8, paddingInline: 14, paddingBottom: 2 }}>
          <div
            className="flex shrink-0 items-center justify-center rounded-full"
            style={{ ...glass(dark), width: 38, height: 38 }}
          >
            <PlusGlyph color={p.label} />
          </div>
          <div
            className="flex flex-1 items-center rounded-full"
            style={{ ...glass(dark), height: 38, paddingInlineStart: 15, paddingInlineEnd: 12 }}
          >
            <span className="flex-1" style={{ color: p.placeholder, fontSize: 17, letterSpacing: "-0.43px" }}>
              {l.placeholder}
            </span>
            <MicGlyph color={p.secondary} />
          </div>
        </div>
        <SystemBottomBar device={scenario.device} bg="transparent" fg={p.label} />
      </div>
    </div>
  );
}
