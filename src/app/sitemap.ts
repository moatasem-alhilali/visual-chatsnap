import type { MetadataRoute } from "next";

import { siteConfig } from "@/config/site";
import { LANDING_APPS, landingPath, screenshotSrc } from "@/features/studio/landing";

/** Bump when the public pages' content changes meaningfully. */
const CONTENT_UPDATED = new Date("2026-10-18");

const abs = (path: string) => new URL(path, siteConfig.url).toString();

/** One entry per locale, each listing every language version (hreflang). */
function localized(
  path: string,
  priority: number,
  images?: (locale: "ar" | "en") => string[],
): MetadataRoute.Sitemap {
  const languages = Object.fromEntries([
    ...siteConfig.locales.map((l) => [l, abs(`/${l}${path}`)]),
    ["x-default", abs(`/${siteConfig.defaultLocale}${path}`)],
  ]);
  return siteConfig.locales.map((locale) => ({
    url: abs(`/${locale}${path}`),
    lastModified: CONTENT_UPDATED,
    changeFrequency: "weekly",
    priority,
    alternates: { languages },
    images: images?.(locale).map(abs),
  }));
}

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    ...localized("", 1, () => [siteConfig.socialImage]),
    ...localized(landingPath(), 0.9, (l) => LANDING_APPS.map((app) => screenshotSrc(app, l))),
    ...LANDING_APPS.flatMap((app) => localized(landingPath(app), 0.8, (l) => [screenshotSrc(app, l)])),
  ];
}
