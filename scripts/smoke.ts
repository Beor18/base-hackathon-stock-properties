/**
 * End-to-end smoke test against a running local chain (`npm run chain`):
 * faucet -> buy stock with USDC and with wARS -> set a goal -> reserve -> the broker claims ->
 * the claim is settled in USDC through the DemoExchange -> the broker releases the rest.
 *
 *   npm run smoke [-- --rpc-url http://127.0.0.1:8545]
 */
import { parseArgs } from "node:util";

import {
  createTestClient,
  createWalletClient,
  encodeFunctionData,
  formatUnits,
  http,
  keccak256,
  maxUint256,
  toBytes,
  zeroAddress,
  type Address,
  type Hash,
} from "viem";
import { foundry } from "viem/chains";

import {
  demoExchangeAbi,
  goalRegistryAbi,
  mockStockTokenAbi,
  mockUsdcAbi,
  reservationEscrowAbi,
  stockOracleAbi,
} from "../src/contracts/abis";
import { confirm, connect } from "./lib/clients";
import { NETWORKS } from "./lib/deploy-config";
import { readDeployment } from "./lib/deployment-file";

const { values } = parseArgs({ options: { "rpc-url": { type: "string" } } });

const USD = 10n ** 18n;
const BACKED_OUT = 0; // IReservationEscrow.ClaimReason.BackedOut
const CLOSED = 2; // IReservationEscrow.Status.Closed

function expect(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(`Check failed: ${message}`);
}

async function main() {
  const deployment = readDeployment(NETWORKS.local.chainId);
  const signer = await connect("local", values["rpc-url"] ?? deployment.rpcUrl);
  const client = signer.publicClient;
  const [, , user, broker] = signer.extraAccounts;
  expect(Boolean(user && broker), "the node exposes at least 5 accounts");
  expect(deployment.exchange !== null, "the local deployment has a DemoExchange");

  const exchange = deployment.exchange;
  const { reservationEscrow: escrow, goalRegistry, stockOracle } = deployment.contracts;
  const { usdc, wars } = deployment.payTokens;
  const stock = deployment.stocks.find((candidate) => candidate.symbol === "AAPLc") ?? deployment.stocks[0];

  const wallet = (account: Address) =>
    createWalletClient({ account, chain: foundry, transport: http(signer.rpcUrl) });
  const userWallet = wallet(user);
  const brokerWallet = wallet(broker);
  const step = async (label: string, send: () => Promise<Hash>) => {
    await confirm(signer, await send(), label);
    console.log(`  ok  ${label}`);
  };
  const balanceOf = (token: Address, account: Address) =>
    client.readContract({ address: token, abi: mockUsdcAbi, functionName: "balanceOf", args: [account] });

  console.log(`Smoke test on ${signer.rpcUrl} with ${stock.symbol}, user ${user}, broker ${broker}\n`);

  // 1. Test balance from the faucets.
  await step("USDC faucet", () => userWallet.writeContract({ address: usdc.address, abi: mockUsdcAbi, functionName: "faucet" }));
  await step("wARS faucet", () => userWallet.writeContract({ address: wars.address, abi: mockUsdcAbi, functionName: "faucet" }));

  // 2. Contributions: dollars and pesos turned into stock at the feed price.
  for (const payToken of [usdc, wars]) {
    const amountIn = await balanceOf(payToken.address, user);
    const [quoted, fee] = await client.readContract({
      address: exchange,
      abi: demoExchangeAbi,
      functionName: "quoteBuy",
      args: [stock.token, payToken.address, amountIn],
    });
    await step(`Approve ${payToken.symbol}`, () =>
      userWallet.writeContract({ address: payToken.address, abi: mockUsdcAbi, functionName: "approve", args: [exchange, amountIn] }),
    );
    const before = await balanceOf(stock.token, user);
    await step(`Buy ${formatUnits(quoted, stock.decimals)} ${stock.symbol} with ${formatUnits(amountIn, payToken.decimals)} ${payToken.symbol} (fee ${formatUnits(fee, payToken.decimals)})`, () =>
      userWallet.writeContract({
        address: exchange,
        abi: demoExchangeAbi,
        functionName: "buy",
        args: [stock.token, payToken.address, amountIn, quoted, user],
      }),
    );
    expect((await balanceOf(stock.token, user)) - before === quoted, `bought exactly the quote with ${payToken.symbol}`);
    expect((await balanceOf(payToken.address, deployment.treasury)) >= fee, `${payToken.symbol} fee reached the treasury`);
  }
  const shares = await balanceOf(stock.token, user);

  // 3. Goal: the start price comes from the oracle.
  const propertyKey = "smarlin:smoke-test";
  const propertyRef = keccak256(toBytes(propertyKey));
  await step("Set goal", () =>
    userWallet.writeContract({
      address: goalRegistry,
      abi: goalRegistryAbi,
      functionName: "setGoal",
      args: [propertyRef, propertyKey, stock.token, 10_000n * USD, 200_000n * USD, broker],
    }),
  );
  const goal = await client.readContract({ address: goalRegistry, abi: goalRegistryAbi, functionName: "goalOf", args: [user] });
  const [livePrice] = await client.readContract({ address: stockOracle, abi: stockOracleAbi, functionName: "latestPrice", args: [stock.token] });
  expect(goal.startStockPriceUsd === livePrice && goal.propertyRef === propertyRef, "goal stored with the oracle price");

  // 4. Reservation: lock what the stock covers at its collateral ratio, leaving room for the fee.
  const valueUsd = await client.readContract({ address: stockOracle, abi: stockOracleAbi, functionName: "toUsd", args: [stock.token, shares, 0] });
  const coverageUsd = ((valueUsd * 10_000n * 95n) / (BigInt(stock.collateralRatioBps) * 100n) / USD) * USD;
  const feeTokens = await client.readContract({
    address: stockOracle,
    abi: stockOracleAbi,
    functionName: "toTokens",
    args: [stock.token, (coverageUsd * BigInt(deployment.params.reservationFeeBps)) / 10_000n, 0],
  });
  const collateral = shares - feeTokens - 1n;
  const latest = await client.getBlock();
  await step("Approve stock to the escrow", () =>
    userWallet.writeContract({ address: stock.token, abi: mockStockTokenAbi, functionName: "approve", args: [escrow, maxUint256] }),
  );
  await step(`Reserve USD ${formatUnits(coverageUsd, 18)} with ${formatUnits(collateral, stock.decimals)} ${stock.symbol}`, () =>
    userWallet.writeContract({
      address: escrow,
      abi: reservationEscrowAbi,
      functionName: "createReservation",
      args: [
        {
          beneficiary: broker,
          arbiter: zeroAddress,
          token: stock.token,
          collateral,
          coverageUsd,
          endsAt: latest.timestamp + 60n * 86_400n,
          propertyRef,
        },
      ],
    }),
  );
  const id = await client.readContract({ address: escrow, abi: reservationEscrowAbi, functionName: "reservationCount" });
  const created = await client.readContract({ address: escrow, abi: reservationEscrowAbi, functionName: "getReservation", args: [id] });
  expect(created.arbiter === deployment.arbiter && created.depositor === user, "default arbiter and depositor set");

  // 5. The buyer backs out: the broker claims 40% and the dispute window lapses.
  const claimUsd = (coverageUsd * 40n) / 100n;
  await step(`Broker claims USD ${formatUnits(claimUsd, 18)}`, () =>
    brokerWallet.writeContract({ address: escrow, abi: reservationEscrowAbi, functionName: "fileClaim", args: [id, claimUsd, BACKED_OUT] }),
  );
  const anvil = createTestClient({ mode: "anvil", chain: foundry, transport: http(signer.rpcUrl) });
  await anvil.increaseTime({ seconds: deployment.params.disputeWindowSeconds + 1 });
  await anvil.mine({ blocks: 1 });

  // 6. Settlement: sell just enough stock through the whitelisted router, pay the claim in USDC.
  const [tokensIn, minUsdcOut] = await client.readContract({ address: escrow, abi: reservationEscrowAbi, functionName: "settlementQuote", args: [id] });
  const swapData = encodeFunctionData({ abi: demoExchangeAbi, functionName: "sell", args: [stock.token, tokensIn, minUsdcOut, escrow] });
  const [brokerBefore, userUsdcBefore] = await Promise.all([balanceOf(usdc.address, broker), balanceOf(usdc.address, user)]);
  await step(`Settle in USDC selling ${formatUnits(tokensIn, stock.decimals)} ${stock.symbol}`, () =>
    brokerWallet.writeContract({ address: escrow, abi: reservationEscrowAbi, functionName: "settleClaim", args: [id, exchange, swapData] }),
  );
  const paid = (await balanceOf(usdc.address, broker)) - brokerBefore;
  const surplus = (await balanceOf(usdc.address, user)) - userUsdcBefore;
  expect(paid === claimUsd / 10n ** 12n, "the broker got the full claim in USDC");
  expect((await balanceOf(stock.token, broker)) === 0n, "the broker never holds stock");
  expect(surplus > 0n, "the unused slippage allowance went back to the user");

  // 7. The deal goes ahead another way: the broker releases the remaining stock.
  const remaining = (await client.readContract({ address: escrow, abi: reservationEscrowAbi, functionName: "getReservation", args: [id] })).collateral;
  const userStockBefore = await balanceOf(stock.token, user);
  await step("Broker releases the reservation", () =>
    brokerWallet.writeContract({ address: escrow, abi: reservationEscrowAbi, functionName: "release", args: [id] }),
  );
  const closed = await client.readContract({ address: escrow, abi: reservationEscrowAbi, functionName: "getReservation", args: [id] });
  expect(closed.status === CLOSED, "reservation closed");
  expect((await balanceOf(stock.token, user)) - userStockBefore === remaining, "remaining stock returned to the user");

  const [active, coverage] = await Promise.all([
    client.readContract({ address: escrow, abi: reservationEscrowAbi, functionName: "activeReservationCount" }),
    client.readContract({ address: escrow, abi: reservationEscrowAbi, functionName: "activeCoverageUsd" }),
  ]);
  console.log(
    `\nSmoke test passed. Broker paid ${formatUnits(paid, 6)} USDC, user got ${formatUnits(surplus, 6)} USDC back ` +
      `and ${formatUnits(remaining, stock.decimals)} ${stock.symbol}. Active reservations: ${active}, coverage USD ${formatUnits(coverage, 18)}.`,
  );
}

main().catch((error: Error) => {
  console.error(`\nSmoke test failed: ${error.message}`);
  process.exit(1);
});
