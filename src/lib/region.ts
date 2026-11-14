import { isMainnet } from "@/config/deployment";

/**
 * Seña is not offered in the United States and its territories (Puerto Rico included): nobody
 * there trades stock through the app. Enforced on mainnet only, by the platform's country header.
 */
export const BLOCKED_COUNTRIES: ReadonlySet<string> = new Set(["US", "PR", "VI", "GU", "AS", "MP", "UM"]);

/** Country header set by the hosting platform (ISO 3166-1 alpha-2). */
export const COUNTRY_HEADER = "x-vercel-ip-country";

export function isBlockedRegion(headers: Headers): boolean {
  if (!isMainnet) return false;
  const country = headers.get(COUNTRY_HEADER)?.trim().toUpperCase();
  return country !== undefined && BLOCKED_COUNTRIES.has(country);
}
