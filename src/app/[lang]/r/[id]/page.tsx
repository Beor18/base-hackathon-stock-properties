import type { Metadata } from "next";

import { UnwiredReservationScreen } from "@/components/account/unwired";
import { getDictionary, getLocale } from "@/i18n/get-dictionary";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getDictionary()).reservation.title };
}

/**
 * `/r/[id]`: public reservation page, shared on WhatsApp. Works without a session (viewer).
 *
 * INTEGRATION: render `<ReservationScreen lang labels state />` (account/reservation-screen.tsx)
 * inside a `<Suspense>` that reads `params.id`.
 * Data: the reservation from the escrow (`ReservationView`: status, property, seña, shares and
 * value, buyer/broker/arbiter, dates, fee, claim), the viewer's `role` from the session, and
 * `shareUrl` (this page's absolute URL).
 * Callbacks by role, all optional: `onRelease`, `onClaim(amountUsd, reason)`, `onAccept`,
 * `onDispute`, `onResolve("broker" | "buyer")`, `onSettle` (sells via the whitelisted router and
 * pays USDC). Track with `pending: { action, step }` and `actionError`.
 */
export default async function ReservationPage() {
  const lang = await getLocale();
  const dict = await getDictionary(lang);
  return (
    <UnwiredReservationScreen
      lang={lang}
      labels={{ reservation: dict.reservation, reserve: dict.reserve, common: dict.common }}
    />
  );
}
