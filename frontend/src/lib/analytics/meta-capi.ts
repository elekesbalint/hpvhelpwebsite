import { createHash } from "crypto";
import { META_CAPI_ACCESS_TOKEN, META_CAPI_TEST_EVENT_CODE, META_PIXEL_ID } from "@/lib/analytics/config";

type PurchaseLine = {
  productId: string;
  name: string;
  quantity: number;
  price: number;
};

type PurchaseParams = {
  orderId: string;
  value: number;
  currency?: string;
  email?: string | null;
  phone?: string | null;
  clientIp?: string | null;
  userAgent?: string | null;
  eventSourceUrl?: string | null;
  fbp?: string | null;
  fbc?: string | null;
  items: PurchaseLine[];
};

function sha256(value: string): string {
  return createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

export async function sendMetaCapiPurchase(params: PurchaseParams): Promise<boolean> {
  if (!META_PIXEL_ID || !META_CAPI_ACCESS_TOKEN) return false;

  const userData: Record<string, unknown> = {};
  if (params.email?.trim()) userData.em = [sha256(params.email.trim())];
  const phone = params.phone ? normalizePhone(params.phone) : "";
  if (phone) userData.ph = [sha256(phone)];
  if (params.clientIp) userData.client_ip_address = params.clientIp;
  if (params.userAgent) userData.client_user_agent = params.userAgent;
  if (params.fbp) userData.fbp = params.fbp;
  if (params.fbc) userData.fbc = params.fbc;

  const payload: Record<string, unknown> = {
    data: [
      {
        event_name: "Purchase",
        event_time: Math.floor(Date.now() / 1000),
        event_id: params.orderId,
        action_source: "website",
        event_source_url: params.eventSourceUrl ?? undefined,
        user_data: userData,
        custom_data: {
          currency: params.currency ?? "HUF",
          value: params.value,
          order_id: params.orderId,
          contents: params.items.map((item) => ({
            id: item.productId,
            quantity: item.quantity,
            item_price: item.price,
          })),
          content_ids: params.items.map((item) => item.productId),
          num_items: params.items.reduce((sum, item) => sum + item.quantity, 0),
        },
      },
    ],
    access_token: META_CAPI_ACCESS_TOKEN,
  };

  if (META_CAPI_TEST_EVENT_CODE) {
    payload.test_event_code = META_CAPI_TEST_EVENT_CODE;
  }

  const url = `https://graph.facebook.com/v21.0/${META_PIXEL_ID}/events`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error("[meta-capi] Purchase failed", res.status, text);
    return false;
  }

  return true;
}
