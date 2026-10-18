"use client";

/**
 * Facebook Messenger — 1:1 thread screen (iPhone, late-2026 build).
 *
 * Key values (pt @ 393pt logical width). Meta publishes no Messenger spec, so
 * values are cross-checked against Meta's own help centre, facebook.com's
 * Messenger CSS tokens and screenshots of the current iOS build:
 *  - Default chat theme: SOLID Messenger blue #0A7CFF for outgoing bubbles and
 *    every accent glyph (chevron, call/video, composer icons, like, receipts).
 *    The 2020 revamp removed the old "Default Blue" picker entry but default
 *    threads still render the solid blue (gradients only come from themes).
 *    https://www.gizguide.com/2020/10/messenger-ios-update-2020.html
 *  - Incoming bubble: light #F0F0F0, dark #303030 on a true-black #000 canvas.
 *    Primary text #050505 / #FFFFFF, secondary #65676B / #B0B3B8 (Facebook
 *    FDS tokens), presence green #31A24C (FDS --positive).
 *  - Header 52pt: theme-blue back chevron (only mirrored glyph), 36pt avatar +
 *    12pt green dot with a 2.5pt canvas ring, name 17 semibold, "Active now"
 *    13 secondary, filled phone + video glyphs in the theme colour, hairline.
 *  - Thread intro: 80pt avatar, name 20 bold, "You're friends on Facebook"
 *    14 secondary, "View profile" 32pt grey button (radius 8), then the
 *    default-E2EE notice (lock + "Messages and calls are secured with
 *    end-to-end encryption…"), shown since Dec 2023.
 *    https://www.phonearena.com/news/Meta-Messenger-ramps-up-security-with-default-end-to-end-encryption-and-rolls-out-new-features_id153295
 *  - Timestamp separators: centred 12/600 secondary, the time as typed, at the
 *    top of the thread and after ≥1h of silence (no "Today" prefix for today).
 *  - Bubbles: 17/22 text, 7×12 padding, radius 18, joined corners 4, 2pt gap
 *    in a group, 10pt between senders, max width 258pt; 28pt avatar on the
 *    LAST incoming bubble of a group. Photos: no bubble, 230pt wide, same
 *    grouped radii; a caption is its own bubble under the photo. 1–3 emoji
 *    alone render large (44 / 36pt) with no bubble.
 *  - Receipts (Messenger Help Centre wording — its old icon article URL now
 *    404s, so this follows the long-standing documented scheme): a 14pt
 *    column on the trailing edge — hollow blue circle + check = Sent, filled
 *    blue circle + white check = Delivered, the friend's 14pt profile picture
 *    = Seen (placed at the last message they have seen). Only the newest
 *    outgoing message carries a Sent/Delivered icon.
 *  - Typing: the friend's 28pt avatar + 60×36 grey bubble with three 7pt
 *    dots (1.3s wave); the header keeps saying "Active now".
 *  - Composer: + · camera · gallery · mic (24pt filled, theme blue), then a
 *    36pt pill (#F0F0F0 / #303030) "Message" with a smiley, then the 26pt
 *    thumbs-up "like".
 *  - Motion (messengerIosMotion, 380ms under-damped spring, ~4% overshoot):
 *    outgoing pops from its trailing-bottom corner (0.82 → 1, 22pt rise);
 *    incoming fades + rises 10pt growing 0.92 → 1 from the avatar corner.
 *  - Arabic build: whole layout mirrors (outgoing + receipts on the left),
 *    chevron mirrors, call/video/composer glyphs and the thumbs-up do not.
 *  - Reactions: a 22pt pill (13pt emoji on white / #3A3B3C, 2pt canvas-colour
 *    ring + soft shadow) hanging off the bubble's bottom corner on the side
 *    that faces the middle of the thread (bottom-left of my bubbles,
 *    bottom-right of theirs), overlapping the bubble by 6pt; the row gets
 *    16pt of extra space below. ("reactions … at the bottom left corner" of
 *    your own messages — https://mobilesyrup.com/2017/03/23/facebook-message-reactions-mentions-messenger/ ;
 *    pill styling cross-checked with messenger.com's reaction CSS teardown,
 *    https://ishadeed.com/article/facebook-messenger-chat-component/ )
 *  - Replies: 12pt secondary label led by the reply arrow — "You replied to
 *    Khalid" / "Khalid replied to you" (AR "قمت بالرد على خالد" / "قام خالد
 *    بالرد عليك", same "قمت بـ…" phrasing as "قمت بإلغاء إرسال رسالة") — then
 *    the quoted message as a faded (washed) bubble, max 3 lines, tucked
 *    behind the top of the reply bubble (messenger.com uses the same overlap:
 *    `.message--washed{margin-bottom:-17px}`, ishadeed). Photos quote as a
 *    faded thumbnail, voice as "Voice message".
 *  - Compose typing: the four leading glyphs collapse into one blue ">"
 *    expander, the pill widens and grows up to 5 lines (22pt each), the caret
 *    is a 2pt theme-blue bar, and the 👍 becomes the blue paper-plane send
 *    glyph (mirrored in Arabic). The smiley stays inside the pill.
 */

import { Fragment, type CSSProperties, type ReactNode } from "react";

import type { DeliveryStatus, Message, Person } from "../../types";
import { Avatar, dirOf, SystemBottomBar, useChatScroll } from "../shared";
import { StatusBar } from "../devices/StatusBar";
import type { Lang } from "./chrome";
import { groupInfo, type PlatformMotion, type PlatformProps } from "./types";

/* ------------------------------ tokens ------------------------------ */

const MSG_BLUE = "#0a7cff";
const MSG_GREEN = "#31a24c";

const M = {
  headerH: 52,
  headerAvatar: 36,
  activeDot: 12,
  nameSize: 17,
  subSize: 13,
  callIcon: 26,
  bodyPadStart: 10,
  bodyPadEnd: 4,
  inAvatar: 28,
  avatarGap: 8,
  receiptCol: 16,
  receiptGap: 2,
  receipt: 14,
  text: 17,
  lh: 22,
  padX: 12,
  padY: 7,
  maxW: 258,
  radius: 18,
  joined: 4,
  imgW: 230,
  groupGap: 2,
  senderGap: 10,
  composerIcon: 24,
  fieldH: 36,
} as const;

interface Palette {
  bg: string;
  fg: string;
  sub: string;
  inBubble: string;
  field: string;
  button: string;
  dots: string;
  hairline: string;
  imgPlaceholder: string;
}

function palette(dark: boolean): Palette {
  return dark
    ? {
        bg: "#000000",
        fg: "#ffffff",
        sub: "#b0b3b8",
        inBubble: "#303030",
        field: "#303030",
        button: "#303030",
        dots: "#b0b3b8",
        hairline: "rgba(255,255,255,0.12)",
        imgPlaceholder: "#242526",
      }
    : {
        bg: "#ffffff",
        fg: "#050505",
        sub: "#65676b",
        inBubble: "#f0f0f0",
        field: "#f0f0f0",
        button: "#e4e6eb",
        dots: "#8a8d91",
        hairline: "rgba(0,0,0,0.1)",
        imgPlaceholder: "#e4e6eb",
      };
}

/** Exact Messenger strings (English and Arabic builds). */
const STR: Record<
  Lang,
  {
    activeNow: string;
    message: string;
    friends: string;
    viewProfile: string;
    e2ee: string;
    learnMore: string;
    youRepliedTo: (name: string) => string;
    repliedToYou: (name: string) => string;
    youRepliedToYourself: string;
    repliedToThemselves: (name: string) => string;
    voiceMessage: string;
  }
> = {
  en: {
    activeNow: "Active now",
    message: "Message",
    friends: "You're friends on Facebook",
    viewProfile: "View profile",
    e2ee: "Messages and calls are secured with end-to-end encryption. Only people in this chat can read, listen to or share them.",
    learnMore: "Learn more",
    youRepliedTo: (n) => `You replied to ${n}`,
    repliedToYou: (n) => `${n} replied to you`,
    youRepliedToYourself: "You replied to yourself",
    repliedToThemselves: (n) => `${n} replied to themselves`,
    voiceMessage: "Voice message",
  },
  ar: {
    activeNow: "نشط الآن",
    message: "مراسلة",
    friends: "أنتما صديقان على فيسبوك",
    viewProfile: "عرض الملف الشخصي",
    e2ee: "الرسائل والمكالمات مؤمّنة بالتشفير التام بين الطرفين. يمكن فقط للأشخاص الموجودين في هذه الدردشة قراءتها أو الاستماع إليها أو مشاركتها.",
    learnMore: "معرفة المزيد",
    youRepliedTo: (n) => `قمت بالرد على ${n}`,
    repliedToYou: (n) => `قام ${n} بالرد عليك`,
    youRepliedToYourself: "قمت بالرد على نفسك",
    repliedToThemselves: (n) => `قام ${n} بالرد على نفسه`,
    voiceMessage: "رسالة صوتية",
  },
};

/* ------------------------------- icons ------------------------------ */
/* Messenger's glyph family: rounded, FILLED shapes in the theme colour. */

function Chevron() {
  // the only header glyph that mirrors in the Arabic build
  return (
    <svg width="14" height="24" viewBox="0 0 14 24" fill="none" className="shrink-0 rtl:-scale-x-100">
      <path d="M11.5 3 2.5 12l9 9" stroke={MSG_BLUE} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PhoneIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <path
        fill={MSG_BLUE}
        d="M7.1 2.6c.6-.2 1.3 0 1.7.6l1.9 2.9c.4.6.3 1.4-.2 1.9L9.2 9.3c-.3.3-.3.7-.2 1 .9 1.8 2.4 3.5 4.3 4.6.4.2.8.2 1.1-.1l1.3-1.3c.5-.5 1.3-.6 1.9-.2l2.9 1.8c.6.4.9 1.1.7 1.8-.6 2.2-2.4 3.9-4.7 3.8C10 20.5 3.5 14.2 3.3 7.6c-.1-2.3 1.6-4.3 3.8-5Z"
      />
    </svg>
  );
}

function VideoIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <rect x="1.5" y="5.5" width="14.5" height="13" rx="3.6" fill={MSG_BLUE} />
      <path fill={MSG_BLUE} d="M17.2 10.1 21 7.3c.7-.5 1.6 0 1.6.8v7.8c0 .8-.9 1.3-1.6.8l-3.8-2.8Z" />
    </svg>
  );
}

function PlusIcon({ size, bg }: { size: number; bg: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <circle cx="12" cy="12" r="10.5" fill={MSG_BLUE} />
      <path d="M12 7v10M7 12h10" stroke={bg} strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

function CameraIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <path
        fillRule="evenodd"
        fill={MSG_BLUE}
        d="M9.3 3h5.4c.8 0 1.4.4 1.8 1.1l.8 1.4h1.9A3.3 3.3 0 0 1 22.5 8.8v8.9a3.3 3.3 0 0 1-3.3 3.3H4.8a3.3 3.3 0 0 1-3.3-3.3V8.8a3.3 3.3 0 0 1 3.3-3.3h1.9l.8-1.4C7.9 3.4 8.5 3 9.3 3ZM12 8.6a4.4 4.4 0 1 0 0 8.8 4.4 4.4 0 0 0 0-8.8Z"
      />
    </svg>
  );
}

function GalleryIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <path
        fillRule="evenodd"
        fill={MSG_BLUE}
        d="M6 2h12a4 4 0 0 1 4 4v12a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V6a4 4 0 0 1 4-4Zm2.6 4.3a2 2 0 1 0 0 4 2 2 0 0 0 0-4ZM4.3 17.6v.4c0 1 .8 1.7 1.7 1.7h12c1 0 1.7-.8 1.7-1.7v-2.1l-3.6-3.6a1.2 1.2 0 0 0-1.7 0l-3.6 3.6-1.4-1.4a1.2 1.2 0 0 0-1.7 0Z"
      />
    </svg>
  );
}

function MicIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <rect x="7.6" y="1.5" width="8.8" height="13.6" rx="4.4" fill={MSG_BLUE} />
      <path d="M4.6 11.2a7.4 7.4 0 0 0 14.8 0M12 18.6v3.4" stroke={MSG_BLUE} strokeWidth="2.1" strokeLinecap="round" fill="none" />
    </svg>
  );
}

function SmileyIcon({ size, bg }: { size: number; bg: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <circle cx="12" cy="12" r="10.5" fill={MSG_BLUE} />
      <circle cx="8.6" cy="9.6" r="1.5" fill={bg} />
      <circle cx="15.4" cy="9.6" r="1.5" fill={bg} />
      <path d="M7.4 13.6c1 2 2.7 3.1 4.6 3.1s3.6-1.1 4.6-3.1" stroke={bg} strokeWidth="1.9" strokeLinecap="round" fill="none" />
    </svg>
  );
}

function LikeIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <path fill={MSG_BLUE} d="M2 11.6c0-1 .8-1.8 1.8-1.8h2.6c.6 0 1 .4 1 1v9.7c0 .6-.4 1-1 1H3.8c-1 0-1.8-.8-1.8-1.8v-8.1Z" />
      <path
        fill={MSG_BLUE}
        d="M9 10.3 12.6 3.5c.4-.7 1.1-1.1 1.9-1.1 1.5 0 2.6 1.4 2.2 2.9l-.9 3.4h3.9c1.7 0 2.9 1.6 2.5 3.2l-1.8 7c-.3 1.3-1.5 2.2-2.8 2.2H10c-.6 0-1-.4-1-1V10.3Z"
      />
    </svg>
  );
}

function LockIcon({ color }: { color: string }) {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" aria-hidden className="inline-block align-[-1px]">
      <path
        fill={color}
        d="M12 1.5a5.5 5.5 0 0 0-5.5 5.5v3H6a2.5 2.5 0 0 0-2.5 2.5v8A2.5 2.5 0 0 0 6 23h12a2.5 2.5 0 0 0 2.5-2.5v-8A2.5 2.5 0 0 0 18 10h-.5V7A5.5 5.5 0 0 0 12 1.5Zm3 8.5V7a3 3 0 0 0-6 0v3h6Z"
        fillRule="evenodd"
      />
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

/** Sent = hollow circle + check, Delivered = filled circle + white check. */
function ReceiptIcon({ status, bg }: { status: Exclude<DeliveryStatus, "read">; bg: string }) {
  const filled = status === "delivered";
  return (
    <svg width={M.receipt} height={M.receipt} viewBox="0 0 14 14" aria-hidden className="block">
      <circle cx="7" cy="7" r={filled ? 7 : 6.4} fill={filled ? MSG_BLUE : "none"} stroke={filled ? "none" : MSG_BLUE} strokeWidth="1.2" />
      <path d="M4 7.2 6.1 9.2 10 5" fill="none" stroke={filled ? bg : MSG_BLUE} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ------------------------------ motion ------------------------------ */

const ENTER_MS = 380;

/** Under-damped spring (ζ 0.72, ~4% overshoot) — Messenger's bouncy "pop". */
function spring(p: number): number {
  if (p >= 1) return 1;
  const t = Math.max(0, p);
  const w = 11;
  const z = 0.72;
  const wd = w * Math.sqrt(1 - z * z);
  return 1 - Math.exp(-z * w * t) * (Math.cos(wd * t) + ((z * w) / wd) * Math.sin(wd * t));
}

export const messengerIosMotion: PlatformMotion = {
  enterMs: ENTER_MS,
  enterStyle: (p, mine, rtl) => {
    const e = spring(p);
    const onRight = mine ? !rtl : rtl;
    const origin = `${onRight ? "right" : "left"} bottom`;
    if (mine) {
      return {
        opacity: Math.min(1, p / 0.16),
        transform: `translateY(${((1 - e) * 22).toFixed(2)}px) scale(${(0.82 + 0.18 * e).toFixed(4)})`,
        transformOrigin: origin,
      };
    }
    return {
      opacity: Math.min(1, p / 0.3),
      transform: `translateY(${((1 - e) * 10).toFixed(2)}px) scale(${(0.92 + 0.08 * e).toFixed(4)})`,
      transformOrigin: origin,
    };
  },
};

/** Typing dots: 1.3s wave, each dot 0.17 of a cycle behind the previous one. */
const DOT_MS = 1300;
function dotState(phase: number): { opacity: number; y: number } {
  const t = ((phase % 1) + 1) % 1;
  const k = t < 0.42 ? Math.sin((t / 0.42) * Math.PI) : 0;
  return { opacity: 0.45 + 0.55 * k, y: -3 * k };
}

/** Keyframes generated from the exact functions the exporter calls → preview == export. */
function buildCss(): string {
  const steps = 16;
  let css = "";
  for (const mine of [true, false]) {
    for (const rtl of [false, true]) {
      const name = `msgr-ios-in-${mine ? "me" : "them"}-${rtl ? "rtl" : "ltr"}`;
      let frames = "";
      for (let i = 0; i <= steps; i++) {
        const p = i / steps;
        const st = messengerIosMotion.enterStyle(p, mine, rtl);
        frames += `${(p * 100).toFixed(2)}%{opacity:${st.opacity};transform:${st.transform};transform-origin:${st.transformOrigin}}`;
      }
      css += `@keyframes ${name}{${frames}}.${name}{animation:${name} ${ENTER_MS}ms linear both}`;
    }
  }
  let dot = "";
  for (let i = 0; i <= 20; i++) {
    const d = dotState(i / 20);
    dot += `${i * 5}%{opacity:${d.opacity.toFixed(3)};transform:translateY(${d.y.toFixed(2)}px)}`;
  }
  css += `@keyframes msgr-ios-dot{${dot}}.msgr-ios-dot{animation:msgr-ios-dot ${DOT_MS}ms linear infinite}`;
  css += `@keyframes msgr-ios-fade{from{opacity:0}to{opacity:1}}.msgr-ios-fade{animation:msgr-ios-fade 220ms ease-out both}`;
  css += `@keyframes msgr-ios-typing-in{from{opacity:0;transform:scale(.7)}to{opacity:1;transform:scale(1)}}.msgr-ios-typing-in{animation:msgr-ios-typing-in 240ms cubic-bezier(.2,.9,.3,1.15) both}`;
  return css;
}
const CSS = buildCss();

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

/** Messenger drops a centred timestamp at the top and after ~1h of silence. */
function needsSeparator(messages: Message[], i: number): boolean {
  if (i === 0) return true;
  const a = minutesOf(messages[i - 1].time);
  const b = minutesOf(messages[i].time);
  if (a == null || b == null) return false;
  return b - a >= 60 || b < a;
}

type Corners = Pick<CSSProperties, "borderTopLeftRadius" | "borderTopRightRadius" | "borderBottomLeftRadius" | "borderBottomRightRadius">;

/** Joined-side corners shrink inside a group. */
function cornersFor(onRight: boolean, joinedAbove: boolean, joinedBelow: boolean, r: number, j: number): Corners {
  const top = joinedAbove ? j : r;
  const bottom = joinedBelow ? j : r;
  return onRight
    ? { borderTopLeftRadius: r, borderBottomLeftRadius: r, borderTopRightRadius: top, borderBottomRightRadius: bottom }
    : { borderTopRightRadius: r, borderBottomRightRadius: r, borderTopLeftRadius: top, borderBottomLeftRadius: bottom };
}

const EMOJI_ONLY = /^(?:\p{Extended_Pictographic}|\p{Emoji_Modifier}|\p{Regional_Indicator}|‍|️|⃣|[#*0-9](?=️?⃣)|\s)+$/u;

/** 1–3 emoji with no other text → rendered large with no bubble. */
function jumboEmojiCount(text: string): number {
  const t = text.trim();
  if (!t || !EMOJI_ONLY.test(t) || !/\p{Extended_Pictographic}|\p{Regional_Indicator}/u.test(t)) return 0;
  const compact = t.replace(/\s+/g, "");
  let n: number;
  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    n = [...new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(compact)].length;
  } else {
    n = Array.from(compact.replace(/[‍️]|\p{Emoji_Modifier}/gu, "")).length;
  }
  return n >= 1 && n <= 3 ? n : 0;
}

/* ---------------------------- sub-views ----------------------------- */

const WAVE = [5, 8, 12, 9, 15, 11, 7, 13, 17, 12, 8, 6, 10, 14, 16, 11, 7, 5, 9, 12, 8, 6, 5];

/** Voice clip: play button, waveform, duration chip — all inside the bubble. */
function VoiceClip({ mine, pal, duration }: { mine: boolean; pal: Palette; duration?: string }) {
  const ink = mine ? "#ffffff" : pal.fg;
  const btnBg = mine ? "#ffffff" : pal.fg;
  const btnInk = mine ? MSG_BLUE : pal.inBubble;
  return (
    <div dir="ltr" className="flex items-center" style={{ width: 196, height: M.lh, gap: 8 }}>
      <span className="flex shrink-0 items-center justify-center rounded-full" style={{ width: 24, height: 24, background: btnBg }}>
        <svg width="10" height="12" viewBox="0 0 10 12" aria-hidden style={{ marginInlineStart: 2 }}>
          <path d="M1 1.4v9.2c0 .7.8 1.2 1.4.8l7-4.6c.6-.4.6-1.2 0-1.6l-7-4.6C1.8.2 1 .7 1 1.4Z" fill={btnInk} />
        </svg>
      </span>
      <div className="flex min-w-0 flex-1 items-center justify-between" style={{ height: 18 }}>
        {WAVE.map((b, i) => (
          <span key={i} style={{ width: 2.5, height: b, borderRadius: 2, background: ink, opacity: mine ? 1 : 0.85 }} />
        ))}
      </div>
      <span
        className="flex shrink-0 items-center rounded-full tabular-nums"
        style={{ height: 20, padding: "0 7px", fontSize: 13, fontWeight: 600, background: btnBg, color: btnInk }}
      >
        {duration || "0:08"}
      </span>
    </div>
  );
}

function Typing({ person, pal, clockMs, rtl }: { person: Person; pal: Palette; clockMs?: number; rtl: boolean }) {
  const exporting = clockMs !== undefined;
  return (
    <div className={`flex items-end ${exporting ? "" : "msgr-ios-fade"}`} style={{ marginTop: M.senderGap, gap: M.avatarGap }}>
      <Avatar person={person} size={M.inAvatar} />
      <div
        className={`flex items-center justify-center ${exporting ? "" : "msgr-ios-typing-in"}`}
        style={{
          background: pal.inBubble,
          borderRadius: M.radius,
          height: M.lh + M.padY * 2,
          width: 60,
          gap: 4,
          transformOrigin: rtl ? "right bottom" : "left bottom",
        }}
      >
        {[0, 1, 2].map((i) => {
          const d = exporting ? dotState(clockMs / DOT_MS - i * 0.17) : null;
          return (
            <span
              key={i}
              className={`block rounded-full ${exporting ? "" : "msgr-ios-dot"}`}
              style={{
                width: 7,
                height: 7,
                background: pal.dots,
                ...(d ? { opacity: d.opacity, transform: `translateY(${d.y}px)` } : { animationDelay: `${i * 0.17 * DOT_MS}ms` }),
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------ thread ------------------------------ */

export function Messenger({ scenario, playback, lang, rtl }: PlatformProps) {
  const dark = scenario.theme === "dark";
  const pal = palette(dark);
  const s = STR[lang];
  const { messages, typing, clockMs } = playback;
  const live = playback.isLive;
  const exporting = clockMs !== undefined;
  const showTyping = typing || (!live && !exporting && scenario.presence === "typing");
  const scrollRef = useChatScroll<HTMLDivElement>(`${messages.length}-${showTyping}`);

  const active = scenario.presence !== "lastseen";
  const subtitle = active ? s.activeNow : scenario.lastSeenText;

  /* Receipts: one Sent/Delivered icon on the newest outgoing message (when it
     is not yet seen) + the friend's seen-head at the last message they have
     seen, unless they have replied since (their reply implies "seen"). */
  let lastMine = -1;
  let lastRead = -1;
  let lastTheirs = -1;
  messages.forEach((m, i) => {
    if (m.sender === "me") {
      lastMine = i;
      if (playback.statusOf(m) === "read") lastRead = i;
    } else lastTheirs = i;
  });
  const lastMineStatus = lastMine >= 0 ? playback.statusOf(messages[lastMine]) : null;
  const seenAt = lastRead > lastTheirs ? lastRead : -1;
  const dirKey = rtl ? "rtl" : "ltr";

  return (
    <div className="flex h-full w-full flex-col" style={{ background: pal.bg, color: pal.fg }}>
      <style>{CSS}</style>
      <StatusBar device={scenario.device} tint={dark ? "light" : "dark"} background={pal.bg} />

      {/* Header */}
      <div
        className="flex shrink-0 items-center"
        style={{ height: M.headerH, paddingInlineStart: 10, paddingInlineEnd: 16, borderBottom: `0.5px solid ${pal.hairline}` }}
      >
        <span className="flex shrink-0 items-center justify-center" style={{ width: 24, height: 44 }}>
          <Chevron />
        </span>
        <div className="relative shrink-0" style={{ width: M.headerAvatar, height: M.headerAvatar, marginInlineStart: 8 }}>
          <Avatar person={scenario.them} size={M.headerAvatar} />
          {active && (
            <span
              className="absolute rounded-full"
              style={{
                width: M.activeDot,
                height: M.activeDot,
                bottom: -2.5,
                insetInlineEnd: -2.5,
                background: MSG_GREEN,
                border: `2.5px solid ${pal.bg}`,
                boxSizing: "content-box",
              }}
            />
          )}
        </div>
        <div className="min-w-0 flex-1" style={{ marginInlineStart: 10 }}>
          <div
            className="truncate"
            dir="auto"
            style={{ fontSize: M.nameSize, lineHeight: "21px", fontWeight: 600, letterSpacing: -0.3, textAlign: "start" }}
          >
            {scenario.them.name}
          </div>
          <div className="truncate" style={{ fontSize: M.subSize, lineHeight: "16px", color: pal.sub, textAlign: "start" }}>
            {subtitle}
          </div>
        </div>
        {/* call + video glyphs are not mirrored in the Arabic build */}
        <div className="flex shrink-0 items-center" style={{ gap: 20 }}>
          <PhoneIcon size={M.callIcon} />
          <VideoIcon size={M.callIcon + 2} />
        </div>
      </div>

      {/* Thread */}
      <div
        ref={scrollRef}
        className="rcss-scroll relative min-h-0 flex-1 overflow-y-auto"
        style={{ paddingInlineStart: M.bodyPadStart, paddingInlineEnd: M.bodyPadEnd, paddingBottom: 8 }}
      >
        {/* Profile intro + default-E2EE notice that open every 1:1 thread */}
        <div className="flex flex-col items-center text-center" style={{ paddingTop: 28, paddingBottom: 26, paddingInline: 24 }}>
          <Avatar person={scenario.them} size={80} />
          <div className="max-w-full truncate" dir="auto" style={{ marginTop: 10, fontSize: 20, lineHeight: "25px", fontWeight: 700, letterSpacing: -0.3 }}>
            {scenario.them.name}
          </div>
          <div style={{ marginTop: 2, fontSize: 14, lineHeight: "18px", color: pal.sub }}>{s.friends}</div>
          <div
            className="flex items-center justify-center"
            style={{ marginTop: 12, height: 32, padding: "0 14px", borderRadius: 8, background: pal.button, fontSize: 14, fontWeight: 600 }}
          >
            {s.viewProfile}
          </div>
          <div style={{ marginTop: 22, fontSize: 12, lineHeight: "16px", color: pal.sub, maxWidth: 300 }}>
            <LockIcon color={pal.sub} /> {s.e2ee} <span style={{ fontWeight: 600, color: pal.fg }}>{s.learnMore}</span>
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
            const jumbo = m.type === "text" ? jumboEmojiCount(m.text) : 0;
            const segs: ("image" | "text" | "voice" | "emoji")[] = hasImage
              ? caption
                ? ["image", "text"]
                : ["image"]
              : m.type === "voice"
                ? ["voice"]
                : jumbo
                  ? ["emoji"]
                  : ["text"];

            const enter = live ? `msgr-ios-in-${mine ? "me" : "them"}-${dirKey}` : "";
            const receipt =
              i === seenAt ? "seen" : i === lastMine && lastMineStatus && lastMineStatus !== "read" ? lastMineStatus : null;

            return (
              <Fragment key={m.id}>
                {sep && (
                  <div
                    className={`flex justify-center ${live ? "msgr-ios-fade" : ""}`}
                    style={{ margin: i === 0 ? "0 0 12px" : "18px 0 12px" }}
                  >
                    <span dir="ltr" style={{ fontSize: 12, lineHeight: "16px", fontWeight: 600, color: pal.sub }}>
                      {m.time}
                    </span>
                  </div>
                )}
                <div
                  data-mid={m.id}
                  data-sender={m.sender}
                  className={`flex items-end ${mine ? "justify-end" : "justify-start"} ${enter}`}
                  style={{ marginTop: firstOfGroup ? (sep ? 0 : M.senderGap) : M.groupGap }}
                >
                  {!mine && (
                    <div className="shrink-0" style={{ width: M.inAvatar, marginInlineEnd: M.avatarGap }}>
                      {lastOfGroup && <Avatar person={scenario.them} size={M.inAvatar} />}
                    </div>
                  )}
                  <div className={`flex min-w-0 flex-col ${mine ? "items-end" : "items-start"}`} style={{ maxWidth: M.maxW, gap: M.groupGap }}>
                    {segs.map((seg, k) => {
                      const joinedAbove = k > 0 || !firstOfGroup;
                      const joinedBelow = k < segs.length - 1 || !lastOfGroup;
                      if (seg === "emoji") {
                        return (
                          <div key={seg} dir="ltr" style={{ fontSize: jumbo === 1 ? 44 : 36, lineHeight: jumbo === 1 ? "52px" : "44px", padding: "0 2px" }}>
                            {m.text.trim()}
                          </div>
                        );
                      }
                      if (seg === "image") {
                        const corners = cornersFor(onRight, joinedAbove, joinedBelow, M.radius, M.joined);
                        return (
                          <div key={seg} className="overflow-hidden" style={{ ...corners, width: M.imgW, background: pal.imgPlaceholder }}>
                            {m.imageSrc ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={m.imageSrc} alt="" draggable={false} className="block w-full object-cover" style={{ maxHeight: 300 }} />
                            ) : (
                              <div className="flex items-center justify-center" style={{ height: 290 }}>
                                <ImageGlyph color={pal.sub} />
                              </div>
                            )}
                          </div>
                        );
                      }
                      const corners = cornersFor(onRight, joinedAbove, joinedBelow, M.radius, M.joined);
                      const text = hasImage ? caption : m.text;
                      return (
                        <div
                          key={seg}
                          style={{
                            ...corners,
                            background: mine ? MSG_BLUE : pal.inBubble,
                            color: mine ? "#ffffff" : pal.fg,
                            padding: seg === "voice" ? `${M.padY}px 8px` : `${M.padY}px ${M.padX}px`,
                          }}
                        >
                          {seg === "voice" ? (
                            <VoiceClip mine={mine} pal={pal} duration={m.voiceDuration} />
                          ) : (
                            <div
                              dir={dirOf(text)}
                              className="whitespace-pre-wrap break-words"
                              style={{ fontSize: M.text, lineHeight: `${M.lh}px`, letterSpacing: -0.2, textAlign: "start" }}
                            >
                              {text}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {/* trailing receipt column (outgoing rows only) */}
                  {mine && (
                    <div className="flex shrink-0 justify-center" style={{ width: M.receiptCol, marginInlineStart: M.receiptGap }}>
                      {receipt === "seen" ? (
                        <span key="seen" className={live ? "msgr-ios-fade" : ""}>
                          <Avatar person={scenario.them} size={M.receipt} />
                        </span>
                      ) : receipt ? (
                        <span key={receipt} className={live ? "msgr-ios-fade" : ""}>
                          <ReceiptIcon status={receipt} bg={pal.bg} />
                        </span>
                      ) : null}
                    </div>
                  )}
                </div>
              </Fragment>
            );
          })}

          {showTyping && <Typing person={scenario.them} pal={pal} clockMs={clockMs} rtl={rtl} />}
        </div>
      </div>

      {/* Composer */}
      <div className="flex shrink-0 items-center" style={{ padding: "8px 12px 8px", gap: 14 }}>
        <PlusIcon size={M.composerIcon} bg={pal.bg} />
        <CameraIcon size={M.composerIcon} />
        <GalleryIcon size={M.composerIcon} />
        <MicIcon size={M.composerIcon} />
        <div
          className="flex min-w-0 flex-1 items-center"
          style={{ height: M.fieldH, borderRadius: M.fieldH / 2, background: pal.field, paddingInlineStart: 12, paddingInlineEnd: 7, marginInlineStart: 2 }}
        >
          <span className="min-w-0 flex-1 truncate" style={{ fontSize: 17, color: pal.sub, textAlign: "start" }}>
            {s.message}
          </span>
          <SmileyIcon size={22} bg={pal.field} />
        </div>
        <LikeIcon size={26} />
      </div>

      <SystemBottomBar device={scenario.device} bg={pal.bg} fg={dark ? "#ffffff" : "#000000"} />
    </div>
  );
}
