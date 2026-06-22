import {
  buildNatursoftExportOrders,
  buildNatursoftOrdersXml,
} from "@/lib/integrations/naturasoft/export-xml";
import { createServiceSupabase } from "@/lib/server-supabase";
import type { Database } from "@/types/supabase";

type Order = Database["public"]["Tables"]["orders"]["Row"];
type OrderItem = Database["public"]["Tables"]["order_items"]["Row"];

/** NaturaSoft export: fizetett vagy már futárnak átadott, de még nem exportált rendelések. */
const NATURASOFT_EXPORT_STATUSES = ["paid", "fulfilled"] as const satisfies readonly Order["status"][];

export type NatursoftFetchResult = {
  xml: string;
  orderIds: string[];
  count: number;
};

export async function fetchNatursoftExportXml(options?: {
  includeExported?: boolean;
  markExported?: boolean;
}): Promise<NatursoftFetchResult> {
  const svc = createServiceSupabase();
  if (!svc) throw new Error("Service role nem elérhető.");

  let query = svc
    .from("orders")
    .select("*")
    .in("status", [...NATURASOFT_EXPORT_STATUSES])
    .order("created_at", { ascending: true });

  if (!options?.includeExported) {
    query = query.is("natursoft_exported_at", null);
  }

  const { data: orders, error: ordersErr } = await query;
  if (ordersErr) throw new Error(ordersErr.message);

  const list = (orders ?? []) as Order[];
  if (list.length === 0) {
    return {
      xml: `<?xml version="1.0" encoding="UTF-8"?>\n<megrendelesek>\n</megrendelesek>\n`,
      orderIds: [],
      count: 0,
    };
  }

  const orderIds = list.map((o) => o.id);
  const { data: items, error: itemsErr } = await svc.from("order_items").select("*").in("order_id", orderIds);
  if (itemsErr) throw new Error(itemsErr.message);

  const itemRows = (items ?? []) as OrderItem[];
  const itemsByOrderId = new Map<string, OrderItem[]>();
  for (const item of itemRows) {
    const bucket = itemsByOrderId.get(item.order_id) ?? [];
    bucket.push(item);
    itemsByOrderId.set(item.order_id, bucket);
  }

  const productIds = Array.from(new Set(itemRows.map((i) => i.product_id).filter(Boolean))) as string[];
  const productsById = new Map<
    string,
    Pick<Database["public"]["Tables"]["products"]["Row"], "id" | "sku" | "description" | "vat_rate" | "slug">
  >();

  if (productIds.length > 0) {
    const { data: products, error: productsErr } = await svc
      .from("products")
      .select("id, sku, description, vat_rate, slug")
      .in("id", productIds);
    if (productsErr) throw new Error(productsErr.message);
    for (const product of products ?? []) {
      productsById.set(product.id, product);
    }
  }

  const packages = buildNatursoftExportOrders(list, itemsByOrderId, productsById);
  const xml = buildNatursoftOrdersXml(packages);

  if (options?.markExported !== false && orderIds.length > 0 && !options?.includeExported) {
    const now = new Date().toISOString();
    const { error: markErr } = await svc
      .from("orders")
      .update({ natursoft_exported_at: now })
      .in("id", orderIds)
      .in("status", [...NATURASOFT_EXPORT_STATUSES])
      .is("natursoft_exported_at", null);
    if (markErr) throw new Error(`Export jelölés sikertelen: ${markErr.message}`);
  }

  return { xml, orderIds, count: list.length };
}
