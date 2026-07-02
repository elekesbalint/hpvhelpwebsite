/** Nyilvános mérési azonosítók – env felülírhatja. */
export const GA4_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID?.trim() || "G-M4MQPY67DR";
export const GOOGLE_ADS_ID =
  process.env.NEXT_PUBLIC_GOOGLE_ADS_ID?.trim() || "AW-1053969826";
export const META_PIXEL_ID =
  process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim() || "4357811537865859";
export const TIKTOK_PIXEL_ID =
  process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID?.trim() || "D91SPPBC77U79CKELB20";

export const META_CAPI_ACCESS_TOKEN = process.env.META_CAPI_ACCESS_TOKEN?.trim() ?? "";
export const META_CAPI_TEST_EVENT_CODE = process.env.META_CAPI_TEST_EVENT_CODE?.trim() ?? "";

export function isGoogleAnalyticsEnabled(): boolean {
  return Boolean(GA4_MEASUREMENT_ID);
}

export function isMarketingEnabled(): boolean {
  return Boolean(META_PIXEL_ID || TIKTOK_PIXEL_ID || GOOGLE_ADS_ID);
}

export function isPublicAnalyticsPath(pathname: string): boolean {
  return (
    !pathname.startsWith("/admin") &&
    pathname !== "/maintenance/access"
  );
}
