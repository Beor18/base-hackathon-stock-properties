import "server-only";

import type { Address } from "viem";

import { collateralFor, feeFor, tokensToUsd } from "@/domain/collateral";
import type { CollateralQuote, Stock } from "@/domain/types";
import { NotFoundError } from "@/server/errors";

import { getProtocolConfig } from "./protocol";
import { listStocks } from "./stocks";

/**
 * How much of each accepted stock a tenant must lock to guarantee `coverageUsd`.
 * Also the integration point for listing portals: one call prices a guarantee for any rental.
 */
export async function quoteCollateral(coverageUsd: bigint, token?: Address): Promise<CollateralQuote[]> {
  const [stocks, protocol] = await Promise.all([listStocks(), getProtocolConfig()]);

  const candidates = stocks.filter(
    (stock) => stock.enabled && (!token || stock.address.toLowerCase() === token.toLowerCase()),
  );
  if (token && candidates.length === 0) throw new NotFoundError(`Stock ${token} is not accepted as collateral`);

  return candidates.map((stock) => quoteStock(stock, coverageUsd, protocol.feeBps));
}

function quoteStock(stock: Stock, coverageUsd: bigint, feeBps: number): CollateralQuote {
  const priceUsd = BigInt(stock.priceUsd);
  const pricing = { coverageUsd, priceUsd, tokenDecimals: stock.decimals };

  const collateral = collateralFor({ ...pricing, collateralRatioBps: stock.collateralRatioBps });
  const fee = feeFor({ ...pricing, feeBps });

  return {
    stock,
    coverageUsd: coverageUsd.toString(),
    collateral: collateral.toString(),
    collateralValueUsd: tokensToUsd(collateral, priceUsd, stock.decimals).toString(),
    fee: fee.toString(),
    feeUsd: tokensToUsd(fee, priceUsd, stock.decimals).toString(),
    totalTokens: (collateral + fee).toString(),
  };
}
