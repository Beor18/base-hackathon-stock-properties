import type { ReactNode } from "react";

/**
 * Label/value rows for receipts (contribution, reservation). The fee row is a regular row on
 * purpose: it is always shown, never hidden behind a tooltip, and never says "free".
 */
export function Rows({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <dl className={`divide-y divide-line ${className}`}>{children}</dl>;
}

type RowProps = {
  label: ReactNode;
  value: ReactNode;
  /** Small text under the value, e.g. "Hoy valen USD 19.900". */
  hint?: ReactNode;
  emphasis?: boolean;
};

export function Row({ label, value, hint, emphasis = false }: RowProps) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <dt className={emphasis ? "font-semibold text-ink" : "text-ink-2"}>{label}</dt>
      <dd className="text-right">
        <span className={`tabular ${emphasis ? "type-semiwide text-lead text-ink" : "font-semibold text-ink"}`}>
          {value}
        </span>
        {hint && <span className="block text-label text-ink-2">{hint}</span>}
      </dd>
    </div>
  );
}
