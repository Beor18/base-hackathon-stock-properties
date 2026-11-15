import Link from "next/link";
import { Suspense } from "react";

import { Wordmark } from "@/components/brand/wordmark";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/es";

import { HeaderAccount } from "./header-account";
import { LangSwitch } from "./lang-switch";

type SiteHeaderProps = {
  lang: Locale;
  common: Dictionary["common"];
};

export function SiteHeader({ lang, common }: SiteHeaderProps) {
  const switchTo = lang === "es" ? "en" : "es";
  return (
    <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-5 pt-3 md:px-8">
      <Link href={`/${lang}`} className="-ml-1 inline-flex min-h-11 items-center rounded-lg px-1" aria-label={`${common.brand}, ${common.home}`}>
        <Wordmark title="" className="h-7 w-auto text-ink" />
      </Link>
      <div className="flex items-center gap-1">
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
        <HeaderAccount lang={lang} label={common.account} />
      </div>
    </header>
  );
}
