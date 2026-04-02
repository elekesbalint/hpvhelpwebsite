"use client";
/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { addToCart } from "@/lib/cart";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/supabase";

type Product = Database["public"]["Tables"]["products"]["Row"];
type Category = Database["public"]["Tables"]["categories"]["Row"];

function getPublicStockLabel(stock: number) {
  if (stock <= 0) return "Elfogyott";
  if (stock < 5) return "Utolsó darabok";
  return "Raktáron";
}

const trustItems = [
  {
    icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
    label: "Biztonságos vásárlás",
    sub: "SSL titkosítás",
  },
  {
    icon: "M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4",
    label: "Gyors szállítás",
    sub: "1–3 munkanap",
  },
  {
    icon: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15",
    label: "Visszaküldés",
    sub: "14 napon belül",
  },
];

export default function ProductDetailsPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    void supabase
      .from("products")
      .select("*")
      .eq("slug", slug)
      .eq("is_active", true)
      .maybeSingle()
      .then(async (productResult) => {
        if (productResult.error) { setError(productResult.error.message); setLoading(false); return; }
        if (!productResult.data) { setError("A keresett termék nem található."); setLoading(false); return; }
        setProduct(productResult.data);
        if (productResult.data.category_id) {
          const categoryResult = await supabase
            .from("categories").select("*").eq("id", productResult.data.category_id).maybeSingle();
          if (!categoryResult.error) setCategory(categoryResult.data ?? null);
        }
        setLoading(false);
      });
  }, [slug]);

  function handleAddToCart() {
    if (!product || product.stock <= 0) return;
    for (let i = 0; i < qty; i++) {
      addToCart({ productId: product.id, slug: product.slug, name: product.name, price: Number(product.price) });
    }
    setAdded(true);
    setTimeout(() => setAdded(false), 2500);
  }

  const inStock = (product?.stock ?? 0) > 0;
  const total = product ? Number(product.price) * qty : 0;

  return (
    <div className="min-h-screen bg-[#fdf8f8] text-slate-900">
      <header className="sticky top-0 z-20 border-b border-brand-100/80 bg-white/80 shadow-sm backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl border border-brand-200 bg-white px-4 py-2 text-sm font-semibold text-red-950 shadow-sm transition hover:bg-brand-50"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
            </svg>
            Vissza a webshopba
          </Link>
          <Link
            href="/cart"
            aria-label="Kosár"
            className="btn-press rounded-lg border border-brand-200 p-2.5 text-red-950 transition hover:bg-brand-50"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <circle cx="9" cy="20" r="1" /><circle cx="17" cy="20" r="1" />
              <path d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.6a2 2 0 0 0 2-1.6L21 7H7" />
            </svg>
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-6 py-10">
        {loading ? (
          <div className="grid gap-8 lg:grid-cols-2">
            <div className="skeleton h-96 rounded-3xl" />
            <div className="space-y-4">
              <div className="skeleton h-6 w-1/4 rounded-xl" />
              <div className="skeleton h-10 w-3/4 rounded-xl" />
              <div className="skeleton h-16 w-full rounded-xl" />
              <div className="skeleton h-40 w-full rounded-2xl" />
            </div>
          </div>
        ) : null}

        {error ? (
          <div className="rounded-2xl bg-rose-50 border border-rose-200 p-6 text-sm text-rose-700">{error}</div>
        ) : null}

        {!loading && !error && product ? (
          <div className="grid gap-10 lg:grid-cols-2">
            {/* Left: Image */}
            <div className="space-y-4">
              <div className="overflow-hidden rounded-3xl border border-brand-100 bg-white shadow-lg shadow-brand-100/30">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="h-[420px] w-full object-cover"
                  />
                ) : (
                  <div className="flex h-[420px] w-full items-center justify-center bg-gradient-to-br from-brand-50 to-brand-100">
                    <svg className="h-24 w-24 text-brand-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <path d="m3 9 4-4 4 4 4-4 4 4" /><circle cx="8.5" cy="14.5" r="2.5" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Trust badges */}
              <div className="grid grid-cols-3 gap-3">
                {trustItems.map((item) => (
                  <div key={item.label} className="flex flex-col items-center gap-2 rounded-2xl border border-brand-100 bg-white px-3 py-4 text-center shadow-sm">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-800">
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">{item.label}</p>
                      <p className="text-[11px] text-red-950/50">{item.sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Details */}
            <div className="lg:sticky lg:top-24 lg:self-start space-y-5">
              <div>
                {category?.name ? (
                  <span className="rounded-full bg-brand-50 border border-brand-100 px-3 py-1 text-xs font-bold uppercase tracking-widest text-brand-800">
                    {category.name}
                  </span>
                ) : null}
                <h1 className="mt-3 text-3xl font-bold leading-tight tracking-tight text-slate-900">
                  {product.name}
                </h1>
              </div>

              {/* Price block */}
              <div className="rounded-2xl border border-brand-100 bg-white p-5 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-widest text-brand-700">Ár</p>
                <p className="mt-1 text-4xl font-bold text-brand-900">
                  {Number(product.price).toLocaleString("hu-HU")} Ft
                  <span className="ml-2 text-sm font-normal text-red-950/40">(bruttó)</span>
                </p>

                <div className="mt-4 flex items-center gap-2">
                  <svg className="h-4 w-4 shrink-0 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d={inStock
                      ? "M5 13l4 4L19 7"
                      : "M6 18L18 6M6 6l12 12"
                    }/>
                  </svg>
                  <span className={`text-sm font-semibold ${
                    product.stock <= 0
                      ? "text-rose-600"
                      : product.stock < 5
                        ? "text-amber-700"
                        : "text-emerald-700"
                  }`}>
                    {getPublicStockLabel(product.stock)}
                  </span>
                </div>
              </div>

              {/* Qty + Add to cart */}
              <div className="rounded-2xl border border-brand-100 bg-white p-5 shadow-sm space-y-4">
                <div>
                  <p className="mb-2 text-xs font-bold uppercase tracking-widest text-brand-700">Mennyiség</p>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setQty((q) => Math.max(1, q - 1))}
                      disabled={!inStock}
                      className="flex h-10 w-10 items-center justify-center rounded-xl border border-brand-200 bg-white text-lg font-bold text-brand-900 transition hover:bg-brand-50 disabled:opacity-40"
                    >
                      −
                    </button>
                    <span className="w-10 text-center text-xl font-bold text-slate-900">{qty}</span>
                    <button
                      onClick={() => setQty((q) => Math.min(product.stock, q + 1))}
                      disabled={!inStock || qty >= product.stock}
                      className="flex h-10 w-10 items-center justify-center rounded-xl border border-brand-200 bg-white text-lg font-bold text-brand-900 transition hover:bg-brand-50 disabled:opacity-40"
                    >
                      +
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleAddToCart}
                  disabled={!inStock}
                  className={`btn-press w-full rounded-2xl px-6 py-4 text-base font-bold text-white shadow-md transition ${
                    added
                      ? "bg-emerald-500 shadow-emerald-200"
                      : "bg-brand-900 shadow-brand-200 hover:bg-brand-800"
                  } disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none`}
                >
                  {added ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      Hozzáadva a kosárhoz!
                    </span>
                  ) : inStock ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="9" cy="20" r="1"/><circle cx="17" cy="20" r="1"/>
                        <path d="M3 4h2l2.4 11.2a2 2 0 002 1.6h7.6a2 2 0 002-1.6L21 7H7"/>
                      </svg>
                      Kosárba helyezés
                    </span>
                  ) : "Átmenetileg nem elérhető"}
                </button>

                {inStock ? (
                  <div className="flex items-center justify-between border-t border-brand-50 pt-3">
                    <p className="text-sm font-semibold text-red-950/60">Összesen:</p>
                    <p className="text-xl font-bold text-brand-900">
                      {total.toLocaleString("hu-HU")} Ft
                    </p>
                  </div>
                ) : null}
              </div>

              {/* Description */}
              {product.description ? (
                <div className="rounded-2xl border border-brand-100 bg-white p-5 shadow-sm">
                  <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-brand-700">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Leírás
                  </h2>
                  <p className="whitespace-pre-line text-sm leading-relaxed text-red-950/70">
                    {product.description}
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}
