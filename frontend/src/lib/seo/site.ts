/** Canonical public site URL (no trailing slash). */
export function getSiteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || "https://www.hpvhelp.hu").replace(/\/+$/, "");
}

export const SITE_NAME = "HPVhelp";

export const SITE_DEFAULT_TITLE =
  "HPVhelp – HPV szűrés, öntesztek és étrend-kiegészítők";

export const SITE_DESCRIPTION =
  "HPV öntesztek, laboratóriumi szűrések és étrend-kiegészítők online. Sunmed Kft. hivatalos webáruháza – gyors szállítás, megbízható eredmény.";

/** Default Open Graph / social share image (absolute path on this site). */
export const DEFAULT_OG_IMAGE_PATH = "/branding/hero-home.jpg";

export const PUBLIC_STATIC_PATHS = [
  "/",
  "/akcios-termekek",
  "/rolunk",
  "/hpv-gyorsinfo",
  "/ugyfelszolgalat",
  "/letoltheto-dokumentumok",
  "/aszf",
  "/adatvedelmi",
] as const;
