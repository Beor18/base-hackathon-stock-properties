"use client";

import { useEffect, useId, useState, type FormEvent } from "react";

import type { PropertyDetail } from "@/domain/property";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/es";
import { fill, formatMoney } from "@/i18n/format";
import { Screen, StateMessage } from "@/components/layout/screen";
import { getProperty, PropertyApiError } from "@/components/property/api";
import { DEPOSIT_PCT_DEFAULT, depositUsd } from "@/components/property/deposit";
import { DepositCalculator } from "@/components/property/deposit-calculator";
import { Button, ButtonLink, ExternalButton } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";
import { Notice } from "@/components/ui/notice";
import { WaitBar } from "@/components/ui/wait-bar";

import { GoalPropertyRow } from "./parts";
import { ChatGlyph } from "./reserve-screen";
import { whatsappHref } from "./routes";
import { SignInPanel } from "./sign-in-panel";
import type { SignInProps } from "./types";

/**
 * `/pedir?casa=<ref>`: the broker creates the reservation link. No transaction: the server keeps
 * the offer (property, seña %, the broker's own account) and the link only carries its id, so it
 * cannot be edited. The screen reads the property itself; integration provides the session and
 * `createOffer`, which saves the offer and returns the short link and whether the broker is
 * verified as the listing's agent.
 */
export type OfferInput = { ref: string; url: string | null; pct: number; brokerName: string; brokerCompany: string | null };

export type RequestLinkScreenState =
  | { kind: "loading" }
  | { kind: "signed-out"; signIn: SignInProps }
  | { kind: "ready"; createOffer: (input: OfferInput) => Promise<{ url: string; verified: boolean }> };

type RequestLinkScreenProps = {
  lang: Locale;
  propertyRef: string | null;
  sourceUrl: string | null;
  state: RequestLinkScreenState;
  labels: Pick<Dictionary, "request" | "signIn" | "common" | "detail">;
};

type Load = { status: "loading" } | { status: "ready"; property: PropertyDetail } | { status: "missing" } | { status: "error" };

export function RequestLinkScreen({ lang, propertyRef, sourceUrl, state, labels }: RequestLinkScreenProps) {
  const { request: t, common } = labels;
  const [load, setLoad] = useState<Load>(propertyRef ? { status: "loading" } : { status: "missing" });

  useEffect(() => {
    if (!propertyRef) return;
    const controller = new AbortController();
    getProperty(propertyRef, sourceUrl, controller.signal)
      .then((property) => setLoad({ status: "ready", property }))
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setLoad(error instanceof PropertyApiError && error.status === 404 ? { status: "missing" } : { status: "error" });
      });
    return () => controller.abort();
  }, [propertyRef, sourceUrl]);

  if (load.status === "missing") {
    return (
      <Screen title={t.title}>
        <StateMessage title={t.noProperty}>
          <ButtonLink href={`/${lang}/casa`} block className="sm:w-auto sm:min-w-64">
            {t.noPropertyCta}
          </ButtonLink>
        </StateMessage>
      </Screen>
    );
  }
  if (load.status === "loading") {
    return (
      <Screen title={t.title} lead={t.body}>
        <WaitBar steps={[t.loading]} typicalSeconds={t.loadingSeconds} labels={common} />
      </Screen>
    );
  }
  if (load.status === "error") {
    return (
      <Screen title={t.title}>
        <Notice tone="error">{labels.detail.error}</Notice>
      </Screen>
    );
  }

  const property = load.property;
  const row = {
    ref: property.ref,
    title: property.title,
    location: property.location,
    imageUrl: property.imageUrl ?? property.images[0] ?? null,
    priceUsd: property.priceUsd ?? 0,
  };

  if (state.kind === "loading") {
    return (
      <Screen title={t.title} lead={t.body}>
        <GoalPropertyRow property={row} lang={lang} />
      </Screen>
    );
  }

  if (state.kind === "signed-out") {
    return (
      <Screen title={t.title} lead={t.body}>
        <GoalPropertyRow property={row} lang={lang} />
        <div className="mt-5">
          <SignInPanel {...state.signIn} context={t.signInContext} labels={labels.signIn} common={common} />
        </div>
      </Screen>
    );
  }

  return <RequestForm key={property.ref} lang={lang} property={property} createOffer={state.createOffer} labels={labels} row={row} />;
}

function RequestForm({
  lang,
  property,
  createOffer,
  labels,
  row,
}: {
  lang: Locale;
  property: PropertyDetail;
  createOffer: Extract<RequestLinkScreenState, { kind: "ready" }>["createOffer"];
  labels: RequestLinkScreenProps["labels"];
  row: Parameters<typeof GoalPropertyRow>[0]["property"];
}) {
  const { request: t, common } = labels;
  const nameId = useId();
  const companyId = useId();
  const [name, setName] = useState(property.agent?.name ?? "");
  const [company, setCompany] = useState(property.agent?.company ?? "");
  const [pct, setPct] = useState(DEPOSIT_PCT_DEFAULT);
  const [manualPrice, setManualPrice] = useState("");
  const [phase, setPhase] = useState<"form" | "creating" | "ready">("form");
  const [link, setLink] = useState("");
  const [verified, setVerified] = useState(false);
  const [failed, setFailed] = useState(false);

  function create(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) return;
    setPhase("creating");
    setFailed(false);
    createOffer({
      ref: property.ref,
      url: property.provider === "link" ? property.sourceUrl : null,
      pct,
      brokerName: name.trim(),
      brokerCompany: company.trim() || null,
    })
      .then((offer) => {
        setLink(offer.url);
        setVerified(offer.verified);
        setPhase("ready");
      })
      .catch((error: unknown) => {
        console.error("[request] could not create the offer", error);
        setFailed(true);
        setPhase("form");
      });
  }

  if (phase === "ready") {
    const message = fill(t.shareMessage, { title: property.title, url: link });
    return (
      <Screen
        title={t.readyTitle}
        lead={t.readyBody}
        dock={
          <>
            <ExternalButton href={whatsappHref(message)} block>
              <ChatGlyph />
              {t.share}
            </ExternalButton>
            <CopyButton value={link} label={t.copy} copiedLabel={t.copied} block />
          </>
        }
      >
        <GoalPropertyRow
          property={row}
          lang={lang}
          detail={property.priceUsd ? `${common.sena} ${formatMoney(depositUsd(property.priceUsd, pct), lang)}` : undefined}
        />
        <p className="mt-5 break-all rounded-[var(--radius-control)] bg-surface-2 px-4 py-3 text-label text-ink">{link}</p>
        <p className="mt-3 text-label text-ink-2 text-pretty">
          {verified ? <span className="font-semibold text-palm">{t.verifiedNote}</span> : t.unverifiedNote}
        </p>
      </Screen>
    );
  }

  return (
    <form onSubmit={create}>
      <Screen
        title={t.title}
        lead={t.body}
        dock={
          phase === "creating" ? (
            <WaitBar steps={t.creating} typicalSeconds={t.creatingSeconds} labels={common} />
          ) : (
            <Button type="submit" block disabled={!name.trim()}>
              {t.cta}
            </Button>
          )
        }
      >
        <GoalPropertyRow property={row} lang={lang} />
        {failed && (
          <div className="mt-5">
            <Notice tone="error">{t.error}</Notice>
          </div>
        )}

        <label htmlFor={nameId} className="mt-6 block text-label font-semibold text-ink">
          {t.nameLabel}
        </label>
        <input
          id={nameId}
          value={name}
          onChange={(event) => setName(event.target.value)}
          autoComplete="name"
          required
          className="mt-1.5 h-14 w-full rounded-[var(--radius-control)] border border-line-strong bg-surface px-4 text-lead text-ink focus:border-ink focus:outline-none focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus)]"
        />
        <label htmlFor={companyId} className="mt-4 block text-label font-semibold text-ink">
          {t.companyLabel}
        </label>
        <input
          id={companyId}
          value={company}
          onChange={(event) => setCompany(event.target.value)}
          autoComplete="organization"
          className="mt-1.5 h-14 w-full rounded-[var(--radius-control)] border border-line-strong bg-surface px-4 text-lead text-ink focus:border-ink focus:outline-none focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus)]"
        />

        <div className="mt-6">
          <DepositCalculator
            lang={lang}
            priceUsd={property.priceUsd}
            manualPrice={manualPrice}
            onManualPriceChange={setManualPrice}
            pct={pct}
            onPctChange={setPct}
            labels={{ ...labels.detail.calculator, title: t.pctLabel }}
          />
        </div>
      </Screen>
    </form>
  );
}
