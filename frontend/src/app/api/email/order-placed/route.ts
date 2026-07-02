import { NextRequest, NextResponse } from "next/server";
import { checkApiRateLimit, getClientIp, requireUserFromRequest } from "@/lib/api-security";
import { resolveCustomerEmailForOrder } from "@/lib/order-customer-email";
import { formatOrderPublicId } from "@/lib/order-display-id";
import { sendOrderConfirmationEmail } from "@/lib/resend-notifications";

type Body = { orderId?: string };

export async function POST(request: NextRequest) {
  const authRes = await requireUserFromRequest(request);
  if (!authRes.ok) return authRes.response;
  const { user } = authRes;

  const ip = getClientIp(request);
  const rate = checkApiRateLimit({
    key: `order-placed-email:${user.id}:${ip}`,
    max: 10,
    windowMs: 10 * 60 * 1000,
    message: "Túl sok email-küldési próbálkozás rövid időn belül.",
  });
  if (!rate.ok) return rate.response;

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body.orderId) return NextResponse.json({ error: "orderId is required" }, { status: 400 });

  const { supabase } = authRes;

  const { data: order, error: orderErr } = await supabase.from("orders").select("*").eq("id", body.orderId).maybeSingle();
  if (orderErr || !order || order.user_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: items, error: itemsErr } = await supabase
    .from("order_items")
    .select("product_name, quantity, line_total, unit_price")
    .eq("order_id", body.orderId)
    .order("created_at", { ascending: true });

  if (itemsErr) return NextResponse.json({ error: itemsErr.message }, { status: 500 });

  const customerEmail = await resolveCustomerEmailForOrder(supabase, order);
  const result = await sendOrderConfirmationEmail({
    order,
    items: items ?? [],
    publicOrderLabel: formatOrderPublicId(order),
    customerEmail,
  });

  if (!result.ok) {
    console.error("[api/email/order-placed] send failed", {
      orderId: body.orderId,
      skipped: result.skipped,
      detail: result.detail,
      adminOnly: result.adminOnly,
    });
  }

  return NextResponse.json(result);
}
