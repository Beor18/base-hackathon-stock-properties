/**
 * Pitch deck (Spanish). The only screen allowed to name third-party brands, and only in sources.
 * Told by the founders, not the engineers: the problem, the insight, the product on screen, how it
 * grows from zero and how it makes money. Market figures come from docs/NARRATIVE.md and
 * docs/research, with their sources. Product figures (fees, minimums) are `{placeholders}` filled
 * from the deployment by the deck.
 */
export type PitchShot = {
  /** A phone-sized capture of the product, under `/public/pitch`. */
  src: string;
  alt: string;
  /** Shown under the phone on the product slide. */
  title?: string;
  body?: string;
};

export type PitchSlide = {
  id: string;
  /** Short section name shown small at the top of the slide. */
  label?: string;
  title: string;
  body?: string;
  points?: { title: string; body?: string }[];
  /** Point titles are figures: render them large. */
  numbers?: boolean;
  /** Product screens. The cover and growth slides show one; the product slide shows three. */
  shots?: PitchShot[];
  /** Small print under the content: sources, or the one line that answers the obvious question. */
  foot?: string;
  /** Visual treatment of the slide. */
  tone: "paper" | "ink" | "accent" | "mango";
  /**
   * - `cover`, `growth`: text with one phone beside it.
   * - `product`: three phones with their captions.
   * - `zero`: live numbers from the contracts, then the steps to the first hundred.
   * - `close`: the team, the ask and the button to the app.
   */
  layout: "cover" | "statement" | "points" | "product" | "growth" | "zero" | "close";
};

export type PitchDeck = {
  title: string;
  nav: { previous: string; next: string; slide: string; openApp: string };
  /** Labels of the live numbers, read from the contracts. */
  live: {
    title: string;
    goals: string;
    reservations: string;
    locked: string;
    loading: string;
    unavailable: string;
    verify: string;
  };
  slides: PitchSlide[];
};

const es: PitchDeck = {
  title: "Presentación",
  nav: { previous: "Anterior", next: "Siguiente", slide: "Diapositiva {n} de {total}", openApp: "Abrir la app" },
  live: {
    title: "Hoy, leído en vivo de la red",
    goals: "Metas",
    reservations: "Reservas",
    locked: "Bloqueado como seña",
    loading: "Leyendo la red. Suele tardar 3 segundos.",
    unavailable: "Ahora no pudimos leer la red. Probá de nuevo en un rato.",
    verify: "Verificalo vos",
  },
  slides: [
    {
      id: "cover",
      title: "Tu próxima casa, en acciones.",
      body: "Ahorrás en acciones con tu casa como meta. Cuando llegás, esas acciones son tu seña. No vendés nada.",
      shots: [{ src: "/pitch/meta-es.webp", alt: "La meta en Accasa: la foto de la casa se pinta a medida que ahorrás." }],
      foot: "Base Stocks Maxxing 2026",
      tone: "paper",
      layout: "cover",
    },
    {
      id: "problem",
      label: "El problema",
      title: "En Argentina, la casa se paga en dólares y al contado.",
      points: [
        { title: "84,6 %", body: "de las compras en la Ciudad de Buenos Aires se hizo sin crédito." },
        { title: "USD 120.106", body: "cuesta en promedio cada una." },
        { title: "Más de 6 años", body: "ahorrando USD 500 por mes para el departamento más barato." },
      ],
      numbers: true,
      foot: "Ese ahorro duerme en un cajón. Y el que lo invirtió vende todo de golpe el día que aparece la casa. Fuentes: Colegio de Escribanos de la Ciudad (enero a septiembre de 2026) y Propio (2026).",
      tone: "ink",
      layout: "points",
    },
    {
      id: "insight",
      label: "Lo que vimos",
      title: "El que tiene plata no vende sus acciones. Las pone de garantía.",
      body: "Los bancos privados lo hacen hace décadas, para carteras grandes. Nosotros lo hacemos para el que ahorra de a USD 100 por mes.",
      foot: "En un solo banco de EE.UU. hay USD 33.400 M prestados con acciones de garantía, 59 % más que hace un año (Schwab, junio de 2026).",
      tone: "mango",
      layout: "statement",
    },
    {
      id: "product",
      label: "El producto",
      title: "Tres pasos. No vendés nada.",
      shots: [
        {
          src: "/pitch/casa-es.webp",
          alt: "Elegir una casa en venta en Accasa.",
          title: "Elegí la casa",
          body: "Una de Puerto Rico, o el link de cualquier portal.",
        },
        {
          src: "/pitch/sumar-es.webp",
          alt: "Sumar USD 50 a la meta, con la comisión a la vista.",
          title: "Sumá desde {minContribution}",
          body: "Cada aporte compra acciones. Ves cuánto te falta.",
        },
        {
          src: "/pitch/reservar-es.webp",
          alt: "Reservar la casa con las acciones como seña.",
          title: "Reservá",
          body: "Tus acciones quedan como seña. Si la compra sale, vuelven a vos.",
        },
      ],
      foot: "Entrás con tu email. No ves billeteras ni pagás costos de red.",
      tone: "paper",
      layout: "product",
    },
    {
      id: "growth",
      label: "Cómo crecemos",
      title: "Cada casa trae a su gente.",
      body: "En Argentina le decimos vaquita. En Puerto Rico, serrucho. Juntar entre varios para algo grande.",
      points: [
        { title: "Ana elige su casa y manda el link por WhatsApp." },
        { title: "Su familia suma desde {minContribution}. Las acciones van a la casa de Ana." },
        { title: "Cada uno que sumó termina frente a un botón: elegí tu casa." },
      ],
      shots: [{ src: "/pitch/vaquita-es.webp", alt: "La vaquita: alguien suma USD 50 a la casa de otra persona." }],
      foot: "Y cada corredor que manda un link de reserva trae a su comprador.",
      tone: "accent",
      layout: "growth",
    },
    {
      id: "zero",
      label: "De 0 a 1",
      title: "Empezamos en cero. Así llegamos a 100 casas.",
      points: [
        {
          title: "Hasta el 28 de noviembre",
          body: "Kelvin les muestra una reserva a 10 corredores de su red. Seguimos si 3 la aceptan.",
        },
        {
          title: "Hasta el 5 de diciembre",
          body: "20 conocidos arman su meta y comparten su vaquita. Seguimos si 4 de cada 10 vuelven a sumar solos.",
        },
        {
          title: "Antes del cierre",
          body: "La primera reserva de punta a punta con un corredor. Es el caso que les mostramos a los próximos 100.",
        },
      ],
      foot: "Cada paso termina en una decisión: seguir o cambiar el rumbo. Medimos gente que suma por casa, no visitas.",
      tone: "paper",
      layout: "zero",
    },
    {
      id: "model",
      label: "El negocio",
      title: "Ganamos cuando vos avanzás.",
      body: "Dos comisiones, siempre a la vista antes de confirmar. Una seña de {exampleDeposit} nos deja {exampleRevenue}.",
      points: [
        { title: "{contributionFee}", body: "de cada aporte." },
        { title: "{reservationFee}", body: "de la seña, al reservar." },
        { title: "USD 409 M", body: "por año se entregan como seña solo en la Ciudad de Buenos Aires." },
      ],
      numbers: true,
      foot: "Después: un plan mensual para corredores. Mercado: 68.109 compras por año a USD 120.106 de promedio, con 5 % de seña (Colegio de Escribanos, 2025 a 2026).",
      tone: "mango",
      layout: "points",
    },
    {
      id: "close",
      title: "Elegí una casa. Sumá {minContribution}.",
      body: "Y mirá cómo se pinta.",
      points: [
        { title: "Kelvin Garcia Vale", body: "Corredor en Puerto Rico. Trae a los primeros corredores." },
        { title: "Fernando Lopez", body: "Ingeniero en Buenos Aires. Construyó Accasa de punta a punta." },
      ],
      foot: "Somos el equipo de Smarlin, con 11.925 propiedades publicadas en Puerto Rico. Buscamos 3 corredores que acepten la primera reserva con acciones.",
      tone: "ink",
      layout: "close",
    },
  ],
};

export default es;
