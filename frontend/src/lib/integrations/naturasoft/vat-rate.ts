type VatProduct = {
  vat_rate?: number | null;
  category_id?: string | null;
};

type VatCategory = {
  vat_rate?: number | null;
};

export function resolveProductVatRate(
  product: VatProduct | null | undefined,
  categoriesById: Map<string, VatCategory>,
  fallback: number,
): number {
  if (product?.vat_rate != null) return Number(product.vat_rate);
  if (product?.category_id) {
    const category = categoriesById.get(product.category_id);
    if (category?.vat_rate != null) return Number(category.vat_rate);
  }
  return fallback;
}
