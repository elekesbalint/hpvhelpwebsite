"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { getCategoryBreadcrumb, getRootCategories } from "@/lib/categories";
import { sortCategoriesForDisplay } from "@/lib/category-sort";
import type { Database } from "@/types/supabase";

type Category = Database["public"]["Tables"]["categories"]["Row"];

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

type Modal = "create" | "edit" | null;

export default function AdminCategoriesPage() {
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [productCounts, setProductCounts] = useState<Record<string, number>>({});

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [modal, setModal] = useState<Modal>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [categoryName, setCategoryName] = useState("");
  const [categorySubtitle, setCategorySubtitle] = useState("");
  const [categoryVatRate, setCategoryVatRate] = useState("");
  const [categoryDiscountType, setCategoryDiscountType] = useState<"" | "percent" | "fixed">("");
  const [categoryDiscountValue, setCategoryDiscountValue] = useState("");

  const [categoryParentId, setCategoryParentId] = useState("");
  const [editParentId, setEditParentId] = useState("");

  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editName, setEditName] = useState("");
  const [editSubtitle, setEditSubtitle] = useState("");
  const [editVatRate, setEditVatRate] = useState("");
  const [editDiscountType, setEditDiscountType] = useState<"" | "percent" | "fixed">("");
  const [editDiscountValue, setEditDiscountValue] = useState("");

  const categorySlug = useMemo(() => slugify(categoryName), [categoryName]);

  const loadData = useCallback(async () => {
    const [{ data: cats }, { data: products }] = await Promise.all([
      supabase.from("categories").select("*").order("created_at", { ascending: false }),
      supabase.from("products").select("category_id"),
    ]);

    setCategories(cats ?? []);
    setSelectedCategoryIds([]);
    const counts: Record<string, number> = {};
    (products ?? []).forEach((p) => {
      if (p.category_id) counts[p.category_id] = (counts[p.category_id] ?? 0) + 1;
    });
    setProductCounts(counts);
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadData();
  }, [loadData]);

  useEffect(() => {
    if (!actionError) return;
    const timeout = window.setTimeout(() => setActionError(null), 5000);
    return () => window.clearTimeout(timeout);
  }, [actionError]);

  useEffect(() => {
    if (!actionSuccess) return;
    const timeout = window.setTimeout(() => setActionSuccess(null), 5000);
    return () => window.clearTimeout(timeout);
  }, [actionSuccess]);

  useEffect(() => {
    if (!modal) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      if (isSubmitting) return;
      closeModal();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [modal, isSubmitting]);

  const categoriesById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  const rootCategories = useMemo(() => getRootCategories(categories), [categories]);

  const filtered = useMemo(() => {
    const kw = search.toLowerCase().trim();
    const base = kw
      ? categories.filter(
          (c) =>
            c.name.toLowerCase().includes(kw) ||
            (c.subtitle ?? "").toLowerCase().includes(kw) ||
            c.slug.toLowerCase().includes(kw),
        )
      : categories;
    return sortCategoriesForDisplay(base);
  }, [categories, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const currentPage = Math.min(page, totalPages);
  const paginatedCategories = filtered.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);
  const allVisibleSelected =
    paginatedCategories.length > 0 && paginatedCategories.every((c) => selectedCategoryIds.includes(c.id));

  function closeModal() {
    if (isSubmitting) return;
    setModal(null);
    setEditingCategory(null);
    setCategoryName("");
    setCategorySubtitle("");
    setCategoryVatRate("");
    setCategoryDiscountType("");
    setCategoryDiscountValue("");
    setCategoryParentId("");
    setEditParentId("");
    setEditName("");
    setEditSubtitle("");
    setEditVatRate("");
    setEditDiscountType("");
    setEditDiscountValue("");
    setActionError(null);
  }

  function openEdit(cat: Category) {
    setEditingCategory(cat);
    setEditName(cat.name);
    setEditSubtitle(cat.subtitle ?? "");
    setEditVatRate(cat.vat_rate == null ? "" : String(cat.vat_rate));
    setEditDiscountType((cat.discount_type as "" | "percent" | "fixed") ?? "");
    setEditDiscountValue(cat.discount_value != null ? String(cat.discount_value) : "");
    setEditParentId(cat.parent_id ?? "");
    setModal("edit");
  }

  async function handleCreate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setActionError(null); setActionSuccess(null);
    const name = categoryName.trim();
    const subtitle = categorySubtitle.trim() || null;
    const vatRate = categoryVatRate.trim() === "" ? null : Number(categoryVatRate);
    const discountType = categoryDiscountType || null;
    const discountValue = categoryDiscountValue.trim() ? Number(categoryDiscountValue) : null;
    const parentId = categoryParentId.trim() || null;
    if (!name) { setActionError("A kategória neve kötelező."); return; }
    if (vatRate != null && (Number.isNaN(vatRate) || vatRate < 0 || vatRate > 100)) {
      setActionError("Az ÁFA mértékének 0 és 100 között kell lennie.");
      return;
    }
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("categories")
        .insert({
          name,
          slug: categorySlug,
          subtitle,
          parent_id: parentId,
          vat_rate: vatRate,
          discount_type: discountType as "percent" | "fixed" | null,
          discount_value: discountValue,
          is_active: true,
        });
      if (error) { setActionError(error.message); return; }
      setModal(null);
      setEditingCategory(null);
      setCategoryName(""); setCategorySubtitle(""); setCategoryVatRate(""); setCategoryDiscountType(""); setCategoryDiscountValue("");
      setEditName(""); setEditSubtitle(""); setEditVatRate(""); setEditDiscountType(""); setEditDiscountValue("");
      setActionSuccess("Kategória létrehozva.");
      await loadData();
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleUpdate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editingCategory) return;
    setActionError(null); setActionSuccess(null);
    const name = editName.trim();
    const subtitle = editSubtitle.trim() || null;
    const vatRate = editVatRate.trim() === "" ? null : Number(editVatRate);
    const discountType = editDiscountType || null;
    const discountValue = editDiscountValue.trim() ? Number(editDiscountValue) : null;
    const parentId = editParentId.trim() || null;
    if (!name) { setActionError("A kategória neve kötelező."); return; }
    if (parentId === editingCategory.id) {
      setActionError("A kategória nem lehet a saját szülője.");
      return;
    }
    if (vatRate != null && (Number.isNaN(vatRate) || vatRate < 0 || vatRate > 100)) {
      setActionError("Az ÁFA mértékének 0 és 100 között kell lennie.");
      return;
    }
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("categories")
        .update({
          name,
          slug: slugify(name),
          subtitle,
          parent_id: parentId,
          vat_rate: vatRate,
          discount_type: discountType as "percent" | "fixed" | null,
          discount_value: discountValue,
        })
        .eq("id", editingCategory.id);
      if (error) { setActionError(error.message); return; }
      setModal(null);
      setEditingCategory(null);
      setCategoryName(""); setCategorySubtitle(""); setCategoryVatRate(""); setCategoryDiscountType(""); setCategoryDiscountValue("");
      setEditName(""); setEditSubtitle(""); setEditVatRate(""); setEditDiscountType(""); setEditDiscountValue("");
      setActionSuccess("Kategória frissítve.");
      await loadData();
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleToggleActive(category: Category) {
    const confirmed = window.confirm(
      category.is_active ? `Inaktiválod: "${category.name}"?` : `Aktiválod: "${category.name}"?`
    );
    if (!confirmed) return;
    const { error } = await supabase
      .from("categories")
      .update({ is_active: !category.is_active })
      .eq("id", category.id);
    if (error) { setActionError(error.message); return; }
    setActionSuccess("Státusz frissítve.");
    await loadData();
  }

  async function handleBulkToggleActive(nextActive: boolean) {
    if (selectedCategoryIds.length === 0) {
      setActionError("Nincs kijelölt kategória.");
      return;
    }
    const label = nextActive ? "aktiválás" : "inaktiválás";
    const confirmed = window.confirm(`Biztosan ${selectedCategoryIds.length} kategóriát ${label}sz?`);
    if (!confirmed) return;

    const { error } = await supabase
      .from("categories")
      .update({ is_active: nextActive })
      .in("id", selectedCategoryIds);
    if (error) {
      setActionError(error.message);
      return;
    }
    setActionSuccess(`${selectedCategoryIds.length} kategória státusza frissítve.`);
    await loadData();
  }

  async function handleBulkDelete() {
    if (selectedCategoryIds.length === 0) {
      setActionError("Nincs kijelölt kategória.");
      return;
    }
    const confirmed = window.confirm(`Biztosan törlöd a kijelölt ${selectedCategoryIds.length} kategóriát?`);
    if (!confirmed) return;

    const { error } = await supabase
      .from("categories")
      .delete()
      .in("id", selectedCategoryIds);
    if (error) {
      setActionError(error.message);
      return;
    }
    setActionSuccess(`${selectedCategoryIds.length} kategória törölve.`);
    await loadData();
  }

  const inputCls = "w-full rounded-xl border border-brand-200 px-3 py-2.5 text-sm outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-100";
  const labelCls = "mb-1 block text-xs font-semibold text-red-950/70";

  const isCreate = modal === "create";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-brand-700">Admin</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">Kategóriák kezelése</h1>
        </div>
        <button
          onClick={() => setModal("create")}
          className="btn-press flex items-center gap-2 rounded-xl bg-brand-900 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-brand-800"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 5v14m-7-7h14" />
          </svg>
          Új kategória
        </button>
      </div>

      {actionError ? (
        <div className="rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm font-medium text-rose-700">{actionError}</div>
      ) : null}
      {actionSuccess ? (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm font-medium text-emerald-700">{actionSuccess}</div>
      ) : null}

      <div className="flex items-center gap-2 rounded-2xl border border-brand-100 bg-white px-4 py-3 shadow-sm transition focus-within:border-brand-400 focus-within:ring-2 focus-within:ring-brand-100">
        <svg className="h-4 w-4 shrink-0 text-brand-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Keresés kategória neve vagy leírás alapján..."
          className="w-full bg-transparent text-sm outline-none placeholder:text-red-950/40"
        />
        {search ? (
          <button onClick={() => setSearch("")} className="text-xs text-brand-700 hover:text-brand-900 transition">
            Törlés
          </button>
        ) : null}
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            disabled={selectedCategoryIds.length === 0}
            onClick={() => void handleBulkToggleActive(true)}
            className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50"
          >
            Tömeges aktiválás ({selectedCategoryIds.length})
          </button>
          <button
            type="button"
            disabled={selectedCategoryIds.length === 0}
            onClick={() => void handleBulkToggleActive(false)}
            className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700 transition hover:bg-amber-100 disabled:opacity-50"
          >
            Tömeges inaktiválás
          </button>
          <button
            type="button"
            disabled={selectedCategoryIds.length === 0}
            onClick={() => void handleBulkDelete()}
            className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 transition hover:bg-rose-100 disabled:opacity-50"
          >
            Tömeges törlés
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between rounded-2xl border border-brand-100 bg-white px-4 py-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-3 text-sm text-red-950/70">
          <p>Sor / oldal</p>
          <select
            value={rowsPerPage}
            onChange={(e) => { setRowsPerPage(Number(e.target.value)); setPage(1); }}
            className="rounded-lg border border-brand-200 px-2.5 py-1 text-sm outline-none transition focus:border-brand-600"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
          <p>Összesen {filtered.length} kategória</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="rounded-lg border border-brand-200 px-3 py-1.5 text-sm font-semibold text-brand-900 transition hover:bg-brand-50 disabled:opacity-40">Előző</button>
          <p className="text-sm font-semibold text-red-950/70">{currentPage}/{totalPages}</p>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="rounded-lg border border-brand-200 px-3 py-1.5 text-sm font-semibold text-brand-900 transition hover:bg-brand-50 disabled:opacity-40">Következő</button>
        </div>
      </div>

      <div className="rounded-2xl border border-brand-100 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="space-y-2 p-4">
            {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-14 rounded-xl" />)}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-brand-50 bg-brand-50/30">
                <th className="p-4 text-center">
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedCategoryIds(Array.from(new Set([...selectedCategoryIds, ...paginatedCategories.map((c) => c.id)])));
                      } else {
                        const filteredSet = new Set(paginatedCategories.map((c) => c.id));
                        setSelectedCategoryIds((prev) => prev.filter((id) => !filteredSet.has(id)));
                      }
                    }}
                    className="h-4 w-4 accent-brand-800"
                    aria-label="Összes látható kategória kijelölése"
                  />
                </th>
                <th className="p-4 text-left font-bold uppercase tracking-wider text-xs text-brand-900">Kategória</th>
                <th className="p-4 text-left font-bold uppercase tracking-wider text-xs text-brand-900">Szülő</th>
                <th className="p-4 text-left font-bold uppercase tracking-wider text-xs text-brand-900">Slug</th>
                <th className="p-4 text-center font-bold uppercase tracking-wider text-xs text-brand-900">Termékek száma</th>
                <th className="p-4 text-center font-bold uppercase tracking-wider text-xs text-brand-900">Alap ÁFA</th>
                <th className="p-4 text-center font-bold uppercase tracking-wider text-xs text-brand-900">Státusz</th>
                <th className="p-4 text-right font-bold uppercase tracking-wider text-xs text-brand-900">Műveletek</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-sm text-red-950/50">
                    Nincs találat a keresési feltételeknek megfelelően.
                  </td>
                </tr>
              ) : (
                paginatedCategories.map((cat) => (
                  <tr key={cat.id} className="transition hover:bg-brand-50/30">
                    <td className="p-4 text-center">
                      <input
                        type="checkbox"
                        checked={selectedCategoryIds.includes(cat.id)}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedCategoryIds((prev) => Array.from(new Set([...prev, cat.id])));
                          else setSelectedCategoryIds((prev) => prev.filter((id) => id !== cat.id));
                        }}
                        className="h-4 w-4 accent-brand-800"
                        aria-label={`Kategória kijelölése: ${cat.name}`}
                      />
                    </td>
                    <td className="p-4">
                      <p className={`font-semibold text-slate-900 ${cat.parent_id ? "pl-4" : ""}`}>
                        {cat.parent_id ? "↳ " : ""}{cat.name}
                      </p>
                      {cat.subtitle ? (
                        <p className="mt-0.5 text-xs leading-snug text-red-950/50 line-clamp-2">{cat.subtitle}</p>
                      ) : null}
                    </td>
                    <td className="p-4 text-xs text-red-950/60">
                      {cat.parent_id
                        ? getCategoryBreadcrumb(cat, categoriesById).split(" › ")[0]
                        : "—"}
                    </td>
                    <td className="p-4 font-mono text-xs text-red-950/50">{cat.slug}</td>
                    <td className="p-4 text-center">
                      <span className="rounded-full border border-brand-200 bg-brand-50 px-2.5 py-0.5 text-xs font-bold text-brand-900">
                        {productCounts[cat.id] ?? 0}
                      </span>
                    </td>
                    <td className="p-4 text-center text-xs font-semibold text-slate-700">
                      {cat.vat_rate == null ? "Nincs megadva" : `${Number(cat.vat_rate)}%`}
                    </td>
                    <td className="p-4 text-center">
                      <span className={`rounded-full border px-2.5 py-0.5 text-xs font-bold ${cat.is_active ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-slate-100 border-slate-200 text-slate-500"}`}>
                        {cat.is_active ? "Aktív" : "Inaktív"}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openEdit(cat)}
                          className="rounded-lg border border-brand-200 px-3 py-1.5 text-xs font-bold text-brand-900 transition hover:bg-brand-50"
                        >
                          Szerkesztés
                        </button>
                        <button
                          onClick={() => void handleToggleActive(cat)}
                          className={`rounded-lg border px-3 py-1.5 text-xs font-bold transition ${cat.is_active ? "border-amber-200 text-amber-700 hover:bg-amber-50" : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"}`}
                        >
                          {cat.is_active ? "Inaktiválás" : "Aktiválás"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {modal ? (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-sm" onClick={closeModal}>
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between border-b border-brand-100 px-6 py-4">
                <h2 className="text-base font-bold text-slate-900">
                  {isCreate ? "Új kategória létrehozása" : `Szerkesztés: ${editingCategory?.name}`}
                </h2>
                <button onClick={closeModal} disabled={isSubmitting} className="rounded-lg p-2 text-red-950/50 transition hover:bg-brand-50 disabled:opacity-40">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12"/>
                  </svg>
                </button>
              </div>

              <form onSubmit={isCreate ? (e) => void handleCreate(e) : (e) => void handleUpdate(e)}>
                <div className="space-y-4 p-6">
                  {actionError ? (
                    <div className="rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-700">{actionError}</div>
                  ) : null}

                  <div>
                    <label className={labelCls}>Szülő kategória</label>
                    <select
                      value={isCreate ? categoryParentId : editParentId}
                      onChange={(e) => (isCreate ? setCategoryParentId(e.target.value) : setEditParentId(e.target.value))}
                      className={inputCls}
                    >
                      <option value="">Főkategória (nincs szülő)</option>
                      {rootCategories
                        .filter((c) => !editingCategory || c.id !== editingCategory.id)
                        .map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                    <p className="mt-1 text-xs text-red-950/50">Alkategória esetén válassz főkategóriát (pl. SAM – öntesztek).</p>
                  </div>
                  <div>
                    <label className={labelCls}>Megjelenő név (cím) *</label>
                    <input
                      type="text"
                      required
                      autoFocus
                      value={isCreate ? categoryName : editName}
                      onChange={(e) => isCreate ? setCategoryName(e.target.value) : setEditName(e.target.value)}
                      placeholder="pl. IntimSelfCare"
                      className={inputCls}
                    />
                    {isCreate && categoryName ? (
                      <p className="mt-1 text-xs text-brand-700">Slug: {categorySlug}</p>
                    ) : null}
                  </div>
                  <div>
                    <label className={labelCls}>Alcím / rövid leírás</label>
                    <textarea
                      rows={2}
                      value={isCreate ? categorySubtitle : editSubtitle}
                      onChange={(e) => isCreate ? setCategorySubtitle(e.target.value) : setEditSubtitle(e.target.value)}
                      placeholder="pl. IntimSelfCare – Önmintavételes HPV (Human Papillomavírus), STI és Hüvelyi Microbiom vizsgálat"
                      className={`${inputCls} resize-none`}
                    />
                    <p className="mt-1 text-xs text-red-950/60">
                      A webshopban a kategória neve alatt, kisebb betűvel jelenik meg.
                    </p>
                  </div>
                  <div>
                    <label className={labelCls}>Alap ÁFA mérték (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={isCreate ? categoryVatRate : editVatRate}
                      onChange={(e) => isCreate ? setCategoryVatRate(e.target.value) : setEditVatRate(e.target.value)}
                      placeholder="pl. 27"
                      className={inputCls}
                    />
                    <p className="mt-1 text-xs text-red-950/60">
                      Üresen hagyva nincs kategória szintű alapértelmezett ÁFA.
                    </p>
                  </div>

                  <div>
                    <label className={labelCls}>Kategória szintű kedvezmény – opcionális</label>
                    <div className="grid grid-cols-2 gap-3 rounded-xl border border-brand-200 p-3">
                      <div>
                        <label className="mb-1 block text-xs text-red-950/60">Kedvezmény típusa</label>
                        <select
                          value={isCreate ? categoryDiscountType : editDiscountType}
                          onChange={(e) => isCreate ? setCategoryDiscountType(e.target.value as "" | "percent" | "fixed") : setEditDiscountType(e.target.value as "" | "percent" | "fixed")}
                          className={inputCls}
                        >
                          <option value="">Nincs kedvezmény</option>
                          <option value="percent">Százalékos (%)</option>
                          <option value="fixed">Fix összeg (Ft)</option>
                        </select>
                      </div>
                      <div>
                        <label className="mb-1 block text-xs text-red-950/60">Kedvezmény értéke</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder={(isCreate ? categoryDiscountType : editDiscountType) === "percent" ? "pl. 10" : "pl. 500"}
                          disabled={!(isCreate ? categoryDiscountType : editDiscountType)}
                          value={isCreate ? categoryDiscountValue : editDiscountValue}
                          onChange={(e) => isCreate ? setCategoryDiscountValue(e.target.value) : setEditDiscountValue(e.target.value)}
                          className={`${inputCls} disabled:opacity-40`}
                        />
                      </div>
                    </div>
                    <p className="mt-1 text-xs text-red-950/50">A kategória összes termékére vonatkozik, ha a terméken nincs külön kedvezmény beállítva.</p>
                  </div>
                </div>

                <div className="flex justify-end gap-3 border-t border-brand-100 px-6 py-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={isSubmitting}
                    className="rounded-xl border border-brand-200 px-4 py-2.5 text-sm font-semibold text-brand-900 transition hover:bg-brand-50 disabled:opacity-40"
                  >
                    Mégse
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-press rounded-xl bg-brand-900 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-brand-800"
                  >
                    {isSubmitting ? "Mentés..." : isCreate ? "Létrehozás" : "Mentés"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
