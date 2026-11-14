"use client";

import { useEffect, useRef, useState } from "react";

import { fill } from "@/i18n/format";

import { ListingImage } from "./listing-image";

type GalleryProps = {
  images: string[];
  title: string;
  labels: { photo: string; photoAlt: string; noPhoto: string; prevPhoto: string; nextPhoto: string };
};

/** Swipeable photo strip. Photos snap one at a time; arrows appear on larger screens. */
export function Gallery({ images, title, labels }: GalleryProps) {
  const stripRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const strip = stripRef.current;
    if (!strip) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setIndex(Number((entry.target as HTMLElement).dataset.index));
        }
      },
      { root: strip, threshold: 0.6 },
    );
    strip.querySelectorAll("[data-index]").forEach((slide) => observer.observe(slide));
    return () => observer.disconnect();
  }, [images.length]);

  function go(delta: number) {
    const strip = stripRef.current;
    if (!strip) return;
    const target = Math.min(Math.max(index + delta, 0), images.length - 1);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    strip.scrollTo({ left: target * strip.clientWidth, behavior: reduce ? "auto" : "smooth" });
  }

  if (images.length === 0) {
    return (
      <div className="flex aspect-[16/9] flex-col items-center justify-center gap-3 rounded-[var(--radius-photo)] bg-surface-2 text-ink-2 lg:aspect-[16/9]">
        <svg viewBox="0 0 96 80" className="h-16 w-20" fill="none" aria-hidden>
          <path d="M14 38L48 12l34 26" stroke="var(--accent)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M24 72V44c0-9 7-16 16-16s16 7 16 16v28" stroke="var(--line-strong)" strokeWidth="5" strokeLinecap="round" />
          <path d="M8 72h80" stroke="var(--mango)" strokeWidth="5" strokeLinecap="round" />
        </svg>
        <p className="text-label">{labels.noPhoto}</p>
      </div>
    );
  }

  return (
    <div className="relative">
      <div
        ref={stripRef}
        className="snap-strip flex aspect-[4/3] overflow-x-auto rounded-[var(--radius-photo)] bg-surface-2 lg:aspect-[16/11]"
        tabIndex={0}
        aria-label={title}
        role="region"
        aria-roledescription="carousel"
      >
        {images.map((src, slide) => (
          <div
            key={src}
            data-index={slide}
            className="relative h-full w-full shrink-0"
            role="group"
            aria-roledescription="slide"
            aria-label={fill(labels.photo, { n: slide + 1, total: images.length })}
          >
            <ListingImage
              src={src}
              alt={fill(labels.photoAlt, { title, n: slide + 1 })}
              fill
              sizes="(min-width: 1024px) 640px, 100vw"
              priority={slide === 0}
              className="object-cover"
            />
          </div>
        ))}
      </div>

      <span className="pointer-events-none absolute bottom-3 right-3 rounded-full bg-ink/75 px-3 py-1 text-label font-semibold text-paper tabular" aria-hidden>
        {index + 1} / {images.length}
      </span>

      {images.length > 1 && (
        <div className="absolute inset-y-0 left-0 right-0 hidden items-center justify-between px-3 md:flex pointer-events-none">
          <button
            type="button"
            onClick={() => go(-1)}
            disabled={index === 0}
            aria-label={labels.prevPhoto}
            className="pointer-events-auto flex size-11 items-center justify-center rounded-full bg-surface/90 text-ink shadow-raise transition-opacity disabled:opacity-0"
          >
            <svg viewBox="0 0 20 20" className="size-5" aria-hidden fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12.5 4.5L7 10l5.5 5.5" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            disabled={index === images.length - 1}
            aria-label={labels.nextPhoto}
            className="pointer-events-auto flex size-11 items-center justify-center rounded-full bg-surface/90 text-ink shadow-raise transition-opacity disabled:opacity-0"
          >
            <svg viewBox="0 0 20 20" className="size-5" aria-hidden fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7.5 4.5L13 10l-5.5 5.5" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
