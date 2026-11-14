/**
 * Pitch deck (Spanish). The only screen allowed to name technologies and third-party brands.
 * Market figures come from docs/NARRATIVE.md and docs/research, with their sources. Product figures
 * (fees, minimums, deposit range) are `{placeholders}` filled from the deployment by the deck.
 */
export type PitchSlide = {
  id: string;
  /** Short section name shown small above the title. */
  label?: string;
  title: string;
  body?: string;
  /** `tag` is a small heading above the point's title (e.g. which hypothesis it is). */
  points?: { tag?: string; title: string; body?: string }[];
  /** Point titles are figures: render them large. */
  numbers?: boolean;
  /** Alternatives against what Seña does. `cells` follow `columns`; `ours` marks Seña's row. */
  compare?: {
    columns: string[];
    /** `note` names examples of the alternative, shown smaller next to its name. */
    rows: { name: string; note?: string; cells: boolean[]; ours?: boolean }[];
    yes: string;
    no: string;
  };
  /** Small print under the content: sources and the stack. */
  foot?: string;
  /** Visual treatment of the slide. */
  tone: "paper" | "ink" | "accent" | "mango";
  layout: "cover" | "statement" | "points" | "steps" | "team" | "close" | "live" | "compare";
};

export type PitchDeck = {
  title: string;
  nav: { previous: string; next: string; slide: string; openApp: string };
  /** Labels of the live traction slide, read from the contracts. */
  live: {
    goals: string;
    reservations: string;
    locked: string;
    stocks: string;
    loading: string;
    unavailable: string;
    contracts: string;
    escrow: string;
    registry: string;
  };
  slides: PitchSlide[];
};

const es: PitchDeck = {
  title: "Presentación",
  nav: { previous: "Anterior", next: "Siguiente", slide: "Diapositiva {n} de {total}", openApp: "Abrir la app" },
  live: {
    goals: "Metas creadas",
    reservations: "Reservas hechas",
    locked: "En acciones bloqueadas como seña",
    stocks: "Acciones para elegir",
    loading: "Leyendo los contratos. Suele tardar 3 segundos.",
    unavailable: "No pudimos leer los contratos ahora. Los links de abajo muestran lo mismo.",
    contracts: "Verificalo vos:",
    escrow: "Contrato de reservas",
    registry: "Contrato de metas",
  },
  slides: [
    {
      id: "cover",
      title: "Tu próxima casa, en acciones.",
      body: "Ahorrás en acciones con tu casa como meta. Cuando llegás, quedan como seña, sin venderlas.",
      foot: "Base Stocks Maxxing. Track Programmable Stock Markets.",
      tone: "paper",
      layout: "cover",
    },
    {
      id: "problem",
      label: "El problema",
      title: "En Argentina, las casas se pagan en dólares y al contado.",
      points: [
        {
          title: "84,6 %",
          body: "de las escrituras de la Ciudad de Buenos Aires se firmó sin hipoteca entre enero y septiembre de 2026: 40.769 de 48.195 (Colegio de Escribanos).",
        },
        {
          title: "USD 120.106",
          body: "es lo que se paga en promedio por escritura. Sale de años de ahorro que mientras tanto no rinde nada (Colegio de Escribanos, septiembre de 2026).",
        },
        {
          title: "Más de 6 años",
          body: "ahorrando USD 500 por mes para el monoambiente usado más barato de Buenos Aires (Propio, 2026).",
        },
      ],
      numbers: true,
      foot: "Y el día que aparece la casa, hay que tener la seña en efectivo. El que había invertido tiene que vender de golpe.",
      tone: "ink",
      layout: "points",
    },
    {
      id: "insight",
      label: "Lo que vimos",
      title: "El que tiene plata no vende sus acciones. Las pone de garantía.",
      body: "Solo en Schwab hay USD 33.400 M prestados con acciones en garantía, 59 % más que un año antes. Es para carteras grandes. El que ahorra de a USD 300 por mes vende todo el día que aparece la casa.",
      foot: "Fuente: Schwab, informe del segundo trimestre, datos al 30 de junio de 2026.",
      tone: "mango",
      layout: "statement",
    },
    {
      id: "solution",
      label: "La solución",
      title: "La seña que no te obliga a vender.",
      body: "Ahorrás en acciones con tu casa como meta. Al llegar, quedan bloqueadas a favor del corredor. Si la operación cierra, vuelven a vos. Si te arrepentís, el corredor cobra en USDC y el resto vuelve.",
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
          body: "Propiedades de Smarlin en Puerto Rico, o cualquier portal argentino pegando el link. La seña es el precio por un porcentaje: {depositDefault} por defecto, de {depositMin} a {depositMax}.",
        },
        {
          title: "Sumá",
          body: "Desde {minContribution}, con USDC o wARS. Se convierten en la acción tokenizada que elegiste. Entrás con tu email, sin wallet a la vista y sin pagar gas.",
        },
        {
          title: "Reservá",
          body: "Un toque bloquea las acciones a favor del corredor, con un árbitro neutral y una página pública de la reserva.",
        },
      ],
      foot: "Hecho con: Privy (ingreso con email y cuenta invisible), Coinbase Paymaster (gas), EIP-5792 (aprobar y actuar en un solo paso), ERC-8021 (Builder Code en cada operación), Chainlink (precios) y KyberSwap (de pesos a acciones).",
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
      foot: "¿Por qué no pedir USDC prestados contra las acciones y pagar la seña? Porque acá no hay deuda ni interés, y las acciones solo se venden si te arrepentís.",
      tone: "ink",
      layout: "points",
    },
    {
      id: "whynow",
      label: "Por qué ahora",
      title: "Hasta agosto de 2026 esto no se podía construir.",
      points: [
        {
          title: "24 de agosto",
          body: "Coinbase lanza acciones tokenizadas nativas en Base, con respaldo 1 a 1. En septiembre, Morpho y Aave ya las toman como garantía de préstamos.",
        },
        {
          title: "USD 3.770 M",
          body: "en acciones tokenizadas hoy. En marzo eran USD 1.000 M (rwa.xyz, Cointelegraph).",
        },
        {
          title: "2,6 %",
          body: "de esas acciones se usa como garantía de algo. El resto está quieto en una cuenta (RedStone, octubre de 2026).",
        },
      ],
      numbers: true,
      tone: "paper",
      layout: "points",
    },
    {
      id: "growth",
      label: "Motor de crecimiento",
      title: "La vaquita: cada casa trae a su gente.",
      body: "En Argentina le decimos vaquita. En Puerto Rico, serrucho. Es lo mismo: juntar entre varios.",
      points: [
        {
          title: "Un link por WhatsApp",
          body: "Quien ahorra comparte su casa. Familia y amigos suman desde {minContribution} y las acciones van directo a esa meta.",
        },
        {
          title: "Cada aporte trae un usuario",
          body: "El que suma entra con su email y termina frente a un botón: elegí tu casa.",
        },
        {
          title: "El corredor también reparte",
          body: "Cada link de reserva que manda un corredor trae un comprador a Seña.",
        },
      ],
      tone: "mango",
      layout: "points",
    },
    {
      id: "lean",
      label: "Cómo decidimos",
      title: "No adivinamos: medimos.",
      body: "Tres hipótesis, una métrica para cada una y un umbral para seguir o pivotar.",
      points: [
        {
          tag: "Valor",
          title: "Una casa concreta hace que sigas ahorrando",
          body: "Métrica: metas con un segundo aporte dentro de los 30 días. Seguimos si pasa el 40 %.",
        },
        {
          tag: "Crecimiento",
          title: "Cada meta trae gente nueva",
          body: "Métrica: personas que aportan por cada meta. Seguimos si supera 1,3.",
        },
        {
          tag: "La más riesgosa",
          title: "Un corredor acepta acciones bloqueadas como seña",
          body: "Métrica: corredores que aceptan una reserva. Seguimos con 3 de los primeros 10.",
        },
      ],
      foot: "Ya pivotamos una vez. Empezamos con una garantía de alquiler en acciones: se usa una sola vez. Para una casa se ahorra todos los meses. El contrato quedó, la historia cambió.",
      tone: "paper",
      layout: "points",
    },
    {
      id: "traction",
      label: "Tracción",
      title: "En vivo, desde los contratos.",
      body: "Estos números no salen de una planilla. Se están leyendo de Base ahora.",
      tone: "ink",
      layout: "live",
    },
    {
      id: "market",
      label: "Mercado",
      title: "USD 409 M por año en señas, solo en una ciudad.",
      points: [
        {
          tag: "Compras por año, Ciudad de Buenos Aires",
          title: "USD 8.180 M",
          body: "68.109 escrituras a USD 120.106 de promedio (Colegio de Escribanos, octubre de 2025 a septiembre de 2026).",
        },
        {
          tag: "Lo que se entrega como seña",
          title: "USD 409 M",
          body: "con una seña de 5 % del precio. Hoy sale del ahorro, en efectivo.",
        },
        {
          tag: "A quién le hablamos primero",
          title: "Más de 1 millón",
          body: "de argentinos que ya tienen acciones de EE.UU. como CEDEARs, entre 12,3 millones con cuenta de inversión (BYMA, mayo de 2026).",
        },
      ],
      numbers: true,
      foot: "Sin maquillaje: con la comisión de hoy, toda la Ciudad dejaría unos USD 6 M por año. Por eso el plan sigue con el boleto, que es el 30 % del precio, y con un abono para corredores.",
      tone: "paper",
      layout: "points",
    },
    {
      id: "competition",
      label: "Competencia",
      title: "No encontramos a nadie que haga las tres cosas.",
      compare: {
        columns: ["Sigue invertido", "Sin deuda", "Sirve de seña"],
        rows: [
          { name: "Dólares en billete", cells: [false, true, true] },
          { name: "CEDEARs en un broker", cells: [true, true, false] },
          { name: "Fracciones de propiedades", cells: [true, true, false] },
          { name: "Préstamo contra acciones", note: "Aave, Morpho", cells: [true, false, true] },
          { name: "Hipoteca con cripto en prenda", note: "Better y Coinbase, solo en EE.UU.", cells: [true, false, false] },
          { name: "Seña", cells: [true, true, true], ours: true },
        ],
        yes: "Sí",
        no: "No",
      },
      foot: "Lo más parecido viene de Coinbase: con Better se prenda bitcoin o USDC para el anticipo, y piensan sumar acciones. Es un préstamo. Lo que no se copia: los corredores que aceptan la reserva y los datos de Smarlin.",
      tone: "paper",
      layout: "compare",
    },
    {
      id: "model",
      label: "Modelo de negocio",
      title: "Cobramos cuando sumás y cuando reservás.",
      body: "Las dos comisiones se muestran antes de confirmar. Una seña de {exampleDeposit} nos deja {exampleRevenue}.",
      points: [
        { title: "{contributionFee}", body: "en cada aporte, al convertirlo en acciones." },
        { title: "{reservationFee}", body: "sobre la seña, al reservar. El contrato no deja cobrar más de 3 %." },
        {
          title: "Después",
          body: "Plan mensual para corredores e inmobiliarias sobre Smarlin: panel, links de reserva y datos de mercado.",
        },
      ],
      numbers: true,
      tone: "paper",
      layout: "points",
    },
    {
      id: "team",
      label: "Equipo",
      title: "El equipo detrás de Smarlin.",
      body: "Smarlin ya funciona en Puerto Rico: 11.925 propiedades publicadas y 120.002 ventas cerradas analizadas.",
      points: [
        { title: "Kelvin Garcia Vale", body: "Bienes raíces y producto. Corredor en Puerto Rico (Kelvin Garcia Realty)." },
        { title: "Fernando Lopez", body: "Ingeniería. Full-stack y builder web3 desde Buenos Aires." },
      ],
      tone: "paper",
      layout: "team",
    },
    {
      id: "next",
      label: "Lo que sigue",
      title: "Tres etapas. En cada una, seguir o pivotar.",
      points: [
        { title: "Hasta el 5 de diciembre", body: "Mainnet con topes de monto y la primera reserva con un corredor." },
        { title: "Meses 1 a 3", body: "100 metas y 5 corredores. Dictamen legal y auditoría del contrato." },
        { title: "Meses 3 a 12", body: "1.000 metas y 20 reservas. Plan para corredores, boleto y otros portales de propiedades." },
      ],
      foot: "Qué pedimos: tres corredores que acepten una reserva con acciones, y el premio del track para la auditoría y los legales.",
      tone: "ink",
      layout: "steps",
    },
    {
      id: "close",
      title: "Elegí una casa. Sumá {minContribution}.",
      body: "Y mirá cómo se pinta.",
      tone: "accent",
      layout: "close",
    },
  ],
};

export default es;
