/**
 * Deposit (seña) parameters used by the UI.
 *
 * INTEGRATION: these mirror product parameters from the spec (§2: default 5 %, adjustable 1–10 %).
 * When the single product configuration file exists, import the values from there and delete
 * these constants so the UI and the planners never disagree.
 */
export const DEPOSIT_PCT_DEFAULT = 5;
export const DEPOSIT_PCT_MIN = 1;
export const DEPOSIT_PCT_MAX = 10;
export const DEPOSIT_PCT_STEP = 0.5;

export function depositUsd(priceUsd: number, pct: number): number {
  return Math.round(priceUsd * (pct / 100));
}

export function clampPct(pct: number): number {
  if (!Number.isFinite(pct)) return DEPOSIT_PCT_DEFAULT;
  return Math.min(DEPOSIT_PCT_MAX, Math.max(DEPOSIT_PCT_MIN, pct));
}
