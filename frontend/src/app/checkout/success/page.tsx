"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { formatOrderPublicId } from "@/lib/order-display-id";
import { supabase } from "@/lib/supabase";
import SiteLogo from "@/components/SiteLogo";
import { BANK_DETAILS } from "@/lib/bank-details";
import type { Database } from "@/types/supabase";

type Order = Database["public"]["Tables"]["orders"]["Row"];
type OrderItem = Database["public"]["Tables"]["order_items"]["Row"];

const paymentMethodLabel: Record<string, string> = {
  card: "Bankkártyás fizetés (SimplePay)",
  transfer: "Banki átutalás",
};

function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const payment = searchParams.get("payment") ?? "card";

  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) { setLoading(false); return; }
    void Promise.all([
      supabase.from("orders").select("*").eq("id", orderId).maybeSingle(),
      supabase.from("order_items").select("*").eq("order_id", orderId).order("created_at", { ascending: true }),
    ]).then(([orderResult, itemsResult]) => {
      setOrder(orderResult.data ?? null);
      setItems(itemsResult.data ?? []);
      setLoading(false);
    });
  }, [orderId]);

  const publicOrderId = orderId ? formatOrderPublicId(orderId) : "—";

  return (
    <div className="min-h-screen bg-[#fdf8f8] text-slate-900">
      <header className="border-b border-brand-100/80 bg-white/80 shadow-sm backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <Link href="/" className="inline-flex shrink-0 items-center outline-none ring-brand-600/30 transition hover:opacity-90 focus-visible:ring-2">
            <SiteLogo withLink={false} size="md" />
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-6 py-12">
        {loading ? (
          <div className="space-y-4">
            <div className="skeleton mx-auto h-24 w-24 rounded-full" />
            <div className="skeleton mx-auto h-8 w-64 rounded-xl" />
            <div className="skeleton h-48 w-full rounded-2xl" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Hero */}
            <div className="text-center">
              <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500 shadow-lg shadow-emerald-200">
                <svg className="h-10 w-10 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-slate-900">Rendelés sikeresen leadva!</h1>
              <p className="mt-2 text-red-950/60">
                Rendelését sikeresen fogadtuk. Köszönjük vásárlását!
              </p>
            </div>

            {/* Order details card */}
            <div className="rounded-2xl border border-brand-100 bg-white p-6 shadow-sm">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-base font-bold text-slate-900">Rendelés részletei</h2>
                <span className="rounded-full border border-brand-200 bg-brand-50 px-3 py-1 font-mono text-xs font-bold text-brand-900">
                  {publicOrderId}
                </span>
              </div>

              <p className="mb-4 text-sm text-red-950/60">
                A rendelés részleteit elküldtük emailben. Hamarosan felvesszük Önnel a kapcsolatot a további teendőkkel kapcsolatban.
              </p>

              {/* Fontos tudnivalók */}
              <div className="rounded-xl border border-amber-100 bg-amber-50 p-4">
                <p className="mb-2 text-sm font-bold text-amber-900">Fontos tudnivalók</p>
                <ul className="space-y-1.5 text-sm text-amber-800">
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 text-amber-500">•</span>
                    Rendelését a következő munkanapon kezdjük el feldolgozni.
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 text-amber-500">•</span>
                    A kiszállítás előtt emailben értesítjük.
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 text-amber-500">•</span>
                    Kérdés esetén hivatkozzon a rendelésszámra: <span className="font-bold">{publicOrderId}</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Payment-specific info */}
            {payment === "transfer" ? (
              <div className="rounded-2xl border border-brand-100 bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-base font-bold text-slate-900">Banki átutalás adatok</h2>
                <div className="rounded-xl border border-brand-100 bg-brand-50/30 p-4 text-sm space-y-2">
                  <p className="text-red-950/70">Kedvezményezett: <span className="font-semibold text-slate-900">{BANK_DETAILS.name}</span></p>
                  <p className="font-mono text-red-950/70">Számlaszám (Ft): <span className="font-semibold text-slate-900">{BANK_DETAILS.forint.accountNumber}</span></p>
                  <p className="font-mono text-red-950/70">Számlaszám (EUR): <span className="font-semibold text-slate-900">{BANK_DETAILS.euro.accountNumber}</span></p>
                  <p className="text-red-950/70">Bank (EUR): <span className="font-semibold text-slate-900">{BANK_DETAILS.euro.bank}</span></p>
                  <p className="font-mono text-red-950/70">BIC: <span className="font-semibold text-slate-900">{BANK_DETAILS.euro.bic}</span></p>
                  <p className="font-mono text-red-950/70">IBAN: <span className="font-semibold text-slate-900">{BANK_DETAILS.euro.iban}</span></p>
                  <p className="text-red-950/70">Közlemény: <span className="font-semibold text-slate-900">{publicOrderId}</span></p>
                  <p className="mt-2 text-xs text-red-950/50">Az összeg beérkezése után kezdjük el a rendelés feldolgozását.</p>
                </div>
              </div>
            ) : null}

            {/* Order items summary */}
            {order && items.length > 0 ? (
              <div className="rounded-2xl border border-brand-100 bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-base font-bold text-slate-900">Rendelt tételek</h2>
                <div className="space-y-3">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between gap-3 rounded-xl border border-brand-50 bg-brand-50/30 px-4 py-3 text-sm">
                      <div>
                        <p className="font-semibold text-slate-900">{item.product_name}</p>
                        <p className="text-xs text-red-950/50">{item.quantity} × {Number(item.unit_price).toLocaleString("hu-HU")} Ft</p>
                      </div>
                      <p className="font-bold text-brand-900">{Number(item.line_total).toLocaleString("hu-HU")} Ft</p>
                    </div>
                  ))}
                  <div className="flex items-center justify-between border-t border-brand-100 pt-3">
                    <p className="text-sm font-bold text-slate-900">Végösszeg</p>
                    <p className="text-lg font-bold text-brand-900">
                      {Number(order.total).toLocaleString("hu-HU")} {order.currency}
                    </p>
                  </div>
                </div>
              </div>
            ) : null}

            {/* Buttons */}
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/"
                className="btn-press flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand-900 px-5 py-3 text-sm font-bold text-white shadow-sm shadow-brand-200 transition hover:bg-brand-800"
              >
                Vissza a webshopba
              </Link>
              {orderId ? (
                <Link
                  href={`/orders/${orderId}`}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-brand-200 bg-white px-5 py-3 text-sm font-semibold text-brand-900 shadow-sm transition hover:bg-brand-50"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2"/>
                  </svg>
                  Rendelés részletei
                </Link>
              ) : null}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#fdf8f8] px-6 py-12 text-slate-900">
          <div className="mx-auto max-w-3xl space-y-4">
            <div className="skeleton mx-auto h-24 w-24 rounded-full" />
            <div className="skeleton mx-auto h-8 w-64 rounded-xl" />
            <div className="skeleton h-48 w-full rounded-2xl" />
          </div>
        </div>
      }
    >
      <CheckoutSuccessContent />
    </Suspense>
  );
}
