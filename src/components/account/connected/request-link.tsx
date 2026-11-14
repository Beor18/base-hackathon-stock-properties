"use client";

import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/es";
import { useAccount } from "@/lib/wallet/context";

import { RequestLinkScreen, type RequestLinkScreenState } from "../request-link-screen";
import { AccountUnavailable, type AccountLabels } from "./shared";

type Labels = Pick<Dictionary, "request" | "signIn" | "common" | "detail"> & AccountLabels;

/** The broker only needs a session: the link carries their account, no transaction is sent. */
export function ConnectedRequestLinkScreen({
  lang,
  propertyRef,
  sourceUrl,
  labels,
}: {
  lang: Locale;
  propertyRef: string | null;
  sourceUrl: string | null;
  labels: Labels;
}) {
  const session = useAccount();
  if (session.status === "unconfigured" || session.status === "failed") {
    return <AccountUnavailable lang={lang} labels={labels} reason={session.status} />;
  }

  const state: RequestLinkScreenState =
    session.status === "ready"
      ? { kind: "ready", brokerAddress: session.address }
      : session.status === "signed-out"
        ? { kind: "signed-out", signIn: session.signIn }
        : { kind: "loading" };

  return <RequestLinkScreen lang={lang} propertyRef={propertyRef} sourceUrl={sourceUrl} state={state} labels={labels} />;
}
