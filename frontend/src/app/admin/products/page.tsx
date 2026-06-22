"use client";
/* eslint-disable @next/next/no-img-element */

import {
  ChangeEvent,
  FormEvent,
  type WheelEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import RichTextEditor from "@/components/RichTextEditor";
import { sortCategoriesForDisplay } from "@/lib/category-sort";
import { flattenCategoriesForSelect } from "@/lib/categories";
import {
  compareProductsBySortOrder,
  nextProductSortOrder,
  sortProductsForDisplay,
} from "@/lib/product-sort";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/supabase";

type Category = Database["public"]["Tables"]["categories"]["Row"];
type Product = Database["public"]["Tables"]["products"]["Row"];

/** Megakadályozza, hogy touchpad görgetés a szám mező értékét léptesse (böngésző alapértelmezés). */
function blurNumberInputOnWheel(e: WheelEvent<HTMLInputElement>) {
  e.preventDefault();
  e.currentTarget.blur();
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function toLocalDatetime(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function parseLocalDatetime(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const d = new Date(trimmed);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function validateSalePeriod(startsAt: string | null, endsAt: string | null): string | null {
  if (startsAt && endsAt && new Date(startsAt) >= new Date(endsAt)) {
    return "A leárazás kezdete korábban kell legyen, mint a vége.";
  }
  return null;
}

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
  const [productSku, setProductSku] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [productPrice, setProductPrice] = useState("0");
  const [productCompareAtPrice, setProductCompareAtPrice] = useState("");
  const [productSaleStartsAt, setProductSaleStartsAt] = useState("");
  const [productSaleEndsAt, setProductSaleEndsAt] = useState("");
  const [productDiscountType, setProductDiscountType] = useState<"" | "percent" | "fixed">("");
  const [productDiscountValue, setProductDiscountValue] = useState("");
  const [productStock, setProductStock] = useState("0");
  const [productCategoryId, setProductCategoryId] = useState<string>("");
  const [productVatMode, setProductVatMode] = useState<"inherit" | "custom">("inherit");
  const [productVatRate, setProductVatRate] = useState("");
  const [productImageUrl, setProductImageUrl] = useState("");
  const [imageUploading, setImageUploading] = useState(false);

  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editProductName, setEditProductName] = useState("");
  const [editProductSku, setEditProductSku] = useState("");
  const [editProductDescription, setEditProductDescription] = useState("");
  const [editProductPrice, setEditProductPrice] = useState("0");
  const [editProductCompareAtPrice, setEditProductCompareAtPrice] = useState("");
  const [editProductSaleStartsAt, setEditProductSaleStartsAt] = useState("");
  const [editProductSaleEndsAt, setEditProductSaleEndsAt] = useState("");
  const [editProductDiscountType, setEditProductDiscountType] = useState<"" | "percent" | "fixed">("");
  const [editProductDiscountValue, setEditProductDiscountValue] = useState("");
  const [editProductStock, setEditProductStock] = useState("0");
  const [editProductCategoryId, setEditProductCategoryId] = useState("");
  const [editVatMode, setEditVatMode] = useState<"inherit" | "custom">("inherit");
  const [editVatRate, setEditVatRate] = useState("");
  const [editProductImageUrl, setEditProductImageUrl] = useState("");

  const [search, setSearch] = useState("");
  const [filterCategoryId, setFilterCategoryId] = useState("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive">("all");
  const [sort, setSort] = useState<
    "custom" | "newest" | "oldest" | "price-asc" | "price-desc" | "stock-asc" | "stock-desc"
  >("custom");
  const [reorderBusy, setReorderBusy] = useState(false);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const productSlug = useMemo(() => slugify(productName), [productName]);
  const categoriesById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  const sortedCategories = useMemo(() => sortCategoriesForDisplay(categories), [categories]);
  const categorySelectOptions = useMemo(() => flattenCategoriesForSelect(categories), [categories]);

  const loadData = useCallback(async () => {
    const [{ data: catData }, { data: prodData }] = await Promise.all([
      supabase.from("categories").select("*").order("name", { ascending: true }),
      supabase
        .from("products")
        .select("*")
        .order("sort_order", { ascending: true, nullsFirst: false })
        .order("created_at", { ascending: false }),
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
          (p.sku ?? "").toLowerCase().includes(keyword) ||
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
        case "custom": return compareProductsBySortOrder(a, b);
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

  const canReorder =
    sort === "custom" &&
    !search.trim() &&
    filterCategoryId === "all" &&
    filterStatus === "all" &&
    !reorderBusy;

  const orderedForReorder = useMemo(() => sortProductsForDisplay(products), [products]);

  async function moveProduct(productId: string, direction: "up" | "down") {
    if (!canReorder) return;
    const index = orderedForReorder.findIndex((p) => p.id === productId);
    if (index < 0) return;
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= orderedForReorder.length) return;

    const current = orderedForReorder[index];
    const neighbor = orderedForReorder[swapIndex];
    const currentOrder = current.sort_order ?? (index + 1) * 10;
    const neighborOrder = neighbor.sort_order ?? (swapIndex + 1) * 10;

    setReorderBusy(true);
    setActionError(null);
    try {
      const [a, b] = await Promise.all([
        supabase.from("products").update({ sort_order: neighborOrder }).eq("id", current.id),
        supabase.from("products").update({ sort_order: currentOrder }).eq("id", neighbor.id),
      ]);
      if (a.error || b.error) {
        setActionError(a.error?.message ?? b.error?.message ?? "Sorrend mentése sikertelen.");
        return;
      }
      setActionSuccess("Sorrend frissítve.");
      await loadData();
    } finally {
      setReorderBusy(false);
    }
  }

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / rowsPerPage));
  const currentPage = Math.min(page, totalPages);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
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
    const vatRate = productVatMode === "inherit" ? null : Number(productVatRate);
    const compareAtPrice = productCompareAtPrice.trim() ? Number(productCompareAtPrice) : null;
    const saleStartsAt = parseLocalDatetime(productSaleStartsAt);
    const saleEndsAt = parseLocalDatetime(productSaleEndsAt);
    const discountType = productDiscountType || null;
    const discountValue = productDiscountValue.trim() ? Number(productDiscountValue) : null;
    if (!name) { setActionError("A termék neve kötelező."); return; }
    if (Number.isNaN(price) || price < 0) { setActionError("Az ár érvénytelen."); return; }
    if (!Number.isInteger(stock) || stock < 0) { setActionError("A készlet érvénytelen."); return; }
    if (productVatMode === "custom" && (Number.isNaN(vatRate) || vatRate == null || vatRate < 0 || vatRate > 100)) {
      setActionError("Az egyedi ÁFA mértékének 0 és 100 között kell lennie.");
      return;
    }
    if (compareAtPrice != null && compareAtPrice <= price) {
      setActionError("A leárazás előtti ár nagyobb kell legyen, mint az aktuális ár.");
      return;
    }
    const salePeriodError = validateSalePeriod(saleStartsAt, saleEndsAt);
    if (salePeriodError) { setActionError(salePeriodError); return; }
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("products").insert({
        name, slug: productSlug, sku: productSku.trim() || null, price, stock,
        description: productDescription || null,
        category_id: productCategoryId || null,
        vat_rate: vatRate,
        compare_at_price: compareAtPrice,
        sale_starts_at: saleStartsAt,
        sale_ends_at: saleEndsAt,
        discount_type: discountType as "percent" | "fixed" | null,
        discount_value: discountValue,
        image_url: productImageUrl || null,
        sort_order: nextProductSortOrder(products),
        is_active: true,
      });
      if (error) { setActionError(error.message); return; }
      setProductName(""); setProductSku(""); setProductDescription(""); setProductPrice("0");
      setProductCompareAtPrice(""); setProductSaleStartsAt(""); setProductSaleEndsAt("");
      setProductDiscountType(""); setProductDiscountValue("");
      setProductStock("0"); setProductCategoryId("");
      setProductVatMode("inherit"); setProductVatRate("");
      setProductImageUrl("");
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
    const vatRate = editVatMode === "inherit" ? null : Number(editVatRate);
    const compareAtPrice = editProductCompareAtPrice.trim() ? Number(editProductCompareAtPrice) : null;
    const saleStartsAt = parseLocalDatetime(editProductSaleStartsAt);
    const saleEndsAt = parseLocalDatetime(editProductSaleEndsAt);
    const discountType = editProductDiscountType || null;
    const discountValue = editProductDiscountValue.trim() ? Number(editProductDiscountValue) : null;
    if (!name) { setActionError("A termék neve kötelező."); return; }
    if (Number.isNaN(price) || price < 0) { setActionError("Az ár érvénytelen."); return; }
    if (!Number.isInteger(stock) || stock < 0) { setActionError("A készlet érvénytelen."); return; }
    if (editVatMode === "custom" && (Number.isNaN(vatRate) || vatRate == null || vatRate < 0 || vatRate > 100)) {
      setActionError("Az egyedi ÁFA mértékének 0 és 100 között kell lennie.");
      return;
    }
    if (compareAtPrice != null && compareAtPrice <= price) {
      setActionError("A leárazás előtti ár nagyobb kell legyen, mint az aktuális ár.");
      return;
    }
    const salePeriodError = validateSalePeriod(saleStartsAt, saleEndsAt);
    if (salePeriodError) { setActionError(salePeriodError); return; }
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("products").update({
        name, slug: slugify(name), sku: editProductSku.trim() || null, price, stock,
        description: editProductDescription || null,
        category_id: editProductCategoryId || null,
        vat_rate: vatRate,
        compare_at_price: compareAtPrice,
        sale_starts_at: saleStartsAt,
        sale_ends_at: saleEndsAt,
        discount_type: discountType as "percent" | "fixed" | null,
        discount_value: discountValue,
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
    setProductVatMode("inherit");
    setProductVatRate("");
    setProductCompareAtPrice("");
    setProductSaleStartsAt("");
    setProductSaleEndsAt("");
    setProductDiscountType("");
    setProductDiscountValue("");
    setEditVatMode("inherit");
    setEditVatRate("");
    setEditProductCompareAtPrice("");
    setEditProductSaleStartsAt("");
    setEditProductSaleEndsAt("");
    setEditProductDiscountType("");
    setEditProductDiscountValue("");
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

  async function handleBulkDelete() {
    if (selectedIds.length === 0) { setActionError("Válassz ki legalább egy terméket."); return; }
    const confirmed = window.confirm(`Biztosan törlöd a kiválasztott ${selectedIds.length} terméket?`);
    if (!confirmed) return;
    const { error } = await supabase.from("products").delete().in("id", selectedIds);
    if (error) { setActionError(error.message); return; }
    setActionSuccess(`${selectedIds.length} termék törölve.`);
    setSelectedIds([]);
    await loadData();
  }

  function openEdit(product: Product) {
    setEditingProduct(product);
    setEditProductName(product.name);
    setEditProductSku(product.sku ?? "");
    setEditProductDescription(product.description ?? "");
    setEditProductPrice(String(product.price));
    setEditProductCompareAtPrice(product.compare_at_price != null ? String(product.compare_at_price) : "");
    setEditProductSaleStartsAt(toLocalDatetime(product.sale_starts_at));
    setEditProductSaleEndsAt(toLocalDatetime(product.sale_ends_at));
    setEditProductDiscountType((product.discount_type as "" | "percent" | "fixed") ?? "");
    setEditProductDiscountValue(product.discount_value != null ? String(product.discount_value) : "");
    setEditProductStock(String(product.stock));
    setEditProductCategoryId(product.category_id ?? "");
    setEditVatMode(product.vat_rate == null ? "inherit" : "custom");
    setEditVatRate(product.vat_rate == null ? "" : String(product.vat_rate));
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
              placeholder="Keresés név, cikkszám, leírás vagy kategória alapján..."
              className="w-full bg-transparent text-sm outline-none placeholder:text-red-950/40"
            />
          </div>
          <select
            value={filterCategoryId}
            onChange={(e) => { setFilterCategoryId(e.target.value); setPage(1); }}
            className="rounded-xl border border-brand-200 px-3 py-2 text-sm outline-none transition focus:border-brand-600"
          >
            <option value="all">Minden kategória</option>
            {categorySelectOptions.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
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
            <option value="custom">Egyéni sorrend</option>
            <option value="newest">Legújabb</option>
            <option value="oldest">Legrégebbi</option>
            <option value="price-asc">Ár: növekvő</option>
            <option value="price-desc">Ár: csökkenő</option>
            <option value="stock-asc">Készlet: növekvő</option>
            <option value="stock-desc">Készlet: csökkenő</option>
          </select>
        </div>
        {sort === "custom" && !canReorder ? (
          <p className="mt-3 text-xs text-amber-800">
            A sorrend állításához kapcsold ki a keresést és a szűrőket (minden kategória, minden státusz).
          </p>
        ) : null}
      </div>

      {selectedIds.length > 0 ? (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3">
          <p className="text-sm font-semibold text-red-950">{selectedIds.length} termék kiválasztva</p>
          <button onClick={() => void handleBulkSetActive(true)} className="rounded-lg border border-emerald-300 bg-white px-3 py-1.5 text-xs font-bold text-emerald-700 transition hover:bg-emerald-50">Aktiválás</button>
          <button onClick={() => void handleBulkSetActive(false)} className="rounded-lg border border-rose-300 bg-white px-3 py-1.5 text-xs font-bold text-rose-700 transition hover:bg-rose-50">Inaktiválás</button>
          <button onClick={() => void handleBulkDelete()} className="rounded-lg border border-rose-300 bg-white px-3 py-1.5 text-xs font-bold text-rose-700 transition hover:bg-rose-50">Törlés</button>
          <button onClick={() => setSelectedIds([])} className="ml-auto rounded-lg border border-brand-200 px-3 py-1.5 text-xs font-semibold text-brand-900 transition hover:bg-white">Kijelölés törlése</button>
        </div>
      ) : null}

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
          <p>Összesen {filteredProducts.length} termék</p>
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
                {sort === "custom" ? (
                  <th className="p-4 text-center font-bold uppercase tracking-wider text-xs text-brand-900 w-24">Sorrend</th>
                ) : null}
                <th className="p-4 text-left font-bold uppercase tracking-wider text-xs text-brand-900">Termék</th>
                <th className="p-4 text-left font-bold uppercase tracking-wider text-xs text-brand-900">Kategória</th>
                <th className="p-4 text-center font-bold uppercase tracking-wider text-xs text-brand-900">ÁFA</th>
                <th className="p-4 text-right font-bold uppercase tracking-wider text-xs text-brand-900">Ár</th>
                <th className="p-4 text-right font-bold uppercase tracking-wider text-xs text-brand-900">Darab</th>
                <th className="p-4 text-center font-bold uppercase tracking-wider text-xs text-brand-900">Státusz</th>
                <th className="p-4 text-right font-bold uppercase tracking-wider text-xs text-brand-900">Műveletek</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-50">
              {paginatedProducts.length === 0 ? (
                <tr>
                  <td colSpan={sort === "custom" ? 9 : 8} className="p-8 text-center text-sm text-red-950/50">
                    Nincs találat a keresési feltételeknek megfelelően.
                  </td>
                </tr>
              ) : (
                paginatedProducts.map((product) => {
                  const globalIndex = orderedForReorder.findIndex((p) => p.id === product.id);
                  const canMoveUp = canReorder && globalIndex > 0;
                  const canMoveDown = canReorder && globalIndex >= 0 && globalIndex < orderedForReorder.length - 1;

                  return (
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
                    {sort === "custom" ? (
                      <td className="p-4">
                        <div className="flex flex-col items-center gap-1">
                          <button
                            type="button"
                            disabled={!canMoveUp}
                            onClick={() => void moveProduct(product.id, "up")}
                            className="rounded border border-brand-200 px-2 py-0.5 text-xs font-bold text-brand-900 transition hover:bg-brand-50 disabled:opacity-30"
                            aria-label={`${product.name} feljebb`}
                          >
                            ↑
                          </button>
                          <span className="font-mono text-[10px] text-red-950/45">{product.sort_order ?? "—"}</span>
                          <button
                            type="button"
                            disabled={!canMoveDown}
                            onClick={() => void moveProduct(product.id, "down")}
                            className="rounded border border-brand-200 px-2 py-0.5 text-xs font-bold text-brand-900 transition hover:bg-brand-50 disabled:opacity-30"
                            aria-label={`${product.name} lejjebb`}
                          >
                            ↓
                          </button>
                        </div>
                      </td>
                    ) : null}
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
                          {product.sku ? (
                            <p className="text-xs text-brand-800">Cikkszám: {product.sku}</p>
                          ) : null}
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-red-950/70">
                      {product.category_id ? (categoriesById.get(product.category_id)?.name ?? "—") : "—"}
                    </td>
                    <td className="p-4 text-center text-xs font-semibold text-slate-700">
                      {product.vat_rate != null
                        ? `${Number(product.vat_rate)}% (egyedi)`
                        : product.category_id && categoriesById.get(product.category_id)?.vat_rate != null
                          ? `${Number(categoriesById.get(product.category_id)?.vat_rate)}% (kategoriabol)`
                          : "Nincs"}
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
                  );
                })
              )}
            </tbody>
          </table>
        )}
      </div>

      {modal ? (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-sm" onClick={closeModal}>
          <div className="flex min-h-full items-center justify-center p-4">
            <div
              className="w-full max-w-4xl rounded-2xl bg-white shadow-2xl"
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
                    <label className={labelCls}>Cikkszám (SKU)</label>
                    <input
                      type="text"
                      value={modal === "create" ? productSku : editProductSku}
                      onChange={(e) => modal === "create" ? setProductSku(e.target.value) : setEditProductSku(e.target.value)}
                      placeholder="pl. ZNS001"
                      className={inputCls}
                    />
                  </div>

                  <div>
                    <label className={labelCls}>Leírás</label>
                    <RichTextEditor
                      value={modal === "create" ? productDescription : editProductDescription}
                      onChange={(html) => modal === "create" ? setProductDescription(html) : setEditProductDescription(html)}
                      placeholder="Termék leírása, jellemzők, összetevők…"
                      minHeight={220}
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
                        onWheel={blurNumberInputOnWheel}
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
                        onWheel={blurNumberInputOnWheel}
                        className={inputCls}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={labelCls}>Leárazás előtti ár (Ft) – opcionális</label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      placeholder="pl. 15 000 (ha ez van beállítva, az ár lesz az akciós ár)"
                      value={modal === "create" ? productCompareAtPrice : editProductCompareAtPrice}
                      onChange={(e) => modal === "create" ? setProductCompareAtPrice(e.target.value) : setEditProductCompareAtPrice(e.target.value)}
                      onWheel={blurNumberInputOnWheel}
                      className={inputCls}
                    />
                    <p className="mt-1 text-xs text-red-950/50">Ha be van állítva, az eredeti ár áthúzva jelenik meg, az ár az akciós ár. Leárazott termékre kupon nem érvényesíthető.</p>
                  </div>

                  <div>
                    <label className={labelCls}>Leárazás / kedvezmény időszaka – opcionális</label>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-xs text-red-950/60">Mettől</label>
                        <input
                          type="datetime-local"
                          value={modal === "create" ? productSaleStartsAt : editProductSaleStartsAt}
                          onChange={(e) => modal === "create" ? setProductSaleStartsAt(e.target.value) : setEditProductSaleStartsAt(e.target.value)}
                          className={inputCls}
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs text-red-950/60">Meddig</label>
                        <input
                          type="datetime-local"
                          value={modal === "create" ? productSaleEndsAt : editProductSaleEndsAt}
                          onChange={(e) => modal === "create" ? setProductSaleEndsAt(e.target.value) : setEditProductSaleEndsAt(e.target.value)}
                          className={inputCls}
                        />
                      </div>
                    </div>
                    <p className="mt-1 text-xs text-red-950/50">
                      A leárazás előtti árra és a termék szintű kedvezményre vonatkozik. Üresen hagyva nincs időkorlát.
                    </p>
                  </div>

                  <div>
                    <label className={labelCls}>Kedvezmény beállítása – opcionális</label>
                    <div className="grid grid-cols-2 gap-3 rounded-xl border border-brand-200 p-3">
                      <div>
                        <label className="mb-1 block text-xs text-red-950/60">Kedvezmény típusa</label>
                        <select
                          value={modal === "create" ? productDiscountType : editProductDiscountType}
                          onChange={(e) => modal === "create" ? setProductDiscountType(e.target.value as "" | "percent" | "fixed") : setEditProductDiscountType(e.target.value as "" | "percent" | "fixed")}
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
                          placeholder={(modal === "create" ? productDiscountType : editProductDiscountType) === "percent" ? "pl. 10" : "pl. 500"}
                          disabled={!(modal === "create" ? productDiscountType : editProductDiscountType)}
                          value={modal === "create" ? productDiscountValue : editProductDiscountValue}
                          onChange={(e) => modal === "create" ? setProductDiscountValue(e.target.value) : setEditProductDiscountValue(e.target.value)}
                          onWheel={blurNumberInputOnWheel}
                          className={`${inputCls} disabled:opacity-40`}
                        />
                      </div>
                    </div>
                    <p className="mt-1 text-xs text-red-950/50">Termékszintű kedvezmény felülírja a kategóriaszintűt.</p>
                  </div>

                  <div>
                    <label className={labelCls}>Kategória</label>
                    <select
                      value={modal === "create" ? productCategoryId : editProductCategoryId}
                      onChange={(e) => modal === "create" ? setProductCategoryId(e.target.value) : setEditProductCategoryId(e.target.value)}
                      className={inputCls}
                    >
                      <option value="">Válasszon kategóriát</option>
                      {categorySelectOptions.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className={labelCls}>ÁFA beállítás</label>
                    <div className="space-y-2 rounded-xl border border-brand-200 p-3">
                      <label className="flex items-center gap-2 text-sm text-slate-700">
                        <input
                          type="radio"
                          name="vat-mode"
                          checked={modal === "create" ? productVatMode === "inherit" : editVatMode === "inherit"}
                          onChange={() => modal === "create" ? setProductVatMode("inherit") : setEditVatMode("inherit")}
                        />
                        Kategória alapértelmezett (ha van)
                      </label>
                      <label className="flex items-center gap-2 text-sm text-slate-700">
                        <input
                          type="radio"
                          name="vat-mode"
                          checked={modal === "create" ? productVatMode === "custom" : editVatMode === "custom"}
                          onChange={() => modal === "create" ? setProductVatMode("custom") : setEditVatMode("custom")}
                        />
                        Egyedi termék ÁFA
                      </label>
                      {(modal === "create" ? productVatMode === "custom" : editVatMode === "custom") ? (
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={modal === "create" ? productVatRate : editVatRate}
                          onChange={(e) => modal === "create" ? setProductVatRate(e.target.value) : setEditVatRate(e.target.value)}
                          onWheel={blurNumberInputOnWheel}
                          placeholder="pl. 27"
                          className={inputCls}
                        />
                      ) : null}
                    </div>
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
