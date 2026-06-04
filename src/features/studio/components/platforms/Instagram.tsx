"use client";

import { Avatar, dirOf, SystemBottomBar, useChatScroll } from "../shared";
import { StatusBar } from "../devices/StatusBar";
import { CHROME } from "./chrome";
import { groupInfo, type PlatformProps } from "./types";

const IG_GRADIENT = "linear-gradient(120deg, #4a7bf6 0%, #8a3ff0 55%, #c13584 100%)";

function TypingBubble({ dark }: { dark: boolean }) {
  return (
    <div className="flex justify-start">
      <div
        className="rcss-anim-pop flex items-center gap-1 rounded-[20px] px-3.5 py-3"
        style={{ background: dark ? "#262626" : "#efefef" }}
      >
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="rcss-typing-dot inline-block rounded-full"
            style={{ width: 7, height: 7, background: dark ? "#a8a8a8" : "#8e8e8e", animationDelay: `${i * 0.18}s` }}
          />
        ))}
      </div>
    </div>
  );
}

function VoiceBubble({ mine, dark }: { mine: boolean; dark: boolean }) {
  const bars = [6, 11, 8, 15, 10, 7, 13, 9, 14, 8, 6, 12, 9, 7, 5];
  const wave = mine ? "rgba(255,255,255,0.9)" : dark ? "#8a8a8a" : "#b0b0b0";
  return (
    <div className="flex items-center gap-2.5" style={{ minWidth: 165 }}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill={mine ? "#fff" : dark ? "#fff" : "#262626"}>
        <path d="M8 5v14l11-7z" />
      </svg>
      <div className="flex h-4 flex-1 items-center gap-[2px]">
        {bars.map((b, i) => (
          <span key={i} style={{ width: 2.4, height: b, borderRadius: 2, background: wave }} />
        ))}
      </div>
    </div>
  );
}

export function Instagram({ scenario, playback, lang }: PlatformProps) {
  const dark = scenario.theme === "dark";
  const c = CHROME[lang];
  const { messages, typing } = playback;
  const live = playback.isLive;
  const scrollRef = useChatScroll<HTMLDivElement>(`${messages.length}-${typing}`);

  const pageBg = dark ? "#000000" : "#ffffff";
  const fg = dark ? "#ffffff" : "#000000";
  const inBubble = dark ? "#262626" : "#efefef";
  const sub = dark ? "#a8a8a8" : "#8e8e8e";

  const lastMineId = [...messages].reverse().find((m) => m.sender === "me")?.id;
  const lastStatus = lastMineId ? playback.statusOf(messages.find((m) => m.id === lastMineId)!) : undefined;

  const presenceText = typing
    ? c.typing
    : scenario.presence === "online"
      ? c.activeNow
      : scenario.presence === "typing"
        ? c.typing
        : scenario.lastSeenText;

  return (
    <div className="flex h-full w-full flex-col" style={{ background: pageBg }}>
      <StatusBar device={scenario.device} tint={dark ? "light" : "dark"} background={pageBg} />

      {/* Header */}
      <div className="flex items-center gap-3 px-3 pb-2 pt-1" style={{ background: pageBg }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="rtl:-scale-x-100">
          <path d="M15 5l-7 7 7 7" stroke={fg} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <div className="relative">
          <Avatar person={scenario.them} size={38} />
          {scenario.presence === "online" && (
            <span
              className="absolute bottom-0 end-0 rounded-full border-2"
              style={{ width: 12, height: 12, background: "#3ac36a", borderColor: pageBg }}
            />
          )}
        </div>
        <div className="min-w-0 flex-1 leading-tight">
          <div className="truncate text-[15px] font-semibold" style={{ color: fg }}>
            {scenario.them.name}
          </div>
          <div className="truncate text-[12px]" style={{ color: sub }}>
            {presenceText}
          </div>
        </div>
        <div className="flex items-center gap-4" style={{ color: fg }}>
          <svg width="23" height="23" viewBox="0 0 24 24" fill="none">
            <path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1-9.4 0-17-7.6-17-17 0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.2.2 2.4.6 3.6.1.4 0 .8-.3 1l-2.2 2.2z" stroke="currentColor" strokeWidth="1.7" fill="none" strokeLinejoin="round" />
          </svg>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <rect x="2" y="6" width="14" height="12" rx="3.5" stroke="currentColor" strokeWidth="1.7" />
            <path d="M17 10.5l5-3v9l-5-3z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
          </svg>
        </div>
      </div>

      {/* Body */}
      <div ref={scrollRef} className="rcss-scroll flex-1 overflow-y-auto px-3 pb-2 pt-2" style={{ background: pageBg }}>
        {/* profile intro block, like the top of a real IG thread */}
        <div className="mb-5 mt-3 flex flex-col items-center gap-2">
          <Avatar person={scenario.them} size={72} />
          <div className="text-[17px] font-semibold" style={{ color: fg }}>{scenario.them.name}</div>
          <div className="text-[12px]" style={{ color: sub }}>Instagram</div>
        </div>

        <div className="flex flex-col">
          {messages.map((m, i) => {
            const mine = m.sender === "me";
            const { lastOfGroup, firstOfGroup } = groupInfo(messages, i);
            return (
              <div
                key={m.id}
                data-mid={m.id}
                className={`flex items-end gap-2 ${mine ? "justify-end" : "justify-start"} ${firstOfGroup ? "mt-2" : "mt-0.5"}`}
              >
                {!mine && (
                  <div className="w-6 shrink-0">
                    {lastOfGroup && <Avatar person={scenario.them} size={24} />}
                  </div>
                )}
                <div
                  className={`max-w-[72%] px-3.5 py-2 ${live ? "rcss-anim-pop" : ""}`}
                  style={{
                    background: mine ? IG_GRADIENT : inBubble,
                    color: mine ? "#ffffff" : fg,
                    borderRadius: 20,
                  }}
                  dir={dirOf(m.text)}
                >
                  {m.type === "voice" ? (
                    <VoiceBubble mine={mine} dark={dark} />
                  ) : (
                    <span className="whitespace-pre-wrap break-words text-[15px] leading-[20px]">{m.text}</span>
                  )}
                </div>
              </div>
            );
          })}

          {typing && <div className="mt-2 flex items-end gap-2"><div className="w-6 shrink-0"><Avatar person={scenario.them} size={24} /></div><TypingBubble dark={dark} /></div>}

          {lastStatus && !typing && (
            <div className="mt-1 flex justify-end pe-1">
              <span className="text-[11px]" style={{ color: sub }}>
                {lastStatus === "read" ? c.seen : c.sent}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Input bar */}
      <div className="flex items-center gap-2 px-2.5 pb-2 pt-1.5" style={{ background: pageBg }}>
        <div
          className="flex flex-1 items-center justify-between rounded-full px-4 py-2"
          style={{ border: `1px solid ${dark ? "#363636" : "#dbdbdb"}` }}
        >
          <span className="text-[15px]" style={{ color: sub }}>{c.message}…</span>
          <div className="flex items-center gap-3" style={{ color: fg }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" /><circle cx="9" cy="10" r="1.1" fill="currentColor" /><circle cx="15" cy="10" r="1.1" fill="currentColor" /><path d="M8.5 14.5c.9 1.1 2 1.6 3.5 1.6s2.6-.5 3.5-1.6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="4" y="4" width="16" height="16" rx="4" stroke="currentColor" strokeWidth="1.6" /><circle cx="12" cy="12" r="3.4" stroke="currentColor" strokeWidth="1.6" /><circle cx="17" cy="7" r="1" fill="currentColor" /></svg>
          </div>
        </div>
      </div>
      <SystemBottomBar device={scenario.device} bg={pageBg} fg={dark ? "#ffffff" : "#000000"} />
    </div>
  );
}
