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

export function computeLayout(
  preset: Preset,
  device: { w: number; h: number; radius: number },
  size: PhoneSize,
): FrameLayout {
  const boxCssW = device.w + DEVICE_MARGIN * 2;
  const boxCssH = device.h + DEVICE_MARGIN * 2;

  let W: number;
  let H: number;
  let scale: number;

  if (preset.w === null || preset.h === null) {
    scale = DEVICE_ONLY_HEIGHT / boxCssH;
    W = even(boxCssW * scale);
    H = even(boxCssH * scale);
  } else {
    W = preset.w;
    H = preset.h;
    const fill = PHONE_FILL[size];
    scale = Math.min((H * fill) / device.h, (W * fill) / device.w);
  }

  const boxW = boxCssW * scale;
  const boxH = boxCssH * scale;
  // snap to whole output pixels so the phone isn't resampled by a sub-pixel offset
  const x = Math.round((W - boxW) / 2);
  const y = Math.round((H - boxH) / 2);
  const m = DEVICE_MARGIN * scale;

  return {
    W,
    H,
    scale,
    x,
    y,
    boxW,
    boxH,
    phone: { x: x + m, y: y + m, w: device.w * scale, h: device.h * scale, r: device.radius * scale },
    framed: preset.w !== null,
  };
}

/** Rough upper bound of the encoded size, used for the estimate in the dialog. */
export function estimateBytes(bitrate: number, durationMs: number): number {
  // chat frames are mostly static, so VBR lands well below the target bitrate
  return (bitrate * 0.45 * durationMs) / 1000 / 8;
}
