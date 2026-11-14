"use client";

import { useState, type ReactNode } from "react";

import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/es";
import { fill, formatBps, formatMoney, formatProgress } from "@/i18n/format";
import { Screen, StateMessage } from "@/components/layout/screen";
import { HouseFill } from "@/components/property/house-fill";
import { Button, ButtonLink } from "@/components/ui/button";
import { ShareButton } from "@/components/ui/share-button";
import { WaitBar } from "@/components/ui/wait-bar";

import { ContributeForm, type ContributeFormState } from "./contribute-screen";
import { EmptyHouse } from "./goal-screen";
import { GoalPropertyRow } from "./parts";
import { LoadError, SignInPanel } from "./sign-in-panel";
import type { Goal, PayCurrency, SignInProps } from "./types";

/**
 * `/vaquita/[address]`: the public page where family and friends add to someone else's home.
 * Whoever opens it sees the home and how far its seña is; the one action is adding to it.
 *
 * - `loading`: `goal` is set once the home is known and only the visitor's account is pending.
 * - `no-goal`: the address in the link has no goal (or is not an address).
 * - `reached`: the home already has its seña, so there is nothing left to add.
 * - `owner`: the visitor is the person saving. They share the link instead of adding.
 * - `signed-out`: the home first; the action opens the email sign-in.
 * - `ready`: the same amount form as `/sumar`, paying from the visitor's balance into the owner's
 *   goal. Zero balance in both currencies renders the "cargá tu cuenta" step instead.
 * - `success`: after the batch confirms, with the owner's updated goal.
 */
export type VaquitaScreenState =
  | { kind: "loading"; goal: Goal | null }
  | { kind: "error"; onRetry: () => void }
  | { kind: "no-goal" }
  | { kind: "reached"; goal: Goal; isOwner: boolean }
  | { kind: "owner"; goal: Goal; shareUrl: string }
  | { kind: "signed-out"; goal: Goal; feeBps: number; signIn: SignInProps }
  | (ContributeFormState & {
      /** `/cargar` with the way back to this page. */
      fundHref: string;
    })
  | { kind: "success"; amount: number; currency: PayCurrency; goal: Goal };

type VaquitaScreenProps = {
  lang: Locale;
  state: VaquitaScreenState;
  labels: Pick<Dictionary, "vaquita" | "contribute" | "signIn" | "common" | "goal">;
};

const CODE: Record<PayCurrency, "USD" | "ARS"> = { usd: "USD", ars: "ARS" };

const progressOf = (goal: Goal) => (goal.targetUsd > 0 ? Math.min(goal.savedUsd / goal.targetUsd, 1) : 0);

export function VaquitaScreen({ lang, state, labels }: VaquitaScreenProps) {
  const { vaquita: t, common } = labels;
  const pickHome = `/${lang}/casa`;

  switch (state.kind) {
    case "loading":
      if (state.goal) {
        return (
          <Home lang={lang} goal={state.goal} labels={labels}>
            <WaitBar
              className="mt-6"
              steps={[labels.contribute.loading]}
              typicalSeconds={labels.contribute.loadingSeconds}
              labels={common}
            />
          </Home>
        );
      }
      return (
        <Screen title={t.heading}>
          <div className="skeleton aspect-[16/10] rounded-[var(--radius-photo)]" aria-hidden />
          <WaitBar className="mt-6" steps={[t.loading]} typicalSeconds={t.loadingSeconds} labels={common} />
        </Screen>
      );

    case "error":
      return (
        <Screen title={t.heading}>
          <LoadError message={t.error} retry={common.retry} onRetry={state.onRetry} />
        </Screen>
      );

    case "no-goal":
      return (
        <Screen>
          <StateMessage icon={<EmptyHouse />} title={t.noGoalTitle} body={t.noGoalBody}>
            <ButtonLink href={pickHome} block className="sm:w-auto sm:min-w-64">
              {t.noGoalCta}
            </ButtonLink>
          </StateMessage>
        </Screen>
      );

    case "reached":
      return (
        <Home
          lang={lang}
          goal={state.goal}
          labels={labels}
          heading={t.reachedTitle}
          dock={
            state.isOwner ? (
              <ButtonLink href={`/${lang}/meta`} block>
                {t.ownerGoalCta}
              </ButtonLink>
            ) : (
              <ButtonLink href={pickHome} block>
                {t.successCta}
              </ButtonLink>
            )
          }
        >
          <p className="mt-3 text-lead text-ink-2 text-pretty">{state.isOwner ? labels.goal.reachedBody : t.reachedBody}</p>
        </Home>
      );

    case "owner":
      return (
        <Home
          lang={lang}
          goal={state.goal}
          labels={labels}
          dock={
            <ShareButton
              url={state.shareUrl}
              text={t.share.message}
              label={t.share.cta}
              copiedLabel={t.share.copied}
              variant="primary"
              block
            />
          }
        >
          <Note title={t.ownerTitle} body={t.share.body} />
          <ButtonLink href={`/${lang}/meta`} variant="quiet" size="md" className="mt-2">
            {t.ownerGoalCta}
          </ButtonLink>
        </Home>
      );

    case "signed-out":
      return <SignedOut lang={lang} state={state} labels={labels} />;

    case "ready":
      if (state.balances.usd <= 0 && state.balances.ars <= 0) {
        return (
          <Home
            lang={lang}
            goal={state.goal}
            labels={labels}
            dock={
              <ButtonLink href={state.fundHref} block>
                {labels.contribute.fundCta}
              </ButtonLink>
            }
          >
            <Note title={labels.contribute.emptyTitle} body={t.emptyBody} />
          </Home>
        );
      }
      return (
        <ContributeForm
          lang={lang}
          state={state}
          // Same form as `/sumar`; only the lines that talk about "your" goal change.
          labels={{ common, contribute: { ...labels.contribute, ...t.form } }}
          frame={{
            title: t.heading,
            intro: <HomeRow lang={lang} goal={state.goal} labels={labels} />,
            fundHref: state.fundHref,
            feeBesideAction: true,
          }}
        />
      );

    case "success": {
      const pct = formatProgress(progressOf(state.goal), lang);
      // The payoff, and the loop: the home paints up to the new progress, then "now yours".
      return (
        <Screen
          media={<HomePhoto lang={lang} goal={state.goal} labels={labels} animate className="aspect-[4/3]" />}
          title={fill(t.successTitle, { amount: formatMoney(state.amount, lang, CODE[state.currency]) })}
          lead={fill(t.successBody, { pct })}
          dock={
            <ButtonLink href={pickHome} block>
              {t.successCta}
            </ButtonLink>
          }
        />
      );
    }
  }
}

function HomePhoto({
  lang,
  goal,
  labels,
  animate = false,
  className,
}: {
  lang: Locale;
  goal: Goal;
  labels: VaquitaScreenProps["labels"];
  animate?: boolean;
  className: string;
}) {
  const progress = progressOf(goal);
  return (
    <HouseFill
      src={goal.property.imageUrl}
      alt={fill(labels.vaquita.photoAlt, { title: goal.property.title })}
      progress={progress}
      animate={animate}
      priority
      sizes="(min-width: 640px) 560px, 100vw"
      label={fill(labels.vaquita.progressPct, { pct: formatProgress(progress, lang) })}
      className={className}
    />
  );
}

const progressLine = (goal: Goal, lang: Locale, labels: VaquitaScreenProps["labels"]) =>
  fill(labels.vaquita.progress, { saved: formatMoney(goal.savedUsd, lang), target: formatMoney(goal.targetUsd, lang) });

/** The home in full: photo painted up to the progress, title, place and how far the seña is. */
function Home({
  lang,
  goal,
  labels,
  heading,
  dock,
  children,
}: {
  lang: Locale;
  goal: Goal;
  labels: VaquitaScreenProps["labels"];
  /** Replaces the progress headline, e.g. once the seña is complete. */
  heading?: string;
  dock?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <Screen media={<HomePhoto lang={lang} goal={goal} labels={labels} className="aspect-[16/10]" />} dock={dock}>
      <p className="font-semibold text-ink">{goal.property.title}</p>
      {goal.property.location && <p className="text-label text-ink-2">{goal.property.location}</p>}
      <h1 className="type-wide mt-3 text-h1 text-balance text-ink tabular">{heading ?? progressLine(goal, lang, labels)}</h1>
      {children}
    </Screen>
  );
}

/** What the visitor has to know before the action. Kept short so it clears the docked button on a phone. */
function Note({ title, body }: { title: string; body: string }) {
  return (
    <>
      <p className="mt-4 font-semibold text-ink">{title}</p>
      <p className="mt-1 text-ink-2 text-pretty">{body}</p>
    </>
  );
}

/** The home in one row, for the steps where a form needs the room. */
function HomeRow({ lang, goal, labels }: { lang: Locale; goal: Goal; labels: VaquitaScreenProps["labels"] }) {
  return <GoalPropertyRow property={goal.property} lang={lang} detail={progressLine(goal, lang, labels)} />;
}

function SignedOut({
  lang,
  state,
  labels,
}: {
  lang: Locale;
  state: Extract<VaquitaScreenState, { kind: "signed-out" }>;
  labels: VaquitaScreenProps["labels"];
}) {
  const { vaquita: t, common } = labels;
  // A sign-in already under way (code sent) must survive a remount of this screen.
  const [asking, setAsking] = useState(state.signIn.step === "code" || state.signIn.status !== "idle");

  if (asking) {
    return (
      <Screen title={t.heading}>
        <HomeRow lang={lang} goal={state.goal} labels={labels} />
        <div className="mt-5">
          <SignInPanel {...state.signIn} context={t.signInContext} labels={labels.signIn} common={common} />
        </div>
      </Screen>
    );
  }

  // The home first, with the action in the thumb zone: the email form would sit below the fold.
  return (
    <Home
      lang={lang}
      goal={state.goal}
      labels={labels}
      dock={
        <>
          <Button block onClick={() => setAsking(true)}>
            {t.heading}
          </Button>
          {/* Next to the action, so the fee is in view on any phone before the person goes on. */}
          <p className="text-center text-label text-ink-2 tabular">{fill(t.feeNote, { pct: formatBps(state.feeBps, lang) })}</p>
        </>
      }
    >
      <p className="mt-3 text-lead text-ink-2 text-pretty">{t.body}</p>
    </Home>
  );
}
