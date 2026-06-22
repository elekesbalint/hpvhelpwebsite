import type { PickupPointProvider } from "@/types/pickup-point";

/** Checkoutban választható csomagpont-szolgáltatók */
export const ACTIVE_PICKUP_PROVIDERS = ["mpl", "gls"] as const satisfies readonly PickupPointProvider[];

export const PICKUP_PROVIDER_LOGOS: Record<PickupPointProvider, { src: string; alt: string }> = {
  foxpost: { src: "/shipping/foxpost.png", alt: "FOXPOST" },
  gls: { src: "/shipping/gls.png", alt: "GLS" },
  mpl: { src: "/shipping/magyar-posta.png", alt: "Magyar Posta" },
};

export const PICKUP_PROVIDER_LABELS: Record<PickupPointProvider, string> = {
  foxpost: "FOXPOST",
  gls: "GLS",
  mpl: "Posta / MPL",
};

/** Szűrő sorrend és megjelenő alcímek */
export const PICKUP_PROVIDER_FILTERS: {
  id: PickupPointProvider;
  label: string;
  sub?: string;
}[] = [
  { id: "mpl", label: "Posta", sub: "Postapontok" },
  { id: "gls", label: "GLS", sub: "Csomagpont / automata" },
];
