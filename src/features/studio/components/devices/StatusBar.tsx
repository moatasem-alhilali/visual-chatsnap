"use client";

import type { Device } from "../../types";

type Tint = "light" | "dark";

function CellularIcon({ color }: { color: string }) {
  return (
    <svg width="17" height="11" viewBox="0 0 17 11" fill="none">
      <rect x="0" y="7" width="3" height="4" rx="1" fill={color} />
      <rect x="4.5" y="5" width="3" height="6" rx="1" fill={color} />
      <rect x="9" y="2.5" width="3" height="8.5" rx="1" fill={color} />
      <rect x="13.5" y="0" width="3" height="11" rx="1" fill={color} />
    </svg>
  );
}

function WifiIcon({ color }: { color: string }) {
  return (
    <svg width="16" height="11" viewBox="0 0 16 12" fill="none">
      <path
        d="M8 2.2c2.7 0 5.2 1 7 2.8l-1.4 1.5A7.6 7.6 0 0 0 8 4.3 7.6 7.6 0 0 0 2.4 6.5L1 5C2.8 3.2 5.3 2.2 8 2.2Z"
        fill={color}
      />
      <path
        d="M8 6c1.5 0 2.9.6 4 1.6l-1.5 1.5A3.5 3.5 0 0 0 8 8c-1 0-1.9.4-2.5 1.1L4 7.6A5.7 5.7 0 0 1 8 6Z"
        fill={color}
      />
      <circle cx="8" cy="10.4" r="1.4" fill={color} />
    </svg>
  );
}

function BatteryIcon({ color, ios }: { color: string; ios: boolean }) {
  return (
    <svg width="27" height="13" viewBox="0 0 27 13" fill="none">
      <rect
        x="0.5"
        y="0.5"
        width="22"
        height="12"
        rx={ios ? 3.5 : 2.5}
        stroke={color}
        strokeOpacity="0.4"
      />
      <rect
        x="2"
        y="2"
        width="17"
        height="9"
        rx={ios ? 2 : 1.5}
        fill={color}
      />
      <rect
        x="24"
        y="4"
        width="1.6"
        height="5"
        rx="0.8"
        fill={color}
        fillOpacity="0.5"
      />
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
          <CellularIcon color={color} />
          <WifiIcon color={color} />
          <BatteryIcon color={color} ios />
        </div>
      </div>
    );
  }

  // Android
  return (
    <div
      className="relative flex w-full select-none items-center justify-between px-4 pt-1.5"
      style={{ height: 34, background }}
    >
      <span
        className="text-[13px] font-medium"
        style={{ color, fontFamily: "Roboto, system-ui, sans-serif" }}
      >
        {time}
      </span>
      <div className="flex items-center gap-1.5">
        <CellularIcon color={color} />
        <WifiIcon color={color} />
        <BatteryIcon color={color} ios={false} />
      </div>
    </div>
  );
}
