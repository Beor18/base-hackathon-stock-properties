/**
 * Developer page (Spanish). Like the pitch deck, it may name the technologies: it documents the
 * contracts for other apps. `{placeholders}` are filled from the deployment, so the page can never
 * disagree with what the contracts enforce. Code stays in English.
 */
export type ContractKey = "reservationEscrow" | "stockOracle" | "goalRegistry";

export type DevelopersCopy = {
  title: string;
  label: string;
  heading: string;
  lead: string;
  repo: string;
  contracts: {
    title: string;
    network: string;
    source: string;
    unverified: string;
    items: { key: ContractKey; name: string; role: string }[];
    router: { name: string; role: string };
  };
  lifecycle: { title: string; steps: { fn: string; body: string }[] };
  code: { title: string; body: string; note: string };
  api: { title: string; body: string; items: { path: string; body: string }[] };
  disclosures: { title: string; items: string[] };
  cta: string;
};

const es: DevelopersCopy = {
  title: "Desarrolladores",
  label: "Para desarrolladores",
  heading: "La seña programable, para tu app.",
  lead: "Accasa es una app, pero la reserva vive en un contrato abierto en Base. Cualquier app puede bloquear acciones tokenizadas como depósito a favor de otra persona, con margen, reclamo, disputa y árbitro. Sirve para la seña de una casa, el depósito de un alquiler o cualquier compromiso con plazo.",
  repo: "Código en GitHub",
  contracts: {
    title: "Contratos",
    network: "Base Sepolia, la red de prueba de Base (chain id {chainId}).",
    source: "Código verificado",
    unverified: "Ver en el explorador",
    items: [
      {
        key: "reservationEscrow",
        name: "ReservationEscrow",
        role: "Guarda las acciones como seña y aplica las reglas: reclamo, disputa, árbitro y cobro en USDC.",
      },
      {
        key: "stockOracle",
        name: "StockOracle",
        role: "Lista las acciones aceptadas con su margen y su precio en USD, de feeds de Chainlink. Rechaza precios viejos.",
      },
      { key: "goalRegistry", name: "GoalRegistry", role: "Una meta por cuenta: la casa y la acción en la que se ahorra." },
    ],
    router: {
      name: "Mercado para cobrar",
      role: "El único router con el que el contrato puede vender acciones al cobrar. En la red de prueba es un mercado simulado.",
    },
  },
  lifecycle: {
    title: "Cómo vive una reserva",
    steps: [
      {
        fn: "createReservation",
        body: "Quien reserva bloquea acciones que valen la seña más el margen de esa acción ({minMargin} a {maxMargin}). Paga {fee} de la seña, en acciones.",
      },
      {
        fn: "fileClaim",
        body: "Si la compra se cae, el beneficiario (el corredor) reclama hasta el valor de la seña, hasta {claimDays} días después del vencimiento.",
      },
      {
        fn: "acceptClaim o disputeClaim",
        body: "Quien reservó tiene {disputeDays} días para aceptar o disputar. Si no responde, el reclamo queda firme.",
      },
      {
        fn: "resolveDispute",
        body: "Si hay disputa, el árbitro decide entre cero y lo reclamado. Si no decide en {arbitrationDays} días, puede hacerlo el árbitro por defecto.",
      },
      {
        fn: "settleClaim",
        body: "Cualquiera puede ejecutar el cobro. El contrato vende solo las acciones necesarias, con un precio de menos de {settlementHours} horas y un descuento máximo de {slippage}, y paga en USDC. Lo que sobra vuelve a quien reservó.",
      },
      {
        fn: "release",
        body: "Si la compra se hace, el beneficiario libera las acciones cuando quiera. Si nadie reclama, cualquiera puede liberarlas {claimDays} días después del vencimiento.",
      },
    ],
  },
  code: {
    title: "Crear una reserva desde tu app",
    body: "Pedile a la API cuánto bloquear y firmá dos llamadas: aprobar el token y crear la reserva.",
    note: "Además: topUp deja que cualquiera sume acciones a una reserva, withdrawExcess retira lo que sobra del margen y extendEndDate corre el vencimiento.",
  },
  api: {
    title: "Leer sin firmar nada",
    body: "API pública, sin claves. Los montos en USD van con 18 decimales.",
    items: [
      { path: "GET /api/stocks", body: "Acciones aceptadas: precio, margen, última actualización y si están en pausa." },
      { path: "GET /api/quote?coverageUsd=5000", body: "Cuánto hay que bloquear de cada acción para una seña, con la comisión." },
      { path: "GET /api/reservations/{id}", body: "Una reserva: su estado, el reclamo y lo que valen hoy las acciones." },
      { path: "GET /api/reservations?account=0x…", body: "Las reservas de una cuenta, como comprador o como corredor." },
      { path: "GET /api/stats", body: "Totales en vivo: metas, reservas y valor bloqueado." },
    ],
  },
  disclosures: {
    title: "Lo que tenés que saber",
    items: [
      "Hoy corre en la red de prueba de Base. Las acciones son tokens de prueba con precios copiados de los feeds reales de Chainlink en Base, y el mercado donde se venden al cobrar es simulado.",
      "En la red de prueba los precios nunca vencen. En la red principal siguen el horario de la bolsa de Estados Unidos.",
      "La app lee la pausa de cada acción en el registro de Coinbase y no deja reservar ni cobrar durante una pausa. Antes de la red principal, el contrato también la va a leer.",
      "Las acciones tokenizadas siguen el precio de la acción y no dan voto en la empresa.",
      "Cada transacción lleva el Builder Code de Accasa ({builderCode}), según ERC-8021.",
    ],
  },
  cta: "Probá la app",
};

export default es;
