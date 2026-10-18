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
 *  - Groups: default group picture = two member heads stacked diagonally
 *    (front head bottom-leading with a canvas ring), group name + "Active
 *    now"; 12pt grey first name above each run from another member, that
 *    member's 28pt head beside the run's last bubble, and a row of 14pt
 *    seen-heads under the newest message the members have seen.
 *  - New kinds: stickers 120pt with no bubble; link previews as a grey "XMA"
 *    card (image 1.91:1, semibold title, domain) joined under the text bubble,
 *    URL underlined in the bubble; location = grey map card + title/address
 *    ("Live location" with the sharer's head on the map); file = bubble in
 *    the sender's colour with a round doc chip + "2 pages · 245 KB · PDF";
 *    call = grey card with round glyph (red when missed), "Missed audio call"
 *    / "Video chat" + time or duration, and a "Call back" / "Call again"
 *    button; unsent = outlined empty bubble "You unsent a message" /
 *    "Khalid unsent a message" (AR «قمت بإلغاء إرسال رسالة» / «ألغى خالد
 *    إرسال رسالة»); "Edited" («تم التعديل») 12pt grey above the bubble.
 *  - Keyboard: the whole screen pads its bottom by the keyboard inset (home
 *    indicator hidden by SystemBottomBar), and the thread keeps its bottom
 *    edge anchored while it shrinks.
 */

import { Fragment, useEffect, type CSSProperties, type ReactNode, type RefObject } from "react";

import type { CallEntry, DeliveryStatus, FileShare, GroupChat, LinkPreview, LocationShare, Message, Person } from "../../types";
import { Avatar, dirOf, SystemBottomBar, useChatScroll } from "../shared";
import { useKeyboardInset } from "../devices/keyboard-context";
import { StatusBar } from "../devices/StatusBar";
import type { Lang } from "./chrome";
import type { PlatformMotion, PlatformProps } from "./types";

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
  /** reaction pill fill + its outer shadow */
  reactBg: string;
  reactShadow: string;
  /** washed quoted-reply bubble: fill + text */
  quoteBg: string;
  quoteFg: string;
  /** call card: glyph chip + "Call back" button fills */
  callChip: string;
  callButton: string;
  /** outline of the "You unsent a message" bubble */
  unsentBorder: string;
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
        reactBg: "#3a3b3c",
        reactShadow: "0 1px 3px rgba(0,0,0,0.5)",
        quoteBg: "#1c1c1c",
        quoteFg: "#9a9ca0",
        callChip: "#4a4a4a",
        callButton: "#424242",
        unsentBorder: "#3e4042",
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
        reactBg: "#ffffff",
        reactShadow: "0 0 0 0.5px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.16)",
        quoteBg: "#f6f6f6",
        quoteFg: "#7d7f83",
        callChip: "#dcdee3",
        callButton: "#e2e4e8",
        unsentBorder: "#ced0d4",
      };
}

interface Strings {
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
  /** group: "Khalid replied to Sara" */
  replied: (a: string, b: string) => string;
  voiceMessage: string;
  edited: string;
  youUnsent: string;
  unsent: (name: string) => string;
  missedAudio: string;
  missedVideo: string;
  audioCall: string;
  videoChat: string;
  noAnswer: string;
  callBack: string;
  callAgain: string;
  liveLocation: string;
  location: string;
  attachment: string;
  sticker: string;
  /** group intro line under the name */
  memberList: (names: string[]) => string;
}

/** Exact Messenger strings (English and Arabic builds). */
const STR: Record<Lang, Strings> = {
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
    replied: (a, b) => `${a} replied to ${b}`,
    voiceMessage: "Voice message",
    edited: "Edited",
    youUnsent: "You unsent a message",
    unsent: (n) => `${n} unsent a message`,
    missedAudio: "Missed audio call",
    missedVideo: "Missed video chat",
    audioCall: "Audio call",
    videoChat: "Video chat",
    noAnswer: "No answer",
    callBack: "Call back",
    callAgain: "Call again",
    liveLocation: "Live location",
    location: "Location",
    attachment: "Attachment",
    sticker: "Sticker",
    memberList: (names) => `${names.join(", ")} and you`,
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
    replied: (a, b) => `قام ${a} بالرد على ${b}`,
    voiceMessage: "رسالة صوتية",
    edited: "تم التعديل",
    youUnsent: "قمت بإلغاء إرسال رسالة",
    unsent: (n) => `ألغى ${n} إرسال رسالة`,
    missedAudio: "مكالمة صوتية فائتة",
    missedVideo: "دردشة فيديو فائتة",
    audioCall: "مكالمة صوتية",
    videoChat: "دردشة فيديو",
    noAnswer: "لم يتم الرد",
    callBack: "معاودة الاتصال",
    callAgain: "الاتصال مرة أخرى",
    liveLocation: "الموقع المباشر",
    location: "الموقع",
    attachment: "مرفق",
    sticker: "ملصق",
    memberList: (names) => `${names.join("، ")} وأنت`,
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

/** Composer ">" expander that replaces the four leading glyphs while typing. */
function ExpandIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden className="rtl:-scale-x-100">
      <path d="m9 5 7 7-7 7" stroke={MSG_BLUE} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Messenger's filled paper-plane send glyph (replaces the 👍 while typing). */
function SendIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden className="rtl:-scale-x-100">
      <path
        fill={MSG_BLUE}
        d="M3.4 2.6 21.6 10.6c1.2.5 1.2 2.3 0 2.8L3.4 21.4c-1.2.5-2.4-.7-1.9-1.9L5.2 13l8.3-1-8.3-1-3.7-6.5c-.5-1.2.7-2.4 1.9-1.9Z"
      />
    </svg>
  );
}

/** Small curved reply arrow that leads the "You replied to …" label. */
function ReplyArrow({ color }: { color: string }) {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" aria-hidden className="shrink-0 rtl:-scale-x-100">
      <path
        fill={color}
        d="M9.6 4.2c.7-.6 1.8-.1 1.8.8v3.3c6.2.4 10.1 4.5 10.6 11.2.1.7-.8 1-1.2.4-2-3-4.8-4.5-9.4-4.6v3.4c0 .9-1.1 1.4-1.8.8L2.4 12.8a1 1 0 0 1 0-1.6l7.2-7Z"
      />
    </svg>
  );
}

function MicGlyph({ color }: { color: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden className="inline-block shrink-0" style={{ verticalAlign: "-2px" }}>
      <rect x="7.6" y="1.5" width="8.8" height="13.6" rx="4.4" fill={color} />
      <path d="M4.6 11.2a7.4 7.4 0 0 0 14.8 0M12 18.6v3.4" stroke={color} strokeWidth="2.4" strokeLinecap="round" fill="none" />
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
  css += `@keyframes msgr-ios-caret{0%,50%{opacity:1}50.01%,100%{opacity:0}}.msgr-ios-caret{animation:msgr-ios-caret ${CARET_MS}ms linear infinite}`;  return css;
}

/** iOS text caret: 1.06s cycle, visible for the first half. */
const CARET_MS = 1060;
function caretOn(clockMs: number | undefined): boolean | null {
  if (clockMs === undefined) return null;
  return clockMs % CARET_MS < CARET_MS / 2;
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

/* Reaction pill geometry (pt). */
const REACT = { h: 22, ring: 2, emoji: 13, overlap: 6, inset: 4, extra: 16 } as const;

/** Reaction pill hanging off the bubble's bottom corner (inner side). */
function ReactionBadge({ emoji, pal, onRight }: { emoji: string; pal: Palette; onRight: boolean }) {
  return (
    <span
      dir="ltr"
      className="absolute z-[2] flex items-center justify-center rounded-full"
      style={{
        bottom: -(REACT.h - REACT.overlap),
        ...(onRight ? { left: REACT.inset } : { right: REACT.inset }),
        height: REACT.h,
        minWidth: REACT.h,
        padding: "0 1px",
        background: pal.reactBg,
        border: `${REACT.ring}px solid ${pal.bg}`,
        boxShadow: pal.reactShadow,
        boxSizing: "border-box",
        fontSize: REACT.emoji,
        lineHeight: "16px",
      }}
    >
      {emoji}
    </span>
  );
}

/** Wraps the last segment of a message so the reaction can anchor to it. */
function withReaction(node: ReactNode, key: string, emoji: string | null | undefined, pal: Palette, onRight: boolean) {
  if (!emoji) return node;
  return (
    <div key={key} className="relative">
      {node}
      <ReactionBadge emoji={emoji} pal={pal} onRight={onRight} />
    </div>
  );
}

const QUOTE_TUCK = 14;

/** "You replied to Khalid" + the washed quoted bubble tucked behind the reply. */
function QuoteBlock({
  target,
  mine,
  label,
  pal,
  voiceLabel,
  summary,
}: {
  target: Message;
  mine: boolean;
  label: string;
  pal: Palette;
  voiceLabel: string;
  /** stand-in text for kinds without a body (location, file, call, …) */
  summary?: string | null;
}) {
  const isImage = target.type === "image";
  const isVoice = target.type === "voice";
  const text = summary ?? target.text.trim();
  return (
    <div className={`flex flex-col ${mine ? "items-end" : "items-start"}`} style={{ maxWidth: M.maxW }}>
      <div
        className="flex items-center"
        style={{ gap: 4, paddingInline: 12, marginBottom: 4, fontSize: 12, lineHeight: "16px", color: pal.sub }}
      >
        <ReplyArrow color={pal.sub} />
        <span className="truncate" dir="auto">
          {label}
        </span>
      </div>
      {isImage ? (
        <div
          className="overflow-hidden"
          style={{ width: 120, height: 150 + QUOTE_TUCK, borderRadius: M.radius, marginBottom: -QUOTE_TUCK, background: pal.imgPlaceholder, opacity: 0.55 }}
        >
          {target.imageSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={target.imageSrc} alt="" draggable={false} className="block h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center">
              <ImageGlyph color={pal.sub} />
            </div>
          )}
        </div>
      ) : (
        <div
          style={{
            borderRadius: M.radius,
            background: pal.quoteBg,
            color: pal.quoteFg,
            padding: `8px 12px ${8 + QUOTE_TUCK}px`,
            marginBottom: -QUOTE_TUCK,
            maxWidth: "100%",
          }}
        >
          <div
            dir={isVoice ? undefined : dirOf(text)}
            className="line-clamp-3 break-words whitespace-pre-wrap"
            style={{ fontSize: 15, lineHeight: "20px", letterSpacing: -0.2, textAlign: "start" }}
          >
            {isVoice ? (
              <>
                <MicGlyph color={pal.quoteFg} /> {voiceLabel}
              </>
            ) : (
              text
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/** Text caret: theme-blue 2pt bar, blinking (clock-driven during export). */
function Caret({ clockMs }: { clockMs?: number }) {
  const on = caretOn(clockMs);
  return (
    <span
      className={`inline-block rounded-full ${on === null ? "msgr-ios-caret" : ""}`}
      style={{ width: 2, height: 21, marginInline: 1, verticalAlign: "-5px", background: MSG_BLUE, opacity: on === false ? 0 : 1 }}
    />
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

/* ------------------------- round-5 sub-views ------------------------ */

/** Messenger's default group picture: two member heads stacked diagonally. */
function GroupAvatar({ group, size, ring }: { group: GroupChat; size: number; ring: string }) {
  if (group.avatar || group.members.length === 0) {
    return <Avatar person={{ name: group.name, avatar: group.avatar }} size={size} />;
  }
  const front = group.members[0];
  const back = group.members[1] ?? group.members[0];
  const inner = Math.round(size * 0.68);
  const ringW = Math.max(1.5, Math.round(size * 0.05 * 2) / 2);
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <div className="absolute" style={{ top: 0, insetInlineEnd: 0 }}>
        <Avatar person={back} size={inner} />
      </div>
      <div className="absolute rounded-full" style={{ bottom: -ringW, insetInlineStart: -ringW, padding: ringW, background: ring }}>
        <Avatar person={front} size={inner} />
      </div>
    </div>
  );
}

/** Underlines URLs inside a bubble's text the way Messenger does. */
function Linkified({ text }: { text: string }) {
  const parts = text.split(/(https?:\/\/[^\s]+)/g);
  return (
    <>
      {parts.map((p, i) =>
        i % 2 ? (
          <span key={i} style={{ textDecoration: "underline", textUnderlineOffset: 2 }}>
            {p}
          </span>
        ) : (
          p
        ),
      )}
    </>
  );
}

function siteOf(link: LinkPreview): string {
  if (link.siteName?.trim()) return link.siteName.trim();
  try {
    return new URL(link.url).hostname.replace(/^www\./, "");
  } catch {
    return link.url;
  }
}

/** Link preview (Messenger "XMA" card): grey wash on both sides, image + title + domain. */
function LinkCard({ link, pal, corners }: { link: LinkPreview; pal: Palette; corners: Corners }) {
  return (
    <div className="overflow-hidden" style={{ ...corners, width: M.maxW, background: pal.inBubble }}>
      <div className="flex items-center justify-center" style={{ height: 135, background: pal.imgPlaceholder }}>
        {link.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={link.image} alt="" draggable={false} className="block h-full w-full object-cover" />
        ) : (
          <ImageGlyph color={pal.sub} />
        )}
      </div>
      <div style={{ padding: "8px 12px 10px" }}>
        <div
          dir={dirOf(link.title)}
          className="line-clamp-2 break-words"
          style={{ fontSize: 15, lineHeight: "20px", fontWeight: 600, letterSpacing: -0.2, color: pal.fg, textAlign: "start" }}
        >
          {link.title}
        </div>
        <div dir="ltr" className="truncate" style={{ marginTop: 1, fontSize: 13, lineHeight: "17px", color: pal.sub, textAlign: "start" }}>
          {siteOf(link)}
        </div>
      </div>
    </div>
  );
}

/** Plausible street-map tile (Meta maps palette) drawn as inline SVG. */
function MapArt({ dark, height }: { dark: boolean; height: number }) {
  const c = dark
    ? { land: "#1f2124", block: "#26282c", park: "#1c3324", water: "#14263b", road: "#3a3d42", edge: "#2c2e32", major: "#5b5241", label: "#6b6f75" }
    : { land: "#f3f1ec", block: "#e9e6df", park: "#cfe7c3", water: "#aad3f2", road: "#ffffff", edge: "#dcd8cf", major: "#fbe3a1", label: "#9a9a9a" };
  return (
    <svg width="100%" height={height} viewBox="0 0 240 136" preserveAspectRatio="xMidYMid slice" aria-hidden className="block">
      <rect width="240" height="136" fill={c.land} />
      <path d="M0 112c34-9 66 8 108 2s82-18 132-8v30H0Z" fill={c.water} />
      <rect x="156" y="10" width="62" height="40" rx="6" fill={c.park} />
      <rect x="14" y="10" width="36" height="22" rx="3" fill={c.block} />
      <rect x="72" y="10" width="54" height="22" rx="3" fill={c.block} />
      <rect x="14" y="52" width="36" height="34" rx="3" fill={c.block} />
      <rect x="72" y="52" width="54" height="16" rx="3" fill={c.block} />
      <rect x="160" y="70" width="58" height="24" rx="3" fill={c.block} />
      <g fill="none" strokeLinecap="round">
        <path d="M-4 42h248M61-4v124M139-4v124M200 54v52" stroke={c.edge} strokeWidth="8" />
        <path d="M-4 42h248M61-4v124M139-4v124M200 54v52" stroke={c.road} strokeWidth="6" />
        <path d="M-6 96 246 58" stroke={c.edge} strokeWidth="12" />
        <path d="M-6 96 246 58" stroke={c.major} strokeWidth="9" />
      </g>
    </svg>
  );
}

/** Red map pin (static share). */
function MapPin() {
  return (
    <svg width="30" height="38" viewBox="0 0 30 38" aria-hidden className="block">
      <path d="M15 1C7.3 1 1 7.1 1 14.7 1 25 15 37 15 37s14-12 14-22.3C29 7.1 22.7 1 15 1Z" fill="#f02849" stroke="#ffffff" strokeWidth="1.6" />
      <circle cx="15" cy="14.5" r="5" fill="#ffffff" />
    </svg>
  );
}

function LocationCard({
  loc,
  person,
  pal,
  dark,
  corners,
  liveLabel,
}: {
  loc: LocationShare;
  person: Person;
  pal: Palette;
  dark: boolean;
  corners: Corners;
  liveLabel: string;
}) {
  const title = loc.live ? liveLabel : loc.title;
  const subtitle = loc.live ? loc.title : loc.subtitle;
  return (
    <div className="overflow-hidden" style={{ ...corners, width: 240, background: pal.inBubble }}>
      <div className="relative">
        <MapArt dark={dark} height={136} />
        <div className="absolute inset-0 flex items-center justify-center">
          {loc.live ? (
            <span className="relative flex items-center justify-center rounded-full" style={{ width: 56, height: 56, background: "rgba(10,124,255,0.18)" }}>
              <span className="rounded-full" style={{ padding: 3, background: MSG_BLUE }}>
                <span className="block rounded-full" style={{ padding: 2, background: "#ffffff" }}>
                  <Avatar person={person} size={28} />
                </span>
              </span>
            </span>
          ) : (
            <span style={{ marginTop: -30 }}>
              <MapPin />
            </span>
          )}
        </div>
      </div>
      <div style={{ padding: "8px 12px 10px" }}>
        <div dir={dirOf(title)} className="truncate" style={{ fontSize: 15, lineHeight: "20px", fontWeight: 600, letterSpacing: -0.2, color: pal.fg, textAlign: "start" }}>
          {title}
        </div>
        {subtitle && (
          <div dir={dirOf(subtitle)} className="truncate" style={{ marginTop: 1, fontSize: 13, lineHeight: "17px", color: pal.sub, textAlign: "start" }}>
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );
}

const FILE_TINT: Record<string, string> = {
  pdf: "#e5252a",
  doc: "#2b579a",
  docx: "#2b579a",
  xls: "#217346",
  xlsx: "#217346",
  csv: "#217346",
  ppt: "#d24726",
  pptx: "#d24726",
  zip: "#8a6d3b",
};

function extOf(name: string): string {
  const mt = /\.([a-z0-9]{1,5})$/i.exec(name.trim());
  return mt ? mt[1].toLowerCase() : "";
}

/** Document glyph: white page, folded corner, coloured file-type band. */
function DocGlyph({ ext }: { ext: string }) {
  const tint = FILE_TINT[ext] ?? "#65676b";
  const label = (ext || "file").slice(0, 4).toUpperCase();
  return (
    <svg width="22" height="28" viewBox="0 0 22 28" aria-hidden className="block">
      <path d="M3 0h11l8 8v17a3 3 0 0 1-3 3H3a3 3 0 0 1-3-3V3a3 3 0 0 1 3-3Z" fill="#ffffff" />
      <path d="M14 0v5a3 3 0 0 0 3 3h5Z" fill="#d7d9dd" />
      <rect x="0" y="14" width="18" height="9" rx="1.5" fill={tint} />
      <text x="9" y="21" textAnchor="middle" fontSize="6.4" fontWeight="700" fill="#ffffff" fontFamily="-apple-system, system-ui, sans-serif">
        {label}
      </text>
    </svg>
  );
}

/** File attachment: a bubble in the sender's colour with a round doc chip, name and meta. */
function FileBubble({ file, mine, pal, corners }: { file: FileShare; mine: boolean; pal: Palette; corners: Corners }) {
  const ext = extOf(file.name);
  // each part isolated so "245 KB" / "PDF" keep their order inside the Arabic UI
  const parts = [file.pages, file.size, ext ? ext.toUpperCase() : ""].filter((p): p is string => !!p);
  return (
    <div
      className="flex items-center"
      style={{ ...corners, background: mine ? MSG_BLUE : pal.inBubble, color: mine ? "#ffffff" : pal.fg, padding: "8px 14px 8px 8px", gap: 10, maxWidth: M.maxW }}
    >
      <span
        className="flex shrink-0 items-center justify-center rounded-full"
        style={{ width: 40, height: 40, background: mine ? "rgba(255,255,255,0.22)" : pal.button }}
      >
        <DocGlyph ext={ext} />
      </span>
      <div className="min-w-0">
        <div className="truncate" style={{ fontSize: 15, lineHeight: "20px", fontWeight: 600, letterSpacing: -0.2, textAlign: "start" }}>
          <bdi>{file.name}</bdi>
        </div>
        {parts.length > 0 && (
          <div className="truncate" style={{ fontSize: 13, lineHeight: "17px", opacity: mine ? 0.85 : 1, color: mine ? undefined : pal.sub, textAlign: "start" }}>
            {parts.map((p, k) => (
              <Fragment key={k}>
                {k > 0 && " · "}
                <bdi>{p}</bdi>
              </Fragment>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CallGlyph({ video, color, size }: { video: boolean; color: string; size: number }) {
  return video ? (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <rect x="1.5" y="5.5" width="14.5" height="13" rx="3.6" fill={color} />
      <path fill={color} d="M17.2 10.1 21 7.3c.7-.5 1.6 0 1.6.8v7.8c0 .8-.9 1.3-1.6.8l-3.8-2.8Z" />
    </svg>
  ) : (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <path
        fill={color}
        d="M7.1 2.6c.6-.2 1.3 0 1.7.6l1.9 2.9c.4.6.3 1.4-.2 1.9L9.2 9.3c-.3.3-.3.7-.2 1 .9 1.8 2.4 3.5 4.3 4.6.4.2.8.2 1.1-.1l1.3-1.3c.5-.5 1.3-.6 1.9-.2l2.9 1.8c.6.4.9 1.1.7 1.8-.6 2.2-2.4 3.9-4.7 3.8C10 20.5 3.5 14.2 3.3 7.6c-.1-2.3 1.6-4.3 3.8-5Z"
      />
    </svg>
  );
}

const MISSED_RED = "#f02849";

/** Call entry: grey card, round call glyph, title + detail, full-width action button. */
function CallCard({
  call,
  mine,
  time,
  pal,
  s,
}: {
  call: CallEntry;
  mine: boolean;
  time: string;
  pal: Palette;
  s: Strings;
}) {
  const missedIn = call.missed && !mine;
  const title = missedIn ? (call.video ? s.missedVideo : s.missedAudio) : call.video ? s.videoChat : s.audioCall;
  const detail = call.missed ? (mine ? s.noAnswer : time) : call.duration || time;
  return (
    <div style={{ borderRadius: M.radius, background: pal.inBubble, color: pal.fg, padding: "10px 10px 10px", width: 228 }}>
      <div className="flex items-center" style={{ gap: 10, paddingInline: 2 }}>
        <span
          className="flex shrink-0 items-center justify-center rounded-full"
          style={{ width: 36, height: 36, background: missedIn ? MISSED_RED : pal.callChip }}
        >
          <CallGlyph video={call.video} color={missedIn ? "#ffffff" : pal.fg} size={18} />
        </span>
        <div className="min-w-0">
          <div className="truncate" style={{ fontSize: 15, lineHeight: "20px", fontWeight: 600, letterSpacing: -0.2, textAlign: "start" }}>
            {title}
          </div>
          <div dir="auto" className="truncate tabular-nums" style={{ fontSize: 13, lineHeight: "17px", color: pal.sub, textAlign: "start" }}>
            {detail}
          </div>
        </div>
      </div>
      <div
        className="flex items-center justify-center"
        style={{ marginTop: 10, height: 34, borderRadius: 10, background: pal.callButton, fontSize: 15, fontWeight: 600, letterSpacing: -0.2 }}
      >
        {call.missed && !mine ? s.callBack : s.callAgain}
      </div>
    </div>
  );
}

/** "You unsent a message": outlined, unfilled bubble with secondary text. */
function UnsentBubble({ label, pal, corners }: { label: string; pal: Palette; corners: Corners }) {
  return (
    <div style={{ ...corners, border: `1px solid ${pal.unsentBorder}`, padding: `${M.padY - 1}px ${M.padX - 1}px`, color: pal.sub }}>
      <div dir="auto" style={{ fontSize: 15, lineHeight: `${M.lh}px`, letterSpacing: -0.2, textAlign: "start" }}>
        {label}
      </div>
    </div>
  );
}

/** Sticker: no bubble — the image, or the emoji drawn large. */
function Sticker({ m }: { m: Message }) {
  if (m.imageSrc) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={m.imageSrc} alt="" draggable={false} className="block object-contain" style={{ width: 120, height: 120 }} />
    );
  }
  const emoji = m.text.trim() || "🙂";
  const n = jumboEmojiCount(emoji) || 1;
  return (
    <div dir="ltr" className="flex items-center justify-center" style={{ height: 120, minWidth: 120, fontSize: n === 1 ? 96 : n === 2 ? 64 : 48, lineHeight: "120px" }}>
      {emoji}
    </div>
  );
}

/** Small grey line above a bubble ("Khalid", "Edited"). */
function AboveLabel({ children, pal }: { children: ReactNode; pal: Palette }) {
  return (
    <div className="max-w-full truncate" dir="auto" style={{ paddingInline: 12, marginBottom: 3, fontSize: 12, lineHeight: "16px", color: pal.sub, textAlign: "start" }}>
      {children}
    </div>
  );
}

/**
 * Keeps the newest message in view when the thread shrinks (keyboard rising):
 * the scroll position follows the bottom edge like a native list. Off during
 * video export, where the exporter owns `.rcss-scroll`.
 */
function useBottomAnchor(ref: RefObject<HTMLDivElement | null>, enabled: boolean) {
  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled || typeof ResizeObserver === "undefined") return;
    let prevH = el.clientHeight;
    const ro = new ResizeObserver(() => {
      const h = el.clientHeight;
      if (h < prevH) el.scrollTop += prevH - h;
      prevH = h;
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref, enabled]);
}

/* ------------------------------ thread ------------------------------ */

type Kind = "text" | "emoji" | "voice" | "image" | "sticker" | "location" | "file" | "call" | "deleted";

function kindOf(m: Message): Kind {
  switch (m.type) {
    case "voice":
    case "image":
    case "sticker":
    case "location":
    case "file":
    case "call":
    case "deleted":
      return m.type;
    default:
      return jumboEmojiCount(m.text) ? "emoji" : "text";
  }
}

/** Kinds whose corners merge with neighbours of the same run. */
const JOINABLE: Record<Kind, boolean> = {
  text: true,
  voice: true,
  image: true,
  file: true,
  deleted: true,
  location: true,
  emoji: false,
  sticker: false,
  call: false,
};

const firstNameOf = (name: string) => name.trim().split(/\s+/)[0] || name;

export function Messenger({ scenario, playback, lang, rtl }: PlatformProps) {
  const dark = scenario.theme === "dark";
  const pal = palette(dark);
  const s = STR[lang];
  const kb = useKeyboardInset();
  const { messages, typing, clockMs } = playback;
  const live = playback.isLive;
  const exporting = clockMs !== undefined;
  const showTyping = typing || (!live && !exporting && scenario.presence === "typing");
  const draft = playback.draft;
  const draftText = draft?.text ?? "";
  const composing = draftText.length > 0;
  // rough wrapped-line estimate so the thread stays pinned while the composer grows
  const draftLines = draftText ? Math.min(5, Math.ceil(draftText.length / 24)) : 0;
  const scrollRef = useChatScroll<HTMLDivElement>(`${messages.length}-${showTyping}-${draftLines}-${kb.inset > 0}`);
  useBottomAnchor(scrollRef, !exporting);

  const group = scenario.group && scenario.group.members.length > 0 ? scenario.group : null;
  const members = group?.members ?? [scenario.them];
  const authorOf = (m: Message): number =>
    m.sender === "me" ? -1 : group ? Math.min(members.length - 1, Math.max(0, m.authorIndex ?? 0)) : 0;
  const personOf = (m: Message): Person => (m.sender === "me" ? scenario.me : members[authorOf(m)]);
  const nameOf = (m: Message) => firstNameOf(personOf(m).name);

  const byId = new Map(scenario.messages.map((m) => [m.id, m] as const));
  const quoteOf = (m: Message): Message | null => (m.replyToId ? (byId.get(m.replyToId) ?? null) : null);
  const replyLabel = (m: Message, target: Message): string => {
    if (m.sender === "me") return target.sender === "me" ? s.youRepliedToYourself : s.youRepliedTo(nameOf(target));
    if (target.sender === "me") return s.repliedToYou(nameOf(m));
    return authorOf(target) === authorOf(m) ? s.repliedToThemselves(nameOf(m)) : s.replied(nameOf(m), nameOf(target));
  };
  /** one-line summary of a quoted message that has no text of its own */
  const summaryOf = (t: Message): string | null => {
    if (t.type === "deleted") return t.sender === "me" ? s.youUnsent : s.unsent(nameOf(t));
    if (t.type === "location") return t.location?.live ? s.liveLocation : (t.location?.title ?? s.location);
    if (t.type === "file") return t.file?.name ?? s.attachment;
    if (t.type === "sticker") return s.sticker;
    if (t.type === "call") return t.call?.video ? s.videoChat : s.audioCall;
    return null;
  };

  const active = group ? true : scenario.presence !== "lastseen";
  const subtitle = active ? s.activeNow : scenario.lastSeenText;
  const title = group ? group.name : scenario.them.name;

  // who is typing: the author of the next "them" message still to come
  const lastShown = messages.length ? scenario.messages.findIndex((x) => x.id === messages[messages.length - 1].id) : -1;
  const nextThem = scenario.messages.slice(lastShown + 1).find((x) => x.sender === "them");
  const typingPerson = nextThem ? personOf(nextThem) : members[0];

  /* Receipts. 1:1 — one Sent/Delivered icon on the newest outgoing message
     (when it is not yet seen) + the friend's seen-head at the last message
     they have seen, unless they have replied since. Groups — a row of the
     members' seen-heads under the newest message they have all seen. */
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
  const seenAt = !group && lastRead > lastTheirs ? lastRead : -1;
  let headsAt = -1;
  let heads: Person[] = [];
  if (group) {
    if (lastRead >= 0 && lastRead > lastTheirs) {
      headsAt = lastRead;
      heads = members;
    } else if (lastTheirs >= 0) {
      headsAt = lastTheirs;
      heads = members.filter((_, k) => k !== authorOf(messages[lastTheirs]));
    }
  }
  const dirKey = rtl ? "rtl" : "ltr";
  const kinds = messages.map(kindOf);
  const sameRun = (a: Message | undefined, b: Message | undefined) => !!a && !!b && a.sender === b.sender && authorOf(a) === authorOf(b);

  return (
    <div
      className="flex h-full w-full flex-col"
      style={{
        background: pal.bg,
        color: pal.fg,
        paddingBottom: kb.inset,
        transition: kb.transition === "none" ? "none" : `padding-bottom ${kb.transition}`,
      }}
    >
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
          {group ? <GroupAvatar group={group} size={M.headerAvatar} ring={pal.bg} /> : <Avatar person={scenario.them} size={M.headerAvatar} />}
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
            {title}
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
        {/* Profile / group intro + default-E2EE notice that open every thread */}
        <div className="flex flex-col items-center text-center" style={{ paddingTop: 28, paddingBottom: 26, paddingInline: 24 }}>
          {group ? <GroupAvatar group={group} size={80} ring={pal.bg} /> : <Avatar person={scenario.them} size={80} />}
          <div className="max-w-full truncate" dir="auto" style={{ marginTop: 10, fontSize: 20, lineHeight: "25px", fontWeight: 700, letterSpacing: -0.3 }}>
            {title}
          </div>
          {group ? (
            <div className="max-w-full truncate" dir="auto" style={{ marginTop: 2, fontSize: 14, lineHeight: "18px", color: pal.sub }}>
              {s.memberList(members.map((p) => firstNameOf(p.name)))}
            </div>
          ) : (
            <>
              <div style={{ marginTop: 2, fontSize: 14, lineHeight: "18px", color: pal.sub }}>{s.friends}</div>
              <div
                className="flex items-center justify-center"
                style={{ marginTop: 12, height: 32, padding: "0 14px", borderRadius: 8, background: pal.button, fontSize: 14, fontWeight: 600 }}
              >
                {s.viewProfile}
              </div>
            </>
          )}
          <div style={{ marginTop: 22, fontSize: 12, lineHeight: "16px", color: pal.sub, maxWidth: 300 }}>
            <LockIcon color={pal.sub} /> {s.e2ee} <span style={{ fontWeight: 600, color: pal.fg }}>{s.learnMore}</span>
          </div>
        </div>

        <div className="flex flex-col">
          {messages.map((m, i) => {
            const mine = m.sender === "me";
            const onRight = mine ? !rtl : rtl;
            const kind = kinds[i];
            const sep = needsSeparator(messages, i);
            const quote = quoteOf(m);
            // a quoted reply opens its own run: full corners above, sender-gap spacing
            const firstOfGroup = !sameRun(messages[i - 1], m) || sep || !!quote;
            const nextSep = i + 1 < messages.length && needsSeparator(messages, i + 1);
            const nextQuoted = i + 1 < messages.length && !!quoteOf(messages[i + 1]);
            const lastOfGroup = !sameRun(m, messages[i + 1]) || nextSep || nextQuoted;
            const joinAbove = !firstOfGroup && JOINABLE[kind] && JOINABLE[kinds[i - 1]];
            const joinBelow = !lastOfGroup && JOINABLE[kind] && JOINABLE[kinds[i + 1]];
            const reaction = kind === "deleted" ? null : m.reaction?.trim() || null;
            const author = personOf(m);
            const showName = !!group && !mine && firstOfGroup && !quote;

            const hasImage = kind === "image";
            const caption = hasImage ? m.text.trim() : "";
            const link = kind === "text" && m.link ? m.link : null;
            type Seg = "image" | "text" | "voice" | "emoji" | "link" | "sticker" | "location" | "file" | "call" | "deleted";
            const segs: Seg[] = hasImage
              ? caption
                ? ["image", "text"]
                : ["image"]
              : kind === "text"
                ? link
                  ? ["text", "link"]
                  : ["text"]
                : [kind];

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
                  style={{
                    marginTop: firstOfGroup ? (sep ? 0 : M.senderGap) : M.groupGap,
                    marginBottom: reaction ? REACT.extra : 0,
                  }}
                >
                  {!mine && (
                    <div className="shrink-0" style={{ width: M.inAvatar, marginInlineEnd: M.avatarGap }}>
                      {lastOfGroup && <Avatar person={author} size={M.inAvatar} />}
                    </div>
                  )}
                  <div className={`flex min-w-0 flex-col ${mine ? "items-end" : "items-start"}`} style={{ maxWidth: M.maxW }}>
                    {showName && <AboveLabel pal={pal}>{firstNameOf(author.name)}</AboveLabel>}
                    {m.edited && kind !== "deleted" && <AboveLabel pal={pal}>{s.edited}</AboveLabel>}
                    {quote && (
                      <QuoteBlock
                        target={quote}
                        mine={mine}
                        label={replyLabel(m, quote)}
                        pal={pal}
                        voiceLabel={s.voiceMessage}
                        summary={summaryOf(quote)}
                      />
                    )}
                    <div className={`flex min-w-0 flex-col ${mine ? "items-end" : "items-start"}`} style={{ maxWidth: M.maxW, gap: M.groupGap }}>
                      {segs.map((seg, k) => {
                        const joinedAbove = k > 0 || joinAbove;
                        const joinedBelow = k < segs.length - 1 || joinBelow;
                        const corners = cornersFor(onRight, joinedAbove, joinedBelow, M.radius, M.joined);
                        const react = k === segs.length - 1 ? reaction : null;
                        const wrap = (node: ReactNode) => withReaction(node, seg, react, pal, onRight);
                        switch (seg) {
                          case "emoji":
                            return wrap(
                              <div key={seg} dir="ltr" style={{ fontSize: jumboEmojiCount(m.text) === 1 ? 44 : 36, lineHeight: jumboEmojiCount(m.text) === 1 ? "52px" : "44px", padding: "0 2px" }}>
                                {m.text.trim()}
                              </div>,
                            );
                          case "sticker":
                            return wrap(<Sticker key={seg} m={m} />);
                          case "image":
                            return wrap(
                              <div key={seg} className="overflow-hidden" style={{ ...corners, width: M.imgW, background: pal.imgPlaceholder }}>
                                {m.imageSrc ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={m.imageSrc} alt="" draggable={false} className="block w-full object-cover" style={{ maxHeight: 300 }} />
                                ) : (
                                  <div className="flex items-center justify-center" style={{ height: 290 }}>
                                    <ImageGlyph color={pal.sub} />
                                  </div>
                                )}
                              </div>,
                            );
                          case "link":
                            return wrap(<LinkCard key={seg} link={link!} pal={pal} corners={corners} />);
                          case "location":
                            return wrap(
                              <LocationCard
                                key={seg}
                                loc={m.location ?? { title: s.location }}
                                person={author}
                                pal={pal}
                                dark={dark}
                                corners={corners}
                                liveLabel={s.liveLocation}
                              />,
                            );
                          case "file":
                            return wrap(<FileBubble key={seg} file={m.file ?? { name: s.attachment }} mine={mine} pal={pal} corners={corners} />);
                          case "call":
                            return wrap(<CallCard key={seg} call={m.call ?? { video: false, missed: false }} mine={mine} time={m.time} pal={pal} s={s} />);
                          case "deleted":
                            return <UnsentBubble key={seg} label={mine ? s.youUnsent : s.unsent(firstNameOf(author.name))} pal={pal} corners={corners} />;
                          default: {
                            const text = hasImage ? caption : m.text;
                            return wrap(
                              <div
                                key={seg}
                                className="relative"
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
                                    <Linkified text={text} />
                                  </div>
                                )}
                              </div>,
                            );
                          }
                        }
                      })}
                    </div>
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
                {/* group seen-heads: a row under the newest message the members have seen */}
                {i === headsAt && heads.length > 0 && (
                  <div
                    key={`heads-${headsAt}`}
                    className={`flex justify-end ${live ? "msgr-ios-fade" : ""}`}
                    style={{ gap: 3, marginTop: 4, paddingInlineEnd: (M.receiptCol - M.receipt) / 2 }}
                  >
                    {heads.map((p, k) => (
                      <Avatar key={k} person={p} size={M.receipt} />
                    ))}
                  </div>
                )}
              </Fragment>
            );
          })}

          {showTyping && <Typing person={typingPerson} pal={pal} clockMs={clockMs} rtl={rtl} />}
        </div>
      </div>

      {/* Composer */}
      {/* Typing collapses + camera gallery mic into ">" and swaps 👍 for send. */}
      <div className="flex shrink-0 items-end" style={{ padding: "8px 12px 8px", gap: composing ? 12 : 14 }}>
        {composing ? (
          <span className="flex shrink-0 items-center justify-center" style={{ height: M.fieldH, width: M.composerIcon }}>
            <ExpandIcon size={M.composerIcon} />
          </span>
        ) : (
          [
            <PlusIcon key="p" size={M.composerIcon} bg={pal.bg} />,
            <CameraIcon key="c" size={M.composerIcon} />,
            <GalleryIcon key="g" size={M.composerIcon} />,
            <MicIcon key="m" size={M.composerIcon} />,
          ].map((icon) => (
            <span key={icon.key} className="flex shrink-0 items-center" style={{ height: M.fieldH }}>
              {icon}
            </span>
          ))
        )}
        <div
          className="flex min-w-0 flex-1 items-end"
          style={{ minHeight: M.fieldH, borderRadius: M.fieldH / 2, background: pal.field, paddingInlineStart: 12, paddingInlineEnd: 7, marginInlineStart: 2 }}
        >
          <div
            className="flex min-w-0 flex-1 flex-col justify-end overflow-hidden"
            style={{ maxHeight: M.lh * 5 + M.padY * 2, paddingBlock: M.padY }}
          >
            {draft && draftText ? (
              <div
                dir={dirOf(draftText)}
                className="whitespace-pre-wrap break-words"
                style={{ fontSize: 17, lineHeight: `${M.lh}px`, letterSpacing: -0.2, color: pal.fg, textAlign: "start" }}
              >
                {draftText}
                <Caret clockMs={clockMs} />
              </div>
            ) : (
              <div className="flex min-w-0 items-center" style={{ height: M.lh }}>
                {draft && <Caret clockMs={clockMs} />}
                <span className="min-w-0 flex-1 truncate" style={{ fontSize: 17, color: pal.sub, textAlign: "start" }}>
                  {s.message}
                </span>
              </div>
            )}
          </div>
          <span className="flex shrink-0 items-center" style={{ height: M.fieldH, marginInlineStart: 6 }}>
            <SmileyIcon size={22} bg={pal.field} />
          </span>
        </div>
        <span className="flex shrink-0 items-center justify-center" style={{ height: M.fieldH, width: 26 }}>
          {composing ? <SendIcon size={24} /> : <LikeIcon size={26} />}
        </span>
      </div>

      <SystemBottomBar device={scenario.device} bg={pal.bg} fg={dark ? "#ffffff" : "#000000"} />
    </div>
  );
}
