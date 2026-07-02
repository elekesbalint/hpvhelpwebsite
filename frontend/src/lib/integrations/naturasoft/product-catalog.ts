/**
 * Ismert IntimSelfCare SAM termékek NaturaSoft cikkszámai (slug → SKU).
 * Forrás: NaturaSoft terméktörzs (Sunmed Kft.) – admin SKU mező elsőbbséget élvez.
 */
export const NATURASOFT_PRODUCT_SKU_BY_SLUG: Readonly<Record<string, string>> = {
  "hpv-humann-papillomavirus-sam1-onmintavetelezes": "SAM001",
  "sti-szexualisan-terjedo-infekciok-sam2-onmintavetelezes": "SAM002",
  "microbiom-sam3-onmintavetelezes": "SAM003",
  "hpv-sti-kombinacios-onmintavetelezes": "SAM004",
  "sti-microbiom-kombinacios-onmintavetelezes": "SAM005",
  "hpv-microbiom-kombinacios-onmintavetelezes": "SAM006",
  "hpv-sti-microbiom-kombinacios-onmintavetelezes": "SAM007",
};

export function resolveNaturasoftSkuBySlug(slug: string | null | undefined): string | null {
  const key = slug?.trim();
  if (!key) return null;
  return NATURASOFT_PRODUCT_SKU_BY_SLUG[key] ?? null;
}

/** Rendelési tétel megnevezés alapján (ha slug/SKU hiányzik). */
export function resolveNaturasoftSkuByProductName(name: string | null | undefined): string | null {
  if (!name?.trim()) return null;
  const n = name.toLowerCase();

  if (n.includes("allin1") || n.includes("all-in1") || n.includes("all in1")) return "SAM007";
  if (n.includes("combo1")) return "SAM004";
  if (n.includes("combo2")) return "SAM005";
  if (n.includes("combo3")) return "SAM006";
  if (n.includes("full hpv")) return "SAM001";
  if (
    n.includes("microbiom teszt") ||
    (n.includes("sam") && n.includes("microbiom") && !n.includes("combo") && !n.includes("allin"))
  ) {
    return "SAM003";
  }
  if (
    (n.includes("sti teszt") || (n.includes("sam") && n.includes("sti"))) &&
    !n.includes("microbiom") &&
    !n.includes("combo") &&
    !n.includes("allin")
  ) {
    return "SAM002";
  }

  return null;
}

/** NaturaSoft törzs megnevezés (pontos egyezés a számlázóban). */
export const NATURASOFT_EXPORT_NAME_BY_SKU: Readonly<Record<string, string>> = {
  SAM001: "SAM Full HPV teszt",
  SAM002: "SAM STI teszt",
  SAM003: "SAM Microbiom teszt",
  SAM004: "SAM Combo1 teszt (FULL HPV és STI)",
  SAM005: "SAM Combo2 teszt (FULL HPV és Microbiom)",
  SAM006: "SAM Combo3 teszt (STI és Microbiom)",
  SAM007: "SAM Allin1 teszt (FULL HPV, STI és Microbiom)",
  SUN594: "FertyBiotic Balance (34x)",
};

export function resolveNaturasoftExportNameBySku(
  sku: string | null | undefined,
  fallback: string,
): string {
  const key = sku?.trim();
  if (!key) return fallback;
  return NATURASOFT_EXPORT_NAME_BY_SKU[key] ?? fallback;
}

/** Régi webshop / Neotest ZNS kódok → NaturaSoft törzs (SAM*). */
export const NATURASOFT_LEGACY_SKU_MAP: Readonly<Record<string, string>> = {
  ZNS001: "SAM001",
  ZNS002: "SAM002",
  ZNS003: "SAM003",
  ZNS004: "SAM004",
  ZNS005: "SAM005",
  ZNS006: "SAM006",
  ZNS007: "SAM007",
  SAMS001: "SAM001",
};

export function normalizeNaturasoftExportSku(sku: string | null | undefined): string | null {
  const key = sku?.trim().toUpperCase();
  if (!key) return null;
  return NATURASOFT_LEGACY_SKU_MAP[key] ?? sku?.trim() ?? null;
}

/**
 * NaturaSoft törzs ÁFA (százalék). Ha eltér a webshop kategóriától, ez dönt exportkor.
 * SAM öntesztek: 0% (TAM) a NaturaSoftban; szállítás és SUN594: 27%.
 */
export const NATURASOFT_EXPORT_VAT_BY_SKU: Readonly<Record<string, number>> = {
  SAM001: 0,
  SAM002: 0,
  SAM003: 0,
  SAM004: 0,
  SAM005: 0,
  SAM006: 0,
  SAM007: 0,
  SUN594: 27,
};

export function resolveNaturasoftExportVatBySku(sku: string | null | undefined): number | null {
  const key = sku?.trim();
  if (!key) return null;
  const normalized = normalizeNaturasoftExportSku(key) ?? key;
  const rate = NATURASOFT_EXPORT_VAT_BY_SKU[normalized];
  return rate != null ? rate : null;
}
