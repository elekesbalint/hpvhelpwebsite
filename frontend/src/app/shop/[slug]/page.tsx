"use client";
/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { getSampleTargetLabel, type SampleTarget } from "@/lib/checkout-config";
import { addToCart, getCartQuantityForProduct } from "@/lib/cart";
import PublicSiteHeader from "@/components/PublicSiteHeader";
import { useCart } from "@/hooks/useCart";
import { getProductPricing } from "@/lib/pricing";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/supabase";

type Product = Database["public"]["Tables"]["products"]["Row"];
type Category = Database["public"]["Tables"]["categories"]["Row"];

function getPublicStockLabel(stock: number) {
  if (stock <= 0) return "Elfogyott";
  if (stock < 5) return "Utolsó darabok";
  return "Raktáron";
}

function isHtmlDescription(text: string): boolean {
  return /<\s*[a-z][^>]*>/i.test(text.trim());
}

import { INTRO_VIDEO_URL } from "@/lib/company-contact";

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
  const [sampleTarget, setSampleTarget] = useState<SampleTarget>("female");
  const { items: cartItems } = useCart();

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

  const pricing = product ? getProductPricing(product, category) : null;
  const effectivePrice = pricing?.effectivePrice ?? (product ? Number(product.price) : 0);
  const isSam1 = Boolean(category?.slug?.startsWith("sam1") || category?.name?.toLowerCase().includes("sam1"));
  const inStock = (product?.stock ?? 0) > 0;
  const cartQtyForProduct = product ? getCartQuantityForProduct(cartItems, product.id) : 0;
  const availableToAdd = product ? Math.max(0, product.stock - cartQtyForProduct) : 0;

  useEffect(() => {
    if (availableToAdd <= 0) {
      setQty(1);
      return;
    }
    setQty((q) => Math.min(q, availableToAdd));
  }, [availableToAdd]);

  function handleAddToCart() {
    if (!product || product.stock <= 0 || availableToAdd <= 0) return;
    if (isSam1 && !sampleTarget) return;
    const result = addToCart(
      {
        productId: product.id,
        slug: product.slug,
        name: product.name,
        price: effectivePrice,
        sampleTarget: isSam1 ? sampleTarget : undefined,
        imageUrl: product.image_url ?? undefined,
        maxStock: product.stock,
      },
      qty,
      product.stock
    );
    if (result.added <= 0) {
      window.alert(`Maximum ${product.stock} db rendelhető ebből a termékből.`);
      return;
    }
    if (result.limitedByStock) {
      window.alert(`Csak ${result.added} db került a kosárba (készlet: ${product.stock} db).`);
    }
    setAdded(true);
    setTimeout(() => setAdded(false), 2500);
  }

  const total = effectivePrice * qty;
  const effectiveVatRate = product ? (product.vat_rate ?? category?.vat_rate ?? null) : null;
  const vatContent = product && effectiveVatRate != null
    ? (effectivePrice * effectiveVatRate) / (100 + effectiveVatRate)
    : null;

  return (
    <div className="min-h-screen bg-[#fdf8f8] text-slate-900">
      <PublicSiteHeader />

      <div className="mx-auto max-w-6xl px-6 pt-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-brand-800 transition hover:text-brand-950"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Vissza a termékekhez
        </Link>
      </div>

      <main className="mx-auto w-full max-w-6xl px-6 py-8">
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
                <div className="flex items-center gap-2">
                  <p className="text-xs font-bold uppercase tracking-widest text-brand-700">Ár</p>
                  {pricing?.discountLabel ? (
                    <span className="rounded-full bg-rose-600 px-2 py-0.5 text-xs font-bold text-white">
                      {pricing.discountLabel}
                    </span>
                  ) : null}
                </div>
                <div className="mt-1 flex flex-wrap items-end gap-3">
                  <p className="text-4xl font-bold text-brand-900">
                    {effectivePrice.toLocaleString("hu-HU")} Ft
                    <span className="ml-2 text-sm font-normal text-red-950/40">(bruttó)</span>
                  </p>
                  {pricing?.hasDiscount ? (
                    <p className="text-lg font-semibold text-red-950/40 line-through">
                      {pricing.originalPrice.toLocaleString("hu-HU")} Ft
                    </p>
                  ) : null}
                </div>
                {effectiveVatRate != null ? (
                  <p className="mt-2 text-sm text-red-950/70">
                    ÁFA: {effectiveVatRate}% | Adótartalom: {vatContent?.toLocaleString("hu-HU", { maximumFractionDigits: 0 })} Ft
                  </p>
                ) : null}

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
                {isSam1 ? (
                  <div>
                    <p className="mb-2 text-xs font-bold uppercase tracking-widest text-brand-700">Mintavételi csomag *</p>
                    <div className="grid grid-cols-2 gap-2">
                      {([
                        { id: "female" as const, label: getSampleTargetLabel("female") },
                        { id: "male" as const, label: getSampleTargetLabel("male") },
                      ]).map((option) => (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => setSampleTarget(option.id)}
                          className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                            sampleTarget === option.id
                              ? "border-brand-700 bg-brand-50 text-brand-900"
                              : "border-brand-200 bg-white text-slate-700 hover:bg-brand-50"
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
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
                      onClick={() => setQty((q) => Math.min(availableToAdd, q + 1))}
                      disabled={!inStock || availableToAdd <= 0 || qty >= availableToAdd}
                      className="flex h-10 w-10 items-center justify-center rounded-xl border border-brand-200 bg-white text-lg font-bold text-brand-900 transition hover:bg-brand-50 disabled:opacity-40"
                    >
                      +
                    </button>
                  </div>
                  {cartQtyForProduct > 0 && availableToAdd > 0 ? (
                    <p className="mt-1 text-xs text-red-950/55">
                      A kosárban már {cartQtyForProduct} db van · még {availableToAdd} adható hozzá
                    </p>
                  ) : null}
                  {availableToAdd <= 0 && inStock ? (
                    <p className="mt-1 text-xs text-amber-700">A maximális készlet már a kosárban van.</p>
                  ) : null}
                </div>

                <button
                  onClick={handleAddToCart}
                  disabled={!inStock || availableToAdd <= 0}
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
                  {isHtmlDescription(product.description) ? (
                    <div
                      className="prose prose-sm max-w-none
                        prose-p:text-red-950/70 prose-p:leading-relaxed prose-p:my-1.5
                        prose-li:text-red-950/70 prose-li:my-0.5
                        prose-strong:font-bold prose-strong:text-inherit
                        prose-h2:text-base prose-h2:font-bold prose-h2:mt-4 prose-h2:mb-1
                        prose-h3:text-sm prose-h3:font-bold prose-h3:mt-3 prose-h3:mb-1
                        prose-ul:my-2 prose-ol:my-2
                        prose-a:text-brand-700 prose-a:underline hover:prose-a:text-brand-900
                        [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5"
                      dangerouslySetInnerHTML={{ __html: product.description.trim() }}
                    />
                  ) : (
                    <p className="whitespace-pre-line text-sm leading-relaxed text-red-950/70">
                      {product.description}
                    </p>
                  )}
                </div>
              ) : null}

              <div className="pt-1">
                <a
                  href={INTRO_VIDEO_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-brand-200 bg-brand-900 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-brand-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700 sm:w-auto sm:justify-start"
                >
                  <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m15 10 4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Bemutatkozó videó
                </a>
              </div>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}
