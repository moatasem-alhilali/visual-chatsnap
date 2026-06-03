import { CheckCircle2, Gauge, Layers3, ShieldCheck } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { PageShell } from "@/shared/components/layout/PageShell";

const capabilities = [
  {
    icon: Layers3,
    titleKey: "architectureTitle",
    bodyKey: "architectureBody",
  },
  {
    icon: Gauge,
    titleKey: "performanceTitle",
    bodyKey: "performanceBody",
  },
  {
    icon: ShieldCheck,
    titleKey: "qualityTitle",
    bodyKey: "qualityBody",
  },
] as const;

export async function TemplateHomePage() {
  const t = await getTranslations("home");

  return (
    <PageShell className="flex flex-col gap-12">
      <section className="grid gap-8 py-10 lg:grid-cols-[1fr_420px] lg:items-center">
        <div className="space-y-6">
          <p className="text-sm font-semibold text-primary">{t("eyebrow")}</p>
          <div className="space-y-4">
            <h1 className="max-w-4xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              {t("title")}
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
              {t("description")}
            </p>
          </div>
          <ul className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
            {[t("pointOne"), t("pointTwo"), t("pointThree"), t("pointFour")].map((item) => (
              <li key={item} className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <p className="text-sm font-semibold text-muted-foreground">{t("readinessLabel")}</p>
          <dl className="mt-6 grid gap-4">
            <div className="flex items-center justify-between rounded-md bg-muted px-4 py-3">
              <dt className="text-sm text-muted-foreground">Next.js</dt>
              <dd className="font-semibold">16 App Router</dd>
            </div>
            <div className="flex items-center justify-between rounded-md bg-muted px-4 py-3">
              <dt className="text-sm text-muted-foreground">React</dt>
              <dd className="font-semibold">19</dd>
            </div>
            <div className="flex items-center justify-between rounded-md bg-muted px-4 py-3">
              <dt className="text-sm text-muted-foreground">i18n</dt>
              <dd className="font-semibold">next-intl</dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {capabilities.map(({ icon: Icon, titleKey, bodyKey }) => (
          <article key={titleKey} className="rounded-lg border border-border bg-card p-6">
            <Icon className="h-6 w-6 text-primary" aria-hidden="true" />
            <h2 className="mt-4 text-lg font-semibold">{t(titleKey)}</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{t(bodyKey)}</p>
          </article>
        ))}
      </section>
    </PageShell>
  );
}
