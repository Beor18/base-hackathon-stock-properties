"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { keys, useAccountSnapshot, useReservation } from "@/hooks/queries";
import { useTransaction } from "@/hooks/use-transaction";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/es";
import { api, ApiClientError, plans } from "@/lib/api";
import { toGoal, unitsToNumber, wadToNumber } from "@/lib/view-models";
import { useAccount } from "@/lib/wallet/context";

import { ReserveScreen, type ReserveScreenState } from "../reserve-screen";
import { goalDraftHref, parseOfferId } from "../routes";
import { AccountUnavailable, useRefreshAccount, type AccountLabels } from "./shared";

type Labels = Pick<Dictionary, "reserve" | "signIn" | "common" | "goal" | "contribute"> & AccountLabels;

/**
 * The broker's offer id, remembered per house in this browser: someone who opens the link before
 * saving can reserve later from their goal without asking for it again. A convenience only; the
 * copy tells people to keep the link.
 */
const offerKey = (ref: string) => `accasa-offer:${ref}`;

function rememberOfferId(ref: string, id: string) {
  try {
    window.localStorage.setItem(offerKey(ref), id);
  } catch {
    // Private mode or blocked storage: the link still works when opened again.
  }
}

function recallOfferId(ref: string): string | null {
  try {
    const id = window.localStorage.getItem(offerKey(ref));
    return id && /^[A-Za-z0-9]{10}$/.test(id) ? id : null;
  } catch {
    return null;
  }
}

export function ConnectedReserveScreen({ lang, labels }: { lang: Locale; labels: Labels }) {
  const searchParams = useSearchParams();
  const linkOfferId = parseOfferId(searchParams);

  const session = useAccount();
  const address = session.status === "ready" ? session.address : undefined;
  const account = useAccountSnapshot(address);
  const goalView = account.data?.goal ?? null;
  // Without a link in the URL, fall back to the one this browser saw for the goal's house.
  const goalRef = goalView?.property.ref ?? null;
  const offerId = linkOfferId ?? (goalRef ? recallOfferId(goalRef) : null);
  const offerQuery = useQuery({
    queryKey: ["offer", offerId],
    queryFn: () => api.offer(offerId!),
    enabled: offerId !== null,
    staleTime: Infinity,
    retry: (count, error) => !(error instanceof ApiClientError && error.status === 404) && count < 2,
  });
  const offer = offerQuery.data ?? null;
  useEffect(() => {
    if (linkOfferId && offer) rememberOfferId(offer.ref, linkOfferId);
  }, [linkOfferId, offer]);

  const queryClient = useQueryClient();
  const refresh = useRefreshAccount();
  const tx = useTransaction(labels.txErrors);
  const [createdId, setCreatedId] = useState<string | null>(null);

  const reservationId = createdId ?? goalView?.activeReservationId ?? null;
  const reservation = useReservation(reservationId);

  const quote = useQuery({
    queryKey: ["reserve-quote", address, offer?.id],
    queryFn: async () => {
      if (!address || !offer) throw new Error("No offer");
      return (await plans.reserve({ account: address, ref: offer.ref, url: offer.sourceUrl, pct: offer.pct, broker: offer.broker })).quote;
    },
    enabled: Boolean(address && offer && goalView && !reservationId),
    staleTime: 15_000,
    retry: false,
  });

  if (session.status === "unconfigured" || session.status === "failed") {
    return <AccountUnavailable lang={lang} labels={labels} reason={session.status} />;
  }

  let state: ReserveScreenState;
  if (session.status === "loading") {
    state = { kind: "loading" };
  } else if (session.status === "signed-out") {
    state = { kind: "signed-out", signIn: session.signIn };
  } else if (account.isPending) {
    state = { kind: "loading" };
  } else if (account.isError) {
    state = { kind: "error", onRetry: () => void account.refetch() };
  } else if (linkOfferId && offerQuery.isPending) {
    state = { kind: "loading" };
  } else if (linkOfferId && offerQuery.isError) {
    state =
      offerQuery.error instanceof ApiClientError && offerQuery.error.status === 404
        ? { kind: "offer-missing" }
        : { kind: "error", onRetry: () => void offerQuery.refetch() };
  } else if (!goalView && offer) {
    // Opened the broker's link before saving: start a goal for that house with the link's seña.
    state = {
      kind: "offer-no-goal",
      offer: { brokerName: offer.brokerName, brokerCompany: offer.brokerCompany, depositPct: offer.pct, verified: offer.verified },
      setupHref: goalDraftHref(lang, { ref: offer.ref, pct: offer.pct, manualPriceUsd: null, sourceUrl: offer.sourceUrl }),
    };
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
  } else if (offerId && offerQuery.isPending) {
    // An offer this browser remembered for the goal's house is still loading.
    state = { kind: "loading" };
  } else if (!offer) {
    const goal = toGoal(goalView);
    if (!goalView.reached) {
      state = { kind: "not-reached", goal };
    } else {
      // The broker generates the link on Accasa itself, so the message points straight at that page.
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
        offer: { brokerName: offer.brokerName, brokerCompany: offer.brokerCompany, depositPct: offer.pct, verified: offer.verified },
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
            plan: () => plans.reserve({ account: wallet.address, ref: offer.ref, url: offer.sourceUrl, pct: offer.pct, broker: offer.broker }),
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
