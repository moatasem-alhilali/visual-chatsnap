import { snapdom } from "@zumer/snapdom";

import type { PlatformMotion } from "../components/platforms/types";
import { isLightBackground, paintBackground, paintPhoneShadow, ScreenBackdrop, type BackgroundDef, type PaintOptions } from "./backgrounds";
import { DEVICE_MARGIN, type FrameLayout } from "./layout";
import type { FrameState, Timeline } from "./schedule";

/** Imperative handle onto the off-screen stage that renders the phone. */
export interface StageController {
  /** the capture box: the phone plus DEVICE_MARGIN of transparent padding */
  node: HTMLElement;
  /** synchronously render the conversation state (null = full static thread) */
  render: (state: FrameState | null, clockMs?: number) => void;
}

/** Physical phone size (CSS px) and corner radius, measured from the stage. */
export function measureDevice(stage: StageController): { w: number; h: number; radius: number } {
  const phone = stage.node.firstElementChild as HTMLElement | null;
  if (!phone) return { w: 393, h: 852, radius: 68 };
  const radius = parseFloat(getComputedStyle(phone).borderTopLeftRadius) || 0;
  return { w: phone.offsetWidth, h: phone.offsetHeight, radius };
}

/**
 * Strip the phone's own outer drop shadow inside the stage (we paint a softer,
 * background-aware one on the canvas). Inset highlights and hairlines (blur 0)
 * are kept so the rail still looks machined.
 */
export function stripOuterShadow(stage: StageController): void {
  const phone = stage.node.firstElementChild as HTMLElement | null;
  if (!phone) return;
  const parts = getComputedStyle(phone).boxShadow.split(/,(?![^(]*\))/).map((s) => s.trim());
  const keep = parts.filter((p) => {
    if (p === "none" || !p) return false;
    if (/\binset\b/.test(p)) return true;
    const nums = p.replace(/rgba?\([^)]*\)/g, "").match(/-?[\d.]+px/g)?.map(parseFloat) ?? [];
    const [dx = 0, dy = 0, blur = 0] = nums;
    return blur === 0 && dx === 0 && dy === 0;
  });
  phone.style.setProperty("box-shadow", keep.length ? keep.join(", ") : "none", "important");
}

/** Snapshot the stage at an exact output scale (dpr pinned to 1 so the size is exact). */
export async function captureStage(stage: StageController, scale: number): Promise<HTMLCanvasElement> {
  return snapdom.toCanvas(stage.node, {
    scale,
    dpr: 1,
    embedFonts: true,
    fast: true,
    cache: "auto",
    backgroundColor: undefined,
  });
}

const SCROLL_MS = 340;
const easeOutCubic = (p: number) => 1 - Math.pow(1 - p, 3);

interface ScrollTween {
  from: number;
  to: number;
  start: number;
  value: number;
}

/** Releases a canvas' backing store right away instead of waiting for GC. */
function release(c: HTMLCanvasElement | null) {
  if (c) {
    c.width = 0;
    c.height = 0;
  }
}

export interface FrameRendererOptions {
  stage: StageController;
  timeline: Timeline;
  motion: PlatformMotion;
  rtl: boolean;
  layout: FrameLayout;
  background: BackgroundDef;
  paint: PaintOptions;
  fps: number;
  introMs: number;
}

/**
 * Renders frame i of the video into one reusable output canvas:
 * state → React (sync) → per-platform entrance motion → eased auto-scroll →
 * snapdom capture of the phone (skipped when nothing changed) → composite
 * over the pre-painted background + shadow.
 */
export class FrameRenderer {
  readonly canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private base: HTMLCanvasElement | null = null;
  private shadowLayer: HTMLCanvasElement | null = null;
  private backdrop: ScreenBackdrop | null = null;
  private phone: HTMLCanvasElement | null = null;
  private observer: MutationObserver;
  private scroll = new Map<HTMLElement, ScrollTween>();
  private styled = new Set<HTMLElement>();
  private first = true;
  stats = { captured: 0, reused: 0, captureMs: 0 };

  constructor(private o: FrameRendererOptions) {
    const { W, H } = o.layout;
    this.canvas = document.createElement("canvas");
    this.canvas.width = W;
    this.canvas.height = H;
    const ctx = this.canvas.getContext("2d", { alpha: false });
    if (!ctx) throw new Error("CANVAS_UNAVAILABLE");
    this.ctx = ctx;
    this.observer = new MutationObserver(() => {});
    this.observer.observe(o.stage.node, { subtree: true, childList: true, attributes: true, characterData: true });
    this.prepareLayers();
  }

  private prepareLayers() {
    const { W, H, phone, framed } = this.o.layout;
    const light = isLightBackground(this.o.background, this.o.paint);
    if (this.o.background.dynamic) {
      this.backdrop = new ScreenBackdrop();
      if (framed) {
        this.shadowLayer = document.createElement("canvas");
        this.shadowLayer.width = W;
        this.shadowLayer.height = H;
        paintPhoneShadow(this.shadowLayer.getContext("2d")!, phone, light);
      }
    } else {
      this.base = document.createElement("canvas");
      this.base.width = W;
      this.base.height = H;
      const b = this.base.getContext("2d", { alpha: false })!;
      paintBackground(b, W, H, this.o.background, this.o.paint);
      if (framed) paintPhoneShadow(b, phone, light);
    }
  }

  /** timeline time (ms) of output frame i */
  timeOf(i: number): number {
    return (i * 1000) / this.o.fps - this.o.introMs;
  }

  private applyMotion(t: number) {
    const { motion, timeline, rtl, stage } = this.o;
    const seen = new Set<HTMLElement>();
    stage.node.querySelectorAll<HTMLElement>("[data-mid]").forEach((el) => {
      const at = timeline.revealAt.get(el.dataset.mid ?? "");
      if (at === undefined) return;
      const age = t - at;
      if (age >= 0 && age < motion.enterMs) {
        const st = motion.enterStyle(age / motion.enterMs, el.dataset.sender === "me", rtl);
        const op = st.opacity === undefined ? "" : String(st.opacity);
        if (el.style.opacity !== op) el.style.opacity = op;
        if (el.style.transform !== (st.transform ?? "")) el.style.transform = st.transform ?? "";
        if (el.style.transformOrigin !== (st.transformOrigin ?? "")) el.style.transformOrigin = st.transformOrigin ?? "";
        seen.add(el);
      }
    });
    // settle rows that just finished their entrance
    for (const el of this.styled) {
      if (seen.has(el)) continue;
      el.style.opacity = "";
      el.style.transform = "";
      el.style.transformOrigin = "";
    }
    this.styled = seen;
  }

  /** Time-based eased auto-scroll to the bottom; returns true if any position changed. */
  private applyScroll(t: number): boolean {
    let changed = false;
    this.o.stage.node.querySelectorAll<HTMLElement>(".rcss-scroll").forEach((el) => {
      const target = Math.max(0, el.scrollHeight - el.clientHeight);
      let tw = this.scroll.get(el);
      if (!tw) {
        tw = { from: target, to: target, start: t, value: target };
        this.scroll.set(el, tw);
      } else if (Math.abs(tw.to - target) > 0.5) {
        tw.from = tw.value;
        tw.to = target;
        tw.start = t;
      }
      const p = Math.min(1, Math.max(0, (t - tw.start) / SCROLL_MS));
      tw.value = tw.from + (tw.to - tw.from) * easeOutCubic(p);
      const before = el.scrollTop;
      el.scrollTop = tw.value;
      if (Math.abs(el.scrollTop - before) > 0.01) changed = true;
    });
    return changed;
  }

  async frame(i: number): Promise<HTMLCanvasElement> {
    const t = this.timeOf(i);
    const tl = Math.max(0, t);
    const { stage, timeline, layout } = this.o;

    stage.render(timeline.stateAt(tl), tl);
    this.applyMotion(tl);
    const scrolled = this.applyScroll(tl);
    const mutated = this.observer.takeRecords().length > 0;

    if (this.first || mutated || scrolled || !this.phone) {
      this.first = false;
      const t0 = performance.now();
      const next = await captureStage(stage, layout.scale);
      this.stats.captureMs += performance.now() - t0;
      this.stats.captured++;
      release(this.phone);
      this.phone = next;
      this.composite();
    } else {
      this.stats.reused++;
    }
    return this.canvas;
  }

  private composite() {
    const { ctx } = this;
    const { W, H, x, y, scale } = this.o.layout;
    const phone = this.phone!;
    if (this.backdrop) {
      // blur only the phone's screen area (skip the transparent margin + bezel)
      const m = DEVICE_MARGIN * scale;
      this.backdrop.paint(ctx, W, H, phone, phone.width - m * 2, phone.height - m * 2);
      if (this.shadowLayer) ctx.drawImage(this.shadowLayer, 0, 0);
    } else if (this.base) {
      ctx.drawImage(this.base, 0, 0);
    }
    ctx.drawImage(phone, x, y);
  }

  dispose() {
    this.observer.disconnect();
    for (const el of this.styled) {
      el.style.opacity = "";
      el.style.transform = "";
      el.style.transformOrigin = "";
    }
    release(this.phone);
    release(this.base);
    release(this.shadowLayer);
    release(this.canvas);
    this.phone = this.base = this.shadowLayer = null;
  }
}

/** Composite a layout preview (background + shadow + a phone snapshot) into a small canvas. */
export function paintPreview(
  canvas: HTMLCanvasElement,
  layout: FrameLayout,
  background: BackgroundDef,
  paint: PaintOptions,
  phone: HTMLCanvasElement | null,
  phoneScale: number,
  backdrop: ScreenBackdrop,
): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const k = canvas.width / layout.W;
  ctx.setTransform(k, 0, 0, k, 0, 0);
  ctx.imageSmoothingQuality = "high";
  const light = isLightBackground(background, paint);
  if (background.dynamic && phone) {
    const m = DEVICE_MARGIN * phoneScale;
    backdrop.paint(ctx, layout.W, layout.H, phone, phone.width - m * 2, phone.height - m * 2);
  } else {
    paintBackground(ctx, layout.W, layout.H, background, paint);
  }
  if (layout.framed) paintPhoneShadow(ctx, layout.phone, light);
  if (phone) {
    ctx.drawImage(phone, layout.x, layout.y, layout.boxW, layout.boxH);
  } else {
    ctx.fillStyle = "rgba(20,20,24,0.9)";
    ctx.beginPath();
    ctx.roundRect(layout.phone.x, layout.phone.y, layout.phone.w, layout.phone.h, layout.phone.r);
    ctx.fill();
  }
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}
