import type { Dict } from "@/lib/dictionaries/en";
import { isoDay } from "@/lib/marketplace";

export type MP = Dict["marketplace"];

/** Replace `{name}` tokens in a dictionary string. */
export const tpl = (s: string, v: Record<string, string | number>) => s.replace(/\{(\w+)\}/g, (_, k) => String(v[k] ?? ""));

export const usd = (n: number) => n.toLocaleString("en-US");
export const km = (n: number) => `${n.toLocaleString("en-US")} km`;
export const tonnes = (n: number) => `${n.toLocaleString("en-US", { maximumFractionDigits: 1 })} t`;

/** Day-month formatter (UTC, so server and browser always agree). */
export function makeDate(locale: string) {
  const f = new Intl.DateTimeFormat(locale === "sw" ? "sw-TZ" : "en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
  return (base: number, offset: number) => f.format(new Date(`${isoDay(base, offset)}T00:00:00Z`));
}

export function dateRange(fmt: ReturnType<typeof makeDate>, base: number, [a, b]: [number, number]) {
  return a === b ? fmt(base, a) : `${fmt(base, a)} – ${fmt(base, b)}`;
}

export function posted(d: MP, hours: number) {
  return hours < 48 ? tpl(d.card.postedHours, { n: hours }) : tpl(d.card.postedDays, { n: Math.round(hours / 24) });
}
