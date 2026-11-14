import type { Locale } from "@/i18n/config";

import { clampPct } from "../property/deposit";

/**
 * URL contracts between screens. The detail screen hands a draft goal to `/meta` through the
 * query string; the broker's link hands a reservation offer to `/reservar`. Integration reads
 * them with the parsers below instead of re-implementing the format.
 */

export type GoalDraftParams = {
  /** Property reference, e.g. "smarlin:<uuid>". */
  ref: string;
  /** Deposit percentage chosen on the detail screen (1 to 10). */
  pct: number;
  /** Price typed by the person when the pasted listing had none. Never trusted for Smarlin listings. */
  manualPriceUsd: number | null;
  /** Original listing URL, only for pasted links. */
  sourceUrl: string | null;
};

export function goalDraftHref(lang: Locale, draft: GoalDraftParams): string {
  const params = new URLSearchParams({ casa: draft.ref, sena: String(draft.pct) });
  if (draft.manualPriceUsd !== null) params.set("precio", String(draft.manualPriceUsd));
  if (draft.sourceUrl) params.set("url", draft.sourceUrl);
  return `/${lang}/meta?${params}`;
}

type SearchParamsLike = { get(name: string): string | null };

export function parseGoalDraft(params: SearchParamsLike): GoalDraftParams | null {
  const ref = params.get("casa");
  if (!ref) return null;
  const price = Number(params.get("precio"));
  return {
    ref,
    pct: clampPct(Number(params.get("sena"))),
    manualPriceUsd: Number.isFinite(price) && price > 0 ? price : null,
    sourceUrl: params.get("url"),
  };
}

export type ReservationOfferParams = {
  ref: string;
  pct: number;
  /** Broker account address that will be the reservation's beneficiary. */
  broker: string;
  brokerName: string;
  brokerCompany: string | null;
};

/** Link the broker shares on WhatsApp. INTEGRATION: sign it server side if tampering matters. */
export function reservationOfferHref(origin: string, lang: Locale, offer: ReservationOfferParams): string {
  const params = new URLSearchParams({
    casa: offer.ref,
    sena: String(offer.pct),
    corredor: offer.broker,
    nombre: offer.brokerName,
  });
  if (offer.brokerCompany) params.set("inmobiliaria", offer.brokerCompany);
  return `${origin}/${lang}/reservar?${params}`;
}

export function parseReservationOffer(params: SearchParamsLike): ReservationOfferParams | null {
  const ref = params.get("casa");
  const broker = params.get("corredor");
  const brokerName = params.get("nombre");
  if (!ref || !broker || !brokerName) return null;
  return {
    ref,
    pct: clampPct(Number(params.get("sena"))),
    broker,
    brokerName,
    brokerCompany: params.get("inmobiliaria"),
  };
}

/** WhatsApp share link with a prefilled message (no phone number: the person picks the chat). */
export function whatsappHref(message: string, phone?: string | null): string {
  const digits = phone?.replace(/[^\d]/g, "");
  return `https://wa.me/${digits ?? ""}?text=${encodeURIComponent(message)}`;
}
