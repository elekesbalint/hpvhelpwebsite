import Link from "next/link";

const LOGO_SRC = "/branding/hpvhelp-logo.png";

type Props = {
  /** Ha nincs Link, csak a kép (pl. bejelentkezés oldal központi blokk) */
  withLink?: boolean;
  className?: string;
  /** Magasság osztályok */
  size?: "sm" | "md" | "lg" | "xl";
};

const sizeClass = {
  sm: "h-11 max-h-11 w-auto max-w-[240px] md:h-12 md:max-h-12 md:max-w-[280px]",
  md: "h-11 max-h-11 w-auto max-w-[260px] md:h-12 md:max-h-12 md:max-w-[310px]",
  lg: "h-12 max-h-12 w-auto max-w-[300px] md:h-14 md:max-h-14 md:max-w-[380px]",
  xl: "h-14 max-h-14 w-auto max-w-[340px] md:h-16 md:max-h-16 md:max-w-[420px] lg:h-[4.5rem] lg:max-h-[4.5rem] lg:max-w-[500px]",
} as const;

export default function SiteLogo({ withLink = true, className = "", size = "md" }: Props) {
  const img = (
    // eslint-disable-next-line @next/next/no-img-element -- statikus brand PNG, dimenziók változnak
    <img
      src={LOGO_SRC}
      alt="HPV help"
      width={512}
      height={181}
      className={`object-contain object-left ${sizeClass[size]} ${className}`.trim()}
    />
  );

  if (!withLink) {
    return img;
  }

  return (
    <Link href="/" className="inline-flex shrink-0 items-center outline-none ring-brand-600/30 transition hover:opacity-90 focus-visible:ring-2">
      {img}
    </Link>
  );
}

export { LOGO_SRC };
