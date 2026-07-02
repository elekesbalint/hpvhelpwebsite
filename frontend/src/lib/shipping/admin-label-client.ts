import { formatOrderPublicId } from "@/lib/order-display-id";
import { carrierForOrder, effectiveShippingMethod } from "@/lib/shipping/carrier";

type OrderForLabel = {
  id: string;
  shipping_method?: string | null;
  pickup_point_provider?: string | null;
  pickup_point_id?: string | null;
  shipping_address?: string | null;
  shipping_name?: string | null;
};

export function orderCanCreateShippingLabel(order: OrderForLabel): boolean {
  if (!carrierForOrder(order)) return false;
  if (!order.shipping_name?.trim()) return false;
  const method = effectiveShippingMethod(order) ?? order.shipping_method;
  if (method === "csomagpont") return Boolean(order.pickup_point_id);
  return Boolean(order.shipping_address?.trim());
}

export type CreateLabelApiResponse = {
  error?: string;
  pdfBase64?: string;
  filename?: string;
  trackingNumber?: string;
  carrier?: string;
};

export function downloadShippingLabelPdf(pdfBase64: string, filename: string) {
  const blob = new Blob([Uint8Array.from(atob(pdfBase64), (c) => c.charCodeAt(0))], {
    type: "application/pdf",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export async function requestShippingLabel(
  orderId: string,
  accessToken: string,
): Promise<CreateLabelApiResponse & { pdfBase64: string }> {
  const res = await fetch("/api/admin/shipping/create-label", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ orderId }),
  });
  const json = (await res.json()) as CreateLabelApiResponse;
  if (!res.ok) {
    throw new Error(json.error ?? "Címirat generálás sikertelen.");
  }
  if (!json.pdfBase64) {
    throw new Error("A szerver nem adott vissza PDF-et.");
  }
  return { ...json, pdfBase64: json.pdfBase64 };
}

export function defaultLabelFilename(orderId: string, apiFilename?: string): string {
  return apiFilename ?? `cimirat-${formatOrderPublicId(orderId)}.pdf`;
}
