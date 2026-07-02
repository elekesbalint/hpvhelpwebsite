import {
  buildNatursoftExportOrders,
  buildNatursoftOrdersXml,
} from "@/lib/integrations/naturasoft/export-xml";
import { createServiceSupabase } from "@/lib/server-supabase";
import type { Database } from "@/types/supabase";
import type { SupabaseClient } from "@supabase/supabase-js";

type Order = Database["public"]["Tables"]["orders"]["Row"];
type OrderItem = Database["public"]["Tables"]["order_items"]["Row"];

/** NaturaSoft export: fizetett vagy már futárnak átadott rendelések. */
const NATURASOFT_EXPORT_STATUSES = ["paid", "fulfilled"] as const satisfies readonly Order["status"][];

const PAGE_SIZE = 500;

async function fetchAllRows<T>(
  fetchPage: (from: number, to: number) => Promise<{ data: T[] | null; error: { message: string } | null }>,
): Promise<T[]> {
  const rows: T[] = [];
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const { data, error } = await fetchPage(offset, offset + PAGE_SIZE - 1);
    if (error) throw new Error(error.message);
    if (!data?.length) break;
    rows.push(...data);
    if (data.length < PAGE_SIZE) break;
  }
  return rows;
}

async function fetchOrderItemsForOrders(svc: SupabaseClient<Database>, orderIds: string[]): Promise<OrderItem[]> {
  if (orderIds.length === 0) return [];
  return fetchAllRows(async (from, to) =>
    svc.from("order_items").select("*").in("order_id", orderIds).order("created_at", { ascending: true }).range(from, to),
  );
}

export type NatursoftFetchResult = {
  xml: string;
  orderIds: string[];
  count: number;
};

export async function fetchNatursoftExportXml(options?: {
  includeExported?: boolean;
  markExported?: boolean;
  orderIds?: string[];
}): Promise<NatursoftFetchResult> {
  const svc = createServiceSupabase();
  if (!svc) throw new Error("Service role nem elérhető.");

  let query = svc.from("orders").select("*").order("created_at", { ascending: true });

  if (options?.orderIds?.length) {
    // Admin előnézet / újra-export: konkrét rendelés státusztól függetlenül (pl. refunded).
    query = query.in("id", options.orderIds);
  } else {
    query = query.in("status", [...NATURASOFT_EXPORT_STATUSES]);
    if (!options?.includeExported) {
      query = query.is("natursoft_exported_at", null);
    }
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
  const itemRows = await fetchOrderItemsForOrders(svc, orderIds);
  const itemsByOrderId = new Map<string, OrderItem[]>();
  for (const item of itemRows) {
    const bucket = itemsByOrderId.get(item.order_id) ?? [];
    bucket.push(item);
    itemsByOrderId.set(item.order_id, bucket);
  }

  const productIds = Array.from(new Set(itemRows.map((i) => i.product_id).filter(Boolean))) as string[];
  const productsById = new Map<
    string,
    Pick<Database["public"]["Tables"]["products"]["Row"], "id" | "sku" | "description" | "vat_rate" | "slug" | "category_id">
  >();

  if (productIds.length > 0) {
    const products = await fetchAllRows(async (from, to) =>
      svc
        .from("products")
        .select("id, sku, description, vat_rate, slug, category_id")
        .in("id", productIds)
        .range(from, to),
    );
    for (const product of products) {
      productsById.set(product.id, product);
    }
  }

  const categoryIds = Array.from(
    new Set(
      Array.from(productsById.values())
        .map((p) => p.category_id)
        .filter(Boolean),
    ),
  ) as string[];

  const categoriesById = new Map<string, Pick<Database["public"]["Tables"]["categories"]["Row"], "id" | "vat_rate">>();
  if (categoryIds.length > 0) {
    const categories = await fetchAllRows(async (from, to) =>
      svc.from("categories").select("id, vat_rate").in("id", categoryIds).range(from, to),
    );
    for (const category of categories) {
      categoriesById.set(category.id, category);
    }
  }

  const packages = buildNatursoftExportOrders(list, itemsByOrderId, productsById, categoriesById);
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

/** Admin: egy rendelés újra-exportálhatóvá tétele (NaturaSoftban törölni kell a hibás megrendelést). */
export async function resetNatursoftExportFlag(orderId: string): Promise<void> {
  const svc = createServiceSupabase();
  if (!svc) throw new Error("Service role nem elérhető.");

  const { error } = await svc
    .from("orders")
    .update({ natursoft_exported_at: null })
    .eq("id", orderId);

  if (error) throw new Error(error.message);
}
