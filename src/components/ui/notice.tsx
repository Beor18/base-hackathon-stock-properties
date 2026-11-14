import type { ReactNode } from "react";

type Tone = "error" | "info" | "success";

const tones: Record<Tone, string> = {
  error: "bg-danger-soft text-ink border-danger/30",
  info: "bg-surface text-ink border-line",
  success: "bg-palm-soft text-ink border-palm/30",
};

const iconColor: Record<Tone, string> = {
  error: "text-danger",
  info: "text-ink-2",
  success: "text-palm",
};

function ToneIcon({ tone }: { tone: Tone }) {
  if (tone === "success") {
    return (
      <svg viewBox="0 0 20 20" className="size-5" aria-hidden fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4.5 10.5l3.5 3.5 7.5-8" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 20 20" className="size-5" aria-hidden fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="10" cy="10" r="7.5" />
      {tone === "error" ? <path d="M10 6v4.5M10 13.6v.1" /> : <path d="M10 9v4.5M10 6.4v.1" />}
    </svg>
  );
}

type NoticeProps = {
  tone?: Tone;
  children: ReactNode;
  /** Optional inline action, e.g. a retry button. */
  action?: ReactNode;
  className?: string;
};

/** Inline message. Errors say what happened and what to do next; they are announced to screen readers. */
export function Notice({ tone = "info", children, action, className = "" }: NoticeProps) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={`flex gap-3 rounded-[var(--radius-control)] border px-4 py-3 ${tones[tone]} ${className}`}
    >
      <span className={`mt-0.5 shrink-0 ${iconColor[tone]}`}>
        <ToneIcon tone={tone} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-pretty">{children}</div>
        {action && <div className="mt-2">{action}</div>}
      </div>
    </div>
  );
}
