import "server-only";

import { parseAbi, type Address } from "viem";

import { mainnetClient } from "./mainnet";

/**
 * Coinbase's onchain oracle registry on Base mainnet (docs.base.org, "List tokenized stocks"). It holds
 * each tokenized stock's multiplier and a pause flag. The flag is set during corporate actions (a
 * split, for instance): the price feed freezes on its last value until both price and multiplier are
 * updated, and nothing should settle against a frozen price.
 */
export const ORACLE_REGISTRY: Address = "0x3f3E8cf41cdd3b1D118c16471aB0113DfDDd5CaD";

const registryAbi = parseAbi(["function getOracleParams(address token) view returns (uint256 multiplier, bool paused)"]);

/**
 * The real (mainnet) tokens that are paused right now, lowercased. One multicall for all of them.
 * A token the registry can't answer for counts as not paused: the contracts' own staleness limits
 * still apply.
 */
export async function readPausedTokens(tokens: Address[]): Promise<Set<string>> {
  if (tokens.length === 0) return new Set();
  const results = await mainnetClient.multicall({
    allowFailure: true,
    contracts: tokens.map((token) => ({ address: ORACLE_REGISTRY, abi: registryAbi, functionName: "getOracleParams", args: [token] }) as const),
  });
  const paused = new Set<string>();
  results.forEach((result, index) => {
    if (result.status === "success" && result.result[1]) paused.add(tokens[index].toLowerCase());
  });
  return paused;
}
