"use client";

/**
 * Rakuten Viber for Android: 1:1 chat screen as it ships in late 2026
 * (Samsung, 360dp wide), default "classic" light theme and the dark theme.
 *
 * Values were measured on real Viber Android captures (pixel scans with the
 * screen scaled to dp; ~1.70 px/dp, cross-checked against the Material 24dp
 * back arrow and the 20sp toolbar title) and on Viber's own store/blog art.
 *
 * Sources
 *  [P1] Google Play listing, current Android set ("Start messaging with ease",
 *       "React with GIFs and stickers", "Get an AI summary fast"; 2025-26):
 *       https://play.google.com/store/apps/details?id=com.viber.voip&hl=en&gl=PH
 *  [P2] Google Play listing, uk-UA current set ("Спілкуйтеся у звичному чаті").
 *  [P3] Google Play listing, ru-RU set: real Samsung captures of a 1:1 chat
 *       ("Богдан / В сети", "Мария"): header, date label, both bubble colours.
 *  [A]  App Store listing (iOS, same palette): outgoing "Hi! 10:20 ✓✓".
 *       https://apps.apple.com/us/app/viber-messenger-video-calls/id382617920
 *  [B]  Viber blog "What's New" (Dec 2025) – typing bubble art (grey pill,
 *       violet dots) and the "⊕ Message…" composer:
 *       https://www.viber.com/en/blog/2025-12-02/whats-new-on-viber/
 *  [C]  Viber blog (2018) – plain white default background, purple ticks = seen:
 *       https://www.viber.com/en/blog/2018-08/ (Lightning Quick Chat Experience)
 *  [D]  Viber brand centre – Main Purple #7360F2: https://www.viber.com/media-kit/
 *  [E]  AndroidHeadlines / XDA (2019) – Android dark theme surfaces (#1E2835
 *       "Dark Blue"; Classic / Dark Blue / Black themes):
 *       https://www.androidheadlines.com/2019/03/viber-dark-mode.html
 *
 * Key values (dp == CSS px on the 360dp Samsung screen)
 *  - Toolbar 56, white, hairline #E2E2E2 under it [P1][P3]. No avatar in the
 *    toolbar. Purple (#7360F2) back arrow centred 27 from the start edge; title
 *    20sp/500 #323232 starting at 58; subtitle 13.5sp #7E7E7E [P1][P3].
 *    Purple call / filled videocam / overflow, centres 110 / 61 / 20 from the
 *    end edge [P3].
 *  - Background plain white [C][P1]. Date label: bare grey text, no chip [P3].
 *  - Incoming bubble #EFEFEF, outgoing #C8E2FE (sampled [P1][P3]), radius 12,
 *    the first incoming bubble of a group has a square top-start corner where
 *    its 34dp avatar sits (avatar top-aligned, centre 26 from the edge, bubble
 *    starts at 49) [P1][P2]. Body 17sp/21.5 black, padding 9 / 13.
 *  - Time 12sp, rgba(0,0,0,.27) – this one value reproduces both measured
 *    tints (#AFAFAF on grey, #92A5B9 on blue) [P1][P3]. It sits inline after a
 *    short single line, otherwise on its own line at the end [P1].
 *  - Ticks after the time: ✓ sent, ✓✓ delivered (grey), ✓✓ purple = seen [A][C].
 *  - Quick-action circles (26dp, white, soft shadow): a heart after incoming
 *    bubbles, forward + heart before outgoing ones, forward also on incoming
 *    media; vertically centred on the bubble [P1][P2][P3].
 *  - Voice note [P1][P2]: purple 40dp play disc, purple playhead + grey bars,
 *    grey "→T" transcribe disc, duration under the start and time at the end.
 *  - Typing [P1][B]: sender avatar + 58×38 grey pill with three 7dp #9688F5 dots.
 *  - Composer [P1][P2]: hairline #DDDDDD, ⊕ (22dp) centred 20 from the start,
 *    52dp #F6F6F6 pill from 42dp with an 18sp #AFAFAF "Message…" placeholder,
 *    outlined smiley + gallery icons (#7E7E7E) centred 72 / 28 from its end,
 *    52dp mic disc with a #7360F2 -> #9161F2 gradient, 15 from the end edge.
 *  - Dark (the "Dark Blue" theme [E]): surfaces #1E2835; bubbles and text are
 *    derived from it (no current dark capture was available – see report).
 *  - Reactions (1:1): the heart quick-action circle carries the reaction: a like
 *    fills it with a solid red heart, other reactions show the emoji instead.
 *  - Replies: quote inside the bubble top: 2dp purple bar, quoted sender (purple,
 *    500), one-line grey snippet; photo = 36dp thumbnail + "Photo"; voice = mic +
 *    "Voice message".
 *  - Compose typing: text (18sp) + purple cursor, field grows to 5 lines, gallery
 *    hides, the mic disc becomes the send disc (white paper plane; mirrors in RTL).
 *  - Entrance: RecyclerView-style add – the row fades in while rising 12dp
 *    over 220ms with a decelerate curve. The live CSS keyframes are sampled
 *    from `viberAndroidMotion.enterStyle`, so preview == export.
 */

import type { CSSProperties, ReactNode } from "react";

import type { DeliveryStatus, FileShare, LinkPreview, Message, Person, Scenario } from "../../types";
import { Avatar, dirOf, SystemBottomBar, useChatScroll } from "../shared";
import { useKeyboardInset } from "../devices/keyboard-context";
import { SamsungStatusBar } from "../devices/SamsungStatusBar";
import type { Lang } from "./chrome";
import { type PlatformMotion, type PlatformProps } from "./types";

/* ======================================================================
   Palette
   ====================================================================== */

interface ViberPalette {
  dark: boolean;
  bg: string;
  bar: string;
  divider: string;
  title: string;
  sub: string;
  accent: string;
  inBubble: string;
  outBubble: string;
  text: string;
  meta: string;
  metaOut: string;
  date: string;
  actionBg: string;
  actionIcon: string;
  actionShadow: string;
  wave: string;
  transcribe: string;
  transcribeFg: string;
  voiceMeta: string;
  dot: string;
  composerDivider: string;
  field: string;
  placeholder: string;
  composerIcon: string;
  imgEmpty: string;
  imgEmptyIcon: string;
  nav: string;
  navFg: string;
  quoteText: string;
  likeRed: string;
  link: string;
}

const LIGHT: ViberPalette = {
  dark: false,
  bg: "#ffffff",
  bar: "#ffffff",
  divider: "#e2e2e2",
  title: "#323232",
  sub: "#7e7e7e",
  accent: "#7360f2",
  inBubble: "#efefef",
  outBubble: "#c8e2fe",
  text: "#000000",
  meta: "rgba(0,0,0,0.27)",
  metaOut: "rgba(0,0,0,0.27)",
  date: "#7e7e7e",
  actionBg: "#ffffff",
  actionIcon: "#afafaf",
  actionShadow: "0 1px 3px rgba(0,0,0,0.14), 0 0 1px rgba(0,0,0,0.08)",
  wave: "#7e7e7e",
  transcribe: "#7e7e7e",
  transcribeFg: "#ffffff",
  voiceMeta: "#7e7e7e",
  dot: "#9688f5",
  composerDivider: "#dddddd",
  field: "#f6f6f6",
  placeholder: "#afafaf",
  composerIcon: "#7e7e7e",
  imgEmpty: "#e6e6e6",
  imgEmptyIcon: "#afafaf",
  nav: "#ffffff",
  navFg: "#3c3c3c",
  quoteText: "rgba(0,0,0,0.55)",
  likeRed: "#f2425a",
  link: "#3f73e8",
};

const DARK: ViberPalette = {
  dark: true,
  bg: "#1e2835",
  bar: "#1e2835",
  divider: "#2c3744",
  title: "#ffffff",
  sub: "#8d97a5",
  accent: "#8f7ff7",
  inBubble: "#2c3846",
  outBubble: "#36507a",
  text: "#ffffff",
  meta: "rgba(255,255,255,0.45)",
  metaOut: "rgba(255,255,255,0.5)",
  date: "#8d97a5",
  actionBg: "#2c3846",
  actionIcon: "#8d97a5",
  actionShadow: "0 1px 3px rgba(0,0,0,0.35)",
  wave: "#8d97a5",
  transcribe: "#4a5666",
  transcribeFg: "#ffffff",
  voiceMeta: "#8d97a5",
  dot: "#9688f5",
  composerDivider: "#2c3744",
  field: "#2c3846",
  placeholder: "#77818f",
  composerIcon: "#8d97a5",
  imgEmpty: "#2c3846",
  imgEmptyIcon: "#5d6878",
  nav: "#1e2835",
  navFg: "#e6e9ee",
  quoteText: "rgba(255,255,255,0.6)",
  likeRed: "#f2425a",
  link: "#7ba7ff",
};

/* ======================================================================
   Metrics (dp)
   ====================================================================== */

const RADIUS = 12;
const AVATAR = 34;
const AVATAR_START = 9;
const IN_START = 49; // incoming bubble start edge
const OUT_END = 22; // outgoing bubble -> screen end edge
const GAP_IN_GROUP = 4;
const GAP_BETWEEN = 12;
const BODY_FS = 17;
const BODY_LH = 21.5;
const META_FS = 12;
const ACTION = 26; // quick-action circle
const ACTION_GAP = 11; // bubble edge -> circle
const ACTION_PAIR_GAP = 6; // forward <-> heart
const NAME_H = 19; // group sender name line (16) + gap to the bubble (3)
const STICKER = 150; // Viber sticker box
const STICKER_EMOJI = [0, 112, 76, 56]; // emoji drawn as a sticker, by count

/* ======================================================================
   Localised strings (Viber's own wording)
   ====================================================================== */

interface VbStrings {
  today: string;
  online: string;
  typing: string;
  isTyping: (name: string) => string;
  placeholder: string;
  you: string;
  photo: string;
  voice: string;
  edited: string;
  deleted: string;
  sticker: string;
  location: string;
  missedCall: string;
  missedVideo: string;
  inCall: string;
  inVideo: string;
  outCall: string;
  outVideo: string;
  noAnswer: string;
}

const STR: Record<Lang, VbStrings> = {
  en: {
    today: "Today",
    online: "Online",
    typing: "typing…",
    isTyping: (n) => `${n} is typing…`,
    placeholder: "Message…",
    you: "You",
    photo: "Photo",
    voice: "Voice message",
    edited: "Edited",
    deleted: "Message deleted",
    sticker: "Sticker",
    location: "Location",
    missedCall: "Missed call",
    missedVideo: "Missed video call",
    inCall: "Incoming call",
    inVideo: "Incoming video call",
    outCall: "Outgoing call",
    outVideo: "Outgoing video call",
    noAnswer: "No answer",
  },
  ar: {
    today: "اليوم",
    online: "متصل",
    typing: "يكتب…",
    isTyping: (n) => `${n} يكتب…`,
    placeholder: "رسالة…",
    you: "أنت",
    photo: "صورة",
    voice: "رسالة صوتية",
    edited: "تم التعديل",
    deleted: "تم حذف الرسالة",
    sticker: "ملصق",
    location: "الموقع",
    missedCall: "مكالمة فائتة",
    missedVideo: "مكالمة فيديو فائتة",
    inCall: "مكالمة واردة",
    inVideo: "مكالمة فيديو واردة",
    outCall: "مكالمة صادرة",
    outVideo: "مكالمة فيديو صادرة",
    noAnswer: "لا يوجد رد",
  },
};

/* ======================================================================
   Group chats + new message kinds (helpers)
   ====================================================================== */

/** Per-member sender-name colours (picked by member index), light / dark. */
const MEMBER_LIGHT = ["#d6457a", "#2b9a62", "#e0782c", "#3b7dd8", "#8e55e6", "#cc463c", "#1e9bb0", "#a8850f"];
const MEMBER_DARK = ["#ff7eaa", "#62d197", "#ffa466", "#7aacff", "#b896ff", "#ff8278", "#62d1e4", "#e6c250"];

function authorIndexOf(m: Message, scenario: Scenario): number {
  const n = scenario.group?.members.length ?? 0;
  const i = m.authorIndex ?? 0;
  return n ? Math.min(Math.max(0, i), n - 1) : 0;
}

/** The person who wrote a message (group member, the 1:1 contact, or me). */
function authorOf(m: Message, scenario: Scenario): Person {
  if (m.sender === "me") return scenario.me;
  const g = scenario.group;
  return g && g.members.length ? g.members[authorIndexOf(m, scenario)] : scenario.them;
}

/** Viber's group subtitle: the participants by name, me last ("Khalid, Sara, Omar, You"). */
function memberList(scenario: Scenario, s: VbStrings, lang: Lang): string {
  const names = (scenario.group?.members ?? []).map((x) => x.name.trim()).filter(Boolean);
  return [...names, s.you].join(lang === "ar" ? "، " : ", ");
}

/** A run continues while the same person keeps writing (in groups: same member). */
function startsRun(messages: Message[], i: number, group: boolean): boolean {
  const m = messages[i];
  const prev = messages[i - 1];
  if (!prev || prev.sender !== m.sender) return true;
  return group && m.sender === "them" && (prev.authorIndex ?? 0) !== (m.authorIndex ?? 0);
}

const URL_RE = /((?:https?:\/\/|www\.)[^\s]+)/;

/** URLs in a message are tinted and underlined, like Viber's auto-linked text. */
function Linkified({ text, color }: { text: string; color: string }) {
  const parts = text.split(URL_RE);
  return (
    <>
      {parts.map((part, i) =>
        i % 2 ? (
          <span key={i} style={{ color, textDecoration: "underline", textUnderlineOffset: 2 }}>
            {part}
          </span>
        ) : (
          part
        ),
      )}
    </>
  );
}

function hostOf(url: string): string {
  try {
    return new URL(url.startsWith("http") ? url : `https://${url}`).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function extOf(name: string): string {
  const m = /\.([a-z0-9]{1,5})$/i.exec(name.trim());
  return m ? m[1].toLowerCase() : "";
}

function fileColor(ext: string): string {
  if (ext === "pdf") return "#e5493a";
  if (["doc", "docx", "rtf", "txt"].includes(ext)) return "#2f6fd8";
  if (["xls", "xlsx", "csv"].includes(ext)) return "#1f9d57";
  if (["ppt", "pptx", "key"].includes(ext)) return "#e2692b";
  if (["zip", "rar", "7z"].includes(ext)) return "#8e8e93";
  return "#7d8796";
}

/** Viber's call-log wording for a call entry. */
function callTitle(m: Message, s: VbStrings): string {
  const video = !!m.call?.video;
  if (m.sender === "me") return video ? s.outVideo : s.outCall;
  if (m.call?.missed) return video ? s.missedVideo : s.missedCall;
  return video ? s.inVideo : s.inCall;
}

/* ======================================================================
   Replies + reactions
   ====================================================================== */

interface QuoteInfo {
  name: string;
  snippet: string;
  image: boolean;
  imageSrc: string | null;
  voice: boolean;
}

/** Resolve what a reply quotes; null when it is not a reply or the target is missing. */
function quoteOf(m: Message, scenario: Scenario, s: VbStrings): QuoteInfo | null {
  if (!m.replyToId) return null;
  const t = scenario.messages.find((x) => x.id === m.replyToId);
  if (!t) return null;
  const name = t.sender === "me" ? s.you : authorOf(t, scenario).name;
  if (t.type === "voice") return { name, snippet: s.voice, image: false, imageSrc: null, voice: true };
  if (t.type === "image") return { name, snippet: t.text.trim() || s.photo, image: true, imageSrc: t.imageSrc ?? null, voice: false };
  const plain = (snippet: string) => ({ name, snippet, image: false, imageSrc: null, voice: false });
  if (t.type === "sticker") return plain(s.sticker);
  if (t.type === "location") return plain(t.location?.title || s.location);
  if (t.type === "file") return plain(t.file?.name || "");
  if (t.type === "deleted") return plain(s.deleted);
  if (t.type === "call") return plain(callTitle(t, s));
  return plain(t.text.replace(/\s+/g, " ").trim());
}

/**
 * Viber's quoted reply at the top of the replying bubble: 2dp purple bar on the
 * start side, the quoted sender (purple, medium) and a one-line grey snippet;
 * photo targets add a 36dp rounded thumbnail, voice targets a mic + label.
 */
function Quote({ q, p, uiDir }: { q: QuoteInfo; p: ViberPalette; uiDir: "rtl" | "ltr" }) {
  const align = uiDir === "rtl" ? "right" : "left";
  return (
    <div dir={uiDir} className="flex min-w-0 items-stretch" style={{ gap: 7, marginBottom: 5 }}>
      <span style={{ width: 2, borderRadius: 1, background: p.accent, flexShrink: 0 }} />
      {q.image && (
        <span className="shrink-0 overflow-hidden" style={{ width: 36, height: 36, borderRadius: 4, alignSelf: "center" }}>
          {q.imageSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={q.imageSrc} alt="" draggable={false} style={{ display: "block", width: 36, height: 36, objectFit: "cover" }} />
          ) : (
            <span style={{ display: "block", width: 36, height: 36, background: p.imgEmpty }} />
          )}
        </span>
      )}
      <div className="min-w-0 flex-1" style={{ paddingBlock: 1 }}>
        <div className="truncate" dir={dirOf(q.name)} style={{ fontSize: 14, lineHeight: "18px", fontWeight: 500, color: p.accent, textAlign: align }}>
          {q.name}
        </div>
        <div className="flex min-w-0 items-center" style={{ gap: 3 }}>
          {q.voice && (
            <svg width="11" height="14" viewBox="0 0 20 22" fill="none" style={{ display: "block", flexShrink: 0 }}>
              <rect x="6.6" y="1.4" width="6.8" height="11.6" rx="3.4" fill={p.quoteText} />
              <path d="M3.4 9.8a6.6 6.6 0 0 0 13.2 0M10 16.4v3.6" stroke={p.quoteText} strokeWidth="2" strokeLinecap="round" />
            </svg>
          )}
          <span
            className="min-w-0 flex-1 truncate"
            dir={dirOf(q.snippet)}
            style={{ fontSize: 14, lineHeight: "18px", color: p.quoteText, textAlign: align }}
          >
            {q.snippet}
          </span>
        </div>
      </div>
    </div>
  );
}

/** Reaction inside the heart disc: Viber's solid red heart for a like, otherwise the emoji. */
function ReactionGlyph({ emoji, red }: { emoji: string; red: string }) {
  const e = emoji.trim();
  if (/^[❤♥]️?$/u.test(e)) {
    return (
      <svg width="16" height="15" viewBox="0 0 24 22" style={{ display: "block" }}>
        <path d="M12 20.6S1.6 14.5 1.6 7.5A5.4 5.4 0 0 1 12 5.1a5.4 5.4 0 0 1 10.4 2.4c0 7-10.4 13.1-10.4 13.1z" fill={red} />
      </svg>
    );
  }
  return <span style={{ fontSize: 15, lineHeight: "18px", display: "block" }}>{e}</span>;
}

/** Viber send: white paper plane on the purple disc (mirrors in Arabic). */
function SendPlane({ rtl }: { rtl: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" style={{ display: "block", marginInlineStart: 3, transform: rtl ? "scaleX(-1)" : undefined }}>
      <path
        d="M3.4 3.2c-.6-.3-1.3.3-1.1.9l2.6 7.1c.1.3.4.5.7.5l8.1.3-8.1.3c-.3 0-.6.2-.7.5l-2.6 7.1c-.2.6.5 1.2 1.1.9l18-8.1c.6-.3.6-1.2 0-1.5z"
        fill="#ffffff"
      />
    </svg>
  );
}

/* ======================================================================
   Entrance motion (shared by the live CSS and the video exporter)
   ====================================================================== */

const ENTER_MS = 220;
const ENTER_RISE = 12;

function enterStyleAt(p: number) {
  const t = Math.min(1, Math.max(0, p));
  // Android decelerate interpolator (factor 1.5): 1 - (1 - t)^3
  const e = 1 - Math.pow(1 - t, 3);
  const a = Math.min(1, t / 0.6);
  const opacity = 1 - Math.pow(1 - a, 2);
  return {
    opacity: Math.round(opacity * 1000) / 1000,
    transform: `translateY(${Math.round((1 - e) * ENTER_RISE * 100) / 100}px)`,
    transformOrigin: "center bottom",
  };
}

export const viberAndroidMotion: PlatformMotion = {
  enterMs: ENTER_MS,
  enterStyle: (p) => enterStyleAt(p),
};

/** Keyframes sampled from the exact same function, played with linear timing. */
const ENTER_KEYFRAMES = (() => {
  const steps: string[] = [];
  for (let i = 0; i <= 20; i++) {
    const s = enterStyleAt(i / 20);
    steps.push(`${i * 5}%{opacity:${s.opacity};transform:${s.transform}}`);
  }
  return `@keyframes viber-android-enter{${steps.join("")}}`;
})();

const TYPING_PERIOD = 1200;
const TYPING_STAGGER = 200;
const CARET_PERIOD = 1000;

/** Typing dot state at time t (ms): each dot brightens and grows in turn. */
function typingDot(t: number, i: number): { opacity: number; transform: string } {
  const phase = (((t - i * TYPING_STAGGER) % TYPING_PERIOD) + TYPING_PERIOD) % TYPING_PERIOD;
  const x = phase / TYPING_PERIOD;
  const k = x < 0.25 ? x / 0.25 : x < 0.5 ? 1 - (x - 0.25) / 0.25 : 0;
  const s = 0.5 - 0.5 * Math.cos(k * Math.PI);
  return { opacity: 0.45 + 0.55 * s, transform: `scale(${(0.85 + 0.15 * s).toFixed(3)})` };
}

const STYLE = `
${ENTER_KEYFRAMES}
.viber-android-enter{animation:viber-android-enter ${ENTER_MS}ms linear both}
@keyframes viber-android-typing{0%{opacity:.45;transform:scale(.85)}12.5%{opacity:.72;transform:scale(.925)}25%{opacity:1;transform:scale(1)}37.5%{opacity:.72;transform:scale(.925)}50%,100%{opacity:.45;transform:scale(.85)}}
.viber-android-typing-dot{animation:viber-android-typing ${TYPING_PERIOD}ms ease-in-out infinite}
@keyframes viber-android-caret{0%,49.9%{opacity:1}50%,100%{opacity:0}}
.viber-android-caret{animation:viber-android-caret ${CARET_PERIOD}ms step-end infinite}
`;

/** Android EditText cursor: hard on/off blink, 500 ms each (same as the CSS above). */
function caretOn(t: number): boolean {
  return ((t % CARET_PERIOD) + CARET_PERIOD) % CARET_PERIOD < CARET_PERIOD / 2;
}

/* ======================================================================
   Helpers
   ====================================================================== */

/** Deterministic voice-note waveform (bar heights in px) seeded by the message id. */
function waveform(seed: string, count: number, min: number, max: number): number[] {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  const out: number[] = [];
  for (let i = 0; i < count; i++) {
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    h ^= h >>> 16;
    const r = ((h >>> 0) % 1000) / 1000;
    const envelope = 0.45 + 0.55 * Math.sin(((i + 0.5) / count) * Math.PI);
    out.push(Math.max(min, Math.round(min + (max - min) * r * envelope)));
  }
  return out;
}

/** 1–3 emoji and nothing else -> rendered large without a bubble. Returns the count, or 0. */
function bigEmojiCount(text: string): number {
  const t = text.trim();
  if (!t || t.length > 40) return 0;
  const Seg = (
    Intl as unknown as {
      Segmenter?: new (l?: string, o?: { granularity: string }) => { segment: (s: string) => Iterable<{ segment: string }> };
    }
  ).Segmenter;
  const parts = Seg ? Array.from(new Seg(undefined, { granularity: "grapheme" }).segment(t), (s) => s.segment) : Array.from(t);
  const glyphs = parts.filter((g) => g.trim() !== "");
  if (glyphs.length < 1 || glyphs.length > 3) return 0;
  return glyphs.every((g) => /\p{Extended_Pictographic}/u.test(g) || /\p{Regional_Indicator}/u.test(g)) ? glyphs.length : 0;
}

/* ======================================================================
   Icons (24dp grid)
   ====================================================================== */

function Svg({ children, size = 24, style }: { children: ReactNode; size?: number; style?: CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ display: "block", flexShrink: 0, ...style }}>
      {children}
    </svg>
  );
}

/** Viber's long, thin back arrow (≈20dp wide). Mirrors in RTL. */
function BackArrow({ color, rtl }: { color: string; rtl: boolean }) {
  return (
    <Svg style={{ transform: rtl ? "scaleX(-1)" : undefined }}>
      <path d="M21.6 12H3.2M9.6 5.4 3 12l6.6 6.6" stroke={color} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

/** Filled handset (glyph ≈18dp). Never mirrored. */
function Phone({ color }: { color: string }) {
  return (
    <Svg>
      <path
        d="M6.9 3.4c.5-.3 1.2-.2 1.6.3l2.1 2.9c.4.5.3 1.2-.1 1.6l-1.3 1.2c-.3.3-.4.7-.2 1.1.9 1.7 2.2 3 3.9 3.9.4.2.8.1 1.1-.2l1.2-1.3c.4-.4 1.1-.5 1.6-.1l2.9 2.1c.5.4.6 1.1.3 1.6l-.9 1.5c-.6 1-1.8 1.5-2.9 1.2C10.9 18 6 13.1 4.7 7.8c-.3-1.1.2-2.3 1.2-2.9z"
        fill={color}
      />
    </Svg>
  );
}

/** Viber's filled camcorder: rounded body + lens wedge (glyph ≈26×20dp). */
function Videocam({ color }: { color: string }) {
  return (
    <svg width="28" height="24" viewBox="0 0 28 24" fill="none" style={{ display: "block", flexShrink: 0 }}>
      <rect x="1.5" y="3" width="18.5" height="18" rx="5" fill={color} />
      <path d="M21.4 10.2 25.6 7.4c.5-.3 1 .1 1 .6v8c0 .5-.5.9-1 .6l-4.2-2.8z" fill={color} />
    </svg>
  );
}

function Kebab({ color }: { color: string }) {
  return (
    <Svg>
      <circle cx="12" cy="4.5" r="2.05" fill={color} />
      <circle cx="12" cy="12" r="2.05" fill={color} />
      <circle cx="12" cy="19.5" r="2.05" fill={color} />
    </Svg>
  );
}

function Heart({ color, size = 15 }: { color: string; size?: number }) {
  return (
    <Svg size={size}>
      <path
        d="M12 20.3S3.5 15.2 3.5 9.1A4.6 4.6 0 0 1 12 6.6a4.6 4.6 0 0 1 8.5 2.5c0 6.1-8.5 11.2-8.5 11.2z"
        stroke={color}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** Curved "forward" arrow. Mirrors in RTL. */
function Forward({ color, rtl, size = 15 }: { color: string; rtl: boolean; size?: number }) {
  return (
    <Svg size={size} style={{ transform: rtl ? "scaleX(-1)" : undefined }}>
      <path
        d="M13.6 5.2 20.4 11l-6.8 5.8v-3.4c-5 0-8.2 1.4-10 4.8.6-5.1 3.6-8.5 10-9.2z"
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function PlusCircle({ color }: { color: string }) {
  return (
    <Svg size={24}>
      <circle cx="12" cy="12" r="10.4" stroke={color} strokeWidth="1.3" />
      <path d="M12 7v10M7 12h10" stroke={color} strokeWidth="1.3" strokeLinecap="round" />
    </Svg>
  );
}

function Smiley({ color }: { color: string }) {
  return (
    <Svg size={25}>
      <circle cx="12" cy="12" r="9.6" stroke={color} strokeWidth="1.3" />
      <path d="M8.6 10.2c.4-.7 1.4-.7 1.8 0M13.6 10.2c.4-.7 1.4-.7 1.8 0" stroke={color} strokeWidth="1.3" strokeLinecap="round" />
      <path d="M7.9 13.6c1.9 2.9 6.3 2.9 8.2 0" stroke={color} strokeWidth="1.3" strokeLinecap="round" />
    </Svg>
  );
}

/** Gallery: rounded frame with a soft hill line (Viber composer). */
function Gallery({ color }: { color: string }) {
  return (
    <Svg size={25}>
      <rect x="2.6" y="4" width="18.8" height="16" rx="4.6" stroke={color} strokeWidth="1.3" />
      <path d="M2.8 15.2c2.6-3 5.1-3.3 7.6-.6 1.7 1.9 3.6 1.8 5.3.1 1.7-1.7 3.6-1.7 5.6.2" stroke={color} strokeWidth="1.3" strokeLinecap="round" />
      <circle cx="15.6" cy="9.1" r="1.6" stroke={color} strokeWidth="1.3" />
    </Svg>
  );
}

function Mic({ color }: { color: string }) {
  return (
    <Svg size={26}>
      <rect x="8.6" y="2.8" width="6.8" height="12" rx="3.4" stroke={color} strokeWidth="1.5" />
      <path d="M5.4 11.2a6.6 6.6 0 0 0 13.2 0M12 17.8v3.4M9 21.2h6" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
  );
}

function ImageIcon({ color }: { color: string }) {
  return (
    <Svg size={44}>
      <rect x="3" y="4.5" width="18" height="15" rx="3.5" stroke={color} strokeWidth="1.4" />
      <path d="M3.4 16.2 8.5 11l4.2 4.2 2.6-2.6 5.3 5.3" stroke={color} strokeWidth="1.4" strokeLinejoin="round" />
      <circle cx="15.8" cy="8.8" r="1.6" fill={color} />
    </Svg>
  );
}

/** Viber delivery ticks: one thin check (sent), two overlapping (delivered), purple two (seen). */
function Ticks({ status, color, seen }: { status: DeliveryStatus; color: string; seen: string }) {
  const c = status === "read" ? seen : color;
  return (
    <svg width="17" height="10" viewBox="0 0 17 10" fill="none" style={{ display: "block", flexShrink: 0 }}>
      {status === "sent" ? (
        <path d="M2.5 5.2 5.6 8.3 12 1.8" stroke={c} strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <>
          <path d="M1 5.2 4.1 8.3 10.5 1.8" stroke={c} strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M7.4 7.6 8.1 8.3 14.5 1.8" stroke={c} strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round" />
        </>
      )}
    </svg>
  );
}

/** White quick-action disc (heart / forward) beside a message. */
function ActionDisc({ p, children }: { p: ViberPalette; children: ReactNode }) {
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full"
      style={{ width: ACTION, height: ACTION, background: p.actionBg, boxShadow: p.actionShadow }}
    >
      {children}
    </span>
  );
}

/* ======================================================================
   Screen
   ====================================================================== */

export function ViberAndroid({ scenario, playback, lang, rtl }: PlatformProps) {
  const dark = scenario.theme === "dark";
  const p = dark ? DARK : LIGHT;
  const s = STR[lang];
  const { messages, typing } = playback;
  const live = playback.isLive;
  const clock = playback.clockMs;
  const draft = playback.draft;
  const kb = useKeyboardInset();
  const group = scenario.group && scenario.group.members.length ? scenario.group : null;
  // keep the newest bubble in view while a growing draft / the keyboard shrinks the thread
  const scrollRef = useChatScroll<HTMLDivElement>(
    `${messages.length}-${typing}-${draft ? Math.floor(draft.text.length / 16) : -1}-${Math.round(kb.inset / 24)}`,
  );

  // in a group, the member who is typing is the author of the next incoming message
  const shown = new Set(messages.map((x) => x.id));
  const nextIn = scenario.messages.find((x) => !shown.has(x.id) && x.sender === "them");
  const typist: Person = nextIn ? authorOf(nextIn, scenario) : group ? group.members[0] : scenario.them;
  const typistIndex = nextIn && group ? authorIndexOf(nextIn, scenario) : 0;

  const subtitle = group
    ? typing
      ? s.isTyping(typist.name)
      : memberList(scenario, s, lang)
    : scenario.presence === "typing"
      ? s.typing
      : scenario.presence === "online"
        ? s.online
        : scenario.lastSeenText;
  const last = messages.length ? messages[messages.length - 1] : null;
  const typingStartsGroup = !(
    last &&
    last.sender === "them" &&
    (!group || authorIndexOf(last, scenario) === typistIndex)
  );
  const palette = dark ? MEMBER_DARK : MEMBER_LIGHT;

  return (
    <div
      className="flex h-full w-full flex-col"
      style={{ background: p.bg, color: p.text, paddingBottom: kb.inset, transition: `padding-bottom ${kb.transition}` }}
    >
      <style>{STYLE}</style>
      <SamsungStatusBar tint={dark ? "light" : "dark"} background={p.bar} lang={lang} />

      {/* Toolbar */}
      <div
        className="relative z-10 flex shrink-0 items-center"
        style={{ height: 56, background: p.bar, borderBottom: `1px solid ${p.divider}`, boxSizing: "content-box" }}
      >
        <div className="flex shrink-0 items-center justify-center" style={{ width: 48, height: 48, marginInlineStart: 3 }}>
          <BackArrow color={p.accent} rtl={rtl} />
        </div>
        <div className="flex min-w-0 flex-1 flex-col justify-center" style={{ marginInlineStart: 7, paddingInlineEnd: 6 }}>
          <div className="truncate" style={{ fontSize: 20, lineHeight: "25px", fontWeight: 500, color: p.title }}>
            {group ? group.name : scenario.them.name}
          </div>
          <div className="truncate" style={{ fontSize: 13.5, lineHeight: "18px", color: p.sub, marginTop: 0 }}>
            {subtitle}
          </div>
        </div>
        {/* call / video glyphs keep their orientation in RTL; only their order mirrors */}
        <div className="flex shrink-0 items-center">
          <div className="flex items-center justify-center" style={{ width: 56, height: 48 }}>
            <Phone color={p.accent} />
          </div>
          <div className="flex items-center justify-center" style={{ width: 42, height: 48 }}>
            <Videocam color={p.accent} />
          </div>
          <div className="flex items-center justify-center" style={{ width: 40, height: 48 }}>
            <Kebab color={p.accent} />
          </div>
        </div>
      </div>

      {/* Conversation */}
      <div ref={scrollRef} className="rcss-scroll min-h-0 flex-1 overflow-y-auto" style={{ background: p.bg, padding: "0 0 12px" }}>
        <div className="flex flex-col">
          {/* Date label: bare grey text, no chip */}
          <div
            className="text-center"
            style={{ fontSize: 14, lineHeight: "18px", color: p.date, padding: "17px 0 0", marginBottom: 14 - GAP_BETWEEN }}
          >
            {s.today}
          </div>

          {messages.map((m, i) => (
            <ViberRow
              key={m.id}
              m={m}
              p={p}
              s={s}
              rtl={rtl}
              firstOfGroup={startsRun(messages, i, !!group)}
              status={playback.statusOf(m)}
              author={authorOf(m, scenario)}
              authorColor={palette[authorIndexOf(m, scenario) % palette.length]}
              group={!!group}
              live={live}
              quote={quoteOf(m, scenario, s)}
            />
          ))}

          {typing && (
            <div
              className={`flex items-start ${live && clock === undefined ? "viber-android-enter" : ""}`}
              style={{ paddingInlineStart: AVATAR_START, marginTop: typingStartsGroup ? GAP_BETWEEN : GAP_IN_GROUP }}
            >
              <div style={{ width: AVATAR, height: AVATAR, flexShrink: 0 }}>
                {typingStartsGroup && <Avatar person={typist} size={AVATAR} />}
              </div>
              <div
                className="flex items-center justify-center"
                style={{
                  marginInlineStart: IN_START - AVATAR_START - AVATAR,
                  width: 58,
                  height: 38,
                  borderRadius: 19,
                  background: p.inBubble,
                  gap: 4,
                }}
              >
                {[0, 1, 2].map((d) => {
                  const st = clock !== undefined ? typingDot(clock, d) : undefined;
                  return (
                    <span
                      key={d}
                      className={clock === undefined ? "viber-android-typing-dot block rounded-full" : "block rounded-full"}
                      style={{
                        width: 7,
                        height: 7,
                        background: p.dot,
                        animationDelay: clock === undefined ? `${d * TYPING_STAGGER}ms` : undefined,
                        ...(st ?? {}),
                      }}
                    />
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Composer. While typing: text + purple cursor replace "Message…", the
          field grows to 5 lines (bottom-anchored, ⊕ / send stay on the last
          line), the gallery shortcut hides (smiley stays), mic -> send. */}
      <div className="flex shrink-0 items-end" style={{ background: p.bg, borderTop: `1px solid ${p.composerDivider}`, padding: "8px 0" }}>
        <div className="flex shrink-0 items-center justify-center" style={{ width: 40, height: 52, marginInlineStart: 0 }}>
          <PlusCircle color={p.composerIcon} />
        </div>
        <div
          className="flex min-w-0 flex-1 items-end"
          style={{ minHeight: 52, borderRadius: 26, background: p.field, marginInlineStart: 2 }}
        >
          {draft ? (
            <div
              className="flex min-w-0 flex-1 flex-col justify-end overflow-hidden"
              style={{ paddingBlock: 14, paddingInlineStart: 15, maxHeight: 14 * 2 + 24 * 5 }}
            >
              <div
                dir={dirOf(draft.text)}
                className="whitespace-pre-wrap break-words"
                style={{ fontSize: 18, lineHeight: "24px", color: p.text, textAlign: "start" }}
              >
                {draft.text}
                <span
                  className={clock === undefined ? "viber-android-caret" : undefined}
                  style={{
                    display: "inline-block",
                    width: 2,
                    height: 22,
                    background: p.accent,
                    verticalAlign: -5,
                    marginInlineStart: 1,
                    marginInlineEnd: -3,
                    opacity: clock === undefined ? undefined : caretOn(clock) ? 1 : 0,
                  }}
                />
              </div>
            </div>
          ) : (
            <span className="min-w-0 flex-1 truncate" style={{ fontSize: 18, lineHeight: "52px", color: p.placeholder, paddingInlineStart: 15 }}>
              {s.placeholder}
            </span>
          )}
          {/* smiley centred 72dp and gallery 28dp from the field's end */}
          <div className="flex shrink-0 items-center" style={{ height: 52, gap: 19, marginInlineEnd: 15.5, marginInlineStart: draft ? 8 : 0 }}>
            <Smiley color={p.composerIcon} />
            {!draft && <Gallery color={p.composerIcon} />}
          </div>
        </div>
        <div
          className="flex shrink-0 items-center justify-center rounded-full"
          style={{
            width: 52,
            height: 52,
            marginInlineStart: 9,
            marginInlineEnd: 15,
            background: "linear-gradient(45deg, #7360f2 0%, #9161f2 100%)",
            boxShadow: dark ? "none" : "0 2px 6px rgba(115,96,242,0.32)",
          }}
        >
          {draft ? <SendPlane rtl={rtl} /> : <Mic color="#ffffff" />}
        </div>
      </div>

      <SystemBottomBar device="android" bg={p.nav} fg={p.navFg} />
    </div>
  );
}

/* ======================================================================
   Message row
   ====================================================================== */

function ViberRow({
  m,
  p,
  s,
  rtl,
  firstOfGroup,
  status,
  author,
  authorColor,
  group,
  live,
  quote,
}: {
  m: Message;
  p: ViberPalette;
  s: VbStrings;
  rtl: boolean;
  firstOfGroup: boolean;
  status: DeliveryStatus;
  author: Person;
  authorColor: string;
  group: boolean;
  live: boolean;
  quote: QuoteInfo | null;
}) {
  const mine = m.sender === "me";
  const uiDir = rtl ? "rtl" : "ltr";
  const bg = mine ? p.outBubble : p.inBubble;
  const metaColor = mine ? p.metaOut : p.meta;
  const caption = m.type === "image" ? m.text.trim() : "";
  const textDir = dirOf(m.text);
  const link = m.type === "text" ? (m.link ?? null) : null;
  const sticker = m.type === "sticker";
  // a reply always lives in a bubble, so a replying emoji-only message is not jumbo
  const emojiCount = m.type === "text" && !quote && !link ? bigEmojiCount(m.text) : 0;
  const quoteEl = quote ? <Quote q={quote} p={p} uiDir={uiDir} /> : null;
  const reaction = m.reaction?.trim() || null;
  const media = m.type === "image" || emojiCount > 0 || sticker || m.type === "location" || m.type === "file";
  // call-log entries and deleted placeholders carry no quick actions
  const actions = m.type !== "call" && m.type !== "deleted";
  const showName = group && !mine && firstOfGroup;

  // Square top-start corner only on the first incoming bubble of a group (beside the avatar).
  const radius: CSSProperties = { borderRadius: RADIUS };
  if (!mine && firstOfGroup) {
    if (rtl) radius.borderTopRightRadius = 0;
    else radius.borderTopLeftRadius = 0;
  }

  const meta = (color: string, seen: string, extra?: CSSProperties, ticks = true) => (
    <span
      className="inline-flex shrink-0 items-center whitespace-nowrap"
      dir={uiDir}
      style={{ fontSize: META_FS, lineHeight: "16px", gap: 3, color, ...extra }}
    >
      {/* "Edited" sits in front of the time */}
      {m.edited && <span style={{ marginInlineEnd: 1 }}>{s.edited}</span>}
      <span dir="ltr">{m.time}</span>
      {mine && ticks && <Ticks status={status} color={color} seen={seen} />}
    </span>
  );

  let content: ReactNode;

  if (emojiCount > 0 || sticker) {
    const n = sticker ? bigEmojiCount(m.text) || 1 : emojiCount;
    const size = sticker ? STICKER_EMOJI[n] : emojiCount === 1 ? 52 : emojiCount === 2 ? 44 : 38;
    content = (
      <div className="flex flex-col" style={{ alignItems: "flex-end" }} dir={uiDir}>
        {sticker && m.imageSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={m.imageSrc} alt="" draggable={false} style={{ display: "block", width: STICKER, height: STICKER, objectFit: "contain" }} />
        ) : sticker ? (
          <span className="flex items-center justify-center" style={{ width: STICKER, height: STICKER, fontSize: size, lineHeight: 1, whiteSpace: "nowrap" }}>
            {m.text.trim() || "🙂"}
          </span>
        ) : (
          <span style={{ fontSize: size, lineHeight: 1.15, whiteSpace: "nowrap" }}>{m.text.trim()}</span>
        )}
        {meta(p.dark ? p.meta : "#afafaf", p.accent, { marginTop: 2 })}
      </div>
    );
  } else if (m.type === "voice") {
    content = <ViberVoice m={m} p={p} bg={bg} radius={radius} mine={mine} status={status} rtl={rtl} quote={quoteEl} />;
  } else if (m.type === "image") {
    const W = 236;
    content = (
      <div
        className="relative overflow-hidden"
        dir={caption ? textDir : uiDir}
        style={{ width: W, maxWidth: "100%", background: caption || quote ? bg : "transparent", ...radius }}
      >
        {/* replying photo: the quote sits above the picture inside the bubble */}
        {quoteEl && <div style={{ padding: "9px 13px 3px" }}>{quoteEl}</div>}
        <div
          className="relative overflow-hidden"
          style={quote ? { marginInline: 4, borderRadius: 8, marginBottom: caption ? 0 : 4 } : caption ? undefined : radius}
        >
          {m.imageSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={m.imageSrc} alt="" draggable={false} style={{ display: "block", width: "100%", height: "auto", maxHeight: 320, objectFit: "cover" }} />
          ) : (
            <div className="flex items-center justify-center" style={{ width: "100%", height: 190, background: p.imgEmpty }}>
              <ImageIcon color={p.imgEmptyIcon} />
            </div>
          )}
          {!caption && (
            <span
              className="absolute"
              style={{ bottom: 7, insetInlineEnd: 7, background: "rgba(0,0,0,0.4)", borderRadius: 10, padding: "1px 7px" }}
            >
              {meta("#ffffff", "#c9c1ff")}
            </span>
          )}
        </div>
        {caption && (
          <div className="flex flex-wrap items-baseline justify-end" style={{ padding: "8px 13px 9px", columnGap: 8, color: p.text }}>
            <span className="min-w-0 whitespace-pre-wrap break-words" style={{ fontSize: BODY_FS, lineHeight: `${BODY_LH}px`, flex: "1 1 auto" }}>
              {caption}
            </span>
            {meta(metaColor, p.accent)}
          </div>
        )}
      </div>
    );
  } else if (m.type === "location") {
    const loc = m.location;
    content = (
      <div className="relative overflow-hidden" dir={uiDir} style={{ width: 236, maxWidth: "100%", background: bg, color: p.text, ...radius }}>
        {quoteEl && <div style={{ padding: "9px 13px 3px" }}>{quoteEl}</div>}
        <div className="overflow-hidden" style={quote ? { marginInline: 4, borderRadius: 8 } : undefined}>
          <MapArt dark={p.dark} h={136} />
        </div>
        <div style={{ padding: "7px 13px 8px" }}>
          {loc?.title && (
            <div className="truncate" dir={dirOf(loc.title)} style={{ fontSize: 16, lineHeight: "21px", fontWeight: 500, textAlign: "start" }}>
              {loc.title}
            </div>
          )}
          {loc?.subtitle && (
            <div className="truncate" dir={dirOf(loc.subtitle)} style={{ fontSize: 14, lineHeight: "19px", color: p.quoteText, textAlign: "start" }}>
              {loc.subtitle}
            </div>
          )}
          <div className="flex justify-end" style={{ marginTop: 2 }}>
            {meta(metaColor, p.accent)}
          </div>
        </div>
      </div>
    );
  } else if (m.type === "file") {
    content = (
      <div dir={uiDir} style={{ width: 252, maxWidth: "100%", background: bg, color: p.text, padding: "10px 13px 8px 10px", ...radius }}>
        {quoteEl}
        <FileRow file={m.file ?? { name: "file" }} p={p} />
        <div className="flex justify-end" style={{ marginTop: 2 }}>
          {meta(metaColor, p.accent)}
        </div>
      </div>
    );
  } else if (m.type === "call") {
    content = <CallBubble m={m} p={p} s={s} bg={bg} radius={radius} uiDir={uiDir} meta={meta(metaColor, p.accent)} />;
  } else if (m.type === "deleted") {
    content = (
      <div
        className="flex min-w-0 flex-wrap items-baseline justify-end"
        dir={uiDir}
        style={{ background: bg, padding: "9px 13px", columnGap: 8, ...radius }}
      >
        <span
          className="inline-flex items-center"
          style={{ fontSize: 16, lineHeight: `${BODY_LH}px`, fontStyle: dirOf(s.deleted) === "rtl" ? "normal" : "italic", color: p.quoteText, gap: 5, flex: "1 1 auto" }}
        >
          <BanGlyph color={p.quoteText} />
          {s.deleted}
        </span>
        {meta(metaColor, p.accent, { marginInlineStart: "auto" }, false)}
      </div>
    );
  } else if (link) {
    content = (
      <div className="min-w-0" style={{ width: 262, maxWidth: "100%", background: bg, color: p.text, padding: "9px 13px 8px", ...radius }}>
        {quoteEl}
        <div dir={textDir} className="whitespace-pre-wrap break-words" style={{ fontSize: BODY_FS, lineHeight: `${BODY_LH}px`, textAlign: "start" }}>
          <Linkified text={m.text} color={p.link} />
        </div>
        <LinkCard link={link} p={p} uiDir={uiDir} />
        <div className="flex justify-end" dir={uiDir} style={{ marginTop: 4 }}>
          {meta(metaColor, p.accent)}
        </div>
      </div>
    );
  } else {
    // Time sits inline after a short single line; otherwise it wraps to its own line at the end.
    const textRow = (
      <div
        className="flex flex-wrap items-baseline justify-end"
        dir={textDir}
        style={quote ? { columnGap: 8 } : { background: bg, color: p.text, padding: "9px 13px 9px", columnGap: 8, ...radius }}
      >
        <span className="min-w-0 whitespace-pre-wrap break-words" style={{ fontSize: BODY_FS, lineHeight: `${BODY_LH}px`, flex: "0 1 auto", marginInlineEnd: "auto" }}>
          <Linkified text={m.text} color={p.link} />
        </span>
        {meta(metaColor, p.accent, { marginInlineStart: "auto" })}
      </div>
    );
    content = quote ? (
      <div className="min-w-0" style={{ background: bg, color: p.text, padding: "9px 13px 9px", ...radius }}>
        {quoteEl}
        {textRow}
      </div>
    ) : (
      textRow
    );
  }

  const heart = (
    <ActionDisc p={p}>
      {/* the like disc: outline heart, or the reaction left on this message */}
      {reaction ? <ReactionGlyph emoji={reaction} red={p.likeRed} /> : <Heart color={p.actionIcon} />}
    </ActionDisc>
  );
  const forward = (
    <ActionDisc p={p}>
      <Forward color={p.actionIcon} rtl={rtl} />
    </ActionDisc>
  );

  if (mine) {
    return (
      <div
        data-mid={m.id}
        data-sender={m.sender}
        className={`flex items-center justify-end ${live ? "viber-android-enter" : ""}`}
        style={{ paddingInlineStart: 16, paddingInlineEnd: OUT_END, marginTop: firstOfGroup ? GAP_BETWEEN : GAP_IN_GROUP }}
      >
        {actions && (
          <div className="flex shrink-0 items-center" style={{ gap: ACTION_PAIR_GAP, marginInlineEnd: ACTION_GAP }}>
            {forward}
            {heart}
          </div>
        )}
        <div className="flex min-w-0" style={{ flex: m.type === "voice" ? "1 1 auto" : "0 1 auto", justifyContent: "flex-end" }}>
          {content}
        </div>
      </div>
    );
  }

  return (
    <div
      data-mid={m.id}
      data-sender={m.sender}
      className={`flex items-start ${live ? "viber-android-enter" : ""}`}
      style={{ paddingInlineStart: AVATAR_START, paddingInlineEnd: 16, marginTop: firstOfGroup ? GAP_BETWEEN : GAP_IN_GROUP }}
    >
      <div style={{ width: AVATAR, flexShrink: 0, paddingTop: showName ? NAME_H : 0 }}>
        {firstOfGroup && <Avatar person={author} size={AVATAR} />}
      </div>
      <div
        className="flex min-w-0 flex-col"
        style={{ marginInlineStart: IN_START - AVATAR_START - AVATAR, flex: m.type === "voice" ? "1 1 auto" : "0 1 auto", alignItems: "flex-start" }}
      >
        {/* groups: the member's name in their colour above the first bubble of a run */}
        {showName && (
          <div
            className="max-w-full truncate"
            dir={dirOf(author.name)}
            style={{ fontSize: 13, lineHeight: "16px", height: 16, marginBottom: NAME_H - 16, fontWeight: 500, color: authorColor, paddingInlineStart: 2 }}
          >
            {author.name}
          </div>
        )}
        <div className="flex min-w-0 max-w-full items-center" style={{ width: m.type === "voice" ? "100%" : undefined }}>
          <div className="flex min-w-0" style={{ flex: m.type === "voice" ? "1 1 auto" : "0 1 auto" }}>
            {content}
          </div>
          {actions && (
            <div className="flex shrink-0 items-center" style={{ gap: ACTION_PAIR_GAP, marginInlineStart: ACTION_GAP }}>
              {heart}
              {media && forward}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** Viber's call-log bubble: round call glyph | "Missed call" + duration / time | purple call-back button. */
function CallBubble({
  m,
  p,
  s,
  bg,
  radius,
  meta,
  uiDir,
}: {
  m: Message;
  p: ViberPalette;
  s: VbStrings;
  bg: string;
  radius: CSSProperties;
  meta: ReactNode;
  uiDir: "rtl" | "ltr";
}) {
  const video = !!m.call?.video;
  const missed = !!m.call?.missed;
  const red = missed && m.sender === "them";
  const tone = red ? p.likeRed : p.accent;
  const sub = m.call?.duration ? m.call.duration : missed && m.sender === "me" ? s.noAnswer : "";
  return (
    <div className="flex min-w-0 items-center" dir={uiDir} style={{ background: bg, color: p.text, padding: "10px 10px 10px 11px", minWidth: 224, maxWidth: "100%", gap: 11, ...radius }}>
      <span
        className="flex shrink-0 items-center justify-center rounded-full"
        style={{ width: 38, height: 38, background: red ? "rgba(242,66,90,0.14)" : p.dark ? "rgba(143,127,247,0.2)" : "rgba(115,96,242,0.12)" }}
      >
        <CallGlyph video={video} color={tone} size={19} arrow={red || m.sender !== "me" ? "in" : "out"} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate" style={{ fontSize: 16, lineHeight: "21px", fontWeight: 500, color: red ? p.likeRed : p.text, textAlign: "start" }}>
          {callTitle(m, s)}
        </div>
        <div className="flex items-center" style={{ gap: 6, marginTop: 1 }}>
          {sub && <span style={{ fontSize: 13, lineHeight: "16px", color: p.quoteText }}>{sub}</span>}
          {meta}
        </div>
      </div>
      {/* call back */}
      <span
        className="flex shrink-0 items-center justify-center rounded-full"
        style={{ width: 36, height: 36, background: "linear-gradient(45deg, #7360f2 0%, #9161f2 100%)" }}
      >
        <CallGlyph video={video} color="#ffffff" size={18} />
      </span>
    </div>
  );
}

/** Handset or camcorder; `arrow` adds the call-log direction arrow. Never mirrored. */
function CallGlyph({ video, color, size, arrow }: { video: boolean; color: string; size: number; arrow?: "in" | "out" }) {
  if (video) {
    return (
      <svg width={size + 3} height={size} viewBox="0 0 28 20" style={{ display: "block" }}>
        <rect x="0.5" y="2" width="19" height="16" rx="4.5" fill={color} />
        <path d="M21.4 8 26 4.9c.6-.4 1.5 0 1.5.8v8.6c0 .8-.9 1.2-1.5.8l-4.6-3.1z" fill={color} />
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: "block" }}>
      <path
        d="M6.9 3.4c.5-.3 1.2-.2 1.6.3l2.1 2.9c.4.5.3 1.2-.1 1.6l-1.3 1.2c-.3.3-.4.7-.2 1.1.9 1.7 2.2 3 3.9 3.9.4.2.8.1 1.1-.2l1.2-1.3c.4-.4 1.1-.5 1.6-.1l2.9 2.1c.5.4.6 1.1.3 1.6l-.9 1.5c-.6 1-1.8 1.5-2.9 1.2C10.9 18 6 13.1 4.7 7.8c-.3-1.1.2-2.3 1.2-2.9z"
        fill={color}
      />
      {arrow === "in" && <path d="M21.5 2.5 15.6 8.4M15.4 4.4v4.2h4.2" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />}
      {arrow === "out" && <path d="M15.6 8.4l5.9-5.9M17.3 2.4h4.3v4.3" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />}
    </svg>
  );
}

function BanGlyph({ color }: { color: string }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" style={{ display: "block", flexShrink: 0 }}>
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.8" />
      <path d="M5.8 18.2 18.2 5.8" stroke={color} strokeWidth="1.8" />
    </svg>
  );
}

/** Document row: coloured file-type page | name (2 lines) | size · type. */
function FileRow({ file, p }: { file: FileShare; p: ViberPalette }) {
  const ext = extOf(file.name);
  const color = fileColor(ext);
  const metaLine = [file.size, ext ? ext.toUpperCase() : ""].filter(Boolean).join(" · ");
  return (
    <div className="flex items-center" style={{ gap: 10 }}>
      <svg width="38" height="46" viewBox="0 0 38 46" style={{ display: "block", flexShrink: 0 }}>
        <path d="M5 0h20l13 13v28a5 5 0 0 1-5 5H5a5 5 0 0 1-5-5V5a5 5 0 0 1 5-5z" fill={color} />
        <path d="M25 0v8a5 5 0 0 0 5 5h8z" fill="#ffffff" fillOpacity="0.4" />
        <text x="19" y="36" textAnchor="middle" fontSize="10" fontWeight="700" fill="#ffffff" fontFamily="Roboto, system-ui, sans-serif">
          {(ext || "file").slice(0, 4).toUpperCase()}
        </text>
      </svg>
      <div className="min-w-0 flex-1">
        <div dir="ltr" className="line-clamp-2 break-all" style={{ fontSize: 16, lineHeight: "20px", fontWeight: 500, color: p.text, textAlign: "start" }}>
          {file.name}
        </div>
        {metaLine && (
          <div dir="ltr" style={{ fontSize: 13, lineHeight: "17px", color: p.quoteText, marginTop: 1, textAlign: "start" }}>
            {metaLine}
          </div>
        )}
      </div>
    </div>
  );
}

/** URL preview under the text, inside the bubble: picture, bold title, description, site. */
function LinkCard({ link, p, uiDir }: { link: LinkPreview; p: ViberPalette; uiDir: "rtl" | "ltr" }) {
  const site = link.siteName?.trim() || hostOf(link.url);
  return (
    <div style={{ marginTop: 8 }}>
      {link.image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={link.image} alt="" draggable={false} style={{ display: "block", width: "100%", height: 132, objectFit: "cover", borderRadius: 8 }} />
      )}
      <div style={{ marginTop: link.image ? 7 : 0 }}>
        <div dir={dirOf(link.title)} className="line-clamp-2" style={{ fontSize: 15, lineHeight: "20px", fontWeight: 500, color: p.text, textAlign: "start" }}>
          {link.title}
        </div>
        {link.description && (
          <div
            dir={dirOf(link.description)}
            className="line-clamp-2"
            style={{ fontSize: 14, lineHeight: "18px", color: p.quoteText, marginTop: 1, textAlign: "start" }}
          >
            {link.description}
          </div>
        )}
        <div dir={uiDir} className="truncate" style={{ fontSize: 13, lineHeight: "17px", color: p.sub, marginTop: 2, textAlign: "start" }}>
          <span dir="ltr">{site}</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Static map snapshot (the location message's thumbnail): city blocks, a park,
 * white streets, a main road and the red drop pin in the middle. Geography
 * never mirrors.
 */
function MapArt({ dark, h }: { dark: boolean; h: number }) {
  const c = dark
    ? { base: "#212b37", block: "#29343f", park: "#22423a", water: "#1b3550", road: "#3a4757", main: "#6a5a32", edge: "#18202a" }
    : { base: "#f0ede6", block: "#e5e1d8", park: "#cfe7c3", water: "#b7d9f2", road: "#ffffff", main: "#fbd98c", edge: "#d9d4ca" };
  return (
    <svg width="100%" height={h} viewBox="0 0 240 140" preserveAspectRatio="xMidYMid slice" style={{ display: "block" }}>
      <rect width="240" height="140" fill={c.base} />
      <path d="M0 108c30-6 52 2 76 16 14 8 18 16 18 16H0z" fill={c.water} />
      <rect x="150" y="12" width="62" height="38" rx="4" fill={c.park} />
      {[
        [8, 8, 54, 30],
        [72, 8, 62, 30],
        [8, 50, 54, 34],
        [72, 50, 62, 34],
        [150, 62, 34, 26],
        [196, 62, 40, 26],
        [112, 98, 56, 36],
        [180, 98, 56, 36],
      ].map(([x, y, w, hh], i) => (
        <rect key={i} x={x} y={y} width={w} height={hh} rx="2.5" fill={c.block} />
      ))}
      <g stroke={c.edge} strokeWidth="7.5" fill="none">
        <path d="M0 44h240M0 92h240M66 0v140M142 0v140M188 56v84" />
      </g>
      <g stroke={c.road} strokeWidth="5.5" fill="none">
        <path d="M0 44h240M0 92h240M66 0v140M142 0v140M188 56v84" />
      </g>
      <path d="M-4 128 248 18" stroke={c.edge} strokeWidth="11" />
      <path d="M-4 128 248 18" stroke={c.main} strokeWidth="8.5" />
      {/* pin */}
      <ellipse cx="120" cy="73" rx="6" ry="2.2" fill="rgba(0,0,0,0.22)" />
      <path d="M120 73c-1.2-5.2-11-12.4-11-21.4a11 11 0 0 1 22 0c0 9-9.8 16.2-11 21.4z" fill="#ea4335" stroke="#b3261e" strokeWidth="0.8" />
      <circle cx="120" cy="51.6" r="4" fill="#ffffff" />
    </svg>
  );
}

/** Voice note: purple play disc | playhead + waveform | "→T" transcribe disc; duration and time underneath. */
function ViberVoice({
  m,
  p,
  bg,
  radius,
  mine,
  status,
  rtl,
  quote,
}: {
  m: Message;
  p: ViberPalette;
  bg: string;
  radius: CSSProperties;
  mine: boolean;
  status: DeliveryStatus;
  rtl: boolean;
  quote?: ReactNode;
}) {
  const bars = waveform(m.id, 30, 5, 20);
  return (
    <div dir={rtl ? "rtl" : "ltr"} style={{ background: bg, width: "100%", maxWidth: 258, padding: "11px 13px 9px", ...radius }}>
      {quote}
      <div className="flex items-center" style={{ height: 40 }}>
        {/* play triangle never mirrors */}
        <span className="flex shrink-0 items-center justify-center rounded-full" style={{ width: 40, height: 40, background: p.accent }}>
          <svg width="16" height="16" viewBox="0 0 16 16" style={{ display: "block", marginLeft: 2 }}>
            <path d="M3.5 2.2v11.6c0 .7.8 1.1 1.3.7l9-5.8a.85.85 0 0 0 0-1.4l-9-5.8c-.5-.4-1.3 0-1.3.7z" fill="#ffffff" />
          </svg>
        </span>
        <div className="flex min-w-0 flex-1 items-center overflow-hidden" style={{ height: 28, marginInlineStart: 8, gap: 2 }}>
          <span style={{ width: 2.5, height: 28, borderRadius: 1.25, background: p.accent, flexShrink: 0, marginInlineEnd: 2 }} />
          {bars.map((h, i) => (
            <span key={i} style={{ width: 1.6, height: h, borderRadius: 0.8, background: p.wave, flexShrink: 0 }} />
          ))}
        </div>
        <span
          className="flex shrink-0 items-center justify-center rounded-full"
          style={{ width: 28, height: 28, background: p.transcribe, marginInlineStart: 8 }}
          dir="ltr"
        >
          <svg width="18" height="14" viewBox="0 0 18 14" fill="none" style={{ display: "block" }}>
            <path d="M1.5 7h5.2M4.8 4.8 7 7 4.8 9.2" stroke={p.transcribeFg} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M9.4 2.6h7M12.9 2.6v9" stroke={p.transcribeFg} strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </span>
      </div>
      <div className="flex items-center justify-between" style={{ marginTop: 5, height: 16 }}>
        <span dir="ltr" style={{ fontSize: META_FS, lineHeight: "16px", color: p.voiceMeta }}>
          {m.voiceDuration || "0:07"}
        </span>
        <span className="inline-flex items-center" style={{ gap: 3, fontSize: META_FS, lineHeight: "16px", color: p.voiceMeta }}>
          <span dir="ltr">{m.time}</span>
          {mine && <Ticks status={status} color={p.voiceMeta} seen={p.accent} />}
        </span>
      </div>
    </div>
  );
}
