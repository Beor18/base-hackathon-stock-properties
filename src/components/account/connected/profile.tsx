"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { deployment } from "@/config/deployment";
import { useAccountSnapshot } from "@/hooks/queries";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/es";
import { toBalances, toGoal } from "@/lib/view-models";
import { useAccount } from "@/lib/wallet/context";

import { ProfileScreen, type ProfileScreenState } from "../profile-screen";
import { AccountUnavailable, type AccountLabels } from "./shared";

type Labels = Pick<Dictionary, "profile" | "fund" | "signIn" | "common"> & AccountLabels;

export function ConnectedProfileScreen({ lang, labels }: { lang: Locale; labels: Labels }) {
  const router = useRouter();
  const session = useAccount();
  const address = session.status === "ready" ? session.address : undefined;
  const account = useAccountSnapshot(address);
  const [signingOut, setSigningOut] = useState(false);

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
  } else {
    const { signOut } = session;
    state = {
      kind: "ready",
      address: session.address,
      email: session.email,
      balances: account.data ? toBalances(account.data) : null,
      goal: account.data?.goal ? toGoal(account.data.goal) : null,
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
