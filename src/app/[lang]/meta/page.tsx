import type { Metadata } from "next";

import { UnwiredGoalScreen } from "@/components/account/unwired";
import { getDictionary, getLocale } from "@/i18n/get-dictionary";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getDictionary()).goal.title };
}

/**
 * `/meta`: progress toward the seña, or the goal setup when arriving from "Esta es mi meta".
 *
 * INTEGRATION: render `<GoalScreen lang labels state />` (src/components/account/goal-screen.tsx)
 * from a client container. Data it needs:
 * - Session and email sign-in callbacks (`SignInProps`).
 * - Draft from the query string: `parseGoalDraft(searchParams)` (account/routes.ts) gives
 *   `{ ref, pct, manualPriceUsd, sourceUrl }`; resolve the property with
 *   `GET /api/properties/<ref>?url=<sourceUrl>` into `GoalDraft` (target = price × pct).
 * - Stocks to pick from (`StockOption[]`, live prices) and `GoalRegistry.goalOf(account)` mapped to `Goal`
 *   (shares, current value, house and stock change since the goal started).
 * Callbacks: `onSelectStock(id)`, `onSave()` → planner `setGoal` calls sent in one batch; report
 * progress with `saving: { step }` (0 preparing, 1 confirming) and `saveError`.
 */
export default async function MetaPage() {
  const lang = await getLocale();
  const dict = await getDictionary(lang);
  return <UnwiredGoalScreen lang={lang} labels={{ goal: dict.goal, signIn: dict.signIn, common: dict.common }} />;
}
