import "server-only";

import { cacheLife } from "next/cache";
import { erc20Abi, type Address } from "viem";

import { deployment } from "@/config/deployment";
import type { Stock } from "@/domain/types";
import { oracleContract, publicClient } from "@/server/chain";
import { serverEnv } from "@/config/server-env";
import { getStockMetadataByAddress, type StockMetadata } from "@/server/clients/coinbase-stocks";
import { readPausedTokens } from "@/server/clients/stock-registry";
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

  const paused = await pausedTokens(tokens);
  const stocks = await Promise.all(tokens.map((token) => readStock(token, metadataByAddress, paused)));
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

/** The real stock behind a token: itself on mainnet, the stock it mirrors on a testnet. */
function realToken(token: Address): Address {
  const deployed = deployment.stocks.find((stock) => stock.token.toLowerCase() === token.toLowerCase());
  return (deployed?.mirrorOf as Address | undefined) ?? token;
}

/**
 * Tokens whose real stock is paused on the registry, lowercased. Plus, on testnets, the tickers in
 * `DEMO_PAUSED_TICKERS`. A registry outage never blocks the app: it logs and counts nothing as paused.
 */
async function pausedTokens(tokens: readonly Address[]): Promise<Set<string>> {
  const real = tokens.map(realToken);
  const pausedReal = await readPausedTokens(real).catch((error: unknown) => {
    console.warn("[stocks] could not read the pause registry", error);
    return new Set<string>();
  });
  const demoTickers =
    deployment.chainId === 8453
      ? []
      : (serverEnv.DEMO_PAUSED_TICKERS ?? "").split(",").map((ticker) => ticker.trim().toUpperCase()).filter(Boolean);

  const paused = new Set<string>();
  tokens.forEach((token, index) => {
    const ticker = deployment.stocks.find((stock) => stock.token.toLowerCase() === token.toLowerCase())?.ticker?.toUpperCase();
    if (pausedReal.has(real[index].toLowerCase()) || (ticker && demoTickers.includes(ticker))) paused.add(token.toLowerCase());
  });
  return paused;
}

async function readStock(token: Address, metadataByAddress: Record<string, StockMetadata>, paused: Set<string>): Promise<Stock> {
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
    paused: paused.has(token.toLowerCase()),
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
