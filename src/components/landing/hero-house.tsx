"use client";

import { useEffect, useState } from "react";

import type { PropertySummary } from "@/domain/property";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/es";
import { fill, formatMoney } from "@/i18n/format";
import { listProperties } from "@/components/property/api";
import { DEPOSIT_PCT_DEFAULT, depositUsd } from "@/components/property/deposit";
import { HouseFill } from "@/components/property/house-fill";

/** How far the hero photo paints itself. Illustrates the mechanic; it is not anyone's balance. */
const HERO_PAINT = 0.62;

type HeroHouseProps = {
  lang: Locale;
  labels: Dictionary["landing"];
  sena: string;
};

/** Pick a real home for sale with a photo and a price, preferring ones with bedrooms (not land). */
function pickHome(items: PropertySummary[]): PropertySummary | null {
  const usable = items.filter(
    (item) => item.imageUrl && item.priceUsd !== null && item.listingType === "sale" && item.location,
  );
  return usable.find((item) => (item.bedrooms ?? 0) > 0) ?? usable[0] ?? null;
}

/**
 * The landing's one orchestrated moment: a real Smarlin listing, grey, painting itself in color
 * from the ground up, with its real seña on the paint line.
 */
export function HeroHouse({ lang, labels, sena }: HeroHouseProps) {
  const [home, setHome] = useState<PropertySummary | null | undefined>(undefined);

  useEffect(() => {
    const controller = new AbortController();
    listProperties({ type: "sale", featured: true, limit: 12 }, controller.signal)
      .then((page) => setHome(pickHome(page.items)))
      .catch(() => {
        if (!controller.signal.aborted) setHome(null);
      });
    return () => controller.abort();
  }, []);

  if (home === undefined) {
    return <div className="skeleton aspect-[4/5] w-full rounded-[var(--radius-photo)] sm:aspect-[5/4] lg:aspect-[4/5]" aria-hidden />;
  }

  const place = home?.location?.split(",")[0] ?? "";
  const amount = home?.priceUsd ? formatMoney(depositUsd(home.priceUsd, DEPOSIT_PCT_DEFAULT), lang) : null;

  return (
    <div>
      <HouseFill
        src={home?.imageUrl ?? null}
        alt={home ? fill(labels.heroPhotoAlt, { title: home.title, place: home.location ?? "" }) : labels.heroCaptionFallback}
        progress={HERO_PAINT}
        animate
        priority
        sizes="(min-width: 1024px) 560px, 100vw"
        label={amount ? `${sena} ${amount}` : undefined}
        className="aspect-[4/5] w-full sm:aspect-[5/4] lg:aspect-[4/5]"
      />
      {home && amount && (
        <p className="mt-3 px-1 text-label text-ink-2">
          {fill(labels.heroCaption, { place })}: <span className="font-semibold text-ink tabular">{amount}</span>
        </p>
      )}
    </div>
  );
}
