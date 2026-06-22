import { NextRequest, NextResponse } from "next/server";
import { resolveCustomerEmailForOrder } from "@/lib/order-customer-email";
import { formatOrderPublicId } from "@/lib/order-display-id";
import { createServiceSupabase } from "@/lib/server-supabase";
import { finalizeSimplePaySuccessOrder } from "@/lib/simplepay-finalize-paid";
import { sendPaymentFailedEmail } from "@/lib/resend-notifications";
import { getSimplePayConfig, verifySimplePaySignature } from "@/lib/simplepay";

/** SimplePay GET redirect: `r` = base64(JSON), `s` = HMAC-SHA384 aláírás (ugyanaz, mint a PHP SDK). */
function getQuery(url: URL, name: string): string {
  return url.searchParams.get(name) ?? url.searchParams.get(name.toUpperCase()) ?? "";
}

async function notifyPaymentFailedByOrderId(orderId: string, reasonLabel: string) {
  if (!orderId) return;
  const svc = createServiceSupabase();
  if (!svc) return;
  const { data: order } = await svc.from("orders").select("*").eq("id", orderId).maybeSingle();
  if (!order || order.payment_provider !== "simplepay") return;
  const customerEmail = await resolveCustomerEmailForOrder(svc, order);
  const mail = await sendPaymentFailedEmail({
    order,
    publicOrderLabel: formatOrderPublicId(order.id),
    reasonLabel,
    customerEmail,
  });
  if (!mail.ok) {
    console.error("[simplepay/back] payment-failed email", {
      orderId,
      skipped: mail.skipped,
      detail: mail.detail,
    });
  }
}

export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const origin = url.origin;
  const r = getQuery(url, "r");
  const s = getQuery(url, "s");
  const orderIdFromQuery = getQuery(url, "orderId");

  const redirectFailed = (orderId: string, reason: string, emailReason: string) => {
    void notifyPaymentFailedByOrderId(orderId, emailReason);
    const target = new URL("/checkout/payment-failed", origin);
    if (orderId) target.searchParams.set("orderId", orderId);
    target.searchParams.set("reason", reason);
    return NextResponse.redirect(target);
  };

  const redirectSuccess = (orderId: string) => {
    const target = new URL("/checkout/success", origin);
    if (orderId) target.searchParams.set("orderId", orderId);
    target.searchParams.set("payment", "card");
    return NextResponse.redirect(target);
  };

  try {
    if (!r || !s) {
      if (orderIdFromQuery) {
        return redirectFailed(orderIdFromQuery, "unknown", "Nem érkezett érvényes visszajelzés a fizetőoldalról.");
      }
      return NextResponse.redirect(new URL("/checkout", origin));
    }

    let decoded: string;
    try {
      decoded = Buffer.from(r, "base64").toString("utf8");
    } catch {
      if (orderIdFromQuery) {
        return redirectFailed(orderIdFromQuery, "unknown", "A fizetőoldal válasza nem értelmezhető.");
      }
      return NextResponse.redirect(new URL("/checkout", origin));
    }

    const config = getSimplePayConfig();
    if (!verifySimplePaySignature(decoded, config.secretKey, s)) {
      return redirectFailed(
        orderIdFromQuery,
        "invalid-signature",
        "A visszatérési üzenet aláírása nem ellenőrizhető."
      );
    }

    let data: { e?: string; o?: string; t?: string | number; transactionId?: string | number };
    try {
      data = JSON.parse(decoded) as { e?: string; o?: string; t?: string | number; transactionId?: string | number };
    } catch {
      return redirectFailed(orderIdFromQuery, "unknown", "A fizetőoldal válasza hibás formátumú.");
    }

    const orderRef = typeof data.o === "string" ? data.o : "";
    const orderId = orderRef.startsWith("ORDER_") ? orderRef.slice(6) : orderIdFromQuery;
    const event = String(data.e ?? "").toUpperCase();
    const txRef = data.t ?? data.transactionId;
    const paymentRef = txRef != null && txRef !== "" ? String(txRef) : null;

    if (event === "SUCCESS") {
      if (orderId) await finalizeSimplePaySuccessOrder(orderId, paymentRef);
      return redirectSuccess(orderId);
    }
    if (event === "CANCEL") return redirectFailed(orderId, "cancel", "A fizetést megszakítottad.");
    if (event === "TIMEOUT") return redirectFailed(orderId, "timeout", "A fizetési idő lejárt.");
    if (event === "FAIL") {
      return redirectFailed(orderId, "fail", "A bankkártyás fizetés nem lett autorizálva (sikertelen).");
    }

    return redirectFailed(orderId, "unknown", "A fizetés eredménye nem egyértelmű.");
  } catch {
    return NextResponse.redirect(new URL("/checkout", origin));
  }
}
