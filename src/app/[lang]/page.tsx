import { HeroHouse } from "@/components/landing/hero-house";
import { LiveStats } from "@/components/landing/live-stats";
import { SiteFooter } from "@/components/layout/site-footer";
import { ButtonLink } from "@/components/ui/button";
import { getDictionary, getLocale } from "@/i18n/get-dictionary";

/**
 * Landing, "sell me this pen": the need first (years of saving, idle dollars), then the product
 * in three steps, then the same single action again.
 */
export default async function LandingPage() {
  const lang = await getLocale();
  const dict = await getDictionary(lang);
  const t = dict.landing;
  const casa = `/${lang}/casa`;

  return (
    <>
      <section className="mx-auto grid w-full max-w-6xl gap-8 px-5 pt-8 md:px-8 md:pt-14 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:items-center lg:gap-14">
        <div className="animate-rise">
          <h1 className="type-wide text-[2.625rem] leading-[0.95] text-balance text-ink sm:text-display lg:text-display-lg">
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
          <h2 id="turn-heading" className="type-wide text-h1 text-balance text-ink md:text-display">
            {t.turnTitle}
          </h2>
          <p className="mt-5 max-w-xl text-lead text-ink-2 text-pretty">{t.turnBody}</p>
        </div>

        <h3 className="sr-only">{t.stepsTitle}</h3>
        <ol className="mt-12 grid gap-10 md:grid-cols-3 md:gap-8">
          {t.steps.map((step, index) => (
            <li key={step.title} className="border-t-2 border-ink pt-5">
              <span aria-hidden className="type-wide block text-display leading-none text-mango">
                {index + 1}
              </span>
              <p className="type-semiwide mt-4 text-h3 text-ink">{step.title}</p>
              <p className="mt-2 max-w-sm text-ink-2 text-pretty">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="promise-heading" className="mx-auto mt-20 w-full max-w-6xl px-5 md:px-8">
        <div className="grid gap-4 rounded-[var(--radius-sheet)] bg-surface p-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] md:gap-10 md:p-10">
          <h2 id="promise-heading" className="type-semiwide text-h2 text-ink">
            {t.promiseTitle}
          </h2>
          <p className="text-lead text-ink-2 text-pretty">{t.promiseBody}</p>
        </div>
      </section>

      {/* INTEGRATION: pass live counters from /api/stats; null renders nothing. */}
      <div className="mt-16">
        <LiveStats stats={null} lang={lang} labels={t} />
      </div>

      <section aria-labelledby="closing-heading" className="mx-auto mt-16 w-full max-w-6xl px-5 md:mt-24 md:px-8">
        <div className="flex flex-col items-start gap-6 md:flex-row md:items-end md:justify-between">
          <h2 id="closing-heading" className="type-wide max-w-2xl text-h1 text-balance text-ink md:text-display">
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
