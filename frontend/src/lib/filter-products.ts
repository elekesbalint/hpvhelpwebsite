import type { Database } from "@/types/supabase";
import { getCategoryBreadcrumb } from "@/lib/categories";

type Product = Database["public"]["Tables"]["products"]["Row"];
type Category = Database["public"]["Tables"]["categories"]["Row"];

export function filterProductsByQuery(
  products: Product[],
  categoriesById: Map<string, Category>,
  query: string
): Product[] {
  const kw = query.trim().toLowerCase();
  if (!kw) return [];
  return products.filter((p) => {
    const cat = p.category_id ? getCategoryBreadcrumb(categoriesById.get(p.category_id), categoriesById) : "";
    return (
      p.name.toLowerCase().includes(kw) ||
      (p.description ?? "").toLowerCase().includes(kw) ||
      cat.toLowerCase().includes(kw)
    );
  });
}
