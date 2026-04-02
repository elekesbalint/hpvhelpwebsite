"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { sendCourierAssignedEmail } from "@/lib/order-status-email";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/supabase";

type Order = Database["public"]["Tables"]["orders"]["Row"];
type OrderItem = Database["public"]["Tables"]["order_items"]["Row"];
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

export default function AdminOrderDetailsPage() {
  const params = useParams<{ id: string }>();
  const orderId = params.id;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);

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
    setLoading(false);
  }, [orderId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadData();
  }, [loadData]);

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

    if (status === "fulfilled") {
      const orderExtra = getOrderExtra(order);
      let recipientEmail = orderExtra.shipping_email?.trim() ?? "";
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
        const itemsText =
          items
            .map(
              (item) =>
                `${item.product_name} - ${item.quantity} db - ${Number(item.line_total).toLocaleString("hu-HU")} Ft`
            )
            .join("\n") || "A rendelés részletei a fiókodban érhetők el.";

        await sendCourierAssignedEmail({
          orderId: order.id,
          toEmail: recipientEmail,
          toName: recipientName,
          orderDate: new Date(order.created_at).toLocaleString("hu-HU"),
          paymentMethod: getPaymentLabel(order, orderExtra.payment_method),
          total: `${Number(order.total).toLocaleString("hu-HU")} ${order.currency}`,
          shippingName: order.shipping_name ?? recipientName,
          shippingAddress: order.shipping_address ?? "—",
          shippingPhone: order.shipping_phone ?? "—",
          itemsText,
        });
      } else {
        setSuccess("Rendelés státusza frissítve, de nem találtunk email címet az értesítéshez.");
        await loadData();
        return;
      }
    }

    setSuccess("Rendelés státusza frissítve.");
    await loadData();
  }

  const st = order ? (statusConfig[order.status] ?? { label: order.status, color: "bg-slate-100 text-slate-600 border-slate-200" }) : null;
  const orderExtra = getOrderExtra(order);

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
                  <p className="mt-1 font-mono text-sm text-slate-900">{order.id}</p>
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
                  <p className="mt-0.5 text-sm font-bold text-brand-900">{Number(order.total).toLocaleString("hu-HU")} {order.currency}</p>
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
              </div>
            </div>

            <div className="rounded-2xl border border-brand-100 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-base font-bold text-slate-900">Rendelt tételek</h2>
              {items.length === 0 ? (
                <p className="text-sm text-red-950/50">Nincs tétel ebben a rendelésben.</p>
              ) : (
                <div className="space-y-2">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-brand-100 bg-brand-50/30 px-4 py-3 text-sm"
                    >
                      <span className="font-semibold text-slate-900">{item.product_name}</span>
                      <span className="font-semibold text-brand-900">
                        {item.quantity} × {Number(item.unit_price).toLocaleString("hu-HU")} Ft = {Number(item.line_total).toLocaleString("hu-HU")} Ft
                      </span>
                    </div>
                  ))}
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
                  { label: "Név", value: order.shipping_name },
                  { label: "Telefon", value: order.shipping_phone },
                  { label: "E-mail", value: orderExtra.shipping_email },
                  { label: "Cím", value: order.shipping_address },
                  { label: "Megjegyzés", value: order.notes },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-xs font-semibold text-red-950/50">{label}</p>
                    <p className="mt-0.5 text-slate-900">{value ?? "—"}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
