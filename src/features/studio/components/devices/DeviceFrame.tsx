"use client";

import type { Device } from "../../types";

/**
 * Physical phone shells drawn in plain CSS (snapdom-safe: gradients, inset /
 * drop box-shadows and inline SVG only — no images, no backdrop-filter).
 *
 * iPhone 15 Pro (Black Titanium) — 393×852 pt screen.
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
 *  - Centred punch-hole: Ø 17 dp, centre 17 dp below the top of the display.
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
        background: "radial-gradient(circle at 50% 50%, #0d1430 0%, #0a0f22 38%, #07080f 62%, #030305 100%)",
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
          background: "radial-gradient(ellipse at center, rgba(96,120,222,0.55) 0%, rgba(49,47,173,0.25) 55%, rgba(28,28,134,0) 100%)",
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
  children,
}: {
  device: Device;
  dir?: "ltr" | "rtl";
  fontFamily?: string;
  children: React.ReactNode;
}) {
  const isPhone = device === "iphone";
  const s = DEVICE_SPEC[device];
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
            background: side === "left" ? s.buttonLeft : s.buttonRight,
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
          background: s.rail,
          boxShadow: [
            s.railShade,
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
                background: vertical
                  ? `linear-gradient(${b.side === "left" ? 90 : 270}deg, rgba(0,0,0,0.5), rgba(40,40,44,0.75) 35%, rgba(0,0,0,0.55))`
                  : `linear-gradient(${b.side === "top" ? 180 : 0}deg, rgba(0,0,0,0.5), rgba(40,40,44,0.75) 35%, rgba(0,0,0,0.55))`,
                opacity: isPhone ? 0.55 : 0.4,
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
            // Galaxy S25 centred punch-hole — Ø17, centre 17dp down.
            <div
              aria-hidden
              className="pointer-events-none absolute z-30 rounded-full"
              style={{
                top: 17 - 8.5,
                left: s.w / 2 - 8.5,
                width: 17,
                height: 17,
                background: "#000",
                boxShadow: "0 0 0 0.6px rgba(0,0,0,0.9)",
              }}
            >
              <span className="absolute" style={{ left: 2.6, top: 2.6 }}>
                <CameraLens size={11.8} />
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
              "linear-gradient(122deg, rgba(255,255,255,0.075) 0%, rgba(255,255,255,0.028) 16%, rgba(255,255,255,0) 30%, rgba(255,255,255,0) 78%, rgba(255,255,255,0.018) 92%, rgba(255,255,255,0.04) 100%)",
            boxShadow: "inset 0 0 0 0.6px rgba(255,255,255,0.07)",
            zIndex: 40,
          }}
        />
      </div>
    </div>
  );
}
