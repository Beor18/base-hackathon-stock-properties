import type { Locale } from "@/i18n/config";

import { clampPct } from "../property/deposit";

/**
 * URL contracts between screens. The detail screen hands a draft goal to `/meta` through the
 * query string; the broker's short link hands an offer id to `/reservar`. Integration reads
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

/** The broker's short reservation link. The offer itself lives on the server (`/api/offers/:id`). */
export function offerHref(origin: string, lang: Locale, id: string): string {
  return `${origin}/${lang}/o/${id}`;
}

/** `/reservar?oferta=<id>`, where the short link lands. */
export function parseOfferId(params: SearchParamsLike): string | null {
  const id = params.get("oferta");
  return id && /^[A-Za-z0-9]{10}$/.test(id) ? id : null;
}

/**
 * A vaquita: the public page where anyone adds to `owner`'s goal. Pass `origin` for the absolute
 * link the owner shares.
 */
export function vaquitaHref(lang: Locale, owner: string, origin = ""): string {
  return `${origin}/${lang}/vaquita/${owner}`;
}

/** `/cargar`, remembering the vaquita the person came from so they can go back and add to it. */
export function fundHref(lang: Locale, vaquitaOwner?: string | null): string {
  return vaquitaOwner ? `/${lang}/cargar?${new URLSearchParams({ vaquita: vaquitaOwner })}` : `/${lang}/cargar`;
}

/** The vaquita owner `/cargar` should lead back to, when the link carries a well-formed one. */
export function parseFundReturn(params: SearchParamsLike): string | null {
  const owner = params.get("vaquita");
  return owner && /^0x[0-9a-fA-F]{40}$/.test(owner) ? owner : null;
}

/** WhatsApp share link with a prefilled message (no phone number: the person picks the chat). */
export function whatsappHref(message: string, phone?: string | null): string {
  const digits = phone?.replace(/[^\d]/g, "");
  return `https://wa.me/${digits ?? ""}?text=${encodeURIComponent(message)}`;
}
