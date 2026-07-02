import type { Metadata } from "next";
import Link from "next/link";
import Footer from "@/components/Footer";
import PublicSiteHeader from "@/components/PublicSiteHeader";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Letölthető dokumentumok",
  description: "Sunmed Kft. webáruház – letölthető nyomtatványok, visszaküldési lapok és dokumentumok.",
  path: "/letoltheto-dokumentumok",
});

const DOCUMENTS = [
  {
    title: "Termék-visszaküldési lap (elállási nyilatkozat)",
    description:
      "Kitöltendő nyomtatvány termék visszaküldéséhez és elállási jog gyakorlásához. A visszaküldés címe: 7623 Pécs, Megyeri út 26. fszt. 109.",
    href: "/documents/termek-visszakuldesi-lap.pdf",
    fileName: "termek-visszakuldesi-lap.pdf",
  },
] as const;

export default function LetolthetoDokumentumokPage() {
  return (
    <div className="min-h-screen bg-[#fdf8f8] text-slate-900">
      <PublicSiteHeader />
      <main className="mx-auto w-full max-w-3xl px-6 py-12">
        <p className="text-xs font-bold uppercase tracking-widest text-brand-700">Dokumentumok</p>
        <h1 className="mt-2 font-serif text-3xl font-bold italic text-brand-900 md:text-4xl">
          Letölthető dokumentumok
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-red-950/75">
          Az alábbi nyomtatványokat letöltheti, kitöltheti és postai úton visszaküldheti részünkre.
        </p>

        <ul className="mt-8 space-y-4">
          {DOCUMENTS.map((doc) => (
            <li
              key={doc.href}
              className="rounded-2xl border border-brand-100 bg-white p-6 shadow-sm"
            >
              <h2 className="text-base font-bold text-slate-900">{doc.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-red-950/70">{doc.description}</p>
              <a
                href={doc.href}
                download={doc.fileName}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-brand-900 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-brand-800"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
                </svg>
                PDF letöltése
              </a>
            </li>
          ))}
        </ul>

        <p className="mt-8 text-sm text-red-950/60">
          További jogi információk:{" "}
          <Link href="/aszf" className="font-semibold text-brand-800 underline-offset-2 hover:underline">
            ÁSZF
          </Link>
          ,{" "}
          <Link href="/adatvedelmi" className="font-semibold text-brand-800 underline-offset-2 hover:underline">
            adatvédelmi tájékoztató
          </Link>
          .
        </p>
      </main>
      <Footer />
    </div>
  );
}
