import { LOCALES, type Locale } from "./i18n-config";

/**
 * Canonical route folders are the English slugs. Swahili URLs use localised
 * slugs (SRD §5.1) which `proxy.ts` rewrites back to the canonical folder.
 */
export const routeSlugs = {
  home: { en: "", sw: "" },
  about: { en: "about", sw: "kuhusu" },
  services: { en: "services", sw: "huduma-zetu" },
  team: { en: "team", sw: "timu-yetu" },
  howItWorks: { en: "how-it-works", sw: "jinsi-inavyofanya-kazi" },
  cargoOwners: { en: "cargo-owners", sw: "wenye-mizigo" },
  transporters: { en: "transporters", sw: "wasafirishaji" },
  drivers: { en: "drivers", sw: "madereva" },
  corridors: { en: "corridors", sw: "njia-za-usafirishaji" },
  marketplace: { en: "marketplace", sw: "soko" },
  partners: { en: "partners", sw: "washirika" },
  contact: { en: "contact", sw: "wasiliana-nasi" },
  faq: { en: "faq", sw: "maswali" },
  privacy: { en: "privacy", sw: "faragha" },
  terms: { en: "terms", sw: "masharti" },
  login: { en: "login", sw: "ingia" },
  register: { en: "register", sw: "jisajili" },
  staff: { en: "staff", sw: "wafanyakazi" },
  track: { en: "track", sw: "fuatilia" },
  verify: { en: "verify", sw: "thibitisha" },
  reset: { en: "reset", sw: "weka-upya" },
  app: { en: "app", sw: "akaunti" },
} as const;

export type RouteKey = keyof typeof routeSlugs;

export function href(locale: Locale, key: RouteKey, query?: Record<string, string | undefined>): string {
  const slug = routeSlugs[key][locale];
  const base = slug ? `/${locale}/${slug}` : `/${locale}`;
  if (!query) return base;
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) if (v) qs.set(k, v);
  const s = qs.toString();
  return s ? `${base}?${s}` : base;
}

/** Map a localised slug (any language) to its canonical English folder. */
export function canonicalSlug(slug: string): string | null {
  for (const key of Object.keys(routeSlugs) as RouteKey[]) {
    const s = routeSlugs[key];
    if (s.sw === slug || s.en === slug) return s.en;
  }
  return null;
}

export function routeKeyForSlug(slug: string): RouteKey | null {
  for (const key of Object.keys(routeSlugs) as RouteKey[]) {
    const s = routeSlugs[key];
    if (s.sw === slug || s.en === slug) return key;
  }
  return null;
}

/** Build the same page in another language, preserving sub-paths and query. */
export function switchLocalePath(pathname: string, search: string, to: Locale): string {
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length && (LOCALES as readonly string[]).includes(parts[0])) parts.shift();
  const [first, ...rest] = parts;
  let target = `/${to}`;
  if (first) {
    const key = routeKeyForSlug(first);
    target += `/${key ? routeSlugs[key][to] : first}`;
    if (rest.length) target += `/${rest.join("/")}`;
  }
  return target + (search || "");
}

/** Pages inside the signed-in account area, e.g. appPath("en", "post-load"). Sub-paths are not translated. */
export const appPath = (locale: Locale, sub: string) => `${href(locale, "app")}/${sub}`;
