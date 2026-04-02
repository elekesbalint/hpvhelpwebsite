"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { sendCourierAssignedEmail } from "@/lib/order-status-email";
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

function getShippingEmail(order: Order): string {
  return (order as unknown as { shipping_email?: string }).shipping_email ?? "";
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

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | OrderStatus>("all");

  const loadData = useCallback(async () => {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) { setActionError(error.message); setLoading(false); return; }
    setOrders(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadData();
  }, [loadData]);

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

  async function handleStatusChange(order: Order, status: OrderStatus) {
    if (status === "cancelled" || status === "refunded") {
      const confirmed = window.confirm(
        `Biztosan "${statusConfig[status]?.label}" státuszra állítod?`
      );
      if (!confirmed) return;
    }
    setActionError(null); setActionSuccess(null);

    const { error } = await supabase.from("orders").update({ status }).eq("id", order.id);
    if (error) { setActionError(error.message); return; }

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

    if (status === "fulfilled") {
      const recipient = await getRecipientForOrder(order);
      if (recipient.email) {
        const { data: orderItems } = await supabase
          .from("order_items")
          .select("product_name, quantity, line_total")
          .eq("order_id", order.id)
          .order("created_at", { ascending: true });

        const itemsText =
          (orderItems ?? [])
            .map(
              (item) =>
                `${item.product_name} - ${item.quantity} db - ${Number(item.line_total).toLocaleString("hu-HU")} Ft`
            )
            .join("\n") || "A rendelés részletei a fiókodban érhetők el.";

        await sendCourierAssignedEmail({
          orderId: order.id,
          toEmail: recipient.email,
          toName: recipient.name,
          orderDate: new Date(order.created_at).toLocaleString("hu-HU"),
          paymentMethod: getPaymentLabel(order),
          total: `${Number(order.total).toLocaleString("hu-HU")} ${order.currency}`,
          shippingName: order.shipping_name ?? recipient.name,
          shippingAddress: order.shipping_address ?? "—",
          shippingPhone: order.shipping_phone ?? "—",
          itemsText,
        });
      } else {
        setActionSuccess("Rendelés státusza frissítve, de nem találtunk email címet az értesítéshez.");
        await loadData();
        return;
      }
    }

    setActionSuccess("Rendelés státusza frissítve.");
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

      <div className="flex flex-wrap gap-3 rounded-2xl border border-brand-100 bg-white p-4 shadow-sm">
        <div className="flex flex-1 min-w-48 items-center gap-2 rounded-xl border border-brand-200 bg-white px-3 py-2 transition focus-within:border-brand-600 focus-within:ring-2 focus-within:ring-brand-100">
          <svg className="h-4 w-4 shrink-0 text-brand-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Keresés rendelésszám, név vagy e-mail alapján..."
            className="w-full bg-transparent text-sm outline-none placeholder:text-red-950/40"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as "all" | OrderStatus)}
          className="rounded-xl border border-brand-200 px-3 py-2 text-sm outline-none transition focus:border-brand-600"
        >
          <option value="all">Minden státusz</option>
          {ALL_STATUSES.map((s) => (
            <option key={s} value={s}>{statusConfig[s]?.label ?? s}</option>
          ))}
        </select>
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
                  <td colSpan={7} className="p-8 text-center text-sm text-red-950/50">
                    Nincs találat a keresési feltételeknek megfelelően.
                  </td>
                </tr>
              ) : (
                filtered.map((order) => {
                  const st = statusConfig[order.status] ?? { label: order.status, color: "bg-slate-100 text-slate-600 border-slate-200" };
                  return (
                    <tr key={order.id} className="transition hover:bg-brand-50/30">
                      <td className="p-4 font-mono text-xs text-red-950/60">#{order.id.slice(0, 8)}…</td>
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
                      <td className="p-4 text-right font-bold text-brand-900">
                        {Number(order.total).toLocaleString("hu-HU")} Ft
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
                        <div className="flex justify-end">
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
