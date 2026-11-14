import { deployment } from "@/config/deployment";

/**
 * Whether the app runs against a test network, which offers the welcome balance (the faucet).
 * Base mainnet (8453) moves money; Base Sepolia and the local chain do not.
 */
export function isTestMode(chainId: number = deployment.chainId): boolean {
  return chainId !== 8453;
}
