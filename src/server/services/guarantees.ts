import "server-only";

import { zeroHash, type Address, type ReadContractReturnType } from "viem";

import { guaranteeEscrowAbi } from "@/contracts/abis";
import { healthBps, requiredValueUsd, tokensToUsd } from "@/domain/collateral";
import type { Claim, ClaimReason, ClaimStatus, Guarantee, ProtocolConfig, Stock } from "@/domain/types";
import { escrowContract, getChainTime, publicClient } from "@/server/chain";
import { NotFoundError } from "@/server/errors";

import { getProtocolConfig } from "./protocol";
import { listStocks } from "./stocks";

type OnchainGuarantee = ReadContractReturnType<typeof guaranteeEscrowAbi, "getGuarantee">;

// Index positions match the Solidity enums in IGuaranteeEscrow.
const GUARANTEE_STATUS_NONE = 0;
const GUARANTEE_STATUS_ACTIVE = 1;
const CLAIM_STATUSES: readonly ClaimStatus[] = ["none", "filed", "disputed", "approved"];
const CLAIM_REASONS: readonly ClaimReason[] = ["unpaid_rent", "damages", "early_termination", "other"];

export async function getGuarantee(id: bigint): Promise<Guarantee> {
  const [onchain, context] = await Promise.all([
    publicClient.readContract({ ...escrowContract, functionName: "getGuarantee", args: [id] }),
    loadContext(),
  ]);

  if (onchain.status === GUARANTEE_STATUS_NONE) throw new NotFoundError(`Guarantee ${id} does not exist`);
  return toGuarantee(id, onchain, context);
}

/** Every guarantee where `account` is the tenant or the landlord, newest first. */
export async function listGuaranteesOf(account: Address): Promise<Guarantee[]> {
  const [ids, context] = await Promise.all([
    publicClient.readContract({ ...escrowContract, functionName: "guaranteeIdsOf", args: [account] }),
    loadContext(),
  ]);

  const guarantees = await Promise.all(
    ids.map(async (id) => {
      const onchain = await publicClient.readContract({ ...escrowContract, functionName: "getGuarantee", args: [id] });
      return toGuarantee(id, onchain, context);
    }),
  );

  return guarantees.sort((a, b) => b.createdAt - a.createdAt);
}

type Context = { protocol: ProtocolConfig; stocks: Stock[]; chainTime: number };

async function loadContext(): Promise<Context> {
  const [protocol, stocks, chainTime] = await Promise.all([getProtocolConfig(), listStocks(), getChainTime()]);
  return { protocol, stocks, chainTime };
}

function toGuarantee(id: bigint, onchain: OnchainGuarantee, { protocol, stocks, chainTime }: Context): Guarantee {
  const stock = stocks.find((candidate) => candidate.address.toLowerCase() === onchain.token.toLowerCase());
  if (!stock) throw new Error(`Guarantee ${id} uses a token the oracle no longer lists: ${onchain.token}`);

  const collateralValueUsd = tokensToUsd(onchain.collateral, BigInt(stock.priceUsd), stock.decimals);
  const endsAt = Number(onchain.endsAt);

  return {
    id: id.toString(),
    status: onchain.status === GUARANTEE_STATUS_ACTIVE ? "active" : "closed",
    tenant: onchain.tenant,
    landlord: onchain.landlord,
    arbiter: onchain.arbiter,
    stock,
    collateral: onchain.collateral.toString(),
    collateralValueUsd: collateralValueUsd.toString(),
    coverageUsd: onchain.coverageUsd.toString(),
    requiredValueUsd: requiredValueUsd(onchain.coverageUsd, onchain.collateralRatioBps).toString(),
    healthBps: healthBps(collateralValueUsd, onchain.coverageUsd),
    collateralRatioBps: onchain.collateralRatioBps,
    createdAt: Number(onchain.createdAt),
    endsAt,
    claimDeadline: endsAt + protocol.claimWindowSeconds,
    leaseHash: onchain.leaseHash === zeroHash ? null : onchain.leaseHash,
    claim: toClaim(onchain.claim, protocol, chainTime),
  };
}

function toClaim(claim: OnchainGuarantee["claim"], protocol: ProtocolConfig, chainTime: number): Claim | null {
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
    arbitrationFallbackAt:
      status === "disputed" ? Number(claim.disputedAt) + protocol.arbitrationTimeoutSeconds : null,
    isPayable: status === "approved" || (status === "filed" && chainTime > disputeDeadline),
  };
}
