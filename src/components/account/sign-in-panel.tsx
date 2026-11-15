"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";

import type { Dictionary } from "@/i18n/dictionaries/es";
import { fill } from "@/i18n/format";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import { WaitBar } from "@/components/ui/wait-bar";

import type { SignInProps } from "./types";

type SignInPanelProps = SignInProps & {
  /** Why we ask: "Para ver tu meta, entrá con tu email." */
  context: string;
  labels: Dictionary["signIn"];
  common: Dictionary["common"];
};

const inputClass =
  "h-14 w-full rounded-[var(--radius-control)] border border-line-strong bg-surface px-4 text-lead text-ink placeholder:text-ink-3 focus:border-ink focus:outline-none focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus)] aria-[invalid=true]:border-danger";

/** Email + one-time code, inside Seña's own UI. No passwords and no account words. */
export function SignInPanel({
  step,
  email,
  status,
  error,
  onSubmitEmail,
  onSubmitCode,
  onResend,
  onChangeEmail,
  context,
  labels,
  common,
}: SignInPanelProps) {
  const [emailValue, setEmailValue] = useState(email);
  const [code, setCode] = useState("");
  const codeRef = useRef<HTMLInputElement>(null);
  const busy = status !== "idle";

  useEffect(() => {
    if (step === "code") codeRef.current?.focus();
  }, [step]);

  function submitEmail(event: FormEvent) {
    event.preventDefault();
    onSubmitEmail(emailValue.trim());
  }

  function submitCode(event: FormEvent) {
    event.preventDefault();
    onSubmitCode(code.trim());
  }

  if (step === "code") {
    return (
      <form onSubmit={submitCode} noValidate className="rounded-[var(--radius-sheet)] border border-line bg-surface p-5 sm:p-6">
        <h2 className="type-heading text-h2 text-ink">{labels.codeTitle}</h2>
        <p className="mt-2 text-ink-2 text-pretty">{fill(labels.codeBody, { email })}</p>
        <label htmlFor="sign-in-code" className="mt-5 block text-label font-semibold text-ink">
          {labels.codeLabel}
        </label>
        <input
          ref={codeRef}
          id="sign-in-code"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          value={code}
          onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
          aria-invalid={error === "invalid-code"}
          aria-describedby={error ? "sign-in-code-error" : undefined}
          disabled={busy}
          className={`${inputClass} mt-1.5 text-center text-h2 tracking-[0.4em] tabular`}
        />
        {error && (
          <p id="sign-in-code-error" className="mt-2 text-label font-semibold text-danger">
            {error === "invalid-code" ? labels.invalidCode : labels.error}
          </p>
        )}
        <div className="mt-5">
          {status === "verifying" ? (
            <WaitBar steps={[labels.verifying]} typicalSeconds={labels.verifyingSeconds} labels={common} />
          ) : (
            <Button type="submit" block disabled={code.length < 6}>
              {labels.verify}
            </Button>
          )}
        </div>
        <div className="mt-3 flex flex-wrap justify-between gap-2">
          <Button variant="quiet" size="md" onClick={onResend} disabled={busy}>
            {labels.resend}
          </Button>
          <Button variant="quiet" size="md" onClick={onChangeEmail} disabled={busy}>
            {labels.changeEmail}
          </Button>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={submitEmail} noValidate className="rounded-[var(--radius-sheet)] border border-line bg-surface p-5 sm:p-6">
      <p className="text-ink-2">{context}</p>
      <h2 className="type-heading mt-2 text-h2 text-ink">{labels.title}</h2>
      <p className="mt-1 text-ink-2">{labels.body}</p>
      <label htmlFor="sign-in-email" className="mt-5 block text-label font-semibold text-ink">
        {labels.emailLabel}
      </label>
      <input
        id="sign-in-email"
        type="email"
        inputMode="email"
        autoComplete="email"
        enterKeyHint="send"
        value={emailValue}
        onChange={(event) => setEmailValue(event.target.value)}
        placeholder={labels.emailPlaceholder}
        aria-invalid={error === "invalid-email"}
        aria-describedby={error ? "sign-in-email-error" : undefined}
        disabled={busy}
        className={`${inputClass} mt-1.5`}
      />
      {error && (
        <p id="sign-in-email-error" className="mt-2 text-label font-semibold text-danger">
          {error === "invalid-email" ? labels.invalidEmail : labels.error}
        </p>
      )}
      <div className="mt-5">
        {status === "sending" ? (
          <WaitBar steps={[labels.sending]} typicalSeconds={labels.sendingSeconds} labels={common} />
        ) : (
          <Button type="submit" block disabled={!emailValue.includes("@")}>
            {labels.sendCode}
          </Button>
        )}
      </div>
    </form>
  );
}

/** Generic "something failed while loading" block with a retry. */
export function LoadError({ message, retry, onRetry }: { message: string; retry: string; onRetry: () => void }) {
  return (
    <Notice
      tone="error"
      action={
        <Button variant="secondary" size="md" onClick={onRetry}>
          {retry}
        </Button>
      }
    >
      {message}
    </Notice>
  );
}
