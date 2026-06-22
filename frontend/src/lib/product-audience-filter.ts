import type { Database } from "@/types/supabase";

type Category = Database["public"]["Tables"]["categories"]["Row"];

/** SAM alkategória slugok – főoldali „Nőknek” / „Férfiaknak” gombokhoz. */
export const AUDIENCE_CATEGORY_SLUGS = {
  noi: [
    "noi-hpv",
    "noi-sti",
    "noi-microbiom",
    "combo-hpv-sti",
    "combo-sti-microbiom",
    "combo-hpv-microbiom",
    "combo-allin-hpv-sti-microbiom",
  ],
  ferfi: ["ferfi-hpv", "oral", "anus"],
} as const;

export type AudienceFilter = keyof typeof AUDIENCE_CATEGORY_SLUGS;

export function productMatchesAudienceFilter(
  productCategoryId: string | null | undefined,
  audience: AudienceFilter,
  categories: Pick<Category, "id" | "slug">[],
): boolean {
  if (!productCategoryId) return false;
  const cat = categories.find((c) => c.id === productCategoryId);
  if (!cat) return false;
  return (AUDIENCE_CATEGORY_SLUGS[audience] as readonly string[]).includes(cat.slug);
}

export function audienceFilterLabel(audience: AudienceFilter): string {
  return audience === "noi" ? "Öntesztek nőknek" : "Férfiaknak";
}
