import { SIMPLEPAY_PAYMENT_INFO_PDF_URL } from "@/lib/simplepay-legal";

type SimplePayLogoLinkProps = {
  src?: string;
  alt?: string;
  className?: string;
};

/** SimplePay logo – kötelezően kattintható, a hivatalos fizetési tájékoztató PDF-re mutat. */
export default function SimplePayLogoLink({
  src = "/simplepay-by-otp.png",
  alt = "SimplePay by OTP Mobile",
  className = "h-8 w-auto max-w-[180px] object-contain",
}: SimplePayLogoLinkProps) {
  return (
    <a
      href={SIMPLEPAY_PAYMENT_INFO_PDF_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex shrink-0 rounded-lg outline-none ring-brand-600/30 transition hover:opacity-90 focus-visible:ring-2"
      title="SimplePay fizetési tájékoztató (PDF)"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} className={className} />
    </a>
  );
}
