import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { createPageMetadata } from "@/core/seo/metadata";
import { ChatGeneratorPage, isLandingApp, LANDING_APPS, landingPath, screenshotSrc } from "@/features/studio/landing";

type Params = { params: Promise<{ locale: string; app: string }> };

/** Only the known apps exist; anything else is a 404. */
export const dynamicParams = false;

export function generateStaticParams() {
  return LANDING_APPS.map((app) => ({ app }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale, app } = await params;
  if (!isLandingApp(app)) return {};
  const t = await getTranslations({ locale, namespace: "seo" });
  const base = createPageMetadata({
    title: `${t(`apps.${app}.metaTitle`)} | Scenora`,
    description: t(`apps.${app}.metaDescription`),
    locale,
    path: `/${locale}${landingPath(app)}`,
  });
  // the share card stays the wide site image; the app screenshot is offered too
  const images = [...([base.openGraph?.images ?? []].flat()), { url: screenshotSrc(app, locale === "en" ? "en" : "ar"), width: 560, height: 1128 }];
  return { ...base, openGraph: { ...base.openGraph, images } };
}

export default async function ChatAppPage({ params }: Params) {
  const { locale, app } = await params;
  if (!isLandingApp(app)) notFound();
  setRequestLocale(locale);
  return <ChatGeneratorPage locale={locale === "en" ? "en" : "ar"} app={app} />;
}
