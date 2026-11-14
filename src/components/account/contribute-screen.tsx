"use client";

import { useEffect, useId, useState } from "react";

import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/es";
import { fill, formatAmount, formatBps, formatMoney, formatProgress, formatShares } from "@/i18n/format";
import { Screen, StateMessage } from "@/components/layout/screen";
import { HouseFill } from "@/components/property/house-fill";
import { Button, ButtonLink } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import { Row, Rows } from "@/components/ui/rows";
import { WaitBar } from "@/components/ui/wait-bar";

import { EmptyHouse } from "./goal-screen";
import { GoalPropertyRow } from "./parts";
import { LoadError, SignInPanel } from "./sign-in-panel";
import type { Balances, Goal, PayCurrency, SignInProps, TxProgress } from "./types";

export type ContributionDraft = { amount: number; currency: PayCurrency };

/** Price of a contribution, from the planner (`/api/quote` or the aggregator). */
export type ContributionQuote = ContributionDraft & {
  sharesOut: number;
  sharePriceUsd: number;
  /** Fee charged, in the pay currency. */
  feeAmount: number;
  /** USD value the goal gains (after the fee). */
  valueUsd: number;
};

/**
 * `/sumar`: add money to the goal. The fee is always on screen: computed from `feeBps` while the
 * quote loads, then taken from the quote.
 *
 * - `ready`: the screen owns the amount input and reports it through `onDraftChange` (debounced);
 *   integration answers with `quote`. `onSubmit` sends approve + buy in one batch; `tx` tracks it.
 *   Zero balance in both currencies renders the "cargá tu cuenta" empty state automatically.
 * - `success`: after the batch confirms, with the updated goal.
 */
export type ContributeScreenState =
  | { kind: "signed-out"; signIn: SignInProps }
  | { kind: "loading" }
  | { kind: "error"; onRetry: () => void }
  | { kind: "no-goal" }
  | {
      kind: "ready";
      goal: Goal;
      balances: Balances;
      /** Currencies offered on this network. */
      currencies: PayCurrency[];
      minUsd: number;
      feeBps: number;
      /** ARS per USD, to check the minimum and estimate progress when paying in pesos. */
      arsPerUsd: number | null;
      quote: ContributionQuote | "loading" | "error" | null;
      onDraftChange: (draft: ContributionDraft | null) => void;
      onSubmit: (draft: ContributionDraft) => void;
      tx: TxProgress | null;
      txError: boolean;
      /** Plain-words reason of the failure, when known. */
      txErrorDetail?: string | null;
    }
  | { kind: "success"; amount: number; currency: PayCurrency; goal: Goal };

type ContributeScreenProps = {
  lang: Locale;
  state: ContributeScreenState;
  labels: Pick<Dictionary, "contribute" | "signIn" | "common" | "goal">;
};

const PRESETS: Record<PayCurrency, number[]> = {
  usd: [10, 20, 50, 100],
  ars: [10_000, 25_000, 50_000, 100_000],
};

const CODE: Record<PayCurrency, "USD" | "ARS"> = { usd: "USD", ars: "ARS" };

/** Parses "20", "20,5" (es) or "20.5" (en) into a number. Thousands separators are ignored. */
function parseAmount(value: string, lang: Locale): number | null {
  const decimal = lang === "es" ? "," : ".";
  const cleaned = value
    .replace(new RegExp(`[^\\d${decimal === "," ? "," : "\\."}]`, "g"), "")
    .replace(decimal, ".");
  const amount = Number(cleaned);
  return cleaned && Number.isFinite(amount) && amount > 0 ? amount : null;
}

export function ContributeScreen({ lang, state, labels }: ContributeScreenProps) {
  const { contribute: t, common } = labels;
  const back = { href: `/${lang}/meta`, label: common.back };

  switch (state.kind) {
    case "signed-out":
      return (
        <Screen back={back} title={t.title}>
          <SignInPanel {...state.signIn} context={t.signInContext} labels={labels.signIn} common={common} />
        </Screen>
      );
    case "loading":
      return (
        <Screen back={back} title={t.title}>
          <WaitBar steps={[t.loading]} typicalSeconds={t.loadingSeconds} labels={common} />
        </Screen>
      );
    case "error":
      return (
        <Screen back={back} title={t.title}>
          <LoadError message={t.error} retry={common.retry} onRetry={state.onRetry} />
        </Screen>
      );
    case "no-goal":
      return (
        <Screen back={{ href: `/${lang}`, label: common.back }}>
          <StateMessage icon={<EmptyHouse />} title={t.noGoalTitle} body={t.noGoalBody}>
            <ButtonLink href={`/${lang}/casa`} block className="sm:w-auto sm:min-w-64">
              {t.noGoalCta}
            </ButtonLink>
          </StateMessage>
        </Screen>
      );
    case "success":
      return <ContributeSuccess lang={lang} state={state} labels={labels} />;
    case "ready":
      if (state.balances.usd <= 0 && state.balances.ars <= 0) {
        return (
          <Screen back={back}>
            <StateMessage title={t.emptyTitle} body={t.emptyBody}>
              <ButtonLink href={`/${lang}/cargar`} block className="sm:w-auto sm:min-w-64">
                {t.fundCta}
              </ButtonLink>
            </StateMessage>
          </Screen>
        );
      }
      return <ContributeForm lang={lang} state={state} labels={labels} />;
  }
}

function ContributeForm({
  lang,
  state,
  labels,
}: {
  lang: Locale;
  state: Extract<ContributeScreenState, { kind: "ready" }>;
  labels: ContributeScreenProps["labels"];
}) {
  const { contribute: t, common } = labels;
  const amountId = useId();
  const [currency, setCurrency] = useState<PayCurrency>(state.balances.usd > 0 ? "usd" : "ars");
  const [raw, setRaw] = useState("");
  const amount = parseAmount(raw, lang);
  const { onDraftChange } = state;

  useEffect(() => {
    const timer = window.setTimeout(() => onDraftChange(amount ? { amount, currency } : null), 350);
    return () => window.clearTimeout(timer);
  }, [amount, currency, onDraftChange]);

  const code = CODE[currency];
  const balance = currency === "usd" ? state.balances.usd : state.balances.ars;
  const minAmount = currency === "usd" ? state.minUsd : state.arsPerUsd ? state.minUsd * state.arsPerUsd : null;
  const tooSmall = amount !== null && minAmount !== null && amount < minAmount;
  const tooBig = amount !== null && amount > balance;
  const quote =
    typeof state.quote === "object" && state.quote && state.quote.amount === amount && state.quote.currency === currency
      ? state.quote
      : null;
  const fee = quote ? quote.feeAmount : amount ? (amount * state.feeBps) / 10_000 : 0;
  const addedUsd = quote
    ? quote.valueUsd
    : amount
      ? (currency === "usd" ? amount : state.arsPerUsd ? amount / state.arsPerUsd : 0) * (1 - state.feeBps / 10_000)
      : 0;
  const afterPct = state.goal.targetUsd > 0 ? Math.min((state.goal.savedUsd + addedUsd) / state.goal.targetUsd, 1) : 0;
  const canSubmit = amount !== null && !tooSmall && !tooBig && quote !== null && state.tx === null;
  const amountLabel = amount ? formatMoney(amount, lang, code) : "";

  return (
    <Screen
      back={{ href: `/${lang}/meta`, label: common.back }}
      title={t.title}
      dock={
        state.tx ? (
          <WaitBar
            steps={t.steps.map((step) => fill(step, { stock: state.goal.stock.name }))}
            current={state.tx.step}
            typicalSeconds={t.stepsSeconds}
            labels={common}
          />
        ) : (
          <>
            {state.txError && (
              <Notice tone="error">
                {t.error}
                {state.txErrorDetail && <span className="mt-1 block font-semibold">{state.txErrorDetail}</span>}
              </Notice>
            )}
            {tooBig ? (
              <ButtonLink href={`/${lang}/cargar`} block>
                {t.fundCta}
              </ButtonLink>
            ) : (
              <Button block disabled={!canSubmit} onClick={() => amount && state.onSubmit({ amount, currency })}>
                {amount ? fill(t.cta, { amount: amountLabel }) : t.ctaEmpty}
              </Button>
            )}
          </>
        )
      }
    >
      <GoalPropertyRow
        property={state.goal.property}
        lang={lang}
        detail={fill(labels.goal.progress, {
          saved: formatMoney(state.goal.savedUsd, lang),
          target: formatMoney(state.goal.targetUsd, lang),
        })}
      />

      <fieldset className="mt-6" disabled={state.tx !== null}>
        {state.currencies.length > 1 && (
          <>
            <legend className="text-label font-semibold text-ink">{t.currency}</legend>
            <div className="mt-1.5 grid grid-cols-2 gap-1 rounded-[var(--radius-control)] bg-surface-2 p-1" role="radiogroup">
              {state.currencies.map((option) => (
                <label
                  key={option}
                  className={`flex min-h-11 cursor-pointer items-center justify-center rounded-[0.625rem] px-2 text-center font-semibold transition-colors has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-[var(--focus)] ${
                    currency === option ? "bg-surface text-ink shadow-raise" : "text-ink-2 hover:text-ink"
                  }`}
                >
                  <input
                    type="radio"
                    name="currency"
                    value={option}
                    checked={currency === option}
                    onChange={() => {
                      setCurrency(option);
                      setRaw("");
                    }}
                    className="sr-only"
                  />
                  {option === "usd" ? t.usd : t.ars}
                </label>
              ))}
            </div>
          </>
        )}

        <label htmlFor={amountId} className="mt-5 block text-label font-semibold text-ink">
          {t.amountLabel}
        </label>
        <div className="relative mt-1.5">
          <span className="type-semiwide pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-h3 text-ink-2">
            {code}
          </span>
          <input
            id={amountId}
            inputMode="decimal"
            autoComplete="off"
            value={raw}
            onChange={(event) => setRaw(event.target.value)}
            placeholder="0"
            aria-invalid={tooSmall || tooBig}
            aria-describedby={`${amountId}-hint`}
            className="type-wide h-20 w-full rounded-[var(--radius-control)] border border-line-strong bg-surface pl-[5.5rem] pr-4 text-h1 text-ink placeholder:text-line-strong focus:border-ink focus:outline-none focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus)] aria-[invalid=true]:border-danger tabular"
          />
        </div>
        <p id={`${amountId}-hint`} className={`mt-2 text-label tabular ${tooSmall || tooBig ? "font-semibold text-danger" : "text-ink-2"}`}>
          {tooBig
            ? fill(t.insufficient, { amount: formatMoney(balance, lang, code) })
            : tooSmall && minAmount !== null
              ? fill(t.min, { amount: formatMoney(minAmount, lang, code) })
              : fill(t.balance, { amount: formatMoney(balance, lang, code) })}
        </p>

        <div className="mt-3 grid grid-cols-4 gap-2" role="group" aria-label={t.presets}>
          {PRESETS[currency].map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setRaw(formatAmount(preset, lang))}
              aria-label={formatMoney(preset, lang, code)}
              className={`min-h-11 rounded-full border px-1 text-label font-semibold tabular transition-colors ${
                amount === preset ? "border-ink bg-ink text-paper" : "border-line-strong bg-surface text-ink hover:border-ink"
              }`}
            >
              {/* The currency already sits next to the amount field; repeating it does not fit at 360 px. */}
              {formatAmount(preset, lang)}
            </button>
          ))}
        </div>
      </fieldset>

      {amount !== null && !tooSmall && !tooBig && (
        <div className="mt-6 rounded-[var(--radius-sheet)] border border-line bg-surface px-5 py-2">
          {state.quote === "loading" || (!quote && state.quote !== "error") ? (
            <div className="py-3">
              <WaitBar steps={[t.quoting]} typicalSeconds={t.quotingSeconds} labels={common} />
            </div>
          ) : state.quote === "error" ? (
            <div className="py-3">
              <Notice tone="error">{t.error}</Notice>
            </div>
          ) : (
            quote && (
              <Rows>
                <Row
                  label={t.youGet}
                  value={fill(t.youGetValue, { shares: formatShares(quote.sharesOut, lang), stock: state.goal.stock.name })}
                />
                <Row label={t.sharePrice} value={formatMoney(quote.sharePriceUsd, lang)} />
              </Rows>
            )
          )}
          <Rows className={quote ? "border-t border-line" : ""}>
            <Row label={fill(common.feeLine, { pct: formatBps(state.feeBps, lang) })} value={formatMoney(fee, lang, code)} />
            <Row label={t.total} value={amountLabel} emphasis />
          </Rows>
        </div>
      )}

      {amount !== null && !tooSmall && !tooBig && (
        <p className="mt-3 text-ink-2 tabular">
          {/* Small contributions still show progress: "0,3 %" instead of "0 %". */}
          {fill(t.after, { pct: formatProgress(afterPct, lang) })}
        </p>
      )}
    </Screen>
  );
}

function ContributeSuccess({
  lang,
  state,
  labels,
}: {
  lang: Locale;
  state: Extract<ContributeScreenState, { kind: "success" }>;
  labels: ContributeScreenProps["labels"];
}) {
  const { contribute: t } = labels;
  const pct = state.goal.targetUsd > 0 ? Math.min(state.goal.savedUsd / state.goal.targetUsd, 1) : 0;
  // The payoff moment: the home paints itself up to the new progress.
  return (
    <Screen
      media={
        <HouseFill
          src={state.goal.property.imageUrl}
          alt={fill(labels.goal.photoAlt, { title: state.goal.property.title })}
          progress={pct}
          animate
          priority
          sizes="(min-width: 640px) 560px, 100vw"
          label={fill(labels.goal.progressPct, { pct: formatProgress(pct, lang) })}
          className="aspect-[4/3]"
        />
      }
      title={fill(t.successTitle, { amount: formatMoney(state.amount, lang, CODE[state.currency]) })}
      lead={fill(t.successBody, {
        shares: formatShares(state.goal.shares, lang),
        stock: state.goal.stock.name,
        pct: formatProgress(pct, lang),
      })}
      dock={
        <ButtonLink href={`/${lang}/meta`} block>
          {t.successCta}
        </ButtonLink>
      }
    />
  );
}
