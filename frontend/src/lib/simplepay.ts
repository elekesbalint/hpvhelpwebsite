import crypto from "crypto";

export type SimplePayConfig = {
  merchant: string;
  secretKey: string;
  apiBase: string;
};

export function getSimplePayConfig(): SimplePayConfig {
  const merchant = process.env.SIMPLEPAY_SANDBOX_MERCHANT?.trim() ?? "";
  const secretKey = process.env.SIMPLEPAY_SANDBOX_SECRET_KEY?.trim() ?? "";
  const apiBase = (process.env.SIMPLEPAY_SANDBOX_API ?? "https://sandbox.simplepay.hu/payment/v2").replace(/\/+$/, "");

  if (!merchant || !secretKey || !apiBase) {
    throw new Error("SimplePay env vars are missing.");
  }
  return { merchant, secretKey, apiBase };
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
