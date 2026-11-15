"use client";

import { useEffect, useState } from "react";

import { fill } from "@/i18n/format";

export type WaitLabels = { typicalWait: string; stepOf: string };

type WaitBarProps = {
  /** Localized step names, in order. A single step is fine for short waits. */
  steps: string[];
  /** Index of the running step (0-based). */
  current?: number;
  /** How long the whole wait usually takes, shown to the person. */
  typicalSeconds: number;
  labels: WaitLabels;
  className?: string;
};

/**
 * Every wait in Accasa shows this: a bar, the current step and how long it usually takes.
 * The bar advances on its own within the running step (easing toward, never reaching, its end)
 * so a slow network still reads as progress, and jumps when the caller moves to the next step.
 */
export function WaitBar({ steps, current = 0, typicalSeconds, labels, className = "" }: WaitBarProps) {
  const step = Math.min(Math.max(current, 0), steps.length - 1);
  const [clock, setClock] = useState({ step, elapsed: 0 });
  const elapsed = clock.step === step ? clock.elapsed : 0;

  useEffect(() => {
    const startedAt = performance.now();
    const timer = window.setInterval(
      () => setClock({ step, elapsed: (performance.now() - startedAt) / 1000 }),
      150,
    );
    return () => window.clearInterval(timer);
  }, [step]);

  const perStep = Math.max(typicalSeconds / steps.length, 0.5);
  const withinStep = Math.min(1 - Math.exp(-elapsed / perStep), 0.92);
  const progress = Math.round(((step + withinStep) / steps.length) * 100);

  return (
    <div className={`w-full ${className}`}>
      <div className="flex items-baseline justify-between gap-4">
        <p className="font-semibold text-ink" aria-live="polite">
          {steps[step]}
        </p>
        {steps.length > 1 && (
          <p className="shrink-0 text-label text-ink-2 tabular">
            {fill(labels.stepOf, { n: step + 1, total: steps.length })}
          </p>
        )}
      </div>
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progress}
        aria-valuetext={steps[step]}
        className="mt-3 h-2.5 overflow-hidden rounded-full bg-surface-2"
      >
        <div
          className="h-full rounded-full bg-mango transition-[width] duration-300 ease-[var(--ease-out)]"
          style={{ width: `${Math.max(progress, 4)}%` }}
        />
      </div>
      <p className="mt-2 text-label text-ink-2">{fill(labels.typicalWait, { s: typicalSeconds })}</p>
    </div>
  );
}
