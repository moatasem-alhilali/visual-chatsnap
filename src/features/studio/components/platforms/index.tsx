"use client";

import { createElement } from "react";

import type { Device, Platform } from "../../types";
import type { PlatformProps } from "./types";
import { WhatsApp } from "./WhatsApp";
import { WhatsAppAndroid } from "./WhatsAppAndroid";
import { Telegram } from "./Telegram";
import { Instagram } from "./Instagram";
import { InstagramAndroid } from "./InstagramAndroid";
import { Snapchat } from "./Snapchat";
import { SnapchatAndroid } from "./SnapchatAndroid";
import { IMessage } from "./iMessage";

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
}

export const PLATFORMS: PlatformMeta[] = [
  { id: "whatsapp", label: "WhatsApp", accent: "#25d366", Component: WhatsApp, android: WhatsAppAndroid },
  { id: "telegram", label: "Telegram", accent: "#2aabee", Component: Telegram },
  { id: "instagram", label: "Instagram", accent: "#e1306c", Component: Instagram, android: InstagramAndroid },
  { id: "snapchat", label: "Snapchat", accent: "#fffc00", Component: Snapchat, android: SnapchatAndroid },
  { id: "imessage", label: "iMessage", accent: "#0a7cff", Component: IMessage },
];

/** Resolve the right renderer for a platform on a given device. */
export function resolvePlatformComponent(platform: Platform, device: Device): PlatformComponent {
  const meta = PLATFORM_MAP[platform];
  if (device === "android" && meta.android) return meta.android;
  return meta.Component;
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
