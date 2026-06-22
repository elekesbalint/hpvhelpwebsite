import type { Database } from "@/types/supabase";

type Product = Database["public"]["Tables"]["products"]["Row"];
type Category = Database["public"]["Tables"]["categories"]["Row"];

export type DiscountInfo = {
  effectivePrice: number;
  originalPrice: number;
  hasDiscount: boolean;
  discountLabel: string | null;
  isSalePrice: boolean;
};

type SalePeriodFields = {
  sale_starts_at?: string | null;
  sale_ends_at?: string | null;
};

/** Leárazás/kedvezmény időablak – üres mező = nincs korlát az adott oldalon. */
export function isWithinSalePeriod(
  product: SalePeriodFields,
  now: Date = new Date()
): boolean {
  if (product.sale_starts_at && new Date(product.sale_starts_at) > now) return false;
  if (product.sale_ends_at && new Date(product.sale_ends_at) < now) return false;
  return true;
}

/**
 * Kiszámítja egy termék tényleges árát, figyelembe véve:
 * 1. compare_at_price (leárazott ár: az ár maga már az akciós ár) – időszakkal
 * 2. discount_type + discount_value a terméken – időszakkal
 * 3. discount_type + discount_value a kategórián (ha a terméken nincs)
 */
export function getProductPricing(product: Product, category?: Category | null): DiscountInfo {
  const basePrice = Number(product.price);
  const salePeriodActive = isWithinSalePeriod(product);

  if (salePeriodActive && product.compare_at_price != null && Number(product.compare_at_price) > basePrice) {
    const originalPrice = Number(product.compare_at_price);
    const savedPct = Math.round(((originalPrice - basePrice) / originalPrice) * 100);
    return {
      effectivePrice: basePrice,
      originalPrice,
      hasDiscount: true,
      discountLabel: `-${savedPct}%`,
      isSalePrice: true,
    };
  }

  const productDiscountType = salePeriodActive ? product.discount_type : null;
  const productDiscountValue = salePeriodActive ? product.discount_value : null;
  const discountType = productDiscountType ?? category?.discount_type ?? null;
  const discountValue = productDiscountValue ?? category?.discount_value ?? null;

  if (discountType && discountValue != null && discountValue > 0) {
    let effectivePrice = basePrice;
    let label: string | null = null;

    if (discountType === "percent") {
      effectivePrice = Math.max(0, basePrice * (1 - discountValue / 100));
      label = `-${discountValue}%`;
    } else if (discountType === "fixed") {
      effectivePrice = Math.max(0, basePrice - discountValue);
      label = `-${discountValue.toLocaleString("hu-HU")} Ft`;
    }

    return {
      effectivePrice: Math.round(effectivePrice),
      originalPrice: basePrice,
      hasDiscount: true,
      discountLabel: label,
      isSalePrice: false,
    };
  }

  return {
    effectivePrice: basePrice,
    originalPrice: basePrice,
    hasDiscount: false,
    discountLabel: null,
    isSalePrice: false,
  };
}

/**
 * Ellenőrzi, hogy egy kosárban lévő tétel akciósan van-e (aktuálisan érvényes kedvezménnyel).
 * Ha igen, kupont nem lehet érvényesíteni.
 */
export function cartItemIsOnSale(product: Product, category?: Category | null): boolean {
  return getProductPricing(product, category).hasDiscount;
}

/** Aktív, akciósan megjelenő termék (compare_at_price vagy termék/kategória kedvezmény). */
export function productHasActiveDiscount(product: Product, category?: Category | null): boolean {
  return getProductPricing(product, category).hasDiscount;
}

/**
 * Kupon kedvezmény kiszámítása.
 * Visszatérési érték: a kedvezmény összege Ft-ban.
 */
export function calculateCouponDiscount(
  coupon: Database["public"]["Tables"]["coupons"]["Row"],
  orderTotal: number
): number {
  if (coupon.discount_type === "percent") {
    return Math.round((orderTotal * coupon.discount_value) / 100);
  }
  return Math.min(orderTotal, coupon.discount_value);
}
