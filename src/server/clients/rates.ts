import "server-only";

import { cacheLife } from "next/cache";
import { getAddress, isAddress, parseAbi, type Address } from "viem";
import { z } from "zod";

import { mainnetClient as baseClient } from "./mainnet";

/**
 * Chainlink reference rates on Base mainnet. The feed address is discovered from Chainlink's
 * public feed directory (the data behind docs.chain.link), never hardcoded.
 */
const FEED_DIRECTORY_URL = "https://reference-data-directory.vercel.app/feeds-ethereum-mainnet-base-1.json";
const USD_ARS_FEED_NAME = "USD / ARS";

const directoryEntrySchema = z.object({
  name: z.string(),
  proxyAddress: z.string().refine((value) => isAddress(value), "Expected a feed address"),
  decimals: z.number().int().min(0).max(36),
});

const aggregatorAbi = parseAbi([
  "function latestRoundData() view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)",
]);


export type FeedInfo = { name: string; address: Address; decimals: number };

export type FeedReading = FeedInfo & {
  chainId: number;
  value: number;
  /** Unix seconds of the last on-chain update. */
  updatedAt: number;
};

async function findFeed(name: string): Promise<FeedInfo> {
  "use cache";
  cacheLife("days");

  const response = await fetch(FEED_DIRECTORY_URL, { headers: { accept: "application/json" } });
  if (!response.ok) throw new Error(`Chainlink feed directory responded ${response.status}`);

  const entries = z.array(z.object({ name: z.string().nullish() }).loose()).parse(await response.json());
  const entry = entries.find((candidate) => candidate.name === name);
  if (!entry) throw new Error(`Feed "${name}" is not listed in the Chainlink directory`);

  const feed = directoryEntrySchema.parse(entry);
  return { name: feed.name, address: getAddress(feed.proxyAddress), decimals: feed.decimals };
}

/** Latest USD/ARS answer: pesos per dollar. */
export async function readUsdArsFeed(): Promise<FeedReading> {
  "use cache";
  cacheLife("minutes");

  const feed = await findFeed(USD_ARS_FEED_NAME);
  const [, answer, , updatedAt] = await baseClient.readContract({
    address: feed.address,
    abi: aggregatorAbi,
    functionName: "latestRoundData",
  });
  if (answer <= 0n || updatedAt === 0n) throw new Error(`Feed "${feed.name}" has no valid answer`);

  return {
    ...feed,
    chainId: baseClient.chain.id,
    value: Number(answer) / 10 ** feed.decimals,
    updatedAt: Number(updatedAt),
  };
}
