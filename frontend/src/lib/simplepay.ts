import crypto from "crypto";

export type SimplePayConfig = {
  merchant: string;
  secretKey: string;
  apiBase: string;
  mode: "sandbox" | "production";
};

export function getSimplePayMode(): "sandbox" | "production" {
  const raw = process.env.SIMPLEPAY_MODE?.trim().toLowerCase();
  return raw === "production" || raw === "live" ? "production" : "sandbox";
}

export function getSimplePayConfig(): SimplePayConfig {
  const mode = getSimplePayMode();

  if (mode === "production") {
    const merchant = process.env.SIMPLEPAY_MERCHANT?.trim() ?? "";
    const secretKey = process.env.SIMPLEPAY_SECRET_KEY?.trim() ?? "";
    const apiBase = (process.env.SIMPLEPAY_API ?? "https://secure.simplepay.hu/payment/v2").replace(/\/+$/, "");

    if (!merchant || !secretKey) {
      throw new Error("SimplePay éles env hiányzik: SIMPLEPAY_MERCHANT és SIMPLEPAY_SECRET_KEY.");
    }
    return { merchant, secretKey, apiBase, mode };
  }

  const merchant = process.env.SIMPLEPAY_SANDBOX_MERCHANT?.trim() ?? "";
  const secretKey = process.env.SIMPLEPAY_SANDBOX_SECRET_KEY?.trim() ?? "";
  const apiBase = (process.env.SIMPLEPAY_SANDBOX_API ?? "https://sandbox.simplepay.hu/payment/v2").replace(/\/+$/, "");

  if (!merchant || !secretKey) {
    throw new Error("SimplePay sandbox env hiányzik: SIMPLEPAY_SANDBOX_MERCHANT és SIMPLEPAY_SANDBOX_SECRET_KEY.");
  }
  return { merchant, secretKey, apiBase, mode };
}

/**
 * PHP `json_encode()` escapes `/` as `\/` by default. SimplePay signs the exact wire JSON;
 * use this instead of JSON.stringify alone so Node matches PHP/SDK output.
 */
export function simplePayJsonStringify(payload: unknown): string {
  return JSON.stringify(payload).replace(/\//g, "\\/");
}

export function createSimplePaySignature(rawBody: string, secretKey: string): string {
  return crypto.createHmac("sha384", secretKey).update(rawBody, "utf8").digest("base64");
}

export function verifySimplePaySignature(rawBody: string, secretKey: string, signatureHeader?: string | null): boolean {
  if (!signatureHeader) return false;
  const expected = createSimplePaySignature(rawBody, secretKey);
  return expected === signatureHeader;
}

export function simplePaySalt(length = 32): string {
  return crypto.randomBytes(Math.ceil(length / 2)).toString("hex").slice(0, length);
}
