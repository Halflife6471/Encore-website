import "server-only";
import type { Locale } from "./i18n-config";
import type { Dict } from "./dictionaries/en";

export { LOCALES, DEFAULT_LOCALE, isLocale, type Locale } from "./i18n-config";
export type { Dict } from "./dictionaries/en";

const loaders: Record<Locale, () => Promise<Dict>> = {
  en: () => import("./dictionaries/en").then((m) => m.en as unknown as Dict),
  sw: () => import("./dictionaries/sw").then((m) => m.sw),
};

export const getDict = (locale: Locale) => loaders[locale]();
