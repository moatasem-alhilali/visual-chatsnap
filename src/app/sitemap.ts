import type { MetadataRoute } from "next";

import { siteConfig } from "@/config/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return siteConfig.locales.map((locale) => ({
    url: `${siteConfig.url}/${locale}`,
    changeFrequency: "weekly",
    priority: locale === siteConfig.defaultLocale ? 1 : 0.8,
    lastModified: new Date(),
  }));
}
