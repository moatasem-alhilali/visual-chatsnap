"use client";

import { useId } from "react";
import { useLocale } from "next-intl";

import { deviceFontFamily } from "../../data/fonts";
import { useStudioStore } from "../../store";
import { DEFAULT_STATUS_BAR } from "../../types";
import type { Device } from "../../types";
import { SamsungStatusBar } from "./SamsungStatusBar";

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
const IOS_BATTERY_LEVEL = 100;

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

function IosBattery({ color, showPct }: { color: string; showPct: boolean }) {
  const id = useId().replace(/:/g, "");
  const level = IOS_BATTERY_LEVEL / 100;
  if (!showPct) {
    return (
      <svg width="27.4" height="13" viewBox="0 0 27.4 13" fill="none" style={{ display: "block" }}>
        <rect x="0.5" y="0.5" width="24.4" height="12" rx="3.8" stroke={color} strokeOpacity="0.35" />
        <rect x="2" y="2" width={21.4 * level} height="9" rx="2.5" fill={color} />
        <path d="M26 4.5h.2a1.2 1.2 0 0 1 1.2 1.2v1.6a1.2 1.2 0 0 1-1.2 1.2H26Z" fill={color} fillOpacity="0.4" />
      </svg>
    );
  }
  // Percentage inside the battery: digits knocked out of the charge, solid over the empty part.
  const fillW = 25.4 * level;
  return (
    <svg width="27.4" height="13" viewBox="0 0 27.4 13" fill="none" style={{ display: "block" }}>
      <defs>
        <mask id={`${id}k`} maskUnits="userSpaceOnUse" x="0" y="0" width="27.4" height="13">
          <rect width="27.4" height="13" fill="#fff" />
          <text
            x="12.7"
            y="10.15"
            textAnchor="middle"
            fontSize="11"
            fontWeight="700"
            letterSpacing="-0.35"
            fill="#000"
            style={{ fontFamily: IOS_FONT }}
          >
            {IOS_BATTERY_LEVEL}
          </text>
        </mask>
        <clipPath id={`${id}c`}>
          <rect width="25.4" height="13" rx="4.3" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id}c)`}>
        <rect width="25.4" height="13" fill={color} fillOpacity="0.4" />
        <rect width={fillW} height="13" fill={color} mask={`url(#${id}k)`} />
      </g>
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
  const sb = useStudioStore((s) => s.scenario.statusBar) ?? DEFAULT_STATUS_BAR;
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
          top: 18.2,
          height: 22,
          lineHeight: "22px",
          fontSize: 17,
          fontWeight: 600,
          letterSpacing: -0.4,
          color,
          fontFeatureSettings: '"calt" 1, "case" 1',
          whiteSpace: "nowrap",
        }}
      >
        {time ?? "9:41"}
      </span>

      {/* Cellular · Wi-Fi · Battery — right edge 33.5 pt from the screen edge */}
      <div className="absolute flex items-center" style={{ right: 33.5, top: 29.2 - 6.5, height: 13 }}>
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
        <IosBattery color={color} showPct={sb.batteryPct} />
      </div>
    </div>
  );
}
