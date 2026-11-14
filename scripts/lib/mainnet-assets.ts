import { erc20Abi, getAddress, type Address, type Client } from "viem";
import { getCode, readContract } from "viem/actions";
import { z } from "zod";

import { NETWORKS, PAY_TOKENS, SOURCES } from "./deploy-config";
import { fetchJson } from "./http";

const tokenListSchema = z.object({
  tokens: z.array(z.object({ chainId: z.number(), address: z.string(), symbol: z.string(), decimals: z.number() })),
});

export type VerifiedToken = { symbol: string; address: Address; decimals: number };

/**
 * USDC and wARS on Base mainnet, taken from a public token list and then verified onchain:
 * the contract must report exactly the expected symbol and decimals.
 */
export async function discoverPayTokens(mainnet: Client): Promise<{ usdc: VerifiedToken; wars: VerifiedToken }> {
  const list = tokenListSchema.parse(await fetchJson(SOURCES.baseTokenList));
  const [usdc, wars] = await Promise.all([
    findVerified(mainnet, list.tokens, PAY_TOKENS.usdc),
    findVerified(mainnet, list.tokens, PAY_TOKENS.wars),
  ]);
  return { usdc, wars };
}

async function findVerified(
  mainnet: Client,
  tokens: z.infer<typeof tokenListSchema>["tokens"],
  expected: { symbol: string; decimals: number },
): Promise<VerifiedToken> {
  // Token lists normalize symbol case (wARS is listed as "WARS"); the onchain check is exact.
  const matches = tokens.filter(
    (token) =>
      token.chainId === NETWORKS.base.chainId && token.symbol.toLowerCase() === expected.symbol.toLowerCase(),
  );
  if (matches.length !== 1) {
    throw new Error(`Expected one ${expected.symbol} in ${SOURCES.baseTokenList}, found ${matches.length}`);
  }

  const address = getAddress(matches[0].address);
  const [symbol, decimals] = await Promise.all([
    readContract(mainnet, { address, abi: erc20Abi, functionName: "symbol" }),
    readContract(mainnet, { address, abi: erc20Abi, functionName: "decimals" }),
  ]);
  if (symbol !== expected.symbol || decimals !== expected.decimals) {
    throw new Error(
      `${address} reports ${symbol} with ${decimals} decimals, expected ${expected.symbol} with ${expected.decimals}`,
    );
  }
  return { symbol, address, decimals };
}

const routeSchema = z.object({
  code: z.number(),
  message: z.string().optional(),
  data: z.object({ routerAddress: z.string() }).optional(),
});

/**
 * The KyberSwap router, taken from a live route quote (stock -> USDC) and checked to be a contract.
 * This is the address the escrow whitelists for claim settlements on mainnet.
 */
export async function discoverAggregatorRouter(
  mainnet: Client,
  quote: { tokenIn: Address; tokenOut: Address; amountIn: bigint },
): Promise<Address> {
  const url = new URL(`${SOURCES.kyberAggregator}/routes`);
  url.searchParams.set("tokenIn", quote.tokenIn);
  url.searchParams.set("tokenOut", quote.tokenOut);
  url.searchParams.set("amountIn", quote.amountIn.toString());

  const response = routeSchema.parse(await fetchJson(url, { "x-client-id": SOURCES.kyberClientId }));
  if (response.code !== 0 || !response.data) {
    throw new Error(`KyberSwap returned no route: ${response.message ?? response.code}`);
  }

  const router = getAddress(response.data.routerAddress);
  const code = await getCode(mainnet, { address: router });
  if (!code || code === "0x") throw new Error(`KyberSwap router ${router} has no code on Base`);
  return router;
}
