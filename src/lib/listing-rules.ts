import type { CargoType, Feature, Packaging, VehicleType } from "./marketplace";

/**
 * Domain knowledge that makes the cargo form easy for non-specialists:
 * which vehicle usually suits a cargo, and which requirements usually come with it.
 */

export function suggestVehicles(cargo: CargoType | "", packaging: Packaging | "", opts: { temp?: boolean; hazardous?: boolean } = {}): VehicleType[] {
  const out: VehicleType[] = [];
  const add = (...v: VehicleType[]) => v.forEach((x) => !out.includes(x) && out.push(x));

  if (opts.temp || cargo === "pharma") add("reefer");
  if (cargo === "fuel") add("fuel_tanker");
  if (packaging === "liquid") add(cargo === "chemicals" ? "chem_tanker" : "fuel_tanker", "container");
  if (cargo === "chemicals" && packaging !== "liquid") add("box", "curtainside");
  if (packaging === "containerised") add("container");
  if (packaging === "oversize" || cargo === "heavy") add("lowbed", "flatbed");
  if (packaging === "coils" || cargo === "steel") add("flatbed");
  if (cargo === "machinery") add("flatbed", "lowbed", "container");
  if (packaging === "bulk") add(cargo === "construction" || cargo === "minerals" ? "tipper" : "bulk", "bulk");
  if (packaging === "bagged") add("curtainside", "box");
  if (packaging === "palletised") add("box", "curtainside");
  if (packaging === "loose") add("flatbed", "curtainside");
  if (cargo === "minerals" && packaging === "containerised") add("container");
  if (cargo === "fmcg" || cargo === "general") add("box", "curtainside");
  return out.slice(0, 3);
}

/** Requirements that are normally ticked for a given vehicle and cargo (the customer can still change them). */
export function defaultRequirements(vehicle: VehicleType | "", opts: { hazardous?: boolean; temp?: boolean; crossBorder?: boolean } = {}): Feature[] {
  const r = new Set<Feature>(["gps", "pod_photos", "insurance"]);
  if (vehicle === "curtainside" || vehicle === "bulk" || vehicle === "flatbed") r.add("tarpaulin");
  if (vehicle === "container") r.add("twistlocks");
  if (vehicle === "reefer" || opts.temp) { r.add("reefer_unit"); r.add("temp_log"); r.add("vetted_driver"); }
  if (vehicle === "fuel_tanker" || vehicle === "chem_tanker" || opts.hazardous) { r.add("hazmat"); r.add("vetted_driver"); }
  if (vehicle === "lowbed") { r.add("escort"); r.add("permits"); }
  if (opts.crossBorder) { r.add("permits"); r.add("comesa"); }
  return [...r];
}

/** Common axle configurations offered as suggestions in the truck form. */
export const AXLE_SUGGESTIONS = [
  "4×2", "6×2", "6×4", "8×4",
  "6×4 + tri-axle trailer", "4×2 + 2-axle trailer", "6×4 + 40 ft skeletal trailer",
  "6×4 + 3-axle tanker", "6×4 + 4-axle lowbed",
];

/** Equipment that normally comes with a type of truck (pre-ticked in the truck form, still editable). */
export function defaultTruckFeatures(vehicle: VehicleType | ""): Feature[] {
  switch (vehicle) {
    case "reefer": return ["reefer_unit", "temp_log"];
    case "container": return ["twistlocks"];
    case "fuel_tanker":
    case "chem_tanker": return ["hazmat"];
    case "curtainside":
    case "bulk":
    case "flatbed": return ["tarpaulin"];
    case "lowbed": return ["escort", "permits"];
    default: return [];
  }
}

/** Documents worth uploading for a truck, in order of importance. */
export function recommendedTruckDocs(vehicle: VehicleType | ""): ("registration_card" | "insurance" | "transit_permit" | "comesa_yellow_card" | "inspection" | "tank_certificate" | "hazmat_certificate")[] {
  const base: ("registration_card" | "insurance" | "transit_permit" | "comesa_yellow_card" | "inspection" | "tank_certificate" | "hazmat_certificate")[] = ["registration_card", "insurance", "comesa_yellow_card"];
  if (vehicle === "fuel_tanker" || vehicle === "chem_tanker") return [...base, "tank_certificate", "hazmat_certificate"];
  return base;
}
