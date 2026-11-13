/**
 * Marketplace SAMPLE data.
 *
 * Everything here is illustrative: it shows how live cargo requests and truck capacity will look once
 * Step 2 (cargo requests + truck registration) ships. The shapes deliberately mirror what the database
 * tables will hold, so the UI can switch to real rows without changing.
 *
 * All values are language-neutral codes; labels live in the dictionaries. Free-text that cannot be a code
 * is a `{ en, sw }` pair. Dates are offsets (in days from "today") so the samples never look stale.
 *
 * Visibility: everything on `Load` / `Truck` is PUBLIC (including prices). Company identity, contact
 * details and exact addresses live in `priv`, which is only filled for verified accounts — and, when the
 * data comes from the database, is enforced by row-level security, not just by the UI.
 */

/** Sample listings route every enquiry through Encore, so no invented phone numbers or emails are ever shown. */
export const SAMPLE_CONTACT = { name: "Encore Marketplace Desk", phone: "+255 744 889 900", email: "info@encoreholdings.africa" } as const;

export interface Contact { name: string; phone: string; email: string }

export type Country = "TZ" | "ZM" | "CD" | "KE" | "UG" | "RW" | "BI" | "MW";
export type Corridor = "tz-zm" | "tz-cd" | "tz-mw" | "tz-rw-bi" | "northern" | "tz-ke" | "domestic";
export type VehicleType = "flatbed" | "curtainside" | "container" | "tipper" | "fuel_tanker" | "chem_tanker" | "reefer" | "box" | "lowbed" | "bulk";
export type CargoType = "general" | "agri_inputs" | "food" | "construction" | "minerals" | "chemicals" | "fuel" | "steel" | "machinery" | "pharma" | "fmcg" | "heavy";
export type Packaging = "bagged" | "palletised" | "containerised" | "bulk" | "liquid" | "coils" | "oversize" | "loose";
export type Feature =
  | "gps" | "tarpaulin" | "twistlocks" | "escort" | "hazmat" | "temp_log" | "insurance"
  | "vetted_driver" | "pod_photos" | "comesa" | "permits" | "reefer_unit";
export type DocType = "commercial_invoice" | "packing_list" | "bill_of_lading" | "t1" | "coo" | "sds" | "phyto";
export type Sector = "agri" | "manufacturing" | "mining" | "construction" | "retail" | "energy" | "pharma" | "trading";
/** Who is looking: guests and registered (not yet verified) accounts see public data; verified accounts see everything. */
export type Tier = "guest" | "registered" | "verified";
export type Bi = { en: string; sw: string };
/** Allowed values, in display order (the form drop-downs and the server-side validation share these). */
export const COUNTRY_LIST: Country[] = ["TZ", "ZM", "CD", "KE", "UG", "RW", "BI", "MW"];
export const CORRIDOR_LIST: Corridor[] = ["tz-zm", "tz-cd", "tz-mw", "tz-rw-bi", "northern", "tz-ke", "domestic"];
export const VEHICLE_LIST: VehicleType[] = ["flatbed", "curtainside", "container", "tipper", "fuel_tanker", "chem_tanker", "reefer", "box", "lowbed", "bulk"];
export const CARGO_TYPE_LIST: CargoType[] = ["general", "agri_inputs", "food", "construction", "minerals", "chemicals", "fuel", "steel", "machinery", "pharma", "fmcg", "heavy"];
export const PACKAGING_LIST: Packaging[] = ["bagged", "palletised", "containerised", "bulk", "liquid", "coils", "oversize", "loose"];
export const FEATURE_LIST: Feature[] = ["gps", "tarpaulin", "twistlocks", "escort", "hazmat", "temp_log", "insurance", "vetted_driver", "pod_photos", "comesa", "permits", "reefer_unit"];
export const DOC_LIST: DocType[] = ["commercial_invoice", "packing_list", "bill_of_lading", "t1", "coo", "sds", "phyto"];
export const SECTOR_LIST: Sector[] = ["agri", "manufacturing", "mining", "construction", "retail", "energy", "pharma", "trading"];
export const TRUCK_DOC_LIST = ["registration_card", "insurance", "transit_permit", "comesa_yellow_card", "inspection", "tank_certificate", "hazmat_certificate", "other"] as const;
export type TruckDocType = (typeof TRUCK_DOC_LIST)[number];

export type Place = { city: string; cc: Country };

export interface Load {
  kind: "load";
  ref: string;
  corridor: Corridor;
  origin: Place;
  destination: Place;
  km: number;
  transit: [number, number];
  borders: string[];
  commodity: Bi;
  cargoType: CargoType;
  packaging: Packaging;
  weightT: number;
  volumeCbm?: number;
  /** Largest single piece, metres (L × W × H) — for project / oversize cargo. */
  piece?: string;
  truckType: VehicleType;
  trucks: number;
  pickup: [number, number];
  deliveryBy: number;
  /** Indicative budget per truck, USD. `null` = the owner prefers to receive quotes. */
  budget: [number, number] | null;
  temp?: [number, number];
  hazmat?: string;
  reqs: Feature[];
  docs: DocType[];
  note?: Bi;
  urgent?: boolean;
  postedHoursAgo: number;
  sector: Sector;
  /** Verified accounts only. */
  priv?: { company: string; contact: Contact; pickupAddress: string; deliveryAddress: string };
  isSample?: boolean;
}

export interface Truck {
  kind: "truck";
  ref: string;
  type: VehicleType;
  make: string;
  year: number;
  axles: string;
  payloadT: number;
  /** Body length × width (m), or tank / container capacity. */
  body: string;
  location: Place;
  /** Days until available; 0 = now. */
  availIn: number;
  routes: Corridor[];
  features: Feature[];
  /** Indicative rate, USD per km (loaded). `null` = not stated. */
  rate: [number, number] | null;
  postedHoursAgo: number;
  /** Verified accounts only. */
  priv?: { company: string; contact: Contact; baseAddress: string };
  isSample?: boolean;
}

export type Listing = Load | Truck;

const p = (city: string, cc: Country): Place => ({ city, cc });

/* ------------------------------------------------------------------ LOADS */
export const LOADS: Load[] = [
  {
    kind: "load", ref: "EN-L-2041", corridor: "tz-zm", origin: p("Dar es Salaam", "TZ"), destination: p("Lusaka", "ZM"), km: 1980, transit: [6, 8], borders: ["Tunduma / Nakonde"],
    commodity: { en: "NPK fertiliser, 50 kg bags", sw: "Mbolea ya NPK, mifuko ya kilo 50" }, cargoType: "agri_inputs", packaging: "bagged", weightT: 68, volumeCbm: 120,
    truckType: "curtainside", trucks: 2, pickup: [2, 5], deliveryBy: 14, budget: [3800, 4300],
    reqs: ["tarpaulin", "gps", "insurance", "pod_photos"], docs: ["commercial_invoice", "packing_list", "bill_of_lading", "t1"],
    note: { en: "Keep dry. Loading at the port-side warehouse, offloading at the buyer's depot in Lusaka.", sw: "Ihifadhiwe mbali na maji. Kupakia ghala la bandarini, kushusha ghala la mnunuzi Lusaka." },
    postedHoursAgo: 5, sector: "agri",
  },
  {
    kind: "load", ref: "EN-L-2042", corridor: "tz-cd", origin: p("Dar es Salaam", "TZ"), destination: p("Lubumbashi", "CD"), km: 2750, transit: [9, 12], borders: ["Tunduma / Nakonde", "Kasumbalesa"],
    commodity: { en: "Sulphuric acid in ISO tank", sw: "Asidi ya salfuriki kwenye tanki la ISO" }, cargoType: "chemicals", packaging: "liquid", weightT: 26,
    truckType: "container", trucks: 1, pickup: [3, 6], deliveryBy: 18, budget: [6600, 7400], hazmat: "UN 1830 · Class 8",
    reqs: ["hazmat", "gps", "permits", "insurance", "vetted_driver", "escort"], docs: ["commercial_invoice", "packing_list", "bill_of_lading", "sds", "t1"],
    note: { en: "Hazardous cargo. Driver must hold a valid hazmat certificate and carry a spill kit.", sw: "Mzigo hatari. Dereva awe na cheti halali cha hazmat na vifaa vya kudhibiti kumwagika." },
    urgent: true, postedHoursAgo: 2, sector: "mining",
  },
  {
    kind: "load", ref: "EN-L-2043", corridor: "tz-zm", origin: p("Dar es Salaam", "TZ"), destination: p("Ndola", "ZM"), km: 1870, transit: [6, 8], borders: ["Tunduma / Nakonde"],
    commodity: { en: "Packaging machinery, 3 × 40 ft containers", sw: "Mashine za vifungashio, makontena 3 ya futi 40" }, cargoType: "machinery", packaging: "containerised", weightT: 66, volumeCbm: 180,
    truckType: "container", trucks: 3, pickup: [4, 8], deliveryBy: 16, budget: [3500, 4000],
    reqs: ["twistlocks", "gps", "insurance", "pod_photos"], docs: ["commercial_invoice", "packing_list", "bill_of_lading", "t1"],
    postedHoursAgo: 9, sector: "manufacturing",
  },
  {
    kind: "load", ref: "EN-L-2044", corridor: "tz-cd", origin: p("Dar es Salaam", "TZ"), destination: p("Kolwezi", "CD"), km: 3000, transit: [11, 14], borders: ["Tunduma / Nakonde", "Kasumbalesa"],
    commodity: { en: "Mining excavator (single piece)", sw: "Mashine ya kuchimba madini (kipande kimoja)" }, cargoType: "heavy", packaging: "oversize", weightT: 38, piece: "9.8 × 3.4 × 3.6",
    truckType: "lowbed", trucks: 1, pickup: [7, 12], deliveryBy: 24, budget: [9800, 11500],
    reqs: ["escort", "permits", "gps", "insurance", "vetted_driver"], docs: ["commercial_invoice", "packing_list", "bill_of_lading", "t1"],
    note: { en: "Abnormal load — route survey and escort permits required in all three countries.", sw: "Mzigo usio wa kawaida — upimaji wa njia na vibali vya msindikizo vinahitajika nchi zote tatu." },
    postedHoursAgo: 26, sector: "mining",
  },
  {
    kind: "load", ref: "EN-L-2045", corridor: "northern", origin: p("Mombasa", "KE"), destination: p("Kampala", "UG"), km: 1170, transit: [4, 5], borders: ["Malaba"],
    commodity: { en: "Hot-rolled steel coils", sw: "Koili za chuma (hot-rolled)" }, cargoType: "steel", packaging: "coils", weightT: 30,
    truckType: "flatbed", trucks: 1, pickup: [1, 3], deliveryBy: 8, budget: [2300, 2700],
    reqs: ["gps", "insurance", "pod_photos"], docs: ["commercial_invoice", "packing_list", "bill_of_lading"],
    note: { en: "Coil cradles and chains to be supplied by the transporter.", sw: "Msafirishaji atoe vishikio vya koili na minyororo." },
    postedHoursAgo: 4, sector: "construction",
  },
  {
    kind: "load", ref: "EN-L-2046", corridor: "northern", origin: p("Mombasa", "KE"), destination: p("Kigali", "RW"), km: 1740, transit: [6, 8], borders: ["Malaba", "Katuna"],
    commodity: { en: "Parboiled rice, 25 kg bags (1 × 40 ft)", sw: "Mchele, mifuko ya kilo 25 (kontena 1 ya futi 40)" }, cargoType: "food", packaging: "containerised", weightT: 27, volumeCbm: 66,
    truckType: "container", trucks: 1, pickup: [3, 6], deliveryBy: 13, budget: [3200, 3700],
    reqs: ["twistlocks", "gps", "insurance"], docs: ["commercial_invoice", "packing_list", "bill_of_lading", "coo", "phyto"],
    postedHoursAgo: 12, sector: "trading",
  },
  {
    kind: "load", ref: "EN-L-2047", corridor: "tz-rw-bi", origin: p("Dar es Salaam", "TZ"), destination: p("Kigali", "RW"), km: 1500, transit: [5, 7], borders: ["Rusumo"],
    commodity: { en: "Automotive diesel (AGO), 36,000 litres", sw: "Dizeli (AGO), lita 36,000" }, cargoType: "fuel", packaging: "liquid", weightT: 30,
    truckType: "fuel_tanker", trucks: 1, pickup: [2, 4], deliveryBy: 9, budget: [3100, 3600], hazmat: "UN 1202 · Class 3",
    reqs: ["hazmat", "gps", "insurance", "vetted_driver", "temp_log"], docs: ["commercial_invoice", "bill_of_lading", "sds"],
    note: { en: "Compartmentalised tanker (4 × 9,000 L) preferred. Calibration certificate required.", sw: "Tanki lenye vyumba 4 (lita 9,000 kila kimoja) linapendelewa. Cheti cha kalibresheni kinahitajika." },
    postedHoursAgo: 7, sector: "energy",
  },
  {
    kind: "load", ref: "EN-L-2048", corridor: "tz-mw", origin: p("Dar es Salaam", "TZ"), destination: p("Lilongwe", "MW"), km: 1750, transit: [6, 8], borders: ["Songwe / Mwanza (Malawi)"],
    commodity: { en: "Wheat flour, 50 kg bags", sw: "Unga wa ngano, mifuko ya kilo 50" }, cargoType: "food", packaging: "bagged", weightT: 34,
    truckType: "curtainside", trucks: 1, pickup: [3, 6], deliveryBy: 13, budget: [3000, 3500],
    reqs: ["tarpaulin", "gps", "pod_photos", "insurance"], docs: ["commercial_invoice", "packing_list", "bill_of_lading", "coo", "phyto"],
    postedHoursAgo: 18, sector: "agri",
  },
  {
    kind: "load", ref: "EN-L-2049", corridor: "tz-mw", origin: p("Dar es Salaam", "TZ"), destination: p("Blantyre", "MW"), km: 2050, transit: [7, 9], borders: ["Songwe / Mwanza (Malawi)"],
    commodity: { en: "Vaccines and pharmaceuticals, 14 pallets", sw: "Chanjo na dawa, pallet 14" }, cargoType: "pharma", packaging: "palletised", weightT: 9, volumeCbm: 32,
    truckType: "reefer", trucks: 1, pickup: [1, 2], deliveryBy: 8, budget: [4600, 5300], temp: [2, 8],
    reqs: ["reefer_unit", "temp_log", "gps", "vetted_driver", "insurance"], docs: ["commercial_invoice", "packing_list", "bill_of_lading", "coo"],
    note: { en: "Cold chain 2–8 °C. Continuous temperature log must be shared at delivery.", sw: "Mnyororo baridi 2–8 °C. Rekodi ya joto ya muda wote itolewe wakati wa kukabidhi." },
    urgent: true, postedHoursAgo: 1, sector: "pharma",
  },
  {
    kind: "load", ref: "EN-L-2050", corridor: "tz-zm", origin: p("Mbeya", "TZ"), destination: p("Lusaka", "ZM"), km: 1200, transit: [4, 6], borders: ["Tunduma / Nakonde"],
    commodity: { en: "White maize grain (bulk)", sw: "Mahindi meupe (kwa wingi)" }, cargoType: "food", packaging: "bulk", weightT: 32,
    truckType: "bulk", trucks: 1, pickup: [5, 9], deliveryBy: 15, budget: [2200, 2600],
    reqs: ["tarpaulin", "gps", "pod_photos"], docs: ["commercial_invoice", "packing_list", "coo", "phyto"],
    postedHoursAgo: 30, sector: "agri",
  },
  {
    kind: "load", ref: "EN-L-2051", corridor: "tz-cd", origin: p("Dar es Salaam", "TZ"), destination: p("Lubumbashi", "CD"), km: 2750, transit: [9, 12], borders: ["Tunduma / Nakonde", "Kasumbalesa"],
    commodity: { en: "Packaged consumer goods (palletised)", sw: "Bidhaa za matumizi ya nyumbani (pallet)" }, cargoType: "fmcg", packaging: "palletised", weightT: 52, volumeCbm: 150,
    truckType: "box", trucks: 2, pickup: [4, 8], deliveryBy: 19, budget: [6200, 7000],
    reqs: ["gps", "permits", "insurance", "vetted_driver", "pod_photos"], docs: ["commercial_invoice", "packing_list", "bill_of_lading", "t1"],
    postedHoursAgo: 14, sector: "retail",
  },
  {
    kind: "load", ref: "EN-L-2052", corridor: "tz-rw-bi", origin: p("Dar es Salaam", "TZ"), destination: p("Bujumbura", "BI"), km: 1650, transit: [6, 8], borders: ["Rusumo", "Kanyaru"],
    commodity: { en: "Portland cement, 50 kg bags", sw: "Saruji, mifuko ya kilo 50" }, cargoType: "construction", packaging: "bagged", weightT: 60, volumeCbm: 100,
    truckType: "curtainside", trucks: 2, pickup: [3, 7], deliveryBy: 14, budget: [3300, 3800],
    reqs: ["tarpaulin", "gps", "pod_photos"], docs: ["commercial_invoice", "packing_list", "bill_of_lading"],
    postedHoursAgo: 22, sector: "construction",
  },
  {
    kind: "load", ref: "EN-L-2053", corridor: "tz-cd", origin: p("Lubumbashi", "CD"), destination: p("Dar es Salaam", "TZ"), km: 2750, transit: [9, 12], borders: ["Kasumbalesa", "Tunduma / Nakonde"],
    commodity: { en: "Copper cathodes, 2 × 20 ft containers", sw: "Shaba (cathodes), makontena 2 ya futi 20" }, cargoType: "minerals", packaging: "containerised", weightT: 50, volumeCbm: 40,
    truckType: "container", trucks: 2, pickup: [2, 5], deliveryBy: 16, budget: [5800, 6600],
    reqs: ["twistlocks", "gps", "escort", "insurance", "vetted_driver", "permits"], docs: ["commercial_invoice", "packing_list", "bill_of_lading", "coo"],
    note: { en: "Return (backhaul) load towards the port — high-value, escorted from Kasumbalesa.", sw: "Mzigo wa kurudi (backhaul) kuelekea bandarini — thamani kubwa, msindikizo kuanzia Kasumbalesa." },
    postedHoursAgo: 11, sector: "mining",
  },
  {
    kind: "load", ref: "EN-L-2054", corridor: "tz-ke", origin: p("Dar es Salaam", "TZ"), destination: p("Nairobi", "KE"), km: 880, transit: [3, 4], borders: ["Namanga"],
    commodity: { en: "Edible oil in 20 L jerrycans", sw: "Mafuta ya kula, madumu ya lita 20" }, cargoType: "food", packaging: "palletised", weightT: 26, volumeCbm: 70,
    truckType: "box", trucks: 1, pickup: [1, 3], deliveryBy: 7, budget: [1500, 1800],
    reqs: ["gps", "insurance", "pod_photos"], docs: ["commercial_invoice", "packing_list", "coo"],
    postedHoursAgo: 3, sector: "manufacturing",
  },
  {
    kind: "load", ref: "EN-L-2055", corridor: "domestic", origin: p("Dar es Salaam", "TZ"), destination: p("Mwanza", "TZ"), km: 1150, transit: [3, 4], borders: [],
    commodity: { en: "Reinforcement bars (rebar), 12 m lengths", sw: "Nondo za ujenzi, urefu wa mita 12" }, cargoType: "steel", packaging: "loose", weightT: 30, piece: "12 × 0.4 × 0.4",
    truckType: "flatbed", trucks: 1, pickup: [1, 4], deliveryBy: 7, budget: [1600, 1900],
    reqs: ["gps", "pod_photos"], docs: ["commercial_invoice", "packing_list"],
    postedHoursAgo: 8, sector: "construction",
  },
  {
    kind: "load", ref: "EN-L-2056", corridor: "domestic", origin: p("Dar es Salaam", "TZ"), destination: p("Dodoma", "TZ"), km: 450, transit: [1, 2], borders: [],
    commodity: { en: "Crushed aggregate (bulk)", sw: "Kokoto (kwa wingi)" }, cargoType: "construction", packaging: "bulk", weightT: 30,
    truckType: "tipper", trucks: 4, pickup: [0, 2], deliveryBy: 4, budget: [650, 800],
    reqs: ["gps", "pod_photos"], docs: ["packing_list"],
    note: { en: "Daily shuttle: 4 trucks, repeat trips for 10 days.", sw: "Safari za kila siku: malori 4, safari za kurudia kwa siku 10." },
    urgent: true, postedHoursAgo: 2, sector: "construction",
  },
  {
    kind: "load", ref: "EN-L-2057", corridor: "tz-zm", origin: p("Dar es Salaam", "TZ"), destination: p("Lusaka", "ZM"), km: 1980, transit: [6, 8], borders: ["Tunduma / Nakonde"],
    commodity: { en: "Caustic soda (NaOH) pearls, 25 kg bags", sw: "Soda ya kuchoma (NaOH), mifuko ya kilo 25" }, cargoType: "chemicals", packaging: "bagged", weightT: 28,
    truckType: "box", trucks: 1, pickup: [5, 8], deliveryBy: 16, budget: [3900, 4400], hazmat: "UN 1823 · Class 8",
    reqs: ["hazmat", "gps", "permits", "insurance", "vetted_driver"], docs: ["commercial_invoice", "packing_list", "bill_of_lading", "sds", "t1"],
    postedHoursAgo: 40, sector: "mining",
  },
  {
    kind: "load", ref: "EN-L-2058", corridor: "tz-rw-bi", origin: p("Dar es Salaam", "TZ"), destination: p("Kampala", "UG"), km: 1580, transit: [5, 7], borders: ["Mutukula"],
    commodity: { en: "Consumer electronics, 2 × 40 ft containers", sw: "Vifaa vya elektroniki, makontena 2 ya futi 40" }, cargoType: "general", packaging: "containerised", weightT: 44, volumeCbm: 130,
    truckType: "container", trucks: 2, pickup: [3, 6], deliveryBy: 12, budget: [2900, 3400],
    reqs: ["twistlocks", "gps", "insurance", "pod_photos", "vetted_driver"], docs: ["commercial_invoice", "packing_list", "bill_of_lading", "t1", "coo"],
    note: { en: "High-value cargo: no stops outside secured parking.", sw: "Mzigo wa thamani kubwa: usisimame nje ya maegesho salama." },
    postedHoursAgo: 6, sector: "retail",
  },
  {
    kind: "load", ref: "EN-L-2059", corridor: "tz-zm", origin: p("Lusaka", "ZM"), destination: p("Dar es Salaam", "TZ"), km: 1980, transit: [6, 8], borders: ["Nakonde / Tunduma"],
    commodity: { en: "Soybean meal (bulk)", sw: "Mashudu ya soya (kwa wingi)" }, cargoType: "agri_inputs", packaging: "bulk", weightT: 32,
    truckType: "bulk", trucks: 1, pickup: [2, 5], deliveryBy: 12, budget: [3300, 3800],
    reqs: ["tarpaulin", "gps", "pod_photos", "insurance"], docs: ["commercial_invoice", "packing_list", "coo", "phyto"],
    note: { en: "Return (backhaul) load towards the port.", sw: "Mzigo wa kurudi (backhaul) kuelekea bandarini." },
    postedHoursAgo: 15, sector: "agri",
  },
  {
    kind: "load", ref: "EN-L-2060", corridor: "domestic", origin: p("Dar es Salaam", "TZ"), destination: p("Arusha", "TZ"), km: 640, transit: [2, 3], borders: [],
    commodity: { en: "Bottled beverages, palletised", sw: "Vinywaji vya chupa, pallet" }, cargoType: "fmcg", packaging: "palletised", weightT: 24, volumeCbm: 60,
    truckType: "box", trucks: 1, pickup: [1, 3], deliveryBy: 5, budget: [1100, 1350],
    reqs: ["gps", "pod_photos"], docs: ["commercial_invoice", "packing_list"],
    postedHoursAgo: 10, sector: "manufacturing",
  },
];

/* ----------------------------------------------------------------- TRUCKS */
export const TRUCKS: Truck[] = [
  {
    kind: "truck", ref: "EN-T-1108", type: "flatbed", make: "Scania R450", year: 2022, axles: "6×4 + tri-axle", payloadT: 34, body: "13.6 × 2.5 m",
    location: p("Dar es Salaam", "TZ"), availIn: 0, routes: ["tz-zm", "tz-cd", "tz-mw", "domestic"], features: ["gps", "insurance", "comesa", "permits", "vetted_driver", "pod_photos"], rate: [1.9, 2.3], postedHoursAgo: 3,
  },
  {
    kind: "truck", ref: "EN-T-1109", type: "curtainside", make: "Volvo FH 460", year: 2021, axles: "6×4 + tri-axle", payloadT: 34, body: "13.6 × 2.5 × 2.7 m",
    location: p("Dar es Salaam", "TZ"), availIn: 1, routes: ["tz-zm", "tz-mw", "tz-rw-bi"], features: ["tarpaulin", "gps", "insurance", "comesa", "pod_photos"], rate: [1.8, 2.2], postedHoursAgo: 6,
  },
  {
    kind: "truck", ref: "EN-T-1110", type: "container", make: "Mercedes-Benz Actros 2645", year: 2023, axles: "6×4 + 40 ft skeletal", payloadT: 30, body: "1 × 40 ft or 2 × 20 ft",
    location: p("Dar es Salaam", "TZ"), availIn: 0, routes: ["tz-zm", "tz-cd", "tz-rw-bi"], features: ["twistlocks", "gps", "insurance", "comesa", "permits", "vetted_driver"], rate: [1.8, 2.1], postedHoursAgo: 2,
  },
  {
    kind: "truck", ref: "EN-T-1111", type: "fuel_tanker", make: "MAN TGS 33.440", year: 2020, axles: "6×4 + 3-axle tanker", payloadT: 30, body: "36,000 L · 4 compartments",
    location: p("Dar es Salaam", "TZ"), availIn: 2, routes: ["tz-zm", "tz-rw-bi", "tz-cd"], features: ["hazmat", "gps", "insurance", "comesa", "vetted_driver", "permits"], rate: [2.0, 2.5], postedHoursAgo: 10,
  },
  {
    kind: "truck", ref: "EN-T-1112", type: "reefer", make: "Scania R410 + Thermo King", year: 2023, axles: "4×2 + 2-axle reefer", payloadT: 22, body: "13.4 × 2.5 m · −25 °C to +25 °C",
    location: p("Dar es Salaam", "TZ"), availIn: 1, routes: ["tz-mw", "tz-zm", "tz-ke"], features: ["reefer_unit", "temp_log", "gps", "insurance", "vetted_driver", "comesa"], rate: [2.3, 2.8], postedHoursAgo: 5,
  },
  {
    kind: "truck", ref: "EN-T-1113", type: "tipper", make: "Sinotruk Howo A7", year: 2022, axles: "8×4", payloadT: 32, body: "18 m³ body",
    location: p("Dodoma", "TZ"), availIn: 0, routes: ["domestic"], features: ["gps", "pod_photos"], rate: [1.2, 1.5], postedHoursAgo: 4,
  },
  {
    kind: "truck", ref: "EN-T-1114", type: "lowbed", make: "Volvo FH16 750", year: 2021, axles: "6×4 + 4-axle lowbed", payloadT: 60, body: "13 × 3 m · deck height 0.9 m",
    location: p("Lusaka", "ZM"), availIn: 3, routes: ["tz-zm", "tz-cd"], features: ["escort", "permits", "gps", "insurance", "comesa", "vetted_driver"], rate: [3.2, 4.0], postedHoursAgo: 20,
  },
  {
    kind: "truck", ref: "EN-T-1115", type: "box", make: "Shacman X3000", year: 2023, axles: "6×4", payloadT: 28, body: "9.6 × 2.5 × 2.6 m",
    location: p("Dar es Salaam", "TZ"), availIn: 0, routes: ["tz-cd", "tz-zm", "tz-ke"], features: ["gps", "insurance", "permits", "pod_photos", "vetted_driver"], rate: [1.7, 2.0], postedHoursAgo: 7,
  },
  {
    kind: "truck", ref: "EN-T-1116", type: "bulk", make: "Iveco Stralis 480", year: 2019, axles: "6×4 + tri-axle grain trailer", payloadT: 33, body: "45 m³ · tarpaulin cover",
    location: p("Mbeya", "TZ"), availIn: 2, routes: ["tz-zm", "tz-mw", "domestic"], features: ["tarpaulin", "gps", "comesa", "pod_photos"], rate: [1.6, 1.9], postedHoursAgo: 15,
  },
  {
    kind: "truck", ref: "EN-T-1117", type: "container", make: "DAF XF 480", year: 2022, axles: "6×4 + 40 ft skeletal", payloadT: 30, body: "1 × 40 ft or 2 × 20 ft",
    location: p("Mombasa", "KE"), availIn: 0, routes: ["northern", "tz-ke"], features: ["twistlocks", "gps", "insurance", "comesa", "pod_photos"], rate: [1.9, 2.2], postedHoursAgo: 1,
  },
  {
    kind: "truck", ref: "EN-T-1118", type: "flatbed", make: "FAW J6P", year: 2021, axles: "6×4 + tri-axle", payloadT: 32, body: "13 × 2.5 m",
    location: p("Kampala", "UG"), availIn: 1, routes: ["northern", "tz-rw-bi"], features: ["gps", "insurance", "comesa", "pod_photos"], rate: [1.7, 2.0], postedHoursAgo: 9,
  },
  {
    kind: "truck", ref: "EN-T-1119", type: "chem_tanker", make: "Scania G450", year: 2022, axles: "6×4 + stainless tanker", payloadT: 28, body: "30,000 L · stainless steel",
    location: p("Ndola", "ZM"), availIn: 1, routes: ["tz-cd", "tz-zm"], features: ["hazmat", "gps", "permits", "insurance", "comesa", "vetted_driver", "escort"], rate: [2.6, 3.2], postedHoursAgo: 12,
  },
  {
    kind: "truck", ref: "EN-T-1120", type: "curtainside", make: "Mercedes-Benz Actros 2545", year: 2020, axles: "6×2 + tri-axle", payloadT: 33, body: "13.6 × 2.5 × 2.7 m",
    location: p("Lilongwe", "MW"), availIn: 4, routes: ["tz-mw", "tz-zm"], features: ["tarpaulin", "gps", "insurance", "comesa", "pod_photos"], rate: [1.7, 2.0], postedHoursAgo: 28,
  },
  {
    kind: "truck", ref: "EN-T-1121", type: "tipper", make: "Shacman F3000", year: 2023, axles: "8×4", payloadT: 35, body: "20 m³ body",
    location: p("Dar es Salaam", "TZ"), availIn: 0, routes: ["domestic", "tz-ke"], features: ["gps", "pod_photos", "vetted_driver"], rate: [1.1, 1.4], postedHoursAgo: 2,
  },
  {
    kind: "truck", ref: "EN-T-1122", type: "flatbed", make: "Volvo FH 540", year: 2022, axles: "6×4 + tri-axle", payloadT: 34, body: "13.6 × 2.5 m",
    location: p("Lubumbashi", "CD"), availIn: 2, routes: ["tz-cd", "tz-zm"], features: ["gps", "insurance", "comesa", "permits", "vetted_driver"], rate: [2.0, 2.4], postedHoursAgo: 8,
  },
  {
    kind: "truck", ref: "EN-T-1123", type: "curtainside", make: "MAN TGX 26.440", year: 2022, axles: "6×2 + tri-axle", payloadT: 33, body: "13.6 × 2.5 × 2.7 m",
    location: p("Kigali", "RW"), availIn: 0, routes: ["northern", "tz-rw-bi"], features: ["tarpaulin", "gps", "insurance", "comesa", "pod_photos"], rate: [1.8, 2.2], postedHoursAgo: 5,
  },
  {
    kind: "truck", ref: "EN-T-1124", type: "container", make: "Scania R500", year: 2023, axles: "6×4 + 40 ft skeletal", payloadT: 30, body: "1 × 40 ft or 2 × 20 ft",
    location: p("Nairobi", "KE"), availIn: 1, routes: ["northern", "tz-ke"], features: ["twistlocks", "gps", "insurance", "comesa", "permits"], rate: [1.9, 2.3], postedHoursAgo: 11,
  },
  {
    kind: "truck", ref: "EN-T-1125", type: "tipper", make: "Sinotruk Howo T7H", year: 2023, axles: "8×4", payloadT: 35, body: "22 m³ body",
    location: p("Mwanza", "TZ"), availIn: 0, routes: ["domestic"], features: ["gps", "pod_photos"], rate: [1.1, 1.4], postedHoursAgo: 6,
  },
  {
    kind: "truck", ref: "EN-T-1126", type: "fuel_tanker", make: "Volvo FM 440", year: 2021, axles: "6×4 + 3-axle tanker", payloadT: 32, body: "40,000 L · 5 compartments",
    location: p("Mombasa", "KE"), availIn: 1, routes: ["northern", "tz-ke"], features: ["hazmat", "gps", "insurance", "comesa", "vetted_driver"], rate: [2.1, 2.6], postedHoursAgo: 14,
  },
  {
    kind: "truck", ref: "EN-T-1127", type: "reefer", make: "Mercedes-Benz Actros 1845 + Carrier", year: 2022, axles: "4×2 + 2-axle reefer", payloadT: 24, body: "13.4 × 2.5 m · −25 °C to +25 °C",
    location: p("Arusha", "TZ"), availIn: 2, routes: ["domestic", "tz-ke"], features: ["reefer_unit", "temp_log", "gps", "insurance", "vetted_driver"], rate: [2.2, 2.7], postedHoursAgo: 9,
  },
  {
    kind: "truck", ref: "EN-T-1128", type: "box", make: "Isuzu FVR", year: 2021, axles: "6×2", payloadT: 12, body: "7.2 × 2.4 × 2.4 m",
    location: p("Dar es Salaam", "TZ"), availIn: 0, routes: ["domestic", "tz-ke"], features: ["gps", "pod_photos"], rate: [1.0, 1.3], postedHoursAgo: 3,
  },
  {
    kind: "truck", ref: "EN-T-1129", type: "lowbed", make: "Mercedes-Benz Arocs 4150", year: 2020, axles: "8×4 + 4-axle lowbed", payloadT: 55, body: "12 × 3 m · deck height 0.95 m",
    location: p("Dar es Salaam", "TZ"), availIn: 2, routes: ["tz-cd", "tz-zm", "domestic"], features: ["escort", "permits", "gps", "insurance", "comesa", "vetted_driver"], rate: [3.1, 3.8], postedHoursAgo: 18,
  },
  {
    kind: "truck", ref: "EN-T-1130", type: "bulk", make: "Scania R450 + walking-floor trailer", year: 2021, axles: "6×4 + tri-axle", payloadT: 32, body: "50 m³ · tarpaulin cover",
    location: p("Kitwe", "ZM"), availIn: 1, routes: ["tz-zm", "tz-cd"], features: ["tarpaulin", "gps", "comesa", "pod_photos"], rate: [1.6, 1.9], postedHoursAgo: 20,
  },
  {
    kind: "truck", ref: "EN-T-1131", type: "flatbed", make: "Isuzu GXZ 360", year: 2020, axles: "6×4", payloadT: 25, body: "10.5 × 2.5 m",
    location: p("Iringa", "TZ"), availIn: 0, routes: ["domestic", "tz-zm"], features: ["gps", "pod_photos"], rate: [1.3, 1.6], postedHoursAgo: 12,
  },
  {
    kind: "truck", ref: "EN-T-1132", type: "container", make: "Sinotruk Howo A7", year: 2022, axles: "6×4 + 20/40 ft skeletal", payloadT: 28, body: "1 × 20 ft or 1 × 40 ft",
    location: p("Dar es Salaam", "TZ"), availIn: 1, routes: ["tz-mw", "tz-zm", "tz-rw-bi"], features: ["twistlocks", "gps", "insurance", "comesa"], rate: [1.7, 2.0], postedHoursAgo: 16,
  },
];

/* ------------------------------------------------- Private (verified-only) */
/** [company, pickup address, delivery address] — generic, clearly fictional company names. */
export const LOAD_PRIVATE: Record<string, [string, string, string]> = {
  "EN-L-2041": ["Sample Agro Inputs Ltd", "Port-side warehouse, Kurasini, Dar es Salaam", "Buyer depot, Industrial Area, Lusaka"],
  "EN-L-2042": ["Sample Mining Chemicals Ltd", "Chemical terminal, Kurasini, Dar es Salaam", "Processing plant, Lubumbashi"],
  "EN-L-2043": ["Sample Packaging Industries Ltd", "Container yard, Kurasini, Dar es Salaam", "Factory, Ndola"],
  "EN-L-2044": ["Sample Mining Services Ltd", "Heavy-lift berth, Dar es Salaam Port", "Mine site, Kolwezi"],
  "EN-L-2045": ["Sample Steel Distributors Ltd", "Steel yard, Changamwe, Mombasa", "Warehouse, Namanve, Kampala"],
  "EN-L-2046": ["Sample Foods Trading Ltd", "Container freight station, Mombasa", "Warehouse, Gikondo, Kigali"],
  "EN-L-2047": ["Sample Fuel Distributors Ltd", "Fuel depot, Kigamboni, Dar es Salaam", "Depot, Kigali"],
  "EN-L-2048": ["Sample Flour Millers Ltd", "Mill, Pugu Road, Dar es Salaam", "Distribution centre, Lilongwe"],
  "EN-L-2049": ["Sample Health Supplies Ltd", "Cold store, Mikocheni, Dar es Salaam", "Central medical store, Blantyre"],
  "EN-L-2050": ["Sample Grain Traders Ltd", "Grain store, Mbeya", "Silo, Lusaka"],
  "EN-L-2051": ["Sample Consumer Brands Ltd", "Distribution centre, Mabibo, Dar es Salaam", "Warehouse, Lubumbashi"],
  "EN-L-2052": ["Sample Cement Traders Ltd", "Cement plant, Mtwara Road, Dar es Salaam", "Depot, Bujumbura"],
  "EN-L-2053": ["Sample Metals Export Ltd", "Smelter yard, Lubumbashi", "Port container terminal, Dar es Salaam"],
  "EN-L-2054": ["Sample Edible Oils Ltd", "Refinery, Chang'ombe, Dar es Salaam", "Distribution centre, Nairobi"],
  "EN-L-2055": ["Sample Building Supplies Ltd", "Steel mill, Pugu, Dar es Salaam", "Construction site, Mwanza"],
  "EN-L-2056": ["Sample Aggregates Ltd", "Quarry, Pugu, Dar es Salaam", "Road site, Dodoma"],
  "EN-L-2057": ["Sample Industrial Chemicals Ltd", "Chemical store, Kurasini, Dar es Salaam", "Plant, Lusaka"],
  "EN-L-2058": ["Sample Electronics Distributors Ltd", "Container depot, Kurasini, Dar es Salaam", "Industrial Area, Kampala"],
  "EN-L-2059": ["Sample Oilseed Processors Ltd", "Processing plant, Lusaka", "Feed mill, Dar es Salaam"],
  "EN-L-2060": ["Sample Beverage Makers Ltd", "Bottling plant, Dar es Salaam", "Distribution centre, Arusha"],
};

/** [company, base address] — generic, clearly fictional company names. */
export const TRUCK_PRIVATE: Record<string, [string, string]> = {
  "EN-T-1108": ["Sample Coastal Haulage Ltd", "Depot, Kurasini, Dar es Salaam"],
  "EN-T-1109": ["Sample Southern Freight Ltd", "Depot, Mbagala, Dar es Salaam"],
  "EN-T-1110": ["Sample Port Logistics Ltd", "Container yard, Kurasini, Dar es Salaam"],
  "EN-T-1111": ["Sample Fuel Haulage Ltd", "Tanker park, Kigamboni, Dar es Salaam"],
  "EN-T-1112": ["Sample Cold Chain Transport Ltd", "Cold depot, Mikocheni, Dar es Salaam"],
  "EN-T-1113": ["Sample Earthworks Transport Ltd", "Yard, Dodoma"],
  "EN-T-1114": ["Sample Heavy Haulage Ltd", "Depot, Industrial Area, Lusaka"],
  "EN-T-1115": ["Sample Cargo Express Ltd", "Depot, Gongo la Mboto, Dar es Salaam"],
  "EN-T-1116": ["Sample Highlands Transport Ltd", "Yard, Mbeya"],
  "EN-T-1117": ["Sample Northern Corridor Haulage Ltd", "Truck park, Changamwe, Mombasa"],
  "EN-T-1118": ["Sample Pearl Freight Ltd", "Depot, Namanve, Kampala"],
  "EN-T-1119": ["Sample Copperbelt Tankers Ltd", "Tanker yard, Ndola"],
  "EN-T-1120": ["Sample Lakeshore Transport Ltd", "Depot, Lilongwe"],
  "EN-T-1121": ["Sample Quarry Haulage Ltd", "Yard, Pugu, Dar es Salaam"],
  "EN-T-1122": ["Sample Katanga Haulage Ltd", "Industrial zone, Lubumbashi"],
  "EN-T-1123": ["Sample Hills Logistics Ltd", "Depot, Masoro, Kigali"],
  "EN-T-1124": ["Sample Savannah Freight Ltd", "Depot, Embakasi, Nairobi"],
  "EN-T-1125": ["Sample Lake Zone Tippers Ltd", "Yard, Mwanza"],
  "EN-T-1126": ["Sample Coastal Fuel Haulage Ltd", "Tanker park, Mombasa"],
  "EN-T-1127": ["Sample Northern Cold Chain Ltd", "Cold depot, Arusha"],
  "EN-T-1128": ["Sample City Distribution Ltd", "Depot, Vingunguti, Dar es Salaam"],
  "EN-T-1129": ["Sample Project Cargo Ltd", "Heavy-haulage yard, Dar es Salaam"],
  "EN-T-1130": ["Sample Copperbelt Bulk Ltd", "Yard, Kitwe"],
  "EN-T-1131": ["Sample Southern Highlands Transport Ltd", "Yard, Iringa"],
  "EN-T-1132": ["Sample Eastern Freight Ltd", "Container yard, Dar es Salaam"],
};

/** Attach private details (verified accounts only). */
export function withPrivate(l: Listing): Listing {
  if (l.kind === "load") {
    const x = LOAD_PRIVATE[l.ref];
    return x ? { ...l, priv: { company: x[0], contact: SAMPLE_CONTACT, pickupAddress: x[1], deliveryAddress: x[2] } } : l;
  }
  const x = TRUCK_PRIVATE[l.ref];
  return x ? { ...l, priv: { company: x[0], contact: SAMPLE_CONTACT, baseAddress: x[1] } } : l;
}

/** Remove private details (everyone except verified accounts). */
export function stripPrivate(l: Listing): Listing {
  const { priv: _drop, ...rest } = l;
  return rest as Listing;
}

/** The built-in sample listings, as seen by a given tier. Used as the fallback when the database is unreachable. */
export function sampleListings(tier: Tier): Listing[] {
  const all: Listing[] = [...LOADS, ...TRUCKS].map((l) => ({ ...l, isSample: true }));
  const shaped = tier === "verified" ? all.map(withPrivate) : all;
  return shaped.sort((a, b) => a.postedHoursAgo - b.postedHoursAgo);
}

/* ---------------------------------------------------------------- helpers */
export const perTruckT = (l: Load) => Math.round((l.weightT / l.trucks) * 10) / 10;

/** A truck can serve a load when type matches, it can carry the per-truck weight, and it works the corridor. */
export function truckFitsLoad(t: Truck, l: Load): boolean {
  return t.type === l.truckType && t.payloadT >= perTruckT(l) && t.routes.includes(l.corridor);
}

/** What a truck is missing (features the load requires but the truck does not list) — shown as a hint, not a block. */
export function missingFeatures(t: Truck, l: Load): Feature[] {
  return l.reqs.filter((r) => !t.features.includes(r));
}

export const matchingTrucks = (l: Load, all: Listing[]) => all.filter((x): x is Truck => x.kind === "truck" && truckFitsLoad(x, l));
export const matchingLoads = (t: Truck, all: Listing[]) => all.filter((x): x is Load => x.kind === "load" && truckFitsLoad(t, x));

/** Resolve a day offset to an ISO date (UTC, date only). */
export function isoDay(base: number, offset: number): string {
  return new Date(base + offset * 86_400_000).toISOString().slice(0, 10);
}
