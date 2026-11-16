# Market size for the deck (TAM, SAM, SOM)

Method: home purchases per year × average price × a 5 % deposit (Accasa's default `reservationBps.default`).
No authoritative source publishes a typical reservation deposit for any of these markets, so 5 % is an
explicit assumption, stated on the slide. Figures are a floor: only markets with both a count and a price.

| Market | Purchases per year | Average price | Purchases, USD | 5 % deposit, USD |
|---|---|---|---|---|
| Ciudad de Buenos Aires | 68,109 (2025 to 2026) | USD 120,106 | 8,180 M | 409 M |
| Puerto Rico (mortgaged sales only) | 9,996 (2024) | USD 221,824 (2024) | 2,217 M | 111 M |
| Brazil (new homes, 221 cities) | 426.2k (2025) | BRL 264.2 bn total | 47,271 M at 5.5891 BRL/USD | 2,364 M |
| Lima (new homes) | 24,713 (2025) | PEN 455,909 | 3,158 M at 3.5677 PEN/USD | 158 M |
| **TAM** | | | **60,826 M** | **3,041 M** |

- **SAM**: Ciudad de Buenos Aires + Puerto Rico, the first two markets: USD 520 M a year in deposits.
- **SOM**: three-year goal of 1 in 100 purchases in those two markets: about 780 homes a year, USD 5.2 M
  in deposits. At 0.5 % of contributions + 1 % of the deposit, that is roughly USD 78k a year in fees:
  the consumer fees alone are a thin business, which is why brokers and listings sites paying for the
  button is the next revenue line.

Left out for lack of a count or a price: Mexico (SHF average MXN 1,863,965, no count), Colombia (Camacol
173,632 new homes, no price), Chile (39,200 new units in 2024, no price), Provincia de Buenos Aires
(147,393 purchases of all property types in 2025, no price).

## Sources

- Ciudad de Buenos Aires: Colegio de Escribanos de la Ciudad (already in docs/NARRATIVE.md). Ámbito gives
  69,461 for calendar 2025: https://www.ambito.com/real-estate/escrituras-caba-2025-cerro-casi-70000-operaciones-y-quedo-los-cinco-mejores-anos-tres-decadas-n6237403/amp
- Puerto Rico units: OCIF via Metro PR, 4 Jun 2025: https://www.metro.pr/noticias/2025/06/04/se-agrava-la-crisis-de-vivienda-asequible-en-puerto-rico/
- Puerto Rico price: OCIF via News is my Business, 3 Mar 2025: https://newsismybusiness.com/low-incomes-high-home-prices-still-make-owning-a-home-challenging
  (cash sales are not recorded anywhere public: https://www.plateapr.com/en/what-to-know/new-and-existing-home-sales-where-the-data-comes-from)
- Brazil: CBIC, 23 Feb 2026: https://cbic.org.br/mercado-imobiliario-fechou-quarto-trimestre-de-2025-com-recordes-em-lancamentos-e-vendas/
- Lima: CODI via Forbes Perú, 27 Jan 2026: https://forbes.pe/negocios/2026-01-27/la-venta-de-viviendas-en-lima-aumento-un-19-en-2025/
- BRL/USD 2025 average: Federal Reserve, FRED series DEXBZUS (annual average 5.5891).
- PEN/USD 2025 average: Banco Central de Reserva del Perú, series PN01207PM (monthly interbank average, mean of 2025 = 3.5677).
- Mortgage credit as % of GDP (problem slide): Deloitte Econosignal 2025 via Infobae, 22 May 2026:
  https://www.infobae.com/economia/2026/05/22/el-credito-hipotecario-de-la-argentina-es-el-mas-bajo-de-la-region-cual-es-el-nivel-en-otros-paises/
  US: FRED HHMSDODNS / GDP, Q4 2025 = 13.79 tn / 31.46 tn = 44 %.
- Seña in Argentina: Código Civil y Comercial, arts. 1059 and 1060 (money or movable things).
