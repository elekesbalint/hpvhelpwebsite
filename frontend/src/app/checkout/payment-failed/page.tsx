"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { formatOrderPublicId } from "@/lib/order-display-id";
import { SIMPLEPAY_FAILED_BODY, SIMPLEPAY_FAILED_TITLE } from "@/lib/simplepay-legal";
import SiteLogo from "@/components/SiteLogo";
import SimplePayTransactionId from "@/components/SimplePayTransactionId";

const REASON_COPY: Record<string, { title: string; body: string }> = {
  cancel: {
    title: "Fizetés megszakítva",
    body: "A fizetési folyamatot megszakítottad. A rendelésed megmaradt.",
  },
  timeout: {
    title: "Fizetési időtúllépés",
    body: "A fizetési ablak lejárt; a rendelésed megmaradt.",
  },
  unknown: {
    title: "Fizetési visszajelzés nem egyértelmű",
    body: "Nem kaptunk egyértelmű visszajelzést a fizetőszolgáltatótól. Ellenőrizd a rendelés állapotát a fiókodban, vagy lépj kapcsolatba velünk.",
  },
  "invalid-signature": {
    title: "Biztonsági ellenőrzés sikertelen",
    body: "A fizetőoldalról érkező adat nem ellenőrizhető. Ha a terhelés mégis megtörtént, hamarosan frissül a rendelés állapota; egyébként kérjük, vedd fel velünk a kapcsolatot.",
  },
};

function PaymentFailedContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const transactionId = searchParams.get("transactionId");
  const reason = (searchParams.get("reason") ?? "unknown").toLowerCase();
  const isSimplePayFail = reason === "fail";
  const copy = REASON_COPY[reason] ?? REASON_COPY.unknown;
  const publicId = orderId ? formatOrderPublicId(orderId) : null;

  return (
    <div className="min-h-screen bg-[#fdf8f8] text-slate-900">
      <header className="border-b border-brand-100/80 bg-white/80 shadow-sm backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <Link href="/" className="inline-flex shrink-0 items-center outline-none ring-brand-600/30 transition hover:opacity-90 focus-visible:ring-2">
            <SiteLogo withLink={false} size="md" />
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-6 py-12">
        <div className="space-y-6">
          <div className="text-center">
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-rose-100 text-rose-600">
              <svg className="h-10 w-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">
              {isSimplePayFail ? SIMPLEPAY_FAILED_TITLE : copy.title}
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-red-950/70">
              {isSimplePayFail ? SIMPLEPAY_FAILED_BODY : copy.body}
            </p>
            <div className="mt-4 space-y-2">
              <SimplePayTransactionId transactionId={transactionId} className="text-sm text-red-950/70" />
              {publicId ? (
                <p className="text-sm text-red-950/60">
                  Rendelés: <span className="font-mono font-semibold text-slate-900">{publicId}</span>
                </p>
              ) : null}
            </div>
          </div>

          {!isSimplePayFail ? (
            <div className="rounded-xl border border-amber-100 bg-amber-50/80 p-4 text-left text-sm text-amber-950">
              <p className="font-semibold text-amber-900">Apple Pay / Google Pay</p>
              <p className="mt-1 text-amber-900/90">
                Az Apple Pay-hez a kereskedői domain Apple Pay regisztrációja szükséges a SimplePay / Apple felületén. A Google Pay a SimplePay fizetőoldalán működik; ha ott „sikertelen” jelenik meg, a fenti üzenet a tényleges eredményt tükrözi — a rendelés fizetési státusza a fiókodban ellenőrizhető.
              </p>
            </div>
          ) : null}

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/"
              className="btn-press flex flex-1 items-center justify-center rounded-xl bg-brand-900 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-brand-800"
            >
              Vissza a webshopba
            </Link>
            {orderId ? (
              <Link
                href={`/orders/${orderId}`}
                className="flex flex-1 items-center justify-center rounded-xl border border-brand-200 bg-white px-5 py-3 text-sm font-semibold text-brand-900 shadow-sm transition hover:bg-brand-50"
              >
                Rendelés részletei
              </Link>
            ) : (
              <Link
                href="/orders"
                className="flex flex-1 items-center justify-center rounded-xl border border-brand-200 bg-white px-5 py-3 text-sm font-semibold text-brand-900 shadow-sm transition hover:bg-brand-50"
              >
                Rendeléseim
              </Link>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function CheckoutPaymentFailedPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#fdf8f8] px-6 py-12">
          <div className="mx-auto max-w-3xl space-y-4">
            <div className="skeleton mx-auto h-24 w-24 rounded-full" />
            <div className="skeleton h-8 w-full rounded-xl" />
          </div>
        </div>
      }
    >
      <PaymentFailedContent />
    </Suspense>
  );
}
