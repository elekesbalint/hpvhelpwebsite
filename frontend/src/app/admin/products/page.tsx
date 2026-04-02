"use client";
/* eslint-disable @next/next/no-img-element */

import {
  ChangeEvent,
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/supabase";

type Category = Database["public"]["Tables"]["categories"]["Row"];
type Product = Database["public"]["Tables"]["products"]["Row"];

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const PRODUCTS_PER_PAGE = 12;

type Modal = "create" | "edit" | null;

export default function AdminProductsPage() {
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [modal, setModal] = useState<Modal>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [productName, setProductName] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [productPrice, setProductPrice] = useState("0");
  const [productStock, setProductStock] = useState("0");
  const [productCategoryId, setProductCategoryId] = useState<string>("");
  const [productImageUrl, setProductImageUrl] = useState("");
  const [imageUploading, setImageUploading] = useState(false);

  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editProductName, setEditProductName] = useState("");
  const [editProductDescription, setEditProductDescription] = useState("");
  const [editProductPrice, setEditProductPrice] = useState("0");
  const [editProductStock, setEditProductStock] = useState("0");
  const [editProductCategoryId, setEditProductCategoryId] = useState("");
  const [editProductImageUrl, setEditProductImageUrl] = useState("");

  const [search, setSearch] = useState("");
  const [filterCategoryId, setFilterCategoryId] = useState("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive">("all");
  const [sort, setSort] = useState<"newest" | "oldest" | "price-asc" | "price-desc" | "stock-asc" | "stock-desc">("newest");
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const productSlug = useMemo(() => slugify(productName), [productName]);
  const categoriesById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  const loadData = useCallback(async () => {
    const [{ data: catData }, { data: prodData }] = await Promise.all([
      supabase.from("categories").select("*").order("name", { ascending: true }),
      supabase.from("products").select("*").order("created_at", { ascending: false }),
    ]);
    setCategories(catData ?? []);
    setProducts(prodData ?? []);
    setSelectedIds([]);
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
      if (isSubmitting || imageUploading) return;
      setModal(null);
      setEditingProduct(null);
      setActionError(null);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [modal, isSubmitting, imageUploading]);

  const filteredProducts = useMemo(() => {
    let list = [...products];
    const keyword = search.toLowerCase().trim();
    if (keyword) {
      list = list.filter((p) => {
        const cat = p.category_id ? categoriesById.get(p.category_id)?.name ?? "" : "";
        return (
          p.name.toLowerCase().includes(keyword) ||
          cat.toLowerCase().includes(keyword) ||
          (p.description ?? "").toLowerCase().includes(keyword)
        );
      });
    }
    if (filterCategoryId !== "all") {
      list = list.filter((p) => p.category_id === filterCategoryId);
    }
    if (filterStatus === "active") list = list.filter((p) => p.is_active);
    if (filterStatus === "inactive") list = list.filter((p) => !p.is_active);
    list.sort((a, b) => {
      switch (sort) {
        case "oldest": return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case "price-asc": return Number(a.price) - Number(b.price);
        case "price-desc": return Number(b.price) - Number(a.price);
        case "stock-asc": return a.stock - b.stock;
        case "stock-desc": return b.stock - a.stock;
        default: return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });
    return list;
  }, [products, search, filterCategoryId, filterStatus, sort, categoriesById]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * PRODUCTS_PER_PAGE,
    currentPage * PRODUCTS_PER_PAGE
  );

  async function uploadProductImage(file: File): Promise<string | null> {
    setImageUploading(true);
    setActionError(null);
    const safeName = file.name.toLowerCase().replace(/[^a-z0-9.\\-_]/g, "-");
    const path = `products/${Date.now()}-${safeName}`;
    const { error: uploadError } = await supabase.storage.from("product-images").upload(path, file, { upsert: false });
    if (uploadError) { setActionError(uploadError.message); setImageUploading(false); return null; }
    const { data } = supabase.storage.from("product-images").getPublicUrl(path);
    setImageUploading(false);
    return data.publicUrl;
  }

  async function handleCreateImageChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await uploadProductImage(file);
    if (url) { setProductImageUrl(url); setActionSuccess("Kép feltöltve."); }
  }

  async function handleEditImageChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await uploadProductImage(file);
    if (url) { setEditProductImageUrl(url); setActionSuccess("Kép feltöltve."); }
  }

  async function handleCreateProduct(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setActionError(null); setActionSuccess(null);
    const name = productName.trim();
    const price = Number(productPrice);
    const stock = Number(productStock);
    if (!name) { setActionError("A termék neve kötelező."); return; }
    if (Number.isNaN(price) || price < 0) { setActionError("Az ár érvénytelen."); return; }
    if (!Number.isInteger(stock) || stock < 0) { setActionError("A készlet érvénytelen."); return; }
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("products").insert({
        name, slug: productSlug, price, stock,
        description: productDescription || null,
        category_id: productCategoryId || null,
        image_url: productImageUrl || null,
        is_active: true,
      });
      if (error) { setActionError(error.message); return; }
      setProductName(""); setProductDescription(""); setProductPrice("0");
      setProductStock("0"); setProductCategoryId(""); setProductImageUrl("");
      setModal(null);
      setActionSuccess("Termék létrehozva.");
      await loadData();
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleUpdateProduct(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editingProduct) return;
    setActionError(null); setActionSuccess(null);
    const name = editProductName.trim();
    const price = Number(editProductPrice);
    const stock = Number(editProductStock);
    if (!name) { setActionError("A termék neve kötelező."); return; }
    if (Number.isNaN(price) || price < 0) { setActionError("Az ár érvénytelen."); return; }
    if (!Number.isInteger(stock) || stock < 0) { setActionError("A készlet érvénytelen."); return; }
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("products").update({
        name, slug: slugify(name), price, stock,
        description: editProductDescription || null,
        category_id: editProductCategoryId || null,
        image_url: editProductImageUrl || null,
      }).eq("id", editingProduct.id);
      if (error) { setActionError(error.message); return; }
      setModal(null); setEditingProduct(null);
      setActionSuccess("Termék frissítve.");
      await loadData();
    } finally {
      setIsSubmitting(false);
    }
  }

  function closeModal() {
    if (isSubmitting || imageUploading) return;
    setModal(null);
    setEditingProduct(null);
    setActionError(null);
  }

  async function handleToggleActive(product: Product) {
    const confirmed = window.confirm(
      product.is_active ? `Inaktiválod: "${product.name}"?` : `Aktiválod: "${product.name}"?`
    );
    if (!confirmed) return;
    const { error } = await supabase.from("products").update({ is_active: !product.is_active }).eq("id", product.id);
    if (error) { setActionError(error.message); return; }
    setActionSuccess("Státusz frissítve.");
    await loadData();
  }

  async function handleDelete(id: string) {
    const product = products.find((p) => p.id === id);
    const confirmed = window.confirm(`Biztosan törlöd? (${product?.name})`);
    if (!confirmed) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) { setActionError(error.message); return; }
    setActionSuccess("Termék törölve.");
    await loadData();
  }

  async function handleBulkSetActive(isActive: boolean) {
    if (selectedIds.length === 0) { setActionError("Válassz ki legalább egy terméket."); return; }
    const confirmed = window.confirm(
      isActive ? `Aktiválod a kiválasztott ${selectedIds.length} terméket?` : `Inaktiválod a kiválasztott ${selectedIds.length} terméket?`
    );
    if (!confirmed) return;
    const { error } = await supabase.from("products").update({ is_active: isActive }).in("id", selectedIds);
    if (error) { setActionError(error.message); return; }
    setActionSuccess(isActive ? "Aktiválva." : "Inaktiválva.");
    setSelectedIds([]);
    await loadData();
  }

  function openEdit(product: Product) {
    setEditingProduct(product);
    setEditProductName(product.name);
    setEditProductDescription(product.description ?? "");
    setEditProductPrice(String(product.price));
    setEditProductStock(String(product.stock));
    setEditProductCategoryId(product.category_id ?? "");
    setEditProductImageUrl(product.image_url ?? "");
    setModal("edit");
  }

  const inputCls = "w-full rounded-xl border border-brand-200 px-3 py-2.5 text-sm outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-100";
  const labelCls = "mb-1 block text-xs font-semibold text-red-950/70";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-brand-700">Admin</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">Termékek kezelése</h1>
        </div>
        <button
          onClick={() => setModal("create")}
          className="btn-press flex items-center gap-2 rounded-xl bg-brand-900 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-brand-800"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14m-7-7h14" /></svg>
          Új termék
        </button>
      </div>

      {actionError ? <div className="rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm font-medium text-rose-700">{actionError}</div> : null}
      {actionSuccess ? <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm font-medium text-emerald-700">{actionSuccess}</div> : null}

      <div className="rounded-2xl border border-brand-100 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap gap-3">
          <div className="flex flex-1 min-w-48 items-center gap-2 rounded-xl border border-brand-200 bg-white px-3 py-2 transition focus-within:border-brand-600 focus-within:ring-2 focus-within:ring-brand-100">
            <svg className="h-4 w-4 shrink-0 text-brand-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Keresés termék neve, leírás vagy kategória alapján..."
              className="w-full bg-transparent text-sm outline-none placeholder:text-red-950/40"
            />
          </div>
          <select
            value={filterCategoryId}
            onChange={(e) => { setFilterCategoryId(e.target.value); setPage(1); }}
            className="rounded-xl border border-brand-200 px-3 py-2 text-sm outline-none transition focus:border-brand-600"
          >
            <option value="all">Minden kategória</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value as "all" | "active" | "inactive"); setPage(1); }}
            className="rounded-xl border border-brand-200 px-3 py-2 text-sm outline-none transition focus:border-brand-600"
          >
            <option value="all">Minden státusz</option>
            <option value="active">Aktív</option>
            <option value="inactive">Inaktív</option>
          </select>
          <select
            value={sort}
            onChange={(e) => { setSort(e.target.value as typeof sort); setPage(1); }}
            className="rounded-xl border border-brand-200 px-3 py-2 text-sm outline-none transition focus:border-brand-600"
          >
            <option value="newest">Legújabb</option>
            <option value="oldest">Legrégebbi</option>
            <option value="price-asc">Ár: növekvő</option>
            <option value="price-desc">Ár: csökkenő</option>
            <option value="stock-asc">Készlet: növekvő</option>
            <option value="stock-desc">Készlet: csökkenő</option>
          </select>
        </div>
      </div>

      {selectedIds.length > 0 ? (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3">
          <p className="text-sm font-semibold text-red-950">{selectedIds.length} termék kiválasztva</p>
          <button onClick={() => void handleBulkSetActive(true)} className="rounded-lg border border-emerald-300 bg-white px-3 py-1.5 text-xs font-bold text-emerald-700 transition hover:bg-emerald-50">Aktiválás</button>
          <button onClick={() => void handleBulkSetActive(false)} className="rounded-lg border border-rose-300 bg-white px-3 py-1.5 text-xs font-bold text-rose-700 transition hover:bg-rose-50">Inaktiválás</button>
          <button onClick={() => setSelectedIds([])} className="ml-auto rounded-lg border border-brand-200 px-3 py-1.5 text-xs font-semibold text-brand-900 transition hover:bg-white">Kijelölés törlése</button>
        </div>
      ) : null}

      <div className="rounded-2xl border border-brand-100 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="space-y-2 p-4">
            {[...Array(5)].map((_, i) => <div key={i} className="skeleton h-14 rounded-xl" />)}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-brand-50 bg-brand-50/30">
                <th className="p-4 text-left">
                  <input
                    type="checkbox"
                    checked={paginatedProducts.length > 0 && paginatedProducts.every((p) => selectedIds.includes(p.id))}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedIds((prev) => { const s = new Set(prev); paginatedProducts.forEach((p) => s.add(p.id)); return Array.from(s); });
                      else setSelectedIds((prev) => prev.filter((id) => !paginatedProducts.some((p) => p.id === id)));
                    }}
                    className="rounded"
                  />
                </th>
                <th className="p-4 text-left font-bold uppercase tracking-wider text-xs text-brand-900">Termék</th>
                <th className="p-4 text-left font-bold uppercase tracking-wider text-xs text-brand-900">Kategória</th>
                <th className="p-4 text-right font-bold uppercase tracking-wider text-xs text-brand-900">Ár</th>
                <th className="p-4 text-right font-bold uppercase tracking-wider text-xs text-brand-900">Darab</th>
                <th className="p-4 text-center font-bold uppercase tracking-wider text-xs text-brand-900">Státusz</th>
                <th className="p-4 text-right font-bold uppercase tracking-wider text-xs text-brand-900">Műveletek</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-50">
              {paginatedProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-sm text-red-950/50">
                    Nincs találat a keresési feltételeknek megfelelően.
                  </td>
                </tr>
              ) : (
                paginatedProducts.map((product) => (
                  <tr key={product.id} className="transition hover:bg-brand-50/30">
                    <td className="p-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(product.id)}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedIds((prev) => [...prev, product.id]);
                          else setSelectedIds((prev) => prev.filter((id) => id !== product.id));
                        }}
                        className="rounded"
                      />
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {product.image_url ? (
                          <img src={product.image_url} alt={product.name} className="h-10 w-10 rounded-lg object-cover border border-brand-100" />
                        ) : (
                          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-brand-50 to-brand-100" />
                        )}
                        <div>
                          <p className="font-semibold text-slate-900">{product.name}</p>
                          <p className="text-xs text-red-950/50 font-mono">{product.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-red-950/70">
                      {product.category_id ? (categoriesById.get(product.category_id)?.name ?? "—") : "—"}
                    </td>
                    <td className="p-4 text-right font-semibold text-slate-900">
                      {Number(product.price).toLocaleString("hu-HU")} Ft
                    </td>
                    <td className="p-4 text-right font-semibold">
                      <span className={product.stock > 0 ? "text-emerald-700" : "text-rose-600"}>{product.stock}</span>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`rounded-full border px-2.5 py-0.5 text-xs font-bold ${product.is_active ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-slate-100 border-slate-200 text-slate-500"}`}>
                        {product.is_active ? "Aktív" : "Inaktív"}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => openEdit(product)} className="rounded-lg border border-brand-200 px-3 py-1.5 text-xs font-bold text-brand-900 transition hover:bg-brand-50">
                          Szerkesztés
                        </button>
                        <button onClick={() => void handleToggleActive(product)} className={`rounded-lg border px-3 py-1.5 text-xs font-bold transition ${product.is_active ? "border-amber-200 text-amber-700 hover:bg-amber-50" : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"}`}>
                          {product.is_active ? "Inaktiválás" : "Aktiválás"}
                        </button>
                        <button onClick={() => void handleDelete(product.id)} className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-bold text-rose-600 transition hover:bg-rose-50">
                          Törlés
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

      {totalPages > 1 ? (
        <div className="flex items-center justify-between rounded-2xl border border-brand-100 bg-white px-4 py-3 shadow-sm">
          <p className="text-sm text-red-950/60">
            {(currentPage - 1) * PRODUCTS_PER_PAGE + 1}–{Math.min(currentPage * PRODUCTS_PER_PAGE, filteredProducts.length)} / {filteredProducts.length} termék
          </p>
          <div className="flex gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="rounded-lg border border-brand-200 px-3 py-1.5 text-sm font-semibold text-brand-900 transition hover:bg-brand-50 disabled:opacity-40">Előző</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button key={p} onClick={() => setPage(p)} className={`h-8 w-8 rounded-lg border text-xs font-bold transition ${p === currentPage ? "border-brand-700 bg-brand-900 text-white" : "border-brand-200 text-brand-900 hover:bg-brand-50"}`}>{p}</button>
            ))}
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="rounded-lg border border-brand-200 px-3 py-1.5 text-sm font-semibold text-brand-900 transition hover:bg-brand-50 disabled:opacity-40">Következő</button>
          </div>
        </div>
      ) : null}

      {modal ? (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-sm" onClick={closeModal}>
          <div className="flex min-h-full items-center justify-center p-4">
            <div
              className="w-full max-w-lg rounded-2xl bg-white shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-brand-100 px-6 py-4">
                <h2 className="text-base font-bold text-slate-900">
                  {modal === "create" ? "Új termék hozzáadása" : `Szerkesztés: ${editingProduct?.name}`}
                </h2>
                <button onClick={closeModal} disabled={isSubmitting || imageUploading} className="rounded-lg p-2 text-red-950/50 transition hover:bg-brand-50 disabled:opacity-40">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
              </div>

              <form onSubmit={modal === "create" ? (e) => void handleCreateProduct(e) : (e) => void handleUpdateProduct(e)}>
                <div className="space-y-4 p-6">
                  {actionError ? <div className="rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-700">{actionError}</div> : null}

                  <div>
                    <label className={labelCls}>Termék neve *</label>
                    <input
                      type="text"
                      required
                      autoFocus
                      value={modal === "create" ? productName : editProductName}
                      onChange={(e) => modal === "create" ? setProductName(e.target.value) : setEditProductName(e.target.value)}
                      className={inputCls}
                    />
                    {modal === "create" && productName ? (
                      <p className="mt-1 text-xs text-brand-700">Slug: {productSlug}</p>
                    ) : null}
                  </div>

                  <div>
                    <label className={labelCls}>Leírás</label>
                    <textarea
                      rows={3}
                      value={modal === "create" ? productDescription : editProductDescription}
                      onChange={(e) => modal === "create" ? setProductDescription(e.target.value) : setEditProductDescription(e.target.value)}
                      className={`${inputCls} resize-none`}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>Ár (Ft) *</label>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        required
                        value={modal === "create" ? productPrice : editProductPrice}
                        onChange={(e) => modal === "create" ? setProductPrice(e.target.value) : setEditProductPrice(e.target.value)}
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Készlet (db) *</label>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        required
                        value={modal === "create" ? productStock : editProductStock}
                        onChange={(e) => modal === "create" ? setProductStock(e.target.value) : setEditProductStock(e.target.value)}
                        className={inputCls}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={labelCls}>Kategória</label>
                    <select
                      value={modal === "create" ? productCategoryId : editProductCategoryId}
                      onChange={(e) => modal === "create" ? setProductCategoryId(e.target.value) : setEditProductCategoryId(e.target.value)}
                      className={inputCls}
                    >
                      <option value="">Válasszon kategóriát</option>
                      {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className={labelCls}>Termékkép</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={modal === "create" ? (e) => void handleCreateImageChange(e) : (e) => void handleEditImageChange(e)}
                      disabled={imageUploading}
                      className="w-full rounded-xl border border-brand-200 px-3 py-2 text-sm text-red-950/70 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-brand-900"
                    />
                    {imageUploading ? <p className="mt-1 text-xs text-brand-700">Feltöltés...</p> : null}
                    {(modal === "create" ? productImageUrl : editProductImageUrl) ? (
                      <img src={modal === "create" ? productImageUrl : editProductImageUrl} alt="preview" className="mt-2 h-24 w-24 rounded-xl object-cover border border-brand-100" />
                    ) : null}
                  </div>
                </div>

                <div className="flex justify-end gap-3 border-t border-brand-100 px-6 py-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={isSubmitting || imageUploading}
                    className="rounded-xl border border-brand-200 px-4 py-2.5 text-sm font-semibold text-brand-900 transition hover:bg-brand-50 disabled:opacity-40"
                  >
                    Mégse
                  </button>
                  <button
                    type="submit"
                    disabled={imageUploading || isSubmitting}
                    className="btn-press rounded-xl bg-brand-900 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-brand-800 disabled:opacity-50"
                  >
                    {isSubmitting ? "Mentés..." : modal === "create" ? "Hozzáadás" : "Mentés"}
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
