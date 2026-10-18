"use client";

/**
 * Signal for iOS — conversation screen as it ships in late 2026 (Signal-iOS
 * main @ d13b9da, Oct 14 2026, iOS 26 "Liquid Glass" code paths).
 *
 * Every value below was read from the open-source app
 * (github.com/signalapp/Signal-iOS), file paths relative to the repo root:
 *  [CS]  SignalUI/Appearance/ConversationStyle.swift
 *        gutters 16/16, text insets 12 h + top/bottom round(11 − SF metrics) = 7/7,
 *        max bubble width = 393 − 32 − (24 + 8) − 12 = 317pt, max audio width 244,
 *        message spacing 12 (new cluster) / 2 (inside a cluster), content margin
 *        top 24 / bottom 8 (iOS 26). Incoming bubble #E9E9E9 / dark #2C2C2E.
 *        Outgoing text white / dark #E9E9E9 (ows_gray05). Secondary text in
 *        outgoing bubbles white 80% / dark white 60%.
 *  [CM]  Signal/ConversationView/Components/CVComponentMessage.swift
 *        bubble radius 18, "sharp" radius 4 on the outer corners that touch a
 *        neighbour of the same cluster; min bubble width 36. Footer overlaps
 *        the last text line when it fits (min gap 6, footer centre on the
 *        last baseline) and the line and footer don't collide; otherwise it
 *        goes below with 3pt spacing.
 *  [IVS] Signal/ConversationView/Loading/CVItemViewState.swift
 *        clusters break after 3 minutes; a footer is hidden when the next
 *        message of the cluster has the same time (and receipt state).
 *  [FT]  Components/CVComponentFooter.swift — caption1 (12pt) time, 4pt gap,
 *        18×12 status slot; Symbols.xcassets/message_status/*.pdf converted
 *        verbatim to SVG (sent = check in ring, delivered = two rings, read =
 *        two filled discs).
 *  [CC]  SignalServiceKit/UISupport/Models/PaletteChatColor+Constants.swift —
 *        default chat colour "Ultramarine" is a GRADIENT #0552F0 (top) →
 *        #2C6BED (bottom), drawn relative to the whole conversation view
 *        (CVColorOrGradientView referenceView), i.e. fixed to the screen.
 *  [DH]  Components/CVComponentDateHeader.swift + ConversationViewLayout.swift —
 *        "Today" (relative date formatter) footnote 13 medium, secondary label,
 *        12/3 insets, no fill in-thread; when scrolled past it sticks 12pt
 *        under the nav bar as a glass capsule with label-coloured text.
 *  [TD]  Components/CVComponentThreadDetails.swift — conversation header card:
 *        74pt avatar, title3 semibold name, "No groups in common" (subheadline),
 *        2pt tertiaryFill outline r40 that starts 16pt below the avatar top.
 *  [TI]  Signal/src/views/TypingIndicatorView.swift + CVComponentTypingIndicator
 *        — 3 dots (6→8pt, alpha 0.4→1 of secondary label), 3pt apart, in a
 *        36pt capsule with text insets; 8-key loop of 1.5s.
 *  [AU]  CellViews/AudioMessageView.swift, AudioMessagePresenter.swift,
 *        AudioWaveformProgressView.swift — 40pt play disc, 12 gap, 32pt
 *        waveform of 2pt bars (≥2pt gaps), 6 trailing; duration caption1 +
 *        6pt "unplayed" dot underneath; footer at the bottom trailing corner.
 *  [MD]  Components/CVComponentBodyMedia.swift + CVMediaAlbumView.swift — a
 *        single image is sized from its aspect inside the 317pt square; time
 *        overlaid in white on a 40pt black 0→40% gradient; inner hairline.
 *  [HD]  ConversationHeaderView.swift + ConversationViewController+UI.swift —
 *        iOS 26: 40pt avatar, 12pt gap, 17 semibold title, no presence
 *        subtitle (Signal never shows online / last seen / typing in the bar);
 *        bar buttons [voice call, video call] grouped in one glass platter.
 *  [IT]  ConversationInputToolbar.swift — iOS 26: forced LTR, 40pt glass "+"
 *        16pt from the edge, 12pt gap, 40pt glass field to 16pt from the other
 *        edge, "Message" placeholder (17pt, secondary label) with sticker,
 *        camera and mic buttons (40pt each, 4pt from the field end) inside;
 *        56pt bar on the keyboard guide (safe-area bottom).
 *  [AV]  SignalServiceKit/Avatars/AvatarModel.swift + AvatarBuilder.swift —
 *        default avatars: pastel theme fill + dark initials (Inter Medium,
 *        0.45 × diameter); names without a short abbreviation (Arabic) get the
 *        person glyph at 60% of the diameter.
 *  [UC]  SignalUI/Appearance/UIColor+Signal.swift — label, secondaryLabel
 *        (#3C3C43 72% / #EBEBF5 70%), quaternaryLabel, tertiaryFill, glass tint.
 *  [L10N] Signal/translations/{en,ar}.lproj/Localizable.strings —
 *        INPUT_TOOLBAR_MESSAGE_PLACEHOLDER "Message" / "رسالة",
 *        THREAD_DETAILS_ZERO_MUTUAL_GROUPS "No groups in common" /
 *        "لا توجد مجموعات مُشتركة".
 *  [RC]  CellViews/CVReactionCountsView.swift + CVComponentMessage reactions
 *        layout block — 24pt pill, cornerRadius 12, 1pt border =
 *        Theme.backgroundColor, margins 3/7, emoji boldSystemFont 14; fill
 *        ows_gray05 #E9E9E9 / ows_gray90 #1B1B1B, or ows_gray25 #B9B9B9 /
 *        ows_gray60 #5E5E5E when the local user reacted (UIColor+OWS.swift);
 *        y = bubble.maxY − 7, x = 6pt in from the side facing the screen
 *        centre; the cell gains a 17pt bottom inset.
 *  [QR]  CellViews/CVQuotedMessageView.swift + CVComponentMessage spacing —
 *        quote 7pt below the bubble top, 8pt from its sides, 7pt above the
 *        body; corners 10 (4 where the bubble corner is sharp) / bottom 4;
 *        stripe 4pt, hStack spacing 8, inner vMargin 6, author footnote
 *        semibold, snippet subheadline (2 lines, 1 beside a 64/72pt
 *        thumbnail). Colours from UIColor+Signal.swift LightBase / ColorBase.
 *        Strings: YOU "You"/"أنت", QUOTED_REPLY_TYPE_PHOTO "Photo"/"صورة
 *        شخصية", QUOTED_REPLY_TYPE_VOICE_MESSAGE "Voice Message"/"رسالة صوتية".
 *  [IT+] ConversationInputToolbar.ensureButtonVisibility — iOS 26 with text:
 *        sticker/camera/mic hide (alpha + scale 0.1, 0.25s spring), the send
 *        button (UIButton .prominentGlass, arrow-up, tint
 *        asChatUIElementTintColor) appears 16pt from the edge and the field
 *        ends 12pt before it; text view 35…98pt (textContainerInset 6.67/12).
 *  iOS 26 nav bar: 44pt bar under the 59pt safe area, 44pt glass items, 16pt
 *  side margins (thoughtbot.com/blog/migrating-to-native-stack-navigation-with-a-surprise-from-ios-26).
 *
 * Motion: messages are inserted with UICollectionView batch updates and the
 * stock layout (no custom initialLayoutAttributes) → the new cell cross-fades
 * in place over the default 0.3s ease-in-out while the list slides. Same for
 * the typing indicator. `signalIosMotion.enterStyle` uses the same curve.
 */

import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

import type { DeliveryStatus, GroupChat, LinkPreview, Message, Person } from "../../types";
import { Avatar, dirOf, SystemBottomBar, useChatScroll } from "../shared";
import { StatusBar } from "../devices/StatusBar";
import { useKeyboardInset } from "../devices/keyboard-context";
import type { Lang } from "./chrome";
import type { PlatformMotion, PlatformProps } from "./types";

/* ------------------------------- tokens ------------------------------- */

const IOS_FONT =
  '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "SF Pro", var(--font-inter), system-ui, var(--font-tajawal), sans-serif';
const AVATAR_FONT = 'var(--font-inter), "Inter", -apple-system, system-ui, var(--font-tajawal), sans-serif';

interface Palette {
  bg: string;
  bgA: (a: number) => string;
  label: string;
  secondary: string;
  quaternary: string;
  tertiaryFill: string;
  inBubble: string;
  inText: string;
  outText: string;
  outSecondary: string;
  playIn: string;
  dotRgb: string;
  mediaFill: string;
  mediaHairline: string;
}

const LIGHT: Palette = {
  bg: "#ffffff",
  bgA: (a) => `rgba(255,255,255,${a})`,
  label: "#000000",
  secondary: "rgba(60,60,67,0.72)",
  quaternary: "rgba(60,60,67,0.18)",
  tertiaryFill: "rgba(118,118,128,0.12)",
  inBubble: "#e9e9e9",
  inText: "#000000",
  outText: "#ffffff",
  outSecondary: "rgba(255,255,255,0.8)",
  playIn: "rgba(255,255,255,0.8)",
  dotRgb: "60,60,67",
  mediaFill: "#efeff0",
  mediaHairline: "rgba(0,0,0,0.15)",
};

const DARK: Palette = {
  bg: "#000000",
  bgA: (a) => `rgba(0,0,0,${a})`,
  label: "#ffffff",
  secondary: "rgba(235,235,245,0.7)",
  quaternary: "rgba(235,235,245,0.16)",
  tertiaryFill: "rgba(118,118,128,0.24)",
  inBubble: "#2c2c2e",
  inText: "#ffffff",
  outText: "#e9e9e9",
  outSecondary: "rgba(255,255,255,0.6)",
  playIn: "rgba(255,255,255,0.2)",
  dotRgb: "235,235,245",
  mediaFill: "#1c1c1e",
  mediaHairline: "rgba(255,255,255,0.15)",
};

/** Ultramarine [CC]: screen-fixed vertical gradient. */
const ULTRA_TOP = "#0552f0";
const ULTRA_BOTTOM = "#2c6bed";
const ULTRA_GRADIENT = `linear-gradient(180deg, ${ULTRA_TOP} 0%, ${ULTRA_BOTTOM} 100%)`;
const ULTRA_FALLBACK = "#2263ee";

/** Liquid Glass control, drawn without backdrop-filter. */
function glass(dark: boolean): CSSProperties {
  return dark
    ? {
        background: "rgba(38,38,40,0.96)",
        boxShadow:
          "inset 0 0.5px 0 rgba(255,255,255,0.2), inset 0 0 0 0.5px rgba(255,255,255,0.09), 0 4px 16px rgba(0,0,0,0.5)",
      }
    : {
        background: "#ffffff",
        boxShadow: "0 0 0 0.5px rgba(0,0,0,0.035), 0 2px 5px rgba(0,0,0,0.035), 0 6px 18px rgba(0,0,0,0.07)",
      };
}

/**
 * [L10N] + quoted-reply strings (YOU, QUOTED_REPLY_TYPE_PHOTO,
 * QUOTED_REPLY_TYPE_VOICE_MESSAGE). The Arabic "Photo" really is
 * "صورة شخصية" in Signal-iOS ar.lproj — but that string means "profile photo"
 * (shared key), so the quote uses plain "صورة" like SignalAndroid.
 */
interface LocalStrings {
  today: string;
  placeholder: string;
  noGroups: string;
  you: string;
  photo: string;
  voice: string;
  /** MESSAGE_STATUS_EDITED */
  edited: string;
  /** YOU_DELETED_THIS_MESSAGE / DELETED_THIS_MESSAGE */
  youDeleted: string;
  deletedBy: (name: string) => string;
  /** CVComponentSystemMessage call rows (TSCall.previewText) */
  missedVoice: string;
  missedVideo: string;
  incomingVoice: string;
  incomingVideo: string;
  outgoingVoice: string;
  outgoingVideo: string;
  unansweredVoice: string;
  unansweredVideo: string;
  /** CALLBACK_BUTTON_TITLE / CALL_AGAIN_BUTTON_TITLE */
  callBack: string;
  callAgain: string;
  /** GROUP_CALL_STARTED_MESSAGE_FORMAT / GROUP_CALL_STARTED_BY_YOU */
  groupCallBy: (name: string) => string;
  groupCallYou: string;
  /** THREAD_DETAILS_*_MEMBERS_AND_YOURSELF (names sorted, "you" last) */
  members: (names: string[]) => string;
}

const LOCAL: Record<Lang, LocalStrings> = {
  en: {
    today: "Today",
    placeholder: "Message",
    noGroups: "No groups in common",
    you: "You",
    photo: "Photo",
    voice: "Voice Message",
    edited: "Edited",
    youDeleted: "You deleted this message",
    deletedBy: (n) => `${n} deleted this message`,
    missedVoice: "Missed voice call",
    missedVideo: "Missed video call",
    incomingVoice: "Incoming voice call",
    incomingVideo: "Incoming video call",
    outgoingVoice: "Outgoing voice call",
    outgoingVideo: "Outgoing video call",
    unansweredVoice: "Unanswered voice call",
    unansweredVideo: "Unanswered video call",
    callBack: "Call Back",
    callAgain: "Call Again",
    groupCallBy: (n) => `${n} started a group call`,
    groupCallYou: "You started a group call",
    members: (n) =>
      n.length === 0
        ? "No other group members yet"
        : n.length === 1
          ? `${n[0]} and you`
          : n.length === 2
            ? `${n[0]}, ${n[1]}, and you`
            : n.length === 3
              ? `${n[0]}, ${n[1]}, ${n[2]}, and you`
              : `${n[0]}, ${n[1]}, ${n[2]}, and ${n.length - 2} others`,
  },
  ar: {
    today: "اليوم",
    placeholder: "رسالة",
    noGroups: "لا توجد مجموعات مُشتركة",
    you: "أنت",
    photo: "صورة",
    voice: "رسالة صوتية",
    edited: "تمَّ التعديل",
    youDeleted: "حذفتَ هذه الرسالة.",
    deletedBy: (n) => `حذفَ ${n} هذه الرسالة.`,
    missedVoice: "مكالمة صوتية فائتة",
    missedVideo: "مكالمة فيديو فائتة",
    incomingVoice: "مكالمة صوتية واردة",
    incomingVideo: "مكالمة فيديو واردة",
    outgoingVoice: "مكالمة صوتية صادرة",
    outgoingVideo: "مكالمة فيديو صادرة",
    unansweredVoice: "مكالمة صوتية لم يتم الرد عليها",
    unansweredVideo: "مكالمة فيديو لم يتم الرد عليها",
    callBack: "إعادة الاتصال",
    callAgain: "مُعاودة الاتصال",
    groupCallBy: (n) => `بدأ ${n} مُكالمة جماعية`,
    groupCallYou: "بدأتَ مُكالمة جماعية",
    members: (n) =>
      n.length === 0
        ? "لا يوجد أعضاء آخرون في المجموعة حتى الآن"
        : n.length === 1
          ? `${n[0]} وأنت`
          : n.length === 2
            ? `${n[0]}، و${n[1]} وأنت`
            : n.length === 3
              ? `${n[0]} و${n[1]} و${n[2]} وأنت`
              : `${n[0]}، و${n[1]}، و${n[2]}، و${n.length - 2} آخرين`,
  },
};

/**
 * SignalUI/Appearance/GroupNameColors.swift — groupNameColorValues (light,
 * dark), assigned to the members in order.
 */
const NAME_COLORS: [string, string][] = [
  ["#006da3", "#00a7fa"],
  ["#067906", "#0ab80a"],
  ["#b814b8", "#f65af6"],
  ["#c13215", "#ff6f52"],
  ["#5b6976", "#8ba1b6"],
  ["#cc0066", "#f76eb2"],
  ["#2e51ff", "#8599ff"],
  ["#007575", "#00b2b2"],
  ["#9c5711", "#d5920b"],
  ["#d00b4d", "#ff6b9c"],
  ["#8f2af4", "#bf80ff"],
  ["#3d7406", "#5eb309"],
];

/** UIColor.Signal.emphasisLabel (missed incoming call rows). */
const EMPHASIS = { light: "#e81f28", dark: "#fc3040" };
/** UIColor.Signal.transparentSeparator (remotely-deleted bubble stroke). */
const SEPARATOR = { light: "rgba(60,60,67,0.36)", dark: "rgba(84,84,88,0.65)" };
/** UIColor.Signal.secondaryFill (system message action button). */
const SECONDARY_FILL = { light: "rgba(120,120,128,0.16)", dark: "rgba(120,120,128,0.32)" };

/* metrics (pt) — see header */
const GUTTER = 16;
const MAX_BUBBLE = 317;
/**
 * [CS] group threads: leading gutter 12, a 28pt sender-avatar column and 8pt
 * stack spacing (bubbles start at 48), max width 317 − (28 + 8) − 4 = 285.
 */
const GROUP_GUTTER = 12;
const GROUP_AVATAR = 28;
const MAX_BUBBLE_GROUP = 285;
/** CVComponentSticker.stickerSize */
const STICKER = 175;
/** ConversationStyle.systemMessageSpacing */
const SYSTEM_SPACING = 20;
const TEXT_INSET_X = 12;
const TEXT_INSET_Y = 7;
const MAX_TEXT = MAX_BUBBLE - TEXT_INSET_X * 2; // 293
const AUDIO_W = 244;
const R_WIDE = 18;
const R_SHARP = 4;
const GAP_CLUSTER = 2;
const GAP_DEFAULT = 12;
const BODY = 17;
/** SF Pro metrics as UIFont reports them (per pt of size). */
const SF_LINE = 1.1934;
const SF_CAP = 0.7053;
const SF_DESC = 0.2412;
const CAPTION_LINE = 12 * SF_LINE; // 14.32
const NAV_TOP = 59;
const NAV_H = 44;
const CONTENT_TOP = NAV_TOP + NAV_H + 24;
const STICKY_TOP = NAV_TOP + NAV_H + 12;
const SAFE_BOTTOM = 34;
const TOOLBAR_H = 56;
const FIELD_H = 40;
const BODY_BOTTOM = SAFE_BOTTOM + TOOLBAR_H + 8;
/** [IT] text view: 7 − hairline vertical insets, 35…98pt tall, body 17pt. */
const INPUT_INSET_Y = 7 - 1 / 3;
const INPUT_MIN_H = 35;
const INPUT_MAX_H = 98;
/** [RC] CVReactionCountsView: 24pt pill, 7pt overlap, 6pt inset from the bubble edge. */
const REACTION_H = 24;
const REACTION_OVERLAP = 7;
const REACTION_INSET = 6;
/** [QR] CVQuotedMessageView: wide 10 / sharp 4 corners, 4pt stripe, 64 / 72pt thumbnail. */
const QUOTE_R_WIDE = 10;
const QUOTE_R_SHARP = 4;
const FOOTNOTE_LINE = 13 * SF_LINE;
const SUBHEAD_LINE = 15 * SF_LINE;
/** UIColor.Signal.ultramarine (text caret / tint). */
const ACCENT = { light: "#2267f5", dark: "#2d70fa" };
/**
 * Send button tint [IT]: ColorOrGradientValue.asChatUIElementTintColor() →
 * HSB midpoint of the Ultramarine gradient (#1860EE) blended with 16% white
 * (light) / 10% black (dark).
 */
const SEND_TINT = { light: "#3d78f1", dark: "#1655d7" };

/* ------------------------------ motion ------------------------------ */

/** cubic-bezier(x1, y1, x2, y2) evaluated at x (UIKit easeInOut = .42,0,.58,1). */
function bezier(x1: number, y1: number, x2: number, y2: number, x: number): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;
  let t = x;
  for (let i = 0; i < 8; i++) {
    const fx = ((ax * t + bx) * t + cx) * t - x;
    const d = (3 * ax * t + 2 * bx) * t + cx;
    if (Math.abs(fx) < 1e-6 || d === 0) break;
    t -= fx / d;
  }
  return ((ay * t + by) * t + cy) * t;
}
const easeInOut = (p: number) => bezier(0.42, 0, 0.58, 1, p);

const ENTER_MS = 300;

export const signalIosMotion: PlatformMotion = {
  enterMs: ENTER_MS,
  enterStyle: (p) => ({ opacity: Number(easeInOut(Math.min(1, Math.max(0, p))).toFixed(4)) }),
};

/** UIKit caret blink period (on half / off half). */
const CARET_MS = 1000;

/* typing dots [TI]: 8 key values per dot, spread evenly over 1.5s */
const DOT_PERIOD = 1500;
const DOT_KEYS: number[][] = [
  [0, 0.5, 1, 0.5, 0, 0, 0, 0],
  [0, 0, 0.5, 1, 0.5, 0, 0, 0],
  [0, 0, 0, 0.5, 1, 0.5, 0, 0],
];
function dotValue(dot: number, phase: number): number {
  const keys = DOT_KEYS[dot];
  const x = (((phase % 1) + 1) % 1) * 7;
  const i = Math.min(6, Math.floor(x));
  const f = x - i;
  return keys[i] + (keys[i + 1] - keys[i]) * f;
}

function buildStyle(): string {
  let css = "";
  let fade = "@keyframes sig-ios-fade{";
  for (let i = 0; i <= 20; i++) fade += `${i * 5}%{opacity:${easeInOut(i / 20).toFixed(4)}}`;
  css += fade + "}";
  css += `.sig-ios-anim{animation:sig-ios-fade ${ENTER_MS}ms linear both}`;
  DOT_KEYS.forEach((keys, d) => {
    css += `@keyframes sig-ios-dot${d}{`;
    keys.forEach((v, i) => {
      css += `${((i / 7) * 100).toFixed(3)}%{opacity:${(0.4 + 0.6 * v).toFixed(3)};transform:scale(${((6 + 2 * v) / 8).toFixed(4)})}`;
    });
    css += "}";
  });
  css += `.sig-ios-out{background-color:${ULTRA_FALLBACK};background-image:${ULTRA_GRADIENT};background-size:100% var(--sig-h,852px);background-repeat:no-repeat}`;
  // UIKit caret: solid while keys land (re-keyed per keystroke), then a 1s on/off blink
  css += `@keyframes sig-ios-caret{0%,50%{opacity:1}50.01%,100%{opacity:0}}.sig-ios-caret{animation:sig-ios-caret ${CARET_MS}ms step-end infinite;animation-delay:${CARET_MS / 2}ms}`;
  // [IT] setView(hidden:) under a 0.25s spring: alpha 0→1, scale 0.1→1
  css += `.sig-ios-pop{transition:opacity 250ms cubic-bezier(.3,1.25,.5,1),transform 250ms cubic-bezier(.3,1.25,.5,1),width 250ms cubic-bezier(.25,1,.5,1)}`;
  css += `.sig-ios-grow{transition:height 250ms cubic-bezier(.25,1,.5,1)}`;
  return css;
}
const STYLE = buildStyle();

/* ------------------------------ glyphs [FT][IT] ------------------------------ */

const P_SENT = [
  "M8.462 4.299C8.627 4.044 8.554 3.703 8.299 3.538C8.044 3.373 7.703 3.446 7.538 3.701L5.217 7.289L4.19 5.92C4.008 5.677 3.663 5.628 3.42 5.81C3.177 5.992 3.128 6.337 3.31 6.58L4.81 8.58C4.918 8.724 5.089 8.806 5.269 8.8C5.449 8.794 5.614 8.7 5.712 8.549L8.462 4.299Z",
  "M6 0C2.686 0 0 2.686 0 6C0 9.314 2.686 12 6 12C9.314 12 12 9.314 12 6C12 2.686 9.314 0 6 0ZM1.1 6C1.1 3.294 3.294 1.1 6 1.1C8.706 1.1 10.9 3.294 10.9 6C10.9 8.706 8.706 10.9 6 10.9C3.294 10.9 1.1 8.706 1.1 6Z",
];
const P_DELIVERED = [
  "M6 0C6.671 0 7.316 0.11 7.918 0.313C7.557 0.572 7.223 0.865 6.918 1.186C6.621 1.13 6.314 1.1 6 1.1C3.294 1.1 1.1 3.294 1.1 6C1.1 8.706 3.294 10.9 6 10.9C6.314 10.9 6.621 10.87 6.918 10.814C7.223 11.135 7.557 11.428 7.918 11.687C7.316 11.89 6.671 12 6 12C2.686 12 0 9.314 0 6C0 2.686 2.686 0 6 0Z",
  "M4.19 5.92L5.089 7.119C5.178 7.675 5.333 8.209 5.545 8.714C5.464 8.766 5.369 8.796 5.269 8.8C5.089 8.806 4.918 8.724 4.81 8.58L3.31 6.58C3.128 6.337 3.177 5.992 3.42 5.81C3.663 5.628 4.008 5.677 4.19 5.92Z",
  "M14.299 3.538C14.554 3.703 14.627 4.044 14.462 4.299L11.712 8.549C11.614 8.7 11.449 8.793 11.269 8.8C11.089 8.806 10.918 8.724 10.81 8.58L9.31 6.58C9.128 6.337 9.177 5.992 9.42 5.81C9.663 5.628 10.008 5.677 10.19 5.92L11.217 7.289L13.538 3.701C13.703 3.446 14.044 3.373 14.299 3.538Z",
  "M6 6C6 2.686 8.686 0 12 0C15.314 0 18 2.686 18 6C18 9.314 15.314 12 12 12C8.686 12 6 9.314 6 6ZM12 1.1C9.294 1.1 7.1 3.294 7.1 6C7.1 8.706 9.294 10.9 12 10.9C14.706 10.9 16.9 8.706 16.9 6C16.9 3.294 14.706 1.1 12 1.1Z",
];
const P_READ = [
  "M6 0.25C6.688 0.25 7.348 0.371 7.959 0.592C6.315 1.824 5.25 3.787 5.25 6C5.25 6.375 5.28 6.742 5.339 7.1L5.217 7.289L4.19 5.92C4.008 5.677 3.663 5.628 3.42 5.81C3.177 5.992 3.128 6.337 3.31 6.58L4.81 8.58C4.918 8.724 5.089 8.806 5.269 8.8C5.449 8.793 5.614 8.7 5.712 8.549L5.734 8.515C6.199 9.672 6.975 10.671 7.959 11.408C7.348 11.629 6.688 11.75 6 11.75C2.824 11.75 0.25 9.176 0.25 6C0.25 2.824 2.824 0.25 6 0.25Z",
  "M12 0.25C8.824 0.25 6.25 2.824 6.25 6C6.25 9.176 8.824 11.75 12 11.75C15.176 11.75 17.75 9.176 17.75 6C17.75 2.824 15.176 0.25 12 0.25ZM14.299 3.538C14.554 3.703 14.627 4.044 14.462 4.299L11.712 8.549C11.614 8.7 11.449 8.793 11.269 8.8C11.089 8.806 10.918 8.724 10.81 8.58L9.31 6.58C9.128 6.337 9.177 5.992 9.42 5.81C9.663 5.628 10.008 5.677 10.19 5.92L11.217 7.289L13.538 3.701C13.703 3.446 14.044 3.373 14.299 3.538Z",
];

function StatusIcon({ status, color }: { status: DeliveryStatus; color: string }) {
  const w = status === "sent" ? 12 : 18;
  const paths = status === "sent" ? P_SENT : status === "delivered" ? P_DELIVERED : P_READ;
  return (
    <svg width={w} height="12" viewBox={`0 0 ${w} 12`} fill={color} style={{ display: "block", flexShrink: 0 }}>
      {paths.map((d, i) => (
        <path key={i} d={d} fillRule="evenodd" />
      ))}
    </svg>
  );
}

function Icon24({ d, color, size = 24, evenOdd = true }: { d: string[]; color: string; size?: number; evenOdd?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} style={{ display: "block", flexShrink: 0 }}>
      {d.map((p, i) => (
        <path key={i} d={p} fillRule={evenOdd ? "evenodd" : "nonzero"} />
      ))}
    </svg>
  );
}

const I_PHONE = [
  "M4.255 2.726C5.499 1.481 7.555 1.621 8.62 3.022L10.789 5.875C11.667 7.031 11.557 8.659 10.53 9.686L9.48 10.736C9.513 10.83 9.57 10.96 9.662 11.127C9.937 11.622 10.429 12.266 11.081 12.919C11.734 13.571 12.378 14.063 12.873 14.338C13.04 14.43 13.17 14.487 13.264 14.52L14.314 13.47C15.341 12.443 16.969 12.333 18.125 13.211L20.978 15.38C22.379 16.445 22.519 18.501 21.274 19.745L20.839 20.181C19.27 21.75 16.929 22.611 14.675 21.839C11.861 20.874 9.218 19.269 6.974 17.026C4.731 14.782 3.126 12.139 2.161 9.325C1.389 7.071 2.25 4.73 3.819 3.161L4.255 2.726ZM7.227 4.081C6.804 3.524 5.987 3.469 5.492 3.963L5.057 4.399C3.839 5.616 3.311 7.283 3.817 8.757C4.697 11.325 6.161 13.737 8.212 15.788C10.263 17.839 12.675 19.303 15.243 20.183C16.717 20.688 18.384 20.161 19.601 18.943L20.037 18.508C20.531 18.013 20.476 17.196 19.919 16.773L17.066 14.605C16.606 14.255 15.96 14.299 15.552 14.707L14.309 15.949C13.896 16.363 13.352 16.331 13.048 16.272C12.707 16.206 12.354 16.052 12.023 15.867C11.35 15.493 10.578 14.89 9.844 14.156C9.11 13.422 8.507 12.65 8.132 11.977C7.948 11.645 7.794 11.293 7.728 10.952C7.669 10.648 7.637 10.103 8.05 9.69L9.293 8.448C9.701 8.04 9.745 7.393 9.395 6.934L7.227 4.081Z",
];
const I_VIDEO = [
  "M6.763 3.625C5.954 3.625 5.294 3.625 4.758 3.669C4.204 3.714 3.706 3.811 3.241 4.047C2.512 4.419 1.919 5.012 1.547 5.741C1.311 6.206 1.214 6.704 1.169 7.258C1.125 7.794 1.125 8.454 1.125 9.263L1.125 14.737C1.125 15.546 1.125 16.206 1.169 16.742C1.214 17.296 1.311 17.794 1.547 18.259C1.919 18.988 2.512 19.581 3.241 19.953C3.706 20.189 4.204 20.286 4.758 20.331C5.294 20.375 5.954 20.375 6.763 20.375L11.737 20.375C12.546 20.375 13.206 20.375 13.742 20.331C14.296 20.286 14.794 20.189 15.259 19.953C15.988 19.581 16.581 18.988 16.953 18.259C17.189 17.794 17.286 17.296 17.331 16.742C17.368 16.291 17.374 15.753 17.375 15.112L20.174 17.912C21.355 19.093 23.375 18.256 23.375 16.586L23.375 7.414C23.375 5.744 21.355 4.907 20.174 6.088L17.375 8.888C17.374 8.247 17.368 7.709 17.331 7.258C17.286 6.704 17.189 6.206 16.953 5.741C16.581 5.012 15.988 4.419 15.259 4.047C14.794 3.811 14.296 3.714 13.742 3.669C13.206 3.625 12.546 3.625 11.737 3.625L6.763 3.625ZM15.625 9.3C15.625 8.445 15.624 7.857 15.587 7.401C15.551 6.955 15.484 6.712 15.393 6.535C15.19 6.135 14.865 5.81 14.465 5.607C14.288 5.516 14.045 5.449 13.599 5.413C13.143 5.376 12.555 5.375 11.7 5.375L6.8 5.375C5.945 5.375 5.357 5.376 4.901 5.413C4.455 5.449 4.212 5.516 4.035 5.607C3.635 5.81 3.31 6.135 3.107 6.535C3.016 6.712 2.949 6.955 2.913 7.401C2.876 7.857 2.875 8.445 2.875 9.3L2.875 14.7C2.875 15.555 2.876 16.143 2.913 16.599C2.949 17.045 3.016 17.288 3.107 17.465C3.31 17.865 3.635 18.19 4.035 18.393C4.212 18.484 4.455 18.551 4.901 18.587C5.357 18.624 5.945 18.625 6.8 18.625L11.7 18.625C12.555 18.625 13.143 18.624 13.599 18.587C14.045 18.551 14.288 18.484 14.465 18.393C14.865 18.19 15.19 17.865 15.393 17.465C15.484 17.288 15.551 17.045 15.587 16.599C15.624 16.143 15.625 15.555 15.625 14.7L15.625 9.3ZM17.375 12C17.375 12.408 17.537 12.8 17.826 13.088L21.412 16.674C21.44 16.703 21.461 16.709 21.475 16.711C21.493 16.715 21.519 16.713 21.548 16.701C21.576 16.69 21.596 16.672 21.607 16.657C21.615 16.645 21.625 16.626 21.625 16.586L21.625 7.414C21.625 7.374 21.615 7.355 21.607 7.343C21.596 7.328 21.576 7.31 21.548 7.299C21.519 7.287 21.493 7.285 21.475 7.289C21.461 7.291 21.44 7.297 21.412 7.326L17.826 10.912C17.537 11.2 17.375 11.592 17.375 12Z",
];
const I_PLUS = [
  "M12.875 4.5C12.875 4.017 12.483 3.625 12 3.625C11.517 3.625 11.125 4.017 11.125 4.5L11.125 11.125L4.5 11.125C4.017 11.125 3.625 11.517 3.625 12C3.625 12.483 4.017 12.875 4.5 12.875L11.125 12.875L11.125 19.5C11.125 19.983 11.517 20.375 12 20.375C12.483 20.375 12.875 19.983 12.875 19.5L12.875 12.875L19.5 12.875C19.983 12.875 20.375 12.483 20.375 12C20.375 11.517 19.983 11.125 19.5 11.125L12.875 11.125L12.875 4.5Z",
];
const I_STICKER = [
  "M6.359 21.776C6.863 21.875 7.455 21.875 8.48 21.875L8.571 21.875C8.715 21.875 8.814 21.875 8.913 21.867C9.313 21.836 9.699 21.708 10.039 21.496C10.123 21.444 10.203 21.384 10.319 21.299L20.431 13.82C20.853 13.508 21.144 13.293 21.359 13.012C21.549 12.764 21.691 12.483 21.778 12.183C21.875 11.843 21.875 11.48 21.875 10.956L21.875 10.202C21.875 8.891 21.875 7.877 21.809 7.064C21.741 6.242 21.604 5.582 21.303 4.992C20.799 4.004 19.996 3.201 19.008 2.697C18.418 2.396 17.759 2.259 16.936 2.191C16.123 2.125 15.109 2.125 13.798 2.125L10.202 2.125C8.891 2.125 7.877 2.125 7.065 2.191C6.242 2.259 5.582 2.396 4.992 2.697C4.004 3.201 3.201 4.004 2.697 4.992C2.396 5.582 2.259 6.242 2.191 7.064C2.125 7.877 2.125 8.891 2.125 10.202L2.125 15.52C2.125 16.545 2.125 17.137 2.224 17.641C2.636 19.73 4.27 21.364 6.359 21.776ZM11.661 18.383L10.875 19.108C10.875 18.301 10.877 17.707 10.907 17.23C10.939 16.731 11.001 16.395 11.11 16.115C11.465 15.194 12.194 14.465 13.115 14.11C13.395 14.001 13.731 13.939 14.23 13.907C14.734 13.875 15.37 13.875 16.25 13.875L18.244 13.755L17.254 14.315C17.237 14.324 17.221 14.334 17.206 14.346L11.706 18.346C11.69 18.357 11.675 18.369 11.661 18.383ZM8.487 20.117C8.441 20.124 8.376 20.125 8.137 20.125C7.411 20.125 7.103 20.124 6.853 20.086C5.335 19.857 4.143 18.665 3.914 17.147C3.876 16.897 3.875 16.589 3.875 15.863L3.875 9.775C3.875 8.647 3.875 7.83 3.928 7.189C3.98 6.552 4.08 6.132 4.256 5.786C4.592 5.127 5.127 4.592 5.786 4.256C6.132 4.08 6.552 3.98 7.189 3.928C7.83 3.875 8.647 3.875 9.775 3.875L14.225 3.875C15.353 3.875 16.17 3.875 16.811 3.928C17.448 3.98 17.868 4.08 18.214 4.256C18.873 4.592 19.408 5.127 19.744 5.786C19.92 6.132 20.02 6.552 20.072 7.189C20.125 7.83 20.125 8.647 20.125 9.775L20.125 10.625C20.125 10.983 20.125 11.222 20.11 11.405C20.095 11.583 20.069 11.664 20.043 11.715C19.971 11.857 19.857 11.971 19.715 12.043C19.664 12.069 19.583 12.095 19.405 12.11C19.222 12.125 18.983 12.125 18.625 12.125L15.862 12.125C14.481 12.125 13.684 12.125 13.016 12.304C11.204 12.789 9.789 14.204 9.304 16.016C9.125 16.684 9.125 17.481 9.125 18.862L9.125 19.137C9.125 19.376 9.124 19.441 9.117 19.487C9.068 19.812 8.812 20.068 8.487 20.117Z",
];
const I_CAMERA = [
  "M12 6.375C8.755 6.375 6.125 9.005 6.125 12.25C6.125 15.495 8.755 18.125 12 18.125C15.245 18.125 17.875 15.495 17.875 12.25C17.875 9.005 15.245 6.375 12 6.375ZM7.875 12.25C7.875 9.972 9.722 8.125 12 8.125C14.278 8.125 16.125 9.972 16.125 12.25C16.125 14.528 14.278 16.375 12 16.375C9.722 16.375 7.875 14.528 7.875 12.25Z",
  "M10.13 1.625C9.324 1.625 8.555 1.963 8.01 2.557L6.803 3.875L5.5 3.875C3.084 3.875 1.125 5.834 1.125 8.25L1.125 17.5C1.125 19.916 3.084 21.875 5.5 21.875L18.5 21.875C20.916 21.875 22.875 19.916 22.875 17.5L22.875 8.25C22.875 5.834 20.916 3.875 18.5 3.875L17.197 3.875L15.99 2.557C15.445 1.963 14.676 1.625 13.87 1.625L10.13 1.625ZM9.301 3.74C9.514 3.507 9.814 3.375 10.13 3.375L13.87 3.375C14.186 3.375 14.486 3.507 14.699 3.74L16.167 5.341C16.333 5.522 16.567 5.625 16.813 5.625L18.5 5.625C19.95 5.625 21.125 6.8 21.125 8.25L21.125 17.5C21.125 18.95 19.95 20.125 18.5 20.125L5.5 20.125C4.05 20.125 2.875 18.95 2.875 17.5L2.875 8.25C2.875 6.8 4.05 5.625 5.5 5.625L7.188 5.625C7.433 5.625 7.667 5.522 7.833 5.341L9.301 3.74Z",
];
const I_MIC = [
  "M12 1.125C9.308 1.125 7.125 3.308 7.125 6L7.125 11.5C7.125 14.192 9.308 16.375 12 16.375C14.692 16.375 16.875 14.192 16.875 11.5L16.875 6C16.875 3.308 14.692 1.125 12 1.125ZM8.875 6C8.875 4.274 10.274 2.875 12 2.875C13.726 2.875 15.125 4.274 15.125 6L15.125 11.5C15.125 13.226 13.726 14.625 12 14.625C10.274 14.625 8.875 13.226 8.875 11.5L8.875 6Z",
  "M7.75 21.125C7.267 21.125 6.875 21.517 6.875 22C6.875 22.483 7.267 22.875 7.75 22.875L16.25 22.875C16.733 22.875 17.125 22.483 17.125 22C17.125 21.517 16.733 21.125 16.25 21.125L12.875 21.125L12.875 19.83C17.089 19.392 20.375 15.83 20.375 11.5L20.375 10.5C20.375 10.017 19.983 9.625 19.5 9.625C19.017 9.625 18.625 10.017 18.625 10.5L18.625 11.5C18.625 15.159 15.659 18.125 12 18.125C8.341 18.125 5.375 15.159 5.375 11.5L5.375 10.5C5.375 10.017 4.983 9.625 4.5 9.625C4.017 9.625 3.625 10.017 3.625 10.5L3.625 11.5C3.625 15.83 6.911 19.392 11.125 19.83L11.125 21.125L7.75 21.125Z",
];
const I_PERSON = [
  "M12 1.125C9.38 1.125 7.5 3.538 7.5 6.359C7.5 7.786 7.964 9.136 8.744 10.146C9.524 11.156 10.666 11.875 12 11.875C13.334 11.875 14.476 11.156 15.256 10.146C16.036 9.136 16.5 7.786 16.5 6.359C16.5 3.538 14.62 1.125 12 1.125ZM9.25 6.359C9.25 4.21 10.616 2.875 12 2.875C13.384 2.875 14.75 4.21 14.75 6.359C14.75 7.418 14.403 8.388 13.871 9.077C13.338 9.766 12.668 10.125 12 10.125C11.332 10.125 10.662 9.766 10.129 9.077C9.597 8.388 9.25 7.418 9.25 6.359Z",
  "M12 13.125C7.411 13.125 3.401 15.933 2.723 19.855C2.519 21.037 3.514 21.875 4.5 21.875L19.5 21.875C20.486 21.875 21.481 21.037 21.277 19.855C20.599 15.933 16.59 13.125 12 13.125ZM4.454 20.116C4.97 17.266 8.039 14.875 12 14.875C15.961 14.875 19.03 17.266 19.546 20.116C19.534 20.121 19.519 20.125 19.5 20.125L4.5 20.125C4.481 20.125 4.466 20.121 4.454 20.116Z",
];
const I_GROUP = [
  "M13 7.148C13 5.015 14.434 3.125 16.5 3.125C18.566 3.125 20 5.015 20 7.148C20 8.23 19.647 9.259 19.048 10.033C18.449 10.807 17.557 11.375 16.5 11.375C15.443 11.375 14.551 10.807 13.952 10.033C13.353 9.259 13 8.23 13 7.148ZM16.5 4.875C15.667 4.875 14.75 5.692 14.75 7.148C14.75 7.861 14.985 8.509 15.336 8.962C15.687 9.415 16.107 9.625 16.5 9.625C16.893 9.625 17.313 9.415 17.664 8.962C18.015 8.509 18.25 7.861 18.25 7.148C18.25 5.692 17.333 4.875 16.5 4.875Z",
  "M7.5 12.625C8.615 12.625 9.686 12.867 10.636 13.301C10.169 13.712 9.752 14.175 9.399 14.683C8.818 14.485 8.179 14.375 7.5 14.375C4.825 14.375 2.779 16.08 2.428 18.125L8.151 18.125C8.134 18.33 8.125 18.539 8.125 18.75C8.125 19.135 8.155 19.511 8.212 19.875L1.757 19.875C1.164 19.875 0.625 19.404 0.625 18.75C0.625 15.261 3.816 12.625 7.5 12.625Z",
  "M16.5 12.625C12.816 12.625 9.625 15.261 9.625 18.75C9.625 19.404 10.164 19.875 10.757 19.875L22.243 19.875C22.836 19.875 23.375 19.404 23.375 18.75C23.375 15.261 20.184 12.625 16.5 12.625ZM16.5 14.375C19.175 14.375 21.221 16.08 21.572 18.125L11.428 18.125C11.779 16.08 13.825 14.375 16.5 14.375Z",
  "M7.5 3.125C5.434 3.125 4 5.015 4 7.148C4 8.23 4.353 9.259 4.952 10.033C5.551 10.807 6.443 11.375 7.5 11.375C8.557 11.375 9.449 10.807 10.048 10.033C10.647 9.259 11 8.23 11 7.148C11 5.015 9.566 3.125 7.5 3.125ZM5.75 7.148C5.75 5.692 6.667 4.875 7.5 4.875C8.333 4.875 9.25 5.692 9.25 7.148C9.25 7.861 9.015 8.509 8.664 8.962C8.313 9.415 7.893 9.625 7.5 9.625C7.107 9.625 6.687 9.415 6.336 8.962C5.985 8.509 5.75 7.861 5.75 7.148Z",
];
const I_PLAY = [
  "M20.93 13.507C22.077 12.83 22.077 11.17 20.93 10.493L7.764 2.723C6.598 2.034 5.125 2.875 5.125 4.23L5.125 19.77C5.125 21.125 6.598 21.966 7.764 21.277L20.93 13.507Z",
];

/** Symbols.xcassets/arrow/arrow-up.pdf (Theme.iconImage(.arrowUp)), the iOS 26 send glyph. */
const I_ARROW_UP = [
  "M12.619 4.131C12.455 3.967 12.232 3.875 12 3.875C11.768 3.875 11.545 3.967 11.381 4.131L4.881 10.631C4.54 10.973 4.54 11.527 4.881 11.869C5.223 12.21 5.777 12.21 6.119 11.869L11.251 6.736L11.125 8.5L11.125 19.75C11.125 20.233 11.517 20.625 12 20.625C12.483 20.625 12.875 20.233 12.875 19.75L12.875 8.5L12.749 6.736L17.881 11.869C18.223 12.21 18.777 12.21 19.119 11.869C19.46 11.527 19.46 10.973 19.119 10.631L12.619 4.131Z",
];

/** SignalSymbol.audioSquare (Signal's symbol font), drawn as the same rounded square + bars. */
function AudioSquare({ color, size }: { color: string; size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      style={{ display: "inline-block", verticalAlign: `${-size * 0.16}px`, flexShrink: 0 }}
    >
      <rect x="1.1" y="1.1" width="13.8" height="13.8" rx="3.6" stroke={color} strokeWidth="1.3" />
      <path d="M5 6.6v2.8M8 4.6v6.8M11 6v4" stroke={color} strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

/** SF "chevron.backward" for the system back button (mirrors in RTL). */
function ChevronBack({ color }: { color: string }) {
  return (
    <svg width="12" height="20" viewBox="0 0 12 20" fill="none" className="rtl:-scale-x-100" style={{ display: "block" }}>
      <path d="M10.2 1.3 1.6 10l8.6 8.7" stroke={color} strokeWidth="2.55" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ------------------------------- avatar [AV] ------------------------------- */

const AVATAR_THEMES: [string, string][] = [
  ["#e3e3fe", "#3838f5"],
  ["#dde7fc", "#1251d3"],
  ["#d8e8f0", "#086da0"],
  ["#cde4cd", "#067906"],
  ["#eae0fd", "#661aff"],
  ["#f5e3fe", "#9f00f0"],
  ["#f6d8ec", "#b8057c"],
  ["#f5d7d7", "#be0404"],
  ["#fef5d0", "#836b01"],
  ["#eae6d5", "#7d6f40"],
  ["#d2d2dc", "#4f4f6d"],
  ["#d7d7d9", "#5c5c5c"],
];

function themeFor(name: string): [string, string] {
  let h = 2166136261;
  for (let i = 0; i < name.length; i++) h = Math.imul(h ^ name.charCodeAt(i), 16777619);
  return AVATAR_THEMES[(h >>> 0) % AVATAR_THEMES.length];
}

const ARABIC = /[؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿]/;

/** PersonNameComponentsFormatter(.abbreviated) as Signal uses it: initials, or nil when ≥ 4 chars. */
function abbreviation(name: string): string | null {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return null;
  let abbr: string;
  if (ARABIC.test(name)) {
    // No native abbreviation for Arabic script: the formatter returns the name itself.
    abbr = parts[0];
  } else {
    const first = Array.from(parts[0])[0] ?? "";
    const last = parts.length > 1 ? (Array.from(parts[parts.length - 1])[0] ?? "") : "";
    abbr = (first + last).toUpperCase();
  }
  return Array.from(abbr).length < 4 ? abbr : null;
}

/** AvatarBuilder default group avatar: theme fill + the group glyph. */
function GroupAvatar({ group, size }: { group: GroupChat; size: number }) {
  if (group.avatar) return <Avatar person={{ name: group.name, avatar: group.avatar }} size={size} />;
  const [bg, fg] = themeFor(group.name);
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full"
      style={{ width: size, height: size, background: bg }}
    >
      <Icon24 d={I_GROUP} color={fg} size={size * 0.6} />
    </div>
  );
}

function SignalAvatar({ person, size }: { person: Person; size: number }) {
  if (person.avatar) return <Avatar person={person} size={size} />;
  const [bg, fg] = themeFor(person.name);
  const abbr = abbreviation(person.name);
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full"
      style={{ width: size, height: size, background: bg, color: fg }}
    >
      {abbr ? (
        <span
          style={{
            fontFamily: AVATAR_FONT,
            fontWeight: 500,
            fontSize: size * 0.45 * (Array.from(abbr).length > 2 ? 0.8 : 1),
            lineHeight: 1,
            letterSpacing: "-0.01em",
          }}
        >
          {abbr}
        </span>
      ) : (
        <Icon24 d={I_PERSON} color={fg} size={size * 0.6} />
      )}
    </div>
  );
}

/* ------------------------------ helpers ------------------------------ */

function minutesOf(t: string): number | null {
  const mt = /^\s*(\d{1,2})[:.](\d{2})\s*([AaPp])?/.exec(t);
  if (!mt) return null;
  let h = Number(mt[1]) % 24;
  const mins = Number(mt[2]);
  const ap = mt[3]?.toLowerCase();
  if (ap === "p" && h < 12) h += 12;
  if (ap === "a" && h === 12) h = 0;
  return h * 60 + mins;
}

/** iOS sets the AM/PM marker off with a narrow no-break space. */
function clock(t: string): string {
  return t.trim().replace(/\s+(AM|PM|am|pm|ص|م)$/u, " $1");
}

/** [IVS] messages cluster when they are less than 3 minutes apart. */
function canCluster(a: Message, b: Message): boolean {
  if (a.sender !== b.sender) return false;
  // call rows are system messages; group messages cluster per author
  if (a.type === "call" || b.type === "call") return false;
  if (a.sender === "them" && (a.authorIndex ?? 0) !== (b.authorIndex ?? 0)) return false;
  const x = minutesOf(a.time);
  const y = minutesOf(b.time);
  if (x === null || y === null) return true;
  return Math.abs(y - x) < 3;
}

/** DisplayableText jumbomoji: 1–5 emoji and nothing else. */
const EMOJI_ONLY = new RegExp("^(?:\\p{Extended_Pictographic}|\\p{Emoji_Component}|\\u200d|\\ufe0f|\\s)+$", "u");
function emojiCount(text: string): number {
  const t = text.trim();
  if (!t || !EMOJI_ONLY.test(t) || /^[\d#*\s]+$/.test(t)) return 0;
  const s = t.replace(/\s/g, "");
  const n =
    typeof Intl !== "undefined" && "Segmenter" in Intl
      ? [...new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(s)].length
      : Array.from(s).length;
  return n <= 5 ? n : 0;
}
const JUMBO_FACTOR = [1, 3.5, 3, 2.75, 2.5, 2.25];

/** Deterministic speech-like levels in [0,1]. */
function levels(seed: string, n: number): number[] {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0;
    const r = (h % 1000) / 1000;
    const k = i / (n - 1);
    const env = 0.35 + 0.65 * Math.sin(Math.PI * Math.min(1, k * 1.15));
    out.push(Math.min(1, Math.max(0.06, (0.12 + r * 0.88) * env)));
  }
  return out;
}

function cornerRadii(mine: boolean, rtl: boolean, first: boolean, last: boolean): string {
  const outerRight = mine ? !rtl : rtl;
  const top = first ? R_WIDE : R_SHARP;
  const bottom = last ? R_WIDE : R_SHARP;
  // tl tr br bl
  return outerRight
    ? `${R_WIDE}px ${top}px ${bottom}px ${R_WIDE}px`
    : `${top}px ${R_WIDE}px ${R_WIDE}px ${bottom}px`;
}

/** URLs in a body are linkified, underlined in the body colour (linkifyStyle .underlined). */
const URL_RE = /(https?:\/\/[^\s]+|www\.[^\s]+)/g;
function richText(text: string): ReactNode {
  if (!URL_RE.test(text)) return text;
  URL_RE.lastIndex = 0;
  return text.split(URL_RE).map((part, i) =>
    i % 2 === 1 ? (
      <span key={i} style={{ textDecoration: "underline", textUnderlineOffset: 2, textDecorationThickness: 1 }}>
        {part}
      </span>
    ) : (
      part
    ),
  );
}

function domainOf(link: LinkPreview): string {
  if (link.siteName?.trim()) return link.siteName.trim().toLowerCase();
  try {
    return new URL(link.url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return link.url;
  }
}

/** Deterministic coordinates for the maps URL Signal appends to a shared location. */
function mapsUrl(seed: string): string {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  const lat = (24.6 + ((h >>> 0) % 100000) / 1e6).toFixed(6);
  const lon = (46.6 + ((h >>> 8) % 100000) / 1e6).toFixed(6);
  return `https://maps.google.com/maps?q=${lat}%2C${lon}`;
}

/* ------------------------------- footer [FT] ------------------------------- */

interface FooterSpec {
  time: string;
  status?: DeliveryStatus;
  color: string;
  /** MESSAGE_STATUS_EDITED label shown before the time */
  edited?: string;
}

function Footer({
  spec,
  rtl,
  borderless,
  innerRef,
}: {
  spec: FooterSpec;
  rtl: boolean;
  borderless?: boolean;
  innerRef?: React.Ref<HTMLDivElement>;
}) {
  return (
    <div
      ref={innerRef}
      dir={rtl ? "rtl" : "ltr"}
      className="flex items-center"
      style={{
        gap: 4,
        color: spec.color,
        fontSize: 12,
        lineHeight: `${CAPTION_LINE}px`,
        height: CAPTION_LINE + (borderless ? 6 : 0),
        padding: borderless ? "3px 12px" : 0,
        whiteSpace: "nowrap",
        boxSizing: "border-box",
      }}
    >
      {spec.edited && <span>{spec.edited}</span>}
      <span>{clock(spec.time)}</span>
      {spec.status && (
        <span key={spec.status} className="sig-ios-anim flex" style={{ width: 18, height: 12, justifyContent: "flex-start" }}>
          <StatusIcon status={spec.status} color={spec.color} />
        </span>
      )}
    </div>
  );
}

/* ----------------------- text block with footer overlap [CM] ----------------------- */

interface TextLayout {
  w: number;
  overlap: boolean;
}

/**
 * Body text sized like UILabel (bounding box of the laid-out lines, not the
 * available width) with Signal's footer placement: overlapping the last line
 * when there is room and no collision, else on its own row 3pt below.
 */
function TextBlock({
  text,
  size,
  color,
  footer,
  uiRtl,
  borderless,
  fontsTick,
  fill,
  maxText = MAX_TEXT,
  lead,
}: {
  text: string;
  size: number;
  color: string;
  footer: FooterSpec | null;
  uiRtl: boolean;
  borderless?: boolean;
  fontsTick: number;
  /** take the whole bubble width (a wider quote above sets it) */
  fill?: boolean;
  /** text column width limit (group threads are narrower) */
  maxText?: number;
  /** inline glyph before the text (deleted-message symbol) */
  lead?: ReactNode;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const footRef = useRef<HTMLDivElement>(null);
  const [lay, setLay] = useState<TextLayout | null>(null);
  const dir = dirOf(text);
  const lineH = size * SF_LINE;
  const footerH = CAPTION_LINE + (borderless ? 6 : 0);
  const footerKey = footer ? `${footer.time}|${footer.status ?? ""}|${footer.edited ?? ""}` : "";

  useLayoutEffect(() => {
    const wrap = wrapRef.current;
    const span = textRef.current;
    if (!wrap || !span) return;
    const prev = wrap.style.width;
    wrap.style.width = `${maxText}px`;
    const box = wrap.getBoundingClientRect();
    const k = box.width / maxText || 1;
    const range = document.createRange();
    range.selectNodeContents(span);
    const rects = Array.from(range.getClientRects()).filter((r) => r.width > 0 && r.height > 0);
    wrap.style.width = prev;
    // group fragments into visual lines
    const lines: { top: number; l: number; r: number }[] = [];
    for (const r of rects) {
      const mid = (r.top + r.bottom) / 2;
      const line = lines.find((x) => Math.abs(x.top - mid) < (lineH * k) / 2);
      if (line) {
        line.l = Math.min(line.l, r.left);
        line.r = Math.max(line.r, r.right);
      } else lines.push({ top: mid, l: r.left, r: r.right });
    }
    lines.sort((a, b) => a.top - b.top);
    const widths = lines.map((x) => (x.r - x.l) / k);
    const textW = Math.ceil(Math.max(0, ...widths));
    const lastW = Math.ceil(widths[widths.length - 1] ?? 0);
    let next: TextLayout = { w: textW, overlap: false };
    if (footer && footRef.current) {
      const fw = footRef.current.offsetWidth;
      const minGap = 6 * Math.max(1, lineH / 20);
      const overlapW = Math.max(textW, lastW + minGap + fw);
      const textRight = dir === "rtl";
      const footerRight = !uiRtl;
      const collide = textRight === footerRight;
      if (overlapW <= maxText && !collide) next = { w: Math.ceil(overlapW), overlap: true };
      else next = { w: Math.max(textW, fw), overlap: false };
    }
    setLay((old) => (old && old.w === next.w && old.overlap === next.overlap ? old : next));
  }, [text, size, footerKey, uiRtl, dir, lineH, footer, fontsTick, maxText]);

  // Footer geometry from CVComponentMessage.tryToOverlapBodyTextAndFooter.
  const fontOuter = Math.max(0, lineH - size * (SF_CAP + SF_DESC)) * 0.5;
  const overlapH = footerH * 0.5 + fontOuter + size * SF_DESC;
  const extra = !footer ? 0 : lay?.overlap ? footerH - overlapH : 3 + footerH;

  return (
    <div
      ref={wrapRef}
      className="relative"
      style={{
        display: "flow-root",
        width: fill ? "100%" : lay ? lay.w : maxText,
        minWidth: fill && lay ? lay.w : 0,
        maxWidth: maxText,
      }}
    >
      <div
        dir={dir}
        style={{
          fontSize: size,
          lineHeight: `${lineH}px`,
          letterSpacing: size === BODY ? "-0.43px" : 0,
          color,
          whiteSpace: "pre-wrap",
          overflowWrap: "break-word",
          marginBottom: extra,
        }}
      >
        <span ref={textRef}>
          {lead}
          {richText(text)}
        </span>
      </div>
      {footer && (
        <div className="absolute bottom-0" style={uiRtl ? { left: 0 } : { right: 0 }}>
          <Footer spec={footer} rtl={uiRtl} borderless={borderless} innerRef={footRef} />
        </div>
      )}
    </div>
  );
}

/* ------------------------------ quoted reply [QR] ------------------------------ */

interface QuoteSpec {
  author: string;
  /** snippet text (caption / body), or the attachment label */
  text: string;
  /** the snippet is an attachment-type label (italic) rather than quoted text */
  typeLabel: boolean;
  voice: boolean;
  /** thumbnail for an image target (null src = image that failed to load) */
  thumb: { src: string | null } | null;
}

function quoteOf(target: Message, them: Person, l: (typeof LOCAL)[Lang]): QuoteSpec {
  const author = target.sender === "me" ? l.you : them.name;
  if (target.type === "voice") return { author, text: l.voice, typeLabel: false, voice: true, thumb: null };
  if (target.type === "image") {
    const caption = target.text.trim();
    return {
      author,
      text: caption || l.photo,
      typeLabel: !caption,
      voice: false,
      thumb: { src: target.imageSrc ?? null },
    };
  }
  return { author, text: target.text.trim(), typeLabel: false, voice: false, thumb: null };
}

/**
 * CVQuotedMessageView: tinted box (wide 10 / sharp 4 corners) with a 4pt
 * stripe, 8pt gaps, author (footnote semibold) over the snippet
 * (subheadline, 2 lines — 1 next to a thumbnail), 6pt vertical margins.
 * Colours [UC]: outgoing = ColorBase (stripe white 80%, tint white 60/48%,
 * black text); incoming without wallpaper = LightBase (stripe white / white
 * 48%, tint white 60% / 16%, label text). The incoming tint starts after the
 * stripe (bubbleView leading layout margin).
 */
function QuoteBlock({
  q,
  mine,
  dark,
  p,
  rtl,
  topStartSharp,
  topEndSharp,
}: {
  q: QuoteSpec;
  mine: boolean;
  dark: boolean;
  p: Palette;
  rtl: boolean;
  topStartSharp: boolean;
  topEndSharp: boolean;
}) {
  const stripe = mine ? "rgba(255,255,255,0.8)" : dark ? "rgba(255,255,255,0.48)" : "#ffffff";
  const tint = mine
    ? dark
      ? "rgba(255,255,255,0.48)"
      : "rgba(255,255,255,0.6)"
    : dark
      ? "rgba(255,255,255,0.16)"
      : "rgba(255,255,255,0.6)";
  const fg = mine ? "#000000" : p.label;
  const thumbSize = q.thumb ? (q.typeLabel ? 64 : 72) : 0;
  const ts = topStartSharp ? QUOTE_R_SHARP : QUOTE_R_WIDE;
  const te = topEndSharp ? QUOTE_R_SHARP : QUOTE_R_WIDE;
  // physical radii: tl tr br bl
  const radius = rtl
    ? `${te}px ${ts}px ${QUOTE_R_SHARP}px ${QUOTE_R_SHARP}px`
    : `${ts}px ${te}px ${QUOTE_R_SHARP}px ${QUOTE_R_SHARP}px`;
  const snippetDir = dirOf(q.text);
  return (
    <div
      dir={rtl ? "rtl" : "ltr"}
      className="relative flex overflow-hidden"
      style={{ borderRadius: radius, background: mine ? tint : undefined, minHeight: thumbSize || undefined }}
    >
      {!mine && <div className="absolute inset-y-0" style={{ insetInlineStart: 4, insetInlineEnd: 0, background: tint }} />}
      <div className="relative shrink-0" style={{ width: 4, background: stripe }} />
      <div className="relative min-w-0 flex-1" style={{ padding: "6px 0", marginInline: 8 }}>
        <div
          dir={dirOf(q.author)}
          className="truncate"
          style={{
            color: fg,
            fontSize: 13,
            lineHeight: `${FOOTNOTE_LINE}px`,
            fontWeight: 600,
            letterSpacing: "-0.08px",
            width: "fit-content",
            maxWidth: "100%",
          }}
        >
          {q.author}
        </div>
        <div style={{ height: 2 }} />
        <div
          dir={snippetDir}
          style={{
            color: fg,
            fontSize: 15,
            lineHeight: `${SUBHEAD_LINE}px`,
            letterSpacing: "-0.23px",
            fontStyle: q.typeLabel ? "italic" : undefined,
            display: "-webkit-box",
            WebkitBoxOrient: "vertical",
            WebkitLineClamp: q.thumb ? 1 : 2,
            overflow: "hidden",
            overflowWrap: "anywhere",
            width: "fit-content",
            maxWidth: "100%",
          }}
        >
          {q.voice && (
            <>
              <AudioSquare color={fg} size={15} />{" "}
            </>
          )}
          {q.text}
        </div>
      </div>
      {q.thumb && (
        <div className="relative shrink-0" style={{ width: thumbSize, alignSelf: "stretch", background: p.mediaFill }}>
          {q.thumb.src && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={q.thumb.src}
              alt=""
              draggable={false}
              className="absolute inset-0 block h-full w-full"
              style={{ objectFit: "cover" }}
            />
          )}
        </div>
      )}
    </div>
  );
}

/* ------------------------------ reactions [RC] ------------------------------ */

/**
 * CVReactionCountsView pill: 24pt capsule, 1pt border in the chat background
 * colour, 3/7 margins, bold 14pt emoji. Fill: gray05 / gray90 when the
 * reaction is the other person's, gray25 / gray60 when it is mine. Placed
 * 7pt over the bubble's bottom edge, 6pt in from the edge that faces the
 * middle of the screen; a bubble narrower than the pill lets it extend
 * further into the middle (CVComponentMessage reactions layout block).
 */
function ReactionPill({
  emoji,
  fromMe,
  innerLeft,
  dark,
  p,
}: {
  emoji: string;
  fromMe: boolean;
  innerLeft: boolean;
  dark: boolean;
  p: Palette;
}) {
  const fill = fromMe ? (dark ? "#5e5e5e" : "#b9b9b9") : dark ? "#1b1b1b" : "#e9e9e9";
  return (
    <div
      dir="ltr"
      className="pointer-events-none absolute flex"
      style={{
        left: 0,
        right: 0,
        top: `calc(100% - ${REACTION_OVERLAP}px)`,
        padding: `0 ${REACTION_INSET}px`,
        justifyContent: innerLeft ? "flex-end" : "flex-start",
      }}
    >
      <div
        className="flex shrink-0 items-center justify-center"
        style={{
          height: REACTION_H,
          borderRadius: REACTION_H / 2,
          border: `1px solid ${p.bg}`,
          background: fill,
          padding: "0 6px",
          boxSizing: "border-box",
          marginRight: innerLeft ? "auto" : undefined,
          marginLeft: innerLeft ? undefined : "auto",
        }}
      >
        <span style={{ fontSize: 14, lineHeight: "17px", fontWeight: 700 }}>{emoji}</span>
      </div>
    </div>
  );
}

/* ------------------------------- bubbles ------------------------------- */

interface SenderSpec {
  name: string;
  color: string;
}

interface BubbleCtx {
  p: Palette;
  rtl: boolean;
  mine: boolean;
  dark: boolean;
  radii: string;
  footer: FooterSpec | null;
  fontsTick: number;
  quote: QuoteSpec | null;
  /** the bubble's top corners touch a clustered neighbour (sharp) — start / end side */
  topStartSharp: boolean;
  topEndSharp: boolean;
  /** [CS] maxMessageWidth: 317, or 285 in a group thread */
  maxBubble: number;
  /** group threads: CVComponentSenderName on the first message of an author's run */
  sender: SenderSpec | null;
}

/**
 * CVComponentSenderName: footnote semibold in the member's GroupNameColors
 * colour, leading-aligned at the top of the bubble (textInsets top / sides).
 */
function SenderLabel({ ctx, pad }: { ctx: BubbleCtx; pad?: string }) {
  if (!ctx.sender) return null;
  return (
    <div
      dir={ctx.rtl ? "rtl" : "ltr"}
      className="truncate"
      style={{
        padding: pad ?? `${TEXT_INSET_Y}px ${TEXT_INSET_X}px 0`,
        color: ctx.sender.color,
        fontSize: 13,
        lineHeight: `${FOOTNOTE_LINE}px`,
        fontWeight: 600,
        letterSpacing: "-0.08px",
        maxWidth: ctx.maxBubble,
      }}
    >
      <bdi>{ctx.sender.name}</bdi>
    </div>
  );
}

/** Quote at the top of a bubble: 7pt top inset (5 under a sender name), 8pt side margins. */
function QuoteHeader({ ctx, top = TEXT_INSET_Y }: { ctx: BubbleCtx; top?: number }) {
  if (!ctx.quote) return null;
  return (
    <div style={{ padding: `${top}px 8px 0` }}>
      <QuoteBlock
        q={ctx.quote}
        mine={ctx.mine}
        dark={ctx.dark}
        p={ctx.p}
        rtl={ctx.rtl}
        topStartSharp={ctx.topStartSharp}
        topEndSharp={ctx.topEndSharp}
      />
    </div>
  );
}

function bubbleFill(ctx: BubbleCtx): { className: string; style: CSSProperties } {
  return ctx.mine
    ? { className: "sig-ios-out", style: {} }
    : { className: "", style: { background: ctx.p.inBubble } };
}

/**
 * CVLinkPreviewView, compact adapter (Signal-iOS 2026): r10 card filled with
 * fillTertiary (LightBase for incoming, ColorBase for outgoing), 10pt margins,
 * 64pt image (r6) then 12pt, text stack with 4pt spacing: title subheadline
 * semibold ×2, description footnote ×3, lower-cased domain caption1. Outgoing
 * text is labelInverted (black / black 70%).
 */
function LinkCard({ link, ctx }: { link: LinkPreview; ctx: BubbleCtx }) {
  const { mine, dark, p, rtl } = ctx;
  const bg = mine
    ? dark
      ? "rgba(255,255,255,0.48)"
      : "rgba(255,255,255,0.6)"
    : dark
      ? "rgba(255,255,255,0.16)"
      : "rgba(255,255,255,0.6)";
  const fg = mine ? "#000000" : p.label;
  const fg2 = mine ? "rgba(0,0,0,0.7)" : p.secondary;
  const align: CSSProperties = { textAlign: rtl ? "right" : "left" };
  const clamp = (n: number): CSSProperties => ({
    display: "-webkit-box",
    WebkitBoxOrient: "vertical",
    WebkitLineClamp: n,
    overflow: "hidden",
    overflowWrap: "anywhere",
  });
  return (
    <div
      dir={rtl ? "rtl" : "ltr"}
      className="flex items-start overflow-hidden"
      style={{ borderRadius: 10, background: bg, padding: 10, gap: 12 }}
    >
      {link.image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={link.image}
          alt=""
          draggable={false}
          className="block shrink-0"
          style={{ width: 64, height: 64, borderRadius: 6, objectFit: "cover" }}
        />
      )}
      <div className="flex min-w-0 flex-1 flex-col" style={{ gap: 4 }}>
        {link.title && (
          <div
            style={{
              ...align,
              ...clamp(2),
              color: fg,
              fontSize: 15,
              lineHeight: `${SUBHEAD_LINE}px`,
              fontWeight: 600,
              letterSpacing: "-0.23px",
            }}
          >
            <bdi>{link.title}</bdi>
          </div>
        )}
        {link.description && (
          <div style={{ ...align, ...clamp(3), color: fg2, fontSize: 13, lineHeight: `${FOOTNOTE_LINE}px`, letterSpacing: "-0.08px" }}>
            <bdi>{link.description}</bdi>
          </div>
        )}
        <div className="truncate" style={{ ...align, color: fg2, fontSize: 12, lineHeight: `${CAPTION_LINE}px` }}>
          <bdi>{domainOf(link)}</bdi>
        </div>
      </div>
    </div>
  );
}

function TextBubble({ m, text, ctx }: { m: Message; text: string; ctx: BubbleCtx }) {
  const fill = bubbleFill(ctx);
  const link = m.link ?? null;
  const stacked = !!ctx.quote || !!ctx.sender || !!link;
  const maxText = ctx.maxBubble - TEXT_INSET_X * 2;
  // CVComponentMessage spacings: name→quote 5, name→large 5, quote→large 8,
  // large→body 7, name→body 1
  const quoteTop = ctx.sender ? 5 : TEXT_INSET_Y;
  const linkTop = ctx.quote ? 8 : ctx.sender ? 5 : TEXT_INSET_Y;
  const bodyTop = link || ctx.quote ? TEXT_INSET_Y : ctx.sender ? 1 : TEXT_INSET_Y;
  return (
    <div
      className={`relative ${fill.className}`}
      style={{
        ...fill.style,
        borderRadius: ctx.radii,
        padding: stacked ? 0 : `${TEXT_INSET_Y}px ${TEXT_INSET_X}px`,
        minWidth: R_WIDE * 2,
        maxWidth: ctx.maxBubble,
        width: link ? ctx.maxBubble : undefined,
        display: stacked ? "flex" : undefined,
        flexDirection: stacked ? "column" : undefined,
      }}
    >
      <SenderLabel ctx={ctx} />
      <QuoteHeader ctx={ctx} top={quoteTop} />
      {link && (
        <div style={{ padding: `${linkTop}px 8px 0` }}>
          <LinkCard link={link} ctx={ctx} />
        </div>
      )}
      <div style={stacked ? { padding: `${bodyTop}px ${TEXT_INSET_X}px ${TEXT_INSET_Y}px` } : undefined}>
        <TextBlock
          text={text}
          size={BODY}
          color={ctx.mine ? ctx.p.outText : ctx.p.inText}
          footer={ctx.footer}
          uiRtl={ctx.rtl}
          fontsTick={ctx.fontsTick}
          fill={stacked}
          maxText={maxText}
        />
      </div>
    </div>
  );
}

/** SignalSymbol.xCircle, inline before the remotely-deleted text. */
function XCircle({ color, size }: { color: string; size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      style={{ display: "inline-block", verticalAlign: `${-size * 0.17}px`, marginInlineEnd: size * 0.28 }}
    >
      <circle cx="10" cy="10" r="8.35" stroke={color} strokeWidth="1.5" />
      <path d="M7 7l6 6M13 7l-6 6" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

/**
 * Remotely deleted (CVComponentBodyText.textViewConfigForRemotelyDeleted +
 * CVComponentMessage.bubbleChatColor/bubbleStroke): background-coloured bubble
 * with a 1pt transparentSeparator stroke, xCircle + "<name> deleted this
 * message" / "You deleted this message" in secondaryLabel, secondary footer.
 */
function DeletedBubble({ text, ctx }: { text: string; ctx: BubbleCtx }) {
  const { p, dark } = ctx;
  const footer = ctx.footer ? { ...ctx.footer, status: undefined, color: p.secondary } : null;
  return (
    <div
      className="relative flex flex-col"
      style={{
        background: p.bg,
        border: `1px solid ${dark ? SEPARATOR.dark : SEPARATOR.light}`,
        boxSizing: "border-box",
        borderRadius: ctx.radii,
        minWidth: R_WIDE * 2,
        maxWidth: ctx.maxBubble,
      }}
    >
      <SenderLabel ctx={ctx} pad={`${TEXT_INSET_Y - 1}px ${TEXT_INSET_X - 1}px 0`} />
      <div style={{ padding: `${ctx.sender ? 1 : TEXT_INSET_Y - 1}px ${TEXT_INSET_X - 1}px ${TEXT_INSET_Y - 1}px` }}>
        <TextBlock
          text={text}
          size={BODY}
          color={p.secondary}
          footer={footer}
          uiRtl={ctx.rtl}
          fontsTick={ctx.fontsTick}
          maxText={ctx.maxBubble - TEXT_INSET_X * 2}
          lead={<XCircle color={p.secondary} size={17} />}
        />
      </div>
    </div>
  );
}

function JumboBubble({ text, count, ctx }: { text: string; count: number; ctx: BubbleCtx }) {
  const size = BODY * JUMBO_FACTOR[count];
  const footer = ctx.footer ? { ...ctx.footer, color: ctx.p.secondary } : null;
  return (
    <div style={{ padding: `${TEXT_INSET_Y}px ${TEXT_INSET_X}px` }}>
      {ctx.sender && <SenderLabel ctx={ctx} pad="0 0 1px" />}
      <TextBlock text={text.trim()} size={size} color={ctx.p.label} footer={footer} uiRtl={ctx.rtl} borderless fontsTick={ctx.fontsTick} />
    </div>
  );
}

/**
 * Borderless sticker message (CVComponentMessage borderless stack:
 * [senderName, sticker, footer]); CVComponentSticker is 175pt square. An
 * emoji "sticker" is drawn as the big emoji artwork.
 */
function StickerBubble({ m, ctx }: { m: Message; ctx: BubbleCtx }) {
  const footer = ctx.footer ? { ...ctx.footer, color: ctx.p.secondary } : null;
  const emoji = m.text.trim() || "🙂";
  return (
    <div className="flex flex-col" style={{ alignItems: "flex-start" }}>
      {ctx.sender && <SenderLabel ctx={ctx} pad={`0 ${TEXT_INSET_X}px 5px`} />}
      <div className="relative flex items-center justify-center" style={{ width: STICKER, height: STICKER }}>
        {m.imageSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={m.imageSrc} alt="" draggable={false} className="block h-full w-full" style={{ objectFit: "contain" }} />
        ) : (
          <span style={{ fontSize: 132, lineHeight: `${STICKER}px`, letterSpacing: 0 }}>{emoji}</span>
        )}
      </div>
      {footer && (
        <div style={{ alignSelf: "flex-end" }}>
          <Footer spec={footer} rtl={ctx.rtl} borderless />
        </div>
      )}
    </div>
  );
}

/** Symbols.xcassets generic-attachment: 36×48 page with a folded corner. */
function DocIcon({ ext }: { ext: string }) {
  return (
    <div className="relative shrink-0" style={{ width: 36, height: 48 }}>
      <svg width="36" height="48" viewBox="0 0 36 48" style={{ display: "block" }}>
        <path d="M5 0.5h18.6L35.5 12.4V43a4.5 4.5 0 0 1-4.5 4.5H5A4.5 4.5 0 0 1 0.5 43V5A4.5 4.5 0 0 1 5 0.5Z" fill="#ffffff" stroke="rgba(0,0,0,0.12)" />
        <path d="M23.6 0.5V8a4.4 4.4 0 0 0 4.4 4.4h7.5Z" fill="#dcdcdc" />
      </svg>
      <span
        className="absolute inset-x-0 flex justify-center"
        style={{ top: 21, fontSize: ext.length > 3 ? 9.5 : 12, lineHeight: "14px", fontWeight: 600, color: "#1b1b1b" }}
      >
        {ext}
      </span>
    </div>
  );
}

/**
 * CVComponentGenericAttachment: hStack (8pt, 5pt vertical margins) of the
 * generic-attachment icon with the upper-cased extension (caption1 semibold,
 * gray90) and a vStack (1pt) of the file name (subheadline, bubble text
 * colour) over the size (caption1, bubble secondary). Footer 5pt below.
 */
function FileBubble({ m, ctx }: { m: Message; ctx: BubbleCtx }) {
  const { p, mine } = ctx;
  const fill = bubbleFill(ctx);
  const f = m.file ?? { name: "Document" };
  const dot = f.name.lastIndexOf(".");
  const ext = dot > 0 ? f.name.slice(dot + 1).toUpperCase().slice(0, 4) : "";
  const top = ctx.quote ? 8 : ctx.sender ? 5 : TEXT_INSET_Y;
  return (
    <div
      className={`relative flex flex-col ${fill.className}`}
      style={{ ...fill.style, borderRadius: ctx.radii, maxWidth: ctx.maxBubble, minWidth: 0 }}
    >
      <SenderLabel ctx={ctx} />
      <QuoteHeader ctx={ctx} top={ctx.sender ? 5 : TEXT_INSET_Y} />
      <div style={{ padding: `${top}px ${TEXT_INSET_X}px ${TEXT_INSET_Y}px` }}>
        <div dir={ctx.rtl ? "rtl" : "ltr"} className="flex items-center" style={{ gap: 8, padding: "5px 0" }}>
          <DocIcon ext={ext} />
          <div className="flex min-w-0 flex-col" style={{ gap: 1 }}>
            <div
              className="truncate"
              style={{ color: mine ? p.outText : p.inText, fontSize: 15, lineHeight: `${SUBHEAD_LINE}px`, letterSpacing: "-0.23px" }}
            >
              <bdi>{f.name}</bdi>
            </div>
            {f.size && (
              <div style={{ color: mine ? p.outSecondary : p.secondary, fontSize: 12, lineHeight: `${CAPTION_LINE}px` }}>
                <bdi>{f.size}</bdi>
              </div>
            )}
          </div>
        </div>
        {ctx.footer && (
          <div className="flex" style={{ justifyContent: "flex-end", marginTop: 5 }}>
            <Footer spec={ctx.footer} rtl={ctx.rtl} />
          </div>
        )}
      </div>
    </div>
  );
}

function VoiceBubble({ m, ctx }: { m: Message; ctx: BubbleCtx }) {
  const { p, mine } = ctx;
  const fill = bubbleFill(ctx);
  const waveW = AUDIO_W - TEXT_INSET_X * 2 - 40 - 12 - 6;
  const n = Math.floor((waveW + 2) / 4);
  const gap = (waveW - n * 2) / (n - 1);
  const lv = levels(m.id, n);
  const unplayed = mine ? "rgba(255,255,255,0.4)" : p.quaternary;
  const thumb = mine ? "#ffffff" : p.label;
  const glyph = mine ? "#ffffff" : p.label;
  const timeColor = mine ? "rgba(255,255,255,0.8)" : p.secondary;
  const dotColor = mine ? p.outSecondary : p.secondary;
  const top = ctx.quote ? TEXT_INSET_Y : ctx.sender ? 5 : TEXT_INSET_Y;
  return (
    <div className={`relative ${fill.className}`} style={{ ...fill.style, borderRadius: ctx.radii, width: AUDIO_W }}>
      <SenderLabel ctx={ctx} />
      <QuoteHeader ctx={ctx} top={ctx.sender ? 5 : TEXT_INSET_Y} />
      <div style={{ padding: `${top}px ${TEXT_INSET_X}px ${TEXT_INSET_Y}px` }}>
      <div dir="ltr" className="flex items-center" style={{ height: 48, padding: "4px 0" }}>
        <span
          className="flex shrink-0 items-center justify-center rounded-full"
          style={{ width: 40, height: 40, background: mine ? "rgba(255,255,255,0.2)" : p.playIn }}
        >
          <Icon24 d={I_PLAY} color={glyph} size={17} evenOdd={false} />
        </span>
        <span style={{ width: 12 }} />
        <span className="relative block" style={{ width: waveW, height: 32 }}>
          {lv.map((v, i) => {
            const h = Math.max(2, Math.round(32 * v * 2) / 2);
            return (
              <span
                key={i}
                className="absolute block"
                style={{ left: i * (2 + gap), top: (32 - h) / 2, width: 2, height: h, borderRadius: 1, background: unplayed }}
              />
            );
          })}
          <span className="absolute block" style={{ left: 0, top: 0, width: 2, height: 32, borderRadius: 1, background: thumb }} />
        </span>
        <span style={{ width: 6 }} />
      </div>
      <div style={{ height: 2 }} />
      <div className="relative flex items-center" style={{ height: Math.ceil(CAPTION_LINE), gap: 8 }}>
        <span style={{ color: timeColor, fontSize: 12, lineHeight: `${CAPTION_LINE}px`, fontVariantNumeric: "tabular-nums" }}>
          {(m.voiceDuration || "0:09").trim()}
        </span>
        <span className="block rounded-full" style={{ width: 6, height: 6, background: dotColor }} />
        {ctx.footer && (
          <div className="absolute bottom-0" style={ctx.rtl ? { left: 0 } : { right: 0 }}>
            <Footer spec={ctx.footer} rtl={ctx.rtl} />
          </div>
        )}
      </div>
      </div>
    </div>
  );
}

/**
 * Shared location (LocationPicker.swift): a 256pt-square MKMapSnapshotter
 * image with a legacy MKPinAnnotationView tinted Signal accent, sent as a
 * photo whose caption is "<address>\n\n<maps.google.com URL>". The map art
 * below is a plausible Apple Maps street grid (light / dark).
 */
function MapArt({ dark, accent }: { dark: boolean; accent: string }) {
  const c = dark
    ? { land: "#242426", block: "#2c2c2f", park: "#22322a", water: "#1a2a3c", road: "#3d3d41", casing: "#1c1c1e", major: "#6b5a33", majorCasing: "#3a3222" }
    : { land: "#f6f2ea", block: "#ece7dd", park: "#cfe7c0", water: "#a6d2f2", road: "#ffffff", casing: "#ddd8cd", major: "#fbd877", majorCasing: "#e8bf55" };
  const minor = ["M-10 52H266", "M-10 118H266", "M-10 188H266", "M40 -10V266", "M104 -10V266", "M176 -10V266", "M226 -10V266"];
  return (
    <svg viewBox="0 0 256 256" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 block h-full w-full">
      <rect width="256" height="256" fill={c.land} />
      {[
        [6, 8, 28, 38], [50, 8, 48, 38], [114, 8, 56, 38], [186, 8, 34, 38], [236, 8, 20, 38],
        [6, 60, 28, 52], [50, 60, 48, 22], [50, 88, 48, 24], [186, 60, 34, 52], [236, 60, 20, 52],
        [6, 126, 28, 56], [114, 126, 56, 56], [186, 126, 34, 56], [236, 126, 20, 56],
        [6, 196, 28, 56], [50, 196, 48, 56], [114, 196, 56, 56], [186, 196, 34, 56],
      ].map(([x, y, w, h], i) => (
        <rect key={i} x={x} y={y} width={w} height={h} rx="2" fill={c.block} />
      ))}
      <rect x="114" y="60" width="56" height="52" rx="3" fill={c.park} />
      <rect x="50" y="126" width="48" height="56" rx="3" fill={c.park} />
      <path d="M232 196C244 210 250 232 262 256H226C226 236 224 214 232 196Z" fill={c.water} />
      {minor.map((d) => (
        <path key={`c${d}`} d={d} stroke={c.casing} strokeWidth="9" fill="none" />
      ))}
      {minor.map((d) => (
        <path key={d} d={d} stroke={c.road} strokeWidth="7" fill="none" />
      ))}
      <path d="M-10 214L266 34" stroke={c.majorCasing} strokeWidth="13" fill="none" />
      <path d="M-10 214L266 34" stroke={c.major} strokeWidth="10" fill="none" />
      {/* legacy MKPinAnnotationView: needle + glossy head, point on the coordinate */}
      <path d="M128 128V109" stroke={dark ? "#8e8e93" : "#7a7a7f"} strokeWidth="2" strokeLinecap="round" />
      <ellipse cx="128.5" cy="128.5" rx="4" ry="1.6" fill="rgba(0,0,0,0.22)" />
      <circle cx="128" cy="102" r="8" fill={accent} />
      <circle cx="128" cy="102" r="8" fill="none" stroke="rgba(0,0,0,0.18)" strokeWidth="0.8" />
      <circle cx="125.4" cy="99.4" r="2.6" fill="rgba(255,255,255,0.7)" />
    </svg>
  );
}

interface MediaOverride {
  node: ReactNode;
  /** natural aspect (w / h) */
  ratio: number;
  caption: string;
}

function MediaBubble({ m, ctx, override }: { m: Message; ctx: BubbleCtx; override?: MediaOverride }) {
  const { p, mine } = ctx;
  const [ratio, setRatio] = useState<number | null>(null);
  const max = ctx.maxBubble;
  const caption = override ? override.caption : m.text;
  const hasCaption = caption.trim().length > 0;
  const src = override ? null : m.imageSrc;
  const r0 = override ? override.ratio : src ? ratio : null;
  // CVMediaAlbumView single-item sizing inside the max-width square.
  let mw = max;
  let mh = max;
  if (r0) {
    const r = Math.min(1 / 0.35, Math.max(0.35, r0));
    mw = max * r;
    mh = max;
    if (mw > max) {
      mw = max;
      mh = max / r;
    }
    mw = Math.round(mw);
    mh = Math.round(mh);
  } else if (src) {
    mw = Math.round(max * 0.75);
  }
  const fill = bubbleFill(ctx);
  // a quote or a group sender name above the media gives the bubble its fill
  const filled = hasCaption || !!ctx.quote || !!ctx.sender;
  const overlay = !hasCaption && ctx.footer ? { ...ctx.footer, color: "#ffffff" } : null;
  return (
    <div
      className={`relative overflow-hidden ${filled ? fill.className : ""}`}
      style={{ ...(filled ? fill.style : {}), borderRadius: ctx.radii, display: "flex", flexDirection: "column", minWidth: mw, maxWidth: max }}
    >
      <SenderLabel ctx={ctx} />
      <QuoteHeader ctx={ctx} top={ctx.sender ? 5 : TEXT_INSET_Y} />
      {(ctx.quote || ctx.sender) && <div style={{ height: ctx.quote ? 8 : 5 }} />}
      <div className="relative" style={{ width: "100%", height: mh, background: p.mediaFill }}>
        {override ? (
          override.node
        ) : src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt=""
            draggable={false}
            onLoad={(e) => {
              const im = e.currentTarget;
              if (im.naturalWidth && im.naturalHeight) setRatio(im.naturalWidth / im.naturalHeight);
            }}
            className="block"
            style={{ width: "100%", height: mh, objectFit: "cover" }}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <svg width="40" height="32" viewBox="0 0 34 28" fill="none">
              <rect x="1.5" y="1.5" width="31" height="25" rx="5" stroke={p.secondary} strokeWidth="2" />
              <circle cx="11" cy="10" r="3" fill={p.secondary} />
              <path d="M3 23l9-8 6 5 5-4 9 7" stroke={p.secondary} strokeWidth="2" strokeLinejoin="round" />
            </svg>
          </div>
        )}
        {/* inner hairline (OWSBubbleShapeView .innerShadow, r 0.5, 15%) */}
        {!filled && (
          <div
            className="pointer-events-none absolute inset-0"
            style={{ borderRadius: ctx.radii, boxShadow: `inset 0 0 0.5px 0.5px ${p.mediaHairline}` }}
          />
        )}
        {overlay && (
          <>
            <div
              className="pointer-events-none absolute inset-x-0 bottom-0"
              style={{ height: 40, background: "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.4) 100%)" }}
            />
            <div
              className="absolute flex"
              style={{ left: TEXT_INSET_X, right: TEXT_INSET_X, bottom: TEXT_INSET_Y, justifyContent: "flex-end" }}
              dir={ctx.rtl ? "rtl" : "ltr"}
            >
              <Footer spec={overlay} rtl={ctx.rtl} />
            </div>
          </>
        )}
      </div>
      {hasCaption && (
        <div style={{ padding: `7px ${TEXT_INSET_X}px ${TEXT_INSET_Y}px` }}>
          <TextBlock
            text={caption}
            size={BODY}
            color={mine ? p.outText : p.inText}
            footer={ctx.footer}
            uiRtl={ctx.rtl}
            fontsTick={ctx.fontsTick}
            maxText={max - TEXT_INSET_X * 2}
          />
        </div>
      )}
    </div>
  );
}

/* --------------------------- call rows [SM] --------------------------- */

/** SignalSymbol .phone / .video, inline at footnote size. */
function CallGlyph({ video, color }: { video: boolean; color: string }) {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill={color}
      style={{ display: "inline-block", verticalAlign: "-2.5px", marginInlineEnd: 4 }}
    >
      {(video ? I_VIDEO : I_PHONE).map((d, i) => (
        <path key={i} d={d} fillRule="evenodd" />
      ))}
    </svg>
  );
}

/**
 * CVComponentSystemMessage for a TSCall / OWSGroupCallMessage: centred
 * footnote "<symbol> <text> · <time>" in secondaryLabel (emphasisLabel red for
 * a missed incoming call); 1:1 calls carry a "Call Back" / "Call Again" pill
 * (UIButton .gray(), secondaryFill, footnote medium, 10/5 insets) with the
 * bubble margins growing to 8/12/14.
 */
function CallRow({
  m,
  l,
  p,
  dark,
  rtl,
  groupAuthor,
}: {
  m: Message;
  l: LocalStrings;
  p: Palette;
  dark: boolean;
  rtl: boolean;
  /** group thread: the member who started the call (null in 1:1) */
  groupAuthor: string | null;
}) {
  const c = m.call ?? { video: false, missed: false };
  const mine = m.sender === "me";
  let text: string;
  let button: string | null = null;
  let red = false;
  let video = c.video;
  if (groupAuthor !== null) {
    text = mine ? l.groupCallYou : l.groupCallBy(groupAuthor);
    video = true;
  } else if (mine) {
    text = c.missed ? (c.video ? l.unansweredVideo : l.unansweredVoice) : c.video ? l.outgoingVideo : l.outgoingVoice;
    button = l.callAgain;
  } else {
    text = c.missed ? (c.video ? l.missedVideo : l.missedVoice) : c.video ? l.incomingVideo : l.incomingVoice;
    red = c.missed;
    button = l.callBack;
  }
  const color = red ? (dark ? EMPHASIS.dark : EMPHASIS.light) : p.secondary;
  return (
    <div className="flex justify-center" style={{ paddingInline: GUTTER }}>
      <div
        className="flex flex-col items-center"
        style={{ padding: button ? "8px 14px 12px" : "4px 10px 1px", gap: 8, borderRadius: 12, background: p.bg }}
      >
        <div
          dir={rtl ? "rtl" : "ltr"}
          style={{ color, fontSize: 13, lineHeight: `${FOOTNOTE_LINE}px`, letterSpacing: "-0.08px", textAlign: "center" }}
        >
          <CallGlyph video={video} color={color} />
          {text}
          {" · "}
          <bdi>{clock(m.time)}</bdi>
        </div>
        {button && (
          <span
            className="rounded-full"
            style={{
              background: dark ? SECONDARY_FILL.dark : SECONDARY_FILL.light,
              padding: "5px 10px",
              color: p.label,
              fontSize: 13,
              lineHeight: `${FOOTNOTE_LINE}px`,
              fontWeight: 500,
              letterSpacing: "-0.08px",
            }}
          >
            {button}
          </span>
        )}
      </div>
    </div>
  );
}

/* ------------------------------ typing [TI] ------------------------------ */

function TypingBubble({
  p,
  live,
  clockMs,
  avatar,
}: {
  p: Palette;
  live: boolean;
  clockMs?: number;
  /** group threads: the typist's 28pt avatar, 8pt before the bubble */
  avatar?: Person | null;
}) {
  return (
    <div
      className={`flex items-end ${live ? "sig-ios-anim" : ""}`}
      style={{ paddingInlineStart: avatar ? GROUP_GUTTER : GUTTER, gap: avatar ? 8 : 0 }}
    >
      {avatar && <SignalAvatar person={avatar} size={GROUP_AVATAR} />}
      <div
        dir="ltr"
        className="flex items-center"
        style={{ height: 36, borderRadius: 18, background: p.inBubble, padding: `0 ${TEXT_INSET_X}px`, gap: 3 }}
      >
        {[0, 1, 2].map((i) => {
          const base: CSSProperties = { width: 8, height: 8, borderRadius: 4, background: `rgb(${p.dotRgb})` };
          if (clockMs !== undefined) {
            const v = dotValue(i, clockMs / DOT_PERIOD);
            return (
              <span
                key={i}
                className="block"
                style={{ ...base, opacity: 0.4 + 0.6 * v, transform: `scale(${(6 + 2 * v) / 8})` }}
              />
            );
          }
          return (
            <span
              key={i}
              className="block"
              style={{
                ...base,
                opacity: 0.4,
                transform: "scale(0.75)",
                animation: `sig-ios-dot${i} ${DOT_PERIOD}ms linear infinite`,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

/* --------------------------- thread details [TD] --------------------------- */

function ThreadDetails({
  person,
  group,
  p,
  text,
}: {
  person: Person;
  group?: GroupChat | null;
  p: Palette;
  text: string;
}) {
  return (
    <div className="flex justify-center" style={{ padding: "8px 0 16px" }}>
      <div className="relative flex flex-col items-center" style={{ padding: "0 25px 24px", maxWidth: 276 + 50 }}>
        <div
          className="absolute inset-x-0 bottom-0"
          style={{ top: 16, borderRadius: 40, border: `2px solid ${p.tertiaryFill}`, boxSizing: "border-box" }}
        />
        <div className="relative">
          {group ? <GroupAvatar group={group} size={74} /> : <SignalAvatar person={person} size={74} />}
        </div>
        <div style={{ height: 8 }} />
        <div
          dir={dirOf(group ? group.name : person.name)}
          className="relative truncate"
          style={{
            color: p.label,
            fontSize: 20,
            lineHeight: "24px",
            fontWeight: 600,
            letterSpacing: "-0.45px",
            maxWidth: 226,
            padding: "0 4px",
          }}
        >
          {group ? group.name : person.name}
        </div>
        <div style={{ height: 8 }} />
        {/* "group-resizable" image + two spaces + the members / mutual-groups text */}
        <div
          className="relative text-center"
          style={{ color: p.label, fontSize: 15, lineHeight: "18px", letterSpacing: "-0.23px", maxWidth: 226 }}
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill={p.label} style={{ display: "inline-block", verticalAlign: "-3px", marginInlineEnd: 6 }}>
            {I_GROUP.map((d, i) => (
              <path key={i} d={d} fillRule="evenodd" />
            ))}
          </svg>
          {text}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------ composer [IT] ------------------------------ */

/** UIKit text caret: 2pt bar in the accent tint, a touch taller than the line. */
function IosCaret({ color, exporting, keystroke }: { color: string; exporting: boolean; keystroke: number }) {
  return (
    <span aria-hidden className="relative inline-block" style={{ width: 0, height: 17 * SF_LINE, verticalAlign: "top" }}>
      <span
        key={exporting ? undefined : keystroke}
        className={exporting ? "absolute" : "sig-ios-caret absolute"}
        style={{ insetInlineStart: 0, top: -0.5, width: 2, height: 21.5, borderRadius: 1, background: color }}
      />
    </span>
  );
}

/**
 * iOS 26 input toolbar (forced LTR): glass "+" | glass field with sticker,
 * camera and mic inside | glass-prominent send button. With text in the
 * draft: the sticker hides (any input), camera + mic hide and the 40pt send
 * button (arrow-up, chat-colour tint) springs in 12pt after the field, which
 * gives up the room. The text view (17pt, 12pt side / 6.67pt vertical insets)
 * grows from 35 to 98pt (≈ 4 lines) and then scrolls; the "+" and the send
 * button stay pinned to the bottom. While the draft is typed the caret stays
 * solid (UIKit only blinks it ~0.5s after the last keystroke, longer than
 * the 220ms compose hold), so the exporter (clockMs) draws it solid.
 */
function IosComposer({
  p,
  dark,
  rtl,
  placeholder,
  text,
  clockMs,
  fieldRef,
  lift,
  liftTransition,
}: {
  p: Palette;
  dark: boolean;
  rtl: boolean;
  placeholder: string;
  text: string;
  clockMs?: number;
  fieldRef: React.Ref<HTMLDivElement>;
  /** keyboard lift above the normal safe-area position */
  lift: number;
  liftTransition?: string;
}) {
  const exporting = clockMs !== undefined;
  const anyInput = text.length > 0;
  const send = text.trim().length > 0;
  const pop = exporting ? "" : "sig-ios-pop";
  const shown = (on: boolean): CSSProperties => ({ opacity: on ? 1 : 0, transform: on ? "none" : "scale(0.1)" });
  return (
    <div
      dir="ltr"
      className="pointer-events-none absolute z-20 flex items-end"
      style={{ left: GUTTER, right: GUTTER, bottom: SAFE_BOTTOM + 8 + lift, transition: liftTransition }}
    >
      <div
        className="flex shrink-0 items-center justify-center rounded-full"
        style={{ ...glass(dark), width: FIELD_H, height: FIELD_H, marginRight: 12 }}
      >
        <Icon24 d={I_PLUS} color={p.label} evenOdd={false} />
      </div>

      <div
        ref={fieldRef}
        className="relative flex min-w-0 flex-1 items-center"
        style={{ ...glass(dark), borderRadius: FIELD_H / 2, minHeight: FIELD_H }}
      >
        {anyInput ? (
          <div
            className="flex min-w-0 flex-1 flex-col justify-end overflow-hidden"
            style={{ minHeight: INPUT_MIN_H, maxHeight: INPUT_MAX_H }}
          >
            <div
              dir={dirOf(text)}
              style={{
                padding: `${INPUT_INSET_Y}px 12px`,
                color: p.label,
                fontSize: BODY,
                lineHeight: `${BODY * SF_LINE}px`,
                letterSpacing: "-0.43px",
                whiteSpace: "pre-wrap",
                overflowWrap: "anywhere",
                textAlign: "start",
              }}
            >
              {text}
              <IosCaret color={dark ? ACCENT.dark : ACCENT.light} exporting={exporting} keystroke={text.length} />
            </div>
          </div>
        ) : (
          <span
            className="min-w-0 flex-1 truncate"
            dir={rtl ? "rtl" : "ltr"}
            style={{
              color: p.secondary,
              fontSize: BODY,
              lineHeight: "21px",
              letterSpacing: "-0.43px",
              paddingLeft: 12,
              paddingRight: 12 + 3 * FIELD_H,
              textAlign: rtl ? "right" : "left",
            }}
          >
            {placeholder}
          </span>
        )}
        {/* in-field buttons, pinned to the bottom trailing corner (4pt in) */}
        <div className="absolute bottom-0 flex" style={{ right: 4 }}>
          {[
            { d: I_STICKER, on: !anyInput },
            { d: I_CAMERA, on: !send },
            { d: I_MIC, on: !send },
          ].map((b, i) => (
            <span
              key={i}
              className={`flex items-center justify-center ${pop}`}
              style={{ width: FIELD_H, height: FIELD_H, ...shown(b.on) }}
            >
              <Icon24 d={b.d} color={p.label} />
            </span>
          ))}
        </div>
      </div>

      {/* send: 12pt gap + 40pt prominent-glass capsule, 16pt from the edge */}
      <div className={`relative shrink-0 ${pop}`} style={{ width: send ? 12 + FIELD_H : 0, height: FIELD_H }}>
        <div
          className={`absolute bottom-0 right-0 flex items-center justify-center rounded-full ${pop}`}
          style={{
            width: FIELD_H,
            height: FIELD_H,
            background: dark ? SEND_TINT.dark : SEND_TINT.light,
            boxShadow: dark
              ? "inset 0 0.5px 0 rgba(255,255,255,0.28), 0 3px 10px rgba(0,0,0,0.35)"
              : "inset 0 0.5px 0 rgba(255,255,255,0.45), 0 3px 10px rgba(34,103,245,0.22)",
            ...shown(send),
          }}
        >
          <Icon24 d={I_ARROW_UP} color="#ffffff" evenOdd={false} />
        </div>
      </div>
    </div>
  );
}

/* ------------------------------ component ------------------------------ */

/** Positions each outgoing fill's slice of the screen-fixed gradient, and the sticky date header. */
function syncScreen(root: HTMLElement) {
  const box = root.getBoundingClientRect();
  const k = box.height / root.clientHeight || 1;
  root.style.setProperty("--sig-h", `${root.clientHeight}px`);
  root.querySelectorAll<HTMLElement>(".sig-ios-out").forEach((f) => {
    const y = (f.getBoundingClientRect().top - box.top) / k;
    f.style.backgroundPosition = `0 ${(-y).toFixed(1)}px`;
  });
  const anchor = root.querySelector<HTMLElement>("[data-sig-date]");
  const sticky = root.querySelector<HTMLElement>("[data-sig-sticky]");
  if (anchor && sticky) {
    const top = (anchor.getBoundingClientRect().top - box.top) / k;
    const stuck = top < STICKY_TOP;
    sticky.style.visibility = stuck ? "visible" : "hidden";
    anchor.style.visibility = stuck ? "hidden" : "visible";
  }
}

export function Signal({ scenario, playback, lang, rtl }: PlatformProps) {
  const dark = scenario.theme === "dark";
  const p = dark ? DARK : LIGHT;
  const l = LOCAL[lang];
  const { messages, clockMs } = playback;
  const live = playback.isLive;
  const typing = playback.typing || (!live && scenario.presence === "typing");
  const draftText = playback.draft?.text ?? "";
  // group thread: Scenario.group replaces Scenario.them
  const group = scenario.group && scenario.group.members.length > 0 ? scenario.group : null;
  const members = group?.members ?? [];
  const authorOf = (m: Message): Person => (group ? (members[m.authorIndex ?? 0] ?? members[0]) : scenario.them);
  const nameColor = (m: Message): string => {
    const c = NAME_COLORS[(m.authorIndex ?? 0) % NAME_COLORS.length];
    return dark ? c[1] : c[0];
  };
  const maxBubble = group ? MAX_BUBBLE_GROUP : MAX_BUBBLE;
  // OS keyboard: the toolbar rides the keyboard layout guide (max(keyboard, safe area))
  const kb = useKeyboardInset();
  const lift = Math.max(0, kb.inset - SAFE_BOTTOM);
  const liftTransition = kb.transition === "none" ? undefined : `bottom ${kb.transition}`;
  // [IT] the field grows with the draft; the list keeps its newest row above it
  const fieldRef = useRef<HTMLDivElement>(null);
  const [fieldH, setFieldH] = useState(FIELD_H);
  useLayoutEffect(() => {
    const h = fieldRef.current ? Math.round(fieldRef.current.offsetHeight) : FIELD_H;
    if (h && h !== fieldH) setFieldH(h);
  }, [draftText, fieldH]);
  const bodyBottom = BODY_BOTTOM + (fieldH - FIELD_H) + lift;
  const scrollRef = useChatScroll<HTMLDivElement>(`${messages.length}-${typing}-${fieldH}`);
  const rootRef = useRef<HTMLDivElement>(null);
  const [fontsTick, setFontsTick] = useState(0);

  // The content inset grows with the keyboard: keep the newest row in view.
  const prevLift = useRef(lift);
  useLayoutEffect(() => {
    const sc = scrollRef.current;
    const delta = lift - prevLift.current;
    prevLift.current = lift;
    if (!sc || delta <= 0) return;
    const atBottom = sc.scrollHeight - delta - sc.clientHeight - sc.scrollTop < 48;
    if (!atBottom) return;
    if (kb.transition === "none") sc.scrollTop = sc.scrollHeight;
    else sc.scrollTo({ top: sc.scrollHeight, behavior: "smooth" });
  }, [lift, kb.transition, scrollRef]);

  // Re-measure text once web fonts have settled.
  useEffect(() => {
    let alive = true;
    if (typeof document !== "undefined" && document.fonts) {
      document.fonts.ready.then(() => alive && setFontsTick((t) => t + 1));
    }
    return () => {
      alive = false;
    };
  }, []);

  useLayoutEffect(() => {
    if (rootRef.current) syncScreen(rootRef.current);
  });
  useLayoutEffect(() => {
    const root = rootRef.current;
    const sc = scrollRef.current;
    if (!root || !sc) return;
    const on = () => syncScreen(root);
    sc.addEventListener("scroll", on, { passive: true });
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(on) : null;
    ro?.observe(sc.firstElementChild ?? sc);
    return () => {
      sc.removeEventListener("scroll", on);
      ro?.disconnect();
    };
  }, [scrollRef]);

  const rows: ReactNode[] = [];
  messages.forEach((m, i) => {
    const mine = m.sender === "me";
    const prev = messages[i - 1];
    const next = messages[i + 1];
    const anim = live ? "sig-ios-anim" : "";

    // [SM] calls are centred system rows (20pt system-message spacing)
    if (m.type === "call") {
      rows.push(
        <div
          key={m.id}
          data-mid={m.id}
          data-sender={m.sender}
          className={anim}
          style={{ marginTop: i === 0 ? GAP_DEFAULT : SYSTEM_SPACING }}
        >
          <CallRow m={m} l={l} p={p} dark={dark} rtl={rtl} groupAuthor={group ? authorOf(m).name : null} />
        </div>,
      );
      return;
    }

    const first = !prev || !canCluster(prev, m);
    const last = !next || !canCluster(m, next);
    const status = mine ? playback.statusOf(m) : undefined;
    // [IVS] an edited message always keeps its footer
    const hideFooter =
      !m.edited &&
      !last &&
      !!next &&
      clock(next.time) === clock(m.time) &&
      (!mine || playback.statusOf(next) === status);
    const footer: FooterSpec | null = hideFooter
      ? null
      : {
          time: m.time,
          status: m.type === "deleted" ? undefined : status,
          color: mine ? p.outSecondary : p.secondary,
          edited: m.edited && m.type !== "deleted" ? l.edited : undefined,
        };
    const target = m.replyToId ? scenario.messages.find((x) => x.id === m.replyToId) : undefined;
    const quote = target ? quoteOf(target, authorOf(target), l) : null;
    // [IVS] group: the sender name heads an author's run, the avatar ends it
    const incomingGroup = !!group && !mine;
    const sameAuthor = (o?: Message) =>
      !!o && o.sender === "them" && o.type !== "call" && (o.authorIndex ?? 0) === (m.authorIndex ?? 0);
    const author = authorOf(m);
    const sender = incomingGroup && !sameAuthor(prev) ? { name: author.name, color: nameColor(m) } : null;
    const showAvatar = incomingGroup && !sameAuthor(next);
    const ctx: BubbleCtx = {
      p,
      rtl,
      mine,
      dark,
      radii: cornerRadii(mine, rtl, first, last),
      footer,
      fontsTick,
      quote,
      topStartSharp: !mine && !first,
      topEndSharp: mine && !first,
      maxBubble,
      sender,
    };
    // a quoted message / link preview always has a bubble (no borderless jumbomoji)
    const jumbo = m.type === "text" && !quote && !m.link ? emojiCount(m.text) : 0;

    let content: ReactNode;
    if (m.type === "voice") content = <VoiceBubble m={m} ctx={ctx} />;
    else if (m.type === "image") content = <MediaBubble m={m} ctx={ctx} />;
    else if (m.type === "sticker") content = <StickerBubble m={m} ctx={ctx} />;
    else if (m.type === "file") content = <FileBubble m={m} ctx={ctx} />;
    else if (m.type === "deleted")
      content = <DeletedBubble text={mine ? l.youDeleted : l.deletedBy(author.name)} ctx={ctx} />;
    else if (m.type === "location") {
      const loc = m.location ?? { title: "" };
      const address = [loc.title, loc.subtitle].filter((x) => x && x.trim()).join(", ");
      const url = mapsUrl(loc.title || m.id);
      content = (
        <MediaBubble
          m={m}
          ctx={ctx}
          override={{
            node: <MapArt dark={dark} accent={dark ? ACCENT.dark : ACCENT.light} />,
            ratio: 1,
            caption: address ? `${address}\n\n${url}` : url,
          }}
        />
      );
    } else if (jumbo) content = <JumboBubble text={m.text} count={jumbo} ctx={ctx} />;
    else content = <TextBubble m={m} text={m.text} ctx={ctx} />;

    const reaction = m.reaction?.trim();
    // the pill sits on the bubble edge that faces the middle of the screen
    const innerLeft = mine !== rtl;

    rows.push(
      <div
        key={m.id}
        data-mid={m.id}
        data-sender={m.sender}
        className={`flex items-end ${anim}`}
        style={{
          justifyContent: mine ? "flex-end" : "flex-start",
          paddingInlineStart: incomingGroup ? GROUP_GUTTER : GUTTER,
          paddingInlineEnd: GUTTER,
          marginTop:
            i === 0 ? GAP_DEFAULT : prev?.type === "call" ? SYSTEM_SPACING : first ? GAP_DEFAULT : GAP_CLUSTER,
          // hOuterStack bottom inset = reaction protrusion (24 − 7)
          paddingBottom: reaction ? REACTION_H - REACTION_OVERLAP : 0,
        }}
      >
        {incomingGroup && (
          // 28pt sender-avatar column, bottom-aligned with the bubble, 8pt before it
          <div className="shrink-0" style={{ width: GROUP_AVATAR, height: GROUP_AVATAR, marginInlineEnd: 8 }}>
            {showAvatar && <SignalAvatar person={author} size={GROUP_AVATAR} />}
          </div>
        )}
        {reaction ? (
          <div className="relative" style={{ minWidth: 0 }}>
            {content}
            <ReactionPill emoji={reaction} fromMe={!mine} innerLeft={innerLeft} dark={dark} p={p} />
          </div>
        ) : (
          content
        )}
      </div>,
    );
  });

  // the member who is typing: author of the next (not yet revealed) message
  const pending = scenario.messages[messages.length];
  const typist = group ? (pending && pending.sender === "them" ? authorOf(pending) : members[0]) : null;
  const memberNames = members.map((x) => x.name).sort((a, b) => a.localeCompare(b, lang));

  const dateText = (
    <span style={{ fontSize: 13, lineHeight: "15.5px", fontWeight: 500, letterSpacing: "-0.08px" }}>{l.today}</span>
  );
  const title = group ? group.name : scenario.them.name;

  return (
    <div
      ref={rootRef}
      className="relative h-full w-full overflow-hidden"
      style={{ background: p.bg, fontFamily: IOS_FONT, WebkitFontSmoothing: "antialiased" }}
    >
      <style>{STYLE}</style>

      {/* ------------------------------ thread ------------------------------ */}
      <div ref={scrollRef} className="rcss-scroll absolute inset-0 overflow-y-auto">
        <div style={{ paddingTop: CONTENT_TOP, paddingBottom: bodyBottom }}>
          <ThreadDetails
            person={scenario.them}
            group={group}
            p={p}
            text={group ? l.members(memberNames) : l.noGroups}
          />
          <div className="flex justify-center" style={{ marginTop: GAP_DEFAULT }}>
            <div data-sig-date style={{ padding: "3px 12px", color: p.secondary }}>
              {dateText}
            </div>
          </div>
          <div className="flex flex-col">
            {rows}
            {typing && (
              <div style={{ marginTop: GAP_DEFAULT }}>
                <TypingBubble p={p} live={live} clockMs={clockMs} avatar={typist} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* --------------------- top scroll-edge effect --------------------- */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-10"
        style={{
          height: NAV_TOP + NAV_H + 10,
          background: `linear-gradient(to bottom, ${p.bg} 0px, ${p.bgA(0.96)} ${NAV_TOP}px, ${p.bgA(0.7)} ${NAV_TOP + 26}px, ${p.bgA(0.25)} ${NAV_TOP + NAV_H}px, ${p.bgA(0)} ${NAV_TOP + NAV_H + 10}px)`,
        }}
      />

      {/* sticky date header (glass capsule) [DH] */}
      <div
        data-sig-sticky
        className="pointer-events-none absolute inset-x-0 z-20 flex justify-center"
        style={{ top: STICKY_TOP, visibility: "hidden" }}
      >
        <div className="rounded-full" style={{ ...glass(dark), padding: "3px 12px", color: p.label }}>
          {dateText}
        </div>
      </div>

      {/* ------------------------------ nav bar [HD] ------------------------------ */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-30">
        <StatusBar device={scenario.device} tint={dark ? "light" : "dark"} background="transparent" />
        <div className="absolute flex items-center" style={{ top: NAV_TOP, height: NAV_H, insetInline: GUTTER }}>
          <div className="flex shrink-0 items-center justify-center rounded-full" style={{ ...glass(dark), width: 44, height: 44 }}>
            <span style={{ marginInlineEnd: 2.5, display: "flex" }}>
              <ChevronBack color={p.label} />
            </span>
          </div>
          <div className="flex min-w-0 flex-1 items-center" style={{ paddingInlineStart: 12, gap: 12 }}>
            {group ? <GroupAvatar group={group} size={40} /> : <SignalAvatar person={scenario.them} size={40} />}
            <span
              className="truncate"
              dir={dirOf(title)}
              style={{ color: p.label, fontSize: 17, lineHeight: "21px", fontWeight: 600, letterSpacing: "-0.43px" }}
            >
              {title}
            </span>
          </div>
          {group ? (
            // groups: a single (group) video-call bar button
            <div
              className="flex shrink-0 items-center justify-center rounded-full"
              style={{ ...glass(dark), height: 44, width: 44, marginInlineStart: 8 }}
            >
              <Icon24 d={I_VIDEO} color={p.label} />
            </div>
          ) : (
            <div
              className="flex shrink-0 items-center rounded-full"
              style={{ ...glass(dark), height: 44, width: 88, marginInlineStart: 8 }}
            >
              <span className="flex flex-1 items-center justify-center">
                <Icon24 d={I_VIDEO} color={p.label} />
              </span>
              <span className="flex flex-1 items-center justify-center">
                <Icon24 d={I_PHONE} color={p.label} />
              </span>
            </div>
          )}
        </div>
      </div>

      {/* --------------------- bottom scroll-edge effect --------------------- */}
      <div
        className="pointer-events-none absolute inset-x-0 z-10"
        style={{
          bottom: lift,
          height: bodyBottom - lift,
          transition: liftTransition,
          background: `linear-gradient(to top, ${p.bg} 0px, ${p.bgA(0.9)} ${SAFE_BOTTOM - 8}px, ${p.bgA(0.55)} ${SAFE_BOTTOM + 22}px, ${p.bgA(0.18)} ${SAFE_BOTTOM + 48}px, ${p.bgA(0)} ${bodyBottom - lift}px)`,
        }}
      />

      {/* ------------------------------ composer [IT] ------------------------------ */}
      <IosComposer
        p={p}
        dark={dark}
        rtl={rtl}
        placeholder={l.placeholder}
        text={draftText}
        clockMs={clockMs}
        fieldRef={fieldRef}
        lift={lift}
        liftTransition={liftTransition}
      />

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20">
        <SystemBottomBar device={scenario.device} bg="transparent" fg={p.label} />
      </div>
    </div>
  );
}
