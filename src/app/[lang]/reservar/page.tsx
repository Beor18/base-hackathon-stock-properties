import type { Metadata } from "next";

import { UnwiredReserveScreen } from "@/components/account/unwired";
import { getDictionary, getLocale } from "@/i18n/get-dictionary";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getDictionary()).reserve.title };
}

/**
 * `/reservar`: lock the goal's stocks as the seña, from the broker's link.
 *
 * INTEGRATION: render `<ReserveScreen lang labels state />` (account/reserve-screen.tsx).
 * Data: session, `Goal`, the broker offer from the query string (`parseReservationOffer` in
 * account/routes.ts: ref, pct, broker address and name), `senaUsd`, `lock` (shares needed at the
 * oracle price and their value), `feeBps`/`feeUsd` and `endsAt` from the escrow config.
 * Without an offer use `no-link` (agent name and phone from the listing, `listingUrl`), and
 * `not-reached` while the goal value is under the seña.
 * Callback: `onReserve()` → approve + createReservation in one batch, tracked with
 * `tx: { step }` (0 preparing, 1 locking, 2 confirming) and `txError`; then `success` with the
 * reservation id and its public URL (`/[lang]/r/[id]`).
 */
export default async function ReservarPage() {
  const lang = await getLocale();
  const dict = await getDictionary(lang);
  return (
    <UnwiredReserveScreen
      lang={lang}
      labels={{
        reserve: dict.reserve,
        signIn: dict.signIn,
        common: dict.common,
        goal: dict.goal,
        contribute: dict.contribute,
      }}
    />
  );
}
