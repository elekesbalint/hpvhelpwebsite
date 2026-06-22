import { supabase } from "@/lib/supabase";

export async function listVerifiedTotpFactors() {
  const { data, error } = await supabase.auth.mfa.listFactors();
  if (error) throw new Error(error.message);
  const factors = data?.totp ?? [];
  return factors.filter((f) => f.status === "verified");
}

export async function verifyTotpCode(factorId: string, code: string) {
  const normalized = code.replace(/\s/g, "");
  const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId });
  if (challengeError || !challenge) {
    throw new Error("Nem sikerült elindítani a 2FA ellenőrzést.");
  }

  const { error: verifyError } = await supabase.auth.mfa.verify({
    factorId,
    challengeId: challenge.id,
    code: normalized,
  });

  if (verifyError) {
    throw new Error("Hibás kód. Ellenőrizd az authenticator appot és próbáld újra.");
  }
}

export async function unenrollAllTotpFactors() {
  const { data, error } = await supabase.auth.mfa.listFactors();
  if (error) throw new Error(error.message);

  for (const factor of data?.totp ?? []) {
    const { error: unenrollError } = await supabase.auth.mfa.unenroll({ factorId: factor.id });
    if (unenrollError) throw new Error(unenrollError.message);
  }
}

export async function enrollTotpFactor() {
  const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp" });
  if (error || !data) {
    throw new Error(error?.message ?? "Nem sikerült új 2FA kódot generálni.");
  }
  return {
    factorId: data.id,
    qrCode: data.totp.qr_code,
    secret: data.totp.secret,
  };
}
