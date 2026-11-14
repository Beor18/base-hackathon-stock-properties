import { concat, createPublicClient, http, type Hash, type Hex } from "viem";
import { Attribution } from "ox/erc8021";

import { getChain } from "@/config/chains";
import { deployment } from "@/config/deployment";

/** The active chain, from `deployment.json`. */
export const activeChain = getChain(deployment.chainId);

/** Browser read client, only used to wait for receipts (protocol data comes from the API routes). */
export const browserClient = createPublicClient({ chain: activeChain, transport: http(deployment.rpcUrl) });

/** ERC-8021 Builder Code suffix, or null when the deployment has none. */
export const builderSuffix: Hex | null = deployment.builderCode
  ? Attribution.toDataSuffix({ codes: [deployment.builderCode] })
  : null;

/** Appends the Builder Code to plain transactions (smart accounts get it from the Privy plugin). */
export function withBuilderCode(data: Hex): Hex {
  return builderSuffix ? concat([data, builderSuffix]) : data;
}

export class TransactionRevertedError extends Error {
  constructor(readonly hash: Hash) {
    super(`Transaction ${hash} reverted`);
    this.name = "TransactionRevertedError";
  }
}

/** Waits until the transaction is in a block, failing if it reverted. */
export async function waitForSuccess(hash: Hash): Promise<void> {
  const receipt = await browserClient.waitForTransactionReceipt({ hash, timeout: 120_000 });
  if (receipt.status !== "success") throw new TransactionRevertedError(hash);
}
