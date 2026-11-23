import type { Stock } from "./types";

/**
 * Whether a stock's price can be used right now, decided the way the contracts decide it:
 * - `paused`: Coinbase paused the stock for a corporate action. Its price is frozen; nothing locks or
 *   settles until the pause ends. (The app enforces this; the testnet contracts only check age.)
 * - `closed`: the last price is older than the contract accepts for this use. Feeds follow US market
 *   hours, so a claim waits for a same-day price on nights and weekends; locking accepts a few days.
 * - `open`: the contract will accept the price.
 */
export type StockMarket = "open" | "closed" | "paused";

/** `lock`: reserve or top up (collateral price). `settle`: pay a broker's claim (settlement price). */
export type PriceUse = "lock" | "settle";

export type PriceLimits = { settlementMaxAgeSeconds: number; collateralMaxAgeSeconds: number };

export function stockMarket(
  stock: Pick<Stock, "paused" | "priceUpdatedAt">,
  use: PriceUse,
  nowSeconds: number,
  limits: PriceLimits,
): StockMarket {
  if (stock.paused) return "paused";
  const maxAge = use === "settle" ? limits.settlementMaxAgeSeconds : limits.collateralMaxAgeSeconds;
  return nowSeconds - stock.priceUpdatedAt > maxAge ? "closed" : "open";
}
