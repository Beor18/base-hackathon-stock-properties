import type { Metadata } from "next";
import { Suspense } from "react";

import { SiteFooter } from "@/components/layout/site-footer";
import { PropertySearch } from "@/components/property/property-search";
import { PropertyCardSkeleton } from "@/components/property/property-card";
import { getDictionary, getLocale } from "@/i18n/get-dictionary";

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary();
  return { title: dict.search.title, description: dict.search.body };
}

/** Step 1: pick the home. Smarlin listings with search, plus "paste a link" for any portal. */
export default async function CasaPage() {
  const lang = await getLocale();
  const dict = await getDictionary(lang);

  return (
    <>
      <div className="mx-auto w-full max-w-6xl px-5 md:px-8">
        <div className="mt-6 max-w-2xl md:mt-12">
          <h1 className="type-display text-h1 text-balance text-ink md:text-display">{dict.search.title}</h1>
          <p className="mt-3 text-lead text-ink-2">{dict.search.body}</p>
        </div>
        <div className="mt-6 md:mt-8">
          <Suspense
            fallback={
              <div className="grid gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 3 }, (_, index) => (
                  <PropertyCardSkeleton key={index} />
                ))}
              </div>
            }
          >
            <PropertySearch lang={lang} labels={{ search: dict.search, common: dict.common }} />
          </Suspense>
        </div>
      </div>
      <SiteFooter lang={lang} footer={dict.footer} />
    </>
  );
}
