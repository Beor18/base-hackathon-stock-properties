import "server-only";

import { cacheLife } from "next/cache";

import { deployment } from "@/config/deployment";
import type { ProtocolConfig } from "@/domain/types";
import { escrowContract, oracleContract, publicClient } from "@/server/chain";

/**
 * Protocol rules read from the contracts. Only the fee, the treasury and the default arbiter can
 * change after deployment; the contribution fee is applied by the planners and lives in `deployment.json`.
 */
export async function getProtocolConfig(): Promise<ProtocolConfig> {
  "use cache";
  cacheLife("minutes");

  const read = <
    Name extends
      | "defaultArbiter"
      | "treasury"
      | "feeBps"
      | "maxSlippageBps"
      | "disputeWindow"
      | "claimWindow"
      | "arbitrationTimeout",
  >(
    functionName: Name,
  ) => publicClient.readContract({ ...escrowContract, functionName });

  const [defaultArbiter, treasury, feeBps, maxSlippageBps, disputeWindow, claimWindow, arbitrationTimeout, collateralMaxAge, settlementMaxAge] =
    await Promise.all([
      read("defaultArbiter"),
      read("treasury"),
      read("feeBps"),
      read("maxSlippageBps"),
      read("disputeWindow"),
      read("claimWindow"),
      read("arbitrationTimeout"),
      publicClient.readContract({ ...oracleContract, functionName: "collateralMaxAge" }),
      publicClient.readContract({ ...oracleContract, functionName: "settlementMaxAge" }),
    ]);

  return {
    chainId: deployment.chainId,
    escrowAddress: deployment.contracts.reservationEscrow,
    goalRegistryAddress: deployment.contracts.goalRegistry,
    oracleAddress: deployment.contracts.stockOracle,
    defaultArbiter,
    treasury,
    reservationFeeBps: feeBps,
    contributionFeeBps: deployment.params.contributionFeeBps,
    maxSlippageBps,
    disputeWindowSeconds: Number(disputeWindow),
    claimWindowSeconds: Number(claimWindow),
    arbitrationTimeoutSeconds: Number(arbitrationTimeout),
    collateralMaxAgeSeconds: Number(collateralMaxAge),
    settlementMaxAgeSeconds: Number(settlementMaxAge),
  };
}
