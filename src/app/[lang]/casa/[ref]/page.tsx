import type { Metadata } from "next";
import { Suspense } from "react";

import { SiteFooter } from "@/components/layout/site-footer";
import { PropertyDetailView } from "@/components/property/property-detail-view";
import { getDictionary, getLocale } from "@/i18n/get-dictionary";

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary();
  return { title: dict.detail.calculator.title };
}

function decodeRef(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

async function Detail({ params, searchParams }: Pick<PageProps<"/[lang]/casa/[ref]">, "params" | "searchParams">) {
  const [{ ref }, query, lang] = await Promise.all([params, searchParams, getLocale()]);
  const dict = await getDictionary(lang);
  const url = typeof query.url === "string" ? query.url : null;
  return (
    <>
      <PropertyDetailView
        lang={lang}
        propertyRef={decodeRef(ref)}
        sourceUrl={url}
        labels={{ detail: dict.detail, common: dict.common }}
      />
      {/* The view docks "Esta es mi meta" to the bottom on phones; the footer leaves room for it. */}
      <SiteFooter lang={lang} footer={dict.footer} dockSpace />
    </>
  );
}

/** Property detail: gallery, Smarlin data, the seña calculator, "Esta es mi meta" and the footer. */
export default function CasaDetailPage({ params, searchParams }: PageProps<"/[lang]/casa/[ref]">) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto w-full max-w-6xl px-5 md:px-8">
          <div className="skeleton mt-3 aspect-[4/3] rounded-[var(--radius-photo)] lg:w-[calc(100%-26.5rem)] lg:aspect-[16/11]" />
        </div>
      }
    >
      <Detail params={params} searchParams={searchParams} />
    </Suspense>
  );
}
