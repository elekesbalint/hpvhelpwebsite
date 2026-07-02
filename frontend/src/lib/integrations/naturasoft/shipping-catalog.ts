import { effectiveShippingMethod } from "@/lib/shipping/carrier";

/**
 * NaturaSoft raktárkészlet – szállítási költség tételek (Sunmed / NaturaSoft SUN* cikkszámok).
 */
export type NaturasoftShippingCatalogEntry = {
  name: string;
  articleNumber: string;
};

function resolvePickupProvider(order: {
  pickup_point_provider?: string | null;
  pickup_point_meta?: unknown;
}): string | null {
  const direct = order.pickup_point_provider?.trim().toLowerCase();
  if (direct) return direct;

  const meta = order.pickup_point_meta;
  if (meta && typeof meta === "object" && "provider" in meta) {
    const fromMeta = (meta as { provider?: string }).provider?.trim().toLowerCase();
    if (fromMeta) return fromMeta;
  }

  return null;
}

export function resolveNaturasoftShippingLine(order: {
  shipping_method?: string | null;
  pickup_point_provider?: string | null;
  pickup_point_meta?: unknown;
  pickup_point_id?: string | null;
}): NaturasoftShippingCatalogEntry | null {
  const method = effectiveShippingMethod(order) ?? order.shipping_method;
  switch (method) {
    case "posta":
      return {
        name: "Postaköltség MPL - házhozszállítással (közvetített szolgáltatás)",
        articleNumber: "SUN0000",
      };
    case "gls":
      return {
        name: "Postaköltség GLS - házhozszállítással (közvetített szolgáltatás)",
        articleNumber: "SUN000000",
      };
    case "abroad":
      return {
        name: "Postaköltség külföldre - (közvetített szolgáltatás)",
        articleNumber: "SUN000000000",
      };
    case "csomagpont": {
      const provider = resolvePickupProvider(order);
      if (provider === "gls") {
        return {
          name: "Postaköltség GLS - csomagautomata/csomagpont (közvetített szolgáltatás)",
          articleNumber: "SUN0000000",
        };
      }
      return {
        name: "Postaköltség MPL - csomagautomata/csomagpont (közvetített szolgáltatás)",
        articleNumber: "SUN00000",
      };
    }
    default:
      return null;
  }
}
