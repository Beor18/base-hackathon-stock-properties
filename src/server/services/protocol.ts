import "server-only";

import { cacheLife } from "next/cache";

import { publicEnv } from "@/config/public-env";
import { stockOracleAbi } from "@/contracts/abis";
import type { ProtocolConfig } from "@/domain/types";
import { escrowContract, publicClient } from "@/server/chain";

/** Protocol rules read from the contracts. Only the fee and default arbiter can change after deployment. */
export async function getProtocolConfig(): Promise<ProtocolConfig> {
  "use cache";
  cacheLife("minutes");

  const read = <Name extends "oracle" | "defaultArbiter" | "feeBps" | "disputeWindow" | "claimWindow" | "arbitrationTimeout">(
    functionName: Name,
  ) => publicClient.readContract({ ...escrowContract, functionName });

  const [oracleAddress, defaultArbiter, feeBps, disputeWindow, claimWindow, arbitrationTimeout] = await Promise.all([
    read("oracle"),
    read("defaultArbiter"),
    read("feeBps"),
    read("disputeWindow"),
    read("claimWindow"),
    read("arbitrationTimeout"),
  ]);

  const oracle = { address: oracleAddress, abi: stockOracleAbi } as const;
  const [collateralMaxAge, settlementMaxAge] = await Promise.all([
    publicClient.readContract({ ...oracle, functionName: "collateralMaxAge" }),
    publicClient.readContract({ ...oracle, functionName: "settlementMaxAge" }),
  ]);

  return {
    chainId: publicEnv.chainId,
    escrowAddress: publicEnv.escrowAddress,
    oracleAddress,
    defaultArbiter,
    feeBps,
    disputeWindowSeconds: Number(disputeWindow),
    claimWindowSeconds: Number(claimWindow),
    arbitrationTimeoutSeconds: Number(arbitrationTimeout),
    collateralMaxAgeSeconds: Number(collateralMaxAge),
    settlementMaxAgeSeconds: Number(settlementMaxAge),
  };
}
