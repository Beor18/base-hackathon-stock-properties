import "server-only";

import { encodeFunctionData, keccak256, parseUnits, toBytes, zeroAddress } from "viem";
import { z } from "zod";

import { goalRegistryAbi } from "@/contracts/abis";
import { WAD } from "@/domain/collateral";
import type { PropertyDetail } from "@/domain/property";
import type { GoalPlanQuote, Plan } from "@/domain/types";
import { depositUsd, isValidDepositPct } from "@/lib/product";
import { goalRegistryContract } from "@/server/chain";
import { canonicalizeLink } from "@/server/clients/link-preview";
import { BadRequestError, ConflictError } from "@/server/errors";
import { addressParam, propertyRefParam } from "@/server/schemas";
import { linkRefFor, loadProperty, propertyKeyFor } from "@/server/services/goal-property";
import { getProtocolConfig } from "@/server/services/protocol";
import { quoteStock } from "@/server/services/quotes";
import { findStock } from "@/server/services/stocks";

import { plannedCall, simulatePlan } from "./shared";

/** Same bound as `GoalRegistry.MAX_KEY_LENGTH`. */
const MAX_KEY_BYTES = 512;

export const goalPlanSchema = z.object({
  account: addressParam,
  ref: propertyRefParam,
  /** Listing URL, required for pasted links. */
  url: z.string().max(2048).nullish(),
  pct: z.number(),
  /** Price typed by the person when the pasted listing shows none. Ignored for Smarlin listings. */
  manualPriceUsd: z.number().positive().max(1e10).nullish(),
  stock: addressParam,
});

type PricedProperty = { property: Pick<PropertyDetail, "ref" | "provider" | "sourceUrl">; priceUsd: number };

/** Smarlin prices always come from Smarlin; pasted links use the page price, or the typed one. */
async function priceProperty(input: z.infer<typeof goalPlanSchema>): Promise<PricedProperty> {
  const isLink = input.ref.toLowerCase().startsWith("link:");
  if (isLink && !input.url) throw new BadRequestError("Pasted listings need their url", "missing_url");

  try {
    const property = await loadProperty(input.ref, isLink ? input.url : null);
    const priceUsd = property.priceUsd ?? (isLink ? (input.manualPriceUsd ?? null) : null);
    if (priceUsd === null) throw new BadRequestError("The listing has no price", "no_price");
    return { property, priceUsd };
  } catch (error) {
    // A link that cannot be read again (blocked, offline) still works with the price the person typed.
    if (!isLink || !input.url || !input.manualPriceUsd || error instanceof BadRequestError) throw error;
    const sourceUrl = canonicalizeLink(input.url);
    if (linkRefFor(sourceUrl) !== input.ref.toLowerCase()) throw new BadRequestError("The link does not match this property");
    return { property: { ref: input.ref, provider: "link", sourceUrl }, priceUsd: input.manualPriceUsd };
  }
}

export async function planGoal(input: z.infer<typeof goalPlanSchema>): Promise<Plan<GoalPlanQuote>> {
  if (!isValidDepositPct(input.pct)) throw new BadRequestError("The seña percentage is out of range", "invalid_pct");

  const [stock, protocol, { property, priceUsd }] = await Promise.all([
    findStock(input.stock),
    getProtocolConfig(),
    priceProperty(input),
  ]);
  if (!stock?.enabled) throw new ConflictError("contract_error", "Stock not enabled", "StockNotEnabled");

  const propertyKey = propertyKeyFor(property);
  if (new TextEncoder().encode(propertyKey).length > MAX_KEY_BYTES) {
    throw new BadRequestError("The listing link is too long to save", "key_too_long");
  }

  const senaUsd = BigInt(depositUsd(priceUsd, input.pct)) * WAD;
  if (senaUsd === 0n) throw new BadRequestError("The seña would be zero", "invalid_amount");
  const propertyPriceUsd = parseUnits(priceUsd.toFixed(2), 18);
  const propertyRef = keccak256(toBytes(input.ref));

  const calls = [
    plannedCall(
      goalRegistryContract.address,
      encodeFunctionData({
        abi: goalRegistryAbi,
        functionName: "setGoal",
        args: [propertyRef, propertyKey, stock.address, senaUsd, propertyPriceUsd, zeroAddress],
      }),
    ),
  ];
  await simulatePlan(input.account, calls);

  return {
    calls,
    quote: {
      senaUsd: senaUsd.toString(),
      propertyPriceUsd: propertyPriceUsd.toString(),
      propertyKey,
      need: quoteStock(stock, senaUsd, protocol.reservationFeeBps),
    },
  };
}
