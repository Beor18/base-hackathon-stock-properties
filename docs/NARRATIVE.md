# Garante — la narrativa

> **Tus acciones son tu garante.**
> Alquilá sin garante propietario y sin regalar plata en un seguro de caución: bloqueá acciones tokenizadas como garantía, seguí siendo su dueño y recuperalas cuando te mudás.

Este documento es la historia de la startup de 0 a 1: problema, solución, por qué ahora, mercado, competencia, diferenciador, modelo de negocio, plan, equipo y ask. Las cifras tienen fuente (ver `HANDOFF.md`, Apéndice B); lo que es supuesto o decisión pendiente de los fundadores está marcado con **[decidir]**, **[confirmar]** o **[completar]**.

---

## 0. De dónde venimos

Somos el equipo que construyó **Smarlin**, una plataforma de IA de bienes raíces que ya funciona en Puerto Rico: búsqueda de propiedades por estilo de vida, análisis de precio justo y riesgo por propiedad, y datos de mercado de los 78 municipios a partir de cierres reales. Kelvin vende propiedades allá; Fernando construye el producto.

Garante sale de lo que vemos en operaciones reales: **en cada alquiler y en cada compra hay un momento en que alguien tiene que inmovilizar efectivo para demostrar que va en serio.** Y cada vez más gente tiene su patrimonio en acciones, no en efectivo.

## 1. El problema

**Para alquilar en Latinoamérica no alcanza con poder pagar el alquiler: hay que demostrar que alguien responde por vos.**

Un caso ilustrativo (persona ficticia): Sofi tiene 27 años, trabaja remoto y se muda de Córdoba a Buenos Aires. Tiene USD 3.000 ahorrados en acciones. Para firmar le piden una de tres cosas:

1. **Un garante propietario**: un familiar con una propiedad en la ciudad que la ponga en juego. No lo tiene.
2. **Un seguro de caución**: cuesta entre **4% y 7% del valor total del contrato**, es decir 1 a 2 meses de alquiler, y **no vuelve nunca**.
3. **Más depósito en efectivo**: plata quieta en la cuenta del propietario, que con **33,1% de inflación interanual** pierde un **25% de su valor real en 12 meses** y un 44% en 24.

Sofi termina vendiendo sus acciones para pagar un seguro. Pasa de ser inversora a ser deudora de un trámite.

Los números detrás del caso:

- En Buenos Aires, entrar a un alquiler exige en promedio **4,2 meses de alquiler por adelantado** (depósito + mes adelantado + caución).
- **76,5%** de los inquilinos del AMBA encuestados tuvo problemas para cumplir las condiciones de ingreso (2023, 1.500 casos).
- El patrón se repite en la región: en Brasil el *seguro-fiança* cuesta 15–18% del contrato y la *caução* inmoviliza 3 meses; en México se pide aval con propiedad o una póliza jurídica; en Chile, mes de garantía más aval.

**El propietario tampoco gana.** Un garante se ejecuta en tribunales; un depósito cubre poco; un seguro agrega un tercero. Lo que quiere es simple: saber que, si algo sale mal, hay valor real y cobrable.

**El problema de fondo:** las garantías de alquiler de hoy destruyen valor. O es plata que el inquilino pierde (seguro), o es plata muerta (depósito), o es el patrimonio de un tercero (garante).

### La misma traba aparece al comprar

En una compraventa, el comprador entrega un **depósito de opción** que queda inmovilizado hasta el cierre. Quien tiene su patrimonio en acciones tiene que venderlas para reservar la propiedad, aunque el cierre sea en pocas semanas. Es el proceso que Kelvin maneja en Puerto Rico.

**[completar con datos de Kelvin y de Smarlin]:** monto típico de la opción, días hasta el cierre, quién custodia el depósito, cuántas operaciones se caen y por qué.

## 2. La solución

**Garante convierte las acciones del inquilino en la garantía del alquiler, sin venderlas.**

El inquilino bloquea acciones tokenizadas (Apple, Nvidia, Tesla y otras, emitidas por Coinbase en Base) en un contrato de custodia. Mientras dura el alquiler:

- **El inquilino sigue expuesto al mercado.** Si la acción sube, la ganancia es suya. Los dividendos se reflejan en el token.
- **El propietario tiene una garantía en dólares**, sobrecolateralizada, verificable en una página pública y cobrable on-chain.
- **Al terminar el contrato, las acciones vuelven solas** al inquilino.

### Tan simple como 1, 2, 3

| | Inquilino | Propietario |
|---|---|---|
| **1** | Acordá los términos (alquiler, meses de garantía, fecha de fin) | Creá tu link de solicitud (sin transacción, sin costo) |
| **2** | Elegí qué acción bloquear | El inquilino bloquea sus acciones |
| **3** | Bloqueá y compartí el comprobante | Verificá la garantía; reclamá solo si hace falta |

### Un mismo contrato, dos usos

| | Alquiler: garantía | Compra: depósito de opción **[decidir si entra en esta etapa]** |
|---|---|---|
| Quién bloquea acciones | Inquilino | Comprador |
| A favor de quién | Propietario | Vendedor |
| Árbitro natural | Administrador o inmobiliaria | Corredor de la operación |
| Duración | Meses o años | Semanas, hasta el cierre |
| Ticket | 1 a 3 meses de alquiler | Un porcentaje del precio de la propiedad |

El contrato ya construido cubre ambos: es una obligación en dólares, con beneficiario, fecha de fin, reclamo, disputa y árbitro. La compra tiene además dos ventajas: el plazo corto reduce el riesgo de precio y el ticket más alto mejora el ingreso por operación.

### Qué pasa si algo sale mal

- El propietario presenta un reclamo por un monto en dólares.
- El inquilino puede aceptarlo o disputarlo dentro de una ventana fija.
- Si lo disputa, decide un **árbitro neutral** acordado de antemano (el administrador, la inmobiliaria, el broker).
- El pago sale de las acciones al precio de mercado del oráculo; lo que sobra vuelve al inquilino.

### El mismo alquiler, tres formas de garantizarlo

Ejemplo con un 2 ambientes promedio en CABA: USD 574 por mes, contrato de 24 meses, garantía de 2 meses (USD 1.148).

| | Seguro de caución | Depósito en pesos | **Garante** |
|---|---|---|---|
| Costo de entrada | USD 689 (5% del contrato) | USD 1.148 | Acciones por ~USD 1.435 (125%) que ya tenés |
| ¿Vuelve? | **No** | Sí, a valor nominal | **Sí, las mismas acciones** |
| Qué pasa con esa plata en 24 meses | Se perdió | Pierde ~44% de valor real | Sigue invertida, con la suba o baja del mercado |
| Costo real para el inquilino | USD 689 | ~USD 500 de poder de compra | Fee único: USD 11 al 1% (tope on-chain 3% = USD 34) **[decidir]** |
| Requiere un tercero con propiedad | No | No | No |

Aritmética: caución = 24 × 574 × 5%. Pérdida del depósito = 1.148 × (1 − 1/1,331²). El 125% es ilustrativo: el ratio real se fija por acción según su riesgo.

## 3. Por qué ahora

Hasta 2026 esto no se podía construir. Cuatro cosas cambiaron:

1. **Las acciones ya son programables.** El 24 de agosto de 2026 Coinbase lanzó acciones tokenizadas nativas en Base (estándar B20), respaldadas 1:1, con precio de Chainlink y sin lista blanca de wallets. Por primera vez un contrato puede custodiar una acción real.
2. **El mercado está creciendo rápido.** Las acciones tokenizadas pasaron de USD 2.480M a **USD 3.770M** en menos de tres meses.
3. **La regulación de alquileres se abrió.** En Argentina, el DNU 70/2023 dejó librado al acuerdo entre partes el monto y la moneda de la garantía.
4. **La gente ya invierte.** En Argentina hay **12,3 millones de personas con cuenta comitente** (55% de la población activa) y **más de 1 millón tiene CEDEARs**: acciones de EE.UU. que hoy no sirven para nada a la hora de alquilar.

## 4. Dónde lanzamos, y por qué el uso real no empieza en Puerto Rico

Puerto Rico es el mercado que conocemos y donde ya tenemos producto y distribución. Pero hay una restricción que no depende de nosotros:

- Las acciones tokenizadas de Coinbase solo están disponibles para **personas fuera de Estados Unidos**. A efectos regulatorios, un residente de Puerto Rico cuenta como persona de EE.UU. **[confirmar con asesor legal]**
- Las reglas del hackathon excluyen los proyectos que habiliten trading a usuarios de EE.UU.

Por eso la estrategia separa dónde aprendemos y distribuimos de dónde se mueve valor real hoy:

| Mercado | Qué papel cumple | Qué hacemos ahora |
|---|---|---|
| **Puerto Rico** | Mercado propio: conocimiento del negocio, datos de cierres reales y distribución vía Smarlin | Integración en modo demostración sobre propiedades reales de Smarlin; pilotos en testnet con operaciones de Kelvin. Queda listo para activarse el día que las acciones tokenizadas se abran a EE.UU. |
| **Extranjeros que alquilan o compran en Puerto Rico** | Puente entre los dos mundos: propiedad en PR, comprador o inquilino elegible | Validar si el segmento existe y qué tamaño tiene **[completar con datos de Kelvin]** |
| **Latinoamérica, Argentina primero** | Donde el producto puede operar hoy con activos reales | Primeras garantías reales en mainnet: de acá sale la tracción on-chain que pesa en el puntaje |

Esta sección es la respuesta a la pregunta que va a hacer cualquier jurado: "si son de Puerto Rico, ¿por qué no lanzan ahí?".

## 5. Mercado

**A quién le hablamos primero:** inquilinos que ya ahorran en acciones o cripto y no tienen garante propietario — profesionales jóvenes del interior, trabajadores remotos que cobran en dólares, extranjeros no estadounidenses. Y del otro lado, propietarios e inmobiliarias que ya aceptan dólares o cripto.

| Nivel | Qué es | Tamaño |
|---|---|---|
| **TAM** | Hogares inquilinos en Argentina, Brasil, México, Colombia y Chile | **36,1 millones** de hogares; hasta USD 46.900M inmovilizados en depósitos (cota superior, con alquileres de capitales) |
| **Gasto a desplazar** | Lo que los inquilinos pagan hoy y no recuperan | Solo en Brasil: **R$ 2.000M por año** en primas de *seguro-fiança* (+19,7% en 2025), unos USD 353M |
| **SAM** | Inquilinos que ya tienen acciones | Argentina: ~210.000 hogares (1M de cuentas con CEDEARs × 21% que alquila) ≈ USD 241M de cobertura. Brasil: ~1,3M de hogares (5,7M de inversores de B3 × 23%) |
| **SOM (12 meses)** | Lo alcanzable con el equipo actual | 1.000 contratos en CABA ≈ USD 1,15M en custodia **[decidir meta]** |

**Puerto Rico [completar con datos propios de Smarlin]:** ventas cerradas por año, precio típico de cierre, alquileres activos y monto típico de opción y de depósito. Es un dato que casi ningún otro equipo puede mostrar: sale de cierres reales, no de estimaciones.

Dos advertencias que hay que decir antes de que las pregunte un jurado:

- **La oferta de colateral todavía es chica:** hay unos USD 47,5M de acciones de Coinbase emitidas. Crecemos con ese mercado, no por delante.
- **Colombia probablemente quede afuera:** la Ley 820/2003 prohíbe depósitos y cauciones reales en alquileres de vivienda.

## 6. Competencia

| Alternativa | Qué hace | Por qué no resuelve el problema |
|---|---|---|
| Garante propietario | Un familiar responde con su propiedad | La mayoría no tiene uno; se ejecuta en tribunales |
| Seguro de caución / *seguro-fiança* (Finaer, Hoggax, Porto, Loft/CredPago) | Un tercero garantiza a cambio de una prima | La prima se pierde; exige demostrar ingresos |
| Depósito en efectivo | Plata en manos del propietario | Plata muerta que la inflación licúa |
| Sustitutos de depósito de EE.UU. (Rhino+Jetty, TheGuarantors, Obligo) | Seguro o autorización de cobro | Fee hundido; dependen del sistema bancario y crediticio de EE.UU. |
| "Garantia Investe" de Loft, TD Garantia (Brasil) | Prenda de bonos del Tesoro como garantía | **El análogo más cercano y la validación del modelo**: solo bonos, solo Brasil, sin acciones |
| Escrows con stablecoins (RentLock, Trustless Work) | Depósito en USDC | Sigue siendo plata quieta, sin rendimiento |
| Aave / Morpho sobre acciones tokenizadas | Préstamos con acciones de colateral | Es crédito, no garantía de alquiler |

El research no encontró **ningún producto que use acciones tokenizadas como garantía de alquiler**, ni entre unos 40 repositorios públicos del hackathon (no se pudieron revisar los proyectos que solo publican en X).

## 7. Diferenciador

**Garante es la única garantía en la que la plata del inquilino sigue siendo suya y sigue invertida.** Todo lo demás es un costo hundido o capital muerto.

Tres cosas lo sostienen:

1. **Lo construye un equipo que ya opera en real estate.** Smarlin es nuestro producto y está en producción en Puerto Rico; Kelvin cierra operaciones allá. Garante habla el idioma del negocio (garantía, opción, contrato, reclamo, árbitro) porque sale de ahí, no de DeFi. El árbitro natural es quien ya administra la propiedad o corre la operación. Y la distribución ya existe: cada propiedad publicada en Smarlin puede mostrar "garantizá o reservá con X acciones" con una sola llamada a la API de cotización.
2. **Cero fricción para el propietario.** No firma transacciones ni paga gas para aceptar: comparte un link y verifica en una página pública. Solo necesita una wallet si algún día reclama.
3. **Diseñado para acciones reales, no para tokens genéricos.** El ratio de colateral se calcula por acción según su caída histórica; y el contrato distingue entre precio para *entrar* colateral y precio para *pagar*, porque los mercados cierran los fines de semana y los feeds se congelan.

**Por qué es difícil de copiar:** la tecnología se puede clonar; la red de propietarios, inmobiliarias y árbitros que aceptan la garantía, no. Cada inmobiliaria que la adopta la vuelve aceptable para todos sus inquilinos.

## 8. Modelo de negocio

**Hoy (en el contrato):** un fee único sobre el monto garantizado, cobrado al crear la garantía. El tope on-chain es 3%.

| | Seguro de caución | Garante al 1% | Garante al 3% |
|---|---|---|---|
| Costo para garantizar USD 1.148 | USD 689 | USD 11 | USD 34 |
| Como % de lo garantizado | 60% | 1% | 3% |

Hay que decirlo sin maquillaje: **el fee por contrato residencial es chico.** A 3%, 100.000 contratos son unos USD 3–4M. El alquiler residencial es la cuña de entrada, no todo el negocio. El ingreso crece por cuatro vías **[decidir prioridad]**:

1. **Compra integrada:** el inquilino que no tiene acciones las compra con dólares digitales dentro del flujo; comisión sobre ese swap.
2. **Plan para inmobiliarias y portales:** panel, API e integración por un abono mensual.
3. **Tickets más grandes:** alquileres comerciales (garantías de 3 a 6 meses), alquiler temporario, y **señas y reservas de compra de propiedades**, donde el monto es un porcentaje del valor del inmueble.
4. **Servicios sobre el colateral:** por ejemplo, crédito contra las acciones bloqueadas.

La primitiva que queda construida es más general que el alquiler: **cualquier obligación en dólares garantizada con acciones.**

## 9. De 0 a 1

| Etapa | Cuándo | Objetivo | Cómo se mide |
|---|---|---|---|
| **0. Terminar el producto** | Hasta ~20 nov | Flujo completo andando; demo pública en testnet **integrada a propiedades reales de Smarlin**; registro en el hackathon; Builder Code | Demo recorrible de punta a punta desde una publicación de Smarlin |
| **1. Primeras garantías reales** | 20 nov – 5 dic | Mainnet con topes de monto; 10 garantías con gente conocida y 2–3 inmobiliarias de Buenos Aires; entrega | Garantías activas, wallets únicas, cobertura en USD (contadores on-chain) |
| **2. Probar que el propietario la acepta** | Meses 1–3 | 100 garantías; 5 inmobiliarias; dictamen legal en Argentina y en Puerto Rico; auditoría del contrato; pilotos en modo demostración con operaciones de Kelvin | Tasa de aceptación de propietarios y vendedores; % de usuarios que completan el flujo |
| **3. Repetible** | Meses 3–12 | 1.000 garantías; apertura de Brasil; depósitos de opción de compra; activación en Puerto Rico si la regulación lo permite | Costo de adquisición por contrato; ingreso por contrato; tasa de reclamos |

**Por dónde entrar:** las inmobiliarias son el canal que ya vende garantías (Finaer trabaja con más de 12.000). Un "sí" de una inmobiliaria habilita a todos sus inquilinos. En paralelo, las comunidades cripto de Argentina aportan los primeros inquilinos con saldo.

**La hipótesis más riesgosa** no es técnica: es que un propietario acepte acciones como garantía. La etapa 1 existe para probar eso con 10 casos reales antes de gastar en crecer.

## 10. Riesgos y cómo se responden

| Riesgo | Respuesta |
|---|---|
| La acción cae y la garantía queda corta | Sobrecolateral por acción según su volatilidad; el inquilino (o cualquiera) puede reforzar; el propietario ve la salud en vivo |
| El propietario no confía | Página pública de verificación; árbitro acordado; reclamo cobrable sin juicio |
| Regulación | Es custodia de una garantía, no un préstamo ni una oferta de valores; igual hace falta dictamen legal local antes de escalar |
| Elegibilidad | Las acciones de Coinbase son solo para no residentes de EE.UU. y no hay lista pública de países: hay que confirmarla. La app bloquea EE.UU. y sus territorios |
| Poder del emisor | El emisor puede pausar o incautar tokens; se documenta como supuesto de confianza |
| Dependencia de un solo emisor | El oráculo admite cualquier acción tokenizada con feed de precio; se pueden sumar emisores |

## 11. Equipo

- **Kelvin — real estate y producto.** Vende propiedades en Puerto Rico y es la voz del negocio: conoce de primera mano cómo se reservan, garantizan y cierran las operaciones. **[completar: licencia, años en el rubro, operaciones cerradas]**
- **Fernando Lopez — ingeniería.** Full-stack (Node, React, Next.js, Elixir, Python) y builder web3 (Tuneport, Elei Protocol). Vive en Buenos Aires, donde el problema del garante se sufre todos los días y donde el producto puede operar hoy.

**Ya construimos juntos un producto que funciona:** Smarlin, en producción en Puerto Rico. **[completar: usuarios, propiedades publicadas, corredores, cualquier métrica real]**

**Por qué este equipo:** ya probó que puede llevar un producto inmobiliario a producción, tiene a alguien que cierra operaciones reales y a alguien que construye on-chain, y está parado en los dos mercados que el plan necesita.

## 12. El ask

**Al hackathon:** el premio del track Programmable Stock Markets (pool de USD 20.000). Uso propuesto **[decidir]**: auditoría del contrato, dictamen legal en Argentina y subsidio del fee de las primeras 100 garantías.

**A Base y Coinbase:**
- Claridad sobre los países elegibles para las acciones tokenizadas, y sobre el camino para Puerto Rico y EE.UU.
- Que el contrato de custodia quede exento de incautación a nivel de política del token, para que la garantía sea sólida para el propietario.
- Difusión del caso de uso: es "lo próximo que pueden hacer las acciones" con un usuario que no es trader.

**A los partners (Bankr):** mentoría, apoyo de incorporación y primeras presentaciones.

**A inmobiliarias y propietarios:** 3 pilotos en Buenos Aires que acepten la garantía en un contrato real.

**A inversores (después de la etapa 2) [decidir monto]:** una ronda pre-seed para 18 meses, destinada a auditoría y legales, dos contrataciones (crecimiento con inmobiliarias e ingeniería) y la apertura de Brasil.

---

## Textos listos para la entrega (en inglés)

**Tagline**

> Your stocks are your guarantor.

**One-liner**

> Garante lets renters lock tokenized stocks on Base as their rental guarantee instead of a cash deposit, a property-owning guarantor or a non-refundable insurance fee. They keep the upside and get the stocks back when the lease ends.

**Form — project description (1–2 sentences)**

> Garante turns tokenized stocks into rental guarantees. A renter locks Coinbase tokenized stocks in an onchain escrow; the landlord gets a USD-denominated, over-collateralized, claimable guarantee; the stocks return to the renter when the lease ends.

**Form — "Why should we select you?"**

> Renters in Latin America pay for guarantees they never get back: in Argentina a rental insurance policy costs 4–7% of the whole lease, and Brazilians paid R$2.0B in rental-guarantee premiums in 2025. Meanwhile over a million Argentines hold US stocks that are useless when they sign a lease. Garante makes those stocks the guarantee. It is a new primitive, USD-denominated obligations secured by tokenized stocks, aimed at people who are not traders. We are the team behind Smarlin, a live AI real estate platform in Puerto Rico: one of us sells properties there, the other builds onchain from Buenos Aires, where the product can operate today.

**Loom, 3 minutos**

| Tiempo | Qué se muestra | Qué se dice |
|---|---|---|
| 0:00–0:20 | Una pantalla con el costo de entrar a un alquiler | "To rent in Buenos Aires you need a property-owning guarantor or an insurance fee you never get back. If you hold stocks, you sell them to pay for it." |
| 0:20–0:40 | Landing con el 1-2-3 | "Garante makes your stocks the guarantee. Three steps." |
| 0:40–1:30 | Flujo del inquilino en vivo: términos, elegir acción, bloquear | "Agree the terms, pick a stock, lock it. One transaction." |
| 1:30–2:00 | Página pública de la garantía, vista del propietario | "The landlord verifies it here. No transaction, no gas." |
| 2:00–2:30 | Reclamo, disputa y liberación | "If something goes wrong: claim, dispute window, neutral arbiter. Otherwise the stocks go home." |
| 2:30–3:00 | Stats on-chain y roadmap | "Built during Stocks Maxxing. Next: first agencies in Buenos Aires, then Brazil." |

**Post de lanzamiento en X**

> Renting in LatAm means finding a guarantor or paying for insurance you never get back.
>
> We built Garante: lock tokenized stocks on Base as your rental guarantee. Keep the upside. Get them back when you move out.
>
> Your stocks are your guarantor. @buildonbase
