import { BaseError, decodeErrorResult, isHex, type Abi, type Hex } from "viem";

import {
  demoExchangeAbi,
  goalRegistryAbi,
  mockStockTokenAbi,
  mockUsdcAbi,
  mockWarsAbi,
  reservationEscrowAbi,
  stockOracleAbi,
} from "@/contracts/abis";

/**
 * Turns a failed call into the name of the contract's custom error ("InsufficientCollateral"), so
 * the UI can say what happened in plain words. Works with viem errors (dev accounts, simulations)
 * and with bundler messages that only carry the revert data as text (smart accounts).
 */
const errorAbi: Abi = [
  ...reservationEscrowAbi,
  ...goalRegistryAbi,
  ...stockOracleAbi,
  ...demoExchangeAbi,
  ...mockStockTokenAbi,
  ...mockUsdcAbi,
  ...mockWarsAbi,
].filter((item, index, all) => {
  if (item.type !== "error") return false;
  // Several ABIs declare the same error; keep the first so decoding is unambiguous.
  return all.findIndex((other) => other.type === "error" && other.name === item.name) === index;
});

export type DecodedRevert = { name: string; args: readonly unknown[] };

export function decodeRevertData(data: Hex): DecodedRevert | null {
  if (data.length < 10) return null;
  try {
    const decoded = decodeErrorResult({ abi: errorAbi, data });
    return { name: decoded.errorName, args: decoded.args ?? [] };
  } catch {
    return null;
  }
}

/** Finds revert data anywhere in an error (its cause chain, RPC payloads or message text). */
export function decodeContractError(error: unknown): DecodedRevert | null {
  const candidates: string[] = [];

  if (error instanceof BaseError) {
    error.walk((cause) => {
      const data = (cause as { data?: unknown }).data;
      if (typeof data === "string") candidates.push(data);
      if (data && typeof data === "object" && typeof (data as { data?: unknown }).data === "string") {
        candidates.push((data as { data: string }).data);
      }
      return false;
    });
  }

  const message = error instanceof Error ? `${error.message} ${String((error as { details?: unknown }).details ?? "")}` : String(error);
  candidates.push(...(message.match(/0x[0-9a-fA-F]{8,}/g) ?? []));

  for (const candidate of candidates) {
    if (!isHex(candidate)) continue;
    const decoded = decodeRevertData(candidate);
    if (decoded) return decoded;
  }
  return null;
}

/** True when the person cancelled (the dev account or the smart account rejected the request). */
export function isUserRejection(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /user rejected|rejected the request|denied/i.test(message);
}
