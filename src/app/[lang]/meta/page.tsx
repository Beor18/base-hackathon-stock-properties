import type { Metadata } from "next";
import { Suspense } from "react";

import { ConnectedGoalScreen } from "@/components/account/connected/goal";
import { getDictionary, getLocale } from "@/i18n/get-dictionary";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getDictionary()).goal.title };
}

/**
 * `/meta`: progress toward the seña, or the goal setup when arriving from "Esta es mi meta"
 * (`?casa=&sena=[&precio=&url=]`). The container reads the session, `/api/account/<address>`, the
 * property and the stocks, and saves the goal through `/api/plan/goal`.
 */
export default async function MetaPage() {
  const lang = await getLocale();
  const dict = await getDictionary(lang);
  return (
    <Suspense>
      <ConnectedGoalScreen
        lang={lang}
        labels={{ goal: dict.goal, signIn: dict.signIn, common: dict.common, account: dict.account, txErrors: dict.txErrors }}
      />
    </Suspense>
  );
}
