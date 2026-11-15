/**
 * Every deploy parameter lives here, with the reason behind each default.
 * `PRODUCT` is copied into `deployment.json`, so the app shows the same numbers the contracts enforce.
 */

const HOUR = 60 * 60;
const DAY = 24 * HOUR;

/**
 * `rampUrl`: where someone buys digital dollars or pesos with a bank transfer. Mainnet only; on test
 * networks the test balance button replaces it. The app copy never names the service.
 */
export const NETWORKS = {
  local: { chainId: 31337, rpcUrl: "http://127.0.0.1:8545", explorerUrl: null, mocks: true, rampUrl: null },
  "base-sepolia": {
    chainId: 84532,
    rpcUrl: "https://sepolia.base.org",
    explorerUrl: "https://sepolia.basescan.org",
    mocks: true,
    rampUrl: null,
  },
  base: {
    chainId: 8453,
    rpcUrl: "https://mainnet.base.org",
    explorerUrl: "https://basescan.org",
    mocks: false,
    rampUrl: "https://www.ripio.com/ar/",
  },
} as const;

export type NetworkName = keyof typeof NETWORKS;

export function isNetworkName(value: string): value is NetworkName {
  return value in NETWORKS;
}

/** Product rules. Contract-enforced values are immutable or owner-only once deployed. */
export const PRODUCT = {
  /** Reservation (seña) as a share of the property price: 5% by default, the person picks 1% to 10%. */
  reservationBps: { default: 500, min: 100, max: 1_000 },
  /** One-time fee on the reservation amount, charged in stock at creation. Contract cap: 3%. */
  reservationFeeBps: 100,
  /**
   * Fee on every contribution (dollars or pesos turned into stock). Charged by the DemoExchange on local
   * and testnet; on mainnet the app passes it to the aggregator with the treasury as fee receiver.
   */
  contributionFeeBps: 50,
  /**
   * Worst discount to the oracle price accepted when the escrow sells stock to pay a claim in USDC.
   * Immutable. 2% covers price impact on the current stock/USDC pools; contract cap: 10%.
   */
  maxSlippageBps: 200,
  /** Time the depositor has to dispute a claim before it becomes payable. */
  disputeWindowSeconds: 3 * DAY,
  /** Time after the closing date during which the broker can still file a claim. */
  claimWindowSeconds: 15 * DAY,
  /** After this, the default arbiter may resolve a dispute the chosen arbiter ignored. */
  arbitrationTimeoutSeconds: 14 * DAY,
  /** Strict price age to move value out (claims, excess withdrawals): one trading day plus slack. */
  settlementMaxAgeSeconds: 26 * HOUR,
  /** Lenient price age to move value in: stock feeds are 24/5 and freeze over long weekends. */
  collateralMaxAgeSeconds: 96 * HOUR,
  /** App rules (not enforced on chain). Smallest contribution ("Desde USD 5"): keeps fees and rounding meaningful. */
  minContributionUsd: 5,
  /** A reservation ends this many days after it is made: the expected closing date of the deal. */
  reservationDays: 60,
  /** Worst price move accepted between quoting a contribution and executing it. */
  contributionSlippageBps: 100,
} as const;

export type ProductParams = typeof PRODUCT;

/** Per-stock collateral ratio from one year of daily closes (see `risk.ts`). */
export const RISK = {
  /** Worst decline measured between any close and the closes of the following N calendar days. */
  windowDays: 30,
  minRatioBps: 11_500,
  maxRatioBps: 20_000,
  stepBps: 500,
  /** Fewer daily closes than this (a recent listing) gets the maximum ratio. */
  minSessions: 200,
  /** Yahoo's last close must be this close to the feed price, or the ticker is treated as unknown. */
  priceTolerance: 0.05,
} as const;

/** Live sources the deploy reads. Nothing about the stock universe is hardcoded. */
export const SOURCES = {
  tokenizedStocksApi: "https://api.coinbase.com/v1/tokenized-stocks",
  chainlinkDirectory: "https://reference-data-directory.vercel.app/feeds-ethereum-mainnet-base-1.json",
  yahooChart: "https://query1.finance.yahoo.com/v8/finance/chart",
  /** Public token list used to find USDC and wARS on Base mainnet; both are verified onchain after. */
  baseTokenList: "https://tokens.coingecko.com/base/all.json",
  kyberAggregator: "https://aggregator-api.kyberswap.com/base/api/v1",
  /** KyberSwap is keyless but asks integrators to identify themselves. */
  kyberClientId: "accasa",
  /** Base mainnet, read on every network: real prices seed the demo feeds. */
  baseMainnetRpc: "https://mainnet.base.org",
} as const;

/** Stock feeds must agree with Coinbase's published NAV within this tolerance. */
export const NAV_TOLERANCE = 0.02;

/** Directory name of the Chainlink feed that quotes Argentine pesos per US dollar. */
export const USD_ARS_FEED_NAME = "USD / ARS";

/** What the deploy expects to find onchain for the pay tokens. */
export const PAY_TOKENS = {
  usdc: { symbol: "USDC", decimals: 6, name: "USD Coin" },
  wars: { symbol: "wARS", decimals: 18, name: "Peso Argentino" },
} as const;

/** Demo-only (local and testnet): the faucet tops each account up to this many US dollars of each mock. */
export const DEMO_FAUCET_USD = 1_000;
