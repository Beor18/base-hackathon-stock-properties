"use client";

import Link from "next/link";

import { HouseAvatar } from "@/components/brand/house-avatar";
import { Screen } from "@/components/layout/screen";
import { Button, ButtonLink } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";
import { WaitBar } from "@/components/ui/wait-bar";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/es";
import { fill, formatDate, formatMoney, formatProgress, shortAddress } from "@/i18n/format";
import type { InboxItem } from "@/lib/view-models";

import { LoadError, SignInPanel } from "./sign-in-panel";
import type { Balances, Goal, SignInProps } from "./types";

/**
 * `/cuenta`: who is signed in, what they have and the way out. The one primary action leads to the
 * goal (or to choosing a house when there is none); signing out is the quiet last line.
 *
 * - `ready.email`: null for local dev accounts.
 * - `ready.activityUrl`: the account's page on the block explorer. Null hides the link.
 * - `ready.inbox`: reservations in this account's favor (brokers). Empty hides the section.
 */
export type ProfileScreenState =
  | { kind: "signed-out"; signIn: SignInProps }
  | { kind: "loading" }
  | { kind: "error"; onRetry: () => void }
  | {
      kind: "ready";
      address: string;
      email: string | null;
      balances: Balances;
      inbox: InboxItem[];
      goal: Goal | null;
      activityUrl: string | null;
      onSignOut: () => void;
      signingOut: boolean;
    };

type Labels = Pick<Dictionary, "profile" | "fund" | "signIn" | "common" | "reservation">;

export function ProfileScreen({ lang, state, labels }: { lang: Locale; state: ProfileScreenState; labels: Labels }) {
  const { profile: t, common } = labels;
  const back = { href: `/${lang}`, label: common.home };

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
        <WaitBar steps={[t.loading]} typicalSeconds={t.loadingSeconds} labels={common} />
      </Screen>
    );
  }
  if (state.kind === "error") {
    return (
      <Screen back={back} title={t.title}>
        <LoadError message={t.error} retry={common.retry} onRetry={state.onRetry} />
      </Screen>
    );
  }

  const { goal, balances } = state;
  const progress = goal ? goal.savedUsd / goal.targetUsd : 0;

  const dock = state.signingOut ? (
    <WaitBar steps={[t.signingOut]} typicalSeconds={1} labels={common} />
  ) : (
    <ButtonLink href={goal ? `/${lang}/meta` : `/${lang}/casa`} block>
      {goal ? t.goalCta : t.chooseCta}
    </ButtonLink>
  );

  return (
    <Screen back={back} dock={dock}>
      <div className="mt-2 flex flex-col items-center text-center">
        <HouseAvatar seed={state.address} label={t.avatarAlt} className="size-32 rounded-[2.25rem] shadow-[var(--shadow-raise)]" />
        <h1 className="type-display mt-5 max-w-full break-words text-h2 text-ink">{state.email ?? t.devEmail}</h1>
        <p className="mt-2 max-w-xs text-label text-ink-2 text-pretty">{t.avatarNote}</p>
      </div>

      {state.inbox.length > 0 && (
        <section aria-labelledby="perfil-reservas" className="mt-8 rounded-[var(--radius-sheet)] border border-line bg-surface p-5">
          <h2 id="perfil-reservas" className="font-semibold text-ink">
            {t.inboxTitle}
          </h2>
          <ul className="mt-2 divide-y divide-line">
            {state.inbox.map((item) => (
              <li key={item.id}>
                <Link
                  href={`/${lang}/r/${item.id}`}
                  className="-mx-2 flex min-h-14 items-center justify-between gap-3 rounded-lg px-2 py-3 hover:bg-surface-2"
                >
                  <span className="min-w-0">
                    <span className="block font-semibold text-ink tabular">
                      {fill(t.inboxItem, { amount: formatMoney(item.senaUsd, lang) })}
                    </span>
                    <span className="block text-label text-ink-2">
                      {labels.reservation.status[item.status]} · {fill(t.inboxEnds, { date: formatDate(item.endsAt, lang) })}
                    </span>
                  </span>
                  {(item.payable || item.isNew) && (
                    <span className="shrink-0 rounded-full bg-accent px-2.5 py-1 text-label font-semibold text-white">
                      {item.payable ? t.inboxPayable : t.inboxNew}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="perfil-saldo" className="mt-8 rounded-[var(--radius-sheet)] border border-line bg-surface p-5">
        <div className="flex items-start justify-between gap-4">
          <h2 id="perfil-saldo" className="font-semibold text-ink">
            {t.balanceTitle}
          </h2>
          <ButtonLink href={`/${lang}/cargar`} variant="quiet" size="md" className="-mt-3 -mr-1">
            {t.fundCta}
          </ButtonLink>
        </div>
        <dl className="mt-1 grid gap-3">
          <div>
            <dt className="sr-only">{t.dollars}</dt>
            <dd className="type-display text-h1 text-ink tabular">{formatMoney(balances.usd, lang)}</dd>
          </div>
          <div className="flex items-baseline justify-between gap-4 border-t border-line pt-3">
            <dt className="text-ink-2">{t.pesos}</dt>
            <dd className="font-semibold text-ink tabular">{formatMoney(balances.ars, lang, "ARS")}</dd>
          </div>
        </dl>
      </section>

      <section aria-labelledby="perfil-meta" className="mt-4 rounded-[var(--radius-sheet)] border border-line bg-surface p-5">
        <h2 id="perfil-meta" className="font-semibold text-ink">
          {t.goalTitle}
        </h2>
        {goal ? (
          <>
            <p className="type-heading mt-2 text-h3 text-ink text-balance">{goal.property.title}</p>
            <div
              className="mt-4 h-3 w-full overflow-hidden rounded-full bg-surface-2"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(Math.min(progress, 1) * 100)}
              aria-label={t.goalTitle}
            >
              <div className="h-full rounded-full bg-accent" style={{ width: `${Math.min(progress, 1) * 100}%` }} />
            </div>
            <p className="mt-2 flex justify-between gap-4 text-label text-ink-2 tabular">
              <span>{fill(t.goalProgress, { saved: formatMoney(goal.savedUsd, lang), target: formatMoney(goal.targetUsd, lang) })}</span>
              <span className="font-semibold text-ink">{formatProgress(progress, lang)}</span>
            </p>
          </>
        ) : (
          <p className="mt-2 text-ink-2">{t.noGoal}</p>
        )}
      </section>

      <section aria-labelledby="perfil-cuenta" className="mt-4 rounded-[var(--radius-sheet)] border border-line bg-surface p-5">
        <h2 id="perfil-cuenta" className="font-semibold text-ink">
          {labels.fund.addressLabel}
        </h2>
        <div className="mt-2 flex items-center justify-between gap-3">
          <p className="type-heading text-h3 text-ink tabular" title={state.address}>
            {shortAddress(state.address)}
          </p>
          <CopyButton value={state.address} label={common.copy} copiedLabel={common.copied} />
        </div>
        {state.activityUrl && (
          <a
            href={state.activityUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-flex min-h-11 items-center gap-1.5 text-label font-semibold text-accent underline-offset-4 hover:underline"
          >
            {t.activity}
            <span className="sr-only">{t.opensNewTab}</span>
          </a>
        )}
      </section>

      <div className="mt-6 flex justify-center">
        <Button variant="danger" size="md" onClick={state.onSignOut} disabled={state.signingOut} className="w-full sm:w-auto sm:min-w-48">
          {t.signOut}
        </Button>
      </div>
    </Screen>
  );
}
