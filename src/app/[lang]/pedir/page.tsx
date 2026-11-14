import type { Metadata } from "next";
import { Suspense } from "react";

import { UnwiredRequestLinkScreen } from "@/components/account/unwired";
import { getDictionary, getLocale } from "@/i18n/get-dictionary";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getDictionary()).request.title };
}

/**
 * `/pedir?casa=<ref>[&url=<sourceUrl>]`: the broker creates the reservation link (no transaction).
 *
 * INTEGRATION: render `<RequestLinkScreen lang propertyRef sourceUrl labels state />`
 * (account/request-link-screen.tsx). It reads the property by itself; it only needs the session:
 * `{ kind: "signed-out", signIn }` or `{ kind: "ready", brokerAddress }`.
 */
async function RequestLink({ searchParams }: Pick<PageProps<"/[lang]/pedir">, "searchParams">) {
  const [query, lang] = await Promise.all([searchParams, getLocale()]);
  const dict = await getDictionary(lang);
  const ref = typeof query.casa === "string" ? query.casa : null;
  const url = typeof query.url === "string" ? query.url : null;
  return (
    <UnwiredRequestLinkScreen
      lang={lang}
      propertyRef={ref}
      sourceUrl={url}
      labels={{ request: dict.request, signIn: dict.signIn, common: dict.common, detail: dict.detail }}
    />
  );
}

export default function PedirPage({ searchParams }: PageProps<"/[lang]/pedir">) {
  return (
    <Suspense>
      <RequestLink searchParams={searchParams} />
    </Suspense>
  );
}
