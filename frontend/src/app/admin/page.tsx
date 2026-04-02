"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/supabase";

type Order = Database["public"]["Tables"]["orders"]["Row"];
type Product = Database["public"]["Tables"]["products"]["Row"];
type Category = Database["public"]["Tables"]["categories"]["Row"];

const statusConfig: Record<string, { label: string; color: string }> = {
  pending:    { label: "Függőben",    color: "bg-amber-50 text-amber-700 border-amber-200" },
  processing: { label: "Feldolgozás", color: "bg-blue-50 text-blue-700 border-blue-200" },
  shipped:    { label: "Elküldve",    color: "bg-brand-50 text-sky-700 border-brand-200" },
  delivered:  { label: "Kézbesítve",  color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  paid:       { label: "Fizetve",     color: "bg-green-50 text-green-700 border-green-200" },
  fulfilled:  { label: "Teljesítve",  color: "bg-brand-50 text-brand-900 border-brand-200" },
  cancelled:  { label: "Lemondva",    color: "bg-rose-50 text-rose-700 border-rose-200" },
  refunded:   { label: "Visszatérítve", color: "bg-purple-50 text-purple-700 border-purple-200" },
};

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [statsRange, setStatsRange] = useState<"today" | "7d" | "30d">("7d");
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceLoading, setMaintenanceLoading] = useState(false);

  useEffect(() => {
    void Promise.all([
      supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(100),
      supabase.from("products").select("*"),
      supabase.from("categories").select("*"),
      supabase.from("app_settings").select("value").eq("key", "maintenance_mode").maybeSingle(),
    ]).then(([ordersResult, productsResult, categoriesResult, settingsResult]) => {
      setOrders(ordersResult.data ?? []);
      setProducts(productsResult.data ?? []);
      setCategories(categoriesResult.data ?? []);
      setMaintenanceMode(settingsResult.data?.value === true);
      setLoading(false);
    });
  }, []);

  async function toggleMaintenance() {
    setMaintenanceLoading(true);
    const newValue = !maintenanceMode;
    const { error } = await supabase
      .from("app_settings")
      .upsert({ key: "maintenance_mode", value: newValue as unknown as Database["public"]["Tables"]["app_settings"]["Insert"]["value"] });
    if (!error) setMaintenanceMode(newValue);
    setMaintenanceLoading(false);
  }

  const stats = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const rangeStart =
      statsRange === "today"
        ? startOfToday
        : statsRange === "7d"
          ? now.getTime() - 7 * 24 * 60 * 60 * 1000
          : now.getTime() - 30 * 24 * 60 * 60 * 1000;

    const inRange = orders.filter((o) => new Date(o.created_at).getTime() >= rangeStart);
    return {
      ordersCount: inRange.length,
      pendingCount: inRange.filter((o) => o.status === "pending").length,
      revenue: inRange.reduce((s, o) => s + Number(o.total), 0),
    };
  }, [orders, statsRange]);

  const dashboardCards = [
    {
      label: "Termékek kezelése",
      desc: "Termékek hozzáadása, szerkesztése és törlése a webshopban.",
      href: "/admin/products",
      icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4",
    },
    {
      label: "Rendelések",
      desc: "Beérkezett rendelések megtekintése és kezelése.",
      href: "/admin/orders",
      icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
    },
    {
      label: "Kategóriák",
      desc: "Termék kategóriák létrehozása és kezelése.",
      href: "/admin/categories",
      icon: "M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z",
    },
    {
      label: "Audit log",
      desc: "Admin műveletek és változások naplója.",
      href: "/admin/actions",
      icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01",
    },
  ];

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-brand-700">Admin</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">Adminisztrációs felület</h1>
          <p className="mt-1 text-sm text-red-950/60">Üdvözöljük, admin!</p>
        </div>

        {/* Karbantartás mód toggle */}
        <div className={`flex items-center gap-4 rounded-2xl border px-5 py-4 shadow-sm transition ${maintenanceMode ? "border-amber-200 bg-amber-50" : "border-brand-100 bg-white"}`}>
          <div>
            <p className="text-sm font-bold text-slate-900">Karbantartás mód</p>
            <p className="text-xs text-red-950/60">
              {maintenanceMode ? "Az oldal karbantartás alatt — látogatók nem láthatják." : "Az oldal normálisan elérhető."}
            </p>
            {maintenanceMode ? (
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Link
                  href="/maintenance/access"
                  className="rounded-md border border-amber-300 bg-white px-2.5 py-1 text-[11px] font-semibold text-amber-800 transition hover:bg-amber-100"
                >
                  Karbantartói nézet bekapcsolása
                </Link>
                <Link
                  href="/?maintenance_preview=0"
                  className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-100"
                >
                  Karbantartói nézet kikapcsolása
                </Link>
              </div>
            ) : null}
          </div>
          <button
            onClick={() => void toggleMaintenance()}
            disabled={maintenanceLoading}
            className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full transition-colors disabled:opacity-60 ${maintenanceMode ? "bg-amber-500" : "bg-slate-200"}`}
          >
            <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform ${maintenanceMode ? "translate-x-6" : "translate-x-1"}`} />
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {dashboardCards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="card-hover group rounded-2xl border border-brand-100 bg-white p-5 shadow-sm transition"
          >
            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-800 group-hover:bg-brand-900 group-hover:text-white transition">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d={card.icon} />
              </svg>
            </div>
            <h2 className="text-base font-bold text-slate-900">{card.label}</h2>
            <p className="mt-1 text-sm text-red-950/60">{card.desc}</p>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between rounded-2xl border border-brand-100 bg-white px-5 py-4 shadow-sm">
            <h2 className="text-sm font-bold text-slate-900">Statisztikák</h2>
            <select
              value={statsRange}
              onChange={(e) => setStatsRange(e.target.value as "today" | "7d" | "30d")}
              className="rounded-lg border border-brand-200 px-3 py-1.5 text-xs font-medium outline-none transition hover:border-brand-400"
            >
              <option value="today">Mai nap</option>
              <option value="7d">Utolsó 7 nap</option>
              <option value="30d">Utolsó 30 nap</option>
            </select>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { label: "Rendelések", value: stats.ordersCount, color: "text-brand-900" },
              { label: "Függőben", value: stats.pendingCount, color: "text-amber-700" },
              { label: "Bevétel", value: `${stats.revenue.toLocaleString("hu-HU")} Ft`, color: "text-emerald-700" },
            ].map(({ label, value, color }) => (
              <div key={label} className="rounded-2xl border border-brand-100 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-widest text-brand-700">{label}</p>
                <p className={`mt-2 text-2xl font-bold ${color}`}>{loading ? "—" : value}</p>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-brand-100 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-brand-50 px-5 py-4">
              <h2 className="text-sm font-bold text-slate-900">Legutóbbi rendelések</h2>
              <Link href="/admin/orders" className="text-xs font-semibold text-brand-800 hover:text-brand-900 transition underline underline-offset-2">
                Összes →
              </Link>
            </div>
            {loading ? (
              <div className="space-y-2 p-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="skeleton h-12 rounded-xl" />
                ))}
              </div>
            ) : orders.length === 0 ? (
              <div className="p-8 text-center text-sm text-red-950/50">Még nincs rendelés.</div>
            ) : (
              <div className="divide-y divide-brand-50">
                {orders.slice(0, 5).map((order) => {
                  const st = statusConfig[order.status] ?? { label: order.status, color: "bg-slate-100 text-slate-600 border-slate-200" };
                  return (
                    <div key={order.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 transition hover:bg-brand-50/30">
                      <div>
                        <p className="font-mono text-xs text-slate-400">#{order.id.slice(0, 8)}…</p>
                        <p className="text-sm font-semibold text-slate-900">
                          {new Date(order.created_at).toLocaleDateString("hu-HU")}
                        </p>
                      </div>
                      <span className={`rounded-full border px-2.5 py-0.5 text-xs font-bold ${st.color}`}>{st.label}</span>
                      <p className="text-sm font-bold text-brand-900">
                        {Number(order.total).toLocaleString("hu-HU")} Ft
                      </p>
                      <Link href={`/admin/orders/${order.id}`} className="btn-press rounded-lg border border-brand-200 px-3 py-1 text-xs font-bold text-brand-900 transition hover:bg-brand-50">
                        Részletek →
                      </Link>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-brand-100 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-sm font-bold text-slate-900">Gyorssegéd</h2>
            <div className="space-y-3 text-sm text-red-950/70">
              <div>
                <p className="font-semibold text-slate-900">Hogyan adjak hozzá új terméket?</p>
                <p className="mt-1 text-xs">Kattintson a "Termékek" menüpontra, majd az "Új termék" gombra.</p>
              </div>
              <div>
                <p className="font-semibold text-slate-900">Hogyan kezeljem a rendeléseket?</p>
                <p className="mt-1 text-xs">A "Rendelések" menüpontban láthatja az összes beérkezett rendelést és módosíthatja azok státuszát.</p>
              </div>
              <div>
                <p className="font-semibold text-slate-900">Hogyan hozzak létre kategóriát?</p>
                <p className="mt-1 text-xs">Kattintson a "Kategóriák" menüpontra, majd az "Új kategória" gombra.</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-brand-100 bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-sm font-bold text-slate-900">Összesítő</h2>
            <div className="space-y-2">
              {[
                { label: "Összes termék", value: products.length, href: "/admin/products" },
                { label: "Aktív termék", value: products.filter((p) => p.is_active).length, href: "/admin/products" },
                { label: "Kategóriák", value: categories.length, href: "/admin/categories" },
                { label: "Összes rendelés", value: orders.length, href: "/admin/orders" },
              ].map(({ label, value, href }) => (
                <Link key={label} href={href} className="flex items-center justify-between rounded-xl border border-brand-50 bg-brand-50/30 px-4 py-2.5 transition hover:bg-brand-100/40">
                  <span className="text-xs font-semibold text-red-950/70">{label}</span>
                  <span className="text-base font-bold text-brand-900">{loading ? "—" : value}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
