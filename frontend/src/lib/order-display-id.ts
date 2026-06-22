/**
 * Rövid, vevőbarát rendelésazonosító: az UUID első 8 hex számjegye (nagybetű), # nélkül.
 * A Supabase `orders.id` továbbra is teljes UUID marad URL-ben és lekérdezésben.
 */
export function getOrderPublicCode(orderId: string): string {
  const trimmed = orderId.trim();
  if (!trimmed) return "—";
  const compact = trimmed.replace(/-/g, "").toLowerCase();
  if (/^[0-9a-f]{32}$/.test(compact)) return compact.slice(0, 8).toUpperCase();
  const head = trimmed.replace(/-/g, "").slice(0, 8);
  return (head || trimmed.slice(0, 8)).toUpperCase() || "—";
}

/** Megjelenítés: #0FA99F49 */
export function formatOrderPublicId(orderId: string): string {
  const code = getOrderPublicCode(orderId);
  return code === "—" ? "—" : `#${code}`;
}
