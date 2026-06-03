"use client";

import type { Device } from "../../types";

export const DEVICE_SIZE: Record<Device, { w: number; h: number }> = {
  iphone: { w: 392, h: 852 },
  android: { w: 384, h: 836 },
};

const BEZEL: Record<Device, number> = { iphone: 13, android: 10 };

/** Full outer footprint (screen + bezel) used by the responsive scaler. */
export function deviceOuter(device: Device): { w: number; h: number } {
  const { w, h } = DEVICE_SIZE[device];
  const b = BEZEL[device];
  return { w: w + b * 2, h: h + b * 2 };
}

/**
 * A realistic physical phone shell. Children fill the screen (including their
 * own status bar so the OS bar tints with the app header, exactly like the real
 * apps). The notch/Dynamic Island/punch-hole is drawn as a hardware overlay.
 * `dir` mirrors the screen contents for RTL (Arabic) UI.
 */
export function DeviceFrame({
  device,
  dir = "ltr",
  children,
}: {
  device: Device;
  dir?: "ltr" | "rtl";
  children: React.ReactNode;
}) {
  const isPhone = device === "iphone";
  const { w, h } = DEVICE_SIZE[device];
  const bezel = BEZEL[device];
  const outerRadius = isPhone ? 62 : 46;
  const screenRadius = isPhone ? 50 : 38;

  return (
    <div
      className="relative"
      style={{
        width: w,
        height: h,
        borderRadius: outerRadius,
        background: "linear-gradient(145deg, #2a2a2e, #050506)",
        padding: bezel,
        boxShadow:
          "0 1px 0 1.5px rgba(255,255,255,0.10) inset, 0 0 0 1px rgba(0,0,0,0.6), 0 30px 60px -20px rgba(0,0,0,0.55), 0 12px 24px -12px rgba(0,0,0,0.5)",
      }}
    >
      {/* Screen — direction follows the UI language so the whole app mirrors
          like a real Arabic/English install. Message text still flows per its
          own detected direction. */}
      <div
        dir={dir}
        className="relative h-full w-full overflow-hidden bg-black"
        style={{ borderRadius: screenRadius }}
      >
        {children}

        {/* Hardware overlay */}
        {isPhone ? (
          <div
            className="pointer-events-none absolute left-1/2 z-30 -translate-x-1/2"
            style={{
              top: 11,
              width: 122,
              height: 35,
              borderRadius: 999,
              background: "#000",
            }}
          >
            <span
              className="absolute rounded-full"
              style={{
                right: 16,
                top: 12,
                width: 9,
                height: 9,
                background: "#0b0b10",
                boxShadow: "0 0 0 1px rgba(40,40,55,0.7) inset",
              }}
            />
          </div>
        ) : (
          <div
            className="pointer-events-none absolute left-1/2 z-30 -translate-x-1/2"
            style={{
              top: 11,
              width: 11,
              height: 11,
              borderRadius: 999,
              background: "#000",
              boxShadow: "0 0 0 1px rgba(40,40,55,0.6) inset",
            }}
          />
        )}
      </div>

      {/* Side buttons */}
      {isPhone ? (
        <>
          <span className="absolute left-[-2px] top-[150px] h-9 w-[3px] rounded-l bg-neutral-700" />
          <span className="absolute left-[-2px] top-[200px] h-14 w-[3px] rounded-l bg-neutral-700" />
          <span className="absolute left-[-2px] top-[268px] h-14 w-[3px] rounded-l bg-neutral-700" />
          <span className="absolute right-[-2px] top-[210px] h-20 w-[3px] rounded-r bg-neutral-700" />
        </>
      ) : (
        <>
          <span className="absolute right-[-2px] top-[180px] h-12 w-[3px] rounded-r bg-neutral-700" />
          <span className="absolute right-[-2px] top-[240px] h-20 w-[3px] rounded-r bg-neutral-700" />
        </>
      )}
    </div>
  );
}
