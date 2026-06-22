import { gunzipSync } from "zlib";
import { createHash } from "crypto";
import { getGlsConfig } from "@/lib/shipping/gls";
import type { PickupPoint, PickupPointProvider } from "@/types/pickup-point";

const GLS_PUBLIC_URL = "https://map.gls-hungary.com/data/deliveryPoints/hu.json";
const MPL_POSTINFO2_URL = "https://httpmegosztas.posta.hu/PartnerExtra/Out/PostInfo2.xml";

type CacheEntry = { points: PickupPoint[]; fetchedAt: number };
let cache: CacheEntry | null = null;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

function hashGlsPassword(password: string): number[] {
  return Array.from(createHash("sha512").update(password, "utf8").digest());
}

function parseHuCoord(value: string | undefined): number | null {
  if (!value) return null;
  const n = Number(value.trim().replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

function tagValue(block: string, tag: string): string {
  const m = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return m?.[1]?.trim() ?? "";
}

async function fetchGlsPointsFromPublicJson(): Promise<PickupPoint[]> {
  const res = await fetch(GLS_PUBLIC_URL, { next: { revalidate: 86400 } });
  if (!res.ok) throw new Error(`GLS nyilvános lista hiba (${res.status})`);
  const json = (await res.json()) as {
    items?: {
      id?: string;
      name?: string;
      type?: string;
      contact?: { postalCode?: string; city?: string; address?: string };
      location?: [number, number];
    }[];
  };
  const items = json.items ?? [];
  return items
    .filter((r) => r.id && r.location?.length === 2)
    .map((r) => {
      const kind = r.type?.includes("locker") ? ("locker" as const) : ("shop" as const);
      return {
        id: `gls:${r.id}`,
        provider: "gls" as PickupPointProvider,
        providerPointId: String(r.id),
        glsPsdId: String(r.id),
        name: r.name?.trim() || "GLS csomagpont",
        address: r.contact?.address?.trim() || "",
        city: r.contact?.city?.trim() || "",
        zip: r.contact?.postalCode?.trim() || "",
        lat: Number(r.location![0]),
        lng: Number(r.location![1]),
        kind,
        codAllowed: true,
      };
    });
}

function decompressGlsApiData(data: unknown): unknown[] {
  if (!data) return [];
  if (Array.isArray(data) && data.length > 0 && typeof data[0] === "object") return data;
  if (typeof data === "string") {
    const buf = Buffer.from(data, "base64");
    const raw = gunzipSync(buf).toString("utf8");
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed : [];
  }
  if (Array.isArray(data) && data.every((n) => typeof n === "number")) {
    const raw = gunzipSync(Buffer.from(data)).toString("utf8");
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed : [];
  }
  return [];
}

async function fetchGlsPointsFromApi(): Promise<PickupPoint[]> {
  const config = getGlsConfig();
  if (!config) return [];

  const res = await fetch(`${config.apiBase}/MasterDataService.svc/json/GetDeliveryPoints`, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({
      Username: config.username,
      Password: hashGlsPassword(config.password),
      CountryIsoCode: "HU",
    }),
  });

  const json = (await res.json()) as {
    ErrorCode?: number;
    ErrorDescription?: string;
    Data?: unknown;
  };

  if (json.ErrorCode != null && json.ErrorCode !== 0) {
    throw new Error(`GLS pontlista: ${json.ErrorDescription ?? json.ErrorCode}`);
  }

  const rows = decompressGlsApiData(json.Data) as {
    Id?: number;
    Matchcode?: string;
    DeliveryPointType?: number;
    Latitude?: number;
    Longitude?: number;
    CodHandler?: boolean;
    IsActive?: boolean;
    Address?: { Name?: string; City?: string; ZipCode?: string; Street?: string; HouseNumber?: string };
  }[];

  return rows
    .filter((r) => r.IsActive !== false && r.Latitude != null && r.Longitude != null)
    .map((r) => {
      const addr = r.Address ?? {};
      const street = [addr.Street, addr.HouseNumber].filter(Boolean).join(" ").trim();
      const psdId = r.Matchcode?.trim() || (r.Id != null ? `${r.Id}-CSOMAGPONT` : "");
      return {
        id: `gls:${r.Id ?? psdId}`,
        provider: "gls" as PickupPointProvider,
        providerPointId: String(r.Id ?? psdId),
        glsPsdId: psdId,
        name: addr.Name?.trim() || "GLS csomagpont",
        address: street,
        city: addr.City?.trim() || "",
        zip: addr.ZipCode?.trim() || "",
        lat: Number(r.Latitude),
        lng: Number(r.Longitude),
        kind: r.DeliveryPointType === 2 ? ("locker" as const) : ("shop" as const),
        codAllowed: r.CodHandler !== false,
      };
    });
}

async function fetchGlsPoints(): Promise<PickupPoint[]> {
  try {
    const publicPoints = await fetchGlsPointsFromPublicJson();
    if (publicPoints.length > 0) return publicPoints;
  } catch (e) {
    console.warn("[pickup-points] GLS public JSON:", e);
  }
  return fetchGlsPointsFromApi();
}

async function fetchMplPointsFromPostInfo2(): Promise<PickupPoint[]> {
  const res = await fetch(MPL_POSTINFO2_URL, { next: { revalidate: 86400 } });
  if (!res.ok) throw new Error(`Posta PostInfo2 hiba (${res.status})`);
  const xml = await res.text();
  const blocks = xml.match(/<post\b[^>]*>[\s\S]*?<\/post>/gi) ?? [];

  const points: PickupPoint[] = [];
  for (const block of blocks) {
    if (!/isPostPoint="1"/i.test(block)) continue;

    const id = tagValue(block, "ID");
    const name = tagValue(block, "name");
    const city = tagValue(block, "city");
    const zipCode = block.match(/zipCode="(\d+)"/i)?.[1] ?? "";
    const serviceType = tagValue(block, "ServicePointType").toUpperCase();
    const gpsBlock = block.match(/<gpsData>[\s\S]*?<\/gpsData>/i)?.[0] ?? "";
    const lat = parseHuCoord(tagValue(gpsBlock, "WGSLat"));
    const lng = parseHuCoord(tagValue(gpsBlock, "WGSLon"));
    if (!id || lat == null || lng == null) continue;

    const streetBlock = block.match(/<street>[\s\S]*?<\/street>/i)?.[0] ?? "";
    const streetName = tagValue(streetBlock, "name");
    const streetType = tagValue(streetBlock, "type");
    const houseNumber = tagValue(streetBlock, "houseNumber");
    const streetLine = [streetName, streetType, houseNumber].filter(Boolean).join(" ").trim();

    const mplDeliveryMode =
      serviceType === "CS" ? ("CS" as const) : serviceType === "PP" ? ("PP" as const) : ("PM" as const);
    const siteLabel = name || streetLine || "MPL átvételi pont";

    points.push({
      id: `mpl:${id}`,
      provider: "mpl",
      providerPointId: id,
      mplDeliveryMode,
      mplParcelPickupSite: siteLabel,
      name: siteLabel,
      address: streetLine,
      city,
      zip: zipCode,
      lat,
      lng,
      kind: serviceType === "CS" ? "locker" : serviceType === "PP" ? "shop" : "postoffice",
      codAllowed: true,
    });
  }

  return points;
}

export async function getAllPickupPoints(force = false): Promise<PickupPoint[]> {
  const now = Date.now();
  if (!force && cache && now - cache.fetchedAt < CACHE_TTL_MS) {
    return cache.points;
  }

  const [gls, mpl] = await Promise.all([
    fetchGlsPoints().catch((e) => {
      console.error("[pickup-points] GLS:", e);
      return [] as PickupPoint[];
    }),
    fetchMplPointsFromPostInfo2().catch((e) => {
      console.error("[pickup-points] MPL PostInfo2:", e);
      return [] as PickupPoint[];
    }),
  ]);

  const points = [...gls, ...mpl];
  cache = { points, fetchedAt: now };
  return points;
}

export async function findMplPickupPoint(providerPointId: string): Promise<PickupPoint | null> {
  const id = providerPointId.trim();
  if (!id) return null;
  const points = await getAllPickupPoints();
  return points.find((p) => p.provider === "mpl" && p.providerPointId === id) ?? null;
}
