"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import type { Address } from "viem";

import { Screen, StateMessage } from "@/components/layout/screen";
import { Button, ButtonLink } from "@/components/ui/button";
import { WaitBar } from "@/components/ui/wait-bar";
import { keys } from "@/hooks/queries";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/es";
import { api } from "@/lib/api";

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
