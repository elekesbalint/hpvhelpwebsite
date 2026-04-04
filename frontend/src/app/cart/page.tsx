"use client";
/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { setCartItems } from "@/lib/cart";
import { useCart } from "@/hooks/useCart";
import { supabase } from "@/lib/supabase";

export default function CartPage() {
  const router = useRouter();
  const { items, subtotal, updateCartQuantity, removeFromCart } = useCart();

  useEffect(() => {
    const missing = items.filter((i) => i.imageUrl === undefined);
    if (missing.length === 0) return;
    const ids = missing.map((i) => i.productId);
    let cancelled = false;
    void (async () => {
      const { data } = await supabase.from("products").select("id, image_url").in("id", ids);
      if (cancelled || !data) return;
      const byId = new Map(data.map((p) => [p.id, p.image_url as string | null]));
      const updated = items.map((i) => {
        if (i.imageUrl !== undefined) return i;
        if (!byId.has(i.productId)) return { ...i, imageUrl: "" };
        return { ...i, imageUrl: byId.get(i.productId) ?? "" };
      });
      const changed = updated.some((u, idx) => u.imageUrl !== items[idx].imageUrl);
      if (changed) setCartItems(updated);
    })();
    return () => {
      cancelled = true;
    };
  }, [items]);

  const shipping = 0;
  const total = subtotal + shipping;

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
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-brand-900 to-brand-700 shadow-sm" />
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-900">HPVHelp Webshop</p>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-6 py-10">
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-700">Rendelés</p>
          <h1 className="mt-1 text-3xl font-bold text-slate-900">
            Kosár {items.length > 0 ? <span className="text-brand-800">({items.length})</span> : null}
          </h1>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-brand-100 bg-white py-20 text-center shadow-sm">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
              <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="9" cy="20" r="1"/><circle cx="17" cy="20" r="1"/>
                <path d="M3 4h2l2.4 11.2a2 2 0 002 1.6h7.6a2 2 0 002-1.6L21 7H7"/>
              </svg>
            </div>
            <p className="text-lg font-bold text-slate-900">A kosarad üres</p>
            <p className="mt-1 text-sm text-red-950/60">Adj hozzá termékeket a webshopból.</p>
            <Link
              href="/"
              className="btn-press mt-6 inline-block rounded-xl bg-brand-900 px-6 py-2.5 text-sm font-bold text-white shadow-sm shadow-brand-200 transition hover:bg-brand-800"
            >
              Termékek böngészése
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Cart items */}
            <div className="lg:col-span-2 space-y-3">
              {items.map((item) => (
                <div
                  key={item.productId}
                  className="flex flex-wrap items-center gap-4 rounded-2xl border border-brand-100 bg-white p-4 shadow-sm transition hover:border-brand-200"
                >
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-brand-100 bg-gradient-to-br from-brand-50 to-brand-100">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
                    ) : null}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="truncate font-bold text-slate-900">{item.name}</p>
                    <p className="text-sm font-semibold text-brand-800">
                      {Number(item.price).toLocaleString("hu-HU")} Ft / db
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center overflow-hidden rounded-xl border border-brand-200 bg-white">
                      <button
                        onClick={() => updateCartQuantity(item.productId, Math.max(1, item.quantity - 1))}
                        className="px-3 py-2 text-sm font-bold text-brand-900 transition hover:bg-brand-50"
                      >−</button>
                      <span className="w-8 text-center text-sm font-bold text-slate-900">{item.quantity}</span>
                      <button
                        onClick={() => updateCartQuantity(item.productId, item.quantity + 1)}
                        className="px-3 py-2 text-sm font-bold text-brand-900 transition hover:bg-brand-50"
                      >+</button>
                    </div>

                    <p className="w-24 text-right text-base font-bold text-brand-900">
                      {(item.price * item.quantity).toLocaleString("hu-HU")} Ft
                    </p>


                    <button
                      onClick={() => removeFromCart(item.productId)}
                      className="rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-500"
                    >
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="lg:sticky lg:top-24 lg:self-start rounded-2xl border border-brand-100 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-base font-bold text-slate-900">Rendelés összegzése</h2>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-red-950/60">Részösszeg</span>
                  <span className="font-semibold">{subtotal.toLocaleString("hu-HU")} Ft</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-red-950/60">Szállítás</span>
                  <span className="font-semibold text-emerald-600">{shipping === 0 ? "Ingyenes" : `${Number(shipping).toLocaleString("hu-HU")} Ft`}</span>
                </div>
              </div>

              <div className="my-4 border-t border-brand-100" />

              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-900">Végösszeg</span>
                <span className="text-xl font-bold text-brand-900">{total.toLocaleString("hu-HU")} Ft</span>
              </div>

              <button
                onClick={() => router.push("/checkout")}
                disabled={items.length === 0}
                className="btn-press mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-900 px-4 py-3.5 text-sm font-bold text-white shadow-md shadow-brand-200 transition hover:bg-brand-800 disabled:opacity-50"
              >
                Tovább a fizetéshez
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
                </svg>
              </button>

              <p className="mt-3 text-center text-xs text-red-950/40">
                Biztonságos fizetés · SSL titkosítás
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
