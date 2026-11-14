"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { deployment } from "@/config/deployment";
import { useAccountSnapshot, useRates } from "@/hooks/queries";
import { useTransaction } from "@/hooks/use-transaction";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/es";
import { plans } from "@/lib/api";
import { MIN_CONTRIBUTION_USD } from "@/lib/product";
import { toBalances, toGoal, unitsToNumber, wadToNumber } from "@/lib/view-models";
import { useAccount } from "@/lib/wallet/context";

import {
  ContributeScreen,
  type ContributeScreenState,
  type ContributionDraft,
  type ContributionQuote,
} from "../contribute-screen";
import type { Goal } from "../types";
import { AccountUnavailable, useRefreshAccount, type AccountLabels } from "./shared";

type Labels = Pick<Dictionary, "contribute" | "signIn" | "common" | "goal"> & AccountLabels;

const payTokenOf = (currency: ContributionDraft["currency"]) => deployment.payTokens[currency === "usd" ? "usdc" : "wars"];

/** "20.5" for the planner: plain decimal text, never exponent notation. */
function amountText(amount: number, decimals: number): string {
  return amount.toFixed(Math.min(decimals, 6)).replace(/\.?0+$/, "");
}

export function ConnectedContributeScreen({ lang, labels }: { lang: Locale; labels: Labels }) {
  const session = useAccount();
  const address = session.status === "ready" ? session.address : undefined;
  const account = useAccountSnapshot(address);
  const rates = useRates();
  const refresh = useRefreshAccount();
  const tx = useTransaction(labels.txErrors);

  const [draft, setDraft] = useState<ContributionDraft | null>(null);
  const [success, setSuccess] = useState<{ amount: number; currency: ContributionDraft["currency"]; goal: Goal } | null>(null);

  const quoteQuery = useQuery({
    queryKey: ["contribute-quote", address, draft?.currency, draft?.amount],
    queryFn: async (): Promise<ContributionQuote> => {
      if (!address || !draft) throw new Error("No draft");
      const payToken = payTokenOf(draft.currency);
      const { quote } = await plans.contribute({
        account: address,
        currency: draft.currency,
        amount: amountText(draft.amount, payToken.decimals),
      });
      const stockDecimals = account.data?.goal?.stock.decimals ?? 18;
      return {
        amount: draft.amount,
        currency: draft.currency,
        sharesOut: unitsToNumber(quote.sharesOut, stockDecimals),
        sharePriceUsd: wadToNumber(quote.sharePriceUsd),
        feeAmount: unitsToNumber(quote.fee, payToken.decimals),
        valueUsd: wadToNumber(quote.valueUsd),
      };
    },
    enabled: Boolean(address && draft && account.data?.goal && success === null),
    staleTime: 15_000,
    retry: false,
  });

  if (session.status === "unconfigured" || session.status === "failed") {
    return <AccountUnavailable lang={lang} labels={labels} reason={session.status} />;
  }

  let state: ContributeScreenState;
  if (session.status === "loading") {
    state = { kind: "loading" };
  } else if (session.status === "signed-out") {
    state = { kind: "signed-out", signIn: session.signIn };
  } else if (success) {
    state = { kind: "success", ...success };
  } else if (account.isPending) {
    state = { kind: "loading" };
  } else if (account.isError) {
    state = { kind: "error", onRetry: () => void account.refetch() };
  } else if (!account.data.goal) {
    state = { kind: "no-goal" };
  } else {
    const wallet = session.wallet;
    state = {
      kind: "ready",
      goal: toGoal(account.data.goal),
      balances: toBalances(account.data),
      currencies: ["usd", "ars"],
      minUsd: MIN_CONTRIBUTION_USD,
      feeBps: deployment.params.contributionFeeBps,
      arsPerUsd: rates.data?.arsPerUsd ?? null,
      quote: !draft ? null : quoteQuery.isError ? "error" : (quoteQuery.data ?? "loading"),
      onDraftChange: setDraft,
      tx: tx.progress,
      txError: tx.failure !== null,
      txErrorDetail: tx.failure?.detail ?? null,
      onSubmit: (submitted) => {
        void tx.run({
          wallet,
          planStep: true,
          plan: () =>
            plans.contribute({
              account: wallet.address,
              currency: submitted.currency,
              amount: amountText(submitted.amount, payTokenOf(submitted.currency).decimals),
            }),
          onSuccess: async () => {
            const fresh = await refresh(wallet.address);
            if (fresh.goal) setSuccess({ amount: submitted.amount, currency: submitted.currency, goal: toGoal(fresh.goal) });
          },
        });
      },
    };
  }

  return <ContributeScreen lang={lang} state={state} labels={labels} />;
}
