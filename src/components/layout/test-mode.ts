/**
 * Whether the app runs against a test network, which shows the "Modo prueba" badge and the
 * test balance button.
 *
 * INTEGRATION: read the active chain from `src/config/deployment.json` once the deploy script
 * writes it (8453 is real money; 84532 and 31337 are test networks). Until then every
 * deployment of this app is local or testnet, so the badge is on.
 */
export function isTestMode(chainId?: number): boolean {
  if (chainId === undefined) return true;
  return chainId !== 8453;
}
