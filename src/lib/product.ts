import { deployment, isMainnet } from "@/config/deployment";

/**
 * Product rules the app applies on top of `deployment.json` (which holds the ones the contracts
 * enforce: seña range, fees, windows). Shared by the planners and the screens so they never disagree.
 */

/** Seña as a percentage of the price: default and the range the person can pick. */
export const DEPOSIT_PCT = {
  default: deployment.params.reservationBps.default / 100,
  min: deployment.params.reservationBps.min / 100,
  max: deployment.params.reservationBps.max / 100,
} as const;

/** Smallest contribution, in USD ("Desde USD 5"). Keeps fees and price rounding meaningful. */
export const MIN_CONTRIBUTION_USD = 5;

/** A reservation ends this many days after it is made (the expected closing date of the deal). */
export const RESERVATION_DAYS = 60;

/** Maximum price move accepted between quoting a contribution and its execution, in basis points. */
export const CONTRIBUTION_SLIPPAGE_BPS = 100;

/**
 * External service to buy digital dollars or pesos with a bank transfer. Mainnet only: on test
 * networks the test balance button replaces it. The copy never names it.
 */
export const RAMP_URL: string | null = isMainnet ? "https://www.ripio.com/ar/" : null;

/** The seña in whole dollars, as shown everywhere in the app. */
export function depositUsd(priceUsd: number, pct: number): number {
  return Math.round(priceUsd * (pct / 100));
}

export function isValidDepositPct(pct: number): boolean {
  return Number.isFinite(pct) && pct >= DEPOSIT_PCT.min && pct <= DEPOSIT_PCT.max;
}
