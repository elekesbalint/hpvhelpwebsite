"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
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
  const [productCounts, setProductCounts] = useState<Record<string, number>>({});

  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<Modal>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [categoryName, setCategoryName] = useState("");

  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editName, setEditName] = useState("");

  const categorySlug = useMemo(() => slugify(categoryName), [categoryName]);

  const loadData = useCallback(async () => {
    const [{ data: cats }, { data: products }] = await Promise.all([
      supabase.from("categories").select("*").order("created_at", { ascending: false }),
      supabase.from("products").select("category_id"),
    ]);

    setCategories(cats ?? []);
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

  const filtered = useMemo(() => {
    const kw = search.toLowerCase().trim();
    if (!kw) return categories;
    return categories.filter(
      (c) =>
        c.name.toLowerCase().includes(kw) ||
        c.slug.toLowerCase().includes(kw)
    );
  }, [categories, search]);

  function closeModal() {
    if (isSubmitting) return;
    setModal(null);
    setEditingCategory(null);
    setCategoryName("");
    setEditName("");
    setActionError(null);
  }

  function openEdit(cat: Category) {
    setEditingCategory(cat);
    setEditName(cat.name);
    setModal("edit");
  }

  async function handleCreate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setActionError(null); setActionSuccess(null);
    const name = categoryName.trim();
    if (!name) { setActionError("A kategória neve kötelező."); return; }
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("categories").insert({ name, slug: categorySlug, is_active: true });
      if (error) { setActionError(error.message); return; }
      setModal(null);
      setEditingCategory(null);
      setCategoryName("");
      setEditName("");
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
    if (!name) { setActionError("A kategória neve kötelező."); return; }
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("categories")
        .update({ name, slug: slugify(name) })
        .eq("id", editingCategory.id);
      if (error) { setActionError(error.message); return; }
      setModal(null);
      setEditingCategory(null);
      setCategoryName("");
      setEditName("");
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
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Keresés kategória neve vagy leírás alapján..."
          className="w-full bg-transparent text-sm outline-none placeholder:text-red-950/40"
        />
        {search ? (
          <button onClick={() => setSearch("")} className="text-xs text-brand-700 hover:text-brand-900 transition">
            Törlés
          </button>
        ) : null}
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
                <th className="p-4 text-left font-bold uppercase tracking-wider text-xs text-brand-900">Kategória neve</th>
                <th className="p-4 text-left font-bold uppercase tracking-wider text-xs text-brand-900">Slug</th>
                <th className="p-4 text-center font-bold uppercase tracking-wider text-xs text-brand-900">Termékek száma</th>
                <th className="p-4 text-center font-bold uppercase tracking-wider text-xs text-brand-900">Státusz</th>
                <th className="p-4 text-right font-bold uppercase tracking-wider text-xs text-brand-900">Műveletek</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-sm text-red-950/50">
                    Nincs találat a keresési feltételeknek megfelelően.
                  </td>
                </tr>
              ) : (
                filtered.map((cat) => (
                  <tr key={cat.id} className="transition hover:bg-brand-50/30">
                    <td className="p-4 font-semibold text-slate-900">{cat.name}</td>
                    <td className="p-4 font-mono text-xs text-red-950/50">{cat.slug}</td>
                    <td className="p-4 text-center">
                      <span className="rounded-full border border-brand-200 bg-brand-50 px-2.5 py-0.5 text-xs font-bold text-brand-900">
                        {productCounts[cat.id] ?? 0}
                      </span>
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
                    <label className={labelCls}>Kategória neve *</label>
                    <input
                      type="text"
                      required
                      autoFocus
                      value={isCreate ? categoryName : editName}
                      onChange={(e) => isCreate ? setCategoryName(e.target.value) : setEditName(e.target.value)}
                      placeholder="pl. Vitaminok"
                      className={inputCls}
                    />
                    {isCreate && categoryName ? (
                      <p className="mt-1 text-xs text-brand-700">Slug: {categorySlug}</p>
                    ) : null}
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
