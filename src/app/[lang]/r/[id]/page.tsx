import type { Metadata } from "next";
import { Suspense } from "react";

import { ConnectedReservationScreen } from "@/components/account/connected/reservation";
import { getDictionary, getLocale } from "@/i18n/get-dictionary";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getDictionary()).reservation.title };
}

/**
 * `/r/[id]`: public reservation page, shared on WhatsApp. Works without a session (viewer); with
 * one, the role (buyer, broker, arbiter) decides the action, planned by `/api/plan/reservation`.
 */
export default async function ReservationPage() {
  const lang = await getLocale();
  const dict = await getDictionary(lang);
  return (
    <Suspense>
      <ConnectedReservationScreen
        lang={lang}
        labels={{
          reservation: dict.reservation,
          reserve: dict.reserve,
          common: dict.common,
          account: dict.account,
          txErrors: dict.txErrors,
        }}
      />
    </Suspense>
  );
}
