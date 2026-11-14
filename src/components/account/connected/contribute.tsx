"use client";

import { useState } from "react";

import { deployment } from "@/config/deployment";
import { useAccountSnapshot, useRates } from "@/hooks/queries";
import { useTransaction } from "@/hooks/use-transaction";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/es";
import { plans } from "@/lib/api";
import { MIN_CONTRIBUTION_USD } from "@/lib/product";
import { toBalances, toGoal } from "@/lib/view-models";
import { useAccount } from "@/lib/wallet/context";

import { ContributeScreen, type ContributeScreenState, type ContributionDraft } from "../contribute-screen";
import type { Goal } from "../types";
import {
  AccountUnavailable,
  contributionRequest,
  useContributionQuote,
  useRefreshAccount,
  type AccountLabels,
} from "./shared";

type Labels = Pick<Dictionary, "contribute" | "signIn" | "common" | "goal"> & AccountLabels;

export function ConnectedContributeScreen({ lang, labels }: { lang: Locale; labels: Labels }) {
  const session = useAccount();
  const address = session.status === "ready" ? session.address : undefined;
  const account = useAccountSnapshot(address);
  const rates = useRates();
  const refresh = useRefreshAccount();
  const tx = useTransaction(labels.txErrors);

  const [draft, setDraft] = useState<ContributionDraft | null>(null);
  const [success, setSuccess] = useState<{ amount: number; currency: ContributionDraft["currency"]; goal: Goal } | null>(null);

  const quoteQuery = useContributionQuote({
    payer: address,
    draft,
    stockDecimals: account.data?.goal?.stock.decimals,
    enabled: success === null,
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
          plan: () => plans.contribute(contributionRequest(wallet.address, submitted)),
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
