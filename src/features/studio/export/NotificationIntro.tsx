"use client";

/**
 * Intro scene for the exported video: the phone's lock screen, a notification
 * for the first incoming message slides in (iOS 26 lock-screen notification /
 * One UI 8 notification card), the finger presses it and the app opens out of
 * it into the chat.
 *
 * Rendered as DOM inside the export stage (so snapdom captures it with the
 * device's own fonts), above the chat template. Every style is a pure function
 * of `t` (ms into the video) — CSS animations don't run during export.
 *
 * Reference values (iPhone 16 Pro 393×852 pt, Galaxy S25 360×780 dp):
 *  - iOS lock screen: date 20 pt semibold at y≈74, clock ~112 pt heavy, quick
 *    actions Ø50 pt glass circles 46 pt from the sides, 140×5 home indicator.
 *  - iOS communication notification: 12 pt side inset, radius 24, avatar Ø38
 *    with the app icon (Ø16) on its corner, title 15 pt semibold, "now" 13 pt,
 *    body 15/20 pt up to 4 lines.
 *  - One UI 8 lock screen: centred thin clock ~78 dp, date 15 dp, notification
 *    card 12 dp inset, radius 26 dp, header row (app icon Ø18 · name · time),
 *    then the conversation (avatar Ø40, sender 15 dp bold, text 14 dp).
 */

import type { CSSProperties } from "react";

import { StatusBar } from "../components/devices/StatusBar";
import { PlatformMark } from "../components/studio/BrandMarks";
import { useStudioStore } from "../store";
import type { ChatTheme, Device, Platform } from "../types";
import { beat, easeInOutCubic, easeOutCubic, NOTIF } from "./scenes";

export interface NoticeInfo {
  platform: Platform;
  device: Device;
  theme: ChatTheme;
  lang: "ar" | "en";
  /** sender (the other party) */
  name: string;
  avatar: string | null;
  /** one-line preview of the first incoming message */
  text: string;
}

const APP_NAME: Record<Platform, { en: string; ar: string; androidAr?: string }> = {
  whatsapp: { en: "WhatsApp", ar: "WhatsApp" },
  telegram: { en: "Telegram", ar: "Telegram" },
  instagram: { en: "Instagram", ar: "Instagram" },
  snapchat: { en: "Snapchat", ar: "Snapchat" },
  imessage: { en: "Messages", ar: "الرسائل" },
  messenger: { en: "Messenger", ar: "Messenger" },
  tiktok: { en: "TikTok", ar: "TikTok" },
  x: { en: "X", ar: "X" },
  signal: { en: "Signal", ar: "Signal" },
  discord: { en: "Discord", ar: "Discord" },
  viber: { en: "Viber", ar: "Viber" },
};

const NOW = { en: "now", ar: "الآن" };

const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";
const toArabicDigits = (s: string) => s.replace(/\d/g, (d) => AR_DIGITS[+d]);

function dateLine(device: Device, lang: "ar" | "en"): string {
  const d = new Date();
  if (device === "iphone") {
    return new Intl.DateTimeFormat(lang === "ar" ? "ar-u-nu-latn" : "en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    }).format(d);
  }
  return new Intl.DateTimeFormat(lang === "ar" ? "ar-EG" : "en-GB", {
    weekday: "short",
    day: "numeric",
    month: "long",
  }).format(d);
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "";
  const g = (s: string) => Array.from(s)[0] ?? "";
  return parts.length > 1 ? `${g(parts[0])}${g(parts[parts.length - 1])}` : g(parts[0]);
}

function Avatar({ src, name, size }: { src: string | null; name: string; size: number }) {
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- data URL captured by snapdom; next/image can't be used here
      <img src={src} alt="" width={size} height={size} style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", display: "block" }} />
    );
  }
  return (
    <span
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(180deg, #a5abb8 0%, #858994 100%)",
        color: "#fff",
        fontSize: size * 0.4,
        fontWeight: 600,
        letterSpacing: 0.2,
      }}
    >
      {initials(name)}
    </span>
  );
}

/* ---------------------------------------------------------------- icons */

function Flashlight({ color }: { color: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M8 2.8h8l-.6 4.6-1.9 2.4v10.3a1.2 1.2 0 0 1-1.2 1.2h-.6a1.2 1.2 0 0 1-1.2-1.2V9.8L8.6 7.4 8 2.8Z" stroke={color} strokeWidth="1.6" strokeLinejoin="round" />
      <circle cx="12" cy="13.2" r="1.1" fill={color} />
    </svg>
  );
}

function Camera({ color }: { color: string }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4.5 7.2h3l1.4-2h6.2l1.4 2h3a1.5 1.5 0 0 1 1.5 1.5v9.1a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.8V8.7a1.5 1.5 0 0 1 1.5-1.5Z" stroke={color} strokeWidth="1.6" strokeLinejoin="round" />
      <circle cx="12" cy="12.9" r="3.4" stroke={color} strokeWidth="1.6" />
    </svg>
  );
}

function Phone({ color }: { color: string }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M6.6 3.6h2.6l1.4 4-1.9 1.4a11 11 0 0 0 6.3 6.3l1.4-1.9 4 1.4v2.6a2 2 0 0 1-2.2 2A16.4 16.4 0 0 1 4.6 5.8a2 2 0 0 1 2-2.2Z" stroke={color} strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

/* ------------------------------------------------------------ timing */

/** Lock layer (wallpaper + notification) style during the open transition. */
function lockStyle(t: number, device: Device): CSSProperties {
  const p = easeInOutCubic(beat(t, NOTIF.openAt, NOTIF.openMs));
  if (p <= 0) return {};
  const s = device === "iphone" ? 1 + 0.12 * p : 1 + 0.05 * p;
  return { opacity: 1 - p, transform: `scale(${s})` };
}

/**
 * Chat layer style while the intro runs: hidden until the app opens, then it
 * grows out of the notification (iOS) / rises and fades in (One UI).
 */
export function introChatStyle(t: number | null, device: Device, screenH: number): CSSProperties | undefined {
  if (t === null) return undefined;
  const raw = beat(t, NOTIF.openAt, NOTIF.openMs);
  if (raw <= 0) return { opacity: 0 };
  if (raw >= 1) return undefined;
  const p = easeInOutCubic(raw);
  const op = Math.min(1, raw * 2.2);
  if (device === "iphone") {
    // the notification sits low on the lock screen: grow from there
    const originY = screenH * 0.8;
    const s = 0.9 + 0.1 * p;
    return {
      opacity: op,
      transform: `scale(${s})`,
      transformOrigin: `50% ${originY}px`,
      borderRadius: 48 * (1 - p),
      overflow: "hidden",
    };
  }
  return { opacity: op, transform: `translateY(${(1 - p) * 34}px) scale(${0.96 + 0.04 * p})`, transformOrigin: "50% 40%" };
}

/* ------------------------------------------------------------- scenes */

function IosLock({ n, t }: { n: NoticeInfo; t: number }) {
  const dark = n.theme === "dark";
  const rtl = n.lang === "ar";
  const pin = easeOutCubic(beat(t, NOTIF.inAt, NOTIF.inMs));
  const press = Math.sin(Math.PI * beat(t, NOTIF.pressAt, 260));
  const platter: CSSProperties = {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 128,
    borderRadius: 24,
    padding: "13px 14px 13px 14px",
    display: "flex",
    alignItems: "flex-start",
    gap: 10,
    background: dark ? "rgba(37,37,39,0.86)" : "rgba(246,246,248,0.86)",
    boxShadow: dark
      ? "0 0 0 0.5px rgba(255,255,255,0.10) inset, 0 8px 24px rgba(0,0,0,0.25)"
      : "0 0 0 0.5px rgba(255,255,255,0.65) inset, 0 8px 24px rgba(0,0,0,0.18)",
    opacity: pin,
    transform: `translateY(${(1 - pin) * 46}px) scale(${(0.94 + 0.06 * pin) * (1 - 0.025 * press)})`,
    transformOrigin: "50% 100%",
    direction: rtl ? "rtl" : "ltr",
  };
  const fg = dark ? "#ffffff" : "#000000";
  const sub = dark ? "rgba(235,235,245,0.6)" : "rgba(60,60,67,0.6)";
  const ctl: CSSProperties = {
    position: "absolute",
    bottom: 46,
    width: 50,
    height: 50,
    borderRadius: 25,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(28,28,30,0.34)",
    boxShadow: "0 0 0 0.5px rgba(255,255,255,0.22) inset",
  };
  return (
    <>
      {/* wallpaper */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: [
            "radial-gradient(120% 70% at 15% 8%, rgba(255,140,105,0.85) 0%, rgba(255,140,105,0) 60%)",
            "radial-gradient(110% 60% at 95% 30%, rgba(120,92,255,0.9) 0%, rgba(120,92,255,0) 62%)",
            "radial-gradient(130% 70% at 20% 95%, rgba(28,120,255,0.95) 0%, rgba(28,120,255,0) 64%)",
            "linear-gradient(180deg, #2a1f5c 0%, #10204e 55%, #061433 100%)",
          ].join(", "),
        }}
      />
      <div className="scx-lock-sb" style={{ position: "absolute", top: 0, left: 0, right: 0 }}>
        <StatusBar device="iphone" tint="light" />
      </div>
      <div
        dir="ltr"
        style={{ position: "absolute", top: 70, left: 0, right: 0, textAlign: "center", color: "rgba(255,255,255,0.92)" }}
      >
        <div style={{ fontSize: 20, fontWeight: 600, lineHeight: "24px", letterSpacing: 0.1 }} dir={rtl ? "rtl" : "ltr"}>
          {dateLine("iphone", n.lang)}
        </div>
        <div
          style={{
            fontSize: 112,
            fontWeight: 700,
            lineHeight: "112px",
            letterSpacing: -3,
            marginTop: 2,
            color: "rgba(255,255,255,0.94)",
            fontFeatureSettings: '"tnum" 0, "ss01" 1',
          }}
        >
          <LockClock device="iphone" lang={n.lang} />
        </div>
      </div>

      <div style={platter}>
        <div style={{ position: "relative", flexShrink: 0, width: 38, height: 38, marginTop: 1 }}>
          <Avatar src={n.avatar} name={n.name} size={38} />
          <span style={{ position: "absolute", [rtl ? "left" : "right"]: -4, bottom: -4, display: "block", lineHeight: 0 }}>
            <PlatformMark platform={n.platform} device="iphone" size={18} />
          </span>
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <span
              style={{ flex: 1, minWidth: 0, fontSize: 15, fontWeight: 600, lineHeight: "20px", color: fg, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
            >
              {n.name}
            </span>
            <span style={{ fontSize: 13, lineHeight: "18px", color: sub, flexShrink: 0 }}>{NOW[n.lang]}</span>
          </div>
          <div
            style={{
              fontSize: 15,
              lineHeight: "20px",
              color: fg,
              display: "-webkit-box",
              WebkitLineClamp: 4,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              unicodeBidi: "plaintext",
              textAlign: "start",
            }}
          >
            {n.text}
          </div>
        </div>
      </div>

      <span style={{ ...ctl, left: 46 }}>
        <Flashlight color="#fff" />
      </span>
      <span style={{ ...ctl, right: 46 }}>
        <Camera color="#fff" />
      </span>
      <span
        style={{ position: "absolute", bottom: 8, left: "50%", width: 140, height: 5, marginLeft: -70, borderRadius: 3, background: "#fff" }}
      />
    </>
  );
}

function OneUiLock({ n, t }: { n: NoticeInfo; t: number }) {
  const dark = n.theme === "dark";
  const rtl = n.lang === "ar";
  const pin = easeOutCubic(beat(t, NOTIF.inAt, NOTIF.inMs));
  const press = Math.sin(Math.PI * beat(t, NOTIF.pressAt, 260));
  const fg = dark ? "#fafafa" : "#000000";
  const sub = dark ? "rgba(250,250,250,0.62)" : "rgba(0,0,0,0.55)";
  const app = APP_NAME[n.platform];
  const appName = n.platform === "imessage" ? (rtl ? "الرسائل" : "Messages") : rtl ? app.ar : app.en;
  const time = n.lang === "ar" ? NOW.ar : NOW.en;
  return (
    <>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: [
            "radial-gradient(120% 60% at 85% 10%, rgba(126,200,255,0.9) 0%, rgba(126,200,255,0) 60%)",
            "radial-gradient(120% 70% at 0% 70%, rgba(64,96,230,0.9) 0%, rgba(64,96,230,0) 62%)",
            "radial-gradient(90% 50% at 90% 100%, rgba(160,110,255,0.75) 0%, rgba(160,110,255,0) 70%)",
            "linear-gradient(180deg, #2b5fb8 0%, #1d3b8c 50%, #12204f 100%)",
          ].join(", "),
        }}
      />
      <div className="scx-lock-sb" style={{ position: "absolute", top: 0, left: 0, right: 0 }}>
        <StatusBar device="android" tint="light" />
      </div>
      <div style={{ position: "absolute", top: 76, left: 0, right: 0, textAlign: "center", color: "#fff" }}>
        <div dir="ltr" style={{ fontSize: 78, fontWeight: 300, lineHeight: "84px", letterSpacing: -1 }}>
          <LockClock device="android" lang={n.lang} />
        </div>
        <div style={{ fontSize: 15, fontWeight: 500, lineHeight: "20px", marginTop: 4, color: "rgba(255,255,255,0.92)" }}>
          {dateLine("android", n.lang)}
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: 12,
          right: 12,
          top: 252,
          borderRadius: 26,
          padding: "12px 16px 15px",
          background: dark ? "rgba(36,36,38,0.9)" : "rgba(255,255,255,0.9)",
          boxShadow: "0 6px 20px rgba(0,0,0,0.16)",
          opacity: pin,
          transform: `translateY(${(pin - 1) * 28}px) scale(${1 - 0.025 * press})`,
          direction: rtl ? "rtl" : "ltr",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, lineHeight: "18px", color: sub }}>
          <span style={{ width: 18, height: 18, borderRadius: 9, overflow: "hidden", display: "block", lineHeight: 0 }}>
            <PlatformMark platform={n.platform} device="android" size={18} />
          </span>
          <span style={{ color: fg, fontWeight: 500 }}>{appName}</span>
          <span>•</span>
          <span>{time}</span>
        </div>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginTop: 9 }}>
          <div style={{ flexShrink: 0 }}>
            <Avatar src={n.avatar} name={n.name} size={40} />
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 700, lineHeight: "20px", color: fg, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {n.name}
            </div>
            <div
              style={{
                fontSize: 14,
                lineHeight: "19px",
                color: dark ? "rgba(250,250,250,0.86)" : "rgba(0,0,0,0.78)",
                display: "-webkit-box",
                WebkitLineClamp: 3,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                unicodeBidi: "plaintext",
                textAlign: "start",
              }}
            >
              {n.text}
            </div>
          </div>
        </div>
      </div>

      <span dir="ltr" style={{ position: "absolute", bottom: 40, left: 40, display: "block", lineHeight: 0 }}>
        <Phone color="#fff" />
      </span>
      <span dir="ltr" style={{ position: "absolute", bottom: 40, right: 40, display: "block", lineHeight: 0 }}>
        <Camera color="#fff" />
      </span>
    </>
  );
}

/** The big lock-screen clock uses the same time as the status bar setting. */
function LockClock({ device, lang }: { device: Device; lang: "ar" | "en" }) {
  const t = useClock(device);
  return <>{device === "android" && lang === "ar" ? toArabicDigits(t) : t}</>;
}

function useClock(device: Device): string {
  const custom = useStudioStore((s) => s.scenario.statusBar?.time);
  const fallback = device === "iphone" ? "9:41" : "10:05";
  return custom && custom.trim() ? custom.trim() : fallback;
}

/** The whole intro overlay; `t` = ms since the start of the video. */
export function NotificationIntro({ notice, t, device }: { notice: NoticeInfo; t: number; device: Device }) {
  return (
    <div
      aria-hidden
      style={{ position: "absolute", inset: 0, zIndex: 20, overflow: "hidden", pointerEvents: "none", ...lockStyle(t, device) }}
    >
      {/* the lock screen hides the status-bar clock (the big clock replaces it) */}
      <style>{`.scx-lock-sb > div > span:first-child, .scx-lock-sb > div > div:first-child { visibility: hidden; }`}</style>
      {device === "iphone" ? <IosLock n={notice} t={t} /> : <OneUiLock n={notice} t={t} />}
    </div>
  );
}
