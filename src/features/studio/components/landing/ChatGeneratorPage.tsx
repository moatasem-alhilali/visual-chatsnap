import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";

import { siteConfig } from "@/config/site";
import { breadcrumbLd, faqLd, JsonLd, absolute, organizationLd } from "@/core/seo/json-ld";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/shared/components/ui/button";
import { PlatformMark } from "../studio/BrandMarks";
import { LandingShell } from "./LandingShell";
import {
  APP_NAMES,
  fill,
  LANDING_APPS,
  landingPath,
  SCREENSHOT_SIZE,
  screenshotSrc,
  type LandingApp,
  type LandingFaq,
} from "./landing-data";

type Locale = "ar" | "en";

/** Public landing page for one app's chat generator (fully server-rendered). */
export async function ChatGeneratorPage({ locale, app }: { locale: Locale; app: LandingApp }) {
  const t = await getTranslations({ locale, namespace: "seo" });
  const name = APP_NAMES[locale][app];
  const features = t.raw(`apps.${app}.features`) as string[];
  const how = (t.raw("common.how") as string[]).map((s) => fill(s, name));
  const faq = (t.raw("common.faq") as LandingFaq[]).map((f) => ({ q: fill(f.q, name), a: fill(f.a, name) }));
  const Chevron = locale === "ar" ? ChevronLeft : ChevronRight;
  const path = landingPath(app);
  const studioHref = { pathname: "/", query: { app } } as const;

  const crumbs = [
    { name: t("common.breadcrumbHome"), path: `/${locale}` },
    { name: t("common.breadcrumbApps"), path: `/${locale}${landingPath()}` },
    { name: t(`apps.${app}.h1`), path: `/${locale}${path}` },
  ];

  return (
    <LandingShell locale={locale} path={path}>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            organizationLd(),
            {
              "@type": "WebPage",
              "@id": absolute(`/${locale}${path}`),
              url: absolute(`/${locale}${path}`),
              name: t(`apps.${app}.metaTitle`),
              description: t(`apps.${app}.metaDescription`),
              inLanguage: locale,
              isPartOf: { "@id": absolute("/#website") },
              primaryImageOfPage: absolute(screenshotSrc(app, locale)),
              about: { "@id": absolute("/#app") },
            },
            {
              "@type": "WebApplication",
              "@id": absolute("/#app"),
              name: siteConfig.name,
              url: absolute(`/${locale}`),
              applicationCategory: "MultimediaApplication",
              operatingSystem: "Any (web browser)",
              isAccessibleForFree: true,
              offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
              publisher: { "@id": absolute("/#organization") },
            },
            breadcrumbLd(crumbs),
            faqLd(faq),
          ],
        }}
      />

      <div className="mx-auto max-w-6xl px-4 py-8 md:py-12">
        <nav aria-label="Breadcrumb" className="mb-6 text-sm text-muted-foreground">
          <ol className="flex flex-wrap items-center gap-1">
            <li>
              <Link href="/" prefetch={false} className="rounded-sm hover:text-foreground">
                {crumbs[0].name}
              </Link>
            </li>
            <li aria-hidden>
              <Chevron className="size-3.5" />
            </li>
            <li>
              <Link href={landingPath()} className="rounded-sm hover:text-foreground">
                {crumbs[1].name}
              </Link>
            </li>
            <li aria-hidden>
              <Chevron className="size-3.5" />
            </li>
            <li aria-current="page" className="text-foreground">
              {crumbs[2].name}
            </li>
          </ol>
        </nav>

        <section className="grid items-center gap-10 md:grid-cols-[minmax(0,1fr)_300px] lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-5">
            <PlatformMark platform={app} device="iphone" size={56} />
            <h1 className="text-3xl leading-tight font-bold tracking-tight md:text-5xl">{t(`apps.${app}.h1`)}</h1>
            <p className="max-w-2xl text-lg leading-relaxed text-muted-foreground">{t(`apps.${app}.intro`)}</p>
            <div className="flex flex-wrap items-center gap-3">
              <Link href={studioHref} prefetch={false} className={buttonVariants({ size: "lg" })}>
                {fill(t.raw("common.openStudio") as string, name)}
              </Link>
              <span className="text-sm text-muted-foreground">{t("common.free")}</span>
            </div>
            <p className="text-sm text-muted-foreground">{t("common.devicesLabel")}</p>
          </div>
          <Image
            src={screenshotSrc(app, locale)}
            alt={fill(t.raw("common.screenshotAlt") as string, name)}
            width={SCREENSHOT_SIZE.width}
            height={SCREENSHOT_SIZE.height}
            preload
            fetchPriority="high"
            loading="eager"
            sizes="(min-width: 1024px) 340px, (min-width: 768px) 300px, 80vw"
            className="mx-auto h-auto w-full max-w-[300px] md:max-w-none"
          />
        </section>

        <section className="mt-16 space-y-6">
          <h2 className="text-2xl font-bold tracking-tight">{fill(t.raw("common.featuresHeading") as string, name)}</h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {features.map((f) => (
              <li key={f} className="flex gap-3 rounded-xl border border-border bg-card p-4 text-card-foreground">
                <Check className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-16 space-y-6">
          <h2 className="text-2xl font-bold tracking-tight">{fill(t.raw("common.howHeading") as string, name)}</h2>
          <ol className="grid gap-3 md:grid-cols-3">
            {how.map((step, i) => (
              <li key={step} className="rounded-xl border border-border bg-card p-4 text-card-foreground">
                <span className="mb-2 flex size-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-16 space-y-4">
          <h2 className="text-2xl font-bold tracking-tight">{t("common.faqHeading")}</h2>
          <div className="divide-y divide-border rounded-xl border border-border">
            {faq.map((f) => (
              <details key={f.q} className="group p-4">
                <summary className="cursor-pointer rounded-sm font-medium focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
                  {f.q}
                </summary>
                <p className="mt-2 leading-relaxed text-muted-foreground">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="mt-16 space-y-4">
          <h2 className="text-2xl font-bold tracking-tight">{t("common.otherApps")}</h2>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {LANDING_APPS.filter((a) => a !== app).map((a) => (
              <li key={a}>
                <Link
                  href={landingPath(a)}
                  className="flex items-center gap-2 rounded-xl border border-border p-3 text-sm font-medium hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                >
                  <PlatformMark platform={a} device="iphone" size={24} />
                  {t(`apps.${a}.h1`)}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <p className="mt-12 text-xs text-muted-foreground">{fill(t.raw("common.trademark") as string, name)}</p>
      </div>
    </LandingShell>
  );
}
