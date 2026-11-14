import "server-only";

import { createPublicClient, http } from "viem";

import { getChain } from "@/config/chains";
import { deployment } from "@/config/deployment";
import { serverEnv } from "@/config/server-env";
import { demoExchangeAbi, goalRegistryAbi, reservationEscrowAbi, stockOracleAbi } from "@/contracts/abis";

export const chain = getChain(deployment.chainId);

/** Read-only client. Calls made in the same tick are grouped into one JSON-RPC batch. */
export const publicClient = createPublicClient({
  chain,
  transport: http(serverEnv.RPC_URL ?? deployment.rpcUrl, { batch: true }),
});

export const escrowContract = { address: deployment.contracts.reservationEscrow, abi: reservationEscrowAbi } as const;
export const goalRegistryContract = { address: deployment.contracts.goalRegistry, abi: goalRegistryAbi } as const;
export const oracleContract = { address: deployment.contracts.stockOracle, abi: stockOracleAbi } as const;

/** The demo market (local and testnet only). Null on mainnet, where contributions go through the aggregator. */
export const exchangeContract = deployment.exchange
  ? ({ address: deployment.exchange, abi: demoExchangeAbi } as const)
  : null;

/** Chain time, not server time: every deadline in the escrow is evaluated against block timestamps. */
export async function getChainTime(): Promise<number> {
  const block = await publicClient.getBlock({ blockTag: "latest" });
  return Number(block.timestamp);
}
