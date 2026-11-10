import type { Metadata } from "next";
import { LOCALES, type Locale } from "./i18n-config";
import { href, type RouteKey } from "./routes";
import { SITE_URL } from "./site";

/** Per-page metadata: canonical URL, hreflang alternates (en/sw) and Open Graph (SRD WEB-045). */
export function pageMeta(locale: Locale, key: RouteKey, title: string, description: string, opts: { noindex?: boolean } = {}): Metadata {
  const languages = Object.fromEntries(LOCALES.map((l) => [l, href(l, key)]));
  return {
    title,
    description,
    alternates: { canonical: href(locale, key), languages: { ...languages, "x-default": href("en", key) } },
    openGraph: { title, description, url: href(locale, key), siteName: "Encore Holdings Group", locale: locale === "sw" ? "sw_TZ" : "en_US", type: "website" },
    robots: opts.noindex ? { index: false, follow: false } : undefined,
  };
}

export const metadataBase = new URL(SITE_URL);
