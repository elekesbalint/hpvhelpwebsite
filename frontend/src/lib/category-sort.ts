import { CATEGORY_SLUGS } from "@/lib/product-search-url";
import { buildCategoryTree, type CategoryNode } from "@/lib/categories";
import type { Database } from "@/types/supabase";

type Category = Database["public"]["Tables"]["categories"]["Row"];

const SLUG_FALLBACK_ORDER: Record<string, number> = {
  [CATEGORY_SLUGS.samNoiOntesztek]: 1,
  [CATEGORY_SLUGS.sammKezelesek]: 2,
  [CATEGORY_SLUGS.protection]: 3,
  [CATEGORY_SLUGS.egyeb]: 4,
};

function categorySortKey(cat: Category): number {
  if (cat.sort_order != null) return cat.sort_order;
  if (cat.parent_id) return 50;
  return SLUG_FALLBACK_ORDER[cat.slug] ?? 100;
}

function compareCategories(a: Category, b: Category): number {
  const orderDiff = categorySortKey(a) - categorySortKey(b);
  if (orderDiff !== 0) return orderDiff;
  return a.name.localeCompare(b.name, "hu");
}

/** Fa sorrend: főkategória, majd alkategóriái. */
export function sortCategoriesForDisplay<T extends Category>(categories: T[]): T[] {
  const tree = buildCategoryTree(categories) as CategoryNode[] & T[];
  const sorted: T[] = [];

  function walk(nodes: (CategoryNode & T)[]) {
    const list = [...nodes].sort(compareCategories);
    for (const node of list) {
      sorted.push(node);
      if (node.children.length > 0) walk(node.children as (CategoryNode & T)[]);
    }
  }

  walk(tree as (CategoryNode & T)[]);
  return sorted;
}
