/**
 * Marketplace SAMPLE data.
 *
 * Everything here is illustrative: it shows how live cargo requests and truck capacity will look once
 * Step 2 (cargo requests + truck registration) ships. The shapes deliberately mirror what the database
 * tables will hold, so the UI can switch to real rows without changing.
 *
 * All values are language-neutral codes; labels live in the dictionaries. Free-text that cannot be a code
 * is a `{ en, sw }` pair. Dates are offsets (in days from "today") so the samples never look stale.
 */

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
export type Verification = "verified" | "under_review" | "registered";
export type Bi = { en: string; sw: string };
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
  /** Indicative budget per truck, USD. */
  budget: [number, number];
  temp?: [number, number];
  hazmat?: string;
  reqs: Feature[];
  docs: DocType[];
  note?: Bi;
  urgent?: boolean;
  postedHoursAgo: number;
  quotes: number;
  owner: { sector: Sector; city: string; cc: Country; verification: Verification; since: number; shipments: number };
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
  /** Indicative rate, USD per km (loaded). */
  rate: [number, number];
  postedHoursAgo: number;
  transporter: { ref: string; fleet: number; years: number; rating: number; trips: number; replyHours: number; verification: Verification; city: string; cc: Country };
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
    postedHoursAgo: 5, quotes: 3, owner: { sector: "agri", city: "Dar es Salaam", cc: "TZ", verification: "verified", since: 2024, shipments: 41 },
  },
  {
    kind: "load", ref: "EN-L-2042", corridor: "tz-cd", origin: p("Dar es Salaam", "TZ"), destination: p("Lubumbashi", "CD"), km: 2750, transit: [9, 12], borders: ["Tunduma / Nakonde", "Kasumbalesa"],
    commodity: { en: "Sulphuric acid in ISO tank", sw: "Asidi ya salfuriki kwenye tanki la ISO" }, cargoType: "chemicals", packaging: "liquid", weightT: 26,
    truckType: "container", trucks: 1, pickup: [3, 6], deliveryBy: 18, budget: [6600, 7400], hazmat: "UN 1830 · Class 8",
    reqs: ["hazmat", "gps", "permits", "insurance", "vetted_driver", "escort"], docs: ["commercial_invoice", "packing_list", "bill_of_lading", "sds", "t1"],
    note: { en: "Hazardous cargo. Driver must hold a valid hazmat certificate and carry a spill kit.", sw: "Mzigo hatari. Dereva awe na cheti halali cha hazmat na vifaa vya kudhibiti kumwagika." },
    urgent: true, postedHoursAgo: 2, quotes: 1, owner: { sector: "mining", city: "Dar es Salaam", cc: "TZ", verification: "verified", since: 2025, shipments: 17 },
  },
  {
    kind: "load", ref: "EN-L-2043", corridor: "tz-zm", origin: p("Dar es Salaam", "TZ"), destination: p("Ndola", "ZM"), km: 1870, transit: [6, 8], borders: ["Tunduma / Nakonde"],
    commodity: { en: "Packaging machinery, 3 × 40 ft containers", sw: "Mashine za vifungashio, makontena 3 ya futi 40" }, cargoType: "machinery", packaging: "containerised", weightT: 66, volumeCbm: 180,
    truckType: "container", trucks: 3, pickup: [4, 8], deliveryBy: 16, budget: [3500, 4000],
    reqs: ["twistlocks", "gps", "insurance", "pod_photos"], docs: ["commercial_invoice", "packing_list", "bill_of_lading", "t1"],
    postedHoursAgo: 9, quotes: 5, owner: { sector: "manufacturing", city: "Ndola", cc: "ZM", verification: "verified", since: 2024, shipments: 28 },
  },
  {
    kind: "load", ref: "EN-L-2044", corridor: "tz-cd", origin: p("Dar es Salaam", "TZ"), destination: p("Kolwezi", "CD"), km: 3000, transit: [11, 14], borders: ["Tunduma / Nakonde", "Kasumbalesa"],
    commodity: { en: "Mining excavator (single piece)", sw: "Mashine ya kuchimba madini (kipande kimoja)" }, cargoType: "heavy", packaging: "oversize", weightT: 38, piece: "9.8 × 3.4 × 3.6",
    truckType: "lowbed", trucks: 1, pickup: [7, 12], deliveryBy: 24, budget: [9800, 11500],
    reqs: ["escort", "permits", "gps", "insurance", "vetted_driver"], docs: ["commercial_invoice", "packing_list", "bill_of_lading", "t1"],
    note: { en: "Abnormal load — route survey and escort permits required in all three countries.", sw: "Mzigo usio wa kawaida — upimaji wa njia na vibali vya msindikizo vinahitajika nchi zote tatu." },
    postedHoursAgo: 26, quotes: 2, owner: { sector: "mining", city: "Kolwezi", cc: "CD", verification: "under_review", since: 2026, shipments: 3 },
  },
  {
    kind: "load", ref: "EN-L-2045", corridor: "northern", origin: p("Mombasa", "KE"), destination: p("Kampala", "UG"), km: 1170, transit: [4, 5], borders: ["Malaba"],
    commodity: { en: "Hot-rolled steel coils", sw: "Koili za chuma (hot-rolled)" }, cargoType: "steel", packaging: "coils", weightT: 30,
    truckType: "flatbed", trucks: 1, pickup: [1, 3], deliveryBy: 8, budget: [2300, 2700],
    reqs: ["gps", "insurance", "pod_photos"], docs: ["commercial_invoice", "packing_list", "bill_of_lading"],
    note: { en: "Coil cradles and chains to be supplied by the transporter.", sw: "Msafirishaji atoe vishikio vya koili na minyororo." },
    postedHoursAgo: 4, quotes: 4, owner: { sector: "construction", city: "Kampala", cc: "UG", verification: "verified", since: 2024, shipments: 36 },
  },
  {
    kind: "load", ref: "EN-L-2046", corridor: "northern", origin: p("Mombasa", "KE"), destination: p("Kigali", "RW"), km: 1740, transit: [6, 8], borders: ["Malaba", "Katuna"],
    commodity: { en: "Parboiled rice, 25 kg bags (1 × 40 ft)", sw: "Mchele, mifuko ya kilo 25 (kontena 1 ya futi 40)" }, cargoType: "food", packaging: "containerised", weightT: 27, volumeCbm: 66,
    truckType: "container", trucks: 1, pickup: [3, 6], deliveryBy: 13, budget: [3200, 3700],
    reqs: ["twistlocks", "gps", "insurance"], docs: ["commercial_invoice", "packing_list", "bill_of_lading", "coo", "phyto"],
    postedHoursAgo: 12, quotes: 2, owner: { sector: "trading", city: "Kigali", cc: "RW", verification: "verified", since: 2025, shipments: 12 },
  },
  {
    kind: "load", ref: "EN-L-2047", corridor: "tz-rw-bi", origin: p("Dar es Salaam", "TZ"), destination: p("Kigali", "RW"), km: 1500, transit: [5, 7], borders: ["Rusumo"],
    commodity: { en: "Automotive diesel (AGO), 36,000 litres", sw: "Dizeli (AGO), lita 36,000" }, cargoType: "fuel", packaging: "liquid", weightT: 30,
    truckType: "fuel_tanker", trucks: 1, pickup: [2, 4], deliveryBy: 9, budget: [3100, 3600], hazmat: "UN 1202 · Class 3",
    reqs: ["hazmat", "gps", "insurance", "vetted_driver", "temp_log"], docs: ["commercial_invoice", "bill_of_lading", "sds"],
    note: { en: "Compartmentalised tanker (4 × 9,000 L) preferred. Calibration certificate required.", sw: "Tanki lenye vyumba 4 (lita 9,000 kila kimoja) linapendelewa. Cheti cha kalibresheni kinahitajika." },
    postedHoursAgo: 7, quotes: 3, owner: { sector: "energy", city: "Kigali", cc: "RW", verification: "verified", since: 2024, shipments: 63 },
  },
  {
    kind: "load", ref: "EN-L-2048", corridor: "tz-mw", origin: p("Dar es Salaam", "TZ"), destination: p("Lilongwe", "MW"), km: 1750, transit: [6, 8], borders: ["Songwe / Mwanza (Malawi)"],
    commodity: { en: "Wheat flour, 50 kg bags", sw: "Unga wa ngano, mifuko ya kilo 50" }, cargoType: "food", packaging: "bagged", weightT: 34,
    truckType: "curtainside", trucks: 1, pickup: [3, 6], deliveryBy: 13, budget: [3000, 3500],
    reqs: ["tarpaulin", "gps", "pod_photos", "insurance"], docs: ["commercial_invoice", "packing_list", "bill_of_lading", "coo", "phyto"],
    postedHoursAgo: 18, quotes: 2, owner: { sector: "agri", city: "Lilongwe", cc: "MW", verification: "verified", since: 2025, shipments: 22 },
  },
  {
    kind: "load", ref: "EN-L-2049", corridor: "tz-mw", origin: p("Dar es Salaam", "TZ"), destination: p("Blantyre", "MW"), km: 2050, transit: [7, 9], borders: ["Songwe / Mwanza (Malawi)"],
    commodity: { en: "Vaccines and pharmaceuticals, 14 pallets", sw: "Chanjo na dawa, pallet 14" }, cargoType: "pharma", packaging: "palletised", weightT: 9, volumeCbm: 32,
    truckType: "reefer", trucks: 1, pickup: [1, 2], deliveryBy: 8, budget: [4600, 5300], temp: [2, 8],
    reqs: ["reefer_unit", "temp_log", "gps", "vetted_driver", "insurance"], docs: ["commercial_invoice", "packing_list", "bill_of_lading", "coo"],
    note: { en: "Cold chain 2–8 °C. Continuous temperature log must be shared at delivery.", sw: "Mnyororo baridi 2–8 °C. Rekodi ya joto ya muda wote itolewe wakati wa kukabidhi." },
    urgent: true, postedHoursAgo: 1, quotes: 1, owner: { sector: "pharma", city: "Blantyre", cc: "MW", verification: "verified", since: 2025, shipments: 19 },
  },
  {
    kind: "load", ref: "EN-L-2050", corridor: "tz-zm", origin: p("Mbeya", "TZ"), destination: p("Lusaka", "ZM"), km: 1200, transit: [4, 6], borders: ["Tunduma / Nakonde"],
    commodity: { en: "White maize grain (bulk)", sw: "Mahindi meupe (kwa wingi)" }, cargoType: "food", packaging: "bulk", weightT: 32,
    truckType: "bulk", trucks: 1, pickup: [5, 9], deliveryBy: 15, budget: [2200, 2600],
    reqs: ["tarpaulin", "gps", "pod_photos"], docs: ["commercial_invoice", "packing_list", "coo", "phyto"],
    postedHoursAgo: 30, quotes: 6, owner: { sector: "agri", city: "Mbeya", cc: "TZ", verification: "registered", since: 2026, shipments: 0 },
  },
  {
    kind: "load", ref: "EN-L-2051", corridor: "tz-cd", origin: p("Dar es Salaam", "TZ"), destination: p("Lubumbashi", "CD"), km: 2750, transit: [9, 12], borders: ["Tunduma / Nakonde", "Kasumbalesa"],
    commodity: { en: "Packaged consumer goods (palletised)", sw: "Bidhaa za matumizi ya nyumbani (pallet)" }, cargoType: "fmcg", packaging: "palletised", weightT: 52, volumeCbm: 150,
    truckType: "box", trucks: 2, pickup: [4, 8], deliveryBy: 19, budget: [6200, 7000],
    reqs: ["gps", "permits", "insurance", "vetted_driver", "pod_photos"], docs: ["commercial_invoice", "packing_list", "bill_of_lading", "t1"],
    postedHoursAgo: 14, quotes: 4, owner: { sector: "retail", city: "Lubumbashi", cc: "CD", verification: "verified", since: 2024, shipments: 34 },
  },
  {
    kind: "load", ref: "EN-L-2052", corridor: "tz-rw-bi", origin: p("Dar es Salaam", "TZ"), destination: p("Bujumbura", "BI"), km: 1650, transit: [6, 8], borders: ["Rusumo", "Kanyaru"],
    commodity: { en: "Portland cement, 50 kg bags", sw: "Saruji, mifuko ya kilo 50" }, cargoType: "construction", packaging: "bagged", weightT: 60, volumeCbm: 100,
    truckType: "curtainside", trucks: 2, pickup: [3, 7], deliveryBy: 14, budget: [3300, 3800],
    reqs: ["tarpaulin", "gps", "pod_photos"], docs: ["commercial_invoice", "packing_list", "bill_of_lading"],
    postedHoursAgo: 22, quotes: 3, owner: { sector: "construction", city: "Bujumbura", cc: "BI", verification: "under_review", since: 2026, shipments: 1 },
  },
  {
    kind: "load", ref: "EN-L-2053", corridor: "tz-cd", origin: p("Lubumbashi", "CD"), destination: p("Dar es Salaam", "TZ"), km: 2750, transit: [9, 12], borders: ["Kasumbalesa", "Tunduma / Nakonde"],
    commodity: { en: "Copper cathodes, 2 × 20 ft containers", sw: "Shaba (cathodes), makontena 2 ya futi 20" }, cargoType: "minerals", packaging: "containerised", weightT: 50, volumeCbm: 40,
    truckType: "container", trucks: 2, pickup: [2, 5], deliveryBy: 16, budget: [5800, 6600],
    reqs: ["twistlocks", "gps", "escort", "insurance", "vetted_driver", "permits"], docs: ["commercial_invoice", "packing_list", "bill_of_lading", "coo"],
    note: { en: "Return (backhaul) load towards the port — high-value, escorted from Kasumbalesa.", sw: "Mzigo wa kurudi (backhaul) kuelekea bandarini — thamani kubwa, msindikizo kuanzia Kasumbalesa." },
    postedHoursAgo: 11, quotes: 5, owner: { sector: "mining", city: "Lubumbashi", cc: "CD", verification: "verified", since: 2024, shipments: 58 },
  },
  {
    kind: "load", ref: "EN-L-2054", corridor: "tz-ke", origin: p("Dar es Salaam", "TZ"), destination: p("Nairobi", "KE"), km: 880, transit: [3, 4], borders: ["Namanga"],
    commodity: { en: "Edible oil in 20 L jerrycans", sw: "Mafuta ya kula, madumu ya lita 20" }, cargoType: "food", packaging: "palletised", weightT: 26, volumeCbm: 70,
    truckType: "box", trucks: 1, pickup: [1, 3], deliveryBy: 7, budget: [1500, 1800],
    reqs: ["gps", "insurance", "pod_photos"], docs: ["commercial_invoice", "packing_list", "coo"],
    postedHoursAgo: 3, quotes: 2, owner: { sector: "manufacturing", city: "Dar es Salaam", cc: "TZ", verification: "verified", since: 2024, shipments: 47 },
  },
  {
    kind: "load", ref: "EN-L-2055", corridor: "domestic", origin: p("Dar es Salaam", "TZ"), destination: p("Mwanza", "TZ"), km: 1150, transit: [3, 4], borders: [],
    commodity: { en: "Reinforcement bars (rebar), 12 m lengths", sw: "Nondo za ujenzi, urefu wa mita 12" }, cargoType: "steel", packaging: "loose", weightT: 30, piece: "12 × 0.4 × 0.4",
    truckType: "flatbed", trucks: 1, pickup: [1, 4], deliveryBy: 7, budget: [1600, 1900],
    reqs: ["gps", "pod_photos"], docs: ["commercial_invoice", "packing_list"],
    postedHoursAgo: 8, quotes: 5, owner: { sector: "construction", city: "Mwanza", cc: "TZ", verification: "verified", since: 2025, shipments: 14 },
  },
  {
    kind: "load", ref: "EN-L-2056", corridor: "domestic", origin: p("Dar es Salaam", "TZ"), destination: p("Dodoma", "TZ"), km: 450, transit: [1, 2], borders: [],
    commodity: { en: "Crushed aggregate (bulk)", sw: "Kokoto (kwa wingi)" }, cargoType: "construction", packaging: "bulk", weightT: 30,
    truckType: "tipper", trucks: 4, pickup: [0, 2], deliveryBy: 4, budget: [650, 800],
    reqs: ["gps", "pod_photos"], docs: ["packing_list"],
    note: { en: "Daily shuttle: 4 trucks, repeat trips for 10 days.", sw: "Safari za kila siku: malori 4, safari za kurudia kwa siku 10." },
    urgent: true, postedHoursAgo: 2, quotes: 7, owner: { sector: "construction", city: "Dodoma", cc: "TZ", verification: "verified", since: 2024, shipments: 112 },
  },
  {
    kind: "load", ref: "EN-L-2057", corridor: "tz-zm", origin: p("Dar es Salaam", "TZ"), destination: p("Lusaka", "ZM"), km: 1980, transit: [6, 8], borders: ["Tunduma / Nakonde"],
    commodity: { en: "Caustic soda (NaOH) pearls, 25 kg bags", sw: "Soda ya kuchoma (NaOH), mifuko ya kilo 25" }, cargoType: "chemicals", packaging: "bagged", weightT: 28,
    truckType: "box", trucks: 1, pickup: [5, 8], deliveryBy: 16, budget: [3900, 4400], hazmat: "UN 1823 · Class 8",
    reqs: ["hazmat", "gps", "permits", "insurance", "vetted_driver"], docs: ["commercial_invoice", "packing_list", "bill_of_lading", "sds", "t1"],
    postedHoursAgo: 40, quotes: 2, owner: { sector: "mining", city: "Lusaka", cc: "ZM", verification: "verified", since: 2025, shipments: 9 },
  },
];

/* ----------------------------------------------------------------- TRUCKS */
export const TRUCKS: Truck[] = [
  {
    kind: "truck", ref: "EN-T-1108", type: "flatbed", make: "Scania R450", year: 2022, axles: "6×4 + tri-axle", payloadT: 34, body: "13.6 × 2.5 m",
    location: p("Dar es Salaam", "TZ"), availIn: 0, routes: ["tz-zm", "tz-cd", "tz-mw", "domestic"], features: ["gps", "insurance", "comesa", "permits", "vetted_driver", "pod_photos"], rate: [1.9, 2.3], postedHoursAgo: 3,
    transporter: { ref: "TR-TZ-0218", fleet: 24, years: 11, rating: 4.8, trips: 412, replyHours: 2, verification: "verified", city: "Dar es Salaam", cc: "TZ" },
  },
  {
    kind: "truck", ref: "EN-T-1109", type: "curtainside", make: "Volvo FH 460", year: 2021, axles: "6×4 + tri-axle", payloadT: 34, body: "13.6 × 2.5 × 2.7 m",
    location: p("Dar es Salaam", "TZ"), availIn: 1, routes: ["tz-zm", "tz-mw", "tz-rw-bi"], features: ["tarpaulin", "gps", "insurance", "comesa", "pod_photos"], rate: [1.8, 2.2], postedHoursAgo: 6,
    transporter: { ref: "TR-TZ-0145", fleet: 38, years: 14, rating: 4.7, trips: 689, replyHours: 3, verification: "verified", city: "Dar es Salaam", cc: "TZ" },
  },
  {
    kind: "truck", ref: "EN-T-1110", type: "container", make: "Mercedes-Benz Actros 2645", year: 2023, axles: "6×4 + 40 ft skeletal", payloadT: 30, body: "1 × 40 ft or 2 × 20 ft",
    location: p("Dar es Salaam", "TZ"), availIn: 0, routes: ["tz-zm", "tz-cd", "tz-rw-bi"], features: ["twistlocks", "gps", "insurance", "comesa", "permits", "vetted_driver"], rate: [1.8, 2.1], postedHoursAgo: 2,
    transporter: { ref: "TR-TZ-0301", fleet: 52, years: 16, rating: 4.9, trips: 1204, replyHours: 1, verification: "verified", city: "Dar es Salaam", cc: "TZ" },
  },
  {
    kind: "truck", ref: "EN-T-1111", type: "fuel_tanker", make: "MAN TGS 33.440", year: 2020, axles: "6×4 + 3-axle tanker", payloadT: 30, body: "36,000 L · 4 compartments",
    location: p("Dar es Salaam", "TZ"), availIn: 2, routes: ["tz-zm", "tz-rw-bi", "tz-cd"], features: ["hazmat", "gps", "insurance", "comesa", "vetted_driver", "permits"], rate: [2.0, 2.5], postedHoursAgo: 10,
    transporter: { ref: "TR-TZ-0077", fleet: 31, years: 13, rating: 4.6, trips: 538, replyHours: 4, verification: "verified", city: "Dar es Salaam", cc: "TZ" },
  },
  {
    kind: "truck", ref: "EN-T-1112", type: "reefer", make: "Scania R410 + Thermo King", year: 2023, axles: "4×2 + 2-axle reefer", payloadT: 22, body: "13.4 × 2.5 m · −25 °C to +25 °C",
    location: p("Dar es Salaam", "TZ"), availIn: 1, routes: ["tz-mw", "tz-zm", "tz-ke"], features: ["reefer_unit", "temp_log", "gps", "insurance", "vetted_driver", "comesa"], rate: [2.3, 2.8], postedHoursAgo: 5,
    transporter: { ref: "TR-TZ-0262", fleet: 12, years: 7, rating: 4.8, trips: 231, replyHours: 2, verification: "verified", city: "Dar es Salaam", cc: "TZ" },
  },
  {
    kind: "truck", ref: "EN-T-1113", type: "tipper", make: "Sinotruk Howo A7", year: 2022, axles: "8×4", payloadT: 32, body: "18 m³ body",
    location: p("Dodoma", "TZ"), availIn: 0, routes: ["domestic"], features: ["gps", "pod_photos"], rate: [1.2, 1.5], postedHoursAgo: 4,
    transporter: { ref: "TR-TZ-0390", fleet: 9, years: 5, rating: 4.4, trips: 163, replyHours: 3, verification: "under_review", city: "Dodoma", cc: "TZ" },
  },
  {
    kind: "truck", ref: "EN-T-1114", type: "lowbed", make: "Volvo FH16 750", year: 2021, axles: "6×4 + 4-axle lowbed", payloadT: 60, body: "13 × 3 m · deck height 0.9 m",
    location: p("Lusaka", "ZM"), availIn: 3, routes: ["tz-zm", "tz-cd"], features: ["escort", "permits", "gps", "insurance", "comesa", "vetted_driver"], rate: [3.2, 4.0], postedHoursAgo: 20,
    transporter: { ref: "TR-ZM-0036", fleet: 7, years: 12, rating: 4.9, trips: 144, replyHours: 6, verification: "verified", city: "Lusaka", cc: "ZM" },
  },
  {
    kind: "truck", ref: "EN-T-1115", type: "box", make: "Shacman X3000", year: 2023, axles: "6×4", payloadT: 28, body: "9.6 × 2.5 × 2.6 m",
    location: p("Dar es Salaam", "TZ"), availIn: 0, routes: ["tz-cd", "tz-zm", "tz-ke"], features: ["gps", "insurance", "permits", "pod_photos", "vetted_driver"], rate: [1.7, 2.0], postedHoursAgo: 7,
    transporter: { ref: "TR-TZ-0188", fleet: 18, years: 8, rating: 4.5, trips: 276, replyHours: 3, verification: "verified", city: "Dar es Salaam", cc: "TZ" },
  },
  {
    kind: "truck", ref: "EN-T-1116", type: "bulk", make: "Iveco Stralis 480", year: 2019, axles: "6×4 + tri-axle grain trailer", payloadT: 33, body: "45 m³ · tarpaulin cover",
    location: p("Mbeya", "TZ"), availIn: 2, routes: ["tz-zm", "tz-mw", "domestic"], features: ["tarpaulin", "gps", "comesa", "pod_photos"], rate: [1.6, 1.9], postedHoursAgo: 15,
    transporter: { ref: "TR-TZ-0412", fleet: 6, years: 4, rating: 4.3, trips: 98, replyHours: 5, verification: "registered", city: "Mbeya", cc: "TZ" },
  },
  {
    kind: "truck", ref: "EN-T-1117", type: "container", make: "DAF XF 480", year: 2022, axles: "6×4 + 40 ft skeletal", payloadT: 30, body: "1 × 40 ft or 2 × 20 ft",
    location: p("Mombasa", "KE"), availIn: 0, routes: ["northern", "tz-ke"], features: ["twistlocks", "gps", "insurance", "comesa", "pod_photos"], rate: [1.9, 2.2], postedHoursAgo: 1,
    transporter: { ref: "TR-KE-0129", fleet: 44, years: 15, rating: 4.7, trips: 957, replyHours: 2, verification: "verified", city: "Mombasa", cc: "KE" },
  },
  {
    kind: "truck", ref: "EN-T-1118", type: "flatbed", make: "FAW J6P", year: 2021, axles: "6×4 + tri-axle", payloadT: 32, body: "13 × 2.5 m",
    location: p("Kampala", "UG"), availIn: 1, routes: ["northern", "tz-rw-bi"], features: ["gps", "insurance", "comesa", "pod_photos"], rate: [1.7, 2.0], postedHoursAgo: 9,
    transporter: { ref: "TR-UG-0054", fleet: 15, years: 9, rating: 4.5, trips: 322, replyHours: 4, verification: "verified", city: "Kampala", cc: "UG" },
  },
  {
    kind: "truck", ref: "EN-T-1119", type: "chem_tanker", make: "Scania G450", year: 2022, axles: "6×4 + stainless tanker", payloadT: 28, body: "30,000 L · stainless steel",
    location: p("Ndola", "ZM"), availIn: 1, routes: ["tz-cd", "tz-zm"], features: ["hazmat", "gps", "permits", "insurance", "comesa", "vetted_driver", "escort"], rate: [2.6, 3.2], postedHoursAgo: 12,
    transporter: { ref: "TR-ZM-0091", fleet: 20, years: 10, rating: 4.8, trips: 366, replyHours: 3, verification: "verified", city: "Ndola", cc: "ZM" },
  },
  {
    kind: "truck", ref: "EN-T-1120", type: "curtainside", make: "Mercedes-Benz Actros 2545", year: 2020, axles: "6×2 + tri-axle", payloadT: 33, body: "13.6 × 2.5 × 2.7 m",
    location: p("Lilongwe", "MW"), availIn: 4, routes: ["tz-mw", "tz-zm"], features: ["tarpaulin", "gps", "insurance", "comesa", "pod_photos"], rate: [1.7, 2.0], postedHoursAgo: 28,
    transporter: { ref: "TR-MW-0022", fleet: 10, years: 6, rating: 4.4, trips: 187, replyHours: 5, verification: "under_review", city: "Lilongwe", cc: "MW" },
  },
  {
    kind: "truck", ref: "EN-T-1121", type: "tipper", make: "Shacman F3000", year: 2023, axles: "8×4", payloadT: 35, body: "20 m³ body",
    location: p("Dar es Salaam", "TZ"), availIn: 0, routes: ["domestic", "tz-ke"], features: ["gps", "pod_photos", "vetted_driver"], rate: [1.1, 1.4], postedHoursAgo: 2,
    transporter: { ref: "TR-TZ-0233", fleet: 26, years: 9, rating: 4.6, trips: 745, replyHours: 2, verification: "verified", city: "Dar es Salaam", cc: "TZ" },
  },
];

/** Every sample listing, newest first. */
export const LISTINGS: Listing[] = [...LOADS, ...TRUCKS].sort((a, b) => a.postedHoursAgo - b.postedHoursAgo);

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

export const matchingTrucks = (l: Load) => TRUCKS.filter((t) => truckFitsLoad(t, l));
export const matchingLoads = (t: Truck) => LOADS.filter((l) => truckFitsLoad(t, l));

/** Resolve a day offset to an ISO date (UTC, date only). */
export function isoDay(base: number, offset: number): string {
  return new Date(base + offset * 86_400_000).toISOString().slice(0, 10);
}
