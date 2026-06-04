"use client";

import { useStudioStore } from "../../store";
import { DEFAULT_STATUS_BAR } from "../../types";
import type { Lang } from "../platforms/chrome";

/** Convert ASCII digits to Arabic-Indic so the One UI clock reads like the real device. */
function toArabicDigits(s: string): string {
  const map = "٠١٢٣٤٥٦٧٨٩";
  return s.replace(/[0-9]/g, (d) => map[Number(d)]);
}

/** Samsung cellular coverage indicator: signal bars + 4G+ label. */
function Coverage({ color }: { color: string }) {
  const bars = [5, 7.5, 10, 12.5];
  return (
    <div dir="ltr" className="flex items-end gap-1">
      <div className="flex items-end gap-[1.5px]">
        {bars.map((h, i) => (
          <span key={i} style={{ width: 2.5, height: h, borderRadius: 1, background: color }} />
        ))}
      </div>
      <span style={{ fontSize: 11, fontWeight: 700, color, lineHeight: 1 }}>4G+</span>
    </div>
  );
}

function Wifi({ color }: { color: string }) {
  return (
    <svg width="16" height="12" viewBox="0 0 16 13" fill="none">
      <path d="M8 11.8 15.4 3a11 11 0 0 0-14.8 0L8 11.8Z" fill={color} />
    </svg>
  );
}

function Battery({ color }: { color: string }) {
  return (
    <svg width="24" height="13" viewBox="0 0 24 13" fill="none">
      <rect x="0.5" y="1.5" width="20" height="10" rx="3" stroke={color} strokeOpacity="0.6" />
      <rect x="2" y="3" width="14" height="7" rx="1.6" fill={color} />
      <rect x="21.5" y="4.5" width="2" height="4" rx="1" fill={color} fillOpacity="0.6" />
    </svg>
  );
}

function Alarm({ color }: { color: string }) {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="13" r="8" stroke={color} strokeWidth="2" />
      <path d="M12 9v4l2.5 2M4 5l3-2M20 5l-3-2" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/**
 * Samsung One UI status bar. The user chooses which icons appear (wifi /
 * cellular coverage / battery percentage). Battery sits at the edge.
 */
export function SamsungStatusBar({
  tint,
  background,
  lang,
  time = "10:05",
}: {
  tint: "light" | "dark";
  background?: string;
  lang: Lang;
  time?: string;
}) {
  const sb = useStudioStore((s) => s.scenario.statusBar) ?? DEFAULT_STATUS_BAR;
  const color = tint === "light" ? "#ffffff" : "#0b0b0b";
  const clock = lang === "ar" ? toArabicDigits(time) : time;

  return (
    <div
      className="flex w-full select-none items-center justify-between px-4"
      style={{ height: 30, background, fontFamily: "Roboto, 'Noto Sans Arabic', system-ui, sans-serif" }}
    >
      {/* inline-start: clock + a notification icon */}
      <div className="flex items-center gap-1.5">
        <span className="text-[13px] font-semibold" style={{ color }}>
          {clock}
        </span>
        <Alarm color={color} />
      </div>
      {/* inline-end: chosen connection icons (inner) then battery (at the edge) */}
      <div className="flex items-center gap-2">
        {sb.cellular && <Coverage color={color} />}
        {sb.wifi && <Wifi color={color} />}
        {sb.batteryPct && (
          <span className="text-[11px] font-semibold" style={{ color }}>
            {lang === "ar" ? toArabicDigits("85") : "85"}
          </span>
        )}
        <Battery color={color} />
      </div>
    </div>
  );
}
