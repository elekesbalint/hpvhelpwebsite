import { createHash } from "crypto";
import { COMPANY_CONTACT } from "@/lib/company-contact";
import { parseHungarianShippingAddress } from "@/lib/shipping/parse-address";

export type GlsConfig = {
  apiBase: string;
  username: string;
  password: string;
  clientNumber: number;
  webshopEngine: string;
};

export function getGlsConfig(): GlsConfig | null {
  const username = process.env.GLS_API_USERNAME?.trim();
  const password = process.env.GLS_API_PASSWORD?.trim();
  const clientNumberRaw = process.env.GLS_CLIENT_NUMBER?.trim();
  if (!username || !password || !clientNumberRaw) return null;

  const clientNumber = Number(clientNumberRaw);
  if (!Number.isFinite(clientNumber)) return null;

  const useTest = process.env.GLS_USE_TEST === "true";
  const apiBase = (useTest ? "https://api.test.mygls.hu" : "https://api.mygls.hu").replace(/\/+$/, "");

  return {
    apiBase,
    username,
    password,
    clientNumber,
    webshopEngine: process.env.GLS_WEBSHOP_ENGINE?.trim() || "HPVhelp",
  };
}

function hashGlsPassword(password: string): number[] {
  return Array.from(createHash("sha512").update(password, "utf8").digest());
}

function senderPickupAddress() {
  const parsed = parseHungarianShippingAddress(COMPANY_CONTACT.office);
  return {
    Name: COMPANY_CONTACT.legalName,
    Street: parsed?.streetLine ?? "Megyeri út 26.",
    HouseNumber: "",
    City: parsed?.city ?? "Pécs",
    ZipCode: parsed?.postCode ?? "7623",
    CountryIsoCode: "HU",
    ContactName: COMPANY_CONTACT.legalName,
    ContactPhone: COMPANY_CONTACT.phone,
    ContactEmail: COMPANY_CONTACT.email,
  };
}

function labelsToBuffer(labels: unknown): Buffer | null {
  if (!labels) return null;
  if (typeof labels === "string") return Buffer.from(labels, "base64");
  if (Array.isArray(labels)) return Buffer.from(labels);
  return null;
}

export type GlsLabelResult = {
  trackingNumber: string;
  pdf: Buffer;
};

export async function createGlsLabel(params: {
  orderId: string;
  clientReference: string;
  recipientName: string;
  recipientPhone: string;
  recipientEmail: string;
  shippingAddress: string;
  codAmount?: number;
  /** GLS csomagpont: PSD szolgáltatás azonosító (Matchcode) */
  glsPsdId?: string;
  pickup?: {
    zip: string;
    city: string;
    address: string;
    name: string;
  };
}): Promise<GlsLabelResult> {
  const config = getGlsConfig();
  if (!config) throw new Error("GLS API nincs konfigurálva (GLS_API_USERNAME, GLS_API_PASSWORD, GLS_CLIENT_NUMBER).");

  const delivery = params.pickup
    ? {
        postCode: params.pickup.zip,
        city: params.pickup.city,
        streetLine: params.pickup.address || params.pickup.name,
      }
    : parseHungarianShippingAddress(params.shippingAddress);
  if (!delivery) {
    throw new Error("A szállítási cím formátuma érvénytelen (várt: 1234 Város, utca hsz).");
  }

  const serviceList: { Code: string; DPVParameter?: { DecimalValue: number; StringValue: string }; PSDParameter?: { StringValue: string } }[] = [];
  if (params.glsPsdId) {
    serviceList.push({
      Code: "PSD",
      PSDParameter: { StringValue: params.glsPsdId },
    });
  }
  if (params.codAmount != null && params.codAmount > 0) {
    serviceList.push({
      Code: "DPV",
      DPVParameter: {
        DecimalValue: Math.round(params.codAmount),
        StringValue: params.clientReference.slice(0, 15),
      },
    });
  }

  const body = {
    Username: config.username,
    Password: hashGlsPassword(config.password),
    WebshopEngine: config.webshopEngine,
    TypeOfPrinter: "A4_4x1",
    ParcelList: [
      {
        ClientNumber: config.clientNumber,
        ClientReference: params.clientReference.slice(0, 50),
        Count: 1,
        Content: `HPVhelp rendelés ${params.clientReference}`,
        PickupAddress: senderPickupAddress(),
        DeliveryAddress: {
          Name: params.recipientName.slice(0, 80),
          Street: delivery.streetLine,
          HouseNumber: "",
          City: delivery.city,
          ZipCode: delivery.postCode,
          CountryIsoCode: "HU",
          ContactName: params.recipientName.slice(0, 80),
          ContactPhone: params.recipientPhone,
          ContactEmail: params.recipientEmail,
        },
        ...(serviceList.length ? { ServiceList: serviceList } : {}),
      },
    ],
  };

  const res = await fetch(`${config.apiBase}/ParcelService.svc/json/PrintLabels`, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  let json: {
    Labels?: unknown;
    PrintLabelsErrorList?: { ErrorCode?: string; ErrorDescription?: string }[];
    PrintLabelsInfoList?: { ParcelNumber?: number | string }[];
  };
  try {
    json = JSON.parse(text) as typeof json;
  } catch {
    throw new Error(`GLS válasz nem JSON (${res.status}): ${text.slice(0, 200)}`);
  }

  const errors = json.PrintLabelsErrorList ?? [];
  if (errors.length > 0) {
    const msg = errors.map((e) => `${e.ErrorCode ?? "?"}: ${e.ErrorDescription ?? ""}`).join("; ");
    throw new Error(`GLS címirat hiba: ${msg}`);
  }

  const pdf = labelsToBuffer(json.Labels);
  if (!pdf?.length) {
    throw new Error("GLS nem adott vissza PDF címiratot.");
  }

  const parcelNumber = json.PrintLabelsInfoList?.[0]?.ParcelNumber;
  const trackingNumber = parcelNumber != null ? String(parcelNumber) : params.clientReference;

  return { trackingNumber, pdf };
}
