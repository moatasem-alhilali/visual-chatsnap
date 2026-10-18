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

  if (platform === "messenger") {
    return (
      <svg {...common}>
        <defs>
          <radialGradient id={id} cx="0.15" cy="1" r="1.25">
            <stop offset="0" stopColor="#0099FF" />
            <stop offset="0.6" stopColor="#A033FF" />
            <stop offset="0.9" stopColor="#FF5280" />
            <stop offset="1" stopColor="#FF7061" />
          </radialGradient>
        </defs>
        <rect width="32" height="32" rx="8" fill={`url(#${id})`} />
        <path
          d="M16 6.6c-5.4 0-9.6 3.9-9.6 9.2 0 2.8 1.1 5.2 3 6.9v3.3l3-1.6c1.1.3 2.3.5 3.6.5 5.4 0 9.6-3.9 9.6-9.2S21.4 6.6 16 6.6Z"
          fill="#fff"
        />
        <path
          d="m10.5 18.7 2.9-4.7c.5-.8 1.5-.9 2.2-.4l2.3 1.7c.2.2.5.2.7 0l3.1-2.4c.4-.3.9.2.7.6l-2.9 4.7c-.5.8-1.5.9-2.2.4l-2.3-1.7c-.2-.2-.5-.2-.7 0l-3.1 2.4c-.4.3-.9-.2-.7-.6Z"
          fill="#7A3CF7"
        />
      </svg>
    );
  }

  if (platform === "tiktok") {
    const note =
      "M18.4 6.8h3c.2 1.9 1.6 3.3 3.4 3.5v3.1c-1.3 0-2.5-.4-3.4-1v5.9c0 3.1-2.5 5.6-5.6 5.6s-5.6-2.5-5.6-5.6 2.5-5.6 5.6-5.6c.3 0 .6 0 .9.1V16c-.3-.1-.6-.1-.9-.1-1.4 0-2.6 1.2-2.6 2.6s1.2 2.6 2.6 2.6 2.6-1.2 2.6-2.6Z";
    return (
      <svg {...common}>
        <rect width="32" height="32" rx="8" fill="#000" />
        <path d={note} fill="#25F4EE" transform="translate(-0.9 -0.9)" />
        <path d={note} fill="#FE2C55" transform="translate(0.9 0.9)" />
        <path d={note} fill="#fff" />
      </svg>
    );
  }

  if (platform === "x") {
    return (
      <svg {...common}>
        <rect width="32" height="32" rx="8" fill="#000" />
        <path
          d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
          fill="#fff"
          transform="translate(8.4 8.4) scale(0.64)"
        />
      </svg>
    );
  }

  if (platform === "signal") {
    return (
      <svg {...common}>
        <rect width="32" height="32" rx="8" fill="#3A76F0" />
        <circle cx="16" cy="15.6" r="9.3" fill="none" stroke="#fff" strokeWidth="1.5" strokeDasharray="3.1 1.5" />
        <path
          d="M16 8.6a7.1 7.1 0 0 0-6.2 10.6l-.9 3.4 3.4-.9A7.1 7.1 0 1 0 16 8.6Z"
          fill="#fff"
        />
      </svg>
    );
  }

  if (platform === "discord") {
    return (
      <svg {...common}>
        <rect width="32" height="32" rx="8" fill="#5865F2" />
        <path
          d="M20.317 4.37a19.79 19.79 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.865-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.74 19.74 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.1 13.1 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.291a.074.074 0 0 1 .078-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.099.246.198.373.292a.077.077 0 0 1-.007.127 12.3 12.3 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.363 1.225 1.993a.076.076 0 0 0 .084.029 19.84 19.84 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03ZM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418Zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418Z"
          fill="#fff"
          transform="translate(8.1 9.3) scale(0.66)"
        />
      </svg>
    );
  }

  if (platform === "viber") {
    return (
      <svg {...common}>
        <rect width="32" height="32" rx="8" fill="#7360F2" />
        <path
          d="M16 6.6c5.6 0 9 2.6 9 8.4 0 5.7-3.4 8.2-9 8.2-.8 0-1.6 0-2.3-.1l-3 2.6v-3.5C8 20.9 7 18.4 7 15c0-5.8 3.4-8.4 9-8.4Z"
          fill="none"
          stroke="#fff"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <path
          d="M13.2 11.4c.3-.3.8-.3 1 0l1 1.3c.2.3.2.7 0 .9l-.5.5c.4.9 1.1 1.6 2 2l.5-.5c.3-.2.7-.2.9 0l1.3 1c.3.2.3.7 0 1l-.6.6c-.5.5-1.3.6-2 .2a10 10 0 0 1-3.8-3.8c-.4-.7-.3-1.5.2-2Z"
          fill="#fff"
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
