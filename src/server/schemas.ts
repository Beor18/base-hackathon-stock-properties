import "server-only";

import { getAddress, isAddress, parseUnits } from "viem";
import { z } from "zod";

import { USD_DECIMALS } from "@/domain/collateral";

/** Request parsers shared by the API routes. */

export const addressParam = z
  .string()
  .refine((value) => isAddress(value), "Expected a wallet address")
  .transform((value) => getAddress(value));

export const guaranteeIdParam = z
  .string()
  .regex(/^[1-9]\d{0,30}$/, "Expected a guarantee id")
  .transform((value) => BigInt(value));

/** A plain USD amount such as "1200" or "1200.50", returned with 18 decimals. */
export const usdAmountParam = z
  .string()
  .regex(/^\d{1,12}(\.\d{1,18})?$/, "Expected a USD amount")
  .transform((value) => parseUnits(value, USD_DECIMALS))
  .refine((value) => value > 0n, "Amount must be greater than zero");
