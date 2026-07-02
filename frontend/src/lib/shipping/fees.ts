export type ShippingFeeMethod = "posta" | "gls" | "csomagpont" | "pickup" | "abroad";

/** Fix szállítási díjak (bruttó Ft) – webáruházi bankkártyás fizetés. */
export const SHIPPING_FEES_HU = {
  mplHome: 1_950,
  glsHome: 2_250,
  parcelPoint: 1_650,
  pickup: 0,
} as const;

export const EU_ABROAD_SHIPPING_FEE = 12_000;

export const FIXED_SHIPPING_ROWS = [
  { label: "Házhozszállítás (MPL)", fee: SHIPPING_FEES_HU.mplHome },
  { label: "Házhozszállítás (GLS)", fee: SHIPPING_FEES_HU.glsHome },
  { label: "Csomagpont / csomagautomata / postapont (MPL/GLS)", fee: SHIPPING_FEES_HU.parcelPoint },
  { label: "Személyes átvétel (7623 Pécs, Megyeri út 26. fszt. 109.)", fee: SHIPPING_FEES_HU.pickup },
] as const;

export function shippingFeeForSubtotal(
  method: ShippingFeeMethod,
  options?: { freeShipping?: boolean },
): number {
  if (options?.freeShipping) return 0;

  switch (method) {
    case "posta":
      return SHIPPING_FEES_HU.mplHome;
    case "gls":
      return SHIPPING_FEES_HU.glsHome;
    case "csomagpont":
      return SHIPPING_FEES_HU.parcelPoint;
    case "pickup":
      return SHIPPING_FEES_HU.pickup;
    case "abroad":
      return EU_ABROAD_SHIPPING_FEE;
    default:
      return 0;
  }
}

export function formatShippingFee(amount: number): string {
  if (amount <= 0) return "Ingyenes";
  return `${amount.toLocaleString("hu-HU")} Ft`;
}
