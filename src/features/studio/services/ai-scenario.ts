import { createId } from "../data/defaults";
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
1. ${ar ? "Talk to me in Arabic." : "Talk to me in English."} First ask me a few short questions (max 5, in one message) to understand: the product/service, the audience, the goal of the ad (sales, booking, trust, launch…), the tone, the app to show it in, and whether it's a 1:1 chat or a group.${idea ? " Use my idea below as the starting point and only ask what's missing." : ""}
2. Then propose a short outline of the conversation (who says what, the hook, the turning point, the call to action). Let me adjust it.
3. When I say **"generate"** (or «أنشئ» / «جهّز الملف»), reply with **only one fenced \`\`\`json code block** containing the final scenario in the exact format below — no text before or after it. If I ask for changes later, send the full updated JSON again.

## Writing rules
- Make it feel 100% real for the chosen app: natural message lengths, realistic pacing, the way people actually text there${ar ? ", Gulf/Saudi everyday Arabic by default (or the dialect I ask for), not formal MSA" : ""}. Emojis only where people would use them.
- A clear hook in the first 1–2 messages, a believable objection or question, and a satisfying ending with the call to action.
- "me" is the phone owner (usually the brand/store/business account)${o.meName ? ` — currently named "${o.meName}"` : ""}; "them" is the customer/friend.
- Length: ${length}.
- Use extra features only when they help the story: reactions, replies to an earlier message, voice notes, photos, a location, a PDF invoice, a missed call, an edited or deleted message, a link preview, a group chat.
- Times must increase realistically (HH:MM). No real phone numbers, emails or personal data.

## JSON format (${AI_FORMAT})
\`\`\`json
{
  "format": "${AI_FORMAT}",
  "title": "short title for the scenario",
  "platform": "${platform ?? "whatsapp"}",
  "device": "${device ?? "iphone"}",
  "theme": "light",
  "me": { "name": "Brand or owner name" },
  "them": { "name": "Customer name" },
  "group": null,
  "presence": "online",
  "lastSeenText": "",
  "statusBar": { "time": "9:41", "battery": 82 },
  "messages": [
    { "from": "them", "text": "Hi! Is the weekend offer still on?", "time": "10:41" },
    { "from": "me", "text": "Yes 🎉 until Friday — 30% off everything", "time": "10:41", "status": "read" },
    { "from": "them", "type": "voice", "voiceDuration": "0:09", "time": "10:42" },
    { "from": "me", "type": "image", "text": "This one is the bestseller", "imageHint": "white sneakers on a pastel background", "time": "10:43", "reaction": "😍" },
    { "from": "them", "text": "Perfect, I'll take it", "time": "10:44", "replyTo": 4, "reaction": "👍" }
  ]
}
\`\`\`

### Field reference
- **platform**: ${PLATFORM_IDS.map((p) => `"${p}"`).join(" | ")}${platform ? ` (use "${platform}")` : " (pick the best app for the audience)"}. "imessage" on "android" shows Samsung Messages.
- **device**: "iphone" | "android"${device ? ` (use "${device}")` : ""}. **theme**: "light" | "dark".
- **presence**: "online" | "typing" | "lastseen" (with **lastSeenText**, e.g. "last seen today at 9:30").
- **group** (optional, for group chats): \`{ "name": "Family 🏡", "members": [{ "name": "Sara" }, { "name": "Omar" }] }\` — then omit "them" and set each other person's message \`"from"\` to their member name.
- **messages[]** — each message:
  - **from**: "me", "them", or a group member's name.
  - **type** (default "text"): "text" | "voice" | "image" | "sticker" | "location" | "file" | "call" | "deleted".
  - **text**: the message (for "image" it's the optional caption; for "sticker" 1–3 emoji).
  - **time**: "HH:MM". **status** (my messages): "sent" | "delivered" | "read".
  - **reaction**: one emoji reacting to this message (on my message it's their reaction; on theirs it's mine).
  - **replyTo**: number (1-based) of an earlier message this one quotes.
  - **edited**: true to show "Edited".
  - **voiceDuration**: "0:14" (for "voice"). **imageHint**: what the photo shows (for "image").
  - **link**: \`{ "url": "https://…", "title": "…", "description": "…", "siteName": "…" }\` for a text message containing a link.
  - **location**: \`{ "title": "Place name", "subtitle": "Street, City", "live": false }\` (for "location").
  - **file**: \`{ "name": "Invoice-1042.pdf", "size": "245 KB", "pages": "2 pages" }\` (for "file").
  - **call**: \`{ "video": false, "missed": true, "duration": "4:12" }\` (for "call").
  - **delay** / **typing** (optional, seconds): pause before the message and how long "typing…" shows. Omit them to let Scenora time the chat naturally.
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

export type AiParseResult =
  | { ok: true; scenario: Scenario; warnings: AiWarning[]; title: string | null }
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
  return map[s] ?? null;
}

const STATUS: DeliveryStatus[] = ["sent", "delivered", "read"];
const PRESENCE: PresenceStatus[] = ["online", "typing", "lastseen"];

function person(v: unknown, fallback: Person): Person {
  if (typeof v === "string") return { name: v, avatar: null };
  if (isObj(v)) return { name: str(v.name) ?? fallback.name, avatar: null };
  return fallback;
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
      return { ok: true, scenario: parseScenario({ ...base, ...d }), warnings, title: null };
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
      avatar: null,
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
    if (type === "image") images++;

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
      imageSrc: null,
      reaction: str(rawMsg.reaction)?.slice(0, 16) || null,
      edited: rawMsg.edited === true || undefined,
      link: type === "text" ? linkOf(rawMsg.link, text) : null,
      location: type === "location" ? locationOf(rawMsg.location ?? text) : null,
      file: type === "file" ? fileOf(rawMsg.file ?? text) : null,
      call: type === "call" ? callOf(rawMsg.call, typeHint) : null,
      authorIndex,
    };
    // sticker without emoji text: keep a friendly default
    if (type === "sticker" && !m.text.trim()) m.text = "🎉";

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
    },
    messages,
  };

  try {
    return { ok: true, scenario: parseScenario(candidate), warnings, title: str(d.title) ?? null };
  } catch {
    return { ok: false, error: "invalid" };
  }
}
