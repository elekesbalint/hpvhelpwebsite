import type { Database } from "@/types/supabase";

type Product = Database["public"]["Tables"]["products"]["Row"];

export function productSortKey(product: Product): number {
  if (product.sort_order != null) return product.sort_order;
  return Number.MAX_SAFE_INTEGER;
}

export function compareProductsBySortOrder(a: Product, b: Product): number {
  const orderDiff = productSortKey(a) - productSortKey(b);
  if (orderDiff !== 0) return orderDiff;
  return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
}

export function sortProductsForDisplay<T extends Product>(products: T[]): T[] {
  return [...products].sort(compareProductsBySortOrder);
}

/** Új termék sort_order értéke: a jelenlegi maximum + 10. */
export function nextProductSortOrder(products: Product[]): number {
  const max = products.reduce((acc, p) => Math.max(acc, p.sort_order ?? 0), 0);
  return max + 10;
}

/** Átrendezés után új sort_order értékek (10, 20, 30…). */
export function buildSortOrderUpdates<T extends Product>(
  products: T[],
  fromIndex: number,
  toIndex: number,
): Array<{ id: string; sort_order: number }> {
  if (fromIndex < 0 || toIndex < 0 || fromIndex >= products.length || toIndex >= products.length) {
    return [];
  }
  const ordered = [...products];
  const [moved] = ordered.splice(fromIndex, 1);
  ordered.splice(toIndex, 0, moved);
  return ordered.map((p, i) => ({ id: p.id, sort_order: (i + 1) * 10 }));
}
