import { describe, expect, it } from "vitest";
import { bordersFor, corridorFor, destinationsFor, estimateRoute } from "../src/lib/places";

describe("places – corridor, borders and distance helpers", () => {
  it("derives the corridor from the two countries and rejects unsupported pairs", () => {
    expect(corridorFor("TZ", "ZM")).toBe("tz-zm");
    expect(corridorFor("ZM", "TZ")).toBe("tz-zm");
    expect(corridorFor("ZM", "CD")).toBe("tz-cd");
    expect(corridorFor("KE", "RW")).toBe("northern");
    expect(corridorFor("TZ", "TZ")).toBe("domestic");
    expect(corridorFor("MW", "KE")).toBeNull();
    expect(corridorFor("KE", "KE")).toBeNull();
    expect(destinationsFor("MW")).toEqual(["TZ"]);
  });

  it("lists border posts in travel order, and reverses them for the opposite direction", () => {
    expect(bordersFor("TZ", "CD")).toEqual(["Tunduma / Nakonde", "Kasumbalesa"]);
    expect(bordersFor("CD", "TZ")).toEqual(["Kasumbalesa", "Tunduma / Nakonde"]);
    expect(bordersFor("TZ", "TZ")).toEqual([]);
  });

  it("estimates road distances close to the real ones", () => {
    const near = (got: number, want: number) => expect(Math.abs(got - want) / want).toBeLessThan(0.12);
    near(estimateRoute("Dar es Salaam", "TZ", "Lusaka", "ZM")!.km, 1980);
    near(estimateRoute("Mombasa", "KE", "Kampala", "UG")!.km, 1170);
    near(estimateRoute("Dar es Salaam", "TZ", "Mwanza", "TZ")!.km, 1150);
    near(estimateRoute("Dar es Salaam", "TZ", "Nairobi", "KE")!.km, 880);
  });

  it("gives a sensible transit window and is case-insensitive; unknown cities return null", () => {
    const r = estimateRoute("dar es salaam", "TZ", "LUBUMBASHI", "CD")!;
    expect(r.corridor).toBe("tz-cd");
    expect(r.transit[0]).toBeLessThan(r.transit[1]);
    expect(r.borders).toHaveLength(2);
    expect(estimateRoute("Nowhereville", "TZ", "Lusaka", "ZM")).toBeNull();
  });
});
