"use client";

import { useId, useState, type FormEvent, type ReactNode } from "react";

import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/es";
import { fill, formatAmount, formatDate, formatMoney, formatShares, shortAddress } from "@/i18n/format";
import { Screen, StateMessage } from "@/components/layout/screen";
import { HouseFill } from "@/components/property/house-fill";
import { Button, ButtonLink, ExternalButton } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import { Row, Rows } from "@/components/ui/rows";
import { WaitBar } from "@/components/ui/wait-bar";

import { ChatGlyph } from "./reserve-screen";
import { whatsappHref } from "./routes";
import { LoadError } from "./sign-in-panel";
import type { GoalProperty, StockOption } from "./types";

export type ReservationStatus = "active" | "claimed" | "disputed" | "payable" | "paid" | "released" | "expired";
export type ReservationRole = "depositor" | "beneficiary" | "arbiter" | "viewer";
export type ReservationAction = "release" | "claim" | "accept" | "dispute" | "resolve" | "settle";
export type ClaimReason = "backed-out" | "other";

export type ReservationView = {
  id: string;
  status: ReservationStatus;
  property: GoalProperty;
  senaUsd: number;
  /** What the broker can still claim (less than the seña after a partial payment). Defaults to `senaUsd`. */
  claimableUsd?: number;
  shares: number;
  stock: StockOption;
  /** Current value of the locked shares. */
  valueUsd: number;
  buyer: string;
  broker: { address: string; name: string | null; company: string | null };
  arbiter: { address: string; name: string | null };
  endsAt: number;
  feePaidUsd: number;
  /** Set while a claim exists. `respondBy` is the dispute deadline (unix seconds). */
  claim: { amountUsd: number; respondBy: number } | null;
  /** USD paid to the broker once settled. */
  paidUsd: number | null;
};

/**
 * Callbacks for the person's role. Only pass the ones the role may call; a missing callback hides
 * its button. `onClaim` gets the amount in USD and the reason.
 */
export type ReservationActions = {
  onRelease?: () => void;
  onClaim?: (amountUsd: number, reason: ClaimReason) => void;
  onAccept?: () => void;
  onDispute?: () => void;
  onResolve?: (inFavorOf: "broker" | "buyer") => void;
  onSettle?: () => void;
};

/**
 * `/r/[id]`: the public reservation page. Anyone with the link sees it; the role decides the action.
 * `pending` tracks a running transaction; `shareUrl` is this page's absolute URL.
 */
export type ReservationScreenState =
  | { kind: "loading" }
  | { kind: "not-found" }
  | { kind: "error"; onRetry: () => void }
  | {
      kind: "ready";
      reservation: ReservationView;
      role: ReservationRole;
      actions: ReservationActions;
      pending: { action: ReservationAction; step: number } | null;
      actionError: boolean;
      /** Plain-words reason of the failure, when known. */
      actionErrorDetail?: string | null;
      shareUrl: string;
    };

type ReservationScreenProps = {
  lang: Locale;
  state: ReservationScreenState;
  labels: Pick<Dictionary, "reservation" | "reserve" | "common">;
};

const statusTone: Record<ReservationStatus, string> = {
  active: "bg-mango text-mango-ink",
  claimed: "bg-accent text-accent-ink",
  disputed: "bg-accent text-accent-ink",
  payable: "bg-accent text-accent-ink",
  paid: "bg-ink text-paper",
  released: "bg-palm text-paper",
  expired: "bg-ink text-paper",
};

export function ReservationScreen({ lang, state, labels }: ReservationScreenProps) {
  const { reservation: t, common } = labels;

  if (state.kind === "loading") {
    return (
      <Screen title={t.title}>
        <div className="skeleton aspect-[16/10] rounded-[var(--radius-photo)]" aria-hidden />
        <WaitBar className="mt-6" steps={[t.loading]} typicalSeconds={t.loadingSeconds} labels={common} />
      </Screen>
    );
  }
  if (state.kind === "not-found") {
    return (
      <Screen>
        <StateMessage title={t.notFoundTitle} body={t.notFoundBody}>
          <ButtonLink href={`/${lang}`} variant="secondary">
            {t.actions.viewerCta}
          </ButtonLink>
        </StateMessage>
      </Screen>
    );
  }
  if (state.kind === "error") {
    return (
      <Screen title={t.title}>
        <LoadError message={t.error} retry={common.retry} onRetry={state.onRetry} />
      </Screen>
    );
  }

  return <ReservationReady lang={lang} state={state} labels={labels} />;
}

function ReservationReady({
  lang,
  state,
  labels,
}: {
  lang: Locale;
  state: Extract<ReservationScreenState, { kind: "ready" }>;
  labels: ReservationScreenProps["labels"];
}) {
  const { reservation: t, common } = labels;
  const { reservation: r, role, actions, pending } = state;
  const [claiming, setClaiming] = useState(false);
  const sena = formatMoney(r.senaUsd, lang);
  const claimAmount = formatMoney(r.claim?.amountUsd ?? r.senaUsd, lang);
  const you = (match: boolean) => (match ? ` (${t.you})` : "");

  const statusBody = fill(t.statusBody[r.status], {
    date: formatDate(r.claim && r.status === "claimed" ? r.claim.respondBy : r.endsAt, lang),
    amount: formatMoney(r.status === "paid" ? (r.paidUsd ?? r.claim?.amountUsd ?? r.senaUsd) : (r.claim?.amountUsd ?? r.senaUsd), lang),
  });

  const share = (
    <ExternalButton
      href={whatsappHref(fill(labels.reserve.shareMessage, { title: r.property.title, url: state.shareUrl }))}
      variant="secondary"
      block
    >
      <ChatGlyph />
      {t.actions.share}
    </ExternalButton>
  );

  let dock: ReactNode;
  if (pending) {
    dock = (
      <WaitBar
        steps={t.steps[pending.action]}
        current={pending.step}
        typicalSeconds={t.stepsSeconds}
        labels={common}
      />
    );
  } else if (claiming && actions.onClaim) {
    dock = null;
  } else if ((r.status === "active" || r.status === "expired") && role === "beneficiary" && actions.onRelease) {
    dock = (
      <>
        <Button block onClick={actions.onRelease}>
          {t.actions.release}
        </Button>
        {r.status === "active" && actions.onClaim && (
          <Button variant="quiet" block onClick={() => setClaiming(true)}>
            {t.actions.claim}
          </Button>
        )}
      </>
    );
  } else if (r.status === "expired" && actions.onRelease) {
    dock = (
      <Button block onClick={actions.onRelease}>
        {t.actions.release}
      </Button>
    );
  } else if (r.status === "claimed" && role === "depositor" && actions.onAccept && actions.onDispute) {
    dock = (
      <>
        <p className="font-semibold text-ink">{t.actions.decideTitle}</p>
        <div className="grid gap-2 sm:grid-cols-2">
          <Button variant="secondary" block onClick={actions.onAccept}>
            {t.actions.accept}
          </Button>
          <Button variant="secondary" block onClick={actions.onDispute}>
            {t.actions.dispute}
          </Button>
        </div>
      </>
    );
  } else if (r.status === "disputed" && role === "arbiter" && actions.onResolve) {
    const resolve = actions.onResolve;
    dock = (
      <div className="grid gap-2 sm:grid-cols-2">
        <Button variant="secondary" block onClick={() => resolve("broker")}>
          {t.actions.resolveBroker}
        </Button>
        <Button variant="secondary" block onClick={() => resolve("buyer")}>
          {t.actions.resolveBuyer}
        </Button>
      </div>
    );
  } else if (r.status === "payable" && actions.onSettle) {
    dock = (
      <>
        <Button block onClick={actions.onSettle}>
          {fill(t.actions.settle, { amount: claimAmount })}
        </Button>
        <p className="text-center text-label text-ink-2">{t.actions.settleHint}</p>
      </>
    );
  } else if (role === "viewer") {
    dock = (
      <ButtonLink href={`/${lang}/casa`} block>
        {t.actions.viewerCta}
      </ButtonLink>
    );
  } else {
    dock = share;
  }

  return (
    <Screen
      media={
        <HouseFill
          src={r.property.imageUrl}
          alt={r.property.title}
          progress={1}
          sizes="(min-width: 640px) 560px, 100vw"
          className="aspect-[16/10]"
        />
      }
      dock={
        dock ? (
          <>
            {state.actionError && (
              <Notice tone="error">
                {t.actionError}
                {state.actionErrorDetail && <span className="mt-1 block font-semibold">{state.actionErrorDetail}</span>}
              </Notice>
            )}
            {dock}
          </>
        ) : undefined
      }
    >
      <span className={`inline-flex items-center rounded-full px-3 py-1 text-label font-bold ${statusTone[r.status]}`}>
        {t.status[r.status]}
      </span>
      <h1 className="type-wide mt-3 text-h1 text-balance text-ink">{r.property.title}</h1>
      <p className="mt-2 text-lead text-ink-2 text-pretty">{statusBody}</p>

      {claiming && actions.onClaim && !pending && (
        <ClaimForm
          lang={lang}
          max={r.claimableUsd ?? r.senaUsd}
          labels={t}
          onCancel={() => setClaiming(false)}
          onSubmit={(amount, reason) => {
            setClaiming(false);
            actions.onClaim?.(amount, reason);
          }}
          close={common.close}
        />
      )}

      <div className="mt-6 rounded-[var(--radius-sheet)] border border-line bg-surface px-5 py-2">
        <Rows>
          <Row label={t.sena} value={sena} emphasis />
          <Row
            label={t.locked}
            value={fill(t.lockedValue, {
              shares: formatShares(r.shares, lang),
              stock: r.stock.name,
              amount: formatMoney(r.valueUsd, lang),
            })}
          />
          <Row label={t.buyer} value={`${shortAddress(r.buyer)}${you(role === "depositor")}`} />
          <Row
            label={t.broker}
            value={`${r.broker.name ?? shortAddress(r.broker.address)}${you(role === "beneficiary")}`}
            hint={r.broker.company ?? undefined}
          />
          <Row label={t.arbiter} value={`${r.arbiter.name ?? shortAddress(r.arbiter.address)}${you(role === "arbiter")}`} />
          <Row label={t.endsAt} value={formatDate(r.endsAt, lang)} />
          <Row label={t.feePaid} value={formatMoney(r.feePaidUsd, lang)} />
        </Rows>
      </div>

      {dock && dock !== share && role !== "viewer" && <div className="mt-5">{share}</div>}
    </Screen>
  );
}

function ClaimForm({
  lang,
  max,
  labels,
  onCancel,
  onSubmit,
  close,
}: {
  lang: Locale;
  max: number;
  labels: Dictionary["reservation"];
  onCancel: () => void;
  onSubmit: (amountUsd: number, reason: ClaimReason) => void;
  close: string;
}) {
  const amountId = useId();
  const [raw, setRaw] = useState(formatAmount(max, lang));
  const [reason, setReason] = useState<ClaimReason>("backed-out");
  const amount = Number(raw.replace(/[^\d]/g, ""));
  const valid = amount > 0 && amount <= max;

  function submit(event: FormEvent) {
    event.preventDefault();
    if (valid) onSubmit(amount, reason);
  }

  return (
    <form onSubmit={submit} className="mt-6 rounded-[var(--radius-sheet)] border border-accent bg-surface p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="type-semiwide text-h3 text-ink">{labels.actions.claim}</p>
          <p className="text-ink-2">{labels.actions.claimHint}</p>
        </div>
        <Button variant="quiet" size="md" onClick={onCancel}>
          {close}
        </Button>
      </div>
      <label htmlFor={amountId} className="mt-4 block text-label font-semibold text-ink">
        {labels.actions.claimAmount}
      </label>
      <div className="relative mt-1.5">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 font-semibold text-ink-2">USD</span>
        <input
          id={amountId}
          inputMode="numeric"
          value={raw}
          onChange={(event) => {
            const digits = event.target.value.replace(/[^\d]/g, "");
            setRaw(digits ? formatAmount(Number(digits), lang) : "");
          }}
          aria-invalid={!valid}
          className="h-14 w-full rounded-[var(--radius-control)] border border-line-strong bg-paper pl-16 pr-4 text-lead font-semibold text-ink tabular focus:border-ink focus:outline-none focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus)] aria-[invalid=true]:border-danger"
        />
      </div>
      <fieldset className="mt-4">
        <legend className="text-label font-semibold text-ink">{labels.actions.claimReason}</legend>
        <div className="mt-1.5 flex flex-col gap-1">
          {(["backed-out", "other"] as const).map((option) => (
            <label key={option} className="flex min-h-11 cursor-pointer items-center gap-3">
              <input
                type="radio"
                name="claim-reason"
                checked={reason === option}
                onChange={() => setReason(option)}
                className="size-5 accent-[var(--accent)]"
              />
              {option === "backed-out" ? labels.reasons.backedOut : labels.reasons.other}
            </label>
          ))}
        </div>
      </fieldset>
      <Button type="submit" block disabled={!valid} className="mt-4">
        {fill(labels.actions.claimSubmit, { amount: formatMoney(valid ? amount : max, lang) })}
      </Button>
    </form>
  );
}
