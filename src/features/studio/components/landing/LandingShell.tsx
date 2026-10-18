import Image from "next/image";
import { getTranslations } from "next-intl/server";

import { siteConfig } from "@/config/site";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/shared/components/ui/button";
import { LANDING_APPS, landingPath } from "./landing-data";

type Locale = "ar" | "en";

/**
 * Header + footer shared by the public chat-generator pages (server-rendered).
 * Links into the studio use prefetch={false}: prefetching would download the
 * whole studio bundle on these lightweight pages and slow their first paint.
 */
export async function LandingShell({
  locale,
  path,
  children,
}: {
  locale: Locale;
  /** path of this page without the locale, for the language switch */
  path: string;
  children: React.ReactNode;
}) {
  const t = await getTranslations({ locale, namespace: "seo" });
  const other: Locale = locale === "ar" ? "en" : "ar";

  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4">
          <Link href="/" prefetch={false} className="flex items-center gap-2 rounded-md font-semibold focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
            <Image src="/favicon/android-chrome-192x192.png" alt="" width={28} height={28} className="size-7" />
            <span>{siteConfig.name}</span>
          </Link>
          <nav aria-label={t("common.breadcrumbApps")} className="ms-auto flex items-center gap-1 text-sm">
            <Link href={landingPath()} className={buttonVariants({ variant: "ghost", size: "sm" })}>
              {t("common.breadcrumbApps")}
            </Link>
            <Link href={path} locale={other} hrefLang={other} className={buttonVariants({ variant: "ghost", size: "sm" })}>
              {other === "ar" ? "العربية" : "English"}
            </Link>
            <Link href="/" prefetch={false} className={buttonVariants({ size: "sm" })}>
              {t("common.breadcrumbHome")}
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-border">
        <div className="mx-auto max-w-6xl space-y-4 px-4 py-8 text-sm text-muted-foreground">
          <nav aria-label={t("common.otherApps")}>
            <ul className="flex flex-wrap gap-x-4 gap-y-2">
              {LANDING_APPS.map((app) => (
                <li key={app}>
                  <Link href={landingPath(app)} className="rounded-sm hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
                    {t(`apps.${app}.h1`)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span>
              © {siteConfig.name} · {t("common.free")}
            </span>
            <a
              href={siteConfig.repositoryUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-sm underline-offset-4 hover:text-foreground hover:underline"
            >
              GitHub
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
