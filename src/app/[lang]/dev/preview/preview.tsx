"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useState, type ReactNode } from "react";

import { ContributeScreen, type ContributionDraft, type ContributionQuote } from "@/components/account/contribute-screen";
import { FundScreen } from "@/components/account/fund-screen";
import { GoalScreen } from "@/components/account/goal-screen";
import { ProfileScreen } from "@/components/account/profile-screen";
import { RequestLinkScreen } from "@/components/account/request-link-screen";
import { ReservationScreen, type ReservationView } from "@/components/account/reservation-screen";
import { ReserveScreen } from "@/components/account/reserve-screen";
import type { Goal, GoalDraft, SignInProps, StockOption } from "@/components/account/types";
import { VaquitaScreen } from "@/components/account/vaquita-screen";
import { HouseAvatar } from "@/components/brand/house-avatar";
import { LiveStats } from "@/components/landing/live-stats";
import { WaitBar } from "@/components/ui/wait-bar";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/es";
import type { InboxItem } from "@/lib/view-models";

/* ---------- Sample data (dev preview only) ---------- */

const PHOTO = "https://images.realtyserver.com/photo_server.php?btnSubmit=GetPhoto&board=puerto_rico&name=0000FE9A.L01";

const property = {
  ref: "smarlin:42fe7c1c-2145-4e30-9836-34cc3a4f5c42",
  title: "Casa en Venta - Cabo Rojo",
  location: "Cabo Rojo, Puerto Rico",
  imageUrl: PHOTO,
  priceUsd: 394_000,
};

const stocks: StockOption[] = [
  { id: "aapl", name: "Apple", ticker: "AAPL", iconUrl: null, priceUsd: 231.2, change12mPct: 14.2 },
  { id: "nvda", name: "Nvidia", ticker: "NVDA", iconUrl: null, priceUsd: 182.65, change12mPct: 38.9 },
  { id: "msft", name: "Microsoft", ticker: "MSFT", iconUrl: null, priceUsd: 512.1, change12mPct: -2.4 },
];

const draft: GoalDraft = { property, depositPct: 5, targetUsd: 19_700 };

function goal(savedUsd: number): Goal {
  return {
    property,
    depositPct: 5,
    targetUsd: 22_880,
    senaUsd: 19_700,
    savedUsd,
    shares: savedUsd / stocks[0].priceUsd,
    stock: stocks[0],
    houseChangePct: 2.1,
    stocksChangePct: 6.4,
  };
}

/** Sample accounts: each one draws a different house. */
const PROFILE_ADDRESSES = [
  "0x5a1e0c8b9e3f4d2a7c6b1e0f9d8c7b6a5e4d3c2b",
  "0x9f2c4e1a7b3d5c6e8f0a1b2c3d4e5f6a7b8c9d0e",
  "0x1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c",
  "0xae0f63d5bce6dce7f8593f2073f3eef5614a877a",
  "0x2d7e91c04ab3f65e8d1290c7b4ae3f6d5c8b7a90",
  "0xc3a8f1027e6d4b9a5f0e2d1c8b7a6f5e4d3c2b1a",
  "0x7f00d2e4c6a8b0f1e3d5c7a9b1d3f5e7c9a0b2d4",
  "0x04b9e6c3a1f8d7e2b5c0a9f4e3d6b1c8a7f2e5d0",
  "0x8e1d4c7b0a3f6e9d2c5b8a1f4e7d0c3b6a9f2e58",
  "0x61c3e5a7b9d1f3e5c7a9b1d3f5e7c9a1b3d5f7e9",
  "0xd4e6f8a0b2c4d6e8f0a2b4c6d8e0f2a4b6c8d0e2",
  "0x39a7c5e3f1b9d7a5c3e1f9b7d5a3c1e9f7b5d3a1",
];

function profile({
  goal: sampleGoal,
  address = PROFILE_ADDRESSES[0],
  signingOut = false,
  inbox = [],
}: {
  goal: Goal | null;
  address?: string;
  signingOut?: boolean;
  inbox?: InboxItem[];
}) {
  return {
    kind: "ready" as const,
    address,
    email: "vos@ejemplo.com",
    balances: { usd: 980.1, ars: 1_680_000 },
    inbox,
    goal: sampleGoal,
    activityUrl: "https://sepolia.basescan.org/address/" + address,
    onSignOut: noop,
    signingOut,
  };
}

const reservation: ReservationView = {
  id: "12",
  status: "active",
  property,
  senaUsd: 19_700,
  shares: 86.2,
  stock: stocks[0],
  valueUsd: 19_930,
  buyer: "0x5a1e0c8b9e3f4d2a7c6b1e0f9d8c7b6a5e4d3c2b",
  broker: { address: "0x9f2c4e1a7b3d5c6e8f0a1b2c3d4e5f6a7b8c9d0e", name: "Kelvin Garcia Vale", company: "Kelvin Garcia Realty" },
  arbiter: { address: "0x1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c", name: null },
  endsAt: 1_797_000_000,
  feePaidUsd: 197,
  claim: null,
  paidUsd: null,
};

const noop = () => undefined;

function signIn(overrides: Partial<SignInProps> = {}): SignInProps {
  return {
    step: "email",
    email: "sofi@email.com",
    status: "idle",
    error: null,
    onSubmitEmail: noop,
    onSubmitCode: noop,
    onResend: noop,
    onChangeEmail: noop,
    ...overrides,
  };
}

const VAQUITA_URL = "https://accasa.example/es/vaquita/0x5a1e0c8b9e3f4d2a7c6b1e0f9d8c7b6a5e4d3c2b";
const FUND_FROM_VAQUITA = "/es/cargar?vaquita=0x5a1e0c8b9e3f4d2a7c6b1e0f9d8c7b6a5e4d3c2b";

/* ---------- Interactive contribute samples ---------- */

type SampleFlags = { tx?: boolean; txError?: boolean };

/** The amount form's state with a made-up quote that answers like the planner does. */
function useSampleForm({ tx, txError }: SampleFlags) {
  const [quote, setQuote] = useState<ContributionQuote | "loading" | null>(null);
  const onDraftChange = useCallback((value: ContributionDraft | null) => {
    if (!value) return setQuote(null);
    setQuote("loading");
    window.setTimeout(() => {
      const usd = value.currency === "usd" ? value.amount : value.amount / 1_180;
      const fee = value.amount * 0.005;
      setQuote({ ...value, feeAmount: fee, sharePriceUsd: 231.2, sharesOut: (usd * 0.995) / 231.2, valueUsd: usd * 0.995 });
    }, 700);
  }, []);
  return {
    kind: "ready" as const,
    goal: goal(7_400),
    balances: { usd: 120, ars: 85_000 },
    currencies: ["usd" as const, "ars" as const],
    minUsd: 5,
    feeBps: 50,
    arsPerUsd: 1_180,
    quote,
    onDraftChange,
    onSubmit: noop,
    tx: tx ? { step: 1 } : null,
    txError: Boolean(txError),
  };
}

function ContributeSample({ lang, dict, ...flags }: { lang: Locale; dict: Dictionary } & SampleFlags) {
  return <ContributeScreen lang={lang} labels={dict} state={useSampleForm(flags)} />;
}

function VaquitaSample({ lang, dict, ...flags }: { lang: Locale; dict: Dictionary } & SampleFlags) {
  return <VaquitaScreen lang={lang} labels={dict} state={{ ...useSampleForm(flags), fundHref: FUND_FROM_VAQUITA }} />;
}

/* ---------- Catalogue ---------- */

type Entry = (lang: Locale, dict: Dictionary) => ReactNode;

const screens: Record<string, Entry> = {
  "goal.signed-out": (lang, dict) => <GoalScreen lang={lang} labels={dict} state={{ kind: "signed-out", signIn: signIn({ email: "" }), draft: null }} />,
  "goal.signed-out-draft": (lang, dict) => <GoalScreen lang={lang} labels={dict} state={{ kind: "signed-out", signIn: signIn({ email: "" }), draft }} />,
  "goal.sign-in-sending": (lang, dict) => <GoalScreen lang={lang} labels={dict} state={{ kind: "signed-out", signIn: signIn({ status: "sending" }), draft }} />,
  "goal.sign-in-code": (lang, dict) => <GoalScreen lang={lang} labels={dict} state={{ kind: "signed-out", signIn: signIn({ step: "code" }), draft }} />,
  "goal.sign-in-code-error": (lang, dict) => <GoalScreen lang={lang} labels={dict} state={{ kind: "signed-out", signIn: signIn({ step: "code", error: "invalid-code" }), draft }} />,
  "goal.loading": (lang, dict) => <GoalScreen lang={lang} labels={dict} state={{ kind: "loading" }} />,
  "goal.error": (lang, dict) => <GoalScreen lang={lang} labels={dict} state={{ kind: "error", onRetry: noop }} />,
  "goal.empty": (lang, dict) => <GoalScreen lang={lang} labels={dict} state={{ kind: "empty" }} />,
  "goal.setup": (lang, dict) => <GoalSetupSample lang={lang} dict={dict} />,
  "goal.setup-saving": (lang, dict) => (
    <GoalScreen lang={lang} labels={dict} state={{ kind: "setup", draft, stocks, selectedStockId: "aapl", onSelectStock: noop, onSave: noop, saving: { step: 1 }, saveError: false }} />
  ),
  "goal.setup-error": (lang, dict) => (
    <GoalScreen lang={lang} labels={dict} state={{ kind: "setup", draft, stocks, selectedStockId: "aapl", onSelectStock: noop, onSave: noop, saving: null, saveError: true }} />
  ),
  "goal.active": (lang, dict) => <GoalScreen lang={lang} labels={dict} state={{ kind: "active", goal: goal(7_400), shareUrl: VAQUITA_URL, justSaved: false }} />,
  "goal.active-new": (lang, dict) => (
    <GoalScreen lang={lang} labels={dict} state={{ kind: "active", goal: { ...goal(0), houseChangePct: null, stocksChangePct: null }, shareUrl: VAQUITA_URL, justSaved: true }} />
  ),
  "goal.reached": (lang, dict) => <GoalScreen lang={lang} labels={dict} state={{ kind: "active", goal: goal(19_930), shareUrl: VAQUITA_URL }} />,

  "contribute.signed-out": (lang, dict) => <ContributeScreen lang={lang} labels={dict} state={{ kind: "signed-out", signIn: signIn({ email: "" }) }} />,
  "contribute.loading": (lang, dict) => <ContributeScreen lang={lang} labels={dict} state={{ kind: "loading" }} />,
  "contribute.error": (lang, dict) => <ContributeScreen lang={lang} labels={dict} state={{ kind: "error", onRetry: noop }} />,
  "contribute.no-goal": (lang, dict) => <ContributeScreen lang={lang} labels={dict} state={{ kind: "no-goal" }} />,
  "contribute.empty-balance": (lang, dict) => (
    <ContributeScreen
      lang={lang}
      labels={dict}
      state={{ kind: "ready", goal: goal(7_400), balances: { usd: 0, ars: 0 }, currencies: ["usd", "ars"], minUsd: 5, feeBps: 50, arsPerUsd: 1_180, quote: null, onDraftChange: noop, onSubmit: noop, tx: null, txError: false }}
    />
  ),
  "contribute.ready": (lang, dict) => <ContributeSample lang={lang} dict={dict} />,
  "contribute.tx": (lang, dict) => <ContributeSample lang={lang} dict={dict} tx />,
  "contribute.tx-error": (lang, dict) => <ContributeSample lang={lang} dict={dict} txError />,
  "contribute.success": (lang, dict) => <ContributeScreen lang={lang} labels={dict} state={{ kind: "success", amount: 20, currency: "usd", goal: goal(7_420) }} />,

  "vaquita.loading": (lang, dict) => <VaquitaScreen lang={lang} labels={dict} state={{ kind: "loading", goal: null }} />,
  "vaquita.loading-account": (lang, dict) => <VaquitaScreen lang={lang} labels={dict} state={{ kind: "loading", goal: goal(7_400) }} />,
  "vaquita.error": (lang, dict) => <VaquitaScreen lang={lang} labels={dict} state={{ kind: "error", onRetry: noop }} />,
  "vaquita.no-goal": (lang, dict) => <VaquitaScreen lang={lang} labels={dict} state={{ kind: "no-goal" }} />,
  "vaquita.signed-out": (lang, dict) => (
    <VaquitaScreen lang={lang} labels={dict} state={{ kind: "signed-out", goal: goal(7_400), feeBps: 50, signIn: signIn({ email: "" }) }} />
  ),
  "vaquita.sign-in-code": (lang, dict) => (
    <VaquitaScreen lang={lang} labels={dict} state={{ kind: "signed-out", goal: goal(7_400), feeBps: 50, signIn: signIn({ step: "code" }) }} />
  ),
  "vaquita.empty-balance": (lang, dict) => (
    <VaquitaScreen
      lang={lang}
      labels={dict}
      state={{ kind: "ready", goal: goal(7_400), balances: { usd: 0, ars: 0 }, currencies: ["usd", "ars"], minUsd: 5, feeBps: 50, arsPerUsd: 1_180, quote: null, onDraftChange: noop, onSubmit: noop, tx: null, txError: false, fundHref: FUND_FROM_VAQUITA }}
    />
  ),
  "vaquita.ready": (lang, dict) => <VaquitaSample lang={lang} dict={dict} />,
  "vaquita.tx": (lang, dict) => <VaquitaSample lang={lang} dict={dict} tx />,
  "vaquita.tx-error": (lang, dict) => <VaquitaSample lang={lang} dict={dict} txError />,
  "vaquita.success": (lang, dict) => <VaquitaScreen lang={lang} labels={dict} state={{ kind: "success", amount: 20, currency: "usd", goal: goal(7_420) }} />,
  "vaquita.owner": (lang, dict) => <VaquitaScreen lang={lang} labels={dict} state={{ kind: "owner", goal: goal(7_400), shareUrl: VAQUITA_URL }} />,
  "vaquita.reached": (lang, dict) => <VaquitaScreen lang={lang} labels={dict} state={{ kind: "reached", goal: goal(22_880), isOwner: false }} />,
  "vaquita.reached-owner": (lang, dict) => <VaquitaScreen lang={lang} labels={dict} state={{ kind: "reached", goal: goal(22_880), isOwner: true }} />,

  "fund.signed-out": (lang, dict) => <FundScreen lang={lang} labels={dict} state={{ kind: "signed-out", signIn: signIn({ email: "" }) }} />,
  "fund.test": (lang, dict) => (
    <FundScreen lang={lang} labels={dict} state={{ kind: "ready", address: reservation.buyer, balances: { usd: 0, ars: 0 }, testMode: true, faucetAmountUsd: 100, onFaucet: noop, faucet: null, rampUrl: null }} />
  ),
  "fund.test-tx": (lang, dict) => (
    <FundScreen lang={lang} labels={dict} state={{ kind: "ready", address: reservation.buyer, balances: { usd: 0, ars: 0 }, testMode: true, faucetAmountUsd: 100, onFaucet: noop, faucet: { step: 0 }, rampUrl: null }} />
  ),
  "fund.test-success": (lang, dict) => (
    <FundScreen lang={lang} labels={dict} state={{ kind: "ready", address: reservation.buyer, balances: { usd: 100, ars: 0 }, testMode: true, faucetAmountUsd: 100, onFaucet: noop, faucet: "success", rampUrl: null }} />
  ),
  "fund.test-success-vaquita": (lang, dict) => (
    <FundScreen
      lang={lang}
      labels={dict}
      returnTo={{ href: VAQUITA_URL, label: dict.vaquita.backCta }}
      state={{ kind: "ready", address: reservation.buyer, balances: { usd: 100, ars: 0 }, testMode: true, faucetAmountUsd: 100, onFaucet: noop, faucet: "success", rampUrl: null }}
    />
  ),
  "fund.mainnet": (lang, dict) => (
    <FundScreen lang={lang} labels={dict} state={{ kind: "ready", address: reservation.buyer, balances: { usd: 12.5, ars: 30_000 }, testMode: false, faucetAmountUsd: 0, onFaucet: noop, faucet: null, rampUrl: "https://example.com" }} />
  ),

  "reserve.signed-out": (lang, dict) => <ReserveScreen lang={lang} labels={dict} state={{ kind: "signed-out", signIn: signIn({ email: "" }) }} />,
  "reserve.offer-own": (lang, dict) => <ReserveScreen lang={lang} labels={dict} state={{ kind: "offer-own" }} />,
  "reserve.stock-paused": (lang, dict) => (
    <ReserveScreen lang={lang} labels={dict} state={{ kind: "stock-unavailable", goal: goal(22_655), stock: "Apple", market: "paused" }} />
  ),
  "reserve.offer-no-goal": (lang, dict) => (
    <ReserveScreen
      lang={lang}
      labels={dict}
      state={{ kind: "offer-no-goal", offer: { brokerName: "Kelvin Garcia Vale", brokerCompany: "Kelvin Garcia Realty", depositPct: 1.5, verified: true }, setupHref: `/${lang}/meta?casa=smarlin%3A0fba73b0-92eb-48a5-8c96-2bb31dddd75d&sena=1.5` }}
    />
  ),
  "reserve.not-reached": (lang, dict) => <ReserveScreen lang={lang} labels={dict} state={{ kind: "not-reached", goal: goal(7_400) }} />,
  "reserve.no-link": (lang, dict) => (
    <ReserveScreen lang={lang} labels={dict} state={{ kind: "no-link", goal: goal(19_930), agent: { name: "Kelvin", phone: "1-787-546-1557" }, listingUrl: "https://www.smarlin.com" }} />
  ),
  "reserve.ready": (lang, dict) => (
    <ReserveScreen
      lang={lang}
      labels={dict}
      state={{ kind: "ready", goal: goal(19_930), offer: { brokerName: "Kelvin Garcia Vale", brokerCompany: "Kelvin Garcia Realty", depositPct: 5, verified: true }, senaUsd: 19_700, lock: { shares: 98, valueUsd: 22_655 }, feeBps: 100, feeUsd: 197, endsAt: 1_797_000_000, onReserve: noop, tx: null, txError: false }}
    />
  ),
  "reserve.tx": (lang, dict) => (
    <ReserveScreen
      lang={lang}
      labels={dict}
      state={{ kind: "ready", goal: goal(19_930), offer: { brokerName: "Kelvin Garcia Vale", brokerCompany: "Kelvin Garcia Realty", depositPct: 5, verified: true }, senaUsd: 19_700, lock: { shares: 98, valueUsd: 22_655 }, feeBps: 100, feeUsd: 197, endsAt: 1_797_000_000, onReserve: noop, tx: { step: 1 }, txError: false }}
    />
  ),
  "reserve.success": (lang, dict) => (
    <ReserveScreen lang={lang} labels={dict} state={{ kind: "success", goal: goal(19_930), reservationId: "12", reservationUrl: "https://accasa.example/es/r/12", endsAt: 1_797_000_000 }} />
  ),

  "reservation.loading": (lang, dict) => <ReservationScreen lang={lang} labels={dict} state={{ kind: "loading" }} />,
  "reservation.not-found": (lang, dict) => <ReservationScreen lang={lang} labels={dict} state={{ kind: "not-found" }} />,
  "reservation.broker": (lang, dict) => (
    <ReservationScreen lang={lang} labels={dict} state={{ kind: "ready", reservation, role: "beneficiary", actions: { onRelease: noop, onClaim: noop }, pending: null, actionError: false, shareUrl: "https://accasa.example/es/r/12" }} />
  ),
  "reservation.buyer": (lang, dict) => (
    <ReservationScreen lang={lang} labels={dict} state={{ kind: "ready", reservation, role: "depositor", actions: {}, pending: null, actionError: false, shareUrl: "https://accasa.example/es/r/12" }} />
  ),
  "reservation.claimed-buyer": (lang, dict) => (
    <ReservationScreen
      lang={lang}
      labels={dict}
      state={{ kind: "ready", reservation: { ...reservation, status: "claimed", claim: { amountUsd: 19_700, respondBy: 1_795_000_000 } }, role: "depositor", actions: { onAccept: noop, onDispute: noop }, pending: null, actionError: false, shareUrl: "https://accasa.example/es/r/12" }}
    />
  ),
  "reservation.disputed-arbiter": (lang, dict) => (
    <ReservationScreen
      lang={lang}
      labels={dict}
      state={{ kind: "ready", reservation: { ...reservation, status: "disputed", claim: { amountUsd: 19_700, respondBy: 1_795_000_000 } }, role: "arbiter", actions: { onResolve: noop }, pending: null, actionError: false, shareUrl: "https://accasa.example/es/r/12" }}
    />
  ),
  "reservation.payable": (lang, dict) => (
    <ReservationScreen
      lang={lang}
      labels={dict}
      state={{ kind: "ready", reservation: { ...reservation, status: "payable", claim: { amountUsd: 19_700, respondBy: 1_795_000_000 } }, role: "beneficiary", actions: { onSettle: noop }, pending: { action: "settle", step: 0 }, actionError: false, shareUrl: "https://accasa.example/es/r/12" }}
    />
  ),
  "reservation.payable-paused": (lang, dict) => (
    <ReservationScreen
      lang={lang}
      labels={dict}
      state={{ kind: "ready", reservation: { ...reservation, status: "payable", market: "paused", claim: { amountUsd: 19_700, respondBy: 1_795_000_000 } }, role: "beneficiary", actions: { onSettle: noop }, pending: null, actionError: false, shareUrl: "https://accasa.example/es/r/12" }}
    />
  ),
  "reservation.paid-viewer": (lang, dict) => (
    <ReservationScreen
      lang={lang}
      labels={dict}
      state={{ kind: "ready", reservation: { ...reservation, status: "paid", paidUsd: 19_700 }, role: "viewer", actions: {}, pending: null, actionError: false, shareUrl: "https://accasa.example/es/r/12" }}
    />
  ),

  "request.signed-out": (lang, dict) => (
    <RequestLinkScreen lang={lang} labels={dict} propertyRef={property.ref} sourceUrl={null} state={{ kind: "signed-out", signIn: signIn({ email: "" }) }} />
  ),
  "request.ready": (lang, dict) => (
    <RequestLinkScreen lang={lang} labels={dict} propertyRef={property.ref} sourceUrl={null} state={{ kind: "ready", createOffer: async () => ({ url: "https://accasa.vercel.app/es/o/k3J9xQ2aB7", verified: true }) }} />
  ),
  "request.no-property": (lang, dict) => (
    <RequestLinkScreen lang={lang} labels={dict} propertyRef={null} sourceUrl={null} state={{ kind: "ready", createOffer: async () => ({ url: "https://accasa.vercel.app/es/o/k3J9xQ2aB7", verified: true }) }} />
  ),

  "profile.signed-out": (lang, dict) => <ProfileScreen lang={lang} labels={dict} state={{ kind: "signed-out", signIn: signIn({ email: "" }) }} />,
  "profile.loading": (lang, dict) => <ProfileScreen lang={lang} labels={dict} state={{ kind: "loading" }} />,
  "profile.error": (lang, dict) => <ProfileScreen lang={lang} labels={dict} state={{ kind: "error", onRetry: noop }} />,
  "profile.ready": (lang, dict) => <ProfileScreen lang={lang} labels={dict} state={profile({ goal: goal(7_400) })} />,
  "profile.no-goal": (lang, dict) => <ProfileScreen lang={lang} labels={dict} state={profile({ goal: null, address: PROFILE_ADDRESSES[1] })} />,
  "profile.broker-inbox": (lang, dict) => (
    <ProfileScreen
      lang={lang}
      labels={dict}
      state={profile({
        goal: null,
        address: PROFILE_ADDRESSES[2],
        inbox: [
          { id: "12", status: "active", senaUsd: 4_250, endsAt: 1_799_600_000, isNew: true, payable: false },
          { id: "9", status: "payable", senaUsd: 1_275, endsAt: 1_797_000_000, isNew: false, payable: true },
          { id: "4", status: "released", senaUsd: 2_100, endsAt: 1_790_000_000, isNew: false, payable: false },
        ],
      })}
    />
  ),
  "profile.signing-out": (lang, dict) => <ProfileScreen lang={lang} labels={dict} state={profile({ goal: goal(7_400), signingOut: true })} />,
  "profile.houses": () => (
    <div className="mx-auto grid max-w-xl grid-cols-4 gap-4 p-5 sm:grid-cols-6">
      {PROFILE_ADDRESSES.map((address) => (
        <HouseAvatar key={address} seed={address} label={address} className="aspect-square w-full rounded-[1.5rem]" />
      ))}
    </div>
  ),

  "landing.stats": (lang, dict) => (
    <div className="py-10">
      <LiveStats lang={lang} labels={dict.landing} stats={{ activeGoals: 128, savedUsd: 41_250, reservations: 3 }} />
    </div>
  ),
  "ui.wait-bar": (_lang, dict) => (
    <div className="mx-auto max-w-xl p-5">
      <WaitBar steps={dict.reserve.steps} current={1} typicalSeconds={dict.reserve.stepsSeconds} labels={dict.common} />
    </div>
  ),
};

function GoalSetupSample({ lang, dict }: { lang: Locale; dict: Dictionary }) {
  const [selected, setSelected] = useState<string | null>(null);
  return (
    <GoalScreen
      lang={lang}
      labels={dict}
      state={{ kind: "setup", draft, stocks, selectedStockId: selected, onSelectStock: setSelected, onSave: noop, saving: null, saveError: false }}
    />
  );
}

export function Preview({ lang, dict }: { lang: Locale; dict: Dictionary }) {
  const params = useSearchParams();
  const key = params.get("s");
  const render = key ? screens[key] : undefined;
  if (render) return <>{render(lang, dict)}</>;

  return (
    <div className="mx-auto w-full max-w-xl px-5 py-8">
      <h1 className="type-display text-h1">Preview</h1>
      <ul className="mt-6 grid grid-cols-1 gap-1 sm:grid-cols-2">
        {Object.keys(screens).map((name) => (
          <li key={name}>
            <Link href={`/${lang}/dev/preview?s=${name}`} className="inline-flex min-h-11 items-center text-accent underline-offset-4 hover:underline">
              {name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
