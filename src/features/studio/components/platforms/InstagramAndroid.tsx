"use client";

/**
 * Instagram Direct — thread screen (Instagram for Android on a Samsung device).
 *
 * Instagram ships the same visual language on both OSes (same bubble colours,
 * screen-anchored purple → blue outgoing gradient, #EFEFEF / #262626 incoming
 * bubbles, white / true-black canvas, "Seen" receipt, typing bubble, composer
 * with the round camera button). Sources are listed in Instagram.tsx.
 *
 * Android-specific differences rendered here:
 *  - One UI status bar (SamsungStatusBar) tinted to the canvas, Samsung 3-button
 *    navigation bar at the bottom.
 *  - Material back ARROW (with a stem) instead of the iOS chevron.
 *  - Text runs in the device font (scenario.androidFont → Roboto by default,
 *    applied by DeviceFrame) at 15sp / 20sp line height; names in bold (Roboto
 *    700 — Instagram for Android renders "semibold" as bold).
 *  - Slightly tighter metrics for the 360dp-wide screen: 32dp header avatar,
 *    56dp toolbar, 12dp side gutters, 44dp composer.
 */

import { SamsungStatusBar } from "../devices/SamsungStatusBar";
import { IgThread, type IgSpec } from "./Instagram";
import type { PlatformProps } from "./types";

function AndroidBack({ color }: { color: string }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="shrink-0 rtl:-scale-x-100">
      <path d="M20.5 12H4M11 4.8 3.8 12l7.2 7.2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const ANDROID_SPEC: IgSpec = {
  renderStatusBar: ({ dark, bg, lang }) => <SamsungStatusBar tint={dark ? "light" : "dark"} background={bg} lang={lang} />,
  renderBack: (color) => (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center">
      <AndroidBack color={color} />
    </span>
  ),
  bottomDevice: () => "android",
  textSize: 15,
  lineHeight: 20,
  bubblePadX: 12,
  bubblePadY: 9,
  bubbleMax: "72%",
  radius: 21,
  joinedRadius: 4,
  inAvatar: 28,
  bodyPadX: 12,
  headerAvatar: 32,
  headerHeight: 56,
  headerPadStart: 4,
  headerPadEnd: 16,
  nameSize: 16,
  nameWeight: 700,
  subSize: 12.5,
  iconSize: 24,
  composerHeight: 44,
  composerText: 15,
  composerBottom: 8,
};

export function InstagramAndroid(props: PlatformProps) {
  return <IgThread {...props} spec={ANDROID_SPEC} />;
}
