import "server-only";

import type { Address } from "viem";

import { BPS, collateralFor, feeFor, tokensToUsd } from "@/domain/collateral";
import type { CollateralQuote, Stock } from "@/domain/types";
import { NotFoundError } from "@/server/errors";

import { getProtocolConfig } from "./protocol";
import { listStocks } from "./stocks";

/**
 * How much of each accepted stock an account must hold to reserve `coverageUsd` (a seña).
 * Also the integration point for listing portals: one call prices a reservation for any property.
 */
export async function quoteCollateral(coverageUsd: bigint, token?: Address): Promise<CollateralQuote[]> {
  const [stocks, protocol] = await Promise.all([listStocks(), getProtocolConfig()]);

  const candidates = stocks.filter(
    (stock) => stock.enabled && (!token || stock.address.toLowerCase() === token.toLowerCase()),
  );
  if (token && candidates.length === 0) throw new NotFoundError(`Stock ${token} is not accepted`);

  return candidates.map((stock) => quoteStock(stock, coverageUsd, protocol.reservationFeeBps));
}

/** Pure quote at the stock's current oracle price. Mirrors the contract's rounding. */
export function quoteStock(stock: Stock, coverageUsd: bigint, feeBps: number): CollateralQuote {
  const priceUsd = BigInt(stock.priceUsd);
  const pricing = { coverageUsd, priceUsd, tokenDecimals: stock.decimals };

  const collateral = collateralFor({ ...pricing, collateralRatioBps: stock.collateralRatioBps });
  const fee = feeFor({ ...pricing, feeBps });
  const totalTokens = collateral + fee;

  return {
    stock,
    coverageUsd: coverageUsd.toString(),
    collateral: collateral.toString(),
    collateralValueUsd: tokensToUsd(collateral, priceUsd, stock.decimals).toString(),
    fee: fee.toString(),
    // What the escrow charges. `fee` in tokens is padded for the approval; the person pays this.
    feeUsd: ((coverageUsd * BigInt(feeBps)) / BPS).toString(),
    totalTokens: totalTokens.toString(),
    totalValueUsd: tokensToUsd(totalTokens, priceUsd, stock.decimals).toString(),
  };
}
