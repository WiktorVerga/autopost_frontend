"use client";

/**
 * Cookie consent, kept in localStorage.
 *
 * Only analytics (GA4, through Google Tag Manager) needs consent: the other
 * cookies are strictly necessary. GTM always loads, but under Google Consent
 * Mode with analytics denied until the visitor accepts.
 * The choice expires after CONSENT_MAX_AGE_MS, and a new CONSENT_VERSION
 * (new analytics cookies or purposes) asks again.
 */

import { useSyncExternalStore } from "react";

const STORAGE_KEY = "autopost:cookie-consent";
const CONSENT_VERSION = 1;
const CONSENT_MAX_AGE_MS = 182 * 24 * 60 * 60 * 1000; // ~6 months

export type Consent = { analytics: boolean; decidedAt: string };

type Stored = Consent & { version: number };

type Snapshot = {
  /** False on the server and before hydration: render nothing consent-dependent. */
  ready: boolean;
  consent: Consent | null;
  /** The banner was reopened from a "Cookie settings" link. */
  settingsOpen: boolean;
};

const SERVER_SNAPSHOT: Snapshot = { ready: false, consent: null, settingsOpen: false };

const listeners = new Set<() => void>();
let snapshot: Snapshot | null = null;
/** Fallback when localStorage can't be written (private mode, blocked storage). */
let memoryConsent: Stored | null = null;

function read(): Consent | null {
  let stored: Stored | null = memoryConsent;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) stored = JSON.parse(raw) as Stored;
  } catch {
    // unreadable or blocked storage: keep the in-memory choice
  }
  if (!stored || stored.version !== CONSENT_VERSION) return null;
  const age = Date.now() - new Date(stored.decidedAt).getTime();
  if (!(age >= 0 && age < CONSENT_MAX_AGE_MS)) return null;
  return { analytics: stored.analytics === true, decidedAt: stored.decidedAt };
}

type DataLayerWindow = Window & { dataLayer?: unknown[] };
let consentDefaultsPushed = false;

/**
 * Google Consent Mode v2.
 *
 * The "default" command (everything optional denied) is queued in the
 * dataLayer when this module is evaluated in the browser (see the bottom of
 * the file), before hydration, so it is always ahead of GTM's `gtm.js` event. Every choice then queues an
 * "update": granted on Accept, denied on Reject, also when the visitor changes
 * their mind later from "Cookie settings". Advertising signals are always
 * denied: Autopost uses no advertising features.
 */
function gtag(..._args: unknown[]): void;
function gtag() {
  const w = window as DataLayerWindow;
  w.dataLayer = w.dataLayer || [];
  // gtag() queues its `arguments` object, not an array: GTM tells the two apart.
  // eslint-disable-next-line prefer-rest-params
  w.dataLayer.push(arguments);
}

const ADS_DENIED = {
  ad_storage: "denied",
  ad_user_data: "denied",
  ad_personalization: "denied",
} as const;

function pushConsentDefault() {
  if (consentDefaultsPushed) return;
  consentDefaultsPushed = true;
  gtag("consent", "default", {
    analytics_storage: "denied",
    ...ADS_DENIED,
    personalization_storage: "denied",
    // strictly necessary: sign-in session and security
    functionality_storage: "granted",
    security_storage: "granted",
  });
}

function pushConsentUpdate(analytics: boolean) {
  pushConsentDefault();
  gtag("consent", "update", {
    analytics_storage: analytics ? "granted" : "denied",
    ...ADS_DENIED,
  });
}

function emit(next: Snapshot) {
  snapshot = next;
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): Snapshot {
  if (!snapshot) {
    snapshot = { ready: true, consent: read(), settingsOpen: false };
  }
  return snapshot;
}

/** True only if the visitor has accepted analytics. Use it before sending GTM events. */
export function analyticsAllowed(): boolean {
  if (typeof window === "undefined") return false;
  return getSnapshot().consent?.analytics === true;
}

export function useConsent(): Snapshot {
  return useSyncExternalStore(subscribe, getSnapshot, () => SERVER_SNAPSHOT);
}

/** Removes the Google Analytics cookies from this host and its parent domains. */
function clearAnalyticsCookies() {
  const names = document.cookie
    .split(";")
    .map((c) => c.split("=")[0].trim())
    .filter((name) => name === "_ga" || name.startsWith("_ga_") || name === "_gid");
  const parts = location.hostname.split(".");
  const domains = [""];
  for (let i = 0; i < parts.length - 1; i++) domains.push(`; domain=.${parts.slice(i).join(".")}`);
  for (const name of names) {
    for (const domain of domains) {
      document.cookie = `${name}=; path=/; max-age=0${domain}`;
    }
  }
}

export function saveConsent(analytics: boolean) {
  const previous = getSnapshot().consent;
  const stored: Stored = { version: CONSENT_VERSION, analytics, decidedAt: new Date().toISOString() };
  memoryConsent = stored;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  } catch {
    // storage blocked: the choice lasts for this page view
  }

  pushConsentUpdate(analytics);
  // Consent withdrawn: GA4 stops on the "denied" update, the cookies it already set are removed.
  if (previous?.analytics && !analytics) clearAnalyticsCookies();
  emit({ ready: true, consent: { analytics, decidedAt: stored.decidedAt }, settingsOpen: false });
}

/** Reopens the cookie banner so the visitor can change their choice. */
export function openCookieSettings() {
  emit({ ...getSnapshot(), settingsOpen: true });
}

export function closeCookieSettings() {
  emit({ ...getSnapshot(), settingsOpen: false });
}

// Runs once when the client bundle is evaluated, before hydration and so before
// <GoogleTagManager> injects GTM: default first, then the stored choice if any.
if (typeof window !== "undefined") {
  pushConsentDefault();
  const stored = read();
  if (stored) pushConsentUpdate(stored.analytics);
}
