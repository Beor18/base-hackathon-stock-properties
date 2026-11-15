import { parseUnits, type Address, type Hash, type Hex } from "viem";

import type { DeploymentInput } from "../../src/config/deployment.schema";
import {
  demoExchangeAbi,
  goalRegistryAbi,
  mockPriceFeedAbi,
  mockStockTokenAbi,
  mockUsdcAbi,
  mockWarsAbi,
  reservationEscrowAbi,
  stockOracleAbi,
} from "../../src/contracts/abis";
import { loadArtifact } from "./artifacts";
import { discoverUsdArsFeed, feedToNumber, type FeedReading } from "./chainlink";
import { confirm, connect, createMainnetClient, type Signer } from "./clients";
import { BUILDER_CODE, DEMO_FAUCET_USD, NETWORKS, PAY_TOKENS, PRODUCT, type NetworkName } from "./deploy-config";
import { writeDeployment } from "./deployment-file";
import { discoverAggregatorRouter, discoverPayTokens, type VerifiedToken } from "./mainnet-assets";
import { discoverStockUniverse, type UniverseStock } from "./stock-universe";

export type DeployOptions = {
  network: NetworkName;
  rpcUrl?: string;
  builderCode?: string;
  treasury?: Address;
  arbiter?: Address;
};

type Market = {
  usdc: Address;
  payTokens: DeploymentInput["payTokens"];
  stocks: DeploymentInput["stocks"];
  routers: Address[];
  exchange: Address | null;
};

/**
 * Deploys Seña to `network` and writes the deployment files.
 * Every live source is read before the first transaction, so a failed discovery never leaves a
 * half-deployed system behind.
 */
export async function runDeploy(options: DeployOptions) {
  const network = NETWORKS[options.network];
  const signer = await connect(options.network, options.rpcUrl);
  const owner = signer.walletClient.account.address;
  // Locally the arbiter and treasury are other Anvil accounts; on public networks they default to the deployer.
  const arbiter = options.arbiter ?? signer.extraAccounts[0] ?? owner;
  const treasury = options.treasury ?? signer.extraAccounts[1] ?? owner;
  if (options.network === "base" && (arbiter === owner || treasury === owner)) {
    console.warn("  ! Arbiter or treasury is the deployer. Pass --arbiter and --treasury (ideally a multisig).");
  }

  console.log(`Deploying to ${options.network} (${signer.rpcUrl}) as ${owner}`);
  console.log("Reading live sources...");
  const mainnet = createMainnetClient();
  const [universe, usdArs] = await Promise.all([discoverStockUniverse(mainnet), discoverUsdArsFeed(mainnet)]);
  const realAssets = network.mocks
    ? null
    : await discoverPayTokens(mainnet).then(async (payTokens) => ({
        ...payTokens,
        router: await discoverAggregatorRouter(mainnet, {
          tokenIn: universe[0].token,
          tokenOut: payTokens.usdc.address,
          amountIn: 10n ** BigInt(universe[0].decimals),
        }),
      }));
  for (const stock of universe) {
    const drop = stock.risk.worstDrop === null ? "n/a" : `-${(stock.risk.worstDrop * 100).toFixed(1)}%`;
    console.log(`  ${stock.symbol.padEnd(7)} $${stock.priceUsd.toFixed(2).padStart(9)}  worst 30d ${drop.padStart(7)}  ratio ${stock.risk.collateralRatioBps / 100}%`);
  }
  console.log(`  USD / ARS ${feedToNumber(usdArs.answer, usdArs.decimals)}`);

  const startBlock = Number(await signer.publicClient.getBlockNumber()) + 1;
  const tx = transactor(signer);

  const oracle = await tx.deploy("StockOracle", "StockOracle", (bytecode) =>
    signer.walletClient.deployContract({
      abi: stockOracleAbi,
      bytecode,
      args: [owner, BigInt(PRODUCT.settlementMaxAgeSeconds), BigInt(PRODUCT.collateralMaxAgeSeconds)],
    }),
  );

  const market = realAssets
    ? await listRealMarket(tx, signer, oracle, universe, usdArs, realAssets)
    : await deployDemoMarket(tx, signer, oracle, universe, usdArs, treasury);

  const escrow = await tx.deploy("ReservationEscrow", "ReservationEscrow", (bytecode) =>
    signer.walletClient.deployContract({
      abi: reservationEscrowAbi,
      bytecode,
      args: [
        owner,
        {
          oracle,
          usdc: market.usdc,
          maxSlippageBps: PRODUCT.maxSlippageBps,
          disputeWindow: BigInt(PRODUCT.disputeWindowSeconds),
          claimWindow: BigInt(PRODUCT.claimWindowSeconds),
          arbitrationTimeout: BigInt(PRODUCT.arbitrationTimeoutSeconds),
          defaultArbiter: arbiter,
          treasury,
          feeBps: PRODUCT.reservationFeeBps,
        },
      ],
    }),
  );
  for (const router of market.routers) {
    await tx.send(`Escrow router ${router}`, () =>
      signer.walletClient.writeContract({
        address: escrow,
        abi: reservationEscrowAbi,
        functionName: "setRouter",
        args: [router, true],
      }),
    );
  }

  const goalRegistry = await tx.deploy("GoalRegistry", "GoalRegistry", (bytecode) =>
    signer.walletClient.deployContract({ abi: goalRegistryAbi, bytecode, args: [oracle] }),
  );

  return writeDeployment({
    network: options.network,
    chainId: network.chainId,
    rpcUrl: signer.rpcUrl,
    explorerUrl: network.explorerUrl,
    rampUrl: network.rampUrl,
    deployedAt: new Date().toISOString(),
    startBlock,
    owner,
    treasury,
    arbiter,
    builderCode: options.builderCode ?? BUILDER_CODE,
    contracts: { stockOracle: oracle, reservationEscrow: escrow, goalRegistry },
    exchange: market.exchange,
    routers: market.routers,
    payTokens: market.payTokens,
    stocks: market.stocks,
    params: PRODUCT,
  });
}

/** Mainnet: the real B20 stocks and Chainlink feeds, real USDC and wARS, the aggregator as router. */
async function listRealMarket(
  tx: Transactor,
  signer: Signer,
  oracle: Address,
  universe: UniverseStock[],
  usdArs: FeedReading,
  assets: { usdc: VerifiedToken; wars: VerifiedToken; router: Address },
): Promise<Market> {
  for (const stock of universe) {
    await tx.send(`List ${stock.symbol}`, () =>
      signer.walletClient.writeContract({
        address: oracle,
        abi: stockOracleAbi,
        functionName: "setStock",
        args: [stock.token, stock.feed, stock.risk.collateralRatioBps, true],
      }),
    );
  }

  return {
    usdc: assets.usdc.address,
    payTokens: {
      usdc: { ...assets.usdc, feed: null, faucetCap: null },
      wars: { ...assets.wars, feed: arsFeedEntry(usdArs.address, usdArs, null), faucetCap: null },
    },
    stocks: universe.map((stock) => ({
      symbol: stock.symbol,
      ticker: stock.ticker,
      name: stock.name,
      token: stock.token,
      decimals: stock.decimals,
      feed: stock.feed,
      feedDecimals: stock.feedDecimals,
      collateralRatioBps: stock.risk.collateralRatioBps,
      mirrorOf: null,
      mirrorFeed: null,
    })),
    routers: [assets.router],
    exchange: null,
  };
}

/** Local and testnet: mocks mirroring every real stock, seeded with live prices, and the DemoExchange. */
async function deployDemoMarket(
  tx: Transactor,
  signer: Signer,
  oracle: Address,
  universe: UniverseStock[],
  usdArs: FeedReading,
  treasury: Address,
): Promise<Market> {
  const owner = signer.walletClient.account.address;
  const { deployContract, writeContract } = signer.walletClient;

  // Both faucets hand out the same dollars; the peso cap follows today's rate, rounded to a thousand pesos.
  const usdcCap = parseUnits(String(DEMO_FAUCET_USD), PAY_TOKENS.usdc.decimals);
  const warsWhole = Math.floor((DEMO_FAUCET_USD * feedToNumber(usdArs.answer, usdArs.decimals)) / 1_000) * 1_000;
  const warsCap = parseUnits(String(warsWhole), PAY_TOKENS.wars.decimals);

  const usdc = await tx.deploy("MockUSDC", "MockUSDC", (bytecode) =>
    deployContract({ abi: mockUsdcAbi, bytecode, args: [usdcCap, owner] }),
  );
  const wars = await tx.deploy("MockWARS", "MockWARS", (bytecode) =>
    deployContract({ abi: mockWarsAbi, bytecode, args: [warsCap, owner] }),
  );
  const arsFeed = await tx.deploy("MockPriceFeed", "MockPriceFeed USD / ARS", (bytecode) =>
    deployContract({
      abi: mockPriceFeedAbi,
      bytecode,
      args: [usdArs.decimals, usdArs.description, usdArs.answer, true],
    }),
  );
  const exchange = await tx.deploy("DemoExchange", "DemoExchange", (bytecode) =>
    deployContract({ abi: demoExchangeAbi, bytecode, args: [owner, oracle, usdc, treasury, PRODUCT.contributionFeeBps] }),
  );
  await tx.send("Exchange accepts wARS", () =>
    writeContract({
      address: exchange,
      abi: demoExchangeAbi,
      functionName: "setPayToken",
      args: [wars, arsFeed, true, true],
    }),
  );
  for (const token of [usdc, wars]) {
    // Both mocks share the MockERC20 interface.
    await tx.send("Exchange mints pay token", () =>
      writeContract({ address: token, abi: mockUsdcAbi, functionName: "setMinter", args: [exchange] }),
    );
  }

  const stocks: DeploymentInput["stocks"] = [];
  for (const stock of universe) {
    const token = await tx.deploy("MockStockToken", `MockStockToken ${stock.symbol}`, (bytecode) =>
      deployContract({
        abi: mockStockTokenAbi,
        bytecode,
        args: [stock.name, stock.symbol, stock.decimals, stock.token, owner],
      }),
    );
    const feed = await tx.deploy("MockPriceFeed", `MockPriceFeed ${stock.ticker} / USD`, (bytecode) =>
      deployContract({
        abi: mockPriceFeedAbi,
        bytecode,
        args: [stock.feedDecimals, `${stock.ticker} / USD`, stock.answer, true],
      }),
    );
    await tx.send(`List ${stock.symbol}`, () =>
      writeContract({
        address: oracle,
        abi: stockOracleAbi,
        functionName: "setStock",
        args: [token, feed, stock.risk.collateralRatioBps, true],
      }),
    );
    await tx.send(`Exchange mints ${stock.symbol}`, () =>
      writeContract({ address: token, abi: mockStockTokenAbi, functionName: "setMinter", args: [exchange] }),
    );

    stocks.push({
      symbol: stock.symbol,
      ticker: stock.ticker,
      name: stock.name,
      token,
      decimals: stock.decimals,
      feed,
      feedDecimals: stock.feedDecimals,
      collateralRatioBps: stock.risk.collateralRatioBps,
      mirrorOf: stock.token,
      mirrorFeed: stock.feed,
    });
  }

  return {
    usdc,
    payTokens: {
      usdc: {
        symbol: PAY_TOKENS.usdc.symbol,
        address: usdc,
        decimals: PAY_TOKENS.usdc.decimals,
        feed: null,
        faucetCap: usdcCap.toString(),
      },
      wars: {
        symbol: PAY_TOKENS.wars.symbol,
        address: wars,
        decimals: PAY_TOKENS.wars.decimals,
        feed: arsFeedEntry(arsFeed, usdArs, usdArs.address),
        faucetCap: warsCap.toString(),
      },
    },
    stocks,
    routers: [exchange],
    exchange,
  };
}

function arsFeedEntry(address: Address, reading: FeedReading, mirrorFeed: Address | null) {
  return {
    address,
    decimals: reading.decimals,
    description: reading.description,
    quote: "tokensPerUsd" as const,
    mirrorFeed,
  };
}

type Transactor = ReturnType<typeof transactor>;

/** Sends one transaction at a time and waits for it, logging each contract as it lands. */
function transactor(signer: Signer) {
  return {
    async deploy(contract: string, label: string, send: (bytecode: Hex) => Promise<Hash>): Promise<Address> {
      const hash = await send(loadArtifact(contract).bytecode);
      const receipt = await signer.publicClient.waitForTransactionReceipt({ hash });
      if (receipt.status !== "success" || !receipt.contractAddress) throw new Error(`${label} deploy failed (${hash})`);
      console.log(`  ${label.padEnd(30)} ${receipt.contractAddress}`);
      return receipt.contractAddress;
    },
    async send(label: string, send: () => Promise<Hash>): Promise<void> {
      await confirm(signer, await send(), label);
    },
  };
}
