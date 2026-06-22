/** Webshop kategória slugok – szűrőgombokhoz és deep linkekhez. */
export const CATEGORY_SLUGS = {
  samNoiOntesztek: "sam-noi-ontesztek",
  sammKezelesek: "samm-kezelesek-es-kontroll",
  egyeb: "egyeb",
  protection: "protection-intim-biztonsag",
} as const;

/** Főoldali termékkeresés URL (#termekek szekció). */
export function buildProductSearchUrl(query: string): string {
  const q = query.trim();
  if (!q) return "/#termekek";
  return `/?q=${encodeURIComponent(q)}#termekek`;
}

/** Kategória szerinti szűrés URL (#termekek szekció). Opcionális szöveges szűkítéssel. */
export function buildCategoryFilterUrl(slug: string, query?: string): string {
  const s = slug.trim();
  const q = query?.trim() ?? "";
  if (!s && !q) return "/#termekek";
  const params = new URLSearchParams();
  if (s) params.set("kategoria", s);
  if (q) params.set("q", q);
  return `/?${params.toString()}#termekek`;
}

export function readProductSearchQuery(
  params: Pick<URLSearchParams, "get">
): string {
  return (params.get("q") ?? params.get("keresés") ?? "").trim();
}

export function readCategoryFilterSlug(
  params: Pick<URLSearchParams, "get">
): string {
  const raw = (params.get("kategoria") ?? "").trim();
  if (raw === "samm-kezelesek-es-kotroll") return CATEGORY_SLUGS.sammKezelesek;
  return raw;
}
