"use client";

import { createElement } from "react";

import type { Device, Platform } from "../../types";
import type { PlatformMotion, PlatformProps } from "./types";
import { WhatsApp, whatsappIosMotion } from "./WhatsApp";
import { WhatsAppAndroid, whatsappAndroidMotion } from "./WhatsAppAndroid";
import { Telegram } from "./Telegram";
import { TelegramAndroid } from "./TelegramAndroid";
import { Instagram, instagramIosMotion } from "./Instagram";
import { InstagramAndroid, instagramAndroidMotion } from "./InstagramAndroid";
import { Snapchat, snapchatIosMotion } from "./Snapchat";
import { SnapchatAndroid, snapchatAndroidMotion } from "./SnapchatAndroid";
import { IMessage, imessageIosMotion } from "./iMessage";
import { SamsungMessages, samsungMessagesMotion } from "./SamsungMessages";

type PlatformComponent = (props: PlatformProps) => React.ReactNode;

export interface PlatformMeta {
  id: Platform;
  /** display name in the picker */
  label: string;
  /** brand accent used for the picker chip */
  accent: string;
  /** default (iOS) renderer */
  Component: PlatformComponent;
  /** optional device-specific renderer for Android/Samsung */
  android?: PlatformComponent;
  /** entrance motion of the iOS renderer (used by the video exporter) */
  motion?: PlatformMotion;
  /** entrance motion of the Android renderer */
  androidMotion?: PlatformMotion;
}

export const PLATFORMS: PlatformMeta[] = [
  { id: "whatsapp", label: "WhatsApp", accent: "#25d366", Component: WhatsApp, android: WhatsAppAndroid, motion: whatsappIosMotion, androidMotion: whatsappAndroidMotion },
  { id: "telegram", label: "Telegram", accent: "#2aabee", Component: Telegram, android: TelegramAndroid },
  { id: "instagram", label: "Instagram", accent: "#e1306c", Component: Instagram, android: InstagramAndroid, motion: instagramIosMotion, androidMotion: instagramAndroidMotion },
  { id: "snapchat", label: "Snapchat", accent: "#fffc00", Component: Snapchat, android: SnapchatAndroid, motion: snapchatIosMotion, androidMotion: snapchatAndroidMotion },
  { id: "imessage", label: "iMessage", accent: "#0a7cff", Component: IMessage, android: SamsungMessages, motion: imessageIosMotion, androidMotion: samsungMessagesMotion },
];

/** Resolve the right renderer for a platform on a given device. */
export function resolvePlatformComponent(platform: Platform, device: Device): PlatformComponent {
  const meta = PLATFORM_MAP[platform];
  if (device === "android" && meta.android) return meta.android;
  return meta.Component;
}

/** Generic fallback: slide up 16px + fade, ease-out cubic over 300ms. */
export const DEFAULT_MOTION: PlatformMotion = {
  enterMs: 300,
  enterStyle: (p) => {
    const e = 1 - Math.pow(1 - p, 3);
    return {
      opacity: e,
      transform: `translateY(${(1 - e) * 16}px) scale(${0.965 + 0.035 * e})`,
      transformOrigin: "center bottom",
    };
  },
};

/** Resolve the entrance motion for a platform on a given device. */
export function resolvePlatformMotion(platform: Platform, device: Device): PlatformMotion {
  const meta = PLATFORM_MAP[platform];
  if (device === "android" && meta.android) return meta.androidMotion ?? DEFAULT_MOTION;
  return meta.motion ?? DEFAULT_MOTION;
}

/** Stable component that renders the right device/platform template. */
export function PlatformView(props: PlatformProps) {
  const comp = resolvePlatformComponent(props.scenario.platform, props.scenario.device);
  return createElement(comp, props);
}

export const PLATFORM_MAP: Record<Platform, PlatformMeta> = PLATFORMS.reduce(
  (acc, p) => {
    acc[p.id] = p;
    return acc;
  },
  {} as Record<Platform, PlatformMeta>,
);
