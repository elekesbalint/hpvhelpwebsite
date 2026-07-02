/** Sunmed Kft. / HPVhelp hivatalos elérhetőségek (fejléc, lábléc, ügyfélszolgálat). */
export const COMPANY_CONTACT = {
  legalName: "Sunmed Kft.",
  phone: "+36 30 865 7792",
  phoneHref: "tel:+36308657792",
  email: "info@sunmed.hu",
  emailHref: "mailto:info@sunmed.hu",
  seat: "7623 Pécs, Megyeri út 26. fszt. 109.",
  seatLabel: "Székhely",
  office: "7623 Pécs, Megyeri út 26. fszt. 109.",
  officeLabel: "Iroda, raktár és ügyfélszolgálat és személyes átvételi pont",
  hours: "Hétfő–csütörtök: 8:00–16:00, péntek: 8:00–13:00",
  hoursNote:
    "Ügyfélszolgálatunk hétfőtől csütörtökig 8 és 16 óra között, pénteken 8 és 13 óra között érhető el.",
  companyRegistry: "02-09-081275",
  taxNumber: "11551373-2-02",
} as const;

const officeMapsQuery = encodeURIComponent(COMPANY_CONTACT.office);

/** Beágyazott Google Térkép (ügyfélszolgálat helyszín). */
export const OFFICE_MAPS_EMBED_URL = `https://maps.google.com/maps?q=${officeMapsQuery}&hl=hu&z=17&output=embed`;

/** Google Térkép megnyitása új lapon. */
export const OFFICE_MAPS_OPEN_URL = `https://www.google.com/maps/search/?api=1&query=${officeMapsQuery}`;

/** Közös bemutatkozó videó (YouTube) */
export const INTRO_VIDEO_URL = "https://www.youtube.com/watch?v=YqcPJuCduxA";
export const INTRO_VIDEO_LABEL = "CÉGBEMUTATKOZÓ VIDEÓ";

/** HPV Centrum – segítő kérdőív (milyen tesztet rendeljek?) */
export const HPV_RISK_QUESTIONNAIRE_URL = "https://hpvcentrum.hu/hpv-riziko-kerdoiv-2/";
export const HPV_RISK_QUESTIONNAIRE_LABEL = "Milyen tesztet rendeljek? SEGÍTŐ KÉRDŐÍV";
