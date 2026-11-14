import "server-only";

import { cacheLife } from "next/cache";
import { erc20Abi } from "viem";

import { tokensToUsd } from "@/domain/collateral";
import type { ProtocolStats } from "@/domain/types";
import { escrowContract, goalRegistryContract, publicClient } from "@/server/chain";

import { listStocks } from "./stocks";

/** Public traction numbers. Counters live in the contracts, so anyone can verify them onchain. */
export async function getProtocolStats(): Promise<ProtocolStats> {
  "use cache";
  cacheLife("seconds");

  const stocks = await listStocks();

  const [goalCount, activeGoals, reservationCount, activeReservations, activeCoverageUsd, balances] = await Promise.all([
    publicClient.readContract({ ...goalRegistryContract, functionName: "goalCount" }),
    publicClient.readContract({ ...goalRegistryContract, functionName: "activeGoals" }),
    publicClient.readContract({ ...escrowContract, functionName: "reservationCount" }),
    publicClient.readContract({ ...escrowContract, functionName: "activeReservationCount" }),
    publicClient.readContract({ ...escrowContract, functionName: "activeCoverageUsd" }),
    Promise.all(
      stocks.map((stock) =>
        publicClient.readContract({
          address: stock.address,
          abi: erc20Abi,
          functionName: "balanceOf",
          args: [escrowContract.address],
        }),
      ),
    ),
  ]);

  const lockedValueUsd = stocks.reduce(
    (total, stock, index) => total + tokensToUsd(balances[index], BigInt(stock.priceUsd), stock.decimals),
    0n,
  );

  return {
    goalCount: Number(goalCount),
    activeGoals: Number(activeGoals),
    reservationCount: Number(reservationCount),
    activeReservations: Number(activeReservations),
    activeCoverageUsd: activeCoverageUsd.toString(),
    lockedValueUsd: lockedValueUsd.toString(),
    listedStocks: stocks.filter((stock) => stock.enabled).length,
  };
}
