import "server-only";

import { formatUnits, zeroHash, type Address, type ReadContractReturnType } from "viem";

import { deployment } from "@/config/deployment";
import { reservationEscrowAbi } from "@/contracts/abis";
import { tokensToUsd } from "@/domain/collateral";
import type { Claim, ClaimReason, ClaimStatus, ProtocolConfig, Reservation, ReservationDetail, Stock } from "@/domain/types";
import { escrowContract, getChainTime, goalRegistryContract, publicClient } from "@/server/chain";
import { NotFoundError } from "@/server/errors";

import { resolvePropertyKey } from "./goal-property";
import { getProtocolConfig } from "./protocol";
import { listStocks } from "./stocks";

type OnchainReservation = ReadContractReturnType<typeof reservationEscrowAbi, "getReservation">;

// Index positions match the Solidity enums in IReservationEscrow.
const STATUS_NONE = 0;
const STATUS_ACTIVE = 1;
const CLAIM_STATUSES: readonly ClaimStatus[] = ["none", "filed", "disputed", "approved"];
const CLAIM_REASONS: readonly ClaimReason[] = ["backed_out", "unpaid_rent", "damages", "other"];
export const CLAIM_REASON_INDEX: Record<ClaimReason, number> = { backed_out: 0, unpaid_rent: 1, damages: 2, other: 3 };

type Context = { protocol: ProtocolConfig; stocks: Stock[]; chainTime: number };

async function loadContext(): Promise<Context> {
  const [protocol, stocks, chainTime] = await Promise.all([getProtocolConfig(), listStocks(), getChainTime()]);
  return { protocol, stocks, chainTime };
}

async function readOnchain(id: bigint): Promise<OnchainReservation> {
  const onchain = await publicClient.readContract({ ...escrowContract, functionName: "getReservation", args: [id] });
  if (onchain.status === STATUS_NONE) throw new NotFoundError(`Reservation ${id} does not exist`);
  return onchain;
}

export async function getReservation(id: bigint): Promise<Reservation> {
  const [onchain, context, paidUsdc] = await Promise.all([readOnchain(id), loadContext(), readPaidUsdc(id)]);
  return toReservation(id, onchain, context, paidUsdc);
}

/** The reservation plus the property it reserves, read from the depositor's goal when it matches. */
export async function getReservationDetail(id: bigint): Promise<ReservationDetail> {
  const reservation = await getReservation(id);
  let property: ReservationDetail["property"] = null;

  if (reservation.propertyRef) {
    const goal = await publicClient.readContract({
      ...goalRegistryContract,
      functionName: "goalOf",
      args: [reservation.depositor],
    });
    if (goal.createdAt !== 0n && goal.propertyRef === reservation.propertyRef) {
      property = await resolvePropertyKey(goal.propertyKey, Number(formatUnits(goal.propertyPriceUsd, 18)));
    }
  }

  return { ...reservation, property };
}

/** Every reservation where `account` is the depositor or the beneficiary, newest first. */
export async function listReservationsOf(account: Address): Promise<Reservation[]> {
  const [ids, context] = await Promise.all([
    publicClient.readContract({ ...escrowContract, functionName: "reservationIdsOf", args: [account] }),
    loadContext(),
  ]);

  const reservations = await Promise.all(
    // An account can appear twice for the same id only if it were both roles, which the escrow forbids.
    ids.map(async (id) => toReservation(id, await readOnchain(id), context, null)),
  );
  return reservations.sort((a, b) => b.createdAt - a.createdAt);
}

/** USDC paid out by settlements, from the escrow's events. Null if the node cannot serve the history. */
async function readPaidUsdc(id: bigint): Promise<string | null> {
  try {
    const events = await publicClient.getContractEvents({
      ...escrowContract,
      eventName: "ClaimSettled",
      args: { id },
      fromBlock: BigInt(deployment.startBlock),
    });
    return events.reduce((total, event) => total + (event.args.usdcPaid ?? 0n), 0n).toString();
  } catch (error) {
    console.warn("[reservations] settlement history unavailable", error instanceof Error ? error.message : error);
    return null;
  }
}

function toReservation(id: bigint, onchain: OnchainReservation, { protocol, stocks, chainTime }: Context, paidUsdc: string | null): Reservation {
  const stock = stocks.find((candidate) => candidate.address.toLowerCase() === onchain.token.toLowerCase());
  if (!stock) throw new Error(`Reservation ${id} uses a token the oracle no longer lists: ${onchain.token}`);

  const endsAt = Number(onchain.endsAt);

  return {
    id: id.toString(),
    status: onchain.status === STATUS_ACTIVE ? "active" : "closed",
    depositor: onchain.depositor,
    beneficiary: onchain.beneficiary,
    arbiter: onchain.arbiter,
    stock,
    collateral: onchain.collateral.toString(),
    collateralValueUsd: tokensToUsd(onchain.collateral, BigInt(stock.priceUsd), stock.decimals).toString(),
    coverageUsd: onchain.coverageUsd.toString(),
    collateralRatioBps: onchain.collateralRatioBps,
    createdAt: Number(onchain.createdAt),
    endsAt,
    claimDeadline: endsAt + protocol.claimWindowSeconds,
    propertyRef: onchain.propertyRef === zeroHash ? null : onchain.propertyRef,
    claim: onchain.status === STATUS_ACTIVE ? toClaim(onchain.claim, protocol, chainTime) : null,
    paidUsdc,
    chainTime,
  };
}

function toClaim(claim: OnchainReservation["claim"], protocol: ProtocolConfig, chainTime: number): Claim | null {
  const status = CLAIM_STATUSES[claim.status];
  if (status === "none") return null;

  const filedAt = Number(claim.filedAt);
  const disputeDeadline = filedAt + protocol.disputeWindowSeconds;

  return {
    status,
    reason: CLAIM_REASONS[claim.reason],
    amountUsd: claim.amountUsd.toString(),
    filedAt,
    disputeDeadline,
    arbitrationFallbackAt: status === "disputed" ? Number(claim.disputedAt) + protocol.arbitrationTimeoutSeconds : null,
    isPayable: status === "approved" || (status === "filed" && chainTime > disputeDeadline),
  };
}
