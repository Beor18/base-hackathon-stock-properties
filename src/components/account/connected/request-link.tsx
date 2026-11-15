"use client";

import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/es";
import { api } from "@/lib/api";
import { useAccount } from "@/lib/wallet/context";

import { RequestLinkScreen, type RequestLinkScreenState } from "../request-link-screen";
import { offerHref } from "../routes";
import { AccountUnavailable, type AccountLabels } from "./shared";

type Labels = Pick<Dictionary, "request" | "signIn" | "common" | "detail"> & AccountLabels;

/** The broker only needs a session: the offer is saved on the server for their own account, no transaction is sent. */
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
      ? {
          kind: "ready",
          createOffer: async (input) => {
            const token = await session.identityToken();
            if (!token) throw new Error("No identity token");
            const offer = await api.createOffer({ ...input, broker: session.address }, token);
            return { url: offerHref(window.location.origin, lang, offer.id), verified: offer.verified };
          },
        }
      : session.status === "signed-out"
        ? { kind: "signed-out", signIn: session.signIn }
        : { kind: "loading" };

  return <RequestLinkScreen lang={lang} propertyRef={propertyRef} sourceUrl={sourceUrl} state={state} labels={labels} />;
}
