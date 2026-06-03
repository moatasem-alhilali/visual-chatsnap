import { LayoutDashboard } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { PageShell } from "@/shared/components/layout/PageShell";

export async function DashboardPlaceholder() {
  const t = await getTranslations("dashboard");

  return (
    <PageShell>
      <section className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-md bg-primary/10 text-primary">
            <LayoutDashboard className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{t("title")}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{t("description")}</p>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
