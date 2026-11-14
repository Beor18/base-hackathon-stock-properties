"use client";

import { useEffect, useState } from "react";

import { buttonClass } from "./button";

type ShareButtonProps = {
  /** Absolute URL to share. */
  url: string;
  /** Message sent along with the link. */
  text: string;
  label: string;
  copiedLabel: string;
  variant?: "primary" | "secondary";
  size?: "lg" | "md";
  block?: boolean;
};

/**
 * Shares a link through the device's share sheet (where the chat apps are). Browsers without one,
 * mostly desktop, copy the link instead and confirm in place for two seconds.
 */
export function ShareButton({ url, text, label, copiedLabel, variant = "secondary", size = "lg", block = false }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const [showLink, setShowLink] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(timer);
  }, [copied]);

  async function share() {
    if (typeof navigator.share === "function") {
      try {
        // The link travels inside the text: some chat apps drop `url` when both fields are set.
        await navigator.share({ text: `${text}\n${url}` });
        return;
      } catch (error) {
        // Closing the sheet is a choice, not a failure.
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      // Clipboard blocked (insecure context, permissions): show the link to copy by hand.
      setShowLink(true);
    }
  }

  return (
    <>
      <button type="button" onClick={share} className={buttonClass(variant, size, block)} aria-live="polite">
        {copied ? (
          <>
            <svg viewBox="0 0 20 20" className="size-5" aria-hidden fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4.5 10.5l3.5 3.5 7.5-8" />
            </svg>
            {copiedLabel}
          </>
        ) : (
          <>
            <svg viewBox="0 0 20 20" className="size-5" aria-hidden fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 12.5V3.5M6.5 6.5L10 3l3.5 3.5M4.5 10.5v5a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1v-5" />
            </svg>
            {label}
          </>
        )}
      </button>
      {showLink && (
        <input
          readOnly
          value={url}
          aria-label={label}
          onFocus={(event) => event.target.select()}
          className="mt-2 h-11 w-full rounded-[var(--radius-control)] border border-line-strong bg-surface px-3 text-label text-ink"
        />
      )}
    </>
  );
}
