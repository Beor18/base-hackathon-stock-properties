import { DEPOSIT_PCT, depositUsd } from "@/lib/product";

/**
 * Deposit (seña) parameters used by the UI. The range and the default come from the product
 * parameters in `deployment.json` (`params.reservationBps`), the same ones the planners enforce.
 */
export const DEPOSIT_PCT_DEFAULT = DEPOSIT_PCT.default;
export const DEPOSIT_PCT_MIN = DEPOSIT_PCT.min;
export const DEPOSIT_PCT_MAX = DEPOSIT_PCT.max;
/** Slider step. Presentation only. */
export const DEPOSIT_PCT_STEP = 0.5;

export { depositUsd };

export function clampPct(pct: number): number {
  if (!Number.isFinite(pct)) return DEPOSIT_PCT_DEFAULT;
  return Math.min(DEPOSIT_PCT_MAX, Math.max(DEPOSIT_PCT_MIN, pct));
}
