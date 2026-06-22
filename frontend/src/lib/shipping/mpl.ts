import { randomUUID } from "crypto";
import { COMPANY_CONTACT } from "@/lib/company-contact";
import { parseHungarianShippingAddress } from "@/lib/shipping/parse-address";

export type MplConfig = {
  apiBase: string;
  tokenUrl: string;
  clientId: string;
  clientSecret: string;
  agreement: string;
  accountingCode: string;
  developer: string;
  webshopId: string;
};

export function getMplConfig(): MplConfig | null {
  const clientId = process.env.MPL_API_KEY?.trim();
  const clientSecret = process.env.MPL_API_SECRET?.trim();
  const agreement = process.env.MPL_AGREEMENT_NUMBER?.trim();
  const accountingCode =
    process.env.MPL_ACCOUNTING_CODE?.trim() ||
    process.env.MPL_ACCOUNT_NUMBER?.trim();
  if (!clientId || !clientSecret || !agreement || !accountingCode) return null;

  const useSandbox = process.env.MPL_USE_SANDBOX === "true";
  const apiBase = (useSandbox ? "https://sandbox.api.posta.hu" : "https://core.api.posta.hu").replace(/\/+$/, "");

  return {
    apiBase,
    tokenUrl: `${apiBase}/oauth2/token`,
    clientId,
    clientSecret,
    agreement,
    accountingCode,
    developer: process.env.MPL_DEVELOPER_NAME?.trim() || COMPANY_CONTACT.legalName,
    webshopId: process.env.MPL_WEBSHOP_ID?.trim() || "hpvhelp",
  };
}

export function mplRequestHeaders(config: MplConfig, extra?: Record<string, string>): Record<string, string> {
  return {
    "X-Request-ID": randomUUID(),
    "X-Accounting-Code": config.accountingCode,
    ...extra,
  };
}

function normalizeHuPhone(phone: string): string {
  const digits = phone.replace(/[^\d+]/g, "");
  if (digits.startsWith("+36")) return digits;
  if (digits.startsWith("06")) return `+36${digits.slice(2)}`;
  if (digits.startsWith("36")) return `+${digits}`;
  return phone.trim();
}

let cachedToken: { value: string; expiresAt: number } | null = null;

export async function getMplAccessToken(config: MplConfig): Promise<string> {
  const now = Date.now();
  if (cachedToken && cachedToken.expiresAt > now + 30_000) {
    return cachedToken.value;
  }

  const basic = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString("base64");
  const res = await fetch(config.tokenUrl, {
    method: "POST",
    headers: mplRequestHeaders(config, {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    }),
    body: "grant_type=client_credentials",
  });

  const json = (await res.json()) as {
    access_token?: string;
    expires_in?: number;
    error?: string;
    error_description?: string;
    fault?: { faultstring?: string };
  };

  if (!res.ok || !json.access_token) {
    throw new Error(
      json.fault?.faultstring ??
        json.error_description ??
        json.error ??
        `MPL token hiba (${res.status})`
    );
  }

  cachedToken = {
    value: json.access_token,
    expiresAt: now + (json.expires_in ?? 3600) * 1000,
  };
  return json.access_token;
}

function senderBlock(config: MplConfig) {
  const parsed = parseHungarianShippingAddress(COMPANY_CONTACT.office);
  return {
    agreement: config.agreement,
    contact: {
      name: COMPANY_CONTACT.legalName,
      email: COMPANY_CONTACT.email,
      phone: normalizeHuPhone(COMPANY_CONTACT.phone),
    },
    address: {
      postCode: parsed?.postCode ?? "7623",
      city: parsed?.city ?? "Pécs",
      address: parsed?.streetLine ?? "Megyeri út 26. fszt. 109.",
    },
  };
}

type MplApiError = { code?: string; parameter?: string; text?: string; text_eng?: string };

type MplShipmentResponse = {
  webshopId?: string;
  trackingNumber?: string;
  packageTrackingNumbers?: string[];
  label?: string;
  errors?: MplApiError[];
  error?: string;
  message?: string;
};

function formatMplErrors(errors: MplApiError[] | undefined): string | null {
  if (!errors?.length) return null;
  return errors
    .map((e) => `${e.parameter ?? e.code ?? "MPL"}: ${e.text ?? e.text_eng ?? "ismeretlen hiba"}`)
    .join("; ");
}

function extractMplFault(json: unknown): string | null {
  if (!json || typeof json !== "object") return null;
  const fault = (json as { fault?: { faultstring?: string } }).fault;
  return fault?.faultstring ?? null;
}

export type MplLabelResult = {
  trackingNumber: string;
  pdf: Buffer;
};

export async function createMplLabel(params: {
  orderId: string;
  orderReference: string;
  recipientName: string;
  recipientPhone: string;
  recipientEmail: string;
  shippingAddress: string;
  codAmount?: number;
  weightGrams?: number;
  pickup?: {
    zip: string;
    city: string;
    address: string;
    mplDeliveryMode: "PM" | "PP" | "CS";
    mplParcelPickupSite: string;
  };
}): Promise<MplLabelResult> {
  const config = getMplConfig();
  if (!config) {
    throw new Error(
      "MPL API nincs konfigurálva (MPL_API_KEY, MPL_API_SECRET, MPL_AGREEMENT_NUMBER, MPL_ACCOUNT_NUMBER)."
    );
  }

  const delivery = params.pickup
    ? {
        postCode: params.pickup.zip,
        city: params.pickup.city,
        streetLine: params.pickup.address || params.pickup.mplParcelPickupSite,
      }
    : parseHungarianShippingAddress(params.shippingAddress);

  if (!delivery) {
    throw new Error("A szállítási cím formátuma érvénytelen (várt: 1234 Város, utca hsz).");
  }

  const token = await getMplAccessToken(config);
  const weight = params.weightGrams ?? Number(process.env.SHIPPING_DEFAULT_WEIGHT_GRAMS ?? "1000");
  const deliveryMode = params.pickup?.mplDeliveryMode ?? "HA";

  const item: Record<string, unknown> = {
    weight: { value: String(Math.max(1, Math.round(weight))), unit: "g" },
    services: {
      basic: "A_175_UZL",
      extra: [],
      deliveryMode,
      ...(params.codAmount != null && params.codAmount > 0
        ? { cod: String(Math.round(params.codAmount)), value: String(Math.round(params.codAmount)) }
        : {}),
    },
  };

  const recipientAddress: Record<string, string> = {
    postCode: delivery.postCode,
    city: delivery.city,
    address: delivery.streetLine,
  };
  if (params.pickup?.mplParcelPickupSite) {
    recipientAddress.parcelPickupSite = params.pickup.mplParcelPickupSite;
  }

  const payload = [
    {
      sender: senderBlock(config),
      orderId: `${params.orderReference}-${Date.now()}`.slice(0, 30),
      developer: config.developer,
      webshopId: config.webshopId,
      labelType: "A4",
      item: [item],
      recipient: {
        contact: {
          name: params.recipientName.slice(0, 80),
          email: params.recipientEmail,
          phone: normalizeHuPhone(params.recipientPhone),
        },
        address: recipientAddress,
      },
      packageRetention: "5",
      ...(params.codAmount != null && params.codAmount > 0 ? { paymentMode: "UV_AT" } : {}),
    },
  ];

  const res = await fetch(`${config.apiBase}/v2/mplapi/shipments`, {
    method: "POST",
    headers: mplRequestHeaders(config, {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    }),
    body: JSON.stringify(payload),
  });

  const raw = await res.text();
  let json: MplShipmentResponse[] | MplShipmentResponse | { fault?: { faultstring?: string } };
  try {
    json = JSON.parse(raw) as typeof json;
  } catch {
    throw new Error(`MPL válasz nem JSON (${res.status}): ${raw.slice(0, 200)}`);
  }

  if (!res.ok) {
    const fault = extractMplFault(json);
    const single = Array.isArray(json) ? json[0] : (json as MplShipmentResponse);
    throw new Error(
      fault ??
        formatMplErrors(single?.errors) ??
        single?.message ??
        single?.error ??
        `MPL csomag létrehozás sikertelen (${res.status})`
    );
  }

  const first = Array.isArray(json) ? json[0] : (json as MplShipmentResponse);
  const apiErrors = formatMplErrors(first?.errors);
  if (apiErrors) {
    throw new Error(`MPL címirat hiba: ${apiErrors}`);
  }

  if (!first?.label) {
    throw new Error("MPL nem adott vissza címiratot.");
  }

  const trackingNumber =
    first.trackingNumber ??
    first.packageTrackingNumbers?.[0] ??
    params.orderReference;

  return {
    trackingNumber: String(trackingNumber),
    pdf: Buffer.from(first.label, "base64"),
  };
}
