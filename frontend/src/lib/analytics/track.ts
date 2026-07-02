import {
  GA4_MEASUREMENT_ID,
  GOOGLE_ADS_ID,
  META_PIXEL_ID,
  TIKTOK_PIXEL_ID,
} from "@/lib/analytics/config";
import { hasAnalyticsConsent, hasMarketingConsent } from "@/lib/analytics/consent";
import {
  trackGtagEvent,
  trackGtagPageView,
  trackGtagPurchase,
  type PurchaseItem,
} from "@/lib/analytics/gtag";
import type { CartItem } from "@/types/cart";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    _fbq?: (...args: unknown[]) => void;
    ttq?: {
      track: (event: string, params?: Record<string, unknown>) => void;
      page: () => void;
      load: (pixelId: string) => void;
    };
  }
}

function getCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : undefined;
}

export function getMetaBrowserIds(): { fbp?: string; fbc?: string } {
  return { fbp: getCookie("_fbp"), fbc: getCookie("_fbc") };
}

function trackMeta(event: string, params?: Record<string, unknown>, eventId?: string) {
  if (!META_PIXEL_ID || !hasMarketingConsent() || typeof window.fbq !== "function") return;
  if (eventId) {
    window.fbq("track", event, params ?? {}, { eventID: eventId });
  } else {
    window.fbq("track", event, params ?? {});
  }
}

function trackTikTok(event: string, params?: Record<string, unknown>) {
  if (!TIKTOK_PIXEL_ID || !hasMarketingConsent() || !window.ttq) return;
  window.ttq.track(event, params ?? {});
}

export function trackPageView(path: string): void {
  trackGtagPageView(path);
  trackMeta("PageView");
  if (hasMarketingConsent() && window.ttq) window.ttq.page();
}

export function trackAddToCart(item: CartItem, quantityAdded: number): void {
  if (quantityAdded <= 0) return;
  const value = item.price * quantityAdded;

  trackGtagEvent("add_to_cart", {
    currency: "HUF",
    value,
    items: [
      {
        item_id: item.productId,
        item_name: item.name,
        price: item.price,
        quantity: quantityAdded,
      },
    ],
  });

  trackMeta("AddToCart", {
    content_ids: [item.productId],
    content_name: item.name,
    content_type: "product",
    value,
    currency: "HUF",
  });

  trackTikTok("AddToCart", {
    content_id: item.productId,
    content_name: item.name,
    value,
    currency: "HUF",
    quantity: quantityAdded,
  });
}

export function trackBeginCheckout(items: CartItem[], value: number): void {
  const contents = items.map((item) => ({
    id: item.productId,
    quantity: item.quantity,
  }));

  trackGtagEvent("begin_checkout", {
    currency: "HUF",
    value,
    items: items.map((item) => ({
      item_id: item.productId,
      item_name: item.name,
      price: item.price,
      quantity: item.quantity,
    })),
  });

  trackMeta("InitiateCheckout", {
    content_ids: items.map((i) => i.productId),
    contents,
    value,
    currency: "HUF",
    num_items: items.reduce((sum, i) => sum + i.quantity, 0),
  });

  trackTikTok("InitiateCheckout", {
    contents,
    value,
    currency: "HUF",
  });
}

export function trackPurchase(params: {
  orderId: string;
  value: number;
  items: PurchaseItem[];
}): void {
  const storageKey = `hpvhelp_purchase_tracked_${params.orderId}`;
  if (typeof window !== "undefined") {
    try {
      if (window.sessionStorage.getItem(storageKey) === "1") return;
      window.sessionStorage.setItem(storageKey, "1");
    } catch {
      /* ignore */
    }
  }

  trackGtagPurchase({
    transactionId: params.orderId,
    value: params.value,
    items: params.items,
  });

  trackMeta(
    "Purchase",
    {
      value: params.value,
      currency: "HUF",
      content_ids: params.items.map((i) => i.item_id),
      contents: params.items.map((i) => ({
        id: i.item_id,
        quantity: i.quantity,
      })),
      num_items: params.items.reduce((sum, i) => sum + i.quantity, 0),
    },
    params.orderId,
  );

  trackTikTok("CompletePayment", {
    content_id: params.orderId,
    value: params.value,
    currency: "HUF",
    contents: params.items.map((i) => ({
      content_id: i.item_id,
      quantity: i.quantity,
      price: i.price,
    })),
  });

  if (typeof window !== "undefined") {
    const { fbp, fbc } = getMetaBrowserIds();
    void fetch("/api/analytics/purchase", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderId: params.orderId,
        fbp,
        fbc,
        eventSourceUrl: window.location.href,
      }),
      keepalive: true,
    }).catch(() => {
      /* non-blocking */
    });
  }
}

export function isTrackingConfigured(): boolean {
  return Boolean(
    GA4_MEASUREMENT_ID || GOOGLE_ADS_ID || META_PIXEL_ID || TIKTOK_PIXEL_ID,
  );
}
