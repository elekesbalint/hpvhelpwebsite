import Link from "next/link";
import PublicSiteHeader from "@/components/PublicSiteHeader";

export default function ProductNotFound() {
  return (
    <div className="min-h-screen bg-[#fdf8f8] text-slate-900">
      <PublicSiteHeader />
      <main className="mx-auto max-w-2xl px-6 py-16 text-center">
        <h1 className="text-2xl font-bold text-slate-900">A termék nem található</h1>
        <p className="mt-3 text-sm text-red-950/70">
          A keresett termék nem érhető el, vagy már nem kapható a webáruházban.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-brand-900 px-6 py-3 text-sm font-bold text-white transition hover:bg-brand-800"
        >
          Vissza a webshopba
        </Link>
      </main>
    </div>
  );
}
