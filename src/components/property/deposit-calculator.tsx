"use client";

import { useId, type CSSProperties } from "react";

import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/es";
import { fill, formatAmount, formatMoney } from "@/i18n/format";

import { DEPOSIT_PCT_MAX, DEPOSIT_PCT_MIN, DEPOSIT_PCT_STEP, depositUsd } from "./deposit";

type DepositCalculatorProps = {
  lang: Locale;
  /** Listing price. Null when a pasted link had no price: the person types it in. */
  priceUsd: number | null;
  manualPrice: string;
  onManualPriceChange: (value: string) => void;
  pct: number;
  onPctChange: (pct: number) => void;
  labels: Dictionary["detail"]["calculator"];
};

function formatPct(pct: number, lang: Locale) {
  const digits = Number.isInteger(pct) ? 0 : 1;
  return lang === "es" ? `${formatAmount(pct, lang, digits)} %` : `${formatAmount(pct, lang, digits)}%`;
}

/** Parses "250.000", "250,000" or "250000" into a number of dollars. */
export function parseUsd(value: string): number | null {
  const digits = value.replace(/[^\d]/g, "");
  if (!digits) return null;
  const amount = Number(digits);
  return Number.isFinite(amount) && amount > 0 ? amount : null;
}

/** "Tu seña": price × percentage, with the percentage adjustable from 1 % to 10 %. */
export function DepositCalculator({
  lang,
  priceUsd,
  manualPrice,
  onManualPriceChange,
  pct,
  onPctChange,
  labels,
}: DepositCalculatorProps) {
  const sliderId = useId();
  const priceId = useId();
  const effectivePrice = priceUsd ?? parseUsd(manualPrice);
  const amount = effectivePrice !== null ? depositUsd(effectivePrice, pct) : null;
  const fillPct = ((pct - DEPOSIT_PCT_MIN) / (DEPOSIT_PCT_MAX - DEPOSIT_PCT_MIN)) * 100;

  return (
    <section aria-labelledby={`${sliderId}-title`} className="rounded-[var(--radius-sheet)] bg-mango-soft p-5">
      {priceUsd === null && (
        <div className="mb-5 border-b border-mango/50 pb-5">
          <p className="font-semibold text-ink">{labels.noPriceTitle}</p>
          <label htmlFor={priceId} className="mt-3 block text-label font-semibold text-ink">
            {labels.noPriceLabel}
          </label>
          <div className="relative mt-1.5">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 font-semibold text-ink-2">USD</span>
            <input
              id={priceId}
              inputMode="numeric"
              autoComplete="off"
              value={manualPrice}
              onChange={(event) => {
                const parsed = parseUsd(event.target.value);
                onManualPriceChange(parsed === null ? "" : formatAmount(parsed, lang));
              }}
              aria-describedby={`${priceId}-hint`}
              className="h-14 w-full rounded-[var(--radius-control)] border border-line-strong bg-surface pl-16 pr-4 text-lead font-semibold text-ink tabular focus:border-ink focus:outline-none focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus)]"
            />
          </div>
          <p id={`${priceId}-hint`} className="mt-1.5 text-label text-ink-2">
            {labels.noPriceHint}
          </p>
        </div>
      )}

      <h2 id={`${sliderId}-title`} className="font-semibold text-ink">
        {labels.title}
      </h2>
      <p className="type-wide mt-1 text-h1 text-ink tabular" aria-live="polite">
        {formatMoney(amount ?? 0, lang)}
      </p>
      <p className="mt-1 text-ink-2 tabular">{fill(labels.pctOfPrice, { pct: formatPct(pct, lang) })}</p>

      <label htmlFor={sliderId} className="sr-only">
        {labels.sliderLabel}
      </label>
      <input
        id={sliderId}
        type="range"
        min={DEPOSIT_PCT_MIN}
        max={DEPOSIT_PCT_MAX}
        step={DEPOSIT_PCT_STEP}
        value={pct}
        onChange={(event) => onPctChange(Number(event.target.value))}
        aria-valuetext={formatPct(pct, lang)}
        className="sena-range mt-3"
        style={{ "--fill": `${fillPct}%` } as CSSProperties}
      />
      <div className="flex justify-between text-label text-ink-2 tabular" aria-hidden>
        <span>{formatPct(DEPOSIT_PCT_MIN, lang)}</span>
        <span>{formatPct(DEPOSIT_PCT_MAX, lang)}</span>
      </div>
      <p className="mt-3 text-label text-ink-2">{labels.hint}</p>
    </section>
  );
}

export { formatPct };
