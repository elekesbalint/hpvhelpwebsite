"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { billingAddressDisplay, billingNameDisplay } from "@/lib/order-billing";
import { formatOrderPublicId } from "@/lib/order-display-id";
import { supabase } from "@/lib/supabase";
import SiteLogo from "@/components/SiteLogo";
import OrderTotalsBreakdown from "@/components/OrderTotalsBreakdown";
import type { Database } from "@/types/supabase";

type Order = Database["public"]["Tables"]["orders"]["Row"];
type OrderItem = Database["public"]["Tables"]["order_items"]["Row"];
type Coupon = Database["public"]["Tables"]["coupons"]["Row"];

const statusConfig: Record<string, { label: string; color: string }> = {
  pending:    { label: "Függőben",     color: "bg-amber-50 text-amber-700 border-amber-200" },
  paid:       { label: "Fizetve",      color: "bg-green-50 text-green-700 border-green-200" },
  fulfilled:  { label: "Futárnak átadva", color: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  processing: { label: "Feldolgozás",  color: "bg-blue-50 text-blue-700 border-blue-200" },
  shipped:    { label: "Elküldve",     color: "bg-brand-50 text-sky-700 border-brand-200" },
  delivered:  { label: "Kézbesítve",   color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  cancelled:  { label: "Lemondva",     color: "bg-rose-50 text-rose-700 border-rose-200" },
  refunded:   { label: "Visszatérítve", color: "bg-purple-50 text-purple-700 border-purple-200" },
};

type DashboardUser = {
  id: string;
  email: string;
  fullName: string;
  createdAt: string;
};


function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") ?? "overview";

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<DashboardUser | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [orderItemsLoading, setOrderItemsLoading] = useState(false);

  const [profileName, setProfileName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [activeCoupons, setActiveCoupons] = useState<Coupon[]>([]);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    void supabase.auth.getSession().then(async ({ data }) => {
      const sessionUser = data.session?.user;
      if (!sessionUser) { router.replace("/login"); return; }

      setUser({
        id: sessionUser.id,
        email: sessionUser.email ?? "",
        fullName: (sessionUser.user_metadata?.full_name as string | undefined)?.trim() ?? "",
        createdAt: sessionUser.created_at ?? "",
      });

      const fullName = (sessionUser.user_metadata?.full_name as string | undefined)?.trim() ?? "";
      const email = sessionUser.email ?? "";

      setProfileName(fullName);
      setProfileEmail(email);
      setLoading(false);

      const { data: orderRows } = await supabase
        .from("orders")
        .select("*")
        .eq("user_id", sessionUser.id)
        .order("created_at", { ascending: false });
      setOrders(orderRows ?? []);

      // Aktív, elérhető kuponok lekérése
      const now = new Date().toISOString();
      const { data: couponRows } = await supabase
        .from("coupons")
        .select("*")
        .eq("is_active", true)
        .eq("is_public", true)
        .or(`valid_from.is.null,valid_from.lte.${now}`)
        .or(`expires_at.is.null,expires_at.gte.${now}`)
        .order("created_at", { ascending: false });

      if (!couponRows || couponRows.length === 0) {
        setActiveCoupons([]);
      } else {
        // Lekérjük az adott felhasználó eddigi felhasználásait ezekre a kuponokra
        const couponIds = couponRows.map((c) => c.id);
        const { data: usageRows } = await supabase
          .from("coupon_usage")
          .select("coupon_id")
          .eq("user_id", sessionUser.id)
          .in("coupon_id", couponIds);

        // Megszámoljuk, hányszor használta az adott kupont
        const usageCountById: Record<string, number> = {};
        (usageRows ?? []).forEach((row) => {
          usageCountById[row.coupon_id] = (usageCountById[row.coupon_id] ?? 0) + 1;
        });

        // Csak azokat a kuponokat mutatjuk, amelyeket még felhasználhat
        const available = couponRows.filter((c) => {
          if (c.max_uses_per_user == null) return true;
          return (usageCountById[c.id] ?? 0) < c.max_uses_per_user;
        });

        setActiveCoupons(available);
      }
    });
  }, [router]);

  function handleCopyCode(code: string) {
    void navigator.clipboard.writeText(code).then(() => {
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    });
  }

  async function loadOrderItems(order: Order) {
    setSelectedOrder(order);
    setOrderItemsLoading(true);
    const { data } = await supabase
      .from("order_items")
      .select("*")
      .eq("order_id", order.id)
      .order("created_at", { ascending: true });
    setOrderItems(data ?? []);
    setOrderItemsLoading(false);
  }

  useEffect(() => {
    if (!user) return;
    if (!profileName && user.fullName) setProfileName(user.fullName);
    if (!profileEmail && user.email) setProfileEmail(user.email);
  }, [user]);  // eslint-disable-line react-hooks/exhaustive-deps

  async function saveProfile() {
    setProfileSaving(true);
    setProfileMessage(null);

    if (newPassword && newPassword !== confirmPassword) {
      setProfileMessage({ type: "error", text: "Az új jelszavak nem egyeznek meg." });
      setProfileSaving(false);
      return;
    }

    if (newPassword && newPassword.length < 6) {
      setProfileMessage({ type: "error", text: "Az új jelszónak legalább 6 karakter hosszúnak kell lennie." });
      setProfileSaving(false);
      return;
    }

    const updates: Parameters<typeof supabase.auth.updateUser>[0] = {
      data: { full_name: profileName },
    };
    if (profileEmail !== user?.email) updates.email = profileEmail;
    if (newPassword) updates.password = newPassword;

    const { error } = await supabase.auth.updateUser(updates);

    if (error) {
      setProfileMessage({ type: "error", text: error.message });
    } else {
      setProfileMessage({ type: "success", text: "Adatok sikeresen mentve!" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      if (user) setUser({ ...user, fullName: profileName, email: profileEmail });
    }

    setProfileSaving(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/");
    router.refresh();
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fdf8f8] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-brand-900 to-brand-700 animate-pulse" />
          <p className="text-sm text-red-950/60">Betöltés...</p>
        </div>
      </div>
    );
  }

  const displayName = user?.fullName || user?.email?.split("@")[0] || "Felhasználó";

  const navItems = [
    { id: "overview",   label: "Vezérlőpult", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
    { id: "orders",     label: "Rendelések",  icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" },
    { id: "account",    label: "Fiókadatok",  icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" },
  ];

  return (
    <div className="min-h-screen bg-[#fdf8f8] text-slate-900">
      <header className="sticky top-0 z-30 border-b border-brand-100/80 bg-white/80 shadow-sm backdrop-blur-md animate-fade-down">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="inline-flex min-w-0 shrink-0 items-center">
            <SiteLogo withLink={false} size="md" className="shrink-0" />
          </Link>
          <div className="inline-flex items-center gap-2 rounded-lg border border-brand-200 bg-white px-3 py-2 text-sm font-medium text-red-950 shadow-sm">
            <svg className="h-4 w-4 text-brand-800" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21a8 8 0 0 0-16 0" /><circle cx="12" cy="7" r="4" />
            </svg>
            <span className="max-w-[180px] truncate">Üdvözöljük, {displayName}</span>
          </div>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-6xl gap-6 px-6 py-10 md:grid-cols-[260px_1fr]">
        <aside className="animate-slide-left space-y-2">
          <div className="rounded-2xl border border-brand-100 bg-white p-5 shadow-sm">
            <div className="mb-4 flex flex-col items-center gap-2 border-b border-brand-50 pb-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-900 to-brand-700 text-white shadow-md shadow-brand-200">
                <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21a8 8 0 0 0-16 0" /><circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-slate-900">{displayName}</p>
                <p className="text-xs text-red-950/50">{user?.email}</p>
              </div>
            </div>

            <nav className="space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.id}
                  href={`/dashboard?tab=${item.id}`}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                    tab === item.id
                      ? "bg-brand-900 text-white shadow-sm"
                      : "text-red-950/70 hover:bg-brand-50"
                  }`}
                >
                  <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                  </svg>
                  {item.label}
                </Link>
              ))}

              <button
                onClick={() => void handleLogout()}
                className="btn-press flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-rose-500 transition hover:bg-rose-50"
              >
                <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Kijelentkezés
              </button>
            </nav>
          </div>
        </aside>

        <main className="animate-fade-up space-y-6 min-w-0">
          {tab === "overview" && (
            <>
              <section className="rounded-2xl border border-brand-100 bg-white p-6 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-widest text-brand-700">Vezérlőpult</p>
                <h1 className="mt-1 text-2xl font-bold text-slate-900">
                  Üdvözöljük, {displayName}!
                </h1>
                <p className="mt-1 text-sm text-red-950/60">
                  Innen kezelheted a rendeléseidet és a fiókodat.
                </p>
              </section>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-brand-100 bg-white p-5 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-widest text-brand-700">Összes rendelés</p>
                  <p className="mt-2 text-3xl font-bold text-slate-900">{orders.length}</p>
                </div>
                <div className="rounded-2xl border border-brand-100 bg-white p-5 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-widest text-brand-700">Függőben</p>
                  <p className="mt-2 text-3xl font-bold text-slate-900">
                    {orders.filter((o) => o.status === "pending").length}
                  </p>
                </div>
                <div className="rounded-2xl border border-brand-100 bg-white p-5 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-widest text-brand-700">Elköltött összeg</p>
                  <p className="mt-2 text-2xl font-bold text-brand-900">
                    {orders.reduce((sum, o) => sum + Number(o.total), 0).toLocaleString("hu-HU")} Ft
                  </p>
                </div>
              </div>

              {activeCoupons.length > 0 ? (
                <section>
                  <div className="mb-3 flex items-center gap-2">
                    <svg className="h-4 w-4 text-brand-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    <h2 className="text-sm font-bold uppercase tracking-widest text-brand-700">Elérhető kuponok</h2>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {activeCoupons.map((coupon) => {
                      const isCopied = copiedCode === coupon.code;
                      const expiresLabel = coupon.expires_at
                        ? `Lejár: ${new Date(coupon.expires_at).toLocaleDateString("hu-HU")}`
                        : null;
                      const discountLabel = coupon.discount_type === "percent"
                        ? `${coupon.discount_value}% kedvezmény`
                        : `${Number(coupon.discount_value).toLocaleString("hu-HU")} Ft kedvezmény`;

                      return (
                        <div
                          key={coupon.id}
                          className="relative overflow-hidden rounded-2xl border border-brand-200 bg-gradient-to-br from-brand-900 to-brand-800 p-5 shadow-md shadow-brand-200/40"
                        >
                          {/* Dekoratív körök */}
                          <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/5" />
                          <div className="pointer-events-none absolute -bottom-8 -left-4 h-28 w-28 rounded-full bg-white/5" />

                          <div className="relative">
                            <p className="text-xs font-bold uppercase tracking-widest text-brand-300">Kedvezmény</p>
                            <p className="mt-1 text-2xl font-bold text-white">{discountLabel}</p>
                            {coupon.description ? (
                              <p className="mt-1 text-xs text-white/60">{coupon.description}</p>
                            ) : null}

                            <div className="mt-4 flex items-center gap-2">
                              <div className="flex-1 rounded-xl border border-dashed border-white/30 bg-white/10 px-3 py-2 text-center">
                                <span className="font-mono text-base font-bold tracking-widest text-white">{coupon.code}</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleCopyCode(coupon.code)}
                                className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition ${
                                  isCopied
                                    ? "bg-emerald-500 text-white"
                                    : "bg-white text-brand-900 hover:bg-brand-50"
                                }`}
                              >
                                {isCopied ? (
                                  <>
                                    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                    Másolva!
                                  </>
                                ) : (
                                  <>
                                    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                      <rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                                    </svg>
                                    Másolás
                                  </>
                                )}
                              </button>
                            </div>

                            <div className="mt-3 flex flex-wrap items-center gap-2">
                              {coupon.min_order_amount ? (
                                <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] font-semibold text-white/70">
                                  Min. {Number(coupon.min_order_amount).toLocaleString("hu-HU")} Ft
                                </span>
                              ) : null}
                              {expiresLabel ? (
                                <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] font-semibold text-white/70">
                                  {expiresLabel}
                                </span>
                              ) : null}
                              <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] font-semibold text-white/70">
                                Leárazott terméknél nem érvényes
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-3">
                    <Link
                      href="/"
                      className="inline-flex items-center gap-2 rounded-xl bg-brand-900 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-brand-800"
                    >
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="9" cy="20" r="1"/><circle cx="17" cy="20" r="1"/>
                        <path d="M3 4h2l2.4 11.2a2 2 0 002 1.6h7.6a2 2 0 002-1.6L21 7H7"/>
                      </svg>
                      Vásárlás most
                    </Link>
                  </div>
                </section>
              ) : null}

              <section className="rounded-2xl border border-brand-100 bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-base font-bold text-slate-900">Legutóbbi rendelések</h2>
                  <Link href="/dashboard?tab=orders" className="text-xs font-semibold text-brand-800 underline underline-offset-2 hover:text-brand-900 transition">
                    Összes megtekintése
                  </Link>
                </div>
                {orders.length === 0 ? (
                  <div className="rounded-xl bg-brand-50/30 p-6 text-center">
                    <p className="text-sm font-semibold text-slate-900">Még nincs rendelésed.</p>
                    <p className="mt-1 text-xs text-red-950/60">Böngészd a webshopot és add fel az első rendelésed.</p>
                    <Link href="/" className="btn-press mt-4 inline-block rounded-xl bg-brand-900 px-5 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-brand-800">
                      Webshop megnyitása
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {orders.slice(0, 3).map((order) => {
                      const st = statusConfig[order.status] ?? { label: order.status, color: "bg-slate-100 text-slate-600 border-slate-200" };
                      return (
                        <div key={order.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand-100 p-4 transition hover:bg-brand-50/30">
                          <div>
                            <p className="font-mono text-xs text-slate-400">{formatOrderPublicId(order)}</p>
                            <p className="text-sm font-semibold text-slate-900">
                              {new Date(order.created_at).toLocaleDateString("hu-HU", { year: "numeric", month: "long", day: "numeric" })}
                            </p>
                          </div>
                          <span className={`rounded-full border px-3 py-0.5 text-xs font-bold ${st.color}`}>{st.label}</span>
                          <p className="font-bold text-brand-900">{Number(order.total).toLocaleString("hu-HU")} Ft</p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            </>
          )}

          {tab === "orders" && (
            <section className="space-y-4">
              <div className="rounded-2xl border border-brand-100 bg-white p-6 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-widest text-brand-700">Fiókom</p>
                <h2 className="mt-1 text-2xl font-bold text-slate-900">Rendelések</h2>
              </div>

              {selectedOrder ? (
                <div className="space-y-4">
                  <button
                    onClick={() => {
                      setSelectedOrder(null);
                    }}
                    className="btn-press inline-flex items-center gap-1.5 rounded-xl border border-brand-200 bg-white px-4 py-2 text-sm font-medium text-red-950 shadow-sm transition hover:bg-brand-50"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                    Vissza a listához
                  </button>

                  <div className="rounded-2xl border border-brand-100 bg-white p-6 shadow-sm">
                    <h3 className="text-base font-bold text-slate-900">Rendelés részletei</h3>
                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      {[
                        {
                          label: "Azonosító",
                          value: (
                            <span className="font-mono text-sm font-semibold text-slate-900" title={selectedOrder.id}>
                              {formatOrderPublicId(selectedOrder)}
                            </span>
                          ),
                        },
                        { label: "Dátum", value: new Date(selectedOrder.created_at).toLocaleDateString("hu-HU", { year: "numeric", month: "long", day: "numeric" }) },
                        { label: "Szállítási név", value: selectedOrder.shipping_name ?? "—" },
                        { label: "Telefonszám", value: selectedOrder.shipping_phone ?? "—" },
                        { label: "E-mail", value: selectedOrder.shipping_email?.trim() ?? "—" },
                        { label: "Szállítási cím", value: selectedOrder.shipping_address ?? "—" },
                      ].map(({ label, value }) => (
                        <div key={label} className="rounded-xl border border-brand-50 bg-brand-50/30 px-4 py-3">
                          <p className="text-xs font-semibold uppercase tracking-widest text-brand-700">{label}</p>
                          <p className="mt-0.5 text-sm font-medium text-slate-900">{value}</p>
                        </div>
                      ))}
                    </div>

                    {selectedOrder.notes?.trim() ? (
                      <div className="mt-4 rounded-xl border border-brand-100 bg-white px-4 py-4 shadow-sm">
                        <p className="text-xs font-semibold uppercase tracking-widest text-brand-700">Megjegyzés a rendeléshez</p>
                        <p className="mt-2 whitespace-pre-wrap text-sm font-medium text-slate-900">{selectedOrder.notes}</p>
                      </div>
                    ) : null}

                    <div className="mt-4 rounded-xl border border-brand-100 bg-white px-4 py-4">
                      <p className="text-xs font-semibold uppercase tracking-widest text-brand-700">Számlázási adatok</p>
                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        {[
                          { label: "Számlázási név", value: billingNameDisplay(selectedOrder) },
                          { label: "Számlázási adószám", value: selectedOrder.billing_tax_number },
                          { label: "Számlázási cím", value: billingAddressDisplay(selectedOrder) },
                          { label: "Cég és kapcsolattartó (szállításhoz)", value: selectedOrder.billing_company_contact },
                        ].map(({ label, value }) => value?.trim() ? (
                          <div key={label} className="rounded-xl border border-brand-50 bg-brand-50/30 px-4 py-3">
                            <p className="text-xs font-semibold uppercase tracking-widest text-brand-700">{label}</p>
                            <p className="mt-0.5 text-sm font-medium text-slate-900">{value}</p>
                          </div>
                        ) : null)}
                      </div>
                    </div>

                    <div className="mt-6">
                      <h4 className="mb-3 text-sm font-bold text-slate-900">Rendelt tételek</h4>
                      {orderItemsLoading ? (
                        <div className="space-y-2">
                          {[...Array(2)].map((_, i) => (
                            <div key={i} className="skeleton h-12 rounded-xl" />
                          ))}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {orderItems.map((item) => (
                            <div key={item.id} className="flex items-center justify-between rounded-xl border border-brand-100 px-4 py-3">
                              <span className="text-sm font-semibold text-slate-900">{item.product_name}</span>
                              <span className="text-sm font-bold text-brand-900">
                                {item.quantity} × {Number(item.unit_price).toLocaleString("hu-HU")} Ft
                              </span>
                            </div>
                          ))}
                          <OrderTotalsBreakdown order={selectedOrder} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {orders.length === 0 ? (
                    <div className="rounded-2xl border border-brand-100 bg-white p-8 text-center shadow-sm">
                      <p className="text-base font-bold text-slate-900">Még nincs rendelésed.</p>
                      <Link href="/" className="btn-press mt-4 inline-block rounded-xl bg-brand-900 px-5 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-brand-800">
                        Webshop megnyitása
                      </Link>
                    </div>
                  ) : (
                    <div className="stagger space-y-3">
                      {orders.map((order) => {
                        const st = statusConfig[order.status] ?? { label: order.status, color: "bg-slate-100 text-slate-600 border-slate-200" };
                        return (
                          <div
                            key={order.id}
                            className="animate-fade-up card-hover flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-brand-100 bg-white p-5 shadow-sm"
                          >
                            <div>
                              <p className="font-mono text-xs text-slate-400">{formatOrderPublicId(order)}</p>
                              <p className="mt-0.5 text-sm font-semibold text-slate-900">
                                {new Date(order.created_at).toLocaleDateString("hu-HU", { year: "numeric", month: "long", day: "numeric" })}
                              </p>
                            </div>
                            <span className={`rounded-full border px-3 py-0.5 text-xs font-bold ${st.color}`}>{st.label}</span>
                            <p className="text-base font-bold text-brand-900">{Number(order.total).toLocaleString("hu-HU")} Ft</p>
                            <button
                              onClick={() => void loadOrderItems(order)}
                              className="btn-press rounded-xl border border-brand-200 bg-white px-4 py-2 text-xs font-bold text-brand-900 shadow-sm transition hover:bg-brand-50"
                            >
                              Részletek →
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </section>
          )}



          {tab === "account" && (
            <section className="space-y-4">
              <div className="rounded-2xl border border-brand-100 bg-white p-6 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-widest text-brand-700">Fiókom</p>
                <h2 className="mt-1 text-2xl font-bold text-slate-900">Fiókadatok</h2>
              </div>

              {profileMessage ? (
                <div className={`animate-fade-up rounded-xl border px-4 py-3 text-sm font-semibold ${
                  profileMessage.type === "success"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-red-200 bg-red-50 text-red-700"
                }`}>
                  {profileMessage.text}
                </div>
              ) : null}

              <div className="rounded-2xl border border-brand-100 bg-white p-6 shadow-sm">
                <h3 className="mb-4 text-base font-bold text-slate-900">Személyes adatok</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-brand-900">Név</label>
                    <input
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      placeholder="Kovács Anna"
                      className="focus-brand w-full rounded-xl border border-brand-200 bg-brand-50/30 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition hover:border-brand-400"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-brand-900">E-mail cím</label>
                    <input
                      type="email"
                      value={profileEmail}
                      onChange={(e) => setProfileEmail(e.target.value)}
                      placeholder="pelda@email.hu"
                      className="focus-brand w-full rounded-xl border border-brand-200 bg-brand-50/30 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition hover:border-brand-400"
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-brand-100 bg-white p-6 shadow-sm">
                <h3 className="mb-1 text-base font-bold text-slate-900">Jelszó változtatás</h3>
                <p className="mb-4 text-xs text-red-950/50">Hagyd üresen, ha nem kívánod módosítani.</p>
                <div className="space-y-3">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-brand-900">
                      Jelenlegi jelszó <span className="font-normal text-red-950/40">(hagyd üresen ha nem kívánod módosítani)</span>
                    </label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                      className="focus-brand w-full rounded-xl border border-brand-200 bg-brand-50/30 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition hover:border-brand-400"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-brand-900">
                      Új jelszó <span className="font-normal text-red-950/40">(hagyd üresen ha nem kívánod módosítani)</span>
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="focus-brand w-full rounded-xl border border-brand-200 bg-brand-50/30 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition hover:border-brand-400"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-brand-900">Az új jelszó megerősítése</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="focus-brand w-full rounded-xl border border-brand-200 bg-brand-50/30 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition hover:border-brand-400"
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-brand-100 bg-white p-6 shadow-sm">
                <h3 className="mb-4 text-base font-bold text-slate-900">Regisztrációs információk</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border border-brand-50 bg-brand-50/30 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-widest text-brand-700">Adatvédelmi irányelvek</p>
                    <p className="mt-1 text-sm font-semibold text-emerald-600">Elfogadva</p>
                  </div>
                  <div className="rounded-xl border border-brand-50 bg-brand-50/30 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-widest text-brand-700">Regisztráció dátuma</p>
                    <p className="mt-1 text-sm font-medium text-slate-900">
                      {user?.createdAt
                        ? new Date(user.createdAt).toLocaleDateString("hu-HU", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })
                        : "—"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-2xl border border-brand-100 bg-white p-6 shadow-sm">
                <button
                  onClick={() => void saveProfile()}
                  disabled={profileSaving}
                  className="btn-press rounded-xl bg-brand-900 px-6 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-brand-800 disabled:opacity-60"
                >
                  {profileSaving ? "Mentés..." : "Módosítások mentése"}
                </button>
                <button
                  onClick={() => void handleLogout()}
                  className="btn-press rounded-xl border border-rose-200 px-5 py-2.5 text-sm font-semibold text-rose-500 transition hover:bg-rose-50"
                >
                  Kijelentkezés
                </button>
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense>
      <DashboardContent />
    </Suspense>
  );
}
