"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { Wordmark } from "@/components/brand/wordmark";
import { deployment } from "@/config/deployment";
import { useStats } from "@/hooks/queries";
import type { Locale } from "@/i18n/config";
import { fill, formatAmount, formatBps, formatMoney } from "@/i18n/format";
import type { PitchDeck, PitchShot, PitchSlide } from "@/i18n/pitch/es";
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
  const big = slide.layout === "cover" || slide.layout === "statement" || slide.layout === "close";
  const titleSize = big ? "text-[clamp(2.25rem,6vw,4.75rem)] leading-[1.02]" : "text-[clamp(1.75rem,4.2vw,3.5rem)] leading-[1.06]";

  const title = <h2 className={`type-display max-w-5xl text-balance ${titleSize}`}>{text(slide.title)}</h2>;
  const body = slide.body && <p className={`mt-4 max-w-2xl text-pretty md:mt-5 md:text-h3 md:leading-snug ${tone.muted}`}>{text(slide.body)}</p>;
  const foot = slide.foot && <p className={`mt-6 max-w-3xl text-label text-pretty md:mt-8 ${tone.muted}`}>{text(slide.foot)}</p>;

  return (
    <section
      data-slide={index}
      aria-roledescription="slide"
      aria-label={fill(deck.nav.slide, { n: index + 1, total })}
      className={`flex min-h-full snap-start flex-col px-6 pb-20 pt-6 md:px-16 md:pb-24 md:pt-10 ${tone.slide}`}
    >
      <div className="flex items-center justify-between">
        <Wordmark title="" className="h-6 w-auto" />
        {slide.label && <p className={`text-label font-semibold ${tone.muted}`}>{slide.label}</p>}
      </div>

      <div className="mx-auto my-auto w-full max-w-6xl py-6 md:py-8">
        {slide.layout === "cover" && slide.shots?.[0] ? (
          <div className="grid items-center gap-8 md:grid-cols-[1.25fr_1fr] md:gap-16">
            <div>
              {title}
              {body}
              {foot}
            </div>
            <Phone shot={slide.shots[0]} className="h-[30vh] justify-self-center md:h-[min(68vh,36rem)] md:rotate-[2.5deg]" />
          </div>
        ) : slide.layout === "growth" && slide.points && slide.shots?.[0] ? (
          <div className="grid items-center gap-x-14 md:grid-cols-[1fr_auto]">
            <div>
              {title}
              {body}
              <div className="mt-6 grid grid-cols-[1fr_5.5rem] items-start gap-4 sm:grid-cols-[1fr_8rem] md:mt-8 md:block">
                <ol className="grid gap-4 md:gap-5">
                  {slide.points.map((point, pointIndex) => (
                    <li key={point.title} className="flex items-start gap-3 md:gap-4">
                      <span
                        aria-hidden
                        className="type-display flex size-8 shrink-0 items-center justify-center rounded-full bg-[#f5b83d] text-body text-[#15232b] md:size-9 md:text-[1.0625rem]"
                      >
                        {pointIndex + 1}
                      </span>
                      <p className="pt-1 font-semibold text-pretty md:text-h3 md:leading-snug">{text(point.title)}</p>
                    </li>
                  ))}
                </ol>
                <Phone shot={slide.shots[0]} className="w-full md:hidden" />
              </div>
              {foot}
            </div>
            <Phone shot={slide.shots[0]} className="hidden md:block md:h-[min(66vh,34rem)] md:-rotate-[2deg]" />
          </div>
        ) : (
          <>
            {title}
            {body}
          </>
        )}

        {slide.layout === "points" && slide.points && (
          <ul className="mt-7 grid gap-x-10 gap-y-5 md:mt-10 md:grid-cols-3 md:gap-y-7">
            {slide.points.map((point) => (
              <li key={point.title} className={`border-t-2 pt-3 md:pt-4 ${tone.rule}`}>
                <p className={`type-display text-balance ${slide.numbers ? "text-[clamp(2rem,4.4vw,3.5rem)] leading-none" : "text-h3"}`}>
                  {text(point.title)}
                </p>
                {point.body && <p className={`mt-2 text-label text-pretty md:mt-3 md:text-body ${tone.muted}`}>{text(point.body)}</p>}
              </li>
            ))}
          </ul>
        )}

        {slide.layout === "product" && slide.shots && (
          <ol className="-mx-6 mt-6 flex snap-x snap-mandatory gap-5 overflow-x-auto px-6 pb-2 md:mx-0 md:grid md:grid-cols-3 md:gap-10 md:overflow-visible md:px-0">
            {slide.shots.map((shot) => (
              <li key={shot.src} className="flex w-[62vw] shrink-0 snap-center flex-col items-center sm:w-[40vw] md:w-auto">
                <Phone shot={shot} className="h-[38vh] md:h-[min(39vh,24rem)]" />
                {shot.title && <p className="type-heading mt-5 text-center text-h3">{text(shot.title)}</p>}
                {shot.body && <p className={`mt-1 max-w-64 text-center text-label text-pretty md:text-body ${tone.muted}`}>{text(shot.body)}</p>}
              </li>
            ))}
          </ol>
        )}

        {slide.layout === "zero" && (
          <>
            <LiveNumbers labels={deck.live} lang={lang} />
            {slide.points && (
              <ol className="mt-6 grid gap-x-10 gap-y-4 md:mt-8 md:grid-cols-3">
                {slide.points.map((point) => (
                  <li key={point.title} className={`border-t-2 pt-2 md:pt-3 ${tone.rule}`}>
                    <p className="type-heading md:text-h3">{text(point.title)}</p>
                    {point.body && <p className={`mt-1 text-label text-pretty md:mt-1.5 md:text-body ${tone.muted}`}>{text(point.body)}</p>}
                  </li>
                ))}
              </ol>
            )}
          </>
        )}

        {slide.layout === "close" && slide.points && (
          <ul className="mt-7 grid gap-5 md:mt-10 md:grid-cols-2 md:gap-6">
            {slide.points.map((person) => (
              <li key={person.title} className={`border-t-2 pt-4 ${tone.rule}`}>
                <p className="type-heading text-h2">{person.title}</p>
                <p className={`mt-1.5 text-label md:text-body ${tone.muted}`}>{person.body}</p>
              </li>
            ))}
          </ul>
        )}

        {slide.layout !== "cover" && slide.layout !== "growth" && foot}

        {slide.layout === "close" && (
          <Link
            href={`/${lang}/casa`}
            className="type-heading mt-8 inline-flex min-h-14 w-full items-center justify-center rounded-[var(--radius-control)] bg-[#b3165a] px-8 text-[1.0625rem] text-white hover:bg-[#9a124d] sm:w-auto"
          >
            {deck.nav.openApp}
          </Link>
        )}
      </div>
    </section>
  );
}

/** A product capture in a phone frame. Sized by height (`className`); the width follows the screen. */
function Phone({ shot, className = "" }: { shot: PitchShot; className?: string }) {
  return (
    <div
      className={`aspect-[640/1385] overflow-hidden rounded-[1.75rem] border-[5px] border-[#15232b] bg-[#15232b] shadow-[0_28px_60px_-24px_rgba(21,35,43,0.55)] ${className}`}
    >
      <Image src={shot.src} alt={shot.alt} width={640} height={1385} sizes="(min-width: 768px) 320px, 62vw" className="block size-full object-cover object-top" />
    </div>
  );
}

/**
 * Where Accasa stands today, read from the contracts as the slide is shown. Zeros are shown as zeros:
 * the slide is about starting from them.
 */
function LiveNumbers({ labels, lang }: { labels: PitchDeck["live"]; lang: Locale }) {
  const { data, isError } = useStats();
  const explorer = deployment.explorerUrl;
  const numbers = data
    ? [
        { label: labels.goals, value: formatAmount(data.goalCount, lang) },
        { label: labels.reservations, value: formatAmount(data.reservationCount, lang) },
        { label: labels.locked, value: formatMoney(Math.round(wadToNumber(data.lockedValueUsd)), lang) },
      ]
    : null;

  return (
    <div className="mt-6 rounded-[var(--radius-sheet)] bg-[#15232b] p-4 text-[#f3f4ef] md:mt-8 md:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <p className="flex items-center gap-2 text-label font-semibold">
          <span aria-hidden className="size-2.5 rounded-full bg-[#f5b83d] motion-safe:animate-pulse" />
          {labels.title}
        </p>
        {explorer && (
          <a
            href={`${explorer}/address/${deployment.contracts.reservationEscrow}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-11 items-center text-label font-semibold text-[#f5b83d] underline underline-offset-4"
          >
            {labels.verify}
          </a>
        )}
      </div>
      {numbers ? (
        <dl className="mt-2 grid grid-cols-3 gap-4 md:mt-3">
          {numbers.map((item) => (
            <div key={item.label} className="flex flex-col-reverse">
              <dt className="mt-1 text-label text-[#b9c6ca]">{item.label}</dt>
              <dd className="type-display text-[clamp(1.5rem,4vw,3rem)] leading-none tabular">{item.value}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <div role="status" className="mt-3">
          {/* Every wait in Accasa shows a bar, what is happening and how long it usually takes. */}
          {!isError && (
            <div className="mb-2 h-2.5 w-full max-w-md overflow-hidden rounded-full bg-white/15" aria-hidden>
              <div className="h-full w-1/2 animate-pulse rounded-full bg-[#f5b83d]" />
            </div>
          )}
          <p className="text-label text-[#b9c6ca]">{isError ? labels.unavailable : labels.loading}</p>
        </div>
      )}
    </div>
  );
}
