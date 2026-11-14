import type { Address, Hex } from "viem";

/**
 * Wire types shared by the API routes and the UI.
 * Big numbers travel as decimal strings: USD amounts use 18 decimals, token amounts the token's decimals.
 */

export type Stock = {
  address: Address;
  symbol: string;
  name: string;
  decimals: number;
  iconUrl: string | null;
  /** USD per whole token, 18 decimals. */
  priceUsd: string;
  /** Unix seconds of the last oracle update. Feeds follow market hours, so weekends are expected to lag. */
  priceUpdatedAt: number;
  /** Collateral required per unit of coverage, in basis points (12_500 = 125%). */
  collateralRatioBps: number;
  /** Whether the stock can back new guarantees. */
  enabled: boolean;
  /** True on testnets, where anyone can mint demo tokens. */
  hasFaucet: boolean;
};

export type ClaimStatus = "none" | "filed" | "disputed" | "approved";
export type ClaimReason = "unpaid_rent" | "damages" | "early_termination" | "other";
export type GuaranteeStatus = "active" | "closed";

export type Claim = {
  status: Exclude<ClaimStatus, "none">;
  reason: ClaimReason;
  amountUsd: string;
  filedAt: number;
  /** Until when the tenant can dispute. Afterwards an undisputed claim becomes payable. */
  disputeDeadline: number;
  /** When the protocol arbiter may step in for an unresponsive arbiter. Only set for disputed claims. */
  arbitrationFallbackAt: number | null;
  /** True when anyone can trigger the payout. */
  isPayable: boolean;
};

export type Guarantee = {
  id: string;
  status: GuaranteeStatus;
  tenant: Address;
  landlord: Address;
  arbiter: Address;
  stock: Stock;
  /** Stock tokens locked. */
  collateral: string;
  /** Current market value of the collateral, 18 decimals. */
  collateralValueUsd: string;
  /** USD the landlord can still claim, 18 decimals. */
  coverageUsd: string;
  /** Collateral value the tenant must keep to withdraw excess, 18 decimals. */
  requiredValueUsd: string;
  /** Collateral value over coverage, in basis points. 10_000 means exactly covered. */
  healthBps: number;
  collateralRatioBps: number;
  createdAt: number;
  endsAt: number;
  /** Last moment the landlord can file a claim; afterwards anyone can release the collateral. */
  claimDeadline: number;
  leaseHash: Hex | null;
  claim: Claim | null;
};

export type ProtocolConfig = {
  chainId: number;
  escrowAddress: Address;
  oracleAddress: Address;
  defaultArbiter: Address;
  feeBps: number;
  disputeWindowSeconds: number;
  claimWindowSeconds: number;
  arbitrationTimeoutSeconds: number;
  /** Max oracle price age accepted when locking collateral. */
  collateralMaxAgeSeconds: number;
  /** Max oracle price age accepted when paying value out. */
  settlementMaxAgeSeconds: number;
};

export type ProtocolStats = {
  totalGuarantees: number;
  activeGuarantees: number;
  activeCoverageUsd: string;
  lockedValueUsd: string;
  listedStocks: number;
};

export type CollateralQuote = {
  stock: Stock;
  coverageUsd: string;
  /** Tokens to lock, including a small buffer for price moves before the transaction lands. */
  collateral: string;
  collateralValueUsd: string;
  /** One-time protocol fee in tokens. */
  fee: string;
  feeUsd: string;
  /** Total tokens the tenant must hold and approve. */
  totalTokens: string;
};

export type ApiError = { error: { code: string; message: string } };
