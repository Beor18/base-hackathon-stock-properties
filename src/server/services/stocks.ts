import "server-only";

import { cacheLife } from "next/cache";
import type { Address } from "viem";

import { mockStockTokenAbi, stockOracleAbi } from "@/contracts/abis";
import type { Stock } from "@/domain/types";
import { publicClient } from "@/server/chain";
import { getStockMetadataByAddress, type StockMetadata } from "@/server/clients/coinbase-stocks";

import { getProtocolConfig } from "./protocol";

/**
 * Stocks the escrow accepts. The onchain oracle is the source of truth for what is listed and at
 * which price; Coinbase's API only adds presentation data (name, icon).
 */
export async function listStocks(): Promise<Stock[]> {
  "use cache";
  cacheLife("seconds");

  const { oracleAddress } = await getProtocolConfig();
  const oracle = { address: oracleAddress, abi: stockOracleAbi } as const;

  const [tokens, metadataByAddress] = await Promise.all([
    publicClient.readContract({ ...oracle, functionName: "listedTokens" }),
    // Presentation data is optional: the app keeps working if the reference API is unreachable.
    getStockMetadataByAddress().catch((): Record<string, StockMetadata> => ({})),
  ]);

  const stocks = await Promise.all(tokens.map((token) => readStock(oracle, token, metadataByAddress)));
  return stocks.sort((a, b) => a.symbol.localeCompare(b.symbol));
}

export async function findStock(address: Address): Promise<Stock | undefined> {
  const stocks = await listStocks();
  return stocks.find((stock) => stock.address.toLowerCase() === address.toLowerCase());
}

async function readStock(
  oracle: { address: Address; abi: typeof stockOracleAbi },
  token: Address,
  metadataByAddress: Record<string, StockMetadata>,
): Promise<Stock> {
  const erc20 = { address: token, abi: mockStockTokenAbi } as const;

  const [listing, [priceUsd, priceUpdatedAt], onchainSymbol, onchainName, mirrorOf, faucetAmount] = await Promise.all([
    publicClient.readContract({ ...oracle, functionName: "getStock", args: [token] }),
    publicClient.readContract({ ...oracle, functionName: "latestPrice", args: [token] }),
    publicClient.readContract({ ...erc20, functionName: "symbol" }),
    publicClient.readContract({ ...erc20, functionName: "name" }),
    // Only demo tokens expose these two; on mainnet the calls fail and we fall back.
    publicClient.readContract({ ...erc20, functionName: "mirrorOf" }).catch(() => null),
    publicClient.readContract({ ...erc20, functionName: "faucetAmount" }).catch(() => 0n),
  ]);

  const metadata = metadataByAddress[(mirrorOf ?? token).toLowerCase()];

  return {
    address: token,
    symbol: onchainSymbol,
    name: metadata?.name ?? onchainName,
    decimals: listing.tokenDecimals,
    iconUrl: metadata?.iconUrl ?? null,
    priceUsd: priceUsd.toString(),
    priceUpdatedAt: Number(priceUpdatedAt),
    collateralRatioBps: listing.collateralRatioBps,
    enabled: listing.enabled,
    hasFaucet: faucetAmount > 0n,
  };
}
