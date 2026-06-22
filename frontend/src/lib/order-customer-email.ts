import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

type OrderEmailFields = Pick<Database["public"]["Tables"]["orders"]["Row"], "shipping_email" | "user_id">;

/** Szállítási email, ha üres akkor a profilban tárolt bejelentkezési email. */
export async function resolveCustomerEmailForOrder(
  supabase: SupabaseClient<Database>,
  order: OrderEmailFields
): Promise<string | null> {
  const fromOrder = order.shipping_email?.trim();
  if (fromOrder) return fromOrder;
  const { data: profile } = await supabase
    .from("profiles")
    .select("email")
    .eq("id", order.user_id)
    .maybeSingle();
  return profile?.email?.trim() || null;
}
