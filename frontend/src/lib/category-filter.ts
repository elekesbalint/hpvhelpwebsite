import { getCategoryDescendantIds, productMatchesCategoryFilter } from "@/lib/categories";
import { CATEGORY_SLUGS } from "@/lib/product-search-url";
import type { Database } from "@/types/supabase";

type Category = Database["public"]["Tables"]["categories"]["Row"];

/** SAMM (étrend-kiegészítők) főkategória slugok – adminban eltérő elnevezés is lehet. */
export const SAMM_CATEGORY_ROOT_SLUGS = [
  CATEGORY_SLUGS.sammKezelesek,
  "samm-kezelesek-es-kotroll",
  "sam2-sexual-activity-medicine",
] as const;

const SAMM_DESCENDANT_SLUGS = new Set([
  ...SAMM_CATEGORY_ROOT_SLUGS,
  "samm-huvelyi-keszitmenyek",
  "samm-kapszulak",
]);

const FILTER_SLUG_TO_ROOTS: Record<string, readonly string[]> = {
  [CATEGORY_SLUGS.sammKezelesek]: SAMM_CATEGORY_ROOT_SLUGS,
  [CATEGORY_SLUGS.samNoiOntesztek]: [
    CATEGORY_SLUGS.samNoiOntesztek,
    "sam1-sexual-activity-monitoring-intimselfcare",
  ],
  [CATEGORY_SLUGS.egyeb]: [CATEGORY_SLUGS.egyeb],
  [CATEGORY_SLUGS.protection]: [CATEGORY_SLUGS.protection],
};

export function resolveFilterRootCategoryIds(
  filterSlug: string,
  categories: Pick<Category, "id" | "slug">[],
): string[] {
  const slug = filterSlug.trim();
  if (!slug) return [];

  const rootSlugs = FILTER_SLUG_TO_ROOTS[slug] ?? [slug];
  const ids: string[] = [];
  for (const rootSlug of rootSlugs) {
    const cat = categories.find((c) => c.slug === rootSlug);
    if (cat) ids.push(cat.id);
  }
  return ids;
}

export function productMatchesCategorySlugFilter(
  productCategoryId: string | null | undefined,
  filterSlug: string,
  categories: Pick<Category, "id" | "slug" | "parent_id">[],
): boolean {
  const rootIds = resolveFilterRootCategoryIds(filterSlug, categories);
  if (rootIds.length === 0) return false;
  return rootIds.some((rootId) =>
    productMatchesCategoryFilter(productCategoryId, rootId, categories),
  );
}

export function isSammCategory(
  category: Pick<Category, "id" | "slug" | "parent_id"> | undefined,
  categoriesById: Map<string, Pick<Category, "id" | "slug" | "parent_id">>,
): boolean {
  if (!category) return false;
  if (SAMM_DESCENDANT_SLUGS.has(category.slug)) return true;
  if (category.parent_id) {
    const parent = categoriesById.get(category.parent_id);
    if (parent && isSammCategory(parent, categoriesById)) return true;
  }
  return false;
}

export function getCategoryFilterTitle(
  filterSlug: string,
  categories: Pick<Category, "id" | "slug" | "name">[],
): string | null {
  const rootIds = resolveFilterRootCategoryIds(filterSlug, categories);
  if (rootIds.length === 0) return null;
  const primary = categories.find((c) => c.id === rootIds[0]);
  return primary?.name ?? null;
}

export function getAllDescendantIdsForSlugFilter(
  filterSlug: string,
  categories: Pick<Category, "id" | "slug" | "parent_id">[],
): string[] {
  const rootIds = resolveFilterRootCategoryIds(filterSlug, categories);
  const all = new Set<string>();
  for (const rootId of rootIds) {
    for (const id of getCategoryDescendantIds(categories, rootId)) {
      all.add(id);
    }
  }
  return [...all];
}
