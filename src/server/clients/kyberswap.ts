import "server-only";

import { getAddress, isHex, type Address, type Hex } from "viem";
import { z } from "zod";

import { serverEnv } from "@/config/server-env";
import { ConflictError } from "@/server/errors";

/**
 * KyberSwap aggregator on Base (keyless). Used on mainnet only: contributions (pay token -> stock,
 * with the contribution fee sent to the treasury) and claim settlements (stock -> USDC, built with
 * the escrow as sender and recipient).
 * Docs: https://docs.kyberswap.com/kyberswap-solutions/kyberswap-aggregator/aggregator-api-specification/evm-swaps
 */
const API = "https://aggregator-api.kyberswap.com/base/api/v1";
const TIMEOUT_MS = 10_000;

const routeSummarySchema = z.looseObject({ amountIn: z.string(), amountOut: z.string() });

const routesSchema = z.object({
  code: z.number(),
  message: z.string().optional(),
  data: z.object({ routeSummary: routeSummarySchema, routerAddress: z.string() }).optional(),
});

const buildSchema = z.object({
  code: z.number(),
  message: z.string().optional(),
  data: z
    .object({
      data: z.string().refine((value) => isHex(value), "Expected calldata"),
      routerAddress: z.string(),
      amountIn: z.string(),
      amountOut: z.string(),
      transactionValue: z.string().optional(),
    })
    .optional(),
});

export type SwapRoute = { routeSummary: z.infer<typeof routeSummarySchema>; routerAddress: Address; amountOut: bigint };
export type BuiltSwap = { router: Address; data: Hex; amountIn: bigint; amountOut: bigint; value: bigint };

/** A fee taken from the input token and sent to `receiver`. */
export type SwapFee = { bps: number; receiver: Address };

function headers(): Record<string, string> {
  return { accept: "application/json", "x-client-id": serverEnv.SWAP_CLIENT_ID };
}

function noRoute(detail: string): ConflictError {
  return new ConflictError("no_route", `No swap route right now: ${detail}`);
}

export async function getSwapRoute(params: {
  tokenIn: Address;
  tokenOut: Address;
  amountIn: bigint;
  fee?: SwapFee;
  origin?: Address;
}): Promise<SwapRoute> {
  const url = new URL(`${API}/routes`);
  url.searchParams.set("tokenIn", params.tokenIn);
  url.searchParams.set("tokenOut", params.tokenOut);
  url.searchParams.set("amountIn", params.amountIn.toString());
  if (params.origin) url.searchParams.set("origin", params.origin);
  if (params.fee && params.fee.bps > 0) {
    url.searchParams.set("feeAmount", String(params.fee.bps));
    url.searchParams.set("isInBps", "true");
    url.searchParams.set("chargeFeeBy", "currency_in");
    url.searchParams.set("feeReceiver", params.fee.receiver);
  }

  const response = await fetch(url, { headers: headers(), signal: AbortSignal.timeout(TIMEOUT_MS) }).catch(() => {
    throw noRoute("aggregator unreachable");
  });
  const body = routesSchema.safeParse(await response.json().catch(() => null));
  if (!body.success || body.data.code !== 0 || !body.data.data) {
    throw noRoute(body.success ? (body.data.message ?? String(body.data.code)) : `HTTP ${response.status}`);
  }

  return {
    routeSummary: body.data.data.routeSummary,
    routerAddress: getAddress(body.data.data.routerAddress),
    amountOut: BigInt(body.data.data.routeSummary.amountOut),
  };
}

export async function buildSwap(params: {
  route: SwapRoute;
  sender: Address;
  recipient: Address;
  slippageBps: number;
  origin?: Address;
}): Promise<BuiltSwap> {
  const response = await fetch(`${API}/route/build`, {
    method: "POST",
    headers: { ...headers(), "content-type": "application/json" },
    body: JSON.stringify({
      routeSummary: params.route.routeSummary,
      sender: params.sender,
      recipient: params.recipient,
      origin: params.origin ?? params.sender,
      slippageTolerance: params.slippageBps,
      deadline: Math.floor(Date.now() / 1000) + 20 * 60,
      source: serverEnv.SWAP_CLIENT_ID,
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  }).catch(() => {
    throw noRoute("aggregator unreachable");
  });

  const body = buildSchema.safeParse(await response.json().catch(() => null));
  if (!body.success || body.data.code !== 0 || !body.data.data) {
    throw noRoute(body.success ? (body.data.message ?? String(body.data.code)) : `HTTP ${response.status}`);
  }

  const built = body.data.data;
  return {
    router: getAddress(built.routerAddress),
    data: built.data as Hex,
    amountIn: BigInt(built.amountIn),
    amountOut: BigInt(built.amountOut),
    value: BigInt(built.transactionValue ?? "0"),
  };
}
