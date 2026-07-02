import { GA4_MEASUREMENT_ID, GOOGLE_ADS_ID } from "@/lib/analytics/config";
import { hasAnalyticsConsent, hasMarketingConsent } from "@/lib/analytics/consent";

type GtagCommand = "consent" | "config" | "event" | "js" | "set";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    __hpvGtagConfigured?: boolean;
  }
}

function gtag(...args: unknown[]) {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer ?? [];
  window.gtag = window.gtag ?? function gtagShim(...cmd: unknown[]) {
    window.dataLayer?.push(cmd);
  };
  window.gtag(...args);
}

export function applyConsentToGtag(level: "all" | "necessary"): void {
  const granted = level === "all" ? "granted" : "denied";
  gtag("consent", "update", {
    ad_storage: granted,
    ad_user_data: granted,
    ad_personalization: granted,
    analytics_storage: granted,
  });
}

export function configureGoogleTags(): void {
  if (!GA4_MEASUREMENT_ID && !GOOGLE_ADS_ID) return;
  if (!hasAnalyticsConsent() && !hasMarketingConsent()) return;
  if (typeof window !== "undefined" && window.__hpvGtagConfigured) return;

  gtag("js", new Date());

  if (GA4_MEASUREMENT_ID) {
    gtag("config", GA4_MEASUREMENT_ID, {
      send_page_view: false,
      allow_google_signals: true,
      allow_ad_personalization_signals: true,
    });
  }
  if (GOOGLE_ADS_ID) {
    gtag("config", GOOGLE_ADS_ID, {
      allow_enhanced_conversions: true,
    });
  }

  if (typeof window !== "undefined") {
    window.__hpvGtagConfigured = true;
  }
}

export function trackGtagEvent(
  name: string,
  params?: Record<string, unknown>,
): void {
  if (!hasAnalyticsConsent() && !hasMarketingConsent()) return;
  gtag("event", name, params ?? {});
}

export function trackGtagPageView(path: string): void {
  if (!GA4_MEASUREMENT_ID) return;
  if (!hasAnalyticsConsent()) return;
  gtag("event", "page_view", {
    page_path: path,
    page_location: typeof window !== "undefined" ? window.location.href : undefined,
    page_title: typeof document !== "undefined" ? document.title : undefined,
    send_to: GA4_MEASUREMENT_ID,
  });
}

export type PurchaseItem = {
  item_id: string;
  item_name: string;
  price: number;
  quantity: number;
};

export function trackGtagPurchase(params: {
  transactionId: string;
  value: number;
  currency?: string;
  items: PurchaseItem[];
}): void {
  const currency = params.currency ?? "HUF";
  const payload = {
    transaction_id: params.transactionId,
    value: params.value,
    currency,
    items: params.items,
  };

  trackGtagEvent("purchase", payload);
}

export type GtagCommandName = GtagCommand;
