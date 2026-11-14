"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import type { Address } from "viem";

import { deployment } from "@/config/deployment";
import { collateralFor, feeFor, tokensToUsd, WAD } from "@/domain/collateral";
import { useAccountSnapshot, useProperty, useStocks } from "@/hooks/queries";
import { useTransaction } from "@/hooks/use-transaction";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/es";
import { plans } from "@/lib/api";
import { depositUsd } from "@/lib/product";
import { detailToGoalProperty, toGoal, toStockOption, wadToNumber } from "@/lib/view-models";
import { useAccount } from "@/lib/wallet/context";

import { GoalScreen, type GoalScreenState } from "../goal-screen";
import { parseGoalDraft } from "../routes";
import type { GoalDraft } from "../types";
import { AccountUnavailable, useRefreshAccount, type AccountLabels } from "./shared";

type Labels = Pick<Dictionary, "goal" | "signIn" | "common"> & AccountLabels;

/** USD in `stock` needed to reserve `senaUsd`, mirroring the reservation planner's math. */
function needUsdFor(stock: { priceUsd: string; decimals: number; collateralRatioBps: number }, senaUsd: number): number {
  const coverageUsd = BigInt(Math.round(senaUsd)) * WAD;
  const priceUsd = BigInt(stock.priceUsd);
  const pricing = { coverageUsd, priceUsd, tokenDecimals: stock.decimals };
  const tokens =
    collateralFor({ ...pricing, collateralRatioBps: stock.collateralRatioBps }) +
    feeFor({ ...pricing, feeBps: deployment.params.reservationFeeBps });
  return wadToNumber(tokensToUsd(tokens, priceUsd, stock.decimals));
}

export function ConnectedGoalScreen({ lang, labels }: { lang: Locale; labels: Labels }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const draftParams = useMemo(() => parseGoalDraft(searchParams), [searchParams]);

  const session = useAccount();
  const address = session.status === "ready" ? session.address : undefined;
  const account = useAccountSnapshot(address);
  const property = useProperty(draftParams?.ref ?? null, draftParams?.sourceUrl ?? null);
  const stocks = useStocks();
  const refresh = useRefreshAccount();
  const tx = useTransaction(labels.txErrors);

  const [selectedStockId, setSelectedStockId] = useState<string | null>(null);
  const [justSaved, setJustSaved] = useState(false);

  const draft = useMemo<GoalDraft | null>(() => {
    if (!draftParams || !property.data) return null;
    const isLink = property.data.provider === "link";
    const priceUsd = property.data.priceUsd ?? (isLink ? draftParams.manualPriceUsd : null);
    if (!priceUsd) return null;
    return {
      property: detailToGoalProperty(property.data, priceUsd),
      depositPct: draftParams.pct,
      targetUsd: depositUsd(priceUsd, draftParams.pct),
    };
  }, [draftParams, property.data]);

  if (session.status === "unconfigured") return <AccountUnavailable lang={lang} labels={labels} />;

  let state: GoalScreenState;
  if (session.status === "loading") {
    state = { kind: "loading" };
  } else if (session.status === "signed-out") {
    state = { kind: "signed-out", signIn: session.signIn, draft };
  } else if (account.isPending || (draftParams && (property.isPending || stocks.isPending))) {
    state = { kind: "loading" };
  } else if (account.isError || (draftParams && (property.isError || stocks.isError || !draft))) {
    state = {
      kind: "error",
      onRetry: () => {
        void account.refetch();
        if (draftParams) void Promise.all([property.refetch(), stocks.refetch()]);
      },
    };
  } else if (draftParams && draft && stocks.data) {
    const options = stocks.data.filter((stock) => stock.enabled).map((stock) => toStockOption(stock, needUsdFor(stock, draft.targetUsd)));
    const wallet = session.wallet;
    state = {
      kind: "setup",
      draft,
      stocks: options,
      selectedStockId,
      onSelectStock: setSelectedStockId,
      saving: tx.progress,
      saveError: tx.failure !== null,
      saveErrorDetail: tx.failure?.detail ?? null,
      onSave: () => {
        if (!selectedStockId) return;
        void tx
          .run({
            wallet,
            planStep: false,
            plan: () =>
              plans.goal({
                account: wallet.address,
                ref: draftParams.ref,
                url: draftParams.sourceUrl,
                pct: draftParams.pct,
                manualPriceUsd: draftParams.manualPriceUsd,
                stock: selectedStockId as Address,
              }),
            onSuccess: () => refresh(wallet.address),
          })
          .then((quote) => {
            if (!quote) return;
            setJustSaved(true);
            router.replace(`/${lang}/meta`);
          });
      },
    };
  } else if (account.data.goal) {
    state = { kind: "active", goal: toGoal(account.data.goal), justSaved };
  } else {
    state = { kind: "empty" };
  }

  return <GoalScreen lang={lang} state={state} labels={labels} />;
}
