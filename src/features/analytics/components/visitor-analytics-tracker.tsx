"use client";

import { useLocale } from "next-intl";
import { usePathname, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  getUtmParams,
  safeAnalyticsMetadata,
  trackAnalyticsEvent,
} from "@/features/analytics/api/track-analytics";
import { hasAnalyticsConsent } from "@/features/analytics/services/analytics-identifiers";

interface ActivePage {
  key: string;
  path: string;
  url: string;
  title: string;
  enteredAt: string;
  startedAtMs: number;
}

const SESSION_STARTED_KEY = "scenora_analytics_session_started";

export default function VisitorAnalyticsTracker() {
  const locale = useLocale();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [consented, setConsented] = useState(false);
  const activePage = useRef<ActivePage | null>(null);
  const maxScrollDepth = useRef(0);

  const search = searchParams.toString();
  const pageKey = useMemo(() => `${pathname}?${search}`, [pathname, search]);

  const leaveActivePage = useCallback((): void => {
    const page = activePage.current;
    if (!page) return;

    const durationSeconds = Math.max(0, Math.round((Date.now() - page.startedAtMs) / 1000));
    activePage.current = null;

    trackAnalyticsEvent({
      type: "page_leave",
      path: page.path,
      url: page.url,
      title: page.title,
      durationSeconds,
      scrollDepth: maxScrollDepth.current,
      metadata: safeAnalyticsMetadata(),
    });
  }, []);

  useEffect(() => {
    queueMicrotask(() => setConsented(hasAnalyticsConsent()));

    const onAccepted = () => setConsented(true);
    window.addEventListener("analytics-consent-accepted", onAccepted);

    return () => window.removeEventListener("analytics-consent-accepted", onAccepted);
  }, []);

  useEffect(() => {
    if (!consented) return;

    const updateScrollDepth = () => {
      const scrollable = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const current = Math.round((window.scrollY / scrollable) * 100);
      maxScrollDepth.current = Math.max(maxScrollDepth.current, Math.min(100, current));
    };

    updateScrollDepth();
    window.addEventListener("scroll", updateScrollDepth, { passive: true });
    window.addEventListener("resize", updateScrollDepth, { passive: true });

    return () => {
      window.removeEventListener("scroll", updateScrollDepth);
      window.removeEventListener("resize", updateScrollDepth);
    };
  }, [consented]);

  useEffect(() => {
    if (!consented) return;

    const started = sessionStorage.getItem(SESSION_STARTED_KEY);
    const currentUrl = window.location.href;
    const referrer = document.referrer || null;
    const params = getUtmParams(new URLSearchParams(search));

    if (!started) {
      sessionStorage.setItem(SESSION_STARTED_KEY, "1");
      trackAnalyticsEvent({
        type: "session_start",
        path: pathname,
        url: currentUrl,
        title: document.title,
        referrer,
        locale,
        startedAt: new Date().toISOString(),
        ...params,
        metadata: safeAnalyticsMetadata(),
      });
    }

    if (activePage.current?.key === pageKey) return;

    leaveActivePage();
    maxScrollDepth.current = 0;

    const enteredAt = new Date().toISOString();
    activePage.current = {
      key: pageKey,
      path: pathname,
      url: currentUrl,
      title: document.title,
      enteredAt,
      startedAtMs: Date.now(),
    };

    trackAnalyticsEvent({
      type: "page_view",
      path: pathname,
      url: currentUrl,
      title: document.title,
      referrer,
      locale,
      enteredAt,
      ...params,
      metadata: safeAnalyticsMetadata(),
    });
  }, [consented, leaveActivePage, locale, pageKey, pathname, search]);

  useEffect(() => {
    if (!consented) return;

    const onPageHide = () => leaveActivePage();
    window.addEventListener("pagehide", onPageHide);

    return () => {
      window.removeEventListener("pagehide", onPageHide);
      leaveActivePage();
    };
  }, [consented, leaveActivePage]);

  return null;
}
