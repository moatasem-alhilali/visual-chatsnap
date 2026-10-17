"use client";

/**
 * Snapchat for Android (Samsung One UI device) — Chat screen.
 *
 * Same visual language as the iOS renderer (see Snapchat.tsx for the full spec
 * notes and sources): grouped messages under "ME" (#F23C57) / friend name
 * (#0EADFF) labels with a 2px leading bar, blue filled/hollow chat arrows for
 * Delivered/Opened, grey "TODAY" divider, "Send a chat" input row.
 *
 * Android-specific differences rendered here:
 * - Samsung One UI status bar (SamsungStatusBar) and 3-button navigation bar.
 * - Type follows the device font chosen in settings (scenario.androidFont is
 *   applied by DeviceFrame and inherited), instead of iOS Avenir Next.
 * - Heavier, slightly shorter back chevron; 36px header avatar/buttons;
 *   15.5px message text and tighter side gutters (360dp-wide screen).
 */

import { SnapchatScreen } from "./Snapchat";
import type { PlatformProps } from "./types";

export function SnapchatAndroid(props: PlatformProps) {
  return <SnapchatScreen {...props} os="android" />;
}
