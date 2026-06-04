"use client";

import type { CSSProperties } from "react";

import type { DeliveryStatus } from "../../types";
import { Avatar, dirOf, SystemBottomBar, useChatScroll } from "../shared";
import { StatusBar } from "../devices/StatusBar";
import { CHROME } from "./chrome";
import { groupInfo, type PlatformProps } from "./types";

const DOODLE =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Cg fill='none' stroke='%23000' stroke-opacity='0.04' stroke-width='1.4'%3E%3Cpath d='M12 20c4-6 10-6 14 0M54 14a4 4 0 1 0 0 .1'/%3E%3Cpath d='M62 40l6 6-6 6M20 56h12M44 64c3-4 8-4 11 0'/%3E%3Ccircle cx='30' cy='40' r='3'/%3E%3C/g%3E%3C/svg%3E\")";

/** Authentic WhatsApp bubble tail (the curved "flag" at the top corner).
 *  `side` is the PHYSICAL side the bubble is aligned to. */
function Tail({ side, color }: { side: "left" | "right"; color: string }) {
  const right = side === "right";
  const d = right
    ? "M6.467 3.568 0 12.193V1h5.188C6.958 1 7.526 2.156 6.467 3.568z"
    : "M1.533 3.568 8 12.193V1H2.812C1.042 1 .474 2.156 1.533 3.568z";
  return (
    <span
      className="absolute top-0"
      style={{
        [right ? "right" : "left"]: -8,
        lineHeight: 0,
        filter: "drop-shadow(0 1px 0.4px rgba(0,0,0,0.12))",
      }}
    >
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
        <path d="M1 6.2 4 9.2 10.5 1.8" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg width="17" height="11" viewBox="0 0 17 11" fill="none">
      <path d="M1 6.2 4 9.2 10.2 1.8" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5.6 6.2 8.4 9.2 15.6 1.8" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function VoiceBubble({ dark, mine }: { dark: boolean; mine: boolean }) {
  const bars = [6, 11, 8, 14, 9, 16, 7, 12, 6, 13, 8, 10, 6, 9, 7];
  const wave = mine ? (dark ? "#7fae9f" : "#9fc2b4") : dark ? "#5b6b72" : "#c4ccd1";
  const play = mine ? (dark ? "#adebcf" : "#4b7e6c") : dark ? "#8696a0" : "#54656f";
  return (
    <div className="flex items-center gap-2.5" style={{ minWidth: 168 }}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill={play}>
        <path d="M8 5v14l11-7z" />
      </svg>
      <div className="flex h-5 flex-1 items-center gap-[2px]">
        {bars.map((b, i) => (
          <span key={i} style={{ width: 2, height: b, borderRadius: 2, background: wave }} />
        ))}
      </div>
    </div>
  );
}

export function WhatsApp({ scenario, playback, lang, rtl }: PlatformProps) {
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
    <div className="flex h-full w-full flex-col" style={{ background: chatBg }}>
      <StatusBar device={scenario.device} tint="light" background={header} />

      {/* Header */}
      <div className="flex items-center gap-3 px-3 pb-2 pt-1" style={{ background: header }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="rtl:-scale-x-100 text-white">
          <path d="M15 5l-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <Avatar person={scenario.them} size={38} />
        <div className="min-w-0 flex-1 leading-tight">
          <div className="truncate text-[16px] font-medium text-white">{scenario.them.name}</div>
          <div className="truncate text-[12.5px] text-white/85">{presenceText}</div>
        </div>
        <div className="flex items-center gap-5 pr-1 text-white">
          <svg width="21" height="21" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17 10.5V7a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-3.5l4 4v-11l-4 4z" />
          </svg>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
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
        style={{ backgroundImage: DOODLE, backgroundColor: chatBg }}
      >
        <div className="mb-3 flex justify-center">
          <span
            className="rounded-md px-2.5 py-1 text-[12px]"
            style={{
              background: dark ? "#182229" : "#ffffff",
              color: dark ? "#8696a0" : "#54656f",
              boxShadow: "0 1px 0.5px rgba(0,0,0,0.13)",
            }}
          >
            {c.today}
          </span>
        </div>

        <div className="flex flex-col gap-0.5">
          {messages.map((m, i) => {
            const mine = m.sender === "me";
            const { firstOfGroup } = groupInfo(messages, i);
            const status = playback.statusOf(m);
            const tail = firstOfGroup;
            // physical side the bubble hugs (mirrors with the UI direction)
            const onRight = mine ? !rtl : rtl;
            const radius: CSSProperties = { borderRadius: 7.5 };
            if (tail) {
              if (onRight) radius.borderTopRightRadius = 0;
              else radius.borderTopLeftRadius = 0;
            }
            return (
              <div
                key={m.id}
                className={`flex ${mine ? "justify-end" : "justify-start"} ${firstOfGroup ? "mt-1.5" : ""}`}
              >
                <div
                  className={`relative max-w-[80%] pb-1.5 pt-1.5 ${live ? "rcss-anim-pop" : ""}`}
                  style={{
                    background: mine ? outBubble : inBubble,
                    color: textColor,
                    ...radius,
                    boxShadow: "0 1px 0.5px rgba(0,0,0,0.13)",
                    paddingInlineStart: 9,
                    paddingInlineEnd: 9,
                  }}
                  dir={dirOf(m.text)}
                >
                  {tail && <Tail side={onRight ? "right" : "left"} color={mine ? outBubble : inBubble} />}
                  {m.type === "voice" ? (
                    <div className="pr-1">
                      <VoiceBubble dark={dark} mine={mine} />
                    </div>
                  ) : (
                    <span className="whitespace-pre-wrap break-words text-[14.5px] leading-[19px]">{m.text}</span>
                  )}
                  <span
                    className="mt-1 flex translate-y-1 items-center gap-1"
                    style={{ fontSize: 11, color: timeColor, float: "inline-end", marginInlineStart: 8 }}
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
      </div>

      {/* Input bar */}
      <div className="flex items-center gap-2 px-2 py-2" style={{ background: barBg }}>
        <div className="flex flex-1 items-center gap-2 rounded-full px-3 py-2" style={{ background: inputBg }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill={dark ? "#8696a0" : "#54656f"}>
            <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm-3.5 7a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm7 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zM12 18c2.3 0 4.3-1.4 5-3.5H7c.7 2.1 2.7 3.5 5 3.5z" />
          </svg>
          <span className="flex-1 text-[15px]" style={{ color: dark ? "#8696a0" : "#8d9499" }}>
            {c.message}
          </span>
          <svg width="21" height="21" viewBox="0 0 24 24" fill={dark ? "#8696a0" : "#54656f"}>
            <path d="M16.5 6.5 8 15a3 3 0 0 0 4.2 4.2l7-7a5 5 0 0 0-7-7l-7 7a7 7 0 0 0 9.9 9.9l6.5-6.5" stroke={dark ? "#8696a0" : "#54656f"} strokeWidth="1.6" fill="none" strokeLinecap="round" />
          </svg>
          <svg width="21" height="21" viewBox="0 0 24 24" fill={dark ? "#8696a0" : "#54656f"}>
            <path d="M12 15a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.9V21h2v-2.1A7 7 0 0 0 19 12h-2z" />
          </svg>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-full" style={{ background: dark ? "#00a884" : "#008069" }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="#fff">
            <path d="M12 15a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.9V21h2v-2.1A7 7 0 0 0 19 12h-2z" />
          </svg>
        </div>
      </div>
      <SystemBottomBar device={scenario.device} bg={barBg} fg={dark ? "#e9edef" : "#111b21"} />
    </div>
  );
}
