# Seña: mercado y competencia

Research del 14 nov 2026 para reescribir el deck. Completa y corrige `docs/NARRATIVE.md` y `HANDOFF.md`.

**Fuentes.** **[V]** leí la fuente. **[P]** lo leí en prensa o en un tercero. **[E]** solo vi el extracto del buscador (la página bloqueó la lectura): **sin verificar**.

## Lo que cambia el deck

1. **El 50/25/25 del jurado no está en ninguna fuente oficial.** Sale de una nota de prensa sin atribución.
2. **El competidor más cercano es de Coinbase:** con Better, en EE.UU., ya se prenda bitcoin o USDC para el anticipo de una casa sin venderlos, y anunciaron que piensan sumar acciones tokenizadas.
3. **"Prendar en vez de vender" crece 59 % por año, con piso de USD 100.000.** Es la mejor frase del deck y tiene fuente primaria.
4. **La comisión de reserva sola es chica:** USD 4,1 millones por año si toda la Ciudad de Buenos Aires señara con Seña.

## 1. Hackathon: qué es oficial y qué no

| Tema | Qué dice | Fuente |
|---|---|---|
| Fechas | Stocks Maxxing Season, 5 nov a 5 dic 2026 | [Página oficial](https://www.base.org/stocksmaxxing) [V] |
| Cierre | 5 dic 2026, 23:59 **UTC** según la página. El formulario de registro dice 23:59 **EST**. Usar UTC, que es antes | [Página](https://www.base.org/stocksmaxxing) y [formulario](https://docs.google.com/forms/d/1zotYvkeAtDjR2MKk3qNxyNIAfJ_IPQtzTtjNhOAF8js/viewform) [V] |
| Nuestro track | "Create net-new stock market primitives, e.g., custom portfolios, indexes, structured products, financing tools, prediction markets, and market infrastructure." Ideas que da Base: "Build-your-own stock indexes", "Covered call and put desks", "Borrow against your stocks", "Earnings prediction markets" | Página oficial [V] |
| Premios | Base: USD 50.000 (Meme 10.000, Agentic 20.000, Programmable 20.000). Partners: USD 48.000. Build in public: USD 6.000 por voto de la comunidad. En nuestro track, Bankr pone USD 1.000 más créditos de inferencia y BaseStonk no pone efectivo | Página oficial [V] |
| Qué se entrega | "project ID, Builder Code, live product, demo, posts and traction data". Post en X con Loom etiquetando @buildonbase, más el formulario | Página y [reglas](https://www.base.org/stocksmaxxing/rules) §5 [V] |
| Criterios y pesos | **No publicados.** Reglas §7: se puntúa contra los criterios de la página, "weighted equally unless the Quest Page sets different weights". La página no lista criterios y avisa que "judging criteria may change" | Reglas y página [V] |
| El 50/25/25 | 50 % tracción, 25 % producto, 25 % build in public. Aparece solo en prensa, sin decir de dónde sale. Del hilo de @base del 5 nov pude leer el primer post, que no habla de criterios | [CryptoBriefing, 6 nov 2026](https://cryptobriefing.com/base-tokenized-stock-builder-competition/) [P], [post de @base](https://x.com/base/status/2118282380683206951) [V, solo el primero] |
| Elegibilidad | Mayores de 18, equipos de hasta 5. "Projects that enable trading for US users are not eligible." Testnet "will not be judged less favorably". Manipular tracción descalifica | Página y reglas §4, §5, §13 [V] |
| Qué dijo el jurado | No encontré declaraciones de jurados. La única pista oficial es el cierre del formulario: "The best way to stand out is to ship and build in public." | Formulario [V] |
| Ojo, **sin verificar** | En el código de la página hay un reparto que no se muestra: USD 11.000 al "top project growing what's already launched" y USD 7.000 al "top project building something new". Si aplica, un proyecto nuevo compite por 7.000 y no por 20.000 | Código de la página oficial [V que existe, sin verificar que aplique] |

**Qué hacer:** preguntar por escrito en el grupo de Bankr los criterios, los pesos y ese reparto. Hasta entonces, el deck no debería afirmar "50 % tracción".

## 2. ¿Alguien ya lo hace?

No encontré ningún producto que bloquee acciones, tokenizadas o comunes, como seña de una casa, ni que junte "ahorrar en acciones para una casa concreta" con una custodia. No pude revisar X ni los proyectos inscriptos.

| Alternativa | Qué hace | Por qué no es Seña | Fuente |
|---|---|---|---|
| **Better + Coinbase (EE.UU.)**, la más cercana | Hipoteca común más un segundo préstamo para el anticipo, garantizado con bitcoin o USDC en prenda. No se vende. Disponible desde el 26 ago 2026. Planean sumar acciones tokenizadas | Es deuda, es para el anticipo al escriturar (no para la seña), solo en EE.UU. y con cripto. Misma idea de fondo, mismo sponsor | [The Block, 26 ago 2026](https://theblock.co/news/business/2026-08-26-coinbase-better-make-token-backed-mortgages-generally-available-412810) [P], [HousingWire, 26 mar 2026](https://www.housingwire.com/articles/token-backed-mortgage-down-payment/) [P] |
| Hipotecas con activos en prenda (Morgan Stanley, Merrill) | Prendás tu cartera en vez de poner el anticipo en efectivo | Solo clientes con cartera grande en ese banco. Es deuda | [Merrill](https://www.ml.com/solutions/loans-financing/mortgages.html) [V], [Morgan Stanley](https://www.morganstanley.com/homeloans) [E] |
| Aave y Morpho en Base | Prestan USDC contra las acciones tokenizadas de Coinbase (Morpho 18 sep 2026, Aave 25 sep 2026) | Es deuda con interés y liquidación por precio. Después hay que darle efectivo al corredor igual. Base lo lista como idea del track: no es nuevo | [The Block, 25 sep 2026](https://theblock.co/news/defi/2026-09-25-aave-v4-on-base-adds-coinbase-tokenized-stocks-as-collateral-for-usdc-loans-416372) [P], [CryptoBriefing, 18 sep 2026](https://cryptobriefing.com/morpho-stock-backed-loans-base-coinbase/) [P] |
| Emisores y apps de acciones tokenizadas (bStocks, Ondo, xStocks, Robinhood, Coinbase) | Comprar y tener acciones | Ni meta de propiedad ni reserva | [rwa.xyz, 14 nov 2026](https://app.rwa.xyz/stocks) [V] |
| Custodia de seña con cripto (EE.UU.) | Una empresa de custodia acepta cripto para el depósito | Cripto, no acciones. Sin ahorro previo ni meta | [Guaranty Escrow](https://www.guaranty-escrow.com/crypto-backed-earnest-money-deposit-procedures-explained/) [E, página comercial] |
| Apps de ahorro para el anticipo (Foyer) | Cuenta de ahorro con tasa para compradores primerizos | Efectivo, no acciones. Sin custodia | [TechCrunch, 24 ene 2025](https://techcrunch.com/2025/01/24/foyer-unlocks-6-2m-to-help-people-save-up-to-buy-homes) [E] |
| Alquiler con opción a compra (Divvy) | Alquilás y vas juntando para comprar. Divvy se vendió a Brookfield por unos USD 1.000 millones en 2025 | Financia la casa, no usa tus inversiones | [TechCrunch, 22 ene 2025](https://techcrunch.com/2025/01/22/rent-to-own-startup-divvy-homes-selling-to-brookfield-for-about-1-billion) [E] |
| Ladrillo fraccionado (Simplestate, Crowdium, Reental) | Comprás una parte de un inmueble o de un proyecto | Invertís en el inmueble de otro. No sirve para reservar la casa que elegiste | [Cronista](https://www.cronista.com/infotechnology/it-business/crowdfunding-inmobiliario-tres-opciones-para-invertir-hoy-en-ladrillos-por-25000) [E] |
| Crédito UVA | Banco Nación financia hasta 75 % del valor | El 25 % restante y la seña salen igual del ahorro | [Canal 26, 8 abr 2026](https://www.canal26.com/economia/2026/04/08/prestamos-del-banco-nacion-como-funcionan-los-creditos-hipotecarios-que-se-ajustan-por-uva/) [E] |
| Billete, plazo fijo, CEDEARs en un broker | Guardar o invertir | Para señar hay que vender. Ya está en la narrativa | [BYMA, 2 jul 2026](https://www.byma.com.ar/newsroom/1-de-cada-2-personas-poblacion-economicamente-activa-tiene-cuenta-en-el-mercado-de-capitales) [V] |

Sin revisar en esta pasada: Toperty, Lofty, RealT, Dinari y cada broker argentino por separado.

**La pregunta del jurado va a ser:** "¿por qué no pido USDC en Aave contra mis acciones y pago la seña?". Respuesta: en Seña no hay deuda ni interés, y las acciones solo se venden si te arrepentís.

## 3. Los que tienen plata no venden: prendan

- **USD 33.400 millones** en líneas con cartera en prenda en un solo broker (Schwab), **59 % más** que un año antes, al 30 jun 2026. [Schwab, informe del 2.º trimestre, 21 jul 2026](https://content.schwab.com/web/retail/public/about-schwab/schw_8k_07212026.pdf) [V]. El 3.er trimestre daría USD 37.300 millones [E].
- **Piso de USD 100.000.** Es la línea mínima de Schwab ([Schwab](https://advisorservices.schwab.com/serving-your-clients/invest-solutions/bank-lending-trust/pledged-asset-lines) [E]) y el umbral que la SEC describe como habitual ([alerta SEC y FINRA, dic 2015](https://www.sec.gov/oiea/investor-alerts-and-bulletins/sbloc) [E]).
- **41 %** de los clientes preaprobados de Better califica por ingresos y crédito pero no tiene el efectivo del anticipo. The Block, 26 ago 2026 [P].
- **2,6 %:** lo que se usa como garantía del total de acciones tokenizadas (USD 81 millones de 3.170). [RedStone, 6 oct 2026, datos al 28 sep](https://www.redstone.finance/research/tokenized-stocks-2026) [V].

Frase posible: "Prendar en vez de vender ya mueve decenas de miles de millones, con un piso de USD 100.000. Seña lo abre desde USD 5."

## 4. Mercado, con la cuenta a la vista

| Dato | Valor | Fecha | Fuente |
|---|---|---|---|
| Escrituras de compraventa, CABA, año 2025 | 69.461 | 2025 | [Ámbito, 22 ene 2026](https://www.ambito.com/real-estate/escrituras-caba-2025-cerro-casi-70000-operaciones-y-quedo-los-cinco-mejores-anos-tres-decadas-n6237403/amp) [P]. La suma de los informes del Colegio da 69.460 |
| Con hipoteca, CABA, 2025 | 13.953 (20,1 %, cálculo propio) | 2025 | [Colegio de Escribanos, 22 ene 2026](https://www.colegio-escribanos.org.ar/2026/01/22/cantidad-de-escrituras-de-compraventa-realizadas-en-diciembre-2025/) [V] |
| Escrituras CABA, ene a sep 2026 | 48.195 (2,7 % menos que en 2025) | sep 2026 | [Colegio de Escribanos, 22 oct 2026](https://www.colegio-escribanos.org.ar/?p=144949) [V] |
| Con hipoteca, ene a sep 2026 | 7.426 (15,4 %). Sin hipoteca: 40.769 (**84,6 %**) | sep 2026 | Mismo informe [V], porcentajes propios |
| Septiembre 2026 | 6.612 escrituras, 1.256 con hipoteca (19,0 %) | sep 2026 | Mismo informe [V] |
| Monto medio por escritura, CABA | **USD 120.106** al tipo de cambio oficial | sep 2026 | Mismo informe [V] |
| Compraventas, Provincia de Buenos Aires | 147.393, con 23.395 hipotecas (15,9 %) | 2025 | [Cronista, 18 ene 2026](https://www.cronista.com/negocios/el-mercado-inmobiliario-cerro-2025-con-su-mejor-registro-en-dos-decadas-el-dato-positivo-que-puede-consolidar-el-crecimiento-en-2026) [P] |
| Monto medio en Provincia | No encontrado | | |
| Reserva o seña en Argentina | No hay porcentaje fijo. Ejemplo judicial: USD 5.000 sobre USD 190.000 (2,6 %). Guías comerciales: 5 % a 10 %, alguna hasta 20 %; boleto 20 % a 30 % | dic 2025 | [Abogados.com.ar, 29 dic 2025](https://abogados.com.ar/sena-o-reserva-son-lo-mismo/38218) [P], Mudafy (ya citado) |
| Depósito de opción en Puerto Rico | Guía de un portal: 1 % a 3 % del precio. Ejemplos en sentencias: 1,2 % a 5 % | 2026 | [FinditPR](https://www.finditpr.com/en/buying-guide) [V], sentencias [E] |
| Ventas de vivienda con hipoteca, Puerto Rico | 2.533 en un trimestre (226 nuevas). No cuenta compras al contado | 2.º trim. 2025 | [Platea, 3 dic 2025](https://www.plateapr.com/en/what-to-know/new-and-existing-home-sales-where-the-data-comes-from) [P, datos de OCIF] |
| Precio promedio, Puerto Rico | Usada USD 223.724, nueva USD 439.006. Una nota posterior da USD 238.418 para la usada | 2025 | [El Nuevo Día, 3 mar 2026](https://www.elnuevodia.com/negocios/bienes-raices/notas/precios-de-la-vivienda-nueva-en-puerto-rico-se-disparan-782/) [P, datos de OCIF] |
| Personas con cuenta comitente | Más de 12,3 millones (55 % de la población activa); 24,6 millones de cuentas | 31 may 2026 | BYMA [V] |
| Con CEDEARs | Más de 1 millón con posición; 878.000 cuentas operaron en el año | 31 may 2026 | BYMA [V] |
| Usuarios cripto en Argentina | Usuarios activos por mes equivalentes al 12,4 % de la población; 5,4 millones de descargas de apps cripto en 2025. Número absoluto: no encontrado | 2025 | [Perfil sobre informe de Lemon, 27 feb 2026](https://www.perfil.com/noticias/economia/mercado-cripto-argentina-lidera-en-cantidad-de-usuarios-por-habitantes-en-america-latina-40.phtml) [P] |

**La cuenta (Ciudad de Buenos Aires, últimos 12 meses):**

```
Escrituras oct 2025 a sep 2026 = 7.018 + 5.250 + 7.646 + 48.195 = 68.109
Volumen  = 68.109 x USD 120.106              = USD 8.180 millones
Seña 5 % = USD 8.180 M x 0,05                = USD 409 millones por año
Comisión de reserva 1 % = USD 409 M x 0,01   = USD 4,1 millones por año (con el 100 % del mercado)
Con el 1 % de las escrituras (681 reservas)  = USD 4,09 M en señas, USD 41.000 de comisión
Con 0,5 % por aporte + 1 % por reserva (docs/LEAN.md) = 1,5 % de la seña = USD 6,1 M (con el 100 %)

Otros escenarios, misma base:
Reserva de 2,6 % = USD 215 M por año   -> 1 % = USD 2,2 M
Boleto de 30 %   = USD 2.454 M por año -> 1 % = USD 24,5 M

Provincia de Buenos Aires, cota superior (SUPUESTO SIN FUENTE: mismo ticket que CABA):
147.393 x USD 120.106 x 5 % = USD 885 M por año -> 1 % = USD 8,9 M

Puerto Rico, muy aproximado (solo ventas con hipoteca):
Ventas por año   = 2.533 x 4 = 10.132
Precio ponderado = (226 x 439.006 + 2.307 x 223.724) / 2.533 = USD 242.932
Volumen          = USD 2.460 M por año
Depósito 1 % a 3 % = USD 25 M a 74 M -> 1 % = USD 0,25 M a 0,74 M
```

Supuestos: el monto medio de septiembre vale para todo el año (osciló entre USD 104.000 y 121.000) y el trimestre de Puerto Rico se repite cuatro veces. Hoy el residente de la isla no puede ser usuario: Puerto Rico es vidriera, no ingreso.

## 5. Por qué ahora

| Fecha | Hecho | Fuente |
|---|---|---|
| 11 jun 2025 | Stripe compra Privy (más de 75 millones de cuentas): el login con email y cuenta invisible ya es infraestructura común. Coinbase ofrece un servicio para pagarle el gas al usuario en Base | [SiliconANGLE](https://siliconangle.com/2025/06/11/stripe-acquires-crypto-wallet-infrastructure-provider-privy/) [E], [docs de Coinbase](https://docs.cdp.coinbase.com/paymaster/introduction/welcome) [E] |
| 31 oct 2025 (aprox.) | Sale wARS, el peso digital, en Ethereum, World Chain y Base. Circulante chico: revisar liquidez antes de prometer aportes en pesos | [La Nación](https://www.lanacion.com.ar/economia/IA/marca-un-hito-el-peso-argentino-se-podra-operar-247-y-sin-bancos-en-el-medio-nid29102025) [E] |
| 10 mar 2026 | Las acciones tokenizadas pasan los USD 1.000 millones | [Cointelegraph](https://cointelegraph.com/news/tokenized-stocks-surpass-1b-ondo-xstocks-dominate-sector) [P] |
| 10 jun 2026 | La CNV amplía la tokenización (acciones, ON, CEDEARs, fondos) y prorroga el régimen de prueba hasta el 31 dic 2027. RG 1150/2026 | [Boletín Oficial vía argentina.gob.ar](https://www.argentina.gob.ar/normativa/nacional/norma-426586/texto) [V] |
| 24 ago 2026 | Coinbase lanza acciones tokenizadas en Base, respaldo 1 a 1, para no residentes de EE.UU. | [Markets Media, 25 ago 2026](https://www.marketsmedia.com/tokenized-stocks-issued-by-coinbaseare-now-live-natively-on-base/) [P] |
| 26 ago 2026 | Better y Coinbase abren la hipoteca con cripto en prenda | The Block [P] |
| 17 sep 2026 | La SEC aprueba una exención de 5 años para negociar acciones tokenizadas onchain, con topes | [Skadden, 22 sep 2026](https://www.skadden.com/insights/publications/2026/09/sec-innovation-exemption-establishes) [P] |
| 18 y 25 sep 2026 | Morpho y Aave aceptan esas acciones como garantía en Base (Aave: 7 acciones, tope de garantía de unos USD 29 millones) | The Block, CryptoBriefing [P] |
| 14 nov 2026 | Acciones tokenizadas: USD 3.770 millones, 4,83 millones de tenedores. Coinbase: USD 47,5 millones (puesto 8) | rwa.xyz [V] |

## 6. Qué contradice o corrige la narrativa actual

1. **`HANDOFF.md` §3 da el 50/25/25 como hecho.** No tiene fuente oficial.
2. **"Por primera vez un contrato puede custodiar una acción real y venderla" y "no existe en otro lado" (`NARRATIVE.md` §3 y §7).** Aave y Morpho ya custodian y liquidan esas acciones en Base desde septiembre. Lo defendible es más angosto: nadie las bloquea a favor de un tercero como seña de una propiedad.
3. **La tabla de competencia (§6) no incluye** a Better con Coinbase ni a las hipotecas con activos en prenda.
4. **"Casi nadie compra con crédito".** En 2025 fue 1 de cada 5 escrituras. Mejor: "más de 8 de cada 10 se pagan con ahorro" (84,6 % en 2026).
5. **Seña de 5 % por defecto.** En Puerto Rico la guía que encontré habla de 1 % a 3 %. Confirmar con Kelvin.
6. **"El corredor cobra".** En Puerto Rico la Ley 10 de 1994 obliga al corredor a depositar la seña en una cuenta especial de banco y le prohíbe retenerla si la operación cae sin culpa del comprador ([ley](https://bvirtualogp.pr.gov/ogp/Bvirtual/leyesreferencia/PDF/Vivienda/10-1994/10-1994.pdf), [Tribunal Supremo, 2004](https://dts.poderjudicial.pr/opiniones/2004/2004TSPR92.pdf) [E]). El beneficiario parece ser el vendedor y el corredor, depositario. Consultar con abogado.
7. **La seña tiene dos lados.** En Argentina, si se pacta arrepentimiento, quien la dio la pierde y quien la recibió devuelve el doble (Abogados.com.ar [P]). Seña hoy cubre solo al comprador.
8. **"De USD 2.480 M a 3.770 M en menos de tres meses".** Verifiqué el 3.770 de hoy, no el punto de partida. Alternativa verificada: de 1.000 (mar 2026) a 3.770 (nov 2026).
9. **El TAM de USD 254.898 millones** no dice nada del ingreso. De abajo hacia arriba, CABA da entre USD 4 y 25 millones por año con el 100 %.

## 7. Lo que no pude conseguir

- Criterios y pesos oficiales del jurado, y el resto del hilo de @base.
- Países habilitados para las acciones de Coinbase. Argentina sigue sin confirmar.
- Monto medio en Provincia, total nacional de escrituras y ventas al contado en Puerto Rico.
- Cantidad de usuarios cripto en Argentina con fuente primaria. La prensa cita a Chainalysis: USD 88.500 millones de actividad entre jul 2025 y jun 2026 [E].
- Saldo de préstamos con cartera en prenda de Morgan Stanley. Solo hay un total de su banca privada que incluye hipotecas: USD 195.700 millones al 30 jun 2026 [E].
