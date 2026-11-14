"use client";

import { createContext, useContext } from "react";

import type { AccountSession } from "./types";

export const AccountContext = createContext<AccountSession>({ status: "loading" });

/** The person's session and account, from whichever provider is active (Privy or dev). */
export function useAccount(): AccountSession {
  return useContext(AccountContext);
}
