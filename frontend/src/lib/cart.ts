import type { AddToCartResult, CartItem } from "@/types/cart";

const CART_STORAGE_KEY = "webshop_cart_v1";
const CART_CHANGED_EVENT = "cart:changed";

function emitCartChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(CART_CHANGED_EVENT));
  }
}

export function getCartChangedEventName(): string {
  return CART_CHANGED_EVENT;
}

export function getCartItems(): CartItem[] {
  if (typeof window === "undefined") {
    return [];
  }

  const raw = window.localStorage.getItem(CART_STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as CartItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function setCartItems(items: CartItem[]) {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  emitCartChanged();
}

/** Egy termék összes mennyisége a kosárban (mintavételi változattól függetlenül). */
export function getCartQuantityForProduct(items: CartItem[], productId: string): number {
  return items
    .filter((item) => item.productId === productId)
    .reduce((sum, item) => sum + item.quantity, 0);
}

function resolveMaxStock(itemMaxStock: number | undefined, override?: number): number {
  if (override != null && Number.isFinite(override)) return Math.max(0, Math.floor(override));
  if (itemMaxStock != null && Number.isFinite(itemMaxStock)) return Math.max(0, Math.floor(itemMaxStock));
  return Number.POSITIVE_INFINITY;
}

export function addToCart(
  item: Omit<CartItem, "quantity">,
  quantity = 1,
  maxStockOverride?: number
): AddToCartResult {
  const items = getCartItems();
  const maxStock = resolveMaxStock(item.maxStock, maxStockOverride);
  const currentTotal = getCartQuantityForProduct(items, item.productId);
  const room = Number.isFinite(maxStock) ? Math.max(0, maxStock - currentTotal) : quantity;
  const toAdd = Math.min(Math.max(0, quantity), room);

  if (toAdd <= 0) {
    return { added: 0, requested: quantity, limitedByStock: true };
  }

  const existing = items.find(
    (it) => it.productId === item.productId && (it.sampleTarget ?? null) === (item.sampleTarget ?? null)
  );

  if (existing) {
    existing.quantity += toAdd;
    existing.maxStock = Number.isFinite(maxStock) ? maxStock : existing.maxStock;
    if (item.imageUrl != null && item.imageUrl !== "") {
      existing.imageUrl = item.imageUrl;
    }
  } else {
    items.push({
      ...item,
      quantity: toAdd,
      maxStock: Number.isFinite(maxStock) ? maxStock : item.maxStock,
    });
  }

  setCartItems(items);

  if (typeof window !== "undefined") {
    void import("@/lib/analytics/track").then(({ trackAddToCart }) => {
      trackAddToCart(
        {
          ...item,
          quantity: toAdd,
          maxStock: Number.isFinite(maxStock) ? maxStock : item.maxStock,
        },
        toAdd,
      );
    });
  }

  return {
    added: toAdd,
    requested: quantity,
    limitedByStock: toAdd < quantity,
  };
}

export function removeFromCart(productId: string, sampleTarget?: "female" | "male") {
  const items = getCartItems().filter(
    (item) => !(item.productId === productId && (item.sampleTarget ?? null) === (sampleTarget ?? null))
  );
  setCartItems(items);
}

export function updateCartQuantity(
  productId: string,
  quantity: number,
  sampleTarget?: "female" | "male",
  maxStockOverride?: number
): { quantity: number; limitedByStock: boolean } {
  const items = getCartItems();
  const line = items.find(
    (item) => item.productId === productId && (item.sampleTarget ?? null) === (sampleTarget ?? null)
  );
  const maxStock = resolveMaxStock(line?.maxStock, maxStockOverride);
  const otherLinesQty = items
    .filter(
      (item) =>
        item.productId === productId && (item.sampleTarget ?? null) !== (sampleTarget ?? null)
    )
    .reduce((sum, item) => sum + item.quantity, 0);
  const maxForLine = Number.isFinite(maxStock)
    ? Math.max(0, maxStock - otherLinesQty)
    : Math.max(1, quantity);
  const capped = Math.min(Math.max(1, quantity), maxForLine);

  const updated = items
    .map((item) =>
      item.productId === productId && (item.sampleTarget ?? null) === (sampleTarget ?? null)
        ? {
            ...item,
            quantity: capped,
            maxStock: Number.isFinite(maxStock) ? maxStock : item.maxStock,
          }
        : item
    )
    .filter((item) => item.quantity > 0);

  setCartItems(updated);
  return { quantity: capped, limitedByStock: capped < quantity };
}

/** DB készlet alapján levágja a kosár mennyiségeit; visszaadja, volt-e módosítás. */
export function syncCartStock(stockByProductId: Record<string, number>): boolean {
  const items = getCartItems();
  let changed = false;
  const totals: Record<string, number> = {};

  const next = items
    .map((item) => {
      const stock = stockByProductId[item.productId];
      const maxStock = stock != null ? Math.max(0, stock) : item.maxStock;
      const used = totals[item.productId] ?? 0;
      const available =
        maxStock != null && Number.isFinite(maxStock)
          ? Math.max(0, maxStock - used)
          : item.quantity;
      const quantity = Math.min(item.quantity, available);
      totals[item.productId] = used + quantity;

      if (quantity !== item.quantity || maxStock !== item.maxStock) changed = true;
      if (quantity <= 0) {
        changed = true;
        return null;
      }
      const updated: CartItem = { ...item, quantity };
      if (maxStock != null) updated.maxStock = maxStock;
      return updated;
    })
    .filter((item): item is CartItem => item != null);

  if (changed) setCartItems(next);
  return changed;
}

export function clearCart() {
  setCartItems([]);
}
