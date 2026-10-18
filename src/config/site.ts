export const siteConfig = {
  name: process.env.NEXT_PUBLIC_SITE_NAME ?? "Scenora",
  shortName: process.env.NEXT_PUBLIC_SITE_SHORT_NAME ?? "Scenora",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://visual-chatsnap.vercel.app",
  description:
    process.env.NEXT_PUBLIC_SITE_DESCRIPTION ??
    "Scenora is a free, open-source studio for realistic WhatsApp, iMessage, Instagram, Telegram, Snapchat, Messenger, TikTok, X, Signal, Discord and Viber chats on iPhone and Samsung, exported as MP4 video ads in the browser.",
  defaultLocale: "ar",
  locales: ["ar", "en"] as const,
  supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "hello@scenora.app",
  repositoryUrl: "https://github.com/moatasem-alhilali/visual-chatsnap",
  /** 1200×600 share card (public/og.jpg) */
  socialImage: "/og.jpg",
  socialImageSize: { width: 1200, height: 600 },
  /** Search-engine ownership tokens (optional; set in the hosting env). */
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || undefined,
    bing: process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION || undefined,
    yandex: process.env.NEXT_PUBLIC_YANDEX_SITE_VERIFICATION || undefined,
  },
} as const;

export type AppLocale = (typeof siteConfig.locales)[number];
