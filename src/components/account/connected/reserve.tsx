"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { getAddress, isAddress } from "viem";

import { keys, useAccountSnapshot, useReservation } from "@/hooks/queries";
import { useTransaction } from "@/hooks/use-transaction";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/es";
import { api, plans } from "@/lib/api";
import { toGoal, unitsToNumber, wadToNumber } from "@/lib/view-models";
import { useAccount } from "@/lib/wallet/context";

import { ReserveScreen, type ReserveScreenState } from "../reserve-screen";
import { parseReservationOffer } from "../routes";
import { AccountUnavailable, useRefreshAccount, type AccountLabels } from "./shared";

type Labels = Pick<Dictionary, "reserve" | "signIn" | "common" | "goal" | "contribute"> & AccountLabels;

export function ConnectedReserveScreen({ lang, labels }: { lang: Locale; labels: Labels }) {
  const searchParams = useSearchParams();
  const offer = useMemo(() => {
    const parsed = parseReservationOffer(searchParams);
    return parsed && isAddress(parsed.broker) ? { ...parsed, broker: getAddress(parsed.broker) } : null;
  }, [searchParams]);

  const session = useAccount();
  const address = session.status === "ready" ? session.address : undefined;
  const account = useAccountSnapshot(address);
  const goalView = account.data?.goal ?? null;
  const queryClient = useQueryClient();
  const refresh = useRefreshAccount();
  const tx = useTransaction(labels.txErrors);
  const [createdId, setCreatedId] = useState<string | null>(null);

  const reservationId = createdId ?? goalView?.activeReservationId ?? null;
  const reservation = useReservation(reservationId);

  const quote = useQuery({
    queryKey: ["reserve-quote", address, offer?.ref, offer?.pct, offer?.broker],
    queryFn: async () => {
      if (!address || !offer) throw new Error("No offer");
      return (await plans.reserve({ account: address, ref: offer.ref, url: null, pct: offer.pct, broker: offer.broker })).quote;
    },
    enabled: Boolean(address && offer && goalView && !reservationId),
    staleTime: 15_000,
    retry: false,
  });

  if (session.status === "unconfigured") return <AccountUnavailable lang={lang} labels={labels} />;

  let state: ReserveScreenState;
  if (session.status === "loading") {
    state = { kind: "loading" };
  } else if (session.status === "signed-out") {
    state = { kind: "signed-out", signIn: session.signIn };
  } else if (account.isPending) {
    state = { kind: "loading" };
  } else if (account.isError) {
    state = { kind: "error", onRetry: () => void account.refetch() };
  } else if (!goalView) {
    state = { kind: "no-goal" };
  } else if (reservationId) {
    // Already reserved: the screen shows the reservation instead of offering a second one.
    state = reservation.data
      ? {
          kind: "success",
          goal: toGoal(goalView),
          reservationId,
          reservationUrl: `${window.location.origin}/${lang}/r/${reservationId}`,
          endsAt: reservation.data.endsAt,
        }
      : reservation.isError
        ? { kind: "error", onRetry: () => void reservation.refetch() }
        : { kind: "loading" };
  } else if (!offer) {
    const goal = toGoal(goalView);
    if (!goalView.reached) {
      state = { kind: "not-reached", goal };
    } else {
      // The broker generates the link on Seña itself, so the message points straight at that page.
      const params = new URLSearchParams({ casa: goalView.property.ref });
      if (goalView.property.ref.startsWith("link:") && goalView.property.sourceUrl) params.set("url", goalView.property.sourceUrl);
      state = {
        kind: "no-link",
        goal,
        agent: goalView.property.agent ? { name: goalView.property.agent.name, phone: null } : null,
        listingUrl: `${window.location.origin}/${lang}/pedir?${params}`,
      };
    }
  } else if (quote.isPending) {
    state = { kind: "loading" };
  } else if (quote.isError) {
    state = { kind: "error", onRetry: () => void quote.refetch() };
  } else {
    const q = quote.data;
    const goal = {
      ...toGoal(goalView),
      // The broker's link sets the seña, so the target follows it.
      targetUsd: wadToNumber(q.need.totalValueUsd),
      senaUsd: wadToNumber(q.senaUsd),
      depositPct: q.depositPct,
    };
    if (!q.reached) {
      state = { kind: "not-reached", goal };
    } else {
      const wallet = session.wallet;
      state = {
        kind: "ready",
        goal,
        offer: { brokerName: offer.brokerName, brokerCompany: offer.brokerCompany, depositPct: offer.pct },
        senaUsd: wadToNumber(q.senaUsd),
        lock: { shares: unitsToNumber(q.need.collateral, goalView.stock.decimals), valueUsd: wadToNumber(q.need.collateralValueUsd) },
        feeBps: q.feeBps,
        feeUsd: wadToNumber(q.need.feeUsd),
        endsAt: q.endsAt,
        tx: tx.progress,
        txError: tx.failure !== null,
        txErrorDetail: tx.failure?.detail ?? null,
        onReserve: () => {
          void tx.run({
            wallet,
            planStep: true,
            plan: () => plans.reserve({ account: wallet.address, ref: offer.ref, url: null, pct: offer.pct, broker: offer.broker }),
            onSuccess: async () => {
              const [fresh, mine] = await Promise.all([refresh(wallet.address), api.reservationsOf(wallet.address)]);
              const created =
                fresh.goal?.activeReservationId ??
                mine.find((item) => item.status === "active" && item.depositor === wallet.address)?.id ??
                null;
              // Load the new reservation before leaving the progress bar, so the success screen has it.
              if (created) await queryClient.fetchQuery({ queryKey: keys.reservation(created), queryFn: () => api.reservation(created) });
              setCreatedId(created);
            },
          });
        },
      };
    }
  }

  return <ReserveScreen lang={lang} state={state} labels={labels} />;
}
