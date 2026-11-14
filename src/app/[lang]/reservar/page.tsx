import type { Metadata } from "next";
import { Suspense } from "react";

import { ConnectedReserveScreen } from "@/components/account/connected/reserve";
import { getDictionary, getLocale } from "@/i18n/get-dictionary";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getDictionary()).reserve.title };
}

/**
 * `/reservar`: lock the goal's stocks as the seña, from the broker's link
 * (`?casa=&sena=&corredor=&nombre=[&inmobiliaria=]`). The batch (approve + createReservation)
 * comes from `/api/plan/reserve`. Without a link, the screen drafts the WhatsApp message to ask for it.
 */
export default async function ReservarPage() {
  const lang = await getLocale();
  const dict = await getDictionary(lang);
  return (
    <Suspense>
      <ConnectedReserveScreen
        lang={lang}
        labels={{
          reserve: dict.reserve,
          signIn: dict.signIn,
          common: dict.common,
          goal: dict.goal,
          contribute: dict.contribute,
          account: dict.account,
          txErrors: dict.txErrors,
        }}
      />
    </Suspense>
  );
}
