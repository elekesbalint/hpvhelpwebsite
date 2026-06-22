/** Közös bankszámla adatok (átutalás, visszaigazolás, jogi oldalak). */
export const BANK_DETAILS = {
  name: "Sunmed Kft.",
  forint: {
    accountNumber: "10918001-00000124-71950001",
    bank: "UniCredit Bank Hungary Zrt.",
    address: "1054 Budapest, Szabadság tér 5-6.",
    bic: "BACXHUHB",
    iban: "HU10109180010000012471950001",
  },
  euro: {
    accountNumber: "10410400-00000190-12029361",
    bank: "K&H Bank",
    bic: "OKHBHUHB",
    iban: "HU071041040000019012029361",
  },
} as const;
