"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";

import { deployment } from "@/config/deployment";
import { isTestMode } from "@/components/layout/test-mode";
import { useAccountSnapshot } from "@/hooks/queries";
import { useTransaction } from "@/hooks/use-transaction";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/es";
import { plans } from "@/lib/api";
import { RAMP_URL } from "@/lib/product";
import { toBalances, unitsToNumber } from "@/lib/view-models";
import { useAccount } from "@/lib/wallet/context";

import { FundScreen, type FundScreenState } from "../fund-screen";
import { parseFundReturn, vaquitaHref } from "../routes";
import { AccountUnavailable, useRefreshAccount, type AccountLabels } from "./shared";

type Labels = Pick<Dictionary, "fund" | "signIn" | "common" | "contribute" | "vaquita"> & AccountLabels;

const { usdc } = deployment.payTokens;
/** The test balance button tops dollars up to the faucet cap (pesos are topped up too, silently). */
const FAUCET_AMOUNT_USD = usdc.faucetCap ? unitsToNumber(usdc.faucetCap, usdc.decimals) : 0;

export function ConnectedFundScreen({ lang, labels }: { lang: Locale; labels: Labels }) {
  const session = useAccount();
  const address = session.status === "ready" ? session.address : undefined;
  const account = useAccountSnapshot(address);
  const refresh = useRefreshAccount();
  const tx = useTransaction(labels.txErrors);
  const [result, setResult] = useState<"success" | null>(null);

  // Someone adding to a vaquita came here for balance: send them back to it, not to their own goal.
  const vaquitaOwner = parseFundReturn(useSearchParams());
  const returnTo = vaquitaOwner ? { href: vaquitaHref(lang, vaquitaOwner), label: labels.vaquita.backCta } : undefined;

  if (session.status === "unconfigured" || session.status === "failed") {
    return <AccountUnavailable lang={lang} labels={labels} reason={session.status} />;
  }

  let state: FundScreenState;
  if (session.status === "loading") {
    state = { kind: "loading" };
  } else if (session.status === "signed-out") {
    state = { kind: "signed-out", signIn: session.signIn };
  } else if (account.isError) {
    state = { kind: "error", onRetry: () => void account.refetch() };
  } else {
    const wallet = session.wallet;
    state = {
      kind: "ready",
      address: wallet.address,
      balances: account.data ? toBalances(account.data) : null,
      testMode: isTestMode(),
      faucetAmountUsd: FAUCET_AMOUNT_USD,
      faucet: tx.progress ?? (tx.failure ? "error" : result),
      faucetErrorDetail: tx.failure?.detail ?? null,
      rampUrl: RAMP_URL,
      onFaucet: () => {
        setResult(null);
        void tx
          .run({
            wallet,
            planStep: false,
            plan: () => plans.faucet({ account: wallet.address }),
            onSuccess: () => refresh(wallet.address),
          })
          .then((quote) => quote && setResult("success"));
      },
    };
  }

  return <FundScreen lang={lang} state={state} labels={labels} returnTo={returnTo} />;
}
