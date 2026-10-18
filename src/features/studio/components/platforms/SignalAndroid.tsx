"use client";

/**
 * Signal for Android: 1:1 conversation screen as it ships in late 2026
 * (Material 3 chrome, CFv2 conversation items, default "Ultramarine" chat
 * colour, no wallpaper), on a 360dp Samsung screen.
 *
 * Almost every value below is read straight from Signal-Android's open source
 * (github.com/signalapp/Signal-Android, main branch, Oct 2026) and was checked
 * against a real 1080x2340 Samsung capture (Wikimedia Commons, "Dutch Screenshot
 * of Signal Messenger on Android", 411dp logical width): back arrow centre 28,
 * avatar x 56, title x 108, action icon centres 108 / 60 / 18 from the end edge,
 * composer pill 12..294, "+" circle 40, side gutters 16, all matched.
 *
 * Sources (paths relative to app/src/main or core/ui/src/main)
 *  [D]  res/values/dimens.xml: signal_m3_toolbar_height 64, message_corner_radius 18,
 *       collapse radius 4, bubble padding 12 / 7 / 7, footer bottom padding 5,
 *       conversation_compose_height 44, conversation_item_avatar_size 28,
 *       message_audio_width 212, media_bubble_max 240x320, wave_form_bar_width 2.
 *  [S]  java/.../conversation/v2/items/V2ConversationItemShape.kt: corners 18/4,
 *       spacing 6 (cluster edge) / 1 (inside a cluster), 3-minute cluster timeout.
 *  [T]  V2ConversationItemTextOnlyViewHolder.kt: footer (time + status) only on the
 *       last message of a cluster; jumbomoji has no bubble.
 *  [F]  V2FooterPositionDelegate.kt: footer at the end of a single line when
 *       maxWidth - lastLine - 24 > footer + 8, tucked into a multi-line last line when
 *       it fits, otherwise underneath; mixed-direction text always underneath.
 *  [L]  res/layout/v2_conversation_item_text_only_{incoming,outgoing}.xml: 16 / 48
 *       side gutters, footer date 12sp (+4 gap), DeliveryStatusView, 12dp end pad.
 *  [C]  core/ui material3_colors_{light,dark}.xml + values/light_colors.xml,
 *       values-night/dark_colors.xml: background #FBFCFF / #1B1C1F, incoming bubble
 *       (SurfaceVariant) #E7EBF3 / #303133, OnSurface #1B1B1D / #E2E1E5,
 *       OnSurfaceVariant #545863 / #BEBFC5, outgoing text #FFF / #E0FFFFFF, outgoing
 *       footer #B8FFFFFF / #A3FFFFFF, scrolled toolbar (Surface2) #EDF0F6 / #272A31.
 *  [U]  conversation/colors/ChatColorsPalette.kt: ULTRAMARINE = #315FF4 (default).
 *  [I]  drawable symbol_messagestatus_{sent,delivered,read}_24.xml (paths inlined),
 *       symbol_arrow_start_24 (autoMirrored), symbol_video_24, symbol_phone_24
 *       (not mirrored), symbol_emoji_24, symbol_camera_24, symbol_mic_24,
 *       symbol_plus_24, ic_profile_circle_outline_16.
 *  [H]  layout/conversation_title_view.xml + ConversationTitleView.java: 36dp avatar,
 *       title 18sp regular; 1:1 chats have NO subtitle (Signal has no presence /
 *       last-seen / "typing…" in the header), system-contact glyph after the name.
 *  [P]  layout/conversation_input_panel.xml + InputPanel.java: pill radius 20,
 *       margins 12/8, emoji 48 wide, camera + mic inside, 40dp "+" circle tinted with
 *       the chat colour; hint string conversation_activity__type_message_push =
 *       "Signal message" / "رسالة سيجنال" (values-ar).
 *  [Y]  layout/conversation_typing_view.xml + TypingIndicatorView.java: 66x38 bubble,
 *       3 dots of 10dp, alpha .4->1 & scale .75->1, 1500ms cycle, 150ms stagger.
 *  [A]  layout/audio_view*.xml, AudioView.java, ConversationItemFooter.java: 44dp play
 *       circle, waveform with a 2x28 thumb, duration + "not played" dot in the footer.
 *  [M]  conversation/mutiselect/ConversationItemAnimator.kt: new items slide up from
 *       translationY = own height to 0 over 150ms (ValueAnimator default
 *       accelerate-decelerate), no fade.
 *  [G]  conversation/ConversationHeaderView.kt + HeadlineDisplayName.kt (2026 header):
 *       74dp avatar overlapping a 277dp card, radius 40, 2.5dp Surface3 border,
 *       name titleLarge 22/28 with person + chevron glyphs.
 *  [R]  ConversationItemDecorations.kt + conversation_item_header.xml: date header is
 *       plain 14sp OnSurfaceVariant text (no chip without wallpaper), "Today"/"اليوم".
 *  [RX] reactions/ReactionsConversationView.java, layout/reactions_pill.xml,
 *       drawable/reaction_pill_background{,_selected}.xml, v2_conversation_item_text_only_*.xml:
 *       26dp pill, 1dp margins, 7dp padding, 17dp emoji, 1dp colorBackground stroke,
 *       fill colorSurfaceVariant / colorSurfaceVariant_32_no_alpha (#B8BCC5 / #5D5E62)
 *       when mine; rail marginTop −4dp, 5dp from the bubble's inner edge.
 *  [QV] components/QuoteView.java, layout/v2_quote_view.xml, quotes/QuoteViewColorTheme.kt,
 *       conversation_item_sent_multimedia.xml, ConversationItem.java: quotes use the legacy
 *       item (isTextOnly() is false); quote 7dp from the top, 6dp from the sides, stretched
 *       to the bubble; bar 4dp OnCustom; bg Transparent3 (in) / Transparent4 (out, light) /
 *       transparent_black_40 (out, dark); fg OnSurface / NeutralInverse; author labelMedium
 *       bold 13sp, body BodyMedium 14sp ×2 lines; thumb 60dp; corners 10/4. Body text 4dp
 *       below. Strings QuoteView_you / _photo / _audio ("أنت" / "صورة" / "صوت").
 *  [CI] layout/conversation_input_panel.xml + ConversationFragment.updateToggleButtonState,
 *       AnimatingToggle (anim/animation_toggle_in: 150ms scale .6→1 + alpha), styles.xml
 *       ComposeEditText (16sp, +2sp line spacing, maxLines 5, hint OnSurfaceVariant),
 *       MessageSendType.SignalMessageSendType → ic_send_lock_24; emoji / camera / mic tint
 *       OnSurfaceVariant, inline "+" OnSurface.
 */

import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

import type { DeliveryStatus, GroupChat, LinkPreview, Message, Person } from "../../types";
import { dirOf, SystemBottomBar, useChatScroll } from "../shared";
import { SamsungStatusBar } from "../devices/SamsungStatusBar";
import { useKeyboardInset } from "../devices/keyboard-context";
import type { Lang } from "./chrome";
import type { PlatformMotion, PlatformProps } from "./types";

const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

/* ======================================================================
   Palette [C]
   ====================================================================== */

interface Palette {
  dark: boolean;
  bg: string;
  barScrolled: string;
  ink: string;
  sub: string;
  inBubble: string;
  outBubble: string;
  outText: string;
  outFooter: string;
  outVoiceFooter: string;
  cardBorder: string;
  outline: string;
  contactGlyph: string;
  compose: string;
  plusIcon: string;
  inPlayBg: string;
  inPlayFg: string;
  outPlayBg: string;
  outPlayFg: string;
  waveIn: string;
  thumbIn: string;
  waveOut: string;
  thumbOut: string;
  imgEmpty: string;
  imgEmptyIcon: string;
  navFg: string;
  /** reaction pill fills [RX]: surfaceVariant (theirs) / surfaceVariant_32_no_alpha (mine) */
  pill: string;
  pillMine: string;
  /** QuoteViewColorTheme *_NORMAL (no wallpaper) [QV] */
  quoteInBg: string;
  quoteOutBg: string;
  quoteInFg: string;
  quoteOutFg: string;
  /** EditText caret = colorPrimary */
  caret: string;
}

const ULTRAMARINE = "#315ff4";

const LIGHT: Palette = {
  dark: false,
  bg: "#fbfcff",
  barScrolled: "#edf0f6",
  ink: "#1b1b1d",
  sub: "#545863",
  inBubble: "#e7ebf3",
  outBubble: ULTRAMARINE,
  outText: "#ffffff",
  outFooter: "rgba(255,255,255,0.722)",
  outVoiceFooter: "rgba(255,255,255,0.8)",
  cardBorder: "#e8ecf4",
  outline: "#808389",
  contactGlyph: "rgba(0,0,0,0.8)",
  compose: "#e7ebf3",
  plusIcon: "#ffffff",
  inPlayBg: "rgba(255,255,255,0.961)",
  inPlayFg: "#1b1b1d",
  outPlayBg: "rgba(255,255,255,0.161)",
  outPlayFg: "#ffffff",
  waveIn: "#b9b9b9",
  thumbIn: "#5e5e5e",
  waveOut: "rgba(255,255,255,0.4)",
  thumbOut: "#ffffff",
  imgEmpty: "#dfe3eb",
  imgEmptyIcon: "#808389",
  navFg: "#4a4b50",
  pill: "#e7ebf3",
  pillMine: "#b8bcc5",
  quoteInBg: "rgba(255,255,255,0.561)", // signal_light_colorTransparent3 #8FFFFFFF
  quoteOutBg: "rgba(255,255,255,0.722)", // signal_light_colorTransparent4 #B8FFFFFF
  quoteInFg: "#1b1b1d",
  quoteOutFg: "#1b1b1d", // colorOnSurface
  caret: "#2c58c3",
};

const DARK: Palette = {
  dark: true,
  bg: "#1b1c1f",
  barScrolled: "#272a31",
  ink: "#e2e1e5",
  sub: "#bebfc5",
  inBubble: "#303133",
  outBubble: ULTRAMARINE,
  outText: "rgba(255,255,255,0.878)",
  outFooter: "rgba(255,255,255,0.639)",
  outVoiceFooter: "rgba(255,255,255,0.6)",
  cardBorder: "#2c2f37",
  outline: "#5c5e65",
  contactGlyph: "rgba(255,255,255,0.8)",
  compose: "#303133",
  plusIcon: "rgba(255,255,255,0.878)",
  inPlayBg: "rgba(255,255,255,0.161)",
  inPlayFg: "#e2e1e5",
  outPlayBg: "rgba(255,255,255,0.122)",
  outPlayFg: "rgba(255,255,255,0.878)",
  waveIn: "#5e5e5e",
  thumbIn: "#d4d4d4",
  waveOut: "rgba(255,255,255,0.4)",
  thumbOut: "rgba(255,255,255,0.878)",
  imgEmpty: "#2c2f37",
  imgEmptyIcon: "#5c5e65",
  navFg: "#d6d6da",
  pill: "#303133",
  pillMine: "#5d5e62",
  quoteInBg: "rgba(255,255,255,0.161)", // signal_dark_colorTransparent3 #29FFFFFF
  quoteOutBg: "rgba(0,0,0,0.4)", // transparent_black_40
  quoteInFg: "#e2e1e5",
  quoteOutFg: "rgba(255,255,255,0.878)", // colorNeutralInverse #E0FFFFFF
  caret: "#b6c5fa",
};

/* ======================================================================
   Metrics (dp == CSS px on the 360dp screen)
   ====================================================================== */

const BIG = 18; // message_corner_radius [D][S]
const SMALL = 4; // message_corner_collapse_radius
const GUTTER = 16; // own-side screen gutter [L]
const FAR = 48; // opposite-side gutter
const MAX_W = 360 - GUTTER - FAR; // 296: V2FooterPositionDelegate maxWidth
const BODY_FS = 16;
const BODY_LH = 18.75; // Roboto 16sp natural line spacing (textAppearance ignores lineSpacingExtra)
const PAD_TOP = 8; // 7dp + Roboto font padding, calibrated to the 34dp single-line bubble
const PAD_BOTTOM = 7.25;
const DATE_FS = 12;
const DATE_LH = 16;
const FOOTER_H = DATE_LH + 5; // date box + message_bubble_footer_bottom_padding
const STATUS_RESERVED = 20; // DeliveryStatusView.getReservedWidth(): 18dp icon + 2dp padding
const AUDIO_W = 242; // measured on the real capture (bubble 266dp)
const CLUSTER_MIN = 3;

/* ======================================================================
   Localised strings [P][R]
   ====================================================================== */

interface Strings {
  placeholder: string;
  today: string;
  you: string;
  photo: string;
  audio: string;
  /** ConversationItem_edited_absolute_timestamp_footer ("Edited %1$s") */
  edited: (time: string) => string;
  /** ConversationItem_you_deleted_this_message / ConversationItem_s_deleted_this_message */
  youDeleted: string;
  deletedBy: (name: string) => string;
  /** MessageRecord_*_call + MessageRecord_call_message_with_date */
  missedVoice: string;
  missedVideo: string;
  incomingVoice: string;
  incomingVideo: string;
  outgoingVoice: string;
  outgoingVideo: string;
  unansweredVoice: string;
  unansweredVideo: string;
  withDate: (text: string, time: string) => string;
  /** group call updates (GroupCallUpdateMessageFactory) */
  groupMissed: (time: string) => string;
  groupStartedBy: (name: string, time: string) => string;
  groupStartedYou: (time: string) => string;
  /** ConversationHeaderView GroupMemberSubtitle (MessageRequestProfileView_group_members_*) */
  members: (names: string[], memberCount: number) => { text: string; others: string | null };
}

const STR: Record<Lang, Strings> = {
  en: {
    placeholder: "Signal message",
    today: "Today",
    you: "You",
    photo: "Photo",
    audio: "Audio",
    edited: (t) => `Edited ${t}`,
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
    withDate: (x, t) => `${x} · ${t}`,
    groupMissed: (t) => `Missed video call · ${t}`,
    groupStartedBy: (n, t) => `${n} started a video call · ${t}`,
    groupStartedYou: (t) => `You started a video call · ${t}`,
    members: (n, count) => {
      if (n.length === 0) return { text: "No other group members yet", others: null };
      if (n.length === 1) return { text: `${n[0]} and you`, others: null };
      if (n.length === 2) return { text: `${n[0]}, ${n[1]}, and you`, others: null };
      const k = count - 3;
      const others = k > 0 ? `${k} ${k === 1 ? "other" : "others"}` : "";
      return { text: `${n[0]}, ${n[1]}, ${n[2]}, and ${others}`, others: others || null };
    },
  },
  ar: {
    placeholder: "رسالة سيجنال",
    today: "اليوم",
    you: "أنت",
    photo: "صورة",
    audio: "صوت",
    edited: (t) => `مُعدَّلة ${t}`,
    youDeleted: "حذفتَ هذه الرسالة",
    deletedBy: (n) => `تم حذف هذه الرسالة من ${n}`,
    missedVoice: "مكالمة صوتية فائتة",
    missedVideo: "مكالمة فيديو فائتة",
    incomingVoice: "مكالمة صوتية واردة",
    incomingVideo: "مكالمة فيديو واردة",
    outgoingVoice: "مكالمة صوتية صادرة",
    outgoingVideo: "مكالمة فيديو صادرة",
    unansweredVoice: "مكالمة صوتية لم يتم الرد عليها",
    unansweredVideo: "مكالمة فيديو لم يتم الرد عليها",
    withDate: (x, t) => `${x} . ${t}`,
    groupMissed: (t) => `مكالمة فيديو فائتة · ${t}`,
    groupStartedBy: (n, t) => `${n} بدأ مكالمة فيديو · ${t}`,
    groupStartedYou: (t) => `بدأتَ مكالمة فيديو · ${t}`,
    members: (n, count) => {
      if (n.length === 0) return { text: "لا يوجد أعضاء آخرون في المجموعة حتى الآن.", others: null };
      if (n.length === 1) return { text: `${n[0]} وأنت`, others: null };
      if (n.length === 2) return { text: `${n[0]}، و${n[1]} وأنت`, others: null };
      const k = count - 3;
      const d = localDigits(String(k), "ar");
      const others = k <= 0 ? "" : k <= 1 ? `${d} آخر` : k === 2 ? `${d} آخران` : `${d} آخرون`;
      return { text: `${n[0]}، و${n[1]}، و${n[2]}، و${others}`, others: others || null };
    },
  },
};

/**
 * conversation/colors/ChatColorsPalette.Names.all (light, dark) — assigned by
 * GroupAuthorNameColorHelper to the members in order.
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

/** MessageRecord missed-call tint: core_red_shade (light) / core_red (dark). */
const MISSED_RED = { light: "#e51d0e", dark: "#f44336" };

/** Group threads: 28dp avatar 12dp from the edge, bubble 8dp after it (v2_conversation_item_*_incoming.xml). */
const GROUP_START = 12;
const GROUP_AVATAR = 28;
const GROUP_BUBBLE_START = GROUP_START + GROUP_AVATAR + 8; // 48
/** media_bubble_sticker_dimens */
const STICKER = 175;

/** Android formats times/durations with the locale's digits (Arabic-Indic in ar, like the status bar). */
function localDigits(s: string, lang: Lang): string {
  if (lang !== "ar") return s;
  const map = "٠١٢٣٤٥٦٧٨٩";
  return s.replace(/[0-9]/g, (d) => map[Number(d)]);
}

/* ======================================================================
   Entrance motion [M] — shared by the live CSS and the video exporter
   ====================================================================== */

const ENTER_MS = 150;

function enterStyleAt(p: number) {
  const t = Math.min(1, Math.max(0, p));
  // android.view.animation.AccelerateDecelerateInterpolator
  const e = Math.cos((t + 1) * Math.PI) / 2 + 0.5;
  return {
    opacity: 1,
    transform: `translateY(${Math.round((1 - e) * 10000) / 100}%)`,
  };
}

export const signalAndroidMotion: PlatformMotion = {
  enterMs: ENTER_MS,
  enterStyle: (p) => enterStyleAt(p),
};

const ENTER_KEYFRAMES = (() => {
  const steps: string[] = [];
  for (let i = 0; i <= 20; i++) steps.push(`${i * 5}%{transform:${enterStyleAt(i / 20).transform}}`);
  return `@keyframes sig-android-enter{${steps.join("")}}`;
})();

/** Editor.BLINK: the cursor is solid for 500ms after each edit, then 500ms on / 500ms off. */
const CARET_MS = 1000;

/* Typing dots [Y]: 1500ms cycle, each dot animates for 600ms (peak at 300ms), 150ms stagger. */
const TYPING_CYCLE = 1500;
const TYPING_STAGGER = 150;

function typingDot(clock: number, i: number): { opacity: number; transform: string } {
  const t = (((clock % TYPING_CYCLE) + TYPING_CYCLE) % TYPING_CYCLE) - i * TYPING_STAGGER;
  let k = 0;
  if (t >= 0 && t <= 300) k = t / 300;
  else if (t > 300 && t <= 600) k = 1 - (t - 300) / 300;
  return { opacity: 0.4 + 0.6 * k, transform: `scale(${0.75 + 0.25 * k})` };
}

const STYLE = `
${ENTER_KEYFRAMES}
.sig-android-enter{animation:sig-android-enter ${ENTER_MS}ms linear both}
@keyframes sig-android-dot{0%{opacity:.4;transform:scale(.75)}20%{opacity:1;transform:scale(1)}40%,100%{opacity:.4;transform:scale(.75)}}
.sig-android-dot{animation:sig-android-dot ${TYPING_CYCLE}ms linear infinite both}
@keyframes sig-android-caret{0%,50%{opacity:1}50.01%,100%{opacity:0}}
.sig-android-caret{animation:sig-android-caret ${CARET_MS}ms step-end infinite;animation-delay:${CARET_MS / 2}ms}
@keyframes sig-android-toggle-in{from{opacity:0;transform:scale(.6)}to{opacity:1;transform:scale(1)}}
.sig-android-toggle-in{animation:sig-android-toggle-in 150ms cubic-bezier(.4,0,.2,1) both}
@keyframes sig-android-fade-in{from{opacity:0}to{opacity:1}}
.sig-android-fade-in{animation:sig-android-fade-in 150ms cubic-bezier(.4,0,.2,1) both}
`;

/* ======================================================================
   Helpers
   ====================================================================== */

/** Minutes since midnight from a typed clock label ("10:41", "٩:٣٠ م", "9:30 PM"); null if unparsable. */
function minutesOf(time: string): number | null {
  const norm = time.replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
  const m = norm.match(/(\d{1,2})\s*[:.]\s*(\d{2})/);
  if (!m) return null;
  let h = Number(m[1]);
  const pm = /pm|م/i.test(norm);
  const am = /am|ص/i.test(norm);
  if (pm && h < 12) h += 12;
  if (am && h === 12) h = 0;
  return h * 60 + Number(m[2]);
}

function clustered(a: Message, b: Message): boolean {
  if (a.sender !== b.sender) return false;
  // call updates are ConversationUpdateItems; group messages cluster per author
  if (a.type === "call" || b.type === "call") return false;
  if (a.sender === "them" && (a.authorIndex ?? 0) !== (b.authorIndex ?? 0)) return false;
  const ta = minutesOf(a.time);
  const tb = minutesOf(b.time);
  if (ta === null || tb === null) return true;
  return Math.abs(tb - ta) <= CLUSTER_MIN;
}

type Shape = "single" | "start" | "middle" | "end";

function shapeOf(messages: Message[], i: number): Shape {
  const m = messages[i];
  const prev = messages[i - 1];
  const next = messages[i + 1];
  const start = !prev || !clustered(prev, m);
  const end = !next || !clustered(m, next);
  if (start && end) return "single";
  if (start) return "start";
  if (end) return "end";
  return "middle";
}

const isStarting = (s: Shape) => s === "single" || s === "start";
const isEnding = (s: Shape) => s === "single" || s === "end";

/** Physical corner radii from V2ConversationItemShape (start/end are UI-relative). */
function cornerStyle(shape: Shape, outgoing: boolean, rtl: boolean): CSSProperties {
  let ts = BIG;
  let te = BIG;
  let be = BIG;
  let bs = BIG;
  if (shape === "start") {
    be = outgoing ? SMALL : BIG;
    bs = outgoing ? BIG : SMALL;
  } else if (shape === "end") {
    ts = outgoing ? BIG : SMALL;
    te = outgoing ? SMALL : BIG;
  } else if (shape === "middle") {
    ts = outgoing ? BIG : SMALL;
    te = outgoing ? SMALL : BIG;
    be = te;
    bs = ts;
  }
  return rtl
    ? { borderTopLeftRadius: te, borderTopRightRadius: ts, borderBottomRightRadius: bs, borderBottomLeftRadius: be }
    : { borderTopLeftRadius: ts, borderTopRightRadius: te, borderBottomRightRadius: be, borderBottomLeftRadius: bs };
}

/** Jumbomoji: up to 5 emoji and nothing else. Returns the count, or 0. */
function emojiOnlyCount(text: string): number {
  const t = text.trim();
  if (!t || t.length > 60) return 0;
  const Seg = (Intl as unknown as { Segmenter?: new (l?: string, o?: { granularity: string }) => { segment: (s: string) => Iterable<{ segment: string }> } }).Segmenter;
  const parts = Seg ? Array.from(new Seg(undefined, { granularity: "grapheme" }).segment(t), (s) => s.segment) : Array.from(t);
  const glyphs = parts.filter((g) => g.trim() !== "");
  if (glyphs.length < 1 || glyphs.length > 5) return 0;
  return glyphs.every((g) => /\p{Extended_Pictographic}/u.test(g) || /\p{Regional_Indicator}/u.test(g)) ? glyphs.length : 0;
}

/** EmojiTextView.jumbomojiScale(): 1 + 0.8 per threshold (<=5, <=4, <=2). */
function jumboSize(count: number): number {
  let s = 1;
  if (count <= 5) s += 0.8;
  if (count <= 4) s += 0.8;
  if (count <= 2) s += 0.8;
  return BODY_FS * s;
}

/** BidiUtil.hasMixedTextDirection: strong RTL and strong LTR characters together. */
function hasMixedDirection(text: string): boolean {
  return /[֐-ࣿיִ-﷿ﹰ-ﻼ]/.test(text) && /[A-Za-zÀ-ɏͰ-ϿЀ-ӿ]/.test(text);
}

/* Signal default avatars: AvatarColor background + Avatars.ForegroundColor text (Inter Medium). */
const AVATAR_COLORS: [string, string][] = [
  ["#e3e3fe", "#3838f5"],
  ["#dde7fc", "#1251d3"],
  ["#d8e8f0", "#086da0"],
  ["#cde4cd", "#067906"],
  ["#eae0f8", "#661aff"],
  ["#f5e3fe", "#9f00f0"],
  ["#f6d8ec", "#b8057c"],
  ["#f5d7d7", "#be0404"],
  ["#fef5d0", "#836b01"],
  ["#eae6d5", "#7d6f40"],
  ["#d2d2dc", "#4f4f6d"],
  ["#d7d7d9", "#5c5c5c"],
];

function abbreviation(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "";
  const first = Array.from(parts[0])[0] ?? "";
  const last = parts.length > 1 ? Array.from(parts[parts.length - 1])[0] ?? "" : "";
  return (first + last).toUpperCase();
}

/** Default group avatar: AvatarColor fill + the group glyph (symbol_group_24). */
function GroupAvatar({ group, size }: { group: GroupChat; size: number }) {
  if (group.avatar) return <SignalAvatar person={{ name: group.name, avatar: group.avatar }} size={size} />;
  let h = 0;
  for (let i = 0; i < group.name.length; i++) h = (h * 31 + group.name.charCodeAt(i)) | 0;
  const [bg, fg] = AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
  return (
    <div className="flex shrink-0 items-center justify-center rounded-full" style={{ width: size, height: size, background: bg }}>
      <Icon size={size * 0.6}>
        {P.group.map((d, i) => (
          <path key={i} d={d} fill={fg} fillRule="evenodd" />
        ))}
      </Icon>
    </div>
  );
}

/** URLs in a body are linkified (URLSpan: underlined, in the body text colour). */
const URL_RE = /(https?:\/\/[^\s]+|www\.[^\s]+)/g;
function richText(text: string): ReactNode {
  if (!URL_RE.test(text)) return text;
  URL_RE.lastIndex = 0;
  return text.split(URL_RE).map((part, i) =>
    i % 2 === 1 ? (
      <span key={i} style={{ textDecoration: "underline", textUnderlineOffset: 2 }}>
        {part}
      </span>
    ) : (
      part
    ),
  );
}

function domainOf(link: LinkPreview): string {
  if (link.siteName?.trim()) return link.siteName.trim();
  try {
    return new URL(link.url).hostname.replace(/^www\./, "");
  } catch {
    return link.url;
  }
}

/** SignalPlace.getDescription(): "name\naddress\nhttps://maps.google.com/maps?q=lat,lng". */
function mapsUrl(seed: string): string {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  const lat = (24.6 + ((h >>> 0) % 100000) / 1e6).toFixed(7);
  const lon = (46.6 + ((h >>> 8) % 100000) / 1e6).toFixed(7);
  return `https://maps.google.com/maps?q=${lat}%2C${lon}`;
}

function SignalAvatar({ person, size }: { person: Person; size: number }) {
  if (person.avatar) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={person.avatar}
        alt=""
        width={size}
        height={size}
        draggable={false}
        className="shrink-0 rounded-full object-cover"
        style={{ width: size, height: size, display: "block" }}
      />
    );
  }
  let h = 0;
  for (let i = 0; i < person.name.length; i++) h = (h * 31 + person.name.charCodeAt(i)) | 0;
  const [bg, fg] = AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
  const text = abbreviation(person.name);
  const fs = Math.min(size * 0.45, (size * 0.8) / Math.max(1, text.length * 0.62));
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full"
      style={{ width: size, height: size, background: bg, color: fg, fontSize: fs, fontWeight: 500, lineHeight: 1 }}
    >
      {text || (
        <Icon size={size * 0.6}>
          <path d={P.personCircle1} fill={fg} />
          <path d={P.personCircle2} fill={fg} />
        </Icon>
      )}
    </div>
  );
}

/* ======================================================================
   Icons [I] (exact Signal vector paths, 24dp viewport unless noted)
   ====================================================================== */

const P = {
  arrowStart:
    "M3.88 12c0 0.23 0.09 0.45 0.25 0.62l6.5 6.5c0.34 0.34 0.9 0.34 1.24 0 0.34-0.34 0.34-0.9 0-1.24l-5.13-5.13 1.76 0.13h11.25c0.48 0 0.88-0.4 0.88-0.88s-0.4-0.88-0.88-0.88H8.5l-1.76 0.13 5.13-5.13c0.34-0.34 0.34-0.9 0-1.24-0.34-0.34-0.9-0.34-1.24 0l-6.5 6.5C3.97 11.55 3.88 11.77 3.88 12Z",
  video:
    "M6.76 3.63h4.98c0.8 0 1.47 0 2 0.04 0.56 0.04 1.05 0.14 1.52 0.38 0.73 0.37 1.32 0.96 1.7 1.7 0.23 0.46 0.33 0.95 0.37 1.5 0.04 0.46 0.04 1 0.04 1.64l2.8-2.8c1.19-1.18 3.2-0.35 3.2 1.32v9.18c0 1.67-2.01 2.5-3.2 1.32l-2.8-2.8c0 0.64 0 1.18-0.04 1.63-0.04 0.56-0.14 1.05-0.38 1.52-0.37 0.73-0.96 1.32-1.7 1.7-0.46 0.23-0.95 0.33-1.5 0.37-0.54 0.05-1.2 0.05-2.01 0.05H6.76c-0.8 0-1.47 0-2-0.05C4.2 20.3 3.7 20.2 3.24 19.95c-0.73-0.37-1.32-0.96-1.7-1.7-0.23-0.46-0.33-0.95-0.37-1.5-0.05-0.54-0.05-1.2-0.04-2.01V9.26c0-0.8 0-1.47 0.04-2C1.2 6.7 1.3 6.2 1.55 5.74c0.37-0.73 0.96-1.32 1.7-1.7 0.46-0.23 0.95-0.33 1.5-0.37 0.54-0.05 1.2-0.05 2.01-0.04Zm8.86 5.67c0-0.85 0-1.44-0.03-1.9-0.04-0.45-0.1-0.69-0.2-0.86-0.2-0.4-0.53-0.73-0.93-0.93-0.17-0.1-0.41-0.16-0.86-0.2-0.46-0.03-1.05-0.04-1.9-0.04H6.8c-0.85 0-1.44 0-1.9 0.04-0.45 0.04-0.69 0.1-0.86 0.2C3.64 5.8 3.3 6.14 3.1 6.54 3 6.7 2.95 6.95 2.9 7.4 2.88 7.86 2.87 8.45 2.87 9.3v5.4c0 0.85 0 1.44 0.04 1.9 0.04 0.45 0.1 0.69 0.2 0.86 0.2 0.4 0.53 0.73 0.93 0.93 0.17 0.1 0.41 0.16 0.86 0.2 0.46 0.03 1.05 0.04 1.9 0.04h4.9c0.85 0 1.44 0 1.9-0.04 0.45-0.04 0.69-0.1 0.86-0.2 0.4-0.2 0.73-0.53 0.93-0.93 0.1-0.17 0.16-0.41 0.2-0.86 0.03-0.46 0.04-1.05 0.04-1.9V9.3Zm1.76 2.7c0 0.4 0.16 0.8 0.45 1.09l3.58 3.58 0.06 0.04h0.08l0.06-0.05c0-0.01 0.02-0.03 0.02-0.07V7.4c0-0.04-0.02-0.06-0.02-0.07L21.55 7.3l-0.08-0.01s-0.03 0-0.06 0.04l-3.58 3.58c-0.3 0.29-0.45 0.68-0.45 1.09Z",
  phone:
    "M4.25 2.73c1.25-1.25 3.3-1.1 4.37 0.3l2.17 2.85c0.88 1.15 0.77 2.78-0.26 3.8l-1.05 1.06c0.03 0.09 0.09 0.22 0.18 0.39 0.28 0.5 0.77 1.14 1.42 1.79 0.65 0.65 1.3 1.14 1.8 1.42 0.16 0.09 0.29 0.15 0.38 0.18l1.05-1.05c1.03-1.03 2.66-1.14 3.81-0.26l2.86 2.17c1.4 1.06 1.54 3.12 0.3 4.37l-0.44 0.43c-1.57 1.57-3.91 2.43-6.16 1.66-2.82-0.97-5.46-2.57-7.7-4.81-2.25-2.25-3.85-4.9-4.82-7.7-0.77-2.26 0.09-4.6 1.66-6.17l0.43-0.43Zm2.98 1.35C6.8 3.52 5.99 3.47 5.49 3.96L5.06 4.4C3.84 5.62 3.3 7.28 3.82 8.76c0.88 2.56 2.34 4.98 4.4 7.03 2.04 2.05 4.46 3.51 7.02 4.4 1.48 0.5 3.14-0.03 4.36-1.25l0.44-0.43c0.5-0.5 0.44-1.31-0.12-1.74l-2.85-2.17c-0.46-0.34-1.11-0.3-1.52 0.1l-1.24 1.25c-0.41 0.41-0.96 0.38-1.26 0.32-0.34-0.06-0.7-0.22-1.03-0.4-0.67-0.38-1.44-0.98-2.18-1.71-0.73-0.74-1.33-1.51-1.7-2.18-0.2-0.33-0.35-0.69-0.41-1.03-0.06-0.3-0.1-0.85 0.32-1.26l1.24-1.24C9.7 8.04 9.74 7.39 9.4 6.93L7.24 4.08Z",
  // abc_ic_menu_overflow_material (Toolbar overflow, tinted signal_icon_tint_primary)
  overflow:
    "M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z",
  emoji: [
    "M8.43 14.94c-0.3-0.37-0.86-0.42-1.23-0.11-0.37 0.3-0.43 0.85-0.12 1.23 1.17 1.41 2.94 2.32 4.92 2.32s3.75-0.9 4.92-2.32c0.3-0.38 0.25-0.93-0.12-1.23-0.37-0.31-0.92-0.26-1.23 0.11-0.85 1.03-2.13 1.69-3.57 1.69s-2.72-0.66-3.57-1.69Z",
    "M15.25 7.75c-0.5 0-0.88 0.3-1.12 0.66-0.25 0.37-0.38 0.84-0.38 1.34 0 0.5 0.13 0.97 0.38 1.34 0.24 0.36 0.62 0.66 1.12 0.66 0.5 0 0.88-0.3 1.12-0.66 0.25-0.37 0.38-0.84 0.38-1.34 0-0.5-0.13-0.97-0.38-1.34-0.24-0.36-0.62-0.66-1.12-0.66Z",
    "M7.63 8.41c0.24-0.36 0.62-0.66 1.12-0.66 0.5 0 0.88 0.3 1.12 0.66 0.25 0.37 0.38 0.84 0.38 1.34 0 0.5-0.13 0.97-0.38 1.34-0.24 0.36-0.62 0.66-1.12 0.66-0.5 0-0.88-0.3-1.12-0.66-0.25-0.37-0.38-0.84-0.38-1.34 0-0.5 0.13-0.97 0.38-1.34Z",
    "M12 1.13C6 1.13 1.12 5.99 1.12 12 1.13 18 6 22.88 12 22.88c6 0 10.88-4.87 10.88-10.88C22.88 6 18 1.12 12 1.12ZM2.87 12c0-5.04 4.09-9.13 9.13-9.13 5.04 0 9.13 4.09 9.13 9.13 0 5.04-4.09 9.13-9.13 9.13-5.04 0-9.13-4.09-9.13-9.13Z",
  ],
  camera1:
    "M12,6.375a5.875,5.875 0,1 0,0 11.75,5.875 5.875,0 0,0 0,-11.75ZM7.875,12.25a4.125,4.125 0,1 1,8.25 0,4.125 4.125,0 0,1 -8.25,0Z",
  camera2:
    "M10.13,1.625c-0.806,0 -1.575,0.338 -2.12,0.932L6.803,3.875H5.5A4.375,4.375 0,0 0,1.125 8.25v9.25A4.375,4.375 0,0 0,5.5 21.875h13a4.375,4.375 0,0 0,4.375 -4.375V8.25A4.375,4.375 0,0 0,18.5 3.875h-1.303L15.99,2.557a2.875,2.875 0,0 0,-2.12 -0.932h-3.74ZM9.3,3.74c0.214,-0.233 0.514,-0.365 0.83,-0.365h3.74c0.316,0 0.616,0.132 0.83,0.365l1.468,1.601c0.165,0.181 0.4,0.284 0.645,0.284H18.5a2.625,2.625 0,0 1,2.625 2.625v9.25a2.625,2.625 0,0 1,-2.625 2.625h-13A2.625,2.625 0,0 1,2.875 17.5V8.25A2.625,2.625 0,0 1,5.5 5.625h1.688a0.875,0.875 0,0 0,0.645 -0.284L9.3,3.74Z",
  mic1:
    "M12 1.13C9.3 1.13 7.12 3.3 7.12 6v5.5c0 2.7 2.19 4.88 4.88 4.88 2.7 0 4.88-2.19 4.88-4.88V6c0-2.7-2.19-4.88-4.88-4.88ZM8.87 6c0-1.73 1.4-3.13 3.13-3.13s3.13 1.4 3.13 3.13v5.5c0 1.73-1.4 3.13-3.13 3.13s-3.13-1.4-3.13-3.13V6Z",
  mic2:
    "M7.75 21.13c-0.48 0-0.88 0.39-0.88 0.87s0.4 0.88 0.88 0.88h8.5c0.48 0 0.88-0.4 0.88-0.88s-0.4-0.88-0.88-0.88h-3.38v-1.29c4.22-0.44 7.5-4 7.5-8.33v-1c0-0.48-0.39-0.88-0.87-0.88s-0.88 0.4-0.88 0.88v1c0 3.66-2.96 6.63-6.62 6.63s-6.63-2.97-6.63-6.63v-1c0-0.48-0.39-0.88-0.87-0.88s-0.88 0.4-0.88 0.88v1c0 4.33 3.3 7.9 7.5 8.33v1.3H7.75Z",
  plus: "M12.875,4.5a0.875,0.875 0,0 0,-1.75 0v6.625H4.5a0.875,0.875 0,0 0,0 1.75h6.625V19.5a0.875,0.875 0,0 0,1.75 0v-6.625H19.5a0.875,0.875 0,0 0,0 -1.75h-6.625V4.5Z",
  // ic_send_lock_24 (MessageSendType.SignalMessageSendType.buttonDrawableRes)
  sendLock:
    "M12.694,18.461 L5.286,22.694A1.25,1.25 0,0 1,3.433 21.4L4.69,13.862 14,12 4.69,10.138 3.433,2.6A1.25,1.25 0,0 1,5.286 1.306L22.1,10.915a1.25,1.25 0,0 1,0 2.17l-1.194,0.682A3.99,3.99 0,0 0,14 16.5v0.416A3.017,3.017 0,0 0,12.694 18.461ZM22,19.5v3A1.5,1.5 0,0 1,20.5 24h-5A1.5,1.5 0,0 1,14 22.5v-3a1.5,1.5 0,0 1,1.25 -1.475L15.25,16.75a2.75,2.75 0,0 1,5.5 0v1.275A1.5,1.5 0,0 1,22 19.5ZM16.75,16.75L16.75,18h2.5L19.25,16.75a1.25,1.25 0,0 0,-2.5 0Z",
  chevronRight:
    "M8.881,4.381a0.875,0.875 0,0 1,1.238 0l7,7a0.875,0.875 0,0 1,0 1.238l-7,7A0.875,0.875 0,0 1,8.88 18.38L15.263,12 8.88,5.619a0.875,0.875 0,0 1,0 -1.238Z",
  personCircle1:
    "M7.88 9.81c0-2.53 1.72-4.69 4.12-4.69 2.4 0 4.13 2.16 4.13 4.7 0 1.27-0.43 2.48-1.15 3.38-0.71 0.9-1.76 1.55-2.98 1.55s-2.27-0.64-2.98-1.55c-0.72-0.9-1.14-2.1-1.14-3.39ZM12 6.87c-1.2 0-2.38 1.13-2.38 2.94 0 0.9 0.3 1.72 0.77 2.3C10.85 12.7 11.43 13 12 13c0.57 0 1.15-0.3 1.61-0.88 0.46-0.59 0.77-1.4 0.77-2.3 0-1.82-1.19-2.95-2.38-2.95Z",
  personCircle2:
    "M1.13 12C1.13 6 5.99 1.12 12 1.12 18 1.13 22.88 6 22.88 12c0 6-4.87 10.88-10.88 10.88C6 22.88 1.12 18 1.12 12ZM12 2.87c-5.04 0-9.13 4.09-9.13 9.13 0 2.44 0.96 4.65 2.52 6.29 1.63-1.58 4.03-2.54 6.61-2.54s4.98 0.96 6.61 2.54c1.56-1.64 2.52-3.85 2.52-6.29 0-5.04-4.09-9.13-9.13-9.13Zm5.28 16.57c-1.26-1.17-3.11-1.94-5.28-1.94-2.17 0-4.03 0.77-5.28 1.94 1.49 1.06 3.31 1.68 5.28 1.68 1.97 0 3.8-0.62 5.28-1.68Z",
  // symbol_group_24
  group: [
    "M13 7.148C13 5.015 14.434 3.125 16.5 3.125C18.566 3.125 20 5.015 20 7.148C20 8.23 19.647 9.259 19.048 10.033C18.449 10.807 17.557 11.375 16.5 11.375C15.443 11.375 14.551 10.807 13.952 10.033C13.353 9.259 13 8.23 13 7.148ZM16.5 4.875C15.667 4.875 14.75 5.692 14.75 7.148C14.75 7.861 14.985 8.509 15.336 8.962C15.687 9.415 16.107 9.625 16.5 9.625C16.893 9.625 17.313 9.415 17.664 8.962C18.015 8.509 18.25 7.861 18.25 7.148C18.25 5.692 17.333 4.875 16.5 4.875Z",
    "M7.5 12.625C8.615 12.625 9.686 12.867 10.636 13.301C10.169 13.712 9.752 14.175 9.399 14.683C8.818 14.485 8.179 14.375 7.5 14.375C4.825 14.375 2.779 16.08 2.428 18.125L8.151 18.125C8.134 18.33 8.125 18.539 8.125 18.75C8.125 19.135 8.155 19.511 8.212 19.875L1.757 19.875C1.164 19.875 0.625 19.404 0.625 18.75C0.625 15.261 3.816 12.625 7.5 12.625Z",
    "M16.5 12.625C12.816 12.625 9.625 15.261 9.625 18.75C9.625 19.404 10.164 19.875 10.757 19.875L22.243 19.875C22.836 19.875 23.375 19.404 23.375 18.75C23.375 15.261 20.184 12.625 16.5 12.625ZM16.5 14.375C19.175 14.375 21.221 16.08 21.572 18.125L11.428 18.125C11.779 16.08 13.825 14.375 16.5 14.375Z",
    "M7.5 3.125C5.434 3.125 4 5.015 4 7.148C4 8.23 4.353 9.259 4.952 10.033C5.551 10.807 6.443 11.375 7.5 11.375C8.557 11.375 9.449 10.807 10.048 10.033C10.647 9.259 11 8.23 11 7.148C11 5.015 9.566 3.125 7.5 3.125ZM5.75 7.148C5.75 5.692 6.667 4.875 7.5 4.875C8.333 4.875 9.25 5.692 9.25 7.148C9.25 7.861 9.015 8.509 8.664 8.962C8.313 9.415 7.893 9.625 7.5 9.625C7.107 9.625 6.687 9.415 6.336 8.962C5.985 8.509 5.75 7.861 5.75 7.148Z",
  ],
  // ic_profile_circle_outline_16 (16dp viewport)
  profile16:
    "M8,1a7,7 0,1 0,7 7A7,7 0,0 0,8 1ZM8,2.5A5.51,5.51 0,0 1,13.5 8a5.41,5.41 0,0 1,-0.9 3,4 4,0 0,0 -2.14,-0.95 4.43,4.43 0,0 0,0.79 -2.52A3.33,3.33 0,0 0,8 4,3.33 3.33,0 0,0 4.75,7.53a4.43,4.43 0,0 0,0.79 2.52A4,4 0,0 0,3.4 11a5.41,5.41 0,0 1,-0.9 -3A5.51,5.51 0,0 1,8 2.5ZM8,10c-0.9,0 -1.75,-1.2 -1.75,-2.47A1.84,1.84 0,0 1,8 5.5a1.84,1.84 0,0 1,1.75 2C9.75,8.8 8.9,10 8,10ZM4.37,12.12A2.48,2.48 0,0 1,6 11.5h4a2.48,2.48 0,0 1,1.63 0.62,5.46 5.46,0 0,1 -7.26,0Z",
  photo1: "M6 9.13C6 7.95 6.95 7 8.13 7c1.17 0 2.12 0.95 2.12 2.13 0 1.17-0.95 2.12-2.13 2.12C6.96 11.25 6 10.3 6 9.12Z",
  photo2:
    "M7.56 3.13h8.88c0.95 0 1.71 0 2.33 0.05 0.64 0.05 1.2 0.16 1.72 0.42 0.82 0.42 1.49 1.1 1.9 1.91 0.27 0.52 0.38 1.08 0.43 1.72 0.05 0.62 0.05 1.38 0.05 2.33v4.88c0 0.95 0 1.71-0.05 2.33-0.05 0.64-0.16 1.2-0.42 1.72-0.42 0.82-1.1 1.49-1.91 1.9-0.52 0.27-1.08 0.38-1.72 0.43-0.62 0.05-1.38 0.05-2.33 0.05H7.56c-0.95 0-1.71 0-2.33-0.05-0.64-0.05-1.2-0.16-1.72-0.42-0.82-0.42-1.49-1.1-1.9-1.91-0.27-0.52-0.38-1.08-0.43-1.72-0.06-0.62-0.06-1.38-0.05-2.33V9.56c0-0.95 0-1.71 0.05-2.33 0.05-0.64 0.16-1.2 0.42-1.72 0.42-0.82 1.1-1.49 1.91-1.9 0.52-0.27 1.08-0.38 1.72-0.43 0.62-0.06 1.38-0.06 2.33-0.06ZM5.37 4.92C4.84 4.96 4.54 5.04 4.31 5.16 3.8 5.41 3.4 5.81 3.16 6.31c-0.12 0.23-0.2 0.53-0.24 1.06C2.88 7.91 2.88 8.61 2.88 9.6v4.8 0.3l1.66-1.43c0.84-0.72 2.08-0.72 2.92 0l1.7 1.46 4.46-3.82c0.94-0.8 2.32-0.8 3.26 0l4.25 3.64V9.6c0-1 0-1.69-0.05-2.23-0.04-0.53-0.12-0.83-0.24-1.06-0.25-0.5-0.65-0.9-1.15-1.15-0.23-0.12-0.53-0.2-1.06-0.24-0.54-0.04-1.24-0.04-2.23-0.04H7.6c-1 0-1.69 0-2.23 0.04Zm4.95 10.8l0.54 0.46c0.32 0.27 0.35 0.74 0.08 1.06-0.27 0.31-0.74 0.35-1.05 0.08l-3.4-2.91c-0.28-0.24-0.7-0.24-0.98 0l-2.59 2.22c0.04 0.53 0.12 0.83 0.24 1.06 0.25 0.5 0.65 0.9 1.15 1.15 0.23 0.12 0.53 0.2 1.06 0.24 0.54 0.04 1.24 0.05 2.23 0.05h8.8c1 0 1.69 0 2.23-0.05 0.53-0.04 0.83-0.12 1.06-0.24 0.5-0.25 0.9-0.65 1.15-1.15 0.12-0.23 0.2-0.53 0.24-1.06l0.01-0.14-5.19-4.44c-0.37-0.33-0.93-0.33-1.3 0l-4.28 3.66Z",
};

/* Delivery status [I] — symbol_messagestatus_*_24 (12dp tall). */
const STATUS_SENT = [
  "M8.46 4.3c0.17-0.26 0.1-0.6-0.16-0.76-0.26-0.17-0.6-0.1-0.76 0.16L5.22 7.3 4.19 5.92c-0.18-0.24-0.53-0.3-0.77-0.11-0.24 0.18-0.3 0.53-0.11 0.77l1.5 2c0.1 0.14 0.28 0.23 0.46 0.22 0.18 0 0.34-0.1 0.44-0.25L8.46 4.3Z",
  "M6 0C2.69 0 0 2.69 0 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6ZM1.1 6c0-2.7 2.2-4.9 4.9-4.9s4.9 2.2 4.9 4.9-2.2 4.9-4.9 4.9S1.1 8.7 1.1 6Z",
];
const STATUS_DELIVERED = [
  "M6 0c0.67 0 1.32 0.11 1.92 0.31-0.36 0.26-0.7 0.55-1 0.88C6.62 1.13 6.32 1.1 6 1.1 3.3 1.1 1.1 3.3 1.1 6s2.2 4.9 4.9 4.9c0.31 0 0.62-0.03 0.92-0.09 0.3 0.33 0.64 0.62 1 0.88C7.32 11.89 6.67 12 6 12c-3.31 0-6-2.69-6-6s2.69-6 6-6Z",
  "M4.19 5.92l0.9 1.2c0.09 0.55 0.24 1.09 0.46 1.6C5.46 8.76 5.37 8.8 5.27 8.8c-0.18 0-0.35-0.08-0.46-0.22l-1.5-2C3.13 6.34 3.18 5.99 3.42 5.81c0.24-0.18 0.59-0.13 0.77 0.11Z",
  "M14.3 3.54c0.25 0.16 0.33 0.5 0.16 0.76l-2.75 4.25c-0.1 0.15-0.26 0.24-0.44 0.25-0.18 0-0.35-0.08-0.46-0.22l-1.5-2C9.13 6.34 9.18 5.99 9.42 5.81c0.24-0.18 0.59-0.13 0.77 0.11l1.03 1.37 2.32-3.59c0.16-0.25 0.5-0.33 0.76-0.16Z",
  "M6 6c0-3.31 2.69-6 6-6s6 2.69 6 6-2.69 6-6 6-6-2.69-6-6Zm6-4.9C9.3 1.1 7.1 3.3 7.1 6s2.2 4.9 4.9 4.9 4.9-2.2 4.9-4.9-2.2-4.9-4.9-4.9Z",
];
const STATUS_READ = [
  "M6 0.25c0.69 0 1.35 0.12 1.96 0.34C6.3 1.82 5.25 3.8 5.25 6c0 0.37 0.03 0.74 0.09 1.1L5.22 7.29 4.19 5.92c-0.18-0.24-0.53-0.3-0.77-0.11-0.24 0.18-0.3 0.53-0.11 0.77l1.5 2c0.1 0.14 0.28 0.23 0.46 0.22 0.18 0 0.34-0.1 0.44-0.25L5.73 8.5c0.47 1.16 1.25 2.16 2.23 2.9-0.61 0.22-1.27 0.34-1.96 0.34-3.18 0-5.75-2.57-5.75-5.75S2.82 0.25 6 0.25Z",
  "M12 0.25C8.82 0.25 6.25 2.82 6.25 6s2.57 5.75 5.75 5.75S17.75 9.18 17.75 6 15.18 0.25 12 0.25Zm2.3 3.29c0.25 0.16 0.33 0.5 0.16 0.76l-2.75 4.25c-0.1 0.15-0.26 0.24-0.44 0.25-0.18 0-0.35-0.08-0.46-0.22l-1.5-2C9.13 6.34 9.18 5.99 9.42 5.81c0.24-0.18 0.59-0.13 0.77 0.11l1.03 1.37 2.32-3.59c0.16-0.25 0.5-0.33 0.76-0.16Z",
];

function StatusIcon({ status, color }: { status: DeliveryStatus; color: string }) {
  const sent = status === "sent";
  const paths = sent ? STATUS_SENT : status === "delivered" ? STATUS_DELIVERED : STATUS_READ;
  const w = sent ? 12 : 18;
  return (
    <svg width={w} height={12} viewBox={`0 0 ${w} 12`} style={{ display: "block", flexShrink: 0 }}>
      {paths.map((d, i) => (
        <path key={i} d={d} fill={color} />
      ))}
    </svg>
  );
}

function Icon({ children, size = 24, vb = 24, w, style }: { children: ReactNode; size?: number; vb?: number; w?: number; style?: CSSProperties }) {
  return (
    <svg
      width={w ?? size}
      height={size}
      viewBox={`0 0 ${(vb * (w ?? size)) / size} ${vb}`}
      fill="none"
      style={{ display: "block", flexShrink: 0, ...style }}
    >
      {children}
    </svg>
  );
}

/* ======================================================================
   Screen
   ====================================================================== */

export function SignalAndroid({ scenario, playback, lang, rtl }: PlatformProps) {
  const dark = scenario.theme === "dark";
  const p = dark ? DARK : LIGHT;
  const s = STR[lang];
  const uiDir = rtl ? "rtl" : "ltr";
  const { messages, typing } = playback;
  const live = playback.isLive;
  const clock = playback.clockMs;
  // group thread: Scenario.group replaces Scenario.them
  const group = scenario.group && scenario.group.members.length > 0 ? scenario.group : null;
  const members = group?.members ?? [];
  const authorOf = (m: Message): Person => (group ? (members[m.authorIndex ?? 0] ?? members[0]) : scenario.them);
  const shortName = (x: Person) => x.name.trim().split(/\s+/)[0] ?? x.name;
  // OS keyboard: the window resizes (adjustResize), so the composer sits on the
  // keyboard; it also draws the nav bar, so ours goes away while it is up.
  const kb = useKeyboardInset();
  const kbSpace = kb.inset > 0 ? Math.max(48, kb.inset) : 0;
  // the composer grows with a wrapping draft; keep the newest row pinned above it
  const composerRef = useRef<HTMLDivElement>(null);
  const [composerH, setComposerH] = useState(60);
  useIsoLayoutEffect(() => {
    const h = composerRef.current ? Math.round(composerRef.current.offsetHeight) : 60;
    if (h && h !== composerH) setComposerH(h);
  });
  const scrollRef = useChatScroll<HTMLDivElement>(`${messages.length}-${typing}-${composerH}`);

  // The list shrinks as the keyboard opens: keep the newest row in view.
  const prevSpace = useRef(kbSpace);
  useIsoLayoutEffect(() => {
    const sc = scrollRef.current;
    const delta = kbSpace - prevSpace.current;
    prevSpace.current = kbSpace;
    if (!sc || delta <= 0) return;
    const atBottom = sc.scrollHeight - (sc.clientHeight + delta) - sc.scrollTop < 48;
    if (atBottom) sc.scrollTop = sc.scrollHeight;
  }, [kbSpace, scrollRef]);

  // Material3OnScrollHelper: toolbar (and status bar behind it) = colorBackground at the
  // top of the list, colorSurface2 once content can scroll under it; 200ms colour fade.
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const check = () => setScrolled(el.scrollTop > 0.5);
    check();
    el.addEventListener("scroll", check, { passive: true });
    const ro = new ResizeObserver(check);
    ro.observe(el);
    // Programmatic scrolls (exporter / harness) may not dispatch scroll events promptly.
    const poll = window.setInterval(check, 200);
    return () => {
      el.removeEventListener("scroll", check);
      ro.disconnect();
      window.clearInterval(poll);
    };
  }, [scrollRef]);
  const bar = scrolled ? p.barScrolled : p.bg;
  const barTransition = clock === undefined ? "background-color 200ms linear" : undefined;

  const lastSender = messages.length ? messages[messages.length - 1].sender : null;
  // the member who is typing: author of the next (not yet revealed) message
  const pending = scenario.messages[messages.length];
  const typist = group ? (pending && pending.sender === "them" ? authorOf(pending) : members[0]) : null;
  const title = group ? group.name : scenario.them.name;
  // ConversationFragment.createGroupSubtitleString: participants joined by ", ", self as "You"
  const subtitle = group ? [...members.map((x) => x.name), s.you].join(", ") : null;

  return (
    <div className="flex h-full w-full flex-col" style={{ background: p.bg, color: p.ink }} dir={uiDir}>
      <style>{STYLE}</style>
      <div style={{ background: bar, transition: barTransition }}>
        <SamsungStatusBar tint={dark ? "light" : "dark"} background={bar} lang={lang} />
      </div>

      {/* Top app bar [H] */}
      <div className="relative z-10 flex shrink-0 items-center" style={{ height: 64, background: bar, transition: barTransition }}>
        <div className="flex shrink-0 items-center justify-center" style={{ width: 56, height: 56 }}>
          {/* symbol_arrow_start_24 is autoMirrored */}
          <Icon style={{ transform: rtl ? "scaleX(-1)" : undefined }}>
            <path d={P.arrowStart} fill={p.ink} />
          </Icon>
        </div>
        <div style={{ marginTop: 3 }}>
          {group ? <GroupAvatar group={group} size={36} /> : <SignalAvatar person={scenario.them} size={36} />}
        </div>
        <div className="flex min-w-0 flex-1 flex-col justify-center" style={{ paddingInlineStart: 16, paddingInlineEnd: 4 }}>
          <div className="flex min-w-0 items-center">
            <span
              className="truncate"
              style={{ fontSize: 18, lineHeight: "24px", letterSpacing: "0.009em", fontWeight: 400, color: p.ink }}
            >
              {title}
            </span>
            {/* system-contact end drawable (ic_profile_circle_outline_16), drawablePadding 3 */}
            {!group && (
              <span className="shrink-0" style={{ marginInlineStart: 3 }}>
                <Icon size={16} vb={16}>
                  <path d={P.profile16} fill={p.contactGlyph} />
                </Icon>
              </span>
            )}
          </div>
          {subtitle && (
            // subtitle: Signal.Text.BodySmall (13sp), OnSurfaceVariant, 1 line
            <span
              className="truncate"
              style={{ fontSize: 13, lineHeight: "16px", letterSpacing: "0.03em", color: p.sub, textAlign: "start" }}
            >
              {subtitle}
            </span>
          )}
        </div>
        {/* menu: video + call (showAsAction=always, 48dp each) + overflow (36dp); groups: group-call video only. */}
        <div className="flex shrink-0 items-center">
          <div className="flex items-center justify-center" style={{ width: 48, height: 48 }}>
            <Icon>
              <path d={P.video} fill={p.ink} />
            </Icon>
          </div>
          {!group && (
            <div className="flex items-center justify-center" style={{ width: 48, height: 48 }}>
              <Icon>
                <path d={P.phone} fill={p.ink} />
              </Icon>
            </div>
          )}
          <div className="flex items-center justify-center" style={{ width: 36, height: 48 }}>
            <Icon>
              <path d={P.overflow} fill={p.ink} />
            </Icon>
          </div>
        </div>
      </div>

      {/* Conversation list (reverse layout: short threads sit on the composer) */}
      <div ref={scrollRef} className="rcss-scroll min-h-0 flex-1 overflow-y-auto" style={{ background: p.bg }}>
        <div className="flex min-h-full flex-col justify-end" style={{ paddingBottom: 2 }}>
          <ThreadHeader person={scenario.them} group={group} p={p} rtl={rtl} s={s} />

          {/* Date header decoration [R] */}
          <div className="flex justify-center" style={{ padding: "12px 28px 13px" }}>
            <span
              style={{
                fontSize: 14,
                lineHeight: "18.6px",
                letterSpacing: "0.01em",
                padding: "4px 10px",
                color: p.sub,
              }}
            >
              {s.today}
            </span>
          </div>

          {messages.map((m, i) => {
            if (m.type === "call") {
              // ConversationUpdateItem: 12dp margins (8dp next to another update)
              const prevCall = messages[i - 1]?.type === "call";
              const nextCall = messages[i + 1]?.type === "call";
              return (
                <div
                  key={m.id}
                  data-mid={m.id}
                  data-sender={m.sender}
                  className={live ? "sig-android-enter" : undefined}
                  style={{ marginTop: prevCall ? 8 : 12, marginBottom: nextCall ? 8 : 12 }}
                >
                  <CallUpdate m={m} s={s} p={p} lang={lang} groupAuthor={group ? shortName(authorOf(m)) : null} />
                </div>
              );
            }
            const mine = m.sender === "me";
            const shape = shapeOf(messages, i);
            const groupIncoming = !!group && !mine;
            const author = authorOf(m);
            const c = NAME_COLORS[(m.authorIndex ?? 0) % NAME_COLORS.length];
            const t = m.replyToId ? scenario.messages.find((x) => x.id === m.replyToId) : undefined;
            return (
              <SignalRow
                key={m.id}
                m={m}
                quote={t ? quoteOf(t, authorOf(t), s) : null}
                shape={shape}
                p={p}
                rtl={rtl}
                lang={lang}
                s={s}
                status={playback.statusOf(m)}
                live={live}
                sender={groupIncoming && isStarting(shape) ? { name: author.name, color: dark ? c[1] : c[0] } : null}
                groupIncoming={groupIncoming}
                avatar={groupIncoming && isEnding(shape) ? author : null}
                authorName={shortName(author)}
              />
            );
          })}

          {typing && (
            <div
              className={live && clock === undefined ? "sig-android-enter" : undefined}
              style={{
                display: "flex",
                alignItems: "flex-end",
                padding: "3px 0 8px",
                paddingInlineStart: typist ? GROUP_START : GUTTER,
                marginTop: lastSender ? 0 : 6,
              }}
            >
              {typist && (
                <span className="shrink-0" style={{ marginInlineEnd: 8 }}>
                  <SignalAvatar person={typist} size={GROUP_AVATAR} />
                </span>
              )}
              <div
                className="flex items-center justify-center"
                style={{ width: 66, height: 38, borderRadius: BIG, background: p.inBubble }}
                dir="ltr"
              >
                {[0, 1, 2].map((d) => {
                  const st = clock !== undefined ? typingDot(clock, d) : undefined;
                  return (
                    <span
                      key={d}
                      className={clock === undefined ? "sig-android-dot block rounded-full" : "block rounded-full"}
                      style={{
                        width: 10,
                        height: 10,
                        margin: 2,
                        background: p.sub,
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

      {/* Composer [P] */}
      <div ref={composerRef} className="shrink-0">
        <AndroidComposer p={p} rtl={rtl} placeholder={s.placeholder} text={playback.draft?.text ?? ""} clock={clock} />
      </div>

      {/* the keyboard (drawn by PhoneScreen on top) takes this space, nav bar included */}
      <div
        className="shrink-0"
        style={{
          height: kbSpace,
          background: p.bg,
          transition: kb.transition === "none" ? undefined : `height ${kb.transition}`,
        }}
      />
      <SystemBottomBar device="android" bg={p.bg} fg={p.navFg} />
    </div>
  );
}

/* ======================================================================
   Composer [P][CI]
   ====================================================================== */

const COMPOSE_FS = 16;
/** Signal.Text.Body as a style (not a textAppearance): 16sp Roboto + 2sp lineSpacingExtra. */
const COMPOSE_LINE = BODY_LH;
const COMPOSE_EXTRA = 2;
const COMPOSE_MAX_LINES = 5;

/** EditText cursor: 2dp bar in colorPrimary; Editor.BLINK keeps it solid while edits land. */
function AndroidCaret({ color, exporting, keystroke }: { color: string; exporting: boolean; keystroke: number }) {
  return (
    <span aria-hidden className="relative inline-block" style={{ width: 0, height: COMPOSE_LINE, verticalAlign: "top" }}>
      <span
        key={exporting ? undefined : keystroke}
        className={exporting ? "absolute" : "sig-android-caret absolute"}
        style={{ insetInlineStart: 0, top: 0, width: 2, height: COMPOSE_LINE + 1, background: color }}
      />
    </span>
  );
}

/**
 * conversation_input_panel.xml + ConversationFragment.updateToggleButtonState():
 * empty → emoji | hint | camera, mic (quick_attachment_toggle) and the "+"
 * (attach_button) in the 40dp chat-colour circle. With text → the camera and
 * mic hide, the inline "+" (24dp, OnSurface, 12dp end margin) appears at the
 * end of the field and the circle shows the send button (ic_send_lock_24,
 * AnimatingToggle: 150ms scale .6→1 + fade, FastOutSlowIn). ComposeText grows
 * from 44dp up to 5 lines (paddingVertical 8), then scrolls; the emoji toggle,
 * the inline "+" and the circle stay at the bottom.
 * The caret is solid while the draft is typed (Editor.BLINK restarts on each
 * edit and the compose hold is < 500ms), so export (clock) draws it solid.
 */
function AndroidComposer({
  p,
  rtl,
  placeholder,
  text,
  clock,
}: {
  p: Palette;
  rtl: boolean;
  placeholder: string;
  text: string;
  clock?: number;
}) {
  const exporting = clock !== undefined;
  const hasText = text.trim().length > 0;
  const maxTextH = COMPOSE_MAX_LINES * COMPOSE_LINE + (COMPOSE_MAX_LINES - 1) * COMPOSE_EXTRA;
  const inAnim = exporting ? undefined : "sig-android-toggle-in";
  return (
    <div className="flex items-end" style={{ minHeight: 60, background: p.bg, padding: "8px 14px 8px 12px" }}>
      <div className="flex min-w-0 flex-1 items-end" style={{ minHeight: 44, borderRadius: 20, background: p.compose }}>
        {/* emoji_toggle: 48 × 44, bottom-aligned, OnSurfaceVariant */}
        <div className="flex shrink-0 items-center justify-center" style={{ width: 48, height: 44 }}>
          <Icon>
            {P.emoji.map((d, i) => (
              <path key={i} d={d} fill={p.sub} />
            ))}
          </Icon>
        </div>
        <div className="flex min-w-0 flex-1 items-center self-stretch" style={{ minHeight: 44, padding: "8px 2px" }}>
          {hasText || text.length > 0 ? (
            <div
              className="flex w-full flex-col justify-end overflow-hidden"
              style={{ maxHeight: maxTextH }}
            >
              <div
                dir={dirOf(text)}
                style={{
                  fontSize: COMPOSE_FS,
                  lineHeight: `${COMPOSE_LINE + COMPOSE_EXTRA}px`,
                  letterSpacing: "0.01em",
                  color: p.ink,
                  whiteSpace: "pre-wrap",
                  overflowWrap: "anywhere",
                  textAlign: "start",
                  // the extra spacing sits between lines, not under the last one
                  marginBottom: -COMPOSE_EXTRA,
                }}
              >
                {text}
                <AndroidCaret color={p.caret} exporting={exporting} keystroke={text.length} />
              </div>
            </div>
          ) : (
            <span
              className="min-w-0 flex-1 truncate"
              dir={rtl ? "rtl" : "ltr"}
              style={{ fontSize: COMPOSE_FS, lineHeight: "20px", letterSpacing: "0.01em", color: p.sub }}
            >
              {placeholder}
            </span>
          )}
        </div>
        {hasText ? (
          /* inline_attachment_container: "+" 24 × 44 at the bottom, 12dp end margin */
          <div
            key="inline"
            className={`flex shrink-0 items-center justify-center ${exporting ? "" : "sig-android-fade-in"}`}
            style={{ width: 24, height: 44, marginInlineStart: 4, marginInlineEnd: 12 }}
          >
            <Icon>
              <path d={P.plus} fill={p.ink} />
            </Icon>
          </div>
        ) : (
          /* quick_attachment_toggle: camera (16dp end) + recorder (2 + 12dp end), centred */
          <div key="quick" className="flex shrink-0 items-center self-stretch" style={{ marginInlineStart: 4 }}>
            <Icon style={{ marginInlineEnd: 16 }}>
              <path d={P.camera1} fill={p.sub} fillRule="evenodd" />
              <path d={P.camera2} fill={p.sub} fillRule="evenodd" />
            </Icon>
            <Icon style={{ marginInlineEnd: 14 }}>
              <path d={P.mic1} fill={p.sub} />
              <path d={P.mic2} fill={p.sub} />
            </Icon>
          </div>
        )}
      </div>
      {/* button_toggle: 40dp circle_tintable × chat colour, 2dp above the field bottom */}
      <div
        className="flex shrink-0 items-center justify-center rounded-full"
        style={{ width: 40, height: 40, marginInlineStart: 12, marginBottom: 2, background: p.outBubble }}
      >
        {hasText ? (
          <span key="send" className={`flex ${inAnim ?? ""}`}>
            {/* paper plane + lock: glyph points to the end in both directions (not autoMirrored) */}
            <Icon size={22}>
              <path d={P.sendLock} fill={p.plusIcon} />
            </Icon>
          </span>
        ) : (
          <span key="attach" className={`flex ${inAnim ?? ""}`}>
            <Icon size={22}>
              <path d={P.plus} fill={p.plusIcon} />
            </Icon>
          </span>
        )}
      </div>
    </div>
  );
}

/* ======================================================================
   Reactions [RX] (ReactionsConversationView + reactions_pill.xml)
   ====================================================================== */

/**
 * 26dp pill (1dp side margins, 7dp padding, 17dp emoji), 1dp stroke in
 * colorBackground; surfaceVariant for the other person's reaction,
 * surfaceVariant_32_no_alpha for mine. The rail hangs 4dp over the bubble's
 * bottom edge, 5dp (+1) in from the bubble edge that faces the middle of the
 * screen (outgoing: start, incoming: end).
 */
function ReactionPill({ emoji, fromMe, mine, p }: { emoji: string; fromMe: boolean; mine: boolean; p: Palette }) {
  return (
    <div
      className="pointer-events-none absolute flex"
      style={{
        top: "calc(100% - 4px)",
        ...(mine ? { insetInlineStart: 5 } : { insetInlineEnd: 5 }),
      }}
    >
      <div
        className="flex items-center justify-center"
        style={{
          height: 26,
          margin: "0 1px",
          padding: "0 6px",
          borderRadius: 13,
          border: `1px solid ${p.bg}`,
          background: fromMe ? p.pillMine : p.pill,
          boxSizing: "border-box",
        }}
      >
        <span className="flex items-center justify-center" style={{ width: 17, height: 17, fontSize: 14.5, lineHeight: "17px" }}>
          {emoji}
        </span>
      </div>
    </div>
  );
}

/* ======================================================================
   Quoted reply [QV] (QuoteView + v2_quote_view.xml)
   ====================================================================== */

interface QuoteSpec {
  author: string;
  /** quoted body / caption (EmojiTextView, 2 lines) */
  body: string;
  /** media_type label ("Photo", "Audio") when there is no body */
  media: string | null;
  thumb: { src: string | null } | null;
}

function quoteOf(target: Message, them: Person, s: (typeof STR)[Lang]): QuoteSpec {
  const author = target.sender === "me" ? s.you : them.name;
  if (target.type === "voice") return { author, body: "", media: s.audio, thumb: null };
  if (target.type === "image") {
    const caption = target.text.trim();
    return { author, body: caption, media: caption ? null : s.photo, thumb: { src: target.imageSrc ?? null } };
  }
  return { author, body: target.text.trim(), media: null, thumb: null };
}

/**
 * QuoteView (QuoteViewColorTheme *_NORMAL): 4dp bar in colorOnCustom, author
 * (labelMedium 13sp bold) 8dp from the bar / top, then the body (BodyMedium
 * 14sp, max 2 lines, 8dp bottom) or the media label; 60dp thumbnail at the
 * end. Corner mask: top corners 10dp (4dp on a collapsed side), bottom 4dp.
 */
function AndroidQuote({
  q,
  mine,
  p,
  topLeftLarge,
  topRightLarge,
}: {
  q: QuoteSpec;
  mine: boolean;
  p: Palette;
  topLeftLarge: boolean;
  topRightLarge: boolean;
}) {
  const fg = mine ? p.quoteOutFg : p.quoteInFg;
  const text: CSSProperties = { fontSize: 14, lineHeight: "16.4px", letterSpacing: "0.0179em", color: fg };
  return (
    <div
      className="relative flex overflow-hidden"
      style={{
        background: mine ? p.quoteOutBg : p.quoteInBg,
        borderTopLeftRadius: topLeftLarge ? 10 : 4,
        borderTopRightRadius: topRightLarge ? 10 : 4,
        borderBottomLeftRadius: 4,
        borderBottomRightRadius: 4,
        minHeight: q.thumb ? 60 : undefined,
      }}
    >
      <div className="shrink-0" style={{ width: 4, background: "#ffffff" }} />
      <div className="min-w-0 flex-1" style={{ padding: "8px 8px 8px" }}>
        <div
          className="truncate"
          style={{ fontSize: 13, lineHeight: "16px", letterSpacing: "0.0192em", fontWeight: 700, color: fg, marginBottom: 1 }}
        >
          <bdi>{q.author}</bdi>
        </div>
        {q.media ? (
          <div style={{ ...text, paddingTop: 4 }}>{q.media}</div>
        ) : (
          <div
            dir="auto"
            style={{
              ...text,
              display: "-webkit-box",
              WebkitBoxOrient: "vertical",
              WebkitLineClamp: 2,
              overflow: "hidden",
              overflowWrap: "anywhere",
              textAlign: "start",
            }}
          >
            {q.body}
          </div>
        )}
      </div>
      {q.thumb && (
        <div className="relative shrink-0 self-stretch" style={{ width: 60, background: p.imgEmpty }}>
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

/** Legacy ConversationItem quote slot: 7dp from the top, 6dp from the bubble sides. */
function QuoteSlot({ quote, mine, p, shape }: { quote: QuoteSpec; mine: boolean; p: Palette; shape: Shape }) {
  // ConversationItem.setQuote → QuoteView.setTopCornerSizes (physical left / right):
  // start of a cluster → both large; inside a cluster → outgoing (L, s), incoming (s, L)
  const starting = isStarting(shape);
  const tl = starting || mine;
  const tr = starting || !mine;
  return (
    <div style={{ padding: "7px 6px 0" }}>
      <AndroidQuote q={quote} mine={mine} p={p} topLeftLarge={tl} topRightLarge={tr} />
    </div>
  );
}

/* ======================================================================
   Thread header (top of the conversation) [G]
   ====================================================================== */

function ThreadHeader({
  person,
  group,
  p,
  rtl,
  s,
}: {
  person: Person;
  group: GroupChat | null;
  p: Palette;
  rtl: boolean;
  s: Strings;
}) {
  const name = group ? group.name : person.name;
  // groups: no system-contact glyph, chevron only (opens the group settings)
  const glyph = group ? null : (
    <span style={{ display: "inline-block", verticalAlign: "-2.5px" }}>
      <Icon size={18}>
        <path d={P.personCircle1} fill={p.ink} />
        <path d={P.personCircle2} fill={p.ink} />
      </Icon>
    </span>
  );
  const chevron = (
    <span style={{ display: "inline-block", verticalAlign: "-2.5px" }}>
      <Icon size={18} style={{ transform: rtl ? "scaleX(-1)" : undefined }}>
        <path d={P.chevronRight} fill={p.outline} />
      </Icon>
    </span>
  );
  // GroupMemberSubtitle: group glyph + up to three names "and N others" (underlined), bodyMedium OnSurface
  const members = group ? s.members(group.members.map((x) => x.name), group.members.length + 1) : null;
  let membersText: ReactNode = members?.text ?? null;
  if (members?.others) {
    const at = members.text.lastIndexOf(members.others);
    membersText = (
      <>
        {members.text.slice(0, at)}
        <span style={{ textDecoration: "underline" }}>{members.others}</span>
        {members.text.slice(at + members.others.length)}
      </>
    );
  }
  return (
    <div className="flex justify-center" style={{ padding: "22px 16px 4px" }}>
      <div className="relative flex flex-col items-center" style={{ width: 277, maxWidth: "100%" }}>
        <div className="absolute" style={{ top: 0, left: "50%", transform: "translateX(-50%)", zIndex: 1 }}>
          {group ? <GroupAvatar group={group} size={74} /> : <SignalAvatar person={person} size={74} />}
        </div>
        <div
          className="flex w-full flex-col items-center"
          style={{
            marginTop: 16,
            border: `2.5px solid ${p.cardBorder}`,
            borderRadius: 40,
            padding: "70px 24px 24px",
          }}
        >
          {/* HeadlineDisplayName: textDirection forced LTR; glyphs lead in RTL */}
          <div
            dir="ltr"
            className="text-center"
            style={{ fontSize: 22, lineHeight: "28px", color: p.ink, overflowWrap: "anywhere" }}
          >
            {rtl ? (
              <>
                {chevron}
                {" "}
                {glyph}
                {glyph && " "}
                <bdi>{name}</bdi>
              </>
            ) : (
              <>
                <bdi>{name}</bdi>
                {" "}
                {glyph}
                {glyph && " "}
                {chevron}
              </>
            )}
          </div>
          {membersText && (
            <div
              className="text-center"
              style={{ marginTop: 8, fontSize: 14, lineHeight: "20px", letterSpacing: "0.0179em", color: p.ink }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" style={{ display: "inline-block", verticalAlign: "-3px", marginInlineEnd: 4 }}>
                {P.group.map((d, i) => (
                  <path key={i} d={d} fill={p.ink} fillRule="evenodd" />
                ))}
              </svg>
              {membersText}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface SenderSpec {
  name: string;
  color: string;
}

/**
 * SenderNameWithLabel (group threads, start of an author's cluster):
 * labelMedium bold (13sp) in the member's NameColor, 12dp side padding, 7dp
 * from the bubble top; 1dp to the body (CFv2) or 4dp (legacy items).
 */
function SenderName({ sender, legacy }: { sender: SenderSpec; legacy?: boolean }) {
  return (
    <div
      className="truncate"
      style={{
        margin: `7px 0 ${legacy ? 4 : 1}px`,
        padding: "0 12px",
        fontSize: 13,
        lineHeight: "16px",
        letterSpacing: "0.0192em",
        fontWeight: 700,
        color: sender.color,
        textAlign: "start",
      }}
    >
      <bdi>{sender.name}</bdi>
    </div>
  );
}

/**
 * LinkPreviewView (conversation type) inside the bubble: full width, filled
 * with the default (incoming) bubble colour, 12/6 padding, 72dp thumbnail
 * (top-start corner = the bubble's corner, others 4dp) with the title
 * (LabelLarge, OnSurface, 2 lines) centred beside it 8dp away, then the
 * description (13sp OnSurfaceVariant, 8dp below) and the site (12sp, 2dp).
 */
function AndroidLinkPreview({
  link,
  p,
  topStart,
  topEnd,
}: {
  link: LinkPreview;
  p: Palette;
  topStart: number;
  topEnd: number;
}) {
  const clamp = (n: number): CSSProperties => ({
    display: "-webkit-box",
    WebkitBoxOrient: "vertical",
    WebkitLineClamp: n,
    overflow: "hidden",
    overflowWrap: "anywhere",
  });
  return (
    <div
      style={{
        background: p.inBubble,
        padding: "6px 12px",
        borderStartStartRadius: topStart,
        borderStartEndRadius: topEnd,
      }}
    >
      <div className="flex items-center" style={{ minHeight: link.image ? 72 : undefined }}>
        {link.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={link.image}
            alt=""
            draggable={false}
            className="block shrink-0"
            style={{
              width: 72,
              height: 72,
              objectFit: "cover",
              borderRadius: 4,
              borderStartStartRadius: topStart > 0 ? topStart : 4,
            }}
          />
        )}
        <div
          dir="auto"
          style={{
            ...clamp(2),
            marginInline: link.image ? 8 : "0 8px",
            fontSize: 14,
            lineHeight: "20px",
            letterSpacing: "0.00714em",
            fontWeight: 500,
            color: p.ink,
            textAlign: "start",
          }}
        >
          {link.title}
        </div>
      </div>
      {link.description && (
        <div
          dir="auto"
          style={{ ...clamp(15), marginTop: 8, fontSize: 13, lineHeight: "18px", letterSpacing: "0.0179em", color: p.sub, textAlign: "start" }}
        >
          {link.description}
        </div>
      )}
      <div
        dir="auto"
        style={{ ...clamp(2), marginTop: 2, fontSize: 12, lineHeight: "16px", letterSpacing: "0.033em", color: p.sub, textAlign: "start" }}
      >
        {domainOf(link)}
      </div>
    </div>
  );
}

/** SignalSymbols.Glyph.X_CIRCLE, inline before the deleted-message text. */
function XCircle({ color }: { color: string }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 20 20"
      fill="none"
      style={{ display: "inline-block", verticalAlign: "-2.5px", marginInlineEnd: 4 }}
    >
      <circle cx="10" cy="10" r="8.35" stroke={color} strokeWidth="1.5" />
      <path d="M7 7l6 6M13 7l-6 6" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

/**
 * ic_document_large (38×50): white page, rounded corners, curled top-end
 * corner, soft grey edge; the lower-cased extension sits centred (10sp black).
 */
function DocumentIcon({ ext }: { ext: string }) {
  return (
    <div className="relative shrink-0" style={{ width: 38, height: 50, marginInlineStart: -4 }}>
      <svg width="38" height="50" viewBox="0 0 38 50" style={{ display: "block" }}>
        <path
          d="M7.5 2.5h17.2c.8 0 1.6.3 2.1.9l7.8 8.3c.5.5.8 1.3.8 2V43.5a4 4 0 0 1-4 4h-24a4 4 0 0 1-4-4v-37a4 4 0 0 1 4-4Z"
          fill="#ffffff"
          stroke="#d9d9d9"
          strokeWidth="0.8"
        />
        <path d="M25 2.8v6.4a3.6 3.6 0 0 0 3.6 3.6h6.6" fill="#efefef" stroke="#d9d9d9" strokeWidth="0.8" />
      </svg>
      <span
        className="absolute inset-x-0 flex justify-center"
        style={{ top: 21, fontSize: 10, lineHeight: "13px", color: "#000000", letterSpacing: "0.04em" }}
      >
        {ext}
      </span>
    </div>
  );
}

/**
 * Shared location: a Google Maps snapshot (SignalMapView.snapshot) sent as an
 * image whose caption is SignalPlace.getDescription(). The art is a plausible
 * Google Maps street grid with the red marker on the place.
 */
function GoogleMapArt() {
  const c = { land: "#f5f3ef", block: "#ebe8e2", park: "#c8e6c0", water: "#aadaff", road: "#ffffff", casing: "#dedbd5", major: "#fde293", majorCasing: "#f3c95a" };
  const minor = ["M-10 50H266", "M-10 112H266", "M-10 176H266", "M44 -10V266", "M112 -10V266", "M178 -10V266", "M232 -10V266"];
  return (
    <svg viewBox="0 0 256 192" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 block h-full w-full">
      <rect width="256" height="192" fill={c.land} />
      {[
        [6, 6, 32, 38], [52, 6, 54, 38], [120, 6, 52, 38], [186, 6, 40, 38], [240, 6, 16, 38],
        [6, 58, 32, 48], [52, 58, 54, 48], [186, 58, 40, 48], [240, 58, 16, 48],
        [6, 120, 32, 50], [120, 120, 52, 50], [186, 120, 40, 50], [240, 120, 16, 50],
        [6, 184, 32, 10], [52, 184, 54, 10], [120, 184, 52, 10],
      ].map(([x, y, w, h], i) => (
        <rect key={i} x={x} y={y} width={w} height={h} rx="1.5" fill={c.block} />
      ))}
      <rect x="120" y="58" width="52" height="48" rx="2" fill={c.park} />
      <rect x="52" y="120" width="54" height="50" rx="2" fill={c.park} />
      <path d="M200 192C206 172 222 160 256 154V192Z" fill={c.water} />
      {minor.map((d) => (
        <path key={`c${d}`} d={d} stroke={c.casing} strokeWidth="8" fill="none" />
      ))}
      {minor.map((d) => (
        <path key={d} d={d} stroke={c.road} strokeWidth="6.4" fill="none" />
      ))}
      <path d="M-10 168L266 20" stroke={c.majorCasing} strokeWidth="12" fill="none" />
      <path d="M-10 168L266 20" stroke={c.major} strokeWidth="9.4" fill="none" />
      {/* default Google Maps marker, tip on the place */}
      <ellipse cx="128" cy="96.5" rx="4.5" ry="1.6" fill="rgba(0,0,0,0.25)" />
      <path d="M128 96c-1.2-4.6-3.6-7.4-6-10.4a10 10 0 1 1 12 0c-2.4 3-4.8 5.8-6 10.4Z" fill="#ea4335" stroke="#b31412" strokeWidth="0.8" />
      <circle cx="128" cy="77.6" r="3.4" fill="#b31412" />
    </svg>
  );
}

/**
 * ConversationUpdateItem for a call: BodySmall (13sp, +3sp spacing), centred,
 * "<glyph> <text> · <time>" in the update text colour, or core red for a
 * missed incoming call; 24 + 12dp side padding, 12dp vertical margins.
 */
function CallUpdate({
  m,
  s,
  p,
  lang,
  groupAuthor,
}: {
  m: Message;
  s: Strings;
  p: Palette;
  lang: Lang;
  groupAuthor: string | null;
}) {
  const c = m.call ?? { video: false, missed: false };
  const mine = m.sender === "me";
  const time = localDigits(m.time, lang);
  let text: string;
  let red = false;
  let video = c.video;
  if (groupAuthor !== null) {
    video = true;
    text = c.missed && !mine ? s.groupMissed(time) : mine ? s.groupStartedYou(time) : s.groupStartedBy(groupAuthor, time);
  } else if (mine) {
    text = s.withDate(c.missed ? (c.video ? s.unansweredVideo : s.unansweredVoice) : c.video ? s.outgoingVideo : s.outgoingVoice, time);
  } else {
    red = c.missed;
    text = s.withDate(c.missed ? (c.video ? s.missedVideo : s.missedVoice) : c.video ? s.incomingVideo : s.incomingVoice, time);
  }
  const color = red ? (p.dark ? MISSED_RED.dark : MISSED_RED.light) : p.sub;
  return (
    <div className="flex justify-center" style={{ padding: "0 36px" }}>
      <div style={{ color, fontSize: 13, lineHeight: "18px", letterSpacing: "0.03em", textAlign: "center" }}>
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          style={{ display: "inline-block", verticalAlign: "-2.5px", marginInlineEnd: 4 }}
        >
          <path d={video ? P.video : P.phone} fill={color} />
        </svg>
        {text}
      </div>
    </div>
  );
}

/* ======================================================================
   Message row
   ====================================================================== */

function SignalRow({
  m,
  quote,
  shape,
  p,
  rtl,
  lang,
  s,
  status,
  live,
  sender,
  groupIncoming,
  avatar,
  authorName,
}: {
  m: Message;
  quote: QuoteSpec | null;
  shape: Shape;
  p: Palette;
  rtl: boolean;
  lang: Lang;
  s: Strings;
  status: DeliveryStatus;
  live: boolean;
  /** group: sender name at the top of an author's cluster */
  sender: SenderSpec | null;
  /** group incoming row: reserves the avatar column */
  groupIncoming: boolean;
  /** group: the avatar shown beside the last bubble of the cluster */
  avatar: Person | null;
  /** short display name of the author (deleted text) */
  authorName: string;
}) {
  const mine = m.sender === "me";
  const voice = m.type === "voice";
  // legacy ConversationItem (audio, quotes, link previews, documents, stickers, location)
  const legacy = voice || !!quote || !!m.link || m.type === "file" || m.type === "sticker" || m.type === "location";
  // CFv2 items: 6 / 1; legacy ConversationItem: 8 / 1.
  const edge = legacy ? 8 : 6;
  const top = isStarting(shape) ? edge : 1;
  const bottom = isEnding(shape) ? edge : 1;
  const corners = cornerStyle(shape, mine, rtl);
  const maxW = groupIncoming ? 360 - GROUP_BUBBLE_START - FAR : MAX_W;
  const rawTime = localDigits(m.time, lang);
  const time = m.edited && m.type !== "deleted" ? s.edited(rawTime) : rawTime;
  // Text-only and media items only show the footer on the last message of a cluster;
  // audio always forces it (ConversationItem.forceFooter), as does an edit.
  const footerVisible = voice || isEnding(shape) || !!m.edited;
  const nameEl = sender ? <SenderName sender={sender} legacy={legacy} /> : null;
  const quoteEl = quote ? <QuoteSlot quote={quote} mine={mine} p={p} shape={shape} /> : null;
  const bubbleBg = mine ? p.outBubble : p.inBubble;
  const textColor = mine ? p.outText : p.ink;
  const footColor = mine ? p.outFooter : p.sub;
  const footerExtra = mine && status === "sent" ? STATUS_RESERVED - 14 : 0;

  let content: ReactNode;
  if (voice) {
    content = (
      <VoiceBubble
        m={m}
        p={p}
        mine={mine}
        rtl={rtl}
        lang={lang}
        status={status}
        time={time}
        corners={corners}
        quote={quoteEl}
        sender={nameEl}
      />
    );
  } else if (m.type === "image" || m.type === "location") {
    const loc = m.location ?? { title: "" };
    const lines = [loc.title, loc.subtitle].filter((x): x is string => !!x && !!x.trim());
    content = (
      <ImageBubble
        m={m}
        p={p}
        mine={mine}
        rtl={rtl}
        status={status}
        time={time}
        corners={corners}
        footerVisible={footerVisible}
        quote={quoteEl}
        sender={nameEl}
        override={
          m.type === "location"
            ? { node: <GoogleMapArt />, w: 240, h: 180, caption: [...lines, mapsUrl(loc.title || m.id)].join("\n") }
            : undefined
        }
      />
    );
  } else if (m.type === "sticker") {
    // conversation_item_*_sticker: 175dp borderless image, plain footer below
    const emoji = m.text.trim() || "🙂";
    content = (
      <div className="flex flex-col" style={{ alignItems: "flex-start" }}>
        {nameEl}
        <div className="flex items-center justify-center" style={{ width: STICKER, height: STICKER, marginTop: sender ? 0 : 7 }}>
          {m.imageSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={m.imageSrc} alt="" draggable={false} className="block h-full w-full" style={{ objectFit: "contain" }} />
          ) : (
            <span style={{ fontSize: 128, lineHeight: `${STICKER}px` }}>{emoji}</span>
          )}
        </div>
        {footerVisible && (
          <div style={{ alignSelf: "flex-end", marginTop: 4 }}>
            <Footer time={time} mine={mine} status={status} color={p.sub} />
          </div>
        )}
      </div>
    );
  } else if (m.type === "file") {
    const f = m.file ?? { name: "Document" };
    const dot = f.name.lastIndexOf(".");
    const ext = dot > 0 ? f.name.slice(dot + 1).toLowerCase().slice(0, 4) : "";
    content = (
      <div className="flex flex-col" style={{ background: bubbleBg, maxWidth: maxW, ...corners }}>
        {nameEl}
        {quoteEl}
        {/* document_view_stub: 210dp, 12/7/12/7 margins */}
        <div className="flex items-center" style={{ width: 210, margin: `${sender && !quote ? 0 : 7}px 12px 7px` }}>
          <DocumentIcon ext={ext} />
          <div className="flex min-w-0 flex-1 flex-col" style={{ marginInlineStart: 2 }}>
            <div className="truncate" style={{ fontSize: 16, lineHeight: "22px", letterSpacing: "0.01em", color: textColor }}>
              <bdi>{f.name}</bdi>
            </div>
            {f.size && (
              <div style={{ fontSize: 12, lineHeight: "16px", letterSpacing: "0.033em", color: footColor }}>
                <bdi>{localDigits(f.size, lang)}</bdi>
              </div>
            )}
          </div>
        </div>
        {footerVisible && (
          <div className="flex" style={{ justifyContent: "flex-end", marginTop: -4 }}>
            <Footer time={time} mine={mine} status={status} color={footColor} />
          </div>
        )}
      </div>
    );
  } else if (m.type === "deleted") {
    // remote delete without wallpaper: background-coloured bubble, 1dp
    // OnSurfaceVariant outline, x-circle + "<name> deleted this message"
    content = (
      <div style={{ background: p.bg, border: `1px solid ${p.sub}`, boxSizing: "border-box", maxWidth: maxW, ...corners }}>
        {nameEl}
        <TextBody
          text={mine ? s.youDeleted : s.deletedBy(authorName)}
          color={p.sub}
          rtl={rtl}
          maxW={maxW - 2}
          jumbo={0}
          padTop={sender ? 0 : PAD_TOP - 1}
          padBottom={PAD_BOTTOM - 1}
          lead={<XCircle color={p.sub} />}
          footer={footerVisible ? <Footer time={time} mine={false} status={status} color={p.sub} /> : null}
          footerExtra={0}
        />
      </div>
    );
  } else {
    // a quoted / link-preview message is a legacy item: always a bubble, never jumbomoji
    const count = quote || m.link ? 0 : emojiOnlyCount(m.text);
    const footerColor = count ? p.sub : footColor;
    const link = m.link ?? null;
    // setLinkPreviewCorners: square under a quote / group sender, else the bubble's top corners
    const startR = (corners.borderTopLeftRadius as number) ?? BIG;
    const endR = (corners.borderTopRightRadius as number) ?? BIG;
    const ts = rtl ? endR : startR;
    const te = rtl ? startR : endR;
    content = (
      <div
        className={link ? "overflow-hidden" : undefined}
        style={{
          background: count ? "transparent" : bubbleBg,
          maxWidth: quote || link ? maxW : "100%",
          width: link ? maxW : undefined,
          display: quote || sender || link ? "flex" : undefined,
          flexDirection: quote || sender || link ? "column" : undefined,
          ...corners,
        }}
      >
        {nameEl}
        {quoteEl}
        {link && (
          <AndroidLinkPreview
            link={link}
            p={p}
            topStart={quote || sender ? 0 : ts}
            topEnd={quote || sender ? 0 : te}
          />
        )}
        <TextBody
          text={m.text}
          color={textColor}
          rtl={rtl}
          maxW={maxW}
          jumbo={count ? jumboSize(count) : 0}
          // message_bubble_top_image_margin (4dp) under a quote; 0 under a CFv2 sender name
          padTop={quote ? 4 : sender && !link ? 1 : PAD_TOP}
          footer={footerVisible ? <Footer time={time} mine={mine} status={status} color={footerColor} /> : null}
          footerExtra={footerExtra}
        />
      </div>
    );
  }

  const reaction = m.reaction?.trim();
  if (reaction) {
    content = (
      <div className="relative" style={{ maxWidth: "100%" }}>
        {content}
        <ReactionPill emoji={reaction} fromMe={!mine} mine={mine} p={p} />
      </div>
    );
  }

  return (
    <div
      data-mid={m.id}
      data-sender={m.sender}
      className={live ? "sig-android-enter" : undefined}
      style={{
        display: "flex",
        alignItems: "flex-end",
        justifyContent: mine ? "flex-end" : "flex-start",
        paddingInlineStart: mine ? FAR : groupIncoming ? GROUP_START : GUTTER,
        paddingInlineEnd: mine ? GUTTER : FAR,
        marginTop: top,
        // the reactions rail hangs 26 − 4 = 22dp below the bubble
        marginBottom: bottom + (reaction ? 22 : 0),
      }}
    >
      {groupIncoming && (
        // contact_photo: 28dp, bottom-aligned with the bubble, only on the cluster's last item
        <div className="shrink-0" style={{ width: GROUP_AVATAR, height: GROUP_AVATAR, marginInlineEnd: 8 }}>
          {avatar && <SignalAvatar person={avatar} size={GROUP_AVATAR} />}
        </div>
      )}
      {content}
    </div>
  );
}

/** Time + delivery status, bottom-aligned at the bubble's end edge [L]. */
function Footer({ time, mine, status, color }: { time: string; mine: boolean; status: DeliveryStatus; color: string }) {
  return (
    <div className="flex items-start" style={{ height: FOOTER_H, paddingInlineEnd: 12 }}>
      <span
        style={{
          fontSize: DATE_FS,
          lineHeight: `${DATE_LH}px`,
          letterSpacing: "0.03em",
          color,
          whiteSpace: "nowrap",
          marginInlineEnd: 4,
        }}
      >
        {time}
      </span>
      {mine && (
        <span className="flex" style={{ paddingTop: 2, paddingInlineStart: 2 }}>
          <StatusIcon status={status} color={color} />
        </span>
      )}
    </div>
  );
}

type FooterMode = "tucked" | "end" | "under";

/**
 * Message body with Signal's footer placement (V2FooterPositionDelegate):
 *  - single line that leaves room -> footer at the end of the line,
 *  - multi-line whose last line leaves room on the footer side -> tucked,
 *  - otherwise (or jumbomoji / mixed-direction text) -> underneath.
 * The body shrink-wraps to its longest line (emoji_shrinkWrap).
 */
function TextBody({
  text,
  color,
  rtl,
  maxW,
  jumbo,
  footer,
  footerExtra,
  padTop = PAD_TOP,
  padBottom = PAD_BOTTOM,
  lead,
}: {
  text: string;
  color: string;
  rtl: boolean;
  maxW: number;
  jumbo: number;
  footer: ReactNode | null;
  footerExtra: number;
  padTop?: number;
  padBottom?: number;
  /** inline glyph before the text (deleted-message x-circle) */
  lead?: ReactNode;
}) {
  const textRef = useRef<HTMLDivElement>(null);
  const footRef = useRef<HTMLDivElement>(null);
  const [layout, setLayout] = useState<{ mode: FooterMode; fw: number; shrink: number | null }>({
    mode: footer ? "under" : "tucked",
    fw: 0,
    shrink: null,
  });
  const hasFooter = footer !== null;

  useIsoLayoutEffect(() => {
    const measure = () => {
      const el = textRef.current;
      if (!el) return;
      const box = el.getBoundingClientRect();
      const scale = el.offsetWidth ? box.width / el.offsetWidth : 1;
      const range = document.createRange();
      range.selectNodeContents(el);
      const rects = Array.from(range.getClientRects()).filter((r) => r.width > 0.5);
      // group fragments into visual lines by their bottom edge
      const lines: { bottom: number; left: number; right: number }[] = [];
      for (const r of rects.sort((a, b) => a.bottom - b.bottom)) {
        const last = lines[lines.length - 1];
        if (last && Math.abs(last.bottom - r.bottom) < 6 * scale) {
          last.left = Math.min(last.left, r.left);
          last.right = Math.max(last.right, r.right);
          last.bottom = Math.max(last.bottom, r.bottom);
        } else lines.push({ bottom: r.bottom, left: r.left, right: r.right });
      }
      const longest = lines.reduce((w, l) => Math.max(w, (l.right - l.left) / scale), 0);
      const lastLine = lines[lines.length - 1];
      const lastW = lastLine ? (lastLine.right - lastLine.left) / scale : 0;
      const fw = footRef.current ? footRef.current.offsetWidth + footerExtra : 0;
      let mode: FooterMode = "tucked";
      if (hasFooter && lastLine) {
        const free = rtl ? (lastLine.left - box.left) / scale : (box.right - lastLine.right) / scale;
        if (jumbo || hasMixedDirection(text)) mode = "under";
        else if (lines.length > 1 && free > fw) mode = "tucked";
        else if (lines.length === 1 && maxW - lastW - 24 > fw + 8) mode = "end";
        else mode = "under";
      }
      const shrink = lines.length > 1 ? Math.ceil(longest + 0.5) : null;
      setLayout((prev) =>
        prev.mode === mode && Math.abs(prev.fw - fw) < 0.5 && prev.shrink === shrink ? prev : { mode, fw, shrink },
      );
    };
    measure();
    const fonts = (document as Document & { fonts?: { ready: Promise<unknown> } }).fonts;
    let alive = true;
    fonts?.ready.then(() => alive && measure());
    return () => {
      alive = false;
    };
  }, [text, hasFooter, footerExtra, maxW, jumbo, rtl, layout.mode, layout.shrink]);

  const { mode, fw, shrink } = layout;
  const fs = jumbo || BODY_FS;
  const lh = jumbo ? jumbo * 1.17 : BODY_LH;

  return (
    <div
      className="relative"
      style={{
        paddingTop: padTop,
        paddingBottom: padBottom + (mode === "under" ? FOOTER_H : 0),
        paddingInlineStart: 12,
        paddingInlineEnd: 12 + (mode === "end" ? Math.max(0, fw - 8) : 0),
        minWidth: mode === "under" && fw ? fw + 12 : undefined,
        maxWidth: maxW,
      }}
    >
      <div
        ref={textRef}
        dir="auto"
        style={{
          fontSize: fs,
          lineHeight: `${lh}px`,
          letterSpacing: jumbo ? 0 : "0.03125em",
          color,
          whiteSpace: "pre-wrap",
          overflowWrap: "anywhere",
          width: shrink ?? undefined,
          maxWidth: "100%",
          textAlign: "start",
        }}
      >
        {lead}
        {richText(text)}
      </div>
      {footer && (
        <div ref={footRef} className="absolute" style={{ bottom: 0, insetInlineEnd: 0 }}>
          {footer}
        </div>
      )}
    </div>
  );
}

/* ======================================================================
   Image [D] (V2ConversationItemThumbnail: max 240x320, 32dp bottom shade)
   ====================================================================== */

function ImageBubble({
  m,
  p,
  mine,
  rtl,
  status,
  time,
  corners,
  footerVisible,
  quote,
  sender,
  override,
}: {
  m: Message;
  p: Palette;
  mine: boolean;
  rtl: boolean;
  status: DeliveryStatus;
  time: string;
  corners: CSSProperties;
  footerVisible: boolean;
  quote: ReactNode;
  /** group sender name above the media */
  sender?: ReactNode;
  /** generated media (location map) with its own size and caption */
  override?: { node: ReactNode; w: number; h: number; caption: string };
}) {
  const [dims, setDims] = useState<{ w: number; h: number } | null>(null);
  const caption = override ? override.caption : m.text.trim();
  let w = 240;
  let h = 320;
  if (override) {
    w = override.w;
    h = override.h;
  } else if (dims && dims.w > 0 && dims.h > 0) {
    const k = Math.min(1, 240 / dims.w, 320 / dims.h);
    w = Math.round(dims.w * k);
    h = Math.round(dims.h * k);
  } else if (!m.imageSrc) {
    h = 240;
  }
  const overlayFooter = !caption && footerVisible;
  return (
    <div
      className="overflow-hidden"
      style={{ width: w, maxWidth: "100%", background: mine ? p.outBubble : p.inBubble, ...corners }}
    >
      {sender}
      {quote}
      {/* message_bubble_top_image_margin under a quote */}
      {quote && <div style={{ height: 4 }} />}
      <div className="relative" style={{ width: "100%", height: h }}>
        {override ? (
          override.node
        ) : m.imageSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={m.imageSrc}
            alt=""
            draggable={false}
            onLoad={(e) => {
              const img = e.currentTarget;
              setDims({ w: img.naturalWidth, h: img.naturalHeight });
            }}
            style={{ display: "block", width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center" style={{ background: p.imgEmpty }}>
            <Icon size={40}>
              <path d={P.photo1} fill={p.imgEmptyIcon} />
              <path d={P.photo2} fill={p.imgEmptyIcon} />
            </Icon>
          </div>
        )}
        {overlayFooter && (
          <>
            <span
              className="pointer-events-none absolute inset-x-0 bottom-0"
              style={{ height: 32, background: "linear-gradient(to bottom, rgba(0,0,0,0), rgba(0,0,0,0.533))" }}
            />
            <span className="absolute" style={{ bottom: 0, insetInlineEnd: 0 }}>
              <Footer time={time} mine={mine} status={status} color="#ffffff" />
            </span>
          </>
        )}
      </div>
      {caption && (
        <TextBody
          text={caption}
          color={mine ? p.outText : p.ink}
          rtl={rtl}
          maxW={w}
          jumbo={0}
          padTop={PAD_TOP}
          padBottom={6.25}
          footer={footerVisible ? <Footer time={time} mine={mine} status={status} color={mine ? p.outFooter : p.sub} /> : null}
          footerExtra={mine && status === "sent" ? STATUS_RESERVED - 14 : 0}
        />
      )}
    </div>
  );
}

/* ======================================================================
   Voice note [A]
   ====================================================================== */

/** Deterministic, mostly low waveform (Signal's bars are short with a few peaks). */
function waveform(seed: string, count: number): number[] {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  const out: number[] = [];
  for (let i = 0; i < count; i++) {
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    h ^= h >>> 16;
    const r = ((h >>> 0) % 1000) / 1000;
    const peak = r > 0.86 ? 0.55 + (r - 0.86) * 3 : 0.12 + r * 0.32;
    out.push(Math.min(1, peak));
  }
  return out;
}

function VoiceBubble({
  m,
  p,
  mine,
  rtl,
  lang,
  status,
  time,
  corners,
  quote,
  sender,
}: {
  m: Message;
  p: Palette;
  mine: boolean;
  rtl: boolean;
  lang: Lang;
  status: DeliveryStatus;
  time: string;
  corners: CSSProperties;
  quote: ReactNode;
  sender?: ReactNode;
}) {
  const bars = waveform(m.id, 52);
  const footColor = mine ? p.outVoiceFooter : p.sub;
  const duration = localDigits(m.voiceDuration || "0:07", lang);
  // footer_revealed_dot: 6dp dot until the voice note has been played (lottie_played at progress 0)
  const unplayed = !mine || status !== "read";
  const durationGroup = (
    <span className="flex items-center" style={{ gap: 5 }}>
      <span style={{ fontSize: DATE_FS, lineHeight: `${DATE_LH}px`, letterSpacing: "0.03em", color: footColor }}>{duration}</span>
      {unplayed && <span className="block rounded-full" style={{ width: 6, height: 6, background: footColor }} />}
    </span>
  );
  const dateGroup = (
    <span className="flex items-start">
      <span style={{ fontSize: DATE_FS, lineHeight: `${DATE_LH}px`, letterSpacing: "0.03em", color: footColor, marginInlineEnd: mine ? 4 : 0 }}>
        {time}
      </span>
      {mine && (
        <span className="flex" style={{ paddingTop: 2, paddingInlineStart: 2 }}>
          <StatusIcon status={status} color={footColor} />
        </span>
      )}
    </span>
  );
  return (
    <div style={{ width: AUDIO_W + 24, maxWidth: "100%", background: mine ? p.outBubble : p.inBubble, ...corners }}>
      {sender}
      {quote}
      <div className="flex items-center" style={{ padding: "12px 12px 0", height: 60 }}>
        <div className="flex shrink-0 items-center justify-center" style={{ width: 48, height: 48 }}>
          <div
            className="flex items-center justify-center rounded-full"
            style={{ width: 44, height: 44, background: mine ? p.outPlayBg : p.inPlayBg }}
          >
            {/* lottie_play_pause: play triangle, never mirrored */}
            <svg width="20" height="20" viewBox="0 0 20 20" style={{ display: "block" }}>
              <path
                d="M6.2 3.9v12.2c0 .8.86 1.28 1.53.86l9.6-6.1a1 1 0 0 0 0-1.72l-9.6-6.1C7.06 2.62 6.2 3.1 6.2 3.9z"
                fill={mine ? p.outPlayFg : p.inPlayFg}
              />
            </svg>
          </div>
        </div>
        {/* WaveFormSeekBarView: padding 8/12/8/8, drawn mirrored in RTL */}
        <div className="relative min-w-0 flex-1" style={{ height: 48, padding: "8px 8px 8px 12px", paddingInlineStart: 12, paddingInlineEnd: 8 }}>
          <div
            className="relative flex h-full items-center justify-between"
            style={{ transform: rtl ? "scaleX(-1)" : undefined }}
            dir="ltr"
          >
            {bars.map((v, i) => (
              <span
                key={i}
                className="block shrink-0"
                style={{
                  width: 2,
                  height: Math.max(2, v * 28),
                  borderRadius: 1,
                  background: mine ? p.waveOut : p.waveIn,
                }}
              />
            ))}
            <span
              className="absolute"
              style={{ left: -1, top: 2, width: 2, height: 28, borderRadius: 1, background: mine ? p.thumbOut : p.thumbIn }}
            />
          </div>
        </div>
      </div>
      {/* ConversationItemFooter: outgoing = duration at start, date at end; incoming is flipped */}
      <div
        className="flex items-center justify-between"
        style={{ height: DATE_LH, margin: "3.7px 12px 7.2px", opacity: mine ? 1 : 0.7 }}
      >
        {mine ? (
          <>
            <span style={{ paddingInlineStart: 8 }}>{durationGroup}</span>
            {dateGroup}
          </>
        ) : (
          <>
            {dateGroup}
            <span className="flex items-center" style={{ gap: 5 }}>
              {unplayed && <span className="block rounded-full" style={{ width: 6, height: 6, background: footColor }} />}
              <span style={{ fontSize: DATE_FS, lineHeight: `${DATE_LH}px`, letterSpacing: "0.03em", color: footColor }}>{duration}</span>
            </span>
          </>
        )}
      </div>
    </div>
  );
}
