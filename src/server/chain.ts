import "server-only";

import { createPublicClient, http } from "viem";

import { getChain } from "@/config/chains";
import { publicEnv } from "@/config/public-env";
import { serverEnv } from "@/config/server-env";
import { guaranteeEscrowAbi } from "@/contracts/abis";

export const chain = getChain(publicEnv.chainId);

/** Read-only client. Calls made in the same tick are grouped into one JSON-RPC batch. */
export const publicClient = createPublicClient({
  chain,
  transport: http(serverEnv.RPC_URL ?? publicEnv.rpcUrl, { batch: true }),
});

export const escrowContract = { address: publicEnv.escrowAddress, abi: guaranteeEscrowAbi } as const;

/** Chain time, not server time: every deadline in the escrow is evaluated against block timestamps. */
export async function getChainTime(): Promise<number> {
  const block = await publicClient.getBlock({ blockTag: "latest" });
  return Number(block.timestamp);
}
