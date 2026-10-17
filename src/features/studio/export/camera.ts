/**
 * Auto-zoom camera ("Screen Studio"-style): when a message appears the camera
 * glides in to frame it, pans between the two sides of the conversation, and
 * eases back out to the full frame at the end (and during long pauses).
 *
 * Pure and React-free. The path is integrated once, up front, from a list of
 * timed focus keys with a critically-damped spring (velocity-continuous, never
 * overshoots), then sampled — so `at(t)` is a pure function of t and every
 * export is bit-for-bit reproducible.
 *
 * Coordinates are "scene" pixels: the un-zoomed output frame (W×H) that holds
 * the background and the phone. A camera state {scale, cx, cy} shows the
 * W/scale × H/scale window centred on (cx, cy), stretched to fill the frame.
 */

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface CameraState {
  /** 1 = full frame */
  scale: number;
  cx: number;
  cy: number;
}

export type ZoomIntensity = "subtle" | "medium" | "strong";

export const ZOOM_LEVELS: Record<ZoomIntensity, number> = {
  subtle: 1.35,
  medium: 1.7,
  strong: 2.2,
};

export interface CameraOptions {
  maxZoom: number;
  /** pan to whichever side is speaking; false = keep the phone centred horizontally */
  followSides: boolean;
  /** glide back to the full frame after the last message */
  zoomOutAtEnd: boolean;
}

export interface CameraScene {
  W: number;
  H: number;
  /** the phone body in scene px */
  phone: Rect;
}

/** A focus target that becomes active at `at` ms (output time). null = wide shot. */
export interface CameraKey {
  at: number;
  focus: Rect | null;
}

/** Start moving this long before the event, so the camera "anticipates" it. */
export const CAMERA_LEAD_MS = 160;
/** Gaps longer than this zoom out in between (no zoom-pumping for closer messages). */
const LONG_PAUSE_MS = 4200;
const PAUSE_WIDE_AFTER_MS = 1800;
/** Where the end-of-video zoom-out starts relative to the last event. */
const END_WIDE_AFTER_MS = 650;

// spring stiffness (rad/s). Critically damped: settles in ≈ 4.7/ω seconds.
const OMEGA_PAN = 7;
const OMEGA_ZOOM_IN = 6;
const OMEGA_ZOOM_OUT = 4.2;
const STEP_MS = 1000 / 240;

export const WIDE = (scene: CameraScene): CameraState => ({ scale: 1, cx: scene.W / 2, cy: scene.H / 2 });

/** Keep the zoomed window inside the frame (never reveal outside the canvas). */
export function clampCamera(st: CameraState, scene: CameraScene): CameraState {
  const scale = Math.max(1, st.scale);
  const hw = scene.W / scale / 2;
  const hh = scene.H / scale / 2;
  return {
    scale,
    cx: Math.min(scene.W - hw, Math.max(hw, st.cx)),
    cy: Math.min(scene.H - hh, Math.max(hh, st.cy)),
  };
}

/** The camera state that nicely frames `focus` (or the wide shot). */
export function focusState(focus: Rect | null, scene: CameraScene, opts: CameraOptions): CameraState {
  if (!focus) return WIDE(scene);
  const { W, H, phone } = scene;
  // zoom in up to maxZoom, but never so far that a big bubble (photo) won't fit
  const fit = Math.min((W * 0.86) / Math.max(1, focus.w), (H * 0.5) / Math.max(1, focus.h));
  const scale = Math.max(1, Math.min(opts.maxZoom, fit));
  const phoneCx = phone.x + phone.w / 2;
  const fx = focus.x + focus.w / 2;
  // stay centred on the phone and lean a little toward the speaker; the pan
  // below then only moves as far as needed to keep the bubble fully in view
  let cx = phoneCx + (fx - phoneCx) * (opts.followSides ? 0.3 : 0);
  // put the bubble a little below centre: the context above it stays readable
  let cy = focus.y + focus.h / 2 - (H / scale) * 0.08;
  // …but the focused bubble itself must always be fully in view (with margin)
  const vw = W / scale;
  const vh = H / scale;
  const mx = Math.min(vw * 0.06, Math.max(0, (vw - focus.w) / 2));
  const my = Math.min(vh * 0.06, Math.max(0, (vh - focus.h) / 2));
  cx = Math.max(Math.min(cx, focus.x - mx + vw / 2), focus.x + focus.w + mx - vw / 2);
  cy = Math.max(Math.min(cy, focus.y - my + vh / 2), focus.y + focus.h + my - vh / 2);
  return clampCamera({ scale, cx, cy }, scene);
}

/** Insert wide shots for long pauses and the ending; sort; drop duplicates. */
export function planCameraKeys(
  keys: CameraKey[],
  totalMs: number,
  lastEventMs: number,
  opts: CameraOptions,
): CameraKey[] {
  const sorted = [...keys].sort((a, b) => a.at - b.at);
  const out: CameraKey[] = [];
  for (let i = 0; i < sorted.length; i++) {
    out.push(sorted[i]);
    const next = sorted[i + 1];
    if (next && next.at - sorted[i].at > LONG_PAUSE_MS) {
      out.push({ at: sorted[i].at + PAUSE_WIDE_AFTER_MS, focus: null });
    }
  }
  if (opts.zoomOutAtEnd && out.length) {
    // leave enough time for the spring to fully settle before the video ends
    const at = Math.max(out[out.length - 1].at + 400, Math.min(lastEventMs + END_WIDE_AFTER_MS, totalMs - 1300));
    if (at < totalMs) out.push({ at, focus: null });
  }
  return out;
}

export interface CameraPath {
  at: (t: number) => CameraState;
  /** true when the camera never leaves the wide shot */
  static: boolean;
}

/**
 * Integrate the camera over [0, totalMs]. Pan and zoom each follow a
 * critically-damped spring toward the active key (switched CAMERA_LEAD_MS
 * early); zoom is integrated in log space so it feels uniform.
 */
export function buildCameraPath(
  rawKeys: CameraKey[],
  scene: CameraScene,
  opts: CameraOptions,
  totalMs: number,
): CameraPath {
  const wide = WIDE(scene);
  if (!rawKeys.length || opts.maxZoom <= 1.001) {
    return { at: () => wide, static: true };
  }
  const targets = rawKeys.map((k) => ({ from: Math.max(0, k.at - CAMERA_LEAD_MS), st: focusState(k.focus, scene, opts) }));

  const n = Math.ceil(totalMs / STEP_MS) + 2;
  const S = new Float64Array(n);
  const X = new Float64Array(n);
  const Y = new Float64Array(n);

  let ls = 0; // log(scale)
  let x = wide.cx;
  let y = wide.cy;
  let vls = 0;
  let vx = 0;
  let vy = 0;
  let k = -1;
  const dt = STEP_MS / 1000;

  for (let i = 0; i < n; i++) {
    const t = i * STEP_MS;
    while (k + 1 < targets.length && targets[k + 1].from <= t) k++;
    const tgt = k >= 0 ? targets[k].st : wide;
    const tls = Math.log(tgt.scale);
    const wz = tls < ls ? OMEGA_ZOOM_OUT : OMEGA_ZOOM_IN;
    // semi-implicit Euler, stable for ω·dt ≪ 1
    vls += (wz * wz * (tls - ls) - 2 * wz * vls) * dt;
    ls += vls * dt;
    // when zooming out, pan with the zoom so the frame re-centres together
    const wp = tls < ls - 0.01 ? Math.min(OMEGA_PAN, OMEGA_ZOOM_OUT * 1.15) : OMEGA_PAN;
    vx += (wp * wp * (tgt.cx - x) - 2 * wp * vx) * dt;
    x += vx * dt;
    vy += (wp * wp * (tgt.cy - y) - 2 * wp * vy) * dt;
    y += vy * dt;
    S[i] = ls;
    X[i] = x;
    Y[i] = y;
  }

  const at = (t: number): CameraState => {
    const f = Math.min(n - 1.000001, Math.max(0, t / STEP_MS));
    const i = Math.floor(f);
    const a = f - i;
    const st = {
      scale: Math.exp(S[i] + (S[i + 1] - S[i]) * a),
      cx: X[i] + (X[i + 1] - X[i]) * a,
      cy: Y[i] + (Y[i + 1] - Y[i]) * a,
    };
    // snap negligible zoom to exactly 1 so the wide shot is pixel-exact
    if (st.scale < 1.0005) return wide;
    return clampCamera(st, scene);
  };

  return { at, static: false };
}

/** Visible window of the scene for a camera state. */
export function cameraView(st: CameraState, scene: { W: number; H: number }): Rect {
  const w = scene.W / st.scale;
  const h = scene.H / st.scale;
  return { x: st.cx - w / 2, y: st.cy - h / 2, w, h };
}

/* ---------------------------------------------------------- live helpers */

/** One critically-damped spring step (for real-time use, e.g. CameraRig). */
export interface SpringCamera {
  ls: number;
  x: number;
  y: number;
  vls: number;
  vx: number;
  vy: number;
}

export function springStep(s: SpringCamera, target: CameraState, dtMs: number): SpringCamera {
  let { ls, x, y, vls, vx, vy } = s;
  const steps = Math.max(1, Math.ceil(dtMs / STEP_MS));
  const dt = dtMs / 1000 / steps;
  const tls = Math.log(Math.max(1, target.scale));
  for (let i = 0; i < steps; i++) {
    const wz = tls < ls ? OMEGA_ZOOM_OUT : OMEGA_ZOOM_IN;
    vls += (wz * wz * (tls - ls) - 2 * wz * vls) * dt;
    ls += vls * dt;
    const wp = tls < ls - 0.01 ? Math.min(OMEGA_PAN, OMEGA_ZOOM_OUT * 1.15) : OMEGA_PAN;
    vx += (wp * wp * (target.cx - x) - 2 * wp * vx) * dt;
    x += vx * dt;
    vy += (wp * wp * (target.cy - y) - 2 * wp * vy) * dt;
    y += vy * dt;
  }
  return { ls, x, y, vls, vx, vy };
}

/* ------------------------------------------------------- DOM measurement */

/**
 * Tight box of a message row's visible content: rows are often full-width
 * flex containers, so descend until children are narrower than the row
 * (the bubble, avatar, reactions) and union those.
 */
export function contentRect(row: HTMLElement): DOMRect | null {
  const rr = row.getBoundingClientRect();
  if (rr.width === 0 || rr.height === 0) return null;
  let left = Infinity;
  let top = Infinity;
  let right = -Infinity;
  let bottom = -Infinity;
  const visit = (el: Element, depth: number) => {
    for (const ch of Array.from(el.children)) {
      const r = ch.getBoundingClientRect();
      if (r.width < 1 || r.height < 1) continue;
      if (r.width < rr.width * 0.92 || depth >= 4) {
        left = Math.min(left, r.left);
        top = Math.min(top, r.top);
        right = Math.max(right, r.right);
        bottom = Math.max(bottom, r.bottom);
      } else {
        visit(ch, depth + 1);
      }
    }
  };
  visit(row, 0);
  if (!Number.isFinite(left)) return rr;
  return new DOMRect(left, top, right - left, bottom - top);
}
