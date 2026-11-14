"use client";

/**
 * Placeholders that render each account screen in its signed-out state until the integration
 * role wires sessions, balances and transactions. They hold no data and send nothing.
 *
 * INTEGRATION: replace each of these in its page with a container that builds the screen's
 * `state` from the session (email login), on-chain reads and the planners, e.g.
 * `<GoalScreen lang={lang} labels={labels} state={useGoalScreenState(draftParams)} />`.
 */
import { useState } from "react";

import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/es";

import { ContributeScreen } from "./contribute-screen";
import { FundScreen } from "./fund-screen";
import { GoalScreen } from "./goal-screen";
import { RequestLinkScreen } from "./request-link-screen";
import { ReservationScreen } from "./reservation-screen";
import { ReserveScreen } from "./reserve-screen";
import type { SignInProps } from "./types";

function useInertSignIn(): SignInProps {
  const [email, setEmail] = useState("");
  return {
    step: "email",
    email,
    status: "idle",
    error: null,
    onSubmitEmail: setEmail,
    onSubmitCode: () => undefined,
    onResend: () => undefined,
    onChangeEmail: () => setEmail(""),
  };
}

export function UnwiredGoalScreen(props: { lang: Locale; labels: Pick<Dictionary, "goal" | "signIn" | "common"> }) {
  const signIn = useInertSignIn();
  return <GoalScreen {...props} state={{ kind: "signed-out", signIn, draft: null }} />;
}

export function UnwiredContributeScreen(props: {
  lang: Locale;
  labels: Pick<Dictionary, "contribute" | "signIn" | "common" | "goal">;
}) {
  const signIn = useInertSignIn();
  return <ContributeScreen {...props} state={{ kind: "signed-out", signIn }} />;
}

export function UnwiredFundScreen(props: { lang: Locale; labels: Pick<Dictionary, "fund" | "signIn" | "common" | "contribute"> }) {
  const signIn = useInertSignIn();
  return <FundScreen {...props} state={{ kind: "signed-out", signIn }} />;
}

export function UnwiredReserveScreen(props: {
  lang: Locale;
  labels: Pick<Dictionary, "reserve" | "signIn" | "common" | "goal" | "contribute">;
}) {
  const signIn = useInertSignIn();
  return <ReserveScreen {...props} state={{ kind: "signed-out", signIn }} />;
}

export function UnwiredReservationScreen(props: { lang: Locale; labels: Pick<Dictionary, "reservation" | "reserve" | "common"> }) {
  return <ReservationScreen {...props} state={{ kind: "loading" }} />;
}

export function UnwiredRequestLinkScreen(props: {
  lang: Locale;
  propertyRef: string | null;
  sourceUrl: string | null;
  labels: Pick<Dictionary, "request" | "signIn" | "common" | "detail">;
}) {
  const signIn = useInertSignIn();
  return <RequestLinkScreen {...props} state={{ kind: "signed-out", signIn }} />;
}
