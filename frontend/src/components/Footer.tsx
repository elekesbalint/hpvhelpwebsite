import Link from "next/link";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-16 border-t border-brand-100 bg-white">
      <div className="mx-auto w-full max-w-6xl px-6 py-12">
        <div className="grid gap-10 md:grid-cols-[1.6fr_1fr_1fr]">

          {/* Brand + contact */}
          <div>
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-900 to-brand-700 shadow-md shadow-brand-200">
                <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <p className="font-serif text-lg font-bold text-brand-900">HPVHelp</p>
                <p className="text-xs font-semibold uppercase tracking-widest text-brand-700">Webshop</p>
              </div>
            </div>

            <p className="mb-5 text-sm leading-relaxed text-red-950/60">
              HPV és egészségügyi termékek, gyorstesztek, szűrések és egészségügyi eszközök webáruháza.
            </p>

            <div className="space-y-2.5 text-sm text-red-950/65">
              <div className="flex items-start gap-2.5">
                <svg className="mt-0.5 h-4 w-4 shrink-0 text-brand-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
                <span>Iroda és raktár: 7623 Pécs, Megyeri út 26. fszt. 108.</span>
              </div>
              <a href="tel:+36308657792" className="flex items-center gap-2.5 transition hover:text-brand-900">
                <svg className="h-4 w-4 shrink-0 text-brand-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"/>
                </svg>
                +36 30 865 7792
              </a>
              <a href="tel:+3672794379" className="flex items-center gap-2.5 transition hover:text-brand-900">
                <svg className="h-4 w-4 shrink-0 text-brand-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                </svg>
                +36 72 794 379
              </a>
              <a href="mailto:info@sunmed.hu" className="flex items-center gap-2.5 transition hover:text-brand-900">
                <svg className="h-4 w-4 shrink-0 text-brand-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                </svg>
                info@sunmed.hu
              </a>
            </div>
          </div>

          {/* Jogi / Impresszum */}
          <div>
            <h3 className="mb-4 text-sm font-bold text-slate-900">Jogi információk</h3>
            <nav className="space-y-2">
              {[
                { href: "/aszf", label: "Általános Szerződési Feltételek" },
                { href: "/adatvedelmi", label: "Adatvédelmi Tájékoztató" },
                { href: "/aszf#5", label: "Szállítási Feltételek" },
                { href: "/aszf#szolgaltato", label: "Impresszum" },
              ].map((link) => (
                <Link key={link.href} href={link.href} className="flex items-center gap-1.5 text-sm text-red-950/60 transition hover:text-brand-900">
                  <svg className="h-3 w-3 shrink-0 text-brand-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
                  </svg>
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Navigáció */}
          <div>
            <h3 className="mb-4 text-sm font-bold text-slate-900">Navigáció</h3>
            <nav className="space-y-2">
              {[
                { href: "/", label: "Webshop főoldal" },
                { href: "/cart", label: "Kosár" },
                { href: "/orders", label: "Rendeléseim" },
                { href: "/dashboard", label: "Fiókom" },
                { href: "/login", label: "Bejelentkezés" },
                { href: "/register", label: "Regisztráció" },
              ].map((link) => (
                <Link key={link.href} href={link.href} className="flex items-center gap-1.5 text-sm text-red-950/60 transition hover:text-brand-900">
                  <svg className="h-3 w-3 shrink-0 text-brand-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
                  </svg>
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-brand-100">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-5">
          <div className="space-y-1 text-xs text-red-950/50">
            <p>Sunmed Kft. {year} © Minden jog fenntartva!</p>
            <p>
              Designed &amp; coded by{" "}
              <a
                href="https://balintelekes.hu"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-brand-800 transition hover:text-brand-900"
              >
                Bálint Elekes
              </a>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/simplepay.png"     alt="SimplePay"   className="h-7 w-auto object-contain" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-googlepay.png" alt="Google Pay"  className="h-7 w-auto object-contain" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-applepay.png"  alt="Apple Pay"   className="h-7 w-auto object-contain" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-mastercard.png" alt="Mastercard" className="h-7 w-auto object-contain" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-maestro.png"   alt="Maestro"     className="h-7 w-auto object-contain" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-visa.png"      alt="Visa"        className="h-7 w-auto object-contain" />
            <div className="flex gap-3 text-xs text-red-950/40">
              <Link href="/aszf" className="transition hover:text-brand-900">ÁSZF</Link>
              <Link href="/adatvedelmi" className="transition hover:text-brand-900">Adatvédelem</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
