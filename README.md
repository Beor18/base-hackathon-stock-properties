# Accasa: your next home, in stocks

Save in tokenized stocks toward a specific home. When you reach the deposit, your stocks are locked onchain as the reservation deposit, never sold. If the buyer backs out, the contract sells just enough stock to pay the broker in USDC. If the purchase goes through, the stocks come back.

Built during [Base Stocks Maxxing](https://www.base.org/stocksmaxxing), track **Programmable Stock Markets**: a stock-backed financing primitive (idea 3.3, "stock-backed loans") applied to the step everyone in Latin America has to fund first: the home deposit.

**Live on Base Sepolia**

- App: https://accasa.vercel.app (Spanish) and https://accasa.vercel.app/en
- Developer page (contracts, lifecycle, code sample, API): https://accasa.vercel.app/en/developers
- Pitch deck: https://accasa.vercel.app/en/pitch
- A reservation, end to end: https://accasa.vercel.app/en/r/1
- Contracts, source verified on Blockscout: [ReservationEscrow](https://base-sepolia.blockscout.com/address/0x5584F9a333faCbB8f01D22524c517Cf2BaB84a95?tab=contract), [StockOracle](https://base-sepolia.blockscout.com/address/0x04d3d4672024357d40a4739Ad03f04e68987101d?tab=contract), [GoalRegistry](https://base-sepolia.blockscout.com/address/0x67cE534C1fB313763A03909994212cf4B5228Dca?tab=contract)

## The problem

In Latin America, buying a home starts with saving the down payment. Mortgage credit is 11% of GDP or less in Brazil, Mexico, Colombia and Peru, against 44% in the US (Deloitte Econosignal 2025; Federal Reserve). In Buenos Aires, 84.6% of purchases close without a mortgage. People save for years, and whoever invested those savings has to sell everything the day the home shows up. Sources and the market sizing are in [`docs/research/2026-11-16-tam-sam-som.md`](docs/research/2026-11-16-tam-sam-som.md).

## How it works

1. **Pick a home.** Live Puerto Rico listings from [Smarlin](https://www.smarlin.com) (our property platform), or paste a link from any listings site. The deposit is `price x deposit %` (default 5%, 1% to 10%).
2. **Save.** Add from USD 5 in USDC or digital pesos. Each contribution buys the tokenized stock chosen for the goal. Family can chip in through a shared link.
3. **Reserve.** The broker sends a short link. One tap locks the stocks in the escrow in the broker's favor, with a neutral arbiter. Cost, margin and every outcome (sale closes, buyer backs out, the stock falls, the market is closed, the stock is paused, a dispute) are on the same screen as the button.

Sign-in is by email (Privy smart wallet), network fees are sponsored (Coinbase paymaster), approve plus action go in one batched call, and every write carries Accasa's Builder Code (ERC-8021).

## What Base asked for in idea 3.3, and where it is

| "Show us" | Accasa |
|---|---|
| deposit, borrow, repay, withdraw | save, `createReservation`, then `release` (sale closes) or `fileClaim`, `acceptClaim`/`disputeClaim`, `settleClaim` (buyer backs out) |
| Cost, conservative limits, liquidation risk on one screen | The reserve screen: fee, locked value and its margin over the deposit, how far the stock can fall before it stops covering it, and what happens in each case |
| Overnight price gaps | A per-stock margin from 15% to 100% sized on each stock's volatility. Prices older than 26 h can't settle a claim (4 days to lock collateral) |
| Paused collateral transfers | The app reads Coinbase's oracle registry on Base mainnet (`getOracleParams`) and blocks reserving and payouts while a stock is paused, instead of letting the transaction fail |
| A stress scenario | `npm run demo:reservation -- drop --pct 20` lowers a testnet price live, and the app shows the deposit still covered |
| The exact market used | Payouts sell through an owner-allowlisted router with an immutable max slippage (2%). On Base Sepolia that router is a disclosed simulated market (`DemoExchange`) |

## Built during the Quest

Everything in this repository was built during Stocks Maxxing: the first commit is from November 14, 2026. That includes the three contracts and their 46 Foundry tests, the app, the API, the broker links and inbox (Supabase), the pitch deck and the developer page. What existed before: Smarlin, our property platform in Puerto Rico, which provides the listings through its public API.

## The contracts

- **`ReservationEscrow`**: stocks locked as a USD-denominated deposit in favor of a beneficiary (the broker), with an arbiter. Claims are paid in USDC by selling only the stock needed. The same lifecycle works as a rental deposit. Anyone can `topUp`; the depositor can `withdrawExcess` above the margin or `extendEndDate`.
- **`StockOracle`**: the accepted stocks, their Chainlink feeds (total-return, multiplier included) and per-stock collateral ratios, with two freshness bounds: a lenient one to lock collateral, a strict one to pay value out.
- **`GoalRegistry`**: one goal per account: the home and the stock it saves in.
- **Testnet only:** `MockStockToken` (priced from the real Chainlink feeds on Base mainnet), `MockPriceFeed`, `MockUSDC`, `MockWARS` and `DemoExchange`.

Lifecycle: `createReservation` -> (sale closes) `release`, or (buyer backs out) `fileClaim` -> `acceptClaim` or `disputeClaim` (3 days) -> `resolveDispute` (arbiter, 14 days, then the default arbiter) -> `settleClaim` (anyone) -> the rest goes back to the depositor. With no claim, anyone can `release` 15 days after the end date. Every number comes from [`src/config/deployment.json`](src/config/deployment.json); the [developer page](https://accasa.vercel.app/en/developers) renders it.

## Run it

```bash
npm install
npm run chain            # local anvil + deploy, writes src/config/deployment.json
npm run dev              # http://localhost:3000 (dev accounts, no Privy needed on 31337)
npm run contracts:test   # 46 Foundry tests
npm run smoke            # the full cycle on the local chain
```

On Base Sepolia, `npm run demo:reservation` plays a throwaway buyer so the broker side can be shown alone (`create --broker 0x…`, `accept --id N`, `drop --stock AAPL --pct 20`), and `npm run demo:prices -- --network base-sepolia` resyncs testnet prices with the real feeds.

## Architecture

```
contracts/src      Solidity (Foundry): oracle, escrow, goal registry, testnet mocks
scripts/           deploy, local chain, demo reservation, price sync, ABI export
src/config/        chains and deployment.json (written by the deploy script)
src/domain/        shared types and rules (collateral math, stock market status)
src/server/        Smarlin and link providers, chain reads, planners that return calls[]
src/app/api/       route handlers (public, read-only, plus planners and broker offers)
src/app/[lang]/    UI in Spanish and English
src/lib/wallet     sendCalls(calls): Privy smart wallet, or anvil accounts in dev
src/proxy.ts       US geo-block on mainnet, then the language prefix
```

Planners never sign: they return the calls, and the wallet sends them as one batch.

## Trust and security assumptions

- Not audited. Mainnet would launch with amount caps.
- The oracle owner lists stocks, sets collateral ratios and allowlists settlement routers. On mainnet it should be a multisig with a timelock.
- The arbiter resolves disputes; the default arbiter can act after a timeout. On mainnet, a multisig or a neutral third party.
- The token issuer can pause or seize tokens. The app honors the registry pause; before mainnet, `StockOracle` should read it too, because a frozen price can be younger than 26 hours.
- No sequencer uptime check.
- Tokenized stocks track the share price and carry no vote in the company. US persons (including Puerto Rico residents) can't save: tokenized stocks aren't offered to them, and mainnet is geo-blocked.

## Configuration

| Variable | What for |
|---|---|
| `NEXT_PUBLIC_PRIVY_APP_ID` | Privy app (email login, smart wallets) |
| `SUPABASE_SECRET_KEY` | Broker offers (short links) and inbox |
| `DEMO_PAUSED_TICKERS` | Testnets only: tickers shown as paused, to film the pause handling |

Everything else comes from `src/config/deployment.json` or has a public default. Deploys to public networks (`npm run deploy -- --network base-sepolia|base`) sign with `DEPLOYER_PRIVATE_KEY`.

## Team

- **Kelvin Garcia Vale**, real estate broker in Puerto Rico (Kelvin Garcia Realty), Smarlin.
- **Fernando Lopez**, engineer in Buenos Aires. Built Accasa end to end.
