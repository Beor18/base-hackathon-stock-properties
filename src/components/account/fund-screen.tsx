"use client";

import { QRCodeSVG } from "qrcode.react";

import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/es";
import { fill, formatMoney } from "@/i18n/format";
import { Screen } from "@/components/layout/screen";
import { Button, ButtonLink, ExternalButton } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";
import { Notice } from "@/components/ui/notice";
import { WaitBar } from "@/components/ui/wait-bar";

import { LoadError, SignInPanel } from "./sign-in-panel";
import type { Balances, SignInProps, TxProgress } from "./types";

/**
 * `/cargar`: receive digital dollars or pesos. On test networks the one action is the test
 * balance button; on mainnet it is copying the address.
 *
 * - `ready.faucet`: `null` idle, `{ step }` while minting, `"success"` or `"error"` after.
 * - `rampUrl`: external service to buy digital dollars (opens in a new tab). Null hides it.
 */
export type FundScreenState =
  | { kind: "signed-out"; signIn: SignInProps }
  | { kind: "loading" }
  | { kind: "error"; onRetry: () => void }
  | {
      kind: "ready";
      address: string;
      balances: Balances | null;
      testMode: boolean;
      faucetAmountUsd: number;
      onFaucet: () => void;
      faucet: TxProgress | "success" | "error" | null;
      rampUrl: string | null;
    };

type FundScreenProps = {
  lang: Locale;
  state: FundScreenState;
  labels: Pick<Dictionary, "fund" | "signIn" | "common" | "contribute">;
};

export function FundScreen({ lang, state, labels }: FundScreenProps) {
  const { fund: t, common } = labels;
  const back = { href: `/${lang}/meta`, label: common.back };

  if (state.kind === "signed-out") {
    return (
      <Screen back={back} title={t.title}>
        <SignInPanel {...state.signIn} context={t.signInContext} labels={labels.signIn} common={common} />
      </Screen>
    );
  }
  if (state.kind === "loading") {
    return (
      <Screen back={back} title={t.title}>
        <WaitBar steps={[labels.contribute.loading]} typicalSeconds={labels.contribute.loadingSeconds} labels={common} />
      </Screen>
    );
  }
  if (state.kind === "error") {
    return (
      <Screen back={back} title={t.title}>
        <LoadError message={labels.contribute.error} retry={common.retry} onRetry={state.onRetry} />
      </Screen>
    );
  }

  const faucetAmount = formatMoney(state.faucetAmountUsd, lang);
  const faucetRunning = typeof state.faucet === "object" && state.faucet !== null;

  const dock = state.testMode ? (
    faucetRunning ? (
      <WaitBar steps={t.testSteps} current={(state.faucet as TxProgress).step} typicalSeconds={t.testSeconds} labels={common} />
    ) : state.faucet === "success" ? (
      <ButtonLink href={`/${lang}/sumar`} block>
        {t.nextCta}
      </ButtonLink>
    ) : (
      <Button block onClick={state.onFaucet}>
        {fill(t.testCta, { amount: faucetAmount })}
      </Button>
    )
  ) : (
    <CopyButton value={state.address} label={t.copy} copiedLabel={t.copied} variant="primary" block />
  );

  return (
    <Screen back={back} title={t.title} lead={t.body} dock={dock}>
      {state.testMode && state.faucet === "success" && (
        <Notice tone="success" className="mb-5">
          {fill(t.testSuccess, { amount: faucetAmount })}
        </Notice>
      )}
      {state.testMode && state.faucet === "error" && (
        <Notice tone="error" className="mb-5">
          {t.testError}
        </Notice>
      )}

      <div className="rounded-[var(--radius-sheet)] border border-line bg-surface p-5">
        <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">
          <div className="rounded-2xl bg-white p-3">
            <QRCodeSVG value={state.address} size={152} level="M" title={t.qrAlt} fgColor="#15232b" bgColor="#ffffff" />
          </div>
          <div className="w-full min-w-0 flex-1">
            <p className="text-label font-semibold text-ink">{t.addressLabel}</p>
            <p className="mt-1 break-all rounded-[0.75rem] bg-surface-2 px-3 py-2.5 font-semibold text-ink tabular">
              {state.address}
            </p>
            {state.testMode && (
              <div className="mt-3">
                <CopyButton value={state.address} label={t.copy} copiedLabel={t.copied} />
              </div>
            )}
          </div>
        </div>
        <p className="mt-4 text-label text-ink-2">{t.warning}</p>
      </div>

      {state.balances && (
        <div className="mt-5 flex items-baseline justify-between gap-4 px-1">
          <p className="text-ink-2">{t.balanceTitle}</p>
          <p className="text-right font-semibold text-ink tabular">
            {formatMoney(state.balances.usd, lang)}
            {state.balances.ars > 0 && (
              <span className="block text-label font-normal text-ink-2">{formatMoney(state.balances.ars, lang, "ARS")}</span>
            )}
          </p>
        </div>
      )}

      {state.testMode && (
        <div className="mt-6 rounded-[var(--radius-sheet)] bg-mango-soft p-5">
          <p className="font-semibold text-ink">{t.testTitle}</p>
          <p className="mt-1 text-ink-2">{t.testBody}</p>
        </div>
      )}

      {state.rampUrl && (
        <div className="mt-6">
          <p className="font-semibold text-ink">{t.rampTitle}</p>
          <p className="mt-1 text-ink-2">{t.rampBody}</p>
          <ExternalButton href={state.rampUrl} variant="quiet" className="-ml-2 mt-1">
            {t.rampCta}
          </ExternalButton>
        </div>
      )}
    </Screen>
  );
}
