/**
 * Output frame presets and the placement of the phone inside the frame.
 * All sizes are in output pixels; the phone is rasterised directly at the
 * scale it is drawn at (no resampling), so text and icons stay crisp.
 */

export type PresetId = "story" | "portrait" | "square" | "landscape" | "device";
export type PhoneSize = "s" | "m" | "l";

export interface Preset {
  id: PresetId;
  /** aspect label, e.g. "9:16" */
  ratio: string;
  /** null = sized to the phone ("device only") */
  w: number | null;
  h: number | null;
}

export const PRESETS: Preset[] = [
  { id: "story", ratio: "9:16", w: 1080, h: 1920 },
  { id: "portrait", ratio: "4:5", w: 1080, h: 1350 },
  { id: "square", ratio: "1:1", w: 1080, h: 1080 },
  { id: "landscape", ratio: "16:9", w: 1920, h: 1080 },
  { id: "device", ratio: "", w: null, h: null },
];

/** Fraction of the limiting frame dimension the phone occupies. */
const PHONE_FILL: Record<PhoneSize, number> = { s: 0.72, m: 0.82, l: 0.9 };

/** Height of the phone (output px) for the "device only" preset. */
const DEVICE_ONLY_HEIGHT = 1920;

/** Transparent margin (CSS px) captured around the phone so side buttons and
 *  the hairline edge are never clipped. */
export const DEVICE_MARGIN = 6;

export interface FrameLayout {
  /** output frame size (always even — required by H.264 4:2:0) */
  W: number;
  H: number;
  /** CSS px → output px factor the phone is rasterised at */
  scale: number;
  /** top-left of the captured phone box (incl. margin) in output px */
  x: number;
  y: number;
  /** size of the captured phone box (incl. margin) in output px */
  boxW: number;
  boxH: number;
  /** phone body rect (excl. margin) in output px, for the shadow */
  phone: { x: number; y: number; w: number; h: number; r: number };
  /** whether the background is visible around the phone */
  framed: boolean;
}

export function even(n: number): number {
  const r = Math.round(n);
  return r % 2 === 0 ? r : r + 1;
}

/** Measured phone: footprint (body + side keys) and the rounded body inside it, in CSS px. */
export interface DeviceGeometry {
  w: number;
  h: number;
  body: { x: number; y: number; w: number; h: number; r: number };
}

/** Used until the stage has been measured (iPhone footprint). */
export const FALLBACK_DEVICE: DeviceGeometry = { w: 432, h: 886, body: { x: 2.5, y: 0, w: 427, h: 886, r: 72 } };

export interface LayoutOptions {
  /** resolution multiplier (stills at 2–3×, small GIFs < 1) */
  mul?: number;
  /** fractions of the frame height kept free above / below the phone (caption band) */
  reserveTop?: number;
  reserveBottom?: number;
}

/** Can this preset reserve a caption band above/below the phone? (tall formats only) */
export function supportsCaption(preset: Preset): boolean {
  return preset.id === "story" || preset.id === "portrait";
}

export function computeLayout(
  preset: Preset,
  device: DeviceGeometry,
  size: PhoneSize,
  opts: LayoutOptions = {},
): FrameLayout {
  const boxCssW = device.w + DEVICE_MARGIN * 2;
  const boxCssH = device.h + DEVICE_MARGIN * 2;
  const mul = opts.mul ?? 1;

  let W: number;
  let H: number;
  let scale: number;
  let top = 0;
  let bottom = 0;

  if (preset.w === null || preset.h === null) {
    scale = (DEVICE_ONLY_HEIGHT * mul) / boxCssH;
    W = even(boxCssW * scale);
    H = even(boxCssH * scale);
  } else {
    W = even(preset.w * mul);
    H = even(preset.h * mul);
    top = Math.round(H * (opts.reserveTop ?? 0));
    bottom = Math.round(H * (opts.reserveBottom ?? 0));
    const fill = PHONE_FILL[size];
    const availH = H - top - bottom;
    // with a caption band the phone fills the remaining height a little more
    const fillH = top || bottom ? Math.min(0.96, fill + 0.08) : fill;
    scale = Math.min((availH * fillH) / device.h, (W * fill) / device.w);
  }

  const boxW = boxCssW * scale;
  const boxH = boxCssH * scale;
  // snap to whole output pixels so the phone isn't resampled by a sub-pixel offset
  const x = Math.round((W - boxW) / 2);
  const y = Math.round(top + (H - top - bottom - boxH) / 2);
  const m = DEVICE_MARGIN * scale;

  return {
    W,
    H,
    scale,
    x,
    y,
    boxW,
    boxH,
    phone: {
      x: x + m + device.body.x * scale,
      y: y + m + device.body.y * scale,
      w: device.body.w * scale,
      h: device.body.h * scale,
      r: device.body.r * scale,
    },
    framed: preset.w !== null,
  };
}

/** Expected encoded size, used for the estimate in the dialog. */
export function estimateBytes(bitrate: number, durationMs: number, moving: boolean): number {
  // a static chat lands far below the VBR target; a moving camera changes every pixel
  return (bitrate * (moving ? 0.85 : 0.32) * durationMs) / 1000 / 8;
}
