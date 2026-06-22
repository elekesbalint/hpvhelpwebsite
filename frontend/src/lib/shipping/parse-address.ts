/** „7623 Pécs, Megyeri út 26” → irányítószám, város, utca+házszám */
export function parseHungarianShippingAddress(raw: string): {
  postCode: string;
  city: string;
  streetLine: string;
} | null {
  const trimmed = raw.trim();
  const match = trimmed.match(/^(\d{4})\s+([^,]+),\s*(.+)$/);
  if (!match) return null;
  return {
    postCode: match[1],
    city: match[2].trim(),
    streetLine: match[3].trim(),
  };
}
