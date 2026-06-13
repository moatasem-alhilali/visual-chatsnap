"use client";

export type AnalyticsConsent = "accepted" | "declined";

const CONSENT_KEY = "scenora_analytics_consent";
const VISITOR_ID_KEY = "scenora_analytics_visitor_id";
const SESSION_ID_KEY = "scenora_analytics_session_id";

function canUseBrowserStorage(): boolean {
  return typeof window !== "undefined";
}

function newId(): string {
  return crypto.randomUUID();
}

export function getAnalyticsConsent(): AnalyticsConsent | null {
  if (!canUseBrowserStorage()) return null;

  const value = localStorage.getItem(CONSENT_KEY);
  return value === "accepted" || value === "declined" ? value : null;
}

export function hasAnalyticsConsent(): boolean {
  return getAnalyticsConsent() === "accepted";
}

export function setAnalyticsConsent(consent: AnalyticsConsent): void {
  if (!canUseBrowserStorage()) return;

  localStorage.setItem(CONSENT_KEY, consent);
}

export function getVisitorId(): string {
  if (!canUseBrowserStorage()) return newId();

  const existing = localStorage.getItem(VISITOR_ID_KEY);
  if (existing) return existing;

  const id = newId();
  localStorage.setItem(VISITOR_ID_KEY, id);

  return id;
}

export function getSessionId(): string {
  if (!canUseBrowserStorage()) return newId();

  const existing = sessionStorage.getItem(SESSION_ID_KEY);
  if (existing) return existing;

  const id = newId();
  sessionStorage.setItem(SESSION_ID_KEY, id);

  return id;
}
