"use client";

// PLACEHOLDER — the real iOS 26 / One UI 8 keyboards are being built in this file.
// Keep the exports (KEYBOARD_HEIGHT, Keyboard) and the props shape.

import type { ChatTheme, Device } from "../../types";

/** Full keyboard height in screen px, including the bottom system area. */
export const KEYBOARD_HEIGHT: Record<Device, number> = { iphone: 336, android: 330 };

export interface KeyboardProps {
  device: Device;
  theme: ChatTheme;
  /** layout: Arabic or English */
  lang: "ar" | "en";
  /** text typed so far in the composer (its last character is the key being pressed), or null */
  typed: string | null;
  /** exporter clock (ms) — derive any animation from it when defined */
  clockMs?: number;
}

export function Keyboard({ device, theme }: KeyboardProps) {
  const dark = theme === "dark";
  return (
    <div
      className="h-full w-full"
      style={{ height: KEYBOARD_HEIGHT[device], background: dark ? "#2b2b2b" : "#d1d4db" }}
    />
  );
}
