import type { Metadata } from "next";

import { siteConfig } from "@/config/site";

type MetadataInput = {
  title: string;
  description: string;
  path?: string;
  image?: string;
  noIndex?: boolean;
  keywords?: string;
  locale?: string;
};

const OG_LOCALE: Record<string, string> = { ar: "ar_SA", en: "en_US" };

export function createPageMetadata({
  title,
  description,
  path = "/",
  image = siteConfig.socialImage,
  noIndex = false,
  keywords,
  locale,
}: MetadataInput): Metadata {
  const url = new URL(path, siteConfig.url);
  const imageUrl = new URL(image, siteConfig.url);
  const languages = createLanguageAlternates(path);
  const ogLocale = locale ? OG_LOCALE[locale] : undefined;
  const altLocale = locale
    ? siteConfig.locales.filter((l) => l !== locale).map((l) => OG_LOCALE[l])
    : undefined;

  return {
    title,
    description,
    metadataBase: new URL(siteConfig.url),
    applicationName: siteConfig.name,
    keywords: keywords
      ? keywords.split(",").map((k) => k.trim()).filter(Boolean)
      : undefined,
    alternates: {
      canonical: url,
      languages,
    },
    openGraph: {
      title,
      description,
      url,
      siteName: siteConfig.name,
      images: [{ url: imageUrl, width: 1200, height: 630, alt: title }],
      type: "website",
      locale: ogLocale,
      alternateLocale: altLocale,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl.toString()],
    },
    robots: noIndex
      ? { index: false, follow: false }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-image-preview": "large",
            "max-snippet": -1,
            "max-video-preview": -1,
          },
      },
  };
}

function createLanguageAlternates(path: string): Record<string, string> {
  const segments = path.split("/").filter(Boolean);
  const hasLocalePrefix =
    segments[0] !== undefined && (siteConfig.locales as readonly string[]).includes(segments[0]);
  const pathWithoutLocale = hasLocalePrefix ? segments.slice(1) : segments;

  const alternates = Object.fromEntries(
    siteConfig.locales.map((locale) => [
      locale,
      new URL(`/${[locale, ...pathWithoutLocale].filter(Boolean).join("/")}`, siteConfig.url).toString(),
    ]),
  );

  return {
    ...alternates,
    "x-default": new URL(
      `/${[siteConfig.defaultLocale, ...pathWithoutLocale].filter(Boolean).join("/")}`,
      siteConfig.url,
    ).toString(),
  };
}
