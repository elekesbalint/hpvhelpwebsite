"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getCartChangedEventName,
  getCartItems,
  removeFromCart,
  updateCartQuantity,
} from "@/lib/cart";
import type { CartItem } from "@/types/cart";

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    function refresh() {
      setItems(getCartItems());
    }

    refresh();
    window.addEventListener(getCartChangedEventName(), refresh);

    return () => {
      window.removeEventListener(getCartChangedEventName(), refresh);
    };
  }, []);

  const totalItems = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  );
  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items]
  );

  return {
    items,
    totalItems,
    subtotal,
    removeFromCart,
    updateCartQuantity,
  };
}
