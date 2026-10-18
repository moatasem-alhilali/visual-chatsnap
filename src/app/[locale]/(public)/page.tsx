import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { siteConfig } from "@/config/site";
import { absolute, JsonLd, organizationLd, websiteLd } from "@/core/seo/json-ld";
import { createPageMetadata } from "@/core/seo/metadata";
import { StudioApp } from "@/features/studio";
import { LANDING_APPS, landingPath, screenshotSrc } from "@/features/studio/landing";

type Params = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata" });

  return createPageMetadata({
    title: t("title"),
    description: t("description"),
    keywords: t("keywords"),
    locale,
    path: `/${locale}`,
  });
}

export default async function HomePage({ params }: Params) {
  const { locale } = await params;
  const lang = locale === "en" ? "en" : "ar";
  const t = await getTranslations({ locale, namespace: "metadata" });
  const seo = await getTranslations({ locale, namespace: "seo" });

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            organizationLd(),
            websiteLd(),
            {
              "@type": "WebApplication",
              "@id": absolute("/#app"),
              name: siteConfig.name,
              url: absolute(`/${locale}`),
              description: t("description"),
              inLanguage: locale,
              applicationCategory: "MultimediaApplication",
              applicationSubCategory: "Chat mockup and video ad maker",
              operatingSystem: "Any (web browser)",
              browserRequirements: "Requires a modern browser with JavaScript; video export uses WebCodecs.",
              isAccessibleForFree: true,
              offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
              license: "https://opensource.org/licenses/MIT",
              screenshot: LANDING_APPS.slice(0, 4).map((app) => absolute(screenshotSrc(app, lang))),
              image: absolute(siteConfig.socialImage),
              featureList: LANDING_APPS.map((app) => seo(`apps.${app}.h1`)),
              sameAs: [siteConfig.repositoryUrl],
              publisher: { "@id": absolute("/#organization") },
              hasPart: LANDING_APPS.map((app) => ({
                "@type": "WebPage",
                name: seo(`apps.${app}.h1`),
                url: absolute(`/${locale}${landingPath(app)}`),
              })),
            },
          ],
        }}
      />
      <StudioApp />
    </>
  );
}
