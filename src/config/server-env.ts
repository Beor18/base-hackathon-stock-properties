import "server-only";

import { z } from "zod";

const emptyToUndefined = (value: unknown) => (value === "" ? undefined : value);

const schema = z.object({
  /** Private RPC endpoint for server-side reads. Falls back to the public one. */
  RPC_URL: z.preprocess(emptyToUndefined, z.url().optional()),
  /** Coinbase's public, keyless reference API for tokenized stocks on Base. */
  COINBASE_STOCKS_API_URL: z.preprocess(emptyToUndefined, z.url().default("https://api.coinbase.com/v1/tokenized-stocks")),
  /** KyberSwap asks integrators to identify themselves; the aggregator itself is keyless. */
  SWAP_CLIENT_ID: z.preprocess(emptyToUndefined, z.string().default("accasa")),
  /** Smarlin's public property API (our own product). Override only to point at a preview deploy. */
  SMARLIN_API_URL: z.preprocess(emptyToUndefined, z.url().default("https://www.smarlin.com")),
  /** Base mainnet RPC for the USD/ARS reference rate, read on mainnet whatever chain the app runs on. */
  BASE_MAINNET_RPC_URL: z.preprocess(emptyToUndefined, z.url().default("https://mainnet.base.org")),
  /** Accasa's database (Supabase): broker offers and inbox state. The URL is public. */
  SUPABASE_URL: z.preprocess(emptyToUndefined, z.url().default("https://egidprkmchknhklpfdpf.supabase.co")),
  /** Supabase secret key (service role). Without it, broker links and the inbox answer 503. */
  SUPABASE_SECRET_KEY: z.preprocess(emptyToUndefined, z.string().min(20).optional()),
  /** Privy app the identity tokens must be issued for (the same public id the browser uses). */
  PRIVY_APP_ID: z.preprocess(emptyToUndefined, z.string().optional()),
  /**
   * Testnets only: tickers to show as paused ("AAPL,TSLA"), to film how Accasa reacts to a
   * corporate-action pause without waiting for a real one. Ignored on Base mainnet.
   */
  DEMO_PAUSED_TICKERS: z.preprocess(emptyToUndefined, z.string().optional()),
});

export const serverEnv = schema.parse({
  RPC_URL: process.env.RPC_URL,
  COINBASE_STOCKS_API_URL: process.env.COINBASE_STOCKS_API_URL,
  SWAP_CLIENT_ID: process.env.SWAP_CLIENT_ID,
  SMARLIN_API_URL: process.env.SMARLIN_API_URL,
  BASE_MAINNET_RPC_URL: process.env.BASE_MAINNET_RPC_URL,
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY,
  PRIVY_APP_ID: process.env.NEXT_PUBLIC_PRIVY_APP_ID?.trim(),
  DEMO_PAUSED_TICKERS: process.env.DEMO_PAUSED_TICKERS,
});
