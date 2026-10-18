"use client";

/**
 * Facebook Messenger — thread screen, Messenger for Android on a Samsung device
 * (360dp logical width, One UI status bar + 48dp 3-button nav). Self-contained:
 * shares nothing with the iOS file (Messenger.tsx).
 *
 * Palette — Messenger reuses the Facebook Design System (FDS) colour tokens
 * that facebook.com / messenger.com ship as CSS custom properties:
 *   --primary-text      light #050505   dark #E4E6EB
 *   --secondary-text    light #65676B   dark #B0B3B8
 *   --positive (active dot) #31A24C
 *   --media-inner-border / divider  light rgba(0,0,0,.1)  dark rgba(255,255,255,.1)
 *   Messenger thread canvas: light #FFFFFF, dark #000000 (true black on mobile)
 *   Incoming bubble: light #F0F0F0, dark #303030 (Messenger "wash" for bubbles;
 *   the dark value is the one Messenger dark-theme userstyles override, see
 *   https://userstyles.world/style/1325 `--chat-incoming-message-bubble-background-color`)
 * Default chat theme: SOLID "Messenger blue" bubbles — the default theme has a
 * single gradient stop (unlike Instagram's purple→blue default), and the same
 * colour tints every header / composer glyph (back arrow, call, video, +,
 * camera, gallery, mic, emoji, like). Value #0A7CFF (sampled from app captures;
 * the legacy brand blue was #0084FF — https://github.com/Schmavery/facebook-chat-api
 * threadColors.js lists `MessengerBlue` as the null/default theme).
 *
 * Android-specific (vs. iOS):
 *  - Material top bar 56dp painted with the canvas colour, hairline below.
 *    Back = stemmed ARROW (not the iOS chevron) in the theme colour, 24dp glyph
 *    in a 48dp target at 4dp inset. Avatar 36dp + 12dp green active dot ringed
 *    with the canvas colour. Name 16sp bold, subtitle 13sp secondary text.
 *    Trailing call + video glyphs, filled, theme colour, 24dp, 48dp targets.
 *    (No "i" button on Android — the info sheet opens from the name.)
 *  - Device font (Roboto / One UI via scenario.androidFont), message text
 *    15sp / 20sp line, bubble padding 8dp × 12dp → 36dp single line (pill).
 *  - Radius 18dp; joined side of a group drops to 4dp; 2dp between grouped
 *    bubbles, 8dp between senders. Incoming: 28dp avatar on the LAST bubble
 *    of a run, 8dp gutter. Outgoing: a 16dp trailing receipt column.
 *  - Receipts: hollow circle + check = sent, filled theme circle + white check
 *    = delivered, 14dp avatar of the reader = seen (only on the newest message
 *    they have seen; status circles only on your newest message).
 *  - Composer (Android order): [+] [camera] [gallery] [mic]  ( Message 😊 )  [👍]
 *    — filled glyphs in the theme colour, 36dp pill on light #F0F0F0 / dark
 *    #303030. Placeholder "Message" (replaced "Aa" in 2023), Arabic "مراسلة".
 *  - Entrance: FDS motion tokens from facebook.com CSS —
 *    --fds-animation-enter-exit-in: cubic-bezier(0.14, 1, 0.34, 1),
 *    --fds-duration-medium-in: 280ms. Bubble rises 16dp and scales 0.9 → 1 from
 *    its outer-bottom corner (Messenger's "pop up from composer").
 *
 * Behaviour: centred 12sp secondary-text timestamp at the top and after a 15+
 * minute gap, shown as typed. Thread opens with the profile intro (big avatar,
 * name, "You're friends on Facebook", "View profile") and the end-to-end
 * encryption notice (Messenger default E2EE since Dec 2023). Typing = grey
 * bubble with three wave dots + avatar in the thread; the header keeps
 * "Active now". Emoji-only (1–3) render large with no bubble; photos have no
 * bubble, a caption follows as its own bubble. Call / video / like / play
 * glyphs do not mirror in Arabic; the back arrow does.
 */

import type { CSSProperties, ReactNode } from "react";

import type { Message, Person } from "../../types";
import { Avatar, dirOf, SystemBottomBar, useChatScroll } from "../shared";
import { SamsungStatusBar } from "../devices/SamsungStatusBar";
import type { Lang } from "./chrome";
import { groupInfo, type PlatformMotion, type PlatformProps } from "./types";

/* ------------------------------ tokens ------------------------------ */

const THEME = "#0a7cff";
const ACTIVE_GREEN = "#31a24c";

interface Pal {
  bg: string;
  fg: string;
  bubbleFg: string;
  sub: string;
  inBubble: string;
  field: string;
  button: string;
  dots: string;
  divider: string;
  imgPlaceholder: string;
  wave: string;
}

function palette(dark: boolean): Pal {
  return dark
    ? {
        bg: "#000000",
        fg: "#e4e6eb",
        bubbleFg: "#e4e6eb",
        sub: "#b0b3b8",
        inBubble: "#303030",
        field: "#303030",
        button: "#303030",
        dots: "#a8abaf",
        divider: "rgba(255,255,255,0.1)",
        imgPlaceholder: "#242526",
        wave: "#b0b3b8",
      }
    : {
        bg: "#ffffff",
        fg: "#050505",
        bubbleFg: "#050505",
        sub: "#65676b",
        inBubble: "#f0f0f0",
        field: "#f0f0f0",
        button: "#e4e6eb",
        dots: "#90949c",
        divider: "rgba(0,0,0,0.1)",
        imgPlaceholder: "#e4e6eb",
        wave: "#65676b",
      };
}

/** Messenger's own wording (en / ar builds of the app). */
const STR: Record<
  Lang,
  {
    activeNow: string;
    message: string;
    friends: string;
    viewProfile: string;
    e2ee: string;
    learnMore: string;
  }
> = {
  en: {
    activeNow: "Active now",
    message: "Message",
    friends: "You're friends on Facebook",
    viewProfile: "View profile",
    e2ee: "Messages and calls are secured with end-to-end encryption. Only people in this chat can read, listen to, or share them.",
    learnMore: "Learn more",
  },
  ar: {
    activeNow: "نشط الآن",
    message: "مراسلة",
    friends: "أنتما صديقان على فيسبوك",
    viewProfile: "عرض الملف الشخصي",
    e2ee: "الرسائل والمكالمات محمية بالتشفير التام بين الطرفين. لا يمكن لأحد غير الأشخاص في هذه الدردشة قراءتها أو الاستماع إليها أو مشاركتها.",
    learnMore: "معرفة المزيد",
  },
};

/* Metrics (dp at 360dp width). */
const M = {
  text: 15,
  line: 20,
  padX: 12,
  padY: 8,
  radius: 18,
  joined: 4,
  imgRadius: 18,
  imgWidth: 220,
  maxW: 252,
  inAvatar: 28,
  bodyX: 8,
  receiptCol: 16,
  groupGap: 2,
  senderGap: 8,
  headerH: 56,
  headerAvatar: 36,
  emoji: 40,
};

/* ------------------------------ motion ------------------------------ */

/** CSS cubic-bezier evaluated in JS so the exporter frame == live keyframe. */
function bezier(x1: number, y1: number, x2: number, y2: number) {
  const cx = (u: number) => 3 * x1 * u * (1 - u) * (1 - u) + 3 * x2 * u * u * (1 - u) + u * u * u;
  const cy = (u: number) => 3 * y1 * u * (1 - u) * (1 - u) + 3 * y2 * u * u * (1 - u) + u * u * u;
  return (t: number) => {
    if (t <= 0) return 0;
    if (t >= 1) return 1;
    let lo = 0;
    let hi = 1;
    for (let i = 0; i < 24; i++) {
      const mid = (lo + hi) / 2;
      if (cx(mid) < t) lo = mid;
      else hi = mid;
    }
    return cy((lo + hi) / 2);
  };
}

const ENTER_MS = 280;
const ENTER_EASE_CSS = "cubic-bezier(0.14, 1, 0.34, 1)";
const enterEase = bezier(0.14, 1, 0.34, 1);
const RISE = 16;
const FROM_SCALE = 0.9;
/** opacity reaches 1 by 40 % of the way (FDS fades in faster than it moves) */
const FADE_PART = 0.4;

function originOf(mine: boolean, rtl: boolean): string {
  const right = mine ? !rtl : rtl;
  return right ? "right bottom" : "left bottom";
}

export const messengerAndroidMotion: PlatformMotion = {
  enterMs: ENTER_MS,
  enterStyle: (p, mine, rtl) => {
    const e = enterEase(p);
    return {
      opacity: Math.min(1, Math.max(0, p / FADE_PART)),
      transform: `translateY(${(1 - e) * RISE}px) scale(${FROM_SCALE + (1 - FROM_SCALE) * e})`,
      transformOrigin: originOf(mine, rtl),
    };
  },
};

const TYPING_CYCLE = 1300;
const TYPING_STAGGER = 0.14; // fraction of the cycle between dots

/** Same piecewise-linear curve as the `msa-dot` keyframes below. */
function dotAt(phase: number): { opacity: number; y: number } {
  const f = ((phase % 1) + 1) % 1;
  let k = 0;
  if (f < 0.25) k = f / 0.25;
  else if (f < 0.5) k = 1 - (f - 0.25) / 0.25;
  return { opacity: 0.45 + 0.55 * k, y: -3 * k };
}

const KEYFRAMES = `
@keyframes msa-enter {
  from { transform: translateY(${RISE}px) scale(${FROM_SCALE}); }
  to { transform: none; }
}
@keyframes msa-fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes msa-typing-in {
  from { opacity: 0; transform: scale(0.7); }
  to { opacity: 1; transform: none; }
}
@keyframes msa-dot {
  0% { opacity: 0.45; transform: translateY(0); }
  25% { opacity: 1; transform: translateY(-3px); }
  50% { opacity: 0.45; transform: translateY(0); }
  100% { opacity: 0.45; transform: translateY(0); }
}
.msa-enter { animation: msa-enter ${ENTER_MS}ms ${ENTER_EASE_CSS} both, msa-fade-in ${Math.round(ENTER_MS * FADE_PART)}ms linear both; }
.msa-typing-in { animation: msa-typing-in 220ms ${ENTER_EASE_CSS} both; transform-origin: left bottom; }
[dir="rtl"] .msa-typing-in { transform-origin: right bottom; }
.msa-fade { animation: msa-fade-in 200ms ease-out both; }
.msa-dot { animation: msa-dot ${TYPING_CYCLE}ms linear infinite; }
`;

/* ------------------------------- icons ------------------------------ */

/** Messenger's Android back arrow (stemmed), mirrors in RTL. */
function BackArrow() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="shrink-0 rtl:-scale-x-100">
      <path d="M20.5 12H4.2M11 4.8 3.8 12l7.2 7.2" stroke={THEME} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24">
      <path
        fill={THEME}
        d="M7.3 2.6c.7-.3 1.5 0 1.9.6l1.9 3c.4.7.3 1.6-.3 2.1l-1.5 1.3c-.3.3-.4.7-.2 1.1.6 1.3 1.4 2.4 2.4 3.4s2.1 1.8 3.4 2.4c.4.2.8.1 1.1-.2l1.3-1.5c.5-.6 1.4-.7 2.1-.3l3 1.9c.6.4.9 1.2.6 1.9l-.6 1.6c-.4 1.1-1.5 1.9-2.7 1.9C11.2 21.8 2.2 12.8 2.2 4.3c0-1.2.8-2.3 1.9-2.7l3.2.9Z"
      />
    </svg>
  );
}

function VideoIcon() {
  return (
    <svg width="26" height="24" viewBox="0 0 26 24">
      <rect x="1.5" y="5" width="15.5" height="14" rx="3.6" fill={THEME} />
      <path fill={THEME} d="m18.6 10.1 4.6-3.1c.7-.5 1.6 0 1.6.9v8.2c0 .9-.9 1.4-1.6.9l-4.6-3.1v-3.8Z" />
    </svg>
  );
}

function PlusCircle({ cut }: { cut: string }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10.5" fill={THEME} />
      <path d="M12 7v10M7 12h10" stroke={cut} strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

function CameraIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24">
      <path
        fillRule="evenodd"
        fill={THEME}
        d="M9.2 3.5h5.6c.7 0 1.3.4 1.6 1l.8 1.6h2.1A3 3 0 0 1 22.3 9v8.7a3 3 0 0 1-3 3H4.7a3 3 0 0 1-3-3V9a3 3 0 0 1 3-2.9h2.1l.8-1.6c.3-.6.9-1 1.6-1ZM12 9.1a4.1 4.1 0 1 0 0 8.2 4.1 4.1 0 0 0 0-8.2Z"
      />
    </svg>
  );
}

function GalleryIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24">
      <path
        fillRule="evenodd"
        fill={THEME}
        d="M6 2.5h12A3.5 3.5 0 0 1 21.5 6v12a3.5 3.5 0 0 1-3.5 3.5H6A3.5 3.5 0 0 1 2.5 18V6A3.5 3.5 0 0 1 6 2.5Zm2.6 3.6a2 2 0 1 0 0 4 2 2 0 0 0 0-4ZM4.5 17.6l4.2-4.5c.4-.4 1-.4 1.4 0l1.9 2 3.6-4.3c.4-.5 1.1-.5 1.5 0l2.4 2.9v6H6a1.5 1.5 0 0 1-1.5-1.5v-.6Z"
      />
    </svg>
  );
}

function MicIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24">
      <rect x="8" y="2" width="8" height="13" rx="4" fill={THEME} />
      <path d="M5 11a7 7 0 0 0 14 0M12 18v3.6" stroke={THEME} strokeWidth="2" strokeLinecap="round" fill="none" />
    </svg>
  );
}

function SmileyIcon({ cut }: { cut: string }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" fill={THEME} />
      <circle cx="8.7" cy="9.6" r="1.4" fill={cut} />
      <circle cx="15.3" cy="9.6" r="1.4" fill={cut} />
      <path d="M7.6 13.6c1 1.8 2.6 2.8 4.4 2.8s3.4-1 4.4-2.8" stroke={cut} strokeWidth="1.8" strokeLinecap="round" fill="none" />
    </svg>
  );
}

function LikeIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24">
      <path
        fill={THEME}
        d="M2.6 10.3c0-.7.6-1.3 1.3-1.3h2.3c.7 0 1.3.6 1.3 1.3v9.6c0 .7-.6 1.3-1.3 1.3H3.9c-.7 0-1.3-.6-1.3-1.3v-9.6Zm6.6-.4 3.5-6.5c.4-.8 1.4-1.1 2.2-.7 1 .5 1.5 1.6 1.2 2.7l-.8 3h4.3c1.4 0 2.4 1.3 2.1 2.6l-1.6 7.4c-.3 1.4-1.6 2.4-3 2.4h-6.4c-.9 0-1.5-.7-1.5-1.5v-9.4Z"
      />
    </svg>
  );
}

function LockIcon({ color }: { color: string }) {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" className="inline-block shrink-0" style={{ verticalAlign: "-1px" }}>
      <path fill={color} fillRule="evenodd" d="M7 9V7a5 5 0 0 1 10 0v2h.5A2.5 2.5 0 0 1 20 11.5v8a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 19.5v-8A2.5 2.5 0 0 1 6.5 9H7Zm2.4 0h5.2V7a2.6 2.6 0 0 0-5.2 0v2Z" />
    </svg>
  );
}

function ImageGlyph({ color }: { color: string }) {
  return (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round">
      <rect x="2.5" y="2.5" width="19" height="19" rx="4" />
      <circle cx="8.6" cy="8.6" r="1.6" fill={color} stroke="none" />
      <path d="M3 17 7.6 12.4a1.5 1.5 0 0 1 2.1 0l7 7" />
    </svg>
  );
}

/** Sent: hollow theme circle + check.  Delivered: filled circle, white check. */
function StatusCircle({ filled, bg }: { filled: boolean; bg: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" className="block">
      <circle cx="7" cy="7" r="6.2" fill={filled ? THEME : bg} stroke={THEME} strokeWidth="1.3" />
      <path d="m4.2 7.2 1.9 1.9 3.8-4" stroke={filled ? "#ffffff" : THEME} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
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

/** Messenger drops a centred timestamp at the top and after a 15+ minute gap. */
function needsSeparator(messages: Message[], i: number): boolean {
  if (i === 0) return true;
  const a = minutesOf(messages[i - 1].time);
  const b = minutesOf(messages[i].time);
  if (a == null || b == null) return false;
  return b - a >= 15 || b < a;
}

const PICTO = /\p{Extended_Pictographic}|\p{Regional_Indicator}|⃣/u;

/** 1–3 emoji and nothing else → rendered large without a bubble. */
function bigEmoji(text: string): boolean {
  const t = text.trim();
  if (!t) return false;
  let graphemes: string[];
  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    const seg = new Intl.Segmenter(undefined, { granularity: "grapheme" });
    graphemes = Array.from(seg.segment(t), (s) => s.segment).filter((g) => g.trim() !== "");
  } else {
    graphemes = Array.from(t).filter((g) => g.trim() !== "");
  }
  return graphemes.length > 0 && graphemes.length <= 3 && graphemes.every((g) => PICTO.test(g));
}

type Kind = "text" | "voice" | "image" | "emoji";

function kindOf(m: Message): Kind {
  if (m.type === "voice") return "voice";
  if (m.type === "image") return "image";
  return bigEmoji(m.text) ? "emoji" : "text";
}

type Corners = Pick<CSSProperties, "borderTopLeftRadius" | "borderTopRightRadius" | "borderBottomLeftRadius" | "borderBottomRightRadius">;

/** Joined-side corners shrink inside a group. */
function cornersFor(onRight: boolean, joinedAbove: boolean, joinedBelow: boolean, r: number): Corners {
  const top = joinedAbove ? M.joined : r;
  const bottom = joinedBelow ? M.joined : r;
  return onRight
    ? { borderTopLeftRadius: r, borderBottomLeftRadius: r, borderTopRightRadius: top, borderBottomRightRadius: bottom }
    : { borderTopRightRadius: r, borderBottomRightRadius: r, borderTopLeftRadius: top, borderBottomLeftRadius: bottom };
}

/* ---------------------------- sub-views ----------------------------- */

const WAVE = [4, 7, 12, 9, 15, 11, 6, 13, 17, 10, 6, 12, 15, 8, 5, 10, 14, 7, 12, 9, 5, 8, 11, 6, 4];

function VoiceContent({ mine, pal, duration }: { mine: boolean; pal: Pal; duration?: string }) {
  const ink = mine ? "#ffffff" : pal.bubbleFg;
  const discFill = mine ? "#ffffff" : THEME;
  const playFill = mine ? THEME : "#ffffff";
  const bars = mine ? "rgba(255,255,255,0.95)" : pal.wave;
  return (
    <div dir="ltr" className="flex items-center" style={{ width: 196, height: 24, gap: 8 }}>
      <span className="flex shrink-0 items-center justify-center rounded-full" style={{ width: 24, height: 24, background: discFill }}>
        <svg width="10" height="12" viewBox="0 0 10 12">
          <path d="M1 1.3v9.4c0 .6.7 1 1.2.7l7.3-4.7c.5-.3.5-1 0-1.3L2.2.6C1.7.3 1 .7 1 1.3Z" fill={playFill} />
        </svg>
      </span>
      <div className="flex flex-1 items-center justify-between" style={{ height: 18 }}>
        {WAVE.map((b, i) => (
          <span key={i} style={{ width: 2.5, height: b, borderRadius: 2, background: bars }} />
        ))}
      </div>
      <span className="shrink-0 tabular-nums" style={{ fontSize: 13, lineHeight: "16px", fontWeight: 500, color: ink }}>
        {duration ?? "0:08"}
      </span>
    </div>
  );
}

function TypingRow({ person, pal, animate, clockMs }: { person: Person; pal: Pal; animate: boolean; clockMs?: number }) {
  return (
    <div className="flex items-end" style={{ marginTop: M.senderGap, gap: 8 }}>
      <div className="shrink-0" style={{ width: M.inAvatar }}>
        <Avatar person={person} size={M.inAvatar} />
      </div>
      <div
        className={`flex items-center ${animate ? "msa-typing-in" : ""}`}
        style={{ background: pal.inBubble, borderRadius: M.radius, height: M.line + M.padY * 2, padding: "0 14px", gap: 4 }}
      >
        {[0, 1, 2].map((i) => {
          const st = clockMs !== undefined ? dotAt(clockMs / TYPING_CYCLE - i * TYPING_STAGGER) : null;
          return (
            <span
              key={i}
              className={`inline-block rounded-full ${st ? "" : "msa-dot"}`}
              style={{
                width: 7,
                height: 7,
                background: pal.dots,
                ...(st
                  ? { opacity: st.opacity, transform: `translateY(${st.y}px)` }
                  : { animationDelay: `${i * TYPING_STAGGER * TYPING_CYCLE}ms` }),
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------ thread ------------------------------ */

export function MessengerAndroid({ scenario, playback, lang, rtl }: PlatformProps) {
  const dark = scenario.theme === "dark";
  const pal = palette(dark);
  const s = STR[lang];
  const { messages, typing, clockMs } = playback;
  const live = playback.isLive && clockMs === undefined;
  const showTyping = typing || (!playback.isLive && clockMs === undefined && scenario.presence === "typing");
  const scrollRef = useChatScroll<HTMLDivElement>(`${messages.length}-${showTyping}`);

  const active = scenario.presence !== "lastseen";
  const subtitle = active ? s.activeNow : scenario.lastSeenText;

  const kinds = messages.map(kindOf);
  /** bubble-like kinds join their neighbours' corners; big emoji break the run */
  const joins = (a: Kind | undefined, b: Kind | undefined) => !!a && !!b && a !== "emoji" && b !== "emoji";

  /* Receipts: reader avatar on the newest outgoing message they have seen, and
     a status circle on your newest outgoing message if it is not seen yet. */
  let lastRead = -1;
  let lastMine = -1;
  messages.forEach((m, i) => {
    if (m.sender !== "me") return;
    lastMine = i;
    if (playback.statusOf(m) === "read") lastRead = i;
  });

  return (
    <div className="flex h-full w-full flex-col" style={{ background: pal.bg, color: pal.fg }}>
      <style>{KEYFRAMES}</style>
      <SamsungStatusBar tint={dark ? "light" : "dark"} background={pal.bg} lang={lang} />

      {/* Top app bar — 56dp */}
      <div
        className="flex shrink-0 items-center"
        style={{ height: M.headerH, paddingInlineStart: 4, paddingInlineEnd: 4, background: pal.bg, borderBottom: `0.5px solid ${pal.divider}` }}
      >
        <span className="flex shrink-0 items-center justify-center" style={{ width: 48, height: 48 }}>
          <BackArrow />
        </span>
        <div className="relative shrink-0">
          <Avatar person={scenario.them} size={M.headerAvatar} />
          {active && (
            <span
              className="absolute rounded-full"
              style={{
                width: 10,
                height: 10,
                bottom: -2,
                insetInlineEnd: -2,
                background: ACTIVE_GREEN,
                border: `2px solid ${pal.bg}`,
                boxSizing: "content-box",
              }}
            />
          )}
        </div>
        <div className="min-w-0 flex-1" style={{ marginInlineStart: 10 }}>
          <div className="truncate" dir="auto" style={{ fontSize: 16, lineHeight: "20px", fontWeight: 700, textAlign: "start" }}>
            {scenario.them.name}
          </div>
          {subtitle && (
            <div className="truncate" dir="auto" style={{ fontSize: 13, lineHeight: "16px", color: pal.sub, textAlign: "start" }}>
              {subtitle}
            </div>
          )}
        </div>
        <div className="flex shrink-0 items-center">
          <span className="flex items-center justify-center" style={{ width: 44, height: 48 }}>
            <PhoneIcon />
          </span>
          <span className="flex items-center justify-center" style={{ width: 44, height: 48 }}>
            <VideoIcon />
          </span>
        </div>
      </div>

      {/* Thread */}
      <div
        ref={scrollRef}
        className="rcss-scroll relative min-h-0 flex-1 overflow-y-auto"
        style={{ background: pal.bg, paddingInline: M.bodyX, paddingTop: 8, paddingBottom: 8 }}
      >
        <div className="flex flex-col">
          {/* Profile intro + E2EE notice that open every Messenger thread */}
          <div className="flex flex-col items-center text-center" style={{ marginTop: 24, marginBottom: 20, paddingInline: 24 }}>
            <Avatar person={scenario.them} size={80} />
            <div className="max-w-full truncate" dir="auto" style={{ marginTop: 12, fontSize: 20, lineHeight: "24px", fontWeight: 700 }}>
              {scenario.them.name}
            </div>
            <div style={{ marginTop: 4, fontSize: 13, lineHeight: "16px", color: pal.sub }}>{s.friends}</div>
            <div style={{ marginTop: 12, background: pal.button, fontSize: 14, lineHeight: "18px", fontWeight: 600, padding: "7px 14px", borderRadius: 18 }}>
              {s.viewProfile}
            </div>
            <div style={{ marginTop: 24, fontSize: 12, lineHeight: "16px", color: pal.sub }}>
              <LockIcon color={pal.sub} /> {s.e2ee} <span className="whitespace-nowrap" style={{ fontWeight: 600, color: pal.fg }}>{s.learnMore}</span>
            </div>
          </div>

          {messages.map((m, i) => {
            const mine = m.sender === "me";
            const onRight = mine ? !rtl : rtl;
            const kind = kinds[i];
            const sep = needsSeparator(messages, i);
            const g = groupInfo(messages, i);
            const firstOfGroup = g.firstOfGroup || sep;
            const nextSep = i + 1 < messages.length && needsSeparator(messages, i + 1);
            const lastOfGroup = g.lastOfGroup || nextSep;
            const joinAbove = !firstOfGroup && joins(kinds[i - 1], kind);
            const joinBelow = !lastOfGroup && joins(kind, kinds[i + 1]);

            const caption = kind === "image" ? m.text.trim() : "";
            const marginTop = sep ? 0 : firstOfGroup ? M.senderGap : M.groupGap;
            const status = mine ? playback.statusOf(m) : null;

            let receipt: ReactNode = null;
            if (mine && i === lastRead) {
              receipt = <Avatar person={scenario.them} size={14} />;
            } else if (mine && i === lastMine && status !== "read") {
              receipt = <StatusCircle filled={status === "delivered"} bg={pal.bg} />;
            }

            let body: ReactNode;
            if (kind === "emoji") {
              body = (
                <div dir="auto" style={{ fontSize: M.emoji, lineHeight: `${M.emoji + 8}px`, paddingInline: 2 }}>
                  {m.text.trim()}
                </div>
              );
            } else if (kind === "image") {
              const imgCorners = cornersFor(onRight, joinAbove, !!caption || joinBelow, M.imgRadius);
              body = (
                <>
                  <div className="overflow-hidden" style={{ ...imgCorners, width: M.imgWidth, background: pal.imgPlaceholder }}>
                    {m.imageSrc ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={m.imageSrc} alt="" draggable={false} className="block w-full object-cover" style={{ maxHeight: 290 }} />
                    ) : (
                      <div className="flex items-center justify-center" style={{ height: 270 }}>
                        <ImageGlyph color={pal.sub} />
                      </div>
                    )}
                  </div>
                  {caption && (
                    <div
                      style={{
                        ...cornersFor(onRight, true, joinBelow, M.radius),
                        marginTop: M.groupGap,
                        background: mine ? THEME : pal.inBubble,
                        color: mine ? "#ffffff" : pal.bubbleFg,
                        padding: `${M.padY}px ${M.padX}px`,
                      }}
                    >
                      <div dir={dirOf(caption)} className="whitespace-pre-wrap break-words" style={{ fontSize: M.text, lineHeight: `${M.line}px`, textAlign: "start" }}>
                        {caption}
                      </div>
                    </div>
                  )}
                </>
              );
            } else {
              body = (
                <div
                  style={{
                    ...cornersFor(onRight, joinAbove, joinBelow, M.radius),
                    background: mine ? THEME : pal.inBubble,
                    color: mine ? "#ffffff" : pal.bubbleFg,
                    padding: kind === "voice" ? "6px 12px 6px 6px" : `${M.padY}px ${M.padX}px`,
                  }}
                >
                  {kind === "voice" ? (
                    <VoiceContent mine={mine} pal={pal} duration={m.voiceDuration} />
                  ) : (
                    <div dir={dirOf(m.text)} className="whitespace-pre-wrap break-words" style={{ fontSize: M.text, lineHeight: `${M.line}px`, textAlign: "start" }}>
                      {m.text}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <div key={m.id} className="contents">
                {sep && (
                  <div className="flex justify-center" style={{ margin: i === 0 ? "4px 0 12px" : "16px 0 12px" }}>
                    <span dir="auto" style={{ fontSize: 12, lineHeight: "16px", fontWeight: 500, color: pal.sub }}>
                      {m.time}
                    </span>
                  </div>
                )}
                <div
                  data-mid={m.id}
                  data-sender={m.sender}
                  className={`flex items-end ${mine ? "justify-end" : "justify-start"} ${live ? "msa-enter" : ""}`}
                  style={{ marginTop, ...(live ? { transformOrigin: originOf(mine, rtl) } : {}) }}
                >
                  {!mine && (
                    <div className="shrink-0" style={{ width: M.inAvatar, marginInlineEnd: 8 }}>
                      {lastOfGroup && <Avatar person={scenario.them} size={M.inAvatar} />}
                    </div>
                  )}
                  <div className={`flex min-w-0 flex-col ${mine ? "items-end" : "items-start"}`} style={{ maxWidth: M.maxW }}>
                    {body}
                  </div>
                  {mine && (
                    <div className="flex shrink-0 items-end justify-center" style={{ width: M.receiptCol, marginInlineStart: 2 }}>
                      {receipt && (
                        <span key={`${m.id}-${status}`} className={live ? "msa-fade" : ""} style={{ display: "block" }}>
                          {receipt}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {showTyping && <TypingRow person={scenario.them} pal={pal} animate={live} clockMs={clockMs} />}
        </div>
      </div>

      {/* Composer */}
      <div className="flex shrink-0 items-center" style={{ background: pal.bg, height: 56, paddingInlineStart: 4, paddingInlineEnd: 4 }}>
        {[<PlusCircle key="p" cut={pal.bg} />, <CameraIcon key="c" />, <GalleryIcon key="g" />, <MicIcon key="m" />].map((icon, k) => (
          <span key={k} className="flex shrink-0 items-center justify-center" style={{ width: 40, height: 40 }}>
            {icon}
          </span>
        ))}
        <div
          className="flex min-w-0 flex-1 items-center rounded-full"
          style={{ background: pal.field, height: 36, marginInlineStart: 4, paddingInlineStart: 14, paddingInlineEnd: 6 }}
        >
          <span className="min-w-0 flex-1 truncate" style={{ fontSize: 15, color: pal.sub }}>
            {s.message}
          </span>
          <SmileyIcon cut={pal.field} />
        </div>
        <span className="flex shrink-0 items-center justify-center" style={{ width: 44, height: 40 }}>
          <LikeIcon />
        </span>
      </div>

      <SystemBottomBar device="android" bg={pal.bg} fg={dark ? "#e4e6eb" : "#050505"} />
    </div>
  );
}
