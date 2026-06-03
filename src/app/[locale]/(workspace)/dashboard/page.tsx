import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { DashboardPlaceholder } from "@/features/dashboard/components/DashboardPlaceholder";
import { createPageMetadata } from "@/core/seo/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("dashboard");

  return createPageMetadata({
    title: t("title"),
    description: t("description"),
    path: "/dashboard",
    noIndex: true,
  });
}

export default function DashboardPage() {
  return <DashboardPlaceholder />;
}
