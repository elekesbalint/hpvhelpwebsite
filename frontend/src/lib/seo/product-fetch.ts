import { createPublicSupabase } from "@/lib/seo/public-supabase";
import type { Database } from "@/types/supabase";

type Product = Database["public"]["Tables"]["products"]["Row"];
type Category = Database["public"]["Tables"]["categories"]["Row"];

export type ProductWithCategory = {
  product: Product;
  category: Category | null;
};

export async function fetchProductWithCategoryBySlug(
  slug: string
): Promise<ProductWithCategory | null> {
  const supabase = createPublicSupabase();
  const { data: product, error } = await supabase
    .from("products")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (error || !product) return null;

  let category: Category | null = null;
  if (product.category_id) {
    const { data } = await supabase
      .from("categories")
      .select("*")
      .eq("id", product.category_id)
      .maybeSingle();
    category = data ?? null;
  }

  return { product, category };
}

export async function fetchActiveProductSitemapEntries(): Promise<
  { slug: string; updated_at: string }[]
> {
  const supabase = createPublicSupabase();
  const { data, error } = await supabase
    .from("products")
    .select("slug, updated_at")
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (error || !data) return [];
  return data.filter((row): row is { slug: string; updated_at: string } => Boolean(row.slug));
}
