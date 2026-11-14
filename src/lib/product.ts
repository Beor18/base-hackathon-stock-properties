import { deployment } from "@/config/deployment";

/**
 * Product rules, all read from `deployment.json` (set in `scripts/lib/deploy-config.ts`). Shared by
 * the planners and the screens so they never disagree.
 */

/** Seña as a percentage of the price: default and the range the person can pick. */
export const DEPOSIT_PCT = {
  default: deployment.params.reservationBps.default / 100,
  min: deployment.params.reservationBps.min / 100,
  max: deployment.params.reservationBps.max / 100,
} as const;

/** Smallest contribution, in USD ("Desde USD 5"). */
export const MIN_CONTRIBUTION_USD = deployment.params.minContributionUsd;

/** A reservation ends this many days after it is made (the expected closing date of the deal). */
export const RESERVATION_DAYS = deployment.params.reservationDays;

/** Maximum price move accepted between quoting a contribution and its execution, in basis points. */
export const CONTRIBUTION_SLIPPAGE_BPS = deployment.params.contributionSlippageBps;

/** Where to buy digital dollars or pesos with a bank transfer; null on test networks. Never named in copy. */
export const RAMP_URL = deployment.rampUrl;

/** The seña in whole dollars, as shown everywhere in the app. */
export function depositUsd(priceUsd: number, pct: number): number {
  return Math.round(priceUsd * (pct / 100));
}

export function isValidDepositPct(pct: number): boolean {
  return Number.isFinite(pct) && pct >= DEPOSIT_PCT.min && pct <= DEPOSIT_PCT.max;
}
