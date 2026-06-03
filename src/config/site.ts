export const siteConfig = {
  name: process.env.NEXT_PUBLIC_SITE_NAME ?? "Enterprise Next.js Template",
  shortName: process.env.NEXT_PUBLIC_SITE_SHORT_NAME ?? "Template",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  description:
    process.env.NEXT_PUBLIC_SITE_DESCRIPTION ??
    "Production-ready multilingual Next.js template for large web applications.",
  defaultLocale: "ar",
  locales: ["ar", "en"] as const,
  supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "support@example.com",
  socialImage: "/og-image.png",
} as const;

export type AppLocale = (typeof siteConfig.locales)[number];
