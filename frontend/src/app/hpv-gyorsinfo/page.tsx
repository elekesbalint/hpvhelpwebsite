import type { Metadata } from "next";
import Link from "next/link";
import Footer from "@/components/Footer";
import PublicSiteHeader from "@/components/PublicSiteHeader";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { buildCategoryFilterUrl, CATEGORY_SLUGS } from "@/lib/product-search-url";

export const metadata: Metadata = buildPageMetadata({
  title: "HPV gyorsinfo",
  description:
    "Gyors információ a humán papillomavírus (HPV) fertőzésről, szűrési és kezelési lehetőségekről.",
  path: "/hpv-gyorsinfo",
});

export default function HpvGyorsinfoPage() {
  return (
    <div className="min-h-screen bg-[#fdf8f8] text-slate-900">
      <PublicSiteHeader />
      <main className="mx-auto w-full min-w-0 max-w-[1480px] px-4 py-10 sm:px-6 md:py-14">
        <div className="grid gap-8 lg:grid-cols-[1fr_min(340px,38%)] lg:items-start lg:gap-10">
          <div className="min-w-0 animate-fade-up">
            <p className="text-xs font-bold uppercase tracking-widest text-brand-700">HPV gyorsinfo</p>
            <h1 className="mt-2 font-serif text-2xl font-bold italic text-brand-900 md:text-3xl">Gyors információ</h1>
            <div className="mt-6 space-y-4 text-sm leading-relaxed text-red-950/80">
              <p>
                A HPV (teljes nevén: humán papilloma vírus) okozta betegség a világon a leggyakoribb szexuális úton
                terjedő fertőzés. Rendkívül fertőző és terjedhet bőrkontaktus útján a nemi szerveken (akár szexuális
                úton történő behatolás nélkül) vagy genitális, anális vagy orális szexuális együttlét során. Mind a
                férfiak, mind a nők megfertőződhetnek HPV-vel. A szexuálisan aktív lakosság körülbelül 75%-a legalább
                egyszer átesik HPV-fertőzésen élete során, és az is köztudott, hogy a HPV-fertőzés legmagasabb aránya a
                15 és 24 év közötti fiataloknál fordul elő.
              </p>
              <p>
                Több mint 200 különböző HPV-típus létezik, amelyek közül körülbelül 40 típus a nemi szerveket fertőzi
                meg. Sok alacsony kockázatú HPV-típusú megbetegedés magától elmúlik. Előfordul, hogy nem is tudja a
                páciens, hogy fertőzött. Az alacsony kockázatú HPV-típusok (pl. 6-os és 11-es) azonban látható tünetként
                szemölcsöket okozhatnak a nemi szerveken, és van legalább 15 magas kockázatú HPV-típus, mely
                rosszindulatú daganatos megbetegedést is okozhat. Nőknél a HPV-t a méhnyak-, a szeméremtest- és a
                hüvelyrákhoz, férfiaknál pedig a hímvessző daganathoz kötik. A HPV-t mind a nők, mind a férfiak
                esetében összefüggésbe hozták a végbélnyílás, valamint a száj- és torokrák kialakulásával.
              </p>
              <p>
                Bárki, aki szexuálisan aktív, ki van téve a HPV kockázatának. Mivel a fertőzésnek gyakran nincsenek
                jelei vagy tünetei, előfordulhat, hogy nem tudja megmondani, hogy Ön vagy partnere fertőzött-e.
              </p>
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href={buildCategoryFilterUrl(CATEGORY_SLUGS.samNoiOntesztek)}
                className="btn-press rounded-xl bg-brand-900 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-brand-800"
              >
                A szűrési lehetőségek érdekelnek
              </Link>
              <Link
                href={buildCategoryFilterUrl(CATEGORY_SLUGS.sammKezelesek)}
                className="btn-press rounded-xl border border-brand-300 bg-brand-50 px-5 py-2.5 text-sm font-bold text-brand-900 transition hover:bg-brand-100"
              >
                A kezelési lehetőségek érdekelnek
              </Link>
            </div>
          </div>
          <div className="animate-fade-up overflow-hidden rounded-2xl shadow-md lg:sticky lg:top-24">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/branding/hpv-info.jpg"
              alt="Pár egymás mellett"
              className="aspect-[3/4] w-full object-cover object-center"
              loading="lazy"
              decoding="async"
            />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
