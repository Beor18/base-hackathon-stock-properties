import { getAddress, isAddress, type Address } from "viem";
import { z } from "zod";

/**
 * Shape of `deployment.json`, written by `scripts/deploy.ts` and read by the app (server and browser).
 * Kept apart from the loader so the deploy script can validate its output before writing it.
 */
const address = z
  .string()
  .refine((value) => isAddress(value, { strict: false }), "Invalid address")
  .transform((value): Address => getAddress(value));

const bps = z.number().int().min(0).max(10_000);
const seconds = z.number().int().positive();
const integerString = z.string().regex(/^\d+$/, "Expected an integer string");

export const deployedStockSchema = z.object({
  symbol: z.string(), // "AAPLc"
  ticker: z.string(), // "AAPL"
  name: z.string(), // "Apple Inc."
  token: address,
  decimals: z.number().int(),
  /** Price feed listed in the StockOracle: USD per whole token, `feedDecimals` decimals. */
  feed: address,
  feedDecimals: z.number().int(),
  /** Collateral required per USD of reservation, e.g. 12_500 = 125%. */
  collateralRatioBps: z.number().int().min(10_001).max(30_000),
  /** Real Base mainnet token this mock mirrors. Null on mainnet, where `token` is the real one. */
  mirrorOf: address.nullable(),
  /** Real Chainlink feed the demo feed is synced from. Null on mainnet. */
  mirrorFeed: address.nullable(),
});

export const payTokenSchema = z.object({
  symbol: z.string(),
  address,
  decimals: z.number().int(),
  /**
   * How to price the token in USD. Null means 1 token = 1 USD.
   * `tokensPerUsd`: the answer is how many tokens one USD buys (USD / ARS quotes pesos per dollar).
   */
  feed: z
    .object({
      address,
      decimals: z.number().int(),
      description: z.string(),
      quote: z.enum(["usdPerToken", "tokensPerUsd"]),
      /** Real Chainlink feed the demo feed is synced from. Null on mainnet. */
      mirrorFeed: address.nullable(),
    })
    .nullable(),
  /** Demo tokens only: the faucet tops an account up to this many token units. */
  faucetCap: integerString.nullable(),
});

export const productParamsSchema = z.object({
  reservationBps: z.object({ default: bps, min: bps, max: bps }),
  reservationFeeBps: bps,
  contributionFeeBps: bps,
  maxSlippageBps: bps,
  disputeWindowSeconds: seconds,
  claimWindowSeconds: seconds,
  arbitrationTimeoutSeconds: seconds,
  settlementMaxAgeSeconds: seconds,
  collateralMaxAgeSeconds: seconds,
});

export const deploymentSchema = z.object({
  network: z.enum(["local", "base-sepolia", "base"]),
  chainId: z.union([z.literal(31337), z.literal(84532), z.literal(8453)]),
  /** Public RPC endpoint. The server may override it with its own. */
  rpcUrl: z.url(),
  explorerUrl: z.url().nullable(),
  deployedAt: z.iso.datetime(),
  /** First block worth scanning for this deployment's events. */
  startBlock: z.number().int().nonnegative(),
  owner: address,
  treasury: address,
  /** Default arbiter of every reservation that does not name one. */
  arbiter: address,
  /** ERC-8021 Builder Code appended to every write, or null. */
  builderCode: z.string().min(1).nullable(),
  contracts: z.object({ stockOracle: address, reservationEscrow: address, goalRegistry: address }),
  /** DemoExchange on local and testnet; null on mainnet, where contributions go through the aggregator. */
  exchange: address.nullable(),
  /** Routers the escrow accepts for claim settlements. */
  routers: z.array(address).min(1),
  payTokens: z.object({ usdc: payTokenSchema, wars: payTokenSchema }),
  stocks: z.array(deployedStockSchema).min(1),
  params: productParamsSchema,
});

/** What the deploy script writes (addresses as plain strings). */
export type DeploymentInput = z.input<typeof deploymentSchema>;
export type Deployment = z.output<typeof deploymentSchema>;
export type DeployedStock = Deployment["stocks"][number];
export type DeployedPayToken = Deployment["payTokens"]["usdc"];
export type ProductParams = Deployment["params"];
