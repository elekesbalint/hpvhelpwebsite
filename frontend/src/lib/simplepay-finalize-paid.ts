import { resolveCustomerEmailForOrder } from "@/lib/order-customer-email";
import { formatOrderPublicId } from "@/lib/order-display-id";
import { createServiceSupabase } from "@/lib/server-supabase";
import { sendOrderConfirmationEmail } from "@/lib/resend-notifications";

/**
 * SimplePay kártyás rendelés lezárása: csak pending + simplepay esetén állít paid-ra,
 * opcionálisan frissíti a tranzakció azonosítót, és elküldi a visszaigazoló emailt (idempotens).
 */
export async function finalizeSimplePaySuccessOrder(
  orderId: string,
  paymentReference?: string | null
): Promise<void> {
  const svc = createServiceSupabase();
  if (!svc || !orderId) return;

  const { data: existing } = await svc
    .from("orders")
    .select("id, status, payment_provider")
    .eq("id", orderId)
    .maybeSingle();

  if (!existing || existing.payment_provider !== "simplepay" || existing.status !== "pending") {
    return;
  }

  const update: { status: "paid"; payment_reference?: string } = { status: "paid" };
  const ref = paymentReference?.trim();
  if (ref) update.payment_reference = ref;

  const { error } = await svc.from("orders").update(update).eq("id", orderId);
  if (error) return;

  const { data: fullOrder } = await svc.from("orders").select("*").eq("id", orderId).maybeSingle();
  const { data: items } = await svc
    .from("order_items")
    .select("product_name, quantity, line_total, unit_price")
    .eq("order_id", orderId)
    .order("created_at", { ascending: true });

  if (fullOrder) {
    const customerEmail = await resolveCustomerEmailForOrder(svc, fullOrder);
    const mail = await sendOrderConfirmationEmail({
      order: fullOrder,
      items: items ?? [],
      publicOrderLabel: formatOrderPublicId(fullOrder.id),
      customerEmail,
    });
    if (!mail.ok) {
      console.error("[simplepay/finalize] confirmation email failed", {
        orderId,
        skipped: mail.skipped,
        detail: mail.detail,
        adminOnly: mail.adminOnly,
      });
    }
  }
}
