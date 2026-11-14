import { notFound } from "next/navigation";
import { Suspense } from "react";

import { getDictionary, getLocale } from "@/i18n/get-dictionary";

import { Preview } from "./preview";

/**
 * Development only: every account screen in every state, with sample props.
 * `/es/dev/preview` lists them; `?s=goal.active` renders one. Returns 404 in production.
 * Sample data lives only here, never in product code.
 */
export default async function PreviewPage() {
  if (process.env.NODE_ENV === "production") notFound();
  const lang = await getLocale();
  const dict = await getDictionary(lang);
  return (
    <Suspense>
      <Preview lang={lang} dict={dict} />
    </Suspense>
  );
}
