import type { PitchDeck } from "./es";

/** Pitch deck (English), for the judges. */
const en: PitchDeck = {
  title: "Pitch",
  nav: { previous: "Previous", next: "Next", slide: "Slide {n} of {total}", openApp: "Open the app" },
  live: {
    goals: "Goals created",
    reservations: "Reservations made",
    locked: "In stocks locked as deposits",
    stocks: "Stocks to choose from",
    loading: "Reading the contracts. It usually takes 3 seconds.",
    unavailable: "We could not read the contracts just now. The links below show the same numbers.",
    contracts: "Check it yourself:",
    escrow: "Reservations contract",
    registry: "Goals contract",
  },
  slides: [
    {
      id: "cover",
      title: "Your next home, in stocks.",
      body: "You save in stocks with your home as the goal. When you get there, they become the deposit, without selling them.",
      foot: "Base Stocks Maxxing. Programmable Stock Markets track.",
      tone: "paper",
      layout: "cover",
    },
    {
      id: "problem",
      label: "The problem",
      title: "In Argentina, homes are paid for in dollars, in cash.",
      points: [
        {
          title: "84.6%",
          body: "of Buenos Aires City deeds were signed without a mortgage from January to September 2026: 40,769 of 48,195 (Colegio de Escribanos).",
        },
        {
          title: "USD 120,106",
          body: "is the average paid per deed. It comes from years of savings that earn nothing in the meantime (Colegio de Escribanos, September 2026).",
        },
        {
          title: "6+ years",
          body: "saving USD 500 a month for the cheapest used studio in Buenos Aires (Propio, 2026).",
        },
      ],
      numbers: true,
      foot: "And the day the home shows up, the deposit has to be there in cash. Whoever had invested must sell all at once.",
      tone: "ink",
      layout: "points",
    },
    {
      id: "insight",
      label: "What we saw",
      title: "People with money don't sell their stocks. They pledge them.",
      body: "Schwab alone has USD 33.4 B lent against pledged stocks, 59% more than a year earlier. It is for large portfolios. Someone saving USD 300 a month sells everything the day the home shows up.",
      foot: "Source: Schwab, second quarter report, data as of June 30, 2026.",
      tone: "mango",
      layout: "statement",
    },
    {
      id: "solution",
      label: "The solution",
      title: "The deposit that doesn't make you sell.",
      body: "You save in stocks with your home as the goal. When you get there, they are locked in favor of the broker. If the deal closes, they come back to you. If you back out, the broker is paid in USDC and the rest comes back.",
      tone: "paper",
      layout: "statement",
    },
    {
      id: "how",
      label: "How it works",
      title: "Three steps, no signatures.",
      points: [
        {
          title: "Pick the home",
          body: "Smarlin listings in Puerto Rico, or any Argentine portal by pasting a link. The deposit is the price times a percentage: {depositDefault} by default, from {depositMin} to {depositMax}.",
        },
        {
          title: "Add",
          body: "From {minContribution}, with USDC or wARS. They become the tokenized stock you chose. You sign in with your email, with no wallet in sight and no gas to pay.",
        },
        {
          title: "Reserve",
          body: "One tap locks the stocks in favor of the broker, with a neutral arbiter and a public page for the reservation.",
        },
      ],
      foot: "Built with: Privy (email sign-in and an invisible account), Coinbase Paymaster (gas), EIP-5792 (approve and act in one step), ERC-8021 (Builder Code on every operation), Chainlink (prices) and KyberSwap (pesos to stocks).",
      tone: "paper",
      layout: "steps",
    },
    {
      id: "programmable",
      label: "The programmed stock",
      title: "A reservation that locks, releases or sells stock depending on what happens.",
      points: [
        { title: "Lock", body: "The stocks are held in favor of the broker, with a neutral arbiter." },
        { title: "Release", body: "If the deal closes, the stocks go back to whoever reserved." },
        {
          title: "Sell to settle",
          body: "settleClaim sells only what is needed through an allowlisted router, requires received ≥ oracle value × (1 − immutable max slippage) and pays in USDC.",
        },
        { title: "No US trading", body: "Nobody on the seller's side receives stocks. Mainnet blocks the US and its territories." },
      ],
      foot: "Why not borrow USDC against the stocks and pay the deposit? Because here there is no debt and no interest, and the stocks are only sold if you back out.",
      tone: "ink",
      layout: "points",
    },
    {
      id: "whynow",
      label: "Why now",
      title: "Until August 2026 this could not be built.",
      points: [
        {
          title: "August 24",
          body: "Coinbase launches native tokenized stocks on Base, backed 1 to 1. By September, Morpho and Aave already take them as collateral for loans.",
        },
        {
          title: "USD 3.77 B",
          body: "in tokenized stocks today. In March it was USD 1 B (rwa.xyz, Cointelegraph).",
        },
        {
          title: "2.6%",
          body: "of those stocks are used as collateral for anything. The rest sit idle in an account (RedStone, October 2026).",
        },
      ],
      numbers: true,
      tone: "paper",
      layout: "points",
    },
    {
      id: "growth",
      label: "Growth engine",
      title: "Chipping in: every home brings its people.",
      body: "In Argentina it is a vaquita. In Puerto Rico, a serrucho. Same thing: several people pooling money.",
      points: [
        {
          title: "One link over WhatsApp",
          body: "The saver shares their home. Family and friends add from {minContribution}, and the stocks go straight to that goal.",
        },
        {
          title: "Every contribution brings a user",
          body: "Whoever chips in signs in with their email and lands on one button: pick your home.",
        },
        {
          title: "Brokers spread it too",
          body: "Every reservation link a broker sends brings a buyer to Seña.",
        },
      ],
      tone: "mango",
      layout: "points",
    },
    {
      id: "lean",
      label: "How we decide",
      title: "We don't guess: we measure.",
      body: "Three hypotheses, one metric for each, and a threshold to persevere or pivot.",
      points: [
        {
          tag: "Value",
          title: "A specific home keeps you saving",
          body: "Metric: goals with a second contribution within 30 days. We persevere above 40%.",
        },
        {
          tag: "Growth",
          title: "Every goal brings new people",
          body: "Metric: people contributing per goal. We persevere above 1.3.",
        },
        {
          tag: "The riskiest",
          title: "A broker accepts locked stocks as a deposit",
          body: "Metric: brokers who accept a reservation. We persevere with 3 of the first 10.",
        },
      ],
      foot: "We already pivoted once. We started with a rental guarantee in stocks: it is used a single time. People save for a home every month. The contract stayed, the story changed.",
      tone: "paper",
      layout: "points",
    },
    {
      id: "traction",
      label: "Traction",
      title: "Live, from the contracts.",
      body: "These numbers do not come from a spreadsheet. They are being read from Base right now.",
      tone: "ink",
      layout: "live",
    },
    {
      id: "market",
      label: "Market",
      title: "USD 409 M a year in deposits, in one city alone.",
      points: [
        {
          tag: "Purchases per year, Buenos Aires City",
          title: "USD 8.18 B",
          body: "68,109 deeds at an average of USD 120,106 (Colegio de Escribanos, October 2025 to September 2026).",
        },
        {
          tag: "What is handed over as deposit",
          title: "USD 409 M",
          body: "with a deposit of 5% of the price. Today it comes out of savings, in cash.",
        },
        {
          tag: "Who we talk to first",
          title: "1 million+",
          body: "Argentines who already hold US stocks as CEDEARs, among 12.3 million with an investment account (BYMA, May 2026).",
        },
      ],
      numbers: true,
      foot: "Plainly: at today's fees, the whole city would bring about USD 6 M a year. That is why the plan continues with the purchase agreement, which is 30% of the price, and a subscription for brokers.",
      tone: "paper",
      layout: "points",
    },
    {
      id: "competition",
      label: "Competition",
      title: "We found nobody doing all three.",
      compare: {
        columns: ["Stays invested", "No debt", "Works as deposit"],
        rows: [
          { name: "Dollar bills", cells: [false, true, true] },
          { name: "CEDEARs at a broker", cells: [true, true, false] },
          { name: "Fractions of property", cells: [true, true, false] },
          { name: "Loan against stocks", note: "Aave, Morpho", cells: [true, false, true] },
          { name: "Crypto-backed mortgage", note: "Better and Coinbase, US only", cells: [true, false, false] },
          { name: "Seña", cells: [true, true, true], ours: true },
        ],
        yes: "Yes",
        no: "No",
      },
      foot: "The closest thing comes from Coinbase: with Better, people pledge bitcoin or USDC for the down payment, and they plan to add stocks. It is a loan. What cannot be copied: the brokers who accept the reservation and Smarlin's data.",
      tone: "paper",
      layout: "compare",
    },
    {
      id: "model",
      label: "Business model",
      title: "We charge when you add and when you reserve.",
      body: "Both fees are shown before confirming. A {exampleDeposit} deposit earns us {exampleRevenue}.",
      points: [
        { title: "{contributionFee}", body: "on each contribution, when it becomes stocks." },
        { title: "{reservationFee}", body: "on the deposit, when reserving. The contract does not allow charging more than 3%." },
        {
          title: "Next",
          body: "A monthly plan for brokers and agencies on top of Smarlin: dashboard, reservation links and market data.",
        },
      ],
      numbers: true,
      tone: "paper",
      layout: "points",
    },
    {
      id: "team",
      label: "Team",
      title: "The team behind Smarlin.",
      body: "Smarlin already runs in Puerto Rico: 11,925 listings published and 120,002 closed sales analyzed.",
      points: [
        { title: "Kelvin Garcia Vale", body: "Property and product. Broker in Puerto Rico (Kelvin Garcia Realty)." },
        { title: "Fernando Lopez", body: "Engineering. Full-stack and web3 builder from Buenos Aires." },
      ],
      tone: "paper",
      layout: "team",
    },
    {
      id: "next",
      label: "What comes next",
      title: "Three stages. At each one, persevere or pivot.",
      points: [
        { title: "Until December 5", body: "Mainnet with amount caps and the first reservation with a broker." },
        { title: "Months 1 to 3", body: "100 goals and 5 brokers. Legal opinion and a contract audit." },
        { title: "Months 3 to 12", body: "1,000 goals and 20 reservations. A plan for brokers, purchase agreements and other property portals." },
      ],
      foot: "What we ask for: three brokers willing to accept a reservation in stocks, and the track prize for the audit and legal work.",
      tone: "ink",
      layout: "steps",
    },
    {
      id: "close",
      title: "Pick a home. Add {minContribution}.",
      body: "And watch it paint itself.",
      tone: "accent",
      layout: "close",
    },
  ],
};

export default en;
