"use client";

import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/es";
import { fill, formatMoney, formatPercent, formatShares } from "@/i18n/format";
import { Screen, StateMessage } from "@/components/layout/screen";
import { HouseFill } from "@/components/property/house-fill";
import { Button, ButtonLink } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import { WaitBar } from "@/components/ui/wait-bar";

import { Change, formatDepositPct, GoalPropertyRow, StockIcon } from "./parts";
import { LoadError, SignInPanel } from "./sign-in-panel";
import type { Goal, GoalDraft, SignInProps, StockOption, TxProgress } from "./types";

/**
 * `/meta`: the goal. Integration passes one of these states.
 *
 * - `signed-out`: no session. `draft` is set when the person came from "Esta es mi meta".
 * - `loading` / `error`: reading the goal (GoalRegistry.goalOf + balances + prices).
 * - `empty`: signed in, no goal and no draft.
 * - `setup`: signed in with a draft (from `?casa=&sena=`): pick the stock, then save.
 *   `saving` is set while `setGoal` runs; `saveError` after it failed.
 * - `active`: the saved goal. Reaching the target turns the action into "Reservar la casa".
 */
export type GoalScreenState =
  | { kind: "signed-out"; signIn: SignInProps; draft: GoalDraft | null }
  | { kind: "loading" }
  | { kind: "error"; onRetry: () => void }
  | { kind: "empty" }
  | {
      kind: "setup";
      draft: GoalDraft;
      stocks: StockOption[];
      selectedStockId: string | null;
      onSelectStock: (id: string) => void;
      /** Sends `setGoal` for the draft and the selected stock. */
      onSave: () => void;
      saving: TxProgress | null;
      saveError: boolean;
      /** Plain-words reason of the failure, when known. */
      saveErrorDetail?: string | null;
    }
  | { kind: "active"; goal: Goal; justSaved?: boolean };

type GoalScreenProps = {
  lang: Locale;
  state: GoalScreenState;
  labels: Pick<Dictionary, "goal" | "signIn" | "common">;
};

export function GoalScreen({ lang, state, labels }: GoalScreenProps) {
  const { goal: t, common } = labels;
  const home = `/${lang}`;

  switch (state.kind) {
    case "signed-out":
      return (
        <Screen back={{ href: state.draft ? `/${lang}/casa` : home, label: common.back }} title={t.title}>
          {state.draft && (
            <div className="mb-5">
              <GoalPropertyRow
                property={state.draft.property}
                lang={lang}
                detail={`${common.sena} ${formatMoney(state.draft.targetUsd, lang)} (${formatDepositPct(state.draft.depositPct, lang)})`}
              />
            </div>
          )}
          <SignInPanel
            {...state.signIn}
            context={state.draft ? t.signInContextSetup : t.signInContext}
            labels={labels.signIn}
            common={common}
          />
        </Screen>
      );

    case "loading":
      return (
        <Screen title={t.title}>
          <div className="skeleton aspect-[4/3] rounded-[var(--radius-photo)]" aria-hidden />
          <WaitBar className="mt-6" steps={[t.loading]} typicalSeconds={t.loadingSeconds} labels={common} />
        </Screen>
      );

    case "error":
      return (
        <Screen title={t.title}>
          <LoadError message={t.error} retry={common.retry} onRetry={state.onRetry} />
        </Screen>
      );

    case "empty":
      return (
        <Screen back={{ href: home, label: common.back }}>
          <StateMessage icon={<EmptyHouse />} title={t.emptyTitle} body={t.emptyBody}>
            <ButtonLink href={`/${lang}/casa`} block className="sm:w-auto sm:min-w-64">
              {t.emptyCta}
            </ButtonLink>
          </StateMessage>
        </Screen>
      );

    case "setup":
      return <GoalSetup lang={lang} state={state} labels={labels} />;

    case "active":
      return <GoalProgress lang={lang} goal={state.goal} justSaved={state.justSaved} labels={labels} />;
  }
}

function GoalSetup({
  lang,
  state,
  labels,
}: {
  lang: Locale;
  state: Extract<GoalScreenState, { kind: "setup" }>;
  labels: GoalScreenProps["labels"];
}) {
  const { goal: t, common } = labels;
  const selected = state.stocks.find((stock) => stock.id === state.selectedStockId) ?? null;

  return (
    <Screen
      back={{ href: `/${lang}/casa/${encodeURIComponent(state.draft.property.ref)}`, label: common.back }}
      title={t.setupTitle}
      lead={t.setupBody}
      dock={
        state.saving ? (
          <WaitBar steps={t.saving} current={state.saving.step} typicalSeconds={t.savingSeconds} labels={common} />
        ) : (
          <>
            {state.saveError && (
              <Notice tone="error">
                {t.saveError}
                {state.saveErrorDetail && <span className="mt-1 block font-semibold">{state.saveErrorDetail}</span>}
              </Notice>
            )}
            <Button block disabled={!selected} onClick={state.onSave}>
              {selected ? fill(t.setupCta, { stock: selected.name }) : t.setupPick}
            </Button>
          </>
        )
      }
    >
      <GoalPropertyRow
        property={state.draft.property}
        lang={lang}
        detail={`${common.sena} ${formatMoney(state.draft.targetUsd, lang)} (${formatDepositPct(state.draft.depositPct, lang)})`}
      />

      <fieldset className="mt-6" disabled={state.saving !== null}>
        <legend className="sr-only">{t.setupPick}</legend>
        <div className="flex flex-col gap-2.5">
          {state.stocks.map((stock) => {
            const checked = stock.id === state.selectedStockId;
            return (
              <label
                key={stock.id}
                className={`flex min-h-16 cursor-pointer items-center gap-4 rounded-[var(--radius-control)] border bg-surface px-4 py-3 transition-colors has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[var(--focus)] ${
                  checked ? "border-accent ring-1 ring-accent" : "border-line hover:border-line-strong"
                }`}
              >
                <input
                  type="radio"
                  name="stock"
                  value={stock.id}
                  checked={checked}
                  onChange={() => state.onSelectStock(stock.id)}
                  className="sr-only"
                />
                <StockIcon stock={stock} />
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold text-ink">
                    {stock.name}
                    {stock.ticker && <span className="ml-2 text-label font-normal text-ink-3">{stock.ticker}</span>}
                  </span>
                  <span className="block text-label text-ink-2 tabular">
                    {fill(t.pricePerShare, { price: formatMoney(stock.priceUsd, lang) })}
                  </span>
                  {stock.needUsd ? (
                    <span className="block text-label font-semibold text-ink tabular">
                      {fill(t.stockNeed, { amount: formatMoney(stock.needUsd, lang) })}
                    </span>
                  ) : null}
                </span>
                {stock.change12mPct !== null && (
                  <span className="text-right text-label">
                    <Change pct={stock.change12mPct} lang={lang} flat={t.noChange} />
                    <span className="block text-ink-3">{t.lastYear}</span>
                  </span>
                )}
                <span
                  aria-hidden
                  className={`flex size-6 shrink-0 items-center justify-center rounded-full border-2 ${
                    checked ? "border-accent bg-accent" : "border-line-strong"
                  }`}
                >
                  {checked && <span className="size-2 rounded-full bg-accent-ink" />}
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>
    </Screen>
  );
}

function GoalProgress({
  lang,
  goal,
  justSaved,
  labels,
}: {
  lang: Locale;
  goal: Goal;
  justSaved?: boolean;
  labels: GoalScreenProps["labels"];
}) {
  const { goal: t } = labels;
  const progress = goal.targetUsd > 0 ? goal.savedUsd / goal.targetUsd : 0;
  const reached = progress >= 1;
  const remaining = Math.max(goal.targetUsd - goal.savedUsd, 0);
  const pctLabel = formatPercent(Math.min(progress, 1), lang);

  return (
    <Screen
      media={
        <HouseFill
          src={goal.property.imageUrl}
          alt={fill(t.photoAlt, { title: goal.property.title })}
          progress={progress}
          animate
          priority
          sizes="(min-width: 640px) 560px, 100vw"
          label={reached ? t.reachedTitle : fill(t.progressPct, { pct: pctLabel })}
          className="aspect-[4/3]"
        />
      }
      dock={
        reached ? (
          <ButtonLink href={`/${lang}/reservar`} block>
            {t.reachedCta}
          </ButtonLink>
        ) : (
          <ButtonLink href={`/${lang}/sumar`} block>
            {t.cta}
          </ButtonLink>
        )
      }
    >
      {justSaved && (
        <Notice tone="success" className="mb-5">
          {t.saved}
        </Notice>
      )}

      <p className="text-ink-2">{goal.property.title}</p>
      <h1 className="type-wide mt-1 text-h1 text-balance text-ink tabular">
        {reached
          ? t.reachedTitle
          : fill(t.progress, { saved: formatMoney(goal.savedUsd, lang), target: formatMoney(goal.targetUsd, lang) })}
      </h1>
      <p className="mt-2 text-lead text-ink-2 tabular">
        {reached ? t.reachedBody : fill(t.remaining, { amount: formatMoney(remaining, lang) })}
      </p>
      {!reached && goal.targetUsd > goal.senaUsd && (
        <p className="mt-2 text-label text-ink-2 text-pretty tabular">
          {fill(t.margin, { sena: formatMoney(goal.senaUsd, lang), target: formatMoney(goal.targetUsd, lang) })}
        </p>
      )}

      <div className="mt-6 flex items-center gap-3 rounded-[var(--radius-sheet)] bg-surface p-4">
        <StockIcon stock={goal.stock} />
        <p className="font-semibold text-ink tabular">
          {fill(t.holdings, { shares: formatShares(goal.shares, lang), stock: goal.stock.name })}
        </p>
      </div>

      {(goal.houseChangePct !== null || goal.stocksChangePct !== null) && (
        <section aria-labelledby="since-heading" className="mt-6">
          <h2 id="since-heading" className="text-label font-semibold text-ink-2">
            {t.sinceStart}
          </h2>
          <dl className="mt-2 grid grid-cols-2 gap-3">
            {goal.houseChangePct !== null && (
              <div className="rounded-[var(--radius-control)] border border-line p-4">
                <dt className="text-ink-2">{t.houseChange}</dt>
                <dd className="type-semiwide mt-1 text-h3">
                  <Change pct={goal.houseChangePct} lang={lang} flat={t.noChange} />
                </dd>
              </div>
            )}
            {goal.stocksChangePct !== null && (
              <div className="rounded-[var(--radius-control)] border border-line p-4">
                <dt className="text-ink-2">{t.stocksChange}</dt>
                <dd className="type-semiwide mt-1 text-h3">
                  <Change pct={goal.stocksChangePct} lang={lang} flat={t.noChange} />
                </dd>
              </div>
            )}
          </dl>
        </section>
      )}

      <div className="mt-6 flex flex-wrap gap-x-4">
        <ButtonLink href={`/${lang}/cargar`} variant="quiet" size="md">
          {t.fund}
        </ButtonLink>
        <ButtonLink href={`/${lang}/casa`} variant="quiet" size="md">
          {t.change}
        </ButtonLink>
      </div>
    </Screen>
  );
}

/** Empty-state drawing: the ñ-house outline. */
export function EmptyHouse() {
  return (
    <svg viewBox="0 0 96 80" className="h-20 w-24 text-line-strong" fill="none" aria-hidden>
      <path d="M14 38L48 12l34 26" stroke="var(--accent)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M24 72V44c0-9 7-16 16-16h0c9 0 16 7 16 16v28" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
      <path d="M8 72h80" stroke="var(--mango)" strokeWidth="5" strokeLinecap="round" />
    </svg>
  );
}
