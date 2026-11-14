import type { Metadata } from "next";

import { UnwiredFundScreen } from "@/components/account/unwired";
import { getDictionary, getLocale } from "@/i18n/get-dictionary";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getDictionary()).fund.title };
}

/**
 * `/cargar`: the account address (QR + copy) and, on test networks, the test balance button.
 *
 * INTEGRATION: render `<FundScreen lang labels state />` (account/fund-screen.tsx).
 * Data: session, account `address`, `Balances`, `testMode` (chain is not 8453),
 * `faucetAmountUsd` (MockUSDC faucet cap), `rampUrl` (external on-ramp, or null).
 * Callback: `onFaucet()` → MockUSDC faucet call, tracked with `faucet: { step }`, then
 * `"success"` or `"error"`.
 */
export default async function CargarPage() {
  const lang = await getLocale();
  const dict = await getDictionary(lang);
  return (
    <UnwiredFundScreen
      lang={lang}
      labels={{ fund: dict.fund, signIn: dict.signIn, common: dict.common, contribute: dict.contribute }}
    />
  );
}
