# Seña — diseño (14 nov 2026)

Fuente de verdad del producto a partir de hoy. Reemplaza el enfoque de "garantía de alquiler" de `HANDOFF.md` y `docs/NARRATIVE.md` (los datos técnicos de esos documentos siguen valiendo).

## 1. Qué es y por qué

**Seña: tu próxima casa, en acciones.** Una cuenta para ahorrar en acciones con una propiedad concreta como meta. Cuando llegás, esas acciones quedan como reserva (seña) de la propiedad, sin venderlas.

- **Para quién:** gente fuera de EE.UU. (Argentina primero) que ahorra en dólares para comprar una propiedad. En Argentina las propiedades se pagan en dólares y al contado: se ahorra durante años y esa plata queda quieta.
- **Portada y demo:** propiedades reales de **Puerto Rico** en **Smarlin** (nuestro producto, en producción; Kelvin vende allá). El relato: "guardá tus dólares en una propiedad en territorio de EE.UU.", con datos que nadie más tiene (precio justo, renta de corto plazo, renta de mercado, comparables).
- **Puerta de entrada:** cualquier propiedad de Argentina pegando el link de un portal.
- **Por qué gana:** cualquiera en Argentina lo usa mañana con USD 5, y cada aporte es uso real on-chain (50% del puntaje). La reserva final es una acción programada que no existe en ningún otro lado (track Programmable Stock Markets).
- Hereda el mecanismo de Camalote (invertir una parte de lo que cobrás). Camalote está en pausa, así que no compite.

## 2. Flujo (tres pasos)

1. **Elegí la casa.** Propiedades de Smarlin (búsqueda + detalle con datos de Smarlin) o "pegá el link". La app calcula la seña: `precio × % de seña` (default 5%, ajustable por la persona de 1% a 10%).
2. **Sumá.** La persona pone dólares digitales (USDC) o pesos digitales (wARS) y se convierten en la acción que eligió para su meta (una acción por meta en v1). Pantalla de meta: cuánto llevás frente a cuánto necesitás, y desde que empezaste "la casa +x %, tus acciones +y %".
3. **Reservá.** Cuando llegás, un toque bloquea las acciones en el escrow a favor del corredor (que recibe en nombre del vendedor), con un árbitro neutral. Si la operación cierra, las acciones vuelven. Si quien reservó se arrepiente, el corredor reclama y **cobra en USDC**: el contrato vende las acciones necesarias. Nadie del lado del vendedor recibe acciones, y así cumplimos "nada de trading para usuarios de EE.UU.".

El corredor genera un **link de reserva** desde la propiedad (con login y sin transacción) y lo comparte por WhatsApp. Si la persona llega a la meta sin ese link, la app le arma el mensaje para pedírselo al corredor.

## 3. Reglas de producto (no negociables)

- **Cero fricción:** login con email (Privy), cuenta invisible, gas pago por el paymaster de Coinbase, sin modales de firma (`showWalletUIs: false`), y aprobación + acción en **una** llamada por lotes.
- **Una sola acción clara por pantalla**; los botones dicen qué hacen ("Sumar USD 20", no "Confirmar").
- **Mobile first.** Revisar en 375, 768 y 1280 px. La UI tiene que llamar la atención: es parte del puntaje.
- **Toda espera muestra progreso:** barra, paso actual y "suele tardar N s". Nunca un spinner solo.
- **La comisión siempre visible** (en cada aporte y en la reserva). Nunca "gratis" ni "sin comisión".
- **Landing tipo "vendeme esta pluma":** primero la necesidad, después el producto. Nunca abrir con features.
- **Copy** en español rioplatense (voseo), corto y sin "—". **Sin jerga cripto** en la app (nada de wallet, gas, token, on-chain, firmar, stablecoin): "tu cuenta", "dólares digitales", "pesos digitales", "acciones". **Sin marcas de terceros** en la app ni en la landing (ni Coinbase, Base, Privy, Ripio, Chainlink ni KyberSwap). Smarlin es nuestra y sí se nombra. Los nombres de las empresas de las acciones (Apple, Nvidia…) sí van. Las marcas de terceros solo aparecen en `/pitch`, el README y los docs para devs.
- i18n: `es` (default) y `en` (para los jueces).
- **Nada hardcodeado:** acciones, feeds, rutas de swap, router, ratios y precios se descubren de fuentes vivas. Los parámetros de producto (% de seña default, ventanas, fees) viven en un solo lugar de configuración, documentados.
- **Sin variables de entorno al pedo.** La app usa **una sola**: `NEXT_PUBLIC_PRIVY_APP_ID`. Las direcciones, la chain activa, el builder code y la tesorería salen de `src/config/deployment.json`, que genera el script de deploy y se commitea. El paymaster y el tipo de smart wallet se configuran en el dashboard de Privy, no en env. El script de deploy a redes públicas lee `DEPLOYER_PRIVATE_KEY`. Las URLs públicas (Smarlin, RPC) tienen default y override opcional.
- **Demo segura:** todo camino frágil tiene un respaldo controlado con la misma UX. Si el link no se puede leer, se pide el precio a mano y Smarlin queda como alternativa. Si falla el agregador, error claro y reintento.
- Código en inglés; textos visibles en castellano.

## 4. Redes y activos

| | Local (31337) | Base Sepolia (84532), demo | Base (8453), real |
|---|---|---|---|
| Acciones | `MockStockToken` espejo de las reales | ídem | B20 reales (Tokenized Stocks API) |
| Precios | `MockPriceFeed` sembrado con el `nav_price` real | ídem + script de sincronización | Chainlink (directorio) |
| USDC | `MockUSDC` con faucet | `MockUSDC` con faucet (botón "Cargar saldo de prueba") | USDC nativo |
| wARS | `MockWARS` con faucet, precio sembrado desde Chainlink USD/ARS de Base | ídem | wARS `0x0DC4…D90D` (verificado: symbol `wARS`), descubierto desde la fuente de Lapacho/Ripio |
| Conversión | `DemoExchange` (compra y venta al precio del feed, con comisión) | ídem | Agregador KyberSwap (sin key; ruta wARS→AAPLc verificada el 14 nov) con fee a tesorería |
| Cuenta | Cuentas de anvil, modo dev sin Privy | Privy smart wallet + paymaster | ídem |

En testnet no hay acciones tokenizadas (la API de Coinbase solo lista la chain 8453 y AAPLc no tiene código en Sepolia): por eso los mocks.

## 5. Contratos (`contracts/src`)

- **`StockOracle`**: sin cambios de fondo.
- **`ReservationEscrow`** (evolución de `GuaranteeEscrow`, que se renombra): roles `depositor` / `beneficiary` / `arbiter`; campo `propertyRef` (`bytes32` = keccak del `ref` de la propiedad); mismo ciclo (crear, reforzar, retirar excedente, extender, reclamar, aceptar o disputar, resolver, liquidar y liberar). **La liquidación paga al beneficiario en USDC:** `settleClaim(id, router, swapData)` aprueba el monto exacto de la acción a un router de la lista blanca del owner, ejecuta `swapData`, verifica que lo recibido en USDC sea ≥ valor de oráculo × (1 − `maxSlippageBps` inmutable), paga el reclamo en USDC y devuelve el resto al depositante. Un router que no está en la lista blanca revierte. Comisión al crear (`feeBps`, tope 3%) a la tesorería. Contadores on-chain para las stats.
- **`GoalRegistry`**: una meta por cuenta. `setGoal(propertyRef, propertyKey, stock, targetUsd, propertyPriceUsd, beneficiary)` (el precio de la acción al inicio lo lee del oráculo, no del usuario; `beneficiary` puede ser cero), `clearGoal()`, `goalOf(account)`, eventos y contadores (`goalCount`, `activeGoals`).
- **Mocks (solo local y testnet):** `MockUSDC` (6 dec), `MockWARS` (18 dec), los dos con faucet con tope; `DemoExchange`: `buy(stock, payToken, amountIn, minOut, recipient)` y `sell(stock, amountIn, minOut, recipient)` al precio del feed con comisión a tesorería. Es minter de los mocks y sirve como router de la lista blanca en testnet.
- Tests Foundry de todo el ciclo, incluidos el slippage, el router fuera de la lista blanca y el precio viejo.

## 6. Servidor y API (`src/server`, `src/app/api`)

- **Proveedores de propiedades** (interfaz común, DTOs en `src/domain/property.ts`):
  - `smarlin`: endpoints públicos `GET /api/properties`, `GET /api/properties/{id}` y los de datos (`/api/properties/fair-price`, `/api/mercado/str`, `/api/properties/renta-mercado`, `/api/properties/{id}/comparables`), validados con zod. **Lista blanca de campos:** nunca reenviar `embedding`, email ni teléfono del agente. Caché con `"use cache"` + `cacheLife`.
  - `link`: lee **solo** la página que pegó la persona: JSON-LD schema.org (Offer/price) y luego Open Graph. Guardas anti-SSRF (solo https, hosts públicos, límite de tamaño y de tiempo, sin redirecciones a IPs privadas). Si no hay precio, devuelve `priceUsd: null` y la UI lo pide a mano. Precios en ARS → USD con la cotización.
- **Cotización ARS:** Chainlink USD/ARS de Base, descubierto del directorio de feeds.
- Rutas: `GET /api/properties?q=&type=&limit=&offset=`, `GET /api/properties/[ref]`, `POST /api/link-preview`, `GET /api/rates`, más las de acciones, protocolo y stats que ya existen (adaptadas a los contratos nuevos).
- **Planificadores** (devuelven `calls[]` listas para mandar en lote, nunca firman): meta (`setGoal`), aporte (approve + `DemoExchange.buy` o approve + router del agregador, según la chain) y reserva (approve + `createReservation`).

## 7. Cliente

- `src/lib/wallet`: una interfaz `sendCalls(calls) → hash` con dos implementaciones. **Privy smart wallet** (email, sponsoreada, en lote, sin UI) y **dev** (cuentas de anvil, solo chain 31337, para probar de punta a punta sin Privy). Builder Code (ERC-8021) en todas las escrituras, con el método correcto para smart accounts.
- Pantallas (`src/app/[lang]/…`): landing, `casa` (buscar y pegar link), `casa/[ref]` (detalle + "Esta es mi meta"), `meta` (progreso + "Sumar"), `sumar`, `cargar` (dirección + QR + copiar; en testnet "Cargar saldo de prueba"), `reservar`, `r/[id]` (página pública de la reserva con acciones según el rol), `pedir` (el corredor genera el link), `unavailable`, `pitch`.
- `src/proxy.ts`: redirect de idioma y, **solo en mainnet**, bloqueo de EE.UU. y sus territorios (incluido PR) por el header de país de la plataforma.

## 8. Fuera de alcance en v1

Aporte automático en cada cobro (necesita permisos de sesión), varias metas o varias acciones por meta, garantía de alquiler en la UI (el contrato la soporta igual), ramp fiat dentro de la app (se enlaza al servicio externo), cambios en Smarlin.

## 9. Ejecución (subagentes con dueño de archivos)

| Rol | Es dueño de |
|---|---|
| **CTO / contratos y deploy** | `contracts/**`, `scripts/**`, `deployments/**`, `src/contracts/**`, `src/config/deployment.*`, `foundry.toml`, `package.json` (solo `scripts`) |
| **Datos / backend** | `src/server/clients/{smarlin,link-preview,rates}.ts`, `src/server/services/{properties,rates}.ts`, `src/app/api/{properties,link-preview,rates}/**`, `src/domain/{property,rates}.ts` |
| **Diseño / frontend** | `src/app/[lang]/**`, `src/app/{layout.tsx,page.tsx,globals.css}`, `src/components/**`, `src/i18n/**`, `src/proxy.ts` (solo idioma), `public/**` |
| **Producto / narrativa** | `docs/NARRATIVE.md`, `README.md`, `HANDOFF.md` |
| **Integración** (fase 2) | `src/lib/**`, `src/hooks/**`, planificadores, cableado, geo-bloqueo, e2e |

Nadie instala dependencias ni toca archivos de otro rol; los commits los hace el coordinador.

## 10. Lo que solo pueden hacer Fernando y Kelvin

1. Crear la app de Privy (email, smart wallets tipo Coinbase Smart Wallet, paymaster de CDP para Base y Base Sepolia, `showWalletUIs` apagado) y pasar el `NEXT_PUBLIC_PRIVY_APP_ID`.
2. ETH de Base Sepolia para el deployer (faucet de CDP) y, para mainnet, unos centavos de ETH en Base.
3. Builder Code desde dashboard.base.org.
4. Tesorería y árbitro de mainnet (idealmente multisig).
5. Kelvin: % de seña habitual en PR y si acepta figurar como corredor de la demo.
