/**
 * Starts a local Anvil node, deploys Seña to it with mocks seeded from live prices, and writes
 * `src/config/deployment.json`. Keeps running until Ctrl+C.
 *
 *   npm run chain [-- --port 8545]
 */
import { spawn } from "node:child_process";
import { resolve } from "node:path";
import { parseArgs } from "node:util";

import { createPublicClient, http } from "viem";

import { runDeploy } from "./lib/deploy";

const ANVIL = resolve(import.meta.dirname, "../node_modules/@foundry-rs/anvil/bin.mjs");

const { values } = parseArgs({ options: { port: { type: "string", default: "8545" } } });
const rpcUrl = `http://127.0.0.1:${values.port}`;

let failed = false;
const anvil = spawn(process.execPath, [ANVIL, "--port", values.port, "--silent"], { stdio: "inherit" });
const stop = () => anvil.kill("SIGTERM");
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
anvil.on("exit", (code) => process.exit(failed ? 1 : (code ?? 0)));

async function waitForNode(timeoutMs = 20_000) {
  const client = createPublicClient({ transport: http(rpcUrl) });
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      await client.getChainId();
      return;
    } catch {
      await new Promise((done) => setTimeout(done, 250));
    }
  }
  throw new Error(`Anvil did not start on ${rpcUrl}`);
}

waitForNode()
  .then(() => runDeploy({ network: "local", rpcUrl }))
  .then(() => console.log(`\nLocal chain ready at ${rpcUrl}. Ctrl+C to stop.`))
  .catch((error: Error) => {
    console.error(`\nLocal chain failed: ${error.message}`);
    failed = true;
    stop();
  });
