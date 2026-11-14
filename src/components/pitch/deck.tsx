"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { Wordmark } from "@/components/brand/wordmark";
import type { Locale } from "@/i18n/config";
import { fill } from "@/i18n/format";
import type { PitchDeck, PitchSlide } from "@/i18n/pitch/es";

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

export function Deck({ deck, lang }: { deck: PitchDeck; lang: Locale }) {
  const scroller = useRef<HTMLDivElement>(null);
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
          <Slide key={slide.id} slide={slide} index={slideIndex} total={total} deck={deck} lang={lang} />
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
}: {
  slide: PitchSlide;
  index: number;
  total: number;
  deck: PitchDeck;
  lang: Locale;
}) {
  const tone = tones[slide.tone];
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

        <h2 className={`type-wide max-w-5xl text-balance ${titleSize}`}>{slide.title}</h2>
        {slide.body && <p className={`mt-6 max-w-2xl text-lead md:text-h3 md:leading-snug text-pretty ${tone.muted}`}>{slide.body}</p>}

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
                <p className={`type-semiwide ${slide.layout === "points" && slide.id === "problem" ? "text-h1" : "text-h3"}`}>
                  {point.title}
                </p>
                {point.body && <p className={`mt-2 text-pretty ${tone.muted}`}>{point.body}</p>}
              </li>
            ))}
          </ol>
        )}

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
