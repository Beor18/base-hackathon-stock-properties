"use client";

import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { getAddress, isAddress } from "viem";

import { deployment } from "@/config/deployment";
import { useAccountSnapshot, useRates } from "@/hooks/queries";
import { useTransaction } from "@/hooks/use-transaction";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/es";
import { plans } from "@/lib/api";
import { MIN_CONTRIBUTION_USD } from "@/lib/product";
import { toBalances, toGoal } from "@/lib/view-models";
import { useAccount } from "@/lib/wallet/context";

import type { ContributionDraft } from "../contribute-screen";
import { fundHref, vaquitaHref } from "../routes";
import type { Goal } from "../types";
import { VaquitaScreen, type VaquitaScreenState } from "../vaquita-screen";
import {
  AccountUnavailable,
  contributionRequest,
  useContributionQuote,
  useRefreshAccount,
  type AccountLabels,
} from "./shared";

type Labels = Pick<Dictionary, "vaquita" | "contribute" | "signIn" | "common" | "goal"> & AccountLabels;

/**
 * The vaquita page: the goal comes from the address in the link (the owner), the money from
 * whoever is signed in (the visitor). The planner sends the bought stock to the owner.
 */
export function ConnectedVaquitaScreen({ lang, labels }: { lang: Locale; labels: Labels }) {
  const params = useParams<{ address: string }>();
  const owner = typeof params.address === "string" && isAddress(params.address) ? getAddress(params.address) : undefined;

  const session = useAccount();
  const visitor = session.status === "ready" ? session.address : undefined;
  const isOwner = visitor !== undefined && visitor.toLowerCase() === owner?.toLowerCase();

  const ownerAccount = useAccountSnapshot(owner);
  const visitorAccount = useAccountSnapshot(visitor);
  const rates = useRates();
  const refresh = useRefreshAccount();

  // Here a missing goal is the owner's, not the visitor's: never tell the visitor "you have no goal".
  const txErrors = useMemo(
    () => ({ ...labels.txErrors, codes: { ...labels.txErrors.codes, no_goal: labels.vaquita.noGoalError } }),
    [labels.txErrors, labels.vaquita.noGoalError],
  );
  const tx = useTransaction(txErrors);

  const [draft, setDraft] = useState<ContributionDraft | null>(null);
  const [success, setSuccess] = useState<{ amount: number; currency: ContributionDraft["currency"]; goal: Goal } | null>(null);

  const quoteQuery = useContributionQuote({
    payer: visitor,
    beneficiary: owner,
    draft,
    stockDecimals: ownerAccount.data?.goal?.stock.decimals,
    enabled: !isOwner && success === null,
  });

  if (session.status === "unconfigured" || session.status === "failed") {
    return <AccountUnavailable lang={lang} labels={labels} reason={session.status} />;
  }

  // One retry reloads whatever failed: the owner's goal, the visitor's balance, or both.
  const retry = () => {
    if (ownerAccount.isError) void ownerAccount.refetch();
    if (visitorAccount.isError) void visitorAccount.refetch();
  };

  let state: VaquitaScreenState;
  if (!owner) {
    state = { kind: "no-goal" };
  } else if (ownerAccount.isPending) {
    state = { kind: "loading", goal: null };
  } else if (ownerAccount.isError) {
    state = { kind: "error", onRetry: retry };
  } else if (!ownerAccount.data.goal) {
    state = { kind: "no-goal" };
  } else if (success) {
    state = { kind: "success", ...success };
  } else {
    const goal = toGoal(ownerAccount.data.goal);
    if (session.status === "loading") {
      state = { kind: "loading", goal };
    } else if (goal.savedUsd >= goal.targetUsd && tx.progress === null) {
      // Mid-transaction the form stays up, even if this very contribution completes the seña.
      state = { kind: "reached", goal, isOwner };
    } else if (session.status === "signed-out") {
      state = { kind: "signed-out", goal, feeBps: deployment.params.contributionFeeBps, signIn: session.signIn };
    } else if (isOwner) {
      const origin = typeof window === "undefined" ? "" : window.location.origin;
      state = { kind: "owner", goal, shareUrl: vaquitaHref(lang, owner, origin) };
    } else if (visitorAccount.isPending) {
      state = { kind: "loading", goal };
    } else if (visitorAccount.isError) {
      state = { kind: "error", onRetry: retry };
    } else {
      const wallet = session.wallet;
      state = {
        kind: "ready",
        goal,
        balances: toBalances(visitorAccount.data),
        currencies: ["usd", "ars"],
        minUsd: MIN_CONTRIBUTION_USD,
        feeBps: deployment.params.contributionFeeBps,
        arsPerUsd: rates.data?.arsPerUsd ?? null,
        quote: !draft ? null : quoteQuery.isError ? "error" : (quoteQuery.data ?? "loading"),
        onDraftChange: setDraft,
        tx: tx.progress,
        txError: tx.failure !== null,
        txErrorDetail: tx.failure?.detail ?? null,
        fundHref: fundHref(lang, owner),
        onSubmit: (submitted) => {
          void tx.run({
            wallet,
            planStep: true,
            plan: () => plans.contribute(contributionRequest(wallet.address, submitted, owner)),
            onSuccess: async () => {
              void refresh(wallet.address).catch(() => undefined);
              // The money already moved: confirm it even if re-reading the owner's goal fails.
              const fresh = await refresh(owner).catch(() => null);
              setSuccess({ amount: submitted.amount, currency: submitted.currency, goal: fresh?.goal ? toGoal(fresh.goal) : goal });
            },
          });
        },
      };
    }
  }

  return <VaquitaScreen lang={lang} state={state} labels={labels} />;
}
