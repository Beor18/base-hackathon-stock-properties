import type { PitchDeck } from "./es";

/** Pitch deck (English), for the judges. Mirrors the Spanish one. */
const en: PitchDeck = {
  title: "Pitch",
  nav: { previous: "Previous", next: "Next", slide: "Slide {n} of {total}", openApp: "Open the app" },
  live: {
    title: "Today, read live from the network",
    goals: "Goals",
    reservations: "Reservations",
    locked: "Locked as deposits",
    loading: "Reading the network. It usually takes 3 seconds.",
    unavailable: "We could not read the network right now. Try again in a while.",
    verify: "Check it yourself",
  },
  slides: [
    {
      id: "cover",
      title: "Your next home, in stocks.",
      body: "You save in stocks with your home as the goal. When you get there, those stocks are your deposit. You sell nothing.",
      shots: [{ src: "/pitch/meta-en.webp", alt: "A goal in Accasa: the home's photo fills with color as you save." }],
      foot: "Base Stocks Maxxing 2026",
      tone: "paper",
      layout: "cover",
    },
    {
      id: "problem",
      label: "The problem",
      title: "In Latin America, buying a home starts with saving the down payment.",
      points: [
        { title: "11% or less", body: "of GDP is mortgage credit in Brazil, Mexico, Colombia and Peru. In the US, 44%." },
        { title: "84.6%", body: "of home purchases in Buenos Aires city closed without a mortgage." },
        { title: "Seña, enganche, pie", body: "cuota inicial, entrada, pronto. Every country has its own word for it." },
      ],
      numbers: true,
      foot: "Those savings sleep in a drawer. And whoever invested them sells everything at once the day the home shows up. Sources: Deloitte and US Federal Reserve (2025), Buenos Aires Notaries' Association (2026).",
      tone: "ink",
      layout: "points",
    },
    {
      id: "insight",
      label: "What we saw",
      title: "People with money don't sell their stocks. They pledge them.",
      body: "Private banks have done it for decades, for large portfolios. We do it for people who save USD 100 a month.",
      foot: "At a single US bank, USD 33.4B is lent against pledged stocks, 59% more than a year ago (Schwab, June 2026).",
      tone: "mango",
      layout: "statement",
    },
    {
      id: "product",
      label: "The product",
      title: "Three steps. You sell nothing.",
      shots: [
        {
          src: "/pitch/casa-en.webp",
          alt: "Picking a home for sale in Accasa.",
          title: "Pick the home",
          body: "One in Puerto Rico, or a link from any listings site.",
        },
        {
          src: "/pitch/sumar-en.webp",
          alt: "Adding USD 50 to the goal, with the fee in sight.",
          title: "Add from {minContribution}",
          body: "Every contribution buys stocks. You see what is left.",
        },
        {
          src: "/pitch/reservar-en.webp",
          alt: "Reserving the home with the stocks as the deposit.",
          title: "Reserve",
          body: "Your stocks become the deposit. If the purchase closes, they come back to you.",
        },
      ],
      foot: "You sign in with your email. No wallets to see, no network costs to pay.",
      tone: "paper",
      layout: "product",
    },
    {
      id: "growth",
      label: "How we grow",
      title: "Every home brings its people.",
      body: "In Argentina it is a vaquita. In Puerto Rico, a serrucho. Many people chipping in for something big.",
      points: [
        { title: "Ana picks her home and sends the link on WhatsApp." },
        { title: "Her family adds from {minContribution}. The stocks go to Ana's home." },
        { title: "Everyone who chipped in ends up in front of one button: pick your home." },
      ],
      shots: [{ src: "/pitch/vaquita-en.webp", alt: "The vaquita: someone adds USD 50 to another person's home." }],
      foot: "And every broker who sends a reservation link brings their buyer.",
      tone: "accent",
      layout: "growth",
    },
    {
      id: "zero",
      label: "From 0 to 1",
      title: "We start at zero. This is how we reach 100 homes.",
      points: [
        {
          title: "By November 28",
          body: "Kelvin shows a reservation to 10 brokers in his network. We keep going if 3 accept it.",
        },
        {
          title: "By December 5",
          body: "20 people we know set a goal and share their vaquita. We keep going if 4 in 10 add again on their own.",
        },
        {
          title: "Before the deadline",
          body: "The first reservation end to end with a broker. The case we show the next 100.",
        },
      ],
      foot: "Every step ends in a decision: keep going or change course. We measure people adding to each home, not visits.",
      tone: "paper",
      layout: "zero",
    },
    {
      id: "model",
      label: "The business",
      title: "We earn when you move forward.",
      body: "Two fees, always shown before you confirm. A {exampleDeposit} deposit earns us {exampleRevenue}.",
      points: [
        { title: "{contributionFee}", body: "of every contribution." },
        { title: "{reservationFee}", body: "of the deposit, when reserving." },
        { title: "USD 409M", body: "a year is handed over as deposits in Buenos Aires city alone." },
      ],
      numbers: true,
      foot: "Next: a monthly plan for brokers. Market: 68,109 purchases a year at USD 120,106 on average, with a 5% deposit (Buenos Aires Notaries' Association, 2025 to 2026).",
      tone: "mango",
      layout: "points",
    },
    {
      id: "close",
      title: "Pick a home. Add {minContribution}.",
      body: "And watch it fill with color.",
      points: [
        { title: "Kelvin Garcia Vale", body: "Broker in Puerto Rico. Brings the first brokers." },
        { title: "Fernando Lopez", body: "Engineer in Buenos Aires. Built Accasa end to end." },
      ],
      foot: "We are the team behind Smarlin, with 11,925 listings in Puerto Rico. We are looking for 3 brokers to accept the first reservation backed by stocks.",
      tone: "ink",
      layout: "close",
    },
  ],
};

export default en;
