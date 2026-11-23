# Entrega a Stocks Maxxing

Todo lo que hay que mandar antes del **5 de diciembre de 2026, 23:59 UTC**: el formulario, el video y el post en X que etiqueta a @buildonbase. Los textos para Base van en inglés. El video se narra en castellano con subtítulos en inglés (o lo narra Kelvin en inglés).

Reemplaza a "Textos listos para la entrega" de `docs/NARRATIVE.md`, que quedó con el encuadre viejo.

---

## 1. Formulario

**Project name:** Accasa

**Track:** Programmable Stock Markets

**One-liner**

> Stock-backed home deposits: save in tokenized stocks on Base toward a specific home, then lock them as the reservation deposit without selling.

**Description**

> In Latin America, buying a home starts with saving the down payment, and whoever invested those savings must sell everything the day the home shows up. Accasa is idea 3.3 (stock-backed financing) applied to that moment: you save in tokenized stocks toward a real listing, and when you reach the deposit an onchain escrow locks the stocks in the broker's favor instead of selling them. If the purchase goes through, the stocks come back; if the buyer backs out, the contract sells just enough stock to pay the broker in USDC, with a per-stock margin, stale-price limits, a dispute window and a neutral arbiter. Email sign-in, sponsored gas, and cost, limits and every outcome on the same screen as the button.

**What was built during the Quest** (lo piden las reglas, §6)

> Everything in the repository, starting November 14, 2026: the ReservationEscrow, StockOracle and GoalRegistry contracts (46 Foundry tests, source verified on Blockscout), the app, the public API, broker short links and inbox, pause handling from Coinbase's oracle registry, the pitch deck and the developer page. Pre-existing: Smarlin, our property platform in Puerto Rico, which provides live listings through its public API.

**Links**

- App: https://accasa.vercel.app/en
- Developers (contracts, lifecycle, API): https://accasa.vercel.app/en/developers
- Pitch: https://accasa.vercel.app/en/pitch
- Code: https://github.com/Beor18/base-hackathon-stock-properties
- Reservation escrow (verified): https://base-sepolia.blockscout.com/address/0x5584F9a333faCbB8f01D22524c517Cf2BaB84a95?tab=contract

**Why it matters** (si el formulario pide algo como "why should we select you")

> Mortgage credit is 11% of GDP or less in Brazil, Mexico, Colombia and Peru (44% in the US), and 84.6% of purchases in Buenos Aires close without a mortgage: the down payment comes from years of savings. Accasa gives those savings a use for tokenized stocks that doesn't exist yet: a programmable deposit that a broker can trust, so saving in stocks no longer means selling at the worst moment. The broker is our distribution: the contract guarantees their fee, so they bring buyers. We are a broker in Puerto Rico and an engineer in Buenos Aires, the team behind Smarlin (11,925 live listings). It runs on Base Sepolia today, and the developer page shows how any listings site can add "Reserve with stocks".

**Team:** Kelvin Garcia Vale (broker, Puerto Rico) and Fernando Lopez (engineer, Buenos Aires).

---

## 2. Video (3 minutos)

Sigue el "Show us" de la idea 3.3: depositar, bloquear, devolver o cobrar, una prueba de estrés y el mercado exacto que se usa.

### Antes de grabar

1. **Reserva de prueba lista:** la reserva 1 (casa de Ponce, seña USD 8.745 en Apple) ya está creada a favor de la cuenta de Fernando. Se ve en "Tu cuenta" → "Reservas a tu favor".
2. **Para el lado del comprador:** Kelvin entra a Accasa con su email y genera el link de reserva para la casa de la meta de Fernando (Terreno en Venta, Aguadilla). Si su email es el de Smarlin, sale "Corredor verificado". Fernando abre ese link y llega a la pantalla de reserva con "Qué pasa si…".
3. **Pausa:** cargar `DEMO_PAUSED_TICKERS=AAPL` en Vercel y redesplegar justo antes de la toma de la pausa. Sacarla y redesplegar antes de la toma del cobro.
4. Los comandos se corren desde el repo con `set -a; . ./.env.deploy; set +a` antes.

### Guion

| Tiempo | Pantalla | Narración (castellano) | Subtitle (English) |
|---|---|---|---|
| 0:00 a 0:15 | Deck, diapositiva 2 | "En Latinoamérica, comprar casa empieza por juntar el anticipo. Y el que lo invirtió vende todo el día que aparece la casa." | "In Latin America, buying a home starts with saving the down payment. Whoever invested it sells everything the day the home shows up." |
| 0:15 a 0:30 | Deck, diapositiva 5 (la publicación con el botón) | "Accasa convierte esas acciones en la seña, sin venderlas. Es un contrato en Base que cualquier portal puede sumar." | "Accasa turns those stocks into the deposit, without selling. It's a contract on Base any listings site can add." |
| 0:30 a 1:00 | App: elegir casa, meta con la foto que se pinta, sumar USD 50 | "Entrás con tu email. Elegís la casa y sumás desde 5 dólares: cada aporte compra acciones tokenizadas. La comisión siempre a la vista." | "Sign in with email. Pick the home and add from 5 dollars: each contribution buys tokenized stocks. The fee is always visible." |
| 1:00 a 1:30 | Link de Kelvin → pantalla de reserva con "Qué pasa si…" → Reservar | "Llegaste. El corredor te manda su link. Antes del botón ves todo: cuánto bloqueás, el margen, y qué pasa si la acción cae, si la bolsa está cerrada o si hay desacuerdo." | "You made it. The broker sends their link. Before the button you see it all: what you lock, the margin, and what happens if the stock falls, the market is closed or there's a dispute." |
| 1:30 a 1:50 | Terminal: `npm run demo:reservation -- drop --pct 10` y recargar `/r/1` | "Prueba de estrés: bajamos Apple 10 %. Las acciones siguen cubriendo la seña y nadie vende." | "Stress test: Apple drops 10%. The stocks still cover the deposit, and nobody sells." |
| 1:50 a 2:10 | Con la pausa activa: "Reclamar la seña" en `/r/1`, luego `npm run demo:reservation -- accept --id 1` | "El comprador se arrepiente: el corredor reclama y el comprador acepta. Pero Apple está en pausa por un split: Accasa lo lee del registro de Coinbase y no deja cobrar con un precio congelado." | "The buyer backs out: the broker claims and the buyer accepts. But Apple is paused for a split: Accasa reads Coinbase's registry and won't pay out at a frozen price." |
| 2:10 a 2:35 | Sin la pausa: "Cobrar" en `/r/1` → pagado en USDC | "Termina la pausa y el corredor cobra: el contrato vende solo las acciones necesarias en un mercado permitido, con un descuento máximo de 2 %, y paga en dólares. El resto vuelve al comprador. En la red de prueba ese mercado es simulado." | "When the pause ends, the broker collects: the contract sells only the shares needed through an allowlisted market, at most 2% below the price, and pays in USDC. The rest goes back to the buyer. On testnet that market is simulated." |
| 2:35 a 3:00 | Página `/developers` con los contratos verificados | "Todo lo hicimos durante la Quest. Los contratos están verificados y cualquier app los puede usar. Somos un corredor de Puerto Rico y un ingeniero de Buenos Aires. Esto es Accasa." | "We built it all during the Quest. The contracts are verified and any app can use them. We're a broker in Puerto Rico and an engineer in Buenos Aires. This is Accasa." |

### Después de grabar

- Volver los precios reales: `npm run demo:prices -- --network base-sepolia`.
- Sacar `DEMO_PAUSED_TICKERS` de Vercel y redesplegar.
- La reserva 1 queda cobrada. Para otra toma hace falta una reserva nueva con `npm run demo:reservation -- create --broker 0x…` (usa la misma billetera de prueba; si su meta anterior molesta, se crea una billetera nueva).

---

## 3. Post en X (con el video)

> Saving for a home in stocks means selling everything the day the home shows up.
>
> Accasa locks them as the reservation deposit instead. If the deal closes, they come back. If the buyer walks, the contract sells just enough to pay the broker in USDC.
>
> Built for Stocks Maxxing on @buildonbase, Programmable Stock Markets track.

Respuesta al post, con los links:

> Contracts verified, open to any app: https://accasa.vercel.app/en/developers
> Try it on Base Sepolia: https://accasa.vercel.app/en

---

## 4. Checklist

- [ ] Video grabado y subido (Loom u otro)
- [ ] Post en X con el video, etiquetando a @buildonbase
- [ ] Formulario enviado con el link al post, el track y "What was built during the Quest"
- [ ] Precios de prueba restaurados y `DEMO_PAUSED_TICKERS` quitada
- [ ] Mandarlo antes del 4 de diciembre, para tener un día de margen
