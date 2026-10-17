/**
 * Backgrounds painted straight onto the output canvas (never through the DOM),
 * so they are pixel-identical in the dialog preview and the exported video.
 * Gradients get a fixed, very light dither so they don't band after H.264
 * 4:2:0 compression; the grain is static, so it costs almost no bitrate.
 */

export type BackgroundId =
  | "studio"
  | "aurora"
  | "brand"
  | "sunset"
  | "mist"
  | "mint"
  | "screen"
  | "white"
  | "black"
  | "custom";

export interface BackgroundDef {
  id: BackgroundId;
  /** true = drawn from the current phone frame each frame (blurred screen) */
  dynamic?: boolean;
  /** light backgrounds get a softer, lower-contrast phone shadow */
  light?: boolean;
}

export const BACKGROUNDS: BackgroundDef[] = [
  { id: "studio" },
  { id: "aurora" },
  { id: "brand" },
  { id: "sunset" },
  { id: "screen", dynamic: true },
  { id: "mist", light: true },
  { id: "mint" },
  { id: "white", light: true },
  { id: "black" },
  { id: "custom" },
];

export interface PaintOptions {
  /** platform brand colour, e.g. #25d366 */
  accent: string;
  /** colour used by the "custom" background */
  custom: string;
}

type Ctx = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

function hexToRgb(hex: string): [number, number, number] {
  let h = hex.replace("#", "").trim();
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const n = parseInt(h.slice(0, 6), 16);
  if (Number.isNaN(n)) return [0, 0, 0];
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgb([r, g, b]: [number, number, number], a = 1): string {
  return `rgba(${Math.round(r)},${Math.round(g)},${Math.round(b)},${a})`;
}

function mix(a: [number, number, number], b: [number, number, number], t: number): [number, number, number] {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

/** Relative luminance 0..1 of a hex colour. */
export function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function isLightBackground(bg: BackgroundDef, opts: PaintOptions): boolean {
  if (bg.id === "custom") return luminance(opts.custom) > 0.45;
  if (bg.id === "brand") return luminance(opts.accent) > 0.6; // e.g. Snapchat yellow
  return !!bg.light;
}

function linear(ctx: Ctx, W: number, H: number, angleDeg: number, stops: [number, string][]) {
  const a = (angleDeg * Math.PI) / 180;
  const len = Math.abs(W * Math.sin(a)) + Math.abs(H * Math.cos(a));
  const cx = W / 2;
  const cy = H / 2;
  const dx = (Math.sin(a) * len) / 2;
  const dy = (-Math.cos(a) * len) / 2;
  const g = ctx.createLinearGradient(cx - dx, cy - dy, cx + dx, cy + dy);
  for (const [o, c] of stops) g.addColorStop(o, c);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

/** A soft colour glow (radial falloff with a smooth tail, no hard edge). */
function glow(ctx: Ctx, W: number, H: number, x: number, y: number, r: number, color: [number, number, number], alpha: number) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, rgb(color, alpha));
  g.addColorStop(0.35, rgb(color, alpha * 0.62));
  g.addColorStop(0.7, rgb(color, alpha * 0.18));
  g.addColorStop(1, rgb(color, 0));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

function vignette(ctx: Ctx, W: number, H: number, strength: number) {
  const r = Math.hypot(W, H) / 2;
  const g = ctx.createRadialGradient(W / 2, H / 2, r * 0.45, W / 2, H / 2, r);
  g.addColorStop(0, "rgba(0,0,0,0)");
  g.addColorStop(1, `rgba(0,0,0,${strength})`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

/** Static ±1.5 level grain: breaks up gradient banding after compression. */
function dither(ctx: Ctx, W: number, H: number) {
  const tile = 128;
  const data = new ImageData(tile, tile);
  let seed = 1337;
  for (let i = 0; i < data.data.length; i += 4) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    const v = seed >>> 24;
    data.data[i] = data.data[i + 1] = data.data[i + 2] = v > 127 ? 255 : 0;
    data.data[i + 3] = 3 + ((seed >>> 8) & 3); // ~1.5% alpha
  }
  const c = new OffscreenCanvas(tile, tile);
  c.getContext("2d")!.putImageData(data, 0, 0);
  const p = ctx.createPattern(c, "repeat");
  if (!p) return;
  ctx.save();
  ctx.globalCompositeOperation = "soft-light";
  ctx.fillStyle = p;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
}

/** Paint a static background. The "screen" background is painted by
 *  `paintScreenBackground` per frame; here it gets a neutral placeholder. */
export function paintBackground(ctx: Ctx, W: number, H: number, bg: BackgroundDef, opts: PaintOptions): void {
  const m = Math.max(W, H);
  ctx.save();
  switch (bg.id) {
    case "studio": {
      linear(ctx, W, H, 160, [
        [0, "#1d2a3a"],
        [0.55, "#111a25"],
        [1, "#070b11"],
      ]);
      glow(ctx, W, H, W * 0.2, H * 0.12, m * 0.6, [86, 126, 178], 0.28);
      glow(ctx, W, H, W * 0.9, H * 0.95, m * 0.5, [40, 70, 110], 0.22);
      vignette(ctx, W, H, 0.35);
      dither(ctx, W, H);
      break;
    }
    case "aurora": {
      ctx.fillStyle = "#0b0a1a";
      ctx.fillRect(0, 0, W, H);
      glow(ctx, W, H, W * 0.12, H * 0.18, m * 0.62, [124, 58, 237], 0.85);
      glow(ctx, W, H, W * 0.92, H * 0.3, m * 0.55, [37, 99, 235], 0.75);
      glow(ctx, W, H, W * 0.25, H * 0.92, m * 0.6, [236, 72, 153], 0.6);
      glow(ctx, W, H, W * 0.85, H * 0.88, m * 0.5, [20, 184, 166], 0.55);
      vignette(ctx, W, H, 0.25);
      dither(ctx, W, H);
      break;
    }
    case "brand": {
      const a = hexToRgb(opts.accent);
      const deep = mix(a, [8, 10, 14], 0.72);
      const mid = mix(a, [8, 10, 14], 0.35);
      linear(ctx, W, H, 155, [
        [0, rgb(mid)],
        [1, rgb(deep)],
      ]);
      glow(ctx, W, H, W * 0.15, H * 0.1, m * 0.6, mix(a, [255, 255, 255], 0.15), 0.55);
      glow(ctx, W, H, W * 0.95, H * 0.9, m * 0.5, a, 0.35);
      vignette(ctx, W, H, 0.3);
      dither(ctx, W, H);
      break;
    }
    case "sunset": {
      linear(ctx, W, H, 150, [
        [0, "#ffb88c"],
        [0.45, "#f0657a"],
        [1, "#5b2a86"],
      ]);
      glow(ctx, W, H, W * 0.8, H * 0.12, m * 0.5, [255, 214, 165], 0.55);
      glow(ctx, W, H, W * 0.1, H * 0.95, m * 0.5, [60, 20, 110], 0.4);
      dither(ctx, W, H);
      break;
    }
    case "mist": {
      linear(ctx, W, H, 165, [
        [0, "#f7f8fb"],
        [1, "#dfe5ee"],
      ]);
      glow(ctx, W, H, W * 0.15, H * 0.1, m * 0.55, [255, 255, 255], 0.9);
      glow(ctx, W, H, W * 0.9, H * 0.92, m * 0.5, [196, 208, 226], 0.5);
      dither(ctx, W, H);
      break;
    }
    case "mint": {
      linear(ctx, W, H, 160, [
        [0, "#0f766e"],
        [1, "#042f2a"],
      ]);
      glow(ctx, W, H, W * 0.18, H * 0.12, m * 0.6, [45, 212, 191], 0.35);
      vignette(ctx, W, H, 0.3);
      dither(ctx, W, H);
      break;
    }
    case "screen": {
      ctx.fillStyle = "#1a1d22";
      ctx.fillRect(0, 0, W, H);
      break;
    }
    case "white": {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, W, H);
      break;
    }
    case "black": {
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, W, H);
      break;
    }
    case "custom": {
      ctx.fillStyle = opts.custom;
      ctx.fillRect(0, 0, W, H);
      break;
    }
  }
  ctx.restore();
}

/**
 * "Blurred screen" background: the current phone frame, scaled to cover the
 * output and heavily blurred and dimmed (like an iOS-style backdrop). Blurring
 * happens on a tiny canvas, so it costs ~1 ms per frame.
 */
export class ScreenBackdrop {
  private small: OffscreenCanvas;
  private sctx: OffscreenCanvasRenderingContext2D;

  constructor() {
    this.small = new OffscreenCanvas(72, 128);
    this.sctx = this.small.getContext("2d", { willReadFrequently: false })!;
  }

  paint(ctx: Ctx, W: number, H: number, phone: CanvasImageSource, srcW: number, srcH: number) {
    const sw = this.small.width;
    const sh = this.small.height;
    // cover-fit the phone's screen area into the small canvas, blurred
    const k = Math.max(sw / srcW, sh / srcH) * 1.25;
    this.sctx.save();
    this.sctx.fillStyle = "#1a1d22";
    this.sctx.fillRect(0, 0, sw, sh);
    this.sctx.filter = "blur(6px)";
    this.sctx.drawImage(phone, (sw - srcW * k) / 2, (sh - srcH * k) / 2, srcW * k, srcH * k);
    this.sctx.restore();

    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    // a second, larger blur while upscaling hides the low resolution entirely
    ctx.filter = `blur(${Math.round(Math.max(W, H) / 60)}px) saturate(1.25)`;
    const bleed = Math.max(W, H) * 0.08;
    ctx.drawImage(this.small, -bleed, -bleed, W + bleed * 2, H + bleed * 2);
    ctx.filter = "none";
    ctx.fillStyle = "rgba(0,0,0,0.38)";
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
    vignette(ctx, W, H, 0.3);
  }
}

/** Natural two-layer phone shadow: a wide ambient shadow + a tight contact shadow. */
export function paintPhoneShadow(
  ctx: Ctx,
  phone: { x: number; y: number; w: number; h: number; r: number },
  light: boolean,
): void {
  const { x, y, w, h, r } = phone;
  const layers = light
    ? [
        { blur: h * 0.07, dy: h * 0.035, a: 0.22 },
        { blur: h * 0.018, dy: h * 0.008, a: 0.18 },
      ]
    : [
        { blur: h * 0.08, dy: h * 0.04, a: 0.55 },
        { blur: h * 0.02, dy: h * 0.01, a: 0.45 },
      ];
  ctx.save();
  for (const l of layers) {
    ctx.shadowColor = `rgba(0,0,0,${l.a})`;
    ctx.shadowBlur = l.blur;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = l.dy;
    ctx.fillStyle = "#16161a";
    ctx.beginPath();
    // inset by 1px so the fill can never peek out from under the phone's anti-aliased edge
    ctx.roundRect(x + 1, y + 1, w - 2, h - 2, Math.max(0, r - 1));
    ctx.fill();
  }
  ctx.restore();
}
