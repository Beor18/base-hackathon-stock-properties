# Tracción hasta el 5 de diciembre

Según Crypto Briefing (no es oficial), la mitad del puntaje es uso real en la red. Además, la página de la Quest tiene un premio aparte para construir en público, votado por la comunidad: publicar en X durante la temporada etiquetando a @buildonbase.

Las reglas (§13) descalifican a quien manipula métricas: nada de cuentas propias ni transacciones armadas para inflar números. Lo que suma es gente de verdad que entra, arma su meta y aporta.

## Punto de partida (23/11/2026)

`https://accasa.vercel.app/api/stats`: 3 metas, 1 reserva. Los números salen de los contratos, así que cualquiera los puede verificar.

## Posts programados en @beor22 (todos a las 11:00, hora de Argentina, con imagen)

| Fecha | Tema | Imagen |
|---|---|---|
| mar 24/11 | Página para desarrolladores (programado antes) | |
| mié 25/11 | En castellano: invita a probar la app | portada en castellano |
| jue 26/11 | Prueba de estrés: Apple baja 10 % | `~/Vídeos/accasa/posts/stress.jpg` |
| sáb 28/11 | Pausa por split, registro de Coinbase | `pause.jpg` |
| lun 30/11 | Por qué un corredor acepta acciones como seña | `broker.jpg` |
| mié 2/12 | El problema en Latinoamérica (84,6 %, 11 % del PBI) | `problem.jpg` |
| vie 4/12 | Cierre: lo que se construyó y el link para probar | `cta.jpg` |

Se ven y se editan en x.com/compose/post/unsent/scheduled. Los textos están en `~/Vídeos/accasa/posts/posts.json`.

## Mensajes para mandar (los mandan ustedes)

### Fernando, por WhatsApp a contactos en Argentina

> Hola! Estamos armando Accasa para una competencia de Base: ahorrás en acciones para la seña de una casa y, cuando aparece la casa, las acciones quedan como seña sin venderlas.
>
> ¿Me hacés el favor de probarla? Son 2 minutos: entrás con tu email, arrancás con saldo de bienvenida (es la red de prueba, no hay plata en juego), elegís una casa y sumás a tu seña.
>
> https://accasa.vercel.app
>
> Si algo no se entiende, avisame y lo arreglo.

### Kelvin, por WhatsApp a corredores y clientes

> ¡Saludos! Estoy trabajando con un ingeniero en Accasa: el comprador ahorra en acciones para la seña y, cuando aparece la casa, las acciones quedan bloqueadas a favor del corredor como depósito, sin venderlas. Si el comprador se arrepiente, el corredor cobra en dólares.
>
> Está en la red de prueba, sin dinero de por medio. ¿Me ayudas a probarlo? Entra con tu email, elige una casa y suma a la seña: https://accasa.vercel.app
>
> Si eres corredor, también puedes crear un link de reserva para una de tus propiedades. Me encantaría saber qué te parece.

### Grupo de Telegram de Bankr (en inglés)

Link del grupo, sacado del formulario de inscripción: https://t.me/+978n2C5uky5iM2Vl

> Hi Bankr team! We're Accasa, in the Programmable Stock Markets track: tokenized stocks locked as a home reservation deposit in a broker's favor. If the buyer backs out, the escrow sells just enough stock to pay the broker in USDC, through an allowlisted market with a 2% max slippage.
>
> On mainnet that market should be real liquidity for tokenized stocks on Base, and that's where Bankr fits. Could we talk about routing those sales through Bankr, and what you look for in the partner track?
>
> Demo: https://x.com/beor22/status/2124961077566067117
> Contracts and docs: https://accasa.vercel.app/en/developers

## Límites a tener en cuenta

- La app de Privy está en modo desarrollo, con un tope de 150 usuarios. Si se acerca, hay que pasarla a producción en el panel de Privy.
- Las operaciones las patrocina el paymaster de CDP, pero el bundler es el público de Pimlico, que tiene límite de uso. Si llegan muchos usuarios a la vez, mirar si falla.
