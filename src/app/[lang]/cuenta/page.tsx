import type { Metadata } from "next";

import { ConnectedProfileScreen } from "@/components/account/connected/profile";
import { getDictionary, getLocale } from "@/i18n/get-dictionary";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getDictionary()).profile.title };
}

/** `/cuenta`: the signed-in person's profile, balances, goal, account address and sign out. */
export default async function CuentaPage() {
  const lang = await getLocale();
  const dict = await getDictionary(lang);
  return (
    <ConnectedProfileScreen
      lang={lang}
      labels={{
        profile: dict.profile,
          reservation: dict.reservation,
        fund: dict.fund,
        signIn: dict.signIn,
        common: dict.common,
        account: dict.account,
        txErrors: dict.txErrors,
      }}
    />
  );
}
