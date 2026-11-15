import { HeroHouse } from "@/components/landing/hero-house";
import { LiveStatsLive } from "@/components/landing/live-stats-live";
import { SiteFooter } from "@/components/layout/site-footer";
import { ButtonLink } from "@/components/ui/button";
import { deployment } from "@/config/deployment";
import { fill, formatBps, formatMoney } from "@/i18n/format";
import { getDictionary, getLocale } from "@/i18n/get-dictionary";
import { MIN_CONTRIBUTION_USD } from "@/lib/product";

/**
 * Landing, "sell me this pen": the need first (years of saving, idle dollars), then the product
 * in three steps, the doubts it raises, then the same single action again.
 */
export default async function LandingPage() {
  const lang = await getLocale();
  const dict = await getDictionary(lang);
  const t = dict.landing;
  const casa = `/${lang}/casa`;
  // FAQ figures come from the deployment, so the answers never disagree with the contracts.
  const ratios = deployment.stocks.map((stock) => stock.collateralRatioBps);
  const faqValues = {
    minMargin: formatBps(Math.min(...ratios) - 10_000, lang),
    maxMargin: formatBps(Math.max(...ratios) - 10_000, lang),
    contributionFee: formatBps(deployment.params.contributionFeeBps, lang),
    reservationFee: formatBps(deployment.params.reservationFeeBps, lang),
    stockCount: deployment.stocks.length,
    min: formatMoney(MIN_CONTRIBUTION_USD, lang),
  };

  return (
    <>
      <section className="mx-auto grid w-full max-w-6xl gap-8 px-5 pt-8 md:px-8 md:pt-14 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:items-center lg:gap-14">
        <div className="animate-rise">
          <h1 className="type-display text-[2.625rem] leading-[1.04] text-balance text-ink sm:text-display lg:text-display-lg">
            {t.heroTitle}
          </h1>
          <p className="mt-5 max-w-md text-lead text-ink-2 text-pretty sm:text-h3 sm:leading-snug">{t.heroBody}</p>
          <ButtonLink href={casa} className="mt-8 w-full sm:w-auto sm:min-w-64">
            {t.heroCta}
          </ButtonLink>
        </div>
        <HeroHouse lang={lang} labels={t} sena={dict.common.sena} />
      </section>

      <section aria-labelledby="turn-heading" className="mx-auto mt-20 w-full max-w-6xl px-5 md:mt-28 md:px-8">
        <div className="max-w-3xl">
          <h2 id="turn-heading" className="type-display text-h1 text-balance text-ink md:text-display">
            {t.turnTitle}
          </h2>
          <p className="mt-5 max-w-xl text-lead text-ink-2 text-pretty">{t.turnBody}</p>
        </div>

        <h3 className="sr-only">{t.stepsTitle}</h3>
        <ol className="mt-12 grid gap-10 md:grid-cols-3 md:gap-8">
          {t.steps.map((step, index) => (
            <li key={step.title} className="border-t-2 border-ink pt-5">
              <span aria-hidden className="type-display block text-display leading-none text-mango">
                {index + 1}
              </span>
              <p className="type-heading mt-4 text-h3 text-ink">{step.title}</p>
              <p className="mt-2 max-w-sm text-ink-2 text-pretty">
                {fill(step.body, { min: formatMoney(MIN_CONTRIBUTION_USD, lang) })}
              </p>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="faq-heading" className="mx-auto mt-20 w-full max-w-6xl px-5 md:mt-28 md:px-8">
        <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] md:gap-10">
          <h2 id="faq-heading" className="type-display text-h1 text-balance text-ink md:text-display">
            {t.faqTitle}
          </h2>
          <div className="border-b border-line">
            {t.faq.map((item) => (
              <details key={item.q} className="group border-t border-line">
                <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-4 text-left [&::-webkit-details-marker]:hidden">
                  <span className="type-heading text-h3 text-ink">{item.q}</span>
                  <span aria-hidden className="relative size-5 shrink-0 text-accent transition-transform duration-200 group-open:rotate-45 motion-reduce:transition-none">
                    <span className="absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2 rounded-full bg-current" />
                    <span className="absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2 rounded-full bg-current" />
                  </span>
                </summary>
                <p className="max-w-2xl pb-6 text-ink-2 text-pretty">{fill(item.a, faqValues)}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Live counters from the contracts (/api/stats). Nothing renders until there is real usage. */}
      <div className="mt-16">
        <LiveStatsLive lang={lang} labels={{ statsTitle: t.statsTitle, stats: t.stats }} />
      </div>

      <section aria-labelledby="closing-heading" className="mx-auto mt-16 w-full max-w-6xl px-5 md:mt-24 md:px-8">
        <div className="flex flex-col items-start gap-6 md:flex-row md:items-end md:justify-between">
          <h2 id="closing-heading" className="type-display max-w-2xl text-h1 text-balance text-ink md:text-display">
            {t.closingTitle}
          </h2>
          <ButtonLink href={casa} className="w-full shrink-0 md:w-auto md:min-w-64">
            {t.closingCta}
          </ButtonLink>
        </div>
      </section>

      <SiteFooter lang={lang} footer={dict.footer} />
    </>
  );
}
