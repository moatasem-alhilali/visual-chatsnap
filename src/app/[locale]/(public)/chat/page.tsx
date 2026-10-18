import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { createPageMetadata } from "@/core/seo/metadata";
import { ChatGeneratorsHub, landingPath } from "@/features/studio";

type Params = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "seo" });
  return createPageMetadata({
    title: `${t("hub.metaTitle")} | Scenora`,
    description: t("hub.metaDescription"),
    keywords: (await getTranslations({ locale, namespace: "metadata" }))("keywords"),
    locale,
    path: `/${locale}${landingPath()}`,
  });
}

export default async function ChatHubPage({ params }: Params) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <ChatGeneratorsHub locale={locale === "en" ? "en" : "ar"} />;
}
