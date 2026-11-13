import { describe, expect, it } from "vitest";
import { parseLoadForm, parseTruckForm } from "../src/lib/listing-validation";

const TODAY = "2026-11-13";
const fd = (o: Record<string, string | string[]>) => {
  const f = new FormData();
  for (const [k, v] of Object.entries(o)) for (const x of Array.isArray(v) ? v : [v]) f.append(k, x);
  return f;
};

const load = (over: Record<string, string | string[]> = {}) =>
  fd({
    originCC: "TZ", originCity: "Dar es Salaam", destCC: "ZM", destCity: "Lusaka",
    pickupFrom: "2026-11-16", pickupTo: "2026-11-19", deliverBy: "2026-11-28",
    commodity: "NPK fertiliser, 50 kg bags", cargoType: "agri_inputs", packaging: "bagged", weightT: "68",
    vehicleType: "curtainside", trucksNeeded: "2", reqs: ["gps", "tarpaulin"], docs: ["commercial_invoice"],
    budgetMin: "3800", budgetMax: "4300",
    companyName: "Sample Agro Ltd", contactName: "Asha Mushi", contactPhone: "+255 712 345 678", contactEmail: "Asha@Example.com",
    terms: "on", ...over,
  });

const truck = (over: Record<string, string | string[]> = {}) =>
  fd({
    vehicleType: "flatbed", makeModel: "Scania R450", year: "2022", axles: "6×4 + tri-axle", payloadT: "34",
    bodyLength: "13.6", bodyWidth: "2.5", plateNumber: "t 123 abc", locCC: "TZ", locCity: "Dar es Salaam", availableNow: "on",
    corridors: ["tz-zm", "tz-cd"], features: ["gps"], contactName: "John Banda", contactPhone: "+255700000001", contactEmail: "j@b.co", terms: "on", ...over,
  });

describe("post-cargo form rules", () => {
  it("accepts a complete request and derives corridor, borders, distance and transit", () => {
    const r = parseLoadForm(load(), TODAY);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.corridor).toBe("tz-zm");
    expect(r.data.borders).toEqual(["Tunduma / Nakonde"]);
    expect(r.data.km).toBeGreaterThan(1700);
    expect(r.data.transit[0]).toBeLessThan(r.data.transit[1]);
    expect(r.data.contact).toEqual({ name: "Asha Mushi", phone: "+255712345678", email: "asha@example.com" });
    expect(r.data.budget).toEqual([3800, 4300]);
    expect(r.data.reqs).toContain("permits"); // cross-border loads always need transit permits
  });

  it("rejects unsupported routes and identical places", () => {
    expect(parseLoadForm(load({ originCC: "MW", destCC: "KE", destCity: "Nairobi", originCity: "Lilongwe" }), TODAY)).toMatchObject({ ok: false, errors: { destCC: "route_unsupported" } });
    expect(parseLoadForm(load({ destCC: "TZ", destCity: "Dar es Salaam" }), TODAY)).toMatchObject({ ok: false, errors: { destCity: "same_place" } });
  });

  it("asks for the distance when a city is not in the list, and then accepts it", () => {
    expect(parseLoadForm(load({ destCity: "Chingola" }), TODAY)).toMatchObject({ ok: false, errors: { distanceKm: "distance_required" } });
    const r = parseLoadForm(load({ destCity: "Chingola", distanceKm: "2100" }), TODAY);
    expect(r.ok && r.data.km).toBe(2100);
  });

  it("validates dates in order, not in the past, and within sensible limits", () => {
    expect(parseLoadForm(load({ pickupFrom: "2026-11-10" }), TODAY)).toMatchObject({ ok: false, errors: { pickupFrom: "date_past" } });
    expect(parseLoadForm(load({ pickupTo: "2026-11-15" }), TODAY)).toMatchObject({ ok: false, errors: { pickupTo: "date_order" } });
    expect(parseLoadForm(load({ deliverBy: "2026-11-17" }), TODAY)).toMatchObject({ ok: false, errors: { deliverBy: "date_order" } });
    expect(parseLoadForm(load({ pickupFrom: "2027-09-01", pickupTo: "2027-09-02", deliverBy: "2027-09-10" }), TODAY)).toMatchObject({ ok: false, errors: { pickupFrom: "date_far" } });
  });

  it("enforces cargo rules: weight per truck, oversize dimensions, hazmat, cold chain, liquids", () => {
    expect(parseLoadForm(load({ weightT: "300", trucksNeeded: "2" }), TODAY)).toMatchObject({ ok: false, errors: { weightT: "weight_per_truck" } });
    expect(parseLoadForm(load({ packaging: "oversize", vehicleType: "lowbed" }), TODAY)).toMatchObject({ ok: false, errors: { piece: "piece_required" } });
    expect(parseLoadForm(load({ hazardous: "on" }), TODAY)).toMatchObject({ ok: false, errors: { hazmatClass: "hazmat_required" } });
    expect(parseLoadForm(load({ tempControlled: "on", tempMin: "2", tempMax: "8" }), TODAY)).toMatchObject({ ok: false, errors: { vehicleType: "vehicle_reefer" } });
    expect(parseLoadForm(load({ packaging: "liquid" }), TODAY)).toMatchObject({ ok: false, errors: { vehicleType: "vehicle_liquid" } });
    expect(parseLoadForm(load({ tempControlled: "on", tempMin: "8", tempMax: "2", vehicleType: "reefer" }), TODAY)).toMatchObject({ ok: false, errors: { tempMax: "temp_order" } });
  });

  it("adds the requirements that dangerous or cold cargo always needs", () => {
    const h = parseLoadForm(load({ hazardous: "on", hazmatClass: "UN 1830 · Class 8", packaging: "liquid", vehicleType: "chem_tanker" }), TODAY);
    expect(h.ok && h.data.reqs).toEqual(expect.arrayContaining(["hazmat", "insurance"]));
    const c = parseLoadForm(load({ tempControlled: "on", tempMin: "2", tempMax: "8", vehicleType: "reefer" }), TODAY);
    expect(c.ok && c.data.reqs).toEqual(expect.arrayContaining(["reefer_unit", "temp_log"]));
  });

  it("requires a budget unless the owner wants quotes, and keeps it consistent", () => {
    expect(parseLoadForm(load({ budgetMin: "", budgetMax: "" }), TODAY)).toMatchObject({ ok: false, errors: { budgetMin: "budget_required" } });
    expect(parseLoadForm(load({ budgetMin: "5000", budgetMax: "4000" }), TODAY)).toMatchObject({ ok: false, errors: { budgetMax: "budget_order" } });
    const q = parseLoadForm(load({ quoteOnly: "on", budgetMin: "", budgetMax: "" }), TODAY);
    expect(q.ok && q.data.budget).toBeNull();
  });

  it("requires terms, a valid international phone number and a valid email", () => {
    expect(parseLoadForm(load({ terms: "" }), TODAY)).toMatchObject({ ok: false, errors: { terms: "terms_required" } });
    expect(parseLoadForm(load({ contactPhone: "0712345678" }), TODAY)).toMatchObject({ ok: false, errors: { contactPhone: "phone_invalid" } });
    expect(parseLoadForm(load({ contactEmail: "nope" }), TODAY)).toMatchObject({ ok: false, errors: { contactEmail: "email_invalid" } });
  });

  it("ignores unknown requirement values (no injection through checkbox lists)", () => {
    const r = parseLoadForm(load({ reqs: ["gps", "hacked", "<script>"] }), TODAY);
    expect(r.ok && r.data.reqs).not.toContain("hacked");
  });
});

describe("register-truck form rules", () => {
  it("accepts a complete truck and composes the body description", () => {
    const r = parseTruckForm(truck(), TODAY);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.bodySpec).toBe("13.6 × 2.5 m");
    expect(r.data.plateNumber).toBe("T 123 ABC");
    expect(r.data.availableFrom).toBe(TODAY);
    expect(r.data.corridors).toEqual(["tz-zm", "tz-cd"]);
  });

  it("asks for the right capacity fields per vehicle kind", () => {
    expect(parseTruckForm(truck({ bodyLength: "" }), TODAY)).toMatchObject({ ok: false, errors: { bodyLength: "dimension_required" } });
    expect(parseTruckForm(truck({ vehicleType: "container" }), TODAY)).toMatchObject({ ok: false, errors: { containerConfig: "container_required" } });
    expect(parseTruckForm(truck({ vehicleType: "container", containerConfig: "1 × 40 ft" }), TODAY).ok).toBe(true);
    expect(parseTruckForm(truck({ vehicleType: "fuel_tanker" }), TODAY)).toMatchObject({ ok: false, errors: { tankLitres: "tank_required" } });
    const t = parseTruckForm(truck({ vehicleType: "fuel_tanker", tankLitres: "36000", compartments: "4" }), TODAY);
    expect(t.ok && t.data.bodySpec).toBe("36,000 L · 4 compartments");
    const v = parseTruckForm(truck({ vehicleType: "tipper", volumeM3: "18" }), TODAY);
    expect(v.ok && v.data.bodySpec).toBe("18 m³ body");
  });

  it("requires a corridor, a sensible availability date and a consistent rate range", () => {
    expect(parseTruckForm(truck({ corridors: [] }), TODAY)).toMatchObject({ ok: false, errors: { corridors: "corridor_required" } });
    expect(parseTruckForm(truck({ availableNow: "", availableFrom: "" }), TODAY)).toMatchObject({ ok: false, errors: { availableFrom: "date_required" } });
    expect(parseTruckForm(truck({ availableNow: "", availableFrom: "2026-11-01" }), TODAY)).toMatchObject({ ok: false, errors: { availableFrom: "date_past" } });
    expect(parseTruckForm(truck({ rateMin: "2.5", rateMax: "2" }), TODAY)).toMatchObject({ ok: false, errors: { rateMax: "rate_order" } });
    expect(parseTruckForm(truck({ rateMin: "2" }), TODAY)).toMatchObject({ ok: false, errors: { rateMax: "rate_both" } });
  });

  it("rejects expired insurance and impossible years, and auto-adds a reefer unit", () => {
    expect(parseTruckForm(truck({ insuranceExpiry: "2026-10-01" }), TODAY)).toMatchObject({ ok: false, errors: { insuranceExpiry: "insurance_expired" } });
    expect(parseTruckForm(truck({ year: "1980" }), TODAY)).toMatchObject({ ok: false, errors: { year: "year_invalid" } });
    const r = parseTruckForm(truck({ vehicleType: "reefer", features: ["gps"] }), TODAY);
    expect(r.ok && r.data.features).toContain("reefer_unit");
  });
});
