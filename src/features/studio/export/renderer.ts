import { snapdom, type SnapdomOptions, type SnapdomPlugin } from "@zumer/snapdom";

import type { PlatformMotion } from "../components/platforms/types";
import { isLightBackground, paintBackground, paintPhoneShadow, ScreenBackdrop, type BackgroundDef, type PaintOptions } from "./backgrounds";
import { KEYBOARD_SLIDE_MS } from "../playback/compose";
import {
  buildCameraPath,
  CAMERA_LEAD_MS,
  cameraView,
  contentRect,
  planCameraKeys,
  union,
  type CameraKey,
  type CameraOptions,
  type CameraPath,
  type CameraState,
  type Rect,
} from "./camera";
import { DEVICE_MARGIN, FALLBACK_DEVICE, type DeviceGeometry, type FrameLayout } from "./layout";
import type { FrameState, Timeline } from "./schedule";
import {
  chatTimeAt,
  outputTimeOf,
  paintCaption,
  paintEndCard,
  paintWatermark,
  type CaptionConfig,
  type EndCardConfig,
  type SceneTiming,
  type WatermarkConfig,
} from "./scenes";

/** Extra, non-chat state of the stage (the notification intro). */
export interface StageScene {
  /** ms into the video while the notification intro is on screen; null = plain chat */
  introT: number | null;
}

/** Imperative handle onto the off-screen stage that renders the phone. */
export interface StageController {
  /** the capture box: the phone plus DEVICE_MARGIN of transparent padding */
  node: HTMLElement;
  /** synchronously render the conversation state (null = full static thread) */
  render: (state: FrameState | null, clockMs?: number, scene?: StageScene | null) => void;
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

/** Screen px per CSS px of `el` (≠ 1 when an ancestor is scaled). */
function ancestorScale(el: HTMLElement, rect: DOMRect = el.getBoundingClientRect()): number {
  return el.offsetWidth > 0 && rect.width > 0 ? rect.width / el.offsetWidth : 1;
}

/** Physical phone footprint and its rounded body (CSS px), measured from the stage. */
export function measureDevice(stage: StageController): DeviceGeometry {
  const root = stage.node.firstElementChild as HTMLElement | null;
  if (!root) return FALLBACK_DEVICE;
  const body = findBody(root);
  const rr = root.getBoundingClientRect();
  const br = body.getBoundingClientRect();
  // client rects include any ancestor transform: divide it out (CSS px)
  const k = ancestorScale(root, rr);
  return {
    w: rr.width / k,
    h: rr.height / k,
    body: {
      x: (br.left - rr.left) / k,
      y: (br.top - rr.top) / k,
      w: br.width / k,
      h: br.height / k,
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

/**
 * snapdom treats every padded text block as having a styled ::first-letter
 * (the pseudo never inherits padding, so its computed style "differs") and
 * wraps the first letter in its own span. That breaks the kerning pair after
 * it, which makes tight shrink-wrapped bubbles re-wrap in the export (e.g.
 * iMessage "Arrives in 2 days" → "Arrives in 2 / days"). No template styles
 * ::first-letter, so merge those spans back into plain text after cloning.
 */
const unsplitFirstLetter: SnapdomPlugin = {
  name: "scenora-unsplit-first-letter",
  afterClone(ctx) {
    const root = ctx.clone;
    if (!root) return;
    root.querySelectorAll("[data-snapdom-pseudo=\"::first-letter\"]").forEach((span) => {
      const parent = span.parentNode;
      if (!parent) return;
      parent.replaceChild(document.createTextNode(span.textContent ?? ""), span);
      parent.normalize();
    });
  },
};

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
    plugins: [unsplitFirstLetter],
  };
  return snapdom.toCanvas(stage.node, opts);
}

/**
 * Scroll a chat list and notify its listeners synchronously. Real scroll events
 * are dispatched on the next animation frame (or never, in a background tab),
 * which is too late for templates that repaint on scroll (screen-anchored
 * bubble gradients, jump-to-bottom buttons) before the frame is captured.
 */
export function scrollChat(el: HTMLElement, top: number): void {
  el.scrollTop = top;
  el.dispatchEvent(new Event("scroll"));
}

/** Approximate phone bezel (CSS px) skipped when sampling the screen for the blurred backdrop. */
const BEZEL_GUESS = 18;

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
/** A composer must be within this fraction of the screen height (bottom bar, not the whole screen). */
const COMPOSER_MAX_H = 0.32;
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
  /** output-time structure (intro scene, holds, end card) */
  timing: SceneTiming;
  /** null = no auto-zoom */
  camera: CameraOptions | null;
  /** closing scene drawn after the chat (null = none) */
  endCard?: EndCardConfig | null;
  /** fixed caption above/below the phone (null = none) */
  caption?: CaptionConfig | null;
  /** cap for the high-res phone capture (stills can afford more) */
  maxCaptureSide?: number;
  /**
   * Playback speed the (already scaled, see export/speed.ts) timeline was
   * built for: the template clock (typing dots, keyboard key pops), entrance
   * motion and auto-scroll run this much faster too. Default 1.
   */
  speed?: number;
  /** brand corner drawn on every frame in screen space (null = none) */
  watermark?: WatermarkConfig | null;
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
  /** the last chat frame, frozen for the end-card transition */
  private lastChat: HTMLCanvasElement | null = null;
  /** the output canvas holds something other than the current chat composite */
  private dirty = false;
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
    this.captureMul = Math.max(1, Math.min(zoom, (o.maxCaptureSide ?? MAX_CAPTURE_SIDE) / Math.max(boxW, boxH)));
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
    const { x, y } = this.o.layout;
    // client rects are in screen px: divide out any ancestor transform first
    const scale = this.o.layout.scale / ancestorScale(this.o.stage.node, nodeRect);
    return {
      x: x + (r.left - nodeRect.left) * scale,
      y: y + (r.top - nodeRect.top) * scale,
      w: r.width * scale,
      h: r.height * scale,
    };
  }

  private scrollAllToBottom() {
    this.o.stage.node.querySelectorAll<HTMLElement>(".rcss-scroll").forEach((el) => scrollChat(el, el.scrollHeight));
  }

  /**
   * Measure where every focus target settles (after its entrance and the
   * auto-scroll) by rendering those states once without capturing, then
   * integrate the camera path. Must run before frame(0).
   */
  async prepareCamera(): Promise<void> {
    const cam = this.o.camera;
    if (!cam) return;
    const { stage, timeline, timing, rtl } = this.o;
    const node = stage.node;
    const keys: CameraKey[] = [];
    let themSide: "left" | "right" | null = null;
    const out = (chatMs: number) => outputTimeOf(timing, chatMs);
    // events before the chat opens (notification intro) are already on screen
    const live = (chatMs: number) => !timing.leadMs || chatMs > timing.skipMs;

    const measureRow = (id: string): Rect | null => {
      const row = node.querySelector<HTMLElement>(`[data-mid="${CSS.escape(id)}"]`);
      if (!row) return null;
      const r = contentRect(row);
      return r ? this.toScene(r, node.getBoundingClientRect()) : null;
    };
    const lastRevealBefore = (t: number) => [...timeline.reveals].reverse().find((r) => r.at <= t);
    const sp = this.o.speed ?? 1;
    const clock = (t: number) => t * sp;

    // OS keyboard (compose typing): while it is up the template lifts the
    // composer and the thread above it. The camera frames composer + keyboard
    // together (the keys pop as the text is typed, so the keyboard stays in
    // shot), anchored to the bottom so the thread stays visible above; my
    // message sent while it's up appears right above the composer, inside
    // that shot. When it slides away the thread drops back down, so the
    // camera follows the latest message to its settled place in sync.
    const kbs = timeline.keyboards;
    const slide = KEYBOARD_SLIDE_MS / sp;
    const keyboardUp = (t: number) => kbs.some((k) => t >= k.openAt && t < k.closeAt);
    /** measuring inside a keyboard slide-down: measure where things settle instead */
    const settled = (t: number) => {
      for (const k of kbs) if (t >= k.closeAt && t < k.closeAt + slide) return k.closeAt + slide + 1;
      return t;
    };

    const events = [
      ...timeline.reveals.map((r) => ({ at: r.at, kind: "reveal" as const, id: r.id, sender: r.sender, text: "", end: 0 })),
      ...timeline.typings.map((w) => ({ at: w.start, kind: "typing" as const, id: "", sender: "them" as const, text: "", end: w.end })),
      ...timeline.composes.map((c) => ({ at: c.start, kind: "compose" as const, id: c.id, sender: "me" as const, text: c.text, end: c.end })),
      ...kbs
        .filter((k) => Number.isFinite(k.closeAt))
        .map((k) => ({ at: k.closeAt, kind: "kbclose" as const, id: "", sender: "me" as const, text: "", end: 0 })),
    ].sort((a, b) => a.at - b.at);

    for (const ev of events) {
      if (ev.kind === "compose") {
        if (!live(ev.at)) continue;
        // measure the composer with (almost) the whole text typed: it may have grown
        const tm = Math.max(ev.at + 1, ev.end - 2);
        const state = timeline.stateAt(tm);
        stage.render(state, clock(tm));
        this.scrollAllToBottom();
        const prev = lastRevealBefore(ev.at);
        const context = prev ? measureRow(prev.id) : null;
        let focus = this.measureComposer(ev.text);
        if (focus && state.keyboard && state.keyboard.open > 0.98) {
          const kb = node.querySelector<HTMLElement>("[data-keyboard]")?.getBoundingClientRect();
          if (kb && kb.width > 1 && kb.height > 1) focus = union(focus, this.toScene(kb, node.getBoundingClientRect()));
        }
        if (focus) keys.push({ at: out(ev.at), focus, context, anchorBottom: true });
        continue;
      }
      if (ev.kind === "kbclose") {
        if (!live(ev.at)) continue;
        const prev = lastRevealBefore(ev.at);
        if (!prev) continue;
        const tm = ev.at + slide + 1;
        stage.render(timeline.stateAt(tm), clock(tm));
        this.scrollAllToBottom();
        const rect = measureRow(prev.id);
        const idx = timeline.reveals.indexOf(prev);
        const context = idx > 0 ? measureRow(timeline.reveals[idx - 1].id) : null;
        // start moving exactly as the keyboard starts sliding (not CAMERA_LEAD_MS early)
        if (rect) keys.push({ at: out(ev.at) + CAMERA_LEAD_MS, focus: rect, context });
        continue;
      }
      let tm = ev.at + 1;
      const s = settled(tm);
      if (s !== tm && (ev.kind === "reveal" || s < ev.end)) tm = s;
      const st = timeline.stateAt(tm);
      if (ev.kind === "typing") {
        if (!live(ev.at)) continue;
        // render once without the indicator so we can tell which nodes it adds
        stage.render({ ...st, typing: false }, clock(tm));
        this.before = new Set(node.querySelectorAll("*"));
      }
      stage.render(st, clock(tm));
      this.scrollAllToBottom();
      if (ev.kind === "reveal") {
        const rect = measureRow(ev.id);
        const idx = timeline.reveals.findIndex((r) => r.id === ev.id);
        const context = idx > 0 ? measureRow(timeline.reveals[idx - 1].id) : null;
        // my message sent with the keyboard still up: the composer shot already shows it
        const holdComposer = ev.sender === "me" && keyboardUp(ev.at);
        if (rect) {
          if (live(ev.at) && !holdComposer) keys.push({ at: out(ev.at), focus: rect, context });
          if (ev.sender === "them" && !themSide) {
            const { phone } = this.o.layout;
            themSide = rect.x + rect.w / 2 < phone.x + phone.w / 2 ? "left" : "right";
          }
        }
      } else {
        const prev = lastRevealBefore(ev.at);
        const lastReveal = prev ? measureRow(prev.id) : null;
        keys.push({
          at: out(ev.at),
          focus: this.measureTyping(themSide ?? (rtl ? "right" : "left"), lastReveal),
          context: lastReveal,
        });
      }
    }
    await yieldToEventLoop();

    const { W, H, phone } = this.o.layout;
    const camEnd = timing.chatEnd;
    const planned = planCameraKeys(keys, camEnd, out(timing.contentMs), cam);
    this.path = buildCameraPath(planned, { W, H, phone }, cam, camEnd);
    // reset so frame 0 starts from a clean scroll state
    this.seek();
  }

  /** Forget sequential state (scroll tweens, last camera) before a random-access frame. */
  seek() {
    this.scroll.clear();
    this.first = true;
    this.lastCam = null;
    this.dirty = true;
  }

  /**
   * The composer while one of my messages is typed into it. Prefers an
   * explicit `[data-composer]` hook; otherwise finds the draft text outside
   * the chat list and climbs to the full-width bar; otherwise the strip
   * between the chat list and the bottom of the screen.
   */
  private measureComposer(text: string): Rect | null {
    const node = this.o.stage.node;
    const nodeRect = node.getBoundingClientRect();
    const screen = node.querySelector<HTMLElement>("[data-device-screen]") ?? node;
    const sr = screen.getBoundingClientRect();
    const tagged = screen.querySelector<HTMLElement>("[data-composer]");
    if (tagged) {
      const r = tagged.getBoundingClientRect();
      if (r.width > 1 && r.height > 1) return this.toScene(r, nodeRect);
    }
    const needle = text.trim().slice(0, 18);
    if (needle) {
      const walker = document.createTreeWalker(screen, NodeFilter.SHOW_TEXT);
      let hit: HTMLElement | null = null;
      while (walker.nextNode()) {
        const tn = walker.currentNode as Text;
        const el = tn.parentElement;
        // (the keyboard's suggestion strip may echo the word being typed)
        if (!el || el.closest(".rcss-scroll, [data-keyboard]") || !tn.data.includes(needle)) continue;
        const r = el.getBoundingClientRect();
        if (r.width < 1 || r.height < 1) continue;
        hit = el;
        break;
      }
      if (hit) {
        let el = hit;
        let best = hit.getBoundingClientRect();
        while (el.parentElement && el.parentElement !== screen) {
          const pr = el.parentElement.getBoundingClientRect();
          if (pr.height > sr.height * COMPOSER_MAX_H) break;
          el = el.parentElement;
          best = pr;
          if (pr.width >= sr.width * 0.9) break;
        }
        return this.toScene(best, nodeRect);
      }
    }
    const sc = screen.querySelector(".rcss-scroll")?.getBoundingClientRect();
    const top = sc && sr.bottom - sc.bottom > 30 ? sc.bottom : sr.bottom - 96;
    return this.toScene(new DOMRect(sr.left, top, sr.width, Math.min(sr.bottom - top, 120)), nodeRect);
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

  /** chat timeline time (ms) of output frame i */
  timeOf(i: number): number {
    return chatTimeAt(this.o.timing, (i * 1000) / this.o.fps);
  }

  private applyMotion(t: number) {
    const { motion, timeline, rtl, stage } = this.o;
    const sp = this.o.speed ?? 1;
    const seen = new Set<HTMLElement>();
    stage.node.querySelectorAll<HTMLElement>("[data-mid]").forEach((el) => {
      const at = timeline.revealAt.get(el.dataset.mid ?? "");
      if (at === undefined) return;
      // entrance motion plays at the export speed too
      const age = (t - at) * sp;
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
      if (Math.abs(el.scrollTop - before) > 0.01 || this.first) {
        changed = true;
        el.dispatchEvent(new Event("scroll"));
      }
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
    return this.renderAt((i * 1000) / this.o.fps, i === 0);
  }

  /** Render output time `tOut` (ms) into `canvas`. Sequential calls reuse work. */
  async renderAt(tOut: number, force = false): Promise<HTMLCanvasElement> {
    const { timing, endCard } = this.o;
    if (endCard && timing.endMs > 0 && tOut >= timing.chatEnd) {
      if (!this.lastChat) {
        // (without the watermark: it is painted once, sharp, on top of the end card)
        await this.renderChat(timing.chatEnd - 1, true, false);
        const c = document.createElement("canvas");
        c.width = this.canvas.width;
        c.height = this.canvas.height;
        c.getContext("2d")!.drawImage(this.canvas, 0, 0);
        this.lastChat = c;
      }
      paintEndCard(this.ctx, this.canvas.width, this.canvas.height, tOut - timing.chatEnd, this.lastChat, endCard);
      this.paintOverlays();
      this.dirty = true;
      return this.canvas;
    }
    return this.renderChat(tOut, force);
  }

  /** screen-space overlays drawn on top of every frame (never moved by the camera) */
  private paintOverlays() {
    const wm = this.o.watermark;
    if (wm) paintWatermark(this.ctx, this.canvas.width, this.canvas.height, wm);
  }

  private async renderChat(tOut: number, force: boolean, overlays = true): Promise<HTMLCanvasElement> {
    const { stage, timeline, layout, timing } = this.o;
    const tl = chatTimeAt(timing, tOut);
    const introT = timing.leadMs > 0 && tOut < timing.leadMs ? tOut : null;
    // template clock in real conversation time (typing dots, keyboard key pops)
    const clock = tl * (this.o.speed ?? 1);

    stage.render(timeline.stateAt(tl), clock, { introT });
    this.applyMotion(tl);
    const scrolled = this.applyScroll(clock);
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
    if (phoneChanged || camChanged || force || this.dirty) {
      this.composite(cam);
      if (this.o.caption) {
        // While the camera zooms in, the chat fills the caption band: fade the
        // caption out (it would otherwise sit on top of bubbles) and bring it
        // back as the camera returns to the full phone.
        const zoomed = Math.min(1, Math.max(0, ((cam?.scale ?? 1) - 1) / 0.18));
        paintCaption(this.ctx, layout.W, layout.H, this.o.caption, 1 - zoomed, 0);
      }
      if (overlays) this.paintOverlays();
      // a frame without its overlays must be repainted before it is reused
      this.dirty = !overlays;
    }
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
      const m = (DEVICE_MARGIN + BEZEL_GUESS) * scale * this.captureMul;
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
    release(this.lastChat);
    release(this.base);
    release(this.shadowLayer);
    release(this.canvas);
    this.phone = this.base = this.shadowLayer = this.lastChat = null;
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
  caption?: CaptionConfig | null,
  watermark?: WatermarkConfig | null,
): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const k = canvas.width / layout.W;
  ctx.setTransform(k, 0, 0, k, 0, 0);
  ctx.imageSmoothingQuality = "high";
  const light = isLightBackground(background, paint);
  if (background.dynamic && phone) {
    const m = (DEVICE_MARGIN + BEZEL_GUESS) * phoneScale;
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
  if (caption) paintCaption(ctx, layout.W, layout.H, caption);
  if (watermark) paintWatermark(ctx, layout.W, layout.H, watermark);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}
