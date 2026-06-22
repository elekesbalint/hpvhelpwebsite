/** Magyar adószám: 8 számjegy – 1 számjegy – 2 számjegy */
export function formatHungarianTaxNumber(input: string): string {
  const digits = input.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 8) return digits;
  if (digits.length <= 9) return `${digits.slice(0, 8)}-${digits.slice(8)}`;
  return `${digits.slice(0, 8)}-${digits.slice(8, 9)}-${digits.slice(9, 11)}`;
}

export function isValidHungarianTaxNumber(value: string): boolean {
  return /^\d{8}-\d-\d{2}$/.test(value.trim());
}

function stripToNationalDigits(input: string): string {
  let d = input.replace(/\D/g, "");
  if (d.startsWith("00")) d = d.slice(2);
  if (d.startsWith("36")) d = d.slice(2);
  else if (d.startsWith("06")) d = d.slice(2);
  else if (d.startsWith("6") && d.length >= 10) d = d.slice(1);
  return d;
}

/** Országkód nélküli rész: 20 123 4567 vagy 1 234 5678 */
function formatNationalBlock(nationalDigits: string): string {
  const d = nationalDigits.replace(/\D/g, "").slice(0, 9);
  if (!d) return "";
  if (d.startsWith("1")) {
    const n = d.slice(0, 9);
    const a = n.slice(0, 1);
    const b = n.slice(1, 4);
    const c = n.slice(4);
    let out = a;
    if (b) out += ` ${b}`;
    if (c) out += ` ${c}`;
    return out.trim();
  }
  const n = d.slice(0, 9);
  const a = n.slice(0, 2);
  const b = n.slice(2, 5);
  const c = n.slice(5, 9);
  let out = a;
  if (b) out += ` ${b}`;
  if (c) out += ` ${c}`;
  return out.trim();
}

/**
 * Nem ír be automatikusan +36-ot: a felhasználónak kell a +36-ot megadnia.
 * + nélkül: 06… vagy nemzeti szám, szóközök (pl. 20 123 4567).
 * + után, ha a számjegyek 36-tal kezdődnek: +36 20 123 4567.
 */
export function formatHungarianPhone(input: string): string {
  const trimmed = input.trimStart();
  if (trimmed.startsWith("+")) {
    const plusIdx = input.indexOf("+");
    const digits = input.slice(plusIdx + 1).replace(/\D/g, "");
    if (digits.startsWith("36")) {
      const nat = digits.slice(2, 11);
      const block = formatNationalBlock(nat);
      return block ? `+36 ${block}` : "+36";
    }
    return digits.length > 0 ? `+${digits}` : "+";
  }

  let d = input.replace(/\D/g, "");
  if (d.startsWith("06")) d = d.slice(2);
  d = d.slice(0, 9);
  return formatNationalBlock(d);
}

export function isValidHungarianPhone(value: string): boolean {
  const n = stripToNationalDigits(value);
  if (n.length < 8 || n.length > 9) return false;
  if (/^(20|30|31|50|70|71)\d{7}$/.test(n)) return true;
  if (/^1\d{7,8}$/.test(n)) return true;
  return false;
}

/** Egyszerű, gyakorlati email ellenőrzés */
export function isValidEmail(value: string): boolean {
  const t = value.trim();
  if (!t || t.length > 254) return false;
  if (/\s/.test(t) || /\.\./.test(t)) return false;
  const parts = t.split("@");
  if (parts.length !== 2) return false;
  const [local, domain] = parts;
  if (!local || !domain || local.startsWith(".") || local.endsWith(".")) return false;
  if (!domain.includes(".") || domain.endsWith(".")) return false;
  const labels = domain.split(".");
  if (labels.length < 2) return false;
  if (!labels.every((p) => p.length > 0 && /^[a-zA-Z0-9-]+$/.test(p))) return false;
  if ((labels[labels.length - 1]?.length ?? 0) < 2) return false;
  return /^[a-zA-Z0-9._%+-]+$/.test(local);
}

export function normalizeEmail(value: string): string {
  return value.trim();
}
