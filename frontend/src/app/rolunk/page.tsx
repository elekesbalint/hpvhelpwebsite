import type { Metadata } from "next";
import Footer from "@/components/Footer";
import PublicSiteHeader from "@/components/PublicSiteHeader";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Rólunk",
  description: "A Sunmed Kft. és a HPVhelp webáruház bemutatása – HPV szűrés, öntesztek és szakmai háttér.",
  path: "/rolunk",
});

export default function RolunkPage() {
  return (
    <div className="min-h-screen bg-[#fdf8f8] text-slate-900">
      <PublicSiteHeader />
      <main className="mx-auto w-full max-w-3xl px-6 py-12">
        <p className="text-xs font-bold uppercase tracking-widest text-brand-700">Rólunk</p>
        <h1 className="mt-2 font-serif text-3xl font-bold italic text-brand-900 md:text-4xl">Bemutatkozás</h1>
        <div className="prose prose-slate mt-8 max-w-none text-sm leading-relaxed text-red-950/80">
          <p>
            A <strong>HPVhelp</strong> webáruház a Sunmed Kft. hivatalos online értékesítési felülete, ahol
            megbízható forrásból, egyszerűen rendelheti meg a kínálatunkban szereplő önteszteket, és terápiás
            termékeket.
          </p>
          <p>
            Célunk, hogy szakmailag megalapozott, minőségi önteszteket és terápiás termékeket tegyünk
            elérhetővé — egy átlátható, biztonságos vásárlási élménnyel kiegészítve.
          </p>
          <p>
            Ügyfélszolgálatunk hétfőtől csütörtökig 8–16 óra között, pénteken 8–13 óra között érhető el
            telefonon és e-mailben. Kérdés esetén forduljon hozzánk bizalommal.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
