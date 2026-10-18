"use client";

/**
 * The OS on-screen keyboards drawn over the phone screen during compose typing:
 *  - iPhone: Apple keyboard, iOS 26/27 "Liquid Glass" generation (393 pt screen).
 *  - Samsung: Samsung Keyboard, One UI 8 (360 dp screen), with the 3-button
 *    navigation bar drawn underneath (the template's own nav bar is hidden
 *    while the keyboard is up).
 * Everything is inline CSS + SVG (snapdom-safe, no backdrop-filter) and fully
 * deterministic: output depends only on props (no timers / randomness).
 *
 * ── iPhone metrics ─────────────────────────────────────────────────────────
 * Measured on Apple's own iOS 26 Messages screenshot (Apple Newsroom, WWDC25,
 * "Apple-Intelligence-Live-Translation-Messages", iPhone 16 Pro 402×874 pt at
 * 1.743 px/pt): https://www.apple.com/newsroom/2025/06/apple-elevates-the-iphone-experience-with-ios-26/
 * and cross-checked on the iOS 27 iPhone User Guide images ("Type with the
 * onscreen keyboard on iPhone", support.apple.com/guide/iphone/iph3c50f96e):
 *  - panel: full width, top corners r ≈ 27 pt, 1 px light rim, flat #F2F2F2
 *    (light); keys all one colour (#FFF), no key shadow in iOS 26.
 *  - key: 32.1 × 41.9 pt at 402 pt (→ 31.2 at 393), radius ≈ 8.5 pt,
 *    horizontal gap 7.46 pt, side margin ≈ 6.8 pt, row pitch 55.1 pt.
 *  - first key row top 57 pt below the panel top; predictive bar dividers
 *    1 px × 23.5 pt starting 17 pt below the top.
 *  - shift / delete 42.45 pt wide; "123" and return 89.3 pt; space spans the
 *    z…n columns. With two keyboards (EN + AR) "123" splits into "123" + 😀
 *    and the space bar carries the language code ("EN") at its bottom-right
 *    (iOS 27 guide image); the bottom strip then shows 🌐 (left) and 🎤 (right).
 *  - bottom strip: 73.4 pt; 23 pt icons centred 48.8 pt from the left /
 *    50.5 pt from the right, 41 pt above the screen bottom; home indicator.
 *  - letters: SF Pro Regular ≈ 24 pt ('l' ascender 17.8 pt), lowercase
 *    labels; return key shows the ⏎ glyph (no "return" text in iOS 26), the
 *    space bar is blank.
 *  - total height (panel top → screen bottom) 337.4 pt.
 * Arabic: standard iOS Arabic layout (ض…ج / ش…ة / ء…ى, no shift key).
 * Dark: iOS dark system greys (panel secondarySystemBackground #1C1C1E,
 * keys systemGray3 #48484A).
 *
 * ── Samsung metrics ────────────────────────────────────────────────────────
 * Measured on One UI 8 / 8.5 Samsung Keyboard screenshots (SamMobile,
 * "You can still resize Samsung Keyboard in One UI 8.5", 1255 px = 360 dp,
 * 3.486 px/dp): https://www.sammobile.com/news/you-can-still-resize-samsung-keyboard-one-ui-8-5-just-not-as-quickly/
 * and Samsung's own One UI 8.0 vs 8.5 keyboard comparison
 * (images.samsung.com/is/image/samsung/assets/ae/support/ExtractText.png):
 *  - toolbar: 30 dp circular buttons centred at x 31 / 95 / 158 / 222 / 285,
 *    "…" at 338: Galaxy AI writing, emoji, clipboard, translate, settings, more.
 *  - keys: 29.5 × 39 dp, gap 5.5 dp, side margin 7.5 dp, row pitch 50 dp.
 *  - bottom row: !#1 | , | ‹ English (US) › | . | ↵ (Arabic: ، and «العربية»).
 *  - light: panel #F6F6F8, nav strip #E4E4E6 (mic | recents | home | hide ∨);
 *    dark: panel #161616, keys #2A2A2A, function keys #222, nav #000.
 *  - digits shown as top-right hints on q…p (number-key row off, default).
 * Arabic (Samsung/AOSP layout, CLDR keyboards/android/ar-t-k0-android.xml):
 *   ض ص ث ق ف غ ع ه خ ح ج / ش س ي ب ل ا ت ن م ك ط / ذ ء ؤ ر ى ة و ز ظ د
 */

import type { ReactNode } from "react";

import type { ChatTheme, Device } from "../../types";

/** Full keyboard height in screen px, including the bottom system area. */
export const KEYBOARD_HEIGHT: Record<Device, number> = { iphone: 337, android: 296 };

export interface KeyboardProps {
  device: Device;
  theme: ChatTheme;
  /** layout: Arabic or English */
  lang: "ar" | "en";
  /** text typed so far in the composer (its last character is the key being pressed), or null */
  typed: string | null;
  /** exporter clock (ms) — derive any animation from it when defined */
  clockMs?: number;
}

/* ------------------------------------------------------------------ */
/* Shared model                                                        */
/* ------------------------------------------------------------------ */

type KeyKind = "char" | "shift" | "delete" | "mode" | "emoji" | "space" | "return";

interface KeyDef {
  id: string;
  kind: KeyKind;
  x: number;
  y: number;
  w: number;
  h: number;
  /** label (char keys: the character as printed on the cap) */
  label?: string;
  /** characters that this key types (lowercase / base forms) */
  chars?: string[];
  /** Samsung: small top-right hint */
  hint?: string;
  /** Samsung: function-key fill */
  fn?: boolean;
}

/** Last user-perceived character of the typed text, or null. */
function lastChar(typed: string | null): string | null {
  if (!typed) return null;
  const cps = Array.from(typed);
  if (!cps.length) return null;
  const last = cps[cps.length - 1];
  // emoji (incl. ZWJ sequences, variation selectors, skin tones, keycaps)
  if (/[\p{Extended_Pictographic}‍️⃣]|[\u{1F3FB}-\u{1F3FF}]/u.test(last)) return null;
  // Arabic harakat / tatweel: no visible key press
  if (/[ً-ْـ]/.test(last)) return null;
  return last;
}

const isUpper = (c: string) => c !== c.toLowerCase() && c === c.toUpperCase();

/** iOS / Samsung auto-capitalisation: start of text or after . ! ? + space. */
function autoCap(typed: string | null): boolean {
  if (!typed) return true;
  return /[.!?]\s+$/.test(typed);
}

/** Arabic letters typed through a long-press on a base key. */
const AR_ALT: Record<string, string> = {
  "أ": "ا",
  "إ": "ا",
  "آ": "ا",
  "ٱ": "ا",
  "ئ": "ى",
  "ؤ": "و",
};

function findKey(keys: KeyDef[], ch: string): KeyDef | null {
  const lower = ch.toLowerCase();
  const direct = keys.find((k) => k.chars?.includes(lower) || k.chars?.includes(ch));
  if (direct) return direct;
  const alt = AR_ALT[ch];
  if (alt) return keys.find((k) => k.chars?.includes(alt)) ?? null;
  return null;
}

/* ---------------------------- suggestions --------------------------- */

const EN_WORDS = [
  "i", "i'm", "i'll", "the", "to", "and", "you", "it", "it's", "that", "in", "is", "on", "only", "once", "my", "way",
  "ways", "we", "we're", "what", "when", "where", "will", "with", "well", "was", "want", "wait", "work", "see", "so",
  "sure", "soon", "sounds", "good", "great", "going", "got", "get", "thanks", "thank", "there", "they", "this",
  "time", "today", "tonight", "tomorrow", "yes", "yeah", "you're", "your", "ok", "okay", "omw", "be", "back",
  "here", "home", "how", "hey", "hi", "hello", "love", "let", "let's", "later", "like", "just", "now", "no", "not",
  "need", "can", "can't", "call", "coming", "come", "right", "really", "lol", "for", "from", "free", "fine", "do",
  "don't", "done", "did", "at", "are", "all", "almost", "about", "after", "again", "meet", "me", "more", "maybe",
  "minutes", "morning", "night", "nice", "new", "of", "one", "out", "outside", "our", "perfect", "please", "ready",
  "send", "sent", "sorry", "store", "order", "office", "way's", "wow", "who", "why", "yay", "awesome",
];

const AR_WORDS = [
  "لك", "لكن", "لكم", "لكل", "في", "من", "على", "إلى", "أنا", "شكرا", "شكراً", "تمام", "طيب", "الحين", "الآن",
  "بأرسل", "بارسل", "أرسل", "ارسل", "أرسلت", "وصلت", "وصل", "وين", "متى", "إن", "إذا", "شاء", "الله", "حبيبي",
  "مرحبا", "السلام", "عليكم", "هلا", "نعم", "لا", "ما", "مع", "عن", "كيف", "كيفك", "حالك", "اليوم", "بكرة",
  "بعد", "قبل", "يا", "هذا", "هذي", "هو", "هي", "والله", "تم", "تماما", "تمام؟", "أبشر", "ابشر", "الطلب",
];

const NEXT: Record<string, string[]> = {
  "": ["I", "The", "I'm"],
  my: ["way", "phone", "friend"],
  on: ["my", "the", "it"],
  way: ["home", "to", "back"],
  i: ["am", "will", "think"],
  "i'm": ["on", "going", "not"],
  thanks: ["for", "so", "again"],
  see: ["you", "it", "the"],
};
const NEXT_AR: Record<string, string[]> = {
  "": ["أنا", "في", "شكرا"],
  "لك": ["الحين", "الطلب", "الله"],
  "تمام": ["الحين", "إن", "شكرا"],
  "إن": ["شاء", "الله", "ما"],
  "شاء": ["الله", "والله", "تعالى"],
};

/** Three predictive-bar entries, derived deterministically from the typed text. */
function suggestionsFor(typed: string | null, lang: "ar" | "en", quote: boolean): string[] {
  const text = typed ?? "";
  const ar = lang === "ar";
  const nextMap = ar ? NEXT_AR : NEXT;
  const fallback = ar ? ["في", "من", "على"] : ["the", "I", "to"];
  const m = /([\p{L}\p{M}'’]+)$/u.exec(text);
  if (!m) {
    // after a space / punctuation (or empty): next-word predictions
    const prev = /([\p{L}\p{M}'’]+)[^\p{L}\p{M}'’]*$/u.exec(text)?.[1]?.toLowerCase() ?? "";
    const startCap = !ar && autoCap(text);
    const list = nextMap[prev] ?? (text.trim() ? fallback : nextMap[""]);
    return list.map((w) => (startCap ? w.charAt(0).toUpperCase() + w.slice(1) : w));
  }
  const partial = m[1];
  const lower = partial.toLowerCase().replace("’", "'");
  const words = ar ? AR_WORDS : EN_WORDS;
  const exact = words.includes(lower);
  const comps = words.filter((w) => w.startsWith(lower) && w !== lower);
  const cap = (w: string) => (!ar && isUpper(partial.charAt(0)) ? w.charAt(0).toUpperCase() + w.slice(1) : w);
  const filler = nextMap[lower] ?? fallback;
  const pool = [...comps.map(cap), ...filler.map((w) => (exact ? `${partial} ${w}` : cap(w)))];
  const first = exact ? partial : quote ? `“${partial}”` : partial;
  const rest = pool.filter((w, i) => w !== first && pool.indexOf(w) === i).slice(0, 2);
  return [first, ...rest];
}

/* ------------------------------------------------------------------ */
/* Glyphs                                                              */
/* ------------------------------------------------------------------ */

function ShiftGlyph({ color, on, size = 22, stroke = 1.6 }: { color: string; on: boolean; size?: number; stroke?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: "block" }}>
      <path
        d="M12 3.6 3.4 12.7h4.6v7.6h8v-7.6h4.6Z"
        fill={on ? color : "none"}
        stroke={color}
        strokeWidth={stroke}
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DeleteGlyph({ color, size = 25, stroke = 1.6 }: { color: string; size?: number; stroke?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 26 26" style={{ display: "block" }}>
      <path
        d="M9.2 5.8h11.6a2.6 2.6 0 0 1 2.6 2.6v9.2a2.6 2.6 0 0 1-2.6 2.6H9.2L2.6 13Z"
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeLinejoin="round"
      />
      <path d="m11.7 9.6 6.8 6.8m0-6.8-6.8 6.8" stroke={color} strokeWidth={stroke} strokeLinecap="round" />
    </svg>
  );
}

function ReturnGlyph({ color, size = 24, stroke = 1.7 }: { color: string; size?: number; stroke?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: "block" }}>
      <path
        d="M19.4 5.6v5.2a1.6 1.6 0 0 1-1.6 1.6H5.2m4.2-4.3-4.3 4.3 4.3 4.3"
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function EmojiGlyph({ color, size = 23, stroke = 1.5 }: { color: string; size?: number; stroke?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: "block" }}>
      <circle cx="12" cy="12" r="9.6" fill="none" stroke={color} strokeWidth={stroke} />
      <ellipse cx="8.9" cy="9.6" rx="1.15" ry="1.6" fill={color} />
      <ellipse cx="15.1" cy="9.6" rx="1.15" ry="1.6" fill={color} />
      <path d="M7.3 13.6c1 2.3 2.7 3.5 4.7 3.5s3.7-1.2 4.7-3.5Z" fill={color} />
    </svg>
  );
}

function GlobeGlyph({ color, size = 23, stroke = 1.4 }: { color: string; size?: number; stroke?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: "block" }}>
      <g fill="none" stroke={color} strokeWidth={stroke}>
        <circle cx="12" cy="12" r="9.5" />
        <ellipse cx="12" cy="12" rx="4.1" ry="9.5" />
        <path d="M12 2.5v19M2.5 12h19M4.3 6.9h15.4M4.3 17.1h15.4" />
      </g>
    </svg>
  );
}

function MicGlyph({ color, size = 23, stroke = 1.5 }: { color: string; size?: number; stroke?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: "block" }}>
      <rect x="8.6" y="2.4" width="6.8" height="12.4" rx="3.4" fill="none" stroke={color} strokeWidth={stroke} />
      <path
        d="M5.4 11.2a6.6 6.6 0 0 0 13.2 0M12 17.8v3.6M8.6 21.4h6.8"
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
      />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* iPhone — iOS 26/27 keyboard                                         */
/* ------------------------------------------------------------------ */

const IOS = {
  W: 393,
  H: 337,
  margin: 6.8,
  gap: 7.46,
  keyH: 42,
  radius: 8.5,
  rowTop: [57, 112.1, 167.2, 222.3],
  shiftW: 42.45,
  /** centre of the bottom-strip icons, from the panel top */
  stripY: 296,
};

const IOS_THEME = {
  light: {
    panel: "#F2F2F2",
    rim: "rgba(255,255,255,0.95)",
    panelShadow: "0 -1px 0 rgba(0,0,0,0.035), 0 -8px 22px rgba(0,0,0,0.05)",
    key: "#FFFFFF",
    keyDown: "#D1D1D6",
    text: "#000000",
    divider: "#C8C8C8",
    strip: "#3C3C3E",
    sub: "#8A8A8E",
    home: "#000000",
    balloonShadow: "drop-shadow(0 0.5px 0.5px rgba(0,0,0,0.18)) drop-shadow(0 2px 6px rgba(0,0,0,0.16))",
  },
  dark: {
    panel: "#1C1C1E",
    rim: "rgba(255,255,255,0.13)",
    panelShadow: "0 -8px 22px rgba(0,0,0,0.35)",
    key: "#48484A",
    keyDown: "#6C6C70",
    text: "#FFFFFF",
    divider: "#48484A",
    strip: "#E5E5EA",
    sub: "#98989D",
    home: "#FFFFFF",
    balloonShadow: "drop-shadow(0 0.5px 0.5px rgba(0,0,0,0.5)) drop-shadow(0 2px 6px rgba(0,0,0,0.45))",
  },
};

const IOS_EN_ROWS = ["qwertyuiop", "asdfghjkl", "zxcvbnm"];
const IOS_AR_ROWS = ["ضصثقفغعهخحج", "شسيبلاتنمكة", "ءظطذدزروى"];
const IOS_NUM_EN = [Array.from("1234567890"), ["-", "/", ":", ";", "(", ")", "$", "&", "@", "\""], [".", ",", "?", "!", "'"]];
const IOS_NUM_AR = [Array.from("١٢٣٤٥٦٧٨٩٠"), ["-", "/", ":", "؛", "(", ")", "$", "&", "@", "\""], [".", "،", "؟", "!", "'"]];
/** ASCII digit typed on the Arabic numbers page lands on the same key */
const AR_DIGIT: Record<string, string> = Object.fromEntries(Array.from("1234567890").map((d, i) => [d, "١٢٣٤٥٦٧٨٩٠"[i]]));

function iosLetterRow(chars: string[], y: number, x0: number, w: number, gap: number, upper: boolean): KeyDef[] {
  return chars.map((c, i) => ({
    id: `c-${c}`,
    kind: "char" as const,
    x: x0 + i * (w + gap),
    y,
    w,
    h: IOS.keyH,
    label: upper ? c.toUpperCase() : c,
    chars: [c],
  }));
}

function iosLayout(lang: "ar" | "en", page: "letters" | "numbers", upper: boolean): KeyDef[] {
  const { W, margin: m, gap: g, keyH: h, rowTop: R, shiftW } = IOS;
  const inner = W - 2 * m;
  const keys: KeyDef[] = [];
  const w10 = (inner - 9 * g) / 10;

  if (page === "letters" && lang === "en") {
    const half = (w10 + g) / 2;
    keys.push(...iosLetterRow(Array.from(IOS_EN_ROWS[0]), R[0], m, w10, g, upper));
    keys.push(...iosLetterRow(Array.from(IOS_EN_ROWS[1]), R[1], m + half, w10, g, upper));
    keys.push(...iosLetterRow(Array.from(IOS_EN_ROWS[2]), R[2], m + half + w10 + g, w10, g, upper));
    keys.push({ id: "shift", kind: "shift", x: m, y: R[2], w: shiftW, h });
  } else if (page === "letters") {
    const g11 = 6;
    const w11 = (inner - 10 * g11) / 11;
    keys.push(...iosLetterRow(Array.from(IOS_AR_ROWS[0]), R[0], m, w11, g11, false));
    keys.push(...iosLetterRow(Array.from(IOS_AR_ROWS[1]), R[1], m, w11, g11, false));
    // 9 letters + delete (no shift): letters centred in the space left of delete
    const room = inner - shiftW - g;
    const used = 9 * w11 + 8 * g11;
    keys.push(...iosLetterRow(Array.from(IOS_AR_ROWS[2]), R[2], m + (room - used) / 2, w11, g11, false));
  } else {
    const rows = lang === "ar" ? IOS_NUM_AR : IOS_NUM_EN;
    keys.push(...iosLetterRow(rows[0], R[0], m, w10, g, false));
    keys.push(...iosLetterRow(rows[1], R[1], m, w10, g, false));
    const x0 = m + shiftW + g;
    const w5 = (inner - 2 * shiftW - 2 * g - 4 * g) / 5;
    keys.push(...iosLetterRow(rows[2], R[2], x0, w5, g, false));
    keys.push({ id: "symbols", kind: "mode", x: m, y: R[2], w: shiftW, h, label: "#+=" });
  }
  keys.push({ id: "delete", kind: "delete", x: W - m - shiftW, y: R[2], w: shiftW, h });

  // bottom row: 123 | 😀 | space (spans the z…n columns) | return
  const half = (w10 + g) / 2;
  const zRight = m + half + w10 + g + w10; // right edge of the 'z' column
  const nRight = m + half + w10 + g + 5 * (w10 + g) + w10; // right edge of the 'n' column
  const modeW = (zRight - m - g) / 2;
  keys.push({ id: "mode", kind: "mode", x: m, y: R[3], w: modeW, h, label: page === "letters" ? "123" : "ABC" });
  keys.push({ id: "emoji", kind: "emoji", x: m + modeW + g, y: R[3], w: modeW, h });
  keys.push({ id: "space", kind: "space", x: zRight + g, y: R[3], w: nRight - zRight - g, h, chars: [" ", " "] });
  keys.push({ id: "return", kind: "return", x: nRight + g, y: R[3], w: W - m - nRight - g, h, chars: ["\n"] });
  return keys;
}

/** iOS key-press balloon: the key grows a magnified head above itself. */
function IosBalloon({ k, ch, fill, color, shadow, fontSize }: { k: KeyDef; ch: string; fill: string; color: string; shadow: string; fontSize: number }) {
  const e = 11.5; // head overhang on each side
  const headH = 53;
  const r = 9;
  // keep the head on screen (edge keys skew inward, like iOS)
  let hx = k.x - e;
  const hw = k.w + 2 * e;
  if (hx < 1) hx = k.x - 1;
  if (hx + hw > IOS.W - 1) hx = k.x + k.w + 1 - hw;
  const hy = k.y - 65;
  const yb = hy + headH; // head bottom
  const kx = k.x;
  const kr = k.x + k.w;
  const kb = k.y + k.h;
  const kr2 = IOS.radius;
  // path in screen coordinates, drawn in an svg offset by (ox, oy)
  const ox = hx - 8;
  const oy = hy - 8;
  const X = (v: number) => (v - ox).toFixed(2);
  const Y = (v: number) => (v - oy).toFixed(2);
  const d = [
    `M${X(hx + r)} ${Y(hy)}`,
    `H${X(hx + hw - r)}`,
    `Q${X(hx + hw)} ${Y(hy)} ${X(hx + hw)} ${Y(hy + r)}`,
    `V${Y(yb - 9)}`,
    `C${X(hx + hw)} ${Y(yb + 1)} ${X(kr)} ${Y(yb + 1)} ${X(kr)} ${Y(yb + 12)}`,
    `V${Y(kb - kr2)}`,
    `Q${X(kr)} ${Y(kb)} ${X(kr - kr2)} ${Y(kb)}`,
    `H${X(kx + kr2)}`,
    `Q${X(kx)} ${Y(kb)} ${X(kx)} ${Y(kb - kr2)}`,
    `V${Y(yb + 12)}`,
    `C${X(kx)} ${Y(yb + 1)} ${X(hx)} ${Y(yb + 1)} ${X(hx)} ${Y(yb - 9)}`,
    `V${Y(hy + r)}`,
    `Q${X(hx)} ${Y(hy)} ${X(hx + r)} ${Y(hy)}`,
    "Z",
  ].join(" ");
  const sw = hw + 16;
  const sh = kb - hy + 16;
  return (
    <>
      <svg
        width={sw}
        height={sh}
        viewBox={`0 0 ${sw} ${sh}`}
        style={{ position: "absolute", left: ox, top: oy, overflow: "visible", filter: shadow, zIndex: 5 }}
      >
        <path d={d} fill={fill} />
      </svg>
      <div
        style={{
          position: "absolute",
          left: hx,
          top: hy,
          width: hw,
          height: headH,
          zIndex: 6,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize,
          lineHeight: 1,
          color,
          paddingBottom: 2,
        }}
      >
        {ch}
      </div>
    </>
  );
}

function IosKeyboard({ theme, lang, typed }: KeyboardProps) {
  const c = IOS_THEME[theme === "dark" ? "dark" : "light"];
  const ch = lastChar(typed);
  const ar = lang === "ar";

  // which page is showing: the numbers page when the pressed char lives there
  const lettersProbe = iosLayout(lang, "letters", false);
  let page: "letters" | "numbers" = "letters";
  if (ch && !findKey(lettersProbe, ch)) {
    const nums = iosLayout(lang, "numbers", false);
    if (findKey(nums, ar ? (AR_DIGIT[ch] ?? ch) : ch)) page = "numbers";
  }
  const pressingLetter = !!ch && /\p{L}/u.test(ch) && page === "letters";
  const upper = !ar && page === "letters" && (pressingLetter ? isUpper(ch!) : autoCap(typed));
  const keys = iosLayout(lang, page, upper);
  const pressed = ch ? findKey(keys, ar && page === "numbers" ? (AR_DIGIT[ch] ?? ch) : ch) : null;
  const sugg = suggestionsFor(typed, lang, true);

  const letterSize = ar ? 21 : upper ? 22.5 : 23.5;
  const slotW = IOS.W / 3;

  const renderKey = (k: KeyDef): ReactNode => {
    const down = pressed?.id === k.id && k.kind !== "char";
    let content: ReactNode = null;
    if (k.kind === "char") {
      content = (
        <span style={{ fontSize: letterSize, lineHeight: 1, transform: upper || ar ? "translateY(0.5px)" : "translateY(-1.5px)" }}>
          {k.label}
        </span>
      );
    } else if (k.kind === "shift") content = <ShiftGlyph color={c.text} on={upper} size={30} stroke={1.3} />;
    else if (k.kind === "delete") content = <DeleteGlyph color={c.text} size={29} stroke={1.4} />;
    else if (k.kind === "return") content = <ReturnGlyph color={c.text} size={28} stroke={1.45} />;
    else if (k.kind === "emoji") content = <EmojiGlyph color={c.text} size={22} />;
    else if (k.kind === "mode") content = <span style={{ fontSize: k.label === "#+=" ? 16 : 17.5, letterSpacing: 0.2 }}>{k.label}</span>;
    else if (k.kind === "space")
      content = (
        <span style={{ position: "absolute", right: 7, bottom: 3.5, fontSize: 8.5, fontWeight: 500, letterSpacing: 0.3, color: c.sub }}>
          {ar ? "AR" : "EN"}
        </span>
      );
    return (
      <div
        key={k.id}
        style={{
          position: "absolute",
          left: k.x,
          top: k.y,
          width: k.w,
          height: k.h,
          borderRadius: IOS.radius,
          background: down ? c.keyDown : c.key,
          color: c.text,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {content}
      </div>
    );
  };

  return (
    <div className="relative h-full w-full select-none" style={{ height: IOS.H }} dir="ltr">
      {/* glass panel: full width, rounded top, light rim + soft lift shadow */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: c.panel,
          borderTopLeftRadius: 27,
          borderTopRightRadius: 27,
          boxShadow: `inset 0 1px 0 ${c.rim}, ${c.panelShadow}`,
        }}
      />
      {/* predictive bar */}
      <div style={{ position: "absolute", left: 0, top: 0, width: IOS.W, height: 57 }} dir={ar ? "rtl" : "ltr"}>
        {sugg.map((s, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              top: 16.5,
              height: 24,
              width: slotW,
              ...(ar ? { right: i * slotW } : { left: i * slotW }),
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 17,
              letterSpacing: -0.2,
              color: c.text,
              whiteSpace: "nowrap",
              overflow: "hidden",
              padding: "0 8px",
            }}
          >
            {s}
          </div>
        ))}
        {[1, 2].map((i) => (
          <span
            key={i}
            style={{ position: "absolute", top: 17, left: Math.round(i * slotW), width: 1, height: 23.5, background: c.divider }}
          />
        ))}
      </div>
      {keys.map(renderKey)}
      {/* bottom strip: globe (two keyboards installed) and dictation */}
      <div style={{ position: "absolute", left: 48.8 - 12, top: IOS.stripY - 12 }}>
        <GlobeGlyph color={c.strip} size={24} />
      </div>
      <div style={{ position: "absolute", right: 50.5 - 12, top: IOS.stripY - 12 }}>
        <MicGlyph color={c.strip} size={24} />
      </div>
      {/* home indicator */}
      <span
        style={{
          position: "absolute",
          left: (IOS.W - 134) / 2,
          bottom: 8,
          width: 134,
          height: 5,
          borderRadius: 2.5,
          background: c.home,
        }}
      />
      {pressed && pressed.kind === "char" && ch && (
        <IosBalloon
          k={pressed}
          ch={ch}
          fill={c.key}
          color={c.text}
          shadow={c.balloonShadow}
          fontSize={ar ? 34 : 36}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Samsung — One UI 8 Samsung Keyboard                                 */
/* ------------------------------------------------------------------ */

const SS = {
  W: 360,
  H: 296,
  toolbarH: 48,
  margin: 7.5,
  gap: 5.5,
  keyH: 39,
  radius: 9,
  rowTop: [52, 102, 152, 202],
  navH: 48,
};

const SS_THEME = {
  light: {
    panel: "#F6F6F8",
    key: "#FFFFFF",
    fn: "#E9E9ED",
    keyDown: "#D7D7DC",
    text: "#1A1A1A",
    hint: "#8E8E93",
    spaceLabel: "#77777C",
    circle: "#EBEBEE",
    tool: "#55555A",
    divider: "#D2D2D6",
    nav: "#E4E4E6",
    navIcon: "#5E5E62",
    popup: "#FFFFFF",
    popupShadow: "0 1px 2px rgba(0,0,0,0.12), 0 4px 14px rgba(0,0,0,0.16)",
    dot: "#FF6A2B",
  },
  dark: {
    panel: "#161616",
    key: "#2A2A2A",
    fn: "#222222",
    keyDown: "#434345",
    text: "#F2F2F2",
    hint: "#8A8A8E",
    spaceLabel: "#A0A0A4",
    circle: "#2C2C2E",
    tool: "#E3E3E6",
    divider: "#3A3A3C",
    nav: "#000000",
    navIcon: "#D2D2D6",
    popup: "#3A3A3C",
    popupShadow: "0 1px 2px rgba(0,0,0,0.5), 0 4px 14px rgba(0,0,0,0.5)",
    dot: "#FF6A2B",
  },
};

const SS_EN_ROWS = ["qwertyuiop", "asdfghjkl", "zxcvbnm"];
const SS_EN_HINTS = ["1234567890", "!@#$%&*()", "-'\":;/?"];
const SS_AR_ROWS = ["ضصثقفغعهخحج", "شسيبلاتنمكط", "ذءؤرىةوزظد"];
const SS_AR_HINTS = ["١٢٣٤٥٦٧٨٩٠", "", ""];

function ssLayout(lang: "ar" | "en", upper: boolean): KeyDef[] {
  const { W, margin: m, gap: g, keyH: h, rowTop: R } = SS;
  const inner = W - 2 * m;
  const keys: KeyDef[] = [];
  const row = (chars: string[], hints: string, y: number, x0: number, w: number) =>
    chars.forEach((c, i) => {
      const hint = hints ? Array.from(hints)[i] : undefined;
      const extra = hint ? [hint] : [];
      // ASCII digits typed on the Arabic layout land on the Arabic-Indic hint key
      if (hint && /[١-٩٠]/.test(hint)) extra.push(String("1234567890".charAt("١٢٣٤٥٦٧٨٩٠".indexOf(hint))));
      keys.push({
        id: `c-${c}`,
        kind: "char",
        x: x0 + i * (w + g),
        y,
        w,
        h,
        label: upper ? c.toUpperCase() : c,
        chars: [c, ...extra],
        hint,
      });
    });

  const shiftW = (inner - 7 * 29.5 - 8 * g) / 2; // 47.25
  if (lang === "en") {
    const w = (inner - 9 * g) / 10; // 29.5
    row(Array.from(SS_EN_ROWS[0]), SS_EN_HINTS[0], R[0], m, w);
    row(Array.from(SS_EN_ROWS[1]), SS_EN_HINTS[1], R[1], m + (w + g) / 2, w);
    row(Array.from(SS_EN_ROWS[2]), SS_EN_HINTS[2], R[2], m + shiftW + g, w);
    keys.push({ id: "shift", kind: "shift", x: m, y: R[2], w: shiftW, h, fn: true });
    keys.push({ id: "delete", kind: "delete", x: W - m - shiftW, y: R[2], w: shiftW, h, fn: true });
  } else {
    const w = (inner - 10 * g) / 11;
    row(Array.from(SS_AR_ROWS[0]), SS_AR_HINTS[0], R[0], m, w);
    row(Array.from(SS_AR_ROWS[1]), SS_AR_HINTS[1], R[1], m, w);
    const delW = 38;
    const w3 = (inner - delW - g - 9 * g) / 10;
    row(Array.from(SS_AR_ROWS[2]), SS_AR_HINTS[2], R[2], m, w3);
    keys.push({ id: "delete", kind: "delete", x: W - m - delW, y: R[2], w: delW, h, fn: true });
  }
  // bottom row: !#1 | , | space | . | enter
  const cw = 29.5;
  keys.push({ id: "mode", kind: "mode", x: m, y: R[3], w: shiftW, h, label: "!#1", fn: true });
  const commaX = m + shiftW + g;
  keys.push({
    id: "comma",
    kind: "char",
    x: commaX,
    y: R[3],
    w: cw,
    h,
    label: lang === "ar" ? "،" : ",",
    chars: lang === "ar" ? ["،", ","] : [","],
  });
  const spaceX = commaX + cw + g;
  const enterX = W - m - shiftW;
  const dotX = enterX - g - cw;
  keys.push({ id: "space", kind: "space", x: spaceX, y: R[3], w: dotX - g - spaceX, h, chars: [" ", " "] });
  keys.push({ id: "dot", kind: "char", x: dotX, y: R[3], w: cw, h, label: ".", chars: ["."] });
  keys.push({ id: "return", kind: "return", x: enterX, y: R[3], w: shiftW, h, fn: true, chars: ["\n"] });
  return keys;
}

/* Samsung toolbar glyphs (One UI 8 line icons, 1.5 dp strokes) */
function SsToolIcon({ name, color }: { name: string; color: string }) {
  const common = { fill: "none", stroke: color, strokeWidth: 1.5, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" style={{ display: "block" }}>
      {name === "ai" && (
        <g {...common}>
          <path d="M10 3.5c.6 3.6 2.4 5.4 6 6-3.6.6-5.4 2.4-6 6-.6-3.6-2.4-5.4-6-6 3.6-.6 5.4-2.4 6-6Z" fill={color} />
          <path d="M17.5 13.5c.3 1.7 1.1 2.5 2.8 2.8-1.7.3-2.5 1.1-2.8 2.8-.3-1.7-1.1-2.5-2.8-2.8 1.7-.3 2.5-1.1 2.8-2.8Z" fill={color} />
        </g>
      )}
      {name === "emoji" && (
        <g {...common}>
          <circle cx="12" cy="12" r="8.6" />
          <path d="M8.6 14.2c.9 1.4 2 2.1 3.4 2.1s2.5-.7 3.4-2.1" />
          <circle cx="9.3" cy="10" r=".6" fill={color} />
          <circle cx="14.7" cy="10" r=".6" fill={color} />
        </g>
      )}
      {name === "clipboard" && (
        <g {...common}>
          <rect x="6" y="4.5" width="12" height="16" rx="2.6" />
          <path d="M9.5 4.5v-.4c0-.6.4-1 1-1h3c.6 0 1 .4 1 1v.4M9.2 7.2h5.6" />
        </g>
      )}
      {name === "translate" && (
        <g {...common}>
          <rect x="3.8" y="7.6" width="11" height="12" rx="2.4" />
          <path d="M7 16.6l2.3-6 2.3 6M7.8 14.6h3.1" />
          <path d="M11.5 4.4h6.2c1.3 0 2.4 1.1 2.4 2.4v6.4M18 11.4l2.1 2.1 2.1-2.1" />
        </g>
      )}
      {name === "settings" && (
        <g {...common}>
          <path d="M10.3 3.5h3.4l.5 2.4 1.6.9 2.3-.8 1.7 2.9-1.8 1.6v1.9l1.8 1.6-1.7 2.9-2.3-.8-1.6.9-.5 2.4h-3.4l-.5-2.4-1.6-.9-2.3.8L4.2 14l1.8-1.6v-1.9L4.2 8.9 5.9 6l2.3.8 1.6-.9Z" />
          <circle cx="12" cy="12" r="2.9" />
        </g>
      )}
      {name === "more" && (
        <g fill={color}>
          <circle cx="5.6" cy="12" r="1.5" />
          <circle cx="12" cy="12" r="1.5" />
          <circle cx="18.4" cy="12" r="1.5" />
        </g>
      )}
      {name === "back" && <path d="M14.6 5.6 8.2 12l6.4 6.4" {...common} strokeWidth={1.7} />}
    </svg>
  );
}

function SamsungKeyboard({ theme, lang, typed }: KeyboardProps) {
  const c = SS_THEME[theme === "dark" ? "dark" : "light"];
  const ar = lang === "ar";
  const ch = lastChar(typed);
  const pressingLetter = !!ch && /\p{L}/u.test(ch);
  const upper = !ar && (pressingLetter ? isUpper(ch!) : autoCap(typed));
  const keys = ssLayout(lang, upper);
  const pressed = ch ? findKey(keys, ch) : null;
  const typing = !!typed && typed.length > 0;
  const sugg = typing ? suggestionsFor(typed, lang, false) : [];

  const toolX = [31.3, 95, 158.4, 221.8, 285.2];
  const tools = ["ai", "emoji", "clipboard", "translate", "settings"];

  const renderKey = (k: KeyDef): ReactNode => {
    const down = pressed?.id === k.id;
    let content: ReactNode = null;
    if (k.kind === "char") {
      const punct = k.id === "comma" || k.id === "dot";
      content = (
        <span
          style={{
            fontSize: punct ? 22 : ar ? 20.5 : 21.5,
            lineHeight: 1,
            transform: punct ? "translateY(2.5px)" : ar ? "translateY(1px)" : upper ? "translateY(1px)" : "translateY(0px)",
          }}
        >
          {k.label}
        </span>
      );
    } else if (k.kind === "shift") content = <ShiftGlyph color={c.text} on={upper} size={21} stroke={1.5} />;
    else if (k.kind === "delete") content = <DeleteGlyph color={c.text} size={24} stroke={1.5} />;
    else if (k.kind === "return") content = <ReturnGlyph color={c.text} size={23} stroke={1.6} />;
    else if (k.kind === "mode") content = <span style={{ fontSize: 15, letterSpacing: 0.2 }}>{k.label}</span>;
    else if (k.kind === "space")
      content = (
        <span
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 13px",
            color: c.spaceLabel,
          }}
        >
          <svg width={9} height={12} viewBox="0 0 9 12" style={{ display: "block" }}>
            <path d="M6.5 1.5 2 6l4.5 4.5" fill="none" stroke={c.spaceLabel} strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span style={{ fontSize: 13, letterSpacing: 0.1 }} dir={ar ? "rtl" : "ltr"}>
            {ar ? "العربية" : "English (US)"}
          </span>
          <svg width={9} height={12} viewBox="0 0 9 12" style={{ display: "block" }}>
            <path d="M2.5 1.5 7 6l-4.5 4.5" fill="none" stroke={c.spaceLabel} strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      );
    return (
      <div
        key={k.id}
        style={{
          position: "absolute",
          left: k.x,
          top: k.y,
          width: k.w,
          height: k.h,
          borderRadius: SS.radius,
          background: down ? c.keyDown : k.fn ? c.fn : c.key,
          color: c.text,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {content}
        {k.hint && (
          <span style={{ position: "absolute", top: 4, right: 5.5, fontSize: 9.5, lineHeight: 1, color: c.hint }}>{k.hint}</span>
        )}
      </div>
    );
  };

  // key preview popup (Samsung "Character preview")
  let popup: ReactNode = null;
  if (pressed && pressed.kind === "char" && ch) {
    const pw = Math.max(44, pressed.w + 14);
    const ph = 50;
    let px = pressed.x + pressed.w / 2 - pw / 2;
    px = Math.max(2, Math.min(SS.W - 2 - pw, px));
    const py = pressed.y - ph - 6;
    popup = (
      <div
        style={{
          position: "absolute",
          left: px,
          top: py,
          width: pw,
          height: ph,
          borderRadius: 12,
          background: c.popup,
          boxShadow: c.popupShadow,
          color: c.text,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: ar ? 30 : 31,
          lineHeight: 1,
          zIndex: 6,
        }}
      >
        <span style={{ transform: "translateY(-1px)" }}>{upper && !ar ? ch.toUpperCase() : ch}</span>
      </div>
    );
  }

  const kbH = SS.H - SS.navH;
  return (
    <div className="relative h-full w-full select-none" style={{ height: SS.H }}>
      <div style={{ position: "absolute", left: 0, top: 0, width: SS.W, height: kbH, background: c.panel }} />
      {/* toolbar, or the predictive suggestions while typing */}
      <div style={{ position: "absolute", left: 0, top: 0, width: SS.W, height: SS.toolbarH }} dir="ltr">
        {!typing &&
          tools.map((t, i) => (
            <div
              key={t}
              style={{
                position: "absolute",
                left: toolX[i] - 15,
                top: SS.toolbarH / 2 - 15,
                width: 30,
                height: 30,
                borderRadius: 15,
                background: c.circle,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <SsToolIcon name={t} color={c.tool} />
            </div>
          ))}
        {typing && (
          <>
            <div
              style={{
                position: "absolute",
                left: 31.3 - 15,
                top: SS.toolbarH / 2 - 15,
                width: 30,
                height: 30,
                borderRadius: 15,
                background: c.circle,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <SsToolIcon name="back" color={c.tool} />
            </div>
            <div style={{ position: "absolute", left: 56, right: 44, top: 0, height: SS.toolbarH }} dir={ar ? "rtl" : "ltr"}>
              {sugg.map((s, i) => (
                <div
                  key={i}
                  style={{
                    position: "absolute",
                    top: 0,
                    height: SS.toolbarH,
                    width: `${100 / 3}%`,
                    ...(ar ? { right: `${(i * 100) / 3}%` } : { left: `${(i * 100) / 3}%` }),
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 15,
                    fontWeight: 400,
                    color: c.text,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    padding: "0 4px",
                  }}
                >
                  {s}
                </div>
              ))}
              {[1, 2].map((i) => (
                <span
                  key={i}
                  style={{
                    position: "absolute",
                    top: 16,
                    height: 16,
                    width: 1,
                    left: `${(i * 100) / 3}%`,
                    background: c.divider,
                  }}
                />
              ))}
            </div>
          </>
        )}
        <div
          style={{
            position: "absolute",
            left: 338.2 - 12,
            top: SS.toolbarH / 2 - 12,
            width: 24,
            height: 24,
            borderRadius: 12,
            background: c.circle,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <SsToolIcon name="more" color={c.tool} />
        </div>
      </div>
      <div style={{ position: "absolute", inset: 0 }} dir="ltr">
        {keys.map(renderKey)}
        {popup}
      </div>
      {/* 3-button navigation with the keyboard up: voice input | recents | home | hide-keyboard ∨
          (follows the inherited UI direction, so it mirrors in an RTL locale like the system bar) */}
      <div
        style={{
          position: "absolute",
          left: 0,
          bottom: 0,
          width: SS.W,
          height: SS.navH,
          background: c.nav,
        }}
      >
        <div className="absolute inset-y-0 start-0 flex items-center" style={{ paddingInlineStart: 10 }}>
          <MicGlyph color={c.navIcon} size={20} stroke={1.5} />
        </div>
        <div
          className="grid h-full items-center justify-center"
          style={{ gridTemplateColumns: "repeat(3, 104px)", width: "100%" }}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="justify-self-center" style={{ display: "block" }}>
            <path d="M5.4 3.5v13M10 3.5v13M14.6 3.5v13" stroke={c.navIcon} strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="justify-self-center" style={{ display: "block" }}>
            <rect x="2.5" y="2.5" width="15" height="15" rx="5" stroke={c.navIcon} strokeWidth="1.6" />
          </svg>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="justify-self-center" style={{ display: "block" }}>
            <path d="M3.5 7.2 10 13.6l6.5-6.4" stroke={c.navIcon} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

export function Keyboard(props: KeyboardProps) {
  return props.device === "iphone" ? <IosKeyboard {...props} /> : <SamsungKeyboard {...props} />;
}
