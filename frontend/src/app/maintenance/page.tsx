import Footer from "@/components/Footer";

export default function MaintenancePage() {
  return (
    <div className="min-h-screen bg-[#fdf8f8]">
      <main className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-lg text-center">

          {/* Logo */}
          <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-900 to-brand-700 shadow-xl shadow-brand-200">
            <svg className="h-10 w-10 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
            </svg>
          </div>

          <div className="rounded-3xl border border-brand-100 bg-white p-10 shadow-lg shadow-brand-100/30">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-brand-700 mb-3">
              HPVHelp Webshop
            </p>
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
