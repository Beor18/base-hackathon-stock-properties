import type { PitchDeck } from "./es";

/** Pitch deck (English), for the judges. */
const en: PitchDeck = {
  title: "Pitch",
  nav: { previous: "Previous", next: "Next", slide: "Slide {n} of {total}", openApp: "Open the app" },
  slides: [
    {
      id: "cover",
      title: "Your next home, in stocks.",
      body: "Base Stocks Maxxing. Programmable Stock Markets track.",
      tone: "paper",
      layout: "cover",
    },
    {
      id: "problem",
      label: "The problem",
      title: "In Argentina, homes are paid in dollars, in cash.",
      points: [
        {
          title: "17.5%",
          body: "of Buenos Aires deeds in August 2026 used a mortgage. The rest came from savings (Colegio de Escribanos).",
        },
        {
          title: "USD 254.9B",
          body: "of private dollars sit outside the banking system (INDEC, end of 2025).",
        },
        {
          title: "6+ years",
          body: "saving USD 500 a month for the cheapest used studio in Buenos Aires (Propio, 2026).",
        },
      ],
      tone: "ink",
      layout: "points",
    },
    {
      id: "solution",
      label: "The solution",
      title: "Save in stocks with a real home as the goal.",
      body: "When you get there, your stocks become the home's deposit, without selling them. If you back out, the broker is paid in USDC and the rest comes back to you.",
      tone: "paper",
      layout: "statement",
    },
    {
      id: "how",
      label: "How it works",
      title: "Three steps, zero signatures.",
      points: [
        {
          title: "Pick the home",
          body: "Real Smarlin listings in Puerto Rico, or any Argentine portal by pasting a link. Deposit = price × % (5% default, 1% to 10%).",
        },
        {
          title: "Add",
          body: "USDC or wARS turn into the tokenized stock you picked. GoalRegistry stores the goal with the stock price read from the oracle.",
        },
        {
          title: "Reserve",
          body: "ReservationEscrow locks the stocks in favor of the broker, with a neutral arbiter.",
        },
      ],
      tone: "paper",
      layout: "steps",
    },
    {
      id: "programmable",
      label: "The programmed action",
      title: "A reservation that locks, releases or sells stocks depending on what happens.",
      points: [
        { title: "Lock", body: "Stocks are held in escrow for the broker, with a neutral arbiter." },
        { title: "Release", body: "If the deal closes, the stocks go back to the buyer." },
        {
          title: "Sell to pay",
          body: "settleClaim sells only what's needed through a whitelisted router, requires proceeds ≥ oracle value × (1 − immutable max slippage) and pays in USDC.",
        },
        { title: "No US trading", body: "Nobody on the seller's side receives stocks. Mainnet blocks the US and its territories." },
      ],
      tone: "ink",
      layout: "points",
    },
    {
      id: "frictionless",
      label: "Zero friction",
      title: "Just an email. No wallet in sight.",
      points: [
        { title: "Privy", body: "Email login and an embedded smart wallet, no signing pop-ups." },
        { title: "Coinbase Paymaster", body: "The app pays gas on Base and Base Sepolia." },
        { title: "Batched calls", body: "Approval and action in a single operation (EIP-5792)." },
        { title: "Builder Code", body: "ERC-8021 on every write." },
        { title: "Prices", body: "Coinbase tokenized stocks on Base with Chainlink feeds." },
        { title: "Digital pesos", body: "wARS to stocks through the KyberSwap aggregator, with a treasury fee." },
      ],
      tone: "paper",
      layout: "points",
    },
    {
      id: "why",
      label: "Why it wins",
      title: "Real usage from day one.",
      points: [
        { title: "Smarlin", body: "Our live product in Puerto Rico: 11,925 active listings and 120,002 closed sales analyzed." },
        { title: "From USD 5", body: "Anyone in Argentina can use it tomorrow, and every contribution is a real transaction." },
        { title: "Measurable", body: "On-chain counters for goals, contributions and reservations." },
      ],
      tone: "mango",
      layout: "points",
    },
    {
      id: "model",
      label: "Business model",
      title: "A fee on every contribution and on every reservation.",
      body: "Both are shown before confirming. In the contract, feeBps is capped at 3%.",
      tone: "paper",
      layout: "statement",
    },
    {
      id: "team",
      label: "Team",
      title: "The team behind Smarlin.",
      points: [
        { title: "Kelvin Garcia Vale", body: "Real estate and product. Broker in Puerto Rico (Kelvin Garcia Realty)." },
        { title: "Fernando Lopez", body: "Engineering. Full-stack and web3 builder from Buenos Aires." },
      ],
      tone: "paper",
      layout: "team",
    },
    {
      id: "close",
      title: "Try it with USD 5.",
      body: "Pick a home, add, and watch it fill with color.",
      tone: "accent",
      layout: "close",
    },
  ],
};

export default en;
