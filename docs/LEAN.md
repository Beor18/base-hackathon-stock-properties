# Accasa: plan Lean

Cómo decidimos qué construir, qué medir y cuándo cambiar de rumbo. Sigue el método de *The Lean Startup* (Eric Ries): construir lo mínimo, medir con números que no se puedan maquillar y aprender antes de gastar.

La historia completa de la startup está en `docs/NARRATIVE.md`. El research de mercado y competencia, en `docs/research/`.

## 1. La apuesta

Una persona que ahorra para una casa prefiere que su ahorro siga invertido, con la casa a la vista, y que ese mismo ahorro sirva de seña sin venderlo.

Si eso es cierto, Accasa es el lugar donde se ahorra para una casa. Si no lo es, tenemos un contrato de custodia sin usuarios.

## 2. Las tres hipótesis

Todo el plan depende de tres supuestos. Los ordenamos por riesgo: primero el que, si es falso, nos deja sin producto.

| # | Tipo | Hipótesis | Cómo sabemos que es falsa |
|---|---|---|---|
| 1 | La más riesgosa | Un corredor acepta acciones bloqueadas como seña | Menos de 3 de los primeros 10 corredores aceptan una reserva |
| 2 | Valor | Una casa concreta como meta hace que la persona siga ahorrando | Menos del 40 % de las metas recibe un segundo aporte dentro de los 30 días |
| 3 | Crecimiento | Cada meta trae gente nueva (la vaquita) | Menos de 1,3 personas aportan por cada meta |

Los umbrales son nuestra primera apuesta. Se ajustan una sola vez, después de la línea de base, y nunca después de ver un resultado que no nos gusta.

## 3. El producto mínimo

Lo que ya está construido alcanza para probar las tres hipótesis:

- Elegir una casa (Smarlin en Puerto Rico, o un link de cualquier portal argentino).
- Sumar desde USD 5 y ver el avance.
- Reservar: las acciones quedan bloqueadas a favor del corredor.
- El link del corredor para pedir una reserva.
- La vaquita: un link para que otros sumen a tu casa.

Lo que no construimos hasta que una hipótesis lo pida:

| No construimos | Hasta que |
|---|---|
| Aportes automáticos todos los meses | La hipótesis 2 se confirme con aportes manuales |
| Panel para inmobiliarias | 3 corredores acepten una reserva (hipótesis 1) |
| Integración directa con portales | Las metas creadas por link superen a las de Smarlin |
| Crédito contra las acciones bloqueadas | Haya reservas activas y dictamen legal |

## 4. Qué medimos

Solo números que salen de los contratos o de una acción concreta de una persona. Nada de visitas ni de registros.

| Métrica | Hipótesis | De dónde sale | Hoy |
|---|---|---|---|
| Corredores que aceptan una reserva, sobre corredores a los que se la ofrecimos | 1 | Lista de Kelvin, a mano | Sin empezar |
| Metas con un segundo aporte dentro de los 30 días | 2 | Compras por cuenta, leídas del contrato | No se mide todavía: falta leer las compras por cuenta |
| Personas que aportan por cada meta | 3 | Compras cuyo destinatario no es quien paga | No se mide todavía: mismo trabajo que la anterior |
| Metas creadas, reservas hechas, valor bloqueado | Todas | `/api/stats`, en vivo en la diapositiva de tracción | En vivo |

Métricas que no miramos porque suben solas y no enseñan nada: visitas a la landing, cuentas creadas sin meta, seguidores.

## 5. Experimentos

Cada uno es chico, tiene dueño y fecha, y termina en una decisión.

| # | Experimento | Dueño | Cierra | Hipótesis | Decisión que habilita |
|---|---|---|---|---|---|
| E1 | Kelvin le muestra la página de una reserva a 10 corredores de su red y les pregunta si la aceptarían para sostener una propiedad. Sin producto nuevo: una conversación y un link | Kelvin | 28 nov 2026 | 1 | Si aceptan menos de 3: preguntar qué les falta (¿efectivo parcial?, ¿un banco como árbitro?) antes de escribir más código |
| E2 | 20 personas conocidas crean una meta y suman. Miramos cuántas vuelven a sumar sin que se lo pidamos | Fernando | 5 dic 2026 | 2 | Si vuelven menos de 8: probar recordatorio por email antes que aportes automáticos |
| E3 | Las mismas 20 personas comparten su vaquita. Contamos quién más suma | Fernando | 5 dic 2026 | 3 | Si nadie suma: la vaquita no es el motor; probar el link del corredor como canal principal |
| E4 | Una reserva completa con un corredor, de punta a punta, con montos chicos | Kelvin y Fernando | 5 dic 2026 | 1 | Es la prueba para el jurado y el primer caso para mostrarle a otros corredores |

## 6. Motores de crecimiento

Elegimos uno por vez. Hoy apostamos al viral.

- **Viral (el que estamos probando).** La vaquita y el link del corredor. Cada persona que ahorra tiene un motivo propio para compartir: que la ayuden a llegar. Se mide con personas que aportan por meta.
- **De retención.** La meta mensual y la casa que se va pintando. Se mide con el segundo aporte.
- **Pago.** No lo usamos. Con una comisión de 0,5 % por aporte y 1 % por reserva, una seña de USD 5.000 deja USD 75. No alcanza para comprar usuarios con publicidad hasta que exista el plan para corredores.

## 7. Registro de pivotes

| Fecha | De | A | Qué aprendimos |
|---|---|---|---|
| Nov 2026 | Garantía de alquiler con acciones | Accasa: ahorrar para una casa y reservarla | Una garantía se hace una sola vez. Para una casa se ahorra todos los meses. El contrato de custodia, el oráculo y el cobro del reclamo sirvieron tal cual |
| Nov 2026 | Solo USDC | USDC y pesos digitales | El que ahorra en Argentina cobra en pesos |
| Nov 2026 | Solo propiedades de Smarlin | Smarlin y cualquier link pegado | La portada es Puerto Rico, pero quien puede usarlo hoy está en Argentina |

## 8. Seguir o pivotar

Reunión fija: **6 de diciembre de 2026**, el día después del cierre del hackathon. Kelvin y Fernando, una hora, con la tabla de la sección 4 completa.

- Si la hipótesis 1 falla: no seguimos sumando funciones. Volvemos a hablar con corredores hasta entender qué aceptarían.
- Si la 1 se sostiene y la 2 falla: el problema es el hábito, no la seña. Probamos recordatorios y aportes automáticos.
- Si la 1 y la 2 se sostienen y la 3 falla: crecemos por corredores, no por vaquita.
- Si las tres se sostienen: abrimos mainnet a más gente y empezamos el plan para corredores.
