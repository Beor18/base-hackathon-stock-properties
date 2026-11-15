"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import type { PropertyDetail } from "@/domain/property";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/es";
import { fill, formatArea, formatMoney, plural } from "@/i18n/format";
import { goalDraftHref } from "@/components/account/routes";
import { Button, ButtonLink } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import { WaitBar } from "@/components/ui/wait-bar";
import { StateMessage } from "@/components/layout/screen";

import { getProperty, PropertyApiError, readStashedProperty } from "./api";
import { DEPOSIT_PCT_DEFAULT } from "./deposit";
import { DepositCalculator, parseUsd } from "./deposit-calculator";
import { Gallery } from "./gallery";
import { Insights, SimilarHomes } from "./insights";

type Labels = { detail: Dictionary["detail"]; common: Dictionary["common"] };

type State =
  | { status: "loading" }
  | { status: "ready"; property: PropertyDetail }
  | { status: "not-found" }
  | { status: "error" };

type PropertyDetailViewProps = {
  lang: Locale;
  propertyRef: string;
  /** Original URL for properties read from a pasted link, used to read it again if needed. */
  sourceUrl: string | null;
  labels: Labels;
};

async function loadProperty(ref: string, sourceUrl: string | null, signal: AbortSignal): Promise<PropertyDetail> {
  return readStashedProperty(ref) ?? getProperty(ref, sourceUrl, signal);
}

export function PropertyDetailView({ lang, propertyRef, sourceUrl, labels }: PropertyDetailViewProps) {
  const { detail, common } = labels;
  const [state, setState] = useState<State>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);
  const [pct, setPct] = useState(DEPOSIT_PCT_DEFAULT);
  const [manualPrice, setManualPrice] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    loadProperty(propertyRef, sourceUrl, controller.signal)
      .then((property) => setState({ status: "ready", property }))
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        if (error instanceof PropertyApiError && error.status === 404) setState({ status: "not-found" });
        else {
          console.error(error);
          setState({ status: "error" });
        }
      });
    return () => controller.abort();
  }, [propertyRef, sourceUrl, attempt]);

  if (state.status === "loading") {
    return (
      <div className="mx-auto w-full max-w-6xl px-5 md:px-8">
        <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_24rem] lg:gap-10">
          <div className="skeleton mt-3 aspect-[4/3] rounded-[var(--radius-photo)] lg:aspect-[16/11]" />
          <div className="mt-6 lg:mt-3">
            <WaitBar steps={[detail.loading]} typicalSeconds={detail.loadingSeconds} labels={common} />
          </div>
        </div>
      </div>
    );
  }

  if (state.status === "not-found") {
    return (
      <div className="mx-auto w-full max-w-xl px-5 md:px-8">
        <StateMessage title={detail.notFoundTitle} body={detail.notFoundBody}>
          <ButtonLink href={`/${lang}/casa`} block>
            {detail.notFoundCta}
          </ButtonLink>
        </StateMessage>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="mx-auto w-full max-w-xl px-5 pt-6 md:px-8">
        <Notice
          tone="error"
          action={
            <Button variant="secondary" size="md" onClick={() => { setState({ status: "loading" }); setAttempt((value) => value + 1); }}>
              {common.retry}
            </Button>
          }
        >
          {detail.error}
        </Notice>
      </div>
    );
  }

  const { property } = state;
  const images = property.images.length > 0 ? property.images : property.imageUrl ? [property.imageUrl] : [];
  const manualPriceUsd = property.priceUsd === null ? parseUsd(manualPrice) : null;
  const canContinue = property.priceUsd !== null || manualPriceUsd !== null;
  const facts = [
    property.bedrooms ? plural(common.bedrooms, property.bedrooms) : null,
    property.bathrooms ? plural(common.bathrooms, property.bathrooms) : null,
    property.areaM2 ? formatArea(property.areaM2, lang) : null,
  ].filter(Boolean);
  const isSmarlin = property.provider === "smarlin";

  const cta = canContinue ? (
    <ButtonLink
      href={goalDraftHref(lang, {
        ref: property.ref,
        pct,
        manualPriceUsd,
        sourceUrl: isSmarlin ? null : property.sourceUrl,
      })}
      block
    >
      {detail.cta}
    </ButtonLink>
  ) : (
    <Button block disabled>
      {detail.ctaNeedsPrice}
    </Button>
  );

  return (
    <div className="mx-auto w-full max-w-6xl px-5 pb-32 md:px-8 lg:pb-0">
      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_24rem] lg:gap-10">
        <div className="min-w-0">
          <Link
            href={`/${lang}/casa`}
            className="-ml-2 mt-1 inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2 text-label font-semibold text-ink-2 hover:text-ink"
          >
            <svg viewBox="0 0 20 20" className="size-4" aria-hidden fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12.5 4.5L7 10l5.5 5.5" />
            </svg>
            {common.back}
          </Link>
          <div className="mt-1">
            <Gallery
              images={images}
              title={property.title}
              labels={{
                photo: detail.photo,
                photoAlt: detail.photoAlt,
                noPhoto: detail.noPhoto,
                prevPhoto: detail.prevPhoto,
                nextPhoto: detail.nextPhoto,
              }}
            />
          </div>

          <div className="mt-6">
            {property.priceUsd !== null ? (
              <>
                <p className="type-display text-h1 text-ink tabular">{formatMoney(property.priceUsd, lang)}</p>
                <h1 className="mt-2 text-h3 font-semibold text-balance text-ink">{property.title}</h1>
              </>
            ) : (
              <h1 className="type-display text-h2 text-balance text-ink">{property.title}</h1>
            )}
            {property.location && <p className="mt-1 text-lead text-ink-2">{property.location}</p>}
            {facts.length > 0 && <p className="mt-1 text-ink-3">{facts.join(", ")}</p>}
          </div>

          <div className="mt-6 lg:hidden">
            <DepositCalculator
              lang={lang}
              priceUsd={property.priceUsd}
              manualPrice={manualPrice}
              onManualPriceChange={setManualPrice}
              pct={pct}
              onPctChange={setPct}
              labels={detail.calculator}
            />
          </div>

          {property.insights && (
            <div className="mt-6">
              <Insights insights={property.insights} lang={lang} labels={detail} perMonth={common.perMonth} />
            </div>
          )}

          {property.description && (
            <section aria-labelledby="about-heading" className="mt-8">
              <h2 id="about-heading" className="type-heading text-h3 text-ink">
                {detail.description}
              </h2>
              <p className="mt-3 max-w-prose whitespace-pre-line text-ink-2 text-pretty">{property.description}</p>
            </section>
          )}

          {property.insights && (
            <SimilarHomes
              items={property.insights.similar}
              lang={lang}
              title={detail.similarTitle}
              distance={detail.similarDistance}
            />
          )}

          <div className="mt-6 flex flex-col gap-1 text-label text-ink-2">
            {property.agent && (
              <p>
                {fill(detail.agent, { name: property.agent.name })}
                {property.agent.company ? `, ${property.agent.company}` : ""}
              </p>
            )}
            <a
              href={property.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center font-semibold text-accent underline-offset-4 hover:underline"
            >
              {isSmarlin ? detail.sourceSmarlin : detail.source}
            </a>
          </div>
        </div>

        {/* From desktop up the calculator and the action stay in view next to the photos. */}
        <aside className="hidden lg:block">
          <div className="sticky top-6 mt-[3.25rem] flex flex-col gap-4">
            <DepositCalculator
              lang={lang}
              priceUsd={property.priceUsd}
              manualPrice={manualPrice}
              onManualPriceChange={setManualPrice}
              pct={pct}
              onPctChange={setPct}
              labels={detail.calculator}
            />
            {cta}
          </div>
        </aside>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-paper/95 px-5 pb-[max(env(safe-area-inset-bottom),0.875rem)] pt-3 shadow-dock backdrop-blur-md lg:hidden">
        <div className="mx-auto flex max-w-xl items-center gap-4">
          {canContinue && (
            <div className="shrink-0">
              <p className="text-label text-ink-2">{common.sena}</p>
              <p className="type-heading text-ink tabular">
                {formatMoney(Math.round((property.priceUsd ?? manualPriceUsd ?? 0) * (pct / 100)), lang)}
              </p>
            </div>
          )}
          <div className="min-w-0 flex-1">{cta}</div>
        </div>
      </div>
    </div>
  );
}
