"use client";

/**
 * Instagram Direct — thread screen (iPhone). The thread body is shared with
 * `InstagramAndroid` through `IgThread` + an OS spec, so both stay identical
 * where the real apps are identical and differ only where they really differ.
 *
 * Reference values (cross-checked 2025-2026 sources + app screenshots):
 *  - Canvas: light #FFFFFF / dark #000000 (true black). Secondary text light
 *    #737373, dark #A8A8A8; dark elevated surface / incoming bubble #262626;
 *    separators #363636 (dark) / #DBDBDB (light).
 *    https://themeandcolor.com/blog/instagram-dark-mode-colors
 *  - Incoming bubble: light #EFEFEF, dark #262626. Outgoing bubble (default
 *    theme): the Messenger-style purple → blue gradient that is anchored to the
 *    SCREEN, not the bubble — bubbles near the top read purple/magenta, the
 *    newest ones at the bottom read blue, and the colour shifts as you scroll.
 *    https://www.howtogeek.com/698074/how-to-change-the-theme-and-accent-color-of-instagram-dms
 *    https://www.bustle.com/life/how-to-change-chat-color-instagram-dms
 *    https://true-tech.net/exclusive-instagram-testing-messenger-like-typing-bubbles-gradient-backgrounds/
 *    https://www.wwebcustomizer.com/blog/how-to-make-whatsapp-web-look-like-instagram-dms-2026
 *    (Meta does not publish the stops; values below are sampled from screenshots.)
 *  - Typing: grey bubble with three animated dots + the sender's avatar (no
 *    "typing…" text in the header) — true-tech.net (above).
 *  - Bubbles: 16pt text, ~22pt radius (single line = pill), 4pt radius on the
 *    joined side of grouped bubbles, 2pt gap inside a group, ~10pt between
 *    groups; 28pt avatar beside the LAST incoming bubble of a group only.
 *  - "Seen" / "Sent" 12pt secondary text under your last message, only while it
 *    is the newest message in the thread.
 *  - Composer: filled pill, leading round camera button, "Message..."
 *    placeholder, mic / gallery / sticker and the 2025 "+" menu on the trailing
 *    side. https://www.socialmediatoday.com/news/instagram-adds-option-draw-on-dms-chats-stickers/803702/
 *  - Header: back chevron, avatar with green active dot (#78DE45), name +
 *    "Active now"/handle, audio-call and video-call outline icons.
 *    https://www.trymypost.com/instagram/chat
 */

import { useCallback, useEffect, useLayoutEffect, type CSSProperties, type ReactNode } from "react";

import type { Device, Message, Person } from "../../types";
import { Avatar, dirOf, SystemBottomBar, useChatScroll } from "../shared";
import { StatusBar } from "../devices/StatusBar";
import type { Lang } from "./chrome";
import { groupInfo, type PlatformProps } from "./types";

/* ------------------------------ tokens ------------------------------ */

/** Default-theme gradient, top of the screen → bottom of the screen. */
export const IG_OUT_GRADIENT = "linear-gradient(180deg, #a22fe8 0%, #7a3bf3 48%, #4161f6 100%)";
/** Solid fallback (colour at the bottom of the screen — where new messages land). */
export const IG_OUT_SOLID = "#4f58f5";
/** Theme accent used for the composer camera button. */
const IG_ACCENT = "#5b4ff0";
const IG_ACTIVE_GREEN = "#78de45";

export interface IgPalette {
  bg: string;
  fg: string;
  sub: string;
  inBubble: string;
  field: string;
  dots: string;
  imgPlaceholder: string;
}

export function igPalette(dark: boolean): IgPalette {
  return dark
    ? { bg: "#000000", fg: "#ffffff", sub: "#a8a8a8", inBubble: "#262626", field: "#262626", dots: "#a8a8a8", imgPlaceholder: "#1f1f1f" }
    : { bg: "#ffffff", fg: "#000000", sub: "#737373", inBubble: "#efefef", field: "#efefef", dots: "#8e8e8e", imgPlaceholder: "#e6e6e6" };
}

/** Instagram's own localized chrome strings (en / ar builds of the app). */
const IG_STRINGS: Record<Lang, {
  activeNow: string;
  message: string;
  seen: string;
  sent: string;
  today: string;
  viewProfile: string;
  instagram: string;
  typing: string;
}> = {
  en: {
    activeNow: "Active now",
    message: "Message...",
    seen: "Seen",
    sent: "Sent",
    today: "Today",
    viewProfile: "View profile",
    instagram: "Instagram",
    typing: "Typing...",
  },
  ar: {
    activeNow: "نشط الآن",
    message: "مراسلة...",
    seen: "تمت المشاهدة",
    sent: "تم الإرسال",
    today: "اليوم",
    viewProfile: "عرض الملف الشخصي",
    instagram: "Instagram",
    typing: "يكتب...",
  },
};

/** Per-OS differences (status bar, back glyph, metrics). */
export interface IgSpec {
  renderStatusBar: (p: { device: Device; dark: boolean; bg: string; lang: Lang }) => ReactNode;
  renderBack: (color: string) => ReactNode;
  /** device used for the OS navigation affordance at the bottom */
  bottomDevice: (scenarioDevice: Device) => Device;
  textSize: number;
  lineHeight: number;
  bubblePadX: number;
  bubblePadY: number;
  bubbleMax: string;
  radius: number;
  joinedRadius: number;
  inAvatar: number;
  bodyPadX: number;
  headerAvatar: number;
  headerHeight: number;
  headerPadStart: number;
  headerPadEnd: number;
  nameSize: number;
  nameWeight: number;
  subSize: number;
  iconSize: number;
  composerHeight: number;
  composerText: number;
  /** extra space below the composer (above the OS bar) */
  composerBottom: number;
}

/* ------------------------------- icons ------------------------------ */

function IosBack({ color }: { color: string }) {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" className="shrink-0 rtl:-scale-x-100">
      <path d="M15.6 4.2 7.8 12l7.8 7.8" stroke={color} strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IgPhoneIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="rtl:-scale-x-100">
      <path
        d="M18.6 21.6c-4.1 0-8.5-2.5-11.7-5.6C3.8 12.9 1.6 8.7 2.4 5.2c.2-.9.8-1.6 1.6-2.1l1.3-.8c.9-.5 2-.3 2.6.5l2.1 3c.6.8.5 1.9-.2 2.6l-1 1c.6 1.4 1.4 2.6 2.4 3.6 1 1 2.2 1.8 3.6 2.4l1-1c.7-.7 1.8-.8 2.6-.2l3 2.1c.8.6 1 1.7.5 2.6l-.8 1.3c-.5.8-1.2 1.4-2.1 1.6-.4.1-.9.1-1.3.1Z"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IgVideoIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="rtl:-scale-x-100">
      <rect x="1.8" y="5.2" width="14.4" height="13.6" rx="3.6" stroke="currentColor" strokeWidth="1.9" />
      <path d="M16.2 10.1 21 7.3c.5-.3 1.2.1 1.2.7v8c0 .6-.7 1-1.2.7l-4.8-2.8" stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round" />
    </svg>
  );
}

function CameraGlyph() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24">
      <path
        fillRule="evenodd"
        fill="#ffffff"
        d="M9.3 3.8h5.4c.6 0 1.1.3 1.4.8l1 1.6H19a3 3 0 0 1 3 3v8.6a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3V9.2a3 3 0 0 1 3-3h1.9l1-1.6c.3-.5.8-.8 1.4-.8ZM12 9a4.2 4.2 0 1 0 0 8.4A4.2 4.2 0 0 0 12 9Zm0 2a2.2 2.2 0 1 1 0 4.4 2.2 2.2 0 0 1 0-4.4Z"
      />
    </svg>
  );
}

function MicIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round">
      <rect x="8.6" y="2" width="6.8" height="12.2" rx="3.4" />
      <path d="M5 10.8a7 7 0 0 0 14 0M12 17.8V22" />
    </svg>
  );
}

function GalleryIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round" strokeLinecap="round">
      <rect x="2.2" y="2.2" width="19.6" height="19.6" rx="5" />
      <circle cx="8.4" cy="8.4" r="1.7" fill="currentColor" stroke="none" />
      <path d="M2.6 17.2 7.4 12.4a1.6 1.6 0 0 1 2.2 0l7.2 7.2M14.2 15.6l1.7-1.7a1.6 1.6 0 0 1 2.2 0l3.6 3.6" />
    </svg>
  );
}

function StickerIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round" strokeLinecap="round" className="rtl:-scale-x-100">
      <path d="M15.4 21.8H7.2a5 5 0 0 1-5-5V7.2a5 5 0 0 1 5-5h9.6a5 5 0 0 1 5 5v8.2l-6.4 6.4Z" />
      <path d="M15.4 21.8v-2.9a3.5 3.5 0 0 1 3.5-3.5h2.9" />
      <circle cx="8.9" cy="9.4" r="1.15" fill="currentColor" stroke="none" />
      <circle cx="15.1" cy="9.4" r="1.15" fill="currentColor" stroke="none" />
      <path d="M8.3 13.6c.9 1.2 2.2 1.8 3.7 1.8" />
    </svg>
  );
}

function PlusCircleIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round">
      <circle cx="12" cy="12" r="9.9" />
      <path d="M12 7.4v9.2M7.4 12h9.2" />
    </svg>
  );
}

function ImageGlyph({ color }: { color: string }) {
  return (
    <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round">
      <rect x="2.5" y="2.5" width="19" height="19" rx="5" />
      <circle cx="8.6" cy="8.6" r="1.6" fill={color} stroke="none" />
      <path d="M3 17 7.6 12.4a1.5 1.5 0 0 1 2.1 0l7 7" />
    </svg>
  );
}

/* ------------------------------ helpers ----------------------------- */

/** "10:42", "9:05 PM", "٩:٠٥ م" → minutes since midnight (null if unparseable). */
function minutesOf(time: string): number | null {
  const norm = time.replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
  const mt = /(\d{1,2})[:.](\d{2})\s*(am|pm|ص|م)?/i.exec(norm);
  if (!mt) return null;
  let h = Number(mt[1]);
  const min = Number(mt[2]);
  const ap = mt[3]?.toLowerCase();
  if (ap === "pm" || ap === "م") h = (h % 12) + 12;
  else if (ap === "am" || ap === "ص") h = h % 12;
  return h * 60 + min;
}

/** Instagram drops a centered timestamp at the top and after ~1h of silence. */
function needsSeparator(messages: Message[], i: number): boolean {
  if (i === 0) return true;
  const a = minutesOf(messages[i - 1].time);
  const b = minutesOf(messages[i].time);
  if (a == null || b == null) return false;
  return b - a >= 60 || b < a;
}

function handleOf(p: Person): string {
  return p.name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9._]/g, "");
}

type Corners = Pick<CSSProperties, "borderTopLeftRadius" | "borderTopRightRadius" | "borderBottomLeftRadius" | "borderBottomRightRadius">;

/** Joined-side corners shrink inside a group (Messenger/Instagram style). */
function cornersFor(onRight: boolean, joinedAbove: boolean, joinedBelow: boolean, r: number, j: number): Corners {
  const top = joinedAbove ? j : r;
  const bottom = joinedBelow ? j : r;
  return onRight
    ? { borderTopLeftRadius: r, borderBottomLeftRadius: r, borderTopRightRadius: top, borderBottomRightRadius: bottom }
    : { borderTopRightRadius: r, borderBottomRightRadius: r, borderTopLeftRadius: top, borderBottomLeftRadius: bottom };
}

/* ---------------------------- sub-views ----------------------------- */

const WAVE = [5, 9, 14, 8, 18, 12, 7, 15, 20, 11, 6, 13, 17, 9, 5, 12, 16, 8, 14, 10, 6, 11, 15, 7, 4, 9, 6];

function VoiceContent({ mine, pal, duration }: { mine: boolean; pal: IgPalette; duration?: string }) {
  const ink = mine ? "#ffffff" : pal.fg;
  return (
    <div dir="ltr" className="flex items-center gap-2.5" style={{ minWidth: 196, height: 24 }}>
      <svg width="18" height="18" viewBox="0 0 24 24" className="shrink-0">
        <path d="M7 4.8v14.4c0 .9 1 1.5 1.8 1L20 13c.7-.5.7-1.5 0-2L8.8 3.8C8 3.3 7 3.9 7 4.8Z" fill={ink} />
      </svg>
      <div className="flex flex-1 items-center justify-between" style={{ height: 22 }}>
        {WAVE.map((b, i) => (
          <span key={i} style={{ width: 2.6, height: b, borderRadius: 2, background: ink, opacity: mine ? 0.92 : 0.85 }} />
        ))}
      </div>
      <span className="shrink-0 tabular-nums" style={{ fontSize: 13, color: ink, opacity: 0.95 }}>
        {duration ?? "0:08"}
      </span>
    </div>
  );
}

function TypingRow({ person, pal, spec }: { person: Person; pal: IgPalette; spec: IgSpec }) {
  return (
    <div className="rcss-anim-pop mt-2.5 flex items-end gap-2">
      <div className="shrink-0" style={{ width: spec.inAvatar }}>
        <Avatar person={person} size={spec.inAvatar} />
      </div>
      <div
        className="flex items-center gap-[5px]"
        style={{ background: pal.inBubble, borderRadius: spec.radius, padding: "0 16px", height: spec.lineHeight + spec.bubblePadY * 2 }}
      >
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="rcss-typing-dot inline-block rounded-full"
            style={{ width: 8, height: 8, background: pal.dots, animationDelay: `${i * 0.18}s` }}
          />
        ))}
      </div>
    </div>
  );
}

/* ------------------------------ thread ------------------------------ */

export function IgThread({ scenario, playback, lang, rtl, spec }: PlatformProps & { spec: IgSpec }) {
  const dark = scenario.theme === "dark";
  const pal = igPalette(dark);
  const s = IG_STRINGS[lang];
  const { messages, typing } = playback;
  const live = playback.isLive;
  const showTyping = typing || (!live && scenario.presence === "typing");
  const scrollRef = useChatScroll<HTMLDivElement>(`${messages.length}-${showTyping}`);

  /* Screen-anchored gradient: each outgoing bubble shows the slice of the
     gradient that sits behind it on screen, re-sliced on every scroll. */
  const paint = useCallback(() => {
    const root = scrollRef.current;
    if (!root) return;
    const rr = root.getBoundingClientRect();
    const h = root.clientHeight;
    if (!h || !rr.height) return;
    const scale = rr.height / h; // FitDevice may CSS-scale the phone
    root.querySelectorAll<HTMLElement>("[data-ig-out]").forEach((el) => {
      const br = el.getBoundingClientRect();
      const bh = br.height / scale;
      const top = (br.top - rr.top) / scale;
      const off = Math.min(Math.max(top, 0), Math.max(h - bh, 0));
      el.style.backgroundImage = IG_OUT_GRADIENT;
      el.style.backgroundRepeat = "no-repeat";
      el.style.backgroundSize = `100% ${h}px`;
      el.style.backgroundPosition = `0 ${-off}px`;
    });
  }, [scrollRef]);

  useLayoutEffect(() => {
    paint();
  });
  useEffect(() => {
    const root = scrollRef.current;
    if (!root || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => paint());
    ro.observe(root);
    return () => ro.disconnect();
  }, [paint, scrollRef]);

  const last = messages[messages.length - 1];
  const receipt = last && last.sender === "me" ? (playback.statusOf(last) === "read" ? s.seen : s.sent) : null;

  const subtitle =
    scenario.presence === "lastseen" ? scenario.lastSeenText || handleOf(scenario.them) : s.activeNow;
  const active = scenario.presence !== "lastseen";
  const handle = handleOf(scenario.them);

  const sepColor = pal.sub;
  const iconColor = pal.fg;

  return (
    <div className="flex h-full w-full flex-col" style={{ background: pal.bg }}>
      {spec.renderStatusBar({ device: scenario.device, dark, bg: pal.bg, lang })}

      {/* Header */}
      <div
        className="flex shrink-0 items-center"
        style={{ height: spec.headerHeight, paddingInlineStart: spec.headerPadStart, paddingInlineEnd: spec.headerPadEnd, background: pal.bg }}
      >
        {spec.renderBack(iconColor)}
        <div className="relative ms-2 shrink-0">
          <Avatar person={scenario.them} size={spec.headerAvatar} />
          {active && (
            <span
              className="absolute rounded-full"
              style={{ width: 11, height: 11, bottom: -1, insetInlineEnd: -1, background: IG_ACTIVE_GREEN, border: `2px solid ${pal.bg}`, boxSizing: "content-box" }}
            />
          )}
        </div>
        <div className="ms-3 min-w-0 flex-1" style={{ lineHeight: 1.2 }}>
          <div className="truncate" dir="auto" style={{ fontSize: spec.nameSize, fontWeight: spec.nameWeight, color: pal.fg, textAlign: "start" }}>
            {scenario.them.name}
          </div>
          <div className="truncate" style={{ fontSize: spec.subSize, color: pal.sub, marginTop: 1 }}>
            {subtitle}
          </div>
        </div>
        <div className="flex shrink-0 items-center" style={{ color: iconColor, gap: 22 }}>
          <IgPhoneIcon size={spec.iconSize} />
          <IgVideoIcon size={spec.iconSize + 2} />
        </div>
      </div>

      {/* Thread */}
      <div
        ref={scrollRef}
        onScroll={paint}
        onAnimationEnd={paint}
        className="rcss-scroll relative min-h-0 flex-1 overflow-y-auto"
        style={{ background: pal.bg, paddingInline: spec.bodyPadX, paddingTop: 8, paddingBottom: 10 }}
      >
        {/* Profile header that opens every Instagram thread */}
        <div className="mb-7 mt-5 flex flex-col items-center text-center">
          <Avatar person={scenario.them} size={96} />
          <div className="mt-3 max-w-full truncate" dir="auto" style={{ fontSize: 20, fontWeight: 700, color: pal.fg }}>
            {scenario.them.name}
          </div>
          <div className="mt-0.5" style={{ fontSize: 14, color: pal.sub }}>
            {handle ? (
              <>
                <span dir="ltr">{handle}</span> · {s.instagram}
              </>
            ) : (
              s.instagram
            )}
          </div>
          <div
            className="mt-3.5 rounded-lg"
            style={{ background: pal.field, color: pal.fg, fontSize: 14, fontWeight: 600, padding: "7px 16px" }}
          >
            {s.viewProfile}
          </div>
        </div>

        <div className="flex flex-col">
          {messages.map((m, i) => {
            const mine = m.sender === "me";
            const onRight = mine ? !rtl : rtl;
            const sep = needsSeparator(messages, i);
            const g = groupInfo(messages, i);
            const firstOfGroup = g.firstOfGroup || sep;
            const nextSep = i + 1 < messages.length && needsSeparator(messages, i + 1);
            const lastOfGroup = g.lastOfGroup || nextSep;

            const hasImage = m.type === "image";
            const caption = hasImage ? m.text.trim() : "";
            const segs: ("image" | "text" | "voice")[] = hasImage
              ? caption
                ? ["image", "text"]
                : ["image"]
              : m.type === "voice"
                ? ["voice"]
                : ["text"];

            return (
              <div key={m.id} data-mid={m.id}>
                {sep && (
                  <div className="flex justify-center" style={{ margin: i === 0 ? "4px 0 14px" : "18px 0 14px" }}>
                    <span style={{ fontSize: 12, fontWeight: 500, color: sepColor }}>
                      {s.today} <span dir="ltr">{m.time}</span>
                    </span>
                  </div>
                )}
                <div
                  className={`flex items-end gap-2 ${mine ? "justify-end" : "justify-start"} ${live ? "rcss-anim-pop" : ""}`}
                  style={{ marginTop: firstOfGroup ? (sep ? 0 : 10) : 2 }}
                >
                  {!mine && (
                    <div className="shrink-0" style={{ width: spec.inAvatar }}>
                      {lastOfGroup && <Avatar person={scenario.them} size={spec.inAvatar} />}
                    </div>
                  )}
                  <div className={`flex min-w-0 flex-col gap-[2px] ${mine ? "items-end" : "items-start"}`} style={{ maxWidth: spec.bubbleMax }}>
                    {segs.map((seg, k) => {
                      const corners = cornersFor(
                        onRight,
                        k > 0 || !firstOfGroup,
                        k < segs.length - 1 || !lastOfGroup,
                        seg === "image" ? 18 : spec.radius,
                        spec.joinedRadius,
                      );
                      if (seg === "image") {
                        return (
                          <div
                            key={seg}
                            className="overflow-hidden"
                            style={{ ...corners, width: 216, background: pal.imgPlaceholder }}
                          >
                            {m.imageSrc ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={m.imageSrc}
                                alt=""
                                draggable={false}
                                onLoad={paint}
                                className="block w-full object-cover"
                                style={{ maxHeight: 300 }}
                              />
                            ) : (
                              <div className="flex items-center justify-center" style={{ height: 270 }}>
                                <ImageGlyph color={pal.sub} />
                              </div>
                            )}
                          </div>
                        );
                      }
                      const text = seg === "text" ? (hasImage ? caption : m.text) : "";
                      return (
                        <div
                          key={seg}
                          {...(mine ? { "data-ig-out": "" } : {})}
                          style={{
                            ...corners,
                            backgroundColor: mine ? IG_OUT_SOLID : pal.inBubble,
                            color: mine ? "#ffffff" : pal.fg,
                            padding: `${spec.bubblePadY}px ${spec.bubblePadX}px`,
                            minHeight: spec.lineHeight + spec.bubblePadY * 2,
                          }}
                        >
                          {seg === "voice" ? (
                            <VoiceContent mine={mine} pal={pal} duration={m.voiceDuration} />
                          ) : (
                            <div
                              dir={dirOf(text)}
                              className="whitespace-pre-wrap break-words"
                              style={{ fontSize: spec.textSize, lineHeight: `${spec.lineHeight}px`, textAlign: "start" }}
                            >
                              {text}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}

          {receipt && (
            <div className={`flex justify-end ${live ? "rcss-anim-fade" : ""}`} style={{ marginTop: 4 }}>
              <span style={{ fontSize: 12, color: pal.sub, paddingInline: 4 }}>{receipt}</span>
            </div>
          )}

          {showTyping && <TypingRow person={scenario.them} pal={pal} spec={spec} />}
        </div>
      </div>

      {/* Composer */}
      <div className="shrink-0" style={{ background: pal.bg, padding: `6px 10px ${spec.composerBottom}px` }}>
        <div
          className="flex items-center rounded-full"
          style={{ background: pal.field, height: spec.composerHeight, paddingInlineStart: 5, paddingInlineEnd: 14 }}
        >
          <div
            className="flex shrink-0 items-center justify-center rounded-full"
            style={{ width: spec.composerHeight - 10, height: spec.composerHeight - 10, background: IG_ACCENT }}
          >
            <CameraGlyph />
          </div>
          <span className="ms-2.5 min-w-0 flex-1 truncate" style={{ fontSize: spec.composerText, color: pal.sub }}>
            {s.message}
          </span>
          <div className="flex shrink-0 items-center" style={{ gap: 15, color: pal.fg }}>
            <MicIcon size={23} />
            <GalleryIcon size={23} />
            <StickerIcon size={23} />
            <PlusCircleIcon size={23} />
          </div>
        </div>
      </div>

      <SystemBottomBar device={spec.bottomDevice(scenario.device)} bg={pal.bg} fg={dark ? "#ffffff" : "#000000"} />
    </div>
  );
}

/* ------------------------------ iPhone ------------------------------ */

const IOS_SPEC: IgSpec = {
  renderStatusBar: ({ device, dark, bg }) => <StatusBar device={device} tint={dark ? "light" : "dark"} background={bg} />,
  renderBack: (color) => <IosBack color={color} />,
  bottomDevice: (d) => d,
  textSize: 16,
  lineHeight: 21,
  bubblePadX: 13,
  bubblePadY: 9,
  bubbleMax: "70%",
  radius: 22,
  joinedRadius: 4,
  inAvatar: 28,
  bodyPadX: 14,
  headerAvatar: 34,
  headerHeight: 52,
  headerPadStart: 6,
  headerPadEnd: 16,
  nameSize: 16,
  nameWeight: 600,
  subSize: 12.5,
  iconSize: 25,
  composerHeight: 46,
  composerText: 16,
  composerBottom: 4,
};

export function Instagram(props: PlatformProps) {
  return <IgThread {...props} spec={IOS_SPEC} />;
}
