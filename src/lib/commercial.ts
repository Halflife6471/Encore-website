/**
 * Encore commercial rules engine (SRS §19–§21).
 *
 * Pure, side-effect-free functions so every figure is testable. Values below are
 * the *proposed* defaults of the SRS and remain configurable and subject to Encore's
 * approval (SRS §42.1). NOTHING here is displayed on the public website (SRD WEB-013);
 * it is the foundation for quotations, invoicing and partner payouts in later releases.
 */

export const COMMERCIAL_DEFAULTS = {
  /** SRS §19.2 – proposed standard marketplace commission. */
  standardRate: 0.05,
  /** SRS §19.3 – proposed minimum per qualifying truck on approved international routes (USD). */
  minimumCommission: 300,
  /** SRS §21.6 – first qualifying booking window. */
  attributionWindowDays: 60,
  /** SRS §21.7 – new partners default to Starter for their first 90 days. */
  starterPeriodDays: 90,
} as const;

export type CommissionConfig = {
  rate: number;
  minimum: number;
  /** The minimum applies only where route, service and booking conditions qualify (SRS §19.3). */
  minimumApplies: boolean;
};

export const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

/** Encore standard commission = MAX(rate × freight, minimum) when the minimum applies. */
export function standardCommission(freightValue: number, cfg: Partial<CommissionConfig> = {}): number {
  assertMoney(freightValue);
  const rate = cfg.rate ?? COMMERCIAL_DEFAULTS.standardRate;
  const minimum = cfg.minimum ?? COMMERCIAL_DEFAULTS.minimumCommission;
  const pct = freightValue * rate;
  return round2(cfg.minimumApplies ? Math.max(pct, minimum) : pct);
}

export type ManagedMode = "additional" | "total_fee";

/**
 * Managed-logistics margin (SRS §19.4). The mode is explicit to prevent accidental
 * double charging: either it is added on top of the standard commission, or it IS
 * the agreed total Encore fee for the booking.
 */
export function encoreFee(
  freightValue: number,
  opts: { cfg?: Partial<CommissionConfig>; managedMargin?: number; managedMode?: ManagedMode } = {},
) {
  const standard = standardCommission(freightValue, opts.cfg);
  if (!opts.managedMargin) return { standard, managed: 0, total: standard };
  const managedBase = round2(freightValue * opts.managedMargin);
  if (opts.managedMode === "total_fee") return { standard: 0, managed: managedBase, total: managedBase };
  return { standard, managed: managedBase, total: round2(standard + managedBase) };
}

export type PartnerTier = "starter" | "growth" | "premier";
export const TIER_RATES: Record<PartnerTier, number> = { starter: 0.1, growth: 0.15, premier: 0.2 };

/** Tier by qualifying bookings in the quarter (SRS §21.7): 5–14 Growth, 15+ Premier. */
export function tierForBookings(qualifyingBookingsPerQuarter: number): PartnerTier {
  if (qualifyingBookingsPerQuarter >= 15) return "premier";
  if (qualifyingBookingsPerQuarter >= 5) return "growth";
  return "starter";
}

/** First 90 days default to Starter unless a special approval is recorded (SRS §21.7). */
export function effectiveTier(opts: { qualifyingBookingsPerQuarter: number; daysSinceActivation: number; specialApproval?: boolean }): PartnerTier {
  if (!opts.specialApproval && opts.daysSinceActivation < COMMERCIAL_DEFAULTS.starterPeriodDays) return "starter";
  return tierForBookings(opts.qualifyingBookingsPerQuarter);
}

/**
 * Partner reward with Encore minimum-retention protection (SRS §21.8):
 *   pool   = MAX(0, collected − minimumRetention)
 *   reward = MIN(tierRate × collected, pool)
 * Rewards are funded from Encore's collected commission, never from the freight price.
 */
export function partnerReward(opts: { collectedCommission: number; tierRate: number; minimumRetention?: number; minimumApplies?: boolean }) {
  assertMoney(opts.collectedCommission);
  const min = opts.minimumApplies === false ? 0 : opts.minimumRetention ?? COMMERCIAL_DEFAULTS.minimumCommission;
  const pool = round2(Math.max(0, opts.collectedCommission - min));
  const tierReward = round2(opts.collectedCommission * opts.tierRate);
  const reward = round2(Math.min(tierReward, pool));
  return { pool, tierReward, reward, encoreRetained: round2(opts.collectedCommission - reward) };
}

/** Referral attribution window check (SRS §21.6). */
export function withinAttributionWindow(introducedAt: Date, firstQualifyingBookingAt: Date, days: number = COMMERCIAL_DEFAULTS.attributionWindowDays): boolean {
  const ms = firstQualifyingBookingAt.getTime() - introducedAt.getTime();
  return ms >= 0 && ms <= days * 86_400_000;
}

export type RewardChecks = {
  attributionValid: boolean;
  bookingConfirmed: boolean;
  shipmentCompleted: boolean;
  podReviewed: boolean;
  feeCollected: boolean;
  financeReconciled: boolean;
  partnerCompliant: boolean;
  payoutApproved: boolean;
};

/** A partner reward only becomes payable when every condition of SRS §21.10 holds. */
export function rewardEligibility(c: RewardChecks): { eligible: boolean; missing: (keyof RewardChecks)[] } {
  const missing = (Object.keys(c) as (keyof RewardChecks)[]).filter((k) => !c[k]);
  return { eligible: missing.length === 0, missing };
}

/** Transporter settlement is per agreement, not "freight less a fixed percentage" (SRS §20.7). */
export function transporterNetPayable(opts: { agreedRate: number; deductions?: number; adjustments?: number; alreadyPaid?: number }) {
  const net = round2(opts.agreedRate - (opts.deductions ?? 0) + (opts.adjustments ?? 0));
  return { netPayable: net, outstanding: round2(net - (opts.alreadyPaid ?? 0)) };
}

function assertMoney(n: number) {
  if (!Number.isFinite(n) || n < 0) throw new RangeError("Amount must be a non-negative finite number");
}
