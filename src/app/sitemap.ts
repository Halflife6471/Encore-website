import type { MetadataRoute } from "next";
import { LOCALES } from "@/lib/i18n-config";
import { href, type RouteKey } from "@/lib/routes";
import { SITE_URL } from "@/lib/site";

// Public, indexable pages only (the 14 pages of SRS §7.1 minus private/utility screens).
const PUBLIC: RouteKey[] = ["home", "about", "services", "team", "howItWorks", "cargoOwners", "transporters", "drivers", "corridors", "marketplace", "partners", "contact", "faq", "privacy", "terms", "login", "register"];

export default function sitemap(): MetadataRoute.Sitemap {
  return PUBLIC.flatMap((key) =>
    LOCALES.map((l) => ({
      url: `${SITE_URL}${href(l, key)}`,
      changeFrequency: key === "home" ? ("weekly" as const) : ("monthly" as const),
      priority: key === "home" ? 1 : key === "register" || key === "contact" ? 0.8 : 0.6,
      alternates: { languages: Object.fromEntries(LOCALES.map((x) => [x, `${SITE_URL}${href(x, key)}`])) },
    })),
  );
}
