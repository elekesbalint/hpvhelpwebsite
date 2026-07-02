import type { MetadataRoute } from "next";
import { fetchActiveProductSitemapEntries } from "@/lib/seo/product-fetch";
import { getSiteUrl, PUBLIC_STATIC_PATHS } from "@/lib/seo/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl();
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = PUBLIC_STATIC_PATHS.map((path) => ({
    url: path === "/" ? base : `${base}${path}`,
    lastModified: now,
    changeFrequency: path === "/" ? "daily" : "weekly",
    priority: path === "/" ? 1 : 0.7,
  }));

  let productEntries: MetadataRoute.Sitemap = [];
  try {
    const products = await fetchActiveProductSitemapEntries();
    productEntries = products.map((product) => ({
      url: `${base}/shop/${product.slug}`,
      lastModified: new Date(product.updated_at),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));
  } catch {
    // Sitemap still serves static routes if catalog fetch fails.
  }

  return [...staticEntries, ...productEntries];
}
