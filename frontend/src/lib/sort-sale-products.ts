import type { Database } from "@/types/supabase";

type Product = Database["public"]["Tables"]["products"]["Row"];

/** HPV / STI / Microbiom önálló (nem kombinált) tesztek előresorolása az akciós listán. */
export function getMonoTestSalePriority(name: string): number {
  const n = name.toLowerCase();
  if (n.includes("kombináció") || n.includes("kombinacio") || n.includes(" és ")) return 20;
  if (/^hpv\s*\(/.test(n) || n.startsWith("hpv (humán")) return 1;
  if (/^sti\s*\(/.test(n) || n.startsWith("sti (szexuálisan")) return 2;
  if (n.startsWith("microbiom")) return 3;
  return 10;
}

export function sortSaleProducts<T extends Pick<Product, "name">>(products: T[]): T[] {
  return [...products].sort((a, b) => {
    const priorityDiff = getMonoTestSalePriority(a.name) - getMonoTestSalePriority(b.name);
    if (priorityDiff !== 0) return priorityDiff;
    return a.name.localeCompare(b.name, "hu");
  });
}
