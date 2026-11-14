import "server-only";

import { cacheLife } from "next/cache";
import { erc20Abi, type Address } from "viem";

import { deployment } from "@/config/deployment";
import type { Stock } from "@/domain/types";
import { oracleContract, publicClient } from "@/server/chain";
import { getStockMetadataByAddress, type StockMetadata } from "@/server/clients/coinbase-stocks";
import { getChange12mPct } from "@/server/clients/stock-history";

/**
 * Stocks the app saves in. The onchain oracle is the source of truth for what is listed and at
 * which price; `deployment.json` and the reference API only add presentation data (ticker, icon).
 */
export async function listStocks(): Promise<Stock[]> {
  "use cache";
  cacheLife("seconds");

  const [tokens, metadataByAddress] = await Promise.all([
    publicClient.readContract({ ...oracleContract, functionName: "listedTokens" }),
    // Presentation data is optional: the app keeps working if the reference API is unreachable.
    getStockMetadataByAddress().catch((): Record<string, StockMetadata> => ({})),
  ]);

  const stocks = await Promise.all(tokens.map((token) => readStock(token, metadataByAddress)));
  return stocks.sort((a, b) => a.shortName.localeCompare(b.shortName));
}

export async function findStock(address: Address): Promise<Stock | undefined> {
  const stocks = await listStocks();
  return stocks.find((stock) => stock.address.toLowerCase() === address.toLowerCase());
}

export async function requireStock(address: Address): Promise<Stock> {
  const stock = await findStock(address);
  if (!stock) throw new Error(`The oracle does not list ${address}`);
  return stock;
}

async function readStock(token: Address, metadataByAddress: Record<string, StockMetadata>): Promise<Stock> {
  const deployed = deployment.stocks.find((stock) => stock.token.toLowerCase() === token.toLowerCase());

  const [listing, [priceUsd, priceUpdatedAt], onchainSymbol, onchainName] = await Promise.all([
    publicClient.readContract({ ...oracleContract, functionName: "getStock", args: [token] }),
    publicClient.readContract({ ...oracleContract, functionName: "latestPrice", args: [token] }),
    publicClient.readContract({ address: token, abi: erc20Abi, functionName: "symbol" }),
    publicClient.readContract({ address: token, abi: erc20Abi, functionName: "name" }),
  ]);

  // Demo tokens mirror a real one: its metadata (name, icon) is keyed by the real address.
  const metadata = metadataByAddress[(deployed?.mirrorOf ?? token).toLowerCase()];
  const ticker = deployed?.ticker ?? onchainSymbol.replace(/c$/, "");
  const name = deployed?.name ?? metadata?.name ?? onchainName;

  return {
    address: token,
    symbol: onchainSymbol,
    ticker,
    name,
    shortName: shortCompanyName(name),
    decimals: listing.tokenDecimals,
    iconUrl: metadata?.iconUrl ?? null,
    priceUsd: priceUsd.toString(),
    priceUpdatedAt: Number(priceUpdatedAt),
    collateralRatioBps: listing.collateralRatioBps,
    enabled: listing.enabled,
    change12mPct: await getChange12mPct(ticker),
  };
}

const LEGAL_SUFFIX =
  /[,\s]+(inc\.?|incorporated|corporation|corp\.?|co\.?|ltd\.?|plc|n\.v\.|s\.a\.|holdings?|group|platforms|internet|companies|technologies)$/i;

/** "Apple Inc." → "Apple", "Amazon.com Inc." → "Amazon", "NVIDIA Corporation" → "Nvidia". */
export function shortCompanyName(name: string): string {
  let short = name.trim();
  for (let previous = ""; previous !== short; ) {
    previous = short;
    short = short.replace(LEGAL_SUFFIX, "").replace(/\.com$/i, "").trim();
  }
  if (!short) return name;
  return short
    .split(" ")
    .map((word) => (word.length >= 5 && word === word.toUpperCase() ? word[0] + word.slice(1).toLowerCase() : word))
    .join(" ");
}
