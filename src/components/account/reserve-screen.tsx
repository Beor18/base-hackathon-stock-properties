"use client";

import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/es";
import { fill, formatBps, formatDate, formatMoney, formatShares } from "@/i18n/format";
import { Screen, StateMessage } from "@/components/layout/screen";
import { HouseFill } from "@/components/property/house-fill";
import { Button, ButtonLink, ExternalButton } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import { Row, Rows } from "@/components/ui/rows";
import { WaitBar } from "@/components/ui/wait-bar";

import { EmptyHouse } from "./goal-screen";
import { formatDepositPct, GoalPropertyRow } from "./parts";
import { whatsappHref } from "./routes";
import { LoadError, SignInPanel } from "./sign-in-panel";
import type { Goal, SignInProps, TxProgress } from "./types";

/** What the broker's link carries (see `parseReservationOffer`), resolved for display. */
export type ReservationOffer = {
  brokerName: string;
  brokerCompany: string | null;
  depositPct: number;
  /** The broker is the listing's agent on Smarlin (checked by email when the link was made). */
  verified: boolean;
};

/**
 * `/reservar`: lock the goal's stocks as the seña.
 *
 * - `offer-missing`: the short link points at no offer (mistyped or made up).
 * - `offer-no-goal`: the broker's link was opened by an account with no goal yet. The one action
 *   starts a goal for that house with the link's seña (`setupHref`).
 * - `no-link`: the goal is reached but there is no broker link in the URL. The one action opens
 *   WhatsApp with a message asking the broker for it. `agent` comes from the listing.
 * - `not-reached`: the goal is not covered yet.
 * - `ready`: `lock` is what gets locked (shares and their value now), `senaUsd` the deposit,
 *   `feeUsd` the creation fee (`feeBps`), `endsAt` when the reservation expires (unix seconds).
 *   `onReserve` sends approve + createReservation in one batch; `tx` tracks it.
 * - `success`: `reservationUrl` is the public page `/r/[id]`.
 */
export type ReserveScreenState =
  | { kind: "signed-out"; signIn: SignInProps }
  | { kind: "loading" }
  | { kind: "error"; onRetry: () => void }
  | { kind: "no-goal" }
  | { kind: "offer-missing" }
  | { kind: "offer-no-goal"; offer: ReservationOffer; setupHref: string }
  | { kind: "not-reached"; goal: Goal }
  | { kind: "no-link"; goal: Goal; agent: { name: string; phone: string | null } | null; listingUrl: string }
  | {
      kind: "ready";
      goal: Goal;
      offer: ReservationOffer;
      senaUsd: number;
      lock: { shares: number; valueUsd: number };
      feeBps: number;
      feeUsd: number;
      endsAt: number;
      onReserve: () => void;
      tx: TxProgress | null;
      txError: boolean;
      /** Plain-words reason of the failure, when known. */
      txErrorDetail?: string | null;
    }
  | { kind: "success"; goal: Goal; reservationId: string; reservationUrl: string; endsAt: number };

type ReserveScreenProps = {
  lang: Locale;
  state: ReserveScreenState;
  labels: Pick<Dictionary, "reserve" | "signIn" | "common" | "goal" | "contribute">;
};

export function ReserveScreen({ lang, state, labels }: ReserveScreenProps) {
  const { reserve: t, common } = labels;
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
          <LoadError message={labels.goal.error} retry={common.retry} onRetry={state.onRetry} />
        </Screen>
      );
    case "no-goal":
      return (
        <Screen back={{ href: `/${lang}`, label: common.back }}>
          <StateMessage icon={<EmptyHouse />} title={labels.contribute.noGoalTitle} body={labels.contribute.noGoalBody}>
            <ButtonLink href={`/${lang}/casa`} block className="sm:w-auto sm:min-w-64">
              {labels.contribute.noGoalCta}
            </ButtonLink>
          </StateMessage>
        </Screen>
      );
    case "offer-missing":
      return (
        <Screen back={{ href: `/${lang}`, label: common.back }}>
          <StateMessage icon={<EmptyHouse />} title={t.offerMissingTitle} body={t.offerMissingBody}>
            <ButtonLink href={`/${lang}/casa`} block className="sm:w-auto sm:min-w-64">
              {labels.contribute.noGoalCta}
            </ButtonLink>
          </StateMessage>
        </Screen>
      );
    case "offer-no-goal":
      return (
        <Screen back={{ href: `/${lang}`, label: common.back }}>
          <StateMessage
            icon={<EmptyHouse />}
            title={fill(t.offerNoGoalTitle, { broker: state.offer.brokerName })}
            body={fill(t.offerNoGoalBody, { pct: formatDepositPct(state.offer.depositPct, lang) })}
          >
            {state.offer.verified && <VerifiedBroker label={t.verifiedBroker} />}
            <ButtonLink href={state.setupHref} block className="sm:w-auto sm:min-w-64">
              {t.offerNoGoalCta}
            </ButtonLink>
          </StateMessage>
        </Screen>
      );
    case "not-reached": {
      const remaining = Math.max(state.goal.targetUsd - state.goal.savedUsd, 0);
      return (
        <Screen
          back={back}
          title={t.notReachedTitle}
          lead={fill(t.notReachedBody, { amount: formatMoney(remaining, lang) })}
          dock={
            <ButtonLink href={`/${lang}/sumar`} block>
              {t.notReachedCta}
            </ButtonLink>
          }
        >
          <GoalPropertyRow property={state.goal.property} lang={lang} />
        </Screen>
      );
    }
    case "no-link": {
      const message = fill(t.noLinkMessage, {
        agent: state.agent ? ` ${state.agent.name}` : "",
        title: state.goal.property.title,
        url: state.listingUrl,
      });
      return (
        <Screen
          back={back}
          title={t.noLinkTitle}
          lead={t.noLinkBody}
          dock={
            <ExternalButton href={whatsappHref(message, state.agent?.phone)} block>
              <ChatGlyph />
              {t.noLinkCta}
            </ExternalButton>
          }
        >
          <GoalPropertyRow property={state.goal.property} lang={lang} />
          <blockquote className="mt-5 rounded-[var(--radius-sheet)] rounded-tl-md bg-palm-soft p-4 text-ink text-pretty">
            {message}
          </blockquote>
        </Screen>
      );
    }
    case "ready":
      return <ReserveReady lang={lang} state={state} labels={labels} />;
    case "success":
      return <ReserveSuccess lang={lang} state={state} labels={labels} />;
  }
}

function ReserveReady({
  lang,
  state,
  labels,
}: {
  lang: Locale;
  state: Extract<ReserveScreenState, { kind: "ready" }>;
  labels: ReserveScreenProps["labels"];
}) {
  const { reserve: t, common } = labels;
  const sena = formatMoney(state.senaUsd, lang);

  return (
    <Screen
      back={{ href: `/${lang}/meta`, label: common.back }}
      media={
        <HouseFill
          src={state.goal.property.imageUrl}
          alt={state.goal.property.title}
          progress={1}
          sizes="(min-width: 640px) 560px, 100vw"
          label={`${common.sena} ${sena}`}
          className="aspect-[16/10]"
        />
      }
      title={t.title}
      dock={
        state.tx ? (
          <WaitBar steps={t.steps} current={state.tx.step} typicalSeconds={t.stepsSeconds} labels={common} />
        ) : (
          <>
            {state.txError && (
              <Notice tone="error">
                {t.error}
                {state.txErrorDetail && <span className="mt-1 block font-semibold">{state.txErrorDetail}</span>}
              </Notice>
            )}
            <p className="flex justify-between text-label text-ink-2 tabular">
              <span>{fill(common.feeLine, { pct: formatBps(state.feeBps, lang) })}</span>
              <span className="font-semibold text-ink">{formatMoney(state.feeUsd, lang)}</span>
            </p>
            <Button block onClick={state.onReserve}>
              {fill(t.cta, { amount: sena })}
            </Button>
          </>
        )
      }
    >
      <p className="-mt-3 text-lead text-ink-2">{state.goal.property.title}</p>

      <div className="mt-5 rounded-[var(--radius-sheet)] border border-line bg-surface px-5 py-2">
        <Rows>
          <Row
            label={t.lock}
            value={fill(t.lockValue, { shares: formatShares(state.lock.shares, lang), stock: state.goal.stock.name })}
            hint={fill(t.lockWorth, { amount: formatMoney(state.lock.valueUsd, lang) })}
          />
          <Row
            label={common.sena}
            value={`${sena} (${formatDepositPct(state.offer.depositPct, lang)})`}
          />
          <Row
            label={t.beneficiary}
            value={state.offer.brokerName}
            hint={[state.offer.brokerCompany, state.offer.verified ? t.verifiedBroker : null].filter(Boolean).join(" · ") || undefined}
          />
          <Row label={t.until} value={formatDate(state.endsAt, lang)} />
          <Row label={fill(common.feeLine, { pct: formatBps(state.feeBps, lang) })} value={formatMoney(state.feeUsd, lang)} />
        </Rows>
      </div>

      <ul className="mt-6 flex flex-col gap-3">
        {t.facts.map((fact) => (
          <li key={fact} className="flex gap-3 text-ink-2">
            <svg viewBox="0 0 20 20" className="mt-0.5 size-5 shrink-0 text-palm" aria-hidden fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4.5 10.5l3.5 3.5 7.5-8" />
            </svg>
            <span className="text-pretty">{fact}</span>
          </li>
        ))}
      </ul>
    </Screen>
  );
}

function ReserveSuccess({
  lang,
  state,
  labels,
}: {
  lang: Locale;
  state: Extract<ReserveScreenState, { kind: "success" }>;
  labels: ReserveScreenProps["labels"];
}) {
  const { reserve: t } = labels;
  const message = fill(t.shareMessage, { title: state.goal.property.title, url: state.reservationUrl });
  return (
    <Screen
      media={
        <HouseFill
          src={state.goal.property.imageUrl}
          alt={state.goal.property.title}
          progress={1}
          sizes="(min-width: 640px) 560px, 100vw"
          label={t.successTitle}
          className="aspect-[16/10]"
        />
      }
      title={t.successTitle}
      lead={fill(t.successBody, { date: formatDate(state.endsAt, lang) })}
      dock={
        <>
          <ButtonLink href={`/${lang}/r/${encodeURIComponent(state.reservationId)}`} block>
            {t.successCta}
          </ButtonLink>
          <ExternalButton href={whatsappHref(message)} variant="secondary" block>
            <ChatGlyph />
            {t.share}
          </ExternalButton>
        </>
      }
    />
  );
}

/** Generic chat-bubble glyph (not a brand logo). */
export function ChatGlyph() {
  return (
    <svg viewBox="0 0 20 20" className="size-5" aria-hidden fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
      <path d="M10 3a7 7 0 0 0-6.1 10.4L3 17l3.7-.9A7 7 0 1 0 10 3z" />
    </svg>
  );
}

/** "Corredor verificado": the broker is the agent who publishes this house on Smarlin. */
function VerifiedBroker({ label }: { label: string }) {
  return (
    <p className="mb-5 flex items-center gap-1.5 text-label font-semibold text-palm">
      <svg viewBox="0 0 16 16" aria-hidden className="size-4 shrink-0">
        <path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {label}
    </p>
  );
}
