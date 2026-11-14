import type { Address } from "viem";

/** Reference USD/ARS exchange rate, as served by `GET /api/rates`. */
export interface UsdArsRate {
  /** Argentine pesos per US dollar. */
  arsPerUsd: number;
  /** ISO 8601 time of the last on-chain update. Forex feeds do not move on weekends. */
  updatedAt: string;
  /** Where the number comes from, for developers and the pitch. Not for the app's copy. */
  source: { name: string; chainId: number; address: Address };
}
