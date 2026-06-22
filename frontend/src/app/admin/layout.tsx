"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const ADMIN_IDLE_TIMEOUT_MS = 15 * 60 * 1000;
const ADMIN_LAST_ACTIVITY_KEY = "admin_last_activity_at";

const navItems = [
  {
    href: "/admin",
    label: "Vezérlőpult",
    icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
    exact: true,
    badge: "ordersAttention" as const,
  },
  {
    href: "/admin/orders",
    label: "Rendelések",
    icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
    badge: "ordersAttention" as const,
  },
  {
    href: "/admin/products",
    label: "Termékek",
    icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4",
  },
  {
    href: "/admin/categories",
    label: "Kategóriák",
    icon: "M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z",
  },
  {
    href: "/admin/coupons",
    label: "Kuponok",
    icon: "M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z",
  },
  {
    href: "/admin/actions",
    label: "Audit log",
    icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01",
  },
  {
    href: "/admin/beallitasok",
    label: "Beállítások",
    icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z",
  },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [adminName, setAdminName] = useState("Admin");
  const [checking, setChecking] = useState(true);
  const [ordersAttentionCount, setOrdersAttentionCount] = useState(0);

  const isAuthPage = pathname === "/admin/login" || pathname === "/admin/verify-2fa" || pathname === "/admin/setup-2fa";

  const refreshOrderBadges = async () => {
    const { count, error } = await supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .in("status", ["pending", "paid"]);
    if (!error) setOrdersAttentionCount(count ?? 0);
  };

  useEffect(() => {
    if (isAuthPage || checking) return;

    void refreshOrderBadges();
    const interval = window.setInterval(() => void refreshOrderBadges(), 30_000);
    const onVisible = () => {
      if (document.visibilityState === "visible") void refreshOrderBadges();
    };
    document.addEventListener("visibilitychange", onVisible);

    const channel = supabase
      .channel("admin-order-badges")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => {
        void refreshOrderBadges();
      })
      .subscribe();

    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
      void supabase.removeChannel(channel);
    };
  }, [isAuthPage, checking]);

  useEffect(() => {
    if (isAuthPage) { setChecking(false); return; }

    void supabase.auth.getSession().then(async ({ data }) => {
      const sessionUser = data.session?.user;
      if (!sessionUser) { router.replace("/admin/login"); return; }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role, full_name")
        .eq("id", sessionUser.id)
        .maybeSingle();

      if (profile?.role !== "admin") { router.replace("/admin/login"); return; }

      // Require AAL2 (TOTP verified) for all admin pages
      const { data: factors } = await supabase.auth.mfa.listFactors();
      const totpFactors = factors?.totp ?? [];

      if (totpFactors.length === 0) {
        router.replace("/admin/setup-2fa");
        return;
      }

      const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (aal?.currentLevel !== "aal2") {
        router.replace("/admin/verify-2fa");
        return;
      }

      setAdminName(
        (profile?.full_name as string | undefined)?.trim() ||
        sessionUser.email?.split("@")[0] ||
        "Admin"
      );
      setChecking(false);
    });
  }, [router, isAuthPage]);

  async function handleLogout() {
    await supabase.auth.signOut();
    try {
      localStorage.removeItem(ADMIN_LAST_ACTIVITY_KEY);
    } catch {
      // noop
    }
    router.replace("/admin/login");
  }

  useEffect(() => {
    if (isAuthPage) return;

    const touch = () => {
      try {
        localStorage.setItem(ADMIN_LAST_ACTIVITY_KEY, String(Date.now()));
      } catch {
        // noop
      }
    };
    touch();

    const onActivity = () => touch();
    window.addEventListener("pointerdown", onActivity);
    window.addEventListener("keydown", onActivity);
    window.addEventListener("scroll", onActivity, { passive: true });

    const interval = window.setInterval(() => {
      const lastRaw = localStorage.getItem(ADMIN_LAST_ACTIVITY_KEY);
      const last = Number(lastRaw || "0");
      if (!last) return;
      if (Date.now() - last <= ADMIN_IDLE_TIMEOUT_MS) return;
      void supabase.auth.signOut().then(() => {
        localStorage.removeItem(ADMIN_LAST_ACTIVITY_KEY);
        router.replace("/admin/login?reason=timeout");
      });
    }, 30_000);

    return () => {
      window.removeEventListener("pointerdown", onActivity);
      window.removeEventListener("keydown", onActivity);
      window.removeEventListener("scroll", onActivity);
      window.clearInterval(interval);
    };
  }, [isAuthPage, router]);

  if (isAuthPage) return <>{children}</>;

  if (checking) {
    return (
      <div className="min-h-screen bg-[#fdf8f8] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-brand-900 to-brand-700 animate-pulse" />
          <p className="text-sm text-red-950/60">Ellenőrzés...</p>
        </div>
      </div>
    );
  }

  const isActive = (item: (typeof navItems)[0]) => {
    if (item.exact) return pathname === item.href;
    return pathname.startsWith(item.href);
  };

  const badgeCount = (item: (typeof navItems)[0]) => {
    if (item.badge === "ordersAttention") return ordersAttentionCount;
    return 0;
  };

  const formatBadge = (count: number) => (count > 99 ? "99+" : String(count));

  return (
    <div className="min-h-screen bg-[#fdf8f8] text-slate-900">
      <header className="sticky top-0 z-30 border-b border-brand-100/80 bg-white/80 shadow-sm backdrop-blur-md">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-900 to-brand-700 shadow-md shadow-brand-200">
              <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-900">HPVhelp Admin</p>
              <p className="text-xs text-red-950/50">Adminisztrációs felület</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/" className="text-sm font-medium text-brand-900 transition hover:text-red-950">
              Webshop
            </Link>
            <div className="flex items-center gap-2 rounded-lg border border-brand-200 bg-white px-3 py-2 text-sm font-medium text-red-950 shadow-sm">
              <svg className="h-4 w-4 text-brand-800" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21a8 8 0 0 0-16 0" /><circle cx="12" cy="7" r="4" />
              </svg>
              <span>Üdvözöljük, {adminName}!</span>
            </div>
            <button
              onClick={() => void handleLogout()}
              className="btn-press rounded-lg border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-500 transition hover:bg-rose-50"
            >
              Kilépés
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        <aside className="sticky top-[73px] h-[calc(100vh-73px)] w-64 shrink-0 overflow-y-auto border-r border-brand-100 bg-white/80 backdrop-blur">
          <nav className="space-y-1 p-4">
            {navItems.map((item) => {
              const count = badgeCount(item);
              const active = isActive(item);
              return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  active
                    ? "bg-brand-900 text-white shadow-sm"
                    : "text-red-950/70 hover:bg-brand-50"
                }`}
              >
                <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                </svg>
                <span className="min-w-0 flex-1">{item.label}</span>
                {count > 0 ? (
                  <span
                    className={`ml-auto flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full px-1.5 text-[10px] font-bold leading-none ${
                      active ? "bg-rose-500 text-white" : "bg-rose-600 text-white"
                    }`}
                    aria-label={`${count} feldolgozandó rendelés`}
                  >
                    {formatBadge(count)}
                  </span>
                ) : null}
              </Link>
            );
            })}
          </nav>
        </aside>

        <main className="flex-1 min-w-0 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
