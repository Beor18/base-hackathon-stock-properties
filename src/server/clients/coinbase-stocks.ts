import "server-only";

import { cacheLife } from "next/cache";
import { z } from "zod";

import { serverEnv } from "@/config/server-env";

/**
 * Client for Coinbase's public Tokenized Stocks API (read-only, no API key).
 * Docs: https://docs.base.org/sdks/tokenized-stocks/overview
 */
const tokenSchema = z.object({
  contract_address: z.string(),
  symbol: z.string(),
  name: z.string(),
  icon_url: z.string().optional(),
});

const pageSchema = z.object({
  tokens: z.array(tokenSchema).default([]),
  next_page_token: z.string().optional(),
});

export type StockMetadata = { symbol: string; name: string; iconUrl: string | null };

const PAGE_SIZE = 500;

/** Reference metadata for every Coinbase tokenized stock, keyed by lowercase contract address. */
export async function getStockMetadataByAddress(): Promise<Record<string, StockMetadata>> {
  "use cache";
  cacheLife("hours");

  const metadata: Record<string, StockMetadata> = {};
  let pageToken: string | undefined;

  do {
    const url = new URL(serverEnv.COINBASE_STOCKS_API_URL);
    url.searchParams.set("page_size", String(PAGE_SIZE));
    if (pageToken) url.searchParams.set("page_token", pageToken);

    const response = await fetch(url, { headers: { accept: "application/json" } });
    if (!response.ok) throw new Error(`Tokenized Stocks API responded ${response.status}`);

    const page = pageSchema.parse(await response.json());
    for (const token of page.tokens) {
      metadata[token.contract_address.toLowerCase()] = {
        symbol: token.symbol,
        name: token.name,
        iconUrl: token.icon_url ?? null,
      };
    }
    pageToken = page.next_page_token;
  } while (pageToken);

  return metadata;
}
