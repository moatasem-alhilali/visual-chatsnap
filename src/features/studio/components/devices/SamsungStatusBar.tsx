"use client";

import type { Lang } from "../platforms/chrome";

/** Convert ASCII digits to Arabic-Indic so the One UI clock reads like the real device. */
function toArabicDigits(s: string): string {
  const map = "٠١٢٣٤٥٦٧٨٩";
  return s.replace(/[0-9]/g, (d) => map[Number(d)]);
}

/** Samsung cellular coverage indicator: signal bars + 4G+ + VoLTE/LTE+ label. */
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
      <div className="flex flex-col items-start" style={{ fontSize: 6.5, fontWeight: 700, lineHeight: 1.15, color }}>
        <span>VoLTE</span>
        <span>LTE+</span>
      </div>
    </div>
  );
}

function Battery({ color }: { color: string }) {
  // One UI horizontal battery with a small terminal on the end.
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
 * Samsung One UI status bar. Clock + notification icon at the inline-start
 * (right in Arabic / left in English); on the inline-end the battery sits at the
 * edge followed by the cellular coverage, mirroring with the UI direction.
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
      {/* inline-end: coverage (inner) then battery (at the edge) */}
      <div className="flex items-center gap-2">
        <Coverage color={color} />
        <Battery color={color} />
      </div>
    </div>
  );
}
