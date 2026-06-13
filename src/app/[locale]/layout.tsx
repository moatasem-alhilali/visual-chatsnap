import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { Cairo, Geist, Geist_Mono, Inter, Roboto, Tajawal } from "next/font/google";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { AppProvider } from "@/providers/app-provider";
import { createPageMetadata } from "@/core/seo/metadata";
import { AnalyticsConsentBanner, VisitorAnalyticsTracker } from "@/features/analytics";
import { routing } from "@/i18n/routing";
import { siteConfig } from "@/config/site";
import "../globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const tajawal = Tajawal({
  variable: "--font-tajawal",
  subsets: ["arabic"],
  weight: ["400", "500", "700", "800"],
});

// iPhone uses an SF-like face (Inter); Samsung uses Roboto; Cairo is an
// alternative the user can switch the Samsung font to.
const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});
const cairo = Cairo({ variable: "--font-cairo", subsets: ["arabic", "latin"] });

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const isArabic = locale === "ar";

  return (
    <html
      lang={locale}
      dir={isArabic ? "rtl" : "ltr"}
      className={`${geistSans.variable} ${geistMono.variable} ${tajawal.variable} ${inter.variable} ${roboto.variable} ${cairo.variable}`}
      suppressHydrationWarning
    >
      <body
        className={`${isArabic ? "font-tajawal" : "font-sans"} antialiased`}
        suppressHydrationWarning
      >
        <AppProvider>
          <NextIntlClientProvider>
            <Suspense fallback={null}>
              <VisitorAnalyticsTracker />
            </Suspense>
            <AnalyticsConsentBanner />
            {children}
          </NextIntlClientProvider>
        </AppProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}

export function generateStaticParams() {
  return siteConfig.locales.map((locale) => ({ locale }));
}

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
    keywords: t("keywords"),
    locale,
    path: `/${locale}`,
  });
}
