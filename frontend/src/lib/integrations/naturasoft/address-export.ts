import { parseHungarianShippingAddress } from "@/lib/shipping/parse-address";
import { COMPANY_CONTACT } from "@/lib/company-contact";
import { effectiveShippingMethod } from "@/lib/shipping/carrier";
import type { PickupPointMeta } from "@/types/pickup-point";
import type { Database } from "@/types/supabase";

type Order = Database["public"]["Tables"]["orders"]["Row"];

export type NaturasoftAddressParts = {
  /** Teljes egy soros cím (kompatibilitás) */
  full: string;
  orszag: string;
  irsz: string;
  varos: string;
  utca: string;
};

/** NaturaSoft 3. lépés – cím mezők (ország / irsz / város / utca külön). */
export function buildNaturasoftAddressParts(raw: string | null | undefined): NaturasoftAddressParts {
  const full = raw?.trim() ?? "";
  if (!full) {
    return { full: "", orszag: "", irsz: "", varos: "", utca: "" };
  }

  const parsed = parseHungarianShippingAddress(full);
  if (parsed) {
    return {
      full,
      orszag: "Magyarország",
      irsz: parsed.postCode,
      varos: parsed.city,
      utca: parsed.streetLine,
    };
  }

  return { full, orszag: "Magyarország", irsz: "", varos: "", utca: full };
}

/** Szállítási cím – csomagpontnál irsz/város a pickup meta-ból (NS 3. lépéshez). */
export function buildNaturasoftShippingAddressParts(order: Order): NaturasoftAddressParts {
  const shippingMethod = effectiveShippingMethod(order) ?? order.shipping_method;

  if (shippingMethod === "pickup") {
    return buildNaturasoftAddressParts(COMPANY_CONTACT.office);
  }

  if (shippingMethod === "csomagpont" && order.pickup_point_id?.trim()) {
    const meta = order.pickup_point_meta as PickupPointMeta | null;
    const zip = meta?.zip?.trim() ?? "";
    const city = meta?.city?.trim() ?? "";
    const name = order.pickup_point_name?.trim() ?? "";
    const addr = order.pickup_point_address?.trim() ?? "";
    const utca = [name, addr].filter(Boolean).join(" — ");

    if (zip && city) {
      const full = utca ? `${zip} ${city}, ${utca}` : `${zip} ${city}`;
      return {
        full,
        orszag: "Magyarország",
        irsz: zip,
        varos: city,
        utca: utca || addr || name,
      };
    }

    const raw = order.shipping_address?.trim() || [addr, name].filter(Boolean).join(", ");
    const parsed = buildNaturasoftAddressParts(raw);
    if (parsed.irsz && parsed.varos) return parsed;
    return {
      full: raw,
      orszag: "Magyarország",
      irsz: "",
      varos: city,
      utca: utca || raw,
    };
  }

  return buildNaturasoftAddressParts(order.shipping_address);
}
