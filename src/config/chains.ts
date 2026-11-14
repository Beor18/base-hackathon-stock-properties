import type { Chain } from "viem";
import { base, baseSepolia, foundry } from "viem/chains";

/** Networks the app can run against: Base mainnet, its testnet and a local Anvil node. */
export const SUPPORTED_CHAINS = [base, baseSepolia, foundry] as const satisfies readonly Chain[];

export type SupportedChainId = (typeof SUPPORTED_CHAINS)[number]["id"];

export function isSupportedChainId(chainId: number): chainId is SupportedChainId {
  return SUPPORTED_CHAINS.some((chain) => chain.id === chainId);
}

export function getChain(chainId: SupportedChainId): Chain {
  const chain = SUPPORTED_CHAINS.find((candidate) => candidate.id === chainId);
  if (!chain) throw new Error(`Unsupported chain id ${chainId}`);
  return chain;
}

/** Real tokenized stocks only exist on Base mainnet; every other network uses demo tokens. */
export function hasRealStocks(chainId: number): boolean {
  return chainId === base.id;
}
