"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { Wordmark } from "@/components/brand/wordmark";
import { deployment } from "@/config/deployment";
import { useStats } from "@/hooks/queries";
import type { Locale } from "@/i18n/config";
import { fill, formatAmount, formatBps, formatMoney } from "@/i18n/format";
import type { PitchDeck, PitchSlide } from "@/i18n/pitch/es";
import { DEPOSIT_PCT, MIN_CONTRIBUTION_USD } from "@/lib/product";
import { wadToNumber } from "@/lib/view-models";

/*
 * Deck colors are fixed (not theme tokens) so the presentation looks the same on any screen
 * and in either color scheme.
 */
const tones: Record<PitchSlide["tone"], { slide: string; muted: string; rule: string; accent: string }> = {
  paper: { slide: "bg-[#f3f4ef] text-[#15232b]", muted: "text-[#4a5b64]", rule: "border-[#15232b]", accent: "text-[#b3165a]" },
  ink: { slide: "bg-[#15232b] text-[#f3f4ef]", muted: "text-[#b9c6ca]", rule: "border-[#f5b83d]", accent: "text-[#f5b83d]" },
  accent: { slide: "bg-[#b3165a] text-white", muted: "text-white/85", rule: "border-white", accent: "text-[#f5b83d]" },
  mango: { slide: "bg-[#f5b83d] text-[#15232b]", muted: "text-[#15232b]/80", rule: "border-[#15232b]", accent: "text-[#b3165a]" },
};

/** Deposit used for the worked example on the business model slide, in USD. */
const EXAMPLE_DEPOSIT_USD = 5_000;

/**
 * Figures the slides quote from the product itself (fees, minimums, deposit range). They come from
 * the deployment, so the deck can never disagree with what the app charges.
 */
function deckValues(lang: Locale): Record<string, string> {
  const { contributionFeeBps, reservationFeeBps } = deployment.params;
  const contributionFees = (EXAMPLE_DEPOSIT_USD * contributionFeeBps) / 10_000;
  const reservationFee = (EXAMPLE_DEPOSIT_USD * reservationFeeBps) / 10_000;
  const pct = (value: number) => formatBps(value * 100, lang);
  return {
    minContribution: formatMoney(MIN_CONTRIBUTION_USD, lang),
    contributionFee: formatBps(contributionFeeBps, lang),
    reservationFee: formatBps(reservationFeeBps, lang),
    depositDefault: pct(DEPOSIT_PCT.default),
    depositMin: pct(DEPOSIT_PCT.min),
    depositMax: pct(DEPOSIT_PCT.max),
    exampleDeposit: formatMoney(EXAMPLE_DEPOSIT_USD, lang),
    exampleContributionFees: formatMoney(contributionFees, lang),
    exampleReservationFee: formatMoney(reservationFee, lang),
    exampleRevenue: formatMoney(contributionFees + reservationFee, lang),
  };
}

export function Deck({ deck, lang }: { deck: PitchDeck; lang: Locale }) {
  const scroller = useRef<HTMLDivElement>(null);
  const [values] = useState(() => deckValues(lang));
  const [index, setIndex] = useState(0);
  const total = deck.slides.length;

  useEffect(() => {
    const root = scroller.current;
    if (!root) return;
    root.focus({ preventScroll: true });
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setIndex(Number((entry.target as HTMLElement).dataset.slide));
        }
      },
      { root, threshold: 0.55 },
    );
    root.querySelectorAll("[data-slide]").forEach((slide) => observer.observe(slide));
    return () => observer.disconnect();
  }, []);

  function go(target: number) {
    const root = scroller.current;
    if (!root) return;
    const clamped = Math.min(Math.max(target, 0), total - 1);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    root.querySelector<HTMLElement>(`[data-slide="${clamped}"]`)?.scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
  }

  return (
    <div className="fixed inset-0 z-30 bg-[#f3f4ef]">
      <div
        ref={scroller}
        tabIndex={-1}
        onKeyDown={(event) => {
          if (event.key === "ArrowRight" || event.key === " ") {
            event.preventDefault();
            go(index + 1);
          } else if (event.key === "ArrowLeft") {
            event.preventDefault();
            go(index - 1);
          }
        }}
        className="h-full snap-y snap-mandatory overflow-y-auto outline-none"
        aria-roledescription="carousel"
        aria-label={deck.title}
      >
        {deck.slides.map((slide, slideIndex) => (
          <Slide key={slide.id} slide={slide} index={slideIndex} total={total} deck={deck} lang={lang} values={values} />
        ))}
      </div>

      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-3 p-4 md:p-6">
        <span className="rounded-full bg-[#15232b]/85 px-3 py-1.5 text-label font-semibold text-[#f3f4ef] tabular" aria-live="polite">
          {fill(deck.nav.slide, { n: index + 1, total })}
        </span>
        <div className="pointer-events-auto flex gap-2">
          <button
            type="button"
            onClick={() => go(index - 1)}
            disabled={index === 0}
            aria-label={deck.nav.previous}
            className="flex size-11 items-center justify-center rounded-full bg-[#15232b]/85 text-[#f3f4ef] disabled:opacity-40"
          >
            <svg viewBox="0 0 20 20" className="size-5" aria-hidden fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4.5 12.5L10 7l5.5 5.5" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => go(index + 1)}
            disabled={index === total - 1}
            aria-label={deck.nav.next}
            className="flex size-11 items-center justify-center rounded-full bg-[#15232b]/85 text-[#f3f4ef] disabled:opacity-40"
          >
            <svg viewBox="0 0 20 20" className="size-5" aria-hidden fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4.5 7.5L10 13l5.5-5.5" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

function Slide({
  slide,
  index,
  total,
  deck,
  lang,
  values,
}: {
  slide: PitchSlide;
  index: number;
  total: number;
  deck: PitchDeck;
  lang: Locale;
  values: Record<string, string>;
}) {
  const tone = tones[slide.tone];
  const text = (template: string) => fill(template, values);
  const titleSize =
    slide.layout === "cover" || slide.layout === "close" || slide.layout === "statement"
      ? "text-[clamp(2.5rem,7vw,5.5rem)] leading-[0.95]"
      : "text-[clamp(2rem,4.6vw,3.75rem)] leading-[0.98]";

  return (
    <section
      data-slide={index}
      aria-roledescription="slide"
      aria-label={fill(deck.nav.slide, { n: index + 1, total })}
      className={`flex min-h-full snap-start flex-col px-6 pb-24 pt-8 md:px-16 md:pb-28 md:pt-12 ${tone.slide}`}
    >
      <div className="flex items-center justify-between">
        <Wordmark title="" className="h-6 w-auto" />
        {slide.label && <p className={`text-label font-semibold ${tone.muted}`}>{slide.label}</p>}
      </div>

      <div className="mx-auto my-auto flex w-full max-w-6xl flex-col py-10">
        {slide.layout === "cover" && (
          <svg viewBox="0 0 96 80" className="mb-8 h-24 w-28 md:h-32 md:w-36" fill="none" aria-hidden>
            <path d="M14 34L48 8l34 26" stroke="#b3165a" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M26 74V48c0-9 7-16 16-16h0c9 0 16 7 16 16v26" stroke="#15232b" strokeWidth="7" strokeLinecap="round" />
            <path d="M26 56V74" stroke="#15232b" strokeWidth="7" strokeLinecap="round" />
          </svg>
        )}

        <h2 className={`type-wide max-w-5xl text-balance ${titleSize}`}>{text(slide.title)}</h2>
        {slide.body && (
          <p className={`mt-6 max-w-2xl text-lead md:text-h3 md:leading-snug text-pretty ${tone.muted}`}>{text(slide.body)}</p>
        )}

        {slide.points && slide.layout !== "team" && (
          <ol
            className={`mt-10 grid gap-x-8 gap-y-8 ${
              slide.points.length === 4
                ? "md:grid-cols-2 lg:grid-cols-4"
                : slide.points.length > 4
                  ? "md:grid-cols-2 lg:grid-cols-3"
                  : "md:grid-cols-3"
            }`}
          >
            {slide.points.map((point, pointIndex) => (
              <li key={point.title} className={`border-t-2 pt-4 ${tone.rule}`}>
                {slide.layout === "steps" && (
                  <span aria-hidden className={`type-wide mb-2 block text-h1 leading-none ${tone.accent}`}>
                    {pointIndex + 1}
                  </span>
                )}
                {point.tag && <p className={`mb-2 text-label font-semibold uppercase tracking-wide ${tone.accent}`}>{point.tag}</p>}
                <p className={`type-semiwide text-balance ${slide.numbers ? "text-h1" : "text-h3"}`}>{text(point.title)}</p>
                {point.body && <p className={`mt-2 text-pretty ${tone.muted}`}>{text(point.body)}</p>}
              </li>
            ))}
          </ol>
        )}

        {slide.layout === "live" && <LiveNumbers labels={deck.live} lang={lang} tone={tone} />}

        {slide.layout === "compare" && slide.compare && <CompareTable compare={slide.compare} tone={tone} />}

        {slide.layout === "team" && slide.points && (
          <ul className="mt-10 grid gap-8 md:grid-cols-2">
            {slide.points.map((person) => (
              <li key={person.title} className={`border-t-2 pt-4 ${tone.rule}`}>
                <p className="type-wide text-h2">{person.title}</p>
                <p className={`mt-2 text-lead ${tone.muted}`}>{person.body}</p>
              </li>
            ))}
          </ul>
        )}

        {slide.foot && <p className={`mt-10 max-w-3xl text-label text-pretty ${tone.muted}`}>{text(slide.foot)}</p>}

        {slide.layout === "close" && (
          <Link
            href={`/${lang}/casa`}
            className="type-semiwide mt-10 inline-flex min-h-14 w-full items-center justify-center rounded-[var(--radius-control)] bg-white px-8 text-[1.0625rem] text-[#b3165a] hover:bg-[#f7e3ec] sm:w-auto sm:self-start"
          >
            {deck.nav.openApp}
          </Link>
        )}
      </div>
    </section>
  );
}

type Tone = (typeof tones)[PitchSlide["tone"]];

/**
 * Traction read from the contracts at the moment the slide is shown. Zeros are shown as zeros:
 * the point of the slide is that nobody typed these numbers.
 */
function LiveNumbers({ labels, lang, tone }: { labels: PitchDeck["live"]; lang: Locale; tone: Tone }) {
  const { data, isError } = useStats();
  const explorer = deployment.explorerUrl;
  const numbers = data
    ? [
        { label: labels.goals, value: formatAmount(data.goalCount, lang) },
        { label: labels.reservations, value: formatAmount(data.reservationCount, lang) },
        { label: labels.locked, value: formatMoney(Math.round(wadToNumber(data.lockedValueUsd)), lang) },
        { label: labels.stocks, value: formatAmount(data.listedStocks, lang) },
      ]
    : null;

  return (
    <div className="mt-10">
      {numbers ? (
        <dl className="grid grid-cols-2 gap-x-8 gap-y-8 lg:grid-cols-4">
          {numbers.map((item) => (
            <div key={item.label} className={`flex flex-col-reverse border-t-2 pt-4 ${tone.rule}`}>
              <dt className={`mt-2 ${tone.muted}`}>{item.label}</dt>
              <dd className="type-wide text-[clamp(2.25rem,6vw,4.5rem)] leading-none tabular">{item.value}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className={`text-lead ${tone.muted}`} role="status">
          {isError ? labels.unavailable : labels.loading}
        </p>
      )}
      {explorer && (
        <p className={`mt-10 flex flex-wrap gap-x-6 gap-y-2 text-label ${tone.muted}`}>
          <span>{labels.contracts}</span>
          {[
            { label: labels.escrow, address: deployment.contracts.reservationEscrow },
            { label: labels.registry, address: deployment.contracts.goalRegistry },
          ].map((contract) => (
            <a
              key={contract.address}
              href={`${explorer}/address/${contract.address}`}
              target="_blank"
              rel="noreferrer"
              className={`font-semibold underline underline-offset-4 ${tone.accent}`}
            >
              {contract.label}
            </a>
          ))}
        </p>
      )}
    </div>
  );
}

/** Alternatives against the three things Seña does at once. Our row is the only full one. */
function CompareTable({ compare, tone }: { compare: NonNullable<PitchSlide["compare"]>; tone: Tone }) {
  return (
    <table className="mt-10 w-full max-w-4xl border-collapse text-left">
      <thead>
        <tr className={`border-b-2 ${tone.rule}`}>
          <td />
          {compare.columns.map((column) => (
            <th key={column} scope="col" className={`w-[22%] px-1 pb-3 text-center align-bottom text-label font-semibold md:px-3 ${tone.muted}`}>
              {column}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {compare.rows.map((row) => (
          <tr key={row.name} className={row.ours ? "bg-[#b3165a] text-white" : "border-b border-[#15232b]/15"}>
            <th scope="row" className={`py-3 pl-3 pr-2 font-semibold ${row.ours ? "type-semiwide text-h3" : ""}`}>
              {row.name}
            </th>
            {row.cells.map((cell, cellIndex) => (
              <td key={compare.columns[cellIndex]} className="px-1 py-3 text-center md:px-3">
                <span className="sr-only">{cell ? compare.yes : compare.no}</span>
                <svg viewBox="0 0 20 20" className={`mx-auto size-6 ${cell ? "" : "opacity-35"}`} aria-hidden fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                  {cell ? <path d="M4.5 10.5l3.5 3.5 7.5-8" /> : <path d="M6 6l8 8M14 6l-8 8" />}
                </svg>
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
