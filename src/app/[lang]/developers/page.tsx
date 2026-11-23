import type { Metadata } from "next";

import { DevelopersView } from "@/components/developers/developers-view";
import { SiteFooter } from "@/components/layout/site-footer";
import { getDevelopers, getDictionary, getLocale } from "@/i18n/get-dictionary";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getDevelopers()).title };
}

/** `/developers`: the reservation contracts for other apps. Static: everything comes from the deployment. */
export default async function DevelopersPage() {
  const lang = await getLocale();
  const [copy, dict] = await Promise.all([getDevelopers(lang), getDictionary(lang)]);
  return (
    <>
      <DevelopersView lang={lang} copy={copy} common={dict.common} />
      <SiteFooter lang={lang} footer={dict.footer} />
    </>
  );
}
