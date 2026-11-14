"use client";

import { dataSuffix, PrivyProvider, useCreateWallet, useLoginWithEmail, usePrivy } from "@privy-io/react-auth";
import { SmartWalletsProvider, useSmartWallets } from "@privy-io/react-auth/smart-wallets";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { getAddress } from "viem";

import { deployment } from "@/config/deployment";
import type { SignInProps } from "@/components/account/types";

import { activeChain, builderSuffix } from "./chain-client";
import { AccountContext } from "./context";
import type { AccountSession, AccountWallet } from "./types";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
  const { ready, authenticated, user } = usePrivy();
  const { client, getClientForChain } = useSmartWallets();
  const { sendCode, loginWithCode } = useLoginWithEmail();
  const { createWallet } = useCreateWallet();

  // `createOnLogin` covers Privy's own login screens; our email form is headless, so make sure the
  // embedded signer (and with it the smart account) exists. No UI: wallet screens are off.
  const creatingWallet = useRef(false);
  useEffect(() => {
    if (!ready || !authenticated || !user || creatingWallet.current) return;
    const hasEmbedded = user.linkedAccounts.some((account) => account.type === "wallet" && account.walletClientType === "privy");
    if (hasEmbedded) return;
    creatingWallet.current = true;
    createWallet().catch((cause: unknown) => {
      // Usually a race with `createOnLogin` creating it first; the session picks the wallet up either way.
      console.warn("[account] could not create the embedded wallet", cause);
      creatingWallet.current = false;
    });
  }, [ready, authenticated, user, createWallet]);

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
  const session = useMemo<AccountSession>(() => {
    if (!ready) return { status: "loading" };
    if (!authenticated) return { status: "signed-out", signIn };
    // Right after login the embedded signer and its smart account take a moment to exist.
    if (!address) return { status: "loading" };

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
    return { status: "ready", address: wallet.address, wallet };
  }, [ready, authenticated, signIn, address, client, getClientForChain]);

  return <AccountContext.Provider value={session}>{children}</AccountContext.Provider>;
}
