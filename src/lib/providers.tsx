"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";

import { deployment } from "@/config/deployment";
import type { Dictionary } from "@/i18n/dictionaries/es";

import { AccountContext } from "./wallet/context";
import { DevAccountProvider } from "./wallet/dev";
import { PrivyAccountProvider } from "./wallet/privy";

/** The app's only environment variable. Inlined at build time. */
const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID?.trim() || null;

/**
 * Which account implementation runs: dev accounts on the local chain, Privy on public networks.
 * A public network without an app id keeps the app browsable and explains that sign-in is not set up.
 */
export const accountMode: "dev" | "privy" | "unconfigured" =
  deployment.chainId === 31337 ? "dev" : PRIVY_APP_ID ? "privy" : "unconfigured";

export function Providers({ children, labels }: { children: ReactNode; labels: Dictionary["account"] }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { staleTime: 10_000, retry: 1, refetchOnWindowFocus: false } },
      }),
  );

  let accounts: ReactNode;
  if (accountMode === "dev") {
    accounts = <DevAccountProvider labels={labels}>{children}</DevAccountProvider>;
  } else if (accountMode === "privy" && PRIVY_APP_ID) {
    accounts = <PrivyAccountProvider appId={PRIVY_APP_ID}>{children}</PrivyAccountProvider>;
  } else {
    if (typeof window !== "undefined") {
      console.error("[account] NEXT_PUBLIC_PRIVY_APP_ID is not set: email sign-in is disabled on this network.");
    }
    accounts = <AccountContext.Provider value={{ status: "unconfigured" }}>{children}</AccountContext.Provider>;
  }

  return <QueryClientProvider client={queryClient}>{accounts}</QueryClientProvider>;
}
