import type { Database } from "@/types/supabase";

type Product = Database["public"]["Tables"]["products"]["Row"];

/**
 * Akciós oldal: SAM tesztek fix sorrendje, utána minden más termék név szerint.
 * 1. Full HPV → 2. Microbiom → 3. STI → 4. Allin1 → 5–7. Combo1–3
 */
export function getSaleTestPriority(name: string): number {
  const n = name.toLowerCase();

  if (n.includes("allin1") || n.includes("all-in1") || n.includes("all in1")) return 4;
  if (n.includes("combo1")) return 5;
  if (n.includes("combo2")) return 6;
  if (n.includes("combo3")) return 7;

  if (n.includes("full hpv")) return 1;
  if (n.includes("microbiom teszt") || (n.includes("sam") && n.includes("microbiom"))) return 2;
  if (n.includes("sti teszt") || (n.includes("sam") && n.includes("sti") && !n.includes("microbiom"))) return 3;

  return 100;
}

export function sortSaleProducts<T extends Pick<Product, "name">>(products: T[]): T[] {
  return [...products].sort((a, b) => {
    const priorityDiff = getSaleTestPriority(a.name) - getSaleTestPriority(b.name);
    if (priorityDiff !== 0) return priorityDiff;
    return a.name.localeCompare(b.name, "hu");
  });
}
