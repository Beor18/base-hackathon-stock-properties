import type { Metadata } from "next";

import { ConnectedFundScreen } from "@/components/account/connected/fund";
import { getDictionary, getLocale } from "@/i18n/get-dictionary";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getDictionary()).fund.title };
}

/**
 * `/cargar`: the account address (QR + copy) and, on test networks, the test balance button
 * (`/api/plan/faucet`). On mainnet it links to an external service to buy digital dollars.
 */
export default async function CargarPage() {
  const lang = await getLocale();
  const dict = await getDictionary(lang);
  return (
    <ConnectedFundScreen
      lang={lang}
      labels={{
        fund: dict.fund,
        signIn: dict.signIn,
        common: dict.common,
        contribute: dict.contribute,
        account: dict.account,
        txErrors: dict.txErrors,
      }}
    />
  );
}
