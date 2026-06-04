"use client";

import type { Device } from "../../types";

/**
 * Device specs cross-checked against the flutter_device_preview / device_frame
 * package geometry and Apple/OEM logical points:
 *  - iPhone 15 Pro: 393×852, screen radius ~54, Dynamic Island 126×37 ~11pt down.
 *  - Samsung Galaxy S23: 360×780, screen radius ~26, centered punch-hole Ø~13.
 */
interface DeviceSpec {
  w: number;
  h: number;
  bezel: number;
  outerRadius: number;
  screenRadius: number;
  /** titanium / aluminium rail gradient */
  rail: string;
}

export const DEVICE_SPEC: Record<Device, DeviceSpec> = {
  iphone: {
    w: 393,
    h: 852,
    bezel: 14,
    outerRadius: 68,
    screenRadius: 54,
    rail: "linear-gradient(135deg, #6f6f76 0%, #3a3a40 18%, #18181b 50%, #3a3a40 82%, #6f6f76 100%)",
  },
  android: {
    w: 360,
    h: 780,
    bezel: 11,
    outerRadius: 38,
    screenRadius: 27,
    rail: "linear-gradient(135deg, #5a5d63 0%, #2c2e33 20%, #141518 50%, #2c2e33 80%, #5a5d63 100%)",
  },
};

/** Back-compat alias. */
export const DEVICE_SIZE: Record<Device, { w: number; h: number }> = {
  iphone: { w: DEVICE_SPEC.iphone.w, h: DEVICE_SPEC.iphone.h },
  android: { w: DEVICE_SPEC.android.w, h: DEVICE_SPEC.android.h },
};

/** Full outer footprint (screen + bezel) used by the responsive scaler. */
export function deviceOuter(device: Device): { w: number; h: number } {
  const s = DEVICE_SPEC[device];
  return { w: s.w + s.bezel * 2, h: s.h + s.bezel * 2 };
}

/** A camera lens: dark glass with a faint blue coating reflection. */
function CameraLens({ size }: { size: number }) {
  return (
    <span
      className="relative block rounded-full"
      style={{
        width: size,
        height: size,
        background: "radial-gradient(circle at 35% 30%, #2a3550 0%, #0a0c12 55%, #000 100%)",
        boxShadow: "0 0 0 1px rgba(60,70,95,0.55) inset",
      }}
    >
      <span
        className="absolute rounded-full"
        style={{
          left: "26%",
          top: "22%",
          width: size * 0.28,
          height: size * 0.28,
          background: "rgba(120,150,210,0.45)",
          filter: "blur(0.5px)",
        }}
      />
    </span>
  );
}

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

  return (
    <div
      className="relative"
      style={{
        width: s.w,
        height: s.h,
        borderRadius: s.outerRadius,
        background: s.rail,
        padding: s.bezel,
        boxShadow:
          "0 0 0 1.5px rgba(255,255,255,0.12) inset, 0 0 0 1px rgba(0,0,0,0.65), 0 34px 70px -22px rgba(0,0,0,0.6), 0 14px 28px -14px rgba(0,0,0,0.55)",
      }}
    >
      {/* Inner black gasket between rail and screen */}
      <div
        className="relative h-full w-full overflow-hidden"
        style={{
          borderRadius: s.screenRadius,
          background: "#000",
          boxShadow: "0 0 0 2px #000",
        }}
      >
        {/* Screen — direction follows the UI language so the whole app mirrors
            like a real Arabic/English install. Message text still flows per its
            own detected direction. */}
        <div
          dir={dir}
          className="relative h-full w-full overflow-hidden bg-black"
          style={{ borderRadius: s.screenRadius, fontFamily }}
        >
          {children}

          {/* Hardware overlay */}
          {isPhone ? (
            // Dynamic Island — 126×37, ~11pt below the top edge, centered.
            <div
              className="pointer-events-none absolute left-1/2 z-30 flex -translate-x-1/2 items-center justify-end"
              style={{
                top: 11,
                width: 126,
                height: 37,
                borderRadius: 999,
                background: "#000",
              }}
            >
              <span style={{ marginRight: 14 }}>
                <CameraLens size={11} />
              </span>
            </div>
          ) : (
            // Samsung centered punch-hole — Ø13, ~15pt down.
            <div
              className="pointer-events-none absolute left-1/2 z-30 -translate-x-1/2"
              style={{ top: 15 }}
            >
              <CameraLens size={13} />
            </div>
          )}
        </div>
      </div>

      {/* Side buttons (machined into the rail) */}
      {isPhone ? (
        <>
          {/* left: action button + volume up/down */}
          <span className="absolute left-[-2px] top-[120px] h-8 w-[3px] rounded-l bg-neutral-800" />
          <span className="absolute left-[-2px] top-[168px] h-12 w-[3px] rounded-l bg-neutral-800" />
          <span className="absolute left-[-2px] top-[226px] h-12 w-[3px] rounded-l bg-neutral-800" />
          {/* right: side button */}
          <span className="absolute right-[-2px] top-[190px] h-20 w-[3px] rounded-r bg-neutral-800" />
        </>
      ) : (
        <>
          {/* right: volume rocker + power */}
          <span className="absolute right-[-2px] top-[150px] h-16 w-[3px] rounded-r bg-neutral-800" />
          <span className="absolute right-[-2px] top-[228px] h-10 w-[3px] rounded-r bg-neutral-800" />
        </>
      )}
    </div>
  );
}
