/** SimplePay / OTP Mobil hivatalos fizetési tájékoztató (kötelező kattintható logo link). */
export const SIMPLEPAY_PAYMENT_INFO_PDF_URL =
  "https://simplepartner.hu/PaymentService/Fizetesi_tajekoztato.pdf";

export const SIMPLEPAY_BUYER_AFF_URL = "https://simplepay.hu/vasarlo-aff";

const MERCHANT_NAME = "Sunmed Kft.";
const MERCHANT_ADDRESS = "7623 Pécs, Megyeri út 26. fszt. 109.";
const SHOP_NAME = "hpvhelp.hu";

/** 2025.07.01-től SimplePay Zrt. – új székhely. */
export const SIMPLEPAY_PROCESSOR_LABEL = "SimplePay Zrt.";
export const SIMPLEPAY_PROCESSOR_ADDRESS = "1138 Budapest, Váci út 135-139-B. ép. 5. em.";

export function simplePayIpnUrl(siteUrl?: string): string {
  const base = (siteUrl || process.env.NEXT_PUBLIC_SITE_URL || "https://hpvhelp.hu").replace(/\/+$/, "");
  return `${base}/simplepay/ipn`;
}

export function formatSimplePayTransactionId(id: string | null | undefined): string | null {
  const trimmed = id?.trim();
  if (!trimmed) return null;
  return trimmed;
}

export const SIMPLEPAY_CARD_PAYMENT_INTRO =
  "Online bankkártyás fizetés (OTP Mobil – SimplePay): A Megrendelő a birtokában lévő bankkártya segítségével azonnal teljesítheti a fizetési kötelezettségét. A MEGRENDELÉS gombra kattintva az oldal 3-5 másodperc után átirányítja a Megrendelőt az OTP Mobil (SimplePay) fizető felületre, ahol megadhatja adatait és teljesítheti a fizetést.";

export const SIMPLEPAY_DATA_TRANSFER_CONSENT = `Elfogadom és hozzájárulok, hogy a(z) ${MERCHANT_NAME} (${MERCHANT_ADDRESS}) által a(z) ${SHOP_NAME} felhasználói adatbázisában tárolt alábbi személyes adataim átadásra kerüljenek a ${SIMPLEPAY_PROCESSOR_LABEL} (${SIMPLEPAY_PROCESSOR_ADDRESS}), mint adatfeldolgozó részére.`;

export const SIMPLEPAY_TRANSFERRED_DATA_ITEMS = [
  "A Vásárló neve",
  "A Vásárló e-mail címe",
  "A Vásárló telefonszáma",
  "A megrendelés végösszege",
] as const;

export const SIMPLEPAY_FAILED_TITLE = "Sikertelen tranzakció.";

export const SIMPLEPAY_FAILED_BODY =
  "Kérjük, ellenőrizze a tranzakció során megadott adatok helyességét. Amennyiben minden adatot helyesen adott meg, a visszautasítás okának kivizsgálása kapcsán kérjük, szíveskedjen kapcsolatba lépni kártyakibocsátó bankjával.";
