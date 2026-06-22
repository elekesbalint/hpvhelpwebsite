export type PickupPointProvider = "foxpost" | "gls" | "mpl";

export type PickupPointKind = "locker" | "shop" | "postoffice";

/** Checkoutban és API-ban használt egységes csomagpont */
export type PickupPoint = {
  id: string;
  provider: PickupPointProvider;
  providerPointId: string;
  name: string;
  address: string;
  city: string;
  zip: string;
  lat: number;
  lng: number;
  kind: PickupPointKind;
  /** MPL: PM = postán maradó, PP = postapont, CS = csomagautomata */
  mplDeliveryMode?: "PM" | "PP" | "CS";
  /** GLS PSD szolgáltatáshoz (Matchcode vagy azonosító) */
  glsPsdId?: string;
  /** FOXPOST operator_id a címkéhez */
  foxpostOperatorId?: string;
  /** MPL parcelPickupSite mező */
  mplParcelPickupSite?: string;
  codAllowed?: boolean;
};

export type PickupPointMeta = Pick<
  PickupPoint,
  | "provider"
  | "providerPointId"
  | "mplDeliveryMode"
  | "glsPsdId"
  | "foxpostOperatorId"
  | "mplParcelPickupSite"
  | "zip"
  | "city"
  | "lat"
  | "lng"
  | "kind"
>;

export type PickupPointProviderFilter = PickupPointProvider | "all";
