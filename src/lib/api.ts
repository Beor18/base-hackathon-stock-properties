import type { Address } from "viem";

import type {
  AccountSnapshot,
  ContributionPlanQuote,
  FaucetPlanQuote,
  GoalPlanQuote,
  Plan,
  InboxSeen,
  ProtocolStats,
  Reservation,
  ReservationDetail,
  ReservationOfferDto,
  ReservePlanQuote,
  Stock,
} from "@/domain/types";
import type { UsdArsRate } from "@/domain/rates";

/**
 * Browser calls to the app's API routes. Protocol data and transaction plans always come from the
 * server; the browser only signs (through the account) what a planner returned.
 */
export class ApiClientError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    /** Contract custom error name, when the server simulated the call and it reverted. */
    readonly contractError: string | null,
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

async function request<T>(input: string, init?: RequestInit): Promise<T> {
  const response = await fetch(input, { ...init, headers: { accept: "application/json", ...init?.headers } });
  if (!response.ok) {
    let code = "http_error";
    let message = response.statusText;
    let contractError: string | null = null;
    try {
      const body = (await response.json()) as { error?: { code?: string; message?: string; contractError?: string } };
      code = body.error?.code ?? code;
      message = body.error?.message ?? message;
      contractError = body.error?.contractError ?? null;
    } catch {
      // Non-JSON error body: keep the status text.
    }
    throw new ApiClientError(response.status, code, message, contractError);
  }
  return (await response.json()) as T;
}

function post<T>(input: string, body: unknown, headers: Record<string, string> = {}): Promise<T> {
  return request<T>(input, { method: "POST", headers: { "content-type": "application/json", ...headers }, body: JSON.stringify(body) });
}

/** Routes that act for the signed-in person send their Privy identity token. */
const signedIn = (identityToken: string) => ({ "privy-id-token": identityToken });

export const api = {
  stocks: () => request<Stock[]>("/api/stocks"),
  stats: () => request<ProtocolStats>("/api/stats"),
  rates: () => request<UsdArsRate>("/api/rates"),
  account: (address: Address) => request<AccountSnapshot>(`/api/account/${address}`),
  reservation: (id: string) => request<ReservationDetail>(`/api/reservations/${encodeURIComponent(id)}`),
  reservationsOf: (address: Address) => request<Reservation[]>(`/api/reservations?account=${address}`),
  offer: (id: string) => request<ReservationOfferDto>(`/api/offers/${encodeURIComponent(id)}`),
  createOffer: (
    body: { ref: string; url: string | null; pct: number; broker: Address; brokerName: string; brokerCompany: string | null },
    identityToken: string,
  ) => post<ReservationOfferDto>("/api/offers", body, signedIn(identityToken)),
  inboxSeen: (account: Address) => request<InboxSeen>(`/api/inbox?account=${account}`),
  markInboxSeen: (account: Address, identityToken: string) => post<InboxSeen>("/api/inbox", { account }, signedIn(identityToken)),
};

export type ReservationActionBody =
  | { action: "release" | "accept" | "dispute" | "settle"; id: string }
  | { action: "claim"; id: string; amountUsd: number; reason: "backed_out" | "other" }
  | { action: "resolve"; id: string; inFavorOf: "broker" | "buyer" };

export const plans = {
  goal: (body: {
    account: Address;
    ref: string;
    url: string | null;
    pct: number;
    manualPriceUsd: number | null;
    stock: Address;
  }) => post<Plan<GoalPlanQuote>>("/api/plan/goal", body),
  /** `beneficiary`: the account whose goal receives the stock when someone else pays (a vaquita). */
  contribute: (body: { account: Address; currency: "usd" | "ars"; amount: string; beneficiary?: Address }) =>
    post<Plan<ContributionPlanQuote>>("/api/plan/contribute", body),
  reserve: (body: { account: Address; ref: string; url: string | null; pct: number; broker: Address }) =>
    post<Plan<ReservePlanQuote>>("/api/plan/reserve", body),
  faucet: (body: { account: Address }) => post<Plan<FaucetPlanQuote>>("/api/plan/faucet", body),
  reservation: (body: ReservationActionBody & { account: Address }) =>
    post<Plan<{ action: string; tokensIn: string | null; minUsdcOut: string | null }>>("/api/plan/reservation", body),
};
