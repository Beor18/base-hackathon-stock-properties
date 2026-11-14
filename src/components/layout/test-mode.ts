import { deployment } from "@/config/deployment";

/**
 * Whether the app runs against a test network, which shows the "Modo prueba" badge and the
 * test balance button. Base mainnet (8453) is real money; Base Sepolia and the local chain are not.
 */
export function isTestMode(chainId: number = deployment.chainId): boolean {
  return chainId !== 8453;
}
