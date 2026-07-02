/* eslint-disable @next/next/no-img-element */

const DEFAULT_SRC = "/branding/samm/logo-samm-transparent.png";

/** SAMM logó arány (1024×277) – SAM blokkmagassághoz igazításhoz. */
const SAMM_ASPECT = 277 / 1024;
const SAM_ASPECT = 413 / 1024;

type Props = {
  className?: string;
  /** SAM logó szélességével egyező referencia – a SAMM magassága ehhez igazodik. */
  width?: number;
  /** @deprecated A tagline a logóképen van; a prop kompatibilitás miatt maradt. */
  showTagline?: boolean;
};

/** SAMM (Sexual Activity Monitoring & Management) márkalogó – átlátszó háttérrel. */
export default function SammBrandLogo({ className = "", width = 180 }: Props) {
  const samBlockHeight = Math.round(width * SAM_ASPECT);
  const displayWidth = Math.round(samBlockHeight / SAMM_ASPECT);

  return (
    <img
      src={DEFAULT_SRC}
      alt="SAMM – Sexual Activity Monitoring & Management"
      width={displayWidth}
      height={samBlockHeight}
      className={`block h-auto max-w-full object-contain object-left ${className}`.trim()}
      style={{ maxWidth: displayWidth }}
    />
  );
}
