// OpenStreetMap Nominatim API — ingyenes, nem kell API kulcs
// https://nominatim.org/release-docs/develop/api/Search/

interface NominatimResult {
  address?: {
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    postcode?: string;
  };
  display_name: string;
}

const cache = new Map<string, { city: string; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 perc
let lastRequestAt = 0;

async function rateLimitedFetch(url: string): Promise<Response> {
  const now = Date.now();
  const wait = 1000 - (now - lastRequestAt);
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastRequestAt = Date.now();
  return fetch(url, {
    headers: { "User-Agent": "HPVHelp-Webshop/1.0 (address autocomplete)" },
  });
}

export async function getCityByZipAPI(zip: string): Promise<string | null> {
  if (zip.length !== 4) return null;

  const cacheKey = `zip_${zip}`;
  const hit = cache.get(cacheKey);
  if (hit && Date.now() - hit.timestamp < CACHE_TTL) return hit.city;

  try {
    const res = await rateLimitedFetch(
      `https://nominatim.openstreetmap.org/search?postalcode=${zip}&country=Hungary&format=json&addressdetails=1&limit=1`
    );
    if (!res.ok) return null;

    const data: NominatimResult[] = await res.json() as NominatimResult[];
    if (!data.length) return null;

    const addr = data[0].address;
    const city =
      addr?.city ??
      addr?.town ??
      addr?.village ??
      addr?.municipality ??
      extractFirst(data[0].display_name);

    if (city) {
      cache.set(cacheKey, { city, timestamp: Date.now() });
      return city;
    }
    return null;
  } catch {
    return null;
  }
}

function extractFirst(displayName: string): string | null {
  const part = displayName.split(",")[0]?.trim();
  return part && !/^\d/.test(part) ? part : null;
}
