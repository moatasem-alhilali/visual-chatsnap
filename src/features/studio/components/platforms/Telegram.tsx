"use client";

/*
 * Telegram for iOS — chat screen replica (Telegram iOS 12.x on iOS 26, "glass" chrome, late 2026).
 * Every value below was read from the open-source client, github.com/TelegramMessenger/Telegram-iOS
 * (master @ Oct 2026), unless marked otherwise.
 *
 * Theme / colours (TelegramPresentationData/Sources):
 *  - PresentationThemeSettings.defaultSettings: light = .builtin(.dayClassic), automatic dark = .builtin(.night)
 *    with baseColor .blue → accent #3e88f7 (PresentationThemeAccentColor.colorFor).
 *  - DefaultDayPresentationTheme.swift (dayClassic = `message`, not `messageDay`):
 *      incoming #ffffff, outgoing #e1ffc7, both stroked rgba(0,0,0,.2) (bubbleStrokeColor, !day)
 *      text #000; incoming date #77828c; outgoing date #008c09 @.8; outgoingCheckColor #19c700
 *      voice: in active #0088ff / inactive #cacaca / duration #525252@.6;
 *             out active #3fc33b / inactive #93d987 / inner #e1ffc7 / duration #008c09@.8
 *      media date pill rgba(0,0,0,.3); service (date chip) fill black .2 over blurred wallpaper, text white
 *      inputPanel: panelControlColor #000, inputControlColor black .5, inputPlaceholderColor black .4
 *      nav accentTextColor #0088ff (online / typing)
 *  - DefaultDarkPresentationTheme.swift: incoming #1d1d1d @.9, outgoing screen-space gradient #61bcf9 → #0088ff,
 *      text #fff, dates/checks white .5 / white, incoming voice accent #3e88f7 (@.4 inactive),
 *      outgoing voice white (@.5), date chip black .2 (no blur on inverted patterns), placeholder white .48
 * Wallpaper (WallpaperBackgroundNode.swift, SoftwareGradientBackground.swift, DefaultDay/DarkPresentationTheme):
 *  - pattern = the bundled default pattern TelegramUI/Resources/fqv01SQemVIBAAAApND8LDRUhRU.tgv (gzip SVG
 *    1440×2960, aspect-filled to the screen). Embedded below as one quantised path (TGI_PATTERN_D).
 *  - light: gradient #dbddbb #6ba587 #d5d88d #88b884, pattern black, soft-light @ intensity 50%.
 *  - dark: gradient #598bf6 #7a5eef #d67cff #f38b58, intensity -34 → black screen, gradient @34% shows only
 *    through the pattern.
 *  - the 4-colour gradient is generateGradient() (phase 0, swirl, cubic falloff 0.92) rendered offline at
 *    the iOS bitmap size (36×80) and stretched — TGI_GRAD_LIGHT / TGI_GRAD_DARK.
 *  - edge effects (ChatControllerNode + WallpaperEdgeEffectNodeImpl): gradient copy without pattern, alpha .75,
 *    top fade 80pt ending 34pt under the list inset, bottom fade 60pt starting 20pt above the input panel.
 * Bubbles (ChatMessageItemCommon.swift compact constants, ChatMessageBubbleImages.swift, ChatMessageBackground):
 *  - edgeInset 3, tail area 6, bubble image drawn 1pt inside its frame → body 10pt from the screen edge,
 *    tail tip 4.6pt beyond the body; spacing 2⅓pt top/bottom between senders, 0 when merged (=2pt visible).
 *  - radii main 16 / merged 8 (PresentationChatBubbleSettings.default), tail = bottomEllipse (24,16,27×17)
 *    lens minus topEllipse (33,14,23×21) + corner square; min bubble 40×35; max content 342 (width − 36 − 15).
 *  - text: 17pt, insets 6⅓/11/5⅔/11, first line 20.28pt, then line pitch ×1.12 (InteractiveTextNode lineSpacing .12)
 *  - status (ChatMessageDateAndStatusNode): 11pt date, leftInset 5, statusWidth 13, check 11×9 (stroke .99),
 *    sent check at date+1, read (partial) check +6; one check = sent/delivered, two = read; trails the last
 *    line when it fits in 320pt, else a 14pt line below; RTL last line → always below.
 *  - images: insets 2, corner 15/7, tail-shaped corner, max 300×380, date pill black .3 at 6/6.
 *  - voice (ChatMessageInteractiveFileNode): 44pt button, waveform 2/2pt bars ×18pt at x57, duration 11pt at
 *    (56,22), width 120…(max−36) by 2…30s, bubble insets 15/9/15/12.
 *  - large emoji (ChatMessageAnimatedStickerItemNode): 1 animated emoji = 180 × 0.625 (server zoom) = 112pt +
 *    10pt inset; 2–3 emoji = text at 94 × {0.84, 0.69}.
 *  - date header (ChatMessageDateHeader): 22pt pill, 6pt side inset, 13pt medium, inside a 34pt row.
 * Chrome:
 *  - NavigationBarImpl (glass): 44pt glass buttons at x16, nominal bar 60pt; back chevron 44² (24.6,14)→(17,22)
 *    stroke 2; ChatAvatarNavigationNode 44pt with 38pt avatar; AvatarNode gradients + SF Rounded bold 16.
 *  - ChatTitleComponent: 44pt capsule, side inset 14, min content 150, title 17 semibold, subtitle 12 regular;
 *    ChatTypingActivityContentNode: 24×16 dots box before the text, 3→4.5pt dots, 0.7s period.
 *  - ChatTextInputPanelNode: 40pt glass attach/mic circles, field 40pt (5+31+4) radius 20, 8pt margins,
 *    6pt gaps, placeholder 17pt at x12; panel sits 8pt above the 34pt home-indicator inset.
 *  - Telegram iOS does not mirror its chat layout for Arabic (no RTL handling in these components): only the
 *    strings and per-paragraph text alignment change. Arabic strings: translations.telegram.org/ar/ios
 *    (Conversation.typing "يكتب", Presence.online "متصل", LastSeen.Lately "آخر ظهور كان قريبًا",
 *    Weekday.Today "اليوم", Conversation.InputTextPlaceholder "الرسالة").
 * Motion (ChatMessageTransitionNode.swift): send = 0.3s, vertical bezier (.199,.011,.279,.910), horizontal
 *    (.23,1,.32,1) from the input field; insertion (ChatMessageBubbleItemNode.animateInsertion) alpha 0→1 0.2s.
 * The glass blur is NOT done with backdrop-filter (the exporter snapshots the DOM): near-opaque fills instead.
 */

import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from "react";

import type { DeliveryStatus, Message, Person } from "../../types";
import { dirOf, SystemBottomBar, useChatScroll } from "../shared";
import { StatusBar } from "../devices/StatusBar";
import type { Lang } from "./chrome";
import { groupInfo, type PlatformMotion, type PlatformProps } from "./types";

/** CSS `url("data:…")` value for an inline SVG. */
const svgUri = (svg: string) => `url("data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}")`;

/** Deterministic Telegram-style waveform (5-bit levels like SeekBarWaveform), seeded by message id. */
function tgWaveform(seed: string, count: number): number[] {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  const out: number[] = [];
  let prev = 0.4;
  for (let i = 0; i < count; i++) {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h ^= h >>> 13;
    const r = ((h >>> 0) % 1000) / 1000;
    const env = 0.35 + 0.65 * Math.abs(Math.sin((i / Math.max(1, count)) * Math.PI * 1.7 + 0.5));
    const v = Math.min(1, Math.max(0, 0.55 * prev + 0.45 * r * env * 1.25));
    prev = v;
    out.push(1 + Math.round(v * 31));
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* iOS constants                                                      */
/* ------------------------------------------------------------------ */

const SCREEN_W = 393;
const SCREEN_H = 852;
/** iPhone 15 Pro top safe area; the glass bar content starts 2pt below it (NavigationBarImpl). */
const SAFE_TOP = 59;
const NAV_TOP = SAFE_TOP + 2;
/** 44pt glass buttons centred in the 60pt nominal bar. */
const BTN_TOP = NAV_TOP + 8;
/** List content starts under the 60pt bar. */
const LIST_TOP = NAV_TOP + 60;
/** Home-indicator inset (34) + inputPanelsInset (8). */
const PANEL_BOTTOM = 42;
const PANEL_H = 40;
const LIST_BOTTOM = PANEL_BOTTOM + PANEL_H + 8;

const R_MAIN = 16;
const R_AUX = 8;
const IMG_R_MAIN = 15;
const IMG_R_AUX = 7;
const SPACING = 2 + 1 / 3; // defaultSpacing 2 + UIScreenPixel
/** Text metrics: SF 17 line = 20.28pt, following lines add ×1.12. */
const LINE_PITCH = 22.71;
const HALF_LEAD = (LINE_PITCH - 20.28) / 2;
const TEXT_PAD_TOP = 5 + 1 / 3 - HALF_LEAD; // glyph top 5⅓pt under the visible body
const TEXT_PAD_BOTTOM = 4 + 2 / 3 - HALF_LEAD;
const META_BOTTOM = 4 + 2 / 3;
const BODY_MAX = 340; // 342 content − 2
const ENTER_MS = 300;
const TYPING_MS = 700;

const TGI_STRINGS: Record<
  Lang,
  {
    online: string;
    typing: string;
    lastSeenRecently: string;
    today: string;
    placeholder: string;
    photo: string;
    voice: string;
    /** Conversation.MessageEditedLabel */
    edited: string;
    /** Conversation.StatusMembers_* */
    members: (n: number) => string;
    /** group typing ("%@ is typing") */
    userTyping: (name: string) => string;
    /** Notification.Call* / VideoCall* */
    call: { out: string; in: string; missed: string; cancelled: string; vOut: string; vIn: string; vMissed: string; vCancelled: string };
    /** callDurationString: Call.Minutes / Call.Seconds */
    duration: (secs: number) => string;
    liveLocation: string;
    updatedJustNow: string;
    location: string;
    file: string;
    sticker: string;
    /** Notification.CallFormat separator ("%1$@, %2$@") */
    callSep: string;
  }
> = {
  // Message.Photo / Message.Audio (reply snippets for media targets)
  en: {
    online: "online",
    typing: "typing",
    lastSeenRecently: "last seen recently",
    today: "Today",
    placeholder: "Message",
    photo: "Photo",
    voice: "Voice Message",
    edited: "edited",
    members: (n) => (n === 1 ? "1 member" : `${n} members`),
    userTyping: (name) => `${name} is typing`,
    call: {
      out: "Outgoing Call",
      in: "Incoming Call",
      missed: "Missed Call",
      cancelled: "Cancelled Call",
      vOut: "Outgoing Video Call",
      vIn: "Incoming Video Call",
      vMissed: "Missed Video Call",
      vCancelled: "Cancelled Video Call",
    },
    duration: (s) => (s < 60 ? `${s} ${s === 1 ? "second" : "seconds"}` : `${Math.floor(s / 60)} ${Math.floor(s / 60) === 1 ? "minute" : "minutes"}`),
    liveLocation: "Live Location",
    updatedJustNow: "updated just now",
    location: "Location",
    file: "File",
    sticker: "Sticker",
    callSep: ", ",
  },
  ar: {
    online: "متصل",
    typing: "يكتب",
    lastSeenRecently: "آخر ظهور كان قريبًا",
    today: "اليوم",
    placeholder: "الرسالة",
    photo: "صورة",
    voice: "رسالة صوتية",
    edited: "معدلة",
    members: (n) => arPlural(n, "عضو واحد", "عضوان", "أعضاء", "عضوًا", "عضو"),
    userTyping: (name) => `${name} يكتب`,
    call: {
      out: "مكالمة صادرة",
      in: "مكالمة واردة",
      missed: "مكالمة فائتة",
      cancelled: "مكالمة ملغاة",
      vOut: "مكالمة فيديو صادرة",
      vIn: "مكالمة فيديو واردة",
      vMissed: "مكالمة فيديو فائتة",
      vCancelled: "مكالمة فيديو ملغاة",
    },
    duration: (s) =>
      s < 60 ? arPlural(s, "ثانية واحدة", "ثانيتان", "ثوانٍ", "ثانية", "ثانية") : arPlural(Math.floor(s / 60), "دقيقة واحدة", "دقيقتان", "دقائق", "دقيقة", "دقيقة"),
    liveLocation: "الموقع المباشر",
    updatedJustNow: "تم التحديث الآن",
    location: "الموقع",
    file: "ملف",
    sticker: "ملصق",
    callSep: "، ",
  },
};

/** Arabic plural forms as Telegram's ar localisation uses them (1, 2, 3–10, 11–99, 100+). */
function arPlural(n: number, one: string, two: string, few: string, many: string, other: string): string {
  if (n === 1) return one;
  if (n === 2) return two;
  const m = n % 100;
  if (m >= 3 && m <= 10) return `${n} ${few}`;
  if (m >= 11 && m <= 99) return `${n} ${many}`;
  return `${n} ${other}`;
}

/*
 * Reactions (ReactionButtonListComponent + ChatMessageDateAndStatusNode, trailingContent): always chips now
 * (shouldDisplayInlineDateReactions returns false). Chip 30pt tall, radius 15, emoji box 20pt at x 11; in a
 * private chat (displayAllReactionPeers = CloudUser) the reactor's 24pt avatar follows at x 35, width 68.
 * The chip row sits 3pt under the text (verticalReactionsInset), x −1 (reactionButtonLeadingBleed), 6pt spacing;
 * the date shares the row, bottom-aligned (+1pt). Colours: Default{Day,Dark}PresentationTheme
 * reactionActive/InactiveBackground (selected = my reaction).
 * Replies (ChatMessageReplyInfoNode + MessageInlineBlockBackgroundView): block 10pt from the body top/sides
 * (header 11 − 1pt stroke inset), radius 4, 3pt bar in the main colour, fill main @ .1; title semibold 14 /
 * text regular 14 (17 × 14/17), one line each, x 9, 3pt top/bottom insets → 40pt; photo thumb = 2 × title line
 * (≈33pt) at (9,4) r 4, text shifts by side + 6. Incoming: author name colour (PeerNameColors), outgoing:
 * outgoing.accentTextColor. Media snippet in secondaryTextColor. Text resumes 6⅓pt under the block.
 * Composer (ChatTextInputPanelNode, ChatTextInputActionButtonsNode): with text the mic glass circle moves off
 * screen (x = width + 8), the field stretches to 8pt from the edge and the send button (40pt slot, 34pt
 * panelControlAccentColor circle, inset 3) scales in at the field's trailing bottom with the paper-plane
 * SendIcon (send.pdf, 30×30, white); alpha 0.2s + blur 4→0 0.18s, icon slides in from (−22, +18).
 * The sticker accessory (32pt slot, 4pt inset) moves left of it. Field text: 17pt, insets 5+4.5 / 4+5.5,
 * left 12; grows by one SF line (20.29pt) per wrapped line.
 */

/* ------------------------------------------------------------------ */
/* Theme                                                              */
/* ------------------------------------------------------------------ */

interface PartColors {
  link: string;
  /** accentTextColor (webpage site name, bar) */
  accent: string;
  /** accentControlColor / mediaActiveControlColor (file circle, call button) */
  control: string;
  /** glyph inside the file circle (mediaControlInnerBackgroundColor) */
  controlInner: string;
  fileTitle: string;
  fileDesc: string;
  /** fileDurationColor (call label) */
  fileDuration: string;
  secondary: string;
}

interface IosTheme {
  dark: boolean;
  accent: string;
  text: string;
  inFill: string;
  outFill: string;
  stroke: string | null;
  inMeta: string;
  outMeta: string;
  outCheck: string;
  control: string;
  inputControl: string;
  placeholder: string;
  glassFill: string;
  glassShadow: string;
  mediaPlaceholderIn: string;
  mediaPlaceholderOut: string;
  /** reaction chip fills: [incoming bubble, outgoing bubble] × [chosen by me, not chosen] */
  react: { inChosen: string; inOther: string; outChosen: string; outOther: string };
  /** reply block main colour inside outgoing bubbles (outgoing.accentTextColor) */
  replyOut: string;
  /** author name colours (PeerNameColors) for replies inside incoming bubbles */
  names: string[];
  /** panelControlAccentColor — send button + caret */
  sendFill: string;
  /** per-direction bubble colours (PresentationThemePartedColors) used by links, files, calls, webpages */
  part: { in: PartColors; out: PartColors };
  /** map snapshot palette (Apple Maps light / dark) */
  map: { land: string; block: string; park: string; water: string; road: string; major: string; stroke: string };
  voice: {
    in: { active: string; inactive: string; glyph: string; duration: string; dot: string };
    out: { active: string; inactive: string; glyph: string; duration: string; dot: string };
  };
}

const IOS_LIGHT: IosTheme = {
  dark: false,
  accent: "#0088ff",
  text: "#000000",
  inFill: "#ffffff",
  outFill: "#e1ffc7",
  stroke: "rgba(0, 0, 0, 0.2)",
  inMeta: "#77828c",
  outMeta: "rgba(0, 140, 9, 0.8)",
  outCheck: "#19c700",
  control: "#000000",
  inputControl: "rgba(0, 0, 0, 0.5)",
  placeholder: "rgba(0, 0, 0, 0.4)",
  glassFill: "rgba(250, 251, 248, 0.86)",
  glassShadow: "0 1px 14px rgba(0,0,0,0.07), 0 0 3px rgba(0,0,0,0.04), inset 0 0 0 0.5px rgba(255,255,255,0.9)",
  mediaPlaceholderIn: "#e4e8eb",
  mediaPlaceholderOut: "#d2f2b6",
  react: {
    inChosen: "#0088ff",
    inOther: "rgba(0, 136, 255, 0.1)",
    outChosen: "#3fc33b",
    outOther: "rgba(63, 195, 59, 0.12)",
  },
  replyOut: "#00a700",
  names: ["#cc5049", "#d67722", "#955cdb", "#40a920", "#309eba", "#368ad1", "#c7508b"],
  sendFill: "#0088ff",
  // DefaultDayPresentationTheme `message` (dayClassic) incoming / outgoing parted colours
  part: {
    in: {
      link: "#004bad",
      accent: "#0088ff",
      control: "#0088ff",
      controlInner: "#ffffff",
      fileTitle: "#0b8bed",
      fileDesc: "#999999",
      fileDuration: "rgba(82, 82, 82, 0.6)",
      secondary: "#8e8e93",
    },
    out: {
      link: "#004bad",
      accent: "#00a700",
      control: "#3fc33b",
      controlInner: "#e1ffc7",
      fileTitle: "#3faa3c",
      fileDesc: "#6fb26a",
      fileDuration: "rgba(0, 140, 9, 0.8)",
      secondary: "rgba(0, 140, 9, 0.8)",
    },
  },
  map: { land: "#f3f0e9", block: "#e9e5dc", park: "#cfe8b9", water: "#a9d3f2", road: "#ffffff", major: "#fbd88c", stroke: "#d8d3c8" },
  voice: {
    in: { active: "#0088ff", inactive: "#cacaca", glyph: "#ffffff", duration: "rgba(82, 82, 82, 0.6)", dot: "#0088ff" },
    out: { active: "#3fc33b", inactive: "#93d987", glyph: "#e1ffc7", duration: "rgba(0, 140, 9, 0.8)", dot: "#3fc33b" },
  },
};

const IOS_DARK: IosTheme = {
  dark: true,
  accent: "#3e88f7",
  text: "#ffffff",
  // #1d1d1d @ .9 over a black wallpaper; opaque so the tail overlap doesn't double the alpha.
  inFill: "#1d1d1d",
  outFill: "#0088ff",
  stroke: null,
  inMeta: "rgba(255, 255, 255, 0.5)",
  outMeta: "rgba(255, 255, 255, 0.5)",
  outCheck: "#ffffff",
  control: "#ffffff",
  inputControl: "rgba(255, 255, 255, 0.5)",
  placeholder: "rgba(255, 255, 255, 0.48)",
  glassFill: "rgba(36, 36, 37, 0.86)",
  glassShadow: "0 1px 14px rgba(0,0,0,0.35), inset 0 0 0 0.5px rgba(255,255,255,0.09)",
  mediaPlaceholderIn: "#2a2a2a",
  mediaPlaceholderOut: "rgba(255,255,255,0.2)",
  // customizeDefaultDarkTheme: incoming active = accent, inactive white .07; outgoing active white, inactive .12
  react: {
    inChosen: "#3e88f7",
    inOther: "rgba(255, 255, 255, 0.07)",
    outChosen: "#ffffff",
    outOther: "rgba(255, 255, 255, 0.12)",
  },
  replyOut: "#ffffff",
  // server peer_colors dark variants
  names: ["#ff8e86", "#ffa357", "#b18fff", "#4fd635", "#45e8d1", "#52bfff", "#ff7fd5"],
  sendFill: "#3e88f7",
  // DefaultDarkPresentationTheme (customizeDefaultDarkTheme: incoming link/accent/file title = accent)
  part: {
    in: {
      link: "#3e88f7",
      accent: "#3e88f7",
      control: "#3e88f7",
      controlInner: "#1d1d1d",
      fileTitle: "#3e88f7",
      fileDesc: "rgba(255, 255, 255, 0.5)",
      fileDuration: "rgba(255, 255, 255, 0.5)",
      secondary: "rgba(255, 255, 255, 0.5)",
    },
    out: {
      link: "#ffffff",
      accent: "#ffffff",
      control: "#ffffff",
      controlInner: "#1a8cfb",
      fileTitle: "#ffffff",
      fileDesc: "rgba(255, 255, 255, 0.65)",
      fileDuration: "rgba(255, 255, 255, 0.65)",
      secondary: "rgba(255, 255, 255, 0.65)",
    },
  },
  map: { land: "#2c2c2e", block: "#353538", park: "#2b3a2c", water: "#1d2c3f", road: "#4a4a4e", major: "#7a6a45", stroke: "#3c3c40" },
  voice: {
    in: { active: "#3e88f7", inactive: "rgba(62, 136, 247, 0.4)", glyph: "#1d1d1d", duration: "rgba(255, 255, 255, 0.5)", dot: "#3e88f7" },
    out: { active: "#ffffff", inactive: "rgba(255, 255, 255, 0.5)", glyph: "#1a8cfb", duration: "rgba(255, 255, 255, 0.5)", dot: "#ffffff" },
  },
};

/* ------------------------------------------------------------------ */
/* Wallpaper                                                          */
/* ------------------------------------------------------------------ */

const GRAD_POS: [number, number][] = [
  // GradientBackgroundNode.basePositions phase 0, gathered (0,2,4,6) and y-flipped (1 − y)
  [0.8, 0.9],
  [0.35, 0.75],
  [0.2, 0.1],
  [0.65, 0.25],
];
const LIGHT_COLORS = [0xdbddbb, 0x6ba587, 0xd5d88d, 0x88b884];

/** Same field as SoftwareGradientBackground.generateGradient, sampled at one point (0..1 coords). */
function gradientAt(colors: number[], x: number, y: number): [number, number, number] {
  const dx = x - 0.5;
  const dy = y - 0.5;
  const sf = 0.35 * Math.hypot(dx, dy);
  const th = sf * sf * 0.8 * 8;
  const px = Math.max(0, Math.min(1, 0.5 + dx * Math.cos(th) - dy * Math.sin(th)));
  const py = Math.max(0, Math.min(1, 0.5 + dx * Math.sin(th) + dy * Math.cos(th)));
  let s = 0;
  const acc = [0, 0, 0];
  colors.forEach((c, i) => {
    let d = Math.max(0, 0.92 - Math.hypot(px - GRAD_POS[i][0], py - GRAD_POS[i][1]));
    d = d * d * d;
    s += d;
    acc[0] += d * ((c >> 16) & 255);
    acc[1] += d * ((c >> 8) & 255);
    acc[2] += d * (c & 255);
  });
  s = Math.max(s, 1e-5);
  return [acc[0] / s, acc[1] / s, acc[2] / s];
}

const DARK_COLORS = [0x598bf6, 0x7a5eef, 0xd67cff, 0xf38b58];

/** adjustSaturationInContext(1.7) — the "dimmed" gradient clone behind service and translucent bubbles. */
function saturate([r, g, b]: [number, number, number], s = 1.7): [number, number, number] {
  // vImage matrix applied to BGRA bytes: luminance weights land on B, G, R in that order
  const l = 0.3086 * b + 0.6094 * g + 0.082 * r;
  const c = (v: number) => Math.max(0, Math.min(255, l + s * (v - l)));
  return [c(r), c(g), c(b)];
}

const rgb = (c: [number, number, number]) => `rgb(${Math.round(c[0])}, ${Math.round(c[1])}, ${Math.round(c[2])})`;

/**
 * Free/service background (WallpaperBackgroundNode BubbleBackgroundNodeImpl .free): saturated gradient clone,
 * covered by the incoming fill (#1d1d1d @ .9) on inverted wallpapers, then dateFillStatic black .2.
 */
function serviceFillAt(dark: boolean, x: number, y: number): string {
  if (dark) {
    const g = saturate(gradientAt(DARK_COLORS, x, y));
    return rgb([(0.9 * 29 + 0.1 * g[0]) * 0.8, (0.9 * 29 + 0.1 * g[1]) * 0.8, (0.9 * 29 + 0.1 * g[2]) * 0.8]);
  }
  const g = saturate(gradientAt(LIGHT_COLORS, x, y));
  return rgb([g[0] * 0.8, g[1] * 0.8, g[2] * 0.8]);
}

/** Dark incoming bubble: #1d1d1d @ .9 over the saturated gradient clone (needsCleanBackground). */
function darkIncomingAt(x: number, y: number): string {
  const g = saturate(gradientAt(DARK_COLORS, x, y));
  return rgb([0.9 * 29 + 0.1 * g[0], 0.9 * 29 + 0.1 * g[1], 0.9 * 29 + 0.1 * g[2]]);
}

let patternCache: { light: string; dark: string } | null = null;
function patternUris(): { light: string; dark: string } {
  if (!patternCache) {
    const vb = 'viewBox="0 0 1440 2960"';
    const light = `<svg xmlns="http://www.w3.org/2000/svg" ${vb}><path fill="#000" d="${TGI_PATTERN_D}"/></svg>`;
    const dark = `<svg xmlns="http://www.w3.org/2000/svg" ${vb}><defs><mask id="m" maskUnits="userSpaceOnUse" x="-200" y="-200" width="1840" height="3360"><rect x="-200" y="-200" width="1840" height="3360" fill="#fff"/><path fill="#000" d="${TGI_PATTERN_D}"/></mask></defs><rect x="-200" y="-200" width="1840" height="3360" fill="#000" mask="url(#m)"/></svg>`;
    patternCache = { light: svgUri(light), dark: svgUri(dark) };
  }
  return patternCache;
}

function Wallpaper({ dark }: { dark: boolean }) {
  const p = patternUris();
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0" style={{ isolation: "isolate", background: dark ? "#000" : "#a9c38f" }}>
      <div
        className="absolute inset-0"
        style={{ backgroundImage: `url("${dark ? TGI_GRAD_DARK : TGI_GRAD_LIGHT}")`, backgroundSize: "100% 100%" }}
      />
      {dark ? (
        <div className="absolute inset-0" style={{ backgroundImage: p.dark, backgroundSize: "cover", backgroundPosition: "center" }} />
      ) : (
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: p.light,
            backgroundSize: "cover",
            backgroundPosition: "center",
            mixBlendMode: "soft-light",
            opacity: 0.5,
          }}
        />
      )}
    </div>
  );
}

/** Wallpaper-gradient copies (no pattern) fading over the list under the top bar and the input panel. */
function EdgeEffects({ dark }: { dark: boolean }) {
  const topH = LIST_TOP + 34;
  const bottomTop = SCREEN_H - PANEL_BOTTOM - PANEL_H - 20;
  const fill = (y: number): CSSProperties =>
    dark
      ? { background: "#000" }
      : {
          backgroundImage: `url("${TGI_GRAD_LIGHT}")`,
          backgroundSize: `${SCREEN_W}px ${SCREEN_H}px`,
          backgroundPosition: `0 ${-y}px`,
        };
  const fade = (dir: "top" | "bottom", size: number) => {
    const g = `linear-gradient(to ${dir}, #000 0, #000 calc(100% - ${size}px), rgba(0,0,0,.93) calc(100% - ${size * 0.75}px), rgba(0,0,0,.7) calc(100% - ${size * 0.5}px), rgba(0,0,0,.3) calc(100% - ${size * 0.25}px), transparent 100%)`;
    return { WebkitMaskImage: g, maskImage: g } as CSSProperties;
  };
  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0"
        style={{ height: topH, opacity: 0.75, ...fill(0), ...fade("bottom", 80) }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0"
        style={{ height: SCREEN_H - bottomTop, opacity: 0.75, ...fill(bottomTop), ...fade("top", 60) }}
      />
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Small pieces                                                       */
/* ------------------------------------------------------------------ */

function glass(t: IosTheme, size: { w?: number; h: number }): CSSProperties {
  return {
    width: size.w,
    height: size.h,
    borderRadius: size.h / 2,
    background: t.glassFill,
    boxShadow: t.glassShadow,
  };
}

/** Telegram's check glyphs (generateCheckImage, 11×9, stroke .99). Sent/delivered = one, read = two. */
function Checks({ status, color, animate }: { status: DeliveryStatus; color: string; animate: boolean }) {
  const read = status === "read";
  return (
    <span className="relative inline-block shrink-0" style={{ width: 13, height: 14 }}>
      <svg
        key={`s-${status === "read" ? "r" : "s"}`}
        width="11"
        height="9"
        viewBox="0 0 11 9"
        fill="none"
        aria-hidden
        className={animate ? "tgi-chk" : undefined}
        style={{ position: "absolute", left: 1, top: 2 + 2 / 3 }}
      >
        <path d="M1 5 3.95 7.95 10.5 1" stroke={color} strokeWidth=".99" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {read && (
        <svg
          width="11"
          height="9"
          viewBox="0 0 11 9"
          fill="none"
          aria-hidden
          className={animate ? "tgi-chk" : undefined}
          style={{ position: "absolute", left: 7, top: 2 + 2 / 3 }}
        >
          <path d="M1.5 8 8 1" stroke={color} strokeWidth=".99" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </span>
  );
}

/** Date + status run (ChatMessageDateAndStatusNode). `inset` = leftInset (5 in bubbles, 0 on media). */
function MetaRun({
  time,
  mine,
  status,
  color,
  checkColor,
  inset,
  animate,
}: {
  time: string;
  mine: boolean;
  status: DeliveryStatus;
  color: string;
  checkColor: string;
  inset: number;
  animate: boolean;
}) {
  return (
    <span className="inline-flex items-start whitespace-nowrap" dir="ltr" style={{ height: 14, paddingLeft: inset }}>
      <span style={{ fontSize: 11, lineHeight: "14px", color, letterSpacing: "0.05px" }}>{time}</span>
      {mine && <Checks status={status} color={checkColor} animate={animate} />}
    </span>
  );
}

/** Pill used on media and on large emoji (insets 2/7). */
function MetaPill({
  time,
  mine,
  status,
  bg,
  animate,
  style,
}: {
  time: string;
  mine: boolean;
  status: DeliveryStatus;
  bg: string;
  animate: boolean;
  style: CSSProperties;
}) {
  return (
    <span
      className="pointer-events-none absolute inline-flex"
      style={{ background: bg, borderRadius: 9, padding: mine ? "2px 7px 2px 7px" : "2px 7px", ...style }}
    >
      <MetaRun time={time} mine={mine} status={status} color="#ffffff" checkColor="#ffffff" inset={0} animate={animate} />
    </span>
  );
}

/** Telegram tail (messageBubbleImage): corner square + bottom lens − top ellipse; drawn for the right side. */
const TAIL_FILL_D = "M16.5 16H33v8.5a11.5 10.5 0 0 0 4.74 8.5h-.24Q24 33 24 24.5V25h-7.5Z";
const TAIL_STROKE_D = "M33 16v8.5a11.5 10.5 0 0 0 4.74 8.5h-.24Q29.67 33 26.38 30.14";

function Tail({ onRight, fill, stroke }: { onRight: boolean; fill: string; stroke: string | null }) {
  return (
    <svg
      width="21.5"
      height="17"
      viewBox="16.5 16 21.5 17"
      aria-hidden
      style={{
        position: "absolute",
        bottom: 0,
        [onRight ? "right" : "left"]: -5,
        display: "block",
        overflow: "visible",
        transform: onRight ? undefined : "scaleX(-1)",
      }}
    >
      <path d={TAIL_FILL_D} style={{ fill }} />
      {stroke && <path d={TAIL_STROKE_D} fill="none" stroke={stroke} strokeWidth=".6" />}
    </svg>
  );
}

/** Bubble background (fill + Telegram's hairline outline) and the tail. */
function BubbleBack({
  radius,
  fill,
  stroke,
  tail,
  onRight,
  tailFill,
}: {
  radius: CSSProperties;
  fill: string;
  stroke: string | null;
  tail: boolean;
  onRight: boolean;
  tailFill: string;
}) {
  return (
    <>
      <span
        aria-hidden
        className="absolute inset-0"
        style={{ ...radius, background: fill, boxShadow: stroke ? `inset 0 0 0 0.55px ${stroke}` : undefined }}
      />
      {tail && <Tail onRight={onRight} fill={tailFill} stroke={stroke} />}
    </>
  );
}

function radiiFor(onRight: boolean, first: boolean, last: boolean, main: number, aux: number): CSSProperties {
  const top = first ? main : aux;
  const bottom = last ? main : aux;
  return onRight
    ? { borderTopLeftRadius: main, borderBottomLeftRadius: main, borderTopRightRadius: top, borderBottomRightRadius: bottom }
    : { borderTopRightRadius: main, borderBottomRightRadius: main, borderTopLeftRadius: top, borderBottomLeftRadius: bottom };
}

/* ------------------------------------------------------------------ */
/* Avatar                                                             */
/* ------------------------------------------------------------------ */

const AVATAR_GRADIENTS: [string, string][] = [
  ["#ff516a", "#ff885e"],
  ["#ffa85c", "#ffcd6a"],
  ["#665fff", "#82b1ff"],
  ["#54cb68", "#a0de7e"],
  ["#4acccd", "#00fcfd"],
  ["#2a9ef1", "#72d5fd"],
  ["#d669ed", "#e0a2f3"],
];

function avatarLetters(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "";
  const first = Array.from(parts[0])[0] ?? "";
  const last = parts.length > 1 ? (Array.from(parts[parts.length - 1])[0] ?? "") : "";
  return (first + last).toUpperCase();
}

/** Peer.displayLetters for a group title: first letters of the first two words that start with a letter. */
function groupLetters(title: string): string {
  const words = title
    .trim()
    .split(/\s+/)
    .filter((w) => /^\p{L}/u.test(w));
  return words
    .slice(0, 2)
    .map((w) => Array.from(w)[0] ?? "")
    .join("")
    .toUpperCase();
}

function TgAvatar({ person, size, colorIdx, letters }: { person: Person; size: number; colorIdx?: number; letters?: string }) {
  if (person.avatar) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={person.avatar}
        alt=""
        draggable={false}
        className="block shrink-0 rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  let h = 0;
  for (const ch of person.name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const [bottom, top] = AVATAR_GRADIENTS[(colorIdx ?? h) % AVATAR_GRADIENTS.length];
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full text-white"
      style={{
        width: size,
        height: size,
        background: `linear-gradient(180deg, ${top}, ${bottom})`,
        fontFamily: 'ui-rounded, "SF Pro Rounded", inherit',
        fontWeight: 700,
        fontSize: Math.round((size * 16) / 38),
        lineHeight: 1,
      }}
    >
      {letters ?? avatarLetters(person.name)}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Header + composer                                                  */
/* ------------------------------------------------------------------ */

function typingDot(progress: number, offset: number): { d: number; a: number } {
  // ChatTypingActivityIndicatorNode.radiusFunction
  let v = progress + offset;
  v -= Math.floor(v);
  let r = 3;
  if (v < 0.4) r = 3 + 1.5 * (v / 0.4);
  else if (v < 0.8) r = 4.5 - 1.5 * ((v - 0.4) / 0.4);
  const norm = (r - 3) / 1.5;
  return { d: 3 + norm * 1.5, a: Math.min(1, 0.75 + norm * 1.5 * 0.25) };
}

const DOT_OFFSETS = [0.4, 0.2, 0];

function TypingDots({ color, clockMs }: { color: string; clockMs?: number }) {
  const exporting = clockMs !== undefined;
  return (
    <span className="relative inline-block shrink-0" style={{ width: 24, height: 16 }} aria-hidden>
      {DOT_OFFSETS.map((off, i) => {
        const st = exporting ? typingDot(clockMs / TYPING_MS, off) : null;
        const cx = 6 + i * 5.5;
        return (
          <span
            key={i}
            className={exporting ? undefined : "tgi-dot"}
            style={{
              position: "absolute",
              left: cx - 2.25,
              top: 9 - 2.25,
              width: 4.5,
              height: 4.5,
              borderRadius: "50%",
              background: color,
              transform: st ? `scale(${(st.d / 4.5).toFixed(3)})` : undefined,
              opacity: st ? st.a : undefined,
              animationDelay: exporting ? undefined : `${-off * TYPING_MS}ms`,
            }}
          />
        );
      })}
    </span>
  );
}

function BackChevron({ color }: { color: string }) {
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" fill="none" aria-hidden>
      <path d="M24.6 14 17 22l7.6 8" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function AttachIcon({ color }: { color: string }) {
  // Chat/Input/Text/IconAttachment (30pt paperclip, ~1.66pt stroke)
  return (
    <svg width="30" height="30" viewBox="0 0 30 30" fill="none" aria-hidden>
      <path
        d="M19.6 8.4v10.3a4.6 4.6 0 0 1-9.2 0V7.6a3.1 3.1 0 0 1 6.2 0v10.6a1.6 1.6 0 0 1-3.2 0V9.6"
        transform="rotate(45 15 15) translate(0 0.4)"
        stroke={color}
        strokeWidth="1.66"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MicIcon({ color }: { color: string }) {
  // Chat/Input/Text/IconMicrophone (30pt)
  return (
    <svg width="30" height="30" viewBox="0 0 30 30" fill="none" aria-hidden>
      <rect x="10.75" y="3.9" width="8.5" height="14.7" rx="4.25" stroke={color} strokeWidth="1.66" />
      <path d="M6.7 14.4a8.3 8.3 0 0 0 16.6 0M15 22.7v3.9" stroke={color} strokeWidth="1.66" strokeLinecap="round" />
    </svg>
  );
}

function StickerIcon({ color }: { color: string }) {
  // Chat/Input/Text/AccessoryIconStickers (24pt circle with a peeled corner)
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12.4 3.04A9 9 0 1 0 20.96 11.6L12.4 3.04ZM12.4 3.04V6.7a4.9 4.9 0 0 0 4.9 4.9h3.66"
        stroke={color}
        strokeWidth="1.6"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Message contents                                                   */
/* ------------------------------------------------------------------ */

const EMOJI_RE = /^(?:\p{Extended_Pictographic}|\p{Emoji_Modifier}|\p{Regional_Indicator}|‍|️|⃣|[#*0-9](?=️?⃣)|\s)+$/u;

function emojiCount(text: string): number {
  const s = text.trim();
  if (!s || !EMOJI_RE.test(s)) return 0;
  const seg = typeof Intl !== "undefined" && "Segmenter" in Intl ? new Intl.Segmenter("en", { granularity: "grapheme" }) : null;
  const parts = seg ? Array.from(seg.segment(s.replace(/\s+/g, ""))) : Array.from(s.replace(/\s+/g, ""));
  return parts.length;
}

function parseDuration(s?: string): number {
  if (!s) return 0;
  const p = s.split(":").map((v) => parseInt(v, 10) || 0);
  return p.length === 1 ? p[0] : p.length === 2 ? p[0] * 60 + p[1] : p[0] * 3600 + p[1] * 60 + p[2];
}

/** Best-effort intrinsic size of a data-URL image (svg / png / jpeg / gif) without waiting for load. */
function dimsFromSrc(src: string): { w: number; h: number } | null {
  try {
    if (src.startsWith("data:image/svg+xml")) {
      const body = decodeURIComponent(src.slice(src.indexOf(",") + 1));
      const w = /\swidth=['"]([\d.]+)/.exec(body);
      const h = /\sheight=['"]([\d.]+)/.exec(body);
      if (w && h) return { w: +w[1], h: +h[1] };
      const vb = /viewBox=['"][\d.\-]+[\s,]+[\d.\-]+[\s,]+([\d.]+)[\s,]+([\d.]+)/.exec(body);
      if (vb) return { w: +vb[1], h: +vb[2] };
      return null;
    }
    const m = /^data:image\/(png|jpe?g|gif);base64,/.exec(src);
    if (!m) return null;
    const bin = atob(src.slice(m[0].length, m[0].length + 87400));
    const at = (i: number) => bin.charCodeAt(i);
    if (m[1] === "png") return { w: (at(16) << 24) | (at(17) << 16) | (at(18) << 8) | at(19), h: (at(20) << 24) | (at(21) << 16) | (at(22) << 8) | at(23) };
    if (m[1] === "gif") return { w: at(6) | (at(7) << 8), h: at(8) | (at(9) << 8) };
    let i = 2;
    while (i < bin.length - 9) {
      if (at(i) !== 0xff) return null;
      const marker = at(i + 1);
      const len = (at(i + 2) << 8) | at(i + 3);
      if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
        return { h: (at(i + 5) << 8) | at(i + 6), w: (at(i + 7) << 8) | at(i + 8) };
      }
      i += 2 + len;
    }
  } catch {
    return null;
  }
  return null;
}

/** ChatMessageInteractiveMediaNode sizing: fit into 300×380, at least 170 wide. */
function fitImage(d: { w: number; h: number }): { w: number; h: number } {
  const s = Math.min(300 / d.w, 380 / d.h);
  let w = d.w * s;
  let h = d.h * s;
  if (w < 170) {
    h = Math.min(380, (h * 170) / w);
    w = 170;
  }
  return { w: Math.round(w), h: Math.round(h) };
}

function roundedRectPath(w: number, h: number, tl: number, tr: number, br: number, bl: number, dx = 0): string {
  const f = (n: number) => +n.toFixed(2);
  return (
    `M${f(dx + tl)} 0H${f(dx + w - tr)}A${tr} ${tr} 0 0 1 ${f(dx + w)} ${tr}V${f(h - br)}A${br} ${br} 0 0 1 ${f(dx + w - br)} ${f(h)}` +
    `H${f(dx + bl)}A${bl} ${bl} 0 0 1 ${f(dx)} ${f(h - bl)}V${tl}A${tl} ${tl} 0 0 1 ${f(dx + tl)} 0Z`
  );
}

/** The tail polygon in image coordinates (image inset 1pt inside a body of the given size). */
function imageTailPath(w: number, h: number, onRight: boolean, dx: number): string {
  // TAIL_FILL_D in body space (33 = body right / bottom), shifted by −1 for the image inset
  const X = (x: number) => {
    const bx = w + 1 + (x - 33) - 1; // body width = w + 2
    return +(onRight ? dx + bx : dx + (w - bx)).toFixed(2);
  };
  const Y = (y: number) => +(h + 1 + (y - 33) - 1).toFixed(2);
  if (onRight) {
    return (
      `M${X(16.5)} ${Y(16)}H${X(33)}V${Y(24.5)}A11.5 10.5 0 0 0 ${X(37.74)} ${Y(33)}H${X(37.5)}` +
      `Q${X(24)} ${Y(33)} ${X(24)} ${Y(24.5)}V${Y(25)}H${X(16.5)}Z`
    );
  }
  // Mirrored: walk the outline backwards so its winding matches the (clockwise) image rect — with nonzero
  // filling, an opposite winding would punch the overlap out instead of adding the tail.
  return (
    `M${X(16.5)} ${Y(16)}V${Y(25)}H${X(24)}V${Y(24.5)}Q${X(24)} ${Y(33)} ${X(37.5)} ${Y(33)}H${X(37.74)}` +
    `A11.5 10.5 0 0 0 ${X(33)} ${Y(24.5)}V${Y(16)}Z`
  );
}

/* ------------------------------------------------------------------ */
/* Screen                                                             */
/* ------------------------------------------------------------------ */

type DarkGradRef = RefObject<HTMLDivElement | null>;

/**
 * Dark theme only: paints the outgoing gradient in screen space (outgoingBubbleGradientImage, #61bcf9 at the
 * top → #0088ff at the bottom) and tints incoming bubbles with the gradient clone under them.
 */
function useScreenGradient(rootRef: DarkGradRef, scrollRef: RefObject<HTMLDivElement | null>, enabled: boolean, dep: unknown) {
  useLayoutEffect(() => {
    const root = rootRef.current;
    const scroller = scrollRef.current;
    if (!enabled || !root || !scroller) return;
    const paint = () => {
      const rr = root.getBoundingClientRect();
      const k = rr.height / SCREEN_H || 1;
      root.querySelectorAll<HTMLElement>("[data-tgi-grad]").forEach((el) => {
        const r = el.getBoundingClientRect();
        const top = (r.top - rr.top) / k;
        const bottom = (r.bottom - rr.top) / k;
        el.style.setProperty("--tgi-y", `${top.toFixed(1)}px`);
        const t = Math.max(0, Math.min(1, bottom / SCREEN_H));
        const mix = (a: number, b: number) => Math.round(a + (b - a) * t);
        el.style.setProperty("--tgi-tail", `rgb(${mix(0x61, 0x00)}, ${mix(0xbc, 0x88)}, ${mix(0xf9, 0xff)})`);
      });
      root.querySelectorAll<HTMLElement>("[data-tgi-in]").forEach((el) => {
        const r = el.getBoundingClientRect();
        const cx = (r.left + r.width / 2 - rr.left) / k / SCREEN_W;
        const cy = (r.top + r.height / 2 - rr.top) / k / SCREEN_H;
        el.style.setProperty("--tgi-in", darkIncomingAt(Math.max(0, Math.min(1, cx)), Math.max(0, Math.min(1, cy))));
      });
    };
    paint();
    const raf = requestAnimationFrame(paint);
    const t1 = window.setTimeout(paint, 350);
    const t2 = window.setTimeout(paint, 900);
    scroller.addEventListener("scroll", paint, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      scroller.removeEventListener("scroll", paint);
    };
  }, [rootRef, scrollRef, enabled, dep]);
}

const DARK_OUT_BG = "linear-gradient(180deg, #61bcf9 0px, #0088ff 852px)";
const darkOutStyle: CSSProperties = {
  backgroundImage: DARK_OUT_BG,
  backgroundSize: `100% ${SCREEN_H}px`,
  backgroundPosition: "0 calc(var(--tgi-y, 640px) * -1)",
  backgroundRepeat: "no-repeat",
};

/** Who reacted with what (on my message it is theirs, on theirs it is mine). */
interface Reaction {
  emoji: string;
  by: Person;
  chosen: boolean;
}

/** The quoted message of a reply. */
interface Quote {
  name: string;
  nameIdx: number;
  text: string;
  media: boolean;
  thumb: string | null;
  hasThumb: boolean;
}

interface RowCtx {
  t: IosTheme;
  m: Message;
  mine: boolean;
  first: boolean;
  last: boolean;
  status: DeliveryStatus;
  animate: boolean;
  react: Reaction | null;
  quote: Quote | null;
  /** date label incl. the "edited" prefix (ChatMessageDateAndStatusNode) */
  time: string;
  /** group chats: the author name drawn inside the first bubble of a run */
  name: { text: string; color: string } | null;
  s: (typeof TGI_STRINGS)[Lang];
}

/** PeerNameColor preset for a peer without a custom colour (id % 7); the name stands in for the id. */
function nameColorIndex(name: string): number {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h % 7;
}

function quoteOf(
  target: Message | undefined,
  authorOf: (m: Message) => { person: Person; idx: number },
  s: (typeof TGI_STRINGS)[Lang],
): Quote | null {
  if (!target) return null;
  const author = authorOf(target);
  const base = { name: author.person.name, nameIdx: author.idx };
  if (target.type === "voice") return { ...base, text: s.voice, media: true, thumb: null, hasThumb: false };
  if (target.type === "sticker") return { ...base, text: `${target.text.trim()} ${s.sticker}`.trim(), media: true, thumb: null, hasThumb: false };
  if (target.type === "location") return { ...base, text: target.location?.live ? s.liveLocation : s.location, media: true, thumb: null, hasThumb: false };
  if (target.type === "file") return { ...base, text: target.file?.name || s.file, media: false, thumb: null, hasThumb: false };
  if (target.type === "call") {
    const c = target.call;
    const k = target.sender === "me" ? (c?.missed ? "cancelled" : "out") : c?.missed ? "missed" : "in";
    const key = (c?.video ? `v${k[0].toUpperCase()}${k.slice(1)}` : k) as keyof (typeof TGI_STRINGS)[Lang]["call"];
    return { ...base, text: s.call[key], media: true, thumb: null, hasThumb: false };
  }
  if (target.type === "image") {
    const caption = target.text.replace(/\s+/g, " ").trim();
    return { ...base, text: caption || s.photo, media: !caption, thumb: target.imageSrc ?? null, hasThumb: true };
  }
  return { ...base, text: target.text.replace(/\s+/g, " ").trim(), media: false, thumb: null, hasThumb: false };
}

/** rgba() of a #rrggbb colour. */
function alpha(hex: string, a: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}

/** ReactionButtonAsyncNode in a private chat: 30pt pill, 20pt emoji at x 11, reactor avatar 24pt at x 35. */
function ReactionChip({ r, t, outgoing }: { r: Reaction; t: IosTheme; outgoing: boolean }) {
  const bg = outgoing ? (r.chosen ? t.react.outChosen : t.react.outOther) : r.chosen ? t.react.inChosen : t.react.inOther;
  return (
    <span className="relative block shrink-0" style={{ width: 68, height: 30, borderRadius: 15, background: bg }}>
      <span
        className="absolute flex items-center justify-center"
        style={{ left: 11, top: 5, width: 20, height: 20, fontSize: 17, lineHeight: "20px", letterSpacing: 0 }}
      >
        {r.emoji}
      </span>
      <span className="absolute block" style={{ left: 35, top: 3 }}>
        <TgAvatar person={r.by} size={24} />
      </span>
    </span>
  );
}

/** ChatMessageReplyInfoNode inside a bubble (MessageInlineBlockBackgroundView behind it). */
function ReplyHeader({ q, t, outgoing, style }: { q: Quote; t: IosTheme; outgoing: boolean; style?: CSSProperties }) {
  const main = outgoing ? t.replyOut : t.names[q.nameIdx];
  const textColor = q.media ? (outgoing ? t.outMeta : t.inMeta) : t.text;
  const thumbSide = 33;
  const x = q.hasThumb ? 9 + thumbSide + 6 : 9;
  const line: CSSProperties = {
    fontSize: 14,
    lineHeight: "17px",
    letterSpacing: "-0.15px",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    textAlign: "left",
  };
  return (
    <div
      className="relative overflow-hidden"
      style={{ borderRadius: 4, background: alpha(main, 0.1), padding: `3px 8px 3px ${x}px`, minWidth: 0, ...style }}
    >
      <span aria-hidden className="absolute inset-y-0 left-0 block" style={{ width: 3, background: main }} />
      {q.hasThumb && (
        <span
          className="absolute block overflow-hidden"
          style={{ left: 9, top: 4, width: thumbSide, height: thumbSide, borderRadius: 4, background: outgoing ? t.mediaPlaceholderOut : t.mediaPlaceholderIn }}
        >
          {q.thumb && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={q.thumb} alt="" draggable={false} className="block h-full w-full object-cover" />
          )}
        </span>
      )}
      <div dir="auto" style={{ ...line, fontWeight: 600, color: main }}>
        {q.name}
      </div>
      <div dir="auto" style={{ ...line, color: textColor }}>
        {q.text}
      </div>
    </div>
  );
}

function fillsFor(ctx: RowCtx): { fill: string; tailFill: string; gradient: boolean } {
  if (!ctx.mine && ctx.t.dark) return { fill: "var(--tgi-in, #1f1d22)", tailFill: "var(--tgi-in, #1f1d22)", gradient: false };
  if (!ctx.mine) return { fill: ctx.t.inFill, tailFill: ctx.t.inFill, gradient: false };
  if (ctx.t.dark) return { fill: "transparent", tailFill: "var(--tgi-tail, #0a8dff)", gradient: true };
  return { fill: ctx.t.outFill, tailFill: ctx.t.outFill, gradient: false };
}

function BubbleShell({
  ctx,
  radius,
  tail,
  children,
  style,
}: {
  ctx: RowCtx;
  radius: CSSProperties;
  tail: boolean;
  children: ReactNode;
  style?: CSSProperties;
}) {
  const f = fillsFor(ctx);
  return (
    <div
      className="relative"
      data-tgi-grad={f.gradient ? "" : undefined}
      data-tgi-in={!ctx.mine && ctx.t.dark ? "" : undefined}
      style={{ margin: "1px 0", ...style }}
    >
      <BubbleBack radius={radius} fill={f.fill} stroke={ctx.t.stroke} tail={tail} onRight={ctx.mine} tailFill={f.tailFill} />
      {f.gradient && <span aria-hidden className="absolute inset-0" style={{ ...radius, ...darkOutStyle }} />}
      {children}
    </div>
  );
}

function metaColors(ctx: RowCtx) {
  return { color: ctx.mine ? ctx.t.outMeta : ctx.t.inMeta, check: ctx.mine ? ctx.t.outCheck : ctx.t.inMeta };
}

/** Text with the status either trailing the last line or dropped to its own 14pt line. */
function TextWithMeta({ ctx, text, meta = true }: { ctx: RowCtx; text: string; meta?: boolean }) {
  const dir = dirOf(text);
  const { color, check } = metaColors(ctx);
  const part = ctx.mine ? ctx.t.part.out : ctx.t.part.in;
  // links are underlined only where their colour equals the text colour (dark outgoing)
  const body = linkify(text, part.link, part.link === ctx.t.text);
  if (!meta) {
    return (
      <div
        dir={dir}
        style={{
          fontSize: 17,
          lineHeight: `${LINE_PITCH}px`,
          letterSpacing: "-0.4px",
          color: ctx.t.text,
          textAlign: "start",
          whiteSpace: "pre-wrap",
          overflowWrap: "break-word",
          wordBreak: "break-word",
        }}
      >
        {body}
      </div>
    );
  }
  const run = (hidden: boolean) => (
    <MetaRun
      time={ctx.time}
      mine={ctx.mine}
      status={ctx.status}
      color={color}
      checkColor={check}
      inset={5}
      animate={!hidden && ctx.animate}
    />
  );
  return (
    <>
      <div
        dir={dir}
        style={{
          fontSize: 17,
          lineHeight: "14px",
          letterSpacing: "-0.4px",
          color: ctx.t.text,
          textAlign: "start",
          whiteSpace: "pre-wrap",
          overflowWrap: "break-word",
          wordBreak: "break-word",
        }}
      >
        <span style={{ lineHeight: `${LINE_PITCH}px` }}>{body}</span>
        {ctx.react ? null : dir === "rtl" ? (
          <span aria-hidden className="flex justify-end" style={{ height: 14, visibility: "hidden", letterSpacing: 0 }} dir="ltr">
            {run(true)}
          </span>
        ) : (
          <span aria-hidden style={{ display: "inline-block", verticalAlign: "top", height: 14, visibility: "hidden", letterSpacing: 0 }}>
            {run(true)}
          </span>
        )}
      </div>
      {ctx.react && <ReactionRow ctx={ctx} meta={run(true)} />}
      <span className="pointer-events-none absolute" style={{ right: 10, bottom: META_BOTTOM }}>
        {run(false)}
      </span>
    </>
  );
}

/**
 * Reaction row under the content (ChatMessageDateAndStatusNode trailingContent): 3pt gap, chips from x −1,
 * the date sharing the last row (its width reserved by a hidden copy), 1pt below.
 */
function ReactionRow({ ctx, meta }: { ctx: RowCtx; meta: ReactNode }) {
  if (!ctx.react) return null;
  return (
    <div className="flex items-end" dir="ltr" style={{ marginTop: 3, paddingBottom: 1, letterSpacing: 0 }}>
      <span style={{ marginLeft: -1 }}>
        <ReactionChip r={ctx.react} t={ctx.t} outgoing={ctx.mine} />
      </span>
      <span aria-hidden className="ml-auto" style={{ visibility: "hidden", paddingLeft: 1 }}>
        {meta}
      </span>
    </div>
  );
}

function TextBubble({ ctx }: { ctx: RowCtx }) {
  const radius = radiiFor(ctx.mine, ctx.first, ctx.last, R_MAIN, R_AUX);
  const link = ctx.m.link ?? null;
  const top = ctx.quote ? 6 + 1 / 3 - HALF_LEAD : ctx.name ? 2 - HALF_LEAD : TEXT_PAD_TOP;
  return (
    <BubbleShell ctx={ctx} radius={radius} tail={ctx.last} style={{ maxWidth: BODY_MAX, minWidth: 38, width: link ? WEBPAGE_W : undefined }}>
      <NameHeader ctx={ctx} />
      {ctx.quote && <ReplyHeader q={ctx.quote} t={ctx.t} outgoing={ctx.mine} style={{ margin: `${ctx.name ? 3 : 10}px 10px 0` }} />}
      {link ? (
        <div className="relative" style={{ padding: `${top}px 10px ${TEXT_PAD_BOTTOM}px` }}>
          <TextWithMeta ctx={ctx} text={ctx.m.text} meta={false} />
          <WebpageBlock ctx={ctx} link={link} />
          {ctx.react && <ReactionRow ctx={ctx} meta={<StatusLine ctx={ctx} hidden />} />}
          <div className="flex justify-end" style={{ height: 14 }}>
            {!ctx.react && <StatusLine ctx={ctx} />}
          </div>
          {ctx.react && (
            <span className="pointer-events-none absolute" style={{ right: 10, bottom: META_BOTTOM }}>
              <StatusLine ctx={ctx} />
            </span>
          )}
        </div>
      ) : (
        <div
          className="relative flex flex-col justify-center"
          style={{
            minHeight: ctx.quote || ctx.name ? undefined : 33,
            padding: `${top}px 10px ${TEXT_PAD_BOTTOM}px`,
          }}
        >
          <TextWithMeta ctx={ctx} text={ctx.m.text} />
        </div>
      )}
    </BubbleShell>
  );
}

function VoiceBubble({ ctx }: { ctx: RowCtx }) {
  const v = ctx.mine ? ctx.t.voice.out : ctx.t.voice.in;
  const secs = parseDuration(ctx.m.voiceDuration);
  const minW = 120;
  const maxW = 342 - 21 - 36;
  const W = Math.round(minW + ((maxW - minW) * (Math.max(2, Math.min(30, secs || 2)) - 2)) / 28);
  const bodyW = W + 19;
  const waveW = W - 60;
  const n = Math.max(1, Math.floor(waveW / 4));
  const bars = tgWaveform(ctx.m.id, n);
  const peak = Math.max(...bars);
  const unplayed = !ctx.mine || ctx.status !== "read";
  const waveColor = ctx.mine ? v.inactive : v.active;
  const radius = radiiFor(ctx.mine, ctx.first, ctx.last, R_MAIN, R_AUX);
  const { color, check } = metaColors(ctx);
  const glyph = ctx.mine && ctx.t.dark ? "var(--tgi-tail, #1a8cfb)" : v.glyph;
  return (
    <BubbleShell ctx={ctx} radius={radius} tail={ctx.last} style={{ minWidth: bodyW, maxWidth: BODY_MAX }}>
      <NameHeader ctx={ctx} />
      {ctx.quote && <ReplyHeader q={ctx.quote} t={ctx.t} outgoing={ctx.mine} style={{ margin: `${ctx.name ? 3 : 10}px 10px -4px` }} />}
      <div className="relative" style={{ height: (ctx.react ? 66 : 70) - (ctx.name && !ctx.quote ? 6 : 0), marginTop: ctx.name && !ctx.quote ? -4 : 0 }}>
      <span className="absolute rounded-full" style={{ left: 11, top: 11, width: 44, height: 44, background: v.active }}>
        <svg width="44" height="44" viewBox="0 0 44 44" aria-hidden className="block">
          <path
            d="M17.6 14.6v14.8c0 1 1.05 1.6 1.9 1.1l12.1-7.4c.8-.5.8-1.7 0-2.2l-12.1-7.4c-.85-.5-1.9.1-1.9 1.1Z"
            style={{ fill: glyph }}
          />
        </svg>
      </span>
      <span className="absolute flex items-end" dir="ltr" style={{ left: 65, top: 15, width: waveW, height: 18, gap: 2 }}>
        {bars.map((b, i) => {
          const hgt = Math.max(2, Math.round(((b / peak) * 18 - 2) * 10) / 10);
          return <span key={i} style={{ width: 2, height: hgt, borderRadius: 1, background: waveColor, flexShrink: 0 }} />;
        })}
      </span>
      <span className="absolute flex items-center" dir="ltr" style={{ left: 64, top: 36, fontSize: 11, lineHeight: "13px", color: v.duration }}>
        {ctx.m.voiceDuration ?? "0:00"}
        {unplayed && <span className="rounded-full" style={{ width: 4, height: 4, marginLeft: 4, marginTop: 1, background: v.dot }} />}
      </span>
      </div>
      {ctx.react && (
        <div className="relative" style={{ height: 34, paddingLeft: 10 }}>
          <ReactionChip r={ctx.react} t={ctx.t} outgoing={ctx.mine} />
        </div>
      )}
      <span className="pointer-events-none absolute" style={{ right: 8, bottom: 3 }}>
        <MetaRun time={ctx.time} mine={ctx.mine} status={ctx.status} color={color} checkColor={check} inset={0} animate={ctx.animate} />
      </span>
    </BubbleShell>
  );
}

function ImageBubble({ ctx }: { ctx: RowCtx }) {
  const src = ctx.m.imageSrc ?? null;
  const caption = ctx.m.text.trim();
  const [loaded, setLoaded] = useState<{ src: string; w: number; h: number } | null>(null);
  const parsed = src ? dimsFromSrc(src) : null;
  const natural = loaded && loaded.src === src ? loaded : (parsed ?? { w: 4, h: 3 });
  const { w, h } = fitImage(natural);
  const onRight = ctx.mine;
  const footer = !caption && !!ctx.react;
  const tailOnImage = ctx.last && !caption && !footer;
  const radius = radiiFor(onRight, ctx.first, ctx.last, R_MAIN, R_AUX);
  // image corners (chatMessageBubbleImageContentCorners)
  const senderTop = ctx.first ? IMG_R_MAIN : IMG_R_AUX;
  const senderBottom = ctx.last ? IMG_R_MAIN : IMG_R_AUX;
  // a reply header above / a caption or reaction footer below merge those corners
  const header = !!ctx.quote || !!ctx.name;
  const tl = header ? 0 : onRight ? IMG_R_MAIN : senderTop;
  const tr = header ? 0 : onRight ? senderTop : IMG_R_MAIN;
  const bl = caption || footer ? 0 : onRight ? IMG_R_MAIN : senderBottom;
  const br = caption || footer ? 0 : onRight ? senderBottom : IMG_R_MAIN;
  const ext = tailOnImage ? 6 : 0;
  const dx = onRight ? 0 : ext;
  let clip = roundedRectPath(w, h, tl, tr, br, bl, dx);
  if (tailOnImage) clip += imageTailPath(w, h, onRight, dx);
  const placeholder = ctx.mine ? ctx.t.mediaPlaceholderOut : ctx.t.mediaPlaceholderIn;
  return (
    <BubbleShell ctx={ctx} radius={radius} tail={ctx.last} style={{ width: w + 2 }}>
      <NameHeader ctx={ctx} style={{ paddingBottom: ctx.quote ? 0 : 4 }} />
      {ctx.quote && <ReplyHeader q={ctx.quote} t={ctx.t} outgoing={ctx.mine} style={{ margin: `${ctx.name ? 3 : 10}px 10px 5px` }} />}
      <div className="relative" style={{ height: h + 2 }}>
        <div
          className="absolute overflow-hidden"
          style={{ top: 1, left: 1 - dx, width: w + ext, height: h, clipPath: `path("${clip}")`, background: placeholder }}
        >
          {src ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={src}
              alt=""
              draggable={false}
              onLoad={(e) => {
                const im = e.currentTarget;
                if (im.naturalWidth && im.naturalHeight && (im.naturalWidth !== natural.w || im.naturalHeight !== natural.h)) {
                  if (!parsed || Math.abs(parsed.w / parsed.h - im.naturalWidth / im.naturalHeight) > 0.01) {
                    setLoaded({ src, w: im.naturalWidth, h: im.naturalHeight });
                  }
                }
              }}
              className="absolute block object-cover"
              style={{ left: 0, top: 0, width: w + ext, height: h, maxWidth: "none" }}
            />
          ) : (
            <span className="absolute flex items-center justify-center" style={{ left: dx, top: 0, width: w, height: h }}>
              <span className="flex items-center justify-center rounded-full" style={{ width: 48, height: 48, background: "rgba(0,0,0,0.5)" }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M12 5v13M6.5 12.5 12 18l5.5-5.5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </span>
          )}
        </div>
        {!caption && (
          <MetaPill
            time={ctx.time}
            mine={ctx.mine}
            status={ctx.status}
            bg="rgba(0, 0, 0, 0.3)"
            animate={ctx.animate}
            style={{ right: 7, bottom: 7 }}
          />
        )}
      </div>
      {caption && (
        <div className="relative" style={{ padding: `${7.12 - 1}px 10px ${TEXT_PAD_BOTTOM}px`, width: w + 2 }}>
          <TextWithMeta ctx={ctx} text={caption} />
        </div>
      )}
      {footer && ctx.react && (
        // ChatMessageReactionsFooterContentNode: chips at the text inset, 2pt bottom inset
        <div style={{ padding: "5px 10px 6px" }}>
          <ReactionChip r={ctx.react} t={ctx.t} outgoing={ctx.mine} />
        </div>
      )}
    </BubbleShell>
  );
}

function EmojiMessage({ ctx, count, freeBg }: { ctx: RowCtx; count: number; freeBg: string }) {
  const single = count === 1;
  const fontSize = single ? 100 : Math.floor(94 * (count === 2 ? 0.84 : 0.69));
  return (
    <div style={{ margin: ctx.mine ? "0 -1px 0 0" : "0 0 0 -1px" }}>
      <div className="relative">
      <div
        dir="ltr"
        style={
          single
            ? { width: 132, height: 132, display: "flex", alignItems: "center", justifyContent: "center", fontSize, lineHeight: 1 }
            : { padding: "16px 0 20px", fontSize, lineHeight: 1.19, whiteSpace: "nowrap" }
        }
      >
        {ctx.m.text.trim()}
      </div>
      <MetaPill
        time={ctx.time}
        mine={ctx.mine}
        status={ctx.status}
        bg={freeBg}
        animate={ctx.animate}
        style={{ right: 4, bottom: single ? 4 : 0 }}
      />
      </div>
      {ctx.react && (
        // free-standing reactions sit under the sticker, on the service fill when not chosen
        <div className={`flex ${ctx.mine ? "justify-end" : "justify-start"}`} style={{ paddingTop: 4 }}>
          <ReactionChip
            r={ctx.react}
            t={{ ...ctx.t, react: { ...ctx.t.react, inOther: freeBg, outOther: freeBg, outChosen: ctx.t.react.inChosen } }}
            outgoing={ctx.mine}
          />
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Motion                                                             */
/* ------------------------------------------------------------------ */

function bezier(x1: number, y1: number, x2: number, y2: number) {
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;
  const sx = (t: number) => ((ax * t + bx) * t + cx) * t;
  const sy = (t: number) => ((ay * t + by) * t + cy) * t;
  return (x: number) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let t = x;
    for (let i = 0; i < 8; i++) {
      const d = sx(t) - x;
      const dd = (3 * ax * t + 2 * bx) * t + cx;
      if (Math.abs(d) < 1e-6 || Math.abs(dd) < 1e-6) break;
      t -= d / dd;
    }
    t = Math.max(0, Math.min(1, t));
    return sy(t);
  };
}

/** ChatMessageTransitionNodeImpl curves. */
const VERTICAL = bezier(0.19919472913616398, 0.010644531250000006, 0.27920937042459737, 0.91025390625);
const HORIZONTAL = bezier(0.23, 1, 0.32, 1);

/**
 * Telegram iOS entrance. Outgoing: the message leaves the input field — 0.3s, rising from the field
 * (vertical curve) while sliding in from the field's leading side (horizontal curve), growing out of the
 * composer. Incoming: inserted into the list — content shifts up by the new row while it fades in (0.2s).
 * The chat layout is never mirrored on iOS, so `rtl` does not change the motion.
 */
export const telegramIosMotion: PlatformMotion = {
  enterMs: ENTER_MS,
  enterStyle: (p, mine) => {
    const q = Math.max(0, Math.min(1, p));
    if (mine) {
      const v = VERTICAL(q);
      const hz = HORIZONTAL(q);
      return {
        opacity: +Math.min(1, q / 0.25).toFixed(3),
        transform: `translate(${(-(1 - hz) * 28).toFixed(2)}px, ${((1 - v) * 50).toFixed(2)}px) scale(${(0.9 + 0.1 * hz).toFixed(4)}, ${(0.86 + 0.14 * v).toFixed(4)})`,
        transformOrigin: "right bottom",
      };
    }
    const v = VERTICAL(q);
    return {
      opacity: +Math.min(1, q / (200 / ENTER_MS)).toFixed(3),
      transform: `translateY(${((1 - v) * 38).toFixed(2)}px)`,
      transformOrigin: "left bottom",
    };
  },
};

/** Layout spring of the input panel, approximated (0.4s, fast start, long settle). */
const SEND_MS = 400;
const SPRING_CSS = "cubic-bezier(0.22, 1, 0.36, 1)";

function buildCss(): string {
  let css = "";
  for (const mine of [true, false]) {
    let frames = "";
    const steps = 20;
    for (let i = 0; i <= steps; i++) {
      const p = i / steps;
      const st = telegramIosMotion.enterStyle(p, mine, false);
      frames += `${(p * 100).toFixed(1)}%{opacity:${st.opacity};transform:${st.transform};transform-origin:${st.transformOrigin}}`;
    }
    const name = `tgi-in-${mine ? "me" : "them"}`;
    css += `@keyframes ${name}{${frames}}.${name}{animation:${name} ${ENTER_MS}ms linear both}`;
  }
  let dot = "";
  for (let i = 0; i <= 20; i++) {
    const d = typingDot(i / 20, 0);
    dot += `${i * 5}%{transform:scale(${(d.d / 4.5).toFixed(3)});opacity:${d.a.toFixed(3)}}`;
  }
  css += `@keyframes tgi-dot{${dot}}.tgi-dot{animation:tgi-dot ${TYPING_MS}ms linear infinite}`;
  css += `@keyframes tgi-chk{from{transform:scale(1.3)}to{transform:scale(1)}}.tgi-chk{animation:tgi-chk 100ms ease-out both;transform-origin:center}`;
  css += `@keyframes tgi-fade{from{opacity:0}to{opacity:1}}.tgi-fade{animation:tgi-fade 200ms ease-out both}`;
  // UIKit caret: solid while typing, then ~0.53s off / on
  css += `@keyframes tgi-caret{0%,50%{opacity:0}50.01%,100%{opacity:1}}.tgi-caret{animation:tgi-caret 1060ms steps(1,end) 500ms infinite}`;
  // send button: alpha 0.2s easeInOut + blur 4→0 0.18s; scale-in and the icon's (−22, 18) slide ride the layout spring
  css += `@keyframes tgi-send{from{opacity:0;filter:blur(4px);transform:scale(.001)}45%{filter:blur(0)}50%{opacity:1}to{opacity:1;filter:blur(0);transform:none}}.tgi-send{animation:tgi-send ${SEND_MS}ms ${SPRING_CSS} both}`;
  css += `@keyframes tgi-send-icon{from{transform:translate(-22px,18px)}to{transform:none}}.tgi-send-icon{animation:tgi-send-icon ${SEND_MS}ms ${SPRING_CSS} both}`;
  return css;
}
const TGI_CSS = buildCss();

/* ------------------------------------------------------------------ */
/* Composer (compose typing)                                          */
/* ------------------------------------------------------------------ */

const SPRING = bezier(0.22, 1, 0.36, 1);

/** Field geometry (ChatTextInputPanelNode): text insets 5+4.5 top, 4+5.5 bottom; one SF 17 line = 20.29pt. */
const FIELD_LINE = 20.29;
const FIELD_PAD_V = 9.5;
/**
 * Right text inset with text: accessory (4 + 32 − 2 − 14) + send (40 − 10) + internal 11 = 61, plus the
 * UITextView line-fragment padding, so wrapped lines clear the sticker icon (its left edge is 72pt in) by 4pt.
 */
const FIELD_TEXT_RIGHT = 76;

/**
 * Exporter clock bookkeeping: ms since `key` last changed (undefined when not exporting) and whether that
 * value is the one we started with. Derived state updated during render (React's documented pattern).
 */
function useSwitchClock(key: string, clockMs: number | undefined): { since: number; initial: boolean } | undefined {
  const [mark, setMark] = useState<{ key: string; at: number | undefined; initial: boolean }>({ key, at: clockMs, initial: true });
  let cur = mark;
  if (mark.key !== key) {
    cur = { key, at: clockMs, initial: false };
    setMark(cur);
  }
  if (clockMs === undefined) return undefined;
  return { since: Math.max(0, clockMs - (cur.at ?? clockMs)), initial: cur.initial };
}

/** Chat/Input/Text/SendIcon (send.pdf, 30×30): the Telegram paper plane, white. */
const SEND_PLANE_D =
  "M1.374896 9.472263C1.374896 9.472263 9.427943 12.958834 12.114815 14.069384C17.229191 16.183283 18.291916 16.550489 18.984585 16.562614C19.13693 16.565281 19.477566 16.527763 19.698214 16.349846C19.884525 16.199615 19.935787 15.996675 19.960318 15.85424C19.984848 15.711806 20.015392 15.387336 19.99111 15.133804C19.713961 12.240038 18.514738 5.217632 17.904642 1.976564C17.646488 0.605147 17.138172 0.145317 16.646065 0.100317C15.576601 0.002522 14.764499 0.802658 13.728671 1.477396C12.107805 2.533228 11.192119 3.190486 9.618788 4.220782C7.800531 5.411469 8.979231 6.065889 10.01545 7.135397C10.286633 7.415293 14.998713 11.674402 15.089916 12.06077C15.101322 12.109092 15.111909 12.289213 15.004227 12.384323C14.896544 12.479433 14.737615 12.446909 14.622927 12.421043C14.379076 12.366045 6.854864 7.318857 6.854864 7.318857C6.854864 7.318857 5.752395 6.566566 4.857699 6.585774C4.200145 6.599892 2.935277 6.955233 1.994976 7.258969C0.84166 7.631515 -0.074973 7.828483 0.004845 8.46118C0.067207 8.955502 1.374896 9.472263 1.374896 9.472263Z";

/** The typed text block (shared by the field and the list's bottom spacer so both grow alike). */
function DraftText({ text, color, caret }: { text: string; color: string; caret?: ReactNode }) {
  return (
    <div
      dir={dirOf(text)}
      style={{
        padding: `${FIELD_PAD_V}px ${FIELD_TEXT_RIGHT}px ${FIELD_PAD_V}px 12px`,
        fontSize: 17,
        lineHeight: `${FIELD_LINE}px`,
        letterSpacing: "-0.4px",
        color,
        textAlign: "start",
        whiteSpace: "pre-wrap",
        overflowWrap: "break-word",
        wordBreak: "break-word",
      }}
    >
      {text}
      {caret}
    </div>
  );
}

/** UITextView caret: 2pt, tint colour. Solid right after a keystroke, then blinks. */
function Caret({ color, clock }: { color: string; clock?: { since: number } }) {
  const visible = !clock || clock.since < 500 || Math.floor((clock.since - 500) / 530) % 2 === 1;
  return (
    <span
      aria-hidden
      className={clock ? undefined : "tgi-caret"}
      style={{
        display: "inline-block",
        width: 2,
        height: 20,
        margin: "0 -2px 0 0",
        verticalAlign: "top",
        borderRadius: 1,
        background: color,
        opacity: visible ? 1 : 0,
      }}
    />
  );
}

function Composer({
  t,
  placeholder,
  text,
  clockMs,
  live,
}: {
  t: IosTheme;
  placeholder: string;
  text: string | null;
  clockMs?: number;
  live: boolean;
}) {
  const on = text !== null;
  const sw = useSwitchClock(on ? "on" : "off", clockMs);
  const keyClock = useSwitchClock(text ?? "", clockMs);
  const exporting = sw !== undefined;
  // 0 = empty composer, 1 = typing layout (field to the edge, mic off screen)
  let k = on ? 1 : 0;
  if (sw && !sw.initial) {
    const p = SPRING(Math.min(1, sw.since / SEND_MS));
    k = on ? p : 1 - p;
  }
  const move: CSSProperties = exporting || !live ? {} : { transition: `right ${SEND_MS}ms ${SPRING_CSS}` };
  const fieldRight = 54 + (8 - 54) * k;
  // send button (export: computed from the clock; live: CSS keyframes on mount)
  let sendStyle: CSSProperties | null = null;
  let iconStyle: CSSProperties = {};
  if (on || (sw && !sw.initial && sw.since < 200)) {
    if (sw && !sw.initial) {
      const s = sw.since;
      const sp = SPRING(Math.min(1, s / SEND_MS));
      sendStyle = on
        ? {
            opacity: Math.min(1, s / 200),
            filter: s < 180 ? `blur(${(4 * (1 - s / 180)).toFixed(2)}px)` : undefined,
            transform: sp < 1 ? `scale(${Math.max(0.001, sp).toFixed(4)})` : undefined,
          }
        : { opacity: Math.max(0, 1 - s / 200), filter: `blur(${(4 * Math.min(1, s / 180)).toFixed(2)}px)` };
      if (on && sp < 1) iconStyle = { transform: `translate(${(-22 * (1 - sp)).toFixed(2)}px, ${(18 * (1 - sp)).toFixed(2)}px)` };
    } else {
      sendStyle = {};
    }
  }
  const animateSend = !exporting && live;
  return (
    <>
      <div className="absolute flex items-center justify-center" style={{ left: 8, bottom: PANEL_BOTTOM, ...glass(t, { w: 40, h: 40 }) }}>
        <AttachIcon color={t.control} />
      </div>
      <div
        className="absolute"
        style={{
          left: 54,
          right: fieldRight,
          bottom: PANEL_BOTTOM,
          minHeight: PANEL_H,
          ...glass(t, { h: PANEL_H }),
          height: undefined,
          borderRadius: 20,
          ...move,
        }}
      >
        {on ? (
          <DraftText text={text} color={t.text} caret={<Caret key={text.length} color={t.sendFill} clock={keyClock} />} />
        ) : (
          <div className="flex items-center" style={{ height: PANEL_H, paddingLeft: 12, paddingRight: 44 }}>
            <span
              className="flex-1 truncate"
              dir="auto"
              style={{ fontSize: 17, lineHeight: "21px", letterSpacing: "-0.4px", color: t.placeholder, textAlign: "left", marginTop: -0.5 }}
            >
              {placeholder}
            </span>
          </div>
        )}
        {/* sticker accessory: 32pt slot 4pt from the trailing edge, left of the send slot while typing */}
        <span
          className="absolute block"
          style={{ right: 4 + 4 + (on ? 40 : 0), bottom: 8, width: 24, height: 24, ...(exporting || !live ? {} : { transition: `right ${SEND_MS}ms ${SPRING_CSS}` }) }}
        >
          <StickerIcon color={t.inputControl} />
        </span>
        {sendStyle && (
          <span
            aria-hidden
            className={`absolute block ${animateSend ? "tgi-send" : ""}`}
            style={{ right: 3, bottom: 3, width: 34, height: 34, borderRadius: 17, background: t.sendFill, ...sendStyle }}
          >
            <span className={`absolute block ${animateSend ? "tgi-send-icon" : ""}`} style={{ left: 2, top: 2, width: 30, height: 30, ...iconStyle }}>
              <svg width="30" height="30" viewBox="0 0 30 30" aria-hidden className="block">
                <path fill="#ffffff" fillRule="evenodd" transform="matrix(1 0 0 -1 4 23.562744)" d={SEND_PLANE_D} />
              </svg>
            </span>
          </span>
        )}
      </div>
      <div
        className="absolute flex items-center justify-center"
        style={{ right: 8 + (-48 - 8) * k, bottom: PANEL_BOTTOM, ...glass(t, { w: 40, h: 40 }), ...move }}
      >
        <MicIcon color={t.control} />
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Component                                                          */
/* ------------------------------------------------------------------ */

export function Telegram({ scenario, playback, lang, rtl }: PlatformProps) {
  const dark = scenario.theme === "dark";
  const t = dark ? IOS_DARK : IOS_LIGHT;
  const s = TGI_STRINGS[lang];
  const { messages, typing, clockMs } = playback;
  const live = playback.isLive && clockMs === undefined;
  const draftText = playback.draft ? playback.draft.text : null;
  // the draft is in the key so a growing field (taller bottom inset) keeps the newest message in view
  const scrollRef = useChatScroll<HTMLDivElement>(`${messages.length}-${typing}-${draftText === null ? -1 : draftText.length}`);
  const byId = new Map(scenario.messages.map((m) => [m.id, m] as const));
  const rootRef = useRef<HTMLDivElement>(null);
  useScreenGradient(rootRef, scrollRef, dark, `${messages.length}-${typing}-${dark}`);

  // Re-render once on the client so the check-pop only plays for status changes, not on first paint.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const showTyping = typing || scenario.presence === "typing";
  const online = scenario.presence === "online";
  const subtitle = online ? s.online : scenario.lastSeenText.trim() || s.lastSeenRecently;
  const dateChipBg = serviceFillAt(dark, 0.5, (LIST_TOP + 17) / SCREEN_H);
  const freeBg = serviceFillAt(dark, 0.3, 0.6);

  return (
    <div
      ref={rootRef}
      dir="ltr"
      className="relative h-full w-full overflow-hidden"
      style={{ background: dark ? "#000" : "#a9c38f", color: t.text }}
    >
      <style>{TGI_CSS}</style>
      <Wallpaper dark={dark} />

      {/* Message list — scrolls under the floating glass bar and input panel */}
      <div
        ref={scrollRef}
        className="rcss-scroll absolute inset-0 overflow-y-auto"
        style={{ paddingTop: LIST_TOP, paddingBottom: LIST_BOTTOM - PANEL_H }}
      >
        {messages.length > 0 && (
        <div className="flex items-center justify-center" style={{ height: 34 }}>
          <span
            dir={rtl ? "rtl" : "ltr"}
            className="text-white"
            style={{
              height: 22,
              lineHeight: "22px",
              padding: "0 6px",
              borderRadius: 11,
              background: dateChipBg,
              fontSize: 13,
              fontWeight: 500,
              letterSpacing: "-0.08px",
            }}
          >
            {s.today}
          </span>
        </div>
        )}

        {messages.map((m, i) => {
          const mine = m.sender === "me";
          const { firstOfGroup, lastOfGroup } = groupInfo(messages, i);
          const ctx: RowCtx = {
            t,
            m,
            mine,
            first: firstOfGroup,
            last: lastOfGroup,
            status: playback.statusOf(m),
            animate: mounted && clockMs === undefined,
            react: m.reaction
              ? { emoji: m.reaction, by: mine ? scenario.them : scenario.me, chosen: !mine }
              : null,
            quote: m.replyToId ? quoteOf(byId.get(m.replyToId), scenario.me, scenario.them, s) : null,
          };
          const emoji = m.type === "text" ? emojiCount(m.text) : 0;
          let body: ReactNode;
          if (m.type === "voice") body = <VoiceBubble ctx={ctx} />;
          else if (m.type === "image") body = <ImageBubble ctx={ctx} />;
          else if (emoji > 0 && emoji <= 3) body = <EmojiMessage ctx={ctx} count={emoji} freeBg={freeBg} />;
          else body = <TextBubble ctx={ctx} />;
          return (
            <div
              key={m.id}
              data-mid={m.id}
              data-sender={m.sender}
              className={`flex ${mine ? "justify-end" : "justify-start"} ${live ? (mine ? "tgi-in-me" : "tgi-in-them") : ""}`}
              style={{
                paddingTop: firstOfGroup ? SPACING : 0,
                paddingBottom: lastOfGroup ? SPACING : 0,
                paddingLeft: 10,
                paddingRight: 10,
              }}
            >
              {body}
            </div>
          );
        })}
        {/* bottom inset = input panel height (grows with a multi-line draft, like the real list inset) */}
        <div aria-hidden style={{ visibility: "hidden", width: SCREEN_W - 54 - 8, minHeight: PANEL_H }}>
          {draftText !== null && <DraftText text={draftText} color="transparent" />}
        </div>
      </div>

      <EdgeEffects dark={dark} />

      {/* Status bar + glass navigation */}
      <div className="pointer-events-none absolute inset-x-0 top-0" dir={rtl ? "rtl" : "ltr"}>
        <StatusBar device={scenario.device} tint={dark ? "light" : "dark"} background="transparent" />
      </div>
      <div className="absolute flex items-center justify-center" style={{ left: 16, top: BTN_TOP, ...glass(t, { w: 44, h: 44 }) }}>
        <BackChevron color={t.control} />
      </div>
      <div
        className="absolute flex flex-col items-center justify-center"
        style={{
          top: BTN_TOP,
          left: "50%",
          transform: "translateX(-50%)",
          ...glass(t, { h: 44 }),
          padding: "0 14px",
          minWidth: 150 + 28,
          maxWidth: SCREEN_W - 2 * (16 + 44 + 10),
        }}
      >
        <div
          className="max-w-full truncate"
          dir="auto"
          style={{ fontSize: 17, lineHeight: "21px", fontWeight: 600, letterSpacing: "-0.43px", color: t.control }}
        >
          {scenario.them.name}
        </div>
        <div className="flex max-w-full items-center justify-center" style={{ height: 15, fontSize: 12, lineHeight: "15px" }}>
          {showTyping ? (
            <span key="typing" className={`flex items-center ${live ? "tgi-fade" : ""}`} style={{ color: t.accent }}>
              <TypingDots color={t.accent} clockMs={clockMs} />
              <span dir="auto">{s.typing}</span>
            </span>
          ) : (
            <span
              key="status"
              dir="auto"
              className={`truncate ${live ? "tgi-fade" : ""}`}
              style={{ color: online ? t.accent : t.inputControl }}
            >
              {subtitle}
            </span>
          )}
        </div>
      </div>
      <div className="absolute flex items-center justify-center" style={{ right: 16, top: BTN_TOP, ...glass(t, { w: 44, h: 44 }) }}>
        <TgAvatar person={scenario.them} size={38} />
      </div>

      {/* Input panel */}
      <Composer t={t} placeholder={s.placeholder} text={draftText} clockMs={clockMs} live={clockMs === undefined} />
      <div className="absolute inset-x-0 bottom-0">
        <SystemBottomBar device={scenario.device} bg="transparent" fg={dark ? "#ffffff" : "#000000"} />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Assets                                                             */
/* ------------------------------------------------------------------ */

/** generateGradient() output for the light default wallpaper, 36×80 (the iOS bitmap size), PNG. */
const TGI_GRAD_LIGHT = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACQAAABQCAIAAAD+0UAYAAAOg0lEQVR42qXV53LbSJeAYdzw7s7Y4xmP41iB6EaDOecsZopRDAgECWYqy/bM5WydbgAEKdn1zW7VKf196j19CHHbJ7J5IutHsnokywcyfyCze0G7E9RbQb4RRtf4aoe7G3y5RvUVqiz44pzPzfj01JHQHNGJI6SeB5Rzn3zukc7d0plzfCaOzsjoTBidCcMzPIS/wuicwDi43ROxe4sHot+T6Z0wuROUW2F8jQc73Nvi1ho1VqiyRBdzPqf/EHONz8QxYJYnDM8ZJgL2lVje8zjpRhhe4/4WtzeAVX+MeQE7d42P44SRDbv+Ku6+vhzHNmlhzf8DZkpk5BDHFLv+Qdzkzni2/hZ3NvjfYoRKNoznbgA7iFs+/n+wc+f4XDQAaxziyOG0MPBonLVJ9myKeZAHGL3GuOaIqo6QYj+QPSYeYWMTO4qznk2jB/kTLMIw+Rl2EAdZ4ph3jXnu9ptoxv0LLDV1xCc/xOxxorlD1xgZ2I25SePZjjDzzSoLVDzEgsq5/8eYaGYBJlHMirOebY/Bmwn09HHDxLIUi9kw70+wsZHlPsa+/geYDlhSAyxsYdIxRl+OSQbmkfARJh5h1um31/8BNgbM9BzOvcS7pR9j9PTJhH1BjG8jri9ReYEKOp+xYdaP7KcYckvYKwtHBwLYyoZJR9icYlPe+EUrjoDssK7Dhr2QtcesLHb6c/g2EvgQXwsD418Mri1RaY7y8PmgmGpi0hF2IFlZPpnYsKeDB5sa/2IE8+4x/ZGh/Ixixo/M4Zcd1g4p5rDNPssnC36FcLd0h0bW/ltFNOOfJ5xiZ02xBWD0R8bHJzy9+yPsmcSyJMgKKCL3PIvt0HwwocdOcclOEcGPTDvGzB2+nOWlWUHFaWDbJ3HzaP9QEeUGdjjYCd2N/TpQdsonNT424endO3yAOV7OAgl5YYeQFVKd3POs2Z1x9KOdcLUV2IPVFnAdhRnKWJjiCMIpOjyAGWNboC1Lhqyw6uJezFJv4A5hhxu2Q/pgOsrPEL0OPqryYYUPPMPo2CR6GiwrMnFzNEs8zCJWFhz9CteXuDyHB8vNUFozsBDDJLbGQwk+TvusgCKGVVd04uGMrAeyuCf6HdFu91n9jdBesx1itsPsFKU0RK+DYTzDzDj+eZZfEYMKZMU1L2fPmh5nCS2aVZljtsPMFCU1FFPtGO+VeI/EH0oHWSGaldB8nJU1o1nGEW6FHstaQlZ5joszlJuitIYSExRTUVjhg/IB5jmS6G/LL4v0NNwxzZOc+jnbJ4OoN4QtEI5wLVzuszDLojtEUcBQUOb9dgzGkugCzSy2w/QswK0O7oKMd2bWSqBHiEs6Ls4wy0rSrIiCQoAhv4xMDNkl45NhZU08yakvMwtyxr+uWzNrC3cBWeYCIWuKMxpOTVBcNbJCMgrIyC8hH/xsYQ4lluW0slJTf04PcfusawJ3sRG6sEChvoAFlnRcmOHsFKc1nDCz6A6PMa8lSVQys9hppGeB/DzM6cZdmAtcCy1YoFCdWwsEKTnBcRVHFSMrSCWKYe9+QLLuArJUD8vK6sHiPMJBFiyQsAW2V0JzKcACTYkuECdUHFNwRMEhGQdlHJCwX8I+OgeSBFJAdoYUF83yGll6uLSIcixrtCPGApdCfSFUdHwxs55qL4Vtkg0TDiVjgTTLl5z6s7NgYR4pL2McvQuyX+ACFsikrF2SqSSBZMsSbEP8kggLpFkROEJvQvOnp4GcHr5YRKurBKfAXRC4QLrA6lwozXDhuSQZkn8M4xsL+5EIHZEtMMgWqHriE19yGsjMQpC1iNVXSY5lGQucC/BUU5zTcNomhZh0yHhhiG9sShKVZFdIgQWaWcGcHi7Oo5VlvLlOcSyrTRdY0QU4CiYpOCabksFg30jwsqGSiYl0gYYUVj1R1Ruf+FMsS4+UFrHaKnm5SXODLemu9wvMazgzwUkmSTg0pkEj7BthxniMId4R8Y5F31j0SU6/5AzIrqDsDiueiOqNTXxJLWDLSjTWqfY2y/Xh0w4XWNaFwpRKqiEFLWaIPUPBMxTcxhDPiHhGIsWoJIEUolJU9SUgK5idhWlWnGV1tzkOshZCVReK7ChUHLdJlMHuAXYPBBebIXHDiBRzUswVkNxB2RNWQIpP/DQrlNMjxXkMslap9ibb3+W5Fr2L0kzIazit4rhyILkH2DXAzoFgDnEOiMvAnN6R0zd2+UFyh2RPRPHGVH9iEkhNQzQryrKa63RnmxtcF7gmuwu6wISCo/SdLMl5hUUYgdARr4gInugaiu6h0zty+cZu/0FWIKkFM9NwXo9cmFmtTba3yw9vLjiWlaMLjMl7yUUl0ocR+gIdQq6IeCUCNnC6hy6GBSRPSPZGFF9MDSQmwTRkRQp6rLRI1Jap5jrT2eaurgvj2xJXoXeRpk8VlnCASTQImB7GPcGYPqGeKF45nQbm9o09Ackbkn0RxR+fBJNaKDON5PXoxTxeWSYbq7SRdX0h35Y5yKK3HpVwkG3vCotQg3EPoy7muwIb1CO4Jwp9kQDmcg/d3pHHP/YGJV9Y9kchK5TWwtlZtKDHyvasXXF8U1LuKlxhKqTNBfroO4k0CPUw38WOLnZ0BEdXcHQJ3yWoJ+K+k1w5xYHLtcf8ESUQU4PJSRiyZrGLeaKySDVWmdYm19sVhtcX0m15cl/lWFaELtBD30mgQY4uPu/gMxjhrCOcdwj1RNRzCn2XeOV2DT3ekdc/9oVkf1QJxtVQSotkp9GCHi8vkrVlurnOdrb5q11xRLOm9zWOZQWNp0Kkh0DqUKmNT2EEmA4564gOOzYALDD2h+RAVAklJuG0Fs3P4gdZ28KAZd1VZw91LkGz/PBUSOwj3EUOGnTaxictfNISvrSEk5Zw0ianHfG8I/JdJwbM4xp4vSNfYOwPy8GYGk5OItlprKAnSnMza2Nm3Va0+5r+2OCMrAFy9hHuIb6DztrotI2/tGD+agl0yJcWOW2LZx2no+vCPTcxMH9ACkTkUFwNp7Robhov6snKIt1YZVvrfG9bZFkqzVo8Nrnw2MgiPcR30XkHnbYRMJf4M4xAh/zVIidt8ZRiyMB83pE/KAUjcjihRjJaLD9LlOap2jLTXOU6m0J/dzG6Kcss66GxfLrkaBY2F8gkxKRPTfypKcBcks+X5EtLPG07zzsU63tdA59vFAhKoagSTk6i2Wm8oCfL83R9aWWVpJuKelebPtTnj83VU4tjWYK5QCqhT0380RiBDvkEceKJgXko5veNAiEpFFMiqUksN01c6KnqArLaLOu6LN9Wtfs6y1p/bXEe+lqoi87b6MSQ0Mcm/tBgI8A0yacm+Xwpfmk5zzpuvmthwZAUjinR9CSenyVL83Rtmb1c57vb4mBXGrOseyNr87XNuWgWW6ApoQ8N/N4Y4T14hMbZMZ97EPCPgmEpHFdjGS1RmKXK80xjmWuvC/3txZBmTe7qs4fG4hGytt86HHutc7rAz5dMQu8b+F2djfAOPPKhQT41xb9artO2HQuF5UhCjWW1RFFPVxfZ5irf2RSvaJZyW5veN+aPzSXN2n3rcOy1Ts0FUgm9q+M/jRH+rAvv6uR9Q/zYFP+6ZJjXwMahiBxNqvHsNHmhp2uL3OW60KVZ0o0t6wmyrr93OWRm2STEpLcwAvXIuwb50BQ/U8wBmN89CAbG4agcTU0SuWmqpGfqy3x7XexvS6NryNLuG/rDPuvme5dzmFkfm5aE3tYwHQGGYXXyoQHYyTEWS00S+Wm6PM82lvnO5uJqVx7fVNW7+vQeslZPre3XzvW37u33HndmywKpht7W0B81TEf4w/DIn3STn2yYZxAKjiMxJZaeJAuzdGWea64K3c3FYFeRb2qTuzpkPbbWZtbt3z3OyGqg90YT+uMQox55u8c8jq6P9AOeIcPiGS1ZnGWqi9zlqtgzdwin8XBJL76z+9a9+d67+7vPfTHvwpJ+r6Lfq5gOw8hbOu8bzk9N10nLjkXjgKUu9ExtkW/Bg5XH17DD2X1z8dhaP7XZadx+793/3ec+06x3BxJ6U8VvKEY9Al5dfIaFQ4AlslqqpGfry0J7DQ8mwQ4b+sPl8jALsE/0Lv6s80x6Ywyms8f+tGE8xbzDcEiKJpRETkuX9GxjWehsSuzBNGOHbes0APunz9Es/m2N/73KA1NBv8EcYG8t7NJ90gZM7Ae9w3BYiiXURG6aLuu5xrLQ3ZSGu4pyW5+aO2RZt3/DDh/+ueI+GFn8myr/myEBRj0LExn2GTAv3/VbWFJN0rvPNVfF7qY0uq4qt8aDbexZDNtnVQB7bYyBgWdiHxquz5fu0z0WMbFMZZ6HU9yUR9dV9bYxu79cMux77wCzZfGvD7HfKnvsXd15gF0FfYDFbdhFD06xphrXAQ8GO/zep9gVYCyLSvyrMmLzuoJfGxh5jqGu33kV8g0jESmeUpOFaaZKMXr3xika13GEWVmvymyY9wL2sen669Kzx0YMS72ILY1TPFzjH/S1aBb/Kwz69afYWduHuoFDLFud51uAVfbYY5sdyI0d+93MAqnE/1oysFcvYG475h9FX8TUu8bMxIzTZ5v854p7UzWzSvwvMIh6mMZRrCoC1rBhvRewSwuj10h/Z4DZn42D06BZv5jYLy9h7xsuwFqA4R9gvW15dIhtv3avv/X2nytrh7+U+P+BOcB+MzAnw760PGedFzDj9OF3VlNuG9P75vyhtXo63iTHdmhKgFEP/8qwyhHmfY7lKdak2HAHXxCNYksTs+K417as/76AseL+Hba86FJMvqlrd012kGyTVhzHTgOaLo6xV+WfYb4hYEnAMmU931gWO5vyYFeVbuqTO3i2+eN+kyyOe3WYRQc2+WvpAHtXN7H2HqOfq1ROM7F16YoeJHs2/aFlj7v+3uPsO/wvOgz7hWKvK+RNlRxhxo+aYgkFsJKeqy2KrVWpt6kMdzUZ4prsJlkcPcvu/wIaJqJ8pUopAAAAAABJRU5ErkJggg==";
/** Same for the dark default wallpaper, pre-multiplied by its 34% content alpha over black. */
const TGI_GRAD_DARK = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACQAAABQCAIAAAD+0UAYAAAM30lEQVR42p3YZ3LruKKFUc2kbYtEBkhlkmLOObjnP5dXAElF+/S5r+r7v2pDksvApiJDRfpa1tWkrWlT07qmZUPzhqYNjVsWtszv2LVjds/OPT/2fDdwY+B8FHQUeBRwEvoktElsJ/E1ic/J+FD9c2s0PkbjY6Ow2etkC1Y1tGho1tCkpVHLgpa5HXM6dlHYfsH4DQN/iY3P3jyuuo1r5bigZd6Knd6x8QVbvJ+x8ekw7yc5j5tPcsasR2x4wvQ37ONRGozPTUWm13G0fTvJGbtKjM2Y+Qv2w0m+Y+NPJ/mI+a3COoX1b9j483fkY1y7Ye/jHr+TSSO/I/8jtno36QV7GSexevkBvGCHGzY8YOMb9jirN742Ffl+G/cb5nbM7uRP7VdsFNtRfKk+R+PzcdY7toyrSFuT28cmsYbKn1qrsE5h/X9ii7dIL9j0gHU3rFZ/R37FOB5esadxt1mdsZ2x73es+gPG/hYbHmb9iI03rCILViusUVj7H9j9JIe5VWoN7QW7jfsJo3esU1i/YsMrth1WrP97rPprbBD6IDTVdu2rl9h2lhpD/49jrMiC1QprFNYumHjDnrx+7Y6V5Fs1qcaSDOUzVv2IMbNTWP8LdpfEItUG+BkrSVs+YJXCauo21G4U1v4R69c6VSskVhnwT1g5Y+SO1Xds13HRKax/wvQfJCFnVeIJG1esU1hdkrIk+YxVD1ijsFZiTGJcYr1MX7tJeiv0RkipFOgFm2c9YSVJSxJVNKgUVkvseMM6TnqO+mesU92kWmGFwK9YQfqCdAVpC1IXD1ipsIraNb007NiwXcuM9o7B2etkP0ilQLkgMzYVsrG4Y82MFSQvZowEpcIqeqkV1qxYx3HHYSdgt2CgVTWqWsBKoELgXFCJFTOGxwIPBe4L3CqsumHFipXUmbGa7RXGW04VhlYPPkhwlkopkUywTUG+CzxLEstxn+M2x02Oq5yUOclzhRUkKIjESnqp6Klm+5qZDZNYy0nLkQq2EoON6iYVUqKp4JsCL1i+SN0dw0WOs5wkOYlyiXnFilXsUDOzZqLhrJEYXj3UCFkt0CrJWalgiRALlj9gGW4zXGe4ynCR4SzDC5YTryBOQa2Snip6qNiuZkbNeMNpw0nDsQo1fJEqgW+zEsEjYUgsX7EM99lPWIajTGE5uRbUKui5VFilsJqzWnk1x3MVx0oihSC5PEAWCxEKc5OvWLZiKW5TXKe4SnGR4izFSYqjDAcZ8TJyzYld0HNBjyXdl8ysmKikR1WkUpWcKInmgmbqACNhBGK3UdKUKSzFfSqxJsV1gqsEFwnOEpwmOE5xmCosI3ZOLzk9FfRQsl3JjIrxirOK07lSVXCaC5YJlgoeCyMUpi/2GyVJLMVDivoEdQlqElQnqEpQEaMFS3CYYD8lbkqcjEgsp4eC7gpmlkyUjJeczRVSYjlnGedKEpEwA7H3xHGjpClFY4qGRGJtjJoY1TGqYonlMUpjHMc4jLGfYDchTkqsjJwzeszpPme7ghkFEwXjBeczk3MuJS4SYUTCDMXOFwdXnDarNCZoiFEfKyxCdYSqCBURyiOURiiOcBTjIMZeQq4JsVNySekpo4eM7nJm5szImZApJuNCStyI+SzJWY44b1I0PUhdhNoINSGqQ1SFqAhRHqI0REmIoggHEfZifI2JnZBLQs4pPaZ0n7FdxsyMGTJupKpF4rv5AK/ibAtLYgkaY4VFqItgG8ImhHUAqwAWAcwDlAUoCVAUojDEfoTdCDsxsWJySegpoYeU7lO2S5k5l3AzVkmJ731+dMXJERdL2JsETbHCItiHsAthG8AmgLUPKx+WPsx9mPkw8VEcoDBAfoi9EF8jYkfkEpNzTI8JPSR0n7B9wnaxKuK7kO8DfpASP82zzsLZxAqL4BDCPoBdAFsfNj6sPVh5sPRg4cHMg6kHYx9FPgoC5AXYDbETEisil4hKL6aHmB1ito9UN8njpys/29y6COckXIlFcAzhECjMh60HGw/ULqhcULqwcGHuwtSFiQcjD4Ue8n3sBfgaYDskVkguIT1H9BTRY8iOITsEsuNNcrhlcfssrkfhbSI4hXAM4ODD3gedB1pX1lxBdQXlFRRXkF9hdoWJC2MXRS4KPOR52PWx4xM7IFZALwE9B/QUMJnPTh47ufx85ZdF4teT8PYi2IRwCmYM9B7oXNBdQXuVWO2AygGlAwoHZA5MHZhcYXRFoYt8F3sevnrK84nl04tPzz49e0zmssuVLdKFX0/cPXB/J8IF88Hggd4F/VVhDmgcUNugskFpg8IGuQ0yGyYOjB3pBVflufjqEscjtkctj1ouvSjGujLLYbbFnVk6cn/PA1NEmwBOPhg9MCipd/TO0Vtbb2y9tvTK0ktLLyyQWyCzQGrDxIaxjUIHBQ72r9i94uuVODJqzznMtpltMSmdpeTtebDjkSHijQ8mD4wuGK5gcPTe1jtbby29sfTmotcXvbro5UUvLiC/KM+CsQUjG4W29DwHuw5xHXJ1qONQx6aOzRyLXS/MPTG56SCl0OAxF+nGA5MLRiUNtt5bemfp7UXWnPX6rFdnvVQVZ5CfQXqByQXGFoosFFo4sLFvE88mrk1ci8ouzD1LyTuyRTJ5LHjCRCaxKxiVNFh6f9G7i9adtfasNSetlunVSS9PenHS8xPIziA9K++CogsKLziwsG8R70K8C/XOqhPzpcTuEucZ5fnGBdNVH5U0XLReSd1Ja09ac5TVR6066tVRL496cQTSO8H0BJMzis8oOuPwjIMzCc7EP1P/RP0jDQ4s2LNwxyKTx4aUUsZzwovNVZ8ciY0XTWJnrT9p3VFrj1p70BpVfdCqg16qpHcE2VF5JxSfUHTC4YnIjiQ80vBAwz2LpMTuEuUF5uXG0SdbHy1NYkrqj1p3kLUHrd1rzV6rVdVeL/d6cQDFAeQHKL0jSo4oPuL4iKMDke2pbMdikyUGSzi7S4hXG1uflDSetUFK2/6w7Q7bbr9t99t2t212WrPTatXi7UG+V94BpQeUHHBywPGeyHY0Nmli0ESwlLOMMSkRJUFebyx9UtJ40objdjhs+72s28na3bY1t42pNaZWm1q906udXu5AsQP5HuZ7mO1RusfpDic7kpgkMWlq0FTQVWJSwrxCvAa82VjapKRRSYOSeiV1pqw1nz1Tr0y9NEGxg7kMZSbKTJyZJDVIatBM0IzTfJHYIkHeAN5uLgo7bsfDiu22vSmT2HL7ljXysqrV8gqpVyaQngkLE+UGyg2cGyRX/yTmUqLFIrG7pPNuc9am03ZS2LjfDrvtYH715v1FoZuvxapG3DxQGaA0YGmgQt1RZJwUjMooLQmrpMTuksa7zUmbjttJSePuazBls9Srp4VOdvO0Zr61Cr1a710yjmWMlJSUUqIVZrWU2F3a8n5zktKkpAUz1KvM/IjBZZ1s2/Fty7WWaw3XG67XHNQcVjJUMVwyXFJSEVJJiT5JCuu3fNgcZ0xK4yotbzP8Xse2ssXTlQdqBlWoolhGSI1JLSXaSIk9SV982KhZk5JGQ7Y8BHGZlNgt5TGtlekNAw2DNYU1RTXFNcFKIo2UaCsldpcUNkps9zWZK/YgDUx2x+hWeVpHtZbqLQWNDDYENQQ3GDd3SWKdzp6kTzFu9l8LZqxvhPxz4J+zJKNf/b1tTyXWKawloCWwJUhKCLeItErqlNRr7C4pbNooaTK+JuNzliTG1ujXYwrbSozoHVEYhi1GrZRwC0knJbpIGnuQnjD5gjxLI5MpaU5JZG7byxasw6DDsEOoQ7iDuAMK0+kqsQeJTx9i2syzxCs20hv2uUp3rCd6j3WJIYXBBeulRFeJPUh3TD2MP0tzSnrCpIe1HkusR6BHsIeoh7gHuNclNmhUStsHacW+N+usiX9Oz5KMPGN4q1IYUhhUGFgwKSlsXGetEv9W2Cq9Y+TWLN2xAenDDQMSG3Q8aArbUiWxV0liD7OmnyWJjVi2YGjBBggGCAeApDRjWzrO2Cd7kBT2z4ytsyYqe5M+Z0n1gEGFgRXT8KgRJUlsWrHvuX8eMTnrY6KyN+kJG9Ebpkts1PC4XbBpxm6SxJS3uc9asIl8PEsPGNqqtBHqMgBGAEcdjQ/Y9EXVrAfsn0fsYdZEHjD82NeIfse0BZPSin2/Yf9u3mYtHv4dgwoDCtNnDI1bPD1g32/Yv//wfzdvs5ZeMPSCaS/Y9APGfsLeZk1YYncPPWDwDdPQ9Ih90lW6Y/++YuQHbCHfMaAwHUw6nG7YF5H9Eftx1oOH5r5kcKvSJqBNQJ8WDD5i3xKjv2A/z/ofse2Cfb9i7Pkz+3XWx4P0V9j3b9jH/wODKwYeMO0Rw3fsx3GbX89Q9QdMnzEwY9937PdxG/oH6W+xb4mhBbuPY6/e/wFkEUVCYMUcbAAAAABJRU5ErkJggg==";
/**
 * Telegram's default wallpaper pattern (fqv01SQemVIBAAAApND8LDRUhRU.tgv, 1440×2960), all 745 paths merged
 * and quantised to 1 unit (≈0.29pt on screen) — visually identical to the original.
 */
const TGI_PATTERN_D = "M583 296c0 1 1 2 2 1 10-6 21-20 19-33-1-5-4-9-9-9-7 0-10 5-13 10-5-4-11-6-17-5-5 1-9 5-10 11-3 16 15 22 27 25 1 1 1 1 1 0zm-25-19c-2-6 1-13 7-14 6-2 12 1 16 5 1 1 2 1 2 0 3-4 8-12 14-10 6 2 5 10 3 15-2 9-8 17-16 22 0 0 0-1-1-1-10-3-23-6-25-17zM1142 993c-3-4-9-3-11 1-2-2-5-2-7-1-3 3-2 8 1 10 0 1 0 1 1 1-1 0-2 2-2 3-1 0-1 0-1 1-4 8-6 21-1 30 1 1 2 1 2 2 0 0-1 0-1 0-4 3-8 7-6 12 1 1 3 3 4 3 1 0 2 0 3 0 3-1 4-1 6 1 3 3 8 1 10-3 2-5-1-9-4-13 2-1 3-3 4-5 4-8 5-19 0-27 5-4 7-11 2-15zm-17 16c1 0 1 0 1-1 1-5 7-5 10-2 0 1 1 1 1 1-1 1 0 2 1 2 1 2 2 4 2 5 0 1 0 1 0 1-5-3-10-5-15-5 0-1 0-1 0-1zm11 45c-3 3-5-2-8-3-1 0-1 0-2 0-1 0-2 1-3 1-1-1-2-2-4-2 0-2 1-4 2-5 1-1 2-2 3-3 1 0 1-1 1-1 3 2 6 2 9 1 2 3 6 8 2 12zm1-19c-2 5-8 7-12 2-1-2-2-5-2-7-1-2-1-4-1-6 6 1 12 4 15 9 0 1 1 1 1 1 0 0-1 1-1 1zm2-4c-4-5-10-9-17-9 0-3 1-7 2-10 0 0 0 0 1 0 5 1 11 3 15 6 0 0 0 0 0 0 1 5 0 9-1 13zm0-25c0 0 0 0 0 0-3-4-8-5-12-4 0 0 0 0 0-1-1-1-3-3-2-4 1-2 4-3 5 0 0 1 2 1 2 0 1-6 8-4 9 0 2 3 0 6-2 9zM17 994c-1 1-3 3-2 6 1 5 7 2 10 2 1 2 2 4 3 6 1 2 2 3 4 3 2 0 3-1 3-3 1-2 1-5 2-8 4 2 9 4 11 0 1-1 0-3-1-5-1-2-2-4-3-6 0 0 0 0 0 0 1-3 4-7 1-10-1-1-2-1-4 0-2 1-4 2-6 3-2-2-4-4-6-6-1-1-3-3-5-2-2 1-2 4-2 5 0 3 0 6 0 10-2 1-3 3-5 5zm6-3c1 0 2-1 2-1 0 0 0 0 0 0 0-1 0-1-1-1 0-2 0-4 0-5 0-1 0-2 0-3 0-2 0-3 2-3 1 0 1 0 2 1 0 1 1 1 2 2 1 1 3 2 4 3 0 1 0 1 1 1 0 0 0 0 1 0 1-1 2-2 3-2 1-1 4-3 5-2 0 1-1 3-1 3-1 2-1 3-2 4 0 0 0 0 0 0 0 1-1 2 0 2 2 2 4 5 4 8 1 1 0 1-1 1-1 0-2 0-3 0-1 0-3-1-4-2-2-1-3 1-2 2-1 1-1 3-1 4-1 1-1 2-1 3 0 0-1 2-1 2-2 2-4-7-5-8 0-1-1-1-1-1 0 0 0 0-1 0-2 0-9 3-7-2 1-2 3-4 5-6zM1363 1965c-4 1-6 5-6 8 0 4 4 7 7 7 4-1 8-4 7-8 0-4-3-7-7-7-1 0-1 0-1 0zm6 8c0 3-3 4-5 4-6 0-6-8 0-9 2 0 5 2 5 5zM168 582c-4 6 2 12 5 17 4 5 10 10 16 13 0 0 0 0 0 0-3 4-6 7-9 11 0 1 0 1 0 2-2 4-3 9-1 14 1 5 5 7 10 7 5 0 10-4 13-7 4-3 7-7 9-11 8 6 17 11 26 14 7 3 19 9 25 3 6-6 1-14-3-19-7-9-15-17-23-24-1-1-1-1-1-1 0 0 0-1 0-1 2-8 14-14 9-23-1-6 2-22-9-21-10 2-13 17-13 26 0 0 0 0-1 0-1 1-3 3-5 4 0 0 0 1 0 1-3-2-7 0-11 2-8-3-17-7-26-10-4-2-9-2-11 3zm14 58c-3-4-2-9 0-13 7 0 13 4 17 10 0 1 0 1 0 1-1 1-2 2-4 2-4 3-9 5-13 0zm68-20c5 5 16 15 10 22-5 7-20-1-26-4-7-3-14-7-21-12 0-1 0-1-1-1 5-10 12-18 22-23 0 0 0 0 0 0-1 0-1 1 0 1 5 6 11 11 16 17zm-27-36c1-1 1-1 1-1 0-1 0-1 0-1 0-7 2-19 9-22 9-5 8 10 8 16 0 1 0 2 0 2 0 0 0 0 0 0 0 0 0 0 0 1 0 0 1 0 1 0 2 5-4 10-6 14-2 2-3 4-3 6-11 6-19 16-24 27 0 0 0 0 0 0-2 4-4 8-8 10 0 0 0 0 0 0-4-7-10-11-18-12 3-4 6-8 10-12 0 3 1 6 3 8 1 1 1 1 2 1 0 0 0 0 0 0 8-2 16-7 20-14 2-5 5-14 0-19 0 0 0 0 0 0 2-2 4-3 5-4zm-5 10c2 11-10 22-20 24-4-6-3-13 1-18 1-3 3-5 6-7 0 0 0-1 1-1 0 0 0 0 1 0 1-2 3-3 4-3 4 0 6 2 7 5zm-30-9c5 2 10 4 15 6-2 2-4 4-6 6-2 4-4 8-4 12 0 0-1 0-1 1 0 0-1 0-1 0 0 0 0 0-1 0-4-3-8-6-12-9-3-3-9-11-9-15 1-3 4-6 7-5 1 0 3 0 4 1 3 1 6 2 8 3zM236 576c1 0 1-1 1-2 0 0-1-1-1-2 0-1-1-1-1-1-1 0-1 1-1 2 0 0 0 1 0 2 0 1 1 1 2 1zM194 574c11-13 14-31 7-47 0-2-3-1-2 0 6 15 3 33-7 45-1 2 1 4 2 2zM275 564c-3 15-9 28-18 39-1 1 0 3 2 2 9-12 16-25 19-40 0-2-3-3-3-1zM199 579c7-5 11-12 13-20 1-2-2-2-2-1-2 8-6 14-13 19-1 2 1 3 2 2zM285 2455c2-3 4-7 0-9-1-2-3-2-4-2 3-5 4-10 2-15-1-4-5-11-10-9-1 0-2 1-3 2-2 2-4 4-7 5-4 1-8 1-12 3-5 2-9 7-9 12-6-1-13-4-19-7 2-4 3-9 4-14 1-2 2-6 1-8-2-2-5 0-7 1-5 2-10 4-16 4-11-11-18-26-20-43-1-4-1-8-1-12 0-2 1-6 0-9-1-3-6-4-9-2-2 2-4 5-6 8-3 3-5 7-7 11-4 7-7 14-9 22-4 15-3 30 1 45 3 10 8 19 14 27-16 3-23 22-13 35-8 6-11 18-6 27 3 4 8 7 12 8 3 1 6 0 8 1 2 0 3 3 4 5 8 7 20 9 29 4 9-5 14-15 13-25 7-1 14-5 18-12 2-3 3-6 6-8 1-1 4-2 6-3 4-2 7-5 9-9 0-1 0-2-1-2 1-1 2-1 3-2 12-7 23-17 29-29zm-40-13c-2-12 17-10 24-15 1-1 2-2 3-3 2-1 5 0 6 1 1 1 2 2 2 3 2 6 1 11-3 16 0 0 0 0 0 0-2 0-4 0-6 1-9 0-17 0-26-2 0 0 0 0 0-1zm-91-39c2-15 8-29 16-41 2-3 8-11 11-7 2 2 0 8 0 11 0 6 1 12 3 18 3 13 9 26 19 35 0 1 0 2 1 2 3 0 6-1 9-1 2-1 4-2 6-2 1-1 3-2 4-2 3-1 2 1 2 3-1 2-1 4-1 5-1 4-2 7-3 11-1 0-1 1 0 1 0 0 0 1 0 1 3 1 5 3 8 4-3 5-7 8-13 9 0-2 0-3-1-5-1-2-4-1-3 0 2 4 2 8 1 11-1 2 2 3 2 1 1-1 1-3 1-4 7-1 13-5 16-11 7 2 14 4 21 5 7 1 13 1 19 0 1 0 1 0 2 0 2 0 4 0 6-1 0 0 0 0 0 0 0 0 1 0 1 0 5 1 2 7 0 10-12 21-35 34-59 35 0 0 0 0 0 0 0 0-1 0-2 0 0 0-1 0-1 0 0-9-8-17-16-20-7-2-16 1-20 6-4-3-8-7-11-12 0 0 0 0-1 0-13-17-20-40-17-62zm86 93c-2 2-4 3-6 5-3 4-4 8-7 11-4 3-8 5-13 5 1-1 1-2 1-3 1-1-2-2-2 0-1 3-4 6-8 7-1 0-1 3 1 2 2 0 4-2 6-3 2 10-5 21-15 24-8 3-18-1-23-7 2 0 4 1 6 1 2 0 2-3 0-3-6 0-12-4-13-10 0-2-3-1-3 1 1 3 3 5 5 7-8 1-15-3-18-10-3-7-1-16 6-20 0 3 1 6 3 9 1 2 3 0 2-1-4-6-4-14 1-20 1-1-1-3-2-2-2 3-3 6-4 9-9-12-2-29 13-30 3 4 7 8 12 12-2 2-2 5-2 9 0 1 3 1 2-1 0-3 1-5 2-8 0 0 1 0 1 0 3-6 10-8 17-6 9 3 18 14 12 23-1 1 2 3 3 1 1-1 1-3 1-4 1 0 2 0 2 0 1 0 1 0 1 0 1 0 1 0 2 0 1 0 1-1 2-1 0 0 0 0 0 0 9 0 18-2 26-6-2 5-6 7-11 9zM25 2277c0 0 0 0 0 0 0 0 0 0 0 0-3 1-4 4-3 7 1 2 3 4 6 3 3-1 4-3 4-6-1-3-4-5-7-4zm2 7c-3 1-4-3-1-5 0 0 0 0 0 0 1 0 3 1 3 3 0 1-1 2-2 2zM1298 424c2-1 3-4 1-6-2-2-5-2-6-1-3 1-3 5-2 6 2 2 5 3 7 1zm-5-2c0-1 0-2 1-2 0 0 0 0 0-1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 2-1 4 2 2 3 0 1-2 1-3 0zM1217 432c-6 6-4 14 2 19 2 2 4 4 2 7 0 1-1 2-2 3-1 2-2 3-2 5-1 4 2 7 5 10 4 6-1 10-3 15-2 4-1 7 1 11 3 3 3 6 1 9-2 2-3 4-4 6-1 4 1 8 4 11 1 1 3-1 2-2-3-3-4-7-2-10 1-2 3-4 4-6 1-3 0-6-2-9-1-2-3-4-2-7 1-3 2-5 3-7 2-3 3-5 2-9-2-3-6-6-6-10-1-4 4-7 5-11 0-3-1-5-4-7-2-2-4-4-5-7-1-3 0-7 3-9 1-1-1-3-2-2zM1280 599c2-1 1-3 0-3-5 1-7 6-5 11 2 4 9 5 13 2 11-7 1-22-9-23-12-2-20 10-17 21 3 13 18 18 29 13 16-7 20-27 9-40-1-1-3 1-2 2 9 11 7 27-5 34-9 6-23 4-28-7-4-10 3-23 14-21 5 1 9 5 10 10 1 4-1 8-5 10-6 2-11-7-4-9zM711 2573c2-11-2-25-13-30-10-4-24 0-28 10-3 9 2 22 12 24 10 3 21-7 17-17-3-5-8-9-13-7s-9 7-7 13c0 2 3 1 2-1-2-8 9-13 14-6 4 5 2 12-4 15-11 5-21-6-19-17 1-10 14-15 23-12 11 4 16 17 13 27 0 2 2 3 3 1zM726 2108c3-11-2-25-13-30-10-4-23 0-28 10-3 9 2 22 12 24 10 3 21-7 17-17-2-5-8-9-13-7s-9 7-7 13c0 2 3 1 2-1-2-8 9-13 14-6 4 5 2 12-4 15-11 5-20-6-19-16 2-11 14-16 23-13 11 4 16 17 13 27 0 2 2 3 3 1zM1089 1659l-27 17c-3 2-5 3-8 5 0 0-2 2-2 2-1 0-1-1-2-1-3-1-5-3-8-2-6 1-9 7-7 13 2 5 7 7 12 6 0 6 6 11 12 9 5-2 7-9 4-13 11-9 23-18 34-27 5 5 16 6 19-2 2-6-3-10-8-10 3-6-1-15-9-15-4 0-8 2-9 6-1 2-1 4-1 6 0 1 1 2 1 2 0 3 1 2-1 4zm10-15c7 0 9 8 5 13-1 1 0 3 1 2 6-2 11 5 5 9-4 3-9 1-12-3 0-1-1 0-2 0-12 9-24 19-36 28 0 1 0 2 0 2 2 3 2 7-1 10-4 3-11-2-9-7 0-1-1-2-2-2-6 4-12-3-10-9 2-6 9-5 12-1 0 0 1 0 2 0 13-9 27-18 41-27 0 0 0 0 0-1l0 0c1 0 1-1 1-1-4-5-2-13 5-13zM621 473c-2-1-4-2-6-1-3 2-3 6-3 9-1 6-3 11-8 14-4-6-11-12-18-10-3 1-5 4-4 7 1 4 5 6 8 8 4 3 6 5 6 11-1 3-2 5-3 8-1 4-1 8-1 12 1 7 4 12 9 17-3 0-3 4-2 7 0 3 1 6 0 8 0 2-1 3 0 5 0 2 1 4 3 6 1 0 1 1 2 1 0 1 0 2 0 4-1 2-2 4-3 6-1 3-1 5 0 8 1 2 4 3 6 2-1 2-2 3-3 5-1 0-1 0-1 0-3 3-6 6-6 10 1 4 7 3 11 1-3 4-9 8-6 11 1 2 2 2 4 2-7 15-9 32-8 48 1 7 3 15 5 22 1 7 0 15-2 23 0 1 2 2 3 0 1-5 2-11 2-17 3 5 7 10 12 11 8 1 13-6 17-11 0-1 0-1 0-1 8 7 18 11 29 9 5-1 11-3 15-7 5-4 7-10 13-14 4-2 10-1 15-2 0 1 0 1 0 1 3 5 5 9 6 15 0 1 3 1 3-1-1-5-3-10-6-15 0 0 0 0 0 0 0 0 1 0 1-1 2 0 4-1 6-3 12-1 25-3 36-10 8-6 16-15 16-26 0 0 0 0 0 0 0 0 0 0 0 0 2-1 4-2 6-3 1 0 1 0 2 0 0 0 0 0 0 0 1 1 3 2 5 2 0 0 1 1 1 1 1 0 1-1 2-1 0 0 0 0 0-1 1 0 3-1 4-2 6-4 13-10 16-16 3-2 4-5 2-8-3-4-9 0-13 1-4 1-8 0-12 0 0 0-1 0-1 0-1-1-2-2-3-2-1-1-2 1-1 2 0 0 1 0 1 1-1 0-3 0-4 1-3 2-4 5-3 8-3 2-7 3-11 3-2 0-5 0-7 2-1 0-1 0-1 0-9 3-18 5-28 7 0 0 0-1 0-1 0 0 0 0 0-1-4-10-13-18-24-18-5 0-10 1-15 4l-4-10c1-2 1-4-1-6-2-1-4-2-6-3 3-1 6-3 5-7-1-4-6-4-9-6 2 0 3-2 4-4 1-6-9-8-10-13 0 0 0-1 0-1 0-1 0-1 0-1 4-5 3-11 7-16 0 0 0-1 0-1 9-4 15-12 18-21 0 0 0 0 0 0 2 0 3-1 4-3 3-4 1-9-2-13-6-9-18-12-29-13 1-1 1-2 1-4 1-3-1-8-5-9-2-1-6-1-8 1-1-1-1-1-1-1 0 0-1 0-1-1 4-5 7-11 8-18 1-3 3-9 0-11-3-3-8-1-9 2-2 3-3 6-4 10-1 2-2 4-3 6-1-2-3-3-5-3 0 0 0 0-1 0 0-2-1-4-3-5-3-2-6 1-8 5-1-2-1-3-2-5zm82 210c-4 0-9 0-13 2-3 2-6 6-8 9-4 4-8 8-13 10-12 5-24 1-32-7 5-8 10-14 18-19 0 0 0 0 0 0 10 7 24 1 26-10 15-4 29-8 43-13 1 8-1 15-6 21 0 1-1 2-2 3-1 0-1 0-1 0-3 3-7 4-12 4zm-40-26c0 0 0 1 0 1-2-2-5-2-7-3 4-6 12-5 18-1-4 1-7 2-11 3zm13-1c1 1 1 2 2 3l-11 3c-1-1-1-2-2-3 4-1 7-2 11-3zm51-1c0 0 0 0 0 0 2-1 5-2 7-2-2 1-5 1-7 2zm14-7c-5 1-9 3-14 4 0-1-1-2-1-3l18-4c-1 1-2 2-3 3zm-17 5c-14 4-28 8-42 12 0-1 0-2-1-4l43-11c0 1 0 2 0 3zm-43 6c-1-2-2-3-2-4 14-4 29-8 43-12 1 2 1 3 1 4l-42 12zm-14 6l12-3c0 1 0 3 0 4-5 2-9 3-14 4 1-1 2-3 2-5zm-7 9c6-1 12-3 18-5-2 8-12 13-20 7 0 0 1-1 2-2zm109-32c0 0 0 0 0-1 2 0 4-1 6-2 0 0 0 0 0 0-2 1-4 2-6 3zm8-20c0 0 0 0 0 1 0 1 1 1 1 2 0 1 0 1 0 1-1 0-2 1-4 1 1-1 1-3 2-5 0 0 0 0 1 0zm-6 9c0 0 0 0 0 0 5-1 9-3 13-4 1-1 1-3-1-3-1 0-1 1-2 1 0-1-1-2-2-4 0 0 0 0 0 0 0 0 0 0 0 0 1 0 3 0 4 0 3 0 5 0 8 0 2 0 4-1 7-2 1 0 2-1 3-1 1 0 1 0 2 0 2 0 3 1 0 4 0 1 0 1 0 1 0 0 0 0 0 0-3 5-12 15-19 18-1-1-2-2-3-2 0 0-1 0-1 1 0 0 0 0 0 1-1-1-2-1-2-2 0 0-1 0-1 0 3-1 6-2 9-3 2-1 1-3 0-3l-18 6c-1-1-1-1-1-2 0 0 0 0 0 0 6-1 12-3 18-5 1 0 1-3-1-3-6 2-12 4-18 6 0 0 0 0-1 0 0-1-1-1-1-2 2 0 5-1 7-2zm-8 5c3 3 4 7 3 11-3 22-27 29-46 31 1-1 2-2 2-3 4-5 5-11 5-17 6-1 11-4 15-8 1 0 1 0 1 0 1-1 2-3 3-4 1-1 1-2 2-3 0 0 0 0 0 0 1-3 3-5 5-7 0 0 0 0 0 0 0-1 0-1 0-1 3-2 8-2 10 1zm-14 1c-1 1-2 3-3 4l-20 6c0-2-1-3-1-4 8-2 16-4 24-6zm-28 2c0 0 0 0 0 0 0 1 0 1 1 2-15 3-31 7-45 12-7-7-19-7-24 2-12 0-23 4-31 12-2-12 2-24 13-30 5-3 11-4 16-4 6 0 11 3 17 4 4 0 8-1 11-4 4-4 8-8 14-10 12-3 24 4 28 16zm-52-56c2 2 2 4-1 6-1 0-2 1-2 2 1 2 3 3 5 4 1 1 3 1 4 2 3 3-1 5-4 6-2 0-2 2-1 2 2 1 3 2 4 3 1 0 8 3 3 5-1 1-1 3 1 3 0 0 0-1 0-1 2 4 3 7 5 10-2 2-4 4-5 6-5 4-9 4-14 2-12-4-24-4-34 4-9 8-12 21-11 32-3 3-5 6-8 10-1 1 1 2 2 1 9-14 28-26 45-22 7 2 8 8 3 13-4 3-8 4-11 7-6 5-11 10-15 16-3 5-6 9-10 12-6 4-12 1-15-5-2-2-3-5-4-7 0-1 0-1 0-1 0 0 0-1 0-1-2-5-4-11-4-16-3-18-1-38 8-54 1-2-1-3-2-2 0 0-1 0-1 0 0 0 0 0 0 0-1 1-2 1-3 0 1-1 1-2 2-2 0-1 1-2 2-2 0 0 0 0 0-1 2-1 4-4 3-6 0-1-1-1-1-1 0 0 0 0-1 0-2 0-5 2-7 2-5 0 0-6 2-7 0-1 0-1 1-1 0 0 0 0 0-1 3-2 7-5 6-9 0 0 0-1 0-1-1-1-2-1-2 0-2 2-3 2-5 1-1-1-1-3-1-5 1-1 2-3 2-4 1-2 1-4 2-6 3 1 7 2 11 3 0 0 0 1 0 1 5 13 6 27 1 40 0 2 2 3 3 1 4-13 4-28-1-41 0 0 0 0 0 0 8 1 15 0 23-1 5 13 7 27 5 41-1 2 2 2 2 1 3-15 1-29-5-43 6-1 11-2 15-4 0 1 1 2 1 3 1 1 2 2 3 3 1 0 2 1 4 2zm-3-21c0 0-1 0-1 0-6 3-13 5-20 5-2 0-2 3 0 3 7-1 14-2 20-5-1 3-2 6-6 8-5 2-10 3-14 4 0 0-1 0-1 0 0 0 0 0 0 0-2 0-5 1-7 1-1 0-1 0-1 0-8 1-16 0-23-2-3-1-5-2-8-3-2-1-2-2-3-5-1-3-1-2 0-5 6 4 12 6 18 6 2 0 2-3 0-3-6 0-12-1-17-5 0-1 0-1 0-2 0-1-4-9-1-8 1 0 1 0 2-1 1 1 2 2 3 3 0 0 1 0 1 0 13 6 28 8 44 6 0 0 0 0 0 0 5 0 10 0 15-2 0 0 0 0 0 0 0 2-1 3-1 5zm-7-66c1 1 2 4 2 6 0 3-3 4-5 4-5 1-9-4-7-9 2-3 7-3 10-1zm-14-21c1-1 2-3 2-5 1-1 1-3 2-4 4-1 6-1 6 2 0 2-2 8-3 10-1 5-3 9-6 12 0 1 0 1 0 1-1-1-1-1-2-1 2-4 4-9 6-13 0-2-2-3-3-1-2 4-3 9-5 13-1 0-2-1-2-1 0 0 0 0 0 0 2-4 3-8 5-13zm-10 5c1 0 2 0 2 1 3 1 0 5-1 6-2 0-4 0-6 0 1-1 2-2 2-3 1-1 2-2 2-3 0-1 0-1 1-1zm-5-5c4 3-1 9-3 12 0 0 0 0 0 0-1 0-1 0-2 0-1 0-1 3 1 3 7-1 14 0 20 4 0 0 0 0 0 0 1 0 1 1 1 1 0 0 1 0 1 0-1 1-2 2-2 3-1 3 0 5 1 7-1 1-2 1-3 2 0-1-1-1-1-2-3-5-11-7-17-4-4 3-6 8-5 13-6 1-12 3-16 7-3 3-3 8 1 10 2 1 2-2 1-3-3-1-1-4 0-5 2-2 4-3 5-4 3-1 6-2 9-3 1 0 1 1 1 1 3 6 11 8 17 5 0 0 0 0 0 0 0 0 0 0 0 0 4-3 6-8 6-13 1 0 3-1 4-2 2 1 4 2 6 2 1 0 1 0 1 0 1 0 2 0 3-1 0 0 0 0 0 0 6 1 13 2 19 4 4 1 7 3 9 6 2 1 3 3 3 4 1 1 1 2 1 3 1 3 0 5-3 6 0 0-1 0-1-1 1-2 0-5-1-8 0 0 0 0 0 0 2 1 3-1 2-2-3-1-6-1-8 2-1 2 1 3 2 2 1-1 1-1 1-1 6 11-6 23-17 17 0 0-1 0-1 0 1-2 2-4 2-6 0-2-3-2-3 0 0 4-2 7-5 9-1 0 0 3 2 2 1-1 2-2 3-3 0 0 0 0 1 0 6 3 13 3 18-2 1-1 2-2 3-4 0 0 0 0 0 0-4 9-11 16-21 19-9 2-20 1-28-5-2-1-3 1-2 2 3 2 7 4 11 5-14 1-27-2-39-8 0 0 0 0 0 0-6-4-11-10-12-17-1-4-1-8 0-12 1-3 3-7 3-11 1-6-4-9-8-12-3-2-10-9-2-10 1 0 4 1 5 2 5 2 7 5 9 10 1 1 3 0 3-2 4-2 8-6 9-11 1-3 0-5 1-8 0-1 1-5 4-2 2 2 1 6 0 8 0 0 0 0 0 0 0 1 0 2 0 3-1 2 2 2 2 1 1-2 5-16 9-13zm8 45c-5 2-11 1-14-4-2-4 0-10 4-12 4-3 9-2 12 2 4 4 2 11-2 14zM820 398c5-3 9-10 14-14 7-7 15-14 22-21 7-8-2-16-7-22-4-6-11-17-19-11-4 3-6 10-9 14-4 6-8 12-12 19-1 2-3 6-5 8-3 2-4 2-7 1-2-1-4-1-6 0-1 1-1 3-1 5-2 3-3 6-4 10-1 5-3 10-5 15 0 1 0 1 0 1 0 1 0 2-1 3 0 0 0 0 0 0-2 8 5 2 8 0 5-4 10-9 15-13 5 3 11 7 17 5zm-36 8c0 0-1 0-1 0 0-1 1-1 1-2 0 0 0 0 0 0 2-9 5-17 8-26 0 0 0-3 1-4 2-1 6 2 8 2 2 0 3-1 4-3 4-4 7-9 9-14 3-5 6-9 9-13 3-5 7-16 13-15 5 2 9 9 12 12 3 5 11 12 6 18-6 6-13 12-19 18-3 3-6 5-9 9-2 3-6 8-10 8-4 0-9-4-12-6-1 0-1 0-2 0 0 0 0 0 0 0-4 4-7 7-11 10-2 2-5 4-7 6zM1243 538c-4 0-7 0-11 1-2 0-2 2 0 2 2 0 5 0 8 0l-5 5c0 1 0 2 1 2 1 1 2 1 3 2 1 0 1 1 2 2 0 2 0 3-2 3-2-1-3 1-1 2 2 2 5 0 6-3 0-4-3-6-5-7 1-3 3-5 5-7 1-1 0-2-1-2zM563 2365c-2 0-4 1-5 3-1 0-1 0-1 1-1 1-1 2 0 3 0 1 0 1 0 1 0 1 0 1 0 1 1 2 3 3 6 4 4 0 7-3 7-7 0-3-3-7-7-6zm0 10c-2 0-3-1-4-3 0-2 2-5 4-5 2 0 4 2 4 4 1 3-1 4-4 4zM1365 2390c-1-3-3-5-5-7 0 0 0 0-1-1 0 0 0 0 0 0 0 0 0 0 0 0 0-1-1-1-1-1-13-12-31-18-49-13-16 4-30 16-37 31-16-10-37-13-56-6-17 6-30 20-36 37-1 1-1 1-1 1 0 1 0 2 1 2 11 5 23 6 35 3-7 12-10 26-8 39 0 0 0 1 0 1 1 6 3 12 6 18 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0 1 0 0 0 0 0 0 0 20-6 37-20 47-38-1 6-2 12-3 18 0 0 0 1 0 1-2 27 2 54 13 78 0 0-1 0-1 1-8 4-13 12-16 20-1 2 2 3 2 1 3-8 8-15 15-19 0 0 1 0 1-1 0 1 0 1 0 2 0 0 0 1 0 1 0 0 0 0 0 0-2 3-4 7-6 11 0 1 2 2 3 0 1-3 2-6 4-8 0 0 0 0 1 0 6 7 17 4 25 1 6-2 12-7 11-14 1 0 1-1 0-1-1-3-2-5-4-8 6-3 12-3 18-2 2 1 3-2 1-2-7-2-14-1-20 2-14-29-22-61-23-93 9 12 23 22 38 25 4 1 12 3 16 0 5-2 4-10 3-15-1-13-7-27-16-36-3-3-6-5-9-7 18 4 36 1 53-8 0 0 0-1 0-1 0-4-1-8-2-12zm-99 61c5 1 10 0 13-3 0 6 1 11 2 17-1 0-1 1-1 1-2 4-5 8-10 9 0 0 0 0 0 0-3 0-6 0-9-1 1-8 3-16 5-24 0 1 0 1 0 1zm19 38c0 0 0 0-1 0-3 7-7 12-13 16 0 0 0 0 0 0-4-1-7-3-10-5 0 0 0 0 0 0-1-8-1-16 0-24 7 3 14 3 21 0 1 4 2 8 3 13zm4 14c-5 3-10 4-15 3 5-4 9-8 12-14 1 4 2 8 3 11zm5 14c0 0 0 0 0 0-3 7-8 13-14 16-5 0-9-1-13-3-1 0-1 0-1 0-3-9-4-18-5-26 9 6 19 7 29 2 1 4 2 7 4 11zm3 9c-3 3-7 5-11 6 4-3 7-7 9-11 1 1 1 3 2 5zm-15-53c-2 1-4 1-5 2 2-2 3-4 4-6 0 2 1 3 1 4zm13 88c-6 1-13 3-18 0 0 0 0-1 0-1 0 0 0 0 0 0-4-9-8-18-11-27 5 2 10 3 14 3 0 0 0 0 0 0 7-1 13-3 18-8 3 6 6 13 9 19 0 0 0 0 0 0 3 8-6 12-12 14zm-16-116c0 0-1 0-1 0-3 3-7 4-11 3 0 0 0 0-1 0 1-2 2-4 3-7 0 0 0 0-1-1 2-5 3-10 4-15 2 5 4 10 7 15 0 2 0 3 0 5zm86-44c-1 1-2 1-3 2-2-2-3-5-5-7-1-2-3 0-2 1 1 2 3 5 4 7-3 1-7 3-11 4-1 0-2 0-4 1 0-1 0-1 0-1-2-3-4-6-5-8-1-2-4-1-3 1 2 3 4 5 6 8-8 1-15 1-23 0-1-3-1-5-3-8 0-2-3-1-2 1 1 2 2 4 2 7-5-1-10-3-14-4-1-1-1-1-2 0 0 0 0 0-1-1 0-3-1-6-2-9 0-1-3-1-2 1 0 2 1 5 1 8-5-2-11-2-17-2-1 0-1 3 0 3 16-1 32 5 43 16 6 6 10 14 12 21 2 6 6 24-2 26-4 1-10-1-16-3 0 0 0 0 0 0 0-3 0-5-1-7 0-2-3-1-2 1 0 2 0 4 1 6-1-1-2-1-2-1-7-3-13-7-19-11 0-1-1-1-1-1 0-4 0-7 0-11 0-1-2-1-2 0 0 3 0 6-1 8-3-3-5-6-8-10 0-1 0-1 0-2 1-3 2-6 3-9 0-2-2-3-3-1 0 2-1 5-2 7 0 1 0 1 0 1-3-5-5-11-7-17 0 0 0 0 0-1 0-1-2-1-2 0-1 7-2 13-3 19-3-2-5-3-7-4-1-1-3 1-1 2 2 1 5 3 7 4-3 9-7 17-12 24-2-4-5-8-8-12 0-2-3-1-2 1 3 4 6 8 8 13 0 0 1 0 1 0-6 7-12 13-20 18 0 0 0 0 0 0-1-5-2-11-3-16 0-2-3-1-2 1 1 5 2 11 3 17 0 0 0 0 0 0-5 2-10 6-15 7-1 0-1 0-2 0-2-5-4-10-4-15 2-3 3-6 5-9 1-2-1-3-2-1-1 1-3 3-4 5-1-12 2-24 9-35 5-6 11-12 18-16 0 0 0 0 0 0 1-1 1-1 2-2 0 0 1 0 1 0 1 0 1-1 2-1 0 0 1 0 1 0 0-1 1-1 2-1 7-3 14-4 21-4 1 0 1 0 1-1 1 0 1-2-1-2-9 0-19 2-27 6 0 0 0 0 0 0-1-1-2-2-2-4-1-1-4 0-3 2 1 1 2 2 3 4 0 0 0 0 0 0-8 4-14 9-19 16 0 0-1 0-1 0-2 1-5 1-7 1 0-2 0-5 0-7 0-2-3-2-3 0 0 2 0 5 0 8-4 0-8 0-12-1 0-3 0-6 0-9 0-2-3-2-3 0 0 3 0 6 0 9-3-1-6-2-9-3 6-17 20-30 37-36 17-6 38-3 53 7 1 0 2 0 2-1 6-15 20-27 36-31 17-4 35 2 47 14 4 4 6 8 7 13 0 1 1 3 1 4zM226 910c0-2-3-1-2 1 1 3 2 6 3 9 0 2 3 1 2 0-1-3-2-7-3-10zM268 948c0-1 0-2 0-4 0-1 0-3 1-5 0 0-1 0-1 0 1-12-1-24-4-35-4-9-11-18-21-19-10-1-20 4-25 13-5 8-5 18 0 27-19 6-42 11-54 30 0 1 1 2 2 1 7-3 13-7 20-10 0 1 1 1 1 1 11 2 22 0 33-3 1 0 2-1 3-2 0 23-2 47 9 68 8 14 24 25 40 23 0 0 0 1 0 1 3 2 6 3 9 3 1 13 2 26 1 39-6-3-11-6-17-9-3-2-6-3-9-5-2-1-3-1-5-1-1 0-2 1-3 3-3 0-6 2-8 4-1 2 1 3 2 2 1-2 3-3 5-3-1 1-1 3-1 4-2 5-2 9 1 13 1 1 3 0 2-1-2-5-1-9 0-14 1-1 1-2 1-2 0 0 1 0 1 0 0 6 3 12 7 17 1 1 3-1 2-2-5-5-7-11-6-18 1 1 4 3 5 3 8 4 15 8 23 12 1 1 2 0 2-1 1-13 1-27-1-40 3 0 6 0 9-1 1 0 1 0 1-1 5 2 10 2 14 1 15 33 29 65 44 98-4-3-9-6-15-7 0 0 0 0 0-1-2 0-3 0-4 0 0 0-1 0-1 1-2 0-3 0-4 1-1 1-1 2 0 2 4 4 8 8 11 13-4 1-8 2-11 4-1 1-1 2 0 2l5 4c2 1 3-1 2-2-2-1-3-2-4-3 3-1 6-2 10-3 1 0 1-1 1-2-3-5-6-10-10-13 0 0 1 0 1 0 1 0 2 0 2-1 0 0 0 0 1 0 7 2 13 5 18 11 1 1 2 0 2-1 0-9 2-18 7-26 0 6 1 12 3 18 0 2 2 2 2 0 2-7 7-12 14-15-1 6-3 11-4 16-1 2 2 3 2 1 2-6 4-13 5-19 1-1 0-2-1-1-8 2-13 7-17 14-1-6-2-13-1-19 0-1-2-2-3-1-5 8-8 16-9 25-14-32-29-64-43-97 7-2 14-6 15-14 22-6 40-24 46-46 0 0 0-1 0-1 0-2 0-4-2-6-1-1-3-1-4 0 0 0 0 0 0 0-1-4-3-4-6-4-5 2-10 4-15 6 1-2 1-4-1-6-1-2-3-3-5-3 0 0 0-1 1-1 0-1 0-2-1-2-21-10-46-10-68-4-1-2-2-5-2-7zm-49-21c0 0 0 0 0 0 1 1 1 2 2 2 0 0 0 0 0 0 0 1 0 1 0 1 0 0 0 0 1 1 0 0 0 0 0 0-1 0-1 0-1 0 0 1-1 2-2 2 0 0 0 0-1 0-17 4-33 10-48 18 12-14 32-18 49-24zm3 4c0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0zm-3 10c0 0 0 0 0 0-10 4-19 5-29 4 9-4 18-7 28-9 0 0 0 0 1 0 0 0 0 0 0-1 0 0 0 0 0 0 2 0 3-1 4-2 0 1 0 1 0 2 0 0 0 0 0 0 0 0 0 1 0 1 0 2-1 5-4 5zm55 91c3 0 6-1 8-3 3 3 6 5 9 6-6 1-12 0-17-3zm91-60c1-2 3-1 3 0 1 2 0 3-1 5 0 0 0 0 0 1-3 10-8 18-15 25-1-4-3-8-5-12 0 0 0 0 0 0 5-3 9-7 13-11 1-2 3-4 4-7 1 0 1 0 1-1zm-3-1c-1 4-4 8-6 10-3 3-6 5-10 8 0 0 0 0 0 0-2-4-4-8-7-11 1-1 1-1 2-2 3-1 6-3 9-4 3-1 13-8 12-1zm-20-2c0 2-1 3-2 5 0 0 0 0 0 0-1 0-1 0-1 0-1 1-1 1-2 2-4-4-8-7-12-10 3 0 7-1 11-1 2 0 6 0 6 4zm-6-8c-1 0-1 1-2 1-3 1-7 2-10 1-1 0-2 1-2 1-4-2-8-4-13-5-1 0-2 3 0 3 18 5 33 19 39 38 0 0 0 0 0 1 0 1 1 2 1 4 0 0 0 0 0 0-9 9-20 14-33 16-23 2-56-10-55-37 0-2-3-2-3 0-1 28 33 41 56 39 3 0 6 0 9-1-2 7-10 11-16 12-9 2-17-1-23-7 0 0 0 0-1-1 0 0 0 0 0 0 0 0 0 0 0 0 0 0-1 0-1 1-21 11-43-6-50-25-9-22-5-45-6-68 0 0 0 0 0 0 1 0 1-1 1-1 0-2 0-4-2-6-1 0-1 0-2 1 0 0 0 0 0 0-6-9-8-21-2-30 5-9 16-13 25-10 11 3 15 14 17 24 3 10 3 21 3 31-1 5-3 10-5 14 0 2 2 3 3 2 1-2 2-5 2-7 1 1 1 3 2 4 0 1 1 2 1 1 22-6 46-6 67 4zM1204 1581c2 1 3-1 2-2-4-2-8 0-9 3-2 4 0 9 4 10 5 2 10-1 13-5 2-5 2-11-2-15-7-10-22-7-28 2-6 10-2 23 7 30 11 7 26 2 32-10 1-1-2-3-2-1-4 8-13 13-22 11-9-2-15-10-15-19 0-11 10-20 20-16 6 2 10 9 8 15-1 4-5 7-9 6-7-2-3-12 1-9zM1346 1397c0 0-1 0-1 0 0 0 0 0 0 0-3 1-5 3-4 6 0 3 2 4 5 4 3 0 5-2 5-5 0-3-2-5-5-5zm0 8c-3 0-3-5-1-5 0 0 0 0 1-1 0 0 0 1 0 1 1 0 2 1 2 2 0 2-1 3-2 3zM1168 1912c2-2 2-5 0-6-2-2-5-2-7-1 0 1 0 1 0 1 0 0-1 0-1 0-1 2-1 5 1 7 2 2 5 1 7-1zm-2-5c1 1 1 3 0 4-2 2-5-1-3-4 0 0 0 0 0 0 0 0 0 0 0 0 1 0 2 0 3 0zM288 861c3-1 5-4 4-7 0-3-3-5-7-5 0 0 0 1 0 1-1 0-1 0-1 0-3 1-4 4-3 7 1 3 4 5 7 4zm-3-9c0 0 0 0 0 0 1 0 1 0 1 0 2 0 4 2 4 3 0 2-2 3-3 3-4 1-5-4-2-6zM81 1337c-2 5 0 11 3 16 8 10 22 14 34 12 1 0 1-1 1-2-7-6-7-13-5-22 0-5 0-10-3-14-4-4-11-5-15-3-1 0-1 0-1 0-1 1-2 1-3 2 0-3 0-6 1-9 0-1-2-2-3-1-1 4-1 8 0 11-4 3-8 6-9 10zm9-7c1 3 3 6 5 8 1 2 3 0 2-2-2-1-3-3-4-5 0 0 0 0 0 0 3-7 11-7 15-2 5 5 3 11 2 17-1 6 1 12 5 17-10 1-20-3-27-10-4-4-8-11-4-17 1-2 4-4 6-6zM405 237c2 1 3-1 2-2l-1-1c-1-1-1-1-2-1-10 4-6 19 5 18 12-1 13-17 4-23-9-7-22-3-26 8-4 12 5 24 18 26 1 0 2-3 0-3-7-1-14-6-16-14-1-8 4-17 13-18 8-1 17 6 14 15-2 5-8 8-13 5-2-1-3-4-2-6 0-2 2-6 4-4zM1019 1516c3-2 4-5 3-8-2-4-6-5-9-3 0 0-1 0-1 0 0 0 0 0 0 1-3 2-3 5-1 8 2 3 5 4 8 2zm0-7c2 2 0 4-1 5-5 2-7-4-4-7 0 0 0 0 0 0 0 0 0 0 0 0 2-1 4 0 5 2zM997 1327c-1 0-1 0-1 0 0 0 0 0 0 0-3 3-3 6-1 9 1 3 5 3 8 2 3-2 4-6 3-9-2-3-6-4-9-2zm4 9c-4 2-7-4-4-7 1 0 1 0 1 0 0 0 0 0 0 0 2-1 4 0 5 2 1 2 0 4-2 5zM1188 1269c3-2 4-5 2-8-1-3-5-5-8-3-1 0-1 0-1 0 0 0 0 1-1 1-2 2-2 6-1 8 2 3 6 4 9 2zm0-7c1 2 0 4-2 5-4 2-7-4-4-6 0-1 0-1 0-1 0 0 1 0 1 0 2-1 4 0 5 2zM1149 1201c-1 0-1 0-1 0 0 0 0 0-1 0-2 3-2 6-1 9 2 3 6 3 9 2 3-2 4-6 2-9-1-3-5-4-8-2zm4 9c-4 2-7-4-4-7 0 0 0 0 0 0 1 0 1 0 1 0 2-1 4 0 5 2 1 2 0 4-2 5zM1318 864c0 1-1 1-1 1 0 0 0 0 0 0-3 2-3 6-1 9 2 3 6 3 8 2 3-2 5-6 3-9-2-3-6-4-9-3zm5 10c-4 2-7-4-4-7 0 0 0 0 0 0 0 0 0 0 0 0 2-1 5 0 6 2 1 1-1 4-2 5zM1144 1782c0 0 0 0 0 0-5-16-24-24-39-16-14 8-18 25-10 38-7 1-7 11-1 14 4 2 6 0 8-2 0 2 2 3 4 5 1 0 3 1 3 2 2 3 2 6 2 9 0 2 0 3 2 5 3 5 10 5 13 11 3 4 5 8 11 8 1 0 1-3 0-3-7 1-8-7-11-11-3-2-7-3-10-6-4-3-1-8-3-13-2-3-11-6-8-10 0 0 0 0 0 0 1-1 3-1 5 0 1 0 2 1 3 1 1 2 2 5 2 7 1 2 2 3 3 4 3 2 6 3 7 6 1 2 1 5 2 7 3 4 7 6 11 9 6 3 12 7 17 10 2 1 3-1 2-2-7-4-13-8-19-11-4-2-7-4-9-8-1-2-1-5-2-7-1-2-3-3-5-4-2-2-3-2-4-6-1-1-1-2-1-4-1 0-1-1-1-2 0 0 1 0 2-1 2-1 2-4 4-5 3-2 3 7 4 9 0 2 2 3 3 4 3 2 7 3 8 6 1 3 1 5 3 8 1 2 4 3 6 4 4 2 6 4 9 7 5 5 10 8 17 8 2-1 2-3 0-3-9 1-14-8-21-13-4-2-9-3-10-7-1-3-1-5-3-8-1-1-3-2-5-3-2-2-4-3-5-5-1-2 0-3-1-5 0-2-1-3-2-4 2-1 5 1 8 0 0 0 0 0 1 0 0 2 1 4 3 5 1 1 2 1 3 2 1 1 1 4 2 6 0 1 0 2 1 3 1 1 3 1 4 2 3 2 4 3 5 6 2 3 4 6 7 6 2 0 3-2 1-2-5-1-5-6-7-9-2-2-4-2-6-4-3-2-2-6-4-8-2-4-6-4-7-9 0 0 1-1 1-1 0-1 0-2 1-3 0-2 1-4 2-4 0 0 0 0 0 0 3 0 4 8 6 9 1 2 4 3 6 4 6 4 7 11 11 16 1 2 3 3 4 4 2 1 4 0 5 1 3 1 4 3 6 5 5 5 11 5 17 5 2 0 2-3 0-3-5 0-10 0-14-3-2-2-4-4-6-6-3-1-7-1-10-4-2-2-3-5-4-8-3-6-6-8-11-11-4-2-3-5-5-8 0-1 0-2-1-2 7-2 9-11 0-12zm2 8c-2 2-4 1-6 2-2 0-3 1-4 3-1 1-1 3-1 4-1 2-3 3-5 3-1 0-2 0-3 0-2 0-5 0-6 2 0 0 0 0 0 0-1 0-1 0-1 0-1 1-1 1-1 2-2 2-3 5-6 5-1-1-2-1-3-1 0 0 0 0 0 0-2-1-3-1-5-1-2 1-4 3-5 5-7 7-11-10-4-7 1 1 1 2 2 2 1 2 3 0 2-2-11-12-9-31 6-39 14-7 31 1 35 16 1 1 2 2 3 1 0 0 0 0 0 0 3 0 5 3 2 5zM218 1368c9-2 17-4 24-10 5-5 9-11 12-17 15 2 30-3 40-15 7-9 10-21 9-33 10-3 21-7 27-15 7-10 6-22 1-32-10-18-37-39-57-24-4-11-17-19-29-15-11 3-18 14-18 25-6-5-16-9-23-6-9 2-15 11-16 20-8-1-15 1-21 4-8 4-15 10-19 19 0 1-1 3-1 4-2 6-2 12-1 18 0 0 0 0 0 0 1 2 1 3 1 5 1 9-1 19 0 29 0 10 2 19 8 26 5 6 10 12 17 16 13 8 32 4 46 1zm-39-1c-14-4-26-20-28-34-2-8-1-17-1-26 0-1 0-2 0-3 0 1 1 3 1 4 1 2 4 0 3-2-4-7-3-16 1-23 2-1-1-3-2-1-2 3-3 6-4 9 0-2-1-4-1-7 0-2 0-4 1-6 0 0 0 0 0 0 0-1 0-1 0-1 0-1 0-2 0-2 0 0 0 0 0 0 1-4 3-8 5-11 1 0 1-1 1-1 0 0 0 0 0 0 8-10 21-16 34-13 0 0 1 0 1 0-1 0-1 1-2 2-1 1 1 3 2 2 2-2 3-4 5-5 1-2-1-4-2-2-1 0-1 1-2 1 0 0 0 0 0 0 0-8 6-18 15-19 7-2 16 2 21 7 0 0 0 0 1 0-6 0-11 2-15 5-2 1 0 4 1 2 7-4 16-5 23-2 2 1 3-1 2-2-3-1-6-2-8-2 0-1-1-1-1-1 1-1 0-1 0-1-1-11 5-22 16-25 11-3 23 4 26 15 1 1 2 2 3 1 18-17 44 5 53 22 6 10 6 22-2 30-6 7-15 10-23 13-1-3-2-6-3-9 0-1-3-1-2 1 5 14 3 29-6 41-9 11-23 16-37 14 0-1 1-3 1-4 0-2-3-3-3-1-3 16-15 28-31 31-13 4-29 6-43 3zM288 1712c4 6 13 7 19 6 7-2 13-7 16-14 1 0 1-1 0-1 0 0 1-1 0-1-5-26-11-51-17-77 8-1 14-7 19-14 9-11 17-25 15-40-1-12-12-22-24-19-2-13-12-25-25-27-14-1-27 8-31 21-12-7-30-4-37 9-5 10-2 24 8 32-8 0-15 6-16 14-1 9 8 17 16 17 0 0 1 0 1 0 3 5 8 6 12 4 3 8 12 9 19 8 0 0 0 0 1-1 1 6 3 11 4 17-6 4-13-5-19-6-3-1-6 0-8 2 0 0 0 0 0-1 0 0 0-1-1-1-2-13-19-20-30-11-5 4-7 11-3 16 2 3 5 5 9 4-2 6 2 13 9 14 10 1 15-8 16-16 0 0 1-1 1-1 4-9 13 1 18 3 3 1 6 1 9 0 6 21 12 42 19 63 0 0 0 0 0 0zm-58-52c-4 1-8 0-11-3-2-3-1-7 2-10 0 0 0 0 0 0 0 0 0 0 0 0 1-1-1-3-2-2 0 0-1 1-1 1-6 4-11-3-10-9 1-4 5-7 10-9 9-2 19 4 20 14 0 1 0 1 1 1 0 7-3 14-9 17zm29-32c-6 0-11-2-12-8 0-1-2-1-2-1-4 2-8 2-11-1 1 0 2-1 2-1 2 0 1-3 0-2-9 3-19-5-18-14 1-9 11-13 18-11 0 3 0 6 1 9 0 1 3 1 2-1-2-7 1-14 7-17 2-1 0-3-1-2-4 2-6 5-8 8 0 0-1 0-1 0-11-6-16-21-10-32 7-11 23-13 34-6-3 2-5 4-7 7-1 1 1 2 2 1 4-5 10-8 16-7 2 0 3-2 1-3-3 0-7 0-10 1 3-12 15-21 27-20 13 1 23 12 24 25-1-1-3-2-4-3-2-1-3 1-1 2 5 3 8 7 11 13 0 1 3 0 2-2-1-3-3-6-5-8 7-2 15 2 19 8 4 7 4 17 1 25-3 7-8 14-12 20-4 6-10 13-17 15-7 1-12-3-18-6 0 0 0 0 1 0 1-1 0-3-2-3-1 1-3 2-5 3-1 0-1 0-2 0-3 0-6-1-9-2-2-1-3 1-1 2 1 1 3 2 5 2 0 1-1 1-2 1-4 4-9 7-15 8zm16-5c2-2 4-3 6-4 1 0 2 0 3 0 1 0 2 0 3 1 4 1 7 3 10 4 2 1 4 1 6 1 6 26 12 52 18 78 0 0 0 0 0 0 0 0 0 0 0 0-2 5-6 9-11 11-6 2-16 3-20-3 0-1 0-1 0-1-8-27-16-54-24-81 4-2 6-3 9-6zM131 1228c-5-17-13-32-25-46 1 0 1-1 1-1 0 0 0 0 0-1 3-8-3-12-10-11 0-5-3-9-8-9-7 0-11 5-15 10-8-8-22-2-22 9-4-1-8 1-10 5-1 5 4 9 9 9-10 23-15 47-20 71 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0 1 0 1 9 13 17 26 26 39 1 1 2 1 2 1 23-26 48-50 71-75 1-1 1-1 1-2zm-18-33c0 0 0 1 0 1-24 26-48 51-72 77-2-3-4-6-6-9 0 0 0 0 0 0 17-25 34-50 55-73 0 0 0 0 0 0 1 0 3-1 4-2 0 0 0 0 0 0 4 1 8-1 11-4 3 3 6 7 8 10zm-59-3c3 1 8 0 9-4 5 3 12 2 16-3 1 3 4 5 7 5-19 22-35 46-51 69 5-22 10-45 19-67 0 0 0 0 0 0zm-8-8c1-3 4-4 7-2 1 1 3 0 2-1-2-11 11-17 18-9 1 1 2 1 2 0 2-3 5-6 8-8 4-2 13-2 12 6-1 0 0 1 1 1 4 0 9 1 9 4 0 1 0 1 0 1 0 5-4 9-8 10 0-1 0-2 1-3 0-1-1-1-1-1-1-1-2 0-2 1 0 1-1 3-3 4-4 2-10 0-11-5-1-2-2-2-3-1-3 6-10 7-15 4-1-1-2 0-2 1-1 3-4 5-7 3-1 0-1 0-2 0 0 0 0 0 0 0-3 2-7-1-6-5zm-4 92c0 0 0-1 0-1 24-26 48-52 72-77 6 9 11 19 14 30-23 25-47 48-69 73-6-8-11-17-17-25zM255 2383c-3-1-7 1-10 2-3 1-6 3-9 5 0 0 0 0 0 0-2 2-4 6-1 8 2 2 5 1 7 0 0 0 0 0 0 0-1 6-6 15 0 19 5 3 12-1 17-5 3-2 6-4 6-7 1-3-1-5-4-6-3 0-6 1-9 3 2-4 4-8 5-12 0-2 0-5-2-7zm-7 21c0 1 0 1 1 1 0 1 1 1 1 1 3-2 6-4 9-4 3 0 5 2 3 4 0 1-1 1-1 2-1 0-1 0-1 0-1 0-1 1-2 1-2 1-3 2-5 3-1 1-1 1-1 1-4 2-9 4-10-2-1-5 3-10 3-15 0 0-1-1-1-1 0-1-1-1-2 0-1 1-3 2-5 1-2-1 0-3 1-4 1 0 1 0 1 0 2-2 4-3 6-4 2-1 6-3 8-3 4 2-4 17-5 19zM291 2374c1-4-2-7-5-7-4-1-8 1-12 3 2-5 4-10 6-15 1-3 1-7-2-8-4-2-9 0-12 2-5 2-9 4-13 7 0 0 0 0 0 1-1 0-1 0-1 0 0 0 0 0 0 0 0 1 0 1 0 1-1 1-2 3-2 4 0 3 1 4 3 5 3 1 6 1 9-1-2 8-7 18 2 23 5 2 12-2 18-6 4-2 9-5 9-9zm-5 3c0 0-1 0-1 0-1 1-2 2-4 3-2 1-3 2-5 4-1 0-1 0-1 0-5 3-10 4-12 0-4-6 2-15 2-22 0-1-2-2-2 0 0 0 0 0 0 0-2 2-4 3-7 3-2 0-3-1-3-3 0-1 0-2 1-2 0 0 0 0 0-1 4-3 17-13 22-9 3 2 2 3 1 6-1 1-1 3-2 4-2 4-3 8-5 12 0 1 0 1 1 2 0 0 1 1 1 0 4-1 8-4 12-5 3 0 5 2 4 6 0 1-1 1-2 2zM76 1540c0 0 0 0 0 0-2 3-2 6 0 8 3 2 7 2 9 0 2-2 2-6 0-9-3-2-7-2-9 1zm7 1c1 2 1 4 0 5-1 1-3 2-5 0-1-1-1-2 0-4 0 0 1 0 1-1 1-1 3-1 4 0zM423 474c-3-3-8-5-11-2-1 0-1 0-1 0 0 0-1 1-1 1-3 3-3 8 0 11 2 4 8 4 11 1 4-2 5-7 2-11zm-4 9c-5 4-11-4-7-8 0 0 0-1 0-1 0 0 1 0 1 0 2-2 6-1 8 1 2 3 1 6-2 8zM794 1772c-5-5-12 2-14 6-4 6-7 13-15 8-3-2-7-3-10-2-6 2-9 7-8 12-2-2-3-3-4-5 0-1-1-1-1-1-1 0-1 0-1 0-16 5-29 18-34 33-6 16-3 34 6 48 10 13 25 22 41 23 17 0 34-7 44-20 12-15 15-36 8-54-1 0-1 0-1-1-1 0-1 0-2 0-2 0-4 1-7 1 1-1 1-2 1-3 0-3-2-2 0-5 1-3 2-2 5-3 4-2 6-8 5-12 8 0 17 1 24-5 5-4 7-11 4-17-2-4-5-7-7-10-2-3-3-5-3-8 0-4 2-5 3-8 1-5-3-11-8-9-4 1-8 2-11 4-3 1-6 3-8 6-4 8 3 16 5 24 1 3 1 6-1 8-1 2-4 4-6 4-5-1-3-4-3-6 0-3 0-5-2-8zm-53 21c0 0 0 0 0 0 2 3 4 6 7 9-1 3-2 7-7 4-1-1-1-2-2-3-1-2-3-3-5-4-2 0-3-1-4 0 3-3 7-5 11-6zm-35 51c14 24 37 40 63 45-2 1-5 2-7 2-29 3-54-20-56-47zm69 44c0 0 0-1 0-1-29-3-54-21-67-46-1-1-1-1-2-1 0-3 1-6 1-9 2-10 7-19 14-26 1 0 1 0 1 0 5-5 12-5 16 1 1 1 2 3 4 4 4 1 7-2 8-6 5 5 11 10 17 13 7 4 14 6 22 6 0 1-1 2-1 3 1 3 2 5 2 8 1 3 2 6 3 9 2 5 8 10 13 7-1 6-3 11-6 16-5 10-15 17-25 22zm31-42c0 0 0 0 0 0-4 6-9 0-10-4-1-2-2-4-2-6-1-4-4-9-2-13 3 0 7 0 11-1 3 8 4 16 3 24zm-4-57c5-1 7-6 7-11 0-8-6-14-6-21-1-6 3-10 9-11 1-1 2-1 4-2 1 0 4-2 5-2 2 0 4 2 4 4 1 1 0 2 0 3-1 2-2 3-2 4-1 3-1 6 0 9 3 8 15 14 10 24-5 10-19 9-28 8-1 0-2 1-1 2 1 3 1 7-2 9-2 2-5 1-8 3-1 1-2 2-2 3 0 2 3 7 2 8-1 0-1 0-1 0-1 0-2 1-3 1-8 0-16-2-23-6-6-4-12-8-16-13 0 0 0 0 0 0 0-1 0-1-1-1 1-1 0-1 0-1-2-6 1-13 8-13 4 0 6 4 10 5 5 1 9-2 12-7 1-3 2-7 5-9 3-2 8-2 8 3 0 1 0 3 0 4 1 5 5 7 9 7zM844 1817c6 0 7-5 4-9-3-5-11-7-16-6-7 1-13 4-17 9-1 1 1 2 2 2 0 0 0 0 1 0 5-2 11-2 16 0 4 2 7 4 10 4zm-23-8c3-3 7-4 11-5 3 0 5 1 8 1 2 1 7 3 7 6 0 3-3 3-5 3-1 0-3-2-5-3-2-1-4-1-6-2-3-1-7-1-10 0zM747 1781c1-7 2-15-3-22-3-5-10-8-16-5-4 3-7 9-3 12 2 2 5 2 8 2 6 1 11 4 11 12 0 0 0 0 1 0 0 0 0 1-1 1 0 1 3 2 3 0zm-14-15c-2-1-3-1-5-1-2-2-2-5 0-7 4-4 9-2 12 1 4 3 5 8 5 14-2-5-7-7-12-7zM727 1779c0 0-1 0-1 1-1 2-1 4 0 6 2 2 5 2 7 0 2-2 2-5 0-6-2-2-4-2-6-1zm4 5c-1 1-2 1-3 0 0 0 0-2 0-2 0 0 0 0 0 0 0 0 0-1 0-1 1 0 2 0 3 0 1 1 1 3 0 3zM1391 1805c4 0 7-3 7-7 0-4-4-8-8-8 0 0 0 0 0 0-4 1-7 5-6 9 0 4 3 6 7 6zm0-12c2 0 5 3 5 5-1 3-3 4-5 4-6 0-6-8 0-9zM860 413c-8 8-12 20-10 32 1 6 4 11 9 14-4 0-8 0-12 0-5 0-10 0-13 4-4 6-4 14-5 20l-6 27c0 0 0 0 0 0 1 5 10 6 13 7 9 3 19 3 29 4 11 1 23 1 35 1 1 0 4 0 7 0 0 0 0 1 1 1 24 16 84 14 85-25 0-1 0-1-1-1 1-2 1-3 1-5-1-3-3-5-5-6-1 0-1 0-1 0 6-10 11-20 16-30 8-18 17-39 13-59-3-17-16-29-25-42-6-7-10-15-11-23-2-7-3-17-11-19-8-2-15 6-17 13-2 8-1 17 3 25-12-2-23 0-33 5 0 0-1 0-1-1-6-2-8-8-9-14-1-4 0-10-2-15-1-2-4-4-6-3-3 1-4 4-6 6-8 12-7 33 10 36-8 6-13 14-17 23-1 3-2 6-4 9-3 4-8 5-12 6-5 2-10 6-15 10zm-18 49c2 0 5 0 7 0 6 0 11 0 16 0 4 1 8 1 12-2 0 0 0 0 0 0 3 3 6 6 11 8 8 3 16 2 23-2 0 1 0 1 1 1 3-1 5-1 8-1 1 0 3-1 4 0 0 0 0 0 0 0 0 0 0 0 0 0-1 0-2 1-4 1 0 0 0 1 0 1-14 7-29 14-43 21-4 2-8 4-12 5-6 2-10-2-13-6-5-8-10-16-16-23 0 0 0 0 0 0 2-2 3-3 6-3zm64 57c-4 0-9 0-13 0-9 0-17 0-26-1-8 0-17-1-25-2-3-1-14-2-16-6 3-13 5-27 8-41 0-1 1-1 1-2 5 8 11 17 17 24 4 6 10 8 17 5 9-4 19-9 28-14 9-4 19-9 29-14 0 1 0 3 0 4 0 1 0 3 0 5-1 0-1 1-1 1 0 4-1 7-2 9-2 10-5 20-8 30-2 3-6 2-9 2zm5 3c3-1 5-2 7-4 0 0 0 0 0 0 2-6 3-12 5-17 16 10 37 12 56 6 4-1 8-3 11-6-4 33-56 34-79 21zm75-34c1 0 4 3 4 4 2 6-4 10-8 12-3 1-7 2-10 3 4-6 9-12 13-18 0-1 1-1 1-1zm-76-125c-8-1-14-8-14-16-1-7 2-17 9-20 3-1 3 1 3 4 1 2 1 5 1 7 0 3 0 6 1 9 2 4 5 8 9 11-3 1-6 3-9 5 0 0 0 0 0 0zm-24 38c5-4 6-10 9-16 4-7 8-13 14-18 13-11 31-16 48-13 0 0 0 0 1 0 0 0 0 0 0 0 2 1 4 3 6 5 1 1 2-2 1-3-4-3-7-7-9-11-1 0-1-1-1-1-2-5-2-11 0-17 1-5 4-10 9-12 8-1 11 6 12 11 1 7 3 14 6 20 3 6 7 11 11 16 9 12 20 24 21 40 1 18-6 37-14 53-7 17-17 32-28 46 0 0 0 1 0 1-1 1-3 3-4 4 0 1 0 1 0 1-2 0-4 1-6 1-13 0-27-3-38-10 0 0 0 0 0 0 1-6 3-12 4-19 14 0 27-4 39-12 0 0 0 0 0 0 3 0 7-1 10-2 2 0 1-2-1-2-1 0-2 0-4 1 3-2 6-5 8-7 1-2 0-3-2-2-13 13-31 21-50 22 0-1 0-2 0-3 1-3 3-8-1-10-3-2-8-1-12-1 3-2 5-4 7-7 0 0 0 0 0 0 1 1 2 1 3 2 1 1 3-1 2-2-3-2-5-4-7-6-2-1-4 1-2 2 1 1 1 1 2 2 0 0 0 1 0 1-7 11-21 15-33 10-11-6-15-18-16-30 5-1 10-3 13-8 3-5-2-7-7-7-4-1-13-1-15 4-2 5 3 9 7 11 0 8 2 17 6 23-8 5-18-1-21-9-3-7-2-16 1-23 3-7 8-13 14-17 6-3 12-4 17-8zm-16 31c-3-1-10-6-3-9 3-1 6-1 9-1 2 0 7 0 5 4 0 2-2 3-3 4-3 1-5 2-8 2zM937 402c4 3 7-7 8-9 0-3 1-10-5-8 0 0-1 1-1 1-1 0-1 1-1 1-1 0-1 1-1 1-1 2-1 4-1 6 0 1-1 2-1 3 0 2 0 4 2 5zm2-8c0-1 0-2 0-3 1 0 1 0 1 0 0 1-1 2-1 3zm0 5c0 0-1 0-1 0 2-2 3-3 4-5-1 0-1 1-1 1 0 1-1 4-2 4zM905 389c2-2 4-8 0-8-3-1-5 2-6 5-1 1-2 3-2 4 0 2-1 5 0 6 3 3 7-5 8-7zM183 2429c7 4 16-1 15-9 0-2-3-2-3 0 1 6-5 10-10 6-2-1-3 2-2 3zM527 2374c16-4 29-17 28-33 5 4 12 4 18 1 10-4 13-15 13-24 0 0 0 0 0 0 8-7 11-18 4-26-4-4-6-6-7-11-1-3-2-5-3-7-4-4-8-7-14-7-1-36-3-72-4-109 0 0 0 0 0 0 1-1 1-1 2-1 0 0 1-1 1-1 1 0 1-1 0-1-4-9-10-17-16-25-3-4-6-8-9-11-2-3-5-7-8-8-3 0-4 1-5 3-3 5-6 9-9 14-5 9-9 19-12 29 0 0 0 0 0 0-1 1-1 2 0 2 2 0 3 1 4 1 0 15 1 30 1 46-2-5-5-10-8-15-3-5-6-9-10-14-2-3-4-8-8-8-4-1-6 2-8 5-3 5-7 11-10 16-3 6-7 12-10 18 0-4 0-7 0-10 1 0 2-1 3-1 1-1 1-2 0-2-6-11-13-22-19-33-2-4-6-8-10-4-3 3-5 7-7 11 0 0 0 0-1 0-1 3-3 6-5 9-3 7-7 14-10 21-1 1 0 2 1 2 0 0 0 0 0 0 1 1 3 1 4 1 0 17 0 35-1 52-5-6-13-9-21-6-8 4-12 13-9 22-18 3-31 18-30 36 2 19 19 33 38 31 1 0 1 0 1 0 2 2 4 4 7 6-1 0-1 1-1 1 5 18 20 33 38 36 18 3 36-6 46-21 1 0 1 0 1 0 11 13 29 19 45 15zm35-220c0 0-1 1-1 1-17 7-35 7-53 2 2-4 3-9 5-13 3 1 6 2 9 3-1 2-1 4-2 7 0 2 3 2 3 1 1-3 1-6 2-8 5 0 10-1 14-3 1 2 2 4 3 6 0 1 3 1 2-1-1-2-2-4-2-6 0 0 0-1 1-1 1-1 0-3-2-2 0 0 0 0 0 0-1-1-2-3-3-5 0-1-3-1-2 1 1 2 1 4 2 6-4 2-8 3-13 2 1-4 2-9 3-14 5 1 10 0 15-3 8 8 14 17 19 27zm-27-37c2 2 4 5 7 7-4 3-9 4-13 4 1-3 1-5 1-7 1-2-2-2-2-1-1 3-1 5-2 7-1 0-2 0-3-1 0-1 1-3 2-4 2-4 5-10 10-5zm-16 16c1-2 1-3 2-5 2 1 3 1 5 2-1 4-2 9-3 14-3 0-6-1-9-2 0 0 0 0 0 0 2-3 3-6 5-9zm-4 90c-9 3-19 4-30 5l0-7c5 0 9-1 14-2 1-1 0-3-1-3-4 2-9 2-13 2l-1-10c7-1 13-2 19-5 1-1 0-4-1-3-6 3-12 5-18 5l0-4c0-1-3-1-3 0l0 4c-2 0-4-1-6-1 1-5 2-9 3-13 7 1 13 1 20-2 0 0 0 0 0-1 2 3 4 6 5 8 5 9 9 18 12 27zm-62 0c3-7 7-14 11-21 2 1 5 3 7 4 0 0 0 1 0 1-1 2 2 3 2 1 1 0 1-1 1-2 2 1 5 1 8 1l0 11c-1 0-3 0-5 0-2 0-2 2 0 3 2 0 4 0 5 0l1 6c-10 1-20-1-30-4zm34-50c3 2 6 8 9 12 0 0 1 1 1 1 0 0 0 0 0 0-6 3-12 4-18 2 2-5 3-10 5-16 1 0 2 0 3 1zm-7 2c-1 4-2 8-3 12-2 0-3-1-4-1 0-1 0-1 1-2 1-2 3-6 6-9zm-8 13c1 1 2 1 4 2-1 4-3 9-4 13-2-1-5-2-7-3 0-1 1-2 1-3 2-3 4-6 6-9zm-61 11c1-1 1-3 2-4 9 3 19 3 28 1 0 0 0 1 0 2 1 2 3 1 3-1 0-1 0-1 0-2 3-1 7-3 11-5 1 2 2 4 2 5-14 7-30 8-46 4zm42-11c-3 2-6 3-10 4-1-3-1-7-2-11 2-1 4-2 6-3 2 3 4 7 6 10zm-12-20c2 2 3 5 5 7-2 2-4 3-6 4 0-3-1-6-2-9 1 0 2-1 2-1 1 0 1-1 1-2 0 1 0 1 0 1zm-15 3c4 1 7 1 10 0 1 3 1 6 2 9-5 1-10 1-16-2 1-2 3-5 4-7zm11-11c0 1 0 1 0 2 2 1 3 3 4 5-1 0-1-1-2 0 0 0-1 0-1 0 0 0 0-1 0-1-1-2-3-1-3 0 0 1 0 1 0 2-2 1-5 1-7 1 0-1 1-2 1-3 2-2 5-8 8-6zm-16 20c6 3 12 4 17 2 1 4 2 8 2 11-8 2-17 2-26 0 2-5 5-9 7-13zm34 19c0 5 0 9 0 13 0 1 0 1 0 1-2 3-3 7-5 11 0 0 0 0 0 0 0 0 0 1 0 1 1 0 1 1 1 1 1 0 2 0 3 0 0 1 0 1 0 1 0 3 0 7 1 11 0 2 2 2 2 0 0-4 0-7 0-11 18 5 37 5 55 0 2 18 3 36 3 53 0 2 2 2 2 0 0-18-1-36-3-54 1 0 3 0 4-1 1 0 1-1 0-2 0 0 0 0 0 0-1-4-3-8-4-12 0 0 0 0 0 0 0-17-1-34-1-50 15 3 31 3 46-2l2 47c-4 1-9 2-13 3 0-2 0-3-1-5 3 0 5-1 7-2 0 0 0 1 0 1 0 1 3 1 3 0 0-3-1-6-1-9 0-2-3-2-3 0 1 2 1 4 1 5-2 1-5 2-7 3 0-1-1-2-1-3 0-2-3-1-2 1 0 1 0 1 0 2-2 0-5 0-8 0-1 0-2 2 0 2 3 1 6 1 9 1 0 1 0 2 0 4-5 0-11 0-17-1-2 0-3 3-1 3 6 1 13 1 19 0 0 2 0 4 1 5 0 2 3 1 2 0 0-2 0-3 0-5 4 0 8-1 12-3l4 78c0 0 0 0 0 0-7-1-14 3-18 8-15-8-32-7-45 2 0-11 1-22-2-32-2-8-6-18-15-21-8-3-17 2-21 9-7 9-6 20-6 31 0 1 3 2 3 0-1-9-1-19 3-27 4-9 16-15 24-8 7 5 9 15 11 23 1 9 0 18 0 26 0 1 0 1 0 1 0 1 0 1 0 1-13-17-37-19-54-9 0 0 0 0 0 0-8-10-19-15-30-16 0 0 0 0 0 0 0-24 1-47 1-71 13 2 26 1 39-4zm29 159c3 0 6 0 9-1 1-1 1-3-1-3-6 3-12 2-18-1-1-1-2 2-1 3 2 1 4 1 7 2-10 14-28 23-45 19-17-3-30-16-34-32 3 2 6 3 9 3 2 1 2-2 1-2-12-3-21-12-24-24 0-1-3-1-2 1 0 4 2 8 4 12-17 1-32-11-34-29-1-17 11-31 28-33 0 0 0 0 0 0-1 1-2 3-3 4-1 2 2 3 3 1 1-3 3-6 7-7 1-1 0-3-2-3-1 1-2 2-3 3 0-1 0-1 0-1-3-8 0-17 9-19 7-2 15 1 18 8 0 0 0 0 1 0 0 5-1 10-1 15-7 0-14 2-21 5-2 1 0 3 1 3 18-10 38-5 51 10 0 0 0 0 0 0-5 3-8 6-11 11-3 0-6 1-9 2-1 1 0 3 2 2 6-3 14-1 18 4 1 2 3 0 2-1-2-4-6-6-10-7 14-20 46-23 62-2-2 2-4 4-6 7-1 1 1 3 2 1 13-20 40-24 58-8 1 1 3-1 2-2-1-1-3-2-4-3 4-6 13-9 20-6 2 0 2-2 1-3-1 0-2 0-3-1 0 0 0 0 0 0 0-5 0-11-1-16 6 0 11 3 13 9 2 4 2 7 4 10 3 5 7 7 8 13 0 6-3 11-8 15 0 0-1 0-1 0-2 0-1 2 1 2 0 0 0 0 0 0 0 7-2 15-8 19-6 5-15 5-20-1 0-1 0-1 0-2 0 0 0 0 0 0 6-3 10-10 9-18 0-2-2-2-2 0 1 15-17 24-28 12-1-1-3 1-2 2 6 6 13 8 20 5 0 1 0 1 0 1 0 0 0 1 1 1 2 17-12 31-29 34-15 2-30-3-40-14zM520 2187c1 1 2 2 3 3 1 0 1 0 2 0 0 0 0 0 0 0 3 1 6 1 8-1 4-4 4-11 0-14-4-3-11-2-13 2-2 3-2 6 0 9-1 0-1 0 0 1zm2-8c2-3 6-4 9-2 3 2 3 7 1 10-2 1-4 1-6 1-1 0-1 0-1 0-3-2-5-6-3-9zM419 2221c1 4 5 7 9 6 4-1 7-5 6-9-1-4-5-6-9-5-4 1-6 4-6 8 0 0 0 0 0 0zm5-5c3-1 6-1 7 2 1 2 0 6-3 6-2 1-5 0-6-3-1-2 0-4 2-5zM541 2262c0 1 0 1 1 1 0 1 0 1 1 1 0 1 0 1 0 1 3 2 7 2 11 0 3-3 4-9 1-12-3-4-9-4-12-1-3 3-4 7-2 10 0 0 0 0 0 0zm3-8c2-2 6-2 8 0 3 2 3 6 0 8-2 2-5 2-8 1 0 0 0-1 0-1-2-2-2-5 0-8zM1037 551c-5-10-19-15-29-10-10 4-15 17-11 28 4 10 16 15 26 12 0 1 0 1 0 1 0 2 0 4 0 6 0 0 0 0 0 0 0 2 0 4 2 5 2 2 5 1 6-1 0 0 0 0 0 0 11 17 22 34 33 51 0 1 0 1 1 1 0 0 0 0 0 0 0 0 0 0 1 0 4 1 7-2 7-7 0-1-1-1-1-1-11-17-21-34-32-51 0 0 0-1 0-1 3 0 6-1 5-4 0-2-1-3-2-4-3-1-6-2-9-3 5-6 6-15 3-22zm-28-8c6-2 12-2 18 1 0 1 0 1 0 1 0 1 0 1 1 2 1 7-7 14-14 9-1 0-2 0-2 1-2 7-11 6-13 0 0 0 0 0 0-1 0 0 0-1 0-1 0 0 0-1 0-1 2-5 5-9 10-11zm61 95c0 2-2 4-3 4 0-1-1-1-1-1-11-17-22-34-33-51 0 0 1 1 1 1 1 0 2 1 4 0 1 0 1-1 2-2 10 17 20 33 30 49 0 0 0 0 0 0zm-37-62c1 0 3 1 5 1 0 1 1 1 2 1 2 0 2 1-2 3-1 0-2 1-1 2 0 0 0 1 0 1 0 1 0 1 0 2 0 0 0 0 0 0 0 1-1 1-2 2-1 0-1-1-1-1-1 0-1-1-2-1-1 0-2 0-3 1-1 1 0 1-1 2 0 0 0 1 0 1-1-1-2-1-2-2-1 0 0-2 0-3 0-2 0-3 0-4 0 0 0 0 0-1 0 0 1 0 1 0 1 1 2 1 3-1 0 0 0 0 0-1 0 0 1 0 1-1 0 0 0 0 0-1 1 0 1 0 1-1 0 1 1 1 1 1zm-2-2c0-3 0-6 1-9 0-1-3-2-3 0 0 4-1 8-2 11 0 1 0 1 0 1 0 0 0 0 0 0-4 0-7-1-10-3-2 0-3 2-1 3 2 1 4 1 6 2-9 2-18-2-22-10-1-3-2-6-2-9 4 6 12 6 16-1 9 4 17-3 16-12 2 1 3 3 4 4 4 8 2 17-3 23zM406 2498c-1 0-2 0-2 1-2-2-5-4-9-4-8 0-14 6-14 14 0 7 7 13 14 14 0 0 0 0 0 0 8 0 13-7 12-15 2 0 3 0 3-2 1-1 1-3 0-5-1-1-2-3-4-3zm-13 22c0 0 0 0-1 0-4-2-7-5-8-10-1-6 3-12 9-12 17-2 14 26 0 22zm14-15c0 0 0 0 0 0 0-1-1-2-2-4 1 0 1 0 1-1 0 0 1 1 1 1 0 0 1 1 1 1 0 1 1 4-1 3zM720 2243c0 0 1 0 2 0 3 0 6 0 8-2 5-5-1-14-4-19-4-7-9-13-15-18 3-11 4-21 3-32-1-10-5-21-15-26-10-5-22 1-30 7-8 6-15 13-20 22-11-5-20-7-31-2 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0-1 0-2 2-2 5 0 8 1 5 2 9 4 14-3 0-5 2-7 3-2 1-4 3-4 5 1 2 3 2 4 2 3-1 7-2 10-2 0 0 0 0 0 0 7 12 16 23 28 31 0 0 0 0 1 0-1 1-1 1-1 1 0 0 0 0 0 0 0 0 0 0 0 0-1 3-3 7-4 10 0 2 0 4 2 4 3 0 5-2 6-4 2-2 3-4 4-6 13 6 28 9 42 7 1 3 2 6 4 9 1 1 2 2 4 2 2-1 2-4 2-5 0-3 0-5 0-7 3-1 5-1 7-2 0 0 1 0 1 0zm-53-85c9-7 21-15 32-9 10 6 12 18 12 28 1 12-2 23-6 33-23 3-45-9-56-30 5-8 11-16 18-22zm-20 19c0 1 0 1 0 2-6-2-12-3-19-3-1 1-1 3 0 3 6 0 12 0 18 2 0 0 0 0 1 0 1 4 3 7 6 10-5 1-9 1-14 2-2 0-1 3 1 2 5 0 10-1 15-2 0 0 0 0 0 0 4 5 9 9 14 12-2 4-5 7-7 11-1 1 1 3 2 1 2-3 5-7 7-10 7 3 14 5 22 6 1 7 2 15 3 22 0 2 3 1 3 0-1-7-2-15-3-22 3 1 6 0 9 0 2 4 5 9 8 13 1 1 4 0 3-1-3-4-6-8-9-12 1-1 1-1 1-1 0 0 0-1 0-1 1-1 1-3 2-5 6 5 11 12 15 19 2 4 8 15-1 15-4 0-9 0-13 0-18-2-36-7-51-17-10-7-20-16-28-25-1-2-10-11-13-17 0-1 0-2 0-3 0 0-1 0-1 0 0-1 0-2 1-3 10-3 19-2 28 2zm-29 24c-1 0-2 1-2 1-1 0-1 0-2 0 0 0-1 0 0 0 0-1 2-2 3-3 1 0 3-1 5-2 0 0 0 0 0 0 0 1 0 2 1 3-2 1-3 1-5 1zm37 41c0 1-3 5-4 4-1 0 3-9 4-10 1 0 2 1 3 1-1 2-2 4-3 5zm-1-10c-15-10-27-25-32-42 8 11 22 24 25 26 11 9 23 16 36 20 9 3 18 5 27 6 0 0 0 0 1 0-20 4-41 1-57-10zm55 22c-1 0-2-4-2-4-1-1-1-3-2-4 2 0 3 0 5-1 0 3 0 9-1 9zM510 2441c0-2-2-3-4-3-2 0-3 1-5 2-1 0-2 1-3 1 1-1 2-2 3-4 3-6 1-13-3-18l1-1c0-1 0-1 0-2s-1 0-2 0l-2 2c0-1-1-1-1-1-5-3-12-2-16 2 0-1-1-1-1-2-1 0-2 0-2 1 0 0 0 1 1 2 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 0-1 1-1 2-2 3-3 5-1 11 2 16-5-2-11-7-13-1-1 3 1 6 3 8 3 1 6 2 10 2-1 0-1 0-1 1-26 1-48 19-55 44-1-2-1-4-2-6 0 0 0 0 0-1-4-12-11-24-20-34-5-5-10-10-16-14-3-3-8-7-13-7-4 0-7 2-8 6-3 6-4 13-5 20-2 13-1 26 2 39 0 1-1 1 0 2 2 8 5 15 7 23-26 7-31 44-14 62 9 9 24 13 36 8 11-4 18-14 19-25 0 0 0 0 0 0 1 0 1-1 1-1 0 0 0 0 0-1 0 0 0 0 0-1 11-2 21-9 27-18 0 0 0 0 0 0 1-1 1-2 0-2-1-1-2-3-3-4 1-1 2-3 3-4 0 0 1-1 0-1 3 1 7 2 10 3 1 0 2 0 3-1 1-1 1-4 0-5 0-3 0-7-1-9-2-8-12-14-18-7-1-2-2-4-2-6 4-27 23-47 49-53-1 4-4 7-5 11-2 3-3 6-1 8 3 2 5 1 7 0 1-1 2-3 3-4 1-1 2-2 2-3 1-1 1-1 1-2 3 0 5 2 5 4 1 3 1 7 4 9 2 1 3 1 5-1 2-1 1-5 1-8 0-2-1-4-1-7 0 0 0 0 1 0 4-3 8-8 7-14 3-2 7-5 6-9zm-31 15c0-4 1-9 2-13 0 0 0 1 0 1 1 0 1 0 1 0 4 1 7 1 10 0 1 4 1 8 1 12 0 0 0 0 0 0 0 0 0 1 0 1-5-3-10-3-14-1zm-1-20c-2-7 3-11 9-9s8 9 5 14c0 0 0 0 0 0-4 1-8 1-11-1-1-1-3-2-4-3 1 0 1-1 1-1zm15-17c6 3 8 9 6 16-1 1-2 3-3 4 1-6-2-14-9-15-5-2-10 1-12 5 0-1 1-2 1-3 2-7 10-10 17-7zm-25 25c-1 0-2-1-2-2 0-3 1-4 2-3 4 1 7 3 10 4 0 1-1 2-1 4-2-1-4-1-6-1-1-1-2-1-3-2zm-40 81c0 0 0 1 0 1-13 14-33 22-53 19 0 0 0 0 0 0-1-2-2-4-2-6 0-1 0-1-1-1 0-3-1-5-2-8 0-1 0-1-1-2-2-8-5-17-7-25 0 0 0 0 0-1-1-1-1-3-2-4 19 1 38-6 51-20 0 1 1 1 1 2 0 0 0 0 0 0 5 15 11 30 16 45zm0 14c0 0 0 0 0 0-13 14-33 19-51 14 0-2-1-3-1-5 20 2 40-5 53-20 1 2 2 5 3 7-1 1-3 3-4 4zm-44 24c0 0 0 0 0 0 0 1 0 2 1 2 4 1 8 1 11 1-4 7-10 15-18 17-10 2-18-3-23-11-9-15-2-33 13-41 0 2 1 4 2 6-4 0-8 2-10 4-4 3-4 10-2 14 1 3 5 12 9 11 2 0 4-3 5-5 1-2 3-4 5-6 2 1 4 1 6 2 0 0 0 0 0 0 0 2 0 4 1 6zm-9-9c-2 2-4 5-6 7-1 0-2 2-3 2-1 0-3-5-4-6-2-4-4-9-1-13 2-3 6-5 9-4 2 4 3 9 5 14zm-15-108c2-6 5-15 13-10 3 1 6 3 8 5-5 7-13 10-21 10 0-2 0-3 0-5zm-2 19c0-4 0-8 1-12 10 1 19-2 25-10 10 8 20 20 26 32 0 1 0 1 0 1-13 14-31 21-50 19-2-10-3-20-2-30zm26 126c-11 3-24-1-32-10-14-17-10-50 14-56 0 1 1 3 1 4-18 8-24 31-12 47 5 7 13 12 22 10 11-2 18-11 23-20 1 0 3-1 4-1 0 1 0 1 0 2-1 11-9 20-20 24zm48-46c-10 14-28 21-46 17 0 0 0 0 0 0 0-2 0-3 0-5 16 2 32-4 43-15 1 1 2 2 3 3zm-3-27c3-3 6-4 10-2 3 3 5 7 5 11 1 1 1 3 1 5s0 3-2 3c-2 0-7-2-9-3 0 0 0 0 0 0-2-5-4-9-5-14 0 0 0 0 0 0zm-5-13c-1-2-2-4-2-6 6-26 27-45 53-47 0 1 0 2 0 2-26 6-46 25-51 51zm68-28c-5-2 0-13-8-14-2 0-3 2-4 3-2 2-3 4-4 6-1 1-2 1-3 2-3-1-3-3-1-5 1-3 3-6 5-10 0 0 0 0 0 0 5-2 11-2 15 1 0 0 1 0 1 0 0 2 0 5 1 7 0 2 2 12-2 10zm4-16c-1-1-1-2-1-4 0 0 0 0 0 0 0 0 0 0 0 0 0-2 0-3 0-5 2 0 4-1 6-1 1 4-2 8-5 10zm6-14c-2 1-5 2-7 2 0-1 0-3 0-5 2 0 4 0 6-1 0 0 1-1 2-1 0 0 1-1 1-1 2-1 3 0 3 2 0 2-3 4-5 4zM680 2172c4-1 7-3 7-7-1-4-3-7-7-7 0 0-1 0-1 0 0 0 0 0-1 0-3 1-6 4-5 8 0 4 4 6 7 6zm-1-12c0 0 0 0 0 0 1 0 1 0 1 0 2 1 4 3 4 5 0 2-2 4-4 4-6 0-6-8-1-9zM669 2461c-4-6-13-3-19-2-5-9-13-15-22-20-9-5-18-8-28-9 0-7 0-13 0-20 11 0 21 0 32-2 1 0 1-1 1-1-1-7-1-14-1-21 0-1-1-1-1-1 0-1-1-1-1-1-10 0-21 1-31 3 0 0 0 0 0 0-1 0-2 0-2 1 0 14 1 28 1 42-4 0-9 0-13 1-12 3-24 8-32 18-16 18-20 42-13 64-4 3-9 8-11 13-1 5 1 10 5 12 6 2 15-1 21-2 0 0 1 0 1 0 15 13 38 20 57 16 24-5 44-25 47-50 1-7 1-15-1-22 1-1 2-1 2-2 5-4 13-11 8-17zm-69-54c0-6 0-12 0-18 0 0 0 0 0 0 9-1 19-2 29-2 0 6 0 12 1 19 0 0 0 0 0 0-10 1-20 2-30 1zm55 70c-4 0-9-1-13-1-3 0-7 0-7-4-1-2 1-4 1-6 1-3 1-5 0-7 0-2-1-3-2-4-1-1-2-1-2-2-3-2-2-4 0-7 1 0 1 0 1-1 11 8 19 19 22 32zm-57-44c0 1 0 2 0 3 0 2 2 2 2 0 0-1 0-2 0-3 5 0 10 1 15 3-1 0-1 0-1 1-1 6-7 7-12 4-2 0-3-1-5-1-1-1-2 0-3-1-1 0-2 0-2-2-2-1-3-2-1-4 0 0 0 0 0 0 2 0 5 0 7 0zm-49 25c8-12 18-18 30-22 3-1 6-2 9-2-1 2-2 5 1 7 1 0 2 1 3 1 4 1 7 1 10 3 6 3 14-1 15-8 0 0 0 0 0 0 1 0 3 1 4 1 3 2 7 4 10 5-3 1-4 4-4 6 0 3 2 5 3 6 3 3 5 4 4 8 0 2-1 3-1 5-1 4-2 8 2 10 3 1 6 1 9 1 4 0 8 0 12 1-3 3-6 6-10 8-12 11-26 20-40 27-14 7-29 13-45 17-1 0-3 0-4 1-3-2-5-5-7-7-14-20-14-47-1-68zm-11 78c-7-1-8-7-5-12 2-3 5-6 8-9 2 4 4 8 6 11 0 0 0 1 0 1 1 0 1 0 1 0 1 2 3 5 5 7-5 1-10 2-15 2zm40 9c0 0 0 0 0 0 4-6 10-6 17-4 4 2 8 1 12-2 4-3 7-9 12-11 8-3 16 2 18 10 0 0 0 0 0 0-6 4-12 8-18 10-13 4-28 3-41-3zm75-38c0-2 0-3 0-5 0-2 3-11 5-7 0 0 0 1 0 1 0 8-3 17-6 24-2-4 0-8 1-13zm5-15c-6 0-8 6-8 11 0 7-4 13 0 19 0 0 0 1 0 1-3 5-7 9-11 13-4-12-18-15-27-6-3 3-6 7-10 9-5 1-9-2-13-3-6 0-11 3-14 8 0 0 0 0 0 0-6-2-11-5-16-9 7-2 14-4 21-6 29-10 55-26 77-47 0 3 1 7 1 10zm-6-31c3 0 6-1 9-1 2 0 5 1 6 3 2 4-2 8-5 10-1 1-2 3-4 4-1-5-3-11-6-16zM553 2478c3 4 9-3 11-5 3-4 5-10 1-14-3-2-8-1-9 3 0 0 0 0 0 0 0 1-1 1-1 2-3 3-6 10-2 14zm12-13c0 3-2 6-4 8-1 1-2 2-3 2-1 1-2 1-4 0 0-1 0-2 0-2 0-3 1-5 3-7 0 0 0 0 0 0 0-1 1-2 1-2 0-1 0-1 0-1 1-5 7-2 7 2zM1255 100c0 0 0 1 0 1 21 15 51 15 72-1 19-14 27-42 19-65-7-23-31-39-55-40-24 0-47 16-56 39-9 24 0 51 20 66zm8 2c-13-7-23-20-27-34 0 0 1 0 1-1 6-14 16-25 29-33 1 2 2 3 3 4 2 2 4 0 2-1-1-2-2-3-3-4 13-7 28-10 43-8 0 1 1 2 2 2 0 0 0 1 0 1 2 1 5 2 8 2 11 24 10 52-5 74-17 8-37 7-53-2zm54-83c2 1 4 4 5 6 0 2-2 2-3 2 0 0-1 0-1 0-2-1-4-2-5-4-2-3 1-5 4-4zm13 74c-3 4-6 6-10 8 13-22 14-49 3-72 0-1 1-1 1-2 0 0 0-1 0-2 0 0 0 0 0 0 6-2 11 0 16 3 0 0 0 0 0 0 0 0 0 0 0 0 11 21 7 49-10 65zm7-70c-4-1-9-2-13 0 0 0 0 0 0 0-1-3-4-5-6-6-1 0-2-1-3-1 0 0 0 0 0 0-2-8-7-14-14-17 15 3 28 12 36 24zm-102 20c5-23 24-41 47-45 1 0 3 0 4 0 0 0 1 0 1 0 12 0 22 7 26 18 0 0 0 0 0 0-2 1-3 2-3 5-1 0 0 1 0 1-16-2-30 2-43 8-1-1-2-4-2-6 0-1-3-1-3 1 1 2 2 5 3 7-13 7-23 18-30 32-1-7-1-14 0-21zM1408 366c-1 5-7 7-10 3-1-2-4 0-3 1 5 6 14 4 15-3 1-2-2-2-2-1zM1107 654c1 6 4 11 8 15-1 20-15 35-33 41-7 3-16 4-24 2 8-11 13-26 2-35-6-4-13-2-18 3-4 6-4 13-1 20 2 6 7 11 13 13 0 0 0 0-1 1-5 5-11 8-18 10-5 2-10 0-15 0-1-1-2 2 0 2 4 1 10 3 15 1 6-2 12-5 17-8 1-2 3-3 5-5 8 3 18 2 26-1 18-6 32-22 34-41 6 4 13 7 20 6 1 0 1 0 2-1 0 0 0 0 0 0 23-29 46-58 69-86 1-1 1-1 1-2 0 0 0-1 0-1 0-10-7-17-15-22-3-2-8-6-12-5-1 0-2 0-2 0-1 0-1 0-2 1 0 0 0 0 0 0 0 0 0 1-1 1-2 3-4 5-6 8 0 0 0 0 0 0-21 27-43 54-64 81-1 0 0 1 0 2zm-51 57c-9-3-16-12-14-22 0-5 4-11 10-11 7-1 11 6 11 12 1 8-2 15-7 21 0 0 0 0 0 0zm81-36c0 0 0 0 0 1-13 0-26-10-27-23 0 0 0 0 0 0 5-7 10-13 15-20 1 13 7 25 17 33 1 2 3 0 2-1-10-9-16-21-16-35 4-5 8-11 13-16 0 14 5 27 15 37-6 8-12 16-19 24zm40-107c1 0 1 1 2 0 4 12 14 20 27 22 0 0 0 0 0 0-5 6-9 11-14 17-12-8-18-20-19-35 2-1 3-3 4-4zm13 41c-4 6-9 12-13 17-11-9-18-22-17-37 4-5 8-9 11-14 2 14 8 26 19 34zm-15 19c-6 7-11 14-17 21-11-10-15-23-15-38 0 0 0 0 0-1 5-6 10-12 15-17 0 14 6 26 17 35zm10-64c1 0 2 0 3 1 1 1 2 1 3 2 3 2 6 3 8 5 4 4 7 9 7 15-12-1-22-10-25-21 1-1 3-2 4-2zM1174 544c0 0-1 1-1 1 2 4 3 8 5 12 0 1 3 1 2-1-1-3-2-7-4-10 2 0 3 1 5 2 1 0 2 0 2-1 1-3 2-5 3-8 0-2-2-2-3-1l-2 7c-2-1-4-2-7-1zM1229 565c-4 1-7 4-8 8 0 0 0 1 1 1 1 2 3 3 5 5-3 0-5 0-8 1-1 0-2 0-1 1 0 2 0 3 0 5 0 2 3 2 3 0 0-1 0-3-1-4l10-1c1 0 2-1 1-2-1-1-2-2-3-3-1-1-3-2-3-3-2-2 3-5 5-6 1 0 1-3-1-2zM1241 569c0 1 0 1 0 1-1 0-1 0-1 1-2 2-1 5 0 7 2 2 6 2 8 0 2-2 2-5 0-7-1-2-4-3-7-2zm5 7c-3 2-6-1-4-4 0 0 0 0 0 0 1 0 1 0 1 0 2-2 5 2 3 4zM824 558c0 0-1 1-1 1 0 0 0 0 0 1-2 2-2 5 0 7 2 2 5 2 7 0 2-2 3-5 1-7-2-2-5-3-7-2zm4 7c-2 2-5-2-3-4 0 0 0 0 0 0 0 0 0 0 0 0 3-2 6 2 3 4zM1173 476c0-2-1-3-2-4 0-1-1-1-2-1-1 0-2 0-3 1-1 1-2 2-2 3 0 3 2 5 5 5 2 0 4-2 4-4zm-6-1c0-1 1-1 2-1 0 0 0 0 0 0 0 0 1 1 1 2 0 1-1 1-2 1-1 0-1-1-1-2zM1204 473c0 0 1-1 0-2-4-3-7-6-11-9-1-1-1-1-2 0-11 9-15 24-12 39 1 8 6 14 10 21 5 7 9 20 0 26 0 0 0 1 0 1 0 0 0 1 0 1 0 0 0 0 0 1 0 0 1 1 2 1 3 2 8 1 10-1 6-6 7-17 5-24-2-10-10-16-12-26-3-10 1-21 10-28zm-12 31c3 8 9 14 11 22 2 5 2 11 0 16-1 3-2 6-6 8-1 0-2 0-4 0 1-1 1-1 0-2 10-10 0-25-6-35-10-15-8-36 5-49 3 3 6 5 9 8-9 8-13 21-9 32zM1347 503c3-2 3-5 1-7-2-1-4-2-6 0-2 1-3 4-1 6 1 2 4 2 6 1zm-4-3c-1 0-1-1 0-2 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0 1 0 1-1 4 1 2 3-1 0-2 0-3-1zM1308 651c-2 2-2 6-1 8 2 3 6 3 8 2 3-2 5-6 3-9-1-3-5-4-8-3-2 0-1 3 1 2 4-1 8 5 3 7-3 2-7-2-4-5 1-1-1-3-2-2zM1113 791c-2 5 5 11 9 8 4-4-2-12-7-9 0 0 0 0 0 1-1 0-1 0-2 0zm4 1c2-1 5 3 3 5-2 1-6-2-4-4 0 0 0-1 0-1 0 0 0 0 1 0zM940 2311c2 0 1-3 0-2-5 0-22 5-17 12 1 1 3 0 2-2-2-3 13-8 15-8zM1000 2211c0-2 3-5 5-3 2 1 2 4 0 6-1 1 1 3 2 2 3-3 3-8-1-10-4-3-9 1-9 5 0 2 3 2 3 0zM975 2229l-5 2c-1 1 0 3 2 2s3-1 4-2c2-1 0-3-1-2zM957 2222c0-1-3-1-2 1l1 3c0 2 3 1 2-1l-1-3zM1044 2424c5 0 9 0 13-2 10 0 19-2 27-7 7 4 15 7 22 3 6-2 14-8 15-15 0-2 0-5-2-6-3-2-7 2-10 3-2 1-5 0-8-1 0-21-14-36-31-47-15-10-32-17-48-24 0 0 0 0 0 0 9-7 3-15-5-19-1-1-3 1-1 2 4 2 9 5 8 10 0 3-3 4-5 6-3-1-6-3-9-4 1-1 3-2 3-3 1-3-2-5-4-6-3-2-7-4-10-6 0 0 0 0 0 0-1-31 30-54 37-84 4-13 2-27-7-37-7-9-19-13-30-9-13 5-20 19-26 31 0 0 0 0 0 0-6 6-16 1-22 9-6 7-4 17 3 24 5 4 11 6 18 7 0 0 0 1 0 1 4 2 9 3 13 4-13 14-20 32-22 51-1 0-1 0-1 1-4 1-7 3-10 5-3 1-5 2-6 5-2 3 1 6 4 8 0 0 0 0 0 0-2 1-3 3-4 4-4-2-7-5-10-9-1-1-4 0-3 2 3 4 7 7 11 9-13 17-19 41-14 62 0 0 0 0 0 0 0 0 0 0 0 0-4 4-8 9-13 10-4 2-8 1-12 2-5 0-9 5-5 10 4 5 12 7 18 8 8 0 17-2 24-6 12 17 32 28 54 26 17 0 34-7 48-17 0 0 0 0 0-1zm-41-110c3 1 6 2 7 4 0 2-1 2-2 3-1 0-1 1-1 1-3-1-5-2-7-3 0-1 0-1 0-1-1-3-1-5-1-7 1 1 3 2 4 3zm-48-75c-7-8-7-21 4-24 6-1 12 0 17-4 0 0 0-1 0-1 1-2 2-4 3-6 0 0 0 0 0-1 1-1 3-2 5-1 1 1 2 3 1 4-1 2 1 3 2 2 2-3 1-7-2-9-1 0-2 0-3 0 5-10 13-20 25-20 9 0 17 5 22 12 6 8 7 18 6 27-5 36-46 61-38 100 0 1 0 1 0 1-6 1-11 1-17 1-4-1-14-2-16-6 0-1 0-1 0-1 3-22 10-43 25-59 5-1 10-2 14-5 2-1 0-3-1-2-4 2-9 4-14 4 0 0 0 0-1 0-3 0-7-1-10-2 3 0 5 0 8 0 9-1 19-5 25-12 1 1 2 1 3 2 2 1 3-2 1-2-2-2-5-4-6-7-1-1-4 0-3 2 1 1 2 2 3 3-6 7-16 10-25 11-9 1-21 0-28-7zm-4 75c2-2 7-4 10-5 0 2 0 3 1 5-4 2-7 5-10 8-3-2-5-5-1-8zm-30 105c-5 0-19-2-20-8-1-7 13-5 17-6 5-2 9-6 13-10 2 7 5 13 9 19-6 3-12 5-19 5zm41 12c-25-16-37-48-27-76 2-9 7-17 12-24 4 2 9 3 14 3 1 0 1-3 0-3-4 0-8 0-12-2 1-1 2-2 3-4 10 6 23 7 34 5 2-1 1-3-1-3-9 2-18 2-26-2-2 0-3-1-5-2 3-2 6-5 9-7 2 2 4 4 7 5 9 3 19 2 28 0 2 1 3 1 5 2-2 1-4 1-6 1-2 0-2 3 0 3 3-1 7-1 10-2 3 1 6 2 9 4-1 0-2 0-2 1-9 4-18 6-27 6-2 0-2 3 0 3 11-1 23-3 32-9 15 6 30 13 44 21 18 10 34 25 36 47-6-3-11-5-13 2-1 2 2 3 3 1 2-7 14 3 19 3 2 0 4-2 6-3 8-3 4 5 1 8-3 3-7 6-11 8-6 2-13 0-18-3 1-1 2-2 3-3 2-1 0-3-1-2-8 6-16 10-25 10 4-3 8-7 10-11 0-1 0-1 1-1 0 0 0-1 0-1 0 0 0-1 1-2 0 0 0 0 0 0 0-3 1-5 1-8-1-4-2-8-6-9-5 0-9 5-13 7-5 2-11 3-16 1-4-1-7-3-11-4-5-1-9 1-12 5 0 0 0 0 0 0 0 1 2 2 2 1 0 0 0 0 1 0 3-6 11-2 16 0 1 0 1 0 1 0 1 1 2 1 3 1 2 1 5 1 7 1 1 0 2 0 3 0 2-1 3-1 4-2 1 0 1 0 2 0 0 0 0 0 0-1 2-1 4-2 6-3 2-2 6-5 9-1 1 2 1 5 1 7 0 1-1 3-1 5-4 10-13 16-23 18-12 1-23-4-32-11-1 0-2 1-2 2 0 0 0 1 1 1 7 5 15 9 24 10-22 16-54 23-78 7zM740 2354c12 18 38 25 58 26 21 0 49-6 60-26 5-9 5-19-1-28-6-9-17-14-28-16-7-2-14-3-21-4 1-11-8-20-18-22 0-6 2-10 7-14 4 3 10 3 14 3 0-1 1-1 1-2 0-4 1-8 1-13 0 0 0 0 0 0 0-1 0-1-1-2-5 0-14-1-17 4-8 3-14 11-14 20-1 0-1 0-1 1 0 1 1 2 1 4 0 0 0 0 0 0-9 3-15 12-15 21 0 0 0 1 0 1-1 0-2 1-3 1 0 0 0 0-1 0-1 0-2 1-3 1-2 1-4 2-5 3-6 3-12 7-16 12-2-4-5-7-11-7-5 0-9 3-9 8 0 7-1 13-1 19 0 5-1 11 2 15 6 7 16 1 21-5zm71-95c-1 4-1 7-2 11-4 0-13-1-12-7 0 0 0 0 0-1 1 0 1 0 1-1 2-3 8-3 13-2zm-28 25c0 0 0-1 0-1 0-8 4-16 11-19 0 0 0 0 0 0 0 2 0 3 1 4-5 4-8 10-8 16-1 0-2 0-4 0 0 0 0 0 0 0zm-14 22c0-10 8-20 19-19 0 0 0 0 0 0 1 0 1 0 1 0 10 1 17 9 16 18-12-1-24-1-36 1 0 0 0 0 0 0zm-16 10c0 0 0-1 0-1 1 0 1 0 2-1 2-1 4-2 6-2 17-7 36-5 53-2 18 3 49 10 45 34-4 22-33 31-52 33-19 1-41-3-57-15-10-8-18-22-10-35 3-5 8-9 13-11zm-23 4c3 1 5 4 6 6 1 1 1 1 1 1-4 8-3 17 1 25-2 3-5 5-8 6-3 1-7 1-9-2-1-2-1-5-1-7 0-8 0-16 1-24 0 0 0 0 0 0l0 0c0-4 5-6 9-5zM766 2343c3-3 2-8-1-11-3-2-8-2-11 1-3 2-2 8 1 10 3 4 8 3 11 0zm-10-9c2-1 5-1 7 0 2 2 3 5 1 7-2 2-5 3-7 1-2-2-3-6-1-8zM792 2349c4 1 9-2 10-6 1-5-2-8-6-10-4-1-9 1-10 6-2 4 1 9 6 10zm-4-9c1-3 4-5 7-4 0 0 1 0 1 0 2 1 4 3 3 6 0 3-4 5-7 4-2 0-5-3-4-6zM830 2350c5 0 9-5 8-10-1-5-6-8-11-7 0 0 0 0-1 0-3 1-5 4-5 8 0 5 4 9 9 9zm0-15c0 0 0 0 0 0 3 1 5 2 5 4 2 4-1 8-5 8-3 1-6-1-6-4-1-4 2-8 6-8zM816 2344c0 0 0 0 0 0 0 0 0 1 0 1 3 6 10 11 18 9 7-2 12-10 10-18s-11-12-18-10c-7 3-12 11-10 18 0 0 0 0 0 0zm25-7c2 6-2 12-7 14-6 3-13-1-16-7-4-15 19-22 23-7zM786 2353c7 4 16 1 20-5 0 0 0-1 0-1 0 0 1 0 1-1 3-7 0-16-8-19-6-3-15 0-18 7-3 7-1 15 5 19zm-2-19c3-5 10-7 15-4 5 3 6 7 6 12 0 3-2 6-5 8 0 0-1 0-1 1-3 2-8 2-11 0-6-3-8-11-4-17zM759 2351c6 1 14-5 15-11 2-8-4-15-11-16-7-1-14 4-16 11-1 8 4 15 12 16zm-9-14c1-15 25-12 22 2-1 5-6 9-11 9-7 1-12-5-11-11zM946 1257c2-1 1-3-1-3-4 1-7 6-5 10 3 5 9 6 13 3 11-7 2-22-8-24-13-2-20 11-18 22 3 13 19 18 30 13 16-7 19-27 9-40-1-1-3 1-2 2 9 11 6 27-5 34-9 5-24 3-28-7-5-10 2-23 14-21 5 1 9 5 10 10 1 4-1 8-5 10-7 2-11-8-4-9zM1104 277c1-1 2-3 2-4 1-2-1-3-2-2-1 2-1 3-2 5-1 1 2 3 2 1zM952 249c12 1 23-5 34-9 2 1 6 1 8 2 8 7 17 12 27 15-2 2-4 4-4 6 0 2 1 2 3 3 4 1 7-1 11-1 0 2 0 4 2 5 2 0 4 0 6-1 1 3 3 6 6 9 7 7 18 7 28 6 0 0 1 0 1 0 5 2 10 4 15 6 8 2 16 4 24 1 6-3 10-8 9-15 0-6-4-11-7-16 3-2 8-5 8-10-1-2-2-3-4-4 2-2 4-5 3-8 6-2 7-8 11-11 3-2 7-2 10-3 3-1 6-3 9-4 5-3 9-7 11-12 0 0 0 0 0 0 7-1 18-3 21 6 3 8-6 15-11 19-12 7-24 15-36 21-1 1 0 2 1 3 16 2 32-1 47-7 14-6 28-15 35-28 8-13 6-27-5-36-13-11-30-11-46-11 0 0 0 0-1 0 0-1 0-2 0-4 0 0 0 0 0 0-2-17-9-32-20-44 0 0 0 0 0 0 0 0 0-1-1-1 0 0 0 0 1 0-1 0-1 0-1 0-14-36-48-62-86-66 1-2 2-4 3-7 2 4 5 7 9 6 4-1 4-5 5-9 3 3 8 7 12 5 4-1 3-6 3-9-2-12-11-21-21-26-8-4-16-3-16 7 0 7 1 13-1 19-2 5-4 9-7 12 0 0 0 0 0 0-30-1-57 11-77 30-6-5-10-11-12-19-1-4-1-7-1-11 0-3 1-5-1-8-4-9-20 2-23 8 0 0 0 0 0 0-5 6-9 13-8 20 0 7 8 2 13-1-1 6-3 13 4 16 4 2 7-2 9-6 3 5 8 7 14 7-13 15-21 33-24 53-2 14-1 28 2 42-8 5-16 12-19 21-4 9-4 20 3 28 6 7 15 11 24 11zm167-7c-1 2-3 3-4 4 0 0 0 0 0 0 0 0 0 0 0 0 0 0-1 0-1 0-1 1 0 3 1 3 4-1 5 3 3 6-1 1-3 2-5 3 0-1 0-1 0-1-5-9-4-19-6-28 0-1 0-1 0-2 2-3 9-12 10-4 1 4-2 8-4 11 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0-1 2 1 3 2 2 3-1 5 3 4 6zm-153-151c-6 1-11-2-12-8-1-1-2-1-3 0-1 4-6 11-10 4-2-4 0-9 1-13 0-1-1-1-2-1-3 1-5 3-8 4-1 1-3 2-3 0-1-1 0-4 0-5 2-5 4-9 7-13 0 0 0 0 0 0 0 0 0-1 1-1 0 0 1-1 2-2 0 0 0 0 0 0 3-3 7-6 11-6 8-1 5 12 6 17 1 9 6 17 13 23 0 1-1 1-2 2 0 0 0-1-1-1zm-38 118c3-8 10-13 17-18 0 0 0 0 0 1 1 1 3 0 3-1-1-1-1-1-1-2 0 0 0 0 0-1-8-31-2-65 19-90 19-24 49-38 80-37-1 1-2 2-3 3-1 1 1 3 2 2 6-5 10-11 12-18 1-4 2-7 2-11 1-5-2-12 2-16 6-5 19 7 23 11 3 4 5 9 6 14 0 3 1 3-2 5-2 1-2 1-4 0-3-2-5-3-7-5-1 0-2 1-2 2 0 1 0 2 0 4 0 2-1 3-3 2-2 1-3 1-4-1-1-1-2-2-3-3-1-1-2-1-3 0-1 6-3 11-8 15-1 2 1 4 2 2 2-1 3-3 4-4 0 0 0 0 0 0 37 3 70 27 84 61-1 0-2 1-1 2 14 13 22 31 23 50 0 1 1 1 2 1 0 0 0 1 1 1 15-1 32-1 44 9 5 5 9 11 9 18 1 8-4 16-9 22-17 20-45 29-71 27 8-4 15-8 23-13 7-4 16-9 20-17 3-5 3-12-1-16-6-5-13-4-19-3 1-4 1-9 0-14-1-1-4-1-3 1 4 12-5 23-16 28-4 2-9 2-13 4-4 3-7 10-12 12-1-2-3-2-4-3 2-4 5-11 0-14-4-4-9 0-12 4-4-10-13-18-25-20-5-28 10-57 37-67 2 0 1-3 0-2-3 1-6 2-9 4 2-4 3-8 5-12 1-2-2-3-2-1-2 4-4 9-6 14-1 0-1 0 0 1-21 13-32 38-27 63-7-1-12 1-17 4 0 0 0 0 0 0-5-10-13-17-23-22 0 0 0 0 0 0-1-3-4-6-7-7-1-1-2 1-1 2 2 1 3 2 4 4-2-1-3-1-5-2-2 0-3 2-1 3 13 3 24 11 30 23 0 0 0 0 0 0-5 4-10 11-12 18-8-3-16-7-22-13 3-4 3-9-1-13-3-3-8-3-12-1-3-5-6-11-8-17-1-2-3-1-3 1 7 21 23 37 44 45 0 0 0 0 0 1 1 0 1 0 1 0 0 0 0 1 0 1 0 2 2 2 3 1 0-1 0-2 0-3 0 0 0 0 0 0 3-12 13-22 26-23 14-1 26 8 30 21 0 1 0 1 0 1 0 1 0 1 0 1 2 7 2 14 3 21 1 6 5 11 8 17 2 2 3 5 4 7 0 0-1 0-1-1-1 0-2 0-2 1 0 1 0 1 1 2 0 0 1 1 1 1 1 0 1 0 2 0 0 4-1 8-5 11-7 4-16 3-23 1-15-4-29-11-36-24 1-1 1-2 2-2 2-1 1-3-1-3-2 2-4 3-6 4-2 1-1 3 1 3 0-1 1-1 1-1 4 7 10 12 17 17-7 0-14 0-20-4-7-4-11-13-6-20 1-1-2-3-3-1-2 3-2 6-2 9-2 2-6 1-5-2 0-1 0-2-1-2-3 0-4 1-7 2-1 0-5 0-6-1 0-1 1-2 2-2 3-3 7-4 10-6 1-1 0-3-1-3-4 0-9-1-12-4-6-6 5-7 9-6 0 0 1 0 1 0 0 0 0 0 0 0 0 0 0 0 0 0 2 1 2-2 1-2-2-2-4-4-5-6-1-2-3-4-3-5-1-4 3-4 6-3 3 1 5 3 7 6 0 2 3 0 2-1-2-3-5-7-9-8-2-1-7-1-9 2s0 4 1 7c2 2 3 5 5 7-5-1-11 1-11 7 0 5 8 7 13 8-1 1-2 1-3 2-10-3-19-8-26-15 0 0-1 0-1 0 0 0 0-1-1-1-13-11-23-27-26-45-1-2-3-1-3 1 1 2 1 3 1 5-6 2-10 9-8 16 3 6 11 8 17 4 4 6 8 12 14 18-2-1-3-1-4-2 0 0-1 0-1 0-17 7-39 16-54 1-8-8-9-19-4-29zm94 1c0 0 0 0-1 1-3-3-6-7-9-10 3-2 7-2 9 1 3 2 3 6 1 8zm-47 9c-4 3-10 2-12-3-3-5 1-11 6-12 2 5 4 10 6 15zM773 650c0-1-1-2-2-3-1-1-3 0-2 1 1 1 1 2 2 4 1 1 3 0 2-2zM624 617c0 2 0 5-1 7-1 2 2 3 2 1 1-3 2-5 2-8 0-2-3-2-3 0zM631 618c1 3 0 5-1 7 0 2 2 3 3 1 1-2 1-5 1-8 0-2-3-1-3 0zM637 619c0 3 0 5 0 7 0 2 3 2 3 0 0-2 0-4 0-7 0-2-3-2-3 0zM644 621c0 1 1 3 0 4-1 1 1 3 2 1 1-2 1-5-1-7-1-1-3 1-1 2zM593 492c-1-1-3 1-2 2 3 3 6 6 9 9 2 1 3 0 2-2-3-3-6-6-9-9zM781 127c-1-1-2 1-1 2 1 0 2 1 3 1-1 2-2 3-3 5-1 0-1 0-1 1 0 1 0 1 0 2 0 0 0 0 0 1-1 0-1 0-2 0-1 0-1 3 0 3 1 0 1 0 2 0-1 1-1 3 0 4 0 4 0 7 1 11-1 0-2 0-3 1-2 0-1 3 1 2 1 0 2 0 3-1 1 4 2 8 4 12-1 1-1 1-2 2-2 1 0 3 1 2 1 0 2-1 2-2 2 3 3 5 5 7 0 1 1 2 1 3 0 0-1 0-1 0-2 1-1 3 1 3 0 0 1-1 1-1 0 1 1 1 1 1 1 3 3 6 4 9 0 0-1 0 0 1 0 0 0 1 0 1 0 1-1 1-1 1-1 3-3 3-5 0 0 0-1-1-2-2 0-2 0-4-1-6 0-1-3-1-3 1 1 1 1 2 1 3 0 0-1 0-1-1-4 0-7 1-8 4-1-1-2-2-3-3-1-1-3 1-2 2 1 1 2 2 3 3-1 4-2 8-2 11 0 0-1 1-2 1-1 1 0 3 2 2 0 0 0 0 1 0 0 3 2 6 4 9-1 0-1 0-2 0-1 0-1 3 0 3 1 0 2-1 3-1 3 2 7 4 10 5v4c0 2 3 2 3 0 0-1 0-2 0-3 3 0 6 0 9-1 1 1 1 2 1 2 1 2 3 1 3 0-1-1-1-2-1-2 2-1 4-3 6-4 1 0 2 0 2 0 1 1 1 2 1 3-2 3-5 5-6 8 0 0 0 0 0 1-2 5 0 10 4 12 0 0 0 1 1 1 10 6 19 13 26 22 1 1 1 1 2 1 0 0 0 0 0 0 17 1 32-9 40-25 0 0 0 0 0 0 1 0 1-1 1-2-3-10-6-21-9-32 0-6-4-12-10-14 0 0-1 0-1 0-4 0-9 3-13 5-1-2-2-4-4-6 0 0 0 0 0-1 6-2 9-7 10-13 0 0 1 0 2 0 2-1 1-4-1-3 0 0-1 0-1 0 0-4-1-8-3-11 0-1 1-2 1-3 1-1-1-3-2-1 0 0-1 1-1 1-2-1-3-3-5-5 0 0 0 0 0-1 0-1-2-2-3-1 0 1 0 1 0 1-2-1-4-1-7 0-1 1-2 2-3 4-1 1 0 2 0 3 0 2 0 3 0 5-1 0-3 0-4 0-1-5-3-11-5-16 0 0 1-1 2-1 0-1 0-2 0-2-1-1-2-1-2 0-1 0-1 0-1 0-1-3-3-6-5-9 1-1 2-3 2-4 0-2-3-2-3 0 0 1 0 1 0 2-1-1-1-1-1-2-2-2-3-4-5-6 1 0 1-1 2-2 1-1-2-2-3-1 0 0 0 1-1 1-3-2-6-5-10-6 0-2 0-3-1-4 0-2-3 0-2 1 0 1 0 1 1 2-2-1-4-1-6 0-2 0-4 1-5 2-1-1-2-2-4-2zm6 70c0 1 0 2-1 2 0 2 2 3 3 1 0 0 0-1 0-1 3 3 8 6 11 3 2 4 4 9 7 13-1-1-3-1-4-2-5-1-10 0-15-1-5-2-8-8-7-14 0 0 0 0 0-1 2-1 4-1 6 0zm16 26c-1-2-3-1-3 1 1 1 1 2 1 3-2 1-5 1-8 0 0 0 0 0 0 0 0-1-2-1-2 0-3-1-6-2-8-4 0-1 0-1-1-1 1 0 1-1 1-2 1-1-1-2-2-1 0 0 0 1 0 1-2-3-3-6-4-9 0 0 1 0 1 0 1-1 0-3-1-2 0-3 0-6 1-8 0 0 0 0 0 0 1 5 3 10 8 13 5 2 10 1 15 1 4 1 7 3 10 6 0 0-1 0-1 0 0 0 0 0-1 0-1 1-1 2-1 2-1 1-3 2-4 3 0-1-1-2-1-3zm38 47c-6-7-14-13-21-19 0 0 0 0 0 0 11 0 22-5 31-11 8-5 17-12 21-20 2 9 5 17 7 26 0 1 0 1 0 1 0 0 0 0 0 0-1 0-1 0-1 1-7 14-21 23-37 22zm26-48c-4 7-11 12-17 16-7 4-13 7-21 9-3 1-7 2-11 2-3-1-5-2-7-4 1 0 3 1 4 1 6 0 13-3 18-5 6-3 12-6 17-10 5-4 10-8 14-13 3-3 5-7 4-11 3 4 2 11-1 15zm-5-19c5 2 4 7 2 11-4 7-12 13-19 17-7 5-14 8-21 11-2 0-5 1-7 1-5 0-7-3-5-8 1-2 3-4 5-6 0 1 0 2 0 3 0 0 1 1 1 1 16 3 31-5 36-20 0-1-1-1-2-2 0-1-1-2-1-3 3-3 7-6 11-5zm-68-74c1 0 1 0 1 0 0 1 0 1 0 1-1 2 1 3 2 2 0-1 1-1 1-2 0 1 1 1 2 1 0 0 0 0 0 0 0 4 1 8 2 11 1 2 4 1 3 0-1-3-2-6-2-9 1 1 2 2 3 3 0 1 0 1 0 1-1 2 1 3 2 2 0 0 0 0 0-1 2 3 4 5 6 8-1 0-1 0-1 0-2 0-1 3 0 3 1-1 1-1 2-1 0 0 0 0 0 0 2 3 3 6 4 9 0 0 0 0 0 0 0 1 0 2 0 2 1 0 1 0 1 0 2 4 3 8 4 12 0 0 0 0 0 1 1 2 2 6 4 7 1 1 2 3 3 4 1 2 4 0 3-1-1-1-2-2-2-3 3-1 3-4 3-7 0-2 0-4 1-5 1 3 3 6 4 9 0 0 0 0 0 1 1 5-1 9-4 13-1 1 2 3 3 1 3-4 4-9 3-15 0 0 0 0 0-1-1-3-2-7-5-11 1 0 3 0 4 1 0 0 0 0 0 1-1 1 2 2 2 0 0 0 0 0 0 0 2 2 4 3 5 5 0 0 0 1-1 1-1 2 2 3 3 2 1 1 1 3 2 4 0 1 0 3 0 5-1 0-2-1-3-1-2-1-3 2-1 3 1 0 3 0 4 0-1 5-4 8-8 11-1-1-4 0-4 2 0 1 2 2 3 2 3 4 5 9 7 14 0 2-1 4-3 5 0 0 0 0 0 0-2-3-4-6-6-9 0-1-3 0-2 2 1 2 3 5 5 7 0 1 0 1 0 1l1 1c0 0 1 0 1 0-3 4-7 7-11 8 0 0 0-1 0-1-10-14-20-29-28-44-1-2-3 0-2 1 8 15 17 30 28 44 0 1 0 1 1 1-3 1-6 1-10 1-3 0-3 0-4-2-1-2-1-3-2-4-1-1-2-1-3-2 0 0 0-1-1-1 0-1 0-1 0-1-5-7-9-15-12-22 0-3-2-6-3-8-1-2-2-4-3-7 0 0 0 0 0 0 2 0 1-3 0-2-1 0-1 0-1 0-2-2-3-5-4-7 0-1-1-1-1-1-1-1-1-1-2-2 1 0 1 0 1 0 1-1 0-4-1-3-1 0-1 0-1 1-2-4-3-7-4-11 0 0 0 0 0 0 2-1 1-3-1-3 0 0 0 0 0 0 0-1 0-2 0-3-1-3-1-7-1-11 2 3 3 6 5 9 1 1 3 0 2-1-2-3-3-6-4-9 1 0 1-3-1-3 0 0 0 0-1 0 0 0 0 0 0-1 1-2 2-4 3-5 0 0 1 0 1 0 1 1 3-1 1-2 0 0 0 0 0 0 2-1 4-1 7-1zM993 321c-4 4-6 11-3 17 0 1 3 0 2-1-2-5-1-10 3-14 1-2-1-4-2-2zM997 330c-2 3-2 7-2 10 0 2 3 1 3 0-1-3 0-6 1-9 1-1-1-2-2-1zM1389 147c-2 1-2 2-3 3 0 0 0 1 0 1 0 1 0 1 0 1 0 2 1 3 2 4 1 0 1 1 1 1 2 1 4 1 4-1 1-2 0-4 0-6-1-1-2-3-4-3zM1411 148c1-1 1-1 1-2 0-2-1-4-2-5 0-1-2-2-3-1 0 0-1 0-1 1 0 0-1 0 0 1 0 1 0 2 1 2 0 3 2 5 4 4zM1405 155c0 3-3 4-5 2-1-1-3 1-1 2 3 3 8 1 9-4 0-1-3-1-3 0zM454 1969c-5 1-10 4-12 9-2 6 1 13 5 18 0 0 0 0 0 0 9 9 23 18 35 16 13-2 13-16 7-24-8-10-22-20-35-19zm-5 25c0 0 0 0-1 0 12-3 22 4 26 15 0 0 0 0 0 0-9-3-18-8-25-15zm39 12c-2 3-7 4-11 3-4-13-15-21-29-18-1 0-1 0-1 0-3-4-5-9-2-14 4-6 12-6 18-4 9 3 19 9 24 17 3 5 5 12 1 16zM1251 751c-1 0-2 0-2 1-8 25-11 50-14 75 0 1 0 1 0 2 0 0 0 0 0 0 19 20 50 26 75 13 0 0 0 0 0-1 1 0 1 0 1 0 1-4 1-7 2-10 0 0 0 0 1 0 12-2 23-12 25-25 2-13-5-25-17-31 0 0 0 0 0 0 0-2 0-3 1-4 0-1 0-1 0-2 0-5-7-8-11-10-7-3-14-6-21-7-7-2-15-3-22-3-4 0-8 1-12 1-2 0-4 0-6 1zm-13 77c3-25 6-49 13-73 12 9 26 16 41 18 7 1 14 2 21 2 2-1 4-1 6-1-3 21-6 43-11 64 0 1 0 1 0 2 0 0 0 0 0 0-23 12-52 6-70-12zm27-67c15-2 30 2 42 11-1 0-3 0-5 0-6 0-12-1-18-3-6-2-13-4-19-8zm55 23c7 6 12 15 10 23-2 8-8 13-16 15 3-13 4-25 6-38zm16 22c-2 11-11 20-23 22 0-1 1-2 1-3 9-2 17-8 19-18 2-10-4-20-12-26 0 0 0 0 0 0 0-1 0-2 0-4 11 6 17 17 15 29zm-54-53c12 2 25 6 35 12 3 2 2 6-1 7-1 0-3 0-4 0-15-12-32-17-51-13-2-1-4-2-7-4 0 0 0-1 0-1-1 0-1 0-2-1-1-1 1 0 2 1 3 0 7-1 10-2 6 0 12 0 18 1zM1303 718c-1-3-3-6-6-8-2-3-4-5-3-9 0-3 4-6 7-6 2 0 2-3 0-3-4 0-8 3-9 7-2 4 0 8 2 11 2 3 5 5 6 8 2 6-4 9-8 12-4 3-7 7-6 13 1 1 3 1 3-1-2-11 17-12 14-24zM1318 720c1 0 0-2-1-2-6 1-6 7-5 12 1 3 2 7-1 10-1 1-3 1-4 3-2 1-3 3-3 5 0 2 2 2 3 0 0-4 7-6 8-10 2-5-4-17 3-18zM1268 743c-2 0-1 2 1 2 2 0 4-3 4-5 0-1-1-3-2-4 0-1-1-1-1-2 0-1-1-1-1-1-1-2-1-4 2-5 1 1 2-2 1-3-3-1-6 1-6 3-1 2 0 4 1 6 1 2 6 8 1 9zM486 2592c1 0 2-2 1-3-7-3-12 6-7 11 6 6 15 1 17-6 1-8-6-14-13-14-9 1-13 10-12 17 0 2 3 1 3 0-2-10 9-19 17-11 3 3 3 8 0 12-3 2-6 3-8 1-2-1-3-3-3-5 1-2 2-3 5-2zM1261 450c-9-3-17 4-19 13 0 1 2 2 3 0 1-9 14-16 21-7 3 3 3 8 0 12-1 2-4 4-7 4-8-1-6-13 1-10 1 1 3-2 1-2-7-4-13 4-9 10 4 8 15 4 18-3 3-7-1-15-9-17zM1035 1407c0 17 6 37 22 44 17 7 35-3 42-19 8-19 1-40-12-54-10-11-25-22-39-13-13 8-13 29-13 42 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0zm11-37c2-2 5-4 8-5 9-3 18 3 25 9 13 11 23 28 21 46-2 17-17 33-35 30-20-3-27-26-27-43 0-4 0-10 0-16 0 0 1 0 1 0 3-2 5-3 8-6-1 4-2 8-1 13 0 0 0 1 1 1 5-1 10-3 15-4 2-1 1-3 0-3-5 1-9 3-14 4 0-5 1-10 2-15 0-1-2-1-3-1-2 4-5 6-9 8 1-6 3-13 8-18zM387 442c36-38 63-84 79-133 0-1 0-1 0-1 12 0 24-7 29-19 9-21-3-43-19-58 0 0-2 0-2 1 2 19-18 29-25 44-3 6-5 15-1 22 0 0 0 0 0 0-11 15-20 30-28 45-1 1-1 1-1 2-16 30-28 63-34 96 0 1 1 2 2 1zm56-133c4 6 10 9 17 10-4 12-10 25-16 37-9 0-17-3-22-11 6-13 14-24 21-36zm0 49c-14 29-33 56-55 79 7-31 18-61 32-89 6 7 14 11 23 10zm6-74c1-7 6-13 10-18 8-9 17-18 18-30 13 12 22 30 17 48-3 9-9 17-18 20-4 1-8 2-13 1 9-3 16-10 18-19 0-2-2-3-3-1-2 10-10 17-20 18 0 0 0 0 0 0 0 0-1 0-1 0 0 0 0-1 0-1-1-3-1-6 0-8 1-2-1-3-2-2-2 3-2 6-1 9-1 0-1-1-2-1-4-4-4-10-3-16zm0 17c0 0 0 0 0 0 1 0 1 1 2 1 0 1 1 1 2 2 0 0 0 0 0 0 3 2 7 3 11 4 0 0 0 0 0 0-1 2-2 5-3 8-7 0-13-4-16-10 1-1 3-3 4-5zM740 952c-4 16 6 32 20 38 1 0 1 0 1 0 1 6 2 12 4 17 7 18 22 31 40 38 19 6 39 3 57-6 9-5 18-11 27-17 10-6 21-11 31-15 18-6 35-15 41-34 6-18 1-38-8-53-4-7-9-14-15-19 11-15 6-37-12-45-16-8-36 2-41 19-9-1-18-2-27 0-34 4-64 26-82 55 0 0 0 0 0 0-15-3-32 7-36 22zm185-94c16 7 21 27 11 41-14-12-31-20-49-24 5-15 23-24 38-17zm-81 22c34-10 73 1 97 28 12 13 20 31 20 49 0 10-3 19-8 27-6 8-15 13-25 17-8 4-16 6-24 10-9 4-17 10-26 15-16 11-34 21-54 20-22-2-43-14-53-33-11-20-9-44-1-64 13-32 40-59 74-69zm-69 52c-3 4-5 9-7 13 0 0 0 1 0 1 0 0-1 1-1 2-1 1-1 3-2 4 0 1 0 1 0 1-3 11-5 23-4 34-13-5-22-20-18-34 3-14 18-23 32-21zM805 1006c8-6 16-12 24-18 5-4 11-8 14-15 6-10 2-23-7-30-12-9-28-3-38 8 0 0 0 0 0 0-8 10-13 22-12 36 0 10 7 27 19 19zm-3-56c0 0 1 0 1 0 9-9 25-13 35-1 4 5 6 13 5 19-3 8-9 13-16 18-6 5-13 10-20 15-4 4-9 6-14 2-2-3-4-8-4-11-3-15 3-31 13-42zM861 947c4 4 10 4 16 3 10-2 20-3 30-1 6 1 14 3 19 0 5-4 7-10 6-16-4-13-18-23-30-26-7-2-16-3-23-1-6 2-12 6-16 12-7 8-11 20-2 29zm4-27c0 0 0 0 0 0 4-5 9-10 16-11 6-2 14-1 20 1 8 2 15 6 20 11 6 6 14 18 5 25-7 5-17 0-24-1-8-1-16 0-23 2-8 1-15 1-19-6-4-7-1-16 5-21zM875 973c2 8-8 12-13 7-1-2-3 0-2 1 7 9 20 2 18-8 0-2-3-1-3 0zM877 935c1-1 2-2 2-3 1 0 1 0 1-1 0-2-1-3-3-4 0 0 0 0 0 0 0 0 0 0 0 0-2-1-4-1-5 1-1 0-1 1-1 2-1 0-1 0-1 1 0 3 4 6 7 4zm-2-2c0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0zm-1-4c0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0 1-1 0-1 1-1 1 0 0 0-1 1-2zM822 962c1 2 3 3 5 2 3-2 4-7 1-9 0 0-1 0-1 0-1 0-3 0-4 0-2 2-3 4-2 6 0 1 1 1 1 1zm2-2c0 0 0 0 0 0 0 0 0 0 0 0zm0-2c0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0zM110 396c-1 0-1 0-2 0-32 28-65 56-97 83-1 1-1 2 0 2 0 24 29 46 52 45 11-1 23-7 33-13 11-6 20-14 26-25 1 0 1 0 1 0 9-14 14-31 11-48-3-17-11-32-24-44zm-43 127c-22 3-50-16-53-38 22 20 55 36 84 23 2-1 4-2 6-3-2 2-5 3-8 5-9 5-19 11-29 13zm60-48c-11 26-39 40-67 33-17-5-33-14-45-26-1-1-1-1-1-2l95-81c20 19 30 50 18 76zM920 1043c-2 0-3 3-1 3 27 5 52 15 76 29 3 2 6 4 7 6-15 1-30 1-45 2-6 0-15 3-19-1-1-2-2-4-3-6-6-9-13-19-19-29 0-1-1-1-2 0 0-1-2-2-2 0-6 12-11 25-17 37-2 5-5 10-3 15 2 4 7 5 12 6-2 7-2 15 0 22 2 5 7 6 13 6 1 0 2 0 3 0-1 10 10 13 18 11 11-2 22-9 31-17 2 2 5 3 8 4 7 1 10-5 12-10 4-8 7-15 11-23 2-5 5-11 5-16-1-7-9-10-14-13-7-4-15-7-22-11-16-6-32-11-49-15zm-13 83c-3-5-2-15-1-20 8 2 16 4 24 6 8 3 16 6 24 9 2 1 3 1 4 2-10 4-21 6-32 7-6 0-16 2-19-4zm25 17c-5 0-10-5-10-10 14-1 27-4 40-9 1 1 3 1 4 2-6 5-12 9-20 12-4 2-9 5-14 5zm69-55c0 2-2 4-3 6-2 7-5 13-8 20-2 4-4 12-9 14-4 1-8-2-12-4-3-1-6-2-9-3-6-3-13-6-20-8-7-3-13-5-20-6-3-1-7-2-10-3-4-1-10-1-13-4-6-3-1-11 1-15 5-12 10-25 16-37 0 0 0 0 0 0 7 11 13 21 20 32 1 1 1 2 2 3 4 5 11 3 16 3 17-1 33-1 50-2 0 1 0 2-1 4zM666 951c-3-1-7-1-9 1 0 0 0 0-1 0-9 5-19 10-29 15-8 4-16 9-21 16-10 16-3 33 8 46 0 0 1 0 1 0 2 2 3 3 5 4 13 9 32 5 40-9 4-7 5-16 7-25 2-10 7-18 8-28 1-7-1-17-9-20zm-62 52c-1-8 2-17 8-23 6-6 14-9 22-13 5-3 11-6 17-9-4 9-15 13-23 17-7 4-14 9-18 17-4 7-4 15-3 23-1-4-3-8-3-12zm65-18c-3 7-4 14-6 21-1 7-3 15-8 21-11 12-30 10-39-1-11-13-8-32 4-43 10-9 28-11 34-24 1-2 2-4 3-5 1 0 1 0 1 0 0 0 0 0 0 0 2-1 3-1 5-1 5 1 8 5 9 9 3 8-1 16-3 23zM638 989c-20-1-27 26-11 37 0 0 0 0 0 0 1 0 1 0 1 0 0 1 1 1 1 1 6 2 13 2 19-2 0 0 0 0 0 0 8-5 11-14 9-22-2-8-10-14-19-14zm11 32c0 0 0 0 0 0-6 5-14 6-20 3 0 0 0 0 0 0-14-9-8-33 9-33 16 1 23 20 11 30zM634 1017c-1 1-3 0-2-2 1-1-2-3-2-1-1 2-1 4 0 5 2 2 5 1 6 0 1-1-1-3-2-2zM643 1008c0 0 0 1 0 1-2 1 0 3 2 2 0 0 0-1 0-1 2-1 0-3-2-2zM777 457c0 0 0 0 0 0 0 0 0 0 0 0-3 3-3 8-1 11 3 3 7 3 11 1 3-3 4-8 1-11-3-3-7-3-11-1zm8 10c-5 4-10-4-6-8 0 0 0 0 0 0 5-3 11 4 6 8zM862 130c0 3 4 5 8 3 3-1 5-5 3-8-2-2-4-3-6-3 0 0 0 0-1 0 0 0 0 0 0 0-1 0-2 1-3 1 0 0 0 1 0 1-1 2-2 4-1 6zm8-4c2 2 0 4-2 5-1 1-4 0-4-2 0-2 1-4 3-4 1 0 2 0 3 1zM731 182c0 0 0 0 0 0-1 0-1 0-1 0-1 0-2 0-2 1-1 0-1 0-1 1-1 1-2 3-1 5 1 4 5 5 8 4 3-1 5-5 3-8-1-2-3-3-6-3zm2 9c-2 1-4 0-5-2 0-2 1-4 3-5 1 0 3 1 3 2 2 2 1 4-1 5zM615 348c3-2 5-5 3-9-1-1-3-3-5-3-1 0-1 0-1 0 0 0-1 0-1 0-1 1-1 1-2 1 0 1-1 1-1 1-1 2-1 4-1 6 1 4 5 5 8 4zm1-7c1 1 0 4-2 4-2 1-4 0-5-2 0-2 1-3 3-4 1 0 3 1 4 2zM1156 110c0 0 0 0-1 1 0 0 0 0-1 0-1 3 0 6 2 8 2 2 5 2 7 0 2-3 3-6 1-8-2-2-5-3-8-1zm6 7c-3 3-7-1-5-4 0 0 0-1 0-1 0 0 0 0 0 0 3-2 7 2 5 5zM529 2594c2-1 4-3 4-6-1-3-3-5-6-4-1 0-1 0-1 0-2 1-4 4-3 6 0 3 3 4 6 4zm-2-7c0 0 0 0 0 0 2-1 3 1 3 2 0 1-1 2-2 2-3 1-3-3-1-4zM1025 2284c-1 0-1 0-1 1 0 0-1 0-1 0-3 2-3 6-2 9 2 3 6 4 9 2 3-1 5-4 4-8-2-3-6-5-9-4zm3 10c-4 2-7-4-3-7 0 0 0 0 0 0 0 0 0 0 1-1 2 0 4 1 5 3 1 2-1 4-3 5zM403 1082c0 2 2 5 4 5 1 1 3 0 3 1 1 0 1 4 1 5 1 4 3 9 7 6 3 10 18 9 27 8 13-1 25-6 35-13 10-6 18-15 25-24 4-6 13-18 6-24 1 0 1-1 2-1 2-2 4-5 4-9-2-7-10-6-16-4 0 0 0 0 0 0-13-23-41-34-66-23-25 11-37 40-27 65-3 1-6 4-5 8zm94-7c-5 7-12 13-19 18-8 5-17 9-27 11-8 1-28 5-31-6 0-1 0-1 0-1 2-2 3-5 7-4 4 0 7 3 11 4 7 2 10-3 14-8 3-4 7-4 12-4 4 0 7 1 10-2 2-1 3-5 4-7 0-2 1-5 3-6 2-2 5-2 8-2 3 0 6 0 8-1 3-2 3-6 4-10 1-5 4-7 7-9 9 6-7 23-11 27zm-62-63c24-11 52-1 64 22 0 0 0 0 0 0 0 0 0 1 0 1 0 0 0 0 0 0-18 30-54 47-88 40 0 0 0 0 0 0-10-24 0-52 24-63zm-26 66c0 0 1 0 1 0 35 7 73-10 91-41 1-1 0-1 0-2 3-1 8-4 11-1 0 1 0 2 1 3 1 1 1 2 0 4-1 1-1 1-2 2-2 2-4 3-6 4-5 3-6 6-7 11 0 3-1 5-3 7-2 1-4 1-5 1-3 0-5-1-8 0-4 1-6 5-7 9-1 4-3 7-7 8-3 0-6-1-9-1-5 0-8 3-10 6-2 3-3 6-7 7-3 1-6-1-9-3-4-2-7-3-11-1-2 1-3 4-5 5 0 1-2 0-3-1 0 0 0-2 0-2 0-1-1-3-1-4s0-3-1-4c-1-1-1-1-2-1 0 0 0 0-1 0 0 1-1 0-1 0-3-1-3-3 1-6zM417 1062c0 1 0 2 0 3 0 1 3 1 3 0 0-1 0-2 0-3 0-2-3-2-3 0zM447 1050l2 1c1 1 3-1 1-2-1 0-1-1-2-1-1-1-3 1-1 2zM463 1019c1 0 1 0 2 0 0 0 1 0 1-1s0-1-1-1c0-1-1-1-1-1-1 0-2 1-2 1 0 1 0 2 1 2zM478 1032c1 0 2 1 3 1 1 1 2-1 1-2-1-1-2-1-3-2-2-1-3 2-1 3zM471 1053c0 0 1 1 2 0 0 0 1-1 0-2l-1-2c-1 0-1-1-2 0-1 0-1 1 0 2l1 2zM457 1034c1 1 2 1 2 0s1-1 0-1c0-1-1-1-1-2 0 0-1 0-2 0 0 1 0 2 0 2 1 1 1 1 1 1zM424 1031c1-1 1-1 2-2 0 0 0-1 0-2s-2 0-2 0c-1 1-1 1-1 2-1 0-1 1 0 2s1 0 1 0zM434 1067c0 0 1 0 1-1 0 0 1-1 1-2 0-1 0-2-1-2-1 0-2 1-2 1 0 1 0 2 0 3 0 0 0 1 1 1zM441 1018c1 2 3 0 2-1 0-1 0-1 0-1-2-1-3 1-2 2 0 0 0 0 0 0zM418 1050c1 0 2-1 2-2 0 0 0 0 0-1 0 0-1-1-2-1 0 0-1 1-1 1 0 1 0 1 0 1 0 1 1 2 1 2zM483 1021c1 0 1 1 1 1 1 0 1 0 2-1 0 0 0-1-1-2 0 0 0 0 0 0-1 0-2 0-2 1s0 1 0 1zM1368 631c2 2 5 3 8 3 4 0 6-3 10-4 4-1 8 1 12 0 3-1 6-4 7-7 2-6-1-12-7-15-2-9-10-16-19-14-9 2-13 11-9 19-4 5-7 12-2 18zm14-34c8 0 12 6 14 13 0 1 1 1 1 1 6 3 8 11 2 15-5 3-9 0-13 1-5 1-8 6-13 4-8-3-5-13 0-17 0 0 0-1 0-1 0 0 0 0 0-1-5-7 1-15 9-15zM243 301c-1-6-9-8-14-5-5 3-8 8-11 13-2 3-4 6-7 8-3 1-5 3-7 4-8 7-1 16 7 18 6 2 13 0 19-3-6 17-12 34-19 51 0 0-1 0-1 1-1 3-2 6-3 9-9 34-18 79 14 104 14 11 36 14 53 11 9-1 18-3 23-10 2-3 4-6 5-9 0 0 0 0 1 0 0 0 0 0 1 0 0 1 0 2 1 3 4 11 16 15 27 10 27-11 18-51 6-70-8-13-20-24-34-31 0 0 0 0 0 0-1-1-1-2-2-3 0 0 0-1 0-1 0 0 0 0-1 0 0 0 0-1 0-1 1 0 2 0 3-1 3-1 6-3 9-5 17 9 37-3 37-22 0-11-7-17-14-24-5-5-8-10-8-17 0 0 0 0 0 0-1-1-1-2-1-3 0-4-1-9-3-13 8 1 17-1 22-7 6-6 7-18 1-25-2-2-6-5-10-3-4 1-5 5-8 8-4 6-11 4-16 7-1 0-2 1-3 1-8-8-20-13-32-12-14 0-26 6-35 17zm55 100c1 1 1 1 2 2 8 13 8 31-1 44-10 13-26 20-42 19-17-1-32-11-40-25-9-14-10-31-6-46 0-1 0-2 1-3 0 0 0 0 0 0 0 0 0 0 0 0 11 13 26 23 43 25 16 2 33-4 43-16zm48 83c-2 8-6 15-13 19-8 4-18 4-24-4-4-6-4-15-3-22 0-8 2-17 3-25 0-2-3-2-3 0-1 8-2 17-3 25 0 4-1 9 0 13 0 0-1 0-1 0 0-2 0-4-2-6-2-4-5-5-9-7-6-2-12-4-18-5-13-2-25-3-38-2-1 0-1 3 0 2 19-1 38 1 55 8 5 2 9 5 9 10 0 5-2 9-6 12-7 6-16 8-25 8-17 1-36-2-48-14-12-10-18-26-19-42-1-14 1-29 5-43 0 21 11 42 31 52 24 12 56 4 68-21 4-11 5-23 1-33 25 14 46 45 40 75zm-23-189c2 0 4-1 6-3 2-1 3-3 4-5 1-1 2-3 3-4 4-3 7 0 10 3 4 7 2 17-4 22-5 4-13 6-19 4 0 0-1 0-1 0-2-3-4-6-6-9 0 0 0 0 0 0-1-2-2-3-3-4 0 0 0 0 0 0-2-3 9-4 10-4zm-8 12c0 0 1 0 1 0 4 7 8 15 9 24 0 0 0 0 0 0 1 4 1 8 3 12 4 7 13 11 17 18 4 9 3 20-4 27-6 6-16 8-25 4 0 0 0 0 0 0 0 0 0 0-1 0 6-6 9-15 9-23 0 0 0 0 0-1 0 0 0-1-1-2 2-1 5-4 5-6 0-4-5-3-7-2s-6 2-5 5c0 0 1 1 1 1 1 0 1 1 1 1 1 1 2 1 3 2 2 13-6 26-19 30-13 4-26-3-32-14 0-1 1-1 1-2 1 0 1-1 1-1 0-1 0-1 0-1 1-2-2-2-2-1-1 3-3 4-5 5-2 0-1 3 0 2 1 0 2 0 3-1 3 7 8 11 15 14-13 1-26-4-34-14-2-1-3 1-2 2 10 12 26 17 41 14 0 0 0 0 0 0 2 0 5 1 7 1-10 11-26 15-40 13-17-2-31-12-42-25 8-18 15-37 21-57 0 0 1-1 2-2 0 0 0 0 0 0 3-5 5-10 6-15 1-2-2-2-2-1-2 6-4 12-8 16 0 0 0 0-1 0-1 2-4 4-6 5-1 0-1 0-1 1-3 1-6 1-9 1-4 0-9-2-11-5-3-6 1-9 5-11 5-3 8-6 12-11 1-3 3-7 6-9 1-2 3-3 5-4 5-1 10 3 8 7-1 1-1 2-1 2-1 2 1 3 2 2 8-13 22-22 37-22s29 8 37 21zm6 57c0 0 0 0-1 0 0-1 0-1-1-2 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1-1 2-1 1 0 2-1 3-1 1 0 1 0 1 0 1 0 1 0 0 0 0 1-1 2-1 2-1 1-2 2-3 2zM772 1227c10 4 23 1 30-8 7-9 8-23 1-32-6-9-18-14-29-12-13 3-21 15-22 27 0 1 0 1 0 1 2 11 9 21 20 24zm8-50c3 0 5 1 8 1 0 1 0 1 0 2 6 5 7 13 4 21 0 1 2 3 3 1 3-7 2-16-3-22 8 4 13 12 13 22 0 14-11 25-25 24-13 0-23-11-25-23 0 0 0 0 0 0 0-2 0-3 0-5 1 6 2 11 8 14 1 1 2 1 4 1 3 1 4 2 7 4 3 3 7 4 12 4 1 0 1-3 0-3-5 0-8-1-11-4-2-1-3-3-6-3-4-1-7-2-10-7-2-4-1-9 0-13 0 0 0-1-1-1 5-8 13-13 22-13zM709 1098c-3-3-7-5-10-7-3-2-6-4-9-5-4-1-8 1-9 5-2 5 3 13 5 17 6 13 13 25 22 36-3-1-5-2-7-1-8 3-4 10-1 15 8 15 19 27 33 36-3 1-6 4-4 8 2 4 6 6 9 9 4 3 8 5 13 6 2 0 2-3 1-3-6-1-10-4-15-7-1-1-3-3-4-4-2-3-2-6 2-7 1 0 1 0 2 0 1 0 2-2 0-2-11-8-21-17-29-28-2-3-3-5-5-8-2-3-8-14 1-12 3 0 5 2 8 3 1 0 2-2 1-3-8-10-16-21-22-32-2-6-6-12-7-18-1-2-1-4 1-6 2-3 5-1 7 0 3 1 5 3 8 5 20 14 38 31 52 52 1 1 2 1 2-1 1-4 2-11 8-6 5 4 8 10 11 16 1 1 2 0 2-1 0-2 1-6 5-3 2 1 3 5 4 6 3 4 5 9 6 13 0 2 3 1 2-1-1-4-2-8-5-13-1-2-4-7-7-8-3-2-5 0-6 2-2-3-5-7-7-10-2-3-5-6-9-5-4 0-5 3-6 6-8-11-17-21-27-30-5-5-11-10-16-14zM1209 1358c-11-11-29-12-37-25 0-1 0-1 0-1 3-5 2-12-3-17-4-3-9-6-14-9-6-4-12-8-17-12-4-2-8-5-12-3-3 2-4 5-5 8-2 14-2 29-3 43 0 0 0 0 1 1 0 3 1 7 4 9 3 2 6 3 9 2-1 9-1 18-2 27 0 7-2 16-1 24 1 8 9 13 17 12 0 0-1 0-1 1 0 11-1 22-1 33 0 10-2 20 1 29 2 6 6 12 13 15 6 2 12 1 16-4 10 5 23 4 31-4 4 6 8 12 13 19 2 3 4 6 6 9 1 2 2 4 4 5 3 2 8 1 12 0 4-1 8-4 11-9 0 0 0 0 0 0 0-1 0-1 0-2-4-11-10-22-15-33 5-4 9-10 10-16 8 0 15-6 16-14 0 0 0-1 0-1 1 0 1 0 1 0 11-11 6-27-4-37-13-12-33-15-46-28 4-6 2-17-4-22zm28 160c-3 1-7 1-9-1-1-2-2-4-4-6-5-9-11-18-17-26 0 0 0 0 0 0 1-2 2-4 3-6 8 3 16 3 23-1 6 10 11 21 15 32-2 4-6 7-11 8zm11-114c7 4 14 10 17 18 2 7 2 15-4 21 0 0 0 1 0 1-1 0-1 0-1 1-1 6-7 12-13 12 0-1 0-1 0-2 0-2-2-2-3 0 0 7-4 15-11 19-8 6-17 4-26 0-1-1-3 2-1 2 0 1 1 1 2 1-7 15-26 19-38 8-1-1-3 1-2 2 1 1 2 1 3 2-5 8-16 3-20-3-5-6-5-14-5-22 0-15 1-31 2-46 0-1-1-2-1-2 1 0 2 0 3-1 1-1 0-3-1-2-5 3-13 1-16-4-3-5-1-13-1-19 1-12 2-24 3-37 0 0 1 0 2-1 1-1 0-3-1-2-4 2-9 2-12-1-3-3-3-8-3-12 0 0 0 0 0 0 1-8 1-16 2-23 0-5 0-9 1-13 0-4 1-9 7-7 2 0 5 2 7 3 7 5 15 10 22 15 4 3 8 5 10 9 3 5 1 10-3 14-2 1 0 3 2 2 0-1 1-2 2-2 5 9 16 13 25 17 6 3 12 6 15 12 3 6 2 14-4 18-1 1 0 3 2 2 1 0 1-1 2-2 10 11 25 14 37 22zM1190 1406c-6 8-17 10-26 6-1 0-2 2-1 3 11 4 23 1 30-8 1-1-2-3-3-1zM1153 1342c-2 3-6 5-10 5-2 0-2 3 0 3 5 0 9-2 12-7 1-1-1-2-2-1zM641 2408c1 4 5 6 8 5 3 0 5-3 5-6 0-3-3-6-6-6-4 0-7 3-7 6 0 0 0 1 0 1 0 0 0 0 0 0zm7-5c2 0 4 2 4 4 0 5-7 5-8 1 0 0 0-1 0-1 0 0 0 0 0 0 0-2 2-4 4-4zM851 1247c-2 2 0 6 1 8 2 5 5 9 9 13 0 0 0 0 0 0 6 47 30 90 69 116 0 1 0 1 0 1 1 0 1 0 1 0 0 0 0 0 1 1 0 0 0 0 0 0 3 1 6 2 9 3-2 5-2 10 0 15 1 2 2 3 2 5 2 3 2 5 3 8 0 2 1 3 3 4-3 3-1 8 3 8 5-1 6-5 4-8 0-1 1-2 1-4 2-2 3-3 4-3 7 10 15 20 22 29 3 5 8 11 9 16 0 5-3 9-8 9-3 0-6-3-8-7 0 0 0 0 0 0-2-4-6-3-8 0-1 2-1 5 1 7 0 0 0 1 0 1 0 0 0 0 0 0 1 2 2 3 3 4 0 0 0 0 0 0 4 5 10 7 16 7 8-1 14-7 15-15 2-10-6-21-11-30-6-10-13-19-20-28 1-6 4-4 8-6 0 0 0 0 1 0 1 1 3 2 4 2 3-1 5-3 4-6 0-2-2-4-4-4-1 0-1 0-2 0-1-3-5-5-7-6-7-3-12-7-19-9 0 0 0 0 0 0 0-6-4-14-6-20-3-6-6-12-9-18-13-26-32-50-55-68-4-4-10-10-17-11 0 0 0 0 0 0-3-4-6-8-10-11-2-2-6-6-9-3zm101 179c-2 0-3-2-2-3 1 0 1-1 1-1 1 0 1 0 2 0 0 0 0 0 0 0 2 1 1 4-1 4zm19-13c0 0 2 1 2 1 0 1-1 3-2 3-1 0-3-1-2-3 0 0 0 0 0 0 1 0 1-1 2-1zm-5 3c0-1-1-1-1-2 0 0 1 0 1 0 0 1 0 1 0 2zm31 35c4 8 6 19-4 25-7 3-16 0-20-6 0 0 0 0-1 0 0 0 0-1 0-1-1-1-2-3-2-4 0-1 0-2 1-3 1-1 2-1 2 0 0 0 0 0 0 0 3 5 8 10 14 8 5-1 8-7 7-12-2-8-9-15-13-21-4-6-9-12-13-18 1 0 2 1 4 1 2-1 3-3 3-5 9 12 16 23 22 36zm-12-56c1 0 1 1 2 2 1 2-4 4-4 2 0 0 0 0 0-1 0 0 0 0 0-1 0 0 0 0 0 0 0 0 0 0 0 0 1-1 1-2 2-2zm-14-8c2 2 4 2 6 4 1 0 3 2 4 4 0 4-4 4-6 4-3 1-5 2-5 5-1 2 0 4-1 6-2 3-4 1-7 1-2 0-5 0-6 2-1 1-1 1-1 2 0 1 0 1 0 2-3-1-5-1-7-1-1-1-1-4-1-6-1-3-3-5-4-8-1-4-1-8 0-13 2 1 4 1 5 0 5-1 8-4 9-8 5 1 9 4 14 6zm-98-122c2 1 3 2 5 3 1 0 1 1 2 1 0 0 0 1 0 1 17 21 33 42 46 66 1 2 3 0 3-1-12-21-26-40-41-59 5 4 9 8 13 12 10 10 19 21 27 32 7 12 14 24 19 36 3 6 6 13 7 20 1 3 0 6-2 8 0-1 0-1-1-1-7-3-14-7-19-13-1-1-3 1-2 2 6 6 13 10 21 13-2 1-4 2-6 2-4 0-9-2-13-4-35-24-59-62-67-103 11 26 26 49 45 69 2 1 3-1 2-2-22-22-38-49-48-79 0 0 0 0 0 0 0-4 6-4 9-3zm-6-3c-2 0-4 2-5 4-2-3-4-5-5-7-1-2-5-7-3-9 3-3 11 8 13 12zM995 2577c3-21-6-42-22-55 0 0 0-1-1-1 4-2 8-5 11-9 4-5 7-12 7-19-2-14-21-2-30 6 1-5 1-10 0-15-1-3-2-10-6-9-4 0-9 5-12 9-3 3-5 8-6 13-3 11 1 21 8 30 7 11 16 22 7 35-8 13-29 14-38 1 0 0 0 0 0 0-15-34-49-57-86-56-5 0-9 1-13 1 0 0 0 0 0 0 1 0 1 0 2 0 6-8 3-20-6-24-5-2-11 0-16-2-8-4-1-13 0-18 2-4 1-8-2-11-2-2-4-3-6-4-4-3-6-7-5-12 0-12-1-27-15-31-9-3-20 4-17 14 1 6 7 9 11 11 4 2 10 7 7 12-2 3-5 2-7-1 0 0-1-1-2-2-4-2-8 0-11 3-3 3-2 9 0 13 6 10 27 11 25 26-1 7-5 13-3 20 2 5 6 7 11 8 5 0 11-1 16-3 5-3 14-8 14 1 0 1 0 1 1 1-36 8-65 36-72 73-1 6-1 11-1 17 0 3 0 6 0 9 1 2 2 6 1 8-1 2-4 4-5 6-1 2-2 4-2 6 0 5 2 9 6 10 0 1 0 1 0 1 2 0 4 0 6-1 22 32 58 49 95 50 0 0 0 0 0 0 0 0 0 0 0 0 21 0 41-5 60-15 13-7 24-16 33-27 0-1 1-1 1-1 0 0 0 0 0 0 0 0 0 0 1 0 13-1 25 4 34 13 3 2 5 7 9 7s7-2 8-5c7-17-5-34-21-37 16-10 29-27 31-46zm-194-76c-4 2-8 4-12 5-6 2-17 2-18-7-1-10 8-19 0-28-3-4-7-6-12-8-5-4-17-12-9-19 2-2 4-3 7-2 2 1 1 3 3 4 1 1 2 2 4 2 3 0 6-4 7-7 2-13-22-12-20-25 2-9 11-10 18-6 8 4 10 13 9 22 0 5-1 11 2 15 3 4 9 5 12 9 4 8-12 21 0 27 5 3 10 2 15 3 9 2 12 13 7 20 0 0 0 0 0 0 0 0-1 0-1 0 0 0 0 0 0 0-2-6-6-7-12-5zm-21 168c-14-9-25-20-34-33 0 0 0 0 0-1 0 0 0 0 0 0 1-3 3-6 4-8 1 7 4 14 8 20 1 1 4 0 3-2-5-6-8-13-8-21 3-4 7-8 12-11 8 33 32 60 63 71-16-1-33-6-48-15zm59 16c-35-8-63-37-71-72 0-1 0-1 0-1 5-2 11-4 17-5 12-1 24 2 35 5 7 30 31 55 59 66-13 5-26 7-40 7zm121-62c-2 0-5 0-7 0-1 1-1 3 1 3 9-2 19 1 25 8 3 5 5 10 5 16 0 2 0 5-1 7 0 2-1 2-2 4-3 2-4 1-6-1-6-5-11-10-17-13-7-4-15-5-23-5 1 0 1-1 2-2 1-1-2-2-3-1-1 1-2 3-3 4 0 0 0 0 0 0-13 16-30 27-48 34 0 0 0 0 0 0-28-10-52-34-60-64 7 3 14 6 20 8 11 5 22 9 33 12 0 1 0 1 0 1 8 8 16 15 25 21 2 1 3-2 1-3-8-5-15-11-22-18 19 5 39 4 55-9 1-1-1-3-2-2-25 21-58 9-84-2-9-4-18-8-27-11 0 0 0 0 0 0-18-6-36-9-53-1-7 3-14 7-18 13-1 0-1 0-1 1-2 3-4 6-6 10 0 0 0 0 0 1 0 0 0 0 0 1-1 0-2 0-1 1-1 0-2 1-3 0 0 0-1 0-1 0 0 0 0 0 0 0 0 0 0 0 0 0-7-4-3-12 1-17 0 0 0 0 0 0 3-2 5-5 7-7 1-1-1-3-2-2-1 1-2 2-3 3 0-1 0-2-1-3-1-10-1-20 1-29 4-19 14-37 28-49 30-27 76-30 108-7 18 12 30 30 36 50 0 2 3 1 3 0-1-2-1-4-2-6 7 6 18 8 27 4 12-4 18-18 14-30-4-15-19-24-18-40 0-8 4-16 9-21 2-1 4-4 5-4 5-1 5 5 5 7 1 6 1 12-1 17 0 0 0 0 0 0 0 0-1 0-1 0-2 0-2 2-1 3 0 0 0 0 0 0 0 0 1 0 1 0 0 0 0 0 0 0 0 0 1 0 1 0 1 1 3 1 4 3 2 1 4-1 2-2-1-1-2-2-3-3 4-4 8-7 13-10 2-1 6-4 9-4 2 1 4 2 6 3 0 1 0 2 0 3 0 2 0 3-1 4-3 11-11 20-22 23-2 1-1 3 1 3 2-1 3-1 5-2 0 0 1 0 1 0 0 0 0 0 0 1 15 12 24 32 22 51-3 20-16 39-33 48zM760 2518c1-1 3-2 3-4 1-3-1-5-2-6-6-7-18 1-12 8 3 4 7 5 11 2zm-1-8c0 0 0 0 0 0 1 1 2 2 1 4 0 1-2 2-3 2-2 2-5 0-6-2-3-4 4-8 8-4zM834 2477c-3 0-6 3-6 7 0 0 0 0 0 0 0 0 0 0 0 0 1 4 5 7 8 6 4-1 6-4 5-8 0-3-3-5-7-5zm2 11c-3 1-4-2-5-4 0-5 7-6 7-1 1 2 0 4-2 5zM893 2611c-3-1-6-1-9-2 0 0 1 0 1-1 4-3 2-9-3-9-6-1-8 7-3 10 0 0 0 0 0 0-2 0-4 0-6 1-2 0-1 2 0 2 7-1 13 0 19 2 2 0 3-2 1-3zm-11-7c0 0 0 0 0 0 0 2-1 0 0 0 0 0 0 0 0 0zM1202 1391c-2 2-4 4-6 6-1 0 0 3 1 2 3-2 5-4 7-7 1-1-1-3-2-1zM687 1301c-4 13-20 19-24 32-4 11 5 20 16 21 2 0 4 0 6 0-1 3-1 7 1 11-7 3-13 7-18 11-2 1 0 3 1 2 6-4 11-8 18-11 0 1 0 2 1 2 5 7 14 8 19 14 3 3 5 6 7 9-4 6-8 12-11 19-1 1 1 3 2 1 4-6 8-12 11-18 2 1 4 2 6 3 7 2 14 2 20-1 3 5 9 9 15 9 3 1 6 0 9-1 4-1 7-4 11-6 1 6 3 12 7 18 1 1 3 0 2-2-3-4-5-9-6-15 0 0 0 0 0-1l0-1c0 0 1 0 1 0 5 0 9 1 14 0 4-1 7-3 10-6 1 0 1 0 1 0 6 5 13 10 21 14 1 1 3-2 1-2-7-4-14-9-20-14 4-5 6-12 5-19 6-2 12-7 14-13 1-3 2-6 1-10 0-2-1-4-2-7-1-3-1-6-1-9 0-17-16-29-32-25-2-7-8-13-15-16-4-2-9-3-14-3-2 1-5 2-7 2-1 0-2-2-4-4-13-12-33-7-40 10 0 0 0 0 0 0-5-1-10-2-15-1-2-1-1-4-1-5 0-2-1-3-2-4-3-2-5 1-7 3-2 3-4 6-2 9 0 2 1 3 2 3 0 1-1 1-1 1zm28-6c7-16 29-18 40-4-2 0-4 0-5 1-2 0-1 3 0 2 4-1 9-1 12 2 2 1 4-1 2-2-1-1-3-2-5-3 13-4 27 3 32 17-3-1-6 0-9 0-2 1-1 3 1 3 8-2 16 1 19 9 1 1 3 0 2-2-2-4-6-8-10-9 7-2 15-1 21 5 6 5 7 12 7 20 0 7 5 12 3 19-1 7-6 12-12 14 1-2 2-4 3-6 0-1-2-2-3-1-3 8-8 13-15 16-2 1 0 3 1 2 5-1 8-4 11-8 1 9-3 18-11 22-7 4-14 1-21 3-7 2-11 8-18 8-7 0-13-3-16-9 2 1 5 2 8 2 2 0 2-3 0-3-6 0-11-2-15-6-1-1-3 1-2 2 2 1 3 3 5 4 0 0 0 0 0 1 0 0 0 0 0 0-6 3-13 3-19 0-1-1-2-2-3-2 1-3 3-5 4-7 1-2-1-3-2-2-1 2-3 5-4 7-3-3-5-6-7-9 2 1 4 2 6 3 1 1 2-2 1-3-6-1-10-5-13-10-1-1-3 0-2 2 0 1 2 2 3 4-4-2-8-4-11-6-5-4-7-11-5-18 9-1 18-6 25-12 9-7 17-17 20-29 4-2 10-7 6-12-1-2-3-2-5-2-2 1-3 2-4 3-2 1-3 3-5 4-3-4-6-7-10-9 0 0 0 0 0-1zm-23 4c-4 1-5-5-3-7 0-2 4-7 5-3 1 1 0 3 0 5 1 0 1 1 1 1 0 1 1 3 2 2 10-3 20 2 27 10 0 0 0 0 0 1 0 0 1 0 1 0l5-4c2-1 3-3 5-3 2 0 3 1 3 3-1 1-1 2-2 3-1 1-3 2-5 3-1 0-1 1-1 1 0 0 0 0 0 0-5 19-23 36-43 39 0 0-1 0-1 1-2 0-3 0-4 0-6 0-13-2-16-8-4-7 1-13 5-18 7-7 15-13 19-23 0 0 0-1 0-1 1 0 1 1 2 0 2 0 2-2 0-2zM681 1333c-2 1-5 1-6-2-1-1-3 0-2 2 0 1 1 1 1 2 0 0 0 0 0 1 1 1 1 2 0 3-1 0-1 1-1 1 2 3 5 4 8 4 2 0 2-3 0-3-2 0-3 0-4-1 0-1 0-3 0-4 2 1 4 0 5-1 2-1 0-3-1-2zM707 1323c1-2 2-4 3-7 1-1-2-3-2-1-1 2-2 4-3 6-1 2 2 3 2 2zM691 1311l-2 4c0 2 2 3 3 1 1-2 1-3 2-5s-2-2-3 0zM761 1372c11 1 21-3 27-12 0-2-2-3-3-2-5 8-14 13-23 11-2 0-2 2-1 3zM735 1355c-3-2-5-5-5-8 0-2-3-2-3 0 1 4 3 8 7 11 1 1 3-2 1-3zM598 1183c-13 1-24 11-26 25-2 11 4 25 16 28-2 3-1 7 3 9 1 0 2 0 4 0 4 24 10 48 20 71 0 1 2 1 3 0 11-29 23-58 35-87 8-4 16-12 18-21 2-12 0-28-8-38-8-10-23-12-35-11-7 0-13 4-18 8-1 0-1 0-1 0-19-11-41 7-35 28 1 1 3 1 3-1-6-18 14-34 31-25 0 0 0 0 0 0-4 4-6 8-7 13 0 0 0 0 0 1-1 0-2 0-3 0zm-7 54c0 0 0 0 0 0 1 0 1-2 1-3-1 0-1-1-2 0-13-2-18-19-15-30 4-12 15-19 26-19 12 0 22 9 25 19 3 11-2 24-12 30-1 0-1 0-1 1 1 9-10 9-12 1 0 0 0 0 0 0h0c0-2-3-2-3 0 1 2 0 3-1 5-7 0-9-2-6-4zm25 75c-9-22-15-45-19-68 1-1 2-2 3-4 5 7 16 6 16-4 1 0 2-1 2-2 2 5 9 5 13 0 2 3 5 4 8 4 4-1 6-3 6-7 1 0 2 0 3 0 0 0 0 0 1 0-11 27-22 54-33 81zm-12-129c2-12 13-21 25-22 11-1 24 2 31 10 8 8 10 23 9 34-2 9-8 17-17 21 0 0-1 0-1 1 0 0-1 0-1 0-2 1-4 2-6 2 0 0-1 0-1 1 0 2-1 4-4 5-3 1-6-1-7-4-1-1-2-1-3 0-1 4-7 7-8 1 7-8 11-19 7-29-3-11-13-19-24-20 0 0 0 0 0 0zM125 305c0 10 5 20 14 23 12 5 24-1 34-8 2 3 5 4 9 4 1 0 1 0 1-1 0-5-1-9-1-14 12-20 38-27 49-49 7-14 3-36-16-38-11-2-22 4-31 8-10 5-18 12-26 19-8 7-15 15-21 24-6 9-12 20-12 32zm34-54c7-6 14-11 22-16 9-5 19-10 29-11s18 6 21 16c2 9-1 18-7 25-12 17-34 24-45 42 0 1 0 1 0 1 0 0 0 0 0 0 0 1 0 1 0 1 0 4 1 8 1 13-2-1-4-2-6-4 0-1-1-1-1-1-9 6-20 12-31 9-12-3-16-15-14-26 4-19 18-36 31-49zM181 271c1 0 1 0 1-1 0 0 0-1 0-1-1-1-3-1-3 0-1 1 0 1 0 2 1 1 2 1 2 0zm-1-2c1 0 1 0 1 0-1 0-1 0-1 0h0c0 0 0 0 0 0zM198 254v0c0-2-3-2-3 0v0c0 2 3 2 3 0zM181 1112c0 0 1 0 1 0 3 1 7 2 11 0 7-3 11-12 9-19-2-7-9-11-17-10-1-1-2-1-3 0-3-3-6-6-8-9 3-2 6-5 9-8 0 0 1 0 1 0 3-2 5-4 6-7 0-1 0-1 0-1 2-4 2-8-1-13 0-1-2 0-2 1-1 3-2 5-5 7 0-3-1-5-3-8-1-1-2 0-2 1-1 5-7 7-10 11-3 2-5 5-5 8-1 6 2 11 7 12-1 6-1 11-2 16-9 2-15 10-11 19 5 11 21 10 25 0zm19-18c2 6-2 14-9 16-6 2-14-2-16-9-1-6 2-13 8-15 1 0 1 0 1 0 0 0 0 0 0 0 6-2 14 1 16 8zm-21-10c0 1 0 1 0 1-3 2-5 5-6 9-1-1-2-1-3-1 1-5 2-11 3-16l7 7c-1 0-1 0-1 0zm9-34c1 3 0 6-1 8 0 0 0 1-1 1-4 5-9 10-15 14-3-6 4-11 9-14 0 0 1 0 1-1 0 0 1 0 1-1 0 0 0 0 0 0 3-2 5-4 6-7zm-24 16c1-4 4-7 8-10 2-2 5-4 6-7 2 2 2 4 1 7-3 2-6 4-8 6-3 4-4 9-2 13-3-2-5-5-5-9zm-5 45c-3-6 1-13 7-15 0 0 0 0 0 1v2c0 1 0 2 0 2-1 1 0 2 0 2 1 1 3 0 3-1v-3c0-1 0-2 0-2 0 0 0 0 0 0 0 0 0 0 0 0 0-1 0-1 0-1 1 0 2 0 3 0 0 3 0 5 1 8 2 3 4 5 6 6 0 0 0 0 0 1-4 8-16 9-20 0zM1156 2694c0 1 0 1 1 1 25 8 49-14 44-40 0-1 0-1-1-1 0 0 0 0 0 0-16-20-33-39-51-57 0 0 0 0 0 0 0 0 0 0 0 0-1-1-1-1-2-1 0 0 0 0 0 0-15 9-29 18-42 29-7-2-14-4-21-7 1-4-2-8-7-9-3 0-5 1-7 4 0-1 0-1 0-1-1-2-3-1-3 0-12 13-24 26-36 40 0 1 0 1 0 2 0 0 0 1 0 1 16 20 32 38 49 56 0 1 0 2 1 2 15 5 30 9 45 13 0 0 0 0 0 0 1 1 1 1 2 0 9-10 18-21 26-32 1 0 1 0 2 0zm-9-94c0 0 0 0 0 1 5 9 3 22-5 29-8 6-18 8-27 5 0 0 0 0 0 0-3-3-5-5-8-8 13-10 26-19 40-27zm-2 31c8-7 9-18 6-28 16 16 32 34 46 52-1 1-3 2-5 4-4 2-9 5-13 8-7 5-14 9-21 14-2-4-6-8-9-11-5-5-9-10-14-15-5-6-11-11-16-17 9 2 19-1 26-7zm12 61c2-3 3-6 3-9 7-5 14-10 21-14 5-3 9-6 13-9 1-1 3-2 5-3 3 23-19 42-42 35zm-53-64c0 0 0 0 0 0 9 8 18 17 26 26 5 4 9 9 13 13 2 2 4 5 6 7 2 2 4 4 6 6-3-2-7-3-10-5-7-4-15-8-22-12 0 0 0 0 0 0-1-1-2-2-3-4-1-1-2-2-3-3 4-2 6-8 3-12-3-4-8-5-13-3-1 1-1 2-2 3 0 0 0-1 0-1-2-2-4-4-7-4 0 0 0 0 0 0-5-5-10-9-14-14 0-1 0-2-1-3 0 0 0 0 1 0 0-1 0-1 0-1 6 3 13 5 20 7zm10 27c-3 0-5 0-7-3-2-3-1-6 1-8 3-3 7-2 9 1 3 4 1 8-2 9-1 0-1 0-1 1zm-6 14c-9 9-18 19-27 28-12-14-24-28-36-42 7-8 15-16 23-24 2 2 4 3 7 3-3 3-4 8-2 11 0 1 0 1 1 1 2 3 7 6 11 3 2-1 3-2 3-3 0 2 0 4 1 6 0 0 1 0 1 0 2 3 4 4 7 5 0 0 0 0 0 0 4 3 8 7 11 11 0 0 0 0 0 1zm-18-26c0-2 0-4-1-6-2-3-5-5-8-5 1-1 2-2 2-3 4 3 8 7 12 10-1 0-1 1-2 1-1 0-2 1-3 3zm-15 1c-3-7 8-13 11-6 2 3 1 6-2 8-3 3-6 1-9-2zm6-19c0 1 0 1 0 1 0 2-1 3-2 5-3 2-7 1-9-2 0 0 0 0 0 0-4-7 6-14 10-7 1 1 1 2 1 3zm11 25c-4-7 7-12 11-5 1 2 0 6-2 8-4 2-7 0-9-3zm-16-38c4 0 6 3 6 6-1 0-1 0-1 1-3-3-7-3-10-2 0 0 0 0 0 0 1-1 1-1 1-2 1-1 2-3 4-3zm-8 8c-2 2-2 5-1 8-8 8-17 17-25 25 0 1 0 1 0 2 0 0 0 1 0 2 13 14 25 28 37 42 1 1 1 1 1 1 1 0 1 0 2 0 10-10 20-20 29-30 0-1 0-1 0-1 1-1 0-2 0-2-4-4-7-7-11-11 0 0 1 0 1-1 2 0 2-1 3-2 0 0 0 0 0 0 0 0 0 0 0 0 0 1 1 1 1 1 2 3 6 4 9 3 1 1 2 2 3 3 1 2 4 4 4 5 0 1 0 1 0 1 0-1 0-1-1 1 0 0-1 1 0 1-1-1-10 9-10 10-3 3-6 6-9 10-7 7-13 14-19 21 0 0 0 0 0 0-17-17-33-36-48-55 11-14 22-27 34-39 1 0 1 0 1 1 0 1-1 2-1 3 0 0 0 1 0 1zm59 104c-1 0-1 0-1 0 0-1-1-1-1 0-14-4-27-8-41-13 0 0 0 0 0 0 12-15 25-29 38-42 1-1 1-1 0-2 1 1 1 1 2 0 5 3 11 6 16 9 4 2 11 4 15 8 0 0 0 0 0 0 1 3-1 6-3 8 0 1 0 1 0 1-8 10-17 21-25 31zM865 1538c1 3 1 6 1 9 0 3 1 10-4 8-2-2-5-5-7-7-3-2-5-4-7-6-2-1-3 1-2 2 4 3 7 7 11 10 2 2 5 5 8 4 3 0 3-3 3-5 1-5 0-10 0-15 0-2-3-2-3 0zM898 1510c-1-1-3-1-3 1l2 7c1 2 3 5 3 7-1 4-6 0-8-1-2-1-4-2-6-3-2-1-3 2-2 2 4 2 8 4 12 6 2 1 4 1 6 0s0-4 0-6c-2-4-3-8-4-13zM850 1510c-2-4-3-7-5-10-1-1-3 0-2 2 1 3 3 6 5 9 0 1 3 0 2-1zM866 1492c-1-2-3 0-2 2 2 2 3 4 5 6 1 1 3-1 2-2-2-2-3-4-5-6zM1140 1516c-3 14-17 24-32 23-14-2-25-15-39-18-12-4-26 0-36 8-13 9-20 23-26 37-3 9-8 22-15 29 0 0 0-1-1-1-20-10-37-24-52-40-15-16-29-34-36-55 3-5 4-11 5-17 0-1-1-2-1-2-7 0-13-1-19 0-4-9-9-18-14-26 0 0 0 0 0 0 0-1 0-1-1-1-2-4-4-7-7-10-1-1-3-3-5-2-6 1-5 9-4 13 1 7 4 14 6 21-4-5-8-9-12-13-5-6-13-18-21-17-7 0-9 8-10 14 0 3 0 7 0 11 0 0-1 0-1 1-2 10-2 21 0 31 0 1 0 1 0 1-1 3-3 6-4 9-3-8-7-16-12-23-2-4-7-14-12-8-2 3-2 6-2 8 1 6 3 11 4 16 3 10 7 19 12 28 0 0 0 0 0 1 0 0-1 1-1 2-1 2-2 4-1 6 1 8 13 8 22 7 0 0 0 0 0 0 14 20 27 40 45 56 12 10 25 19 40 25 0 0 0 0 0 0 19 18 42 40 69 45 1 1 3 1 4 1 0 0 0 0 0 0 4 1 11 0 12-4 1-4-2-7-5-9 0 0 0 0 0 0-15-10-30-20-44-31 13-1 26-8 35-18 7 6 14 11 22 15 4 2 8 4 12 5 4 2 8 4 12 4 5-1 7-5 5-8-2-3-5-5-8-8 0 0 0-1-1-1 0 0 0 0 0 0-2-2-5-5-8-6 3-1 6-2 9-3 3-1 7-3 10-4 4-3 8-7 13-8 9-2 17 4 25 7 28 12 57-10 67-35 7-18 6-37 4-56 0-1-3-1-3 0zm-276-71c3 3 5 6 7 9-2 3-6 4-10 4 0 0 0 0 0 0-1-2-1-4-2-5 0-4 0-13 5-8zm-2 16c-1 0-1 0-1 0 5 0 9-2 12-5 1 2 2 5 3 6 3 6 6 12 9 18-5 0-10 0-15 1-1 0-1 0-1 0-1 0-1-1-2-1-1-6-4-12-5-19zm-26-11c-4 3-8 4-13 5 1-1 1-2 1-3 2-5 7-5 12-2zm-44 36c3-4 5-4 6-1 0 1 1 1 1 2 1 2 3 4 4 6-2 4-5 5-8 5-1 0-1 0-1 0-1-2-1-5-2-7 0-1-1-3 0-5zm3 14c4 1 7-1 9-4 4 6 7 13 9 20-1 3-3 6-4 9-1 2-2 4-3 5-4-9-8-19-11-30zm195 173c0 0 0 0 0 0-4 1-8 1-12 0-2-1-4-2-6-2 2-5 4-8 8-11 0 0 0-1 0-1l5 4c3 2 10 6 5 10zm37-38c-3 0-7-2-10-3-1 0-1 0-2-1 2-3 4-5 8-7 1 2 2 3 3 4 2 2 7 6 1 7zm-6-13c-4 2-6 5-8 8-11-4-20-10-29-17 9 3 18 3 27 2 4 2 7 5 10 7zm48-19c-6-3-12-7-19-6-7 0-12 5-18 9-17 9-37 9-54 2-1-1-2 2 0 3 0 0 1 0 1 0-10 12-24 19-40 19-2 0-2 3 0 3 1 0 2 0 3 0 0 0 0 0 1 1 11 7 22 15 34 23l1 1c-4 3-7 7-8 12-2-1-3-2-4-2-7-3-13-7-19-10-11-8-21-17-31-26 2 0 5 1 8 1 2 1 2-2 1-2-22-4-38-15-54-29-17-16-30-34-43-53 1 0 2 0 3 0 2 0 2-2 0-2-4-1-9-1-13-1-3 0-6 0-8-1-2-1-3-1-4-3-1-3 0-4 1-7 3-6 6-12 9-18 0 0 0-1 0-1 2-4 3-7 5-10 1 0 2 0 2-2-3-9-4-19-2-29 1 7 2 13 4 19 1 2 3 1 3 0-3-10-5-19-5-29 0-2 0-5 0-8 6 0 11-2 15-6 7 6 12 13 18 19 3 4 6 8 9 11 0 0 0 0 0 0 3 4 6 7 9 9 1 2 3 0 2-1-2-2-3-3-4-5 0 0 0 0 0-1 11-1 22-1 33 0 0 6-3 12-6 18-1 1 1 2 2 1 0 0 0 0 0 0 8 19 21 37 36 52 15 17 33 32 53 42 0 1 1 1 1 0-5 5-12 8-21 5-1-1-2 2 0 2 14 6 26-6 32-18 8-16 13-33 24-46 12-14 31-22 49-14 9 5 18 12 28 15-12 19-4 47 18 53-3 3-6 6-10 8-14 8-28 9-42 2zm55-12c-1 0-1 0-1 0-22-5-29-32-17-50 2 0 4 1 7 1 12-1 23-9 28-20 3 25-1 52-17 69zM367 594c-13-5-21 7-23 19-5-5-14-4-17 3-2 3-4 6-6 9-3 3-6 5-10 7-5 4-10 8-13 13-3 4-3 10-1 15 2 4 7 6 12 7 3 1 7 1 9 3 4 2 6 6 9 9 3 4 6 9 11 11 5 1 9 0 13-3 2-2 4-4 7-6 5-2 9 1 14 3 11 5 23 2 31-7 10-10 13-25 16-37 2-13 3-27-8-35-6-5-12-6-19-6-5 0-10 0-14-1-4-1-7-3-11-4zm38 10c13 6 14 21 11 34-2 11-5 23-11 33-7 11-20 16-32 10-8-4-14-5-21 1-5 4-9 8-15 4-5-3-7-9-11-13-2-3-5-5-8-6-5-2-11-2-16-5-7-6-3-16 2-21 4-4 10-7 14-10 5-4 7-8 10-13 2-3 5-6 9-5 3 0 5 1 7 4 0 0 0 0 0 0 0 0 0 1 0 1 0 0 1 0 1 0 0 2 3 0 2-1 0 0 0-1 0-1 0-6 1-13 6-17 6-5 13-3 19 0 11 5 23 0 33 5zM364 614c-11 4-20 15-19 26 1 14 14 25 26 26 1 0 1 0 1 0 8 1 16-2 22-9 7-9 7-23 0-32-7-9-19-14-30-11zm13 2c13 3 22 16 19 30-1 6-5 12-12 16-7 3-15 2-22-2 0 0-1 0-1 0-9-5-15-15-13-25 3-13 16-22 29-19zM362 638c1 2 3 0 2-1l-4-7c0-2-3 0-2 1l4 7zM375 626c1 2 2 3 2 5 0 2 3 1 3 0-1-3-2-6-4-8 0-1-2-1-2 0 0 1 0 1 0 2 0 0 1 1 1 1zM378 650c4-2 6-7 5-11-1-2-4-1-3 1 1 3 0 6-3 8-3 2-7 0-8-3-1-1-4 0-3 2 3 3 8 5 12 3zM1241 1937c-17 7-28 24-25 43 2 10 7 20 16 26 9 7 22 7 30 16 0 2 1 5 3 7 0 0 0 1 0 1 3 3 7 6 11 7 2 3 5 4 8 3 3-2 6-5 5-8 3-3 4-6 5-10 0-5-2-10-4-14-4-8-4-14-2-22 2-10 3-19-1-28-8-18-28-27-46-21zm8 45c2 2 5 4 7 6 1 0 2 0 2-1 0-3-1-6-1-9 1 2 2 4 4 5 0 1 2 0 2-1 0-3 2-6 5-6 5 13 9 27 13 41-4 2-8 3-13 3-7-11-14-22-21-33 2 0 2-3 2-5zm40 31c1 1 1 2 1 4 0 0 0 0 0 0-5 8-14 13-23 11-1-2-2-4-3-6 10 2 19-1 25-9zm-10 24c3-1 5-2 7-3-1 3-4 4-7 3zm10-11c0 2-1 3-2 4-1 0-1 0-1 1-5 4-12 3-16 0 8 0 16-4 21-10 0 2-1 3-2 5zm-13-79c6 5 10 13 11 22 1 10-4 19-3 29 0 4 2 8 4 12 0 0 0 0 0 0-2 2-3 4-5 5-4-15-9-29-13-44-1-2-3-1-3 1 0 0 1 1 1 1-4 1-6 3-7 6-2-2-3-5-5-7 0-1-2-1-2 0 0 4 1 8 1 12-2-2-4-4-7-6 0-1-2 0-2 1 0 1 1 6 0 6 0 0-1 0-1 0 0 0 0 0 0 0 0-1-3 0-2 1 7 12 15 22 22 34-1-1-1-1-2-1 0 0 0 0 0 0-5-5-11-7-17-9-8-3-16-7-21-15-10-14-9-34 4-47 13-13 33-14 47-1zM1196 1976l6 1c2 0 2-3 0-3l-6 0c-1-1-1 2 0 2zM1197 1950c3 1 6 2 9 2 2 1 2-2 1-2-3-1-6-2-9-2-2-1-3 2-1 2zM1228 1922c-1-1-3 1-2 2 1 1 2 2 3 3 2 1 3 0 2-2-1-1-2-2-3-3zM1261 1916c-1-3-1-5-2-7 0-2-3-1-2 1 0 2 1 4 1 6 1 2 3 1 3 0zM1286 1928c1-1 2-3 3-4 1-1 0-2 0-2-1-1-2 0-2 0-1 2-2 3-3 5-1 0-1 1 0 2 1 0 1 0 2-1zM1298 1954c1-1 2-1 3-2 2-1 1-3-1-2-1 1-2 1-3 2-2 0 0 3 1 2zM1220 2013c0 0 1 0 1 0 0-1 1-1 1-1 0 0 0-1 0-1 0-1 0-1 1-2 0-1-1-1-1-2-1 0-2 1-2 1 0 1-1 2-1 3 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0 2 1 2zM817 2594c-21-6-43-4-61 7-2 1 0 3 1 2 18-10 39-13 59-7 2 1 2-2 1-2zM1321 1477c0 1 0 1 0 1 0 0 0 0 0 0 0 1 1 2 1 2 5 5 10 10 16 14 1 0 1 1 1 1 1 0 1 0 1 0 2-1 3-1 5-1 18 16 37 33 56 50 0 0 0 0 0 0 0 1 1 1 1 1 11 1 21-6 23-17 0-1 0-1 0-2 0 0 0 0 0 0-12-12-23-25-34-37 0 0 1 0 1-1 0-5 0-9-3-12s-8-4-13-4c0 0 0 0 0 1-1-1-2-2-2-3-1 0-1 0-1 0 0-2 1-3 1-5 1 0 1 0 0-1 0 0 0 0 0 0 1-1 0-1 0-2 0 0 0 0 0 0 0 0 0 0 0 0-4-6-9-11-15-16 0-1 0-1-1-2 0 0-1 0-1 0 0 0 0 0-1 0-2-1-5 1-7 2-5 3-10 6-14 9-7 6-13 13-14 22zm87 35c-1 0-1 0-1 0-3 8-9 14-17 17 0 0-1 1-1 1l-9-9c0 0 0 0 0 0 9-5 14-13 15-23 4 5 8 9 13 14zm-5 30l-12-10c9-4 15-10 18-19 5 5 9 10 14 15-3 9-11 15-20 14zm-16-64c3 3 3 6 2 9 0 0 0 0 0 0-4-4-7-8-11-12 3 0 7 1 9 3zm-15-6c7 8 14 16 21 24 0 0 0 0 0 0-1 10-6 18-14 23-1 0-1 1-1 1l-30-27c10-4 19-11 24-21 0 0 0 0 0 0zm0-8c0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0 2 0 2-1-1-4 7-4 8-2 4-5 6-8 9-5 5-12 8-20 9-5-4-10-8-14-12 9-4 17-10 24-17 1-1 2-2 3-3 0 0 1-1 1-1 2-3 4-6 5-9 0 0 1 0 1 0 4 4 9 8 12 14zm-22-5c0 0-1 0-1 1-2 2-4 4-7 6-2 3-5 5-8 7-3-10 8-19 16-14zm-5-8c2 0 3-1 5-2 2-1 7-3 6 2-1 1-2 4-4 6-11-7-24 5-20 16 0 1 0 1 0 1-2 1-4 2-5 3-1-1-1-1-1-1-1 1-1 1-2 1 1-8 6-14 11-19 3-2 7-5 10-7zM1195 2136c6 14 21 25 36 26 1 0 1 0 1 0 12 1 23-4 30-13 8-11 10-26 6-38-5-14-17-23-30-25-14-3-28 2-36 13-9 10-13 25-7 37zm22-45c14-7 33-2 43 10 10 13 10 33 0 45 0 1 0 1 0 1-1 0-1 0-1 1 0 0 0 0 0 0 0 0 0 0 0 0-7 8-16 12-27 12 0 0 0 0 0 0-15-1-32-14-36-29-4-16 6-34 21-40zM1228 2140c8 5 18 5 26-1 7-6 11-16 8-26 0 0 0 0 0 0 0 0 0-1 0-1 0 0 0 0-1 0 0 0 0-1 0-1-4-8-12-14-22-13 0 0 0 0 0 0-10 0-19 8-21 17-3 10 2 19 10 25zm-8-24c2-8 10-15 18-16 0 0 1 1 1 0 9 0 17 5 20 13 6 17-12 34-28 25-8-4-13-13-11-22zM771 1200c2 1 6 4 9 4 2 0 4-3 5-5 1-4 0-7-1-9-1-2-3-1-2 1 2 3 1 8-2 10-6-1-10-5-12-11 0-1-3-1-2 1 1 3 3 6 5 9zM82 753c-2 9-1 17 3 25 4 10 11 19 21 25-7 1-9 10-5 16 7 9 22 10 32 9 7 0 13-1 19-2 5-1 10-2 14-6 4-5 3-12-1-15 3-1 6-3 9-4-2 3-2 8 2 12 7 8 22 7 30 4 9-3 15-8 20-14 3 0 5-1 8-1 0 0 0 0 0 1-4 6-12 13-12 21 0 6 5 10 10 11 7 2 14-3 19-7 22-17 30-49 20-74-3-18-12-33-27-43-17-10-37-9-55-2-4-2-10-2-15-2-2-4-3-8-5-13-1-2-2-5-5-6-3-1-5 3-6 6-2 4-4 8-5 12-13-3-26 2-35 11-2-3-5-6-8-8-3-2-8-5-12-4-3 2-3 6-3 9-1 5 0 11 2 16-7 6-14 14-15 23zm8 30c-2-4-4-9-5-14 6-11 14-21 22-31 7-8 21-23 32-11 1 1 2 0 2-1-1-15 21-10 29-8 11 2 22 4 33 6 4 6 6 13 6 20 1 20-11 37-27 48-28 21-72 24-92-9zm74 35c-3 3-7 4-10 5-7 2-14 2-21 3-7 0-14-1-20-3-3-1-7-2-9-5-4-4-4-13 4-13 1 0 1 0 1 0 5 2 10 4 15 5 12 2 24 0 36-3 6 0 7 7 4 11zm78-104c14 8 24 23 26 40 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0 1 0 1 0 0 0 1 1 1 8 21 3 47-13 64-4 5-10 10-16 12-4 1-10 1-13-2-4-4-2-10 1-14 7-13 17-25 25-38 1-1-1-2-2-1-5 7-10 15-15 22 0 0-1 0-1 0-2 0-4 1-7 1 0 0 1-1 1-1 0-1 0-1 0-1 5-11 6-24 0-35-1-2-3-1-2 1 5 11 5 24-1 35-1 1-1 1-2 2-3 4-7 8-12 11-8 4-18 6-26 3-6-1-12-5-10-12 1-3 3-5 5-6 1-1 2-1 2-2 2-1 3-1 4-2 9-2 16-7 22-13 1-2-1-3-2-2-4 5-9 8-15 11 11-11 19-26 20-42 0-15-7-29-20-36 16-6 35-7 50 3zm-143 18c0-1 1-1 1-2-2-4-2-7-3-11 0-2 0-3 0-5 0-1 0-1 0-2 0-2 1-3 4-3 2-1 3-1 5 1 2 1 3 2 4 3 3 2 4 4 6 6 0 0 1 1 1 1 1 1 3 0 2-1 9-9 21-13 33-11-1 2 2 3 3 1 1-4 2-8 4-12 0-1 1-2 2-4 0-1 1-2 3-2 1 0 1 1 1 2 3 5 4 11 7 16 0 0 0 0 0 0 0 0 0 0 0 0 0 1 1 1 1 1 11-1 21 3 27 11-14-3-28-6-42-8-7-1-18 2-19 10-9-7-21 0-28 7-10 11-19 23-27 36-1-3-1-6 0-9 1-10 7-19 15-25zM142 759c2-2 3-5 4-8 2 3 5 5 10 6 6 0 11-4 14-10 0-1-2-2-3 0-2 5-7 8-12 7-5-1-8-5-9-10 0 0-1-1-1-1-1-2-2-5-3-7 0 0 1 0 2-1 1 0 1-3-1-2-2 0-3 1-5 1 0 1-1 1-1 2 0 1 2 2 3 3 3 5 5 12 1 18-4 5-11 6-16 2-2-1-3 2-1 3 5 4 14 2 18-3zM152 725c1 2 3 0 2-1-1-2-1-4-2-6-1-2-3 0-3 1 1 2 2 4 3 6zM126 734c-1-2-1-4-2-6 0-1-3-1-2 1 0 2 1 4 1 6 1 1 3 0 3-1zM437 588c2 4 6 4 9 1 3-3 3-7-1-9-2-1-4-1-6-1 0 0 0 0 0 0 0 0 0 0 0 0-2 1-3 2-3 3-1 1 0 1 0 1 0 2 0 4 1 5zm6-6c3 1 3 3 1 5-4 4-8-3-4-5 0 0 1 0 1 0 0-1 1-1 2 0zM37 404c0 0-1 0-1 0-3 1-4 4-3 7 1 3 4 4 7 4 3-1 5-4 4-7 0-3-3-5-7-5 0 0 0 1 0 1zm5 5c0 2-2 3-3 3-4 1-5-4-2-6 0 0 0 0 0 0 1 0 1 0 1 0 2 0 4 2 4 3zM1343 1418c2 5 3 9 4 14 1 1 4 1 3-1-1-5-3-9-4-14-1-1-3-1-3 1zM1312 1467c-3 0-6-1-9-2-2-1-3 2-1 2 3 1 6 2 9 3 2 1 2-2 1-3zM1316 1436c-1-1-2 2-1 2 3 1 5 3 7 6 1 1 3 0 2-1-1-4-4-6-8-7zM328 563c1-3 0-7-3-8-3-1-6 1-7 4-3 6 2 13 9 13 8 0 12-8 10-15-3-9-14-12-22-9-2 1-1 3 1 3 5-2 11-2 15 2 4 3 5 9 2 13-3 4-9 5-12 1-1-1-1-3-1-5 0-1 1-3 1-3 3-2 5 0 5 3 0 2 2 2 2 1zM1005 1020c8 15 23 21 38 13 15-7 25-22 30-38 4-15 4-31-1-45 10 3 21-4 24-15 0-1 0-1-1-2-2 0-5 0-7 0 1-1 1-1 1-1 4-3 6-6 8-10 2-3 5-8 4-11-1-4-5-3-9-2 2-2 3-5 4-8 1-2 4-10 2-13s-5 0-8 1c-4 2-8 5-11 8 0-1 0-2 0-3 0-3 0-9-4-11-3-2-6 2-8 4 0 1-1 1-2 2 1-5 1-10 0-14-1-3-2-8-6-7-5 1-9 7-11 11-3 4-5 9-6 14-2-3-4-5-7-5-6 0-7 14-7 18 0 4 0 7 1 10-4-3-8-5-9 0-1 3 1 7 3 10 1 3 4 6 7 8-1 0-1 1-2 1-11 8-20 20-25 32-2 6-4 12-5 18 0 0 0 0 0 0-1 12 1 25 7 35zm-4-31c3 4 5 7 7 11-2 1-4 2-5 3-1 0-1 1-1 1-1-5-1-10-1-15zm1-9c0 0 1 0 1 0 8-5 15-8 24-10 4 6 8 13 11 19 0 0 0 1 0 1-10 2-18 5-27 9-3-5-6-10-10-14 1-2 1-4 1-5zm26-41c0 0 0-1 1-1 0 0 0-1 1-1 2-1 4-3 7-4 0 0 0 0 0 0 0 0 0 0 1 0 2 2 4 4 6 6-6 0-13 1-19 2 1-1 2-2 3-2zm38 3c0 0 0 0 0 0 0 1 1 1 1 2-6-3-13-4-19-5-2-2-5-5-7-7 9-2 19 1 25 10zm-8 76c0-1 0-1 0-1-3 0-5 0-7 0-3-9-6-17-9-26 10-2 20-4 30-1-3 10-7 19-14 28zm-10-1c-9 0-18 2-26 6-3-8-6-15-10-21 8-4 16-7 25-9 0 0 1-1 2-1 4 8 7 16 9 25zm25-33c-3-6-6-13-8-19 2 1 5 1 8 1 0 6 0 12 0 18zm-10-21c-3-8-7-14-12-21 5 1 11 3 16 5 1 0 1 0 1 0 2 5 4 11 4 16-3 0-6 0-9 0zm-42-18c0 0 0 0 0 0 8-3 17-4 26-3 5 6 10 13 13 21-11-1-22 1-32 4-4-6-8-11-13-16 2-2 4-4 6-6zm41 20c3 7 6 14 9 21 0 0 0 1 0 1-10-2-20 0-30 2-4-7-7-14-12-20 11-3 22-4 33-4zm-53 56c-4-5-6-10-7-16 0 1 1 1 2 1 2-1 4-2 6-3 4 7 7 14 9 21-2 1-4 2-6 3-1-2-3-4-4-6zm11 5c1 2 1 5 2 7-2-1-5-2-7-4 2-1 3-2 5-3zm9 8c-1 0-3 0-4 0 0-1 0-1 0-1-1-3-2-5-3-8 9-4 17-6 26-6 1 2 1 5 2 7-6 5-13 8-21 8zm23-10c0-2 0-3-1-5 2 0 4 1 5 1-1 1-2 3-4 4zm32-88c4-1 6-1 9 0-3 9-13 15-22 11 0-1 0-1 0-1-1 0-1-1-1-2 0 0 0 0 0-1-1-1-1-2-2-3 5 0 10-2 15-4 0 0 1 0 1 0zm14-22c1 2-3 6-4 8-2 3-4 6-6 8-6 5-14 7-21 8 0 0-1 0-1 0-1-2-3-4-5-5 3-2 5-4 7-6 4-3 8-5 11-8 3-1 6-3 8-4 3-1 10-6 11-1zm-18-13c2-3 5-6 9-8 1-1 3-2 5-2 3-1 2 0 2 2-1 8-5 15-11 20 0 0 0 0 0 0-4 2-8 5-11 7 1-3 3-6 4-9 1-3 1-7 1-10 0 0 1 0 1 0zm-10-13c6-6 7 7 7 10 0 5-1 9-3 14-1 5-4 9-7 13-2 1-4 3-6 5 0 0 0 0 0 1-1 0-1 0-2 0 0 1 0 1 0 1-1-1-2-1-3-1 2-5 5-10 7-15 1-1-2-3-2-1-3 5-5 10-7 15 0 0 0 0 0 0-2-1-4-1-6-1 3-16 10-30 22-41zm-15-13c0-1 2-3 3-4 4-1 4 4 5 6 1 5 0 10-1 15 0 0 0 1 0 1-2 2-3 4-5 6-3 5-6 10-8 16 0-4 0-8-2-12 0-1-1-4-3-7 2-8 5-15 11-21zm-24 27c1-2 1-9 3-10 2 0 3 0 4 0 1 1 2 2 3 3 0 1 1 3 1 4 2 2 3 5 4 8 1 7 1 14-1 20 0 1 0 1 0 1-1 0-2 1-3 1 0 0 0-1 0-1-1-1-2-3-2-5-1-2-4-1-3 1 1 1 1 3 2 5 0 0 0 0 0 0-1 1-1 1-2 1-4-6-6-12-6-18 0-4 0-7 0-10zm2 30c-5-3-8-6-9-10-1-1-1-2-1-3 0-3 2-3 3-2 2 2 3 4 4 6 1 0 1 0 1 0 1 3 2 6 3 8 0 0-1 1-1 1 0 0 0 0 0 0zm-29 41c2-7 6-14 10-20 4 5 8 10 11 14-8 3-15 6-22 10 0-2 1-3 1-4zM241 183c0 1 1 2 2 2 33 4 67 6 100 8 1 0 2-2 2-2-2-3-5-6-7-9 0-1 0-1 0-1-8-17-17-34-26-51-1-1-1-1-2-1-8 3-15 6-22 11 0 0 0 1 0 2 0 1 0 2 1 3-3 9-13 15-22 12-1 0-1 0-1 0 0-1-1-1-1-1-1 0-1-1-2-1 0 0-1 1-1 1-9 8-15 17-21 27zm67-50c3-1 5 4 6 6 2 4 3 7 5 10 6 11 11 22 17 33-16-13-30-27-44-41 2-2 4-3 7-4 2-2 6-4 9-4zm-17 13c1-1 1-1 1-1 0 0 0-1 0-1 14 15 28 28 43 41-22-6-43-14-63-25 9 0 17-6 19-14zm-27 13c23 13 48 23 75 30 0 0 1 1 1 0 0 0 0 0 0 0 0 0 0 0 0 0 1 1 1 1 1 1-32-1-64-3-96-7 5-9 10-18 19-24zM222 82c-2-1-2 2-1 2 5 1 10-1 12-6 2-6-1-11-6-14-13-7-24 8-24 20-1 15 5 32 13 44s20 23 34 28c1 1 3-1 1-2-19-8-34-25-41-45-4-11-8-25-2-36 4-6 10-10 17-7 3 1 6 4 6 8 0 5-4 9-9 8zM232 121c-2-1-3 1-2 2 7 9 15 16 24 22 1 1 2-1 1-2-9-6-17-13-23-22zM361 1278c-6 18 5 40 26 41 0 0 1 0 1-1 5-5 10-9 15-14-2 5-5 11-7 16 0 1 0 1 1 2 0 0 0 0 1 1 32 11 67 5 98-6 13-5 27-12 35-24 7-10 11-24 4-35-6-10-19-15-29-11-2-10-3-20-4-31 8-1 10-12 4-16-7-6-16-2-21 5-13-8-29-9-43-1-2-5-8-9-13-6-5 4-5 11-1 15-7 9-14 18-18 28 0 0 0 0 0 0-20 5-42 15-49 37zm136-27c0 0-1-1-1-1-6-1-9-6-7-12 0-1 0-1-1-1-5-2-5-9-1-12 3-3 7-3 11-2 0 0 0 0 1 0 0 0 0 1 1 1 0 0 0 0 0 0 1 8 2 17 3 26-2 0-4 0-6 1zm-67-50c4-3 9 0 10 5 0 1 1 2 2 1 13-8 30-8 43 1 1 0 2 0 2-1 3-5 8-9 14-7 7 2 9 13 0 14 0 0-1 0-1 1 0 0-1 0-1 1 1 2 1 3 1 5 0 0 0 0 0 0-7-2-14-1-18 6-2 4 0 9 4 12-1 6 2 11 7 13-2 1-4 3-6 4-2 1 0 3 1 2 5-3 11-6 17-6 7 1 10 7 9 14-3 12-16 15-26 17-1 1-1 3 1 3 6-2 14-4 19-8 4 0 8 1 11 2-4 2-7 3-11 5-1 0-1 2 0 2l1 1-18 3c-3 1-6 2-9 2-2 1-4 1-6 2-1 0-1 0-2 0-3 1-5 0-5-4 0 0 0-1 0-1 14-5 25-14 33-25 1-2-1-3-2-2-12 16-31 28-51 29 6-6 8-16 5-24-2-9-10-15-19-16 3-6 1-13-4-17-4-3-10-3-14-1 4-7 9-14 14-20 0 0 0-1 0-1 0-1 0-1-1-2-3-2-3-7 0-10zm89 59c-1 1 1 2 2 2 1 0 2 0 4 1-3 1-6 3-9 5 1-2 1-4 1-7 0-1-1-2-1-3 2 0 3 0 5 0-1 1-1 1-2 2zm-106 19c-4-2-8-5-10-9-2-2-3-5-3-8-1-4 1-11 7-9 0 1 0 3 0 4-1 8 2 16 6 22zm-3-24c0-5 2-10 4-15 0-1 0-1 1-1 9-11 24 2 17 14-1 1 0 2 1 2 9 0 17 6 19 15 2 7-1 16-7 22 0 0 0 0 0 0-5 0-10-1-15-3-14-6-22-19-20-34zm-1-10c0 1-1 3-1 5-8-3-12 8-10 14 2 9 9 16 17 19 1 0 1 0 1 0 3 3 6 5 10 7 13 6 27 6 39 2 0 1 0 2 1 4 1 2 5 2 8 2 13-3 26-6 39-8 1 0 1-2 0-3 0 0-1 0-2-1 4-2 8-3 12-5 1 0 1-2 0-2-4-2-7-3-12-3 2-1 3-3 3-4 0 0 1 0 1 0 4-3 8-6 13-8 0-1 1-2 0-2-1-2-3-3-5-3 0-1 1-1 1-2 1-1 0-2-1-2-3 0-6 0-8 0-2-2-5-4-8-5 0 0 0 0 0 0 15-7 30 9 29 24-1 18-16 30-31 36-16 7-33 12-51 14-18 3-37 2-55-4l9-20c1-2-1-3-2-2-7 6-14 12-21 19-8-2-16-7-20-15-5-9-4-20 1-29 8-17 26-25 43-28zM680 304c0 0 1 0 1 0 2 4 4 8 7 12 0 0 0 0 0 0 0 1 1 2 2 2 1 1 3 2 4 3 0 0 0 0 0 0 0 0 1 0 1 0 5 2 10 2 15 1 0 0 0 0 0 0 2 8 4 14 8 21 0 0 0 0 0 0 1 1 1 1 1 1 10 3 20-1 28-7 8-6 16-16 16-27 0 0 0 0 0-1 0 0 0 0 0 0-3-6-9-11-16-14 0-6-2-11-5-17 0 0 0 0 0 0 0 0 0 0 0 0 0-1 0-1 0-1 0 0-1 0-1 0 0 0 0 0 0 0-17-20-35-40-54-58-10-10-35-39-49-19 0 0 0 0 0 0-11 18 3 38 12 54 10 17 20 33 30 50zm43-43c1 0 1 0 1 0 3 4 6 7 10 11-10-3-22 3-30 10-7 5-11 13-13 21-1 3-2 7-1 10-1 0-1 0-1 0-2-3-4-7-6-10-5-24 16-46 40-42zm-39 16c-3 2-7-1-8-4-2-5 1-9 3-13 3-5 3-8 3-14 0-9 11-12 17-6 6 5 5 14 1 21 0 0 0 1 0 1-6 3-12 9-15 15-1 0-1 0-1 0zm6 39c0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0zm57 18c-8 6-17 10-26 8 2-8 5-14 11-19 8-7 18-12 28-11 0 9-7 17-13 22zm13-24c-10-2-20 3-27 9-8 5-11 12-14 20-2-4-4-8-5-12 0-1 0-1 0-1-5-16 9-33 25-30 8 1 17 6 21 14zm-16-16c-1 0-1 0-2-1 0 0 0 0 0 0 0 0 0 0 0 0 0 0-1 0-1 0-17-4-31 11-31 27-3 0-7 0-10 0-2-1-4-2-6-3-4-4-1-13 0-18 3-7 8-13 14-17 9-7 23-13 32-3 3 5 4 10 4 15zm-89-97c5 2 11 6 15 10-3-1-6-1-8 0-3 0-6 3-9 3-5 1-6-4-5-7 2-3 4-4 6-6 1 0 1 0 1 0zm-14 5c0 0 0 0 0-1 3-4 7-5 11-5-5 4-11 11-4 16 3 2 6 1 9 0 6-3 12-4 18-1 7 6 13 13 19 19 10 9 19 18 27 28-6-1-12 0-18 3 4-8 4-18-3-24-6-4-15-4-19 3-3 5 0 10-2 15-2 5-6 9-6 15 0 5 4 11 10 10-2 5-4 11-3 17-8-12-16-25-24-38-9-16-27-38-15-57zM665 249c5 0 9-5 9-9 0-6-5-9-10-9 0 0 0 0-1 0-4 0-6 5-6 9 0 5 3 9 8 9zm-2-16c0 0 0 0 0 0 0 0 0 0 0 0 4 0 8 3 8 7 0 3-2 6-6 6-3 0-6-3-6-6 0-2 1-7 4-7zM640 396c-1 7 4 14 11 14 7 0 12-7 9-13 10-3 21-1 28 7 2 2 4 5 5 8 0 1 2 5 1 6-1 1-3 1-4 2-1 1-2 2-2 3-3 5-1 11 4 13 5 2 10 0 12-4 5 5 14 5 18-2 3-8-4-15-11-14-1-14-8-27-19-34-11-6-26-6-37-1 0 0-1 0-1-1-7-4-21-5-23 5-2 7 3 13 9 11zm-3-14c5-4 10-2 15 1 0 0 0 0-1 0-1 1 0 3 2 2 11-6 26-7 37 0 12 7 18 20 18 33 0 1 2 2 2 1 0 0 1 0 1 0 6-1 11 5 8 11-4 5-11 4-14-2 0-1-2 0-2 1-2 5-9 7-12 2-3-4 0-10 5-11 1 0 1 0 1-1-2-18-19-30-37-25-1 0-1 1-1 1-1 0-2 1-1 2 3 6-4 12-10 10-5-2-6-8-5-13 1-1-1-2-2-1-3 2-8 0-8-4 0-3 2-6 4-7zM356 71c-8 10-7 24-1 35 6 12 17 19 28 25 0 0 0 0 1 0 8 5 22 8 30 2 4-2 6-7 8-11 1-3 1-6 3-8 4-4 10-3 14 0 5 3 9 8 15 9 5 1 9-1 13-3 9-8 9-20 4-31-10-21-34-33-57-36-19-3-46 0-58 18zm52-16c21 1 42 9 55 25 7 10 14 27 3 37-12 10-20-4-30-8-10-3-14 5-17 13-2 7-7 11-15 11-5 1-10 0-15-2 0 0 0-1-1-1-10-4-21-11-28-20-7-10-10-23-4-34 9-18 34-22 52-21zM371 108c5 3 14 6 20 3 0 0 0 0 1 0 0 0 0 0 0 0 0-1 0-1 0-1 11-12-17-30-26-18-5 5-1 13 5 16zm19 0c-7 4-23-1-23-10-2-16 33-1 23 10zM406 81c0 0 0 0 0 0 0 0 0 0 1-1 6-14-23-22-28-9-5 13 20 19 27 10zm-2-1c-4 6-20 3-22-4-4-14 29-10 22 4zM423 78c5 2 8 1 11-2 0 0 0 0 1 0 0 0 0-1 0-1 5-9-14-17-19-8-3 5 3 9 7 11zm9-4c0 0 0 0 0 0-1 2-2 3-4 2-4 0-9-2-10-6-1-8 20-4 14 4zM448 89c2 1 6 1 9-1 0 0 0-1 0-1 2-4-1-8-5-9-4-2-9 0-10 5 0 3 2 5 6 6zm1-9c3 0 7 3 6 6-2 2-8 1-10-1-2-2 2-5 4-5zM50 809c-7 0-10 8-13 13-1 3-2 6-4 8-2 2-3 4-5 6-2 1-4 1-5 2-5 3-1 6 3 8 12 5 31 7 40-4 7-8 4-22-6-23 4-4 7-8 10-12 1-2-2-3-2-2-3 5-6 9-9 12-2-4-4-8-9-8zm17 25c-1 6-6 10-12 12-4 1-10 1-14 1-3 0-6-1-9-2-1 0-8-2-8-3-1-2 6-5 7-6 3-2 5-5 6-8 2-3 3-7 6-11 2-4 7-7 11-2 1 1 2 3 2 4 0 0 0 1 0 1 0 0 0 0 0 0-3 3-7 6-10 8-1 1 0 3 1 2 4-2 7-5 10-8 1 1 2 1 2 0 6 0 10 7 8 12zM1159 847c-2-2-5-3-8-3 2-4 3-9 4-14 0-1-3-1-3 0 0 4-1 8-3 12 0-1-1-2-2-3-3-3-9-2-12 0-5 4-6 11-6 17 0 9 2 22-9 25-1 0-1 2 1 2 15 2 30-6 38-19 3-5 5-13 0-17zm-11 26c-6 5-14 8-22 8 5-4 6-10 6-16 0-6-1-12 1-18 1-4 5-8 9-7 4 0 6 3 6 6-1 0-1 1-1 1 0 0 0 1-1 1 0 0 0 0 0 0-1 3-3 5-4 7-2 1 0 3 1 2 2-2 4-5 5-7 0 0 1 0 1 0 0-1 0-1 1-2 3-2 7-1 9 3 1 3 0 7-1 10-2 5-6 9-10 12zM1322 2239c0 1 2 2 3 2 2 1 4-1 5-3 1-2 0-4-2-5-2-1-4-1-5 0-13-16-11-41 6-55 0 0 0 0 0-1 0 0 0-1-1-1-29-5-60 5-81 27-5 5-10 11-13 17-2-1-5-1-7 0-3 3-1 8 2 9 0 0 0 0 1 0-8 18-9 38-4 57 4 16 13 31 25 43 0 1 0 2 0 4 1 2 4 2 5 1 2-1 3-3 2-5-1-1-2-2-4-2 2-17 17-31 34-32 0 2 1 3 2 4 2 2 5 1 6-1 2-1 2-4 0-6-1-1-3-2-5-1-1-10 1-20 5-29 34 16 67 32 100 49 0 0 0 0 1 0 1 1 3 1 4 3 1 1 2 3 0 4-1 1-3-1-5-2-1 0-3 0-4 0-4 2-4 6-2 8 0 0 1 0 1 0 7 4 21 7 22-5 2-12-16-18-25-22 0 0 0 0 0 0-1 0-2-1-3-1 0 0 0-1-1-1-27-14-55-27-84-40 6-7 13-13 22-16zm6-2c-1 2-3 2-4 1 1-1 1-2 0-2 0 0 0 0 0 0 2-2 4-1 4 1zm-48-53c14-6 30-8 45-6-15 14-17 38-6 55-26-14-56-17-84-10 0 0 0 0 0 0 10-18 26-32 45-39zm-50 42c-2 0-2-3-1-4 1-1 3 0 3 1 0 1-1 2-2 4 0 0 0-1 0-1zm26 104c0 1 0 2-1 2-1 1-2-1-1-2 0 0 0 0 0 0 0 0 0 0 0 0 1-1 1 0 2 0zm-4-4c-21-20-30-50-25-78 1-7 3-13 5-19 10 28 30 49 55 64-17 1-33 15-35 33zm42-29c-1 1-3 0-3-2 1 0 1-1 1-1 0-1 0-1 0-1 2 0 4 2 2 4zm-5-6c-25-15-46-37-55-64 29-9 60-5 86 10-9 3-17 10-22 18-1 0-1 0-1 1-7 10-10 22-8 35zm118 33c-4 2-9 1-13-1 0-1-1-1-1-1-2 0-2-1-1-2 0-2 1-2 3-1 1 0 2 0 2 1 1 0 2 1 4 1 1 0 3-1 4-3 1-5-3-8-7-9 0 0 0 0 0 0-5-3-9-5-14-7l1-3c0 0 0 0 0 0 0 0 1 0 1 0 7 4 16 6 22 12 3 4 4 10-1 13zm-24-26l-1 3c-28-14-56-28-84-42 0 0 1-1 1-2 28 13 56 26 84 41zM1333 2104c-2-2-6-2-8 1 0 0 0 0 0 0-2 3-1 7 1 9 3 2 7 1 9-2 2-2 1-6-2-8zm-1 7c-1 1-3 2-4 0-2-1-2-3-1-5 3-2 8 1 5 5zM1397 2171c2 1 3-1 2-2l-1-2c-1 0-1 0-2 0-10 4-6 18 5 17 12-1 13-17 4-23-9-7-22-3-26 8-4 13 5 25 18 26 2 0 2-2 1-2-8-1-15-7-17-15-1-8 4-17 13-18 8 0 17 7 14 16-2 5-8 8-12 5-3-2-3-4-3-7 0-2 2-5 4-3zM583 912c-11-25-35-44-63-48 1-4-3-9-8-9-5 1-7 6-6 10-21 10-36 30-40 52-3-1-6 1-7 4-1 4 1 8 4 9 13 28 41 49 72 54 2 4 6 5 10 2 2-3 2-7 5-10 3-3 6-5 9-8 11-10 18-23 22-38 5-2 11-6 10-12 0-5-5-8-8-6zm-5-3c-1 0-3 0-4 0-1 0-5 0-6-1 0 0-1-1-1-2 1 0 2-1 2-2l4-4c2 3 3 6 5 9zm-77-38c4 0 9 3 8 8 0 5-5 8-9 8-1-1-2 0-2 1 1 4-3 9-7 9-5 1-9-4-9-8 0 0 0 0 0 0 0 0 0 0-1-1 0 0 0 0 0 0 6-7 12-13 20-17zm-12 88c-4-3-6-7-5-12 1-5 11-8 12 0 0 1 2 2 3 1 0-1 0-1 0-1 0 0 0 0 0 0 0 0 0 0 0 0 4-8 14-4 16 3 2 9-4 16-11 20 0 0 0 0 0 0-5-3-10-6-15-10 0 0 0 0 0-1zm99-37c-2 2-4 4-7 5-1 0-2 0-3 1-2 12-8 23-16 33-4 4-8 8-12 11-2 2-4 3-5 5 0 1 0 2-1 3-1 2-4 9-7 3 0-1-1-1-1-1-11-2-21-5-30-10 9-6 16-16 10-26-4-7-13-8-18-2-2-4-8-6-12-3-5 3-6 7-4 12-7-7-13-15-17-24 0 0 0-1-1-1-2-1-4-3-3-6 1-2 4-3 6-2 1 0 2-1 2-2 0 0 0 0 0 0 1-9 5-19 10-27 2 5 6 9 11 9 6 0 11-5 11-11 6 0 11-4 11-10 0-5-3-9-8-10 2-1 3-1 4-2 1 0 1-1 1-2-2-4 1-8 5-6 3 1 4 3 3 5 0 0 0 1 0 1 0 0 0 0 0 0-1 2 1 3 2 2 21 3 40 14 52 31 0 0 0 0 0 0-2 2-4 5-6 7-1 1-1 3 0 4 1 2 3 2 5 2 3 0 6 0 9 0 1 1 1 3 2 4 0 1 3 1 3 0 0-1 1-1 2-1 1 1 2 1 2 2 1 2 1 4 0 6zM570 926c-15 10-26 24-31 42 0 0 0 0 0 1 0 1 1 2 2 2 16-10 27-25 31-43 0-1-1-2-2-2zm-28 41c5-15 14-28 26-36-4 14-13 27-26 36zM551 905c-3-4-8-5-13-4 0-4 0-7-3-10-2-2-5-2-8-1-6 4-8 13-7 20 0 0 0 0 0 0 0 1 0 2 0 2 0 1 0 2 1 2 0 1 0 1 0 1 1 3 4 4 8 5 5 0 14 0 19-3 3-3 5-8 3-12zm-12 12c-3 0-6 0-9 0-3 0-6-1-7-4-2-5-1-11 1-16 2-3 7-7 10-3 2 3 1 6 1 9 0 1 1 1 2 1 4-2 11-2 12 5 0 5-6 7-10 8zM834 1664c3-2 4-5 3-8-2-3-6-4-9-3 0 0-1 0-1 1 0 0 0 0 0 0-3 2-3 6-1 8 2 3 5 4 8 2zm0-7c1 2 0 4-2 5-4 2-6-4-3-6 0 0 0-1 0-1 0 0 0 0 0 0 2-1 4 0 5 2zM1102 1775c-3 1-5 5-4 9 0 1 3 1 2-1-1-3 1-6 4-6 3 0 6 3 6 6 0 5-6 10-11 8-1-1-2 1-1 2 8 5 17-5 14-13-2-4-6-6-10-5zM1119 1784c1-2-1-3-2-2-1 2-1 5 1 6 1 1 3-1 2-2-1-1-1-1-1-2zM1021 1781c-8 9-11 21-3 31 8 10 22 11 32 3 1-1-1-3-2-2-8 6-20 7-27-1-8-8-6-19 0-28 4-4 9-8 15-6 5 2 10 6 12 11 1 5 0 12-6 14-6 3-16-6-8-11 1 0 0-3-2-2-8 6-1 17 7 17 11-1 14-14 9-22-6-11-19-13-27-4zM1290 1792c-19 1-36 9-50 22 0 0-1 0-1 1 0 0 0 0 0 1-1 6 2 11 8 13 9 25 23 48 41 67 0 0 0 1 0 1 24 13 52 16 76 27 0 1 1 1 1 1 5 4 11 4 16 0 0 0 0 0 1-1 12-29 9-63-8-89-18-28-52-45-84-43zm-6 96c-2-2-4-5-6-7-5-6-8-11-12-17-7-11-12-23-16-36 0 0 0 0 0 0 0 0 0 0 0 0 12-11 27-16 43-17-1 7-1 13-1 20-5-2-12-2-17 1-9 5-10 16-8 25 0 1 1 1 1 1 5 7 15 11 23 8 0 9 0 18-1 27 0 0 0 0 0 0-2 2-4-3-6-5zm81 33c-5-2-10-4-15-6 2-6-2-14-9-16-8-3-15 1-19 8 0 0 0 0 0 0-11-3-21-7-30-12 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 2-1 4-2 6-4 0 0 0 0 0 0 17-11 34-21 52-29 2 6 8 11 17 10 0 0 0 0 0 0 4 16 3 33-2 49zm-40-13c0 0 0 0 0-1 3-4 8-7 14-6 6 1 10 7 8 14-7-3-15-5-22-7zm42-38c-7 0-13-4-15-9 3-2 6-4 10-5 2 4 4 9 5 14 0 0 0 0 0 0zm-16-12c-1-5 0-10 4-14 0 0 0 0 0 0 2 3 4 6 6 9-4 2-7 3-10 5zm2-16c-5 5-6 12-4 17-20 10-38 20-56 32 0-8 1-17 1-26 1 0 1-1 2-1 9-7 11-19 4-27-2-2-3-4-5-5 0-7 0-14 0-21 17 0 33 6 46 17 5 4 9 9 13 14 0 0-1 0-1 0zm-83 14c0 0 0 0 0 0-2-7-2-16 5-20 5-4 11-5 17-2 0 10-1 20-1 30-8 3-17-1-21-8zm25-21c8 6 9 18 1 26-1 0-1 1-2 1 0-9 0-18 1-27zm85 88c-1 0-1 0-1 0-4 3-8 3-11 0 0 0-1 0-1 0 9-28 6-59-11-83-16-21-41-34-68-31-15 1-29 7-40 17 0 0 0 0 0 0-5-1-8-5-7-10 0 0 0 0 0 0 0 0 0 0 1 0 24-23 60-27 90-13 29 13 48 39 53 69 3 17 1 35-5 51zM528 1380c0 0 0 0 0 0 0 0 0 0-1 0 0-1-1-1-1-2 0 0-1 0-1 0-8-4-18-1-22 7-4 7-5 22 2 28 9 6 20-3 24-10 5-7 5-16-1-23zm-1 22c-4 6-17 16-22 6-3-6-3-16 0-22 4-8 14-9 21-4 6 5 5 14 1 20zM557 1408c0 0 0 0 0 1-1 0-1 0-1 0-4 3-8 6-10 11-2 5-1 11 2 17 5 12 21 19 34 14 7-2 10-7 13-13 3-6 6-13 1-18-9-10-26-18-39-12zm39 22c-1 3-3 6-4 9-3 5-7 9-13 11-11 2-24-4-29-14-5-10-1-19 8-25 0 0 0 0 0 0 11-6 24 1 33 8 4 3 6 6 5 11zM538 1364c0 0 0 0 0 0-5-8-14-8-22-6-7 2-14 4-22 3-5-2-9-4-14-2-7 2-10 11-8 18 3 9 12 14 20 17 0 0 0 0 0 0 0 4 0 9 0 13-1 7-4 11-11 13-5 2-10 3-15 6-7 5-10 15-10 23 0 14 9 24 20 31 0 0 0 1 0 1 3 7 8 12 13 17 0 0 0 1 0 1 5 12 13 20 24 26 11 5 23 8 35 8 24 1 47-11 63-29 0 0 0-1 0-1 6 0 11-2 14-7 2-6-1-12 0-18 0-7 4-14 10-19 0 2 0 3 0 5 1 3 2 5 4 7 1 0 2 0 3-1 0 0 1-2 1-3 0-4 0-9 0-13-1-2-1-4-1-5 1 1 2 3 3 5 1 1 1 3 2 4 0 1 2 1 2 0 0 0 0-1 0-1 0-1-1-3-1-4-1-2-1-3-1-4-1-2-2-6-4-8 9-17-7-36-26-32-4-18-16-35-33-43-15-6-31-7-46-2zm-64 12c0-4 0-8 2-11 3-5 9-5 14-3 8 2 14 2 22 0 7-2 19-5 24 3 0 0 0 0 0 0-4 2-7 3-10 5 0 1-1 1-1 1-3-2-6-3-9-4-1 0-1 0-2 1-11 0-19 11-21 23-7-3-16-7-19-15zm6 106c6 3 11 6 17 7 0 1 0 1 1 1 1 4 4 9 7 12 0 1 1 1 1 2-11-4-20-12-26-22zm70 48c-12 1-23-2-34-7-11-5-19-13-24-23 6 3 11 6 18 7 8 7 18 11 29 11 0 0 0 0 0 0 23 6 48-2 65-17 1 0 1 0 1 0 1 0 2 1 4 2-15 17-36 27-59 27zm72-53c-1 6 2 13 0 18s-9 6-13 5c-12-4-13-20-11-30 1-12 6-22 15-30 2-1 0-3-1-2-10 8-15 18-17 30-1 10 0 23 7 30 0 0 0 1-1 1 0 0 0 1 0 1-1 0-1 0-1 0-14 12-34 19-53 17 9-2 17-6 23-13 2 2 4 3 7 3 2 1 2-2 1-2-5-1-8-5-8-9 0-2-2-2-2 0-1 2 0 4 1 6-15 16-40 17-57 3 0 0 0 0-1 0-1-1-2-2-3-3-16-19-13-48 8-62 0 0 0 0 0-1 2 1 4 2 7 2 2 0 6 1 8-1 2-1 2-3 0-5-1-2-4-4-7-5-3-2-6-4-10-4-4-1-5 3-3 6 1 3 2 4 3 6 0 0 0 0 0 0-16 11-22 31-17 48-19-6-41-20-37-43 0-4 2-9 6-12 4-5 9-6 14-8 7-2 12-5 14-12 3 6 7 11 14 12 8 2 24-9 29 2 0 0 0 0 0 0 1 0 1 0 1 1 0 7 3 14 7 20 0 0 0 0 0 0 1 13 10 24 23 25 12 2 24-7 27-19 6-4 10-10 13-17 9 3 19 7 24 15 1 2 2 4 3 6-7 5-12 13-13 21zm-108-45c-1-3 0-4 1-3 1 0 1 0 2 0 1 1 3 2 4 2 2 1 7 3 7 5 0 1 0 2-1 3-1 0-2 0-3-1-1 0-3 0-5 0-3-1-4-3-5-5 0-1 0-1 0-1zm77 23c-4 9-14 15-23 14-11-2-19-10-20-20 5 6 13 10 21 11 8 1 15-1 22-5zm49-1c0 4 1 8 0 12 0 0 0 1 0 2 0-1-1-1-1-2 0-2-1-3-1-4 0-2 0-5-1-8-4-12-16-18-28-21 0-1 0-2-1-2l-3 0c0 0 0 0 0 0l0 0c-2 0-2 2-1 3 0 0 1 0 1 0-5 15-20 25-36 23-15-1-27-15-29-30 0 0 0-1 0-1 0-1 0-1 0-1 0 0 0-1 0-1 0 0-1-1-1-2 0 0 0 0-1 0-2-4-7-5-12-5-9 1-18 7-26-1-7-7-6-19-3-28 3-10 8-19 20-18 0 0 0 0 0 0 4 2 8 3 12 6 8 6 9 12 8 21-1 7 2 19 12 14 4-2 7-7 12-9 8-3 17 4 24 7 13 7 26 15 38 24 1 0 1 0 1 0 6 3 12 7 16 12 0 4 0 8 0 9zm-56-85c16 8 27 24 31 41-2 1-1 3 1 2 18-6 34 13 24 30-5-5-11-10-18-13 0 0 0 0 0 0-12-8-24-16-37-22-10-6-20-12-30-4-2 2-4 5-7 6-5 3-8-3-8-7-1-7 2-12-1-18-2-5-6-9-11-12 17-10 38-11 56-3zM116 916c5-3 2-13 0-16-1-2-3-1-2 1 1 2 1 4 2 6 0 1 0 5-1 6-1 1-2-1-3-1 0-1-1-2-1-3-1-1-2-3-2-5-1-2-3-1-3 0 1 4 5 14 10 12zM144 907c5-3 2-12 0-16-1-2-3-1-2 1 1 2 1 4 2 6 0 2 0 5-1 6-2 2-4 0-5-2-1-2-2-3-3-5 0 0 0 0 0 0 0 0 0 0 0 0-1-1-3 0-2 2 2 3 5 12 11 8zM96 926c-1-1-2-1-3 1 0 8 9 12 16 14 9 2 18 1 26-2 19-9 20-27 17-45 0 0 0 0 0-1-3-12-6-25-16-35-7-7-18-12-28-9-10 3-16 14-17 24-1 9 1 16 3 25 0 0 0 1 1 1 2 5 6 9 7 14 1 2 2 4 2 6 1 2 1 4 0 6-2 2-6 4-8 1zm11-2c3-9-5-18-9-25 0 0 0 0 0 0-3-7-4-13-4-20 0-11 3-24 15-27 10-3 21 2 27 10 7 9 10 20 13 30 0 0 0 0 0 0 3 16 4 33-11 42-6 4-14 6-21 5-7 0-18-2-21-10 4 2 10 0 11-5zM117 892c5 3 10 0 11-6 0-2-3-2-3 0 0 4-4 5-7 3-1-1-3 2-1 3zM110 885c1 2 3 1 3 0-1-2-1-3-3-5 0 0-1 0-1 0s-1 2 0 2c0 1 1 2 1 3zM124 880c0 0 1 1 1 1 1-1 1-1 1-2 0-1-1-2-1-3-1-1-1-2-2-1 0 0-1 1-1 1 1 1 1 3 2 4zM1056 1124c0 0 1 0 1 0 4-1 8-2 13-4 4-1 8-2 11-4 7-3 12-9 12-16 0-6-3-12-9-13-4-1-8 0-11 3-2-9-16-12-22-6-12 12-2 28 4 39 1 0 1 0 1 1zm-7-32c2-6 7-10 13-9 5 1 9 5 9 10 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0 1-1 1 2 1 2 0 2-6 11-7 15-2 4 5 2 12-1 17-4 4-8 5-13 7-6 2-11 4-17 5-5-9-12-19-8-29zM622 1665c12-21 22-43 28-67 2-4 3-9 1-13-2-4-5-8-9-9-5-1-12-1-17-1-8 0-15 1-23 1-21 2-43 7-64 13 0 0 0 0 0 1-1 0-1 0-1 0-28 9-55 24-79 42-43 33-75 79-93 130 0 0 0 0 0 0-2 7-4 14-4 22 0 0 0 0 0 1 0 0 0 0 0 0 0 1 1 2 1 2 1 0 1 0 1 0 51 7 104-1 151-23 45-22 82-57 108-99zm-17 19c-2 2-5 5-8 6-5 1-8-2-9-6 11-7 21-15 32-22-4 7-9 15-14 22 0-1-1-1-1 0zm11-106c11 0 34-4 33 12 0 6-2 11-4 16-2 6-4 12-6 18-4 11-10 22-15 33-1 0-1 0-1 0 0 0-1 0-1 1-12 7-23 15-35 23-1-5 1-11 1-16 0-2-2-2-2 0 0 0 0 0 0 0 0 0 0 0 0 0-5 8-11 14-19 18-4 2-12 6-13-2 0-4 3-10 4-15 0 0 0 0 0 0 0 0 1 0 1 0 1-1-1-3-2-2-7 6-15 10-24 11-5 1-9 1-14 1-5-1-9-2-9-8 1-2 2-5 3-7 8-15 20-27 34-35 2-1 1-3-1-3 0 0 0 0 0 0-5 1-13 1-20-1 17-12 34-25 51-38 0-1 0-1 0-2 0 0 0 0 0 0 13-2 26-3 39-4zm-96 33c3-8 11-15 19-19 11-4 22-7 34-9-16 13-33 26-50 38-3-2-5-5-3-10zm-77 37c25-23 54-40 86-52-3 2-5 4-7 6-3 4-7 9-6 14 1 3 3 5 5 7-43 32-87 62-132 92 15-25 33-48 54-67zm-80 136c1-6 2-12 4-18 0-1 0-1 0-1 5-15 12-30 20-45 46-31 92-63 137-96 5 2 12 3 17 2-7 5-14 11-20 19-3 4-6 8-9 12-2 4-5 9-4 14 1 9 16 8 22 7 9-1 17-4 24-9-2 8-5 22 6 20 10-3 19-10 25-18 0 4-1 8 0 12-55 35-110 70-166 103 0 0 0 0 0 0-19 1-37 1-56-2zm161-29c-31 17-65 27-99 30 54-32 108-65 160-100 1 2 2 4 3 5 4 4 8 3 12 1-21 26-47 49-76 64zM429 1743c1-1 0-2-1-2-5-1-9 0-13 1 0 0 0 0 0 0 0 0-1 0-1 1-1 0-3 1-4 1 0 1 0 1 0 1-13 7-22 17-29 29-1 1 0 2 0 2 1 1 1 1 2 1 19-5 36-17 46-34zm-45 30c8-11 18-21 30-27 1 0 1-1 1-1 3-1 7-2 11-2-10 15-25 26-42 30zM308 1953l-1 1c-1 1 1 3 2 2l1-1c1-1-1-3-2-2zM294 1999c2 3 4 6 7 8 1 4 2 8 3 12 0 2 3 1 2 0 0-4-1-7-2-11 6 3 13 4 20 3l2 8c0 2 3 1 2 0 0-3-1-6-1-9 0 0 0 0 1 0 12-3 23-13 22-26 0-11-10-19-20-17 5-13-5-28-19-26-7 1-13 6-15 12 0 2-1 3-1 5-1 0-3 0-4 0-2 0-2 3 0 3 1 0 3 0 5-1 0 4 2 7 5 9-11 6-14 20-7 30zm9-27c0 0 0-1 0-1 3 2 7 2 10 2 2 0 2-3 0-3-3 1-6 0-9-2 0 0 0 0 0 0-3-2-5-5-6-8 1 0 2 0 3 0 1 0 1-3 0-3-1 0-2 0-3 0 0-1 0-3 1-4 2-6 8-9 14-10 12-1 20 13 14 23 0 1 0 1 0 1 0 0 0 0 0 0-2 1-1 4 1 3 11-5 21 6 19 18-1 10-11 17-21 20 0-1-1 0-2 0-10 2-21-1-28-10-6-9-3-21 7-26zM345 1988c1-1 0-3-2-2-6 7-17 6-22-2-1-2-3-1-2 1 6 10 18 11 26 3zM616 1795c-3 8-10 14-19 14-2 0-2 3 0 3 10 0 19-7 21-17 1-1-2-2-2 0zM467 1558c1-4 1-8 0-12 0 0 0-1 0-1-3-8-11-14-18-17-12-6-26-5-37 2-13 8-21 21-17 36 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 2 7 9 10 17 12 0 0 0 0 0 0 2 14 15 24 29 21 15-3 24-18 19-32 3-3 5-5 7-9zm-9-22c2 3 4 6 6 9-11 4-22-5-20-17 5 2 10 5 14 8zm-50 0c3 4 4 9 2 14-2 5-7 12-13 10 0 0 0 0 0 0-1-10 4-18 11-24zm10 39c-1 0-3 0-5 0 0 0 0 0-1 0 0 0 0 0 0 0-1 0-1 0-2 0 3-6 9-12 16-10 5 1 10 4 13 8-7 2-14 3-21 2zm23 21c-13 3-24-6-27-18 4 0 7 0 10 0 0 0 0 1 0 1 0 0 1 1 1 1 0 1 0 1 0 1 0 0 0 1 0 1 1 1 1 1 2 1 1 0 1-1 1-2 0-1-1-2-1-3 1 0 2 0 3 0 5-1 11-2 17-4 0 1 0 2 0 3 0 1 1 1 1 1 1 0 2 0 2-1 0-1-1-3-1-4 0 0 0 0 0 0 3-1 6-3 9-4 3 12-4 25-17 27zm2-24c-1 0-1 0-1 1-4-6-11-11-18-11-8 0-14 5-16 12-5-2-10-4-11-9 0-1 0-1 0-2 6 2 12-6 15-11 3-6 2-13-2-18 2-2 5-3 7-4 8-4 17-5 25-2-3 13 10 24 23 20 0 4 0 7-2 11-4 7-13 11-20 13zM444 1585c-2 3-6 3-8 1-2-1-3 1-2 2 4 4 10 3 12-2 1-1-1-2-2-1zM260 1260c1 2 4 1 3-1-2-7-3-13-5-20 0-2-3-1-3 1 2 6 4 13 5 20zM207 1265c-1-2-4 0-3 1 3 5 6 10 9 15 1 2 3 1 2-1-3-5-5-10-8-15zM252 1300c6-4 8-12 5-18-1-2-3-1-2 1 2 5 0 11-5 14-4 3-11 1-14-3-1-1-4 0-2 2 4 5 12 8 18 4zM186 1444c0 0 0 0 0 0 7 12 14 25 20 37 5 9 10 20 21 18 6-1 11-5 16-7 6-4 12-8 18-12 11-8 21-16 30-24 1 0 1-1 2-1 0 0 0 0 0 0 0 0 0 0 0 0 3-3 5-7 4-12-1-8-5-16-9-22-6-12-14-30-30-31-8-1-15 3-22 7-9 5-18 10-27 16-10 6-25 15-23 30 0 0 0 1 0 1zm106-9c1 4 3 8 3 11-1 3-2 5-4 7 0 0 0 0 0 0-1 0-1 1-2 1 0 0 0 1 0 1-1 0-1 0-1 0-8 7-17 14-26 21-9 6-19 14-30 18-7 4-14 2-18-4-3-5-6-10-8-15-4-7-7-14-11-21 2-1 5-3 7-5 1 1 1 1 2 2 0 0 0 0 1 0 3 4 7 6 12 5 9-1 15-10 12-19 0-1-1-3-2-4 15-11 30-22 46-32 4 5 7 10 9 14 4 7 7 13 10 20zm-65 3c2 7-3 14-10 15-8 1-14-6-14-14 0 0 0 0 0 0 1-3 3-6 6-8 7-4 15-1 18 7zm-14-25c6-4 13-7 19-11 6-3 13-8 20-9 8-2 14 1 19 6-15 10-31 21-46 32-4-4-10-6-16-3-7 3-10 12-8 19-2 1-5 3-7 5-2-3-4-6-6-10 0 0 0 0 0 0-2-14 15-22 25-29zM212 1435c-1 0-1 1-1 1 0 0 0 0 0 0 0 0 0 0 0 0-3 2-4 6-2 9 2 3 6 4 9 2 4-2 5-6 3-9-2-3-6-4-9-3zm5 10c-5 3-8-4-4-7 1-1 4-1 5 1 2 2 1 5-1 6zM243 1429c-11 4-16 16-13 26 0 0 1 1 1 1 4 9 14 15 24 12 11-4 18-15 14-26-4-11-15-17-26-13zm11 36c-9 3-18-2-21-11 0-1 0-1 0-1-3-9 2-18 10-22 10-3 20 2 23 12s-2 19-12 22zM255 1436c-6-3-15 1-18 7-2 5 0 10 4 14 0 0 0 0 0 0 6 5 15 5 19-2 4-6 2-16-5-19zm4 17c-2 4-7 6-11 5 0 0 0 0 0 0-6-2-10-7-8-13s8-8 13-7c6 2 8 10 6 15zM936 416c12 5 23-5 25-16 3-12-2-25-14-28-9-2-17 3-20 11 0 0 0 0 0 0 0 0 0 0 0 0-1 2-2 5-2 7 0 0 0 0 0 0-1 10 1 21 11 26zm12-41c10 3 13 16 10 26-2 9-13 18-23 11-7-5-9-13-7-21 0-1 0-1 0-1 0 0 0-1 0-1 0-1 0-3 1-4 2-8 10-13 19-10zM519 2016c0-1 1-1 1-1 1-1 0-2-1-2-1 0-2 0-2 0-1-9-5-17-10-24-7-10-18-17-28-23-2-1-3-1-5-2 0-1 0-3 0-4 0-2-3-2-3 0 0 1 0 2 1 3-10-5-20-8-30-8-12 0-22 4-29 12 0 0 0 0-1-1-1-1-3 1-2 2 1 1 1 1 2 1-2 3-4 6-6 9-2 2-3 5-3 9 0 0 0 1 0 1 0 2 0 3 0 5-2 20 10 37 26 47 0 0 0 1 1 1 0 0 1 0 1 1 4 2 9 4 13 6 1 0 1 0 1 0 19 7 39 10 56-1 11-8 16-19 16-31 0 0 1 1 2 0zm-15 25c-20 18-48 10-69-1-15-8-27-22-29-39-1-3-1-6 0-9 1 1 4 2 6 3 7 4 3 7 4 13 0 2 1 4 2 5 2 4 7 5 11 4 0 1 1 1 1 0 8-3 10 8 13 12 2 3 5 6 8 7 5 0 8-4 12-3 6 0 9 6 13 8 8 5 11 0 16-5 3-3 5-3 9-1 1 1 3 2 4 2 1 0 2 0 3 0-1 1-2 3-4 4zm7-10c0 0 0 0 0 0-1-1-2-1-3-2-1-1-3 1-2 2 1 0 2 1 3 2-2 0-3 1-4 1-1 0-2-1-3-1 0-1-1-1-2-1-1-1-3-1-4-1-3 0-4 2-6 4-1 1-2 2-3 3-4 4-8 2-11-1-3-2-6-5-9-7-3-1-6 0-9 1-4 1-7 3-11 0-2-2-3-5-4-7-2-5-6-11-13-10 0 0 0 0 0 0-8 2-12-4-11-11 0-2 1-5-1-7-1-2-2-3-4-4-3 0-6-1-7-4 0 0-1 0-1 0 1-3 2-6 3-9 0 0 1 0 1-1 1 0 1-1 0-2 1-2 2-3 4-5 0 0 0 0 0 0 1 1 3-1 2-2-1 0-1 0-1 0 5-6 12-10 19-11 13-2 26 2 37 7 10 5 19 10 27 18 9 8 15 19 16 30-2 0-3 0-5 0-2 0-2 3 0 3 2 0 3 0 5-1 1 6 0 11-3 16zM441 2004c0 0 0 0 0 0 0-1 0-3 0-4-1-1-1-1-2-1-1 0-1 1-1 1 0 2 0 3 1 5 0 1 2 1 2-1 0 0 0 0 0 0zM439 1962c-2 1-3 1-5 2-2 0-1 3 0 2 2 0 4-1 6-1 2-1 1-3-1-3zM502 1995c-2-1-3-1-5-2-2 0-3 2-1 3 1 0 2 0 3 1 0 1 1 1 2 1l1-1c1-1 1-2 0-2zM471 2019l0 4c0 2 3 2 3 0l0-4c0-2-3-2-3 0zM424 1981c-2-1-3 0-5 1-2 0 0 3 1 2 1-1 3-1 4-1 2 0 2-2 0-2zM428 1991c-1 0-2 0-2 1 0 0 0 1 0 1 0 0 0 0 0 1 1 0 2 0 2 0 1-1 1-2 0-3zM493 1980c-1 0-1 0-2 0 0 1 0 1-1 1-1 1 1 3 2 2 0 0 0 0 0 0 2 0 2-2 1-3zM490 2017c-2 0-2 3 0 3s2-3 0-3zM453 2018c0 0-1 1-1 1 0 1 0 2 1 2s2-1 2-2c0 0-1-1-2-1zm1 1c0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0zM78 482c0 0 0 0 0 0 0 0 0 0 0 0l0 0c0 0 0 0 0 0-1-1-3 0-2 2 0 0 0 0 0 0 0 0 0 0 0 0-2 3-3 8-2 11 2 3 5 5 9 4 2-2 3-5 3-8-1-4-5-7-8-9zm5 13c-2 3-6 0-7-3 0-2 1-5 2-7 4 2 7 6 5 10zM49 470c-1-1-2 0-2 1-2 4-4 8-1 12 1 3 5 5 8 4 3-1 4-5 4-8-1-5-5-7-9-9zm5 13c-2 4-6 1-6-2-1-3 0-6 1-8 4 2 8 6 5 10zM79 450c0 0 0 0 0 0-1-1-1-1-1-1 0 0-1 0-1 0 0 0-1 0-1 1 0 4 0 8 1 11 2 3 6 4 9 2 2-2 2-5 1-8-1-3-5-4-8-5zm5 11c-2 2-4-1-5-3-1-2-1-4-1-6 2 1 4 1 5 3 2 1 3 4 1 6zM106 451c-1 0-1 1-1 1 0 1 0 1 0 1 1 6 10 16 16 9 2-3 1-8-2-10-3-2-9-2-13-1zm9 3c3 0 7 4 3 7-4 2-9-3-10-7 2-1 4-1 7 0zM101 421c0 0 0 0 0 0 0 0 0 0 0 0 0 0-1 0-1 0 0 0 0 0 0 0 0 1 0 1 0 1 0 1 0 1 0 2 3 2 6 5 9 5 4 1 8 1 9-3 1-2-1-5-4-6-4-1-9 0-13 1zm14 2c1 1 1 3-1 4-3 2-7-1-10-4 0 0 1 0 1 0 2-1 4-1 6-1 1 0 3 0 4 1zM593 1199c1 5-2 9-6 11-2 0-1 3 0 2 6-2 10-8 8-14 0-1-2-1-2 1zM643 1187c-1 7-5 18 4 21 8 2 11-6 11-13 4 3 8 2 8-4 0-2-3-2-3 0 1 4-3 3-5 1 0 0 0 0 0 0 0 0 0-1 0-1-1 0-2 0-2 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0s0 0 0 0l0 0c0 0 0 1 0 1 0 4 0 8-3 10-5 5-9 0-9-4 0-5 1-9 1-13 0-1 0-2 0-3 0-1-2-1-2 0-5 6-14 2-14-5 0-1 0-1 0-2 0 0 0 0 0 0 0-1 0-1-1-2-1 0-2 0-2 1-2 10 9 18 17 12zM316 2350c2-2 4-5 3-8 0-1 0-1 0-1-4-7-12-3-18 0 2-5 5-11 6-17 1-3 1-6-2-8-3-2-8 0-12 2-5 2-10 5-15 9 0 0 0 1 0 1-1 3-1 7 3 8 1 0 3 0 4 0 2 0 3 0 4 0-3 7-7 18-1 24 1 1 2 1 3 1 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 1 0 0 0 0 0 0 0 4 1 9-1 13-4 4-2 8-5 11-7-1 0 0-1 0-1zm-35-21c0 0 0 0 0 0 4-3 20-16 24-9 1 3-2 8-3 10-1 5-3 9-5 13 0 1 0 1 1 2 0 0 1 1 1 0 5-2 14-8 17-3 0 0 0 0 0 0 2 3-1 5-3 7 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0-3 2-10 8-16 9 0 0 0 0 0 0 0 0 0 0 0 0-4 1-7 1-9-3-1-2-1-4 0-6 0 0 0 0 0 0 0-1 0-1 0-2 0 0 0 0 0 0 0 0 0-1 0-1 0 0 0 0 0-1 0 0 0 0 0 0 2-4 3-8 5-11 0 0 0-1 0-1 0 0 0 0 0 0 0-1-1-2-2-1-1 0-1 0-2 0-3 2-12 3-8-3zM1265 49c-3-1-4-2-6-5-1-1-3 0-2 2 2 3 4 5 8 6 1 0 2-3 0-3zM1150 2688c0 0 0-1 0-1-9-5-17-9-26-12 0 0 0 0 0 0-1-1-2-1-3 0 0 0 0 0 0 0 0 0-1 0-1 1-9 10-17 20-26 30-1 1-1 2 0 2 0 0 0 1 1 1 10 3 20 6 31 9 0 1 1 0 1 0 0-1 1-1 1-1 7-9 14-18 22-27 0-1 0-1 0-2zm-24 27c-10-3-19-6-29-8 8-10 17-20 25-30 0 0 0 0 0 0 1 0 1 0 1 0 8 3 17 7 24 12-7 8-14 17-21 26zM297 1650c1-6-4-13-9-15-6-2-10 2-11 7-1 6 3 11 7 15 1 0 1 0 1 0 0 0 0 0 0 0 6 2 11-2 12-7zm-17-3c-1-4 1-9 5-10 4 0 8 5 9 9 1 5-3 10-8 8 0 0 0 0-1 0-2-2-4-4-5-7zM579 1420c-6 2-12 4-18 6-2 0-1 3 0 2 7-2 13-4 19-6 2 0 1-3-1-2zM577 1429c-2 0-4 1-6 1-2 1-1 3 1 3 2-1 4-1 6-2 2 0 1-3-1-2zM522 1385c-5 2-9 4-13 6-2 1-1 3 1 2 4-2 9-4 13-6 2-1 0-3-1-2zM517 1394c-2 0-3 0-4 0 0 1-1 1-1 2 1 1 1 1 2 1l3 0c1-1 1-1 1-2 0-1-1-1-1-1zM1222 395c-8-4-17-8-20-18-3-8-1-18 6-24 1-1 1-2 0-2 1-1 0-2 0-2-5-1-8-4-11-7-1 0-2 0-2 0-12 13-18 33-7 49 5 8 12 11 20 14 10 3 29 11 21 25 0 0 0 0 0 0-1 1 0 3 1 3 4 0 7 0 11 1 1 0 2-1 2-1 0-1 0-1 0-1 1-7 0-15-3-21-4-8-11-12-18-16zm18 36c-2 0-5 0-8-1 3-6 1-13-4-17-7-8-17-9-26-13-10-5-16-14-17-25-1-11 4-22 11-30 3 3 6 5 10 6-11 10-11 28 1 38 6 5 15 8 22 13 9 7 13 18 11 29zM1246 507c0 0 0 1 0 1 0 0 0 1 0 1 0 0 0 0 0 0 3 3 6 6 8 10 1 0 2 0 3-1 5-15 23-16 36-18 12-2 24-6 34-13 19-11 32-34 25-56 0 0-1-1-2-1-2 1-5 1-9 2 0-1 0-1-1-1 0 0-1 0-1 1-2 0-3 0-4 1-1 0-1 1-1 2 2 11-1 22-8 30-7 11-18 16-30 19-17 3-43 4-50 23zm94-76c0 0 1 0 1 1h0c-1-1-1-1-1-1 0 0 0 0 0 0zm-65 59c12-3 25-3 37-9 16-8 28-27 25-46 4-1 9-1 13-2 7 26-14 49-37 59-12 4-24 5-36 8-10 2-18 7-22 15-2-2-5-5-7-7 4-11 17-16 27-18zM166 285c1 1 2 1 2 0 1-1 1-1 0-2-1-1-2 0-2 0 0 1 0 1 0 2 0 0 0 0 0 0zm0 0c0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0zM152 301c0 0 1 0 1 0 0 1 1 0 2 0 0-1 0-2-1-2 0 0 0 0 0 0-1-1-2 0-2 0-1 1 0 2 0 2zM393 2502c-4 0-7 4-6 8 0 4 4 6 7 6 1 0 1 0 1 0 0 0 0 0 0 0 4-1 7-4 6-8-1-4-4-7-8-6zm2 11c0 0 0 0 0 0 0 0-1 0 0 0-3 1-5-1-6-3 0-3 2-5 4-6 6 0 7 8 2 9zM614 2391c-1 0-2 1-3 2-2 2-4 4-6 6 0 0-1 0-1 0 0 1 0 2 1 3 6 0 12-1 17-3 1 0 2-1 1-2-2-2-6-6-9-6zm-6 8c1-1 2-1 2-2 1-1 3-3 4-3 1-1 1-1 2 0 1 1 1 1 2 2 1 0 1 1 2 1-4 2-8 2-12 2zM116 1639c1 1 3 2 5 2 5-1 2-7 0-10-1-2-5-7-8-4-2 3 1 9 3 12 0 0 0 0 0 0zm-1-9c0 0 0 0 0 0 0 0 0 0 0 0zM145 1620c0 0 0 0 0 0 1 1 2 1 4 1 1 0 1 0 1-1 2-1 0-6-1-7-1-3-5-7-8-4-2 4 2 9 4 11zM636 1003c0-1-1-1-1 0-1 0-1 1-1 1-1 1 0 2 0 2 1 0 2 0 2 0 0-1 1-1 1-2 0 0 0-1-1-1zM175 1574c0 0 0 0 0 0-2 3-2 6 0 8 3 2 7 2 9 0 2-2 2-7 0-9-3-2-7-2-9 1zm7 1c1 1 1 4 0 5-1 1-3 2-5 0-1-1-1-2 0-4 0 0 1 0 1-1 1-1 3-1 4 0zM637 1772c1 0 2-1 1-2 0-1 0-3 0-4 0-1-1-2-1-2-1 0-2 1-2 2 0 1 1 3 1 4 0 1 0 2 1 2zM646 1785c3-3 4-6 5-9 1 0 2 0 2 0 2-1 2-3 0-3 0 0-1 0-1 0 1-11-6-21-19-22-15 0-24 16-17 29-12-3-25 0-31 11-7 11-1 25 10 31 1 1 2 1 2 1 0 1 0 1 0 1 1 3 1 5 2 8 0 1 3 1 3-1l-2-7c5 2 11 3 17 2 0 2 0 3 1 5 0 1 2 1 2-1 0-1 0-3-1-4 7-1 13-3 17-7 11-7 17-21 9-33 0 0 0 0 0 0 0 0 1-1 1-1 0 0 0 0 0 0zm-13 33c-10 6-24 8-35 3-10-5-17-18-11-29 6-11 20-13 31-9 0 0 0 1 1 1 1 1 2 1 2 0 1-1 1-2 0-3-1 0-1 0-2 0-8-11 0-27 14-27 11 0 17 10 16 19-2 0-3 1-5 1-2 0-2 3 0 2 1 0 3 0 4 0 0 2-1 3-2 5-1 0-1 0-1 0-3 4-6 5-11 5-1 0-1 3 0 3 3 0 6-1 8-2 0 0 0 1 1 1 0 0 0 0 0 0 7 11 1 24-10 30zM1256 1642c3-1 5-4 4-8-1-3-4-5-8-4 0 0 0 0 0 0 0 0 0 0 0 0-3 1-5 4-4 8 1 3 5 5 8 4zm-3-9c0 0 0-1 0-1 0 0 0 0 0 0 4 0 6 6 2 7s-6-5-2-6zM814 1938c0 0 0 0 0 0 0 0 0 0 0 0-3 1-5 4-4 6 0 3 3 5 6 4 3 0 5-3 4-5 0-3-3-5-6-5zm2 8c-4 1-5-4-2-5 0 0 0 0 0 0 2 0 3 0 4 2 0 1-1 3-2 3zM587 1752c3 0 5-3 4-6-1-3-4-5-7-4 0 0 0 0 0 0-2 1-4 4-3 7 1 2 4 4 6 3zm-2-7c0 0 0-1 0-1 0 0 0 0 0 0 4 0 5 5 2 6-4 1-5-4-2-5zM1236 2115c0 2 3 3 5 3 0 0-1 0-1 1-1 1-3 3-3 5 0 4 4 6 8 6 3-1 6-5 6-8-1-2-2-4-3-5-1 0-1 0-2-1 2-3 2-7-2-8-4-2-7 1-9 5 0 1 0 1 1 2zm12 9c-1 1-3 3-5 3-3 0-3-2-2-6 1 0 2-1 2-1 1-1 1-1 1-1 3 0 5 1 4 5zm-3-9c-1 0-1 0-1 1-3-1-6-1-5-3 0 0 0-1 0-1 0 0 0 0 0-1 3-2 5-1 6 4zM1223 1435c-1 2 2 3 3 1 1-3 0-6-2-8-1-2-3 0-2 1 1 2 2 4 1 6zM897 1050c1-3 4-3 7-3 2 1 2-2 1-2-4-1-9 0-10 4-1 1 1 3 2 1zM1120 2602c0 0 0 0 1 0 0 0 0 0 0 0 1-2 2-4 3-5 0 0 0 0 0 0 2-3-2-7-5-8-4-3-9-5-13-3-1 0-1 1-2 1 0 0-1 0-1 1-1 2-1 4-2 6 0 0 0 1 0 1 0 0 0 0 0 0 5 5 12 8 19 7zm-11-14c2 0 4 0 6 1 0 1 1 1 1 1 1 1 3 2 4 3 1 1 1 2-1 3-2 0-7-1-9-3-1 0-3-1-3-2-2-3 0-3 2-3zm-5 6c0-1 0-1 1-2 0 1 1 2 2 3 3 2 9 4 13 3 0 1 0 1-1 2 0 0 0 0 0 0-6 0-11-2-15-6zM1080 2598c0 0 0 0 0 0 2 1 3 2 5 4 0 0 1 0 2 0 5-1 10-5 12-10 0 0 0-1-1-1 0-1 0-1 0-1-1-1-1-2-2-3-1-1-1-1-1-1 0 0-1-1-2-1-4-1-10 1-13 4 0 0 0 1 0 1-2 3-2 6 0 8zm13-4c1-1 2-2 2-3 1 0 1 0 1 0 0 0 0 0 0 1-2 4-6 7-10 7 0 0-1 0-1 0 3-1 6-4 8-5zm-2-7c2 0 2 1 1 4 0 0 0 0-1 1-1 1-3 2-5 3-2 1-2 1-4 0-1 0-1-1 0-3 0 0 1-1 1-2 0 0 0 0 1 0 1-1 2-2 4-2 1 0 2-1 3-1zM1092 2618c4 2 10 4 14 1 3-2 2-5-1-7 0-1 0-1 0-1-4-3-10-5-14-3-5 3-2 8 1 10zm2-8c1 0 2 0 4 0 1 1 2 1 3 1 0 1 0 1 0 1 1 0 2 1 2 1 0 0 1 0 1 0 0 0 0 1 0 1 0 0 0 0 1 0 1 3-2 4-4 4-3 0-5-1-8-3-1-1-2-4 1-5zM1100 2578c0 0 1 0 1 0 4 3 11 3 14-2 3-4 3-10-1-14-4-3-11-3-14 1-4 4-4 10 0 14 0 0 0 1 0 1zm1-13c3-3 8-3 11 0 3 2 3 7 1 10-3 3-8 3-11 1 0 0 0 0 0 0 0 0 0-1 0-1-3-2-3-7-1-10zM1089 2553c-2-3-8-11-13-9 0 0 0 0 0 0-13 4 1 21 8 25 0 1 1 1 1 1 0 0 0 0 1 0 3 0 5-2 7-4 0-1 0-1 0-1 1-3-1-8-4-11 1-1 1-1 0-1zm-14-5c0 4 3 8 4 10 2 2 6 7 10 8-1 1-2 1-3 1 0 0-1 0-1 0 0 0 0 0 0 0-4-2-16-14-10-19zm15 14c-1 3-6-3-8-4s-2-3-3-5c0-1-2-3-2-5 1-3 5 1 8 4 0 0 0 0 0 0 1 2 2 3 3 4 1 2 3 5 2 6zM860 968c0 0 0 0 0 0 1 1 2 1 2 0 2-2 5-5 5-8 0-3-4-3-6-2-2 1-7 2-7 5-1 3 3 5 6 5zm4-8c-1 0-1 0-1 0 0 0-1 0-1 0 1 0 1 0 2 0zM638 510c-4-2-8-1-9 3-1 2 2 2 2 1 1-2 3-3 5-2 2 1 3-1 2-2zM654 503c0-1 2-2 3-2 2 1 3-1 2-2-3-2-7 0-8 3 0 2 3 3 3 1zM287 355c9-6 11-19 6-28-5-8-16-14-25-7-7 7-11 17-7 27 5 9 17 13 26 8zm-17-33c0 0 0 0 0 0 8-7 20 2 22 10 3 9-1 19-10 22-9 2-18-3-20-12-1-8 2-15 8-20zM286 341c4 2 3-7 2-9 0-1-1-4-2-5-1 0-2 0-3 0-1 0-1 1-2 2 0 2 1 5 1 7 1 2 2 5 4 5zM311 324c1 4 2 14 7 10 2-1 1-4 1-6 0-2-1-6-3-8-1 0-1 0-1 0 0 0-1 0-1 0-2 0-3 2-3 4 0 0 0 0 0 0zM1074 253c3 0 4-4 4-6 1-4 1-7 0-11 0-2-2-1-2 1 0 2 0 4 0 6 0 1 0 6-2 7-1 1-1 0-2-1-1-1-1-2-1-3-1-2-1-4-1-6 0-2-3-2-3 0 0 3 2 15 7 13zM1097 248c0 1 1 3 3 3 4 1 4-8 4-11 0-1-3-1-3 0s0 4 0 5c0 1-1 2-1 3 0 1 0 1 0 0-2-3-2-6-3-10-1-1-3 0-3 1 1 3 2 6 3 9zM1371 861c-1 0-2 0-2 1-1 1-1 3-2 4 0 1 0 1 0 2 1 0 2 0 2-1 1-1 1-2 2-4 0-1 0-1 0-2zM1360 873c-1 1-1 2-2 3 0 2 2 3 3 1 0-1 1-2 1-4 1-1-2-2-2 0zM1376 881c0-2 1-4 1-6 1-1-2-2-2 0l-2 5c-1 2 2 2 3 1zM1390 890c2-1 3-2 5-3 1-1 0-3-2-2-1 1-3 1-4 2-1 1 0 3 1 3zM1398 903c2 0 4-1 6-1 1-1 1-3-1-3-2 0-4 1-6 1-1 1-1 3 1 3zM1364 886c0 0-1 1-1 2 0 1 0 2-1 2 0 1 0 2 0 2 0 1 1 1 2 0 1-1 2-2 2-4 0-1-1-2-2-2zM1381 902c1-1 3-1 4-2s1-3-1-3l-4 2c-2 0-1 3 1 3zM1366 902c0 1-1 1-2 2 0 1 0 2 0 2 1 1 2 1 2 0 1-1 2-2 2-2 1-1 1-2 0-2 0-1-1-1-2 0zM1377 912c-1 0-3 0-4 1-2 0-1 3 1 2 1 0 2 0 4-1 1 0 1-2-1-2zM1406 888c-2 0 0 3 1 2 1-1 3-2 4-2 1 0 1-1 1-1 0-1-1-1-1-1-2 0-4 1-5 2zM1417 899c1-1 2-1 4-2 0 0 1-1 1-1-1-1-1-2-2-1-1 0-3 1-4 1-1 1-1 1-1 2 0 0 1 1 2 1zM1388 877c1-1 2-2 3-3 1-2-1-4-2-2-1 1-2 2-3 3-1 1 1 3 2 2zM1381 859l-3 4c-1 1 2 3 2 1l3-4c1-2-2-3-2-1zM1405 877c2 0 3-1 5-2 1 0 1 0 1-1 0-1-1-1-2-1-1 1-3 1-4 2-1 0-2 1-1 1 0 1 1 2 1 1zM1396 865c1-1 2-2 2-3 1-1 1-1 0-2 0 0-1-1-1 0-1 1-2 2-3 3 0 1 0 1 0 2 1 0 2 1 2 0zM1419 883c1 0 1-1 2-1 0-1 1-2 0-2 0-1-1-1-1-1-1 1-2 1-2 2-1 0-1 1-1 2 0 0 1 0 2 0zM1375 891c1-1 1-2 0-2s-1-1-2 0c0 1-1 1-2 2-1 1-1 1 0 2 1 0 1 0 2 0 1-1 2-1 2-2zM1392 908c-1 0-3 0-4 1-2 1-1 3 1 2 1 0 2 0 3 0 2 0 2-3 0-3zM1381 847c-17 2-27 18-29 33-2 15-4 37 15 42 16 4 39-1 52-11 13-9 16-24 9-38-2-4-4-7-7-10 3 1 7 1 10 0 3-1 7-3 8-6 2-7-11-9-17-9 1-5 1-10-2-14-5-7-9 1-11 7-1-3-2-6-5-9-1-2-6-7-9-6-3 2-3 8-3 10 0 5 1 10 4 14-5-1-10-2-15-3 0 0 0 0 0 0zm40 3c4 0 18 2 14 7-1 2-5 3-7 3-3 1-6 1-9 0-1 0-1 0-1 0-1-1-2-1-3-2 2-2 5-5 6-8zm-26-8c-1-3-2-9 0-11 3-3 8 3 9 5 1 3 2 6 2 10 0 0 0 1 1 1 0 1 2 1 2 0 1-3 2-6 3-8 1-1 2-3 3-4 2-1 3 1 4 3 3 7 0 14-6 18 0 0 0 0 0 1-4-3-9-5-14-6 0 0 0 0 0 0-2-3-3-6-4-9zm25 24c10 11 13 28 2 39-10 11-28 15-43 15-7 0-16 0-21-6-5-6-4-16-4-23 0-17 7-39 27-41 0 0 0 0 0 0 0 0 0 0 0 0 14 2 30 5 39 16zM1224 1178c1 0 1 0 1 0 3-2 6-4 8-7 7-12 10-29 6-43-3-12-13-23-26-24-9-1-19 3-23 11-1-2-1-5-1-8 0-1-3-1-3 0 1 3 1 5 1 8-7-5-16-7-24-3-1 0-1 1 0 2 3 4 8 7 13 8-22 10-16 41 2 53 10 7 23 7 35 5 3 0 6-1 9-1 1-1 1-1 2-1zm-58-64c7-3 16-1 21 4-1 1-2 1-3 1 0 0 0-1-1 0-6 1-13-1-17-5zm10 56c-11-10-17-31-5-42 6-5 15-8 23-8 13 1 23 9 28 20 1 2 3 1 3-1-5-10-13-18-24-20-3-1-7-1-10-1 5-10 17-14 26-11 12 4 20 16 21 28 1 12-2 25-8 35-2 3-5 5-8 6-3 0-7 1-10 1-2 1-3 1-4 1 0 0 0 0 0 0-12 1-23 0-32-8zM665 2179c1 2 4 3 6 2s4-4 3-6c-1-2-4-2-6-2 0 0 0 0 0 0-1 0-1 1-2 1 0 0 0 0 0 0-1 2-2 3-1 5zm6-3c1 1 0 2-1 3-2 0-3-2-2-3 0 0 0 0 0 0 1 0 3-1 3 0zM36 1688c-4 4-5 10-2 15 2 6 7 10 13 12-12 10-6 29 9 31-6 11-1 25 10 30-3 4-4 8-4 13 0 2 1 4 2 6 1 3 3 4 5 6 4 4-1 8-2 12-1 2-2 5-1 8 0 4 2 7 4 10-8 0-14 8-13 16-3-2-8-2-12 0-4 4-5 11-2 16-2 1-3 2-4 3-5 3-11 9-8 15 3 6 11 6 16 6 20 1 40-5 56-16 10 14 26 23 44 21 9-1 23-6 24-17 1-11-12-14-18-20 18 3 36-3 50-15 0 0 0 0 0 0 10 3 21 3 31-2 8-3 18-12 14-21-3-4-7-7-12-8-6-2-12-3-18-5-12-6-22-14-29-25 0-1-1-1-1-1-2-3-5-7-8-9 0 0 0 0 0 0-9-14-16-28-21-43 10-4 26-12 21-26-2-4-6-8-10-7-7 0-12 6-18 6-2-7-3-13-3-20 0 0 0 0 0 0 4-4 7-9 10-14 2-1 4-2 5-4 2-4 3-10 3-15 0 0 0-1-1-1 1-2 2-4 3-7 0 0 0 0 0 0 0 0 0 0 0 0 0-23-19-40-40-47-1-7-7-13-15-14-7-1-14 4-16 11-8-9-22-4-23 7-13-6-26 5-23 19-15-3-26 15-16 28-8 5-9 16-2 22-9 6-8 19 2 24zm1 16c-3-5-3-11 2-15 0 0 0 0 0 0 0 0 1 0 1 0 1 6 3 12 6 17 0 0 0 1 0 1 1 2 2 4 2 6-4-2-9-5-11-9zm13 13c3 9 6 18 9 27 0 0 0 0-1 0-14-1-20-19-8-27zm10 29c0-1 0-1 0-1 2 8 4 15 6 23 1 2 1 4 2 6-12-4-16-18-8-28zm9 69c1-4 6-8 5-12-1-2-2-3-3-4-3-2-5-4-6-7-1-5 0-10 4-14 1 7 3 13 4 20 2 11 4 22 2 33 0 0 0 0-1 0-5-4-7-10-5-16zm5 19c-3 7-7 12-13 16 0 0 0 0 0 0-4-9 3-18 13-16zm-15 17c0 0 0 0 0 1 0 0 0 0 0-1 0 1 0 1 0 1 0 0 0 0 0 0-4 3-9 6-14 9-5-9 6-18 14-10zm118-151c6 12-10 20-19 24-2-7-4-15-6-23 8 0 19-12 25-1zm1 70c0 0 0 0 0 0 15 15 21 36 15 56 0 0 0 0 0 0-7 9-20 0-26-5 0 0 0 0 0 0-9-8-17-18-23-28 0 0 0 0 0-1-1 0-1-1-1-1-1-1-2-3-3-4 0-1 0-1-1-1-7-12-12-26-14-41 1 0 2 0 2 0 7-3 15-10 11-18-1-4-5-6-8-6-2 0-5 0-8 0-1-2-1-4-2-6 0-1 0-1 0-1-2-7-2-14-1-22 10-1 19-5 27-11 4 32 14 62 32 89zm-15-114c-2 7-8 10-14 9 6-4 11-9 15-15 0 2-1 4-1 6zm3-18c0 0 0 0 0 0-3 14-15 24-28 28-16 6-34 4-50 1-2 0-3 2-1 3 3 0 6 1 10 1-1 0-1 1-1 1 3 12 18 13 24 3 9 9 25 5 29-8 2 1 4 1 6 0-10 15-26 23-44 22-2 0-2 3 0 3 1 0 3 0 5 0-1 9-1 19 2 27 0 1 0 1 0 1 1 1 1 1 1 2-5 0-10-1-10-6 0-2-2-2-3 0 0 6 6 9 12 8 4 0 10-2 15 0 7 5 1 14-4 17-2 1-4 2-6 2 0 0 0 0 0 0-17 6-39-1-42-20 0-2-3-1-2 1 3 21 26 27 44 22 2 17 8 32 17 46 7 12 15 22 26 31 0 0 0 1 0 1 8 6 22 14 30 2 0 0 0-1 0-1 3-12 2-24-2-36 9 11 22 18 36 21 6 2 14 3 16 9 2 7-5 13-10 15-10 6-21 7-31 4 0-1 1-2 2-2 1-2-1-3-2-2-14 15-35 22-55 18-1-1-1-3-1-5-1-1-3-1-3 0 0 3 1 5 2 6 0 1 0 1 0 1 4 5 10 8 15 12 6 5 7 11 1 16-4 5-11 6-17 7-24 3-47-15-49-40-1-2-3-2-3 0 1 7 3 14 7 20-15 10-32 16-50 16-4 0-9 0-13-1-2-1-5-2-6-5-1-1 0-3 1-5 0 0 1-1 1-1 1-1 2-2 3-3 5-5 12-9 19-13 12-8 21-18 21-34 1-8-1-17-2-25-2-10-4-20-7-29-5-20-12-40-19-59 0-1 0-1 0-2-15-30-14-68 9-94 21-23 54-30 82-14 13 8 25 21 25 38zm-19 28c-3 12-18 16-26 6 7 0 14-1 20-4 2-1 4-1 6-2zm-29 6c0 1 0 1 0 1-3 9-16 8-19-2 7 1 13 2 19 1zm-5-92c6 0 12 5 13 11-7-2-14-3-20-3-2 0-4 0-6 1 2-5 7-9 13-9zm-17 10c-6 1-13 3-18 6 0-9 12-14 18-6zm-21 8c-8 4-14 10-19 16-5-12 8-22 19-16zm-36 46c0-1 0-2 0-2-10-11 0-29 15-25-8 10-13 21-16 34 0 4-1 8-1 12-7-5-6-15 2-19zm-3 22c0 0 0 0 0 0 0 0 1 0 1 0 0 0 0 0 0 0 0 7 1 14 2 21 0 0 0 0 0 0 0-1 0-1-1-1-9-3-10-15-2-20zM616 816c-6-1-12-2-18 2 0 0-1 0-1 0-4 4-4 9-1 13 0 0 0 0 0 0 0 0 0 0 0 0 10 11 23 18 38 19-3 2-5 4-5 8-1 3 1 5 4 5 0 1 1 1 1 2 1 0 1 0 2 0 0 0 0 0 0 0 24 8 48-4 60-24 13-21 14-48 3-70 1 0 3 0 5-1 2 0 3-2 3-4 0-5-5-6-9-5 0-1 0-1-1-1-7-1-14-2-21-3-4 0-10 0-8 5 0 1 0 2 1 2 2 1 4 2 6 3-8 9-18 18-31 20-12 2-25-3-31-14 0-1 0-1-1-1-1-4-5-5-8-2-4 5-2 14-1 20 3 12 12 23 24 26-4 1-7 0-11 0zm-18 11c-1 0-1 0-1 1 0-1 0-1 0-1 0 0 0 0 1 0zm7-54c0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0zm28 42c-10-1-18-7-23-15-2-4-4-8-5-12 0-3-1-5-1-8 0-1 0-2 0-3 0 0 0-1 0-1 1 0 1 0 1 0 0 0 1 0 1 0 1 4 3 8 5 12 1 2 3 0 2-1-2-4-3-8-4-11 0-1 1-1 2-2 0 0 0 0 0 0 0 0 0 0 0 0 6 11 19 17 31 16 13-1 24-9 32-19-4 12-11 24-20 33-10 2-20 0-29-4-1-1-3 2-1 2 8 4 17 6 26 5-2 1-4 3-6 4-3 2-7 3-10 4-1 0-1 0-1 0zm-5 4c8-1 16-4 23-9 1-1 3-3 4-4 0 0 0 0 0 0 1 0 1-1 1-1 11-10 17-24 23-37 0 0 0 0 1 1 0 0 0 0 0 0 1 9-1 19-5 28-1 2 1 3 2 2 5-10 7-21 5-32 0-1-1-1-1-1-1 0-1-1-2-1 0 0 0 0 0 0-1 0-1 0-1 0-1-1-1-1-1-1-2 0-4-1-6-2 0 0 0-1 0-1-1-2 7-1 7-1l6 1c4 0 8 1 12 1 1 1 1 1 2 1 2 0 6 0 7 3 0 3-5 2-7 2-1 0-2 1-1 2-1 0-1 1-1 1 11 21 11 47-1 67-12 20-35 32-58 24 0 0 0 0 0 0 0-1-1-1-2-1 0 0 0 0 0 0 0 0 0 0 0 0 8 0 17-2 25-5 1-1 0-3-2-3-8 4-16 5-24 5-1-1-1-2-2-2 0 0 0 0 0-1 1-1 3-3 5-4 0 0 0 0 0-1 12 1 23-2 33-9 13-9 21-23 23-39 0 6-1 12-3 17-1 2 2 3 3 1 3-10 3-20 0-30 0 0 0 0 0 0 0-2 0-3-1-5 1 0 1 0 1-1 1-4 1-9 0-14 0 0 0 0 0-1 0 0 0-1-1-1-2-1-4 0-6 0 0 0-1 1-1 1 0 1 0 1 0 2 0 0 0 0 0 0 0 0 0 1 0 1 12 23 4 54-18 68-21 14-51 9-68-10 1-2 2-4 3-6 19 12 44 10 61-6 1-1-1-3-2-1-16 14-40 16-59 5 1-1 1-2 1-2 0 0 0-1 0-1 7-3 17 1 25 0zm60-48c0 0 0 0 0 0 1-1 1-1 2-1 0 0 0 1 0 1 1 3 1 6 1 9-1-3-2-6-4-9 1 0 1 0 1 0zM294 2116c1 1 1 3 1 4 2 7 3 14 4 21 2 8 2 16 5 24 2 4 4 9 9 10 0 0 0 0 0 0 1 0 1 0 1 0 13-1 25-1 38-2 6-1 13 0 18-3 1 1 2 0 2 0 2-1 3-3 4-4 6-5 10-11 15-16 2-3 4-6 7-8 2-2 4-4 5-7 2-4 0-11-1-15-1-9-2-18-3-27-1-5-2-11-3-15 0 0 0-1 0-1-3-5-8-9-14-8 0-1-1-2-1-3-2-5-8-9-13-9 0 0-1 0-1 0-9 3-13 9-18 16 0 0 0 0 0 0-6 0-11 1-16 2-5-9-12-22-23-16-2 1-3 3-5 5-2 2-5 2-7 5-2 3-2 8 0 11 0 1 1 1 1 1 3 3 6 4 10 6-7 3-12 9-16 16 0 1 0 1 0 1-1 4 1 8 1 12zm40-33c0 0 0 0 0 0 3-2 6-2 9-1-2 2-3 4-3 7 0 0 0 0 0 0-3 3-6 2-9 0 0-2 1-5 3-6zm25 9c-5 1-10 1-15 2l3-3c0 0 0-1 0-1 4 0 7 0 10-1 4-1 7-2 11-3-3 2-6 4-9 6zm-31-1c0 0 0 0 0 0 5 4 11 4 16-1 0 0 0 0 0 0l-4 4c0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0-1 0-5 1-10 1-15 2 1-2 3-4 4-5zm-8 8c0 12 2 25 3 37 1 11 3 22 5 33 0 1 0 2 0 3-5 0-9 1-13 1-1 0-1-1-1-1-3 0-5-2-6-5 0 0 0 0 0 0-1 0-1 0-1-1-1-3-2-8-2-11-1-3-1-5-2-8-1-5-2-11-3-17 0-1 0-2-1-3 0-4-1-8-2-12 0-1 0-2-1-3 0-1 0-2 0-3 0-1 0-2 0-3 0 0 0 0 0-1 1-4 5-4 8-4 5-1 10-2 16-2zm11 73c-3-12-4-25-5-37-2-12-3-24-4-36 6-1 11-1 16-2 1 24 3 49 7 73 0 0 0 1 0 1 0 0-1 0-1 0-4 0-9 0-13 1zm16-1c0-1 1-1 0-2-3-24-6-48-6-72 6-1 12-1 18-2 0 0 0 0 0 0 3 25 7 49 10 73-3 2-7 2-11 2-3 0-7 0-11 1zm27-7c0 0 0 1 0 1-1 1-2 1-2 2-4-24-7-48-11-72 0-1 0-1 0-1 3-2 6-4 9-7 3 4 5 8 6 13 1 6 2 11 3 17 1 12 3 24 4 36 0 0 1 1 1 1-3 3-6 7-10 10zm14-15c-1 1-1 2-2 3-2-13-3-25-5-37-2-9-2-22-9-29 1-1 2-1 3-2 1 0 1 0 1-1 1 0 2-1 3-2 7 8 8 19 10 28 2 11 3 22 4 34 0 0 0 0 0 0-2 2-3 4-5 6zm5-71c0 0 0 0 0 0 0 0 0 0 0 0 2 5 2 11 3 15 1 9 3 17 4 26 0 4 2 10 1 14-1 3-3 5-6 7 0-11-2-22-4-33-2-10-3-20-9-27 2-2 5-4 8-6 1 1 2 2 3 4zm-6-6c-1 2-3 3-5 4 0-1 0-3 0-4 2 0 4 0 5 0zm-20-12c1 0 1 0 1 0 3-1 8 3 10 6 3 4 3 12-3 15 0 0 0 0 0 0-5 2-10 3-15 5-5 1-12 3-17 1 0 0 0 0 0 0 0-1 1-3 2-4 0 0 0 0 0-1 0 0 0 0 0 0 7-8 11-18 22-22zm-20 16c-1 1-2 2-3 4-2-2-5-2-8-1-1-1-1-1-1-2 4-1 8-1 12-1zm-47-5c1-2 3-2 5-4 4-2 6-8 12-6 8 2 12 13 16 19 0 0 0 0 0 1 0 0 0 0 0 0-2 1-4 3-4 5-11 0-21 0-29-8 0 0 0 0 0 0-1-2-2-4 0-7zm12 17c0 0 1 0 1 0 4 1 9 1 13 1-2 2-4 4-5 7-2 0-4 0-5 1 0-1-1-1-1-1-3 1-5 1-7 1-3 0-6 1-9 2 4-5 8-9 13-11zM495 484c-11-12 7-31-3-45-7-9-21-10-31-3-12 8-13 25-8 39 3 7 8 13 13 19 3 4 7 7 8 11 1 2 1 5 1 7-2 4-7 1-9-2-5-5-5-13-12-16-6-2-12-1-17 3-11 9-5 26 5 34 7 5 16 8 25 10 8 1 22 2 28 9 4 5 3 12-3 14-3 2-7 2-11 3-5 3-8 7-8 12 0 18 20 21 30 31 5 6 7 20-4 22-9 1-16-11-24-15-5-3-12-3-16 2-3 4-2 10 0 14 3 7 11 9 17 10 4 1 8 1 11 2 2 1 3 1 4 3 1 0 2 5 0 5-1 1-4-1-5-2-3-1-7-2-9 2-1 5 2 11 6 13 2 1 5 1 8 1 3-1 17-3 16 4-4-1-7-1-11-1-1 1-1 1-1 2-2 3-7 9-3 13-4 5-8 11-14 16-5 4-12 6-18 10-12 8-21 19-26 32-6 14-9 30-19 41-3 2-6 4-9 7-5 4-9 9-12 14 0 0 0 0 0 1 0 0 0 0 0 1 5 21 25 33 47 30 0 0 1 0 1 0 0 0 0 0 1-1 3-5 6-10 8-16 1-4 1-8 3-11 5-14 18-24 28-34 1-1 2-2 2-3 1 0 1 0 1 0 9-10 14-21 16-35 1-7 0-14 2-20 2-7 5-14 9-20 5 1 8-7 10-10 0-1 0-1 0-1 0 0 0 0 0-1-1-1-2-3-3-4 1-2 2-4 2-6 0-1 1-3 1-4 2-4 6-3 9-4 5-1 13-3 13-10 0-5-6-7-11-7-5 0-11 2-14-3-4-5 1-11 6-14 7-4 15-4 20-11 3-5 3-11-1-15-5-7-14-9-18-16-5-10 5-13 11-19 3-3 3-7 1-11-5-6-14-6-16-14-2-16 23-28 11-44-9-13-28-8-38-19zm-34 230c10 10 22 19 36 23 1 0 1 0 1 0 0 3-1 6-1 8 0 0-1 0-1 0-4-3-9-2-13-1-3 0-5 1-8 2-6 1-10 0-13-4-3-5-6-9-11-10-3-1-6 0-9 1 5-8 11-14 19-19zm-26 33c1-3 3-6 4-8 6-7 14-5 19 2 2 3 4 6 8 8 9 3 19-7 29-2 0 0 1 0 1 0-3 8-7 16-13 23-5 2-10 3-15 2-5-2-9-6-13-8-5-2-11-2-14 2-4-3-7-6-9-10 1-3 2-6 3-9zm17 59c-2 4-2 8-3 11-2 7-5 12-9 18-9 1-19 0-28-6-8-5-13-14-15-23 3-6 7-11 12-15 3-2 6-4 9-7 6-7 10-16 13-25 4 7 11 11 17 15 7 4 14 8 22 9-7 7-14 14-18 23zm20-25c0-1 0-1-1-1-7 0-15-4-21-8-3-1-5-3-7-4 6-9 18 4 24 6 4 1 8 2 12 1 0 0-1 0-1 0-2 2-4 4-6 6zm29-68c-2 6-2 11-2 17 0 2 0 3 0 5 0 0-1 0-1 0-13-4-25-13-35-23 1-1 3-1 5-2 5-3 10-5 14-9 5-5 9-11 13-17 7 2 12 5 16 10-4 6-8 12-10 19zm16-22c-1 1-2 3-3 3 0 0 0 0-1-1-4-6-10-10-17-12 0 0-1 0-1 1 0 0-1 0-1 0-2-2 2-7 3-9 8-1 15 2 19 8 0 0 1 1 1 1 1 1 2 2 2 4 0 2-1 3-2 5zm14-186c6 8-2 18-6 25-4 5-7 12-5 19 2 5 8 7 12 10 4 3 6 6 3 10-1 3-4 4-7 6-4 4-7 8-6 13 2 7 8 11 14 15 3 2 7 5 8 9 2 6-3 10-7 13-7 3-15 4-20 11-3 4-4 10 0 14 6 5 13 1 19 3 5 1 6 5 2 9-2 1-5 2-8 2-2 1-6 1-8 3-4 2-3 7-4 11-3-3-6-5-9-6 1-5-3-9-8-9-4-1-7 0-11 1-2 0-5 0-7-2-2-1-3-4-3-7 0-6 10 2 14 0 4-1 1-7-1-9-5-6-13-5-20-6-4-2-9-4-11-8-3-3-3-9 0-12 8-8 19 5 25 10 5 3 12 6 18 3 10-7 3-22-4-28-6-5-15-8-20-14-6-7-7-18 3-22 5-2 11-2 14-7 4-4 2-11-2-15-5-5-14-6-21-8-10-1-19-3-28-8-8-5-15-14-13-24 2-9 14-16 21-9 4 3 5 8 7 12 2 2 4 4 6 6 4 2 8 1 9-4 2-6-1-11-4-15-6-7-12-13-16-21-4-8-5-17-2-26 2-8 9-15 18-16 7-1 15 3 18 9 4 8 0 17-2 25-1 6-1 12 3 17 4 5 11 8 18 9 7 2 16 4 21 11zM1354 601c1 3 4 6 8 5 3 0 5-4 4-7-1-2-4-3-6-3-3-1-6 2-6 5zm9-1c1 1 0 3-1 4-2 0-3 0-4-2-1 0-1-1-1-2 0-1 1-2 2-1 0 0 1 1 1 0 1-1 3 0 3 1zM1361 586c1 4 4 6 8 8 1 0 1 0 2 0 2 0 4-4 4-6-1-4-3-8-8-9-3 0-6 3-6 7zm9-2c1 1 1 2 2 3 0 1 0 5-2 4 0 0-1 0-1 0-1 0-2-1-4-2-1-2-2-4 0-6 1-2 4-1 5 1zM1390 591c3-1 6-7 5-10 0-4-4-7-7-5-5 1-5 7-5 11 0 1 0 1 0 1 1 3 4 5 7 3zm-4-10c1-2 4-5 6-2 2 2 1 5 0 7-1 0-1 1-2 2-1 1-5 2-4-1 0 0 0-1 0-1 0-1-1-3 0-5zM1408 590c-3-3-7-1-9 1-3 1-4 4-2 7 2 2 7 2 9 0 3-2 4-6 2-8zm-3 5c-1 2-3 2-5 2-1-1-2-2-1-3 0 0 0 0 1-1 1-1 3-3 5-2s1 3 0 4zM791 167c1 1 3-1 1-2-1-1-1-3 0-4 2-1 3 0 3 2 1 2 3 1 3-1-1-3-5-5-8-3-3 2-2 6 1 8zM804 159c2 1 4-1 2-2-1-1-1-3 0-4 2 0 3 1 3 2 0 2 3 2 3 0 0-3-4-6-7-4-3 1-3 6-1 8zM809 176c4-2 4-7 2-10-1-1-3 1-2 2 1 2 1 4-1 5-2 1-5 0-5-2 0-2-3-2-2 0 0 4 4 7 8 5zM820 191c4 4 7 9 10 13 1 1 3 0 2-2l-9-13c-1-1-4 1-3 2zM819 175c0 1 3 0 2-1 0-3-1-5-2-7-1-2-3-1-3 0 1 3 2 5 3 8zM1138 2135c0 0 0 0 0 0 0 0-1 0-1 0-2 2-3 6-2 9 2 3 6 4 9 2 3-2 4-6 2-9-1-2-5-3-8-2zm5 9c-2 1-4 0-5-2-1-1-1-4 1-5 2-1 4 0 5 2s0 4-1 5zM829 833c-3-9-15-11-23-10-7 0-13 6-10 14 4 9 14 10 23 10 8 0 13-6 10-14zm-23-8c5 0 13 1 17 4 7 6 5 15-4 15-6 0-13 0-18-4-6-6-3-14 5-15zM759 804c2 8 7 15 14 18 11 5 21 0 30-5 17-5 37-14 44-31 6-15-3-31-18-37-17-8-37 0-51 11-13 11-24 27-19 44zm18-40c13-10 30-19 47-14 14 4 26 18 21 34-6 17-27 26-43 31 0 0 0 0 0 0-8 4-18 9-27 5-7-2-12-9-14-16-5-15 5-30 16-40zM812 861c-4-1-8 2-8 6 0 4 3 8 7 8 3 0 7-3 7-7 1-3-2-6-5-7 0 0-1 0-1 0zm4 7c-1 2-3 4-6 4-2 0-3-3-3-5 0-2 2-3 4-4 0 0 0 0 0 0 3 0 5 3 5 5zM805 806c1 0 1 0 1 0 0 0 0 0 0 0 7-7 19-22 12-32-7-8-18-4-20 5-5-4-11-7-17-3-5 3-6 9-4 15 3 11 18 16 28 15zm-25-25c5-7 13-2 18 1 1 1 2 0 2-1 0-5 5-10 11-9s7 7 6 13c-2 7-7 14-12 19-8 0-17-2-22-8-4-4-6-11-3-15zM907 301c1 1 2-1 1-2-6-3-11-10-9-17 2-7 8-12 15-10 6 1 12 7 10 14-2 4-5 7-9 6-2-1-5-3-5-5 0-4 4-6 7-5 2 0 2-2 1-3-9-3-14 11-5 15 10 4 16-9 13-17-5-10-19-11-26-3-8 9-4 22 7 27zM162 166c6-7-3-17-10-11-10 7 0 19 10 18 11-1 16-13 12-22-6-11-20-12-28-4-2 1 0 3 2 2 4-5 12-6 18-3 6 4 9 11 6 17-3 6-12 10-18 6-3-3-5-9-1-12 5-4 11 2 7 7-1 1 1 3 2 2zM684 1669c-13 12-24 33-9 48 7 7 17 5 27 3 14-4 27-4 41-2 11 2 21 4 31-1 8-4 12-11 12-20-1-20-20-34-37-39-8-2-15-3-23-3 1-3-1-5-4-6 3-15 22-15 32-23 8-6 11-16 10-26 0-7-4-14-9-18 0-9-3-18-10-24-9-11-23-17-34-28-5-5-9-12-9-20 0-7 3-14 10-18 1-1 0-3-1-2-7 3-11 10-12 18 0 9 4 17 10 24 14 15 42 23 43 48 0 0 0 0 0 0-9-5-20-6-30-1-9 5-16 16-11 26 4 10 18 10 27 6 9-5 15-15 16-25 0 0 0-1 0-1 5 4 7 10 8 17 0 12-7 22-18 27-10 4-22 8-24 20 0 0 0 1 0 1-2 1-4 3-3 6-12 1-23 6-33 13 0 0 0 0 0 0zm54-62c-5 4-13 6-20 2-7-4-7-13-3-20 6-9 18-13 28-10 4 1 7 2 9 4-1 10-6 19-14 24zm-18 48c-1-1 0-3 2-3 1 0 2 2 2 3 0 0 0 0 0 0-2 0-3 0-4 0 0 0 0 0 0 0zm15 3c17 2 36 10 44 26 5 8 7 20-2 28-8 7-19 6-29 4s-19-3-29-2c-5 0-9 1-14 2-5 1-11 4-17 3-11 0-18-10-18-20 0-11 7-21 15-28 0 0 0 0 0 0 8-5 16-10 24-11 9-2 18-2 26-2zM686 1683c0 0 0 0 0 0-6 3-10 10-7 16 2 6 9 9 15 7 6-2 10-9 8-15-2-7-9-10-16-8 0 0 0 0 0 0zm13 8c2 5-1 11-6 13-4 1-10-1-12-6-1-5 1-10 6-12 0 0 0 0 0 0 0 0 0 0 0 0 5-2 11 1 12 5zM753 1686c3 0 6-3 6-6 0-4-3-6-6-7 0 0 0 0-1 0 0 0 0 0 0 0-3 1-5 4-5 7 0 3 3 6 6 6zm-1-10c0 0 0 0 0 0 1 0 1 0 0 0 5 0 6 7 1 7-2 0-4-1-4-3 0-2 2-4 3-4zM742 1699c3 0 6-2 5-6 0-3-4-6-7-5 0 0 0 0 0 0 0 0 0 0 0 0-3 1-5 4-5 7 1 3 4 5 7 4zm-2-8c1 0 1-1 1-1 0 0 0 0 0 0 2 0 4 2 4 4 0 2-2 3-4 3-4 0-4-5-1-6zM759 1696c0 3 2 5 5 5s6-2 6-5c0-3-3-6-5-6 0 0-1 0-1 0 0 0 0 0 0 0 0 0 0 0 0 0-3 0-5 3-5 6zm5-3c2 0 3 1 3 3 0 1-1 2-3 2-1 0-3-1-3-2 0-2 2-3 3-3zM752 1700c0 0 0 0-1 0-2 1-4 4-3 7 0 3 3 4 6 4 3-1 5-3 4-6 0-3-3-5-6-5zm1 8c-3 0-4-4-1-5 0 0 0 0 0 0 2 0 3 1 4 2 0 2-2 3-3 3zM710 1703c1-1 3-1 4-1 2-1 1-3 0-3-2 0-4 1-5 1-2 0-1 3 1 3zM726 1702c1 0 1 0 2 0 1 0 1 0 1-1 0-1 0-2-1-1-1 0-1 0-2 0-1 0-2 0-2 1 0 1 1 1 2 1zM738 1834c-2 0-2 3 0 3 1 0 1-3 0-3zM783 1840c-5-4-12 1-18-1 0 0 0 0 0 0l-1-1c0 0 0 0 0 0 0 0 0-1 0-1-1-1-2-2-3-3 1 0 1 0 1-1 1-2 2-4 2-6 1 0 0-1 0-1-6-4-13-2-18 3-1 0-1 0-2 0-1 0-1 0-1 0 0 0 0 0 0 0-3 0-7 1-10 1-2 1-4 2-4 4-1 5 4 10 7 13 1 0 1 0 1 0-1 3-1 11 3 12 5 1 6-7 6-11 0 0 0 0 0 0 6 5 14 5 20 0 0 0 0 0 0 0 3 0 4 1 3 4-1 2-2 3-3 4-2 3-4 6-6 9-1 0-1 1 0 2 0 0 0 0 0 0 3 5 8 7 12 5 6-3 10-11 13-17 2-5 3-11-2-15zm-22-12c0 1-1 3-1 5-3-3-6-4-10-4 3-3 8-3 11-1zm-18 24c0 1-1 5-3 4-1-1-1-3-1-4 0-1 1-3 1-4l3 0c0 2 0 3 0 4zm4-6c0-1-1-1-1 0 0 0 0 0 0 0l-7-1c0 0 0 0-1 0 0 0 0-1 0-1-3-1-7-5-7-8 0-4 9-4 12-4 0 0 0 0 1 0 0 0 0 0 0 0 1 0 2 0 2-1 1 1 1 0 2 0 5 0 11 3 14 7 0 1 0 1 1 1-1 0-1 1 0 2 0 0 0 1 1 1 0 0 1 0 1 0 0 0 0 1-1 1 0 1 0 1 0 2 0 0 0 1 1 1 0 0-1 0-1 0-4 4-12 4-17 0zm37 4c-1 6-14 30-21 16 0 0-1 0-1 0 5-5 17-20 5-20 0-1 0-1 0-1 0-1 0-1 0-2 0 0 0-1 0-1 2 0 4 0 6 0 2-1 5-2 8-1 3 2 3 6 3 9zM745 1834c0 2 0 4-2 5-1 1 1 3 2 2 2-2 3-4 3-7 0-2-3-2-3 0zM827 1831c2-3 1-7-1-10-2-2-5-4-9-3 0 0-1 0-1 1-1 0-1 2 1 2 2 1 2 4 2 6 0 1 0 3 1 4 2 3 6 2 7 0zm-7-10c2 0 3 1 5 3 0 1 1 2 1 4-1 3-4 3-4 0-1-2-1-5-2-7zM113 1467c9 1 7-16 7-21 0 0 0-1-1-1 1 0 0 0 0-1-1-8-6-17-16-20-6-2-12 0-18 4 0 0 0 0 0 0-3 2-5 4-7 6-5 8-10 19-4 28 0 0 0 0 1 0-3 13-1 29 14 31 15 3 23-13 24-26zm1-3c0-1 0-2 0-2 0-1-1-1-1-2 0 0 0-1-1-1-4-2-9-4-13-5 1-8 10-12 18-8 0 1 0 2 0 3 0 3 1 15-3 15zm-28-33c3 7-3 15-11 13 3-5 6-10 11-13zm-11 16c10 2 18-9 13-18 3-2 6-3 9-3 8 0 14 5 17 11 1 2 2 4 2 6-8-4-18 2-20 11-6-1-12-1-19 1-1 0-1 2 0 2-1 1-1 2-1 3-3-4-3-9-1-13zm5 11c0-1 0-1 0-1 11-2 21-1 31 4 0 0 0 0 0 0 0 0 0 0 0 1 0 1 0 2 0 3 0 0 0 0 0 0-1 12-6 26-20 26-17-1-17-23-11-33zM891 601c1-2 1-4 1-5 0-2-2-3-2-1-1 2-1 3-1 5-1 2 2 3 2 1zM904 604c0-2 1-4 1-6 1-2-2-2-2-1-1 2-1 4-2 6 0 2 3 3 3 1zM893 616c4 1 8-2 9-6 0-2-3-2-3 0 0 2-3 4-6 3-2-1-3-4-2-6 1-1-2-2-2-1-2 4 0 9 4 10zM847 646c-3-2-18-10-20-3-1 3 2 10 4 13 2 4 5 9 9 12 2 1 3 2 4 3-3-1-7 0-10 3-1 1-1 2-2 4-2 4-1 9 2 12-1 0-1 0-1 1 0 11 0 22 0 33 0 0 0 1 0 1 0 0 0 0 1 1 10 14 29 18 45 9 0 0 0 0 0 0 0 0 1-1 1-1 3-10 7-20 11-30 3-2 5-5 4-11 0 0 0 0 0 0 2-3 2-6 1-9-2-2-3-4-6-5 1 0 1 0 2 0 4-1 9-2 13-5 3-1 8-4 9-7 4-8-13-6-16-5-11 1-21 5-29 10 0-11 3-22 8-32 0 1 0 2 0 4 1 6 6 12 13 13 6 1 12-3 14-9 2-4 3-7 3-11 4 8 10 15 18 8 5-5 5-12 3-18 0-1 0-1-1-2 6 2 12 3 17-2 4-3 5-8 3-12-3-5-7-7-11-8 1-1 3-2 4-3 5-4 8-10 5-16-4-11-14-8-22-2 2-3 4-7 4-11 1-8-3-16-10-19-7-2-14 2-18 7-4 6-6 13-6 20-4-10-14-25-23-17-5 4-5 12-3 18 1 1 2 3 2 5-2-1-4-2-6-2-6-1-12 1-15 7-2 6 1 13 6 17 6 4 13 5 19 5-5 2-10 5-13 10-3 4-5 12-1 17 4 5 11 2 16-1 0 0 0-1 1-1-6 10-9 21-10 33-4-9-10-18-19-24zm19 38c0-1 0-2 0-3 10 2 18 6 26 11-2 2-5 3-7 3-7 1-14 0-21-1-7-2-13-4-19-7-2-1-6-3-8-4 7-6 19-4 27-2 0 0 0 1-1 2 0 2 3 3 3 1zm-32-27c-1-3-4-7-4-11 1-8 19 5 21 7 5 5 9 11 13 17-3-1-6-3-9-5-1-1-3 1-1 2l9 6c-7 0-14-2-20-6-4-3-7-6-9-10zm13 17c1 0 1-1 1-1 5 2 11 3 17 3 0 0-1 1-1 2-1 0-2 0-3-1-8-1-18-2-25 4-1-1-1-2-1-2 0-1 0-1 0-1 1 0 0-1 0-1 1-4 9-4 12-3zm30 59c-14 8-31 5-41-8 0-1 0-1 0-1 0 0 0 0 0 0 0-10 0-20 0-31 6 6 17 10 24 12 6 1 19 3 27 1-3 9-6 18-10 27zm0-29c-6 0-12-1-18-2-9-3-25-9-25-19 3 4 9 7 14 9 6 2 11 4 17 5 8 1 20 3 28-2 0 8-10 10-16 9zm16-20c1 2 1 4 1 6 0 0 0 0 0 0-8-5-18-9-27-11 0-1 0-2 0-2 6 2 11 3 17 3 3 0 7 1 9 4zm9-20c1 0 4-1 5 0 2-1 3 1 4 3-1 1-2 1-3 2-7 5-15 8-24 8 0 0-1 0-1 0-1 0-1 0-1 0-4 0-8-1-12-2 0 0 0 0 0 0 6-4 13-8 20-9 4-1 8-2 12-2zm2-23c-2 6-5 14-13 14-8 0-12-9-11-16 1-4 2-7 4-10 0-1 1-3 2-4 1-1 2-3 3-4 1 0 2 1 3 1-1 3-2 5-2 8 0 2 3 2 3 0 0-2 1-5 2-8 2 1 5 1 7 0 0 1 1 3 1 4 0 0 0 1 1 1 0 5 1 9 0 14zm-22-43c3-6 8-10 15-10 11 0 18 10 15 20-2 9-10 13-18 12 0 0 0 0 0 0-2-1-4-1-6-3-7-4-10-11-6-19zm44 41c-2 4-5 6-9 5-4 0-5-3-7-6-1-3-3-6-3-9-1-1-1-3-2-5 0 0 0-1 0-2 0 0 0-1 0-1 1-1 2-1 3-2 1 0 1 1 1 2 1 1 2 1 2 0 1 0 1-1 1-1-1-1-1-2-2-3 1-1 1-1 2-2 0 0 0 0 0 0 1 1 1 1 2 1 2 2 5 4 8 6 4 5 7 11 4 17zm6-35c3 1 7 2 10 5 5 5 2 13-4 14-5 2-10 0-14-2-2-3-5-5-8-7-1 0-1 0-1 0 0 0 0 0-1 0 0-1 0-1 0-1 0 0-1 0-1 0 1 0 1-1 1-2 1-2 1-4 1-7 1 1 1 1 1 1 5 0 11 0 16-1 0 0 0 0 0 0zm11-17c3 14-17 16-27 15 0 0 0 0-1 1 0-1 0-2 0-3 1 0 3-1 4-2 1-1-1-3-2-2-1 1-2 1-2 1-1 0-1 0-1 0 0-1-1-1-1-2 3-5 8-9 13-12 6-4 16-6 17 4zm-43-24c3-6 11-11 18-7 7 4 8 12 5 19-2 7-7 12-12 17-2-2-3-3-5-4 0 0 0-1 0-1 1-2 1-3 2-5 1-2-2-2-3-1 0 2-1 4-2 5 0 1 0 1 0 1 0-1-1-1-2-1-1 0-3-1-5-1 0 0 0 0 0 0-1-7 0-15 4-22zm-30 2c10-10 20 13 22 21-2 1-4 2-5 3 0 0-1-1-1-1-1-1-2-3-4-5-1-1-3 1-2 2 2 2 3 4 4 5 0 0 1 0 1 0-1 1-2 2-3 3-4-2-8-6-10-10-3-5-6-13-2-18zm-8 43c-7-2-13-8-11-15 1-7 8-9 15-7 5 1 9 6 13 10 1 0 1 0 1 0 0 0 0 0 0 0-1 2-2 4-2 5 0 0 0 0 0 0-2 0-3 0-5-1-1 0-2 2 0 3 1 0 3 1 4 1 0 0 0 0 1 0 0 2 0 4 0 5-5 0-11 1-16-1zm-2 28c-3-5 1-12 5-16 4-4 9-6 15-7 0 1 1 1 1 2-1 2-3 3-5 4-1 1 1 3 2 2 2-1 3-3 5-4 1 1 2 2 3 3 0 0-1 0-1 1 0 0-1 1-1 2-1 2-2 3-3 5-1 2-3 3-4 5-4 3-13 10-17 3zM1328 1826c-5-3-14-2-15 4 0 1 0 2 1 2 0 1 1 2 2 2-3 3-3 8 1 10 4 2 8-1 8-5 2 1 3 1 5 0 0 0 0 0 1 0 4-4 1-11-3-13zm1 11c-1 0-1 0-1 0-1 0-2 0-3 0 0-1-1-1-2 0 0 0-1 1-1 2 1 2-2 4-4 3-3-1-2-5 0-6 1 0 1-1 1-1 0 0 0-1 0-1 0 0 0-1-1-1-1-1-2-2-2-3 0 0 0-1 0-1 2-3 6-3 9-2 4 2 8 7 4 10zM1342 1877c0 0 0 1 0 1 0 1 0 3 0 4-4 0-7 4-6 8 2 4 7 4 10 2 0 1 1 2 3 2 0 0 0 1 0 1 1 0 1 0 1 0 0 0 0 0 0 0 0 0 0 0 0 0 6 0 9-8 6-13-2-5-9-10-14-5zm8 15c0 0 0 0 0 0-1 0-2-1-2-2 0-1-1-1-1-1 0 0-1 0-1 0 0-1-1-1-1 0-2 2-5 2-6 0-1-2 1-5 3-4 1 0 2-1 2-1 1 0 2-1 1-2-1-1-1-3 0-4 0 0 0 0 0 0 3-1 7 2 8 4 2 3 3 11-3 10zM939 1802c-6 0-10 5-13 10-5-4-10-7-16-6-6 1-10 6-11 11-2 16 16 23 28 26 0 0 0 0 0 0 1 1 1 1 2 1 11-7 21-20 19-33 0-5-4-9-9-9zm6 17c-3 9-9 17-17 22 0 0 0 0-1-1-9-2-22-6-25-17-2-6 1-12 7-14 6-2 12 2 17 6 0 0 1 0 2-1 2-4 7-12 13-10 6 3 5 10 4 15zM519 1847c-1-6-1-12-2-18-1-3-2-7-6-8 0-1-1-1-2-1-32 6-63 18-92 33 0 0-1 1-1 1-2 5 0 9 2 13 3 6 7 12 10 18 5 9 9 18 21 19 11 0 24-4 34-8 12-5 22-11 32-18 1 0 1-1 1-1 2-3 2-7 3-10 0-7 0-14 0-20zm-24 7c-1-2-1-4-3-6-5-7-17-6-18 2-8-7-21-3-22 8 0 3 0 5 0 7-10-5-20-8-31-11 27-14 56-25 87-31-3 11-7 22-13 31zm-13 23c-10 1-23-1-27-12-2-5-1-12 4-15 5-2 11 0 14 4 0 0 1 0 1 0 1 1 2 1 2-1-1-6 6-9 11-6 4 2 5 7 5 12 0 0 0 0 0 0 0 0 0 0 0 1-2 6-6 13-10 17zm34-15c0 4 0 10-3 14 0 0 0 0 0 0-16 12-35 20-55 24-5 1-12 2-17-1-4-3-7-8-9-13-3-5-5-9-8-14-3-5-7-10-6-16 12 3 23 7 34 12 0 0 1 0 1 0 5 9 19 12 29 12 1 0 1 0 2-1 4-4 9-12 10-20 8-10 13-22 16-35 5 2 5 10 5 14 1 4 1 8 1 13 0 3 0 7 0 11zM519 382c-1 2-4 4-3 7 2 6 13 6 18 6-1 5 0 18 7 19 3 0 5-2 7-5 3-4 5-9 8-13 0 0 0-1 0-1 0 0 0 0 0 0 4 2 9 4 14 4 3 0 7 1 10-2 6-6-4-12-8-17 5-3 14-9 12-16-1-3-4-4-7-4-6 0-12 1-17 2 0 0 0 0 0 0-3-4-7-8-11-12-3-2-7-7-11-6-4 1-5 6-6 10-2 6-3 12-2 18-1 0-1 0-1 0-3 4-6 7-10 10zm14-10c-1-4-1-27 8-25 3 1 7 5 9 7 3 3 6 7 8 11 1 0 2 0 2 0 0 0 1 0 1 0 3-1 6-2 10-2 2-1 7-1 9 0 2 2 0 5 0 7-1 1-2 2-3 3-2 2-5 4-8 5 0 1-1 1-1 2 0 0 0 0 0 1 3 3 11 7 10 12 0 8-17 2-20 0-2-1-2 0-3 1 0 0-1 0-1 1-3 4-6 9-9 13-1 2-5 3-7 0 0-1-1-3-1-4-1-3-1-6-1-9 0-1 0-1-1-1 0-1 0-2-1-2-4 1-18 1-14-7 1-2 4-3 5-5l6-6c0 0 0 0 0 0 1 0 2-1 2-2zM1201 2366c0 0 0 0-1-1 1-7 3-15 1-23-3-6-7-12-12-16-6-5-17-8-24-4 1-4 1-8 0-11 0-1-2-2-2-1-3 3-5 8-6 12-2-3-3-5-6-8-1-1-3 1-1 2 2 3 4 6 6 9-5-4-11-6-17-5-1 0-1 2-1 2 2 4 5 7 9 8-3 1-6 3-9 6-9 9-8 23-1 33 13 19 58 27 64-3zm-38-52c0 4 0 7-2 11 0 0 0 0 0 0 0 2-1 3-1 5 0 0 0 0 0 0-1-1-1-2-1-3 0 0 0-1 0-1 0 0 0 0 0 0 0-4 1-8 4-12zm-12 14c-4 0-7-2-9-5 5 0 11 2 14 6-1 0-3 0-4 0 0 0-1-1-1-1zm-9 43c-7-8-10-21-4-30 5-9 18-12 26-5 2 1 4-1 2-2-1-1-2-2-4-3 0 0 0 0 0 0 2-8 10-10 17-8 6 2 11 6 14 11 8 10 6 20 5 32 0 0 0 0 0 0-1 5-4 9-7 11 0-13-5-26-14-35-2-2-4 0-2 2 9 9 14 22 14 35-14 9-37 3-47-8zM1277 1474c3-1 4-3 4-6-1-3-4-4-7-3 0 0 0 0 0 0 0 0 0 0 0 0-2 1-3 4-3 6 1 3 4 4 6 3zm1-5c1 1 0 2-2 2-2 1-3-3-1-4 0 0 0 0 0 0 1 0 3 1 3 2zM23 2339c-4 25 12 50 36 59 0 0 0 0 1 0 0 0 0 0 0 0 22 7 46-1 60-18 14-18 15-45 2-64-12-18-36-27-57-23-22 5-39 24-42 46zm92-28c15 17 18 43 6 62-12 20-38 29-60 23 0 0-1 0-1 0 0-1 0-1-1-1-20-7-34-27-34-48 0-22 14-42 34-50 20-6 42 0 56 14zM54 2313c-1 5 3 9 8 7 4-1 10-7 10-12-1-3-5-6-8-4 0 0 0 0 0 0-4 2-10 4-10 9zm15-4c0 1-1 3-2 4-2 2-5 5-8 5-3 0-3-5-2-7 2-2 5-3 8-4 0 0 0 0 1-1 1-1 3 1 3 3zM86 2334c4-2 10-9 9-15-1-4-6-7-9-4-1 0-1 1-1 1 0 0-1 0-1 0-5 3-10 7-9 13 1 6 6 8 11 5zm-8-8c1-4 5-6 8-8 0 0 0 0 0-1 1 1 1 1 2 0 2-1 4 1 5 3 0 2-1 4-2 6-2 2-5 6-8 7-4 0-6-4-5-7zM59 2333c-1 0-1 0-2 0-4 2-9 6-8 11 1 6 6 7 10 5 4-3 9-10 7-15-2-2-5-3-7-1zm4 4c0 2-1 3-1 4-2 3-4 6-7 6-3 0-4-4-3-6 2-3 4-4 6-5 1 0 2 0 2-1 1-1 2-1 2-1 1 1 1 2 1 3zM1377 251c-1 9 12 11 15 3 3-9-7-16-15-14-8 2-15 11-11 20 3 8 14 11 21 7 2-1 1-4-1-3-10 6-23-5-17-15 3-5 9-8 14-6 4 1 7 5 6 9-1 5-10 6-9-1 0-2-3-2-3 0zM1100 46c21 2 41 9 58 21 2 1 3-1 2-2-18-13-38-20-60-21-2 0-2 2 0 2zM1140 69c7 2 13 5 19 8 1 1 3-1 1-2-6-4-13-6-19-8-2-1-3 2-1 2zM829 50c3-1 5-4 4-7 0-4-3-6-6-7-1 0-2 0-2 1 0 0-1 0-1 0-3 2-5 6-3 9 1 3 5 5 8 4zm-4-10c1-1 1-1 1-1 4 0 7 5 3 8-2 1-4 1-5-1-2-2-1-5 1-6zM600 120c-10-17-31-23-49-15 0 0 0 0 0 0-9-4-19-8-29-5-8 2-14 8-14 16-7 1-14 5-15 12-2 7 1 13 6 17 3 3 8 5 11 6 6 3 12 5 19 6-11 2-22 7-31 13-8 6-12 16-2 22 2 1 5 2 8 2 4 1 6 3 8 6 3 4 6 8 11 10 6 2 15-1 20-5 10 4 23 6 31-4 7 3 15 4 22 1 6-3 10-10 7-16 0 0 0-1-1-1-1-3-4-7-6-10 6-4-1-9-10-13 0 0 0 0 0 0 0 0 0 0 0 0 13-1 30-4 35-17 6-15-8-23-21-25 0 0 0 0 0 0zm-92 27c-1 0-3-1-4-2 0 0-1 0-1-1 0 0-1 0-1 0-2-2-3-5-2-9 2-5 7-10 13-7 1 1 2 0 2-1 0 0 0-1 0-1 4-18 27-21 35-6 1 1 2 1 3 0 0 0 0 0 0 0 5-8 15-9 23-6 8 3 14 9 19 16 0 0 1 0 1 0 0 0 1 1 1 0 5 0 10 0 13 5 3 5 1 11-3 14-6 6-14 9-21 11-1 0-1 0-1 0-1 0-2 1-2 1-6-2-13-4-15-5 0 0-1 0-1 0-1-1-2-2-4-3 1-1 1-2 1-2 0-7-5-13-11-14-6-1-13 4-14 10-1 3 0 5 0 7-2 0-3 1-5 2 0 0 0 0-1 0-8-2-17-5-25-9zm43 13c-1 0-1 0-1 0 0 0-1 0-1-1-5-1-8-5-8-10 0-6 6-10 12-9 5 0 9 5 8 10 0 6-5 10-10 10zm40 41c-6 1-12 0-17-3 0 0-1 0-2 1-6 9-19 8-28 3 0 0 0 0 0 0-1 0-1 0-2 0-5 5-15 8-21 3-6-4-8-12-15-13-5-1-13-3-13-10 0-5 6-9 10-12 8-5 17-8 26-10 0 0 0 0 0 0 0 0 0 0 0 0-6 3-12 6-18 9-4 2-11 6-13 10-4 9 11 12 17 11 1 6 3 12 9 14 7 3 13-2 18-6 8 10 24 8 30-4 7 6 18 7 26 3 0 0 1-1 2-1-3 3-6 4-9 5zm3-28c0 0 0 1-1 1-1 0-1 1 0 2 3 3 6 6 7 10 2 5-2 9-7 10-7 2-16 0-21-5-1-1-2 0-2 1 0 0 0 0 0 0-5 11-19 13-27 3 0 0-1-1-2 0 0 0 0 0 0 0-4 4-9 8-14 7-7-1-9-8-9-14 0-1-1-1-2-1 0 0 0 0-1 0-4 1-8 1-12-2-7-4 1-9 5-12 6-3 12-7 19-9-1 1-2 3-2 5 0 1 0 1 0 1 0 5 4 9 9 10 10 1 17-8 26-6 2 0 3-3 1-3-5-1-9 0-13 2-4 2-7 3-10 4-4 1-10-1-10-6 0 0 0-1 0-1 0-7 5-12 12-13 0 0 0-1 0-1 2 2 4 4 6 5-2 2-4 4-4 7 0 2 2 3 3 1 0-3 2-6 5-7 0 0 0 0 1 0 4 0 9-2 11-6 3 1 4 4 3 7-1 2 2 3 2 1 1-1 1-3 1-5 4 1 9 2 13 3 1 1 18 8 13 11zm23-27c-4 6-10 9-16 11 5-3 10-7 12-13 2-4 1-8-2-12-4-4-9-4-14-4 0 0 0 0 0 0-6-8-14-15-23-18-9-2-17 1-22 7-11-15-36-11-39 8 0 0 0 0 0 0-8-3-16 5-17 12-3-8 2-18 13-18 2 0 2-1 1-2 1-10 9-15 18-15 8-1 15 2 23 5 0 0 0 0 0 0 0 0 1 0 1 0 17-8 37-1 46 16 1 1 1 0 2 0 5 1 10 2 14 4 6 5 7 13 3 19zM574 167c4 2 8 5 10 9 4 6 1 15-8 11-1 0-2 2 0 3 6 2 12-1 13-8 0-8-7-14-13-17-2-1-3 2-2 2zM558 188c-2 3-5 5-8 5-2 1-1 3 0 3 4-1 8-3 10-6 1-1 0-3-2-2zM531 143c-1-1-3-1-4-1-2-1-3 2-1 2 2 1 3 1 5 1 1 1 2-2 0-2zM541 130c0 0 1 1 1 1 1-1 1-1 1-2-1-2-1-3-2-5 0-1-1-1-2-1 0 0-1 1 0 2 0 1 1 3 2 5zM563 131c0-2 1-4 2-5 1-2-2-3-2-1-2 1-2 3-3 5 0 2 3 3 3 1zM573 146c2-1 5-2 7-2 2-1 1-3-1-3-2 1-4 1-7 2-1 1-1 3 1 3zM343 2227c2-3 6-7 7-11 0-3-3-4-5-4-5 0-9 1-12 4-8-6-20-6-27 1 0 0 0 0 0 0 0 0-1 0-1 1-5 5-6 14-4 20-3 4-11 16-1 15 4 0 8-2 12-4 7 3 16 2 22-4 4-4 5-9 5-14 2-1 3-3 4-4zm-36-7c0-1 0-1 1-1 0 0 0 0 0 0 7-6 18-6 24 0 3 3 4 7 5 11-4 3-7 5-10 8-5 3-10 6-15 8-2 0-3-1-4-2-7-7-7-18-1-24zm-7 30c-1-1-1-2-2-3 0-1 1-2 1-3 1-1 2-2 3-3 1 2 2 3 4 4 1 1 2 2 3 3-3 1-7 3-9 2zm32-7c-4 5-10 6-16 5 5-3 10-7 15-10 2-1 4-3 6-5-1 4-2 8-5 10zm3-25c2-2 7-5 10-3 0 1 1 2 1 3 0 1-1 2-1 3-1 1-2 2-4 4 0 1-1 1-2 2-1-3-2-6-4-9zM711 2331c-2-6-8-4-12-2-3 1-6 1-8-2-1-1-1-2-2-3-1-2-3-3-5-2-1 0-2 0-3 1-3 2-3 3-6 2-4 0-5-3-8-5-5-1-10 2-11 6-1 1 2 2 2 0 2-5 7-4 11-1 1 1 2 3 4 3 4 2 6-2 10-3 5-2 5 6 9 7 5 2 14-5 16 0 1 1 3 0 3-1zM696 2344c-3-2-4-4-8-1-2 0-3 2-4 2-2 1-5 0-6-1-1-2-2-3-4-4-4-3-8 0-11 2-2 1 0 3 1 2 3-2 6-4 10-1 1 1 2 3 3 4 2 2 4 2 7 1 2-1 3-3 5-3 4-1 5 2 7 3 4 3 8-3 11-1 2 2 4 0 2-1-4-4-9 2-13-2zM1420 701c-1 3-2 6-4 8 0 2 2 3 3 2l4-9c0-1-2-3-3-1zM1362 702c-1-2-4 0-3 1 5 8 16 8 20-1 1-1-2-2-2-1-3 7-12 7-15 1zM609 2006c6-4 6-14 4-20 1 0 2-1 2-2 1-2-1-3-2-1-1 1-3 3-4 4 0 0 0 0-1 0-1-1-2-2-3-4 1 0 1-1 2-1 1-1-1-3-2-2-2 1-3 3-5 4-1 1 0 3 2 2 0 0 0-1 1-1 1 1 2 3 3 4-2 1-4 2-6 3-1 0-1 0-1 1-1 0-1 0-1 1 1 4 4 16 11 12zm1-6c0 1-1 2-1 2-2 2-4 1-6-1-1-2-2-4-2-7 1 0 1 0 2 0 0 1 1 2 3 3 2 0 4-1 5-2 0 2 0 4-1 5zm1-11c0 1 1 2 1 3 0 0-1 0-1 0-1 1-2 2-3 2-1 0-3 0-3-1 2-1 4-2 6-4zM592 2042c9-1 8 9 15 12 4 2 8 0 11-3 5-9-2-27-13-27-2 0-2 3 0 3 7 0 10 8 12 13 0 4 0 8-3 11-3 3-7 1-10-3-3-5-6-9-13-8-2 0-1 2 1 2zM581 2072c0 0 0 0 1 0 17 8 38 6 56-1 4-1 9-3 13-6 2-1 5-2 7-4 3-6 1-14-5-17-1 0-1 0-1 0-3 0-5-1-7 0-4-9-8-18-12-27 9-5 23-18 13-29-4-4-9-5-14-2-1 2-2 3-3 5 0-4-1-8-3-12-4-8-13-12-17-20 3 1 7 1 10-3 6-8-1-20-7-25-5-6-18-17-24-8-3 5-2 11-1 16 1 7 2 14 4 21-5 2-9 4-14 7-4-12-22-62-37-45-8 8-5 23-1 32 4 12 14 19 21 29 2 6 3 14 5 21 2 7 5 14 7 21 3 10 6 20 7 30 0 0 0 0 0 0-8 4-6 15 2 17zm70-25c1 0 1 0 1 0 5 2 6 9 3 12-1 2-2 2-4 3-1-5-3-10-5-16 2 0 3 0 5 1zm-83-42c-3-8-3-16-6-24 0 0 0 0 0 0-6-7-13-13-18-21-5-9-9-23-5-32 2-3 3-5 6-6 4-1 7 1 9 4 3 4 6 9 8 13 5 10 10 20 13 30 0 1-1 1-1 1-1 1 0 3 2 2 5-4 10-8 17-10 1 0 1-1 1-2 0 0 0 0 0-1-3-8-5-16-5-24-1-7 0-16 10-11 3 1 6 4 9 6 5 5 10 11 10 19 0 6-5 9-10 8-4-2-8-5-11-8-1-1-3 1-2 2 3 2 6 5 10 7 2 6 6 10 11 14 7 5 11 13 10 21-1 4-2 7-4 10 0 0 0 1 0 1-1 0-1 0-1 1-8 11-26 14-39 8-2-1-3 2-1 2 14 7 34 4 43-10 5-5 8-23 18-17 6 4 5 12 1 17-3 5-7 8-12 10 0 1 0 1 0 2-1 0-1 1-1 2 7 14 14 29 19 44 0 0 0 0 0 0-7 4-15 7-22 9-15 4-31 4-45-3 1-14-2-29-7-43-2-7-5-14-7-21zm11 63c-4-2-4-7 0-10 0 3 0 7 0 10zM681 1934c7-13 11-32 2-45-7-11-21-17-33-15-14 2-25 13-30 26-7 17-2 37 9 51 0 1 1 1 1 1 0 0 0 0 0 0 0 5 0 11 1 16 0 1 1 2 2 1 4-2 7-5 10-9 0 0 0-1 0-1 17 0 30-11 38-25zm-38 23c-1 0-1 0-1 1-1 0-1 0-1 1-2 2-5 5-8 7 0-5 0-9 0-14-1-1-1-1-2-1 0 0 0-1 0-1-11-14-16-34-8-52 7-15 23-25 40-20 7 2 14 6 19 13 5 9 4 20 1 29-5 19-19 36-40 37zM662 1890c0 0 0 0 0 0 0 0 0-1 0-1 0-2 0-5-3-6-2-1-5 0-6 2-2 2-2 4-2 6-2-4-4-7-7-6-2 1-3 3-3 6 1 3 3 5 4 8 1 1 1 1 2 1-2 1-3 3-4 5-5 13-5 27-3 40 0 1 0 1 1 1 1 2 3 3 5 2 5-2 8-9 11-13 4-9 8-23 3-32 0 0-1 0-1-1 3-1 7 0 9-2 3-2 3-5 2-8-2-2-5-3-8-2zm-9 7c0-3 0-6 1-9 1-3 5-4 5 0 0 4-4 6-5 10 0 0 0 0 0 0 0 0 0 0 0 0-1 0-1 0-1 0 0 0 0 0 0 0 0 0 0 0 0-1 0 0 0 0 0 0zm-5 1c-1-1-1-3-2-4-1-1-4-4-2-6 3-2 6 8 6 10-1 1-2 1-2 1 0 0 0 0 0-1zm10 27c-1 3-3 7-4 10-1 2-3 4-4 5 0 1-6 8-7 5 0-1 0-1-1-1 0-2 0-5 0-7 1 0 2 0 4 0 1 0 1-3 0-3h-5c0-5 0-9 1-14 0-1 0-2 0-3 1-1 2-1 3 0 2 1 3-2 2-2-1-1-3-1-4-1 0-3 1-5 2-7 0-2 1-5 3-6 3-1 6 0 8 2 2 1 2 3 3 5 0 0 0 0-1 0l-4-1c-1 0-1 0-2 1 0 1 1 2 1 2l4 0c1 0 2 0 2-1 0 0 0 0 0 0 1 6 0 12-1 16zm10-28c-2 3-8 2-11 3 0 0-1 0-1-1 0 0 0 0 0 0 2-2 3-5 5-6 3-1 9-1 7 4zM652 1922c-1 0-2 0-3 0-1 0-1 1-1 1 0 1 0 2 1 2 1 0 2 0 3 0 1 0 1-1 1-1 0-1 0-2-1-2zM586 1987c-1-2 0-4 1-5 2-1 4 0 4 2 1 1 4 0 3-2-2-3-6-4-9-2-2 2-3 6-1 9 1 1 3-1 2-2zM604 1975c-1-1-1-3 0-3 1-1 3 0 4 1 0 1 3 0 2-2-1-2-5-3-7-2-3 2-3 5-2 8 1 1 4 0 3-2zM1025 2372c3-2 5-6 3-10-1-4-6-6-10-4 0 0 0 0 0 0 0 0 0 0 0 0-4 2-6 7-4 11 2 3 7 5 11 3zm-6-11c2-1 5-1 6 1 2 3 1 6-1 7s-6 1-7-1c-2-3 0-6 2-7zM1045 2374c2 0 4-3 3-5-1-3-3-5-6-4 0 0-1 0-1 0 0 0 0 0 0 0-2 1-3 4-2 7 1 2 3 3 6 2zm1-5c0 2-1 3-2 3-3 1-4-3-2-4 0 0 0-1 0-1 0 0 0 0 0 0 2 0 3 1 4 2zM1215 283c1-3-1-6-5-7 0 0 0 0 0 0-3 0-6 3-7 6 0 3 3 6 6 6 3 1 6-2 6-5zm-5-4c1 0 3 1 3 3 0 2-2 4-4 4-4 0-4-7 1-7zM1326 538c3 1 6-2 6-5 1-3-2-6-5-7 0 0 0 0 0 0-4 0-7 3-7 6 0 3 3 6 6 6zm0-9c2 0 4 2 4 3 0 2-2 4-4 4-4 0-4-7 0-7zM1320 130c-3 0-6 2-6 5 0 3 2 6 5 7 3 0 6-3 7-6 0-3-2-6-6-6 0 0 0 0 0 0zm3 6c0 1-2 3-4 3-4 0-4-7 1-7 1 1 3 2 3 4zM585 2507c3-1 6-2 9-4 2-1 4-2 7-1 2 0 2 1 4 3 4 3 9 2 13-1 4-4 7-9 8-14 0-6-3-11-7-15-4-4-9-9-15-9-7-1-12 3-17 7-5-2-7 1-8 5-1 1-1 3-1 4-1 3-3 4-5 5-2 1-4 3-5 5-4 10 8 16 17 15zm-12-17c2-1 4-2 5-3 3-3 3-14 8-12 0 0 0 0 0 0 0 1 1 1 2 0 5-4 11-8 18-6 6 2 10 7 13 11 5 6 5 13-1 19-2 3-6 6-10 5-2-1-3-4-5-5-4-2-7 1-10 2-6 3-13 5-19 1-5-3-5-9-1-12zM1340 1636c-3-6-9-13-16-7-2 2-13 13-6 15 0 1 1 1 1 1 3 1 8 2 11 1 3-1 6-5 9-7 1 0 1-1 0-2 1 0 2 0 1-1zm-3 1c-2 2-4 5-6 6-4 1-7 0-11 0 0-1 0-1 0-1-3-1 1-6 2-7 2-2 3-4 5-5 5-2 9 3 11 7 0 0-1 0-1 0zM1315 1651c0 0 1 0 1 0 1 1 1 0 1 0 1-1 0-2-1-3 0 0-1 0-1 1-1 0-1 1 0 2zM1309 1641v1c0 2 3 2 3 0v-1c0-1-3-1-3 0zM1348 1631v0c0 2 3 2 3 0v0c0-2-3-2-3 0zM1331 1650l0 1c-1 1 0 3 2 1 0 0 0 0 0 0 1-1-1-3-2-2zM1345 1596c0-4-4-7-8-7-1 0-1 0-1 0 0 0 0 0 0 0-4 1-6 5-6 9 1 4 4 6 8 5 4 0 7-3 7-7zm-7 5c-6 0-6-8-1-9 0 0 0 0 0 0 3-1 5 2 5 4 1 3-2 5-4 5zM215 2194c0 0 1 0 2 1 0 0 0 0 1 0 7 5 18 7 26 2 7-5 10-15 9-23 0-1 0-1 0-1 0-1 0-1 0-2 1 0 1 0 0-1-17-29-36-58-55-86 0 0 0 0 0 0 0 0 0 0 0 0-1-1-2-1-3 0 0 0-1 0-2 0 0 0 0-1 0-1-2-2-3-4-5-6 0 0-1 0-1 0 0-1-1-1-1-1-1 0-2 1-3 1 0 0 0 0 0 0-4-6-14-5-17-11 0-1-1-1-1-1-1 0-1 0-1 0 0 0 0 0 0 0 0 0 0-1 0-1-2-1-2-3-4-4-1-1-3-1-4-1-3 3 0 8 2 11-1 0-1 1 0 1 0 1 0 1 0 1 2 5 1 9 1 14-1 2 0 4 2 6 0 0 0 0 0 0-1 1-2 3-3 4-1 1-1 2 0 2 0 0 0 0 0 1l4 7c0 0 0 0 0 0 0 2-1 3-1 5 0 1 0 1 1 1 0 1 0 1 0 1 18 25 35 52 50 79 1 1 1 1 1 1 1 0 1 1 2 1zm28 1c-6 3-14 2-21 0 12-1 22-7 28-17 0 7-2 13-7 17zm-83-127c-1 0-1 0 0 0-1 0-1 0-1-1 0 0 0 1 0 1 0 0 0 0 1 0 0 0 0 0 0 0zm2-1c0 0 0 0 0-1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0 1 0 0 0 0 0 0zm0 11c0-2-1-5-2-7 2-1 3-2 4-3 4 6 12 5 16 9 0 1 0 1 0 1-7 3-12 7-17 12-3-2 0-8-1-12zm-2 19c0 0 0 0 0 0 6-9 15-15 26-18 0 0 0 0 0 0 1 2 3 3 4 5-11 2-21 9-26 20l-4-7zm4 14c4-14 17-25 32-25 11 16 22 32 33 49 0 0-1 0-1 1-6 13-19 21-33 21-10-16-20-31-31-46 0 0 0 0 0 0zm32 48c15 0 28-8 34-22 7 12 14 23 21 34 0 1 0 1 0 1-1 1-1 1-1 1-6 13-20 21-35 19 0 0 0 0 0 0 0-1 0-1 0-1-6-11-12-21-19-32zM1107 2292c5 3 11 3 17 3 6-1 12-4 17-8 5-5 7-11 9-17 1-2 2-5 4-7 0 2 2 5 3 7 6 8 19 14 25 4 7-10-2-22-12-23-7-1-11 2-15 5-1-9 1-19 4-28 0 0 0 0 0 0 4-18-4-36-17-48-7-7-15-12-23-17-8-5-16-9-25-8-10 1-17 8-27 10-10 2-21-4-25-13-5-10-3-21 3-29 5-8 14-12 22-18 4-3 7-7 9-11 3-1 5-1 7-2 18-5 35-15 47-29 13-16 21-37 17-57-3-18-14-33-31-41 0 0 0-1-1-1-10-1-18 2-26 7 0 0 0 0 0 0-1-1-2-2-2-3 4-3 8-5 13-6 1-1 1-3-1-3-28 10-50 33-69 55-22 25-43 51-62 79 0 0 0 0 0 0-12 16-22 32-33 47 0 0 0 0 0 0-1 0-1 2-1 2 2 2 4 5 6 7 1 1 1 0 2 0 0 1 1 2 2 1 12-16 22-32 33-48 1 4 4 8 8 10 0 2-1 4-1 6-1 0-3-1-4-1-2-1-2 2-1 2 2 1 4 2 6 2 2 1 2-1 1-2 1-2 1-4 2-6 1 1 3 1 5 1 7-1 14-8 14-15 0-7-5-14-12-16 0 0 0 0 0 0 0 0 0 0 0-1 0 0 0 0 0-1 10-21 23-41 39-59 0 0 0 0 0 0 3-3 6-6 8-9 5-5 10-10 16-15 0 1 1 0 1-1 5-4 10-8 15-12 11-8 24-19 40-19 0 1 0 1 0 1 15 7 26 21 30 36 4 18-1 36-10 50-10 15-25 26-41 33-5 2-11 4-16 5 1-2 1-4 1-5 0-8-4-15-11-19-6-4-13-4-20 0-5 3-9 9-8 16 4 15 20 14 34 12-6 11-23 15-30 26-8 11-9 26-1 37 9 11 22 13 34 7 10-5 18-10 29-6 10 3 19 10 27 16 17 13 30 33 23 54 0 1 0 1 0 1-2 10-4 20-2 29-3 4-5 8-6 13-3 8-8 14-15 18-4 1-8 2-12 2-2 0-4 0-6 0-1-1-1-1-2-1 0 0 0 0-1 0 1-2 2-3 1-5-1-2-4-2-5-2 0 0-1 0-1 0-4-2-8-4-12-6 0 0 0 0-1 0 0 0-1 0-2 1-1 2-4 3-6 1-2-3 0-6 3-6 2 0 2-3 0-3-5 1-8 6-5 10 3 4 8 3 10 0 4 1 8 3 11 5-1 2 1 5 3 6zm-96-244c-1-1-3-2-4-3 7-9 14-17 22-26 1 1 1 2 2 2-7 9-14 18-20 27zm-19 33c0 1 0 1 0 2 0 0 0 0 1 0-3 0-5 0-7 1 3-4 5-7 8-11 2-5 6-10 3-15 3-3 5-7 8-11 2 1 3 2 5 3-7 10-13 21-18 31zm-22 27c-3 5-6 9-9 14-6 8-12 16-17 24-1 0-1 1-1 1-1 0-1 1-1 1 0 0 0-1 0-1l-5-6c0 0 0 0 0 0 12-15 21-31 33-46 0 0 0 0 0 0 8-12 16-23 25-34 2 5-5 13-8 17-2 3-4 7-6 10-2 1-3 3-4 5 0 0 0 1 0 1 0 0 0 0 0 1 0 0 0 1-1 2 0 1 1 1 1 1 0 0 0 0 0 1-1-2-3-4-4-5-1-1-3 0-2 2 1 1 4 3 3 5 0 2-3 5-4 7zm34-9c0 6-5 12-12 12-1 0-2 0-4 0 2-5 3-9 4-13 0-2-2-3-3-1-1 4-2 8-3 13-4-2-7-6-7-11 0 0 0-1-1-1 1 0 1 0 1-1 0-1 1-2 1-3 1-1 2-3 3-4 2-3 5-4 9-4 6 0 12 6 12 13zm39-90c-4 3-7 7-10 10-1 0-1-1-2-2 7-8 14-16 22-23 1 1 2 2 2 3-4 4-8 8-12 12zm15-14c-1-1-2-2-3-3 9-9 18-17 29-23 1 1 2 2 2 3 0 0 1 0 1 0-4 3-8 6-12 9-6 4-12 9-17 14zm10 98c-9 1-23 1-26-10-3-10 8-17 16-16 11 1 19 11 17 21 0 2 0 3-1 4-2 0-4 0-6 1zm100 161c5 0 10 3 13 7 2 5 0 13-6 15-10 3-17-8-19-16 3-4 7-7 12-6zm-59 33c1 1 0 2 0 2 0 0 0 0 0 0-2-1-3-2-1-2 0 0 0 0 0 0 1 0 1 0 1 0zM429 779c-3 5-6 10-11 13-1 1 1 3 2 2 5-4 9-9 11-15 1-1-2-2-2 0zM451 792c-4 5-7 10-8 17-1 1 2 2 2 0 1-5 4-11 8-15 1-1-1-3-2-2zM440 786c-3 5-6 10-9 15 0 2 2 3 3 2l8-16c1-2-1-3-2-1zM1338 957c-3 4-2 9 1 12 0 0 1 0 1 0-4 0-8 1-12 2-3-2-6-3-10-3 0 0 0 0 0 0-3-8-8-15-16-18 0 0 0 0 0 0 0 0 0 0 0 0-2 0-3-1-5-1-6-1-13 0-19 2 0-5-3-11-8-14 12-4 29-2 34-15 2-9-8-18-15-11-4 4-6 6-12 6-4 0-7 0-11-1-6-1-12-2-17 1-4 2-7 6-6 11 0 1 1 3 1 4 0 4-5 3-8 3-4 1-8 2-12 2 0-20-40-16-36-37 2-14 18-17 29-17 6 1 12 2 18 3 4 1 9 1 12-2 5-5 4-12-2-14-12-3-24-4-36-3-17 2-37 12-40 31-1 9 1 19 7 25 9 8 30 10 30 25 0 0 0 1 0 1-5 4-7 9-8 16-15 9-15 28-10 43 5 15 15 27 28 36 0 0 0 0 0 0 3 2 7 4 11 3 0 1 0 1 0 1 16 13 35 22 56 26 2 6 0 12 2 18 1 5 4 9 7 13 7 6 18 8 27 4 5-2 8-6 12-10 2-2 4-4 7-6 4-2 7-2 11-3 8-2 13-8 9-16 3 1 5 1 8 0 7-2 13-5 19-8 1 0 1 0 1 0 5 2 11 2 16 1 4-1 10-3 12-6 5-8-8-14-14-17 1-2 2-4 3-6 1-2 1-3 1-5 1-3-3-3 3-7 1-1 1-1 2-1 4-3 2-8-2-8 3-4 7-8 3-10-1-1-2-1-3-1 2-2 3-3 4-5 1-3 3-7 1-10-1-3-7-2-10-2-4 0-9 2-13 4-5 1-9 0-14-1-4-2-7-4-11-5-1 0-2 0-3 0 6-4 10-9 12-14 2-3 2-8 1-11-1-2-3-4-5-5-5-4-11-6-17-6-5 0-11 1-14 6zm-13 15c-2 1-4 2-6 3 0 0 0-1 0-2 0-1 0-1-1-2 3 0 5 1 7 1zm-43-19c0-1 1-1 1-1 0 0 0 0 0 0 6-1 12-1 18 1 0 0 0 0 0 0 3 1 6 2 8 4 4 5 6 11 7 17 0 0 0 0 0 0 1 7-1 13-4 19 0 0 0 0 0 0-1 0-1 0-1 1 0 0-1 0-1 1-4 5-10 9-18 9-9 1-18-3-23-10 1 0 3 0 4-1 2 0 1-3-1-2-1 0-3 0-5 0-2-3-3-7-3-11-1-13 7-24 18-27zm-18 38c-1 0-2-1-3-1-3-3-1-6 0-9 0 0 0 0 0 0 0 1 0 1 0 1 0 1 0 1 1 2 0 0 0 0 0 0 0 2 1 5 2 7zm-47 51c0-1 0-1 0-1-12-7-20-18-25-31-6-15-7-34 8-44 1 0 1-1 1-1 0-7 3-11 8-15 0-1 0-2-1-2 0-8-6-14-12-18-10-5-20-8-24-19-7-21 14-37 33-41 11-2 23-2 34 1 3 1 8 2 9 5 1 3-3 6-6 7-6 2-13-1-19-2-9-1-19-2-27 3-5 4-10 10-11 16-2 23 38 17 37 39-1 1 1 2 2 1 3-1 7-1 10-2 3 0 7 0 10-1 3-1 3-4 2-7-3-8 4-13 12-13 6 0 12 3 18 3 4 0 8-1 11-4 3-2 5-6 9-5 4 1 6 6 5 10-4 13-24 10-34 15-1 0-1 2 0 2 5 3 8 7 8 13 0 1 0 1 1 1-4 3-8 6-10 10-1 0-1 1-1 1-7-6-15-10-23-12-2-1-3 2-1 3 8 2 16 6 22 11 0 0 0 0 1 0-2 4-3 8-3 11 0 0 0 0 0 0 0 0 0 0 0 1-3 4-6 9-3 14 2 2 5 3 7 3 1 1 1 2 2 2 8 10 22 14 34 9 2-1 4-2 6-3 0 0 0 0 0 0 1 0 1-1 1-1 1-1 1-1 1-1 0 0 1 0 1-1 1-1 2-2 3-3 4 1 8 1 12 2 1 0 1-3 0-3-4 0-7-1-11-1 3-5 5-10 5-16 3-1 6-3 9-4 5 3 8 8 8 14 0 8-5 15-12 18 0 0 0 0-1 0-9 2-10 12-9 19 1 3 1 6 1 9 0 0-1-1-2-1-1 0-1 0-1-1 1-2 1-5 0-7-1-7-11 0-14 2-1 1-1 2 0 2-1 0-2 1-3 1-5 1-7 5-7 9 0 2 1 3 1 4-1-1-3-1-5-2-5-4-7-11-13-15-9-5-19-3-26 3 0-3-1-7-3-10 6 1 12 1 16-3 5-4 6-10 3-15-4-6-12-7-18-5-8-1-14-4-20-10-5-4-9-10-16-12-3-1-10-1-11 4-1 2 0 4 0 5 0 0 0 1 0 1 3 7 4 14 4 21 0 1 3 1 3 0-1-6-1-12-3-18 1 0 1 0 2 1 1 0 2-2 0-3-5-2-5-9 1-9 4 0 7 3 10 5 3 3 7 6 10 9 6 5 13 9 21 8 0 0 1 0 1 0 6-1 13 0 15 7 2 8-6 11-13 11-3 0-6 0-9-1-1-1-1-1-2-1 0 0 0 0 0 0-6-3-10-7-14-11-1-2-3 0-2 1 3 5 9 9 15 13 8 4 10 15 4 22-5 7-15 7-22 3zm87-9c1 0 3 1 4 1 0 0-1 1-1 1 0 0 0 0 0 1-1 1-2 2-3 3-1-1-2 0-2 1-3 2-6 4-10 3 0-1-1-2-1-3-1-8 8-9 13-7zm-4-4c2-2 11-8 10 0 0 1-1 2-1 2-3-1-6-2-9-2zm2 15c1-1 2-1 2-2 3 2 5 5 5 8-2 1-5 2-8 1 0 0 0-1-1-1-1-1-2-1-4-2 0 0 0-1 0-1 0 0-1 0-1-1 0 0 0 0 0 0 2 0 5-1 7-2zm4-4c2-1 3-3 4-5 2 1 4 2 6 2-1 3-1 6-2 8-1 1-2 2-2 3-1-3-3-6-6-8zm-20 4c-5 0-9 1-12 4 0-4-4-7-8-8-7 0-21 10-24 0 0 0 0 0 0 0 1-2 2-4 2-6 1 0 1 0 1 0 0 0 0 0 0 0 1-1 1-1 1-2 0 0 0 0 0 0 1 0 1 0 1-1 0 0 0 0 1 0 0 0 0-1 0-1 1 0 1 0 1 0 3-3 8-4 13-4 0 0 0 0 1 0 0 0 0 0 0 0 0 0 1 0 1 0 7 2 10 8 14 13 2 2 5 4 8 5zm-56 3c4-1 7-2 10-5 2 3 5 5 9 5 4 0 7-2 10-3 4-1 13-3 13 5 0 0 0 1 1 1-1 1-1 2-2 3-2 8 5 14 12 18-20-4-38-12-53-24zm107 44c-8 4-12 13-20 16-10 4-21 0-27-9-5-8-2-16-4-24 1 0 3 1 4 1 0 0 1 0 1 0 18 7 40 3 55-11 0 0 0 0 0 0 2 3 4 5 6 7 1 0 2 1 2 1 0 0 1 0 1 1 9 13-10 14-18 18zm6-135c6-4 15-3 21 1 0 0 0 0 1 0 2 2 6 3 7 6 0 0 0 0 0 0 0 1 0 1 0 1 0 2 0 4-1 6 0 1 0 1 0 1 0 0 0 0 0 0 0 1-1 2-1 2 0 1 0 1-1 1-3 5-8 10-13 13-1 0-1 0-1 0 0 0 0 1-1 1-1 0-3 1-4 2 0 0 0 0 0 0-1 0-1 1-2 1-1 0-1 1-1 1-6 5-10 12-12 20 0 0 0 0 0 1 0 0 0 1 0 1-1 0-1 0-1 1-1 4-3 8-5 12 0 1 2 2 3 1 0-2 1-4 2-6 0 5 1 9 4 13 0 1 3 0 2-2-5-8-4-16 0-25 0 0 0-1 0-1 3-7 8-13 15-16 0-1 1-1 1-1 2-1 3-1 5-1 4 1 7 3 11 4 6 2 12 3 18 2 0 0 0 0 0 0 3-2 6-3 9-3 2-1 7-2 9-1 3 2 1 7 0 9-2 3-4 6-6 8-1 0-1 0-1 0-1 1-2 3-3 4-1 2 1 3 2 1 1-1 2-2 3-3 1 0 2-1 3-1 2 0 3 0 2 1 0 2-4 6-5 7 0 1 1 3 2 2 2 3 2 4 0 4l0 0c-1 1-2 1-3 2-1 1-1 3-1 5 1 7-3 12-7 18-1 2 1 3 2 2 1-1 2-2 2-3 3 1 6 2 9 4 1 1 4 3 4 4 3 4 0 5-3 7-6 3-13 4-20 2 0-1-1-2-2-2-5 3-10 5-15 7-4 1-7 4-11 3-3-1-6-3-8-5-7-7-11-17-11-27 0-2-2-2-2 0-1 7 1 15 5 21 0 0 0 1 0 1 0 0 0 0-1 1 0 0 0 0 0 0-12 10-29 15-45 11-7-1-15-5-21-10-4-5-5-11 0-15 5-3 11-2 15-1 1 0 2 1 3 2 3 4 9 5 14 3 0 2-1 3-3 5-6 5-15 4-22 3-2 0-2 3 0 3 9 1 20 2 26-6 1-3 2-5 2-7 2-1 3-3 4-4 1-3 2-5 2-8 2 1 4 3 5 5 1 2 3 1 2-1-1-3-4-5-7-7 0-2 0-3 0-5-1-6-4-18 3-22 0 1 0 1 1 0 10-2 18-11 17-22-1-6-4-11-8-14 4-1 8-1 12-1 1 0 1 0 1 0 4 1 9 1 14 1 1-1 1-3 0-3-4 0-9 1-13-1-6-1-9-9-2-13zM1364 1002c1 0 1 0 1 0 3 2 8 2 11 0 1-1 1-3-1-3-3 0-7 0-11 0-1 0-1 3 0 3zM1366 1027c0 0-1 1-1 1 0 1 0 2 1 2 1 0 1 0 2 0 3 2 6 2 9 1 1-1 1-2 0-3 0 0 0-1-1-1-3 0-6 0-10 0zM1387 1034l3-4c1-2-2-3-2-2-1 2-2 3-3 5s1 2 2 1zM1380 998c0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0 1 0 0 0-1 0-1 0 0 0 0 0 0 0 0 2 3 2 3 0 0-1 0-1-1-2s-2 0-3 0c0 0-1 1 0 2 0 0 1 1 1 0zM1380 998c0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0zM1328 1042c6 4 10 11 3 17-6 5-14 4-21 3-2 0-2 3 0 3 9 1 19 2 25-6 6-7 2-14-5-19-1-1-3 1-2 2zM1347 1023c-2-6 3-12 9-11 0 0 0 0 0 0 1 0 1 0 1 0 0 0 0 0 0 1 0 0 0 1 0 1 1 0 1 1 1 1 1 1 2 1 3 0 2-1 1-5 1-7-1-1-2-1-2-1-2 1-2 2-3 3-3 0-10-2-6-6 1-2-1-3-2-2-2 2-2 4-1 6 1 1 1 2 2 3-5 2-7 7-6 13 1 2 4 1 3-1zm13-12c0 0 0 0 0 0 0 0 0 0 0 0-1 0-1 0-1 0 0 0 0 0 1 0zM1301 786c-16 0-33 1-49 5 0 0 0 0 0 0-2 1-1 2 0 3 3 2 6 4 9 7-1 0-1 0-1 0 0 5 0 10 0 15-1 1 0 1 1 1 0 1 0 1 1 1 7-1 14-2 21-3 0 0 0 0 0 0l11 6c1 1 3 0 2-1 0-1 0-1 0-1 0 0 0 0 0 0 3-9 4-19 6-28 0 0 0-1-1-1 0 0 0 0 0 0 1 0 1-1 1-1 1-1 1-3-1-3zm-29 21c0 0 0 0 0 0-3 2-6 4-10 7 1-4 1-9 1-13 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 10-2 20-5 29-8-7 4-13 9-20 14zm-9-9c-1 0-1 0-1 1-2-2-4-4-7-6 14-3 28-4 41-4-11 3-22 7-33 9zm3 17c1-1 2-2 3-3 4-2 5-2 9 0l1 1c-4 1-9 1-13 2zm28 3c-6-3-12-7-18-10 7-6 15-11 23-16-1 9-3 18-5 26zM89 659c0 0 0 0 0 0-1 2-1 3-1 5 1 3 5 4 8 4 0 0 0 0 0 0 3 3 7 6 11 7 1 1 1 1 1 1 10 1 17-4 20-13 4-10 0-16-8-22 0 0 0 0 0 0-1-2-2-4-3-6-1-2-3-4-6-3-1 0-2 0-2 1 0 0-1 0-1-1 0 0-1 0-2 0-22-19-45-39-68-58-1 0-1 0-1 0-11-5-21-7-33-7-1 0-1 1-1 2 3 10 7 20 12 29-1 0-1 1 0 2 0 0 0 0 1 0 0 0 0 0 0 0 23 20 47 40 71 60 1 0 2 0 2-1zm31-14c2 1 4 3 6 5 2 4 1 8 0 12-3 7-9 12-17 11 0 0 0 0 0 0-3-1-6-2-9-5 7-1 13-5 17-10 2-4 3-9 3-13zm-5-8c0 1 1 1 1 2 0 1 1 3 1 5 0 4-1 9-3 12-2 4-5 6-8 8-2 1-4 1-6 1-1 0-2 1-3 1 0-1-1-1-1-1-2 0-4-1-4-4 0 0 0-1 0-1 6 2 12 0 16-5 5-5 6-13 2-19 3-1 4-1 5 1zm-75-58c22 19 45 39 68 58 0 0 0 0 0 0 0 0 0 0 0 0 2 5 3 10 0 14-26-18-51-39-75-62 5-1 7-5 7-10zm-28-7c0 0 1 0 1 0 0 0 0 0 1 0-1 0-1 1-2 1 0 0 0 0 0 0 0-1 0-1 0-1 0 0 0 0 0 0 0 0 0 0 0 0zm3 2c0 1-1 1-1 2 0 0 0 0 0 0 0 0 0-1 0-1 0 0 1-1 1-1zm-5 1c0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0zm7 23c-3-6-5-12-8-19 5 2 10-3 9-8 0 0 0 0 0 0 6 1 12 3 18 5 0 0 0 0 0 0 3 5 0 11-5 11-1 0-1 0-1 0-1 0-1 1-1 1 0 4-1 6-4 8 0 0 0 0 0 0-2 2-5 3-8 2zm69 57c-22-18-44-36-65-54 2 0 4-1 6-3 0 0 0 0 0 0 2-2 4-4 4-7 24 23 49 44 76 63-5 5-14 5-20 1 0 0-1 0-1 0zM730 564c1-3 0-9-3-10-2-1-3-1-4 0-1 1-1 2-2 2 0 2-1 3-3 4-4 2-8 3-7 9 0 0 0 0 0 0 0 0 0 0 0 0 2 6 4 11 6 17-3 1-5 3-6 6 0 4 2 7 5 8 8 2 14-5 11-12 0 0 0 0 0 0-2-6-3-11-6-17 4-1 7-3 9-7zm-2-1c-1 3-5 5-8 5-1 0-1 1-2 1 0 1 0 1 0 1 3 6 5 12 6 18 0 0 0 1 0 1 0 0 0 0 0 0 0 0 0 1 1 1 1 4-2 8-7 8-2-1-4-2-4-5 0-2 1-5 4-5 1 0 1 0 1-1 0 0 1-1 0-1-1-6-3-12-5-18 0 0 0 0 0 0 0 0 0 0 0 0-1-4 3-5 6-6 2-1 2-3 4-4 0-1 0-1 0-1 1-1 2 0 3 1 1 1 1 3 1 5zM764 575c3-4 3-11 0-14-2-1-3-1-5 0-1 0-1 1-2 2-1 2-3 3-5 3-5 1-10 2-10 8 0 0 0 0 0 0 0 1 0 1 0 1 1 7 1 14 2 21-4 0-7 3-8 6-2 4 0 8 4 10 7 5 16-2 14-11 0-7 0-15-1-22 4 1 9-1 11-4zm-12 2c-1-1-1 0-2 0 0 0 0 1 0 1 1 8 1 15 2 22 0 1-1 1 0 1 0 0 0 1 0 1 0 0 0 0 0 0 1 5-3 10-9 8-2 0-5-2-5-5 0-3 3-7 6-6 1 0 2-1 2-1 0 0 0-1 0-1 0-7-1-15-1-22 0 0 0 0 0 0 0 0 0-1 0-1 0-5 5-4 8-5 2-1 4-2 6-4 4-5 5 5 3 8-2 3-6 4-10 4zM735 534c-1 4 1 7 5 8 9 3 16-5 13-13 0 0 0 0 0 0-2-7-5-14-7-22 0-7-7-11-14-11-8 1-20 5-21 14 0 0 0 1 0 1 2 6 4 13 7 20-4 1-6 4-7 7 0 5 2 8 6 9 8 3 16-5 12-13 0 0 0 0 0 0-2-7-4-15-7-22 4-2 8-4 13-5 2 6 4 13 6 19-4 1-6 4-6 8zm7-5c1 0 1-1 2-2 0 0 0 0 0-1-3-7-5-14-7-21 0-1-1-1-2-1 0 0 0 0 0 0-5 1-10 3-14 6-1 0-1 1-1 1 0 0-1 1 0 1 2 7 4 14 6 21 0 1 0 1 0 1 3 5-1 12-7 11-3 0-5-2-5-5 0-3 2-6 5-7 1 0 1 0 1-1 0 0 1-1 0-1-2-7-4-14-6-21 1-10 29-16 29-4 0 1 0 1 0 1 2 7 5 14 7 21-1 1-1 1 0 1 3 6-1 12-8 11-2 0-5-2-5-5 0-3 2-6 5-6zM307 1882c0 0 1 0 1 0 4 8 12 5 20 2 0 0 0 0 0 1 4 6 13 25 23 17 9-6-3-22-7-27 4-2 7-5 10-8 4-4 3-8 1-12 0 0 0 0 0-1-6-15-14-30-25-42-8-9-22-21-35-12-11 7-11 23-9 35 3 17 13 32 21 47zm41 3c1 4 5 10 3 14-6 10-18-11-21-16 0 0 0 0 0 0 3-2 5-3 7-5 2 0 3-1 5-2 2 3 4 6 6 9zm5-30c0 1 0 1 0 1 1 4 2 7-2 10-1 1-3 3-4 4-4 2-7 4-11 6-4 2-8 4-11 6-5 2-11 5-15-1 0 0 0 0 0 0-6-9-11-18-15-28 2 2 6 3 9 3 2-1 4-1 6-3 3-2 3-4 5-7 4-6 8-1 12 0 2 1 4 1 7 0 4-1 8-4 11-8 3 6 5 11 7 17 0 0 0 0 1 0zm-58-52c12-12 29 6 36 15 5 5 9 11 12 17 0 0 0 0 0 0-2 5-7 9-13 9-5 0-8-5-13-4-4 0-4 4-5 7-5 9-16 7-20-1 0 0 0 0 0 0-1-1-1-2-1-4-4-11-6-29 4-39zM268 2076c4 0 8-4 8-9 1-5-3-10-9-10 0 0-1 0-1 1 0 0 0 0-1 0-5 1-9 5-8 10 1 5 6 9 11 8zm-2-16c1 0 1 0 1-1 3 1 6 3 7 7 0 3-2 7-6 8-9 1-11-12-2-14zM244 1895c0 0-1 0-1 0-5 1-9 6-8 11 1 5 5 8 11 8 4 0 8-4 8-9 1-5-4-10-9-11-1 0-1 1-1 1zm7 9c1 3-2 7-5 7-9 2-11-12-2-13 0 0 1-1 1-1 3 1 6 3 6 7zM472 1685c6 3 16-2 20-6 6-4 8-12 4-18-1-1-2-1-3-1 0 0 0 0 0 0-8 0-16 3-21 9-3 5-6 13 0 16zm7-18c4-3 9-5 14-4 0 0 1 0 1 0 3 5 0 12-5 15-3 2-10 6-14 5-8-3-1-13 4-16zM500 1631c4-2 7-5 8-9 1-2-1-2-2-1 0-1 0-1-1-2-5 0-10 0-14 3-3 2-5 5-2 8 3 3 8 2 11 1zm-8-6c1-1 3-2 4-2 3-1 5-1 8-1 1 0 1 0 1 0-2 4-6 7-11 7-1 0-2 0-3-1l1-3zM889 1596c-1-1-3 0-2 1 1 2 2 4 3 6 1 1 3 0 2-2-1-1-2-3-3-5zM916 1599c-1-1-3 1-2 2 2 2 3 4 5 6 1 1 3-1 2-2-2-2-3-4-5-6zM920 1547l-5-3c-1-1-3 2-1 3l5 3c1 1 2-2 1-3zM894 1559c0-2-3-1-3 1 1 1 1 3 2 4 0 2 3 1 2 0 0-2-1-3-1-5zM949 1581c-1-1-2-2-4-2-1-1-3 1-1 2 1 1 3 2 4 2 2 1 3-1 1-2zM1034 1556c-1 1-2 3-4 5-1 1 1 3 2 2 2-2 3-4 4-6 1-1 0-3-2-1zM1078 1583l-6-1c-2-1-3 2-1 2l6 2c2 0 2-2 1-3zM1038 1563l-4 1c-1 0-1 3 1 3 1-1 2-1 4-1 1-1 1-3-1-3zM1010 1599l-3 1c-1 0-1 1-1 1 0 1 1 2 2 1l2 0c1 0 1-1 1-2 0 0-1-1-1-1zM1079 1535c-1 0-2 0-4-1-1 0-2 2 0 3 1 0 2 1 3 1 2 1 3-2 1-3zM862 1567c-1 0-2 1-2 2 0 1 0 2 0 3 0 0 1 1 1 1 1 0 2-1 2-1 0-1 0-2 0-3 0-1-1-2-1-2zM901 1561c0-1-1-1-2-1 0 0-1 1 0 2 0 0 0 1 1 1 0 1 1 1 1 1 1 0 1-1 1-2 0 0-1-1-1-1zM311 1762c1-5-2-12-9-11-6 1-7 10-8 15-1 8-1 16 4 23 1 2 3 0 2-1 2-5 5-9 7-14 1-4 3-8 4-12zm-12 23c-2-4-3-7-3-12 0-4 0-11 3-15 0-2 2-3 4-2 2-2 4-2 4 0 2 2 2 4 1 6 0 2-1 5-2 7-3 6-5 11-7 16zM311 1786c4 0 7-1 10-1 2-1 5-1 7-2 3-1 4-4 2-6-2-3-7-2-10-1-4 1-7 4-9 7 0 0 0 0 0 1-2 0-1 3 0 2zm8-7c1-1 2-1 4-1 1 0 2 0 2 0 2-1 2 1 2 3-1 0-3 0-4 1-1 0-3 0-4 0l-5 1c1-2 3-3 5-4zM1424 2513c-1-10-5-20-12-28-5-7-14-15-23-17-9-2-16 3-18 12-2 10 2 20 8 28 0 0 0 0 1 0 7 10 17 17 29 18-1 5-1 9 0 13 0 3 2 8 5 9 7 3 8-8 10-12 2-6 9-2 13-5 2-1 3-4 3-6-1-7-10-11-16-12zm11 15c-3 2-5 1-8 2-2 0-3 1-4 2-3 3-2 8-4 11-2 3-5 2-6-1-1-1-1-3-2-5 0-4 0-8 2-12 0 0-1-1-2-1-12-2-23-9-30-20-1 0-1 0-1 0-5-7-8-16-6-25 3-12 15-10 23-4 14 9 23 24 25 40 0 1 1 1 1 1 3 0 6 1 9 3 1 0 3 2 4 3 1 1 1 1 1 2 1 2 0 4-2 4zM1399 2485c-6 3-11 7-15 13-1 1 1 3 2 1 4-5 8-9 14-11 1-1 1-3-1-3zM1385 2481c1 0 1-1 1-1 0-1 0-1 0-1 1-1 1-2 0-2 0-1-1-1-1 0 0 0 0 0 0 0-1-1-2 0-2 0 0 1 0 1 0 2 0 1 1 1 2 2zm-1-2c0 0 0 0 0 0l0 0zM171 2255c1 1 2 1 3 2 2 1 4 2 6 3 3 1 6 3 10 2 5 0 7-5 6-9-1-7-9-12-14-16-7-5-14-11-22-16 5-3 9-7 11-12 2-4 4-9 0-12-4-3-9 0-12 2-6 3-11 7-16 11 0-15-19-22-31-13-11 8-10 29 4 33-5 3-11 8-15 13-3 3-4 7-1 11 9 11 23-6 32-9 5 9 9 18 14 27 3 7 7 17 15 19 6 1 10-3 10-9 1-8-5-17-7-25 0 0 0 0 0 0 2-3 4-4 7-2zm15 4c-1 0-1 0-2 0 0-3 6-4 8-6 0-1 1-1 1-2 0 1 0 2 1 2 0 5-4 8-8 6zm-16-53c0 2-1 4-3 5 0-1 0-3-2-4-1-1-2-1-4-2-1 0-4-2-2-3 0 0 1-1 1-1 0 0 1 0 1-1 1 0 2-1 3-1 4-1 7 3 6 7zm-54-8c11-7 25 1 24 14 0 0 0 0 0 0 0 5-1 11-6 13-4 3-9 2-13 3 0-1-1-1-2-1-16-1-15-23-3-29zm-10 57c-3-1-6-4-5-8 0-1 2-3 3-5 1 1 2 1 2 0 1-2 2 1 2 2 1 0 1 1 1 2 0 1 0 2 1 3 2 2 5 1 6 3 0 0 0 0 0 0-3 2-6 4-10 3zm27-13c0 0-1 0-1 0-5 2-9 6-13 9-2-2-3-2-5-3-3-1-2-4-3-6-1-1-2-2-3-3 4-3 7-6 12-9 0 0 0 1 0 1 6-1 12-1 17-4 4-3 5-8 6-13 3-3 8-8 13-11 0 0 0 1 0 1 0 1 1 3 2 3 1 1 3 1 4 1 3 1 3 4 2 6 0 1 0 1 0 1-2 2-4 4-7 5-1 0 0 1 0 2 0 0 0 0 1 1 4 3 9 6 14 10-4 2-9 0-13 2-3 2-3 6-4 9-2 5-8 4-11 8-2 2-2 4-3 6-2-5-5-10-7-15 0 0-1-1-1-1zm31 46c-2 1-5 0-7-2 0-1 0-1 0-1 0-2 3-3 4-3 2 0 4 0 5-1 1-1 2-1 3-2 0 4 0 8-5 9zm4-13c-1 5-6 3-10 5-1 0-2 1-3 3-1-1-1-2-1-2-4-6-7-12-10-18 0 0 0-1 0-1-1-3 0-6 2-8 2-3 4-3 7-4 3-1 4-2 5-5 0-3 0-5 2-7 2-1 5-1 7-1 3 0 5-1 7-2 2 1 4 3 6 4 3 3 7 5 10 8 0 0 0 0 0 1 0 0 0 0 0 0 2 3-5 5-6 6-2 1-2 2-3 4-2-2-5-3-8-4-2-2-5-4-8-3-3 1-5 4-4 7 0 0 0 0 1 0 1 6 4 11 6 17zM123 2222c5 1 10-2 11-7 1-2-2-3-2-1-1 4-4 6-8 5-2 0-2 2-1 3zM147 2239c3-1 5-4 5-8-1-3-5-5-9-4 0 0 0 0 0 0 0 0-1 0-1 0-3 1-5 5-3 9 1 3 5 4 8 3zm-4-10c1 0 1 0 1 0 0 0 0 0 0 0 2 0 4 1 5 3 0 2-1 5-3 5-5 1-7-5-3-8zM117 2217c0-1-2-3-1-4 1-2 3 0 4 1 1 1 3-1 2-2-2-2-5-4-8-1-2 2-1 5 1 7 1 1 3 0 2-1zM128 2208c0-1-1-4 0-4 1 0 3 1 3 2 1 2 3 0 2-2-1-2-4-4-7-2-2 1-1 5 0 7 0 2 3 0 2-1zM922 1992c18 0 29-19 21-34 18 6 38-5 41-25 8 5 18-1 17-11 0 0 1 0 1-1 6-13 0-28-13-34-13-6-27-1-36 9-12-14-34-14-49-3-14 11-21 32-8 47-12 11-10 29 4 37 0 1 0 1 0 1 1 0 1 1 2 1 0 1 0 1 0 2-5 0-9 3-9 8-1 5 2 9 6 12-3 4-7 8-11 11-1-1-2-2-3-3-6-5-11-10-16-14-4-2-8-3-12-2-6 2-9 7-13 11-4 5-8 11-12 16-27-25-52-52-75-81-3-4-8-14-15-12-4 1-3 7-1 10-10 12-16 27-15 43 1 17 9 32 20 44 13 15 28 29 43 42 8 6 15 11 23 17 8 6 16 12 25 16 1 1 3 1 4 2-3 3-2 8 2 11 3 2 6 4 9 6 2 1 6 4 9 4 5 1 8-5 11-9 3-6 5-13 4-20 0 0 0 0 0 0 5-4 9-7 13-11 0-1 0-1 0-1 4 0 6-4 5-7-2-3-5-5-7-6-1-1-2-2-2-2 4-5 8-10 12-16 3-4 8-9 8-15 1-4-1-8-3-11-1-1-2-2-3-2 4-4 7-8 10-12 1 0 1-1 1-1 9 0 15-8 12-17zm-180-10c2 1 4 1 6 1 36 42 77 78 123 109 0 0 0 0 0 0 0 0 0 0 1 1-4 2-8 4-12 5 0 0 0 0 0 0-52-28-96-67-131-113 0 0 0 0 0 0-1-7-1-13 0-19 3 3 6 6 9 9 0 2 1 5 4 7zm8-12c2 1 3 4 2 7-1 1-2 3-4 3 0 0 0 0 0 0-2 1-3 1-5 0-3-2-4-7-1-9 2-2 6-3 8-1zm87 126c-16-8-30-19-43-30-14-11-27-23-39-35-11-12-21-25-25-41 34 45 77 82 126 109-6 1-12 1-19-3zm28 21c-4 4-9 0-13-2-3-2-15-7-9-13 0 0 0 0 0-1 11 3 21 0 30-6 0 8-2 16-8 22zm9-26l-2-1c0 0 0 0 0 0-45-31-86-67-122-108 2-1 3-2 4-4 3-4 0-10-4-12-1 0-1 0-2 0-3 0-7 1-9 4 0 0 0 1-1 1-2-3-5-6-8-9 3-8 7-16 13-22 38 56 87 103 145 139-1 0-1 0-1 0 0 1 0 1 0 1-4 4-8 8-13 11zm15-18c1 1 2 2 1 4-58-36-109-84-146-141-1 0-1 0-1 0-1-2-3-5 1-6 2 0 4 2 5 4 3 3 5 6 8 9 5 7 11 14 17 21 12 13 24 27 37 40 12 12 25 25 39 36 6 6 13 12 20 18 4 3 7 6 11 8 1 2 3 3 5 5 1 0 2 1 3 2zm-31-31c-1 0-1 0-1 1-6-5-11-9-16-14 4-6 14-17 22-8 5 7-1 15-5 21zm44-4c-2 4-6 9-9 13-3 5-7 9-11 13-2-2-5-4-7-6-6-4-11-9-16-13 6-7 13-18 5-26-8-9-20 1-25 8-2-2-4-3-5-5 3-5 6-9 10-13 3-4 7-9 11-12 7-4 12 1 17 5 4 3 8 7 12 10 4 3 8 7 11 10 5 5 10 9 7 16zm-12-24c4-4 7-7 11-11 2 2 4 4 6 5-3 4-7 8-10 12-2-2-4-4-7-6zm19-8c-3-2-5-4-7-5 0-1 0-1-1-1-2-2-4-4-5-7-2-5 1-9 6-9 0 0 0 1 0 2 1 2 3 1 3-1-1-3-1-6 1-9 1-1 0-3-2-2 0 1-1 2-1 2-1 0-1 0-1 0 0 0-1-1-1-1-13-7-14-24-3-33 0 2 1 4 3 6 1 1 3 0 2-1-4-6-5-14-1-21 1-1-1-3-2-1-3 4-4 8-3 13-11-14-4-33 9-43 14-10 34-10 45 4-2 0-3 1-5 2-2 1 0 3 1 2 5-3 11-3 16-2 2 1 2-2 1-2-3-1-6-1-9-1 8-9 21-14 32-9 12 5 18 19 12 31 0 0 0 0 0 0-1 0-1 1-1 2 2 8-7 14-13 9 2-1 4-3 5-5 1-2-1-3-2-2-2 3-5 5-9 5-2 0-2 2-1 2 1 1 3 1 4 0-2 20-23 32-41 23 1-1 2-2 3-3 1-2-1-3-2-2-2 3-5 5-8 6-2 0-1 3 1 2 1 0 3 0 4-1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 10 15 0 33-18 33 1-1 1-2 1-2-1-2-3-2-3 0 0 1-1 3-2 4-1 2 1 3 2 2 0 0 0 0 1-1 2 8-3 15-11 14zM1012 1907c2 4 6 5 9 5 4-1 7-2 11-2 3 1 5 2 8 3 5 0 8-2 11-5 5-8 0-19-8-22-9-4-22-1-27 7-3 4-6 9-4 14zm6-12c0 0 0 0 0 0 4-6 14-10 21-8 8 2 15 12 9 20-6 7-12 0-19 0-3 1-7 3-10 2-9-2-4-10-1-14zM714 2294c1-2 1-4-1-5 0 0-1-1-1 0 0 0 0-1 0-1 0 0-1-1-2 0 0 0 0 0 0 0-1 0-1 0-1 0-2 1-3 3-3 5 1 2 2 3 4 3 2 1 4 0 4-2zm-4 0c-1 0-2-3 0-3 0 0 0 0 0-1 0 1 1 1 1 1 0 0 0 0 1 0 1 1 0 3-2 3zM320 1867c1 1 4 4 2 6-2 1-4-2-5-3-3-3-4-6-6-9-1-2-3 0-2 1 1 4 3 7 5 9 2 2 4 5 7 5 2 0 4-1 4-4 1-2-1-5-3-7-1-1-3 1-2 2zM339 1855c2 3 1 7-2 9-2 0 0 3 1 2 5-2 6-9 3-13-1-1-3 1-2 2zM216 1951c-10 2-20 7-27 15-3 5-6 9-8 14-2 3-2 6-3 9-1 3 0 7-2 9 0 0 0 0 0 0 0 0-1 0-1 0-7 2-15 6-14 15 1 3 4 5 7 5 3 1 6 0 8-2 0 1-1 3-1 4 0 3 0 7 3 9 3 2 6 0 9-1 2-2 4-4 6-7 0 3 1 5 3 7 2 2 5 3 8 1 6-4 2-17-1-23 0 0 0 0 0 0 4-6 8-13 16-14 9-1 10 6 16 9 9 5 16-5 20-13 0 0 0 0 0-1 0 0 0 0 0 0 0 0 0 0 0 0 1-1 1-1 0-1 2-21-18-37-39-35zm30 14c-1 0-1 0-1 1-1 1-1 2-1 3-1 2 2 2 2 1 1-1 1-2 1-3 4 5 6 12 6 20-3 6-9 16-17 12-5-3-7-8-12-9-11-3-19 7-23 15 0 0 0 1 0 1-1 0-1 1-1 1 3 5 4 10 4 15 0 1 0 3-1 4-1 0-3 1-4 1-1-1-2-1-2-2-2-2-2-5-2-8 1-2-2-2-2 0 0 0-1 0-1 0-1 3-2 4-4 6-1 1-4 4-6 4-1-1-3-1-4-2 0-1 0-2 0-3 0-1 0-2 0-4 1-2 2-5 4-7 1-1-1-3-2-2 0 1-1 2-2 3 0 0 0 0 0 0-2 1-4 3-7 4-4 0-7-1-7-5 0-6 7-9 12-10 0 0 0 0 0-1 1 1 1 0 2 0 3-3 2-7 3-11 1-6 3-11 6-15 0-1 0-1 1-2 0 1 0 1 0 1 8-1 15 3 18 10 1 1 3 0 3-2-4-7-11-11-20-11 6-7 14-13 23-15 2-1 3-1 4-1 5 5 7 10 7 17 0 1 3 1 3 0 0-7-2-12-6-17 10 0 19 4 26 11zM880 2331c0 0 0 0 0 0-3-1-5 0-6 3-1 2 0 4 2 5 2 2 5 1 6-1 1-2 1-5-1-6 0-1 0-1-1-1zm-2 6c-3-1-1-4 1-4 0 0 0 0 0 0 0 0 0 0 0 1 2 1 1 4-1 3zM1176 2075c2-1 4-2 4-5 1-2-1-5-3-5-1 0-1 0-2 0 0 0-1 0-1 0-2 1-4 3-3 5 0 3 2 5 5 5zm-1-7c0-1 0-1 0-1 1 0 1 0 1 0 3 1 2 5 0 5-1 0-2-1-3-2 0-1 1-2 2-2zM1319 2345c2 0 4-2 4-4 1-3-1-5-3-6-1 0-1 0-2 1 0-1-1-1-1-1-2 1-4 4-3 6 0 3 2 4 5 4zm-1-7c0 0 0 0 0 0 1 0 1 0 1 0 3 1 2 4 0 5-1 0-2-1-3-2 0-1 1-2 2-3zM1364 2630c-8 4-15 8-22 11-5 3-10 5-15 8 0 0 0 0 0 0-13-7-33-10-43 3-4 5-7 9-3 14 2 2 4 4 7 4 1-1 3-2 5-2 1-1 4-2 6-1-10 8-20 18-26 29 0 0-1-1-1-1-13-3-27-2-38 5-4 3-8 7-8 12 0 4 3 7 7 8-1 1-2 2-2 3-7 6-14 12-22 17-5 5-14 10-17 16-3 6 1 11 6 13 15 6 33 6 49 3 13-2 26-8 37-15 0 5-1 10-1 15-1 3-1 6 0 9 3 6 10 6 15 4 1-1 3-2 5-3 0 0 0 0 0 0 11-9 16-24 12-38 18-9 34-22 45-39 7 1 11 6 12 12 1 4 1 8 3 11 5 6 13 0 17-5 4-6 6-15 3-22-1-4-3-7-6-10-3-3-7-5-11-7 22-26 48-60 31-95 0 0 0 0 0 0-3-5-6-11-11-13-4-2-9-2-12 2-4 4-2 11-1 16 0 7-1 15-4 21-4 7-10 12-17 15zm-71 35c-2 0-3 1-4 1-1 0-2 0-3 0 2-1 4-2 6-3 1-1 0-3-2-3-2 1-4 3-7 4 0 0 0 0 0 0 0 0 0 0 0-1-2-2-1-4 0-6 1 0 1 0 1 0 2-1 3-1 5-1 1-1 1-3-1-3-1 0-1 1-2 1 0 0 0 0 0 0 9-12 26-10 38-4-8 5-15 10-23 15-2-1-6-1-8 0zm-59 52c-9-1-4-11 0-14 3-2 7-4 11-5 9-2 18-2 26 0 0 0 1 0 1 0-1 1-2 3-3 4-1 0-3 0-4-1-7-1-12 0-18 3-5 4-9 9-13 14 0 0 0 0 0-1zm153-115c1-3 1-6 1-9-1-4-2-9 0-12 2-5 9-4 13 0 3 2 4 6 6 10 0 0 0 0 1 0 15 35-12 68-33 92-1 1 1 2 2 2 5 5 12 7 15 14 3 6 3 13 0 19-1-1-1-2-2-2-1-2-3 0-2 2 1 1 2 2 2 3-1 1-1 2-2 2-1 2-4 5-7 4 0-1 1-2 1-4 0-2-2-2-3-1 0 2 0 3-1 5-1-1-2-3-3-5 0-4 0-7-2-11-2-4-6-7-11-8 1-1 1-2 2-2 1-2-2-3-3-2-12 19-28 33-48 43 0 0-1 1-1 2 4 11 1 24-8 33 1-1 1-2 1-3 1-2-2-3-2-1-1 2-1 4-2 7 0 0-1 0-1 0-2 1-4 2-6 3 0 0 0 0 0 0l2-8c0-1-2-2-3 0 0 2-1 4-2 7 0 0 0 1 1 1-4 0-7-2-7-8 0-6 1-12 2-19 0 0 0-1-1-1 4-2 7-5 10-8 1-1-1-3-2-2-18 17-42 26-66 26 12-2 24-7 34-15 0 0 0 0 0 0 2 1 3 1 5 2 1 0 1-3 0-3-3-1-6-2-8-4-1-1-3 1-2 2 1 1 1 1 2 2-13 9-29 15-45 15 0 0 0 0-1 0-6-1-17-2-18-9-1-3 0-6 3-8 0-1 1-1 1-2 0 1 0 1 0 2 0 0 0 1 1 1 1 0 2 0 2-1 0-1 0-2 0-3 0 0 0-1 0-1 3-2 6-4 9-7 10-8 21-15 28-27 5-6 13-12 21-12 7 0 15 3 20 9 1 1 3-1 1-2-2-3-6-5-9-7 12-25 37-42 61-54 13-7 27-12 39-20 9-7 14-16 15-27zM1275 2722c-10-4-21-1-26 9 0 1 2 3 3 1 4-8 13-12 21-8 2 1 3-1 2-2zM1262 2729c0 2 0 4 0 7 0 1 2 1 2 0 0-3 0-5 0-7 0-2-2-2-2 0zM1211 2758c-1 0-2 1-3 1-2 0-1 3 1 2 0 0 1 0 2 0 2-1 1-3 0-3zM1304 2700c-1 1 1 3 2 1 21-31 62-37 83-67 1-2-1-3-2-2-21 31-63 37-83 68zM1297 2687c14-14 30-25 47-35 2-1 0-3-1-3-17 10-33 22-48 36-1 1 0 3 2 2zM884 1941c3-2 4-5 2-8-2-3-6-4-9-2 0 0 0 0-1 0 0 0 0 0 0 0-2 3-3 6-1 9 2 3 6 4 9 1zm-1-7c2 2 1 4-1 5-4 3-7-3-4-6 0 0 0 0 0 0 0 0 0 0 0 0 2-1 4 0 5 1zM551 1860c0 0 0 0 0 0 0 0-1 1-1 1-2 3-2 7 0 10 3 3 7 4 10 1s4-7 2-10c-3-3-7-4-11-2zm8 10c-5 4-11-3-7-7 0 0 0-1 0-1 0 0 1 0 1 0 5-3 11 4 6 8zM471 2098c0 1 0 1 0 1-1 0-1 0-1 0-3 3-3 8 0 11 2 3 7 3 10 1s4-7 2-11c-3-3-8-4-11-2zm8 10c-5 4-11-2-7-7 0 0 0 0 0 0 0 0 0 0 0 0 5-4 11 3 7 7zM134 1962c3-3 4-7 1-11-2-3-7-4-10-1-1 0-1 0-1 0 0 0 0 0-1 1-2 2-2 7 0 10 3 3 7 3 11 1zm-2-2c-5 4-10-3-7-7 0-1 0-1 1-1 0 0 0 0 0 0 5-3 11 3 6 8zM357 1591c0 0 0 1-1 1 0 0 0 0 0 0-3 3-3 8 0 11 2 3 7 3 10 1s4-7 2-11c-3-3-8-4-11-2zm7 10c-4 4-10-2-6-7 0 0 0 0 0 0 0 0 0 0 0 0 5-4 11 3 6 7zM1303 2728c-2 0-4-1-5-2 0 0 0 0 0 0-2-4-4-7-7-9-2-1-4 1-2 2 5 4 8 10 7 17 0 1 3 1 3 0 0-2 0-4-1-6 2 0 3 0 5 0 1 0 1-2 0-2zM500 2713c0 0 0 0 0 1-4 6-8 14-10 22 0 3-2 6 0 9 2 2 5 1 8 0 5-2 11-3 17-4 4-1 9 0 12-2 6-3 6-11 5-16-1-1-1-1-1-1 11 2 21 2 32 1 15-2 29-6 42-13 0 4 3 7 6 7 6 1 13-4 17-6 5-3 12-6 15-11 4-5 1-12-1-17 0 0-1 0-1 0 6-7 10-13 14-21 5-8 9-18 6-28-2-8-8-15-16-17 0 0 0 0 0 0-10-6-21-10-32-12 0 0 0 0-1 0-38-8-80 4-108 34-3 3-5 7-8 10-4-4-9-6-15-4-3 2-5 6-8 9-3 4-7 7-12 11-3 2-11 7-5 10 7 4 16 6 24 7-1 5-1 9 1 14-5 3-10 6-14 9-2 1 0 3 1 2 5-3 9-6 14-9 4 7 11 12 18 15zm29 11c1 2 1 5 0 8-1 4-5 5-9 6-7 0-14 1-20 3-2 1-5 3-6 2-2 0-2-3-1-4 0-3 1-6 2-8 2-6 4-11 7-16 0-1 0-1 0-1 0 0 1 0 1 0 9 4 18 6 27 8-1 0-1 1-1 2zm113-33c-3 1-7 3-9 5-2 1 0 3 1 2 3-2 5-3 8-4 0 1 0 3-1 5-2 3-6 5-9 7s-7 3-10 5c-2 1-3 2-5 2-3 1-11 3-9-3 0-1 0-1 0-1 12-6 23-15 32-24 0 2 1 4 2 6zm17-53c1 9-3 18-8 26-1 3-3 6-5 9-1-25-11-48-29-65 9 3 18 6 26 11 1 0 1 0 1 0 0 0 0 0 0 0 9 2 14 10 15 19zm-111-26c21-8 43-9 64-5 20 17 31 43 31 69 0 0 0 0 0 0-7 9-16 17-25 24-23 16-50 23-78 21 0-1 0-1 0-1-30-12-45-44-36-75 0 0 0-1-1-1 12-14 28-25 45-32zm-84 64c-1-1-3-1-4-2-2 0-2-1-2-2-1-2 0-2 1-3 1-2 5-3 6-4 5-4 9-8 12-12 2-3 4-6 8-6 4 0 7 2 9 5-4 6-8 13-11 20 0 0 0 0 0 0-1 3-2 5-2 7-6 0-11-1-17-3zm18 13c0-5 2-10 3-15 0 0 0 0 0 0 3-8 7-15 12-22 0 0 0 0 0 0 1-1 2-3 3-4-7 29 7 58 33 72-5-1-11-2-16-4-10-3-20-6-28-13-2-2-4-4-5-6 3-3 7-5 10-7 2-1 0-3-1-3-3 3-7 5-10 7-1-1-1-3-1-5zM577 2689c0 0 0 0 0 0 0 0 0 0 0 0 1 0 1 0 1 0 12-12 29-31 17-48-4-6-11-10-18-9-7 1-12 7-13 14-14-11-35 0-32 18 5 21 27 24 45 25zm-37-40c7-7 17-6 24 0 0 1 2 1 2 0 1-7 6-15 14-14 8 0 14 7 15 14 4 15-9 27-19 37-13 0-30-1-38-14-4-8-5-17 2-23zM516 2666c2-1 4-1 7-2 1 0 1-3-1-2-2 0-5 0-7 1-2 0-1 3 1 3zM540 2688l-5 6c-1 1 1 3 2 2l5-6c2-1 0-3-2-2zM598 2631c2-2 4-4 6-6 1-1-1-3-2-2-2 2-4 4-6 6-1 2 1 3 2 2zM605 2666c3 0 6 1 9 1 2 1 3-2 1-2-3-1-6-1-9-2-2 0-3 3-1 3zM604 2646c1 0 1 1 2 0 1 0 2-1 3-1 1 0 1-1 0-2 0-1-1-1-1 0-1 0-2 0-3 1-1 0-1 1-1 2zM526 2678c1 0 2 0 3 0 1-1 1-3-1-3-1 0-2 0-3 1-1 0-1 3 1 2zM764 2783c2 0 2 0 3 2 0 1 1 2 2 2 1 2 3 3 5 3 2 1 3-2 1-2-2-1-4-2-6-4 0-1 0-2-1-3 0-1 1-2 1-3 1 0 1-1 1-1 0 0 1 0 1 1 1 1 3-1 2-2-2-2-4-3-7-3-2 0-2 3 0 3 1 0 1 0 2 0 0 0 0 0-1 0-1 1-1 2-1 4-1 0-1 0-1 0-2 0-4 1-6 0-1-1-2-3-2-4 0-2-3-1-2 1 0 4 4 7 9 6zM762 2760c3-2 7 0 6 3 0 2 3 3 3 1 0-3-1-6-4-7-3-1-8 0-7 3 0 2 2 1 2 0zM781 2771c3-2 8 0 8 4 0 2 2 2 2 0 0-6-6-10-11-6-2 0 0 3 1 2zM945 2918c-3-2-6 1-9 1-6-1-6-6-10-9-2-1-5-1-7-1 1 0 2-1 2-2 1 0 1-1 1-1 3-5 2-11-3-15 0 0 0 0 0 0 4-3 4-9 2-13-2-6-8-9-12-14 6 1 12 0 17-2 5-2 12-6 10-12-1-5-7-6-12-6-8-1-16 1-24 4 0 0 0 0 0 0-12-11-15-29-18-45-4-15-11-29-21-41-18-23-49-37-78-31-16 2-27 13-34 26-5 1-9 6-8 12 0 1 0 1 0 1 0 0 0 0-1 1 1-1 1-2 0-2-12-4-26-7-35 2-2 1-3 3-4 4-1 2-2 4-3 6-1-3-4-6-7-7-2-1-4-2-6-2-2 0-5 2-7 2-4-1-4-7-9-9-3-1-6 0-9 2-1 1 1 3 2 2 5-4 8 1 10 4 1 2 2 3 4 4 3 0 6-2 9-2 5 0 10 4 11 9 0 0 0 0 0 1-2 4-3 8-2 13 1 6 5 12 10 17 10 9 24 16 38 19 0 0 0 0 0 0 2 1 4 1 6 1-3 2-6 4-8 8-2 2-3 4-4 6-5-5-13-1-16-6-3-4-4-10-10-9-2 0-3 0-5 1-4 1-6 0-8-3-2-3-3-7-6-9-4-3-11-3-15 0-2 0 0 3 1 2 4-3 8-3 12 0 3 2 4 6 6 9 3 4 7 5 11 3 4-1 7-1 9 3 1 2 2 4 4 6 4 4 13 0 15 6 0 0 1 0 1 0-2 6-1 14 3 20 8 11 21 18 33 21 15 5 29 5 44 3 9-2 19-3 28-1 8 2 14 7 21 11 13 9 29 19 45 12 0 0 0 0 0-1 2-1 4-3 6-5 1 1 1 1 2 1 2-1 4-2 7-1 2 1 2 2 4 4 1 2 2 4 3 5 2 0 4 0 5 0 1 0 3-1 4-1 5 0 5 3 6 6 0 2 3 1 3 0-1-3-1-6-4-8zm-65-110c1 2 1 5 2 7-1 0-1 0-1 0-8 1-18 1-24-5-3-3-5-6-5-10 0-4 2-7 3-10 2-4 1-8-2-11-1-3-4-5-4-7-1-6 5-8 9-8 1 0 1 0 1 0 10 12 17 28 21 44zm-137-40c0-4 3-8 8-8 0 0 1-1 1-2 6-12 16-21 30-24 14-3 29-1 42 4 14 5 25 13 34 24-6 0-12 3-12 9 0 3 2 6 4 8 1 2 3 4 3 7 0 3-1 5-2 8-3 7-1 14 5 19 7 6 17 5 25 4 1 0 1 0 1 0 3 12 7 25 17 34 1 0 2 0 2-1 9-3 20-5 28-3 5 2 4 8 1 10-3 2-5 3-8 3-5 2-10 2-15 0-1 0-2 1-2 2 4 7 19 16 14 24-1 2-2 3-3 3 0 0 0 0 0 1-4 1-10-2-12-5-4-4-7-9-10-14 0 0 0 0 0-1-1 0-1 0-1 0 0-1-2-1-2 0 0 0 0 0-1 0 0 0 0 0 0 0-21 0-42-6-60-17 0 0 0 0 0 0 2-4 7-7 11-5 4 1 6 3 10 2 1 0 2 0 3-1 3-1 2-2 6-1 2 0 4 1 4 4 0 1 1 3 1 4 0 3 0 6 0 9-1 1 2 2 2 0 1-6 1-25-11-20-1 0-2 1-3 2-4 2-6 0-9-1-2-1-4-1-6-1-4 0-8 3-10 7 0 0 0 0 0 0-4-3-8-5-12-8 0 0 0 0 0 0 1-3 1-5 3-7 0-1-2-3-3-1-2 5-4 10-2 16 0 3 1 5 2 8 2 3 0 5-3 4-2 0-3-1-4-2-12-6-17-20-14-32 0 0 1-1 0-2 0-1 0-1-1-1-7-5-12-11-16-18 4 0 9 0 13-2 2 0 1-3-1-2-16 5-33-3-40-19 0 0 0 0 0 0 1-5 2-11-1-15-1-3-4-4-6-3 0 0 0 0 0 0zm-2 7c0-1 0-1 0-2 1 0 1 0 1-1 2 0 4 1 6 1 0 1 0 5 0 6 0 4-1 8-3 11 0 1 0 1 0 1 0 1-1 2-1 3-1 2 1 3 2 2 1-2 1-3 2-4 0 0 0 0 0-1 0 0 0-1 1-2 2 6 7 11 12 14-5 1-9 2-13 2-7 0-12-3-16-8-3-5-7-14 0-17 3-2 7-2 9-5zm2 57c-1 0-1 0-1 0-11-3-23-9-32-16-5-4-9-9-12-15-3-6-1-12 2-18 0 5 3 11 7 15 8 9 19 16 31 21 5 2 16 6 13 12 0 0 0 0 0 0-1 0-2 1-3 1-2 0-4 0-5 0zm11-6c-2-4-5-6-9-7-5-2-10-4-15-6-6-4-11-7-16-12-5-4-11-10-12-18 0-7 6-13 13-15 8-2 16 1 24 3 0 0 1 0 1 0-1 1-2 2-2 3 0 0 0 0 0 0-4 3-9 3-12 7-3 5 1 12 4 16 8 13 21 12 34 8 3 2 7 3 10 3 6 8 11 16 19 21-4 14 2 30 15 36 4 2 11 5 12-1 1-3-1-6-2-8-1-3-2-6-2-9 22 17 49 26 76 26 5 8 14 24 25 19 2 2 4 4 4 7 1 4-3 7-6 8-7 2-14-1-20-3-11-3-23-7-32-15-7-6-12-12-23-10-13 2-25 3-38 1-12-2-24-6-36-10-5-3-10-5-15-8-5-3-11-10-9-17 0 0 1-1 1-1 0 0 0-1 0-1 4-6 14-8 11-17zm104 73c-6-3-13-6-20-7-9-1-17 0-26 2-19 2-37 0-54-9-7-4-15-9-19-17-3-6-3-13 0-19 0 10 10 16 18 19 13 6 26 12 41 14 13 3 26 3 39 0 5-1 10-2 14 1 3 1 6 4 8 6 5 5 10 8 16 11 6 3 13 5 20 7 6 2 13 4 19 3-2 2-4 4-6 6 0 0-1 0-1 0-18 7-34-8-49-17zM763 2753l9-2c2 0 1-3 0-2l-10 2c-1 0-1 3 1 2zM793 2769c1 2 3 0 2-1-1-3-2-5-3-8-1-2-3 0-2 1 1 3 2 5 3 8zM493 2283c1-2 1-5-1-7-2-1-4-1-6 0-1 0-1 0-1 1 0 0 0 0 0 0-1 2-1 5 1 6 2 2 5 2 7 0zm-2-2c-2 2-5 0-4-3 0 0 0 0 0 0 0 0 0 0 1 0 1-2 4 1 3 3zM978 2786c0 0 0 0 0 0 4 8 8 16 12 23 3 5 6 11 11 14 10 4 17-8 13-16 0 0 0 0 0 0-7-12-13-23-19-34 4-3 9-5 14-7 0 0 0-1 0-1 1 0 2 0 2-1-2-4-3-7-4-11 0-1 1-2 2-2 0-2-2-3-3-2 0 1 0 1 0 1-2-4-4-8-7-12 1 0 1 0 1 0 2 1 2-2 1-2-1-1-2-1-3-1-1-2-2-3-3-5-5-8-10-17-18-23 0-2 1-3 1-4 0-2-2-3-3-1 0 1 0 2-1 3-1-1-2-1-3-2-12-5-25-3-34 7 0 1-1 2-2 4-1-1-2-1-2-2-2-1-3 2-2 3 1 0 2 1 3 1-3 6-4 12-4 18-1 0-1 1-2 1-2 1 0 3 1 2 1 0 1 0 2 0 0 5 2 10 4 15 1 3 2 6 3 8l-1 3c-1 1 1 2 2 1 0 0 0 0 1-1 3 7 6 14 10 20-1 1-1 2-1 3-1 2 2 2 2 1 0-1 1-1 1-1 1 1 1 2 2 3 0 0 0 0 1 0 0 1 0 1 1 1 3 0 5-1 7-2 1 5 4 12 10 10 6-2 5-8 3-12 1 0 1 0 2 0zm33 22c0 0 0 0 0 0 3 6 0 15-8 12-5-1-7-7-9-10-5-8-10-16-14-25 2-1 2-4 2-6 3-1 7-3 10-5 7 11 13 22 19 34zm-39-12c-4 0-6-5-6-9 0 0-1-1-2-1-3 0-5 1-8 2 0 0 0 0 0 0-1-2-2-3-3-5 1-1 2-1 3-2 1-1 0-3-2-2-1 0-1 1-2 2-4-7-7-14-11-20 0-1 0-2 0-2-4-7-7-15-8-24 1 0 1 0 2-1 2 0 0-3-1-2-1 0-1 0-1 0 0-4 0-9 2-13 0 0 1-1 1-1 0 0 0 0 0 0 2 1 3-2 1-3 0 0 0 0 0 0 7-11 22-15 34-8 1 0 2 0 2 1 0 0 0 1 0 2-1 1 2 2 2 0 0 0 0 0 1-1 7 6 12 14 16 22 1 2 2 3 3 4-1 0-2 0-2 0-2 1-1 3 0 3 1 0 2 0 3 0 3 5 5 10 8 15-1 1-2 2-2 3-1 2 1 3 2 2 0-1 1-1 1-2 1 3 2 5 3 7 0 0-1 1-1 1-9 4-18 9-27 13-1 1-1 1-1 2 0 0 0 1 0 1 1 3-2 5-4 3-1-2-3 0-2 1 0 0 0 0 0 1 0 0 0 0 0 1 1 2 4 10-1 10zM974 2749c3 1 5 2 8 2 1 1 2-2 0-2-2-1-5-2-7-2-2-1-2 2-1 2zM969 2760c0 2 0 4 0 5 0 2 3 2 3 0 0-1 0-3 0-5 0-1-3-1-3 0zM962 2716h-6c-2 0-2 3 0 3h6c2 0 2-3 0-3zM952 2736c1-2 2-4 2-6 1-1-2-2-2 0-1 2-2 3-2 5-1 2 2 3 2 1zM952 2755c-1 0-2 2 0 3 1 0 3 1 5 2 1 1 3-1 1-2-1-1-3-2-6-3zM975 2733c2 0 2-3 0-2l-5 0c-2 0-2 3 0 3l5-1zM943 2655c0 0 0 0 0 0-3 1-5 3-4 6 0 2 3 4 6 4 3 0 5-3 5-6-1-2-3-5-6-5 0 0 0 1-1 1zm4 4c0 2-1 3-2 3-4 1-4-4-2-5 0 0 1 0 1 0 0 0 0 0 0 0 1 0 3 1 3 2zM1313 2830c0-1 0-1 0-2-8-8-19-12-30-13-14-1-28 9-41 0-10-7-14-21-25-27-10-4-21 0-27 8 0 1 0 1 0 1 0 0-1 0-1 1-1 23 0 47 3 70 0 1 0 1 0 1 1 7 4 14 11 16 6 3 14 1 17-5 1-2 1-4 1-6 0 0 0 0 0-1-1-5-3-11-4-16 5 2 8 6 10 10 6 8 12 14 21 17s18 1 27-4c7-4 14-7 22-3 6 3 10 8 14 13 1 1 2 0 3-1 0 0 0 0 0-1 0-8 1-17 1-25 0 0 0 0 0 0 0-1 0-1 0-1 0-11-1-22-2-32zm-99 53c-10 5-18-5-19-14 0 0 0 0 0 0 1-2 3-5 5-7 1 3 1 7 2 10 0 0 0 1 0 1 1 1 3 1 3 0 1-6 8-8 12-3 3 4 1 10-3 13zm0-27c0 0 0 1 0 1 0 0 1 0 1 0 0 3 1 6 1 9 0 0 0-1-1-1-4-2-8 0-11 3-1-3-1-5-2-8 3-2 6-4 9-4 2 0 3 0 3 0 0 0 0 0 0 0zm69 17c-7 2-12 7-19 9-6 1-13 0-19-2 0-1 0-1 0-1-1-1-1-3-1-5 0-1-3-2-3 0 0 2 1 3 1 4-5-3-9-7-12-13-3-4-6-8-10-10-11-5-21 2-26 10-1-12-2-24-2-37 0 0 0 0 1-1 0-1 2-2 3-2 2-1 2-3 0-3-2 0-3 1-4 2-1-8 0-17 0-26 0 0 0 0 1 0 4-6 10-9 17-8 8 1 13 6 17 12 5 7 11 15 20 18 2 1 4 2 6 2 1 2 1 4 2 7 0 2 2 1 2-1 0-2-1-4-1-7 1 0 3 0 4 0 0 0 0 0 0 0 0 1 0 2 0 2 0 1 0 2 1 2 1 0 1-1 1-2l1-2c0 0 0 0-1-1 6-1 11-2 16-3 12 0 24 4 32 13 1 0 1 1 1 2 0 0 0 0 0 0-1 0-2 0-2 1 0 0 0 1 1 1 0 0 1 1 1 1 1 8 1 17 1 26 0 0-1-1-1-1-2 1-2 3-1 3 1 1 1 0 2 0 0 0 0 0 0 0 0 1 0 1 0 2-1 0-1 0-2 0 0 0-1 1-1 1 0 1 1 1 1 2 1 0 1 0 2 0 0 6 0 12 0 18-8-9-17-16-29-13zM1210 2833c-1 1-3 2-4 4-1-1-2-1-2-2-2-1-3 1-2 2 1 1 1 1 2 2-1 0-2 1-2 2-1 1 1 3 2 2 0-1 1-2 2-3 2 1 3 2 4 3 2 1 3-1 2-2-1-1-3-2-4-3 1-1 3-2 4-3 2-2 0-3-2-2zM1221 2836c-1 0-3 0-4-1-2 0-3 2-1 3 1 0 3 0 4 1 2 0 3-2 1-3zM1226 2838c-1 0-2 0-2 0-1 1-1 1 0 2 1 1 2 3 3 4 0 0 1 0 2 0 0-1 0-1 0-2-1-1-2-3-3-4zM1232 2846c-1-2-3 0-2 2 2 1 3 3 4 5 1 1 3-1 2-2-1-2-3-3-4-5zM1243 2855c-2-1-3-1-5-2-1 0-2 2 0 3 1 0 3 1 4 1 2 1 3-2 1-2zM1251 2854c-2 0-3 0-5 1-1 0-1 3 1 2 1 0 3 0 4-1 2 0 1-3 0-2zM1259 2851c-1 0-2 0-4 1-1 0-1 3 1 2 1 0 3 0 4-1 2 0 1-3-1-2zM1272 2850c-1 0-3-1-5-1-1-1-2 2 0 2s3 1 5 2c1 0 2-2 0-3zM1278 2854c1-1 2-1 3-1 1 0 1 0 1-1s0-2-1-1c-1 0-2 0-3 0-1 0-1 0-1 1 0 1 0 2 1 2zM1287 2849c1 1 2 1 2 0 0-1 1-2 1-3 0-1 0-1 0-2-1 0-2 0-2 1-1 1-1 2-1 3-1 0-1 1 0 1zM1292 2841c0-1 0-3 0-4 0-2-3-2-3 0 0 1 0 3 0 4 0 2 3 2 3 0zM1293 2834l3-2c2-1 1-3-1-2l-3 2c-2 0-1 3 1 2zM1303 2829c-1 0-1 0-2 0 0 0-1 0-1 1 0 0 0 1 1 1 0 0 1 1 1 1 1 0 2 0 2-1 0-1 0-2-1-2zM1237 2835c0 2 2 1 2-1-1-5-2-11-7-13-1-1-3-1-5-1-2 1-5 2-7-1-1-1-1-3-1-4-4-9-16-7-18 1 0 2 2 3 3 1 1-3 4-6 8-5 3 0 4 3 5 6 1 2 1 4 3 6 2 1 4 0 6-1 8-1 10 6 11 12zM1296 2860c-1 0-2 0-3 0-3 1-3 2-6 1-2-1-4-4-6-3-3 0-5 4-7 5-1 1 1 3 2 2 2-1 4-4 6-4 1 1 3 3 4 3 5 2 10-4 14 2 1 1 3 0 2-1-1-3-3-4-6-5zM1331 2833c-4 1-8 1-11-1-2 0-3 2-1 3 4 2 8 2 12 1 2 0 1-3 0-3zM1349 2814c-1 5-3 9-7 12-2 1 0 3 1 2 5-3 8-8 9-13 0-2-2-3-3-1zM1354 2796c0-7-2-13-5-19-1-2-3-1-2 1 2 6 4 12 5 18 0 1 3 1 2 0zM1343 2762c-2-5-4-8-7-12-2-1-3 1-2 2 2 3 5 7 6 10 1 2 4 1 3 0zM1277 2682c-3-4-7-8-10-12-1-2-3 0-2 1 4 5 7 9 10 13 1 2 3 0 2-2zM1252 2611c1-5 2-11 5-16 1-1-2-3-3-1-2 4-3 11-4 16 0 2 2 2 2 1zM1249 2630c0 8 3 14 7 20 1 2 3 1 2-1-4-6-6-12-6-19 0-2-3-2-3 0zM1252 2685c2 0 4-2 5-4 0-2-2-5-4-5 0 0-1 0-1 0 0 0 0 0-1 0-2 0-4 2-4 5 0 2 3 4 5 4zm0-7c0 0 0 0 0 0 0 0 0 0 0 0 3 1 3 5 0 4-3 0-2-3 0-4zM1155 2856c4-1 6-4 6-8-1-3-5-6-8-6-1 0-1 1-1 1-1 0-1 0-2 0-6 4-2 15 5 13zm-4-10c1-1 1-1 1-1 0 0 0 0 1 0 2 0 4 1 5 4 0 2-1 4-3 4-5 1-7-5-4-7zM690 2672c-1 0-1 0-1 1 0 0-1 0-1 0-7 4-3 14 5 12 3 0 6-3 5-7-1-4-4-6-8-6zm2 11c-5 1-7-5-3-8 0 0 0 0 0 0 1 0 1 0 1 0 2-1 5 1 5 3 1 3-1 4-3 5zM1177 2706c0 0 0-1-1-1-6-2-16-3-22 2-1 0-1 1-2 2-4 5-1 12 5 15 7 4 16 3 22-1 1 0 1-1 1-1 0 0 1 0 1-1 0-2 1-3 1-5 0-1 0-1 0-1 0-4-2-7-5-9zm-20 2c2-2 5-2 7-2 4 0 7 0 10 1 0 0 0 1 1 1 1 0 2 1 3 2-1 2-1 5-1 7-2 2-6 1-8 1-4 0-8-1-11-3-3-2-4-5-1-7zm7 16c-4-1-12-5-11-10 1 2 3 4 5 4 6 3 15 5 21 1 0 0 0 1-1 1 0 0 0 1 0 1-4 2-9 4-14 3zM1200 2541c-1 0-1 0-1 0-1 0-1 0-1 1-2 1-3 4-2 6 0 2 3 3 5 3 3-1 4-3 4-5 0-3-3-5-5-5zm1 7c-3 0-4-3-2-4 0 0 0 0 0 0 0 0 1 0 1 0 3-1 4 4 1 4zM1327 2806c4-2 6-8 3-12-2-4-8-6-12-4-1 1-1 1-1 2-3 2-4 7-2 11 2 4 8 6 12 3zm-10-5c-1-3 0-6 2-8 1 0 1 0 1-1 3-1 6 0 8 3 1 3 0 7-3 9-2 1-7 0-8-3zM781 1440c0 0 0 0-1 1 0 0 0 0-1 0-2 1-3 4-2 7 0 2 3 4 6 3 3 0 5-3 4-5 0-3-3-6-6-6zm1 9c-3 0-4-4-1-6 0 0 0 0 0 0 0 0 0 0 0 0 4 0 5 5 1 6zM709 1029c3 0 5-3 5-5-1-3-3-6-7-6 0 0 0 1 0 1-1-1-1-1-2 0-2 1-3 4-2 7 1 3 3 4 6 3zm-2-8c0 0 0 0 0 0 0 0 0 0 0 0 4 0 5 5 1 6-3 0-4-4-1-6zM456 191c3 0 5-2 5-5 0-3-3-6-6-6-1 0-1 1-1 1 0 0-1 0-1 0-3 1-4 4-3 7 1 3 4 4 6 3zm-2-8c0 0 0 0 0 0 1 0 1 0 1 0 3 0 4 5 1 6-4 0-5-4-2-6zM308 249c3-1 5-3 5-6-1-3-3-6-6-5-1 0-1 0-1 0-1 0-1 0-2 0-2 1-3 4-2 7 1 3 3 4 6 4zm-2-8c0-1 0-1 0-1 0 0 0 0 0 0 4 0 5 5 1 6-3 1-4-4-1-5zM34 71c3 0 5-3 4-6 0-3-3-5-6-5 0 0 0 0-1 0 0 0 0 0-1 1-2 1-3 4-2 7 1 2 3 4 6 3zm-2-8c0 0 0 0 0 0 0 0 0 0 0 0 4 0 5 5 1 6-3 0-4-4-1-6zM826 1253c2 0 5-3 4-6 0-3-3-5-6-5 0 0 0 0-1 1 0-1 0-1-1 0-2 1-3 4-2 7 0 2 3 4 6 3zm-3-8c1 0 1 0 1 0 0 0 0 0 0 0 4 0 5 5 1 6-3 0-4-4-2-6zM332 1197c-1 0-1 0-1 0-1 0-1 0-1 1-3 1-4 4-3 7 1 2 4 4 6 3 3 0 5-3 5-6-1-3-3-5-6-5zm0 9c-3 0-4-4-1-6 0 0 0 0 0 0 0 0 0 0 1 0 3 0 4 5 0 6zM155 1173c0 0-1 0-1 1 0 0 0 0-1 0-2 1-3 4-2 7 1 2 3 4 6 3 3-1 5-3 4-6 0-3-3-5-6-5zm1 8c-3 1-4-3-2-5 1 0 1 0 1 0 0 0 0 0 0 0 4-1 5 5 1 5zM322 1493c-1 0-1 0-1 1-1-1-1-1-2 0-2 1-3 4-2 7 1 2 3 4 6 3 3 0 5-3 5-6-1-3-3-5-6-5zm0 9c-3 0-4-4-1-6 0 0 0 0 0 0 0 0 0 0 0 0 4 0 5 5 1 6zM411 2676c-8 3-15 10-20 16-1 0-1 0-1 0-14-8-27-19-38-32 0 0 0 0 0 0 2-17-18-36-31-43 0-1 0-1 0-2 0 0 0-1 0-1 0-1 0-1-1-1-3-3-6-5-9-7-2-1-4-2-6-1-5-5-12-7-19-7 0-4 1-7 2-11 1-1-2-2-2-1-2 4-2 9-2 13-3 0-6 1-8 2-2-8-11-12-18-6-3-5-7-6-12-5-3 0-12 3-9 7 1 2 4 1 5 2 7 3 4 10 4 15 1 5 4 9 8 8 0 2 0 4 0 6 0 6 5 11 11 11 1 4 2 7 5 10 0 2 3 3 4 4 3 2 6 4 8 6 1 0 1 0 1 0 0 0 1 0 1 0 1 0 1 0 2 0 14 10 38 26 54 16 16 6 30 15 43 25-4 6-8 11-10 17-2 5-5 13 1 16 4 3 10-1 14-4 7-3 12-8 17-14 5-6 9-12 12-19 2-5 5-12 5-17-1-5-8-4-11-3zm-156-57c-9 3-5-12-6-15 0-3-1-5-3-6-1-1-3-1-4-2-2-1-3 0-1-2 4-3 12-2 15 2 0 0 1 1 1 1 0 0 0 0 0 0 4 7 0 15-2 22 0 0 0 0 0 0zm4-6c2-5 3-11 1-16 5-5 12-2 13 5 0 0 0 0 0 0 0 0 0 0 0 0 2 12-7 24-8 35-13 0-8-17-6-24zm12 10c3-6 6-12 5-19 3-2 5-2 8-3 0 2 0 4 1 6-1 0-2 0-3 1-1 1-2 3-2 5 0 5 6 8 11 7 0 0 0 0 0 0 1 0 1 0 1 0 4-3 6-8 4-13-1-4-6-6-9-3 0 0 0 0 0 0 0-1 0-2-1-3 6 0 12 2 17 6 0 0 1 1 1 1-4 17-16 32-33 38-5-6-3-15 0-23zm20-5c-3 0-10-2-9-6 1-3 5-2 7-4 0-1 1-3 3-3 1 1 2 3 2 5 1 3-1 6-3 8zm-13 35c-1-1-2-2-3-2 0-1-2-2-3-2 18-8 31-23 35-41 0 0 0 0 0 0 1-1 5 2 6 3 2 1 4 2 5 4 0 0 0 0 0 0-1 19-13 36-32 41 0 0 0 0-1 0 0 0-1 1-1 1-2-2-4-3-6-4zm11 5c17-6 29-21 32-38 14 9 39 33 23 49-16 16-40 0-55-11zm129 28c-3 10-8 19-15 27-6 7-14 15-23 18-3 1-4 1-6-2-1-3-1-4 0-6 1-3 2-6 3-9 2-4 5-8 8-12 2 1 4 3 6 5 1 1 3-1 2-2-15-13-32-24-50-32 1-1 3-2 4-4 2-2 3-4 4-6 13 15 28 27 45 36 2 1 3-1 2-2-2-1-4-2-6-3 0 0 0 0 0 0 4-5 9-9 15-13 2-1 4-3 7-3 6-1 5 4 4 8zM309 2659c-1-2-3-1-2 1 1 1 2 3 3 4 1 2 3 0 2-1-1-2-2-3-3-4zM327 2649c-2 1-5 2-7 2-2 1-1 3 1 3l7-2c1-1 1-3-1-3zM327 2637c0-3 0-5 0-7 0-1-3-1-3 0 1 2 1 4 1 7 0 1 2 1 2 0zM335 2664c-2 0-3-1-5-2-2 0-3 3-1 3 2 1 4 1 5 2s3-2 1-3zM337 2647c0 1 0 3 0 4-1 1 2 2 2 0 0-1 1-2 1-3 0-2-2-2-3-1zM343 2661c-1-1-2-1-2 0s-1 1 0 2c0 0 0 0 0 0 1 1 2 1 2 0s1-1 0-2c0 0 0 0 0 0zM321 2643c1-1 1-2 0-2 0 0 0-1 0-1-1 0-2 0-2 0s-1 2 0 2l0 1c1 0 2 0 2 0zM299 2658c0-1-1-1-1 0-1 0-1 1 0 1 0 1 0 1 0 1 1 0 1 0 2 0s0-2 0-2l-1 0zM300 2524c-1 2-1 5 0 7 2 2 5 2 7 1 2-2 4-5 2-7-1-2-4-4-7-3 0 0 0 1 0 2-1-1-2-1-2 0zm3 1c3-1 6 3 3 5-3 1-5-2-4-5 0 0 0 0 1 0 0 0 0 0 0 0zM242 1741c-2 2-1 5 0 7 2 2 5 2 7 1s3-5 2-7-4-4-7-3c0 0-1 1-1 1 0 0-1 0-1 1zm3 1c3-1 6 3 2 5-2 1-5-3-3-5 0 0 0 0 0 0 0 0 1 0 1 0zM17 2452c7 32 17 62 31 91 2 5 4 11 9 13 4 2 8 0 11-4 9-11 17-24 24-36 7-11 12-22 17-33 2 1 3-1 2-2 0 0 0 0 0 0 1-4 3-8 5-12 0 0 0-1 0-1 1 0 1-1 1-2-23-31-67-38-99-17-1 1-1 1 0 2-1 0-1 1-1 1zm74 61c-4 7-9 14-13 21-2 4-5 7-7 11-3 4-8 13-14 8-3-3-5-7-6-10-3-5-5-9-7-14-3-8-7-16-10-25-4-11-7-22-10-34 27-11 60-7 83 12-5 11-10 21-16 31zm23-45c0 0 0 0 0 0-2 4-4 8-5 11-24-18-58-23-86-11-1-6-2-11-3-17 0 0 0 0 0 0 31-20 72-13 94 17zM51 2475c-4 2-4 6-4 9 2 6 8 10 11 15 1 1 1 1 2 0 1 0 2 0 2-1-1-6 2-14-2-19-2-4-6-5-9-4zm-1 6c1-5 6-4 8-1 2 2 2 5 2 7 0 3-1 6-1 9-4-5-10-9-9-15zM86 2502c-3-1-7 0-9 3-3 3-3 8-3 13 0 0 1 1 1 1 0 0 1 1 1 0 5-1 9-4 12-7 2-4 2-8-2-10zm-3 10c-1 2-4 3-6 4 0-2 0-4 0-6 1-3 3-7 7-6 5 2 2 6-1 8zM61 2519c-2-2-6-3-9-1-2 2-3 5-2 8 1 4 6 7 10 8 1 1 2-1 1-2 0 0 0 0 0 0 1-4 3-9 0-13zm-8 2c1-3 5-1 6 1 2 3 1 6 0 9-4-2-8-5-6-10zM1279 2922c-1 0-2 0-2 1 0-1 0-2-1-1-6 0-12 5-12 11 0 6 5 11 11 12 5 0 11-4 12-10 2-6-3-12-8-13zm-4 20c-11-1-10-17 1-18 0 0 1 0 1-1 0 1 0 1 1 1 4 2 7 5 7 10 0 5-5 9-10 8zM183 2645c-1 2-2 4-3 6-3-2-7-3-10-1-2-2-3-4-5-6-1-1-3 0-2 2 2 2 3 4 5 6-5 5-4 12-7 18 0-1 0-1 0-2 0-2-1-5-3-6-2-1-4-1-6 1 0 1 0 1 0 1-1 1-4 1-5 0-1 0-2-2-3-4 0-1 0-4 0-5 0-3 0-6-1-9-1-5-3-11-6-16-5-9-15-15-27-15-9 0-18 4-26 10 0 0-1 0-1 0-1 0-1 1-1 1-9 9-16 21-14 33 2 13 11 22 22 26 3 1 6 3 9 4-8 2-16 6-18 14-1 2-2 6 1 7 1 1 2 1 3 1 3 0 6-1 9-1 28-2 54-10 80-21 0 0 0 0 1 0 8-8 15-26 7-36 1-2 2-5 4-7 1-1-2-3-3-1zm-46-11c1 4 3 7 3 11-10-2-16-12-13-22 4 3 7 7 10 11zm-52-6c1 0 2 1 2 2 0 2-1 3-2 4-2 1-5 1-7 1 2-3 4-5 7-7zm-14 24c0-5 2-11 5-15 5 1 11 1 13-4 2-3 0-6-2-7 12-9 27-11 38-4 0 0 0 0 0 0-4 12 3 24 15 26 0 0 1 0 1-1 0 1 0 2 0 2 0 5 0 10 1 14 3 5 9 7 13 2 0 0 0-1 0-1 2-2 3 5 3 6 0 1 0 3 0 4-1 3-5 5-8 7-6 3-12 5-18 6-11 3-21 3-31 0 6 0 13-3 19-8 8-7 11-19 7-29-4-9-14-14-23-13-10 2-20 14-12 23 6 8 19 1 15-8-1-2-4-1-3 1 2 4-2 8-6 7-4 0-6-3-7-7 0-6 5-11 11-13 11-2 21 5 23 15 3 10-2 20-11 25 0 0 0 0 0-1-7-12-24-13-32-1 0 0 0 0 0 0-8-6-12-16-11-26zm19 30c-1-1-1-1-2 0-1-1-2-2-3-2 0-1 0-1 0-1 7-10 21-9 27 2 0 0 0 0 0 0-6 3-14 4-20 2-1-1-2-1-2-1zm83 5c-20 8-40 15-61 18-6 1-11 2-17 2-2 0-11 2-12 0-1-1 1-4 1-6 1-2 4-4 6-5 4-3 9-5 14-6 0 0 0 0 0 0 14 4 30 2 44-5 4-2 8-4 11-8 1-1 1-1 1-2 1 0 1 0 1-1 3-3 4-7 5-12 1-2 1-5 3-7 2-4 7-4 10-1 0 0 0 0 0 0 1 1 1 1 1 1 7 10 0 25-7 32zM19 2672c0 2 2 2 3 1 2-10 11 0 17-1 2-1 4-3 6-4 4-3 8-5 14-4 2 0 2-2 1-3-4 0-8 0-12 2-5 2-8 8-15 5-5-3-12-3-14 4zM61 2688c1 0 3 1 4 1 2 0 4 1 6 1 2 0 5-1 7-3 1-2-1-4-2-2-5 5-12 0-18 1-4 1-6 5-5 8 0 2 3 1 3-1 1-1 2-3 2-4 1 0 2 0 3-1zM607 2871c2-5-2-10-7-11-4-1-8 0-12 1-5 2-15 7-18-2 0 0 0 0 0 0-3-10-2-19 0-29 0 0-1-1-1-1 1 0 1 0 1-1 0-24-18-47-42-51-24-3-50 12-55 37-2 11 0 23 5 33 3 6 7 10 12 14 6 5 14 8 18 14 6 6 9 20-2 23-7 2-11-6-17-9-9-4-11 8-8 14 5 12 21 17 33 14 12-3 21-13 23-25 3 6 8 13 13 18 8 7 21 13 32 9 8-3 9-14 1-17-5-3-11-3-16-6-5-2-8-6-10-11 6 6 13 10 22 11 10 2 23 1 30-7 5-6 4-15-2-18zm-49-71c-1 3-3 7-7 7-4-1-4-5-6-7-1-2-3-3-5-2-1 0-2 2-4 3-4 1-8 0-10-4-4-5-1-12 3-16 0 0 0 0 0 0 12 2 22 9 29 19zm-68 57c-9-7-14-19-15-30 0-4 0-8 1-12 0 0 0 0 0 0 7-3 17-4 22 2 3 3 5 7 4 11-1 3-3 5-5 8-2 3-1 7 1 10 2 2 5 4 6 7 2 4 0 8-3 11 0 1 0 1 0 1-4-2-8-5-11-8zm120 25c-3 12-21 13-30 12-10-2-19-7-25-15 0 0 0 0 0 0 0-1 0-1 0-1-1 0-1 0-1-1-1-1-3 0-2 2 0 0 1 0 1 1 1 7 6 14 13 19 3 2 7 3 11 4 2 0 4 0 6 1 5 3 4 9-1 12-10 5-24-3-31-10-9-8-13-19-16-30-1-2-3-1-3 1 1 3 2 7 4 11-1 0-1 0-1 1-1 13-11 25-25 26-10 1-29-5-28-18 0-5 4-7 8-4 2 1 4 3 5 5 3 2 7 4 11 3 9-2 12-12 9-20-2-7-7-11-12-15 0 0 0 0 0 0 5-4 6-11 3-16-2-4-7-6-7-11 0-4 4-7 5-11 2-5-1-11-6-15-6-4-14-3-21-1 5-17 19-29 37-32 4 0 8 0 12 0-4 5-6 11-3 17 2 5 6 8 11 7 2 0 3-2 5-2 1-2 3-1 5 2 0 0 0 1 1 1 1 2 2 3 4 4 5 1 9-2 11-6 4 7 7 16 7 25 0 1 0 1 0 1 0 0 0 0 0 1-2 10-2 20 1 30 0 0 0 0 0 1 1 4 5 6 10 6 5-1 9-3 13-4 3-1 6-2 9-1 3 1 5 5 4 8-1 0-1 0-2 0-7 1-12 5-19 4-7-1-14-4-17-11 0-1-3 0-2 2 3 7 11 11 18 12 4 0 7 0 11-1 3-1 5-2 8-3 6-1 10 4 9 9zM565 2839c1-4-3-8-7-7-6 0-8 6-8 10 0 2 3 2 3 0 0-3 1-6 3-7 3-2 7 0 6 4 0 1 3 2 3 0zM531 2839c-5 2-7 8-5 12 1 2 3 1 3 0-2-4-1-8 3-9 3-2 8 1 9 4 0 2 3 1 2 0-1-5-7-9-12-7zM553 2852c1 2 0 5-1 6s-5-1-6-2c0-2-3-1-2 0 1 4 5 6 8 4 3-1 5-5 4-8-1-2-3-1-3 0zM609 2790c-1 1 0 3 1 2 4-2 9 1 7 5-3 5-9 1-8-3 1-2-2-3-2-1-1 3 0 7 3 8s7 1 9-2c4-6-4-13-10-9zM1105 2888c0-1-1-2-1-2-1 0-1 0-1-1-2-3 0-7 0-10 2-1 4-2 7-2 2-1 1-3-1-3-2 1-4 1-6 2-1-1-1-1-1-1 1 0 1-1 1-1 0-2 1-4 2-5 1-2 0-4-2-2-1 1-2 3-3 5-1-1-4-2-7-1-2 1-3 3-4 4 0-2 0-5 1-7 0-5 2-19-5-21 0 0 0 0 0 0-8-1-16 2-22 5-11 5-21 12-30 20-17 13-36 32-39 54-1 11 4 19 14 23 0 0 0 0 0 0-2 5-3 9-5 13 0 2 2 3 3 1 1-4 3-8 4-13 12 4 26 7 39 3 5-2 10-6 13-11-1 3-1 8 2 10 4 2 9-3 12-5 2-4 4-7 6-10 3-3 7-5 11-8 7-3 13-7 17-14 3-6 3-12-1-17-1-2-3-4-4-6zm-15-14c1-2 3-4 5-4 1 0 2 0 3 0 0 2 1 4 2 6 0 4-1 6 1 10 0 0 0 1 0 1-2 1-4 2-5 5 0 0 0 0 0 0 0 0 0 0 0 0-4-3-7-6-7-12 0 0 0 0 0 0 0-2 1-4 1-6zm3 19c3 3 5 6 4 11 0 0 0 0 0 0-1 0-1 1-1 2-1 3-4 5-7 7-5 3-11 4-15 8-1 1-2 1-3 2 7-13 12-26 15-40 1 0 1 0 1 0 0 4 2 7 6 10zm-42 52c-12 6-27 3-40-1 1-2 2-4 2-6 1 0 1 0 1 0 1-4 3-8 5-12 8-1 15-3 22-4 2 0 1-2 0-2-7 1-14 2-20 4 2-5 5-10 8-15 3-4 6-9 9-14 8-1 17-2 25-3 2-1 1-3-1-3-7 1-14 2-22 3 7-9 15-17 24-24 1-1-1-3-2-2-10 8-18 17-26 27 0 0 0 1 0 1-3 4-5 7-8 11-1-5-2-11-3-16 0-2-3-2-3 0 1 6 3 13 4 19 0 1 0 1 0 1-3 5-6 10-9 15 0 0 0 1 0 1-2 3-3 6-4 9-3-6-5-12-7-19-1-1-3-1-3 1 3 7 6 14 8 22-1 1-1 3-2 5-29-13-1-49 13-62 10-10 21-18 33-25 8-5 19-12 29-10 0 0 0 0 0 0 6 1 4 16 3 19-2 12-5 24-9 36-3 10-8 19-13 28-4 6-8 12-14 16zm23-4c-2 2-4 5-7 5-2 0-3-3-3-4 0-3 2-5 3-6 0 0 0 0 0-1 3 0 5 0 7 3 0 0 1 0 1 0 0 1-1 2-1 3zm7-11c-2 2-3 4-4 7 0-1-1-1-1-1-2-2-5-4-8-3 2-4 4-7 8-10 0 0 0 0 0 1 3 0 5 2 7 5 0 0 0 0 0 0-1 0-1 1-2 1zm4-3c-1-3-4-5-7-6 2-1 4-2 6-2 1-1 3-2 5-3 0 0 0 0 0 0 2 1 5 2 6 5 0 0 0 0 0 0-3 2-7 4-10 6zm20-13c-2 2-5 4-8 6 0 0 0 0 0 0-1-3-3-5-5-6 2-1 3-2 5-4 1-1 1-3 2-4 3-1 6 0 8 2 0 1 1 1 1 0 0 2-2 4-3 6zm4-7c0 0 0 0 0-1-3-2-6-3-9-3 0-2 0-4 0-6-1-1-2-2-3-3 1 0 1-1 1-1 1-2 2-3 4-4 2 2 4 4 5 7 3 3 3 7 2 11zM705 2887c-23-10-50-1-67 17 0 0 0 0 0 0-5 0-10-1-15-3-1 0-1 0-1 1-1 0-1 1-1 1 1 5 3 10 6 13 2 2 4 3 4 5 0 2-1 5-1 8 0 10 4 20 11 27 14 17 40 22 61 17 20-5 34-21 34-42 1-20-13-37-31-44zm15 74c-14 13-37 13-54 8-21-7-38-27-32-50 0 0 0-1 0-1-5-3-9-8-10-14 5 2 9 3 14 3 0 0 0 0 0 0 0 0 1 0 2 0 12-14 31-23 50-22 18 2 35 14 41 31 6 16 2 35-11 45zM701 2900c-3-2-8-1-10 2-2 2-2 5-3 7l-3 7c0-4-1-8-3-11-1-3-3-8-7-7-3 1-5 7-6 10 0 5 0 10 1 14-1 0-3 1-4 1-5 3-5 9-3 13 0 0-1 1-1 1-1 12 7 22 19 22 10 0 18-8 19-18 1-1 2-2 3-3 1-5-2-10-7-10 0 0 0 0 0 0 3-5 6-10 7-15 0-4 1-11-2-13zm-36 29c1-3 5-5 7-3 0 0 0 0 0 0 1 0 1 1 1 2 0 0 1 0 1 0 0 3 1 6 2 9 0 0 1 1 1 2 0 2-2 3-4 3-1 0-4-3-5-3-2-3-4-6-3-10zm35 9c0 0-1 0-1 1 0 0-1 0-1 1-1 0-2 1-3 1-2 1-6 1-8 0-1 0-3-1-4-2-3-3 1-6 4-7 3-1 6-2 9-1 0 0 1 0 1-1 3 1 4 5 3 8zm-7-10c-5 0-12 2-13 7-2 5 3 8 8 9 3 1 6 0 9-1-1 8-8 14-16 13-10 0-16-8-16-17 3 3 9 8 12 5 5-3 0-13-1-17 0-1-1-2-2-3-2-4-3-8-3-12 1-3 1-10 5-11 2 0 3 2 3 4 1 1 2 3 2 5 2 4 2 8 2 12 0 1 0 1 0 1 0 1 2 1 3 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1-4 3-9 4-13 1-2 2-5 4-7 2-2 6-2 6 2 2 9-3 17-7 23zM1000 2861c3-1 5-3 4-6 0-3-3-5-6-4 0 0-1 0-1 0 0 0-1 0-1 0-5 4-2 12 4 10zm-3-7c0 0 1-1 1-1 0 0 0 0 0 0 3 0 5 4 1 5-2 1-4-3-2-4zM193 2591c-2-4-7-7-11-6-1 0-1 0-1 0 0 0 0 1 0 1-4 2-6 6-4 10 1 5 6 7 10 5 4-1 7-5 6-10zm-11-3c0 0 0 0 0 0 0 0 0 0 0 0 4-1 8 1 8 5 1 3-2 5-5 6-6 1-9-8-3-11zM27 2620c1-5-1-10-6-12-2-1-2 2-1 3 8 3 5 15-3 14-4-1-7-3-7-7 0-4 4-8 8-8 2 0 2-2 0-2-5 0-10 4-10 9-1 6 3 10 9 10 5 1 9-2 10-7zM250 2716c-6-1-13 0-18 4-4 4-7 7-11 11-3 3-7 6-9 10-10 14 7 23 19 25 14 2 30-5 35-20 1-4 1-8 1-12 2 0 4 0 6-1 2-1 3-3 2-5-1-3-3-4-6-5 3-1 6-4 4-7-1-3-5-3-8-1 2-3 2-6 2-9 0-2-3-2-3 0 0 4-1 7-3 10 0-4 0-10-4-10-5 0-6 6-6 10 0 0 0 0 0 0 0 0-1 0-1 0zm13 31c-5 12-18 17-31 16-6 0-13-2-18-7-6-7 0-14 5-19 5-5 9-10 14-14 5-5 11-6 17-5 0 0 0 0 0 0 12 4 17 17 13 29zm9-17c-1 2-4 1-5 1-1 0-1 0-1 0-1-2-1-3-2-5 0 0 0 0 0 0 2-1 5-1 7 1 1 0 2 2 1 3zm-2-14c2 2-1 5-2 5-2 1-4 2-6 2 0 0 0 0-1 0 0-1 0-1-1-1 2-2 3-3 5-4 1-1 4-3 5-2zm-16 1c-1-2 0-3 0-5 0-1 2-4 4-3 0 1 0 4 0 5 0 2 0 4 0 5 0 0 0 0 0 0-1-1-3-2-4-2 0 0 0 0 0 0zM235 2729c0 0 1 0 1 0 1-2 2-3 3-4 1-1-1-3-2-2-1 1-2 3-3 4 0 1 0 2 1 2zM248 2738l4-1c1 0 1-1 0-2 0-1-1-1-1 0-2 0-3 1-4 1-1 0-1 1 0 2 0 1 1 1 1 0zM252 2748c-1 1-2 1-4 1 0 0-1 1 0 2 0 0 0 1 1 1 1-1 3-1 4-1 0 0 1-1 1-2-1 0-1-1-2-1zM235 2739c0-1 1-1 2-2 0-1 0-2 0-2s-2-1-2 0c-1 1-2 1-2 2-1 1-1 2 0 2s1 1 2 0zM222 2737c0 1-1 2-1 3-1 1 1 2 2 1 1-1 1-2 2-3 0-1-2-3-3-1zM239 2756c-2 0-3 0-4 0-1-1-2 0-2 0 0 1 0 2 1 2 1 0 3 0 4 1 1 0 1-1 2-1 0-1-1-2-1-2zM219 2749c-1 0-2 0-3-1-1 0-1 1-1 2s0 1 1 1c1 0 2 0 3 0 1 0 1 0 1-1 0-1 0-1-1-1zM233 2746c-1 0-1 0-2 1-1 0 0 3 1 2 1 0 2-1 2-1 2-1 0-3-1-2zM251 2727l2-2c0-1 0-1 0-2-1 0-2-1-2 0s-1 1-2 2c0 1 0 1 0 2 1 0 2 0 2 0zM306 2751c3-1 5-4 4-7 0-3-4-5-7-4-1 0-1 0-1 0 0 0 0 0-1 0-2 2-3 5-2 8 1 3 4 4 7 3zm-3-8c0 0 0 0 0 0 0-1 0-1 0-1 2 0 4 1 5 3 0 2-1 3-3 4-4 1-5-5-2-6zM134 2754c0 0 0 0-1 1 0 0 0 0 0 0-3 1-4 5-3 8 1 3 4 4 7 3 3-1 5-4 5-7-1-3-5-6-8-5zm2 9c-4 1-5-4-2-6 0 0 0 0 0 0 0 0 0 0 1 0 1-1 4 1 4 3 1 1-1 3-3 3zM1058 2491c-1 3-2 6-3 9 0 1 2 2 3 1 1-3 2-6 3-9 0-2-3-3-3-1zM1078 2497c0-1-3-1-3 0 1 4 1 7 3 9 0 2 3 1 2-1-1-2-2-5-2-8zM1104 2494c-1-1-2-2-3-3-2-1-4 1-2 2 1 1 2 2 3 3 2 1 3-1 2-2zM1133 2508c8 1 16-3 20-10 1-1 2-2 2-3 14-16 7-40-14-45 0 0 0 0-1 0 0 0 0 0 0 0-6-4-15-4-19 3-2-1-4-1-6 0 0 0 0 0-1 0-19-4-36 12-32 32-1 0-2 0-2 0-10 0-19-4-26-10 0 0-1 0-1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0-5 0-8 5-9 9-1 7 1 13 4 18 6 12 19 19 32 17 7 0 14-3 20-7 0 0 0 0 0 0 5 1 10 1 15 0 3 2 6 3 9 2 4 0 7-3 9-6zm25-23c1-4 0-9-1-14-3-6-7-12-11-17 11 6 17 19 12 31zm-35-30c5-10 15-4 21 1 4 5 9 11 11 17 4 14-4 35-21 32 1-2 1-5 0-8-1-12-4-25-7-36-1-2-2-5-4-6 0 0 0 0 0 0zm-11 0c-7 5-11 14-11 23 0 0 0 0 0 1-3 1-5 2-8 3-3 1-6 2-9 2-3-17 12-31 28-29zm-45 60c-7-2-13-7-17-14-2-4-3-8-3-12 0-4 1-11 5-12 9 8 21 11 33 10 7-1 13-5 20-7 7-2 12 2 10 10-2 3-4 7-6 10-9 13-26 20-42 15zm36-5c2-2 5-4 7-6 0 0 0-1 1-1-1 2 0 5 2 7-3 1-7 1-10 0zm20 2c-3 0-6-1-8-3 0-1-1-2-1-3-1-1-1-3-1-4 0-1-1-1-1-1 0-1 1-2 1-3 3-4 7-11 4-16-2-4-7-6-11-5-1 0-2 0-2 1 0-9 3-16 10-21 1 0 1 0 1 0 6-7 9 5 10 9 1 4 2 7 3 11 2 8 5 17 4 25 0 5-4 10-9 10zM408 2828c-1-5-3-10-5-14 4-5 8-14 1-18-1 0-1-1-2-1 5-9 10-19 15-28 1-2-1-3-2-2-5 10-10 20-15 30 0 0 0 0 0 0-5 0-9 4-11 8 0 0-1-1-2-1 7-18-6-37-25-39-18-3-34 14-32 32-5 1-10 2-15 5-8 6-14 15-15 25 0-1-1 0-1 0-8 13-4 28 5 39 9 12 23 21 38 24 15 4 31 3 45-3 13-6 26-15 30-29 3-9 1-25-9-28zm-56 28c1 1 2 2 3 3 0 0 0 0 0 0-2-1-4-1-7-1 2-1 3-2 4-2zm10 3c0 0-1-1-1-1-3 0-5-2-7-4 7-6 12-13 12-23 1-7-1-14-6-21 11-8 28-9 38 2 7 8 9 22 5 33 0 0 0 1 0 1-9 11-27 13-41 13zm42-60c3 4 0 9-3 13-1-2-2-3-3-4-2-1-4-3-6-4 1-4 7-10 12-5zm-44-34c18 0 32 19 24 36 0 0 0 0 0 1-9-2-18 1-25 6-2-3-5-5-8-7-5-4-12-6-18-6-2-16 10-30 27-30zm-42 37c11-6 24-5 34 3 8 7 13 17 12 27-2 12-9 20-19 24 0 1 0 1 0 1-15-3-30-10-41-21 1 0 1-1 1-1-5-13 2-27 13-33zm45 86c-12 0-25-2-36-8 6-4 12-4 17-1 5 2 8 4 12 2 6-1 10-4 16-4 6 0 11 2 16 5-8 3-17 5-25 6zm45-21c-5 6-11 10-18 13-4-3-9-5-15-6-6 0-11 2-18 4-5 2-8 0-13-2-2-1-4-2-6-2-5 0-9 1-13 5-3-2-6-4-9-6-13-11-25-29-15-45 0 2 0 4 1 6-1 0-2 2-1 3 15 15 36 23 57 25 18 1 45-3 52-22 1-2-2-2-2-1 0 0-1 1-1 1 1-3 1-6 1-9 5 2 7 10 7 15 1 8-2 15-7 21zM386 2841c5 5 14 1 12-6-1-2-3-1-3 0 2 6-6 7-8 2 0-1-2-1-2 1-1 6-8 3-7-2 0-2-2-2-3-1-2 8 8 11 11 6zM318 2819c0 5 2 11 9 11 1 0 1-3 0-3-6 0-6-7-6-11 0-1-2-2-3-1 0 1 0 1-1 1-2 1-3 0-1-3 1-1 1-3 0-3-4 0-6 3-5 7 2 2 5 3 7 2zM373 2789c5 0 8-7 4-11-1-1-3 1-2 2 3 3 1 6-2 6-2 0-2 3 0 3zM400 2929c-1 0-1 0-1 0 0 0 0 0 0 0-3 0-5 2-5 5s2 4 4 4 5-1 5-4c1-2-1-5-3-5zm-1 7c-1 0-2-1-2-2-1-1 0-3 2-3 0 0 0 0 0 0 0 0 0 0 0 0 2 1 2 5 0 5zM72 2803c1 8-4 15-11 17-2 0-1 3 1 2 8-2 14-10 13-19 0-2-3-2-3 0zM97 2774c-2 0-3 1-5 1-1-7-8-14-17-13-12 0-19 13-16 24 0 0 0 0 0 0-9 1-16 8-18 18-1 9 4 18 12 23 2 2 4 3 5 3 0 0 0 0 0 0 1 4 1 8 2 11 0 2 2 2 2 0 0-3 0-7-1-10 6 1 13 0 18-3 1 2 2 4 3 7 1 1 3 0 3-2-1-2-3-4-4-6 6-5 10-12 11-20 0 0 0 0 0-1 0 0 0 0 0-1 0-5-3-9-7-13 2-1 3-2 4-3 0 0 0-1 0-1 0 0 1 0 1 0 2-4 3-7 3-10 1-1 3-1 4-1 2-1 2-3 0-3zm-9 12c0 0 0 1 0 1-1 0-1 0-1 0-3 4-7 6-11 5-2-1-3 2-1 2 3 1 5 1 8-1 0 1 0 1 0 1 4 3 6 7 6 11 0 1 0 1 1 1-1 0-1 1-1 1-1 16-18 27-32 20-7-4-12-10-13-17-1-10 4-20 15-21 0 0 1 0 1-1 0 0 0 1 0 1 1 1 3 0 2-2-4-10 2-22 13-23 8 0 13 5 15 12-1 0-3 0-4 0-2 1-1 3 1 3 1 0 2 0 3-1 0 3-1 6-2 8zM76 2771h-1c-2 0-2 3 0 3h1c1 0 1-3 0-3zM54 2809c-1-1-1-2-2-1-1 0-2 1-3 1-1 0-1 1-1 1 0 1 1 2 2 1 1 0 2 0 3-1 0 0 1-1 1-1zM55 2813c-1 0-1 0-2 0 0 0-1 1-1 2 1 0 1 1 2 1 1 0 1-1 2-1 0 0 1-1 1-1-1-1-1-1-2-1zM246 2835c-2-3-4-7-7-10-5-7-11-13-18-18-13-10-30-18-47-16-6 1-11 4-14 8-3 4-5 7-6 11 0 2 0 3 0 5 0 1 1 3 1 4 0 1-2 3-3 5-2 2-4 4-6 6-3 3-7 7-10 11-6 7-13 14-19 21 0 1 0 1 0 1 0 0-1 1-1 1 0 1 0 1 0 2 0 0 0 0 0 0-2 19 12 34 25 46 14 12 31 20 50 19 0 0 0-1 1-1 0 0 0 0 1 0 7-9 15-18 23-27 3-5 7-9 11-14 1-1 3-4 4-5 3-1 3 1 5 1 4 1 9-4 11-7 4-4 8-9 9-15 2-10-4-19-10-28zm-88-15c1-1 1-1 0-2-4-7 2-16 7-21 5-4 12-4 18-4 14 1 27 9 38 17 7 6 15 14 20 22 0 1 0 1 0 1 1 0 1 1 1 1 1 2 3 4 4 6 3 7 4 14 0 20-3 5-8 11-14 10 0 0 0 0 0 0 0 0-1 0-1 1-13 16-27 32-41 48-15-2-30-7-43-16-12-8-28-23-28-39 0 0 0 0 0 0 13-15 27-29 39-44zm-14 91c-10-9-22-21-25-34 5 11 16 20 25 27 13 10 29 16 46 18 1 0 1 0 1 0 0 2-1 4-1 6-17 1-33-6-46-17zm108-43c-1 3-4 5-6 8-2 2-6 6-9 6-3 1-4-2-7-1-3 3-5 7-8 10-4 4-7 9-11 13-6 7-12 14-18 21 0-1 0-3 0-4 0-1 0-1 0-1 14-15 27-31 40-47 5 0 10-4 13-9 4-5 6-10 5-16 3 6 5 13 1 20zM134 2879c2 4 7 3 11 3 13 1 11 21 25 21 10 0 9-11 15-16 3-3 8-1 12-2 1 0 3-1 4-2 4-3 5-9 8-13 3-5 9-6 13-11 3-3 4-8 3-12-1-4-3-7-7-9-2-2-5-3-7-3-6-1-8-4-10-9-3-8-10-16-20-12-4 2-6 6-6 11-1 3 0 7-3 9-3 4-9 2-13 2-5-1-10 0-13 4-2 2-3 5-3 8-3 0-6 2-8 5-3 5 0 9-1 15-1 3-3 7 0 11zm3-15c0-3-1-5 0-7 1-4 4-6 8-7 1 0 2-2 1-2-2-5 6-9 10-10 4 0 8 2 12 1 7-1 9-7 9-13 1-6 4-12 11-10 7 2 9 8 11 13 1 3 3 5 5 6 4 3 9 3 13 5 4 3 7 9 5 14-2 6-8 7-11 10-3 3-5 6-6 9-1 2-2 4-3 5-3 4-6 5-10 5-7 0-10 2-13 8-1 3-2 7-5 9-7 4-13-4-15-9-2-3-4-7-7-9-4-3-9-1-14-3-6-3 0-10-1-15zM193 2894c0 0 0 0 0 0-3-2-7 0-8 3-1 3 1 7 4 8 3 1 7 0 8-4 1-3-1-6-4-7zm-3 9c-1-1-3-2-2-4 0-2 2-4 3-3 0 0 1 0 1 0 4 2 3 8-2 7zM170 2816c2 0 4-3 4-5-1-2-3-3-5-2 0 0 0 0 0 0-3 0-5 2-4 4 1 2 3 4 5 3zm-1-5c0 0 1 0 1 0 0 0 0 0 0 0 1 0 1 1 1 1 0 1-1 1-2 2-1 0-2-3 0-3zM41 2869c-14 3-25 17-23 32 1 13 12 25 26 22 14-2 19-20 13-32-3-6-10-11-17-8-6 2-8 9-5 14 0 1 3 0 2-1-3-5 1-11 6-11 5 0 9 3 11 6 3 6 3 14 1 20-6 15-27 11-33-2-5-12 0-28 12-35 14-7 32 1 33 17 0 2 3 2 2 0 0-14-14-24-28-22zM107 2901c-1 0-1 0-2 1 0-1 0-1-1-1-3 1-5 4-5 8 0 3 3 6 7 6 3 0 6-3 6-6 0-4-2-7-5-8zm-1 11c-5 0-6-7-1-8 0 0 0 0 0 0 0 0 1 0 1 0 5 1 5 8 0 8zM257 2905c2 1 5-1 5-3 1-3 0-5-3-6 0-1-1 0-1 0-1 0-1-1-2-1-2 1-4 3-4 6 0 2 2 4 5 4zm0-7c0 0 0 0 0-1 1 1 1 1 1 1 2 1 2 5-1 5-3 0-3-4 0-5zM543 535c0 0 0 1 0 1-1 0-1 0-1 0-3 1-4 5-3 8 1 3 4 4 7 4 3-1 6-4 5-7-1-4-4-6-8-6zm2 10c-4 1-5-5-2-7 1 0 1 0 1 0 0 0 0 0 0 0 2 0 4 1 4 3s-1 4-3 4zM757 713c-1 0-1 0-1 0 0 0 0 0-1 0-3 1-5 4-5 7 0 4 3 6 7 6 3 0 6-3 6-6 0-4-3-7-6-7zm-1 10c-4 0-4-7 0-8 0 0 0 0 0 0 0 0 1 0 1 0 2 1 4 3 4 5 0 2-2 3-5 3zM412 956c4 0 7-2 7-6 0-4-3-7-7-7 0 0 0 0 0 0-1 0-1 0-1 0-4 1-6 4-5 8 0 3 3 5 6 5zm0-10c0 0 0 0 0 0 0 0 0 0 0 0 2 0 4 2 4 4 0 2-2 4-4 4-5 0-5-7 0-8zM964 735c-1-1-3-2-4-2-4-1-8-2-12-2 0 0 0 0 0 0 0-3-1-6-2-8-1-3-3-6-5-7-2-1-4 0-5 2-2 3-4 8-5 11-1 1-1 1-1 1-3 1-7 1-11 2-1 0-4 1-4 3 0 2 2 4 3 5 3 1 6 3 9 5 0 0 0 0 0 0-2 3-7 12-2 14 2 1 5-1 7-2 3-1 5-3 8-5 1 2 3 4 5 5 1 2 4 4 7 3 2 0 2-2 2-4 1-4 0-7 0-11 3-2 6-3 8-5 1-1 3-3 2-5zm-6 5c-2 1-4 2-6 3-1 1-1 1-1 2 0 2 0 4 1 6 0 1 0 2 0 3 0 1 0 2 0 2 0 2-1 2-2 2-2-1-4-3-5-4-2-1-3-3-4-5-1-1-2 0-2 0-1 0-1 1-1 1-3 2-6 5-10 6 0 1-2 1-3 0 0-1 1-3 1-4 1-2 2-4 3-6 0 0 0 0 0 0 1-1 2-2 1-3-2-1-4-2-6-3-2-1-6-2-6-4 0-2 2-1 3-2 1 0 2 0 3 0 2-1 5-1 7-1 1 0 1-1 1-2 0 0 1 0 1 0 1-2 2-5 3-7 1-2 3-7 5-4 3 4 4 9 5 14 0 1 2 1 3 0 3 0 7 0 11 2 3 1-1 3-2 4zM386 1470c3 2 6 4 9 5 3 1 8 2 11 1 6-3-1-12-3-15 0 0 0 0 0 0 4-5 8-9 12-13 1-2 4-5 3-8-2-3-6-3-8-3-5 0-10-1-15 0-1-5-3-9-6-13-2-3-4-7-7-7-3 0-4 3-5 5-2 5-3 11-5 16-4 0-8 1-12 3-2 1-6 2-6 5-2 6 8 11 13 13 0 3-1 6-1 9 0 3 0 7 1 10 2 9 15-4 19-8zm-17 6c0-1 0-2 0-3 0-4 0-9 1-13 0-1 0-1 0-2 0 0 0-1-1-1-3-1-16-6-12-11 1-2 5-3 7-4 2-1 5-1 8-1 0 0 0-1 1-1 0 0 1 0 1-1l3-10c1-2 2-8 5-8 2-1 5 4 6 6 2 4 4 7 5 11 0 0 0 0 0 0 0 1 0 2 1 1 3 0 7 0 10 0 2 0 4 0 6 1 2 0 3 0 4 2 1 3-3 6-5 8-3 3-5 6-8 9 0 0 0 1 0 1-1 0-1 1 0 2 1 2 2 3 3 5 0 1 2 3 2 4-1 2-3 2-4 2-5 1-11-2-15-6 0 0-1 0-1 0 0 0-1 0-1 0-4 3-7 6-10 9-2 1-5 3-6 0zM784 2203c-2 4-6 9-2 13 1 1 3 2 5 2 1 0 1-1 2-1 2-1 3-2 5 0 4 2 8 0 9-4 2-5-2-10-6-13 1-2 2-4 3-6 1-8 0-20-6-26 3-5 3-12-2-15-4-3-9-1-11 3-2-1-5-1-6 1-3 3-1 8 3 10 0 0 0 0 0 0 0 1-1 2-1 4 0 0 0 0 0 1-2 9-1 22 6 29 1 1 2 1 2 2 0 0 0 0-1 0zm8-33c1 1 2 3 3 5-5-2-10-3-16-2 0 0 0 0 0-1 1 0 1 0 1-1 0-6 7-5 10-3 0 1 1 2 2 2zm-13 6c0 0 0 0 1 0 5-1 11 0 16 2 1 4 2 8 2 13-5-5-12-7-19-6 0-3 0-6 0-9zm-3-15c0-3 3-4 5-1 0 1 2 0 2-1 0-5 6-6 9-3 2 3 1 7 0 10 0 0 0 0 0 0-4-3-9-3-12 0 0-1-1-1-1-1-1-1-3-3-3-4zm5 30c-1-1-1-2-1-3 6-1 12 1 17 5 0 1 0 1 0 1 0 0 0 0 0 1-2 5-6 8-11 5-3-2-4-6-5-9zm14 11c3 2 6 4 6 8 1 4-3 5-6 4-1 0-2-1-3-1-1-1-2 0-4 1-2 1-4 2-5-1-1-3 2-6 3-8 1-1 1-1 0-2 3 2 7 1 9-1zM705 1247c3 0 5-4 4-6-1-3-4-5-6-4 0 0-1 0-1 0-3 1-4 4-4 7 1 3 5 4 7 3zm-2-8c0 0 0 0 0 0 3 0 5 5 2 6-4 1-6-4-2-6zM565 1312c0-1 0-1 0 0-3 1-5 4-4 7 1 2 4 4 7 3 3-1 4-4 4-7-1-2-4-4-7-3zm2 8c-3 1-5-4-2-6 0 0 0 0 0 0 4-1 6 4 2 6zM642 1531c-1 0-1 0-1 0-3 2-5 4-4 7 1 3 4 5 7 4 3-1 5-4 4-7-1-2-4-4-6-4zm1 9c-3 1-5-5-2-6 0 0 1 0 1 0 3-1 5 4 1 6zM44 919c0 0 0 0-1 0-2 1-4 4-3 7 1 2 4 4 7 3 3 0 4-4 3-7 0-2-3-4-6-3zm2 8c-3 1-5-4-2-6 0 0 0 0 0 0 4-1 6 5 2 6zM1093 1158c0-3-1-6-2-9-1-2-2-4-4-4-5-2-9 6-10 10-4-1-10-1-12 2-2 5 5 7 7 10-3 3-6 9-3 12 2 1 5 0 7-1 2-1 4-2 6-4 2 2 3 4 5 5 1 2 3 4 5 3 4-2 4-9 3-12 3 0 9-1 9-6-1-4-8-5-11-6zm1 9c-1 0-1 1-1 1-1 0-1 1-1 1 1 2 2 11-2 10-1 0-2-2-3-3-1-1-2-2-3-4 0 0 0 0-1-1-1 0-2 0-2 1-1 1-2 2-3 2-2 1-4 3-5 3-4-1 0-7 1-9 1 0 1-1 0-2 0 0 0 0 0 0-1-1-1-2-2-3-2-1-3-1-4-3-2-4 7-3 9-2 0 0 1-1 1-1 0 0 1 0 1 0 1-2 5-11 7-10 2 1 3 4 3 6 1 2 1 4 1 6 0 2 2 2 2 2 0 0 1 0 1 0 2 0 5 1 7 3 3 3-5 3-6 3zM870 829c0 0-1 0-1 0-3 2-4 6-3 10 2 3 6 5 9 3 4-2 6-6 4-9-2-3-6-5-9-4zm4 11c-5 2-8-6-4-8 3-1 5 0 6 2 2 2 0 5-2 6zM75 2120c1 2 2 4 3 6 2 1 3 3 5 3 2 0 3-2 3-3 1-3 2-5 3-8 1 1 3 1 5 2 2 0 4 0 6-2 1-1 0-4-1-5-1-3-2-4-4-6 1 0 1 0 1-1 0-3 4-6 1-9-1-1-3-1-4-1-2 1-5 2-7 4-2-2-4-3-6-5-1-2-3-4-5-3-2 1-3 3-3 5 0 3 0 6 0 9-2 2-4 4-6 6-1 1-3 3-2 6 1 5 8 1 11 2zm-2-11c1 0 2-1 2-2-1-2-1-4-1-7 0-1 0-6 4-4 1 1 2 2 3 3 1 1 3 2 4 3 1 1 1 1 2 0 1 0 3-1 4-2 1 0 4-2 5-1 0 1-1 3-1 4-1 1-2 2-2 3 0 0 0 0 0 0-1 1-1 1 0 2 1 2 6 6 4 9 0 0-1 0-2 0 0 0-1 0-2 0-2-1-4-1-5-2-1-1-3 1-2 2 0 1-1 3-1 4-1 1-1 4-2 5-2 2-5-7-5-8 0-1-1-1-2-1 0 0 0 0 0 0-2 0-3 0-5 1-1 0-1 0-2 0-1 0-2 0-2-2 0-2 4-6 6-7zM1259 1540c0 2 2 4 3 5 2 2 3 4 5 6-1 3-5 12 0 13 5 2 10-3 13-7 2 4 6 8 10 7 5-1 4-9 3-13 2-1 5-3 7-4 1-2 3-4 3-6-1-6-9-4-13-4 0 0 0 0 0 0-1-3-2-6-4-9-1-2-2-5-5-5-2 0-4 2-5 4-2 2-3 5-5 8-4 0-11 1-12 5zm14-2c1 0 1-1 1-2 0-2 1-3 2-5 1-1 1-2 2-3 1-1 1-2 3-1 4 1 6 9 7 12 0 1 1 1 2 1 0 0 0 0 0 0 2 0 3 0 5 0 2-1 6 0 5 3-1 1-3 3-5 4-1 1-3 1-4 2-1 0-1 1-1 2 1 2 3 12-2 10-3 0-6-4-7-7-1-1-2 0-2 1-1 0-1 0-1 0-2 3-6 6-9 7-3 0-2-3-1-5 0-2 1-4 2-5 0-1 0-1 0-1 0-1 0-2-1-2-1-1-2-2-3-4-1-1-3-2-4-4-1-3 9-3 11-3zM292 2936c-3 0-7 2-10 3-2-3-3-6-6-8-1-2-3-4-6-3-2 0-3 3-3 5-1 4-2 7-2 11-3 1-5 2-8 4-2 2-4 4-5 7 0 5 9 6 13 7 0 0 1 0 1 0 0 3 0 6 0 9 1 3 2 5 4 5 3 0 5-3 6-5 2-2 4-4 5-6 2 1 4 2 6 3 3 1 6 3 8 1 3-2 2-5 1-7-1-3-3-6-5-9 3-2 5-5 8-8 1-2 2-5 1-8s-5-2-8-1zm4 7c-1 1-2 3-3 4-1 1-2 3-4 5-1 0-1 1-1 2 2 2 3 4 5 6 1 2 3 7-1 7-2-1-4-2-5-2-2-1-3-2-5-3 0-1 0-1-1-1 0 0-1 0-1 1-2 3-5 6-7 9-1 1-3 2-4 0 0-1 0-2 0-4-1-2-1-4-1-7 1-1 0-1-1-1 0 0 0 0 0 0-3 0-15-1-11-6 2-3 6-5 9-6 1 0 2-1 2-2 0-2 1-5 1-8 0-1 1-6 2-7 2 0 4 2 5 3 0 1 1 2 2 3 1 1 2 3 3 5 0 1 1 1 2 1 0 0 0 0 0 0 3-1 5-2 8-3 1 0 2 0 3 0 2-1 3-1 4 1 1 1 0 2-1 3zM263 2291c1-1 3-4 2-6 0-1-2-2-3-2-2 0-5 0-7 0-1-2-2-5-3-8-1-2-2-4-4-4-2-1-3 2-4 4-2 2-3 5-4 8 0 0 0 0 0 0-3 0-6-1-8-1-2 0-3 1-4 2-1 2 1 4 2 5 1 2 3 4 5 5-1 3-2 5-3 8 0 1 0 3 2 4 1 1 3-1 5-1 2-2 4-3 6-4 2 2 4 4 6 6 2 1 3 2 5 1 4-2 3-9 2-12 2-2 3-3 5-5zm-7 12c-1 2 0 2-2 2-1 0-3-2-4-3-1-1-3-2-4-3 0-1 0-1-1-1 0 0-1-1-2 0-1 1-2 2-4 3 0 1-3 2-4 2-1 0 0-4 1-4l1-5c1-2 0-2-1-2-1-1-2-2-3-3 0 0-2-2-2-4 0-1 0 0 1 0 1 0 2 0 3 0 1 0 3 0 5 1 0 0 1-1 1-1 1 0 1 0 2-1 0-1 3-11 5-10 1 0 2 4 3 5 0 2 1 4 1 5 0 1 1 1 1 1 0 1 1 1 1 1 2 0 4-1 6-1 0 0 2 0 2 1 1 0 0 1 0 1-2 3-4 5-6 7-1 1-1 1-1 1 0 1 0 1 0 1 1 1 1 3 1 4 0 2 0 3 0 3zM872 2170c0 4 5 5 9 5-1 4-1 11 3 11 2 1 3-1 4-2 1-2 2-4 3-7 3 1 5 1 7 2 2 0 5 1 6-1 4-2-1-8-3-10 2-2 6-5 4-8-3-3-8-2-11 0-1-2-2-4-4-6-1-2-2-4-5-3-1 0-2 2-3 3-1 3-1 6-1 9 0 0 0 0 0 0-3 1-10 4-9 7zm4-2c2-1 5-2 7-3 0-1 0-1 0-2 0 0 0 0 0 0 0-2 1-4 1-6 0-1 1-4 3-3 1 1 2 3 3 4 1 1 1 3 2 4 0 1 1 1 1 1 1 0 1 0 1 0 1-1 3-1 4-2 0 0 3 0 3 0 3 2-1 5-3 5 0 1 0 1 0 2-1 0-1 1 0 1 2 1 7 8 2 7-3 0-6-1-9-2 0 0-1 1-1 1-1 0-1 1-1 1 0 1-2 6-4 6-3 2-2-7-2-8 0-1-1-2-1-2-2 0-9 0-6-4zM1112 1907c-1-1-4-1-5 0-3 1-5 2-7 4 0 0 0 0 0 0-3-1-9-4-12-1-2 2 1 7 3 9-3 2-9 7-7 10 1 2 3 2 4 2 3-1 6-1 8-2 1 2 2 4 4 6 1 2 2 4 4 4 4 1 5-5 5-9 4 1 9 1 9-3 0-4-4-6-7-8 1-2 2-4 2-7 0-1 1-4-1-5zm-2 7c0 2-1 4-2 5 0 1 0 1 0 2 0 0 1 1 1 1 2 0 4 2 6 4 2 3-5 1-6 1-1 0-1 0-2 0 0 1 0 1 0 2 0 1 0 3-1 5 0 0-1 2-1 2-1 1-2-1-3-1-1-3-3-5-4-8 0-1-1-1-1-1-1 0-1 0-1 0-2 1-6 2-8 2-1 0-1-1 0-3 0 0 1 0 1-1 1-1 3-2 4-3 1-1 1-1 1-2-2-2-6-7-2-7 2-1 6 2 8 2 0 0 1 0 1 0 0-1 0-1 1-1 1-1 7-5 9-4 0 1-1 4-1 5zM142 1518c3 0 5-1 8-2 1 2 2 4 3 6 1 2 2 4 4 5 4 1 6-6 6-10 3 1 8 1 8-3 0-3-4-6-7-7 1-2 2-5 2-7 1-2 1-4 0-6-2-1-4 0-6 0-2 1-5 3-7 5-3-2-9-5-11-2-2 2 0 7 2 10-3 2-8 6-6 9 1 2 2 2 4 2zm-1-5c1-1 1-1 2-2 1-1 2-2 4-3 0 0 1-1 0-2-1-1-5-7-1-7 2 0 6 2 7 2 1 1 1 0 2 0 0 0 0 0 0 0 2-1 8-6 9-4 1 0 0 3 0 4-1 2-2 4-2 5-1 1-1 1 0 2 0 0 0 1 1 1 2 1 4 2 5 4 2 3-4 2-6 1 0 0-1 0-1 1-1 0-1 0-1 1 0 2 0 4-1 5 0 1 0 2-1 3-1 0-2-1-2-2-2-2-3-5-5-8 0 0 0 0-1 0 0 0 0 0-1 0-1 0-5 2-7 1-1 1-2 0-1-2zM1087 336c1-3 2-7 2-10 1-2 0-4-1-5-2-1-4 0-5 1-4 1-7 3-11 5 0 0 0 0 0 0-2-3-5-6-7-9-2-2-4-5-7-4-3 2-3 5-4 8-1 4-1 9-1 14-4 2-12 6-10 11 1 2 3 3 5 4 3 1 7 2 10 2 1 3 4 13 9 12 4-1 7-10 8-15 4 1 8 1 12 1 1 0 3 0 4-1 3-4-2-10-5-13 0 0 1-1 1-1zm-1 13c-3 0-9-1-12-2 0 0-1 1-1 1-1 4-2 9-5 12-4 3-4 0-5-2-1-2-2-4-3-7 0 0 0 0-1 0 0-1 0-1 0-1-4 0-10 0-13-3-2-3 7-8 9-9 1-1 1-1 0-2 0 0 0 0 0 0 1-3 1-6 1-9 0-2 1-7 2-8 1-2 3-1 4 0 1 1 2 2 3 3 2 2 4 5 5 7 1 1 3 1 3 0 0 0 0 0 0 0 2-1 4-2 6-3 1 0 4-3 6-2 3 0 1 4 1 5-1 2-1 4-2 6 0 0 0 1 0 1-1 0-2 1-1 2 3 2 9 9 3 11zM1261 200c1 3 5 4 7 5 3 1 7 1 11 1 0 4 1 7 1 11 1 3 2 7 6 8 5 1 9-6 11-11 4 2 10 5 14 2 2-2 2-4 1-5-1-4-4-7-6-10 2-4 3-8 5-12 0-2 1-6 0-8-2-3-5-3-7-2-4 0-8 1-12 2 0 0 0 0-1 0-3-3-7-11-13-8-2 2-2 4-2 6-1 3-1 7-1 10-1 0-1 1-1 2-3 1-6 3-9 4-2 1-4 3-4 5zm16-7c0 0 0 0 0 0 0 0 1-1 1-1 0-5-1-10 1-14 2-7 9 4 11 5 0 0 0 0 0 0 0 1 0 2 1 1 3-1 5-1 7-2 2 0 4 0 6-1 2 0 2 0 4 2 1 2 1 2 0 4 0 2-1 3-1 4-1 3-2 6-3 9 0 0 0 0 0 0-1 0-1 1-1 2 1 2 2 3 4 5 0 1 1 2 2 3 0 1 1 1 0 3s-1 1-3 1c-1 0-2 0-3-1-2 0-4-1-6-2 0 0 0 0-1 0 0-1-1-1-2 0 0 4-6 16-10 9-2-4-2-10-3-15 0-1 0-1-1-1 0 0 0 0-1 0-2 0-5 0-7-1-2 0-6-1-7-2-3-4 10-7 12-8zM904 2242c3-6 12-22 2-27-4-2-10 0-14 1-5 2-10 5-15 8-9 7-14 18-13 30-3 0-6 1-8 2-3 2-5 4-6 7 0 6 9 4 13 2-1 2-1 5 0 8 0 2 3 4 5 4 6-1 9-9 10-14 11-4 20-11 26-21zm-26 18c-1 0-2 0-2 1-1 4-2 8-5 11-2 2-5 2-6-1 0-2 1-5 2-7 0 0 0-1-1-1 0-1-1-2-2-1-2 1-4 1-6 2-1 0-3 1-3 1-1-1-1-2-1-3 0 0 0-1 1-1 3-3 7-5 11-5 1 0 1-1 1-2-1-9 2-18 9-25 6-6 17-12 26-12 13 0 1 22-2 27-6 8-13 13-22 16zM897 2236c-5-1-9-5-9-9 0-2-3-2-3 0 1 6 5 11 11 12 2 0 2-2 1-3zM895 2223c1 0 1-1 1-2 0 0 0 0 0 0 0-1-1-1-2-1 0 0-1 1 0 2 0 0 0 0 0 0 0 1 1 1 1 1zM1118 2050c3-2 4-6 2-9-2-3-6-4-9-3 0 0 0 1-1 1 0 0 0 0 0 0-3 2-3 6-1 9 2 3 6 4 9 2zm0-7c1 2 0 4-2 5-5 2-8-4-4-7 0 0 0 0 0 0 0 0 0 0 0 0 2-1 5 0 6 2zM653 42c0 0 0 1 0 1 4 2 9 4 14 4 9 1 19-1 27-6-2 3-4 6-6 9 0 0 0 0 0 1-13 8-28 18-30 35-1 5 0 11 2 15-1 14 8 27 20 33 14 8 31 5 45-1 8-4 16-10 22-17 14-5 25-15 32-29 2-3 7-11 3-14-2-1-4-1-6 0-5 2-10 4-15 4-1-6-2-12-6-18 0 0 0 0 0 0-2-8-8-14-17-17-1 0-1 0-1 1-4-2-9-3-13-1 0-1 0-3 0-4-2-12-11-24-22-30-9-6-21-5-31-1-10 5-22 12-23 24 0 5 2 9 5 11zm29 91c-2-1-5-3-7-5 11-4 23-1 31 8-8 1-16 0-24-3zm57-13c-2-10 5-20 16-22-4 9-9 16-16 22zm36-43c2-2 4-1 6 1 0 0 0 1-1 1 0 1-1 4-2 5-1 3-3 5-4 7-6 9-14 16-24 21 7-10 11-21 11-32 5 0 9-2 14-3zm-19 18c-14 2-22 14-19 27-3 3-7 5-11 7-5 3-11 5-18 6 0 0 0 0 0-1-9-10-22-13-35-8 0 0 0 0 0 0-6-6-10-13-10-21 3 4 8 7 13 10 15 6 32 0 45-7 14-7 27-17 33-31 1-3 2-6 2-9 3 9 2 19 0 27zm-11-8c-5 7-12 12-19 16-8 4-16 8-24 10-14 4-32 1-39-12 0-1 0-1 0-1-1-1-2-3-2-5-5-17 10-30 23-39 0 1-1 2-2 3-3 5-7 11-8 17-1 6 2 15 9 16 2 7 8 9 14 8 8-1 14-5 17-12 0-1 0-1 0-1 1 0 2-1 2-1 9-3 18-8 24-16 4-6 6-16 1-23 0-1 0-1-1-2 17 8 16 29 5 42zm-58 5c8 0 16-1 23-4-2 6-7 9-12 9-5 1-10 0-12-5 0 0 0 0 1 0zm34-49c0 0 0 0 0 0-4-1-6-5-5-9 1-2 2-3 2-4 0 0 0 0 0 0 2 2 3 5 3 8 0 2 0 4 0 5zm-51-32c8-4 18-6 26-3 1 0 2 1 3 1 2 1 3 2 4 3 0 0 1 0 1 0 6 4 10 9 13 15 0 0 0 0 0 1 0 0 0 0-1 0 0 0 0 0 0 0-1 2-2 3-2 5-1 2-2 5-1 8 2 3 5 5 8 6-1 11-7 22-17 28-1 1 0 3 1 2 11-7 18-18 19-31 0 0 1-1 0-2 1 1 1 0 1 0 9-4 17 5 17 13 0 9-7 15-13 20-14 9-30 13-45 12-1 0-1 0-1 0-4-1-6-5-7-10 0-5 3-9 5-13 5-8 11-16 16-24 1-1 1-2 0-2 3-1 5-3 7-5 2 0 0-3-1-2-9 6-19 10-29 11-5 1-10 1-15-1 3-1 6-1 9-3 1 0 0-3-2-2-3 2-7 2-11 2-2-2-4-4-4-7-1-11 11-18 19-22zM677 22c0 0 0 0 0 1 0 0 1 1 2 0 1 0 2 0 2 0 1-1 2-1 1-2 0-1-1-1-1-1-1 0-1 0-2 1 2-3 5-4 9-4 2 0 2-2 0-3-5 0-9 2-12 6-1 1 0 2 1 2zM898 1748c1 4 6 9 9 11 4 3 10 7 15 7 3 0 4-2 4-5 14 4 30 1 42-6 0 0 1 0 1 0 0 0 1 0 2-1 0 0 0 0 0 0 0 0 0 0 0 0 5-4 6-11 3-16 3-2 4-5 5-8 0-2 0-4-1-6-1-1-3-3-3-4 0-2 1-4 2-6 0-2-1-5-2-7-2-3-6-5-10-6 0 0 0-1-1-1-2-10-14-14-22-8 0 0 0 0-1 0-5-9-19-10-25-1 0 0 0 0-1 0-2-2-6-3-9-1-5 2-5 7-6 12 0 0 0 1 0 1-2 13-3 27 2 38-3 1-5 3-4 7zm5-45c0 0 0 0 0 0 0-2 0-5 1-7 2-5 7-5 10-2 0 0 0 1 1 1-1 7-3 13-1 20 0 2 3 1 2-1-1-7 1-14 2-20 5-9 17-8 22 1-6 7-11 14-11 24 0 1 3 1 3 0 0-10 5-16 10-23 0 0 0 0 0 0 7-7 18-4 20 5-1 1-3 2-4 3-1 2-2 5-3 7-1 2 2 2 3 1 0-3 1-5 3-7 1 0 1-1 2-1 0 0 0 0 0 0 8 0 13 8 9 15 0 0-1 0-2 1 0 0-1 0-2 1 0 0 0 1 0 2 1 0 1 0 2 0 1-1 1-1 2-1 0 0 1 0 1-1 4 5 4 12-1 15-7 3-15 4-23 6-2 0-1 2 1 2 7-1 14-2 22-5 2 5 1 10-3 13-15 9-36 12-52 3-18-11-17-33-14-52zm0 41c0 0 0 0 0 0 3 5 6 9 11 12 3 2 6 3 9 5 0 0 0 0 0 0-1 2-2 2-4 1-1 0-3-1-4-1-2-1-3-2-5-3-2-1-3-2-5-4-1-1-1-1-2-2-3-2-3-5 0-8zM930 1744c7-1 12-5 18-7 2-1 1-4-1-3-6 2-11 7-17 7-2 0-2 3 0 3zM914 1737c0 2 3 1 2-1-2-4-1-8-1-12-1-2-3-2-3 0 0 5-1 9 2 13zM925 1736c0-2 0-3 1-5 0-1-3-2-3 0 0 1-1 3-1 4 0 2 3 3 3 1zM1153 1675c2 13 7 25 15 36 1 0 1 0 2 0 0 1 0 1 0 1 6 8 14 14 24 18-1 4-1 7 0 11 0 0 0 0 0 1 0 0 0 0 1 0 1 2 3 2 5 2 3 0 6-2 9 1 3 1 5 3 7 4 7 6 15 13 23 19 1 1 3-1 2-2-8-6-16-12-23-19-3-2-6-4-9-6-2-1-3-1-5-1-2 0-5 2-7 1 0 0 0 0 0 0-1-4-1-8 0-12 0 0-1-1-1-1-4-2-7-3-10-5 0 0 0 0 0 0 1-8-8-19-16-15-6-8-11-17-13-27-1-5-2-10-1-15 0-5 2-9 8-9 2 1 5 3 7 4 3 1 6 3 8 5 3 15 15 27 31 28 0 0 0 0 0 0 2 4 4 8 5 12 0 1 1 1 2 1 2 1 4 1 6 2 2 0 3 0 5 1 1 1 3 5 0 5-1 0-1 0-1 0 0 0 0 0 0 0-1-2-4 0-3 1 6 9 12 17 18 26 0 1 3 0 2-1-5-8-11-16-16-24 4 0 5-4 3-7-3-5-10-3-13-6-1 0-1-1-1-1-3-11-10-21-19-28-5-4-11-8-17-11-5-4-11-8-17-9-12-2-11 13-11 20zm30 46c-4-3-8-7-11-11 5-1 11 6 11 11zm26-30c-13-1-24-11-27-23 11 6 20 13 27 23zM1204 1721c1 2 3 0 2-1-2-3-5-3-7-1-3 2-2 6 1 7 1 1 2-1 1-2-1-1-1-2-1-3s3-1 4 0zM1217 1714c1 2 3 0 2-1-1-2-4-3-6-2-2 1-3 4-2 6 1 2 3 0 3-1-1-2 2-4 3-2zM1214 1739c1-1 1-1 2-2 11 9 21 18 30 29 1 1 3-1 2-2-9-11-20-20-30-29 0 0 0 0-1 0 1-1-1-2-2-1-1 1-2 2-2 3-2 1 0 3 1 2zM1226 1727c2-1 0-3-1-2-2 1-3 2-5 3-1 1 0 3 2 2 0 0 1-1 2-1 8 9 16 18 24 28 1 1 3-1 2-2-8-9-16-18-24-28 0 0 0 0 0 0zM1209 1727c1 1 4 2 6 0 2-1 2-3 2-5-1-2-3-1-3 1 1 2-2 3-3 2-1-1-3 0-2 2zM995 833c0 0 0 0 0 0 1 3 3 7 4 10 1 2 1 3 3 4 2 1 5 0 7 0 3-1 7-2 11-3 16 9 35-4 32-22 1 0 3-1 4-2 1-1 1-3 0-4 0 0 0-1 0-1-2-3-4-10-8-10-2 0-3 1-4 3-2 2-4 5-5 8 0 0-1 1-1 1 0 0 0 0 0 0 0 2 0 3 1 4 1 1 1 1 2 1 1 8-6 14-13 11-8-2-9-12-3-17 0 0 0 0 0 0 0 0 1 0 1-1 7-13 15-27 22-41 11 0 14-16 5-22-11-8-26 6-18 17 0 0 0 0 0 0-7 14-15 27-22 41 0 0-1 1-1 1 0 8-10 13-16 7-6-5-4-12 2-16 1 2 4 2 5 0 0 0 1-1 1-1 0-1 0-1 0-1 1-3 2-5 3-8 0-2 1-4 0-6-3-4-10 0-13 0 0 1 0 1 0 1-2 0-4 1-4 3 0 1 0 2 1 3-16 9-14 33 4 40zm-1-38c1 0 1-1 1-2 0 0 0 0 0 0 0 0 0-1-1-1-1-1-1-3 0-2 1 0 1 0 2-1 1 0 3-1 4-1 2-1 5-2 4 1 0 3-2 7-3 10 0 0 0 1 0 1 0 0-1 1-1 0-1-2-2-2-3-1 0 0 0 0 0 0-9 5-10 17-2 22 8 6 19 1 20-9 0 0 0 0 0 0 8-14 15-28 23-41 0-1 0-1 0-2 0 0 0-1 0-2-8-9 8-20 15-11 5 5 2 16-6 15-1 0-1 1-1 1-7 14-15 28-23 42 0 0 0 0 0 0 0 0 0 0 0 0-7 7-5 19 4 22 10 3 19-5 17-15 0 0 0-1 0-1 0-1-1-1-2-1 0 0-1 0-1 0 0 0 0-1 0-1 0 0 0 0 0 0 0 0 0 0 0 0 1-2 2-3 3-5 1-1 2-3 3-4 2-2 2 0 3 2 1 1 2 3 3 5-1 0 0 1 0 1 0 0 1 1 0 2s-1 0-1 0c-1-1-2-1-2 0-1 0-1 1-1 1 4 17-14 29-28 21-1 0-1 0-1 0-1 0-1 0-1 0-2 0-4 1-6 2s-6 1-8 1c-4 0-6-9-7-13-1-1-1-1-2-1 0 0 0 0 0 0-16-6-17-28-2-35zM1046 768c0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 3 0 6-3 6-6 0-3-3-6-6-6-3 0-6 3-6 6-1 3 2 6 6 6zm0-9c4 0 4 6 0 6 0 0 0 0 0 1 0 0 0 0 0-1-4 0-4-6 0-6zM46 210c3 16 13 30 28 36-3 2-7 4-6 7 1 3 3 3 5 2-6 5-8 14-6 22 4 13 22 28 13 43-7 12-24 13-30 27-4 8 1 20 12 18 2 0 1-3-1-3-9 2-12-9-8-16 3-5 9-8 15-12 7-4 16-9 17-19 2-10-5-20-10-28-5-9-10-24 1-30 0 1 0 2 1 3 1 2 3 2 5 1 3-3 4-8 3-12 0 0 1 0 2 0 46 4 56-64 32-92-14-16-39-20-55-6 0 0 0 0-1 0 0 0 0 0 0 0-13 17-22 37-17 59zm35 38c1 2 1 4 1 6 0 1-1 6-3 3-1 0 0-2 0-3-1-1-1-2-2-3 0 0-1 0-2 0 0 1-1 1-1 1-1 1-1 1-2 0 0-1 1-2 2-2 1-1 3-2 4-2 0 0 0 0 0 0 1 0 2 0 3 0 0 0 0 0 0 0zm-16-95c0 0 0 0 0 0 0 0 0 0 0 0 14-12 36-9 48 3 14 13 18 34 15 52-4 19-16 37-36 38-21 1-37-13-43-32-6-22 2-43 16-61zM87 183c0-2-3-1-2 1 0 3 1 7 1 10 0 2 3 1 3-1l-2-10zM115 191c0-3 1-6 1-9 1-2-2-3-2-1-1 3-1 6-2 9 0 2 3 3 3 1zM101 204c3 0 5-3 5-6 0-2-2-2-3 0 0 3-4 3-5 0 0-2-3-2-3 0 1 3 3 6 6 6zM65 162c9 4 19 2 26-5 2-1 0-3-2-2-6 6-15 8-24 4-1 0-2 3 0 3zM94 52c-2 5-2 10-1 15 0 0 0 0 0 0-15 8-13 28 2 33 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 0 0 7 2 14 0 18-6 1 0 1 1 2 1 0 0 0 1 0 1 9 8 21 9 30 1 10-7 11-20 5-30 0 0 0 0 0 0 9 2 10-14 9-19-2-8-11-18-20-12 0 0 0 1 0 1-2-1-4-2-6-3-4 0-7 0-9 2-11-18-4-42 15-51 18-8 38 0 47 17 0 0 0 0 0 0-10 1-19 10-16 20 2 9 13 14 22 11 0 0 0-1 0-1 7 4 14 4 21 0 9 4 19 2 26-5 5-6 6-13 5-20 7-8 6-22-3-29-8-6-20-5-26 3-13-26-42-43-72-40-31 4-57 28-62 59-2 18 2 37 12 52 0 0 0 0 0 0zm50-6c0 0 0 0 0 0-2 0-3 1-5 2-1 2 1 4 2 2 2-1 5-1 7 0 2 1 3-1 2-2-1-1-2-2-4-2 1 0 1 0 0-1-1-2-2-5-4-6 0 0 1-1 1-1 0 0 0 0 0 0 6-3 12 4 14 10 1 3 1 18-6 16 1-2 0-4 0-6 0-2-3-1-3 1 1 5 0 10-4 14-2 1 0 3 2 2 1-1 2-3 3-4 4 8 3 17-4 23-7 7-17 7-25 1 3 0 5 0 8-1 2 0 1-3-1-3-6 2-12 1-17-3-1-1-4 1-2 3 1 1 2 1 3 2-3 4-9 6-15 4-12-4-14-19-4-26 0 3 0 5 1 8 1 2 3 1 3 0-2-6 0-13 4-17 2-1 0-3-2-2-1 1-2 2-3 3-1-5 1-10 6-14 4-3 10-2 15-4 4-1 6-6 11-7 7-2 14 1 17 8zm56-50c-11-26-42-37-68-25-26 14-34 47-19 72-2 0-5 0-7 1-18-28-9-66 21-81 29-15 64-1 77 28-1 1-2 1-2 2-1 2-2 2-2 3zm-61-13c-21 9-29 35-17 54-1 1-3 2-5 4 0 0 0 0-1 0-15-23-7-55 18-67 24-12 53-1 63 24 0 0 0 0 0 0 0 0 0 0-1 0-2 1-4 2-6 4-9-20-32-29-51-19zm101-3c7 5 9 16 4 23 0-1-1-2-1-3 0 0-1 0-1 0 0-2 0-3 0-4 0-2-3-1-3 1 1 3 0 7-2 9-1 2 1 4 2 2 1-1 2-2 2-4 6 15-8 31-24 26 2-2 3-4 5-6 1-2-2-3-3-1-7 12-23 12-31 1-1-2-3 0-2 1 1 2 3 4 4 5-6 2-13-1-16-7-3-8 4-17 12-18-2 3-4 6-5 10 0 1 2 2 3 0 2-5 5-9 9-12 2-1 4-2 6-3 1 0 2 0 3-1 2-1 2-4 3-6 2-1 4-3 6-4 6-3 12-2 17 2 2 1 4-2 2-3-4-3-8-4-13-4 0 0 0 0 0 0 0 0 0 0 0-1 6-6 16-8 23-3zm-138-14c21-22 54-29 81-15 14 8 25 19 31 34-3 0-6 2-8 4-11-23-36-38-61-35-26 4-47 24-51 50-2 14 1 29 9 41-3 1-5 2-7 4 0 1 0 1 0 1-17-26-15-61 6-84zM236 1138c-6 3-13 7-18 13-9 14 7 26 18 31 14 6 29 5 37-9 3-7 4-16 4-24 0-5 0-11-4-14 1-3 2-8-2-9-1-1-1-1-2 0 0-3-1-5-1-6-2-3-5-2-7 0-2 2-3 5-2 9 0 0 0 0-1 0-8-1-15 5-22 9zm23-7c1 2 2 4 3 5 2 1 3-1 2-2-3-3-4-7-2-11 1-1 2-3 3-2 1 1 1 4 1 4 0 2 0 5 0 7 0 2 3 2 3 0 0-1 0-1 0-2 0 0 0 0 0 0 0-1 0-1 0-2 0 0 1 0 1 0 1 0 1 1 1 2 1 1 0 3 0 4-1 0-1 2 0 2 5 4 4 12 3 18 0 6-1 13-4 19-8 13-23 11-35 5-6-2-11-6-15-11-3-7-2-14 4-19 5-3 10-6 15-9 6-3 13-8 19-8 1 0 1 0 1 0zM243 1140c-1 1-3 2-4 3-1 1-1 2 0 2 0 1 1 1 1 0 2-1 4-2 5-4 1 0 1-1 0-1 0-1-1-1-2 0zM258 1147c-1 2-2 3-3 5-1 2 2 3 2 1l3-5c0-2-2-3-2-1zM242 1158c-3 2-6-1-4-3 0-2-2-3-3-2-1 3-1 5 1 7 2 2 5 2 7 1 1-1 0-4-1-3zM528 31c31 7 66-10 81-39 10-21 9-46 7-68-1-2-3-2-3 0 1 19 3 40-4 58-5 15-16 28-29 36-28 18-63 14-87-9-12-13-20-30-21-48 0-2-3-2-3 0 1 33 26 63 59 70zM528 770c-6 4-10 9-11 16-1 8 2 13 7 19 1 1 3-1 2-2-5-5-8-11-6-17 1-6 4-10 9-13 10-6 22-4 28 7 3 6 3 13-1 18-3 6-11 9-17 5-5-3-10-9-7-15 4-5 9-5 13 0 0 2 3 0 2-1-5-9-16-7-18 3-3 11 12 21 22 17 12-6 14-22 7-32-7-10-20-10-30-5zM1088 2750c-9 4-15 16-14 26 0 8 6 15 13 17 0 0 0 1 1 1 11 2 22 1 29-9 6-8 6-20-1-28-6-8-18-12-28-7zm-12 21c1 0 1-1 1-1 0 0 0 0 0 0 8 5 13 13 15 22 0 0 0 0 0 0-10-1-17-10-16-21zm32 19c-4 2-8 3-12 3-1-1-1-1-1-1-1 0-1 0-1 0 0 0 0 0 0-1-2-10-8-19-17-24 4-10 13-19 25-17 0 0 0 0 1 0 0 0 0 1 0 1 2 10 7 20 14 27 0 0 1 1 1 1-2 4-6 9-10 11zm11-14c-7-7-12-15-14-25 10 4 17 15 14 25zM1089 2766c-1-1-3 0-2 1 2 2 4 4 5 7 1 2 3 1 2 0-1-3-3-6-5-8zM1103 2769c0 2 2 0 2-1-2-3-4-6-5-9-1-1-3 0-2 1 2 3 3 6 5 9zM1107 2776c0 5-6 7-10 5-2-1-3 1-2 1 6 4 14 0 14-6 1-2-2-2-2 0zM320 871c1 8 9 11 16 7-1 7-1 16 2 22 0 1 0 2 1 2 2 3 4 5 7 7 10 6 24 0 33-6 9-6 16-16 12-27-3-12-15-16-26-19 3-6 6-15-2-19-5-2-9 1-11 5-4-5-11-7-17-3-6 4-8 12-4 18-7 1-12 6-11 13zm22 30c13-9 23-23 27-38 0-1 0-2-1-2 3 1 5 2 7 2 0 1 0 1 0 1-1 17-8 32-20 44 0 0 0 0 0 0-3 0-6-1-9-2-1-2-3-3-4-5zm46-26c5 10-3 21-12 26-4 3-11 6-17 7 11-12 18-27 19-43 4 2 7 5 10 10zm-54-13c1 0 2-1 1-3-4-4-4-13 1-16 6-4 13-1 16 5 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 2 3 1 3-1-1-7 10-8 10 0 1 3-1 6-3 9 0 0 0 1 0 1-1 1-1 3 1 3 1 0 2 0 4 1-1 0-1 0-1 1-4 15-13 28-25 36-3-6-2-14-2-21 0-1-2-1-3-1 0 0-1-1-2 0-5 3-12 0-12-7 1-6 6-9 12-7zM342 878c0 2 3 1 3 0-1-2-1-3-1-4 0 0-1-1-1-1 0 0 0 0 0 0-1-2-3 0-3 1 1 1 1 3 2 4zM349 869c1 0 3 1 4 2 0 1 1 0 2 0 0-1 0-2-1-2-1-1-2-2-3-3-1-1-2 0-2 0-1 1 0 2 0 3zM357 864c0 0 1 0 2 0 0 1 1 0 1-1 1 0 0-1-1-1 0-1-1-1-1-1-1 0-2 0-2 1-1 1 0 2 1 2zM288 52c8 2 14-4 19-10 4 10 18 10 27 6 11-4 20-12 27-21 15-18 22-43 18-66 0-1-2-1-2 0-1 1-2 2-2 3-1 1 1 3 2 1 0 0 0 0 0 0 3 19-3 39-13 55-6 8-13 16-22 21-9 6-30 14-33-3 0-1-2-1-2 0-5 6-16 18-23 8-4-6-2-14 0-19 6-14 15-26 27-34 1-1 0-3-2-2-14 10-28 27-30 45 0 6 2 14 9 16zM701 881c-11 1-19 12-17 23 3 13 17 19 29 13 1 0 0-3-2-2-9 5-20 1-24-9-3-9 2-18 10-22 9-3 21 2 20 12-1 5-4 9-10 9-2 0-5-1-6-3-3-4 1-13 6-7 1 1 3-1 2-2-7-8-16 4-10 11 7 8 19 3 20-6 2-11-8-19-18-17zM1101 397c-8 16-16 31-24 46-7-6-19-3-21 8-1 10 10 16 18 12 2 8 12 13 19 8 7-5 6-16 0-20 8-15 17-30 25-45 7 5 18 1 19-7 2-9-8-16-16-14-2-7-10-13-18-9-7 4-8 16-1 21 0 0 0 0 0 0 0 0-1 0-1 0zm3-2c-5-4-5-11-1-15 6-6 15 0 16 7 0 1 1 1 2 1 7-3 16 4 13 12-2 6-11 8-15 4-1-1-2-1-3 0-8 16-17 31-26 47-1 0 0 1 0 2 6 3 8 12 2 16-6 5-15-1-15-8 0-1-1-1-2-1-7 5-17 0-16-9 1-9 12-11 18-5 0 1 1 0 2 0 8-16 16-32 24-47 1-1 0-2 0-2 1 0 2-1 1-2zM984 637c0 0 0 0 0 0-4-1-9 2-9 6-1 4 2 7 6 8 4 1 7-2 8-5 1-4-1-8-5-9zm-2 12c-2-1-5-2-5-5 0-3 3-5 6-5 0 0 0 1 0 1 5 1 4 9-1 9zM1100 554c-1 1 0 4 2 3 11-8 28-25 20-40-3-6-9-9-16-6-6 3-8 9-9 15-4-3-8-7-14-6-5 1-8 6-9 11-2 13 13 23 24 26 2 0 2-2 1-3-9-2-18-7-21-16-2-5-2-11 3-14 6-3 12 2 16 6 1 0 3 0 3-1 0-7 2-15 10-16 8-2 12 7 11 14-1 11-11 21-21 27zM337 1361c1 1 2-2 0-2-12-2-15 15-4 20 13 6 23-8 22-20-1-12-12-20-24-18-13 2-21 14-20 26 2 16 17 26 32 25 2-1 2-3 0-3-12 1-25-6-29-19-3-12 4-25 17-27 12-1 23 8 22 20-1 7-6 13-12 14-5 1-10-1-12-5-3-5 1-12 8-11zM894 1173c-1-3-2-5-5-7-5-3-11-1-14 4-1 1 2 2 2 1 5-8 15-3 14 6-1 2-2 5-2 8 0 4 3 7 7 8 4 2 9 0 14-3 3-2 8-5 13-5-1 3-1 7 0 10 0 1 0 1 0 1 2 2 2 5 4 7 1 0 2 1 3 1 0 0 0 0 0 0 33 6 65 10 97 15 1 0 1 0 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0 1 0 10-8 10-23 0-31 0-1-1-1-1-1 0 0-1 0-1 0-30-5-59-10-89-14-2-2-6-2-9 0-3 2-5 6-6 9-2 0-4 0-7 1-4 2-7 5-11 6-4 2-13 3-14-4 0-4 3-8 3-12zm133 17c9 7 9 19 0 27-30-5-60-9-90-14 6-5 6-17 5-23 0-1-1-3-1-4 28 4 57 9 85 14 1 0 1 0 1 0zm-92-15c3 0 3 1 4 3 0 2 1 4 1 5 0 5 0 11-3 15-1 2-3 4-5 4-4 0-4-2-5-5-1-1-1-1-1-2 0 0 0 0 0 0-1-4-2-7-1-10 2 0 3 1 5 2-1 0-1 0-1 1-1 1 1 3 2 1 0 0 1-1 1-1 1-1 1-1 0-2-2-2-4-3-6-4 0 0 1-1 1-2 2-3 4-5 8-5zM869 1182c1-2 2-3 3-5 1-1-1-3-2-1-1 1-2 3-3 4-1 2 1 3 2 2zM861 1172c0 1 0 1 1 1 1 0 3 0 4 0 1 0 1-1 1-2 0 0-1-1-1-1-1 0-3 0-4 1-1 0-1 0-1 1zM866 1160c-2-2-4 0-2 1 1 2 2 3 3 4 2 1 3-1 2-2-1-1-2-2-3-3zM874 1157c0 1 0 3 0 4 0 1 3 1 3 0 0-2 0-3-1-4 0-2-2-2-2 0zM875 1178c0 0 0 1 0 1 0 1 1 2 2 3 0 0 1 0 1 0 1 0 1-1 1-2-1 0-1-1-2-2 0-1-1-1-2 0zM4 1539c-1 1 0 3 2 2 18-15 27-40 23-63-1-2-3-2-3 0 4 23-4 47-22 61zM35 1482l2 21c0 2 3 1 3-1l-2-20c0-2-3-1-3 0zM478 1146c0 0 0 0 0 0 0-1 0-2 0-3-2-6-4-23-15-14-9 8-15 20-18 32 0 0 0 1 0 1 0 0 0 0 0 0 6 8 18 12 28 9 5-1 7-4 8-8 1 0 1-2 0-2 0-5-1-10-3-15zm1 15c-11 4-22 1-29-7 0 0 0 0 0 0 1-4 3-7 5-11 5 7 14 8 21 5 1 3 2 6 3 9 0 2 0 3 0 4zm-6-29c1 4 2 8 3 12 0 1 0 1 0 1-7 4-15 3-20-4 0 0 0 0 0 0 1-1 1-2 2-3 2-3 11-15 15-6zm2 36c-2 1-4 2-7 2-7 1-16-3-21-9 1-2 1-3 2-5 8 8 19 11 30 8-1 1-2 3-4 4zM590 1048c-5-1-8 5-11 9-3 5-7 11-10 17-5-5-17-17-21-8-1 2-1 5-1 7 0 4-1 8-1 12-1 7-1 15-1 23 0 0 0 0 1 1 0 0 0 1 0 1 20 17 48 20 71 7 0 0 1 0 1-1 0 0 0 0 1-1 2-7 4-14 5-22 0-4 1-7 1-11 0-3 1-7 0-10-3-10-15 3-20 8-2-8-4-15-7-22-1-4-3-10-8-10zm8 18c2 5 4 10 5 16 0 0 0 1 1 1 0 1 1 1 2 0 3-3 6-6 9-9 1 0 2-1 3-2 4 0 5 2 4 4 1 2 0 5 0 8 0 10-2 19-5 29 0 0-1 0-1 1 0 0 0 0 0 1 0 0 0 0 0 0-22 12-49 9-68-7 0 0 0 0 0 0 0 0 0 0 0 0 0-10 0-20 1-29 0-5 0-15 8-12 4 2 8 6 11 10 0 1 2 2 2 0 2-4 5-8 7-12 1-2 3-4 4-6 1-2 3-6 5-7s6 1 7 2c1 1 1 2 2 3 1 3 2 6 3 9zM571 1098c-2 7 1 14 8 17 0 0 0 1 0 1 8 2 16-2 18-9 2-8-2-16-9-18-7-2-15 2-17 9zm24 7c-2 6-7 9-13 9 0 0 0-1 0-1-6-1-11-7-9-13 2-6 8-10 14-8 6 1 9 8 8 13zM732 1051c-6 2 0 8 2 10 7 8 14 15 22 22 8 7 16 14 25 21 7 6 14 13 23 16 2 0 5 1 9 0-1 6-2 16 4 19 5 1 7-2 8-6 1 1 2 2 3 3 4 3 11 7 15 3 4-4 2-11 0-16-1 0-1-1-1-1 7 1 18 0 12-9-4-5-10-7-16-8 1-2 0-4-1-6-3-2-7-2-11 0 0-3-2-4-3-6 0 0 0-1 0-1-14-11-29-22-45-29-8-4-16-7-24-9-5-1-9-2-14-3-2-1-6-1-8 0zm90 82c-1 2-2 3-5 1 0 0 0-1-1-2-1-4-1-8 0-12 0 0 0 0 0 0 1-1 2-1 3-1 0 3 2 6 3 10 0 1 0 3 0 4zm20 0c-2 9-12 1-14-2-1-1-2-2-2-3 0-1 0-1 0-1-2-3-3-6-4-10 0 0 0 0 0 0 1-1 2-2 2-2 1 0 1 0 1 0 4 1 7 2 10 4 0 1 1 2 1 2 0 0 1 0 1 0 2 3 6 8 5 12zm8-14c-3 2-8 0-12-1-3-3-7-5-12-6 1-1 1-2 1-3 1 0 1 0 1 0 2-1 4-1 6-1 0 0 1 0 2 0 3 0 7 1 10 3 2 2 7 5 4 8zm-18-18c2 1 3 2 2 3-2 0-4 1-6 1 0-1-1-2-1-3 2-1 4-1 5-1zm-92-47c10 2 20 5 30 9 0 2-1 4-3 6-1 2 1 4 3 3 2-2 3-5 3-7 2 1 5 2 7 3 15 7 28 16 40 27 0 0 0 0 0 0 4 4 6 13 1 17-7 7-17 5-25 0-7-5-13-10-20-16 0 0 1 0 1 0 6-2 10-6 12-11 1-2-3-3-4-1-1 4-5 7-9 9-1 0-1 2-1 2-6-5-11-10-17-15-3-3-5-5-8-8 1 0 1 0 2 0 0-1 1-2 0-3 0-1-1-1-2 0-1 0-2 0-2 1 0 0 0 0-1 0-2-2-4-5-6-7-2-2-4-4-6-6-2-2-2-3 0-3 2 0 3 0 5 0zM800 1105c0-1 1-2 2-2 0-1 1-2 0-3-1-1-2-1-3 0 0 1-1 2-2 3 0 0-1 1 0 2 1 1 2 1 3 0zM328 744c-1-1-2-1-3-2-2 0-3 2-1 3 1 0 2 1 2 1-1 3-2 7-2 10 0 9 6 16 14 19-1 0-2 2-2 3 0 1 1 1 1 1 1 0 2 0 2-1 0-1 0-1 0-1 1 0 1-1 1-2 2 1 4 1 6 1 0 0 0 0 1 0 2 0 5-1 7-2 1 1 2 2 3 2 1 2 3 0 2-2-1 0-2-1-3-2 3-1 6-4 7-7 1 0 2 0 2 0 1 0 2 0 2-1 0-1-1-1-2-1 0 0 0 0-1 0 1-3 2-5 1-8 4-1 6-4 4-8-1-3-4-5-8-4-2-3-5-5-8-6 1-1 1-2 1-3 1-2-2-3-2-1-1 1-1 2-1 3-3-1-5-1-8-1-1 0-2 0-3 1-1-1-2-2-2-3-1-2-3-1-2 1 0 1 0 2 1 3-4 1-7 4-9 7zm-1 12c0 0 0 0 0 0 2-2 6 2 6 4 1 2 0 4-2 6 0 0-1 0-1 0-2-3-3-6-3-9 0 0 0 0 0-1zm16 17c1-4 7-6 10-1-2 1-4 1-7 2 0 0 0-1 0-1-1 1-2 1-3 0zm24-25c1 1 0 3-2 4 0-2-1-4-2-6 1-1 3 0 4 2zm-4 5c0 4 0 7-2 9 0 1 0 1 0 2 0 0 0 0 0 0-2 2-4 4-6 6-4-6-13-4-15 3-3-1-6-3-8-5 4-2 5-7 3-11-1-2-5-5-8-4 0-2 1-4 2-6 0-1 1-1 1-1 0-1 1-2 2-3 5 7 16 4 18-5 6 2 11 8 13 15zm-16-15c-1 6-9 8-13 3 3-2 6-3 9-3 1 0 3 0 4 0zM351 748c-3 2-5 6-4 9s6 6 9 4c4-1 6-5 5-9-1-3-6-5-9-4 0 0-1 0-1 0 0 0 0 0 0 0zm4 11c-2 1-4-1-5-3-1-2 0-4 2-5 0 0 1 0 1 0 5-2 8 6 2 8zM1421 28c0-4-1-8-2-13 0-2-3-1-3 1 1 4 2 9 2 13 1 2 4 1 3-1zM1433 14c0-2-3-2-3 0 0 4 0 9 0 13 0 2 3 2 3 0 0-4 0-9 0-13zM1433 39c1-1 0-3-2-2-3 2-8 2-10-2-2-1-4 1-2 3 3 4 9 4 14 1zM159 983c-3-4-8-2-12 0-15 5-29 10-43 17-17 7-34 16-50 25-1 0-1 1 0 2 1 8 4 16 8 23 0 0 0 0 0 0-11 8-18 21-20 34-1 11 1 27 12 33 10 5 22 0 29-9 4-6 6-13 7-20 1-3 1-7 2-11 6 3 12 5 19 5 1 0 1 0 1-1 1 0 1 0 1 0 17-28 32-56 45-85 1-4 5-9 1-13zm-92 38c7-4 15-8 22-11 0 0 1 1 1 1 3 13-14 22-23 10zm20 71c-3 12-12 26-26 24-15-2-18-21-16-33 2-12 9-23 18-31 7 10 15 18 26 24-1 5-1 11-2 16zm9-26c-3 2-5 4-6 7-2-1-4-2-6-3 0 0 0-1 0-1-7-9 7-17 15-13 8 4 8 15 1 20 0 0 0 1 0 1-3-1-5-2-8-3 1-2 3-5 5-6 2 0 0-3-1-2zm44-40c-5-3-8-10-5-17 3-6 9-8 16-7 0 0 0 1 0 1-1 3-2 5-3 8-2 5-5 10-8 15zm13-27c0 0 0 0 0 0-8-2-18 2-21 11-3 7 0 15 7 19-1 1-2 3-3 5-8 15-16 30-25 45 0 0 0 0-1 1-2-1-5-1-8-2 9-7 7-22-4-25-9-3-20 5-18 14-12-10-21-24-23-41 2-1 5-3 8-4 10 15 33 3 27-14 4-1 7-3 10-5 9-3 17-7 26-10 4-2 8-4 12-5 4-1 9-4 13-4 9-1 2 11 0 15zM117 1020c-8-4-17 0-20 8-3 8 1 17 9 19 0 0 1 0 1 0 6 2 14 0 17-7 4-7 1-17-7-20zm5 19c-3 6-11 8-17 5 0 0 0 0 0 0-6-3-8-9-6-15 3-7 11-10 17-7 7 3 9 11 6 17zM1175 789c3 2 8 2 11 0 2-1 2-2 3-4 1-1 1-3 2-4 1-2 3-3 6-4 9-5 11-17 3-24 0 0-1-1-1 0-1-1-1-1-1-1-7 0-14 0-22 0 0-2-1-4-3-6 0 0 0 0 0 0-5-5-12-8-18-7 0 0-1 1-1 1 0-1 1-1 0-1-1-5-3-10-5-14-1-3-2-8-4-11-4-3-6 1-7 4-6 0-13-2-15 5-1 4-1 7-2 11-1 5-5 6-8 9-10 12 21 13 29 13-2 5 2 10 6 13 4 4 10 5 16 4 4 5 7 10 10 14 0 1 1 1 1 2zm23-34c0 0 0 0 0 0 4 4 6 9 3 14-2 5-6 5-10 8-2 1-3 3-4 5-1 2-1 4-3 5-3 1-5 1-7 0 0 0 0 0 0 0-5-7-9-14-14-20 0 0 0 0 0 0 0-2 0-3 1-4 1 1 2 3 3 5 1 1 3 0 2-2-1-2-3-4-4-6 0-1 1-1 1-2 0 1 0 1 1 1 2-1 4 0 5 0 2 1 3-1 2-2-2-1-4-1-6-1 1-1 2-1 3-2 0 0 0 1 0 1 10-1 18 0 27 0zm-84-9c1-3 6-4 7-6 2-3 3-6 3-9 1-4 0-6 3-9 3-2 3-2 6-2l6 1c1 0 1-1 1-2 0-2 1-2 4-2 0 2 1 3 1 5 1 1 1 3 2 5 2 4 3 8 5 12 0 1 0 1 1 1-1 1-2 1-3 2 0 0 0-1-1-1-1-1-3-3-4-5-2-1-3 1-2 2 1 2 3 4 5 5 0 0 0 0 0 0 0 1-1 2-2 3 0 0 0 0-1-1-3 0-6 0-9-1-1 0-2 3 0 3 3 0 6 1 9 1 0 0 0 0 0 0-1 2-1 4-2 6 0 0 0 0 0 0-7 0-14-1-20-3-3 0-10 0-9-5zm38 23c-4-2-8-7-8-11 0 0 1 0 1-1 1-5 4-14 10-15 6-1 13 2 17 6 0 0 0 0 0 0 1 1 1 3 2 4-1 0-1 0-1 0-1-1-1-1-2-1-4 2-7 4-8 8-1 0-1 0-1 0-1 3-2 5-2 8 0 1 1 1 1 1 1 1 1 2 2 2-4 1-8 0-11-1zM1187 677c2 15 17 22 31 25 0 0 1 1 1 1-1 4-2 7-3 11 0 2-1 5 1 6 3 2 6-1 8-4 2 4 6 7 9 2 4-6 3-15 0-21 0 0 0 0 0 0 4-5 5-13 4-19-2-14-12-24-26-25-13 0-27 9-25 24zm47 33c0 2 0 3-1 5-1 2-2 2-6 1 0-1 0-2-1-3 0-1-2-2-2-1-1 2-2 3-2 4-3 4-3-1-3-3l2-10c5 1 8-1 11-4 2 4 3 7 2 11zm1-36c3 10-1 32-16 26 0 0 0 0 0 0 0 0-1 0-1 0-4-1-8-2-11-4 10-7 17-17 19-30 1-1-2-2-2 0-2 12-9 22-20 29 0 0 0 0 0 0-6-3-10-7-13-13-6-13 6-25 19-26 11 0 21 7 25 18zM1210 664c-1 1-1 2-2 3-1 1 2 2 3 1 0-1 1-2 1-3 1-1-1-3-2-1zM1198 665c1 0 2 0 2-1l2-3c0 0 0-1-1-1 0-1-1-1-2 0l-1 3c0 1 0 2 0 2zM1201 675c-1 2-2 4-4 3-2 0-3-3-1-4 2 0 1-3 0-2-4 1-4 6-1 8 3 3 8 0 8-4 0-2-2-2-2-1zM1024 1287c3 4 8 6 12 8 0 0 0 0 1 0 1 2 3 3 6 3 1 1 3 1 4 0 0 0 0 0 0 0 12 5 25 7 38 6 0 0 1 0 1 0 0 0 0-1 1-1 0 0 0 0 1 0 3-4 6-9 6-14 0-6-4-10-6-16-3-7 0-14-1-21-1-6-4-11-7-15 0-4-2-8-6-10-4-1-8 1-10 5-1 0-1 0 0 1-6 1-11 5-14 9-5 6-6 14-12 18-4 4-10 5-13 11-2 5-3 10-1 15 0 0 0 0 0 1zm4 0c2-1 5-1 8-2-1 2-1 4-1 6-3-1-5-2-7-4zm16 9c-6-1-8-7-5-11 4 0 7 0 11 1 0 0 0 0 0 0 2 5-1 10-6 10zm6 0c3-2 4-6 3-10 11 3 22 8 30 16-11 0-22-1-33-6zm27-61c-3-3-6-4-10-3 3-4 10-2 10 3zm-12 0c0 0 0 0 0 0 0 0 1 0 1 0 4-1 8 0 10 3 1 0 1 1 1 1 5 4 7 10 8 16 0 5-2 10-1 15-11-10-26-14-40-11 2-4 3-8 6-12 3-6 8-10 15-12zm-35 34c3-3 7-4 10-6 0 0 0 0 0-1 16-4 34 0 45 13 0 0 1 0 1 0 1 3 3 6 4 9 1 2 1 5 1 8-3-4-6-6-10-8-2 0-2 2-1 3 4 1 7 3 8 6 1 1 2 1 2 1-1 2-2 5-4 7-16-16-39-22-60-17 0-2 0-4 0-6 11-4 22-4 33 0 1 1 3-1 1-2-11-4-22-5-33-1 0-2 2-4 3-6zM1015 1276c-2 5-2 11 2 16 1 1 3 0 2-2-3-4-3-8-1-13 1-1-2-3-3-1zM1013 1288c-1-1-1-2-1-3 0-1-3-1-3 0 0 2 1 4 2 5 1 1 3-1 2-2zM1101 1251c1-7-1-13-5-17-2-1-4 0-2 2 4 3 5 9 5 14-1 2 2 2 2 1zM1106 1242c0-2 0-5-2-6-1-2-3 0-2 1 1 2 2 3 2 5 0 2 2 2 2 0zM70 1933c1-1 0-3-2-2-9 5-1 17 7 16 11 0 14-14 9-22-6-10-19-13-28-3-8 8-10 21-3 31 8 10 23 10 32 2 2-1 0-3-2-2-7 7-19 7-26 0-8-8-7-20 0-28 4-5 9-8 15-6 5 1 10 6 11 11 2 5 0 12-5 14-6 2-16-6-8-11zM129 547c-6 0-10 5-13 10-5-4-10-6-16-5-6 1-10 5-11 11-3 16 15 22 27 25 1 0 1 0 1 0 0 1 1 2 2 1 10-7 21-20 19-33-1-5-4-9-9-9zm5 18c-2 9-8 17-16 22 0-1 0-1-1-1-10-3-23-6-25-18-2-5 1-12 7-13 6-2 12 1 16 5 1 1 2 1 2 0 3-4 8-12 14-10 6 2 5 10 3 15zM57 706c1-3 0-6-3-7-4-2-6 1-7 3-3 7 1 14 8 14 8-1 13-9 10-16-3-9-13-11-21-8-2 0-1 3 0 2 5-1 11-2 16 2 3 3 5 9 2 14-3 3-9 4-12 1-1-2-2-4-1-6 0-1 0-2 1-3 2-2 5 1 5 3-1 2 2 3 2 1zM163 363c-4-3-9-1-11 3-2-1-5 0-6 1-3 4-1 8 3 10 0 0 0 0 0 0 0 1-1 3-1 4 0 0 0 1 0 1-2 9-1 22 6 29 1 1 2 2 2 2 0 0 0 0-1 0-2 4-6 9-2 13 1 2 3 3 5 2 1 0 1 0 2-1 2-1 3-1 5 0 4 2 8 1 10-3 2-6-3-10-7-13 2-2 2-4 3-7 1-8 0-19-6-26 3-5 3-11-2-15zm6 38c-5-5-12-6-19-5 0-4 0-7 0-10 0 0 1 0 1 0 5-1 11 0 16 2 2 4 2 9 2 13zm-19-18c0 0 1 0 1 0 0-1 0-1 0-1 0-6 7-6 11-4-1 1 0 2 1 2 1 2 2 3 3 5-5-2-10-2-16-2zm-3-12c0-2 4-4 5-1 0 1 2 0 2-1 0-5 6-6 9-2 2 3 2 6 0 9 0 0 0 0 0 0-4-3-9-3-12 0 0-1 0-1-1-1-1-1-3-3-3-4zm5 30c0-1-1-2-1-3 6-1 12 1 17 6 0 0 0 0 0 0 0 0 0 1 0 1-1 5-6 9-11 5-2-2-4-6-5-9zm20 19c1 4-3 5-6 4-1 0-2-1-3-1-1 0-2 0-3 1-2 1-5 2-6-1-1-3 2-6 3-8 1 0 1-1 0-2 4 2 7 1 9-1 3 2 6 5 6 8zM9 39c6-10 4-24-4-32-2-1-3-2-5-3v3c1 1 2 2 2 2 8 7 10 20 5 29-2 3-4 5-7 7v4c4-2 7-6 9-10zM12 182c2-4-2-10-5-14-2-2-4-5-7-7v3c1 1 1 2 2 2 2 2 3 4 5 6 0 1 1 2 1 3 1 2 2 3 1 4-3-3-6-6-9-8v3c2 2 5 4 7 7-2 2-2 2-4 2-1 0-2 0-3 0v3c4 0 10 1 12-4zM6 131c-2-2-4-3-6-3v3c0 0 0 0 0 0 1 0 2 0 2 1-1 0-1 0-2 0v3c1 0 2-1 3-1 0 0 1 0 1 0 0 2-1 6-4 10v5c1-2 3-4 4-6 2-4 5-8 2-12zM6 376c2-4-1-7-5-10 1-1 2-2 1-4 0-2-1-3-2-3v10c1 1 2 1 3 2 1 3 0 7-3 5v3c0 0 0 0 0 0 3 1 5-1 6-3zM19 731c-6-9-12-17-19-24v4c6 6 12 13 16 21 1 2 4 0 3-1zM18 763c5 2 9 5 15 6 5 0 9-2 14-3 7-1 14 2 18 7 1 2 3 0 2-1-3-4-7-7-12-8-7-2-12 1-19 2-7 1-14-5-21-6-4-1-9-1-13 1-1-2-1-3-2-5v8c6-2 12-3 18-1zM11 1149c5-1 3-11 2-14 0 0 0-1 0-1 2-1 5-2 7-4 1 0 2-1 2-2 1 0 1-1 1-2-1-2-3-2-4-2-3 0-5-1-8-1 0 0 0 0 0 0-1-4-3-7-5-11-1-2-2-5-5-5 0 0-1 0-1 1v3c0 0 1 0 1 0 4 1 6 9 7 13 0 0 1 1 2 1l1 9c-1 0-1 0-1 1 1 2 3 12-1 11-4-1-6-4-8-7 0-1-1-1-1-1v4c2 4 7 8 11 7zM0 1732v7c6-12 11-24 14-37 2-6 4-14-1-20-3-3-8-5-13-7v3c5 1 10 4 12 8 4 6-1 18-3 24-3 8-6 15-9 22zM29 2110c9-9-15-19-20-22-3-1-6-3-9-5v3c5 3 9 6 14 8 3 2 6 3 8 5 4 2 11 11 1 11-5 0-11-6-15-8-3-2-5-4-8-6v3c6 4 11 9 18 12 3 2 8 3 11-1zM1389 461c-7 1-13 5-15 12-1 1-1 3-1 5-1 0-3 0-5 0-1 0-1 3 0 3 2-1 4-1 5-1 1 4 3 7 6 9-11 5-14 19-8 30 2 3 5 5 8 7 1 5 2 9 2 13 1 2 3 1 3-1-1-3-1-6-2-10 6 3 13 4 20 3l1 8c1 2 3 1 3-1-1-2-1-5-2-8 1 0 1 0 1 0 12-4 23-13 23-27-1-10-10-19-20-17 5-12-5-28-19-25zm36 47c-2 10-11 17-21 20-1-1-2-1-2 0-10 2-22-1-28-10-6-9-3-22 7-26 0-1 0-1 0-1 3 1 7 2 10 2 2 0 2-3 0-3-3 0-6 0-9-2 0 0 0 0 0-1-3-1-5-4-6-7 1 0 2 0 2 0 2 0 2-3 0-3 0 0-1 0-2 0 0-1 0-3 1-4 2-6 8-9 13-10 13-1 20 13 15 23 0 1 0 1 0 1 0 0 0 0 0 0-2 1-1 4 0 3 12-5 22 6 20 18zM1386 473l-1 1c-1 1 1 3 2 2l1-1c1-1-1-3-2-2zM1399 503c-1-1-3 0-2 2 5 10 18 11 26 3 1-1-1-3-2-2-7 7-17 6-22-3zM1423 2901c0 0 0 0 0 0-1 0-1 0-1 0 0-1-1-1-2 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 4 0 8-3 11-4 4-9 0-9-5 0-4 2-8 2-12 0-1 0-2 0-3-1-1-2-2-3-1-5 6-14 3-14-5 0 0 0-1 0-2 0 0 0 0 0 0 0-1 0-1-1-1 0-1-1 0-1 0-3 11 8 18 16 12-1 7-5 18 4 21 8 3 11-6 11-12 4 2 9 1 8-5 0-1-3-1-3 0 1 5-3 3-4 1zM1393 2868c-8 1-14 4-19 9 0 0 0-1-1-1-19-10-41 7-34 28 0 2 3 1 2 0-5-19 14-35 31-25 0 0 0 0 0 0-3 3-5 7-7 12 0 1 0 1 0 1-1 0-1 0-2 0-14 1-25 11-27 25-1 11 5 25 16 28-1 3 0 7 3 9 2 0 3 0 4 0 4 25 11 48 20 71 1 1 2 2 3 0 12-29 23-58 35-87 9-3 16-11 18-21 3-12 1-28-7-38-8-9-24-12-35-11zm-38 78c0 0 0 0 0 0 2 0 2-2 1-3 0 0-1 0-1 0-14-2-18-19-15-30 3-11 14-19 26-18 11 0 21 8 24 19 4 11-2 23-11 29-1 0-2 1-1 2 0 8-11 8-12 1 0-1 0-1 0-1h0c-1-2-3-2-3 0 0 2 0 4-2 5-6 0-8-1-6-4zm26 75c-9-21-16-44-20-68 2 0 3-2 4-3 4 6 15 5 15-4 1-1 2-2 3-3 2 6 9 5 12 1 2 2 5 4 9 3 3 0 5-3 6-6 0 0 1-1 2-1 0 1 1 1 1 1-11 27-22 54-32 80zm52-107c-1 10-8 18-16 22-1 0-1 0-2 0 0 0 0 0-1 1-2 0-3 1-5 1-1 0-2 0-2 1 0 3-1 4-3 5-3 1-6-1-8-4-1-1-2 0-2 1-1 3-8 6-9 0 8-7 11-18 8-29-4-11-14-19-25-20 0 0 0 0 0 0 3-12 14-20 26-21 10-1 23 1 31 9 8 9 10 23 8 34zM1357 2908c1 5-1 10-6 11-1 1-1 3 1 3 6-2 9-8 8-14 0-2-3-1-3 0zM1176 2912c-9-7-22-3-26 8-4 12 5 24 18 26 2 0 2-2 1-3-8-1-15-6-17-14-1-8 4-17 13-18 8-1 17 7 14 15-2 5-8 8-12 5-3-1-3-4-3-6 0-2 2-6 4-4 2 1 3-1 2-2l-1-1c-1 0-1-1-2 0-10 3-6 18 5 17 12-1 13-17 4-23zM450 2878c-10-7-22-3-26 8-5 12 5 24 17 26 2 0 3-2 1-3-8-1-15-6-17-14-1-8 4-17 13-18 8-1 17 7 14 15-1 5-7 8-12 5-2-1-3-4-3-6 1-2 3-6 5-4 1 1 3-1 1-2l-1-1c0 0-1-1-1 0-11 3-7 18 4 17 12-1 13-17 5-23zM1440 4c-8-5-19-5-28 0-10 6-14 19-11 30 0 0 0 0 0 0-5 4-10 8-14 13-1 1-1 2 1 2 10 2 21 4 32 3 7 1 14 0 20-3v-4c-5 4-13 5-19 4-1 0-1 0-1 0-9 1-19-1-29-2 4-4 8-8 12-11 1 0 1-1 0-2 0 0 0 0 0-1-2-9 2-20 10-26 8-5 19-5 27 0v-3zM1422 142c6-4 12-6 18-7v-3c-7 1-14 4-20 8-1 1 0 3 2 2zM1430 156c-1 1 0 2 1 2 0 1 6 4 9 7v-4c-2-2-4-3-6-5 2-2 4-5 6-7v-5c-3 5-7 9-9 11 0 0-1 1-1 1zM1434 128c-7 1-14 2-22 4-6-7-12-13-19-18-4-3-9-9-14-7-5 2-4 9-4 13 0 9 1 17 3 25-5 5-12 9-17 14-4 3-10 7-10 12 1 4 5 6 8 6 8 1 16 1 23 1 0 7 0 15 2 22 1 4 3 9 8 10 5 1 9-4 11-8 5-6 9-13 11-20 8 2 16 3 24 4 1 0 1 0 2 0v-3c0 0-1 0-1 0-3 0-6-1-9-1-5-1-11-2-16-3 0-2 0-3 0-5 0-1-2-1-2 0-1 4-1 8-2 12 0 0 0 0 0 0-4 8-10 20-16 21 0 0 0-1 0-1 0-9 1-17 3-25 0-1-2-2-3-1-2 8-2 16-2 24-1 1-1 1 0 2 0 0 0 0 0 1 0 0 0 0 0 0 0 0-1-1-2-1-3-3-4-9-4-14-1-5-1-10-1-15 0-1 0-1 0-1 0-1 0-1 0-2 0-1-3-1-3 1 0 0 0 0 0 0-5 0-10 0-15 0-2 0-6 0-8-1-1 0-3 0-3-1 0 0 0 0 0-1 0 0 0 0 0-1 6-3 12-6 18-7 2-1 1-3-1-3-6 2-12 4-17 8 0-1 0-2 0-2 0-1 1-1 1-2 7-6 15-11 22-17 1 1 3 0 2-1-1-7-3-14-3-21-1-3-2-11 0-15l0 0c5 5 9 11 12 17 1 1 2 1 3 0 0-1 0-1 0-1 0-1-1-2-2-2-2-5-6-10-10-14 0-1 0-1 0-1 1 0 2 0 3 0 5 3 10 8 14 11 4 5 9 9 13 13 0 1 1 1 1 0 0 0 1 0 1 0l15-2c4-1 8-2 12-1v-3c-2 0-4 0-6 0zM1424 165c6 2 11 5 16 9v-3c-5-4-10-6-15-8-2-1-3 2-1 2zM1432 358c3-4 4-9 3-14 0 0 0-1 0-1 4-3 6-13 4-18-1-4-7-7-10-3 0 0 0 0-1-1-2-1-4-2-6-2-1 1-1 2-2 3-5 7-1 16 6 20 2 5 1 11-3 14 0 1 0 1 0 1-1 0-3-1-4-1 2-4 0-8-4-8-2 0-4 2-4 3-1 1-1 2-1 3-1 0-1 0-2 0-3 0-6 0-9 1-2-5-4-10-6-15 11-6 9-21 18-29 6-5 21-11 19-21-1-12-18 1-22 4-6 5-11 8-17 10-6 1-13 3-18 7 0 0 0 0 0 0-2-2-4-4-6-5-9-5-18-2-26 3 0-1 1-2 1-3 0 0 0 0 0 0 4-1 7-5 7-9 0-6-3-10-7-14-10-9-23-13-35-16-7-1-13-1-20-1-5 0-11 0-17 3 0 0 0 0 0 0-1 0-1 0-1 1-5 3-8 9-6 14-6 4-13 8-15 16-2 6 1 13 7 16 2 0 4 1 6 1 0 5-1 10-2 14 0 0 0 1 0 1-5 1-10 2-15 3-2 1-5 2-5 5-2 9 12 7 16 11 1 0 1 0 1 0 11 15 26 26 43 32 6 3 17 8 24 3 3-2 4-5 3-8 14 5 29 10 44 12 0 0 1 0 1 0-1 3-1 6 2 8 2 1 5 0 6-2 1-1 1-2 1-3 9-1 19 1 26-4 0 0 1 0 1 0 10-2 19-7 23-16 0 0 1 0 1 0 3-1 6 5 9 6v-3c0 0 0 0 0 0-3-2-5-6-9-6 1-2 0-3 0-4 2 0 4 1 5 1 2 1 3 1 4 2v-11c-1 0-2-1-3-1-2 0-3 0-5 1zm-9-36c0 0 0 0 1 0 1 0 3 2 4 3 2 2 2 4 2 7 0 2 3 2 3 0 0-2 0-5-2-7 1-3 4-1 5 1 2 2 2 5 1 8-1 3-2 6-4 8 0 0 0 0 0 0-1 0-3-1-4-2-8-4-11-12-6-18zm2 36c4-3 5-9 4-14 1 0 2 0 3 0 0 0 0 1 0 1 0 0 0 0 0 1 1 5-1 9-4 13 0 1 0 1 0 1 0 0 0 1 0 1-1-1-2-2-3-3 0 1 0 0 0 0zm-12-6c1-1 1-1 2-1 2 0 3 2 2 4 0 0 0 0 0 0-1 0-2-1-3-1 0 0-1 0-1-1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0-1 0-1zm-12-50c5-2 9-6 13-8 2-2 4-3 6-5 4-2 11-1 6 7-4 7-14 10-20 16-6 8-5 20-14 26 0-1-1-2-1-3 0 0 0 0 0 0 4-6 9-14 3-20-4-5-12-4-18-1 0 0 0-1-1-1 8-6 18-6 26-11zm-12 31c-1-2-2-4-3-5-2-4-5-8-8-12 5-3 11-4 15 1 3 5-1 11-4 16zm-120-60c3-3 8-4 12-4 9-1 18 0 27 1 8 2 17 5 24 10 5 2 9 5 12 9 1 2 2 4 2 7 0 0 0 0 0 0-1 0-2 0-3 0-7 1-14 1-21 0 0 0 0 0 0 0-1 0-1 0-2 0-1 0-1 0-1 0-1 0-1 0-2 0 0 0-1 0-1 0-1 0-1 0-1 0-1-1-1-1-2-1 0 0-1 0-1 0 0 0-1 0-1 0-1 0-1 0-2-1 0 0 0 0-1 0-1 0-3-1-4-1-7-2-14-4-20-8-3-1-5-3-8-4-1-1-8-6-7-8zm-3 3c3 5 10 8 15 11 2 1 4 2 5 3 6 2 11 4 17 6 11 3 22 4 33 3 1 0 1 0 1 0 1 0 1 0 2 0 1 0 1 0 2 0 0 0 0 0 1 0 1 0 3-1 4-1 0 2-1 4-3 5-1 0-1 0-1 0-12 2-24 2-36 0 1-1 2-1 2-1 2-1 1-3-1-3-1 1-3 2-5 3-13-3-25-9-35-18 0 0-1-1-1-1-1-2-1-5 0-7zm0 38c-1 0-1 1-2 1 2-9 3-18 5-26 9 7 19 12 30 15-11 5-22 9-33 10zm20-2c-2 1-4 2-5 3-1 1-2 2-3 2 0 0 0 0-1 0-3 0-5 2-5 5-3 2-7 5-10 8 1-4 1-9 2-13 5 0 11-2 16-3 2-1 4-1 6-2zm17-7c11 3 24 3 36 1 0 2-1 4-2 6-7 5-13 12-20 16 0 0 0 0 0 0 0-1-1-2-1-2-3-6-8-15-15-18-1-1-2-1-4-1 2 0 4-1 6-2zm-53-4c2-7 9-11 15-14 0 0 1 0 1 1-1 9-3 18-4 26-7 0-14-5-12-13zm121 88c0-1 0-1-1-1-16-3-32-8-47-14-2 0-3 2-1 3 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 2 1 2 5 0 6-2 2-5 2-7 2-3 0-7-1-10-2-6-2-12-5-18-8-11-7-21-16-30-26 0 0 0-1-1-1-1-1-3-1-4-1-3-1-7-1-10-3-4-5 6-7 9-7 2-1 5-2 7-2 1 0 1 0 2 0 0 0 1-1 1-1 0 0 0 0 0 0 1 0 1-1 1-1 4-3 7-6 11-8 0 1 1 2 3 2 4 3 8 3 9 10 0 5 0 10 4 15 3 4 7 7 11 9 2 0 3-2 1-3-9-3-14-12-14-21 0-3 0-5-2-7-1-2-3-2-4-3-1 0-2-1-3-1-2-1-2-2-2-4 1-1 2-1 3-2 6-5 16-14 24-7 5 4 9 11 12 17 1 2 2 3 2 5 0 0 0 0 0 0 0 1 1 2 2 2 2 4 3 9 5 14 0 1 3 0 2-1-1-5-3-10-6-15 6-9 21-4 29-6 4-1 6-3 9-6 2-4 4-10 9-11 1 0 0-3-1-3-4 1-6 5-8 8-2 3-3 6-6 8-3 2-7 2-11 2-7 0-17-1-22 5 0-1-1-1-1-2 0 0 0 0 0 0 14-8 30-32 49-21 7 5 13 14 17 21 5 8 9 17 12 26-2 0-3 1-4 2 0-4-6-6-8-3-3 3-1 7 2 8-2 1-3 3-4 5 0 0-1 0-1 0-2 0-4-1-6-3 5-4 6-13 3-19-1-3-3-8-7-5-2 1-3 2-3 4-1-3-3-6-6-6-4-1-7 1-9 4-3 10 3 23 13 24 1 0 1 1 1 1 0 3 3 6 6 8-1 0-3 0-5 2-1 1-2 4 0 6 1 1 3 1 5 1 0-1 1-1 1-1 0 1-2 3-3 5zm19-30c0 1-1 1-1 1-1 0-1 0-1 0-2 1-4-2-2-3 2-2 4 0 4 2 0 0 0 0 0 0zm-20 8c1 0 2 0 3-1 2 3 4 4 7 5 0 0-1 1-1 1 0 0 0 0 0 1 0 0 0 0-1 0-3 1-8-2-8-6zm6 13c-1 0-3 2-4 2 0 0-1 1-2 0 0 0 0-1 0-2 1-2 4-2 6-2 0 1 0 1 0 2zm-9-23c0 1 3 1 3-1-1-3-1-6 0-9 1-2 2-4 5-3 1 0 1 4 2 5 2 6 0 16-9 16-7 0-11-7-12-13-1-2-1-7 0-9 2-1 4-1 5-2 1 1 2 2 4 3 1 2 1 5 1 7 0 1 1 1 1 1 0 2 0 3 0 5zm11 33c0 1 0 5-2 5-1 1-2 0-2-1-1-1 0-2 0-3 0-3 2-5 4-7 1 0 1-1 1-1 1 1 1 1 2 2-2 1-3 3-3 5zm3 0c0-2 1-4 4-3 0 0 0 0 1 0 4 1 9 2 12 3 0 0 0 0 1 0-6 1-13 0-18 0zm39-9c-4 3-8 5-12 6-6 1-12 0-17-1-3-1-5-2-8-3-1 0-2-1-3-2-1-1-1-5 1-7 0 0 0 0 0 0 5-7 10-14 19-17 5-1 10-1 14 0 4 1 12 4 14 8 3 6-4 13-8 16zm20-18c0 2-2 2-4 2 0 0 0 0 0 0-2-1-4-2-5-2 0 0-1 0-1 0 0 0 0 0-1 0 2-2 4-3 7-3 1 0 4 1 4 3zM1365 674c-6 3-9 10-11 16-7 16-7 35-2 52-3 0-6 1-9 3-1 1 0 3 1 2 8-6 18-1 26 3 7 3 14 4 22 3 4 0 9-1 13 0 5 2 9 5 13 7 6 4 12 7 19 5 0 0 1 0 1 0 1 0 1 0 2-1v-8c-13-31-35-61-62-82 5 1 10 3 14 4 18 7 35 19 48 33v-4c-15-15-34-27-54-34-7-2-15-3-21 1zm74 88c0 0-1 0-1 0-11 4-19-6-28-10-8-3-15-1-23-1-11 0-22-8-32-9 0 0 0 0 0 0-5-16-5-33 0-48 2-8 6-16 14-19 1-1 3-1 4-1 1 0 1 0 1 1 29 21 53 53 65 87zM1436 1111c-2 3-3 6-5 9-4 0-11 0-11 4-1 2 1 4 2 6 2 2 4 3 6 5-2 3-6 12-1 14 5 1 10-4 13-7 0 0 0 0 0 0v-4c0 0-1 1-1 1 0 0-1 1-1 1-2 2-5 6-9 6-3 1-1-3-1-4 1-2 1-4 2-6 0 0 0-1 0-1 1-1 0-1 0-2-2-1-3-2-4-3-1-1-3-3-3-4-1-4 8-3 10-3 1 0 1-2 1-2 1-2 2-4 3-5 0-1 1-2 1-3 1-1 1-2 2-2v-3c-1 0-3 2-4 3zM1415 1243c-9-35-39-62-74-71 0 0 0 0 0 0 1-2-2-3-2-1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0-1 0-1 1-1 1-4-1-7-2-11-2-16-1-31 2-45 8-1-1-1-2-1-2 0-2-3-2-2 0 0 1 0 2 0 3-22 11-41 29-50 52-5 12-7 24-7 36-2 1-3 1-4 1-2 1-1 3 1 3 1-1 2-1 3-1 0 22 8 44 22 61 0 1-1 2-1 2-1 2 1 3 2 2 0-1 1-1 1-1 2 2 5 5 7 8 16 14 36 22 56 24 39 10 78 20 117 29 0 1 1 1 1 1 0 0 0 0 1 1 4 3 8 7 12 11v-4c-2-1-4-3-6-5 2-1 4-2 6-3v-3c-2 1-5 2-8 4 0 0 0 0 0 0-1-1-2-2-2-2 0 0-1 0-1 0 2-1 4-2 6-3 0 0 1 0 1 0 1-1 3-2 4-3v-3c0 0 0 0-1 0 0 0 0 0 0 0l-57-39c9-7 17-15 23-24 11 17 23 34 35 50v-5c-12-15-23-31-34-48 7-11 10-23 12-35 7 18 14 37 22 55v-7c-7-18-15-36-22-54 1-4 1-8 0-12 7 16 15 32 22 48v-6c-8-17-15-33-22-50-1-6-2-11-3-16zm-103-70c9-1 17 0 25 1-13 25-33 48-57 65 3-19 4-39 2-58 9-4 20-7 30-8zm-85 72c7-28 27-51 52-63 2 20 1 40-2 59-17 12-34 20-53 26 0-8 1-15 3-22zm-3 24c19-5 36-14 52-25-5 30-16 59-31 85-13-17-20-38-21-60zm62 90c-7-3-14-7-21-11-6-5-12-10-18-17 16-27 27-57 32-89 4-2 7-5 11-7 19-16 36-35 48-57 1 0 1-1 1-1 0-1 1-2 1-2 29 7 54 27 67 54 3 6 5 13 7 20-1-1-3 0-2 1 0 2 0 3 0 5 0 1-1 2-2 3 0-2-1-3-1-5-1-2-3-1-3 1 1 2 2 4 2 5-1 1-3 2-4 2-6 1-11-2-15-4-1-1-3 1-2 2 5 9 4 20-2 27-1-2-2-4-4-6 0-1-3 0-2 1 1 3 3 5 4 7-4 4-9 7-16 8-6 0-21-6-19 6 1 3 2 6 2 10 1 4-1 8-3 12l-7-5c-1-1-3 1-1 2l6 5c-2 2-4 3-7 4-5 1-18-3-19 4-1 4 2 6 3 9 0 3 0 6-2 9-3-1-5-2-8-3-2 0-2 3-1 3 3 1 5 2 7 2 0 1 0 1-1 1-8 8-20 5-29 2-1 0-2 1-2 2zm38-17c0-1-1-2-1-3 0-1-1-5 0-6 0-1 2 0 3 0 4 0 7 0 11 0 4-1 8-3 10-6l30 20c-9 6-19 11-30 14-8-3-16-6-25-8 1-1 1-2 2-3 1-3 1-5 0-8zm-14 22c-1 0-2-1-3-1-1 0-1 0-2 0-3 0-6-1-9-2 9 2 19 1 25-6 7 2 14 5 21 7-10 2-21 3-32 2zm117 29c-35-9-70-17-105-26 9 0 17-1 25-3 28 9 56 18 84 27-1 1-2 1-4 2zm10-5c-1 0-2 1-2 1-28-9-56-18-83-27 9-3 19-7 27-13 0 0 0 0 0 0 0 0 0 0 0 0l58 39zm-56-44c0 0 0 0 0 0-1 1-1 1-2 1l-30-20c3-4 4-10 3-15 0-3-1-5-1-7 0-1-1-2 0-2 0-4 3-4 6-4 7 1 13 2 19-1 3-1 6-3 9-5 6 10 12 20 18 29-5 9-13 17-22 24zm24-26c-7-10-13-20-18-29 6-8 8-18 4-28 5 2 10 4 15 3 1-1 2-1 3-2 2 6 5 12 7 18-1 13-5 26-11 38zm6-58c1 0 2-1 2-2 1 0 1 0 2 0 0 0 0 1 0 2 1 4 1 8 1 13-1-4-3-9-5-13zM1423 1604c-6-2-17-3-21 3-3 7 7 9 11 11 6 2 3 8 5 13 1 2 4 3 7 3 8-1 9-10 9-16 0-2-3-2-3 0 0 3 0 7-2 10-2 5-9 5-9-2-1-4 0-7-3-9-3-3-7-2-10-4-3-1-2-5 1-7 1 0 4-1 6-1 3 0 6 0 10 2 0 0 1-1 1-2 1-11 7-20 15-27v-4c-9 7-15 18-17 30zM1435 1618c2 0 4 0 5-1v-2c-2 0-3 0-5 1-2 0-1 3 0 2zM1434 1673c-24-9-48-18-73-25 0 0-1 0-1 1 0 0-1 0-1 0 0 0 0 1-1 1-4-1-9-3-14-4 0-1-1 0-1 0 0 0-1 1-1 1-3 3-7 6-11 9-5 0-10 0-14 0-1-1-2-1-2 0 0 0 0 0-1 1-7 13-15 26-21 39-2 3-3 6 0 8 3 2 6 4 9 5 3 2 5 3 8 5 0 1-1 2-1 3-1 0-1 2 0 2 35 15 70 28 105 41 1 0 1 0 1 0 6 2 12 0 16-4 0 0 1-1 1-1 2-5 5-11 8-17v-6c-4 8-7 15-11 22 0 0 0 0 0 0-3 4-8 5-13 3 0 0-1 0-1 0 0 0 0 0 0 0-33-11-66-24-99-37 4-1 8-5 11-8 2-2 5-3 8-4 2 0 4 0 5 0 3-1 5-2 6-5 2-4 2-8 4-12s6-8 8-12c4-9 6-18 7-27 16 5 31 10 47 16-2 1-3 3-4 4-8 0-17-1-25-1-4 0-11-1-14 3-3 4-1 8 1 12 4 7 8 13 12 19-5 2-10 3-15 5-2 1-4 3-3 5 0 4 5 8 8 10 3 4 8 7 12 9 0 2 0 3 0 4 0 2 3 2 2 0 0-8 3-14 8-20 4-4 7-7 9-12 2-5 1-11 2-17 0-7 3-14 9-20 0 0 0 0 0-1 6 3 13 5 19 8 0 0 0 0 1 0 0 0 0 0 0 0 2 0 4 1 6 2v-3c-2-1-4-1-6-2 0 0 0 0 0 0zm-88-11c2-4 4-7 6-11 2 1 3 1 5 2-2 3-3 7-5 11 0 0-1 0-1 0-2-1-3-2-5-2zm5 4c-1 1-1 2-2 3-3 7-9 12-14 16 0 0 0 0-1 0 0 0-1-1-1-1 4-6 8-13 12-20 2 1 4 2 6 2 0 0 0 0 0 0zm-7-17c0 0 0-1 0-1 2 1 4 2 6 2-2 4-4 7-7 11-2-1-5-3-8-4 3-3 6-6 9-8zm-27 9c5 1 10 1 15 1 0 0 0 0 0 0 1 0 1 0 1 0 0 0 0 0 0 0 3 1 6 3 9 4-4 7-8 14-11 20-8-3-15-7-22-11 3-5 5-9 8-14zm16 29c-1 1-2 2-3 2 1-1 1-1 2-2 0 0 0 0 1 0zm-34 18c-1-1-3-1-3-2-2-2-1-5 0-7 1-3 3-6 4-8 3-5 5-9 8-14 7 5 14 8 21 12-1 2-2 4-4 6 0 0 0 1 0 1 0 0 0 0 0 1 0 0 0 0-1 0 0 0 0 0 0 0-5 5-10 11-13 18-4-3-8-5-12-7zm64-53c-1 9-3 17-7 25-3 6-9 11-10 18-1 1-1 2-1 4-1 3-1 4-4 6-3 1-7 1-10 2-6 2-12 13-19 10 0-1 0-1 1-2 0 0 1-1 0-2 6-12 17-20 27-28 5-5 9-10 12-15 3-6 5-13 9-19 1 0 1 0 2 0 0 0 0 0 0 1zm13 40c0 0 0-1 0-1-2-3-8-10-5-14 1-2 5-3 7-3 1 0 2 0 4 0 2 0 4 0 6 0 0 0 0 0 0 1 0 2 1 4-2 6 0 0-1 0-1 0-1 1-2 1-2 2-1 1 0 2 0 3 0 1 0 2-1 2 0 1-1 1-2 1-1 1-2 1-3 2 0 0 0 0-1 1zm-5 29c0 0 0 0 0 0-1-1-1-1-2-2-2-2-3-4 0-6 1-1 3-1 4-2 0 0 0 0 0 0 1 2 1 4 1 6 0 0 0 1 0 2 0 1-1 1-3 2zm32-38c-1 7 0 14-2 21-2 7-8 11-12 17-2 3-4 7-5 11-4-3-8-6-11-9 2-1 3-2 4-3 0-2 0-3 0-4 0-2-1-3-1-5 0 0 0-1-1-1 3-1 6-2 9-3 1 0 1-1 1-2-2-4-5-8-7-12 0 0 0 0 0 0 2-1 6-1 7-3 2-1 1-3 1-4-1-3 2-3 4-5 1-2 1-4 1-7 5 0 10 1 15 1-1 2-2 5-3 8zM52 1402c1-6-1-10-4-14-7-8-14-16-21-25 0 0 0 0-1 0-1-2-2-4-4-5 0 0 0 0 0 0-7-17-15-33-22-49v6c7 14 13 29 20 43-1 0-1 0-1 1-1 3-2 6-4 9-5-12-10-23-15-35v7c4 10 9 21 13 31-1 3-3 5-5 8-3-4-6-7-8-10v4c2 3 4 5 6 8-2 2-4 3-6 5v3c3-2 6-4 8-7 0 0 1-1 1-1 5-6 10-13 12-21 1 2 2 3 3 4-4 13-13 22-24 29v3c12-7 21-17 26-29 4 5 9 10 13 15 3 3 6 6 8 10 0 0 0 0 0 0-6 13-17 23-31 26-1 0-1 0-2-1-5-4-9-8-14-13v4c1 1 3 3 5 4 4 4 8 9 14 11 9 5 19-3 25-9 4-4 7-8 8-12zm-21 19c-5 2-9 1-12-1 13-4 24-13 30-26 0 1 0 2 0 2 2 6-3 12-7 16-3 4-7 7-11 9zM41 1582c2-9-3-16-12-17-10-2-20 2-28 8 0 0 0 0 0 1 0 0-1 0-1 0v4c1-2 3-3 4-4 1 0 1 0 1 0 7-5 16-8 25-6 12 3 10 15 4 23-8 12-20 20-34 24v2c8-1 16-5 23-10 8-6 16-15 18-25zM12 731c-2 4-6 7-10 8-1 1 0 3 2 3 4-2 8-5 10-9 1-2-1-3-2-2zM1430 2782c-6 0-10 5-13 10-5-4-10-6-17-5-5 1-9 5-10 11-3 16 15 22 27 25 1 0 1 0 1 0 0 1 1 2 2 1 10-6 21-20 19-33-1-5-4-9-9-9zm5 18c-2 9-8 17-16 22 0-1-1-1-1-1-10-3-23-6-26-18-1-5 2-12 8-14 6-1 12 2 16 6 1 1 2 0 2 0 3-5 7-13 14-10 6 2 5 10 3 15zM1406 2051c3-16-5-33-21-37-12-4-25 0-34 9-7 7-11 18-8 29 3 15 17 25 33 25 8-1 16-4 22-9 0 0 0 0 0 0-1 0-2 2 0 2 14 10 28 20 41 29 1 0 1 0 1 0v-3c-3-2-5-3-8-5-11-8-22-15-33-23 0 0 2-3 2-3 1-1 36 19 36 19 1 1 2 2 3 2v-3c-12-6-25-13-36-20-2-2 2-7 2-12zm-5 7c-5 11-16 16-27 16-12 0-23-7-28-19-2-7-2-15 1-22 0 0 1 0 1 0 1-4 3-7 6-9 0-1 1-1 1-1 11-7 25-7 33 3 8 10 7 27-5 33-7 4-15 3-20-2s-7-15-1-20c6-6 16-6 20 2 2 4 0 10-5 11-7 2-10-8-4-10 2 0 1-3 0-2-5 2-7 8-4 12 3 5 10 4 14 0 5-5 2-13-2-17-6-4-13-3-18 0-13 9-7 28 7 31 15 4 29-12 26-27-2-12-12-21-24-22 10-1 22 3 28 13 5 9 6 21 1 30zM1416 2363c-3-4-9-3-11 1-2-2-4-2-6-1-4 3-3 8 0 10 0 1 1 1 1 1-1 1-2 2-2 3 0 0-1 0-1 1-4 9-6 21 0 30 0 1 1 1 1 2 0 0-1 0-1 0-3 3-8 7-5 12 0 1 2 3 4 3 1 0 1 0 2 0 3-1 4-1 6 1 3 3 8 1 10-3 2-5-1-9-4-13 2-1 3-3 4-5 4-8 5-19 1-27 4-4 6-11 1-15zm-17 16c1 0 1 0 1-1 1-4 7-5 10-2 1 1 1 1 1 1 0 1 1 2 2 2 0 2 1 4 1 5 0 1 0 1 0 1-4-3-9-5-15-5 0 0 0-1 0-1zm12 45c-2 2-4 1-6-1-1-1-2-2-3-2-2-1-3 1-4 1-3 1-4 0-4-2 0-2 0-4 1-5 1-1 3-2 4-3 0 0 0-1 0-1 3 2 6 2 9 1 2 3 6 8 3 12zm1-19c-3 5-9 7-13 2-1-2-2-5-2-7-1-2-1-4-1-5 7 0 12 3 16 9 0 0 0 0 0 0 0 0 0 1 0 1zm1-4c-4-5-10-9-17-9 1-3 1-7 2-10 0 0 1 0 1 0 6 1 11 3 16 6 0 0 0 0 0 0 0 5 0 9-2 13zm0-25c0 0 0 0 0 0-2-4-8-5-11-3 0-1 0-1-1-2-1-1-2-2-2-4 1-2 4-3 5 0 0 1 2 1 3 0 1-6 7-4 9 0 1 4-1 6-3 9zM34 2244c10 2 22 0 27-10 6-11 1-23-5-33 6-1 15-6 12-14-2-5-7-6-11-4 0-7-3-13-10-15-7-1-14 4-16 10-5-4-12-5-17 1-5 6-1 15 7 17-6 5-12 10-14 17-1 0-1 1-1 2-1 3-1 6 0 10 3 11 17 17 28 19zm26-14c-4 11-17 13-27 11-6-2-12-4-17-8 16 0 31-6 44-17 1 4 1 9 0 14zm-36-33c1-1 0-2-1-2 0-1 0-2-1-2-6-2-9-9-4-13 4-4 10-2 13 2 0 2 2 1 2 0 1-7 7-12 13-11 6 1 10 9 8 15-1 0-1 0-1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 2 2 3 3 1 5-6 13 1 8 7-2 3-6 4-9 4-1 0-1 1-1 1-1 0-2 1-1 2 0 2 1 3 2 4-1 0-1 0-2 0-13 8-28 11-43 8 3-6 9-11 14-16zm-15 19c16 3 32 0 46-8 1 0 1-1 1-1 1 2 2 4 3 6-1 0-1 0-1 0-12 11-28 17-45 17 0 0 0 0-1 0-2-2-3-4-4-8 0-2 0-4 1-6zM27 2201c1-1 2-2 2-3 0 0 1 0 1-1 0 0 0 0 0 0 0-2-2-2-3-1-1 1-1 3-2 4-1 2 2 3 2 1zM38 2203c0 1 1 1 1 1 1 0 2-1 1-2 0-2 0-3 0-5 0 0-1-1-2-1-1 1-1 1-1 2 0 2 0 3 1 5zM47 2202c0 1 1 1 2 1 0-1 0-2 0-2 0-1 0-1-1-2 0-1-1-1-2-1 0 1-1 2 0 2 0 1 0 1 1 2zM76 2023c2 3 3 5 4 8 1 2 2 5 2 6-1 1-4 2-4 2-1 1-2 2-3 4-2 4 0 10 5 12 5 3 10 0 12-4 5 6 14 6 17-2 4-7-3-15-11-14 0-13-7-26-19-33-11-7-25-6-37-1 0-1 0-1 0-1-8-4-21-6-24 5-1 6 4 12 10 11-1 6 3 13 11 13 7 0 11-6 9-13 10-3 21 0 28 7zm-40 3c-5-2-6-8-5-12 0-2-1-3-2-2-4 2-8 0-8-4-1-3 1-6 3-7 5-3 11-2 16 1 0 0-1 0-1 0-2 1 0 4 1 3 11-7 27-7 38-1 11 7 18 20 18 33-1 2 1 2 2 1 0 0 0 0 0 0 6-1 12 5 8 11-3 6-10 4-13-1 0-1-2-1-2 0-2 5-9 8-13 3-3-5 0-10 6-11 0 0 1-1 1-2-2-18-20-30-37-25-1 1-1 1-2 1 0 1-1 1-1 2 3 7-3 12-9 10zM1354 1130c1 0 1-3-1-3-4 2-7 7-5 11 2 5 9 5 13 3 11-8 2-22-9-24-12-2-20 10-17 21 3 13 18 18 30 13 15-7 19-27 8-39-1-2-3 0-1 1 8 11 6 27-6 34-9 6-23 4-28-7-4-9 3-23 15-20 4 1 9 4 10 9 1 4-2 9-6 10-6 2-10-7-3-9zM872-44c5 16 10 32 16 49-10 1-15 12-9 20 7 8 19 5 22-4 7 4 17 0 19-8 1-9-8-16-16-14-4-16-9-33-14-49 8-2 13-12 8-19-5-8-17-6-21 2-7-4-17-1-19 6-2 9 6 17 14 16 0 0 0 0 0 0 0 0-1 0 0 1zm0-4c-6 1-12-4-12-10 1-8 11-11 16-6 1 0 2 0 2-1 3-7 15-9 18-2 3 6-1 14-8 15-1 0-1 0-1 1 5 17 10 35 15 52 0 1 1 1 2 1 6-2 13 3 13 10-1 7-11 10-16 6-1-1-2-1-3 0-1 8-11 12-17 5-6-7 0-16 8-16 1 0 2-1 2-1-6-17-11-34-17-51 0 0-1-1-2-1 2 0 1-2 0-2z";
