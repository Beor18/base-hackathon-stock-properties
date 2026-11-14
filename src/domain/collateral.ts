/**
 * Collateral math shared by the server and the browser. It mirrors the onchain rules in
 * `GuaranteeEscrow.sol` / `StockOracle.sol` so quotes never disagree with the contract.
 */

export const USD_DECIMALS = 18;
export const BPS = 10_000n;

const WAD = 10n ** BigInt(USD_DECIMALS);

/**
 * Chainlink equity feeds update on a 0.5% price deviation. Quotes add this buffer so a feed
 * update between quoting and transaction inclusion does not make the deposit revert.
 */
export const PRICE_MOVE_BUFFER_BPS = 100n;

function ceilDiv(numerator: bigint, denominator: bigint): bigint {
  return (numerator + denominator - 1n) / denominator;
}

/** USD value (18 decimals) of a token amount. */
export function tokensToUsd(amount: bigint, priceUsd: bigint, tokenDecimals: number): bigint {
  return (amount * priceUsd) / 10n ** BigInt(tokenDecimals);
}

/** Token amount worth `usdValue`, rounded down like the contract does for payouts and fees. */
export function usdToTokens(usdValue: bigint, priceUsd: bigint, tokenDecimals: number): bigint {
  if (priceUsd === 0n) return 0n;
  return (usdValue * 10n ** BigInt(tokenDecimals)) / priceUsd;
}

/** Collateral value the contract requires for a coverage amount. */
export function requiredValueUsd(coverageUsd: bigint, collateralRatioBps: number): bigint {
  return ceilDiv(coverageUsd * BigInt(collateralRatioBps), BPS);
}

/** Tokens to lock for a coverage amount, rounded up and padded with the price-move buffer. */
export function collateralFor(params: {
  coverageUsd: bigint;
  priceUsd: bigint;
  tokenDecimals: number;
  collateralRatioBps: number;
}): bigint {
  const { coverageUsd, priceUsd, tokenDecimals, collateralRatioBps } = params;
  if (priceUsd === 0n) return 0n;

  const bufferedValue = ceilDiv(requiredValueUsd(coverageUsd, collateralRatioBps) * (BPS + PRICE_MOVE_BUFFER_BPS), BPS);
  return ceilDiv(bufferedValue * 10n ** BigInt(tokenDecimals), priceUsd);
}

/** One-time protocol fee in tokens, padded so the approval still covers it if the price dips. */
export function feeFor(params: { coverageUsd: bigint; feeBps: number; priceUsd: bigint; tokenDecimals: number }): bigint {
  const { coverageUsd, feeBps, priceUsd, tokenDecimals } = params;
  if (feeBps === 0) return 0n;

  const feeUsd = (coverageUsd * BigInt(feeBps)) / BPS;
  return ceilDiv(usdToTokens(feeUsd, priceUsd, tokenDecimals) * (BPS + PRICE_MOVE_BUFFER_BPS), BPS);
}

/** Collateral value over coverage, in basis points. */
export function healthBps(collateralValueUsd: bigint, coverageUsd: bigint): number {
  if (coverageUsd === 0n) return 0;
  return Number((collateralValueUsd * BPS) / coverageUsd);
}

/** Tokens the tenant can withdraw while staying at the required ratio. */
export function withdrawableExcess(params: {
  collateral: bigint;
  coverageUsd: bigint;
  priceUsd: bigint;
  tokenDecimals: number;
  collateralRatioBps: number;
}): bigint {
  const needed = collateralFor(params);
  return params.collateral > needed ? params.collateral - needed : 0n;
}

export { WAD };
