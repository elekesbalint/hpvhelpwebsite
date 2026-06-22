/* eslint-disable @next/next/no-img-element */

const DEFAULT_SRC = "/branding/sam/logo-burgundy.png";

type Props = {
  className?: string;
  /** Logó szélessége px-ben (magasság arányosan) */
  width?: number;
};

/** SAM (Sexual Activity Monitoring) márkalogó – fekete háttérrel exportált PNG. */
export default function SamBrandLogo({ className = "", width = 200 }: Props) {
  return (
    <div
      className={`inline-flex items-center justify-center rounded-2xl bg-black px-5 py-3 ${className}`.trim()}
    >
      <img
        src={DEFAULT_SRC}
        alt="SAM – Sexual Activity Monitoring"
        width={width}
        height={Math.round(width * 0.35)}
        className="h-auto w-auto max-w-full object-contain"
        style={{ maxWidth: width }}
      />
    </div>
  );
}
