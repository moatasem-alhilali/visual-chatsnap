"use client";

import { Avatar, dirOf, useChatScroll } from "../shared";
import { StatusBar } from "../devices/StatusBar";
import { type PlatformProps } from "./types";

const SNAP_RED = "#f23c57";
const SNAP_BLUE = "#19adff";

function statusLabel(status: string): string {
  if (status === "read") return "تم الفتح";
  if (status === "delivered") return "تم التسليم";
  return "تم الإرسال";
}

export function Snapchat({ scenario, playback }: PlatformProps) {
  const dark = scenario.theme === "dark";
  const { messages, typing } = playback;
  const live = playback.isLive;
  const scrollRef = useChatScroll<HTMLDivElement>(`${messages.length}-${typing}`);

  const pageBg = dark ? "#000000" : "#ffffff";
  const fg = dark ? "#ffffff" : "#000000";
  const sub = dark ? "#8a8a8a" : "#9b9b9b";

  const meName = (scenario.me.name || "أنا").toUpperCase();
  const themName = (scenario.them.name || "").toUpperCase();

  return (
    <div className="flex h-full w-full flex-col" style={{ background: pageBg }}>
      <StatusBar device={scenario.device} tint={dark ? "light" : "dark"} background={pageBg} />

      {/* Header */}
      <div className="flex items-center gap-2.5 px-3 pb-2 pt-1" style={{ background: pageBg }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="M15 5l-7 7 7 7" stroke={fg} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <Avatar person={scenario.them} size={34} />
        <div className="min-w-0 flex-1 leading-tight">
          <div className="truncate text-[15px] font-bold" style={{ color: fg }}>
            {scenario.them.name}
          </div>
          <div className="flex items-center gap-1 text-[11px]" style={{ color: sub }}>
            <span style={{ color: "#fffc00", WebkitTextStroke: "0.4px #d4af37" }}>👻</span>
            {typing ? "يكتب…" : scenario.presence === "online" ? "نشِط الآن" : scenario.lastSeenText}
          </div>
        </div>
        <div className="flex items-center gap-4" style={{ color: fg }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1-9.4 0-17-7.6-17-17 0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.2.2 2.4.6 3.6.1.4 0 .8-.3 1l-2.2 2.2z" stroke="currentColor" strokeWidth="1.7" fill="none" strokeLinejoin="round" />
          </svg>
          <svg width="23" height="23" viewBox="0 0 24 24" fill="none">
            <rect x="2" y="6" width="14" height="12" rx="3.5" stroke="currentColor" strokeWidth="1.7" />
            <path d="M17 10.5l5-3v9l-5-3z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
          </svg>
        </div>
      </div>

      {/* Body — Snapchat shows text with a colored side-bar and a NAME label, no bubbles */}
      <div ref={scrollRef} className="rcss-scroll flex-1 overflow-y-auto px-4 pb-3 pt-3" style={{ background: pageBg }}>
        <div className="flex flex-col gap-3.5">
          {messages.map((m) => {
            const mine = m.sender === "me";
            const accent = mine ? SNAP_RED : SNAP_BLUE;
            const status = playback.statusOf(m);
            return (
              <div key={m.id} className={`${live ? "rcss-anim-fade" : ""}`}>
                <div className="flex items-stretch gap-2.5" dir={dirOf(m.text)}>
                  <span className="shrink-0 self-stretch rounded-full" style={{ width: 3, background: accent }} />
                  <div className="min-w-0 flex-1">
                    <div className="mb-0.5 text-[11px] font-extrabold tracking-wide" style={{ color: accent }}>
                      {mine ? meName : themName}
                    </div>
                    {m.type === "voice" ? (
                      <div className="flex items-center gap-2 text-[14px]" style={{ color: fg }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill={accent}><path d="M12 15a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3z" /><path d="M17 12a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.9V21h2v-2.1A7 7 0 0 0 19 12h-2z" /></svg>
                        رسالة صوتية · {m.voiceDuration ?? "0:08"}
                      </div>
                    ) : (
                      <div className="whitespace-pre-wrap break-words text-[15px] leading-[20px]" style={{ color: fg }}>
                        {m.text}
                      </div>
                    )}
                    {mine && (
                      <div className="mt-1 text-[10.5px] font-bold uppercase tracking-wide" style={{ color: sub }}>
                        {statusLabel(status)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {typing && (
            <div className="flex items-center gap-2.5">
              <span className="shrink-0 self-stretch rounded-full" style={{ width: 3, background: SNAP_BLUE }} />
              <div className="flex items-center gap-1 py-1">
                {[0, 1, 2].map((i) => (
                  <span key={i} className="rcss-typing-dot inline-block rounded-full" style={{ width: 7, height: 7, background: SNAP_BLUE, animationDelay: `${i * 0.18}s` }} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input bar */}
      <div className="flex items-center gap-2.5 px-3 pb-2 pt-1.5" style={{ background: pageBg }}>
        <div className="flex h-9 w-9 items-center justify-center rounded-full" style={{ background: dark ? "#1a1a1a" : "#f0f0f0" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="3" y="6" width="18" height="13" rx="3.5" stroke={sub} strokeWidth="1.7" /><circle cx="12" cy="12.5" r="3.2" stroke={sub} strokeWidth="1.7" /><path d="M8 6l1.5-2h5L16 6" stroke={sub} strokeWidth="1.7" strokeLinejoin="round" /></svg>
        </div>
        <div className="flex flex-1 items-center rounded-full px-4 py-2" style={{ border: `1px solid ${dark ? "#2a2a2a" : "#e2e2e2"}` }}>
          <span className="text-[15px]" style={{ color: sub }}>أرسل رسالة شات</span>
        </div>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M4 12h16M4 6h16M4 18h10" stroke={sub} strokeWidth="1.8" strokeLinecap="round" /></svg>
      </div>
      {scenario.device === "iphone" && (
        <div className="flex justify-center pb-2 pt-0.5" style={{ background: pageBg }}>
          <span className="rounded-full" style={{ width: 134, height: 5, background: dark ? "#ffffff" : "#000000" }} />
        </div>
      )}
    </div>
  );
}
