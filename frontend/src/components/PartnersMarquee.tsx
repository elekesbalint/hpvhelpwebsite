"use client";

import type { PartnerLogo } from "@/data/partner-logos";

type Props = {
  logos: PartnerLogo[];
};

export default function PartnersMarquee({ logos }: Props) {
  if (!logos.length) return null;

  const track = [...logos, ...logos];

  return (
    <section className="mt-16 w-full min-w-0 overflow-x-clip border-y border-brand-100/80 bg-white/60 py-10 backdrop-blur-sm">
      <div className="mx-auto min-w-0 max-w-[1480px] px-4 sm:px-6">
        <h2 className="text-center font-serif text-xl font-bold italic text-brand-900 md:text-2xl">
          Partnereink
        </h2>
        <p className="mx-auto mt-2 max-w-2xl text-center text-sm text-red-950/55">
          Megbízható partnerek és intézmények
        </p>

        <div className="partner-marquee-mask relative mt-8 overflow-hidden">
          <div className="partner-marquee-track flex w-max items-center gap-10 md:gap-12 lg:gap-14">
            {track.map((logo, i) => (
              <div
                key={`${logo.src}-${i}`}
                className="flex h-16 w-[140px] shrink-0 items-center justify-center sm:h-[4.5rem] sm:w-[160px] md:h-20 md:w-[180px]"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={logo.src}
                  alt={logo.alt}
                  className="max-h-full max-w-full object-contain"
                  loading="lazy"
                  decoding="async"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
