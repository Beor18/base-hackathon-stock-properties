"use client";

import { useEffect, useState } from "react";

import { buttonClass } from "./button";

type CopyButtonProps = {
  value: string;
  label: string;
  copiedLabel: string;
  variant?: "primary" | "secondary";
  block?: boolean;
};

/** Copies `value` and confirms in place for two seconds. */
export function CopyButton({ value, label, copiedLabel, variant = "secondary", block = false }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(timer);
  }, [copied]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
    } catch {
      // Clipboard can be blocked (insecure context, permissions). The value stays visible to copy by hand.
    }
  }

  return (
    <button type="button" onClick={copy} className={buttonClass(variant, "lg", block)} aria-live="polite">
      {copied ? (
        <>
          <svg viewBox="0 0 20 20" className="size-5" aria-hidden fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4.5 10.5l3.5 3.5 7.5-8" />
          </svg>
          {copiedLabel}
        </>
      ) : (
        label
      )}
    </button>
  );
}
