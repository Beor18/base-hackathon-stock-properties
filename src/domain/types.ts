import type { Address, Hex } from "viem";

/**
 * Wire types shared by the API routes and the UI.
 * Big numbers travel as decimal strings: USD amounts use 18 decimals, token amounts the token's decimals.
 */

export type Stock = {
  address: Address;
  /** Token symbol, e.g. "AAPLc". Developer-facing only. */
  symbol: string;
  /** Plain ticker, e.g. "AAPL". */
  ticker: string;
  /** Legal name, e.g. "Apple Inc.". */
  name: string;
  /** Name as people say it, e.g. "Apple". */
  shortName: string;
  decimals: number;
  iconUrl: string | null;
  /** USD per whole token, 18 decimals. */
  priceUsd: string;
  /** Unix seconds of the last oracle update. Feeds follow market hours, so weekends are expected to lag. */
  priceUpdatedAt: number;
  /** Collateral required per unit of reservation, in basis points (11_500 = 115%). */
  collateralRatioBps: number;
  /** Whether the stock can back new goals and reservations. */
  enabled: boolean;
  /**
   * Coinbase paused the stock for a corporate action (a split, for instance): its price is frozen and
   * nothing should lock or settle against it until the pause ends. Read from the registry on Base
   * mainnet, for the real stock a testnet token mirrors.
   */
  paused: boolean;
  /** Change of the underlying share over the last 12 months, in percent. Null when unknown. */
  change12mPct: number | null;
};

export type ClaimStatus = "none" | "filed" | "disputed" | "approved";
export type ClaimReason = "backed_out" | "unpaid_rent" | "damages" | "other";
export type ReservationStatus = "active" | "closed";

export type Claim = {
  status: Exclude<ClaimStatus, "none">;
  reason: ClaimReason;
  amountUsd: string;
  filedAt: number;
  /** Until when the depositor can dispute. Afterwards an undisputed claim becomes payable. */
  disputeDeadline: number;
  /** When the protocol arbiter may step in for an unresponsive arbiter. Only set for disputed claims. */
  arbitrationFallbackAt: number | null;
  /** True when anyone can trigger the payout. */
  isPayable: boolean;
};

export type Reservation = {
  id: string;
  status: ReservationStatus;
  depositor: Address;
  beneficiary: Address;
  arbiter: Address;
  stock: Stock;
  /** Stock tokens locked. */
  collateral: string;
  /** Current market value of the collateral, 18 decimals. */
  collateralValueUsd: string;
  /** USD the beneficiary can still claim, 18 decimals. */
  coverageUsd: string;
  collateralRatioBps: number;
  createdAt: number;
  endsAt: number;
  /** Last moment the beneficiary can file a claim; afterwards anyone can release the collateral. */
  claimDeadline: number;
  /** keccak256 of the property ref, null if the reservation names none. */
  propertyRef: Hex | null;
  claim: Claim | null;
  /** USDC (6 decimals) paid to the beneficiary by settlements so far. Null when the history is unavailable. */
  paidUsdc: string | null;
  /** Block time when this was read. Every deadline above is compared against it. */
  chainTime: number;
};

/** A reservation together with the property it reserves (resolved from the depositor's goal). */
export type ReservationDetail = Reservation & { property: GoalPropertyDto | null };

export type ProtocolConfig = {
  chainId: number;
  escrowAddress: Address;
  goalRegistryAddress: Address;
  oracleAddress: Address;
  defaultArbiter: Address;
  treasury: Address;
  /** Reservation fee, charged once in stock at creation. */
  reservationFeeBps: number;
  /** Fee on every contribution. */
  contributionFeeBps: number;
  maxSlippageBps: number;
  disputeWindowSeconds: number;
  claimWindowSeconds: number;
  arbitrationTimeoutSeconds: number;
  collateralMaxAgeSeconds: number;
  settlementMaxAgeSeconds: number;
};

export type ProtocolStats = {
  /** Goals ever set, replacements included. */
  goalCount: number;
  /** Accounts with a goal right now. */
  activeGoals: number;
  /** Reservations ever created. */
  reservationCount: number;
  activeReservations: number;
  /** USD coverage of active reservations, 18 decimals. */
  activeCoverageUsd: string;
  /** Market value of the stock locked in the escrow, 18 decimals. */
  lockedValueUsd: string;
  listedStocks: number;
};

/** What reserving `coverageUsd` with one stock takes at the current oracle price. */
export type CollateralQuote = {
  stock: Stock;
  coverageUsd: string;
  /** Tokens to lock, including a small buffer for price moves before the transaction lands. */
  collateral: string;
  collateralValueUsd: string;
  /** One-time reservation fee in tokens, padded for price moves (what gets approved). */
  fee: string;
  feeUsd: string;
  /** Total tokens the depositor must hold and approve. */
  totalTokens: string;
  /** Market value of `totalTokens`: what the account needs to hold in this stock to reserve. */
  totalValueUsd: string;
};

/** The property a goal or reservation points to, as stored or re-read from its source. */
export type GoalPropertyDto = {
  ref: string;
  title: string;
  location: string | null;
  imageUrl: string | null;
  /** Current price when the source still has it, else the price stored with the goal. */
  priceUsd: number;
  /** Whether `priceUsd` was read from the source just now (false: it is the stored one). */
  livePrice: boolean;
  sourceUrl: string | null;
  agent: { name: string; company: string | null } | null;
};

export type GoalView = {
  propertyRef: Hex;
  propertyKey: string;
  property: GoalPropertyDto;
  stock: Stock;
  beneficiary: Address | null;
  createdAt: number;
  /** The seña: what the reservation covers, 18 decimals. */
  senaUsd: string;
  /** Deposit percentage the goal was set with (seña over price at start). */
  depositPct: number;
  propertyPriceUsd: string;
  startStockPriceUsd: string;
  /** Shares in the account plus shares locked in this goal's active reservation. */
  shares: string;
  walletShares: string;
  lockedShares: string;
  /** Market value of `shares`, 18 decimals. */
  savedUsd: string;
  /** What reserving the seña takes with this stock today. */
  need: CollateralQuote;
  /** True when the account holds enough of the stock to reserve right now. */
  reached: boolean;
  houseChangePct: number | null;
  stocksChangePct: number | null;
  /** Active reservation of this account for the goal's property, if any. */
  activeReservationId: string | null;
};

export type AccountSnapshot = {
  address: Address;
  /** Pay token balances in token units: USDC (6 decimals) and wARS (18 decimals). */
  balances: { usdc: string; wars: string };
  goal: GoalView | null;
};

/** One call of a batch, ready to send. `value` is in wei. */
export type PlannedCall = { to: Address; data: Hex; value: string };

export type Plan<Quote> = { calls: PlannedCall[]; quote: Quote };

export type GoalPlanQuote = { senaUsd: string; propertyPriceUsd: string; propertyKey: string; need: CollateralQuote };

export type ContributionPlanQuote = {
  currency: "usd" | "ars";
  /** Amount paid, in pay token units. */
  amountIn: string;
  /** Fee kept, in pay token units. */
  fee: string;
  feeBps: number;
  /** Shares received, in stock token units. */
  sharesOut: string;
  /** Oracle price of one share, 18 decimals. */
  sharePriceUsd: string;
  /** Market value of `sharesOut`, 18 decimals. */
  valueUsd: string;
};

export type ReservePlanQuote = {
  reached: boolean;
  senaUsd: string;
  depositPct: number;
  need: CollateralQuote;
  /** Shares the account can lock right now. */
  walletShares: string;
  endsAt: number;
  feeBps: number;
};

export type FaucetPlanQuote = { usdc: string; wars: string };

export type ApiError = { error: { code: string; message: string; contractError?: string } };

/** A broker's reservation offer, behind the short link `/o/<id>`. */
export type ReservationOfferDto = {
  id: string;
  ref: string;
  /** Listing URL, only for pasted links. */
  sourceUrl: string | null;
  /** Seña as a percentage of the price. */
  pct: number;
  broker: Address;
  brokerName: string;
  brokerCompany: string | null;
  /** The broker's sign-in email matched the listing agent's on Smarlin when the link was made. */
  verified: boolean;
};

/** When the broker last opened their inbox (unix seconds), or null if never. */
export type InboxSeen = { seenAt: number | null };
