import { getCategoryDescendantIds } from "@/lib/categories";
import { CATEGORY_SLUGS } from "@/lib/product-search-url";
import type { Database } from "@/types/supabase";

type Category = Database["public"]["Tables"]["categories"]["Row"];

/** SAM férfi alkategória slugok – „Férfiaknak” gomb + női szűrés kizárása. */
export const AUDIENCE_CATEGORY_SLUGS = {
  ferfi: ["ferfi-hpv", "oral", "anus"],
} as const;

export type AudienceFilter = "noi" | "ferfi";

const FERFI_SLUGS = new Set<string>(AUDIENCE_CATEGORY_SLUGS.ferfi);

export function productMatchesAudienceFilter(
  productCategoryId: string | null | undefined,
  audience: AudienceFilter,
  categories: Pick<Category, "id" | "slug" | "parent_id">[],
): boolean {
  if (!productCategoryId) return false;
  const cat = categories.find((c) => c.id === productCategoryId);
  if (!cat) return false;

  if (audience === "ferfi") {
    return FERFI_SLUGS.has(cat.slug);
  }

  const samNoiParent = categories.find((c) => c.slug === CATEGORY_SLUGS.samNoiOntesztek);
  if (!samNoiParent) return false;

  const allowed = new Set(getCategoryDescendantIds(categories, samNoiParent.id));
  if (!allowed.has(productCategoryId)) return false;
  return !FERFI_SLUGS.has(cat.slug);
}

export function audienceFilterLabel(audience: AudienceFilter): string {
  return audience === "noi" ? "Öntesztek nőknek" : "Öntesztek férfiaknak";
}
