import { LockKeyhole } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { PageShell } from "@/shared/components/layout/PageShell";

type AuthPlaceholderProps = {
  mode: "login" | "register";
};

export async function AuthPlaceholder({ mode }: AuthPlaceholderProps) {
  const t = await getTranslations("auth");

  return (
    <PageShell className="flex items-center justify-center">
      <section className="w-full max-w-md rounded-lg border border-border bg-card p-6 text-center shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md bg-primary/10 text-primary">
          <LockKeyhole className="h-5 w-5" aria-hidden="true" />
        </div>
        <h1 className="mt-5 text-2xl font-bold">
          {mode === "login" ? t("loginTitle") : t("registerTitle")}
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">{t("placeholder")}</p>
      </section>
    </PageShell>
  );
}
