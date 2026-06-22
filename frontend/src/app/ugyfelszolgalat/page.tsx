import type { Metadata } from "next";
import Footer from "@/components/Footer";
import PublicSiteHeader from "@/components/PublicSiteHeader";
import {
  COMPANY_CONTACT,
  INTRO_VIDEO_URL,
  OFFICE_MAPS_EMBED_URL,
  OFFICE_MAPS_OPEN_URL,
} from "@/lib/company-contact";
import ShippingFeesTable from "@/components/ShippingFeesTable";

export const metadata: Metadata = {
  title: "Ügyfélszolgálat – HPVhelp",
  description: "Sunmed Kft. ügyfélszolgálat – elérhetőség, helyszín, nyitvatartás.",
};

export default function UgyfelszolgalatPage() {
  return (
    <div className="min-h-screen bg-[#fdf8f8] text-slate-900">
      <PublicSiteHeader />
      <main className="mx-auto w-full max-w-3xl px-6 py-12">
        <p className="text-xs font-bold uppercase tracking-widest text-brand-700">Kapcsolat</p>
        <h1 className="mt-2 font-serif text-3xl font-bold italic text-brand-900 md:text-4xl">Ügyfélszolgálat</h1>

        <p className="mt-6 text-sm leading-relaxed text-red-950/80">
          Kérdése van a rendeléssel, szállítással vagy termékekkel kapcsolatban? Forduljon hozzánk bizalommal —
          igyekszünk hamar válaszolni.
        </p>

        <div className="mt-8 space-y-6">
          <section className="rounded-2xl border border-brand-100 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-bold text-slate-900">{COMPANY_CONTACT.legalName}</h2>
            <p className="mt-1 text-xs text-red-950/55">A HPVhelp webáruház üzemeltetője</p>
            <dl className="mt-5 space-y-4 text-sm">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-brand-700">Telefon</dt>
                <dd className="mt-1">
                  <a
                    href={COMPANY_CONTACT.phoneHref}
                    className="font-medium text-brand-900 underline-offset-2 hover:underline"
                  >
                    {COMPANY_CONTACT.phone}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-brand-700">E-mail</dt>
                <dd className="mt-1">
                  <a
                    href={COMPANY_CONTACT.emailHref}
                    className="font-medium text-brand-900 underline-offset-2 hover:underline"
                  >
                    {COMPANY_CONTACT.email}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-brand-700">Nyitvatartás</dt>
                <dd className="mt-1 text-red-950/80">{COMPANY_CONTACT.hours}</dd>
                <dd className="mt-1 text-xs text-red-950/60">{COMPANY_CONTACT.hoursNote}</dd>
              </div>
            </dl>
          </section>

          <section className="rounded-2xl border border-brand-100 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-bold text-slate-900">Helyszín</h2>
            <dl className="mt-5 space-y-4 text-sm">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-brand-700">
                  {COMPANY_CONTACT.officeLabel}
                </dt>
                <dd className="mt-1 text-red-950/80">{COMPANY_CONTACT.office}</dd>
                <dd className="mt-1 text-xs text-red-950/60">Levelezési cím és ügyfélszolgálat.</dd>
              </div>
            </dl>

            <div className="mt-6 overflow-hidden rounded-xl border border-brand-100 bg-brand-50/30">
              <div className="border-b border-brand-100 bg-white px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">Térkép</p>
                <p className="mt-0.5 text-sm font-medium text-slate-900">{COMPANY_CONTACT.office}</p>
              </div>
              <div className="relative aspect-[16/10] w-full min-h-[220px] bg-brand-50">
                <iframe
                  title={`Térkép – ${COMPANY_CONTACT.office}`}
                  src={OFFICE_MAPS_EMBED_URL}
                  className="absolute inset-0 h-full w-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                />
              </div>
              <div className="border-t border-brand-100 bg-white px-4 py-3">
                <a
                  href={OFFICE_MAPS_OPEN_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-brand-800 underline-offset-2 transition hover:text-brand-900 hover:underline"
                >
                  <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Megnyitás Google Térképen
                </a>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-brand-100 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-bold text-slate-900">Szállítás</h2>
            <div className="mt-4 space-y-3 text-sm leading-relaxed text-red-950/80">
              <p className="rounded-xl border-2 border-brand-300 bg-brand-50/80 p-4 font-semibold text-brand-900">
                A 14 óráig leadott rendeléseket 1 munkanapon belül (aznap) elindítjuk, mely a következő
                munkanapon kiszállításra kerül (szabadság időszakában ez az idő hosszabb lehet).
              </p>
              <p>
                Csomagjaink <strong>diszkrétek</strong>, azokon <strong>nincs feltüntetve a tényleges tartalom</strong>.
                A megrendeléseket – az Ön választása alapján – a <strong>GLS</strong> vagy a{" "}
                <strong>Magyar Posta MPL</strong> szállítja a megadott címre.
              </p>
            </div>
            <div className="mt-6">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-brand-700">
                Szállítási díjak (bankkártyás fizetés)
              </p>
              <ShippingFeesTable />
            </div>
            <p className="mt-4 text-sm">
              <a href="/aszf#5" className="font-semibold text-brand-800 underline-offset-2 hover:underline">
                Részletes szállítási feltételek az ÁSZF-ben →
              </a>
            </p>
          </section>

          <div className="pt-2">
            <a
              href={INTRO_VIDEO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-brand-200 bg-brand-900 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-brand-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700"
            >
              <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="m15 10 4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Bemutatkozó videó
            </a>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
