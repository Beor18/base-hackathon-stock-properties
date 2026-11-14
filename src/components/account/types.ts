/**
 * View models for the screens that depend on the person's account. They are deliberately plain
 * (numbers in whole units, no bigint, no contract types): the integration role maps on-chain
 * data and API responses into these shapes and passes them in as props.
 */

/** A stock the person can save in. `id` is opaque to the UI (token address in practice). */
export type StockOption = {
  id: string;
  /** Company name as people know it: "Apple", "Nvidia". Never a token symbol with suffixes. */
  name: string;
  /** Plain ticker for a secondary label ("AAPL"), or null to hide it. */
  ticker: string | null;
  iconUrl: string | null;
  priceUsd: number;
  /** Change over the last 12 months, in percent (12.5 = +12,5 %). Null hides it. */
  change12mPct: number | null;
  /**
   * Goal setup only: USD in this stock needed to reserve the draft's seña (the stock's safety
   * margin and the fee included). Null or missing hides it.
   */
  needUsd?: number | null;
};

export type GoalProperty = {
  ref: string;
  title: string;
  location: string | null;
  imageUrl: string | null;
  priceUsd: number;
};

/** A goal the person is setting up (from the detail screen) but has not saved yet. */
export type GoalDraft = {
  property: GoalProperty;
  depositPct: number;
  targetUsd: number;
};

export type Goal = {
  property: GoalProperty;
  depositPct: number;
  /**
   * USD in stocks needed to reserve: the seña plus the safety margin the stock requires and the
   * reservation fee. Progress and "reached" are measured against it.
   */
  targetUsd: number;
  /** The seña in USD (what the broker can claim). */
  senaUsd: number;
  /** Current market value of the shares held for this goal, in USD. */
  savedUsd: number;
  shares: number;
  stock: StockOption;
  /** Since the goal started, in percent. Null hides the comparison. */
  houseChangePct: number | null;
  stocksChangePct: number | null;
};

export type Balances = {
  /** Digital dollars available, in USD. */
  usd: number;
  /** Digital pesos available, in ARS. */
  ars: number;
};

export type PayCurrency = "usd" | "ars";

/** A running transaction: which of the screen's steps is in progress (0-based). */
export type TxProgress = { step: number };

/**
 * Email sign-in, rendered by every account screen when there is no session.
 * Two steps (email, then code) so the whole login happens inside Seña's own UI.
 */
export type SignInProps = {
  step: "email" | "code";
  /** The email the code was sent to (shown on the code step). */
  email: string;
  status: "idle" | "sending" | "verifying";
  error: "invalid-email" | "invalid-code" | "generic" | null;
  onSubmitEmail: (email: string) => void;
  onSubmitCode: (code: string) => void;
  onResend: () => void;
  onChangeEmail: () => void;
};
