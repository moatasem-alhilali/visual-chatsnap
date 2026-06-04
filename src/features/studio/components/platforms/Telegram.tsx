"use client";

import type { CSSProperties } from "react";

import type { DeliveryStatus } from "../../types";
import { Avatar, dirOf, SystemBottomBar, useChatScroll } from "../shared";
import { StatusBar } from "../devices/StatusBar";
import { CHROME } from "./chrome";
import { groupInfo, type PlatformProps } from "./types";

/** Telegram's signature light-blue patterned wallpaper. */
const PATTERN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='90' height='90' viewBox='0 0 90 90'%3E%3Cg fill='%23ffffff' fill-opacity='0.06'%3E%3Cpath d='M20 18c5 0 9 4 9 9s-4 9-9 9-9-4-9-9 4-9 9-9zM66 50a7 7 0 1 1 0 14 7 7 0 0 1 0-14z'/%3E%3Cpath d='M48 8l5 9h-10zM12 64l4 7H8z'/%3E%3C/g%3E%3C/svg%3E\")";

function Ticks({ status, mine }: { status: DeliveryStatus; mine: boolean }) {
  // On the blue outgoing bubble the checks are near-white; otherwise telegram blue.
  const color = mine ? "rgba(255,255,255,0.92)" : "#4fae4e";
  if (status === "sent") {
    return (
      <svg width="15" height="10" viewBox="0 0 15 10" fill="none">
        <path
          d="M1 5.4 4 8.4 10.4 1.4"
          stroke={color}
          strokeWidth="1.3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  return (
    <svg width="16" height="10" viewBox="0 0 16 10" fill="none">
      <path
        d="M1 5.4 3.8 8.4 9.8 1.4"
        stroke={color}
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5.6 5.6 8 8 14.6 1.4"
        stroke={color}
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function VoiceBubble({ mine, dark }: { mine: boolean; dark: boolean }) {
  const bars = [5, 9, 14, 8, 16, 10, 6, 12, 7, 13, 9, 5, 11, 8, 6];
  const wave = mine ? "rgba(255,255,255,0.85)" : dark ? "#6a7a8a" : "#b9c4cc";
  const accent = mine ? "#ffffff" : "#3390ec";
  return (
    <div className="flex items-center gap-2.5" style={{ minWidth: 170 }}>
      <div
        className="flex h-9 w-9 items-center justify-center rounded-full"
        style={{ background: mine ? "rgba(255,255,255,0.2)" : "#3390ec" }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill={mine ? "#fff" : "#fff"}>
          <path d="M8 5v14l11-7z" />
        </svg>
      </div>
      <div className="flex flex-1 flex-col gap-1">
        <div className="flex h-4 items-center gap-[2px]">
          {bars.map((b, i) => (
            <span
              key={i}
              style={{ width: 2, height: b, borderRadius: 2, background: i < 5 ? accent : wave }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export function Telegram({ scenario, playback, lang, rtl }: PlatformProps) {
  const dark = scenario.theme === "dark";
  const c = CHROME[lang];
  const { messages, typing } = playback;
  const live = playback.isLive;
  const scrollRef = useChatScroll<HTMLDivElement>(`${messages.length}-${typing}`);

  const header = dark ? "#212d3b" : "#527da3";
  const chatBg = dark ? "#0e1621" : "#90a4ba";
  const inBubble = dark ? "#182533" : "#ffffff";
  const outBubbleLight = dark ? "#2b5278" : "#effdde";
  const textColor = dark ? "#e9eef2" : "#0f1620";
  const timeMine = dark ? "rgba(255,255,255,0.55)" : "#5aa158";
  const timeThem = dark ? "rgba(233,238,242,0.45)" : "#a1aab3";

  const presenceText = typing
    ? c.typing
    : scenario.presence === "online"
      ? c.online
      : scenario.presence === "typing"
        ? c.typing
        : scenario.lastSeenText;

  return (
    <div className="flex h-full w-full flex-col" style={{ background: chatBg }}>
      <StatusBar device={scenario.device} tint="light" background={header} />

      {/* Header */}
      <div className="flex items-center gap-3 px-3 pb-2.5 pt-1.5" style={{ background: header }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="rtl:-scale-x-100 text-white">
          <path d="M15 5l-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <Avatar person={scenario.them} size={37} />
        <div className="min-w-0 flex-1 leading-tight">
          <div className="truncate text-[16px] font-semibold text-white">{scenario.them.name}</div>
          <div
            className="flex items-center gap-1 truncate text-[12.5px]"
            style={{ color: typing || scenario.presence === "online" ? "#a6d2ff" : "rgba(255,255,255,0.7)" }}
          >
            {typing ? (
              <>
                <span>{lang === "ar" ? "يكتب" : "typing"}</span>
                <span className="flex items-end gap-[2px] pb-[3px]">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="rcss-typing-dot inline-block rounded-full"
                      style={{ width: 3, height: 3, background: "#a6d2ff", animationDelay: `${i * 0.18}s` }}
                    />
                  ))}
                </span>
              </>
            ) : (
              presenceText
            )}
          </div>
        </div>
        <div className="flex items-center gap-5 pr-1 text-white">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1-9.4 0-17-7.6-17-17 0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.2.2 2.4.6 3.6.1.4 0 .8-.3 1l-2.2 2.2z" />
          </svg>
          <svg width="5" height="19" viewBox="0 0 5 19" fill="currentColor">
            <circle cx="2.5" cy="2.5" r="2.2" />
            <circle cx="2.5" cy="9.5" r="2.2" />
            <circle cx="2.5" cy="16.5" r="2.2" />
          </svg>
        </div>
      </div>

      {/* Body */}
      <div
        ref={scrollRef}
        className="rcss-scroll flex-1 overflow-y-auto px-3 py-3"
        style={{ backgroundImage: PATTERN, backgroundColor: chatBg }}
      >
        <div className="mb-3 flex justify-center">
          <span
            className="rounded-full px-2.5 py-1 text-[12px] font-medium text-white"
            style={{ background: "rgba(0,0,0,0.22)" }}
          >
            {c.today}
          </span>
        </div>

        <div className="flex flex-col gap-1">
          {messages.map((m, i) => {
            const mine = m.sender === "me";
            const { lastOfGroup } = groupInfo(messages, i);
            const status = playback.statusOf(m);
            const bg = mine ? outBubbleLight : inBubble;
            const onRight = mine ? !rtl : rtl;
            const radius: CSSProperties = {
              borderRadius: 14,
              ...(lastOfGroup
                ? onRight
                  ? { borderBottomRightRadius: 5 }
                  : { borderBottomLeftRadius: 5 }
                : {}),
            };
            return (
              <div
                key={m.id}
                data-mid={m.id}
                className={`flex ${mine ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`relative max-w-[80%] px-2.5 py-1.5 ${live ? "rcss-anim-pop" : ""}`}
                  style={{ background: bg, color: textColor, ...radius, boxShadow: "0 1px 1px rgba(0,0,0,0.08)" }}
                  dir={dirOf(m.text)}
                >
                  {m.type === "voice" ? (
                    <div className="pr-1 pt-0.5">
                      <VoiceBubble mine={mine} dark={dark} />
                    </div>
                  ) : (
                    <span className="whitespace-pre-wrap break-words text-[14.5px] leading-[19px]">
                      {m.text}
                    </span>
                  )}
                  <span
                    className="mt-1 flex translate-y-1 items-center gap-1"
                    style={{ fontSize: 11, color: mine ? timeMine : timeThem, float: "inline-end", marginInlineStart: 8 }}
                  >
                    {m.time}
                    {mine && <Ticks status={status} mine={false} />}
                  </span>
                  <span className="clear-both block" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Input bar */}
      <div className="flex items-center gap-2 px-2.5 py-2" style={{ background: dark ? "#17212b" : "#ffffff" }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill={dark ? "#6a7a8a" : "#9aa4ad"}>
          <path d="M9.5 13.5c.8 1 1.8 1.5 2.5 1.5s1.7-.5 2.5-1.5" stroke={dark ? "#6a7a8a" : "#9aa4ad"} strokeWidth="1.5" fill="none" strokeLinecap="round" />
          <circle cx="12" cy="12" r="9.2" stroke={dark ? "#6a7a8a" : "#9aa4ad"} strokeWidth="1.5" fill="none" />
          <circle cx="9" cy="10" r="1.1" /><circle cx="15" cy="10" r="1.1" />
        </svg>
        <span className="flex-1 text-[15px]" style={{ color: dark ? "#6a7a8a" : "#9aa4ad" }}>
          {c.message}
        </span>
        <svg width="22" height="22" viewBox="0 0 24 24" fill={dark ? "#6a7a8a" : "#9aa4ad"}>
          <path d="M16.5 6.5 8 15a3 3 0 0 0 4.2 4.2l7-7a5 5 0 0 0-7-7l-7 7a7 7 0 0 0 9.9 9.9l6.5-6.5" stroke={dark ? "#6a7a8a" : "#9aa4ad"} strokeWidth="1.5" fill="none" strokeLinecap="round" />
        </svg>
        <div className="flex h-10 w-10 items-center justify-center rounded-full" style={{ background: "#3390ec" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff">
            <path d="M12 15a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.9V21h2v-2.1A7 7 0 0 0 19 12h-2z" />
          </svg>
        </div>
      </div>
      <SystemBottomBar device={scenario.device} bg={dark ? "#17212b" : "#ffffff"} fg={dark ? "#e9eef2" : "#0f1620"} />
    </div>
  );
}
