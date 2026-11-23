import "server-only";

import { createPublicClient, http } from "viem";
import { base } from "viem/chains";

import { serverEnv } from "@/config/server-env";

/**
 * Always Base mainnet, whatever chain the app runs on: reference rates and the tokenized-stock
 * registry are real data even when Accasa runs on a testnet.
 */
export const mainnetClient = createPublicClient({ chain: base, transport: http(serverEnv.BASE_MAINNET_RPC_URL) });
