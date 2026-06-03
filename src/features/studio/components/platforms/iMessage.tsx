"use client";

import type { CSSProperties } from "react";

import { Avatar, dirOf, useChatScroll } from "../shared";
import { StatusBar } from "../devices/StatusBar";
import { CHROME } from "./chrome";
import { groupInfo, type PlatformProps } from "./types";

const IMSG_BLUE = "#0a7cff";

function TypingBubble({ dark }: { dark: boolean }) {
  return (
    <div className="flex justify-start">
      <div
        className="rcss-anim-pop flex items-center gap-1 rounded-[18px] px-3.5 py-3"
        style={{ background: dark ? "#26252a" : "#e9e9eb" }}
      >
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="rcss-typing-dot inline-block rounded-full"
            style={{
              width: 8,
              height: 8,
              background: dark ? "#8e8e93" : "#9b9ba0",
              animationDelay: `${i * 0.18}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

function VoiceBubble({ mine }: { mine: boolean }) {
  const bars = [6, 10, 14, 9, 16, 11, 7, 13, 8, 14, 10, 6, 12, 9, 7];
  const wave = mine ? "rgba(255,255,255,0.85)" : "#8e8e93";
  return (
    <div className="flex items-center gap-2.5" style={{ minWidth: 165 }}>
      <div className="flex h-4 flex-1 items-center gap-[2px]">
        {bars.map((b, i) => (
          <span key={i} style={{ width: 2.4, height: b, borderRadius: 2, background: wave }} />
        ))}
      </div>
      <span className="text-[12px]" style={{ color: mine ? "rgba(255,255,255,0.85)" : "#8e8e93" }}>
        ▶
      </span>
    </div>
  );
}

export function IMessage({ scenario, playback, lang, rtl }: PlatformProps) {
  const dark = scenario.theme === "dark";
  const c = CHROME[lang];
  const { messages, typing } = playback;
  const live = playback.isLive;
  const scrollRef = useChatScroll<HTMLDivElement>(`${messages.length}-${typing}`);

  const pageBg = dark ? "#000000" : "#ffffff";
  const headerBg = dark ? "rgba(28,28,30,0.82)" : "rgba(249,249,249,0.82)";
  const inBubble = dark ? "#26252a" : "#e9e9eb";
  const inText = dark ? "#ffffff" : "#000000";
  const subColor = dark ? "#8e8e93" : "#8e8e93";

  // last outgoing message id (to show Delivered/Read like the real app)
  const lastMineId = [...messages].reverse().find((m) => m.sender === "me")?.id;
  const lastMine = messages.find((m) => m.id === lastMineId);
  const lastStatus = lastMine ? playback.statusOf(lastMine) : undefined;

  return (
    <div className="flex h-full w-full flex-col" style={{ background: pageBg }}>
      <div style={{ background: headerBg, backdropFilter: "blur(20px)" }}>
        <StatusBar device={scenario.device} tint={dark ? "light" : "dark"} background="transparent" />
        {/* Header: centered contact, back chevron + facetime */}
        <div className="relative flex flex-col items-center px-3 pb-2 pt-0.5">
          <div className="absolute bottom-2 flex w-full items-center justify-between px-2">
            <svg width="13" height="22" viewBox="0 0 13 22" fill="none" className="rtl:-scale-x-100">
              <path d="M11 2 3 11l8 9" stroke={IMSG_BLUE} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <rect x="2" y="6" width="13" height="12" rx="3" stroke={IMSG_BLUE} strokeWidth="1.7" />
              <path d="M16 10l5-3v10l-5-3z" stroke={IMSG_BLUE} strokeWidth="1.7" strokeLinejoin="round" />
            </svg>
          </div>
          <Avatar person={scenario.them} size={44} />
          <div className="mt-1 flex items-center gap-1">
            <span className="text-[12px] font-medium" style={{ color: inText }}>
              {scenario.them.name}
            </span>
            <svg width="8" height="12" viewBox="0 0 8 12" fill="none" className="rtl:-scale-x-100">
              <path d="M2 2l4 4-4 4" stroke={subColor} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      </div>

      {/* Body */}
      <div ref={scrollRef} className="rcss-scroll flex-1 overflow-y-auto px-3 pb-2 pt-2" style={{ background: pageBg }}>
        <div className="mb-3 mt-1 flex justify-center">
          <span className="text-[11px]" style={{ color: subColor }}>
            <span className="font-semibold">iMessage</span>
          </span>
        </div>

        <div className="flex flex-col">
          {messages.map((m, i) => {
            const mine = m.sender === "me";
            const { lastOfGroup, firstOfGroup } = groupInfo(messages, i);
            const onRight = mine ? !rtl : rtl;
            const radius: CSSProperties = { borderRadius: 19 };
            if (lastOfGroup) {
              if (onRight) radius.borderBottomRightRadius = 5;
              else radius.borderBottomLeftRadius = 5;
            }
            return (
              <div
                key={m.id}
                className={`flex ${mine ? "justify-end" : "justify-start"} ${firstOfGroup ? "mt-2" : "mt-0.5"}`}
              >
                <div
                  className={`relative max-w-[76%] px-3 py-[7px] ${
                    live ? (mine ? "rcss-anim-spring" : "rcss-anim-pop") : ""
                  }`}
                  style={{
                    background: mine ? IMSG_BLUE : inBubble,
                    color: mine ? "#ffffff" : inText,
                    ...radius,
                  }}
                  dir={dirOf(m.text)}
                >
                  {m.type === "voice" ? (
                    <VoiceBubble mine={mine} />
                  ) : (
                    <span className="whitespace-pre-wrap break-words text-[16px] leading-[21px]">
                      {m.text}
                    </span>
                  )}
                </div>
              </div>
            );
          })}

          {typing && <div className="mt-2"><TypingBubble dark={dark} /></div>}

          {/* Delivered / Read under the last outgoing bubble */}
          {lastStatus && !typing && (
            <div className="mt-1 flex justify-end pe-1">
              <span className="text-[11px] font-medium" style={{ color: subColor }}>
                {lastStatus === "read" ? c.read : lastStatus === "delivered" ? c.delivered : c.sent}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Input bar */}
      <div className="flex items-center gap-2 px-2.5 pb-2 pt-1.5" style={{ background: pageBg }}>
        <div className="flex h-8 w-8 items-center justify-center rounded-full" style={{ background: dark ? "#1c1c1e" : "#e9e9eb" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M12 5v14M5 12h14" stroke={subColor} strokeWidth="2.2" strokeLinecap="round" />
          </svg>
        </div>
        <div
          className="flex flex-1 items-center justify-between rounded-full px-3.5 py-1.5"
          style={{ border: `1px solid ${dark ? "#3a3a3c" : "#d1d1d6"}` }}
        >
          <span className="text-[15px]" style={{ color: subColor }}>iMessage</span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="9" stroke={subColor} strokeWidth="1.6" />
            <path d="M12 8v5l3 2" stroke={subColor} strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </div>
      </div>
      {scenario.device === "iphone" && (
        <div className="flex justify-center pb-2 pt-0.5" style={{ background: pageBg }}>
          <span className="rounded-full" style={{ width: 134, height: 5, background: dark ? "#ffffff" : "#000000" }} />
        </div>
      )}
    </div>
  );
}
