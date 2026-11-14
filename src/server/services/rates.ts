import "server-only";

import type { UsdArsRate } from "@/domain/rates";
import { readUsdArsFeed } from "@/server/clients/rates";

/** Live USD/ARS reference rate. */
export async function getUsdArsRate(): Promise<UsdArsRate> {
  const feed = await readUsdArsFeed();
  return {
    arsPerUsd: feed.value,
    updatedAt: new Date(feed.updatedAt * 1000).toISOString(),
    source: { name: `Chainlink ${feed.name}`, chainId: feed.chainId, address: feed.address },
  };
}

/** Pesos to dollars, rounded to cents. */
export function arsToUsd(amountArs: number, rate: UsdArsRate): number {
  return Math.round((amountArs / rate.arsPerUsd) * 100) / 100;
}
