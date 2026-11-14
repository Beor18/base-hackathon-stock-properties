import Image from "next/image";
import type { ReactNode } from "react";

import type { Locale } from "@/i18n/config";
import { formatAmount, formatMoney, formatPercent } from "@/i18n/format";
import { ListingImage } from "@/components/property/listing-image";

import type { GoalProperty, StockOption } from "./types";

export function formatDepositPct(pct: number, lang: Locale): string {
  const digits = Number.isInteger(pct) ? 0 : 1;
  return lang === "es" ? `${formatAmount(pct, lang, digits)} %` : `${formatAmount(pct, lang, digits)}%`;
}

/** Compact row that keeps the home in view on every account screen. */
export function GoalPropertyRow({
  property,
  lang,
  detail,
}: {
  property: GoalProperty;
  lang: Locale;
  /** Right-hand line, e.g. "Seña USD 19.700 (5 %)". */
  detail?: ReactNode;
}) {
  return (
    <div className="flex items-center gap-4 rounded-[var(--radius-sheet)] border border-line bg-surface p-3 pr-4">
      <div className="relative size-16 shrink-0 overflow-hidden rounded-[0.875rem] bg-surface-2">
        {property.imageUrl && (
          <ListingImage
            src={property.imageUrl}
            alt=""
            fill
            sizes="64px"
            className="object-cover"
          />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="line-clamp-1 font-semibold text-ink">{property.title}</p>
        <p className="line-clamp-1 text-label text-ink-2">
          {property.location ? `${property.location}, ` : ""}
          <span className="tabular">{formatMoney(property.priceUsd, lang)}</span>
        </p>
        {detail && <p className="mt-0.5 text-label font-semibold text-ink tabular">{detail}</p>}
      </div>
    </div>
  );
}

/** Company logo with a lettered fallback. */
export function StockIcon({ stock, size = 40 }: { stock: Pick<StockOption, "name" | "iconUrl">; size?: number }) {
  return (
    <span
      className="relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-2 font-bold text-ink"
      style={{ width: size, height: size }}
      aria-hidden
    >
      {stock.iconUrl ? (
        <Image src={stock.iconUrl} alt="" fill sizes={`${size}px`} unoptimized className="object-cover" />
      ) : (
        stock.name.slice(0, 1)
      )}
    </span>
  );
}

/** Signed percent change, colored only when it moved. */
export function Change({ pct, lang, flat }: { pct: number | null; lang: Locale; flat: string }) {
  if (pct === null) return null;
  if (Math.abs(pct) < 0.05) return <span className="font-semibold text-ink-2">{flat}</span>;
  const tone = pct > 0 ? "text-palm" : "text-danger";
  return (
    <span className={`font-semibold tabular ${tone}`}>
      {formatPercent(pct / 100, lang, { signed: true, digits: 1 })}
    </span>
  );
}
