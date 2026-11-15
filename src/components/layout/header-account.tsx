"use client";

import Link from "next/link";

import { HouseAvatar } from "@/components/brand/house-avatar";
import type { Locale } from "@/i18n/config";
import { useAccount } from "@/lib/wallet/context";

/** The signed-in person's house in the header, leading to their account. Nothing when signed out. */
export function HeaderAccount({ lang, label }: { lang: Locale; label: string }) {
  const session = useAccount();
  if (session.status !== "ready") return null;
  return (
    <Link href={`/${lang}/cuenta`} aria-label={label} className="inline-flex size-11 items-center justify-center rounded-full">
      <HouseAvatar seed={session.address} label="" className="size-9 rounded-full ring-2 ring-surface shadow-[var(--shadow-raise)]" />
    </Link>
  );
}
