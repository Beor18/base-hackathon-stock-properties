# Seña: la narrativa

> **Seña: tu próxima casa, en acciones.**
> Ahorrá en acciones con una casa como meta. Cuando llegás, tus acciones quedan como seña, sin venderlas.

> **Actualizado el 14 nov 2026** con `docs/research/2026-11-14-mercado-y-competencia.md` (mercado, competencia y lo que es oficial del hackathon) y `docs/LEAN.md` (hipótesis, métricas y experimentos). Si un número de acá no coincide con el research, vale el research.

Este documento es la historia de la startup de 0 a 1: problema, solución, por qué ahora, mercado, competencia, diferenciador, modelo de negocio, plan, equipo y ask. La fuente de verdad del producto es `docs/superpowers/specs/2026-11-14-sena-design.md`. Las cifras tienen fuente (ver `HANDOFF.md`, Apéndices B y B2). Lo que es supuesto o decisión pendiente de los fundadores está marcado con **[decidir]**, **[confirmar]** o **[completar]**.

---

## 0. De dónde venimos

Somos el equipo que construyó **Smarlin**, una plataforma de IA de bienes raíces que ya funciona en Puerto Rico: búsqueda de propiedades por estilo de vida, análisis de precio justo y riesgo, y datos de mercado a partir de cierres reales. Hoy tiene **11.925 propiedades publicadas**, **120.002 ventas cerradas analizadas** y cobertura de los **78 municipios** (cifras de su propia API, 14 nov 2026). Kelvin vende propiedades allá. Fernando construye el producto desde Buenos Aires.

**Seña se apoya en esa base.** La portada del producto son propiedades reales de Puerto Rico, sacadas de Smarlin por API, con datos que nadie más tiene: precio justo, renta de corto plazo, renta de mercado y comparables.

Antes habíamos construido una garantía de alquiler con acciones (Garante). El contrato de custodia, el oráculo y el cobro en caso de reclamo quedaron. Lo que cambió es la historia: la garantía de un alquiler es un trámite que se hace una vez. **Ahorrar para una casa es algo que se hace todos los meses durante años.** Eso es uso real, repetido, y es lo que mide el hackathon.

## 1. El problema

**En Argentina, una casa se paga en dólares y al contado. Se ahorra durante años y esa plata queda quieta.**

Un caso ilustrativo (persona ficticia): Sofi tiene 31 años, trabaja remoto y vive en Córdoba. Quiere comprar un 2 ambientes de USD 100.000. Ahorra USD 300 por mes. Los guarda en billetes, o en una cuenta que no rinde. Tarda años. Mientras tanto el precio de lo que quiere comprar se mueve y su plata no se mueve con nada.

Los números detrás del caso:

- **Casi nadie compra con crédito.** En CABA, en agosto de 2026 se firmaron **6.055 escrituras de compraventa y 1.059 con hipoteca**: el **17,5%** (cálculo propio sobre los datos del Colegio de Escribanos). En los primeros siete meses del año fue el 14,4%. El resto, casi **5.000 escrituras por mes** en la Ciudad, se paga con ahorro previo. Fuente: [Colegio de Escribanos, agosto 2026](https://www.colegio-escribanos.org.ar/2026/09/22/cantidad-de-escrituras-de-compraventa-realizadas-en-agosto-2026/). Solo CABA: **[completar]** dato nacional.
- **La plata está fuera del sistema.** El INDEC estima que el sector privado tenía **USD 254.898 millones** en moneda y cuentas fuera del sistema bancario nacional al cierre de 2025 (48,5% de los activos financieros del país según el mismo informe). Fuente: [BAE Negocios sobre INDEC, 28 mar 2026](https://www.baenegocios.com/amp/el-indec-estimo-que-los-argentinos-guardaron-usd-254-898-millones-fuera-del-sistema-bancario/). La cifra mezcla billetes y depósitos en el exterior: no es solo colchón.
- **Ahorrar lleva años.** Con USD 1.000 por mes (supuesto de una pareja), Propio estima entre **3 y 6,5 años** para comprar una propiedad en Buenos Aires, según tipo de unidad y barrio. Con USD 500 por mes, más de 6 años para el monoambiente usado más barato que relevó (USD 37.000). Sin gastos de la operación. Fuente: [Propio vía Mercado, 21 ago 2026](https://mercado.com.ar/ladrillos-y-proyectos/propio-estimo-los-anos-de-ahorro-necesarios-para-comprar-un-departamento-en-buenos-aires). Medido en sueldos, las estimaciones van de unos 5 años (2 ambientes de 40 m² en zona accesible) a 20 o 25 años (departamento de 50 m²); las metodologías difieren.
- **La inflación se come lo que dejás en pesos:** 33,1% interanual (INDEC, 12 nov 2026), unos 25% de valor real perdido en 12 meses. Fuente: [INDEC](https://www.indec.gob.ar/uploads/informesdeprensa/ipc_11_269335F5BA6B.pdf).

**El problema de fondo:** el ahorro para una casa es largo, quieto y sin meta visible. Y cuando por fin aparece la casa, hay que tener la seña en efectivo ya, aunque eso signifique vender lo que se había invertido.

### La seña es el momento que traba

Cuando el comprador encuentra la casa, tiene que reservarla. El monto y el momento varían: algunas guías hablan de una seña acotada de entre USD 1.000 y USD 5.000, otras de 5% a 10% del precio, y en el boleto la entrega a cuenta ronda el **30%** ([Mudafy](https://mudafy.com.ar/guias/post/como-comprar-un-departamento)). Son guías comerciales, no norma. **[confirmar con escribano y con Kelvin]** el porcentaje habitual de seña o reserva, en Argentina y en Puerto Rico. Si el comprador se arrepiente, pierde la seña.

Quien tiene su ahorro invertido tiene que venderlo para reservar. Vende de golpe, a veces en mal momento, y paga la salida.

## 2. La solución

**Seña es una cuenta para ahorrar en acciones con una casa concreta como meta. Cuando llegás, las acciones quedan como reserva de la propiedad, sin venderlas.**

Tres pasos:

1. **Elegí la casa.** Propiedades reales de Puerto Rico (Smarlin) o cualquier propiedad de un portal argentino pegando el link. La app calcula la seña: `precio × % de seña` (5% por defecto, ajustable de 1% a 10%).
2. **Sumá.** Con dólares digitales (USDC) o pesos digitales (wARS). Se convierten en la acción que elegiste para tu meta. La pantalla muestra cuánto llevás frente a cuánto necesitás y, desde que empezaste, "la casa +x %, tus acciones +y %".
3. **Reservá.** Cuando llegás, un toque bloquea las acciones en un contrato de custodia a favor del corredor, con un árbitro neutral. Si la operación cierra, las acciones vuelven. Si quien reservó se arrepiente, el corredor reclama y **cobra en USDC**: el contrato vende las acciones necesarias.

Nadie del lado del vendedor recibe acciones. Eso es a propósito: cumple la regla de no habilitar trading a usuarios de EE.UU.

El corredor genera un **link de reserva** desde la propiedad (con login, sin transacción) y lo comparte por WhatsApp. Si la persona llega a la meta sin ese link, la app le arma el mensaje para pedírselo.

### Cero fricción

Login con email, cuenta invisible, gas pago, una sola llamada para aprobar y actuar. En la app no hay wallets, firmas ni vocabulario cripto: "tu cuenta", "dólares digitales", "acciones".

### Qué pasa si el comprador se arrepiente

- El corredor presenta un reclamo por un monto en dólares.
- El comprador puede aceptarlo o disputarlo dentro de una ventana fija.
- Si lo disputa, decide un **árbitro neutral** acordado de antemano.
- El contrato vende las acciones necesarias, verifica que lo recibido en USDC no se aparte del precio del oráculo más que un tope fijo (slippage máximo inmutable), paga al corredor y **devuelve el resto al comprador**.

### El mismo ahorro, tres formas de llegar a la seña (ejemplo ilustrativo)

Casa de USD 100.000, seña de 5% (USD 5.000), ahorro de USD 300 por mes (unos 17 meses).

| | Billetes | Pesos en un plazo fijo | **Seña** |
|---|---|---|---|
| Qué hace tu plata mientras ahorrás | Nada | Pierde valor real contra el dólar si el peso se devalúa **[confirmar con datos]** | Sigue el mercado de las acciones que elegiste |
| Meta visible | No | No | Sí: casa, monto y progreso |
| Al llegar, para reservar | Entregás los billetes | Cambiás a dólares | Bloqueás las acciones, sin venderlas |
| Si te arrepentís | Perdés la seña | Perdés la seña | El corredor cobra la seña en USDC desde tus acciones; lo que sobra vuelve a vos |
| Riesgo | Robo, inflación en dólares | Devaluación | Las acciones también bajan. Por eso la seña es un porcentaje, no el precio entero |

Las acciones pueden bajar. Lo decimos en la landing y en el contrato: el contrato se protege con un colchón de colateral por acción según su volatilidad histórica.

## 3. Por qué ahora

Hasta 2026 esto no se podía construir. Cuatro cosas cambiaron:

1. **Las acciones ya son programables.** El 24 de agosto de 2026 Coinbase lanzó acciones tokenizadas nativas en Base (estándar B20), respaldadas 1:1, con precio de Chainlink y sin lista blanca de wallets. Desde septiembre de 2026, Morpho y Aave ya las aceptan como garantía de préstamos en Base. Lo que nadie hace todavía es bloquearlas a favor de un tercero como seña de una propiedad.
2. **El mercado crece rápido.** Las acciones tokenizadas pasaron de USD 2.480M a **USD 3.770M** en menos de tres meses. Fuente: [rwa.xyz](https://app.rwa.xyz/stocks).
3. **El crédito no llega.** Con 14,4% a 17,5% de las escrituras porteñas con hipoteca, el ahorro propio sigue siendo la forma de comprar.
4. **La gente ya invierte.** En Argentina hay **12,3 millones de personas con cuenta comitente** (55% de la población activa) y **más de 1 millón tiene CEDEARs**: acciones de EE.UU. que hoy no sirven para nada a la hora de reservar una casa. Fuente: [iProfesional/BYMA, may 2026](https://www.iprofesional.com/finanzas/460259-la-mitad-de-los-argentinos-que-trabajan-ya-tiene-una-cuenta-para-invertir). Además el Gobierno pidió públicamente instrumentos en dólares para atraer lo que está fuera del sistema (nota de iProfesional, 2026).

## 4. Dónde lanzamos, y por qué el uso real empieza en Argentina aunque la portada sea Puerto Rico

Hay una restricción que no depende de nosotros:

- Las acciones tokenizadas de Coinbase solo están disponibles para **personas fuera de Estados Unidos**. A efectos regulatorios, un residente de Puerto Rico cuenta como persona de EE.UU. **[confirmar con asesor legal]**
- Las reglas del hackathon excluyen los proyectos que habiliten trading a usuarios de EE.UU.

Por eso la estrategia separa dos cosas:

| | Qué es | Qué hacemos |
|---|---|---|
| **Portada y demo: Puerto Rico** | Propiedades reales de Smarlin, corredor real (Kelvin). La historia es "guardá tus dólares en una propiedad en territorio de EE.UU." | Flujo completo sobre publicaciones de Smarlin. Quien ahorra es una persona fuera de EE.UU. (Fernando, desde Argentina, es el primer caso). El corredor cobra en USDC, nunca recibe acciones |
| **Uso real: Argentina** | El que ahorra para comprar una casa en Argentina tiene el problema todos los meses y es usuario elegible **[confirmar elegibilidad por país]** | Cualquier persona entra pegando el link de un portal argentino y empieza con USD 5. De acá sale la tracción on-chain que pesa en el puntaje |
| **Residentes de Puerto Rico** | El mercado grande de Smarlin, hoy no habilitado | La app los bloquea en mainnet. Queda listo para el día que las acciones tokenizadas se abran a EE.UU. |

**Puerto Rico y compradores extranjeros.** No encontramos datos específicos de Puerto Rico sobre compradores no estadounidenses. El dato nacional de NAR dice que el 47% de los compradores internacionales pagó al contado, contra 28% del total ([RISMedia, jul 2025](https://www.rismedia.com/2025/07/15/foreign-buyers-up-pre-tariffs-future-uncertain/)). Es un dato de EE.UU. entero, no de la isla. **[completar con Kelvin y Smarlin]:** cuántos de sus compradores son de fuera de EE.UU., de qué países y cuántos pagan al contado.

Esta sección es la respuesta a la pregunta de cualquier jurado: "si la portada es Puerto Rico, ¿por qué el uso es en Argentina?". Porque ahí está la gente que ahorra para una casa en dólares, y porque la reserva se cobra en USDC y el producto igual sirve a quien quiere una propiedad en la isla.

## 5. Mercado

**A quién le hablamos primero:** argentinos que ahorran en dólares para comprar una propiedad, que ya usan una cuenta de inversión o cripto, o cobran en dólares (trabajo remoto). Del otro lado, corredores e inmobiliarias que cobran seña.

| Nivel | Qué es | Tamaño |
|---|---|---|
| **TAM** | Dólares del sector privado argentino fuera del sistema bancario | **USD 254.898M** (INDEC, cierre 2025). No todo es para vivienda: es el techo |
| **Flujo anual de compras** | Escrituras sin crédito en CABA | ~**5.000 por mes** (6.055 compraventas, 1.059 con hipoteca, ago 2026). **[completar]** monto promedio de la operación |
| **SAM** | Argentinos que ya tienen acciones o CEDEARs | **Más de 1 millón** con CEDEARs; 12,3M con cuenta comitente. **[completar]** qué parte quiere comprar casa en los próximos 3 años |
| **SOM (12 meses)** | Lo alcanzable con el equipo actual | **[decidir meta]**: metas activas, USD en acciones, reservas. Hipótesis de partida: 500 metas activas y 20 reservas reales |

**Puerto Rico, con datos propios de Smarlin:** 11.925 propiedades publicadas y 120.002 ventas cerradas analizadas. Es un dato que casi ningún otro equipo puede mostrar: sale de cierres reales, no de estimaciones. **[completar]:** monto típico de opción, % de seña habitual, días hasta el cierre y cuántas operaciones involucran a compradores de fuera de EE.UU.

Advertencias que hay que decir antes de que las pregunte un jurado:

- **La oferta de colateral todavía es chica:** hay unos USD 47,5M de acciones de Coinbase emitidas. Crecemos con ese mercado, no por delante.
- **El tamaño del TAM es el techo, no el pronóstico.** La cifra incluye cuentas en el exterior y billetes sin destino definido.
- **Los datos de escrituras son de CABA**, no del país.

## 6. Competencia

| Alternativa | Qué hace | Por qué no resuelve el problema |
|---|---|---|
| Dólares en billete o en cuenta | Guardar y esperar | Plata quieta, sin meta, sin forma de usarla como reserva sin cambiarla |
| Plazo fijo en pesos, fondos comunes | Rinden algo | Pesos contra una casa en dólares; sin meta ni reserva |
| Brokers y apps de inversión con CEDEARs o acciones tokenizadas | Dejan comprar acciones | Ni meta de propiedad ni reserva: para reservar hay que vender |
| Crédito hipotecario (UVA) | Financia hasta una parte | Llega a pocos: 14% a 18% de las escrituras en CABA |
| Planes de ahorro y fideicomisos de obra | Ahorro con una unidad futura | Atados a un proyecto y sin liquidez **[completar con ejemplos]** |
| Plataformas de propiedades tokenizadas | Venden fracciones de inmuebles | Invierten en el inmueble; no sirven para reservar una casa que elegís vos |
| Préstamos con acciones de colateral (Aave, Morpho) | Crédito contra acciones | Es deuda, no seña |
| Hipoteca con cripto en prenda (Better y Coinbase, EE.UU., desde el 26 ago 2026) | Segundo préstamo para el anticipo, garantizado con bitcoin o USDC sin venderlos. Planean sumar acciones tokenizadas | Es la más cercana. Es deuda, es para el anticipo al escriturar y no para la seña, y solo en EE.UU. |
| Hipotecas con cartera en prenda (Morgan Stanley, Merrill) | Prendás tu cartera en vez de poner el anticipo en efectivo | Solo para carteras grandes en ese banco. Es deuda |

El research previo (para la garantía de alquiler) no encontró ningún producto que use acciones tokenizadas como garantía, ni entre unos 40 repositorios públicos del hackathon. **[confirmar]** con una búsqueda nueva específica de "ahorro para propiedad con acciones" antes del Loom.

## 7. Diferenciador

**Seña es la única forma de ahorrar para una casa en la que tu plata sigue siendo tuya, sigue invertida y se convierte en la seña sin venderla.**

Cuatro cosas lo sostienen:

1. **Lo construye un equipo que ya opera en real estate.** Smarlin es nuestro producto y está en producción; Kelvin cierra operaciones allá. El producto habla el idioma del negocio (seña, reserva, corredor, árbitro). Las propiedades de la portada son reales, no un catálogo de muestra.
2. **Datos que nadie más tiene.** Cada casa de Puerto Rico viene con precio justo, renta de corto plazo, renta de mercado y comparables, a partir de cierres reales.
3. **Cualquiera lo usa mañana, con USD 5.** Pegás el link de un portal argentino y tenés una meta. Cada aporte es uso real on-chain.
4. **La reserva es una acción programada que no encontramos en otro lado.** Aave y Morpho prestan contra las acciones, pero eso es deuda con interés. Bloquear, soltar o vender para cobrar en USDC según lo que pase con la operación. Es lo que pide el track Programmable Stock Markets.

**Por qué es difícil de copiar:** la tecnología se puede clonar. La red de corredores que aceptan la reserva y los datos de Smarlin, no. Cada corredor que la adopta la vuelve aceptable para todos sus compradores.

## 8. Modelo de negocio

**Dos comisiones, siempre visibles:**

1. **Comisión en cada aporte.** Se cobra al convertir los dólares o pesos digitales en acciones y va a la tesorería. **[decidir %]**.
2. **Comisión al reservar.** Sobre el monto bloqueado, al crear la reserva. En el contrato es `feeBps` con tope de 3%. **[decidir %]**.

Las dos se muestran en pantalla antes de confirmar. Ilustración con números supuestos **[decidir]**: aportar USD 20 con comisión de 1% son USD 0,20. Reservar USD 5.000 con comisión de 1% son USD 50.

Hay que decirlo sin maquillaje: **el ingreso por persona es chico al principio.** Crece por cuatro vías **[decidir prioridad]**:

1. **Plan para corredores e inmobiliarias sobre Smarlin:** panel, links de reserva, API y datos de mercado por un abono mensual.
2. **Tickets más grandes:** seña de propiedades más caras, boleto con entrega a cuenta de 30%, y alquiler temporario.
3. **Otros portales:** la entrada por link ya sirve para cualquier portal; la integración directa lo vuelve un botón "ahorrá para esta casa" en cada publicación.
4. **Servicios sobre el colateral:** por ejemplo, crédito contra las acciones bloqueadas, y la garantía de alquiler (el contrato ya la soporta).

## 9. De 0 a 1

| Etapa | Cuándo | Objetivo | Cómo se mide |
|---|---|---|---|
| **0. Terminar el producto** | Hasta ~20 nov | Flujo completo andando en testnet, con propiedades reales de Smarlin; registro en el hackathon; Builder Code | Demo recorrible de punta a punta: casa, sumar, reservar, reclamar |
| **1. Primeros aportes reales** | 20 nov a 5 dic | Mainnet con topes de monto; metas reales con gente conocida; al menos una reserva real con un corredor; entrega | Metas activas, cuentas únicas, aportes, USD en acciones, reservas (contadores on-chain) |
| **2. Probar que el corredor la acepta** | Meses 1 a 3 | 100 metas; 5 corredores o inmobiliarias; dictamen legal en Argentina y en Puerto Rico; auditoría del contrato | Aceptación de corredores; % de metas que llegan a reservar |
| **3. Repetible** | Meses 3 a 12 | 1.000 metas; plan para corredores; integración con otros portales; activación en Puerto Rico si la regulación lo permite | Costo de adquisición por meta; ingreso por aporte y por reserva; tasa de arrepentimiento |

**La hipótesis más riesgosa** no es técnica: es que un corredor o vendedor acepte acciones bloqueadas como seña. La etapa 1 existe para probar eso con casos reales antes de gastar en crecer.

## 10. Riesgos y cómo se responden

| Riesgo | Respuesta |
|---|---|
| La acción cae y la reserva queda corta | Colchón de colateral por acción según su volatilidad; se puede reforzar; el corredor ve la salud en vivo |
| El corredor no confía | Página pública de la reserva; árbitro acordado; reclamo cobrable en USDC sin juicio |
| La venta en la liquidación sale mal | El contrato verifica un slippage máximo inmutable y solo usa routers de una lista blanca del owner |
| Regulación | Es custodia de una reserva, no un préstamo ni una oferta de valores; hace falta dictamen legal local antes de escalar **[confirmar]** |
| Elegibilidad | Las acciones de Coinbase son solo para no residentes de EE.UU. y no hay lista pública de países. La app bloquea EE.UU. y territorios (incluido Puerto Rico) en mainnet |
| Poder del emisor | El emisor puede pausar o incautar tokens; es un supuesto de confianza documentado |
| Un solo emisor | El oráculo admite cualquier acción tokenizada con feed de precio |
| Datos viejos del feed | Dos cotas de frescura: una laxa para entrar colateral y una estricta para sacar valor |

## 11. Equipo

- **Kelvin Garcia Vale: real estate y producto.** Vende propiedades en Puerto Rico (Kelvin Garcia Realty) y es la voz del negocio: sabe cómo se reservan y cierran las operaciones. Sus publicaciones son las primeras de la portada. **[completar: licencia, años en el rubro, operaciones cerradas; confirmar cómo quiere figurar; confirmar el % de seña habitual en PR y si acepta figurar como corredor de la demo]**
- **Fernando Lopez: ingeniería.** Full-stack (Node, React, Next.js, Elixir, Python) y builder web3 (Tuneport, Elei Protocol). Vive en Buenos Aires, donde el problema de ahorrar para una casa se sufre todos los días y donde el producto puede operar hoy.

**Ya construimos juntos un producto que funciona:** Smarlin, en producción en Puerto Rico, con 11.925 propiedades publicadas y 120.002 ventas cerradas analizadas. **[completar: usuarios y corredores activos]**

**Por qué este equipo:** ya llevó un producto inmobiliario a producción, tiene a alguien que cierra operaciones reales y a alguien que construye on-chain, y está parado en los dos mercados que el plan necesita.

## 12. El ask

**Al hackathon:** el premio del track Programmable Stock Markets (pool de USD 20.000). Uso propuesto **[decidir]**: auditoría del contrato, dictamen legal en Argentina y Puerto Rico, y primeras reservas reales con corredores.

**A Base y Coinbase:**
- Claridad sobre los países elegibles para las acciones tokenizadas y el camino para Puerto Rico y EE.UU.
- Que el contrato de custodia quede exento de incautación a nivel de política del token.
- Difusión del caso de uso: "lo próximo que pueden hacer las acciones" con un usuario que no es trader.

**A los partners (Bankr):** mentoría, apoyo de incorporación y primeras presentaciones.

**A corredores e inmobiliarias:** 3 pilotos que acepten una reserva con acciones en una operación real.

**A inversores (después de la etapa 2) [decidir monto]:** una ronda pre-seed para 18 meses, destinada a auditoría y legales, dos contrataciones (corredores e ingeniería) y la integración con otros portales.

---

## Textos listos para la entrega (en inglés)

**Tagline**

> Seña: your next home, in stocks.

**One-liner**

> Seña lets people outside the US save in tokenized stocks on Base toward a specific property, and lock those stocks as the reservation deposit when they get there, without selling them. If the buyer backs out, the broker is paid in USDC. Listings come live from Smarlin, our property platform in Puerto Rico, or from any Argentine portal by pasting a link.

**Form: project description (1 to 2 sentences)**

> Seña is a savings account in tokenized stocks with a specific property as the goal. Add USDC or digital pesos, pick a home from Smarlin or paste any portal link, and when you reach the deposit your stocks are locked in an onchain escrow as the reservation, never sold. If the buyer backs out, the contract sells just enough stock to pay the broker in USDC.

**Form: "Why should we select you?"**

> In Argentina, homes are bought in dollars and in cash: in Buenos Aires, 17.5% of August 2026 deeds used a mortgage, so the rest came from years of saved dollars sitting idle (INDEC puts USD 254.9B of private dollars outside the banking system). Meanwhile over a million Argentines already hold US stocks that are useless the day they must reserve a home. Seña turns that saving into a goal and the goal into a deposit, without selling. Every contribution is onchain usage, from USD 5, and the final reservation is a programmed stock action that does not exist anywhere else: lock, release, or sell to pay a broker in USDC with a slippage cap enforced by the contract. We are the team behind Smarlin, a live AI property platform in Puerto Rico with 11,925 active listings and 120,002 closed sales analyzed. One of us sells properties there; the other builds onchain from Buenos Aires, where the product can be used today. US persons are blocked on mainnet and no US person ever receives stocks.

**Loom, 3 minutos**

| Tiempo | Qué se muestra | Qué se dice |
|---|---|---|
| 0:00 a 0:20 | Una cuenta con dólares quietos y un portal con una casa | "In Argentina you buy a home with dollars you saved for years. That money sits still. And when you find the home, you must sell what you invested to reserve it." |
| 0:20 a 0:40 | Landing con el 1-2-3 | "Seña: your next home, in stocks. Three steps." |
| 0:40 a 1:10 | Elegir una casa de Puerto Rico en Smarlin (datos de precio justo y renta) y pegar un link de un portal argentino | "Pick a listing from Smarlin, or paste any link. We compute the deposit." |
| 1:10 a 1:50 | Sumar con USDC y con pesos digitales; pantalla de meta con "la casa +x %, tus acciones +y %" | "Add dollars or pesos. They become the stock you chose. Fee always visible. Every step is onchain." |
| 1:50 a 2:30 | Reservar: link del corredor, un toque, página pública de la reserva; luego reclamo y cobro en USDC | "You reached the goal. One tap locks your stocks as the deposit. If you back out, the broker claims and is paid in USDC, with a slippage cap enforced onchain. If the deal closes, your stocks come home." |
| 2:30 a 3:00 | Stats on-chain y roadmap | "Built during Stocks Maxxing. Next: first brokers, a plan for agencies on Smarlin, other portals." |

**Post de lanzamiento en X**

> In Argentina you buy a home with dollars you saved for years. That money sits still.
>
> We built Seña: save in tokenized stocks toward the home you want. When you get there, your stocks become the deposit. You never sell them.
>
> Seña: your next home, in stocks. @buildonbase
