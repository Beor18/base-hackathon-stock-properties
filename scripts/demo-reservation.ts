/**
 * Demo reservation on Base Sepolia, for filming the broker side without a second person.
 * A throwaway buyer wallet saves in a stock, sets a goal for a real Smarlin listing and reserves it
 * in favor of a broker account you sign in with in the app. Then the broker files the claim and
 * settles it from the app, and this script plays the buyer's part.
 *
 *   npm run demo:reservation -- create --broker 0x… [--ref smarlin:…] [--pct 5] [--stock AAPL]
 *   npm run demo:reservation -- accept --id <reservation id>    buyer accepts the broker's claim
 *   npm run demo:reservation -- drop --stock AAPL --pct 20      stress test: the price falls 20 %
 *   (restore real prices with `npm run demo:prices -- --network base-sepolia`)
 *
 * Needs DEPLOYER_PRIVATE_KEY (funds the buyer with test ETH, owns the demo price feeds) and
 * DEMO_BUYER_PRIVATE_KEY (the throwaway buyer), both in .env.deploy, which git ignores.
 * These transactions carry no Builder Code on purpose: test activity is not usage.
 */
import { parseArgs } from "node:util";

import { createWalletClient, formatUnits, http, keccak256, parseEther, parseUnits, toBytes, type Address, type Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";

import {
  demoExchangeAbi,
  goalRegistryAbi,
  mockPriceFeedAbi,
  mockUsdcAbi,
  reservationEscrowAbi,
} from "../src/contracts/abis";
import { confirm, connect } from "./lib/clients";
import { NETWORKS } from "./lib/deploy-config";
import { readDeployment } from "./lib/deployment-file";

const { positionals, values } = parseArgs({
  allowPositionals: true,
  options: {
    broker: { type: "string" },
    ref: { type: "string", default: "smarlin:4e3f1868-2add-4df8-8275-dbfa1455de75" },
    pct: { type: "string" },
    stock: { type: "string", default: "AAPL" },
    id: { type: "string" },
    app: { type: "string", default: "https://accasa.vercel.app" },
  },
});
const command = positionals[0];

const deployment = readDeployment(NETWORKS["base-sepolia"].chainId);
const stock = (() => {
  const found = deployment.stocks.find((candidate) => candidate.ticker === values.stock?.toUpperCase());
  if (!found) throw new Error(`Unknown stock ${values.stock}`);
  return found;
})();

async function main() {
  const signer = await connect("base-sepolia", deployment.rpcUrl);
  const client = signer.publicClient;
  const buyerKey = process.env.DEMO_BUYER_PRIVATE_KEY as Hex | undefined;
  if (!buyerKey) throw new Error("Set DEMO_BUYER_PRIVATE_KEY in .env.deploy (a throwaway testnet key)");
  const buyer = createWalletClient({ account: privateKeyToAccount(buyerKey), chain: signer.chain, transport: http(signer.rpcUrl) });
  const buyerAddress = buyer.account.address;
  const send = async (label: string, hash: Promise<Hex>) => {
    await confirm(signer, await hash, label);
    console.log(`  ok  ${label}`);
  };

  if (command === "create") {
    const broker = values.broker as Address | undefined;
    if (!broker) throw new Error("Pass --broker 0x… (the account that will collect the deposit)");
    const pct = Number(values.pct ?? deployment.params.reservationBps.default / 100);

    // The listing and the deposit the app would quote for it.
    const property = await fetch(`${values.app}/api/properties/${encodeURIComponent(values.ref!)}`).then((r) => r.json());
    if (!property.priceUsd) throw new Error(`Listing ${values.ref} not found`);
    const senaUsd = Math.round((property.priceUsd * pct) / 100);
    const [quote] = await fetch(`${values.app}/api/quote?coverageUsd=${senaUsd}&token=${stock.token}`).then((r) => r.json());
    const needTokens = BigInt(quote.totalTokens);
    console.log(`${property.title}: USD ${property.priceUsd}, seña ${pct} % = USD ${senaUsd}, locks ${formatUnits(needTokens, stock.decimals)} ${stock.ticker}`);
    console.log(`Buyer ${buyerAddress}, broker ${broker}\n`);

    // Gas for the buyer.
    const gas = await client.getBalance({ address: buyerAddress });
    if (gas < parseEther("0.0003")) {
      await send("Test ETH for the buyer", signer.walletClient.sendTransaction({ to: buyerAddress, value: parseEther("0.0008") }));
    }

    // Save in the stock: the USDC faucet tops up to its cap, so buy in rounds until there is enough.
    const usdc = deployment.payTokens.usdc.address;
    const exchange = deployment.exchange!;
    const balanceOf = (token: Address) => client.readContract({ address: token, abi: mockUsdcAbi, functionName: "balanceOf", args: [buyerAddress] });
    await send("Approve USDC to the exchange", buyer.writeContract({ address: usdc, abi: mockUsdcAbi, functionName: "approve", args: [exchange, 2n ** 255n] }));
    while ((await balanceOf(stock.token)) < needTokens) {
      await send("USDC faucet", buyer.writeContract({ address: usdc, abi: mockUsdcAbi, functionName: "faucet" }));
      const amountIn = await balanceOf(usdc);
      const [quoted] = await client.readContract({ address: exchange, abi: demoExchangeAbi, functionName: "quoteBuy", args: [stock.token, usdc, amountIn] });
      await send(`Buy ${formatUnits(quoted, stock.decimals)} ${stock.ticker}`, buyer.writeContract({
        address: exchange,
        abi: demoExchangeAbi,
        functionName: "buy",
        args: [stock.token, usdc, amountIn, quoted, buyerAddress],
      }));
    }

    // The goal ties the reservation to the listing, so the app shows its photo and title.
    const propertyRef = keccak256(toBytes(values.ref!));
    const targetUsd = parseUnits(String(Math.ceil(Number(formatUnits(BigInt(quote.totalValueUsd), 18)))), 18);
    await send("Set goal", buyer.writeContract({
      address: deployment.contracts.goalRegistry,
      abi: goalRegistryAbi,
      functionName: "setGoal",
      args: [propertyRef, values.ref!, stock.token, targetUsd, parseUnits(String(property.priceUsd), 18), broker],
    }));

    // Reserve.
    await send("Approve the stock to the escrow", buyer.writeContract({ address: stock.token, abi: mockUsdcAbi, functionName: "approve", args: [deployment.contracts.reservationEscrow, needTokens] }));
    const now = (await client.getBlock()).timestamp;
    await send(`Reserve USD ${senaUsd}`, buyer.writeContract({
      address: deployment.contracts.reservationEscrow,
      abi: reservationEscrowAbi,
      functionName: "createReservation",
      args: [{
        beneficiary: broker,
        arbiter: "0x0000000000000000000000000000000000000000",
        token: stock.token,
        collateral: BigInt(quote.collateral),
        coverageUsd: parseUnits(String(senaUsd), 18),
        endsAt: now + BigInt(deployment.params.reservationDays) * 86_400n,
        propertyRef,
      }],
    }));
    const id = await client.readContract({ address: deployment.contracts.reservationEscrow, abi: reservationEscrowAbi, functionName: "reservationCount" });
    console.log(`\nReservation ${id}: ${values.app}/es/r/${id}`);
    return;
  }

  if (command === "accept") {
    if (!values.id) throw new Error("Pass --id <reservation id>");
    await send(`Buyer accepts the claim on reservation ${values.id}`, buyer.writeContract({
      address: deployment.contracts.reservationEscrow,
      abi: reservationEscrowAbi,
      functionName: "acceptClaim",
      args: [BigInt(values.id)],
    }));
    console.log(`The claim is payable: the broker can collect it at ${values.app}/es/r/${values.id}`);
    return;
  }

  if (command === "drop") {
    const pct = Number(values.pct ?? 20);
    const [, answer] = await client.readContract({ address: stock.feed, abi: mockPriceFeedAbi, functionName: "latestRoundData" });
    const lower = (answer * BigInt(100 - pct)) / 100n;
    await send(`${stock.ticker} price ${answer} -> ${lower} (-${pct} %)`, signer.walletClient.writeContract({
      address: stock.feed,
      abi: mockPriceFeedAbi,
      functionName: "setAnswer",
      args: [lower],
    }));
    console.log("Restore real prices with: npm run demo:prices -- --network base-sepolia");
    return;
  }

  throw new Error("Usage: npm run demo:reservation -- create|accept|drop [options]");
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
