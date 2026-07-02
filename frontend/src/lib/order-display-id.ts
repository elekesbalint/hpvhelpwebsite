export type OrderDisplayRef = {
  id: string;
  order_number?: string | null;
};

/**
 * Rövid, vevőbarát rendelésazonosító: HH00001, vagy régi UUID-alapú 8 hex (nagybetű).
 */
export function getOrderPublicCode(order: OrderDisplayRef | string): string {
  if (typeof order !== "string") {
    const serial = order.order_number?.trim();
    if (serial) return serial;
    return getOrderPublicCode(order.id);
  }

  const trimmed = order.trim();
  if (!trimmed) return "—";
  const compact = trimmed.replace(/-/g, "").toLowerCase();
  if (/^[0-9a-f]{32}$/.test(compact)) return compact.slice(0, 8).toUpperCase();
  const head = trimmed.replace(/-/g, "").slice(0, 8);
  return (head || trimmed.slice(0, 8)).toUpperCase() || "—";
}

/** NaturaSoft iktatószám / rendeles_id – hash nélkül (HH00001). */
export function getOrderNaturasoftId(order: OrderDisplayRef): string {
  const serial = order.order_number?.trim();
  if (serial) return serial;
  return getOrderPublicCode(order.id);
}

/** Megjelenítés: #HH00001 vagy #0FA99F49 (régi rendelések) */
export function formatOrderPublicId(order: OrderDisplayRef | string): string {
  const code = getOrderPublicCode(order);
  return code === "—" ? "—" : `#${code}`;
}
