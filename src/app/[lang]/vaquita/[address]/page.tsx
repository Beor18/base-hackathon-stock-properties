import type { Metadata } from "next";
import { Suspense } from "react";

import { ConnectedVaquitaScreen } from "@/components/account/connected/vaquita";
import { VaquitaScreen } from "@/components/account/vaquita-screen";
import { getDictionary, getLocale } from "@/i18n/get-dictionary";

export async function generateMetadata(): Promise<Metadata> {
  const { vaquita } = await getDictionary();
  return { title: vaquita.title, description: vaquita.description };
}

/**
 * `/vaquita/[address]`: public page, shared on WhatsApp, where anyone adds to the goal of the
 * account in the link. It reads that goal from `/api/account/<address>` and plans the contribution
 * with `/api/plan/contribute` (`beneficiary` = the address), paid by whoever is signed in.
 */
export default async function VaquitaPage() {
  const lang = await getLocale();
  const dict = await getDictionary(lang);
  const labels = {
    vaquita: dict.vaquita,
    contribute: dict.contribute,
    signIn: dict.signIn,
    common: dict.common,
    goal: dict.goal,
  };
  return (
    // The address is only known at request time: until then the page already shows its wait.
    <Suspense fallback={<VaquitaScreen lang={lang} state={{ kind: "loading", goal: null }} labels={labels} />}>
      <ConnectedVaquitaScreen lang={lang} labels={{ ...labels, account: dict.account, txErrors: dict.txErrors }} />
    </Suspense>
  );
}
