"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/supabase";

type Order = Database["public"]["Tables"]["orders"]["Row"];

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

export default function OrdersPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    void supabase.auth.getSession().then(async ({ data, error: sessionError }) => {
      if (sessionError || !data.session?.user) {
        setError("A rendelések megtekintéséhez be kell jelentkezned.");
        setLoading(false);
        return;
      }

      const { data: orderRows, error: orderError } = await supabase
        .from("orders")
        .select("*")
        .eq("user_id", data.session.user.id)
        .order("created_at", { ascending: false });

      if (orderError) setError(orderError.message);
      else setOrders(orderRows ?? []);
      setLoading(false);
    });
  }, []);

  return (
    <div className="min-h-screen bg-[#fdf8f8] text-slate-900">
      <header className="sticky top-0 z-20 border-b border-brand-100/80 bg-white/80 shadow-sm backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-xl border border-brand-200 bg-white px-4 py-2 text-sm font-semibold text-red-950 shadow-sm transition hover:bg-brand-50"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
            </svg>
            Vissza a fiókhoz
          </Link>
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-brand-900 to-brand-700 shadow-sm" />
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-900">HPVHelp Webshop</p>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-6 py-10">
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-700">Fiókom</p>
          <h1 className="mt-1 text-3xl font-bold text-slate-900">Rendeléseim</h1>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="skeleton h-20 rounded-2xl" />
            ))}
          </div>
        ) : null}

        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">{error}</div>
        ) : null}

        {!loading && !error ? (
          orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-3xl border border-brand-100 bg-white py-20 text-center shadow-sm">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
                <svg className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                </svg>
              </div>
              <p className="text-lg font-bold text-slate-900">Még nincs rendelésed</p>
              <p className="mt-1 text-sm text-red-950/60">Böngészd a webshopot és add fel az első rendelésed!</p>
              <Link
                href="/"
                className="btn-press mt-6 inline-block rounded-xl bg-brand-900 px-6 py-2.5 text-sm font-bold text-white shadow-sm shadow-brand-200 transition hover:bg-brand-800"
              >
                Webshop megnyitása
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => {
                const st = statusConfig[order.status] ?? { label: order.status, color: "bg-slate-100 text-slate-600 border-slate-200" };
                return (
                  <div
                    key={order.id}
                    className="flex flex-wrap items-center gap-4 rounded-2xl border border-brand-100 bg-white p-5 shadow-sm transition hover:border-brand-200"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-800">
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2"/>
                      </svg>
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-xs text-slate-400">#{order.id.slice(0, 8)}…</p>
                      <p className="mt-0.5 text-sm font-semibold text-slate-900">
                        {new Date(order.created_at).toLocaleDateString("hu-HU", { year: "numeric", month: "long", day: "numeric" })}
                      </p>
                    </div>

                    <span className={`rounded-full border px-3 py-1 text-xs font-bold ${st.color}`}>
                      {st.label}
                    </span>

                    <p className="text-base font-bold text-brand-900">
                      {Number(order.total).toLocaleString("hu-HU")} {order.currency}
                    </p>

                    <Link
                      href={`/orders/${order.id}`}
                      className="btn-press rounded-xl border border-brand-200 bg-white px-4 py-2 text-xs font-bold text-brand-900 shadow-sm transition hover:bg-brand-50"
                    >
                      Részletek →
                    </Link>
                  </div>
                );
              })}
            </div>
          )
        ) : null}
      </main>
    </div>
  );
}
