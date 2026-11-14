import { formatUnits } from "viem";

import { deployment } from "@/config/deployment";
import type { PropertyDetail } from "@/domain/property";
import type { AccountSnapshot, GoalPropertyDto, GoalView, ReservationDetail, Stock } from "@/domain/types";
import type { ReservationStatus, ReservationView } from "@/components/account/reservation-screen";
import type { Balances, Goal, GoalProperty, StockOption } from "@/components/account/types";

/**
 * Maps API data (decimal strings, 18-decimal USD) into the plain view models the screens take.
 * Numbers lose precision here on purpose: they are only for display; transactions use the plans.
 */

export const wadToNumber = (value: string | bigint) => Number(formatUnits(BigInt(value), 18));
export const unitsToNumber = (value: string | bigint, decimals: number) => Number(formatUnits(BigInt(value), decimals));

export function toStockOption(stock: Stock, needUsd?: number): StockOption {
  return {
    id: stock.address,
    name: stock.shortName,
    ticker: stock.ticker,
    iconUrl: stock.iconUrl,
    priceUsd: wadToNumber(stock.priceUsd),
    change12mPct: stock.change12mPct,
    needUsd: needUsd ?? null,
  };
}

export function toGoalProperty(dto: GoalPropertyDto): GoalProperty {
  return { ref: dto.ref, title: dto.title, location: dto.location, imageUrl: dto.imageUrl, priceUsd: dto.priceUsd };
}

export function detailToGoalProperty(detail: PropertyDetail, priceUsd: number): GoalProperty {
  return {
    ref: detail.ref,
    title: detail.title,
    location: detail.location,
    imageUrl: detail.imageUrl ?? detail.images[0] ?? null,
    priceUsd,
  };
}

/** The goal as the screens show it: the target is what reserving takes with the chosen stock. */
export function toGoal(view: GoalView): Goal {
  return {
    property: toGoalProperty(view.property),
    depositPct: view.depositPct,
    targetUsd: wadToNumber(view.need.totalValueUsd),
    senaUsd: wadToNumber(view.senaUsd),
    savedUsd: wadToNumber(view.savedUsd),
    shares: unitsToNumber(view.shares, view.stock.decimals),
    stock: toStockOption(view.stock),
    houseChangePct: view.houseChangePct,
    stocksChangePct: view.stocksChangePct,
  };
}

export function toBalances(snapshot: AccountSnapshot): Balances {
  return {
    usd: unitsToNumber(snapshot.balances.usdc, deployment.payTokens.usdc.decimals),
    ars: unitsToNumber(snapshot.balances.wars, deployment.payTokens.wars.decimals),
  };
}

function reservationStatus(reservation: ReservationDetail): ReservationStatus {
  if (reservation.status === "closed") {
    return reservation.paidUsdc !== null && BigInt(reservation.paidUsdc) > 0n ? "paid" : "released";
  }
  const { claim } = reservation;
  if (claim?.status === "disputed") return "disputed";
  if (claim?.isPayable) return "payable";
  if (claim) return "claimed";
  return reservation.chainTime > reservation.claimDeadline ? "expired" : "active";
}

export function toReservationView(reservation: ReservationDetail, fallbackTitle: string): ReservationView {
  const usdcDecimals = deployment.payTokens.usdc.decimals;
  const paidUsd = reservation.paidUsdc !== null ? unitsToNumber(reservation.paidUsdc, usdcDecimals) : null;
  // The seña as reserved: what is still covered plus what settlements already paid.
  const senaUsd = Math.round(wadToNumber(reservation.coverageUsd) + (paidUsd ?? 0));

  return {
    id: reservation.id,
    status: reservationStatus(reservation),
    property: reservation.property
      ? toGoalProperty(reservation.property)
      : { ref: "", title: fallbackTitle, location: null, imageUrl: null, priceUsd: 0 },
    senaUsd,
    claimableUsd: Math.floor(wadToNumber(reservation.coverageUsd)),
    shares: unitsToNumber(reservation.collateral, reservation.stock.decimals),
    stock: toStockOption(reservation.stock),
    valueUsd: wadToNumber(reservation.collateralValueUsd),
    buyer: reservation.depositor,
    broker: { address: reservation.beneficiary, name: null, company: null },
    arbiter: { address: reservation.arbiter, name: null },
    endsAt: reservation.endsAt,
    feePaidUsd: (senaUsd * deployment.params.reservationFeeBps) / 10_000,
    claim: reservation.claim
      ? { amountUsd: wadToNumber(reservation.claim.amountUsd), respondBy: reservation.claim.disputeDeadline }
      : null,
    paidUsd,
  };
}
