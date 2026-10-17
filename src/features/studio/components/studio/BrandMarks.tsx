"use client";

import { useId } from "react";

import type { Device, Platform } from "../../types";
import { cn } from "@/shared/lib/utils";

/** Simplified, recognisable app marks drawn inline (no external images). */
export function PlatformMark({
  platform,
  device,
  size = 32,
  className,
}: {
  platform: Platform;
  device: Device;
  size?: number;
  className?: string;
}) {
  const raw = useId();
  const id = `pm${raw.replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 32 32",
    "aria-hidden": true,
    className: cn("shrink-0 drop-shadow-[0_1px_1px_rgb(0_0_0/0.12)]", className),
  } as const;

  if (platform === "whatsapp") {
    return (
      <svg {...common}>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#5EF07E" />
            <stop offset="1" stopColor="#1EBE57" />
          </linearGradient>
        </defs>
        <rect width="32" height="32" rx="8" fill={`url(#${id})`} />
        <path
          d="M16 7.2a8.8 8.8 0 0 0-7.6 13.3L7.3 24.7l4.3-1.1A8.8 8.8 0 1 0 16 7.2Z"
          fill="none"
          stroke="#fff"
          strokeWidth="1.9"
          strokeLinejoin="round"
        />
        <path
          d="M12.7 11.7c.2-.4.4-.4.7-.4h.5c.2 0 .4 0 .6.4l.8 1.9c.1.2.1.4 0 .6l-.5.7c-.1.2-.1.3 0 .5.4.8 1 1.5 1.7 2 .5.4 1 .6 1.4.8.2.1.3 0 .5-.1l.7-.8c.1-.2.3-.2.5-.1l1.8.9c.2.1.3.2.3.3 0 .4-.1 1.1-.5 1.5-.5.5-1.4.9-2.3.7-1-.2-2.4-.8-3.7-2-1.5-1.3-2.4-2.9-2.6-3.6-.3-.9-.1-1.8.4-2.4Z"
          fill="#fff"
        />
      </svg>
    );
  }

  if (platform === "telegram") {
    return (
      <svg {...common}>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#41BCF5" />
            <stop offset="1" stopColor="#1C93D6" />
          </linearGradient>
        </defs>
        <rect width="32" height="32" rx="8" fill={`url(#${id})`} />
        <path
          d="M7.4 15.6 22.6 9.7c.7-.3 1.4.2 1.1 1.3l-2.6 12.2c-.2.9-.7 1.1-1.5.7l-4-2.9-1.9 1.9c-.2.2-.4.4-.8.4l.3-4.1 7.4-6.7c.3-.3-.1-.5-.5-.2l-9.1 5.7-3.9-1.2c-.9-.3-.9-.9.3-1.2Z"
          fill="#fff"
        />
      </svg>
    );
  }

  if (platform === "instagram") {
    return (
      <svg {...common}>
        <defs>
          <radialGradient id={id} cx="0.3" cy="1.05" r="1.25">
            <stop offset="0" stopColor="#FFD776" />
            <stop offset="0.25" stopColor="#F9A23A" />
            <stop offset="0.5" stopColor="#EE2A7B" />
            <stop offset="0.78" stopColor="#B42ABD" />
            <stop offset="1" stopColor="#5B4FE0" />
          </radialGradient>
        </defs>
        <rect width="32" height="32" rx="8" fill={`url(#${id})`} />
        <rect x="8.4" y="8.4" width="15.2" height="15.2" rx="4.6" fill="none" stroke="#fff" strokeWidth="1.9" />
        <circle cx="16" cy="16" r="3.7" fill="none" stroke="#fff" strokeWidth="1.9" />
        <circle cx="20.5" cy="11.5" r="1.1" fill="#fff" />
      </svg>
    );
  }

  if (platform === "snapchat") {
    return (
      <svg {...common}>
        <rect width="32" height="32" rx="8" fill="#FFFC00" />
        <path
          d="M16 7.6c-2.9 0-4.9 2.1-4.9 5v2.1l-1.3-.4c-.5-.1-.9.4-.5.8l1.6 1.1c-.6 1.6-1.8 2.9-3.2 3.4-.4.1-.4.6 0 .7l1.6.5.3 1.2 1.9-.1c.9.1 1.8 1.3 4.5 1.3s3.6-1.2 4.5-1.3l1.9.1.3-1.2 1.6-.5c.4-.1.4-.6 0-.7-1.4-.5-2.6-1.8-3.2-3.4l1.6-1.1c.4-.4 0-.9-.5-.8l-1.3.4v-2.1c0-2.9-2-5-4.9-5Z"
          fill="#fff"
          stroke="#111"
          strokeWidth="1.15"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  // iMessage → Apple Messages on iPhone, Samsung Messages on Samsung.
  if (device === "android") {
    return (
      <svg {...common}>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#5B9BFF" />
            <stop offset="1" stopColor="#2F6BEB" />
          </linearGradient>
        </defs>
        <rect width="32" height="32" rx="10" fill={`url(#${id})`} />
        <path
          d="M10.6 9.4h10.8a3.4 3.4 0 0 1 3.4 3.4v5.6a3.4 3.4 0 0 1-3.4 3.4h-4.9l-3.9 3v-3h-2a3.4 3.4 0 0 1-3.4-3.4v-5.6a3.4 3.4 0 0 1 3.4-3.4Z"
          fill="#fff"
        />
        <circle cx="12.6" cy="15.6" r="1.15" fill="#2F6BEB" />
        <circle cx="16" cy="15.6" r="1.15" fill="#2F6BEB" />
        <circle cx="19.4" cy="15.6" r="1.15" fill="#2F6BEB" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#66F282" />
          <stop offset="1" stopColor="#0FBD2C" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill={`url(#${id})`} />
      <ellipse cx="16" cy="15" rx="8.6" ry="7" fill="#fff" />
      <path d="M10.2 19.4c-.2 1.7-1.1 3-2.4 3.7 2.3.3 4.2-.5 5.4-1.7Z" fill="#fff" />
    </svg>
  );
}

/** Phone silhouette used by the device picker. */
export function DeviceGlyph({ device, className }: { device: Device; className?: string }) {
  if (device === "iphone") {
    return (
      <svg viewBox="0 0 40 72" aria-hidden className={cn("h-14 w-auto", className)}>
        <rect x="2" y="2" width="36" height="68" rx="9.5" fill="currentColor" opacity="0.1" />
        <rect x="2" y="2" width="36" height="68" rx="9.5" fill="none" stroke="currentColor" strokeWidth="2.2" />
        <rect x="14" y="6.6" width="12" height="3.6" rx="1.8" fill="currentColor" />
        <rect x="15" y="64.6" width="10" height="1.4" rx="0.7" fill="currentColor" opacity="0.6" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 40 72" aria-hidden className={cn("h-14 w-auto", className)}>
      <rect x="2" y="2" width="36" height="68" rx="6" fill="currentColor" opacity="0.1" />
      <rect x="2" y="2" width="36" height="68" rx="6" fill="none" stroke="currentColor" strokeWidth="2.2" />
      <circle cx="20" cy="8.4" r="1.9" fill="currentColor" />
      <path d="M13 64.6h3M19 64.6h2M24.5 64.6h2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" opacity="0.6" />
    </svg>
  );
}
