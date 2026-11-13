import { z } from "zod";
import {
  CARGO_TYPE_LIST, CORRIDOR_LIST, COUNTRY_LIST, DOC_LIST, FEATURE_LIST, PACKAGING_LIST, SECTOR_LIST, VEHICLE_LIST,
  type Feature, type VehicleType,
} from "./marketplace";
import { corridorFor, estimateRoute, bordersFor, transitFor } from "./places";
import type { FieldErrors } from "./validation";

/**
 * Server-side rules for the "Post cargo" and "Register truck" forms.
 * Error values are translation keys (see dictionary `listings.errors`); the server never sends free text.
 */

/* ---------------------------------------------------------------- helpers */
const clean = (max: number, min = 0, code = "too_short") =>
  z.string().transform((v) => v.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim()).pipe(z.string().min(min, code).max(max, "too_long"));
const optText = (max: number) => z.string().optional().default("").transform((v) => v.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim()).pipe(z.string().max(max, "too_long"));

const blank = (v: unknown) => (v === "" || v === null || v === undefined ? undefined : v);
const num = (min: number, max: number, code: string) => z.preprocess(blank, z.coerce.number({ error: code }).min(min, code).max(max, code));
const optNum = (min: number, max: number, code: string) => z.preprocess(blank, z.coerce.number({ error: code }).min(min, code).max(max, code).optional());
const int = (min: number, max: number, code: string) => z.preprocess(blank, z.coerce.number({ error: code }).int(code).min(min, code).max(max, code));
const optInt = (min: number, max: number, code: string) => z.preprocess(blank, z.coerce.number({ error: code }).int(code).min(min, code).max(max, code).optional());

const iso = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date_invalid").refine((v) => !Number.isNaN(Date.parse(`${v}T00:00:00Z`)), "date_invalid");
const checkbox = z.string().optional().transform((v) => v === "on");
const day = (v: string) => Date.parse(`${v}T00:00:00Z`) / 86_400_000;
export const addDays = (isoDate: string, n: number) => new Date((day(isoDate) + n) * 86_400_000).toISOString().slice(0, 10);

const country = z.enum(COUNTRY_LIST as [string, ...string[]], { error: "country_invalid" });
const city = clean(60, 2, "city_required");
const phone = z.string().transform((v) => v.replace(/[\s()-]/g, "")).pipe(z.string().regex(/^\+[1-9]\d{7,14}$/, "phone_invalid"));
const email = z.string().trim().toLowerCase().max(254).pipe(z.email("email_invalid"));
const person = clean(80, 2, "name_short");

function arrayOf<T extends string>(list: readonly T[]) {
  return z.array(z.string()).default([]).transform((a) => [...new Set(a)].filter((x): x is T => (list as readonly string[]).includes(x)));
}

export type Parsed<T> = { ok: true; data: T } | { ok: false; errors: FieldErrors };

function firstErrors(err: z.ZodError): FieldErrors {
  const out: FieldErrors = {};
  for (const i of err.issues) {
    const k = String(i.path[0] ?? "form");
    if (!out[k]) out[k] = i.message;
  }
  return out;
}

/** Collect form values; repeated keys (checkbox groups) become arrays. */
export function formToRaw(fd: FormData, arrays: string[]): Record<string, unknown> {
  const o: Record<string, unknown> = {};
  for (const k of new Set(fd.keys())) {
    const all = fd.getAll(k).filter((v): v is string => typeof v === "string");
    o[k] = arrays.includes(k) ? all : all[all.length - 1];
  }
  return o;
}

/* ------------------------------------------------------------------ LOADS */
const loadBase = z.object({
  originCC: country,
  originCity: city,
  originAddress: optText(160),
  destCC: country,
  destCity: city,
  destAddress: optText(160),
  distanceKm: optInt(5, 6000, "distance_invalid"),
  pickupFrom: iso,
  pickupTo: iso,
  deliverBy: iso,

  commodity: clean(120, 3, "commodity_short"),
  cargoType: z.enum(CARGO_TYPE_LIST as [string, ...string[]], { error: "required" }),
  packaging: z.enum(PACKAGING_LIST as [string, ...string[]], { error: "required" }),
  weightT: num(0.1, 1000, "weight_invalid"),
  volumeCbm: optNum(0.1, 2000, "volume_invalid"),
  piece: optText(40),
  hazardous: checkbox,
  hazmatClass: optText(60),
  tempControlled: checkbox,
  tempMin: optNum(-40, 40, "temp_invalid"),
  tempMax: optNum(-40, 40, "temp_invalid"),
  sector: z.enum(SECTOR_LIST as [string, ...string[]]).catch("trading"),
  note: optText(400),
  urgent: checkbox,

  vehicleType: z.enum(VEHICLE_LIST as [string, ...string[]], { error: "required" }),
  trucksNeeded: int(1, 50, "trucks_invalid"),
  reqs: arrayOf(FEATURE_LIST),
  docs: arrayOf(DOC_LIST),

  quoteOnly: checkbox,
  budgetMin: optInt(0, 500000, "budget_invalid"),
  budgetMax: optInt(0, 500000, "budget_invalid"),

  companyName: clean(120, 2, "company_required"),
  contactName: person,
  contactPhone: phone,
  contactEmail: email,
  declaredValue: optInt(0, 100_000_000, "value_invalid"),
  privateNotes: optText(500),

  terms: z.literal("on", { error: "terms_required" }),
});

export interface LoadInput {
  corridor: string;
  origin: { city: string; cc: string };
  destination: { city: string; cc: string };
  originAddress: string;
  destAddress: string;
  km: number;
  transit: [number, number];
  borders: string[];
  pickup: [string, string];
  deliverBy: string;
  commodity: string;
  cargoType: string;
  packaging: string;
  weightT: number;
  volumeCbm?: number;
  piece: string;
  vehicleType: string;
  trucksNeeded: number;
  hazmat?: string;
  temp?: [number, number];
  reqs: Feature[];
  docs: string[];
  sector: string;
  note: string;
  urgent: boolean;
  budget: [number, number] | null;
  company: string;
  contact: { name: string; phone: string; email: string };
  declaredValue?: number;
  privateNotes: string;
}

const LOAD_ARRAYS = ["reqs", "docs"];

export function parseLoadForm(fd: FormData, today: string): Parsed<LoadInput> {
  const r = loadBase.safeParse(formToRaw(fd, LOAD_ARRAYS));
  if (!r.success) return { ok: false, errors: firstErrors(r.error) };
  const v = r.data;
  const e: FieldErrors = {};

  // --- route -------------------------------------------------------------
  const corridor = corridorFor(v.originCC as never, v.destCC as never);
  if (!corridor) e.destCC = "route_unsupported";
  const est = corridor ? estimateRoute(v.originCity, v.originCC as never, v.destCity, v.destCC as never) : null;
  if (corridor && !est && v.originCity.toLowerCase() === v.destCity.toLowerCase() && v.originCC === v.destCC) e.destCity = "same_place";
  let km = est?.km ?? v.distanceKm;
  if (corridor && !km && !e.destCity) e.distanceKm = "distance_required"; // unknown city: the customer must tell us the distance
  const borders = corridor ? bordersFor(v.originCC as never, v.destCC as never) : [];
  const transit = est?.transit ?? (km ? transitFor(km, borders.length) : ([1, 2] as [number, number]));
  km = km ?? 0;

  // --- dates -------------------------------------------------------------
  if (day(v.pickupFrom) < day(today)) e.pickupFrom = "date_past";
  else if (day(v.pickupFrom) > day(today) + 180) e.pickupFrom = "date_far";
  if (!e.pickupFrom && day(v.pickupTo) < day(v.pickupFrom)) e.pickupTo = "date_order";
  else if (!e.pickupFrom && day(v.pickupTo) > day(v.pickupFrom) + 60) e.pickupTo = "window_long";
  if (!e.pickupFrom && !e.pickupTo && day(v.deliverBy) < day(v.pickupTo)) e.deliverBy = "date_order";
  else if (!e.pickupTo && day(v.deliverBy) > day(v.pickupFrom) + 120) e.deliverBy = "date_far";

  // --- cargo rules a logistics professional would insist on ---------------
  if (v.weightT / v.trucksNeeded > 100) e.weightT = "weight_per_truck";
  if ((v.packaging === "oversize" || v.cargoType === "heavy") && v.piece.length < 3) e.piece = "piece_required";
  if (v.hazardous && v.hazmatClass.length < 3) e.hazmatClass = "hazmat_required";
  if (v.tempControlled) {
    if (v.tempMin === undefined) e.tempMin = "temp_invalid";
    else if (v.tempMax === undefined) e.tempMax = "temp_invalid";
    else if (v.tempMin >= v.tempMax) e.tempMax = "temp_order";
    if (v.vehicleType !== "reefer") e.vehicleType = "vehicle_reefer";
  }
  if (v.packaging === "liquid" && !["fuel_tanker", "chem_tanker", "container"].includes(v.vehicleType)) e.vehicleType = "vehicle_liquid";

  // --- budget --------------------------------------------------------------
  let budget: [number, number] | null = null;
  if (!v.quoteOnly) {
    if (v.budgetMin === undefined) e.budgetMin = "budget_required";
    else if (v.budgetMax === undefined) e.budgetMax = "budget_required";
    else if (v.budgetMax < v.budgetMin) e.budgetMax = "budget_order";
    else if (v.budgetMin < 50) e.budgetMin = "budget_low";
    else budget = [v.budgetMin, v.budgetMax];
  }

  if (Object.keys(e).length) return { ok: false, errors: e };

  const reqs = new Set<Feature>(v.reqs);
  if (v.hazardous) { reqs.add("hazmat"); reqs.add("insurance"); }
  if (v.tempControlled) { reqs.add("reefer_unit"); reqs.add("temp_log"); }
  if (corridor !== "domestic") reqs.add("permits");

  return {
    ok: true,
    data: {
      corridor: corridor!,
      origin: { city: est ? v.originCity : v.originCity, cc: v.originCC },
      destination: { city: v.destCity, cc: v.destCC },
      originAddress: v.originAddress,
      destAddress: v.destAddress,
      km,
      transit,
      borders,
      pickup: [v.pickupFrom, v.pickupTo],
      deliverBy: v.deliverBy,
      commodity: v.commodity,
      cargoType: v.cargoType,
      packaging: v.packaging,
      weightT: v.weightT,
      volumeCbm: v.volumeCbm,
      piece: v.piece,
      vehicleType: v.vehicleType,
      trucksNeeded: v.trucksNeeded,
      hazmat: v.hazardous ? v.hazmatClass : undefined,
      temp: v.tempControlled && v.tempMin !== undefined && v.tempMax !== undefined ? [v.tempMin, v.tempMax] : undefined,
      reqs: [...reqs],
      docs: v.docs,
      sector: v.sector,
      note: v.note,
      urgent: v.urgent,
      budget,
      company: v.companyName,
      contact: { name: v.contactName, phone: v.contactPhone, email: v.contactEmail },
      declaredValue: v.declaredValue,
      privateNotes: v.privateNotes,
    },
  };
}

/* ----------------------------------------------------------------- TRUCKS */
/** How a vehicle's capacity is described, which decides the extra fields the form asks for. */
export type BodyKind = "dimensions" | "container" | "tank" | "volume";
export const bodyKindOf = (t: VehicleType | string): BodyKind =>
  t === "container" ? "container" : t === "fuel_tanker" || t === "chem_tanker" ? "tank" : t === "tipper" || t === "bulk" ? "volume" : "dimensions";

export const CONTAINER_CONFIGS = ["1 × 40 ft", "2 × 20 ft", "1 × 40 ft or 2 × 20 ft", "1 × 20 ft"] as const;

const truckBase = z.object({
  vehicleType: z.enum(VEHICLE_LIST as [string, ...string[]], { error: "required" }),
  makeModel: clean(60, 2, "make_required"),
  year: int(1995, new Date().getUTCFullYear() + 1, "year_invalid"),
  axles: clean(40, 2, "axles_required"),
  payloadT: num(1, 120, "payload_invalid"),
  bodyLength: optNum(1, 25, "dimension_invalid"),
  bodyWidth: optNum(1, 4, "dimension_invalid"),
  bodyHeight: optNum(0.3, 5, "dimension_invalid"),
  containerConfig: z.string().optional().default(""),
  tankLitres: optInt(1000, 80000, "tank_invalid"),
  compartments: optInt(1, 10, "compartments_invalid"),
  volumeM3: optNum(3, 120, "volume_invalid"),

  plateNumber: z.string().transform((v) => v.toUpperCase().replace(/[^A-Z0-9 -]/g, "").replace(/\s+/g, " ").trim()).pipe(z.string().min(3, "plate_invalid").max(15, "plate_invalid")),
  trailerPlate: z.string().optional().default("").transform((v) => v.toUpperCase().replace(/[^A-Z0-9 -]/g, "").replace(/\s+/g, " ").trim()).pipe(z.string().max(15, "plate_invalid")),
  insuranceExpiry: z.preprocess(blank, iso.optional()),

  features: arrayOf(FEATURE_LIST),

  locCC: country,
  locCity: city,
  baseAddress: optText(160),
  availableNow: checkbox,
  availableFrom: z.preprocess(blank, iso.optional()),
  corridors: arrayOf(CORRIDOR_LIST),
  rateMin: optNum(0.2, 20, "rate_invalid"),
  rateMax: optNum(0.2, 20, "rate_invalid"),

  contactName: person,
  contactPhone: phone,
  contactEmail: email,

  terms: z.literal("on", { error: "terms_required" }),
});

export interface TruckInput {
  vehicleType: string;
  makeModel: string;
  year: number;
  axles: string;
  payloadT: number;
  bodySpec: string;
  plateNumber: string;
  trailerPlate: string;
  insuranceExpiry?: string;
  features: Feature[];
  location: { city: string; cc: string };
  baseAddress: string;
  availableFrom: string;
  corridors: string[];
  rate: [number, number] | null;
  contact: { name: string; phone: string; email: string };
}

const fmt = (n: number) => (Number.isInteger(n) ? String(n) : String(Math.round(n * 10) / 10));

export function parseTruckForm(fd: FormData, today: string): Parsed<TruckInput> {
  const r = truckBase.safeParse(formToRaw(fd, ["features", "corridors"]));
  if (!r.success) return { ok: false, errors: firstErrors(r.error) };
  const v = r.data;
  const e: FieldErrors = {};

  // --- capacity description, depending on the kind of vehicle -----------------
  let bodySpec = "";
  switch (bodyKindOf(v.vehicleType)) {
    case "dimensions":
      if (v.bodyLength === undefined) e.bodyLength = "dimension_required";
      else if (v.bodyWidth === undefined) e.bodyWidth = "dimension_required";
      else bodySpec = `${fmt(v.bodyLength)} × ${fmt(v.bodyWidth)}${v.bodyHeight ? ` × ${fmt(v.bodyHeight)}` : ""} m`;
      break;
    case "container":
      if (!(CONTAINER_CONFIGS as readonly string[]).includes(v.containerConfig)) e.containerConfig = "container_required";
      else bodySpec = v.containerConfig;
      break;
    case "tank":
      if (v.tankLitres === undefined) e.tankLitres = "tank_required";
      else bodySpec = `${v.tankLitres.toLocaleString("en-US")} L${v.compartments ? ` · ${v.compartments} compartment${v.compartments > 1 ? "s" : ""}` : ""}`;
      break;
    case "volume":
      if (v.volumeM3 === undefined) e.volumeM3 = "volume_required";
      else bodySpec = `${fmt(v.volumeM3)} m³ body`;
      break;
  }

  // --- availability -------------------------------------------------------------
  let availableFrom = today;
  if (!v.availableNow) {
    if (!v.availableFrom) e.availableFrom = "date_required";
    else if (day(v.availableFrom) < day(today)) e.availableFrom = "date_past";
    else if (day(v.availableFrom) > day(today) + 180) e.availableFrom = "date_far";
    else availableFrom = v.availableFrom;
  }
  if (!v.corridors.length) e.corridors = "corridor_required";
  if (v.insuranceExpiry && day(v.insuranceExpiry) < day(today)) e.insuranceExpiry = "insurance_expired";

  let rate: [number, number] | null = null;
  if (v.rateMin !== undefined || v.rateMax !== undefined) {
    if (v.rateMin === undefined || v.rateMax === undefined) e[v.rateMin === undefined ? "rateMin" : "rateMax"] = "rate_both";
    else if (v.rateMax < v.rateMin) e.rateMax = "rate_order";
    else rate = [v.rateMin, v.rateMax];
  }

  if (Object.keys(e).length) return { ok: false, errors: e };

  const features = new Set<Feature>(v.features);
  if (v.vehicleType === "reefer") features.add("reefer_unit");
  if (v.vehicleType === "container") features.add("twistlocks");

  return {
    ok: true,
    data: {
      vehicleType: v.vehicleType,
      makeModel: v.makeModel,
      year: v.year,
      axles: v.axles,
      payloadT: v.payloadT,
      bodySpec,
      plateNumber: v.plateNumber,
      trailerPlate: v.trailerPlate,
      insuranceExpiry: v.insuranceExpiry,
      features: [...features],
      location: { city: v.locCity, cc: v.locCC },
      baseAddress: v.baseAddress,
      availableFrom,
      corridors: v.corridors,
      rate,
      contact: { name: v.contactName, phone: v.contactPhone, email: v.contactEmail },
    },
  };
}
