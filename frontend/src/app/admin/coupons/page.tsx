"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/supabase";

type Coupon = Database["public"]["Tables"]["coupons"]["Row"];
type Product = Pick<Database["public"]["Tables"]["products"]["Row"], "id" | "name" | "slug">;

const inputCls = "w-full rounded-xl border border-brand-200 px-3 py-2.5 text-sm outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-100";
const labelCls = "mb-1 block text-xs font-semibold text-red-950/70";

function toLocalDatetime(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

type FormMode = "create" | "edit" | null;

export default function AdminCouponsPage() {
  const [loading, setLoading] = useState(true);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [formMode, setFormMode] = useState<FormMode>(null);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState<"percent" | "fixed">("percent");
  const [discountValue, setDiscountValue] = useState("");
  const [description, setDescription] = useState("");
  const [minOrderAmount, setMinOrderAmount] = useState("");
  const [maxUses, setMaxUses] = useState("");
  const [maxUsesPerUser, setMaxUsesPerUser] = useState("");
  const [validFrom, setValidFrom] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [appliesToAll, setAppliesToAll] = useState(true);
  const [isPublic, setIsPublic] = useState(true);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [productSearch, setProductSearch] = useState("");

  const loadData = useCallback(async () => {
    const [{ data: couponData, error }, { data: productData }] = await Promise.all([
      supabase.from("coupons").select("*").order("created_at", { ascending: false }),
      supabase.from("products").select("id, name, slug").eq("is_active", true).order("name", { ascending: true }),
    ]);
    if (error) { setActionError(error.message); setLoading(false); return; }
    setCoupons(couponData ?? []);
    setAllProducts(productData ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadData();
  }, [loadData]);

  useEffect(() => {
    if (!actionError) return;
    const t = window.setTimeout(() => setActionError(null), 5000);
    return () => window.clearTimeout(t);
  }, [actionError]);

  useEffect(() => {
    if (!actionSuccess) return;
    const t = window.setTimeout(() => setActionSuccess(null), 5000);
    return () => window.clearTimeout(t);
  }, [actionSuccess]);

  function resetForm() {
    setCode(""); setDiscountType("percent"); setDiscountValue(""); setDescription("");
    setMinOrderAmount(""); setMaxUses(""); setMaxUsesPerUser("");
    setValidFrom(""); setExpiresAt("");
    setAppliesToAll(true); setIsPublic(true); setSelectedProductIds([]);
    setProductSearch(""); setEditingCoupon(null);
  }

  function openCreate() {
    resetForm();
    setFormMode("create");
  }

  function openEdit(coupon: Coupon) {
    const restrictedIds = coupon.restricted_product_ids as string[] | null;
    setCode(coupon.code);
    setDiscountType(coupon.discount_type as "percent" | "fixed");
    setDiscountValue(String(coupon.discount_value));
    setDescription(coupon.description ?? "");
    setMinOrderAmount(coupon.min_order_amount != null ? String(coupon.min_order_amount) : "");
    setMaxUses(coupon.max_uses != null ? String(coupon.max_uses) : "");
    setMaxUsesPerUser(coupon.max_uses_per_user != null ? String(coupon.max_uses_per_user) : "");
    setValidFrom(toLocalDatetime(coupon.valid_from));
    setExpiresAt(toLocalDatetime(coupon.expires_at));
    setAppliesToAll(!restrictedIds || restrictedIds.length === 0);
    setIsPublic(coupon.is_public);
    setSelectedProductIds(restrictedIds ?? []);
    setProductSearch("");
    setEditingCoupon(coupon);
    setFormMode("edit");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function closeForm() {
    resetForm();
    setFormMode(null);
  }

  function toggleProduct(id: string) {
    setSelectedProductIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function validateForm(): string | null {
    if (!code.trim()) return "A kuponkód megadása kötelező.";
    const val = Number(discountValue);
    if (!discountValue || isNaN(val) || val <= 0) return "Érvényes kedvezmény értéket adj meg.";
    if (discountType === "percent" && val > 100) return "Százalékos kedvezmény nem lehet több mint 100%.";
    if (!appliesToAll && selectedProductIds.length === 0) return "Válassz ki legalább egy terméket.";
    return null;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setActionError(null);
    const err = validateForm();
    if (err) { setActionError(err); return; }
    if (isSubmitting) return;
    setIsSubmitting(true);

    const payload = {
      code: code.trim().toUpperCase(),
      discount_type: discountType,
      discount_value: Number(discountValue),
      description: description.trim() || null,
      min_order_amount: minOrderAmount ? Number(minOrderAmount) : null,
      max_uses: maxUses ? Number(maxUses) : null,
      max_uses_per_user: maxUsesPerUser ? Number(maxUsesPerUser) : null,
      valid_from: validFrom ? new Date(validFrom).toISOString() : null,
      expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
      applies_to_sale_items: false,
      restricted_product_ids: appliesToAll ? null : selectedProductIds,
      is_public: isPublic,
    };

    try {
      if (formMode === "edit" && editingCoupon) {
        const { error } = await supabase.from("coupons").update(payload).eq("id", editingCoupon.id);
        if (error) { setActionError(error.message); return; }
        setActionSuccess(`Kupon frissítve: ${payload.code}`);
      } else {
        const { error } = await supabase.from("coupons").insert({ ...payload, is_active: true });
        if (error) { setActionError(error.message); return; }
        setActionSuccess(`Kupon létrehozva: ${payload.code}`);
      }
      closeForm();
      await loadData();
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleToggleActive(coupon: Coupon) {
    const { error } = await supabase.from("coupons").update({ is_active: !coupon.is_active }).eq("id", coupon.id);
    if (error) { setActionError(error.message); return; }
    setActionSuccess("Kupon frissítve.");
    await loadData();
  }

  async function handleDelete(coupon: Coupon) {
    const confirmed = window.confirm(`Biztosan törlöd a(z) "${coupon.code}" kupont?`);
    if (!confirmed) return;
    const { error } = await supabase.from("coupons").delete().eq("id", coupon.id);
    if (error) { setActionError(error.message); return; }
    setActionSuccess("Kupon törölve.");
    if (editingCoupon?.id === coupon.id) closeForm();
    await loadData();
  }

  function discountLabel(coupon: Coupon) {
    if (coupon.discount_type === "percent") return `-${coupon.discount_value}%`;
    return `-${Number(coupon.discount_value).toLocaleString("hu-HU")} Ft`;
  }

  function couponStatus(coupon: Coupon): { label: string; cls: string } {
    const now = new Date();
    if (!coupon.is_active) return { label: "Inaktív", cls: "bg-slate-100 border-slate-200 text-slate-500" };
    if (coupon.valid_from && new Date(coupon.valid_from) > now) return { label: "Még nem aktív", cls: "bg-amber-50 border-amber-200 text-amber-700" };
    if (coupon.expires_at && new Date(coupon.expires_at) < now) return { label: "Lejárt", cls: "bg-rose-50 border-rose-200 text-rose-600" };
    if (coupon.max_uses != null && coupon.used_count >= coupon.max_uses) return { label: "Kimerült", cls: "bg-slate-100 border-slate-200 text-slate-500" };
    return { label: "Aktív", cls: "bg-emerald-50 border-emerald-200 text-emerald-700" };
  }

  const filteredProducts = allProducts.filter((p) =>
    p.name.toLowerCase().includes(productSearch.toLowerCase())
  );

  const isFormOpen = formMode !== null;
  const formTitle = formMode === "edit" ? `Szerkesztés: ${editingCoupon?.code}` : "Új kupon létrehozása";

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-brand-700">Admin</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">Kuponok kezelése</h1>
        </div>
        <button
          onClick={isFormOpen ? closeForm : openCreate}
          className={`btn-press flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white shadow-sm transition ${isFormOpen ? "bg-slate-600 hover:bg-slate-700" : "bg-brand-900 hover:bg-brand-800"}`}
        >
          {isFormOpen ? (
            <>
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
              Bezárás
            </>
          ) : (
            <>
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14m-7-7h14" /></svg>
              Új kupon
            </>
          )}
        </button>
      </div>

      {actionError ? <div className="rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm font-medium text-rose-700">{actionError}</div> : null}
      {actionSuccess ? <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm font-medium text-emerald-700">{actionSuccess}</div> : null}

      {isFormOpen ? (
        <div className="rounded-2xl border border-brand-100 bg-white p-6 shadow-sm">
          <h2 className="mb-5 text-base font-bold text-slate-900">{formTitle}</h2>
          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5">

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelCls}>Kuponkód *</label>
                <input type="text" required value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="pl. NYAR2026" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Típus *</label>
                <select value={discountType} onChange={(e) => setDiscountType(e.target.value as "percent" | "fixed")} className={inputCls}>
                  <option value="percent">Százalékos (%)</option>
                  <option value="fixed">Fix összeg (Ft)</option>
                </select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className={labelCls}>Érték * ({discountType === "percent" ? "%" : "Ft"})</label>
                <input type="number" min="0" step="0.01" required placeholder={discountType === "percent" ? "pl. 10" : "pl. 500"} value={discountValue} onChange={(e) => setDiscountValue(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Min. vásárlási összeg (Ft)</label>
                <input type="number" min="0" step="1" placeholder="Üresen = nincs minimum" value={minOrderAmount} onChange={(e) => setMinOrderAmount(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Max. összes felhasználás</label>
                <input type="number" min="1" step="1" placeholder="Üresen = korlátlan" value={maxUses} onChange={(e) => setMaxUses(e.target.value)} className={inputCls} />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className={labelCls}>Max. használat / felhasználó</label>
                <input type="number" min="1" step="1" placeholder="Üresen = korlátlan" value={maxUsesPerUser} onChange={(e) => setMaxUsesPerUser(e.target.value)} className={inputCls} />
                <p className="mt-1 text-xs text-red-950/50">pl. 1 = mindenki csak egyszer</p>
              </div>
              <div>
                <label className={labelCls}>Érvényesség kezdete</label>
                <input type="datetime-local" value={validFrom} onChange={(e) => setValidFrom(e.target.value)} className={inputCls} />
                <p className="mt-1 text-xs text-red-950/50">Üresen = azonnal aktív</p>
              </div>
              <div>
                <label className={labelCls}>Érvényesség vége</label>
                <input type="datetime-local" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} className={inputCls} />
                <p className="mt-1 text-xs text-red-950/50">Üresen = nincs lejárat</p>
              </div>
            </div>

            <div>
              <label className={labelCls}>Leírás (belső megjegyzés)</label>
              <textarea rows={2} placeholder="pl. Nyári akció – hírlevél feliratkozóknak" value={description} onChange={(e) => setDescription(e.target.value)} className={`${inputCls} resize-none`} />
            </div>

            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-brand-100 bg-brand-50/30 p-4">
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="h-4 w-4 accent-brand-800"
              />
              <div>
                <p className="text-sm font-semibold text-red-950">Publikus kupon (megjelenik a fiókban)</p>
                <p className="text-xs text-red-950/50">
                  Ha nincs bepipálva, a kupon rejtett marad: checkoutnál beírható a kód, de nem listázzuk a felhasználóknak.
                </p>
              </div>
            </label>

            <div className="space-y-3 rounded-xl border border-brand-100 bg-brand-50/30 p-4">
              <label className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={appliesToAll}
                  onChange={(e) => { setAppliesToAll(e.target.checked); if (e.target.checked) setSelectedProductIds([]); }}
                  className="h-4 w-4 accent-brand-800"
                />
                <div>
                  <p className="text-sm font-semibold text-red-950">Minden termékre érvényes</p>
                  <p className="text-xs text-red-950/50">Ha nincs bepipálva, ki kell választani, mely termékekre vonatkozik.</p>
                </div>
              </label>

              {!appliesToAll ? (
                <div className="mt-2 space-y-2">
                  <p className="text-xs font-bold text-brand-700">Termékek kiválasztása ({selectedProductIds.length} kijelölve)</p>
                  <input type="text" placeholder="Keresés termék neve alapján..." value={productSearch} onChange={(e) => setProductSearch(e.target.value)} className={inputCls} />
                  <div className="max-h-56 overflow-y-auto rounded-xl border border-brand-200 bg-white divide-y divide-brand-50">
                    {filteredProducts.length === 0 ? (
                      <p className="p-4 text-xs text-red-950/40">Nincs találat.</p>
                    ) : (
                      filteredProducts.map((p) => (
                        <label key={p.id} className="flex cursor-pointer items-center gap-3 px-4 py-2.5 transition hover:bg-brand-50">
                          <input type="checkbox" checked={selectedProductIds.includes(p.id)} onChange={() => toggleProduct(p.id)} className="h-4 w-4 accent-brand-800" />
                          <span className="text-sm text-slate-900">{p.name}</span>
                        </label>
                      ))
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setSelectedProductIds(filteredProducts.map((p) => p.id))} className="rounded-lg border border-brand-200 px-3 py-1.5 text-xs font-bold text-brand-900 hover:bg-brand-50 transition">Összes kijelölése</button>
                    <button type="button" onClick={() => setSelectedProductIds([])} className="rounded-lg border border-brand-200 px-3 py-1.5 text-xs font-semibold text-red-950/60 hover:bg-brand-50 transition">Kijelölés törlése</button>
                  </div>
                </div>
              ) : null}

              <p className="text-xs text-amber-700 font-semibold border-t border-brand-100 pt-3">
                ⚠ Leárazott árú termék esetén a kupon soha nem érvényesíthető, kivétel nélkül.
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={closeForm} className="rounded-xl border border-brand-200 px-4 py-2.5 text-sm font-semibold text-brand-900 transition hover:bg-brand-50">
                Mégse
              </button>
              <button type="submit" disabled={isSubmitting} className="btn-press rounded-xl bg-brand-900 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-brand-800 disabled:opacity-50">
                {isSubmitting ? "Mentés..." : formMode === "edit" ? "Módosítások mentése" : "Kupon létrehozása"}
              </button>
            </div>
          </form>
        </div>
      ) : null}

      <div className="rounded-2xl border border-brand-100 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="space-y-2 p-4">{[...Array(4)].map((_, i) => <div key={i} className="skeleton h-12 rounded-xl" />)}</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-brand-50 bg-brand-50/30">
                <th className="p-4 text-left font-bold uppercase tracking-wider text-xs text-brand-900">Kód</th>
                <th className="p-4 text-left font-bold uppercase tracking-wider text-xs text-brand-900">Kedvezmény</th>
                <th className="p-4 text-left font-bold uppercase tracking-wider text-xs text-brand-900">Hatókör</th>
                <th className="p-4 text-center font-bold uppercase tracking-wider text-xs text-brand-900">Felhasználás</th>
                <th className="p-4 text-left font-bold uppercase tracking-wider text-xs text-brand-900">Érvényesség</th>
                <th className="p-4 text-left font-bold uppercase tracking-wider text-xs text-brand-900">Láthatóság</th>
                <th className="p-4 text-center font-bold uppercase tracking-wider text-xs text-brand-900">Státusz</th>
                <th className="p-4 text-right font-bold uppercase tracking-wider text-xs text-brand-900">Műveletek</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-50">
              {coupons.length === 0 ? (
                <tr><td colSpan={8} className="p-8 text-center text-sm text-red-950/50">Még nincs kupon.</td></tr>
              ) : (
                coupons.map((coupon) => {
                  const st = couponStatus(coupon);
                  const restrictedIds = coupon.restricted_product_ids as string[] | null;
                  const scopeLabel = restrictedIds && restrictedIds.length > 0 ? `${restrictedIds.length} termék` : "Minden termék";
                  const isBeingEdited = editingCoupon?.id === coupon.id;
                  return (
                    <tr key={coupon.id} className={`transition hover:bg-brand-50/30 ${isBeingEdited ? "bg-brand-50/60" : ""}`}>
                      <td className="p-4">
                        <span className={`rounded-lg border px-2.5 py-1 font-mono text-sm font-bold ${isBeingEdited ? "border-brand-400 bg-brand-100 text-brand-900" : "border-brand-200 bg-brand-50 text-brand-900"}`}>
                          {coupon.code}
                        </span>
                      </td>
                      <td className="p-4 font-bold text-emerald-700">{discountLabel(coupon)}</td>
                      <td className="p-4 text-xs text-red-950/70">{scopeLabel}</td>
                      <td className="p-4 text-center text-sm text-red-950/70">
                        <p>{coupon.used_count}{coupon.max_uses != null ? ` / ${coupon.max_uses}` : ""}</p>
                        {coupon.max_uses_per_user != null ? <p className="text-xs text-red-950/40">{coupon.max_uses_per_user}×/fő</p> : null}
                      </td>
                      <td className="p-4 text-xs text-red-950/70 space-y-0.5">
                        {coupon.valid_from ? <p>Tól: {new Date(coupon.valid_from).toLocaleDateString("hu-HU")}</p> : null}
                        {coupon.expires_at ? <p>Ig: {new Date(coupon.expires_at).toLocaleDateString("hu-HU")}</p> : <p className="text-red-950/40">—</p>}
                        {coupon.min_order_amount ? <p className="text-red-950/40">Min: {Number(coupon.min_order_amount).toLocaleString("hu-HU")} Ft</p> : null}
                      </td>
                      <td className="p-4 text-center">
                        <span className={`rounded-full border px-2.5 py-0.5 text-xs font-bold ${coupon.is_public ? "bg-sky-50 border-sky-200 text-sky-700" : "bg-slate-100 border-slate-200 text-slate-600"}`}>
                          {coupon.is_public ? "Publikus" : "Rejtett"}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <span className={`rounded-full border px-2.5 py-0.5 text-xs font-bold ${st.cls}`}>{st.label}</span>
                      </td>
                      <td className="p-4">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => openEdit(coupon)}
                            className="rounded-lg border border-brand-200 px-3 py-1.5 text-xs font-bold text-brand-900 transition hover:bg-brand-50"
                          >
                            Szerkesztés
                          </button>
                          <button onClick={() => void handleToggleActive(coupon)} className={`rounded-lg border px-3 py-1.5 text-xs font-bold transition ${coupon.is_active ? "border-amber-200 text-amber-700 hover:bg-amber-50" : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"}`}>
                            {coupon.is_active ? "Inaktiválás" : "Aktiválás"}
                          </button>
                          <button onClick={() => void handleDelete(coupon)} className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-bold text-rose-600 transition hover:bg-rose-50">
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
    </div>
  );
}
