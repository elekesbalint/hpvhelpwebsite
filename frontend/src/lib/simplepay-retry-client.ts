import { supabase } from "@/lib/supabase";

export function orderEligibleForSimplePayRetry(order: {
  payment_provider: string | null;
  status: string;
}): boolean {
  if (order.payment_provider !== "simplepay") return false;
  return order.status === "pending" || order.status === "cancelled";
}

/** Megnyitja a SimplePay fizetőoldalt ugyanahhoz a rendeléshez (Bearer: bejelentkezett felhasználó vagy admin). */
export async function startSimplePayPaymentForOrder(
  orderId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) {
    return { ok: false, error: "A fizetéshez jelentkezz be." };
  }

  const res = await fetch("/simplepay/start", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ orderId }),
  });

  const json = (await res.json()) as { paymentUrl?: string; error?: string };
  if (!res.ok || !json.paymentUrl) {
    return { ok: false, error: json.error ?? "A fizetési oldal nem indítható el." };
  }

  window.location.href = json.paymentUrl;
  return { ok: true };
}
