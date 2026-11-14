import type { Metadata } from "next";

import { Screen, StateMessage } from "@/components/layout/screen";
import { ExternalButton } from "@/components/ui/button";
import { getDictionary, getLocale } from "@/i18n/get-dictionary";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getDictionary()).unavailable.title };
}

/** Shown by the mainnet geo-block (the proxy rewrites blocked countries here). */
export default async function UnavailablePage() {
  const lang = await getLocale();
  const dict = await getDictionary(lang);
  const t = dict.unavailable;
  return (
    <Screen>
      <StateMessage
        icon={
          <svg viewBox="0 0 96 80" className="h-20 w-24" fill="none" aria-hidden>
            <path d="M14 38L48 12l34 26" stroke="var(--accent)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M24 72V44c0-9 7-16 16-16s16 7 16 16v28" stroke="var(--line-strong)" strokeWidth="5" strokeLinecap="round" />
            <path d="M30 50h20" stroke="var(--line-strong)" strokeWidth="5" strokeLinecap="round" />
          </svg>
        }
        title={t.title}
        body={t.body}
      >
        <ExternalButton href="https://www.smarlin.com" variant="secondary" className="w-full sm:w-auto">
          {t.cta}
        </ExternalButton>
      </StateMessage>
    </Screen>
  );
}
