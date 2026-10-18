"use client";

import { useId } from "react";

import { deviceFontFamily } from "../../data/fonts";
import { useStudioStore } from "../../store";
import { DEFAULT_STATUS_BAR } from "../../types";
import type { Lang } from "../platforms/chrome";

/*
 * Samsung One UI 8 status bar (Galaxy S25, 360 dp wide).
 *  - 30 dp tall here (templates are laid out against it); glyph centre line at
 *    16 dp so it lines up with the centred punch-hole (centre 17 dp, Ø 17).
 *  - Clock at the inline-start (22 dp inset), system font (the device's
 *    Samsung font setting), 14 sp medium, followed by notification icons.
 *  - Inline-end, in order: VoLTE · Wi-Fi · signal (+ network type when data
 *    goes over cellular) · battery, 20 dp from the edge.
 *  - One UI 7+ battery: horizontal pill, translucent empty part, solid charge;
 *    with "Show battery percentage" the number is drawn *inside* the pill
 *    (knocked out of the charge) instead of beside it.
 *  - Android mirrors the whole bar in RTL locales (clock on the right) and the
 *    Arabic locale (ar-SA/ar-EG…) uses Arabic-Indic digits by default (CLDR
 *    `arab` numbering system), so the clock and the percentage use ٠-٩.
 */

/** Convert ASCII digits to Arabic-Indic so the One UI clock reads like the real device. */
function toArabicDigits(s: string): string {
  const map = "٠١٢٣٤٥٦٧٨٩";
  return s.replace(/[0-9]/g, (d) => map[Number(d)]);
}

const DEFAULT_TIME = "10:05";
const BATTERY_LEVEL = 85;
/**
 * One UI paints the battery charge red at Android's low-battery warning level
 * (config_lowBatteryWarningLevel = 15 %) and below.
 */
const LOW_BATTERY = 15;
/** One UI low-battery red, tuned per glyph tint so it keeps contrast. */
const LOW_RED = { onLight: "#E8322E", onDark: "#FF5A52" } as const;

/** Clamp a user battery level to an integer 1–100, falling back to `fallback`. */
export function batteryLevel(value: number | undefined, fallback: number): number {
  if (value === undefined || !Number.isFinite(value)) return fallback;
  return Math.min(100, Math.max(1, Math.round(value)));
}

/** Status-bar clock: explicit prop › user setting › device default; shown as typed. */
export function statusTime(prop: string | undefined, setting: string | undefined, fallback: string): string {
  const pick = (v: string | undefined) => (v && v.trim() ? v.trim() : undefined);
  return pick(prop) ?? pick(setting) ?? fallback;
}

/** One UI cellular signal: four ascending rounded bars. Mirrors in RTL like the rest of the bar. */
function Signal({ color }: { color: string }) {
  const hs = [4.2, 6.6, 9, 11.4];
  return (
    <svg width="14.4" height="11.4" viewBox="0 0 14.4 11.4" fill="none" style={{ display: "block" }} className="rtl:-scale-x-100">
      {hs.map((h, i) => (
        <rect key={i} x={i * 3.85} y={11.4 - h} width="2.85" height={h} rx="0.9" fill={color} />
      ))}
    </svg>
  );
}

/** Network type over cellular data (hidden when Wi-Fi carries the data, like One UI). */
function NetType({ color, label }: { color: string; label: string }) {
  return (
    <span
      dir="ltr"
      style={{
        fontSize: 9.5,
        fontWeight: 700,
        lineHeight: "10px",
        letterSpacing: -0.2,
        color,
        alignSelf: "flex-start",
        marginTop: -1.5,
        marginInlineEnd: 0.5,
      }}
    >
      {label}
    </span>
  );
}

/** VoLTE indicator: "Vo" stacked over "LTE". */
function VoLte({ color }: { color: string }) {
  return (
    <span
      dir="ltr"
      className="flex flex-col items-center"
      style={{ color, fontWeight: 700, lineHeight: 1, letterSpacing: -0.1 }}
    >
      <span style={{ fontSize: 7.4, lineHeight: "7px" }}>Vo</span>
      <span style={{ fontSize: 6.6, lineHeight: "7px" }}>LTE</span>
    </span>
  );
}

/** One UI Wi-Fi: a solid rounded fan (full signal). */
function Wifi({ color }: { color: string }) {
  return (
    <svg width="15.6" height="12" viewBox="0 0 15.6 12" fill="none" style={{ display: "block" }}>
      <path
        d="M7.8 11.2 0.66 3.87A10.4 10.4 0 0 1 14.94 3.87Z"
        fill={color}
        stroke={color}
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** One UI 7/8 horizontal battery; percentage (optional) drawn inside, knocked out of the charge. */
function Battery({
  color,
  pct,
  lang,
  level,
  lowColor,
}: {
  color: string;
  pct: boolean;
  lang: Lang;
  /** 1–100 */
  level: number;
  lowColor: string;
}) {
  const id = useId().replace(/:/g, "");
  const W = pct ? 25 : 22; // the pill widens a little to fit the number
  const H = 11.6;
  const fillW = (W * level) / 100;
  const charge = level <= LOW_BATTERY ? lowColor : color;
  const num = lang === "ar" ? toArabicDigits(String(level)) : String(level);
  const total = W + 2.4;
  return (
    <svg width={total} height={H} viewBox={`0 0 ${total} ${H}`} fill="none" style={{ display: "block" }}>
      <defs>
        <clipPath id={`${id}b`}>
          <rect width={W} height={H} rx="3.6" />
        </clipPath>
        {pct && (
          <mask id={`${id}k`} maskUnits="userSpaceOnUse" x="0" y="0" width={total} height={H}>
            <rect width={total} height={H} fill="#fff" />
            <text x={W / 2} y={H / 2 + 3.45} textAnchor="middle" fontSize="9.6" fontWeight="700" fill="#000">
              {num}
            </text>
          </mask>
        )}
        {pct && (
          <clipPath id={`${id}e`}>
            <rect x={fillW} width={W - fillW} height={H} />
          </clipPath>
        )}
      </defs>
      <g clipPath={`url(#${id}b)`}>
        <rect width={W} height={H} fill={color} fillOpacity="0.32" />
        <rect width={fillW} height={H} fill={charge} mask={pct ? `url(#${id}k)` : undefined} />
      </g>
      {pct && (
        <text
          x={W / 2}
          y={H / 2 + 3.45}
          textAnchor="middle"
          fontSize="9.6"
          fontWeight="700"
          fill={color}
          clipPath={`url(#${id}e)`}
        >
          {num}
        </text>
      )}
      <rect x={W + 0.7} y={H / 2 - 2.2} width="1.7" height="4.4" rx="0.85" fill={color} fillOpacity="0.32" />
    </svg>
  );
}

/** Generic notification icon (Messages-style speech bubble) shown after the clock. */
function NotifMessage({ color }: { color: string }) {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" style={{ display: "block" }}>
      <path
        d="M12 3.2c-5 0-9 3.4-9 7.7 0 2.4 1.3 4.6 3.4 6l-.7 3.6 4-2.1c.8.2 1.5.2 2.3.2 5 0 9-3.4 9-7.7S17 3.2 12 3.2Z"
        fill={color}
      />
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
  time,
}: {
  tint: "light" | "dark";
  background?: string;
  lang: Lang;
  time?: string;
}) {
  const sb = useStudioStore((s) => s.scenario.statusBar) ?? DEFAULT_STATUS_BAR;
  const androidFont = useStudioStore((s) => s.scenario.androidFont);
  const color = tint === "light" ? "#ffffff" : "#000000";
  const t = statusTime(time, sb.time, DEFAULT_TIME);
  const clock = lang === "ar" ? toArabicDigits(t) : t;

  return (
    <div
      className="flex w-full shrink-0 select-none items-center justify-between"
      style={{
        height: 30,
        paddingTop: 2,
        paddingInlineStart: 22,
        paddingInlineEnd: 20,
        background,
        fontFamily: deviceFontFamily("android", androidFont),
        fontFeatureSettings: '"tnum" 0',
      }}
    >
      {/* inline-start: clock + a notification icon */}
      <div className="flex items-center" style={{ gap: 6 }}>
        <span style={{ fontSize: 14, fontWeight: 500, lineHeight: "16px", letterSpacing: 0.1, color }}>{clock}</span>
        <NotifMessage color={color} />
      </div>
      {/* inline-end: chosen connection icons (inner) then battery (at the edge) */}
      <div className="flex items-center" style={{ gap: 4.5 }}>
        {sb.cellular && <VoLte color={color} />}
        {sb.wifi && <Wifi color={color} />}
        {sb.cellular && (
          <div className="flex items-end">
            {!sb.wifi && <NetType color={color} label="5G" />}
            <Signal color={color} />
          </div>
        )}
        <span style={{ marginInlineStart: 1 }}>
          <Battery
            color={color}
            pct={sb.batteryPct}
            lang={lang}
            level={batteryLevel(sb.battery, BATTERY_LEVEL)}
            lowColor={tint === "light" ? LOW_RED.onDark : LOW_RED.onLight}
          />
        </span>
      </div>
    </div>
  );
}
