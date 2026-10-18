import { createId } from "../data/defaults";
import { MEDIA_AVATARS, MEDIA_PHOTOS, mediaSrc, type MediaAsset } from "../data/media-library";
import type {
  CallEntry,
  ChatTheme,
  DeliveryStatus,
  Device,
  FileShare,
  LinkPreview,
  LocationShare,
  Message,
  MessageType,
  Person,
  Platform,
  PresenceStatus,
  Scenario,
} from "../types";
import { parseScenario } from "../validations/scenario";
import { naturalTiming } from "./smart-timing";

/**
 * "Create with AI": the studio gives the user a prompt to paste into any chat
 * model (ChatGPT, Claude, Gemini…). The model interviews the user about the ad,
 * then answers with one JSON document in the "scenora.v1" format below. The
 * user pastes that reply back and `parseAiReply` turns it into a Scenario.
 *
 * The AI format is deliberately friendlier than the internal one: no ids,
 * `from` can be a member name, `replyTo` is a message number, delays are in
 * seconds and optional (natural timing fills them), and common aliases are
 * accepted. Parsing is lenient (code fences, comments, trailing commas, smart
 * quotes, extra prose around the JSON) and reports what it had to fix.
 */

export const AI_FORMAT = "scenora.v1";

export type AiLength = "short" | "medium" | "long";

export interface AiPromptOptions {
  /** language the model should talk and write the chat in */
  lang: "ar" | "en";
  /** optional idea typed by the user in the studio */
  idea?: string;
  platform?: Platform | "auto";
  device?: Device | "auto";
  length?: AiLength;
  /** names already set in the studio (used as hints) */
  meName?: string;
}

const PLATFORM_IDS: Platform[] = [
  "whatsapp",
  "telegram",
  "instagram",
  "snapchat",
  "imessage",
  "messenger",
  "tiktok",
  "x",
  "signal",
  "discord",
  "viber",
];

/** Phone finishes per device (ids of DEVICE_FINISHES in devices/DeviceFrame). */
const DEVICE_COLORS: Record<Device, string[]> = {
  iphone: ["black-titanium", "white-titanium", "blue-titanium", "natural-titanium"],
  android: ["navy", "icyblue", "silver-shadow", "mint"],
};
const ANDROID_FONT_IDS = ["roboto", "cairo", "tajawal"];

/* Video (export) settings the AI may suggest — ids of the export dialog's prefs. */
const VIDEO_FORMATS = ["story", "portrait", "square", "landscape", "device"] as const;
const VIDEO_BACKGROUNDS = ["studio", "aurora", "brand", "sunset", "screen", "mist", "mint", "white", "black"] as const;
const ZOOM_IDS = ["off", "subtle", "medium", "strong"] as const;
const SAFE_ZONES = ["off", "tiktok", "reels", "shorts", "stories"] as const;
const SPEED_IDS = [0.75, 1, 1.25, 1.5, 2] as const;
const HEX_COLOR = /^#[0-9a-f]{6}$/i;

const assetList = (list: MediaAsset[]) => list.map((a) => `"${a.id}" (${a.label.en})`).join(", ");

const LENGTH_HINT: Record<AiLength, string> = {
  short: "6–8 messages (about 15–20 seconds of video)",
  medium: "9–14 messages (about 25–35 seconds of video)",
  long: "15–22 messages (about 40–60 seconds of video)",
};

/** The prompt the user copies into an AI model. */
export function buildAiPrompt(o: AiPromptOptions): string {
  const ar = o.lang === "ar";
  const platform = o.platform && o.platform !== "auto" ? o.platform : null;
  const device = o.device && o.device !== "auto" ? o.device : null;
  const length = LENGTH_HINT[o.length ?? "medium"];
  const idea = o.idea?.trim();

  return `You are a creative director who writes short, realistic chat-conversation scenarios for marketing videos made with **Scenora** (a studio that renders pixel-accurate WhatsApp / Telegram / Instagram / Snapchat / iMessage / Messenger / TikTok / X / Signal / Discord / Viber chats on an iPhone or Samsung and exports them as video ads).

## How we work together
1. ${ar ? "Talk to me in Arabic." : "Talk to me in English."} First ask me a few short questions (max 6, in one message) to understand: the product/service, the audience, the goal of the ad (sales, booking, trust, launch…), the tone, the app to show it in, whether it's a 1:1 chat or a group, and where the video will be posted (TikTok, Reels, Shorts, Stories, feed, YouTube…).${idea ? " Use my idea below as the starting point and only ask what's missing." : ""}
2. Then propose a short outline of the conversation (who says what, the hook, the turning point, the call to action) plus the video packaging (format, opening caption, end card). Let me adjust it.
3. When I say **"generate"** (or «أنشئ» / «جهّز الملف»), reply with **only one fenced \`\`\`json code block** containing the final scenario in the exact format below — no text before or after it. If I ask for changes later, send the full updated JSON again.

## Writing rules
- Make it feel 100% real for the chosen app: natural message lengths, realistic pacing, the way people actually text there${ar ? ", Gulf/Saudi everyday Arabic by default (or the dialect I ask for), not formal MSA" : ""}. Emojis only where people would use them.
- A clear hook in the first 1–2 messages, a believable objection or question, and a satisfying ending with the call to action.
- "me" is the phone owner (usually the brand/store/business account)${o.meName ? ` — currently named "${o.meName}"` : ""}; "them" is the customer/friend.
- Length: ${length}.
- Use extra features only when they help the story: reactions, replies to an earlier message, voice notes, photos, stickers, a location (or live location), a PDF invoice/brochure, a missed or connected voice/video call, an edited or deleted message, a link preview, a group chat.
- Times must increase realistically (HH:MM) and the status-bar clock should match the first message. No real phone numbers, emails or personal data.
- Pick avatars and photos from the built-in library below (by id) so the video looks finished without uploads.
- Package it for where it will be posted: TikTok/Reels/Shorts/Stories → "story" (9:16) with the matching "safeZone"; feed → "portrait" or "square"; YouTube → "landscape". Write a punchy opening caption (max ~8 words) and an end card with a headline and a call to action.

## JSON format (${AI_FORMAT})
\`\`\`json
{
  "format": "${AI_FORMAT}",
  "title": "short title for the scenario",
  "platform": "${platform ?? "whatsapp"}",
  "device": "${device ?? "iphone"}",
  "theme": "light",
  "deviceColor": null,
  "me": { "name": "Brand or owner name", "avatar": "av-bag" },
  "them": { "name": "Customer name", "avatar": "av-peach" },
  "group": null,
  "presence": "online",
  "lastSeenText": "",
  "statusBar": { "time": "10:41", "battery": 82, "wifi": true, "cellular": true, "batteryPct": false },
  "composeTyping": true,
  "keyboard": true,
  "messages": [
    { "from": "them", "text": "Hi! Is the weekend offer still on?", "time": "10:41" },
    { "from": "me", "text": "Yes 🎉 until Friday — 30% off everything", "time": "10:41", "status": "read" },
    { "from": "them", "type": "voice", "voiceDuration": "0:09", "time": "10:42" },
    { "from": "me", "type": "image", "text": "This one is the bestseller", "photo": "ph-sneaker", "time": "10:43", "reaction": "😍" },
    { "from": "them", "text": "Perfect, I'll take it", "time": "10:44", "replyTo": 4, "reaction": "👍" }
  ],
  "video": {
    "format": "story",
    "safeZone": "tiktok",
    "background": "aurora",
    "caption": { "text": "She almost missed the sale 😱", "position": "top" },
    "endCard": { "headline": "30% off ends Friday", "cta": "Shop now" },
    "notification": true,
    "zoom": "medium",
    "speed": 1,
    "music": true
  }
}
\`\`\`

### Field reference
- **platform**: ${PLATFORM_IDS.map((p) => `"${p}"`).join(" | ")}${platform ? ` (use "${platform}")` : " (pick the best app for the audience)"}. "imessage" on "android" shows Samsung Messages.
- **device**: "iphone" | "android"${device ? ` (use "${device}")` : ""}. **theme**: "light" | "dark".
- **deviceColor** (optional): iphone ${DEVICE_COLORS.iphone.map((c) => `"${c}"`).join(" | ")}; android ${DEVICE_COLORS.android.map((c) => `"${c}"`).join(" | ")}. **androidFont** (android only): ${ANDROID_FONT_IDS.map((f) => `"${f}"`).join(" | ")}.
- **presence**: "online" | "typing" | "lastseen" (with **lastSeenText**, e.g. "last seen today at 9:30").
- **statusBar**: \`time\` "H:MM", \`battery\` 1–100, \`wifi\` / \`cellular\` / \`batteryPct\` (show the % number) true/false.
- **composeTyping**: my messages are typed into the input box before they're sent (default true). **keyboard**: show the phone keyboard while I type (default true; needs composeTyping).
- **avatar** (on me, them, group and each member): a library id — ${assetList(MEDIA_AVATARS)} — or null for the app's default.
- **group** (optional, for group chats): \`{ "name": "Family 🏡", "avatar": "ph-gift", "members": [{ "name": "Sara", "avatar": "av-peach" }, { "name": "Omar", "avatar": "av-ocean" }] }\` — then omit "them" and set each other person's message \`"from"\` to their member name.
- **messages[]** — each message:
  - **from**: "me", "them", or a group member's name.
  - **type** (default "text"): "text" | "voice" | "image" | "sticker" | "location" | "file" | "call" | "deleted".
  - **text**: the message (for "image" it's the optional caption; for "sticker" 1–3 emoji).
  - **time**: "HH:MM". **status** (my messages): "sent" | "delivered" | "read".
  - **reaction**: one emoji reacting to this message (on my message it's their reaction; on theirs it's mine).
  - **replyTo**: number (1-based) of an earlier message this one quotes.
  - **edited**: true to show "Edited".
  - **voiceDuration**: "0:14" (for "voice").
  - **photo** (for "image", and optional for "sticker" instead of emoji): a library id — ${assetList(MEDIA_PHOTOS)}. If none fits, give **imageHint** (what the photo shows) and I'll upload my own.
  - **link**: \`{ "url": "https://…", "title": "…", "description": "…", "siteName": "…", "image": "ph-…" }\` for a text message containing a link (the url must appear in the text).
  - **location**: \`{ "title": "Place name", "subtitle": "Street, City", "live": false }\` (for "location").
  - **file**: \`{ "name": "Invoice-1042.pdf", "size": "245 KB", "pages": "2 pages" }\` (for "file").
  - **call**: \`{ "video": false, "missed": true, "duration": "4:12" }\` (for "call").
  - **delay** / **typing** (optional, seconds): pause before the message and how long "typing…" shows. Omit them to let Scenora time the chat naturally.
- **video** (export settings, all optional):
  - **format**: ${VIDEO_FORMATS.map((f) => `"${f}"`).join(" | ")} (9:16, 4:5, 1:1, 16:9, or just the phone). **safeZone**: ${SAFE_ZONES.map((f) => `"${f}"`).join(" | ")} (keeps the chat clear of that app's buttons; 9:16 only).
  - **background**: ${VIDEO_BACKGROUNDS.map((f) => `"${f}"`).join(" | ")}, or **backgroundColor** "#RRGGBB".
  - **caption**: \`{ "text": "…", "position": "top" | "bottom" }\` — a fixed headline over the video (or null).
  - **endCard**: \`{ "headline": "…", "cta": "…" }\` — the closing card with the call to action (or null).
  - **notification**: true opens the video with the incoming-message notification. **zoom**: ${ZOOM_IDS.map((f) => `"${f}"`).join(" | ")} (camera follows each new message). **speed**: ${SPEED_IDS.join(" | ")}. **music**: true/false.
${idea ? `\n## My idea\n${idea}\n` : ""}
Start now with your questions.`;
}

/* ------------------------------------------------------------------ */
/* Lenient JSON extraction                                             */
/* ------------------------------------------------------------------ */

/** Remove // and /* *\/ comments and trailing commas outside strings. */
function stripJsonNoise(src: string): string {
  let out = "";
  let inStr = false;
  let esc = false;
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    const n = src[i + 1];
    if (inStr) {
      out += c;
      if (esc) esc = false;
      else if (c === "\\") esc = true;
      else if (c === '"') inStr = false;
      continue;
    }
    if (c === '"') {
      inStr = true;
      out += c;
      continue;
    }
    if (c === "/" && n === "/") {
      while (i < src.length && src[i] !== "\n") i++;
      out += "\n";
      continue;
    }
    if (c === "/" && n === "*") {
      i += 2;
      while (i < src.length && !(src[i] === "*" && src[i + 1] === "/")) i++;
      i++;
      continue;
    }
    if (c === ",") {
      // trailing comma: next non-space char closes an object/array
      let j = i + 1;
      while (j < src.length && /\s/.test(src[j])) j++;
      if (src[j] === "}" || src[j] === "]") continue;
    }
    out += c;
  }
  return out;
}

/** Candidate JSON texts in the reply, best first (last ```json fence wins). */
function jsonCandidates(raw: string): string[] {
  const out: string[] = [];
  const fences = [...raw.matchAll(/```(?:json|JSON|jsonc)?\s*\n?([\s\S]*?)```/g)].map((m) => m[1]);
  for (let i = fences.length - 1; i >= 0; i--) if (fences[i].includes("{")) out.push(fences[i]);
  const first = raw.indexOf("{");
  const last = raw.lastIndexOf("}");
  if (first !== -1 && last > first) out.push(raw.slice(first, last + 1));
  return out;
}

function tryParse(text: string): unknown | undefined {
  const attempts = [
    text,
    stripJsonNoise(text),
    // smart quotes some chat UIs introduce when copying
    stripJsonNoise(text.replace(/[“”„‟″]/g, '"').replace(/[‘’]/g, "'")),
  ];
  for (const a of attempts) {
    try {
      return JSON.parse(a.trim().replace(/^﻿/, ""));
    } catch {
      /* try the next cleanup */
    }
  }
  return undefined;
}

/* ------------------------------------------------------------------ */
/* Normalisation                                                       */
/* ------------------------------------------------------------------ */

export type AiWarning =
  | { code: "repaired" }
  | { code: "unknownPlatform"; value: string }
  | { code: "unknownType"; index: number; value: string }
  | { code: "addedMember"; name: string }
  | { code: "badReply"; index: number }
  | { code: "imagesPlaceholder"; count: number }
  | { code: "dropped"; index: number };

/**
 * Export settings suggested by the AI, as a patch of the export dialog's
 * prefs (`scenora.export.prefs`); only the keys the reply set are present.
 */
export interface AiVideoPrefs {
  preset?: (typeof VIDEO_FORMATS)[number];
  safeZone?: (typeof SAFE_ZONES)[number];
  bg?: string;
  custom?: string;
  caption?: boolean;
  captionText?: string;
  captionPos?: "top" | "bottom";
  endCard?: boolean;
  endHeadline?: string;
  endCta?: string;
  notif?: boolean;
  zoom?: boolean;
  zoomLevel?: "subtle" | "medium" | "strong";
  speed?: (typeof SPEED_IDS)[number];
  music?: boolean;
}

export type AiParseResult =
  | { ok: true; scenario: Scenario; warnings: AiWarning[]; title: string | null; video: AiVideoPrefs | null }
  | { ok: false; error: "empty" | "noJson" | "noMessages" | "invalid" };

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === "object" && v !== null && !Array.isArray(v);
const str = (v: unknown): string | undefined => (typeof v === "string" ? v : typeof v === "number" ? String(v) : undefined);
const lower = (v: unknown) => (str(v) ?? "").trim().toLowerCase();

function normPlatform(v: unknown): { platform?: Platform; android?: boolean; unknown?: string } {
  const s = lower(v).replace(/[\s_-]+/g, "");
  if (!s) return {};
  if ((PLATFORM_IDS as string[]).includes(s)) return { platform: s as Platform };
  const alias: Record<string, Platform> = {
    wa: "whatsapp",
    whatsappbusiness: "whatsapp",
    tg: "telegram",
    ig: "instagram",
    insta: "instagram",
    instagramdm: "instagram",
    snap: "snapchat",
    applemessages: "imessage",
    messages: "imessage",
    imsg: "imessage",
    sms: "imessage",
    fbmessenger: "messenger",
    facebookmessenger: "messenger",
    facebook: "messenger",
    tiktokdm: "tiktok",
    twitter: "x",
    xchat: "x",
    twitterdm: "x",
  };
  if (alias[s]) return { platform: alias[s] };
  if (s === "samsungmessages" || s === "googlemessages") return { platform: "imessage", android: true };
  return { unknown: str(v) };
}

function normDevice(v: unknown): Device | undefined {
  const s = lower(v);
  if (!s) return undefined;
  if (/iphone|ios|apple/.test(s)) return "iphone";
  if (/android|samsung|galaxy|pixel/.test(s)) return "android";
  return undefined;
}

function normType(v: unknown): MessageType | null {
  const s = lower(v).replace(/[\s_-]+/g, "");
  if (!s || s === "text" || s === "message") return "text";
  const map: Record<string, MessageType> = {
    voice: "voice",
    voicenote: "voice",
    audio: "voice",
    voicemessage: "voice",
    image: "image",
    photo: "image",
    picture: "image",
    img: "image",
    video: "image",
    sticker: "sticker",
    emoji: "sticker",
    location: "location",
    map: "location",
    livelocation: "location",
    file: "file",
    document: "file",
    doc: "file",
    pdf: "file",
    attachment: "file",
    call: "call",
    missedcall: "call",
    voicecall: "call",
    videocall: "call",
    deleted: "deleted",
    unsent: "deleted",
  };
  if (map[s]) return map[s];
  // free-form descriptions like "missed video call", "pdf document", "voice note 0:12"
  if (s.includes("call")) return "call";
  if (s.includes("voice") || s.includes("audio")) return "voice";
  if (s.includes("location") || s.includes("map")) return "location";
  if (s.includes("pdf") || s.includes("file") || s.includes("document")) return "file";
  if (s.includes("photo") || s.includes("image") || s.includes("picture")) return "image";
  if (s.includes("sticker")) return "sticker";
  if (s.includes("delete") || s.includes("unsent")) return "deleted";
  return null;
}

const STATUS: DeliveryStatus[] = ["sent", "delivered", "read"];
const PRESENCE: PresenceStatus[] = ["online", "typing", "lastseen"];

/** A built-in library asset by id ("av-peach", "ph-perfume"); never a remote URL. */
function libraryImage(v: unknown, kind: "avatar" | "photo" | "any" = "any"): string | null {
  const id = lower(v);
  if (!id) return null;
  if (kind === "avatar" && !id.startsWith("av-")) return null;
  if (kind === "photo" && !id.startsWith("ph-")) return null;
  return mediaSrc(id);
}

/** Best library photo for a free-text hint ("white sneakers", «عطر»…). */
function photoForHint(hint: string): string | null {
  const h = hint.toLowerCase();
  if (!h.trim()) return null;
  const extra: Record<string, string[]> = {
    "ph-sneaker": ["shoe", "sneaker", "trainer", "حذاء", "جزمة", "كوتش"],
    "ph-perfume": ["perfume", "fragrance", "oud", "scent", "cologne", "عطر", "عود", "بخور"],
    "ph-burger": ["burger", "food", "meal", "sandwich", "برجر", "وجبة", "أكل", "اكل"],
    "ph-apartment": ["apartment", "flat", "house", "home", "villa", "room", "شقة", "بيت", "فيلا", "غرفة"],
    "ph-car": ["car", "vehicle", "suv", "سيارة", "سياره"],
    "ph-phone": ["phone", "mobile", "smartphone", "جوال", "هاتف", "موبايل"],
    "ph-dress": ["dress", "abaya", "fashion", "outfit", "clothes", "فستان", "عباية", "عبايه", "ملابس"],
    "ph-coffee": ["coffee", "latte", "cafe", "café", "قهوة", "قهوه", "كوفي"],
    "ph-gift": ["gift", "present", "box", "هدية", "هديه"],
  };
  for (const a of MEDIA_PHOTOS) {
    const words = [...(extra[a.id] ?? []), a.label.en.toLowerCase(), a.label.ar];
    if (words.some((w) => h.includes(w))) return a.src;
  }
  return null;
}

function person(v: unknown, fallback: Person): Person {
  if (typeof v === "string") return { name: v, avatar: null };
  if (isObj(v)) return { name: str(v.name) ?? fallback.name, avatar: libraryImage(v.avatar, "avatar") };
  return fallback;
}

const oneOfList = <T extends string | number>(v: unknown, list: readonly T[]): T | undefined =>
  list.find((x) => (typeof x === "number" ? Number(v) === x : lower(v) === x));

function videoOf(v: unknown): AiVideoPrefs | null {
  if (!isObj(v)) return null;
  const p: AiVideoPrefs = {};
  const format = lower(v.format ?? v.aspect ?? v.preset).replace(/\s+/g, "");
  const formatAlias: Record<string, AiVideoPrefs["preset"]> = {
    "9:16": "story",
    vertical: "story",
    reels: "story",
    tiktok: "story",
    "4:5": "portrait",
    "1:1": "square",
    "16:9": "landscape",
    horizontal: "landscape",
    youtube: "landscape",
    phone: "device",
  };
  p.preset = oneOfList(format, VIDEO_FORMATS) ?? formatAlias[format];
  p.safeZone = oneOfList(v.safeZone, SAFE_ZONES);
  const bg = oneOfList(v.background, VIDEO_BACKGROUNDS);
  const custom = str(v.backgroundColor) ?? (HEX_COLOR.test(str(v.background) ?? "") ? str(v.background) : undefined);
  if (custom && HEX_COLOR.test(custom)) {
    p.bg = "custom";
    p.custom = custom;
  } else if (bg) p.bg = bg;
  if (v.caption === null || v.caption === false) p.caption = false;
  else if (typeof v.caption === "string" || isObj(v.caption)) {
    const text = (typeof v.caption === "string" ? v.caption : str(v.caption.text)) ?? "";
    if (text.trim()) {
      p.caption = true;
      p.captionText = text.trim().slice(0, 140);
      const pos = isObj(v.caption) ? lower(v.caption.position) : "";
      if (pos === "top" || pos === "bottom") p.captionPos = pos;
    }
  }
  if (v.endCard === null || v.endCard === false) p.endCard = false;
  else if (isObj(v.endCard)) {
    const headline = str(v.endCard.headline)?.trim() ?? "";
    const cta = str(v.endCard.cta)?.trim() ?? "";
    if (headline || cta) {
      p.endCard = true;
      p.endHeadline = headline.slice(0, 140);
      p.endCta = cta.slice(0, 140);
    }
  }
  if (typeof v.notification === "boolean") p.notif = v.notification;
  const zoom = v.zoom === false ? "off" : v.zoom === true ? "medium" : oneOfList(v.zoom, ZOOM_IDS);
  if (zoom === "off") p.zoom = false;
  else if (zoom) {
    p.zoom = true;
    p.zoomLevel = zoom;
  }
  p.speed = oneOfList(v.speed, SPEED_IDS);
  if (typeof v.music === "boolean") p.music = v.music;
  for (const k of Object.keys(p) as (keyof AiVideoPrefs)[]) if (p[k] === undefined) delete p[k];
  return Object.keys(p).length ? p : null;
}

function seconds(v: unknown): number | undefined {
  const n = typeof v === "number" ? v : typeof v === "string" ? parseFloat(v) : NaN;
  if (!Number.isFinite(n) || n < 0) return undefined;
  // values that look like milliseconds stay as ms
  return n > 60 ? Math.round(n) : Math.round(n * 1000);
}

function linkOf(v: unknown, text: string): LinkPreview | null {
  if (!isObj(v)) return null;
  const url = str(v.url) ?? text.match(/https?:\/\/\S+/)?.[0];
  if (!url) return null;
  let site = str(v.siteName);
  if (!site) {
    try {
      site = new URL(url).hostname.replace(/^www\./, "");
    } catch {
      site = undefined;
    }
  }
  return { url, title: str(v.title) ?? site ?? url, description: str(v.description), siteName: site, image: null };
}

function locationOf(v: unknown): LocationShare | null {
  if (typeof v === "string") return { title: v };
  if (!isObj(v)) return null;
  return { title: str(v.title) ?? str(v.name) ?? "", subtitle: str(v.subtitle) ?? str(v.address), live: v.live === true };
}

function fileOf(v: unknown): FileShare | null {
  if (typeof v === "string") return { name: v };
  if (!isObj(v)) return null;
  return { name: str(v.name) ?? "Document.pdf", size: str(v.size), pages: str(v.pages) };
}

function callOf(v: unknown, typeHint: string): CallEntry {
  const o = isObj(v) ? v : {};
  return {
    video: o.video === true || /video/.test(typeHint),
    missed: o.missed === true || (o.missed === undefined && /missed/.test(typeHint)),
    duration: str(o.duration),
  };
}

/**
 * Parse an AI reply (or a Scenora export) into a Scenario.
 * `base` supplies everything the reply doesn't set (phone colour, font, …).
 */
export function parseAiReply(raw: string, base: Scenario): AiParseResult {
  if (!raw.trim()) return { ok: false, error: "empty" };

  let data: unknown;
  let repaired = false;
  for (const c of jsonCandidates(raw)) {
    const direct = (() => {
      try {
        return JSON.parse(c.trim());
      } catch {
        return undefined;
      }
    })();
    data = direct ?? tryParse(c);
    if (data !== undefined) {
      repaired = direct === undefined;
      break;
    }
  }
  if (!isObj(data)) return { ok: false, error: "noJson" };
  // some models wrap it: { "scenario": { … } }
  if (!Array.isArray(data.messages) && isObj(data.scenario)) data = data.scenario as Obj;
  const d = data as Obj;
  if (!Array.isArray(d.messages) || d.messages.length === 0) return { ok: false, error: "noMessages" };

  const warnings: AiWarning[] = [];
  if (repaired) warnings.push({ code: "repaired" });

  // a Scenora export (internal format) — validate as is
  const first = d.messages[0];
  if (isObj(first) && typeof first.id === "string" && typeof first.sender === "string") {
    try {
      return { ok: true, scenario: parseScenario({ ...base, ...d }), warnings, title: null, video: null };
    } catch {
      return { ok: false, error: "invalid" };
    }
  }

  const plat = normPlatform(d.platform);
  if (plat.unknown) warnings.push({ code: "unknownPlatform", value: plat.unknown });
  const device = plat.android ? "android" : (normDevice(d.device) ?? base.device);
  const theme: ChatTheme = lower(d.theme) === "dark" ? "dark" : lower(d.theme) === "light" ? "light" : base.theme;

  const me = person(d.me, base.me);
  let them = person(d.them, base.them);

  // group
  let group: Scenario["group"] = null;
  if (isObj(d.group) && Array.isArray(d.group.members) && d.group.members.length > 0) {
    group = {
      name: str(d.group.name) ?? "Group",
      avatar: libraryImage(d.group.avatar),
      members: d.group.members.map((m) => person(m, { name: "Member", avatar: null })).filter((m) => m.name.trim()),
    };
    if (group.members.length === 0) group = null;
    else them = group.members[0];
  }

  const meNames = new Set(["me", "you", "i", "أنا", "انا", me.name.trim().toLowerCase()]);
  const themNames = new Set(["them", "they", "other", "customer", them.name.trim().toLowerCase()]);

  const messages: Message[] = [];
  const idByNumber = new Map<number, string>();
  let images = 0;
  // messages without a time inherit the previous one
  let lastTime = "10:41";

  (d.messages as unknown[]).forEach((rawMsg, idx) => {
    if (!isObj(rawMsg)) {
      warnings.push({ code: "dropped", index: idx + 1 });
      return;
    }
    const typeHint = lower(rawMsg.type);
    let type = normType(rawMsg.type);
    if (type === null) {
      warnings.push({ code: "unknownType", index: idx + 1, value: str(rawMsg.type) ?? "" });
      type = "text";
    }
    const text = str(rawMsg.text) ?? str(rawMsg.message) ?? str(rawMsg.content) ?? "";

    // sender
    const fromRaw = str(rawMsg.from) ?? str(rawMsg.sender) ?? str(rawMsg.author) ?? "them";
    const from = fromRaw.trim().toLowerCase();
    let sender: Message["sender"] = meNames.has(from) ? "me" : "them";
    let authorIndex: number | undefined;
    if (sender === "them" && group) {
      let i = group.members.findIndex((m) => m.name.trim().toLowerCase() === from);
      if (i === -1 && !themNames.has(from) && fromRaw.trim()) {
        group.members.push({ name: fromRaw.trim(), avatar: null });
        i = group.members.length - 1;
        warnings.push({ code: "addedMember", name: fromRaw.trim() });
      }
      authorIndex = Math.max(0, i);
    } else if (sender === "them" && !themNames.has(from) && from === me.name.trim().toLowerCase()) {
      sender = "me";
    }

    const time = str(rawMsg.time)?.trim() || lastTime;
    lastTime = time;
    const status = (STATUS as string[]).includes(lower(rawMsg.status)) ? (lower(rawMsg.status) as DeliveryStatus) : "read";
    // photos: a library id, else the best match for the hint/caption
    let imageSrc: string | null = null;
    if (type === "image" || type === "sticker") imageSrc = libraryImage(rawMsg.photo ?? rawMsg.image, "photo");
    if (type === "image" && !imageSrc) imageSrc = photoForHint(`${str(rawMsg.imageHint) ?? ""} ${text}`);
    if (type === "image" && !imageSrc) images++;

    const m: Message = {
      id: createId(),
      sender,
      type,
      text: type === "voice" || type === "call" || type === "location" || type === "file" || type === "deleted" ? "" : text,
      time,
      delayMs: 0,
      typingMs: 0,
      status,
      voiceDuration: type === "voice" ? (str(rawMsg.voiceDuration) ?? str(rawMsg.duration) ?? "0:12") : undefined,
      imageSrc,
      reaction: str(rawMsg.reaction)?.slice(0, 16) || null,
      edited: rawMsg.edited === true || undefined,
      link: type === "text" ? linkOf(rawMsg.link, text) : null,
      location: type === "location" ? locationOf(rawMsg.location ?? text) : null,
      file: type === "file" ? fileOf(rawMsg.file ?? text) : null,
      call: type === "call" ? callOf(rawMsg.call, typeHint) : null,
      authorIndex,
    };
    // sticker without emoji text or image: keep a friendly default
    if (type === "sticker" && !m.text.trim() && !imageSrc) m.text = "🎉";
    if (m.link && isObj(rawMsg.link)) m.link.image = libraryImage(rawMsg.link.image, "photo");

    // timing: seconds from the AI, otherwise natural
    const natural = naturalTiming(m, messages[messages.length - 1]);
    const delay = seconds(rawMsg.delay ?? rawMsg.delayMs);
    const typing = seconds(rawMsg.typing ?? rawMsg.typingMs);
    m.delayMs = delay ?? natural.delayMs;
    m.typingMs = sender === "them" ? (typing ?? natural.typingMs) : 0;

    // replyTo: 1-based number of an earlier message (or its text)
    const rt = rawMsg.replyTo ?? rawMsg.reply_to ?? rawMsg.replyToIndex;
    if (rt !== undefined && rt !== null) {
      const n = typeof rt === "number" ? rt : parseInt(String(rt), 10);
      const target = Number.isFinite(n) ? idByNumber.get(n) : undefined;
      if (target) m.replyToId = target;
      else warnings.push({ code: "badReply", index: idx + 1 });
    }

    idByNumber.set(idx + 1, m.id);
    messages.push(m);
  });

  if (messages.length === 0) return { ok: false, error: "noMessages" };
  if (images > 0) warnings.push({ code: "imagesPlaceholder", count: images });

  const sb: Obj = isObj(d.statusBar) ? d.statusBar : {};
  const bool = (v: unknown, def: boolean | undefined) => (typeof v === "boolean" ? v : def);
  const deviceColor = DEVICE_COLORS[device].includes(lower(d.deviceColor)) ? lower(d.deviceColor) : base.device === device ? base.deviceColor : undefined;
  const candidate: Scenario = {
    ...base,
    platform: plat.platform ?? base.platform,
    device,
    theme,
    me,
    them,
    group,
    presence: (PRESENCE as string[]).includes(lower(d.presence)) ? (lower(d.presence) as PresenceStatus) : base.presence,
    lastSeenText: str(d.lastSeenText) ?? base.lastSeenText,
    statusBar: {
      ...base.statusBar,
      time: str(sb.time) ?? base.statusBar.time,
      battery: typeof sb.battery === "number" ? Math.min(100, Math.max(1, Math.round(sb.battery))) : base.statusBar.battery,
      wifi: bool(sb.wifi, base.statusBar.wifi) ?? true,
      cellular: bool(sb.cellular, base.statusBar.cellular) ?? true,
      batteryPct: bool(sb.batteryPct, base.statusBar.batteryPct) ?? false,
    },
    deviceColor,
    androidFont: ANDROID_FONT_IDS.includes(lower(d.androidFont)) ? lower(d.androidFont) : base.androidFont,
    composeTyping: bool(d.composeTyping, base.composeTyping),
    keyboard: bool(d.keyboard, base.keyboard),
    messages,
  };

  try {
    return { ok: true, scenario: parseScenario(candidate), warnings, title: str(d.title) ?? null, video: videoOf(d.video ?? d.export) };
  } catch {
    return { ok: false, error: "invalid" };
  }
}
