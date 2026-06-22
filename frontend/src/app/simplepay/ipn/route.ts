import { NextRequest, NextResponse } from "next/server";
import { createServiceSupabase } from "@/lib/server-supabase";
import { finalizeSimplePaySuccessOrder } from "@/lib/simplepay-finalize-paid";
import { createSimplePaySignature, getSimplePayConfig, simplePayJsonStringify, verifySimplePaySignature } from "@/lib/simplepay";
import type { Database } from "@/types/supabase";

type IpnPayload = {
  orderRef?: string;
  transactionId?: string | number;
  status?: string;
  state?: string;
  paymentState?: string;
};

function resolveIpnStatus(payload: IpnPayload): string | undefined {
  if (typeof payload.status === "string") return payload.status;
  if (typeof payload.state === "string") return payload.state;
  if (typeof payload.paymentState === "string") return payload.paymentState;
  return undefined;
}

function toOrderStatus(simplePayStatus?: string): "paid" | "cancelled" | null {
  if (!simplePayStatus) return null;
  const value = simplePayStatus.toUpperCase().replace(/\s+/g, "");
  if (
    value === "FINISHED" ||
    value === "AUTHORIZED" ||
    value === "SUCCESS" ||
    value === "FULL" ||
    value === "COMPLETE" ||
    value === "PAID"
  ) {
    return "paid";
  }
  if (
    value === "TIMEOUT" ||
    value === "CANCELLED" ||
    value === "NOTAUTHORIZED" ||
    value === "REVERSED" ||
    value === "FAIL" ||
    value === "FAILED"
  ) {
    return "cancelled";
  }
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const raw = await request.text();
    const signature = request.headers.get("signature");
    const config = getSimplePayConfig();
    const valid = verifySimplePaySignature(raw, config.secretKey, signature);
    if (!valid) return NextResponse.json({ error: "Invalid signature." }, { status: 401 });

    const payload = JSON.parse(raw) as IpnPayload;
    const orderRef = payload.orderRef ?? "";
    const orderId = orderRef.startsWith("ORDER_") ? orderRef.slice(6) : "";
    if (!orderId) return NextResponse.json({ ok: true });

    const serviceSupabase = createServiceSupabase();
    if (!serviceSupabase) return NextResponse.json({ ok: true, skipped: "Missing SUPABASE_SERVICE_ROLE_KEY" });

    const { data: existing } = await serviceSupabase
      .from("orders")
      .select("id, status, payment_provider")
      .eq("id", orderId)
      .maybeSingle();

    const mapped = toOrderStatus(resolveIpnStatus(payload));
    const isSimplePay = existing?.payment_provider === "simplepay";

    if (mapped === "paid" && isSimplePay) {
      await finalizeSimplePaySuccessOrder(
        orderId,
        payload.transactionId != null ? String(payload.transactionId) : null
      );
    } else {
      const updates: Database["public"]["Tables"]["orders"]["Update"] = {};
      if (payload.transactionId != null) updates.payment_reference = String(payload.transactionId);
      if (mapped) updates.status = mapped;
      if (Object.keys(updates).length > 0) {
        const { error: upErr } = await serviceSupabase.from("orders").update(updates).eq("id", orderId);
        if (upErr) console.error("[simplepay/ipn] order update failed:", upErr.message);
      }
    }

    const receiveDate = new Date().toISOString().replace(/\.\d{3}Z$/, "+00:00");
    const responsePayload = {
      ...payload,
      receiveDate,
    };
    const responseRaw = simplePayJsonStringify(responsePayload);
    const headerSignature = createSimplePaySignature(responseRaw, config.secretKey);

    return new NextResponse(responseRaw, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        Signature: headerSignature,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error." }, { status: 500 });
  }
}
