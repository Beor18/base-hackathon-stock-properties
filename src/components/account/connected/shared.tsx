"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import type { Address } from "viem";

import { deployment } from "@/config/deployment";
import { Screen, StateMessage } from "@/components/layout/screen";
import { Button, ButtonLink } from "@/components/ui/button";
import { WaitBar } from "@/components/ui/wait-bar";
import { keys } from "@/hooks/queries";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/es";
import { api, plans } from "@/lib/api";
import { unitsToNumber, wadToNumber } from "@/lib/view-models";

import type { ContributionDraft, ContributionQuote } from "../contribute-screen";

/**
 * Pieces shared by the account screen containers (`src/components/account/connected/*`). Each
 * container builds its screen's `state` from the session, the API routes and the planners.
 */

export type AccountLabels = Pick<Dictionary, "account" | "txErrors" | "common">;

/**
 * The account cannot be used, and the screen says why instead of crashing or waiting forever:
 * - `unconfigured`: public network without the sign-in app id.
 * - `failed`: signed in, but the account never became usable. Reloading usually fixes it.
 */
export function AccountUnavailable({
  lang,
  labels,
  reason,
}: {
  lang: Locale;
  labels: AccountLabels;
  reason: "unconfigured" | "failed";
}) {
  if (reason === "failed") {
    return (
      <Screen>
        <StateMessage title={labels.account.failedTitle} body={labels.account.failedBody}>
          <Button onClick={() => window.location.reload()} className="w-full sm:w-auto">
            {labels.account.reload}
          </Button>
        </StateMessage>
      </Screen>
    );
  }
  return (
    <Screen>
      <StateMessage title={labels.account.unconfiguredTitle} body={labels.account.unconfiguredBody}>
        <ButtonLink href={`/${lang}/casa`} variant="secondary" className="w-full sm:w-auto">
          {labels.common.back}
        </ButtonLink>
      </StateMessage>
    </Screen>
  );
}

/** Session still resolving (right after login the account takes a moment to exist). */
export function AccountPreparing({ title, labels }: { title?: string; labels: AccountLabels }) {
  return (
    <Screen title={title}>
      <WaitBar steps={[labels.account.preparing]} typicalSeconds={labels.account.preparingSeconds} labels={labels.common} />
    </Screen>
  );
}

/** Refetches the account snapshot (and what depends on it) after a transaction, returning the fresh one. */
export function useRefreshAccount() {
  const queryClient = useQueryClient();
  return useCallback(
    async (address: Address) => {
      void queryClient.invalidateQueries({ queryKey: keys.stats });
      void queryClient.invalidateQueries({ queryKey: ["reservation"] });
      return queryClient.fetchQuery({ queryKey: keys.account(address), queryFn: () => api.account(address), staleTime: 0 });
    },
    [queryClient],
  );
}

const payTokenOf = (currency: ContributionDraft["currency"]) => deployment.payTokens[currency === "usd" ? "usdc" : "wars"];

/**
 * The planner request for a contribution. `beneficiary` is the goal's owner when someone else pays
 * (a vaquita); without it the payer adds to their own goal.
 */
export function contributionRequest(payer: Address, draft: ContributionDraft, beneficiary?: Address) {
  const { decimals } = payTokenOf(draft.currency);
  return {
    account: payer,
    currency: draft.currency,
    // Plain decimal text ("20.5"), never exponent notation.
    amount: draft.amount.toFixed(Math.min(decimals, 6)).replace(/\.?0+$/, ""),
    ...(beneficiary ? { beneficiary } : {}),
  };
}

/** Prices the amount being typed with the same planner that will build the transaction. */
export function useContributionQuote({
  payer,
  beneficiary,
  draft,
  stockDecimals,
  enabled,
}: {
  payer: Address | undefined;
  beneficiary?: Address;
  draft: ContributionDraft | null;
  /** Decimals of the goal's stock; undefined until the goal is known. */
  stockDecimals: number | undefined;
  enabled: boolean;
}) {
  return useQuery({
    queryKey: ["contribute-quote", payer, beneficiary ?? null, draft?.currency, draft?.amount],
    queryFn: async (): Promise<ContributionQuote> => {
      if (!payer || !draft || stockDecimals === undefined) throw new Error("No draft");
      const { quote } = await plans.contribute(contributionRequest(payer, draft, beneficiary));
      return {
        amount: draft.amount,
        currency: draft.currency,
        sharesOut: unitsToNumber(quote.sharesOut, stockDecimals),
        sharePriceUsd: wadToNumber(quote.sharePriceUsd),
        feeAmount: unitsToNumber(quote.fee, payTokenOf(draft.currency).decimals),
        valueUsd: wadToNumber(quote.valueUsd),
      };
    },
    enabled: Boolean(payer && draft && stockDecimals !== undefined && enabled),
    staleTime: 15_000,
    retry: false,
  });
}
