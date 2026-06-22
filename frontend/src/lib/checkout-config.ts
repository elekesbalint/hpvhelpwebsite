import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/supabase";

export type PaymentMethod = "card" | "transfer";
export type SampleTarget = "female" | "male";

const DEFAULT_PAYMENT_METHODS: PaymentMethod[] = ["card"];
const ALLOWED_PAYMENT_METHODS: PaymentMethod[] = ["card", "transfer"];

function isPaymentMethod(value: string): value is PaymentMethod {
  return ALLOWED_PAYMENT_METHODS.includes(value as PaymentMethod);
}

export async function getEnabledPaymentMethods(): Promise<PaymentMethod[]> {
  const { data } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", "enabled_payment_methods")
    .maybeSingle();

  const raw = data?.value;
  if (!Array.isArray(raw)) return DEFAULT_PAYMENT_METHODS;

  const methods = raw
    .filter((value): value is string => typeof value === "string" && value !== "cod")
    .filter(isPaymentMethod);
  return methods.length ? methods : DEFAULT_PAYMENT_METHODS;
}

export async function setEnabledPaymentMethods(methods: PaymentMethod[]): Promise<void> {
  const uniqueMethods = Array.from(new Set(methods.filter(isPaymentMethod)));
  const value = (uniqueMethods.length ? uniqueMethods : DEFAULT_PAYMENT_METHODS) as Database["public"]["Tables"]["app_settings"]["Insert"]["value"];
  await supabase.from("app_settings").upsert({ key: "enabled_payment_methods", value });
}

export function getSampleTargetLabel(target?: SampleTarget): string | null {
  if (target === "female") return "Női mintavételi csomag";
  if (target === "male") return "Férfi mintavételi csomag";
  return null;
}
