import { NextResponse } from "next/server";
import { createServiceSupabase } from "@/lib/server-supabase";

// Vercel Cron hívja (vercel.json), de kézzel is meghívható Authorization fejléccel.
export async function GET(request: Request): Promise<Response> {
  const authHeader = request.headers.get("Authorization");
  const cronSecret = process.env.CRON_SECRET?.trim();

  // Biztonsági ellenőrzés: csak Vercel Cron vagy helyes secret kulccsal hívható
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const svc = createServiceSupabase();
  if (!svc) {
    return NextResponse.json({ error: "Service role not configured." }, { status: 500 });
  }

  // 7 napnál régebbi pending rendelések lekérése
  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data: oldOrders, error: fetchError } = await svc
    .from("orders")
    .select("id")
    .eq("status", "pending")
    .lt("created_at", cutoff);

  if (fetchError) {
    console.error("[cron/cleanup-orders] fetch error:", fetchError.message);
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  if (!oldOrders || oldOrders.length === 0) {
    return NextResponse.json({ ok: true, deleted: 0, message: "Nincs törlendő rendelés." });
  }

  let deleted = 0;
  const errors: string[] = [];

  for (const order of oldOrders) {
    // Készlet visszaállítása
    const { error: stockError } = await svc.rpc("restore_product_stock_for_order", {
      p_order_id: order.id,
    });
    if (stockError) {
      console.error(`[cron/cleanup-orders] stock restore failed for ${order.id}:`, stockError.message);
      errors.push(`${order.id}: ${stockError.message}`);
      continue;
    }

    // Rendelés törlése (cascade törli az order_items-t is)
    const { error: deleteError } = await svc.from("orders").delete().eq("id", order.id);
    if (deleteError) {
      console.error(`[cron/cleanup-orders] delete failed for ${order.id}:`, deleteError.message);
      errors.push(`${order.id}: ${deleteError.message}`);
    } else {
      deleted++;
      console.log(`[cron/cleanup-orders] deleted stale pending order: ${order.id}`);
    }
  }

  return NextResponse.json({
    ok: errors.length === 0,
    deleted,
    total: oldOrders.length,
    errors: errors.length > 0 ? errors : undefined,
  });
}
