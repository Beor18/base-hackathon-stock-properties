import "server-only";

import { erc20Abi, formatUnits, zeroAddress, type Address, type ReadContractReturnType } from "viem";

import { deployment } from "@/config/deployment";
import { goalRegistryAbi } from "@/contracts/abis";
import { tokensToUsd, WAD } from "@/domain/collateral";
import type { AccountSnapshot, GoalView } from "@/domain/types";
import { goalRegistryContract, publicClient } from "@/server/chain";

import { resolvePropertyKey } from "./goal-property";
import { getProtocolConfig } from "./protocol";
import { quoteStock } from "./quotes";
import { listReservationsOf } from "./reservations";
import { requireStock } from "./stocks";

export type OnchainGoal = ReadContractReturnType<typeof goalRegistryAbi, "goalOf">;

export async function readGoal(account: Address): Promise<OnchainGoal | null> {
  const goal = await publicClient.readContract({ ...goalRegistryContract, functionName: "goalOf", args: [account] });
  return goal.createdAt === 0n ? null : goal;
}

export function balanceOf(token: Address, account: Address): Promise<bigint> {
  return publicClient.readContract({ address: token, abi: erc20Abi, functionName: "balanceOf", args: [account] });
}

/** Balances and goal of an account: everything the account screens need in one read. */
export async function getAccountSnapshot(account: Address): Promise<AccountSnapshot> {
  const [usdc, wars, goal] = await Promise.all([
    balanceOf(deployment.payTokens.usdc.address, account),
    balanceOf(deployment.payTokens.wars.address, account),
    getGoalView(account),
  ]);
  return { address: account, balances: { usdc: usdc.toString(), wars: wars.toString() }, goal };
}

const toUsdNumber = (wad: bigint) => Number(formatUnits(wad, 18));

function changePct(now: number, start: number): number | null {
  if (!(start > 0) || !(now > 0)) return null;
  return Math.round(((now - start) / start) * 1000) / 10;
}

/** The account's goal with live value, what reserving takes, and the change since it started. */
export async function getGoalView(account: Address): Promise<GoalView | null> {
  const goal = await readGoal(account);
  if (!goal) return null;

  const [stock, protocol, walletShares, reservations, property] = await Promise.all([
    requireStock(goal.stock),
    getProtocolConfig(),
    balanceOf(goal.stock, account),
    listReservationsOf(account),
    resolvePropertyKey(goal.propertyKey, toUsdNumber(goal.propertyPriceUsd)),
  ]);

  // Shares already locked as this goal's seña still count as saved for it.
  const active = reservations.filter(
    (reservation) =>
      reservation.status === "active" &&
      reservation.depositor.toLowerCase() === account.toLowerCase() &&
      reservation.propertyRef === goal.propertyRef &&
      reservation.stock.address.toLowerCase() === goal.stock.toLowerCase(),
  );
  const lockedShares = active.reduce((total, reservation) => total + BigInt(reservation.collateral), 0n);
  const shares = walletShares + lockedShares;
  const priceUsd = BigInt(stock.priceUsd);
  const need = quoteStock(stock, goal.targetUsd, protocol.reservationFeeBps);

  const startPrice = toUsdNumber(goal.propertyPriceUsd);
  const depositPct = startPrice > 0 ? Math.round((toUsdNumber(goal.targetUsd) / startPrice) * 200) / 2 : 0;

  return {
    propertyRef: goal.propertyRef,
    propertyKey: goal.propertyKey,
    property,
    stock,
    beneficiary: goal.beneficiary === zeroAddress ? null : goal.beneficiary,
    createdAt: Number(goal.createdAt),
    senaUsd: goal.targetUsd.toString(),
    depositPct,
    propertyPriceUsd: goal.propertyPriceUsd.toString(),
    startStockPriceUsd: goal.startStockPriceUsd.toString(),
    shares: shares.toString(),
    walletShares: walletShares.toString(),
    lockedShares: lockedShares.toString(),
    savedUsd: tokensToUsd(shares, priceUsd, stock.decimals).toString(),
    need,
    reached: active.length > 0 || walletShares >= BigInt(need.totalTokens),
    houseChangePct: property.livePrice ? changePct(property.priceUsd, startPrice) : null,
    stocksChangePct: changePct(Number((priceUsd * 10_000n) / WAD) / 10_000, toUsdNumber(goal.startStockPriceUsd)),
    activeReservationId: active[0]?.id ?? null,
  };
}
