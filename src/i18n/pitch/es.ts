/**
 * Pitch deck (Spanish). The only screen allowed to name technologies and third-party brands.
 * Figures come from docs/NARRATIVE.md, with their sources.
 */
export type PitchSlide = {
  id: string;
  /** Short section name shown small above the title. */
  label?: string;
  title: string;
  body?: string;
  points?: { title: string; body?: string }[];
  /** Visual treatment of the slide. */
  tone: "paper" | "ink" | "accent" | "mango";
  layout: "cover" | "statement" | "points" | "steps" | "team" | "close";
};

export type PitchDeck = {
  title: string;
  nav: { previous: string; next: string; slide: string; openApp: string };
  slides: PitchSlide[];
};

const es: PitchDeck = {
  title: "Presentación",
  nav: { previous: "Anterior", next: "Siguiente", slide: "Diapositiva {n} de {total}", openApp: "Abrir la app" },
  slides: [
    {
      id: "cover",
      title: "Tu próxima casa, en acciones.",
      body: "Base Stocks Maxxing. Track Programmable Stock Markets.",
      tone: "paper",
      layout: "cover",
    },
    {
      id: "problem",
      label: "El problema",
      title: "En Argentina, las casas se pagan en dólares y al contado.",
      points: [
        {
          title: "17,5 %",
          body: "de las escrituras de CABA en agosto de 2026 usó hipoteca. El resto salió de ahorro (Colegio de Escribanos).",
        },
        {
          title: "USD 254.898 M",
          body: "del sector privado están fuera del sistema bancario (INDEC, cierre de 2025).",
        },
        {
          title: "Más de 6 años",
          body: "ahorrando USD 500 por mes para el monoambiente usado más barato de Buenos Aires (Propio, 2026).",
        },
      ],
      tone: "ink",
      layout: "points",
    },
    {
      id: "solution",
      label: "La solución",
      title: "Ahorrá en acciones con una casa real como meta.",
      body: "Cuando llegás, tus acciones quedan como seña de la casa, sin venderlas. Si te arrepentís, el corredor cobra en USDC y el resto vuelve a vos.",
      tone: "paper",
      layout: "statement",
    },
    {
      id: "how",
      label: "Cómo funciona",
      title: "Tres pasos, ninguna firma.",
      points: [
        {
          title: "Elegí la casa",
          body: "Propiedades reales de Smarlin en Puerto Rico, o cualquier portal argentino pegando el link. Seña = precio × % (5 % por defecto, de 1 % a 10 %).",
        },
        {
          title: "Sumá",
          body: "USDC o wARS se convierten en la acción tokenizada que elegiste. GoalRegistry guarda la meta con el precio de la acción leído del oráculo.",
        },
        {
          title: "Reservá",
          body: "ReservationEscrow bloquea las acciones a favor del corredor, con un árbitro neutral.",
        },
      ],
      tone: "paper",
      layout: "steps",
    },
    {
      id: "programmable",
      label: "La acción programada",
      title: "Una reserva que bloquea, libera o vende acciones según lo que pase.",
      points: [
        { title: "Bloquear", body: "Las acciones quedan en custodia a favor del corredor, con un árbitro neutral." },
        { title: "Liberar", body: "Si la operación cierra, las acciones vuelven a quien reservó." },
        {
          title: "Vender para cobrar",
          body: "settleClaim vende solo lo necesario por un router en lista blanca, exige lo recibido ≥ valor de oráculo × (1 − slippage máximo inmutable) y paga en USDC.",
        },
        { title: "Sin trading en EE.UU.", body: "Nadie del lado del vendedor recibe acciones. Mainnet bloquea EE.UU. y sus territorios." },
      ],
      tone: "ink",
      layout: "points",
    },
    {
      id: "frictionless",
      label: "Cero fricción",
      title: "Email y listo. Sin wallet a la vista.",
      points: [
        { title: "Privy", body: "Login con email y smart wallet embebida, sin modales de firma." },
        { title: "Coinbase Paymaster", body: "El gas lo paga la app en Base y Base Sepolia." },
        { title: "Llamadas en lote", body: "Aprobación y acción en una sola operación (EIP-5792)." },
        { title: "Builder Code", body: "ERC-8021 en todas las escrituras." },
        { title: "Precios", body: "Acciones tokenizadas de Coinbase en Base con feeds de Chainlink." },
        { title: "Pesos digitales", body: "wARS a acciones por el agregador KyberSwap, con comisión a tesorería." },
      ],
      tone: "paper",
      layout: "points",
    },
    {
      id: "why",
      label: "Por qué gana",
      title: "Uso real desde el primer día.",
      points: [
        { title: "Smarlin", body: "Nuestro producto en Puerto Rico: 11.925 propiedades publicadas y 120.002 ventas cerradas analizadas." },
        { title: "Desde USD 5", body: "Cualquiera en Argentina lo usa mañana, y cada aporte es una operación real." },
        { title: "Medible", body: "Contadores on-chain de metas, aportes y reservas." },
      ],
      tone: "mango",
      layout: "points",
    },
    {
      id: "model",
      label: "Modelo de negocio",
      title: "Comisión en cada aporte y al reservar.",
      body: "Las dos se muestran antes de confirmar. En el contrato, feeBps tiene un tope de 3 %.",
      tone: "paper",
      layout: "statement",
    },
    {
      id: "team",
      label: "Equipo",
      title: "El equipo detrás de Smarlin.",
      points: [
        { title: "Kelvin Garcia Vale", body: "Real estate y producto. Corredor en Puerto Rico (Kelvin Garcia Realty)." },
        { title: "Fernando Lopez", body: "Ingeniería. Full-stack y builder web3 desde Buenos Aires." },
      ],
      tone: "paper",
      layout: "team",
    },
    {
      id: "close",
      title: "Probalo con USD 5.",
      body: "Elegí una casa, sumá y mirá cómo se pinta.",
      tone: "accent",
      layout: "close",
    },
  ],
};

export default es;
