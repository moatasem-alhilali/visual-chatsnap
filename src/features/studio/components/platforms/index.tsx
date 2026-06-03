"use client";

import type { Platform } from "../../types";
import type { PlatformProps } from "./types";
import { WhatsApp } from "./WhatsApp";
import { Telegram } from "./Telegram";
import { Instagram } from "./Instagram";
import { Snapchat } from "./Snapchat";
import { IMessage } from "./iMessage";

export interface PlatformMeta {
  id: Platform;
  /** display name in the picker */
  label: string;
  /** brand accent used for the picker chip */
  accent: string;
  Component: (props: PlatformProps) => React.ReactNode;
}

export const PLATFORMS: PlatformMeta[] = [
  { id: "whatsapp", label: "WhatsApp", accent: "#25d366", Component: WhatsApp },
  { id: "telegram", label: "Telegram", accent: "#2aabee", Component: Telegram },
  { id: "instagram", label: "Instagram", accent: "#e1306c", Component: Instagram },
  { id: "snapchat", label: "Snapchat", accent: "#fffc00", Component: Snapchat },
  { id: "imessage", label: "iMessage", accent: "#0a7cff", Component: IMessage },
];

export const PLATFORM_MAP: Record<Platform, PlatformMeta> = PLATFORMS.reduce(
  (acc, p) => {
    acc[p.id] = p;
    return acc;
  },
  {} as Record<Platform, PlatformMeta>,
);
