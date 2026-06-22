import { NextRequest, NextResponse } from "next/server";
import { requireAdminFromRequest } from "@/lib/api-security";
import { formatOrderPublicId } from "@/lib/order-display-id";
import { sendCourierHandoffEmail } from "@/lib/resend-notifications";

type Body = { orderId?: string };

export async function POST(request: NextRequest) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body.orderId) return NextResponse.json({ error: "orderId is required" }, { status: 400 });

  // Ne követeljünk server-side AAL2 ellenőrzést: a Bearerrel hívott Supabase kliensen a
  // mfa.getAuthenticatorAssuranceLevel() gyakran nem ad vissza aal2-t → téves 403.
  // Az admin jogosultság továbbra is az is_admin() RPC-vel védett.
  const adminAuth = await requireAdminFromRequest(request);
  if (!adminAuth.ok) return adminAuth.response;
  const { supabase } = adminAuth;

  const { data: order, error: orderErr } = await supabase.from("orders").select("*").eq("id", body.orderId).maybeSingle();
  if (orderErr || !order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  let toEmail = order.shipping_email?.trim() ?? "";
  let toName = order.shipping_name?.trim() || "Vásárló";
  if (!toEmail) {
    const { data: profile } = await supabase.from("profiles").select("email, full_name").eq("id", order.user_id).maybeSingle();
    toEmail = profile?.email?.trim() ?? "";
    if (profile?.full_name?.trim()) toName = profile.full_name.trim();
  }
  if (!toEmail) return NextResponse.json({ ok: false, skipped: "no_customer_email" }, { status: 400 });

  const { data: orderItems, error: itemsErr } = await supabase
    .from("order_items")
    .select("product_name, quantity, line_total")
    .eq("order_id", body.orderId)
    .order("created_at", { ascending: true });

  if (itemsErr) return NextResponse.json({ error: itemsErr.message }, { status: 500 });

  const itemsText =
    (orderItems ?? [])
      .map(
        (item) =>
          `${item.product_name} - ${item.quantity} db - ${Number(item.line_total).toLocaleString("hu-HU")} Ft`
      )
      .join("\n") || "A rendelés részletei a fiókodban érhetők el.";

  const result = await sendCourierHandoffEmail({
    order,
    itemsTextLines: itemsText,
    publicOrderLabel: formatOrderPublicId(order.id),
    toEmail,
    toName,
  });

  if (!result.ok) {
    console.error("[api/email/courier-assigned] send failed", {
      orderId: body.orderId,
      skipped: result.skipped,
      detail: result.detail,
    });
  }

  return NextResponse.json(result);
}
