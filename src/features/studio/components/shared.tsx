"use client";

import { useEffect, useRef } from "react";

import type { Device, Person } from "../types";

/**
 * The OS bottom affordance — an iOS home indicator pill for iPhone, or the
 * Android (Samsung) 3-button navigation bar for Android. This is one of the
 * clearest tells that distinguishes the two device mockups.
 */
export function SystemBottomBar({
  device,
  bg,
  fg,
}: {
  device: Device;
  bg: string;
  fg: string;
}) {
  if (device === "iphone") {
    // iOS home indicator: 134×5 pt capsule, 8 pt above the bottom edge
    // (19 pt band in total — templates compensate for exactly this height).
    return (
      <div className="flex shrink-0 justify-center" style={{ background: bg, paddingTop: 6, paddingBottom: 8 }}>
        <span style={{ width: 134, height: 5, borderRadius: 2.5, background: fg }} />
      </div>
    );
  }
  // Samsung One UI 8 3-button navigation: 48 dp tall, default order
  // recents | home | back, keys centred at 76 / 180 / 284 dp on a 360 dp
  // screen (the whole bar — and the back chevron — mirror in an RTL locale).
  // Glyphs: three 13 dp bars, a 15 dp rounded square (r 5), a 7×13 dp chevron,
  // all ~1.6 dp strokes in the bar's foreground colour.
  return (
    <div
      className="grid shrink-0 items-center justify-center"
      style={{ background: bg, height: 48, width: "100%", gridTemplateColumns: "repeat(3, 104px)" }}
    >
      {/* recents: three vertical bars */}
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="justify-self-center" style={{ display: "block" }}>
        <path d="M5.4 3.5v13M10 3.5v13M14.6 3.5v13" stroke={fg} strokeWidth="1.6" strokeLinecap="round" />
      </svg>
      {/* home: rounded square */}
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="justify-self-center" style={{ display: "block" }}>
        <rect x="2.5" y="2.5" width="15" height="15" rx="5" stroke={fg} strokeWidth="1.6" />
      </svg>
      {/* back: chevron */}
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        className="justify-self-center rtl:-scale-x-100"
        style={{ display: "block" }}
      >
        <path d="M12.6 3.5 6.2 10l6.4 6.5" stroke={fg} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

/** Detect predominant direction so Arabic renders RTL inside an LTR app and vice-versa. */
export function dirOf(text: string): "rtl" | "ltr" {
  const rtl =
    /[֐-׿؀-ۿ܀-ݏݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿]/;
  return rtl.test(text) ? "rtl" : "ltr";
}

/** Auto-scroll a chat body to the bottom whenever the dependency changes. */
export function useChatScroll<T extends HTMLElement>(
  dep: unknown,
): React.RefObject<T | null> {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [dep]);
  return ref;
}

const AVATAR_COLORS = [
  "#e57373",
  "#9575cd",
  "#4db6ac",
  "#f06292",
  "#7986cb",
  "#4dd0e1",
  "#ffb74d",
  "#a1887f",
];

function initials(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "?";
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function colorFor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + hash * 31;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export function Avatar({
  person,
  size,
  className,
}: {
  person: Person;
  size: number;
  className?: string;
}) {
  if (person.avatar) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={person.avatar}
        alt={person.name}
        width={size}
        height={size}
        className={`shrink-0 rounded-full object-cover ${className ?? ""}`}
        style={{ width: size, height: size }}
        draggable={false}
      />
    );
  }
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full font-semibold text-white ${className ?? ""}`}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.42,
        background: colorFor(person.name),
      }}
    >
      {initials(person.name)}
    </div>
  );
}
