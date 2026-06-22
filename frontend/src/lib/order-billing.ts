import type { Database } from "@/types/supabase";

type Order = Database["public"]["Tables"]["orders"]["Row"];

export function orderHasBillingDetails(order: Order): boolean {
  return Boolean(
    order.billing_name?.trim() ||
      order.billing_tax_number?.trim() ||
      order.billing_address?.trim() ||
      order.billing_company_contact?.trim()
  );
}

/**
 * Számlázási cím megjelenítéshez: ha nincs külön billing_address, a szállítási cím helyettesíti
 * (a vásárló a checkoutban nem pipálta be a „Eltérő számlázási cím" opciót).
 */
export function billingAddressDisplay(order: Order): string {
  return order.billing_address?.trim() || order.shipping_address?.trim() || "—";
}

/**
 * Számlázási név: ha nincs külön billing_name, a szállítási nevet mutatjuk.
 */
export function billingNameDisplay(order: Order): string {
  return order.billing_name?.trim() || order.shipping_name?.trim() || "—";
}
