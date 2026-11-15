import Link from "next/link";

import type { PropertySummary } from "@/domain/property";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/es";
import { fill, formatArea, formatMoney, plural } from "@/i18n/format";

import { propertyHref } from "./api";
import { ListingImage } from "./listing-image";
import { DEPOSIT_PCT_DEFAULT, depositUsd } from "./deposit";

type PropertyCardProps = {
  property: PropertySummary;
  lang: Locale;
  labels: Pick<Dictionary["common"], "bedrooms" | "bathrooms" | "forRent"> &
    Pick<Dictionary["search"], "cardSena" | "cardNoPrice">;
  priority?: boolean;
};

/** Photo-first listing card. The whole card is the link; the seña is shown up front. */
export function PropertyCard({ property, lang, labels, priority }: PropertyCardProps) {
  const facts = [
    property.bedrooms ? plural(labels.bedrooms, property.bedrooms) : null,
    property.bathrooms ? plural(labels.bathrooms, property.bathrooms) : null,
    property.areaM2 ? formatArea(property.areaM2, lang) : null,
  ].filter(Boolean);

  return (
    <Link
      href={propertyHref(lang, property.ref, property.sourceUrl)}
      className="group block rounded-[var(--radius-photo)] focus-visible:outline-offset-4"
    >
      <div className="relative aspect-[4/3] overflow-hidden rounded-[var(--radius-photo)] bg-surface-2">
        {property.imageUrl ? (
          <ListingImage
            src={property.imageUrl}
            alt=""
            fill
            sizes="(min-width: 1024px) 360px, (min-width: 640px) 45vw, 100vw"
            priority={priority}
            className="object-cover transition-transform duration-500 ease-[var(--ease-out)] group-hover:scale-[1.03]"
          />
        ) : (
          <div aria-hidden className="absolute inset-0 flex items-center justify-center text-line-strong">
            <svg viewBox="0 0 64 64" className="size-16" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 30L32 14l20 16M18 26v24h28V26" />
            </svg>
          </div>
        )}
        {property.priceUsd !== null && property.listingType === "sale" && (
          <span className="absolute bottom-3 left-3 inline-flex items-center rounded-full bg-mango px-3 py-1 text-label font-bold text-mango-ink tabular">
            {fill(labels.cardSena, { amount: formatMoney(depositUsd(property.priceUsd, DEPOSIT_PCT_DEFAULT), lang) })}
          </span>
        )}
      </div>
      <div className="px-1 pt-3">
        <p className="type-heading text-h3 text-ink tabular">
          {property.priceUsd !== null ? formatMoney(property.priceUsd, lang) : labels.cardNoPrice}
          {property.listingType === "rent" && (
            <span className="ml-2 align-middle text-label font-semibold text-ink-2">{labels.forRent}</span>
          )}
        </p>
        <h3 className="mt-1 line-clamp-1 font-semibold text-ink group-hover:underline group-hover:underline-offset-4">
          {property.title}
        </h3>
        {property.location && <p className="line-clamp-1 text-ink-2">{property.location}</p>}
        {facts.length > 0 && <p className="mt-1 text-label text-ink-3">{facts.join(", ")}</p>}
      </div>
    </Link>
  );
}

export function PropertyCardSkeleton() {
  return (
    <div aria-hidden>
      <div className="skeleton aspect-[4/3] rounded-[var(--radius-photo)]" />
      <div className="px-1 pt-3">
        <div className="skeleton h-6 w-1/2 rounded-md" />
        <div className="skeleton mt-2 h-4 w-3/4 rounded-md" />
        <div className="skeleton mt-2 h-4 w-1/3 rounded-md" />
      </div>
    </div>
  );
}
