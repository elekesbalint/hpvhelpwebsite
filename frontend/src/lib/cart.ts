import type { CartItem } from "@/types/cart";

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

export function addToCart(item: Omit<CartItem, "quantity">, quantity = 1) {
  const items = getCartItems();
  const existing = items.find((it) => it.productId === item.productId);

  if (existing) {
    existing.quantity += quantity;
    if (item.imageUrl != null && item.imageUrl !== "") {
      existing.imageUrl = item.imageUrl;
    }
  } else {
    items.push({ ...item, quantity });
  }

  setCartItems(items);
}

export function removeFromCart(productId: string) {
  const items = getCartItems().filter((item) => item.productId !== productId);
  setCartItems(items);
}

export function updateCartQuantity(productId: string, quantity: number) {
  const items = getCartItems()
    .map((item) => (item.productId === productId ? { ...item, quantity } : item))
    .filter((item) => item.quantity > 0);
  setCartItems(items);
}

export function clearCart() {
  setCartItems([]);
}
