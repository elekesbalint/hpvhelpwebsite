"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { resolveExportArticleNumber } from "@/lib/integrations/naturasoft/article-number";
import { billingAddressDisplay, billingNameDisplay } from "@/lib/order-billing";
import { formatOrderPublicId } from "@/lib/order-display-id";
import {
  defaultLabelFilename,
  downloadShippingLabelPdf,
  orderCanCreateShippingLabel,
  requestShippingLabel,
} from "@/lib/shipping/admin-label-client";
import { effectiveShippingMethod, pickupProviderLabel, shippingMethodLabel } from "@/lib/shipping/carrier";
import { orderEligibleForSimplePayRetry, startSimplePayPaymentForOrder } from "@/lib/simplepay-retry-client";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/supabase";

type Order = Database["public"]["Tables"]["orders"]["Row"];
type OrderItem = Database["public"]["Tables"]["order_items"]["Row"];
type ProductSkuRow = Pick<Database["public"]["Tables"]["products"]["Row"], "id" | "sku" | "slug" | "description">;
type OrderStatus = Database["public"]["Enums"]["order_status"];

function getOrderExtra(order: Order | null): { shipping_email?: string; payment_method?: string | null } {
  return (order ?? {}) as { shipping_email?: string; payment_method?: string | null };
}

function getPaymentLabel(order: Order, paymentMethod?: string | null): string {
  if (paymentMethod === "card") return "Bankkártyás fizetés (SimplePay)";
  if (paymentMethod === "transfer") return "Banki átutalás";
  if (paymentMethod === "cod") return "Utánvét";

  if (order.payment_provider === "simplepay") return "Bankkártyás fizetés (SimplePay)";
  if (order.payment_provider === "manual_transfer") return "Banki átutalás";
  if (order.payment_provider === "manual_cod") return "Utánvét";
  return order.payment_provider ?? "—";
}

const statusConfig: Record<string, { label: string; color: string }> = {
  pending:    { label: "Függőben",      color: "bg-amber-50 text-amber-700 border-amber-200" },
  processing: { label: "Feldolgozás",   color: "bg-blue-50 text-blue-700 border-blue-200" },
  shipped:    { label: "Elküldve",      color: "bg-brand-50 text-sky-700 border-brand-200" },
  delivered:  { label: "Kézbesítve",    color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  paid:       { label: "Fizetve",       color: "bg-green-50 text-green-700 border-green-200" },
  fulfilled:  { label: "Futárnak átadva", color: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  cancelled:  { label: "Lemondva",      color: "bg-rose-50 text-rose-700 border-rose-200" },
  refunded:   { label: "Visszatérítve", color: "bg-purple-50 text-purple-700 border-purple-200" },
};

const ALL_STATUSES: OrderStatus[] = ["pending", "paid", "fulfilled", "cancelled", "refunded"];

type EmailApiResponse = { ok?: boolean; skipped?: string; detail?: string; error?: string };

async function readEmailApiResponse(response: Response): Promise<EmailApiResponse> {
  const raw = await response.text();
  if (!raw.trim()) return {};
  try {
    return JSON.parse(raw) as EmailApiResponse;
  } catch {
    return { error: raw.slice(0, 300) };
  }
}

export default function AdminOrderDetailsPage() {
  const params = useParams<{ id: string }>();
  const orderId = params.id;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [retryPayLoading, setRetryPayLoading] = useState(false);
  const [labelLoading, setLabelLoading] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [productsById, setProductsById] = useState<Map<string, ProductSkuRow>>(new Map());
  const [natursoftResetLoading, setNatursoftResetLoading] = useState(false);
  const [natursoftPreviewLoading, setNatursoftPreviewLoading] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    const [{ data: orderRow, error: orderError }, { data: orderItems, error: orderItemsError }] =
      await Promise.all([
        supabase.from("orders").select("*").eq("id", orderId).maybeSingle(),
        supabase.from("order_items").select("*").eq("order_id", orderId).order("created_at", { ascending: true }),
      ]);

    if (orderError || !orderRow) {
      setError(orderError?.message ?? "A rendelés nem található.");
      setLoading(false);
      return;
    }

    if (orderItemsError) {
      setError(orderItemsError.message);
      setLoading(false);
      return;
    }

    setOrder(orderRow);
    setItems(orderItems ?? []);

    const productIds = Array.from(
      new Set((orderItems ?? []).map((item) => item.product_id).filter(Boolean)),
    ) as string[];
    if (productIds.length > 0) {
      const { data: products } = await supabase
        .from("products")
        .select("id, sku, slug, description")
        .in("id", productIds);
      setProductsById(new Map((products ?? []).map((p) => [p.id, p])));
    } else {
      setProductsById(new Map());
    }

    setLoading(false);
  }, [orderId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadData();
  }, [loadData]);

  useEffect(() => {
    if (!error) return;
    const timeout = window.setTimeout(() => setError(null), 5000);
    return () => window.clearTimeout(timeout);
  }, [error]);

  useEffect(() => {
    if (!success) return;
    const timeout = window.setTimeout(() => setSuccess(null), 5000);
    return () => window.clearTimeout(timeout);
  }, [success]);

  async function handleStatusChange(status: OrderStatus) {
    if (!order) return;
    if (status === "cancelled" || status === "refunded") {
      const confirmed = window.confirm(`Biztosan "${statusConfig[status]?.label}" státuszra állítod?`);
      if (!confirmed) return;
    }
    setError(null); setSuccess(null);

    const { error: updateError } = await supabase.from("orders").update({ status }).eq("id", order.id);
    if (updateError) { setError(updateError.message); return; }

    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      await supabase.from("admin_actions").insert({
        admin_user_id: session.user.id,
        action_type: "order_status_updated",
        entity_type: "order",
        entity_id: order.id,
        meta: { from: order.status, to: status } as Database["public"]["Tables"]["admin_actions"]["Insert"]["meta"],
      });
    }

    if (status === "fulfilled" && order.status !== "fulfilled") {
      const orderExtra = getOrderExtra(order);
      let recipientEmail = (order.shipping_email ?? orderExtra.shipping_email)?.trim() ?? "";
      let recipientName = order.shipping_name?.trim() || "Vásárló";

      if (!recipientEmail) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("email, full_name")
          .eq("id", order.user_id)
          .maybeSingle();
        recipientEmail = profile?.email?.trim() ?? "";
        recipientName = profile?.full_name?.trim() || recipientName;
      }

      if (recipientEmail) {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;
        if (token) {
          try {
            const emailRes = await fetch("/api/email/courier-assigned", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ orderId: order.id }),
            });
            const emailJson = await readEmailApiResponse(emailRes);
            if (!emailRes.ok || emailJson.ok === false) {
              console.error("[admin/orders/id] courier email failed", emailJson);
              setSuccess(`Rendelés státusza frissítve (futárnak átadva), de az email küldés nem sikerült: ${emailJson.error ?? emailJson.skipped ?? emailJson.detail ?? "ismeretlen hiba"}`);
              await loadData();
              return;
            }
          } catch (e) {
            console.error("[admin/orders/id] courier email fetch error", e);
          }
        }
      } else {
        setSuccess("Rendelés státusza frissítve, de nem találtunk email címet az értesítéshez.");
        await loadData();
        return;
      }
    }

    setSuccess("Rendelés státusza frissítve. Futárnak átadva email elküldve.");
    await loadData();
  }

  async function handleCreateShippingLabel() {
    if (!order) return;
    setError(null);
    setSuccess(null);
    setLabelLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) {
        setError("Nincs aktív admin munkamenet.");
        return;
      }
      const json = await requestShippingLabel(order.id, token);
      downloadShippingLabelPdf(json.pdfBase64, defaultLabelFilename(order.id, json.filename));
      setSuccess(
        `Címirat elkészült, rendelés státusza: Futárnak átadva (${json.carrier?.toUpperCase() ?? "futár"}${json.trackingNumber ? `, azonosító: ${json.trackingNumber}` : ""}).`
      );
      await loadData();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Címirat generálás sikertelen.");
    } finally {
      setLabelLoading(false);
    }
  }

  async function handleRetrySimplePayPayment() {
    if (!order) return;
    setError(null);
    setSuccess(null);
    setRetryPayLoading(true);
    const result = await startSimplePayPaymentForOrder(order.id);
    setRetryPayLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setSuccess("SimplePay fizetőoldal megnyitása…");
  }

  async function handleResetNatursoftExport() {
    if (!order) return;
    const confirmed = window.confirm(
      "A NaturaSoft export jelölés törlődik — a következő import újra felveszi ezt a rendelést. Előtte töröld a hibás megrendelést a NaturaSoftban. Folytatod?",
    );
    if (!confirmed) return;

    setError(null);
    setSuccess(null);
    setNatursoftResetLoading(true);

    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) {
      setNatursoftResetLoading(false);
      setError("Nincs aktív admin munkamenet.");
      return;
    }

    try {
      const res = await fetch("/api/admin/integrations/naturasoft/reset-export", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ orderId: order.id }),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok) {
        setError(json.error ?? "NaturaSoft export visszaállítás sikertelen.");
        return;
      }
      setSuccess("NaturaSoft export jelölés törölve. A NaturaSoft következő lekérésekor újra importálható.");
      await loadData();
    } catch (e) {
      setError(e instanceof Error ? e.message : "NaturaSoft export visszaállítás sikertelen.");
    } finally {
      setNatursoftResetLoading(false);
    }
  }

  async function handleNatursoftXmlPreview() {
    if (!order) return;
    setError(null);
    setNatursoftPreviewLoading(true);

    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) {
      setNatursoftPreviewLoading(false);
      setError("Nincs aktív admin munkamenet.");
      return;
    }

    try {
      const res = await fetch(
        `/api/admin/integrations/naturasoft/export?include_exported=1&order_id=${order.id}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const xml = await res.text();
      if (!res.ok) {
        setError(xml.slice(0, 300) || "XML előnézet sikertelen.");
        return;
      }
      const tetelCount = (xml.match(/<tetel>/g) ?? []).length;
      if (tetelCount < 2) {
        setError(`Figyelem: az XML-ben csak ${tetelCount} tételsor van — ellenőrizd a rendelési tételeket.`);
      } else if (/ISMERETLEN|<cikkszam>ZNS/i.test(xml)) {
        setError(
          "Figyelem: az XML-ben hibás cikkszám van (ISMERETLEN vagy ZNS*) — admin SKU legyen SAM001, SUN594 stb.",
        );
      } else if (!/<cikkszam>SAM001<\/cikkszam>|<cikkszam>SUN594<\/cikkszam>/.test(xml) && tetelCount >= 2) {
        setError("Figyelem: az XML-ben nincs ismert termék cikkszám (SAM001, SUN594) — ellenőrizd a termék SKU-t.");
      }
      const blob = new Blob([xml], { type: "application/xml" });
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "XML előnézet sikertelen.");
    } finally {
      setNatursoftPreviewLoading(false);
    }
  }


  const st = order ? (statusConfig[order.status] ?? { label: order.status, color: "bg-slate-100 text-slate-600 border-slate-200" }) : null;
  const orderExtra = getOrderExtra(order);
  const canCreateLabel = order ? orderCanCreateShippingLabel(order) : false;

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-brand-700">Admin / Rendelések</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">Rendelés részletei</h1>
        </div>
        <Link
          href="/admin/orders"
          className="flex items-center gap-2 rounded-xl border border-brand-200 px-4 py-2.5 text-sm font-semibold text-brand-900 transition hover:bg-brand-50"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Vissza
        </Link>
      </div>

      {error ? <div className="rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm font-medium text-rose-700">{error}</div> : null}
      {success ? <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm font-medium text-emerald-700">{success}</div> : null}

      {loading ? (
        <div className="space-y-4">
          <div className="skeleton h-40 rounded-2xl" />
          <div className="skeleton h-32 rounded-2xl" />
        </div>
      ) : null}

      {!loading && order ? (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-2xl border border-brand-100 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">Rendelésszám</p>
                  <p className="mt-1 font-mono text-sm font-semibold text-slate-900" title={order.id}>
                    {formatOrderPublicId(order)}
                  </p>
                </div>
                {st ? (
                  <span className={`rounded-full border px-3 py-1 text-sm font-bold ${st.color}`}>{st.label}</span>
                ) : null}
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold text-red-950/50">Dátum</p>
                  <p className="mt-0.5 text-sm text-slate-900">{new Date(order.created_at).toLocaleString("hu-HU")}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-red-950/50">Összeg</p>
                  <div className="mt-0.5 space-y-0.5">
                    {Number(order.discount) > 0 ? (
                      <p className="text-xs text-red-950/50">
                        Részösszeg: {Number(order.subtotal).toLocaleString("hu-HU")} {order.currency}
                      </p>
                    ) : null}
                    {order.coupon_code && Number(order.discount) > 0 ? (
                      <p className="text-xs text-emerald-700 font-semibold">
                        Kupon ({order.coupon_code}): −{Number(order.discount).toLocaleString("hu-HU")} {order.currency}
                      </p>
                    ) : null}
                    <p className="text-sm font-bold text-brand-900">{Number(order.total).toLocaleString("hu-HU")} {order.currency}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-red-950/50">Fizetési mód</p>
                  <p className="mt-0.5 text-sm text-slate-900">{orderExtra.payment_method ?? "—"}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-red-950/50">Vásárló ID</p>
                  <p className="mt-0.5 font-mono text-xs text-red-950/60">{order.user_id}</p>
                </div>
              </div>

              <div className="mt-5 border-t border-brand-50 pt-5">
                <p className="mb-3 text-xs font-bold uppercase tracking-wider text-brand-700">Státusz módosítása</p>
                <div className="flex flex-wrap gap-2">
                  {ALL_STATUSES.map((s) => (
                    <button
                      key={s}
                      onClick={() => void handleStatusChange(s)}
                      className={`rounded-xl border px-3 py-1.5 text-xs font-bold transition ${
                        order.status === s
                          ? "border-brand-700 bg-brand-900 text-white"
                          : "border-brand-200 text-brand-900 hover:bg-brand-50"
                      }`}
                    >
                      {statusConfig[s]?.label ?? s}
                    </button>
                  ))}
                </div>
                {order.payment_provider === "simplepay" && orderEligibleForSimplePayRetry(order) ? (
                  <div className="mt-3">
                    <div className="rounded-xl border border-amber-200 bg-amber-50/80 px-3 py-2 text-xs text-amber-950">
                      <p className="font-bold text-amber-900">Sikertelen vagy függőben lévő kártyás fizetés</p>
                      <p className="mt-0.5 text-amber-900/90">
                        A vásárló ugyanezen a rendelésen újra megnyithatja a SimplePay oldalt; adminként is elindíthatod helyette (pl. telefonos egyeztetés után).
                      </p>
                      <button
                        type="button"
                        disabled={retryPayLoading}
                        onClick={() => void handleRetrySimplePayPayment()}
                        className="mt-2 w-full rounded-lg border border-brand-700 bg-brand-900 px-3 py-2 text-xs font-bold text-white transition hover:bg-brand-800 disabled:opacity-50 sm:w-auto"
                      >
                        {retryPayLoading ? "Indítás…" : "SimplePay fizetés újraindítása"}
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="rounded-2xl border border-brand-100 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-base font-bold text-slate-900">Rendelt tételek</h2>
              {items.length === 0 ? (
                <p className="text-sm text-red-950/50">Nincs tétel ebben a rendelésben.</p>
              ) : (
                <div className="space-y-2">
                  {items.map((item) => {
                    const product = item.product_id ? productsById.get(item.product_id) : undefined;
                    const exportSku = resolveExportArticleNumber(item, product);
                    const skuWarning = exportSku === "ISMERETLEN";
                    return (
                    <div
                      key={item.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-brand-100 bg-brand-50/30 px-4 py-3 text-sm"
                    >
                      <div className="min-w-0">
                        <span className="font-semibold text-slate-900">{item.product_name}</span>
                        <p className={`mt-0.5 text-xs ${skuWarning ? "font-semibold text-rose-700" : "text-red-950/55"}`}>
                          NaturaSoft cikkszám: {exportSku}
                          {skuWarning ? " — hiányzik, a tétel kimaradhat az importból!" : null}
                        </p>
                      </div>
                      <span className="font-semibold text-brand-900">
                        {item.quantity} × {Number(item.unit_price).toLocaleString("hu-HU")} Ft = {Number(item.line_total).toLocaleString("hu-HU")} Ft
                      </span>
                    </div>
                    );
                  })}
                  <div className="flex justify-end border-t border-brand-100 pt-3">
                    <p className="text-base font-bold text-brand-900">
                      Összesen: {Number(order.total).toLocaleString("hu-HU")} Ft
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-brand-100 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-base font-bold text-slate-900">Szállítási adatok</h2>
              <div className="space-y-3 text-sm">
                {[
                  { label: "Szállítási mód", value: shippingMethodLabel(effectiveShippingMethod(order) ?? order.shipping_method) },
                  ...(order.pickup_point_name
                    ? [
                        { label: "Csomagpont", value: order.pickup_point_name },
                        { label: "Szolgáltató", value: pickupProviderLabel(order.pickup_point_provider) },
                        { label: "Csomagpont cím", value: order.pickup_point_address },
                      ]
                    : []),
                  { label: "Szállítási név", value: order.shipping_name },
                  { label: "Telefonszám", value: order.shipping_phone },
                  { label: "E-mail", value: order.shipping_email ?? orderExtra.shipping_email },
                  { label: "Szállítási cím", value: order.shipping_address },
                  { label: "Csomagszám", value: order.tracking_number },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-xs font-semibold text-red-950/50">{label}</p>
                    <p className="mt-0.5 text-slate-900">{value?.trim() ? value : "—"}</p>
                  </div>
                ))}
                {canCreateLabel ? (
                  <button
                    type="button"
                    disabled={labelLoading}
                    onClick={() => void handleCreateShippingLabel()}
                    className="mt-2 w-full rounded-xl border border-brand-700 bg-brand-900 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-brand-800 disabled:opacity-50"
                  >
                    {labelLoading ? "Címirat készítése…" : "Címirat generálása (PDF)"}
                  </button>
                ) : (
                  <p className="text-xs text-red-950/50">
                    Automatikus címirat csak Posta/GLS/Csomagpont szállításnál érhető el.
                  </p>
                )}
              </div>
            </div>

            {order.notes?.trim() ? (
              <div className="rounded-2xl border border-brand-100 bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-base font-bold text-slate-900">Megjegyzés a rendeléshez</h2>
                <p className="whitespace-pre-wrap text-sm text-slate-900">{order.notes}</p>
              </div>
            ) : null}

            {(order.status === "paid" || order.status === "fulfilled") ? (
              <div className="rounded-2xl border border-brand-100 bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-base font-bold text-slate-900">NaturaSoft export</h2>
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-xs font-semibold text-red-950/50">Export státusz</p>
                    <p className="mt-0.5 text-slate-900">
                      {order.natursoft_exported_at
                        ? `Exportálva: ${new Date(order.natursoft_exported_at).toLocaleString("hu-HU")}`
                        : "Még nem exportált (várólistán)"}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      disabled={natursoftPreviewLoading}
                      onClick={() => void handleNatursoftXmlPreview()}
                      className="rounded-xl border border-brand-200 px-4 py-2.5 text-xs font-bold text-brand-900 transition hover:bg-brand-50 disabled:opacity-50"
                    >
                      {natursoftPreviewLoading ? "XML betöltése…" : "XML előnézet (ez a rendelés)"}
                    </button>
                    <button
                      type="button"
                      disabled={natursoftResetLoading}
                      onClick={() => void handleResetNatursoftExport()}
                      className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-xs font-bold text-amber-950 transition hover:bg-amber-100 disabled:opacity-50"
                    >
                      {natursoftResetLoading ? "Feldolgozás…" : "Újra-exportálás engedélyezése"}
                    </button>
                  </div>
                  <p className="text-xs text-red-950/50">
                    Ha a NaturaSoftban hiányos a rendelés: töröld ott a megrendelést, majd kattints az újra-export gombra.
                  </p>
                  <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-3 text-xs text-amber-950">
                    <p className="font-bold">Ha csak a postaköltség jön át, a termékek nem:</p>
                    <ul className="mt-1 list-inside list-disc space-y-0.5">
                      <li>NaturaSoft 4. lépés szekció: <strong>tetelek</strong> (NE tetelek/tetel)</li>
                      <li>Termék azonosítás: <strong>Cikkszám alapján</strong></li>
                      <li>NaturaSoft 2. lépés: <strong>Megjegyzés</strong> = <code>megjegyzes</code></li>
                      <li>NaturaSoft 3. lépés cím: Ország = <code>szamlazasi_orszag</code>, Irsz = <code>szamlazasi_irsz</code>, Város = <code>szamlazasi_varos</code>, Cím = <code>szamlazasi_utca</code> (szállításnál <code>szallitasi_*</code>)</li>
                      <li>SAM termékeknél az ÁFA: <strong>TAM</strong> (0%), nem 27%</li>
                    </ul>
                  </div>
                </div>
              </div>
            ) : null}

            {true ? (
              <div className="rounded-2xl border border-brand-100 bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-base font-bold text-slate-900">Számlázási adatok</h2>
                <div className="space-y-3 text-sm">
                  {[
                    { label: "Számlázási név", value: billingNameDisplay(order) },
                    { label: "Számlázási adószám", value: order.billing_tax_number },
                    { label: "Számlázási cím", value: billingAddressDisplay(order) },
                    { label: "Cég és kapcsolattartó (szállításhoz)", value: order.billing_company_contact },
                  ].map(({ label, value }) => value?.trim() ? (
                    <div key={label}>
                      <p className="text-xs font-semibold text-red-950/50">{label}</p>
                      <p className="mt-0.5 text-slate-900">{value}</p>
                    </div>
                  ) : null)}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
