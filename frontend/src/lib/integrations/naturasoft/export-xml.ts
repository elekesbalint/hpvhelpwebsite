import { billingAddressDisplay, billingNameDisplay } from "@/lib/order-billing";
import { formatOrderPublicId } from "@/lib/order-display-id";
import { resolveProductArticleNumber } from "@/lib/integrations/naturasoft/article-number";
import { pickupProviderLabel, shippingMethodLabel } from "@/lib/shipping/carrier";
import type { Database } from "@/types/supabase";

type Order = Database["public"]["Tables"]["orders"]["Row"];
type OrderItem = Database["public"]["Tables"]["order_items"]["Row"];

type ProductRow = Pick<Database["public"]["Tables"]["products"]["Row"], "id" | "sku" | "description" | "vat_rate" | "slug">;

export type NatursoftExportLine = {
  articleNumber: string;
  name: string;
  quantity: number;
  unitPriceGross: number;
  lineTotalGross: number;
  vatRate: number;
};

export type NatursoftExportOrder = {
  order: Order;
  items: OrderItem[];
  lines: NatursoftExportLine[];
  shippingGross: number;
};

function xmlEscape(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function paymentLabel(order: Order): string {
  if (order.payment_provider === "simplepay") return "Bankkártya (SimplePay)";
  if (order.payment_provider === "manual_transfer") return "Banki átutalás";
  if (order.payment_provider === "manual_cod") return "Utánvét";
  return order.payment_provider ?? "";
}

function defaultVatRate(): number {
  const raw = process.env.NATURASOFT_DEFAULT_VAT_RATE?.trim();
  const n = raw ? Number(raw) : 27;
  return Number.isFinite(n) ? n : 27;
}

export function buildNatursoftExportOrders(
  orders: Order[],
  itemsByOrderId: Map<string, OrderItem[]>,
  productsById: Map<string, ProductRow>,
): NatursoftExportOrder[] {
  const vatFallback = defaultVatRate();

  return orders.map((order) => {
    const items = itemsByOrderId.get(order.id) ?? [];
    const lines: NatursoftExportLine[] = items.map((item) => {
      const product = item.product_id ? productsById.get(item.product_id) : undefined;
      const articleNumber =
        resolveProductArticleNumber(product) ??
        item.product_id?.slice(0, 8) ??
        "ISMERETLEN";
      const vatRate = product?.vat_rate != null ? Number(product.vat_rate) : vatFallback;

      return {
        articleNumber,
        name: item.product_name,
        quantity: item.quantity,
        unitPriceGross: Number(item.unit_price),
        lineTotalGross: Number(item.line_total),
        vatRate,
      };
    });

    const shippingGross = Math.max(
      0,
      Number(order.total) - Number(order.subtotal) + Number(order.discount ?? 0),
    );

    if (shippingGross > 0) {
      lines.push({
        articleNumber: process.env.NATURASOFT_SHIPPING_SKU?.trim() || "SZALLITAS",
        name: `Szállítás – ${shippingMethodLabel(order.shipping_method)}`,
        quantity: 1,
        unitPriceGross: shippingGross,
        lineTotalGross: shippingGross,
        vatRate: vatFallback,
      });
    }

    return { order, items, lines, shippingGross };
  });
}

export function buildNatursoftOrdersXml(packages: NatursoftExportOrder[]): string {
  const blocks = packages.map(({ order, lines }) => {
    const publicId = formatOrderPublicId(order.id);
    const created = new Date(order.created_at).toISOString().slice(0, 19).replace("T", " ");
    const billingName = billingNameDisplay(order);
    const billingAddress = billingAddressDisplay(order);
    const shippingAddress =
      order.shipping_method === "csomagpont" && order.pickup_point_name
        ? [order.pickup_point_address, order.pickup_point_name, order.pickup_point_provider ? pickupProviderLabel(order.pickup_point_provider) : ""]
            .filter(Boolean)
            .join(", ")
        : order.shipping_address?.trim() ?? "";

    const lineXml = lines
      .map(
        (line) => `      <tetel>
        <cikkszam>${xmlEscape(line.articleNumber)}</cikkszam>
        <megnevezes>${xmlEscape(line.name)}</megnevezes>
        <mennyiseg>${line.quantity}</mennyiseg>
        <egysegar>${line.unitPriceGross.toFixed(2)}</egysegar>
        <osszeg>${line.lineTotalGross.toFixed(2)}</osszeg>
        <afa>${line.vatRate.toFixed(0)}</afa>
      </tetel>`,
      )
      .join("\n");

    return `  <megrendeles>
    <azonosito>${xmlEscape(publicId)}</azonosito>
    <rendeles_id>${xmlEscape(order.id)}</rendeles_id>
    <datum>${xmlEscape(created)}</datum>
    <status>${xmlEscape(order.status)}</status>
    <penznem>${xmlEscape(order.currency || "HUF")}</penznem>
    <osszesen>${Number(order.total).toFixed(2)}</osszesen>
    <kedvezmeny>${Number(order.discount ?? 0).toFixed(2)}</kedvezmeny>
    <kupon_kod>${xmlEscape(order.coupon_code ?? "")}</kupon_kod>
    <fizetesi_mod>${xmlEscape(paymentLabel(order))}</fizetesi_mod>
    <szallitasi_mod>${xmlEscape(shippingMethodLabel(order.shipping_method))}</szallitasi_mod>
    <vevo>
      <nev>${xmlEscape(billingName)}</nev>
      <email>${xmlEscape(order.shipping_email ?? "")}</email>
      <telefon>${xmlEscape(order.shipping_phone ?? "")}</telefon>
      <adoszam>${xmlEscape(order.billing_tax_number ?? "")}</adoszam>
    </vevo>
    <szamlazasi_cim>${xmlEscape(billingAddress)}</szamlazasi_cim>
    <szallitasi_nev>${xmlEscape(order.shipping_name ?? "")}</szallitasi_nev>
    <szallitasi_cim>${xmlEscape(shippingAddress)}</szallitasi_cim>
    <megjegyzes>${xmlEscape(order.notes ?? "")}</megjegyzes>
    <tetelek>
${lineXml}
    </tetelek>
  </megrendeles>`;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<megrendelesek>
${blocks.join("\n")}
</megrendelesek>
`;
}
