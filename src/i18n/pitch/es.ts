/**
 * Pitch deck (Spanish). The only screen allowed to name third-party brands, and only in sources.
 * Told by the founders, not the engineers, in ten slides: the problem, the insight, the product, the
 * contract underneath it, how it grows, the market, the legal work country by country, who we are and
 * what we need. Every market figure carries its source. Product figures (fees, minimums, margins) are
 * `{placeholders}` filled from the deployment by the deck. There is no investment offer here: the deck
 * is public, so the amount and terms of a round only go in private conversations.
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
  /** `tag`: a small label above the point (TAM, SAM, SOM on the market slide). */
  points?: { title: string; body?: string; tag?: string }[];
  /** Point titles are figures: render them large. */
  numbers?: boolean;
  /** Product screens. The cover and growth slides show one; the product slide shows three. */
  shots?: PitchShot[];
  /** `contract` slide: a listing on someone else's site, with the button that reserves it with stocks. */
  listing?: { site: string; title: string; price: string; contact: string; reserve: string; caption: string };
  /** `ask` slide: where the first year's money goes, as shares of 100. */
  funds?: { title: string; pct: number }[];
  /** Small print under the content: sources, or the one line that answers the obvious question. */
  foot?: string;
  /** Visual treatment of the slide. */
  tone: "paper" | "ink" | "accent" | "mango";
  /**
   * - `cover`, `growth`: text with one phone beside it.
   * - `product`: three phones with their captions.
   * - `contract`: the rules of the seña on one side, the listing with the button on the other.
   * - `zero`: live numbers from the contracts, then the team.
   * - `ask`: where the money goes, the milestones and the button to the app.
   */
  layout: "cover" | "statement" | "points" | "product" | "growth" | "contract" | "zero" | "ask";
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
      title: "En Latinoamérica, comprar casa empieza por juntar el anticipo.",
      points: [
        { title: "11 % o menos", body: "del PIB es crédito para vivienda en Brasil, México, Colombia y Perú. En EE.UU., 44 %." },
        { title: "84,6 %", body: "de las compras en la Ciudad de Buenos Aires se hizo sin crédito." },
        { title: "Seña, enganche, pie", body: "cuota inicial, entrada, pronto. Cada país lo llama distinto." },
      ],
      numbers: true,
      foot: "Ese ahorro duerme en un cajón. Y el que lo invirtió vende todo de golpe el día que aparece la casa. Fuentes: Deloitte y Reserva Federal de EE.UU. (2025), Colegio de Escribanos de Buenos Aires (2026).",
      tone: "ink",
      layout: "points",
    },
    {
      id: "insight",
      label: "Lo que vimos",
      title: "El que tiene plata no vende sus acciones. Las pone de garantía.",
      body: "Los bancos privados lo hacen hace décadas, para carteras grandes. Con acciones tokenizadas en Base, hoy se puede hacer para el que ahorra USD 100 por mes.",
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
      foot: "Son acciones tokenizadas en Base: siguen el precio de la acción y no dan voto. Entrás con tu email, sin ver billeteras ni pagar costos de red.",
      tone: "paper",
      layout: "product",
    },
    {
      id: "contract",
      label: "Lo que hay abajo",
      title: "La seña, escrita en un contrato.",
      body: "Hoy la seña depende de un recibo y de la confianza. Acá las reglas las cumple un contrato en Base.",
      points: [
        { title: "Si la compra sale", body: "Las acciones vuelven a quien reservó." },
        { title: "Si el comprador se arrepiente", body: "El corredor cobra la seña en dólares desde las acciones. El resto vuelve al comprador." },
        { title: "Si la acción baja", body: "Lo bloqueado vale entre {minMargin} y {maxMargin} más que la seña, según la acción. Nadie vende por la baja." },
        { title: "Si no se ponen de acuerdo", body: "Decide un árbitro neutral, con plazos fijos." },
      ],
      listing: {
        site: "Cualquier portal de propiedades",
        title: "Casa en venta en Puerto Rico",
        price: "USD 120.000",
        contact: "Contactar al corredor",
        reserve: "Reservar con acciones",
        caption: "El botón que cualquier portal o inmobiliaria puede sumar. Las 11.925 propiedades de Smarlin ya se pueden reservar desde Accasa.",
      },
      tone: "ink",
      layout: "contract",
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
      id: "market",
      label: "El mercado",
      title: "Solo en cuatro mercados se entregan USD 3.000 M por año en señas.",
      body: "Ganamos {contributionFee} de cada aporte y {reservationFee} de la seña al reservar: {exampleRevenue} por una seña de {exampleDeposit}. Después, corredores y portales pagan por el botón.",
      points: [
        { tag: "TAM", title: "USD 3.000 M", body: "por año en señas en Brasil, Buenos Aires, Lima y Puerto Rico: USD 60.800 M en compras, con 5 % de seña." },
        { tag: "SAM", title: "USD 520 M", body: "en la Ciudad de Buenos Aires y Puerto Rico, los dos primeros mercados." },
        { tag: "SOM", title: "USD 5,2 M", body: "Nuestra meta a tres años: 1 de cada 100 compras en esos dos mercados, unas 780 casas por año." },
      ],
      numbers: true,
      foot: "Compras por año × precio promedio × 5 % de seña, el valor por defecto en Accasa. Es un piso: Brasil y Lima cuentan solo vivienda nueva, Puerto Rico solo ventas con hipoteca, y faltan México, Colombia y Chile. Fuentes: Colegio de Escribanos de la Ciudad (2025 a 2026), OCIF (2024), CBIC (2025) y CODI (2025); tipo de cambio de la Reserva Federal y del Banco Central de Perú.",
      tone: "paper",
      layout: "points",
    },
    {
      id: "legal",
      label: "Lo legal",
      title: "Lo legal va primero. País por país.",
      body: "Una seña con acciones tiene que valer ante un juez y respetar las reglas de valores de cada país. Es lo primero que hacemos y lo que más cuesta.",
      points: [
        {
          title: "Argentina, primero",
          body: "El Código Civil y Comercial acepta como seña dinero o cosas muebles (art. 1060). Validamos que las acciones tokenizadas entren ahí, con corredores matriculados y los controles de la UIF.",
        },
        {
          title: "Puerto Rico, después",
          body: "Corredores y propiedades ya están, con Smarlin. Pero rigen las leyes de valores de EE.UU.: hoy solo ahorra quien vive fuera de EE.UU. Para los compradores de la isla buscamos un socio con licencia.",
        },
        {
          title: "Una versión por país",
          body: "México, Colombia y Chile tienen cada uno su figura para la seña y su regulador. Cada versión del contrato la revisan abogados de allá.",
        },
      ],
      foot: "Hoy Accasa funciona en la red de prueba de Base y no se ofrece a residentes de EE.UU. ni de sus territorios.",
      tone: "mango",
      layout: "points",
    },
    {
      id: "team",
      label: "Quiénes somos",
      title: "Dos personas, un mes, y ya funciona.",
      body: "Accasa entero lo hicimos durante la Quest, del 5 de noviembre al 5 de diciembre. Smarlin, nuestro portal de propiedades en Puerto Rico, ya existía.",
      points: [
        { title: "Kelvin Garcia Vale", body: "Corredor en Puerto Rico. Trae a los corredores y las propiedades." },
        { title: "Fernando Lopez", body: "Ingeniero en Buenos Aires. Construyó Accasa de punta a punta." },
        { title: "Hecho en la Quest", body: "El contrato de reserva, la app, los links de corredor y su bandeja. Smarlin aporta las publicaciones." },
      ],
      foot: "La primera meta se completó de punta a punta el 15 de noviembre, con los costos de red pagos por Accasa.",
      tone: "paper",
      layout: "zero",
    },
    {
      id: "ask",
      label: "Qué necesitamos",
      title: "Qué necesitamos para el primer año.",
      body: "Lo legal es lo que más cuesta y lo que más importa: sin eso, ninguna seña vale.",
      funds: [
        { title: "Legal y licencias en Argentina y Puerto Rico", pct: 40 },
        { title: "Producto e ingeniería", pct: 25 },
        { title: "Auditoría de seguridad de los contratos", pct: 20 },
        { title: "Corredores piloto y primeros compradores", pct: 15 },
      ],
      points: [
        { title: "Mes 3", body: "Opinión legal en los dos países y contratos auditados." },
        { title: "Mes 6", body: "Red principal de Base y las primeras 10 reservas con corredores matriculados en Buenos Aires." },
        { title: "Mes 12", body: "100 casas reservadas y un portal, además de Smarlin, con el botón." },
      ],
      foot: "Buscamos corredores piloto en Buenos Aires y Puerto Rico, y estudios legales en los dos países.",
      tone: "ink",
      layout: "ask",
    },
  ],
};

export default es;
