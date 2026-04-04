"use client";
/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useRouter } from "next/navigation";
import Footer from "@/components/Footer";
import { useEffect, useMemo, useState } from "react";
import { addToCart } from "@/lib/cart";
import { useCart } from "@/hooks/useCart";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/supabase";

type Product = Database["public"]["Tables"]["products"]["Row"];
type Category = Database["public"]["Tables"]["categories"]["Row"];

function getPublicStockLabel(stock: number) {
  if (stock <= 0) return "Elfogyott";
  if (stock < 5) return "Utolsó darabok";
  return "Raktáron";
}

export default function Home() {
  const router = useRouter();
  const { totalItems } = useCart();

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState<"newest" | "price_asc" | "price_desc" | "name_asc">("newest");

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [authLoading, setAuthLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    let isMounted = true;
    const resolveName = (session: { user?: { user_metadata?: { full_name?: string }; email?: string } } | null) => {
      const n = session?.user?.user_metadata?.full_name?.trim();
      if (n) return n;
      return session?.user?.email?.split("@")[0]?.trim() || "Felhasználó";
    };
    void supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) return;
      setIsAuthenticated(Boolean(data.session?.user));
      setDisplayName(data.session?.user ? resolveName(data.session) : "");
      setAuthLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!isMounted) return;
      setIsAuthenticated(Boolean(session?.user));
      setDisplayName(session?.user ? resolveName(session) : "");
      setAuthLoading(false);
    });
    return () => { isMounted = false; subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    void Promise.all([
      supabase.from("products").select("*").eq("is_active", true).order("created_at", { ascending: false }),
      supabase.from("categories").select("*").eq("is_active", true).order("name", { ascending: true }),
    ]).then(([pr, cr]) => {
      if (pr.error || cr.error) {
        setError(pr.error?.message ?? cr.error?.message ?? "Hiba történt a betöltésekor.");
      } else {
        setProducts(pr.data ?? []);
        setCategories(cr.data ?? []);
      }
      setLoading(false);
    });
  }, []);

  const categoriesById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    products.forEach((p) => { if (p.category_id) counts.set(p.category_id, (counts.get(p.category_id) ?? 0) + 1); });
    return counts;
  }, [products]);

  const filteredAndSorted = useMemo(() => {
    const kw = search.trim().toLowerCase();
    let list = selectedCategory === "all" ? [...products] : products.filter((p) => p.category_id === selectedCategory);
    if (kw) {
      list = list.filter((p) => {
        const cat = p.category_id ? categoriesById.get(p.category_id)?.name ?? "" : "";
        return p.name.toLowerCase().includes(kw) || (p.description ?? "").toLowerCase().includes(kw) || cat.toLowerCase().includes(kw);
      });
    }
    if (sortBy === "price_asc") list.sort((a, b) => Number(a.price) - Number(b.price));
    else if (sortBy === "price_desc") list.sort((a, b) => Number(b.price) - Number(a.price));
    else if (sortBy === "name_asc") list.sort((a, b) => a.name.localeCompare(b.name, "hu"));
    else list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return list;
  }, [products, categories, search, selectedCategory, sortBy, categoriesById]);

  return (
    <div className="min-h-screen bg-[#fdf8f8] text-slate-900">
      {/* Info sáv */}
      <div className="bg-brand-900 text-red-50">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-center gap-x-6 gap-y-2 px-6 py-2 text-xs font-medium">
          <span className="inline-flex items-center gap-1.5">
            <svg className="h-3.5 w-3.5 text-red-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Budapest, Hungary
          </span>
          <span className="hidden h-3.5 w-px bg-red-200/40 sm:block" />
          <span className="inline-flex items-center gap-1.5">
            <svg className="h-3.5 w-3.5 text-red-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <a href="mailto:info@hpvhelp.hu" className="transition hover:text-white">info@hpvhelp.hu</a>
          </span>
          <span className="hidden h-3.5 w-px bg-red-200/40 sm:block" />
          <span className="inline-flex items-center gap-1.5">
            <svg className="h-3.5 w-3.5 text-red-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="9" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 7v5l3 2" />
            </svg>
            H-P: 9:00-17:00
          </span>
        </div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-brand-100/80 bg-white/90 shadow-sm backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-brand-900 to-brand-700 shadow-md shadow-brand-200" />
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-brand-900">HPVHelp Webshop</p>
              <p className="text-xs text-red-950/60">Professzionális bőrápolás egy helyen</p>
            </div>
          </div>
          <nav className="flex items-center gap-2">
            <Link href="/cart" aria-label="Kosár" className="btn-press relative rounded-lg border border-brand-200 p-2.5 text-red-950 transition hover:bg-brand-50">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <circle cx="9" cy="20" r="1" /><circle cx="17" cy="20" r="1" />
                <path d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.6a2 2 0 0 0 2-1.6L21 7H7" />
              </svg>
              {totalItems > 0 ? (
                <span className="absolute -right-2 -top-2 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-brand-900 px-1.5 text-[10px] font-bold leading-none text-white shadow-sm shadow-brand-300">
                  {totalItems > 99 ? "99+" : totalItems}
                </span>
              ) : null}
            </Link>
            {authLoading ? (
              <div className="h-9 w-28 rounded-lg border border-brand-100 bg-white p-2">
                <div className="skeleton h-full w-full rounded-md" />
              </div>
            ) : isAuthenticated ? (
              <Link href="/dashboard" className="inline-flex items-center gap-2 rounded-lg border border-brand-200 bg-white px-3 py-2 text-sm font-medium text-red-950 shadow-sm transition hover:bg-brand-50">
                <svg className="h-4 w-4 text-brand-800" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21a8 8 0 0 0-16 0" /><circle cx="12" cy="7" r="4" />
                </svg>
                <span className="max-w-[180px] truncate">Üdvözöljük, {displayName}</span>
              </Link>
            ) : (
              <Link href="/login" className="btn-press rounded-lg bg-brand-900 px-4 py-2 text-sm font-medium text-white shadow-sm shadow-brand-300 transition hover:bg-brand-800">
                Bejelentkezés
              </Link>
            )}
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-6 py-10">
        {/* Page title row */}
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4 animate-fade-up">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-brand-700">Webshop</p>
            <h1 className="mt-1 font-serif text-3xl font-bold italic tracking-tight text-brand-900 md:text-4xl">
              Termékkínálat
            </h1>
            <p className="mt-1 text-sm text-red-950/60">
              Minden aktív termék egy helyen — szűrhető és rendezhető.
            </p>
          </div>
          <span className="rounded-full border border-brand-200 bg-white px-3 py-1 text-xs font-semibold text-brand-900 shadow-sm">
            {filteredAndSorted.length} termék
          </span>
        </div>

        <div className="grid gap-6 md:grid-cols-[240px_1fr]">
          {/* Sidebar: category filter */}
          <aside className="animate-fade-up rounded-2xl border border-brand-100 bg-white p-4 shadow-sm md:sticky md:top-24 md:h-fit">
            <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-brand-700">Kategóriák</h2>
            <div className="space-y-1.5">
              <button
                onClick={() => setSelectedCategory("all")}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm font-semibold transition ${
                  selectedCategory === "all" ? "bg-brand-900 text-white" : "border border-brand-100 text-red-950 hover:bg-brand-50"
                }`}
              >
                <span>Összes termék</span>
                <span className="text-xs font-normal">{products.length}</span>
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm font-semibold transition ${
                    selectedCategory === cat.id ? "bg-brand-900 text-white" : "border border-brand-100 text-red-950 hover:bg-brand-50"
                  }`}
                >
                  <span>{cat.name}</span>
                  <span className="text-xs font-normal">{categoryCounts.get(cat.id) ?? 0}</span>
                </button>
              ))}
            </div>
          </aside>

          {/* Main content */}
          <div className="space-y-5">
            {/* Search + sort */}
            <div className="flex flex-wrap gap-3 rounded-2xl border border-brand-100 bg-white p-4 shadow-sm animate-fade-up">
              <div className="flex flex-1 min-w-48 items-center gap-2 rounded-xl border border-brand-200 bg-[#fdf8f8] px-3 py-2.5 transition focus-within:border-brand-600 focus-within:ring-2 focus-within:ring-brand-200">
                <svg className="h-4 w-4 shrink-0 text-brand-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                </svg>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Keresés termék neve, leírás vagy kategória alapján..."
                  className="w-full bg-transparent text-sm outline-none placeholder:text-red-950/40"
                />
                {search ? (
                  <button onClick={() => setSearch("")} className="text-xs text-brand-700 hover:text-brand-900 transition">Törlés</button>
                ) : null}
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="rounded-xl border border-brand-200 bg-[#fdf8f8] px-3 py-2.5 text-sm outline-none transition hover:border-brand-600"
              >
                <option value="newest">Legújabb elöl</option>
                <option value="price_asc">Ár szerint növekvő</option>
                <option value="price_desc">Ár szerint csökkenő</option>
                <option value="name_asc">Névsor (A–Z)</option>
              </select>
            </div>

            {/* Skeleton */}
            {loading ? (
              <div className="stagger grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="rounded-2xl border border-brand-100 bg-white p-5 shadow-sm">
                    <div className="skeleton mb-3 h-44 w-full" />
                    <div className="skeleton mb-2 h-3 w-1/3" />
                    <div className="skeleton mb-1 h-5 w-2/3" />
                    <div className="skeleton h-4 w-full" />
                  </div>
                ))}
              </div>
            ) : null}

            {error ? <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</div> : null}

            {/* Product grid */}
            {!loading && !error ? (
              <div className="stagger grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {filteredAndSorted.map((product) => (
                  <article
                    key={product.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => router.push(`/shop/${product.slug}`)}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); router.push(`/shop/${product.slug}`); } }}
                    className="card-hover animate-fade-up group cursor-pointer overflow-hidden rounded-2xl border border-brand-100 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-200"
                  >
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.name} className="h-44 w-full object-cover transition duration-300 group-hover:scale-105" />
                    ) : (
                      <div className="h-44 w-full bg-gradient-to-br from-brand-50 to-brand-100 transition duration-300 group-hover:from-brand-100 group-hover:to-brand-200" />
                    )}
                    <div className="p-5">
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <p className="text-xs font-semibold uppercase tracking-widest text-brand-700">
                          {product.category_id ? categoriesById.get(product.category_id)?.name ?? "" : ""}
                        </p>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                          product.stock <= 0
                            ? "bg-rose-50 text-rose-700"
                            : product.stock < 5
                              ? "bg-amber-50 text-amber-700"
                              : "bg-emerald-50 text-emerald-700"
                        }`}>
                          {getPublicStockLabel(product.stock)}
                        </span>
                      </div>
                      <h2 className="text-base font-bold text-slate-900">{product.name}</h2>
                      <p className="mt-1 line-clamp-2 text-sm text-red-950/60">{product.description ?? "Nincs leírás."}</p>
                      <div className="mt-4">
                        <p className="text-base font-bold text-brand-900">{Number(product.price).toLocaleString("hu-HU")} Ft</p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          addToCart({
                            productId: product.id,
                            slug: product.slug,
                            name: product.name,
                            price: Number(product.price),
                            imageUrl: product.image_url ?? undefined,
                          });
                        }}
                        disabled={product.stock <= 0}
                        className="btn-press mt-3 w-full rounded-xl bg-brand-900 px-3 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-brand-800 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
                      >
                        {product.stock > 0 ? "Kosárba" : "Átmenetileg nem elérhető"}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            ) : null}

            {/* Empty state */}
            {!loading && !error && filteredAndSorted.length === 0 ? (
              <div className="rounded-2xl border border-brand-100 bg-white p-10 text-center shadow-sm">
                <p className="text-base font-semibold text-slate-900">Nincs találat.</p>
                <p className="mt-1 text-sm text-red-950/60">Próbálj más keresési kifejezést vagy kategóriát.</p>
                <button
                  onClick={() => { setSearch(""); setSelectedCategory("all"); setSortBy("newest"); }}
                  className="mt-4 rounded-xl border border-brand-200 px-4 py-2 text-sm font-semibold text-brand-900 transition hover:bg-brand-50"
                >
                  Szűrők visszaállítása
                </button>
              </div>
            ) : null}
          </div>
        </div>

        {/* Benefits */}
        <div className="mt-14 stagger grid gap-4 md:grid-cols-3">
          {[
            { title: "Gyors szállítás", text: "Munkanapokon 24-48 órán belüli feldolgozás és feladás." },
            { title: "Biztonságos rendelés", text: "Átlátható checkout folyamat és megbízható rendeléskezelés." },
            { title: "Szakértői termékválogatás", text: "Olyan termékek, amelyek valódi rutinhoz illeszthetők." },
          ].map((b) => (
            <div key={b.title} className="animate-fade-up rounded-2xl border border-brand-100 bg-white p-6 shadow-sm">
              <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-800">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="font-serif text-base font-bold text-slate-900">{b.title}</h3>
              <p className="mt-1.5 text-sm text-red-950/65">{b.text}</p>
            </div>
          ))}
        </div>

        {/* CTA sáv */}
        <section className="mt-8 overflow-hidden rounded-3xl bg-gradient-to-br from-brand-900 via-brand-800 to-brand-700 p-8 text-white shadow-lg md:p-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold tracking-wide text-red-200">VAN MÁR FIÓKOD?</p>
              <h2 className="mt-1 font-serif text-2xl font-bold tracking-tight italic md:text-3xl">
                Lépj be, és kezdd el a vásárlást.
              </h2>
              <p className="mt-2 max-w-xl text-sm text-red-100/80">A rendeléseidet bármikor visszanézheted.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/cart" className="btn-press rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-brand-900 shadow-sm transition hover:bg-brand-50">
                Tovább a kosárhoz
              </Link>
              <Link href="/orders" className="btn-press rounded-xl border border-white/30 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10">
                Rendeléseim
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
