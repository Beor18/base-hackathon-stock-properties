import Link from "next/link";
import { Suspense } from "react";

import { Wordmark } from "@/components/brand/wordmark";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/es";

import { LangSwitch } from "./lang-switch";

type SiteHeaderProps = {
  lang: Locale;
  common: Dictionary["common"];
  testMode: boolean;
};

export function SiteHeader({ lang, common, testMode }: SiteHeaderProps) {
  const switchTo = lang === "es" ? "en" : "es";
  return (
    <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-5 pt-3 md:px-8">
      <Link href={`/${lang}`} className="-ml-1 inline-flex min-h-11 items-center rounded-lg px-1" aria-label={`${common.brand}, ${common.home}`}>
        <Wordmark title="" className="h-7 w-auto text-ink" />
      </Link>
      <div className="flex items-center gap-1">
        {testMode && (
          <span
            className="inline-flex items-center gap-1.5 rounded-full border border-mango/70 bg-mango-soft px-2.5 py-1 text-label font-semibold text-ink"
            title={common.testModeHint}
          >
            <span className="size-2 rounded-full bg-mango" aria-hidden />
            {common.testMode}
            <span className="sr-only">. {common.testModeHint}</span>
          </span>
        )}
        <Suspense
          fallback={
            <Link
              href={`/${switchTo}`}
              hrefLang={switchTo}
              className="inline-flex min-h-11 items-center rounded-full px-3 text-label font-semibold text-ink-2"
            >
              {common.switchTo}
            </Link>
          }
        >
          <LangSwitch current={lang} label={common.language} switchTo={common.switchTo} />
        </Suspense>
      </div>
    </header>
  );
}
