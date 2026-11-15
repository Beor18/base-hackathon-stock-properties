"use client";

import Link from "next/link";

import { HouseAvatar } from "@/components/brand/house-avatar";
import { useInboxSeen, useReservationsOf } from "@/hooks/queries";
import type { Locale } from "@/i18n/config";
import { inboxHasNews, toInbox } from "@/lib/view-models";
import { useAccount } from "@/lib/wallet/context";

/**
 * The signed-in person's house in the header, leading to their account. A dot on it tells a broker
 * that a reservation in their favor is new or ready to collect. Nothing when signed out.
 */
export function HeaderAccount({ lang, label, newsLabel }: { lang: Locale; label: string; newsLabel: string }) {
  const session = useAccount();
  const address = session.status === "ready" ? session.address : undefined;
  const reservations = useReservationsOf(address);
  const seen = useInboxSeen(address);
  if (session.status !== "ready") return null;

  const news =
    reservations.data !== undefined && seen.isFetched && inboxHasNews(toInbox(reservations.data, session.address, seen.data?.seenAt ?? null));
  return (
    <Link href={`/${lang}/cuenta`} aria-label={news ? newsLabel : label} className="relative inline-flex size-11 items-center justify-center rounded-full">
      <HouseAvatar seed={session.address} label="" className="size-9 rounded-full ring-2 ring-surface shadow-[var(--shadow-raise)]" />
      {news && <span aria-hidden className="absolute right-1 top-1 size-3 rounded-full bg-accent ring-2 ring-paper" />}
    </Link>
  );
}
