"use client";

import { useId } from "react";
import { useLocale } from "next-intl";

import { deviceFontFamily } from "../../data/fonts";
import { useStudioStore } from "../../store";
import { DEFAULT_STATUS_BAR } from "../../types";
import { vSb } from "./__verify"; // TEMP-VERIFY
import type { Device } from "../../types";
import { batteryLevel, SamsungStatusBar, statusTime } from "./SamsungStatusBar";

type Tint = "light" | "dark";

/*
 * iOS 26 status bar for a 393 pt-wide Dynamic Island iPhone (15 Pro / 16).
 * Measured on Apple's own iOS 26 renders (support.apple.com Messages guide,
 * iPhone 16 393 pt and iPhone 17 Pro 402 pt), in points:
 *  - height 54 (safe-area top is 59 because of the island)
 *  - time "9:41": SF Pro Semibold 17, centred at x ≈ 69.8, vertical centre ≈ 29.2
 *    (just above the island's centre line at 29.67); ink width ≈ 31.7
 *  - trailing cluster, right edge at 393 − 33.5, vertical centre ≈ 29.2:
 *    cellular 19.2×12.2 (4 bars 3.2 wide, pitch 5.33) · gap 7.2 ·
 *    Wi-Fi 17×12.3 (two arcs + wedge, ±42°) · gap 7.6 ·
 *    battery 27.4×13 (body 25.4×13, r ≈ 4.3, 1 pt outline at ~35 % opacity,
 *    fill inset 2 pt, cap 1.4×4 detached by 0.6)
 *  - with Battery Percentage on (iOS 16.1+), the outline goes away: the body is
 *    a translucent pill, the charge is solid and the number is knocked out of it.
 * The iOS status bar is not mirrored in RTL (Arabic) — time stays on the left —
 * and iOS templates in this app keep Western digits, so neither changes here.
 */

const IOS_FONT = deviceFontFamily("iphone", "roboto");
/** Apple's canonical marketing state: 9:41, full bars, full battery. */
const IOS_DEFAULT_TIME = "9:41";
const IOS_BATTERY_LEVEL = 100;
/** iOS paints the charge systemRed at this level and below (Low Power Mode off). */
const IOS_LOW_BATTERY = 20;
/** UIColor.systemRed — light / dark appearance (Apple HIG colour table). */
const IOS_RED = { onLight: "#FF3B30", onDark: "#FF453A" } as const;

/* ----------------------------- iOS glyphs ----------------------------- */

function IosCellular({ color }: { color: string }) {
  // Four rounded bars, bottom-aligned. Not mirrored in RTL (iOS keeps the
  // status bar layout fixed around the Dynamic Island).
  const hs = [5.1, 7.2, 9.7, 12.2];
  return (
    <svg width="19.2" height="12.2" viewBox="0 0 19.2 12.2" fill="none" style={{ display: "block" }}>
      {hs.map((h, i) => (
        <rect key={i} x={i * 5.333} y={12.2 - h} width="3.2" height={h} rx="1.05" fill={color} />
      ))}
    </svg>
  );
}

function IosWifi({ color }: { color: string }) {
  // Two concentric arcs with round caps over a rounded wedge, ±42° fan.
  return (
    <svg width="17" height="12.5" viewBox="0 0 17 12.5" fill="none" style={{ display: "block" }}>
      <path d="M1.407 4.123A10.6 10.6 0 0 1 15.593 4.123" stroke={color} strokeWidth="2.6" strokeLinecap="round" />
      <path d="M4.184 7.207A6.45 6.45 0 0 1 12.816 7.207" stroke={color} strokeWidth="2.6" strokeLinecap="round" />
      <path
        d="M8.5 12 6.292 9.548A3.3 3.3 0 0 1 10.708 9.548Z"
        fill={color}
        stroke={color}
        strokeWidth="0.9"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IosBattery({
  color,
  showPct,
  level,
  lowColor,
}: {
  color: string;
  showPct: boolean;
  /** 1–100 */
  level: number;
  /** systemRed for the current appearance (used at ≤ 20 %) */
  lowColor: string;
}) {
  const id = useId().replace(/:/g, "");
  const frac = level / 100;
  // iOS turns the charge red at 20 % and below (Low Power Mode off).
  const charge = level <= IOS_LOW_BATTERY ? lowColor : color;
  if (!showPct) {
    const chargeW = Math.max(21.4 * frac, 1.6);
    return (
      <svg width="27.4" height="13" viewBox="0 0 27.4 13" fill="none" style={{ display: "block" }}>
        <rect x="0.5" y="0.5" width="24.4" height="12" rx="3.8" stroke={color} strokeOpacity="0.35" />
        {/* the charge keeps its rounded ends even when nearly empty */}
        <rect x="2" y="2" width={chargeW} height="9" rx={Math.min(2.5, chargeW / 2)} fill={charge} />
        <path d="M26 4.5h.2a1.2 1.2 0 0 1 1.2 1.2v1.6a1.2 1.2 0 0 1-1.2 1.2H26Z" fill={color} fillOpacity="0.4" />
      </svg>
    );
  }
  // Percentage inside the battery: digits knocked out of the charge, solid over the empty part.
  const fillW = 25.4 * frac;
  const digits = (
    <text
      x="12.7"
      y="9.95"
      textAnchor="middle"
      fontSize="10.4"
      fontWeight="700"
      letterSpacing="-0.45"
      style={{ fontFamily: IOS_FONT }}
    >
      {level}
    </text>
  );
  return (
    <svg width="27.4" height="13" viewBox="0 0 27.4 13" fill="none" style={{ display: "block" }}>
      <defs>
        <mask id={`${id}k`} maskUnits="userSpaceOnUse" x="0" y="0" width="27.4" height="13">
          <rect width="27.4" height="13" fill="#fff" />
          <g fill="#000">{digits}</g>
        </mask>
        <clipPath id={`${id}c`}>
          <rect width="25.4" height="13" rx="4.3" />
        </clipPath>
        <clipPath id={`${id}e`}>
          <rect x={fillW} width={Math.max(25.4 - fillW, 0)} height="13" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id}c)`}>
        <rect width="25.4" height="13" fill={color} fillOpacity="0.4" />
        <rect width={fillW} height="13" fill={charge} mask={`url(#${id}k)`} />
      </g>
      {fillW < 25.4 && (
        <g fill={color} clipPath={`url(#${id}e)`}>
          {digits}
        </g>
      )}
      <path d="M26 4.5h.2a1.2 1.2 0 0 1 1.2 1.2v1.6a1.2 1.2 0 0 1-1.2 1.2H26Z" fill={color} fillOpacity="0.4" />
    </svg>
  );
}

/**
 * The phone's status bar. iPhone draws the iOS 26 bar (54 pt, transparent unless
 * `background` is given); Android delegates to the One UI 8 bar (30 dp).
 * `tint` is the glyph colour scheme: "light" = white glyphs, "dark" = black.
 */
export function StatusBar({
  device,
  tint,
  background,
  time,
}: {
  device: Device;
  tint: Tint;
  background?: string;
  time?: string;
}) {
  const sb = vSb(useStudioStore((s) => s.scenario.statusBar) ?? DEFAULT_STATUS_BAR); // TEMP-VERIFY
  const locale = useLocale();
  const color = tint === "light" ? "#ffffff" : "#000000";

  if (device !== "iphone") {
    return (
      <SamsungStatusBar tint={tint} background={background} lang={locale === "ar" ? "ar" : "en"} time={time} />
    );
  }

  return (
    <div
      dir="ltr"
      className="relative w-full shrink-0 select-none"
      style={{ height: 54, background, fontFamily: IOS_FONT }}
    >
      {/* Time — centred in the left ear */}
      <span
        className="absolute text-center"
        style={{
          left: 69.8 - 40,
          width: 80,
          top: 18.8,
          height: 22,
          lineHeight: "22px",
          fontSize: 17,
          fontWeight: 600,
          letterSpacing: -0.1,
          color,
          fontFeatureSettings: '"calt" 1, "case" 1',
          whiteSpace: "nowrap",
        }}
      >
        {statusTime(time, sb.time, IOS_DEFAULT_TIME)}
      </span>

      {/* Cellular · Wi-Fi · Battery — right edge 33.5 pt from the screen edge */}
      <div className="absolute flex items-center" style={{ right: 33.5, top: 29.6 - 6.5, height: 13 }}>
        {sb.cellular && (
          <span style={{ marginRight: 7.2 }}>
            <IosCellular color={color} />
          </span>
        )}
        {sb.wifi && (
          <span style={{ marginRight: 7.6 }}>
            <IosWifi color={color} />
          </span>
        )}
        <IosBattery
          color={color}
          showPct={sb.batteryPct}
          level={batteryLevel(sb.battery, IOS_BATTERY_LEVEL)}
          lowColor={tint === "light" ? IOS_RED.onDark : IOS_RED.onLight}
        />
      </div>
    </div>
  );
}
