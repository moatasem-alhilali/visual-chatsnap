"use client";

import { useStudioStore } from "../../store";
import { DEFAULT_STATUS_BAR } from "../../types";
import type { Device } from "../../types";

type Tint = "light" | "dark";

/* ----------------------------- iOS glyphs ----------------------------- */

function IosCellular({ color }: { color: string }) {
  // Four rounded bars increasing in height — Apple's signal glyph. Only the
  // signal mirrors with direction; battery keeps its natural orientation.
  return (
    <svg width="18" height="12" viewBox="0 0 18 12" fill="none" className="rtl:-scale-x-100">
      <rect x="0" y="8" width="3" height="4" rx="1" fill={color} />
      <rect x="5" y="5.5" width="3" height="6.5" rx="1" fill={color} />
      <rect x="10" y="3" width="3" height="9" rx="1" fill={color} />
      <rect x="15" y="0.5" width="3" height="11.5" rx="1" fill={color} />
    </svg>
  );
}

function IosWifi({ color }: { color: string }) {
  return (
    <svg width="17" height="12" viewBox="0 0 17 12" fill="none">
      <path d="M8.5 2.4c2.9 0 5.6 1.1 7.6 3l-1.5 1.6A8.7 8.7 0 0 0 8.5 4.4 8.7 8.7 0 0 0 2.4 7L.9 5.4A11 11 0 0 1 8.5 2.4Z" fill={color} />
      <path d="M8.5 6.1c1.6 0 3.1.6 4.2 1.7l-1.6 1.6A3.7 3.7 0 0 0 8.5 8.2c-1 0-2 .4-2.6 1.2L4.3 7.8A5.9 5.9 0 0 1 8.5 6.1Z" fill={color} />
      <circle cx="8.5" cy="10.6" r="1.5" fill={color} />
    </svg>
  );
}

function IosBattery({ color }: { color: string }) {
  return (
    <svg width="28" height="13" viewBox="0 0 28 13" fill="none">
      <rect x="0.5" y="0.5" width="23" height="12" rx="3.6" stroke={color} strokeOpacity="0.4" />
      <rect x="2" y="2" width="18" height="9" rx="2" fill={color} />
      <path d="M25.5 4.2v4.6c1-.4 1-4.2 0-4.6Z" fill={color} fillOpacity="0.5" />
    </svg>
  );
}

/* --------------------------- Android glyphs --------------------------- */

function AndroidSignal({ color }: { color: string }) {
  // Full filled signal — Material style. Mirrors with direction.
  return (
    <svg width="17" height="13" viewBox="0 0 17 13" fill="none" className="rtl:-scale-x-100">
      <path d="M15.5 1 1 13h14.5z" fill={color} />
    </svg>
  );
}

function AndroidWifi({ color }: { color: string }) {
  return (
    <svg width="16" height="13" viewBox="0 0 16 13" fill="none">
      <path d="M8 11.8 15.4 3a11 11 0 0 0-14.8 0L8 11.8Z" fill={color} />
    </svg>
  );
}

function AndroidBattery({ color }: { color: string }) {
  // Vertical battery with a top nub — the recognisable Android shape.
  return (
    <svg width="12" height="15" viewBox="0 0 12 15" fill="none">
      <rect x="4" y="0" width="4" height="2" rx="0.8" fill={color} />
      <rect x="1" y="2" width="10" height="12.5" rx="2.2" stroke={color} strokeOpacity="0.45" />
      <rect x="2.4" y="4.2" width="7.2" height="9" rx="1.4" fill={color} />
    </svg>
  );
}

export function StatusBar({
  device,
  tint,
  background,
  time = "9:41",
}: {
  device: Device;
  tint: Tint;
  background?: string;
  time?: string;
}) {
  const sb = useStudioStore((s) => s.scenario.statusBar) ?? DEFAULT_STATUS_BAR;
  const color = tint === "light" ? "#ffffff" : "#000000";
  const ios = device === "iphone";

  if (ios) {
    return (
      <div
        className="relative flex w-full select-none items-center justify-between px-7 pt-3"
        style={{ height: 54, background }}
      >
        <span
          className="text-[15px] font-semibold tracking-tight"
          style={{ color, minWidth: 54, fontFamily: "-apple-system, system-ui, sans-serif" }}
        >
          {time}
        </span>
        <div className="flex items-center gap-1.5">
          {sb.cellular && <IosCellular color={color} />}
          {sb.wifi && <IosWifi color={color} />}
          {sb.batteryPct && (
            <span className="text-[14px] font-medium" style={{ color }}>85</span>
          )}
          <IosBattery color={color} />
        </div>
      </div>
    );
  }

  // Android — clock on one side, system icons (mirroring with direction) on the other.
  return (
    <div
      className="relative flex w-full select-none items-center justify-between px-4 pt-1.5"
      style={{ height: 36, background }}
    >
      <span className="text-[13px] font-semibold" style={{ color, fontFamily: "Roboto, system-ui, sans-serif" }}>
        {time}
      </span>
      <div className="flex items-center gap-1.5">
        {sb.cellular && <AndroidSignal color={color} />}
        {sb.wifi && <AndroidWifi color={color} />}
        {sb.batteryPct && (
          <span className="text-[11px] font-medium" style={{ color }}>85</span>
        )}
        <AndroidBattery color={color} />
      </div>
    </div>
  );
}
