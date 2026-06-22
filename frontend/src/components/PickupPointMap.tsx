"use client";

import MarkerClusterGroup from "react-leaflet-cluster";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import { useEffect } from "react";
import {
  PICKUP_PROVIDER_LOGOS,
} from "@/lib/shipping/pickup-point-ui";
import type { PickupPoint, PickupPointProvider } from "@/types/pickup-point";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";

function clusterColor(count: number): string {
  if (count >= 200) return "#ef4444";
  if (count >= 50) return "#eab308";
  return "#14b8a6";
}

function createClusterIcon(cluster: L.MarkerCluster) {
  const count = cluster.getChildCount();
  const size = count >= 200 ? 52 : count >= 50 ? 46 : 40;
  const color = clusterColor(count);
  return L.divIcon({
    html: `<div style="
      width:${size}px;height:${size}px;
      background:${color};
      color:#fff;
      border:3px solid rgba(255,255,255,0.95);
      border-radius:50%;
      display:flex;align-items:center;justify-content:center;
      font-weight:700;font-size:${count >= 1000 ? 11 : 13}px;
      box-shadow:0 2px 8px rgba(0,0,0,0.25);
    ">${count.toLocaleString("hu-HU")}</div>`,
    className: "pickup-cluster-icon",
    iconSize: L.point(size, size),
  });
}

const providerIcons: Partial<Record<PickupPointProvider, L.DivIcon>> = {};

function iconForProvider(provider: PickupPointProvider): L.DivIcon {
  if (!providerIcons[provider]) {
    const logo = PICKUP_PROVIDER_LOGOS[provider];
    providerIcons[provider] = L.divIcon({
      html: `<img src="${logo.src}" alt="${logo.alt}" style="
        width:32px;height:32px;object-fit:contain;
        background:#fff;border-radius:6px;padding:2px;
        border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.28);
      " />`,
      className: "pickup-provider-marker",
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      popupAnchor: [0, -16],
    });
  }
  return providerIcons[provider]!;
}

function MapFocus({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom, { animate: true });
  }, [center, zoom, map]);
  return null;
}

type Props = {
  points: PickupPoint[];
  selectedId: string | null;
  center: [number, number];
  zoom: number;
  onSelect: (point: PickupPoint) => void;
};

export default function PickupPointMap({ points, selectedId, center, zoom, onSelect }: Props) {
  return (
    <MapContainer center={center} zoom={zoom} className="h-full w-full z-0" scrollWheelZoom>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapFocus center={center} zoom={zoom} />
      <MarkerClusterGroup
        chunkedLoading
        maxClusterRadius={60}
        spiderfyOnMaxZoom
        showCoverageOnHover={false}
        zoomToBoundsOnClick
        iconCreateFunction={createClusterIcon}
      >
        {points.map((point) => (
          <Marker
            key={point.id}
            position={[point.lat, point.lng]}
            icon={iconForProvider(point.provider)}
            eventHandlers={{
              click: () => onSelect(point),
            }}
          >
            <Popup>
              <div className="min-w-[180px] text-sm">
                <div className="mb-2 flex items-center gap-2">
                  <img
                    src={PICKUP_PROVIDER_LOGOS[point.provider].src}
                    alt=""
                    className="h-6 max-w-[72px] object-contain"
                  />
                </div>
                <p className="font-bold">{point.name}</p>
                <p className="text-red-950/70">{point.address}</p>
                <p className="text-red-950/70">
                  {point.zip} {point.city}
                </p>
                {selectedId === point.id ? (
                  <p className="mt-2 font-semibold text-emerald-700">Kiválasztva</p>
                ) : (
                  <button
                    type="button"
                    className="mt-2 rounded bg-brand-900 px-2 py-1 text-xs font-bold text-white"
                    onClick={() => onSelect(point)}
                  >
                    Kiválasztás
                  </button>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MarkerClusterGroup>
    </MapContainer>
  );
}
