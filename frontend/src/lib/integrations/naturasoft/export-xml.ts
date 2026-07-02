import { billingAddressDisplay, billingNameDisplay } from "@/lib/order-billing";
import { formatOrderPublicId, getOrderNaturasoftId } from "@/lib/order-display-id";
import { resolveExportArticleNumber } from "@/lib/integrations/naturasoft/article-number";
import {
  resolveNaturasoftExportNameBySku,
  resolveNaturasoftExportVatBySku,
} from "@/lib/integrations/naturasoft/product-catalog";
import { buildNaturasoftAddressParts, buildNaturasoftShippingAddressParts } from "@/lib/integrations/naturasoft/address-export";
import { buildNaturasoftOrderNotes } from "@/lib/integrations/naturasoft/order-notes";
import { resolveNaturasoftShippingLine } from "@/lib/integrations/naturasoft/shipping-catalog";
import { resolveProductVatRate } from "@/lib/integrations/naturasoft/vat-rate";
import { effectiveShippingMethod, shippingMethodLabel } from "@/lib/shipping/carrier";
import type { Database } from "@/types/supabase";

type Order = Database["public"]["Tables"]["orders"]["Row"];
type OrderItem = Database["public"]["Tables"]["order_items"]["Row"];
type Category = Database["public"]["Tables"]["categories"]["Row"];

type ProductRow = Pick<
  Database["public"]["Tables"]["products"]["Row"],
  "id" | "sku" | "description" | "vat_rate" | "slug" | "category_id"
>;

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

/** Magyar postaköltség – mindig 27% ÁFA (közvetített szolgáltatás). */
const SHIPPING_VAT_RATE = 27;

/** NaturaSoft ÁFA kulcs – 0%-nál a törzsben „TAM” szerepel, nem „0”. */
function formatNaturasoftAfa(vatRate: number): string {
  if (vatRate <= 0) {
    const tam = process.env.NATURASOFT_ZERO_VAT_AFA?.trim();
    return tam && tam.length > 0 ? tam : "TAM";
  }
  return String(Math.round(vatRate));
}

function formatNaturasoftMoney(amount: number, currency: string): string {
  if ((currency || "HUF").toUpperCase() === "HUF") {
    return String(Math.round(amount));
  }
  return amount.toFixed(2);
}

function formatNaturasoftNetUnitPrice(gross: number, vatRate: number, currency: string): string {
  const net = vatRate > 0 ? gross / (1 + vatRate / 100) : gross;
  return formatNaturasoftMoney(net, currency);
}

export function buildNatursoftExportOrders(
  orders: Order[],
  itemsByOrderId: Map<string, OrderItem[]>,
  productsById: Map<string, ProductRow>,
  categoriesById: Map<string, Pick<Category, "id" | "vat_rate">>,
): NatursoftExportOrder[] {
  const vatFallback = defaultVatRate();

  return orders.map((order) => {
    const items = itemsByOrderId.get(order.id) ?? [];
    const shippingMethod = effectiveShippingMethod(order) ?? order.shipping_method;
    const lines: NatursoftExportLine[] = items.map((item) => {
      const product = item.product_id ? productsById.get(item.product_id) : undefined;
      const articleNumber = resolveExportArticleNumber(item, product);
      const vatRate =
        resolveNaturasoftExportVatBySku(articleNumber) ??
        resolveProductVatRate(product, categoriesById, vatFallback);

      return {
        articleNumber,
        name: resolveNaturasoftExportNameBySku(articleNumber, item.product_name),
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
      const shippingCatalog = resolveNaturasoftShippingLine(order);
      lines.push({
        articleNumber:
          shippingCatalog?.articleNumber ??
          process.env.NATURASOFT_SHIPPING_SKU?.trim() ??
          "SZALLITAS",
        name:
          shippingCatalog?.name ??
          `Szállítás – ${shippingMethodLabel(shippingMethod)}`,
        quantity: 1,
        unitPriceGross: shippingGross,
        lineTotalGross: shippingGross,
        vatRate: SHIPPING_VAT_RATE,
      });
    }

    return { order, items, lines, shippingGross };
  });
}

export function buildNatursoftOrdersXml(packages: NatursoftExportOrder[]): string {
  const blocks = packages.map(({ order, lines }) => {
    const publicId = formatOrderPublicId(order);
    const naturasoftOrderId = getOrderNaturasoftId(order);
    const created = new Date(order.created_at).toLocaleDateString("sv-SE", { timeZone: "Europe/Budapest" });
    const billingName = billingNameDisplay(order);
    const billingAddress = billingAddressDisplay(order);
    const shippingMethod = effectiveShippingMethod(order) ?? order.shipping_method;
    const currency = order.currency || "HUF";

    const billingParts = buildNaturasoftAddressParts(billingAddress);
    const shippingParts = buildNaturasoftShippingAddressParts(order);

    const lineXml = lines
      .map(
        (line) => {
          const afa = formatNaturasoftAfa(line.vatRate);
          const unitPrice = formatNaturasoftMoney(line.unitPriceGross, currency);
          const netUnitPrice = formatNaturasoftNetUnitPrice(line.unitPriceGross, line.vatRate, currency);
          const lineTotal = formatNaturasoftMoney(line.lineTotalGross, currency);
          return `      <tetel>
        <cikkszam>${xmlEscape(line.articleNumber)}</cikkszam>
        <termekkod>${xmlEscape(line.articleNumber)}</termekkod>
        <megnevezes>${xmlEscape(line.name)}</megnevezes>
        <mennyiseg>${line.quantity}</mennyiseg>
        <mennyisegiegyseg>db</mennyisegiegyseg>
        <egysegar>${unitPrice}</egysegar>
        <brutto_egysegar>${unitPrice}</brutto_egysegar>
        <netto_egysegar>${netUnitPrice}</netto_egysegar>
        <osszeg>${lineTotal}</osszeg>
        <afa>${xmlEscape(afa)}</afa>
        <afakulcs>${xmlEscape(afa)}</afakulcs>
      </tetel>`;
        },
      )
      .join("\n");

    return `  <megrendeles>
    <azonosito>${xmlEscape(publicId)}</azonosito>
    <rendeles_id>${xmlEscape(naturasoftOrderId)}</rendeles_id>
    <datum>${xmlEscape(created)}</datum>
    <status>${xmlEscape(order.status)}</status>
    <penznem>${xmlEscape(order.currency || "HUF")}</penznem>
    <osszesen>${formatNaturasoftMoney(Number(order.total), currency)}</osszesen>
    <kedvezmeny>${formatNaturasoftMoney(Number(order.discount ?? 0), currency)}</kedvezmeny>
    <kupon_kod>${xmlEscape(order.coupon_code ?? "")}</kupon_kod>
    <fizetesi_mod>${xmlEscape(paymentLabel(order))}</fizetesi_mod>
    <szallitasi_mod>${xmlEscape(shippingMethodLabel(shippingMethod))}</szallitasi_mod>
    <vevo>
      <nev>${xmlEscape(billingName)}</nev>
      <email>${xmlEscape(order.shipping_email ?? "")}</email>
      <telefon>${xmlEscape(order.shipping_phone ?? "")}</telefon>
      <adoszam>${xmlEscape(order.billing_tax_number ?? "")}</adoszam>
    </vevo>
    <szamlazasi_cim>${xmlEscape(billingParts.full)}</szamlazasi_cim>
    <szamlazasi_orszag>${xmlEscape(billingParts.orszag)}</szamlazasi_orszag>
    <szamlazasi_irsz>${xmlEscape(billingParts.irsz)}</szamlazasi_irsz>
    <szamlazasi_varos>${xmlEscape(billingParts.varos)}</szamlazasi_varos>
    <szamlazasi_utca>${xmlEscape(billingParts.utca)}</szamlazasi_utca>
    <szallitasi_nev>${xmlEscape(order.shipping_name ?? "")}</szallitasi_nev>
    <szallitasi_cim>${xmlEscape(shippingParts.full)}</szallitasi_cim>
    <szallitasi_orszag>${xmlEscape(shippingParts.orszag)}</szallitasi_orszag>
    <szallitasi_irsz>${xmlEscape(shippingParts.irsz)}</szallitasi_irsz>
    <szallitasi_varos>${xmlEscape(shippingParts.varos)}</szallitasi_varos>
    <szallitasi_utca>${xmlEscape(shippingParts.utca)}</szallitasi_utca>
    <megjegyzes>${xmlEscape(buildNaturasoftOrderNotes(order))}</megjegyzes>
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
