"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { deployment } from "@/config/deployment";
import { useAccountSnapshot, useInboxSeen, useReservationsOf } from "@/hooks/queries";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/es";
import { api } from "@/lib/api";
import { inboxHasNews, toBalances, toGoal, toInbox } from "@/lib/view-models";
import { useAccount } from "@/lib/wallet/context";

import { ProfileScreen, type ProfileScreenState } from "../profile-screen";
import { AccountUnavailable, type AccountLabels } from "./shared";

type Labels = Pick<Dictionary, "profile" | "fund" | "signIn" | "common" | "reservation"> & AccountLabels;

export function ConnectedProfileScreen({ lang, labels }: { lang: Locale; labels: Labels }) {
  const router = useRouter();
  const session = useAccount();
  const address = session.status === "ready" ? session.address : undefined;
  const account = useAccountSnapshot(address);
  const reservations = useReservationsOf(address);
  const seen = useInboxSeen(address);
  const [signingOut, setSigningOut] = useState(false);

  // The markers below stay as they were when the page opened; the visit itself marks them as read.
  const inbox = reservations.data && seen.isFetched && address ? toInbox(reservations.data, address, seen.data?.seenAt ?? null) : [];
  const hasNews = inboxHasNews(inbox);
  const marked = useRef(false);
  useEffect(() => {
    if (!hasNews || marked.current || session.status !== "ready") return;
    marked.current = true;
    session
      .identityToken()
      .then((token) => (token ? api.markInboxSeen(session.address, token) : null))
      .catch((error: unknown) => console.warn("[account] could not mark the inbox as read", error));
  }, [hasNews, session]);

  if (session.status === "unconfigured" || session.status === "failed") {
    return <AccountUnavailable lang={lang} labels={labels} reason={session.status} />;
  }

  let state: ProfileScreenState;
  if (session.status === "loading") {
    state = { kind: "loading" };
  } else if (session.status === "signed-out") {
    state = { kind: "signed-out", signIn: session.signIn };
  } else if (account.isError) {
    state = { kind: "error", onRetry: () => void account.refetch() };
  } else if (!account.data || reservations.isPending || seen.isPending) {
    // Wait for the whole account: rendering early showed "no goal" and grew the cards, which slid
    // "Cerrar sesión" under the finger that was about to press the main button.
    state = { kind: "loading" };
  } else {
    const { signOut } = session;
    state = {
      kind: "ready",
      address: session.address,
      email: session.email,
      balances: toBalances(account.data),
      inbox,
      goal: account.data.goal ? toGoal(account.data.goal) : null,
      activityUrl: deployment.explorerUrl ? `${deployment.explorerUrl}/address/${session.address}` : null,
      signingOut,
      onSignOut: () => {
        setSigningOut(true);
        signOut()
          .then(() => router.replace(`/${lang}`))
          .catch((error: unknown) => {
            console.error("[account] sign out failed", error);
            setSigningOut(false);
          });
      },
    };
  }

  return <ProfileScreen lang={lang} state={state} labels={labels} />;
}
