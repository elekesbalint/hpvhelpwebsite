import { NextRequest, NextResponse } from "next/server";
import { requireAdminFromRequest } from "@/lib/api-security";
import { formatOrderPublicId } from "@/lib/order-display-id";
import { carrierForOrder, type ShippingCarrier } from "@/lib/shipping/carrier";
import { createFoxpostLabel, pickupMetaFromOrder } from "@/lib/shipping/foxpost";
import { createGlsLabel } from "@/lib/shipping/gls";
import { createMplLabel } from "@/lib/shipping/mpl";
import { findMplPickupPoint } from "@/lib/shipping/pickup-points-fetch";
import { createServiceSupabase } from "@/lib/server-supabase";

type Body = { orderId?: string; carrier?: ShippingCarrier };

export async function POST(request: NextRequest) {
  const adminAuth = await requireAdminFromRequest(request);
  if (!adminAuth.ok) return adminAuth.response;

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const orderId = body.orderId?.trim();
  if (!orderId) {
    return NextResponse.json({ error: "orderId megadása kötelező." }, { status: 400 });
  }

  const svc = createServiceSupabase();
  if (!svc) {
    return NextResponse.json({ error: "Service role nem elérhető." }, { status: 500 });
  }

  const { data: order, error: orderErr } = await svc.from("orders").select("*").eq("id", orderId).maybeSingle();
  if (orderErr || !order) {
    return NextResponse.json({ error: "Rendelés nem található." }, { status: 404 });
  }

  if (!order.shipping_name?.trim()) {
    return NextResponse.json({ error: "Hiányzó szállítási név." }, { status: 400 });
  }

  const isPickupOrder = order.shipping_method === "csomagpont";
  if (!isPickupOrder && !order.shipping_address?.trim()) {
    return NextResponse.json({ error: "Hiányzó szállítási cím." }, { status: 400 });
  }

  if (isPickupOrder && !order.pickup_point_id) {
    return NextResponse.json({ error: "Hiányzó csomagpont adat a rendelésen." }, { status: 400 });
  }

  const carrier = body.carrier ?? carrierForOrder(order);
  if (!carrier) {
    return NextResponse.json(
      { error: "Ehhez a szállítási módhoz nem generálható automatikus címirat (pl. személyes átvétel)." },
      { status: 400 }
    );
  }

  const publicId = formatOrderPublicId(order.id);
  const recipientEmail = order.shipping_email?.trim() || "info@sunmed.hu";
  const recipientPhone = order.shipping_phone?.trim() || "+36308657792";
  const codAmount = order.payment_provider === "manual_cod" ? Number(order.total) : undefined;
  const pickupMeta = pickupMetaFromOrder(order.pickup_point_meta);
  const shippingAddress =
    order.shipping_address?.trim() ||
    [order.pickup_point_address, order.pickup_point_name].filter(Boolean).join(", ");

  let mplPickup:
    | {
        zip: string;
        city: string;
        address: string;
        mplDeliveryMode: "PM" | "PP" | "CS";
        mplParcelPickupSite: string;
      }
    | undefined;

  if (carrier === "mpl") {
    const canonical =
      pickupMeta?.providerPointId != null
        ? await findMplPickupPoint(pickupMeta.providerPointId)
        : null;
    const mode = canonical?.mplDeliveryMode ?? pickupMeta?.mplDeliveryMode;
    const zipFromAddress = shippingAddress.match(/^(\d{4})\b/)?.[1];
    if (mode) {
      mplPickup = {
        zip: canonical?.zip ?? pickupMeta?.zip ?? zipFromAddress ?? "",
        city: canonical?.city ?? pickupMeta?.city ?? "",
        address: canonical?.address ?? order.pickup_point_address ?? "",
        mplDeliveryMode: mode,
        mplParcelPickupSite:
          canonical?.mplParcelPickupSite ??
          pickupMeta?.mplParcelPickupSite ??
          order.pickup_point_name ??
          "",
      };
    }
  }

  try {
    const result =
      carrier === "gls"
        ? await createGlsLabel({
            orderId: order.id,
            clientReference: publicId,
            recipientName: order.shipping_name,
            recipientPhone,
            recipientEmail,
            shippingAddress,
            codAmount,
            glsPsdId: pickupMeta?.glsPsdId,
            pickup: pickupMeta
              ? {
                  zip: pickupMeta.zip,
                  city: pickupMeta.city,
                  address: order.pickup_point_address ?? "",
                  name: order.pickup_point_name ?? "",
                }
              : undefined,
          })
        : carrier === "foxpost"
          ? await createFoxpostLabel({
              orderReference: publicId,
              recipientName: order.shipping_name,
              recipientPhone,
              recipientEmail,
              foxpostOperatorId: pickupMeta?.foxpostOperatorId ?? pickupMeta?.providerPointId ?? "",
              codAmount,
            })
          : await createMplLabel({
              orderId: order.id,
              orderReference: publicId,
              recipientName: order.shipping_name,
              recipientPhone,
              recipientEmail,
              shippingAddress,
              codAmount,
              pickup: mplPickup,
            });

    const { error: updateErr } = await svc
      .from("orders")
      .update({
        tracking_number: result.trackingNumber,
        shipping_carrier: carrier,
        ...(order.status !== "cancelled" && order.status !== "refunded" ? { status: "fulfilled" as const } : {}),
      })
      .eq("id", order.id);

    if (updateErr) {
      console.error("[shipping/create-label] tracking update failed:", updateErr.message);
    }

    return NextResponse.json({
      ok: true,
      carrier,
      trackingNumber: result.trackingNumber,
      pdfBase64: result.pdf.toString("base64"),
      filename: `cimirat-${publicId}-${carrier}.pdf`,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Ismeretlen hiba";
    console.error("[shipping/create-label]", message);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
