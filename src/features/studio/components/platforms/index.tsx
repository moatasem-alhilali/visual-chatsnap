"use client";

import { lazy, Suspense, type ComponentType } from "react";

import type { Device, Platform } from "../../types";
import type { PlatformMotion, PlatformProps } from "./types";

type PlatformComponent = ComponentType<PlatformProps>;
type Os = "ios" | "android";

export interface PlatformMeta {
  id: Platform;
  /** display name in the picker */
  label: string;
  /** brand accent used for the picker chip */
  accent: string;
}

export const PLATFORMS: PlatformMeta[] = [
  { id: "whatsapp", label: "WhatsApp", accent: "#25d366" },
  { id: "telegram", label: "Telegram", accent: "#2aabee" },
  { id: "instagram", label: "Instagram", accent: "#e1306c" },
  { id: "snapchat", label: "Snapchat", accent: "#fffc00" },
  { id: "imessage", label: "iMessage", accent: "#0a7cff" },
  { id: "messenger", label: "Messenger", accent: "#0866ff" },
  { id: "tiktok", label: "TikTok", accent: "#fe2c55" },
  { id: "x", label: "X", accent: "#0f1419" },
  { id: "signal", label: "Signal", accent: "#3a76f0" },
  { id: "discord", label: "Discord", accent: "#5865f2" },
  { id: "viber", label: "Viber", accent: "#7360f2" },
];

export const PLATFORM_MAP: Record<Platform, PlatformMeta> = PLATFORMS.reduce(
  (acc, p) => {
    acc[p.id] = p;
    return acc;
  },
  {} as Record<Platform, PlatformMeta>,
);

interface PlatformModule {
  Component: PlatformComponent;
  /** entrance motion of this renderer (used by the video exporter) */
  motion: PlatformMotion;
}

/**
 * Each app × OS template is its own code-split chunk (some are large, e.g. the
 * Telegram wallpapers), so the studio only downloads the one being shown.
 * iMessage on Android renders Samsung Messages (iMessage doesn't exist there).
 */
const LOADERS: Record<Platform, Record<Os, () => Promise<PlatformModule>>> = {
  whatsapp: {
    ios: () => import("./WhatsApp").then((m) => ({ Component: m.WhatsApp, motion: m.whatsappIosMotion })),
    android: () =>
      import("./WhatsAppAndroid").then((m) => ({ Component: m.WhatsAppAndroid, motion: m.whatsappAndroidMotion })),
  },
  telegram: {
    ios: () => import("./Telegram").then((m) => ({ Component: m.Telegram, motion: m.telegramIosMotion })),
    android: () =>
      import("./TelegramAndroid").then((m) => ({ Component: m.TelegramAndroid, motion: m.telegramAndroidMotion })),
  },
  instagram: {
    ios: () => import("./Instagram").then((m) => ({ Component: m.Instagram, motion: m.instagramIosMotion })),
    android: () =>
      import("./InstagramAndroid").then((m) => ({ Component: m.InstagramAndroid, motion: m.instagramAndroidMotion })),
  },
  snapchat: {
    ios: () => import("./Snapchat").then((m) => ({ Component: m.Snapchat, motion: m.snapchatIosMotion })),
    android: () =>
      import("./SnapchatAndroid").then((m) => ({ Component: m.SnapchatAndroid, motion: m.snapchatAndroidMotion })),
  },
  imessage: {
    ios: () => import("./iMessage").then((m) => ({ Component: m.IMessage, motion: m.imessageIosMotion })),
    android: () =>
      import("./SamsungMessages").then((m) => ({ Component: m.SamsungMessages, motion: m.samsungMessagesMotion })),
  },
  messenger: {
    ios: () => import("./Messenger").then((m) => ({ Component: m.Messenger, motion: m.messengerIosMotion })),
    android: () =>
      import("./MessengerAndroid").then((m) => ({ Component: m.MessengerAndroid, motion: m.messengerAndroidMotion })),
  },
  tiktok: {
    ios: () => import("./TikTok").then((m) => ({ Component: m.TikTok, motion: m.tiktokIosMotion })),
    android: () =>
      import("./TikTokAndroid").then((m) => ({ Component: m.TikTokAndroid, motion: m.tiktokAndroidMotion })),
  },
  x: {
    ios: () => import("./XChat").then((m) => ({ Component: m.XChat, motion: m.xIosMotion })),
    android: () => import("./XChatAndroid").then((m) => ({ Component: m.XChatAndroid, motion: m.xAndroidMotion })),
  },
  signal: {
    ios: () => import("./Signal").then((m) => ({ Component: m.Signal, motion: m.signalIosMotion })),
    android: () =>
      import("./SignalAndroid").then((m) => ({ Component: m.SignalAndroid, motion: m.signalAndroidMotion })),
  },
  discord: {
    ios: () => import("./Discord").then((m) => ({ Component: m.Discord, motion: m.discordIosMotion })),
    android: () =>
      import("./DiscordAndroid").then((m) => ({ Component: m.DiscordAndroid, motion: m.discordAndroidMotion })),
  },
  viber: {
    ios: () => import("./Viber").then((m) => ({ Component: m.Viber, motion: m.viberIosMotion })),
    android: () => import("./ViberAndroid").then((m) => ({ Component: m.ViberAndroid, motion: m.viberAndroidMotion })),
  },
};

const osOf = (device: Device): Os => (device === "android" ? "android" : "ios");
const keyOf = (platform: Platform, device: Device) => `${platform}:${osOf(device)}`;

const loaded = new Map<string, PlatformModule>();
const pending = new Map<string, Promise<PlatformModule>>();

/** Load (once) the template for a platform/device; resolves when its chunk is ready. */
export function preloadPlatform(platform: Platform, device: Device): Promise<PlatformModule> {
  const key = keyOf(platform, device);
  const done = loaded.get(key);
  if (done) return Promise.resolve(done);
  let p = pending.get(key);
  if (!p) {
    p = LOADERS[platform][osOf(device)]().then((m) => {
      loaded.set(key, m);
      return m;
    });
    pending.set(key, p);
  }
  return p;
}

/** One lazy component per app × OS, created once at module level. */
const VIEWS = Object.fromEntries(
  PLATFORMS.map((p) => [
    p.id,
    {
      ios: lazy(() => preloadPlatform(p.id, "iphone").then((m) => ({ default: m.Component }))),
      android: lazy(() => preloadPlatform(p.id, "android").then((m) => ({ default: m.Component }))),
    },
  ]),
) as unknown as Record<Platform, Record<Os, PlatformComponent>>;

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

/**
 * Entrance motion for a platform on a given device. The template is always on
 * screen (and therefore loaded) before an export starts; until then this
 * falls back to DEFAULT_MOTION — await `preloadPlatform` to be certain.
 */
export function resolvePlatformMotion(platform: Platform, device: Device): PlatformMotion {
  return loaded.get(keyOf(platform, device))?.motion ?? DEFAULT_MOTION;
}

/** Renders the right app template for the scenario's platform + device. */
export function PlatformView(props: PlatformProps) {
  const View = VIEWS[props.scenario.platform][osOf(props.scenario.device)];
  const blank = props.scenario.theme === "dark" ? "#000" : "#fff";
  return (
    <Suspense fallback={<div className="h-full w-full" style={{ background: blank }} />}>
      <View {...props} />
    </Suspense>
  );
}
