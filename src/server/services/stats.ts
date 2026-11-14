import "server-only";

import { cacheLife } from "next/cache";
import { erc20Abi } from "viem";

import { tokensToUsd } from "@/domain/collateral";
import type { ProtocolStats } from "@/domain/types";
import { escrowContract, publicClient } from "@/server/chain";

import { listStocks } from "./stocks";

/** Public traction numbers. Counters live in the contract, so anyone can verify them onchain. */
export async function getProtocolStats(): Promise<ProtocolStats> {
  "use cache";
  cacheLife("seconds");

  const stocks = await listStocks();

  const [totalGuarantees, activeGuarantees, activeCoverageUsd, balances] = await Promise.all([
    publicClient.readContract({ ...escrowContract, functionName: "guaranteeCount" }),
    publicClient.readContract({ ...escrowContract, functionName: "activeGuaranteeCount" }),
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
    totalGuarantees: Number(totalGuarantees),
    activeGuarantees: Number(activeGuarantees),
    activeCoverageUsd: activeCoverageUsd.toString(),
    lockedValueUsd: lockedValueUsd.toString(),
    listedStocks: stocks.filter((stock) => stock.enabled).length,
  };
}
