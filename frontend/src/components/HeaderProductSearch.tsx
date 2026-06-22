"use client";
/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { buildProductSearchUrl, readProductSearchQuery } from "@/lib/product-search-url";
import { filterProductsByQuery } from "@/lib/filter-products";
import { getProductPricing } from "@/lib/pricing";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/supabase";

const LIVE_SEARCH_MS = 200;
const DROPDOWN_RESULT_LIMIT = 8;

type Product = Database["public"]["Tables"]["products"]["Row"];
type Category = Database["public"]["Tables"]["categories"]["Row"];

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function HeaderSearchToggleButton({
  open,
  onClick,
  className = "",
}: {
  open: boolean;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={open}
      aria-label={open ? "Keresés bezárása" : "Termék keresése"}
      className={`btn-press inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-brand-200 bg-white text-brand-800 shadow-sm transition hover:bg-brand-50 md:h-11 md:w-11 ${className}`.trim()}
    >
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <circle cx="11" cy="11" r="8" />
        <path strokeLinecap="round" d="m21 21-4.35-4.35" />
      </svg>
    </button>
  );
}

export default function HeaderProductSearch({ open, onOpenChange }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const urlSearchParams = useSearchParams();
  const inputId = useId();
  const listboxId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const skipLiveNavRef = useRef(false);
  const catalogLoadedRef = useRef(false);

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);

  const categoriesById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  const matches = useMemo(
    () => filterProductsByQuery(products, categoriesById, query),
    [products, categoriesById, query]
  );

  const dropdownMatches = useMemo(() => matches.slice(0, DROPDOWN_RESULT_LIMIT), [matches]);

  const trimmedQuery = query.trim();
  const showResults = trimmedQuery.length > 0;

  useEffect(() => {
    if (!open || catalogLoadedRef.current) return;
    setCatalogLoading(true);
    void Promise.all([
      supabase.from("products").select("*").eq("is_active", true).order("name", { ascending: true }),
      supabase.from("categories").select("*").eq("is_active", true),
    ]).then(([pr, cr]) => {
      if (!pr.error) setProducts(pr.data ?? []);
      if (!cr.error) setCategories(cr.data ?? []);
      catalogLoadedRef.current = true;
      setCatalogLoading(false);
    });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    skipLiveNavRef.current = true;
    setQuery(pathname === "/" ? readProductSearchQuery(urlSearchParams) : "");
    const t = window.setTimeout(() => {
      skipLiveNavRef.current = false;
    }, 0);
    return () => window.clearTimeout(t);
  }, [open, pathname, urlSearchParams]);

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => inputRef.current?.focus(), 50);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(t);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onOpenChange]);

  const navigateSearch = useCallback(
    (value: string) => {
      const url = buildProductSearchUrl(value);
      if (pathname === "/") {
        router.replace(url, { scroll: false });
      } else if (value.trim()) {
        router.push(url);
      }
    },
    [pathname, router]
  );

  useEffect(() => {
    if (!open || skipLiveNavRef.current) return;
    const t = window.setTimeout(() => navigateSearch(query), LIVE_SEARCH_MS);
    return () => window.clearTimeout(t);
  }, [query, open, navigateSearch]);

  const scrollToProducts = useCallback(() => {
    onOpenChange(false);
    window.setTimeout(() => {
      document.getElementById("termekek")?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  }, [onOpenChange]);

  if (!open) return null;

  return (
    <div
      className="border-t border-brand-100 bg-white shadow-md animate-fade-up"
      role="search"
      aria-label="Termék keresés"
    >
      <div className="mx-auto w-full min-w-0 max-w-[1480px] px-3 sm:px-5 md:px-6">
        <form
          className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            navigateSearch(query);
            scrollToProducts();
          }}
        >
          <label htmlFor={inputId} className="sr-only">
            Termék keresése
          </label>
          <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-brand-200 bg-brand-50/40 px-3 py-2.5 focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-100">
            <svg className="h-5 w-5 shrink-0 text-brand-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <circle cx="11" cy="11" r="8" />
              <path strokeLinecap="round" d="m21 21-4.35-4.35" />
            </svg>
            <input
              ref={inputRef}
              id={inputId}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Keresés a termékek között…"
              autoComplete="off"
              role="combobox"
              aria-expanded={showResults}
              aria-controls={showResults ? listboxId : undefined}
              aria-autocomplete="list"
              className="min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-red-950/45"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="shrink-0 text-xs font-semibold text-brand-700 transition hover:text-brand-900"
                aria-label="Keresés törlése"
              >
                ✕
              </button>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="btn-press shrink-0 rounded-xl border border-brand-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-950 transition hover:bg-brand-50"
          >
            Bezárás
          </button>
        </form>

        {showResults ? (
          <div
            id={listboxId}
            role="listbox"
            aria-label="Keresési találatok"
            className="border-t border-brand-100 pb-3"
          >
            {catalogLoading ? (
              <div className="space-y-2 py-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="skeleton h-14 w-full rounded-xl" />
                ))}
              </div>
            ) : dropdownMatches.length === 0 ? (
              <p className="py-4 text-center text-sm text-red-950/55">Nincs találat a „{trimmedQuery}” kifejezésre.</p>
            ) : (
              <ul className="max-h-[min(20rem,50vh)] overflow-y-auto py-1">
                {dropdownMatches.map((product) => {
                  const category = product.category_id ? categoriesById.get(product.category_id) : undefined;
                  const pricing = getProductPricing(product, category);
                  const catName = category?.name ?? "";
                  return (
                    <li key={product.id} role="option">
                      <Link
                        href={`/shop/${product.slug}`}
                        onClick={() => onOpenChange(false)}
                        className="flex items-center gap-3 rounded-xl px-2 py-2.5 transition hover:bg-brand-50"
                      >
                        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-brand-100 bg-brand-50">
                          {product.image_url ? (
                            <img
                              src={product.image_url}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="h-full w-full bg-gradient-to-br from-brand-50 to-brand-100" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          {catName ? (
                            <p className="truncate text-[10px] font-bold uppercase tracking-widest text-brand-700">
                              {catName}
                            </p>
                          ) : null}
                          <p className="truncate text-sm font-semibold text-slate-900">{product.name}</p>
                          <p className="text-xs font-bold text-brand-900">
                            {pricing.hasDiscount ? (
                              <>
                                <span className="text-red-950/45 line-through font-normal mr-1.5">
                                  {pricing.originalPrice.toLocaleString("hu-HU")} Ft
                                </span>
                                {pricing.effectivePrice.toLocaleString("hu-HU")} Ft
                              </>
                            ) : (
                              <>{pricing.effectivePrice.toLocaleString("hu-HU")} Ft</>
                            )}
                          </p>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}

            {!catalogLoading && matches.length > 0 ? (
              <div className="border-t border-brand-50 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    navigateSearch(query);
                    scrollToProducts();
                  }}
                  className="btn-press w-full rounded-xl bg-brand-50 px-4 py-2.5 text-center text-sm font-semibold text-brand-900 transition hover:bg-brand-100"
                >
                  Összes találat megtekintése ({matches.length})
                </button>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
