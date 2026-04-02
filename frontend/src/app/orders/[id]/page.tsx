"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/supabase";

type Order = Database["public"]["Tables"]["orders"]["Row"];
type OrderItem = Database["public"]["Tables"]["order_items"]["Row"];

const statusConfig: Record<string, { label: string; color: string }> = {
  pending:    { label: "Függőben",      color: "bg-amber-50 text-amber-700 border-amber-200" },
  processing: { label: "Feldolgozás",   color: "bg-blue-50 text-blue-700 border-blue-200" },
  shipped:    { label: "Elküldve",      color: "bg-brand-50 text-sky-700 border-brand-200" },
  delivered:  { label: "Kézbesítve",    color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  paid:       { label: "Fizetve",       color: "bg-green-50 text-green-700 border-green-200" },
  fulfilled:  { label: "Teljesítve",    color: "bg-brand-50 text-brand-900 border-brand-200" },
  cancelled:  { label: "Lemondva",      color: "bg-rose-50 text-rose-700 border-rose-200" },
  refunded:   { label: "Visszatérítve", color: "bg-purple-50 text-purple-700 border-purple-200" },
};

const paymentMethodLabel: Record<string, string> = {
  card: "Bankkártyás fizetés",
  transfer: "Banki átutalás",
  cod: "Utánvét",
  simplepay: "Bankkártyás fizetés (SimplePay)",
  manual_transfer: "Banki átutalás",
  manual_cod: "Utánvét",
};

function getPaymentLabel(order: Order, paymentParam: string | null): string {
  const method = (order as unknown as { payment_method?: string | null }).payment_method;
  if (method && paymentMethodLabel[method]) return paymentMethodLabel[method];
  if (order.payment_provider && paymentMethodLabel[order.payment_provider]) {
    return paymentMethodLabel[order.payment_provider];
  }
  if (paymentParam && paymentMethodLabel[paymentParam]) return paymentMethodLabel[paymentParam];
  return method ?? order.payment_provider ?? "—";
}

export default function OrderDetailsPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const orderId = params.id;
  const paymentParam = searchParams.get("payment");
  const isNewOrder = Boolean(paymentParam);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);

  useEffect(() => {
    void supabase.auth.getSession().then(async ({ data, error: sessionError }) => {
      if (sessionError || !data.session?.user) {
        setError("A rendelés megtekintéséhez be kell jelentkezned.");
        setLoading(false);
        return;
      }

      const { data: orderRow, error: orderError } = await supabase
        .from("orders").select("*").eq("id", orderId).maybeSingle();

      if (orderError || !orderRow) {
        setError(orderError?.message ?? "A rendelés nem található.");
        setLoading(false);
        return;
      }

      if (orderRow.user_id !== data.session.user.id) {
        setError("Ehhez a rendeléshez nincs jogosultságod.");
        setLoading(false);
        return;
      }

      const { data: orderItems, error: itemsError } = await supabase
        .from("order_items").select("*").eq("order_id", orderId).order("created_at", { ascending: true });

      if (itemsError) { setError(itemsError.message); setLoading(false); return; }

      setOrder(orderRow);
      setItems(orderItems ?? []);
      setLoading(false);
    });
  }, [orderId]);

  const st = order ? (statusConfig[order.status] ?? { label: order.status, color: "bg-slate-100 text-slate-600 border-slate-200" }) : null;

  return (
    <div className="min-h-screen bg-[#fdf8f8] text-slate-900">
      <header className="sticky top-0 z-20 border-b border-brand-100/80 bg-white/80 shadow-sm backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link
            href="/orders"
            className="inline-flex items-center gap-2 rounded-xl border border-brand-200 bg-white px-4 py-2 text-sm font-semibold text-red-950 shadow-sm transition hover:bg-brand-50"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
            </svg>
            Rendeléseim
          </Link>
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-brand-900 to-brand-700 shadow-sm" />
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-900">HPVHelp Webshop</p>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-6 py-10">
        {loading ? (
          <div className="space-y-4">
            <div className="skeleton h-32 rounded-2xl" />
            <div className="skeleton h-64 rounded-2xl" />
          </div>
        ) : null}

        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">{error}</div>
        ) : null}

        {!loading && !error && order ? (
          <div className="space-y-6">
            {/* Visszaigazoló banner ha checkout utáni redirect */}
            {isNewOrder ? (
              <div className="flex items-start gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-6 py-5 shadow-sm">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-white">
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="font-bold text-emerald-900">Rendelés sikeresen leadva!</p>
                  <p className="mt-0.5 text-sm text-emerald-700">
                    {paymentParam === "transfer"
                      ? "Kérjük utald át a végösszeget a megadott bankszámlára. A rendelési számot tüntesd fel közleménynek."
                      : paymentParam === "cod"
                        ? "A fizetés a futárnak történik a kézbesítéskor. Hamarosan felvesszük veled a kapcsolatot."
                        : "Köszönjük a rendelésed! Hamarosan felvesszük veled a kapcsolatot."}
                  </p>
                </div>
              </div>
            ) : null}

            <div className="grid gap-6 lg:grid-cols-3">
              {/* Left: Order info + items */}
              <div className="lg:col-span-2 space-y-5">
                {/* Order header */}
                <div className="rounded-2xl border border-brand-100 bg-white p-6 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest text-brand-700">Rendelés</p>
                      <h1 className="mt-1 text-2xl font-bold text-slate-900">Rendelés részletei</h1>
                      <p className="mt-1 font-mono text-xs text-slate-400">#{order.id}</p>
                    </div>
                    {st ? (
                      <span className={`rounded-full border px-3 py-1.5 text-sm font-bold ${st.color}`}>
                        {st.label}
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <div>
                      <p className="text-xs font-semibold text-red-950/50">Dátum</p>
                      <p className="mt-0.5 text-sm font-semibold text-slate-900">
                        {new Date(order.created_at).toLocaleDateString("hu-HU", { year: "numeric", month: "long", day: "numeric" })}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-red-950/50">Fizetési mód</p>
                      <p className="mt-0.5 text-sm font-semibold text-slate-900">
                        {getPaymentLabel(order, paymentParam)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-red-950/50">Végösszeg</p>
                      <p className="mt-0.5 text-base font-bold text-brand-900">
                        {Number(order.total).toLocaleString("hu-HU")} {order.currency}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Items */}
                <div className="rounded-2xl border border-brand-100 bg-white p-6 shadow-sm">
                  <h2 className="mb-4 text-base font-bold text-slate-900">Rendelt tételek</h2>
                  {items.length === 0 ? (
                    <p className="text-sm text-red-950/50">Nincs tétel ebben a rendelésben.</p>
                  ) : (
                    <div className="space-y-3">
                      {items.map((item) => (
                        <div
                          key={item.id}
                          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand-100 bg-brand-50/30 px-4 py-3"
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 shrink-0 rounded-lg bg-gradient-to-br from-brand-50 to-brand-100 border border-brand-100" />
                            <div>
                              <p className="text-sm font-semibold text-slate-900">{item.product_name}</p>
                              <p className="text-xs text-red-950/50">{item.quantity} × {Number(item.unit_price).toLocaleString("hu-HU")} Ft</p>
                            </div>
                          </div>
                          <p className="text-sm font-bold text-brand-900">
                            {Number(item.line_total).toLocaleString("hu-HU")} Ft
                          </p>
                        </div>
                      ))}

                      <div className="flex items-center justify-between border-t border-brand-100 pt-3">
                        <p className="text-sm font-semibold text-red-950/60">Végösszeg</p>
                        <p className="text-base font-bold text-brand-900">
                          {Number(order.total).toLocaleString("hu-HU")} {order.currency}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right: Shipping */}
              <div className="space-y-5">
                <div className="rounded-2xl border border-brand-100 bg-white p-6 shadow-sm">
                  <h2 className="mb-4 text-base font-bold text-slate-900">Szállítási adatok</h2>
                  <div className="space-y-3 text-sm">
                    {[
                      { label: "Név", value: order.shipping_name },
                      { label: "E-mail", value: order.shipping_email },
                      { label: "Telefon", value: order.shipping_phone },
                      { label: "Cím", value: order.shipping_address },
                    ].map(({ label, value }) => value ? (
                      <div key={label}>
                        <p className="text-xs font-semibold text-red-950/50">{label}</p>
                        <p className="mt-0.5 text-slate-900">{value}</p>
                      </div>
                    ) : null)}
                    {order.notes ? (
                      <div>
                        <p className="text-xs font-semibold text-red-950/50">Megjegyzés</p>
                        <p className="mt-0.5 text-slate-900">{order.notes}</p>
                      </div>
                    ) : null}
                  </div>
                </div>

                {/* Transfer info */}
                {(order.payment_method === "transfer" || paymentParam === "transfer") ? (
                  <div className="rounded-2xl border border-brand-100 bg-brand-50/60 p-5 text-sm">
                    <p className="mb-2 font-bold text-slate-900">Banki átutalás adatok</p>
                    <p className="text-red-950/70">Kedvezményezett: <span className="font-semibold text-slate-900">Sunmed Kft.</span></p>
                    <p className="mt-1 font-mono text-xs text-red-950/70">Számlaszám: <span className="font-semibold">10918001-00000124-71950001</span></p>
                    <p className="mt-1 text-red-950/70">Közlemény: <span className="font-semibold text-slate-900">#{order.id.slice(0, 8)}</span></p>
                  </div>
                ) : null}

                <div className="flex flex-col gap-2">
                  <Link
                    href="/"
                    className="btn-press flex items-center justify-center gap-2 rounded-xl bg-brand-900 px-4 py-2.5 text-sm font-bold text-white shadow-sm shadow-brand-200 transition hover:bg-brand-800"
                  >
                    Vissza a webshopba
                  </Link>
                  <Link
                    href="/orders"
                    className="flex items-center justify-center gap-2 rounded-xl border border-brand-200 px-4 py-2.5 text-sm font-semibold text-brand-900 transition hover:bg-brand-50"
                  >
                    Összes rendelésem
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}
