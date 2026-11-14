"use client";

import { useCallback, useState } from "react";

import type { Plan } from "@/domain/types";
import type { TxProgress } from "@/components/account/types";
import type { Dictionary } from "@/i18n/dictionaries/es";
import { ApiClientError } from "@/lib/api";
import { decodeContractError, isUserRejection } from "@/lib/contract-errors";
import { waitForSuccess } from "@/lib/wallet/chain-client";
import type { AccountWallet } from "@/lib/wallet/types";

export type TxErrorLabels = Dictionary["txErrors"];

/** Plain-words reason for a failed plan or transaction, or null when only the generic message fits. */
export function explainTxError(error: unknown, labels: TxErrorLabels): string | null {
  const reasons = labels.reasons as Record<string, string>;
  const codes = labels.codes as Record<string, string>;

  if (error instanceof ApiClientError) {
    if (error.contractError && reasons[error.contractError]) return reasons[error.contractError];
    return codes[error.code] ?? null;
  }
  if (isUserRejection(error)) return labels.rejected;
  const decoded = decodeContractError(error);
  return decoded ? (reasons[decoded.name] ?? null) : null;
}

type RunOptions<Quote> = {
  wallet: AccountWallet;
  /** Asks the server for the calls. Runs right before sending so prices are fresh. */
  plan: () => Promise<Plan<Quote>>;
  /**
   * Whether the screen shows planning as its own first step ("Preparando…" then "Comprando…").
   * Otherwise planning and sending share step 0, and confirming is step 1.
   */
  planStep: boolean;
  /** Refreshes what the transaction changed, while the bar still shows the last step. */
  onSuccess?: (quote: Quote) => Promise<unknown> | void;
};

/**
 * Runs plan → send → confirm and exposes the step for the screen's progress bar, plus a readable
 * failure. Resolves with the plan's quote on success, or null on failure.
 */
export function useTransaction(labels: TxErrorLabels) {
  const [progress, setProgress] = useState<TxProgress | null>(null);
  const [failure, setFailure] = useState<{ detail: string | null } | null>(null);

  const run = useCallback(
    async <Quote,>({ wallet, plan, planStep, onSuccess }: RunOptions<Quote>): Promise<Quote | null> => {
      const sendStep = planStep ? 1 : 0;
      setFailure(null);
      setProgress({ step: 0 });
      try {
        const { calls, quote } = await plan();
        setProgress({ step: sendStep });
        if (calls.length > 0) {
          const hash = await wallet.sendCalls(calls);
          setProgress({ step: sendStep + 1 });
          await waitForSuccess(hash);
        }
        // The transaction already landed: a failed refresh must not report it as failed.
        await Promise.resolve(onSuccess?.(quote)).catch((error: unknown) => console.warn("[transaction] refresh failed", error));
        return quote;
      } catch (error) {
        console.error("[transaction] failed", error);
        setFailure({ detail: explainTxError(error, labels) });
        return null;
      } finally {
        setProgress(null);
      }
    },
    [labels],
  );

  const reset = useCallback(() => setFailure(null), []);

  return { progress, failure, run, reset };
}
