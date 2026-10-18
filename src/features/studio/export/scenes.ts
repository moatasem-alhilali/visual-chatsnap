/**
 * Output-time structure of an export and the canvas-drawn scenes around the
 * chat:
 *
 *   [notification intro]  [hold]  [chat playback]  [hold]  [end card]
 *    leadMs (0 = off)     introMs  contentMs-skipMs outroMs  endMs (0 = off)
 *
 * With the notification intro on, the chat opens on the message the banner
 * announced (already on screen), so chat time starts at `skipMs` instead of 0.
 * Everything here is a pure function of output time, so stills, GIFs and the
 * video sample the exact same frames.
 */

/* --------------------------------------------------------------- timing */

/** Notification intro beats (ms from the start of the video). */
export const NOTIF = {
  /** the banner starts to slide in */
  inAt: 420,
  inMs: 560,
  /** finger "presses" the banner */
  pressAt: 2080,
  /** the app opens out of the banner */
  openAt: 2220,
  openMs: 720,
} as const;
/** length of the notification scene (the chat is fully on screen after it) */
export const NOTIF_MS = NOTIF.openAt + NOTIF.openMs;

export const END_TRANSITION_MS = 700;

export interface SceneTimingInput {
  notif: boolean;
  /** chat timeline time the chat opens at (0 without the intro) */
  skipMs: number;
  introMs: number;
  contentMs: number;
  outroMs: number;
  /** end card length (0 = none) */
  endMs: number;
}

export interface SceneTiming {
  leadMs: number;
  skipMs: number;
  introMs: number;
  contentMs: number;
  outroMs: number;
  endMs: number;
  /** output time − chatOffset = chat timeline time */
  chatOffset: number;
  /** output time at which the end card starts (= end of the chat) */
  chatEnd: number;
  totalMs: number;
}

export function sceneTiming(i: SceneTimingInput): SceneTiming {
  const leadMs = i.notif ? NOTIF_MS : 0;
  const skipMs = i.notif ? Math.max(0, i.skipMs) : 0;
  const content = Math.max(i.contentMs, skipMs);
  const chatOffset = leadMs + i.introMs - skipMs;
  const chatEnd = chatOffset + content + i.outroMs;
  return {
    leadMs,
    skipMs,
    introMs: i.introMs,
    contentMs: content,
    outroMs: i.outroMs,
    endMs: Math.max(0, i.endMs),
    chatOffset,
    chatEnd,
    totalMs: chatEnd + Math.max(0, i.endMs),
  };
}

/** Chat timeline time shown at output time `tOut` (frozen during the intro and holds). */
export function chatTimeAt(tm: SceneTiming, tOut: number): number {
  return Math.min(tm.skipMs + Math.max(0, tm.contentMs - tm.skipMs), Math.max(tm.skipMs, tOut - tm.chatOffset));
}

/** Output time of a chat timeline event. */
export function outputTimeOf(tm: SceneTiming, chatMs: number): number {
  return chatMs + tm.chatOffset;
}

/* ---------------------------------------------------------------- easing */

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
export const easeOutCubic = (p: number) => 1 - Math.pow(1 - p, 3);
export const easeInOutCubic = (p: number) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);
/** gentle overshoot (logo pop) */
export const easeOutBack = (p: number) => {
  const c1 = 1.25;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2);
};
/** progress of a beat that starts at `at` and lasts `ms` */
export const beat = (t: number, at: number, ms: number) => clamp01((t - at) / ms);

/* ------------------------------------------------------------------ text */

const RTL_RE = /[֐-ࣿיִ-﷿ﹰ-ﻼ]/;
export const isRtlText = (s: string) => RTL_RE.test(s);

type Ctx2D = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

let measureCtx: OffscreenCanvasRenderingContext2D | null = null;
function measurer(): OffscreenCanvasRenderingContext2D | null {
  if (measureCtx) return measureCtx;
  if (typeof OffscreenCanvas === "undefined") return null;
  measureCtx = new OffscreenCanvas(8, 8).getContext("2d");
  return measureCtx;
}

/** Greedy word wrap (keeps explicit line breaks). */
export function wrapText(ctx: Ctx2D, text: string, maxW: number): string[] {
  const out: string[] = [];
  for (const para of text.split(/\n/)) {
    const words = para.split(/\s+/).filter(Boolean);
    if (!words.length) continue;
    let line = words[0];
    for (let k = 1; k < words.length; k++) {
      const next = `${line} ${words[k]}`;
      if (ctx.measureText(next).width <= maxW) line = next;
      else {
        out.push(line);
        line = words[k];
      }
    }
    out.push(line);
  }
  return out;
}

/** Font size (px) and lines that fit `text` in `maxLines` lines of `maxW`. */
function fitText(
  ctx: Ctx2D,
  text: string,
  weight: number,
  family: string,
  size: number,
  maxW: number,
  maxLines: number,
): { size: number; lines: string[] } {
  let s = size;
  for (let k = 0; k < 12; k++) {
    ctx.font = `${weight} ${s}px ${family}`;
    const lines = wrapText(ctx, text, maxW);
    const widest = Math.max(0, ...lines.map((l) => ctx.measureText(l).width));
    if (lines.length <= maxLines && widest <= maxW) return { size: s, lines };
    s *= 0.9;
  }
  ctx.font = `${weight} ${s}px ${family}`;
  return { size: s, lines: wrapText(ctx, text, maxW).slice(0, maxLines) };
}

/* --------------------------------------------------------------- caption */

export type CaptionPosition = "top" | "bottom";
export type CaptionSize = "s" | "m" | "l";

export interface CaptionConfig {
  text: string;
  position: CaptionPosition;
  size: CaptionSize;
  color: string;
  /** pill behind the text (keeps it legible while the camera zooms under it); null = none */
  pill: string | null;
  fontFamily: string;
}

/** font size as a fraction of the frame width */
const CAPTION_FONT: Record<CaptionSize, number> = { s: 0.046, m: 0.058, l: 0.074 };

interface CaptionMetrics {
  font: number;
  lines: string[];
  lineH: number;
  /** band height (px) reserved above/below the phone */
  band: number;
}

function captionMetrics(ctx: Ctx2D, cfg: CaptionConfig, W: number, H: number): CaptionMetrics {
  const { size, lines } = fitText(ctx, cfg.text.trim(), 700, cfg.fontFamily, W * CAPTION_FONT[cfg.size], W * 0.84, 2);
  const lineH = size * 1.22;
  const band = lines.length * lineH + size * 1.5 + H * 0.02;
  return { font: size, lines, lineH, band };
}

/** Fraction of the frame height the caption band needs (0 when there's no text). */
export function captionBandFraction(cfg: CaptionConfig | null, W: number, H: number): number {
  if (!cfg || !cfg.text.trim()) return 0;
  const ctx = measurer();
  if (!ctx) return 0.14;
  return Math.min(0.3, captionMetrics(ctx, cfg, W, H).band / H);
}

/**
 * Draw the caption in screen space (it doesn't move with the camera).
 * `scrim` (0–1) darkens the band behind a pill-less caption while the camera
 * is zoomed in and the chat slides underneath it.
 */
export function paintCaption(ctx: Ctx2D, W: number, H: number, cfg: CaptionConfig, alpha = 1, scrim = 0): void {
  if (!cfg.text.trim() || alpha <= 0) return;
  ctx.save();
  const m = captionMetrics(ctx, cfg, W, H);
  ctx.font = `700 ${m.font}px ${cfg.fontFamily}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.direction = isRtlText(cfg.text) ? "rtl" : "ltr";
  ctx.globalAlpha = alpha;
  const blockH = m.lines.length * m.lineH;
  const bandTop = cfg.position === "top" ? 0 : H - m.band;
  // keep the text optically centred in its band, nudged toward the outer edge
  const cy = bandTop + m.band / 2 + (cfg.position === "top" ? 1 : -1) * H * 0.004;
  const top = cy - blockH / 2;
  if (!cfg.pill && scrim > 0) {
    const reach = m.band * 1.35;
    const y0 = cfg.position === "top" ? 0 : H;
    const y1 = cfg.position === "top" ? reach : H - reach;
    const g = ctx.createLinearGradient(0, y0, 0, y1);
    g.addColorStop(0, `rgba(0,0,0,${0.85 * scrim})`);
    g.addColorStop(0.62, `rgba(0,0,0,${0.7 * scrim})`);
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, Math.min(y0, y1), W, reach);
  }
  if (cfg.pill) {
    const widest = Math.max(...m.lines.map((l) => ctx.measureText(l).width));
    const px = m.font * 0.75;
    const py = m.font * 0.42;
    const w = widest + px * 2;
    const h = blockH + py * 2;
    ctx.fillStyle = cfg.pill;
    ctx.beginPath();
    ctx.roundRect(W / 2 - w / 2, top - py, w, h, Math.min(h / 2, m.font * 0.9));
    ctx.fill();
  }
  ctx.fillStyle = cfg.color;
  if (!cfg.pill) {
    ctx.shadowColor = "rgba(0,0,0,0.28)";
    ctx.shadowBlur = m.font * 0.25;
    ctx.shadowOffsetY = m.font * 0.04;
  }
  m.lines.forEach((l, k) => ctx.fillText(l, W / 2, top + m.lineH * (k + 0.5)));
  ctx.restore();
}

/* -------------------------------------------------------------- end card */

export interface EndCardConfig {
  logo: CanvasImageSource | null;
  /** natural size of the logo */
  logoW: number;
  logoH: number;
  headline: string;
  cta: string;
  bg: string;
  fg: string;
  ctaBg: string;
  ctaFg: string;
  fontFamily: string;
}

/**
 * The closing scene at `u` ms into the end card: the last chat frame zooms
 * back and blurs out under the brand colour, then the logo pops, the headline
 * rises and the CTA button lands (with one gentle pulse).
 */
export function paintEndCard(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  u: number,
  chat: CanvasImageSource | null,
  cfg: EndCardConfig,
): void {
  const unit = Math.min(W, H);
  const pT = easeInOutCubic(beat(u, 0, END_TRANSITION_MS));

  ctx.save();
  // 1. the chat recedes
  if (chat && pT < 1) {
    const s = 1 - 0.07 * pT;
    const filters = "filter" in ctx;
    if (filters && pT > 0) ctx.filter = `blur(${(unit / 70) * pT}px)`;
    ctx.drawImage(chat, (W - W * s) / 2, (H - H * s) / 2, W * s, H * s);
    if (filters) ctx.filter = "none";
  }
  // 2. the brand colour washes over it
  ctx.globalAlpha = chat ? pT : 1;
  ctx.fillStyle = cfg.bg;
  ctx.fillRect(0, 0, W, H);
  ctx.globalAlpha = 1;

  // layout of the stack
  const logoMax = unit * 0.26;
  let lw = 0;
  let lh = 0;
  if (cfg.logo && cfg.logoW > 0 && cfg.logoH > 0) {
    const k = Math.min(logoMax / cfg.logoW, logoMax / cfg.logoH);
    lw = cfg.logoW * k;
    lh = cfg.logoH * k;
  }
  const head = cfg.headline.trim()
    ? fitText(ctx, cfg.headline.trim(), 800, cfg.fontFamily, unit * 0.07, W * 0.82, 3)
    : null;
  const headLineH = head ? head.size * 1.18 : 0;
  const headH = head ? head.lines.length * headLineH : 0;
  const ctaFont = unit * 0.043;
  ctx.font = `700 ${ctaFont}px ${cfg.fontFamily}`;
  const ctaText = cfg.cta.trim();
  const ctaW = ctaText ? Math.max(unit * 0.32, ctx.measureText(ctaText).width + ctaFont * 2.6) : 0;
  const ctaH = ctaText ? ctaFont * 2.5 : 0;
  const gap1 = lh && headH ? unit * 0.055 : 0;
  const gap2 = (lh || headH) && ctaH ? unit * 0.06 : 0;
  const total = lh + gap1 + headH + gap2 + ctaH;
  let y = (H - total) / 2;

  // 3. logo pop
  if (lh) {
    const p = beat(u, 360, 560);
    if (p > 0) {
      const s = 0.82 + 0.18 * easeOutBack(p);
      ctx.save();
      ctx.globalAlpha = clamp01(p * 1.6);
      ctx.translate(W / 2, y + lh / 2);
      ctx.scale(s, s);
      ctx.drawImage(cfg.logo!, -lw / 2, -lh / 2, lw, lh);
      ctx.restore();
    }
    y += lh + gap1;
  }

  // 4. headline rises
  if (head) {
    const p = easeOutCubic(beat(u, 520, 560));
    if (p > 0) {
      ctx.save();
      ctx.globalAlpha = p;
      ctx.fillStyle = cfg.fg;
      ctx.font = `800 ${head.size}px ${cfg.fontFamily}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.direction = isRtlText(cfg.headline) ? "rtl" : "ltr";
      const dy = (1 - p) * unit * 0.03;
      head.lines.forEach((l, k) => ctx.fillText(l, W / 2, y + dy + headLineH * (k + 0.5)));
      ctx.restore();
    }
    y += headH + gap2;
  }

  // 5. CTA lands, then pulses once
  if (ctaH) {
    const p = easeOutBack(beat(u, 700, 520));
    if (p > 0) {
      const pulse = Math.sin(Math.PI * beat(u, 1650, 620)) * 0.04;
      const s = (0.9 + 0.1 * p) * (1 + pulse);
      ctx.save();
      ctx.globalAlpha = clamp01(beat(u, 700, 300));
      ctx.translate(W / 2, y + ctaH / 2);
      ctx.scale(s, s);
      ctx.shadowColor = "rgba(0,0,0,0.22)";
      ctx.shadowBlur = ctaH * 0.35;
      ctx.shadowOffsetY = ctaH * 0.12;
      ctx.fillStyle = cfg.ctaBg;
      ctx.beginPath();
      ctx.roundRect(-ctaW / 2, -ctaH / 2, ctaW, ctaH, ctaH / 2);
      ctx.fill();
      ctx.shadowColor = "transparent";
      ctx.fillStyle = cfg.ctaFg;
      ctx.font = `700 ${ctaFont}px ${cfg.fontFamily}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.direction = isRtlText(ctaText) ? "rtl" : "ltr";
      ctx.fillText(ctaText, 0, ctaFont * 0.04);
      ctx.restore();
    }
  }
  ctx.restore();
}

/** The font stack the page uses (next/font family names included) for canvas text. */
export function pageFontFamily(): string {
  if (typeof document === "undefined") return "system-ui, sans-serif";
  const f = getComputedStyle(document.body).fontFamily;
  return f && f.trim() ? f : "system-ui, sans-serif";
}
