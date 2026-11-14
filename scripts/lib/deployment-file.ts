import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { deploymentSchema, type Deployment, type DeploymentInput } from "../../src/config/deployment.schema";

const DEPLOYMENTS_DIR = resolve(import.meta.dirname, "../../deployments");
const ACTIVE_FILE = resolve(import.meta.dirname, "../../src/config/deployment.json");

/** Validates and writes `deployments/<chainId>.json`, and makes it the app's active deployment. */
export function writeDeployment(input: DeploymentInput): Deployment {
  const deployment = deploymentSchema.parse(input);
  const json = `${JSON.stringify(deployment, null, 2)}\n`;

  mkdirSync(DEPLOYMENTS_DIR, { recursive: true });
  const archive = resolve(DEPLOYMENTS_DIR, `${deployment.chainId}.json`);
  writeFileSync(archive, json);
  writeFileSync(ACTIVE_FILE, json);

  console.log(`\nWrote ${archive}\nWrote ${ACTIVE_FILE} (active deployment)`);
  return deployment;
}

export function readDeployment(chainId: number): Deployment {
  const path = resolve(DEPLOYMENTS_DIR, `${chainId}.json`);
  let json: unknown;
  try {
    json = JSON.parse(readFileSync(path, "utf8"));
  } catch {
    throw new Error(`No deployment for chain ${chainId} at ${path}. Run the deploy first.`);
  }
  return deploymentSchema.parse(json);
}
