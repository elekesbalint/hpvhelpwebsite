import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseWithBearer } from "@/lib/server-supabase";
import { createSimplePaySignature, getSimplePayConfig, simplePayJsonStringify, simplePaySalt } from "@/lib/simplepay";

type RefundBody = {
  orderId?: string;
  amount?: number;
};

export async function POST(request: NextRequest) {
  try {
    const auth = request.headers.get("authorization") ?? "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
    if (!token) return NextResponse.json({ error: "Missing auth token." }, { status: 401 });

    const body = (await request.json()) as RefundBody;
    if (!body.orderId) return NextResponse.json({ error: "orderId is required." }, { status: 400 });

    const supabase = createServerSupabaseWithBearer(token);
    const { data: isAdmin, error: adminError } = await supabase.rpc("is_admin");
    if (adminError || !isAdmin) return NextResponse.json({ error: "Forbidden." }, { status: 403 });

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, currency, total, payment_provider, payment_reference")
      .eq("id", body.orderId)
      .maybeSingle();
    if (orderError || !order) return NextResponse.json({ error: "Order not found." }, { status: 404 });
    if (order.payment_provider !== "simplepay" || !order.payment_reference) {
      return NextResponse.json({ error: "This order cannot be refunded via SimplePay." }, { status: 400 });
    }

    const refundAmount = Math.round(body.amount ?? Number(order.total));
    if (!Number.isFinite(refundAmount) || refundAmount <= 0) {
      return NextResponse.json({ error: "Invalid refund amount." }, { status: 400 });
    }

    const config = getSimplePayConfig();
    const payload = {
      salt: simplePaySalt(32),
      merchant: config.merchant,
      transactionId: String(order.payment_reference),
      currency: order.currency || "HUF",
      refundTotal: refundAmount,
      orderRef: `REFUND_${order.id}_${Date.now()}`,
      sdkVersion: "SimplePay_PHP_SDK_2.1_Laravel",
    };
    const payloadRaw = simplePayJsonStringify(payload);
    const signature = createSimplePaySignature(payloadRaw, config.secretKey);

    const spResponse = await fetch(`${config.apiBase}/refund`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Signature: signature,
      },
      body: payloadRaw,
      cache: "no-store",
    });
    const spJson = await spResponse.json();
    if (!spResponse.ok || Array.isArray((spJson as { errorCodes?: string[] }).errorCodes)) {
      return NextResponse.json({ error: "SimplePay refund failed.", details: spJson }, { status: 502 });
    }

    await supabase.from("orders").update({ status: "refunded" }).eq("id", order.id);
    return NextResponse.json({ ok: true, details: spJson });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error." }, { status: 500 });
  }
}
