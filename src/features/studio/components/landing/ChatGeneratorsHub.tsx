import Image from "next/image";
import { getTranslations } from "next-intl/server";

import { breadcrumbLd, JsonLd, absolute, organizationLd } from "@/core/seo/json-ld";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/shared/components/ui/button";
import { PlatformMark } from "../studio/BrandMarks";
import { LandingShell } from "./LandingShell";
import { APP_NAMES, fill, LANDING_APPS, landingPath, SCREENSHOT_SIZE, screenshotSrc } from "./landing-data";

type Locale = "ar" | "en";

/** Hub listing every chat generator (fully server-rendered). */
export async function ChatGeneratorsHub({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: "seo" });
  const names = APP_NAMES[locale];
  const path = landingPath();

  return (
    <LandingShell locale={locale} path={path}>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            organizationLd(),
            {
              "@type": "CollectionPage",
              "@id": absolute(`/${locale}${path}`),
              url: absolute(`/${locale}${path}`),
              name: t("hub.metaTitle"),
              description: t("hub.metaDescription"),
              inLanguage: locale,
              isPartOf: { "@id": absolute("/#website") },
            },
            {
              "@type": "ItemList",
              itemListElement: LANDING_APPS.map((app, i) => ({
                "@type": "ListItem",
                position: i + 1,
                name: t(`apps.${app}.h1`),
                url: absolute(`/${locale}${landingPath(app)}`),
              })),
            },
            breadcrumbLd([
              { name: t("common.breadcrumbHome"), path: `/${locale}` },
              { name: t("common.breadcrumbApps"), path: `/${locale}${path}` },
            ]),
          ],
        }}
      />

      <div className="mx-auto max-w-6xl px-4 py-8 md:py-12">
        <section className="max-w-3xl space-y-5">
          <h1 className="text-3xl leading-tight font-bold tracking-tight md:text-5xl">{t("hub.h1")}</h1>
          <p className="text-lg leading-relaxed text-muted-foreground">{t("hub.intro")}</p>
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/" className={buttonVariants({ size: "lg" })}>
              {t("common.breadcrumbHome")}
            </Link>
            <span className="text-sm text-muted-foreground">{t("common.free")}</span>
          </div>
        </section>

        <section className="mt-14 space-y-6">
          <h2 className="text-2xl font-bold tracking-tight">{t("hub.appsHeading")}</h2>
          <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {LANDING_APPS.map((app, i) => (
              <li key={app}>
                <Link
                  href={landingPath(app)}
                  aria-label={fill(t.raw("hub.cardCta") as string, names[app])}
                  className="group flex h-full flex-col gap-3 rounded-xl border border-border bg-card p-3 text-card-foreground transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                >
                  <Image
                    src={screenshotSrc(app, locale)}
                    alt={fill(t.raw("common.screenshotAlt") as string, names[app])}
                    width={SCREENSHOT_SIZE.width}
                    height={SCREENSHOT_SIZE.height}
                    priority={i < 4}
                    sizes="(min-width: 1024px) 260px, (min-width: 768px) 30vw, 45vw"
                    className="h-auto w-full"
                  />
                  <span className="flex items-center gap-2 font-semibold">
                    <PlatformMark platform={app} device="iphone" size={24} />
                    {t(`apps.${app}.h1`)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </LandingShell>
  );
}
