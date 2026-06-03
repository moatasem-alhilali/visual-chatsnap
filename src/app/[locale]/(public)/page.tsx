import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { createPageMetadata } from "@/core/seo/metadata";
import { StudioApp } from "@/features/studio";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata" });

  return createPageMetadata({
    title: t("title"),
    description: t("description"),
    path: `/${locale}`,
  });
}

export default function HomePage() {
  return <StudioApp />;
}
