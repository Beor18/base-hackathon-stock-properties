"use client";

import { useStats } from "@/hooks/queries";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/es";
import { wadToNumber } from "@/lib/view-models";

import { LiveStats } from "./live-stats";

/**
 * Landing counters read from the contracts through `/api/stats`. Renders nothing until there is
 * real usage to show (or if the network cannot be read), never placeholder numbers.
 */
export function LiveStatsLive({ lang, labels }: { lang: Locale; labels: Pick<Dictionary["landing"], "statsTitle" | "stats"> }) {
  const { data } = useStats();
  const stats =
    data && (data.goalCount > 0 || data.reservationCount > 0)
      ? {
          activeGoals: data.activeGoals,
          savedUsd: Math.round(wadToNumber(data.activeCoverageUsd)),
          reservations: data.reservationCount,
        }
      : null;
  return <LiveStats stats={stats} lang={lang} labels={labels} />;
}
