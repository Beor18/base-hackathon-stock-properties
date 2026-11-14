"use client";

import { useParams } from "next/navigation";
import { useState } from "react";

import { useReservation } from "@/hooks/queries";
import { useTransaction } from "@/hooks/use-transaction";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/es";
import { ApiClientError, plans, type ReservationActionBody } from "@/lib/api";
import { toReservationView } from "@/lib/view-models";
import { useAccount } from "@/lib/wallet/context";

import {
  ReservationScreen,
  type ReservationAction,
  type ReservationActions,
  type ReservationRole,
  type ReservationScreenState,
} from "../reservation-screen";
import { useRefreshAccount, type AccountLabels } from "./shared";

type Labels = Pick<Dictionary, "reservation" | "reserve" | "common"> & AccountLabels;

export function ConnectedReservationScreen({ lang, labels }: { lang: Locale; labels: Labels }) {
  const params = useParams<{ id: string }>();
  const id = typeof params.id === "string" && /^[1-9]\d{0,30}$/.test(params.id) ? params.id : null;

  const session = useAccount();
  const address = session.status === "ready" ? session.address : undefined;
  const reservation = useReservation(id);
  const refresh = useRefreshAccount();
  const tx = useTransaction(labels.txErrors);
  const [action, setAction] = useState<ReservationAction | null>(null);

  let state: ReservationScreenState;
  if (!id || (reservation.error instanceof ApiClientError && reservation.error.status === 404)) {
    state = { kind: "not-found" };
  } else if (reservation.isPending) {
    state = { kind: "loading" };
  } else if (reservation.isError) {
    state = { kind: "error", onRetry: () => void reservation.refetch() };
  } else {
    const data = reservation.data;
    const view = toReservationView(data, `${labels.reservation.title} #${data.id}`);
    const same = (value: string) => address !== undefined && value.toLowerCase() === address.toLowerCase();
    const role: ReservationRole = same(data.depositor)
      ? "depositor"
      : same(data.beneficiary)
        ? "beneficiary"
        : same(data.arbiter)
          ? "arbiter"
          : "viewer";

    const actions: ReservationActions = {};
    if (session.status === "ready") {
      const wallet = session.wallet;
      const send = (body: ReservationActionBody) => {
        setAction(body.action);
        void tx.run({
          wallet,
          // Settling sells stock first: that sale gets its own step on screen.
          planStep: body.action === "settle",
          plan: () => plans.reservation({ ...body, account: wallet.address }),
          onSuccess: () => Promise.all([reservation.refetch(), refresh(wallet.address)]),
        });
      };
      const open = data.status === "active";

      if (open && role === "beneficiary") {
        actions.onRelease = () => send({ action: "release", id: data.id });
        if (!data.claim && data.chainTime <= data.claimDeadline) {
          actions.onClaim = (amountUsd, reason) =>
            send({ action: "claim", id: data.id, amountUsd, reason: reason === "backed-out" ? "backed_out" : "other" });
        }
      }
      if (open && role === "depositor" && data.claim?.status === "filed" && !data.claim.isPayable) {
        actions.onAccept = () => send({ action: "accept", id: data.id });
        actions.onDispute = () => send({ action: "dispute", id: data.id });
      }
      if (open && role === "arbiter" && data.claim?.status === "disputed") {
        actions.onResolve = (inFavorOf) => send({ action: "resolve", id: data.id, inFavorOf });
      }
      // Paying an approved claim and releasing an expired reservation are open to anyone.
      if (open && data.claim?.isPayable) actions.onSettle = () => send({ action: "settle", id: data.id });
      if (open && view.status === "expired" && !actions.onRelease) {
        actions.onRelease = () => send({ action: "release", id: data.id });
      }
    }

    state = {
      kind: "ready",
      reservation: view,
      role,
      actions,
      pending: tx.progress && action ? { action, step: tx.progress.step } : null,
      actionError: tx.failure !== null,
      actionErrorDetail: tx.failure?.detail ?? null,
      shareUrl: typeof window === "undefined" ? `/${lang}/r/${data.id}` : `${window.location.origin}/${lang}/r/${data.id}`,
    };
  }

  return <ReservationScreen lang={lang} state={state} labels={labels} />;
}
