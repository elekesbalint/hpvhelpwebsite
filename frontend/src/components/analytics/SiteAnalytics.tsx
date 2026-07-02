"use client";

import Script from "next/script";
import {
  GA4_MEASUREMENT_ID,
  GOOGLE_ADS_ID,
  META_PIXEL_ID,
  TIKTOK_PIXEL_ID,
  isGoogleAnalyticsEnabled,
  isMarketingEnabled,
  isPublicAnalyticsPath,
} from "@/lib/analytics/config";
import { applyConsentToGtag, configureGoogleTags } from "@/lib/analytics/gtag";
import {
  getConsentChangedEventName,
  getStoredConsent,
  setStoredConsent,
  type ConsentLevel,
} from "@/lib/analytics/consent";
import { installMetaPixel, installTikTokPixel } from "@/lib/analytics/pixels";
import { isTrackingConfigured, trackPageView } from "@/lib/analytics/track";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";

function readInitialConsent(): ConsentLevel | null {
  if (typeof window === "undefined") return null;
  return getStoredConsent();
}

function ConsentDefaultsScript() {
  return (
    <Script id="google-consent-defaults" strategy="beforeInteractive">
      {`
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('consent', 'default', {
          ad_storage: 'denied',
          ad_user_data: 'denied',
          ad_personalization: 'denied',
          analytics_storage: 'denied',
          functionality_storage: 'granted',
          security_storage: 'granted',
          wait_for_update: 500
        });
      `}
    </Script>
  );
}

function CookieConsentBanner({
  onChoice,
}: {
  onChoice: (level: ConsentLevel) => void;
}) {
  return (
    <div
      role="dialog"
      aria-labelledby="cookie-consent-title"
      className="fixed inset-x-0 bottom-0 z-[100] border-t border-brand-200 bg-white/95 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-2xl backdrop-blur-md sm:p-6 sm:pb-[max(1.5rem,env(safe-area-inset-bottom))]"
    >
      <div className="mx-auto flex max-w-4xl flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p id="cookie-consent-title" className="text-sm font-bold text-brand-900">
            Cookie hozzájárulás
          </p>
          <p className="mt-1 text-sm leading-relaxed text-red-950/70">
            Weboldalunk sütiket használ a működéshez, statisztikához (Google Analytics) és
            hirdetési méréshez (Meta, Google Ads, TikTok). Az „Elfogadom” gombbal hozzájárul
            az analitikai és marketing sütikhez. A „Csak szükséges” mellett csak a működéshez
            elengedhetetlen sütik maradnak aktívak.{" "}
            <a href="/adatvedelmi" className="font-semibold text-brand-800 underline">
              Adatvédelem
            </a>
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onChoice("necessary")}
            className="rounded-xl border border-brand-200 bg-white px-4 py-2.5 text-sm font-semibold text-brand-900 transition hover:bg-brand-50"
          >
            Csak szükséges
          </button>
          <button
            type="button"
            onClick={() => onChoice("all")}
            className="rounded-xl bg-brand-900 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-brand-800"
          >
            Elfogadom
          </button>
        </div>
      </div>
    </div>
  );
}

function AnalyticsRouteTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!isPublicAnalyticsPath(pathname)) return;
    if (getStoredConsent() !== "all") return;
    const query = searchParams.toString();
    const path = query ? `${pathname}?${query}` : pathname;
    trackPageView(path);
  }, [pathname, searchParams]);

  return null;
}

function SiteAnalyticsInner() {
  const pathname = usePathname();
  const [consent, setConsent] = useState<ConsentLevel | null>(readInitialConsent);

  const activateTracking = useCallback((level: ConsentLevel) => {
    applyConsentToGtag(level);

    if (level === "all") {
      configureGoogleTags();
      if (META_PIXEL_ID) installMetaPixel(META_PIXEL_ID);
      if (TIKTOK_PIXEL_ID) installTikTokPixel(TIKTOK_PIXEL_ID);
    }
  }, []);

  const applyChoice = useCallback(
    (level: ConsentLevel) => {
      setStoredConsent(level);
      setConsent(level);
      activateTracking(level);

      if (level === "all" && isPublicAnalyticsPath(pathname)) {
        const query = typeof window !== "undefined" ? window.location.search.replace(/^\?/, "") : "";
        const path = query ? `${pathname}?${query}` : pathname;
        trackPageView(path);
      }
    },
    [activateTracking, pathname],
  );

  useEffect(() => {
    const stored = getStoredConsent();
    setConsent(stored);
    if (stored) activateTracking(stored);

    const onChange = () => {
      const next = getStoredConsent();
      setConsent(next);
      if (next) activateTracking(next);
    };
    window.addEventListener(getConsentChangedEventName(), onChange);
    return () => window.removeEventListener(getConsentChangedEventName(), onChange);
  }, [activateTracking]);

  if (!isPublicAnalyticsPath(pathname) || !isTrackingConfigured()) {
    return null;
  }

  const gtagSrc =
    isGoogleAnalyticsEnabled() || isMarketingEnabled()
      ? `https://www.googletagmanager.com/gtag/js?id=${GA4_MEASUREMENT_ID || GOOGLE_ADS_ID}`
      : null;

  return (
    <>
      <ConsentDefaultsScript />
      {gtagSrc ? (
        <Script
          src={gtagSrc}
          strategy="afterInteractive"
          onLoad={() => {
            if (getStoredConsent()) {
              activateTracking(getStoredConsent()!);
            }
          }}
        />
      ) : null}
      {META_PIXEL_ID && consent === "all" ? (
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: "none" }}
            src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
            alt=""
          />
        </noscript>
      ) : null}
      {consent === null ? <CookieConsentBanner onChoice={applyChoice} /> : null}
      {consent === "all" ? <AnalyticsRouteTracker /> : null}
    </>
  );
}

export default function SiteAnalytics() {
  return (
    <Suspense fallback={null}>
      <SiteAnalyticsInner />
    </Suspense>
  );
}
