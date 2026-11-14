/**
 * Syncs the demo price feeds (local and testnet) with the real Chainlink feeds on Base mainnet,
 * so the mock stocks and the mock peso trade at today's prices.
 *
 *   npm run demo:prices -- --network local|base-sepolia [--rpc-url http://..]
 */
import { parseArgs } from "node:util";

import type { Address } from "viem";

import { mockPriceFeedAbi } from "../src/contracts/abis";
import { feedToNumber, readFeed } from "./lib/chainlink";
import { confirm, connect, createMainnetClient } from "./lib/clients";
import { NETWORKS, type NetworkName } from "./lib/deploy-config";
import { readDeployment } from "./lib/deployment-file";

const { values } = parseArgs({ options: { network: { type: "string" }, "rpc-url": { type: "string" } } });
const network = values.network as NetworkName;
if (network !== "local" && network !== "base-sepolia") {
  console.error("Usage: npm run demo:prices -- --network local|base-sepolia");
  process.exit(1);
}

async function main() {
  const deployment = readDeployment(NETWORKS[network].chainId);
  const signer = await connect(network, values["rpc-url"] ?? deployment.rpcUrl);
  const mainnet = createMainnetClient();

  const pairs: { label: string; demoFeed: Address; realFeed: Address }[] = deployment.stocks
    .filter((stock) => stock.mirrorFeed)
    .map((stock) => ({ label: stock.symbol, demoFeed: stock.feed, realFeed: stock.mirrorFeed! }));
  const arsFeed = deployment.payTokens.wars.feed;
  if (arsFeed?.mirrorFeed) pairs.push({ label: arsFeed.description, demoFeed: arsFeed.address, realFeed: arsFeed.mirrorFeed });

  for (const { label, demoFeed, realFeed } of pairs) {
    const [real, demo] = await Promise.all([readFeed(mainnet, realFeed), readFeed(signer.publicClient, demoFeed)]);
    const price = feedToNumber(real.answer, real.decimals);
    if (real.answer === demo.answer) {
      console.log(`  ${label.padEnd(10)} ${price} (unchanged)`);
      continue;
    }
    const hash = await signer.walletClient.writeContract({
      address: demoFeed,
      abi: mockPriceFeedAbi,
      functionName: "setAnswer",
      args: [real.answer],
    });
    await confirm(signer, hash, `Sync ${label}`);
    console.log(`  ${label.padEnd(10)} ${feedToNumber(demo.answer, demo.decimals)} -> ${price}`);
  }
}

main().catch((error: Error) => {
  console.error(`\nPrice sync failed: ${error.message}`);
  process.exit(1);
});
