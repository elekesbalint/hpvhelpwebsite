export type ConsentLevel = "all" | "necessary";

const STORAGE_KEY = "hpvhelp_cookie_consent_v1";
const CHANGED_EVENT = "hpvhelp:consent-changed";

export function getStoredConsent(): ConsentLevel | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === "all" || raw === "necessary") return raw;
  } catch {
    /* ignore */
  }
  return null;
}

export function setStoredConsent(level: ConsentLevel): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, level);
    window.dispatchEvent(new Event(CHANGED_EVENT));
  } catch {
    /* ignore */
  }
}

export function getConsentChangedEventName(): string {
  return CHANGED_EVENT;
}

export function hasAnalyticsConsent(): boolean {
  return getStoredConsent() === "all";
}

export function hasMarketingConsent(): boolean {
  return getStoredConsent() === "all";
}
