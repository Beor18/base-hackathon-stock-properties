import "server-only";

import { encodeFunctionData, parseUnits, type Address } from "viem";
import { z } from "zod";

import { deployment } from "@/config/deployment";
import { demoExchangeAbi } from "@/contracts/abis";
import { BPS, tokensToUsd, WAD } from "@/domain/collateral";
import type { ContributionPlanQuote, Plan, PlannedCall, Stock } from "@/domain/types";
import { CONTRIBUTION_SLIPPAGE_BPS, MIN_CONTRIBUTION_USD } from "@/lib/product";
import { exchangeContract, publicClient } from "@/server/chain";
import { buildSwap, getSwapRoute } from "@/server/clients/kyberswap";
import { BadRequestError, ConflictError } from "@/server/errors";
import { addressParam, decimalAmountParam } from "@/server/schemas";
import { balanceOf, readGoal } from "@/server/services/accounts";
import { getUsdArsRate } from "@/server/services/rates";
import { requireStock } from "@/server/services/stocks";

import { approveCall, plannedCall, simulatePlan } from "./shared";

export const contributePlanSchema = z.object({
  account: addressParam,
  currency: z.enum(["usd", "ars"]),
  /** Amount in the pay currency, as typed: "20", "25000.5". */
  amount: decimalAmountParam,
  /** Vaquita: the account whose goal receives the stock. `account` still pays. Omitted: `account` itself. */
  beneficiary: addressParam.optional(),
});

type Input = z.infer<typeof contributePlanSchema>;
type Priced = { calls: PlannedCall[]; sharesOut: bigint; fee: bigint };

/**
 * A contribution: dollars or pesos in, the goal's stock out, in one batch (approve + buy).
 * Local and testnet buy from the DemoExchange; mainnet routes through the aggregator, which sends
 * the contribution fee to the treasury.
 *
 * With `beneficiary` (a vaquita) the goal is the beneficiary's and the stock lands in their account;
 * the balance check and the simulation stay on `account`, who pays and signs.
 */
export async function planContribution(input: Input): Promise<Plan<ContributionPlanQuote>> {
  const recipient = input.beneficiary ?? input.account;
  const goal = await readGoal(recipient);
  if (!goal) throw new ConflictError("no_goal", "The account has no goal yet");

  const payToken = deployment.payTokens[input.currency === "usd" ? "usdc" : "wars"];
  const amountIn = parseUnits(input.amount, payToken.decimals);

  const [stock, balance, amountUsd] = await Promise.all([
    requireStock(goal.stock),
    balanceOf(payToken.address, input.account),
    payTokenToUsd(payToken.address, payToken.decimals, input.currency, amountIn),
  ]);
  if (amountUsd < BigInt(MIN_CONTRIBUTION_USD) * WAD) {
    throw new BadRequestError(`The minimum contribution is USD ${MIN_CONTRIBUTION_USD}`, "below_minimum");
  }
  if (balance < amountIn) throw new ConflictError("insufficient_balance", "Not enough balance for this contribution");

  const priced = exchangeContract
    ? await viaDemoExchange(recipient, stock, payToken.address, amountIn)
    : await viaAggregator(input.account, recipient, stock, payToken.address, amountIn);

  await simulatePlan(input.account, priced.calls);

  const sharePriceUsd = BigInt(stock.priceUsd);
  return {
    calls: priced.calls,
    quote: {
      currency: input.currency,
      amountIn: amountIn.toString(),
      fee: priced.fee.toString(),
      feeBps: deployment.params.contributionFeeBps,
      sharesOut: priced.sharesOut.toString(),
      sharePriceUsd: sharePriceUsd.toString(),
      valueUsd: tokensToUsd(priced.sharesOut, sharePriceUsd, stock.decimals).toString(),
    },
  };
}

async function payTokenToUsd(token: Address, decimals: number, currency: Input["currency"], amount: bigint): Promise<bigint> {
  if (currency === "usd") return amount * 10n ** BigInt(18 - decimals);
  if (exchangeContract) {
    return publicClient.readContract({ ...exchangeContract, functionName: "payTokenToUsd", args: [token, amount] });
  }
  const { arsPerUsd } = await getUsdArsRate();
  return (amount * 10n ** BigInt(18 - decimals) * 1_000_000n) / BigInt(Math.round(arsPerUsd * 1_000_000));
}

async function viaDemoExchange(recipient: Address, stock: Stock, payToken: Address, amountIn: bigint): Promise<Priced> {
  if (!exchangeContract) throw new Error("No demo exchange on this network");

  const [sharesOut, fee] = await publicClient.readContract({
    ...exchangeContract,
    functionName: "quoteBuy",
    args: [stock.address, payToken, amountIn],
  });
  if (sharesOut === 0n) throw new BadRequestError("The amount is too small to buy any shares", "below_minimum");
  const minOut = (sharesOut * (BPS - BigInt(CONTRIBUTION_SLIPPAGE_BPS))) / BPS;

  return {
    sharesOut,
    fee,
    calls: [
      approveCall(payToken, exchangeContract.address, amountIn),
      plannedCall(
        exchangeContract.address,
        encodeFunctionData({
          abi: demoExchangeAbi,
          functionName: "buy",
          args: [stock.address, payToken, amountIn, minOut, recipient],
        }),
      ),
    ],
  };
}

async function viaAggregator(
  account: Address,
  recipient: Address,
  stock: Stock,
  payToken: Address,
  amountIn: bigint,
): Promise<Priced> {
  const feeBps = deployment.params.contributionFeeBps;
  const route = await getSwapRoute({
    tokenIn: payToken,
    tokenOut: stock.address,
    amountIn,
    fee: { bps: feeBps, receiver: deployment.treasury },
    origin: account,
  });
  const built = await buildSwap({
    route,
    sender: account,
    recipient,
    slippageBps: CONTRIBUTION_SLIPPAGE_BPS,
  });

  // Never approve an address the deploy did not verify as the aggregator's router.
  if (!deployment.routers.some((router) => router.toLowerCase() === built.router.toLowerCase())) {
    throw new ConflictError("no_route", `Unexpected router ${built.router}`);
  }
  if (built.amountIn > amountIn) throw new ConflictError("no_route", "The route spends more than requested");

  return {
    sharesOut: built.amountOut,
    fee: (amountIn * BigInt(feeBps)) / BPS,
    calls: [approveCall(payToken, built.router, amountIn), plannedCall(built.router, built.data, built.value)],
  };
}
