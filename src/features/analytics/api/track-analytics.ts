"use client";

import {
  getSessionId,
  getVisitorId,
  hasAnalyticsConsent,
} from "@/features/analytics/services/analytics-identifiers";

export type AnalyticsEventType = "session_start" | "page_view" | "page_leave" | "event";

export interface AnalyticsPayload {
  type: AnalyticsEventType;
  pageViewId?: number | null;
  path?: string | null;
  url?: string | null;
  title?: string | null;
  referrer?: string | null;
  locale?: string | null;
  startedAt?: string | null;
  enteredAt?: string | null;
  durationSeconds?: number | null;
  scrollDepth?: number | null;
  eventName?: string | null;
  utm?: {
    source?: string | null;
    medium?: string | null;
    campaign?: string | null;
    term?: string | null;
    content?: string | null;
    id?: string | null;
  };
  gclid?: string | null;
  fbclid?: string | null;
  ttclid?: string | null;
  msclkid?: string | null;
  affiliate?: string | null;
  ref?: string | null;
  affiliate_code?: string | null;
  ref_code?: string | null;
  metadata?: {
    screenWidth?: number;
    screenHeight?: number;
    viewportWidth?: number;
    viewportHeight?: number;
    language?: string;
  };
}

export function getUtmParams(searchParams: URLSearchParams): Partial<AnalyticsPayload> {
  const value = (key: string) => searchParams.get(key);

  return {
    utm: {
      source: value("utm_source"),
      medium: value("utm_medium"),
      campaign: value("utm_campaign"),
      term: value("utm_term"),
      content: value("utm_content"),
      id: value("utm_id"),
    },
    gclid: value("gclid"),
    fbclid: value("fbclid"),
    ttclid: value("ttclid"),
    msclkid: value("msclkid"),
    affiliate: value("affiliate"),
    ref: value("ref"),
    affiliate_code: value("affiliate_code"),
    ref_code: value("ref_code"),
  };
}

export function safeAnalyticsMetadata(): AnalyticsPayload["metadata"] {
  if (typeof window === "undefined") return undefined;

  return {
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
    language: navigator.language,
  };
}

export function trackAnalyticsEvent(payload: AnalyticsPayload): void {
  if (typeof window === "undefined" || !hasAnalyticsConsent()) return;

  const body = JSON.stringify({
    ...payload,
    visitorId: getVisitorId(),
    sessionId: getSessionId(),
  });

  try {
    if (navigator.sendBeacon) {
      const sent = navigator.sendBeacon(
        "/api/analytics/track",
        new Blob([body], { type: "application/json" }),
      );

      if (sent) return;
    }

    void fetch("/api/analytics/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
      cache: "no-store",
    }).catch(() => undefined);
  } catch {
    // Analytics is non-critical and must never affect the studio experience.
  }
}
