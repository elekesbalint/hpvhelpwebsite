import { getCartQuantityForProduct } from "@/lib/cart";
import { supabase } from "@/lib/supabase";
import type { CartItem } from "@/types/cart";

/** Ellenőrzi, hogy a kosár mennyiségei beleférnek-e a készletbe. Hibaüzenet vagy null. */
export async function validateCartStock(items: CartItem[]): Promise<string | null> {
  if (items.length === 0) return "A kosár üres.";

  const productIds = [...new Set(items.map((item) => item.productId))];
  const { data: products, error } = await supabase
    .from("products")
    .select("id, name, stock, is_active")
    .in("id", productIds);

  if (error) return error.message;

  const byId = new Map((products ?? []).map((p) => [p.id, p]));

  for (const productId of productIds) {
    const product = byId.get(productId);
    const requested = getCartQuantityForProduct(items, productId);

    if (!product || !product.is_active) {
      return `"${items.find((i) => i.productId === productId)?.name ?? "Termék"}" már nem elérhető.`;
    }
    if (product.stock < requested) {
      return `"${product.name}" esetén csak ${product.stock} db érhető el (kosár: ${requested} db).`;
    }
  }

  return null;
}
