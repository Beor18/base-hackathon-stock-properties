import type { Metadata } from "next";

import { UnwiredContributeScreen } from "@/components/account/unwired";
import { getDictionary, getLocale } from "@/i18n/get-dictionary";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getDictionary()).contribute.title };
}

/**
 * `/sumar`: add digital dollars or pesos to the goal.
 *
 * INTEGRATION: render `<ContributeScreen lang labels state />` (account/contribute-screen.tsx).
 * Data: session, `Goal`, `Balances` (USDC and wARS of the account), enabled `currencies`,
 * `minUsd` and `feeBps` from the product config, `arsPerUsd` from `GET /api/rates`.
 * Callbacks: `onDraftChange({ amount, currency } | null)` (already debounced) → fetch a quote and
 * pass it as `quote`; `onSubmit({ amount, currency })` → approve + buy in one batch, tracked with
 * `tx: { step }` (0 preparing, 1 buying, 2 confirming) and `txError`. On success switch to
 * `{ kind: "success", amount, currency, goal }` with the refreshed goal.
 */
export default async function SumarPage() {
  const lang = await getLocale();
  const dict = await getDictionary(lang);
  return (
    <UnwiredContributeScreen
      lang={lang}
      labels={{ contribute: dict.contribute, signIn: dict.signIn, common: dict.common, goal: dict.goal }}
    />
  );
}
