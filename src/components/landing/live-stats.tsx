import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/es";
import { formatAmount, formatMoney, plural } from "@/i18n/format";

/**
 * Live usage counters on the landing.
 *
 * INTEGRATION: feed it from the on-chain counters (`/api/stats`: GoalRegistry.activeGoals, USD in
 * stocks, ReservationEscrow reservations). With `stats={null}` it renders nothing, so the
 * landing never shows made-up numbers.
 */
export type LiveStatsData = {
  activeGoals: number;
  savedUsd: number;
  reservations: number;
};

type LiveStatsProps = {
  stats: LiveStatsData | null;
  lang: Locale;
  labels: Pick<Dictionary["landing"], "statsTitle" | "stats">;
};

export function LiveStats({ stats, lang, labels }: LiveStatsProps) {
  if (!stats) return null;

  const items = [
    { value: formatAmount(stats.activeGoals, lang), label: plural(labels.stats.goals, stats.activeGoals) },
    { value: formatMoney(stats.savedUsd, lang), label: labels.stats.saved },
    { value: formatAmount(stats.reservations, lang), label: plural(labels.stats.reservations, stats.reservations) },
  ];

  return (
    <section aria-labelledby="stats-heading" className="mx-auto w-full max-w-6xl px-5 md:px-8">
      <h2 id="stats-heading" className="sr-only">
        {labels.statsTitle}
      </h2>
      <dl className="grid gap-6 border-y border-line py-8 sm:grid-cols-3">
        {items.map((item) => (
          <div key={item.label} className="flex flex-col-reverse gap-1">
            <dt className="text-ink-2">{item.label}</dt>
            <dd className="type-display text-h1 text-ink tabular">{item.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
