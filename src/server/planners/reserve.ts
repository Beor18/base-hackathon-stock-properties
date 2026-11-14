import "server-only";

import { encodeFunctionData, formatUnits, keccak256, toBytes, zeroAddress } from "viem";
import { z } from "zod";

import { reservationEscrowAbi } from "@/contracts/abis";
import { WAD } from "@/domain/collateral";
import type { Plan, ReservePlanQuote } from "@/domain/types";
import { depositUsd, isValidDepositPct, RESERVATION_DAYS } from "@/lib/product";
import { escrowContract, getChainTime } from "@/server/chain";
import { BadRequestError, ConflictError } from "@/server/errors";
import { addressParam, propertyRefParam } from "@/server/schemas";
import { balanceOf, readGoal } from "@/server/services/accounts";
import { loadProperty, resolvePropertyKey } from "@/server/services/goal-property";
import { getProtocolConfig } from "@/server/services/protocol";
import { quoteStock } from "@/server/services/quotes";
import { requireStock } from "@/server/services/stocks";

import { approveCall, plannedCall, simulatePlan } from "./shared";

export const reservePlanSchema = z.object({
  account: addressParam,
  /** Property in the broker's link. */
  ref: propertyRefParam,
  url: z.string().max(2048).nullish(),
  /** Seña percentage in the broker's link. */
  pct: z.number(),
  /** The broker: the reservation's beneficiary. */
  broker: addressParam,
});

/**
 * Locks the goal's stock as the seña in favor of the broker: approve + createReservation in one batch.
 * Always returns the quote; `calls` is empty while the account does not hold enough stock yet.
 */
export async function planReservation(input: z.infer<typeof reservePlanSchema>): Promise<Plan<ReservePlanQuote>> {
  if (!isValidDepositPct(input.pct)) throw new BadRequestError("The seña percentage is out of range", "invalid_pct");

  const goal = await readGoal(input.account);
  if (!goal) throw new ConflictError("no_goal", "The account has no goal yet");

  const [stock, protocol, walletShares, chainTime] = await Promise.all([
    requireStock(goal.stock),
    getProtocolConfig(),
    balanceOf(goal.stock, input.account),
    getChainTime(),
  ]);

  if (input.broker === input.account) throw new ConflictError("contract_error", "Broker is the buyer", "InvalidParties");
  if (input.broker === protocol.defaultArbiter) throw new ConflictError("contract_error", "Broker is the arbiter", "InvalidParties");

  // The seña follows the broker's link: its percentage, on the property's current price.
  const propertyRef = keccak256(toBytes(input.ref));
  let priceUsd: number;
  if (propertyRef === goal.propertyRef) {
    priceUsd = (await resolvePropertyKey(goal.propertyKey, Number(formatUnits(goal.propertyPriceUsd, 18)))).priceUsd;
  } else {
    const property = await loadProperty(input.ref, input.url);
    if (property.priceUsd === null) throw new BadRequestError("The listing has no price", "no_price");
    priceUsd = property.priceUsd;
  }

  const senaUsd = BigInt(depositUsd(priceUsd, input.pct)) * WAD;
  const need = quoteStock(stock, senaUsd, protocol.reservationFeeBps);
  const reached = stock.enabled && walletShares >= BigInt(need.totalTokens);
  const endsAt = chainTime + RESERVATION_DAYS * 86_400;

  const calls = reached
    ? [
        approveCall(stock.address, escrowContract.address, BigInt(need.totalTokens)),
        plannedCall(
          escrowContract.address,
          encodeFunctionData({
            abi: reservationEscrowAbi,
            functionName: "createReservation",
            args: [
              {
                beneficiary: input.broker,
                arbiter: zeroAddress,
                token: stock.address,
                collateral: BigInt(need.collateral),
                coverageUsd: senaUsd,
                endsAt: BigInt(endsAt),
                propertyRef,
              },
            ],
          }),
        ),
      ]
    : [];
  await simulatePlan(input.account, calls);

  return {
    calls,
    quote: {
      reached,
      senaUsd: senaUsd.toString(),
      depositPct: input.pct,
      need,
      walletShares: walletShares.toString(),
      endsAt,
      feeBps: protocol.reservationFeeBps,
    },
  };
}
