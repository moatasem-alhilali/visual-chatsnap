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
    return (
      <div className="flex justify-center pb-2 pt-1.5" style={{ background: bg }}>
        <span className="rounded-full" style={{ width: 134, height: 5, background: fg }} />
      </div>
    );
  }
  // Android / Samsung 3-button navigation
  return (
    <div
      className="flex items-center justify-center gap-16 py-2.5"
      style={{ background: bg }}
    >
      {/* recents (square) */}
      <span
        className="block rounded-sm"
        style={{ width: 13, height: 13, border: `1.8px solid ${fg}` }}
      />
      {/* home (circle) */}
      <span
        className="block rounded-full"
        style={{ width: 15, height: 15, border: `1.8px solid ${fg}` }}
      />
      {/* back (triangle) */}
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="rtl:-scale-x-100">
        <path d="M15 5 7 12l8 7z" fill={fg} />
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
