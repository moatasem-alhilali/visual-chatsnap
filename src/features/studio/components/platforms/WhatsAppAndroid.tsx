"use client";

import type { CSSProperties } from "react";

import type { DeliveryStatus, Person } from "../../types";
import { Avatar, dirOf, SystemBottomBar, useChatScroll } from "../shared";
import { SamsungStatusBar } from "../devices/SamsungStatusBar";
import { CHROME } from "./chrome";
import { groupInfo, type PlatformProps } from "./types";

const DOODLE =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Cg fill='none' stroke='%23ffffff' stroke-opacity='0.05' stroke-width='1.4'%3E%3Cpath d='M12 20c4-6 10-6 14 0M54 14a4 4 0 1 0 0 .1'/%3E%3Cpath d='M62 40l6 6-6 6M20 56h12M44 64c3-4 8-4 11 0'/%3E%3Ccircle cx='30' cy='40' r='3'/%3E%3C/g%3E%3C/svg%3E\")";
const DOODLE_LIGHT =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Cg fill='none' stroke='%23000' stroke-opacity='0.04' stroke-width='1.4'%3E%3Cpath d='M12 20c4-6 10-6 14 0M54 14a4 4 0 1 0 0 .1'/%3E%3Cpath d='M62 40l6 6-6 6M20 56h12M44 64c3-4 8-4 11 0'/%3E%3Ccircle cx='30' cy='40' r='3'/%3E%3C/g%3E%3C/svg%3E\")";

function Tail({ side, color }: { side: "left" | "right"; color: string }) {
  const right = side === "right";
  const d = right
    ? "M6.467 3.568 0 12.193V1h5.188C6.958 1 7.526 2.156 6.467 3.568z"
    : "M1.533 3.568 8 12.193V1H2.812C1.042 1 .474 2.156 1.533 3.568z";
  return (
    <span className="absolute top-0" style={{ [right ? "right" : "left"]: -8, lineHeight: 0 }}>
      <svg width="8" height="13" viewBox="0 0 8 13" style={{ display: "block" }}>
        <path d={d} fill={color} />
      </svg>
    </span>
  );
}

function Ticks({ status }: { status: DeliveryStatus }) {
  const color = status === "read" ? "#53bdeb" : "#8696a0";
  if (status === "sent") {
    return (
      <svg width="16" height="11" viewBox="0 0 16 11" fill="none">
        <path d="M1 6.2 4 9.2 10.5 1.8" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg width="17" height="11" viewBox="0 0 17 11" fill="none">
      <path d="M1 6.2 4 9.2 10.2 1.8" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5.6 6.2 8.4 9.2 15.6 1.8" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Android WhatsApp voice note: sender avatar (with mic badge) + waveform + play. */
function Voice({ mine, dark, person, duration }: { mine: boolean; dark: boolean; person: Person; duration?: string }) {
  const bars = [5, 9, 6, 13, 8, 16, 10, 6, 14, 9, 7, 12, 6, 10, 7, 13, 8, 5];
  const played = mine ? (dark ? "#a7d9c9" : "#5aa18e") : dark ? "#8696a0" : "#9aa6ac";
  const rest = mine ? (dark ? "#6b8d83" : "#a9cdbf") : dark ? "#566169" : "#c9d1d6";
  const accent = mine ? (dark ? "#dff7ec" : "#1f8a6b") : dark ? "#aebac1" : "#54656f";
  return (
    <div className="flex items-center gap-2.5" style={{ minWidth: 196 }}>
      <div className="relative shrink-0">
        <Avatar person={person} size={34} />
        <span
          className="absolute -bottom-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full"
          style={{ insetInlineEnd: -2, background: dark ? "#005c4b" : "#25d366" }}
        >
          <svg width="8" height="8" viewBox="0 0 24 24" fill="#fff">
            <path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v5a3 3 0 0 0 3 3z" />
            <path d="M17 11a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.9V21h2v-3.1A7 7 0 0 0 19 11h-2z" />
          </svg>
        </span>
      </div>
      <svg width="20" height="20" viewBox="0 0 24 24" fill={accent}>
        <path d="M8 5v14l11-7z" />
      </svg>
      <div className="flex h-6 flex-1 items-center gap-[2px]">
        {bars.map((b, i) => (
          <span key={i} style={{ width: 2.5, height: b, borderRadius: 2, background: i < 4 ? played : rest }} />
        ))}
      </div>
      {duration && (
        <span className="text-[11px]" style={{ color: accent }}>
          {duration}
        </span>
      )}
    </div>
  );
}

export function WhatsAppAndroid({ scenario, playback, lang, rtl }: PlatformProps) {
  const dark = scenario.theme === "dark";
  const c = CHROME[lang];
  const { messages, typing } = playback;
  const live = playback.isLive;
  const scrollRef = useChatScroll<HTMLDivElement>(`${messages.length}-${typing}`);

  const header = dark ? "#1f2c34" : "#008069";
  const chatBg = dark ? "#0b141a" : "#efeae2";
  const inBubble = dark ? "#202c33" : "#ffffff";
  const outBubble = dark ? "#005c4b" : "#d9fdd3";
  const textColor = dark ? "#e9edef" : "#111b21";
  const timeColor = dark ? "rgba(233,237,239,0.6)" : "#667781";
  const barBg = dark ? "#1f2c34" : "#f0f2f5";
  const inputBg = dark ? "#2a3942" : "#ffffff";

  const presenceText = typing
    ? c.typing
    : scenario.presence === "online"
      ? c.online
      : scenario.presence === "typing"
        ? c.typing
        : scenario.lastSeenText;

  return (
    <div
      className="flex h-full w-full flex-col"
      style={{ background: chatBg, fontFamily: "Roboto, 'Noto Sans Arabic', system-ui, sans-serif" }}
    >
      <SamsungStatusBar tint="light" background={header} lang={lang} />

      {/* Material header */}
      <div className="flex items-center gap-3 px-2.5 pb-2.5 pt-2" style={{ background: header }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="shrink-0 rtl:-scale-x-100 text-white">
          <path d="M20 12H5M11 6l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <Avatar person={scenario.them} size={40} />
        <div className="min-w-0 flex-1 leading-tight">
          <div className="truncate text-[16.5px] font-medium text-white">{scenario.them.name}</div>
          <div className="truncate text-[12.5px] text-white/80">{presenceText}</div>
        </div>
        <div className="flex items-center gap-4 ps-1 text-white">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17 10.5V7a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-3.5l4 4v-11l-4 4z" />
          </svg>
          <svg width="21" height="21" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1-9.4 0-17-7.6-17-17 0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.2.2 2.4.6 3.6.1.4 0 .8-.3 1l-2.2 2.2z" />
          </svg>
          <svg width="5" height="20" viewBox="0 0 5 20" fill="currentColor">
            <circle cx="2.5" cy="2.5" r="2.3" />
            <circle cx="2.5" cy="10" r="2.3" />
            <circle cx="2.5" cy="17.5" r="2.3" />
          </svg>
        </div>
      </div>

      {/* Body */}
      <div
        ref={scrollRef}
        className="rcss-scroll relative flex-1 overflow-y-auto px-3 py-2.5"
        style={{ backgroundImage: dark ? DOODLE : DOODLE_LIGHT, backgroundColor: chatBg }}
      >
        <div className="mb-3 flex justify-center">
          <span
            className="rounded-lg px-3 py-1 text-[12px] font-medium"
            style={{
              background: dark ? "#1d282f" : "#ffffff",
              color: dark ? "#8696a0" : "#54656f",
              boxShadow: "0 1px 0.5px rgba(0,0,0,0.13)",
            }}
          >
            {c.today}
          </span>
        </div>

        <div className="flex flex-col gap-1">
          {messages.map((m, i) => {
            const mine = m.sender === "me";
            const { firstOfGroup } = groupInfo(messages, i);
            const status = playback.statusOf(m);
            const tail = firstOfGroup;
            const onRight = mine ? !rtl : rtl;
            const radius: CSSProperties = { borderRadius: 8 };
            if (tail) {
              if (onRight) radius.borderTopRightRadius = 0;
              else radius.borderTopLeftRadius = 0;
            }
            const isVoice = m.type === "voice";
            return (
              <div
                key={m.id}
                data-mid={m.id}
                className={`flex ${mine ? "justify-end" : "justify-start"} ${firstOfGroup ? "mt-1" : ""}`}
              >
                <div
                  className={`relative max-w-[82%] px-1.5 pb-1 pt-1.5 ${live ? "rcss-anim-pop" : ""}`}
                  style={{
                    background: mine ? outBubble : inBubble,
                    color: textColor,
                    ...radius,
                    boxShadow: "0 1px 0.5px rgba(0,0,0,0.18)",
                    paddingInlineStart: 8,
                    paddingInlineEnd: 8,
                  }}
                  dir={dirOf(m.text)}
                >
                  {tail && <Tail side={onRight ? "right" : "left"} color={mine ? outBubble : inBubble} />}
                  {isVoice ? (
                    <Voice mine={mine} dark={dark} person={mine ? scenario.me : scenario.them} duration={m.voiceDuration} />
                  ) : (
                    <span className="whitespace-pre-wrap break-words text-[14.5px] leading-[20px]">{m.text}</span>
                  )}
                  <span
                    className="mt-0.5 flex translate-y-1 items-center gap-1"
                    style={{ fontSize: 11, color: mine ? (dark ? "rgba(233,237,239,0.6)" : "#4a7c6b") : timeColor, float: "inline-end", marginInlineStart: 8 }}
                  >
                    {m.time}
                    {mine && <Ticks status={status} />}
                  </span>
                  <span className="clear-both block" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Floating scroll-to-bottom button (Android detail) */}
        <div
          className="sticky bottom-0 flex justify-center pt-1"
          style={{ pointerEvents: "none" }}
        >
          <span
            className="flex h-9 w-9 items-center justify-center rounded-full"
            style={{ background: dark ? "#2a3942" : "#ffffff", boxShadow: "0 2px 4px rgba(0,0,0,0.25)" }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M6 9l6 6 6-6M6 4l6 6 6-6" stroke={dark ? "#8696a0" : "#54656f"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </div>
      </div>

      {/* Input bar (Android) */}
      <div className="flex items-end gap-2 px-2 py-1.5" style={{ background: barBg }}>
        <div className="flex flex-1 items-center gap-2 rounded-full px-3 py-2.5" style={{ background: inputBg }}>
          <svg width="23" height="23" viewBox="0 0 24 24" fill={dark ? "#8696a0" : "#54656f"}>
            <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm-3.5 7a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm7 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zM12 18c2.3 0 4.3-1.4 5-3.5H7c.7 2.1 2.7 3.5 5 3.5z" />
          </svg>
          <span className="flex-1 text-[15.5px]" style={{ color: dark ? "#8696a0" : "#8d9499" }}>
            {c.message}
          </span>
          <svg width="22" height="22" viewBox="0 0 24 24" fill={dark ? "#8696a0" : "#54656f"} className="rtl:-scale-x-100">
            <path d="M16.5 6.5 8 15a3 3 0 0 0 4.2 4.2l7-7a5 5 0 0 0-7-7l-7 7a7 7 0 0 0 9.9 9.9l6.5-6.5" stroke={dark ? "#8696a0" : "#54656f"} strokeWidth="1.6" fill="none" strokeLinecap="round" />
          </svg>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={dark ? "#8696a0" : "#54656f"} strokeWidth="1.7">
            <rect x="3" y="6" width="18" height="13" rx="3" />
            <circle cx="12" cy="12.5" r="3.2" />
            <path d="M8 6l1.5-2h5L16 6" strokeLinejoin="round" />
          </svg>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-full" style={{ background: dark ? "#00a884" : "#008069" }}>
          <svg width="23" height="23" viewBox="0 0 24 24" fill="#fff">
            <path d="M12 15a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.9V21h2v-2.1A7 7 0 0 0 19 12h-2z" />
          </svg>
        </div>
      </div>

      <SystemBottomBar device="android" bg={barBg} fg={dark ? "#e9edef" : "#3b4a54"} />
    </div>
  );
}
