import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { AuthPlaceholder } from "@/features/auth/components/AuthPlaceholder";
import { createPageMetadata } from "@/core/seo/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth");

  return createPageMetadata({
    title: t("loginTitle"),
    description: t("placeholder"),
    path: "/login",
    noIndex: true,
  });
}

export default function LoginPage() {
  return <AuthPlaceholder mode="login" />;
}
