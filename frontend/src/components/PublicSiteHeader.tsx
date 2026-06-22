"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import HeaderProductSearch, { HeaderSearchToggleButton } from "@/components/HeaderProductSearch";
import { useCart } from "@/hooks/useCart";
import { supabase } from "@/lib/supabase";
import SiteLogo from "@/components/SiteLogo";
import { COMPANY_CONTACT } from "@/lib/company-contact";

type NavItem = {
  href: string;
  label: string;
  /** Csak felirat, nem kattintható (pl. készülő oldal) */
  disabled?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  { href: "/akcios-termekek", label: "Akciós termékek" },
  { href: "/hpv-gyorsinfo", label: "HPV gyorsinfo" },
  { href: "/ugyfelszolgalat", label: "Ügyfélszolgálat" },
  { href: "/rolunk", label: "Rólunk" },
  { href: "/referenciak", label: "Referenciák", disabled: true },
];

const NEOTEST_URL = "https://neotest.hu";
const HPV_CENTRUM_URL = "https://hpvcentrum.hu";

type Props = {
  /** Felső telefon / email / nyitvatartás sáv */
  showInfoBar?: boolean;
};

export default function PublicSiteHeader({ showInfoBar = true }: Props) {
  const pathname = usePathname();
  const { totalItems } = useCart();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [authLoading, setAuthLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    const resolveName = (session: { user?: { user_metadata?: { full_name?: string }; email?: string } } | null) => {
      const n = session?.user?.user_metadata?.full_name?.trim();
      if (n) return n;
      return session?.user?.email?.split("@")[0]?.trim() || "Felhasználó";
    };
    void supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setIsAuthenticated(Boolean(data.session?.user));
      setDisplayName(data.session?.user ? resolveName(data.session) : "");
      setAuthLoading(false);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!mounted) return;
      setIsAuthenticated(Boolean(session?.user));
      setDisplayName(session?.user ? resolveName(session) : "");
      setAuthLoading(false);
    });
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (mobileMenuOpen) {
      document.documentElement.style.overflow = "hidden";
    } else {
      document.documentElement.style.overflow = "";
    }
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  const navLinkClass = (active: boolean) =>
    `block rounded-lg px-3 py-3 text-base font-medium transition active:bg-brand-100 md:inline-block md:rounded-lg md:px-2.5 md:py-1.5 md:text-[13px] lg:px-3 lg:text-sm ${
      active ? "bg-brand-50 text-brand-900" : "text-red-950/80 hover:bg-brand-50/80 hover:text-brand-900"
    }`;

  return (
    <>
      {showInfoBar ? (
        <div className="bg-brand-900 text-red-50">
          <div className="mx-auto flex w-full min-w-0 max-w-[1480px] flex-col items-center gap-2 px-4 py-2.5 text-[11px] font-medium leading-snug sm:flex-row sm:flex-wrap sm:justify-center sm:gap-x-5 sm:gap-y-1 sm:px-6 sm:text-xs">
            <div className="flex w-full min-w-0 flex-wrap items-center justify-center gap-x-4 gap-y-1.5 sm:w-auto sm:flex-nowrap">
              <span className="inline-flex items-center gap-1.5">
                <svg className="h-3.5 w-3.5 shrink-0 text-red-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2 6a3 3 0 013-3h2l2 5-2 1a12 12 0 006 6l1-2 5 2v2a3 3 0 01-3 3 16 16 0 01-16-16z" />
                </svg>
                <a href={COMPANY_CONTACT.phoneHref} className="transition hover:text-white">
                  {COMPANY_CONTACT.phone}
                </a>
              </span>
              <span className="hidden h-3.5 w-px shrink-0 bg-red-200/40 sm:block" />
              <span className="inline-flex min-w-0 max-w-full items-center gap-1.5">
                <svg className="h-3.5 w-3.5 shrink-0 text-red-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <a href={COMPANY_CONTACT.emailHref} className="truncate transition hover:text-white">
                  {COMPANY_CONTACT.email}
                </a>
              </span>
            </div>
            <span className="hidden h-3.5 w-px shrink-0 bg-red-200/40 md:block" aria-hidden />
            <div className="flex w-full min-w-0 flex-wrap items-center justify-center gap-2 sm:w-auto">
              <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                <svg className="h-3.5 w-3.5 shrink-0 text-red-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="9" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 7v5l3 2" />
                </svg>
                H-P: 8:00-16:00
              </span>
              <a
                href={HPV_CENTRUM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex shrink-0 items-center gap-1 rounded-full bg-white/15 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wide text-white ring-1 ring-white/25 transition hover:bg-white/25 hover:ring-white/40 sm:text-[11px]"
              >
                HPV Centrum
                <svg className="h-3 w-3 shrink-0 opacity-90" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      ) : null}

      <header className="sticky top-0 z-30 min-w-0 border-b border-brand-100/80 bg-white/90 shadow-sm backdrop-blur-md">
        <div className="mx-auto w-full min-w-0 max-w-[1480px] px-3 py-2.5 sm:px-5 sm:py-4 md:px-6">
          {/* Mobil: logo + akciók + hamburger */}
          <div className="flex min-w-0 items-center gap-2 md:hidden">
            <Link
              href="/"
              className="inline-flex min-w-0 max-w-[54%] shrink items-center overflow-hidden rounded-xl outline-none ring-brand-600/30 transition hover:opacity-95 focus-visible:ring-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              <SiteLogo withLink={false} size="md" />
            </Link>
            <div className="flex min-w-0 flex-1 items-center justify-end gap-1">
              <HeaderSearchToggleButton
                open={searchOpen}
                onClick={() => {
                  setSearchOpen((o) => !o);
                  if (!searchOpen) setMobileMenuOpen(false);
                }}
                className="h-10 w-10"
              />
              <a
                href={NEOTEST_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-press inline-flex shrink-0 items-center gap-0.5 rounded-xl bg-gradient-to-r from-rose-700 to-brand-900 px-2 py-2 text-[10px] font-bold leading-tight text-white shadow-md shadow-brand-900/20 transition hover:from-rose-600 hover:to-brand-800"
              >
                <span className="max-w-[4.5rem] truncate sm:max-w-none">neotest.hu</span>
                <svg className="h-3 w-3 shrink-0 opacity-90" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
              <Link href="/cart" aria-label="Kosár" className="btn-press relative shrink-0 rounded-lg border border-brand-200 p-2 text-red-950 transition hover:bg-brand-50">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <circle cx="9" cy="20" r="1" />
                  <circle cx="17" cy="20" r="1" />
                  <path d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.6a2 2 0 0 0 2-1.6L21 7H7" />
                </svg>
                {totalItems > 0 ? (
                  <span className="absolute -right-1.5 -top-1.5 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-brand-900 px-1 text-[10px] font-bold leading-none text-white shadow-sm shadow-brand-300">
                    {totalItems > 99 ? "99+" : totalItems}
                  </span>
                ) : null}
              </Link>
              {authLoading ? (
                <div className="h-9 w-16 shrink-0 rounded-lg border border-brand-100 bg-white p-1.5">
                  <div className="skeleton h-full w-full rounded-md" />
                </div>
              ) : isAuthenticated ? (
                <Link
                  href="/dashboard"
                  className="btn-press inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-brand-200 bg-white text-brand-800 shadow-sm transition hover:bg-brand-50"
                  aria-label="Fiókom"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21a8 8 0 0 0-16 0" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </Link>
              ) : (
                <Link
                  href="/login"
                  className="btn-press shrink-0 rounded-lg bg-brand-900 px-3 py-2 text-xs font-semibold text-white shadow-sm shadow-brand-300 transition hover:bg-brand-800"
                >
                  Belépés
                </Link>
              )}
              <button
                type="button"
                aria-expanded={mobileMenuOpen}
                aria-controls="mobile-main-nav"
                aria-label={mobileMenuOpen ? "Menü bezárása" : "Menü megnyitása"}
                className="btn-press ml-0.5 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-brand-200 bg-white text-brand-900 shadow-sm transition hover:bg-brand-50"
                onClick={() => setMobileMenuOpen((o) => !o)}
              >
                {mobileMenuOpen ? (
                  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Desktop grid */}
          <div className="hidden gap-3 gap-x-3 md:grid md:[grid-template-areas:'logo_nav_actions'] md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-center md:gap-x-3 lg:gap-x-6 xl:gap-x-8">
            <Link
              href="/"
              className="[grid-area:logo] inline-flex min-w-0 max-w-[min(100%,30rem)] shrink-0 items-center rounded-xl outline-none ring-brand-600/30 transition hover:opacity-95 focus-visible:ring-2 sm:max-w-none"
            >
              <SiteLogo withLink={false} size="xl" className="shrink-0" />
            </Link>

            <div className="[grid-area:actions] flex shrink-0 flex-nowrap items-center justify-end gap-2 justify-self-end">
              <HeaderSearchToggleButton
                open={searchOpen}
                onClick={() => setSearchOpen((o) => !o)}
              />
              <a
                href={NEOTEST_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-press inline-flex shrink-0 items-center gap-1 rounded-xl bg-gradient-to-r from-rose-700 to-brand-900 px-2.5 py-2 text-[11px] font-bold text-white shadow-md shadow-brand-900/20 transition hover:from-rose-600 hover:to-brand-800 sm:gap-1.5 sm:px-3 sm:text-xs md:px-4 md:text-sm"
              >
                neotest.hu
                <svg className="h-3.5 w-3.5 shrink-0 opacity-90" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
              <Link href="/cart" aria-label="Kosár" className="btn-press relative rounded-lg border border-brand-200 p-2.5 text-red-950 transition hover:bg-brand-50">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <circle cx="9" cy="20" r="1" />
                  <circle cx="17" cy="20" r="1" />
                  <path d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.6a2 2 0 0 0 2-1.6L21 7H7" />
                </svg>
                {totalItems > 0 ? (
                  <span className="absolute -right-2 -top-2 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-brand-900 px-1.5 text-[10px] font-bold leading-none text-white shadow-sm shadow-brand-300">
                    {totalItems > 99 ? "99+" : totalItems}
                  </span>
                ) : null}
              </Link>
              {authLoading ? (
                <div className="h-9 w-28 rounded-lg border border-brand-100 bg-white p-2">
                  <div className="skeleton h-full w-full rounded-md" />
                </div>
              ) : isAuthenticated ? (
                <Link
                  href="/dashboard"
                  className="inline-flex max-w-[128px] items-center gap-1.5 rounded-lg border border-brand-200 bg-white px-2 py-2 text-xs font-medium text-red-950 shadow-sm transition hover:bg-brand-50 sm:max-w-[160px] sm:gap-2 sm:px-3 sm:text-sm md:max-w-[180px] lg:max-w-[200px]"
                >
                  <svg className="h-4 w-4 shrink-0 text-brand-800" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21a8 8 0 0 0-16 0" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  <span className="truncate">Üdvözöljük, {displayName}</span>
                </Link>
              ) : (
                <Link href="/login" className="btn-press rounded-lg bg-brand-900 px-4 py-2 text-sm font-medium text-white shadow-sm shadow-brand-300 transition hover:bg-brand-800">
                  Bejelentkezés
                </Link>
              )}
            </div>

            <nav
              aria-label="Fő navigáció"
              className="[grid-area:nav] -mx-1 flex min-w-0 flex-nowrap items-center justify-center gap-x-0 overflow-x-auto overflow-y-hidden px-1 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {NAV_ITEMS.map((item) => {
                if (item.disabled) {
                  return (
                    <span
                      key={item.href}
                      className="shrink-0 cursor-default whitespace-nowrap rounded-lg px-2 py-1.5 text-xs font-medium text-red-950/45 sm:px-2.5 md:text-[13px] lg:px-3 lg:text-sm"
                      aria-disabled="true"
                    >
                      {item.label}
                    </span>
                  );
                }
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`shrink-0 whitespace-nowrap rounded-lg px-2 py-1.5 text-xs font-medium transition sm:px-2.5 md:text-[13px] lg:px-3 lg:text-sm ${
                      active ? "bg-brand-50 text-brand-900" : "text-red-950/70 hover:bg-brand-50/80 hover:text-brand-900"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <Suspense fallback={null}>
            <HeaderProductSearch open={searchOpen} onOpenChange={setSearchOpen} />
          </Suspense>

          {/* Mobil lenyíló menü */}
          <div
            id="mobile-main-nav"
            className={`border-t border-brand-100 bg-white md:hidden ${mobileMenuOpen ? "block" : "hidden"}`}
          >
            <nav aria-label="Fő navigáció (mobil)" className="flex max-h-[min(70vh,480px)] flex-col overflow-y-auto py-1">
              {NAV_ITEMS.map((item) => {
                if (item.disabled) {
                  return (
                    <span
                      key={item.href}
                      className="block cursor-default rounded-lg px-3 py-3 text-base font-medium text-red-950/45"
                      aria-disabled="true"
                    >
                      {item.label}
                    </span>
                  );
                }
                const active = pathname === item.href;
                return (
                  <Link key={item.href} href={item.href} className={navLinkClass(active)} onClick={() => setMobileMenuOpen(false)}>
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </header>
    </>
  );
}
