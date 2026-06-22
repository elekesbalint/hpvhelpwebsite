import type { PickupPointMeta } from "@/types/pickup-point";

export function getFoxpostConfig(): { apiBase: string; username: string; password: string } | null {
  const username = process.env.FOXPOST_API_USERNAME?.trim();
  const password = process.env.FOXPOST_API_PASSWORD?.trim();
  if (!username || !password) return null;
  return {
    apiBase: (process.env.FOXPOST_API_BASE?.trim() || "https://webapi.foxpost.hu").replace(/\/+$/, ""),
    username,
    password,
  };
}

export type FoxpostLabelResult = {
  trackingNumber: string;
  pdf: Buffer;
};

/** FOXPOST csomagautomata címke (webapi.foxpost.hu) */
export async function createFoxpostLabel(params: {
  orderReference: string;
  recipientName: string;
  recipientPhone: string;
  recipientEmail: string;
  foxpostOperatorId: string;
  codAmount?: number;
}): Promise<FoxpostLabelResult> {
  const config = getFoxpostConfig();
  if (!config) {
    throw new Error("FOXPOST API nincs konfigurálva (FOXPOST_API_USERNAME, FOXPOST_API_PASSWORD).");
  }

  const auth = Buffer.from(`${config.username}:${config.password}`).toString("base64");
  const body = {
    reference: params.orderReference.slice(0, 50),
    recipientName: params.recipientName.slice(0, 80),
    recipientPhone: params.recipientPhone.replace(/\s/g, ""),
    recipientEmail: params.recipientEmail,
    destination: params.foxpostOperatorId,
    size: "M",
    ...(params.codAmount != null && params.codAmount > 0 ? { cod: Math.round(params.codAmount) } : {}),
  };

  const res = await fetch(`${config.apiBase}/v2/parcel`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
  });

  const raw = await res.text();
  let json: { parcelNumber?: string; label?: string; pdf?: string; error?: string; message?: string };
  try {
    json = JSON.parse(raw) as typeof json;
  } catch {
    throw new Error(`FOXPOST válasz nem JSON (${res.status}): ${raw.slice(0, 200)}`);
  }

  if (!res.ok) {
    throw new Error(json.message ?? json.error ?? `FOXPOST címke hiba (${res.status})`);
  }

  const labelB64 = json.label ?? json.pdf;
  if (!labelB64) {
    throw new Error("FOXPOST nem adott vissza címiratot.");
  }

  return {
    trackingNumber: json.parcelNumber ?? params.orderReference,
    pdf: Buffer.from(labelB64, "base64"),
  };
}

export function pickupMetaFromOrder(meta: unknown): PickupPointMeta | null {
  if (!meta || typeof meta !== "object") return null;
  const m = meta as PickupPointMeta;
  if (!m.provider || !m.providerPointId) return null;
  return m;
}
