"use client";
/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import Footer from "@/components/Footer";
import PublicSiteHeader from "@/components/PublicSiteHeader";
import { addToCart } from "@/lib/cart";
import { sortCategoriesForDisplay } from "@/lib/category-sort";
import { getProductPricing, productHasActiveDiscount } from "@/lib/pricing";
import { sortSaleProducts } from "@/lib/sort-sale-products";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/supabase";

type Product = Database["public"]["Tables"]["products"]["Row"];
type Category = Database["public"]["Tables"]["categories"]["Row"];

function stockBadge(stock: number) {
  if (stock <= 0) return { label: "Elfogyott", cls: "bg-rose-100 text-rose-700" };
  if (stock < 5) return { label: "Utolsó darabok", cls: "bg-amber-100 text-amber-700" };
  return { label: "Raktáron", cls: "bg-emerald-100 text-emerald-700" };
}

export default function AkciosTermekekPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const loadCatalog = useCallback(async () => {
    const [pr, cr] = await Promise.all([
      supabase.from("products").select("*").eq("is_active", true).order("name", { ascending: true }),
      supabase.from("categories").select("*").eq("is_active", true),
    ]);
    if (pr.error || cr.error) {
      setError(pr.error?.message ?? cr.error?.message ?? "Hiba történt a betöltéskor.");
      return;
    }
    setProducts(pr.data ?? []);
    setCategories(cr.data ?? []);
    setError(null);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      await loadCatalog();
      if (!cancelled) setLoading(false);
    })();
    const onVisible = () => {
      if (document.visibilityState === "visible") void loadCatalog();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [loadCatalog]);

  const categoriesById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  const saleProducts = useMemo(() => {
    const discounted = products.filter((p) => {
      const cat = p.category_id ? categoriesById.get(p.category_id) : undefined;
      return productHasActiveDiscount(p, cat);
    });
    return sortSaleProducts(discounted);
  }, [products, categoriesById]);

  const inStockCount = useMemo(() => saleProducts.filter((p) => p.stock > 0).length, [saleProducts]);

  return (
    <div className="min-h-screen w-full min-w-0 overflow-x-clip bg-[#fdf8f8] text-slate-900">
      <PublicSiteHeader />

      <main className="mx-auto w-full min-w-0 max-w-[1480px] px-4 py-10 sm:px-6 sm:py-12">
        <div className="mb-8 animate-fade-up">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-700">Kiemelt ajánlatok</p>
          <h1 className="mt-2 font-serif text-3xl font-bold italic text-brand-900 md:text-4xl">Akciós termékek</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-red-950/70">
            Az alábbi listában azok a termékek jelennek meg, amelyeknél érvényes leárazás vagy kedvezmény van
            beállítva. Az admin felületen módosított akciók automatikusan megjelennek itt is.
          </p>
          {!loading && !error ? (
            <p className="mt-2 text-sm text-red-950/60">
              <span className="font-bold text-slate-900">{saleProducts.length}</span> akciós termék
              {inStockCount < saleProducts.length ? (
                <span className="ml-1 text-emerald-700">({inStockCount} készleten)</span>
              ) : null}
            </p>
          ) : null}
        </div>

        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="overflow-hidden rounded-2xl border border-brand-100 bg-white shadow-sm">
                <div className="skeleton h-64 w-full" />
                <div className="p-4">
                  <div className="skeleton mb-2 h-3 w-1/3" />
                  <div className="skeleton mb-1 h-5 w-2/3" />
                  <div className="skeleton mt-3 h-4 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {error ? <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</div> : null}

        {!loading && !error && saleProducts.length === 0 ? (
          <div className="rounded-2xl border border-brand-100 bg-white p-14 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50">
              <svg className="h-6 w-6 text-brand-700" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" />
              </svg>
            </div>
            <p className="text-lg font-bold text-slate-900">Jelenleg nincs akciós termék</p>
            <p className="mt-2 text-sm text-red-950/60">
              Amint az adminban beállítasz kedvezményt vagy leárazást, a termék automatikusan megjelenik itt.
            </p>
            <Link
              href="/"
              className="btn-press mt-6 inline-flex rounded-xl bg-brand-900 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-brand-800"
            >
              Összes termék megtekintése
            </Link>
          </div>
        ) : null}

        {!loading && !error && saleProducts.length > 0 ? (
          <div className="stagger grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {saleProducts.map((product) => {
              const badge = stockBadge(product.stock);
              const category = product.category_id ? categoriesById.get(product.category_id) : undefined;
              const pricing = getProductPricing(product, category);
              const catName = category?.name ?? "";
              return (
                <article
                  key={product.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => router.push(`/shop/${product.slug}`)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      router.push(`/shop/${product.slug}`);
                    }
                  }}
                  className="card-hover animate-fade-up group flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-brand-100 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-200"
                >
                  <div className="relative overflow-hidden">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="h-64 w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="h-64 w-full bg-gradient-to-br from-brand-50 to-brand-100 transition duration-300 group-hover:from-brand-100 group-hover:to-brand-200" />
                    )}
                    {pricing.discountLabel ? (
                      <span className="absolute right-3 top-3 rounded-full bg-rose-600 px-2.5 py-1 text-xs font-bold text-white shadow">
                        {pricing.discountLabel}
                      </span>
                    ) : null}
                    <span className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-xs font-semibold shadow-sm ${badge.cls}`}>
                      {badge.label}
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col p-4">
                    {catName ? (
                      <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-brand-700">{catName}</p>
                    ) : null}
                    <h2 className="text-lg font-bold leading-snug text-slate-900 transition-colors group-hover:text-brand-900">
                      {product.name}
                    </h2>
                    {product.description ? (
                      <p className="mt-1 line-clamp-2 text-xs text-red-950/55">
                        {product.description.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()}
                      </p>
                    ) : null}
                    <div className="mt-auto pt-4">
                      <p className="text-xs text-red-950/45 line-through">
                        {pricing.originalPrice.toLocaleString("hu-HU")} Ft
                      </p>
                      <p className="text-xl font-bold text-rose-600">
                        {pricing.effectivePrice.toLocaleString("hu-HU")} Ft
                      </p>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          const result = addToCart(
                            {
                              productId: product.id,
                              slug: product.slug,
                              name: product.name,
                              price: pricing.effectivePrice,
                              imageUrl: product.image_url ?? undefined,
                              maxStock: product.stock,
                            },
                            1,
                            product.stock
                          );
                          if (result.added <= 0) {
                            window.alert(`Maximum ${product.stock} db rendelhető ebből a termékből.`);
                          }
                        }}
                        disabled={product.stock <= 0}
                        className="btn-press mt-3 w-full rounded-xl bg-brand-900 px-3 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-brand-800 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
                      >
                        {product.stock > 0 ? "Kosárba" : "Átmenetileg nem elérhető"}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : null}
      </main>

      <Footer />
    </div>
  );
}
