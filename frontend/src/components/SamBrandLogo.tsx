/* eslint-disable @next/next/no-img-element */

const DEFAULT_SRC = "/branding/sam/logo-burgundy-transparent.png";

type Props = {
  className?: string;
  /** Logó szélessége px-ben (magasság arányosan) */
  width?: number;
};

/** SAM (Sexual Activity Monitoring) márkalogó – átlátszó háttérrel. */
export default function SamBrandLogo({ className = "", width = 200 }: Props) {
  return (
    <img
      src={DEFAULT_SRC}
      alt="SAM – Sexual Activity Monitoring"
      width={width}
      height={Math.round(width * 0.35)}
      className={`h-auto max-w-full object-contain ${className}`.trim()}
      style={{ maxWidth: width }}
    />
  );
}
