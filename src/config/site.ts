export const siteConfig = {
  name: process.env.NEXT_PUBLIC_SITE_NAME ?? "Scenora",
  shortName: process.env.NEXT_PUBLIC_SITE_SHORT_NAME ?? "Scenora",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://visual-chatsnap.vercel.app",
  description:
    process.env.NEXT_PUBLIC_SITE_DESCRIPTION ??
    "Scenora is a realistic conversation simulation platform for building authentic WhatsApp, Telegram, Instagram, Snapchat, and iMessage chat scenarios for marketing and content creation.",
  defaultLocale: "ar",
  locales: ["ar", "en"] as const,
  supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "hello@scenora.app",
  socialImage: "/logo.png",
} as const;

export type AppLocale = (typeof siteConfig.locales)[number];
