"use client";

import { ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import {
  getAnalyticsConsent,
  setAnalyticsConsent,
  type AnalyticsConsent,
} from "@/features/analytics/services/analytics-identifiers";

export default function AnalyticsConsentBanner() {
  const t = useTranslations("analyticsConsent");
  const [consent, setConsent] = useState<AnalyticsConsent | null>("declined");

  useEffect(() => {
    queueMicrotask(() => setConsent(getAnalyticsConsent()));
  }, []);

  function choose(next: AnalyticsConsent): void {
    setAnalyticsConsent(next);
    setConsent(next);

    if (next === "accepted") {
      window.dispatchEvent(new Event("analytics-consent-accepted"));
    }
  }

  if (consent !== null) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 px-4 pb-4">
      <div className="pointer-events-auto mx-auto max-w-md rounded-lg border border-border bg-card p-4 text-card-foreground shadow-lg">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
            <ShieldCheck aria-hidden="true" size={17} strokeWidth={1.8} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">{t("title")}</p>
            <p className="mt-1.5 text-xs leading-6 text-muted-foreground">{t("description")}</p>
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => choose("accepted")}
            className="min-h-10 flex-1 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {t("accept")}
          </button>
          <button
            type="button"
            onClick={() => choose("declined")}
            className="min-h-10 rounded-md border border-border px-3 text-sm font-medium text-muted-foreground transition hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {t("decline")}
          </button>
        </div>
      </div>
    </div>
  );
}
