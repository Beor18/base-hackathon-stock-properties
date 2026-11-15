"use client";

import { useState, type CSSProperties, type ReactNode } from "react";

import { ListingImage } from "./listing-image";

type HouseFillProps = {
  src: string | null;
  alt: string;
  /** Share of the goal already saved, 0 to 1. The photo is in color up to this height. */
  progress: number;
  /** Paint from the ground up when it first appears (respects reduced motion). */
  animate?: boolean;
  /** Text pinned to the paint line, e.g. the amount saved. */
  label?: ReactNode;
  sizes: string;
  priority?: boolean;
  className?: string;
};

/**
 * Accasa's signature visual: the home you're saving for, in grey, filling with color from the
 * ground up as the savings grow. A mango line marks how far you've got.
 */
export function HouseFill({ src, alt, progress, animate = false, label, sizes, priority, className = "" }: HouseFillProps) {
  // Paint only once the photo is in, so the reveal is never spent on an empty frame.
  const [loaded, setLoaded] = useState(false);
  const target = `${Math.round(Math.min(Math.max(progress, 0), 1) * 1000) / 10}%`;
  const paint = animate && !loaded ? "0%" : target;
  const style = { "--paint": paint } as CSSProperties;
  const animation = animate && loaded ? "animate-paint" : "";
  const complete = progress >= 1;

  return (
    <figure
      className={`relative isolate overflow-hidden rounded-[var(--radius-photo)] bg-surface-2 ${className}`}
      style={style}
    >
      {src ? (
        <>
          <ListingImage
            src={src}
            alt={alt}
            fill
            sizes={sizes}
            priority={priority}
            className="object-cover grayscale contrast-[0.92] brightness-[1.04]"
          />
          <div
            aria-hidden
            className={`absolute inset-0 ${animation}`}
            style={{ clipPath: "inset(calc(100% - var(--paint)) 0 0 0)" }}
          >
            <ListingImage
              src={src}
              alt=""
              fill
              sizes={sizes}
              priority={priority}
              onLoad={() => setLoaded(true)}
              className="object-cover saturate-[1.08]"
            />
          </div>
        </>
      ) : (
        <div aria-hidden className="absolute inset-0 flex items-center justify-center text-line-strong">
          <svg viewBox="0 0 64 64" className="size-24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 30L32 14l20 16M18 26v24h28V26" />
            <path d="M27 50V39a5 5 0 0 1 10 0v11" />
          </svg>
          <span className="sr-only">{alt}</span>
        </div>
      )}

      {!complete && (
        <div
          aria-hidden={label ? undefined : true}
          className={`pointer-events-none absolute inset-x-0 z-10 ${animation}`}
          style={{ bottom: "var(--paint)" }}
        >
          <div className="h-[3px] w-full translate-y-1/2 bg-mango shadow-[0_0_0_1px_rgb(21_35_43/0.15)]" />
          {label && (
            <div className="absolute bottom-2 left-3 sm:left-4">
              <span className="inline-flex items-center rounded-full bg-mango px-3 py-1.5 text-label font-bold text-mango-ink shadow-raise tabular">
                {label}
              </span>
            </div>
          )}
        </div>
      )}
      {complete && label && (
        <div className="absolute bottom-3 left-3 z-10 sm:left-4">
          <span className="inline-flex items-center rounded-full bg-mango px-3 py-1.5 text-label font-bold text-mango-ink shadow-raise tabular">
            {label}
          </span>
        </div>
      )}
    </figure>
  );
}
