import type { Platform } from "../../types";

/**
 * Public, indexable landing pages: one per chat app (`/[locale]/chat/[app]`)
 * plus the hub (`/[locale]/chat`). Copy lives in `dictionary/*.json` → `seo`.
 */
export const LANDING_APPS = [
  "whatsapp",
  "imessage",
  "instagram",
  "telegram",
  "snapchat",
  "messenger",
  "tiktok",
  "x",
  "signal",
  "discord",
  "viber",
] as const satisfies readonly Platform[];

export type LandingApp = (typeof LANDING_APPS)[number];

export const isLandingApp = (v: string): v is LandingApp => (LANDING_APPS as readonly string[]).includes(v);

/** Brand names as people search for them, per UI language. */
export const APP_NAMES: Record<"ar" | "en", Record<LandingApp, string>> = {
  en: {
    whatsapp: "WhatsApp",
    imessage: "iMessage",
    instagram: "Instagram",
    telegram: "Telegram",
    snapchat: "Snapchat",
    messenger: "Messenger",
    tiktok: "TikTok",
    x: "X",
    signal: "Signal",
    discord: "Discord",
    viber: "Viber",
  },
  ar: {
    whatsapp: "واتساب",
    imessage: "آي مسج",
    instagram: "إنستغرام",
    telegram: "تيليجرام",
    snapchat: "سناب شات",
    messenger: "ماسنجر",
    tiktok: "تيك توك",
    x: "X",
    signal: "سيجنال",
    discord: "ديسكورد",
    viber: "فايبر",
  },
};

export const landingPath = (app?: LandingApp) => (app ? `/chat/${app}` : "/chat");

/** Screenshot rendered from the real template (public/screens, 560×1128). */
export const screenshotSrc = (app: LandingApp, locale: "ar" | "en") => `/screens/${app}-${locale}.webp`;
export const SCREENSHOT_SIZE = { width: 560, height: 1128 } as const;

export interface LandingFaq {
  q: string;
  a: string;
}

export const fill = (s: string, app: string) => s.replaceAll("{app}", app);
