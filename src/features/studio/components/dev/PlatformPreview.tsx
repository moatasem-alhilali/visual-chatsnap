"use client";

import { useSearchParams } from "next/navigation";
import { useLocale } from "next-intl";
import { useEffect, useMemo, useRef } from "react";

import type { PlaybackView } from "../../playback/usePlayback";
import { usePlayback } from "../../playback/usePlayback";
import type { ChatTheme, Device, Message, Platform, PresenceStatus, Scenario } from "../../types";
import { createDefaultScenario } from "../../data/defaults";
import { deviceFontFamily } from "../../data/fonts";
import { DeviceFrame } from "../devices/DeviceFrame";
import { PlatformView } from "../platforms";

/**
 * Dev-only harness: renders ONE phone at 1:1 scale, driven entirely by the URL,
 * so platform templates can be screenshotted deterministically (headless
 * Chrome) and compared against the real apps.
 *
 *   /en/preview?platform=whatsapp&device=iphone&theme=dark&fixture=full
 *   &presence=online|typing|lastseen  &typing=1 (force the typing indicator)
 *   &scroll=top|bottom  &play=1 (run the real cinematic playback)
 *   &clock=1234 (simulate the video exporter clock, i.e. PlaybackView.clockMs)
 *   &draft=Hello (show a compose-typing draft in the composer, i.e. PlaybackView.draft)
 *   &finish=<id> (phone colour from DEVICE_FINISHES)
 *   The full fixture includes a reply (replyToId) and reactions on both sides.
 */

const PHOTO =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='600' height='800'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='#f6d365'/><stop offset='1' stop-color='#fda085'/></linearGradient></defs><rect width='600' height='800' fill='url(#g)'/><circle cx='430' cy='190' r='90' fill='#fff' fill-opacity='.55'/><path d='M0 640 200 420 360 600 470 500 600 640V800H0z' fill='#7a4e2d' fill-opacity='.55'/></svg>`,
  );

let seq = 0;
function msg(p: Partial<Message> & Pick<Message, "sender" | "text">): Message {
  seq += 1;
  return {
    id: `fx${seq}`,
    type: "text",
    time: "10:41",
    delayMs: 500,
    typingMs: p.sender === "them" ? 900 : 0,
    status: "read",
    ...p,
  };
}

/** Covers every rendering case: grouping, long wraps, emoji-only, voice, images, statuses. */
function fullFixture(lang: "ar" | "en"): Message[] {
  seq = 0;
  const ar = lang === "ar";
  return [
    msg({ sender: "them", text: ar ? "مرحبا 👋" : "Hey 👋", time: "9:58" }),
    msg({
      sender: "them",
      text: ar
        ? "شفت إعلانكم عن عرض نهاية الأسبوع، هل التوصيل متاح لكل المدن ولا بس الرياض؟"
        : "Saw your weekend sale ad — is delivery available to every city or just the capital?",
      time: "9:58",
    }),
    msg({ sender: "them", text: ar ? "وكم مدة الشحن؟" : "And how long is shipping?", time: "9:59" }),
    msg({ sender: "me", text: ar ? "أهلاً فيك!" : "Hi there!", time: "10:02", status: "read" }),
    msg({
      sender: "me",
      text: ar
        ? "التوصيل متاح لجميع المدن ✅ ويوصلك خلال يومين إلى ثلاثة أيام عمل"
        : "Delivery is available everywhere ✅ and arrives in 2–3 business days",
      time: "10:02",
      status: "read",
      // reply quoting their question (fx2)
      replyToId: "fx2",
    }),
    msg({ sender: "them", type: "voice", text: "", voiceDuration: "0:14", time: "10:05" }),
    msg({ sender: "me", type: "image", text: "", imageSrc: PHOTO, time: "10:06", status: "read" }),
    msg({
      sender: "me",
      type: "image",
      text: ar ? "هذا اللون الأكثر طلباً" : "This colour sells out fastest",
      imageSrc: PHOTO,
      time: "10:06",
      status: "read",
      // their reaction on my message
      reaction: "❤️",
    }),
    msg({ sender: "them", text: "😍", time: "10:08" }),
    // my reaction on their message
    msg({ sender: "them", text: ar ? "OK تمام، أبغى واحد" : "Perfect, I'll take one", time: "10:08", reaction: "👍" }),
    msg({ sender: "me", type: "voice", text: "", voiceDuration: "0:07", time: "10:09", status: "read" }),
    msg({ sender: "me", text: ar ? "تم تسجيل طلبك 🎉" : "Order placed 🎉", time: "10:10", status: "delivered" }),
    msg({ sender: "me", text: ar ? "رقم الطلب #48213" : "Order #48213", time: "10:10", status: "sent" }),
  ];
}

function pick<T extends string>(v: string | null, allowed: readonly T[], fallback: T): T {
  return v && (allowed as readonly string[]).includes(v) ? (v as T) : fallback;
}

export function PlatformPreview() {
  const sp = useSearchParams();
  const locale = useLocale();
  const lang = locale === "en" ? "en" : "ar";
  const rtl = lang === "ar";

  const platform = pick<Platform>(sp.get("platform"), ["whatsapp", "telegram", "instagram", "snapchat", "imessage", "messenger", "tiktok", "x", "signal", "discord", "viber"], "whatsapp");
  const device = pick<Device>(sp.get("device"), ["iphone", "android"], "iphone");
  const theme = pick<ChatTheme>(sp.get("theme"), ["light", "dark"], "light");
  const presence = pick<PresenceStatus>(sp.get("presence"), ["online", "typing", "lastseen"], "online");
  const fixture = sp.get("fixture") ?? "full";
  const forceTyping = sp.get("typing") === "1";
  const scroll = sp.get("scroll") ?? "bottom";
  const play = sp.get("play") === "1";
  const clockParam = sp.get("clock");
  // force a compose-typing draft in the composer (e.g. &draft=On%20my%20way)
  const draftParam = sp.get("draft");
  // phone finish id from DEVICE_FINISHES (e.g. &finish=blue-titanium)
  const finish = sp.get("finish");
  const clockMs = clockParam === null ? undefined : Number(clockParam);

  const scenario = useMemo<Scenario>(() => {
    const base = createDefaultScenario();
    return {
      ...base,
      platform,
      device,
      theme,
      presence,
      me: { name: lang === "ar" ? "متجر نون" : "Noon Store", avatar: null },
      them: { name: lang === "ar" ? "خالد" : "Khalid", avatar: null },
      lastSeenText: lang === "ar" ? "آخر ظهور اليوم 9:30 ص" : "last seen today at 9:30 AM",
      messages: fixture === "default" ? base.messages : fullFixture(lang),
    };
  }, [platform, device, theme, presence, fixture, lang]);

  const live = usePlayback(scenario);
  const staticView: PlaybackView = useMemo(
    () => ({
      phase: "idle",
      isLive: false,
      messages: scenario.messages,
      typing: forceTyping,
      draft: draftParam ? { messageId: "preview-draft", text: draftParam } : null,
      clockMs,
      statusOf: (m) => m.status,
      play: () => {},
      pause: () => {},
      resume: () => {},
      restart: () => {},
      reset: () => {},
    }),
    [scenario, forceTyping, clockMs, draftParam],
  );

  const { play: startPlay } = live;
  const started = useRef(false);
  useEffect(() => {
    if (play && !started.current) {
      started.current = true;
      startPlay();
    }
  }, [play, startPlay]);

  // Pin the chat body to top/bottom and keep re-pinning while layout settles
  // (lazy template chunk, fonts, images, useChatScroll's smooth scroll, a slow
  // dev server) — a single timer was flaky under load. Live playback (play=1)
  // is left alone so the template's own auto-scroll is what gets captured.
  useEffect(() => {
    if (play) return;
    const pin = () =>
      document.querySelectorAll<HTMLElement>(".rcss-scroll").forEach((el) => {
        el.style.scrollBehavior = "auto";
        const target = scroll === "top" ? 0 : el.scrollHeight;
        if (Math.abs(el.scrollTop - target) > 1) el.scrollTop = target;
        el.dispatchEvent(new Event("scroll"));
      });
    const started = Date.now();
    const iv = setInterval(() => {
      pin();
      if (Date.now() - started > 6000) {
        clearInterval(iv);
        document.body.dataset.ready = "1";
      }
    }, 150);
    return () => clearInterval(iv);
  }, [scroll, scenario, play]);

  return (
    <div
      dir="ltr"
      style={{ position: "fixed", left: 0, top: 0, padding: 8, background: "#ffffff" }}
      data-preview-platform={platform}
    >
      {/* keep screenshots clean: no consent banner, no Next dev indicator */}
      <style>{`body{margin:0;background:#fff} nextjs-portal{display:none!important} body > .fixed.bottom-0.z-50, .pointer-events-none.fixed.inset-x-0.bottom-0{display:none!important}`}</style>
      <DeviceFrame device={device} finish={finish ?? undefined} dir={rtl ? "rtl" : "ltr"} fontFamily={deviceFontFamily(device, scenario.androidFont)}>
        <PlatformView scenario={scenario} playback={play ? live : staticView} lang={lang} rtl={rtl} />
      </DeviceFrame>
    </div>
  );
}
