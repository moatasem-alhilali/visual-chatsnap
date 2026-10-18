"use client";

import type { Device } from "../../types";
import { vFinish } from "./__verify"; // TEMP-VERIFY

/**
 * Physical phone shells drawn in plain CSS (snapdom-safe: gradients, inset /
 * drop box-shadows and inline SVG only — no images, no backdrop-filter).
 *
 * iPhone 15 Pro — 393×852 pt screen (finishes: see `DEVICE_FINISHES` below).
 *  - Geometry from the flutter `device_frame` iPhone 15 Pro trace
 *    (github.com/aloisdeniel/flutter_device_preview, device_frame/lib/src/devices/ios/iphone_15_pro),
 *    2.024 trace-units per pt, cross-checked with Apple's spec sheet
 *    (146.6 × 70.6 mm, 2556×1179 @ 460 ppi ⇒ 0.1657 mm/pt ⇒ ~426×885 pt body):
 *    body 427×886, front bezel 17 pt (6.5 pt titanium rail + 10.5 pt black glass border),
 *    display corner radius 55 pt (circular in the trace; UIScreen._displayCornerRadius = 55),
 *    outer corner ≈ 72 pt (concentric).
 *  - Dynamic Island 126 × 37.33 pt, 11 pt below the top of the display, centred;
 *    front camera centred in the island's right cap (18.67 pt from its end), lens Ø ≈ 10.7 pt.
 *  - Buttons (pt from the top of the body; they stand 2.5 pt proud of the rail):
 *    left  — Action 154–190, Volume up 220–287, Volume down 305–373;
 *    right — Side button 266–373.
 *  - Antenna lines: sides at 93–100 and 786–792, top edge at x 330–336, bottom edge at x 90–97.
 *  - Earpiece slit: 86 pt wide, centred, right under the rail.
 *
 * Samsung Galaxy S25 — 360×780 dp screen.
 *  - Geometry from the flutter `device_frame` Galaxy S25 trace (2.25 units per dp)
 *    and Samsung's spec sheet (146.9 × 70.5 mm, 1080×2340 @ 416 ppi):
 *    body 384×804, uniform 12 dp bezel (≈5 dp flat aluminium rail + 7 dp black glass),
 *    outer corner 46 dp, display corner ≈ 40 dp.
 *  - Centred punch-hole: Ø 16 dp, centre 17 dp below the top of the display.
 *  - Keys on the right only: volume rocker 146–255 dp, side (power) key 307–368 dp.
 *  - Antenna lines: sides at 66–71, left 731–736, top edge x 139–145, bottom edge x 51–57 / 328–334.
 *
 * Box model: the root element's border-box *is* the full footprint (body plus
 * the buttons standing proud on both sides), so `deviceOuter()` is exactly the
 * size the scaler / exporter must reserve. The screen itself is exactly
 * `DEVICE_SIZE` (393×852 / 360×780), which the platform templates are laid out against.
 */
interface DeviceSpec {
  /** logical screen width (pt / dp) */
  w: number;
  /** logical screen height (pt / dp) */
  h: number;
  /** front border on every side, from the screen edge to the outside of the rail */
  bezel: number;
  /** visible width of the metal rail (part of `bezel`) */
  railWidth: number;
  /** how far the side buttons stand proud of the rail */
  buttonDepth: number;
  outerRadius: number;
  screenRadius: number;
  /** titanium / aluminium rail gradient (front face) */
  rail: string;
  /** inset shadows that model the rail's profile (edge highlight, chamfer, seam) */
  railShade: string;
  /** button gradient (seen edge-on, light from the left / right) */
  buttonLeft: string;
  buttonRight: string;
}

export const DEVICE_SPEC: Record<Device, DeviceSpec> = {
  iphone: {
    w: 393,
    h: 852,
    bezel: 17,
    railWidth: 6.5,
    buttonDepth: 2.5,
    outerRadius: 72,
    screenRadius: 55,
    // Black Titanium: brushed dark grey with a cool sheen, lit from the top-left.
    rail: "linear-gradient(152deg, #8c8c92 0%, #5e5e64 9%, #48484d 24%, #3e3e43 50%, #45454a 74%, #5a5a60 90%, #808086 100%)",
    railShade: [
      "inset 0 0 0 0.6px rgba(0,0,0,0.85)", // outer silhouette
      "inset 0 0 0 1.8px rgba(226,226,234,0.36)", // specular line on the curved edge
      "inset 0 0 0 3.4px rgba(255,255,255,0.07)", // the curve rolls away from the light
    ].join(", "),
    buttonLeft: "linear-gradient(90deg, #2a2a2e 0%, #5d5d63 32%, #7c7c82 58%, #4a4a4f 100%)",
    buttonRight: "linear-gradient(270deg, #2a2a2e 0%, #5d5d63 32%, #7c7c82 58%, #4a4a4f 100%)",
  },
  android: {
    w: 360,
    h: 780,
    bezel: 12,
    railWidth: 5,
    buttonDepth: 2.5,
    outerRadius: 46,
    screenRadius: 40,
    // Galaxy S25 "Silver Shadow": satin flat aluminium, very little sheen.
    rail: "linear-gradient(160deg, #8b8e94 0%, #6b6e74 14%, #55585e 45%, #5b5e64 72%, #7d8086 100%)",
    railShade: [
      "inset 0 0 0 0.6px rgba(0,0,0,0.85)", // outer silhouette
      "inset 0 0 0 1.3px rgba(235,238,245,0.36)", // chamfer catching the light
    ].join(", "),
    buttonLeft: "linear-gradient(90deg, #3a3c40 0%, #73767c 45%, #55585d 100%)",
    buttonRight: "linear-gradient(270deg, #3a3c40 0%, #8a8d93 40%, #5f6267 100%)",
  },
};

/* ------------------------------------------------------------------ */
/* Finishes                                                            */
/* ------------------------------------------------------------------ */

/**
 * Real retail finishes. Only the metal (rail, keys, antenna breaks) changes —
 * the front cover glass and its black border are the same on every colour.
 *
 * iPhone 15 Pro (apple.com/iphone-15-pro, Arabic: apple.com/ae-ar): Black, White,
 * Blue and Natural Titanium. Grade 5 titanium, brushed, PVD-coloured except
 * Natural (bare metal): Black = deep neutral grey, White = bright silvery
 * titanium, Blue = desaturated slate navy, Natural = warm greige.
 *
 * Galaxy S25 (samsung.com/…/galaxy-s25/specs, Arabic: samsung.com/ae_ar): Navy
 * (كحلي), Icyblue (أزرق ثلجي), Silver Shadow (فضي داكن), Mint (أخضر فاتح). The
 * Armor Aluminum frame is anodised to match the back glass, satin finish.
 */
export interface DeviceFinishOption {
  id: string;
  label: { en: string; ar: string };
  /** flat colour for a UI colour chip */
  swatch: string;
}

interface FinishSpec extends DeviceFinishOption {
  rail: string;
  railShade: string;
  buttonLeft: string;
  buttonRight: string;
  /** antenna break: [edge colour, centre colour, opacity] */
  antenna: [string, string, number];
}

/** Builds the rail's inset profile: silhouette, specular line on the curve, roll-off. */
function railProfile(device: Device, silhouette: string, specular: string, rolloff?: string): string {
  return device === "iphone"
    ? [
        `inset 0 0 0 0.6px ${silhouette}`,
        `inset 0 0 0 1.8px ${specular}`,
        `inset 0 0 0 3.4px ${rolloff ?? "rgba(255,255,255,0.07)"}`,
      ].join(", ")
    : [`inset 0 0 0 0.6px ${silhouette}`, `inset 0 0 0 1.3px ${specular}`].join(", ");
}

const FINISH_SPECS: Record<Device, FinishSpec[]> = {
  iphone: [
    {
      id: "black-titanium",
      label: { en: "Black Titanium", ar: "تيتانيوم أسود" },
      swatch: "#3c3c3e",
      rail: DEVICE_SPEC.iphone.rail,
      railShade: DEVICE_SPEC.iphone.railShade,
      buttonLeft: DEVICE_SPEC.iphone.buttonLeft,
      buttonRight: DEVICE_SPEC.iphone.buttonRight,
      antenna: ["rgba(0,0,0,0.5)", "rgba(40,40,44,0.75)", 0.55],
    },
    {
      id: "white-titanium",
      label: { en: "White Titanium", ar: "تيتانيوم أبيض" },
      swatch: "#f2f1ec",
      rail: "linear-gradient(152deg, #f6f5f2 0%, #dddcd8 9%, #c9c8c4 24%, #bdbcb8 50%, #c6c5c1 74%, #d8d7d3 90%, #efeeea 100%)",
      railShade: railProfile("iphone", "rgba(0,0,0,0.42)", "rgba(255,255,255,0.62)", "rgba(255,255,255,0.14)"),
      buttonLeft: "linear-gradient(90deg, #9c9b97 0%, #cbcac6 32%, #e8e7e3 58%, #b5b4b0 100%)",
      buttonRight: "linear-gradient(270deg, #9c9b97 0%, #cbcac6 32%, #e8e7e3 58%, #b5b4b0 100%)",
      antenna: ["rgba(120,118,112,0.55)", "rgba(214,212,206,0.95)", 0.7],
    },
    {
      id: "blue-titanium",
      label: { en: "Blue Titanium", ar: "تيتانيوم أزرق" },
      swatch: "#3a4555",
      rail: "linear-gradient(152deg, #8b97a7 0%, #5c697a 9%, #465364 24%, #3b4757 50%, #424e5e 74%, #576475 90%, #7d8a9b 100%)",
      railShade: railProfile("iphone", "rgba(0,0,0,0.85)", "rgba(214,226,242,0.36)"),
      buttonLeft: "linear-gradient(90deg, #263140 0%, #505d6e 32%, #6f7c8d 58%, #3f4b5b 100%)",
      buttonRight: "linear-gradient(270deg, #263140 0%, #505d6e 32%, #6f7c8d 58%, #3f4b5b 100%)",
      antenna: ["rgba(0,0,0,0.5)", "rgba(36,44,56,0.75)", 0.55],
    },
    {
      id: "natural-titanium",
      label: { en: "Natural Titanium", ar: "تيتانيوم طبيعي" },
      swatch: "#bbb5aa",
      rail: "linear-gradient(152deg, #d6d1c7 0%, #ada89f 9%, #969188 24%, #8a857d 50%, #928d85 74%, #a6a198 90%, #c9c4ba 100%)",
      railShade: railProfile("iphone", "rgba(0,0,0,0.6)", "rgba(250,246,238,0.48)", "rgba(255,255,255,0.1)"),
      buttonLeft: "linear-gradient(90deg, #6b6760 0%, #9b968d 32%, #bab5ab 58%, #87827a 100%)",
      buttonRight: "linear-gradient(270deg, #6b6760 0%, #9b968d 32%, #bab5ab 58%, #87827a 100%)",
      antenna: ["rgba(70,66,60,0.55)", "rgba(160,155,146,0.9)", 0.65],
    },
  ],
  android: [
    {
      id: "navy",
      label: { en: "Navy", ar: "كحلي" },
      swatch: "#2d3850",
      rail: "linear-gradient(160deg, #5e6b84 0%, #3e4a62 14%, #2c364b 45%, #313b51 72%, #505c75 100%)",
      railShade: railProfile("android", "rgba(0,0,0,0.85)", "rgba(196,210,236,0.32)"),
      buttonLeft: "linear-gradient(90deg, #1b2232 0%, #4a5670 45%, #333d52 100%)",
      buttonRight: "linear-gradient(270deg, #1b2232 0%, #5b6781 40%, #39445a 100%)",
      antenna: ["rgba(0,0,0,0.5)", "rgba(30,36,50,0.75)", 0.45],
    },
    {
      id: "icyblue",
      label: { en: "Icyblue", ar: "أزرق ثلجي" },
      swatch: "#c4d6e7",
      rail: "linear-gradient(160deg, #dde8f2 0%, #bfcfdf 14%, #a8bacc 45%, #b0c1d2 72%, #cddae7 100%)",
      railShade: railProfile("android", "rgba(0,0,0,0.42)", "rgba(255,255,255,0.55)"),
      buttonLeft: "linear-gradient(90deg, #7e8fa1 0%, #b9c9d9 45%, #9fb1c3 100%)",
      buttonRight: "linear-gradient(270deg, #7e8fa1 0%, #cfdbe8 40%, #a8b9ca 100%)",
      antenna: ["rgba(90,104,120,0.5)", "rgba(196,210,224,0.95)", 0.6],
    },
    {
      id: "silver-shadow",
      label: { en: "Silver Shadow", ar: "فضي داكن" },
      swatch: "#9a9da2",
      rail: DEVICE_SPEC.android.rail,
      railShade: DEVICE_SPEC.android.railShade,
      buttonLeft: DEVICE_SPEC.android.buttonLeft,
      buttonRight: DEVICE_SPEC.android.buttonRight,
      antenna: ["rgba(0,0,0,0.5)", "rgba(40,40,44,0.75)", 0.4],
    },
    {
      id: "mint",
      label: { en: "Mint", ar: "أخضر فاتح" },
      swatch: "#cfe3d6",
      rail: "linear-gradient(160deg, #dfede3 0%, #c1d8ca 14%, #aac4b4 45%, #b2cbbb 72%, #d0e2d6 100%)",
      railShade: railProfile("android", "rgba(0,0,0,0.42)", "rgba(255,255,255,0.55)"),
      buttonLeft: "linear-gradient(90deg, #7e9587 0%, #bcd2c4 45%, #a1baaa 100%)",
      buttonRight: "linear-gradient(270deg, #7e9587 0%, #d0e3d7 40%, #a9c2b2 100%)",
      antenna: ["rgba(86,108,94,0.5)", "rgba(196,216,203,0.95)", 0.6],
    },
  ],
};

/** The finish each device shows when none (or an unknown id) is given. */
export const DEFAULT_DEVICE_FINISH: Record<Device, string> = {
  iphone: "black-titanium",
  android: "silver-shadow",
};

/** Real retail finishes per device, for a colour picker (chip + bilingual label). */
export const DEVICE_FINISHES: Record<Device, DeviceFinishOption[]> = {
  iphone: FINISH_SPECS.iphone.map(({ id, label, swatch }) => ({ id, label, swatch })),
  android: FINISH_SPECS.android.map(({ id, label, swatch }) => ({ id, label, swatch })),
};

function resolveFinish(device: Device, finish: string | undefined): FinishSpec {
  const list = FINISH_SPECS[device];
  return list.find((f) => f.id === finish) ?? list.find((f) => f.id === DEFAULT_DEVICE_FINISH[device]) ?? list[0];
}

/** Back-compat alias: the logical SCREEN size templates are laid out against. */
export const DEVICE_SIZE: Record<Device, { w: number; h: number }> = {
  iphone: { w: DEVICE_SPEC.iphone.w, h: DEVICE_SPEC.iphone.h },
  android: { w: DEVICE_SPEC.android.w, h: DEVICE_SPEC.android.h },
};

/**
 * True outer footprint of <DeviceFrame> (body + bezel + buttons standing proud
 * on both sides), i.e. its rendered border-box. Used by the responsive scaler
 * and the video exporter. iPhone 432×886, Samsung 389×804.
 */
export function deviceOuter(device: Device): { w: number; h: number } {
  const s = DEVICE_SPEC[device];
  return { w: s.w + 2 * (s.bezel + s.buttonDepth), h: s.h + 2 * s.bezel };
}

/* ------------------------------------------------------------------ */
/* Hardware details                                                    */
/* ------------------------------------------------------------------ */

/** Front camera seen through cover glass: near-black with a faint blue/violet coating. */
function CameraLens({ size }: { size: number }) {
  return (
    <span
      className="relative block rounded-full"
      style={{
        width: size,
        height: size,
        background: "radial-gradient(circle at 50% 50%, #0b1026 0%, #080b19 38%, #05060b 62%, #020203 100%)",
        boxShadow: "inset 0 0 0 0.6px rgba(48,52,72,0.55)",
      }}
    >
      {/* coating reflections */}
      <span
        className="absolute rounded-full"
        style={{
          left: "30%",
          top: "24%",
          width: size * 0.3,
          height: size * 0.22,
          background: "radial-gradient(ellipse at center, rgba(96,120,222,0.42) 0%, rgba(49,47,173,0.18) 55%, rgba(28,28,134,0) 100%)",
        }}
      />
      <span
        className="absolute rounded-full"
        style={{
          left: "44%",
          top: "60%",
          width: size * 0.2,
          height: size * 0.16,
          background: "radial-gradient(ellipse at center, rgba(135,0,199,0.30) 0%, rgba(0,82,103,0) 100%)",
        }}
      />
    </span>
  );
}

type Band = { side: "left" | "right" | "top" | "bottom"; at: number; len: number };

const ANTENNAS: Record<Device, Band[]> = {
  iphone: [
    { side: "left", at: 93.3, len: 6.4 },
    { side: "right", at: 93.3, len: 6.4 },
    { side: "left", at: 785.7, len: 6.3 },
    { side: "right", at: 785.7, len: 6.3 },
    { side: "top", at: 329.6, len: 6.3 },
    { side: "bottom", at: 90.4, len: 6.3 },
  ],
  android: [
    { side: "left", at: 66.2, len: 4.9 },
    { side: "right", at: 66.2, len: 4.9 },
    { side: "left", at: 731.1, len: 5.3 },
    { side: "top", at: 139.1, len: 5.8 },
    { side: "bottom", at: 51.1, len: 5.8 },
    { side: "bottom", at: 327.8, len: 5.8 },
  ],
};

/** Physical keys: [side, top, length] in body coordinates. */
const BUTTONS: Record<Device, [side: "left" | "right", top: number, len: number][]> = {
  iphone: [
    ["left", 154, 36.3], // Action button
    ["left", 219.7, 67.6], // volume up
    ["left", 305.3, 67.7], // volume down
    ["right", 266.3, 106.7], // side button
  ],
  android: [
    ["right", 145.8, 109.3], // volume rocker
    ["right", 306.7, 60.9], // side (power) key
  ],
};

/**
 * A realistic physical phone shell. Children fill the screen (including their
 * own status bar so the OS bar tints with the app header, exactly like the real
 * apps). The Dynamic Island / punch-hole is drawn as a hardware overlay.
 * `dir` mirrors the screen contents for RTL (Arabic) UI.
 */
export function DeviceFrame({
  device,
  dir = "ltr",
  fontFamily,
  finish,
  children,
}: {
  device: Device;
  dir?: "ltr" | "rtl";
  fontFamily?: string;
  /** finish id from `DEVICE_FINISHES[device]`; device default when unset or unknown */
  finish?: string;
  children: React.ReactNode;
}) {
  const isPhone = device === "iphone";
  const s = DEVICE_SPEC[device];
  const f = resolveFinish(device, vFinish(finish)); // TEMP-VERIFY
  const outer = deviceOuter(device);
  const bodyW = s.w + 2 * s.bezel;
  const bodyH = s.h + 2 * s.bezel;
  const glassRadius = s.outerRadius - s.railWidth;

  return (
    <div
      dir="ltr"
      data-device={device}
      style={{
        position: "relative",
        boxSizing: "border-box",
        width: outer.w,
        height: outer.h,
        flexShrink: 0,
      }}
    >
      {/* Side keys — drawn first so the body overlaps their inner end. */}
      {BUTTONS[device].map(([side, top, len], i) => (
        <span
          key={i}
          aria-hidden
          style={{
            position: "absolute",
            top,
            height: len,
            width: s.buttonDepth + 3,
            [side]: 0,
            background: side === "left" ? f.buttonLeft : f.buttonRight,
            borderRadius: side === "left" ? "1.6px 0 0 1.6px / 3px 0 0 3px" : "0 1.6px 1.6px 0 / 0 3px 3px 0",
            boxShadow:
              side === "left"
                ? "inset 0 1px 0 rgba(255,255,255,0.18), inset 0 -1px 0 rgba(0,0,0,0.45), inset 0.5px 0 0 rgba(0,0,0,0.6)"
                : "inset 0 1px 0 rgba(255,255,255,0.18), inset 0 -1px 0 rgba(0,0,0,0.45), inset -0.5px 0 0 rgba(0,0,0,0.6)",
          }}
        />
      ))}

      {/* Body: metal rail + realistic drop shadow (kept within ~40px so the
          exporter's padding never clips it). */}
      <div
        style={{
          position: "absolute",
          left: s.buttonDepth,
          top: 0,
          width: bodyW,
          height: bodyH,
          borderRadius: s.outerRadius,
          background: f.rail,
          boxShadow: [
            f.railShade,
            "0 0 0 0.5px rgba(0,0,0,0.35)",
            "0 2px 4px rgba(0,0,0,0.18)",
            "0 8px 16px -6px rgba(0,0,0,0.28)",
            "0 22px 34px -16px rgba(0,0,0,0.45)",
          ].join(", "),
        }}
      >
        {/* Antenna lines (plastic breaks in the rail) */}
        {ANTENNAS[device].map((b, i) => {
          const vertical = b.side === "left" || b.side === "right";
          return (
            <span
              key={i}
              aria-hidden
              style={{
                position: "absolute",
                ...(vertical
                  ? { top: b.at, height: b.len, width: s.railWidth - 0.6, [b.side]: 0.3 }
                  : { left: b.at, width: b.len, height: s.railWidth - 0.6, [b.side]: 0.3 }),
                background: `linear-gradient(${vertical ? (b.side === "left" ? 90 : 270) : b.side === "top" ? 180 : 0}deg, ${f.antenna[0]}, ${f.antenna[1]} 35%, ${f.antenna[0]})`,
                opacity: f.antenna[2],
              }}
            />
          );
        })}

        {/* Black cover-glass border */}
        <div
          style={{
            position: "absolute",
            inset: s.railWidth,
            borderRadius: glassRadius,
            background: "#020203",
            // seam between the rail and the glass, then a hairline glint on the glass edge
            boxShadow: `0 0 0 ${isPhone ? 1.1 : 0.9}px rgba(0,0,0,0.55), inset 0 0 0 0.5px rgba(255,255,255,0.06)`,
          }}
        />

        {/* Earpiece slit, tucked right under the rail */}
        <span
          aria-hidden
          style={{
            position: "absolute",
            top: s.railWidth + (isPhone ? 0 : 0.2),
            left: "50%",
            width: isPhone ? 86 : 72,
            height: isPhone ? 2.2 : 1.6,
            transform: "translateX(-50%)",
            borderRadius: "0 0 2px 2px / 0 0 1.2px 1.2px",
            background: "#0d0d0f",
            boxShadow: "inset 0 -0.5px 0 rgba(255,255,255,0.08), 0 0 0 0.5px rgba(40,40,44,0.55)",
          }}
        />

        {/* Screen — direction follows the UI language so the whole app mirrors
            like a real Arabic/English install. Message text still flows per its
            own detected direction. Exactly DEVICE_SIZE. */}
        <div
          dir={dir}
          data-device-screen=""
          className="overflow-hidden bg-black"
          style={{
            position: "absolute",
            left: s.bezel,
            top: s.bezel,
            width: s.w,
            height: s.h,
            borderRadius: s.screenRadius,
            fontFamily,
            // make the clip a separate layer so rounded corners stay crisp
            isolation: "isolate",
          }}
        >
          {children}

          {/* Hardware overlay */}
          {isPhone ? (
            // Dynamic Island — 126×37.33, 11pt below the top edge, centred.
            <div
              aria-hidden
              className="pointer-events-none absolute z-30"
              style={{
                top: 11,
                left: (s.w - 126) / 2,
                width: 126,
                height: 37.33,
                borderRadius: 18.67,
                background: "#000",
              }}
            >
              <span className="absolute" style={{ right: 18.67 - 5.35, top: 18.67 - 5.35 }}>
                <CameraLens size={10.7} />
              </span>
            </div>
          ) : (
            // Galaxy S25 centred punch-hole — Ø16, centre 17dp down.
            <div
              aria-hidden
              className="pointer-events-none absolute z-30 rounded-full"
              style={{
                top: 17 - 8,
                left: s.w / 2 - 8,
                width: 16,
                height: 16,
                background: "#000",
                boxShadow: "0 0 0 0.6px rgba(0,0,0,0.9)",
              }}
            >
              <span className="absolute" style={{ left: 2.5, top: 2.5 }}>
                <CameraLens size={11} />
              </span>
            </div>
          )}
        </div>

        {/* Cover-glass reflection: a faint diagonal sheen, strongest over the
            black border so it never washes out the UI. */}
        <div
          aria-hidden
          className="pointer-events-none"
          style={{
            position: "absolute",
            inset: s.railWidth,
            borderRadius: glassRadius,
            background:
              "linear-gradient(124deg, rgba(255,255,255,0.032) 0%, rgba(255,255,255,0.012) 14%, rgba(255,255,255,0) 26%, rgba(255,255,255,0) 84%, rgba(255,255,255,0.016) 100%)",
            boxShadow: "inset 0 0 0 0.6px rgba(255,255,255,0.06)",
            zIndex: 40,
          }}
        />
      </div>
    </div>
  );
}
