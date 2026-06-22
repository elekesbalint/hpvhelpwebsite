export type ShippingMethodId = "posta" | "gls" | "csomagpont" | "pickup" | "abroad";
export type ShippingCarrier = "gls" | "mpl" | "foxpost";

/** Checkout szállítási mód → futár API (házhozszállítás) */
export function carrierForShippingMethod(method: string | null | undefined): ShippingCarrier | null {
  if (method === "gls") return "gls";
  if (method === "posta") return "mpl";
  return null;
}

/** Rendelés alapján futár (csomagpont esetén a kiválasztott szolgáltató) */
export function carrierForOrder(order: {
  shipping_method?: string | null;
  pickup_point_provider?: string | null;
}): ShippingCarrier | null {
  const pickup = order.pickup_point_provider;
  if (pickup === "gls" || pickup === "mpl" || pickup === "foxpost") return pickup;
  return carrierForShippingMethod(order.shipping_method);
}

export function shippingMethodLabel(method: string | null | undefined): string {
  switch (method) {
    case "posta":
      return "Magyar Posta (házhoz)";
    case "gls":
      return "GLS (házhoz)";
    case "csomagpont":
      return "Csomagpont";
    case "pickup":
      return "Személyes átvétel";
    case "abroad":
      return "Külföldi szállítás";
    default:
      return method ?? "—";
  }
}

export function pickupProviderLabel(provider: string | null | undefined): string {
  switch (provider) {
    case "foxpost":
      return "FOXPOST";
    case "gls":
      return "GLS";
    case "mpl":
      return "Posta / MPL";
    default:
      return provider ?? "—";
  }
}
