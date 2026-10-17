import { snapdom, type SnapdomOptions } from "@zumer/snapdom";

import type { PlatformMotion } from "../components/platforms/types";
import { isLightBackground, paintBackground, paintPhoneShadow, ScreenBackdrop, type BackgroundDef, type PaintOptions } from "./backgrounds";
import {
  buildCameraPath,
  cameraView,
  contentRect,
  planCameraKeys,
  type CameraKey,
  type CameraOptions,
  type CameraPath,
  type CameraState,
  type Rect,
} from "./camera";
import { DEVICE_MARGIN, FALLBACK_DEVICE, type DeviceGeometry, type FrameLayout } from "./layout";
import type { FrameState, Timeline } from "./schedule";

/** Imperative handle onto the off-screen stage that renders the phone. */
export interface StageController {
  /** the capture box: the phone plus DEVICE_MARGIN of transparent padding */
  node: HTMLElement;
  /** synchronously render the conversation state (null = full static thread) */
  render: (state: FrameState | null, clockMs?: number) => void;
}

/**
 * The phone's rounded body: the largest element (the frame root or one of its
 * first two levels of children) with a border-radius. Independent of how
 * DeviceFrame nests its rail / side keys.
 */
function findBody(root: HTMLElement): HTMLElement {
  let best: HTMLElement = root;
  let bestArea = 0;
  const consider = (el: HTMLElement) => {
    const r = parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0;
    const area = el.offsetWidth * el.offsetHeight;
    if (r > 8 && area > bestArea) {
      best = el;
      bestArea = area;
    }
  };
  consider(root);
  for (const c of Array.from(root.children) as HTMLElement[]) {
    consider(c);
    for (const g of Array.from(c.children) as HTMLElement[]) consider(g);
  }
  return best;
}

/** Physical phone footprint and its rounded body (CSS px), measured from the stage. */
export function measureDevice(stage: StageController): DeviceGeometry {
  const root = stage.node.firstElementChild as HTMLElement | null;
  if (!root) return FALLBACK_DEVICE;
  const body = findBody(root);
  const rr = root.getBoundingClientRect();
  const br = body.getBoundingClientRect();
  return {
    w: rr.width,
    h: rr.height,
    body: {
      x: br.left - rr.left,
      y: br.top - rr.top,
      w: br.width,
      h: br.height,
      r: parseFloat(getComputedStyle(body).borderTopLeftRadius) || 0,
    },
  };
}

/** Yield to the event loop without timers (timers are throttled in background tabs). */
export function yieldToEventLoop(): Promise<void> {
  return new Promise((resolve) => {
    const ch = new MessageChannel();
    ch.port1.onmessage = () => {
      ch.port1.close();
      resolve();
    };
    ch.port2.postMessage(0);
  });
}

/**
 * Wait until the (code-split) platform template has actually mounted in the
 * stage — never snapshot the Suspense fallback.
 */
export async function waitForTemplate(stage: StageController, timeoutMs = 8000): Promise<boolean> {
  const t0 = performance.now();
  while (performance.now() - t0 < timeoutMs) {
    if (stage.node.querySelector(".rcss-scroll, [data-mid]")) return true;
    await new Promise<void>((r) => setTimeout(r, 30));
    await yieldToEventLoop();
  }
  return false;
}

/**
 * Strip the phone's own outer drop shadow inside the stage (we paint a softer,
 * background-aware one on the canvas). Inset highlights and hairlines (blur 0)
 * are kept so the rail still looks machined.
 */
export function stripOuterShadow(stage: StageController): void {
  const root = stage.node.firstElementChild as HTMLElement | null;
  if (!root) return;
  stripShadowOf(root);
  const body = findBody(root);
  if (body !== root) stripShadowOf(body);
}

function stripShadowOf(phone: HTMLElement): void {
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

/**
 * Computed properties that never change a static snapshot of a chat template
 * (scrolling, anchor positioning, timelines, print/paged media, ruby, user
 * interaction…). snapdom reads ~480 properties per element on every capture;
 * skipping these makes each capture noticeably cheaper. column-gap / row-gap
 * (flex gaps) and all paint/geometry properties are kept.
 */
const SKIP_STYLE_PROPS =
  /^(scroll-|overscroll-|timeline-|view-timeline|view-transition|trigger-scope|interest-delay|caret-|anchor-|position-anchor|position-area|position-try|position-visibility|break-|orphans$|widows$|column-(count|fill|height|rule|span|width|wrap)|row-rule|rule-overlap|counter-|quotes$|ruby-|-webkit-ruby|math-|text-emphasis|text-combine|-webkit-text-combine|contain-intrinsic|field-sizing|interpolate-size|dynamic-range-limit|frame-sizing|hyphenate-|initial-letter|margin-trim|shape-(image|margin|outside)|buffered-rendering|print-color-adjust|forced-color-adjust|resize$|window-drag|app-region|-webkit-user-|-webkit-tap-highlight|-webkit-locale|-webkit-rtl-ordering|overflow-anchor|text-size-adjust|will-change|caption-side|empty-cells|touch-action|user-select|cursor$|reading-|speak$|interactivity|flex-line-count)/;

/** Snapshot the stage at an exact output scale (dpr pinned to 1 so the size is exact). */
export async function captureStage(stage: StageController, scale: number): Promise<HTMLCanvasElement> {
  // `excludeStyleProps` is supported by snapdom 2.x but missing from its typings
  const opts: SnapdomOptions & { excludeStyleProps?: RegExp } = {
    scale,
    dpr: 1,
    embedFonts: true,
    fast: true,
    cache: "auto",
    backgroundColor: undefined,
    excludeStyleProps: SKIP_STYLE_PROPS,
  };
  return snapdom.toCanvas(stage.node, opts);
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

/** 32-bit FNV-1a over a string (fast enough for a few MB per frame). */
function fnv(str: string, h = 0x811c9dc5): number {
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Longest side (px) of the high-res phone capture used when zooming. */
const MAX_CAPTURE_SIDE = 2800;
/** Memory budget for re-usable phone captures (looping typing dots repeat). */
const CACHE_BYTES = 160 * 1024 * 1024;

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
  totalMs: number;
  /** null = no auto-zoom */
  camera: CameraOptions | null;
}

/**
 * Renders frame i of the video into one reusable output canvas:
 * state → React (sync) → per-platform entrance motion → eased auto-scroll →
 * snapdom capture of the phone (skipped / reused when the DOM is unchanged or
 * repeats) → composite over the pre-painted background + shadow through the
 * auto-zoom camera.
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
  private cache = new Map<string, HTMLCanvasElement>();
  private cacheMax = 2;
  private path: CameraPath | null = null;
  private lastCam: CameraState | null = null;
  /** phone capture resolution relative to layout.scale (>1 when zooming) */
  readonly captureMul: number;
  stats = { captured: 0, reused: 0, cacheHits: 0, captureMs: 0 };

  constructor(private o: FrameRendererOptions) {
    const { W, H, boxW, boxH } = o.layout;
    this.canvas = document.createElement("canvas");
    this.canvas.width = W;
    this.canvas.height = H;
    const ctx = this.canvas.getContext("2d", { alpha: false });
    if (!ctx) throw new Error("CANVAS_UNAVAILABLE");
    this.ctx = ctx;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    const zoom = o.camera ? o.camera.maxZoom : 1;
    this.captureMul = Math.max(1, Math.min(zoom, MAX_CAPTURE_SIDE / Math.max(boxW, boxH)));
    const capBytes = boxW * boxH * this.captureMul * this.captureMul * 4;
    this.cacheMax = Math.max(2, Math.min(24, Math.floor(CACHE_BYTES / capBytes)));

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
        paintPhoneShadow(this.shadowLayer.getContext("2d")!, W, H, phone, light);
      }
    } else {
      this.base = document.createElement("canvas");
      this.base.width = W;
      this.base.height = H;
      const b = this.base.getContext("2d", { alpha: false })!;
      paintBackground(b, W, H, this.o.background, this.o.paint);
      if (framed) paintPhoneShadow(b, W, H, phone, light);
    }
  }

  /* ------------------------------------------------------------ camera */

  /** CSS rect inside the stage → scene px. */
  private toScene(r: DOMRect, nodeRect: DOMRect): Rect {
    const { x, y, scale } = this.o.layout;
    return {
      x: x + (r.left - nodeRect.left) * scale,
      y: y + (r.top - nodeRect.top) * scale,
      w: r.width * scale,
      h: r.height * scale,
    };
  }

  private scrollAllToBottom() {
    this.o.stage.node.querySelectorAll<HTMLElement>(".rcss-scroll").forEach((el) => {
      el.scrollTop = el.scrollHeight;
    });
  }

  /**
   * Measure where every focus target settles (after its entrance and the
   * auto-scroll) by rendering those states once without capturing, then
   * integrate the camera path. Must run before frame(0).
   */
  async prepareCamera(): Promise<void> {
    const cam = this.o.camera;
    if (!cam) return;
    const { stage, timeline, introMs, rtl } = this.o;
    const node = stage.node;
    const keys: CameraKey[] = [];
    let themSide: "left" | "right" | null = null;

    const measureRow = (id: string): Rect | null => {
      const row = node.querySelector<HTMLElement>(`[data-mid="${CSS.escape(id)}"]`);
      if (!row) return null;
      const r = contentRect(row);
      return r ? this.toScene(r, node.getBoundingClientRect()) : null;
    };

    const events = [
      ...timeline.reveals.map((r) => ({ at: r.at, kind: "reveal" as const, id: r.id, sender: r.sender })),
      ...timeline.typings.map((w) => ({ at: w.start, kind: "typing" as const, id: "", sender: "them" as const })),
    ].sort((a, b) => a.at - b.at);

    for (const ev of events) {
      const st = timeline.stateAt(ev.at + 1);
      if (ev.kind === "typing") {
        // render once without the indicator so we can tell which nodes it adds
        stage.render({ ...st, typing: false }, ev.at + 1);
        this.before = new Set(node.querySelectorAll("*"));
      }
      stage.render(st, ev.at + 1);
      this.scrollAllToBottom();
      if (ev.kind === "reveal") {
        const rect = measureRow(ev.id);
        const idx = timeline.reveals.findIndex((r) => r.id === ev.id);
        const context = idx > 0 ? measureRow(timeline.reveals[idx - 1].id) : null;
        if (rect) {
          keys.push({ at: introMs + ev.at, focus: rect, context });
          if (ev.sender === "them" && !themSide) {
            const { phone } = this.o.layout;
            themSide = rect.x + rect.w / 2 < phone.x + phone.w / 2 ? "left" : "right";
          }
        }
      } else {
        const prev = [...timeline.reveals].reverse().find((r) => r.at <= ev.at);
        const lastReveal = prev ? measureRow(prev.id) : null;
        keys.push({
          at: introMs + ev.at,
          focus: this.measureTyping(themSide ?? (rtl ? "right" : "left"), lastReveal),
          context: lastReveal,
        });
      }
    }
    await yieldToEventLoop();

    const { W, H, phone } = this.o.layout;
    const planned = planCameraKeys(keys, this.o.totalMs, introMs + timeline.contentMs, cam);
    this.path = buildCameraPath(planned, { W, H, phone }, cam, this.o.totalMs);
    // reset so frame 0 starts from a clean scroll state
    this.scroll.clear();
    this.first = true;
  }

  private before: Set<Element> | null = null;

  /**
   * Typing indicator focus. Templates don't tag the indicator, so diff the DOM
   * with and without it: the nodes it adds inside the thread are the bubble.
   * If the app only shows "typing…" in the header, keep framing the latest
   * message (or the bottom of the thread on the other party's side).
   */
  private measureTyping(side: "left" | "right", fallback: Rect | null): Rect | null {
    const node = this.o.stage.node;
    const nodeRect = node.getBoundingClientRect();
    const before = this.before ?? new Set<Element>();
    this.before = null;
    let left = Infinity;
    let top = Infinity;
    let right = -Infinity;
    let bottom = -Infinity;
    node.querySelectorAll(".rcss-scroll *").forEach((el) => {
      // only the top-most nodes the indicator added
      if (before.has(el) || (el.parentElement && !before.has(el.parentElement))) return;
      const r = el.getBoundingClientRect();
      if (r.width < 1 || r.height < 1) return;
      left = Math.min(left, r.left);
      top = Math.min(top, r.top);
      right = Math.max(right, r.right);
      bottom = Math.max(bottom, r.bottom);
    });
    if (Number.isFinite(left)) {
      // the indicator row may be full width: keep only the speaker's side
      const sr = node.querySelector(".rcss-scroll")?.getBoundingClientRect();
      let rect = new DOMRect(left, top, right - left, bottom - top);
      if (sr && rect.width > sr.width * 0.8) {
        const w = Math.min(rect.width, sr.width * 0.4);
        rect = new DOMRect(side === "left" ? rect.left : rect.right - w, rect.top, w, rect.height);
      }
      return this.toScene(rect, nodeRect);
    }
    // header-only indicator (e.g. Telegram Android): hold on the last message,
    // or stay wide if nothing has been said yet
    return fallback;
  }

  /* ------------------------------------------------------------ frames */

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

  private signature(): string {
    const node = this.o.stage.node;
    let s = "";
    node.querySelectorAll<HTMLElement>(".rcss-scroll").forEach((el) => {
      s += `${el.scrollTop.toFixed(2)},`;
    });
    const html = node.innerHTML;
    return `${fnv(html).toString(36)}:${fnv(html, 0x12345678).toString(36)}:${html.length}:${s}`;
  }

  async frame(i: number): Promise<HTMLCanvasElement> {
    const tOut = (i * 1000) / this.o.fps;
    const t = this.timeOf(i);
    const tl = Math.max(0, t);
    const { stage, timeline, layout } = this.o;

    stage.render(timeline.stateAt(tl), tl);
    this.applyMotion(tl);
    const scrolled = this.applyScroll(tl);
    const mutated = this.observer.takeRecords().length > 0;

    let phoneChanged = false;
    if (this.first || mutated || scrolled || !this.phone) {
      this.first = false;
      const sig = this.signature();
      const hit = this.cache.get(sig);
      if (hit) {
        // LRU bump
        this.cache.delete(sig);
        this.cache.set(sig, hit);
        if (hit !== this.phone) phoneChanged = true;
        this.phone = hit;
        this.stats.cacheHits++;
      } else {
        const t0 = performance.now();
        const next = await captureStage(stage, layout.scale * this.captureMul);
        this.stats.captureMs += performance.now() - t0;
        this.stats.captured++;
        this.cache.set(sig, next);
        while (this.cache.size > this.cacheMax) {
          const [k, c] = this.cache.entries().next().value as [string, HTMLCanvasElement];
          this.cache.delete(k);
          if (c !== next) release(c);
        }
        this.phone = next;
        phoneChanged = true;
      }
    } else {
      this.stats.reused++;
    }

    const cam = this.path ? this.path.at(tOut) : null;
    const camChanged =
      !!cam &&
      (!this.lastCam ||
        Math.abs(cam.scale - this.lastCam.scale) > 1e-5 ||
        Math.abs(cam.cx - this.lastCam.cx) > 1e-3 ||
        Math.abs(cam.cy - this.lastCam.cy) > 1e-3);
    if (phoneChanged || camChanged || i === 0) this.composite(cam);
    this.lastCam = cam;
    return this.canvas;
  }

  private composite(cam: CameraState | null) {
    const { ctx } = this;
    const { W, H, x, y, boxW, boxH, scale } = this.o.layout;
    const phone = this.phone!;
    const s = cam?.scale ?? 1;
    const v = cam ? cameraView(cam, { W, H }) : { x: 0, y: 0, w: W, h: H };
    const identity = s === 1 && v.x === 0 && v.y === 0;

    if (this.backdrop) {
      const m = DEVICE_MARGIN * scale * this.captureMul;
      this.backdrop.paint(ctx, W, H, phone, phone.width - m * 2, phone.height - m * 2);
      if (this.shadowLayer) {
        if (identity) ctx.drawImage(this.shadowLayer, 0, 0);
        else ctx.drawImage(this.shadowLayer, v.x, v.y, v.w, v.h, 0, 0, W, H);
      }
    } else if (this.base) {
      if (identity) ctx.drawImage(this.base, 0, 0);
      else ctx.drawImage(this.base, v.x, v.y, v.w, v.h, 0, 0, W, H);
    }

    if (identity && this.captureMul === 1) {
      ctx.drawImage(phone, x, y); // 1:1, no resampling
    } else {
      ctx.drawImage(phone, (x - v.x) * s, (y - v.y) * s, boxW * s, boxH * s);
    }
  }

  dispose() {
    this.observer.disconnect();
    for (const el of this.styled) {
      el.style.opacity = "";
      el.style.transform = "";
      el.style.transformOrigin = "";
    }
    for (const c of this.cache.values()) release(c);
    this.cache.clear();
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
  if (layout.framed) paintPhoneShadow(ctx, layout.W, layout.H, layout.phone, light);
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
