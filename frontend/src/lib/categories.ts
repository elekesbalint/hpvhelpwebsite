import type { Database } from "@/types/supabase";

export type Category = Database["public"]["Tables"]["categories"]["Row"];

export type CategoryNode = Category & { children: CategoryNode[] };

/** Főkategóriák (nincs szülő). */
export function getRootCategories<T extends Pick<Category, "parent_id">>(categories: T[]): T[] {
  return categories.filter((c) => !c.parent_id);
}

export function getChildCategories<T extends Pick<Category, "id" | "parent_id">>(
  categories: T[],
  parentId: string,
): T[] {
  return categories.filter((c) => c.parent_id === parentId);
}

/** Kategória + összes leszármazott id (2 szint). */
export function getCategoryDescendantIds(
  categories: Pick<Category, "id" | "parent_id">[],
  categoryId: string,
): string[] {
  const childIds = categories.filter((c) => c.parent_id === categoryId).map((c) => c.id);
  return [categoryId, ...childIds];
}

export function productMatchesCategoryFilter(
  productCategoryId: string | null | undefined,
  filterCategoryId: string,
  categories: Pick<Category, "id" | "parent_id">[],
): boolean {
  if (!productCategoryId) return false;
  const allowed = new Set(getCategoryDescendantIds(categories, filterCategoryId));
  return allowed.has(productCategoryId);
}

export function buildCategoryTree(categories: Category[]): CategoryNode[] {
  const byParent = new Map<string | null, Category[]>();
  for (const cat of categories) {
    const key = cat.parent_id ?? null;
    const bucket = byParent.get(key) ?? [];
    bucket.push(cat);
    byParent.set(key, bucket);
  }

  function attach(parentId: string | null): CategoryNode[] {
    const list = byParent.get(parentId) ?? [];
    return list.map((cat) => ({
      ...cat,
      children: attach(cat.id),
    }));
  }

  return attach(null);
}

/** Legördülő: főkategória + behúzott alkategóriák. */
export function flattenCategoriesForSelect(categories: Category[]): { id: string; label: string; depth: number }[] {
  const tree = buildCategoryTree(categories);
  const rows: { id: string; label: string; depth: number }[] = [];

  function walk(nodes: CategoryNode[], depth: number) {
    for (const node of nodes) {
      rows.push({
        id: node.id,
        label: depth === 0 ? node.name : `— ${node.name}`,
        depth,
      });
      if (node.children.length > 0) walk(node.children, depth + 1);
    }
  }

  walk(tree, 0);
  return rows;
}

export function getCategoryBreadcrumb(
  category: Category | undefined,
  categoriesById: Map<string, Category>,
): string {
  if (!category) return "";
  if (!category.parent_id) return category.name;
  const parent = categoriesById.get(category.parent_id);
  return parent ? `${parent.name} › ${category.name}` : category.name;
}

export function isSamCategory(category: Pick<Category, "slug" | "parent_id"> | undefined, categoriesById: Map<string, Category>): boolean {
  if (!category) return false;
  if (category.slug === "sam-noi-ontesztek") return true;
  if (category.parent_id) {
    const parent = categoriesById.get(category.parent_id);
    if (parent?.slug === "sam-noi-ontesztek") return true;
  }
  return false;
}
