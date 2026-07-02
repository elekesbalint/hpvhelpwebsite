import type { OrderDisplayRef } from "@/lib/order-display-id";
import { getOrderNaturasoftId } from "@/lib/order-display-id";

const LEGACY_PREFIX = "ORDER_";

/** Kereskedői trx ID a SimplePay adminban (#HH00080, neotest.hu stílus). */
export function buildSimplePayOrderRef(order: OrderDisplayRef): string {
  const serial = order.order_number?.trim() || getOrderNaturasoftId(order);
  if (serial && serial !== "—" && /^HH\d+$/i.test(serial)) {
    return `#${serial.toUpperCase()}`;
  }
  return `${LEGACY_PREFIX}${order.id}`;
}

export function isLegacySimplePayOrderRef(orderRef: string): boolean {
  return orderRef.startsWith(LEGACY_PREFIX);
}

export function parseLegacySimplePayOrderId(orderRef: string): string | null {
  if (!isLegacySimplePayOrderRef(orderRef)) return null;
  const id = orderRef.slice(LEGACY_PREFIX.length).trim();
  return id.length > 0 ? id : null;
}

/** #HH00080 vagy HH00080 → HH00080 */
export function parseSimplePayOrderNumber(orderRef: string): string | null {
  const trimmed = orderRef.trim();
  if (!trimmed) return null;
  const withoutHash = trimmed.startsWith("#") ? trimmed.slice(1) : trimmed;
  if (/^HH\d{5}$/i.test(withoutHash)) return withoutHash.toUpperCase();
  return null;
}

export async function resolveOrderIdFromSimplePayOrderRef(
  orderRef: string,
  lookupByOrderNumber: (orderNumber: string) => Promise<string | null>
): Promise<string | null> {
  const legacyId = parseLegacySimplePayOrderId(orderRef);
  if (legacyId) return legacyId;

  const orderNumber = parseSimplePayOrderNumber(orderRef);
  if (!orderNumber) return null;

  return lookupByOrderNumber(orderNumber);
}
