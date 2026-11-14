import "server-only";

import { erc20Abi, encodeFunctionData, type Address, type Hex } from "viem";

import type { PlannedCall } from "@/domain/types";
import { decodeContractError } from "@/lib/contract-errors";
import { isBlockedRegion } from "@/lib/region";
import { publicClient } from "@/server/chain";
import { ConflictError, UnavailableRegionError } from "@/server/errors";

/** Planners build calls for the account to send in one batch. They never sign anything. */

export function plannedCall(to: Address, data: Hex, value = 0n): PlannedCall {
  return { to, data, value: value.toString() };
}

export function approveCall(token: Address, spender: Address, amount: bigint): PlannedCall {
  return plannedCall(token, encodeFunctionData({ abi: erc20Abi, functionName: "approve", args: [spender, amount] }));
}

/** Plans only serve the regions where the app is offered (mainnet only). */
export function assertAllowedRegion(request: Request): void {
  if (isBlockedRegion(request.headers)) throw new UnavailableRegionError();
}

/**
 * Runs the batch against the latest block as `account` would, so a call that is going to revert
 * fails here with its decoded reason instead of after the person confirms. Nodes without
 * `eth_simulateV1` skip the check: the account still estimates before sending.
 */
export async function simulatePlan(account: Address, calls: PlannedCall[]): Promise<void> {
  if (calls.length === 0) return;

  let results;
  try {
    ({ results } = await publicClient.simulateCalls({
      account,
      calls: calls.map((call) => ({ to: call.to, data: call.data, value: BigInt(call.value) })),
    }));
  } catch (error) {
    const decoded = decodeContractError(error);
    if (decoded) throw new ConflictError("contract_error", `The call would revert with ${decoded.name}`, decoded.name);
    console.warn("[planner] simulation unavailable", error instanceof Error ? error.message.split("\n")[0] : error);
    return;
  }

  const failed = results.find((result) => result.status === "failure");
  if (!failed) return;

  const decoded = decodeContractError(failed.error) ?? (failed.data ? decodeContractError(failed.data) : null);
  throw new ConflictError(
    "contract_error",
    `The call would revert${decoded ? ` with ${decoded.name}` : ""}`,
    decoded?.name ?? "Reverted",
  );
}
