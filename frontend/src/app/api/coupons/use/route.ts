import { NextResponse } from "next/server";
import { checkApiRateLimit, getClientIp, requireUserFromRequest } from "@/lib/api-security";
import { createServiceSupabase } from "@/lib/server-supabase";

export async function POST(request: Request): Promise<Response> {
  const authRes = await requireUserFromRequest(request);
  if (!authRes.ok) return authRes.response;
  const { user } = authRes;

  const ip = getClientIp(request);
  const rate = checkApiRateLimit({
    key: `coupon-use:${user.id}:${ip}`,
    max: 20,
    windowMs: 10 * 60 * 1000,
    message: "Túl sok kupon-használati kérés rövid időn belül.",
  });
  if (!rate.ok) return rate.response;

  const body = (await request.json()) as { couponId?: string; orderId?: string };
  const { couponId, orderId } = body;
  if (!couponId || !orderId) return NextResponse.json({ error: "couponId és orderId megadása kötelező." }, { status: 400 });

  const svc = createServiceSupabase();
  if (!svc) return NextResponse.json({ error: "Service role nem elérhető." }, { status: 500 });

  // Biztonság: az order a bejelentkezett userhez tartozzon
  const { data: order, error: orderError } = await svc
    .from("orders")
    .select("id, user_id")
    .eq("id", orderId)
    .maybeSingle();
  if (orderError || !order || order.user_id !== user.id) {
    return NextResponse.json({ error: "A rendelés nem található vagy nem a tiéd." }, { status: 403 });
  }

  // Ellenőrzés: per-user limit
  const { data: coupon } = await svc.from("coupons").select("*").eq("id", couponId).maybeSingle();
  if (!coupon) return NextResponse.json({ error: "Kupon nem található." }, { status: 404 });

  if (coupon.max_uses_per_user != null) {
    const { count } = await svc
      .from("coupon_usage")
      .select("id", { count: "exact", head: true })
      .eq("coupon_id", couponId)
      .eq("user_id", user.id);
    if ((count ?? 0) >= coupon.max_uses_per_user) {
      return NextResponse.json({ error: `Ezt a kupont már felhasználtad (max. ${coupon.max_uses_per_user}× / fő).` }, { status: 409 });
    }
  }

  // Globális max ellenőrzés
  if (coupon.max_uses != null && coupon.used_count >= coupon.max_uses) {
    return NextResponse.json({ error: "Ez a kupon elérte a maximum felhasználások számát." }, { status: 409 });
  }

  // used_count növelése
  const { error: updateError } = await svc
    .from("coupons")
    .update({ used_count: coupon.used_count + 1 })
    .eq("id", couponId);
  if (updateError) {
    console.error("[api/coupons/use] used_count update failed:", updateError.message);
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // coupon_usage sor beszúrása
  const { error: insertError } = await svc
    .from("coupon_usage")
    .insert({ coupon_id: couponId, user_id: user.id, order_id: orderId });
  if (insertError && !insertError.message.includes("duplicate")) {
    console.error("[api/coupons/use] coupon_usage insert failed:", insertError.message);
  }

  return NextResponse.json({ ok: true });
}
