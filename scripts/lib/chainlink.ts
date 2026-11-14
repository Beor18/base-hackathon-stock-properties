import { getAddress, type Address, type Client } from "viem";
import { readContract } from "viem/actions";
import { z } from "zod";

import { aggregatorV3Abi } from "../../src/contracts/abis";
import { SOURCES, USD_ARS_FEED_NAME } from "./deploy-config";
import { fetchJson } from "./http";

const directoryEntrySchema = z.object({
  name: z.string(),
  proxyAddress: z.string().nullable().optional(),
  feedType: z.string().optional(),
  decimals: z.number().optional(),
  docs: z
    .object({
      baseAsset: z.string().optional(),
      productTypeCode: z.string().optional(),
      hidden: z.boolean().optional(),
    })
    .optional(),
});

export type DirectoryEntry = z.infer<typeof directoryEntrySchema>;

let directory: Promise<DirectoryEntry[]> | undefined;

/** Chainlink's public feed directory for Base mainnet, fetched once per run. */
export function getFeedDirectory(): Promise<DirectoryEntry[]> {
  directory ??= fetchJson(SOURCES.chainlinkDirectory).then((json) => z.array(directoryEntrySchema).parse(json));
  return directory;
}

/** Documented, market-hours tokenized stock price feeds, keyed by base asset (e.g. "AAPL"). */
export async function getStockFeeds(): Promise<Map<string, Address>> {
  const feeds = new Map<string, Address>();
  for (const entry of await getFeedDirectory()) {
    const docs = entry.docs;
    if (docs?.productTypeCode !== "primaryTokenizedPrice" || docs.hidden || entry.feedType === "247Price") continue;
    if (!docs.baseAsset || !entry.proxyAddress) continue;
    feeds.set(docs.baseAsset, getAddress(entry.proxyAddress));
  }
  return feeds;
}

export type FeedReading = { address: Address; decimals: number; answer: bigint; updatedAt: bigint; description: string };

/** Reads a feed onchain and checks it answers with a positive price. */
export async function readFeed(client: Client, address: Address): Promise<FeedReading> {
  const [decimals, description, round] = await Promise.all([
    readContract(client, { address, abi: aggregatorV3Abi, functionName: "decimals" }),
    readContract(client, { address, abi: aggregatorV3Abi, functionName: "description" }),
    readContract(client, { address, abi: aggregatorV3Abi, functionName: "latestRoundData" }),
  ]);
  const answer = round[1];
  if (answer <= 0n) throw new Error(`Feed ${address} (${description}) answered ${answer}`);
  return { address, decimals, answer, updatedAt: round[3], description };
}

/** The Chainlink USD / ARS feed on Base mainnet (Argentine pesos per US dollar), found in the directory. */
export async function discoverUsdArsFeed(client: Client): Promise<FeedReading> {
  const matches = (await getFeedDirectory()).filter(
    (entry) => entry.name === USD_ARS_FEED_NAME && entry.proxyAddress && !entry.docs?.hidden,
  );
  if (matches.length !== 1) throw new Error(`Expected one "${USD_ARS_FEED_NAME}" feed, found ${matches.length}`);

  const feed = await readFeed(client, getAddress(matches[0].proxyAddress!));
  if (feed.description !== USD_ARS_FEED_NAME) {
    throw new Error(`Feed ${feed.address} describes itself as "${feed.description}", not "${USD_ARS_FEED_NAME}"`);
  }
  return feed;
}

export function feedToNumber(answer: bigint, decimals: number): number {
  return Number(answer) / 10 ** decimals;
}
