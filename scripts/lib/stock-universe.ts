import { BaseError, ContractFunctionRevertedError, erc20Abi, getAddress, type Address, type Client } from "viem";
import { readContract } from "viem/actions";
import { z } from "zod";

import { feedToNumber, getStockFeeds, readFeed, type FeedReading } from "./chainlink";
import { NAV_TOLERANCE, SOURCES } from "./deploy-config";
import { fetchJson } from "./http";
import { assessRisk, type RiskAssessment } from "./risk";

const PAGE_SIZE = 500;

const pageSchema = z.object({
  tokens: z
    .array(
      z.object({
        contract_address: z.string(),
        symbol: z.string(),
        name: z.string(),
        decimals: z.number(),
        nav_price: z.number().optional(),
      }),
    )
    .default([]),
  next_page_token: z.string().optional(),
});

type ListedToken = z.infer<typeof pageSchema>["tokens"][number];

/** A real tokenized stock on Base mainnet, with a verified Chainlink feed and a data-driven collateral ratio. */
export type UniverseStock = {
  symbol: string; // "AAPLc"
  ticker: string; // "AAPL": the feed's base asset and the market ticker
  name: string;
  token: Address;
  decimals: number;
  feed: Address;
  feedDecimals: number;
  answer: bigint;
  priceUsd: number;
  risk: RiskAssessment;
};

/**
 * Builds the stock universe from live sources, with no ticker list in the code:
 * 1. Coinbase's Tokenized Stocks API: every token with a published NAV.
 * 2. Chainlink's directory: documented market-hours feeds for tokenized stocks.
 * 3. Join on `baseAsset + "c"`, then verify onchain: the token's symbol and decimals, and that the
 *    feed agrees with the NAV. Anything that does not check out is skipped with a warning.
 */
export async function discoverStockUniverse(mainnet: Client): Promise<UniverseStock[]> {
  const [listed, feeds] = await Promise.all([fetchListedStocks(), getStockFeeds()]);
  const bySymbol = new Map(listed.map((token) => [token.symbol, token]));

  const candidates: { ticker: string; feed: Address; listing: ListedToken & { nav_price: number } }[] = [];
  for (const [ticker, feed] of feeds) {
    const listing = bySymbol.get(`${ticker}c`);
    if (!listing) {
      warn(`${ticker}: feed ${feed} has no tokenized stock listed`);
    } else if (!listing.nav_price) {
      warn(`${listing.symbol}: no NAV published, cannot verify its feed`);
    } else {
      candidates.push({ ticker, feed, listing: { ...listing, nav_price: listing.nav_price } });
    }
  }

  const verified = await Promise.all(candidates.map((candidate) => verifyCandidate(mainnet, candidate)));
  const universe = verified.filter((stock): stock is UniverseStock => stock !== null);
  if (universe.length === 0) throw new Error("No tokenized stock passed verification");
  return universe.sort((a, b) => a.symbol.localeCompare(b.symbol));
}

/** Verification mismatches skip the stock; a failing RPC or data source stops the deploy instead. */
async function verifyCandidate(
  mainnet: Client,
  { ticker, feed, listing }: { ticker: string; feed: Address; listing: ListedToken & { nav_price: number } },
): Promise<UniverseStock | null> {
  const token = getAddress(listing.contract_address);
  let symbol: string, decimals: number, reading: FeedReading;
  try {
    [symbol, decimals, reading] = await Promise.all([
      readContract(mainnet, { address: token, abi: erc20Abi, functionName: "symbol" }),
      readContract(mainnet, { address: token, abi: erc20Abi, functionName: "decimals" }),
      readFeed(mainnet, feed),
    ]);
  } catch (error) {
    if (error instanceof BaseError && error.walk((cause) => cause instanceof ContractFunctionRevertedError)) {
      return skip(`${listing.symbol}: token or feed reverted`);
    }
    throw new Error(`Could not verify ${listing.symbol} on Base mainnet: ${(error as Error).message.split("\n")[0]}`);
  }

  if (symbol !== listing.symbol || decimals !== listing.decimals) {
    return skip(`${listing.symbol}: onchain token reports ${symbol} with ${decimals} decimals`);
  }

  const priceUsd = feedToNumber(reading.answer, reading.decimals);
  const gap = Math.abs(priceUsd - listing.nav_price) / listing.nav_price;
  if (gap > NAV_TOLERANCE) {
    return skip(`${listing.symbol}: feed price ${priceUsd} is ${(gap * 100).toFixed(1)}% off NAV ${listing.nav_price}`);
  }

  const risk = await assessRisk(ticker, priceUsd);
  if (risk.fallback) warn(`${listing.symbol}: maximum collateral ratio, ${risk.fallback}`);

  return {
    symbol: listing.symbol,
    ticker,
    name: listing.name,
    token,
    decimals,
    feed,
    feedDecimals: reading.decimals,
    answer: reading.answer,
    priceUsd,
    risk,
  };
}

async function fetchListedStocks(): Promise<ListedToken[]> {
  const tokens: ListedToken[] = [];
  let pageToken: string | undefined;
  do {
    const url = new URL(SOURCES.tokenizedStocksApi);
    url.searchParams.set("page_size", String(PAGE_SIZE));
    if (pageToken) url.searchParams.set("page_token", pageToken);
    const page = pageSchema.parse(await fetchJson(url));
    tokens.push(...page.tokens);
    pageToken = page.next_page_token || undefined;
  } while (pageToken);
  return tokens;
}

function skip(message: string): null {
  warn(`${message}, skipped`);
  return null;
}

function warn(message: string) {
  console.warn(`  ! ${message}`);
}
