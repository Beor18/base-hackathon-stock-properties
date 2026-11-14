import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import type { Abi, Hex } from "viem";

const ARTIFACTS_DIR = resolve(import.meta.dirname, "../../contracts/out");

export type Artifact = { abi: Abi; bytecode: Hex };

/** ABI and creation bytecode of `contract` from the Foundry build output (`npm run contracts:build`). */
export function loadArtifact(contract: string): Artifact {
  const path = resolve(ARTIFACTS_DIR, `${contract}.sol`, `${contract}.json`);
  let json: { abi: Abi; bytecode: { object: Hex } };
  try {
    json = JSON.parse(readFileSync(path, "utf8"));
  } catch {
    throw new Error(`Missing build artifact ${path}. Run \`npm run contracts:build\` first.`);
  }
  return { abi: json.abi, bytecode: json.bytecode.object };
}
