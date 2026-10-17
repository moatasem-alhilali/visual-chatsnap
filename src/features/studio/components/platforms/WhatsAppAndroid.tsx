"use client";

/**
 * WhatsApp for Android: chat screen, matching the 2024+ Material 3 refresh.
 * The top app bar is neutral (white in light mode, deep near-black in dark
 * mode) with no green, icons are outlined Material Symbols, and green appears
 * only on the mic FAB.
 *
 * Values used, and where they come from:
 *  - Bubbles: out #D9FDD3 / in #FFFFFF (light); out #144D37 / in #202C33 (dark).
 *    Text #111B21 / #E9EDEF; meta #667781 / #8696A0; chip & system greys from
 *    the WhatsApp palette: https://www.oppadu.com/tools/design-systems-site/brand/whatsapp.html
 *  - Neutral top bar, outlined rounded icons, darker dark mode, refreshed doodle:
 *    https://www.meta.com/design-at-meta/blog/whatsapp-user-interface-update/
 *  - Dark surface #0b141a (beta moved it to #0a1014):
 *    https://wabetainfo.com/whatsapp-beta-for-android-2-24-22-4-whats-new/
 *  - 2024 brand greens: FAB #1DAA61 with a white icon (light) and #21C063 with a
 *    dark icon (dark). Read ticks #53BDEB.
 *  - Android specifics: the tail is a sharp flag at the TOP corner of the FIRST
 *    bubble in a group, the bubble radius is about 8dp, and body text is 16sp.
 *    The composer floats over the wallpaper: pill field (emoji | "Message" |
 *    clip | camera) plus a round mic FAB.
 *
 * Doodle, ticks, waveform and E2E strings are shared with the iOS template.
 */

import { useState, type CSSProperties, type ReactNode } from "react";

import type { DeliveryStatus, Message, Person } from "../../types";
import { Avatar, dirOf, SystemBottomBar, useChatScroll } from "../shared";
import { SamsungStatusBar } from "../devices/SamsungStatusBar";
import { CHROME } from "./chrome";
import { groupInfo, type PlatformProps } from "./types";
import { WA_E2E, waDoodle, WaLock, waMetaWidth, waPresence, WaTicks, waWaveform } from "./WhatsApp";

interface AndroidPalette {
  bar: string;
  ink: string;
  sub: string;
  icon: string;
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
  placeholder: string;
  fab: string;
  fabIcon: string;
  chip: string;
  chipText: string;
  e2e: string;
  e2eText: string;
  dot: string;
  waveIn: string;
  waveOut: string;
  playIn: string;
  playOut: string;
  unplayed: string;
  navFg: string;
}

const LIGHT: AndroidPalette = {
  bar: "#ffffff",
  ink: "#111b21",
  sub: "#667781",
  icon: "#111b21",
  wall: "#efeae2",
  doodle: waDoodle("#5c4a2e", 0.11),
  inBubble: "#ffffff",
  outBubble: "#d9fdd3",
  text: "#111b21",
  meta: "#667781",
  metaOut: "#667781",
  read: "#53bdeb",
  shadow: "0 1px 0.5px rgba(11,20,26,0.13)",
  field: "#ffffff",
  placeholder: "#8696a0",
  fab: "#1daa61",
  fabIcon: "#ffffff",
  chip: "#ffffff",
  chipText: "#54656f",
  e2e: "#ffeecd",
  e2eText: "#54656f",
  dot: "#8696a0",
  waveIn: "#c5ccd0",
  waveOut: "#a6cfa0",
  playIn: "#54656f",
  playOut: "#54656f",
  unplayed: "#1daa61",
  navFg: "#3b4a54",
};

const DARK: AndroidPalette = {
  bar: "#0b141a",
  ink: "#e9edef",
  sub: "#8696a0",
  icon: "#e9edef",
  wall: "#0b141a",
  doodle: waDoodle("#ffffff", 0.06),
  inBubble: "#202c33",
  outBubble: "#144d37",
  text: "#e9edef",
  meta: "rgba(233,237,239,0.6)",
  metaOut: "rgba(233,237,239,0.6)",
  read: "#53bdeb",
  shadow: "0 1px 0.5px rgba(0,0,0,0.25)",
  field: "#202c33",
  placeholder: "#8696a0",
  fab: "#21c063",
  fabIcon: "#0b141a",
  chip: "#182229",
  chipText: "#8696a0",
  e2e: "#182229",
  e2eText: "#ffd279",
  dot: "#8696a0",
  waveIn: "#4f5b62",
  waveOut: "#4c8a6c",
  playIn: "#aebac1",
  playOut: "#d1e7dc",
  unplayed: "#21c063",
  navFg: "#e9edef",
};

/* ======================================================================
   Material Symbols (outlined) glyphs, 24dp grid
   ====================================================================== */

function MIcon({ d, color, size = 24, className }: { d: string; color: string; size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} style={{ display: "block", flexShrink: 0 }}>
      <path d={d} fill={color} />
    </svg>
  );
}

const ICON = {
  back: "M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z",
  videocam:
    "M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4zM15 16H5V8h10v8z",
  call: "M6.54 5c.06.89.21 1.76.45 2.59l-1.2 1.2c-.41-1.2-.67-2.47-.76-3.79h1.51m9.86 12.02c.85.24 1.72.39 2.6.45v1.49c-1.32-.09-2.59-.35-3.8-.75l1.2-1.19M7.5 3H4c-.55 0-1 .45-1 1 0 9.39 7.61 17 17 17 .55 0 1-.45 1-1v-3.49c0-.55-.45-1-1-1-1.24 0-2.45-.2-3.57-.57-.1-.04-.21-.05-.31-.05-.26 0-.51.1-.71.29l-2.2 2.2c-2.83-1.45-5.15-3.76-6.59-6.59l2.2-2.2c.28-.28.36-.67.25-1.02C8.7 6.45 8.5 5.25 8.5 4c0-.55-.45-1-1-1z",
  more: "M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z",
  attach:
    "M16.5 6v11.5c0 2.21-1.79 4-4 4s-4-1.79-4-4V5c0-1.38 1.12-2.5 2.5-2.5s2.5 1.12 2.5 2.5v10.5c0 .55-.45 1-1 1s-1-.45-1-1V6H10v9.5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5V5c0-2.21-1.79-4-4-4S7 2.79 7 5v12.5c0 3.04 2.46 5.5 5.5 5.5s5.5-2.46 5.5-5.5V6h-1.5z",
  camera:
    "M14.12 4l1.83 2H20v12H4V6h4.05l1.83-2h4.24M15 2H9L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2zm-3 7c1.65 0 3 1.35 3 3s-1.35 3-3 3-3-1.35-3-3 1.35-3 3-3m0-2c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5z",
  mic: "M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z",
  play: "M8 5.14v13.72c0 .79.87 1.27 1.54.84l10.8-6.86a1 1 0 0 0 0-1.69L9.54 4.3A1 1 0 0 0 8 5.14z",
  chevronDown: "M7.41 8.59 12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z",
};

/** WhatsApp's outlined sticker-smiley (emoji / sticker toggle in the composer). */
function EmojiSticker({ color }: { color: string }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ display: "block", flexShrink: 0 }}>
      <path
        d="M20.5 13.2V8A4.5 4.5 0 0 0 16 3.5H8A4.5 4.5 0 0 0 3.5 8v8A4.5 4.5 0 0 0 8 20.5h5.2z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M13.2 20.5v-2.8a4.5 4.5 0 0 1 4.5-4.5h2.8" stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M8.3 13.4c.9 1.2 2.3 1.8 3.8 1.6" stroke={color} strokeWidth="1.7" strokeLinecap="round" />
      <circle cx="9.2" cy="9.4" r="1.15" fill={color} />
      <circle cx="14.8" cy="9.4" r="1.15" fill={color} />
    </svg>
  );
}

/** The sharp "flag" tail at the top corner of the first bubble in a group. */
function Tail({ side, color }: { side: "left" | "right"; color: string }) {
  const right = side === "right";
  const d = right
    ? "M5.188 1H0v11.193l6.467-8.625C7.526 2.156 6.958 1 5.188 1z"
    : "M1.533 3.568 8 12.193V1H2.812C1.042 1 .474 2.156 1.533 3.568z";
  return (
    <svg
      width="8"
      height="13"
      viewBox="0 0 8 13"
      style={{ position: "absolute", top: 0, [right ? "right" : "left"]: -8, display: "block" }}
    >
      <path d={d} fill={color} />
    </svg>
  );
}

const RADIUS = 8;

export function WhatsAppAndroid({ scenario, playback, lang, rtl }: PlatformProps) {
  const dark = scenario.theme === "dark";
  const p = dark ? DARK : LIGHT;
  const c = CHROME[lang];
  const e2e = WA_E2E[lang];
  const uiDir = rtl ? "rtl" : "ltr";
  const { messages, typing } = playback;
  const live = playback.isLive;
  const scrollRef = useChatScroll<HTMLDivElement>(`${messages.length}-${typing}`);
  const [atBottom, setAtBottom] = useState(true);

  const scrollToBottom = () => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  };

  const subtitle = waPresence(typing, scenario.presence, scenario.lastSeenText, c.online, c.typing);
  const lastSender = messages.length ? messages[messages.length - 1].sender : null;
  const typingStartsGroup = lastSender !== "them";

  return (
    <div className="flex h-full w-full flex-col" style={{ background: p.bar, color: p.text }}>
      <SamsungStatusBar tint={dark ? "light" : "dark"} background={p.bar} lang={lang} />

      {/* Top app bar */}
      <div
        className="relative z-10 flex shrink-0 items-center"
        style={{ height: 58, background: p.bar, paddingInlineStart: 4, paddingInlineEnd: 10 }}
      >
        <div className="flex items-center justify-center" style={{ width: 36, height: 40 }}>
          <MIcon d={ICON.back} color={p.icon} className="rtl:-scale-x-100" />
        </div>
        <Avatar person={scenario.them} size={38} />
        <div className="min-w-0 flex-1" style={{ paddingInlineStart: 10, lineHeight: 1.2 }}>
          <div className="truncate" style={{ fontSize: 17, fontWeight: 500, color: p.ink }}>
            {scenario.them.name}
          </div>
          <div className="truncate" style={{ fontSize: 13, color: p.sub }}>
            {subtitle}
          </div>
        </div>
        <div className="flex items-center" style={{ gap: 22, paddingInlineStart: 8 }}>
          <MIcon d={ICON.videocam} color={p.icon} className="rtl:-scale-x-100" />
          <MIcon d={ICON.call} color={p.icon} size={22} className="rtl:-scale-x-100" />
          <MIcon d={ICON.more} color={p.icon} />
        </div>
      </div>

      {/* Wallpaper (fixed) holding the scrolling list + floating composer */}
      <div
        className="relative flex min-h-0 flex-1 flex-col"
        style={{ backgroundColor: p.wall, backgroundImage: p.doodle, backgroundSize: "240px 240px" }}
      >
        <div
          ref={scrollRef}
          onScroll={(e) => {
            const el = e.currentTarget;
            setAtBottom(el.scrollHeight - el.scrollTop - el.clientHeight < 60);
          }}
          className="rcss-scroll min-h-0 flex-1 overflow-y-auto"
          style={{ padding: "8px 0 6px" }}
        >
          {/* Date chip */}
          <div className="flex justify-center" style={{ padding: "2px 0 8px" }}>
            <span
              style={{
                background: p.chip,
                color: p.chipText,
                fontSize: 12.5,
                lineHeight: "16px",
                padding: "5px 12px",
                borderRadius: RADIUS,
                boxShadow: dark ? "none" : "0 1px 0.5px rgba(11,20,26,0.13)",
              }}
            >
              {c.today}
            </span>
          </div>

          {/* End-to-end encryption notice */}
          <div className="flex justify-center" style={{ padding: "0 28px 8px" }}>
            <div
              className="text-center"
              style={{
                background: p.e2e,
                color: p.e2eText,
                fontSize: 12.5,
                lineHeight: "17px",
                padding: "6px 12px 7px",
                borderRadius: RADIUS,
                boxShadow: dark ? "none" : "0 1px 0.5px rgba(11,20,26,0.13)",
              }}
            >
              <span style={{ display: "inline-block", marginInlineEnd: 4, verticalAlign: "-1px" }}>
                <WaLock color={p.e2eText} size={9} />
              </span>
              {e2e.body} <span style={{ color: dark ? "#53bdeb" : "#027eb5" }}>{e2e.more}</span>
            </div>
          </div>

          <div className="flex flex-col">
            {messages.map((m, i) => {
              const { firstOfGroup } = groupInfo(messages, i);
              return (
                <AndroidRow
                  key={m.id}
                  m={m}
                  p={p}
                  rtl={rtl}
                  uiDir={uiDir}
                  firstOfGroup={firstOfGroup}
                  status={playback.statusOf(m)}
                  person={m.sender === "me" ? scenario.me : scenario.them}
                  live={live}
                />
              );
            })}

            {typing && (
              <div
                className={`flex justify-start ${live ? "rcss-anim-fade" : ""}`}
                style={{ padding: "0 13px", marginTop: typingStartsGroup ? 8 : 2 }}
              >
                <div
                  className="relative flex items-center"
                  style={{
                    background: p.inBubble,
                    borderRadius: RADIUS,
                    borderTopLeftRadius: typingStartsGroup && !rtl ? 0 : RADIUS,
                    borderTopRightRadius: typingStartsGroup && rtl ? 0 : RADIUS,
                    boxShadow: p.shadow,
                    height: 34,
                    padding: "0 13px",
                    gap: 4,
                  }}
                >
                  {typingStartsGroup && <Tail side={rtl ? "right" : "left"} color={p.inBubble} />}
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

        {/* Scroll-to-bottom: bottom-end corner, only after the user scrolls up
            (hidden during playback, which always sticks to the bottom). */}
        {!live && !atBottom && (
          <button
            onClick={scrollToBottom}
            aria-label="scroll to bottom"
            className="absolute flex items-center justify-center rounded-full"
            style={{
              bottom: 72,
              insetInlineEnd: 12,
              width: 40,
              height: 40,
              background: p.field,
              boxShadow: "0 1px 3px rgba(11,20,26,0.3)",
            }}
          >
            <MIcon d={ICON.chevronDown} color={p.sub} />
          </button>
        )}

        {/* Composer (floats over the wallpaper) */}
        <div className="flex shrink-0 items-end" style={{ padding: "4px 6px 8px", gap: 6 }}>
          <div
            className="flex flex-1 items-center"
            style={{
              minHeight: 48,
              borderRadius: 24,
              background: p.field,
              boxShadow: dark ? "none" : "0 1px 0.5px rgba(11,20,26,0.13)",
              paddingInlineStart: 12,
              paddingInlineEnd: 14,
            }}
          >
            <EmojiSticker color={p.placeholder} />
            <span className="min-w-0 flex-1 truncate" style={{ fontSize: 17, color: p.placeholder, paddingInline: 10 }}>
              {c.message}
            </span>
            <div className="flex items-center" style={{ gap: 20 }}>
              <span style={{ transform: rtl ? "rotate(45deg) scaleX(-1)" : "rotate(-45deg)", display: "block" }}>
                <MIcon d={ICON.attach} color={p.placeholder} />
              </span>
              <MIcon d={ICON.camera} color={p.placeholder} />
            </div>
          </div>
          <div
            className="flex shrink-0 items-center justify-center rounded-full"
            style={{ width: 48, height: 48, background: p.fab, boxShadow: "0 1px 2px rgba(11,20,26,0.2)" }}
          >
            <MIcon d={ICON.mic} color={p.fabIcon} />
          </div>
        </div>
      </div>

      <SystemBottomBar device="android" bg={p.bar} fg={p.navFg} />
    </div>
  );
}

/* ======================================================================
   Message row
   ====================================================================== */

function AndroidRow({
  m,
  p,
  rtl,
  uiDir,
  firstOfGroup,
  status,
  person,
  live,
}: {
  m: Message;
  p: AndroidPalette;
  rtl: boolean;
  uiDir: "rtl" | "ltr";
  firstOfGroup: boolean;
  status: DeliveryStatus;
  person: Person;
  live: boolean;
}) {
  const mine = m.sender === "me";
  const onRight = mine ? !rtl : rtl;
  const bg = mine ? p.outBubble : p.inBubble;
  const metaColor = mine ? p.metaOut : p.meta;
  const tail = firstOfGroup;
  const caption = m.type === "image" ? m.text.trim() : "";
  const textDir = dirOf(m.text);

  const radius: CSSProperties = { borderRadius: RADIUS };
  if (tail) {
    if (onRight) radius.borderTopRightRadius = 0;
    else radius.borderTopLeftRadius = 0;
  }

  const meta = (overlay: boolean) => (
    <span
      className="inline-flex items-center whitespace-nowrap"
      style={{ fontSize: 11, lineHeight: "15px", gap: 3, color: overlay ? "#ffffff" : metaColor }}
    >
      {m.time}
      {mine && <WaTicks status={status} color={overlay ? "#ffffff" : metaColor} readColor={p.read} width={16} />}
    </span>
  );
  const reserve = waMetaWidth(m.time, mine, 6.3, 16);

  let body: ReactNode;
  let padding = "6px 9px 8px";
  let dir: "rtl" | "ltr" = textDir;

  if (m.type === "voice") {
    dir = uiDir;
    padding = "7px 9px 5px 7px";
    body = <AndroidVoice m={m} p={p} mine={mine} status={status} person={person} meta={meta(false)} />;
  } else if (m.type === "image") {
    padding = "3px";
    dir = caption ? textDir : uiDir;
    body = (
      <div style={{ width: 240 }}>
        <div className="relative overflow-hidden" style={{ borderRadius: RADIUS - 2 }}>
          {m.imageSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={m.imageSrc}
              alt=""
              draggable={false}
              style={{ display: "block", width: "100%", height: "auto", maxHeight: 320, objectFit: "cover" }}
            />
          ) : (
            <div
              className="flex items-center justify-center"
              style={{ width: "100%", height: 180, background: p === DARK ? "#2a3942" : "#e4e6e8" }}
            >
              <MIcon
                size={40}
                color={p === DARK ? "#667781" : "#aeb6bc"}
                d="M19 5v14H5V5h14m0-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-4.86 8.86-3 3.87L9 13.14 6 17h12l-3.86-5.14z"
              />
            </div>
          )}
          {!caption && (
            <>
              <span
                className="pointer-events-none absolute inset-x-0 bottom-0"
                style={{ height: 30, background: "linear-gradient(to top, rgba(0,0,0,0.38), rgba(0,0,0,0))" }}
              />
              <span className="absolute" style={{ bottom: 4, insetInlineEnd: 7 }}>
                {meta(true)}
              </span>
            </>
          )}
        </div>
        {caption && (
          <div className="relative" style={{ padding: "5px 6px 5px" }}>
            <span className="whitespace-pre-wrap break-words" style={{ fontSize: 16, lineHeight: "21px" }}>
              {caption}
            </span>
            <span style={{ display: "inline-block", width: reserve, height: 1 }} />
            <span className="absolute" style={{ bottom: 2, insetInlineEnd: 6 }}>
              {meta(false)}
            </span>
          </div>
        )}
      </div>
    );
  } else {
    body = (
      <>
        <span className="whitespace-pre-wrap break-words" style={{ fontSize: 16, lineHeight: "21px" }}>
          {m.text}
        </span>
        <span style={{ display: "inline-block", width: reserve, height: 1 }} />
        <span className="absolute" style={{ bottom: 4, insetInlineEnd: 8 }}>
          {meta(false)}
        </span>
      </>
    );
  }

  return (
    <div
      data-mid={m.id}
      className={`flex ${mine ? "justify-end" : "justify-start"}`}
      style={{ padding: "0 13px", marginTop: firstOfGroup ? 8 : 2 }}
    >
      <div
        className={`relative ${live ? (mine ? "rcss-anim-rise" : "rcss-anim-pop") : ""}`}
        dir={dir}
        style={{
          maxWidth: "80%",
          background: bg,
          color: p.text,
          boxShadow: p.shadow,
          padding,
          ...radius,
        }}
      >
        {tail && <Tail side={onRight ? "right" : "left"} color={bg} />}
        {body}
      </div>
    </div>
  );
}

/** Android voice note: avatar (mic badge) | play | waveform with duration + meta underneath. */
function AndroidVoice({
  m,
  p,
  mine,
  status,
  person,
  meta,
}: {
  m: Message;
  p: AndroidPalette;
  mine: boolean;
  status: DeliveryStatus;
  person: Person;
  meta: ReactNode;
}) {
  const bars = waWaveform(m.id, 24, 3, 22);
  const badge = mine ? (status === "read" ? p.read : p.dot) : p.unplayed;
  const wave = mine ? p.waveOut : p.waveIn;
  return (
    <div className="flex items-center" style={{ width: 232, gap: 8 }}>
      <div className="relative shrink-0">
        <Avatar person={person} size={46} />
        <span
          className="absolute flex items-center justify-center"
          style={{ bottom: -2, insetInlineEnd: -3, width: 18, height: 18 }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" style={{ display: "block" }}>
            <path d={ICON.mic} fill={badge} stroke={mine ? p.outBubble : p.inBubble} strokeWidth="2.6" paintOrder="stroke" />
          </svg>
        </span>
      </div>
      <MIcon d={ICON.play} size={30} color={mine ? p.playOut : p.playIn} />
      <div className="min-w-0 flex-1" style={{ paddingTop: 10 }}>
        <div className="relative flex items-center" style={{ height: 24, gap: 2 }}>
          {bars.map((h, i) => (
            <span key={i} style={{ width: 2.5, height: h, borderRadius: 2, background: wave, flexShrink: 0 }} />
          ))}
          <span
            className="absolute rounded-full"
            style={{ width: 12, height: 12, top: 6, insetInlineStart: -3, background: badge }}
          />
        </div>
        <div className="flex items-center justify-between" style={{ marginTop: 2 }}>
          <span style={{ fontSize: 11, lineHeight: "15px", color: mine ? p.metaOut : p.meta }}>
            {m.voiceDuration || "0:07"}
          </span>
          {meta}
        </div>
      </div>
    </div>
  );
}
