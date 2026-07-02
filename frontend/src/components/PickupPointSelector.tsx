"use client";
/* eslint-disable @next/next/no-img-element */

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { formatShippingFee, SHIPPING_FEES_HU } from "@/lib/shipping/fees";
import {
  ACTIVE_PICKUP_PROVIDERS,
  PICKUP_PROVIDER_FILTERS,
  PICKUP_PROVIDER_LABELS,
  PICKUP_PROVIDER_LOGOS,
} from "@/lib/shipping/pickup-point-ui";
import type { PickupPoint, PickupPointProvider } from "@/types/pickup-point";

const PickupPointMap = dynamic(() => import("@/components/PickupPointMap"), {
  ssr: false,
  loading: () => <div className="flex h-full items-center justify-center text-sm text-red-950/60">Térkép betöltése…</div>,
});

const HUNGARY_CENTER: [number, number] = [47.1625, 19.5033];
const PARCEL_POINT_FEE_LABEL = formatShippingFee(SHIPPING_FEES_HU.parcelPoint);

type Props = {
  open: boolean;
  onClose: () => void;
  onSelect: (point: PickupPoint) => void;
  selected: PickupPoint | null;
  searchZip?: string;
};

function normalize(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

function distanceSq(a: PickupPoint, lat: number, lng: number) {
  const dLat = a.lat - lat;
  const dLng = a.lng - lng;
  return dLat * dLat + dLng * dLng;
}

function interleaveProviders(points: PickupPoint[], limit: number): PickupPoint[] {
  const buckets = Object.fromEntries(ACTIVE_PICKUP_PROVIDERS.map((p) => [p, [] as PickupPoint[]])) as Record<
    (typeof ACTIVE_PICKUP_PROVIDERS)[number],
    PickupPoint[]
  >;
  for (const point of points) {
    if (point.provider in buckets) buckets[point.provider as (typeof ACTIVE_PICKUP_PROVIDERS)[number]].push(point);
  }

  const result: PickupPoint[] = [];
  let index = 0;
  while (result.length < limit) {
    let added = false;
    for (const provider of ACTIVE_PICKUP_PROVIDERS) {
      const next = buckets[provider][index];
      if (next) {
        result.push(next);
        added = true;
        if (result.length >= limit) break;
      }
    }
    if (!added) break;
    index += 1;
  }
  return result;
}

function ProviderLogo({ provider, className = "h-5 max-w-[72px] object-contain" }: { provider: PickupPointProvider; className?: string }) {
  const logo = PICKUP_PROVIDER_LOGOS[provider];
  return <img src={logo.src} alt={logo.alt} className={className} />;
}

export default function PickupPointSelector({ open, onClose, onSelect, selected, searchZip }: Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [points, setPoints] = useState<PickupPoint[]>([]);
  const [query, setQuery] = useState("");
  const [providers, setProviders] = useState<Record<PickupPointProvider, boolean>>({
    foxpost: false,
    gls: true,
    mpl: true,
  });
  const [highlighted, setHighlighted] = useState<PickupPoint | null>(selected);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    void fetch("/api/shipping/pickup-points")
      .then(async (res) => {
        const json = (await res.json()) as { points?: PickupPoint[]; error?: string };
        if (!res.ok) throw new Error(json.error ?? "Nem sikerült betölteni a csomagpontokat.");
        if (!cancelled) setPoints(json.points ?? []);
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Betöltési hiba.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    setHighlighted(selected);
  }, [selected, open]);

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  const filtered = useMemo(() => {
    const q = normalize(query.trim());
    return points.filter((p) => {
      if (!providers[p.provider]) return false;
      if (!q) return true;
      const hay = normalize([p.name, p.address, p.city, p.zip, p.provider].join(" "));
      return hay.includes(q) || (searchZip && p.zip.startsWith(searchZip));
    });
  }, [points, providers, query, searchZip]);

  const mapCenter = useMemo((): [number, number] => {
    if (highlighted) return [highlighted.lat, highlighted.lng];
    if (searchZip) {
      const match = points.find((p) => p.zip === searchZip);
      if (match) return [match.lat, match.lng];
    }
    return HUNGARY_CENTER;
  }, [highlighted, searchZip, points]);

  const mapZoom = highlighted || searchZip ? 13 : 7;

  const listPoints = useMemo(() => {
    const limit = 200;
    const q = query.trim();
    if (q || searchZip) {
      const [lat, lng] = mapCenter;
      return [...filtered]
        .sort((a, b) => distanceSq(a, lat, lng) - distanceSq(b, lat, lng))
        .slice(0, limit);
    }
    return interleaveProviders(filtered, limit);
  }, [filtered, query, searchZip, mapCenter]);

  function toggleProvider(provider: PickupPointProvider) {
    setProviders((prev) => ({ ...prev, [provider]: !prev[provider] }));
  }

  function confirmSelection() {
    if (!highlighted) return;
    onSelect(highlighted);
  }

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex h-[100dvh] flex-col overflow-hidden bg-white">
      <div className="flex h-full min-h-0 w-full flex-col overflow-hidden">
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-brand-100 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-6">
          <div className="min-w-0 pt-0.5">
            <p className="text-[11px] font-bold uppercase tracking-widest text-brand-700">Csomagpont átvétel</p>
            <h2 className="text-lg font-bold leading-tight text-slate-900">Válassz átvételi helyet</h2>
            <p className="mt-1 text-xs text-red-950/60">
              Szállítási díj: <span className="font-semibold text-brand-900">{PARCEL_POINT_FEE_LABEL}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="mt-1 shrink-0 rounded-lg border border-brand-100 bg-white p-2 text-slate-500 transition hover:bg-brand-50 hover:text-slate-900"
            aria-label="Bezárás"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:w-[min(420px,38vw)] lg:shrink-0 lg:border-r lg:border-brand-100">
            <div className="shrink-0 space-y-3 border-b border-brand-100 p-3 sm:p-4">
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Irányítószám, város vagy cím…"
                className="w-full rounded-xl border border-brand-200 px-3 py-2.5 text-base outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
              />

              <div className="flex flex-wrap gap-2">
                {PICKUP_PROVIDER_FILTERS.map(({ id, label }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => toggleProvider(id)}
                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold transition ${
                      providers[id]
                        ? "border-brand-700 bg-brand-50 text-brand-900"
                        : "border-brand-200 bg-white text-red-950/55"
                    }`}
                  >
                    <ProviderLogo provider={id} className="h-4 w-auto max-w-[52px] object-contain" />
                    {label}
                  </button>
                ))}
              </div>

              {!loading && !error ? (
                <p className="text-xs text-red-950/50">{filtered.length.toLocaleString("hu-HU")} találat a térképen és a listában</p>
              ) : null}
            </div>

            <div className="relative h-[30dvh] min-h-[170px] max-h-[220px] shrink-0 overflow-hidden border-b border-brand-100 lg:hidden">
              {!loading && !error ? (
                <PickupPointMap
                  points={filtered}
                  selectedId={highlighted?.id ?? null}
                  center={mapCenter}
                  zoom={mapZoom}
                  onSelect={setHighlighted}
                />
              ) : (
                <div className="flex h-full items-center justify-center bg-brand-50/40 text-sm text-red-950/50">
                  Térkép betöltése…
                </div>
              )}
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2 [-webkit-overflow-scrolling:touch]">
              {loading ? (
                <p className="p-4 text-sm text-red-950/60">Csomagpontok betöltése…</p>
              ) : null}
              {error ? (
                <p className="p-4 text-sm text-rose-700">{error}</p>
              ) : null}
              {!loading && !error
                ? listPoints.map((point) => (
                    <button
                      key={point.id}
                      type="button"
                      onClick={() => setHighlighted(point)}
                      className={`mb-2 flex w-full gap-3 rounded-xl border p-3 text-left transition ${
                        highlighted?.id === point.id
                          ? "border-brand-700 bg-brand-50 ring-1 ring-brand-200"
                          : "border-brand-100 bg-white hover:border-brand-300"
                      }`}
                    >
                      <div className="flex h-10 w-14 shrink-0 items-center justify-center rounded-lg border border-brand-100 bg-white px-1">
                        <ProviderLogo provider={point.provider} className="max-h-7 max-w-[52px] object-contain" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-brand-700">{PICKUP_PROVIDER_LABELS[point.provider]}</p>
                        <p className="text-sm font-bold text-slate-900">{point.name}</p>
                        <p className="text-xs leading-snug text-red-950/60">
                          {point.zip} {point.city}
                          {point.address ? `, ${point.address}` : ""}
                        </p>
                      </div>
                    </button>
                  ))
                : null}
              {!loading && filtered.length > 200 ? (
                <p className="px-2 py-3 text-xs text-red-950/50">Szűkítsd a keresést a teljes lista megjelenítéséhez.</p>
              ) : null}
            </div>

            <div className="hidden border-t border-brand-100 p-4 lg:block">
              <button
                type="button"
                disabled={!highlighted}
                onClick={confirmSelection}
                className="btn-press w-full rounded-xl bg-brand-900 px-4 py-3 text-sm font-bold text-white transition hover:bg-brand-800 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
              >
                {highlighted ? "Átvételi hely kiválasztása" : "Válassz egy csomagpontot"}
              </button>
            </div>
          </div>

          <div className="relative hidden min-h-0 flex-1 overflow-hidden lg:block">
            {!loading && !error ? (
              <PickupPointMap
                points={filtered}
                selectedId={highlighted?.id ?? null}
                center={mapCenter}
                zoom={mapZoom}
                onSelect={setHighlighted}
              />
            ) : (
              <div className="flex h-full items-center justify-center bg-brand-50/40 text-sm text-red-950/50">
                Térkép
              </div>
            )}
          </div>
        </div>

        <div className="shrink-0 border-t border-brand-100 bg-white p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-8px_24px_rgba(15,23,42,0.1)] lg:hidden">
          {highlighted ? (
            <p className="mb-2 line-clamp-2 text-xs font-semibold text-red-950/70">
              {highlighted.name} · {highlighted.zip} {highlighted.city}
            </p>
          ) : (
            <p className="mb-2 text-xs text-red-950/50">Érintsd meg a térképen vagy válassz a listából.</p>
          )}
          <button
            type="button"
            disabled={!highlighted}
            onClick={confirmSelection}
            className="btn-press w-full rounded-xl bg-brand-900 px-4 py-3.5 text-sm font-bold text-white transition hover:bg-brand-800 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
          >
            {highlighted ? "Átvételi hely kiválasztása" : "Előbb válassz csomagpontot"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
