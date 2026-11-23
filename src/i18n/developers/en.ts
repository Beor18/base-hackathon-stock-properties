import type { DevelopersCopy } from "./es";

/** Developer page (English). See `es.ts`. */
const en: DevelopersCopy = {
  title: "Developers",
  label: "For developers",
  heading: "The programmable deposit, for your app.",
  lead: "Accasa is an app, but the reservation lives in an open contract on Base. Any app can lock tokenized stocks as a deposit in someone else's favor, with a margin, a claim, a dispute and an arbiter. It works for a home deposit, a rental deposit or any commitment with a deadline.",
  repo: "Code on GitHub",
  contracts: {
    title: "Contracts",
    network: "Base Sepolia, Base's test network (chain id {chainId}).",
    source: "Verified source",
    unverified: "View on the explorer",
    items: [
      {
        key: "reservationEscrow",
        name: "ReservationEscrow",
        role: "Holds the stocks as the deposit and enforces the rules: claim, dispute, arbiter and payout in USDC.",
      },
      {
        key: "stockOracle",
        name: "StockOracle",
        role: "Lists the accepted stocks with their margin and USD price from Chainlink feeds. Rejects stale prices.",
      },
      { key: "goalRegistry", name: "GoalRegistry", role: "One goal per account: the home and the stock it saves in." },
    ],
    router: {
      name: "Payout market",
      role: "The only router the contract may sell stocks through when paying a claim. On the test network it is a simulated market.",
    },
  },
  lifecycle: {
    title: "How a reservation lives",
    steps: [
      {
        fn: "createReservation",
        body: "The buyer locks stocks worth the deposit plus that stock's margin ({minMargin} to {maxMargin}). They pay {fee} of the deposit, in stocks.",
      },
      {
        fn: "fileClaim",
        body: "If the sale falls through, the beneficiary (the broker) claims up to the deposit, until {claimDays} days after the end date.",
      },
      {
        fn: "acceptClaim or disputeClaim",
        body: "The buyer has {disputeDays} days to accept or dispute. Without an answer, the claim stands.",
      },
      {
        fn: "resolveDispute",
        body: "If disputed, the arbiter awards between zero and the claim. If they don't decide within {arbitrationDays} days, the default arbiter can.",
      },
      {
        fn: "settleClaim",
        body: "Anyone can run the payout. The contract sells only the shares needed, at a price under {settlementHours} hours old and at most {slippage} below it, and pays in USDC. The rest goes back to the buyer.",
      },
      {
        fn: "release",
        body: "If the sale closes, the beneficiary releases the stocks at any time. If nobody claims, anyone can release them {claimDays} days after the end date.",
      },
    ],
  },
  code: {
    title: "Create a reservation from your app",
    body: "Ask the API how much to lock and sign two calls: approve the token and create the reservation.",
    note: "Also: topUp lets anyone add stocks to a reservation, withdrawExcess takes out what is above the margin and extendEndDate moves the end date.",
  },
  api: {
    title: "Read without signing anything",
    body: "Public API, no keys. USD amounts use 18 decimals.",
    items: [
      { path: "GET /api/stocks", body: "Accepted stocks: price, margin, last update and whether they are paused." },
      { path: "GET /api/quote?coverageUsd=5000", body: "How much of each stock to lock for a deposit, fee included." },
      { path: "GET /api/reservations/{id}", body: "One reservation: its status, the claim and what the stocks are worth today." },
      { path: "GET /api/reservations?account=0x…", body: "An account's reservations, as buyer or as broker." },
      { path: "GET /api/stats", body: "Live totals: goals, reservations and value locked." },
    ],
  },
  disclosures: {
    title: "Good to know",
    items: [
      "It runs on Base's test network today. The stocks are test tokens priced from the real Chainlink feeds on Base, and the market they are sold in at payout is simulated.",
      "On the test network prices never go stale. On mainnet they follow US market hours.",
      "The app reads each stock's pause from Coinbase's registry and blocks reserving and payouts during a pause. Before mainnet, the contract will read it too.",
      "Tokenized stocks track the share price and carry no vote in the company.",
      "Every transaction carries Accasa's Builder Code ({builderCode}), per ERC-8021.",
    ],
  },
  cta: "Try the app",
};

export default en;
