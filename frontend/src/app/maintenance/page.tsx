import Footer from "@/components/Footer";
import SiteLogo from "@/components/SiteLogo";

export default function MaintenancePage() {
  return (
    <div className="min-h-screen bg-[#fdf8f8]">
      <main className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-lg text-center">

          <div className="mb-8 flex justify-center">
            <SiteLogo size="lg" />
          </div>

          <div className="rounded-3xl border border-brand-100 bg-white p-10 shadow-lg shadow-brand-100/30">
            <h1 className="font-serif text-3xl font-bold italic text-brand-900 md:text-4xl">
              Karbantartás alatt
            </h1>
            <p className="mt-4 text-base text-red-950/60 leading-relaxed">
              Weboldalunk jelenleg karbantartás alatt áll.<br />
              Hamarosan visszatérünk — köszönjük a türelmét!
            </p>

            <div className="my-8 border-t border-brand-50" />

            <div className="space-y-3 text-sm text-red-950/60">
              <div className="flex items-center justify-center gap-2">
                <svg className="h-4 w-4 shrink-0 text-brand-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                </svg>
                <a href="mailto:info@sunmed.hu" className="font-semibold text-brand-800 transition hover:text-brand-900">
                  info@sunmed.hu
                </a>
              </div>
              <div className="flex items-center justify-center gap-2">
                <svg className="h-4 w-4 shrink-0 text-brand-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"/>
                </svg>
                <a href="tel:+36308657792" className="font-semibold text-brand-800 transition hover:text-brand-900">
                  +36 30 865 7792
                </a>
              </div>
            </div>
          </div>

          <p className="mt-6 text-xs text-red-950/30">
            © {new Date().getFullYear()} Sunmed Kft. — Minden jog fenntartva.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
