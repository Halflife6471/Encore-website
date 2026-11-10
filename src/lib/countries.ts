export type Country = { code: string; name: { en: string; sw: string }; dial: string };

/** Operating and planned markets first (SRS §24), then neighbours. TZ is the default (+255). */
export const COUNTRIES: Country[] = [
  { code: "TZ", name: { en: "Tanzania", sw: "Tanzania" }, dial: "255" },
  { code: "ZM", name: { en: "Zambia", sw: "Zambia" }, dial: "260" },
  { code: "CD", name: { en: "DR Congo", sw: "DR Kongo" }, dial: "243" },
  { code: "MW", name: { en: "Malawi", sw: "Malawi" }, dial: "265" },
  { code: "RW", name: { en: "Rwanda", sw: "Rwanda" }, dial: "250" },
  { code: "BI", name: { en: "Burundi", sw: "Burundi" }, dial: "257" },
  { code: "KE", name: { en: "Kenya", sw: "Kenya" }, dial: "254" },
  { code: "UG", name: { en: "Uganda", sw: "Uganda" }, dial: "256" },
  { code: "MZ", name: { en: "Mozambique", sw: "Msumbiji" }, dial: "258" },
  { code: "ZA", name: { en: "South Africa", sw: "Afrika Kusini" }, dial: "27" },
];

export const DEFAULT_COUNTRY = COUNTRIES[0];

export function countryByCode(code: string): Country | undefined {
  return COUNTRIES.find((c) => c.code === code);
}

/**
 * Normalise a national phone number to E.164. Strips spaces/punctuation and a
 * leading trunk "0"; accepts numbers already typed with the dial code.
 */
export function toE164(dial: string, input: string): string | null {
  let digits = input.replace(/[^\d+]/g, "");
  if (digits.startsWith("+")) {
    digits = digits.slice(1);
    if (!digits.startsWith(dial)) return null;
    digits = digits.slice(dial.length);
  } else if (digits.startsWith("00" + dial)) {
    digits = digits.slice(2 + dial.length);
  }
  digits = digits.replace(/^0+/, "");
  if (!/^\d{7,11}$/.test(digits)) return null;
  return `+${dial}${digits}`;
}
