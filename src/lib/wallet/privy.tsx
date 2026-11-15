"use client";

import { dataSuffix, PrivyProvider, useCreateWallet, useLoginWithEmail, usePrivy, useWallets } from "@privy-io/react-auth";
import { SmartWalletsProvider, useSmartWallets } from "@privy-io/react-auth/smart-wallets";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { getAddress } from "viem";

import { deployment } from "@/config/deployment";
import type { SignInProps } from "@/components/account/types";

import { activeChain, builderSuffix } from "./chain-client";
import { AccountContext } from "./context";
import type { AccountSession, AccountWallet } from "./types";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** After signing in, how long the account may take to appear before the app gives up and says so. */
const ACCOUNT_TIMEOUT_MS = 30_000;

/**
 * Email login with an invisible, sponsored smart account. The smart account type (Coinbase Smart
 * Wallet) and the paymaster are configured in the Privy dashboard; this only says: email only,
 * create the account on login, never show wallet screens, and tag every write with the Builder Code.
 */
export function PrivyAccountProvider({ appId, children }: { appId: string; children: ReactNode }) {
  return (
    <PrivyProvider
      appId={appId}
      config={{
        loginMethods: ["email"],
        embeddedWallets: { ethereum: { createOnLogin: "all-users" }, showWalletUIs: false },
        defaultChain: activeChain,
        supportedChains: [activeChain],
        // Also appended to `userOp.callData` of smart accounts, so every batch carries the code.
        plugins: builderSuffix ? [dataSuffix(builderSuffix)] : undefined,
      }}
    >
      <SmartWalletsProvider>
        <PrivySession>{children}</PrivySession>
      </SmartWalletsProvider>
    </PrivyProvider>
  );
}

function PrivySession({ children }: { children: ReactNode }) {
  const { ready, authenticated, user, logout } = usePrivy();
  const { client, getClientForChain } = useSmartWallets();
  const { sendCode, loginWithCode } = useLoginWithEmail();
  const { createWallet } = useCreateWallet();
  const { ready: walletsReady } = useWallets();

  // `createOnLogin` covers Privy's own login screens; our email form is headless, so make sure the
  // embedded signer (and with it the smart account) exists. Only once Privy's wallet frame is up
  // (`useWallets().ready` includes it): called earlier, `createWallet` falls back to Privy's own
  // "Creating your wallet" modal, which tries once and hangs if the frame never loads.
  const creatingWallet = useRef(false);
  useEffect(() => {
    if (!ready || !authenticated || !user || !walletsReady || creatingWallet.current) return;
    const hasEmbedded = user.linkedAccounts.some((account) => account.type === "wallet" && account.walletClientType === "privy");
    if (hasEmbedded) return;
    creatingWallet.current = true;
    createWallet().catch((cause: unknown) => {
      // Usually a race with `createOnLogin` creating it first; the session picks the wallet up either way.
      console.warn("[account] could not create the embedded wallet", cause);
      creatingWallet.current = false;
    });
  }, [ready, authenticated, user, walletsReady, createWallet]);

  const [step, setStep] = useState<SignInProps["step"]>("email");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<SignInProps["status"]>("idle");
  const [error, setError] = useState<SignInProps["error"]>(null);

  const requestCode = useCallback(
    async (value: string) => {
      if (!EMAIL_PATTERN.test(value)) {
        setError("invalid-email");
        return;
      }
      setEmail(value);
      setError(null);
      setStatus("sending");
      try {
        await sendCode({ email: value });
        setStep("code");
      } catch (cause) {
        console.error("[account] could not send the code", cause);
        setError("generic");
      } finally {
        setStatus("idle");
      }
    },
    [sendCode],
  );

  const signIn = useMemo<SignInProps>(
    () => ({
      step,
      email,
      status,
      error,
      onSubmitEmail: (value) => void requestCode(value),
      onSubmitCode: async (code) => {
        setError(null);
        setStatus("verifying");
        try {
          await loginWithCode({ code });
        } catch (cause) {
          console.warn("[account] code rejected", cause);
          setError("invalid-code");
        } finally {
          setStatus("idle");
        }
      },
      onResend: () => void requestCode(email),
      onChangeEmail: () => {
        setStep("email");
        setError(null);
      },
    }),
    [step, email, status, error, requestCode, loginWithCode],
  );

  const address = client?.account?.address;

  // If the account never shows up (the wallet frame is blocked, the network fails), say so instead
  // of showing "preparing" forever. Keyed by user so a later sign-in starts a fresh wait.
  const userId = authenticated ? user?.id : undefined;
  const [stalledUserId, setStalledUserId] = useState<string | null>(null);
  useEffect(() => {
    if (!ready || !userId || address) return;
    const timer = window.setTimeout(() => setStalledUserId(userId), ACCOUNT_TIMEOUT_MS);
    return () => window.clearTimeout(timer);
  }, [ready, userId, address]);

  const session = useMemo<AccountSession>(() => {
    if (!ready) return { status: "loading" };
    if (!authenticated) return { status: "signed-out", signIn };
    // Right after login the embedded signer and its smart account take a moment to exist.
    if (!address) return stalledUserId !== null && stalledUserId === userId ? { status: "failed" } : { status: "loading" };

    const wallet: AccountWallet = {
      kind: "privy",
      address: getAddress(address),
      async sendCalls(calls) {
        const smart = (await getClientForChain({ id: deployment.chainId })) ?? client;
        if (!smart) throw new Error("The account is not ready yet");
        // One user operation: approvals and the action land together or not at all. No wallet screens.
        return smart.sendTransaction(
          { calls: calls.map((call) => ({ to: call.to, data: call.data, value: BigInt(call.value) })) },
          { uiOptions: { showWalletUIs: false } },
        );
      },
    };
    return { status: "ready", address: wallet.address, wallet, email: user?.email?.address ?? null, signOut: logout };
  }, [ready, authenticated, signIn, address, stalledUserId, userId, client, getClientForChain, user, logout]);

  return <AccountContext.Provider value={session}>{children}</AccountContext.Provider>;
}
