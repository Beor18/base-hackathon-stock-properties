import type { Metadata } from "next";
import { Suspense } from "react";

import { ConnectedFundScreen } from "@/components/account/connected/fund";
import { FundScreen } from "@/components/account/fund-screen";
import { getDictionary, getLocale } from "@/i18n/get-dictionary";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getDictionary()).fund.title };
}

/**
 * `/cargar`: the account address (QR + copy) and, on test networks, the test balance button
 * (`/api/plan/faucet`). On mainnet it links to an external service to buy digital dollars.
 * `?vaquita=<address>` (from a vaquita page) makes back and the next step return there.
 */
export default async function CargarPage() {
  const lang = await getLocale();
  const dict = await getDictionary(lang);
  const labels = { fund: dict.fund, signIn: dict.signIn, common: dict.common, contribute: dict.contribute };
  return (
    // The container reads the query string, which is only known at request time.
    <Suspense fallback={<FundScreen lang={lang} state={{ kind: "loading" }} labels={labels} />}>
      <ConnectedFundScreen
        lang={lang}
        labels={{ ...labels, vaquita: dict.vaquita, account: dict.account, txErrors: dict.txErrors }}
      />
    </Suspense>
  );
}
