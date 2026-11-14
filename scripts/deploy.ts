/**
 * Deploys Seña and writes `deployments/<chainId>.json` plus the app's `src/config/deployment.json`.
 *
 *   npm run deploy -- --network local|base-sepolia|base [--builder-code bc_xxx]
 *                     [--arbiter 0x..] [--treasury 0x..] [--rpc-url https://..]
 *
 * Public networks sign with DEPLOYER_PRIVATE_KEY. Local uses the node's unlocked accounts.
 */
import { parseArgs } from "node:util";

import { getAddress, isAddress, type Address } from "viem";

import { isNetworkName } from "./lib/deploy-config";
import { runDeploy } from "./lib/deploy";

const { values } = parseArgs({
  options: {
    network: { type: "string" },
    "rpc-url": { type: "string" },
    "builder-code": { type: "string" },
    arbiter: { type: "string" },
    treasury: { type: "string" },
  },
});

function optionalAddress(flag: string, value: string | undefined): Address | undefined {
  if (value === undefined) return undefined;
  if (!isAddress(value, { strict: false })) throw new Error(`--${flag} must be an address`);
  return getAddress(value);
}

const network = values.network ?? "";
if (!isNetworkName(network)) {
  console.error("Usage: npm run deploy -- --network local|base-sepolia|base [--builder-code <code>]");
  process.exit(1);
}

runDeploy({
  network,
  rpcUrl: values["rpc-url"],
  builderCode: values["builder-code"],
  arbiter: optionalAddress("arbiter", values.arbiter),
  treasury: optionalAddress("treasury", values.treasury),
}).catch((error: Error) => {
  console.error(`\nDeploy failed: ${error.message}`);
  process.exit(1);
});
