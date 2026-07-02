import {
  normalizeNaturasoftExportSku,
  resolveNaturasoftSkuByProductName,
  resolveNaturasoftSkuBySlug,
} from "@/lib/integrations/naturasoft/product-catalog";

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

/**
 * Cikkszám feloldás termékből.
 * Sorrend: admin SKU → slug katalógus → leírás (régi „Cikkszám:” sor lehet elavult).
 */
export function resolveProductArticleNumber(product: ArticleProduct | null | undefined): string | null {
  const sku = product?.sku?.trim();
  const fromCatalog = resolveNaturasoftSkuBySlug(product?.slug);

  // Elavult admin SKU (pl. ZNS001, SAMS001) → slug katalógus (SAM001 stb.)
  if (fromCatalog) {
    if (!sku || sku === fromCatalog) return fromCatalog;
    if (/^ZNS00/i.test(sku) || /^SAMS/i.test(sku)) return fromCatalog;
  }

  if (sku && isValidNaturasoftArticleNumber(sku)) {
    return normalizeNaturasoftExportSku(sku) ?? sku;
  }
  if (fromCatalog) return fromCatalog;

  const fromDescription = parseArticleNumberFromDescription(product?.description);
  if (fromDescription && isValidNaturasoftArticleNumber(fromDescription)) return fromDescription;

  return sku || null;
}

export function isValidNaturasoftArticleNumber(sku: string | null | undefined): boolean {
  const s = sku?.trim();
  if (!s || s === "ISMERETLEN") return false;
  // Régi export hibából: product_id első 8 hex karaktere
  if (/^[0-9a-f]{8}$/i.test(s)) return false;
  return true;
}

export function resolveOrderItemArticleNumber(
  item: { product_sku?: string | null },
  product: ArticleProduct | null | undefined,
): string | null {
  const snapshot = item.product_sku?.trim();
  if (snapshot && isValidNaturasoftArticleNumber(snapshot)) return snapshot;
  return resolveProductArticleNumber(product);
}

/**
 * NaturaSoft export cikkszám.
 * A rendelési pillanatkép (product_sku) nem elsőbbség – régi hibás SAMS001 érték különben blokkolja a helyes SAM001-et.
 */
export function resolveExportArticleNumber(
  item: { product_sku?: string | null; product_name?: string },
  product: ArticleProduct | null | undefined,
): string {
  const fromName = resolveNaturasoftSkuByProductName(item.product_name);
  if (fromName) return fromName;

  const fromProduct = resolveProductArticleNumber(product);
  if (fromProduct && isValidNaturasoftArticleNumber(fromProduct)) {
    return normalizeNaturasoftExportSku(fromProduct) ?? fromProduct;
  }

  const snapshot = item.product_sku?.trim();
  if (snapshot) {
    const normalized = normalizeNaturasoftExportSku(snapshot);
    if (normalized && isValidNaturasoftArticleNumber(normalized)) return normalized;
  }

  return snapshot || "ISMERETLEN";
}
