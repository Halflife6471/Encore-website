import { describe, expect, it } from "vitest";
import {
  effectiveTier,
  encoreFee,
  partnerReward,
  rewardEligibility,
  standardCommission,
  tierForBookings,
  transporterNetPayable,
  withinAttributionWindow,
} from "../src/lib/commercial";

describe("standard commission – SRS §19.3 examples", () => {
  const q = { minimumApplies: true };
  it.each([
    [4000, 300],
    [5000, 300],
    [6000, 300],
    [10000, 500],
    [15000, 750],
  ])("freight USD %i → Encore commission USD %i", (freight, expected) => {
    expect(standardCommission(freight, q)).toBe(expected);
  });
  it("uses the percentage only when the minimum does not apply", () => {
    expect(standardCommission(4000, { minimumApplies: false })).toBe(200);
  });
  it("rejects invalid amounts", () => {
    expect(() => standardCommission(-1)).toThrow();
    expect(() => standardCommission(NaN)).toThrow();
  });
});

describe("managed logistics margin – SRS §19.4", () => {
  it("adds on top of the standard commission", () => {
    const f = encoreFee(10000, { cfg: { minimumApplies: true }, managedMargin: 0.08, managedMode: "additional" });
    expect(f).toEqual({ standard: 500, managed: 800, total: 1300 });
  });
  it("can be the agreed total fee (no double charging)", () => {
    const f = encoreFee(10000, { cfg: { minimumApplies: true }, managedMargin: 0.08, managedMode: "total_fee" });
    expect(f).toEqual({ standard: 0, managed: 800, total: 800 });
  });
});

describe("partner rewards with minimum-retention protection – SRS §21.8", () => {
  it("pays nothing when Encore collects exactly USD 300", () => {
    expect(partnerReward({ collectedCommission: 300, tierRate: 0.1 })).toMatchObject({ pool: 0, reward: 0, encoreRetained: 300 });
  });
  it("USD 500 collected, 10% tier → reward 50, Encore retains 450", () => {
    expect(partnerReward({ collectedCommission: 500, tierRate: 0.1 })).toMatchObject({ pool: 200, reward: 50, encoreRetained: 450 });
  });
  it("caps the reward at the available pool", () => {
    const r = partnerReward({ collectedCommission: 350, tierRate: 0.2 }); // tier 70 > pool 50
    expect(r.reward).toBe(50);
    expect(r.encoreRetained).toBe(300);
  });
  it("never lets Encore retain less than the minimum on a qualifying booking", () => {
    for (const c of [300, 310, 450, 750, 1200]) for (const rate of [0.1, 0.15, 0.2]) {
      expect(partnerReward({ collectedCommission: c, tierRate: rate }).encoreRetained).toBeGreaterThanOrEqual(300);
    }
  });
});

describe("tiers and attribution – SRS §21.6–21.7", () => {
  it("assigns tiers by qualifying bookings per quarter", () => {
    expect(tierForBookings(0)).toBe("starter");
    expect(tierForBookings(4)).toBe("starter");
    expect(tierForBookings(5)).toBe("growth");
    expect(tierForBookings(14)).toBe("growth");
    expect(tierForBookings(15)).toBe("premier");
  });
  it("defaults to Starter during the first 90 days", () => {
    expect(effectiveTier({ qualifyingBookingsPerQuarter: 20, daysSinceActivation: 30 })).toBe("starter");
    expect(effectiveTier({ qualifyingBookingsPerQuarter: 20, daysSinceActivation: 30, specialApproval: true })).toBe("premier");
    expect(effectiveTier({ qualifyingBookingsPerQuarter: 20, daysSinceActivation: 91 })).toBe("premier");
  });
  it("honours the 60-day attribution window", () => {
    const d = (s: string) => new Date(s);
    expect(withinAttributionWindow(d("2027-01-01"), d("2027-03-01"))).toBe(true); // 59 days
    expect(withinAttributionWindow(d("2027-01-01"), d("2027-03-03"))).toBe(false); // 61 days
    expect(withinAttributionWindow(d("2027-01-10"), d("2027-01-01"))).toBe(false); // booking before introduction
  });
  it("requires every condition before a reward is eligible (SRS §21.10)", () => {
    const all = { attributionValid: true, bookingConfirmed: true, shipmentCompleted: true, podReviewed: true, feeCollected: true, financeReconciled: true, partnerCompliant: true, payoutApproved: true };
    expect(rewardEligibility(all).eligible).toBe(true);
    const r = rewardEligibility({ ...all, podReviewed: false, payoutApproved: false });
    expect(r.eligible).toBe(false);
    expect(r.missing).toEqual(["podReviewed", "payoutApproved"]);
  });
});

describe("transporter settlement – SRS §20.7", () => {
  it("is based on the agreed rate, not a fixed universal percentage", () => {
    expect(transporterNetPayable({ agreedRate: 9000, deductions: 200, adjustments: 50, alreadyPaid: 3000 })).toEqual({ netPayable: 8850, outstanding: 5850 });
  });
});
