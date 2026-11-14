import "server-only";

import { encodeFunctionData, type Address, type Hex } from "viem";
import { z } from "zod";

import { deployment } from "@/config/deployment";
import { demoExchangeAbi, reservationEscrowAbi } from "@/contracts/abis";
import { WAD } from "@/domain/collateral";
import type { Plan, Reservation } from "@/domain/types";
import { escrowContract, exchangeContract, publicClient } from "@/server/chain";
import { buildSwap, getSwapRoute } from "@/server/clients/kyberswap";
import { ConflictError } from "@/server/errors";
import { addressParam, reservationIdParam } from "@/server/schemas";
import { getProtocolConfig } from "@/server/services/protocol";
import { CLAIM_REASON_INDEX, getReservation } from "@/server/services/reservations";

import { plannedCall, simulatePlan } from "./shared";

export const reservationActionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("release"), account: addressParam, id: reservationIdParam }),
  z.object({
    action: z.literal("claim"),
    account: addressParam,
    id: reservationIdParam,
    /** Whole US dollars. */
    amountUsd: z.number().int().positive(),
    reason: z.enum(["backed_out", "other"]),
  }),
  z.object({ action: z.literal("accept"), account: addressParam, id: reservationIdParam }),
  z.object({ action: z.literal("dispute"), account: addressParam, id: reservationIdParam }),
  z.object({
    action: z.literal("resolve"),
    account: addressParam,
    id: reservationIdParam,
    inFavorOf: z.enum(["broker", "buyer"]),
  }),
  z.object({ action: z.literal("settle"), account: addressParam, id: reservationIdParam }),
]);

type Input = z.infer<typeof reservationActionSchema>;

export type ReservationActionQuote = {
  action: Input["action"];
  /** For settlements: stock sold and the minimum USDC it must raise. */
  tokensIn: string | null;
  minUsdcOut: string | null;
};

function escrowCall(data: Hex) {
  return plannedCall(escrowContract.address, data);
}

/** One reservation action for the account's role. The escrow enforces who may call what. */
export async function planReservationAction(input: Input): Promise<Plan<ReservationActionQuote>> {
  const reservation = await getReservation(input.id);
  if (reservation.status !== "active") throw new ConflictError("contract_error", "Reservation closed", "NotActive");

  const encode = (data: Hex) => [escrowCall(data)];
  let calls;
  let settlement: { tokensIn: bigint; minUsdcOut: bigint } | null = null;

  switch (input.action) {
    case "release":
      calls = encode(encodeFunctionData({ abi: reservationEscrowAbi, functionName: "release", args: [input.id] }));
      break;
    case "claim":
      calls = encode(
        encodeFunctionData({
          abi: reservationEscrowAbi,
          functionName: "fileClaim",
          args: [input.id, BigInt(input.amountUsd) * WAD, CLAIM_REASON_INDEX[input.reason]],
        }),
      );
      break;
    case "accept":
      calls = encode(encodeFunctionData({ abi: reservationEscrowAbi, functionName: "acceptClaim", args: [input.id] }));
      break;
    case "dispute":
      calls = encode(encodeFunctionData({ abi: reservationEscrowAbi, functionName: "disputeClaim", args: [input.id] }));
      break;
    case "resolve": {
      if (!reservation.claim) throw new ConflictError("contract_error", "No claim", "NoClaimToAct");
      const awarded = input.inFavorOf === "broker" ? BigInt(reservation.claim.amountUsd) : 0n;
      calls = encode(
        encodeFunctionData({ abi: reservationEscrowAbi, functionName: "resolveDispute", args: [input.id, awarded] }),
      );
      break;
    }
    case "settle": {
      const [tokensIn, minUsdcOut] = await publicClient
        .readContract({ ...escrowContract, functionName: "settlementQuote", args: [input.id] })
        .catch(() => {
          throw new ConflictError("contract_error", "Nothing to settle", "NoClaimToAct");
        });
      settlement = { tokensIn, minUsdcOut };
      const { router, swapData } = await settlementSwap(reservation, tokensIn, minUsdcOut);
      calls = encode(
        encodeFunctionData({
          abi: reservationEscrowAbi,
          functionName: "settleClaim",
          args: [input.id, router, swapData],
        }),
      );
      break;
    }
  }

  await simulatePlan(input.account, calls);

  return {
    calls,
    quote: {
      action: input.action,
      tokensIn: settlement?.tokensIn.toString() ?? null,
      minUsdcOut: settlement?.minUsdcOut.toString() ?? null,
    },
  };
}

/**
 * The sale that pays a claim in USDC. The escrow approves exactly `tokensIn` to the router and
 * checks the USDC it gets back, so the swap must sell that amount and send the proceeds to the escrow.
 */
async function settlementSwap(
  reservation: Reservation,
  tokensIn: bigint,
  minUsdcOut: bigint,
): Promise<{ router: Address; swapData: Hex }> {
  if (exchangeContract) {
    return {
      router: exchangeContract.address,
      swapData: encodeFunctionData({
        abi: demoExchangeAbi,
        functionName: "sell",
        args: [reservation.stock.address, tokensIn, minUsdcOut, escrowContract.address],
      }),
    };
  }

  const protocol = await getProtocolConfig();
  const route = await getSwapRoute({
    tokenIn: reservation.stock.address,
    tokenOut: deployment.payTokens.usdc.address,
    amountIn: tokensIn,
  });
  const built = await buildSwap({
    route,
    sender: escrowContract.address,
    recipient: escrowContract.address,
    slippageBps: protocol.maxSlippageBps,
  });

  if (!deployment.routers.some((router) => router.toLowerCase() === built.router.toLowerCase())) {
    throw new ConflictError("contract_error", `Router ${built.router} is not whitelisted`, "RouterNotAllowed");
  }
  if (built.amountIn !== tokensIn) throw new ConflictError("contract_error", "Route amount mismatch", "SwapAmountMismatch");
  if (built.amountOut < minUsdcOut) throw new ConflictError("contract_error", "Price too far from the oracle", "SlippageExceeded");

  return { router: built.router, swapData: built.data };
}
