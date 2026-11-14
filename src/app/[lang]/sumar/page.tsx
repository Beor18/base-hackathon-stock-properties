import type { Metadata } from "next";

import { ConnectedContributeScreen } from "@/components/account/connected/contribute";
import { getDictionary, getLocale } from "@/i18n/get-dictionary";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getDictionary()).contribute.title };
}

/**
 * `/sumar`: add digital dollars or pesos to the goal. Quotes and the batch (approve + buy) come
 * from `/api/plan/contribute`; the fee is always on screen.
 */
export default async function SumarPage() {
  const lang = await getLocale();
  const dict = await getDictionary(lang);
  return (
    <ConnectedContributeScreen
      lang={lang}
      labels={{
        contribute: dict.contribute,
        signIn: dict.signIn,
        common: dict.common,
        goal: dict.goal,
        account: dict.account,
        txErrors: dict.txErrors,
      }}
    />
  );
}
