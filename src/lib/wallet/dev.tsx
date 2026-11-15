"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { createWalletClient, getAddress, http, type Address, type Hash } from "viem";

import { deployment } from "@/config/deployment";
import type { SignInProps } from "@/components/account/types";
import type { Dictionary } from "@/i18n/dictionaries/es";
import { shortAddress } from "@/i18n/format";

import { activeChain, browserClient, waitForSuccess, withBuilderCode } from "./chain-client";
import { AccountContext } from "./context";
import type { AccountSession, AccountWallet } from "./types";

/**
 * Dev accounts (chain 31337 only): Anvil's unlocked accounts stand in for the email login so the
 * whole flow can be tried end to end without Privy. The owner and the treasury are left out; the
 * default arbiter is offered last so disputes can be resolved too.
 */
const STORAGE_KEY = "sena:dev-account";
const SIGNED_OUT = "none";
/** viem estimates against the latest block; on Anvil some transactions land a little short. */
const GAS_MARGIN_PERCENT = 120n;

const walletClient = createWalletClient({ chain: activeChain, transport: http(deployment.rpcUrl) });

type DevAccount = { address: Address; isArbiter: boolean; index: number };

function readStored(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function store(value: string): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, value);
  } catch {
    // Private mode: the choice lasts until reload.
  }
}

function devWallet(address: Address): AccountWallet {
  return {
    kind: "dev",
    address,
    async sendCalls(calls) {
      let last: Hash | undefined;
      // One by one, each mined before the next is estimated (the next one usually needs the approval).
      for (const call of calls) {
        const tx = { account: address, to: call.to, data: withBuilderCode(call.data), value: BigInt(call.value) };
        const gas = await browserClient.estimateGas(tx);
        last = await walletClient.sendTransaction({ ...tx, gas: (gas * GAS_MARGIN_PERCENT) / 100n, chain: activeChain });
        await waitForSuccess(last);
      }
      if (!last) throw new Error("Nothing to send");
      return last;
    },
  };
}

export function DevAccountProvider({ children, labels }: { children: ReactNode; labels: Dictionary["account"] }) {
  const [accounts, setAccounts] = useState<DevAccount[] | "error" | null>(null);
  const [selected, setSelected] = useState<Address | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    walletClient
      .getAddresses()
      .then((all) => {
        if (cancelled) return;
        const excluded = new Set([deployment.owner, deployment.treasury].map((value) => value.toLowerCase()));
        const list = all
          .map((value, index) => ({ address: getAddress(value), index, isArbiter: value.toLowerCase() === deployment.arbiter.toLowerCase() }))
          .filter((account) => !excluded.has(account.address.toLowerCase()))
          .sort((a, b) => Number(a.isArbiter) - Number(b.isArbiter) || a.index - b.index);
        setAccounts(list);
        const stored = readStored();
        setSelected(
          stored === SIGNED_OUT ? null : (list.find((account) => account.address === stored)?.address ?? list[0]?.address ?? null),
        );
      })
      .catch(() => !cancelled && setAccounts("error"));
    return () => {
      cancelled = true;
    };
  }, []);

  const select = useCallback((value: Address | null) => {
    store(value ?? SIGNED_OUT);
    setSelected(value);
  }, []);

  const firstAccount = Array.isArray(accounts) ? (accounts[0]?.address ?? null) : null;
  const signIn = useMemo<SignInProps>(
    () => ({
      step: "email",
      email: "",
      status: "idle",
      error: null,
      // Any email signs in with the first test account: there is no code to wait for in dev.
      onSubmitEmail: () => select(firstAccount),
      onSubmitCode: () => undefined,
      onResend: () => undefined,
      onChangeEmail: () => undefined,
    }),
    [firstAccount, select],
  );

  const session = useMemo<AccountSession>(() => {
    if (accounts === "error") return { status: "unconfigured" };
    if (accounts === null || selected === undefined) return { status: "loading" };
    if (selected === null) return { status: "signed-out", signIn };
    return {
      status: "ready",
      address: selected,
      wallet: devWallet(selected),
      email: null,
      signOut: async () => select(null),
      // The local chain has no Privy: the server accepts this stand-in only on chain 31337.
      identityToken: async () => `dev:${selected}`,
    };
  }, [accounts, selected, signIn, select]);

  return (
    <AccountContext.Provider value={session}>
      {Array.isArray(accounts) && (
        <div className="bg-ink px-5 py-1.5 text-paper">
          <label className="mx-auto flex w-full max-w-6xl items-center justify-center gap-2 text-label md:px-3">
            <span className="shrink-0 whitespace-nowrap font-semibold">{labels.devAccount}</span>
            <select
              value={selected ?? SIGNED_OUT}
              onChange={(event) => select(event.target.value === SIGNED_OUT ? null : (event.target.value as Address))}
              className="min-h-9 min-w-0 max-w-52 rounded-md bg-paper px-2 font-semibold text-ink tabular"
            >
              {accounts.map((account) => (
                <option key={account.address} value={account.address}>
                  {`#${account.index} ${shortAddress(account.address)}${account.isArbiter ? ` (${labels.devArbiter})` : ""}`}
                </option>
              ))}
              <option value={SIGNED_OUT}>{labels.devSignedOut}</option>
            </select>
          </label>
        </div>
      )}
      {children}
    </AccountContext.Provider>
  );
}
