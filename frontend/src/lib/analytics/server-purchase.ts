import { sendMetaCapiPurchase } from "@/lib/analytics/meta-capi";
import { createServiceSupabase } from "@/lib/server-supabase";

type OrderRow = {
  id: string;
  total: number;
  currency: string | null;
  shipping_email: string | null;
  shipping_phone: string | null;
  status: string;
};

export async function trackServerPurchase(
  orderId: string,
  options?: {
    clientIp?: string | null;
    userAgent?: string | null;
    eventSourceUrl?: string | null;
    fbp?: string | null;
    fbc?: string | null;
  },
): Promise<void> {
  const svc = createServiceSupabase();
  if (!svc || !orderId) return;

  const { data: order } = await svc
    .from("orders")
    .select("id, total, currency, shipping_email, shipping_phone, status")
    .eq("id", orderId)
    .maybeSingle();

  if (!order) return;
  const o = order as OrderRow;
  if (o.status !== "paid" && o.status !== "pending") return;

  const { data: items } = await svc
    .from("order_items")
    .select("product_id, product_name, quantity, unit_price")
    .eq("order_id", orderId);

  await sendMetaCapiPurchase({
    orderId,
    value: Number(o.total),
    currency: o.currency ?? "HUF",
    email: o.shipping_email,
    phone: o.shipping_phone,
    clientIp: options?.clientIp,
    userAgent: options?.userAgent,
    eventSourceUrl: options?.eventSourceUrl,
    fbp: options?.fbp,
    fbc: options?.fbc,
    items: (items ?? []).map((item) => ({
      productId: item.product_id ?? item.product_name,
      name: item.product_name,
      quantity: item.quantity,
      price: Number(item.unit_price),
    })),
  });
}
