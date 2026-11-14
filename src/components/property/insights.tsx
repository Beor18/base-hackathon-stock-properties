import Link from "next/link";

import type { PropertyInsights } from "@/domain/property";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/es";
import { fill, formatAmount, formatMoney, formatPercent } from "@/i18n/format";

import { propertyHref } from "./api";
import { ListingImage } from "./listing-image";

type InsightsProps = {
  insights: PropertyInsights;
  lang: Locale;
  labels: Dictionary["detail"];
  perMonth: string;
};

const verdictTone = {
  below: "bg-palm",
  fair: "bg-mango",
  above: "bg-accent",
} as const;

/** Smarlin's market data for a listing. Each block only renders when Smarlin has that data. */
export function Insights({ insights, lang, labels, perMonth }: InsightsProps) {
  const { fairPrice, shortTermRental, marketRentUsd, comparablesCount } = insights;
  const hasZoneData = shortTermRental || marketRentUsd !== null || comparablesCount !== null;
  if (!fairPrice && !hasZoneData) return null;
  const t = labels.insights;

  return (
    <section aria-labelledby="insights-heading" className="rounded-[var(--radius-sheet)] border border-line bg-surface p-5">
      <h2 id="insights-heading" className="type-semiwide text-h3 text-ink">
        {labels.insightsTitle}
      </h2>

      {fairPrice && (
        <div className="mt-5">
          <p className="flex items-center gap-2 font-semibold text-ink">
            <span className={`size-2.5 shrink-0 rounded-full ${verdictTone[fairPrice.verdict]}`} aria-hidden />
            {t.verdict[fairPrice.verdict]}
          </p>
          <EstimateBar differencePct={fairPrice.differencePct} labels={t} />
          <div className="mt-2 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <p className="text-ink-2">
              {t.estimate}{" "}
              <span className="font-semibold text-ink tabular">{formatMoney(fairPrice.estimatedValueUsd, lang)}</span>
            </p>
            <p className="text-label text-ink-2">{t.confidence[fairPrice.confidence]}</p>
          </div>
          {Math.abs(fairPrice.differencePct) >= 0.5 && (
            <p className="mt-1 text-label text-ink-2 tabular">
              {fill(fairPrice.differencePct > 0 ? t.above : t.below, {
                pct: formatPercent(Math.abs(fairPrice.differencePct) / 100, lang, { digits: 1 }),
              })}
            </p>
          )}
        </div>
      )}

      {hasZoneData && (
        <>
          <dl className={`divide-y divide-line ${fairPrice ? "mt-5 border-t border-line" : "mt-3"}`}>
            {shortTermRental && (
              <div className="flex items-start justify-between gap-4 py-3">
                <dt className="text-ink-2">{t.shortTermRental}</dt>
                <dd className="text-right">
                  <span className="font-semibold text-ink tabular">
                    {formatMoney(shortTermRental.monthlyIncomeUsd, lang)}{" "}
                    <span className="font-normal text-ink-2">{perMonth}</span>
                  </span>
                  <span className="block text-label text-ink-2 tabular">
                    {fill(t.occupancy, {
                      pct: formatPercent(shortTermRental.occupancyPct / 100, lang),
                      nightly: formatMoney(shortTermRental.nightlyRateUsd, lang),
                    })}
                  </span>
                </dd>
              </div>
            )}
            {marketRentUsd !== null && (
              <div className="flex items-start justify-between gap-4 py-3">
                <dt className="text-ink-2">{t.marketRent}</dt>
                <dd className="font-semibold text-ink tabular">
                  {formatMoney(marketRentUsd, lang)} <span className="font-normal text-ink-2">{perMonth}</span>
                </dd>
              </div>
            )}
            {comparablesCount !== null && (
              <div className="flex items-start justify-between gap-4 py-3">
                <dt className="text-ink-2">{t.comparables}</dt>
                <dd className="font-semibold text-ink tabular">{formatAmount(comparablesCount, lang)}</dd>
              </div>
            )}
          </dl>
          <p className="mt-1 text-label text-ink-3">{t.zoneNote}</p>
          {shortTermRental?.attribution && (
            <p className="mt-1 text-label text-ink-3">{shortTermRental.attribution}</p>
          )}
        </>
      )}
    </section>
  );
}

/** List price against Smarlin's estimate: the tick is the estimate, the dot is the asking price. */
function EstimateBar({ differencePct, labels }: { differencePct: number; labels: Dictionary["detail"]["insights"] }) {
  const clamped = Math.max(-25, Math.min(25, differencePct));
  const position = 50 + clamped * 2;
  return (
    <div className="mt-4" aria-hidden>
      <div className="relative h-6">
        <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-gradient-to-r from-palm/60 via-mango/70 to-accent/60" />
        <div className="absolute left-1/2 top-0 h-6 w-0.5 -translate-x-1/2 rounded-full bg-ink-2" />
        <div
          className="absolute top-1/2 size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-surface bg-ink shadow-raise"
          style={{ left: `${position}%` }}
        />
      </div>
      <div className="mt-1 flex justify-between text-label text-ink-3">
        <span>{labels.scaleLow}</span>
        <span>{labels.scaleHigh}</span>
      </div>
    </div>
  );
}

type SimilarProps = {
  items: PropertyInsights["similar"];
  lang: Locale;
  title: string;
  distance: string;
};

/** Similar Smarlin listings nearby, as a swipeable row. */
export function SimilarHomes({ items, lang, title, distance }: SimilarProps) {
  if (items.length === 0) return null;
  return (
    <section aria-labelledby="similar-heading" className="mt-8">
      <h2 id="similar-heading" className="type-semiwide text-h3 text-ink">
        {title}
      </h2>
      <ul className="snap-strip -mx-5 mt-4 flex gap-4 overflow-x-auto px-5 pb-2 md:-mx-8 md:px-8 lg:mx-0 lg:px-0">
        {items.map((item) => (
          <li key={item.ref} className="w-56 shrink-0">
            <Link href={propertyHref(lang, item.ref)} className="group block rounded-[var(--radius-sheet)]">
              <div className="relative aspect-[4/3] overflow-hidden rounded-[var(--radius-sheet)] bg-surface-2">
                {item.imageUrl && (
                  <ListingImage
                    src={item.imageUrl}
                    alt=""
                    fill
                    sizes="224px"
                    className="object-cover"
                  />
                )}
              </div>
              <p className="mt-2 font-semibold text-ink tabular">{formatMoney(item.priceUsd, lang)}</p>
              <p className="line-clamp-1 text-label text-ink-2 group-hover:underline">{item.title}</p>
              {item.distanceKm !== null && (
                <p className="text-label text-ink-3 tabular">
                  {fill(distance, { km: formatAmount(item.distanceKm, lang, item.distanceKm < 10 ? 1 : 0) })}
                </p>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
