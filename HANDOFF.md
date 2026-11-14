# HANDOFF — Garante (Base Stocks Maxxing)

Documento de traspaso para continuar el trabajo desde otra cuenta de Claude.
Estado al **14 nov 2026**. Repo: `https://github.com/Beor18/base-hackathon-stock-properties` (rama `main`).

> **Cómo usarlo:** abrí una sesión nueva de Claude Code con este repo adjunto y pegá:
> _"Leé `HANDOFF.md` y `docs/NARRATIVE.md` completos y continuá desde la sección 8 (Pendientes), en orden. Commiteá y pusheá a `main` después de cada hito."_

**La narrativa de la startup está en [`docs/NARRATIVE.md`](docs/NARRATIVE.md):** problema, solución, por qué ahora, mercado, competencia, diferenciador, modelo de negocio, plan de 0 a 1, riesgos, equipo, ask y los textos de entrega en inglés (one-liner, respuestas del formulario, guion del Loom, post de X). Es la fuente de verdad del relato: la UI, el README y la página `/pitch` tienen que decir lo mismo.

---

## 1. El pedido original (de Fernando)

- Producto **funcional de punta a punta**, en "one shot", para aplicar a **Base Stocks Maxxing** (`https://www.base.org/stocksmaxxing`). Objetivo: ganar el premio mayor (**pool de USD 20.000** del track).
- Elegir el track. Sorprender. **Nada hardcodeado.**
- **Última versión de Next.js**, API routes (route handlers), buenas prácticas, buena arquitectura. **Código en inglés y entendible.** Evitar tests innecesarios.
- Usar **subagentes con roles claros de startup**; hacer research si hace falta.
- **Diferenciador: la parte de propiedades**, guiándose por `https://smarlin.com/`.
- UI/UX simple "como decir 1, 2 y 3". **Cuanta menos fricción, mejor.**
- Todo con **narrativa**: problema, solución, tamaño de mercado, equipo (**Fernando y Kelvin**), diferenciador claro, ask, plan de 0 a 1.
- Indicaciones posteriores: usar **este repo** e **ir commiteando y pusheando**.
- También mencionó `https://claude.ai/code/cshk_01TfyPA93CYUZXtJzebrnhic73bxxKUnevuEYkXPeFQ73s`. **No se pudo abrir (HTTP 403)**: su contenido es desconocido. Si tiene contexto importante, hay que pegarlo a mano en la sesión nueva.

## 2. Decisiones ya tomadas

| Tema | Decisión |
|---|---|
| Producto | **Garante** — "Your stocks are your guarantor" / "Tus acciones son tu garante". El inquilino bloquea acciones tokenizadas en Base como **garantía de alquiler**, en vez de un depósito en efectivo, un garante propietario o un seguro de caución. |
| Track | **Programmable Stock Markets** (pool Base USD 20.000). Encaja en "financing tools" y "market infrastructure". Solo se puede entrar a un track. |
| Mercado inicial | **Latinoamérica, Argentina primero.** Las acciones tokenizadas de Coinbase son solo para no-US, y las reglas descalifican proyectos que habiliten trading a usuarios de EE.UU. (Puerto Rico incluido). |
| Vínculo con Smarlin | Smarlin es una plataforma de IA de bienes raíces en Puerto Rico (búsqueda por estilo de vida, análisis de propiedad, "precalificarse", broker licenciado). Garante es la capa financiera: el broker/administrador es el árbitro natural y el portal de propiedades es el canal de distribución (`/api/quote` permite mostrar "garantizá este alquiler con X acciones" en cada listing). |
| Flujo | Lo inicia el inquilino con **una sola transacción** (`createGuarantee`). El propietario solo comparte un **link de solicitud** (sin transacción, sin gas) y verifica en una página pública. |
| Modelo de negocio | Fee único on-chain sobre la cobertura (`feeBps`, tope 3%), cobrado en acciones a la tesorería. |
| Stack | Next.js 16.4.6 (App Router, Cache Components), React 19, TypeScript, Tailwind 4, wagmi 3 + viem 2, zod 4, Foundry (vía npm). Sin base de datos: **el contrato es la base de datos**. |

**Supuesto a confirmar con el usuario:** que Kelvin es fundador/parte de Smarlin (inferido por el mail y la referencia, no confirmado). No inventar bios: Fernando Lopez = full-stack/web3 (GitHub `Beor18`, Buenos Aires); el rol de Kelvin hay que preguntarlo.

## 3. Reglas del hackathon (leídas de la página oficial y `/stocksmaxxing/rules`)

- **Fechas:** 5 nov – 5 dic 2026. Entrega hasta **5 dic 23:59 UTC**.
- **Premios:** USD 50.000 en tracks Base (Meme & Community 10k, **Agentic Stock Finance 20k**, **Programmable Stock Markets 20k**), USD 48.000 de partners, USD 6.000 al "build in public" (voto de la comunidad).
- **Cómo se juzga** (hilo de @base del 5 nov, reportado por el agente de estrategia; la Quest Page no publica pesos): **50% tracción** (uso real verificado on-chain), **25% producto**, **25% build in public**.
- **Entrega:** post público en X con video demo (Loom) etiquetando **@buildonbase** + formulario. El formulario de registro es `https://docs.google.com/forms/d/1zotYvkeAtDjR2MKk3qNxyNIAfJ_IPQtzTtjNhOAF8js/viewform`. El formulario final de entrega aún no estaba publicado.
- **Testnet está permitido** y "no se juzga menos favorablemente" (Rules §5). Aun así, mainnet con acciones reales es la ventaja para el 50% de tracción: casi todos los competidores están en Sepolia con mocks.
- **Elegibilidad:** mayores de 18, equipos de hasta 5, no OFAC. **"Projects that enable trading for US users are not eligible."**
- Rules §13 descalifica por manipular métricas de tracción.
- Partners del track: **Bankr** (premios + mentoría) y **BaseStonk** (sin premio en efectivo; su incentivo es lanzar un token en su launchpad — no hacerlo solo por eso).
- Recursos oficiales: Builder Codes, Tokenized Stocks API, guía "Integrate tokenized stocks".

## 4. Estado del repo

### Hecho y verificado
- **Contratos** (`contracts/src`): `StockOracle.sol`, `GuaranteeEscrow.sol`, interfaces y mocks. **27 tests de Foundry pasan** (`npm run contracts:test`).
- **ABIs generados** en `src/contracts/abis.ts` (`npm run contracts:abi`).
- **Capa de servidor y API routes**: escritas; **`npm run typecheck` y `npx eslint src scripts` pasan**.

### Escrito pero NO ejecutado todavía
- Las API routes y los servicios **nunca corrieron contra una chain** (falta el script de deploy). Tratar como no probado. En particular, verificar que `"use cache"` + `cacheLife` funcione como se espera dentro de los servicios.

### Narrativa
- **Escrita** en `docs/NARRATIVE.md`. Quedan decisiones de los fundadores marcadas con **[decidir]** (nivel de fee, meta de 12 meses, uso del premio, monto de la ronda) y **[confirmar]** (rol de Kelvin y relación con Smarlin).

### No empezado
- Script de deploy / chain local, toda la UI (cliente), i18n, `proxy.ts` (geo-bloqueo), Builder Codes, swap "comprar con USDC", ensayo en mainnet, página `/pitch`, README, `.env.example`.
- `src/app/page.tsx`, `layout.tsx` y `globals.css` siguen siendo los del scaffold de `create-next-app`.
- `README.md` es el del scaffold.

### Mapa de archivos
```
contracts/src/StockOracle.sol              registro de acciones + precios Chainlink (2 cotas de frescura)
contracts/src/GuaranteeEscrow.sol          escrow de garantías (ciclo completo)
contracts/src/interfaces/*.sol             tipos, eventos y errores documentados
contracts/src/mocks/MockStockToken.sol     acción demo con faucet() y mirrorOf() (local/testnet)
contracts/src/mocks/MockPriceFeed.sol      feed demo (modo alwaysFresh para demos)
contracts/test/GuaranteeEscrow.t.sol       27 tests
foundry.toml                               config (solc 0.8.30, cancun, libs en node_modules)
scripts/export-abis.ts                     genera src/contracts/abis.ts
src/config/chains.ts                       chains soportadas: base, baseSepolia, foundry
src/config/public-env.ts                   env del browser validado con zod (falla rápido)
src/config/server-env.ts                   env solo-servidor
src/domain/types.ts                        DTOs compartidos API <-> UI (bigints como strings)
src/domain/collateral.ts                   matemática de colateral (espejo del contrato)
src/server/chain.ts                        public client viem + getChainTime()
src/server/clients/coinbase-stocks.ts      cliente de la Tokenized Stocks API (cacheado)
src/server/services/{protocol,stocks,guarantees,stats,quotes}.ts
src/server/{http,errors,schemas}.ts        respuesta uniforme de errores + parsers zod
src/app/api/{stocks,protocol,stats,quote,guarantees,guarantees/[id]}/route.ts
```

## 5. Diseño de los contratos

**`StockOracle`** (Ownable2Step)
- `setStock(token, feed, collateralRatioBps, enabled)` — el ratio debe ser > 100% y ≤ 300%.
- `toUsd` / `toTokens(token, amount, PriceUse)` — USD con 18 decimales.
- Dos cotas de frescura inmutables: `collateralMaxAge` (laxa, para **entrar** colateral: acepta el cierre del viernes) y `settlementMaxAge` (estricta, para **sacar** valor: reclamos y retiro de excedente). Motivo: los feeds de Coinbase/Chainlink son 24/5 y se congelan fines de semana y feriados.
- `latestPrice(token)` sin chequeo de frescura, solo para UIs.

**`GuaranteeEscrow`** (Ownable2Step, ReentrancyGuard)
- Roles por garantía: `tenant`, `landlord`, `arbiter` (si se pasa `address(0)` usa `defaultArbiter`). Deben ser tres direcciones distintas.
- Inquilino: `createGuarantee(params)`, `topUp` (abierto a cualquiera), `withdrawExcess`, `extendLease`, `acceptClaim`, `disputeClaim`.
- Propietario: `fileClaim(id, amountUsd, reason)`, `withdrawClaim`, `release` (en cualquier momento).
- Árbitro: `resolveDispute(id, awardedUsd)`; el `defaultArbiter` puede resolver tras `arbitrationTimeout`.
- Cualquiera: `settleClaim` (si está aprobado o venció la ventana de disputa) y `release` (pasado `endsAt + claimWindow` y sin reclamo abierto). El colateral **siempre vuelve al inquilino**.
- El reclamo se debe en USD y se paga en acciones al precio del oráculo. Si el colateral vale menos que el reclamo, el propietario recibe todo y la garantía se cierra.
- Ventanas inmutables: `disputeWindow`, `claimWindow`, `arbitrationTimeout`. Contadores on-chain: `guaranteeCount`, `activeGuaranteeCount`, `activeCoverageUsd`.
- `leaseHash` opcional (hash del PDF del contrato; no se sube ningún dato personal).

**Supuestos de confianza a documentar en el README:** el owner del oráculo (debería ser multisig + timelock en producción), el árbitro, y que el emisor B20 puede pausar o **incautar** tokens (la contabilidad por garantía no lo contempla). No hay chequeo de sequencer uptime feed.

## 6. Arquitectura objetivo (lo que falta construir)

```
src/app/[lang]/layout.tsx          root layout por idioma (en/es), generateStaticParams
src/app/[lang]/page.tsx            landing: hero + 1-2-3 + stats en vivo (Suspense) + acciones aceptadas
src/app/[lang]/new/page.tsx        inquilino, 3 pasos: términos -> elegir acción -> bloquear
src/app/[lang]/request/page.tsx    propietario: genera link de solicitud (sin transacción)
src/app/[lang]/g/[id]/page.tsx     página pública de la garantía + acciones según rol
src/app/[lang]/dashboard/page.tsx  mis garantías (como inquilino / como propietario)
src/app/[lang]/pitch/page.tsx      pitch deck como página
src/app/[lang]/unavailable/page.tsx  bloqueo geográfico
src/proxy.ts                       redirect de idioma + geo-bloqueo (Next 16: middleware -> proxy)
src/i18n/{en,es}.ts                diccionarios; getDictionary() en servidor + provider en cliente
src/components/, src/hooks/        UI y hooks (useStocks, useGuarantee, useContractCalls...)
src/lib/wagmi.ts                   config wagmi: baseAccount + injected, ssr: true
scripts/deploy.ts                  deploy local / base-sepolia / base
scripts/dev-chain.ts               levanta anvil + deploy + escribe .env.local
scripts/lib/{artifacts,stock-universe,risk,deploy-config}.ts
```

**Flujo de 3 pasos (inquilino):** 1) términos (alquiler mensual, meses de garantía, fin del contrato, wallet del propietario; todo precargado si viene del link) → 2) elegir la acción (muestra saldo, cantidad necesaria, "obtener acciones demo" en testnet) → 3) revisar y bloquear, y luego compartir el link (botón de WhatsApp: es el canal de LatAm).

**Flujo propietario:** conectar → completar 3 campos → link `/new?landlord=0x…&rent=…&months=…&end=…`.

**Transacciones (`useContractCalls`):**
- Si la wallet soporta batch atómico (EIP-5792, `getCapabilities` → `atomic.status` `supported`/`ready`): un solo `sendCalls` con `approve` + `createGuarantee`, y `waitForCallsStatus`.
- Si no: secuencial con `writeContract` + `waitForTransactionReceipt` entre pasos, saltando el `approve` si la allowance alcanza.
- **No usar `experimental_fallback` de viem**: manda las transacciones seguidas sin esperar confirmación y la segunda falla al estimar gas.

**Lecturas:** datos del protocolo por las API routes (TanStack Query); saldo y allowance de la wallet directo con wagmi.

## 7. Gotchas del entorno (ahorran tiempo)

- **Next 16.4.6 no es el Next de siempre.** Leer `AGENTS.md` y `node_modules/next/dist/docs/` antes de escribir. Puntos clave:
  - `cacheComponents: true` y `partialPrefetching: true` vienen activados. Lo no cacheado va dentro de `<Suspense>`; `params`/`cookies`/`headers` también.
  - `"use cache"` no puede ir en el cuerpo de un route handler: va en una función auxiliar, con `cacheLife(...)`.
  - `middleware.ts` ahora es **`proxy.ts`** y exporta `proxy`.
  - `RouteContext<'/ruta/[id]'>` es global pero requiere `next typegen` (ya está en `npm run typecheck`).
  - Tailwind va por el loader `@tailwindcss/turbopack` en `next.config.ts` (no hay `postcss.config`).
  - i18n recomendado: segmento `app/[lang]` + redirect en `proxy.ts`.
- **`public-env.ts` falla al importar si faltan variables.** Para `next build`/`typegen` hacen falta `NEXT_PUBLIC_CHAIN_ID` y `NEXT_PUBLIC_ESCROW_ADDRESS`.
- **Foundry está instalado por npm** (`@foundry-rs/forge`, `anvil`, `cast`). Instalarlo con `curl | bash` fue bloqueado por permisos. Los links en `node_modules/.bin` se pierden después de cada `npm install`: usar siempre `npm run forge -- <cmd>` o `node node_modules/@foundry-rs/anvil/bin.mjs`. Si falta el binario: `npm rebuild @foundry-rs/forge @foundry-rs/anvil @foundry-rs/cast`.
- **`forge-std` y OpenZeppelin vienen de npm**, con remappings a `node_modules` (sin submódulos git).
- **wagmi v3:** `useAccount` → `useConnection`; `useConnect().connectors` ya no existe (usar `useConnectors()`); los hooks de mutación exponen `mutate`/`mutateAsync`; `useSendCalls`, `useCapabilities`, `useWaitForCallsStatus` se importan de `wagmi`. Los conectores son peers opcionales (`@base-org/account` ya instalado).
- **Builder Codes (ERC-8021):** `createConfig` de wagmi **no** aplica `dataSuffix` a las transacciones de la wallet. Hay que pasarlo **por llamada**:
  ```ts
  import { Attribution } from "ox/erc8021";
  const dataSuffix = Attribution.toDataSuffix({ codes: [builderCode] });
  writeContract({ ..., dataSuffix });
  sendCalls({ calls, capabilities: { dataSuffix: { value: dataSuffix, optional: true } } });
  ```
- **`WebFetch` no funciona en el contenedor cloud** (falla DNS). Usar `curl` por Bash (pasa por el proxy) o Playwright (`chromium.launch({ proxy: { server: process.env.HTTPS_PROXY } })`). Los docs de Base aceptan `.md` al final de la URL; índice en `https://docs.base.org/llms.txt`.
- **`gh` CLI no está autenticado**; el push por `git` funciona. Empujar con `git -c push.negotiate=true push -u origin main` (el warning "push negotiation failed" es inofensivo).
- **Anvil local no tiene Multicall3**: por eso el servidor usa batch JSON-RPC (`http(url, { batch: true })`) y llamadas individuales con `.catch()`.
- **Un fork con anvil/forge no ejecuta los tokens B20 reales** (son precompiles de Base). Para probar contra mainnet real usar `eth_simulateV1` (ver 8.9).
- Commits: terminar los mensajes con
  ```
  Co-Authored-By: Claude <noreply@anthropic.com>
  ```
  más la línea `Claude-Session:` de la sesión que corresponda. No poner identificadores de modelo en el repo.

## 8. Pendientes, en orden

### 8.1 Script de deploy + chain local (desbloquea todo lo demás)
- `scripts/lib/artifacts.ts`: leer ABI + bytecode de `contracts/out`.
- `scripts/lib/stock-universe.ts`: armar el universo **sin hardcodear tickers**:
  1. Tokenized Stocks API (`?page_size=500`, paginar con `next_page_token`) → tokens con `nav_price`.
  2. Directorio de feeds de Chainlink `https://reference-data-directory.vercel.app/feeds-ethereum-mainnet-base-1.json` → registros con `docs.productTypeCode === "primaryTokenizedPrice"` (excluir `docs.hidden` / `feedType === "247Price"`).
  3. Unir `docs.baseAsset + "c"` con `symbol` y **verificar** que `latestRoundData().answer` del feed coincida con `nav_price` (tolerancia ~2%). Si no coincide, saltear con warning.
- `scripts/lib/risk.ts`: ratio de colateral **por acción** a partir de datos: peor caída en una ventana móvil de ~30 días del último año → `ratio = 1 / (1 − caída)`, redondeado hacia arriba a 5%, acotado (p. ej. 115%–200%). Historia en `https://query1.finance.yahoo.com/v8/finance/chart/{ticker}?range=1y&interval=1d` (requiere header `User-Agent`). Validar que el último cierre de Yahoo coincida con el precio del feed (evita tickers equivocados); con poca historia (p. ej. SPCX tiene ~108 días) o sin datos, usar el ratio máximo.
- `scripts/deploy.ts --network local|base-sepolia|base`:
  - Deploy de `StockOracle` y `GuaranteeEscrow` con parámetros por env y defaults documentados (ventana de disputa 3 días, ventana de reclamo 15 días, timeout de arbitraje 14 días, fee 100 bps, `settlementMaxAge` ~26 h, `collateralMaxAge` ~96 h).
  - **Mainnet:** `setStock(tokenReal, feedReal, ratio, true)`.
  - **Local/testnet:** por cada acción, `MockStockToken(name, symbol, 8, mirrorOf = address de mainnet, faucetAmount)` + `MockPriceFeed(8, desc, nav_price, alwaysFresh = true)`.
  - Local: usar las cuentas desbloqueadas de anvil (`eth_accounts`), **sin private keys en el código**; árbitro = otra cuenta distinta.
  - Escribir `deployments/<chainId>.json` y, en local, `.env.local`.
- `scripts/dev-chain.ts` + script `npm run chain`.
- `.env.example` con todas las variables.
- **Verificar:** levantar la chain, `npm run dev`, y pegarle con `curl` a `/api/stocks`, `/api/protocol`, `/api/stats`, `/api/quote?coverageUsd=1200`, `/api/guarantees?account=…`.

### 8.2 Cliente base
`src/lib/wagmi.ts`, `providers.tsx`, i18n (`[lang]`, diccionarios en/es), componentes base, `useContractCalls`, hooks de datos, manejo de errores de contrato legibles (decodificar custom errors con el ABI).

### 8.3 Páginas núcleo
`/new` (3 pasos), `/request`, `/g/[id]` (estado, barra de salud, línea de tiempo, acciones por rol: tenant / landlord / arbiter / cualquiera), `/dashboard`.

### 8.4 Landing
Hero, 1-2-3, stats en vivo (`getProtocolStats` con Suspense), acciones aceptadas con precio, tabla comparativa (depósito en efectivo vs seguro de caución vs Garante), FAQ, disclaimers.

### 8.5 Cumplimiento
`src/proxy.ts`: geo-bloqueo configurable por env (`GEO_BLOCKED_COUNTRIES`, default EE.UU. y territorios incl. `PR`) usando el header de país de la plataforma (`x-vercel-ip-country`), aplicado solo cuando la chain es mainnet. Disclaimers: no es asesoramiento; no otorga derechos sobre la empresa subyacente; no afirmar relación con Coinbase/Base/emisores.

### 8.6 Tracción
Builder Code por env (`NEXT_PUBLIC_BUILDER_CODE`), `dataSuffix` en **todas** las escrituras. Paymaster opcional (`NEXT_PUBLIC_PAYMASTER_URL`, capability `paymasterService`).

### 8.7 Prueba end-to-end en navegador
Playwright (ya instalado, no reinstalar) contra la chain local, inyectando un provider EIP-1193 que reenvía a anvil. Recorrer: crear garantía → reclamo → disputa → resolución → pago → liberación. Usar `evm_increaseTime` para las ventanas.

### 8.8 "Comprar con USDC" (solo mainnet, opcional pero baja mucho la fricción)
Proveedor de swap en servidor detrás de una interfaz. **KyberSwap** funciona sin API key (verificado por el agente CTO): `GET https://aggregator-api.kyberswap.com/base/api/v1/routes?tokenIn=&tokenOut=&amountIn=` y luego `POST …/base/api/v1/route/build` con `{ routeSummary, sender, recipient, slippageTolerance }` (bps), header `x-client-id`. Aprobar USDC al `routerAddress`. La recomendación oficial de Base es 0x (requiere key). Usar el `minAmountOut` como colateral.

### 8.9 Ensayo en mainnet sin gastar fondos (prueba fuerte para los jueces)
`scripts/rehearse-mainnet.ts` con **`eth_simulateV1`** sobre `https://mainnet.base.org` (soportado, con `stateOverrides` y múltiples llamadas): desplegar oráculo + escrow dentro de la simulación, listar AAPLc con su feed real, y que un holder real (p. ej. el pool de Aerodrome) haga `approve` + `createGuarantee`, luego `fileClaim`/`release`. Ojo: en fin de semana `settleClaim` debe revertir con `StalePrice` (es el comportamiento esperado).

### 8.10 Llevar la narrativa al producto
La narrativa ya está escrita en `docs/NARRATIVE.md`. Falta:
- Página `/pitch` que la presente como deck (en/es), con las mismas cifras y fuentes.
- Que la landing use el mismo relato: tagline, el 1-2-3 y la tabla comparativa (caución vs depósito vs Garante).
- `README.md`: qué es (resumen de la narrativa), quickstart en 3 comandos, arquitectura, contratos, seguridad y supuestos, deploy, checklist del hackathon.
- Plan de posts diarios etiquetando @buildonbase (el guion del Loom y el post de lanzamiento ya están en la narrativa).

### 8.11 Cierre
`npm run typecheck`, `npx eslint`, `npm run contracts:test`, `next build`, commit y push.

## 9. Cosas que solo pueden hacer Fernando y Kelvin

1. **Registrarse hoy** en el formulario (track Programmable Stock Markets; partners Bankr y BaseStonk) y entrar a sus grupos de Telegram.
2. Crear el **Builder Code** en `https://dashboard.base.org` (Settings → Project Settings → Builder Code).
3. Wallet deployer con ETH en Base (y/o Base Sepolia) y correr el deploy. Definir owner/tesorería/árbitro (idealmente un multisig).
4. Deploy en Vercel con las variables de entorno.
5. **Confirmar elegibilidad por país**: Coinbase solo dice "jurisdicciones elegibles fuera de EE.UU."; no hay lista pública, así que Argentina/Brasil no están confirmados.
6. Posts diarios en X con @buildonbase, Loom, y envío final antes del 4 dic.
7. Confirmar el rol/bio de Kelvin y la relación con Smarlin para la slide de equipo.
8. Preguntar por escrito a Base/partners cómo se mide la tracción y si testnet cuenta.

---

## Apéndice A — Datos técnicos verificados

**Tokenized Stocks API** (pública, sin key): `https://api.coinbase.com/v1/tokenized-stocks` (`/`, `/chains`, `/metadata/{ticker}`, `/images/{symbol}`…). 358 tokens, todos con 8 decimales; 12 con `nav_price`: AAPLc, AMZNc, CRCLc, GOOGLc, INTCc, METAc, MSFTc, MSTRc, NVDAc, SNDKc, SPCXc, TSLAc. Solo existen en chain 8453.

**Estándar B20** (precompile nativo de Base; ERC-20 compatible):
- `transfer`/`transferFrom`/`approve` devuelven `true` y revierten con errores custom; sin fee-on-transfer ni hooks; soporta `permit` (ERC-2612).
- `multiplier()` refleja dividendos y splits; **los balances no hacen rebase**.
- **El feed de Chainlink ya incluye el multiplicador**: valor USD = `balance × answer / 1e8`. No multiplicar dos veces.
- Políticas (`PolicyRegistry` en `0x8453000000000000000000000000000000000002`): hoy se comportan como blocklist; los contratos pueden recibir y enviar.
- El emisor puede **pausar** e **incautar** (`seizeWithMemo`).
- Librería oficial con interfaces y mocks: `github.com/base/base-std`.

**Feeds Chainlink en Base** (8 decimales, 24/5, desvío 0,5% o heartbeat 24 h; se congelan fuera de horario):

| Feed | Proxy |
|---|---|
| AAPL | `0x787f13dEa48Db0897CbCDD985de77809D837F988` |
| AMZN | `0x06A8E4b3aBB3B7543d8396FB2B763d22820cB295` |
| GOOGL | `0x5bF49E0ffA937CE2FfF033c739aD7C634c4D34F2` |
| META | `0x6526aE6797A76123638b863AeE4dD27Ba4E4b27D` |
| MSFT | `0xeB10A6c9aa7E537aEd766C08c35Dae35B321b18c` |
| MSTR | `0xB3cE282CD188b35DA0E38D8Bc7d58e33173D202a` |
| NVDA | `0x04689a41629776563E6822F76f2e57D148d28513` |
| SNDK | `0x388b0dC46C0Fb05A74BeE0994fa5b02c6Fcca2eA` |
| SPCX | `0x6A634B235903C4ad6376892180d6fF8612e3Fa68` |
| TSLA | `0xFaf869185383a24F8cb00e27BdA6b63B9905DCb4` |
| INTC | `0xAB657C39bac0D5886250D70849e2E3E008F2EECB` |
| COIN | `0x408e44f504A7371a345F03a73dDC96A4b48e8aa7` |
| CRCL | `0x0231cF2635D1E17bB5c2462cc7504Ba1fBd61f33` |

Estas direcciones son referencia: **el script debe descubrirlas del directorio de Chainlink, no copiarlas**. Existen feeds 24/7 ocultos y no documentados (NVDA, TSLA, GOOGL): no usarlos.

**Tokens de ejemplo:** AAPLc `0xb200000000000000000000C2e324d24d7eEcd1fb`, NVDAc `0xb20000000000000000000078ee7ce2fE4908108C`, TSLAc `0xb2000000000000000000001e800a7f5189430cD0`. USDC en Base: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`.

**Liquidez** (GeckoTerminal, 14 nov): pools Aerodrome Slipstream contra USDC — AAPLc ~USD 495k (vol. 24 h USD 5,2M), NVDAc ~USD 1,59M (USD 15,4M), TSLAc ~USD 509k (USD 5,7M).

**Base Sepolia:** la infraestructura B20 está activa pero no hay acciones de Coinbase ni feeds de acciones → usar mocks.

**Fuente de cada dato:** verificados directamente en esta sesión: API de Coinbase y `/chains`, directorio de Chainlink, endpoint de Yahoo, reglas y premios. Reportados por el subagente CTO (con `eth_call`/`eth_simulateV1`, no re-verificados): comportamiento B20, igualdad feed = `nav_price`, liquidez, KyberSwap, Sepolia.

## Apéndice B — Research de mercado (subagente; cada cifra con fuente)

**Problema**
- Argentina: el seguro de caución cuesta **4–7% del valor total del contrato** (1–2 meses de alquiler), no reembolsable. https://www.iprofesional.com/finanzas/454624-alquiler-2026-que-conviene-mas-garantia-propietaria-o-seguro-de-caucion
- Argentina: entrar a un alquiler de ARS 700k exige ~ARS 2,94M (**4,2 meses de alquiler**). https://www.iprofesional.com/realestate/457479-cuanta-plata-se-necesita-en-total-para-alquilar-un-departamento-de-700000-pesos
- Argentina: **76,5%** de 1.500 inquilinos del AMBA tuvo problemas con las condiciones de ingreso (2023). https://www.c5n.com/economia/ley-alquileres-el-765-inquilinos-amba-afirmo-que-tiene-problemas-las-garantias-pedidas-n108549
- Brasil: caução = 3 meses; seguro-fiança ~15–18% del contrato, no reembolsable. https://www.seudinheiro.com/2025/financas-pessoais/sem-fiador-ou-caucao-garantias-de-aluguel-evoluem-e-novas-opcoes-prometem-seguranca-para-o-proprietario-e-retorno-ao-inquilino-mlim/
- México: 1 mes de depósito + póliza jurídica (30–50% de un mes). https://expansion.mx/finanzas-personales/2025/10/14/rentar-por-primera-vez-guia-de-todo-lo-que-debes-saber
- Chile: 1 mes de garantía + aval; seguro de arriendo 2–5% del alquiler mensual. https://www.remax-first.cl/seguro-arriendo-chile/
- Colombia: **los depósitos y cauciones reales están prohibidos** para vivienda (Ley 820/2003 art. 16) → mercado posiblemente cerrado para este producto. https://www.asuntoslegales.com.co/consultorio/depositos-en-efectivo-o-cauciones-reales-en-contratos-de-arrendamiento-urbano-4085526

**Tamaño**
- Hogares inquilinos: Argentina 3,34M (Censo 2022), Brasil 17,8M (23% × 77,3M, PNAD 2024; aritmética del agente), México 5,8M (ENVI 2020), Colombia 7,47M (ECV 2024), Chile 1,73M (Censo 2024) → **36,1M**.
- Valor inmovilizado en depósitos: cota superior **USD 46,9B** (con alquileres de capitales); ~USD 23B con un recorte del 50% que es **supuesto del agente, sin fuente**.
- Brasil: primas de seguro-fiança **R$ 2.000M en 2025 (+19,7%)**. https://cqcs.com.br/noticia/corretores-puxam-crescimento-do-seguro-fianca-que-avanca-com-forca-no-brasil/
- Referencia EE.UU.: "más de USD 45B" en depósitos (Rhino, 2019; es dato de parte interesada). https://www.sayrhino.com/blog/posts/renters-choice-and-rent-payment-plan
- SAM Argentina: >1M de cuentas con CEDEARs × 21% inquilinos ≈ 210k hogares × 2 meses × USD 574 ≈ USD 241M.

**Competencia:** Rhino+Jetty, TheGuarantors, Obligo, LeaseLock (EE.UU.); Finaer (200k+ garantías), Hoggax, Garantía Ya (AR); QuintoAndar, Loft/CredPago (su "Garantia Investe" prenda bonos del Tesoro: el análogo más cercano), Porto (BR); Houm, Aptuno, El Libertador; RentLock y Trustless Work (escrow con stablecoins). **El agente no encontró ningún producto que use acciones tokenizadas como garantía de alquiler**, ni en ~40 repos públicos del hackathon (no pudo revisar X).

**Vientos de cola**
- Acciones tokenizadas: **USD 3,77B**, desde USD 2,48B el 24 ago 2026. https://app.rwa.xyz/stocks
- Acciones de Coinbase en Base en vivo desde el **24 ago 2026**. https://www.marketsmedia.com/tokenized-stocks-issued-by-coinbaseare-now-live-natively-on-base/
- Argentina: 12,3M de personas con cuenta comitente; >1M con CEDEARs (BYMA, may 2026). https://www.iprofesional.com/finanzas/460259-la-mitad-de-los-argentinos-que-trabajan-ya-tiene-una-cuenta-para-invertir
- Brasil: 5,7M de inversores individuales en B3. https://www.b3.com.br/pt_br/noticias/etfs-ganham-223-mil-investidores-em-um-ano-e-alcancam-862-mil-cpfs-na-b3.htm
- Argentina: inflación interanual 33,1% (INDEC, 12 nov 2026): un depósito en pesos pierde ~25% real en 12 meses. https://www.indec.gob.ar/uploads/informesdeprensa/ipc_11_269335F5BA6B.pdf
- DNU 70/2023 liberó monto y moneda del depósito en Argentina.

**Cautelas para el pitch:** solo hay ~USD 47,5M de acciones de Coinbase emitidas (oferta de colateral chica); elegibilidad por país sin confirmar; cifras de alquiler son de capitales (cota superior).

## Apéndice C — Checklist "cómo ganamos" (subagente de estrategia)

1. Registrarse ya y sumarse a los Telegram de Bankr y BaseStonk.
2. Builder Code en todas las transacciones (verificar con `builder-code-checker.vercel.app`).
3. **Mainnet con acciones reales antes del ~24 nov**, con topes de monto y geo-bloqueo de EE.UU.
4. Metas de tracción sugeridas (no hay métrica publicada): 10+ garantías activas, 25+ wallets únicas, 2–3 pilotos reales propietario/inquilino, página pública de stats. Sin auto-operaciones (§13).
5. Producto: ciclo completo (bloquear → activa → liberar → reclamo/disputa).
6. Build in public: post diario "Día N" con links a Basescan, etiquetando @buildonbase.
7. Loom ≤ 3 min: problema (20 s), flujo real en mainnet, números de tracción, qué se construyó durante el Quest, roadmap.
8. Enviar el 4 dic, un día antes del cierre.
