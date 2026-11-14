import "server-only";

import { getAddress, isAddress, parseUnits } from "viem";
import { z } from "zod";

import { USD_DECIMALS } from "@/domain/collateral";

/** Request parsers shared by the API routes. */

export const addressParam = z
  .string()
  .refine((value) => isAddress(value), "Expected an account address")
  .transform((value) => getAddress(value));

export const reservationIdParam = z
  .string()
  .regex(/^[1-9]\d{0,30}$/, "Expected a reservation id")
  .transform((value) => BigInt(value));

/** A plain USD amount such as "1200" or "1200.50", returned with 18 decimals. */
export const usdAmountParam = z
  .string()
  .regex(/^\d{1,12}(\.\d{1,18})?$/, "Expected a USD amount")
  .transform((value) => parseUnits(value, USD_DECIMALS))
  .refine((value) => value > 0n, "Amount must be greater than zero");

/** A positive decimal amount as a string ("20", "20.5"), kept as text so no precision is lost. */
export const decimalAmountParam = z
  .string()
  .regex(/^\d{1,15}(\.\d{1,18})?$/, "Expected an amount such as 20 or 20.5")
  .refine((value) => Number(value) > 0, "Amount must be greater than zero");

/** A property ref as produced by the property API. */
export const propertyRefParam = z
  .string()
  .trim()
  .regex(/^(smarlin|link):([0-9a-f-]{36}|[0-9a-f]{64})$/i, "Expected a property ref");
