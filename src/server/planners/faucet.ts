import "server-only";

import { encodeFunctionData } from "viem";
import { z } from "zod";

import { deployment } from "@/config/deployment";
import { mockUsdcAbi } from "@/contracts/abis";
import type { FaucetPlanQuote, Plan, PlannedCall } from "@/domain/types";
import { exchangeContract } from "@/server/chain";
import { BadRequestError } from "@/server/errors";
import { addressParam } from "@/server/schemas";
import { balanceOf } from "@/server/services/accounts";

import { plannedCall, simulatePlan } from "./shared";

export const faucetPlanSchema = z.object({ account: addressParam });

/**
 * Test balance (local and testnet only): tops the account up to each demo token's faucet cap.
 * Tokens already at their cap are skipped, so the batch never reverts for a full balance.
 */
export async function planFaucet(input: z.infer<typeof faucetPlanSchema>): Promise<Plan<FaucetPlanQuote>> {
  if (!exchangeContract) throw new BadRequestError("There is no test balance on this network", "not_available");

  const tokens = [deployment.payTokens.usdc, deployment.payTokens.wars];
  const minted = await Promise.all(
    tokens.map(async (token) => {
      if (!token.faucetCap) return 0n;
      const balance = await balanceOf(token.address, input.account);
      const cap = BigInt(token.faucetCap);
      return balance < cap ? cap - balance : 0n;
    }),
  );

  const calls: PlannedCall[] = tokens
    .filter((_, index) => minted[index] > 0n)
    .map((token) => plannedCall(token.address, encodeFunctionData({ abi: mockUsdcAbi, functionName: "faucet" })));
  await simulatePlan(input.account, calls);

  return { calls, quote: { usdc: minted[0].toString(), wars: minted[1].toString() } };
}
