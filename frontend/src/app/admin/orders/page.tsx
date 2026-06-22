"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { formatOrderPublicId } from "@/lib/order-display-id";
import {
  defaultLabelFilename,
  downloadShippingLabelPdf,
  orderCanCreateShippingLabel,
  requestShippingLabel,
} from "@/lib/shipping/admin-label-client";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/supabase";

type Order = Database["public"]["Tables"]["orders"]["Row"];
type OrderStatus = Database["public"]["Enums"]["order_status"];

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

function getShippingEmail(order: Order): string {
  return order.shipping_email ?? "";
}

async function getRecipientForOrder(order: Order): Promise<{ email: string; name: string }> {
  const directEmail = getShippingEmail(order).trim();
  const fallbackName = order.shipping_name?.trim() || "Vásárló";

  if (directEmail) {
    return { email: directEmail, name: fallbackName };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("email, full_name")
    .eq("id", order.user_id)
    .maybeSingle();

  const profileEmail = profile?.email?.trim() ?? "";
  const profileName = profile?.full_name?.trim() || fallbackName;
  return { email: profileEmail, name: profileName };
}

function getPaymentLabel(order: Order): string {
  const maybeMethod = (order as unknown as { payment_method?: string }).payment_method;
  if (maybeMethod === "card") return "Bankkártyás fizetés (SimplePay)";
  if (maybeMethod === "transfer") return "Banki átutalás";
  if (maybeMethod === "cod") return "Utánvét";

  if (order.payment_provider === "simplepay") return "Bankkártyás fizetés (SimplePay)";
  if (order.payment_provider === "manual_transfer") return "Banki átutalás";
  if (order.payment_provider === "manual_cod") return "Utánvét";
  return order.payment_provider ?? "—";
}

export default function AdminOrdersPage() {
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | OrderStatus>("all");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [bulkStatus, setBulkStatus] = useState<OrderStatus>("fulfilled");
  const [labelBusyIds, setLabelBusyIds] = useState<string[]>([]);
  const [bulkLabelLoading, setBulkLabelLoading] = useState(false);

  const loadData = useCallback(async () => {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) { setActionError(error.message); setLoading(false); return; }
    setOrders(data ?? []);
    setSelectedOrderIds([]);
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

  const filtered = useMemo(() => {
    let list = [...orders];
    const kw = search.toLowerCase().trim();
    if (kw) {
      list = list.filter(
        (o) =>
          o.id.toLowerCase().includes(kw) ||
          (o.shipping_name ?? "").toLowerCase().includes(kw) ||
          getShippingEmail(o).toLowerCase().includes(kw)
      );
    }
    if (filterStatus !== "all") list = list.filter((o) => o.status === filterStatus);
    return list;
  }, [orders, search, filterStatus]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const currentPage = Math.min(page, totalPages);
  const paginatedOrders = filtered.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);
  const allVisibleSelected = paginatedOrders.length > 0 && paginatedOrders.every((o) => selectedOrderIds.includes(o.id));
  const selectedLabelEligibleCount = orders.filter(
    (o) => selectedOrderIds.includes(o.id) && orderCanCreateShippingLabel(o),
  ).length;

  async function getAdminToken(): Promise<string | null> {
    const { data: sessionData } = await supabase.auth.getSession();
    return sessionData.session?.access_token ?? null;
  }

  async function generateLabelForOrder(order: Order): Promise<{ ok: true } | { ok: false; message: string }> {
    const token = await getAdminToken();
    if (!token) return { ok: false, message: "Nincs aktív admin munkamenet." };

    setLabelBusyIds((prev) => Array.from(new Set([...prev, order.id])));
    try {
      const json = await requestShippingLabel(order.id, token);
      downloadShippingLabelPdf(json.pdfBase64, defaultLabelFilename(order.id, json.filename));
      return { ok: true };
    } catch (e) {
      return { ok: false, message: e instanceof Error ? e.message : "Címirat generálás sikertelen." };
    } finally {
      setLabelBusyIds((prev) => prev.filter((id) => id !== order.id));
    }
  }

  async function handleCreateLabel(order: Order) {
    setActionError(null);
    setActionSuccess(null);
    const result = await generateLabelForOrder(order);
    if (!result.ok) {
      setActionError(`${formatOrderPublicId(order.id)}: ${result.message}`);
      return;
    }
    setActionSuccess(`Címirat elkészült: ${formatOrderPublicId(order.id)}`);
    await loadData();
  }

  async function handleBulkCreateLabels() {
    const eligible = orders.filter((o) => selectedOrderIds.includes(o.id) && orderCanCreateShippingLabel(o));
    if (eligible.length === 0) {
      setActionError("A kijelölt rendelések közül egyikhez sem generálható címirat.");
      return;
    }

    const confirmed = window.confirm(`${eligible.length} rendeléshez generáljunk címiratot (PDF)?`);
    if (!confirmed) return;

    setActionError(null);
    setActionSuccess(null);
    setBulkLabelLoading(true);

    let okCount = 0;
    const failures: string[] = [];

    for (const order of eligible) {
      const result = await generateLabelForOrder(order);
      if (result.ok) okCount += 1;
      else failures.push(`${formatOrderPublicId(order.id)}: ${result.message}`);
      await new Promise((r) => setTimeout(r, 300));
    }

    setBulkLabelLoading(false);

    if (failures.length > 0) {
      setActionError(`Címirat generálás részben sikertelen (${okCount}/${eligible.length}). ${failures.slice(0, 3).join(" | ")}`);
    } else {
      setActionSuccess(`${okCount} címirat elkészült és letöltődött.`);
    }
    await loadData();
  }

  async function sendCourierAssignedEmail(orderId: string): Promise<{ ok: boolean; reason?: string }> {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    if (!token) return { ok: false, reason: "Nincs bejelentkezett admin token az emailhez." };

    try {
      const emailRes = await fetch("/api/email/courier-assigned", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ orderId }),
      });
      const emailJson = await readEmailApiResponse(emailRes);
      if (!emailRes.ok || emailJson.ok === false) {
        return { ok: false, reason: emailJson.error ?? emailJson.skipped ?? emailJson.detail ?? "ismeretlen hiba" };
      }
      return { ok: true };
    } catch (e) {
      return { ok: false, reason: e instanceof Error ? e.message : "hálózati hiba" };
    }
  }

  async function applyOrderStatus(order: Order, status: OrderStatus): Promise<{ ok: boolean; message?: string }> {
    const { error } = await supabase.from("orders").update({ status }).eq("id", order.id);
    if (error) return { ok: false, message: error.message };

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

    // Futár emailt csak valódi státusz-átmenetkor küldünk, hogy ne legyen félrevezető.
    if (status === "fulfilled" && order.status !== "fulfilled") {
      const recipient = await getRecipientForOrder(order);
      if (!recipient.email) return { ok: false, message: "Nem találtunk vevői email címet." };
      const sent = await sendCourierAssignedEmail(order.id);
      if (!sent.ok) return { ok: false, message: `Email nem ment ki: ${sent.reason}` };
    }

    return { ok: true };
  }

  async function handleStatusChange(order: Order, status: OrderStatus) {
    if (status === "cancelled" || status === "refunded") {
      const confirmed = window.confirm(
        `Biztosan "${statusConfig[status]?.label}" státuszra állítod?`
      );
      if (!confirmed) return;
    }
    setActionError(null); setActionSuccess(null);

    const result = await applyOrderStatus(order, status);
    if (!result.ok) {
      setActionError(result.message ?? "Státuszfrissítés sikertelen.");
      await loadData();
      return;
    }

    setActionSuccess(
      status === "fulfilled"
        ? "Rendelés státusza frissítve. Futárnak átadva email elküldve."
        : "Rendelés státusza frissítve."
    );
    await loadData();
  }

  async function handleBulkStatusChange() {
    if (selectedOrderIds.length === 0) {
      setActionError("Nincs kijelölt rendelés.");
      return;
    }
    if (bulkStatus === "cancelled" || bulkStatus === "refunded") {
      const confirmed = window.confirm(
        `Biztosan ${selectedOrderIds.length} rendelést "${statusConfig[bulkStatus]?.label}" státuszra állítasz?`
      );
      if (!confirmed) return;
    }

    setActionError(null);
    setActionSuccess(null);

    const selectedOrders = orders.filter((o) => selectedOrderIds.includes(o.id));
    let okCount = 0;
    const failures: string[] = [];

    for (const order of selectedOrders) {
      const result = await applyOrderStatus(order, bulkStatus);
      if (result.ok) okCount += 1;
      else failures.push(`${formatOrderPublicId(order.id)}: ${result.message ?? "ismeretlen hiba"}`);
    }

    if (failures.length > 0) {
      setActionError(`Tömeges művelet részben sikertelen (${okCount}/${selectedOrders.length}). ${failures.slice(0, 3).join(" | ")}`);
    } else {
      setActionSuccess(
        bulkStatus === "fulfilled"
          ? `${okCount} rendelés státusza frissítve, futár email kiküldve.`
          : `${okCount} rendelés státusza frissítve.`
      );
    }
    await loadData();
  }

  async function handleBulkDelete() {
    if (selectedOrderIds.length === 0) {
      setActionError("Nincs kijelölt rendelés.");
      return;
    }
    const confirmed = window.confirm(`Biztosan törlöd a kijelölt ${selectedOrderIds.length} rendelést?`);
    if (!confirmed) return;

    setActionError(null);
    setActionSuccess(null);

    const { error } = await supabase.from("orders").delete().in("id", selectedOrderIds);
    if (error) {
      setActionError(error.message);
      return;
    }
    setActionSuccess(`${selectedOrderIds.length} rendelés törölve.`);
    await loadData();
  }

  return (
    <div className="space-y-6 animate-fade-up">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-brand-700">Admin</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">Rendelések kezelése</h1>
      </div>

      {actionError ? <div className="rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm font-medium text-rose-700">{actionError}</div> : null}
      {actionSuccess ? <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm font-medium text-emerald-700">{actionSuccess}</div> : null}

      <details className="rounded-2xl border border-brand-100 bg-white p-4 text-sm text-red-950/75 shadow-sm">
        <summary className="cursor-pointer font-bold text-brand-900">NaturaSoft megrendelés-export</summary>
        <div className="mt-3 space-y-2 text-xs leading-relaxed">
          <p>
            <strong>fizetve (paid)</strong> és <strong>futárnak átadva (fulfilled)</strong> státuszú, még nem
            exportált rendelések kerülnek az XML-be. A NaturaSoft letöltése után automatikusan megjelölődnek.
          </p>
          <p>
            URL (Vercel env: <code className="rounded bg-brand-50 px-1">NATURASOFT_EXPORT_TOKEN</code>):
          </p>
          <p className="break-all font-mono text-[11px] text-slate-800">
            /api/integrations/naturasoft/orders?token=…
          </p>
          <p className="text-[11px] text-amber-800">
            Újra-import (már exportált rendelések is, a NaturaSoft gyakran nem küldi az URL paramétereket):
            {" "}
            <span className="font-mono">/api/integrations/naturasoft/reexport?token=…</span>
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="button"
              onClick={async () => {
                setActionError(null);
                const { data: sessionData } = await supabase.auth.getSession();
                const token = sessionData.session?.access_token;
                if (!token) {
                  setActionError("Nincs admin munkamenet.");
                  return;
                }
                const res = await fetch("/api/admin/integrations/naturasoft/export?preview=1", {
                  headers: { Authorization: `Bearer ${token}` },
                });
                if (!res.ok) {
                  const json = (await res.json()) as { error?: string };
                  setActionError(json.error ?? "Export előnézet sikertelen.");
                  return;
                }
                const blob = await res.blob();
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "naturasoft-elonezet.xml";
                a.click();
                URL.revokeObjectURL(url);
                setActionSuccess("NaturaSoft XML előnézet letöltve (nem jelölt exportáltnak).");
              }}
              className="rounded-lg border border-brand-200 px-3 py-1.5 text-xs font-bold text-brand-900 transition hover:bg-brand-50"
            >
              XML előnézet letöltése
            </button>
          </div>
        </div>
      </details>

      <div className="flex flex-wrap gap-3 rounded-2xl border border-brand-100 bg-white p-4 shadow-sm">
        <div className="flex flex-1 min-w-48 items-center gap-2 rounded-xl border border-brand-200 bg-white px-3 py-2 transition focus-within:border-brand-600 focus-within:ring-2 focus-within:ring-brand-100">
          <svg className="h-4 w-4 shrink-0 text-brand-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Keresés rendelésszám, név vagy e-mail alapján..."
            className="w-full bg-transparent text-sm outline-none placeholder:text-red-950/40"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => { setFilterStatus(e.target.value as "all" | OrderStatus); setPage(1); }}
          className="rounded-xl border border-brand-200 px-3 py-2 text-sm outline-none transition focus:border-brand-600"
        >
          <option value="all">Minden státusz</option>
          {ALL_STATUSES.map((s) => (
            <option key={s} value={s}>{statusConfig[s]?.label ?? s}</option>
          ))}
        </select>
        <div className="ml-auto flex items-center gap-2">
          <select
            value={bulkStatus}
            onChange={(e) => setBulkStatus(e.target.value as OrderStatus)}
            className="rounded-xl border border-brand-200 px-3 py-2 text-sm outline-none transition focus:border-brand-600"
          >
            {ALL_STATUSES.map((s) => (
              <option key={`bulk-${s}`} value={s}>{statusConfig[s]?.label ?? s}</option>
            ))}
          </select>
          <button
            type="button"
            disabled={selectedLabelEligibleCount === 0 || bulkLabelLoading}
            onClick={() => void handleBulkCreateLabels()}
            className="rounded-xl border border-brand-700 bg-brand-900 px-4 py-2 text-sm font-bold text-white transition hover:bg-brand-800 disabled:opacity-50"
          >
            {bulkLabelLoading ? "Címiratok…" : `Címirat PDF (${selectedLabelEligibleCount})`}
          </button>
          <button
            type="button"
            disabled={selectedOrderIds.length === 0}
            onClick={() => void handleBulkStatusChange()}
            className="rounded-xl bg-brand-900 px-4 py-2 text-sm font-bold text-white transition hover:bg-brand-800 disabled:opacity-50"
          >
            Tömeges státusz ({selectedOrderIds.length})
          </button>
          <button
            type="button"
            disabled={selectedOrderIds.length === 0}
            onClick={() => void handleBulkDelete()}
            className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-bold text-rose-700 transition hover:bg-rose-100 disabled:opacity-50"
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
          <p>Összesen {filtered.length} rendelés</p>
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
                <th className="p-4 text-center">
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedOrderIds(Array.from(new Set([...selectedOrderIds, ...paginatedOrders.map((o) => o.id)])));
                      } else {
                        const filteredSet = new Set(paginatedOrders.map((o) => o.id));
                        setSelectedOrderIds((prev) => prev.filter((id) => !filteredSet.has(id)));
                      }
                    }}
                    className="h-4 w-4 accent-brand-800"
                    aria-label="Összes látható rendelés kijelölése"
                  />
                </th>
                <th className="p-4 text-left font-bold uppercase tracking-wider text-xs text-brand-900">Rendelésszám</th>
                <th className="p-4 text-left font-bold uppercase tracking-wider text-xs text-brand-900">Vásárló</th>
                <th className="p-4 text-left font-bold uppercase tracking-wider text-xs text-brand-900">Dátum</th>
                <th className="p-4 text-left font-bold uppercase tracking-wider text-xs text-brand-900">Fizetési mód</th>
                <th className="p-4 text-right font-bold uppercase tracking-wider text-xs text-brand-900">Összeg</th>
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
                paginatedOrders.map((order) => {
                  const st = statusConfig[order.status] ?? { label: order.status, color: "bg-slate-100 text-slate-600 border-slate-200" };
                  const canLabel = orderCanCreateShippingLabel(order);
                  const labelBusy = labelBusyIds.includes(order.id) || bulkLabelLoading;
                  return (
                    <tr key={order.id} className="transition hover:bg-brand-50/30">
                      <td className="p-4 text-center">
                        <input
                          type="checkbox"
                          checked={selectedOrderIds.includes(order.id)}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedOrderIds((prev) => Array.from(new Set([...prev, order.id])));
                            else setSelectedOrderIds((prev) => prev.filter((id) => id !== order.id));
                          }}
                          className="h-4 w-4 accent-brand-800"
                          aria-label={`Rendelés kijelölése: ${formatOrderPublicId(order.id)}`}
                        />
                      </td>
                      <td className="p-4 font-mono text-xs text-red-950/60" title={order.id}>{formatOrderPublicId(order.id)}</td>
                      <td className="p-4">
                        <p className="font-semibold text-slate-900">{order.shipping_name ?? "—"}</p>
                        <p className="text-xs text-red-950/50">{getShippingEmail(order)}</p>
                      </td>
                      <td className="p-4 text-red-950/70">
                        {new Date(order.created_at).toLocaleDateString("hu-HU")}
                      </td>
                      <td className="p-4 text-red-950/70">
                        {(order as unknown as { payment_method?: string }).payment_method ??
                          order.payment_provider ??
                          "—"}
                      </td>
                      <td className="p-4 text-right">
                        <p className="font-bold text-brand-900">{Number(order.total).toLocaleString("hu-HU")} Ft</p>
                        {order.coupon_code ? (
                          <p className="text-xs text-emerald-700 font-semibold">{order.coupon_code}</p>
                        ) : null}
                      </td>
                      <td className="p-4 text-center">
                        <select
                          value={order.status}
                          onChange={(e) => void handleStatusChange(order, e.target.value as OrderStatus)}
                          className={`rounded-full border px-2.5 py-0.5 text-xs font-bold outline-none cursor-pointer ${st.color}`}
                        >
                          {ALL_STATUSES.map((s) => (
                            <option key={s} value={s}>{statusConfig[s]?.label ?? s}</option>
                          ))}
                        </select>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-wrap justify-end gap-2">
                          {canLabel ? (
                            <button
                              type="button"
                              disabled={labelBusy}
                              onClick={() => void handleCreateLabel(order)}
                              className="rounded-lg border border-brand-700 bg-brand-900 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-brand-800 disabled:opacity-50"
                              title="Címirat generálása (PDF)"
                            >
                              {labelBusyIds.includes(order.id) ? "…" : "PDF"}
                            </button>
                          ) : null}
                          <Link
                            href={`/admin/orders/${order.id}`}
                            className="rounded-lg border border-brand-200 px-3 py-1.5 text-xs font-bold text-brand-900 transition hover:bg-brand-50"
                          >
                            Részletek →
                          </Link>
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
