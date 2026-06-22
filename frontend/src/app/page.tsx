"use client";
/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Footer from "@/components/Footer";
import PartnersMarquee from "@/components/PartnersMarquee";
import PublicSiteHeader from "@/components/PublicSiteHeader";
import SamBrandLogo from "@/components/SamBrandLogo";
import { PARTNER_LOGOS } from "@/data/partner-logos";
import { Suspense, useEffect, useMemo, useState } from "react";
import { addToCart } from "@/lib/cart";
import { sortCategoriesForDisplay } from "@/lib/category-sort";
import {
  flattenCategoriesForSelect,
  getCategoryBreadcrumb,
  isSamCategory,
  productMatchesCategoryFilter,
} from "@/lib/categories";
import { getProductPricing } from "@/lib/pricing";
import { buildCategoryFilterUrl, buildProductSearchUrl, CATEGORY_SLUGS, readCategoryFilterSlug, readProductSearchQuery } from "@/lib/product-search-url";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/supabase";

type Product = Database["public"]["Tables"]["products"]["Row"];
type Category = Database["public"]["Tables"]["categories"]["Row"];

/** Első választás után elrejti a nagy kategória-blokkot; vissza: „Kategória bemutató”. */
const HOME_CHOOSER_STORAGE_KEY = "hpvhelp-home-chooser-dismissed";

function stockBadge(stock: number) {
  if (stock <= 0) return { label: "Elfogyott", cls: "bg-rose-100 text-rose-700" };
  if (stock < 5) return { label: "Utolsó darabok", cls: "bg-amber-100 text-amber-700" };
  return { label: "Raktáron", cls: "bg-emerald-100 text-emerald-700" };
}

function HomePage() {
  const router = useRouter();
  const urlSearchParams = useSearchParams();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState<"newest" | "price_asc" | "price_desc" | "name_asc">("newest");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [homeChooserDismissed, setHomeChooserDismissed] = useState(false);

  useEffect(() => {
    try {
      if (typeof window !== "undefined" && localStorage.getItem(HOME_CHOOSER_STORAGE_KEY) === "1") {
        setHomeChooserDismissed(true);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    const categorySlug = readCategoryFilterSlug(urlSearchParams);
    const query = readProductSearchQuery(urlSearchParams);

    if (categorySlug) {
      if (categories.length === 0) return;
      const cat = categories.find((c) => c.slug === categorySlug);
      setSelectedCategory(cat?.id ?? "all");
      setSearch(query);
    } else {
      setSelectedCategory("all");
      setSearch(query);
    }

    const hasFilter = categorySlug || query;
    if (!hasFilter) return;
    try {
      if (localStorage.getItem(HOME_CHOOSER_STORAGE_KEY) !== "1") {
        localStorage.setItem(HOME_CHOOSER_STORAGE_KEY, "1");
        setHomeChooserDismissed(true);
      }
    } catch {
      /* ignore */
    }
  }, [urlSearchParams, categories]);

  useEffect(() => {
    const hasFilter =
      readCategoryFilterSlug(urlSearchParams) ||
      readProductSearchQuery(urlSearchParams);
    if (!hasFilter || loading) return;
    const t = window.setTimeout(() => {
      document.getElementById("termekek")?.scrollIntoView({ behavior: "smooth" });
    }, 150);
    return () => window.clearTimeout(t);
  }, [urlSearchParams, loading]);

  function dismissHomeChooser() {
    try {
      localStorage.setItem(HOME_CHOOSER_STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
    setHomeChooserDismissed(true);
  }

  function showHomeChooserAgain() {
    try {
      localStorage.removeItem(HOME_CHOOSER_STORAGE_KEY);
    } catch {
      /* ignore */
    }
    setHomeChooserDismissed(false);
    setTimeout(() => {
      document.getElementById("kategoria-valaszto")?.scrollIntoView({ behavior: "smooth" });
    }, 80);
  }

  function scrollToTermekek() {
    document.getElementById("termekek")?.scrollIntoView({ behavior: "smooth" });
  }

  function goToWebshop() {
    dismissHomeChooser();
    scrollToTermekek();
  }

  function filterWebshop(query: string) {
    dismissHomeChooser();
    setSelectedCategory("all");
    setSortBy("newest");
    setSearch(query);
    router.push(buildProductSearchUrl(query), { scroll: false });
    scrollToTermekek();
  }

  function filterWebshopByCategory(slug: string, keyword?: string) {
    dismissHomeChooser();
    setSortBy("newest");
    const cat = categories.find((c) => c.slug === slug);
    setSelectedCategory(cat?.id ?? "all");
    setSearch(keyword?.trim() ?? "");
    router.push(buildCategoryFilterUrl(slug, keyword), { scroll: false });
    scrollToTermekek();
  }

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
  const sortedCategories = useMemo(() => sortCategoriesForDisplay(categories), [categories]);
  const categorySelectOptions = useMemo(() => flattenCategoriesForSelect(categories), [categories]);
  const activeCategory = selectedCategory !== "all" ? categoriesById.get(selectedCategory) : undefined;

  const filteredAndSorted = useMemo(() => {
    const kw = search.trim().toLowerCase();
    let list =
      selectedCategory === "all"
        ? [...products]
        : products.filter((p) => productMatchesCategoryFilter(p.category_id, selectedCategory, categories));
    if (kw) {
      list = list.filter((p) => {
        const cat = p.category_id ? getCategoryBreadcrumb(categoriesById.get(p.category_id), categoriesById) : "";
        return p.name.toLowerCase().includes(kw) || (p.description ?? "").toLowerCase().includes(kw) || cat.toLowerCase().includes(kw);
      });
    }
    if (sortBy === "price_asc") list.sort((a, b) => Number(a.price) - Number(b.price));
    else if (sortBy === "price_desc") list.sort((a, b) => Number(b.price) - Number(a.price));
    else if (sortBy === "name_asc") list.sort((a, b) => a.name.localeCompare(b.name, "hu"));
    else list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return list;
  }, [products, categories, search, selectedCategory, sortBy, categoriesById]);

  const inStockCount = useMemo(() => filteredAndSorted.filter((p) => p.stock > 0).length, [filteredAndSorted]);

  return (
    <div className="min-h-screen w-full min-w-0 overflow-x-clip bg-[#fdf8f8] text-slate-900">
      <PublicSiteHeader />

      {/* ── Hero (Sobi-stílus) ── */}
      <section className="relative w-full min-h-[min(50vh,420px)] overflow-hidden sm:min-h-[min(52vh,460px)]">
        <picture className="absolute inset-0">
          <source
            type="image/webp"
            srcSet="/branding/hero-home.webp 1920w, /branding/hero-home-2x.webp 2560w"
            sizes="100vw"
          />
          <source
            type="image/jpeg"
            srcSet="/branding/hero-home.jpg 1920w, /branding/hero-home-2x.jpg 2560w"
            sizes="100vw"
          />
          <img
            src="/branding/hero-home.jpg"
            alt=""
            width={1920}
            height={1080}
            className="h-full w-full object-cover object-[center_30%]"
            fetchPriority="high"
            decoding="async"
          />
        </picture>
        <div
          className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-black/10"
          aria-hidden="true"
        />
        <div className="relative mx-auto flex min-h-[min(50vh,420px)] w-full max-w-[1480px] items-end px-4 pb-10 pt-16 sm:min-h-[min(52vh,460px)] sm:px-6 sm:pb-12 md:items-center md:pb-14">
          <div className="max-w-2xl animate-fade-up">
            <h1 className="font-sans text-[1.75rem] font-bold leading-[1.12] tracking-tight text-white sm:text-4xl md:text-5xl lg:text-[3.25rem]">
              Együtt a HPV ellen
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/90 sm:text-base md:text-lg">
              Tegyen lépéseket saját maga és mások védelme érdekében.
            </p>
            <button
              type="button"
              onClick={goToWebshop}
              className="btn-press group mt-8 inline-flex items-center gap-3 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-600 shadow-lg transition group-hover:bg-brand-500">
                <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </span>
              <span className="text-sm font-bold uppercase tracking-[0.2em] text-white transition group-hover:text-white/90">
                Webshop
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* ── Főoldal – Kategória választó (első választás után rejtve; vissza: gyors sáv „Kategória bemutató”) ── */}
      {!homeChooserDismissed ? (
      <section id="kategoria-valaszto" className="border-b border-brand-100 bg-gradient-to-b from-white to-[#fdf8f8]">
        <div className="mx-auto w-full min-w-0 max-w-[1480px] px-4 py-10 sm:px-6 md:py-16">
          <div className="mb-10 text-center animate-fade-up">
            <p className="text-xs font-bold uppercase tracking-widest text-brand-700">Szűrőtesztek – HPVhelp Webshop</p>
            <h1 className="mt-2 font-serif text-3xl font-bold italic text-brand-900 md:text-4xl">
              Miben segíthetünk?
            </h1>
            <p className="mt-3 text-sm text-red-950/60">Válassza ki az Önnek megfelelő kategóriát</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 animate-fade-up">

            {/* SAM1 – Vizsgálatok */}
            <div className="group relative overflow-hidden rounded-3xl border border-brand-200 bg-white p-5 shadow-sm transition hover:shadow-md sm:p-8">
              <SamBrandLogo className="mb-4" width={180} />
              <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-xs font-bold uppercase tracking-widest text-brand-700">
                SAM1
              </div>
              <h2 className="mt-3 font-serif text-2xl font-bold italic text-brand-900">
                Vizsgálatok & Tesztek
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-red-950/60">
                HPV, STI és Mikrobiom PCR alapú önmintavételes szűrővizsgálatok otthon elvégezhető mintavételi készlettel.
              </p>
              <ul className="mt-4 space-y-1.5 text-xs text-red-950/60">
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-brand-700 shrink-0" />
                  Humán PapillomaVírus (HPV) PCR vizsgálat
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-brand-700 shrink-0" />
                  Szexuálisan Terjedő Fertőzések (STI) PCR vizsgálat
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-brand-700 shrink-0" />
                  Mikrobiom PCR alapú vizsgálat
                </li>
              </ul>
              <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
                <button
                  type="button"
                  onClick={() => filterWebshop("nő")}
                  className="btn-press flex flex-col items-center gap-1.5 rounded-2xl border border-brand-200 bg-brand-50/60 px-3 py-4 text-center transition hover:bg-brand-100 hover:border-brand-400"
                >
                  <svg className="h-7 w-7 text-brand-800" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <circle cx="12" cy="5" r="3"/>
                    <path strokeLinecap="round" d="M12 8v13M9 18h6"/>
                    <path strokeLinecap="round" d="M9 13c0 2 1.3 3 3 3s3-1 3-3"/>
                  </svg>
                  <span className="text-xs font-bold leading-snug text-brand-900">Öntesztek Nőknek</span>
                  <span className="text-[10px] text-red-950/50">Tesztek & szolgáltatások</span>
                </button>
                <button
                  type="button"
                  onClick={() => filterWebshop("férfi")}
                  className="btn-press flex flex-col items-center gap-1.5 rounded-2xl border border-brand-200 bg-brand-50/60 px-3 py-4 text-center transition hover:bg-brand-100 hover:border-brand-400"
                >
                  <svg className="h-7 w-7 text-brand-800" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <circle cx="10" cy="14" r="3"/>
                    <path strokeLinecap="round" d="M14 10l4-4M14 6h4v4"/>
                  </svg>
                  <span className="text-xs font-bold text-brand-900">Férfiaknak</span>
                  <span className="text-[10px] text-red-950/50">Tesztek & szolgáltatások</span>
                </button>
                <button
                  type="button"
                  onClick={() => filterWebshopByCategory(CATEGORY_SLUGS.samNoiOntesztek)}
                  className="btn-press flex flex-col items-center gap-1.5 rounded-2xl border border-brand-300 bg-brand-100/80 px-3 py-4 text-center transition hover:bg-brand-100 hover:border-brand-500"
                >
                  <svg className="h-7 w-7 text-brand-800" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" d="M12 4v16M4 12h16"/>
                  </svg>
                  <span className="text-xs font-bold leading-snug text-brand-900">Női és férfi szűrőtesztek</span>
                  <span className="text-[10px] text-red-950/50">Közös kínálat</span>
                </button>
                <button
                  type="button"
                  onClick={() => filterWebshopByCategory(CATEGORY_SLUGS.egyeb, "PCR")}
                  className="btn-press flex flex-col items-center gap-1.5 rounded-2xl border border-brand-200 bg-white px-3 py-4 text-center transition hover:bg-brand-50 hover:border-brand-400"
                >
                  <svg className="h-7 w-7 text-brand-800" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714a2.25 2.25 0 00.659 1.591L19 14.5M14.25 3.104c.251.023.501.05.75.082M19 14.5l-2.47 2.47a2.25 2.25 0 01-1.59.659H9.06a2.25 2.25 0 01-1.591-.659L5 14.5m14 0V18a2 2 0 01-2 2H7a2 2 0 01-2-2v-3.5" />
                  </svg>
                  <span className="text-xs font-bold leading-snug text-brand-900">Egyéb DNS alapú vizsgálatok</span>
                  <span className="text-[10px] text-red-950/50">STI, mikrobiom stb.</span>
                </button>
              </div>
            </div>

            {/* SAM2 – Étrendkiegészítők */}
            <div className="group relative overflow-hidden rounded-3xl border border-brand-200 bg-white p-5 shadow-sm transition hover:shadow-md sm:p-8">
              <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-rose-50 px-3 py-1 text-xs font-bold uppercase tracking-widest text-rose-700">
                SAM2
              </div>
              <h2 className="mt-3 font-serif text-2xl font-bold italic text-brand-900">
                Étrendkiegészítők
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-red-950/60">
                Sexual Activity Medicine – terápiás étrend-kiegészítő készítmények HPV és STI érintetteknek.
              </p>
              <ul className="mt-4 space-y-1.5 text-xs text-red-950/60">
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-rose-500 shrink-0" />
                  HPV specifikus étrend-kiegészítők
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-rose-500 shrink-0" />
                  Immunerősítő és szupportív készítmények
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-rose-500 shrink-0" />
                  Páciensek által egyszerre több fajta is rendelhető
                </li>
              </ul>
              <div className="mt-6">
                <button
                  type="button"
                  onClick={() => filterWebshopByCategory(CATEGORY_SLUGS.sammKezelesek)}
                  className="btn-press w-full rounded-2xl bg-gradient-to-r from-rose-700 to-brand-900 px-6 py-4 text-sm font-bold text-white shadow-sm transition hover:from-rose-600 hover:to-brand-800"
                >
                  Termékek megtekintése →
                </button>
              </div>
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-red-950/40">
            Egy rendelésbe SAM1 és SAM2 termékek egyaránt kerülhetnek.
          </p>
        </div>
      </section>
      ) : null}

      <main id="termekek" className="mx-auto w-full min-w-0 max-w-[1480px] px-4 py-8 sm:px-6 sm:py-10">
        {homeChooserDismissed ? (
          <div className="mb-8 animate-fade-up rounded-2xl border border-brand-200 bg-white p-4 shadow-sm md:flex md:items-stretch md:justify-between md:gap-6">
            <div className="min-w-0 md:max-w-md">
              <p className="text-xs font-bold uppercase tracking-widest text-brand-700">Gyors választás</p>
              <p className="mt-1 text-sm text-red-950/60">
                Női, férfi és közös szűrőtesztek, étrend-kiegészítők és egyéb DNS alapú vizsgálatok. A teljes listánál használd a keresést vagy a kategória szűrőt lent.
              </p>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2 md:mt-0 md:justify-end">
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory("all"); setSortBy("newest"); setSearch("nő");
                  scrollToTermekek();
                }}
                className="btn-press rounded-xl border border-brand-200 bg-brand-50 px-3 py-2 text-xs font-bold text-brand-900 transition hover:bg-brand-100"
              >
                Öntesztek Nőknek
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory("all"); setSortBy("newest"); setSearch("férfi");
                  scrollToTermekek();
                }}
                className="btn-press rounded-xl border border-brand-200 bg-brand-50 px-3 py-2 text-xs font-bold text-brand-900 transition hover:bg-brand-100"
              >
                Férfiaknak
              </button>
              <button
                type="button"
                onClick={() => filterWebshopByCategory(CATEGORY_SLUGS.samNoiOntesztek)}
                className="btn-press rounded-xl border border-brand-300 bg-brand-100 px-3 py-2 text-xs font-bold text-brand-900 transition hover:bg-brand-50"
              >
                Női és férfi szűrőtesztek
              </button>
              <button
                type="button"
                onClick={() => filterWebshopByCategory(CATEGORY_SLUGS.sammKezelesek)}
                className="btn-press rounded-xl bg-gradient-to-r from-rose-700 to-brand-900 px-3 py-2 text-xs font-bold text-white shadow-sm transition hover:from-rose-600 hover:to-brand-800"
              >
                Étrendkiegészítők
              </button>
              <button
                type="button"
                onClick={() => filterWebshopByCategory(CATEGORY_SLUGS.egyeb, "PCR")}
                className="btn-press rounded-xl border border-brand-200 bg-white px-3 py-2 text-xs font-bold text-brand-900 transition hover:bg-brand-50"
              >
                Egyéb DNS alapú vizsgálatok
              </button>
              <button
                type="button"
                onClick={showHomeChooserAgain}
                className="btn-press rounded-xl border border-dashed border-brand-300 bg-white px-3 py-2 text-xs font-semibold text-brand-800 transition hover:bg-brand-50"
              >
                Kategória bemutató
              </button>
            </div>
          </div>
        ) : null}

        {/* Page title */}
        <div className="mb-8 animate-fade-up">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-700">Termékkínálat</p>
          {activeCategory && isSamCategory(activeCategory, categoriesById) ? (
            <div className="mt-3 mb-2">
              <SamBrandLogo width={220} />
            </div>
          ) : null}
          {activeCategory ? (
            <>
              <h1 className="mt-1 font-serif text-4xl font-bold italic tracking-tight text-brand-900 md:text-5xl">
                {getCategoryBreadcrumb(activeCategory, categoriesById)}
              </h1>
              {activeCategory.subtitle ? (
                <p className="mt-2 max-w-3xl text-sm leading-relaxed text-red-950/60 md:text-base">
                  {activeCategory.subtitle}
                </p>
              ) : null}
            </>
          ) : (
            <h1 className="mt-1 font-serif text-4xl font-bold italic tracking-tight text-brand-900 md:text-5xl">
              Összes termék
            </h1>
          )}
        </div>

        {/* Filter bar */}
        <div className="mb-5 flex flex-wrap items-center gap-3 animate-fade-up">
          {/* Search */}
          <div className="flex flex-1 min-w-56 items-center gap-2 rounded-2xl border border-brand-200 bg-white px-4 py-3 shadow-sm transition focus-within:border-brand-600 focus-within:ring-2 focus-within:ring-brand-100">
            <svg className="h-4 w-4 shrink-0 text-brand-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Keresés..."
              className="w-full bg-transparent text-sm outline-none placeholder:text-red-950/40"
            />
            {search ? (
              <button onClick={() => setSearch("")} className="text-xs text-brand-700 hover:text-brand-900 transition">✕</button>
            ) : null}
          </div>

          {/* Category filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="rounded-2xl border border-brand-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 shadow-sm outline-none transition hover:border-brand-500 cursor-pointer"
          >
            <option value="all">Összes kategória</option>
            {categorySelectOptions.map((opt) => (
              <option key={opt.id} value={opt.id}>{opt.label}</option>
            ))}
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="rounded-2xl border border-brand-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 shadow-sm outline-none transition hover:border-brand-500 cursor-pointer"
          >
            <option value="newest">Legújabb</option>
            <option value="price_asc">Ár: alacsony → magas</option>
            <option value="price_desc">Ár: magas → alacsony</option>
            <option value="name_asc">Névsor (A–Z)</option>
          </select>

          {/* Count */}
          <p className="ml-auto text-sm text-red-950/60">
            <span className="font-bold text-slate-900">{filteredAndSorted.length}</span> termék
            {inStockCount < filteredAndSorted.length ? (
              <span className="ml-1 text-emerald-700">({inStockCount} készleten)</span>
            ) : null}
          </p>
        </div>

        {/* Skeleton */}
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

        {/* Product grid */}
        {!loading && !error ? (
          <div className="stagger grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredAndSorted.map((product) => {
              const badge = stockBadge(product.stock);
              const category = product.category_id ? categoriesById.get(product.category_id) : undefined;
              const pricing = getProductPricing(product, category);
              const catName = product.category_id ? getCategoryBreadcrumb(categoriesById.get(product.category_id), categoriesById) : "";
              return (
                <article
                  key={product.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => router.push(`/shop/${product.slug}`)}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); router.push(`/shop/${product.slug}`); } }}
                  className="card-hover animate-fade-up group cursor-pointer overflow-hidden rounded-2xl border border-brand-100 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-200 flex flex-col"
                >
                  {/* Image */}
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

                    {/* Discount badge */}
                    {pricing.hasDiscount ? (
                      <span className="absolute right-3 top-3 rounded-full bg-rose-600 px-2.5 py-1 text-xs font-bold text-white shadow">
                        {pricing.discountLabel}
                      </span>
                    ) : null}

                    {/* Stock badge */}
                    <span className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-xs font-semibold shadow-sm ${badge.cls}`}>
                      {badge.label}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="flex flex-1 flex-col p-4">
                    {catName ? (
                      <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-brand-700">{catName}</p>
                    ) : null}
                    <h2 className="text-lg font-bold leading-snug text-slate-900 group-hover:text-brand-900 transition-colors">
                      {product.name}
                    </h2>
                    {product.description ? (
                      <p className="mt-1 line-clamp-2 text-xs text-red-950/55">
                        {product.description.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()}
                      </p>
                    ) : null}

                    <div className="mt-auto pt-4">
                      {pricing.hasDiscount ? (
                        <p className="text-xs text-red-950/45 line-through">
                          {pricing.originalPrice.toLocaleString("hu-HU")} Ft
                        </p>
                      ) : null}
                      <p className={`text-xl font-bold ${pricing.hasDiscount ? "text-rose-600" : "text-brand-900"}`}>
                        {pricing.effectivePrice.toLocaleString("hu-HU")} Ft
                      </p>

                      <button
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

        {/* Empty state */}
        {!loading && !error && filteredAndSorted.length === 0 ? (
          <div className="rounded-2xl border border-brand-100 bg-white p-14 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50">
              <svg className="h-6 w-6 text-brand-700" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
            </div>
            <p className="text-base font-bold text-slate-900">Nincs találat.</p>
            <p className="mt-1 text-sm text-red-950/60">Próbálj más keresési kifejezést vagy kategóriát.</p>
            <button
              onClick={() => { setSearch(""); setSelectedCategory("all"); setSortBy("newest"); }}
              className="mt-5 rounded-xl border border-brand-200 px-5 py-2.5 text-sm font-semibold text-brand-900 transition hover:bg-brand-50"
            >
              Szűrők visszaállítása
            </button>
          </div>
        ) : null}

        {/* Benefits */}
        <div className="mt-16 stagger grid gap-4 md:grid-cols-3">
          {(
            [
              {
                icon: "M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4",
                title: "Gyors szállítás",
                text: "1 munkanapon belüli feldolgozás és szállítás. Házhozszállításon kívül a megrendelt termék kérhető csomagautomatába vagy átvételi pontra is.",
                carriers: [
                  { src: "/shipping/magyar-posta.png", alt: "MPL – Magyar Posta" },
                  { src: "/shipping/gls.png", alt: "GLS" },
                ] as const,
              },
              {
                icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
                title: "Biztonságos rendelés",
                text: "Diszkrét csomagolás.",
              },
              {
                icon: "M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z",
                title: "Szakértői termékválogatás",
                text: "Ezek a termékek mind az Ön egészségét szolgálják.",
              },
            ] as const
          ).map((b) => (
            <div key={b.title} className="animate-fade-up rounded-2xl border border-brand-100 bg-white p-6 shadow-sm">
              <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-50">
                <svg className="h-5 w-5 text-brand-800" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d={b.icon} />
                </svg>
              </div>
              <h3 className="font-serif text-base font-bold text-slate-900">{b.title}</h3>
              <p className="mt-1.5 text-sm text-red-950/65">{b.text}</p>
              {"carriers" in b && b.carriers ? (
                <div
                  className="mt-4 flex items-stretch justify-center gap-2 sm:gap-3"
                  role="group"
                  aria-label="Szállítási partnerek"
                >
                  {b.carriers.map((c) => (
                    <div
                      key={c.src}
                      className="flex min-h-[3.25rem] flex-1 items-center justify-center rounded-xl border border-brand-100 bg-gradient-to-b from-white to-brand-50/30 px-3 py-2.5 shadow-sm"
                    >
                      <img
                        src={c.src}
                        alt={c.alt}
                        className="max-h-8 w-full max-w-[5.5rem] object-contain object-center"
                        loading="lazy"
                        decoding="async"
                      />
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          ))}
        </div>

        <PartnersMarquee logos={PARTNER_LOGOS} />

        {/* CTA sáv */}
        <section className="mt-8 overflow-hidden rounded-3xl bg-gradient-to-br from-brand-900 via-brand-800 to-brand-700 p-8 text-white shadow-lg md:p-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold tracking-wide text-red-200">VAN MÁR FIÓKJA?</p>
              <h2 className="mt-1 font-serif text-2xl font-bold tracking-tight italic md:text-3xl">
                Lépjen be, és kezdje el a vásárlást.
              </h2>
              <p className="mt-2 max-w-xl text-sm text-red-100/80">A rendeléseit bármikor visszanézheti.</p>
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

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#fdf8f8]">
          <PublicSiteHeader />
          <main className="mx-auto max-w-[1480px] px-6 py-16">
            <div className="skeleton h-10 w-48 rounded-xl" />
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="skeleton h-72 rounded-2xl" />
              ))}
            </div>
          </main>
        </div>
      }
    >
      <HomePage />
    </Suspense>
  );
}
