# HANDOFF: Accasa (Base Stocks Maxxing)

Documento de traspaso para continuar el trabajo desde otra cuenta de Claude.
Estado al **14 nov 2026**. Repo: `https://github.com/Beor18/base-hackathon-stock-properties` (rama `main`).

> **Base de datos (15 nov 2026):** Supabase, proyecto `accasa` (`egidprkmchknhklpfdpf`) en la organización gratuita "Proyecta" de Fernando (no la de Smarlin). Guarda solo lo que no puede vivir en la red: las ofertas de reserva de los corredores (link corto `/o/<id>`, que no se puede editar) y cuándo cada corredor miró su bandeja. Esquema en `supabase/schema.sql` (tablas cerradas al público; las lee el servidor con la clave secreta). Variables: `SUPABASE_SECRET_KEY` (secreta, la carga Fernando en Vercel y en `.env.local`) y `SUPABASE_URL` (opcional, ya tiene el valor por defecto). Quien genera un link se identifica con el token de identidad de Privy (activado en Authentication → Advanced); si su email coincide con el del agente de la publicación en Smarlin, el link sale con "Corredor verificado". El email del agente solo se compara en el servidor: no se guarda ni se muestra.

> **Nombre (15 nov 2026):** el producto se llamaba **Seña** y pasó a llamarse **Accasa** (acción + casa, se lee "a casa"). "Seña" sin la ñ queda "sena", que no sirve como dirección web. La palabra "seña" sigue siendo el depósito que se deja para reservar. Dirección: https://accasa.vercel.app (la anterior, sena-app-blond.vercel.app, sigue andando).

> **La fuente de verdad del producto es [`docs/superpowers/specs/2026-11-14-sena-design.md`](docs/superpowers/specs/2026-11-14-sena-design.md).** Si algo de este documento la contradice, gana el spec. El enfoque anterior ("Garante", garantía de alquiler) quedó reemplazado: sus datos técnicos y de mercado siguen valiendo y están acá abajo.

> **Cómo usarlo:** abrí una sesión nueva de Claude Code con este repo adjunto y pegá:
> _"Leé el spec `docs/superpowers/specs/2026-11-14-sena-design.md`, `HANDOFF.md` y `docs/NARRATIVE.md` completos y continuá desde la sección 8 (Pendientes), en orden. Commiteá y pusheá a `main` después de cada hito."_

**La narrativa de la startup está en [`docs/NARRATIVE.md`](docs/NARRATIVE.md):** de dónde venimos, problema, solución, por qué ahora, dónde lanzamos, mercado, competencia, diferenciador, modelo de negocio, plan de 0 a 1, riesgos, equipo, ask y los textos de entrega en inglés. La UI, el README y la página `/pitch` tienen que decir lo mismo.

---

## 1. El pedido original (de Fernando, del enfoque inicial)

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
| Producto | **Accasa: tu próxima casa, en acciones.** La persona ahorra en acciones tokenizadas con una propiedad real como meta, aporta con USDC o wARS y, cuando llega, sus acciones quedan como reserva (seña) de la casa sin venderlas. Si se arrepiente, el corredor cobra en USDC. Hereda el mecanismo de Camalote (Camalote está en pausa). |
| Track | **Programmable Stock Markets** (pool Base USD 20.000). Solo se puede entrar a un track. |
| Usuarios y mercados | Fuera de EE.UU., **Argentina primero**. La portada y la demo son propiedades de **Puerto Rico** (Smarlin, Kelvin). La entrada es cualquier portal argentino pegando el link. Las acciones tokenizadas de Coinbase son solo para no-US y las reglas descalifican proyectos que habiliten trading a usuarios de EE.UU., Puerto Rico incluido: por eso nadie del lado del vendedor recibe acciones (el corredor cobra en USDC) y la app bloquea EE.UU. y territorios en mainnet. Ver `docs/NARRATIVE.md` §4. |
| Flujo | Tres pasos: elegir la casa (seña = precio x % de seña, default 5%, ajustable 1% a 10%), sumar (USDC o wARS a la acción de la meta; una acción por meta en v1) y reservar (acciones al escrow a favor del corredor, con árbitro). El corredor genera un **link de reserva** (con login, sin transacción) y lo comparte por WhatsApp. |
| Vínculo con Smarlin | Smarlin es producto propio, en producción en Puerto Rico; Kelvin vende allá. Aporta las propiedades de la portada y los datos únicos (precio justo, renta de corto plazo, renta de mercado, comparables). Ver §6b. |
| Modelo de negocio | Dos comisiones siempre visibles: en cada aporte y al reservar (`feeBps` on-chain, tope 3%). Vías de crecimiento: plan para corredores e inmobiliarias sobre Smarlin, tickets más grandes, otros portales. Nunca "gratis" ni "sin comisión". Porcentajes **[decidir]**. |
| Reglas de producto | Cero fricción (email con Privy, gas pago, sin modales, aprobar y actuar en una llamada), una acción clara por pantalla, mobile first (375, 768, 1280), toda espera con progreso, copy rioplatense sin raya larga ni jerga cripto, sin marcas de terceros en la app, nada hardcodeado, una sola variable de entorno (`NEXT_PUBLIC_PRIVY_APP_ID`). Completas en el spec §3. |
| Stack | Next.js 16.4.6 (App Router, Cache Components), React 19, TypeScript, Tailwind 4, wagmi 3 + viem 2, Privy, zod 4, Foundry (vía npm). Sin base de datos: el contrato es la base de datos. |

**Datos que faltan pedirle a Fernando y Kelvin** (no inventarlos): licencia y trayectoria de Kelvin, métricas reales de Smarlin (usuarios, corredores), % de seña habitual en Puerto Rico y en Argentina, cuántos compradores de Kelvin son de fuera de EE.UU. Están marcados con **[completar]** en la narrativa.

**Resuelto frente al enfoque anterior:** el depósito de compra ya no es "propuesta abierta": es el producto. Los roles del contrato se renombraron a `depositor` / `beneficiary` / `arbiter`, y la liquidación ya paga en USDC (antes era la pregunta abierta de los beneficiarios en Puerto Rico).

## 3. Reglas del hackathon (leídas de la página oficial y `/stocksmaxxing/rules`)

- **Fechas:** 5 nov – 5 dic 2026. Entrega hasta **5 dic 23:59 UTC**.
- **Premios:** USD 50.000 en tracks Base (Meme & Community 10k, **Agentic Stock Finance 20k**, **Programmable Stock Markets 20k**), USD 48.000 de partners, USD 6.000 al "build in public" (voto de la comunidad).
- **Cómo se juzga: no está publicado.** El reparto 50% tracción, 25% producto, 25% build in public sale de una nota de prensa sin atribución (CryptoBriefing, 6 nov 2026), no de una fuente oficial. Las reglas (§7) dicen que los criterios pesan igual salvo que la Quest Page indique otra cosa, y la página no lista criterios. Hay que preguntarlo por escrito en el grupo de Bankr, junto con un posible reparto del premio (USD 11.000 a proyectos ya lanzados, USD 7.000 a proyectos nuevos) que aparece en el código de la página y no se muestra. Detalle en `docs/research/2026-11-14-mercado-y-competencia.md`.
- **Entrega:** post público en X con video demo (Loom) etiquetando **@buildonbase** + formulario. El formulario de registro es `https://docs.google.com/forms/d/1zotYvkeAtDjR2MKk3qNxyNIAfJ_IPQtzTtjNhOAF8js/viewform`. El formulario final de entrega aún no estaba publicado.
- **Testnet está permitido** y "no se juzga menos favorablemente" (Rules §5). Aun así, mainnet con las acciones de Coinbase es la ventaja en tracción: casi todos los competidores están en Sepolia con mocks.
- **Elegibilidad:** mayores de 18, equipos de hasta 5, no OFAC. **"Projects that enable trading for US users are not eligible."**
- Rules §13 descalifica por manipular métricas de tracción.
- Partners del track: **Bankr** (premios + mentoría) y **BaseStonk** (sin premio en efectivo; su incentivo es lanzar un token en su launchpad : no hacerlo solo por eso).
- Recursos oficiales: Builder Codes, Tokenized Stocks API, guía "Integrate tokenized stocks".

## 4. Estado del repo

Otros agentes construyen en paralelo, con dueños de archivos (spec §9): contratos y deploy, datos y backend, diseño y frontend; después integración. **`TODO(verify)`: actualizar esta sección cuando terminen.**

### Heredado y verificado (enfoque anterior)
- `StockOracle.sol` y `GuaranteeEscrow.sol` con **27 tests de Foundry** (`npm run contracts:test`); ABIs en `src/contracts/abis.ts` (`npm run contracts:abi`); capa de servidor y API routes con `typecheck` y `eslint` verdes.
- Estos archivos se adaptan: `GuaranteeEscrow` pasa a `ReservationEscrow`, se suma `GoalRegistry`, y las rutas se adaptan a los contratos nuevos.

### En construcción según el spec (§5 a §7)
- Contratos: `ReservationEscrow` (con `propertyRef`, `settleClaim` a USDC, lista blanca de routers, `maxSlippageBps` inmutable), `GoalRegistry`, mocks (`MockUSDC`, `MockWARS`, `DemoExchange`).
- Servidor: proveedores `smarlin` y `link` (anti-SSRF), cotización ARS, rutas `/api/properties`, `/api/link-preview`, `/api/rates`, planificadores de `calls[]`.
- Cliente: `src/lib/wallet` (Privy y dev), pantallas `casa`, `meta`, `sumar`, `cargar`, `reservar`, `r/[id]`, `pedir`, `unavailable`, `pitch`, i18n `es` y `en`, `src/proxy.ts`.

### No ejecutado todavía
- Las API routes nunca corrieron contra una chain. Verificar `"use cache"` + `cacheLife` dentro de los servicios.

### Mapa de archivos (heredado, a actualizar)
```
contracts/src/StockOracle.sol              registro de acciones + precios Chainlink (2 cotas de frescura)
contracts/src/GuaranteeEscrow.sol          (se renombra a ReservationEscrow.sol)
contracts/src/interfaces/*.sol             tipos, eventos y errores documentados
contracts/src/mocks/                       MockStockToken, MockPriceFeed (+ MockUSDC, MockWARS, DemoExchange)
contracts/test/                            tests Foundry
scripts/export-abis.ts                     genera src/contracts/abis.ts
src/config/chains.ts                       chains soportadas: base, baseSepolia, foundry
src/config/deployment.json                 (nuevo) direcciones y config, lo genera el deploy
src/domain/                                DTOs y matemática de colateral (+ property, rates)
src/server/                                chain, clients, services
src/app/api/                               route handlers
```
`src/config/public-env.ts` y `server-env.ts` del enfoque anterior deberían desaparecer: el spec deja una sola variable de entorno.

## 5. Diseño de los contratos

Vigente: spec §5. Resumen y herencia del enfoque anterior:

**`StockOracle`** (Ownable2Step), sin cambios de fondo
- `setStock(token, feed, collateralRatioBps, enabled)`: el ratio debe ser > 100% y <= 300%.
- `toUsd` / `toTokens(token, amount, PriceUse)`: USD con 18 decimales.
- Dos cotas de frescura inmutables: `collateralMaxAge` (laxa, para **entrar** colateral: acepta el cierre del viernes) y `settlementMaxAge` (estricta, para **sacar** valor). Motivo: los feeds de Coinbase/Chainlink son 24/5 y se congelan fines de semana y feriados.
- `latestPrice(token)` sin chequeo de frescura, solo para UIs.

**`ReservationEscrow`** (evolución de `GuaranteeEscrow`)
- Roles: `depositor`, `beneficiary`, `arbiter` (si es `address(0)` usa `defaultArbiter`); tres direcciones distintas. Campo `propertyRef` (`bytes32`).
- Mismo ciclo: crear, reforzar (`topUp`, abierto a cualquiera), retirar excedente, extender, reclamar, aceptar o disputar, resolver (árbitro; el `defaultArbiter` puede tras `arbitrationTimeout`), liquidar y liberar.
- **Cambio clave:** `settleClaim(id, router, swapData)` vende las acciones necesarias por un router de la lista blanca del owner, verifica que lo recibido en USDC sea >= valor de oráculo x (1 - `maxSlippageBps` inmutable), paga el reclamo en USDC al beneficiario y devuelve el resto al depositante. El colateral restante **siempre vuelve al depositante**.
- Comisión al crear (`feeBps`, tope 3%) a la tesorería. Ventanas inmutables: `disputeWindow`, `claimWindow`, `arbitrationTimeout`. Contadores on-chain.

**`GoalRegistry`**: una meta por cuenta (`setGoal`, `clearGoal`, `goalOf`, contadores `goalCount` y `activeGoals`). El precio de la acción al inicio lo lee del oráculo.

**Supuestos de confianza (van en el README):** el owner del oráculo y de la lista blanca de routers (multisig + timelock en producción), el árbitro, y que el emisor B20 puede pausar o **incautar** tokens (la contabilidad por reserva no lo contempla). Sin chequeo de sequencer uptime feed.

## 6. Arquitectura objetivo

Vigente: spec §6 y §7. Pantallas en `src/app/[lang]/`: landing, `casa` (buscar y pegar link), `casa/[ref]` (detalle y "Esta es mi meta"), `meta`, `sumar`, `cargar` (dirección + QR; en testnet "Cargar saldo de prueba"), `reservar`, `r/[id]` (página pública según rol), `pedir` (el corredor genera el link), `unavailable`, `pitch`. `src/proxy.ts`: redirect de idioma y, solo en mainnet, bloqueo de EE.UU. y territorios (incluido PR) por el header de país de la plataforma.

**Transacciones:** una interfaz `sendCalls(calls) -> hash` con dos implementaciones: Privy smart wallet (email, sponsoreada, en lote, sin UI) y dev (cuentas de anvil, solo chain 31337). Aprobación y acción siempre en una llamada por lotes. **No usar `experimental_fallback` de viem:** manda las transacciones seguidas sin esperar confirmación y la segunda falla al estimar gas.

**Lecturas:** datos del protocolo por las API routes (TanStack Query); saldos directo con wagmi o viem.

## 6b. Integración con Smarlin (propiedades reales, nada hardcodeado)

> Sigue vigente: es el proveedor `smarlin` del spec §6. Se suman los endpoints de datos (`/api/properties/fair-price`, `/api/mercado/str`, `/api/properties/renta-mercado`, `/api/properties/{id}/comparables`). El deep link ahora es `casa/[ref]` y el `ref` es la referencia de la propiedad (su keccak va on-chain como `propertyRef`).

Fernando confirmó que **el equipo puede consumir las APIs de Smarlin** y que él, en Argentina, es el usuario elegible del lado de las acciones. Las propiedades del producto salen de ahí.

**Endpoints observados en el sitio público** (sin autenticación, 14 nov 2026):

| Endpoint | Devuelve |
|---|---|
| `GET https://www.smarlin.com/api/properties?limit=&offset=&status=active&listingType=sale\|rent&verifiedOnly=true` | `{ success, properties: [...], meta: { total, limit, offset, hasMore } }` |
| `GET https://www.smarlin.com/api/properties/{id}` | `{ success, property: {...} }` (campos en camelCase, p. ej. `mlsNumber`, `sourceProvider`) |
| `GET https://www.smarlin.com/api/home/cifras` | Cifras de la plataforma (publicadas, ventas cerradas analizadas, municipios) |
| `GET https://www.smarlin.com/api/home/pulso` | Activas, alquileres, serie mensual |

Campos útiles de una propiedad (listado, snake_case): `id` (uuid), `title`, `description`, `address`, `city`, `zip_code`, `property_type`, `listing_type` (`sale`/`rent`), `price` (USD; mensual si es alquiler), `bedrooms`, `bathrooms`, `square_feet`, `images[]`, `latitude`, `longitude`, `neighborhood`, `agent_name`, `agent_company`, `claimed_agent_id`, `status`.

Con `verifiedOnly=true` había 9 propiedades en venta y 3 en alquiler, todas de Kelvin: son el set natural para la demo.

**Diseño propuesto**
- `src/server/clients/smarlin.ts`: cliente con `SMARLIN_API_URL` por env, respuestas validadas con zod y cacheadas (`"use cache"`).
- **Lista blanca de campos en nuestro servidor.** La respuesta trae `embedding` (vector enorme), email y teléfono del agente: no reenviarlos al browser ni guardarlos.
- `GET /api/properties` (búsqueda/listado) y `GET /api/properties/[id]`, como proxy de Smarlin.
- **Paso 1 del flujo = elegir propiedad.** El monto sale de la publicación: alquiler → N meses × `price`; venta → porcentaje de `price` como depósito de opción **[decidir porcentaje con Kelvin]**.
- Deep link desde Smarlin: `/new?property=<id>`; el precio se lee de la API, no de la URL, para que no se pueda alterar.
- Guardar la referencia a la publicación on-chain (un `bytes32` con el hash del id de Smarlin; es dato público, no personal) para que la página de la garantía muestre la propiedad.
- Camino manual ("mi propiedad no está en Smarlin") para alquileres locales en Latinoamérica.

**Código fuente de Smarlin en la PC de Fernando:** `~/Documentos/test-opencode/real-state-startup` (remote `Beor18/real-state-matches`). Ante cualquier duda sobre la API, leer el código ahí en vez de inferir desde el sitio.

**Decisión (14 nov 2026): Accasa usa los endpoints públicos de Smarlin, sin key.** Smarlin los documenta como contrato estable (`ENDPOINTS_SMARLIN` en `lectura-inmobiliaria-contrato.ts`): `GET /api/properties`, `GET /api/properties/<id>`, `GET /api/tasas/vigente`, `GET /api/mercado/str` y `GET /api/properties/renta-mercado`. También son públicos `fair-price` y `/api/properties/<id>/comparables`. Así la app no suma variables de entorno.

**Para más adelante (opcional): la API para partners**, leída del código el 14 nov 2026. Sirve si hace falta el inventario completo de un agente o el webhook de cambios:

| Endpoint | Qué hace |
|---|---|
| `GET /api/partner/properties?agentEmail=…\|ownerId=…&status=active&mls=&limit=&offset=` | Inventario completo de **un** Agente Verificado, con el mismo shape que `/api/properties/[id]` y su perfil pro (`agent`: sello, licencia, contacto). Máx 200 por página. |
| `GET /api/partner/insights?id=<uuid>\|mls=<n>` | Análisis PRO del listado: Fair Price Score, Equity Forecast, comparables y link al CMA. |

- **Auth:** header `x-api-key`. La key sale de la tabla `partner_api_keys` (se crea desde el admin de Smarlin, `/api/admin/api-keys`) o del env legacy `PARTNER_API_KEYS` (`label:key,…`).
- **Gate:** el agente pedido tiene que tener el sello de **Agente Verificado**; si no, responde 403 `agent_not_verified`. Todo indica que Kelvin está verificado, porque sus publicaciones son las únicas que devuelve `verifiedOnly=true`. Confirmarlo al crear la key.
- **Webhook:** al guardar un listado, Smarlin avisa a los partners configurados en `PARTNER_WEBHOOKS` (`src/lib/partner-webhooks.ts`), y el partner vuelve a pedir solo ese `mls`. Accasa puede registrarse como partner y refrescar su caché por webhook.
- La respuesta trae `agent_phone` y `agent_email`: la lista blanca de campos de nuestro servidor sigue siendo obligatoria.
- Si algún día se usa, la key es una variable de entorno más de servidor (`SMARLIN_PARTNER_KEY`); por eso hoy no entra.

**Preguntas abiertas para Fernando y Kelvin**
1. ~~¿Hay una ruta o API key pensada para integraciones?~~ **Sí: la API de partners (arriba).** Hoy no hace falta porque alcanza con los endpoints públicos.
2. **¿De dónde sale la wallet del beneficiario?** Smarlin no guarda wallets. Opción inmediata: el corredor genera el link desde su publicación con su wallet. Opción correcta: agregar el campo en el perfil del agente en Smarlin y exponerlo en la API.
3. ~~Reclamos con beneficiario en Puerto Rico~~ **Resuelto en el diseño:** `settleClaim` vende por un router de la lista blanca y paga en USDC (spec §5).
4. ¿Cuántos compradores e inquilinos de Kelvin son extranjeros no estadounidenses? Es la hipótesis más riesgosa del flujo sobre propiedades de Puerto Rico.

## 7. Gotchas del entorno (ahorran tiempo)

- **Next 16.4.6 no es el Next de siempre.** Leer `AGENTS.md` y `node_modules/next/dist/docs/` antes de escribir. Puntos clave:
  - `cacheComponents: true` y `partialPrefetching: true` vienen activados. Lo no cacheado va dentro de `<Suspense>`; `params`/`cookies`/`headers` también.
  - `"use cache"` no puede ir en el cuerpo de un route handler: va en una función auxiliar, con `cacheLife(...)`.
  - `middleware.ts` ahora es **`proxy.ts`** y exporta `proxy`.
  - `RouteContext<'/ruta/[id]'>` es global pero requiere `next typegen` (ya está en `npm run typecheck`).
  - Tailwind va por el loader `@tailwindcss/turbopack` en `next.config.ts` (no hay `postcss.config`).
  - i18n recomendado: segmento `app/[lang]` + redirect en `proxy.ts`.
- **Configuración:** el enfoque anterior usaba `public-env.ts` con varias variables. En Accasa queda **una** (`NEXT_PUBLIC_PRIVY_APP_ID`) y el resto sale de `src/config/deployment.json`. Si `next build` o `typegen` fallan por variables faltantes, es código viejo que hay que migrar.
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

Según la sección 9 del spec (ejecución con dueños de archivos) y la sección 10 (lo que solo hacen Fernando y Kelvin). Marcar `TODO(verify)` donde dependa de lo que entreguen los otros agentes.

### 8.1 Contratos y deploy (rol CTO)
- `ReservationEscrow` (renombrar `GuaranteeEscrow`), `GoalRegistry`, `MockUSDC`, `MockWARS`, `DemoExchange`; tests Foundry de todo el ciclo, incluidos slippage, router fuera de la lista blanca y precio viejo.
- `scripts/`: deploy a `local | base-sepolia | base` que **genera y commitea** `src/config/deployment.json`; `npm run chain` (anvil + deploy). Universo de acciones sin hardcodear tickers: Tokenized Stocks API (`?page_size=500`, paginar con `next_page_token`) unida al directorio de Chainlink (`https://reference-data-directory.vercel.app/feeds-ethereum-mainnet-base-1.json`, `productTypeCode === "primaryTokenizedPrice"`, excluir `hidden` y `247Price`), verificando que el feed coincida con `nav_price` (~2%).
- Ratio de colateral por acción desde datos (peor caída en ventana de ~30 días del último año, `ratio = 1 / (1 - caída)`, redondeo a 5%, acotado 115% a 200%; Yahoo chart con `User-Agent`; con poca historia, ratio máximo).
- Local y testnet: anvil con cuentas desbloqueadas, sin private keys en el código. Público: `DEPLOYER_PRIVATE_KEY`.
- wARS real `0x0DC4…D90D` (symbol `wARS` verificado), descubierto desde la fuente de Lapacho/Ripio, no copiado.

### 8.2 Datos y backend
- Proveedores `smarlin` (lista blanca de campos, caché) y `link` (JSON-LD, Open Graph, anti-SSRF); cotización ARS desde Chainlink USD/ARS; rutas `/api/properties`, `/api/properties/[ref]`, `/api/link-preview`, `/api/rates`. Verificar contra la API real de Smarlin (§6b).

### 8.3 Diseño y frontend
- Pantallas del §6, i18n `es`/`en`, landing "vendeme esta pluma" (necesidad primero), revisar en 375, 768 y 1280, progreso en toda espera. `/pitch` con la misma narrativa y cifras de `docs/NARRATIVE.md`.

### 8.4 Integración (fase 2)
- `src/lib/wallet` (Privy + dev), hooks, planificadores (meta, aporte, reserva), Builder Code (ERC-8021) por llamada, geo-bloqueo solo en mainnet, e2e en chain local con `evm_increaseTime` para las ventanas.
- Aporte en mainnet por el agregador KyberSwap (sin key: `GET https://aggregator-api.kyberswap.com/base/api/v1/routes?tokenIn=&tokenOut=&amountIn=`, luego `POST …/route/build` con header `x-client-id`; ruta wARS a AAPLc verificada el 14 nov) con fee a tesorería.
- Ensayo en mainnet sin gastar fondos con `eth_simulateV1` sobre `https://mainnet.base.org` (desplegar oráculo y escrow dentro de la simulación, holder real hace aprobar y reservar, luego reclamo). En fin de semana `settleClaim` debe revertir con `StalePrice`.

### 8.5 Narrativa y entrega
- Revisar de nuevo la competencia con una búsqueda específica de "ahorro para propiedad con acciones" **[confirmar]**.
- Plan de posts diarios "Día N" etiquetando @buildonbase; Loom de 3 min (guion en la narrativa); envío el 4 dic.

### 8.6 Cierre
`npm run typecheck`, `npm run lint`, `npm run contracts:test`, `next build`, commit y push.

## 9. Cosas que solo pueden hacer Fernando y Kelvin

1. **Registrarse en el formulario** del hackathon (track Programmable Stock Markets; partners Bankr y BaseStonk) y entrar a sus grupos de Telegram.
2. Crear la **app de Privy** (email, smart wallets tipo Coinbase Smart Wallet, paymaster de CDP para Base y Base Sepolia, `showWalletUIs` apagado) y pasar el `NEXT_PUBLIC_PRIVY_APP_ID`.
3. **ETH de Base Sepolia** para el deployer (faucet de CDP) y, para mainnet, unos centavos de ETH en Base.
4. **Builder Code** desde `https://dashboard.base.org` (Settings, Project Settings, Builder Code).
5. **Tesorería y árbitro de mainnet** (idealmente multisig); definir quién es owner del oráculo y de la lista blanca de routers.
6. **Kelvin:** % de seña habitual en Puerto Rico, si acepta figurar como corredor de la demo, licencia y trayectoria, cuántos de sus compradores son de fuera de EE.UU.
7. **Confirmar elegibilidad por país** (Coinbase no publica la lista; Argentina no está confirmada) y consultar con un asesor legal el encuadre de Puerto Rico como EE.UU.
8. Confirmar con un escribano el % de seña o reserva habitual en Argentina.
9. Decidir **[decidir]** las dos comisiones (aporte y reserva), la meta de 12 meses, el uso del premio y el monto de la ronda.
10. (Opcional, no bloquea) Si más adelante hace falta el inventario completo de un agente o el webhook, crear la key de partner de Smarlin en `/api/admin/api-keys`.
11. Deploy en Vercel; posts diarios en X, Loom y envío final antes del 4 dic.
12. Preguntar por escrito a Base y los partners cómo se mide la tracción y si testnet cuenta.

---

---

## Apéndice A : Datos técnicos verificados

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

**Liquidez** (GeckoTerminal, 14 nov): pools Aerodrome Slipstream contra USDC : AAPLc ~USD 495k (vol. 24 h USD 5,2M), NVDAc ~USD 1,59M (USD 15,4M), TSLAc ~USD 509k (USD 5,7M).

**Base Sepolia:** la infraestructura B20 está activa pero no hay acciones de Coinbase ni feeds de acciones → usar mocks.

**Fuente de cada dato:** verificados directamente en esta sesión: API de Coinbase y `/chains`, directorio de Chainlink, endpoint de Yahoo, reglas y premios. Reportados por el subagente CTO (con `eth_call`/`eth_simulateV1`, no re-verificados): comportamiento B20, igualdad feed = `nav_price`, liquidez, KyberSwap, Sepolia.

## Apéndice B : Research de mercado (subagente; cada cifra con fuente)

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

## Apéndice C : Checklist "cómo ganamos" (subagente de estrategia)

1. Registrarse ya y sumarse a los Telegram de Bankr y BaseStonk.
2. Builder Code en todas las transacciones (verificar con `builder-code-checker.vercel.app`).
3. **Mainnet con acciones reales antes del ~24 nov**, con topes de monto y geo-bloqueo de EE.UU.
4. Metas de tracción sugeridas (no hay métrica publicada): 10+ garantías activas, 25+ wallets únicas, 2–3 pilotos reales propietario/inquilino, página pública de stats. Sin auto-operaciones (§13).
5. Producto: ciclo completo (bloquear → activa → liberar → reclamo/disputa).
6. Build in public: post diario "Día N" con links a Basescan, etiquetando @buildonbase.
7. Loom ≤ 3 min: problema (20 s), flujo real en mainnet, números de tracción, qué se construyó durante el Quest, roadmap.
8. Enviar el 4 dic, un día antes del cierre.

## Apéndice B2: Research nuevo para Accasa (14 nov 2026)

Cifras con fuente. Las que no tienen fuente están en **[completar]** en la narrativa.

- Argentina, escrituras en CABA (agosto 2026): 6.055 compraventas, 1.059 con hipoteca (17,5%, cálculo propio; -20,8% interanual en hipotecas). Primeros siete meses: 14,4% con hipoteca. Solo CABA. https://www.colegio-escribanos.org.ar/2026/09/22/cantidad-de-escrituras-de-compraventa-realizadas-en-agosto-2026/
- Argentina, dólares fuera del sistema bancario: USD 254.898 millones del sector privado al cierre de 2025 (INDEC; 48,5% de los activos financieros). Incluye moneda y cuentas, sin desglose. https://www.baenegocios.com/amp/el-indec-estimo-que-los-argentinos-guardaron-usd-254-898-millones-fuera-del-sistema-bancario/ . Otras notas dan cifras posteriores (USD 262.014M, USD 268.824M); verificar en INDEC antes de citarlas.
- Años para ahorrar: con USD 1.000 por mes, entre 3 y 6,5 años para comprar en Buenos Aires; con USD 500 por mes, más de 6 años para un monoambiente de USD 37.000 (Propio, 21 ago 2026, sin gastos de la operación). https://mercado.com.ar/ladrillos-y-proyectos/propio-estimo-los-anos-de-ahorro-necesarios-para-comprar-un-departamento-en-buenos-aires . En sueldos: de ~5 años (2 ambientes de 40 m², zona accesible, Reporte Inmobiliario) a 20 o 25 años (50 m²); metodologías distintas.
- Seña y reserva: las guías comerciales no coinciden. Reserva "acotada" (USD 1.000 a 5.000) o 5% a 10% del precio; entrega a cuenta en el boleto ~30%. No es norma. https://mudafy.com.ar/guias/post/como-comprar-un-departamento . **[confirmar con escribano y con Kelvin]**
- Puerto Rico, compradores extranjeros: no se encontraron datos específicos de la isla. Dato nacional de NAR: 47% de los compradores internacionales pagó al contado contra 28% del total. https://www.rismedia.com/2025/07/15/foreign-buyers-up-pre-tariffs-future-uncertain/ . **[completar con Kelvin y Smarlin]**

