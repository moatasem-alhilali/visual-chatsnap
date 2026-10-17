"use client";

/*
 * Telegram for Android — chat screen replica (Telegram Android 12.4+ redesign, 2026, default themes).
 *
 * Values pulled from DrKLO/Telegram @ master (13.0.x):
 *  - TMessagesProj/src/main/java/org/telegram/ui/ActionBar/ThemeColors.java (defaults)
 *      actionBarDefault #ffffff, title DEFAULT_BLACK_TEXT #1a1d21, chat_inBubble #ffffff,
 *      chat_outBubble #efffde, chat_outTimeText #70b15c, chat_inTimeText #a1aab3,
 *      chat_outSentCheck(Read) #5db050, chat_messagePanelHint #858a84, chat_messageTextIn/Out #000,
 *      voice: outLoader #78c272, outVoiceSeekbar #bbe3ac, outAudioDurationText #65b05b,
 *      glass_defaultIcon #1b2227 @ .6, chat_mediaTimeBackground #000 @ .4
 *  - assets/bluebubbles.attheme ("Blue", default day theme, accent id 99 = #5890c5 over base #328acf;
 *      Theme.fillAccentColors hue-shift applied): chat_status #229af0 -> #519bda,
 *      actionBarDefaultSubtitle #838c96 -> #858b93, chat_inLoader -> #6aa9df, messagePanelSend -> #519bda
 *  - assets/darkblue.attheme ("Dark Blue", default night theme, accent id 9 #3581e3 over base #3685fa,
 *      shift applied): topPanel/messagePanel #212d3b -> #1f2b37, inBubble #232e3b -> #212c38,
 *      outBubble #3e618a -> #3b5d80, text #fafafa, outTime #8fbcdf -> #8ab6d5, inTime #8091a0@.85 -> #7d8e9b,
 *      outSentCheck #87c7ff -> #81c0f0, chat_status #73bbf7 -> #6eb4e6, subtitle #dbf2ff@.49,
 *      wallpaper gradient #0e141a #172431 #0f171e #141c2b, pattern intensity 38
 *  - Theme.createDefaultWallpaper(): MotionBackgroundDrawable #dbddbb #6ba587 #d5d88d #88b884, pattern 34
 *  - ActionBar/MessageDrawable.java: bubble radius SharedConfig.bubbleRadius = 17dp, merged corner 6dp,
 *      tail = arc rect (right-8, bottom-23, right+5, bottom-3) from 180° sweeping -83° (traced in Tail below)
 *  - SharedConfig.fontSize 16 (message text), Theme chat_timePaint 12dp, input text 18dp
 *  - ActionBar.setupGlass(): glass back / title / menu pills, radius 23dp; ChatAvatarContainer glass mode:
 *      avatar 42dp (radius 21), title 17.5dp, subtitle 13.5dp
 *  - Components/chat/ChatInputViewsContainer.java: input island radius 22dp, 9dp above the nav bar,
 *      7dp side margins, 44dp high; ChatActivityEnterView: emoji 44dp start, attach 44dp end,
 *      send/mic circle 38dp (3dp margin) filled chat_messagePanelSend with a white glyph
 *  - blur3/BlurredBackgroundColorProviderThemed.java: glass fill = panel colour @ .85, light stroke #fff,
 *      light shadow #000 @ .125, dark stroke #fff @ .16
 * No backdrop-filter is used (DOM snapshot export); fills are semi-opaque instead.
 */

import type { CSSProperties } from "react";

import type { DeliveryStatus, Message } from "../../types";
import { Avatar, dirOf, SystemBottomBar, useChatScroll } from "../shared";
import { SamsungStatusBar } from "../devices/SamsungStatusBar";
import { CHROME } from "./chrome";
import { groupInfo, type PlatformProps } from "./types";
import { metaReserve, TG_STRINGS, tgPatternUri, tgWallpaper, tgWaveform } from "./Telegram";

interface AndroidTheme {
  text: string;
  inBubble: string;
  outBubble: string;
  inTime: string;
  outTime: string;
  outCheck: string;
  headerIcon: string;
  title: string;
  subtitle: string;
  status: string;
  glassFill: string;
  glassShadow: string;
  inputIcon: string;
  hint: string;
  send: string;
  datePill: string;
  topFade: string;
  bottomFade: string;
  navFg: string;
  wallpaper: CSSProperties;
  bubbleFilter: string;
  voice: {
    in: { loader: string; seek: string; fill: string; duration: string };
    out: { loader: string; seek: string; fill: string; duration: string };
  };
}

const ANDROID_LIGHT: AndroidTheme = {
  text: "#000000",
  inBubble: "#ffffff",
  outBubble: "#efffde",
  inTime: "#a1aab3",
  outTime: "#70b15c",
  outCheck: "#5db050",
  headerIcon: "#1a1d21",
  title: "#1a1d21",
  subtitle: "#858b93",
  status: "#519bda",
  glassFill: "rgba(255, 255, 255, 0.86)",
  glassShadow: "0 1px 8px rgba(0,0,0,0.125), inset 0 1px 0 #ffffff, 0 0 0 0.5px rgba(0,0,0,0.04)",
  inputIcon: "rgba(27, 34, 39, 0.6)",
  hint: "#858a84",
  send: "#519bda",
  datePill: "rgba(94, 124, 78, 0.5)",
  topFade: "linear-gradient(to bottom, rgba(255,255,255,0.65) 0%, rgba(255,255,255,0.3) 60%, rgba(255,255,255,0) 100%)",
  bottomFade: "linear-gradient(to top, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0) 100%)",
  navFg: "#3c4043",
  wallpaper: tgWallpaper(tgPatternUri("#1d3a17", 0.17), ["#dbddbb", "#6ba587", "#d5d88d", "#88b884"], "#a9c38f"),
  bubbleFilter: "drop-shadow(0 1px 0.5px rgba(29, 55, 40, 0.22))",
  voice: {
    in: { loader: "#6aa9df", seek: "#dfe4e9", fill: "#70acd9", duration: "#a3a9b0" },
    out: { loader: "#78c272", seek: "#bbe3ac", fill: "#78c272", duration: "#65b05b" },
  },
};

const ANDROID_DARK: AndroidTheme = {
  text: "#fafafa",
  inBubble: "#212c38",
  outBubble: "#3b5d80",
  inTime: "rgba(125, 142, 155, 0.85)",
  outTime: "#8ab6d5",
  outCheck: "#81c0f0",
  headerIcon: "#ffffff",
  title: "#ffffff",
  subtitle: "rgba(215, 239, 251, 0.49)",
  status: "#6eb4e6",
  glassFill: "rgba(31, 43, 55, 0.88)",
  glassShadow: "inset 0 1px 0 rgba(255,255,255,0.16), inset 0 -1px 0 rgba(255,255,255,0.08)",
  inputIcon: "rgba(255, 255, 255, 0.63)",
  hint: "rgba(215, 236, 250, 0.43)",
  send: "#2396dd",
  datePill: "rgba(51, 64, 77, 0.62)",
  topFade: "linear-gradient(to bottom, rgba(14,20,26,0.8) 0%, rgba(14,20,26,0.4) 60%, rgba(14,20,26,0) 100%)",
  bottomFade: "linear-gradient(to top, rgba(14,20,26,0.75) 0%, rgba(14,20,26,0) 100%)",
  navFg: "#e6edf3",
  wallpaper: tgWallpaper(tgPatternUri("#9cc0e6", 0.09), ["#0e141a", "#172431", "#0f171e", "#141c2b"], "#121a22"),
  bubbleFilter: "drop-shadow(0 1px 0.5px rgba(0, 0, 0, 0.2))",
  voice: {
    in: { loader: "#5b97c4", seek: "#5a6c7b", fill: "#60aede", duration: "#788693" },
    out: { loader: "#639dc8", seek: "rgba(96, 140, 182, 0.9)", fill: "#80bdeb", duration: "#8ab6d5" },
  },
};

const RAD = 17;
const NEAR = 6;

/** Telegram Android outgoing/incoming tail traced from MessageDrawable.generatePath(). */
function Tail({ side, color }: { side: "left" | "right"; color: string }) {
  return (
    <svg
      width="6"
      height="11"
      viewBox="0 0 6 11"
      aria-hidden
      style={{
        position: "absolute",
        bottom: 0,
        [side]: -5.7,
        display: "block",
        transform: side === "left" ? "scaleX(-1)" : undefined,
      }}
    >
      <path d="M0 0A6.5 10 0 0 0 5.71 9.93L5.4 11H0Z" fill={color} />
    </svg>
  );
}

function Checks({ status, color }: { status: DeliveryStatus; color: string }) {
  // One check = sent; Telegram has no separate delivered state, so delivered/read show two.
  if (status === "sent") {
    return (
      <svg width="13" height="10" viewBox="0 0 13 10" fill="none" aria-hidden>
        <path d="M1.3 5.3 4.4 8.3 11.6 1.3" stroke={color} strokeWidth="1.55" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg width="18" height="10" viewBox="0 0 18 10" fill="none" aria-hidden>
      <path d="M1.3 5.3 4.4 8.3 11.6 1.3" stroke={color} strokeWidth="1.55" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8.9 7.6 9.6 8.3 16.8 1.3" stroke={color} strokeWidth="1.55" strokeLinecap="round" strokeLinejoin="round" />
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
        insetInlineEnd: 8,
        fontSize: 12,
        lineHeight: "14px",
        color: overlay ? "#ffffff" : color,
        ...(overlay ? { background: "rgba(0,0,0,0.4)", borderRadius: 10, padding: "2px 6px" } : null),
      }}
    >
      <span dir="ltr" className="flex items-center gap-[3px]">
        {time}
        {mine && <Checks status={status} color={overlay ? "#ffffff" : checkColor} />}
      </span>
    </span>
  );
}

function VoiceBody({ m, mine, theme }: { m: Message; mine: boolean; theme: AndroidTheme }) {
  const v = mine ? theme.voice.out : theme.voice.in;
  const bars = tgWaveform(m.id, 44);
  return (
    <div className="flex items-center gap-[10px]" style={{ width: 226 }}>
      <div
        className="flex shrink-0 items-center justify-center rounded-full"
        style={{ width: 44, height: 44, background: v.loader }}
      >
        <svg width="16" height="18" viewBox="0 0 17 19" aria-hidden style={{ marginInlineStart: 3 }}>
          <path d="M2 1.8v15.4c0 .9 1 1.4 1.7.9l12-7.7c.7-.4.7-1.4 0-1.8l-12-7.7C3 .4 2 .9 2 1.8Z" fill="#ffffff" />
        </svg>
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-[4px]" dir="ltr">
        <div className="flex h-[16px] items-end gap-px">
          {bars.map((b, i) => (
            <span
              key={i}
              style={{ width: 2, height: Math.max(2, Math.round(b * 15)), borderRadius: 1, background: v.seek }}
            />
          ))}
        </div>
        <div className="flex items-center gap-1" style={{ fontSize: 12, lineHeight: "14px", color: v.duration }}>
          <span>{m.voiceDuration ?? "0:00"}</span>
          {!mine && <span className="rounded-full" style={{ width: 5, height: 5, background: v.fill }} />}
        </div>
      </div>
    </div>
  );
}

function ImagePlaceholder({ dark }: { dark: boolean }) {
  const ink = dark ? "#5d6f80" : "#a6b2bc";
  return (
    <div className="flex items-center justify-center" style={{ width: "100%", height: 200, background: dark ? "#1b2530" : "#e3e8ec" }}>
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" aria-hidden>
        <rect x="3" y="4" width="18" height="16" rx="3" stroke={ink} strokeWidth="1.6" />
        <circle cx="9" cy="10" r="1.8" fill={ink} />
        <path d="m4 18 5-5 4 4 3-3 4 4" stroke={ink} strokeWidth="1.6" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

function glass(theme: AndroidTheme, radius: number): CSSProperties {
  return { background: theme.glassFill, boxShadow: theme.glassShadow, borderRadius: radius };
}

export function TelegramAndroid({ scenario, playback, lang, rtl }: PlatformProps) {
  const dark = scenario.theme === "dark";
  const t = dark ? ANDROID_DARK : ANDROID_LIGHT;
  const c = CHROME[lang];
  const s = TG_STRINGS[lang];
  const { messages, typing } = playback;
  const live = playback.isLive;
  const scrollRef = useChatScroll<HTMLDivElement>(`${messages.length}-${typing}`);

  const showTyping = typing || scenario.presence === "typing";
  const subtitle =
    scenario.presence === "online" ? s.online : scenario.lastSeenText.trim() || s.lastSeenRecently;
  const subtitleAccent = showTyping || scenario.presence === "online";

  const STATUS_H = 30;
  const BAR_H = 56;
  const NAV_H = 35;

  return (
    <div className="relative h-full w-full overflow-hidden" style={{ ...t.wallpaper, color: t.text }}>
      {/* Messages scroll under the floating glass header / input island */}
      <div
        ref={scrollRef}
        className="rcss-scroll absolute inset-0 overflow-y-auto"
        style={{ paddingTop: STATUS_H + BAR_H + 8, paddingBottom: NAV_H + 9 + 44 + 10, paddingInline: 8 }}
      >
        <div className="flex justify-center pb-2">
          <span
            className="rounded-full px-[10px] py-[3px] text-[14px] font-medium leading-[18px] text-white"
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

            const senderTop = firstOfGroup ? RAD : NEAR;
            const senderBottom = tail ? 0 : NEAR;
            const radius: CSSProperties = onRight
              ? {
                  borderTopLeftRadius: RAD,
                  borderBottomLeftRadius: RAD,
                  borderTopRightRadius: senderTop,
                  borderBottomRightRadius: senderBottom,
                }
              : {
                  borderTopRightRadius: RAD,
                  borderBottomRightRadius: RAD,
                  borderTopLeftRadius: senderTop,
                  borderBottomLeftRadius: senderBottom,
                };

            const fill = mine ? t.outBubble : t.inBubble;
            const timeColor = mine ? t.outTime : t.inTime;
            const isImage = m.type === "image";
            const isVoice = m.type === "voice";
            const caption = isImage ? m.text.trim() : "";
            const reserve = metaReserve(m.time, mine, 6.8, status === "sent" ? 16 : 21);

            return (
              <div
                key={m.id}
                data-mid={m.id}
                className={`flex ${mine ? "justify-end" : "justify-start"}`}
                style={{ marginTop: i === 0 ? 0 : firstOfGroup ? 8 : 2, paddingInline: 4 }}
              >
                <div
                  className={`relative ${live ? "rcss-anim-pop" : ""}`}
                  style={{ maxWidth: "84%", filter: t.bubbleFilter }}
                >
                  {tail && <Tail side={onRight ? "right" : "left"} color={fill} />}
                  <div className="relative overflow-hidden" style={{ background: fill, ...radius }}>
                    {isImage && (
                      <div style={{ padding: 3, paddingBottom: caption ? 0 : 3 }}>
                        <div
                          className="overflow-hidden"
                          style={{
                            borderRadius: RAD - 3,
                            ...(onRight
                              ? { borderTopRightRadius: Math.max(senderTop - 3, 3), borderBottomRightRadius: caption ? 4 : 3 }
                              : { borderTopLeftRadius: Math.max(senderTop - 3, 3), borderBottomLeftRadius: caption ? 4 : 3 }),
                            ...(caption ? { borderBottomLeftRadius: 4, borderBottomRightRadius: 4 } : null),
                            width: 250,
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
                      <div style={{ padding: "8px 10px 10px 8px", paddingInlineEnd: 12 }}>
                        <VoiceBody m={m} mine={mine} theme={t} />
                        <span style={{ display: "block", height: 4 }} />
                      </div>
                    )}

                    {(m.type === "text" || caption) && (
                      <p
                        className="whitespace-pre-wrap break-words"
                        style={{
                          margin: 0,
                          padding: "6px 10px 7px",
                          fontSize: 16,
                          lineHeight: "21px",
                          textAlign: textDir === "rtl" ? "right" : "left",
                          width: isImage ? 256 : undefined,
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
                      color={timeColor}
                      checkColor={mine ? t.outCheck : timeColor}
                      overlay={isImage && !caption}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top fade + status bar + glass action bar */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0"
        style={{ height: STATUS_H + BAR_H + 18, background: t.topFade }}
      />
      <div className="absolute inset-x-0 top-0">
        <SamsungStatusBar tint={dark ? "light" : "dark"} background="transparent" lang={lang} />
        <div className="flex items-center gap-[6px]" style={{ height: BAR_H, paddingInline: 8 }}>
          {/* back */}
          <div className="flex h-[46px] w-[46px] shrink-0 items-center justify-center" style={glass(t, 23)}>
            <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden className="rtl:-scale-x-100">
              <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" fill={t.headerIcon} />
            </svg>
          </div>

          {/* avatar + name + status */}
          <div
            className="flex h-[46px] min-w-0 items-center"
            style={{ ...glass(t, 23), flex: "0 1 auto", paddingInlineStart: 2, paddingInlineEnd: 16 }}
          >
            <Avatar person={scenario.them} size={42} />
            <div className="min-w-0" style={{ marginInlineStart: 8 }}>
              <div
                className="truncate font-medium"
                style={{ fontSize: 17.5, lineHeight: "21px", color: t.title }}
              >
                {scenario.them.name}
              </div>
              <div
                className="flex items-center truncate"
                style={{ fontSize: 13.5, lineHeight: "17px", color: subtitleAccent ? t.status : t.subtitle }}
              >
                {showTyping ? (
                  <>
                    <span className="flex items-end gap-[2px] pb-[3px]" style={{ marginInlineEnd: 4 }}>
                      {[0, 1, 2].map((d) => (
                        <span
                          key={d}
                          className="rcss-typing-dot inline-block rounded-full"
                          style={{ width: 3.5, height: 3.5, background: t.status, animationDelay: `${d * 0.18}s` }}
                        />
                      ))}
                    </span>
                    <span>{s.typing}</span>
                  </>
                ) : (
                  <span className="truncate">{subtitle}</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex-1" />

          {/* call + overflow menu */}
          <div className="flex h-[46px] shrink-0 items-center" style={{ ...glass(t, 23), paddingInline: 2 }}>
            <span className="flex h-[46px] w-[42px] items-center justify-center">
              <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden>
                <path
                  d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"
                  fill="none"
                  stroke={t.headerIcon}
                  strokeWidth="1.7"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <span className="flex h-[46px] w-[38px] items-center justify-center">
              <svg width="4" height="18" viewBox="0 0 4 18" aria-hidden>
                <circle cx="2" cy="2" r="2" fill={t.headerIcon} />
                <circle cx="2" cy="9" r="2" fill={t.headerIcon} />
                <circle cx="2" cy="16" r="2" fill={t.headerIcon} />
              </svg>
            </span>
          </div>
        </div>
      </div>

      {/* Bottom fade + input island + Samsung nav bar */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0"
        style={{ height: NAV_H + 9 + 44 + 26, background: t.bottomFade }}
      />
      <div className="absolute inset-x-0 bottom-0">
        <div style={{ paddingInline: 7, paddingBottom: 9 }}>
          <div className="flex h-[44px] items-center" style={glass(t, 22)}>
            {/* emoji */}
            <span className="flex h-[44px] w-[44px] shrink-0 items-center justify-center" style={{ marginInlineStart: 2 }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
                <circle cx="12" cy="12" r="9" stroke={t.inputIcon} strokeWidth="1.7" />
                <path d="M8.2 14.2a4.6 4.6 0 0 0 7.6 0" stroke={t.inputIcon} strokeWidth="1.7" strokeLinecap="round" />
                <circle cx="9" cy="9.8" r="1.25" fill={t.inputIcon} />
                <circle cx="15" cy="9.8" r="1.25" fill={t.inputIcon} />
              </svg>
            </span>
            <span className="min-w-0 flex-1 truncate" style={{ fontSize: 18, color: t.hint, paddingInlineStart: 6 }}>
              {c.message}
            </span>
            {/* attach (paperclip, tilted like Telegram's input_attach) */}
            <span className="flex h-[44px] w-[44px] shrink-0 items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden style={{ transform: "rotate(45deg)" }}>
                <path
                  d="M16.5 6v11.5c0 2.21-1.79 4-4 4s-4-1.79-4-4V5c0-1.38 1.12-2.5 2.5-2.5s2.5 1.12 2.5 2.5v10.5c0 .55-.45 1-1 1s-1-.45-1-1V6H10v9.5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5V5c0-2.21-1.79-4-4-4S7 2.79 7 5v12.5c0 3.04 2.46 5.5 5.5 5.5s5.5-2.46 5.5-5.5V6h-1.5z"
                  fill={t.inputIcon}
                />
              </svg>
            </span>
            {/* mic: 38dp filled circle inside the 44dp slot */}
            <span className="flex h-[44px] w-[44px] shrink-0 items-center justify-center">
              <span className="flex h-[38px] w-[38px] items-center justify-center rounded-full" style={{ background: t.send }}>
                <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden>
                  <path
                    d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z"
                    fill="#ffffff"
                  />
                </svg>
              </span>
            </span>
          </div>
        </div>
        <SystemBottomBar device="android" bg="transparent" fg={t.navFg} />
      </div>
    </div>
  );
}
