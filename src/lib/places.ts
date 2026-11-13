import type { Corridor, Country } from "./marketplace";

/**
 * Geography used by the "Post cargo" and "Register truck" forms.
 *
 * The customer only picks an origin and a destination; the corridor, the border crossings, the road
 * distance and the transit time are worked out here, so nobody has to type (or get wrong) technical details.
 * Pure data + functions: shared by the browser (live estimate) and the server (authoritative values).
 */

export const COUNTRY_CODES: Country[] = ["TZ", "ZM", "CD", "KE", "UG", "RW", "BI", "MW"];

/** Which destination countries each origin can ship to (these are exactly the corridors Encore serves). */
const ROUTES: Record<Country, Country[]> = {
  TZ: ["TZ", "ZM", "CD", "MW", "RW", "BI", "UG", "KE"],
  ZM: ["TZ", "CD"],
  CD: ["TZ", "ZM"],
  MW: ["TZ"],
  RW: ["TZ", "KE"],
  BI: ["TZ", "KE"],
  UG: ["TZ", "KE"],
  KE: ["TZ", "UG", "RW", "BI"],
};
export const destinationsFor = (from: Country): Country[] => ROUTES[from] ?? [];

const key = (a: Country, b: Country) => [a, b].sort().join("-");
const CORRIDOR_OF: Record<string, Corridor> = {
  [key("TZ", "TZ")]: "domestic",
  [key("TZ", "ZM")]: "tz-zm",
  [key("TZ", "CD")]: "tz-cd",
  [key("ZM", "CD")]: "tz-cd",
  [key("TZ", "MW")]: "tz-mw",
  [key("TZ", "RW")]: "tz-rw-bi",
  [key("TZ", "BI")]: "tz-rw-bi",
  [key("TZ", "UG")]: "tz-rw-bi",
  [key("KE", "UG")]: "northern",
  [key("KE", "RW")]: "northern",
  [key("KE", "BI")]: "northern",
  [key("TZ", "KE")]: "tz-ke",
};

/** The corridor for a pair of countries, or null when Encore does not serve that pair. */
export const corridorFor = (from: Country, to: Country): Corridor | null => (destinationsFor(from).includes(to) ? (CORRIDOR_OF[key(from, to)] ?? null) : null);

/** Border posts along each route, written in the order a truck meets them when travelling from the first country to the second. */
const BORDERS: Record<string, [Country, string[]]> = {
  [key("TZ", "ZM")]: ["TZ", ["Tunduma / Nakonde"]],
  [key("TZ", "CD")]: ["TZ", ["Tunduma / Nakonde", "Kasumbalesa"]],
  [key("ZM", "CD")]: ["ZM", ["Kasumbalesa"]],
  [key("TZ", "MW")]: ["TZ", ["Songwe / Mwanza (Malawi)"]],
  [key("TZ", "RW")]: ["TZ", ["Rusumo"]],
  [key("TZ", "BI")]: ["TZ", ["Rusumo", "Kanyaru"]],
  [key("TZ", "UG")]: ["TZ", ["Mutukula"]],
  [key("KE", "UG")]: ["KE", ["Malaba"]],
  [key("KE", "RW")]: ["KE", ["Malaba", "Katuna"]],
  [key("KE", "BI")]: ["KE", ["Malaba", "Katuna", "Kanyaru"]],
  [key("TZ", "KE")]: ["TZ", ["Namanga"]],
};
export function bordersFor(from: Country, to: Country): string[] {
  const entry = BORDERS[key(from, to)];
  if (!entry) return [];
  const [first, list] = entry;
  return from === first ? [...list] : [...list].reverse();
}

export interface City { name: string; cc: Country; lat: number; lon: number }
const c = (name: string, cc: Country, lat: number, lon: number): City => ({ name, cc, lat, lon });

/** Main trade cities, ports and border towns on Encore's corridors. */
export const CITIES: City[] = [
  c("Dar es Salaam", "TZ", -6.8, 39.28), c("Dodoma", "TZ", -6.17, 35.74), c("Arusha", "TZ", -3.37, 36.68), c("Moshi", "TZ", -3.35, 37.34),
  c("Mwanza", "TZ", -2.52, 32.9), c("Mbeya", "TZ", -8.9, 33.46), c("Tunduma", "TZ", -9.3, 32.77), c("Iringa", "TZ", -7.77, 35.69),
  c("Morogoro", "TZ", -6.82, 37.66), c("Tanga", "TZ", -5.07, 39.1), c("Kigoma", "TZ", -4.88, 29.63), c("Mtwara", "TZ", -10.27, 40.18),
  c("Songea", "TZ", -10.68, 35.65), c("Singida", "TZ", -4.82, 34.74), c("Tabora", "TZ", -5.02, 32.8),
  c("Lusaka", "ZM", -15.39, 28.32), c("Ndola", "ZM", -12.97, 28.64), c("Kitwe", "ZM", -12.82, 28.21), c("Kapiri Mposhi", "ZM", -13.97, 28.67),
  c("Livingstone", "ZM", -17.84, 25.85), c("Nakonde", "ZM", -9.33, 32.76), c("Solwezi", "ZM", -12.17, 26.39), c("Chipata", "ZM", -13.64, 32.65),
  c("Lubumbashi", "CD", -11.66, 27.48), c("Kolwezi", "CD", -10.72, 25.47), c("Likasi", "CD", -10.98, 26.74), c("Kasumbalesa", "CD", -12.26, 27.8),
  c("Goma", "CD", -1.68, 29.22), c("Bukavu", "CD", -2.51, 28.86),
  c("Mombasa", "KE", -4.04, 39.67), c("Nairobi", "KE", -1.29, 36.82), c("Nakuru", "KE", -0.3, 36.07), c("Eldoret", "KE", 0.51, 35.27),
  c("Kisumu", "KE", -0.09, 34.76), c("Malaba", "KE", 0.64, 34.27),
  c("Kampala", "UG", 0.35, 32.58), c("Jinja", "UG", 0.42, 33.2), c("Entebbe", "UG", 0.05, 32.46), c("Mbarara", "UG", -0.61, 30.66), c("Gulu", "UG", 2.77, 32.3),
  c("Kigali", "RW", -1.95, 30.06), c("Huye", "RW", -2.6, 29.74), c("Musanze", "RW", -1.5, 29.63),
  c("Bujumbura", "BI", -3.38, 29.36), c("Gitega", "BI", -3.43, 29.93),
  c("Lilongwe", "MW", -13.96, 33.77), c("Blantyre", "MW", -15.79, 35.01), c("Mzuzu", "MW", -11.46, 34.02), c("Karonga", "MW", -9.93, 33.93),
];

export const citiesIn = (cc: Country): string[] => CITIES.filter((x) => x.cc === cc).map((x) => x.name);

export function findCity(name: string, cc: Country): City | undefined {
  const n = name.trim().toLowerCase();
  return CITIES.find((x) => x.cc === cc && x.name.toLowerCase() === n);
}

const rad = (d: number) => (d * Math.PI) / 180;
function haversineKm(a: City, b: City): number {
  const dLat = rad(b.lat - a.lat);
  const dLon = rad(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

export interface RouteEstimate { km: number; transit: [number, number]; corridor: Corridor; borders: string[] }

/**
 * Road distance (straight line x 1.28, rounded to 10 km) and transit time (about 500 km/day at best,
 * 380 km/day at worst, plus 1-2 days per border). Returns null when either city is not in the list;
 * the form then asks the customer for the distance.
 */
export function estimateRoute(fromCity: string, from: Country, toCity: string, to: Country): RouteEstimate | null {
  const corridor = corridorFor(from, to);
  const a = findCity(fromCity, from);
  const b = findCity(toCity, to);
  if (!corridor || !a || !b || a.name === b.name) return null;
  const borders = bordersFor(from, to);
  const km = Math.max(10, Math.round((haversineKm(a, b) * 1.28) / 10) * 10);
  return { km, corridor, borders, transit: [Math.ceil(km / 500) + borders.length, Math.ceil(km / 380) + borders.length * 2] };
}

/** Transit estimate for a distance entered by hand. */
export function transitFor(km: number, borderCount: number): [number, number] {
  return [Math.ceil(km / 500) + borderCount, Math.ceil(km / 380) + borderCount * 2];
}
