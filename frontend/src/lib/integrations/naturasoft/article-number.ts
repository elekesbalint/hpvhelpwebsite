/** Cikkszám kiolvasása termékleírás HTML/szövegéből (pl. „Cikkszám: ZNS001”). */
export function parseArticleNumberFromDescription(description: string | null | undefined): string | null {
  if (!description?.trim()) return null;
  const plain = description
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  const match = plain.match(/Cikksz[aá]m\s*:\s*([A-Za-z0-9\-_.]+)/i);
  return match?.[1]?.trim() ?? null;
}

type ArticleProduct = {
  sku?: string | null;
  description?: string | null;
  slug?: string | null;
};

/** Cikkszám: először dedikált mező, majd leírás, végül slug. */
export function resolveProductArticleNumber(product: ArticleProduct | null | undefined): string | null {
  const sku = product?.sku?.trim();
  if (sku) return sku;
  return parseArticleNumberFromDescription(product?.description) ?? product?.slug?.trim() ?? null;
}
