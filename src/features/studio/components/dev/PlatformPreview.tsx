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
import { PhoneScreen } from "../devices/PhoneScreen";
import { keyboardLangFor } from "../../playback/compose";
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
 *   &keyboard=1 (show the OS keyboard over the template, i.e. PlaybackView.keyboard)
 *   &fixture=extras (link preview, edited, location, file, calls, sticker, deleted)
 *   &group=1 (3-member group chat: Scenario.group + Message.authorIndex)
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

/**
 * Every new message kind in one thread: link preview, edited, location, file,
 * missed + connected calls, sticker, deleted. With &group=1 the "them"
 * messages rotate across three members (authorIndex 0–2).
 */
function extrasFixture(lang: "ar" | "en", group: boolean): Message[] {
  seq = 100;
  const ar = lang === "ar";
  const by = (i: number) => (group ? { authorIndex: i } : {});
  return [
    msg({ sender: "them", ...by(0), text: ar ? "وصل الطلب؟" : "Did the order ship?", time: "9:40" }),
    msg({ sender: "them", ...by(1), type: "call", text: "", call: { video: false, missed: true }, time: "9:41" }),
    msg({
      sender: "me",
      text: ar ? "نعم! تتبّعه هنا https://noon.store/track/48213" : "Yes! Track it here https://noon.store/track/48213",
      link: {
        url: "https://noon.store/track/48213",
        title: ar ? "تتبع الطلب #48213 — متجر نون" : "Track order #48213 — Noon Store",
        description: ar ? "طلبك في الطريق ويصل اليوم" : "Your order is on its way and arrives today",
        siteName: "noon.store",
        image: PHOTO,
      },
      time: "9:43",
      status: "read",
    }),
    msg({ sender: "me", text: ar ? "يوصلك قبل الساعة ٦ إن شاء الله" : "It should arrive before 6 pm", edited: true, time: "9:43", status: "read" }),
    msg({ sender: "them", ...by(2), type: "location", text: "", location: { title: ar ? "حي العليا، الرياض" : "Olaya, Riyadh", subtitle: ar ? "شارع العليا العام" : "Olaya St" }, time: "9:45" }),
    msg({ sender: "me", type: "file", text: "", file: { name: "Invoice-48213.pdf", size: "245 KB", pages: ar ? "صفحتان" : "2 pages" }, time: "9:46", status: "delivered" }),
    msg({ sender: "them", ...by(0), type: "sticker", text: "🎉", time: "9:47" }),
    msg({ sender: "them", ...by(1), type: "deleted", text: "", time: "9:48" }),
    msg({ sender: "me", type: "call", text: "", call: { video: true, missed: false, duration: "4:12" }, time: "9:52", status: "read" }),
  ];
}

const GROUP = (lang: "ar" | "en") => ({
  name: lang === "ar" ? "فريق متجر نون 🛍️" : "Noon Store Team 🛍️",
  avatar: null,
  members: [
    { name: lang === "ar" ? "خالد" : "Khalid", avatar: null },
    { name: lang === "ar" ? "سارة" : "Sara", avatar: null },
    { name: lang === "ar" ? "عمر" : "Omar", avatar: null },
  ],
});

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
  const keyboardParam = sp.get("keyboard") === "1";
  // &group=1 turns the thread into a 3-member group chat; &fixture=extras shows the new message kinds
  const groupParam = sp.get("group") === "1";
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
      messages:
        fixture === "default"
          ? base.messages
          : fixture === "extras"
            ? extrasFixture(lang, groupParam)
            : groupParam
              ? fullFixture(lang).map((m, i) => (m.sender === "them" ? { ...m, authorIndex: i % 3 } : m))
              : fullFixture(lang),
      group: groupParam ? GROUP(lang) : null,
    };
  }, [platform, device, theme, presence, fixture, lang, groupParam]);

  const live = usePlayback(scenario);
  const staticView: PlaybackView = useMemo(
    () => ({
      phase: "idle",
      isLive: false,
      messages: scenario.messages,
      typing: forceTyping,
      draft: draftParam ? { messageId: "preview-draft", text: draftParam } : null,
      // &keyboard=1 shows the OS keyboard (layout from the draft text, else the UI language)
      keyboard: keyboardParam ? { open: 1, lang: draftParam ? keyboardLangFor(draftParam) : lang } : null,
      clockMs,
      statusOf: (m) => m.status,
      play: () => {},
      pause: () => {},
      resume: () => {},
      restart: () => {},
      reset: () => {},
    }),
    [scenario, forceTyping, clockMs, draftParam, keyboardParam, lang],
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
    if (play) {
      // live playback scrolls itself; just signal readiness for tooling
      const t = setTimeout(() => (document.body.dataset.ready = "1"), 2500);
      return () => clearTimeout(t);
    }
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
        <PhoneScreen scenario={scenario} playback={play ? live : staticView}>
          <PlatformView scenario={scenario} playback={play ? live : staticView} lang={lang} rtl={rtl} />
        </PhoneScreen>
      </DeviceFrame>
    </div>
  );
}
