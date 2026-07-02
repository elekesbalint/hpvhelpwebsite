import { formatOrderPublicId, getOrderNaturasoftId } from "@/lib/order-display-id";
import { formatSimplePayTransactionId } from "@/lib/simplepay-legal";
import { effectiveShippingMethod, pickupProviderLabel, shippingMethodLabel } from "@/lib/shipping/carrier";
import type { Database } from "@/types/supabase";

type Order = Database["public"]["Tables"]["orders"]["Row"];

const STANDARD_FOOTER = [
  "Minőségbiztosítási okok miatt egészségügyi gyorstesztet nem áll módunkban cserélni!",
  "(ÁSZF) A számla aláírás és pecsét nélkül is hiteles!",
] as const;

function pickupPointHeader(provider: string | null | undefined): string {
  switch (provider?.trim().toLowerCase()) {
    case "gls":
      return "CSOMAGPOONT - GLS adatok";
    case "foxpost":
      return "CSOMAGPOONT - FOXPOST adatok";
    default:
      return "POSTAPONT - Posta adatok";
  }
}

/** NaturaSoft „Megjegyzés a rendeléshez” – Neotest / Sunmed formátum. */
export function buildNaturasoftOrderNotes(order: Order): string {
  const lines: string[] = [];
  const shippingMethod = effectiveShippingMethod(order) ?? order.shipping_method;

  lines.push(`Rendelés szám: ${formatOrderPublicId(order)}`);
  lines.push(`Szállítási mód: ${shippingMethodLabel(shippingMethod)}`);

  const simplePayTx = formatSimplePayTransactionId(order.payment_reference);
  if (order.payment_provider === "simplepay" && simplePayTx) {
    lines.push(`Referenciaszám: ${simplePayTx}`);
  } else if (order.payment_provider === "manual_transfer") {
    lines.push(`Közlemény (átutalás): ${getOrderNaturasoftId(order)}`);
  }

  if (order.coupon_code?.trim()) {
    lines.push(`Kuponkód: ${order.coupon_code.trim()}`);
  }

  if (shippingMethod === "csomagpont" && order.pickup_point_id?.trim()) {
    lines.push("");
    lines.push(pickupPointHeader(order.pickup_point_provider));
    lines.push(`Azonosító: ${order.pickup_point_id.trim()}`);
    if (order.pickup_point_name?.trim()) {
      lines.push(`Név: ${order.pickup_point_name.trim()}`);
    }
    if (order.pickup_point_address?.trim()) {
      lines.push(`Cím: ${order.pickup_point_address.trim()}`);
    }
    const providerLabel = pickupProviderLabel(order.pickup_point_provider);
    if (providerLabel !== "—") {
      lines.push(`Szolgáltató: ${providerLabel}`);
    }
  } else if ((shippingMethod === "posta" || shippingMethod === "gls") && order.shipping_address?.trim()) {
    lines.push("");
    lines.push("Szállítási cím:");
    lines.push(order.shipping_address.trim());
  } else if (shippingMethod === "pickup") {
    lines.push("");
    lines.push("Személyes átvétel");
  }

  const customerNotes = order.notes?.trim();
  if (customerNotes) {
    lines.push("");
    lines.push("Vevő megjegyzése:");
    lines.push(customerNotes);
  }

  lines.push("");
  lines.push(...STANDARD_FOOTER);

  return lines.join("\n");
}
